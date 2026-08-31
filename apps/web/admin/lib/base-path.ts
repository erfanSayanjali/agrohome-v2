/** Must match `basePath` in next.config.ts */
export const ADMIN_BASE_PATH = "/admin";

/** Prefix absolute app paths for hard navigations (`window.location`, TinyMCE assets, …). */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (path === ADMIN_BASE_PATH || path.startsWith(`${ADMIN_BASE_PATH}/`)) return path;
  return `${ADMIN_BASE_PATH}${path}`;
}
