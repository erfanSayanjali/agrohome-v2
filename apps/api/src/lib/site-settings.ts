type LinkItem = { title?: string; href?: string; label?: string };

function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return false;
  }
  if (trimmed.startsWith("/")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeLinkItem(item: unknown): LinkItem | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const title =
    typeof raw.title === "string"
      ? raw.title
      : typeof raw.label === "string"
        ? raw.label
        : "";
  const href = typeof raw.href === "string" ? raw.href.trim() : "";
  if (!title || !isSafeHref(href)) return null;
  if (raw.label !== undefined) return { label: title, href };
  return { title, href };
}

export function sanitizeHeaderLinks(raw: unknown): LinkItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeLinkItem).filter((item): item is LinkItem => item !== null);
}

export function sanitizeSocialLinks(raw: unknown): LinkItem[] {
  return sanitizeHeaderLinks(raw);
}

export function sanitizeFooterLinkGroups(raw: unknown): Array<{
  title: string;
  links: LinkItem[];
}> {
  if (!Array.isArray(raw)) return [];
  const groups: Array<{ title: string; links: LinkItem[] }> = [];
  for (const group of raw) {
    if (!group || typeof group !== "object") continue;
    const g = group as Record<string, unknown>;
    const title = typeof g.title === "string" ? g.title.trim() : "";
    if (!title) continue;
    const links = sanitizeHeaderLinks(g.links);
    if (!links.length) continue;
    groups.push({ title, links });
  }
  return groups;
}
