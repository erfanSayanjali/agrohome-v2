import type { FastifyInstance } from "fastify";
import { registerAdminCrud } from "../../lib/crud";
import { ok, slugify } from "../../lib/helpers";
import { Fa } from "../../lib/errors";
import { requireAdmin, requirePermission } from "../../plugins/auth";
import { normalizeGallery, normalizeMedia } from "../../lib/media";
import {
  notifyCatalogLayoutRevalidate,
  revalidateProductSlugs,
} from "../../lib/cms-revalidate";

function pick<T extends Record<string, unknown>>(body: T, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

async function revalidateCatalogLayout(app: FastifyInstance) {
  await notifyCatalogLayoutRevalidate({
    warn: (obj, msg) => app.log.warn(obj as object, msg),
  });
}

export async function adminCatalogRoutes(app: FastifyInstance) {
  registerAdminCrud(app, "product-categories", "productCategory", {
    entity: "product_category",
    searchFields: ["title", "slug"],
    sortable: true,
    include: { parent: { select: { id: true, title: true, slug: true } } },
    mapCreate: (b) => ({
      ...pick(b, ["title", "description", "publish", "parentId", "sortOrder"]),
      slug: String(b.slug || slugify(String(b.title || ""))),
    }),
    mapUpdate: (b) =>
      pick(b, ["title", "slug", "description", "publish", "parentId", "sortOrder"]),
    beforeDelete: async (instance, id) => {
      const children = await instance.prisma.productCategory.count({
        where: { parentId: id },
      });
      if (children > 0) {
        throw new Error(Fa.categoryHasChildren);
      }
    },
    afterCreate: async (instance) => {
      await revalidateCatalogLayout(instance);
    },
    afterUpdate: async (instance) => {
      await revalidateCatalogLayout(instance);
    },
    afterDelete: async (instance) => {
      await revalidateCatalogLayout(instance);
    },
  });

  app.get(
    "/admin/product-categories-nested",
    { preHandler: [requirePermission("product_category", "read")] },
    async () => {
      const all = await app.prisma.productCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      });
      type Node = (typeof all)[number] & { children: Node[] };
      const map = new Map<string, Node>();
      all.forEach((c) => map.set(c.id, { ...c, children: [] }));
      const roots: Node[] = [];
      for (const c of map.values()) {
        if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(c);
        else roots.push(c);
      }
      return ok(roots);
    }
  );

  registerAdminCrud(app, "products", "product", {
    entity: "product",
    searchFields: ["title", "slug", "subtitle"],
    sortable: true,
    include: {
      categories: {
        include: {
          category: {
            include: { parent: { select: { id: true, title: true, slug: true } } },
          },
        },
      },
      tags: { include: { tag: true } },
      packages: { orderBy: { sortOrder: "asc" } },
      specs: { include: { specification: true }, orderBy: { sortOrder: "asc" } },
    },
    mapCreate: (b) => {
      const categoryIds = (b.categoryIds as string[]) || [];
      const tagIds = (b.tagIds as string[]) || [];
      return {
        title: b.title,
        slug: String(b.slug || slugify(String(b.title || ""))),
        subtitle: b.subtitle,
        description: b.description,
        media: normalizeMedia(b.media ?? b.thumbnailUrl),
        gallery: normalizeGallery(b.gallery ?? []),
        isFeatured: b.isFeatured ?? false,
        status: b.status ?? "AVAILABLE",
        sortOrder: b.sortOrder ?? 0,
        categories: categoryIds.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      };
    },
    mapUpdate: (b) => {
      const data = pick(b, [
        "title",
        "slug",
        "subtitle",
        "description",
        "isFeatured",
        "status",
        "sortOrder",
      ]);
      if (b.media !== undefined || b.thumbnailUrl !== undefined) {
        data.media = normalizeMedia(b.media ?? b.thumbnailUrl);
      }
      if (b.gallery !== undefined) {
        data.gallery = normalizeGallery(b.gallery);
      }
      return data;
    },
    afterCreate: async (instance, item) => {
      await revalidateProductSlugs(instance, [String(item.slug || "")]);
    },
    afterUpdate: async (instance, item, previous) => {
      await revalidateProductSlugs(instance, [
        String(item.slug || ""),
        previous ? String(previous.slug || "") : "",
      ]);
    },
    afterDelete: async (instance, previous) => {
      await revalidateProductSlugs(instance, [
        previous ? String(previous.slug || "") : "",
      ]);
    },
  });

  // replace category/tag relations on product (only fields present in body)
  app.put(
    "/admin/products/:id/relations",
    { preHandler: [requirePermission("product", "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as {
        categoryIds?: string[];
        tagIds?: string[];
      };
      const existing = await app.prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.notFound(Fa.notFound);

      const ops = [];
      if (Array.isArray(body.categoryIds)) {
        ops.push(
          app.prisma.productCategoryOnProduct.deleteMany({ where: { productId: id } })
        );
        if (body.categoryIds.length) {
          ops.push(
            app.prisma.productCategoryOnProduct.createMany({
              data: body.categoryIds.map((categoryId) => ({ productId: id, categoryId })),
            })
          );
        }
      }
      if (Array.isArray(body.tagIds)) {
        ops.push(app.prisma.productTag.deleteMany({ where: { productId: id } }));
        if (body.tagIds.length) {
          ops.push(
            app.prisma.productTag.createMany({
              data: body.tagIds.map((tagId) => ({ productId: id, tagId })),
            })
          );
        }
      }
      if (ops.length) await app.prisma.$transaction(ops);

      const product = await app.prisma.product.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: {
                include: { parent: { select: { id: true, title: true, slug: true } } },
              },
            },
          },
          tags: { include: { tag: true } },
        },
      });
      await revalidateProductSlugs(app, [existing.slug, product?.slug]);
      return ok(product);
    }
  );

  registerAdminCrud(app, "packages", "package", {
    entity: "package",
    searchFields: ["unit"],
    sortable: true,
    include: { product: true },
    mapCreate: (b) => ({
      value: Number(b.value),
      unit: b.unit,
      productId: b.productId,
      sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : 0,
    }),
    mapUpdate: (b) => {
      const out = pick(b, ["unit", "productId"]);
      if (b.value !== undefined) out.value = Number(b.value);
      if (b.sortOrder !== undefined) out.sortOrder = Number(b.sortOrder);
      return out;
    },
  });

  registerAdminCrud(app, "specifications", "specification", {
    entity: "specification",
    searchFields: ["title"],
    mapCreate: (b) => ({
      title: b.title,
      position: b.position ?? "attribute",
    }),
    mapUpdate: (b) => pick(b, ["title", "position"]),
  });

  registerAdminCrud(app, "product-specifications", "productSpecification", {
    entity: "product_specification",
    include: { specification: true, product: true },
    sortable: true,
    mapCreate: (b) =>
      pick(b, [
        "productId",
        "specificationId",
        "value",
        "highlight",
        "sortOrder",
      ]),
    mapUpdate: (b) =>
      pick(b, [
        "productId",
        "specificationId",
        "value",
        "highlight",
        "sortOrder",
      ]),
  });

  registerAdminCrud(app, "tag-categories", "tagCategory", {
    entity: "tag_category",
    searchFields: ["title", "slug"],
    mapCreate: (b) => ({
      title: b.title,
      slug: String(b.slug || slugify(String(b.title || ""))),
    }),
    mapUpdate: (b) => pick(b, ["title", "slug"]),
  });

  registerAdminCrud(app, "tags", "tag", {
    entity: "tag",
    searchFields: ["title", "slug"],
    include: { category: true },
    mapCreate: (b) => ({
      title: b.title,
      slug: String(b.slug || slugify(String(b.title || ""))),
      categoryId: b.categoryId ?? null,
    }),
    mapUpdate: (b) => pick(b, ["title", "slug", "categoryId"]),
  });
}
