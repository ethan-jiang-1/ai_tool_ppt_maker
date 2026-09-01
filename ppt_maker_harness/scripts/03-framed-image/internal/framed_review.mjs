import { composeFramedHeaderOverlays, describeFramedHeaderOverlay } from "./framed_render_contract.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  publishCompletePageReviewPresentation,
  validateCompletePageReviewPresentation,
} from "../../shared/image2/page_image_complete_page_review.mjs";
import {
  validateTargetCurrentRawReview,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { validateRawWorkPlan } from "../../shared/image2/page_image_artifacts.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, SHA256_RE } from "./framed_identity.mjs";
import { createFramedTargetRawReviewContribution, framedHeaderOverlayInput } from "./framed_raw_plan.mjs";

export function framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null, reviewSlideIds = reviewPlan?.ordered_slide_ids } = {}) {
  const checkedPlan = reviewPlan?.sha256 ? null : validateRawWorkPlan(reviewPlan);
  const reviewPlanSha256 = reviewPlan?.sha256 ?? (checkedPlan?.ok ? checkedPlan.sha256 : null);
  const resolvedSourceEpoch = sourceEpoch ?? reviewPlan?.source_epoch ?? context?.source_epoch;
  if (!reviewPlan || !SHA256_RE.test(reviewPlanSha256 || "") ||
    !Array.isArray(reviewPlan.ordered_slide_ids) || reviewPlan.ordered_slide_ids.length === 0 ||
    !Array.isArray(reviewSlideIds) || reviewSlideIds.length === 0 ||
    new Set(reviewSlideIds).size !== reviewSlideIds.length ||
    reviewSlideIds.some((slideId) => !reviewPlan.ordered_slide_ids.includes(slideId)) ||
    canonicalJson(reviewPlan.ordered_slide_ids.filter((slideId) => reviewSlideIds.includes(slideId))) !== canonicalJson(reviewSlideIds) ||
    !Number.isInteger(resolvedSourceEpoch) || resolvedSourceEpoch <= 0) {
    throw new FramedImageWorkflowError("framed_complete_page_review_invalid", "Framed Complete Page Review requires one current raw plan");
  }
  const contribution = createFramedTargetRawReviewContribution({
    receipt: context.receipt,
    rawWorkPlan: context.raw_work_plan,
  });
  const slideById = new Map(context.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const raw = {};
  const frames = [];
  const bindings = {};
  for (const slideId of reviewSlideIds) {
    const slide = slideById.get(slideId);
    const rawBytes = rawBytesBySlide?.[slideId];
    if (!slide || !rawBytes) {
      throw new FramedImageWorkflowError("framed_complete_page_review_invalid", `Framed Complete Page Review is missing current provider bytes for ${slideId}`);
    }
    const frame = describeFramedSlide(slide);
    const providerBytes = Buffer.from(rawBytes);
    const providerSha256 = sha256Bytes(providerBytes);
    raw[slideId] = providerBytes;
    frames.push(Object.freeze({
      ...framedHeaderOverlayInput(slide),
      verified_raw: { bytes: providerBytes, sha256: providerSha256 },
    }));
    bindings[slideId] = canonicalJsonSha256({
      schema: "page-image-framed-complete-page-binding",
      raw_work_plan_sha256: reviewPlanSha256,
      slide_id: slideId,
      raw_provider_page_sha256: providerSha256,
      header_overlay: framedHeaderOverlayInput(slide),
      render_profile_sha256: frame.render_profile.render_profile_digest,
      protected_composition_sha256: canonicalJsonSha256(slide.visual_language.presentation.protected_composition),
    });
  }
  return Object.freeze({
    contribution,
    raw_work_plan_sha256: reviewPlanSha256,
    source_epoch: resolvedSourceEpoch,
    raw_bytes_by_slide: Object.freeze(raw),
    frames: Object.freeze(frames),
    adapter_complete_page_bindings_by_slide: Object.freeze(bindings),
  });
}

function describeFramedSlide(slide) {
  return describeFramedHeaderOverlay(framedHeaderOverlayInput(slide));
}

export function framedPilotReviewContribution({ inputs, batchSha256, coverage } = {}) {
  if (!SHA256_RE.test(batchSha256 || "") || !Array.isArray(coverage)) {
    throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", "Framed Pilot contribution requires exact current batch coverage");
  }
  const slideIds = Object.keys(inputs.raw_bytes_by_slide);
  if (coverage.length !== slideIds.length || new Set(coverage.map((item) => item?.slide_id)).size !== slideIds.length) {
    throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", "Framed Pilot coverage must name each selected slide exactly once");
  }
  const coverageBySlide = new Map(coverage.map((item) => [item.slide_id, item]));
  const items = slideIds.map((slideId) => {
    const item = coverageBySlide.get(slideId);
    if (!item || item.raw_sha256 !== sha256Bytes(inputs.raw_bytes_by_slide[slideId])) {
      throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is stale for ${slideId}`);
    }
    return Object.freeze({
      slide_id: slideId,
      raw_sha256: item.raw_sha256,
      adapter_complete_page_binding_sha256: inputs.adapter_complete_page_bindings_by_slide[slideId],
    });
  });
  return canonicalJsonSha256({
    schema: "page-image-framed-pilot-review-contribution",
    raw_work_plan_sha256: inputs.raw_work_plan_sha256,
    batch_sha256: batchSha256,
    complete_page_review_contribution_sha256: inputs.contribution.typed_review_contribution_sha256,
    items,
  });
}

export async function publishFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide } = {}) {
  const inputs = framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide });
  const composed = await composeFramedHeaderOverlays(inputs.frames);
  return publishCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    completeBytesBySlide: composed.final_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

export function validateFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null } = {}) {
  const inputs = framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch });
  return validateCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

export function requireFramedFinalizationReview(validation, acceptedCompleteReview) {
  const reviewEvidenceSha256 = acceptedCompleteReview?.workflow_evidence_sha256 ??
    acceptedCompleteReview?.complete_page_presentation_sha256;
  if (!validation?.ok || !acceptedCompleteReview ||
    acceptedCompleteReview.decision !== "proceed" ||
    validation.complete_page_presentation_sha256 !== reviewEvidenceSha256 ||
    validation.projection_sha256 !== acceptedCompleteReview.projection_sha256) {
    throw new FramedImageWorkflowError(
      "framed_finalization_review_stale",
      "Framed finalization requires the exact current proceeded Complete Page Review",
    );
  }
  return validation.presentation;
}

export function assertFramedFinalMatchesReviewedComposite(finalBytesBySlide, presentation) {
  for (const item of presentation.items) {
    const finalBytes = finalBytesBySlide?.[item.slide_id];
    if (!finalBytes || sha256Bytes(finalBytes) !== item.complete_page_sha256) {
      throw new FramedImageWorkflowError(
        "framed_finalization_composite_stale",
        `Framed final composite no longer matches the reviewed page for ${item.slide_id}`,
      );
    }
  }
}

export function readFramedTargetFinalizationReview(context, rawWorkPlan, acceptedRawEvidence) {
  const current = validateTargetCurrentRawReview(context, rawWorkPlan, {
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan }),
    acceptedRawEvidence,
    validateCompletePageReview: ({ raw_work_plan: reviewPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validateFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch }),
  });
  return Object.freeze({
    presentation: requireFramedFinalizationReview(current.completePresentation, current.review),
    raw_bytes_by_slide: current.rawBytes,
  });
}

export function readFramedProgressiveFinalizationReview(context, progressiveRawWorkPlan, rawBytesBySlide, acceptedCompleteReview) {
  const validation = validateFramedCompletePageReview({
    context,
    reviewPlan: progressiveRawWorkPlan,
    rawBytesBySlide,
    sourceEpoch: progressiveRawWorkPlan.source_epoch,
  });
  return requireFramedFinalizationReview(validation, acceptedCompleteReview);
}

export function requireFramedCurrentCompleteReview(validation, currentCompleteReview) {
  if (!validation?.ok || !currentCompleteReview ||
    validation.complete_page_presentation_sha256 !== currentCompleteReview.workflow_evidence_sha256 ||
    validation.projection_sha256 !== currentCompleteReview.projection_sha256) {
    throw new FramedImageWorkflowError(
      "framed_current_complete_review_stale",
      "Framed current Complete Page Review no longer binds its provider and presentation evidence",
    );
  }
  return validation.presentation;
}

export const FRAMED_FINAL_COMPOSITION_KEYS = Object.freeze([
  "receipt",
  "rawWorkPlan",
  "acceptedRawEvidence",
  "rawBytesBySlide",
]);

export function requireFramedFinalCompositionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
    !FRAMED_FINAL_COMPOSITION_KEYS.every((key) => Object.hasOwn(input, key)) ||
    Object.keys(input).some((key) => ![...FRAMED_FINAL_COMPOSITION_KEYS, "evidencePlan"].includes(key))) {
    throw new FramedImageWorkflowError(
      "framed_render_input_invalid",
      "Framed final rendering accepts only current receipt, raw plan, accepted evidence, and raw bytes",
    );
  }
  return input;
}