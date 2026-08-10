export function slugify(text: string): string {
  return text
    .replace(/[\u200C\u200B]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function isIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

export type ListQuery = {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  search?: string;
  filters: Record<string, unknown>;
  fieldsMetaOnly: boolean;
};

export type ListMeta = {
  page: number;
  limit: number;
  totalPages: number;
};

export function parseListQuery(
  query: Record<string, unknown>,
  defaults: { limit?: number } = {}
): ListQuery {
  const fields = typeof query.fields === "string" ? query.fields : "";
  const fieldsMetaOnly = fields === "meta" || query.metaOnly === "1" || query.metaOnly === true;

  const page = Math.max(1, Number(query.page) || 1);
  const rawLimit = Number(query.limit);
  // limit=0 means meta-only (no rows)
  let limit: number;
  if (fieldsMetaOnly) {
    limit = 0;
  } else if (Number.isFinite(rawLimit) && rawLimit === 0) {
    limit = 0;
  } else {
    limit = Math.min(
      100,
      Math.max(1, Number.isFinite(rawLimit) ? rawLimit : defaults.limit || 20)
    );
  }

  const sort = typeof query.sort === "string" && query.sort ? query.sort : "-createdAt";
  let filters: Record<string, unknown> = {};
  const raw = query.filters ?? query.filter;
  if (typeof raw === "string" && raw) {
    try {
      filters = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      filters = {};
    }
  } else if (raw && typeof raw === "object") {
    filters = raw as Record<string, unknown>;
  }
  // coerce JSON string booleans/numbers; keep Prisma operators (contains/…) as objects
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && typeof value === "object") continue;
    if (value === "true") filters[key] = true;
    else if (value === "false") filters[key] = false;
    else if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
      filters[key] = Number(value);
    }
  }
  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  return {
    page,
    limit,
    skip: limit === 0 ? 0 : (page - 1) * limit,
    sort,
    search,
    filters,
    fieldsMetaOnly: fieldsMetaOnly || limit === 0,
  };
}

export function prismaOrderBy(sort: string): Record<string, "asc" | "desc"> {
  if (sort.startsWith("-")) {
    return { [sort.slice(1)]: "desc" };
  }
  return { [sort]: "asc" };
}

export function listMeta(page: number, limit: number, total: number): ListMeta {
  const effectiveLimit = limit > 0 ? limit : 1;
  return {
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / effectiveLimit)),
  };
}

export function okList<T>(
  content: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    content,
    total,
    meta: listMeta(page, limit, total),
  };
}

export function ok<T>(content: T, total?: number, meta?: Record<string, unknown>) {
  return {
    content,
    ...(total !== undefined ? { total } : {}),
    ...(meta ? { meta } : {}),
  };
}
