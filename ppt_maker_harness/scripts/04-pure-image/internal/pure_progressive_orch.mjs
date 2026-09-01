import {
  assertNoUnresolvedProgressiveRawSubmission,
  authorizeProgressiveRawBatch,
  createProgressiveRawWorkPlanFromTarget,
  generateProgressiveRawItem,
  inspectProgressiveRawLifecycle,
  planProgressiveRawExpansion,
  planProgressiveRawPilot,
  prepareProgressiveRawCompleteReview,
  prepareProgressiveRawPilotEvidence,
  publishProgressiveRawWorkPlan,
  readCurrentProgressiveRawCompleteReview,
  readCurrentProgressiveRawPilotWork,
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  materializeTargetSourceCandidateContext,
  preflightTargetRawProviderWork,
  writeTargetRawWorkPlan,
  writeTargetProviderRequestInspection,
  writeProgressiveTargetFinalManifest,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { PageDerivedDataError, publishPageDerivedData } from "../../shared/image2/page_derived_data.mjs";
import {
  requireExactExecutionForRun,
  ensureCurrentPageImageTaskMandate,
  inspectCurrentPageImageTaskMandate,
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressiveDeliveryReceipt,
  recordTargetProgressiveFinalManifest,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveRawPlan,
} from "../../shared/state/state.mjs";
import {
  assertPresentCurrentTargetDeliveryIdentity,
  deliverTargetFinalSlideManifest,
} from "../../05-delivery/index.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import { compilePureTargetRawPlanCandidate, createPureRawWorkPlan, createPureTargetRawReviewContribution } from "./pure_raw_plan.mjs";
import { pureCompletePageReviewInputs, purePilotReviewContribution, publishPureCompletePageReview, validatePureCompletePageReview } from "./pure_review.mjs";
import { publishPureFinalSlideManifest, readPureProgressiveFinalizationReview, assertPureFinalMatchesReviewedProviderPage } from "./pure_final_manifest.mjs";
import { parsePureTargetReceipt, resolvePureTargetCandidateSource } from "./pure_identity.mjs";
import { readPureTargetStoredPlanContext } from "./pure_orchestration.mjs";

function progressivePureDisplayBySlide(receipt) {
  return Object.fromEntries(receipt.slides.map((slide) => [slide.slide_id, { title: slide.header_policy?.provider_visible?.title || "" }]));
}

function progressivePurePlanFromContext(context, taskMandate = null) {
  return createProgressiveRawWorkPlanFromTarget({
    runDir: context.run_dir,
    source_epoch: context.source_epoch,
    raw_work_plan: context.raw_work_plan,
    effective_style_master_sha256: context.style_master_reference.selection_sha256,
    ...(taskMandate?.ok ? { task_mandate_sha256: taskMandate.task_mandate_sha256 } : {}),
  });
}

function publishPurePageDerivedData({ context, candidate, progressiveRawWorkPlan }) {
  try {
    return publishPageDerivedData({
      run_dir: context.run_dir,
      workflow: "pure",
      receipt: candidate.receipt,
      raw_work_plan: candidate.raw_work_plan,
      progressive_raw_work_plan: progressiveRawWorkPlan,
      page_image_core: candidate.page_image_core,
      provider_requests_by_slide: candidate.provider_requests_by_slide,
    });
  } catch (error) {
    if (!(error instanceof PageDerivedDataError)) throw error;
    const failure = new PureImageWorkflowError(
      "target_page_derived_publication_invalid",
      "Pure page-derived data could not be published; repair the current source, presentation, or generated derived root and rerun image2 plan.",
    );
    failure.next_action = "rebuild_target_raw_plan";
    throw failure;
  }
}

function currentPureTaskMandate(context) {
  return inspectCurrentPageImageTaskMandate(context.deck_dir, {
    runDir: context.run_dir,
    workflow: "pure",
  });
}

function preflightPureMutation(runDir) {
  return requireExactExecutionForRun(runDir);
}

/**
 * Compile current Pure source/style facts into an expected replacement plan without
 * reading or rebuilding any version `_generated` projection.
 */
export function readPureProgressiveTargetPlanCandidate(runDir, { sourceEpoch = null, taskMandate = null } = {}) {
  const candidate = compilePureTargetRawPlanCandidate(resolvePureTargetCandidateSource(runDir));
  if (sourceEpoch === null) return candidate;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PureImageWorkflowError("progressive_raw_target_plan_invalid", "a current progressive source epoch is required for Pure plan comparison");
  }
  return Object.freeze({
    ...candidate,
    progressive_raw_work_plan: progressivePurePlanFromContext({ ...candidate, source_epoch: sourceEpoch }, taskMandate),
  });
}

/** Compile and publish the provider-free full plan through the selected Pure adapter. */
export function buildPureProgressiveTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  preflightPureMutation(runDir);
  const prior = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
  assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow: "pure" });
  const candidate = compilePureTargetRawPlanCandidate(resolvePureTargetCandidateSource(runDir));
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  const taskMandate = ensureCurrentPageImageTaskMandate(context.deck_dir, {
    runDir: context.run_dir,
    workflow: "pure",
  });
  // This is a rebuildable adapter projection; direct records own lifecycle facts.
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  const progressiveRawWorkPlan = progressivePurePlanFromContext({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    style_master_reference: candidate.style_master_reference,
  }, taskMandate);
  const derivedDataPublication = publishPurePageDerivedData({
    context,
    candidate,
    progressiveRawWorkPlan,
  });
  const published = publishProgressiveRawWorkPlan({ runDir: context.run_dir, plan: progressiveRawWorkPlan });
  const providerRequestInspection = writeTargetProviderRequestInspection(context, {
    rawWorkPlan: candidate.raw_work_plan,
    progressiveRawWorkPlan,
    providerRequestsBySlide: candidate.provider_requests_by_slide,
  });
  const progressiveHandoff = recordTargetProgressiveRawPlan(context.deck_dir, {
    runDir: context.run_dir,
    progressiveRawWorkPlan,
  });
  return Object.freeze({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    progressive_raw_work_plan: progressiveRawWorkPlan,
    progressive_publication: published,
    progressive_handoff: progressiveHandoff,
    derived_data_publication: derivedDataPublication,
    provider_request_inspection: providerRequestInspection,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    style_master_reference: candidate.style_master_reference,
  });
}

/** Resolve the selected Pure source and its exact current raw-plan binding. */
export function readPureProgressiveTargetStoredPlanContext(runDir) {
  const context = readPureTargetStoredPlanContext(runDir);
  const taskMandate = currentPureTaskMandate(context);
  const progressiveRawWorkPlan = progressivePurePlanFromContext(context, taskMandate);
  return Object.freeze({ ...context, progressive_raw_work_plan: progressiveRawWorkPlan, progressive_raw_task_mandate: taskMandate });
}

export function pureProgressiveRawPlanProjection(plan) {
  const inspection = inspectProgressiveRawLifecycle({
    runDir: plan.run_dir,
    workflow: "pure",
    expected_plan: plan.progressive_raw_work_plan,
    task_mandate: plan.progressive_raw_task_mandate,
  });
  return Object.freeze({
    schema: "page-image-progressive-raw-plan-projection",
    plan_hash: plan.progressive_raw_work_plan.sha256,
    workflow: "pure",
    source_epoch: plan.source_epoch,
    ordered_slide_ids: Object.freeze([...plan.progressive_raw_work_plan.ordered_slide_ids]),
    maximum_submissions: plan.progressive_raw_work_plan.items.length,
    ...(plan.provider_request_inspection ? { provider_request_inspection: plan.provider_request_inspection } : {}),
    progress: inspection.progress || null,
    next_action: inspection.primary_action,
  });
}

export async function planPureTargetPilot(runDir, { planHash, slideIds } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    slide_ids: slideIds,
    display_by_slide: progressivePureDisplayBySlide(plan.receipt),
    expected_plan: plan.progressive_raw_work_plan,
    task_mandate: plan.progressive_raw_task_mandate,
  });
}

export async function planPureTargetExpansion(runDir, { planHash } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawExpansion({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    display_by_slide: progressivePureDisplayBySlide(plan.receipt),
    expected_plan: plan.progressive_raw_work_plan,
    task_mandate: plan.progressive_raw_task_mandate,
  });
}

export async function authorizePureProgressiveRawBatch(runDir, { planHash, batchHash } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  preflightTargetRawProviderWork(plan.raw_work_plan, { providerRequestsBySlide: plan.provider_requests_by_slide });
  return authorizeProgressiveRawBatch({ runDir: plan.run_dir, workflow: "pure", plan_hash: planHash, batch_hash: batchHash, expected_plan: plan.progressive_raw_work_plan, task_mandate: plan.progressive_raw_task_mandate });
}

export async function generatePureProgressiveRawItem(runDir, { planHash, batchHash, preflight = null, submit } = {}) {
  preflightPureMutation(runDir);
  assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow: "pure" });
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  preflightTargetRawProviderWork(plan.raw_work_plan, { providerRequestsBySlide: plan.provider_requests_by_slide });
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    preflight: async (input) => {
      const current = readPureProgressiveTargetStoredPlanContext(runDir);
      if (current.progressive_raw_work_plan.sha256 !== planHash) {
        throw new PureImageWorkflowError("progressive_raw_plan_stale", "Page Image source or provider profile changed before the attempt claim");
      }
      preflightTargetRawProviderWork(current.raw_work_plan, { providerRequestsBySlide: current.provider_requests_by_slide });
      if (preflight) await preflight(input);
    },
    submit,
    task_mandate: plan.progressive_raw_task_mandate,
  });
}

/** Publish final and delivery projections from exact accepted raw evidence only. */
export async function buildPureProgressiveTargetDelivery(runDir) {
  preflightPureMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: plan.progressive_raw_work_plan.sha256,
    expected_plan: plan.progressive_raw_work_plan,
  });
  const reviewedPresentation = readPureProgressiveFinalizationReview(
    plan,
    raw.plan,
    raw.raw_bytes_by_slide,
    raw.complete_raw_review,
  );
  const manifest = publishPureFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    evidencePlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
  assertPureFinalMatchesReviewedProviderPage(raw.raw_bytes_by_slide, reviewedPresentation);
  const persisted = writeProgressiveTargetFinalManifest(plan, {
    progressiveRawWorkPlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalManifest: manifest,
  });
  const finalHandoff = recordTargetProgressiveFinalManifest(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: raw.plan,
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
  const deliveryHandoff = recordTargetProgressiveDeliveryReceipt(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: raw.plan,
    deliveryReceipt: delivery.receipt,
  });
  return Object.freeze({
    ok: true,
    plan: pureProgressiveRawPlanProjection(plan),
    finalization: persisted,
    delivery,
    progressive_handoff: deliveryHandoff.record,
    final_handoff: finalHandoff.record,
  });
}