import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import {
  FRAMED_TEXT_FRAME_STANDARD_V1,
  preflightFramedTextFrame,
} from "../../02-visual-system/index.mjs";

export const PAGE_AUTHORITY_RAW_IMAGE_CONTRACT_SCHEMA = "pptmaker-page-authority-raw-image-contract-v1";
export const PAGE_AUTHORITY_RAW_GENERATION_PROFILE_SCHEMA = "pptmaker-page-authority-raw-generation-profile-v1";
export const PAGE_AUTHORITY_STYLE_MASTER_RELATIVE_PATH = "2_backbone/visual-style/style_master.jpg";

export class PageAuthorityRawProfileError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityRawProfileError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactObject(value, keys, context) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PageAuthorityRawProfileError("invalid_profile_mapping", `${context} must be an object`);
  }
  const unknown = Object.keys(value).filter((key) => !keys.includes(key));
  const missing = keys.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length || missing.length) {
    throw new PageAuthorityRawProfileError("invalid_profile_mapping", `${context} keys mismatch; missing=${missing.join(",") || "none"}; unknown=${unknown.join(",") || "none"}`);
  }
  return value;
}

function nonEmptyString(value, context) {
  if (typeof value !== "string" || !value.trim()) throw new PageAuthorityRawProfileError("invalid_profile_scalar", `${context} must be a non-empty string`);
  return value;
}

function hashOnlyStyleMaster(bytes) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    throw new PageAuthorityRawProfileError("invalid_style_master_bytes", "effective style-master bytes are required");
  }
  const copy = Buffer.from(bytes);
  if (copy.length === 0) throw new PageAuthorityRawProfileError("invalid_style_master_bytes", "effective style-master bytes must not be empty");
  return { sha256: sha256(copy), bytes: copy.length };
}

/** Read the one effective backbone style-master byte profile. */
export function loadEffectiveStyleMasterByteProfile(deckDir) {
  if (typeof deckDir !== "string" || !deckDir) throw new TypeError("deckDir must be a non-empty path");
  const path = resolve(deckDir, PAGE_AUTHORITY_STYLE_MASTER_RELATIVE_PATH);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch (error) {
    throw new PageAuthorityRawProfileError("style_master_unavailable", `could not read effective style-master bytes: ${error.message}`);
  }
  return deepFreeze(hashOnlyStyleMaster(bytes));
}

function rawDisplay(slide) {
  const fields = slide.display;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    throw new PageAuthorityRawProfileError("invalid_source_receipt", "slide receipt must contain normalized display fields");
  }
  return { kicker: fields.kicker, title: fields.title, subtitle: fields.subtitle, callout: fields.callout };
}

function visualLanguageSourceProjection(slide) {
  const language = slide.visual_language;
  if (!language?.projection || typeof language.projection !== "object") {
    throw new PageAuthorityRawProfileError("unresolved_visual_language", "slide receipt must contain a resolved visual-language projection");
  }
  const negativeConstraints = slide.visual_brief?.negative_constraints;
  if (!Array.isArray(negativeConstraints) || !negativeConstraints.every((value) => typeof value === "string")) {
    throw new PageAuthorityRawProfileError("invalid_source_receipt", "slide receipt must contain normalized visual brief constraints");
  }
  return { ...language.projection, negative_constraints: [...negativeConstraints] };
}

/**
 * Compile only source-owned visual semantics. Provider/model/output/style-master
 * facts are deliberately absent and belong in raw_generation_profile instead.
 */
export function buildPageAuthorityRawImageContract({ slide, visual_system = null, preflight = null } = {}) {
  if (!slide || typeof slide !== "object" || Array.isArray(slide)) {
    throw new PageAuthorityRawProfileError("invalid_source_receipt", "a resolved slide receipt is required");
  }
  if (typeof slide.slide_id !== "string" || !slide.slide_id) throw new PageAuthorityRawProfileError("invalid_source_receipt", "slide receipt must have slide_id");
  if (!["pure-image2", "framed-image2"].includes(slide.authority)) throw new PageAuthorityRawProfileError("invalid_source_receipt", "slide receipt must resolve pure-image2 or framed-image2 authority");
  const language = visualLanguageSourceProjection(slide);
  let framed = null;
  let display = null;
  if (slide.authority === "framed-image2") {
    const effectivePreflight = preflight || preflightFramedTextFrame(slide.text_frame);
    if (!effectivePreflight.ok || !effectivePreflight.authorization_allowed) {
      throw new PageAuthorityRawProfileError("framed_preflight_required", "Framed text overflow must be repaired before raw Image2 authorization");
    }
    framed = {
      preset: FRAMED_TEXT_FRAME_STANDARD_V1.id,
      preset_digest: effectivePreflight.evidence.preset_digest,
      canvas: effectivePreflight.evidence.canvas,
      reserved_underlay_rectangles: effectivePreflight.evidence.reserved_underlay_rectangles,
    };
  } else {
    display = rawDisplay(slide);
  }
  const contract = {
    schema: PAGE_AUTHORITY_RAW_IMAGE_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    authority: slide.authority,
    visual_language: language.projection || language,
    visual_identity: slide.visual_language?.identity_reference?.projection || null,
    ...(visual_system ? { visual_system } : {}),
    ...(framed ? { framed } : { display }),
  };
  return deepFreeze({
    contract,
    raw_image_contract_digest: canonicalJsonSha256(contract),
  });
}

/**
 * Compile only provider-owned execution facts. The effective style-master is
 * bound by byte hash; its path and bytes never enter the source contract.
 */
export function buildPageAuthorityRawGenerationProfile({ provider, output, style_master_bytes, reference_transport } = {}) {
  exactObject(provider, ["provider", "model", "api_revision"], "provider");
  exactObject(output, ["format", "width", "height"], "output");
  exactObject(reference_transport, ["style_master", "identity_reference"], "reference_transport");
  const normalizedProvider = {
    provider: nonEmptyString(provider.provider, "provider.provider"),
    model: nonEmptyString(provider.model, "provider.model"),
    api_revision: nonEmptyString(provider.api_revision, "provider.api_revision"),
  };
  if (output.format !== "png" || output.width !== 2000 || output.height !== 1125) {
    throw new PageAuthorityRawProfileError("invalid_provider_output", "output must be fixed PNG 2000x1125");
  }
  if (reference_transport.style_master !== "image-reference-v1" || !["none", "image-reference-v1"].includes(reference_transport.identity_reference)) {
    throw new PageAuthorityRawProfileError("invalid_reference_transport", "reference transport must use image-reference-v1 for style master and none|image-reference-v1 for identity");
  }
  const profile = {
    schema: PAGE_AUTHORITY_RAW_GENERATION_PROFILE_SCHEMA,
    provider: normalizedProvider,
    output: { format: "png", width: 2000, height: 1125 },
    reference_transport,
    effective_style_master: hashOnlyStyleMaster(style_master_bytes),
  };
  return deepFreeze({
    profile,
    raw_generation_profile_digest: canonicalJsonSha256(profile),
  });
}
