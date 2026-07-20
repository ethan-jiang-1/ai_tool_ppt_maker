import { createHash } from "node:crypto";
import { sanitizeReceipt, RefinementContractError, isSafeRefinementId } from "./contracts.mjs";

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

/** Injectable boundary used by the application.  No provider module is loaded here. */
export function createRefinementTransport({ submit, reconcile, name = "injected" } = {}) {
  if (typeof submit !== "function" || typeof reconcile !== "function") throw new RefinementTransportError("transport requires submit and reconcile functions", "invalid_transport");
  return Object.freeze({
    name,
    async submitAttempt(request) {
      const normalized = assertAttempt(request);
      try { return safeTransportResult(await submit(normalized), normalized); }
      catch (error) {
        if (error instanceof RefinementTransportError) throw error;
        if (error?.code === "unknown-submit" || error?.unknownSubmit || error?.code === "ETIMEDOUT") throw new RefinementTransportError(error.message || "provider submit outcome is unknown", "unknown-submit");
        throw new RefinementTransportError(error.message || "provider submit failed", "provider_failure");
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
        throw new RefinementTransportError(error.message || "provider reconciliation failed", "reconciliation_failure");
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

export function classifyReconciliation(result) {
  if (result?.status === "submitted" && result?.bytes) return "submitted";
  if (result?.status === "failed") return "failed";
  return "unknown-submit";
}
