/**
 * Import content from the current external Agrohome API into the new Prisma DB.
 *
 * Env:
 *   LEGACY_API_BASE      e.g. http://agrohome.ir
 *   LEGACY_ACCESS_TOKEN  accessToken cookie value (admin)
 *   DATABASE_URL         target Postgres
 *
 * Flags:
 *   --dry-run            fetch & map only (no DB writes)
 *   --download-media     download media files into ./storage/legacy (metadata always imported)
 *   --only=<entity>      import a single entity (e.g. product_category)
 *
 * Usage:
 *   pnpm --filter @agrohome/api import:legacy
 *   pnpm --filter @agrohome/api import:legacy -- --dry-run
 *   pnpm --filter @agrohome/api import:legacy -- --only=product_category
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  mapBlog,
  mapBlogCategory,
  mapComment,
  mapContact,
  mapMedia,
  mapPackage,
  mapProduct,
  mapProductCategory,
  mapProductSpecification,
  mapRole,
  mapSeo,
  mapSpecification,
  mapTag,
  mapTagCategory,
  mapUser,
} from "./mappers/index";

type Stats = { read: number; written: number; errors: number };

const argv = process.argv.slice(2);
const args = new Set(argv);
const dryRun = args.has("--dry-run");
const downloadMedia = args.has("--download-media");
const onlyArg = argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length).trim() : null;

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

if (!token) {
  console.error("LEGACY_ACCESS_TOKEN is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const stats: Record<string, Stats> = {};

function bump(entity: string, field: keyof Stats, n = 1) {
  if (!stats[entity]) stats[entity] = { read: 0, written: 0, errors: 0 };
  stats[entity][field] += n;
}

async function legacyFetch(pathname: string, search = '') {
  const url = `${base}/api/v1/${pathname}${search}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `accessToken=${token}`,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<{ content?: unknown; total?: number }>;
}

async function fetchAll(
  entity: string,
  pathname: string,
  pageSize = 50
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await legacyFetch(
      pathname,
      `?page=${page}&limit=${pageSize}`
    );
    const chunk = Array.isArray(data.content)
      ? (data.content as Record<string, unknown>[])
      : data.content
        ? [data.content as Record<string, unknown>]
        : [];
    items.push(...chunk);
    bump(entity, 'read', chunk.length);

    const total = Number(data.total ?? chunk.length);
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (chunk.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  return items;
}

async function resolveIdByLegacy(
  model:
    | 'role'
    | 'user'
    | 'product'
    | 'productCategory'
    | 'specification'
    | 'blogCategory'
    | 'blog'
    | 'comment'
    | 'tagCategory'
    | 'tag',
  legacy: string | null | undefined
): Promise<string | null> {
  if (!legacy) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (prisma as any)[model].findUnique({
    where: { legacyId: legacy },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function importRoles() {
  const rows = await fetchAll('role', 'role');
  for (const raw of rows) {
    try {
      const mapped = mapRole(raw);
      if (!mapped.legacyId) continue;
      if (dryRun) {
        bump('role', 'written');
        continue;
      }
      await prisma.role.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          permissions: mapped.permissions as object,
        },
        update: {
          title: mapped.title,
          permissions: mapped.permissions as object,
        },
      });
      bump('role', 'written');
    } catch (e) {
      bump('role', 'errors');
      console.error('role error', e);
    }
  }
}

async function importUsers() {
  const rows = await fetchAll('user', 'user');
  for (const raw of rows) {
    try {
      const mapped = mapUser(raw);
      if (!mapped.legacyId || !mapped.phone) continue;
      const roleId = await resolveIdByLegacy('role', mapped.roleLegacyId);
      if (dryRun) {
        bump('user', 'written');
        continue;
      }
      await prisma.user.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          phone: mapped.phone,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          nickname: mapped.nickname,
          media: mapped.media as object | null,
          roleId,
        },
        update: {
          phone: mapped.phone,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          nickname: mapped.nickname,
          media: mapped.media as object | null,
          roleId,
        },
      });
      bump('user', 'written');
    } catch (e) {
      bump('user', 'errors');
      console.error('user error', e);
    }
  }
}

async function importProductCategories() {
  const rows = await fetchAll('product_category', 'product_category');
  // parents first
  const sorted = [...rows].sort((a, b) => {
    const ap = a.parent_id ? 1 : 0;
    const bp = b.parent_id ? 1 : 0;
    return ap - bp;
  });

  for (const raw of sorted) {
    try {
      const mapped = mapProductCategory(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      const parentId = await resolveIdByLegacy(
        'productCategory',
        mapped.parentLegacyId
      );
      if (dryRun) {
        bump('product_category', 'written');
        continue;
      }
      await prisma.productCategory.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          sortOrder: mapped.sortOrder,
          parentId,
        },
        update: {
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          sortOrder: mapped.sortOrder,
          parentId,
        },
      });
      bump('product_category', 'written');
    } catch (e) {
      bump('product_category', 'errors');
      console.error('product_category error', e);
    }
  }
}

async function importProducts() {
  const rows = await fetchAll('product', 'product');
  for (const raw of rows) {
    try {
      const mapped = mapProduct(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      if (dryRun) {
        bump('product', 'written');
        continue;
      }
      const product = await prisma.product.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          subtitle: mapped.subtitle,
          description: mapped.description,
          media: mapped.media as object | null,
          gallery: mapped.gallery as object,
          isFeatured: mapped.isFeatured,
          status: mapped.status as 'AVAILABLE' | 'UNAVAILABLE',
          views: mapped.views,
          sortOrder: mapped.sortOrder,
        },
        update: {
          title: mapped.title,
          slug: mapped.slug,
          subtitle: mapped.subtitle,
          description: mapped.description,
          media: mapped.media as object | null,
          gallery: mapped.gallery as object,
          isFeatured: mapped.isFeatured,
          status: mapped.status as 'AVAILABLE' | 'UNAVAILABLE',
          views: mapped.views,
          sortOrder: mapped.sortOrder,
        },
      });

      for (const catLegacy of mapped.categoryLegacyIds) {
        const categoryId = await resolveIdByLegacy('productCategory', catLegacy);
        if (!categoryId) continue;
        await prisma.productCategoryOnProduct.upsert({
          where: {
            productId_categoryId: {
              productId: product.id,
              categoryId,
            },
          },
          create: { productId: product.id, categoryId },
          update: {},
        });
      }
      bump('product', 'written');
    } catch (e) {
      bump('product', 'errors');
      console.error('product error', e);
    }
  }
}

async function importPackages() {
  const rows = await fetchAll('package', 'package');
  for (const raw of rows) {
    try {
      const mapped = mapPackage(raw);
      if (!mapped.legacyId || !mapped.productLegacyId) continue;
      const productId = await resolveIdByLegacy('product', mapped.productLegacyId);
      if (!productId) continue;
      if (dryRun) {
        bump('package', 'written');
        continue;
      }
      await prisma.package.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          value: mapped.value,
          unit: mapped.unit,
          productId,
        },
        update: {
          value: mapped.value,
          unit: mapped.unit,
          productId,
        },
      });
      bump('package', 'written');
    } catch (e) {
      bump('package', 'errors');
      console.error('package error', e);
    }
  }
}

async function importSpecifications() {
  const rows = await fetchAll('specification', 'specification');
  for (const raw of rows) {
    try {
      const mapped = mapSpecification(raw);
      if (!mapped.legacyId) continue;
      if (dryRun) {
        bump('specification', 'written');
        continue;
      }
      await prisma.specification.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          position: mapped.position as 'attribute' | 'extra',
        },
        update: {
          title: mapped.title,
          position: mapped.position as 'attribute' | 'extra',
        },
      });
      bump('specification', 'written');
    } catch (e) {
      bump('specification', 'errors');
      console.error('specification error', e);
    }
  }
}

async function importProductSpecifications() {
  const rows = await fetchAll('product_specification', 'product_specification');
  for (const raw of rows) {
    try {
      const mapped = mapProductSpecification(raw);
      if (!mapped.legacyId) continue;
      const productId = await resolveIdByLegacy('product', mapped.productLegacyId);
      const specificationId = await resolveIdByLegacy(
        'specification',
        mapped.specificationLegacyId
      );
      if (!productId || !specificationId) continue;
      if (dryRun) {
        bump('product_specification', 'written');
        continue;
      }
      await prisma.productSpecification.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          productId,
          specificationId,
          value: mapped.value,
          highlight: mapped.highlight,
          sortOrder: mapped.sortOrder,
        },
        update: {
          productId,
          specificationId,
          value: mapped.value,
          highlight: mapped.highlight,
          sortOrder: mapped.sortOrder,
        },
      });
      bump('product_specification', 'written');
    } catch (e) {
      bump('product_specification', 'errors');
      console.error('product_specification error', e);
    }
  }
}

async function importTagCategories() {
  const rows = await fetchAll('tag_category', 'tag_category');
  for (const raw of rows) {
    try {
      const mapped = mapTagCategory(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      if (dryRun) {
        bump('tag_category', 'written');
        continue;
      }
      await prisma.tagCategory.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
        },
        update: { title: mapped.title, slug: mapped.slug },
      });
      bump('tag_category', 'written');
    } catch (e) {
      bump('tag_category', 'errors');
      console.error('tag_category error', e);
    }
  }
}

async function importTags() {
  const rows = await fetchAll('tag', 'tag');
  for (const raw of rows) {
    try {
      const mapped = mapTag(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      const categoryId = await resolveIdByLegacy(
        'tagCategory',
        mapped.categoryLegacyId
      );
      if (dryRun) {
        bump('tag', 'written');
        continue;
      }
      await prisma.tag.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          categoryId,
        },
        update: {
          title: mapped.title,
          slug: mapped.slug,
          categoryId,
        },
      });
      bump('tag', 'written');
    } catch (e) {
      bump('tag', 'errors');
      console.error('tag error', e);
    }
  }
}

async function importBlogCategories() {
  const rows = await fetchAll('blog_category', 'blog_category');
  const sorted = [...rows].sort((a, b) => {
    const ap = a.parent_id ? 1 : 0;
    const bp = b.parent_id ? 1 : 0;
    return ap - bp;
  });
  for (const raw of sorted) {
    try {
      const mapped = mapBlogCategory(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      const parentId = await resolveIdByLegacy(
        'blogCategory',
        mapped.parentLegacyId
      );
      if (dryRun) {
        bump('blog_category', 'written');
        continue;
      }
      await prisma.blogCategory.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          media: mapped.media as object | null,
          parentId,
        },
        update: {
          title: mapped.title,
          slug: mapped.slug,
          description: mapped.description,
          publish: mapped.publish,
          media: mapped.media as object | null,
          parentId,
        },
      });
      bump('blog_category', 'written');
    } catch (e) {
      bump('blog_category', 'errors');
      console.error('blog_category error', e);
    }
  }
}

async function importBlogs() {
  const rows = await fetchAll('blog', 'blog');
  for (const raw of rows) {
    try {
      const mapped = mapBlog(raw);
      if (!mapped.legacyId || !mapped.slug) continue;
      const categoryId = await resolveIdByLegacy(
        'blogCategory',
        mapped.categoryLegacyId
      );
      const authorId = await resolveIdByLegacy('user', mapped.authorLegacyId);
      if (dryRun) {
        bump('blog', 'written');
        continue;
      }
      await prisma.blog.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          title: mapped.title,
          slug: mapped.slug,
          content: mapped.content,
          status: mapped.status as 'published' | 'draft',
          media: mapped.media as object | null,
          categoryId,
          authorId,
        },
        update: {
          title: mapped.title,
          slug: mapped.slug,
          content: mapped.content,
          status: mapped.status as 'published' | 'draft',
          media: mapped.media as object | null,
          categoryId,
          authorId,
        },
      });
      bump('blog', 'written');
    } catch (e) {
      bump('blog', 'errors');
      console.error('blog error', e);
    }
  }
}

async function importComments() {
  const rows = await fetchAll('comment', 'comment');
  const sorted = [...rows].sort((a, b) => {
    const ap = a.parent_id || a.targetType === 'comment' ? 1 : 0;
    const bp = b.parent_id || b.targetType === 'comment' ? 1 : 0;
    return ap - bp;
  });

  for (const raw of sorted) {
    try {
      const mapped = mapComment(raw);
      if (!mapped.legacyId) continue;

      let productId: string | null = null;
      let blogId: string | null = null;
      let parentId: string | null = null;

      if (mapped.targetType === 'product') {
        productId = await resolveIdByLegacy('product', mapped.targetLegacyId);
      } else if (mapped.targetType === 'blog') {
        blogId = await resolveIdByLegacy('blog', mapped.targetLegacyId);
      } else {
        parentId = await resolveIdByLegacy('comment', mapped.targetLegacyId);
      }
      if (mapped.parentLegacyId) {
        parentId =
          parentId ||
          (await resolveIdByLegacy('comment', mapped.parentLegacyId));
      }

      if (dryRun) {
        bump('comment', 'written');
        continue;
      }

      await prisma.comment.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          nickName: mapped.nickName,
          content: mapped.content,
          email: mapped.email,
          website: mapped.website,
          rating: mapped.rating,
          publish: mapped.publish,
          targetType: mapped.targetType as 'product' | 'blog' | 'comment',
          productId,
          blogId,
          parentId,
        },
        update: {
          nickName: mapped.nickName,
          content: mapped.content,
          email: mapped.email,
          website: mapped.website,
          rating: mapped.rating,
          publish: mapped.publish,
          targetType: mapped.targetType as 'product' | 'blog' | 'comment',
          productId,
          blogId,
          parentId,
        },
      });
      bump('comment', 'written');
    } catch (e) {
      bump('comment', 'errors');
      console.error('comment error', e);
    }
  }
}

async function importSeo() {
  const rows = await fetchAll('seo', 'seo');
  for (const raw of rows) {
    try {
      const mapped = mapSeo(raw);
      if (!mapped.legacyId) continue;
      if (dryRun) {
        bump('seo', 'written');
        continue;
      }
      await prisma.seo.upsert({
        where: { legacyId: mapped.legacyId },
        create: {
          legacyId: mapped.legacyId,
          targetPath: mapped.targetPath,
          targetType: mapped.targetType,
          targetLegacyId: mapped.targetLegacyId,
          metaTitle: mapped.metaTitle,
          metaDescription: mapped.metaDescription,
          metaKeyWords: mapped.metaKeyWords,
          canonicalUrl: mapped.canonicalUrl,
        },
        update: {
          targetPath: mapped.targetPath,
          targetType: mapped.targetType,
          targetLegacyId: mapped.targetLegacyId,
          metaTitle: mapped.metaTitle,
          metaDescription: mapped.metaDescription,
          metaKeyWords: mapped.metaKeyWords,
          canonicalUrl: mapped.canonicalUrl,
        },
      });
      bump('seo', 'written');
    } catch (e) {
      bump('seo', 'errors');
      console.error('seo error', e);
    }
  }
}

async function importMedia() {
  const rows = await fetchAll('media', 'media');
  const storageDir = path.resolve(process.cwd(), 'storage/legacy');
  if (downloadMedia && !dryRun) {
    await mkdir(storageDir, { recursive: true });
  }

  for (const raw of rows) {
    try {
      const mapped = mapMedia(raw);
      if (!mapped.legacyId || !mapped.url) continue;
      if (dryRun) {
        bump('media', 'written');
        continue;
      }
      await prisma.media.upsert({
        where: { legacyId: mapped.legacyId },
        create: mapped,
        update: {
          url: mapped.url,
          type: mapped.type,
          name: mapped.name,
          alt: mapped.alt,
          mimeType: mapped.mimeType,
          size: mapped.size,
        },
      });

      if (downloadMedia) {
        try {
          const fileUrl = mapped.url.startsWith('http')
            ? mapped.url
            : `${base}${mapped.url.startsWith('/') ? '' : '/'}${mapped.url}`;
          const res = await fetch(fileUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const ext = path.extname(mapped.url) || '.bin';
            await writeFile(path.join(storageDir, `${mapped.legacyId}${ext}`), buf);
          }
        } catch (err) {
          console.warn('media download failed', mapped.legacyId, err);
        }
      }
      bump('media', 'written');
    } catch (e) {
      bump('media', 'errors');
      console.error('media error', e);
    }
  }
}

async function importContacts() {
  const rows = await fetchAll('contact', 'contact');
  for (const raw of rows) {
    try {
      const mapped = mapContact(raw);
      if (!mapped.legacyId) continue;
      if (dryRun) {
        bump('contact', 'written');
        continue;
      }
      await prisma.contactMessage.upsert({
        where: { legacyId: mapped.legacyId },
        create: mapped,
        update: {
          fullName: mapped.fullName,
          subject: mapped.subject,
          email: mapped.email,
          phone: mapped.phone,
          message: mapped.message,
        },
      });
      bump('contact', 'written');
    } catch (e) {
      bump('contact', 'errors');
      console.error('contact error', e);
    }
  }
}

const importers: Record<string, () => Promise<void>> = {
  role: importRoles,
  user: importUsers,
  product_category: importProductCategories,
  tag_category: importTagCategories,
  tag: importTags,
  specification: importSpecifications,
  product: importProducts,
  package: importPackages,
  product_specification: importProductSpecifications,
  blog_category: importBlogCategories,
  blog: importBlogs,
  comment: importComments,
  seo: importSeo,
  media: importMedia,
  contact: importContacts,
};

async function main() {
  console.log(`Legacy import from ${base}`);
  console.log(
    `Mode: ${dryRun ? 'DRY RUN' : 'WRITE'} | download-media=${downloadMedia}${only ? ` | only=${only}` : ''}`
  );

  if (only) {
    const run = importers[only];
    if (!run) {
      console.error(
        `Unknown --only=${only}. Valid: ${Object.keys(importers).join(', ')}`
      );
      process.exit(1);
    }
    await run();
  } else {
    for (const run of Object.values(importers)) {
      await run();
    }
  }

  console.log('\n=== Import summary ===');
  let totalErrors = 0;
  for (const [entity, s] of Object.entries(stats)) {
    totalErrors += s.errors;
    console.log(
      `${entity.padEnd(22)} read=${s.read} written=${s.written} errors=${s.errors}`
    );
  }

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
