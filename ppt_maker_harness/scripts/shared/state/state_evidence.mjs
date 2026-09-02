/**
 * state_evidence.mjs — target evidence recording, raw provider authorization,
 * local-compose rebind, and structural publication/replay.
 *
 * Part of the state module split. Imports core I/O from state.mjs. ESM circular
 * imports are accepted here: every module is function-declaration-only with
 * no top-level side effects that consume the imported bindings, so the cycle
 * resolves safely at call time.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "../image2/page_image_artifacts.mjs";
import {
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawWorkPlan,
} from "../image2/page_image_progressive_schema.mjs";
import { canonicalVersionKey, initialProductionIdentityRecord, inspectProductionIdentity, isProductionIdentityRecord, normalizeRunVersion, pipelineFromSourceMarker } from "../run-bundle/production_identity.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { hasCurrentPageImageSourceReceiptEnvelope } from "../page-image/page_image_source_receipt.mjs";
import { resolveExactExecution, readState, writeState, appendHistory, inspectRunProductionIdentity, probeSourceMarkerForVersion, ensureProductionIdentityContainer, styleMasterSelectionRecord, preserveReservedNodes } from "./state.mjs";
import { validateStyleMasterSelectionRecord } from "../image2/style_master_schema.mjs";
import { deepClone, nowIso, stableStringify } from "../util/state_helpers.mjs";
import { sha256 } from "../identity/byte_hash.mjs";

/** @private shared exact-execution gate (moved from state.mjs; not part of the
 * public state.mjs surface — imported by state_identity and state.mjs core). */
export function requireExactExecution(deckDir, selected, purpose = "execute") {
  const execution = resolveExactExecution(deckDir, { ...selected, purpose });
  if (!execution.ok) {
    const error = new Error(execution.code || "EXECUTION_RESOLUTION_FAILED");
    error.code = execution.code || "EXECUTION_RESOLUTION_FAILED";
    error.execution = execution;
    throw error;
  }
  return execution;
}

// ---- Public exports ----
export const PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA = "page-image-workflow-provider-authorization";
export const PAGE_IMAGE_TARGET_STATE_SCHEMA = "page-image-workflow-target-state";

const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function hasExactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}
function versionFromReservedKey(key) {
  return /^3_versions\/(v[1-9][0-9]*)$/.exec(key)?.[1] || null;
}

// ---- Target evidence helpers ----

const TARGET_EVIDENCE_RECORD_KEYS = Object.freeze([
  "schema", "run_version", "source_epoch", "source_receipt_sha256",
  "workflow", "provider_authorization_sha256", "accepted_raw_evidence_sha256",
  "final_manifest_sha256", "delivery_receipt_sha256",
]);

function nullableDigest(value) {
  return value === null || SHA256_RE.test(value || "");
}

/** @private exported for state_progressive */
export function targetEvidenceDigest(value) {
  return sha256(Buffer.from(stableStringify(value)));
}

/** @private exported for state_execution and state_identity */
export function validTargetEvidenceRecord(record, runVersion) {
  return hasExactKeys(record, TARGET_EVIDENCE_RECORD_KEYS) &&
    record.schema === PAGE_IMAGE_TARGET_STATE_SCHEMA &&
    record.run_version === runVersion &&
    Number.isInteger(record.source_epoch) && record.source_epoch > 0 &&
    SHA256_RE.test(record.source_receipt_sha256 || "") &&
    ["framed", "pure"].includes(record.workflow) &&
    nullableDigest(record.provider_authorization_sha256) &&
    nullableDigest(record.accepted_raw_evidence_sha256) &&
    nullableDigest(record.final_manifest_sha256) &&
    nullableDigest(record.delivery_receipt_sha256);
}

/** @private exported for state.mjs validateState */
export function validateTargetEvidenceStructure(state, errors) {
  const map = state.page_image_target_evidence;
  if (map === undefined) return;
  if (!isPlainObject(map) || !isPlainObject(map.by_version)) {
    errors.push("page_image_target_evidence must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) errors.push(`invalid page_image_target_evidence version key ${key}`);
    else if (!validTargetEvidenceRecord(record, runVersion)) errors.push(`invalid page_image_target_evidence record ${key}`);
  }
}

export function ensureTargetEvidenceContainer(state) {
  if (!isPlainObject(state.page_image_target_evidence) || !isPlainObject(state.page_image_target_evidence.by_version)) {
    state.page_image_target_evidence = { by_version: {} };
  }
}

export function targetEvidenceRecord(state, runVersion) {
  return state?.page_image_target_evidence?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

// ---- Source receipt helpers ----

function targetSourceFacts(receipt) {
  if (!hasCurrentPageImageSourceReceiptEnvelope(receipt) ||
    !SHA256_RE.test(receipt.source_sha256 || "") || !["framed", "pure"].includes(receipt.workflow) ||
    !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new Error("TARGET_SOURCE_RECEIPT_INVALID");
  }
  const slideIds = receipt.slides.map((slide) => slide?.slide_id);
  if (receipt.slides.some((slide, index) => !slide || slide.position !== index + 1 ||
    Object.hasOwn(slide, "workflow") || Object.hasOwn(slide, "authority") ||
    typeof slide.slide_id !== "string" || !slide.slide_id) ||
    new Set(slideIds).size !== slideIds.length) {
    throw new Error("TARGET_SOURCE_RECEIPT_INVALID");
  }
  return Object.freeze({ source_receipt_sha256: receipt.source_sha256, workflow: receipt.workflow });
}

function assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, runVersion, source) {
  const sourcePath = join(deckDir, "3_versions", runVersion, "slide-specifications.md");
  if (!existsSync(sourcePath)) throw new Error("TARGET_SOURCE_RECEIPT_STALE");
  const sourceBytes = readFileSync(sourcePath);
  if (sha256(sourceBytes) !== source.source_receipt_sha256) throw new Error("TARGET_SOURCE_RECEIPT_STALE");
  const marker = probeProductionMarker(sourceBytes, { source: "slide-specifications.md" });
  if (marker.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) throw new Error("TARGET_SOURCE_MARKER_INVALID");
  if (marker.frontmatter?.metadata?.production?.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_WORKFLOW_MISMATCH");
  }
  return Object.freeze({ marker, sourcePath });
}

export { targetSourceFacts, assertTargetSourceReceiptMatchesCanonicalBytes };

// ---- Local compose rebind helpers ----

function targetLocalComposeRebindFacts({
  previousSourceReceipt, nextSourceReceipt,
  previousRawWorkPlan, nextRawWorkPlan,
  previousAcceptedRawEvidence, nextAcceptedRawEvidence,
} = {}) {
  const previousSource = targetSourceFacts(previousSourceReceipt);
  const nextSource = targetSourceFacts(nextSourceReceipt);
  if (previousSource.workflow !== nextSource.workflow || previousSource.source_receipt_sha256 === nextSource.source_receipt_sha256) {
    throw new Error("TARGET_LOCAL_COMPOSE_SOURCE_TRANSITION_INVALID");
  }
  const previousPlan = validateRawWorkPlan(previousRawWorkPlan);
  const nextPlan = validateRawWorkPlan(nextRawWorkPlan);
  if (!previousPlan.ok || !nextPlan.ok ||
    previousRawWorkPlan.source_receipt_sha256 !== previousSource.source_receipt_sha256 ||
    nextRawWorkPlan.source_receipt_sha256 !== nextSource.source_receipt_sha256 ||
    previousRawWorkPlan.workflow !== previousSource.workflow ||
    nextRawWorkPlan.workflow !== nextSource.workflow ||
    previousRawWorkPlan.provider_profile_sha256 !== nextRawWorkPlan.provider_profile_sha256 ||
    stableStringify(previousRawWorkPlan.ordered_slide_ids) !== stableStringify(nextRawWorkPlan.ordered_slide_ids) ||
    stableStringify(previousRawWorkPlan.items) !== stableStringify(nextRawWorkPlan.items)) {
    throw new Error("TARGET_LOCAL_COMPOSE_RAW_CONTRACT_DRIFT");
  }
  const previousEvidence = validateAcceptedRawEvidence(previousAcceptedRawEvidence, { plan: previousRawWorkPlan });
  const nextEvidence = validateAcceptedRawEvidence(nextAcceptedRawEvidence, { plan: nextRawWorkPlan });
  if (!previousEvidence.ok || !nextEvidence.ok ||
    previousAcceptedRawEvidence.provider_authorization_sha256 !== nextAcceptedRawEvidence.provider_authorization_sha256 ||
    previousAcceptedRawEvidence.raw_review_sha256 !== nextAcceptedRawEvidence.raw_review_sha256 ||
    stableStringify(previousAcceptedRawEvidence.items) !== stableStringify(nextAcceptedRawEvidence.items)) {
    throw new Error("TARGET_LOCAL_COMPOSE_RAW_EVIDENCE_DRIFT");
  }
  return Object.freeze({ previousSource, nextSource, previousPlan, nextPlan, previousEvidence, nextEvidence });
}

// ---- Progressive handoff helpers (shared with state_progressive) ----

export const PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA_INTERNAL = "page-image-workflow-handoff";
const PROGRESSIVE_HANDOFF_RECORD_KEYS = Object.freeze([
  "schema", "run_version", "source_epoch", "source_receipt_sha256",
  "workflow", "raw_work_plan_sha256", "partial_pilot_decision_sha256",
  "complete_raw_review_sha256", "accepted_raw_evidence_sha256",
  "final_manifest_sha256", "delivery_receipt_sha256",
]);

/** @private exported for state_progressive */
export function validProgressiveHandoffRecord(record, runVersion) {
  return hasExactKeys(record, PROGRESSIVE_HANDOFF_RECORD_KEYS) &&
    record.schema === PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA_INTERNAL &&
    record.run_version === runVersion &&
    Number.isInteger(record.source_epoch) && record.source_epoch > 0 &&
    SHA256_RE.test(record.source_receipt_sha256 || "") &&
    ["framed", "pure"].includes(record.workflow) &&
    SHA256_RE.test(record.raw_work_plan_sha256 || "") &&
    nullableDigest(record.partial_pilot_decision_sha256) &&
    nullableDigest(record.complete_raw_review_sha256) &&
    nullableDigest(record.accepted_raw_evidence_sha256) &&
    nullableDigest(record.final_manifest_sha256) &&
    nullableDigest(record.delivery_receipt_sha256);
}

export function validateProgressiveHandoffStructure(state, errors) {
  const map = state.page_image_progressive_handoff;
  if (map === undefined) return;
  if (!hasExactKeys(map, ["by_version"]) || !isPlainObject(map.by_version)) {
    errors.push("page_image_progressive_handoff must contain only by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) errors.push(`invalid page_image_progressive_handoff version key ${key}`);
    else if (!validProgressiveHandoffRecord(record, runVersion)) errors.push(`invalid page_image_progressive_handoff record ${key}`);
  }
}

/** @private exported for state_progressive */
export function ensureProgressiveHandoffContainer(state) {
  if (!isPlainObject(state.page_image_progressive_handoff) || !isPlainObject(state.page_image_progressive_handoff.by_version)) {
    state.page_image_progressive_handoff = { by_version: {} };
  }
  return state.page_image_progressive_handoff.by_version;
}

/** @private exported for state_progressive */
export function progressiveHandoffRecord(state, runVersion) {
  return state?.page_image_progressive_handoff?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

function hasCurrentProgressiveRawHandoff(state, runVersion) {
  return validProgressiveHandoffRecord(progressiveHandoffRecord(state, runVersion), runVersion);
}

function assertDirectRawLifecycleAvailable(state, runVersion) {
  if (hasCurrentProgressiveRawHandoff(state, runVersion)) {
    throw new Error("TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED");
  }
}

export { hasCurrentProgressiveRawHandoff, assertDirectRawLifecycleAvailable };

// ---- Target evidence context (shared with state_identity and state_progressive) ----

export function targetEvidenceContext(deckDir, { runVersion, runDir, purpose = "execute" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion }, purpose);
  const inspection = inspectRunProductionIdentity(deckDir, { runVersion: exactVersion, purpose });
  if (!inspection.ok) throw new Error(inspection.code || "TARGET_STATE_UNAVAILABLE");
  if (!["framed", "pure"].includes(inspection.workflow)) {
    throw new Error("TARGET_WORKFLOW_REQUIRED");
  }
  const state = execution.state;
  const identityRecord = state.production_identity?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!isProductionIdentityRecord(identityRecord)) throw new Error("PAGE_IMAGE_STATE_INVALID");
  return Object.freeze({
    exactVersion, inspection, state, stateSha: execution.state_sha256,
    sourceIdentity: execution.source_identity, identityRecord,
    record: targetEvidenceRecord(state, exactVersion),
  });
}

// Note: targetEvidenceContext calls inspectRunProductionIdentity which is
// defined in state_identity.mjs. This creates a dependency cycle:
// state_evidence -> state_identity -> state_evidence. Since both are
// function-declaration-only the ESM cycle resolves safely at call time.

// ---- Raw provider authorization ----

function validPageImageRawAuthorizationRecord(record, runVersion) {
  const keys = ["schema", "run_version", "source_epoch", "source_receipt_sha256", "workflow", "raw_work_plan_sha256", "provider_profile_sha256", "authorization_scope_sha256", "max_submissions", "execution_id", "decided_at"];
  return hasExactKeys(record, keys) &&
    record.schema === PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA &&
    record.run_version === runVersion &&
    Number.isInteger(record.source_epoch) && record.source_epoch > 0 &&
    SHA256_RE.test(record.source_receipt_sha256 || "") &&
    ["framed", "pure"].includes(record.workflow) &&
    SHA256_RE.test(record.raw_work_plan_sha256 || "") &&
    SHA256_RE.test(record.provider_profile_sha256 || "") &&
    SHA256_RE.test(record.authorization_scope_sha256 || "") &&
    Number.isInteger(record.max_submissions) && record.max_submissions > 0 &&
    typeof record.execution_id === "string" && record.execution_id.length > 0 &&
    validIsoTimestamp(record.decided_at);
}

export function validatePageImageRawAuthorizationStructure(state, errors) {
  const map = state.page_image_raw_provider_authorization;
  if (map === undefined) return;
  if (!isPlainObject(map) || !isPlainObject(map.by_version)) {
    errors.push("page_image_raw_provider_authorization must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      errors.push(`invalid page_image_raw_provider_authorization version key ${key}`);
    } else if (!validPageImageRawAuthorizationRecord(record, runVersion)) {
      errors.push(`invalid page_image_raw_provider_authorization record ${key}`);
    }
  }
}

function pageImageAuthorizationScopeFromRawWorkPlan(rawWorkPlan) {
  const validation = validateRawWorkPlan(rawWorkPlan);
  if (!validation.ok) return null;
  return {
    raw_work_plan_sha256: validation.sha256,
    source_receipt_sha256: rawWorkPlan.source_receipt_sha256,
    workflow: rawWorkPlan.workflow,
    provider_profile_sha256: rawWorkPlan.provider_profile_sha256,
    authorization_scope_sha256: rawWorkPlan.authorization_scope_sha256,
  };
}

// ---- mutateTargetEvidenceRecord (shared with progressive via import) ----

function mutateTargetEvidenceRecord(deckDir, { runVersion, runDir, expectedStateSha = null, mutate } = {}) {
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  assertDirectRawLifecycleAvailable(context.state, context.exactVersion);
  if (!validTargetEvidenceRecord(context.record, context.exactVersion)) throw new Error("TARGET_STATE_INITIALIZATION_REQUIRED");
  if (context.record.source_epoch !== context.identityRecord.source_epoch || context.record.workflow !== context.inspection.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const record = next.page_image_target_evidence.by_version[canonicalVersionKey(context.exactVersion)];
  mutate(record, context);
  if (!validTargetEvidenceRecord(record, context.exactVersion)) throw new Error("TARGET_STATE_RECORD_INVALID");
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  return Object.freeze({ run_version: context.exactVersion, record: Object.freeze(structuredClone(record)) });
}

// ===== Public API functions =====

/** Persist accepted raw evidence only when it binds the initialized target tuple. */
export function recordTargetAcceptedRawEvidence(deckDir, { runVersion, runDir, rawWorkPlan, acceptedRawEvidence, expectedStateSha = null } = {}) {
  const plan = validateRawWorkPlan(rawWorkPlan);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!plan.ok || !evidence.ok) throw new Error(evidence.code || plan.code || "TARGET_RAW_EVIDENCE_INVALID");
  return mutateTargetEvidenceRecord(deckDir, {
    runVersion, runDir, expectedStateSha,
    mutate(record) {
      if (rawWorkPlan.source_receipt_sha256 !== record.source_receipt_sha256 || rawWorkPlan.workflow !== record.workflow ||
        acceptedRawEvidence.provider_authorization_sha256 !== record.provider_authorization_sha256) {
        throw new Error("TARGET_RAW_EVIDENCE_LINEAGE_MISMATCH");
      }
      record.accepted_raw_evidence_sha256 = evidence.sha256;
      record.final_manifest_sha256 = null;
      record.delivery_receipt_sha256 = null;
    },
  });
}

/** Persist final-manifest lineage only from the exact recorded raw evidence. */
export function recordTargetFinalManifest(deckDir, { runVersion, runDir, acceptedRawEvidence, finalManifest, expectedStateSha = null } = {}) {
  const final = validateFinalSlideManifest(finalManifest, { evidence: acceptedRawEvidence });
  if (!final.ok) throw new Error(final.code || "TARGET_FINAL_MANIFEST_INVALID");
  const evidenceDigest = targetEvidenceDigest(acceptedRawEvidence);
  return mutateTargetEvidenceRecord(deckDir, {
    runVersion, runDir, expectedStateSha,
    mutate(record) {
      if (record.accepted_raw_evidence_sha256 !== evidenceDigest || finalManifest.source_receipt_sha256 !== record.source_receipt_sha256 || finalManifest.workflow !== record.workflow) {
        throw new Error("TARGET_FINAL_MANIFEST_LINEAGE_MISMATCH");
      }
      record.final_manifest_sha256 = final.sha256;
      record.delivery_receipt_sha256 = null;
    },
  });
}

/** Persist one delivery reference after the exact recorded final manifest. */
export function recordTargetDeliveryReceipt(deckDir, { runVersion, runDir, deliveryReceipt, expectedStateSha = null } = {}) {
  if (!deliveryReceipt || deliveryReceipt.schema !== "page-image-delivery-receipt" ||
    !SHA256_RE.test(deliveryReceipt.final_manifest_sha256 || "") ||
    !SHA256_RE.test(deliveryReceipt.delivery_media_manifest_sha256 || "") ||
    !Number.isInteger(deliveryReceipt.source_epoch) || deliveryReceipt.source_epoch <= 0) {
    throw new Error("TARGET_DELIVERY_RECEIPT_INVALID");
  }
  return mutateTargetEvidenceRecord(deckDir, {
    runVersion, runDir, expectedStateSha,
    mutate(record) {
      if (deliveryReceipt.source_epoch !== record.source_epoch || deliveryReceipt.final_manifest_sha256 !== record.final_manifest_sha256) {
        throw new Error("TARGET_DELIVERY_LINEAGE_MISMATCH");
      }
      record.delivery_receipt_sha256 = targetEvidenceDigest(deliveryReceipt);
    },
  });
}

/**
 * Record the sole Page Image raw-submit decision. The source epoch is
 * always derived from authoritative state; callers cannot choose or advance it.
 */
export function recordPageImageRawProviderAuthorization(deckDir, { runVersion, runDir, rawWorkPlan, maxSubmissions, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  const targetPlan = pageImageAuthorizationScopeFromRawWorkPlan(rawWorkPlan);
  if (!targetPlan) throw new TypeError("rawWorkPlan must be a non-empty canonical Page Image raw input");
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) throw new TypeError("maxSubmissions must be a positive integer");
  const inspection = inspectRunProductionIdentity(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`Page Image authorization unavailable: ${inspection.code}`);
  if (inspection.workflow !== targetPlan.workflow) {
    throw new Error("Page Image target raw authorization requires the exact current workflow pair");
  }
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  assertDirectRawLifecycleAvailable(state, exactVersion);
  const sourceEpoch = state.production_identity?.by_version?.[canonicalVersionKey(exactVersion)]?.source_epoch;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("PAGE_IMAGE_STATE_INVALID: authoritative source_epoch is unavailable");
  const record = {
    schema: PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA,
    run_version: exactVersion, source_epoch: sourceEpoch,
    source_receipt_sha256: targetPlan.source_receipt_sha256, workflow: targetPlan.workflow,
    raw_work_plan_sha256: targetPlan.raw_work_plan_sha256,
    provider_profile_sha256: targetPlan.provider_profile_sha256,
    authorization_scope_sha256: targetPlan.authorization_scope_sha256,
    max_submissions: maxSubmissions, execution_id: state.execution_id, decided_at: nowIso(),
  };
  if (!validPageImageRawAuthorizationRecord(record, exactVersion)) throw new Error("derived Page Image authorization record is invalid");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  if (!isPlainObject(next.page_image_raw_provider_authorization) || !isPlainObject(next.page_image_raw_provider_authorization.by_version)) {
    next.page_image_raw_provider_authorization = { by_version: {} };
  }
  next.page_image_raw_provider_authorization.by_version[canonicalVersionKey(exactVersion)] = record;
  const targetEvidence = targetEvidenceRecord(next, exactVersion);
  if (!validTargetEvidenceRecord(targetEvidence, exactVersion)) throw new Error("TARGET_STATE_INITIALIZATION_REQUIRED");
  if (targetEvidence.source_epoch !== sourceEpoch || targetEvidence.source_receipt_sha256 !== record.source_receipt_sha256 || targetEvidence.workflow !== record.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  targetEvidence.provider_authorization_sha256 = targetEvidenceDigest(record);
  targetEvidence.accepted_raw_evidence_sha256 = null;
  targetEvidence.final_manifest_sha256 = null;
  targetEvidence.delivery_receipt_sha256 = null;
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: record.decided_at });
  appendHistory(deckDir, { type: "page_image_raw_provider_authorization", run_version: exactVersion, source_epoch: sourceEpoch, at: record.decided_at });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/** Verify an exact Page Image raw-submit decision immediately before submit. */
export function inspectPageImageRawProviderAuthorization(deckDir, { runVersion, runDir, rawWorkPlan, maxSubmissions } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  const targetPlan = pageImageAuthorizationScopeFromRawWorkPlan(rawWorkPlan);
  if (!targetPlan) return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_INVALID", run_version: exactVersion });
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_INVALID", run_version: exactVersion });
  const inspection = inspectRunProductionIdentity(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) return Object.freeze({ ok: false, code: inspection.code, run_version: exactVersion });
  if (inspection.workflow !== targetPlan.workflow) {
    return Object.freeze({ ok: false, code: "AUTHORIZATION_NOT_APPLICABLE", run_version: exactVersion, workflow: inspection.workflow });
  }
  const execution = resolveExactExecution(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!execution.ok) return Object.freeze({ ...execution, run_version: exactVersion });
  const state = execution.state;
  if (hasCurrentProgressiveRawHandoff(state, exactVersion)) {
    return Object.freeze({ ok: false, code: "TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED", run_version: exactVersion });
  }
  const record = state.page_image_raw_provider_authorization?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!validPageImageRawAuthorizationRecord(record, exactVersion)) return Object.freeze({ ok: false, code: "AUTHORIZATION_MISSING", run_version: exactVersion });
  const sourceEpoch = state.production_identity?.by_version?.[canonicalVersionKey(exactVersion)]?.source_epoch;
  if (record.source_epoch !== sourceEpoch) return Object.freeze({ ok: false, code: "AUTHORIZATION_SOURCE_EPOCH_STALE", run_version: exactVersion });
  if (record.execution_id !== state.execution_id) return Object.freeze({ ok: false, code: "AUTHORIZATION_EXECUTION_STALE", run_version: exactVersion });
  if (record.schema !== PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA ||
    record.source_receipt_sha256 !== targetPlan.source_receipt_sha256 ||
    record.workflow !== targetPlan.workflow ||
    record.raw_work_plan_sha256 !== targetPlan.raw_work_plan_sha256 ||
    record.provider_profile_sha256 !== targetPlan.provider_profile_sha256 ||
    record.authorization_scope_sha256 !== targetPlan.authorization_scope_sha256) {
    return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_MISMATCH", run_version: exactVersion });
  }
  if (record.max_submissions < maxSubmissions) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_EXCEEDED", run_version: exactVersion, authorized: record.max_submissions, required: maxSubmissions });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Read-only preflight for a selected workflow's local-compose evidence rebind.
 */
export function validateTargetAcceptedRawEvidenceLocalComposeRebind(deckDir, {
  runVersion, runDir, previousSourceReceipt, nextSourceReceipt,
  previousRawWorkPlan, nextRawWorkPlan, previousAcceptedRawEvidence, nextAcceptedRawEvidence,
  expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const facts = targetLocalComposeRebindFacts({
    previousSourceReceipt, nextSourceReceipt, previousRawWorkPlan, nextRawWorkPlan,
    previousAcceptedRawEvidence, nextAcceptedRawEvidence,
  });
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, facts.nextSource);
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  const versionKey = canonicalVersionKey(exactVersion);
  const identityRecord = state.production_identity?.by_version?.[versionKey];
  const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionIdentityRecord(identityRecord) || identityRecord.workflow !== facts.nextSource.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const existing = targetEvidenceRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(existing, exactVersion) ||
    existing.source_epoch !== identityRecord.source_epoch ||
    existing.source_receipt_sha256 !== facts.previousSource.source_receipt_sha256 ||
    existing.workflow !== facts.previousSource.workflow ||
    existing.provider_authorization_sha256 !== previousAcceptedRawEvidence.provider_authorization_sha256 ||
    existing.accepted_raw_evidence_sha256 !== facts.previousEvidence.sha256) {
    throw new Error("TARGET_LOCAL_COMPOSE_STATE_LINEAGE_MISMATCH");
  }
  const authorization = state.page_image_raw_provider_authorization?.by_version?.[versionKey];
  if (!validPageImageRawAuthorizationRecord(authorization, exactVersion) ||
    authorization.schema !== PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA ||
    targetEvidenceDigest(authorization) !== existing.provider_authorization_sha256 ||
    authorization.source_epoch !== existing.source_epoch ||
    authorization.workflow !== facts.previousSource.workflow ||
    authorization.provider_profile_sha256 !== previousRawWorkPlan.provider_profile_sha256) {
    throw new Error("TARGET_LOCAL_COMPOSE_AUTHORIZATION_STALE");
  }
  return Object.freeze({
    ok: true, run_version: exactVersion, source_epoch: existing.source_epoch,
    facts, state: Object.freeze(structuredClone(state)), state_sha256: execution.state_sha256,
  });
}

/**
 * Advance target source lineage without provider work only after the selected
 * workflow has proved that its raw contract and accepted raw bytes are exact
 * reusable facts. Callers must preflight before publishing derived artifacts.
 */
export function rebindTargetAcceptedRawEvidenceForLocalCompose(deckDir, args = {}) {
  const checked = validateTargetAcceptedRawEvidenceLocalComposeRebind(deckDir, args);
  const { exactVersion } = (() => ({ exactVersion: normalizeRunVersion(args.runVersion ?? args.runDir) }))();
  const versionKey = canonicalVersionKey(exactVersion);
  const facts = checked.facts;
  const state = checked.state;
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const record = next.page_image_target_evidence.by_version[versionKey];
  record.source_receipt_sha256 = facts.nextSource.source_receipt_sha256;
  record.accepted_raw_evidence_sha256 = facts.nextEvidence.sha256;
  record.final_manifest_sha256 = null;
  record.delivery_receipt_sha256 = null;
  if (!validTargetEvidenceRecord(record, exactVersion)) throw new Error("TARGET_STATE_RECORD_INVALID");
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: args.expectedStateSha ?? checked.state_sha256, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_image_target_local_compose_rebound", run_version: exactVersion,
    workflow: facts.nextSource.workflow, source_epoch: record.source_epoch,
    previous_source_receipt_sha256: facts.previousSource.source_receipt_sha256,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256,
    previous_raw_work_plan_sha256: facts.previousPlan.sha256,
    raw_work_plan_sha256: facts.nextPlan.sha256,
    previous_accepted_raw_evidence_sha256: facts.previousEvidence.sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256, at,
  });
  return Object.freeze({
    ok: true, run_version: exactVersion, source_epoch: record.source_epoch,
    record: Object.freeze(structuredClone(record)),
  });
}

function sameProgressiveRawTuples(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
    left.every((item, index) => item.slide_id === right[index]?.slide_id &&
      item.raw_contract_sha256 === right[index]?.raw_contract_sha256 &&
      item.raw_sha256 === right[index]?.raw_sha256);
}

function progressiveLocalRebindFacts({
  previousSourceReceipt, nextSourceReceipt,
  previousProgressiveRawWorkPlan, nextProgressiveRawWorkPlan,
  previousAcceptedRawEvidence, nextAcceptedRawEvidence,
} = {}) {
  const previousSource = targetSourceFacts(previousSourceReceipt);
  const nextSource = targetSourceFacts(nextSourceReceipt);
  const previousPlan = validateProgressiveRawWorkPlan(previousProgressiveRawWorkPlan);
  const nextPlan = validateProgressiveRawWorkPlan(nextProgressiveRawWorkPlan);
  if (previousSource.workflow !== nextSource.workflow || previousSource.source_receipt_sha256 === nextSource.source_receipt_sha256 ||
    !previousPlan.ok || !nextPlan.ok ||
    previousProgressiveRawWorkPlan.source_receipt_sha256 !== previousSource.source_receipt_sha256 ||
    nextProgressiveRawWorkPlan.source_receipt_sha256 !== nextSource.source_receipt_sha256 ||
    previousProgressiveRawWorkPlan.run_version !== nextProgressiveRawWorkPlan.run_version ||
    previousProgressiveRawWorkPlan.source_epoch !== nextProgressiveRawWorkPlan.source_epoch ||
    previousProgressiveRawWorkPlan.workflow !== previousSource.workflow ||
    nextProgressiveRawWorkPlan.workflow !== nextSource.workflow ||
    previousProgressiveRawWorkPlan.provider_profile_sha256 !== nextProgressiveRawWorkPlan.provider_profile_sha256 ||
    previousProgressiveRawWorkPlan.effective_style_master_sha256 !== nextProgressiveRawWorkPlan.effective_style_master_sha256 ||
    stableStringify(previousProgressiveRawWorkPlan.ordered_slide_ids) !== stableStringify(nextProgressiveRawWorkPlan.ordered_slide_ids) ||
    stableStringify(previousProgressiveRawWorkPlan.items) !== stableStringify(nextProgressiveRawWorkPlan.items)) {
    throw new Error("TARGET_PROGRESSIVE_LOCAL_REBIND_RAW_CONTRACT_DRIFT");
  }
  const previousEvidence = validateProgressiveAcceptedRawEvidence(previousAcceptedRawEvidence, { plan: previousProgressiveRawWorkPlan });
  const nextEvidence = validateProgressiveAcceptedRawEvidence(nextAcceptedRawEvidence, { plan: nextProgressiveRawWorkPlan });
  if (!previousEvidence.ok || !nextEvidence.ok ||
    !sameProgressiveRawTuples(previousAcceptedRawEvidence.items, nextAcceptedRawEvidence.items)) {
    throw new Error("TARGET_PROGRESSIVE_LOCAL_REBIND_RAW_EVIDENCE_DRIFT");
  }
  return Object.freeze({ previousSource, nextSource, previousPlan, nextPlan, previousEvidence, nextEvidence });
}

/**
 * Rebind source/state handoffs after the raw owner has published a fully
 * validated provider-free local-rebind successor. State keeps references
 * only; it never reconstructs or authorizes raw materialization facts.
 */
export function rebindTargetProgressiveRawEvidenceForLocalCompose(deckDir, {
  runVersion, runDir, previousSourceReceipt, nextSourceReceipt,
  previousProgressiveRawWorkPlan, nextProgressiveRawWorkPlan,
  previousAcceptedRawEvidence, nextAcceptedRawEvidence,
  expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const facts = progressiveLocalRebindFacts({
    previousSourceReceipt, nextSourceReceipt,
    previousProgressiveRawWorkPlan, nextProgressiveRawWorkPlan,
    previousAcceptedRawEvidence, nextAcceptedRawEvidence,
  });
  if (nextProgressiveRawWorkPlan.run_version !== exactVersion) {
    throw new Error("TARGET_PROGRESSIVE_LOCAL_REBIND_VERSION_MISMATCH");
  }
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, facts.nextSource);
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  const versionKey = canonicalVersionKey(exactVersion);
  const identityRecord = state.production_identity?.by_version?.[versionKey];
  const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionIdentityRecord(identityRecord) ||
    identityRecord.workflow !== facts.nextSource.workflow || identityRecord.source_epoch !== nextProgressiveRawWorkPlan.source_epoch) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const existing = targetEvidenceRecord(state, exactVersion);
  const previousHandoff = progressiveHandoffRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(existing, exactVersion) ||
    existing.source_epoch !== identityRecord.source_epoch ||
    existing.source_receipt_sha256 !== facts.previousSource.source_receipt_sha256 ||
    existing.workflow !== facts.previousSource.workflow ||
    !validProgressiveHandoffRecord(previousHandoff, exactVersion) ||
    previousHandoff.raw_work_plan_sha256 !== facts.previousPlan.sha256 ||
    previousHandoff.source_epoch !== previousProgressiveRawWorkPlan.source_epoch ||
    previousHandoff.source_receipt_sha256 !== facts.previousSource.source_receipt_sha256 ||
    previousHandoff.workflow !== facts.previousSource.workflow ||
    previousHandoff.accepted_raw_evidence_sha256 !== facts.previousEvidence.sha256) {
    throw new Error("TARGET_PROGRESSIVE_LOCAL_REBIND_STATE_LINEAGE_MISMATCH");
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const targetRecord = next.page_image_target_evidence.by_version[versionKey];
  targetRecord.source_receipt_sha256 = facts.nextSource.source_receipt_sha256;
  targetRecord.provider_authorization_sha256 = null;
  targetRecord.accepted_raw_evidence_sha256 = null;
  targetRecord.final_manifest_sha256 = null;
  targetRecord.delivery_receipt_sha256 = null;
  if (!validTargetEvidenceRecord(targetRecord, exactVersion)) throw new Error("TARGET_STATE_RECORD_INVALID");
  const handoffs = ensureProgressiveHandoffContainer(next);
  handoffs[versionKey] = {
    schema: PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA_INTERNAL, run_version: exactVersion,
    source_epoch: nextProgressiveRawWorkPlan.source_epoch,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256, workflow: facts.nextSource.workflow,
    raw_work_plan_sha256: facts.nextPlan.sha256, partial_pilot_decision_sha256: null,
    complete_raw_review_sha256: nextAcceptedRawEvidence.complete_raw_review_sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256, final_manifest_sha256: null, delivery_receipt_sha256: null,
  };
  if (!validProgressiveHandoffRecord(handoffs[versionKey], exactVersion)) throw new Error("TARGET_PROGRESSIVE_HANDOFF_INVALID");
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_image_progressive_local_rebind", run_version: exactVersion,
    workflow: facts.nextSource.workflow, source_epoch: targetRecord.source_epoch,
    previous_source_receipt_sha256: facts.previousSource.source_receipt_sha256,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256,
    previous_raw_work_plan_sha256: facts.previousPlan.sha256,
    raw_work_plan_sha256: facts.nextPlan.sha256,
    previous_accepted_raw_evidence_sha256: facts.previousEvidence.sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256, at,
  });
  return Object.freeze({
    ok: true, run_version: exactVersion, source_epoch: targetRecord.source_epoch,
    record: Object.freeze(structuredClone(targetRecord)),
    progressive_handoff: Object.freeze(structuredClone(handoffs[versionKey])),
  });
}

/**
 * Register one already-published current structural target with fresh evidence.
 */
export function registerTargetPageImageStructuralPublication(deckDir, {
  sourceRunVersion, sourceRunDir, targetRunVersion, targetRunDir,
  sourceReceipt, planHash, expectedStateSha = null,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion ?? sourceRunDir);
  const targetVersion = normalizeRunVersion(targetRunVersion ?? targetRunDir);
  if (!sourceVersion || !targetVersion || sourceVersion === targetVersion) {
    throw new TypeError("source and target run versions must be distinct canonical vN values");
  }
  if (!SHA256_RE.test(planHash || "")) throw new TypeError("target structural publication requires an exact plan hash");
  const targetSource = targetSourceFacts(sourceReceipt);
  const targetSourcePath = join(deckDir, "3_versions", targetVersion, "slide-specifications.md");
  if (!existsSync(targetSourcePath) || sha256(readFileSync(targetSourcePath)) !== targetSource.source_receipt_sha256) {
    throw new Error("TARGET_SOURCE_RECEIPT_STALE");
  }
  const execution = requireExactExecution(deckDir, { runVersion: sourceVersion });
  const state = execution.state;
  const sourceKey = canonicalVersionKey(sourceVersion);
  const targetKey = canonicalVersionKey(targetVersion);
  const sourceIdentityRecord = state.production_identity?.by_version?.[sourceKey];
  if (!isProductionIdentityRecord(sourceIdentityRecord)) throw new Error("TARGET_STRUCTURAL_SOURCE_IDENTITY_MISSING");
  const sourceMarker = probeSourceMarkerForVersion(deckDir, sourceVersion);
  const sourceInspection = inspectProductionIdentity({ state, runVersion: sourceVersion, sourceMarker });
  if (!sourceInspection.ok) throw new Error("TARGET_STRUCTURAL_SOURCE_IDENTITY_MISMATCH");
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!targetPipeline.ok || targetPipeline.pipeline !== "page-image-workflow" || targetPipeline.workflow !== targetSource.workflow) {
    throw new Error("TARGET_STRUCTURAL_TARGET_IDENTITY_MISMATCH");
  }
  const existingIdentity = state.production_identity?.by_version?.[targetKey];
  if (existingIdentity && (!isProductionIdentityRecord(existingIdentity) || existingIdentity.workflow !== targetSource.workflow)) {
    throw new Error("TARGET_STRUCTURAL_TARGET_IDENTITY_CONFLICT");
  }
  const existingEvidence = targetEvidenceRecord(state, targetVersion);
  if (existingEvidence && (!validTargetEvidenceRecord(existingEvidence, targetVersion) ||
    existingEvidence.source_epoch !== 1 || existingEvidence.source_receipt_sha256 !== targetSource.source_receipt_sha256 ||
    existingEvidence.workflow !== targetSource.workflow)) {
    throw new Error("TARGET_STRUCTURAL_TARGET_EVIDENCE_CONFLICT");
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  ensureProductionIdentityContainer(next);
  ensureTargetEvidenceContainer(next);
  if (!existingIdentity) {
    next.production_identity.by_version[targetKey] = initialProductionIdentityRecord(targetSource.workflow);
  }
  if (!existingEvidence) {
    next.page_image_target_evidence.by_version[targetKey] = {
      schema: PAGE_IMAGE_TARGET_STATE_SCHEMA, run_version: targetVersion,
      source_epoch: 1, source_receipt_sha256: targetSource.source_receipt_sha256,
      workflow: targetSource.workflow, provider_authorization_sha256: null,
      accepted_raw_evidence_sha256: null, final_manifest_sha256: null, delivery_receipt_sha256: null,
    };
  }
  next.playbook = "";
  next.current_node = "";
  next.execution_id = "";
  next.execution_started_at = "";
  next.run_version = "";
  next.nodes = preserveReservedNodes(next.nodes);
  next.playbook_stack = [];
  next.continuation_target_version = targetVersion;
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_image_target_structural_publication", source_version: sourceVersion,
    target_version: targetVersion, workflow: targetSource.workflow, plan_hash: planHash,
    source_epoch: 1, at,
  });
  return Object.freeze({
    ok: true, status: existingIdentity && existingEvidence ? "already-current" : "registered",
    source_version: sourceVersion, target_version: targetVersion,
    workflow: targetSource.workflow, source_epoch: 1,
  });
}

/**
 * Revalidate a previously published structural target without publishing or
 * touching current target execution.
 */
export function revalidateTargetPageImageStructuralReplay(deckDir, {
  sourceRunVersion, sourceRunDir, targetRunVersion, targetRunDir,
  sourceReceipt, planHash,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion ?? sourceRunDir);
  const targetVersion = normalizeRunVersion(targetRunVersion ?? targetRunDir);
  if (!sourceVersion || !targetVersion || sourceVersion === targetVersion) {
    throw new TypeError("source and target run versions must be distinct canonical vN values");
  }
  if (!SHA256_RE.test(planHash || "")) throw new TypeError("target structural replay requires an exact plan hash");
  const targetSource = targetSourceFacts(sourceReceipt);
  const targetSourcePath = join(deckDir, "3_versions", targetVersion, "slide-specifications.md");
  if (!existsSync(targetSourcePath) || sha256(readFileSync(targetSourcePath)) !== targetSource.source_receipt_sha256) {
    throw new Error("TARGET_STRUCTURAL_REPLAY_TARGET_SOURCE_DRIFT");
  }
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!targetPipeline.ok || targetPipeline.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE || targetPipeline.workflow !== targetSource.workflow) {
    throw new Error("TARGET_STRUCTURAL_REPLAY_TARGET_RECEIPT_DRIFT");
  }
  const state = readState(deckDir, { purpose: "observe", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  const sourceMarker = probeSourceMarkerForVersion(deckDir, sourceVersion);
  const sourceInspection = inspectProductionIdentity({ state, runVersion: sourceVersion, sourceMarker });
  if (!sourceInspection.ok) throw new Error("TARGET_STRUCTURAL_REPLAY_SOURCE_IDENTITY_DRIFT");
  const sourceKey = canonicalVersionKey(sourceVersion);
  const targetKey = canonicalVersionKey(targetVersion);
  const sourceIdentityRecord = state.production_identity?.by_version?.[sourceKey];
  const targetIdentityRecord = state.production_identity?.by_version?.[targetKey];
  if (!isProductionIdentityRecord(sourceIdentityRecord) || !isProductionIdentityRecord(targetIdentityRecord) ||
    targetIdentityRecord.workflow !== targetSource.workflow || targetIdentityRecord.source_epoch !== 1) {
    throw new Error("TARGET_STRUCTURAL_REPLAY_TARGET_IDENTITY_DRIFT");
  }
  const evidence = targetEvidenceRecord(state, targetVersion);
  if (!validTargetEvidenceRecord(evidence, targetVersion) || evidence.source_epoch !== targetIdentityRecord.source_epoch ||
    evidence.source_receipt_sha256 !== targetSource.source_receipt_sha256 || evidence.workflow !== targetSource.workflow) {
    throw new Error("TARGET_STRUCTURAL_REPLAY_TARGET_EVIDENCE_DRIFT");
  }
  const selection = styleMasterSelectionRecord(state, targetVersion);
  if (selection) {
    const checkedSelection = validateStyleMasterSelectionRecord(selection, {
      expectedRunVersion: targetVersion,
      expectedWorkflow: targetSource.workflow,
    });
    if (!checkedSelection.ok) throw new Error("TARGET_STRUCTURAL_REPLAY_TARGET_STYLE_MASTER_DRIFT");
  }
  return Object.freeze({
    ok: true, status: "exact-replay", source_version: sourceVersion,
    source_workflow: sourceInspection.workflow, source_epoch: sourceInspection.source_epoch,
    target_version: targetVersion, workflow: targetSource.workflow,
    target_source_epoch: targetIdentityRecord.source_epoch, selection_present: Boolean(selection),
  });
}