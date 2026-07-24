import { canonicalJsonSha256 } from "./canonical_json.mjs";
import { sha256Bytes } from "./byte_hash.mjs";

export const ARTIFACT_STATUS_VERIFIED = "verified";
export const ARTIFACT_STATUS_MISSING = "missing";
export const ARTIFACT_STATUS_AMBIGUOUS = "ambiguous";

export const RENDER_ENGINE_IMAGE2 = "image2";
export const ARTIFACT_KIND_RAW_RENDER = "raw-render";
export const ARTIFACT_KIND_FINAL_SLIDE = "final-slide";
export const ARTIFACT_MANIFEST_VERSION = 2;
export const WHOLE_PAGE_ARTIFACT_PIPELINE = "whole-page-image2-v1";
export const FINAL_SLIDE_CONTRACT_VERSION = 1;

const SHA256_RE = /^[0-9a-f]{64}$/;

function requireSha256(value, name) {
  if (!SHA256_RE.test(value || "")) throw new TypeError(`${name} must be a lowercase SHA-256`);
  return value;
}

export function finalSlideFingerprintV1({ producer, producerPrivateFingerprint, byteSha256, width, height, mediaProfile }) {
  if (typeof producer !== "string" || !producer) throw new TypeError("producer is required");
  requireSha256(producerPrivateFingerprint, "producerPrivateFingerprint");
  requireSha256(byteSha256, "byteSha256");
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new TypeError("final-slide dimensions must be positive integers");
  }
  if (typeof mediaProfile !== "string" || !mediaProfile) throw new TypeError("mediaProfile is required");
  return canonicalJsonSha256({
    schema: "final_slide_fingerprint_v1",
    contract_version: FINAL_SLIDE_CONTRACT_VERSION,
    producer,
    producer_private_fingerprint: producerPrivateFingerprint,
    byte_sha256: byteSha256,
    width,
    height,
    media_profile: mediaProfile,
  });
}

/**
 * Verify bytes supplied by an owning Phase. This function never discovers or
 * reads a path: callers must confine and read the bytes before crossing the
 * shared identity seam.
 */
export function verifyCallerSuppliedBytes({ bytes, declaredSha256 }) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("bytes must be a Uint8Array");
  requireSha256(declaredSha256, "declaredSha256");
  const actualSha256 = sha256Bytes(bytes);
  if (actualSha256 !== declaredSha256) throw new Error("final-slide byte SHA-256 drifted");
  return actualSha256;
}

/** Normalize one owner-verified final slide into the provider-neutral record. */
export function normalizeFinalSlideRecord({
  slideId,
  producer,
  producerPrivateFingerprint,
  byteSha256,
  width,
  height,
  mediaProfile,
  declaredFingerprint,
  path,
  absolutePath,
}) {
  if (typeof slideId !== "string" || !slideId) throw new TypeError("slideId is required");
  const expectedFingerprint = finalSlideFingerprintV1({
    producer,
    producerPrivateFingerprint,
    byteSha256,
    width,
    height,
    mediaProfile,
  });
  if (declaredFingerprint != null && declaredFingerprint !== expectedFingerprint) {
    throw new Error(`final-slide fingerprint drifted for ${slideId}`);
  }
  if (typeof path !== "string" || !path) throw new TypeError("provider-neutral path is required");
  return Object.freeze({
    slide_id: slideId,
    artifact_kind: ARTIFACT_KIND_FINAL_SLIDE,
    producer,
    final_slide_fingerprint: expectedFingerprint,
    path,
    ...(absolutePath ? { absolute_path: absolutePath } : {}),
    sha256: byteSha256,
    width,
    height,
    media_profile: mediaProfile,
  });
}

export function artifactManifestEntryKey({ slideId, renderEngine, artifactKind }) {
  return `${slideId}::${renderEngine}::${artifactKind}`;
}

export function artifactIdentity({ slideId, renderEngine, artifactKind, fingerprint = null }) {
  return {
    slide_id: String(slideId),
    render_engine: String(renderEngine),
    artifact_kind: String(artifactKind),
    ...(fingerprint ? { fingerprint: String(fingerprint) } : {}),
  };
}

export function emptyArtifactManifest() {
  return {
    version: ARTIFACT_MANIFEST_VERSION,
    pipeline: WHOLE_PAGE_ARTIFACT_PIPELINE,
    entries: {},
  };
}
