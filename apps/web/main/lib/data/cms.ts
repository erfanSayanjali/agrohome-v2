/** Fetch CMS pages (live page-builder blocks) and resolve entity queries. */

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

async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1${path}`, {
      ...init,
      cache: "no-store",
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

type PagePayload = {
  content: {
    title: string;
    slug: string;
    revalidateSeconds?: number;
    snapshot?: { blocks?: SnapshotBlock[] };
  };
};

async function fetchPublishedPageBySlug(slug: string): Promise<PagePayload | null> {
  const viaQuery = await apiJson<PagePayload>(
    `/pages?slug=${encodeURIComponent(slug)}`
  );
  if (viaQuery?.content?.snapshot?.blocks?.length) return viaQuery;

  if (slug === "/" || slug === "") {
    const viaHome = await apiJson<PagePayload>(`/pages/home`);
    if (viaHome?.content?.snapshot?.blocks?.length) return viaHome;
  }

  const bare = slug.replace(/^\//, "");
  if (bare && bare !== "home") {
    const viaPath = await apiJson<PagePayload>(
      `/pages/${encodeURIComponent(bare)}`
    );
    if (viaPath?.content?.snapshot?.blocks?.length) return viaPath;
  }

  return null;
}

function asResolvedList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export async function getPublishedPage(slug: string): Promise<{
  title: string;
  slug: string;
  blocks: ResolvedHomeBlock[];
  revalidateSeconds?: number;
} | null> {
  const page = await fetchPublishedPageBySlug(slug);

  if (!page?.content?.snapshot?.blocks?.length) return null;

  const blocks = [...page.content.snapshot.blocks]
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
        body: JSON.stringify({
          blocks: toResolve.map((b) => ({
            id: b.id,
            sourceType: b.sourceType,
            payload: b.payload,
          })),
        }),
      }
    );
    resolvedMap = resolved?.content || {};
  }

  return {
    title: page.content.title,
    slug: page.content.slug,
    revalidateSeconds: page.content.revalidateSeconds,
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

export async function getPublishedHomePage() {
  return getPublishedPage("/");
}

export async function getPublishedContactPage() {
  return getPublishedPage("/contact");
}

export async function getPublishedAboutPage() {
  return getPublishedPage("/about");
}

export type SiteSettings = {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  socialLinks: Array<{ label?: string; href?: string }>;
  footerLinkGroups: Array<{
    title?: string;
    links?: Array<{ title?: string; href?: string }>;
  }>;
};

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

export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await apiJson<{ content: SiteSettings }>("/site-settings");
  if (!res?.content) return emptySiteSettings;
  return {
    ...emptySiteSettings,
    ...res.content,
    logoUrl: res.content.logoUrl || emptySiteSettings.logoUrl,
    faviconUrl: res.content.faviconUrl || emptySiteSettings.faviconUrl,
    footerText: res.content.footerText ?? emptySiteSettings.footerText,
    socialLinks: Array.isArray(res.content.socialLinks) && res.content.socialLinks.length
      ? res.content.socialLinks
      : emptySiteSettings.socialLinks,
    footerLinkGroups:
      Array.isArray(res.content.footerLinkGroups) &&
      res.content.footerLinkGroups.length
        ? res.content.footerLinkGroups
        : emptySiteSettings.footerLinkGroups,
  };
}
