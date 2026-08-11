import type { PrismaClient } from "@prisma/client";
import { toMediaRef } from "@agrohome/shared";
import { normalizeGallery } from "./media";

export type MediaUsageEntityType =
  | "product"
  | "blog"
  | "blog_category"
  | "user"
  | "site_settings"
  | "cms_block";

export type MediaUsage = {
  entityType: MediaUsageEntityType;
  entityId: string;
  label: string;
  field: string;
};

export const MEDIA_USAGE_ENTITY_TYPES: MediaUsageEntityType[] = [
  "product",
  "blog",
  "blog_category",
  "user",
  "site_settings",
  "cms_block",
];

/** نرمال‌سازی URL به path نسبی مثل /uploads/... */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const pathname = new URL(trimmed).pathname;
      return pathname || trimmed;
    }
  } catch {
    // keep as-is
  }
  const q = trimmed.indexOf("?");
  return q >= 0 ? trimmed.slice(0, q) : trimmed;
}

function extractUploadUrlsFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/\/uploads\/[^\s"'<>)\\]+/g);
  if (!matches?.length) return [];
  const out: string[] = [];
  for (const m of matches) {
    const n = normalizeMediaUrl(m);
    if (n) out.push(n);
  }
  return out;
}

function addUsage(
  index: Map<string, MediaUsage[]>,
  url: string | null | undefined,
  usage: MediaUsage
) {
  const key = normalizeMediaUrl(url);
  if (!key) return;
  const list = index.get(key) ?? [];
  const dup = list.some(
    (u) =>
      u.entityType === usage.entityType &&
      u.entityId === usage.entityId &&
      u.field === usage.field
  );
  if (!dup) list.push(usage);
  index.set(key, list);
}

function mediaUrlFromJson(value: unknown): string | null {
  return normalizeMediaUrl(toMediaRef(value)?.url ?? null);
}

/**
 * اسکن موجودیت‌ها و ساخت ایندکس URL → usages
 */
export async function buildMediaUsageIndex(
  prisma: PrismaClient
): Promise<Map<string, MediaUsage[]>> {
  const index = new Map<string, MediaUsage[]>();

  const [products, blogs, blogCategories, users, settings, blocks] =
    await Promise.all([
      prisma.product.findMany({
        select: { id: true, title: true, media: true, gallery: true },
      }),
      prisma.blog.findMany({
        select: { id: true, title: true, media: true, content: true },
      }),
      prisma.blogCategory.findMany({
        select: { id: true, title: true, media: true },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          media: true,
        },
      }),
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.$queryRaw<Array<{ id: string; name: string | null; type: string; payload: unknown }>>`
        SELECT id, name, type, payload
        FROM "ContentBlock"
        WHERE payload::text LIKE ${"%/uploads/%"}
      `,
    ]);

  for (const p of products) {
    addUsage(index, mediaUrlFromJson(p.media), {
      entityType: "product",
      entityId: p.id,
      label: p.title,
      field: "media",
    });
    for (const item of normalizeGallery(p.gallery)) {
      addUsage(index, item.url, {
        entityType: "product",
        entityId: p.id,
        label: p.title,
        field: "gallery",
      });
    }
  }

  for (const b of blogs) {
    addUsage(index, mediaUrlFromJson(b.media), {
      entityType: "blog",
      entityId: b.id,
      label: b.title,
      field: "media",
    });
    for (const url of extractUploadUrlsFromText(b.content)) {
      addUsage(index, url, {
        entityType: "blog",
        entityId: b.id,
        label: b.title,
        field: "content",
      });
    }
  }

  for (const c of blogCategories) {
    addUsage(index, mediaUrlFromJson(c.media), {
      entityType: "blog_category",
      entityId: c.id,
      label: c.title,
      field: "media",
    });
  }

  for (const u of users) {
    const label =
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.phone ||
      u.id;
    addUsage(index, mediaUrlFromJson(u.media), {
      entityType: "user",
      entityId: u.id,
      label,
      field: "media",
    });
  }

  if (settings) {
    addUsage(index, settings.logoUrl, {
      entityType: "site_settings",
      entityId: settings.id,
      label: "لوگوی سایت",
      field: "logoUrl",
    });
    addUsage(index, settings.faviconUrl, {
      entityType: "site_settings",
      entityId: settings.id,
      label: "فاوآیکون",
      field: "faviconUrl",
    });
  }

  for (const block of blocks) {
    const label = block.name?.trim() || block.type || block.id;
    const payloadText =
      typeof block.payload === "string"
        ? block.payload
        : JSON.stringify(block.payload ?? {});
    for (const url of extractUploadUrlsFromText(payloadText)) {
      addUsage(index, url, {
        entityType: "cms_block",
        entityId: block.id,
        label,
        field: "payload",
      });
    }
  }

  return index;
}

export function urlsForEntityType(
  index: Map<string, MediaUsage[]>,
  entityType: MediaUsageEntityType
): string[] {
  const urls: string[] = [];
  for (const [url, usages] of index) {
    if (usages.some((u) => u.entityType === entityType)) urls.push(url);
  }
  return urls;
}

export function allUsedUrls(index: Map<string, MediaUsage[]>): string[] {
  return [...index.keys()];
}

export function isMediaUsageEntityType(
  value: unknown
): value is MediaUsageEntityType {
  return (
    typeof value === "string" &&
    (MEDIA_USAGE_ENTITY_TYPES as string[]).includes(value)
  );
}
