import { existsSync, readFileSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

import { canonicalJson } from "../../shared/identity/canonical_json.mjs";
import {
  REFINEMENT_PLAN_SCHEMA_V2,
  REFINEMENT_STATE_SCHEMA,
  ATTEMPT_STATES,
  authorizePlan,
  buildPlan,
  canonicalWaivedChecks,
  createProfileContract,
  createCandidateRecord,
  normalizePrerequisiteWaiver,
  prerequisiteWaiverFingerprint,
  createReviewRecord,
  safeProfileFingerprint,
  sha256,
  transitionAttempt,
  validateAttempt,
  validateRefinementEligibility,
  validateUnknownSubmitDecision,
} from "./contracts.mjs";
import {
  materializeAuthorizedRefinementRequest,
  materializeRefinementRequestSet,
  requestFingerprintsForPlan,
} from "./request_material.mjs";
import {
  assertPromotionFencesClear,
  candidatePaths,
  cleanupRefinement,
  commitRefinementState,
  createPromotionJournal,
  ensureRefinementDerivedRoots,
  listCandidates,
  readAttemptRecord,
  readCandidate,
  readPromotionJournal,
  readRefinementAuthorization,
  readRefinementPlan,
  readVersionFileSha,
  recoverPromotionJournal,
  refinementPaths,
  prepareRefinementProvenance,
  persistCandidate,
  updatePromotionJournal,
  writeAttemptRecord,
  writeCandidateComparison,
  writeJsonAtomic,
  writeRefinementAuthorization,
  writeRefinementPlan,
  writeRefinementProvenance,
} from "./storage.mjs";
import { createFakeRefinementTransport, createModernRefinementTransport, createRefinementTransport } from "./transport.mjs";
import { deckRoot } from "../../shared/run-bundle/bundle_layout.mjs";
import { prepareStateWrite, readImage2RefinementState, readState, writeImage2RefinementState, writeState } from "../../shared/state/state.mjs";

const SHA_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const PROVIDER_REQUEST_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;

function nowIso() { return new Date().toISOString(); }
function clone(value) { return value == null ? value : structuredClone(value); }
function sourcePath(runDir) { return join(resolve(runDir), "slide-specifications.md"); }
function persistedProviderRequestId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  return PROVIDER_REQUEST_ID_RE.test(id) ? id : null;
}
function assertRunVersion(runDir) {
  const value = basename(resolve(runDir));
  if (!VERSION_RE.test(value)) throw new Error("refinement requires a normalized vN run directory");
  return value;
}

async function phase3() { return import("../../03-html-production/index.mjs"); }
async function phase2() { return import("../../02-visual-system/index.mjs"); }

async function styleReferenceStatus(runDir) {
  const paths = refinementPaths(runDir);
  if (!existsSync(paths.provenance)) return "missing";
  try {
    const provenance = parseProvenance(paths.provenance);
    if (!provenance?.style_reference?.asset_id) return "missing";
    const catalog = (await phase2()).loadHtmlAssetCatalog(runDir).catalog;
    const entry = catalog[provenance.style_reference.asset_id];
    return entry && entry.measured_sha256 === provenance.style_reference.output_sha256 ? "current" : "stale";
  } catch { return "stale"; }
}

async function currentEligibility(runDir, { allowIncompleteDelivery = false } = {}) {
  const run = resolve(runDir);
  const version = assertRunVersion(run);
  if (!existsSync(sourcePath(run))) throw new Error("refinement requires canonical slide-specifications.md");
  const p3 = await phase3();
  const marker = p3.probeProductionMarker(readFileSync(sourcePath(run)), { source: "slide-specifications.md" });
  if (marker.branch !== "html-first-v1") throw new Error("modern refinement is only available for marked HTML-first runs");
  const evidence = await import("../../shared/state/html_review_evidence.mjs");
  const review = evidence.inspectHtmlReviewReadiness(run);
  const deliveryProceed = review.delivery?.decision === "proceed";
  const deliveryCurrent = review.delivery?.freshness === "current";
  const deliveryComplete = deliveryCurrent && deliveryProceed && review.delivery?.evidence_complete === true;
  if (["repair", "redirect"].includes(review.delivery?.decision)) {
    throw new Error("current html-delivery-review repair or redirect must be resolved before refinement");
  }
  if (!deliveryComplete && !allowIncompleteDelivery) {
    throw new Error("current html-delivery-review: proceed with complete evidence is required before refinement");
  }
  const finalSlides = await p3.resolveCurrentHtmlFinalSlideDelivery(run, {
    htmlProductionResetId: review.html_production_reset_id,
  });
  if (!SHA_RE.test(finalSlides?.html_delivery_digest || "")) {
    throw new Error("current Phase-3 final-slide delivery digest is unavailable");
  }
  return Object.freeze({
    run,
    run_version: version,
    marked_html_first: true,
    delivery_review: deliveryProceed ? "proceed" : null,
    delivery_digest: finalSlides.html_delivery_digest,
    html_production_reset_id: review.html_production_reset_id,
    delivery_complete: deliveryComplete,
    review,
  });
}

function deliveryPrerequisiteChecks(review) {
  const candidates = [
    ...(review?._delivery_evidence?.waived_checks || []),
    ...(review?.delivery?.waived_checks || []),
  ];
  if (!candidates.length) {
    if (review?.delivery?.decision !== "proceed") {
      candidates.push({ code: "delivery_proceed_missing", subject: { kind: "gate", id: "delivery" } });
    }
    if (review?.delivery?.freshness !== "current") {
      candidates.push({ code: "delivery_review_stale", subject: { kind: "gate", id: "delivery" } });
    }
    if (review?.delivery?.evidence_complete !== true) {
      candidates.push({ code: "delivery_evidence_incomplete", subject: { kind: "gate", id: "delivery" } });
    }
  }
  return canonicalWaivedChecks(candidates);
}

async function createPrerequisiteWaiver(eligible, reason) {
  const { normalizeHumanReason } = await import("../../shared/state/html_review_evidence.mjs");
  const waiver = normalizePrerequisiteWaiver({
    reason: normalizeHumanReason(reason),
    waived_checks: deliveryPrerequisiteChecks(eligible.review),
    run_version: eligible.run_version,
    html_production_reset_id: eligible.html_production_reset_id,
    html_delivery_digest: eligible.delivery_digest,
    recorded_at: nowIso(),
  });
  return waiver;
}

function validatePrerequisiteWaiverForEligibility(waiver, fingerprint, eligible) {
  const normalized = normalizePrerequisiteWaiver(waiver);
  if (prerequisiteWaiverFingerprint(normalized) !== fingerprint ||
      normalized.run_version !== eligible.run_version ||
      normalized.html_production_reset_id !== eligible.html_production_reset_id ||
      normalized.html_delivery_digest !== eligible.delivery_digest) {
    throw new Error("STALE: delivery prerequisite waiver no longer matches the current final-slide identity");
  }
  return normalized;
}

function hasAcceptedPromotion(record) {
  return Object.values(record?.reviews || {}).some((review) => review?.decision === "accept");
}

async function currentEligibilityForRecord(runDir, record, { allowPostPromotionStaleDelivery = false } = {}) {
  const fingerprint = record?.plan?.prerequisite_waiver_fingerprint || null;
  const postPromotion = allowPostPromotionStaleDelivery && hasAcceptedPromotion(record);
  const eligible = await currentEligibility(runDir, {
    allowIncompleteDelivery: Boolean(fingerprint) || postPromotion,
  });
  if (fingerprint && !record?.prerequisite_waiver) {
    throw new Error("STALE: plan-bound delivery prerequisite waiver is missing");
  }
  if (fingerprint && !postPromotion) {
    validatePrerequisiteWaiverForEligibility(record.prerequisite_waiver, fingerprint, eligible);
  }
  return eligible;
}

function defaultRecord(runVersion) {
  return {
    schema: REFINEMENT_STATE_SCHEMA,
    run_version: runVersion,
    plan: null,
    authorization: null,
    attempts: {},
    reviews: {},
    prerequisite_waiver: null,
  };
}

function readRecord(runDir, { observe = false } = {}) {
  const run = resolve(runDir);
  const version = assertRunVersion(run);
  const state = readState(deckRoot(run), { purpose: observe ? "observe" : "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: refinement state is unavailable");
  return { state, record: readImage2RefinementState(state, version) || defaultRecord(version), version };
}

function commitRecord(runDir, record, { expectedStateSha, updatedAt = nowIso() } = {}) {
  const run = resolve(runDir);
  const state = readState(deckRoot(run), { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: refinement state is unavailable");
  const next = clone(state);
  next.nodes ||= {};
  const prior = next.nodes["image2-refinement"]?.by_version || {};
  next.nodes["image2-refinement"] = { by_version: { ...prior, [`3_versions/${record.run_version}`]: clone(record) } };
  writeState(deckRoot(run), next, { expectedStateSha, updatedAt });
  return record;
}

function updateRecord(runDir, mutate) {
  const { state, record } = readRecord(runDir);
  const oldSha = readVersionFileSha(join(deckRoot(runDir), "_state", "state.yaml"));
  const next = mutate(clone(record));
  return { record: commitRecord(runDir, next, { expectedStateSha: oldSha }), stateSha256: readVersionFileSha(join(deckRoot(runDir), "_state", "state.yaml")) };
}

function candidateAssetId(slideId, candidateId) {
  const base = String(slideId || candidateId).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "slot";
  return `refined-${base}`;
}

function attemptValue(auth, item, plan) {
  const attempt = {
    schema: "pptmaker-image2-refinement-attempt-v1",
    attempt_id: item.attempt_id,
    authorization_id: auth.authorization_id,
    plan_hash: plan.plan_hash,
    kind: item.kind,
    state: item.state,
    ...(item.slide_id ? { slide_id: item.slide_id, slot: item.slot } : {}),
    ...(item.request_fingerprint ? { request_fingerprint: item.request_fingerprint } : {}),
    created_at: nowIso(),
  };
  validateAttempt(attempt);
  return attempt;
}

/** Return a recommendation without creating lazy refinement directories. */
export async function recommendRefinement({
  runDir,
  slides = null,
  profile = null,
  profileFingerprint = null,
  force = false,
  reason = null,
  prerequisiteWaiver = null,
} = {}) {
  const eligible = await currentEligibility(runDir, {
    allowIncompleteDelivery: force === true || prerequisiteWaiver !== null,
  });
  let waiver = null;
  let forceNotNeeded = false;
  if (prerequisiteWaiver !== null) {
    const fingerprint = prerequisiteWaiverFingerprint(prerequisiteWaiver);
    waiver = validatePrerequisiteWaiverForEligibility(prerequisiteWaiver, fingerprint, eligible);
  } else if (force === true && !eligible.delivery_complete) {
    waiver = await createPrerequisiteWaiver(eligible, reason);
  } else if (force === true) {
    const { normalizeHumanReason } = await import("../../shared/state/html_review_evidence.mjs");
    normalizeHumanReason(reason);
    forceNotNeeded = true;
  }
  const p3 = await phase3();
  const { plan: htmlPlan } = p3.validateAndBuildHtmlFirstPlan({ runDir: eligible.run });
  const sourceSlides = htmlPlan.slides.filter((slide) => slide.primary_visual && slide.geometry?.boxes?.primary_visual).map((slide) => ({ slide_id: slide.slide_id, slot: "primary_visual", visual_contract_fingerprint: slide.visual_contract_fingerprint }));
  const sourceById = new Map(sourceSlides.map((slide) => [slide.slide_id, slide]));
  const selected = slides == null ? sourceSlides.slice(0, 4) : slides.map((item) => {
    const id = item?.slide_id ?? item?.slideId;
    const current = sourceById.get(id);
    if (!current) throw new Error(`refinement slide ${id} is not an eligible current HTML visual slot`);
    if (item.visual_contract_fingerprint && item.visual_contract_fingerprint !== current.visual_contract_fingerprint) throw new Error(`STALE: visual contract for ${id} changed; obtain a fresh recommendation`);
    const slot = item.slot || current.slot;
    if (slot !== current.slot) throw new Error(`refinement slot ${slot} is not the resolved no-text slot for ${id}`);
    return current;
  });
  const profileFingerprintValue = profileFingerprint || safeProfileFingerprint(profile || { model: "image2", mode: "visual-slot" });
  const profileContract = createProfileContract(profileFingerprintValue);
  const styleReference = await styleReferenceStatus(eligible.run);
  const requestMaterials = materializeRefinementRequestSet({
    runDir: eligible.run,
    htmlPlan,
    refinementPlan: {
      profile_fingerprint: profileFingerprintValue,
      profile_contract: profileContract,
      style_reference_status: styleReference,
      slides: selected,
    },
  });
  const plan = buildPlan({
    run_version: eligible.run_version,
    delivery_digest: eligible.delivery_digest,
    profile_fingerprint: profileFingerprintValue,
    profile_contract: profileContract,
    request_contract_version: "pptmaker-refinement-submit-request-v1",
    request_fingerprints: requestFingerprintsForPlan(requestMaterials),
    style_reference_status: styleReference,
    marked_html_first: true,
    delivery_review: "proceed",
    slides: selected,
    prerequisite_waiver_fingerprint: waiver ? prerequisiteWaiverFingerprint(waiver) : null,
  });
  return Object.freeze({
    recommendation: true,
    eligible_slides: sourceSlides,
    plan,
    expected_attempts: plan.total_attempts,
    prerequisite_waiver: waiver,
    force_not_needed: forceNotNeeded,
  });
}

/** Build and persist one exact plan after recommendation has been accepted. */
export async function createRefinementPlan(input = {}) {
  const recommendation = await recommendRefinement(input);
  const { record: current } = readRecord(input.runDir);
  if (current.authorization) {
    const unresolvedAttempt = Object.values(current.attempts || {}).some((attempt) =>
      ["planned", "submitting"].includes(attempt.state) ||
      (attempt.state === "unknown-submit" && !attempt.unknown_submit_resolution)
    );
    const pendingReview = Object.values(current.reviews || {}).some((review) => review.decision === "pending");
    const unreviewedCandidate = Object.values(current.attempts || {}).some((attempt) => {
      if (attempt.kind !== "slot" || attempt.state !== "submitted" || !attempt.candidate_id) return false;
      const review = Object.values(current.reviews || {}).find((entry) => entry.candidate_id === attempt.candidate_id);
      return !review || !["accept", "use-html"].includes(review.decision);
    });
    if (unresolvedAttempt || pendingReview || unreviewedCandidate) throw new Error("CONFLICT: current refinement authorization/review must be resolved before a fresh plan");
  }
  ensureRefinementDerivedRoots(input.runDir);
  const planPath = refinementPaths(input.runDir).plan;
  writeRefinementPlan(input.runDir, recommendation.plan, { expectedSha256: readVersionFileSha(planPath) });
  updateRecord(input.runDir, () => ({
    ...defaultRecord(recommendation.plan.run_version),
    plan: recommendation.plan,
    prerequisite_waiver: recommendation.prerequisite_waiver,
  }));
  const result = { ...recommendation.plan };
  Object.defineProperty(result, "force_not_needed", {
    value: recommendation.force_not_needed,
    enumerable: false,
  });
  return Object.freeze(result);
}

export function planRefinement(input) {
  // Preserve the original pure API for callers that already supplied a typed
  // plan input; runDir indicates the persisted/eligibility-aware operation.
  if (input?.runDir) return createRefinementPlan(input);
  return buildPlan(input);
}

export async function authorizeRefinement({ runDir, plan = null, planHash = null, authorizationId = null } = {}) {
  const { record: existingRecord } = readRecord(runDir);
  const stored = readRefinementPlan(runDir);
  if (!stored) throw new Error("refinement plan is missing; run image2 plan first");
  const storedExact = buildPlan(stored);
  if (stored.plan_hash !== storedExact.plan_hash) throw new Error("STALE: persisted refinement plan is not canonical; obtain a fresh plan");
  if (!planHash || planHash !== storedExact.plan_hash) throw new Error("STALE: exact persisted plan hash authorization is required");
  if (plan && (plan.plan_hash !== storedExact.plan_hash || canonicalJson(plan) !== canonicalJson(stored))) {
    throw new Error("STALE: supplied plan is not the exact persisted recommendation");
  }
  if (!existingRecord.plan || existingRecord.plan.plan_hash !== storedExact.plan_hash) {
    throw new Error("STALE: authoritative refinement state does not bind the persisted plan");
  }
  const exact = storedExact;
  const eligible = await currentEligibilityForRecord(runDir, existingRecord);
  const current = await recommendRefinement({
    runDir: eligible.run,
    slides: exact.slides,
    profileFingerprint: exact.profile_fingerprint,
    prerequisiteWaiver: exact.prerequisite_waiver_fingerprint ? existingRecord.prerequisite_waiver : null,
  });
  if (current.plan.plan_hash !== exact.plan_hash) throw new Error("STALE: current HTML delivery/profile/visual binding differs from the plan");
  if (existingRecord.authorization) throw new Error("CONFLICT: refinement authorization is single-use; create a fresh plan before another authorization");
  const authorization = authorizePlan(exact, authorizationId || undefined);
  const attempts = Object.fromEntries(authorization.attempts.map((item) => {
    const value = attemptValue(authorization, item, exact);
    return [value.attempt_id, value];
  }));
  const record = updateRecord(eligible.run, (current) => ({ ...current, plan: exact, authorization, attempts }));
  ensureRefinementDerivedRoots(eligible.run);
  const authorizationPath = refinementPaths(eligible.run).authorization;
  writeRefinementAuthorization(eligible.run, authorization, { expectedSha256: readVersionFileSha(authorizationPath) });
  for (const attempt of Object.values(attempts)) writeAttemptRecord(eligible.run, attempt);
  return Object.freeze({ authorization, attempts: record.record.attempts });
}

function findAttempt(record, attemptId) {
  const values = Object.values(record.attempts || {});
  if (attemptId) return values.find((entry) => entry.attempt_id === attemptId) || null;
  return values.find((entry) => entry.state === "planned") || null;
}

async function persistAttempt(runDir, nextAttempt) {
  const { record } = updateRecord(runDir, (current) => ({
    ...current,
    authorization: current.authorization && nextAttempt.state === "submitting"
      ? { ...current.authorization, used: true, used_at: current.authorization.used_at || nowIso() }
      : current.authorization,
    attempts: { ...current.attempts, [nextAttempt.attempt_id]: nextAttempt },
  }));
  if (nextAttempt.state === "submitting" && record.authorization) {
    const authorizationPath = refinementPaths(runDir).authorization;
    writeRefinementAuthorization(runDir, record.authorization, { expectedSha256: readVersionFileSha(authorizationPath) });
  }
  writeAttemptRecord(runDir, nextAttempt);
  return record;
}

async function promoteStyleReferenceResult({ runDir, runVersion, record, attempt, result, submitted }) {
  assertPromotionFencesClear(runDir);
  const styleAssetId = "refined-style-reference";
  // The attempt is already persisted as submitted. Promotion must carry that
  // latest state forward instead of committing the pre-submit copy.
  const currentState = readState(deckRoot(runDir), { purpose: "execute", heal: false });
  const nextState = clone(currentState);
  const versionRecord = nextState.nodes?.["image2-refinement"]?.by_version?.[`3_versions/${runVersion}`];
  if (!versionRecord?.attempts?.[attempt.attempt_id]) throw new Error("submitted style-reference attempt is missing from state");
  versionRecord.attempts[attempt.attempt_id] = { ...versionRecord.attempts[attempt.attempt_id], promotion_status: "committed", updated_at: nowIso() };
  const provenancePath = refinementPaths(runDir).provenance;
  const priorProvenance = existsSync(provenancePath)
    ? parseProvenance(provenancePath)
    : { schema: "pptmaker-image2-refinement-provenance-v1", run_version: runVersion, style_reference: null, accepted_slots: {} };
  const measuredSha = result.sha256 || sha256(result.bytes);
  const styleBinding = {
    asset_id: styleAssetId,
    output_sha256: measuredSha,
    candidate_sha256: measuredSha,
    profile_fingerprint: record.plan.profile_fingerprint,
    plan_hash: record.plan.plan_hash,
    authorization_id: record.authorization.authorization_id,
    attempt_id: attempt.attempt_id,
  };
  const nextProvenance = { ...priorProvenance, style_reference: styleBinding };
  const styleUpdatedAt = nowIso();
  const nextStateSha256 = prepareStateWrite(nextState, { updatedAt: styleUpdatedAt }).sha256;
  const preparedStyle = await prepareStyleReferencePromotion({
    registration: {
      runDir,
      assetId: styleAssetId,
      bytes: result.bytes,
      target: "style-reference",
      metadata: {
        label: "Image2 style reference",
        description: "Accepted refinement style reference",
        usage_guidance: "Use only for the authorized refinement profile",
      },
    },
    provenance: nextProvenance,
    nextStateSha256,
  });
  const styleJournal = {
    schema: "pptmaker-image2-refinement-promotion-journal-v1",
    transaction_id: `tx-${attempt.attempt_id}`,
    run_version: runVersion,
    kind: "style-reference",
    candidate_id: `style-${attempt.attempt_id}`,
    target_asset_id: styleAssetId,
    old: preparedStyle.old,
    next: preparedStyle.next,
    phase: "prepared",
  };
  try {
    return await executePreparedStyleReferencePromotion({ prepared: preparedStyle, journal: styleJournal, nextState, stateUpdatedAt: styleUpdatedAt });
  } catch (promotionError) {
    promotionError.attempt = submitted;
    promotionError.promotionRecoveryRequired = true;
    throw promotionError;
  }
}

async function resolveGenerationTransport({ transport, adapter, transportFactory } = {}) {
  if (transport || adapter) return transport || adapter;
  if (transportFactory != null && typeof transportFactory !== "function") {
    throw new Error("modern refinement transport factory must be a function");
  }
  return transportFactory ? transportFactory() : null;
}

function reconciliationEnvelope(attempt) {
  const providerRequestId = persistedProviderRequestId(attempt?.provider_request_id);
  if (!providerRequestId) return null;
  return Object.freeze({
    attempt_id: attempt.attempt_id,
    authorization_id: attempt.authorization_id,
    plan_hash: attempt.plan_hash,
    provider_request_id: providerRequestId,
  });
}

export async function generateRefinement({ runDir, attemptId = null, transport, adapter = null, transportFactory = null } = {}) {
  const { record } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, record);
  if (!record.plan || !record.authorization) throw new Error("refinement authorization is required before generation");
  const attempt = findAttempt(record, attemptId);
  if (!attempt) throw new Error("attempt is missing or already terminal");
  if (attempt.state !== "planned") throw new Error(`duplicate or stale attempt ${attempt.attempt_id} is ${attempt.state}`);
  if (attempt.kind === "slot") {
    const setup = Object.values(record.attempts || {}).find((entry) => entry.kind === "style-reference");
    if (setup && (setup.state !== "submitted" || setup.promotion_status !== "committed")) throw new Error(`style-reference setup dependency is ${setup.state}${setup.promotion_status === "pending" ? "/promotion-pending" : ""}; page generation is blocked`);
  }
  if (record.plan.schema !== REFINEMENT_PLAN_SCHEMA_V2 || !attempt.request_fingerprint) {
    throw new Error("STALE: refinement attempt lacks a current v2 request fingerprint; create and authorize a fresh plan");
  }
  const p3 = await phase3();
  const { plan: htmlPlan } = p3.validateAndBuildHtmlFirstPlan({ runDir: eligible.run });
  const materials = materializeRefinementRequestSet({ runDir: eligible.run, htmlPlan, refinementPlan: record.plan });
  const request = materializeAuthorizedRefinementRequest({
    materials,
    attempt,
    authorizationId: record.authorization.authorization_id,
    planHash: record.plan.plan_hash,
  });
  // This is the charge boundary: resolve the remote adapter only after the
  // current material, inline reference bytes, and role-bound fingerprint pass.
  const tx = await resolveGenerationTransport({ transport, adapter, transportFactory });
  if (!tx || typeof tx.submitAttempt !== "function") throw new Error("modern refinement transport must be injected after authorization");
  const nextSubmitting = transitionAttempt(attempt, "submitting");
  await persistAttempt(eligible.run, nextSubmitting);
  let result;
  try {
    result = await tx.submitAttempt(request);
    if (result?.status === "unknown-submit") {
      throw Object.assign(new Error("provider submit outcome is unknown"), {
        code: "unknown-submit",
        provider_request_id: persistedProviderRequestId(result.provider_request_id),
        receipt: result.receipt || null,
      });
    }
    if (result?.status === "failed") {
      const failed = transitionAttempt(nextSubmitting, "failed", {
        failure_code: result.failure_code || "provider_failure",
        provider_request_id: persistedProviderRequestId(result.provider_request_id),
        receipt: result.receipt || null,
      });
      await persistAttempt(eligible.run, failed);
      const error = new Error("provider reported a failed refinement attempt");
      error.attempt = failed;
      error.partialFailure = true;
      throw error;
    }
    if (attempt.kind === "slot" && !result?.bytes) {
      const failed = transitionAttempt(nextSubmitting, "failed", { failure_code: "missing_candidate", receipt: result?.receipt || null });
      await persistAttempt(eligible.run, failed);
      const error = new Error("provider returned no candidate bytes for a slot attempt");
      error.attempt = failed;
      error.partialFailure = true;
      throw error;
    }
    if (attempt.kind === "style-reference" && !result?.bytes) {
      const failed = transitionAttempt(nextSubmitting, "failed", { failure_code: "missing_style_reference", receipt: result?.receipt || null });
      await persistAttempt(eligible.run, failed);
      const error = new Error("provider returned no style-reference bytes");
      error.attempt = failed;
      error.partialFailure = true;
      throw error;
    }
    let candidate = null;
    if (result?.bytes && attempt.kind === "slot") {
      const candidateId = result.candidate_id || `candidate-${attempt.attempt_id}`;
      const candidateSha = result.sha256 || sha256(result.bytes);
      candidate = createCandidateRecord({ candidate_id: candidateId, attempt_id: attempt.attempt_id, authorization_id: record.authorization.authorization_id, plan_hash: record.plan.plan_hash, run_version: eligible.run_version, slide_id: attempt.slide_id, slot: attempt.slot, sha256: candidateSha, media: result.media || "image/png", width: result.width, height: result.height, profile_fingerprint: record.plan.profile_fingerprint, receipt: result.receipt });
      persistCandidate(eligible.run, candidate, result.bytes);
    }
    const submitted = transitionAttempt(nextSubmitting, "submitted", { provider_request_id: persistedProviderRequestId(result?.provider_request_id), candidate_id: candidate?.candidate_id || null, receipt: result?.receipt || null, ...(attempt.kind === "style-reference" ? { promotion_status: "pending" } : {}) });
    await persistAttempt(eligible.run, submitted);
    let completedAttempt = submitted;
    if (attempt.kind === "style-reference" && result?.bytes) {
      await promoteStyleReferenceResult({ runDir: eligible.run, runVersion: eligible.run_version, record, attempt, result, submitted });
      completedAttempt = readRecord(eligible.run).record.attempts[attempt.attempt_id];
      writeAttemptRecord(eligible.run, completedAttempt);
    }
    return Object.freeze({ attempt: completedAttempt, candidate });
  } catch (error) {
    const unknown = error?.code === "unknown-submit" || error?.code === "ETIMEDOUT" || error?.unknownSubmit;
    if (error?.attempt?.state === "failed" || error?.promotionRecoveryRequired) throw error;
    const next = transitionAttempt(nextSubmitting, unknown ? "unknown-submit" : "failed", {
      failure_code: String(error?.code || "provider_failure"),
      provider_request_id: persistedProviderRequestId(error?.provider_request_id),
      receipt: error?.receipt || null,
    });
    await persistAttempt(eligible.run, next);
    if (!unknown) throw error;
    return Object.freeze({ attempt: next, requires_human: true });
  }
}

export async function reconcileRefinementAttempt({ runDir, attemptId, transport, adapter = null, transportFactory = null } = {}) {
  const { record } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, record);
  const attempt = findAttempt(record, attemptId);
  if (!attempt || !["submitting", "unknown-submit"].includes(attempt.state)) throw new Error("only submitting or unknown-submit attempts can be reconciled");
  const persistedAttempt = reconciliationEnvelope(attempt);
  if (!persistedAttempt) {
    if (attempt.state === "submitting") {
      const unknown = transitionAttempt(attempt, "unknown-submit", { failure_code: "provider_request_identity_unavailable" });
      await persistAttempt(eligible.run, unknown);
      return Object.freeze({ attempt: unknown, requires_human: true });
    }
    return Object.freeze({ attempt, requires_human: true, reason: "persisted provider request identity is unavailable" });
  }
  const tx = await resolveGenerationTransport({ transport, adapter, transportFactory });
  if (!tx || typeof tx.reconcileAttempt !== "function") {
    if (attempt.state === "submitting") {
      const unknown = transitionAttempt(attempt, "unknown-submit", { failure_code: "reconciliation_unavailable" });
      await persistAttempt(eligible.run, unknown);
      return Object.freeze({ attempt: unknown, requires_human: true });
    }
    throw new Error("reconciliation transport is unavailable");
  }
  // Reconciliation is deliberately identity-only. It never rematerializes the
  // provider request or reads visual brief/reference bytes from the plan.
  const result = await tx.reconcileAttempt(persistedAttempt);
  if (!result || result.status === "unknown-submit") {
    if (attempt.state === "submitting") {
      const unknown = transitionAttempt(attempt, "unknown-submit", {
        failure_code: "provider_proof_unavailable",
        provider_request_id: persistedProviderRequestId(result?.provider_request_id) || persistedProviderRequestId(attempt.provider_request_id),
        receipt: result?.receipt || null,
      });
      await persistAttempt(eligible.run, unknown);
      return Object.freeze({ attempt: unknown, requires_human: true });
    }
    return Object.freeze({ attempt, requires_human: true });
  }
  if (result.status === "failed") {
    const failed = transitionAttempt(attempt, "failed", {
      failure_code: result.failure_code || "provider_failure",
      provider_request_id: persistedProviderRequestId(result.provider_request_id) || persistedProviderRequestId(attempt.provider_request_id),
      receipt: result.receipt || null,
    });
    await persistAttempt(eligible.run, failed);
    return Object.freeze({ attempt: failed, requires_human: false, partial_failure: true });
  }
  if (result.status !== "submitted") throw new Error("provider reconciliation did not prove a submitted result");
  if (!result.bytes) {
    const reason = attempt.kind === "style-reference"
      ? "reconciled style-reference submission has no bytes"
      : "reconciled submission has no candidate bytes";
    return Object.freeze({ attempt, requires_human: true, reason });
  }
  let candidate = null;
  if (result.bytes && attempt.kind === "slot") {
    const candidateId = result.candidate_id || `candidate-${attempt.attempt_id}`;
    candidate = createCandidateRecord({ candidate_id: candidateId, attempt_id: attempt.attempt_id, authorization_id: record.authorization.authorization_id, plan_hash: record.plan.plan_hash, run_version: eligible.run_version, slide_id: attempt.slide_id, slot: attempt.slot, sha256: result.sha256 || sha256(result.bytes), media: result.media || "image/png", width: result.width, height: result.height, profile_fingerprint: record.plan.profile_fingerprint, receipt: result.receipt });
    persistCandidate(eligible.run, candidate, result.bytes);
  }
  const submitted = transitionAttempt(attempt, "submitted", {
    provider_request_id: persistedProviderRequestId(result.provider_request_id) || persistedProviderRequestId(attempt.provider_request_id),
    candidate_id: candidate?.candidate_id || null,
    receipt: result.receipt || null,
    ...(attempt.kind === "style-reference" ? { promotion_status: "pending" } : {}),
  });
  await persistAttempt(eligible.run, submitted);
  let completedAttempt = submitted;
  if (attempt.kind === "style-reference") {
    await promoteStyleReferenceResult({ runDir: eligible.run, runVersion: eligible.run_version, record, attempt, result, submitted });
    completedAttempt = readRecord(eligible.run).record.attempts[attempt.attempt_id];
    writeAttemptRecord(eligible.run, completedAttempt);
  }
  return Object.freeze({ attempt: completedAttempt, candidate });
}

export async function resolveUnknownSubmit({ runDir, attemptId, decision, candidateId = null } = {}) {
  validateUnknownSubmitDecision(decision);
  const { record } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, record);
  const attempt = findAttempt(record, attemptId);
  if (!attempt || attempt.state !== "unknown-submit") throw new Error("unknown-submit attempt is missing or already resolved");
  let next;
  if (decision === "retain") {
    if (!candidateId) throw new Error("retain requires an exact reconciled candidate ID");
    const candidate = readCandidate(eligible.run, candidateId);
    if (!candidate || candidate.metadata.attempt_id !== attempt.attempt_id || candidate.metadata.sha256 !== sha256(candidate.bytes)) throw new Error("retain candidate is missing or not bound to the unknown attempt");
    next = transitionAttempt(attempt, "submitted", { unknown_submit_resolution: "retain", candidate_id: candidateId, resolved_at: nowIso() });
  } else {
    next = { ...attempt, unknown_submit_resolution: "abandon", resolved_at: nowIso() };
  }
  await persistAttempt(eligible.run, next);
  return Object.freeze({ attempt: next, replacement_requires_new_authorization: decision === "abandon" });
}

export async function composeCandidateReview({ runDir, candidateId, compose = null } = {}) {
  const { record: storedRecord } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, storedRecord, { allowPostPromotionStaleDelivery: true });
  const candidate = readCandidate(eligible.run, candidateId);
  if (!candidate) throw new Error("candidate is missing");
  const metadata = candidate.metadata;
  const { record: existing } = readRecord(eligible.run);
  const selected = existing.plan?.slides?.find((slide) => slide.slide_id === metadata.slide_id);
  if (!selected || selected.slot !== metadata.slot || metadata.plan_hash !== existing.plan.plan_hash || metadata.authorization_id !== existing.authorization?.authorization_id) {
    throw new Error("candidate is not bound to the current authorized plan");
  }
  const currentPlan = (await phase3()).validateAndBuildHtmlFirstPlan({ runDir: eligible.run }).plan;
  const currentSlide = currentPlan.slides.find((slide) => slide.slide_id === metadata.slide_id);
  if (!currentSlide || currentSlide.visual_contract_fingerprint !== selected.visual_contract_fingerprint) throw new Error("STALE: candidate visual geometry no longer matches the authorized plan");
  const composeFn = compose || (async (value) => {
    const p3 = await phase3();
    const context = p3.createCanonicalHtmlValidatedRunContext({ runDir: eligible.run });
    return p3.composeHtmlVisualSlotCandidate(context, { slideId: metadata.slide_id, slot: metadata.slot, candidateId: metadata.candidate_id, candidateSha256: metadata.sha256, bytes: value.bytes, media: metadata.media });
  });
  const comparison = await composeFn(candidate);
  if (!comparison?.review_only || comparison.current_delivery_unchanged !== true) throw new Error("candidate compositor did not return a review-only comparison");
  if (comparison.candidate_sha256 !== metadata.sha256 || comparison.slide_id !== metadata.slide_id || comparison.slot !== metadata.slot) throw new Error("candidate comparison is not bound to the candidate identity");
  const stored = writeCandidateComparison(eligible.run, candidateId, comparison.html, { schema: "pptmaker-image2-refinement-comparison-v1", candidate_sha256: metadata.sha256, slide_id: metadata.slide_id, slot: metadata.slot, geometry: comparison.geometry, html_sha256: comparison.html_sha256 });
  const review = createReviewRecord({ run_version: eligible.run_version, slide_id: metadata.slide_id, slot: metadata.slot, candidate_id: metadata.candidate_id, candidate_sha256: metadata.sha256, comparison_sha256: stored.sha256, decision: "pending", created_at: metadata.created_at });
  const { record } = updateRecord(eligible.run, (current) => ({ ...current, reviews: { ...current.reviews, [metadata.slide_id]: review } }));
  writeJsonAtomic(candidatePaths(eligible.run, candidateId).comparison_metadata, { ...review, comparison_sha256: stored.sha256 });
  return Object.freeze({ review, comparison: stored, record });
}

export async function useHtmlRefinement({ runDir, slideId, candidateId } = {}) {
  const { record } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, record, { allowPostPromotionStaleDelivery: true });
  const prior = record.reviews?.[slideId];
  if (!prior || !prior.comparison_sha256 || (candidateId && prior.candidate_id !== candidateId)) throw new Error("current candidate review is required");
  const candidate = readCandidate(eligible.run, prior.candidate_id);
  if (!candidate || candidate.metadata.sha256 !== prior.candidate_sha256) throw new Error("review candidate is missing or stale");
  const review = createReviewRecord({ ...prior, decision: "use-html", reviewed_at: nowIso() });
  const { record: next } = updateRecord(eligible.run, (current) => ({ ...current, reviews: { ...current.reviews, [slideId]: review } }));
  writeJsonAtomic(candidatePaths(eligible.run, prior.candidate_id).comparison_metadata, review);
  return Object.freeze({ review, record: next, provider_calls: 0, current_delivery_unchanged: true });
}

export async function acceptRefinementCandidate({ runDir, slideId, candidateId, stateUpdatedAt = nowIso(), localRecompose = null } = {}) {
  const { state, record } = readRecord(runDir);
  const eligible = await currentEligibilityForRecord(runDir, record, { allowPostPromotionStaleDelivery: true });
  assertPromotionFencesClear(eligible.run);
  const review = record.reviews?.[slideId];
  if (!review || !review.comparison_sha256 || review.candidate_id !== candidateId || review.decision !== "pending") throw new Error("candidate must have a current pending review before accept");
  const candidate = readCandidate(eligible.run, candidateId);
  if (!candidate) throw new Error("candidate is missing or invalid");
  if (candidate.metadata.sha256 !== review.candidate_sha256 || candidate.metadata.slide_id !== slideId) throw new Error("candidate identity does not match the reviewed page");
  if (!record.plan || candidate.metadata.plan_hash !== record.plan.plan_hash || candidate.metadata.authorization_id !== record.authorization?.authorization_id) throw new Error("candidate is not bound to the current authorization");
  const assetId = candidateAssetId(slideId, candidateId);
  const p3 = await phase3();
  const htmlPlan = p3.validateAndBuildHtmlFirstPlan({ runDir: eligible.run }).plan;
  const target = htmlPlan.slides.find((slide) => slide.slide_id === slideId);
  if (!target) throw new Error("candidate slide is no longer in the current source");
  const planned = record.plan?.slides?.find((slide) => slide.slide_id === slideId);
  if (!planned || planned.visual_contract_fingerprint !== target.visual_contract_fingerprint || planned.slot !== review.slot) throw new Error("STALE: candidate visual contract is no longer current");
  const existing = existsSync(refinementPaths(eligible.run).provenance) ? parseProvenance(refinementPaths(eligible.run).provenance) : { schema: "pptmaker-image2-refinement-provenance-v1", run_version: eligible.run_version, style_reference: null, accepted_slots: {} };
  const binding = { asset_id: assetId, accepted_for: target.visual_contract_fingerprint, output_sha256: candidate.metadata.sha256, candidate_sha256: candidate.metadata.sha256, profile_fingerprint: record.plan.profile_fingerprint, plan_hash: record.plan.plan_hash, authorization_id: candidate.metadata.authorization_id, attempt_id: candidate.metadata.attempt_id };
  const provenance = { ...existing, accepted_slots: { ...(existing.accepted_slots || {}), [slideId]: binding } };
  const nextRecord = { ...record, reviews: { ...record.reviews, [slideId]: createReviewRecord({ ...review, decision: "accept", reviewed_at: stateUpdatedAt }) } };
  const nextState = clone(state);
  nextState.nodes ||= {};
  const prior = nextState.nodes["image2-refinement"]?.by_version || {};
  nextState.nodes["image2-refinement"] = { by_version: { ...prior, [`3_versions/${eligible.run_version}`]: nextRecord } };
  const nextStateSha256 = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt }).sha256;
  const prepared = await prepareVisualSlotPromotion({ registration: { runDir: eligible.run, assetId, bytes: candidate.bytes, target: "visual-slots", metadata: { label: `Refined ${slideId}`, description: "Accepted Image2 visual-slot candidate", usage_guidance: "Use only in the bound HTML visual slot" } }, selection: { runDir: eligible.run, slideId, assetId, visualContractFingerprint: target.visual_contract_fingerprint, outputSha256: candidate.metadata.sha256 }, provenance, nextStateSha256 });
  const journal = { schema: "pptmaker-image2-refinement-promotion-journal-v1", transaction_id: `tx-${candidateId}`, run_version: eligible.run_version, kind: "visual-slot", candidate_id: candidateId, target_asset_id: assetId, old: prepared.old, next: prepared.next, phase: "prepared" };
  const result = await executePreparedVisualSlotPromotion({ prepared, journal, nextState, selection: { runDir: eligible.run, slideId, assetId, visualContractFingerprint: target.visual_contract_fingerprint, outputSha256: candidate.metadata.sha256 }, stateUpdatedAt });
  let recomposed = null;
  if (typeof localRecompose === "function") recomposed = await localRecompose({ runDir: eligible.run, slideId, assetId });
  else {
    try { recomposed = await p3.recomposeHtmlSlidesLocally(eligible.run, { slideIds: [slideId] }); }
    catch (error) { recomposed = { status: "failed", reason: error.message, provider_calls: 0 }; }
  }
  writeJsonAtomic(candidatePaths(eligible.run, candidateId).comparison_metadata, nextRecord.reviews[slideId]);
  return Object.freeze({ result, review: nextRecord.reviews[slideId], asset_id: assetId, provider_calls: 0, recomposed, requires_final_review: true });
}

function parseProvenance(path) {
  try { return parseYaml(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`invalid refinement provenance: ${error.message}`); }
}

export async function cleanupRefinementEvidence({ runDir, expectedReviewSha256 = null, dryRun = false } = {}) {
  const { record } = readRecord(runDir);
  await currentEligibilityForRecord(runDir, record, { allowPostPromotionStaleDelivery: true });
  return cleanupRefinement(runDir, { expectedReviewSha256, dryRun });
}

export async function declineRefinement({ runDir } = {}) {
  const run = resolve(runDir);
  const paths = refinementPaths(run);
  const root = deckRoot(run);
  if (!existsSync(paths.state)) {
    for (const dir of [paths.generated, paths.scratch]) if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    return Object.freeze({ declined: true, provider_calls: 0 });
  }
  const state = readState(root, { purpose: "execute", heal: false });
  const next = clone(state);
  const byVersion = { ...(next.nodes?.["image2-refinement"]?.by_version || {}) };
  delete byVersion[`3_versions/${paths.run_version}`];
  if (Object.keys(byVersion).length) next.nodes["image2-refinement"] = { by_version: byVersion };
  else if (next.nodes) delete next.nodes["image2-refinement"];
  for (const nodeId of ["recommend-image2-refinement", "authorize-image2-refinement", "execute-image2-refinement", "review-image2-refinement"]) {
    if (next.nodes) delete next.nodes[nodeId];
  }
  if (next.playbook === "image2-refine") {
    const { resumePlaybook } = await import("../../shared/state/state.mjs");
    if (Array.isArray(next.playbook_stack) && next.playbook_stack.length) resumePlaybook(next);
    else {
      next.current_node = "";
      next.playbook = "";
      next.execution_id = "";
      next.execution_started_at = "";
    }
  }
  writeState(root, next, { expectedStateSha: readVersionFileSha(paths.state) });
  for (const dir of [paths.generated, paths.scratch]) if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  return Object.freeze({ declined: true, provider_calls: 0 });
}

export async function enterRefinementController({ runDir } = {}) {
  const eligible = await currentEligibility(runDir);
  const root = deckRoot(eligible.run);
  const state = readState(root, { purpose: "execute", heal: false });
  if (state.playbook !== "image2-refine") {
    const { switchPlaybook } = await import("../../shared/state/state.mjs");
    switchPlaybook(state, "image2-refine");
  }
  state.current_node = "recommend-image2-refinement";
  state.nodes["recommend-image2-refinement"] = { status: "in_progress", execution_id: state.execution_id, evidence: {} };
  writeState(root, state, { expectedStateSha: readVersionFileSha(refinementPaths(eligible.run).state) });
  return Object.freeze({ entered: true, playbook: "image2-refine", current_node: state.current_node, run_version: eligible.run_version });
}

export async function completeRefinementController({ runDir } = {}) {
  const { record: storedRecord } = readRecord(runDir);
  // A successful local promotion intentionally stales delivery. This permits
  // only the handoff to final review; provider-facing operations stay strict.
  const eligible = await currentEligibilityForRecord(runDir, storedRecord, { allowPostPromotionStaleDelivery: true });
  const root = deckRoot(eligible.run);
  const state = readState(root, { purpose: "execute", heal: false });
  const record = storedRecord;
  const reviews = Object.values(record.reviews || {});
  const selectedIds = new Set(record.plan?.slides?.map((slide) => slide.slide_id) || []);
  const reviewedIds = new Set(reviews.map((review) => review.slide_id));
  if (!record.plan || reviewedIds.size !== selectedIds.size || [...selectedIds].some((id) => !reviewedIds.has(id)) || reviews.some((review) => !["accept", "use-html"].includes(review.decision))) throw new Error("refinement reviews are incomplete");
  if (state.playbook === "image2-refine") {
    for (const nodeId of ["recommend-image2-refinement", "authorize-image2-refinement", "execute-image2-refinement"]) {
      state.nodes[nodeId] = { ...(state.nodes[nodeId] || {}), status: "completed", execution_id: state.execution_id, evidence: { ...(state.nodes[nodeId]?.evidence || {}), [`${nodeId}-current`]: { met: true, kind: "agent", at: nowIso() } } };
    }
    state.nodes["review-image2-refinement"] = { status: "completed", execution_id: state.execution_id, evidence: { "image2-refinement-review": { met: true, kind: "agent", at: nowIso() } } };
    state.current_node = "review-image2-refinement";
    if (Array.isArray(state.playbook_stack) && state.playbook_stack.length) {
      const { resumePlaybook } = await import("../../shared/state/state.mjs");
      resumePlaybook(state);
    }
  }
  writeState(root, state, { expectedStateSha: readVersionFileSha(refinementPaths(eligible.run).state) });
  return Object.freeze({ complete: true, completed_playbook: "image2-refine", requires_final_review: !eligible.delivery_complete, playbook: state.playbook });
}

export async function recoverRefinementPromotion({ runDir, prepared = null, selection = null, nextState = null, stateUpdatedAt = nowIso() } = {}) {
  const journal = readPromotionJournal(runDir);
  if (!journal) return Object.freeze({ status: "absent" });
  selection ||= prepared?.selection || null;
  nextState ||= prepared?.nextState || null;
  stateUpdatedAt = prepared?.stateUpdatedAt || stateUpdatedAt;

  // A journal written by the normal executor carries a complete, bounded
  // recovery payload. Older/manual journals may only be inspected when every
  // source SHA is still old or already next; they are never guessed forward.
  const recovery = journal.recovery;
  if (!prepared && recovery) {
    const registration = {
      runDir: resolve(runDir),
      assetId: recovery.registration.asset_id,
      target: recovery.registration.target,
      bytes: Buffer.from(recovery.registration.bytes_base64, "base64"),
      metadata: recovery.registration.metadata,
    };
    selection = recovery.selection ? { ...recovery.selection, runDir: resolve(runDir) } : null;
    nextState = recovery.next_state;
    stateUpdatedAt = recovery.state_updated_at;
    prepared = { registration, provenance: { value: recovery.provenance }, old: journal.old, next: journal.next };
  }
  if (!prepared) return recoverPromotionJournal(runDir);

  const [p2, p3] = await Promise.all([phase2(), phase3()]);
  assertPromotionFencesClear(runDir);
  const paths = refinementPaths(runDir);
  const snapshot = () => ({ asset_manifest_sha256: readVersionFileSha(paths.asset_manifest), slide_specifications_sha256: readVersionFileSha(paths.slide_specifications), provenance_sha256: readVersionFileSha(paths.provenance), state_sha256: readVersionFileSha(paths.state) });
  const current = snapshot();
  const isOld = (key) => current[key] === journal.old[key];
  const isNext = (key) => current[key] === journal.next[key];
  const recoveryOrder = journal.kind === "style-reference"
    ? ["asset_manifest_sha256", "provenance_sha256", "state_sha256"]
    : ["asset_manifest_sha256", "slide_specifications_sha256", "provenance_sha256", "state_sha256"];
  if (journal.kind === "style-reference" && (journal.old.slide_specifications_sha256 !== journal.next.slide_specifications_sha256 || current.slide_specifications_sha256 !== journal.old.slide_specifications_sha256)) {
    throw new Error("CONFLICT: refinement promotion changed an unowned source SHA");
  }
  const recoveryStates = recoveryOrder.map((key) => isOld(key) ? "old" : isNext(key) ? "next" : "other");
  if (recoveryStates.includes("other")) throw new Error("CONFLICT: refinement promotion journal does not match an exact bound transaction state");
  let committedPrefix = 0;
  while (committedPrefix < recoveryStates.length && recoveryStates[committedPrefix] === "next") committedPrefix += 1;
  if (recoveryStates.some((state, index) => index < committedPrefix ? state !== "next" : state !== "old")) {
    throw new Error("CONFLICT: refinement promotion journal has an ambiguous commit ordering");
  }
  const assertBoundProgress = (key, expected) => {
    const actual = snapshot()[key];
    if (actual !== expected) throw new Error(`CONFLICT: recovery ${key} is not journal-bound`);
  };

  if (isOld("asset_manifest_sha256")) {
    const registration = prepared.registration || {
      ...prepared.asset,
      runDir: resolve(runDir),
      assetId: journal.target_asset_id,
      target: journal.kind === "style-reference" ? "style-reference" : "visual-slots",
      bytes: prepared.asset?.asset_bytes,
      metadata: prepared.asset?.metadata || { label: "Accepted Image2 refinement", description: "Accepted Image2 refinement asset", usage_guidance: "Use only in the bound visual slot" },
    };
    const assetPrepared = prepared.asset?.asset_bytes
      ? prepared.asset
      : await p2.prepareRefinedHtmlAssetRegistration(registration);
    if (assetPrepared.next_manifest_sha256 !== journal.next.asset_manifest_sha256 || assetPrepared.old_manifest_sha256 !== journal.old.asset_manifest_sha256) throw new Error("CONFLICT: recovery asset registration is not the exact bound transaction");
    const committed = p2.commitPreparedRefinedHtmlAssetRegistration(assetPrepared);
    if (committed.measured_sha256 !== assetPrepared.evidence.measured_sha256) throw new Error("CONFLICT: recovered asset SHA differs from the journal");
    assertBoundProgress("asset_manifest_sha256", journal.next.asset_manifest_sha256);
    updatePromotionJournal(runDir, { phase: "asset-committed" });
  } else if (!isNext("asset_manifest_sha256")) throw new Error("CONFLICT: recovery asset manifest is neither old nor next");

  if (journal.kind === "visual-slot" && isOld("slide_specifications_sha256")) {
    if (!selection) throw new Error("recovery requires the journal-bound selection value");
    const preparedSource = await p3.prepareHtmlPrimaryVisualSelection(selection);
    if (preparedSource.old_source_sha256 !== journal.old.slide_specifications_sha256 || preparedSource.next_source_sha256 !== journal.next.slide_specifications_sha256) throw new Error("CONFLICT: recovery selection binding is not the exact bound transaction");
    const bound = p3.bindHtmlPrimaryVisualSelection(selection);
    if (bound.source_sha256 !== journal.next.slide_specifications_sha256) throw new Error("CONFLICT: recovered selection SHA differs from the journal");
    updatePromotionJournal(runDir, { phase: "source-committed" });
  } else if (journal.kind === "visual-slot" && !isNext("slide_specifications_sha256")) throw new Error("CONFLICT: recovery slide source is neither old nor next");

  if (isOld("provenance_sha256")) {
    const provenance = prepared.provenance?.value || recovery?.provenance;
    if (!provenance) throw new Error("recovery requires the journal-bound provenance value");
    const preparedProvenance = prepareRefinementProvenance(runDir, provenance);
    if (preparedProvenance.old_sha256 !== journal.old.provenance_sha256 || preparedProvenance.next_sha256 !== journal.next.provenance_sha256) throw new Error("CONFLICT: recovery provenance is not the exact bound transaction");
    writeRefinementProvenance(runDir, provenance, { expectedSha256: journal.old.provenance_sha256 });
    updatePromotionJournal(runDir, { phase: "provenance-committed" });
  } else if (!isNext("provenance_sha256")) throw new Error("CONFLICT: recovery provenance is neither old nor next");

  if (isOld("state_sha256")) {
    if (!nextState) throw new Error("recovery requires the journal-bound next state");
    const preparedState = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt });
    if (preparedState.sha256 !== journal.next.state_sha256) throw new Error("CONFLICT: recovery state is not the exact bound transaction");
    commitRefinementState(runDir, nextState, { expectedStateSha256: journal.old.state_sha256, updatedAt: stateUpdatedAt });
    assertBoundProgress("state_sha256", journal.next.state_sha256);
    updatePromotionJournal(runDir, { phase: "state-committed" });
  } else if (!isNext("state_sha256")) throw new Error("CONFLICT: recovery state is neither old nor next");

  const result = recoverPromotionJournal(runDir);
  let enriched = result;
  if (result.status === "committed" && journal.kind === "style-reference") {
    const attemptId = recovery?.provenance?.style_reference?.attempt_id || prepared.provenance?.value?.style_reference?.attempt_id;
    const attemptRecord = attemptId ? readRecord(runDir).record.attempts?.[attemptId] : null;
    if (attemptRecord) writeAttemptRecord(runDir, attemptRecord);
  }
  if (result.status === "committed" && journal.kind === "visual-slot" && selection) {
    const recoveredReview = readRecord(runDir).record.reviews?.[selection.slideId];
    if (recoveredReview?.candidate_id === journal.candidate_id && recoveredReview.decision === "accept") {
      writeJsonAtomic(candidatePaths(runDir, journal.candidate_id).comparison_metadata, recoveredReview);
    }
    try {
      const p3Local = await phase3();
      enriched = { ...result, recomposed: await p3Local.recomposeHtmlSlidesLocally(resolve(runDir), { slideIds: [selection.slideId] }) };
    } catch (error) {
      enriched = { ...result, recompose: { status: "failed", reason: error.message, provider_calls: 0 } };
    }
  }
  return Object.freeze(enriched);
}

export async function prepareVisualSlotPromotion({ registration, selection, provenance, nextStateSha256 }) {
  if (!/^[0-9a-f]{64}$/.test(nextStateSha256 || "")) throw new Error("nextStateSha256 must be a lowercase SHA-256");
  const [p2, p3] = await Promise.all([phase2(), phase3()]);
  const asset = p2.prepareRefinedHtmlAssetRegistration(registration);
  const source = p3.prepareHtmlPrimaryVisualSelection(selection);
  const sourceProvenance = prepareRefinementProvenance(registration.runDir, provenance);
  const paths = refinementPaths(registration.runDir);
  const old = { asset_manifest_sha256: asset.old_manifest_sha256, slide_specifications_sha256: source.old_source_sha256, provenance_sha256: sourceProvenance.old_sha256, state_sha256: readVersionFileSha(paths.state) };
  return Object.freeze({ registration: { ...registration, bytes: Buffer.from(registration.bytes), metadata: structuredClone(registration.metadata) }, selection: structuredClone(selection), asset, source, provenance: sourceProvenance, old, next: Object.freeze({ asset_manifest_sha256: asset.next_manifest_sha256, slide_specifications_sha256: source.next_source_sha256, provenance_sha256: sourceProvenance.next_sha256, state_sha256: nextStateSha256 }) });
}

export async function prepareStyleReferencePromotion({ registration, provenance, nextStateSha256 }) {
  if (registration?.target !== "style-reference" || !/^[0-9a-f]{64}$/.test(nextStateSha256 || "")) throw new Error("style-reference registration and nextStateSha256 are required");
  const p2 = await phase2();
  const asset = p2.prepareRefinedHtmlAssetRegistration(registration);
  const sourceProvenance = prepareRefinementProvenance(registration.runDir, provenance);
  const paths = refinementPaths(registration.runDir);
  const old = { asset_manifest_sha256: asset.old_manifest_sha256, slide_specifications_sha256: readVersionFileSha(paths.slide_specifications), provenance_sha256: sourceProvenance.old_sha256, state_sha256: readVersionFileSha(paths.state) };
  return Object.freeze({ registration: { ...registration, bytes: Buffer.from(registration.bytes), metadata: structuredClone(registration.metadata) }, asset, provenance: sourceProvenance, old, next: Object.freeze({ asset_manifest_sha256: asset.next_manifest_sha256, slide_specifications_sha256: old.slide_specifications_sha256, provenance_sha256: sourceProvenance.next_sha256, state_sha256: nextStateSha256 }) });
}

export async function executePreparedVisualSlotPromotion({ prepared, journal, nextState, selection, stateUpdatedAt }) {
  if (!prepared || !journal || !nextState || !selection) throw new Error("prepared promotion, journal, nextState, and selection are required");
  if (canonicalJson(prepared.old) !== canonicalJson(journal.old) || canonicalJson(prepared.next) !== canonicalJson(journal.next)) throw new Error("CONFLICT: promotion journal does not bind the prepared transaction");
  const [p2, p3] = await Promise.all([phase2(), phase3()]);
  assertPromotionFencesClear(prepared.asset.run_dir);
  const preparedState = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt });
  if (preparedState.sha256 !== prepared.next.state_sha256) throw new Error("CONFLICT: next state does not match the prepared promotion hash");
  const journalWithRecovery = {
    ...journal,
    recovery: {
      schema: "pptmaker-image2-refinement-recovery-v1",
      registration: {
        asset_id: prepared.registration.assetId,
        target: prepared.registration.target,
        bytes_base64: Buffer.from(prepared.registration.bytes).toString("base64"),
        metadata: structuredClone(prepared.registration.metadata),
      },
      selection: { ...selection, runDir: undefined },
      provenance: structuredClone(prepared.provenance.value),
      next_state: preparedState.persist,
      state_updated_at: stateUpdatedAt,
    },
  };
  delete journalWithRecovery.recovery.selection.runDir;
  createPromotionJournal(prepared.asset.run_dir, journalWithRecovery);
  try {
    const asset = p2.commitPreparedRefinedHtmlAssetRegistration(prepared.asset);
    if (asset.measured_sha256 !== prepared.asset.evidence.measured_sha256) throw new Error("CONFLICT: registered asset differs from prepared promotion");
    updatePromotionJournal(prepared.asset.run_dir, { phase: "asset-committed" }, { expectedPhase: "prepared" });
    const bound = p3.bindHtmlPrimaryVisualSelection(selection);
    if (bound.source_sha256 !== prepared.next.slide_specifications_sha256) throw new Error("CONFLICT: selection binding differs from prepared promotion");
    updatePromotionJournal(prepared.asset.run_dir, { phase: "source-committed" }, { expectedPhase: "asset-committed" });
    const provenance = writeRefinementProvenance(prepared.asset.run_dir, prepared.provenance?.value, { expectedSha256: prepared.old.provenance_sha256 });
    if (provenance.sha256 !== prepared.next.provenance_sha256) throw new Error("CONFLICT: provenance differs from prepared promotion");
    updatePromotionJournal(prepared.asset.run_dir, { phase: "provenance-committed" }, { expectedPhase: "source-committed" });
    commitRefinementState(prepared.asset.run_dir, nextState, { expectedStateSha256: prepared.old.state_sha256, updatedAt: stateUpdatedAt });
    updatePromotionJournal(prepared.asset.run_dir, { phase: "state-committed" }, { expectedPhase: "provenance-committed" });
    return recoverPromotionJournal(prepared.asset.run_dir);
  } catch (error) {
    // Leave the exact journal in place.  Recovery can inspect the bound byte
    // pair and continue/fail closed without submitting another attempt.
    throw error;
  }
}

export async function executePreparedStyleReferencePromotion({ prepared, journal, nextState, stateUpdatedAt }) {
  if (!prepared || !journal || !nextState || canonicalJson(prepared.old) !== canonicalJson(journal.old) || canonicalJson(prepared.next) !== canonicalJson(journal.next)) throw new Error("CONFLICT: promotion journal does not bind the prepared transaction");
  const p2 = await phase2();
  assertPromotionFencesClear(prepared.asset.run_dir);
  const preparedState = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt });
  if (preparedState.sha256 !== prepared.next.state_sha256) throw new Error("CONFLICT: next state does not match the prepared promotion hash");
  const journalWithRecovery = {
    ...journal,
    recovery: {
      schema: "pptmaker-image2-refinement-recovery-v1",
      registration: {
        asset_id: prepared.registration.assetId,
        target: prepared.registration.target,
        bytes_base64: Buffer.from(prepared.registration.bytes).toString("base64"),
        metadata: structuredClone(prepared.registration.metadata),
      },
      selection: null,
      provenance: structuredClone(prepared.provenance.value),
      next_state: preparedState.persist,
      state_updated_at: stateUpdatedAt,
    },
  };
  createPromotionJournal(prepared.asset.run_dir, journalWithRecovery);
  try {
    p2.commitPreparedRefinedHtmlAssetRegistration(prepared.asset);
    updatePromotionJournal(prepared.asset.run_dir, { phase: "asset-committed" }, { expectedPhase: "prepared" });
    const provenance = writeRefinementProvenance(prepared.asset.run_dir, prepared.provenance?.value, { expectedSha256: prepared.old.provenance_sha256 });
    if (provenance.sha256 !== prepared.next.provenance_sha256) throw new Error("CONFLICT: provenance differs from prepared promotion");
    updatePromotionJournal(prepared.asset.run_dir, { phase: "provenance-committed" }, { expectedPhase: "asset-committed" });
    commitRefinementState(prepared.asset.run_dir, nextState, { expectedStateSha256: prepared.old.state_sha256, updatedAt: stateUpdatedAt });
    updatePromotionJournal(prepared.asset.run_dir, { phase: "state-committed" }, { expectedPhase: "provenance-committed" });
    return recoverPromotionJournal(prepared.asset.run_dir);
  } catch (error) { throw error; }
}

export {
  commitRefinementState,
  createPromotionJournal,
  readPromotionJournal,
  recoverPromotionJournal,
  refinementPaths,
  prepareRefinementProvenance,
  writeRefinementProvenance,
  createRefinementTransport,
  createFakeRefinementTransport,
  createModernRefinementTransport,
};

export const buildRefinementPlan = createRefinementPlan;
export const authorizeRefinementPlan = authorizeRefinement;
export const executeRefinementAttempt = generateRefinement;
export const reconcileAttempt = reconcileRefinementAttempt;
export const reviewCandidate = composeCandidateReview;
export const acceptCandidate = acceptRefinementCandidate;
export const keepHtml = useHtmlRefinement;
export const cleanup = cleanupRefinementEvidence;
