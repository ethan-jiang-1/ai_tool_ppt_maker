import {
  validateAcceptedRawEvidenceForFinalization,
  validateRawWorkPlanForFinalization,
} from "../image2/page_image_artifacts.mjs";

export const PAGE_IMAGE_INVALIDATION_SCHEMA = "page-image-invalidation-v1";
export const PAGE_IMAGE_INVALIDATION_CHANGE_KINDS = Object.freeze(["source", "notes-only"]);

const WORKFLOWS = new Set(["framed", "pure"]);
const SHA256_RE = /^[0-9a-f]{64}$/;
const BINDING_FIELDS = Object.freeze([
  "compiled_provider_input_sha256",
  "provider_content_sha256",
  "visual_selection_sha256",
  "style_master_selection_sha256",
  "generation_profile_sha256",
  "header_policy_sha256",
  "local_header_profile_sha256",
  "protected_geometry_sha256",
]);
const BINDING_DRIFT_REASONS = Object.freeze({
  compiled_provider_input_sha256: "compiled_provider_input_drift",
  provider_content_sha256: "provider_content_drift",
  visual_selection_sha256: "visual_selection_drift",
  style_master_selection_sha256: "style_master_selection_drift",
  generation_profile_sha256: "generation_profile_drift",
  header_policy_sha256: "header_policy_drift",
  local_header_profile_sha256: "local_header_profile_drift",
  protected_geometry_sha256: "protected_geometry_drift",
});

export class PageImageInvalidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageInvalidationError";
    this.code = code;
  }
}

function requireReceipt(receipt, label) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) ||
    receipt.schema !== "page-image-workflow-source-v1" ||
    receipt.pipeline !== "page-image-workflow-v1" ||
    !WORKFLOWS.has(receipt.workflow) || !SHA256_RE.test(receipt.source_sha256 || "") ||
    !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new PageImageInvalidationError("page_image_invalidation_receipt_invalid", `${label} must be a current Page Image Workflow receipt`);
  }
  const slideIds = receipt.slides.map((slide, index) => {
    if (!slide || typeof slide !== "object" || Array.isArray(slide) ||
      typeof slide.slide_id !== "string" || !slide.slide_id ||
      slide.position !== index + 1 || Object.hasOwn(slide, "workflow") ||
      Object.hasOwn(slide, "authority")) {
      throw new PageImageInvalidationError("page_image_invalidation_receipt_invalid", `${label} must contain ordered stable slide IDs with no per-slide workflow`);
    }
    return slide.slide_id;
  });
  if (new Set(slideIds).size !== slideIds.length) {
    throw new PageImageInvalidationError("page_image_invalidation_receipt_invalid", `${label} contains duplicate stable slide IDs`);
  }
  return Object.freeze({ receipt, slide_ids: Object.freeze(slideIds) });
}

function sameOrder(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function classification(workflow, kind, {
  providerRequired,
  nextAction,
  reason = null,
} = {}) {
  return Object.freeze({
    schema: PAGE_IMAGE_INVALIDATION_SCHEMA,
    workflow,
    kind,
    provider_required: providerRequired,
    next_action: nextAction,
    ...(reason ? { reason } : {}),
  });
}

function validPlanForReceipt(plan, receiptFacts) {
  const checked = validateRawWorkPlanForFinalization(plan);
  if (!checked.ok || plan.workflow !== receiptFacts.receipt.workflow ||
    plan.source_receipt_sha256 !== receiptFacts.receipt.source_sha256 ||
    !sameOrder(plan.ordered_slide_ids, receiptFacts.slide_ids)) {
    return null;
  }
  return Object.freeze({ plan, sha256: checked.sha256 });
}

function bindingDrift(previousPlan, nextPlan) {
  if (previousPlan.provider_profile_sha256 !== nextPlan.provider_profile_sha256) {
    return "generation_profile_drift";
  }
  if (!sameOrder(previousPlan.ordered_slide_ids, nextPlan.ordered_slide_ids)) {
    return "raw_plan_order_drift";
  }
  for (const [index, previousItem] of previousPlan.items.entries()) {
    const nextItem = nextPlan.items[index];
    if (!nextItem || previousItem.slide_id !== nextItem.slide_id) return "raw_plan_order_drift";
    if (previousItem.raw_contract_sha256 !== nextItem.raw_contract_sha256) return "raw_contract_drift";
    for (const field of BINDING_FIELDS) {
      if (previousItem.provider_input_binding[field] !== nextItem.provider_input_binding[field]) {
        return BINDING_DRIFT_REASONS[field] || "provider_input_binding_drift";
      }
    }
  }
  return null;
}

function hasCurrentAcceptedEvidence({ evidence, acceptedPlan, previousPlan, previousReceipt }) {
  const checked = validateAcceptedRawEvidenceForFinalization(evidence, { plan: acceptedPlan });
  if (!checked.ok || evidence.workflow !== previousReceipt.workflow ||
    evidence.source_receipt_sha256 !== previousReceipt.source_sha256) {
    return false;
  }
  return bindingDrift(previousPlan, acceptedPlan) === null;
}

/**
 * Classify Page Image refreshes from current compiled/evidence bindings.
 * The evaluator is pure: it neither creates a plan nor reads/writes artifacts.
 */
export function evaluatePageImageInvalidation({
  previousReceipt,
  nextReceipt,
  changeKind = "source",
  previousRawWorkPlan = null,
  nextRawWorkPlan = null,
  acceptedRawEvidence = null,
  acceptedRawWorkPlan = previousRawWorkPlan,
} = {}) {
  const previous = requireReceipt(previousReceipt, "previousReceipt");
  const next = requireReceipt(nextReceipt, "nextReceipt");
  if (!PAGE_IMAGE_INVALIDATION_CHANGE_KINDS.includes(changeKind)) {
    throw new PageImageInvalidationError("page_image_invalidation_change_kind_invalid", "changeKind must be source or notes-only");
  }
  if (next.receipt.workflow !== previous.receipt.workflow) {
    return classification(previous.receipt.workflow, "workflow_switch", {
      providerRequired: false,
      nextAction: "preview_target_structural_vnext",
    });
  }
  if (!sameOrder(previous.slide_ids, next.slide_ids)) {
    return classification(previous.receipt.workflow, "structural_versioning", {
      providerRequired: false,
      nextAction: "preview_target_structural_vnext",
    });
  }
  if (changeKind === "notes-only") {
    return classification(previous.receipt.workflow, "notes_only", {
      providerRequired: false,
      nextAction: "refresh_target_notes_delivery",
    });
  }
  const sourceChanged = previous.receipt.source_sha256 !== next.receipt.source_sha256;
  if (sourceChanged && previous.receipt.workflow === "pure") {
    return classification("pure", "raw_rebuild", {
      providerRequired: true,
      nextAction: "authorize_and_rebuild_pure_raw",
      reason: "provider_visible_source_drift",
    });
  }
  const comparePlans = sourceChanged || previousRawWorkPlan !== null || nextRawWorkPlan !== null;
  let previousPlan = null;
  let nextPlan = null;
  if (comparePlans) {
    previousPlan = validPlanForReceipt(previousRawWorkPlan, previous);
    nextPlan = validPlanForReceipt(nextRawWorkPlan, next);
    if (!previousPlan || !nextPlan) {
      return classification(previous.receipt.workflow, previous.receipt.workflow === "framed" ? "raw_evidence_required" : "raw_rebuild", {
        providerRequired: true,
        nextAction: previous.receipt.workflow === "framed"
          ? "authorize_and_rebuild_framed_raw"
          : "authorize_and_rebuild_pure_raw",
        reason: "current_raw_plan_required",
      });
    }
    const planDrift = bindingDrift(previousPlan.plan, nextPlan.plan);
    if (planDrift) {
      return classification(previous.receipt.workflow, "raw_rebuild", {
        providerRequired: true,
        nextAction: previous.receipt.workflow === "framed"
          ? "authorize_and_rebuild_framed_raw"
          : "authorize_and_rebuild_pure_raw",
        reason: planDrift,
      });
    }
  }
  if (!sourceChanged) {
    return classification(previous.receipt.workflow, "current", {
      providerRequired: false,
      nextAction: "none",
    });
  }
  const evidencePlan = validPlanForReceipt(acceptedRawWorkPlan, previous);
  if (!evidencePlan || !hasCurrentAcceptedEvidence({
    evidence: acceptedRawEvidence,
    acceptedPlan: evidencePlan.plan,
    previousPlan: previousPlan.plan,
    previousReceipt: previous.receipt,
  })) {
    return classification("framed", "raw_evidence_required", {
      providerRequired: true,
      nextAction: "authorize_and_rebuild_framed_raw",
      reason: "accepted_evidence_binding_stale",
    });
  }
  return classification("framed", "local_overlay_refresh", {
    providerRequired: false,
    nextAction: "compose_framed_final_through_owner",
  });
}
