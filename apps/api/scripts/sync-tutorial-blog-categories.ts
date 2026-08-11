/**
 * Sync tutorial blog categories (+ thumbnails) from agrohome.ir into local DB.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const base = (process.env.LEGACY_API_BASE || "").replace(/\/$/, "");
const token = process.env.LEGACY_ACCESS_TOKEN || "";

if (!base || !process.env.DATABASE_URL) {
  console.error("LEGACY_API_BASE and DATABASE_URL are required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const uploadsDir = path.resolve(process.cwd(), "uploads");

const TARGET_TITLES = new Set([
  "چمن و فضای سبز حیاط",
  "درختان میوه و درختچه‌ها",
  "گل‌های باغچه و زینتی",
  "گیاهان آپارتمانی",
]);

async function legacyFetch(pathname: string) {
  const res = await fetch(`${base}/api/v1/${pathname}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `accessToken=${token}`,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${pathname}`);
  return res.json() as Promise<{ content?: unknown[] }>;
}

function thumbUrl(item: Record<string, unknown>): string | null {
  const thumb = item.thumbnail_id;
  if (Array.isArray(thumb) && thumb[0] && typeof thumb[0] === "object") {
    const url = (thumb[0] as { url?: unknown }).url;
    return url ? String(url) : null;
  }
  if (thumb && typeof thumb === "object" && "url" in thumb) {
    return String((thumb as { url: unknown }).url);
  }
  return null;
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function downloadToUploads(remoteUrl: string, alt: string) {
  const fileUrl = absoluteUrl(remoteUrl);
  const res = await fetch(fileUrl, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          Cookie: `accessToken=${token}`,
        }
      : undefined,
  });
  if (!res.ok) throw new Error(`download failed ${res.status} ${fileUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext =
    path.extname(new URL(fileUrl).pathname).toLowerCase() ||
    (res.headers.get("content-type")?.includes("png")
      ? ".png"
      : res.headers.get("content-type")?.includes("webp")
        ? ".webp"
        : ".jpg");
  const hash = createHash("sha1").update(remoteUrl).digest("hex").slice(0, 12);
  const name = `${Date.now()}-${hash}-blog-cat${ext}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), buf);
  return { url: `/uploads/${name}`, alt };
}

async function main() {
  const data = await legacyFetch("blog_category?page=1&limit=100");
  const rows = (data.content || []) as Record<string, unknown>[];

  let parent = await prisma.blogCategory.findFirst({
    where: { slug: "tutorials" },
  });
  if (!parent) {
    parent = await prisma.blogCategory.create({
      data: {
        title: "آموزشی",
        slug: "tutorials",
        publish: true,
      },
    });
    console.log("created parent tutorials");
  }

  const targets = rows.filter((r) => TARGET_TITLES.has(String(r.title || "")));
  console.log(`found ${targets.length} target categories on legacy`);

  for (const raw of targets) {
    const title = String(raw.title);
    const slug = String(raw.slug);
    const legacyId = raw._id ? String(raw._id) : null;
    const remoteThumb = thumbUrl(raw);
    let media: { url: string; alt: string | null } | null = null;
    if (remoteThumb) {
      media = await downloadToUploads(remoteThumb, title);
      console.log(`downloaded ${title} -> ${media.url}`);
    }

    const existing =
      (legacyId &&
        (await prisma.blogCategory.findUnique({ where: { legacyId } }))) ||
      (await prisma.blogCategory.findUnique({ where: { slug } })) ||
      (await prisma.blogCategory.findFirst({ where: { title, parentId: parent.id } }));

    if (existing) {
      const updated = await prisma.blogCategory.update({
        where: { id: existing.id },
        data: {
          title,
          slug,
          publish: true,
          parentId: parent.id,
          legacyId: legacyId || existing.legacyId,
          media: media ?? existing.media ?? undefined,
        },
      });
      console.log(`updated ${updated.slug}`);
    } else {
      const created = await prisma.blogCategory.create({
        data: {
          title,
          slug,
          publish: true,
          parentId: parent.id,
          legacyId,
          media,
        },
      });
      console.log(`created ${created.slug}`);
    }
  }

  const children = await prisma.blogCategory.findMany({
    where: { parentId: parent.id, publish: true },
    orderBy: { title: "asc" },
    select: { title: true, slug: true, media: true },
  });
  console.log("\n=== children of tutorials ===");
  console.log(JSON.stringify(children, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
