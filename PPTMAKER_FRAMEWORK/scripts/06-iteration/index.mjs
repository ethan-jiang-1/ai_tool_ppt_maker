import {
  FRAMED_IMAGE_WORKFLOW,
  classifyFramedRefresh,
} from "../03-framed-image/index.mjs";
import {
  PURE_IMAGE_WORKFLOW,
  classifyPureRefresh,
} from "../04-pure-image/index.mjs";

export const TARGET_REFRESH_ROUTING_SCHEMA = "page-authority-target-refresh-route-v1";
export const TARGET_REFRESH_CHANGE_KINDS = Object.freeze(["source", "notes-only"]);

export class TargetIterationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "TargetIterationError";
    this.code = code;
  }
}

function requireTargetReceipt(receipt, label) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" ||
    ![FRAMED_IMAGE_WORKFLOW, PURE_IMAGE_WORKFLOW].includes(receipt.workflow) ||
    !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new TargetIterationError("target_receipt_required", `${label} must be a current target source receipt`);
  }
  return receipt;
}

function requireBoundWorkflow(workflow, receipt) {
  if (![FRAMED_IMAGE_WORKFLOW, PURE_IMAGE_WORKFLOW].includes(workflow)) {
    throw new TargetIterationError("target_workflow_required", "target iteration requires the state-bound framed or pure workflow");
  }
  if (receipt.workflow !== workflow) {
    throw new TargetIterationError("target_workflow_state_mismatch", "target iteration must begin from the state-bound source workflow");
  }
  return workflow;
}

function sameStableOrder(previousReceipt, nextReceipt) {
  return previousReceipt.slides.map((slide) => slide.slide_id).join("\n") ===
    nextReceipt.slides.map((slide) => slide.slide_id).join("\n");
}

function route({ workflow, kind, owner, providerRequired, nextAction, reason = null, delivery = false, structural = false }) {
  return Object.freeze({
    schema: TARGET_REFRESH_ROUTING_SCHEMA,
    workflow,
    kind,
    owner,
    provider_required: providerRequired,
    next_action: nextAction,
    ...(reason ? { reason } : {}),
    ...(delivery ? { delivery_owner: "05-delivery" } : {}),
    ...(structural ? { requires_structural_preview: true, provider_calls_before_apply: 0 } : {}),
  });
}

/**
 * Select one legal target refresh path from source-owned change classification
 * and exact workflow evidence. This router never submits provider work or
 * creates derived artifacts; the selected owner performs its own operation.
 */
export function classifyTargetRefresh({
  workflow,
  previousReceipt,
  nextReceipt,
  changeKind = "source",
  rawWorkPlan = null,
  nextRawWorkPlan = null,
  acceptedRawEvidence = null,
} = {}) {
  const previous = requireTargetReceipt(previousReceipt, "previousReceipt");
  const next = requireTargetReceipt(nextReceipt, "nextReceipt");
  const boundWorkflow = requireBoundWorkflow(workflow, previous);
  if (!TARGET_REFRESH_CHANGE_KINDS.includes(changeKind)) {
    throw new TargetIterationError("target_change_kind_invalid", "changeKind must be source or notes-only");
  }

  if (next.workflow !== boundWorkflow) {
    return route({
      workflow: boundWorkflow,
      kind: "workflow_switch",
      owner: "01-content",
      providerRequired: false,
      nextAction: "preview_target_structural_vnext",
      structural: true,
    });
  }
  if (!sameStableOrder(previous, next)) {
    return route({
      workflow: boundWorkflow,
      kind: "structural_versioning",
      owner: "01-content",
      providerRequired: false,
      nextAction: "preview_target_structural_vnext",
      structural: true,
    });
  }
  if (changeKind === "notes-only") {
    return route({
      workflow: boundWorkflow,
      kind: "notes_only_delivery",
      owner: "05-delivery",
      providerRequired: false,
      nextAction: "refresh_target_notes_delivery",
      delivery: true,
    });
  }

  if (boundWorkflow === FRAMED_IMAGE_WORKFLOW) {
    const classified = classifyFramedRefresh({
      previousReceipt: previous,
      nextReceipt: next,
      rawWorkPlan,
      nextRawWorkPlan,
      acceptedRawEvidence,
    });
    if (classified.kind === "current") {
      return route({ workflow: boundWorkflow, kind: "current", owner: "03-framed-image", providerRequired: false, nextAction: "none" });
    }
    if (classified.kind === "local_compose") {
      return route({
        workflow: boundWorkflow,
        kind: "framed_local_compose",
        owner: "03-framed-image",
        providerRequired: false,
        nextAction: "compose_framed_final_then_deliver",
        delivery: true,
      });
    }
    return route({
      workflow: boundWorkflow,
      kind: "framed_rebuild",
      owner: "03-framed-image",
      providerRequired: true,
      nextAction: classified.next_action || "authorize_and_rebuild_framed_raw",
      reason: classified.reason || null,
      delivery: true,
    });
  }

  const classified = classifyPureRefresh({ previousReceipt: previous, nextReceipt: next });
  if (classified.kind === "current") {
    return route({ workflow: boundWorkflow, kind: "current", owner: "04-pure-image", providerRequired: false, nextAction: "none" });
  }
  return route({
    workflow: boundWorkflow,
    kind: "pure_rebuild",
    owner: "04-pure-image",
    providerRequired: true,
    nextAction: "authorize_and_rebuild_pure_raw",
    delivery: true,
  });
}
