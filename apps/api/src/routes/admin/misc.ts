import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import { registerAdminCrud } from "../../lib/crud";
import { hashPassword } from "../../lib/auth";
import { ok, okList, parseListQuery, prismaOrderBy } from "../../lib/helpers";
import { Fa, mapPrismaError } from "../../lib/errors";
import {
  allUsedUrls,
  buildMediaUsageIndex,
  isMediaUsageEntityType,
  normalizeMediaUrl,
  urlsForEntityType,
  type MediaUsage,
} from "../../lib/media-usage";
import { requireAdmin, requirePermission } from "../../plugins/auth";

function pick(body: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

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
  app.get("/admin/seo/by-target", { preHandler: [requireAdmin] }, async (request, reply) => {
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
    { preHandler: [requireAdmin] },
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
  app.get("/admin/media", { preHandler: [requireAdmin] }, async (request) => {
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
      const usages: MediaUsage[] = usageIndex.get(key) ?? [];
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
      await mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${file.filename.replace(/[^\w.\-]+/g, "_")}`;
      const dest = path.join(uploadsDir, safeName);
      await pipeline(file.file, createWriteStream(dest));
      const fields = file.fields as Record<string, { value?: string } | undefined>;
      const altFromField = fields?.alt?.value;
      const url = `/uploads/${safeName}`;
      const media = await app.prisma.media.create({
        data: {
          url,
          name: file.filename,
          alt: altFromField || file.filename,
          mimeType: file.mimetype,
          type: file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("video/")
              ? "video"
              : "file",
          size: undefined,
        },
      });
      return ok(media);
    }
  );

  app.get("/admin/media/:id", { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await app.prisma.media.findUnique({ where: { id } });
    if (!item) return reply.notFound(Fa.notFound);
    const usageIndex = await buildMediaUsageIndex(app.prisma);
    const key = normalizeMediaUrl(item.url) ?? item.url;
    return ok({ ...item, usages: usageIndex.get(key) ?? [] });
  });

  app.put(
    "/admin/media/:id",
    { preHandler: [requirePermission("media", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data = pick(body, ["url", "type", "name", "alt", "mimeType", "size"]);
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
      try {
        await app.prisma.media.delete({ where: { id } });
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
    mapCreate: (b) => ({
      title: b.title,
      permissions: b.permissions ?? [],
    }),
    mapUpdate: (b) => pick(b, ["title", "permissions"]),
  });

  app.get("/admin/users", { preHandler: [requireAdmin] }, async (request) => {
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
      users.map((u) => ({
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
      })),
      total,
      q.page,
      q.limit
    );
  });

  app.post(
    "/admin/users/:id/assign-role",
    { preHandler: [requirePermission("user", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { roleId } = (request.body ?? {}) as { roleId?: string };
      if (!roleId) return reply.badRequest(Fa.roleIdRequired);
      const user = await app.prisma.user.findUnique({ where: { id } });
      if (!user) return reply.notFound(Fa.userNotFound);
      if (user.roleId) {
        return reply.badRequest(Fa.userAlreadyHasRole);
      }
      const updated = await app.prisma.user.update({
        where: { id },
        data: { roleId },
        include: { role: true },
      });
      return ok(updated);
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

  app.get("/admin/site-settings", { preHandler: [requireAdmin] }, async () => {
    const settings = await app.prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    return ok(
      settings ?? {
        id: "default",
        logoUrl: "/logo.png",
        faviconUrl: "/favicon.ico",
        footerText:
          "با کودهای ارگانیک آگروهوم، بدون بوی بد و مواد شیمیایی، گیاهانت را زنده نگه دار.",
        socialLinks: [
          { label: "اینستاگرام", href: "https://www.instagram.com/agrohome" },
          { label: "تلگرام", href: "https://t.me/agrohome" },
        ],
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
      }
    );
  });

  app.put(
    "/admin/site-settings",
    { preHandler: [requireAdmin] },
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
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        footerLinkGroups: Array.isArray(body.footerLinkGroups)
          ? body.footerLinkGroups
          : [],
      };
      const updated = await app.prisma.siteSettings.upsert({
        where: { id: "default" },
        create: { id: "default", ...data },
        update: data,
      });
      return ok(updated);
    }
  );
}
