import {
  materializeTargetSourceCandidateContext,
  resolveTargetStoredPlanContext,
  targetRawPlanProjection,
  authorizeTargetRawWork,
  generateTargetRawWork,
  prepareTargetRawReview,
  decideTargetRawReview,
  readTargetAcceptedRawWork,
  writeTargetRawWorkPlan,
  writeTargetFinalManifest,
  readTargetFinalWork,
  recordTargetDelivery,
  rebindTargetLocalComposeWork,
  resolveTargetLocalComposeContext,
  targetSourceSemanticSha256,
} from "../../shared/image2/page_image_target_runtime.mjs";
import {
  createAcceptedRawEvidence,
} from "../../shared/image2/page_image_artifacts.mjs";
import { publishCurrentFinalSlideManifest } from "../../shared/image2/page_image_final_manifest.mjs";
import {
  assertPresentCurrentTargetDeliveryIdentity,
  deliverTargetFinalSlideManifest,
} from "../../05-delivery/index.mjs";
import {
  inspectProgressiveRawLifecycle,
} from "../../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  requireExactExecutionForRun,
} from "../../shared/state/state.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import { compilePureTargetRawPlanCandidate, createPureTargetRawReviewContribution, createPureRawWorkPlan } from "./pure_raw_plan.mjs";
import { publishPureCompletePageReview, validatePureCompletePageReview } from "./pure_review.mjs";
import { publishPureFinalSlideManifest, readPureTargetFinalizationReview, assertPureFinalMatchesReviewedProviderPage } from "./pure_final_manifest.mjs";
import { resolvePureTargetCandidateSource, parsePureTargetReceipt } from "./pure_identity.mjs";
import { buildPureProgressiveTargetDelivery } from "./pure_progressive_orch.mjs";

// Every exported mutation enters through State before it can inspect source,
// publish a derived record, or make provider work reachable.
function preflightPureMutation(runDir) {
  return requireExactExecutionForRun(runDir);
}

export function buildPureTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  preflightPureMutation(runDir);
  const candidate = compilePureTargetRawPlanCandidate(resolvePureTargetCandidateSource(runDir));
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

/** Read Pure's exact current stored plan without rematerializing source state. */
export function readPureTargetStoredPlanContext(runDir) {
  return resolveTargetStoredPlanContext(runDir, {
    workflow: "pure",
    parseReceipt: parsePureTargetReceipt,
    compilePlanCandidate: compilePureTargetRawPlanCandidate,
  });
}

export function pureTargetRawPlanProjection(plan) {
  return targetRawPlanProjection(plan, plan.raw_work_plan);
}

export function authorizePureTargetRawPlan(runDir, { planHash } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureTargetStoredPlanContext(runDir);
  return authorizeTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
  });
}

export async function generatePureTargetRawPlan(runDir, { planHash, submit } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureTargetStoredPlanContext(runDir);
  return generateTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
    submit,
  });
}

export async function preparePureTargetRawReview(runDir) {
  preflightPureMutation(runDir);
  const plan = readPureTargetStoredPlanContext(runDir);
  return prepareTargetRawReview(plan, plan.raw_work_plan, {
    reviewContribution: createPureTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
    publishCompletePageReview: async ({ raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide }) => {
      const published = await publishPureCompletePageReview({
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

export function decidePureTargetRawReview(runDir, { decision } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureTargetStoredPlanContext(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, {
    decision,
    reviewContribution: createPureTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
    validateCompletePageReview: ({ raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide }) =>
      validatePureCompletePageReview({ context: plan, reviewPlan: rawWorkPlan, rawBytesBySlide }),
  });
}

/** Pure finalization publishes accepted raw bytes, then joins shared delivery. */
export async function buildPureTargetDelivery(runDir) {
  preflightPureMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const progressive = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
  if (progressive.ok && progressive.plan) return buildPureProgressiveTargetDelivery(runDir);
  const plan = readPureTargetStoredPlanContext(runDir);
  const raw = readTargetAcceptedRawWork(plan, plan.raw_work_plan);
  const reviewed = readPureTargetFinalizationReview(plan, plan.raw_work_plan, raw.accepted_raw_evidence);
  const manifest = publishPureFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: reviewed.raw_bytes_by_slide,
  });
  assertPureFinalMatchesReviewedProviderPage(reviewed.raw_bytes_by_slide, reviewed.presentation);
  const persisted = writeTargetFinalManifest(plan, {
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalManifest: manifest,
  });
  const delivery = await deliverTargetFinalSlideManifest({
    runDir: plan.run_dir,
    manifest,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalBytesBySlide: raw.raw_bytes_by_slide,
    sourcePath: plan.source_path,
    sourceEpoch: plan.source_epoch,
    title: plan.deck_dir.split(/[\\/]/).at(-1),
  });
  const deliveryState = recordTargetDelivery(plan, delivery.receipt);
  return Object.freeze({ ok: true, plan: pureTargetRawPlanProjection(plan), finalization: persisted, delivery, delivery_state: deliveryState });
}

/** Notes-only target refresh remains a shared delivery operation. */
export async function refreshPureTargetNotes(runDir) {
  preflightPureMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: "pure",
    parseReceipt: parsePureTargetReceipt,
  });
  const candidate = compilePureTargetRawPlanCandidate(refresh);
  if (targetSourceSemanticSha256(refresh.previous_source_receipt, "pure") !==
    targetSourceSemanticSha256(refresh.receipt, "pure")) {
    throw new PureImageWorkflowError("pure_notes_refresh_rebuild_required", "Pure notes refresh requires unchanged pixel-owning source facts; use the selected Pure rebuild path instead");
  }
  const previousFinal = readTargetFinalWork(refresh, {
    sourceReceipt: refresh.previous_source_receipt,
    rawWorkPlan: refresh.previous_raw_work_plan,
    acceptedRawEvidence: refresh.previous_accepted_raw_evidence,
  });
  const reboundEvidence = createAcceptedRawEvidence({
    plan: candidate.raw_work_plan,
    provider_authorization_sha256: refresh.previous_accepted_raw_evidence.provider_authorization_sha256,
    raw_review_sha256: refresh.previous_accepted_raw_evidence.raw_review_sha256,
    raw_bytes_by_slide: refresh.raw_bytes_by_slide,
  });
  const context = rebindTargetLocalComposeWork(candidate, {
    rawWorkPlan: candidate.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    createPreviousReviewContribution: createPureTargetRawReviewContribution,
    validatePreviousCompletePageReview: ({ review_context: reviewContext, raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validatePureCompletePageReview({ context: reviewContext, reviewPlan: rawWorkPlan, rawBytesBySlide, sourceEpoch }),
  });
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan: context.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    ownerWorkflow: "pure",
    finalBytesBySlide: previousFinal.final_bytes_by_slide,
  });
  const persisted = writeTargetFinalManifest(context, {
    rawWorkPlan: context.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    finalManifest: manifest,
  });
  const delivery = await deliverTargetFinalSlideManifest({
    runDir: context.run_dir,
    manifest,
    acceptedRawEvidence: reboundEvidence,
    finalBytesBySlide: previousFinal.final_bytes_by_slide,
    sourcePath: context.source_path,
    sourceEpoch: context.source_epoch,
    title: context.deck_dir.split(/[\\/]/).at(-1),
  });
  const deliveryState = recordTargetDelivery(context, delivery.receipt);
  return Object.freeze({ ok: true, finalization: persisted, delivery, delivery_state: deliveryState });
}