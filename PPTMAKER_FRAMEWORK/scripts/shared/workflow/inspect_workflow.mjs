import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { checkBundle, deckRoot } from "../run-bundle/bundle_layout.mjs";
import { inspectLegacyProtocol } from "../state/legacy_protocol_adoption.mjs";
import { inspectPageAuthorityDeliveryEvidence } from "../state/page_authority_delivery_evidence.mjs";
import {
  inspectPageAuthorityDeliveryReview,
  readState,
  resolveRunProductionAdapter,
  validateStateReadOnly,
} from "../state/state.mjs";

export const WORKFLOW_INSPECTION_SCHEMA = "pptmaker-workflow-inspection-v1";

const sha256 = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");

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

function report({ runDir, posture, rootCause, primaryAction, evidenceSummary }) {
  return Object.freeze({
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

/** Read-only Page Authority lifecycle or bounded historical-adoption projection. */
export function inspectWorkflow({ runDir } = {}) {
  const resolved = resolve(runDir || "");
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
  if (protocol.classification !== "current") return legacyResult(resolved, protocol);

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
  if (!route.ok || route.adapter !== "page-authority-image2") {
    return report({
      runDir: resolved,
      posture: "hard-stop",
      rootCause: { owner: "production-mode", kind: route.code || "current-route-unavailable" },
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

  if (!delivery.ok) {
    return report({
      runDir: resolved,
      posture: delivery.kind === "confirm" ? "confirm" : "hard-stop",
      rootCause: { owner: "page-authority", kind: delivery.code || "evidence-unavailable" },
      primaryAction: ownerAction("page-authority", delivery.next_action || (delivery.kind === "confirm" ? "confirm_raw_review" : "repair_page_authority_evidence"), delivery.kind === "confirm" ? "review" : "repair", delivery.kind === "confirm", "Follow the current Page Authority evidence action."),
      evidenceSummary,
    });
  }
  if (review.freshness !== "current" || review.decision !== "proceed") {
    return report({
      runDir: resolved,
      posture: "confirm",
      rootCause: { owner: "page-authority-delivery-review", kind: "delivery-review-pending" },
      primaryAction: ownerAction("page-authority-delivery-review", "review-delivery", "review", true, "Record the Page Authority delivery decision."),
      evidenceSummary,
    });
  }
  return report({
    runDir: resolved,
    posture: "complete",
    rootCause: { owner: "page-authority", kind: "delivery-complete" },
    primaryAction: ownerAction("page-authority", "complete-delivery", "complete", false, "Page Authority delivery evidence is complete."),
    evidenceSummary,
  });
}
