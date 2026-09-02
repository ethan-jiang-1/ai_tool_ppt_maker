/**
 * 03-framed-image — Framed workflow semantics, deterministic local header overlay, and raw compilation facade.
 * Authority: openspec/specs/image-generation/spec.md
 */

// Pure re-export layer for the 03-framed-image workflow owner.
// The Framed adapter compiles through the shared Page Image render contract
// ("./internal/framed_render_contract.mjs"), the canonical render profile
// ("./internal/framed_render_profile.mjs"), the shared
// publishCurrentFinalSlideManifest and resolvePageImagePresentation seams
// via its internal modules.

export {
  FRAMED_IMAGE_APPROVED_SHARED_INTERFACES,
  FRAMED_IMAGE_OPERATION_MAP,
  FRAMED_IMAGE_WORKFLOW,
  FramedImageWorkflowError,
  resolveFramedTargetCandidateSource,
  resolveFramedTargetSource,
  resolveFramedStyleMasterScope,
} from "./internal/framed_identity.mjs";

export {
  validateFramedRawContract,
} from "./internal/framed_raw_contract.mjs";

export {
  createFramedRawWorkPlan,
  createFramedTargetRawReviewContribution,
} from "./internal/framed_raw_plan.mjs";

export {
  composeFramedFinalSlideManifest,
  publishFramedFinalSlideManifest,
} from "./internal/framed_final_manifest.mjs";

export {
  classifyFramedProgressiveLocalRebind,
  classifyFramedRefresh,
  refreshFramedTargetNotes,
  refreshFramedTargetText,
} from "./internal/framed_refresh.mjs";

export {
  authorizeFramedTargetRawPlan,
  buildFramedTargetDelivery,
  buildFramedTargetRawPlan,
  decideFramedTargetRawReview,
  framedTargetRawPlanProjection,
  generateFramedTargetRawPlan,
  prepareFramedTargetRawReview,
  readFramedTargetStoredPlanContext,
} from "./internal/framed_orchestration.mjs";

export {
  acceptFramedProgressivePilot,
  acceptFramedProgressiveRawReview,
  authorizeFramedProgressiveRawBatch,
  buildFramedProgressiveTargetDelivery,
  buildFramedProgressiveTargetRawPlan,
  framedProgressiveRawPlanProjection,
  generateFramedProgressiveRawItem,
  inspectFramedProgressiveCompletePageReview,
  inspectFramedProgressiveCurrentCompletePageReview,
  inspectFramedProgressiveLocalRebind,
  inspectFramedProgressivePilotPageReview,
  planFramedTargetExpansion,
  planFramedTargetPilot,
  prepareFramedProgressivePilotReview,
  prepareFramedProgressiveRawReview,
  readFramedProgressiveTargetPlanCandidate,
  readFramedProgressiveTargetStoredPlanContext,
  reconcileFramedProgressiveRawAttempt,
} from "./internal/framed_progressive_orch.mjs";