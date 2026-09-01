/**
 * 04-pure-image — Pure workflow adapter.
 *
 * Pure re-export layer.  Every public name delegates to its internal module.
 * Only the workflow-owned constants, class, and the shared receipt parser are
 * defined here.
 */

import {
  resolvePageImagePresentation,
  createPageImageSourceResolver,
  loadPageImagePresentationPackage,
  loadPageImageVisualLanguage,
} from "../02-visual-system/index.mjs";
import { parsePageImageSource } from "../01-content/index.mjs";

export class PureImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PureImageWorkflowError";
    this.code = code;
  }
}

function parsePureTargetReceipt({ runDir, deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageImageVisualLanguage(deckDir);
  const presentationPackage = loadPageImagePresentationPackage(runDir);
  const visualResolver = createPageImageSourceResolver({ deckDir, visualLanguage });
  return parsePageImageSource(sourceText, {
    source: sourcePath,
    registry: {
      resolveSelection(context) {
        return Object.freeze({
          ...visualResolver.resolveSelection(context),
          presentation: resolvePageImagePresentation({
            package: presentationPackage,
            workflow: context.workflow,
            pageClass: context.page_class,
            headerPolicy: context.header_policy,
          }),
        });
      },
    },
  });
}

// identity
export { resolvePureTargetSource, resolvePureTargetCandidateSource, resolvePureStyleMasterScope } from "./internal/pure_identity.mjs";

// raw plan
export { createPureRawWorkPlan, createPureTargetRawReviewContribution } from "./internal/pure_raw_plan.mjs";

// raw contract
export { validatePureRawContract } from "./internal/pure_raw_contract.mjs";

// final manifest
export { publishPureFinalSlideManifest } from "./internal/pure_final_manifest.mjs";

// refresh
export { classifyPureRefresh } from "./internal/pure_refresh.mjs";

// orchestration
export {
  buildPureTargetRawPlan,
  readPureTargetStoredPlanContext,
  pureTargetRawPlanProjection,
  authorizePureTargetRawPlan,
  generatePureTargetRawPlan,
  preparePureTargetRawReview,
  decidePureTargetRawReview,
  buildPureTargetDelivery,
  refreshPureTargetNotes,
} from "./internal/pure_orchestration.mjs";

// progressive orchestration
export {
  readPureProgressiveTargetPlanCandidate,
  buildPureProgressiveTargetRawPlan,
  readPureProgressiveTargetStoredPlanContext,
  pureProgressiveRawPlanProjection,
  planPureTargetPilot,
  planPureTargetExpansion,
  authorizePureProgressiveRawBatch,
  generatePureProgressiveRawItem,
  buildPureProgressiveTargetDelivery,
} from "./internal/pure_progressive_orch.mjs";

// progressive
export {
  preparePureProgressivePilotReview,
  inspectPureProgressivePilotPageReview,
  acceptPureProgressivePilot,
  preparePureProgressiveRawReview,
  acceptPureProgressiveRawReview,
  reconcilePureProgressiveRawAttempt,
  inspectPureProgressiveCompletePageReview,
  inspectPureProgressiveCurrentCompletePageReview,
} from "./internal/pure_progressive.mjs";

/** Current Pure workflow owner. */
export const PURE_IMAGE_WORKFLOW = "pure";

export const PURE_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_derived_data.mjs",
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
]);

/** Public run-scoped API inventory. Keep read-only inspection distinct from
 * lifecycle entries that must cross the State execution fence. */
export const PURE_IMAGE_OPERATION_MAP = Object.freeze({
  read_only: Object.freeze([
    "resolvePureTargetSource",
    "resolvePureTargetCandidateSource",
    "resolvePureStyleMasterScope",
    "readPureTargetStoredPlanContext",
    "pureTargetRawPlanProjection",
    "readPureProgressiveTargetPlanCandidate",
    "readPureProgressiveTargetStoredPlanContext",
    "pureProgressiveRawPlanProjection",
    "inspectPureProgressivePilotPageReview",
    "inspectPureProgressiveCompletePageReview",
    "inspectPureProgressiveCurrentCompletePageReview",
  ]),
  side_effecting: Object.freeze([
    "buildPureTargetRawPlan",
    "authorizePureTargetRawPlan",
    "generatePureTargetRawPlan",
    "preparePureTargetRawReview",
    "decidePureTargetRawReview",
    "buildPureProgressiveTargetRawPlan",
    "planPureTargetPilot",
    "planPureTargetExpansion",
    "authorizePureProgressiveRawBatch",
    "generatePureProgressiveRawItem",
    "preparePureProgressivePilotReview",
    "acceptPureProgressivePilot",
    "preparePureProgressiveRawReview",
    "acceptPureProgressiveRawReview",
    "reconcilePureProgressiveRawAttempt",
    "buildPureProgressiveTargetDelivery",
    "buildPureTargetDelivery",
    "refreshPureTargetNotes",
  ]),
});