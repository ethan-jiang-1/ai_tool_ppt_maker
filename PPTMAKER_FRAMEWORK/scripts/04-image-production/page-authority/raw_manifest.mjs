import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_RAW_BATCH_SCHEMA } from "./raw_compilation.mjs";

export const PAGE_AUTHORITY_RAW_MANIFEST_SCHEMA = "pptmaker-page-authority-raw-manifest-v1";

const SHA256_RE = /^[0-9a-f]{64}$/;
const SAFE_SLIDE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;

export class PageAuthorityRawManifestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityRawManifestError";
    this.code = code;
  }
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}
function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
function safeSlideId(slideId) {
  if (!SAFE_SLIDE_ID.test(slideId || "")) throw new PageAuthorityRawManifestError("invalid_slide_id", "slide_id must be a stable safe ID");
  return slideId;
}

export function pageAuthorityRawImagePath(runDir, slideId) {
  return join(pageAuthorityImage2Paths(runDir).raw_root, `${safeSlideId(slideId)}.png`);
}

function assertBatch(rawBatch) {
  if (!rawBatch || typeof rawBatch !== "object" || rawBatch.schema !== PAGE_AUTHORITY_RAW_BATCH_SCHEMA ||
    !SHA256_RE.test(rawBatch.source_sha256 || "") || !SHA256_RE.test(rawBatch.raw_generation_profile_digest || "") ||
    !Array.isArray(rawBatch.requests)) {
    throw new PageAuthorityRawManifestError("invalid_raw_batch", "a compiled Page Authority raw batch is required");
  }
  const seen = new Set();
  for (const request of rawBatch.requests) {
    if (!exactKeys(request, ["slide_id", "authority", "raw_image_contract_digest", "raw_generation_profile_digest", "provider_payload"]) ||
      !SAFE_SLIDE_ID.test(request.slide_id || "") || seen.has(request.slide_id) ||
      !SHA256_RE.test(request.raw_image_contract_digest || "") ||
      request.raw_generation_profile_digest !== rawBatch.raw_generation_profile_digest) {
      throw new PageAuthorityRawManifestError("invalid_raw_batch", "raw batch requests must be unique exact Page Authority requests");
    }
    seen.add(request.slide_id);
  }
}

function validManifestItem(item, profileDigest) {
  const baseKeys = ["slide_id", "raw_sha256", "raw_image_contract_digest", "raw_generation_profile_digest", "image_path"];
  const materialized = exactKeys(item, [...baseKeys, "provenance", "source_lineage"]) && item.provenance === "unreviewed" &&
    item.source_lineage && typeof item.source_lineage === "object" && !Array.isArray(item.source_lineage) &&
    exactKeys(item.source_lineage, ["run_dir", "raw_sha256"]) && typeof item.source_lineage.run_dir === "string" && SHA256_RE.test(item.source_lineage.raw_sha256 || "");
  return (exactKeys(item, baseKeys) || materialized) &&
    SAFE_SLIDE_ID.test(item.slide_id || "") && SHA256_RE.test(item.raw_sha256 || "") &&
    SHA256_RE.test(item.raw_image_contract_digest || "") && item.raw_generation_profile_digest === profileDigest &&
    item.image_path === `${item.slide_id}.png`;
}

export function validatePageAuthorityRawManifest(manifest, { rawBatch = null, sourceEpoch = null, readFile = readFileSync, runDir = null } = {}) {
  const errors = [];
  const manifestKeys = ["schema", "source_epoch", "source_sha256", "raw_generation_profile_digest", "items"];
  const structuralShape = exactKeys(manifest, [...manifestKeys, "needs_raw_generation"]) && Array.isArray(manifest.needs_raw_generation) && manifest.needs_raw_generation.every((id) => SAFE_SLIDE_ID.test(id));
  if (!(exactKeys(manifest, manifestKeys) || structuralShape) ||
    manifest.schema !== PAGE_AUTHORITY_RAW_MANIFEST_SCHEMA || !Number.isInteger(manifest.source_epoch) || manifest.source_epoch <= 0 ||
    !SHA256_RE.test(manifest.source_sha256 || "") || !SHA256_RE.test(manifest.raw_generation_profile_digest || "") || !Array.isArray(manifest.items)) {
    return Object.freeze({ ok: false, code: "RAW_MANIFEST_INVALID", errors: Object.freeze(["manifest shape is invalid"]) });
  }
  const seen = new Set();
  let previous = null;
  for (const item of manifest.items) {
    if (!validManifestItem(item, manifest.raw_generation_profile_digest)) errors.push(`invalid item ${item?.slide_id || "unknown"}`);
    if (seen.has(item?.slide_id)) errors.push(`duplicate slide ${item?.slide_id}`);
    if (previous !== null && previous >= item?.slide_id) errors.push("items are not in lexical slide_id order");
    seen.add(item?.slide_id);
    previous = item?.slide_id;
    if (runDir && validManifestItem(item, manifest.raw_generation_profile_digest)) {
      const expected = pageAuthorityRawImagePath(runDir, item.slide_id);
      try {
        const bytes = readFile(expected);
        if (!bytes?.length || sha256(bytes) !== item.raw_sha256) errors.push(`raw bytes drift for ${item.slide_id}`);
      } catch { errors.push(`raw bytes missing for ${item.slide_id}`); }
    }
  }
  if (sourceEpoch !== null && manifest.source_epoch !== sourceEpoch) errors.push("source epoch changed");
  if (rawBatch) {
    try { assertBatch(rawBatch); } catch (error) { errors.push(error.message); }
    if (manifest.raw_generation_profile_digest !== rawBatch.raw_generation_profile_digest) errors.push("generation profile changed");
    const requestById = new Map(rawBatch.requests.map((request) => [request.slide_id, request]));
    for (const item of manifest.items) {
      const request = requestById.get(item.slide_id);
      if (!request || request.raw_image_contract_digest !== item.raw_image_contract_digest ||
        request.raw_generation_profile_digest !== item.raw_generation_profile_digest) errors.push(`raw contract changed for ${item.slide_id}`);
    }
    for (const request of rawBatch.requests) {
      if (!seen.has(request.slide_id)) errors.push(`raw evidence missing for ${request.slide_id}`);
    }
  }
  return Object.freeze({ ok: errors.length === 0, code: errors.length ? "RAW_MANIFEST_STALE" : "RAW_MANIFEST_CURRENT", errors: Object.freeze(errors) });
}

/** Materialize verified raw PNG bytes and their four-tuple manifest. */
export function writePageAuthorityRawManifest(runDir, { rawBatch, sourceEpoch, images } = {}) {
  assertBatch(rawBatch);
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new PageAuthorityRawManifestError("invalid_source_epoch", "sourceEpoch must be a positive integer");
  if (!images || typeof images !== "object" || Array.isArray(images)) throw new PageAuthorityRawManifestError("invalid_raw_images", "images must map stable slide IDs to nonempty PNG bytes");
  const paths = pageAuthorityImage2Paths(runDir);
  const expectedIds = rawBatch.requests.map((request) => request.slide_id).sort();
  if (Object.keys(images).sort().join("\n") !== expectedIds.join("\n")) throw new PageAuthorityRawManifestError("raw_image_scope_mismatch", "raw image bytes must exactly cover the compiled batch");
  mkdirSync(paths.raw_root, { recursive: true });
  const items = rawBatch.requests.map((request) => {
    const bytes = images[request.slide_id];
    if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) throw new PageAuthorityRawManifestError("invalid_raw_image", `raw image ${request.slide_id} must be bytes`);
    const copy = Buffer.from(bytes);
    if (copy.length === 0) throw new PageAuthorityRawManifestError("invalid_raw_image", `raw image ${request.slide_id} must not be empty`);
    const output = pageAuthorityRawImagePath(runDir, request.slide_id);
    writeFileSync(output, copy);
    return {
      slide_id: request.slide_id,
      raw_sha256: sha256(copy),
      raw_image_contract_digest: request.raw_image_contract_digest,
      raw_generation_profile_digest: request.raw_generation_profile_digest,
      image_path: `${request.slide_id}.png`,
    };
  }).sort((left, right) => left.slide_id.localeCompare(right.slide_id));
  const manifest = {
    schema: PAGE_AUTHORITY_RAW_MANIFEST_SCHEMA,
    source_epoch: sourceEpoch,
    source_sha256: rawBatch.source_sha256,
    raw_generation_profile_digest: rawBatch.raw_generation_profile_digest,
    items,
  };
  const validation = validatePageAuthorityRawManifest(manifest, { rawBatch, sourceEpoch, runDir });
  if (!validation.ok) throw new PageAuthorityRawManifestError("raw_manifest_invalid", validation.errors.join("; "));
  const bytes = Buffer.from(`${canonicalJson(manifest)}\n`, "utf8");
  const tmp = join(dirname(paths.raw_manifest), `.${"manifest.json"}.tmp-${process.pid}`);
  writeFileSync(tmp, bytes);
  renameSync(tmp, paths.raw_manifest);
  return deepFreeze({ manifest, path: paths.raw_manifest, sha256: sha256(bytes) });
}

export function readPageAuthorityRawManifest(runDir) {
  const path = pageAuthorityImage2Paths(runDir).raw_manifest;
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new PageAuthorityRawManifestError("raw_manifest_unreadable", "raw manifest is not valid JSON"); }
}

/** Provider-free reuse classification. Source file SHA may differ for a local Framed frame edit. */
export function classifyPageAuthorityRawReuse({ rawBatch, sourceEpoch, manifest, runDir = null } = {}) {
  assertBatch(rawBatch);
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new PageAuthorityRawManifestError("invalid_source_epoch", "sourceEpoch must be a positive integer");
  const prior = manifest || (runDir ? readPageAuthorityRawManifest(runDir) : null);
  const priorById = new Map(prior?.items?.map((item) => [item.slide_id, item]) || []);
  const classification = rawBatch.requests.map((request) => {
    const item = priorById.get(request.slide_id);
    let status = "reusable";
    let reason = null;
    if (!prior) { status = "needs_raw_generation"; reason = "raw_manifest_missing"; }
    else if (prior.source_epoch !== sourceEpoch) { status = "needs_raw_generation"; reason = "source_epoch_changed"; }
    else if (prior.raw_generation_profile_digest !== rawBatch.raw_generation_profile_digest) { status = "needs_raw_generation"; reason = "generation_profile_changed"; }
    else if (!item || item.raw_image_contract_digest !== request.raw_image_contract_digest || item.raw_generation_profile_digest !== request.raw_generation_profile_digest) { status = "needs_raw_generation"; reason = "raw_contract_changed"; }
    else if (runDir && !validatePageAuthorityRawManifest({ ...prior, items: [item] }, { runDir }).ok) { status = "needs_raw_generation"; reason = "raw_bytes_missing_or_drifted"; }
    return { slide_id: request.slide_id, status, ...(reason ? { reason } : {}), ...(item ? { raw_tuple: {
      slide_id: item.slide_id,
      raw_sha256: item.raw_sha256,
      raw_image_contract_digest: item.raw_image_contract_digest,
      raw_generation_profile_digest: item.raw_generation_profile_digest,
    } } : {}) };
  });
  return deepFreeze(classification);
}
