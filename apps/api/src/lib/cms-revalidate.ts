import type { FastifyInstance } from "fastify";
import {
  CMS_LAYOUT_TAG,
  CMS_PAGES_INDEX_TAG,
  PRODUCTS_TAG,
  cmsPagePath,
  cmsPageTag,
  normalizeCmsSlug,
  productPath,
  productTag,
} from "@agrohome/shared";

function cmsRevalidateLog(app: FastifyInstance) {
  return {
    warn: (obj: unknown, msg?: string) => app.log.warn(obj as object, msg),
  };
}

async function postSiteRevalidate(
  body: { tags?: string[]; paths?: string[] },
  log?: { warn: (obj: unknown, msg?: string) => void },
  skipMessage = "Site revalidate skipped: MAIN_SITE_URL or REVALIDATE_SECRET missing"
) {
  const base = (process.env.MAIN_SITE_URL || "").replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) {
    log?.warn(
      { hasUrl: Boolean(base), hasSecret: Boolean(secret) },
      skipMessage
    );
    return;
  }

  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      log?.warn(
        { status: res.status, body },
        "Site revalidate request rejected"
      );
    }
  } catch (err) {
    log?.warn({ err, body }, "Site revalidate request failed");
  }
}

export async function notifyCmsPagesRevalidate(
  slugs: string[],
  log?: { warn: (obj: unknown, msg?: string) => void }
) {
  const unique = [...new Set(slugs.map((slug) => normalizeCmsSlug(slug)))];
  if (!unique.length) return;

  await postSiteRevalidate(
    {
      tags: [...unique.map(cmsPageTag), CMS_PAGES_INDEX_TAG],
      paths: unique.map(cmsPagePath),
    },
    log,
    "CMS revalidate skipped: MAIN_SITE_URL or REVALIDATE_SECRET missing"
  );
}

export async function revalidateCmsPageSlugs(
  app: FastifyInstance,
  slugs: Array<string | null | undefined>
) {
  await notifyCmsPagesRevalidate(
    slugs.filter((slug): slug is string => Boolean(slug)),
    cmsRevalidateLog(app)
  );
}

export async function revalidateCmsPageIds(
  app: FastifyInstance,
  pageIds: Array<string | null | undefined>
) {
  const ids = [...new Set(pageIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return;
  const pages = await app.prisma.cmsPage.findMany({
    where: { id: { in: ids } },
    select: { slug: true },
  });
  await revalidateCmsPageSlugs(
    app,
    pages.map((page) => page.slug)
  );
}

export async function revalidatePagesReferencingEntity(
  app: FastifyInstance,
  entity: "product" | "blog" | "comment"
) {
  const blocks = await app.prisma.contentBlock.findMany({
    where: {
      sourceType: { in: ["ENTITY_QUERY", "ENTITY_REF"] },
      payload: { path: ["entity"], equals: entity },
    },
    select: { pageId: true },
  });
  await revalidateCmsPageIds(
    app,
    blocks.map((block) => block.pageId)
  );
}

export async function notifyProductsRevalidate(
  slugs: string[],
  log?: { warn: (obj: unknown, msg?: string) => void }
) {
  const unique = [
    ...new Set(slugs.map((slug) => String(slug || "").trim()).filter(Boolean)),
  ];
  const tags = [PRODUCTS_TAG, CMS_LAYOUT_TAG, ...unique.map(productTag)];
  const paths = ["/", "/products", ...unique.map(productPath)];
  await postSiteRevalidate({ tags, paths }, log);
}

export async function notifyCatalogLayoutRevalidate(
  log?: { warn: (obj: unknown, msg?: string) => void }
) {
  await postSiteRevalidate(
    {
      tags: [PRODUCTS_TAG, CMS_LAYOUT_TAG],
      paths: ["/", "/products"],
    },
    log
  );
}

export async function revalidateProductSlugs(
  app: FastifyInstance,
  slugs: Array<string | null | undefined>
) {
  const filtered = slugs.filter((slug): slug is string => Boolean(slug));
  await notifyProductsRevalidate(filtered, cmsRevalidateLog(app));
  await revalidatePagesReferencingEntity(app, "product");
}

export async function revalidateBlogEntityPages(app: FastifyInstance) {
  await revalidatePagesReferencingEntity(app, "blog");
}

export async function revalidateCommentEntityPages(app: FastifyInstance) {
  await revalidatePagesReferencingEntity(app, "comment");
}
