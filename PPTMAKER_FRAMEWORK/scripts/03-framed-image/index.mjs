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
  pageAuthorityOrdinalImageFilename,
  validateAcceptedRawEvidence,
  validateAcceptedRawEvidenceForFinalization,
  validateRawWorkPlan,
} from "../shared/image2/page_authority_artifacts.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { publishCurrentFinalSlideManifest } from "../shared/image2/page_authority_final_manifest.mjs";
import { canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../shared/identity/byte_hash.mjs";
import { pageAuthorityImage2Paths } from "../shared/run-bundle/page_authority_paths.mjs";
import { parsePageAuthoritySource } from "../01-content/index.mjs";
import {
  createPageAuthoritySourceResolver,
  loadPageAuthorityVisualLanguage,
  normalizePageAuthorityTextGuard,
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
  publishProgressiveTargetCompleteRawReview,
  readTargetAcceptedRawWork,
  readTargetFinalWork,
  recordTargetDelivery,
  rebindTargetLocalComposeWork,
  rebindTargetProgressiveLocalComposeWork,
  resolveTargetLocalComposeContext,
  resolveTargetProgressiveLocalRebindContext,
  resolveTargetCandidateSourceContext,
  resolveTargetStoredPlanContext,
  resolveTargetSourceContext,
  targetSourceSemanticSha256,
  targetRawPlanProjection,
  validateTargetRawReviewContribution,
  writeTargetProviderRequestInspection,
  writeTargetFinalManifest,
  writeProgressiveTargetFinalManifest,
  writeTargetRawWorkPlan,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../shared/image2/page_authority_target_runtime.mjs";
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
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../shared/image2/page_authority_progressive_raw_owner.mjs";
import {
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressiveDeliveryReceipt,
  recordTargetProgressiveFinalManifest,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveRawPlan,
} from "../shared/state/state.mjs";
import {
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../shared/image2/style_master_scope.mjs";
import {
  deliverTargetFinalSlideManifest,
  refreshTargetPageAuthorityNotes,
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
  "provider_clauses",
  "visual_identity_role_clause",
  "visual_scene",
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
      (rawContract.provider_clauses !== null && (typeof rawContract.provider_clauses !== "object" || Array.isArray(rawContract.provider_clauses))) ||
      (rawContract.visual_identity_role_clause !== null && typeof rawContract.visual_identity_role_clause !== "string") ||
      (rawContract.visual_scene !== null && typeof rawContract.visual_scene !== "string") ||
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
function classifyFramedRefreshFromAcceptedEvidence({
  previousReceipt,
  nextReceipt,
  rawWorkPlan = null,
  nextRawWorkPlan = null,
  hasAcceptedEvidence = false,
} = {}) {
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
  if (!hasAcceptedEvidence) {
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

export function classifyFramedRefresh({ previousReceipt, nextReceipt, rawWorkPlan = null, acceptedRawEvidence = null, nextRawWorkPlan = null } = {}) {
  return classifyFramedRefreshFromAcceptedEvidence({
    previousReceipt,
    nextReceipt,
    rawWorkPlan,
    nextRawWorkPlan,
    hasAcceptedEvidence: hasExactAcceptedRawEvidence(previousReceipt, rawWorkPlan, acceptedRawEvidence),
  });
}

/**
 * Apply the same Framed Text Frame-only retention validator to direct v3
 * evidence without treating a rebuildable v2 accepted-evidence projection as
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
  const accepted = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  const hasAcceptedEvidence = Boolean(rawWorkPlan && progressiveRawWorkPlan) && accepted.ok &&
    progressiveRawWorkPlan?.workflow === FRAMED_IMAGE_WORKFLOW &&
    progressiveRawWorkPlan.source_receipt_sha256 === previousReceipt?.source_sha256 &&
    canonicalJsonSha256(progressiveRawWorkPlan.ordered_slide_ids) === canonicalJsonSha256(rawWorkPlan?.ordered_slide_ids) &&
    canonicalJsonSha256(progressiveRawWorkPlan.items) === canonicalJsonSha256(rawWorkPlan?.items);
  return classifyFramedRefreshFromAcceptedEvidence({
    previousReceipt,
    nextReceipt,
    rawWorkPlan,
    nextRawWorkPlan,
    hasAcceptedEvidence,
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
    !FRAMED_FINAL_COMPOSITION_KEYS.every((key) => Object.hasOwn(input, key)) ||
    Object.keys(input).some((key) => ![...FRAMED_FINAL_COMPOSITION_KEYS, "evidencePlan"].includes(key))) {
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
  const evidencePlan = input.evidencePlan ?? rawWorkPlan;
  requireReceipt(receipt);
  const rawPlan = validateRawWorkPlan(rawWorkPlan);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: evidencePlan });
  if (!evidence.ok) throw new FramedImageWorkflowError(evidence.code, evidence.message);
  if (!rawPlan.ok || rawWorkPlan.workflow !== FRAMED_IMAGE_WORKFLOW || rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    evidencePlan.workflow !== FRAMED_IMAGE_WORKFLOW || evidencePlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(evidencePlan.ordered_slide_ids) ||
    canonicalJsonSha256(rawWorkPlan.items) !== canonicalJsonSha256(evidencePlan.items)) {
    throw new FramedImageWorkflowError("framed_finalization_lineage_invalid", "Framed finalization requires matching selected-workflow raw-plan lineage");
  }
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
    rawWorkPlan: evidencePlan,
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
export function resolveFramedTargetCandidateSource(runDir) {
  return resolveTargetCandidateSourceContext(runDir, {
    workflow: FRAMED_IMAGE_WORKFLOW,
    parseReceipt: parseFramedTargetReceipt,
  });
}

/** Resolve Framed's exact Style Master scope without materializing page lineage. */
export function resolveFramedStyleMasterScope(runDir) {
  const scope = resolveStyleMasterScopeContext(runDir);
  if (scope.workflow !== FRAMED_IMAGE_WORKFLOW) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed Style Master scope requires the selected framed workflow");
  }
  return bindStyleMasterScopeCandidate(scope, resolveFramedTargetCandidateSource(runDir));
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
  const providerClauses = slide.visual_language?.provider_clauses || null;
  const identityRoleClause = slide.visual_language?.identity_reference?.provider_reference?.role_clause || null;
  let visualScene = slide.visual_scene ?? null;
  if (visualScene != null) {
    visualScene = normalizePageAuthorityTextGuard(visualScene, { context: `VISUAL SCENE:${slide.slide_id}` });
  }
  const rawContract = Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: FRAMED_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    provider_clauses: providerClauses,
    visual_identity_role_clause: identityRoleClause,
    visual_scene: visualScene,
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
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
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
    style_master_reference: generation.style_master_reference,
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

function progressiveFramedDisplayBySlide(receipt) {
  return Object.fromEntries(receipt.slides.map((slide) => [slide.slide_id, { title: slide.display?.title || slide.text_frame?.title || "" }]));
}

function progressiveFramedPlanFromContext(context) {
  return createProgressiveRawWorkPlanFromTarget({
    runDir: context.run_dir,
    source_epoch: context.source_epoch,
    raw_work_plan: context.raw_work_plan,
    effective_style_master_sha256: context.style_master_reference.selection_sha256,
  });
}

function progressiveLocalRebindProjectionUnavailable(error) {
  return ["target_previous_source_receipt_required", "target_previous_raw_plan_required"].includes(error?.code);
}

/**
 * Compile the current Framed source/style facts into an expected v3 plan
 * without reading or rebuilding any version `_generated` projection.
 */
export function readFramedProgressiveTargetPlanCandidate(runDir, { sourceEpoch = null } = {}) {
  const candidate = compileFramedTargetRawPlanCandidate(resolveFramedTargetCandidateSource(runDir));
  if (sourceEpoch === null) return candidate;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new FramedImageWorkflowError("progressive_raw_target_plan_invalid", "a current progressive source epoch is required for Framed plan comparison");
  }
  return Object.freeze({
    ...candidate,
    progressive_raw_work_plan: progressiveFramedPlanFromContext({ ...candidate, source_epoch: sourceEpoch }),
  });
}

/**
 * Read-only Framed local-rebind preflight. The raw owner remains the source
 * of accepted bytes/evidence; the legacy v2 projection is consulted only by
 * the existing narrow retention validator and never as lifecycle authority.
 */
export function inspectFramedProgressiveLocalRebind(runDir, { planHash, candidate } = {}) {
  const next = candidate || readFramedProgressiveTargetPlanCandidate(runDir, {});
  if (!next?.progressive_raw_work_plan) {
    throw new FramedImageWorkflowError("progressive_raw_target_plan_invalid", "Framed local-rebind inspection requires a current candidate v3 plan");
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

/** Compile/prove selected Framed source then publish only its provider-free v3 full plan. */
export async function buildFramedProgressiveTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  const prior = inspectProgressiveRawLifecycle({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  if (prior.ok && prior.legacy_v2) {
    throw new FramedImageWorkflowError("progressive_raw_legacy_replan_required", "legacy v2 raw records remain readable; start the owner-issued progressive replan/rebuild action instead");
  }
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
  const proof = await verifyFramedRenderContracts(candidate.receipt.slides.map((slide) => ({
    slide_id: slide.slide_id,
    text_frame: slide.text_frame,
  })));
  if (proof.render_profile_digest !== candidate.render_profile_digest) {
    throw new FramedImageWorkflowError("framed_render_profile_stale", "Framed layout proof did not use the candidate render profile");
  }
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
      const progressiveRawWorkPlan = progressiveFramedPlanFromContext({
        ...candidate,
        source_epoch: previous.plan.source_epoch,
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
        provider_request_inspection: providerRequestInspection,
        provider_requests_by_slide: candidate.provider_requests_by_slide,
        style_master_reference: candidate.style_master_reference,
      });
    }
  }
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  // The retained v2 plan is only a rebuildable adapter projection for review rendering.
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  const progressiveRawWorkPlan = progressiveFramedPlanFromContext({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    style_master_reference: candidate.style_master_reference,
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
    provider_request_inspection: providerRequestInspection,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    style_master_reference: candidate.style_master_reference,
  });
}

export function readFramedProgressiveTargetStoredPlanContext(runDir) {
  const context = readFramedTargetStoredPlanContext(runDir);
  return Object.freeze({ ...context, progressive_raw_work_plan: progressiveFramedPlanFromContext(context) });
}

export function framedProgressiveRawPlanProjection(plan) {
  const inspection = inspectProgressiveRawLifecycle({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    expected_plan: plan.progressive_raw_work_plan,
  });
  return Object.freeze({
    schema: "page-authority-progressive-raw-plan-projection-v1",
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
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawPilot({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, slide_ids: slideIds, display_by_slide: progressiveFramedDisplayBySlide(plan.receipt), expected_plan: plan.progressive_raw_work_plan });
}

export async function planFramedTargetExpansion(runDir, { planHash } = {}) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawExpansion({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, display_by_slide: progressiveFramedDisplayBySlide(plan.receipt), expected_plan: plan.progressive_raw_work_plan });
}

export async function authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash } = {}) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return authorizeProgressiveRawBatch({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, batch_hash: batchHash, expected_plan: plan.progressive_raw_work_plan });
}

export async function generateFramedProgressiveRawItem(runDir, { planHash, batchHash, submit } = {}) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    submit,
  });
}

async function publishFramedProgressivePilot({ context, plan, batch_sha256, coverage, materializations }) {
  const byId = new Map(context.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const frames = coverage.map((item) => {
    const slide = byId.get(item.slide_id);
    const materialization = materializations.get(item.slide_id);
    if (!slide || !materialization) throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is unavailable for ${item.slide_id}`);
    return Object.freeze({
      slide_id: item.slide_id,
      text_frame: slide.text_frame,
      verified_raw: { bytes: Buffer.from(materialization.bytes), sha256: item.raw_sha256 },
    });
  });
  // This uses the exact private compiler/browser evaluator used by finalization.
  const composed = await composeFramedRenderContracts(frames);
  const outputRoot = join(pageAuthorityImage2Paths(context.run_dir).review_root, "pilot", batch_sha256);
  const rawRoot = join(outputRoot, "raw-underlay");
  const compositeRoot = join(outputRoot, "text-frame-composite");
  mkdirSync(rawRoot, { recursive: true });
  mkdirSync(compositeRoot, { recursive: true });
  const items = coverage.map((item) => {
    const materialization = materializations.get(item.slide_id);
    const composite = composed.final_bytes_by_slide[item.slide_id];
    const position = plan.ordered_slide_ids.indexOf(item.slide_id) + 1;
    if (!materialization || position < 1) {
      throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is unavailable for ${item.slide_id}`);
    }
    if (!composite) throw new FramedImageWorkflowError("framed_pilot_capture_invalid", `Framed Pilot composite is unavailable for ${item.slide_id}`);
    const filename = pageAuthorityOrdinalImageFilename(position, item.slide_id);
    writeFileSync(join(rawRoot, filename), materialization.bytes);
    writeFileSync(join(compositeRoot, filename), composite);
    return { slide_id: item.slide_id, raw_sha256: item.raw_sha256, composite_sha256: sha256Bytes(composite) };
  });
  const projection = {
    schema: "page-authority-framed-pilot-projection-v1",
    workflow: FRAMED_IMAGE_WORKFLOW,
    raw_work_plan_sha256: plan.sha256,
    batch_sha256,
    render_profile_sha256: currentFramedRenderProfile().render_profile_digest,
    items,
  };
  writeFileSync(join(outputRoot, "projection.json"), Buffer.from(`${JSON.stringify(projection)}\n`, "utf8"));
  return Object.freeze({
    workflow_evidence_sha256: canonicalJsonSha256({ schema: "page-authority-framed-pilot-evidence-v1", workflow: FRAMED_IMAGE_WORKFLOW, render_profile_sha256: projection.render_profile_sha256, items }),
    projection_sha256: canonicalJsonSha256(projection),
  });
}

const FRAMED_PROGRESSIVE_PILOT_REVIEW_KEYS = Object.freeze(["planHash", "batchHash"]);

function requireFramedProgressivePilotReviewInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
    Object.keys(input).some((key) => !FRAMED_PROGRESSIVE_PILOT_REVIEW_KEYS.includes(key))) {
    throw new FramedImageWorkflowError(
      "framed_pilot_input_invalid",
      "Framed Pilot review accepts only the exact planHash and batchHash bindings",
    );
  }
  return input;
}

export async function prepareFramedProgressivePilotReview(runDir, input = {}) {
  const { planHash, batchHash } = requireFramedProgressivePilotReviewInput(input);
  const context = readFramedProgressiveTargetStoredPlanContext(runDir);
  return prepareProgressiveRawPilotEvidence({
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    publish: ({ plan, ...input }) => publishFramedProgressivePilot({ context, plan, ...input }),
  });
}

export async function acceptFramedProgressivePilot(runDir, { planHash, batchHash, decision } = {}) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    decision,
  });
  const handoff = recordTargetProgressivePilotDecision(plan.deck_dir, {
    runDir: plan.run_dir,
    progressiveRawWorkPlan: plan.progressive_raw_work_plan,
    pilotDecisionSha256: accepted.pilot_decision_sha256,
  });
  return Object.freeze({ ...accepted, progressive_handoff: handoff.record });
}

function progressiveFramedRawBytes(materializations) {
  return Object.fromEntries([...materializations.entries()].map(([slideId, materialization]) => [slideId, Buffer.from(materialization.bytes)]));
}

export async function prepareFramedProgressiveRawReview(runDir, { planHash } = {}) {
  const context = readFramedProgressiveTargetStoredPlanContext(runDir);
  const prepared = await prepareProgressiveRawCompleteReview({
    runDir: context.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    publish: async ({ materializations }) => publishProgressiveTargetCompleteRawReview(context, context.raw_work_plan, {
      raw_bytes_by_slide: progressiveFramedRawBytes(materializations),
      reviewContribution: createFramedTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan: context.raw_work_plan }),
    }),
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
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    decision,
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
  return reconcileProgressiveRawAttempt({ runDir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, attempt_sha256: attemptSha256, lookup });
}

/** Compose, publish, and deliver only from exact current v3 accepted raw evidence. */
export async function buildFramedProgressiveTargetDelivery(runDir) {
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: plan.progressive_raw_work_plan.sha256,
    expected_plan: plan.progressive_raw_work_plan,
  });
  const finalization = await composeFramedFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    evidencePlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
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

/** Framed finalization then shared delivery through the one target delivery owner. */
export async function buildFramedTargetDelivery(runDir) {
  const progressive = inspectProgressiveRawLifecycle({ runDir, workflow: FRAMED_IMAGE_WORKFLOW });
  if (progressive.ok && progressive.plan) return buildFramedProgressiveTargetDelivery(runDir);
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
  const refreshed = await refreshTargetPageAuthorityNotes({
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
