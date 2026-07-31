import {
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
  FramedTextFrameError,
  resolveFramedTextFramePreset,
} from "./internal/text_frame.mjs";
import {
  composeFramedRenderContracts,
  describeFramedFrame,
  verifyFramedRenderContracts,
} from "./internal/framed_render_contract.mjs";
import { currentFramedRenderProfile } from "./internal/framed_render_profile.mjs";
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
  createTargetRawReviewContribution,
  decideTargetRawReview,
  generateTargetRawWork,
  materializeTargetSourceCandidateContext,
  prepareTargetRawReview,
  readTargetAcceptedRawWork,
  readTargetFinalWork,
  recordTargetDelivery,
  rebindTargetLocalComposeWork,
  resolveTargetLocalComposeContext,
  resolveTargetCandidateSourceContext,
  resolveTargetStoredPlanContext,
  resolveTargetSourceContext,
  targetSourceSemanticSha256,
  targetRawPlanProjection,
  validateTargetRawReviewContribution,
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
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
  FramedTextFrameError,
  resolveFramedTextFramePreset,
};

export class FramedImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedImageWorkflowError";
    this.code = code;
  }
}

const FRAMED_RAW_CONTRACT_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "workflow",
  "visual_language",
  "visual_identity",
  "framed",
]);
const FRAMED_RAW_CONTRACT_FRAME_KEYS = Object.freeze([
  "preset",
  "preset_digest",
  "canvas",
  "reserved_underlay_rectangles",
  "render_profile_digest",
  "text_free",
]);
const SHA256_RE = /^[0-9a-f]{64}$/;

function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isRectangle(value, canvas) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    hasExactKeys(value, ["x", "y", "width", "height"]) &&
    [value.x, value.y, value.width, value.height].every(Number.isFinite) &&
    value.width > 0 && value.height > 0 && value.x >= 0 && value.y >= 0 &&
    value.x + value.width <= canvas.css_width && value.y + value.height <= canvas.css_height;
}

function validateFramedRawContractAgainstProfile(rawContract, renderProfile) {
  try {
    if (!hasExactKeys(rawContract, FRAMED_RAW_CONTRACT_KEYS) ||
      rawContract.schema !== TARGET_RAW_CONTRACT_SCHEMA ||
      rawContract.workflow !== FRAMED_IMAGE_WORKFLOW ||
      typeof rawContract.slide_id !== "string" || !rawContract.slide_id ||
      !rawContract.visual_language || typeof rawContract.visual_language !== "object" || Array.isArray(rawContract.visual_language) ||
      (rawContract.visual_identity !== null && (!rawContract.visual_identity || typeof rawContract.visual_identity !== "object" || Array.isArray(rawContract.visual_identity))) ||
      !hasExactKeys(rawContract.framed, FRAMED_RAW_CONTRACT_FRAME_KEYS)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has an invalid canonical shape");
    }
    const frame = rawContract.framed;
    if (frame.preset !== renderProfile?.preset?.id ||
      frame.preset_digest !== renderProfile?.preset?.digest ||
      !Array.isArray(frame.reserved_underlay_rectangles) || frame.reserved_underlay_rectangles.length === 0 ||
      frame.reserved_underlay_rectangles.some((rectangle) => !isRectangle(rectangle, frame.canvas)) ||
      frame.text_free !== true || !SHA256_RE.test(frame.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has invalid frame facts");
    }
    if (!SHA256_RE.test(renderProfile?.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_render_profile_required", "Framed raw contracts require the canonical render profile");
    }
    if (frame.render_profile_digest !== renderProfile.render_profile_digest) {
      throw new FramedImageWorkflowError("framed_raw_contract_profile_stale", "Framed raw contract does not bind the current render profile");
    }
    return Object.freeze({
      ok: true,
      raw_contract_sha256: canonicalJsonSha256(rawContract),
      render_profile_digest: frame.render_profile_digest,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "framed_raw_contract_invalid",
      message: error.message || "Framed raw contract is invalid",
    });
  }
}

/** Validate one Framed raw contract against the canonical current render profile. */
export function validateFramedRawContract(rawContract) {
  return validateFramedRawContractAgainstProfile(rawContract, currentFramedRenderProfile());
}

function requireReceipt(receipt) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" || receipt.workflow !== FRAMED_IMAGE_WORKFLOW || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed workflow requires a current framed v2 source receipt");
  }
  return receipt;
}

function canonicalFramedFrameFacts(frame) {
  const layout = frame?.layout;
  const profile = frame?.render_profile;
  if (!layout || !profile || typeof profile.preset?.id !== "string" ||
    !SHA256_RE.test(profile.preset?.digest || "") ||
    !layout.canvas || !Array.isArray(layout.safe_zones) || layout.safe_zones.length === 0) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", "Framed render contract is missing canonical raw facts");
  }
  return Object.freeze({
    preset: profile.preset.id,
    preset_digest: profile.preset.digest,
    canvas: layout.canvas,
    reserved_underlay_rectangles: Object.freeze(layout.safe_zones.map(({ rectangle }) => ({ ...rectangle }))),
  });
}

function describeFramedSlide(slide) {
  return describeFramedFrame({ slide_id: slide.slide_id, text_frame: slide.text_frame });
}

function sameSlideOrder(previousReceipt, nextReceipt) {
  return previousReceipt.slides.map((slide) => slide.slide_id).join("\n") ===
    nextReceipt.slides.map((slide) => slide.slide_id).join("\n");
}

function underlaySignature(slide) {
  let frame = null;
  try {
    const described = describeFramedSlide(slide);
    frame = {
      ...canonicalFramedFrameFacts(described),
      variant: described.layout.variant,
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
  if (!previousRawWorkPlan) return null;
  if (!nextRawWorkPlan) return false;
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
  if (hasReusableRawContract(previousReceipt, nextReceipt, rawWorkPlan, nextRawWorkPlan) === false) {
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

function framedRawPlanItems(receipt) {
  requireReceipt(receipt);
  return Object.freeze(receipt.slides.map((slide) => Object.freeze({
    slide_id: slide.slide_id,
    text_free: true,
  })));
}

/** The selected adapter alone writes target raw plans for its framed receipt. */
export function createFramedRawWorkPlan({ receipt, provider_profile_sha256, authorization_scope_sha256, raw_contracts_by_slide } = {}) {
  const items = framedRawPlanItems(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new FramedImageWorkflowError("raw_contracts_required", "Framed raw contracts are required for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_slide_ids: items.map((item) => item.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: items.map((item) => ({ slide_id: item.slide_id, raw_contract_sha256: raw_contracts_by_slide[item.slide_id] })),
  });
}

/**
 * Map Framed's canonical render contract into the shared review contribution
 * interface. Coverage is deliberately text-free; titles live only in the
 * projection snapshot consumed by the later shared review owner.
 */
export function createFramedTargetRawReviewContribution({ receipt, rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const plan = validateRawWorkPlan(rawWorkPlan);
  const receiptIds = receipt.slides.map((slide) => slide.slide_id);
  if (!plan.ok || rawWorkPlan.workflow !== FRAMED_IMAGE_WORKFLOW ||
    rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(receiptIds)) {
    throw new FramedImageWorkflowError("framed_review_contribution_plan_invalid", "Framed raw-review contribution requires the exact current raw work plan");
  }
  const slidesById = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  if (slidesById.size !== receipt.slides.length) {
    throw new FramedImageWorkflowError("framed_review_contribution_source_invalid", "Framed raw-review contribution requires unique source slide identities");
  }
  const described = rawWorkPlan.ordered_slide_ids.map((slideId) => {
    const slide = slidesById.get(slideId);
    if (!slide) throw new FramedImageWorkflowError("framed_review_contribution_source_invalid", `Framed raw-review contribution is missing ${slideId}`);
    const frame = describeFramedFrame({ slide_id: slideId, text_frame: slide.text_frame });
    const title = slide.display?.title ?? slide.text_frame?.title;
    if (typeof title !== "string" || !title.trim()) {
      throw new FramedImageWorkflowError("framed_review_contribution_label_invalid", `Framed raw-review projection requires a title for ${slideId}`);
    }
    return Object.freeze({ slide, frame, title });
  });
  const profileDigests = new Set(described.map(({ frame }) => frame.render_profile.render_profile_digest));
  if (profileDigests.size !== 1) {
    throw new FramedImageWorkflowError("framed_review_contribution_profile_invalid", "Framed raw-review contribution requires one current render profile");
  }
  const contribution = createTargetRawReviewContribution({
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_stable_ids: rawWorkPlan.ordered_slide_ids,
    coverage_items: described.map(({ frame }, index) => ({
      stable_id: rawWorkPlan.ordered_slide_ids[index],
      coverage_profile_digest: frame.render_profile.render_profile_digest,
      guide_primitives: frame.layout.safe_zones.map(({ rectangle }, guideIndex) => ({
        kind: "rectangle",
        guide_id: `guide_${guideIndex + 1}`,
        x: rectangle.x / frame.layout.canvas.css_width,
        y: rectangle.y / frame.layout.canvas.css_height,
        width: rectangle.width / frame.layout.canvas.css_width,
        height: rectangle.height / frame.layout.canvas.css_height,
      })),
    })),
    projection_labels: described.map(({ title }, index) => ({
      stable_id: rawWorkPlan.ordered_slide_ids[index],
      position: index + 1,
      title,
    })),
  });
  const validation = validateTargetRawReviewContribution(contribution, {
    rawWorkPlan,
    expectedWorkflow: FRAMED_IMAGE_WORKFLOW,
  });
  if (!validation.ok) throw new FramedImageWorkflowError(validation.code, validation.message);
  return contribution;
}

const FRAMED_FINAL_COMPOSITION_KEYS = Object.freeze([
  "receipt",
  "rawWorkPlan",
  "acceptedRawEvidence",
  "rawBytesBySlide",
]);

function requireFramedFinalCompositionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
    Object.keys(input).length !== FRAMED_FINAL_COMPOSITION_KEYS.length ||
    !FRAMED_FINAL_COMPOSITION_KEYS.every((key) => Object.hasOwn(input, key))) {
    throw new FramedImageWorkflowError(
      "framed_render_input_invalid",
      "Framed final rendering accepts only current receipt, raw plan, accepted evidence, and raw bytes",
    );
  }
  return input;
}

/** Compose local text over accepted raw bytes, then publish the common manifest. */
export async function composeFramedFinalSlideManifest(input = {}) {
  const { receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide } = requireFramedFinalCompositionInput(input);
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new FramedImageWorkflowError(evidence.code, evidence.message);
  const byId = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  const frames = [];
  for (const item of acceptedRawEvidence.items) {
    const slide = byId.get(item.slide_id);
    const raw = rawBytesBySlide?.[item.slide_id];
    if (!slide || !raw) throw new FramedImageWorkflowError("accepted_raw_unavailable", `accepted raw bytes are unavailable for ${item.slide_id}`);
    frames.push(Object.freeze({
      slide_id: item.slide_id,
      text_frame: slide.text_frame,
      verified_raw: { bytes: Buffer.from(raw), sha256: item.raw_sha256 },
    }));
  }
  const composed = await composeFramedRenderContracts(frames);
  const finalBytesBySlide = composed.final_bytes_by_slide;
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

/** Resolve the selected Framed source without state or artifact materialization. */
function resolveFramedTargetCandidateSource(runDir) {
  return resolveTargetCandidateSourceContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
}

function framedRawContract(slide, frame) {
  const visualLanguage = slide.visual_language?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new FramedImageWorkflowError("framed_visual_language_required", `Framed visual language is unresolved for ${slide.slide_id}`);
  }
  if (frame?.slide_id !== slide.slide_id || !SHA256_RE.test(frame?.render_profile?.render_profile_digest || "")) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", `Framed render contract is unavailable for ${slide.slide_id}`);
  }
  const facts = canonicalFramedFrameFacts(frame);
  const rawContract = Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: FRAMED_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    visual_identity: slide.visual_language?.identity_reference?.projection || null,
    framed: {
      ...facts,
      render_profile_digest: frame.render_profile.render_profile_digest,
      text_free: true,
    },
  });
  return rawContract;
}

/** Compile a selected Framed v2 raw-plan candidate without artifact writes. */
function compileFramedTargetRawPlanCandidate(context) {
  const framesById = new Map(context.receipt.slides.map((slide) => [slide.slide_id, describeFramedSlide(slide)]));
  const renderProfileDigests = new Set([...framesById.values()].map((frame) => frame.render_profile.render_profile_digest));
  if (renderProfileDigests.size !== 1) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", "Framed raw-plan candidate requires one canonical render profile");
  }
  const renderProfile = framesById.values().next().value.render_profile;
  const generation = buildTargetRawGenerationProfile(context.deck_dir, context.receipt);
  const rawContractsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const rawContract = framedRawContract(slide, framesById.get(slide.slide_id));
    const rawContractValidation = validateFramedRawContractAgainstProfile(rawContract, renderProfile);
    if (!rawContractValidation.ok) throw new FramedImageWorkflowError(rawContractValidation.code, rawContractValidation.message);
    rawContractsBySlide[slide.slide_id] = rawContractValidation.raw_contract_sha256;
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
  return Object.freeze({
    ...context,
    raw_work_plan: rawWorkPlan,
    provider_requests_by_slide: Object.freeze(providerRequestsBySlide),
    render_profile_digest: renderProfile.render_profile_digest,
    style_master_path: generation.style_master_path,
  });
}

/**
 * Prove the complete current Framed candidate before source/state/plan
 * materialization. The state owner rechecks the exact candidate bytes.
 */
export async function buildFramedTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  const candidate = compileFramedTargetRawPlanCandidate(resolveFramedTargetCandidateSource(runDir));
  const proof = await verifyFramedRenderContracts(candidate.receipt.slides.map((slide) => ({
    slide_id: slide.slide_id,
    text_frame: slide.text_frame,
  })));
  if (proof.render_profile_digest !== candidate.render_profile_digest) {
    throw new FramedImageWorkflowError("framed_render_profile_stale", "Framed layout proof did not use the candidate render profile");
  }
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  return Object.freeze({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    style_master_path: candidate.style_master_path,
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
  const plan = readFramedTargetStoredPlanContext(runDir);
  return authorizeTargetRawWork(plan, plan.raw_work_plan, { planHash });
}

export async function generateFramedTargetRawPlan(runDir, { planHash, submit } = {}) {
  const plan = readFramedTargetStoredPlanContext(runDir);
  return generateTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
    submit,
  });
}

export async function prepareFramedTargetRawReview(runDir) {
  const plan = readFramedTargetStoredPlanContext(runDir);
  return prepareTargetRawReview(plan, plan.raw_work_plan, {
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
  });
}

export async function decideFramedTargetRawReview(runDir, { decision } = {}) {
  const plan = readFramedTargetStoredPlanContext(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, {
    decision,
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
  });
}

/** Framed finalization then shared delivery through the one target delivery owner. */
export async function buildFramedTargetDelivery(runDir) {
  const plan = readFramedTargetStoredPlanContext(runDir);
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
  const reviewContribution = createFramedTargetRawReviewContribution({
    receipt: candidate.receipt,
    rawWorkPlan: candidate.raw_work_plan,
  });
  const context = rebindTargetLocalComposeWork(candidate, {
    rawWorkPlan: candidate.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    reviewContribution,
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
  const reviewContribution = createFramedTargetRawReviewContribution({
    receipt: candidate.receipt,
    rawWorkPlan: candidate.raw_work_plan,
  });
  const context = rebindTargetLocalComposeWork(candidate, {
    rawWorkPlan: candidate.raw_work_plan,
    acceptedRawEvidence: reboundEvidence,
    reviewContribution,
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
