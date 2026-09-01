import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "../../shared/image2/page_image_media_contract.mjs";
import {
  publishCurrentFinalSlideManifest,
} from "../../shared/image2/page_image_final_manifest.mjs";
import {
  validateAcceptedRawEvidenceForFinalization,
} from "../../shared/image2/page_image_artifacts.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import {
  validateTargetCurrentRawReview,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { createPureTargetRawReviewContribution, requireReceipt } from "./pure_raw_plan.mjs";
import { validatePureCompletePageReview } from "./pure_review.mjs";

function requirePureNativeFinalBytes(acceptedRawEvidence, rawBytesBySlide) {
  if (!rawBytesBySlide || typeof rawBytesBySlide !== "object" || Array.isArray(rawBytesBySlide)) {
    throw new PureImageWorkflowError("pure_final_media_invalid", "Pure finalization requires accepted native raw PNG bytes");
  }
  for (const item of acceptedRawEvidence.items) {
    const media = inspectExactPageImagePng(rawBytesBySlide[item.slide_id], PAGE_IMAGE_NATIVE_RAW_PNG);
    if (!media.ok) throw new PureImageWorkflowError("pure_final_media_invalid", `Pure final bytes for ${item.slide_id} must be a valid PNG`);
    if (sha256Bytes(media.bytes) !== item.raw_sha256) {
      throw new PureImageWorkflowError("pure_finalization_raw_drift", `Pure final bytes drifted from accepted raw evidence for ${item.slide_id}`);
    }
  }
}

function requirePureFinalizationReview(validation, acceptedCompleteReview) {
  const reviewEvidenceSha256 = acceptedCompleteReview?.workflow_evidence_sha256 ??
    acceptedCompleteReview?.complete_page_presentation_sha256;
  if (!validation?.ok || !acceptedCompleteReview ||
    acceptedCompleteReview.decision !== "proceed" ||
    validation.complete_page_presentation_sha256 !== reviewEvidenceSha256 ||
    validation.projection_sha256 !== acceptedCompleteReview.projection_sha256) {
    throw new PureImageWorkflowError(
      "pure_finalization_review_stale",
      "Pure finalization requires the exact current proceeded Complete Page Review",
    );
  }
  return validation.presentation;
}

function assertPureFinalMatchesReviewedProviderPage(finalBytesBySlide, presentation) {
  for (const item of presentation.items) {
    const finalBytes = finalBytesBySlide?.[item.slide_id];
    if (!finalBytes || sha256Bytes(finalBytes) !== item.raw_provider_page_sha256 ||
      item.complete_page_sha256 !== item.raw_provider_page_sha256) {
      throw new PureImageWorkflowError(
        "pure_finalization_provider_page_stale",
        `Pure final media no longer matches the reviewed provider page for ${item.slide_id}`,
      );
    }
  }
}

function readPureTargetFinalizationReview(context, rawWorkPlan, acceptedRawEvidence) {
  const current = validateTargetCurrentRawReview(context, rawWorkPlan, {
    reviewContribution: createPureTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan }),
    acceptedRawEvidence,
    validateCompletePageReview: ({ raw_work_plan: reviewPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validatePureCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch }),
  });
  return Object.freeze({
    presentation: requirePureFinalizationReview(current.completePresentation, current.review),
    raw_bytes_by_slide: current.rawBytes,
  });
}

function readPureProgressiveFinalizationReview(context, progressiveRawWorkPlan, rawBytesBySlide, acceptedCompleteReview) {
  const validation = validatePureCompletePageReview({
    context,
    reviewPlan: progressiveRawWorkPlan,
    rawBytesBySlide,
    sourceEpoch: progressiveRawWorkPlan.source_epoch,
  });
  return requirePureFinalizationReview(validation, acceptedCompleteReview);
}

/** Pure finalization publishes the accepted raw bytes unchanged. */
export function publishPureFinalSlideManifest({ receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide, evidencePlan = rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: evidencePlan });
  if (!evidence.ok) throw new PureImageWorkflowError(evidence.code, evidence.message);
  if (rawWorkPlan.workflow !== "pure" || rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    evidencePlan.workflow !== "pure" || evidencePlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(evidencePlan.ordered_slide_ids)) {
    throw new PureImageWorkflowError("pure_finalization_lineage_invalid", "Pure finalization requires matching selected-workflow raw-plan lineage");
  }
  requirePureNativeFinalBytes(acceptedRawEvidence, rawBytesBySlide);
  return publishCurrentFinalSlideManifest({
    rawWorkPlan: evidencePlan,
    acceptedRawEvidence,
    ownerWorkflow: "pure",
    finalBytesBySlide: rawBytesBySlide,
  });
}

export { requirePureFinalizationReview, assertPureFinalMatchesReviewedProviderPage, readPureTargetFinalizationReview, readPureProgressiveFinalizationReview, requirePureNativeFinalBytes };