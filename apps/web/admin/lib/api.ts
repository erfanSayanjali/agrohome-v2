import type { ApiOk, ListResponse } from "@agrohome/shared";
import { API_PREFIX } from "@agrohome/shared";

const baseURL =
  typeof window === "undefined"
    ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
    : process.env.NEXT_PUBLIC_API_URL || "";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = normalized.startsWith(API_PREFIX) ? "" : API_PREFIX;
  const url = new URL(`${prefix}${normalized}`, baseURL || "http://localhost");
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  if (!baseURL && typeof window !== "undefined") {
    return `${url.pathname}${url.search}`;
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(buildUrl(path, options.searchParams), {
    method: options.method || (options.body || options.formData ? "POST" : "GET"),
    credentials: "include",
    headers,
    body,
    signal: options.signal,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText || "Request failed";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export function apiGet<T>(path: string, searchParams?: RequestOptions["searchParams"]) {
  return apiRequest<T>(path, { method: "GET", searchParams });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body });
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: "DELETE" });
}

export function unwrap<T>(res: ApiOk<T>): T {
  return res.content;
}

export function unwrapList<T>(res: ListResponse<T>): ListResponse<T> {
  return {
    content: res.content ?? [],
    total: res.total ?? 0,
    meta: res.meta ?? {
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };
}
