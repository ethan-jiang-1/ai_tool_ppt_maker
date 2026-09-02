/**
 * cli_image2_response.mjs — Image2/Page Image provider response parsing,
 * known-failure construction, and plan-bound submit factories.
 * Mechanical move from command_support.mjs; no behavior changes.
  * Authority: openspec/specs/cli-surface/spec.md
 * Authority: openspec/specs/image-generation/spec.md
 */
import { readFileSync } from "node:fs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "../image2/page_image_media_contract.mjs";
import { validateBoundPageImageProviderRequest } from "../image2/page_image_target_runtime.mjs";
import {
  IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
  awaitWithinImage2ProviderDeadline,
} from "./cli_deadline.mjs";
import { PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE } from "./command_support.mjs";

export function imageDataUrl(path) {
  const extension = path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${extension};base64,${readFileSync(path).toString("base64")}`;
}

export function imageBytesDataUrl(bytes, mediaType) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    const error = new Error("Target Page Image Style Master reference bytes are invalid");
    error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
    throw error;
  }
  if (mediaType !== "image/png" || bytes.length === 0) {
    const error = new Error("Target Page Image Style Master reference media is invalid");
    error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
    throw error;
  }
  return `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function pageImageProviderResponseRecord(payload) {
  return payload?.data && !Array.isArray(payload.data) ? payload.data
    : Array.isArray(payload?.data) ? payload.data[0]
      : payload;
}

export function imageBytesFromPageImageProvider(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const encoded = record?.bytes_base64 || record?.b64_json || payload?.bytes_base64 || payload?.b64_json;
  if (typeof encoded !== "string" || !encoded.trim()) {
    const error = new Error("Page Image provider returned no inline PNG bytes");
    error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length) {
    const error = new Error("Page Image provider returned empty PNG bytes");
    error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  return bytes;
}

export function pageImageProviderTaskId(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.task_id || payload?.task_id;
  if (typeof value !== "string") return null;
  const taskId = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(taskId) ? taskId : null;
}

export function pageImageProviderHasInlineImage(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return [record?.bytes_base64, record?.b64_json, payload?.bytes_base64, payload?.b64_json]
    .some((value) => typeof value === "string" && value.trim().length > 0);
}

export function pageImageProviderTaskStatus(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.status || payload?.status;
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function pageImageProviderTaskResult(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return record?.result || payload?.result || null;
}

export function pageImageProviderTaskResultPayload(payload) {
  const result = pageImageProviderTaskResult(payload);
  const images = Array.isArray(result?.images) ? result.images : null;
  return images ? { data: images[0] } : result;
}

export function pageImageProviderMediaKnownFailure(actual) {
  const error = new Error("Target Page Image provider returned invalid PNG media");
  error.code = "PAGE_IMAGE_PROVIDER_MEDIA_INVALID";
  error.page_image_known_failure = true;
  error.page_image_known_failure_facts = Object.freeze({
    expected: PAGE_IMAGE_NATIVE_RAW_PNG,
    actual: Object.freeze(actual),
  });
  return error;
}

export const PAGE_IMAGE_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

export const IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES = new Set([
  "empty",
  "html_like",
  "other_non_json",
]);

export function image2InvalidJsonResponseShape(responseText) {
  if (typeof responseText !== "string") return "other_non_json";
  if (responseText.trim().length === 0) return "empty";
  const leadingText = responseText.trimStart();
  return /^(?:<!doctype\s+html(?=[\s>])|<html(?=[\s/>]))/i.test(leadingText)
    ? "html_like"
    : "other_non_json";
}

export function pageImageProviderResponseKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
  if (!PAGE_IMAGE_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS.has(classification)) {
    throw new Error("Target Page Image response failure classification is invalid");
  }
  const response = { classification };
  if (classification === "http_error" && Number.isSafeInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) {
    response.http_status = httpStatus;
  }
  if (classification === "invalid_json" && IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES.has(responseShape)) {
    response.response_shape = responseShape;
  }
  const error = new Error("Target Page Image provider returned an unusable response");
  error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
  error.page_image_known_failure = true;
  error.page_image_known_failure_facts = Object.freeze({
    response: Object.freeze(response),
  });
  return error;
}

export function pageImageProviderTaskPollUnresolved() {
  const error = new Error("Target Page Image provider task outcome could not be resolved");
  error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED";
  return error;
}

export function pageImageProviderSubmitUnresolved() {
  const error = new Error("Target Page Image provider submission failed before a response");
  error.code = "PAGE_IMAGE_PROVIDER_SUBMIT_FAILED";
  return error;
}

export async function readImage2ProviderResponseJson({
  url,
  options,
  fetchImpl,
  deadline,
  knownFailure,
  unresolved,
  requestUnresolved = unresolved,
}) {
  const remainingMs = deadline.remainingMs();
  if (remainingMs <= 0) throw unresolved();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, remainingMs));
  try {
    let response;
    try {
      response = await awaitWithinImage2ProviderDeadline(
        () => fetchImpl(url, { ...options, signal: controller.signal }),
        controller.signal,
      );
    } catch {
      throw requestUnresolved();
    }
    if (!response || typeof response.ok !== "boolean") {
      throw knownFailure("task_response_invalid");
    }
    if (!response.ok) {
      throw knownFailure("http_error", { httpStatus: response.status });
    }
    if (typeof response.text !== "function") {
      throw knownFailure("task_response_invalid");
    }
    let responseText;
    try {
      responseText = await awaitWithinImage2ProviderDeadline(() => response.text(), controller.signal);
    } catch {
      throw unresolved();
    }
    if (deadline.remainingMs() <= 0) throw unresolved();
    try {
      return JSON.parse(responseText);
    } catch {
      throw knownFailure("invalid_json", { responseShape: image2InvalidJsonResponseShape(responseText) });
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function sleepWithinImage2ProviderDeadline({ deadline, sleep, intervalMs, unresolved }) {
  const remainingMs = deadline.remainingMs();
  if (remainingMs <= 0) throw unresolved();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, remainingMs));
  try {
    await awaitWithinImage2ProviderDeadline(() => sleep(Math.min(intervalMs, remainingMs)), controller.signal);
  } catch {
    throw unresolved();
  } finally {
    clearTimeout(timer);
  }
  if (deadline.remainingMs() <= 0) throw unresolved();
}

export async function resolveImage2ProviderTask({
  baseUrl,
  apiKey,
  taskId,
  fetchImpl,
  sleep,
  deadline,
  pollIntervalMs,
  knownFailure,
  unresolved,
  completePayload,
}) {
  const taskUrl = `${baseUrl}/tasks/${encodeURIComponent(taskId)}`;

  while (deadline.remainingMs() > 0) {
    const payload = await readImage2ProviderResponseJson({
      url: taskUrl,
      options: {
        method: "GET",
        redirect: "error",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      fetchImpl,
      deadline,
      knownFailure,
      unresolved,
    });
    const status = pageImageProviderTaskStatus(payload);
    if (status === "completed") {
      return completePayload(pageImageProviderTaskResultPayload(payload));
    }
    if (["failed", "error", "cancelled", "canceled", "expired"].includes(status)) {
      throw knownFailure("task_terminal_failure");
    }
    if (!["pending", "queued", "submitted", "running", "processing"].includes(status)) {
      throw knownFailure("task_response_invalid");
    }
    await sleepWithinImage2ProviderDeadline({ deadline, sleep, intervalMs: pollIntervalMs, unresolved });
  }
  throw unresolved();
}

export function targetPageImagePngBytesFromProvider(payload) {
  let bytes;
  try {
    bytes = imageBytesFromPageImageProvider(payload);
  } catch {
    throw pageImageProviderMediaKnownFailure({ classification: "empty" });
  }
  const inspected = inspectExactPageImagePng(bytes, PAGE_IMAGE_NATIVE_RAW_PNG);
  if (!inspected.ok && inspected.classification === "invalid_png") {
    throw pageImageProviderMediaKnownFailure({ classification: "invalid_png" });
  }
  if (!inspected.ok) {
    throw pageImageProviderMediaKnownFailure({
      ...(inspected.actual || { classification: inspected.classification }),
    });
  }
  return inspected.bytes;
}

/** Submit an opaque target adapter request without re-evaluating its workflow. */
export function targetPageImageSubmitFactory(plan, {
  credentialResolver = null,
  fetchImpl = fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  providerDeadlineMs = null,
  taskPollTimeoutMs = null,
  taskPollIntervalMs = IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
} = {}) {
  const slideById = new Map(plan.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const rawWorkPlan = plan.progressive_raw_work_plan || plan.raw_work_plan;
  return async ({ request, item, provider_idempotency_key: providerIdempotencyKey }) => {
    let boundRequest;
    try {
      boundRequest = validateBoundPageImageProviderRequest({
        plan: rawWorkPlan,
        slideId: item?.slide_id,
        request,
      }).request;
    } catch {
      const error = new Error("Target Page Image provider request is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const planItem = rawWorkPlan.items.find((entry) => entry.slide_id === item.slide_id);
    if (!planItem || (item.raw_contract_sha256 && item.raw_contract_sha256 !== planItem.raw_contract_sha256)) {
      const error = new Error("Target Page Image provider item is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const slide = slideById.get(item.slide_id);
    if (!slide || !boundRequest.generation_profile?.provider?.model) {
      const error = new Error("Target Page Image provider request is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    if (!PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE.test(providerIdempotencyKey || "")) {
      const error = new Error("Target Page Image provider request is missing its persisted idempotency identity");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    let credentials;
    try {
      if (credentialResolver) {
        credentials = credentialResolver();
      } else {
        const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
        credentials = resolveImage2Credentials();
      }
    } catch {
      const error = new Error("Target Page Image provider credentials are unavailable");
      error.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
      throw error;
    }
    const styleMaster = plan.style_master_reference;
    const profileStyle = boundRequest.generation_profile?.effective_style_master;
    if (!styleMaster || !profileStyle ||
      !Buffer.isBuffer(styleMaster.bytes) ||
      sha256Bytes(styleMaster.bytes) !== styleMaster.candidate_sha256 ||
      profileStyle.selection_sha256 !== styleMaster.selection_sha256 ||
      profileStyle.plan_sha256 !== styleMaster.plan_sha256 ||
      profileStyle.candidate_id !== styleMaster.candidate_id ||
      profileStyle.candidate_sha256 !== styleMaster.candidate_sha256 ||
      profileStyle.candidate_provenance_sha256 !== styleMaster.candidate_provenance_sha256 ||
      profileStyle.candidate_media_type !== styleMaster.candidate_media_type ||
      profileStyle.candidate_width !== styleMaster.candidate_width ||
      profileStyle.candidate_height !== styleMaster.candidate_height ||
      profileStyle.bytes !== styleMaster.bytes.length) {
      const error = new Error("Target Page Image provider request lost its selected immutable Style Master reference");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const images = [imageBytesDataUrl(styleMaster.bytes, styleMaster.candidate_media_type)];
    const identityPath = slide.visual_language?.identity_reference?.provider_reference?.path;
    if (identityPath) images.push(imageDataUrl(identityPath));
    const { executePageImageProviderCall } = await import("../../shared/image2/provider_executor.mjs");
    return executePageImageProviderCall({
      credentials,
      provider: boundRequest.generation_profile.provider,
      prompt: boundRequest.compiled_provider_input.utf8,
      styleMaster,
      extraImages: images,
      idempotencyKey: providerIdempotencyKey,
      fetchImpl,
      now,
      sleep,
      providerDeadlineMs,
      taskPollTimeoutMs,
      taskPollIntervalMs,
    });
  };
}

/** Resolve the one remote Image2 credential pair before the raw owner may write an attempt. */
export async function targetPageImageGenerateCredentials(runDir, { expectedProfileId } = {}) {
  try {
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir });
    const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId });
  } catch {
    const error = new Error("Target Page Image provider credentials are unavailable");
    error.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
    throw error;
  }
}
