/**
 * Download product media/gallery images from LEGACY_API_BASE into ./uploads
 * and rewrite Product.media / Product.gallery URLs to /uploads/...
 *
 * Usage:
 *   pnpm exec tsx scripts/download-product-media.ts
 *   pnpm exec tsx scripts/download-product-media.ts --dry-run
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type MediaRef = { url: string; alt?: string | null };

const dryRun = process.argv.includes("--dry-run");
const base = (process.env.LEGACY_API_BASE || "").replace(/\/$/, "");
const token = process.env.LEGACY_ACCESS_TOKEN || "";

if (!base) {
  console.error("LEGACY_API_BASE is required");
  process.exit(1);
}
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
  if (alreadyLocal(ref.url)) return { ref, changed: false };
  const localUrl = await downloadOne(ref.url, cache);
  return {
    ref: { url: localUrl, alt: ref.alt ?? null },
    changed: localUrl !== ref.url,
  };
}

async function main() {
  console.log(`Download product media from ${base}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  if (!dryRun) await mkdir(uploadsDir, { recursive: true });

  const products = await prisma.product.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, slug: true, media: true, gallery: true },
  });

  const cache = new Map<string, string>();
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      let changed = false;
      let media: MediaRef | null = null;
      if (isMediaRef(product.media)) {
        const result = await rewriteRef(product.media, cache);
        media = result.ref;
        changed = changed || result.changed;
      }

      const galleryIn = Array.isArray(product.gallery) ? product.gallery : [];
      const gallery: MediaRef[] = [];
      for (const item of galleryIn) {
        if (!isMediaRef(item)) continue;
        const result = await rewriteRef(item, cache);
        gallery.push(result.ref);
        changed = changed || result.changed;
      }

      if (!changed) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            media: media ?? undefined,
            gallery,
          },
        });
      }
      updated += 1;
      console.log(`product ${product.slug}: updated`);
    } catch (err) {
      failed += 1;
      console.error(`product ${product.slug}: failed`, err);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`products=${products.length} updated=${updated} skipped=${skipped} failed=${failed} files=${cache.size}`);
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
