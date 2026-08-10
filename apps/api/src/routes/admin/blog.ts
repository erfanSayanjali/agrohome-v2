import type { FastifyInstance } from "fastify";
import { registerAdminCrud } from "../../lib/crud";
import { ok, slugify } from "../../lib/helpers";
import { Fa } from "../../lib/errors";
import { requireAdmin, requirePermission } from "../../plugins/auth";
import { normalizeMedia } from "../../lib/media";

function pick(body: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

export async function adminBlogRoutes(app: FastifyInstance) {
  registerAdminCrud(app, "blog-categories", "blogCategory", {
    entity: "blog_category",
    searchFields: ["title", "slug"],
    include: { parent: { select: { id: true, title: true, slug: true } } },
    mapCreate: (b) => ({
      title: b.title,
      slug: String(b.slug || slugify(String(b.title || ""))),
      description: b.description,
      publish: b.publish ?? true,
      media: normalizeMedia(b.media ?? b.thumbnailUrl),
      parentId: b.parentId ?? null,
    }),
    mapUpdate: (b) => {
      const data = pick(b, [
        "title",
        "slug",
        "description",
        "publish",
        "parentId",
      ]);
      if (b.media !== undefined || b.thumbnailUrl !== undefined) {
        data.media = normalizeMedia(b.media ?? b.thumbnailUrl);
      }
      return data;
    },
    beforeDelete: async (instance, id) => {
      const children = await instance.prisma.blogCategory.count({
        where: { parentId: id },
      });
      if (children > 0) {
        throw new Error(Fa.categoryHasChildren);
      }
    },
  });

  app.get(
    "/admin/blog-categories-nested",
    { preHandler: [requireAdmin] },
    async () => {
      const all = await app.prisma.blogCategory.findMany({
        orderBy: { title: "asc" },
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

  registerAdminCrud(app, "blogs", "blog", {
    entity: "blog",
    searchFields: ["title", "slug"],
    include: {
      author: true,
      category: {
        include: { parent: { select: { id: true, title: true, slug: true } } },
      },
    },
    mapCreate: (b) => ({
      title: b.title,
      slug: String(b.slug || slugify(String(b.title || ""))),
      content: b.content,
      status: b.status ?? "draft",
      media: normalizeMedia(b.media ?? b.thumbnailUrl),
      authorId: b.authorId ?? null,
      categoryId: b.categoryId ?? null,
    }),
    mapUpdate: (b) => {
      const data = pick(b, [
        "title",
        "slug",
        "content",
        "status",
        "authorId",
        "categoryId",
      ]);
      if (b.media !== undefined || b.thumbnailUrl !== undefined) {
        data.media = normalizeMedia(b.media ?? b.thumbnailUrl);
      }
      return data;
    },
  });

  registerAdminCrud(app, "comments", "comment", {
    entity: "comment",
    searchFields: ["nickName", "content", "email"],
    include: { product: true, blog: true, replies: true, parent: true },
    mapCreate: (b) => ({
      nickName: b.nickName,
      content: b.content,
      email: b.email,
      website: b.website,
      rating: b.rating,
      publish: b.publish ?? false,
      targetType: b.targetType,
      productId: b.productId ?? null,
      blogId: b.blogId ?? null,
      parentId: b.parentId ?? null,
    }),
    mapUpdate: (b) =>
      pick(b, [
        "nickName",
        "content",
        "email",
        "website",
        "rating",
        "publish",
        "targetType",
        "productId",
        "blogId",
        "parentId",
      ]),
  });

  app.post(
    "/admin/comments/:id/reply",
    { preHandler: [requirePermission("comment", "create")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parent = await app.prisma.comment.findUnique({ where: { id } });
      if (!parent) return reply.notFound(Fa.notFound);
      const body = (request.body ?? {}) as {
        content?: string;
        nickName?: string;
      };
      if (!body.content) return reply.badRequest(Fa.commentContentRequired);
      const replyComment = await app.prisma.comment.create({
        data: {
          nickName: body.nickName || "آگروهوم",
          content: body.content,
          publish: true,
          targetType: "comment",
          parentId: id,
          productId: parent.productId,
          blogId: parent.blogId,
        },
      });
      return ok(replyComment);
    }
  );
}
