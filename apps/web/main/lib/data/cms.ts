/** Fetch CMS homepage (live page-builder blocks) and resolve entity queries. */

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

  return null;
}

function asResolvedList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export async function getPublishedHomePage(): Promise<{
  title: string;
  slug: string;
  blocks: ResolvedHomeBlock[];
  revalidateSeconds?: number;
} | null> {
  const page = await fetchPublishedPageBySlug("/");

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
