/** Stub data layer — empty shapes until the new API is wired. */

type ApiList<T = unknown> = { content: T[]; total?: number };
type ApiOne<T = unknown> = { content: T | null };

const emptyList = <T = unknown>(): ApiList<T> => ({ content: [], total: 0 });
const emptyOne = <T = unknown>(): ApiOne<T> => ({ content: null });

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002";

async function apiJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type CategoryNode = {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  children?: CategoryNode[];
  [key: string]: unknown;
};

type ProductLike = {
  id?: string;
  _id?: string;
  media?: { url?: string; alt?: string | null } | null;
  thumbnailUrl?: string;
  categories?: Array<{
    category?: { title?: string; slug?: string };
    title?: string;
    slug?: string;
  }>;
  thumbnail_id?: Array<{ url?: string; alt?: string | null }>;
  category_id?: Array<{ title?: string; slug?: string }>;
  [key: string]: unknown;
};

type CommentLike = {
  id?: string;
  _id?: string;
  nickName?: string;
  content?: string;
  rating?: number | null;
  createdAt?: string;
  replies?: CommentLike[];
  [key: string]: unknown;
};

function normalizeCategoryTree(nodes: CategoryNode[] = []): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    _id: node.id || node._id,
    children: normalizeCategoryTree(node.children || []),
  }));
}

function normalizeComment(c: CommentLike): CommentLike {
  return {
    ...c,
    _id: c.id || c._id,
    replies: Array.isArray(c.replies) ? c.replies.map(normalizeComment) : [],
  };
}

function normalizeProduct(p: ProductLike) {
  const media =
    p.media || (p.thumbnailUrl ? { url: p.thumbnailUrl, alt: null } : null);
  const category_id = p.categories?.length
    ? p.categories.map((c) => ({
        title: c.category?.title || c.title,
        slug: c.category?.slug || c.slug,
      }))
    : p.category_id || [];
  return {
    ...p,
    _id: p.id || p._id,
    media,
    thumbnail_id: media
      ? [{ url: media.url, alt: media.alt }]
      : p.thumbnail_id || [],
    category_id,
  };
}

/** Convert legacy Mongo-style product filters for the public products API. */
function toPrismaProductFilters(filters: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = { ...filters };

  const legacySlug = out["category_id.slug"] as
    | { $in?: string[]; in?: string[] }
    | string[]
    | string
    | undefined;
  let slugs: string[] = Array.isArray(out.categorySlugs)
    ? (out.categorySlugs as unknown[]).map(String).filter(Boolean)
    : [];

  if (typeof legacySlug === "string") {
    slugs = [legacySlug];
  } else if (Array.isArray(legacySlug)) {
    slugs = legacySlug.map(String);
  } else if (legacySlug && typeof legacySlug === "object") {
    const list = legacySlug.$in || legacySlug.in || [];
    slugs = list.map(String);
  }
  if (legacySlug !== undefined) delete out["category_id.slug"];

  if (slugs.length) out.categorySlugs = slugs;
  else delete out.categorySlugs;

  return out;
}

function buildListQuery(params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
  transformFilters?: (f: Record<string, unknown>) => Record<string, unknown>;
}) {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 100));
  if (params?.filters && Object.keys(params.filters).length) {
    const filters = params.transformFilters
      ? params.transformFilters(params.filters)
      : params.filters;
    qs.set("filters", JSON.stringify(filters));
  }
  return qs.toString();
}

export async function getSiteSettings() {
  return {
    content: {
      id: "default",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico" as string | null,
      footerText:
        "با کودهای ارگانیک آگروهوم، بدون بوی بد و مواد شیمیایی، گیاهانت را زنده نگه دار.",
      socialLinks: [
        { label: "اینستاگرام", href: "https://www.instagram.com/agrohome" },
        { label: "تلگرام", href: "https://t.me/agrohome" },
      ] as Array<{ label?: string; href?: string }>,
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
      ] as Array<{
        title?: string;
        links?: Array<{ title?: string; href?: string }>;
      }>,
    },
  };
}

/** @deprecated use getSiteSettings */
export async function getFooterWidget() {
  const settings = await getSiteSettings();
  return { content: settings.content };
}

export async function getProductCategoriesNested() {
  const res = await apiJson<{ content: CategoryNode[] }>(
    "/product-categories/nested"
  );
  if (!res?.content?.length) return emptyList();
  return { content: normalizeCategoryTree(res.content), total: res.content.length };
}

export async function getProductCategories() {
  const res = await apiJson<{ content: CategoryNode[] }>("/product-categories");
  if (!res?.content?.length) return emptyList();
  return {
    content: normalizeCategoryTree(res.content),
    total: res.content.length,
  };
}

export async function getProductCategoryBySlug(slug: string) {
  const res = await apiJson<{ content: CategoryNode | null }>(
    `/product-categories/${encodeURIComponent(slug)}`
  );
  if (!res?.content) return emptyOne();
  const [normalized] = normalizeCategoryTree([res.content]);
  return { content: normalized };
}

export async function getHomeFaq() {
  return {
    content: {
      content: {
        items: [] as Array<{ _id?: string; title?: string; content?: string }>,
      },
    },
  };
}

export async function getHomeComments() {
  return emptyList();
}

export async function getAvailableProducts() {
  return listProducts({ sort: "-createdAt", limit: 12 });
}

export async function getPublishedBlogCategories() {
  return emptyList();
}

export async function getPublishedBlogs() {
  return emptyList();
}

export async function getProductBySlug(slug: string) {
  const res = await apiJson<{ content: ProductLike | null }>(
    `/products/${encodeURIComponent(slug)}`
  );
  if (!res?.content) return emptyList();
  return { content: [normalizeProduct(res.content)], total: 1 };
}

export async function getProductSpecifications(_productId: string) {
  return emptyList();
}

export async function getSimilarProducts(categorySlug?: string) {
  if (!categorySlug) return emptyList();
  return listProducts({
    sort: "-createdAt",
    limit: 8,
    filters: { categorySlugs: [categorySlug] },
  });
}

export async function getBlogBySlug(_slug: string) {
  return emptyOne();
}

export async function getBlogSuggestions(_categoryId?: string) {
  return emptyList();
}

export async function getBlogCategoryBySlug(_slug: string) {
  return emptyOne();
}

export async function getWidgetKadamat() {
  return { content: [] as unknown[] };
}

type SeoRecord = {
  id?: string;
  targetPath?: string | null;
  targetType?: string | null;
  targetLegacyId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeyWords?: string[];
  canonicalUrl?: string | null;
  pageId?: string | null;
};

function normalizeSeoPath(targetPath: string) {
  const trimmed = String(targetPath || "").trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function getSeoByTarget(targetType: string, targetId: string) {
  if (!targetId) return emptyOne<SeoRecord>();
  const query = buildListQuery({
    filters: { targetType, targetLegacyId: targetId },
    limit: 1,
  });
  const res = await apiJson<{ content: SeoRecord[]; total?: number }>(
    `/seo?${query}`
  );
  if (!res?.content?.[0]) return emptyOne<SeoRecord>();
  return { content: res.content[0] };
}

export async function getSeoByPath(targetPath: string) {
  const path = normalizeSeoPath(targetPath);
  const query = buildListQuery({
    filters: { targetPath: path },
    limit: 1,
  });
  const res = await apiJson<{ content: SeoRecord[]; total?: number }>(
    `/seo?${query}`
  );
  if (!res?.content?.length) return emptyList<SeoRecord>();
  return {
    content: res.content,
    total: res.total ?? res.content.length,
  };
}

export async function getProductSeo(productId: string) {
  return getSeoByTarget("product", productId);
}

export async function getBlogSeo(blogId: string) {
  return getSeoByTarget("blog", blogId);
}

export async function getCategorySeo(categoryId: string) {
  return getSeoByTarget("product_category", categoryId);
}

export async function getBlogCategorySeo(categoryId: string) {
  return getSeoByTarget("blog_category", categoryId);
}

export async function listProducts(params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
}) {
  const query = buildListQuery({
    ...params,
    transformFilters: toPrismaProductFilters,
  });
  const res = await apiJson<{ content: ProductLike[]; total?: number }>(
    `/products?${query}`
  );
  if (!res?.content?.length) {
    return { content: [], total: res?.total ?? 0 };
  }
  return {
    content: res.content.map(normalizeProduct),
    total: res.total ?? res.content.length,
  };
}

export async function listBlogs(_params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
}) {
  return emptyList();
}

export async function getProductComments(productId: string) {
  if (!productId) return emptyList();
  const res = await apiJson<{ content: CommentLike[] }>(
    `/comments/product/${encodeURIComponent(productId)}`
  );
  const list = Array.isArray(res?.content) ? res.content : [];
  return { content: list.map(normalizeComment), total: list.length };
}

export async function getBlogComments(blogId: string) {
  if (!blogId) return emptyList();
  const res = await apiJson<{ content: CommentLike[] }>(
    `/comments/blog/${encodeURIComponent(blogId)}`
  );
  const list = Array.isArray(res?.content) ? res.content : [];
  return { content: list.map(normalizeComment), total: list.length };
}

export async function submitComment(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    content?: unknown;
  };
  if (!res.ok) {
    const err = new Error(data.message || "ثبت نظر ناموفق بود") as Error & {
      response?: { data?: { message?: string } };
    };
    err.response = { data: { message: data.message } };
    throw err;
  }
  return { ok: true as const, content: data.content };
}

export async function submitContact(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false as const };
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

export function mediaUrl(path?: string | null | { url?: string | null }) {
  const raw =
    path && typeof path === 'object' && 'url' in path ? path.url : path;
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  // فایل‌های آپلود روی API هستند؛ بقیه از public فرانت لود می‌شوند
  if (!raw.includes('/uploads/')) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  if (!base) return raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base.replace(/\/$/, '')}${normalized}`;
}

export function mediaAlt(
  value?: string | null | { url?: string | null; alt?: string | null },
  fallback = ''
) {
  if (value && typeof value === 'object' && 'alt' in value) {
    return value.alt || fallback;
  }
  return fallback;
}
