#!/usr/bin/env node
/**
 * Native Node image API client (APIMart-compatible async contract).
 *
 * Contract:
 *   POST {base}/images/generations  → task_id
 *   GET  {base}/tasks/{id}          → poll until completed|failed
 *   GET  {base}/tasks/{id}/result   → image URL or b64
 *
 * Image2 credentials (canonical):
 *   IMAGE2_API_KEY + IMAGE2_BASE_URL and/or IMAGE2_BASE_URLS
 * Legacy aliases (still accepted): OPENAI_* / APIMART_*
 * Priority: IMAGE2_* → OPENAI_* → APIMART_*; CLI --base-url highest.
 * These variables are for image generation only — not chat LLMs.
 *
 * No external skills. No Python. No bash. Node fetch only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

export const DEFAULT_MODEL = "gpt-image-2";
export const MAX_WAIT_MS = 600_000;
export const POLL_INTERVAL_MS = 5_000;

/**
 * Bridge IMAGE2_* / OPENAI_* → empty APIMART_* slots (does not override set APIMART_*).
 * Keeps older call sites that still read APIMART_* working.
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
export function resolveApiKey() {
  bridgeCredentials();
  const key =
    process.env.IMAGE2_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.APIMART_API_KEY;
  if (!key) {
    throw new Error(
      "IMAGE2_API_KEY is not set (aliases: OPENAI_API_KEY / APIMART_API_KEY). Put it in deck .env or export it."
    );
  }
  return key;
}

/**
 * @param {string[]} [extra] - CLI --base-url values (highest priority).
 * @returns {string[]}
 */
export function resolveBaseUrls(extra = []) {
  bridgeCredentials();
  const fromCli = (extra || []).filter(Boolean);
  if (fromCli.length > 0) return fromCli.map((u) => u.replace(/\/+$/, ""));

  const single =
    process.env.IMAGE2_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.APIMART_BASE_URL ||
    "";
  const multi =
    process.env.IMAGE2_BASE_URLS ||
    process.env.APIMART_BASE_URLS ||
    "";
  const urls = [];
  if (single) urls.push(single.trim());
  for (const part of multi.split(",")) {
    const u = part.trim();
    if (u && !urls.includes(u)) urls.push(u);
  }
  if (urls.length === 0) {
    throw new Error(
      "No image API base URL. Set IMAGE2_BASE_URL (or IMAGE2_BASE_URLS; aliases: OPENAI_BASE_URL / APIMART_BASE_URL / APIMART_BASE_URLS)."
    );
  }
  return urls.map((u) => u.replace(/\/+$/, ""));
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
 * @returns {Promise<string>} task_id
 */
async function submitTask(baseUrl, apiKey, body) {
  const url = `${baseUrl}/images/generations`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
  const unwrapped = unwrapDataRecord(data);
  const taskId =
    data.task_id ||
    data.id ||
    unwrapped.task_id ||
    unwrapped.id;
  if (!taskId) {
    throw new Error(`No task_id in submit response: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return String(taskId);
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
  let pollCount = 0;

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
  throw new Error(`Task ${taskId} timed out after ${MAX_WAIT_MS / 1000}s (${pollCount} polls)`);
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
 * @returns {{b64:string}|{url:string}|null}
 */
function extractImageRef(data) {
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
 * Generate one image via async API with mirror fallback.
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.outPath
 * @param {string|null} [opts.styleReferencePath]
 * @param {string} [opts.resolution]
 * @param {string} [opts.model]
 * @param {string} [opts.size]
 * @param {boolean} [opts.force]
 * @param {string[]} [opts.baseUrls]
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

  const apiKey = resolveApiKey();
  const urls = baseUrls.length > 0 ? baseUrls : resolveBaseUrls();
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

  let lastError = null;
  for (const baseUrl of urls) {
    try {
      console.log(`  Submit → ${baseUrl}  (${outPath})`);
      const taskId = await submitTask(baseUrl, apiKey, body);
      console.log(`  task_id=${taskId}`);
      const { data: pollData, pollCount } = await pollTask(baseUrl, apiKey, taskId);
      // This relay embeds the finished image in the completed poll response
      // (data.result.images[0].url). Prefer that; fall back to /tasks/{id}/result
      // only for APIs that expose a separate result endpoint.
      const ref = extractImageRef(pollData);
      if (ref) {
        await saveImageRef(ref, outPath);
      } else {
        await downloadResult(baseUrl, apiKey, taskId, outPath);
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
      };
      if (tracePath) {
        mkdirSync(dirname(tracePath), { recursive: true });
        writeFileSync(tracePath, JSON.stringify(trace, null, 2) + "\n", "utf-8");
      }
      console.log(`  Done: ${outPath}  (${elapsed.toFixed(0)}s)`);
      return trace;
    } catch (err) {
      lastError = err;
      console.log(`  Mirror failed (${baseUrl}): ${err.message}`);
    }
  }

  throw lastError || new Error("All image API mirrors failed");
}
