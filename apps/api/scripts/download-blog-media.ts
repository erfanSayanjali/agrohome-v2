/**
 * Download blog thumbnail + inline content images from LEGACY_API_BASE into ./uploads
 * and rewrite Blog.media / Blog.content URLs to /uploads/...
 *
 * Usage:
 *   pnpm exec tsx scripts/download-blog-media.ts
 *   pnpm exec tsx scripts/download-blog-media.ts --dry-run
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type MediaRef = { url: string; alt?: string | null };

const dryRun = process.argv.includes("--dry-run");
const base = (process.env.LEGACY_API_BASE || "https://agrohome.ir").replace(/\/$/, "");
const token = process.env.LEGACY_ACCESS_TOKEN || "";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const uploadsDir = path.resolve(process.cwd(), "uploads");

function isMediaRef(value: unknown): value is MediaRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as MediaRef).url === "string" &&
    Boolean((value as MediaRef).url.trim())
  );
}

function alreadyLocal(url: string) {
  return url.startsWith("/uploads/");
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function safeExt(url: string, contentType: string | null) {
  const fromUrl = path.extname(new URL(absoluteUrl(url)).pathname);
  if (fromUrl && fromUrl.length <= 8) return fromUrl.toLowerCase();
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return ".jpg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".bin";
}

function localName(remoteUrl: string, ext: string) {
  const hash = createHash("sha1").update(remoteUrl).digest("hex").slice(0, 12);
  const baseName = path
    .basename(new URL(absoluteUrl(remoteUrl)).pathname)
    .replace(path.extname(new URL(absoluteUrl(remoteUrl)).pathname), "")
    .replace(/[^\w\u0600-\u06FF.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${Date.now()}-${hash}-${baseName || "image"}${ext}`;
}

function isLegacyMediaUrl(url: string) {
  if (alreadyLocal(url)) return false;
  if (/^https?:\/\//i.test(url)) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const legacyHost = new URL(base).hostname.replace(/^www\./, "");
      return (
        host === legacyHost ||
        url.includes("/uploads/") ||
        url.includes("/static/")
      );
    } catch {
      return false;
    }
  }
  return url.startsWith("/uploads/") || url.startsWith("/static/");
}

async function downloadOne(remoteUrl: string, cache: Map<string, string>) {
  if (cache.has(remoteUrl)) return cache.get(remoteUrl)!;
  if (alreadyLocal(remoteUrl)) {
    cache.set(remoteUrl, remoteUrl);
    return remoteUrl;
  }

  const fileUrl = absoluteUrl(remoteUrl);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.Cookie = `accessToken=${token}`;
  }

  if (dryRun) {
    const fake = `/uploads/dry-run-${createHash("sha1").update(remoteUrl).digest("hex").slice(0, 8)}.jpg`;
    cache.set(remoteUrl, fake);
    console.log(`DRY  ${remoteUrl} -> ${fake}`);
    return fake;
  }

  const res = await fetch(fileUrl, { headers });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${fileUrl}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = safeExt(remoteUrl, res.headers.get("content-type"));
  const name = localName(remoteUrl, ext);
  const dest = path.join(uploadsDir, name);
  await writeFile(dest, buf);
  const localUrl = `/uploads/${name}`;
  cache.set(remoteUrl, localUrl);
  console.log(`OK   ${remoteUrl} -> ${localUrl} (${buf.length} bytes)`);
  return localUrl;
}

async function rewriteRef(
  ref: MediaRef,
  cache: Map<string, string>
): Promise<{ ref: MediaRef; changed: boolean }> {
  if (!isLegacyMediaUrl(ref.url)) return { ref, changed: false };
  const localUrl = await downloadOne(ref.url, cache);
  return {
    ref: { url: localUrl, alt: ref.alt ?? null },
    changed: localUrl !== ref.url,
  };
}

async function rewriteContentHtml(
  html: string | null,
  cache: Map<string, string>
): Promise<{ html: string | null; changed: boolean }> {
  if (!html) return { html, changed: false };

  let changed = false;
  let result = html;

  const imgRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[1];
    if (!isLegacyMediaUrl(src)) continue;
    const localUrl = await downloadOne(src, cache);
    if (localUrl !== src) {
      result = result.split(src).join(localUrl);
      changed = true;
    }
  }

  const urlRe =
    /((?:src|href)=["'])([^"']*(?:\/uploads\/[^"']+|https?:\/\/(?:www\.)?agrohome\.ir\/uploads\/[^"']+))(["'])/gi;
  urlRe.lastIndex = 0;
  while ((m = urlRe.exec(result)) !== null) {
    const src = m[2];
    if (!isLegacyMediaUrl(src)) continue;
    const localUrl = await downloadOne(src, cache);
    if (localUrl !== src) {
      result = result.split(src).join(localUrl);
      changed = true;
    }
  }

  return { html: result, changed };
}

async function main() {
  console.log(`Download blog media from ${base}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  if (!dryRun) await mkdir(uploadsDir, { recursive: true });

  const blogs = await prisma.blog.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, slug: true, media: true, content: true },
  });

  const categories = await prisma.blogCategory.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, slug: true, media: true },
  });

  const cache = new Map<string, string>();
  let updatedBlogs = 0;
  let updatedCategories = 0;
  let failed = 0;

  for (const blog of blogs) {
    try {
      let changed = false;
      let media: MediaRef | null = null;

      if (isMediaRef(blog.media)) {
        const result = await rewriteRef(blog.media, cache);
        media = result.ref;
        changed = changed || result.changed;
      }

      const contentResult = await rewriteContentHtml(blog.content, cache);
      changed = changed || contentResult.changed;

      if (!changed) continue;

      if (!dryRun) {
        await prisma.blog.update({
          where: { id: blog.id },
          data: {
            media: media ?? undefined,
            content: contentResult.html,
          },
        });
      }
      updatedBlogs += 1;
      console.log(`blog ${blog.slug}: updated`);
    } catch (err) {
      failed += 1;
      console.error(`blog ${blog.slug}: failed`, err);
    }
  }

  for (const category of categories) {
    try {
      if (!isMediaRef(category.media)) continue;
      const result = await rewriteRef(category.media, cache);
      if (!result.changed) continue;

      if (!dryRun) {
        await prisma.blogCategory.update({
          where: { id: category.id },
          data: { media: result.ref },
        });
      }
      updatedCategories += 1;
      console.log(`blog_category ${category.slug}: updated`);
    } catch (err) {
      failed += 1;
      console.error(`blog_category ${category.slug}: failed`, err);
    }
  }

  console.log("\n=== Summary ===");
  console.log(
    `blogs=${blogs.length} updated=${updatedBlogs} categories=${categories.length} catUpdated=${updatedCategories} failed=${failed} files=${cache.size}`
  );
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
