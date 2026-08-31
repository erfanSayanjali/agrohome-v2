import type { FastifyInstance } from "fastify";
import {
  ok,
  okList,
  parseListQuery,
  prismaOrderBy,
  prismaOrderByAllowed,
  mergeProtectedWhere,
  pickPublicFilters,
  MAX_BLOCKS_RESOLVE_COUNT,
} from "../../lib/helpers";
import { Fa } from "../../lib/errors";
import { createRateLimiter } from "../../lib/rate-limit";
import {
  PUBLIC_AUTHOR_SELECT,
  PUBLIC_COMMENT_SELECT,
  PUBLIC_SEO_SELECT,
} from "../../lib/public-selects";

const publicPostRateLimit = createRateLimiter({
  max: 30,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "public-post",
});

const blocksResolveRateLimit = createRateLimiter({
  max: 60,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "blocks-resolve",
});

const PRODUCT_SORT_FIELDS = ["createdAt", "title", "views", "sortOrder"];
const BLOG_SORT_FIELDS = ["createdAt", "title"];
const COMMENT_SORT_FIELDS = ["createdAt", "rating"];

const publicCommentSelect = {
  ...PUBLIC_COMMENT_SELECT,
  replies: {
    where: { publish: true },
    orderBy: { createdAt: "asc" as const },
    select: PUBLIC_COMMENT_SELECT,
  },
} as const;

async function resolveEntityQuery(
  app: FastifyInstance,
  payload: Record<string, unknown>
) {
  const entity = String(payload.entity || "");
  const filters = pickPublicFilters(
    (payload.filters as Record<string, unknown>) || {},
    entity === "product"
      ? ["isFeatured", "categoryId"]
      : entity === "blog"
        ? ["categoryId", "authorId"]
        : entity === "comment"
          ? ["targetType", "productId", "blogId"]
          : ["parentId"]
  );
  const sort = String(payload.sort || "-createdAt");
  const limit = Math.min(50, Number(payload.limit) || 8);
  const categoryId = payload.categoryId ? String(payload.categoryId) : "";

  switch (entity) {
    case "product": {
      const where = mergeProtectedWhere({ status: "AVAILABLE" }, filters);
      if (payload.isFeatured === true) where.isFeatured = true;
      if (categoryId) {
        where.categories = { some: { categoryId } };
      }
      return app.prisma.product.findMany({
        where,
        orderBy: prismaOrderByAllowed(sort, PRODUCT_SORT_FIELDS),
        take: limit,
        include: {
          categories: { include: { category: true } },
        },
      });
    }
    case "blog": {
      const where = mergeProtectedWhere({ status: "published" }, filters);
      if (categoryId) where.categoryId = categoryId;
      return app.prisma.blog.findMany({
        where,
        orderBy: prismaOrderByAllowed(sort, BLOG_SORT_FIELDS),
        take: limit,
        include: { category: true, author: { select: PUBLIC_AUTHOR_SELECT } },
      });
    }
    case "comment": {
      const where = mergeProtectedWhere({ publish: true }, filters);
      if (payload.targetType && payload.targetType !== "all") {
        where.targetType = String(payload.targetType);
      }
      if (payload.showOnHome !== false) where.showOnHome = true;
      return app.prisma.comment.findMany({
        where,
        orderBy: prismaOrderByAllowed(sort, COMMENT_SORT_FIELDS),
        take: limit,
        select: PUBLIC_COMMENT_SELECT,
      });
    }
    case "blog_category": {
      const where = mergeProtectedWhere({ publish: true }, filters);
      if (payload.parentSlug) {
        const parent = await app.prisma.blogCategory.findFirst({
          where: { slug: String(payload.parentSlug), publish: true },
        });
        where.parentId = parent?.id ?? "__missing_parent__";
      }
      return app.prisma.blogCategory.findMany({
        where,
        orderBy: { title: "asc" },
        take: limit,
      });
    }
    case "product_category": {
      const where = mergeProtectedWhere({ publish: true }, filters);
      if (categoryId) where.parentId = categoryId;
      return app.prisma.productCategory.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        take: limit,
      });
    }
    default:
      return [];
  }
}

async function resolveEntityRef(
  app: FastifyInstance,
  payload: Record<string, unknown>
) {
  const entity = String(payload.entity || "");
  const ids = (payload.ids as string[]) || [];
  if (!ids.length) return [];
  switch (entity) {
    case "product":
      return app.prisma.product.findMany({
        where: { id: { in: ids }, status: "AVAILABLE" },
      });
    case "blog":
      return app.prisma.blog.findMany({
        where: { id: { in: ids }, status: "published" },
      });
    default:
      return [];
  }
}

async function findPageBySlug(app: FastifyInstance, slugRaw: string) {
  const decoded = decodeURIComponent(slugRaw || "/");
  const bare = decoded.replace(/^\//, "");
  const isHome = !bare || bare === "home" || decoded === "/";
  const candidates = isHome
    ? ["/", "home"]
    : Array.from(new Set([decoded, `/${bare}`, bare].filter(Boolean)));
  return app.prisma.cmsPage.findFirst({
    where: {
      status: "published",
      OR: candidates.map((slug) => ({ slug })),
    },
    include: { seo: true },
  });
}

async function buildLivePageSnapshot(app: FastifyInstance, pageId: string) {
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

function pageResponse(page: {
  id: string;
  slug: string;
  title: string;
  revalidateSeconds: number | null;
  publishedAt: Date | null;
  seo: unknown;
}, snapshot: unknown) {
  return ok({
    id: page.id,
    slug: page.slug,
    title: page.title,
    revalidateSeconds: page.revalidateSeconds,
    publishedAt: page.publishedAt,
    snapshot,
    seo: page.seo,
  });
}

async function resolvePublicPage(app: FastifyInstance, reply: import("fastify").FastifyReply, slug: string) {
  const page = await findPageBySlug(app, slug);
  if (!page) return reply.notFound(Fa.notFound);

  const live = await buildLivePageSnapshot(app, page.id);
  if (live.blocks.length) {
    return pageResponse(page, live);
  }

  if (page.publishedSnapshot) {
    return pageResponse(page, page.publishedSnapshot);
  }

  return reply.notFound(Fa.notFound);
}

export async function publicRoutes(app: FastifyInstance) {
  app.get("/pages/slugs", async () => {
    const pages = await app.prisma.cmsPage.findMany({
      where: { status: "published" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    });
    return ok(pages.map((page) => page.slug));
  });

  /** مناسب برای slugهایی مثل / که در path خراب می‌شوند */
  app.get("/pages", async (request, reply) => {
    const q = request.query as { slug?: string };
    const slug = q.slug != null && String(q.slug).length ? String(q.slug) : "/";
    return resolvePublicPage(app, reply, slug);
  });

  app.get("/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    return resolvePublicPage(app, reply, slug);
  });

  app.get("/site-settings", async () => {
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
        headerLinks: [
          { title: "صفحه اصلی", href: "/" },
          { title: "محصولات", href: "/products" },
          { title: "وبلاگ", href: "/blogs" },
          { title: "درباره ما", href: "/about" },
          { title: "تماس با ما", href: "/contact" },
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

  app.post("/blocks/resolve", { preHandler: [blocksResolveRateLimit] }, async (request, reply) => {
    const { blocks } = (request.body ?? {}) as {
      blocks?: Array<{
        id: string;
        sourceType: string;
        payload: Record<string, unknown>;
      }>;
    };
    const list = blocks || [];
    if (list.length > MAX_BLOCKS_RESOLVE_COUNT) {
      return reply.badRequest(Fa.badRequest);
    }
    const resolved = await Promise.all(
      list.map(async (block) => {
        if (block.sourceType === "ENTITY_QUERY") {
          return [block.id, await resolveEntityQuery(app, block.payload || {})] as const;
        }
        if (block.sourceType === "ENTITY_REF") {
          return [block.id, await resolveEntityRef(app, block.payload || {})] as const;
        }
        return [block.id, block.payload] as const;
      })
    );
    const result: Record<string, unknown> = {};
    for (const [id, value] of resolved) result[id] = value;
    return ok(result);
  });

  app.get("/products", async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const categorySlugs = q.filters.categorySlugs;
    const filters = pickPublicFilters(q.filters, [
      "isFeatured",
      "categoryId",
      "slug",
      "legacyId",
    ]);

    const where = mergeProtectedWhere({ status: "AVAILABLE" }, filters);

    if (Array.isArray(categorySlugs) && categorySlugs.length) {
      where.categories = {
        some: { category: { slug: { in: categorySlugs.map(String) } } },
      };
    }

    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: "insensitive" } },
        { subtitle: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.fieldsMetaOnly || q.limit === 0) {
      const total = await app.prisma.product.count({ where });
      return okList([], total, q.page, q.limit);
    }
    const [total, content] = await Promise.all([
      app.prisma.product.count({ where }),
      app.prisma.product.findMany({
        where,
        orderBy: prismaOrderByAllowed(q.sort, PRODUCT_SORT_FIELDS),
        skip: q.skip,
        take: q.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          media: true,
          status: true,
          createdAt: true,
          categories: {
            select: {
              category: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      }),
    ]);
    return okList(content, total, q.page, q.limit);
  });

  app.get("/products/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await app.prisma.product.findFirst({
      where: { slug: decodeURIComponent(slug), status: "AVAILABLE" },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        packages: true,
        specs: { include: { specification: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) return reply.notFound(Fa.notFound);
    void app.prisma.product
      .update({
        where: { id: product.id },
        data: { views: { increment: 1 } },
      })
      .catch((err) => {
        app.log.warn({ err, productId: product.id }, "product views increment failed");
      });
    return ok(product);
  });

  app.get("/products/:id/similar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const source = await app.prisma.product.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!source || source.status !== "AVAILABLE") {
      return reply.notFound(Fa.notFound);
    }
    const links = await app.prisma.productCategoryOnProduct.findMany({
      where: { productId: id },
    });
    const categoryIds = links.map((l) => l.categoryId);
    const content = await app.prisma.product.findMany({
      where: {
        status: "AVAILABLE",
        id: { not: id },
        categories: categoryIds.length
          ? { some: { categoryId: { in: categoryIds } } }
          : undefined,
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    return ok(content);
  });

  app.get("/product-categories", async () => {
    const content = await app.prisma.productCategory.findMany({
      where: { publish: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return ok(content);
  });

  app.get("/product-categories/nested", async () => {
    const all = await app.prisma.productCategory.findMany({
      where: { publish: true },
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
  });

  app.get("/product-categories/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const category = await app.prisma.productCategory.findFirst({
      where: { slug: decodeURIComponent(slug), publish: true },
    });
    if (!category) return reply.notFound(Fa.notFound);
    return ok(category);
  });

  app.get("/blogs", async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const safeFilters = pickPublicFilters(q.filters, [
      "categoryId",
      "authorId",
      "slug",
      "legacyId",
    ]);
    const where = mergeProtectedWhere({ status: "published" }, safeFilters);
    if (q.search) {
      where.OR = [{ title: { contains: q.search, mode: "insensitive" } }];
    }
    const total = await app.prisma.blog.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.blog.findMany({
      where,
      orderBy: prismaOrderByAllowed(q.sort, BLOG_SORT_FIELDS),
      skip: q.skip,
      take: q.limit,
      include: { category: true, author: { select: PUBLIC_AUTHOR_SELECT } },
    });
    return okList(content, total, q.page, q.limit);
  });

  app.get("/blogs/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const blog = await app.prisma.blog.findFirst({
      where: { slug: decodeURIComponent(slug), status: "published" },
      include: { category: true, author: { select: PUBLIC_AUTHOR_SELECT } },
    });
    if (!blog) return reply.notFound(Fa.notFound);
    return ok(blog);
  });

  app.get("/blog-categories", async () => {
    const content = await app.prisma.blogCategory.findMany({
      where: { publish: true },
      orderBy: { title: "asc" },
    });
    return ok(content);
  });

  app.get("/blog-categories/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const category = await app.prisma.blogCategory.findFirst({
      where: { slug: decodeURIComponent(slug), publish: true },
    });
    if (!category) return reply.notFound(Fa.notFound);
    return ok(category);
  });

  app.get("/comments/product/:productId", async (request) => {
    const { productId } = request.params as { productId: string };
    const q = parseListQuery(request.query as Record<string, unknown>, {
      limit: 5,
    });
    const where = {
      productId,
      publish: true,
      parentId: null,
      targetType: "product" as const,
    };
    const total = await app.prisma.comment.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.comment.findMany({
      where,
      select: publicCommentSelect,
      orderBy: { createdAt: "desc" },
      skip: q.skip,
      take: q.limit,
    });
    return okList(content, total, q.page, q.limit);
  });

  app.get("/comments/blog/:blogId", async (request) => {
    const { blogId } = request.params as { blogId: string };
    const q = parseListQuery(request.query as Record<string, unknown>, {
      limit: 5,
    });
    const where = {
      blogId,
      publish: true,
      parentId: null,
      targetType: "blog" as const,
    };
    const total = await app.prisma.comment.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.comment.findMany({
      where,
      select: publicCommentSelect,
      orderBy: { createdAt: "desc" },
      skip: q.skip,
      take: q.limit,
    });
    return okList(content, total, q.page, q.limit);
  });

  app.post("/comments", { preHandler: [publicPostRateLimit] }, async (request, reply) => {
    const body = (request.body ?? {}) as {
      nickName?: string;
      content?: string;
      email?: string;
      website?: string;
      rating?: number | string;
      targetType?: "product" | "blog" | "comment";
      productId?: string;
      blogId?: string;
      parentId?: string;
      /** legacy frontend field */
      target_id?: string;
    };

    const nickName = String(body.nickName || "").trim();
    const content = String(body.content || "").trim();
    if (!nickName || !content) {
      return reply.badRequest(Fa.commentFieldsRequired);
    }

    const targetId = String(body.target_id || "").trim() || undefined;
    let productId = body.productId || undefined;
    let blogId = body.blogId || undefined;
    let parentId = body.parentId || undefined;

    let targetType = body.targetType;
    if (!targetType) {
      if (parentId) targetType = "comment";
      else if (productId) targetType = "product";
      else if (blogId) targetType = "blog";
    }
    if (!targetType || !["product", "blog", "comment"].includes(targetType)) {
      return reply.badRequest(Fa.commentTargetInvalid);
    }

    if (targetType === "product") {
      productId = productId || targetId;
      if (!productId) return reply.badRequest(Fa.commentTargetInvalid);
      const product = await app.prisma.product.findFirst({
        where: { id: productId, status: "AVAILABLE" },
        select: { id: true },
      });
      if (!product) return reply.badRequest(Fa.commentTargetInvalid);
    } else if (targetType === "blog") {
      blogId = blogId || targetId;
      if (!blogId) return reply.badRequest(Fa.commentTargetInvalid);
      const blog = await app.prisma.blog.findFirst({
        where: { id: blogId, status: "published" },
        select: { id: true },
      });
      if (!blog) return reply.badRequest(Fa.commentTargetInvalid);
    } else {
      parentId = parentId || targetId;
      if (!parentId) return reply.badRequest(Fa.commentTargetInvalid);
      const parent = await app.prisma.comment.findFirst({
        where: { id: parentId, publish: true },
        select: { id: true, productId: true, blogId: true },
      });
      if (!parent) return reply.badRequest(Fa.commentTargetInvalid);
      productId = parent.productId || undefined;
      blogId = parent.blogId || undefined;
    }

    const ratingRaw =
      targetType === "comment" ? null : Number(body.rating);
    const rating =
      ratingRaw != null && Number.isFinite(ratingRaw)
        ? Math.min(5, Math.max(0, ratingRaw))
        : null;

    const comment = await app.prisma.comment.create({
      data: {
        nickName,
        content,
        email: body.email ? String(body.email).trim() : null,
        website: body.website ? String(body.website).trim() : null,
        rating,
        publish: false,
        targetType,
        productId: productId || null,
        blogId: blogId || null,
        parentId: parentId || null,
      },
      select: PUBLIC_COMMENT_SELECT,
    });
    return ok(comment);
  });

  app.post("/contact", { preHandler: [publicPostRateLimit] }, async (request, reply) => {
    const body = (request.body ?? {}) as {
      fullName?: string;
      subject?: string;
      email?: string;
      phone?: string;
      message?: string;
    };
    if (!body.message) return reply.badRequest(Fa.contactMessageRequired);
    const item = await app.prisma.contactMessage.create({
      data: {
        fullName: body.fullName,
        subject: body.subject,
        email: body.email,
        phone: body.phone,
        message: body.message,
        status: "new",
      },
    });
    return ok(item);
  });

  app.get("/seo/by-path", async (request, reply) => {
    const q = request.query as { targetPath?: string };
    const targetPath = typeof q.targetPath === "string" ? q.targetPath.trim() : "";
    if (!targetPath) return reply.badRequest(Fa.badRequest);
    const seo = await app.prisma.seo.findFirst({
      where: { targetPath: targetPath === "/" ? "/" : targetPath },
      select: PUBLIC_SEO_SELECT,
    });
    return ok(seo);
  });

  app.get("/seo/by-target", async (request, reply) => {
    const q = request.query as { targetType?: string; targetLegacyId?: string };
    if (!q.targetType || !q.targetLegacyId) {
      return reply.badRequest(Fa.badRequest);
    }
    const seo = await app.prisma.seo.findFirst({
      where: {
        targetType: q.targetType,
        targetLegacyId: q.targetLegacyId,
      },
      select: PUBLIC_SEO_SELECT,
    });
    return ok(seo);
  });
}
