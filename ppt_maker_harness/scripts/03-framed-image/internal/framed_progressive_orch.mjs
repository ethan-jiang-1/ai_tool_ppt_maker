import { verifyFramedHeaderOverlays } from "./framed_render_contract.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  createTargetRawReviewContribution,
  materializeTargetSourceCandidateContext,
  preflightTargetRawProviderWork,
  resolveTargetProgressiveLocalRebindContext,
  targetRawPlanProjection,
  writeTargetProviderRequestInspection,
  writeTargetRawWorkPlan,
  writeTargetFinalManifest,
  writeProgressiveTargetFinalManifest,
  recordTargetDelivery,
} from "../../shared/image2/page_image_target_runtime.mjs";
import {
  acceptProgressiveRawCompleteReview,
  acceptProgressiveRawPilot,
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
  deliverTargetFinalSlideManifest,
  assertPresentCurrentTargetDeliveryIdentity,
} from "../../05-delivery/index.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, preflightFramedMutation, parseFramedTargetReceipt, resolveFramedTargetCandidateSource, requireReceipt, SHA256_RE } from "./framed_identity.mjs";
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
  requireFramedCurrentCompleteReview,
  assertFramedFinalMatchesReviewedComposite,
  readFramedProgressiveFinalizationReview,
} from "./framed_review.mjs";
import { composeFramedFinalSlideManifest } from "./framed_final_manifest.mjs";
import {
  publishFramedProgressivePilot,
  validateFramedProgressivePilot,
  requireFramedProgressivePilotReviewInput,
  publishFramedProgressiveCompletePageReview,
  validateFramedProgressiveCompletePageReview,
} from "./framed_progressive.mjs";
import { classifyFramedProgressiveLocalRebind } from "./framed_refresh.mjs";
import {
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressiveDeliveryReceipt,
  recordTargetProgressiveFinalManifest,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveRawPlan,
  ensureCurrentPageImageTaskMandate,
  inspectCurrentPageImageTaskMandate,
} from "../../shared/state/state.mjs";
import {
  rebindTargetProgressiveLocalComposeWork,
} from "../../shared/image2/page_image_target_runtime.mjs";

function progressiveFramedDisplayBySlide(receipt) {
  return Object.fromEntries(receipt.slides.map((slide) => [slide.slide_id, { title: slide.header_policy?.local_header?.title || "" }]));
}

function progressiveFramedPlanFromContext(context, taskMandate = null) {
  return createProgressiveRawWorkPlanFromTarget({
    runDir: context.run_dir,
    source_epoch: context.source_epoch,
    raw_work_plan: context.raw_work_plan,
    effective_style_master_sha256: context.style_master_reference.selection_sha256,
    ...(taskMandate?.ok ? { task_mandate_sha256: taskMandate.task_mandate_sha256 } : {}),
  });
}

function currentFramedTaskMandate(context) {
  return inspectCurrentPageImageTaskMandate(context.deck_dir, {
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
  });
}

function progressiveLocalRebindProjectionUnavailable(error) {
  return ["target_previous_source_receipt_required", "target_previous_raw_plan_required"].includes(error?.code);
}

/**
 * Compile the current Framed source/style facts into an expected replacement plan
 * without reading or rebuilding any version `_generated` projection.
 */
export function readFramedProgressiveTargetPlanCandidate(runDir, { sourceEpoch = null, taskMandate = null } = {}) {
  const candidate = compileFramedTargetRawPlanCandidate(resolveFramedTargetCandidateSource(runDir));
  if (sourceEpoch === null) return candidate;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new FramedImageWorkflowError("progressive_raw_target_plan_invalid", "a current progressive source epoch is required for Framed plan comparison");
  }
  return Object.freeze({
    ...candidate,
    progressive_raw_work_plan: progressiveFramedPlanFromContext({ ...candidate, source_epoch: sourceEpoch }, taskMandate),
  });
}

/**
 * Read-only Framed local-rebind preflight. The raw owner remains the source
 * of accepted bytes/evidence; the prior raw projection is consulted only by
 * the existing narrow retention validator and never as lifecycle authority.
 */
export function inspectFramedProgressiveLocalRebind(runDir, { planHash, candidate } = {}) {
  const next = candidate || readFramedProgressiveTargetPlanCandidate(runDir, {});
  if (!next?.progressive_raw_work_plan) {
    throw new FramedImageWorkflowError("progressive_raw_target_plan_invalid", "Framed local-rebind inspection requires a current candidate plan");
  }
  const previous = readProgressiveAcceptedRawWork({
    runDir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
  });
  let rebindContext;
  try {
    rebindContext = resolveTargetProgressiveLocalRebindContext(runDir, {
      workflow: FRAMED_IMAGE_WORKFLOW,
      parseReceipt: parseFramedTargetReceipt,
    });
  } catch (error) {
    if (progressiveLocalRebindProjectionUnavailable(error)) {
      return Object.freeze({ available: false, classification: null });
    }
    throw error;
  }
  const classification = classifyFramedProgressiveLocalRebind({
    previousReceipt: rebindContext.previous_source_receipt,
    nextReceipt: next.receipt,
    rawWorkPlan: rebindContext.previous_raw_work_plan,
    nextRawWorkPlan: next.raw_work_plan,
    progressiveRawWorkPlan: previous.plan,
    acceptedRawEvidence: previous.accepted_raw_evidence,
  });
  return Object.freeze({
    available: true,
    classification,
    progressive_raw_work_plan: next.progressive_raw_work_plan,
  });
}

/** Compile/prove selected Framed source then publish only its provider-free full plan. */
export async function buildFramedProgressiveTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  preflightFramedMutation(runDir);
  const prior = inspectProgressiveRawLifecycle({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  let rebindContext = null;
  if (prior.ok && prior.plan && prior.evidence?.accepted_raw_evidence_sha256) {
    try {
      rebindContext = resolveTargetProgressiveLocalRebindContext(runDir, {
        workflow: FRAMED_IMAGE_WORKFLOW,
        parseReceipt: parseFramedTargetReceipt,
      });
    } catch (error) {
      if (!progressiveLocalRebindProjectionUnavailable(error)) throw error;
    }
  }
  const candidate = compileFramedTargetRawPlanCandidate(rebindContext || resolveFramedTargetCandidateSource(runDir));
  const proof = await verifyFramedHeaderOverlays(candidate.receipt.slides.map(framedHeaderOverlayInput));
  verifyFramedCandidateProof(candidate, proof);
  if (rebindContext) {
    const previous = readProgressiveAcceptedRawWork({
      runDir,
      workflow: FRAMED_IMAGE_WORKFLOW,
      plan_hash: prior.plan.plan_hash,
    });
    const classification = classifyFramedProgressiveLocalRebind({
      previousReceipt: rebindContext.previous_source_receipt,
      nextReceipt: candidate.receipt,
      rawWorkPlan: rebindContext.previous_raw_work_plan,
      nextRawWorkPlan: candidate.raw_work_plan,
      progressiveRawWorkPlan: previous.plan,
      acceptedRawEvidence: previous.accepted_raw_evidence,
    });
    if (classification.kind === "local_compose") {
      const taskMandate = ensureCurrentPageImageTaskMandate(candidate.deck_dir, {
        runDir: candidate.run_dir,
        workflow: FRAMED_IMAGE_WORKFLOW,
      });
      const progressiveRawWorkPlan = progressiveFramedPlanFromContext({
        ...candidate,
        source_epoch: previous.plan.source_epoch,
      }, taskMandate);
      const derivedDataPublication = publishFramedPageDerivedData({
        context: candidate,
        candidate,
        progressiveRawWorkPlan,
      });
      const progressivePublication = publishProgressiveRawWorkPlan({
        runDir,
        plan: progressiveRawWorkPlan,
        reuse_current_materializations: true,
        retain_current_complete_review: true,
      });
      const successor = readProgressiveAcceptedRawWork({
        runDir,
        workflow: FRAMED_IMAGE_WORKFLOW,
        plan_hash: progressiveRawWorkPlan.sha256,
        expected_plan: progressiveRawWorkPlan,
      });
      const context = rebindTargetProgressiveLocalComposeWork(rebindContext, {
        rawWorkPlan: candidate.raw_work_plan,
        previousProgressiveRawWorkPlan: previous.plan,
        nextProgressiveRawWorkPlan: successor.plan,
        previousAcceptedRawEvidence: previous.accepted_raw_evidence,
        nextAcceptedRawEvidence: successor.accepted_raw_evidence,
      });
      const providerRequestInspection = writeTargetProviderRequestInspection(context, {
        rawWorkPlan: candidate.raw_work_plan,
        progressiveRawWorkPlan: successor.plan,
        providerRequestsBySlide: candidate.provider_requests_by_slide,
      });
      return Object.freeze({
        ...context,
        raw_work_plan: candidate.raw_work_plan,
        progressive_raw_work_plan: successor.plan,
        progressive_publication: progressivePublication,
        progressive_handoff: context.rebound_state.progressive_handoff,
        derived_data_publication: derivedDataPublication,
        provider_request_inspection: providerRequestInspection,
        provider_requests_by_slide: candidate.provider_requests_by_slide,
        style_master_reference: candidate.style_master_reference,
      });
    }
  }
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  const taskMandate = ensureCurrentPageImageTaskMandate(context.deck_dir, {
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
  });
  // The current plan is only a rebuildable adapter projection for review rendering.
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  const progressiveRawWorkPlan = progressiveFramedPlanFromContext({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    style_master_reference: candidate.style_master_reference,
  }, taskMandate);
  const derivedDataPublication = publishFramedPageDerivedData({
    context,
    candidate,
    progressiveRawWorkPlan,
  });
  const progressivePublication = publishProgressiveRawWorkPlan({ runDir: context.run_dir, plan: progressiveRawWorkPlan });
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
    progressive_publication: progressivePublication,
    progressive_handoff: progressiveHandoff,
    derived_data_publication: derivedDataPublication,
    provider_request_inspection: providerRequestInspection,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    style_master_reference: candidate.style_master_reference,
  });
}

export function readFramedProgressiveTargetStoredPlanContext(runDir) {
  const context = readFramedTargetStoredPlanContext(runDir);
  const taskMandate = currentFramedTaskMandate(context);
  return Object.freeze({
    ...context,
    progressive_raw_work_plan: progressiveFramedPlanFromContext(context, taskMandate),
    progressive_raw_task_mandate: taskMandate,
  });
}

export function framedProgressiveRawPlanProjection(plan) {
  const inspection = inspectProgressiveRawLifecycle({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    expected_plan: plan.progressive_raw_work_plan,
    task_mandate: plan.progressive_raw_task_mandate,
  });
  return Object.freeze({
    schema: "page-image-progressive-raw-plan-projection",
    plan_hash: plan.progressive_raw_work_plan.sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    source_epoch: plan.source_epoch,
    ordered_slide_ids: Object.freeze([...plan.progressive_raw_work_plan.ordered_slide_ids]),
    maximum_submissions: plan.progressive_raw_work_plan.items.length,
    ...(plan.provider_request_inspection ? { provider_request_inspection: plan.provider_request_inspection } : {}),
    progress: inspection.progress || null,
    next_action: inspection.primary_action,
  });
}

export async function planFramedTargetPilot(runDir, { planHash, slideIds } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawPilot({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, slide_ids: slideIds, display_by_slide: progressiveFramedDisplayBySlide(plan.receipt), expected_plan: plan.progressive_raw_work_plan, task_mandate: plan.progressive_raw_task_mandate });
}

export async function planFramedTargetExpansion(runDir, { planHash } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawExpansion({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, display_by_slide: progressiveFramedDisplayBySlide(plan.receipt), expected_plan: plan.progressive_raw_work_plan, task_mandate: plan.progressive_raw_task_mandate });
}

export async function authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  preflightTargetRawProviderWork(plan.raw_work_plan, { providerRequestsBySlide: plan.provider_requests_by_slide });
  return authorizeProgressiveRawBatch({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, batch_hash: batchHash, expected_plan: plan.progressive_raw_work_plan, task_mandate: plan.progressive_raw_task_mandate });
}

export async function generateFramedProgressiveRawItem(runDir, { planHash, batchHash, preflight = null, submit } = {}) {
  preflightFramedMutation(runDir);
  assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  preflightTargetRawProviderWork(plan.raw_work_plan, { providerRequestsBySlide: plan.provider_requests_by_slide });
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    preflight: async (input) => {
      const current = readFramedProgressiveTargetStoredPlanContext(runDir);
      if (current.progressive_raw_work_plan.sha256 !== planHash) {
        throw new FramedImageWorkflowError("progressive_raw_plan_stale", "Page Image source or provider profile changed before the attempt claim");
      }
      preflightTargetRawProviderWork(current.raw_work_plan, { providerRequestsBySlide: current.provider_requests_by_slide });
      if (preflight) await preflight(input);
    },
    submit,
    task_mandate: plan.progressive_raw_task_mandate,
  });
}

export async function prepareFramedProgressivePilotReview(runDir, input = {}) {
  const { planHash, batchHash } = requireFramedProgressivePilotReviewInput(input);
  preflightFramedMutation(runDir);
  const context = readFramedProgressiveTargetStoredPlanContext(runDir);
  return prepareProgressiveRawPilotEvidence({
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    publish: ({ plan, ...input }) => publishFramedProgressivePilot({ context, plan, ...input }),
  });
}

/** Read and validate the current Framed partial Pilot presentation without writing. */
export function inspectFramedProgressivePilotPageReview(runDir) {
  const context = readFramedProgressiveTargetStoredPlanContext(runDir);
  const pilot = readCurrentProgressiveRawPilotWork({
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    expected_plan: context.progressive_raw_work_plan,
  });
  if (!pilot.available) return pilot;
  const presentation = validateFramedProgressivePilot({
    context,
    plan: pilot.plan,
    batch: pilot.batch,
    batch_sha256: pilot.batch.sha256,
    coverage: pilot.pilot_evidence.items,
    materializations: pilot.materializations,
  });
  if (!presentation.ok) {
    throw new FramedImageWorkflowError(presentation.code, presentation.message);
  }
  return Object.freeze({ ...pilot, presentation });
}

export async function acceptFramedProgressivePilot(runDir, { planHash, batchHash, decision } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    decision,
    validatePilotReview: ({ plan: reviewPlan, batch, batch_sha256, coverage, materializations }) =>
      validateFramedProgressivePilot({
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

export async function prepareFramedProgressiveRawReview(runDir, { planHash } = {}) {
  preflightFramedMutation(runDir);
  const context = readFramedProgressiveTargetStoredPlanContext(runDir);
  const prepared = await prepareProgressiveRawCompleteReview({
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    publish: async ({ plan, materializations }) => publishFramedProgressiveCompletePageReview({ context, plan, materializations }),
  });
  const handoff = prepared.accepted_raw_evidence_sha256
    ? recordTargetProgressiveAcceptedRawEvidence(context.deck_dir, {
      runDir: context.run_dir,
      progressiveRawWorkPlan: context.progressive_raw_work_plan,
      acceptedRawEvidence: readProgressiveAcceptedRawWork({
        runDir: context.run_dir,
        workflow: FRAMED_IMAGE_WORKFLOW,
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

export async function acceptFramedProgressiveRawReview(runDir, { planHash, decision } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    decision,
    validate: ({ plan: reviewPlan, materializations }) =>
      validateFramedProgressiveCompletePageReview({ context: plan, plan: reviewPlan, materializations }),
  });
  const handoff = accepted.accepted_raw_evidence_sha256
    ? recordTargetProgressiveAcceptedRawEvidence(plan.deck_dir, {
      runDir: plan.run_dir,
      progressiveRawWorkPlan: plan.progressive_raw_work_plan,
      acceptedRawEvidence: readProgressiveAcceptedRawWork({
        runDir: plan.run_dir,
        workflow: FRAMED_IMAGE_WORKFLOW,
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

export async function reconcileFramedProgressiveRawAttempt(runDir, { planHash, attemptSha256, lookup = null } = {}) {
  preflightFramedMutation(runDir);
  return reconcileProgressiveRawAttempt({
    runDir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    attempt_sha256: attemptSha256,
    lookup,
  });
}

/** Read and validate the current accepted Framed complete-page review without writing. */
export function inspectFramedProgressiveCompletePageReview(runDir) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: plan.progressive_raw_work_plan.sha256,
    expected_plan: plan.progressive_raw_work_plan,
  });
  const presentation = readFramedProgressiveFinalizationReview(
    plan,
    raw.plan,
    raw.raw_bytes_by_slide,
    raw.complete_raw_review,
  );
  return Object.freeze({ plan, raw, presentation });
}

/** Read and validate the current undecided Framed Complete Page Review without writing. */
export function inspectFramedProgressiveCurrentCompletePageReview(runDir) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const raw = readCurrentProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    expected_plan: plan.progressive_raw_work_plan,
  });
  if (!raw.available) return raw;
  const presentation = requireFramedCurrentCompleteReview(
    validateFramedProgressiveCompletePageReview({
      context: plan,
      plan: raw.plan,
      materializations: raw.materializations,
    }),
    raw.complete_raw_review,
  );
  return Object.freeze({ available: true, plan, raw, presentation });
}

/** Compose, publish, and deliver only from exact current accepted raw evidence. */
export async function buildFramedProgressiveTargetDelivery(runDir) {
  preflightFramedMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: plan.progressive_raw_work_plan.sha256,
    expected_plan: plan.progressive_raw_work_plan,
  });
  const reviewedPresentation = readFramedProgressiveFinalizationReview(
    plan,
    raw.plan,
    raw.raw_bytes_by_slide,
    raw.complete_raw_review,
  );
  const finalization = await composeFramedFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    evidencePlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
  assertFramedFinalMatchesReviewedComposite(finalization.final_bytes_by_slide, reviewedPresentation);
  const persisted = writeProgressiveTargetFinalManifest(plan, {
    progressiveRawWorkPlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    finalManifest: finalization.manifest,
  });
  const finalHandoff = recordTargetProgressiveFinalManifest(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: raw.plan,
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
  const deliveryHandoff = recordTargetProgressiveDeliveryReceipt(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: raw.plan,
    deliveryReceipt: delivery.receipt,
  });
  return Object.freeze({
    ok: true,
    plan: framedProgressiveRawPlanProjection(plan),
    finalization: persisted,
    delivery,
    progressive_handoff: deliveryHandoff.record,
    final_handoff: finalHandoff.record,
  });
}

import { readFramedTargetStoredPlanContext } from "./framed_orchestration.mjs";