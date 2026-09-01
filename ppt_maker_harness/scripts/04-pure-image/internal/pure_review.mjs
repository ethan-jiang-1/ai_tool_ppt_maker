import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  publishCompletePageReviewPresentation,
  validateCompletePageReviewPresentation,
  publishPilotPageReviewPresentation,
  validatePilotPageReviewPresentation,
} from "../../shared/image2/page_image_complete_page_review.mjs";
import { validateRawWorkPlan } from "../../shared/image2/page_image_artifacts.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import { createPureTargetRawReviewContribution } from "./pure_raw_plan.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;

function pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null, reviewSlideIds = reviewPlan?.ordered_slide_ids } = {}) {
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
    throw new PureImageWorkflowError("pure_complete_page_review_invalid", "Pure Complete Page Review requires one current raw plan");
  }
  const contribution = createPureTargetRawReviewContribution({
    receipt: context.receipt,
    rawWorkPlan: context.raw_work_plan,
  });
  const raw = {};
  const bindings = {};
  for (const slideId of reviewSlideIds) {
    const providerBytes = rawBytesBySlide?.[slideId];
    if (!providerBytes) {
      throw new PureImageWorkflowError("pure_complete_page_review_invalid", `Pure Complete Page Review is missing current provider bytes for ${slideId}`);
    }
    const bytes = Buffer.from(providerBytes);
    const providerSha256 = sha256Bytes(bytes);
    raw[slideId] = bytes;
    bindings[slideId] = canonicalJsonSha256({
      schema: "page-image-pure-complete-page-binding",
      raw_work_plan_sha256: reviewPlanSha256,
      slide_id: slideId,
      provider_page_sha256: providerSha256,
    });
  }
  return Object.freeze({
    contribution,
    raw_work_plan_sha256: reviewPlanSha256,
    source_epoch: resolvedSourceEpoch,
    raw_bytes_by_slide: Object.freeze(raw),
    adapter_complete_page_bindings_by_slide: Object.freeze(bindings),
  });
}

function purePilotReviewContribution({ inputs, batchSha256, coverage } = {}) {
  if (!SHA256_RE.test(batchSha256 || "") || !Array.isArray(coverage)) {
    throw new PureImageWorkflowError("pure_pilot_coverage_invalid", "Pure Pilot contribution requires exact current batch coverage");
  }
  const slideIds = Object.keys(inputs.raw_bytes_by_slide);
  if (coverage.length !== slideIds.length || new Set(coverage.map((item) => item?.slide_id)).size !== slideIds.length) {
    throw new PureImageWorkflowError("pure_pilot_coverage_invalid", "Pure Pilot coverage must name each selected slide exactly once");
  }
  const coverageBySlide = new Map(coverage.map((item) => [item.slide_id, item]));
  const items = slideIds.map((slideId) => {
    const item = coverageBySlide.get(slideId);
    if (!item || item.raw_sha256 !== sha256Bytes(inputs.raw_bytes_by_slide[slideId])) {
      throw new PureImageWorkflowError("pure_pilot_coverage_invalid", `Pure Pilot coverage is stale for ${slideId}`);
    }
    return Object.freeze({
      slide_id: slideId,
      raw_sha256: item.raw_sha256,
      adapter_complete_page_binding_sha256: inputs.adapter_complete_page_bindings_by_slide[slideId],
    });
  });
  return canonicalJsonSha256({
    schema: "page-image-pure-pilot-review-contribution",
    raw_work_plan_sha256: inputs.raw_work_plan_sha256,
    batch_sha256: batchSha256,
    complete_page_review_contribution_sha256: inputs.contribution.typed_review_contribution_sha256,
    items,
  });
}

async function publishPureCompletePageReview({ context, reviewPlan, rawBytesBySlide } = {}) {
  const inputs = pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide });
  return publishCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: "pure",
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

function validatePureCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null } = {}) {
  const inputs = pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch });
  return validateCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: "pure",
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

export { pureCompletePageReviewInputs, purePilotReviewContribution, publishPureCompletePageReview, validatePureCompletePageReview };