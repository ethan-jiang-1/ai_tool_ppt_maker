/**
 * cli_style_master.mjs — Style Master CLI glue: operations, option guards,
 * provider transport, and failure mapping.
 * Mechanical move from command_support.mjs; no behavior changes.
 */
import { decode as decodePng } from "fast-png";
import { join } from "node:path";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  createCliNext,
  projectProblemFactsDiagnostic,
} from "./cli_error.mjs";
import { SLIDE_SPECS_NAME } from "../run-bundle/bundle_layout.mjs";
import {
  IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
  createImage2ProviderDeadline,
  image2ProviderOperationTiming,
} from "./cli_deadline.mjs";
import {
  IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES,
  imageBytesFromPageImageProvider,
  pageImageProviderHasInlineImage,
  pageImageProviderTaskId,
  readImage2ProviderResponseJson,
  resolveImage2ProviderTask,
} from "./cli_image2_response.mjs";
import {
  hasExplicitCliOption,
  image2CapabilityFailureDiagnostic,
  pageImageDiagnosticReasonKind,
  PPT_FLOW_ENTRY,
} from "./command_support.mjs";
import { emitUsage } from "./cli_diagnostics.mjs";

export const STYLE_MASTER_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

export function styleMasterProviderKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
  if (!STYLE_MASTER_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS.has(classification)) {
    throw new Error("Style Master response failure classification is invalid");
  }
  const response = { classification };
  if (classification === "http_error" && Number.isSafeInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) {
    response.http_status = httpStatus;
  }
  if (classification === "invalid_json" && IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES.has(responseShape)) {
    response.response_shape = responseShape;
  }
  const error = new Error("Style Master provider returned an unusable response");
  error.code = "style_master_provider_response_invalid";
  error.style_master_known_failure = true;
  error.style_master_known_failure_facts = Object.freeze({ response: Object.freeze(response) });
  return error;
}

export function styleMasterProviderMediaKnownFailure() {
  const error = new Error("Style Master provider returned invalid candidate media");
  error.code = "style_master_provider_media_invalid";
  error.style_master_known_failure = true;
  return error;
}

export function styleMasterProviderTaskPollUnresolved() {
  const error = new Error("Style Master provider task outcome could not be resolved");
  error.code = "style_master_provider_response_unresolved";
  return error;
}

export function styleMasterProviderSubmitUnresolved() {
  const error = new Error("Style Master provider submission did not return a response");
  error.code = "style_master_provider_submit_failed";
  return error;
}

export async function initializeStyleMasterImage2Transport({ run_dir: runDir, candidate_generation_profile: profile } = {}) {
  try {
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir });
    const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId: profile?.provider?.profile_id });
  } catch {
    const error = new Error("Style Master provider credentials are unavailable");
    error.code = "style_master_provider_credentials_unavailable";
    throw error;
  }
}

export function styleMasterProviderBytesFromPayload(payload) {
  try {
    const bytes = imageBytesFromPageImageProvider(payload);
    const decoded = decodePng(bytes, { checkCrc: true });
    if (!Number.isInteger(decoded.width) || decoded.width <= 0 || !Number.isInteger(decoded.height) || decoded.height <= 0) {
      throw new Error("invalid dimensions");
    }
    return bytes;
  } catch {
    throw styleMasterProviderMediaKnownFailure();
  }
}

/** Submit one plan-bound Style Master candidate request through the existing Image2 transport. */
export function styleMasterSubmitFactory({
  fetchImpl = fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  providerDeadlineMs = null,
  taskPollTimeoutMs = null,
  taskPollIntervalMs = IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
} = {}) {
  const transportTiming = image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs });
  return async ({ compiled_prompt_bytes: compiledPromptBytes, candidate_generation_profile: profile, transport }) => {
    if (!Buffer.isBuffer(compiledPromptBytes) || compiledPromptBytes.length === 0 ||
      !profile?.provider?.model || !transport?.base_url || !transport?.api_key) {
      const error = new Error("Style Master provider request is not bound to its plan generation profile");
      error.code = "style_master_provider_request_invalid";
      error.style_master_known_failure = true;
      throw error;
    }
    const deadline = createImage2ProviderDeadline({ now, timeoutMs: transportTiming.timeoutMs });
    const payload = await readImage2ProviderResponseJson({
      url: `${transport.base_url}/images/generations`,
      options: {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${transport.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: profile.provider.model,
          prompt: compiledPromptBytes.toString("utf8"),
          n: 1,
          size: "2000x1125",
        }),
      },
      fetchImpl,
      deadline,
      knownFailure: styleMasterProviderKnownFailure,
      unresolved: styleMasterProviderTaskPollUnresolved,
      requestUnresolved: styleMasterProviderSubmitUnresolved,
    });
    const taskId = pageImageProviderTaskId(payload);
    if (taskId && !pageImageProviderHasInlineImage(payload)) {
      return resolveImage2ProviderTask({
        baseUrl: transport.base_url,
        apiKey: transport.api_key,
        taskId,
        fetchImpl,
        sleep,
        deadline,
        pollIntervalMs: transportTiming.intervalMs,
        knownFailure: styleMasterProviderKnownFailure,
        unresolved: styleMasterProviderTaskPollUnresolved,
        completePayload: styleMasterProviderBytesFromPayload,
      });
    }
    return styleMasterProviderBytesFromPayload(payload);
  };
}

export const STYLE_MASTER_OPERATIONS = new Set([
  "inspect",
  "plan",
  "authorize",
  "generate",
  "review",
  "accept",
  "abandon",
]);
export const STYLE_MASTER_PLAN_HASH_RE = /^[0-9a-f]{64}$/;

export function styleMasterNextInvocation(route, operation, options = {}) {
  const args = [PPT_FLOW_ENTRY, "style-master", operation, route.run_dir];
  if (options.planHash) args.push("--plan-hash", options.planHash);
  if (options.candidateCount !== undefined) args.push("--candidate-count", String(options.candidateCount));
  if (options.decision) args.push("--decision", options.decision);
  if (options.candidateId) args.push("--candidate-id", options.candidateId);
  if (options.reason) args.push("--reason", options.reason);
  return Object.freeze({ program: "node", args: Object.freeze(args) });
}

export function styleMasterUnexpectedOption(operation) {
  const allowed = {
    inspect: new Set(["--plan-hash"]),
    plan: new Set(["--candidate-count"]),
    authorize: new Set(["--plan-hash"]),
    generate: new Set(["--plan-hash"]),
    review: new Set(["--plan-hash"]),
    accept: new Set(["--plan-hash", "--decision", "--candidate-id"]),
    abandon: new Set(["--plan-hash", "--reason"]),
  }[operation] || new Set();
  return ["--plan-hash", "--candidate-count", "--decision", "--candidate-id", "--reason"]
    .find((option) => hasExplicitCliOption(option) && !allowed.has(option)) || null;
}

export function requiredStyleMasterPlanHash(operation, opts) {
  if (!hasExplicitCliOption("--plan-hash")) {
    emitUsage(`ppt_flow.style-master.${operation}`, "--plan-hash is required", "Pass the exact current Style Master plan SHA-256.");
    return null;
  }
  if (!STYLE_MASTER_PLAN_HASH_RE.test(opts.planHash || "")) {
    emitUsage(`ppt_flow.style-master.${operation}`, "--plan-hash must be one lowercase SHA-256", "Pass the exact current Style Master plan SHA-256.");
    return null;
  }
  return opts.planHash;
}

export function requestedStyleMasterCandidateCount(opts) {
  if (!hasExplicitCliOption("--candidate-count")) {
    emitUsage("ppt_flow.style-master.plan", "--candidate-count is required", "Pass one explicit candidate count from 0 through 4.");
    return null;
  }
  if (!/^[0-4]$/.test(String(opts.candidateCount || ""))) {
    emitUsage("ppt_flow.style-master.plan", "--candidate-count must be an integer from 0 through 4", "Pass one explicit candidate count from 0 through 4.");
    return null;
  }
  return Number(opts.candidateCount);
}

export function styleMasterFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code, "style_master_operation_failed");
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `style-master-${operation}`,
    reason: Object.freeze({ kind: reason }),
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const problemDiagnostic = projectProblemFactsDiagnostic({
    error,
    operation: `style-master-${operation}`,
    rerunText: `Repair the named Page Image source or configuration through its owner, then rerun style-master ${operation}.`,
  });
  if (problemDiagnostic) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image source or configuration is invalid and must be repaired before this Style Master checkpoint can continue.",
      hint: "Repair the exact named source through its owner, then rerun the same style-master command.",
      diagnostic: problemDiagnostic,
    };
  }

  const capabilityFailure = image2CapabilityFailureDiagnostic({ common, route, error, reason, operation: `style-master-${operation}` });
  if (capabilityFailure) return capabilityFailure;

  if ([
    "style_master_intent_invalid",
    "style_master_context_invalid",
    "style_master_prompt_invalid",
    "style_master_local_invalid",
    "style_master_local_unstable",
    "style_master_scope_candidate_invalid",
  ].includes(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master intent, visual context, or local candidate is invalid.",
      hint: "Repair the canonical source or local presentation asset, then rerun the Style Master operation.",
      diagnostic: {
        ...common,
        category: "source_validation",
        source,
        next: createCliNext("edit_source", {
          inspect: [source],
          default: "Repair the selected workflow source or canonical Style Master input, then rerun this operation.",
        }),
      },
    };
  }

  if (reason === "style_master_scope_workflow_required") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "Style Master work requires one selected target workflow.",
      hint: "Record the selected Framed or Pure workflow before starting Style Master work.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("review", {
          default: "Select one target workflow through the Controller, then rerun Style Master inspection.",
        }),
      },
    };
  }

  if (reason === "style_master_provider_credentials_unavailable") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "Style Master candidate generation cannot access the Image2 credentials.",
      hint: "Repair Image2 credentials or endpoint configuration, then rerun the exact generate operation.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Repair the Image2 credential and endpoint configuration, then rerun the exact Style Master generate operation.",
        }),
      },
    };
  }

  if (reason === "style_master_grant_missing" || reason === "style_master_plan_not_authorizable") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "Style Master candidate generation requires its exact current cost authorization.",
      hint: "Review and authorize the exact current Style Master candidate plan before generation.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("approve", {
          invocation: styleMasterNextInvocation(route, "authorize", {
            planHash: error?.plan_sha256 || null,
          }),
          default: "Obtain human approval for the exact current Style Master candidate cost, then authorize that plan.",
        }),
      },
    };
  }

  if (reason === "style_master_attempt_unknown") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "A submitted Style Master candidate has an unknown provider outcome.",
      hint: "Provide a human reason to abandon the exact current plan; do not retry the provider request.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("review", {
          default: "Review the unknown submitted candidate and provide a reasoned exact-plan abandonment if recovery is required.",
        }),
      },
    };
  }

  if (reason.startsWith("style_master_provider_") || reason.startsWith("style_master_transport_")) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Style Master Image2 provider operation did not complete.",
      hint: "Repair provider availability, then inspect the exact candidate plan before continuing.",
      diagnostic: {
        ...common,
        category: "provider",
        next: createCliNext("inspect", {
          invocation: styleMasterNextInvocation(route, "inspect"),
          default: "Inspect the exact current Style Master plan before deciding whether provider recovery is known or unknown.",
        }),
      },
    };
  }

  if (reason === "style_master_selection_conflict") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The effective Style Master selection changed before promotion could commit.",
      hint: "Inspect and review the current Style Master selection before another promotion attempt.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("review", {
          default: "Review the current Style Master candidates and selection before recording another visual-direction decision.",
        }),
      },
    };
  }

  if (reason === "style_master_plan_stale") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Style Master plan no longer matches the current confirmed compiler or capability profile.",
      hint: "Preserve the historical plan and publish its existing provider-free successor before continuing.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("plan_style_master_successor", {
          default: "Publish the current Style Master successor plan, then complete its existing review and selection path.",
        }),
      },
    };
  }

  if (reason.startsWith("style_master_")) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master lifecycle record is stale, incomplete, or inconsistent.",
      hint: "Inspect the current Style Master owner projection and follow its one next action.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("inspect", {
          invocation: styleMasterNextInvocation(route, "inspect"),
          default: "Inspect the current Style Master owner projection, then follow its exact next action.",
        }),
      },
    };
  }

  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The Style Master operation failed unexpectedly.",
    hint: "Report the Harness failure; do not infer a provider or recovery route.",
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Inspect the registered Style Master owner and report the Harness failure before rerunning.",
      }),
    },
  };
}
