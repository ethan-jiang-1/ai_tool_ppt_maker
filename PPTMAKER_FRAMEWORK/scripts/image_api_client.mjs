/**
 * Native Node image API client (OpenAI-compatible generations + optional async poll).
 *
 * Contract:
 *   POST {base}/images/generations  → image (sync) or task_id (async)
 *   GET  {base}/tasks/{id}          → poll until completed|failed (async only)
 *   GET  {base}/tasks/{id}/result   → fallback download if poll has no embedded image
 *
 * Image2 credentials (canonical):
 *   IMAGE2_VENDORS=url|KEY_ENV,...   (preferred multi-key)
 *   or IMAGE2_API_KEY + IMAGE2_BASE_URL and/or IMAGE2_BASE_URLS
 * Legacy aliases: OPENAI_* / APIMART_*
 * Priority: CLI --base-url (+ shared key) → IMAGE2_VENDORS → legacy URL(s)+shared key.
 * These variables are for image generation only — not chat LLMs.
 *
 * No external skills. No Python. No bash. Node fetch only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

export const DEFAULT_MODEL = "gpt-image-2";
export const MAX_WAIT_MS = 600_000;
export const POLL_INTERVAL_MS = 5_000;
export const HEARTBEAT_MS = 30_000;
export const ATTEMPTS_SUMMARY_MAX = 5;

/**
 * Bridge IMAGE2_* / OPENAI_* → empty APIMART_* slots (does not override set APIMART_*).
 * Legacy single-key path only; multi-vendor resolution does not depend on this.
 */
export function bridgeCredentials() {
  const key =
    process.env.IMAGE2_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.APIMART_API_KEY;
  if (!process.env.APIMART_API_KEY && key) {
    process.env.APIMART_API_KEY = key;
  }
  const base =
    process.env.IMAGE2_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.APIMART_BASE_URL;
  if (!process.env.APIMART_BASE_URL && base) {
    process.env.APIMART_BASE_URL = base;
  }
  const bases =
    process.env.IMAGE2_BASE_URLS ||
    process.env.APIMART_BASE_URLS;
  if (!process.env.APIMART_BASE_URLS && bases) {
    process.env.APIMART_BASE_URLS = bases;
  }
}

/** @returns {string} */
function sharedImage2Key() {
  return (
    process.env.IMAGE2_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.APIMART_API_KEY ||
    ""
  );
}

/** @param {string} u @returns {string} */
function normalizeBaseUrl(u) {
  return String(u).trim().replace(/\/+$/, "");
}

/**
 * Ordered vendor list: { base_url, api_key }.
 * @param {string[]} [extraBaseUrls] CLI --base-url values (highest priority; shared key only).
 * @returns {{ base_url: string, api_key: string }[]}
 */
export function resolveVendors(extraBaseUrls = []) {
  bridgeCredentials();
  const fromCli = (extraBaseUrls || []).filter(Boolean).map(normalizeBaseUrl);
  if (fromCli.length > 0) {
    const key = sharedImage2Key();
    if (!key) {
      throw new Error(
        "IMAGE2_API_KEY is not set (aliases: OPENAI_API_KEY / APIMART_API_KEY). " +
          "Required when using --base-url (does not borrow keys from IMAGE2_VENDORS)."
      );
    }
    return fromCli.map((base_url) => ({ base_url, api_key: key }));
  }

  const vendorsEnv = (process.env.IMAGE2_VENDORS || "").trim();
  if (vendorsEnv) {
    /** @type {{ base_url: string, api_key: string }[]} */
    const vendors = [];
    for (const part of vendorsEnv.split(",")) {
      const item = part.trim();
      if (!item) continue;
      const pipe = item.indexOf("|");
      const base_url = normalizeBaseUrl(pipe >= 0 ? item.slice(0, pipe) : item);
      const keyEnv = pipe >= 0 ? item.slice(pipe + 1).trim() : "";
      if (!base_url) continue;
      let api_key = "";
      if (keyEnv) {
        api_key = process.env[keyEnv] || "";
        if (!api_key) {
          throw new Error(
            `${keyEnv} is not set (referenced by IMAGE2_VENDORS for ${base_url}).`
          );
        }
      } else {
        api_key = sharedImage2Key();
        if (!api_key) {
          throw new Error(
            `IMAGE2_API_KEY is not set (IMAGE2_VENDORS item ${base_url} has no |KEY_ENV; aliases: OPENAI_API_KEY / APIMART_API_KEY).`
          );
        }
      }
      vendors.push({ base_url, api_key });
    }
    if (vendors.length === 0) {
      throw new Error(
        "IMAGE2_VENDORS is set but empty after parse. Use url|KEY_ENV items."
      );
    }
    return vendors;
  }

  const key = sharedImage2Key();
  if (!key) {
    throw new Error(
      "IMAGE2_API_KEY is not set (aliases: OPENAI_API_KEY / APIMART_API_KEY). Put it in deck .env or export it."
    );
  }
  const single =
    process.env.IMAGE2_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.APIMART_BASE_URL ||
    "";
  const multi =
    process.env.IMAGE2_BASE_URLS ||
    process.env.APIMART_BASE_URLS ||
    "";
  /** @type {string[]} */
  const urls = [];
  if (single.trim()) urls.push(normalizeBaseUrl(single));
  for (const part of multi.split(",")) {
    const u = normalizeBaseUrl(part);
    if (u && !urls.includes(u)) urls.push(u);
  }
  if (urls.length === 0) {
    throw new Error(
      "No image API base URL. Set IMAGE2_VENDORS or IMAGE2_BASE_URL (or IMAGE2_BASE_URLS; aliases: OPENAI_BASE_URL / APIMART_BASE_URL / APIMART_BASE_URLS)."
    );
  }
  return urls.map((base_url) => ({ base_url, api_key: key }));
}

/** @returns {string} first resolved vendor key (compat wrapper) */
export function resolveApiKey() {
  return resolveVendors()[0].api_key;
}

/**
 * @param {string[]} [extra] - CLI --base-url values (highest priority).
 * @returns {string[]}
 */
export function resolveBaseUrls(extra = []) {
  return resolveVendors(extra).map((v) => v.base_url);
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
      console.log(
        `  … still waiting vendor=${baseUrl} phase=submit elapsed=${elapsedSec}s`
      );
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
      throw new Error(`Submit non-JSON (${resp.status}): ${text.slice(0, 200)}`);
    }
    if (!resp.ok) {
      throw new Error(`Submit failed ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return data;
  } catch (err) {
    if (err && (err.name === "AbortError" || err.code === "ABORT_ERR")) {
      const elapsedSec = Math.floor((Date.now() - started) / 1000);
      throw new Error(
        `Submit timed out after ${elapsedSec}s (MAX_WAIT_MS=${MAX_WAIT_MS}) ` +
          `phase=submit vendor=${baseUrl}`
      );
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
      throw new Error(`Poll failed ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }
    const unwrapped = unwrapDataRecord(data);
    const status = String(
      data.status || data.state || unwrapped.status || unwrapped.state || "unknown"
    ).toLowerCase();
    const now = Date.now();
    if (now - lastHeartbeat >= HEARTBEAT_MS) {
      const elapsedSec = Math.floor((now - started) / 1000);
      console.log(
        `  … still waiting vendor=${baseUrl} phase=poll task=${taskId} status=${status} elapsed=${elapsedSec}s polls=${pollCount}`
      );
      lastHeartbeat = now;
    }
    if (status === "completed" || status === "success" || status === "succeeded") {
      return { data, pollCount };
    }
    if (status === "failed" || status === "failure" || status === "error") {
      const msg =
        data.error?.message ||
        data.message ||
        data.error ||
        unwrapped.error?.message ||
        unwrapped.message ||
        unwrapped.error ||
        "unknown error";
      throw new Error(`Task ${taskId} failed: ${msg}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  const elapsedSec = Math.floor((Date.now() - started) / 1000);
  throw new Error(
    `Image task ${taskId} timed out after ${elapsedSec}s ` +
      `(MAX_WAIT_MS=${MAX_WAIT_MS}, ${pollCount} polls) — this image failed; re-run with --force-images for this slide`
  );
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
    throw new Error(`Result failed ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
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
    throw new Error(`No image in result for ${taskId}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  if (String(imageUrl).startsWith("data:")) {
    const raw = String(imageUrl).split(",")[1] || "";
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(raw, "base64"));
    return;
  }

  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) {
    throw new Error(`Download image failed ${imgResp.status} from ${imageUrl}`);
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
    throw new Error(`Download image failed ${imgResp.status} from ${ref.url}`);
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
} = {}) {
  if (!force && existsSync(outPath)) {
    console.log(`  Skip (exists): ${outPath}`);
    return null;
  }

  const vendors = resolveVendors(baseUrls);
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
  }

  /** @type {{ base_url: string, error: string }[]} */
  const attempts = [];

  for (const vendor of vendors) {
    const { base_url: baseUrl, api_key: apiKey } = vendor;
    try {
      console.log(`  Submit → ${baseUrl}  (${outPath})`);
      const submitData = await submitGenerate(baseUrl, apiKey, body);
      // SYNC: finished image in submit response. ASYNC: task_id → poll.
      let taskId = null;
      let pollCount = 0;
      const syncRef = extractImageRef(submitData);
      if (syncRef) {
        console.log(`  sync image returned (no task) → saving`);
        await saveImageRef(syncRef, outPath);
      } else {
        taskId = extractTaskId(submitData);
        if (!taskId) {
          throw new Error(
            `No task_id and no image in submit response: ${JSON.stringify(submitData).slice(0, 300)}`
          );
        }
        console.log(`  task_id=${taskId}`);
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
        attempts,
      };
      if (tracePath) {
        mkdirSync(dirname(tracePath), { recursive: true });
        writeFileSync(tracePath, JSON.stringify(trace, null, 2) + "\n", "utf-8");
      }
      console.log(`  Done: ${outPath}  (${elapsed.toFixed(0)}s)`);
      return trace;
    } catch (err) {
      const msg = err && err.message ? String(err.message) : String(err);
      attempts.push({ base_url: baseUrl, error: msg.slice(0, 200) });
      console.log(`  Mirror failed (${baseUrl}): ${msg}`);
    }
  }

  const summary = attempts
    .slice(0, ATTEMPTS_SUMMARY_MAX)
    .map((a) => `${a.base_url}: ${a.error}`)
    .join(" | ");
  throw new Error(
    `All image API vendors failed (${attempts.length} attempt(s)): ${summary || "no attempts"}`
  );
}
