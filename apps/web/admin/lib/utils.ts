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
    path && typeof path === "object" && "url" in path ? path.url : path;
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  if (!normalized.startsWith("/uploads/")) return normalized;
  const base =
    process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3002";
  return `${base.replace(/\/$/, "")}${normalized}`;
}
