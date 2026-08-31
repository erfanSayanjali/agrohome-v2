import type { FastifyInstance } from "fastify";
import { CMS_DEFAULT_REVALIDATE_SECONDS } from "@agrohome/shared";
import { registerAdminCrud } from "../../lib/crud";
import { ok } from "../../lib/helpers";
import { Fa } from "../../lib/errors";
import { requireAdmin, requirePermission } from "../../plugins/auth";
import {
  revalidateCmsPageIds,
  revalidateCmsPageSlugs,
} from "../../lib/cms-revalidate";

function pick(body: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

function asId(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function asSlug(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
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
      revalidateSeconds: b.revalidateSeconds ?? CMS_DEFAULT_REVALIDATE_SECONDS,
    }),
    mapUpdate: (b) =>
      pick(b, ["slug", "title", "status", "revalidateSeconds"]),
    afterCreate: async (instance, item) => {
      await revalidateCmsPageSlugs(instance, [asSlug(item.slug)]);
    },
    afterUpdate: async (instance, item, previous) => {
      await revalidateCmsPageSlugs(instance, [
        asSlug(previous?.slug),
        asSlug(item.slug),
      ]);
    },
    afterDelete: async (instance, previous) => {
      await revalidateCmsPageSlugs(instance, [asSlug(previous?.slug)]);
    },
  });

  app.get(
    "/admin/pages/:id/editor",
    { preHandler: [requirePermission("cms_page", "read")] },
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

  registerAdminCrud(app, "blocks", "contentBlock", {
    entity: "content_block",
    mapCreate: (b) => ({
      ownerType: b.ownerType ?? "PAGE",
      pageId: b.pageId ?? null,
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
        "type",
        "name",
        "sortOrder",
        "isVisible",
        "sourceType",
        "payload",
        "anchor",
      ]),
    afterCreate: async (instance, item) => {
      await revalidateCmsPageIds(instance, [asId(item.pageId)]);
    },
    afterUpdate: async (instance, item, previous) => {
      await revalidateCmsPageIds(instance, [
        asId(previous?.pageId),
        asId(item.pageId),
      ]);
    },
    afterDelete: async (instance, previous) => {
      await revalidateCmsPageIds(instance, [asId(previous?.pageId)]);
    },
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
      const blocks = await app.prisma.contentBlock.findMany({
        where: { id: { in: items.map((item) => item.id) } },
        select: { pageId: true },
      });
      await revalidateCmsPageIds(
        app,
        blocks.map((block) => block.pageId)
      );
      return ok(items);
    }
  );
}
