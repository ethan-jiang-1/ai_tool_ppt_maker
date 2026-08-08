import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
  validateAcceptedRawEvidence,
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
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "../shared/image2/page_image_media_contract.mjs";
import { parsePageImageSource } from "../01-content/index.mjs";
import {
  createPageImageSourceResolver,
  loadPageImageVisualLanguage,
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
  resolveTargetLocalComposeContext,
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
  assertNoUnresolvedProgressiveRawSubmission,
  authorizeProgressiveRawBatch,
  createProgressiveRawWorkPlanFromTarget,
  generateProgressiveRawItem,
  inspectProgressiveRawLifecycle,
  planProgressiveRawExpansion,
  planProgressiveRawPilot,
  prepareProgressiveRawCompleteReview,
  prepareProgressiveRawPilotEvidence,
  acceptProgressiveRawCompleteReview,
  acceptProgressiveRawPilot,
  publishProgressiveRawWorkPlan,
  readCurrentProgressiveRawPilotWork,
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../shared/image2/page_image_progressive_raw_owner.mjs";
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
} from "../05-delivery/index.mjs";

/** TARGET Pure workflow owner. Behavior moves here from the bounded v1 adapter. */
export const PURE_IMAGE_WORKFLOW = "pure";

export const PURE_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
]);

export class PureImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PureImageWorkflowError";
    this.code = code;
  }
}

const PURE_RAW_CONTRACT_KEYS = Object.freeze([
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
]);
const PURE_RAW_CONTRACT_CORE_KEYS = Object.freeze(["schema", "canonical_semantic_sha256"]);
const PURE_PROVIDER_RENDERED_CONTENT_KEYS = Object.freeze(["header", "items"]);
const PURE_HEADER_KEYS = Object.freeze(["kicker", "title", "subtitle"]);
const SHA256_RE = /^[0-9a-f]{64}$/;

function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/** Validate one Pure raw contract before it can bind a request or plan. */
export function validatePureRawContract(rawContract) {
  try {
    if (!hasExactKeys(rawContract, PURE_RAW_CONTRACT_KEYS) ||
      rawContract.schema !== TARGET_RAW_CONTRACT_SCHEMA ||
      rawContract.workflow !== PURE_IMAGE_WORKFLOW ||
      typeof rawContract.slide_id !== "string" || !rawContract.slide_id.trim() ||
      !rawContract.visual_language || typeof rawContract.visual_language !== "object" || Array.isArray(rawContract.visual_language) ||
      !isPageImageProviderClausesShape(rawContract.provider_clauses) ||
      !isPageImageProviderClausesBoundToVisualLanguage(rawContract.visual_language, rawContract.provider_clauses) ||
      (rawContract.visual_identity_role_clause !== null && typeof rawContract.visual_identity_role_clause !== "string") ||
      (rawContract.visual_scene !== null && typeof rawContract.visual_scene !== "string") ||
      (rawContract.visual_identity !== null && (!rawContract.visual_identity || typeof rawContract.visual_identity !== "object" || Array.isArray(rawContract.visual_identity))) ||
      !hasExactKeys(rawContract.page_image_core, PURE_RAW_CONTRACT_CORE_KEYS) ||
      rawContract.page_image_core.schema !== "page-image-core-slide-facts-v1" ||
      !SHA256_RE.test(rawContract.page_image_core.canonical_semantic_sha256 || "") ||
      !hasExactKeys(rawContract.provider_rendered_content, PURE_PROVIDER_RENDERED_CONTENT_KEYS) ||
      !hasExactKeys(rawContract.provider_rendered_content.header, PURE_HEADER_KEYS) ||
      !Array.isArray(rawContract.provider_rendered_content.items)) {
      throw new PureImageWorkflowError("pure_raw_contract_invalid", "Pure raw contract has an invalid canonical shape");
    }
    const normalizedHeader = normalizePageImageHeaderPolicy({
      provider_visible: rawContract.provider_rendered_content.header,
    }, PURE_IMAGE_WORKFLOW);
    const normalizedContent = normalizePageImageProviderContent({
      items: rawContract.provider_rendered_content.items,
    });
    if (canonicalJsonSha256(normalizedHeader.provider_visible) !== canonicalJsonSha256(rawContract.provider_rendered_content.header) ||
      canonicalJsonSha256(normalizedContent.items) !== canonicalJsonSha256(rawContract.provider_rendered_content.items)) {
      throw new PureImageWorkflowError("pure_raw_contract_invalid", "Pure provider-rendered content must be normalized by Page Image Core");
    }
    return Object.freeze({
      ok: true,
      raw_contract_sha256: canonicalJsonSha256(rawContract),
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "pure_raw_contract_invalid",
      message: error.message || "Pure raw contract is invalid",
    });
  }
}

function requireReceipt(receipt) {
  if (!receipt || receipt.schema !== "page-image-workflow-source-v1" || receipt.workflow !== PURE_IMAGE_WORKFLOW || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure workflow requires a current Page Image Workflow pure receipt");
  }
  return receipt;
}

function requirePureNativeFinalBytes(acceptedRawEvidence, rawBytesBySlide) {
  if (!rawBytesBySlide || typeof rawBytesBySlide !== "object" || Array.isArray(rawBytesBySlide)) {
    throw new PureImageWorkflowError("pure_final_media_invalid", "Pure finalization requires accepted native raw PNG bytes");
  }
  for (const item of acceptedRawEvidence.items) {
    const media = inspectExactPageImagePng(rawBytesBySlide[item.slide_id], PAGE_IMAGE_NATIVE_RAW_PNG);
    if (!media.ok) throw new PureImageWorkflowError("pure_final_media_invalid", `Pure final bytes for ${item.slide_id} must be a valid PNG`);
    if (sha256Bytes(media.bytes) !== item.raw_sha256) {
      throw new PureImageWorkflowError("pure_finalization_raw_drift", `Pure final bytes drifted from accepted raw evidence for ${item.slide_id}`);
    }
  }
}

/** The selected adapter alone writes target raw plans for its Pure receipt. */
export function createPureRawWorkPlan({
  receipt,
  provider_profile_sha256,
  authorization_scope_sha256,
  raw_contracts_by_slide,
  provider_input_bindings_by_slide,
} = {}) {
  requireReceipt(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new PureImageWorkflowError("raw_contracts_required", "Pure raw contracts are required for every slide");
  }
  if (!provider_input_bindings_by_slide || typeof provider_input_bindings_by_slide !== "object" || Array.isArray(provider_input_bindings_by_slide) ||
    canonicalJson(Object.keys(provider_input_bindings_by_slide).sort()) !== canonicalJson(receipt.slides.map((slide) => slide.slide_id).sort())) {
    throw new PureImageWorkflowError("pure_provider_input_bindings_required", "Pure raw plans require one provider input binding for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: PURE_IMAGE_WORKFLOW,
    ordered_slide_ids: receipt.slides.map((slide) => slide.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: receipt.slides.map((slide) => ({
      slide_id: slide.slide_id,
      raw_contract_sha256: raw_contracts_by_slide[slide.slide_id],
      provider_input_binding: provider_input_bindings_by_slide[slide.slide_id],
    })),
  });
}

/**
 * Map Pure's selected plan to the generic review contribution without
 * introducing Framed text or safe-zone semantics into the shared boundary.
 */
export function createPureTargetRawReviewContribution({ receipt, rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const plan = validateRawWorkPlan(rawWorkPlan);
  const receiptIds = receipt.slides.map((slide) => slide.slide_id);
  if (!plan.ok || rawWorkPlan.workflow !== PURE_IMAGE_WORKFLOW ||
    rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(receiptIds)) {
    throw new PureImageWorkflowError("pure_review_contribution_plan_invalid", "Pure raw-review contribution requires the exact current raw work plan");
  }
  const slidesById = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  if (slidesById.size !== receipt.slides.length) {
    throw new PureImageWorkflowError("pure_review_contribution_source_invalid", "Pure raw-review contribution requires unique source slide identities");
  }
  const labels = rawWorkPlan.ordered_slide_ids.map((slideId, index) => {
    const slide = slidesById.get(slideId);
    const title = slide?.header_policy?.provider_visible?.title;
    if (typeof title !== "string" || !title.trim()) {
      throw new PureImageWorkflowError("pure_review_contribution_label_invalid", `Pure raw-review projection requires a title for ${slideId}`);
    }
    return { stable_id: slideId, position: index + 1, title };
  });
  const contribution = createTargetRawReviewContribution({
    workflow: PURE_IMAGE_WORKFLOW,
    ordered_stable_ids: rawWorkPlan.ordered_slide_ids,
    coverage_items: rawWorkPlan.ordered_slide_ids.map((slideId) => ({
      stable_id: slideId,
      coverage_profile_digest: rawWorkPlan.provider_profile_sha256,
      guide_primitives: [],
    })),
    projection_labels: labels,
  });
  const validation = validateTargetRawReviewContribution(contribution, {
    rawWorkPlan,
    expectedWorkflow: PURE_IMAGE_WORKFLOW,
  });
  if (!validation.ok) throw new PureImageWorkflowError(validation.code, validation.message);
  return contribution;
}

function pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null, reviewSlideIds = reviewPlan?.ordered_slide_ids } = {}) {
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
    throw new PureImageWorkflowError("pure_complete_page_review_invalid", "Pure Complete Page Review requires one current raw plan");
  }
  const contribution = createPureTargetRawReviewContribution({
    receipt: context.receipt,
    rawWorkPlan: context.raw_work_plan,
  });
  const raw = {};
  const bindings = {};
  for (const slideId of reviewSlideIds) {
    const providerBytes = rawBytesBySlide?.[slideId];
    if (!providerBytes) {
      throw new PureImageWorkflowError("pure_complete_page_review_invalid", `Pure Complete Page Review is missing current provider bytes for ${slideId}`);
    }
    const bytes = Buffer.from(providerBytes);
    const providerSha256 = sha256Bytes(bytes);
    raw[slideId] = bytes;
    bindings[slideId] = canonicalJsonSha256({
      schema: "page-image-pure-complete-page-binding-v1",
      raw_work_plan_sha256: reviewPlanSha256,
      slide_id: slideId,
      provider_page_sha256: providerSha256,
    });
  }
  return Object.freeze({
    contribution,
    raw_work_plan_sha256: reviewPlanSha256,
    source_epoch: resolvedSourceEpoch,
    raw_bytes_by_slide: Object.freeze(raw),
    adapter_complete_page_bindings_by_slide: Object.freeze(bindings),
  });
}

function purePilotReviewContribution({ inputs, batchSha256, coverage } = {}) {
  if (!SHA256_RE.test(batchSha256 || "") || !Array.isArray(coverage)) {
    throw new PureImageWorkflowError("pure_pilot_coverage_invalid", "Pure Pilot contribution requires exact current batch coverage");
  }
  const slideIds = Object.keys(inputs.raw_bytes_by_slide);
  if (coverage.length !== slideIds.length || new Set(coverage.map((item) => item?.slide_id)).size !== slideIds.length) {
    throw new PureImageWorkflowError("pure_pilot_coverage_invalid", "Pure Pilot coverage must name each selected slide exactly once");
  }
  const coverageBySlide = new Map(coverage.map((item) => [item.slide_id, item]));
  const items = slideIds.map((slideId) => {
    const item = coverageBySlide.get(slideId);
    if (!item || item.raw_sha256 !== sha256Bytes(inputs.raw_bytes_by_slide[slideId])) {
      throw new PureImageWorkflowError("pure_pilot_coverage_invalid", `Pure Pilot coverage is stale for ${slideId}`);
    }
    return Object.freeze({
      slide_id: slideId,
      raw_sha256: item.raw_sha256,
      adapter_complete_page_binding_sha256: inputs.adapter_complete_page_bindings_by_slide[slideId],
    });
  });
  return canonicalJsonSha256({
    schema: "page-image-pure-pilot-review-contribution-v1",
    raw_work_plan_sha256: inputs.raw_work_plan_sha256,
    batch_sha256: batchSha256,
    complete_page_review_contribution_sha256: inputs.contribution.typed_review_contribution_sha256,
    items,
  });
}

async function publishPureCompletePageReview({ context, reviewPlan, rawBytesBySlide } = {}) {
  const inputs = pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide });
  return publishCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: PURE_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

function validatePureCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch = null } = {}) {
  const inputs = pureCompletePageReviewInputs({ context, reviewPlan, rawBytesBySlide, sourceEpoch });
  return validateCompletePageReviewPresentation({
    runDir: context.run_dir,
    rawWorkPlanSha256: inputs.raw_work_plan_sha256,
    sourceEpoch: inputs.source_epoch,
    workflow: PURE_IMAGE_WORKFLOW,
    typedReviewContributionSha256: inputs.contribution.typed_review_contribution_sha256,
    orderedSlideIds: reviewPlan.ordered_slide_ids,
    rawBytesBySlide: inputs.raw_bytes_by_slide,
    adapterCompletePageBindingsBySlide: inputs.adapter_complete_page_bindings_by_slide,
  });
}

function requirePureFinalizationReview(validation, acceptedCompleteReview) {
  const reviewEvidenceSha256 = acceptedCompleteReview?.workflow_evidence_sha256 ??
    acceptedCompleteReview?.complete_page_presentation_sha256;
  if (!validation?.ok || !acceptedCompleteReview ||
    acceptedCompleteReview.decision !== "proceed" ||
    validation.complete_page_presentation_sha256 !== reviewEvidenceSha256 ||
    validation.projection_sha256 !== acceptedCompleteReview.projection_sha256) {
    throw new PureImageWorkflowError(
      "pure_finalization_review_stale",
      "Pure finalization requires the exact current proceeded Complete Page Review",
    );
  }
  return validation.presentation;
}

function assertPureFinalMatchesReviewedProviderPage(finalBytesBySlide, presentation) {
  for (const item of presentation.items) {
    const finalBytes = finalBytesBySlide?.[item.slide_id];
    if (!finalBytes || sha256Bytes(finalBytes) !== item.raw_provider_page_sha256 ||
      item.complete_page_sha256 !== item.raw_provider_page_sha256) {
      throw new PureImageWorkflowError(
        "pure_finalization_provider_page_stale",
        `Pure final media no longer matches the reviewed provider page for ${item.slide_id}`,
      );
    }
  }
}

function readPureTargetFinalizationReview(context, rawWorkPlan, acceptedRawEvidence) {
  const current = validateTargetCurrentRawReview(context, rawWorkPlan, {
    reviewContribution: createPureTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan }),
    acceptedRawEvidence,
    validateCompletePageReview: ({ raw_work_plan: reviewPlan, raw_bytes_by_slide: rawBytesBySlide, source_epoch: sourceEpoch }) =>
      validatePureCompletePageReview({ context, reviewPlan, rawBytesBySlide, sourceEpoch }),
  });
  return Object.freeze({
    presentation: requirePureFinalizationReview(current.completePresentation, current.review),
    raw_bytes_by_slide: current.rawBytes,
  });
}

function readPureProgressiveFinalizationReview(context, progressiveRawWorkPlan, rawBytesBySlide, acceptedCompleteReview) {
  const validation = validatePureCompletePageReview({
    context,
    reviewPlan: progressiveRawWorkPlan,
    rawBytesBySlide,
    sourceEpoch: progressiveRawWorkPlan.source_epoch,
  });
  return requirePureFinalizationReview(validation, acceptedCompleteReview);
}

/** Pure finalization publishes the accepted raw bytes unchanged. */
export function publishPureFinalSlideManifest({ receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide, evidencePlan = rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: evidencePlan });
  if (!evidence.ok) throw new PureImageWorkflowError(evidence.code, evidence.message);
  if (rawWorkPlan.workflow !== PURE_IMAGE_WORKFLOW || rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    evidencePlan.workflow !== PURE_IMAGE_WORKFLOW || evidencePlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(evidencePlan.ordered_slide_ids)) {
    throw new PureImageWorkflowError("pure_finalization_lineage_invalid", "Pure finalization requires matching selected-workflow raw-plan lineage");
  }
  requirePureNativeFinalBytes(acceptedRawEvidence, rawBytesBySlide);
  return publishCurrentFinalSlideManifest({
    rawWorkPlan: evidencePlan,
    acceptedRawEvidence,
    ownerWorkflow: PURE_IMAGE_WORKFLOW,
    finalBytesBySlide: rawBytesBySlide,
  });
}

/** Pure provider-rendered content or visual source drift always carries raw-generation debt. */
export function classifyPureRefresh({
  previousReceipt,
  nextReceipt,
  rawWorkPlan = null,
  nextRawWorkPlan = null,
  acceptedRawEvidence = null,
} = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  const classified = evaluatePageImageInvalidation({
    previousReceipt,
    nextReceipt,
    previousRawWorkPlan: rawWorkPlan,
    nextRawWorkPlan,
    acceptedRawEvidence,
  });
  return Object.freeze({
    ...classified,
    kind: classified.kind === "raw_rebuild" ? "rebuild_raw" : classified.kind,
  });
}

function parsePureTargetReceipt({ deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageImageVisualLanguage(deckDir);
  return parsePageImageSource(sourceText, {
    source: sourcePath,
    registry: createPageImageSourceResolver({ deckDir, visualLanguage }),
  });
}

/** Resolve and bind the selected Pure source without compiling raw work. */
export function resolvePureTargetSource(runDir, { allowSourceRebuild = false } = {}) {
  return resolveTargetSourceContext(runDir, {
    workflow: PURE_IMAGE_WORKFLOW,
    parseReceipt: parsePureTargetReceipt,
    allowSourceRebuild,
  });
}

/** Resolve the selected Pure source without state or artifact materialization. */
export function resolvePureTargetCandidateSource(runDir) {
  return resolveTargetCandidateSourceContext(runDir, {
    workflow: PURE_IMAGE_WORKFLOW,
    parseReceipt: parsePureTargetReceipt,
  });
}

/** Resolve Pure's exact Style Master scope without materializing page lineage. */
export function resolvePureStyleMasterScope(runDir) {
  const scope = resolveStyleMasterScopeContext(runDir);
  if (scope.workflow !== PURE_IMAGE_WORKFLOW) {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure Style Master scope requires the selected pure workflow");
  }
  return bindStyleMasterScopeCandidate(scope, resolvePureTargetCandidateSource(runDir));
}

function coreStyleMasterSelection(workflow, styleMasterReference) {
  if (!styleMasterReference || typeof styleMasterReference !== "object" ||
    !SHA256_RE.test(styleMasterReference.selection_sha256 || "") ||
    !SHA256_RE.test(styleMasterReference.plan_sha256 || "")) {
    throw new PureImageWorkflowError("pure_page_image_core_invalid", "Pure adapter requires current Style Master selection facts for Page Image Core");
  }
  return Object.freeze({
    workflow,
    selection_sha256: styleMasterReference.selection_sha256,
    plan_sha256: styleMasterReference.plan_sha256,
  });
}

function createPureCoreFacts(context, generation) {
  try {
    return createPageImageCoreFacts({
      sourceReceipt: context.receipt,
      visualSelections: context.receipt.slides.map((slide) => ({
        slide_id: slide.slide_id,
        selection: slide.visual_language,
      })),
      styleMasterSelection: coreStyleMasterSelection(PURE_IMAGE_WORKFLOW, generation.style_master_reference),
      generationProfile: generation.profile,
      headerRenderingPolicy: { workflow: PURE_IMAGE_WORKFLOW, policy: "provider-visible-v1" },
    });
  } catch (error) {
    if (error instanceof PageImageCoreError) {
      throw new PureImageWorkflowError("pure_page_image_core_invalid", error.message);
    }
    throw error;
  }
}

function pureRawContract(slide, coreSlide) {
  const visualLanguage = coreSlide?.visual_selection?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new PureImageWorkflowError("pure_visual_language_required", `Pure visual language is unresolved for ${slide.slide_id}`);
  }
  if (coreSlide.slide_id !== slide.slide_id || coreSlide.workflow !== PURE_IMAGE_WORKFLOW ||
    coreSlide.header_policy?.provider_visible === undefined) {
    throw new PureImageWorkflowError("pure_page_image_core_invalid", `Pure Page Image Core facts are unavailable for ${slide.slide_id}`);
  }
  const providerClauses = coreSlide.visual_selection?.provider_clauses || null;
  const identityRoleClause = coreSlide.visual_selection?.identity_reference?.provider_reference?.role_clause || null;
  return Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: PURE_IMAGE_WORKFLOW,
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
      header: { ...coreSlide.header_policy.provider_visible },
      items: coreSlide.provider_content.items.map((item) => ({ ...item })),
    },
  });
}

/** Compile Pure's complete provider-visible page input from its selected adapter facts. */
function compilePureProviderInput({ slideId, rawContract, generationProfile } = {}) {
  const contract = validatePureRawContract(rawContract);
  if (!contract.ok || rawContract.slide_id !== slideId || !generationProfile || typeof generationProfile !== "object") {
    throw new PureImageWorkflowError("pure_provider_input_invalid", "Pure provider input requires one valid selected raw contract and generation profile");
  }
  const utf8 = canonicalJson({
    schema: "page-image-pure-provider-input-v1",
    slide_id: slideId,
    instruction: "Render one complete premium keynote page. Render every header literal and provider-rendered content item as readable integrated page typography; preserve exact literals unless an item explicitly allows presentation adaptation.",
    provider_rendered_content: rawContract.provider_rendered_content,
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

/** Compile a selected Pure current raw-plan candidate without materializing state. */
function compilePureTargetRawPlanCandidate(context) {
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
  const coreFacts = createPureCoreFacts(context, generation);
  const coreSlidesById = new Map(coreFacts.slides.map((slide) => [slide.slide_id, slide]));
  const rawContractsBySlide = {};
  const providerInputBindingsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const coreSlide = coreSlidesById.get(slide.slide_id);
    const rawContract = pureRawContract(slide, coreSlide);
    const rawContractValidation = validatePureRawContract(rawContract);
    if (!rawContractValidation.ok) throw new PureImageWorkflowError(rawContractValidation.code, rawContractValidation.message);
    rawContractsBySlide[slide.slide_id] = rawContractValidation.raw_contract_sha256;
    const compiledProviderInput = compilePureProviderInput({
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
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: PURE_IMAGE_WORKFLOW,
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  const rawWorkPlan = createPureRawWorkPlan({
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
    page_image_core: coreFacts,
    style_master_reference: generation.style_master_reference,
  });
}

export function buildPureTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
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
    workflow: PURE_IMAGE_WORKFLOW,
    parseReceipt: parsePureTargetReceipt,
    compilePlanCandidate: compilePureTargetRawPlanCandidate,
  });
}

export function pureTargetRawPlanProjection(plan) {
  return targetRawPlanProjection(plan, plan.raw_work_plan);
}

export function authorizePureTargetRawPlan(runDir, { planHash } = {}) {
  const plan = readPureTargetStoredPlanContext(runDir);
  return authorizeTargetRawWork(plan, plan.raw_work_plan, { planHash });
}

export async function generatePureTargetRawPlan(runDir, { planHash, submit } = {}) {
  const plan = readPureTargetStoredPlanContext(runDir);
  return generateTargetRawWork(plan, plan.raw_work_plan, {
    planHash,
    providerRequestsBySlide: plan.provider_requests_by_slide,
    submit,
  });
}

export async function preparePureTargetRawReview(runDir) {
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
  const plan = readPureTargetStoredPlanContext(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, {
    decision,
    reviewContribution: createPureTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
    validateCompletePageReview: ({ raw_work_plan: rawWorkPlan, raw_bytes_by_slide: rawBytesBySlide }) =>
      validatePureCompletePageReview({ context: plan, reviewPlan: rawWorkPlan, rawBytesBySlide }),
  });
}

function progressivePureDisplayBySlide(receipt) {
  return Object.fromEntries(receipt.slides.map((slide) => [slide.slide_id, { title: slide.header_policy?.provider_visible?.title || "" }]));
}

function progressivePurePlanFromContext(context) {
  return createProgressiveRawWorkPlanFromTarget({
    runDir: context.run_dir,
    source_epoch: context.source_epoch,
    raw_work_plan: context.raw_work_plan,
    effective_style_master_sha256: context.style_master_reference.selection_sha256,
  });
}

/**
 * Compile current Pure source/style facts into an expected replacement plan without
 * reading or rebuilding any version `_generated` projection.
 */
export function readPureProgressiveTargetPlanCandidate(runDir, { sourceEpoch = null } = {}) {
  const candidate = compilePureTargetRawPlanCandidate(resolvePureTargetCandidateSource(runDir));
  if (sourceEpoch === null) return candidate;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PureImageWorkflowError("progressive_raw_target_plan_invalid", "a current progressive source epoch is required for Pure plan comparison");
  }
  return Object.freeze({
    ...candidate,
    progressive_raw_work_plan: progressivePurePlanFromContext({ ...candidate, source_epoch: sourceEpoch }),
  });
}

/** Compile and publish the provider-free v3 full plan through the selected Pure adapter. */
export function buildPureProgressiveTargetRawPlan(runDir, { allowSourceRebuild = false } = {}) {
  const prior = inspectProgressiveRawLifecycle({ runDir, workflow: PURE_IMAGE_WORKFLOW });
  assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow: PURE_IMAGE_WORKFLOW });
  const candidate = compilePureTargetRawPlanCandidate(resolvePureTargetCandidateSource(runDir));
  const context = materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild });
  // This is a rebuildable adapter projection; v3 direct records own lifecycle facts.
  writeTargetRawWorkPlan(context, candidate.raw_work_plan);
  const progressiveRawWorkPlan = progressivePurePlanFromContext({
    ...context,
    raw_work_plan: candidate.raw_work_plan,
    style_master_reference: candidate.style_master_reference,
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
    provider_request_inspection: providerRequestInspection,
    provider_requests_by_slide: candidate.provider_requests_by_slide,
    style_master_reference: candidate.style_master_reference,
  });
}

/** Resolve the selected Pure source and its exact current raw-plan binding. */
export function readPureProgressiveTargetStoredPlanContext(runDir) {
  const context = readPureTargetStoredPlanContext(runDir);
  const progressiveRawWorkPlan = progressivePurePlanFromContext(context);
  return Object.freeze({ ...context, progressive_raw_work_plan: progressiveRawWorkPlan });
}

export function pureProgressiveRawPlanProjection(plan) {
  const inspection = inspectProgressiveRawLifecycle({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    expected_plan: plan.progressive_raw_work_plan,
  });
  return Object.freeze({
    schema: "page-image-progressive-raw-plan-projection-v1",
    plan_hash: plan.progressive_raw_work_plan.sha256,
    workflow: PURE_IMAGE_WORKFLOW,
    source_epoch: plan.source_epoch,
    ordered_slide_ids: Object.freeze([...plan.progressive_raw_work_plan.ordered_slide_ids]),
    maximum_submissions: plan.progressive_raw_work_plan.items.length,
    ...(plan.provider_request_inspection ? { provider_request_inspection: plan.provider_request_inspection } : {}),
    progress: inspection.progress || null,
    next_action: inspection.primary_action,
  });
}

export async function planPureTargetPilot(runDir, { planHash, slideIds } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    slide_ids: slideIds,
    display_by_slide: progressivePureDisplayBySlide(plan.receipt),
    expected_plan: plan.progressive_raw_work_plan,
  });
}

export async function planPureTargetExpansion(runDir, { planHash } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return planProgressiveRawExpansion({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    display_by_slide: progressivePureDisplayBySlide(plan.receipt),
    expected_plan: plan.progressive_raw_work_plan,
  });
}

export async function authorizePureProgressiveRawBatch(runDir, { planHash, batchHash } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return authorizeProgressiveRawBatch({ runDir: plan.run_dir, workflow: PURE_IMAGE_WORKFLOW, plan_hash: planHash, batch_hash: batchHash, expected_plan: plan.progressive_raw_work_plan });
}

export async function generatePureProgressiveRawItem(runDir, { planHash, batchHash, preflight = null, submit } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    preflight,
    submit,
  });
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
    workflow: PURE_IMAGE_WORKFLOW,
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
      workflow: PURE_IMAGE_WORKFLOW,
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

export async function preparePureProgressivePilotReview(runDir, { planHash, batchHash } = {}) {
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  return prepareProgressiveRawPilotEvidence({
    runDir: context.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
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
    workflow: PURE_IMAGE_WORKFLOW,
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
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
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

export async function preparePureProgressiveRawReview(runDir, { planHash } = {}) {
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  const prepared = await prepareProgressiveRawCompleteReview({
    runDir: context.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    publish: async ({ plan, materializations }) => publishPureProgressiveCompletePageReview({ context, plan, materializations }),
  });
  const handoff = prepared.accepted_raw_evidence_sha256
    ? recordTargetProgressiveAcceptedRawEvidence(context.deck_dir, {
      runDir: context.run_dir,
      progressiveRawWorkPlan: context.progressive_raw_work_plan,
      acceptedRawEvidence: readProgressiveAcceptedRawWork({
        runDir: context.run_dir,
        workflow: PURE_IMAGE_WORKFLOW,
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
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawCompleteReview({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
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
        workflow: PURE_IMAGE_WORKFLOW,
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
  return reconcileProgressiveRawAttempt({
    runDir,
    workflow: PURE_IMAGE_WORKFLOW,
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
    workflow: PURE_IMAGE_WORKFLOW,
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

/** Publish final and delivery projections from exact v3 accepted raw evidence only. */
export async function buildPureProgressiveTargetDelivery(runDir) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const raw = readProgressiveAcceptedRawWork({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
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

/** Pure finalization publishes accepted raw bytes, then joins shared delivery. */
export async function buildPureTargetDelivery(runDir) {
  const progressive = inspectProgressiveRawLifecycle({ runDir, workflow: PURE_IMAGE_WORKFLOW });
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
  const refresh = resolveTargetLocalComposeContext(runDir, {
    workflow: PURE_IMAGE_WORKFLOW,
    parseReceipt: parsePureTargetReceipt,
  });
  const candidate = compilePureTargetRawPlanCandidate(refresh);
  if (targetSourceSemanticSha256(refresh.previous_source_receipt, PURE_IMAGE_WORKFLOW) !==
    targetSourceSemanticSha256(refresh.receipt, PURE_IMAGE_WORKFLOW)) {
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
    ownerWorkflow: PURE_IMAGE_WORKFLOW,
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
