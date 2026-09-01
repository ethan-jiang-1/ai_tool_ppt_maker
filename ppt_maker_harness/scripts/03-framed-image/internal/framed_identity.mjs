/** Current Framed workflow owner. */
export const FRAMED_IMAGE_WORKFLOW = "framed";

export const FRAMED_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_derived_data.mjs",
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
]);

/** Public run-scoped API inventory. The mutation list is guarded directly so
 * imported workflow owners cannot bypass CLI route preflight. */
export const FRAMED_IMAGE_OPERATION_MAP = Object.freeze({
  read_only: Object.freeze([
    "resolveFramedTargetSource",
    "resolveFramedTargetCandidateSource",
    "resolveFramedStyleMasterScope",
    "readFramedTargetStoredPlanContext",
    "framedTargetRawPlanProjection",
    "readFramedProgressiveTargetPlanCandidate",
    "inspectFramedProgressiveLocalRebind",
    "readFramedProgressiveTargetStoredPlanContext",
    "framedProgressiveRawPlanProjection",
    "inspectFramedProgressivePilotPageReview",
    "inspectFramedProgressiveCompletePageReview",
    "inspectFramedProgressiveCurrentCompletePageReview",
  ]),
  side_effecting: Object.freeze([
    "buildFramedTargetRawPlan",
    "authorizeFramedTargetRawPlan",
    "generateFramedTargetRawPlan",
    "prepareFramedTargetRawReview",
    "decideFramedTargetRawReview",
    "buildFramedProgressiveTargetRawPlan",
    "planFramedTargetPilot",
    "planFramedTargetExpansion",
    "authorizeFramedProgressiveRawBatch",
    "generateFramedProgressiveRawItem",
    "prepareFramedProgressivePilotReview",
    "acceptFramedProgressivePilot",
    "prepareFramedProgressiveRawReview",
    "acceptFramedProgressiveRawReview",
    "reconcileFramedProgressiveRawAttempt",
    "buildFramedProgressiveTargetDelivery",
    "buildFramedTargetDelivery",
    "refreshFramedTargetText",
    "refreshFramedTargetNotes",
  ]),
});

export class FramedImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedImageWorkflowError";
    this.code = code;
  }
}

// Shared constants used across multiple internal modules
export const SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);
export const SHA256_RE = /^[0-9a-f]{64}$/;

// Direct imports of this workflow owner use the same State-owned execution
// fence as CLI routing, before source, artifact, or provider side effects.
export function preflightFramedMutation(runDir) {
  return requireExactExecutionForRun(runDir);
}

// --- Identity resolution functions ---

import { parsePageImageSource } from "../../01-content/index.mjs";
import { hasCurrentPageImageSourceReceiptEnvelope } from "../../shared/page-image/page_image_source_receipt.mjs";
import { requireExactExecutionForRun } from "../../shared/state/state.mjs";
import {
  createPageImageSourceResolver,
  loadPageImagePresentationPackage,
  loadPageImageVisualLanguage,
  resolvePageImagePresentation,
} from "../../02-visual-system/index.mjs";
import {
  resolveTargetCandidateSourceContext,
  resolveTargetSourceContext,
} from "../../shared/image2/page_image_target_runtime.mjs";
import {
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../../shared/image2/style_master_scope.mjs";

export function requireReceipt(receipt) {
  if (!hasCurrentPageImageSourceReceiptEnvelope(receipt, { workflow: FRAMED_IMAGE_WORKFLOW }) || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed workflow requires a current Page Image Workflow framed receipt");
  }
  return receipt;
}

export function parseFramedTargetReceipt({ runDir, deckDir, sourcePath, sourceText }) {
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

/** Resolve and bind the selected Framed source without compiling raw work. */
export function resolveFramedTargetSource(runDir, { allowSourceRebuild = false } = {}) {
  return resolveTargetSourceContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
    allowSourceRebuild,
  });
}

/** Resolve the selected Framed source without state or artifact materialization. */
export function resolveFramedTargetCandidateSource(runDir) {
  return resolveTargetCandidateSourceContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
}

/** Resolve Framed's exact Style Master scope without materializing page lineage. */
export function resolveFramedStyleMasterScope(runDir) {
  const sourceCandidate = resolveFramedTargetCandidateSource(runDir);
  const scope = resolveStyleMasterScopeContext(runDir, { sourceCandidate });
  if (scope.workflow !== FRAMED_IMAGE_WORKFLOW) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed Style Master scope requires the selected framed workflow");
  }
  return bindStyleMasterScopeCandidate(scope, sourceCandidate);
}

export function coreStyleMasterSelection(workflow, styleMasterReference) {
  if (!styleMasterReference || typeof styleMasterReference !== "object" ||
    !SHA256_RE.test(styleMasterReference.selection_sha256 || "") ||
    !SHA256_RE.test(styleMasterReference.plan_sha256 || "")) {
    throw new FramedImageWorkflowError("framed_page_image_core_invalid", "Framed adapter requires current Style Master selection facts for Page Image Core");
  }
  return Object.freeze({
    workflow,
    selection_sha256: styleMasterReference.selection_sha256,
    plan_sha256: styleMasterReference.plan_sha256,
  });
}