import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  normalizePageImageHeaderPolicy,
  normalizePageImageProviderContent,
} from "../../shared/page-image/page_image_core.mjs";
import {
  isPageImageProviderClausesBoundToVisualLanguage,
  isPageImageProviderClausesShape,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { PureImageWorkflowError } from "../index.mjs";

const PURE_RAW_CONTRACT_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "workflow",
  "visual_language",
  "provider_clauses",
  "visual_identity_role_clause",
  "visual_scene",
  "visual_identity",
  "page_presentation",
  "page_design_system",
  "page_image_core",
  "provider_rendered_content",
]);
const PURE_RAW_CONTRACT_CORE_KEYS = Object.freeze([
  "schema",
  "canonical_semantic_sha256",
  "page_design_system_sha256",
]);
const PAGE_DESIGN_SYSTEM_KEYS = Object.freeze(["text", "sha256"]);
const PURE_PAGE_PRESENTATION_KEYS = Object.freeze(["page_class", "profile_id", "binding_sha256", "provenance", "profile"]);
const PURE_PROVIDER_RENDERED_CONTENT_KEYS = Object.freeze(["header", "items"]);
const PURE_HEADER_KEYS = Object.freeze(["kicker", "title", "subtitle"]);
const IDENTITY_PROJECTION_KEYS = Object.freeze([
  "profile",
  "role",
  "reference_sha256",
  "role_clause_sha256",
  "subject_class",
  "identity_subject_count",
  "subject_restrictions",
]);
const SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);
const LOWER_KEBAB_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

function hasExactKeys(value, keys) {
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

/** Validate one Pure raw contract before it can bind a request or plan. */
export function validatePureRawContract(rawContract) {
  try {
    if (!hasExactKeys(rawContract, PURE_RAW_CONTRACT_KEYS) ||
      rawContract.schema !== TARGET_RAW_CONTRACT_SCHEMA ||
      rawContract.workflow !== "pure" ||
      typeof rawContract.slide_id !== "string" || !rawContract.slide_id.trim() ||
      !rawContract.visual_language || typeof rawContract.visual_language !== "object" || Array.isArray(rawContract.visual_language) ||
      !isPageImageProviderClausesShape(rawContract.provider_clauses) ||
      !isPageImageProviderClausesBoundToVisualLanguage(rawContract.visual_language, rawContract.provider_clauses) ||
      (rawContract.visual_scene !== null && typeof rawContract.visual_scene !== "string") ||
      !hasValidIdentityFacts(rawContract) ||
      !hasExactKeys(rawContract.page_presentation, PURE_PAGE_PRESENTATION_KEYS) ||
      !SHA256_RE.test(rawContract.page_presentation.binding_sha256 || "") ||
      !rawContract.page_presentation.profile || typeof rawContract.page_presentation.profile !== "object" || Array.isArray(rawContract.page_presentation.profile) ||
      !rawContract.page_presentation.provenance || typeof rawContract.page_presentation.provenance !== "object" || Array.isArray(rawContract.page_presentation.provenance) ||
      !hasExactKeys(rawContract.page_image_core, PURE_RAW_CONTRACT_CORE_KEYS) ||
      rawContract.page_image_core.schema !== "page-image-core-slide-facts" ||
      !SHA256_RE.test(rawContract.page_image_core.canonical_semantic_sha256 || "") ||
      !hasValidPageDesignSystemFacts(rawContract) ||
      !hasExactKeys(rawContract.provider_rendered_content, PURE_PROVIDER_RENDERED_CONTENT_KEYS) ||
      !hasExactKeys(rawContract.provider_rendered_content.header, PURE_HEADER_KEYS) ||
      !Array.isArray(rawContract.provider_rendered_content.items)) {
      throw new PureImageWorkflowError("pure_raw_contract_invalid", "Pure raw contract has an invalid canonical shape");
    }
    const normalizedHeader = normalizePageImageHeaderPolicy({
      provider_visible: rawContract.provider_rendered_content.header,
    }, "pure");
    const normalizedContent = normalizePageImageProviderContent({
      items: rawContract.provider_rendered_content.items,
    });
    if (canonicalJsonSha256(normalizedHeader.provider_visible) !== canonicalJsonSha256(rawContract.provider_rendered_content.header) ||
      canonicalJsonSha256(normalizedContent.items) !== canonicalJsonSha256(rawContract.provider_rendered_content.items)) {
      throw new PureImageWorkflowError("pure_raw_contract_invalid", "Pure provider-rendered content must be normalized by Page Image Core");
    }
    return Object.freeze({
      ok: true,
      raw_contract_sha256: canonicalJsonSha256(rawContract),
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "pure_raw_contract_invalid",
      message: error.message || "Pure raw contract is invalid",
    });
  }
}