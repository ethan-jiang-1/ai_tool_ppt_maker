import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";

export const CALL_SHAPE_ENVELOPE_SCHEMA = "pptmaker-image2-call-shape";
export const LAB_TRIAL_SCHEMA = "pptmaker-image2-lab-trial";
export const RESULT_PROTOCOL_JSON_INLINE_B64 = "json-inline-b64";
export const REGISTERED_RESULT_PROTOCOLS = Object.freeze([RESULT_PROTOCOL_JSON_INLINE_B64]);

export const NAMED_DEFAULT_TRANSPORT = Object.freeze({
  http_operation: "generations",
  encoding: "json",
  width: 2000,
  height: 1125,
  dimension_multiple: 1,
  completion: "async-poll",
});

export const NAMED_DEFAULT_RESULT_PROTOCOL = RESULT_PROTOCOL_JSON_INLINE_B64;
export const DEFAULT_PAGE_IMAGE_TRANSPORT = NAMED_DEFAULT_TRANSPORT;

const TRANSPORT_KEYS = Object.freeze([
  "http_operation",
  "encoding",
  "width",
  "height",
  "dimension_multiple",
  "completion",
]);
const VALUE_KEYS = Object.freeze(["model", "prompt_budget", "transport", "result_protocol"]);
const BUDGET_UNITS = new Set(["unicode-code-points", "utf16-code-units", "utf8-bytes"]);
const PROTOCOL_SET = new Set(REGISTERED_RESULT_PROTOCOLS);

export class Image2CallShapeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "Image2CallShapeError";
    this.code = code;
  }
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freeze(entry);
  return Object.freeze(value);
}

function fail(code, message) {
  throw new Image2CallShapeError(code, message);
}

export function isLegalPageImageTransport(value) {
  if (!exactKeys(value, TRANSPORT_KEYS)) return false;
  const pairingOk = (value.http_operation === "generations" && value.encoding === "json")
    || (value.http_operation === "edits" && value.encoding === "multipart");
  return pairingOk
    && Number.isSafeInteger(value.width) && value.width > 0
    && Number.isSafeInteger(value.height) && value.height > 0
    && (value.dimension_multiple === 1 || value.dimension_multiple === 16)
    && value.width % value.dimension_multiple === 0
    && value.height % value.dimension_multiple === 0
    && (value.completion === "sync" || value.completion === "async-poll");
}

export function pageImageTransportRequestSize(transport) {
  return `${transport.width}x${transport.height}`;
}

function resolveTransport(value) {
  const resolved = value === undefined ? NAMED_DEFAULT_TRANSPORT : value;
  if (!isLegalPageImageTransport(resolved)) {
    fail("image2_call_shape_transport_invalid", "Image2 Call Shape transport is not a legal closed pairing");
  }
  return freeze({
    http_operation: resolved.http_operation,
    encoding: resolved.encoding,
    width: resolved.width,
    height: resolved.height,
    dimension_multiple: resolved.dimension_multiple,
    completion: resolved.completion,
  });
}

function resolveResultProtocol(value) {
  const resolved = value === undefined ? NAMED_DEFAULT_RESULT_PROTOCOL : value;
  if (typeof resolved !== "string" || !PROTOCOL_SET.has(resolved)) {
    fail("image2_call_shape_result_protocol_invalid", "Image2 Call Shape result_protocol is not a registered dialect");
  }
  return resolved;
}

function assertBudget(promptBudget) {
  if (!exactKeys(promptBudget, ["limit", "unit"]) ||
    !Number.isSafeInteger(promptBudget.limit) || promptBudget.limit <= 0 ||
    !BUDGET_UNITS.has(promptBudget.unit)) {
    fail("image2_call_shape_budget_invalid", "Image2 Call Shape prompt_budget is invalid");
  }
  return freeze({ limit: promptBudget.limit, unit: promptBudget.unit });
}

/**
 * Canonical page-image Call Shape value. Unknown keys, vendor product names as
 * keys, unregistered dialects, and illegal pairings fail closed.
  * Authority: openspec/specs/image-generation/spec.md
 * Authority: openspec/specs/cli-surface/spec.md
 */
export function canonicalizeCallShapeValue(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("image2_call_shape_invalid", "Image2 Call Shape value must be one mapping");
  }
  const allowed = new Set(["model", "prompt_budget", "transport", "result_protocol"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) fail("image2_call_shape_unknown_field", "Image2 Call Shape value has an unknown field");
  }
  if (typeof input.model !== "string" || !input.model.trim()) {
    fail("image2_call_shape_model_invalid", "Image2 Call Shape model must be a nonempty string");
  }
  const value = freeze({
    model: input.model,
    prompt_budget: assertBudget(input.prompt_budget),
    transport: resolveTransport(input.transport),
    result_protocol: resolveResultProtocol(input.result_protocol),
  });
  if (!exactKeys(value, VALUE_KEYS)) {
    fail("image2_call_shape_invalid", "Image2 Call Shape value must canonicalize to the closed field set");
  }
  return value;
}

export function validateCallShapeValue(input) {
  const value = canonicalizeCallShapeValue(input);
  return freeze({
    value,
    sha256: canonicalJsonSha256(value),
  });
}

export function namedDefaultCallShapeValue({ model, prompt_budget }) {
  return canonicalizeCallShapeValue({ model, prompt_budget });
}
