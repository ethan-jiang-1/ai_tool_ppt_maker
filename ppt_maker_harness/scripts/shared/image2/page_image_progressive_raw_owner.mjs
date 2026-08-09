import { basename } from "node:path";

import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import { PAGE_IMAGE_NATIVE_RAW_PNG } from "./page_image_media_contract.mjs";
import { validateBoundPageImageProviderRequests } from "./page_image_provider_request_binding.mjs";
import {
  PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA,
  createProgressiveAcceptedRawEvidence,
  createProgressiveRawBatch,
  createProgressiveRawBatchGrant,
  createProgressiveRawCompleteReview,
  createProgressiveRawItemAttempt,
  createProgressiveRawMaterializationProvenance,
  createProgressiveRawPilotDecision,
  createProgressiveRawPilotEvidence,
  createProgressiveRawScopeHead,
  createProgressiveRawWorkPlan,
  progressiveRawAttemptKey,
  progressiveRawIdempotencyKey,
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawAttemptTransition,
  validateProgressiveRawBatch,
  validateProgressiveRawBatchGrant,
  validateProgressiveRawCompleteReview,
  validateProgressiveRawItemAttempt,
  validateProgressiveRawMaterializationProvenance,
  validateProgressiveRawPilotDecision,
  validateProgressiveRawPilotEvidence,
  validateProgressiveRawScopeHead,
  validateProgressiveRawWorkPlan,
} from "./page_image_progressive_schema.mjs";
import {
  ProgressiveRawStoreError,
  findProgressiveRawCompleteReviewBySha,
  findProgressiveRawMaterializationByProvenance,
  publishProgressiveRawMaterialization,
  publishProgressiveRawStagedPlan,
  readProgressiveRawPlanDirectRecords,
  readProgressiveRawScopeHead,
  stageProgressiveRawPlanContainer,
  withProgressiveRawPlanLock,
  writeProgressiveAcceptedRawEvidence,
  writeProgressiveRawBatch,
  writeProgressiveRawBatchGrant,
  writeProgressiveRawCompleteReview,
  writeProgressiveRawItemAttempt,
  writeProgressiveRawPilotDecision,
  writeProgressiveRawPilotEvidence,
  writeProgressiveRawScopeHeadCas,
} from "./page_image_progressive_store.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;

export class ProgressiveRawOwnerError extends Error {
  constructor(code, message, { nextAction = null, details = null } = {}) {
    super(message);
    this.name = "ProgressiveRawOwnerError";
    this.code = code;
    if (nextAction) this.next_action = nextAction;
    if (details) this.details = details;
  }
}

function fail(code, message, options = undefined) {
  throw new ProgressiveRawOwnerError(code, message, options);
}

function checked(value, label, validator, options = undefined) {
  const result = validator(value, options);
  if (!result.ok) fail(result.code || "progressive_raw_invalid", result.message || `${label} is invalid`);
  return result;
}

function digest(value, label) {
  if (!SHA256_RE.test(value || "")) fail("progressive_raw_invalid_digest", `${label} must be a lowercase SHA-256`);
  return value;
}

function action(action_id, {
  kind = "guide",
  requires_human = false,
  plan_hash = null,
  batch_hash = null,
  attempt_sha256 = null,
  summary = null,
} = {}) {
  return Object.freeze({
    owner: "progressive-raw-owner",
    action_id,
    kind,
    requires_human,
    ...(plan_hash ? { plan_hash } : {}),
    ...(batch_hash ? { batch_hash } : {}),
    ...(attempt_sha256 ? { attempt_sha256 } : {}),
    ...(summary ? { summary } : {}),
  });
}

function binding(plan) {
  return {
    plan_sha256: plan.sha256 || checked(plan, "raw work plan", validateProgressiveRawWorkPlan).sha256,
    run_version: plan.run_version,
    source_receipt_sha256: plan.source_receipt_sha256,
    source_epoch: plan.source_epoch,
    workflow: plan.workflow,
    provider_profile_sha256: plan.provider_profile_sha256,
    effective_style_master_sha256: plan.effective_style_master_sha256,
    source_execution_sha256: plan.source_execution_sha256,
  };
}

function orderedItems(plan, ids) {
  const selected = new Set(ids);
  return plan.items.filter((item) => selected.has(item.slide_id));
}

function asObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("progressive_raw_invalid", `${label} must be an object`);
  return value;
}

function rawCoverage(plan, materializations, ids = plan.ordered_slide_ids) {
  const missing = missingRawCoverage(materializations, ids);
  if (missing.length > 0) fail("progressive_raw_coverage_missing", "current materialization is missing for the selected coverage");
  const coverage = [];
  for (const slideId of ids) {
    const materialization = materializations.get(slideId);
    const item = plan.items.find((entry) => entry.slide_id === slideId);
    coverage.push({
      slide_id: slideId,
      raw_contract_sha256: item.raw_contract_sha256,
      raw_sha256: materialization.provenance.record.raw_sha256,
      materialization_provenance_sha256: materialization.provenance.sha256,
    });
  }
  return coverage;
}

function missingRawCoverage(materializations, ids) {
  return ids.filter((slideId) => !materializations.has(slideId));
}

function progressProjection(plan, materializations, attemptState) {
  const items = plan.items.map((item) => {
    const materialization = materializations.get(item.slide_id) || null;
    const attempt = attemptState.current_by_tuple.get(`${item.slide_id}:${item.raw_contract_sha256}`) || null;
    const state = materialization
      ? "materialized"
      : attempt?.record.status === "known_failure"
        ? "known_failure"
        : attempt?.record.status === "unknown"
          ? "unknown"
          : attempt?.record.status === "submitted"
            ? "submitted"
            : attempt?.record.status === "claimed"
              ? "claimed"
              : "unsubmitted";
    return Object.freeze({
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      state,
      ...(attempt ? { attempt_sha256: attempt.sha256 } : {}),
      ...(materialization ? { materialization_provenance_sha256: materialization.provenance.sha256 } : {}),
    });
  });
  const count = (state) => items.filter((item) => item.state === state).length;
  return Object.freeze({
    total: items.length,
    materialized: count("materialized"),
    unsubmitted: count("unsubmitted"),
    claimed: count("claimed"),
    submitted: count("submitted"),
    known_failure: count("known_failure"),
    unknown: count("unknown"),
    paid_debt: Object.freeze(items.filter((item) => !["materialized", "claimed", "submitted"].includes(item.state)).map((item) => item.slide_id)),
    items: Object.freeze(items),
  });
}

function directRecordMap(records, label) {
  const map = new Map();
  for (const entry of records) {
    if (map.has(entry.sha256)) fail("progressive_raw_record_conflict", `${label} has a duplicate canonical record`);
    map.set(entry.sha256, entry);
  }
  return map;
}

function validateAttemptState(plan, batches, grants, attempts) {
  const batchBySha = directRecordMap(batches, "batch records");
  const grantByBatch = new Map();
  for (const grant of grants) {
    const batch = batchBySha.get(grant.record.batch_sha256);
    if (!batch) fail("progressive_raw_cross_bound", "batch grant references an unavailable batch");
    checked(grant.record, "batch grant", validateProgressiveRawBatchGrant, { plan, batch: batch.record });
    if (grantByBatch.has(grant.record.batch_sha256)) fail("progressive_raw_record_conflict", "one batch may have only one immutable grant");
    grantByBatch.set(grant.record.batch_sha256, grant);
  }

  const bySha = directRecordMap(attempts, "attempt records");
  const byKey = new Map();
  for (const attempt of attempts) {
    const batch = batchBySha.get(attempt.record.batch_sha256);
    const grant = grantByBatch.get(attempt.record.batch_sha256);
    if (!batch || !grant || grant.sha256 !== attempt.record.grant_sha256) {
      fail("progressive_raw_cross_bound", "attempt references an unavailable or mismatched batch grant");
    }
    checked(attempt.record, "item attempt", validateProgressiveRawItemAttempt, { plan, batch: batch.record, grant: grant.record });
    const entries = byKey.get(attempt.record.attempt_key_sha256) || [];
    entries.push(attempt);
    byKey.set(attempt.record.attempt_key_sha256, entries);
  }

  const currentByKey = new Map();
  const currentByTuple = new Map();
  for (const [key, entries] of byKey.entries()) {
    const roots = entries.filter((entry) => entry.record.previous_attempt_sha256 === null);
    if (roots.length !== 1) fail("progressive_raw_attempt_chain_invalid", "each attempt key must have one claimed root");
    const children = new Map();
    for (const entry of entries) {
      const previous = entry.record.previous_attempt_sha256;
      if (previous === null) continue;
      const prior = bySha.get(previous);
      if (!prior || prior.record.attempt_key_sha256 !== key) {
        fail("progressive_raw_attempt_chain_invalid", "attempt transition references an unavailable or foreign predecessor");
      }
      const siblings = children.get(previous) || [];
      siblings.push(entry);
      children.set(previous, siblings);
      const transition = validateProgressiveRawAttemptTransition(prior.record, entry.record);
      if (!transition.ok) fail(transition.code, transition.message);
    }
    const effectiveChildren = new Map();
    const ignoredTerminalSiblings = new Set();
    for (const [parentSha256, siblings] of children.entries()) {
      if (siblings.length === 1) {
        effectiveChildren.set(parentSha256, siblings);
        continue;
      }
      const parent = bySha.get(parentSha256);
      const knownFailure = siblings.find((entry) => entry.record.status === "known_failure") || null;
      const succeeded = siblings.find((entry) => entry.record.status === "succeeded") || null;
      const unknown = siblings.find((entry) => entry.record.status === "unknown") || null;
      const childless = siblings.every((entry) => (children.get(entry.sha256) || []).length === 0);
      const effectiveTerminal = knownFailure || succeeded;
      if (siblings.length !== 2 || parent?.record.status !== "submitted" || !effectiveTerminal || !unknown || !childless) {
        fail("progressive_raw_attempt_chain_invalid", "attempt transitions cannot branch");
      }
      effectiveChildren.set(parentSha256, [effectiveTerminal]);
      ignoredTerminalSiblings.add(unknown.sha256);
    }

    let cursor = roots[0];
    let current = null;
    const seen = new Set();
    while (cursor) {
      if (seen.has(cursor.sha256)) fail("progressive_raw_attempt_chain_invalid", "attempt transition cannot cycle");
      seen.add(cursor.sha256);
      current = cursor;
      const next = effectiveChildren.get(cursor.sha256) || [];
      cursor = next[0] || null;
    }
    if (seen.size + ignoredTerminalSiblings.size !== entries.length) {
      fail("progressive_raw_attempt_chain_invalid", "attempt chain has unreachable records");
    }
    currentByKey.set(key, current);
    const tuple = `${current.record.slide_id}:${current.record.raw_contract_sha256}`;
    const existing = currentByTuple.get(tuple);
    const currentGeneration = batchBySha.get(current.record.batch_sha256).record.batch_generation;
    const existingGeneration = existing
      ? batchBySha.get(existing.record.batch_sha256).record.batch_generation
      : null;
    if (existingGeneration === null || currentGeneration > existingGeneration) {
      currentByTuple.set(tuple, current);
    }
  }

  const live = [...currentByKey.values()].filter((entry) => ["claimed", "submitted"].includes(entry.record.status));
  if (live.length > 1) fail("progressive_raw_serialization_invalid", "only one claimed or submitted progressive raw item may be live at once");
  for (const [batchSha, grant] of grantByBatch.entries()) {
    const consumed = [...currentByKey.values()]
      .filter((entry) => entry.record.batch_sha256 === batchSha && entry.record.status !== "claimed").length;
    if (consumed > grant.record.maximum_submissions) {
      fail("progressive_raw_grant_consumption_invalid", "submitted attempts exceed the grant maximum submissions");
    }
  }
  return Object.freeze({ batch_by_sha: batchBySha, grant_by_batch: grantByBatch, by_sha: bySha, current_by_key: currentByKey, current_by_tuple: currentByTuple, live: Object.freeze(live) });
}

function validateBatchLineage(batches, attemptState) {
  const sorted = [...batches].sort((left, right) => left.record.batch_generation - right.record.batch_generation);
  const byGeneration = new Map();
  const children = new Map();
  for (const batch of sorted) {
    if (byGeneration.has(batch.record.batch_generation)) fail("progressive_raw_batch_lineage_invalid", "batch generations cannot conflict");
    byGeneration.set(batch.record.batch_generation, batch);
    if (batch.record.batch_generation === 1) {
      if (batch.record.previous_batch_sha256 !== null) fail("progressive_raw_batch_lineage_invalid", "first batch must not name a predecessor");
      continue;
    }
    const previous = attemptState.batch_by_sha.get(batch.record.previous_batch_sha256);
    if (!previous || previous.record.batch_generation !== batch.record.batch_generation - 1) {
      fail("progressive_raw_batch_lineage_invalid", "successor batch must name its immediately preceding generation");
    }
    const descendants = children.get(previous.sha256) || [];
    descendants.push(batch);
    children.set(previous.sha256, descendants);
    if (descendants.length > 1) fail("progressive_raw_batch_lineage_invalid", "batch lineage cannot have a conflicting live branch");
    const priorState = batchLifecycle(previous, attemptState, new Map());
    if (!priorState.terminal) {
      fail("progressive_raw_batch_lineage_invalid", "a successor batch requires a terminal predecessor");
    }
  }
  return Object.freeze(sorted);
}

function batchLifecycle(batch, attemptState, materializations) {
  const grant = attemptState.grant_by_batch.get(batch.sha256) || null;
  const items = batch.record.paid_submission_slide_ids.map((slideId) => {
    const item = batch.record.items.find((entry) => entry.slide_id === slideId);
    const key = progressiveRawAttemptKey({
      plan_sha256: batch.record.plan_sha256,
      batch_sha256: batch.sha256,
      slide_id: slideId,
      raw_contract_sha256: item.raw_contract_sha256,
    });
    const attempt = attemptState.current_by_key.get(key) || null;
    const materialized = materializations.get(slideId) || null;
    const state = materialized
      ? "succeeded"
      : attempt?.record.status || "eligible";
    return Object.freeze({ slide_id: slideId, raw_contract_sha256: item.raw_contract_sha256, state, attempt });
  });
  const terminal = items.every((item) => ["succeeded", "known_failure", "unknown"].includes(item.state));
  const unresolved = items.find((item) => item.state === "submitted") || null;
  const claim = items.find((item) => item.state === "claimed") || null;
  const eligible = items.find((item) => item.state === "eligible") || null;
  return Object.freeze({ batch, grant, items: Object.freeze(items), terminal, unresolved, claim, eligible });
}

function matchesReusableMaterializationBinding(plan, source) {
  return source.run_version === plan.run_version &&
    source.source_epoch === plan.source_epoch &&
    source.workflow === plan.workflow &&
    source.provider_profile_sha256 === plan.provider_profile_sha256 &&
    source.effective_style_master_sha256 === plan.effective_style_master_sha256;
}

function validateMaterializations(plan, records, attemptState, { resolveExternalProvenance = null } = {}) {
  const bySha = new Map();
  for (const entry of records) {
    if (bySha.has(entry.provenance.sha256)) {
      fail("progressive_raw_materialization_invalid", "materialization provenance digest is duplicated");
    }
    bySha.set(entry.provenance.sha256, entry);
  }

  const current = new Map();
  const orphanedByAttemptKey = new Map();
  const addCurrent = (entry) => {
    const slideId = entry.provenance.record.slide_id;
    if (current.has(slideId)) {
      fail("progressive_raw_materialization_ambiguous", `multiple immutable current materializations exist for ${slideId}`);
    }
    current.set(slideId, entry);
  };

  const reuse = [];
  for (const entry of records) {
    const provenance = entry.provenance;
    if (provenance.record.kind === "reuse") {
      reuse.push(entry);
      continue;
    }
    const batch = attemptState.batch_by_sha.get(provenance.record.batch_sha256);
    const grant = attemptState.grant_by_batch.get(provenance.record.batch_sha256);
    const attempt = attemptState.current_by_key.get(provenance.record.attempt_key_sha256);
    if (!batch || !grant || !attempt) {
      fail("progressive_raw_materialization_invalid", "provider materialization has no matching direct attempt chain");
    }
    checked(provenance.record, "provider materialization", validateProgressiveRawMaterializationProvenance, {
      plan,
      batch: batch.record,
      grant: grant.record,
    });
    if (attempt.record.status === "succeeded") {
      checked(provenance.record, "provider materialization", validateProgressiveRawMaterializationProvenance, {
        plan,
        batch: batch.record,
        grant: grant.record,
        attempt: attempt.record,
      });
      addCurrent(entry);
      continue;
    }
    if (attempt.record.status !== "submitted") {
      fail("progressive_raw_materialization_invalid", "an unlinked provider materialization may only await its exact submitted attempt");
    }
    if (orphanedByAttemptKey.has(attempt.record.attempt_key_sha256)) {
      fail("progressive_raw_materialization_ambiguous", "a submitted attempt may have only one persisted materialization bundle");
    }
    orphanedByAttemptKey.set(attempt.record.attempt_key_sha256, entry);
  }

  // Reuse can only build on authoritative records, never an orphaned bundle.
  const unresolved = new Map(reuse.map((entry) => [entry.provenance.sha256, entry]));
  while (unresolved.size > 0) {
    let advanced = false;
    for (const [provenanceSha256, entry] of unresolved) {
      const provenance = entry.provenance.record;
      const localSource = bySha.get(provenance.reused_from_provenance_sha256) || null;
      const source = localSource || resolveExternalProvenance?.(provenance.reused_from_provenance_sha256) || null;
      const sourceIsCurrent = localSource
        ? [...current.values()].some((candidate) => candidate.provenance.sha256 === localSource.provenance.sha256)
        : Boolean(source);
      if (!sourceIsCurrent) continue;
      if (!matchesReusableMaterializationBinding(plan, source.provenance.record) ||
        source.provenance.record.slide_id !== provenance.slide_id ||
        source.provenance.record.raw_sha256 !== provenance.raw_sha256 ||
        source.provenance.record.raw_contract_sha256 !== provenance.raw_contract_sha256) {
        fail("progressive_raw_materialization_invalid", "reuse materialization must bind its exact current immutable provenance source");
      }
      addCurrent(entry);
      unresolved.delete(provenanceSha256);
      advanced = true;
    }
    if (!advanced) {
      fail("progressive_raw_materialization_invalid", "reuse materialization must bind an authoritative compatible immutable provenance source");
    }
  }
  return Object.freeze({
    current,
    orphaned_by_attempt_key: orphanedByAttemptKey,
  });
}

function validatePilotRecords(plan, direct, attemptState, materializations) {
  const byBatch = new Map();
  for (const evidence of direct.pilot_evidence) {
    const batch = attemptState.batch_by_sha.get(evidence.record.batch_sha256);
    if (!batch) fail("progressive_raw_cross_bound", "Pilot evidence references an unavailable batch");
    checked(evidence.record, "Pilot evidence", validateProgressiveRawPilotEvidence, { plan, batch: batch.record });
    const expected = rawCoverage(plan, materializations, batch.record.review_sample_slide_ids);
    if (canonicalJsonSha256(expected) !== canonicalJsonSha256(evidence.record.items)) {
      fail("progressive_raw_pilot_evidence_stale", "Pilot evidence coverage does not bind current materializations");
    }
    if (byBatch.has(batch.sha256)) fail("progressive_raw_record_conflict", "one batch may publish only one Pilot evidence record");
    byBatch.set(batch.sha256, evidence);
  }
  const decisions = new Map();
  for (const decision of direct.pilot_decisions) {
    const batch = attemptState.batch_by_sha.get(decision.record.batch_sha256);
    const evidence = byBatch.get(decision.record.batch_sha256);
    if (!batch || !evidence) fail("progressive_raw_cross_bound", "Pilot decision requires exact published Pilot evidence");
    checked(decision.record, "Pilot decision", validateProgressiveRawPilotDecision, { plan, batch: batch.record, evidence: evidence.record });
    if (decisions.has(batch.sha256)) fail("progressive_raw_record_conflict", "one Pilot batch may have only one decision");
    decisions.set(batch.sha256, decision);
  }
  return Object.freeze({ evidence_by_batch: byBatch, decision_by_batch: decisions });
}

function sameRawTupleCoverage(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
    left.every((item, index) => item.slide_id === right[index]?.slide_id &&
      item.raw_contract_sha256 === right[index]?.raw_contract_sha256 &&
      item.raw_sha256 === right[index]?.raw_sha256);
}

function validateRetainedCompleteReview(plan, review, expected, resolveRetainedCompleteReview) {
  const retainedSha = review.record.retained_from_complete_raw_review_sha256 ?? null;
  if (!retainedSha) return;
  if (typeof resolveRetainedCompleteReview !== "function") {
    fail("progressive_raw_complete_review_invalid", "retained complete review requires a direct-record resolver");
  }
  const retained = resolveRetainedCompleteReview(retainedSha);
  if (!retained || !matchesReusableMaterializationBinding(plan, retained.plan) ||
    retained.review.record.decision !== "proceed" ||
    retained.review.record.workflow_evidence_sha256 !== review.record.workflow_evidence_sha256 ||
    retained.review.record.projection_sha256 !== review.record.projection_sha256 ||
    !sameRawTupleCoverage(retained.review.record.items, expected)) {
    fail("progressive_raw_complete_review_stale", "retained complete review does not bind the current provider-free reuse coverage");
  }
}

function validateCompleteRecords(plan, direct, materializations, { resolveRetainedCompleteReview = null } = {}) {
  const reviews = new Map();
  for (const review of direct.complete_reviews) {
    checked(review.record, "complete raw review", validateProgressiveRawCompleteReview, { plan });
    const expected = rawCoverage(plan, materializations);
    if (canonicalJsonSha256(expected) !== canonicalJsonSha256(review.record.items)) {
      fail("progressive_raw_complete_review_stale", "complete review coverage does not bind every current materialization");
    }
    validateRetainedCompleteReview(plan, review, expected, resolveRetainedCompleteReview);
    if (reviews.has(review.sha256)) fail("progressive_raw_record_conflict", "complete raw review digest is duplicated");
    reviews.set(review.sha256, review);
  }
  const byPrepared = new Map();
  for (const review of reviews.values()) {
    if (review.record.decision === null) continue;
    const prepared = reviews.get(review.record.previous_review_sha256);
    if (!prepared || prepared.record.decision !== null) {
      fail("progressive_raw_complete_review_invalid", "a complete review decision must reference a prepared review");
    }
    if (byPrepared.has(prepared.sha256)) fail("progressive_raw_complete_review_invalid", "one prepared review cannot receive competing decisions");
    byPrepared.set(prepared.sha256, review);
  }
  const accepted = [];
  for (const evidence of direct.accepted_evidence) {
    const review = reviews.get(evidence.record.complete_raw_review_sha256);
    if (!review) fail("progressive_raw_cross_bound", "accepted raw evidence requires a direct complete review record");
    checked(evidence.record, "accepted raw evidence", validateProgressiveAcceptedRawEvidence, { plan, completeReview: review.record });
    accepted.push(evidence);
  }
  if (accepted.length > 1) fail("progressive_raw_record_conflict", "one full raw plan may have only one accepted raw evidence record");
  return Object.freeze({ reviews, decided_by_prepared: byPrepared, accepted: accepted[0] || null });
}

function snapshotFromDirectRecords(direct, {
  head = null,
  resolveExternalProvenance = null,
  resolveRetainedCompleteReview = null,
} = {}) {
  const plan = { ...direct.plan.record };
  Object.defineProperty(plan, "sha256", { value: direct.plan.sha256, enumerable: false, configurable: false, writable: false });
  Object.freeze(plan);
  const attemptState = validateAttemptState(plan, direct.batches, direct.grants, direct.attempts);
  const batchLineage = validateBatchLineage(direct.batches, attemptState);
  const materializationState = validateMaterializations(plan, direct.materializations, attemptState, { resolveExternalProvenance });
  const materializations = materializationState.current;
  const pilot = validatePilotRecords(plan, direct, attemptState, materializations);
  const complete = validateCompleteRecords(plan, direct, materializations, { resolveRetainedCompleteReview });
  const progress = progressProjection(plan, materializations, attemptState);
  const batchStates = new Map(batchLineage.map((batch) => [batch.sha256, batchLifecycle(batch, attemptState, materializations)]));
  return Object.freeze({
    head,
    plan,
    direct,
    attempt_state: attemptState,
    batch_lineage: batchLineage,
    batch_states: batchStates,
    materializations,
    orphaned_materializations: materializationState.orphaned_by_attempt_key,
    pilot,
    complete,
    progress,
  });
}

function createProgressiveRawSnapshotResolver(runDir) {
  const snapshots = new Map();
  const resolvingPlans = new Set();
  const resolvedProvenance = new Map();
  const resolvedReviews = new Map();

  const load = (planHash, { head = null } = {}) => {
    let snapshot = snapshots.get(planHash) || null;
    if (!snapshot) {
      if (resolvingPlans.has(planHash)) {
        fail("progressive_raw_materialization_invalid", "reuse provenance cannot form a cross-plan cycle");
      }
      resolvingPlans.add(planHash);
      try {
        const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash });
        snapshot = snapshotFromDirectRecords(direct, {
          resolveExternalProvenance,
          resolveRetainedCompleteReview,
        });
        snapshots.set(planHash, snapshot);
      } finally {
        resolvingPlans.delete(planHash);
      }
    }
    return head === null ? snapshot : Object.freeze({ ...snapshot, head });
  };

  const resolveExternalProvenance = (provenanceSha256) => {
    const cached = resolvedProvenance.get(provenanceSha256) || null;
    if (cached) return cached;
    const found = findProgressiveRawMaterializationByProvenance(runDir, { provenance_sha256: provenanceSha256 });
    if (!found) return null;
    const sourceSnapshot = load(found.plan_sha256);
    const source = [...sourceSnapshot.materializations.values()]
      .find((entry) => entry.provenance.sha256 === provenanceSha256) || null;
    if (!source) {
      fail("progressive_raw_materialization_invalid", "reuse provenance source is not an authoritative current materialization");
    }
    resolvedProvenance.set(provenanceSha256, source);
    return source;
  };

  const resolveRetainedCompleteReview = (completeReviewSha256) => {
    const cached = resolvedReviews.get(completeReviewSha256) || null;
    if (cached) return cached;
    const found = findProgressiveRawCompleteReviewBySha(runDir, {
      complete_raw_review_sha256: completeReviewSha256,
    });
    if (!found) return null;
    const sourceSnapshot = load(found.plan_sha256);
    const review = sourceSnapshot.complete.reviews.get(completeReviewSha256) || null;
    if (!review || sourceSnapshot.complete.accepted?.record.complete_raw_review_sha256 !== completeReviewSha256) {
      fail("progressive_raw_complete_review_invalid", "retained complete review is not current accepted source evidence");
    }
    const resolved = Object.freeze({ plan: sourceSnapshot.plan, review });
    resolvedReviews.set(completeReviewSha256, resolved);
    return resolved;
  };

  return Object.freeze({ load });
}

function loadPlanByHash(runDir, planHash) {
  digest(planHash, "plan_hash");
  return createProgressiveRawSnapshotResolver(runDir).load(planHash);
}

function loadPlanByHead(runDir, workflow) {
  const rawHead = readProgressiveRawScopeHead(runDir, { workflow });
  if (!rawHead) return null;
  const resolver = createProgressiveRawSnapshotResolver(runDir);
  const snapshot = resolver.load(rawHead.record.plan_sha256, { head: rawHead });
  checked(rawHead.record, "scope head", validateProgressiveRawScopeHead, { plan: snapshot.plan });
  return snapshot;
}

function requireCurrentPlan(snapshot, planHash, expectedPlan = null) {
  if (!snapshot) fail("progressive_raw_plan_missing", "a current progressive raw plan is required", { nextAction: action("plan_progressive_raw_work", { kind: "guide" }) });
  digest(planHash, "plan_hash");
  if (snapshot.plan.sha256 !== planHash) fail("progressive_raw_plan_stale", "the supplied full plan hash is not the current scope head", { nextAction: action("rebuild_progressive_raw_work", { plan_hash: snapshot.plan.sha256 }) });
  if (expectedPlan) {
    const expected = checked(expectedPlan, "expected raw plan", validateProgressiveRawWorkPlan);
    if (expected.sha256 !== snapshot.plan.sha256) {
      fail("progressive_raw_plan_stale", "current source, workflow, profile, or raw contracts no longer bind the stored progressive plan", {
        nextAction: unresolvedAction(snapshot) || action("rebuild_progressive_raw_work", { plan_hash: snapshot.plan.sha256 }),
      });
    }
  }
  return snapshot;
}

/**
 * Current lifecycle mutations must diagnose the supplied plan against the
 * scope head before using it as a filesystem lock target. Historical
 * reconciliation is intentionally separate because it locks an exact retained
 * plan after its own scope-binding validation.
 */
async function withCurrentProgressiveRawPlanLock(runDir, {
  workflow,
  plan_hash,
  expected_plan = null,
  action: ownerAction,
} = {}) {
  if (typeof ownerAction !== "function") fail("progressive_raw_invalid", "current progressive raw mutation requires an owner action");
  const current = requireCurrentPlan(loadPlanByHead(runDir, workflow), plan_hash, expected_plan);
  return withProgressiveRawPlanLock(runDir, {
    plan_sha256: current.plan.sha256,
    action: async () => ownerAction(requireCurrentPlan(loadPlanByHead(runDir, workflow), plan_hash, expected_plan)),
  });
}

function unresolvedAction(snapshot) {
  const submitted = snapshot?.attempt_state?.live?.find((entry) => entry.record.status === "submitted");
  return submitted
    ? action("reconcile_progressive_raw_attempt", {
      kind: "repair",
      plan_hash: submitted.record.plan_sha256,
      attempt_sha256: submitted.sha256,
      summary: "A submitted provider attempt has no terminal outcome.",
    })
    : null;
}

function activeBatch(snapshot) {
  const nonterminal = [...snapshot.batch_states.values()].filter((state) => !state.terminal);
  if (nonterminal.length > 1) fail("progressive_raw_batch_lineage_invalid", "more than one nonterminal batch is live");
  return nonterminal[0] || null;
}

function latestBatch(snapshot) {
  return snapshot.batch_lineage.length ? snapshot.batch_lineage.at(-1) : null;
}

function currentCompleteReview(snapshot) {
  const candidates = [...snapshot.complete.reviews.values()].filter((review) =>
    review.record.decision === null && !snapshot.complete.decided_by_prepared.has(review.sha256));
  if (candidates.length > 1) {
    fail("progressive_raw_complete_review_invalid", "more than one complete raw review awaits a decision");
  }
  return candidates[0] || null;
}

function completeReviewAction(snapshot) {
  if (currentCompleteReview(snapshot)) {
    return action("accept_progressive_raw_review", {
      kind: "confirm",
      requires_human: true,
      plan_hash: snapshot.plan.sha256,
      summary: "Review the complete current full-plan raw projection.",
    });
  }
  const repair = [...snapshot.complete.reviews.values()].find((review) => ["repair", "redirect"].includes(review.record.decision));
  if (repair) return action("rebuild_progressive_raw_work", { kind: "repair", plan_hash: snapshot.plan.sha256 });
  return action("prepare_progressive_raw_review", { plan_hash: snapshot.plan.sha256, summary: "Prepare complete full-plan raw review evidence." });
}

function nextAction(snapshot, { expectedPlan = null } = {}) {
  if (!snapshot) return action("plan_progressive_raw_work", { summary: "Compile and publish one provider-free full raw plan." });
  const unresolved = unresolvedAction(snapshot);
  if (unresolved) return unresolved;
  if (expectedPlan) {
    const expected = checked(expectedPlan, "expected raw plan", validateProgressiveRawWorkPlan);
    if (expected.sha256 !== snapshot.plan.sha256) {
      return action("rebuild_progressive_raw_work", { kind: "repair", plan_hash: snapshot.plan.sha256, summary: "Current source or generation facts drifted from the scope head." });
    }
  }
  if (snapshot.complete.accepted) {
    return action("publish_target_final_manifest", { plan_hash: snapshot.plan.sha256, summary: "Current accepted raw evidence is ready for selected-workflow finalization." });
  }
  const live = activeBatch(snapshot);
  if (live) {
    if (!live.grant) {
      return action("authorize_progressive_raw_batch", { kind: "confirm", requires_human: true, plan_hash: snapshot.plan.sha256, batch_hash: live.batch.sha256, summary: "Confirm the exact disclosed provider cost for this batch." });
    }
    if (live.unresolved) return action("reconcile_progressive_raw_attempt", { kind: "repair", plan_hash: snapshot.plan.sha256, attempt_sha256: live.unresolved.attempt.sha256 });
    if (live.claim || live.eligible) {
      return action("generate_progressive_raw_item", { plan_hash: snapshot.plan.sha256, batch_hash: live.batch.sha256, summary: "Submit at most one exact owner-eligible item." });
    }
  }
  const latest = latestBatch(snapshot);
  if (latest) {
    const latestState = snapshot.batch_states.get(latest.sha256);
    if (latestState?.terminal && latest.record.is_partial_pilot) {
      const coverageMissing = missingRawCoverage(snapshot.materializations, latest.record.review_sample_slide_ids);
      if (coverageMissing.length > 0) {
        if (snapshot.progress.paid_debt.length > 0) {
          return action("plan_progressive_pilot", {
            kind: "confirm",
            requires_human: true,
            plan_hash: snapshot.plan.sha256,
            summary: "A terminal Pilot lacks current review coverage; choose the exact successor Pilot scope.",
          });
        }
        return action("rebuild_progressive_raw_work", {
          kind: "repair",
          plan_hash: snapshot.plan.sha256,
          summary: "A terminal Pilot lacks current review coverage without recoverable paid debt.",
        });
      }
      const evidence = snapshot.pilot.evidence_by_batch.get(latest.sha256);
      const decision = snapshot.pilot.decision_by_batch.get(latest.sha256);
      if (!evidence) return action("prepare_progressive_pilot_review", { plan_hash: snapshot.plan.sha256, batch_hash: latest.sha256 });
      if (!decision) return action("accept_progressive_pilot", { kind: "confirm", requires_human: true, plan_hash: snapshot.plan.sha256, batch_hash: latest.sha256 });
      if (decision.record.decision === "proceed") {
        if (snapshot.progress.paid_debt.length > 0) return action("plan_progressive_expansion", { plan_hash: snapshot.plan.sha256, batch_hash: latest.sha256, summary: "Derive the only remaining paid Expansion scope." });
        return completeReviewAction(snapshot);
      }
      return action("rebuild_progressive_raw_work", { kind: "repair", plan_hash: snapshot.plan.sha256 });
    }
    if (latestState?.terminal && snapshot.progress.paid_debt.length > 0) {
      return action("plan_progressive_pilot", { kind: "confirm", requires_human: true, plan_hash: snapshot.plan.sha256, summary: "A terminal predecessor leaves paid debt requiring a newly disclosed successor scope." });
    }
  }
  if (snapshot.progress.paid_debt.length === 0) return completeReviewAction(snapshot);
  return action("plan_progressive_pilot", { kind: "confirm", requires_human: true, plan_hash: snapshot.plan.sha256, summary: "Choose exact formal IDs for the representative Pilot scope." });
}

function currentDisplay(plan, displayBySlide = {}) {
  const display = asObject(displayBySlide, "display_by_slide");
  return plan.ordered_slide_ids.map((slideId, index) => {
    const value = display[slideId] || {};
    return Object.freeze({ slide_id: slideId, position: index + 1, title: typeof value.title === "string" ? value.title : "" });
  });
}

function projectBatch(batch, plan, displayBySlide) {
  const display = new Map(currentDisplay(plan, displayBySlide).map((item) => [item.slide_id, item]));
  return Object.freeze({
    batch_hash: batch.sha256,
    kind: batch.kind,
    is_partial_pilot: batch.is_partial_pilot,
    batch_generation: batch.batch_generation,
    previous_batch_sha256: batch.previous_batch_sha256,
    ordered_slide_ids: Object.freeze([...batch.ordered_slide_ids]),
    review_sample_slide_ids: Object.freeze([...batch.review_sample_slide_ids]),
    paid_submission_slide_ids: Object.freeze([...batch.paid_submission_slide_ids]),
    maximum_submissions: batch.maximum_submissions,
    display: Object.freeze(batch.ordered_slide_ids.map((slideId) => display.get(slideId))),
  });
}

function validatePilotScope(snapshot, requestedSlideIds) {
  if (!Array.isArray(requestedSlideIds) || requestedSlideIds.length === 0 || new Set(requestedSlideIds).size !== requestedSlideIds.length) {
    fail("progressive_raw_pilot_scope_invalid", "Pilot requires one or more unique exact formal slide IDs");
  }
  const known = new Set(snapshot.plan.ordered_slide_ids);
  if (requestedSlideIds.some((id) => !known.has(id))) fail("progressive_raw_pilot_scope_invalid", "Pilot scope contains an unknown or stale formal slide ID");
  const ordered = snapshot.plan.ordered_slide_ids.filter((id) => requestedSlideIds.includes(id));
  const debt = snapshot.progress.paid_debt;
  if (debt.length === 0) fail("progressive_raw_complete_review_required", "zero paid debt skips Pilot and routes directly to complete raw review");
  if (debt.length <= 5) {
    if (canonicalJsonSha256(ordered) !== canonicalJsonSha256(debt)) {
      fail("progressive_raw_small_debt_scope_invalid", "one-through-five-item paid debt requires the exact complete debt set as its only paid Pilot scope");
    }
    return Object.freeze({ ordered, paid: debt, partial: false });
  }
  if (ordered.length === snapshot.plan.ordered_slide_ids.length) {
    fail("progressive_raw_pilot_scope_invalid", "a partial Pilot cannot infer or select the entire full-plan scope");
  }
  const paid = ordered.filter((id) => debt.includes(id));
  if (paid.length === 0) fail("progressive_raw_pilot_scope_invalid", "a partial Pilot must include at least one current paid-debt formal ID");
  return Object.freeze({ ordered, paid, partial: paid.length < debt.length });
}

function batchRecord(snapshot, { kind, ordered, paid, partial = false }) {
  const predecessor = latestBatch(snapshot);
  const generation = predecessor ? predecessor.record.batch_generation + 1 : 1;
  if (predecessor && !snapshot.batch_states.get(predecessor.sha256)?.terminal) {
    fail("progressive_raw_batch_predecessor_live", "a successor scope requires a terminal predecessor without a live claim or submitted outcome");
  }
  return createProgressiveRawBatch({
    ...binding(snapshot.plan),
    kind,
    batch_generation: generation,
    previous_batch_sha256: predecessor?.sha256 || null,
    ordered_slide_ids: ordered,
    items: orderedItems(snapshot.plan, ordered),
    review_sample_slide_ids: ordered,
    paid_submission_slide_ids: paid,
    maximum_submissions: paid.length,
    is_partial_pilot: partial,
  }, { plan: snapshot.plan });
}

function findExactOpenBatch(snapshot, { kind, ordered, paid }) {
  return snapshot.batch_lineage.find((entry) => {
    const state = snapshot.batch_states.get(entry.sha256);
    return entry.record.kind === kind && !state.terminal &&
      canonicalJsonSha256(entry.record.ordered_slide_ids) === canonicalJsonSha256(ordered) &&
      canonicalJsonSha256(entry.record.paid_submission_slide_ids) === canonicalJsonSha256(paid);
  }) || null;
}

function deriveCurrentProviderFreeReuse(plan, sourceSnapshot) {
  if (!sourceSnapshot?.complete?.accepted ||
    sourceSnapshot.plan.run_version !== plan.run_version ||
    sourceSnapshot.plan.source_epoch !== plan.source_epoch ||
    sourceSnapshot.plan.workflow !== plan.workflow ||
    sourceSnapshot.plan.provider_profile_sha256 !== plan.provider_profile_sha256 ||
    sourceSnapshot.plan.effective_style_master_sha256 !== plan.effective_style_master_sha256) {
    return Object.freeze([]);
  }
  const reusable = [];
  for (const item of plan.items) {
    const source = sourceSnapshot.materializations.get(item.slide_id) || null;
    if (!source || !matchesReusableMaterializationBinding(plan, source.provenance.record) ||
      source.provenance.record.raw_contract_sha256 !== item.raw_contract_sha256) {
      continue;
    }
    reusable.push(Object.freeze({
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      raw_sha256: source.provenance.record.raw_sha256,
      source_provenance_sha256: source.provenance.sha256,
      bytes: Buffer.from(source.bytes),
    }));
  }
  return Object.freeze(reusable);
}

function retainCurrentCompleteReviewForProviderFreeReuse(runDir, plan, sourceSnapshot) {
  const sourceEvidence = sourceSnapshot?.complete?.accepted || null;
  const retainedReview = sourceEvidence
    ? sourceSnapshot.complete.reviews.get(sourceEvidence.record.complete_raw_review_sha256) || null
    : null;
  if (!sourceEvidence || !retainedReview || retainedReview.record.decision !== "proceed") {
    fail("progressive_raw_local_rebind_invalid", "provider-free retained review requires current accepted source raw evidence");
  }
  if (sourceSnapshot.plan.source_receipt_sha256 === plan.source_receipt_sha256 ||
    !matchesReusableMaterializationBinding(plan, sourceSnapshot.plan)) {
    fail("progressive_raw_local_rebind_invalid", "retained review requires a same-scope successor with a new source receipt");
  }

  const successor = loadPlanByHash(runDir, plan.sha256);
  if (successor.progress.materialized !== successor.progress.total ||
    successor.progress.paid_debt.length !== 0 ||
    [...successor.materializations.values()].some((entry) => entry.provenance.record.kind !== "reuse")) {
    fail("progressive_raw_local_rebind_invalid", "retained review requires complete provider-free current reuse coverage");
  }
  const coverage = rawCoverage(successor.plan, successor.materializations);
  const prepared = createProgressiveRawCompleteReview({
    ...binding(successor.plan),
    ordered_slide_ids: successor.plan.ordered_slide_ids,
    items: coverage,
    workflow_evidence_sha256: retainedReview.record.workflow_evidence_sha256,
    projection_sha256: retainedReview.record.projection_sha256,
    decision: null,
    previous_review_sha256: null,
    retained_from_complete_raw_review_sha256: retainedReview.sha256,
  }, { plan: successor.plan });
  writeProgressiveRawCompleteReview(runDir, { plan: successor.plan, review: prepared });
  const decided = createProgressiveRawCompleteReview({
    ...prepared,
    decision: "proceed",
    previous_review_sha256: prepared.sha256,
  }, { plan: successor.plan });
  writeProgressiveRawCompleteReview(runDir, { plan: successor.plan, review: decided });
  const evidence = createProgressiveAcceptedRawEvidence({
    raw_work_plan_sha256: successor.plan.sha256,
    run_version: successor.plan.run_version,
    source_receipt_sha256: successor.plan.source_receipt_sha256,
    source_epoch: successor.plan.source_epoch,
    workflow: successor.plan.workflow,
    provider_profile_sha256: successor.plan.provider_profile_sha256,
    effective_style_master_sha256: successor.plan.effective_style_master_sha256,
    source_execution_sha256: successor.plan.source_execution_sha256,
    complete_raw_review_sha256: decided.sha256,
    ordered_slide_ids: successor.plan.ordered_slide_ids,
    items: coverage,
  }, { plan: successor.plan, completeReview: decided });
  writeProgressiveAcceptedRawEvidence(runDir, {
    plan: successor.plan,
    completeReview: decided,
    evidence,
  });
  // Re-read through the resolver so an external retained-review reference
  // cannot become current merely because its new records were well-shaped.
  const checkedSuccessor = loadPlanByHash(runDir, successor.plan.sha256);
  if (checkedSuccessor.complete.accepted?.sha256 !== evidence.sha256) {
    fail("progressive_raw_local_rebind_invalid", "retained review successor did not become current accepted raw evidence");
  }
  return Object.freeze({
    retained_complete_raw_review_sha256: retainedReview.sha256,
    complete_raw_review_sha256: decided.sha256,
    accepted_raw_evidence_sha256: evidence.sha256,
  });
}

/** Build the only provider-free replacement raw plan from one selected adapter plan. */
export function createProgressiveRawWorkPlanFromTarget({ runDir, source_epoch, raw_work_plan, effective_style_master_sha256 } = {}) {
  const legacy = checked(raw_work_plan, "selected adapter raw work plan", (plan) => {
    if (!plan || plan.schema !== "page-image-adapter-raw-work-plan-v1") return { ok: false, code: "progressive_raw_target_plan_invalid", message: "selected adapter must supply a current typed raw plan projection" };
    const ids = plan.ordered_slide_ids;
    return Array.isArray(ids) && ids.length > 0 && Array.isArray(plan.items) && ids.length === plan.items.length
      && plan.items.every((item) => item && typeof item === "object" && Object.hasOwn(item, "provider_input_binding"))
      ? { ok: true, sha256: canonicalJsonSha256(plan) }
      : { ok: false, code: "progressive_raw_target_plan_invalid", message: "selected adapter raw plan is missing provider input bindings" };
  });
  if (!Number.isInteger(source_epoch) || source_epoch <= 0) fail("progressive_raw_target_plan_invalid", "current source epoch is required for progressive raw planning");
  digest(effective_style_master_sha256, "effective_style_master_sha256");
  const plan = createProgressiveRawWorkPlan({
    run_version: basename(runDir || ""),
    source_receipt_sha256: raw_work_plan.source_receipt_sha256,
    source_epoch,
    workflow: raw_work_plan.workflow,
    provider_profile_sha256: raw_work_plan.provider_profile_sha256,
    effective_style_master_sha256,
    source_execution_sha256: canonicalJsonSha256({
      schema: "page-image-progressive-raw-source-execution-v1",
      run_version: basename(runDir || ""),
      source_receipt_sha256: raw_work_plan.source_receipt_sha256,
      source_epoch,
      workflow: raw_work_plan.workflow,
      provider_profile_sha256: raw_work_plan.provider_profile_sha256,
      effective_style_master_sha256,
      adapter_raw_work_plan_sha256: legacy.sha256,
    }),
    ordered_slide_ids: raw_work_plan.ordered_slide_ids,
    items: raw_work_plan.items.map((item) => ({
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      provider_input_binding: item.provider_input_binding,
    })),
  });
  return plan;
}

/** Check paid irreversible history before a source/profile successor can materialize. */
export function assertNoUnresolvedProgressiveRawSubmission({ runDir, workflow } = {}) {
  const snapshot = loadPlanByHead(runDir, workflow);
  const unresolved = unresolvedAction(snapshot);
  if (unresolved) fail("progressive_raw_reconciliation_required", "a persisted submitted provider attempt must reconcile before any successor plan or batch", { nextAction: unresolved });
  return snapshot;
}

/** Publish an immutable initial plan container then atomically advance its scope head. */
export function publishProgressiveRawWorkPlan({
  runDir,
  plan,
  reuse_current_materializations = false,
  retain_current_complete_review = false,
} = {}) {
  const checkedPlan = checked(plan, "progressive raw work plan", validateProgressiveRawWorkPlan);
  if (typeof reuse_current_materializations !== "boolean" || typeof retain_current_complete_review !== "boolean") {
    fail("progressive_raw_invalid", "progressive provider-free reuse options must be booleans");
  }
  if (retain_current_complete_review && !reuse_current_materializations) {
    fail("progressive_raw_local_rebind_invalid", "retained complete review requires explicit provider-free reuse evaluation");
  }
  const existing = loadPlanByHead(runDir, plan.workflow);
  const unresolved = unresolvedAction(existing);
  if (unresolved) fail("progressive_raw_reconciliation_required", "a submitted attempt blocks full-plan head advancement", { nextAction: unresolved });
  if (existing?.plan.sha256 === checkedPlan.sha256) {
    return Object.freeze({ plan, plan_hash: checkedPlan.sha256, replay: true, head: existing.head.record });
  }
  const reuse = reuse_current_materializations
    ? deriveCurrentProviderFreeReuse(plan, existing)
    : Object.freeze([]);
  const staged = stageProgressiveRawPlanContainer(runDir, { plan });
  const published = publishProgressiveRawStagedPlan(runDir, { staging_path: staged.staging_path, plan_sha256: checkedPlan.sha256 });
  for (const source of reuse) {
    const provenance = createProgressiveRawMaterializationProvenance({
      ...binding(plan),
      kind: "reuse",
      slide_id: source.slide_id,
      raw_contract_sha256: source.raw_contract_sha256,
      raw_sha256: source.raw_sha256,
      reused_from_provenance_sha256: source.source_provenance_sha256,
    }, { plan });
    publishProgressiveRawMaterialization(runDir, { plan, provenance, bytes: source.bytes });
  }
  const retained = retain_current_complete_review
    ? retainCurrentCompleteReviewForProviderFreeReuse(runDir, plan, existing)
    : null;
  const generation = existing ? existing.head.record.plan_generation + 1 : 1;
  const head = createProgressiveRawScopeHead({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: checkedPlan.sha256,
    plan_generation: generation,
    previous_plan_sha256: existing?.plan.sha256 || null,
  }, { plan });
  const cas = writeProgressiveRawScopeHeadCas(runDir, {
    workflow: plan.workflow,
    head,
    plan,
    expected_bytes: existing?.head.bytes || null,
    validate_advance: () => {
      const current = loadPlanByHead(runDir, plan.workflow);
      const currentUnresolved = unresolvedAction(current);
      if (currentUnresolved) fail("progressive_raw_reconciliation_required", "a submitted attempt blocks full-plan head advancement", { nextAction: currentUnresolved });
    },
  });
  return Object.freeze({
    plan,
    plan_hash: checkedPlan.sha256,
    replay: !published.published,
    head,
    head_sha256: cas.head_sha256,
    reused_slide_ids: Object.freeze(reuse.map((entry) => entry.slide_id)),
    ...(retained || {}),
  });
}

function progressiveControllerHandoffs(snapshot) {
  const pilot = [...snapshot.batch_lineage]
    .reverse()
    .map((batch) => {
      const decision = snapshot.pilot.decision_by_batch.get(batch.sha256) || null;
      const evidence = snapshot.pilot.evidence_by_batch.get(batch.sha256) || null;
      return batch.record.is_partial_pilot && decision && evidence
        ? Object.freeze({
          batch_sha256: batch.sha256,
          pilot_evidence_sha256: evidence.sha256,
          pilot_decision_sha256: decision.sha256,
          decision: decision.record.decision,
        })
        : null;
    })
    .find(Boolean) || null;
  const reviews = [...snapshot.complete.reviews.values()];
  const acceptedReview = snapshot.complete.accepted
    ? snapshot.complete.reviews.get(snapshot.complete.accepted.record.complete_raw_review_sha256) || null
    : null;
  const complete = acceptedReview || currentCompleteReview(snapshot) ||
    reviews.find((review) => review.record.decision !== null) || null;
  return Object.freeze({
    partial_pilot: pilot,
    complete_raw_review: complete
      ? Object.freeze({
        complete_raw_review_sha256: complete.sha256,
        decision: complete.record.decision,
        ...(snapshot.complete.accepted ? { accepted_raw_evidence_sha256: snapshot.complete.accepted.sha256 } : {}),
      })
      : null,
  });
}

/** Read one current raw-owner projection without writing any artifact or state. */
export function inspectProgressiveRawLifecycle({ runDir, workflow, expected_plan = null } = {}) {
  let snapshot;
  try {
    snapshot = loadPlanByHead(runDir, workflow);
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "progressive_raw_owner_invalid",
      next_action: error.next_action || action("report_internal", {
        summary: "The progressive raw owner detected an immutable integrity conflict requiring Harness maintenance.",
      }),
    });
  }
  if (!snapshot) {
    return Object.freeze({
      ok: true,
      plan: null,
      progress: null,
      evidence: null,
      primary_action: action("plan_progressive_raw_work", { summary: "Compile one provider-free full progressive raw plan." }),
    });
  }
  const primary = nextAction(snapshot, { expectedPlan: expected_plan });
  const latest = latestBatch(snapshot);
  const currentReview = currentCompleteReview(snapshot);
  return Object.freeze({
    ok: true,
    plan: Object.freeze({ plan_hash: snapshot.plan.sha256, ...binding(snapshot.plan) }),
    progress: snapshot.progress,
    latest_batch: latest ? projectBatch({ ...latest.record, sha256: latest.sha256 }, snapshot.plan, {}) : null,
    controller_handoffs: progressiveControllerHandoffs(snapshot),
    evidence: Object.freeze({
      accepted_raw_evidence_sha256: snapshot.complete.accepted?.sha256 || null,
      complete_raw_review_sha256: currentReview?.sha256 || null,
      pilot_evidence_sha256: latest ? snapshot.pilot.evidence_by_batch.get(latest.sha256)?.sha256 || null : null,
      pilot_decision_sha256: latest ? snapshot.pilot.decision_by_batch.get(latest.sha256)?.sha256 || null : null,
    }),
    primary_action: primary,
  });
}

/** Derive a provider-free exact Pilot projection from formal IDs and direct debt facts. */
export async function planProgressiveRawPilot({ runDir, workflow, plan_hash, slide_ids, display_by_slide = {}, expected_plan = null } = {}) {
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    expected_plan,
    action: async (snapshot) => {
      const unresolved = unresolvedAction(snapshot);
      if (unresolved) fail("progressive_raw_reconciliation_required", "submitted outcome must reconcile before Pilot planning", { nextAction: unresolved });
      const scope = validatePilotScope(snapshot, slide_ids);
      const active = activeBatch(snapshot);
      if (active) {
        const exact = findExactOpenBatch(snapshot, { kind: "pilot", ordered: scope.ordered, paid: scope.paid });
        if (!exact) fail("progressive_raw_batch_conflict", "a conflicting live Pilot scope already owns current paid work", { nextAction: nextAction(snapshot) });
        return Object.freeze({ plan_hash, batch: projectBatch({ ...exact.record, sha256: exact.sha256 }, snapshot.plan, display_by_slide), replay: true, next_action: nextAction(snapshot) });
      }
      const ownerAction = nextAction(snapshot);
      if (ownerAction.action_id !== "plan_progressive_pilot") {
        fail("progressive_raw_pilot_unavailable", "the current progressive lifecycle does not permit another Pilot scope", { nextAction: ownerAction });
      }
      const batch = batchRecord(snapshot, { kind: "pilot", ordered: scope.ordered, paid: scope.paid, partial: scope.partial });
      writeProgressiveRawBatch(runDir, { plan: snapshot.plan, batch });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch: projectBatch(batch, snapshot.plan, display_by_slide), replay: false, next_action: nextAction(after) });
    },
  });
}

/** Derive the one remaining paid Expansion projection after a partial Pilot proceed. */
export async function planProgressiveRawExpansion({ runDir, workflow, plan_hash, display_by_slide = {}, expected_plan = null } = {}) {
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    expected_plan,
    action: async (snapshot) => {
      const unresolved = unresolvedAction(snapshot);
      if (unresolved) fail("progressive_raw_reconciliation_required", "submitted outcome must reconcile before Expansion planning", { nextAction: unresolved });
      const previous = latestBatch(snapshot);
      const previousState = previous ? snapshot.batch_states.get(previous.sha256) : null;
      const decision = previous ? snapshot.pilot.decision_by_batch.get(previous.sha256) : null;
      if (!previous || previous.record.kind !== "pilot" || !previous.record.is_partial_pilot || !previousState?.terminal || decision?.record.decision !== "proceed") {
        fail("progressive_raw_expansion_unavailable", "Expansion requires the exact terminal partial Pilot proceed record", { nextAction: nextAction(snapshot) });
      }
      const debt = snapshot.progress.paid_debt;
      if (debt.length === 0) fail("progressive_raw_complete_review_required", "no remaining paid debt exists after Pilot; route to complete raw review", { nextAction: completeReviewAction(snapshot) });
      const active = activeBatch(snapshot);
      if (active) {
        const exact = findExactOpenBatch(snapshot, { kind: "expansion", ordered: debt, paid: debt });
        if (!exact) fail("progressive_raw_batch_conflict", "a conflicting live Expansion scope already owns remaining paid work", { nextAction: nextAction(snapshot) });
        return Object.freeze({ plan_hash, batch: projectBatch({ ...exact.record, sha256: exact.sha256 }, snapshot.plan, display_by_slide), replay: true, next_action: nextAction(snapshot) });
      }
      const batch = batchRecord(snapshot, { kind: "expansion", ordered: debt, paid: debt, partial: false });
      writeProgressiveRawBatch(runDir, { plan: snapshot.plan, batch });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch: projectBatch(batch, snapshot.plan, display_by_slide), replay: false, next_action: nextAction(after) });
    },
  });
}

/** Record or exact-replay one human-confirmed exact batch grant. */
export async function authorizeProgressiveRawBatch({ runDir, workflow, plan_hash, batch_hash, expected_plan = null } = {}) {
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    expected_plan,
    action: async (snapshot) => {
      const unresolved = unresolvedAction(snapshot);
      if (unresolved) fail("progressive_raw_reconciliation_required", "submitted outcome must reconcile before authorization", { nextAction: unresolved });
      digest(batch_hash, "batch_hash");
      const batch = snapshot.attempt_state.batch_by_sha.get(batch_hash);
      const state = snapshot.batch_states.get(batch_hash);
      if (!batch || !state) fail("progressive_raw_batch_stale", "the supplied batch hash is not current for this full plan", { nextAction: nextAction(snapshot) });
      if (state.terminal) fail("progressive_raw_batch_terminal", "a terminal batch cannot reopen its old grant", { nextAction: nextAction(snapshot) });
      if (state.grant) return Object.freeze({ plan_hash, batch_hash, grant_hash: state.grant.sha256, replay: true, maximum_submissions: state.grant.record.maximum_submissions, next_action: nextAction(snapshot) });
      const grant = createProgressiveRawBatchGrant({
        ...binding(snapshot.plan),
        batch_sha256: batch_hash,
        ordered_slide_ids: [...batch.record.paid_submission_slide_ids],
        items: batch.record.items.filter((item) => batch.record.paid_submission_slide_ids.includes(item.slide_id)),
        maximum_submissions: batch.record.maximum_submissions,
      }, { plan: snapshot.plan, batch: batch.record });
      writeProgressiveRawBatchGrant(runDir, { plan: snapshot.plan, batch: batch.record, grant });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch_hash, grant_hash: grant.sha256, replay: false, maximum_submissions: grant.maximum_submissions, next_action: nextAction(after) });
    },
  });
}

function currentEligibleAttempt(snapshot, batchState) {
  if (batchState.unresolved) {
    fail("progressive_raw_reconciliation_required", "a submitted provider outcome must reconcile before another item may submit", {
      nextAction: action("reconcile_progressive_raw_attempt", { kind: "repair", plan_hash: snapshot.plan.sha256, attempt_sha256: batchState.unresolved.attempt.sha256 }),
    });
  }
  if (batchState.claim) return batchState.claim.attempt;
  if (!batchState.eligible) {
    fail("progressive_raw_item_unavailable", "this batch has no owner-eligible unsubmitted item", { nextAction: nextAction(snapshot) });
  }
  const item = batchState.eligible;
  const created = createProgressiveRawItemAttempt({
    ...binding(snapshot.plan),
    batch_sha256: batchState.batch.sha256,
    grant_sha256: batchState.grant.sha256,
    slide_id: item.slide_id,
    raw_contract_sha256: item.raw_contract_sha256,
    status: "claimed",
  }, { plan: snapshot.plan, batch: batchState.batch.record, grant: batchState.grant.record });
  return Object.freeze({ record: created, sha256: created.sha256 });
}

function providerKnownFailure(error) {
  return Boolean(error?.progressive_raw_known_failure || error?.page_image_known_failure || error?.known_failure);
}

function pageImageKnownFailureMediaFacts(error) {
  const facts = error?.page_image_known_failure_facts;
  if (!error?.page_image_known_failure || !facts || typeof facts !== "object" || Array.isArray(facts)) return null;
  const actual = facts.actual;
  if (facts.expected?.format !== PAGE_IMAGE_NATIVE_RAW_PNG.format ||
    !actual || typeof actual !== "object" || Array.isArray(actual)) return null;
  const expected = PAGE_IMAGE_NATIVE_RAW_PNG;
  if (["empty", "invalid_png"].includes(actual.classification)) {
    return Object.freeze({ expected, actual: Object.freeze({ classification: actual.classification }) });
  }
  if (actual.format === "png" && Number.isSafeInteger(actual.width) && actual.width > 0 &&
    Number.isSafeInteger(actual.height) && actual.height > 0) {
    return Object.freeze({
      expected,
      actual: Object.freeze({ format: "png", width: actual.width, height: actual.height }),
    });
  }
  return null;
}

function pageImageKnownFailureResponseFacts(error) {
  const facts = error?.page_image_known_failure_facts;
  const response = facts?.response;
  if (!error?.page_image_known_failure || !response || typeof response !== "object" || Array.isArray(response)) return null;
  if (response.classification === "invalid_json") {
    const result = { classification: "invalid_json" };
    if (["empty", "html_like", "other_non_json"].includes(response.response_shape)) {
      result.response_shape = response.response_shape;
    }
    return Object.freeze(result);
  }
  if (["task_terminal_failure", "task_response_invalid"].includes(response.classification)) {
    return Object.freeze({ classification: response.classification });
  }
  if (response.classification === "http_error") {
    const result = { classification: "http_error" };
    if (Number.isSafeInteger(response.http_status) && response.http_status >= 100 && response.http_status <= 599) {
      result.http_status = response.http_status;
    }
    return Object.freeze(result);
  }
  return null;
}

function providerResultKnownFailure(result) {
  return Boolean(result && typeof result === "object" && result.outcome === "known_failure");
}

/** Submit at most one persisted exact item, publishing materialization before succeeded visibility. */
export async function generateProgressiveRawItem({ runDir, workflow, plan_hash, batch_hash, expected_plan = null, provider_requests_by_slide, preflight = null, submit } = {}) {
  if (typeof submit !== "function") fail("progressive_raw_provider_submit_required", "one provider submit function is required");
  if (preflight !== null && typeof preflight !== "function") {
    fail("progressive_raw_provider_preflight_invalid", "provider preflight must be a function when supplied");
  }
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    expected_plan,
    action: async (snapshot) => {
      const unresolved = unresolvedAction(snapshot);
      if (unresolved) fail("progressive_raw_reconciliation_required", "a submitted outcome must reconcile before generation", { nextAction: unresolved });
      digest(batch_hash, "batch_hash");
      const batch = snapshot.attempt_state.batch_by_sha.get(batch_hash);
      const state = snapshot.batch_states.get(batch_hash);
      if (!batch || !state || !state.grant) fail("progressive_raw_grant_required", "generation requires one current exact batch grant", { nextAction: nextAction(snapshot) });
      if (state.terminal) fail("progressive_raw_batch_terminal", "generation cannot reopen a terminal batch", { nextAction: nextAction(snapshot) });
      const candidate = currentEligibleAttempt(snapshot, state);
      let boundRequests;
      try {
        boundRequests = validateBoundPageImageProviderRequests({
          plan: snapshot.plan,
          providerRequestsBySlide: provider_requests_by_slide,
        });
      } catch (error) {
        fail(
          "progressive_raw_provider_request_invalid",
          error?.message || "selected adapter requests must match the current progressive raw plan",
        );
      }
      const boundRequest = boundRequests.requests_by_slide[candidate.record.slide_id];
      const request = boundRequest.request;
      const requestSha = boundRequest.request_sha256;
      if (preflight) {
        await preflight(Object.freeze({
          request,
          item: Object.freeze({ slide_id: candidate.record.slide_id, raw_contract_sha256: candidate.record.raw_contract_sha256 }),
          plan_hash,
          batch_hash,
          grant_hash: state.grant.sha256,
        }));
      }
      let attempt = candidate;
      if (candidate.record.status === "claimed") {
        const existing = snapshot.attempt_state.by_sha.get(candidate.sha256);
        if (!existing) writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record, attempt: candidate.record });
      }
      const submitted = createProgressiveRawItemAttempt({
        ...candidate.record,
        status: "submitted",
        previous_attempt_sha256: candidate.sha256,
        provider_request_sha256: requestSha,
        provider_idempotency_key: progressiveRawIdempotencyKey(candidate.record),
      }, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record });
      writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record, attempt: submitted });
      let result;
      try {
        result = await submit(Object.freeze({
          request,
          item: Object.freeze({ slide_id: candidate.record.slide_id, raw_contract_sha256: candidate.record.raw_contract_sha256 }),
          plan_hash,
          batch_hash,
          grant_hash: state.grant.sha256,
          attempt_sha256: submitted.sha256,
          provider_idempotency_key: submitted.provider_idempotency_key,
        }));
      } catch (error) {
        if (!providerKnownFailure(error)) {
          fail("progressive_raw_provider_outcome_unresolved", "provider submission outcome is unknown; the persisted submitted attempt requires reconciliation", {
            nextAction: action("reconcile_progressive_raw_attempt", { kind: "repair", plan_hash, attempt_sha256: submitted.sha256 }),
          });
        }
        const terminal = createProgressiveRawItemAttempt({ ...submitted, status: "known_failure", previous_attempt_sha256: submitted.sha256 }, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record });
        writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record, attempt: terminal });
        const after = loadPlanByHead(runDir, workflow);
        const providerMedia = pageImageKnownFailureMediaFacts(error);
        const providerFailure = pageImageKnownFailureResponseFacts(error);
        return Object.freeze({
          plan_hash,
          batch_hash,
          item: candidate.record.slide_id,
          outcome: "known_failure",
          ...(providerMedia ? { provider_media: providerMedia } : {}),
          ...(providerFailure ? { provider_failure: providerFailure } : {}),
          progress: after.progress,
          next_action: nextAction(after),
        });
      }
      if (providerResultKnownFailure(result)) {
        const terminal = createProgressiveRawItemAttempt({ ...submitted, status: "known_failure", previous_attempt_sha256: submitted.sha256 }, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record });
        writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record, attempt: terminal });
        const after = loadPlanByHead(runDir, workflow);
        return Object.freeze({ plan_hash, batch_hash, item: candidate.record.slide_id, outcome: "known_failure", progress: after.progress, next_action: nextAction(after) });
      }
      if (!Buffer.isBuffer(result) && !(result instanceof Uint8Array)) {
        fail("progressive_raw_provider_outcome_unresolved", "provider returned no provable bytes; reconcile the persisted submission", {
          nextAction: action("reconcile_progressive_raw_attempt", { kind: "repair", plan_hash, attempt_sha256: submitted.sha256 }),
        });
      }
      const bytes = Buffer.from(result);
      if (!bytes.length) fail("progressive_raw_provider_outcome_unresolved", "provider returned empty bytes; reconcile the persisted submission", { nextAction: action("reconcile_progressive_raw_attempt", { kind: "repair", plan_hash, attempt_sha256: submitted.sha256 }) });
      const provenance = createProgressiveRawMaterializationProvenance({
        ...binding(snapshot.plan),
        kind: "provider",
        slide_id: candidate.record.slide_id,
        raw_contract_sha256: candidate.record.raw_contract_sha256,
        raw_sha256: sha256Bytes(bytes),
        batch_sha256: batch.sha256,
        grant_sha256: state.grant.sha256,
        attempt_key_sha256: candidate.record.attempt_key_sha256,
      }, { plan: snapshot.plan });
      publishProgressiveRawMaterialization(runDir, { plan: snapshot.plan, provenance, bytes });
      const terminal = createProgressiveRawItemAttempt({
        ...submitted,
        status: "succeeded",
        previous_attempt_sha256: submitted.sha256,
        materialization_provenance_sha256: provenance.sha256,
      }, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record });
      writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: state.grant.record, attempt: terminal });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch_hash, item: candidate.record.slide_id, outcome: "succeeded", materialization_provenance_sha256: provenance.sha256, progress: after.progress, next_action: nextAction(after) });
    },
  });
}

/** Reconcile exactly one persisted submitted attempt without ever resubmitting it. */
export async function reconcileProgressiveRawAttempt({ runDir, workflow, plan_hash, attempt_sha256, expected_plan = null, lookup = null } = {}) {
  digest(plan_hash, "plan_hash");
  digest(attempt_sha256, "attempt_sha256");
  return withProgressiveRawPlanLock(runDir, {
    plan_sha256: plan_hash,
    action: async () => {
      const currentHead = loadPlanByHead(runDir, workflow);
      if (!currentHead) fail("progressive_raw_plan_missing", "historical reconciliation requires a current selected scope head");
      const current = expected_plan
        ? requireCurrentPlan(currentHead, currentHead.plan.sha256, expected_plan)
        : currentHead;
      const snapshot = current.plan.sha256 === plan_hash ? current : loadPlanByHash(runDir, plan_hash);
      if (snapshot.plan.workflow !== workflow || snapshot.plan.run_version !== current.plan.run_version) {
        fail("progressive_raw_cross_bound", "historical reconciliation requires a plan from the exact current run/workflow scope", { nextAction: nextAction(current) });
      }
      const historical = snapshot.plan.sha256 !== current.plan.sha256;
      const attempt = snapshot.attempt_state.by_sha.get(attempt_sha256);
      if (!attempt || attempt.record.status !== "submitted") {
        fail("progressive_raw_reconcile_invalid", "reconcile accepts only an exact persisted submitted attempt", { nextAction: historical ? nextAction(current) : nextAction(snapshot) });
      }
      const effectiveTerminal = snapshot.attempt_state.current_by_key.get(attempt.record.attempt_key_sha256) || null;
      if (effectiveTerminal?.record.status === "succeeded" && effectiveTerminal.record.previous_attempt_sha256 === attempt.sha256) {
        return Object.freeze({
          plan_hash,
          attempt_sha256,
          reconciled: true,
          replay: true,
          outcome: "succeeded",
          historical,
          progress: snapshot.progress,
          ...(historical ? { current_plan_hash: current.plan.sha256 } : {}),
          next_action: historical ? nextAction(current) : nextAction(snapshot),
        });
      }
      const batch = snapshot.attempt_state.batch_by_sha.get(attempt.record.batch_sha256);
      const grant = snapshot.attempt_state.grant_by_batch.get(attempt.record.batch_sha256);
      const persisted = snapshot.orphaned_materializations.get(attempt.record.attempt_key_sha256) || null;
      let outcome = null;
      if (!persisted && typeof lookup === "function") {
        outcome = await lookup(Object.freeze({
          plan_hash,
          attempt_sha256,
          provider_request_sha256: attempt.record.provider_request_sha256,
          provider_idempotency_key: attempt.record.provider_idempotency_key,
          item: Object.freeze({ slide_id: attempt.record.slide_id, raw_contract_sha256: attempt.record.raw_contract_sha256 }),
        }));
      }
      let terminalOutcome;
      if (persisted) {
        const succeeded = createProgressiveRawItemAttempt({
          ...attempt.record,
          status: "succeeded",
          previous_attempt_sha256: attempt.sha256,
          materialization_provenance_sha256: persisted.provenance.sha256,
        }, { plan: snapshot.plan, batch: batch.record, grant: grant.record });
        writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: grant.record, attempt: succeeded });
        terminalOutcome = "succeeded";
      } else if (outcome && (Buffer.isBuffer(outcome) || outcome instanceof Uint8Array)) {
        const bytes = Buffer.from(outcome);
        if (!bytes.length) fail("progressive_raw_reconcile_invalid", "reconciliation lookup returned empty bytes");
        const provenance = createProgressiveRawMaterializationProvenance({
          ...binding(snapshot.plan),
          kind: "provider",
          slide_id: attempt.record.slide_id,
          raw_contract_sha256: attempt.record.raw_contract_sha256,
          raw_sha256: sha256Bytes(bytes),
          batch_sha256: batch.sha256,
          grant_sha256: grant.sha256,
          attempt_key_sha256: attempt.record.attempt_key_sha256,
        }, { plan: snapshot.plan });
        publishProgressiveRawMaterialization(runDir, { plan: snapshot.plan, provenance, bytes });
        const succeeded = createProgressiveRawItemAttempt({ ...attempt.record, status: "succeeded", previous_attempt_sha256: attempt.sha256, materialization_provenance_sha256: provenance.sha256 }, { plan: snapshot.plan, batch: batch.record, grant: grant.record });
        writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: grant.record, attempt: succeeded });
        terminalOutcome = "succeeded";
      } else {
        const status = outcome?.outcome === "known_failure" ? "known_failure" : "unknown";
        const terminal = createProgressiveRawItemAttempt({ ...attempt.record, status, previous_attempt_sha256: attempt.sha256 }, { plan: snapshot.plan, batch: batch.record, grant: grant.record });
        writeProgressiveRawItemAttempt(runDir, { plan: snapshot.plan, batch: batch.record, grant: grant.record, attempt: terminal });
        terminalOutcome = status;
      }
      const reconciled = loadPlanByHash(runDir, plan_hash);
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({
        plan_hash,
        attempt_sha256,
        reconciled: true,
        outcome: terminalOutcome,
        historical,
        progress: reconciled.progress,
        ...(historical ? { current_plan_hash: after.plan.sha256 } : {}),
        next_action: historical ? nextAction(after) : nextAction(reconciled),
      });
    },
  });
}

/** Persist generic Pilot evidence only after every selected review tuple is attributable and current. */
export async function prepareProgressiveRawPilotEvidence({ runDir, workflow, plan_hash, batch_hash, publish } = {}) {
  if (typeof publish !== "function") fail("progressive_raw_pilot_publish_required", "selected workflow Pilot publisher is required");
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    action: async (snapshot) => {
      const batch = snapshot.attempt_state.batch_by_sha.get(batch_hash);
      const state = snapshot.batch_states.get(batch_hash);
      if (!batch || !state?.terminal || !batch.record.is_partial_pilot) fail("progressive_raw_pilot_unavailable", "Pilot evidence requires a terminal current partial Pilot batch", { nextAction: nextAction(snapshot) });
      if (snapshot.pilot.evidence_by_batch.has(batch_hash)) return Object.freeze({ plan_hash, batch_hash, pilot_evidence_sha256: snapshot.pilot.evidence_by_batch.get(batch_hash).sha256, replay: true, next_action: nextAction(snapshot) });
      if (missingRawCoverage(snapshot.materializations, batch.record.review_sample_slide_ids).length > 0) {
        fail("progressive_raw_pilot_coverage_missing", "Pilot evidence requires current materialization coverage", { nextAction: nextAction(snapshot) });
      }
      const coverage = rawCoverage(snapshot.plan, snapshot.materializations, batch.record.review_sample_slide_ids);
      const published = await publish(Object.freeze({
        plan: snapshot.plan,
        batch: batch.record,
        batch_sha256: batch.sha256,
        coverage: Object.freeze(coverage),
        materializations: snapshot.materializations,
      }));
      asObject(published, "Pilot publication");
      digest(published.workflow_evidence_sha256, "workflow_evidence_sha256");
      digest(published.projection_sha256, "projection_sha256");
      const evidence = createProgressiveRawPilotEvidence({ ...binding(snapshot.plan), batch_sha256: batch_hash, ordered_slide_ids: batch.record.review_sample_slide_ids, items: coverage, workflow_evidence_sha256: published.workflow_evidence_sha256, projection_sha256: published.projection_sha256 }, { plan: snapshot.plan, batch: batch.record });
      writeProgressiveRawPilotEvidence(runDir, { plan: snapshot.plan, batch: batch.record, evidence });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch_hash, pilot_evidence_sha256: evidence.sha256, replay: false, next_action: nextAction(after) });
    },
  });
}

/** Record only the bounded partial Pilot quality decision. */
export async function acceptProgressiveRawPilot({ runDir, workflow, plan_hash, batch_hash, decision, validatePilotReview = null } = {}) {
  if (!["proceed", "repair", "redirect"].includes(decision)) fail("progressive_raw_pilot_decision_invalid", "Pilot decision must be proceed, repair, or redirect");
  if (validatePilotReview !== null && typeof validatePilotReview !== "function") {
    fail("progressive_raw_pilot_validation_invalid", "Pilot review validation must be a function when supplied");
  }
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    action: async (snapshot) => {
      const batch = snapshot.attempt_state.batch_by_sha.get(batch_hash);
      const evidence = snapshot.pilot.evidence_by_batch.get(batch_hash);
      if (!batch || !batch.record.is_partial_pilot || !evidence) fail("progressive_raw_pilot_unavailable", "partial Pilot acceptance requires exact current Pilot evidence", { nextAction: nextAction(snapshot) });
      if (validatePilotReview) {
        const coverage = rawCoverage(snapshot.plan, snapshot.materializations, batch.record.review_sample_slide_ids);
        const validation = await validatePilotReview(Object.freeze({
          plan: snapshot.plan,
          batch: batch.record,
          batch_sha256: batch.sha256,
          coverage: Object.freeze(coverage),
          materializations: snapshot.materializations,
          pilot_evidence: evidence.record,
        }));
        asObject(validation, "Pilot review validation");
        if (validation.ok !== true ||
          validation.pilot_page_presentation_sha256 !== evidence.record.workflow_evidence_sha256 ||
          validation.projection_sha256 !== evidence.record.projection_sha256) {
          fail(
            validation.code || "progressive_raw_pilot_review_stale",
            validation.message || "Pilot page review evidence no longer binds the current selected sample",
            { nextAction: nextAction(snapshot) },
          );
        }
      }
      const existing = snapshot.pilot.decision_by_batch.get(batch_hash);
      if (existing) {
        if (existing.record.decision !== decision) fail("progressive_raw_pilot_decision_conflict", "Pilot decision is immutable and differs from the prior record");
        return Object.freeze({ plan_hash, batch_hash, pilot_decision_sha256: existing.sha256, replay: true, next_action: nextAction(snapshot) });
      }
      const record = createProgressiveRawPilotDecision({ ...binding(snapshot.plan), batch_sha256: batch_hash, pilot_evidence_sha256: evidence.sha256, decision }, { plan: snapshot.plan, batch: batch.record, evidence: evidence.record });
      writeProgressiveRawPilotDecision(runDir, { plan: snapshot.plan, batch: batch.record, evidence: evidence.record, decision: record });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, batch_hash, pilot_decision_sha256: record.sha256, replay: false, next_action: nextAction(after) });
    },
  });
}

/** Build complete full-plan review evidence after all current tuples have provenance. */
export async function prepareProgressiveRawCompleteReview({ runDir, workflow, plan_hash, publish } = {}) {
  if (typeof publish !== "function") fail("progressive_raw_review_publish_required", "selected workflow complete-review publisher is required");
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    action: async (snapshot) => {
      if (snapshot.progress.paid_debt.length > 0 || snapshot.progress.claimed || snapshot.progress.submitted) {
        fail("progressive_raw_complete_review_unavailable", "complete raw review requires full current materialization coverage", { nextAction: nextAction(snapshot) });
      }
      const existing = currentCompleteReview(snapshot);
      const acceptedReview = snapshot.complete.accepted
        ? snapshot.complete.reviews.get(snapshot.complete.accepted.record.complete_raw_review_sha256) || null
        : null;
      const replay = acceptedReview || existing;
      if (!replay) {
        const ownerAction = nextAction(snapshot);
        if (ownerAction.action_id !== "prepare_progressive_raw_review") {
          fail("progressive_raw_complete_review_unavailable", "the current progressive lifecycle does not permit another complete raw review", { nextAction: ownerAction });
        }
      }
      const coverage = rawCoverage(snapshot.plan, snapshot.materializations);
      const published = await publish(Object.freeze({ plan: snapshot.plan, coverage: Object.freeze(coverage), materializations: snapshot.materializations }));
      asObject(published, "complete review publication");
      digest(published.workflow_evidence_sha256, "workflow_evidence_sha256");
      digest(published.projection_sha256, "projection_sha256");
      if (replay) {
        if (published.workflow_evidence_sha256 !== replay.record.workflow_evidence_sha256 ||
          published.projection_sha256 !== replay.record.projection_sha256) {
          fail(
            "progressive_raw_complete_review_projection_stale",
            "the rebuilt complete raw-review projection no longer matches its immutable current evidence",
            { nextAction: action("rebuild_progressive_raw_work", { kind: "repair", plan_hash: snapshot.plan.sha256 }) },
          );
        }
        return Object.freeze({
          plan_hash,
          complete_raw_review_sha256: replay.sha256,
          replay: true,
          ...(snapshot.complete.accepted ? { accepted_raw_evidence_sha256: snapshot.complete.accepted.sha256 } : {}),
          next_action: nextAction(snapshot),
        });
      }
      const review = createProgressiveRawCompleteReview({ ...binding(snapshot.plan), ordered_slide_ids: snapshot.plan.ordered_slide_ids, items: coverage, workflow_evidence_sha256: published.workflow_evidence_sha256, projection_sha256: published.projection_sha256 }, { plan: snapshot.plan });
      writeProgressiveRawCompleteReview(runDir, { plan: snapshot.plan, review });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, complete_raw_review_sha256: review.sha256, replay: false, next_action: nextAction(after) });
    },
  });
}

/** Decide a complete full-plan review and publish the sole accepted current evidence on proceed. */
export async function acceptProgressiveRawCompleteReview({ runDir, workflow, plan_hash, decision, validate = null } = {}) {
  if (!["proceed", "repair"].includes(decision)) fail("progressive_raw_complete_review_decision_invalid", "Complete Page Review decision must be proceed or repair");
  if (validate !== null && typeof validate !== "function") {
    fail("progressive_raw_complete_review_validator_invalid", "complete page review validator must be a function when supplied");
  }
  return withCurrentProgressiveRawPlanLock(runDir, {
    workflow,
    plan_hash,
    action: async (snapshot) => {
      const prepared = currentCompleteReview(snapshot);
      if (!prepared) fail("progressive_raw_complete_review_required", "a current prepared complete raw review is required", { nextAction: nextAction(snapshot) });
      if (validate !== null) {
        const validation = await validate(Object.freeze({
          plan: snapshot.plan,
          review: prepared.record,
          materializations: snapshot.materializations,
          coverage: Object.freeze(rawCoverage(snapshot.plan, snapshot.materializations)),
        }));
        if (!validation?.ok ||
          validation.complete_page_presentation_sha256 !== prepared.record.workflow_evidence_sha256 ||
          validation.projection_sha256 !== prepared.record.projection_sha256) {
          fail(
            "progressive_raw_complete_page_review_stale",
            "the Complete Page Review no longer binds current provider and presentation evidence",
            { nextAction: action("prepare_progressive_raw_review", { plan_hash: snapshot.plan.sha256 }) },
          );
        }
      }
      const decided = createProgressiveRawCompleteReview({ ...prepared.record, decision, previous_review_sha256: prepared.sha256 }, { plan: snapshot.plan });
      writeProgressiveRawCompleteReview(runDir, { plan: snapshot.plan, review: decided });
      if (decision !== "proceed") {
        const after = loadPlanByHead(runDir, workflow);
        return Object.freeze({ plan_hash, complete_raw_review_sha256: decided.sha256, accepted_raw_evidence_sha256: null, next_action: nextAction(after) });
      }
      const evidence = createProgressiveAcceptedRawEvidence({
        ...binding(snapshot.plan),
        raw_work_plan_sha256: snapshot.plan.sha256,
        complete_raw_review_sha256: decided.sha256,
        ordered_slide_ids: snapshot.plan.ordered_slide_ids,
        items: rawCoverage(snapshot.plan, snapshot.materializations),
      }, { plan: snapshot.plan, completeReview: decided });
      writeProgressiveAcceptedRawEvidence(runDir, { plan: snapshot.plan, completeReview: decided, evidence });
      const after = loadPlanByHead(runDir, workflow);
      return Object.freeze({ plan_hash, complete_raw_review_sha256: decided.sha256, accepted_raw_evidence_sha256: evidence.sha256, accepted_raw_evidence_schema: PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA, next_action: nextAction(after) });
    },
  });
}

/** Read full current accepted evidence and canonical byte bundles for finalization. */
export function readProgressiveAcceptedRawWork({ runDir, workflow, plan_hash, expected_plan = null } = {}) {
  const snapshot = requireCurrentPlan(loadPlanByHead(runDir, workflow), plan_hash, expected_plan);
  const evidence = snapshot.complete.accepted;
  if (!evidence) fail("progressive_raw_accepted_evidence_required", "current accepted progressive raw evidence is required", { nextAction: nextAction(snapshot) });
  const completeReview = snapshot.complete.reviews.get(evidence.record.complete_raw_review_sha256) || null;
  if (!completeReview || completeReview.record.decision !== "proceed") {
    fail("progressive_raw_accepted_evidence_stale", "accepted progressive raw evidence no longer names a proceeded Complete Page Review");
  }
  const bytes = {};
  for (const item of snapshot.plan.items) {
    const materialization = snapshot.materializations.get(item.slide_id);
    if (!materialization) fail("progressive_raw_accepted_evidence_stale", `accepted raw bytes are unavailable for ${item.slide_id}`);
    bytes[item.slide_id] = Buffer.from(materialization.bytes);
  }
  return Object.freeze({
    plan: snapshot.plan,
    accepted_raw_evidence: evidence.record,
    accepted_raw_evidence_sha256: evidence.sha256,
    complete_raw_review: completeReview.record,
    complete_raw_review_sha256: completeReview.sha256,
    raw_bytes_by_slide: Object.freeze(bytes),
    progress: snapshot.progress,
  });
}

/**
 * Read the one current Complete Page Review that still awaits its human
 * decision. A prepared record remains immutable after a later decision, so
 * `decided_by_prepared` is the authority for excluding that historical input.
 */
export function readCurrentProgressiveRawCompleteReview({ runDir, workflow, expected_plan = null } = {}) {
  const current = loadPlanByHead(runDir, workflow);
  if (!current) return Object.freeze({ available: false });
  const snapshot = expected_plan
    ? requireCurrentPlan(current, current.plan.sha256, expected_plan)
    : current;
  const review = currentCompleteReview(snapshot);
  if (!review) return Object.freeze({ available: false });
  const materializations = new Map();
  const rawBytes = {};
  for (const slideId of snapshot.plan.ordered_slide_ids) {
    const materialization = snapshot.materializations.get(slideId);
    if (!materialization) {
      fail("progressive_raw_complete_review_stale", `current Complete Page Review raw bytes are unavailable for ${slideId}`);
    }
    materializations.set(slideId, materialization);
    rawBytes[slideId] = Buffer.from(materialization.bytes);
  }
  return Object.freeze({
    available: true,
    plan: snapshot.plan,
    complete_raw_review: review.record,
    complete_raw_review_sha256: review.sha256,
    materializations,
    raw_bytes_by_slide: Object.freeze(rawBytes),
  });
}

/** Read the current partial Pilot evidence and exact page materializations without writing. */
export function readCurrentProgressiveRawPilotWork({ runDir, workflow, expected_plan = null } = {}) {
  const current = loadPlanByHead(runDir, workflow);
  if (!current) return Object.freeze({ available: false });
  const snapshot = expected_plan
    ? requireCurrentPlan(current, current.plan.sha256, expected_plan)
    : current;
  const batch = latestBatch(snapshot);
  const evidence = batch?.record.is_partial_pilot
    ? snapshot.pilot.evidence_by_batch.get(batch.sha256) || null
    : null;
  if (!batch || !evidence) return Object.freeze({ available: false });
  const materializations = new Map();
  for (const slideId of batch.record.review_sample_slide_ids) {
    const materialization = snapshot.materializations.get(slideId);
    if (!materialization) {
      fail("progressive_raw_pilot_evidence_stale", `current Pilot raw bytes are unavailable for ${slideId}`);
    }
    materializations.set(slideId, materialization);
  }
  return Object.freeze({
    available: true,
    plan: snapshot.plan,
    batch: Object.freeze({ ...batch.record, sha256: batch.sha256 }),
    pilot_evidence: evidence.record,
    pilot_evidence_sha256: evidence.sha256,
    materializations,
  });
}
