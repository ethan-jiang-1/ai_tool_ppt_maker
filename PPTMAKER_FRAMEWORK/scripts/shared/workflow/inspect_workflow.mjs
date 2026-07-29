import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { checkBundle, deckRoot } from "../run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE, isTargetWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { inspectTargetPageAuthorityState, resolveRunProductionAdapter, validateStateReadOnly } from "../state/state.mjs";

export const WORKFLOW_INSPECTION_SCHEMA = "pptmaker-workflow-inspection-v1";

const sha256 = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const sourceReadyByInspection = new WeakMap();

function ownerAction(owner, actionId, kind, requiresHuman, summary, command = null) {
  return Object.freeze({
    owner,
    action_id: actionId,
    kind,
    requires_human: requiresHuman,
    summary,
    ...(command ? { command } : {}),
  });
}

function report({ runDir, posture, rootCause, primaryAction, evidenceSummary, sourceReady = false }) {
  const inspection = Object.freeze({
    schema: WORKFLOW_INSPECTION_SCHEMA,
    checkpoint: Object.freeze({ run_dir: resolve(runDir), facts_sha256: sha256({ posture, rootCause, evidenceSummary }) }),
    posture,
    root_cause: Object.freeze(rootCause),
    primary_action: primaryAction,
    observations: Object.freeze([]),
    continuation: null,
    protected_invariant: "only Page Authority evidence may drive current production",
    evidence_summary: Object.freeze(evidenceSummary),
  });
  sourceReadyByInspection.set(inspection, sourceReady === true);
  return inspection;
}

/** Return the source-readiness fact from this exact read-only inspection checkpoint. */
export function isWorkflowInspectionSourceReady(inspection) {
  return sourceReadyByInspection.get(inspection) === true;
}

function unsupportedProtocolResult(runDir, marker = null) {
  return report({
    runDir,
    posture: "hard-stop",
    rootCause: { owner: "production-protocol", kind: "unsupported-protocol" },
    primaryAction: ownerAction("production-protocol", "export-unsupported-protocol", "export", false, "Export this unsupported source/state pair without modifying it."),
    evidenceSummary: { pipeline: marker?.branch ?? null, mode: null, workflow: null },
  });
}

function targetWorkflowOwner(workflow, actionId) {
  if (["initialize_target_source_state", "repair_target_source_state"].includes(actionId)) return "state";
  if (actionId === "rebuild_target_source_receipt") return "01-content";
  if (["authorize_target_raw_work", "record_target_raw_evidence"].includes(actionId)) return "shared-raw";
  if (actionId === "publish_target_final_manifest") return workflow === "framed" ? "03-framed-image" : "04-pure-image";
  if (actionId === "deliver_target_final_manifest") return "05-delivery";
  return "state";
}

function targetWorkflowResult(runDir, route) {
  const target = inspectTargetPageAuthorityState(deckRoot(runDir), { runDir });
  const workflow = route.workflow;
  const sourceReady = target.ok || ![
    "TARGET_STATE_INITIALIZATION_REQUIRED",
    "TARGET_SOURCE_STATE_IDENTITY_MISMATCH",
    "TARGET_SOURCE_RECEIPT_STALE",
  ].includes(target.code);
  const evidenceSummary = {
    pipeline: route.policy.pipeline,
    mode: route.mode,
    workflow,
    source_epoch: target.source_epoch ?? null,
    target_evidence: target.ok ? "current" : target.code,
  };
  if (target.ok) {
    return report({
      runDir,
      posture: "complete",
      rootCause: { owner: "05-delivery", kind: "target-delivery-complete" },
      primaryAction: ownerAction("05-delivery", "complete-target-delivery", "complete", false, "Target delivery evidence is complete."),
      evidenceSummary,
      sourceReady,
    });
  }
  const actionId = target.next_action || "repair_target_source_state";
  const owner = targetWorkflowOwner(workflow, actionId);
  const isConfirm = target.kind === "confirm";
  return report({
    runDir,
    posture: isConfirm ? "confirm" : "hard-stop",
    rootCause: { owner, kind: target.code || "target-evidence-unavailable" },
    primaryAction: ownerAction(
      owner,
      actionId,
      isConfirm ? "review" : "repair",
      isConfirm,
      "Follow the exact target workflow prerequisite.",
    ),
    evidenceSummary,
    sourceReady,
  });
}

function currentPageAuthorityMarker(runDir) {
  try {
    const marker = probeProductionMarker(readFileSync(join(runDir, "slide-specifications.md")), {
      source: "slide-specifications.md",
    });
    return marker;
  } catch {
    return null;
  }
}

/** Read-only v2 Page Authority lifecycle projection. */
export function inspectWorkflow({ runDir } = {}) {
  const resolved = resolve(runDir || "");
  const marker = currentPageAuthorityMarker(resolved);
  if (isTargetWorkflowSelectionPending(marker)) {
    const layoutIssues = checkBundle(resolved, false)
      .filter((issue) => issue !== TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
    if (layoutIssues.length) {
      return report({
        runDir: resolved,
        posture: "hard-stop",
        rootCause: { owner: "run-bundle-layout", kind: "layout-invalid", detail: layoutIssues[0] },
        primaryAction: ownerAction("run-bundle-layout", "repair-layout", "repair", false, "Repair the reported bundle-layout issue."),
        evidenceSummary: { pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, mode: null, workflow: null },
      });
    }
    return report({
      runDir: resolved,
      posture: "confirm",
      rootCause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
      primaryAction: ownerAction("01-content", "select-target-page-authority-workflow", "select", true, "Select framed or pure for this target version before source validation or provider work."),
      evidenceSummary: { pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, mode: null, workflow: null },
    });
  }
  if (!marker || marker.branch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) return unsupportedProtocolResult(resolved, marker);
  const layoutIssues = checkBundle(resolved, false);
  if (layoutIssues.length) {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "run-bundle-layout", kind: "layout-invalid", detail: layoutIssues[0] },
      primaryAction: ownerAction("run-bundle-layout", "repair-layout", "repair", false, "Repair the reported bundle-layout issue."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }
  const deckDir = deckRoot(resolved);
  const validation = validateStateReadOnly(deckDir, { runDir: resolved });
  if (!validation.valid) {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "state", kind: "state-validation", detail: validation.issues[0]?.path || "state.yaml" },
      primaryAction: ownerAction("state", "validate-state", "repair", false, "Repair authoritative Page Authority state."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (!route.ok) {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "production-mode", kind: route.code || "current-route-unavailable" },
      primaryAction: ownerAction("production-mode", "repair-current-route", "repair", false, "Repair the exact Page Authority source/state pair."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  return targetWorkflowResult(resolved, route);
}
