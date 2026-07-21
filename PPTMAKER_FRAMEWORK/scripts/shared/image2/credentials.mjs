/**
 * Import-safe Image2 credential resolution shared by legacy generation and
 * the optional Phase-4 transport. Loading this module never reads files or
 * mutates process state; callers choose when the remote boundary is reached.
 */

function normalizeBaseUrl(value) {
  const raw = String(value).trim();
  if (!raw) return "";
  const parsed = new URL(raw);
  if (parsed.username || parsed.password) {
    throw new Error("Image provider URL must not contain credentials");
  }
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

function firstOverride(extraBaseUrls) {
  if (!Array.isArray(extraBaseUrls) || extraBaseUrls.length === 0) return "";
  return String(extraBaseUrls[0] ?? "").trim();
}

/**
 * Resolve the one supported Image2 endpoint without exposing credentials in
 * diagnostics. This deliberately preserves legacy precedence:
 * `--base-url` first, then `IMAGE2_BASE_URL`.
 */
export function resolveImage2Credentials({ extraBaseUrls = [], env = process.env } = {}) {
  const apiKey = env?.IMAGE2_API_KEY || "";
  if (!apiKey) {
    throw new Error("IMAGE2_API_KEY is not set. Put it in deck .env or export it.");
  }
  const baseUrl = firstOverride(extraBaseUrls) || String(env?.IMAGE2_BASE_URL || "").trim();
  if (!baseUrl) {
    throw new Error("No image API base URL. Set IMAGE2_BASE_URL or use --base-url.");
  }
  return Object.freeze({ base_url: normalizeBaseUrl(baseUrl), api_key: apiKey });
}

/** Legacy-compatible plural shape retained for existing callers. */
export function resolveImage2Vendors(extraBaseUrls = [], options = {}) {
  return Object.freeze([resolveImage2Credentials({ extraBaseUrls, ...options })]);
}

export { normalizeBaseUrl as normalizeImage2BaseUrl };
