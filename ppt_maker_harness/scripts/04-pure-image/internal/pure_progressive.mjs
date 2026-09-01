import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  publishPilotPageReviewPresentation,
  validatePilotPageReviewPresentation,
} from "../../shared/image2/page_image_complete_page_review.mjs";
import {
  acceptProgressiveRawPilot,
  acceptProgressiveRawCompleteReview,
  prepareProgressiveRawCompleteReview,
  prepareProgressiveRawPilotEvidence,
  readCurrentProgressiveRawCompleteReview,
  readCurrentProgressiveRawPilotWork,
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  requireExactExecutionForRun,
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressivePilotDecision,
} from "../../shared/state/state.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import { pureCompletePageReviewInputs, purePilotReviewContribution, publishPureCompletePageReview, validatePureCompletePageReview } from "./pure_review.mjs";
import { readPureProgressiveTargetStoredPlanContext } from "./pure_progressive_orch.mjs";
import { readPureProgressiveFinalizationReview } from "./pure_final_manifest.mjs";

function preflightPureMutation(runDir) {
  return requireExactExecutionForRun(runDir);
}

async function publishPureProgressivePilot({ context, plan, batch_sha256, coverage, materializations }) {
  const pilotSlideIds = coverage.map((item) => item.slide_id);
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    if (!materialization) throw new PureImageWorkflowError("pure_pilot_coverage_invalid", `Pure Pilot coverage is unavailable for ${slideId}`);
    return [slideId, Buffer.from(materialization.bytes)];
  }));
  const inputs = pureCompletePageReviewInputs({
    context,
    reviewPlan: plan,
    rawBytesBySlide,
    reviewSlideIds: pilotSlideIds,
  });
  const typedReviewContributionSha256 = purePilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage });
  const published = await publishPilotPageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    batchSha256: batch_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: "pure",
    typedReviewContributionSha256,
    orderedPlanSlideIds: plan.ordered_slide_ids,
    pilotSlideIds,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
  return Object.freeze({
    workflow_evidence_sha256: published.pilot_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

function validatePureProgressivePilot({ context, plan, batch, batch_sha256, coverage, materializations } = {}) {
  const pilotSlideIds = batch.review_sample_slide_ids;
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    return [slideId, materialization ? Buffer.from(materialization.bytes) : null];
  }));
  try {
    const inputs = pureCompletePageReviewInputs({
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
      workflow: "pure",
      typedReviewContributionSha256: purePilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage }),
      orderedPlanSlideIds: plan.ordered_slide_ids,
      pilotSlideIds,
      rawBytesBySlide: inputs.raw_bytes_by_slide,
      adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "pure_pilot_review_invalid",
      message: error.message || "Pure Pilot page review is invalid",
    });
  }
}

function progressiveRawBytes(materializations) {
  return Object.fromEntries([...materializations.entries()].map(([slideId, materialization]) => [slideId, Buffer.from(materialization.bytes)]));
}

async function publishPureProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  const published = await publishPureCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveRawBytes(materializations),
  });
  return Object.freeze({
    workflow_evidence_sha256: published.complete_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

function validatePureProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  return validatePureCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveRawBytes(materializations),
  });
}

function requirePureCurrentCompleteReview(validation, currentCompleteReview) {
  if (!validation?.ok || !currentCompleteReview ||
    validation.complete_page_presentation_sha256 !== currentCompleteReview.workflow_evidence_sha256 ||
    validation.projection_sha256 !== currentCompleteReview.projection_sha256) {
    throw new PureImageWorkflowError(
      "pure_current_complete_review_stale",
      "Pure current Complete Page Review no longer binds its provider and presentation evidence",
    );
  }
  return validation.presentation;
}

export async function preparePureProgressivePilotReview(runDir, { planHash, batchHash } = {}) {
  preflightPureMutation(runDir);
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  return prepareProgressiveRawPilotEvidence({
    runDir: context.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    batch_hash: batchHash,
    publish: ({ plan, ...input }) => publishPureProgressivePilot({ context, plan, ...input }),
  });
}

/** Read and validate the current Pure partial Pilot presentation without writing. */
export function inspectPureProgressivePilotPageReview(runDir) {
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  const pilot = readCurrentProgressiveRawPilotWork({
    runDir: context.run_dir,
    workflow: "pure",
    expected_plan: context.progressive_raw_work_plan,
  });
  if (!pilot.available) return pilot;
  const presentation = validatePureProgressivePilot({
    context,
    plan: pilot.plan,
    batch: pilot.batch,
    batch_sha256: pilot.batch.sha256,
    coverage: pilot.pilot_evidence.items,
    materializations: pilot.materializations,
  });
  if (!presentation.ok) {
    throw new PureImageWorkflowError(presentation.code, presentation.message);
  }
  return Object.freeze({ ...pilot, presentation });
}

export async function acceptPureProgressivePilot(runDir, { planHash, batchHash, decision } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    batch_hash: batchHash,
    decision,
    validatePilotReview: ({ plan: reviewPlan, batch, batch_sha256, coverage, materializations }) =>
      validatePureProgressivePilot({
        context: plan,
        plan: reviewPlan,
        batch,
        batch_sha256,
        coverage,
        materializations,
      }),
  });
  const handoff = recordTargetProgressivePilotDecision(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: plan.progressive_raw_work_plan,
    pilotDecisionSha256: accepted.pilot_decision_sha256,
  });
  return Object.freeze({ ...accepted, progressive_handoff: handoff.record });
}

export async function preparePureProgressiveRawReview(runDir, { planHash } = {}) {
  preflightPureMutation(runDir);
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  const prepared = await prepareProgressiveRawCompleteReview({
    runDir: context.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    publish: async ({ plan, materializations }) => publishPureProgressiveCompletePageReview({ context, plan, materializations }),
  });
  const handoff = prepared.accepted_raw_evidence_sha256
    ? recordTargetProgressiveAcceptedRawEvidence(context.deck_dir, {
      runDir: context.run_dir,
      progressiveRawWorkPlan: context.progressive_raw_work_plan,
      acceptedRawEvidence: readProgressiveAcceptedRawWork({
        runDir: context.run_dir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: context.progressive_raw_work_plan,
      }).accepted_raw_evidence,
    })
    : recordTargetProgressiveCompleteRawReview(context.deck_dir, {
      runDir: context.run_dir,
      progressiveRawWorkPlan: context.progressive_raw_work_plan,
      completeRawReviewSha256: prepared.complete_raw_review_sha256,
    });
  return Object.freeze({ ...prepared, progressive_handoff: handoff.record });
}

export async function acceptPureProgressiveRawReview(runDir, { planHash, decision } = {}) {
  preflightPureMutation(runDir);
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: planHash,
    decision,
    validate: ({ plan: reviewPlan, materializations }) =>
      validatePureProgressiveCompletePageReview({ context: plan, plan: reviewPlan, materializations }),
  });
  const handoff = accepted.accepted_raw_evidence_sha256
    ? recordTargetProgressiveAcceptedRawEvidence(plan.deck_dir, {
      runDir: plan.run_dir,
      progressiveRawWorkPlan: plan.progressive_raw_work_plan,
      acceptedRawEvidence: readProgressiveAcceptedRawWork({
        runDir: plan.run_dir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      }).accepted_raw_evidence,
    })
    : recordTargetProgressiveCompleteRawReview(plan.deck_dir, {
      runDir: plan.run_dir,
      progressiveRawWorkPlan: plan.progressive_raw_work_plan,
      completeRawReviewSha256: accepted.complete_raw_review_sha256,
    });
  return Object.freeze({ ...accepted, progressive_handoff: handoff.record });
}

export async function reconcilePureProgressiveRawAttempt(runDir, { planHash, attemptSha256, lookup = null } = {}) {
  preflightPureMutation(runDir);
  return reconcileProgressiveRawAttempt({
    runDir,
    workflow: "pure",
    plan_hash: planHash,
    attempt_sha256: attemptSha256,
    lookup,
  });
}

/** Read and validate the current accepted Pure complete-page review without writing. */
export function inspectPureProgressiveCompletePageReview(runDir) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: "pure",
    plan_hash: plan.progressive_raw_work_plan.sha256,
    expected_plan: plan.progressive_raw_work_plan,
  });
  const presentation = readPureProgressiveFinalizationReview(
    plan,
    raw.plan,
    raw.raw_bytes_by_slide,
    raw.complete_raw_review,
  );
  return Object.freeze({ plan, raw, presentation });
}

/** Read and validate the current undecided Pure Complete Page Review without writing. */
export function inspectPureProgressiveCurrentCompletePageReview(runDir) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const raw = readCurrentProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: "pure",
    expected_plan: plan.progressive_raw_work_plan,
  });
  if (!raw.available) return raw;
  const presentation = requirePureCurrentCompleteReview(
    validatePureProgressiveCompletePageReview({
      context: plan,
      plan: raw.plan,
      materializations: raw.materializations,
    }),
    raw.complete_raw_review,
  );
  return Object.freeze({ available: true, plan, raw, presentation });
}