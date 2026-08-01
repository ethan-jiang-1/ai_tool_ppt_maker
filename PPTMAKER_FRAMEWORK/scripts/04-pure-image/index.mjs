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
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../shared/image2/style_master_scope.mjs";
import {
  deliverTargetFinalSlideManifest,
} from "../05-delivery/index.mjs";

/** TARGET Pure workflow owner. Behavior moves here from the bounded v1 adapter. */
export const PURE_IMAGE_WORKFLOW = "pure";

export const PURE_IMAGE_APPROVED_SHARED_INTERFACES = Object.freeze([
  "shared/image2/page_authority_artifacts.mjs",
  "shared/image2/page_authority_final_manifest.mjs",
  "shared/image2/page_authority_raw_mechanics.mjs",
  "shared/image2/page_authority_target_runtime.mjs",
  "shared/identity/canonical_json.mjs",
]);

export class PureImageWorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PureImageWorkflowError";
    this.code = code;
  }
}

function requireReceipt(receipt) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" || receipt.workflow !== PURE_IMAGE_WORKFLOW || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure workflow requires a current pure v2 source receipt");
  }
  return receipt;
}

/** The selected adapter alone writes target raw plans for its Pure receipt. */
export function createPureRawWorkPlan({ receipt, provider_profile_sha256, authorization_scope_sha256, raw_contracts_by_slide } = {}) {
  requireReceipt(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new PureImageWorkflowError("raw_contracts_required", "Pure raw contracts are required for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: PURE_IMAGE_WORKFLOW,
    ordered_slide_ids: receipt.slides.map((slide) => slide.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: receipt.slides.map((slide) => ({ slide_id: slide.slide_id, raw_contract_sha256: raw_contracts_by_slide[slide.slide_id] })),
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
    const title = slide?.display?.title;
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

/** Pure finalization publishes the accepted raw bytes unchanged. */
export function publishPureFinalSlideManifest({ receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide } = {}) {
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PureImageWorkflowError(evidence.code, evidence.message);
  return publishCurrentFinalSlideManifest({
    rawWorkPlan,
    acceptedRawEvidence,
    ownerWorkflow: PURE_IMAGE_WORKFLOW,
    finalBytesBySlide: rawBytesBySlide,
  });
}

/** Pure display or visual source drift always carries raw-generation debt. */
export function classifyPureRefresh({ previousReceipt, nextReceipt } = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  return Object.freeze({
    workflow: PURE_IMAGE_WORKFLOW,
    kind: previousReceipt.source_sha256 === nextReceipt.source_sha256 ? "current" : "rebuild_raw",
    provider_required: previousReceipt.source_sha256 !== nextReceipt.source_sha256,
  });
}

function parsePureTargetReceipt({ deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageAuthorityVisualLanguage(deckDir);
  return parsePageAuthoritySource(sourceText, {
    source: sourcePath,
    registry: createPageAuthoritySourceResolver({ deckDir, visualLanguage }),
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

function pureRawContract(slide) {
  const visualLanguage = slide.visual_language?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new PureImageWorkflowError("pure_visual_language_required", `Pure visual language is unresolved for ${slide.slide_id}`);
  }
  return Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: PURE_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    visual_identity: slide.visual_language?.identity_reference?.projection || null,
    display: { ...slide.display },
  });
}

/** Compile a selected Pure v2 raw-plan candidate without materializing state. */
function compilePureTargetRawPlanCandidate(context) {
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
  const rawContractsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const rawContract = pureRawContract(slide);
    rawContractsBySlide[slide.slide_id] = canonicalJsonSha256(rawContract);
    providerRequestsBySlide[slide.slide_id] = createTargetProviderRequest({
      slideId: slide.slide_id,
      rawContract,
      generationProfile: generation.profile,
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: PURE_IMAGE_WORKFLOW,
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
  });
  const rawWorkPlan = createPureRawWorkPlan({
    receipt: context.receipt,
    provider_profile_sha256: generation.provider_profile_sha256,
    authorization_scope_sha256: authorizationScopeSha,
    raw_contracts_by_slide: rawContractsBySlide,
  });
  return Object.freeze({
    ...context,
    raw_work_plan: rawWorkPlan,
    provider_requests_by_slide: Object.freeze(providerRequestsBySlide),
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
  });
}

export function decidePureTargetRawReview(runDir, { decision } = {}) {
  const plan = readPureTargetStoredPlanContext(runDir);
  return decideTargetRawReview(plan, plan.raw_work_plan, {
    decision,
    reviewContribution: createPureTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan }),
  });
}

/** Pure finalization publishes accepted raw bytes, then joins shared delivery. */
export async function buildPureTargetDelivery(runDir) {
  const plan = readPureTargetStoredPlanContext(runDir);
  const raw = readTargetAcceptedRawWork(plan, plan.raw_work_plan);
  const manifest = publishPureFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
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
  const reviewContribution = createPureTargetRawReviewContribution({
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
