import { createHash } from "node:crypto";
import { sanitizeReceipt, RefinementContractError, isSafeRefinementId } from "./contracts.mjs";
import { canonicalJson } from "../../../shared/identity/canonical_json.mjs";

export const RELAY_SUBMIT_REQUEST_SCHEMA_V1 = "pptmaker-image2-relay-submit-v1";

const SAFE_PROVIDER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const ASYNC_RELAY_STATUSES = new Set(["accepted", "queued", "pending", "processing", "submitted", "completed", "success", "succeeded"]);
const FAILED_RELAY_STATUSES = new Set(["failed", "failure", "error", "rejected"]);
const SAFE_TRANSPORT_ERROR_CODES = new Set([
  "invalid_request",
  "invalid_attempt",
  "invalid_authorization",
  "invalid_transport",
  "invalid_provider_receipt",
  "provider_configuration_unavailable",
  "provider_failure",
  "reconciliation_failure",
  "unsupported_provider_response",
]);
const SENSITIVE_PROVIDER_TEXT_RE = /(?:api[_ -]?key|authorization|bearer|credential|password|prompt|response[_ -]?body|secret|token)/i;

export class RefinementTransportError extends Error {
  constructor(message, code = "provider_failure", details = undefined) {
    super(message);
    this.name = "RefinementTransportError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function assertAttempt(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new RefinementTransportError("transport request must be an object", "invalid_request");
  if (!isSafeRefinementId(request.attempt_id || request.attemptId)) throw new RefinementTransportError("persisted attempt_id is required", "invalid_attempt");
  if (!request.authorization_id && !request.authorizationId) throw new RefinementTransportError("persisted authorization_id is required", "invalid_authorization");
  return { ...request, attempt_id: request.attempt_id || request.attemptId, authorization_id: request.authorization_id || request.authorizationId };
}

function safeTransportResult(result, request) {
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new RefinementTransportError("provider returned no typed result", "invalid_provider_receipt");
  const status = result.status || "submitted";
  if (!["submitted", "failed", "unknown-submit"].includes(status)) throw new RefinementTransportError("provider returned an unsupported status", "invalid_provider_receipt");
  const out = {
    attempt_id: request.attempt_id,
    provider_request_id: typeof result.provider_request_id === "string" ? result.provider_request_id.slice(0, 256) : null,
    status,
    failure_code: typeof result.failure_code === "string" ? result.failure_code.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 128) : null,
    receipt: sanitizeReceipt(result.receipt || result),
  };
  if (result.bytes != null) {
    if (!Buffer.isBuffer(result.bytes) && !(result.bytes instanceof Uint8Array)) throw new RefinementTransportError("provider result bytes must be in memory", "invalid_provider_receipt");
    const bytes = Buffer.from(result.bytes);
    out.bytes = bytes;
    out.sha256 = sha256(bytes);
    out.media = result.media === "image/jpeg" ? "image/jpeg" : "image/png";
    out.width = Number.isSafeInteger(result.width) ? result.width : null;
    out.height = Number.isSafeInteger(result.height) ? result.height : null;
  }
  return Object.freeze(out);
}

function safeProviderError(error, fallback, fallbackCode) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  const safeMessage = message && message.length <= 320 && !SENSITIVE_PROVIDER_TEXT_RE.test(message)
    ? message
    : fallback;
  const code = SAFE_TRANSPORT_ERROR_CODES.has(error?.code) ? error.code : fallbackCode;
  return new RefinementTransportError(safeMessage, code);
}

/** Injectable boundary used by the application.  No provider module is loaded here. */
export function createRefinementTransport({ submit, reconcile, name = "injected" } = {}) {
  if (typeof submit !== "function" || typeof reconcile !== "function") throw new RefinementTransportError("transport requires submit and reconcile functions", "invalid_transport");
  return Object.freeze({
    name,
    async submitAttempt(request) {
      const normalized = assertAttempt(request);
      try { return safeTransportResult(await submit(normalized), normalized); }
      catch (error) {
        if (error?.code === "unknown-submit" || error?.unknownSubmit || error?.code === "ETIMEDOUT") {
          throw new RefinementTransportError("Image2 provider submit outcome is unknown", "unknown-submit");
        }
        throw safeProviderError(error, "Image2 provider submit failed", "provider_failure");
      }
    },
    async reconcileAttempt(attempt) {
      const normalized = assertAttempt(attempt);
      try {
        const result = await reconcile(normalized);
        if (result == null) return Object.freeze({ status: "unknown-submit", attempt_id: normalized.attempt_id, receipt: null });
        const typed = safeTransportResult(result, normalized);
        return Object.freeze({ ...typed, status: typed.status === "submitted" ? "submitted" : typed.status });
      } catch (error) {
        if (error instanceof RefinementTransportError && error.code === "unknown-submit") return Object.freeze({ status: "unknown-submit", attempt_id: normalized.attempt_id, receipt: null });
        throw safeProviderError(error, "Image2 provider reconciliation failed", "reconciliation_failure");
      }
    },
  });
}

/**
 * Deterministic in-memory adapter for tests and local demonstrations.  It is
 * intentionally explicit: callers provide responses and can inspect call
 * counts, proving that authorization gates do not hide remote work.
 */
export function createFakeRefinementTransport({ responses = {}, submit, reconcile, onSubmit, onReconcile, name = "fake" } = {}) {
  const calls = { submit: [], reconcile: [] };
  const transport = createRefinementTransport({
    name,
    submit: async (request) => {
      calls.submit.push({ ...request, ...(request.bytes ? { bytes: undefined } : {}) });
      if (typeof onSubmit === "function") return onSubmit(request, calls);
      if (typeof submit === "function") return submit(request, calls);
      const response = responses[request.attempt_id] ?? responses[request.slide_id] ?? {};
      if (response instanceof Error) throw response;
      return response;
    },
    reconcile: async (request) => {
      calls.reconcile.push({ ...request });
      if (typeof onReconcile === "function") return onReconcile(request, calls);
      if (typeof reconcile === "function") return reconcile(request, calls);
      return responses[`${request.attempt_id}:reconcile`] ?? null;
    },
  });
  return Object.freeze({
    ...transport,
    calls,
    get submitCount() { return calls.submit.length; },
    get reconcileCount() { return calls.reconcile.length; },
  });
}

/** Explicit opt-in adapter factory.  It accepts callbacks so credentials stay outside Phase 3/import time. */
export function createModernRefinementTransport(options = {}) {
  if (typeof options.submit !== "function" || typeof options.reconcile !== "function") throw new RefinementTransportError("modern transport requires injected submit/reconcile callbacks", "provider_unconfigured");
  return createRefinementTransport({ ...options, name: options.name || "modern-image2" });
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function relayRecord(value) {
  if (!plainObject(value)) throw new RefinementTransportError("relay returned an unsupported response shape", "unsupported_provider_response");
  if (Array.isArray(value.data) && plainObject(value.data[0])) return value.data[0];
  if (plainObject(value.data)) return value.data;
  return value;
}

function relayProviderId(record) {
  for (const candidate of [record.provider_request_id, record.task_id, record.id]) {
    if (typeof candidate === "string" && SAFE_PROVIDER_ID_RE.test(candidate)) return candidate;
  }
  return null;
}

function relayTaskId(record, fallback) {
  return typeof record.task_id === "string" && SAFE_PROVIDER_ID_RE.test(record.task_id)
    ? record.task_id
    : fallback;
}

function relayBytes(record) {
  const value = record.bytes ?? record.bytes_base64 ?? record.b64_json ?? record.result?.bytes_base64 ?? record.result?.b64_json;
  if (value == null) return null;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value !== "string" || !value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new RefinementTransportError("relay returned invalid image bytes", "unsupported_provider_response");
  }
  return Buffer.from(value, "base64");
}

function safeFailureCode(record) {
  const code = record.failure_code || record.error_code || "provider_failure";
  return typeof code === "string" ? code.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 128) || "provider_failure" : "provider_failure";
}

function relayReceipt(providerRequestId, phase) {
  return Object.freeze({ provider_request_id: providerRequestId, transport_phase: phase });
}

function classifyRelayResponse(value, { phase, fallbackProviderRequestId = null } = {}) {
  const record = relayRecord(value);
  const providerRequestId = relayProviderId(record) || fallbackProviderRequestId;
  const bytes = relayBytes(record);
  if (bytes) {
    return Object.freeze({ kind: "terminal", provider_request_id: providerRequestId, bytes, media: record.media, width: record.width, height: record.height, receipt: relayReceipt(providerRequestId, phase) });
  }
  const status = String(record.status || record.state || "").trim().toLowerCase();
  if (FAILED_RELAY_STATUSES.has(status)) {
    return Object.freeze({ kind: "failed", provider_request_id: providerRequestId, failure_code: safeFailureCode(record), receipt: relayReceipt(providerRequestId, phase) });
  }
  if (ASYNC_RELAY_STATUSES.has(status)) {
    if (!providerRequestId) return Object.freeze({ kind: "unknown", provider_request_id: null, receipt: relayReceipt(null, phase) });
    return Object.freeze({ kind: "async", provider_request_id: providerRequestId, task_id: relayTaskId(record, providerRequestId), receipt: relayReceipt(providerRequestId, phase) });
  }
  throw new RefinementTransportError("relay returned an unsupported response status", "unsupported_provider_response");
}

function isUnknownRelayOutcome(error) {
  return error?.code === "unknown-submit" || error?.code === "ETIMEDOUT" || error?.name === "AbortError" || error?.unknownSubmit === true;
}

function unknownRelayResult(providerRequestId, phase) {
  return Object.freeze({ status: "unknown-submit", provider_request_id: providerRequestId, receipt: relayReceipt(providerRequestId, phase) });
}

function terminalRelayResult(classified) {
  return Object.freeze({
    status: "submitted",
    provider_request_id: classified.provider_request_id,
    bytes: classified.bytes,
    media: classified.media,
    width: classified.width,
    height: classified.height,
    receipt: classified.receipt,
  });
}

function failedRelayResult(classified) {
  return Object.freeze({
    status: "failed",
    provider_request_id: classified.provider_request_id,
    failure_code: classified.failure_code,
    receipt: classified.receipt,
  });
}

/**
 * Stable fixture-facing request envelope. The material remains in memory and
 * later Phase-4 work supplies its closed provider-neutral request projection.
 */
export function materializeRelaySubmitRequest({ request, material } = {}) {
  const normalized = assertAttempt(request);
  if (!plainObject(material)) throw new RefinementTransportError("relay request material must be an object", "invalid_request");
  let canonicalMaterial;
  try { canonicalMaterial = JSON.parse(canonicalJson(material)); }
  catch { throw new RefinementTransportError("relay request material is not canonical JSON", "invalid_request"); }
  return Object.freeze({
    schema: RELAY_SUBMIT_REQUEST_SCHEMA_V1,
    attempt_id: normalized.attempt_id,
    authorization_id: normalized.authorization_id,
    plan_hash: normalized.plan_hash || null,
    kind: normalized.kind || null,
    slide_id: normalized.slide_id || null,
    slot: normalized.slot || null,
    material: canonicalMaterial,
  });
}

function assertMaterializedRelayRequest(value, request) {
  if (!plainObject(value) || value.schema !== RELAY_SUBMIT_REQUEST_SCHEMA_V1 ||
      value.attempt_id !== request.attempt_id || value.authorization_id !== request.authorization_id ||
      !plainObject(value.material)) {
    throw new RefinementTransportError("relay materializer returned an invalid request envelope", "invalid_request");
  }
  return value;
}

async function settleAsyncRelay({ classified, request, poll, result, phase }) {
  if (typeof poll !== "function" || typeof result !== "function") {
    throw new RefinementTransportError("relay async polling/result handlers are unavailable", "unsupported_provider_response");
  }
  let polled;
  try {
    polled = classifyRelayResponse(await poll({ provider_request_id: classified.provider_request_id, task_id: classified.task_id, request }), {
      phase: `${phase}-poll`, fallbackProviderRequestId: classified.provider_request_id,
    });
  } catch (error) {
    if (isUnknownRelayOutcome(error)) return unknownRelayResult(classified.provider_request_id, `${phase}-poll`);
    throw error;
  }
  if (polled.kind === "terminal") return terminalRelayResult(polled);
  if (polled.kind === "failed") return failedRelayResult(polled);
  if (polled.kind === "unknown") return unknownRelayResult(classified.provider_request_id, `${phase}-poll`);
  let resolved;
  try {
    resolved = classifyRelayResponse(await result({ provider_request_id: classified.provider_request_id, task_id: classified.task_id, request }), {
      phase: `${phase}-result`, fallbackProviderRequestId: classified.provider_request_id,
    });
  } catch (error) {
    if (isUnknownRelayOutcome(error)) return unknownRelayResult(classified.provider_request_id, `${phase}-result`);
    throw error;
  }
  if (resolved.kind === "terminal") return terminalRelayResult(resolved);
  if (resolved.kind === "failed") return failedRelayResult(resolved);
  return unknownRelayResult(classified.provider_request_id, `${phase}-result`);
}

/**
 * Compatibility spike for the one supported relay protocol. It intentionally
 * has no credential or HTTP ownership: callers inject bounded submit/poll/
 * result/reconcile functions. A terminal byte response wins; an accepted
 * response without a stable ID or a timeout becomes unknown-submit.
 */
export function createRelayCompatibilityTransport({ materialize, submit, poll, result, reconcile, name = "relay-compatibility" } = {}) {
  if (typeof materialize !== "function" || typeof submit !== "function" || typeof reconcile !== "function") {
    throw new RefinementTransportError("relay compatibility transport requires materialize, submit, and reconcile functions", "invalid_transport");
  }
  return createRefinementTransport({
    name,
    submit: async (request) => {
      const relayRequest = assertMaterializedRelayRequest(await materialize(request), request);
      let classified;
      try { classified = classifyRelayResponse(await submit(relayRequest), { phase: "submit" }); }
      catch (error) {
        if (isUnknownRelayOutcome(error)) return unknownRelayResult(null, "submit");
        throw error;
      }
      if (classified.kind === "terminal") return terminalRelayResult(classified);
      if (classified.kind === "failed") return failedRelayResult(classified);
      if (classified.kind === "unknown") return unknownRelayResult(null, "submit");
      return settleAsyncRelay({ classified, request: relayRequest, poll, result, phase: "submit" });
    },
    reconcile: async (attempt) => {
      const providerRequestId = typeof attempt.provider_request_id === "string" && SAFE_PROVIDER_ID_RE.test(attempt.provider_request_id)
        ? attempt.provider_request_id
        : null;
      if (!providerRequestId) return unknownRelayResult(null, "reconcile");
      let classified;
      try {
        classified = classifyRelayResponse(await reconcile({
          attempt_id: attempt.attempt_id,
          authorization_id: attempt.authorization_id,
          plan_hash: attempt.plan_hash || null,
          provider_request_id: providerRequestId,
        }), { phase: "reconcile", fallbackProviderRequestId: providerRequestId });
      } catch (error) {
        if (isUnknownRelayOutcome(error)) return unknownRelayResult(providerRequestId, "reconcile");
        throw error;
      }
      if (classified.kind === "terminal") return terminalRelayResult(classified);
      if (classified.kind === "failed") return failedRelayResult(classified);
      if (classified.kind === "unknown") return unknownRelayResult(providerRequestId, "reconcile");
      return settleAsyncRelay({ classified, request: null, poll, result, phase: "reconcile" });
    },
  });
}

export function classifyReconciliation(result) {
  if (result?.status === "submitted" && result?.bytes) return "submitted";
  if (result?.status === "failed") return "failed";
  return "unknown-submit";
}
