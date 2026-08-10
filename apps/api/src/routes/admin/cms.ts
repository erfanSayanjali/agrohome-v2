import type { FastifyInstance } from "fastify";
import { registerAdminCrud } from "../../lib/crud";
import { ok } from "../../lib/helpers";
import { Fa } from "../../lib/errors";
import { requireAdmin, requirePermission } from "../../plugins/auth";

function pick(body: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

async function buildPageSnapshot(app: FastifyInstance, pageId: string) {
  const blocks = await app.prisma.contentBlock.findMany({
    where: { pageId, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  return {
    blocks: blocks.map((b) => ({
      id: b.id,
      type: b.type,
      name: b.name,
      sortOrder: b.sortOrder,
      sourceType: b.sourceType,
      payload: b.payload,
      anchor: b.anchor,
      isVisible: b.isVisible,
    })),
  };
}

async function buildRegionSnapshot(app: FastifyInstance, regionId: string) {
  const blocks = await app.prisma.contentBlock.findMany({
    where: { regionId, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  return {
    blocks: blocks.map((b) => ({
      id: b.id,
      type: b.type,
      name: b.name,
      sortOrder: b.sortOrder,
      sourceType: b.sourceType,
      payload: b.payload,
      anchor: b.anchor,
      isVisible: b.isVisible,
    })),
  };
}

export async function adminCmsRoutes(app: FastifyInstance) {
  registerAdminCrud(app, "pages", "cmsPage", {
    entity: "cms_page",
    searchFields: ["title", "slug"],
    include: { seo: true, blocks: { orderBy: { sortOrder: "asc" } } },
    mapCreate: (b) => ({
      slug: b.slug,
      title: b.title,
      status: b.status ?? "draft",
      revalidateSeconds: b.revalidateSeconds ?? 600,
    }),
    mapUpdate: (b) =>
      pick(b, ["slug", "title", "status", "revalidateSeconds"]),
  });

  app.get(
    "/admin/pages/:id/editor",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const page = await app.prisma.cmsPage.findUnique({
        where: { id },
        include: {
          seo: true,
          blocks: { orderBy: { sortOrder: "asc" } },
        },
      });
      if (!page) return reply.notFound(Fa.notFound);
      return ok(page);
    }
  );

  app.post(
    "/admin/pages/:id/publish",
    { preHandler: [requirePermission("cms_page", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const page = await app.prisma.cmsPage.findUnique({ where: { id } });
      if (!page) return reply.notFound(Fa.notFound);
      const snapshot = await buildPageSnapshot(app, id);
      const updated = await app.prisma.cmsPage.update({
        where: { id },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedSnapshot: snapshot,
        },
        include: { seo: true },
      });
      return ok(updated);
    }
  );

  registerAdminCrud(app, "regions", "cmsRegion", {
    entity: "cms_region",
    searchFields: ["key", "title"],
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
    mapCreate: (b) => ({
      key: b.key,
      title: b.title,
      status: b.status ?? "draft",
      revalidateSeconds: b.revalidateSeconds ?? 600,
    }),
    mapUpdate: (b) =>
      pick(b, ["key", "title", "status", "revalidateSeconds"]),
  });

  app.post(
    "/admin/regions/:id/publish",
    { preHandler: [requirePermission("cms_region", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const region = await app.prisma.cmsRegion.findUnique({ where: { id } });
      if (!region) return reply.notFound(Fa.notFound);
      const snapshot = await buildRegionSnapshot(app, id);
      const updated = await app.prisma.cmsRegion.update({
        where: { id },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedSnapshot: snapshot,
        },
      });
      return ok(updated);
    }
  );

  registerAdminCrud(app, "blocks", "contentBlock", {
    entity: "content_block",
    mapCreate: (b) => ({
      ownerType: b.ownerType,
      pageId: b.pageId ?? null,
      regionId: b.regionId ?? null,
      type: b.type,
      name: b.name,
      sortOrder: b.sortOrder ?? 0,
      isVisible: b.isVisible ?? true,
      sourceType: b.sourceType ?? "STATIC",
      payload: b.payload ?? {},
      anchor: b.anchor ?? null,
    }),
    mapUpdate: (b) =>
      pick(b, [
        "ownerType",
        "pageId",
        "regionId",
        "type",
        "name",
        "sortOrder",
        "isVisible",
        "sourceType",
        "payload",
        "anchor",
      ]),
  });

  app.put(
    "/admin/blocks/reorder",
    { preHandler: [requirePermission("content_block", "update")] },
    async (request) => {
      const { items } = (request.body ?? {}) as {
        items?: Array<{ id: string; sortOrder: number }>;
      };
      if (!items?.length) return ok([]);
      await app.prisma.$transaction(
        items.map((item) =>
          app.prisma.contentBlock.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      return ok(items);
    }
  );

  app.get("/admin/section-library", { preHandler: [requireAdmin] }, async (request) => {
    const q = request.query as { excludePageId?: string };
    const where = q.excludePageId
      ? { pageId: { not: q.excludePageId }, ownerType: "PAGE" as const }
      : { ownerType: "PAGE" as const, pageId: { not: null } };

    const blocks = await app.prisma.contentBlock.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      include: { page: { select: { id: true, title: true, slug: true } } },
    });

    return ok({
      fromPages: blocks
        .filter((b) => b.page)
        .map((b) => ({
          id: b.id,
          type: b.type,
          name: b.name,
          sourceType: b.sourceType,
          pageId: b.pageId,
          pageTitle: b.page?.title,
          pageSlug: b.page?.slug,
          updatedAt: b.updatedAt,
        })),
    });
  });

  app.post(
    "/admin/pages/:id/blocks/clone",
    { preHandler: [requirePermission("content_block", "create")] },
    async (request, reply) => {
      const { id: pageId } = request.params as { id: string };
      const { sourceBlockId } = (request.body ?? {}) as { sourceBlockId?: string };
      if (!sourceBlockId) return reply.badRequest(Fa.badRequest);

      const page = await app.prisma.cmsPage.findUnique({ where: { id: pageId } });
      if (!page) return reply.notFound(Fa.notFound);

      const source = await app.prisma.contentBlock.findUnique({
        where: { id: sourceBlockId },
      });
      if (!source) return reply.notFound(Fa.notFound);

      const maxOrder = await app.prisma.contentBlock.aggregate({
        where: { pageId },
        _max: { sortOrder: true },
      });

      const created = await app.prisma.contentBlock.create({
        data: {
          ownerType: "PAGE",
          pageId,
          type: source.type,
          name: source.name,
          sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          isVisible: true,
          sourceType: source.sourceType,
          payload: source.payload as object,
          anchor: source.anchor,
        },
      });
      return ok(created);
    }
  );
}
