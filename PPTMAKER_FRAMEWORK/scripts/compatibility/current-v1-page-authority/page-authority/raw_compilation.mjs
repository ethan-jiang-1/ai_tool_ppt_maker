import { canonicalJson } from "../../../contracts/canonical_json.mjs";
import { PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA } from "../../../01-content/index.mjs";
import {
  buildPageAuthorityRawImageContract,
  PAGE_AUTHORITY_RAW_GENERATION_PROFILE_SCHEMA,
} from "./raw_profiles.mjs";
import { inspectPageAuthorityRawProviderAuthorization } from "../../../shared/state/state.mjs";

export const PAGE_AUTHORITY_RAW_BATCH_SCHEMA = "pptmaker-page-authority-raw-batch-v1";
export const PAGE_AUTHORITY_RAW_PROVIDER_REQUEST_SCHEMA = "pptmaker-page-authority-raw-provider-request-v1";

const SHA256_RE = /^[0-9a-f]{64}$/;

export class PageAuthorityRawCompilationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityRawCompilationError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (ArrayBuffer.isView(value)) return value;
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function assertReceipt(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) ||
    receipt.schema !== PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA ||
    receipt.pipeline !== "page-authority-image2-v1" ||
    !SHA256_RE.test(receipt.source_sha256 || "") || !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new PageAuthorityRawCompilationError("invalid_source_receipt", "a resolved Page Authority source receipt is required");
  }
  const seen = new Set();
  for (const slide of receipt.slides) {
    if (!slide || typeof slide !== "object" || typeof slide.slide_id !== "string" || !slide.slide_id || seen.has(slide.slide_id)) {
      throw new PageAuthorityRawCompilationError("invalid_source_receipt", "source receipt must contain unique stable slide IDs");
    }
    seen.add(slide.slide_id);
  }
}

function assertProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile) ||
    profile.profile?.schema !== PAGE_AUTHORITY_RAW_GENERATION_PROFILE_SCHEMA ||
    !SHA256_RE.test(profile.raw_generation_profile_digest || "")) {
    throw new PageAuthorityRawCompilationError("invalid_generation_profile", "a closed Page Authority raw generation profile is required");
  }
}

function framedLiterals(slide) {
  const frame = slide.text_frame;
  if (!frame || typeof frame !== "object") {
    throw new PageAuthorityRawCompilationError("invalid_source_receipt", `Framed slide ${slide.slide_id} has no Text Frame receipt`);
  }
  return [frame.kicker, frame.title, frame.subtitle, frame.callout].filter((value) => typeof value === "string" && value.length > 0);
}

function requestForSlide(slide, generationProfile, options) {
  const raw = buildPageAuthorityRawImageContract({
    slide,
    ...(options.visual_system ? { visual_system: options.visual_system } : {}),
    ...(options.preflight_by_slide?.[slide.slide_id] ? { preflight: options.preflight_by_slide[slide.slide_id] } : {}),
  });
  const provider_payload = {
    schema: PAGE_AUTHORITY_RAW_PROVIDER_REQUEST_SCHEMA,
    slide_id: slide.slide_id,
    authority: slide.authority,
    raw_image_contract_digest: raw.raw_image_contract_digest,
    raw_generation_profile_digest: generationProfile.raw_generation_profile_digest,
    image_contract: raw.contract,
    generation_profile: generationProfile.profile,
  };
  if (slide.authority === "framed-image2") {
    const constraints = raw.contract.visual_language?.negative_constraints;
    if (!Array.isArray(constraints) || !constraints.includes("no-readable-text") || !constraints.includes("no-labels")) {
      throw new PageAuthorityRawCompilationError("framed_no_text_constraints_missing", `Framed slide ${slide.slide_id} must carry no-readable-text and no-labels`);
    }
    const serialized = canonicalJson(provider_payload);
    for (const literal of framedLiterals(slide)) {
      if (serialized.includes(literal)) {
        throw new PageAuthorityRawCompilationError("framed_text_leak", `Framed Text Frame literal reached provider payload for ${slide.slide_id}`);
      }
    }
  }
  return {
    slide_id: slide.slide_id,
    authority: slide.authority,
    raw_image_contract_digest: raw.raw_image_contract_digest,
    raw_generation_profile_digest: generationProfile.raw_generation_profile_digest,
    provider_payload,
  };
}

/**
 * Compile deterministic, receipt-only provider requests. This performs no
 * credential lookup, filesystem access, provider work, or artifact mutation.
 */
export function compilePageAuthorityRawBatch({ receipt, generation_profile, visual_system = null, preflight_by_slide = null } = {}) {
  assertReceipt(receipt);
  assertProfile(generation_profile);
  if (visual_system !== null && (typeof visual_system !== "object" || Array.isArray(visual_system))) {
    throw new PageAuthorityRawCompilationError("invalid_visual_system", "visual_system must be an object when present");
  }
  if (preflight_by_slide !== null && (typeof preflight_by_slide !== "object" || Array.isArray(preflight_by_slide))) {
    throw new PageAuthorityRawCompilationError("invalid_preflight", "preflight_by_slide must be an object when present");
  }
  const requests = receipt.slides
    .map((slide) => requestForSlide(slide, generation_profile, { visual_system, preflight_by_slide }))
    .sort((left, right) => left.slide_id.localeCompare(right.slide_id));
  return deepFreeze({
    schema: PAGE_AUTHORITY_RAW_BATCH_SCHEMA,
    source_sha256: receipt.source_sha256,
    raw_generation_profile_digest: generation_profile.raw_generation_profile_digest,
    requests,
  });
}

/** Return canonical bytes for one provider request without performing submit. */
export function canonicalPageAuthorityProviderPayload(request) {
  if (!request || typeof request !== "object" || request.provider_payload?.schema !== PAGE_AUTHORITY_RAW_PROVIDER_REQUEST_SCHEMA) {
    throw new PageAuthorityRawCompilationError("invalid_provider_request", "a compiled Page Authority request is required");
  }
  return canonicalJson(request.provider_payload);
}

/**
 * The sole raw-submit seam. It is intentionally transport-agnostic: caller
 * supplied transport owns credentials, while this module proves exact scope
 * before the first call. Empty/reuse-only batches do not need authorization.
 */
export async function submitAuthorizedPageAuthorityRawBatch({ deckDir, runVersion, runDir, rawBatch, submit } = {}) {
  if (!rawBatch || rawBatch.schema !== PAGE_AUTHORITY_RAW_BATCH_SCHEMA || !Array.isArray(rawBatch.requests)) {
    throw new PageAuthorityRawCompilationError("invalid_raw_batch", "a compiled Page Authority raw batch is required");
  }
  if (rawBatch.requests.length === 0) return deepFreeze({ submitted: 0, results: [] });
  if (typeof submit !== "function") throw new PageAuthorityRawCompilationError("provider_submit_required", "a provider submit function is required for a nonzero batch");
  const authorization = inspectPageAuthorityRawProviderAuthorization(deckDir, {
    runVersion,
    runDir,
    rawBatch,
    maxSubmissions: rawBatch.requests.length,
  });
  if (!authorization.ok) {
    throw new PageAuthorityRawCompilationError("provider_authorization_required", `Page Authority provider authorization failed: ${authorization.code}`);
  }
  const results = [];
  for (const request of rawBatch.requests) {
    results.push(await submit(Object.freeze({
      authorization: authorization.record,
      request: request.provider_payload,
    })));
  }
  return deepFreeze({ submitted: rawBatch.requests.length, results });
}
