import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { checkBundle, deckRoot } from "../run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_IMAGE2_PIPELINE, PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE, isTargetWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { inspectLegacyProtocol } from "../state/legacy_protocol_adoption.mjs";
import { inspectPageAuthorityDeliveryEvidence } from "../state/page_authority_delivery_evidence.mjs";
import {
  inspectPageAuthorityDeliveryReview,
  inspectTargetPageAuthorityState,
  readState,
  resolveRunProductionAdapter,
  validateStateReadOnly,
} from "../state/state.mjs";

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

function legacyResult(runDir, protocol) {
  const recognized = protocol.classification === "recognized-legacy";
  return report({
    runDir,
    posture: recognized ? "guide" : "hard-stop",
    rootCause: { owner: "legacy-protocol", kind: protocol.classification },
    primaryAction: recognized
      ? ownerAction(
        "legacy-protocol",
        "prepare-legacy-adoption",
        "continue",
        false,
        "Prepare the provider-free Page Authority adoption candidate.",
        `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state ${JSON.stringify(resolve(runDir))} --prepare-legacy-adoption`,
      )
      : ownerAction("legacy-protocol", "repair-or-export-unsupported-protocol", "repair", false, "Repair or export the exact source/state pair before continuing."),
    evidenceSummary: { pipeline: null, mode: null, legacy_protocol: protocol },
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

/** Read-only Page Authority lifecycle or bounded historical-adoption projection. */
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
  if (!marker || ![PAGE_AUTHORITY_IMAGE2_PIPELINE, PAGE_AUTHORITY_IMAGE2_V2_PIPELINE].includes(marker.branch)) {
    const protocol = inspectLegacyProtocol(resolved);
    if (protocol.classification === "recognized-legacy") return legacyResult(resolved, protocol);
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
    return legacyResult(resolved, protocol);
  }
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

  if (route.adapter === "page-authority-image2-v2") return targetWorkflowResult(resolved, route);

  if (route.adapter !== "page-authority-image2") {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "production-mode", kind: "current-route-unavailable" },
      primaryAction: ownerAction("production-mode", "repair-current-route", "repair", false, "Repair the exact Page Authority source/state pair."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  const state = readState(deckDir, { purpose: "observe", heal: false, runDir: resolved });
  const runVersion = basename(resolved);
  const sourceEpoch = state.production_mode?.by_version?.[`3_versions/${runVersion}`]?.source_epoch;
  const delivery = inspectPageAuthorityDeliveryEvidence(resolved, { sourceEpoch });
  const review = inspectPageAuthorityDeliveryReview(state, {
    runVersion,
    evidence: delivery.ok ? delivery.evidence : null,
  });
  const evidenceSummary = {
    pipeline: route.policy.pipeline,
    mode: route.mode,
    raw_review: delivery.raw_review || null,
    delivery: delivery.ok ? "current" : delivery.code,
    delivery_review: review,
  };
  const sourceReady = delivery.ok || !["state", "layout", "source-receipt"].includes(delivery.stage);

  if (!delivery.ok) {
    return report({
      runDir: resolved,
      posture: delivery.kind === "confirm" ? "confirm" : "hard-stop",
      rootCause: { owner: "page-authority", kind: delivery.code || "evidence-unavailable" },
      primaryAction: ownerAction("page-authority", delivery.next_action || (delivery.kind === "confirm" ? "confirm_raw_review" : "repair_page_authority_evidence"), delivery.kind === "confirm" ? "review" : "repair", delivery.kind === "confirm", "Follow the current Page Authority evidence action."),
      evidenceSummary,
      sourceReady,
    });
  }
  if (review.freshness !== "current" || review.decision !== "proceed") {
    return report({
      runDir: resolved,
      posture: "confirm",
      rootCause: { owner: "page-authority-delivery-review", kind: "delivery-review-pending" },
      primaryAction: ownerAction("page-authority-delivery-review", "review-delivery", "review", true, "Record the Page Authority delivery decision."),
      evidenceSummary,
      sourceReady,
    });
  }
  return report({
    runDir: resolved,
    posture: "complete",
    rootCause: { owner: "page-authority", kind: "delivery-complete" },
    primaryAction: ownerAction("page-authority", "complete-delivery", "complete", false, "Page Authority delivery evidence is complete."),
    evidenceSummary,
    sourceReady,
  });
}
