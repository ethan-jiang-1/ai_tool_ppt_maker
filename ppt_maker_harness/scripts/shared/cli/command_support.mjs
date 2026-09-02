/**
 * command_support.mjs — cross-command shared glue for the ppt_flow CLI.
 * Core adapter resolution and shared infrastructure symbols consumed by the
 * CLI command seam and the bounded cli_* modules. Bounded concerns live in
 * cli_diagnostics, cli_image2_response, cli_style_master, cli_status,
 * cli_deadline, and cli_artifact_view (refactor-harness-core).
  * Authority: openspec/specs/cli-surface/spec.md
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve, basename, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  CLI_PROGRESS_ENV,
  CLI_TRANSACTION_SYMBOL,
  createChildOutputCollector,
  createCliNext,
  emitCliError,
  emitCliProgress,
} from "./cli_error.mjs";
import {
  SLIDE_SPECS_NAME,
  deckRoot,
  findSlideSpecs,
  verifyDeckHarnessBinding,
} from "../run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  isPageImageWorkflowSelectionPending,
  probeProductionMarker,
} from "../run-bundle/production_marker.mjs";
import {
  emitCurrentProtocolError,
  emitExecutionRunVersionMismatch,
  emitUnsupportedHarnessBinding,
} from "./cli_diagnostics.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const HARNESS_DIR = resolve(__dirname, "../../..");
export const PPT_FLOW_ENTRY = join(HARNESS_DIR, "scripts", "ppt_flow.mjs");

let contentApiPromise = null;
export function loadContentApi() {
  contentApiPromise ??= import("../../01-content/index.mjs");
  return contentApiPromise;
}

export function hasExplicitCliOption(option) {
  return process.argv.some((argument) => argument === option || argument.startsWith(`${option}=`));
}

/**
 * Resolve one exact run to its only permitted production adapter before a
 * command reads generated output, checks readiness, or initializes a provider.
 * Every supported run has an explicit source marker and a durable identity
 * record that agrees with that marker.
 */
export function preflightAdapterSource(resolved, where) {
  const canonicalSource = join(resolved, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(resolved);
  if (!source) return false;

  const sourceBytes = readFileSync(source);
  const marker = probeProductionMarker(sourceBytes, { source: basename(source) });
  if (marker.branch === "invalid") {
    if (isPageImageWorkflowSelectionPending(marker)) return false;
    emitCurrentProtocolError(`${where}.source`, resolved, marker.issues[0]?.code || "CURRENT_PROTOCOL_INVALID");
    return true;
  }
  return false;
}

/**
 * A fresh current bundle has no durable identity record until its authored source has a
 * valid workflow receipt.  This narrow draft route lets the selected adapter
 * create that first binding; it never applies to an undeclared protocol or an active
 * non-draft execution.
 */
export async function resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir) {
  const { resolveTargetAuthoringDraftRoute } = await import("../../shared/state/target_authoring_draft_route.mjs");
  const draft = resolveTargetAuthoringDraftRoute(resolved, { playbookDir: join(harnessDir, "playbook") });
  if (!draft || draft.deck_dir !== deckDir) return null;
  return Object.freeze({
    ok: true,
    run_version: draft.run_version,
    workflow: draft.workflow,
    source_pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
    adapter: "page-image-workflow",
    draft: true,
    target_workflow_selection_required: draft.workflow === null,
  });
}

export function resolveRunHarnessBinding(runDir, where) {
  const resolved = resolve(runDir || "");
  const binding = verifyDeckHarnessBinding(deckRoot(resolved));
  if (binding.kind !== "resolved") {
    emitUnsupportedHarnessBinding(where, resolved, binding);
    return null;
  }
  return Object.freeze({ resolved, ...binding });
}

export async function resolveRunAdapter(runDir, where) {
  const binding = resolveRunHarnessBinding(runDir, `${where}.binding`);
  if (!binding) return null;
  const { resolved, deckDir, harnessDir } = binding;
  if (preflightAdapterSource(resolved, where)) return null;
  const targetDraft = await resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir);
  if (targetDraft) return Object.freeze({ ...targetDraft, run_dir: resolved, deck_dir: deckDir, harness_dir: harnessDir });
  const { resolveRunProductionAdapter } = await import("../../shared/state/state.mjs");
  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (route.ok && route.adapter === "page-image-workflow") {
    return Object.freeze({ ...route, run_dir: resolved, deck_dir: deckDir, harness_dir: harnessDir });
  }
  if (route.code === "execution_run_version_mismatch") {
    emitExecutionRunVersionMismatch(where, resolved, route);
    return null;
  }
  emitCurrentProtocolError(where, resolved, route.code);
  return null;
}

/**
 * Pre-POST profile fence (shared by preflight/probe): resolve the exact run's
 * confirmed provider profile and require IMAGE2_PROVIDER_PROFILE_ID to match.
 * Returns true on success; emits the owner-issued diagnostic and returns false
 * on any missing/invalid/mismatched profile, before any provider POST.
 */
export async function requireExactRunImage2Profile(route, { where = "ppt_flow", operation = "raw-generation-readiness" } = {}) {
  try {
    const { resolveImage2ProviderProfile } = await import("../../shared/image2/provider_profile.mjs");
    const { requireMatchingImage2RuntimeProfileId } = await import("../../shared/image2/runtime_profile_id.mjs");
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    const profile = resolveImage2ProviderProfile(route.run_dir);
    applyImage2StartupEnv({ runDir: route.run_dir });
    requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
    return true;
  } catch (error) {
    const reason = pageImageDiagnosticReasonKind(error?.code);
    const sourceFailure = isImage2ProviderProfileSourceFailure(reason);
    const sourcePath = sourceFailure && error?.source
      ? join(route.deck_dir, ...String(error.source).split("/"))
      : null;
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: sourceFailure
        ? "The selected Image2 provider profile source is not ready."
        : "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
      hint: sourceFailure
        ? "Repair the selected non-secret provider profile source, then rerun this exact readiness check."
        : "Repair IMAGE2_PROVIDER_PROFILE_ID for this environment, then rerun this exact readiness check.",
      where,
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: sourceFailure ? "source_validation" : "environment",
        operation,
        ...(sourcePath ? { source: { path: sourcePath } } : {}),
        reason: { kind: sourceFailure ? reason : "image2_provider_profile_id_mismatch" },
        next: createCliNext(sourceFailure ? "edit_source" : "repair_environment", {
          ...(sourcePath ? { inspect: [{ path: sourcePath }] } : {}),
          default: sourceFailure
            ? "Repair the selected provider profile source, then rerun this exact readiness check."
            : "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun this exact readiness check.",
        }),
      },
    });
    return false;
  }
}

export function runNode(script, args = [], { env = {} } = {}) {
  const cmd = ["node", script, ...args].map(String);
  console.log("→ " + cmd.join(" "));
  return new Promise((resolve) => {
    const collector = createChildOutputCollector({
      registered: true,
      onProgress: (event, fields) => emitCliProgress(event, fields),
    });
    const child = spawn("node", [script, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...env, [CLI_PROGRESS_ENV]: "1" },
    });
    const transaction = globalThis[CLI_TRANSACTION_SYMBOL];
    if (transaction?.installed) transaction.activeChild = child;
    child.stdout.on("data", (chunk) => collector.pushStdout(chunk));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => collector.pushStderr(chunk));
    child.on("close", (rawCode) => {
      if (transaction?.activeChild === child) transaction.activeChild = null;
      const result = collector.finish(rawCode);
      if (result.code === 0 && !result.overflow) {
        runNode.lastChildResult = null;
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
      } else {
        runNode.lastChildResult = {
          ...result,
          invocation: { program: "node", args: [script, ...args] },
        };
      }
      resolve(result.overflow ? 1 : result.code);
    });
    child.on("error", () => {
      if (transaction?.activeChild === child) transaction.activeChild = null;
      runNode.lastChildResult = {
        childError: null,
        overflow: false,
        invocation: { program: "node", args: [script, ...args] },
      };
      resolve(1);
    });
  });
}
runNode.lastChildResult = null;

export function metadataFields(path) {
  const fields = {};
  if (!existsSync(path)) return fields;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    if (!line.includes(":") || line.trimStart().startsWith("#")) continue;
    const [key, ...rest] = line.split(":");
    fields[key.trim()] = rest.join(":").trim();
  }
  return fields;
}

/**
 * Update one metadata gate without rewriting unrelated fields/comments.
 * Creates the parent directory if it does not exist.
 * @param {string} metadataPath
 * @param {string} gate - "content" or "visual".
 * @param {string} value - Default "approved".
 */
export function updateGate(metadataPath, gate, value = "approved") {
  const key = `${gate}_gate`;
  let lines = existsSync(metadataPath)
    ? readFileSync(metadataPath, "utf-8").split("\n")
    : [];
  const replacement = `${key}: ${value}`;
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].split(":", 1)[0].trim() === key) {
      lines[i] = replacement;
      found = true;
      break;
    }
  }
  if (!found) lines.push(replacement);
  mkdirSync(dirname(metadataPath), { recursive: true });
  writeFileSync(metadataPath, lines.join("\n").trimEnd() + "\n", "utf-8");
}

export function buildEnvSearchDirs(dkRoot) {
  const cwd = process.cwd();
  const searchDirs = [dkRoot, cwd];
  let p = cwd;
  while (p) {
    const parent = dirname(p);
    if (parent === p) break;
    if (!searchDirs.includes(parent)) searchDirs.push(parent);
    p = parent;
  }
  return searchDirs;
}

export async function resolveImage2Run(runDir, where) {
  const route = await resolveRunAdapter(runDir, where);
  return route?.adapter === "page-image-workflow" ? route.run_dir : null;
}
export const PAGE_IMAGE_OPERATIONS = new Set([
  "plan",
  "pilot",
  "expansion",
  "authorize",
  "generate",
  "pilot-review",
  "pilot-accept",
  "review",
  "accept",
  "reconcile",
]);
export const PAGE_IMAGE_HASH_RE = /^[0-9a-f]{64}$/;
export const PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE = /^page-image-workflow-[0-9a-f]{64}$/;

export function pageImageDiagnosticReasonKind(value, fallback = "page_image_operation_failed") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}

export const FRAMED_SOURCE_VALIDATION_CODES = new Set([
  "invalid_header_overlay",
  "untrusted_header_overlay_override",
  "invalid_header_overlay_literal",
  "missing_framed_title",
  "unsupported_header_overlay_preset",
  "unsupported_framed_code_points",
  "font_selection_input_invalid",
  "framed_header_policy_invalid",
  "framed_header_overlay_input_invalid",
  "framed_header_overlay_profile_invalid",
  "framed_header_overlay_contract_invariant_failed",
  "framed_text_fit_failed",
  "framed_visual_language_required",
  "target_source_missing",
  "target_source_receipt_invalid",
]);

export const PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES = new Set([
  "page_design_system_source_unavailable",
  "page_design_system_source_invalid",
  "page_design_system_source_escape",
  "page_design_system_source_unreadable",
  "page_design_system_source_too_large",
  "page_design_system_source_utf8_invalid",
]);

export const PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES = new Set([
  "pure_provider_input_too_large",
  "framed_provider_input_too_large",
]);

export const FRAMED_ENVIRONMENT_CODES = new Set([
  "font_render_inventory_invalid",
  "framed_font_asset_missing",
  "framed_font_asset_invalid",
  "framed_font_runtime_invalid",
  "framed_font_runtime_unavailable",
  "framed_runtime_unavailable",
  "framed_render_timeout",
]);

export const FRAMED_INTERNAL_CODES = new Set([
  "framed_render_profile_invalid",
  "framed_render_profile_required",
  "framed_render_profile_stale",
  "framed_font_selection_invalid",
  "framed_render_contract_invariant_failed",
  "framed_raw_contract_invalid",
  "framed_raw_invalid",
  "target_raw_review_contribution_invalid",
  "target_provider_request_invalid",
  "target_source_candidate_invalid",
]);

export const TARGET_GATE_CODES = new Set([
  "provider_authorization_required",
  "raw_review_required",
  "target_provider_authorization_required",
]);

export function isTargetArtifactFailure(code) {
  if (["target_style_master_unavailable", "target_style_master_stale", "target_page_derived_publication_invalid", "framed_raw_contract_profile_stale", "human_navigation_invalid"].includes(code)) return true;
  return /^target_(?:source_receipt|source_state|raw_plan|raw_evidence|raw_review|accepted_raw_evidence|final_manifest|final_bytes|delivery)_.*(?:stale|required|missing|invalid|mismatch|drift)$/.test(code)
    || code === "target_raw_review_contribution_stale";
}

export function isTargetProviderFailure(code) {
  return /^page_image_provider_/.test(code)
    || /^target_provider_/.test(code)
    || code === "provider_submit_required"
    || code === "target_raw_bytes_invalid";
}

export function isImage2ProviderProfileSourceFailure(reason) {
  return reason.startsWith("image2_provider_profile_") && !isImage2RuntimeProfileFailure(reason);
}

export function isImage2RuntimeProfileFailure(reason) {
  return reason === "image2_provider_profile_id_missing" ||
    reason === "image2_provider_profile_id_invalid" ||
    reason === "image2_provider_profile_id_mismatch";
}

export function isImage2PromptBudgetFailure(reason) {
  return reason === "image2_prompt_budget_overflow" || reason === "image2_prompt_safety_overflow";
}

export function image2ProfileSourceLocator(route, error) {
  if (typeof error?.source !== "string" || !error.source || typeof route?.deck_dir !== "string") return null;
  const candidate = resolve(route.deck_dir, ...error.source.split("/"));
  const relation = relative(route.deck_dir, candidate);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) return null;
  return { path: candidate };
}

export function image2CapabilityFailureDiagnostic({ common, route, error, reason, operation }) {
  if (isImage2ProviderProfileSourceFailure(reason)) {
    const source = image2ProfileSourceLocator(route, error);
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Image2 provider profile source is not ready.",
      hint: "Repair the selected non-secret provider profile source, then rerun this exact checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        ...(source ? { source } : {}),
        next: createCliNext("edit_source", {
          ...(source ? { inspect: [source] } : {}),
          default: "Repair the selected provider profile source through its source owner, then rerun this exact checkpoint.",
        }),
      },
    };
  }
  if (isImage2RuntimeProfileFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
      hint: "Repair the environment-owned runtime profile selection, then rerun this exact checkpoint.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun this exact checkpoint.",
        }),
      },
    };
  }
  if (isImage2PromptBudgetFailure(reason)) {
    const measurement = error?.measurement;
    const operationId = typeof measurement?.operation === "string" ? measurement.operation : operation;
    const unit = typeof measurement?.unit === "string" ? measurement.unit : undefined;
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The exact Image2 provider prompt exceeds its local admitted budget.",
      hint: "Repair the contributing source or confirmed capability declaration, then rerun the same provider-free plan checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        subject: {
          kind: "image2_prompt_budget",
          ...(operationId ? { id: operationId } : {}),
          ...(unit ? { field: unit } : {}),
        },
        reason: {
          kind: reason,
          ...(Number.isSafeInteger(measurement?.measured) ? { actual: measurement.measured } : {}),
          ...(Number.isSafeInteger(measurement?.limit) ? { expected: measurement.limit } : {}),
        },
        next: createCliNext("edit_source", {
          default: "Repair the contributing source or confirmed capability declaration, then rerun the same provider-free plan checkpoint.",
        }),
      },
    };
  }
  return null;
}

const STORE_LOCK_FORBIDDEN_HINT = "Re-read the exact raw-owner facts after confirming no other writer process is active; do not delete the lock, rebuild the batch, retry the provider request, or resubmit the item.";

/**
 * Three-branch failure mapping for `progressive_raw_store_locked`. Only the
 * dead-writer-with-unresolved-attempt branch may offer `reconcile`; a live or
 * unprovable writer waits; a proven-dead writer without a reconcilable attempt
 * is reported as an anomaly. No branch suggests lock deletion or resubmission.
 */
function progressiveStoreLockedFailure(error, common) {
  const ownerAction = error?.next_action || null;
  const lockOwner = error?.details?.lock_owner || null;
  const waitSelector = ownerAction?.action_id === "wait_progressive_raw_completion" ||
    lockOwner?.alive === true ||
    lockOwner?.alive == null;
  if (waitSelector) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "Another progressive raw-owner writer holds the store lock; re-read exact owner facts after it exits.",
      hint: STORE_LOCK_FORBIDDEN_HINT,
      diagnostic: {
        ...common,
        category: "gate",
        ...(lockOwner?.pid ? { subject: { kind: "progressive_raw_lock", id: String(lockOwner.pid) } } : {}),
        next: createCliNext("wait_then_reread", {
          requiresHuman: false,
          default: "Wait for the active raw-owner writer to exit, then re-run the same command to re-read exact owner facts.",
        }),
      },
    };
  }
  if (ownerAction?.action_id === "reconcile_progressive_raw_attempt" && ownerAction?.attempt_sha256) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "A persisted provider submission must be reconciled before progressive work can continue.",
      hint: `Run image2 reconcile with the exact plan and attempt selectors; ${STORE_LOCK_FORBIDDEN_HINT}`,
      diagnostic: {
        ...common,
        category: "artifact",
        subject: { kind: "progressive_raw_attempt", id: ownerAction.attempt_sha256 },
        next: createCliNext("reconcile", {
          default: "Reconcile the exact submitted attempt without resubmitting it.",
        }),
      },
    };
  }
  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The progressive raw-owner store lock has no live writer and no reconcilable attempt.",
    hint: STORE_LOCK_FORBIDDEN_HINT,
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Report the unexplained progressive raw-owner lock with its exact run, plan, and lock-owner facts.",
      }),
    },
  };
}
