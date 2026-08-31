import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Replace ASCII digits 0-9 with Persian digits ۰-۹. */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]!);
}

/** Format a number with fa-IR locale (Persian digits + separators). */
export function formatFaNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toLocaleString("fa-IR", options);
}

/** مسیر آپلود / MediaRef را به URL قابل‌نمایش در ادمین تبدیل می‌کند */
export function mediaUrl(path?: string | null | { url?: string | null }): string {
  const raw =
    typeof path === "string"
      ? path
      : path && typeof path === "object" && typeof path.url === "string"
        ? path.url
        : null;
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  if (!normalized.startsWith("/uploads/")) return normalized;
  // Same-origin (/uploads rewrite or edge proxy); absolute API only if explicitly set for the browser
  const publicBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
  if (publicBase) return `${publicBase}${normalized}`;
  return normalized;
}
