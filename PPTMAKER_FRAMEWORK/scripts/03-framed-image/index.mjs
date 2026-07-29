import {
  FRAMED_TEXT_FRAME_PREFLIGHT_SCHEMA,
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
  FramedTextFrameError,
  preflightFramedTextFrame,
  resolveFramedTextFramePreset,
} from "./internal/text_frame.mjs";
import { composePageAuthorityFramedPage } from "./internal/framed_composition.mjs";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
  validateAcceptedRawEvidence,
  validateRawWorkPlan,
} from "../shared/image2/page_authority_artifacts.mjs";
import { publishCurrentFinalSlideManifest } from "../shared/image2/page_authority_final_manifest.mjs";
import { canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { parsePageAuthoritySource } from "../01-content/index.mjs";
import {
  createPageAuthoritySourceResolver,
  loadPageAuthorityVisualLanguage,
} from "../02-visual-system/index.mjs";
import {
  authorizeTargetRawWork,
  buildTargetRawGenerationProfile,
  createTargetProviderRequest,
  decideTargetRawReview,
  generateTargetRawWork,
  prepareTargetRawReview,
  readTargetAcceptedRawWork,
  readTargetFinalWork,
  recordTargetDelivery,
  rebindTargetLocalComposeWork,
  resolveTargetLocalComposeContext,
  resolveTargetSourceContext,
  targetSourceSemanticSha256,
  targetRawPlanProjection,
  writeTargetFinalManifest,
  writeTargetRawWorkPlan,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../shared/image2/page_authority_target_runtime.mjs";
import {
  deliverTargetFinalSlideManifest,
} from "../05-delivery/index.mjs";

/** TARGET Framed workflow owner. Behavior moves here from the bounded v1 adapter. */
export const FRAMED_IMAGE_WORKFLOW = "framed";

export const FRAMED_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_authority_artifacts.mjs",
  "shared/image2/page_authority_final_manifest.mjs",
  "shared/image2/page_authority_raw_mechanics.mjs",
  "shared/image2/page_authority_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
]);

export {
  FRAMED_TEXT_FRAME_PREFLIGHT_SCHEMA,
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
  FramedTextFrameError,
  composePageAuthorityFramedPage,
  preflightFramedTextFrame,
  resolveFramedTextFramePreset,
};

export class FramedImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedImageWorkflowError";
    this.code = code;
  }
}

function requireReceipt(receipt) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" || receipt.workflow !== FRAMED_IMAGE_WORKFLOW || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed workflow requires a current framed v2 source receipt");
  }
  return receipt;
}

function sameSlideOrder(previousReceipt, nextReceipt) {
  return previousReceipt.slides.map((slide) => slide.slide_id).join("\n") ===
    nextReceipt.slides.map((slide) => slide.slide_id).join("\n");
}

function underlaySignature(slide) {
  let frame = null;
  try {
    const evidence = preflightFramedTextFrame(slide.text_frame).evidence;
    frame = {
      preset: evidence.preset,
      preset_digest: evidence.preset_digest,
      variant: evidence.variant,
      canvas: evidence.canvas,
      reserved_underlay_rectangles: evidence.reserved_underlay_rectangles,
    };
  } catch {
    frame = null;
  }
  return canonicalJsonSha256({
    visual_brief: slide.visual_brief ?? null,
    visual_language: slide.visual_language ?? null,
    visual_identity: slide.visual_identity ?? null,
    identity_subject_count: slide.identity_subject_count ?? null,
    subject_restrictions: slide.subject_restrictions ?? null,
    frame,
  });
}

function hasExactAcceptedRawEvidence(receipt, rawWorkPlan, acceptedRawEvidence) {
  if (!rawWorkPlan || !acceptedRawEvidence) return false;
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  return evidence.ok && rawWorkPlan.workflow === FRAMED_IMAGE_WORKFLOW &&
    rawWorkPlan.source_receipt_sha256 === receipt.source_sha256;
}

function hasReusableRawContract(previousReceipt, nextReceipt, previousRawWorkPlan, nextRawWorkPlan) {
  if (!nextRawWorkPlan) return true;
  const previous = validateRawWorkPlan(previousRawWorkPlan);
  const next = validateRawWorkPlan(nextRawWorkPlan);
  return previous.ok && next.ok &&
    previousRawWorkPlan.source_receipt_sha256 === previousReceipt.source_sha256 &&
    nextRawWorkPlan.source_receipt_sha256 === nextReceipt.source_sha256 &&
    previousRawWorkPlan.workflow === FRAMED_IMAGE_WORKFLOW &&
    nextRawWorkPlan.workflow === FRAMED_IMAGE_WORKFLOW &&
    previousRawWorkPlan.provider_profile_sha256 === nextRawWorkPlan.provider_profile_sha256 &&
    canonicalJsonSha256(previousRawWorkPlan.ordered_slide_ids) === canonicalJsonSha256(nextRawWorkPlan.ordered_slide_ids) &&
    canonicalJsonSha256(previousRawWorkPlan.items) === canonicalJsonSha256(nextRawWorkPlan.items);
}

/**
 * Classify target Framed drift without submitting provider work. Text Frame
 * literals may be recomposed locally only from exact prior underlay evidence.
 */
export function classifyFramedRefresh({ previousReceipt, nextReceipt, rawWorkPlan = null, acceptedRawEvidence = null, nextRawWorkPlan = null } = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  if (!sameSlideOrder(previousReceipt, nextReceipt)) {
    return Object.freeze({
      workflow: FRAMED_IMAGE_WORKFLOW,
      kind: "structural_versioning",
      provider_required: false,
      next_action: "preview_structural_vnext",
    });
  }
  const nextById = new Map(nextReceipt.slides.map((slide) => [slide.slide_id, slide]));
  for (const previousSlide of previousReceipt.slides) {
    const nextSlide = nextById.get(previousSlide.slide_id);
    const previousUnderlay = underlaySignature(previousSlide);
    const nextUnderlay = underlaySignature(nextSlide);
    if (previousSlide.text_frame?.preset !== nextSlide.text_frame?.preset ||
      previousUnderlay !== nextUnderlay) {
      return Object.freeze({
        workflow: FRAMED_IMAGE_WORKFLOW,
        kind: "rebuild_raw",
        provider_required: true,
        reason: "underlay_signature_drift",
        next_action: "authorize_and_rebuild_framed_raw",
      });
    }
  }
  if (!hasReusableRawContract(previousReceipt, nextReceipt, rawWorkPlan, nextRawWorkPlan)) {
    return Object.freeze({
      workflow: FRAMED_IMAGE_WORKFLOW,
      kind: "rebuild_raw",
      provider_required: true,
      reason: "raw_contract_or_profile_drift",
      next_action: "authorize_and_rebuild_framed_raw",
    });
  }
  if (previousReceipt.source_sha256 === nextReceipt.source_sha256) {
    return Object.freeze({
      workflow: FRAMED_IMAGE_WORKFLOW,
      kind: "current",
      provider_required: false,
      next_action: "none",
    });
  }
  if (!hasExactAcceptedRawEvidence(previousReceipt, rawWorkPlan, acceptedRawEvidence)) {
    return Object.freeze({
      workflow: FRAMED_IMAGE_WORKFLOW,
      kind: "raw_evidence_required",
      provider_required: true,
      next_action: "authorize_and_rebuild_framed_raw",
    });
  }
  return Object.freeze({
    workflow: FRAMED_IMAGE_WORKFLOW,
    kind: "local_compose",
    provider_required: false,
    next_action: "compose_framed_final_through_owner",
  });
}

/** Derive the Framed-only text-free underlay contribution before provider work. */
export function prepareFramedRawContribution(receipt) {
  requireReceipt(receipt);
  const items = receipt.slides.map((slide) => {
    const preflight = preflightFramedTextFrame(slide.text_frame);
    if (!preflight.ok || !preflight.authorization_allowed) {
      throw new FramedImageWorkflowError("framed_preflight_required", `Framed Text Frame requires repair for ${slide.slide_id}`);
    }
    return Object.freeze({
      slide_id: slide.slide_id,
      preflight: preflight.evidence,
      text_free: true,
    });
  });
  return Object.freeze({ workflow: FRAMED_IMAGE_WORKFLOW, items: Object.freeze(items) });
}

/** The selected adapter alone writes target raw plans for its framed receipt. */
export function createFramedRawWorkPlan({ receipt, provider_profile_sha256, authorization_scope_sha256, raw_contracts_by_slide } = {}) {
  const contribution = prepareFramedRawContribution(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new FramedImageWorkflowError("raw_contracts_required", "Framed raw contracts are required for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_slide_ids: contribution.items.map((item) => item.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: contribution.items.map((item) => ({ slide_id: item.slide_id, raw_contract_sha256: raw_contracts_by_slide[item.slide_id] })),
  });
}

/** Compose local text over accepted raw bytes, then publish the common manifest. */
export async function composeFramedFinalSlideManifest({ receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide, compose = null } = {}) {
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new FramedImageWorkflowError(evidence.code, evidence.message);
  if (compose !== null && typeof compose !== "function") throw new FramedImageWorkflowError("framed_composer_required", "Framed local composer must be a function");
  const byId = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  const finalBytesBySlide = {};
  for (const item of acceptedRawEvidence.items) {
    const slide = byId.get(item.slide_id);
    const raw = rawBytesBySlide?.[item.slide_id];
    if (!slide || !raw) throw new FramedImageWorkflowError("accepted_raw_unavailable", `accepted raw bytes are unavailable for ${item.slide_id}`);
    const preflight = preflightFramedTextFrame(slide.text_frame);
    if (!preflight.ok || !preflight.authorization_allowed) {
      throw new FramedImageWorkflowError("framed_preflight_required", `Framed Text Frame requires repair for ${item.slide_id}`);
    }
    const output = compose
      ? await compose(Object.freeze({ slide_id: item.slide_id, text_frame: slide.text_frame, raw_bytes: Buffer.from(raw) }))
      : await composePageAuthorityFramedPage({
        receipt: { text_frame: slide.text_frame },
        verifiedRaw: { bytes: Buffer.from(raw), sha256: item.raw_sha256 },
        preflight,
      });
    const finalBytes = Buffer.isBuffer(output) || output instanceof Uint8Array ? output : output?.bytes;
    if (!Buffer.isBuffer(finalBytes) && !(finalBytes instanceof Uint8Array)) throw new FramedImageWorkflowError("framed_compose_invalid", `Framed composer returned no bytes for ${item.slide_id}`);
    finalBytesBySlide[item.slide_id] = Buffer.from(finalBytes);
  }
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan,
    acceptedRawEvidence,
    ownerWorkflow: FRAMED_IMAGE_WORKFLOW,
    finalBytesBySlide,
  });
  return Object.freeze({ manifest, final_bytes_by_slide: Object.freeze(finalBytesBySlide) });
}

/** Backward-compatible manifest-only Framed finalization interface. */
export async function publishFramedFinalSlideManifest(input = {}) {
  return (await composeFramedFinalSlideManifest(input)).manifest;
}

function parseFramedTargetReceipt({ deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageAuthorityVisualLanguage(deckDir);
  return parsePageAuthoritySource(sourceText, {
    source: sourcePath,
    registry: createPageAuthoritySourceResolver({ deckDir, visualLanguage }),
  });
}

/** Resolve and bind the selected Framed source without compiling raw work. */
export function resolveFramedTargetSource(runDir, { allowSourceRebuild = false } = {}) {
  return resolveTargetSourceContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
    allowSourceRebuild,
  });
}

function framedRawContract(slide, preflight) {
  const visualLanguage = slide.visual_language?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new FramedImageWorkflowError("framed_visual_language_required", `Framed visual language is unresolved for ${slide.slide_id}`);
  }
  const evidence = preflight?.evidence || preflight;
  if (!evidence || typeof evidence !== "object") {
    throw new FramedImageWorkflowError("framed_preflight_required", `Framed Text Frame requires repair for ${slide.slide_id}`);
  }
  return Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: FRAMED_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    visual_identity: slide.visual_language?.identity_reference?.projection || null,
    framed: {
      preset: evidence.preset,
      preset_digest: evidence.preset_digest,
      canvas: evidence.canvas,
      reserved_underlay_rectangles: evidence.reserved_underlay_rectangles,
      text_free: true,
    },
  });
}

/** Compile a selected Framed v2 raw plan without touching the Pure sibling. */
function compileFramedTargetRawPlan(context) {
  const contribution = prepareFramedRawContribution(context.receipt);
  const generation = buildTargetRawGenerationProfile(context.deck_dir, context.receipt);
  const preflightById = new Map(contribution.items.map((item) => [item.slide_id, item.preflight]));
  const rawContractsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const rawContract = framedRawContract(slide, preflightById.get(slide.slide_id));
    rawContractsBySlide[slide.slide_id] = canonicalJsonSha256(rawContract);
    providerRequestsBySlide[slide.slide_id] = createTargetProviderRequest({
      slideId: slide.slide_id,
      rawContract,
      generationProfile: generation.profile,
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
  });
  const rawWorkPlan = createFramedRawWorkPlan({
    receipt: context.receipt,
    provider_profile_sha256: generation.provider_profile_sha256,
    authorization_scope_sha256: authorizationScopeSha,
    raw_contracts_by_slide: rawContractsBySlide,
  });
  writeTargetRawWorkPlan(context, rawWorkPlan);
  return Object.freeze({
    ...context,
    raw_work_plan: rawWorkPlan,
    provider_requests_by_slide: Object.freeze(providerRequestsBySlide),
    style_master_path: generation.style_master_path,
  });
}

export function buildFramedTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  return compileFramedTargetRawPlan(resolveFramedTargetSource(runDir, { allowSourceRebuild }));
}

export function framedTargetRawPlanProjection(plan) {
  return targetRawPlanProjection(plan, plan.raw_work_plan);
}

export function authorizeFramedTargetRawPlan(runDir, { planHash } = {}) {
  const plan = buildFramedTargetRawPlan(runDir);
  return authorizeTargetRawWork(plan, plan.raw_work_plan, { planHash });
}

export async function generateFramedTargetRawPlan(runDir, { planHash, submit } = {}) {
  const plan = buildFramedTargetRawPlan(runDir);
  return generateTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
    submit,
  });
}

export async function prepareFramedTargetRawReview(runDir) {
  const plan = buildFramedTargetRawPlan(runDir);
  return prepareTargetRawReview(plan, plan.raw_work_plan);
}

export function decideFramedTargetRawReview(runDir, { decision } = {}) {
  const plan = buildFramedTargetRawPlan(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, { decision });
}

/** Framed finalization then shared delivery through the one target delivery owner. */
export async function buildFramedTargetDelivery(runDir) {
  const plan = buildFramedTargetRawPlan(runDir);
  const raw = readTargetAcceptedRawWork(plan, plan.raw_work_plan);
  const finalization = await composeFramedFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
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

function changedFramedTextSlideIds(previousReceipt, nextReceipt) {
  const nextById = new Map(nextReceipt.slides.map((slide) => [slide.slide_id, slide]));
  return previousReceipt.slides
    .filter((slide) => canonicalJsonSha256(slide.text_frame) !== canonicalJsonSha256(nextById.get(slide.slide_id)?.text_frame))
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
  const changed = changedFramedTextSlideIds(previousReceipt, nextReceipt);
  if (changed.some((slideId) => !selected.has(slideId))) {
    throw new FramedImageWorkflowError("framed_refresh_slide_selection_incomplete", "Framed local refresh selection must include every changed Text Frame");
  }
  return [...slideIds];
}

/**
 * Recompose a target Framed source edit from exactly accepted prior underlay
 * bytes. This is the only provider-free source transition: source parsing,
 * raw-contract equality, evidence rebinding, manifest publication, and shared
 * delivery all remain bound to the selected Framed owner.
 */
export async function refreshFramedTargetText(runDir, { slideIds = null } = {}) {
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  const candidate = compileFramedTargetRawPlan(refresh);
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
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
  const candidate = compileFramedTargetRawPlan(refresh);
  if (targetSourceSemanticSha256(refresh.previous_source_receipt, FRAMED_IMAGE_WORKFLOW) !==
    targetSourceSemanticSha256(refresh.receipt, FRAMED_IMAGE_WORKFLOW)) {
    throw new FramedImageWorkflowError("framed_notes_refresh_rebuild_required", "Framed notes refresh requires unchanged pixel-owning source facts; use the selected Framed rebuild path instead");
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
