import type { FastifyInstance } from "fastify";
import { ok, okList, parseListQuery, prismaOrderBy } from "../../lib/helpers";
import { Fa } from "../../lib/errors";

async function resolveEntityQuery(
  app: FastifyInstance,
  payload: Record<string, unknown>
) {
  const entity = String(payload.entity || "");
  const filters = (payload.filters as Record<string, unknown>) || {};
  const sort = String(payload.sort || "-createdAt");
  const limit = Math.min(50, Number(payload.limit) || 8);
  const categoryId = payload.categoryId ? String(payload.categoryId) : "";

  switch (entity) {
    case "product": {
      const where: Record<string, unknown> = {
        status: "AVAILABLE",
        ...filters,
      };
      if (payload.isFeatured === true) where.isFeatured = true;
      if (categoryId) {
        where.categories = { some: { categoryId } };
      }
      return app.prisma.product.findMany({
        where,
        orderBy: prismaOrderBy(sort),
        take: limit,
        include: {
          categories: { include: { category: true } },
        },
      });
    }
    case "blog": {
      const where: Record<string, unknown> = {
        status: "published",
        ...filters,
      };
      if (categoryId) where.categoryId = categoryId;
      return app.prisma.blog.findMany({
        where,
        orderBy: prismaOrderBy(sort),
        take: limit,
        include: { category: true, author: true },
      });
    }
    case "comment": {
      const where: Record<string, unknown> = { publish: true, ...filters };
      if (payload.targetType && payload.targetType !== "all") {
        where.targetType = String(payload.targetType);
      }
      return app.prisma.comment.findMany({
        where,
        orderBy: prismaOrderBy(sort),
        take: limit,
      });
    }
    case "blog_category": {
      const where: Record<string, unknown> = { publish: true, ...filters };
      if (payload.parentSlug) {
        const parent = await app.prisma.blogCategory.findFirst({
          where: { slug: String(payload.parentSlug) },
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
      const where: Record<string, unknown> = { publish: true, ...filters };
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
    where: { OR: candidates.map((slug) => ({ slug })) },
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
  // همیشه بلوک‌های زنده صفحه‌ساز؛ snapshot فقط اگر بلوکی نبود
  const page = await findPageBySlug(app, slug);
  if (!page) return reply.notFound(Fa.notFound);

  const live = await buildLivePageSnapshot(app, page.id);
  if (live.blocks.length) {
    return pageResponse(page, live);
  }

  if (page.status === "published" && page.publishedSnapshot) {
    return pageResponse(page, page.publishedSnapshot);
  }

  return reply.notFound(Fa.notFound);
}

export async function publicRoutes(app: FastifyInstance) {
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

  app.post("/blocks/resolve", async (request) => {
    const { blocks } = (request.body ?? {}) as {
      blocks?: Array<{
        id: string;
        sourceType: string;
        payload: Record<string, unknown>;
      }>;
    };
    const result: Record<string, unknown> = {};
    for (const block of blocks || []) {
      if (block.sourceType === "ENTITY_QUERY") {
        result[block.id] = await resolveEntityQuery(app, block.payload || {});
      } else if (block.sourceType === "ENTITY_REF") {
        result[block.id] = await resolveEntityRef(app, block.payload || {});
      } else {
        result[block.id] = block.payload;
      }
    }
    return ok(result);
  });

  app.get("/products", async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const filters = { ...q.filters };
    const categorySlugs = filters.categorySlugs;
    delete filters.categorySlugs;

    const where: Record<string, unknown> = {
      status: "AVAILABLE",
      ...filters,
    };

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
    const total = await app.prisma.product.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.product.findMany({
      where,
      orderBy: prismaOrderBy(q.sort),
      skip: q.skip,
      take: q.limit,
      include: {
        categories: { include: { category: true } },
        packages: true,
      },
    });
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
    await app.prisma.product.update({
      where: { id: product.id },
      data: { views: { increment: 1 } },
    });
    return ok(product);
  });

  app.get("/products/:id/similar", async (request) => {
    const { id } = request.params as { id: string };
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
    const where: Record<string, unknown> = {
      status: "published",
      ...q.filters,
    };
    if (q.search) {
      where.OR = [{ title: { contains: q.search, mode: "insensitive" } }];
    }
    const total = await app.prisma.blog.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.blog.findMany({
      where,
      orderBy: prismaOrderBy(q.sort),
      skip: q.skip,
      take: q.limit,
      include: { category: true, author: true },
    });
    return okList(content, total, q.page, q.limit);
  });

  app.get("/blogs/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const blog = await app.prisma.blog.findFirst({
      where: { slug: decodeURIComponent(slug), status: "published" },
      include: { category: true, author: true },
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
    const content = await app.prisma.comment.findMany({
      where: { productId, publish: true, parentId: null, targetType: "product" },
      include: {
        replies: {
          where: { publish: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(content);
  });

  app.get("/comments/blog/:blogId", async (request) => {
    const { blogId } = request.params as { blogId: string };
    const content = await app.prisma.comment.findMany({
      where: { blogId, publish: true, parentId: null, targetType: "blog" },
      include: {
        replies: {
          where: { publish: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(content);
  });

  app.post("/comments", async (request, reply) => {
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
    const targetType = body.targetType;
    if (!nickName || !content || !targetType) {
      return reply.badRequest(Fa.commentFieldsRequired);
    }
    if (!["product", "blog", "comment"].includes(targetType)) {
      return reply.badRequest(Fa.commentTargetTypeInvalid);
    }

    const targetId = String(body.target_id || "").trim() || undefined;
    let productId = body.productId || undefined;
    let blogId = body.blogId || undefined;
    let parentId = body.parentId || undefined;

    if (targetType === "product") {
      productId = productId || targetId;
      if (!productId) return reply.badRequest(Fa.commentTargetInvalid);
      const product = await app.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) return reply.badRequest(Fa.commentTargetInvalid);
    } else if (targetType === "blog") {
      blogId = blogId || targetId;
      if (!blogId) return reply.badRequest(Fa.commentTargetInvalid);
      const blog = await app.prisma.blog.findUnique({
        where: { id: blogId },
        select: { id: true },
      });
      if (!blog) return reply.badRequest(Fa.commentTargetInvalid);
    } else {
      parentId = parentId || targetId;
      if (!parentId) return reply.badRequest(Fa.commentTargetInvalid);
      const parent = await app.prisma.comment.findUnique({
        where: { id: parentId },
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
    });
    return ok(comment);
  });

  app.post("/contact", async (request, reply) => {
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

  app.get("/seo", async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const total = await app.prisma.seo.count({ where: q.filters });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await app.prisma.seo.findMany({
      where: q.filters,
      take: q.limit,
      skip: q.skip,
      orderBy: prismaOrderBy(q.sort),
    });
    return okList(content, total, q.page, q.limit);
  });
}
