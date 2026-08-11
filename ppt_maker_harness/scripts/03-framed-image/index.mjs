import {
  composeFramedHeaderOverlays,
  describeFramedHeaderOverlay,
  verifyFramedHeaderOverlays,
} from "./internal/framed_render_contract.mjs";
import { currentFramedHeaderOverlayRenderProfile } from "./internal/framed_render_profile.mjs";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
  validateAcceptedRawEvidenceForFinalization,
  validateRawWorkPlan,
} from "../shared/image2/page_image_artifacts.mjs";
import {
  publishCompletePageReviewPresentation,
  publishPilotPageReviewPresentation,
  validateCompletePageReviewPresentation,
  validatePilotPageReviewPresentation,
} from "../shared/image2/page_image_complete_page_review.mjs";
import { publishCurrentFinalSlideManifest } from "../shared/image2/page_image_final_manifest.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../shared/identity/byte_hash.mjs";
import { parsePageImageSource } from "../01-content/index.mjs";
import {
  createPageImageSourceResolver,
  loadPageImagePresentationPackage,
  loadPageImageVisualLanguage,
  resolvePageImagePresentation,
} from "../02-visual-system/index.mjs";
import {
  PageImageCoreError,
  createPageImageCoreFacts,
  createPageImageProviderInputBinding,
  normalizePageImageHeaderPolicy,
  normalizePageImageProviderContent,
} from "../shared/page-image/page_image_core.mjs";
import { evaluatePageImageInvalidation } from "../shared/page-image/page_image_invalidation.mjs";
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
  rebindTargetProgressiveLocalComposeWork,
  resolveTargetLocalComposeContext,
  resolveTargetProgressiveLocalRebindContext,
  resolveTargetCandidateSourceContext,
  resolveTargetStoredPlanContext,
  resolveTargetSourceContext,
  targetSourceSemanticSha256,
  targetRawPlanProjection,
  validateTargetCurrentRawReview,
  validateTargetRawReviewContribution,
  writeTargetProviderRequestInspection,
  writeTargetFinalManifest,
  writeProgressiveTargetFinalManifest,
  writeTargetRawWorkPlan,
  isPageImageProviderClausesBoundToVisualLanguage,
  isPageImageProviderClausesShape,
  TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../shared/image2/page_image_target_runtime.mjs";
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
} from "../shared/image2/page_image_progressive_raw_owner.mjs";
import {
  requireExactExecutionForRun,
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressiveDeliveryReceipt,
  recordTargetProgressiveFinalManifest,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveRawPlan,
  ensureCurrentPageImageTaskMandate,
  inspectCurrentPageImageTaskMandate,
} from "../shared/state/state.mjs";
import {
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../shared/image2/style_master_scope.mjs";
import {
  deliverTargetFinalSlideManifest,
  refreshTargetPageImageNotes,
} from "../05-delivery/index.mjs";

/** Current Framed workflow owner. */
export const FRAMED_IMAGE_WORKFLOW = "framed";

export const FRAMED_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
]);

/** Public run-scoped API inventory. The mutation list is guarded directly so
 * imported workflow owners cannot bypass CLI route preflight. */
export const FRAMED_IMAGE_OPERATION_MAP = Object.freeze({
  read_only: Object.freeze([
    "resolveFramedTargetSource",
    "resolveFramedTargetCandidateSource",
    "resolveFramedStyleMasterScope",
    "readFramedTargetStoredPlanContext",
    "framedTargetRawPlanProjection",
    "readFramedProgressiveTargetPlanCandidate",
    "inspectFramedProgressiveLocalRebind",
    "readFramedProgressiveTargetStoredPlanContext",
    "framedProgressiveRawPlanProjection",
    "inspectFramedProgressivePilotPageReview",
    "inspectFramedProgressiveCompletePageReview",
    "inspectFramedProgressiveCurrentCompletePageReview",
  ]),
  side_effecting: Object.freeze([
    "buildFramedTargetRawPlan",
    "authorizeFramedTargetRawPlan",
    "generateFramedTargetRawPlan",
    "prepareFramedTargetRawReview",
    "decideFramedTargetRawReview",
    "buildFramedProgressiveTargetRawPlan",
    "planFramedTargetPilot",
    "planFramedTargetExpansion",
    "authorizeFramedProgressiveRawBatch",
    "generateFramedProgressiveRawItem",
    "prepareFramedProgressivePilotReview",
    "acceptFramedProgressivePilot",
    "prepareFramedProgressiveRawReview",
    "acceptFramedProgressiveRawReview",
    "reconcileFramedProgressiveRawAttempt",
    "buildFramedProgressiveTargetDelivery",
    "buildFramedTargetDelivery",
    "refreshFramedTargetText",
    "refreshFramedTargetNotes",
  ]),
});

export class FramedImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedImageWorkflowError";
    this.code = code;
  }
}

// Direct imports of this workflow owner use the same State-owned execution
// fence as CLI routing, before source, artifact, or provider side effects.
function preflightFramedMutation(runDir) {
  return requireExactExecutionForRun(runDir);
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
  "page_image_core",
  "provider_rendered_content",
  "framed",
]);
const FRAMED_RAW_CONTRACT_CORE_KEYS = Object.freeze(["schema", "canonical_semantic_sha256"]);
const FRAMED_PROVIDER_RENDERED_CONTENT_KEYS = Object.freeze(["items"]);
const FRAMED_RAW_CONTRACT_FRAME_KEYS = Object.freeze([
  "profile_id",
  "profile_digest",
  "presentation_binding_sha256",
  "canvas",
  "protected_geometry",
  "local_header",
  "context_not_to_render",
  "render_profile_digest",
]);
const FRAMED_HEADER_POLICY_KEYS = Object.freeze(["local_header", "context_not_to_render"]);
const FRAMED_HEADER_FIELDS = Object.freeze(["kicker", "title", "subtitle"]);
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
      !isPageImageProviderClausesShape(rawContract.provider_clauses) ||
      !isPageImageProviderClausesBoundToVisualLanguage(rawContract.visual_language, rawContract.provider_clauses) ||
      (rawContract.visual_identity_role_clause !== null && typeof rawContract.visual_identity_role_clause !== "string") ||
      (rawContract.visual_scene !== null && typeof rawContract.visual_scene !== "string") ||
      (rawContract.visual_identity !== null && (!rawContract.visual_identity || typeof rawContract.visual_identity !== "object" || Array.isArray(rawContract.visual_identity))) ||
      !hasExactKeys(rawContract.page_image_core, FRAMED_RAW_CONTRACT_CORE_KEYS) ||
      rawContract.page_image_core.schema !== "page-image-core-slide-facts" ||
      !SHA256_RE.test(rawContract.page_image_core.canonical_semantic_sha256 || "") ||
      !hasExactKeys(rawContract.provider_rendered_content, FRAMED_PROVIDER_RENDERED_CONTENT_KEYS) ||
      !Array.isArray(rawContract.provider_rendered_content.items) ||
      !hasExactKeys(rawContract.framed, FRAMED_RAW_CONTRACT_FRAME_KEYS)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has an invalid canonical shape");
    }
    const frame = rawContract.framed;
    if (frame.profile_id !== renderProfile?.preset?.id ||
      frame.profile_digest !== renderProfile?.preset?.digest ||
      !Array.isArray(frame.protected_geometry) || frame.protected_geometry.length === 0 ||
      frame.protected_geometry.some((rectangle) => !isRectangle(rectangle, frame.canvas)) ||
      !SHA256_RE.test(frame.presentation_binding_sha256 || "") || !SHA256_RE.test(frame.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has invalid frame facts");
    }
    if (!SHA256_RE.test(renderProfile?.render_profile_digest || "")) {
      throw new FramedImageWorkflowError("framed_render_profile_required", "Framed raw contracts require the canonical render profile");
    }
    if (frame.render_profile_digest !== renderProfile.render_profile_digest) {
      throw new FramedImageWorkflowError("framed_raw_contract_profile_stale", "Framed raw contract does not bind the current render profile");
    }
    const headerPolicy = normalizePageImageHeaderPolicy({
      local_header: frame.local_header,
      context_not_to_render: frame.context_not_to_render,
    }, FRAMED_IMAGE_WORKFLOW);
    const providerContent = normalizePageImageProviderContent(rawContract.provider_rendered_content);
    if (canonicalJsonSha256(headerPolicy.local_header) !== canonicalJsonSha256(frame.local_header) ||
      canonicalJsonSha256(headerPolicy.context_not_to_render) !== canonicalJsonSha256(frame.context_not_to_render) ||
      canonicalJsonSha256(providerContent.items) !== canonicalJsonSha256(rawContract.provider_rendered_content.items)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract must retain normalized Page Image Core facts");
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
  try {
    if (!hasExactKeys(rawContract, FRAMED_RAW_CONTRACT_KEYS) || !hasExactKeys(rawContract.framed, FRAMED_RAW_CONTRACT_FRAME_KEYS)) {
      throw new FramedImageWorkflowError("framed_raw_contract_invalid", "Framed raw contract has an invalid canonical shape");
    }
    return validateFramedRawContractAgainstProfile(rawContract, {
      preset: { id: rawContract.framed.profile_id, digest: rawContract.framed.profile_digest },
      render_profile_digest: rawContract.framed.render_profile_digest,
    });
  } catch (error) {
    return Object.freeze({ ok: false, code: error.code || "framed_raw_contract_invalid", message: error.message || "Framed raw contract is invalid" });
  }
}

function requireReceipt(receipt) {
  if (!receipt || receipt.schema !== "page-image-workflow-source" || receipt.workflow !== FRAMED_IMAGE_WORKFLOW || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed workflow requires a current Page Image Workflow framed receipt");
  }
  return receipt;
}

function canonicalFramedFrameFacts(frame) {
  const layout = frame?.layout;
  const profile = frame?.render_profile;
  if (!layout || !profile || typeof profile.preset?.id !== "string" ||
    !SHA256_RE.test(profile.preset?.digest || "") ||
    !layout.canvas || !Array.isArray(layout.protected_geometry) || layout.protected_geometry.length === 0) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", "Framed render contract is missing canonical raw facts");
  }
  return Object.freeze({
    profile_id: profile.preset.id,
    profile_digest: profile.preset.digest,
    canvas: layout.canvas,
    protected_geometry: Object.freeze(layout.protected_geometry.map(({ x, y, width, height }) => ({ x, y, width, height }))),
  });
}

function framedHeaderOverlayInput(slide) {
  const policy = slide?.header_policy;
  const presentation = slide?.visual_language?.presentation;
  if (!hasExactKeys(policy, FRAMED_HEADER_POLICY_KEYS) ||
    !hasExactKeys(policy.local_header, FRAMED_HEADER_FIELDS) ||
    !hasExactKeys(policy.context_not_to_render, FRAMED_HEADER_FIELDS) ||
    canonicalJsonSha256(policy.local_header) !== canonicalJsonSha256(policy.context_not_to_render) ||
    !presentation || presentation.workflow !== FRAMED_IMAGE_WORKFLOW || presentation.page_class !== slide.page_class ||
    !SHA256_RE.test(presentation.binding_sha256 || "") || !presentation.profile || typeof presentation.profile !== "object") {
    throw new FramedImageWorkflowError("framed_header_policy_invalid", "Framed slides require one closed local header and matching context-not-to-render facts");
  }
  return Object.freeze({
    slide_id: slide.slide_id,
    presentation_profile: presentation.profile,
    local_header: policy.local_header,
  });
}

function describeFramedSlide(slide) {
  return describeFramedHeaderOverlay(framedHeaderOverlayInput(slide));
}

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

function framedRawPlanItems(receipt) {
  requireReceipt(receipt);
  return Object.freeze(receipt.slides.map((slide) => Object.freeze({
    slide_id: slide.slide_id,
  })));
}

/** The selected adapter alone writes target raw plans for its framed receipt. */
export function createFramedRawWorkPlan({
  receipt,
  provider_profile_sha256,
  authorization_scope_sha256,
  raw_contracts_by_slide,
  provider_input_bindings_by_slide,
} = {}) {
  const items = framedRawPlanItems(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new FramedImageWorkflowError("raw_contracts_required", "Framed raw contracts are required for every slide");
  }
  if (!provider_input_bindings_by_slide || typeof provider_input_bindings_by_slide !== "object" || Array.isArray(provider_input_bindings_by_slide) ||
    canonicalJson(Object.keys(provider_input_bindings_by_slide).sort()) !== canonicalJson(items.map((item) => item.slide_id).sort())) {
    throw new FramedImageWorkflowError("framed_provider_input_bindings_required", "Framed raw plans require one provider input binding for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_slide_ids: items.map((item) => item.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: items.map((item) => ({
      slide_id: item.slide_id,
      raw_contract_sha256: raw_contracts_by_slide[item.slide_id],
      provider_input_binding: provider_input_bindings_by_slide[item.slide_id],
    })),
  });
}

/**
 * Map Framed's canonical header-overlay geometry into the shared review
 * contribution interface. Protected geometry is a provider-avoidance and
 * review fact, never a rendered panel or blank strip.
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
    const frame = describeFramedSlide(slide);
    const title = slide.header_policy?.local_header?.title;
    if (typeof title !== "string" || !title.trim()) {
      throw new FramedImageWorkflowError("framed_review_contribution_label_invalid", `Framed raw-review projection requires a title for ${slideId}`);
    }
    return Object.freeze({ slide, frame, title });
  });
  const contribution = createTargetRawReviewContribution({
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_stable_ids: rawWorkPlan.ordered_slide_ids,
    coverage_items: described.map(({ frame }, index) => ({
      stable_id: rawWorkPlan.ordered_slide_ids[index],
      coverage_profile_digest: frame.render_profile.render_profile_digest,
      guide_primitives: frame.layout.protected_geometry.map((rectangle, guideIndex) => ({
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

function framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null, reviewSlideIds = reviewPlan?.ordered_slide_ids } = {}) {
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
    throw new FramedImageWorkflowError("framed_complete_page_review_invalid", "Framed Complete Page Review requires one current raw plan");
  }
  const contribution = createFramedTargetRawReviewContribution({
    receipt: context.receipt,
    rawWorkPlan: context.raw_work_plan,
  });
  const slideById = new Map(context.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const raw = {};
  const frames = [];
  const bindings = {};
  for (const slideId of reviewSlideIds) {
    const slide = slideById.get(slideId);
    const rawBytes = rawBytesBySlide?.[slideId];
    if (!slide || !rawBytes) {
      throw new FramedImageWorkflowError("framed_complete_page_review_invalid", `Framed Complete Page Review is missing current provider bytes for ${slideId}`);
    }
    const frame = describeFramedSlide(slide);
    const providerBytes = Buffer.from(rawBytes);
    const providerSha256 = sha256Bytes(providerBytes);
    raw[slideId] = providerBytes;
    frames.push(Object.freeze({
      ...framedHeaderOverlayInput(slide),
      verified_raw: { bytes: providerBytes, sha256: providerSha256 },
    }));
    bindings[slideId] = canonicalJsonSha256({
      schema: "page-image-framed-complete-page-binding",
      raw_work_plan_sha256: reviewPlanSha256,
      slide_id: slideId,
      raw_provider_page_sha256: providerSha256,
      header_overlay: framedHeaderOverlayInput(slide),
      render_profile_sha256: frame.render_profile.render_profile_digest,
      protected_geometry_sha256: canonicalJsonSha256(frame.layout.protected_geometry),
    });
  }
  return Object.freeze({
    contribution,
    raw_work_plan_sha256: reviewPlanSha256,
    source_epoch: resolvedSourceEpoch,
    raw_bytes_by_slide: Object.freeze(raw),
    frames: Object.freeze(frames),
    adapter_complete_page_bindings_by_slide: Object.freeze(bindings),
  });
}

function framedPilotReviewContribution({ inputs, batchSha256, coverage } = {}) {
  if (!SHA256_RE.test(batchSha256 || "") || !Array.isArray(coverage)) {
    throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", "Framed Pilot contribution requires exact current batch coverage");
  }
  const slideIds = Object.keys(inputs.raw_bytes_by_slide);
  if (coverage.length !== slideIds.length || new Set(coverage.map((item) => item?.slide_id)).size !== slideIds.length) {
    throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", "Framed Pilot coverage must name each selected slide exactly once");
  }
  const coverageBySlide = new Map(coverage.map((item) => [item.slide_id, item]));
  const items = slideIds.map((slideId) => {
    const item = coverageBySlide.get(slideId);
    if (!item || item.raw_sha256 !== sha256Bytes(inputs.raw_bytes_by_slide[slideId])) {
      throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is stale for ${slideId}`);
    }
    return Object.freeze({
      slide_id: slideId,
      raw_sha256: item.raw_sha256,
      adapter_complete_page_binding_sha256: inputs.adapter_complete_page_bindings_by_slide[slideId],
    });
  });
  return canonicalJsonSha256({
    schema: "page-image-framed-pilot-review-contribution",
    raw_work_plan_sha256: inputs.raw_work_plan_sha256,
    batch_sha256: batchSha256,
    complete_page_review_contribution_sha256: inputs.contribution.typed_review_contribution_sha256,
    items,
  });
}

async function publishFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide } = {}) {
  const inputs = framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide });
  const composed = await composeFramedHeaderOverlays(inputs.frames);
  return publishCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    completeBytesBySlide: composed.final_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

function validateFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null } = {}) {
  const inputs = framedCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch });
  return validateCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

function requireFramedFinalizationReview(validation, acceptedCompleteReview) {
  const reviewEvidenceSha256 = acceptedCompleteReview?.workflow_evidence_sha256 ??
    acceptedCompleteReview?.complete_page_presentation_sha256;
  if (!validation?.ok || !acceptedCompleteReview ||
    acceptedCompleteReview.decision !== "proceed" ||
    validation.complete_page_presentation_sha256 !== reviewEvidenceSha256 ||
    validation.projection_sha256 !== acceptedCompleteReview.projection_sha256) {
    throw new FramedImageWorkflowError(
      "framed_finalization_review_stale",
      "Framed finalization requires the exact current proceeded Complete Page Review",
    );
  }
  return validation.presentation;
}

function assertFramedFinalMatchesReviewedComposite(finalBytesBySlide, presentation) {
  for (const item of presentation.items) {
    const finalBytes = finalBytesBySlide?.[item.slide_id];
    if (!finalBytes || sha256Bytes(finalBytes) !== item.complete_page_sha256) {
      throw new FramedImageWorkflowError(
        "framed_finalization_composite_stale",
        `Framed final composite no longer matches the reviewed page for ${item.slide_id}`,
      );
    }
  }
}

function readFramedTargetFinalizationReview(context, rawWorkPlan, acceptedRawEvidence) {
  const current = validateTargetCurrentRawReview(context, rawWorkPlan, {
    reviewContribution: createFramedTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan }),
    acceptedRawEvidence,
    validateCompletePageReview: ({ raw_work_plan: reviewPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validateFramedCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch }),
  });
  return Object.freeze({
    presentation: requireFramedFinalizationReview(current.completePresentation, current.review),
    raw_bytes_by_slide: current.rawBytes,
  });
}

function readFramedProgressiveFinalizationReview(context, progressiveRawWorkPlan, rawBytesBySlide, acceptedCompleteReview) {
  const validation = validateFramedCompletePageReview({
    context,
    reviewPlan: progressiveRawWorkPlan,
    rawBytesBySlide,
    sourceEpoch: progressiveRawWorkPlan.source_epoch,
  });
  return requireFramedFinalizationReview(validation, acceptedCompleteReview);
}

function requireFramedCurrentCompleteReview(validation, currentCompleteReview) {
  if (!validation?.ok || !currentCompleteReview ||
    validation.complete_page_presentation_sha256 !== currentCompleteReview.workflow_evidence_sha256 ||
    validation.projection_sha256 !== currentCompleteReview.projection_sha256) {
    throw new FramedImageWorkflowError(
      "framed_current_complete_review_stale",
      "Framed current Complete Page Review no longer binds its provider and presentation evidence",
    );
  }
  return validation.presentation;
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

/** Compose the closed local header overlay over accepted provider-page bytes. */
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
      ...framedHeaderOverlayInput(slide),
      verified_raw: { bytes: Buffer.from(raw), sha256: item.raw_sha256 },
    }));
  }
  const composed = await composeFramedHeaderOverlays(frames);
  const finalBytesBySlide = composed.final_bytes_by_slide;
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan: evidencePlan,
    acceptedRawEvidence,
    ownerWorkflow: FRAMED_IMAGE_WORKFLOW,
    finalBytesBySlide,
  });
  return Object.freeze({ manifest, final_bytes_by_slide: Object.freeze(finalBytesBySlide) });
}

/** Return only the Framed finalization manifest. */
export async function publishFramedFinalSlideManifest(input = {}) {
  return (await composeFramedFinalSlideManifest(input)).manifest;
}

function parseFramedTargetReceipt({ runDir, deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageImageVisualLanguage(deckDir);
  const presentationPackage = loadPageImagePresentationPackage(runDir);
  const visualResolver = createPageImageSourceResolver({ deckDir, visualLanguage });
  return parsePageImageSource(sourceText, {
    source: sourcePath,
    registry: {
      resolveSelection(context) {
        return Object.freeze({
          ...visualResolver.resolveSelection(context),
          presentation: resolvePageImagePresentation({
            package: presentationPackage,
            workflow: context.workflow,
            pageClass: context.page_class,
            headerPolicy: context.header_policy,
          }),
        });
      },
    },
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
  const sourceCandidate = resolveFramedTargetCandidateSource(runDir);
  const scope = resolveStyleMasterScopeContext(runDir, { sourceCandidate });
  if (scope.workflow !== FRAMED_IMAGE_WORKFLOW) {
    throw new FramedImageWorkflowError("wrong_workflow_owner", "Framed Style Master scope requires the selected framed workflow");
  }
  return bindStyleMasterScopeCandidate(scope, sourceCandidate);
}

function coreStyleMasterSelection(workflow, styleMasterReference) {
  if (!styleMasterReference || typeof styleMasterReference !== "object" ||
    !SHA256_RE.test(styleMasterReference.selection_sha256 || "") ||
    !SHA256_RE.test(styleMasterReference.plan_sha256 || "")) {
    throw new FramedImageWorkflowError("framed_page_image_core_invalid", "Framed adapter requires current Style Master selection facts for Page Image Core");
  }
  return Object.freeze({
    workflow,
    selection_sha256: styleMasterReference.selection_sha256,
    plan_sha256: styleMasterReference.plan_sha256,
  });
}

function createFramedCoreFacts(context, generation) {
  try {
    return createPageImageCoreFacts({
      sourceReceipt: context.receipt,
      visualSelections: context.receipt.slides.map((slide) => ({
        slide_id: slide.slide_id,
        selection: slide.visual_language,
      })),
      styleMasterSelection: coreStyleMasterSelection(FRAMED_IMAGE_WORKFLOW, generation.style_master_reference),
      generationProfile: generation.profile,
      headerRenderingPolicy: { workflow: FRAMED_IMAGE_WORKFLOW, policy: "local-transparent-overlay" },
    });
  } catch (error) {
    if (error instanceof PageImageCoreError) {
      throw new FramedImageWorkflowError("framed_page_image_core_invalid", error.message);
    }
    throw error;
  }
}

function framedRawContract(slide, frame, coreSlide) {
  const visualLanguage = coreSlide?.visual_selection?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new FramedImageWorkflowError("framed_visual_language_required", `Framed visual language is unresolved for ${slide.slide_id}`);
  }
  if (frame?.slide_id !== slide.slide_id || !SHA256_RE.test(frame?.render_profile?.render_profile_digest || "")) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", `Framed render contract is unavailable for ${slide.slide_id}`);
  }
  if (coreSlide.slide_id !== slide.slide_id || coreSlide.workflow !== FRAMED_IMAGE_WORKFLOW ||
    coreSlide.header_policy?.local_header === undefined || coreSlide.header_policy?.context_not_to_render === undefined) {
    throw new FramedImageWorkflowError("framed_page_image_core_invalid", `Framed Page Image Core facts are unavailable for ${slide.slide_id}`);
  }
  const facts = canonicalFramedFrameFacts(frame);
  const presentation = coreSlide.visual_selection?.presentation;
  if (!presentation || presentation.workflow !== FRAMED_IMAGE_WORKFLOW ||
    presentation.page_class !== slide.page_class || !SHA256_RE.test(presentation.binding_sha256 || "")) {
    throw new FramedImageWorkflowError("framed_page_presentation_required", `Framed page presentation is unavailable for ${slide.slide_id}`);
  }
  const providerClauses = coreSlide.visual_selection?.provider_clauses || null;
  const identityRoleClause = coreSlide.visual_selection?.identity_reference?.provider_reference?.role_clause || null;
  const rawContract = Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: FRAMED_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    provider_clauses: providerClauses,
    visual_identity_role_clause: identityRoleClause,
    visual_scene: null,
    visual_identity: coreSlide.visual_selection?.identity_reference?.projection || null,
    page_image_core: {
      schema: coreSlide.schema,
      canonical_semantic_sha256: coreSlide.canonical_semantic_sha256,
    },
    provider_rendered_content: {
      items: coreSlide.provider_content.items.map((item) => ({ ...item })),
    },
    framed: {
      ...facts,
      presentation_binding_sha256: presentation.binding_sha256,
      local_header: { ...coreSlide.header_policy.local_header },
      context_not_to_render: { ...coreSlide.header_policy.context_not_to_render },
      render_profile_digest: frame.render_profile.render_profile_digest,
    },
  });
  return rawContract;
}

/** Compile Framed's provider page while reserving its transparent local header overlay. */
function compileFramedProviderInput({ slideId, rawContract, generationProfile } = {}) {
  const contract = validateFramedRawContract(rawContract);
  if (!contract.ok || rawContract.slide_id !== slideId || !generationProfile || typeof generationProfile !== "object") {
    throw new FramedImageWorkflowError("framed_provider_input_invalid", "Framed provider input requires one valid selected raw contract and generation profile");
  }
  const utf8 = canonicalJson({
    schema: "page-image-framed-provider-input",
    slide_id: slideId,
    instruction: "Render one complete premium keynote provider page. Render every provider-rendered content item as readable integrated page typography. Keep the full provider canvas continuous. Do not render, repeat, or approximate the fixed header literals; avoid provider text and key subjects in the protected geometry.",
    provider_rendered_content: rawContract.provider_rendered_content,
    context_not_to_render: rawContract.framed.context_not_to_render,
    protected_geometry: rawContract.framed.protected_geometry,
    visual: {
      recipe: rawContract.provider_clauses.recipe,
      composition: rawContract.provider_clauses.composition,
      motifs: rawContract.provider_clauses.motifs,
      relationship: rawContract.provider_clauses.relationship || null,
      identity: rawContract.visual_identity,
    },
    generation_profile: generationProfile,
  });
  return Object.freeze({
    schema: TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
    utf8,
    sha256: sha256Bytes(Buffer.from(utf8, "utf8")),
  });
}

/** Compile a selected Framed current raw-plan candidate without artifact writes. */
function compileFramedTargetRawPlanCandidate(context) {
  const framesById = new Map(context.receipt.slides.map((slide) => [slide.slide_id, describeFramedSlide(slide)]));
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
  const coreFacts = createFramedCoreFacts(context, generation);
  const coreSlidesById = new Map(coreFacts.slides.map((slide) => [slide.slide_id, slide]));
  const rawContractsBySlide = {};
  const providerInputBindingsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const frame = framesById.get(slide.slide_id);
    const coreSlide = coreSlidesById.get(slide.slide_id);
    const rawContract = framedRawContract(slide, frame, coreSlide);
    const rawContractValidation = validateFramedRawContractAgainstProfile(rawContract, frame.render_profile);
    if (!rawContractValidation.ok) throw new FramedImageWorkflowError(rawContractValidation.code, rawContractValidation.message);
    rawContractsBySlide[slide.slide_id] = rawContractValidation.raw_contract_sha256;
    const compiledProviderInput = compileFramedProviderInput({
      slideId: slide.slide_id,
      rawContract,
      generationProfile: generation.profile,
    });
    providerRequestsBySlide[slide.slide_id] = createTargetProviderRequest({
      slideId: slide.slide_id,
      rawContract,
      generationProfile: generation.profile,
      compiledProviderInput,
    });
    providerInputBindingsBySlide[slide.slide_id] = createPageImageProviderInputBinding({
      coreSlide,
      compiledProviderInputSha256: compiledProviderInput.sha256,
      localHeaderProfileSha256: frame.render_profile.render_profile_digest,
      protectedGeometrySha256: canonicalJsonSha256(rawContract.framed.protected_geometry),
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  const rawWorkPlan = createFramedRawWorkPlan({
    receipt: context.receipt,
    provider_profile_sha256: generation.provider_profile_sha256,
    authorization_scope_sha256: authorizationScopeSha,
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  return Object.freeze({
    ...context,
    raw_work_plan: rawWorkPlan,
    provider_requests_by_slide: Object.freeze(providerRequestsBySlide),
    frames_by_slide: Object.freeze(Object.fromEntries(framesById)),
    page_image_core: coreFacts,
    style_master_reference: generation.style_master_reference,
  });
}

function verifyFramedCandidateProof(candidate, proof) {
  const expected = candidate.receipt.slides.map((slide) => slide.slide_id);
  if (!proof || !Array.isArray(proof.pages) || canonicalJson(proof.pages.map((page) => page.slide_id)) !== canonicalJson(expected)) {
    throw new FramedImageWorkflowError("framed_render_profile_stale", "Framed layout proof did not return the candidate's ordered stable page IDs");
  }
  for (const page of proof.pages) {
    const frame = candidate.frames_by_slide?.[page.slide_id];
    if (!frame || page.render_profile_digest !== frame.render_profile.render_profile_digest ||
      canonicalJson(page.layout?.protected_geometry) !== canonicalJson(frame.layout.protected_geometry)) {
      throw new FramedImageWorkflowError("framed_render_profile_stale", `Framed layout proof did not bind the candidate profile and guide for ${page.slide_id}`);
    }
  }
}

/**
 * Prove the complete current Framed candidate before source/state/plan
 * materialization. The state owner rechecks the exact candidate bytes.
 */
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
  return authorizeTargetRawWork(plan, plan.raw_work_plan, { planHash });
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

/** Compile/prove selected Framed source then publish only its provider-free v3 full plan. */
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
  return authorizeProgressiveRawBatch({ runDir: plan.run_dir, workflow: FRAMED_IMAGE_WORKFLOW, plan_hash: planHash, batch_hash: batchHash, expected_plan: plan.progressive_raw_work_plan, task_mandate: plan.progressive_raw_task_mandate });
}

export async function generateFramedProgressiveRawItem(runDir, { planHash, batchHash, preflight = null, submit } = {}) {
  preflightFramedMutation(runDir);
  const plan = readFramedProgressiveTargetStoredPlanContext(runDir);
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: FRAMED_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    preflight,
    submit,
    task_mandate: plan.progressive_raw_task_mandate,
  });
}

async function publishFramedProgressivePilot({ context, plan, batch_sha256, coverage, materializations }) {
  const pilotSlideIds = coverage.map((item) => item.slide_id);
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    if (!materialization) throw new FramedImageWorkflowError("framed_pilot_coverage_invalid", `Framed Pilot coverage is unavailable for ${slideId}`);
    return [slideId, Buffer.from(materialization.bytes)];
  }));
  const inputs = framedCompletePageReviewInputs({
    context,
    reviewPlan: plan,
    rawBytesBySlide,
    reviewSlideIds: pilotSlideIds,
  });
  // This uses the exact private compiler/browser evaluator used by finalization.
  const composed = await composeFramedHeaderOverlays(inputs.frames);
  const typedReviewContributionSha256 = framedPilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage });
  const published = await publishPilotPageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    batchSha256: batch_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: FRAMED_IMAGE_WORKFLOW,
    typedReviewContributionSha256,
    orderedPlanSlideIds: plan.ordered_slide_ids,
    pilotSlideIds,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    completeBytesBySlide: composed.final_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
  return Object.freeze({
    workflow_evidence_sha256: published.pilot_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

function validateFramedProgressivePilot({ context, plan, batch, batch_sha256, coverage, materializations } = {}) {
  const pilotSlideIds = batch.review_sample_slide_ids;
  const rawBytesBySlide = Object.fromEntries(pilotSlideIds.map((slideId) => {
    const materialization = materializations.get(slideId);
    return [slideId, materialization ? Buffer.from(materialization.bytes) : null];
  }));
  try {
    const inputs = framedCompletePageReviewInputs({
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
      workflow: FRAMED_IMAGE_WORKFLOW,
      typedReviewContributionSha256: framedPilotReviewContribution({ inputs, batchSha256: batch_sha256, coverage }),
      orderedPlanSlideIds: plan.ordered_slide_ids,
      pilotSlideIds,
      rawBytesBySlide: inputs.raw_bytes_by_slide,
      adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "framed_pilot_review_invalid",
      message: error.message || "Framed Pilot page review is invalid",
    });
  }
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

function progressiveFramedRawBytes(materializations) {
  return Object.fromEntries([...materializations.entries()].map(([slideId, materialization]) => [slideId, Buffer.from(materialization.bytes)]));
}

async function publishFramedProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  const published = await publishFramedCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveFramedRawBytes(materializations),
  });
  return Object.freeze({
    workflow_evidence_sha256: published.complete_page_presentation_sha256,
    projection_sha256: published.projection_sha256,
  });
}

function validateFramedProgressiveCompletePageReview({ context, plan, materializations } = {}) {
  return validateFramedCompletePageReview({
    context,
    reviewPlan: plan,
    rawBytesBySlide: progressiveFramedRawBytes(materializations),
  });
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

/** Framed finalization then shared delivery through the one target delivery owner. */
export async function buildFramedTargetDelivery(runDir) {
  preflightFramedMutation(runDir);
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
