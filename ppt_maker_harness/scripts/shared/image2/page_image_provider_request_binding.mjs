/**
 * Workflow-neutral validation for adapter-compiled Page Image provider input.
 *
 * The selected adapter owns semantic compilation. Shared lifecycle and
 * transport code only verify that the opaque request still matches the exact
 * raw-plan item before it can be authorized, persisted, or submitted.
 */
import { createHash } from "node:crypto";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";

export const PAGE_IMAGE_PROVIDER_REQUEST_SCHEMA = "page-image-target-raw-provider-request-v1";
export const PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA = "page-image-compiled-provider-input-v1";

const SHA256_RE = /^[0-9a-f]{64}$/;
const REQUEST_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "raw_contract",
  "raw_contract_sha256",
  "generation_profile",
  "compiled_provider_input",
]);
const COMPILED_INPUT_KEYS = Object.freeze(["schema", "utf8", "sha256"]);

export class PageImageProviderRequestBindingError extends Error {
  constructor(message) {
    super(message);
    this.name = "PageImageProviderRequestBindingError";
    this.code = "page_image_provider_request_binding_invalid";
  }
}

function fail(message) {
  throw new PageImageProviderRequestBindingError(message);
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function immutableCanonicalCopy(value, label) {
  try {
    return deepFreeze(JSON.parse(canonicalJson(value)));
  } catch {
    fail(`${label} must be canonical JSON data`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze(entry);
  return Object.freeze(value);
}

function planItemForSlide(plan, slideId) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan) ||
    !Array.isArray(plan.items) || !SHA256_RE.test(plan.provider_profile_sha256 || "")) {
    fail("a current raw plan with provider-profile binding is required");
  }
  const item = plan.items.find((entry) => entry?.slide_id === slideId);
  if (!item || typeof item !== "object" || Array.isArray(item) ||
    !SHA256_RE.test(item.raw_contract_sha256 || "") ||
    !item.provider_input_binding || typeof item.provider_input_binding !== "object" ||
    !SHA256_RE.test(item.provider_input_binding.compiled_provider_input_sha256 || "") ||
    !SHA256_RE.test(item.provider_input_binding.generation_profile_sha256 || "")) {
    fail("the request slide is not bound to a current raw-plan item");
  }
  return item;
}

/**
 * Validate one opaque selected-adapter request against one exact raw-plan
 * item. The returned request is a detached immutable canonical copy so a
 * caller cannot alter bytes after the binding check but before transport.
 */
export function validateBoundPageImageProviderRequest({ plan, slideId, request } = {}) {
  if (typeof slideId !== "string" || !slideId) fail("a stable slide ID is required for a provider request");
  const item = planItemForSlide(plan, slideId);
  if (!exactKeys(request, REQUEST_KEYS) || request.schema !== PAGE_IMAGE_PROVIDER_REQUEST_SCHEMA ||
    request.slide_id !== slideId || request.raw_contract_sha256 !== item.raw_contract_sha256 ||
    !request.raw_contract || typeof request.raw_contract !== "object" || Array.isArray(request.raw_contract) ||
    !request.generation_profile || typeof request.generation_profile !== "object" || Array.isArray(request.generation_profile)) {
    fail("the selected adapter request does not match its raw-plan item");
  }
  const input = request.compiled_provider_input;
  if (!exactKeys(input, COMPILED_INPUT_KEYS) || input.schema !== PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA ||
    typeof input.utf8 !== "string" || input.utf8.length === 0 || !SHA256_RE.test(input.sha256 || "") ||
    sha256(Buffer.from(input.utf8, "utf8")) !== input.sha256) {
    fail("the selected adapter request does not contain exact compiled UTF-8 input");
  }
  if (canonicalJsonSha256(request.raw_contract) !== item.raw_contract_sha256 ||
    input.sha256 !== item.provider_input_binding.compiled_provider_input_sha256 ||
    canonicalJsonSha256(request.generation_profile) !== item.provider_input_binding.generation_profile_sha256 ||
    canonicalJsonSha256(request.generation_profile) !== plan.provider_profile_sha256) {
    fail("the selected adapter request has stale compiled-input or profile bindings");
  }
  const bound = immutableCanonicalCopy(request, "provider request");
  return Object.freeze({ request: bound, request_sha256: canonicalJsonSha256(bound) });
}

/** Validate complete selected-adapter request coverage before lifecycle work. */
export function validateBoundPageImageProviderRequests({ plan, providerRequestsBySlide } = {}) {
  if (!providerRequestsBySlide || typeof providerRequestsBySlide !== "object" || Array.isArray(providerRequestsBySlide)) {
    fail("selected adapter provider requests are required");
  }
  if (!plan || !Array.isArray(plan.ordered_slide_ids) || plan.ordered_slide_ids.length !== plan.items?.length) {
    fail("a complete ordered current raw plan is required");
  }
  const requestIds = Object.keys(providerRequestsBySlide).sort();
  const orderedIds = [...plan.ordered_slide_ids];
  if (requestIds.length !== orderedIds.length || requestIds.some((slideId, index) => slideId !== [...orderedIds].sort()[index])) {
    fail("selected adapter provider requests must exactly cover the current raw plan");
  }
  const bySlide = {};
  for (const slideId of orderedIds) {
    bySlide[slideId] = validateBoundPageImageProviderRequest({
      plan,
      slideId,
      request: providerRequestsBySlide[slideId],
    });
  }
  return Object.freeze({
    requests_by_slide: Object.freeze(bySlide),
  });
}
