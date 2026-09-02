/**
 * Import-safe Image2 credential resolution shared by Image2 production
 * owners. Loading this module never reads files or
 * mutates process state; callers choose when the remote boundary is reached.
  * Authority: openspec/specs/environment-check/spec.md
 * Authority: openspec/specs/cli-surface/spec.md
 */
import { requireMatchingImage2RuntimeProfileId } from "./runtime_profile_id.mjs";

function normalizeBaseUrl(value) {
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes(",")) {
    const error = new Error("Image provider URL must name one endpoint, not a comma-separated list");
    error.code = "IMAGE2_BASE_URL_INVALID";
    throw error;
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    const error = new Error("Image provider URL must be a valid endpoint");
    error.code = "IMAGE2_BASE_URL_INVALID";
    throw error;
  }
  if (parsed.username || parsed.password) {
    const error = new Error("Image provider URL must not contain credentials");
    error.code = "IMAGE2_BASE_URL_INVALID";
    throw error;
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
 * diagnostics. Its current precedence is:
 * `--base-url` first, then `IMAGE2_BASE_URL`.
 */
export function resolveImage2Credentials({ extraBaseUrls = [], env = process.env, expectedProfileId = null } = {}) {
  const apiKey = env?.IMAGE2_API_KEY || "";
  if (!apiKey) {
    throw new Error("IMAGE2_API_KEY is not set. Put it in deck .env or export it.");
  }
  const baseUrl = firstOverride(extraBaseUrls) || String(env?.IMAGE2_BASE_URL || "").trim();
  if (!baseUrl) {
    throw new Error("No image API base URL. Set IMAGE2_BASE_URL or use --base-url.");
  }
  const profile_id = expectedProfileId === null
    ? null
    : requireMatchingImage2RuntimeProfileId({ expectedProfileId, env });
  return Object.freeze({
    base_url: normalizeBaseUrl(baseUrl),
    api_key: apiKey,
    ...(profile_id === null ? {} : { profile_id }),
  });
}

export { normalizeBaseUrl as normalizeImage2BaseUrl };
