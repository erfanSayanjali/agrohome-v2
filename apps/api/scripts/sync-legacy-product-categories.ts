/**
 * Replace all local product categories with normalized data from agrohome.ir,
 * then re-assign product ↔ category links from legacy product records.
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-legacy-product-categories.ts
 *   pnpm exec tsx scripts/sync-legacy-product-categories.ts --dry-run
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { CMS_LAYOUT_TAG, PRODUCTS_TAG } from "@agrohome/shared";
import { mapProduct, mapProductCategory } from "./mappers/index";

const dryRun = process.argv.includes("--dry-run");
const base = (process.env.LEGACY_API_BASE || "https://agrohome.ir").replace(/\/$/, "");
const token = process.env.LEGACY_ACCESS_TOKEN || "";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!token) {
  console.error("LEGACY_ACCESS_TOKEN is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function legacyFetch(pathname: string, search = "") {
  const res = await fetch(`${base}/api/v1/${pathname}${search}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `accessToken=${token}`,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${pathname}`);
  return res.json() as Promise<{ content?: Record<string, unknown>[]; total?: number }>;
}

async function fetchAll(pathname: string) {
  const items: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await legacyFetch(pathname, `?page=${page}&limit=50`);
    const chunk = Array.isArray(data.content) ? data.content : [];
    items.push(...chunk);
    const total = Number(data.total ?? chunk.length);
    totalPages = Math.max(1, Math.ceil(total / 50));
    if (!chunk.length) break;
    page += 1;
    if (page > 200) break;
  }

  return items;
}

async function revalidateSiteCache() {
  const site = (process.env.MAIN_SITE_URL || "http://localhost:4000").replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn("REVALIDATE_SECRET missing — restart main dev server or call /api/revalidate manually");
    return;
  }

  const res = await fetch(`${site}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify({
      tags: [PRODUCTS_TAG, CMS_LAYOUT_TAG],
      paths: ["/", "/products"],
    }),
  });
  if (!res.ok) {
    console.warn(`site revalidate failed: ${res.status}`);
    return;
  }
  console.log("site cache revalidated");
}

async function publishImportedCategories() {
  if (dryRun) return 0;
  const result = await prisma.productCategory.updateMany({
    where: { legacyId: { not: null } },
    data: { publish: true },
  });
  if (result.count) console.log(`published ${result.count} legacy categories`);
  return result.count;
}

async function resolveCategoryId(legacy: string | null | undefined) {
  if (!legacy) return null;
  const row = await prisma.productCategory.findUnique({
    where: { legacyId: legacy },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function wipeLocalCategories() {
  const beforeLinks = await prisma.productCategoryOnProduct.count();
  const beforeCats = await prisma.productCategory.count();
  console.log(`local before wipe: categories=${beforeCats} links=${beforeLinks}`);

  if (dryRun) {
    console.log("[dry-run] would delete all product categories and links");
    return;
  }

  await prisma.productCategoryOnProduct.deleteMany({});
  await prisma.productCategory.updateMany({ data: { parentId: null } });
  await prisma.productCategory.deleteMany({});
  console.log("wiped local product categories");
}

async function importCategories(rows: Record<string, unknown>[]) {
  const sorted = [...rows].sort((a, b) => {
    const ap = a.parent_id ? 1 : 0;
    const bp = b.parent_id ? 1 : 0;
    return ap - bp;
  });

  let written = 0;
  for (const raw of sorted) {
    const mapped = mapProductCategory(raw);
    if (!mapped.legacyId || !mapped.slug) continue;

    const parentId = await resolveCategoryId(mapped.parentLegacyId);

    if (dryRun) {
      written += 1;
      console.log(`  [dry-run] ${mapped.slug} parent=${mapped.parentLegacyId ?? "root"}`);
      continue;
    }

    await prisma.productCategory.create({
      data: {
        legacyId: mapped.legacyId,
        title: mapped.title,
        slug: mapped.slug,
        description: mapped.description,
        publish: true,
        sortOrder: mapped.sortOrder,
        parentId,
      },
    });
    written += 1;
    console.log(`  imported ${mapped.slug} (parent=${parentId ?? "root"})`);
  }

  return written;
}

async function relinkProducts(rows: Record<string, unknown>[]) {
  let relinked = 0;
  let skippedNoProduct = 0;
  let skippedNoCategory = 0;
  let cleared = 0;

  for (const raw of rows) {
    const mapped = mapProduct(raw);
    if (!mapped.legacyId) continue;

    const product = await prisma.product.findUnique({
      where: { legacyId: mapped.legacyId },
      select: { id: true, slug: true },
    });
    if (!product) {
      skippedNoProduct += 1;
      continue;
    }

    const categoryIds: string[] = [];
    for (const catLegacy of mapped.categoryLegacyIds) {
      const categoryId = await resolveCategoryId(catLegacy);
      if (categoryId) categoryIds.push(categoryId);
    }

    if (!categoryIds.length) {
      skippedNoCategory += 1;
      continue;
    }

    if (dryRun) {
      relinked += 1;
      console.log(
        `  [dry-run] ${product.slug} -> ${mapped.categoryLegacyIds.join(", ")}`
      );
      continue;
    }

    const removed = await prisma.productCategoryOnProduct.deleteMany({
      where: { productId: product.id },
    });
    cleared += removed.count;

    await prisma.productCategoryOnProduct.createMany({
      data: categoryIds.map((categoryId) => ({
        productId: product.id,
        categoryId,
      })),
      skipDuplicates: true,
    });
    relinked += 1;
  }

  return { relinked, skippedNoProduct, skippedNoCategory, cleared };
}

async function main() {
  console.log(`Sync product categories from ${base}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  const categoryRows = await fetchAll("product_category");
  const productRows = await fetchAll("product");
  console.log(`legacy: categories=${categoryRows.length} products=${productRows.length}`);

  await wipeLocalCategories();
  const imported = await importCategories(categoryRows);
  await publishImportedCategories();
  const linkStats = await relinkProducts(productRows);

  if (!dryRun) {
    await revalidateSiteCache();
    const tree = await prisma.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      select: {
        title: true,
        slug: true,
        publish: true,
        legacyId: true,
        parent: { select: { slug: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    console.log("\n=== Category tree ===");
    for (const c of tree) {
      const prefix = c.parent?.slug ? "  └ " : "";
      console.log(
        `${prefix}${c.title} (${c.slug}) publish=${c.publish} products=${c._count.products} children=${c._count.children}`
      );
    }

    const orphanProducts = await prisma.product.findMany({
      where: { categories: { none: {} } },
      select: { slug: true, legacyId: true },
      orderBy: { slug: "asc" },
    });
    if (orphanProducts.length) {
      console.log(`\n⚠ products without category (${orphanProducts.length}):`);
      for (const p of orphanProducts.slice(0, 20)) {
        console.log(`  ${p.slug} legacyId=${p.legacyId}`);
      }
      if (orphanProducts.length > 20) {
        console.log(`  ... and ${orphanProducts.length - 20} more`);
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`categories imported: ${imported}`);
  console.log(
    `products relinked: ${linkStats.relinked} | no local product: ${linkStats.skippedNoProduct} | no category on legacy: ${linkStats.skippedNoCategory} | links cleared: ${linkStats.cleared}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
