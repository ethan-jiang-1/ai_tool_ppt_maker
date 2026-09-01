import { verifyFramedHeaderOverlays } from "./framed_render_contract.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  authorizeTargetRawWork,
  decideTargetRawReview,
  generateTargetRawWork,
  materializeTargetSourceCandidateContext,
  prepareTargetRawReview,
  readTargetAcceptedRawWork,
  readTargetFinalWork,
  resolveTargetStoredPlanContext,
  targetRawPlanProjection,
  writeTargetFinalManifest,
  writeTargetRawWorkPlan,
  writeProgressiveTargetFinalManifest,
  recordTargetDelivery,
} from "../../shared/image2/page_image_target_runtime.mjs";
import {
  inspectProgressiveRawLifecycle,
} from "../../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  deliverTargetFinalSlideManifest,
  assertPresentCurrentTargetDeliveryIdentity,
} from "../../05-delivery/index.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, parseFramedTargetReceipt, preflightFramedMutation, resolveFramedTargetCandidateSource, requireReceipt } from "./framed_identity.mjs";
import {
  compileFramedTargetRawPlanCandidate,
  createFramedTargetRawReviewContribution,
  verifyFramedCandidateProof,
  framedHeaderOverlayInput,
  publishFramedPageDerivedData,
} from "./framed_raw_plan.mjs";
import {
  publishFramedCompletePageReview,
  validateFramedCompletePageReview,
  requireFramedFinalizationReview,
  assertFramedFinalMatchesReviewedComposite,
  readFramedTargetFinalizationReview,
} from "./framed_review.mjs";
import { composeFramedFinalSlideManifest } from "./framed_final_manifest.mjs";
import { buildFramedProgressiveTargetDelivery } from "./framed_progressive_orch.mjs";

export async function buildFramedTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  preflightFramedMutation(runDir);
  const candidate = compileFramedTargetRawPlanCandidate(resolveFramedTargetCandidateSource(runDir));
  const proof = await verifyFramedHeaderOverlays(candidate.receipt.slides.map(framedHeaderOverlayInput));
  verifyFramedCandidateProof(candidate, proof);
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  return Object.freeze({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    page_image_core: candidate.page_image_core,
    style_master_reference: candidate.style_master_reference,
  });
}

/** Read the exact current Framed stored plan without running plan-time proof. */
export function readFramedTargetStoredPlanContext(runDir) {
  return resolveTargetStoredPlanContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
    compilePlanCandidate: compileFramedTargetRawPlanCandidate,
  });
}

export function framedTargetRawPlanProjection(plan) {
  return targetRawPlanProjection(plan, plan.raw_work_plan);
}

export async function authorizeFramedTargetRawPlan(runDir, { planHash } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedTargetStoredPlanContext(runDir);
  return authorizeTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
  });
}

export async function generateFramedTargetRawPlan(runDir, { planHash, submit } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedTargetStoredPlanContext(runDir);
  return generateTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
    submit,
  });
}

export async function prepareFramedTargetRawReview(runDir) {
  preflightFramedMutation(runDir);
  const plan = readFramedTargetStoredPlanContext(runDir);
  return prepareTargetRawReview(plan, plan.raw_work_plan, {
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
    publishCompletePageReview: async ({ raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide }) => {
      const published = await publishFramedCompletePageReview({
        context: plan,
        reviewPlan: rawWorkPlan,
        rawBytesBySlide,
      });
      return {
        complete_page_presentation_sha256: published.complete_page_presentation_sha256,
        projection_sha256: published.projection_sha256,
        projection_capture_profile_sha256: published.projection_capture_profile_sha256,
      };
    },
  });
}

export async function decideFramedTargetRawReview(runDir, { decision } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedTargetStoredPlanContext(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, {
    decision,
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
    validateCompletePageReview: ({ raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide }) =>
      validateFramedCompletePageReview({ context: plan, reviewPlan: rawWorkPlan, rawBytesBySlide }),
  });
}

/** Framed finalization then shared delivery through the one target delivery owner. */
export async function buildFramedTargetDelivery(runDir) {
  preflightFramedMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const progressive = inspectProgressiveRawLifecycle({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  if (progressive.ok && progressive.plan) return buildFramedProgressiveTargetDelivery(runDir);
  const plan = readFramedTargetStoredPlanContext(runDir);
  const raw = readTargetAcceptedRawWork(plan, plan.raw_work_plan);
  const reviewed = readFramedTargetFinalizationReview(plan, plan.raw_work_plan, raw.accepted_raw_evidence);
  const finalization = await composeFramedFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: reviewed.raw_bytes_by_slide,
  });
  assertFramedFinalMatchesReviewedComposite(finalization.final_bytes_by_slide, reviewed.presentation);
  const persisted = writeTargetFinalManifest(plan, {
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalManifest: finalization.manifest,
  });
  const delivery = await deliverTargetFinalSlideManifest({
    runDir: plan.run_dir,
    manifest: finalization.manifest,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalBytesBySlide: finalization.final_bytes_by_slide,
    sourcePath: plan.source_path,
    sourceEpoch: plan.source_epoch,
    title: plan.deck_dir.split(/[\\/]/).at(-1),
  });
  const deliveryState = recordTargetDelivery(plan, delivery.receipt);
  return Object.freeze({ ok: true, plan: framedTargetRawPlanProjection(plan), finalization: persisted, delivery, delivery_state: deliveryState });
}