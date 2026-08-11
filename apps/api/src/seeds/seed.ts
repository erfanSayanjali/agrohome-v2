/**
 * Seeds the database from `src/seeds/data/snapshot.json` (exported from a live DB).
 *
 * Usage:
 *   pnpm db:seed
 *   pnpm db:export-seed   # refresh snapshot from current DATABASE_URL
 *
 * On a fresh DB: run migrate/push, then db:seed.
 * Re-running is idempotent (upsert by primary key / composite key).
 */
import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";
import snapshot from "./data/snapshot.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedUploadsDir = join(__dirname, "data", "uploads");
const appUploadsDir = join(__dirname, "../../uploads");

type Row = Record<string, unknown>;
type Snapshot = typeof snapshot & {
  roles: Row[];
  users: Row[];
  productCategories: Row[];
  products: Row[];
  productCategoryOnProduct: Row[];
  packages: Row[];
  specifications: Row[];
  productSpecifications: Row[];
  tagCategories: Row[];
  tags: Row[];
  productTags: Row[];
  blogCategories: Row[];
  blogs: Row[];
  comments: Row[];
  cmsPages: Row[];
  contentBlocks: Row[];
  siteSettings?: Row | null;
  seos: Row[];
  media: Row[];
  contactMessages: Row[];
};

const data = snapshot as Snapshot;

function rows<K extends keyof Snapshot>(key: K): Row[] {
  const value = data[key];
  return Array.isArray(value) ? (value as Row[]) : [];
}

function asDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return undefined;
}

/** Prisma rejects JS `null` for Json fields; use DbNull instead. */
function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function asNullableJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value == null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function withDates<T extends Row>(row: T, keys: string[] = ["createdAt", "updatedAt", "publishedAt", "expiresAt"]): T {
  const out = { ...row } as Row;
  for (const key of keys) {
    if (key in out && out[key] != null) out[key] = asDate(out[key]);
  }
  return out as T;
}

/** Parents before children for self-referential trees. */
function sortByParent<T extends { id: string; parentId?: string | null }>(rows: T[]): T[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const result: T[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string) {
    if (visited.has(id) || !byId.has(id)) return;
    if (visiting.has(id)) return;
    visiting.add(id);
    const row = byId.get(id)!;
    if (row.parentId) visit(row.parentId);
    visiting.delete(id);
    visited.add(id);
    result.push(row);
  }

  for (const row of rows) visit(row.id);
  return result;
}

async function upsertMany(
  label: string,
  rows: Row[],
  upsert: (row: Row) => Promise<unknown>,
) {
  let n = 0;
  for (const row of rows) {
    await upsert(withDates(row));
    n += 1;
  }
  console.log(`  ${label}: ${n}`);
}

async function seedRoles() {
  await upsertMany("roles", rows("roles"), (row) =>
    prisma.role.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        permissions: asJson(row.permissions),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        permissions: asJson(row.permissions),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedUsers() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  await upsertMany("users", rows("users"), async (row) => {
    let passwordHash = (row.passwordHash as string | null) ?? null;
    if (adminPassword && (row.phone as string) === (process.env.ADMIN_PHONE || "09120000000")) {
      passwordHash = await hashPassword(adminPassword);
    }
    return prisma.user.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        phone: row.phone as string,
        firstName: (row.firstName as string | null) ?? null,
        lastName: (row.lastName as string | null) ?? null,
        nickname: (row.nickname as string | null) ?? null,
        media: asNullableJson(row.media),
        passwordHash,
        roleId: (row.roleId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        phone: row.phone as string,
        firstName: (row.firstName as string | null) ?? null,
        lastName: (row.lastName as string | null) ?? null,
        nickname: (row.nickname as string | null) ?? null,
        media: asNullableJson(row.media),
        passwordHash,
        roleId: (row.roleId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    });
  });
}

async function seedProductCategories() {
  const sorted = sortByParent(
    rows("productCategories") as Array<Row & { id: string; parentId?: string | null }>,
  );
  await upsertMany("productCategories", sorted, (row) =>
    prisma.productCategory.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        description: (row.description as string | null) ?? null,
        publish: Boolean(row.publish),
        parentId: (row.parentId as string | null) ?? null,
        sortOrder: Number(row.sortOrder ?? 0),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        description: (row.description as string | null) ?? null,
        publish: Boolean(row.publish),
        parentId: (row.parentId as string | null) ?? null,
        sortOrder: Number(row.sortOrder ?? 0),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedProducts() {
  await upsertMany("products", rows("products"), (row) =>
    prisma.product.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        subtitle: (row.subtitle as string | null) ?? null,
        description: (row.description as string | null) ?? null,
        media: asNullableJson(row.media),
        gallery: asJson(row.gallery ?? []),
        isFeatured: Boolean(row.isFeatured),
        status: row.status as "AVAILABLE" | "UNAVAILABLE",
        views: Number(row.views ?? 0),
        sortOrder: Number(row.sortOrder ?? 0),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        subtitle: (row.subtitle as string | null) ?? null,
        description: (row.description as string | null) ?? null,
        media: asNullableJson(row.media),
        gallery: asJson(row.gallery ?? []),
        isFeatured: Boolean(row.isFeatured),
        status: row.status as "AVAILABLE" | "UNAVAILABLE",
        views: Number(row.views ?? 0),
        sortOrder: Number(row.sortOrder ?? 0),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedProductCategoryLinks() {
  await upsertMany("productCategoryOnProduct", rows("productCategoryOnProduct"), (row) =>
    prisma.productCategoryOnProduct.upsert({
      where: {
        productId_categoryId: {
          productId: row.productId as string,
          categoryId: row.categoryId as string,
        },
      },
      create: {
        productId: row.productId as string,
        categoryId: row.categoryId as string,
      },
      update: {},
    }),
  );
}

async function seedPackages() {
  await upsertMany("packages", rows("packages"), (row) =>
    prisma.package.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        value: Number(row.value),
        unit: row.unit as string,
        sortOrder: Number(row.sortOrder ?? 0),
        productId: row.productId as string,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        value: Number(row.value),
        unit: row.unit as string,
        sortOrder: Number(row.sortOrder ?? 0),
        productId: row.productId as string,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedSpecifications() {
  await upsertMany("specifications", rows("specifications"), (row) =>
    prisma.specification.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        position: row.position as "attribute" | "extra",
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        position: row.position as "attribute" | "extra",
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedProductSpecifications() {
  await upsertMany("productSpecifications", rows("productSpecifications"), (row) =>
    prisma.productSpecification.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        productId: row.productId as string,
        specificationId: row.specificationId as string,
        value: row.value as string,
        highlight: Boolean(row.highlight),
        sortOrder: Number(row.sortOrder ?? 0),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        productId: row.productId as string,
        specificationId: row.specificationId as string,
        value: row.value as string,
        highlight: Boolean(row.highlight),
        sortOrder: Number(row.sortOrder ?? 0),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedTagCategories() {
  await upsertMany("tagCategories", rows("tagCategories"), (row) =>
    prisma.tagCategory.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedTags() {
  await upsertMany("tags", rows("tags"), (row) =>
    prisma.tag.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        categoryId: (row.categoryId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        categoryId: (row.categoryId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedProductTags() {
  await upsertMany("productTags", rows("productTags"), (row) =>
    prisma.productTag.upsert({
      where: {
        productId_tagId: {
          productId: row.productId as string,
          tagId: row.tagId as string,
        },
      },
      create: {
        productId: row.productId as string,
        tagId: row.tagId as string,
      },
      update: {},
    }),
  );
}

async function seedBlogCategories() {
  const sorted = sortByParent(
    rows("blogCategories") as Array<Row & { id: string; parentId?: string | null }>,
  );
  await upsertMany("blogCategories", sorted, (row) =>
    prisma.blogCategory.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        description: (row.description as string | null) ?? null,
        publish: Boolean(row.publish),
        media: asNullableJson(row.media),
        parentId: (row.parentId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        description: (row.description as string | null) ?? null,
        publish: Boolean(row.publish),
        media: asNullableJson(row.media),
        parentId: (row.parentId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedBlogs() {
  await upsertMany("blogs", rows("blogs"), (row) =>
    prisma.blog.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        content: (row.content as string | null) ?? null,
        status: row.status as "published" | "draft",
        media: asNullableJson(row.media),
        authorId: (row.authorId as string | null) ?? null,
        categoryId: (row.categoryId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        title: row.title as string,
        slug: row.slug as string,
        content: (row.content as string | null) ?? null,
        status: row.status as "published" | "draft",
        media: asNullableJson(row.media),
        authorId: (row.authorId as string | null) ?? null,
        categoryId: (row.categoryId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedComments() {
  const comments = rows("comments") as Array<Row & { id: string; parentId?: string | null }>;
  const sorted = sortByParent(
    comments.map((c) => ({ ...c, parentId: c.parentId ?? null })),
  );
  await upsertMany("comments", sorted, (row) =>
    prisma.comment.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        nickName: row.nickName as string,
        content: row.content as string,
        email: (row.email as string | null) ?? null,
        website: (row.website as string | null) ?? null,
        rating: row.rating == null ? null : Number(row.rating),
        publish: Boolean(row.publish),
        targetType: row.targetType as "product" | "blog" | "comment",
        productId: (row.productId as string | null) ?? null,
        blogId: (row.blogId as string | null) ?? null,
        parentId: (row.parentId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        nickName: row.nickName as string,
        content: row.content as string,
        email: (row.email as string | null) ?? null,
        website: (row.website as string | null) ?? null,
        rating: row.rating == null ? null : Number(row.rating),
        publish: Boolean(row.publish),
        targetType: row.targetType as "product" | "blog" | "comment",
        productId: (row.productId as string | null) ?? null,
        blogId: (row.blogId as string | null) ?? null,
        parentId: (row.parentId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedCmsPages() {
  await upsertMany("cmsPages", rows("cmsPages"), (row) =>
    prisma.cmsPage.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        status: row.status as "draft" | "published" | "archived",
        publishedAt: (row.publishedAt as Date | null) ?? null,
        revalidateSeconds: Number(row.revalidateSeconds ?? 600),
        publishedSnapshot: asNullableJson(row.publishedSnapshot),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        slug: row.slug as string,
        title: row.title as string,
        status: row.status as "draft" | "published" | "archived",
        publishedAt: (row.publishedAt as Date | null) ?? null,
        revalidateSeconds: Number(row.revalidateSeconds ?? 600),
        publishedSnapshot: asNullableJson(row.publishedSnapshot),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedContentBlocks() {
  await upsertMany("contentBlocks", rows("contentBlocks"), (row) =>
    prisma.contentBlock.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        ownerType: "PAGE",
        pageId: (row.pageId as string | null) ?? null,
        type: row.type as string,
        name: (row.name as string | null) ?? null,
        sortOrder: Number(row.sortOrder ?? 0),
        isVisible: Boolean(row.isVisible),
        sourceType: row.sourceType as "STATIC" | "ENTITY_QUERY" | "ENTITY_REF",
        payload: asJson(row.payload ?? {}),
        anchor: (row.anchor as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        ownerType: "PAGE",
        pageId: (row.pageId as string | null) ?? null,
        type: row.type as string,
        name: (row.name as string | null) ?? null,
        sortOrder: Number(row.sortOrder ?? 0),
        isVisible: Boolean(row.isVisible),
        sourceType: row.sourceType as "STATIC" | "ENTITY_QUERY" | "ENTITY_REF",
        payload: asJson(row.payload ?? {}),
        anchor: (row.anchor as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedSiteSettings() {
  const row = data.siteSettings;
  if (!row) return;
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      logoUrl: (row.logoUrl as string | null) ?? null,
      faviconUrl: (row.faviconUrl as string | null) ?? null,
      footerText: (row.footerText as string | null) ?? null,
      socialLinks: asJson(row.socialLinks ?? []),
      footerLinkGroups: asJson(row.footerLinkGroups ?? []),
    },
    update: {
      logoUrl: (row.logoUrl as string | null) ?? null,
      faviconUrl: (row.faviconUrl as string | null) ?? null,
      footerText: (row.footerText as string | null) ?? null,
      socialLinks: asJson(row.socialLinks ?? []),
      footerLinkGroups: asJson(row.footerLinkGroups ?? []),
    },
  });
}

async function seedSeos() {
  await upsertMany("seos", rows("seos"), (row) =>
    prisma.seo.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        targetPath: (row.targetPath as string | null) ?? null,
        targetType: (row.targetType as string | null) ?? null,
        targetLegacyId: (row.targetLegacyId as string | null) ?? null,
        metaTitle: (row.metaTitle as string | null) ?? null,
        metaDescription: (row.metaDescription as string | null) ?? null,
        metaKeyWords: (row.metaKeyWords as string[]) ?? [],
        canonicalUrl: (row.canonicalUrl as string | null) ?? null,
        pageId: (row.pageId as string | null) ?? null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        targetPath: (row.targetPath as string | null) ?? null,
        targetType: (row.targetType as string | null) ?? null,
        targetLegacyId: (row.targetLegacyId as string | null) ?? null,
        metaTitle: (row.metaTitle as string | null) ?? null,
        metaDescription: (row.metaDescription as string | null) ?? null,
        metaKeyWords: (row.metaKeyWords as string[]) ?? [],
        canonicalUrl: (row.canonicalUrl as string | null) ?? null,
        pageId: (row.pageId as string | null) ?? null,
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedMedia() {
  await upsertMany("media", rows("media"), (row) =>
    prisma.media.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        url: row.url as string,
        type: (row.type as string | null) ?? null,
        name: (row.name as string | null) ?? null,
        alt: (row.alt as string | null) ?? null,
        mimeType: (row.mimeType as string | null) ?? null,
        size: row.size == null ? null : Number(row.size),
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        url: row.url as string,
        type: (row.type as string | null) ?? null,
        name: (row.name as string | null) ?? null,
        alt: (row.alt as string | null) ?? null,
        mimeType: (row.mimeType as string | null) ?? null,
        size: row.size == null ? null : Number(row.size),
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

async function seedContactMessages() {
  await upsertMany("contactMessages", rows("contactMessages"), (row) =>
    prisma.contactMessage.upsert({
      where: { id: row.id as string },
      create: {
        id: row.id as string,
        legacyId: (row.legacyId as string | null) ?? null,
        fullName: (row.fullName as string | null) ?? null,
        subject: (row.subject as string | null) ?? null,
        email: (row.email as string | null) ?? null,
        phone: (row.phone as string | null) ?? null,
        message: row.message as string,
        status: (row.status as string) ?? "new",
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date,
      },
      update: {
        legacyId: (row.legacyId as string | null) ?? null,
        fullName: (row.fullName as string | null) ?? null,
        subject: (row.subject as string | null) ?? null,
        email: (row.email as string | null) ?? null,
        phone: (row.phone as string | null) ?? null,
        message: row.message as string,
        status: (row.status as string) ?? "new",
        updatedAt: row.updatedAt as Date,
      },
    }),
  );
}

function restoreUploadFiles() {
  if (!existsSync(seedUploadsDir)) {
    console.log("  uploads: (no seed files)");
    return;
  }
  mkdirSync(appUploadsDir, { recursive: true });
  const files = readdirSync(seedUploadsDir);
  for (const name of files) {
    copyFileSync(join(seedUploadsDir, name), join(appUploadsDir, name));
  }
  console.log(`  uploads: ${files.length} file(s) → apps/api/uploads`);
}

async function main() {
  console.log(`Seeding from snapshot (${(snapshot as { exportedAt?: string }).exportedAt ?? "unknown"})…`);

  // Order matters: parents / FKs first.
  await seedRoles();
  await seedUsers();
  await seedProductCategories();
  await seedProducts();
  await seedProductCategoryLinks();
  await seedPackages();
  await seedSpecifications();
  await seedProductSpecifications();
  await seedTagCategories();
  await seedTags();
  await seedProductTags();
  await seedBlogCategories();
  await seedBlogs();
  await seedComments();
  await seedCmsPages();
  await seedContentBlocks();
  await seedSiteSettings();
  await seedSeos();
  await seedMedia();
  await seedContactMessages();
  restoreUploadFiles();

  const adminPhone =
    (rows("users")[0]?.phone as string | undefined) ||
    process.env.ADMIN_PHONE ||
    "09120000000";
  console.log(
    `Done. Admin phone=${adminPhone} (password from snapshot unless ADMIN_PASSWORD is set)`,
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
