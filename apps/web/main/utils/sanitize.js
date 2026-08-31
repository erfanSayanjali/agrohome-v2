import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html, options = {}) {
  if (!html) return "";
  const config = {
    USE_PROFILES: { html: true },
  };
  if (options.allowIframe) {
    config.ADD_TAGS = ["iframe"];
    config.ADD_ATTR = ["allow", "allowfullscreen", "frameborder", "scrolling", "src"];
  }
  return DOMPurify.sanitize(html, config);
}
