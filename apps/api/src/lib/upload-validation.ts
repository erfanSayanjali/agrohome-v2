import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
]);

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const BLOCKED_EXTENSIONS = new Set([
  ".svg",
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".xml",
  ".exe",
  ".php",
  ".sh",
  ".bat",
]);

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function assertSafeUploadFilename(filename: string): void {
  const base = path.basename(filename);
  if (base !== filename || base.includes("..")) {
    throw new UploadValidationError("نام فایل نامعتبر است.");
  }
  const ext = extensionOf(base);
  if (!ext || BLOCKED_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new UploadValidationError("نوع فایل مجاز نیست.");
  }
}

export async function validateUploadedFileBuffer(
  buffer: Buffer,
  originalFilename: string
): Promise<{ mime: string; ext: string }> {
  assertSafeUploadFilename(originalFilename);
  const declaredExt = extensionOf(originalFilename);
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
    throw new UploadValidationError("نوع فایل شناسایی‌شده مجاز نیست.");
  }
  const normalizedExt = EXT_BY_MIME[detected.mime] ?? declaredExt;
  if (normalizedExt !== declaredExt && declaredExt !== ".jpeg") {
    // jpeg may appear as .jpg
    if (!(detected.mime === "image/jpeg" && declaredExt === ".jpeg")) {
      throw new UploadValidationError("پسوند فایل با محتوای واقعی همخوانی ندارد.");
    }
  }
  return { mime: detected.mime, ext: normalizedExt };
}

export async function validateUploadedFilePath(
  filePath: string,
  originalFilename: string
): Promise<{ mime: string; ext: string }> {
  const buffer = await readFile(filePath);
  return validateUploadedFileBuffer(buffer, originalFilename);
}

export function assertSafeMediaUrl(url: string): void {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/uploads/")) {
    throw new UploadValidationError("آدرس رسانه باید در /uploads/ باشد.");
  }
  const base = path.basename(trimmed);
  if (!base || base.includes("..")) {
    throw new UploadValidationError("آدرس رسانه نامعتبر است.");
  }
  assertSafeUploadFilename(base);
}
