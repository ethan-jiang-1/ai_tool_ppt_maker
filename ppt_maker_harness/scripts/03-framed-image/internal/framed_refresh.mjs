import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { evaluatePageImageInvalidation } from "../../shared/page-image/page_image_invalidation.mjs";
import {
  createAcceptedRawEvidence,
  validateRawWorkPlan,
} from "../../shared/image2/page_image_artifacts.mjs";
import {
  rebindTargetLocalComposeWork,
  resolveTargetLocalComposeContext,
  resolveTargetProgressiveLocalRebindContext,
  targetSourceSemanticSha256,
  readTargetFinalWork,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { publishCurrentFinalSlideManifest } from "../../shared/image2/page_image_final_manifest.mjs";
import { refreshTargetPageImageNotes } from "../../05-delivery/index.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, parseFramedTargetReceipt, preflightFramedMutation, requireReceipt } from "./framed_identity.mjs";
import { compileFramedTargetRawPlanCandidate, createFramedTargetRawReviewContribution } from "./framed_raw_plan.mjs";
import { validateFramedCompletePageReview } from "./framed_review.mjs";
import { composeFramedFinalSlideManifest } from "./framed_final_manifest.mjs";
import { writeTargetFinalManifest, recordTargetDelivery } from "../../shared/image2/page_image_target_runtime.mjs";
import { deliverTargetFinalSlideManifest, assertPresentCurrentTargetDeliveryIdentity } from "../../05-delivery/index.mjs";
import {
  inspectProgressiveRawLifecycle,
  readProgressiveAcceptedRawWork,
} from "../../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  readFramedProgressiveTargetPlanCandidate,
  inspectFramedProgressiveLocalRebind,
  buildFramedProgressiveTargetRawPlan,
  buildFramedProgressiveTargetDelivery,
} from "./framed_progressive_orch.mjs";
import { framedTargetRawPlanProjection } from "./framed_orchestration.mjs";

function mapFramedInvalidation(classified) {
  return Object.freeze({
    ...classified,
    kind: classified.kind === "local_overlay_refresh" ? "local_compose" :
      classified.kind === "raw_rebuild" ? "rebuild_raw" : classified.kind,
  });
}

/** Classify Framed drift from current compiled-input and evidence bindings. */
export function classifyFramedRefresh({ previousReceipt, nextReceipt, rawWorkPlan = null, acceptedRawEvidence = null, nextRawWorkPlan = null } = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  return mapFramedInvalidation(evaluatePageImageInvalidation({
    previousReceipt,
    nextReceipt,
    previousRawWorkPlan: rawWorkPlan,
    nextRawWorkPlan,
    acceptedRawEvidence,
  }));
}

/**
 * Apply the same Framed header-overlay retention validator to direct current
 * evidence without treating a rebuildable accepted-evidence projection as
 * canonical authority.
 */
export function classifyFramedProgressiveLocalRebind({
  previousReceipt,
  nextReceipt,
  rawWorkPlan = null,
  nextRawWorkPlan = null,
  progressiveRawWorkPlan = null,
  acceptedRawEvidence = null,
} = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  return mapFramedInvalidation(evaluatePageImageInvalidation({
    previousReceipt,
    nextReceipt,
    previousRawWorkPlan: rawWorkPlan,
    nextRawWorkPlan,
    acceptedRawEvidence,
    acceptedRawWorkPlan: progressiveRawWorkPlan,
  }));
}

function changedFramedHeaderOverlaySlideIds(previousReceipt, nextReceipt) {
  const nextById = new Map(nextReceipt.slides.map((slide) => [slide.slide_id, slide]));
  return previousReceipt.slides
    .filter((slide) => canonicalJsonSha256(slide.header_policy) !== canonicalJsonSha256(nextById.get(slide.slide_id)?.header_policy))
    .map((slide) => slide.slide_id);
}

function selectedFramedRefreshIds(previousReceipt, nextReceipt, slideIds) {
  const knownIds = new Set(nextReceipt.slides.map((slide) => slide.slide_id));
  if (slideIds === null) return nextReceipt.slides.map((slide) => slide.slide_id);
  if (!Array.isArray(slideIds) || slideIds.length === 0 || new Set(slideIds).size !== slideIds.length ||
    slideIds.some((slideId) => typeof slideId !== "string" || !knownIds.has(slideId))) {
    throw new FramedImageWorkflowError("framed_refresh_slide_selection_invalid", "Framed local refresh requires exact current stable slide IDs");
  }
  const selected = new Set(slideIds);
  const changed = changedFramedHeaderOverlaySlideIds(previousReceipt, nextReceipt);
  if (changed.some((slideId) => !selected.has(slideId))) {
    throw new FramedImageWorkflowError("framed_refresh_slide_selection_incomplete", "Framed local refresh selection must include every changed header overlay");
  }
  return [...slideIds];
}

function currentAcceptedFramedProgressiveRaw(runDir) {
  const current = inspectProgressiveRawLifecycle({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  return current.ok && current.plan && current.evidence?.accepted_raw_evidence_sha256 ? current : null;
}

async function refreshFramedProgressiveTargetText(runDir, { slideIds }) {
  const current = currentAcceptedFramedProgressiveRaw(runDir);
  if (!current) return null;
  const candidate = readFramedProgressiveTargetPlanCandidate(runDir, {
    sourceEpoch: current.plan.source_epoch,
  });
  const localRebind = inspectFramedProgressiveLocalRebind(runDir, {
    planHash: current.plan.plan_hash,
    candidate,
  });
  if (!localRebind.available || localRebind.classification?.kind !== "local_compose") {
    throw new FramedImageWorkflowError(
      "framed_local_compose_rebuild_required",
      "Framed local refresh requires exact unchanged underlay evidence; authorize and rebuild framed raw work instead",
    );
  }
  const previous = resolveTargetProgressiveLocalRebindContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  const refreshedSlideIds = selectedFramedRefreshIds(previous.previous_source_receipt, candidate.receipt, slideIds);
  const rebound = await buildFramedProgressiveTargetRawPlan(runDir, { allowSourceRebuild: true });
  if (rebound.progressive_raw_work_plan.sha256 !== localRebind.progressive_raw_work_plan.sha256) {
    throw new FramedImageWorkflowError("framed_local_compose_rebind_stale", "Framed local refresh did not publish the exact validated progressive successor");
  }
  const delivery = await buildFramedProgressiveTargetDelivery(runDir);
  return Object.freeze({ ...delivery, refreshed_slide_ids: Object.freeze(refreshedSlideIds) });
}

async function refreshFramedProgressiveTargetNotes(runDir) {
  const current = currentAcceptedFramedProgressiveRaw(runDir);
  if (!current) return null;
  const refresh = resolveTargetProgressiveLocalRebindContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  if (targetSourceSemanticSha256(refresh.previous_source_receipt, FRAMED_IMAGE_WORKFLOW) !==
    targetSourceSemanticSha256(refresh.receipt, FRAMED_IMAGE_WORKFLOW)) {
    throw new FramedImageWorkflowError("framed_notes_refresh_rebuild_required", "Framed notes refresh requires unchanged pixel-owning source facts; use the selected Framed rebuild path instead");
  }
  const refreshed = await refreshTargetPageImageNotes({
    runDir: refresh.run_dir,
    sourcePath: refresh.source_path,
    sourceEpoch: current.plan.source_epoch,
  });
  return Object.freeze({ ok: true, delivery: refreshed });
}

/**
 * Recompose a target Framed source edit from exactly accepted prior underlay
 * bytes. This is the only provider-free source transition: source parsing,
 * raw-contract equality, evidence rebinding, manifest publication, and shared
 * delivery all remain bound to the selected Framed owner.
 */
export async function refreshFramedTargetText(runDir, { slideIds = null } = {}) {
  preflightFramedMutation(runDir);
  const progressive = await refreshFramedProgressiveTargetText(runDir, { slideIds });
  if (progressive) return progressive;
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  const candidate = compileFramedTargetRawPlanCandidate(refresh);
  const classified = classifyFramedRefresh({
    previousReceipt: refresh.previous_source_receipt,
    nextReceipt: refresh.receipt,
    rawWorkPlan: refresh.previous_raw_work_plan,
    acceptedRawEvidence: refresh.previous_accepted_raw_evidence,
    nextRawWorkPlan: candidate.raw_work_plan,
  });
  if (classified.kind !== "local_compose") {
    const code = classified.kind === "raw_evidence_required"
      ? "framed_local_compose_raw_evidence_required"
      : "framed_local_compose_rebuild_required";
    throw new FramedImageWorkflowError(code, `Framed local refresh requires exact unchanged underlay evidence (${classified.reason || classified.kind}); authorize and rebuild framed raw work instead`);
  }
  const refreshedSlideIds = selectedFramedRefreshIds(refresh.previous_source_receipt, refresh.receipt, slideIds);
  const reboundEvidence = createAcceptedRawEvidence({
    plan: candidate.raw_work_plan,
    provider_authorization_sha256: refresh.previous_accepted_raw_evidence.provider_authorization_sha256,
    raw_review_sha256: refresh.previous_accepted_raw_evidence.raw_review_sha256,
    raw_bytes_by_slide: refresh.raw_bytes_by_slide,
  });
  const context = rebindTargetLocalComposeWork(candidate, {
    rawWorkPlan: candidate.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    createPreviousReviewContribution: createFramedTargetRawReviewContribution,
    validatePreviousCompletePageReview: ({ review_context: reviewContext, raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validateFramedCompletePageReview({ context: reviewContext, reviewPlan: rawWorkPlan, rawBytesBySlide, sourceEpoch }),
  });
  const finalization = await composeFramedFinalSlideManifest({
    receipt: context.receipt,
    rawWorkPlan: context.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    rawBytesBySlide: context.raw_bytes_by_slide,
  });
  const persisted = writeTargetFinalManifest(context, {
    rawWorkPlan: context.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    finalManifest: finalization.manifest,
  });
  const delivery = await deliverTargetFinalSlideManifest({
    runDir: context.run_dir,
    manifest: finalization.manifest,
    acceptedRawEvidence: reboundEvidence,
    finalBytesBySlide: finalization.final_bytes_by_slide,
    sourcePath: context.source_path,
    sourceEpoch: context.source_epoch,
    title: context.deck_dir.split(/[\\/]/).at(-1),
  });
  const deliveryState = recordTargetDelivery(context, delivery.receipt);
  return Object.freeze({
    ok: true,
    refreshed_slide_ids: Object.freeze(refreshedSlideIds),
    plan: framedTargetRawPlanProjection(context),
    finalization: persisted,
    delivery,
    delivery_state: deliveryState,
  });
}

/** Notes-only target refresh remains a shared delivery operation. */
export async function refreshFramedTargetNotes(runDir) {
  preflightFramedMutation(runDir);
  await assertPresentCurrentTargetDeliveryIdentity({ runDir });
  const progressive = await refreshFramedProgressiveTargetNotes(runDir);
  if (progressive) return progressive;
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  const candidate = compileFramedTargetRawPlanCandidate(refresh);
  if (targetSourceSemanticSha256(refresh.previous_source_receipt, FRAMED_IMAGE_WORKFLOW) !==
    targetSourceSemanticSha256(refresh.receipt, FRAMED_IMAGE_WORKFLOW)) {
    throw new FramedImageWorkflowError("framed_notes_refresh_rebuild_required", "Framed notes refresh requires unchanged pixel-owning source facts; use the selected Framed rebuild path instead");
  }
  const classified = classifyFramedRefresh({
    previousReceipt: refresh.previous_source_receipt,
    nextReceipt: refresh.receipt,
    rawWorkPlan: refresh.previous_raw_work_plan,
    acceptedRawEvidence: refresh.previous_accepted_raw_evidence,
    nextRawWorkPlan: candidate.raw_work_plan,
  });
  if (!['current', 'local_compose'].includes(classified.kind)) {
    throw new FramedImageWorkflowError("framed_notes_refresh_rebuild_required", "Framed notes refresh requires exact unchanged raw contract and render profile; use the selected Framed rebuild path instead");
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
    createPreviousReviewContribution: createFramedTargetRawReviewContribution,
    validatePreviousCompletePageReview: ({ review_context: reviewContext, raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validateFramedCompletePageReview({ context: reviewContext, reviewPlan: rawWorkPlan, rawBytesBySlide, sourceEpoch }),
  });
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan: context.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    ownerWorkflow: FRAMED_IMAGE_WORKFLOW,
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