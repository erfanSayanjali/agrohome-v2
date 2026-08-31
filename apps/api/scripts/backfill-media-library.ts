/**
 * Register /uploads/... files into the Media table so they appear in admin media library.
 *
 * Sources:
 * - URLs referenced by products, blogs, CMS blocks, site settings, etc.
 * - Files present in ./uploads that are not yet registered
 *
 * Usage:
 *   pnpm exec tsx scripts/backfill-media-library.ts
 *   pnpm exec tsx scripts/backfill-media-library.ts --dry-run
 */
import "dotenv/config";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { toMediaRef } from "@agrohome/shared";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  allUsedUrls,
  buildMediaUsageIndex,
  normalizeMediaUrl,
} from "../src/lib/media-usage";
import { normalizeGallery } from "../src/lib/media";

const dryRun = process.argv.includes("--dry-run");
const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function mimeFromExt(ext: string): string | null {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".pdf":
      return "application/pdf";
    default:
      return null;
  }
}

function mediaTypeFromMime(mime: string | null): string {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

function fileNameFromUrl(url: string) {
  return path.basename(url);
}

async function collectAltByUrl(): Promise<Map<string, string>> {
  const altByUrl = new Map<string, string>();

  const remember = (url: string | null | undefined, alt: string | null | undefined) => {
    const key = normalizeMediaUrl(url);
    const value = alt?.trim();
    if (!key || !value || altByUrl.has(key)) return;
    altByUrl.set(key, value);
  };

  const [products, blogs, blogCategories, users, settings] = await Promise.all([
    prisma.product.findMany({ select: { media: true, gallery: true } }),
    prisma.blog.findMany({ select: { media: true } }),
    prisma.blogCategory.findMany({ select: { media: true } }),
    prisma.user.findMany({ select: { media: true } }),
    prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { logoUrl: true, faviconUrl: true },
    }),
  ]);

  for (const row of products) {
    const media = toMediaRef(row.media);
    remember(media?.url, media?.alt);
    for (const item of normalizeGallery(row.gallery)) {
      remember(item.url, item.alt ?? null);
    }
  }

  for (const row of blogs) {
    const media = toMediaRef(row.media);
    remember(media?.url, media?.alt);
  }

  for (const row of blogCategories) {
    const media = toMediaRef(row.media);
    remember(media?.url, media?.alt);
  }

  for (const row of users) {
    const media = toMediaRef(row.media);
    remember(media?.url, media?.alt);
  }

  if (settings) {
    remember(settings.logoUrl, "لوگوی سایت");
    remember(settings.faviconUrl, "فاوآیکون");
  }

  return altByUrl;
}

async function main() {
  console.log(`Backfill media library${dryRun ? " (DRY RUN)" : ""}`);

  const usageIndex = await buildMediaUsageIndex(prisma);
  const usedUrls = new Set(allUsedUrls(usageIndex));

  try {
    const files = await readdir(uploadsDir);
    for (const file of files) {
      usedUrls.add(`/uploads/${file}`);
    }
  } catch {
    console.warn(`uploads dir not found: ${uploadsDir}`);
  }

  const existing = await prisma.media.findMany({ select: { url: true } });
  const existingUrls = new Set(
    existing
      .map((row) => normalizeMediaUrl(row.url))
      .filter((url): url is string => Boolean(url))
  );

  const altByUrl = await collectAltByUrl();
  const toCreate = [...usedUrls]
    .map((url) => normalizeMediaUrl(url))
    .filter((url): url is string => Boolean(url && url.startsWith("/uploads/")))
    .filter((url) => {
      const base = fileNameFromUrl(url);
      return base !== ".gitkeep" && !base.startsWith(".");
    })
    .filter((url) => !existingUrls.has(url))
    .sort();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of toCreate) {
    const name = fileNameFromUrl(url);
    const ext = path.extname(name);
    const mimeType = mimeFromExt(ext);
    const type = mediaTypeFromMime(mimeType);
    const alt = altByUrl.get(url) ?? name;

    let size: number | null = null;
    try {
      const fileStat = await stat(path.join(uploadsDir, name));
      size = fileStat.size;
    } catch {
      // file may be missing on disk but still referenced
    }

    try {
      if (dryRun) {
        console.log(`DRY  create ${url} alt="${alt}"`);
        created += 1;
        continue;
      }

      await prisma.media.create({
        data: {
          url,
          name,
          alt,
          mimeType,
          type,
          size,
        },
      });
      created += 1;
      console.log(`OK   ${url}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${url}`, err);
    }
  }

  skipped = existingUrls.size;

  console.log("\n=== Summary ===");
  console.log(
    `candidates=${toCreate.length} created=${created} alreadyRegistered=${skipped} failed=${failed}`
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
