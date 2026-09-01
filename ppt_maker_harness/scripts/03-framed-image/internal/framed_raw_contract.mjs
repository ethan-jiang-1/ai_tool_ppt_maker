import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  isPageImageProviderClausesBoundToVisualLanguage,
  isPageImageProviderClausesShape,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { normalizePageImageHeaderPolicy, normalizePageImageProviderContent } from "../../shared/page-image/page_image_core.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, SHA256_RE, SUBJECT_RESTRICTIONS } from "./framed_identity.mjs";

export const FRAMED_RAW_CONTRACT_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "workflow",
  "visual_language",
  "provider_clauses",
  "visual_identity_role_clause",
  "visual_scene",
  "visual_identity",
  "page_design_system",
  "page_image_core",
  "provider_rendered_content",
  "framed",
]);
export const FRAMED_RAW_CONTRACT_CORE_KEYS = Object.freeze([
  "schema",
  "canonical_semantic_sha256",
  "page_design_system_sha256",
]);
export const PAGE_DESIGN_SYSTEM_KEYS = Object.freeze(["text", "sha256"]);
export const FRAMED_PROVIDER_RENDERED_CONTENT_KEYS = Object.freeze(["items"]);
export const FRAMED_RAW_CONTRACT_FRAME_KEYS = Object.freeze([
  "profile_id",
  "profile_digest",
  "presentation_binding_sha256",
  "canvas",
  "protected_composition",
  "local_header",
  "subject_restrictions",
  "render_profile_digest",
]);
export const FRAMED_HEADER_POLICY_KEYS = Object.freeze(["local_header"]);
export const FRAMED_HEADER_FIELDS = Object.freeze(["kicker", "title", "subtitle"]);
export const IDENTITY_PROJECTION_KEYS = Object.freeze([
  "profile",
  "role",
  "reference_sha256",
  "role_clause_sha256",
  "subject_class",
  "identity_subject_count",
  "subject_restrictions",
]);
export const LOWER_KEBAB_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function hasValidIdentityFacts(rawContract) {
  const projection = rawContract.visual_identity;
  const roleClause = rawContract.visual_identity_role_clause;
  if ((projection === null) !== (roleClause === null)) return false;
  if (projection === null) return true;
  return hasExactKeys(projection, IDENTITY_PROJECTION_KEYS) &&
    typeof roleClause === "string" && roleClause.length > 0 &&
    LOWER_KEBAB_ID_RE.test(projection.profile || "") &&
    LOWER_KEBAB_ID_RE.test(projection.role || "") &&
    LOWER_KEBAB_ID_RE.test(projection.subject_class || "") &&
    SHA256_RE.test(projection.reference_sha256 || "") &&
    SHA256_RE.test(projection.role_clause_sha256 || "") &&
    projection.identity_subject_count === "one" &&
    SUBJECT_RESTRICTIONS.has(projection.subject_restrictions) &&
    sha256Bytes(Buffer.from(roleClause, "utf8")) === projection.role_clause_sha256;
}

function hasValidPageDesignSystemFacts(rawContract) {
  const binding = rawContract.page_design_system;
  const coreDigest = rawContract.page_image_core?.page_design_system_sha256;
  if (!hasExactKeys(binding, PAGE_DESIGN_SYSTEM_KEYS) ||
    (binding.text === null) !== (binding.sha256 === null)) {
    return false;
  }
  if (binding.text === null) return coreDigest === null;
  return typeof binding.text === "string" && binding.text.trim().length > 0 &&
    SHA256_RE.test(binding.sha256 || "") && coreDigest === binding.sha256 &&
    sha256Bytes(Buffer.from(binding.text, "utf8")) === binding.sha256;
}

export function isNormalizedRectangle(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    hasExactKeys(value, ["x", "y", "width", "height"]) &&
    [value.x, value.y, value.width, value.height].every(Number.isFinite) &&
    value.width > 0 && value.height > 0 && value.x >= 0 && value.y >= 0 &&
    value.x + value.width <= 1 && value.y + value.height <= 1;
}

export function isProtectedComposition(value) {
  if (!hasExactKeys(value, ["coordinate_space", "reserved_header", "body_safe"]) ||
    value.coordinate_space !== "normalized-canvas" ||
    !isNormalizedRectangle(value.reserved_header) || !isNormalizedRectangle(value.body_safe)) {
    return false;
  }
  const reserved = value.reserved_header;
  const bodySafe = value.body_safe;
  return bodySafe.x === 0 && bodySafe.width === 1 &&
    bodySafe.y === reserved.y + reserved.height &&
    bodySafe.height === 1 - reserved.y - reserved.height &&
    reserved.y + reserved.height < 1;
}

export function validateFramedRawContractAgainstProfile(rawContract, renderProfile) {
  try {
    if (!hasExactKeys(rawContract, FRAMED_RAW_CONTRACT_KEYS) ||
      rawContract.schema !== TARGET_RAW_CONTRACT_SCHEMA ||
      rawContract.workflow !== FRAMED_IMAGE_WORKFLOW ||
      typeof rawContract.slide_id !== "string" || !rawContract.slide_id ||
      !rawContract.visual_language || typeof rawContract.visual_language !== "object" || Array.isArray(rawContract.visual_language) ||
      !isPageImageProviderClausesShape(rawContract.provider_clauses) ||
      !isPageImageProviderClausesBoundToVisualLanguage(rawContract.visual_language, rawContract.provider_clauses) ||
      (rawContract.visual_scene !== null && typeof rawContract.visual_scene !== "string") ||
      !hasValidIdentityFacts(rawContract) ||
      !hasExactKeys(rawContract.page_image_core, FRAMED_RAW_CONTRACT_CORE_KEYS) ||
      rawContract.page_image_core.schema !== "page-image-core-slide-facts" ||
      !SHA256_RE.test(rawContract.page_image_core.canonical_semantic_sha256 || "") ||
      !hasValidPageDesignSystemFacts(rawContract) ||
      !hasExactKeys(rawContract.provider_rendered_content, FRAMED_PROVIDER_RENDERED_CONTENT_KEYS) ||
      !Array.isArray(rawContract.provider_rendered_content.items) ||
      !hasExactKeys(rawContract.framed, FRAMED_RAW_CONTRACT_FRAME_KEYS)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has an invalid canonical shape");
    }
    const frame = rawContract.framed;
    if (frame.profile_id !== renderProfile?.preset?.id ||
      frame.profile_digest !== renderProfile?.preset?.digest ||
      !hasExactKeys(frame.canvas, ["css_width", "css_height", "capture_width", "capture_height"]) ||
      !isProtectedComposition(frame.protected_composition) ||
      !SUBJECT_RESTRICTIONS.has(frame.subject_restrictions) ||
      !SHA256_RE.test(frame.presentation_binding_sha256 || "") || !SHA256_RE.test(frame.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has invalid frame facts");
    }
    if (!SHA256_RE.test(renderProfile?.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_render_profile_required", "Framed raw contracts require the canonical render profile");
    }
    if (frame.render_profile_digest !== renderProfile.render_profile_digest) {
      throw new FramedImageWorkflowError("framed_raw_contract_profile_stale", "Framed raw contract does not bind the current render profile");
    }
    const headerPolicy = normalizePageImageHeaderPolicy({
      local_header: frame.local_header,
    }, FRAMED_IMAGE_WORKFLOW);
    const providerContent = normalizePageImageProviderContent(rawContract.provider_rendered_content);
    if (canonicalJsonSha256(headerPolicy.local_header) !== canonicalJsonSha256(frame.local_header) ||
      canonicalJsonSha256(providerContent.items) !== canonicalJsonSha256(rawContract.provider_rendered_content.items)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract must retain normalized Page Image Core facts");
    }
    return Object.freeze({
      ok: true,
      raw_contract_sha256: canonicalJsonSha256(rawContract),
      render_profile_digest: frame.render_profile_digest,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "framed_raw_contract_invalid",
      message: error.message || "Framed raw contract is invalid",
    });
  }
}

/** Validate one Framed raw contract against the canonical current render profile. */
export function validateFramedRawContract(rawContract) {
  try {
    if (!hasExactKeys(rawContract, FRAMED_RAW_CONTRACT_KEYS) || !hasExactKeys(rawContract.framed, FRAMED_RAW_CONTRACT_FRAME_KEYS)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has an invalid canonical shape");
    }
    return validateFramedRawContractAgainstProfile(rawContract, {
      preset: { id: rawContract.framed.profile_id, digest: rawContract.framed.profile_digest },
      render_profile_digest: rawContract.framed.render_profile_digest,
    });
  } catch (error) {
    return Object.freeze({ ok: false, code: error.code || "framed_raw_contract_invalid", message: error.message || "Framed raw contract is invalid" });
  }
}