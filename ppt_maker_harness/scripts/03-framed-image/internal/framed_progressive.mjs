import { composeFramedHeaderOverlays } from "./framed_render_contract.mjs";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  publishPilotPageReviewPresentation,
  validatePilotPageReviewPresentation,
} from "../../shared/image2/page_image_complete_page_review.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, SHA256_RE } from "./framed_identity.mjs";
import { framedCompletePageReviewInputs, framedPilotReviewContribution, publishFramedCompletePageReview, validateFramedCompletePageReview } from "./framed_review.mjs";

const FRAMED_PROGRESSIVE_PILOT_REVIEW_KEYS = Object.freeze(["planHash", "batchHash"]);

export async function publishFramedProgressivePilot({ context, plan, batch_sha256, coverage, materializations }) {
  const pilotSlideIds = coverage.map((item) => item.slide_id);
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    if (!materialization) throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is unavailable for ${slideId}`);
    return [slideId, Buffer.from(materialization.bytes)];
  }));
  const inputs = framedCompletePageReviewInputs({
    context,
    reviewPlan: plan,
    rawBytesBySlide,
    reviewSlideIds: pilotSlideIds,
  });
  // This uses the exact private compiler/browser evaluator used by finalization.
  const composed = await composeFramedHeaderOverlays(inputs.frames);
  const typedReviewContributionSha256 = framedPilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage });
  const published = await publishPilotPageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    batchSha256: batch_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256,
    orderedPlanSlideIds: plan.ordered_slide_ids,
    pilotSlideIds,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    completeBytesBySlide: composed.final_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
  return Object.freeze({
    workflow_evidence_sha256: published.pilot_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

export function validateFramedProgressivePilot({ context, plan, batch, batch_sha256, coverage, materializations } = {}) {
  const pilotSlideIds = batch.review_sample_slide_ids;
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    return [slideId, materialization ? Buffer.from(materialization.bytes) : null];
  }));
  try {
    const inputs = framedCompletePageReviewInputs({
      context,
      reviewPlan: plan,
      rawBytesBySlide,
      reviewSlideIds: pilotSlideIds,
    });
    return validatePilotPageReviewPresentation({
      runDir: context.run_dir,
      rawWorkPlanSha256: inputs.raw_work_plan_sha256,
      batchSha256: batch_sha256,
      sourceEpoch: inputs.source_epoch,
      workflow: FRAMED_IMAGE_WORKFLOW,
      typedReviewContributionSha256: framedPilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage }),
      orderedPlanSlideIds: plan.ordered_slide_ids,
      pilotSlideIds,
      rawBytesBySlide: inputs.raw_bytes_by_slide,
      adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "framed_pilot_review_invalid",
      message: error.message || "Framed Pilot page review is invalid",
    });
  }
}

export function requireFramedProgressivePilotReviewInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
    Object.keys(input).some((key) => !FRAMED_PROGRESSIVE_PILOT_REVIEW_KEYS.includes(key))) {
    throw new FramedImageWorkflowError(
      "framed_pilot_input_invalid",
      "Framed Pilot review accepts only the exact planHash and batchHash bindings",
    );
  }
  return input;
}

export function progressiveFramedRawBytes(materializations) {
  return Object.fromEntries([...materializations.entries()].map(([slideId, materialization]) => [slideId, Buffer.from(materialization.bytes)]));
}

export async function publishFramedProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  const published = await publishFramedCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveFramedRawBytes(materializations),
  });
  return Object.freeze({
    workflow_evidence_sha256: published.complete_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

export function validateFramedProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  return validateFramedCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveFramedRawBytes(materializations),
  });
}