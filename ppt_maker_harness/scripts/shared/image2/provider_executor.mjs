import {
  NAMED_DEFAULT_RESULT_PROTOCOL,
  RESULT_PROTOCOL_JSON_INLINE_B64,
  isLegalPageImageTransport,
  pageImageTransportRequestSize,
  validateCallShapeValue,
} from "./call_shape.mjs";
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "./page_image_media_contract.mjs";
import {
  createImage2ProviderDeadline,
  image2ProviderOperationTiming,
} from "../cli/cli_deadline.mjs";
import {
  pageImageProviderHasInlineImage,
  pageImageProviderResponseKnownFailure,
  pageImageProviderSubmitUnresolved,
  pageImageProviderTaskId,
  pageImageProviderTaskPollUnresolved,
  readImage2ProviderResponseJson,
  resolveImage2ProviderTask,
  targetPageImagePngBytesFromProvider,
} from "../cli/cli_image2_response.mjs";

// Provider executor runtime seam (deadline/timing + response parsing), moved
// from shared/cli/command_support.mjs during refactor-harness-core.
const runtimeSeam = Object.freeze({
  image2ProviderOperationTiming,
  createImage2ProviderDeadline,
  readImage2ProviderResponseJson,
  pageImageProviderResponseKnownFailure,
  pageImageProviderTaskPollUnresolved,
  pageImageProviderSubmitUnresolved,
  pageImageProviderTaskId,
  pageImageProviderHasInlineImage,
  resolveImage2ProviderTask,
  targetPageImagePngBytesFromProvider,
});

function failRequest(message) {
  const error = new Error(message);
  error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
  throw error;
}

function boundCallShape(provider) {
  const validated = validateCallShapeValue({
    model: provider?.model,
    prompt_budget: provider?.prompt_budget,
    transport: provider?.transport,
    result_protocol: provider?.result_protocol,
  });
  if (!isLegalPageImageTransport(validated.value.transport)) {
    failRequest("Target Page Image provider request is not bound to a legal transport vector");
  }
  if (validated.value.result_protocol !== RESULT_PROTOCOL_JSON_INLINE_B64) {
    failRequest("Target Page Image provider request uses an unregistered result_protocol");
  }
  return validated.value;
}

function buildSubmitCall({ credentials, providerIdempotencyKey, callShape, prompt, styleMaster, images }) {
  const vector = callShape.transport;
  const size = pageImageTransportRequestSize(vector);
  const url = `${credentials.base_url}/images/${vector.http_operation}`;
  const headers = {
    Authorization: `Bearer ${credentials.api_key}`,
    "Idempotency-Key": providerIdempotencyKey,
  };
  if (vector.encoding === "json") {
    return {
      url,
      options: {
        method: "POST",
        redirect: "error",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: callShape.model,
          prompt,
          n: 1,
          size,
          image: images[0],
          images,
          image_urls: images,
        }),
      },
    };
  }
  if (!styleMaster?.bytes) {
    failRequest("Target Page Image edits request is missing reference bytes");
  }
  const form = new FormData();
  form.append("model", callShape.model);
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", size);
  form.append(
    "image",
    new Blob([styleMaster.bytes], { type: styleMaster.candidate_media_type || "image/png" }),
    "image.png",
  );
  return {
    url,
    options: {
      method: "POST",
      redirect: "error",
      headers,
      body: form,
    },
  };
}

/**
 * Stateless Image2 page-image executor. No runDir, profile YAML, or State.
 * Callers supply credentials, a validated Call Shape value, prompt/reference
 * bytes, and injectable fetch/clock/deadline.
  * Authority: openspec/specs/harness-script-layout/spec.md
 * Authority: openspec/specs/image-generation/spec.md
 */
export async function executePageImageProviderCall({
  credentials,
  provider,
  prompt,
  styleMaster = null,
  extraImages = [],
  idempotencyKey,
  fetchImpl = fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  providerDeadlineMs = null,
  taskPollTimeoutMs = null,
  taskPollIntervalMs = null,
  http = null,
} = {}) {
  const callShape = boundCallShape(provider || {});
  const images = extraImages;
  const submitCall = buildSubmitCall({
    credentials,
    providerIdempotencyKey: idempotencyKey,
    callShape,
    prompt,
    styleMaster,
    images,
  });
  const runtime = http || runtimeSeam;
  const timing = runtime.image2ProviderOperationTiming({
    providerDeadlineMs,
    taskPollTimeoutMs,
    taskPollIntervalMs,
  });
  const deadline = runtime.createImage2ProviderDeadline({ now, timeoutMs: timing.timeoutMs });
  const payload = await runtime.readImage2ProviderResponseJson({
    url: submitCall.url,
    options: submitCall.options,
    fetchImpl,
    deadline,
    knownFailure: runtime.pageImageProviderResponseKnownFailure,
    unresolved: runtime.pageImageProviderTaskPollUnresolved,
    requestUnresolved: runtime.pageImageProviderSubmitUnresolved,
  });
  const taskId = runtime.pageImageProviderTaskId(payload);
  if (taskId && !runtime.pageImageProviderHasInlineImage(payload)) {
    if (callShape.transport.completion === "sync") {
      throw runtime.pageImageProviderResponseKnownFailure("task_response_invalid");
    }
    return runtime.resolveImage2ProviderTask({
      baseUrl: credentials.base_url,
      apiKey: credentials.api_key,
      taskId,
      fetchImpl,
      sleep,
      deadline,
      pollIntervalMs: timing.intervalMs,
      knownFailure: runtime.pageImageProviderResponseKnownFailure,
      unresolved: runtime.pageImageProviderTaskPollUnresolved,
      completePayload: runtime.targetPageImagePngBytesFromProvider,
    });
  }
  return runtime.targetPageImagePngBytesFromProvider(payload);
}

export function inspectPageImageExecutorPng(bytes) {
  return inspectExactPageImagePng(bytes, PAGE_IMAGE_NATIVE_RAW_PNG);
}

export { NAMED_DEFAULT_RESULT_PROTOCOL, RESULT_PROTOCOL_JSON_INLINE_B64 };
