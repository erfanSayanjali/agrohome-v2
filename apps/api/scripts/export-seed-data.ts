/**
 * Full DB → seed snapshot backup.
 *
 * Writes:
 *   src/seeds/data/snapshot.json   (all tables except OtpChallenge)
 *   src/seeds/data/uploads/*       (every file under apps/api/uploads + any /uploads/ refs)
 *
 * Usage: pnpm db:export-seed
 */
import "dotenv/config";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/prisma";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedDataDir = join(__dirname, "../src/seeds/data");
const outPath = join(seedDataDir, "snapshot.json");
const seedUploadsDir = join(seedDataDir, "uploads");
const appUploadsDir = join(__dirname, "../uploads");

function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

/** Collect every `/uploads/<filename>` reference from arbitrary JSON. */
function collectUploadNames(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    const matches = value.matchAll(/\/uploads\/([^"'?\s#]+)/g);
    for (const m of matches) {
      const name = basename(m[1]);
      if (name) out.add(name);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUploadNames(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectUploadNames(v, out);
  }
}

async function main() {
  const [
    roles,
    users,
    productCategories,
    products,
    productCategoryOnProduct,
    packages,
    specifications,
    productSpecifications,
    tagCategories,
    tags,
    productTags,
    blogCategories,
    blogs,
    comments,
    cmsPages,
    contentBlocks,
    siteSettings,
    seos,
    media,
    contactMessages,
  ] = await Promise.all([
    prisma.role.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productCategoryOnProduct.findMany(),
    prisma.package.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.specification.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productSpecification.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tagCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tag.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productTag.findMany(),
    prisma.blogCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.blog.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.comment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.cmsPage.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contentBlock.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.seo.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const snapshot = serialize({
    exportedAt: new Date().toISOString(),
    roles,
    users,
    productCategories,
    products,
    productCategoryOnProduct,
    packages,
    specifications,
    productSpecifications,
    tagCategories,
    tags,
    productTags,
    blogCategories,
    blogs,
    comments,
    cmsPages,
    contentBlocks,
    siteSettings: siteSettings ?? null,
    seos,
    media,
    contactMessages,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");

  // Fresh uploads backup: wipe previous seed uploads, then copy everything needed.
  if (existsSync(seedUploadsDir)) {
    rmSync(seedUploadsDir, { recursive: true, force: true });
  }
  mkdirSync(seedUploadsDir, { recursive: true });

  const needed = new Set<string>();
  collectUploadNames(snapshot, needed);

  // Always include every file currently in apps/api/uploads (complete media backup).
  if (existsSync(appUploadsDir)) {
    for (const name of readdirSync(appUploadsDir)) {
      if (name === ".gitkeep") continue;
      needed.add(name);
    }
  }

  let copied = 0;
  let missing = 0;
  for (const fileName of [...needed].sort()) {
    const src = join(appUploadsDir, fileName);
    if (!existsSync(src)) {
      console.warn(`Missing upload file: ${src}`);
      missing += 1;
      continue;
    }
    copyFileSync(src, join(seedUploadsDir, fileName));
    copied += 1;
  }

  const counts = Object.fromEntries(
    Object.entries(snapshot as Record<string, unknown>).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.length : v == null ? null : typeof v === "object" ? 1 : v,
    ]),
  );
  console.log("Exported seed snapshot to", outPath);
  console.log(counts);
  console.log(
    `Copied ${copied} upload file(s) → ${seedUploadsDir}` +
      (missing ? ` (${missing} missing)` : ""),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
