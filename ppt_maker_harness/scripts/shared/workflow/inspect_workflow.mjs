import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { checkBundle, deckRoot } from "../run-bundle/bundle_layout.mjs";
import { PAGE_IMAGE_WORKFLOW_V1_PIPELINE, PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE, isPageImageWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { evaluateReplacementIdentity } from "../run-bundle/page_image_workflow_identity.mjs";
import {
  inspectCurrentPageImageTaskMandate,
  readTargetProgressiveControllerDecision,
  readTargetProgressiveHandoff,
  resolveRunProductionAdapter,
  validateStateReadOnly,
} from "../state/state.mjs";
import { inspectProgressiveRawLifecycle } from "../image2/page_image_progressive_raw_owner.mjs";
import { resolveAcceptedStyleMasterReference } from "../image2/style_master_plan.mjs";
import {
  inspectFramedProgressiveLocalRebind,
  readFramedProgressiveTargetPlanCandidate,
} from "../../03-framed-image/index.mjs";
import {
  readPureProgressiveTargetPlanCandidate,
} from "../../04-pure-image/index.mjs";

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

function progressiveOwnerAction(rawAction) {
  return Object.freeze({
    owner: rawAction?.owner || "progressive-raw-owner",
    action_id: rawAction?.action_id || "rebuild_progressive_raw_work",
    kind: rawAction?.kind || "repair",
    requires_human: rawAction?.requires_human === true,
    summary: rawAction?.summary || "Repair the exact progressive raw-owner facts.",
    ...(rawAction?.plan_hash ? { plan_hash: rawAction.plan_hash } : {}),
    ...(rawAction?.batch_hash ? { batch_hash: rawAction.batch_hash } : {}),
    ...(rawAction?.attempt_sha256 ? { attempt_sha256: rawAction.attempt_sha256 } : {}),
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
    protected_invariant: "only Page Image evidence may drive current production",
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
    primaryAction: ownerAction("production-protocol", "unsupported-protocol/export", "export", false, "Export this unsupported source/state pair without modifying it."),
    evidenceSummary: { pipeline: marker?.branch ?? null, mode: null, workflow: null },
  });
}

function progressiveAdapter(workflow) {
  if (workflow === "framed") {
    return Object.freeze({
      readPlanCandidate: readFramedProgressiveTargetPlanCandidate,
      inspectLocalRebind: inspectFramedProgressiveLocalRebind,
    });
  }
  if (workflow === "pure") {
    return Object.freeze({
      readPlanCandidate: readPureProgressiveTargetPlanCandidate,
    });
  }
  return null;
}

/**
 * Project only raw-owner facts. Adapter reads below are source/style validation
 * preflights; they do not materialize source, head, state, grants, attempts,
 * generated projections, or providers.
 */
function progressiveTargetWorkflowResult(runDir, route) {
  const workflow = route.workflow;
  const taskMandate = inspectCurrentPageImageTaskMandate(deckRoot(runDir), { runDir, workflow });
  const direct = inspectProgressiveRawLifecycle({ runDir, workflow, task_mandate: taskMandate });
  const baseSummary = {
    pipeline: route.policy.pipeline,
    mode: route.mode,
    workflow,
  };
  if (!direct.ok) {
    return report({
      runDir,
      posture: "hard-stop",
      rootCause: { owner: "progressive-raw-owner", kind: direct.code || "progressive-raw-owner-invalid" },
      primaryAction: progressiveOwnerAction(direct.next_action),
      evidenceSummary: { ...baseSummary, progressive: "invalid" },
      sourceReady: true,
    });
  }
  // A persisted submitted attempt is recoverability truth even if the source
  // has drifted, so it takes precedence over adapter currentness checks.
  if (direct.primary_action?.action_id === "reconcile_progressive_raw_attempt") {
    return report({
      runDir,
      posture: "hard-stop",
      rootCause: { owner: "progressive-raw-owner", kind: "submitted-outcome-unresolved" },
      primaryAction: progressiveOwnerAction(direct.primary_action),
      evidenceSummary: { ...baseSummary, progressive: "reconciliation-required", progress: direct.progress || null },
      sourceReady: true,
    });
  }

  const adapter = progressiveAdapter(workflow);
  if (!adapter) return unsupportedProtocolResult(runDir);
  let candidate = null;
  let expectedPlan = null;
  try {
    candidate = adapter.readPlanCandidate(runDir, {
      sourceEpoch: direct.plan?.source_epoch ?? null,
      taskMandate,
    });
    expectedPlan = candidate.progressive_raw_work_plan || null;
    // A missing progressive head still needs the accepted Style Master
    // prerequisite checked before inspection can offer plan creation.
    if (!direct.plan) {
      resolveAcceptedStyleMasterReference({
        runDir: candidate.run_dir,
        deckDir: candidate.deck_dir,
        receipt: candidate.receipt,
      });
    }
  } catch (error) {
    const styleRequired = /^style_master_(?:selection|required|stale|scope)/.test(error?.code || "");
    return report({
      runDir,
      posture: styleRequired ? "hard-stop" : "hard-stop",
      rootCause: { owner: styleRequired ? "style-master" : "selected-workflow-adapter", kind: error?.code || "source-or-style-preflight-invalid" },
      primaryAction: ownerAction(
        styleRequired ? "style-master" : workflow === "framed" ? "03-framed-image" : "04-pure-image",
        styleRequired ? "plan-style-master" : "repair-progressive-source-binding",
        "repair",
        false,
        "Repair the earliest source, Style Master, or selected-workflow binding before progressive raw work.",
      ),
      evidenceSummary: { ...baseSummary, progressive: direct.plan ? "stale" : "plan-prerequisite" },
      sourceReady: !styleRequired,
    });
  }

  // Framed keeps its narrow, provider-free header-overlay path. It is only
  // considered after unresolved submission precedence and only from direct
  // accepted raw-owner evidence plus the existing retention validator.
  if (direct.plan && direct.evidence?.accepted_raw_evidence_sha256 &&
    expectedPlan?.sha256 !== direct.plan.plan_hash && typeof adapter.inspectLocalRebind === "function") {
    try {
      const localRebind = adapter.inspectLocalRebind(runDir, {
        planHash: direct.plan.plan_hash,
        candidate,
      });
      if (localRebind.available && localRebind.classification?.kind === "local_compose") {
        const evidenceSummary = {
          ...baseSummary,
          progressive: "framed-local-rebind",
          plan_hash: direct.plan.plan_hash,
          progress: direct.progress || null,
          evidence: direct.evidence || null,
        };
        return report({
          runDir,
          posture: "guide",
          rootCause: { owner: "03-framed-image", kind: "framed-local-rebind-ready" },
          primaryAction: ownerAction(
            "03-framed-image",
            "refresh_framed_text",
            "refresh",
            false,
            "Refresh the validated Framed header overlay through its provider-free local owner.",
          ),
          evidenceSummary,
          sourceReady: true,
        });
      }
    } catch (error) {
      return report({
        runDir,
        posture: "hard-stop",
        rootCause: { owner: "03-framed-image", kind: error?.code || "framed-local-rebind-invalid" },
        primaryAction: ownerAction(
          "03-framed-image",
          "repair-progressive-source-binding",
          "repair",
          false,
          "Repair the earliest Framed local-rebind source or evidence binding before progressive work.",
        ),
        evidenceSummary: { ...baseSummary, progressive: "framed-local-rebind-invalid" },
        sourceReady: true,
      });
    }
  }

  const current = inspectProgressiveRawLifecycle({
    runDir,
    workflow,
    expected_plan: expectedPlan,
    task_mandate: taskMandate,
  });
  if (!current.ok) {
    return report({
      runDir,
      posture: "hard-stop",
      rootCause: { owner: "progressive-raw-owner", kind: current.code || "progressive-raw-owner-invalid" },
      primaryAction: progressiveOwnerAction(current.next_action),
      evidenceSummary: { ...baseSummary, progressive: "invalid" },
      sourceReady: true,
    });
  }
  const handoff = current.plan ? readTargetProgressiveHandoff(deckRoot(runDir), { runDir }) : null;
  const evidenceSummary = {
    ...baseSummary,
    progressive: current.plan ? "current" : "plan-required",
    plan_hash: current.plan?.plan_hash || null,
    progress: current.progress || null,
    latest_batch: current.latest_batch || null,
    evidence: current.evidence || null,
    controller_handoffs: current.controller_handoffs || null,
  };
  const acceptedRawCurrent = current.evidence?.accepted_raw_evidence_sha256 &&
    handoff?.accepted_raw_evidence_sha256 === current.evidence.accepted_raw_evidence_sha256;
  if (acceptedRawCurrent && handoff?.final_manifest_sha256 && handoff.delivery_receipt_sha256) {
    const deliveryDecision = readTargetProgressiveControllerDecision(deckRoot(runDir), {
      runDir,
      nodeId: "review-target-page-image-delivery",
    });
    if (deliveryDecision?.kind === "user" && deliveryDecision.value === "proceed") {
      return report({
        runDir,
        posture: "complete",
        rootCause: { owner: "05-delivery", kind: "target-delivery-complete" },
        primaryAction: ownerAction("05-delivery", "complete-target-delivery", "complete", false, "Target progressive delivery evidence and the current delivery decision are complete."),
        evidenceSummary: { ...evidenceSummary, delivery_decision: deliveryDecision },
        sourceReady: true,
      });
    }
    if (deliveryDecision?.kind === "user" && ["repair", "redirect"].includes(deliveryDecision.value)) {
      return report({
        runDir,
        posture: "hard-stop",
        rootCause: { owner: "05-delivery", kind: "delivery-decision-repair" },
        primaryAction: ownerAction("05-delivery", "repair-target-page-image-delivery", "repair", false, "Apply the owner-issued delivery repair before recording another delivery decision."),
        evidenceSummary: { ...evidenceSummary, delivery_decision: deliveryDecision },
        sourceReady: true,
      });
    }
    return report({
      runDir,
      posture: "confirm",
      rootCause: { owner: "05-delivery", kind: "review-target-page-image-delivery" },
      primaryAction: ownerAction("05-delivery", "review-target-page-image-delivery", "confirm", true, "Review the current selected-workflow final projection, PPTX, and notes receipt."),
      evidenceSummary: { ...evidenceSummary, delivery_decision: deliveryDecision },
      sourceReady: true,
    });
  }
  if (acceptedRawCurrent && handoff?.final_manifest_sha256) {
    return report({
      runDir,
      posture: "guide",
      rootCause: { owner: "05-delivery", kind: "deliver-target-page-image" },
      primaryAction: ownerAction("05-delivery", "deliver-target-page-image", "deliver", false, "Assemble the current selected-workflow final manifest through shared delivery."),
      evidenceSummary,
      sourceReady: true,
    });
  }
  const rawAction = current.primary_action;
  return report({
    runDir,
    posture: rawAction?.requires_human ? "confirm" : rawAction?.kind === "repair" ? "hard-stop" : "guide",
    rootCause: { owner: rawAction?.owner || "progressive-raw-owner", kind: rawAction?.action_id || "progressive-raw-action" },
    primaryAction: progressiveOwnerAction(rawAction),
    evidenceSummary,
    sourceReady: true,
  });
}

function currentPageImageMarker(runDir) {
  try {
    const sourcePath = join(runDir, "slide-specifications.md");
    const sourceBytes = readFileSync(sourcePath);
    const identity = evaluateReplacementIdentity({ sourceBytes, sourcePath });
    if (!identity.ok) return { branch: identity.actual || "unsupported", identity };
    const marker = probeProductionMarker(sourceBytes, {
      source: "slide-specifications.md",
    });
    return marker;
  } catch {
    return null;
  }
}

/** Read-only v2 Page Image lifecycle projection. */
export function inspectWorkflow({ runDir } = {}) {
  const resolved = resolve(runDir || "");
  const marker = currentPageImageMarker(resolved);
  if (marker?.identity?.ok === false) return unsupportedProtocolResult(resolved, { branch: marker.identity.actual || null });
  const deckDir = deckRoot(resolved);
  const statePath = join(deckDir, "_state", "state.yaml");
  if (existsSync(statePath)) {
    const identity = evaluateReplacementIdentity({ stateBytes: readFileSync(statePath), statePath });
    if (!identity.ok) return unsupportedProtocolResult(resolved, { branch: identity.actual || null });
  }
  if (isPageImageWorkflowSelectionPending(marker)) {
    const layoutIssues = checkBundle(resolved, false)
      .filter((issue) => issue !== PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
    if (layoutIssues.length) {
      return report({
        runDir: resolved,
        posture: "hard-stop",
        rootCause: { owner: "run-bundle-layout", kind: "layout-invalid", detail: layoutIssues[0] },
        primaryAction: ownerAction("run-bundle-layout", "repair-layout", "repair", false, "Repair the reported bundle-layout issue."),
        evidenceSummary: { pipeline: PAGE_IMAGE_WORKFLOW_V1_PIPELINE, mode: null, workflow: null },
      });
    }
    return report({
      runDir: resolved,
      posture: "confirm",
      rootCause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
      primaryAction: ownerAction("01-content", "select-target-page-image-workflow", "select", true, "Select framed or pure for this target version before source validation or provider work."),
      evidenceSummary: { pipeline: PAGE_IMAGE_WORKFLOW_V1_PIPELINE, mode: null, workflow: null },
    });
  }
  if (!marker || marker.branch !== PAGE_IMAGE_WORKFLOW_V1_PIPELINE) return unsupportedProtocolResult(resolved, marker);
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
  const validation = validateStateReadOnly(deckDir, { runDir: resolved });
  if (!validation.valid) {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "state", kind: "state-validation", detail: validation.issues[0]?.path || "state.yaml" },
      primaryAction: ownerAction("state", "validate-state", "repair", false, "Repair authoritative Page Image state."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (!route.ok) {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "production-mode", kind: route.code || "current-route-unavailable" },
      primaryAction: ownerAction("production-mode", "repair-current-route", "repair", false, "Repair the exact Page Image source/state pair."),
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  return progressiveTargetWorkflowResult(resolved, route);
}
