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
  resolveTargetLocalComposeContext,
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
export function publishPureFinalSlideManifest({ receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide, evidencePlan = rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: evidencePlan });
  if (!evidence.ok) throw new PureImageWorkflowError(evidence.code, evidence.message);
  if (rawWorkPlan.workflow !== PURE_IMAGE_WORKFLOW || rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    evidencePlan.workflow !== PURE_IMAGE_WORKFLOW || evidencePlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(evidencePlan.ordered_slide_ids)) {
    throw new PureImageWorkflowError("pure_finalization_lineage_invalid", "Pure finalization requires matching selected-workflow raw-plan lineage");
  }
  return publishCurrentFinalSlideManifest({
    rawWorkPlan: evidencePlan,
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
  const providerClauses = slide.visual_language?.provider_clauses || null;
  const identityRoleClause = slide.visual_language?.identity_reference?.provider_reference?.role_clause || null;
  let visualScene = slide.visual_scene ?? null;
  if (visualScene != null) {
    visualScene = normalizePageAuthorityTextGuard(visualScene, { context: `VISUAL SCENE:${slide.slide_id}` });
  }
  return Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: PURE_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    provider_clauses: providerClauses,
    visual_identity_role_clause: identityRoleClause,
    visual_scene: visualScene,
    visual_identity: slide.visual_language?.identity_reference?.projection || null,
    display: { ...slide.display },
    body: slide.body ?? null,
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

function progressivePureDisplayBySlide(receipt) {
  return Object.fromEntries(receipt.slides.map((slide) => [slide.slide_id, { title: slide.display?.title || "" }]));
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
 * Compile current Pure source/style facts into an expected v3 plan without
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
  if (prior.ok && prior.legacy_v2) {
    throw new PureImageWorkflowError("progressive_raw_legacy_replan_required", "legacy v2 raw records remain readable; start the owner-issued progressive replan/rebuild action instead");
  }
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

/** Resolve the selected Pure source and its exact current v3 raw-plan binding. */
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
    schema: "page-authority-progressive-raw-plan-projection-v1",
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

export async function generatePureProgressiveRawItem(runDir, { planHash, batchHash, submit } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  return generateProgressiveRawItem({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    batch_hash: batchHash,
    expected_plan: plan.progressive_raw_work_plan,
    provider_requests_by_slide: plan.provider_requests_by_slide,
    submit,
  });
}

async function publishPureProgressivePilot({ context, plan, batch_sha256, coverage, materializations }) {
  const outputRoot = join(pageAuthorityImage2Paths(context.run_dir).review_root, "pilot", batch_sha256);
  mkdirSync(outputRoot, { recursive: true });
  const items = coverage.map((item) => {
    const materialization = materializations.get(item.slide_id);
    const position = plan.ordered_slide_ids.indexOf(item.slide_id) + 1;
    if (!materialization || position < 1) {
      throw new PureImageWorkflowError("pure_pilot_coverage_invalid", `Pure Pilot coverage is unavailable for ${item.slide_id}`);
    }
    writeFileSync(join(outputRoot, pageAuthorityOrdinalImageFilename(position, item.slide_id)), materialization.bytes);
    return { slide_id: item.slide_id, raw_sha256: item.raw_sha256 };
  });
  const projection = {
    schema: "page-authority-pure-pilot-projection-v1",
    workflow: PURE_IMAGE_WORKFLOW,
    raw_work_plan_sha256: plan.sha256,
    batch_sha256,
    items,
  };
  const bytes = Buffer.from(`${JSON.stringify(projection)}\n`, "utf8");
  writeFileSync(join(outputRoot, "projection.json"), bytes);
  return Object.freeze({
    workflow_evidence_sha256: canonicalJsonSha256({ schema: "page-authority-pure-pilot-evidence-v1", workflow: PURE_IMAGE_WORKFLOW, items }),
    projection_sha256: canonicalJsonSha256(projection),
  });
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

export async function acceptPureProgressivePilot(runDir, { planHash, batchHash, decision } = {}) {
  const plan = readPureProgressiveTargetStoredPlanContext(runDir);
  const accepted = await acceptProgressiveRawPilot({
    runDir: plan.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
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

function progressiveRawBytes(materializations) {
  return Object.fromEntries([...materializations.entries()].map(([slideId, materialization]) => [slideId, Buffer.from(materialization.bytes)]));
}

export async function preparePureProgressiveRawReview(runDir, { planHash } = {}) {
  const context = readPureProgressiveTargetStoredPlanContext(runDir);
  const prepared = await prepareProgressiveRawCompleteReview({
    runDir: context.run_dir,
    workflow: PURE_IMAGE_WORKFLOW,
    plan_hash: planHash,
    publish: async ({ materializations }) => publishProgressiveTargetCompleteRawReview(context, context.raw_work_plan, {
      raw_bytes_by_slide: progressiveRawBytes(materializations),
      reviewContribution: createPureTargetRawReviewContribution({ receipt: context.receipt, rawWorkPlan: context.raw_work_plan }),
    }),
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
  return reconcileProgressiveRawAttempt({ runDir, workflow: PURE_IMAGE_WORKFLOW, plan_hash: planHash, attempt_sha256: attemptSha256, lookup });
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
  const manifest = publishPureFinalSlideManifest({
    receipt: plan.receipt,
    rawWorkPlan: plan.raw_work_plan,
    evidencePlan: raw.plan,
    acceptedRawEvidence: raw.accepted_raw_evidence,
    rawBytesBySlide: raw.raw_bytes_by_slide,
  });
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
