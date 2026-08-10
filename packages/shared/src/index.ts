export type MediaRef = {
  url: string;
  alt?: string | null;
};

/** نرمال‌سازی هر شکل قدیمی/جدید به MediaRef */
export function toMediaRef(value: unknown): MediaRef | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const url = value.trim();
    return url ? { url, alt: null } : null;
  }
  if (Array.isArray(value)) return toMediaRef(value[0]);
  if (typeof value === "object" && value !== null && "url" in value) {
    const raw = value as { url?: unknown; alt?: unknown };
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const alt =
      raw.alt == null || raw.alt === "" ? null : String(raw.alt);
    return { url, alt };
  }
  return null;
}

export function mediaUrlOf(value: unknown): string {
  return toMediaRef(value)?.url || "";
}

export function mediaAltOf(value: unknown, fallback = ""): string {
  return toMediaRef(value)?.alt || fallback;
}

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  media?: MediaRef | null;
  isFeatured?: boolean;
  status: "AVAILABLE" | "UNAVAILABLE";
};

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  media?: MediaRef | null;
  status: "published" | "draft";
};

export type CategoryTreeNode = {
  id: string;
  title: string;
  slug: string;
  children?: CategoryTreeNode[];
};

export const API_PREFIX = "/api/v1";

export type ListMeta = {
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = {
  content: T[];
  total: number;
  meta: ListMeta;
};

export type ApiOk<T> = {
  content: T;
  total?: number;
  meta?: ListMeta | Record<string, unknown>;
};
