/**
 * image2/runtime_profile_id — Import-safe runtime profile-id grammar helper for pre-install checks.
 * Authority: openspec/specs/harness-script-layout/spec.md
 * Authority: openspec/specs/environment-check/spec.md
 */

const PROFILE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isImage2ProviderProfileId(value) {
  return typeof value === "string" && PROFILE_ID_RE.test(value);
}

export function requireImage2ProviderProfileId(value, label = "IMAGE2_PROVIDER_PROFILE_ID") {
  if (!isImage2ProviderProfileId(value)) {
    const error = new Error(`${label} must be one lower-kebab identifier`);
    error.code = "IMAGE2_PROVIDER_PROFILE_ID_INVALID";
    throw error;
  }
  return value;
}

export function resolveImage2RuntimeProfileId({ env = process.env } = {}) {
  const value = String(env?.IMAGE2_PROVIDER_PROFILE_ID || "").trim();
  if (!value) {
    const error = new Error("IMAGE2_PROVIDER_PROFILE_ID is not set");
    error.code = "IMAGE2_PROVIDER_PROFILE_ID_MISSING";
    throw error;
  }
  return requireImage2ProviderProfileId(value);
}

export function requireMatchingImage2RuntimeProfileId({ expectedProfileId, env = process.env } = {}) {
  const expected = requireImage2ProviderProfileId(expectedProfileId, "expected Image2 profile ID");
  const actual = resolveImage2RuntimeProfileId({ env });
  if (actual !== expected) {
    const error = new Error("IMAGE2_PROVIDER_PROFILE_ID does not match the current provider profile");
    error.code = "IMAGE2_PROVIDER_PROFILE_ID_MISMATCH";
    throw error;
  }
  return actual;
}
