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
  "provider_rendered_content",
  "subject_restrictions",
  "protected_composition",
  "visual",
  "generation_profile",
]);
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

/** Validate Framed's provider-free canonical input before plan publication. */
export function validateFramedProviderInputContract({ rawContract, generationProfile, compiledProviderInput } = {}) {
  try {
    if (!rawContract || typeof rawContract !== "object" ||
      !generationProfile || typeof generationProfile !== "object" ||
      !hasExactKeys(compiledProviderInput, COMPILED_INPUT_KEYS) ||
      compiledProviderInput.schema !== "page-image-compiled-provider-input" ||
      typeof compiledProviderInput.utf8 !== "string" || !compiledProviderInput.utf8 ||
      typeof compiledProviderInput.sha256 !== "string" ||
      compiledProviderInput.sha256 !== sha256Bytes(Buffer.from(compiledProviderInput.utf8, "utf8"))) {
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
      FORBIDDEN_REQUEST_KEYS.some((key) => Object.hasOwn(request, key)) ||
      !sameCanonical(request.provider_rendered_content, rawContract.provider_rendered_content) ||
      request.subject_restrictions !== rawContract.framed?.subject_restrictions ||
      !sameCanonical(request.protected_composition, rawContract.framed?.protected_composition) ||
      !sameCanonical(request.visual, {
        recipe: rawContract.provider_clauses?.recipe,
        composition: rawContract.provider_clauses?.composition,
        motifs: rawContract.provider_clauses?.motifs,
        relationship: rawContract.provider_clauses?.relationship || null,
        identity: rawContract.visual_identity,
      }) ||
      !sameCanonical(request.generation_profile, generationProfile)) {
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
