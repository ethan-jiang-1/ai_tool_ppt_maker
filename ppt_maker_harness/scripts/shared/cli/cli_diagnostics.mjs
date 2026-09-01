/**
 * cli_diagnostics.mjs — CLI error/usage envelope emission, gate diagnostics,
 * and target Page Image / progressive failure mapping.
 * Mechanical move from command_support.mjs; no behavior changes.
 */
import { join, resolve } from "node:path";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  buildDelegatedDiagnostic,
  createCliNext,
  emitCliError,
  projectProblemFactsDiagnostic,
} from "./cli_error.mjs";
import { deckRoot, VERSIONS_DIR, SLIDE_SPECS_NAME } from "../run-bundle/bundle_layout.mjs";
import { styleMasterFailure } from "./cli_style_master.mjs";
import {
  FRAMED_ENVIRONMENT_CODES,
  FRAMED_INTERNAL_CODES,
  FRAMED_SOURCE_VALIDATION_CODES,
  hasExplicitCliOption,
  image2CapabilityFailureDiagnostic,
  isTargetArtifactFailure,
  isTargetProviderFailure,
  PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES,
  PAGE_IMAGE_HASH_RE,
  PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES,
  pageImageDiagnosticReasonKind,
  PPT_FLOW_ENTRY,
  runNode,
  TARGET_GATE_CODES,
} from "./command_support.mjs";

/** Emit FAILED envelope; caller still returns/exits the numeric code (D13). */
export function emitFailed(where, message, hint = "Inspect the diagnostic evidence before retrying", diagnostic = undefined) {
  const childResult = runNode.lastChildResult;
  const replacementRequired = /\breplacement_required\b/.test(String(message || ""));
  const inferred = diagnostic || (replacementRequired ? {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    category: "artifact",
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    reason: { kind: "replacement_required" },
    next: createCliNext("repair_prerequisite", {
      default: "Preserve the existing bytes and run fresh explicit ppt_flow init; fresh authoring carries no old state, receipt, approval, provider authority, generated artifact, or execution evidence.",
    }),
  } : childResult ? buildDelegatedDiagnostic({
    invocation: childResult.invocation,
    childError: childResult.childError,
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    overflow: childResult.overflow,
    next: createCliNext("inspect", { default: "Inspect the retained child evidence and parent command context before retrying." }),
  }) : {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    category: /(?:init|status|new-version)/.test(where) ? "structure" : /doctor/.test(where) ? "environment" : "artifact",
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    next: createCliNext(/doctor/.test(where) ? "repair_environment" : "repair_prerequisite", {
      default: /doctor/.test(where) ? "Repair the named environment prerequisite, then rerun." : "Inspect and repair the named source or prerequisite, then rerun the command.",
    }),
  });
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message,
    hint,
    where,
    diagnostic: inferred,
  });
}

/** Emit USAGE envelope; return 1 for command* return paths. */
export function emitUsage(where, message, hint) {
  emitCliError({
    code: CLI_ERROR_CODES.USAGE,
    message,
    hint,
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "usage",
      operation: where.split(".").at(-1).replaceAll("_", "-"),
      next: createCliNext("fix_arguments", {
        invocation: { program: "node", args: [PPT_FLOW_ENTRY, "--help"] },
        default: "Correct the command arguments using --help, then rerun.",
      }),
    },
  });
  return 1;
}

export function exitUsage(where, message, hint) {
  emitUsage(where, message, hint);
  process.exit(1);
}

export function emitCurrentProtocolError(where, resolved, code = "CURRENT_PROTOCOL_INVALID") {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "This run contains a record that cannot establish exact current Page Image Workflow identity.",
    hint: "Repair the current source, state, or delivery identity through its owner before continuing.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "repair-current-protocol",
      source: { path: resolved },
      reason: { kind: "current_protocol_invalid", actual: code },
      next: createCliNext("repair_prerequisite", {
        default: "Repair the current source, state, or delivery identity through its owner, then retry.",
      }),
    },
  });
}

export function emitExecutionRunVersionMismatch(where, resolved, result) {
  const requested = result?.requested_run_version || null;
  const active = result?.active_run_version || null;
  const activeRunDir = active ? join(deckRoot(resolved), VERSIONS_DIR, active) : resolved;
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "The selected run is not the active Page Image execution.",
    hint: "Inspect the active execution before selecting a mutation target; this command made no changes.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "select-active-execution",
      source: { path: resolved },
      reason: {
        kind: "execution_run_version_mismatch",
        actual: requested,
        expected: active,
      },
      next: createCliNext("inspect", {
        requiresHuman: false,
        inspect: [{ path: activeRunDir }],
        default: "Inspect the active run before selecting another Page Image mutation target.",
      }),
    },
  });
}

export function emitUnsupportedHarnessBinding(where, resolved, binding) {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.",
    hint: "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming this content.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "verify-harness-binding",
      source: { path: resolved },
      reason: { kind: "harness_binding_invalid", actual: binding.code },
      next: createCliNext("repair_prerequisite", {
        requiresHuman: true,
        default: "Confirm reconstruction of a new current Run Bundle; preserve the existing Bundle unchanged.",
      }),
    },
  });
}

export function createGateDiagnostic({ operation, source, issues = [], action = "review", invocation, defaultText }) {
  return {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    category: "gate",
    operation,
    ...(source ? { source: { path: source } } : {}),
    ...(issues.length ? { issues } : {}),
    next: createCliNext(action, {
      requiresHuman: true,
      ...(source ? { inspect: [{ path: source }] } : {}),
      ...(invocation ? { invocation } : {}),
      default: defaultText,
    }),
  };
}

/** After subprocess/command code: emit FAILED if non-zero, then exit. */
export function exitWithCode(code, where, message, hint) {
  if (code !== 0) {
    const childResult = runNode.lastChildResult;
    emitFailed(
      where,
      message || `Delegated command exited ${code}`,
      hint || "Inspect the delegated diagnostic evidence before retrying",
      childResult ? buildDelegatedDiagnostic({
        invocation: childResult.invocation,
        childError: childResult.childError,
        operation: where.split(".").at(-1).replaceAll("_", "-"),
        overflow: childResult.overflow,
        next: createCliNext("inspect", {
          requiresHuman: false,
          default: "Inspect the retained child evidence and parent command context before retrying.",
        }),
      }) : undefined
    );
    runNode.lastChildResult = null;
  }
  process.exit(code);
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

export function targetPageImageFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code);
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `target-page-image-${operation}`,
    reason: { kind: reason },
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const problemDiagnostic = projectProblemFactsDiagnostic({
    error,
    operation: `target-page-image-${operation}`,
    rerunText: `Repair the named Page Image source or configuration through its owner, then rerun image2 ${operation}.`,
  });
  if (problemDiagnostic) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image source or configuration is invalid and must be repaired before this checkpoint can continue.",
      hint: "Repair the exact named source through its owner, then rerun the same image2 command.",
      diagnostic: problemDiagnostic,
    };
  }

  const capabilityFailure = image2CapabilityFailureDiagnostic({ common, route, error, reason, operation: `target-page-image-${operation}` });
  if (capabilityFailure) return capabilityFailure;

  if (reason.startsWith("progressive_raw")) {
    if (reason === "progressive_raw_store_locked") {
      return progressiveStoreLockedFailure(error, common);
    }
    if (reason === "progressive_raw_attempt_chain_invalid") {
      return {
        code: CLI_ERROR_CODES.FAILED,
        message: "The progressive Page Image attempt history has an immutable integrity conflict.",
        hint: "Report the Harness integrity defect; do not retry, rebuild, edit records, or start provider work.",
        diagnostic: {
          ...common,
          category: "internal",
          next: createCliNext("report_internal", {
            default: "Report the progressive raw integrity conflict with its exact run and plan facts before any further work.",
          }),
        },
      };
    }
    const ownerAction = error?.next_action || null;
    const reconciliation = reason.includes("reconciliation") || reason.includes("outcome_unresolved");
    const gate = reconciliation || /(?:grant_required|authorization|required|batch_terminal|pilot_|complete_review)/.test(reason);
    const provider = reason.includes("provider") && !reconciliation;
    const ownerRequiresHuman = typeof ownerAction?.requires_human === "boolean"
      ? ownerAction.requires_human
      : null;
    const nextAction = reconciliation
      ? "reconcile"
      : ownerRequiresHuman === false
        ? "repair_prerequisite"
        : gate
          ? "review"
          : "repair_prerequisite";
    return {
      code: gate ? CLI_ERROR_CODES.GATE_BLOCKED : CLI_ERROR_CODES.FAILED,
      message: reconciliation
        ? "A persisted provider submission must be reconciled before progressive work can continue."
        : gate
          ? "The progressive Page Image checkpoint is not ready for this operation."
          : provider
            ? "The progressive Page Image provider operation did not complete."
            : "The progressive Page Image raw-owner facts are stale or invalid.",
      hint: "Use the owner-issued next action; do not retry or infer another batch, grant, or provider result.",
      diagnostic: {
        ...common,
        category: provider ? "provider" : gate ? "gate" : "artifact",
        ...(ownerAction ? { subject: { kind: "progressive_raw_action", id: ownerAction.action_id } } : {}),
        next: createCliNext(nextAction, {
          ...(ownerRequiresHuman === null ? {} : { requiresHuman: ownerRequiresHuman }),
          default: ownerAction?.action_id
            ? `Run the raw owner's ${ownerAction.action_id} action after re-reading exact current owner facts.`
            : "Inspect the exact progressive raw owner facts and run its one current action.",
        }),
      },
    };
  }

  if (PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES.has(reason)) {
    const exactSourcePath = typeof error?.details?.source === "string" && error.details.source
      ? resolve(error.details.source)
      : null;
    const exactSource = exactSourcePath ? { path: exactSourcePath } : null;
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Page Design System source is invalid or cannot be read safely.",
      hint: "Repair the exact selected Page Design System source, then rerun the same image2 checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        ...(exactSource ? { source: exactSource } : {}),
        next: createCliNext("edit_source", {
          ...(exactSource ? { inspect: [exactSource] } : {}),
          default: "Repair the exact selected Page Design System source through its source owner, then rerun the same image2 checkpoint.",
        }),
      },
    };
  }

  if (PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Page Image canonical provider input exceeds its local size bound.",
      hint: "Reduce the contributing source or visual configuration, then rebuild the current Page Image plan.",
      diagnostic: {
        ...common,
        category: "source_validation",
        next: createCliNext("edit_source", {
          default: "Reduce the contributing Page Image source or visual configuration, then rerun image2 plan.",
        }),
      },
    };
  }

  if (FRAMED_SOURCE_VALIDATION_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Framed header overlay is invalid or cannot fit the selected page presentation.",
      hint: "Repair the named Page Source header fields or selected Framed presentation profile, then rerun image2 plan.",
      diagnostic: {
        ...common,
        category: "source_validation",
        source,
        next: createCliNext("edit_source", {
          inspect: [source],
          default: "Repair the current Page Source header fields or selected Framed presentation profile, then rerun image2 plan.",
        }),
      },
    };
  }

  if (FRAMED_ENVIRONMENT_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The local Framed browser or checked-in font runtime is not ready.",
      hint: "Repair the local Framed runtime or font inventory, then rerun the same checkpoint.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Run the Framed-local doctor repair path, then rerun the same image2 checkpoint.",
        }),
      },
    };
  }

  if (FRAMED_INTERNAL_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The canonical Framed render contract is inconsistent.",
      hint: "Report the Harness defect; source and provider configuration are not the repair owner.",
      diagnostic: {
        ...common,
        category: "internal",
        next: createCliNext("report_internal", {
          default: "Inspect the Framed compiler, profile, or capture owner and report the Harness defect before rerunning.",
        }),
      },
    };
  }

  if (reason === "target_style_master_stale" && error?.next_action === "plan_style_master_successor") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master selection is stale for the selected workflow source.",
      hint: "Publish a provider-free Style Master successor plan, then complete its review and selection before rebuilding raw work.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("plan_style_master_successor", {
          default: "Run Style Master inspection, publish one current successor plan with an explicit candidate count, then review and select it before rerunning image2 plan.",
        }),
      },
    };
  }

  if (operation === "artifact-view" && reason.startsWith("style_master_")) {
    const ownerFailure = styleMasterFailure("inspect", route, error);
    return {
      ...ownerFailure,
      diagnostic: {
        ...ownerFailure.diagnostic,
        operation: common.operation,
      },
    };
  }

  if (isTargetArtifactFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image plan or evidence is stale or incomplete.",
      hint: "Repair the owning Page Image artifact, then rerun the same checkpoint.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("repair_prerequisite", {
          default: "Rebuild the named current plan or evidence through its owner, then rerun the same checkpoint.",
        }),
      },
    };
  }

  if (TARGET_GATE_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "The current Page Image authorization or review gate is not satisfied.",
      hint: "Complete the owner-issued authorization or Complete Page Review prerequisite before continuing.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("repair_prerequisite", {
          default: "Complete the exact current authorization or review prerequisite, then rerun this operation.",
        }),
      },
    };
  }

  if (isTargetProviderFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Image2 provider request did not complete.",
      hint: "Repair provider configuration or availability, then rerun the authorized operation.",
      diagnostic: {
        ...common,
        category: "provider",
        next: createCliNext("repair_environment", {
          default: "Repair the provider configuration or availability, then rerun the already authorized operation.",
        }),
      },
    };
  }

  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The target Page Image operation failed unexpectedly.",
    hint: "Report the Harness failure; provider configuration is not the repair owner for an unknown cause.",
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Inspect the registered Page Image owner and report the Harness failure before rerunning.",
      }),
    },
  };
}

export function progressiveUnsupportedOption(operation) {
  const allowed = {
    plan: new Set(),
    "artifact-view": new Set(),
    pilot: new Set(["--plan-hash", "--slide-id"]),
    expansion: new Set(["--plan-hash"]),
    authorize: new Set(["--plan-hash", "--batch-hash"]),
    generate: new Set(["--plan-hash", "--batch-hash"]),
    "pilot-review": new Set(["--plan-hash", "--batch-hash"]),
    "pilot-accept": new Set(["--plan-hash", "--batch-hash", "--decision"]),
    review: new Set(["--plan-hash"]),
    accept: new Set(["--plan-hash", "--decision"]),
    reconcile: new Set(["--plan-hash", "--attempt-sha256"]),
  }[operation] || new Set();
  const rejected = [
    "--slides",
    "--base-url",
    "--profile",
    "--prompt",
    "--provider",
    "--output",
    "--path",
    "--force",
    "--retry",
    "--attempt-id",
    "--candidate-id",
    "--review-hash",
    "--reason",
    "--dry-run",
    "--slot",
    "--slide-id",
    "--plan-hash",
    "--batch-hash",
    "--attempt-sha256",
    "--decision",
  ];
  return rejected.find((option) => hasExplicitCliOption(option) && !allowed.has(option)) || null;
}

export function requiredPageImageHash(operation, option, value, label) {
  if (!hasExplicitCliOption(option) || !PAGE_IMAGE_HASH_RE.test(value || "")) {
    emitUsage(`ppt_flow.image2.target.${operation}`, `${option} must be one lowercase SHA-256`, `Pass the exact current ${label} SHA-256 issued by the raw owner.`);
    return null;
  }
  return value;
}

export function requiredPilotSlideIds(opts) {
  const values = Array.isArray(opts.slideId) ? opts.slideId : opts.slideId ? [opts.slideId] : [];
  if (!hasExplicitCliOption("--slide-id") || values.length === 0 || values.some((value) => !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value || ""))) {
    emitUsage("ppt_flow.image2.target.pilot", "At least one exact formal --slide-id is required", "Repeat --slide-id once for each current formal slide ID in the proposed Pilot scope.");
    return null;
  }
  return values;
}

export function requiredProgressiveDecision(operation, value, allowed = ["proceed", "repair", "redirect"]) {
  if (!hasExplicitCliOption("--decision") || !allowed.includes(value)) {
    const options = allowed.length === 2 ? `${allowed[0]} or ${allowed[1]}` : allowed.join(", ");
    emitUsage(`ppt_flow.image2.target.${operation}`, `--decision must be ${options}`, "Record the explicit human decision for the exact current owner-issued evidence.");
    return null;
  }
  return value;
}
