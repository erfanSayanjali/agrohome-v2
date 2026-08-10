export function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

export function asOptionalString(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function legacyId(item: Record<string, unknown>): string | null {
  const id = item._id ?? item.id;
  return id == null ? null : String(id);
}

export function mediaPath(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (Array.isArray(item)) {
    const first = item[0] as Record<string, unknown> | undefined;
    return first?.url ? String(first.url) : null;
  }
  if (typeof item === 'object' && item !== null && 'url' in item) {
    return String((item as { url: unknown }).url);
  }
  return null;
}

export function mediaRef(item: unknown): { url: string; alt: string | null } | null {
  if (!item) return null;
  if (typeof item === 'string') {
    const url = item.trim();
    return url ? { url, alt: null } : null;
  }
  if (Array.isArray(item)) return mediaRef(item[0]);
  if (typeof item === 'object' && item !== null && 'url' in item) {
    const raw = item as { url?: unknown; alt?: unknown };
    const url = String(raw.url ?? '').trim();
    if (!url) return null;
    return {
      url,
      alt: raw.alt == null || raw.alt === '' ? null : String(raw.alt),
    };
  }
  return null;
}
