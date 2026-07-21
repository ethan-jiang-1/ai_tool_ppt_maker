import {
  createRelayCompatibilityTransport,
  materializeRelaySubmitRequest,
  RefinementTransportError,
} from "./transport.mjs";

const DEFAULT_TIMEOUT_MS = 60_000;

function normalizeConfig({ baseUrl, apiKey, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof apiKey !== "string" || !apiKey) {
    throw new RefinementTransportError("Image2 provider credentials are unavailable", "provider_configuration_unavailable");
  }
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new RefinementTransportError("Image2 provider base URL is unavailable", "provider_configuration_unavailable");
  }
  if (typeof fetchImpl !== "function") {
    throw new RefinementTransportError("Image2 provider fetch is unavailable", "provider_configuration_unavailable");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600_000) {
    throw new RefinementTransportError("Image2 provider timeout is invalid", "provider_configuration_unavailable");
  }
  let normalizedBaseUrl;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.username || parsed.password) throw new Error("credentials in URL");
    parsed.search = "";
    parsed.hash = "";
    normalizedBaseUrl = parsed.toString().replace(/\/+$/, "");
  } catch {
    throw new RefinementTransportError("Image2 provider base URL is invalid", "provider_configuration_unavailable");
  }
  return Object.freeze({ baseUrl: normalizedBaseUrl, apiKey, fetchImpl, timeoutMs });
}

function endpoint(baseUrl, suffix) {
  return `${baseUrl}${suffix}`;
}

function isUnknownNetworkOutcome(error) {
  return error?.name === "AbortError" || error?.code === "ETIMEDOUT" || error?.code === "unknown-submit";
}

async function readJsonResponse(response, { phase, reconciliation = false } = {}) {
  let text = "";
  try {
    text = await response.text();
  } catch {
    throw new RefinementTransportError("Image2 provider response could not be read", reconciliation ? "unknown-submit" : "provider_failure");
  }
  if (!response.ok) {
    const uncertain = reconciliation || response.status >= 500;
    throw new RefinementTransportError(
      `Image2 provider ${phase} failed (HTTP ${response.status})`,
      uncertain ? "unknown-submit" : "provider_failure",
    );
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object expected");
    return value;
  } catch {
    throw new RefinementTransportError("Image2 provider returned an unsupported response", reconciliation ? "unknown-submit" : "unsupported_provider_response");
  }
}

async function requestJson(config, {
  method,
  suffix,
  body = undefined,
  phase,
  reconciliation = false,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await config.fetchImpl(endpoint(config.baseUrl, suffix), {
      method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    return readJsonResponse(response, { phase, reconciliation });
  } catch (error) {
    if (error instanceof RefinementTransportError) throw error;
    if (isUnknownNetworkOutcome(error)) {
      throw new RefinementTransportError("Image2 provider outcome is unknown", "unknown-submit");
    }
    // A network disconnect can occur after the provider accepts a request.
    // Retaining unknown-submit is safer than treating it as a retryable failure.
    throw new RefinementTransportError("Image2 provider connection outcome is unknown", "unknown-submit");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Private HTTP adapter for the closed relay compatibility protocol. The
 * caller supplies the already-resolved credentials and a provider-neutral
 * request mapper; no environment lookup happens here.
 */
export function createRelayProtocolTransport({
  baseUrl,
  apiKey,
  fetchImpl,
  timeoutMs,
  materializeSubmitBody,
  name = "modern-image2-visual-slot",
} = {}) {
  const config = normalizeConfig({ baseUrl, apiKey, fetchImpl, timeoutMs });
  if (typeof materializeSubmitBody !== "function") {
    throw new RefinementTransportError("Image2 provider request materializer is unavailable", "provider_configuration_unavailable");
  }
  return createRelayCompatibilityTransport({
    name,
    materialize(request) {
      return materializeRelaySubmitRequest({
        request,
        material: { provider_request: materializeSubmitBody(request) },
      });
    },
    submit(relayRequest) {
      return requestJson(config, {
        method: "POST",
        suffix: "/images/generations",
        body: relayRequest.material.provider_request,
        phase: "submit",
      });
    },
    poll({ task_id: taskId }) {
      return requestJson(config, {
        method: "GET",
        suffix: `/tasks/${encodeURIComponent(taskId)}`,
        phase: "poll",
        reconciliation: true,
      });
    },
    result({ task_id: taskId }) {
      return requestJson(config, {
        method: "GET",
        suffix: `/tasks/${encodeURIComponent(taskId)}/result`,
        phase: "result",
        reconciliation: true,
      });
    },
    reconcile({ provider_request_id: providerRequestId }) {
      return requestJson(config, {
        method: "GET",
        suffix: `/tasks/${encodeURIComponent(providerRequestId)}`,
        phase: "reconcile",
        reconciliation: true,
      });
    },
  });
}
