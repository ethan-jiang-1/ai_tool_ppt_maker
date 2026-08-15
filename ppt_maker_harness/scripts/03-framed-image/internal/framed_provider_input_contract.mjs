import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJson } from "../../shared/identity/canonical_json.mjs";

const COMPILED_INPUT_KEYS = Object.freeze([
  "schema",
  "utf8",
  "sha256",
]);
const REQUEST_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "instruction",
  "design_system",
  "provider_rendered_content",
  "subject_restrictions",
  "protected_composition",
  "visual",
]);
const PAGE_DESIGN_SYSTEM_KEYS = Object.freeze(["text", "sha256"]);
const SHA256_RE = /^[0-9a-f]{64}$/;
const FORBIDDEN_REQUEST_KEYS = Object.freeze([
  "local_header",
  "header_policy",
  "context_not_to_render",
  "protected_geometry",
  "region",
  "mask",
]);

export const FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION = "Render one complete premium keynote provider page. Keep the full provider canvas continuous. The normalized reserved_header is exclusively reserved for the deterministic local kicker, title, and subtitle overlay. Do not render provider typography, labels, readable body content, or key subjects in reserved_header. Render every provider-rendered content item as readable integrated page typography; place all provider-rendered readable body content, labels, and key subjects in the normalized body_safe region.";

function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function sameCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function hasValidPageDesignSystemBinding(rawContract) {
  const binding = rawContract?.page_design_system;
  const coreDigest = rawContract?.page_image_core?.page_design_system_sha256;
  if (!hasExactKeys(binding, PAGE_DESIGN_SYSTEM_KEYS) ||
    (binding.text === null) !== (binding.sha256 === null)) {
    return false;
  }
  if (binding.text === null) return coreDigest === null;
  return typeof binding.text === "string" && binding.text.trim().length > 0 &&
    SHA256_RE.test(binding.sha256 || "") && coreDigest === binding.sha256 &&
    sha256Bytes(Buffer.from(binding.text, "utf8")) === binding.sha256;
}

export function buildFramedProviderIdentity(rawContract) {
  if (!rawContract || typeof rawContract !== "object" || Array.isArray(rawContract)) {
    throw new TypeError("Framed provider identity requires one raw contract");
  }
  const projection = rawContract.visual_identity;
  if (projection === null) return null;
  if (!projection || typeof projection !== "object" || Array.isArray(projection) ||
    typeof rawContract.visual_identity_role_clause !== "string") {
    throw new TypeError("Framed provider identity requires validated identity facts");
  }
  return Object.freeze({
    profile: projection.profile,
    role: projection.role,
    subject_class: projection.subject_class,
    identity_subject_count: projection.identity_subject_count,
    subject_restrictions: projection.subject_restrictions,
    role_clause: rawContract.visual_identity_role_clause,
  });
}

/** Validate Framed's provider-free canonical input before plan publication. */
export function validateFramedProviderInputContract({
  rawContract,
  compiledProviderInput,
} = {}) {
  try {
    if (!rawContract || typeof rawContract !== "object" ||
      !hasExactKeys(compiledProviderInput, COMPILED_INPUT_KEYS) ||
      compiledProviderInput.schema !== "page-image-compiled-provider-input" ||
      typeof compiledProviderInput.utf8 !== "string" || !compiledProviderInput.utf8 ||
      typeof compiledProviderInput.sha256 !== "string" ||
      compiledProviderInput.sha256 !== sha256Bytes(Buffer.from(compiledProviderInput.utf8, "utf8")) ||
      !hasValidPageDesignSystemBinding(rawContract)) {
      throw new Error("Framed compiled provider input is not an exact canonical byte record");
    }

    let request;
    try {
      request = JSON.parse(compiledProviderInput.utf8);
    } catch {
      throw new Error("Framed compiled provider input is not valid JSON");
    }
    if (compiledProviderInput.utf8 !== canonicalJson(request) ||
      !hasExactKeys(request, REQUEST_KEYS) ||
      request.schema !== "page-image-framed-provider-input" ||
      request.slide_id !== rawContract.slide_id ||
      request.instruction !== FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION ||
      (request.design_system !== null && typeof request.design_system !== "string") ||
      request.design_system !== rawContract.page_design_system.text ||
      FORBIDDEN_REQUEST_KEYS.some((key) => Object.hasOwn(request, key)) ||
      !sameCanonical(request.provider_rendered_content, rawContract.provider_rendered_content) ||
      request.subject_restrictions !== rawContract.framed?.subject_restrictions ||
      !sameCanonical(request.protected_composition, rawContract.framed?.protected_composition) ||
      !sameCanonical(request.visual, {
        recipe: rawContract.provider_clauses?.recipe,
        composition: rawContract.provider_clauses?.composition,
        motifs: rawContract.provider_clauses?.motifs,
        relationship: rawContract.provider_clauses?.relationship || null,
        identity: buildFramedProviderIdentity(rawContract),
      })) {
      throw new Error("Framed compiled provider input does not retain the exclusive header reservation contract");
    }

    return Object.freeze({ ok: true, compiled_provider_input_sha256: compiledProviderInput.sha256 });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: "framed_provider_input_contract_invalid",
      message: error.message || "Framed compiled provider input is invalid",
    });
  }
}
