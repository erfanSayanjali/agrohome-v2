export function decodePathSegment(value) {
  const raw = String(value || "");
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw.replace(/\+/g, " ");
  }
}

export function lastCategorySlug(categoryParam) {
  const parts = Array.isArray(categoryParam) ? categoryParam : [categoryParam];
  return decodePathSegment(parts.filter(Boolean).at(-1) || "");
}

export function productCategoryHref(...segments) {
  const path = segments
    .filter(Boolean)
    .map((s) => encodeURIComponent(String(s)))
    .join("/");
  return `/products/${path}`;
}
