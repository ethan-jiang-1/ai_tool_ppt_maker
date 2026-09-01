/**
 * cli_deadline.mjs — Image2 provider operation timing and deadline tools.
 * Mechanical move from command_support.mjs; no behavior changes.
 */

export const IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS = 600_000;
export const IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS = 1_000;

export function image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs }) {
  return Object.freeze({
    // taskPollTimeoutMs remains test-only and bounds the complete operation
    // rather than granting polls a fresh window.
    timeoutMs: Number.isSafeInteger(providerDeadlineMs) && providerDeadlineMs > 0
      ? providerDeadlineMs
      : Number.isSafeInteger(taskPollTimeoutMs) && taskPollTimeoutMs > 0
        ? taskPollTimeoutMs
        : IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS,
    intervalMs: Number.isSafeInteger(taskPollIntervalMs) && taskPollIntervalMs > 0
      ? taskPollIntervalMs
      : IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
  });
}

export function createImage2ProviderDeadline({ now, timeoutMs }) {
  const startedAt = now();
  const deadlineAt = startedAt + timeoutMs;
  return Object.freeze({
    remainingMs() {
      return Math.max(0, deadlineAt - now());
    },
  });
}

export function image2ProviderDeadlineAbortError() {
  const error = new Error("Image2 provider operation deadline elapsed");
  error.name = "AbortError";
  return error;
}

export function awaitWithinImage2ProviderDeadline(work, signal) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      settle(value);
    };
    const onAbort = () => finish(rejectPromise, image2ProviderDeadlineAbortError());
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve()
      .then(work)
      .then((value) => finish(resolvePromise, value), (error) => finish(rejectPromise, error));
  });
}
