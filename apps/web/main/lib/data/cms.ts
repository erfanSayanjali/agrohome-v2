/** Fetch CMS pages (live page-builder blocks) and resolve entity queries. */

import { unstable_cache } from "next/cache";
import {
  CMS_DEFAULT_REVALIDATE_SECONDS,
  CMS_LAYOUT_TAG,
  CMS_PAGES_INDEX_TAG,
  cmsPageTag,
  normalizeCmsSlug,
} from "@agrohome/shared";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002";

type SnapshotBlock = {
  id: string;
  type: string;
  name?: string | null;
  sortOrder?: number;
  sourceType: string;
  payload: Record<string, unknown>;
  anchor?: string | null;
  isVisible?: boolean;
};

export type ResolvedHomeBlock = SnapshotBlock & {
  resolved?: unknown;
};

type FetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

async function apiJson<T>(path: string, init?: FetchInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type PageSeo = {
  id?: string;
  targetPath?: string | null;
  targetType?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeyWords?: string[];
  canonicalUrl?: string | null;
  pageId?: string | null;
} | null;

type PagePayload = {
  content: {
    id?: string;
    title: string;
    slug: string;
    revalidateSeconds?: number;
    snapshot?: { blocks?: SnapshotBlock[] };
    seo?: PageSeo;
  };
};

export type PublishedPage = {
  id?: string;
  title: string;
  slug: string;
  blocks: ResolvedHomeBlock[];
  revalidateSeconds?: number;
  seo?: PageSeo;
};

function pageFetchInit(slug: string, revalidate = CMS_DEFAULT_REVALIDATE_SECONDS): FetchInit {
  const normalized = normalizeCmsSlug(slug);
  return {
    next: {
      revalidate,
      tags: [cmsPageTag(normalized)],
    },
  };
}

async function fetchPublishedPageBySlug(slug: string): Promise<PagePayload | null> {
  const init = pageFetchInit(slug);
  const viaQuery = await apiJson<PagePayload>(
    `/pages?slug=${encodeURIComponent(slug)}`,
    init
  );
  if (viaQuery?.content) return viaQuery;

  const bare = slug.replace(/^\//, "");
  if (bare && bare !== "home") {
    const viaPath = await apiJson<PagePayload>(
      `/pages/${encodeURIComponent(bare)}`,
      init
    );
    if (viaPath?.content) return viaPath;
  }

  return null;
}

function asResolvedList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function loadPublishedPage(slug: string): Promise<PublishedPage | null> {
  const page = await fetchPublishedPageBySlug(slug);

  if (!page?.content) return null;

  const revalidateSeconds =
    page.content.revalidateSeconds ?? CMS_DEFAULT_REVALIDATE_SECONDS;

  const blocks = [...(page.content.snapshot?.blocks ?? [])]
    .filter((b) => b.isVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const toResolve = blocks.filter(
    (b) => b.sourceType === "ENTITY_QUERY" || b.sourceType === "ENTITY_REF"
  );

  let resolvedMap: Record<string, unknown> = {};
  if (toResolve.length) {
    const resolved = await apiJson<{ content: Record<string, unknown> }>(
      "/blocks/resolve",
      {
        method: "POST",
        ...pageFetchInit(slug, revalidateSeconds),
        body: JSON.stringify({
          blocks: toResolve.map((b) => {
            const payload = { ...(b.payload || {}) };
            const entity = String(payload.entity || "");
            const isCommentList =
              b.type === "comment_list" || entity === "comment";
            if (isCommentList && payload.showOnHome === undefined) {
              payload.showOnHome = true;
            }
            return {
              id: b.id,
              sourceType: b.sourceType,
              payload,
            };
          }),
        }),
      }
    );
    resolvedMap = resolved?.content || {};
  }

  return {
    id: page.content.id,
    title: page.content.title,
    slug: page.content.slug,
    revalidateSeconds,
    seo: page.content.seo ?? null,
    blocks: blocks.map((b) => {
      const isEntity =
        b.sourceType === "ENTITY_QUERY" || b.sourceType === "ENTITY_REF";
      return {
        ...b,
        resolved: isEntity
          ? asResolvedList(resolvedMap[b.id])
          : (resolvedMap[b.id] ?? b.payload),
      };
    }),
  };
}

export async function getPublishedPage(
  slug: string
): Promise<PublishedPage | null> {
  const normalized = normalizeCmsSlug(slug);
  return unstable_cache(
    () => loadPublishedPage(normalized),
    [`published-page-${normalized}`],
    {
      tags: [cmsPageTag(normalized)],
      revalidate: CMS_DEFAULT_REVALIDATE_SECONDS,
    }
  )();
}

/** Build Next.js metadata from a CMS/entity SEO record. */
export function metadataFromSeo(
  seo?: PageSeo,
  fallback?: { title?: string; canonical?: string }
) {
  if (!seo && !fallback?.title) return {};
  const keywords = Array.isArray(seo?.metaKeyWords)
    ? seo.metaKeyWords.join(", ")
    : "";
  return {
    title: seo?.metaTitle || fallback?.title || undefined,
    description: seo?.metaDescription || undefined,
    keywords: keywords || undefined,
    alternates: {
      canonical: seo?.canonicalUrl || fallback?.canonical || undefined,
    },
  };
}

export async function getPublishedHomePage() {
  return getPublishedPage("/");
}

export async function getPublishedContactPage() {
  return getPublishedPage("/contact");
}

export async function getPublishedAboutPage() {
  return getPublishedPage("/about");
}

export async function getPublishedPageSlugs(): Promise<string[]> {
  const res = await apiJson<{ content: string[] }>("/pages/slugs", {
    next: {
      revalidate: CMS_DEFAULT_REVALIDATE_SECONDS,
      tags: [CMS_PAGES_INDEX_TAG],
    },
  });
  const slugs = Array.isArray(res?.content) ? res.content : [];
  return slugs.map((slug) => normalizeCmsSlug(String(slug)));
}

export type SiteSettings = {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  socialLinks: Array<{ label?: string; href?: string }>;
  headerLinks: Array<{ title?: string; href?: string }>;
  footerLinkGroups: Array<{
    title?: string;
    links?: Array<{ title?: string; href?: string }>;
  }>;
};

const DEFAULT_HEADER_LINKS = [
  { title: "صفحه اصلی", href: "/" },
  { title: "محصولات", href: "/products" },
  { title: "وبلاگ", href: "/blogs" },
  { title: "درباره ما", href: "/about" },
  { title: "تماس با ما", href: "/contact" },
];

const emptySiteSettings: SiteSettings = {
  id: "default",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  footerText:
    "با کودهای ارگانیک آگروهوم، بدون بوی بد و مواد شیمیایی، گیاهانت را زنده نگه دار.",
  socialLinks: [
    { label: "اینستاگرام", href: "https://www.instagram.com/agrohome" },
    { label: "تلگرام", href: "https://t.me/agrohome" },
  ],
  headerLinks: DEFAULT_HEADER_LINKS,
  footerLinkGroups: [
    {
      title: "دسترسی سریع",
      links: [
        { title: "صفحه اصلی", href: "/" },
        { title: "کودهای خانگی", href: "/products" },
        { title: "وبلاگ", href: "/blogs" },
        { title: "درباره ما", href: "/about" },
        { title: "تماس با ما", href: "/contact" },
      ],
    },
    {
      title: "فروشگاه",
      links: [
        { title: "همه محصولات", href: "/products" },
        { title: "مقالات و راهنما", href: "/blogs" },
        { title: "تماس با پشتیبانی", href: "/contact" },
      ],
    },
  ],
};

async function loadSiteSettings(): Promise<SiteSettings> {
  const res = await apiJson<{ content: SiteSettings }>("/site-settings", {
    next: {
      revalidate: CMS_DEFAULT_REVALIDATE_SECONDS,
      tags: [CMS_LAYOUT_TAG],
    },
  });
  if (!res?.content) return emptySiteSettings;
  const headerLinks =
    Array.isArray(res.content.headerLinks) && res.content.headerLinks.length
      ? res.content.headerLinks
      : emptySiteSettings.headerLinks;
  return {
    ...emptySiteSettings,
    ...res.content,
    logoUrl: res.content.logoUrl || emptySiteSettings.logoUrl,
    faviconUrl: res.content.faviconUrl || emptySiteSettings.faviconUrl,
    footerText: res.content.footerText ?? emptySiteSettings.footerText,
    socialLinks:
      Array.isArray(res.content.socialLinks) && res.content.socialLinks.length
        ? res.content.socialLinks
        : emptySiteSettings.socialLinks,
    headerLinks,
    footerLinkGroups:
      Array.isArray(res.content.footerLinkGroups) &&
      res.content.footerLinkGroups.length
        ? res.content.footerLinkGroups
        : emptySiteSettings.footerLinkGroups,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return unstable_cache(loadSiteSettings, ["cms-site-settings"], {
    tags: [CMS_LAYOUT_TAG],
    revalidate: CMS_DEFAULT_REVALIDATE_SECONDS,
  })();
}
