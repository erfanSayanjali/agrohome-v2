import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
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
    cmsRegions,
    contentBlocks,
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
    prisma.cmsRegion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contentBlock.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
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
    cmsRegions,
    contentBlocks,
    seos,
    media,
    contactMessages,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");

  mkdirSync(seedUploadsDir, { recursive: true });
  let copied = 0;
  for (const item of media) {
    const url = item.url || "";
    if (!url.startsWith("/uploads/")) continue;
    const fileName = basename(url);
    const src = join(appUploadsDir, fileName);
    if (!existsSync(src)) {
      console.warn(`Missing upload file: ${src}`);
      continue;
    }
    copyFileSync(src, join(seedUploadsDir, fileName));
    copied += 1;
  }

  const counts = Object.fromEntries(
    Object.entries(snapshot as Record<string, unknown>).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.length : v,
    ]),
  );
  console.log("Exported seed snapshot to", outPath);
  console.log(counts);
  console.log(`Copied ${copied} upload file(s) → ${seedUploadsDir}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
