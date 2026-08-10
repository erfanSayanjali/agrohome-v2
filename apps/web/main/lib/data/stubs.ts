/** Stub data layer — empty shapes until the new API is wired. */

type ApiList<T = unknown> = { content: T[]; total?: number };
type ApiOne<T = unknown> = { content: T | null };

const emptyList = <T = unknown>(): ApiList<T> => ({ content: [], total: 0 });
const emptyOne = <T = unknown>(): ApiOne<T> => ({ content: null });

export async function getFooterWidget() {
  return {
    content: {
      content: {
        items: [] as Array<{
          widgetType?: string;
          title?: string;
          content?: { items?: Array<{ href?: string; title?: string }> } | string;
        }>,
      },
    },
  };
}

export async function getProductCategoriesNested() {
  return emptyList();
}

export async function getProductCategories() {
  return emptyList();
}

export async function getProductCategoryBySlug(_slug: string) {
  return emptyOne();
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

export async function submitContact(_payload: Record<string, unknown>) {
  return { ok: true as const };
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
