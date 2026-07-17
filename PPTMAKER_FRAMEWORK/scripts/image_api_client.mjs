/**
 * Native Node image API client (OpenAI-compatible generations + optional async poll).
 *
 * Contract:
 *   POST {base}/images/generations  → image (sync) or task_id (async)
 *   GET  {base}/tasks/{id}          → poll until completed|failed (async only)
 *   GET  {base}/tasks/{id}/result   → fallback download if poll has no embedded image
 *
 * Image2 credentials:
 *   IMAGE2_API_KEY  — required API key for image generation
 *   IMAGE2_BASE_URL — required API endpoint
 *   CLI --base-url overrides IMAGE2_BASE_URL at runtime.
 *   These variables are for image generation only — not chat LLMs.
 *
 * No external skills. No Python. No bash. Node fetch only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, basename } from "node:path";
import { emitCliProgress } from "./lib/cli_error.mjs";

export const DEFAULT_MODEL = "gpt-image-2";
export const MAX_WAIT_MS = 600_000;
export const POLL_INTERVAL_MS = 5_000;
export const HEARTBEAT_MS = 30_000;
export const ATTEMPTS_SUMMARY_MAX = 5;
export const MAX_RETRIES = 2; // extra attempts per vendor (3 total)

export class ImageProviderError extends Error {
  constructor({ phase, reason, baseUrl = null, status = null, retryable = false }) {
    const host = providerHost(baseUrl);
    super(`Image provider ${phase} failed (${reason}${status ? `, HTTP ${status}` : ""}${host ? `, host ${host}` : ""})`);
    this.name = "ImageProviderError";
    this.phase = phase;
    this.reason = reason;
    this.host = host;
    this.status = Number.isInteger(status) ? status : null;
    this.retryable = retryable;
  }
}

export class ImageSubmitPrerequisiteError extends Error {
  constructor(reason) {
    const message = reason === "missing_style_reference"
      ? "The current style reference is required before Image2 page submission."
      : "Image2 transport prerequisites are unavailable; run doctor --image2 and repair the reported presence checks.";
    super(message);
    this.name = "ImageSubmitPrerequisiteError";
    this.reason = reason;
  }
}

export function providerHost(baseUrl) {
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).hostname || null;
  } catch {
    return null;
  }
}

function providerFailure(phase, reason, baseUrl, status = null, retryable = false) {
  return new ImageProviderError({ phase, reason, baseUrl, status, retryable });
}

/**
 * Check whether an error is retryable (transient) vs permanent (4xx auth/bad request).
 * @param {*} err
 * @returns {boolean}
 */
function _isRetryableError(err) {
  if (!err) return false;
  if (err instanceof ImageProviderError) return err.retryable;
  const msg = err.message ? String(err.message) : "";
  // HTTP 5xx status
  if (/\b5\d\d\b/.test(msg)) return true;
  // Network-level errors
  if (msg.includes("ECONNRESET")) return true;
  if (msg.includes("ETIMEDOUT")) return true;
  if (msg.includes("ECONNREFUSED")) return true;
  if (msg.includes("fetch failed")) return true;
  // Timeout
  if (msg.includes("timeout")) return true;
  // 4xx is NOT retryable
  return false;
}

/** @param {string} u @returns {string} */
function normalizeBaseUrl(u) {
  const raw = String(u).trim();
  if (!raw) return "";
  const parsed = new URL(raw);
  if (parsed.username || parsed.password) {
    throw new Error("Image provider URL must not contain credentials");
  }
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

/** @returns {string} */
function resolveKey() {
  return process.env.IMAGE2_API_KEY || "";
}

/**
 * Single-vendor credential resolution.
 * CLI --base-url overrides IMAGE2_BASE_URL.
 * @param {string[]} [extraBaseUrls] CLI --base-url values.
 * @returns {{ base_url: string, api_key: string }[]}
 */
export function resolveVendors(extraBaseUrls = []) {
  const key = resolveKey();
  if (!key) {
    throw new Error(
      "IMAGE2_API_KEY is not set. Put it in deck .env or export it."
    );
  }

  let baseUrl = "";
  // CLI --base-url takes priority
  if (extraBaseUrls && extraBaseUrls.length > 0) {
    baseUrl = String(extraBaseUrls[0]).trim();
  }
  if (!baseUrl) {
    baseUrl = (process.env.IMAGE2_BASE_URL || "").trim();
  }
  if (!baseUrl) {
    throw new Error(
      "No image API base URL. Set IMAGE2_BASE_URL or use --base-url."
    );
  }

  return [{ base_url: normalizeBaseUrl(baseUrl), api_key: key }];
}

/** @returns {string} first resolved vendor key (compat wrapper) */
export function resolveApiKey() {
  return resolveVendors()[0].api_key;
}

/**
 * @param {string[]} [extra] - CLI --base-url values.
 * @returns {string[]}
 */
export function resolveBaseUrls(extra = []) {
  return resolveVendors(extra).map((v) => v.base_url);
}

/**
 * Shared last-mile guard for production Image2 submits. Call only after the
 * caller has established that remote work is actually required.
 */
export function assertImageSubmitPrerequisites({
  baseUrls = [],
  styleReferencePath = null,
  requireStyleReference = false,
  transportResolver = resolveVendors,
} = {}) {
  if (requireStyleReference && (!styleReferencePath || !existsSync(styleReferencePath))) {
    throw new ImageSubmitPrerequisiteError("missing_style_reference");
  }
  try {
    return transportResolver(baseUrls);
  } catch {
    throw new ImageSubmitPrerequisiteError("provider_configuration_unavailable");
  }
}

/**
 * Normalize object / array `data` envelopes used by submit / poll / result.
 * @param {unknown} data
 * @returns {Record<string, unknown>}
 */
export function unwrapDataRecord(data) {
  if (!data || typeof data !== "object") return {};
  const root = /** @type {Record<string, unknown>} */ (data);
  const inner = root.data;
  if (Array.isArray(inner) && inner.length > 0 && inner[0] && typeof inner[0] === "object") {
    return /** @type {Record<string, unknown>} */ (inner[0]);
  }
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return /** @type {Record<string, unknown>} */ (inner);
  }
  return root;
}

/** @param {string} filePath @returns {string} data URL */
export function fileToDataUrl(filePath) {
  const buf = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    ext === ".gif" ? "image/gif" :
    ext === ".svg" ? "image/svg+xml" :
    "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {object} body
 * @returns {Promise<object>} submit JSON
 */
async function submitGenerate(baseUrl, apiKey, body) {
  const url = `${baseUrl}/images/generations`;
  const controller = new AbortController();
  const started = Date.now();
  let lastHeartbeat = started;
  const timer = setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeat >= HEARTBEAT_MS) {
      const elapsedSec = Math.floor((now - started) / 1000);
      emitCliProgress("provider_poll", {
        host: providerHost(baseUrl) || "provider",
        attempt: elapsedSec,
        status: "submit-wait",
      });
      lastHeartbeat = now;
    }
    if (now - started >= MAX_WAIT_MS) {
      controller.abort();
    }
  }, Math.min(1_000, HEARTBEAT_MS));

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw providerFailure("submit", "non_json_response", baseUrl, resp.status, resp.status >= 500);
    }
    if (!resp.ok) {
      throw providerFailure("submit", "http_error", baseUrl, resp.status, resp.status >= 500);
    }
    return data;
  } catch (err) {
    if (err && (err.name === "AbortError" || err.code === "ABORT_ERR")) {
      throw providerFailure("submit", "timeout", baseUrl, null, true);
    }
    throw err;
  } finally {
    clearInterval(timer);
  }
}

/** Extract an async task_id from a submit response (null if the vendor is synchronous). */
export function extractTaskId(data) {
  if (!data || typeof data !== "object") return null;
  const unwrapped = unwrapDataRecord(data);
  const taskId = data.task_id || data.id || unwrapped.task_id || unwrapped.id;
  return taskId ? String(taskId) : null;
}

/** True if submit response is accepted (sync image or async task id). */
export function submitAccepted(data) {
  return Boolean(extractImageRef(data) || extractTaskId(data));
}

/**
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {string} taskId
 * @returns {Promise<object>}
 */
async function pollTask(baseUrl, apiKey, taskId) {
  const url = `${baseUrl}/tasks/${taskId}`;
  const deadline = Date.now() + MAX_WAIT_MS;
  const started = Date.now();
  let pollCount = 0;
  let lastHeartbeat = started;

  while (Date.now() < deadline) {
    pollCount += 1;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw providerFailure("poll", "http_error", baseUrl, resp.status, resp.status >= 500);
    }
    const unwrapped = unwrapDataRecord(data);
    const status = String(
      data.status || data.state || unwrapped.status || unwrapped.state || "unknown"
    ).toLowerCase();
    const now = Date.now();
    if (now - lastHeartbeat >= HEARTBEAT_MS) {
      const elapsedSec = Math.floor((now - started) / 1000);
      emitCliProgress("provider_poll", {
        host: providerHost(baseUrl) || "provider",
        attempt: pollCount,
        status,
      });
      lastHeartbeat = now;
    }
    if (status === "completed" || status === "success" || status === "succeeded") {
      return { data, pollCount };
    }
    if (status === "failed" || status === "failure" || status === "error") {
      throw providerFailure("poll", "task_failed", baseUrl, null, false);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw providerFailure("poll", "timeout", baseUrl, null, true);
}

/**
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {string} taskId
 * @param {string} outPath
 */
async function downloadResult(baseUrl, apiKey, taskId, outPath) {
  const url = `${baseUrl}/tasks/${taskId}/result`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const contentType = resp.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buf = Buffer.from(await resp.arrayBuffer());
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, buf);
    return;
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw providerFailure("result", "http_error", baseUrl, resp.status, resp.status >= 500);
  }

  const unwrapped = unwrapDataRecord(data);
  const b64 =
    data.b64_json ||
    data.data?.[0]?.b64_json ||
    unwrapped.b64_json ||
    data.result?.b64_json;
  if (b64) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(b64, "base64"));
    return;
  }

  const imageUrl =
    data.image_url ||
    data.url ||
    data.data?.[0]?.url ||
    unwrapped.url ||
    unwrapped.image_url ||
    data.result?.url ||
    data.result?.image_url ||
    data.output?.url;

  if (!imageUrl) {
    throw providerFailure("result", "missing_image", baseUrl, null, false);
  }

  if (String(imageUrl).startsWith("data:")) {
    const raw = String(imageUrl).split(",")[1] || "";
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(raw, "base64"));
    return;
  }

  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) {
    throw providerFailure("download", "http_error", imageUrl, imgResp.status, imgResp.status >= 500);
  }
  const buf = Buffer.from(await imgResp.arrayBuffer());
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
}

/**
 * Extract an image reference (b64 or url) from any response body shape —
 * a completed poll response OR a /result response. Handles this relay's
 * `data.result.images[0].url` (url may be an array) plus common fallbacks.
 * @param {unknown} data
 * @returns {{b64:string}|{url:string}|null}
 */
export function extractImageRef(data) {
  if (!data || typeof data !== "object") return null;
  const unwrapped = unwrapDataRecord(data);
  const b64 =
    data.b64_json ||
    data.data?.[0]?.b64_json ||
    unwrapped.b64_json ||
    unwrapped.result?.images?.[0]?.b64_json ||
    data.result?.b64_json;
  if (b64) return { b64: String(b64) };
  let url =
    data.image_url ||
    data.url ||
    data.data?.[0]?.url ||
    unwrapped.url ||
    unwrapped.image_url ||
    unwrapped.result?.images?.[0]?.url ||
    data.result?.url ||
    data.result?.image_url ||
    data.output?.url;
  if (Array.isArray(url)) url = url[0];
  return url ? { url: String(url) } : null;
}

/**
 * Save an already-extracted image ref (b64 or url) to outPath.
 * @param {{b64:string}|{url:string}} ref
 * @param {string} outPath
 */
async function saveImageRef(ref, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  if (ref.b64) {
    writeFileSync(outPath, Buffer.from(ref.b64, "base64"));
    return;
  }
  if (ref.url.startsWith("data:")) {
    writeFileSync(outPath, Buffer.from(ref.url.split(",")[1] || "", "base64"));
    return;
  }
  const imgResp = await fetch(ref.url);
  if (!imgResp.ok) {
    throw providerFailure("download", "http_error", ref.url, imgResp.status, imgResp.status >= 500);
  }
  writeFileSync(outPath, Buffer.from(await imgResp.arrayBuffer()));
}

/**
 * Generate one image with ordered vendor failover.
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.outPath
 * @param {string|null} [opts.styleReferencePath]
 * @param {string} [opts.resolution]
 * @param {string} [opts.model]
 * @param {string} [opts.size]
 * @param {boolean} [opts.force]
 * @param {string[]} [opts.baseUrls] - CLI --base-url extras only; empty → full env resolveVendors()
 * @param {string|null} [opts.tracePath] - If set, write JSON trace here.
 * @returns {Promise<object|null>} Trace object, or null if skipped.
 */
export async function generateOneImage({
  prompt,
  outPath,
  styleReferencePath = null,
  resolution = "2k",
  model = DEFAULT_MODEL,
  size = "16:9",
  force = false,
  baseUrls = [],
  tracePath = null,
  additionalReferencePaths = [],
  requireStyleReference = false,
  transportResolver = resolveVendors,
  submitImpl = submitGenerate,
} = {}) {
  if (!force && existsSync(outPath)) {
    console.log(`  Skip (exists): ${outPath}`);
    return null;
  }

  const vendors = assertImageSubmitPrerequisites({
    baseUrls,
    styleReferencePath,
    requireStyleReference,
    transportResolver,
  });
  const t0 = Date.now();

  /** @type {object} */
  const body = {
    model,
    prompt,
    size,
    resolution,
    n: 1,
  };

  if (styleReferencePath) {
    if (!existsSync(styleReferencePath)) {
      throw new Error(`Style reference not found: ${styleReferencePath}`);
    }
    const dataUrl = fileToDataUrl(styleReferencePath);
    // Common relay shapes — send both; servers ignore unknown fields.
    body.image = dataUrl;
    body.images = [dataUrl];
    body.image_urls = [dataUrl];
  } else {
    console.log(`  No style reference — generating without visual style anchoring`);
  }

  // Additional reference images (per-slide visual assets)
  if (additionalReferencePaths.length > 0) {
    const existingImages = body.images || [];
    for (const refPath of additionalReferencePaths) {
      if (!existsSync(refPath)) {
        console.warn(`  WARNING: asset reference not found, skipping: ${refPath}`);
        continue;
      }
      try {
        const assetDataUrl = fileToDataUrl(refPath);
        existingImages.push(assetDataUrl);
      } catch (err) {
        console.warn(`  WARNING: cannot read asset reference, skipping: ${refPath} (${err.message})`);
      }
    }
    if (existingImages.length > (styleReferencePath ? 1 : 0)) {
      body.images = existingImages;
      if (!body.image) body.image = existingImages[0];
      body.image_urls = existingImages;
    }
  }

  /** @type {{ base_url: string, host: string|null, reason: string, status: number|null }[]} */
  const attempts = [];

  for (const vendor of vendors) {
    const { base_url: baseUrl, api_key: apiKey } = vendor;
    // Retry transient errors up to 2 extra times per vendor (3 total attempts)
    for (let retry = 0; retry < 3; retry++) {
      try {
        emitCliProgress("provider_attempt", {
          host: providerHost(baseUrl) || "provider",
          attempt: retry + 1,
        });
        const submitData = await submitImpl(baseUrl, apiKey, body);
        let taskId = null;
        let pollCount = 0;
        const syncRef = extractImageRef(submitData);
        if (syncRef) {
          console.log(`  sync image returned (no task) → saving`);
          await saveImageRef(syncRef, outPath);
        } else {
          taskId = extractTaskId(submitData);
          if (!taskId) {
            throw providerFailure("submit", "missing_task_or_image", baseUrl, null, false);
          }
          const polled = await pollTask(baseUrl, apiKey, taskId);
          pollCount = polled.pollCount;
          const ref = extractImageRef(polled.data);
          if (ref) {
            await saveImageRef(ref, outPath);
          } else {
            await downloadResult(baseUrl, apiKey, taskId, outPath);
          }
        }
        const elapsed = (Date.now() - t0) / 1000;
        const trace = {
          base_url: baseUrl,
          task_id: taskId,
          model,
          size,
          resolution,
          prompt_chars: prompt.length,
          poll_count: pollCount,
          total_seconds: Math.round(elapsed * 10) / 10,
          style_reference: styleReferencePath || null,
          additional_references: additionalReferencePaths.length > 0
            ? additionalReferencePaths.map(p => basename(p))
            : [],
          attempts,
        };
        if (tracePath) {
          mkdirSync(dirname(tracePath), { recursive: true });
          writeFileSync(tracePath, JSON.stringify(trace, null, 2) + "\n", "utf-8");
        }
        console.log(`  Done: ${outPath}  (${elapsed.toFixed(0)}s)`);
        return trace;
      } catch (err) {
        const safeError = err instanceof ImageProviderError
          ? err
          : providerFailure("request", "network_error", baseUrl, null, _isRetryableError(err));
        // Retry on transient errors (5xx, network), skip on 4xx
        if (retry < 2 && safeError.retryable) {
          const delay = (retry + 1) * 1000; // 1s, 2s backoff
          emitCliProgress("provider_poll", {
            host: providerHost(baseUrl) || "provider",
            attempt: retry + 1,
            status: "retrying",
          });
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        attempts.push({
          base_url: baseUrl,
          host: safeError.host,
          reason: safeError.reason,
          status: safeError.status,
        });
        break; // non-retryable or out of retries — move to next vendor
      }
    }
  }

  const summary = attempts
    .slice(0, ATTEMPTS_SUMMARY_MAX)
    .map((a) => `${a.host || "provider"}:${a.reason}${a.status ? `:${a.status}` : ""}`)
    .join(" | ");
  const failure = providerFailure("generation", "all_vendors_failed", null, null, false);
  failure.attempts = attempts.slice(0, ATTEMPTS_SUMMARY_MAX);
  failure.message = `All image API vendors failed (${attempts.length} attempt(s)): ${summary || "no attempts"}`;
  throw failure;
}
