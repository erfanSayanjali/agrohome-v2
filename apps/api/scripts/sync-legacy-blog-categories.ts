/**
 * Sync blog categories from agrohome.ir (legacy API) into local DB:
 * - root «راهنمای استفاده» (tutorials)
 * - child categories with parent links
 * - download thumbnails into ./uploads
 * - unpublish old seed-only tutorial subcategories not on legacy
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-legacy-blog-categories.ts
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { mapBlogCategory } from "./mappers/index";

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

const uploadsDir = path.resolve(process.cwd(), "uploads");

/** Old seed tutorial slugs — not present on legacy admin */
const SEED_ONLY_LEGACY_IDS = new Set([
  "69356bfcec8b3f0d7349d1b7",
  "69357abe5cffd175356e437e",
  "69357b055cffd175356e43ad",
  "69357b335cffd175356e43da",
]);

async function legacyFetch(pathname: string, search = "") {
  const res = await fetch(`${base}/api/v1/${pathname}${search}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `accessToken=${token}`,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${pathname}`);
  return res.json() as Promise<{ content?: Record<string, unknown>[] }>;
}

async function fetchAll(pathname: string) {
  const items: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await legacyFetch(pathname, `?page=${page}&limit=50`);
    const chunk = Array.isArray(data.content) ? data.content : [];
    items.push(...chunk);
    totalPages = Math.max(1, Math.ceil(chunk.length / 50) || 1);
    if (!chunk.length) break;
    page += 1;
  }
  return items;
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function downloadMedia(
  remoteUrl: string,
  alt: string | null
): Promise<{ url: string; alt: string | null }> {
  const fileUrl = absoluteUrl(remoteUrl);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Cookie: `accessToken=${token}`,
  };
  const res = await fetch(fileUrl, { headers });
  if (!res.ok) throw new Error(`${res.status} for ${fileUrl}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  const ext =
    path.extname(new URL(fileUrl).pathname).toLowerCase() ||
    (ct.includes("webp") ? ".webp" : ct.includes("png") ? ".png" : ".jpg");
  const hash = createHash("sha1").update(remoteUrl).digest("hex").slice(0, 12);
  const name = `${Date.now()}-${hash}-blog-cat${ext}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), buf);
  return { url: `/uploads/${name}`, alt };
}

async function resolveIdByLegacy(legacy: string | null | undefined) {
  if (!legacy) return null;
  const row = await prisma.blogCategory.findUnique({
    where: { legacyId: legacy },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function main() {
  console.log(`Sync blog categories from ${base}`);

  const rows = await fetchAll("blog_category");
  console.log(`legacy categories: ${rows.length}`);

  const sorted = [...rows].sort((a, b) => {
    const ap = a.parent_id ? 1 : 0;
    const bp = b.parent_id ? 1 : 0;
    return ap - bp;
  });

  let written = 0;
  for (const raw of sorted) {
    const mapped = mapBlogCategory(raw);
    if (!mapped.legacyId || !mapped.slug) continue;

    let parentId = await resolveIdByLegacy(mapped.parentLegacyId);

    // Root «tutorials» may already exist from seed without legacyId
    if (!parentId && mapped.parentLegacyId) {
      const parentRaw = rows.find(
        (r) => String(r._id ?? r.id) === mapped.parentLegacyId
      );
      if (parentRaw) {
        const parentMapped = mapBlogCategory(parentRaw);
        const bySlug = await prisma.blogCategory.findUnique({
          where: { slug: parentMapped.slug },
        });
        if (bySlug && !bySlug.legacyId) {
          await prisma.blogCategory.update({
            where: { id: bySlug.id },
            data: {
              legacyId: parentMapped.legacyId,
              title: parentMapped.title,
              publish: parentMapped.publish,
            },
          });
          parentId = bySlug.id;
        }
      }
    }

    let media = mapped.media;
    if (media?.url && !media.url.startsWith("/uploads/")) {
      try {
        media = await downloadMedia(media.url, media.alt);
        console.log(`  media ${mapped.slug} -> ${media.url}`);
      } catch (err) {
        console.warn(`  media download failed ${mapped.slug}`, err);
      }
    }

    const byLegacy = await prisma.blogCategory.findUnique({
      where: { legacyId: mapped.legacyId },
    });
    const bySlug = await prisma.blogCategory.findUnique({
      where: { slug: mapped.slug },
    });

    if (byLegacy) {
      await prisma.blogCategory.update({
        where: { id: byLegacy.id },
        data: {
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          media: media as object | null,
          parentId,
        },
      });
    } else if (bySlug && !bySlug.legacyId) {
      await prisma.blogCategory.update({
        where: { id: bySlug.id },
        data: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          description: mapped.description,
          publish: mapped.publish,
          media: media as object | null,
          parentId,
        },
      });
    } else {
      await prisma.blogCategory.create({
        data: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          media: media as object | null,
          parentId,
        },
      });
    }

    written += 1;
    console.log(`  synced ${mapped.slug} (parent=${parentId ?? "root"})`);
  }

  const unpublished = await prisma.blogCategory.updateMany({
    where: { legacyId: { in: [...SEED_ONLY_LEGACY_IDS] } },
    data: { publish: false },
  });
  if (unpublished.count) {
    console.log(`unpublished ${unpublished.count} old seed-only subcategories`);
  }

  // Re-link blogs to categories by legacy category id
  const blogs = await fetchAll("blog");
  let relinked = 0;
  for (const raw of blogs) {
    const legacyId = String(raw._id ?? raw.id ?? "");
    const cat = raw.category_id as Record<string, unknown> | string | null;
    const catLegacy =
      typeof cat === "string" ? cat : cat ? String(cat._id ?? cat.id ?? "") : null;
    if (!legacyId || !catLegacy) continue;
    const categoryId = await resolveIdByLegacy(catLegacy);
    if (!categoryId) continue;
    await prisma.blog.updateMany({
      where: { legacyId },
      data: { categoryId },
    });
    relinked += 1;
  }

  const tree = await prisma.blogCategory.findMany({
    where: { OR: [{ legacyId: { not: null } }, { slug: "tutorials" }] },
    orderBy: { slug: "asc" },
    select: {
      title: true,
      slug: true,
      publish: true,
      legacyId: true,
      media: true,
      parent: { select: { slug: true } },
      _count: { select: { blogs: true } },
    },
  });

  console.log("\n=== Category tree ===");
  for (const c of tree) {
    console.log(
      `${c.parent?.slug ? "  └ " : ""}${c.title} (${c.slug}) publish=${c.publish} blogs=${c._count.blogs} media=${Boolean(c.media)}`
    );
  }

  console.log(`\nDone: synced=${written} blogsRelinked=${relinked}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
