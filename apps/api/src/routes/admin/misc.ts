import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerAdminCrud } from "../../lib/crud";
import { hashPassword } from "../../lib/auth";
import { ok, okList, parseListQuery, prismaOrderBy, isIranMobile } from "../../lib/helpers";
import { Fa, mapPrismaError } from "../../lib/errors";
import {
  assertCanAssignRole,
  assertCanMutateRolePermissions,
} from "../../lib/rbac-guards";
import {
  assertSafeMediaUrl,
  UploadValidationError,
  validateUploadedFileBuffer,
} from "../../lib/upload-validation";
import {
  sanitizeFooterLinkGroups,
  sanitizeHeaderLinks,
  sanitizeSocialLinks,
} from "../../lib/site-settings";
import {
  allUsedUrls,
  buildMediaUsageIndex,
  compactMediaUsages,
  invalidateMediaUsageIndex,
  isMediaUsageEntityType,
  normalizeMediaUrl,
  urlsForEntityType,
  type MediaUsage,
} from "../../lib/media-usage";
import { requireAdmin, requirePermission } from "../../plugins/auth";
import {
  notifyCatalogLayoutRevalidate,
  revalidateCmsPageIds,
} from "../../lib/cms-revalidate";

function pick(body: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

type UserWithRole = {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  media: unknown;
  roleId: string | null;
  role: { id: string; title: string } | null;
  passwordHash: string | null;
  createdAt: Date;
};

function sanitizeUser(u: UserWithRole) {
  return {
    id: u.id,
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    nickname: u.nickname,
    media: u.media,
    roleId: u.roleId,
    role: u.role,
    hasPassword: Boolean(u.passwordHash),
    createdAt: u.createdAt,
  };
}

async function countAdmins(app: FastifyInstance) {
  return app.prisma.user.count({ where: { roleId: { not: null } } });
}

async function guardRolePermissions(
  request: FastifyRequest,
  body: Record<string, unknown>,
  reply: FastifyReply
): Promise<boolean> {
  const permissions = body.permissions ?? [];
  const check = assertCanMutateRolePermissions(
    request.user?.role?.permissions,
    permissions
  );
  if (!check.ok) {
    reply.forbidden(check.message);
    return false;
  }
  return true;
}

function parseUserBody(body: Record<string, unknown>) {
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const firstName =
    body.firstName === null || body.firstName === undefined
      ? body.firstName
      : String(body.firstName);
  const lastName =
    body.lastName === null || body.lastName === undefined
      ? body.lastName
      : String(body.lastName);
  const nickname =
    body.nickname === null || body.nickname === undefined
      ? body.nickname
      : String(body.nickname);
  const roleId =
    body.roleId === null || body.roleId === undefined || body.roleId === ""
      ? null
      : String(body.roleId);
  const password = typeof body.password === "string" ? body.password : undefined;
  return { phone, firstName, lastName, nickname, roleId, password };
}

const DEFAULT_HEADER_LINKS = [
  { title: "صفحه اصلی", href: "/" },
  { title: "محصولات", href: "/products" },
  { title: "وبلاگ", href: "/blogs" },
  { title: "درباره ما", href: "/about" },
  { title: "تماس با ما", href: "/contact" },
];

const DEFAULT_SITE_SETTINGS = {
  id: "default",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  footerText:
    "با کودهای ارگانیک آگروهوم، بدون بوی بد و مواد شیمیایی، گیاهانت را زنده نگه دار.",
  socialLinks: [
    { label: "اینستاگرام", href: "https://www.instagram.com/agrohome" },
    { label: "تلگرام", href: "https://t.me/agrohome" },
  ],
  headerLinks: DEFAULT_HEADER_LINKS,
  footerLinkGroups: [
    {
      title: "دسترسی سریع",
      links: [
        { title: "صفحه اصلی", href: "/" },
        { title: "کودهای خانگی", href: "/products" },
        { title: "وبلاگ", href: "/blogs" },
        { title: "درباره ما", href: "/about" },
        { title: "تماس با ما", href: "/contact" },
      ],
    },
    {
      title: "فروشگاه",
      links: [
        { title: "همه محصولات", href: "/products" },
        { title: "مقالات و راهنما", href: "/blogs" },
        { title: "تماس با پشتیبانی", href: "/contact" },
      ],
    },
  ],
};

export async function adminMiscRoutes(app: FastifyInstance, uploadsDir: string) {
  // Lightweight dashboard counters — register early (no CRUD path conflict)
  app.get("/admin/stats", { preHandler: [requireAdmin] }, async () => {
    const [
      products,
      blogs,
      commentsPending,
      contactsNew,
      pages,
      media,
      users,
      categories,
    ] = await Promise.all([
      app.prisma.product.count(),
      app.prisma.blog.count(),
      app.prisma.comment.count({ where: { publish: false } }),
      app.prisma.contactMessage.count({ where: { status: "new" } }),
      app.prisma.cmsPage.count(),
      app.prisma.media.count(),
      app.prisma.user.count(),
      app.prisma.productCategory.count(),
    ]);
    return ok({
      products,
      blogs,
      commentsPending,
      contactsNew,
      pages,
      media,
      users,
      categories,
    });
  });

  function normalizeSeoKeywords(value: unknown): string[] | undefined {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
      return value.map(String).map((s) => s.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function mapSeoBody(b: Record<string, unknown>) {
    const data = pick(b, [
      "targetPath",
      "targetType",
      "targetLegacyId",
      "metaTitle",
      "metaDescription",
      "canonicalUrl",
      "pageId",
    ]);
    const keywords = normalizeSeoKeywords(b.metaKeyWords);
    if (keywords !== undefined) data.metaKeyWords = keywords;
    if (data.pageId === "") data.pageId = null;
    if (data.targetPath === "") data.targetPath = null;
    if (data.canonicalUrl === "") data.canonicalUrl = null;
    return data;
  }

  // قبل از CRUD تا با /:id تداخل نداشته باشد
  app.get("/admin/seo/by-target", { preHandler: [requirePermission("seo", "read")] }, async (request, reply) => {
    const q = request.query as {
      targetType?: string;
      targetId?: string;
      pageId?: string;
    };
    if (q.pageId) {
      const seo = await app.prisma.seo.findUnique({ where: { pageId: q.pageId } });
      return ok(seo);
    }
    if (!q.targetType || !q.targetId) {
      return reply.badRequest(Fa.badRequest);
    }
    const seo = await app.prisma.seo.findFirst({
      where: { targetType: q.targetType, targetLegacyId: q.targetId },
    });
    return ok(seo);
  });

  app.put(
    "/admin/seo/upsert",
    { preHandler: [requirePermission("seo", "update")] },
    async (request, reply) => {
      try {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const targetType = typeof body.targetType === "string" ? body.targetType : null;
        const targetId = typeof body.targetId === "string" ? body.targetId : null;
        const pageId =
          typeof body.pageId === "string" && body.pageId ? body.pageId : null;

        if (!pageId && (!targetType || !targetId)) {
          return reply.badRequest(Fa.badRequest);
        }

        const data = mapSeoBody({
          ...body,
          targetType: targetType ?? body.targetType,
          targetLegacyId: targetId ?? body.targetLegacyId,
          pageId,
        });

        let existing = pageId
          ? await app.prisma.seo.findUnique({ where: { pageId } })
          : await app.prisma.seo.findFirst({
              where: {
                targetType: targetType!,
                targetLegacyId: targetId!,
              },
            });

        if (existing) {
          const updated = await app.prisma.seo.update({
            where: { id: existing.id },
            data,
          });
          await revalidateCmsPageIds(app, [pageId ?? existing.pageId]);
          return ok(updated);
        }

        const created = await app.prisma.seo.create({
          data: {
            ...data,
            targetType: (data.targetType as string | null) ?? targetType,
            targetLegacyId: (data.targetLegacyId as string | null) ?? targetId,
            pageId,
          },
        });
        await revalidateCmsPageIds(app, [pageId ?? created.pageId]);
        return ok(created);
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            message: mapped.message,
          });
        }
        throw err;
      }
    }
  );

  registerAdminCrud(app, "seo", "seo", {
    entity: "seo",
    searchFields: ["metaTitle", "targetPath"],
    mapCreate: (b) => mapSeoBody(b),
    mapUpdate: (b) => mapSeoBody(b),
  });

  // لیست سفارشی با فیلتر usedBy و غنی‌سازی usages
  app.get("/admin/media", { preHandler: [requirePermission("media", "read")] }, async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const filters = { ...q.filters };
    const usedByRaw = filters.usedBy;
    delete filters.usedBy;

    const usageIndex = await buildMediaUsageIndex(app.prisma);
    const where: Record<string, unknown> = { ...filters };

    if (usedByRaw === "unused") {
      const used = allUsedUrls(usageIndex);
      if (used.length) where.url = { notIn: used };
    } else if (isMediaUsageEntityType(usedByRaw)) {
      const urls = urlsForEntityType(usageIndex, usedByRaw);
      where.url = { in: urls.length ? urls : ["__none__"] };
    }

    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: "insensitive" } },
        { url: { contains: q.search, mode: "insensitive" } },
        { alt: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const total = await app.prisma.media.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }

    const rows = await app.prisma.media.findMany({
      where,
      orderBy: prismaOrderBy(q.sort),
      skip: q.skip,
      take: q.limit,
    });

    const content = rows.map((row) => {
      const key = normalizeMediaUrl(row.url) ?? row.url;
      const usages: MediaUsage[] = compactMediaUsages(usageIndex.get(key) ?? []);
      return { ...row, usages };
    });

    return okList(content, total, q.page, q.limit);
  });

  app.post(
    "/admin/media",
    { preHandler: [requirePermission("media", "create")] },
    async (request, reply) => {
      try {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const data = pick(body, ["url", "type", "name", "alt", "mimeType", "size"]);
        if (typeof data.url !== "string" || !data.url) {
          return reply.badRequest(Fa.badRequest);
        }
        try {
          assertSafeMediaUrl(data.url);
        } catch (err) {
          const message =
            err instanceof UploadValidationError ? err.message : Fa.badRequest;
          return reply.badRequest(message);
        }
        const item = await app.prisma.media.create({
          data: data as {
            url: string;
            type?: string;
            name?: string;
            alt?: string;
            mimeType?: string;
            size?: number;
          },
        });
        invalidateMediaUsageIndex();
        return ok(item);
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 409 ? "Conflict" : "Bad Request",
            message: mapped.message,
          });
        }
        throw err;
      }
    }
  );

  // قبل از /:id تا با id تداخل نداشته باشد
  app.post(
    "/admin/media/upload",
    { preHandler: [requirePermission("media", "create")] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) return reply.badRequest(Fa.fileRequired);
      try {
        const buffer = await file.toBuffer();
        const { mime, ext } = await validateUploadedFileBuffer(
          buffer,
          file.filename
        );
        await mkdir(uploadsDir, { recursive: true });
        const baseName = path.basename(file.filename).replace(/[^\w.\-]+/g, "_");
        const safeName = `${Date.now()}-${baseName.replace(/\.[^.]+$/, "")}${ext}`;
        const dest = path.join(uploadsDir, safeName);
        await writeFile(dest, buffer);
        const fields = file.fields as Record<string, { value?: string } | undefined>;
        const altFromField = fields?.alt?.value;
        const url = `/uploads/${safeName}`;
        const media = await app.prisma.media.create({
          data: {
            url,
            name: file.filename,
            alt: altFromField || file.filename,
            mimeType: mime,
            type: mime.startsWith("image/")
              ? "image"
              : mime.startsWith("video/")
                ? "video"
                : "file",
            size: buffer.length,
          },
        });
        invalidateMediaUsageIndex();
        return ok(media);
      } catch (err) {
        if (err instanceof UploadValidationError) {
          return reply.badRequest(err.message);
        }
        throw err;
      }
    }
  );

  app.get("/admin/media/:id", { preHandler: [requirePermission("media", "read")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await app.prisma.media.findUnique({ where: { id } });
    if (!item) return reply.notFound(Fa.notFound);
    const usageIndex = await buildMediaUsageIndex(app.prisma);
    const key = normalizeMediaUrl(item.url) ?? item.url;
    return ok({ ...item, usages: compactMediaUsages(usageIndex.get(key) ?? []) });
  });

  app.put(
    "/admin/media/:id",
    { preHandler: [requirePermission("media", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data = pick(body, ["url", "type", "name", "alt", "mimeType", "size"]);
      if (typeof data.url === "string" && data.url) {
        try {
          assertSafeMediaUrl(data.url);
        } catch (err) {
          const message =
            err instanceof UploadValidationError ? err.message : Fa.badRequest;
          return reply.badRequest(message);
        }
      }
      try {
        const item = await app.prisma.media.update({
          where: { id },
          data: data as {
            url?: string;
            type?: string;
            name?: string;
            alt?: string;
            mimeType?: string;
            size?: number;
          },
        });
        invalidateMediaUsageIndex();
        return ok(item);
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 404 ? "Not Found" : "Bad Request",
            message: mapped.message,
          });
        }
        return reply.notFound(Fa.recordNotFound);
      }
    }
  );

  app.delete(
    "/admin/media/:id",
    { preHandler: [requirePermission("media", "delete")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const item = await app.prisma.media.findUnique({ where: { id } });
      if (!item) return reply.notFound(Fa.notFound);

      const usageIndex = await buildMediaUsageIndex(app.prisma, { fresh: true });
      const key = normalizeMediaUrl(item.url) ?? item.url;
      const usages = compactMediaUsages(usageIndex.get(key) ?? []);
      if (usages.length) {
        return reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message: Fa.mediaInUse,
          usages,
        });
      }

      try {
        await app.prisma.media.delete({ where: { id } });
        invalidateMediaUsageIndex();
        if (item.url.startsWith("/uploads/")) {
          const filePath = path.join(uploadsDir, path.basename(item.url));
          await unlink(filePath).catch(() => undefined);
        }
        return ok({ id });
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: "Bad Request",
            message: mapped.message,
          });
        }
        return reply.notFound(Fa.recordNotFound);
      }
    }
  );

  registerAdminCrud(app, "roles", "role", {
    entity: "role",
    searchFields: ["title"],
    beforeCreate: guardRolePermissions,
    beforeUpdate: guardRolePermissions,
    mapCreate: (b) => ({
      title: b.title,
      permissions: b.permissions ?? [],
    }),
    mapUpdate: (b) => pick(b, ["title", "permissions"]),
  });

  app.get("/admin/users", { preHandler: [requirePermission("user", "read")] }, async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const where: Record<string, unknown> = { ...q.filters };
    if (q.search) {
      where.OR = [
        { phone: { contains: q.search } },
        { firstName: { contains: q.search, mode: "insensitive" } },
        { lastName: { contains: q.search, mode: "insensitive" } },
      ];
    }
    const total = await app.prisma.user.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const users = await app.prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: prismaOrderBy(q.sort),
      skip: q.skip,
      take: q.limit,
    });
    return okList(
      users.map((u) => sanitizeUser(u as UserWithRole)),
      total,
      q.page,
      q.limit
    );
  });

  app.get("/admin/users/:id", { preHandler: [requirePermission("user", "read")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await app.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) return reply.notFound(Fa.userNotFound);
    return ok(sanitizeUser(user as UserWithRole));
  });

  app.post(
    "/admin/users",
    { preHandler: [requirePermission("user", "create")] },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const { phone, firstName, lastName, nickname, roleId, password } = parseUserBody(body);
      if (!phone) return reply.badRequest(Fa.phoneRequired);
      if (!isIranMobile(phone)) return reply.badRequest(Fa.invalidPhone);
      if (!password || password.length < 6) {
        return reply.badRequest(Fa.passwordMinLength);
      }
      if (roleId) {
        const role = await app.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) return reply.badRequest(Fa.foreignKey);
        const assignCheck = assertCanAssignRole(request.user?.role?.permissions);
        if (!assignCheck.ok) return reply.forbidden(assignCheck.message);
      }
      try {
        const passwordHash = await hashPassword(password);
        const user = await app.prisma.user.create({
          data: {
            phone,
            firstName: (firstName as string | null | undefined) ?? null,
            lastName: (lastName as string | null | undefined) ?? null,
            nickname: (nickname as string | null | undefined) ?? null,
            roleId,
            passwordHash,
          },
          include: { role: true },
        });
        return ok(sanitizeUser(user as UserWithRole));
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 409 ? "Conflict" : "Bad Request",
            message: mapped.message,
          });
        }
        app.log.error(err);
        return reply.internalServerError(Fa.createFailed);
      }
    }
  );

  app.put(
    "/admin/users/:id",
    { preHandler: [requirePermission("user", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const existing = await app.prisma.user.findUnique({ where: { id } });
      if (!existing) return reply.notFound(Fa.userNotFound);

      const { phone, firstName, lastName, nickname, roleId, password } = parseUserBody(body);
      const data: Record<string, unknown> = {};

      if (phone !== undefined) {
        if (!phone) return reply.badRequest(Fa.phoneRequired);
        if (!isIranMobile(phone)) return reply.badRequest(Fa.invalidPhone);
        data.phone = phone;
      }
      if (firstName !== undefined) data.firstName = (firstName as string | null) ?? null;
      if (lastName !== undefined) data.lastName = (lastName as string | null) ?? null;
      if (nickname !== undefined) data.nickname = (nickname as string | null) ?? null;
      if (roleId !== undefined) {
        const assignCheck = assertCanAssignRole(request.user?.role?.permissions);
        if (!assignCheck.ok) return reply.forbidden(assignCheck.message);
        if (roleId) {
          const role = await app.prisma.role.findUnique({ where: { id: roleId } });
          if (!role) return reply.badRequest(Fa.foreignKey);
        }
        if (existing.roleId && !roleId) {
          const adminCount = await countAdmins(app);
          if (adminCount <= 1) {
            return reply.badRequest(Fa.lastAdminCannotDelete);
          }
        }
        data.roleId = roleId;
      }
      if (password) {
        if (password.length < 6) return reply.badRequest(Fa.passwordMinLength);
        data.passwordHash = await hashPassword(password);
      }

      try {
        const user = await app.prisma.user.update({
          where: { id },
          data,
          include: { role: true },
        });
        return ok(sanitizeUser(user as UserWithRole));
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 409 ? "Conflict" : "Bad Request",
            message: mapped.message,
          });
        }
        return reply.notFound(Fa.recordNotFound);
      }
    }
  );

  app.delete(
    "/admin/users/:id",
    { preHandler: [requirePermission("user", "delete")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await app.prisma.user.findUnique({ where: { id } });
      if (!user) return reply.notFound(Fa.userNotFound);

      try {
        await app.prisma.$transaction(async (tx) => {
          if (user.roleId) {
            const adminCount = await tx.user.count({
              where: { roleId: { not: null } },
            });
            if (adminCount <= 1) {
              throw new Error("LAST_ADMIN");
            }
          }
          await tx.blog.updateMany({
            where: { authorId: id },
            data: { authorId: null },
          });
          await tx.user.delete({ where: { id } });
        });
      } catch (err) {
        if (err instanceof Error && err.message === "LAST_ADMIN") {
          return reply.badRequest(Fa.lastAdminCannotDelete);
        }
        throw err;
      }
      return ok({ id });
    }
  );

  app.post(
    "/admin/users/:id/set-password",
    { preHandler: [requirePermission("user", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { password } = (request.body ?? {}) as { password?: string };
      if (!password || password.length < 6) {
        return reply.badRequest(Fa.passwordMinLength);
      }
      const passwordHash = await hashPassword(password);
      const updated = await app.prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
      return ok({ id: updated.id, hasPassword: true });
    }
  );

  registerAdminCrud(app, "contact-messages", "contactMessage", {
    entity: "contact",
    searchFields: ["fullName", "email", "phone", "subject", "message"],
    mapCreate: (b) =>
      pick(b, ["fullName", "subject", "email", "phone", "message", "status"]),
    mapUpdate: (b) =>
      pick(b, ["fullName", "subject", "email", "phone", "message", "status"]),
  });

  app.get("/admin/site-settings", { preHandler: [requirePermission("site_settings", "read")] }, async () => {
    const settings = await app.prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    return ok(settings ?? DEFAULT_SITE_SETTINGS);
  });

  app.put(
    "/admin/site-settings",
    { preHandler: [requirePermission("site_settings", "update")] },
    async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data = {
        logoUrl:
          typeof body.logoUrl === "string" && body.logoUrl.trim()
            ? body.logoUrl.trim()
            : null,
        faviconUrl:
          typeof body.faviconUrl === "string" && body.faviconUrl.trim()
            ? body.faviconUrl.trim()
            : null,
        footerText:
          typeof body.footerText === "string" ? body.footerText : null,
        socialLinks: sanitizeSocialLinks(body.socialLinks),
        headerLinks: sanitizeHeaderLinks(body.headerLinks),
        footerLinkGroups: sanitizeFooterLinkGroups(body.footerLinkGroups),
      };
      const updated = await app.prisma.siteSettings.upsert({
        where: { id: "default" },
        create: { id: "default", ...data },
        update: data,
      });
      void notifyCatalogLayoutRevalidate({
        warn: (obj, msg) => app.log.warn(obj as object, msg),
      });
      return ok(updated);
    }
  );
}
