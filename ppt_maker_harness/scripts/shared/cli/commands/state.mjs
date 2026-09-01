import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  createCliNext,
  emitCliError,
  exitCliError,
  registerCliJsonReport,
  setCliOutputMode,
} from "../cli_error.mjs";
import { refreshProgressiveControllerTaskProjection } from "../cli_artifact_view.mjs";
import { emitCurrentProtocolError, emitExecutionRunVersionMismatch, emitUsage } from "../cli_diagnostics.mjs";
import { buildControllerGateContext, collectStatus } from "../cli_status.mjs";
import { resolveRunHarnessBinding } from "../command_support.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE } from "../../run-bundle/production_marker.mjs";
import { commandReport } from "../command_result.mjs";

export async function commandState(runDir, opts) {
// Validate the closed state grammar before resolving a run, importing a
// state owner, or probing source. Mixed forms must be a zero-read/zero-
// write USAGE failure.
if ((opts.validateState && opts.json) || (opts.repairKnownExecutionMismatch && (opts.json || opts.validateState))) {
  emitUsage(
    "ppt_flow.state",
    opts.repairKnownExecutionMismatch
      ? "--repair-known-execution-mismatch is mutually exclusive with --json and --validate-state"
      : "--validate-state is mutually exclusive with --json",
    "Run exactly one closed state operation at a time.",
  );
  process.exitCode = 1;
  return;
}
if (opts.json) setCliOutputMode("json");
const binding = resolveRunHarnessBinding(runDir, "ppt_flow.state.binding");
if (!binding) {
  process.exitCode = 1;
  return;
}
const { resolved, deckDir, harnessDir } = binding;
const {
  readState,
  buildResumeCard,
  repairKnownExecutionMismatch,
  statePath,
} = await import("../../../shared/state/state.mjs");
if (opts.repairKnownExecutionMismatch) {
  const repaired = repairKnownExecutionMismatch(deckDir, { runDir: resolved });
  if (!repaired.ok) {
    if (repaired.code === "execution_run_version_mismatch") {
      emitExecutionRunVersionMismatch("ppt_flow.state.repair-known-execution-mismatch", resolved, repaired);
    } else {
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "The state record is not eligible for the exact known execution-mismatch repair.",
        hint: "Preserve the state bytes and use the named owner action for the reported integrity condition.",
        where: "ppt_flow.state.repair-known-execution-mismatch",
        diagnostic: {
          schema: CLI_DIAGNOSTIC_SCHEMA,
          category: "gate",
          operation: "repair-known-execution-mismatch",
          source: { path: resolved },
          reason: { kind: repaired.code },
          next: createCliNext("inspect", {
            requiresHuman: false,
            inspect: [{ path: resolved }],
            default: "Inspect the retained active-run state before taking another owner-authorized action.",
          }),
        },
      });
    }
    process.exitCode = 1;
    return;
  }
  console.log(`State repair: ${repaired.status}`);
  return;
}
if (opts.validateState) {
  // This closed diagnostic operation always returns its bounded report,
  // including when the failure envelope makes the process exit non-zero.
  setCliOutputMode("json");
  const { inspectWorkflow } = await import("../../../shared/workflow/inspect_workflow.mjs");
  const workflowInspection = inspectWorkflow({ runDir: resolved });
  if (workflowInspection.root_cause.kind === "current-protocol-invalid") {
    emitCurrentProtocolError("ppt_flow.state.validate-state.identity", resolved);
    process.exitCode = 1;
    return;
  }
  const { validateStateReadOnly } = await import("../../../shared/state/state.mjs");
  const result = validateStateReadOnly(deckDir, { runDir: resolved });
  const report = { operation: "validate-state", ...result };
  registerCliJsonReport(report);
  console.log(JSON.stringify(report));
  if (!result.valid) {
    emitCliError({
      code: CLI_ERROR_CODES.STATE_CORRUPTED,
      message: "State validation found bounded record or evidence mismatches.",
      hint: "Use the reported field paths to rebuild artifacts or repair the owning state record through its public workflow.",
      where: "ppt_flow.state.validate-state",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "artifact",
        operation: "validate-state",
        reason: { kind: "state_validation_failed" },
        issues: result.issues,
        next: createCliNext("repair_prerequisite", { default: "Repair the named state or evidence prerequisite, then validate again." }),
      },
    });
    process.exitCode = 1;
  }
  return;
}
// State projection shares the inspection checkpoint with status.  In
// particular, an unsupported source never reaches state/status artifact
// collection, controller indexing, or a route initializer.
const { inspectWorkflow } = await import("../../../shared/workflow/inspect_workflow.mjs");
const workflowInspection = inspectWorkflow({ runDir: resolved });
if (workflowInspection.root_cause.kind === "current-protocol-invalid") {
  emitCurrentProtocolError("ppt_flow.state.identity", resolved);
  process.exitCode = 1;
  return;
}
const s = readState(deckDir, { purpose: "observe", heal: false });
if (s.replacement_required) {
  const currentRepair = s.current_repair_required === true;
  exitCliError({
    code: CLI_ERROR_CODES.STATE_CORRUPTED,
    message: currentRepair
      ? "Authoritative current state has a bounded owner repair."
      : "Authoritative state uses an unsupported protocol.",
    hint: currentRepair
      ? "Retry the owning current-state operation; do not edit YAML or infer a replacement route."
      : "Preserve its bytes; start a fresh explicitly initialized run instead of editing or inferring a route from unsupported state.",
    where: "ppt_flow.state.current-protocol-invalid",
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "artifact",
      operation: "observe-state",
      reason: { kind: currentRepair ? "current_state_repair_required" : "replacement_required" },
      next: createCliNext("repair_prerequisite", {
        default: currentRepair
          ? "Retry the owning current-state operation so it can canonicalize the one-to-one defect; do not edit YAML or infer a route."
          : "Preserve the existing bytes and run ppt_flow init for a fresh current run; do not edit or infer a route from unsupported state.",
      }),
    },
  }, 2);
}
let statusSnapshot = null;
try {
  const st = collectStatus(resolved);
  statusSnapshot = {
    style_master: st.style_master,
    raw_images: st.raw_images,
    expected_slides: st.expected_slides,
    pptx: st.pptx,
    content_gate: st.content_gate,
    visual_gate: st.visual_gate,
  };
} catch {
  statusSnapshot = null;
}
const { buildPlaybookIndex } = await import("../../../shared/state/md_controller_reader.mjs");
const controllerIndex = buildPlaybookIndex(join(harnessDir, "playbook"));
const controllerCtx = await buildControllerGateContext(resolved, { workflowInspection, harnessDir });
const indexedCard = buildResumeCard(s, statusSnapshot, {
  index: controllerIndex,
  ctx: controllerCtx,
});
const taskProjection = await refreshProgressiveControllerTaskProjection(resolved, {
  workflowInspection,
  state: s,
});
const taskProjectionStatus = taskProjection?.status || "not-applicable";
const inspectionSummary = workflowInspection.primary_action.summary || workflowInspection.primary_action.display_label || workflowInspection.primary_action.action_id;
const inspectionNext = workflowInspection.primary_action.command || workflowInspection.primary_action.display_label || `${workflowInspection.primary_action.owner}:${workflowInspection.primary_action.action_id}`;

if (opts.json) {
  const report = commandReport({
    operation: "state",
    effect: { task_projection: taskProjectionStatus },
    fields: {
      durable_state: s,
      production_identity: indexedCard.production_identity,
      pipeline: s.pipeline || PAGE_IMAGE_WORKFLOW_PIPELINE,
      state_present: existsSync(statePath(deckDir)),
      playbook: indexedCard.playbook,
      current_node: indexedCard.current_node,
      gates: indexedCard.gates,
      node_status: indexedCard.node_status,
      waiting_for: indexedCard.waiting_for,
      note: indexedCard.note,
      completed_nodes: indexedCard.completed_nodes,
      pending_nodes: indexedCard.pending_nodes,
      eligible_candidates: indexedCard.eligible_candidates,
      workflow_summary: inspectionSummary,
      suggested_next: inspectionNext,
      workflow_inspection: workflowInspection,
      task_projection: { status: taskProjectionStatus },
    },
  });
  registerCliJsonReport(report);
  console.log(JSON.stringify(report, null, 2));
  return;
}
console.log("Playbook: " + (indexedCard.playbook || "(none)"));
console.log("Current:  " + (indexedCard.current_node || "(none)"));
console.log("Status:   " + (indexedCard.node_status || "(none)"));
if (indexedCard.waiting_for) console.log("Waiting:  " + indexedCard.waiting_for);
if (indexedCard.note) console.log("Note:     " + indexedCard.note);
console.log("Done:     " + indexedCard.completed_nodes.join(", "));
console.log("Pending:  " + indexedCard.pending_nodes.join(", "));
if (indexedCard.eligible_candidates.length > 1) {
  console.log("Eligible: " + indexedCard.eligible_candidates.join(", "));
}
console.log(
  "Gates:    content=" +
    (s.gates?.content || "pending") +
    " visual=" +
    (s.gates?.visual || "pending")
);
console.log("Summary:  " + inspectionSummary);
console.log("Next:     " + inspectionNext);
console.log("Task projection: " + taskProjectionStatus);
}
