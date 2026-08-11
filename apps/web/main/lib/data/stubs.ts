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

function normalizeCategoryTree(nodes: CategoryNode[] = []): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    _id: node.id || node._id,
    children: normalizeCategoryTree(node.children || []),
  }));
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
  return emptyList();
}

export async function getPublishedBlogCategories() {
  return emptyList();
}

export async function getPublishedBlogs() {
  return emptyList();
}

export async function getProductBySlug(_slug: string) {
  return emptyList();
}

export async function getProductSpecifications(_productId: string) {
  return emptyList();
}

export async function getSimilarProducts(_categorySlug?: string) {
  return emptyList();
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

export async function getSeoByPath(_targetPath: string) {
  return emptyList();
}

export async function getProductSeo(_productId: string) {
  return emptyOne();
}

export async function getBlogSeo(_blogId: string) {
  return emptyOne();
}

export async function getCategorySeo(_categoryId: string) {
  return emptyOne();
}

export async function getBlogCategorySeo(_categoryId: string) {
  return emptyOne();
}

export async function listProducts(_params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
}) {
  return emptyList();
}

export async function listBlogs(_params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
}) {
  return emptyList();
}

export async function getProductComments(_productId: string) {
  return emptyList();
}

export async function getBlogComments(_blogId: string) {
  return emptyList();
}

export async function submitComment(_payload: Record<string, unknown>) {
  return { ok: true as const };
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
