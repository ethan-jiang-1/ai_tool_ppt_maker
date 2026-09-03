/**
 * state_progressive.mjs — progressive handoff lifecycle: raw plan, pilot
 * decision, review, accepted evidence, final manifest, delivery receipt,
 * CLI authorize/checkpoint handoffs, and Style Master authorize handoff.
 *
 * Part of the state module split. Imports core I/O from state.mjs and shared
 * helpers from state_evidence.mjs. ESM circular imports are accepted here:
 * every module is function-declaration-only with no top-level side effects
 * that consume the imported bindings, so the cycle resolves safely at call time.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROGRESSIVE_RAW_WORK_PLAN_SCHEMA,
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawWorkPlan,
} from "../image2/page_image_progressive_schema.mjs";
import { readProgressiveRawPlanDirectRecords } from "../image2/page_image_progressive_store.mjs";
import { validateFinalSlideManifest } from "../image2/page_image_artifacts.mjs";
import { validateStyleMasterSelectionRecord } from "../image2/style_master_schema.mjs";
import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { canonicalVersionKey, normalizeRunVersion } from "../run-bundle/production_identity.mjs";
import { buildPlaybookIndex, controllerActiveNodeIds, validatePlaybookIndex } from "./md_controller_reader.mjs";
import {
  targetEvidenceContext,
  validTargetEvidenceRecord,
  hasCurrentProgressiveRawHandoff,
  targetEvidenceDigest,
  ensureProgressiveHandoffContainer,
  progressiveHandoffRecord,
  validProgressiveHandoffRecord,
  assertDirectRawLifecycleAvailable,
  PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA_INTERNAL,
} from "./state_evidence.mjs";
import { writeState, appendHistory } from "./state.mjs";
import { setNodeEvidence, setNodeStatus, activeRecord, startPlaybook, createDefaultState } from "./state_execution.mjs";
import { taskMandateRecord, currentTaskMandateMatches, taskMandateReference } from "./state_identity.mjs";
import { deepClone, nowIso, stableStringify, isPlainObject, hasExactKeys, validIsoTimestamp } from "../util/state_helpers.mjs";
import { sha256 } from "../identity/byte_hash.mjs";

// ---- Public exports ----
export const PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA = "page-image-workflow-handoff";
export const PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY = "exact-batch-grant-recorded";
export const STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY = "style-master-grant-recorded";

const SHA256_RE = /^[0-9a-f]{64}$/;
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");

// (isPlainObject, hasExactKeys, validIsoTimestamp moved to shared/util/state_helpers.mjs)

// ---- Progressive plan facts ----
function progressivePlanFacts(progressiveRawWorkPlan) {
  const checked = validateProgressiveRawWorkPlan(progressiveRawWorkPlan);
  if (!checked.ok) throw new Error(checked.code || "TARGET_PROGRESSIVE_PLAN_INVALID");
  return Object.freeze({
    sha256: checked.sha256, run_version: progressiveRawWorkPlan.run_version,
    source_epoch: progressiveRawWorkPlan.source_epoch,
    source_receipt_sha256: progressiveRawWorkPlan.source_receipt_sha256,
    workflow: progressiveRawWorkPlan.workflow,
  });
}

// ---- mutateProgressiveHandoff ----
function mutateProgressiveHandoff(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, expectedStateSha = null, mutate,
} = {}) {
  const facts = progressivePlanFacts(progressiveRawWorkPlan);
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  if (!validTargetEvidenceRecord(context.record, context.exactVersion) ||
    context.record.source_epoch !== context.identityRecord.source_epoch ||
    context.record.workflow !== context.inspection.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  if (facts.run_version !== context.exactVersion ||
    facts.source_epoch !== context.record.source_epoch ||
    facts.source_receipt_sha256 !== context.record.source_receipt_sha256 ||
    facts.workflow !== context.record.workflow) {
    throw new Error("TARGET_PROGRESSIVE_HANDOFF_LINEAGE_MISMATCH");
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const handoffs = ensureProgressiveHandoffContainer(next);
  const versionKey = canonicalVersionKey(context.exactVersion);
  const previous = handoffs[versionKey] || null;
  const record = previous && validProgressiveHandoffRecord(previous, context.exactVersion) &&
    previous.raw_work_plan_sha256 === facts.sha256 &&
    previous.source_epoch === facts.source_epoch &&
    previous.source_receipt_sha256 === facts.source_receipt_sha256 &&
    previous.workflow === facts.workflow
    ? previous
    : {
      schema: PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA_INTERNAL, run_version: context.exactVersion,
      source_epoch: facts.source_epoch, source_receipt_sha256: facts.source_receipt_sha256,
      workflow: facts.workflow, raw_work_plan_sha256: facts.sha256,
      partial_pilot_decision_sha256: null, complete_raw_review_sha256: null,
      accepted_raw_evidence_sha256: null, final_manifest_sha256: null, delivery_receipt_sha256: null,
    };
  handoffs[versionKey] = record;
  mutate(record, facts, context);
  if (!validProgressiveHandoffRecord(record, context.exactVersion)) throw new Error("TARGET_PROGRESSIVE_HANDOFF_INVALID");
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  return Object.freeze({ run_version: context.exactVersion, record: Object.freeze(structuredClone(record)) });
}

// ===== Public API functions =====

/** Record the provider-free plan reference without copying raw-owner facts into state. */
export function recordTargetProgressiveRawPlan(deckDir, { runVersion, runDir, progressiveRawWorkPlan, expectedStateSha = null } = {}) {
  return mutateProgressiveHandoff(deckDir, { runVersion, runDir, progressiveRawWorkPlan, expectedStateSha, mutate() {} });
}

/** Persist only the exact partial-Pilot decision reference for Controller resume. */
export function recordTargetProgressivePilotDecision(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, pilotDecisionSha256, expectedStateSha = null,
} = {}) {
  if (!SHA256_RE.test(pilotDecisionSha256 || "")) throw new TypeError("pilotDecisionSha256 must be a lowercase SHA-256");
  return mutateProgressiveHandoff(deckDir, {
    runVersion, runDir, progressiveRawWorkPlan, expectedStateSha,
    mutate(record) { record.partial_pilot_decision_sha256 = pilotDecisionSha256; },
  });
}

/** Persist only the exact complete-review reference for Controller resume. */
export function recordTargetProgressiveCompleteRawReview(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, completeRawReviewSha256, expectedStateSha = null,
} = {}) {
  if (!SHA256_RE.test(completeRawReviewSha256 || "")) throw new TypeError("completeRawReviewSha256 must be a lowercase SHA-256");
  return mutateProgressiveHandoff(deckDir, {
    runVersion, runDir, progressiveRawWorkPlan, expectedStateSha,
    mutate(record) {
      record.complete_raw_review_sha256 = completeRawReviewSha256;
      record.accepted_raw_evidence_sha256 = null;
      record.final_manifest_sha256 = null;
      record.delivery_receipt_sha256 = null;
    },
  });
}

/** Persist the accepted-evidence reference only after raw-owner validation. */
export function recordTargetProgressiveAcceptedRawEvidence(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, acceptedRawEvidence, expectedStateSha = null,
} = {}) {
  const facts = progressivePlanFacts(progressiveRawWorkPlan);
  const evidence = validateProgressiveAcceptedRawEvidence(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  if (!evidence.ok || acceptedRawEvidence.raw_work_plan_sha256 !== facts.sha256) {
    throw new Error(evidence.code || "TARGET_PROGRESSIVE_RAW_EVIDENCE_INVALID");
  }
  return mutateProgressiveHandoff(deckDir, {
    runVersion, runDir, progressiveRawWorkPlan, expectedStateSha,
    mutate(record) {
      record.complete_raw_review_sha256 = acceptedRawEvidence.complete_raw_review_sha256;
      record.accepted_raw_evidence_sha256 = evidence.sha256;
      record.final_manifest_sha256 = null;
      record.delivery_receipt_sha256 = null;
    },
  });
}

/** Persist selected-workflow final-manifest lineage from exact accepted evidence. */
export function recordTargetProgressiveFinalManifest(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, acceptedRawEvidence, finalManifest, expectedStateSha = null,
} = {}) {
  const evidence = validateProgressiveAcceptedRawEvidence(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  const final = validateFinalSlideManifest(finalManifest, { evidence: acceptedRawEvidence });
  if (!evidence.ok || !final.ok) throw new Error(final.code || evidence.code || "TARGET_PROGRESSIVE_FINAL_MANIFEST_INVALID");
  return mutateProgressiveHandoff(deckDir, {
    runVersion, runDir, progressiveRawWorkPlan, expectedStateSha,
    mutate(record) {
      if (record.accepted_raw_evidence_sha256 !== evidence.sha256 ||
        finalManifest.source_receipt_sha256 !== record.source_receipt_sha256 ||
        finalManifest.workflow !== record.workflow) {
        throw new Error("TARGET_PROGRESSIVE_FINAL_MANIFEST_LINEAGE_MISMATCH");
      }
      record.final_manifest_sha256 = final.sha256;
      record.delivery_receipt_sha256 = null;
    },
  });
}

/** Persist delivery lineage without converting it into raw-work authority. */
export function recordTargetProgressiveDeliveryReceipt(deckDir, {
  runVersion, runDir, progressiveRawWorkPlan, deliveryReceipt, expectedStateSha = null,
} = {}) {
  if (!deliveryReceipt || deliveryReceipt.schema !== "page-image-delivery-receipt" ||
    !SHA256_RE.test(deliveryReceipt.final_manifest_sha256 || "") ||
    !SHA256_RE.test(deliveryReceipt.delivery_media_manifest_sha256 || "") ||
    !Number.isInteger(deliveryReceipt.source_epoch) || deliveryReceipt.source_epoch <= 0) {
    throw new Error("TARGET_DELIVERY_RECEIPT_INVALID");
  }
  return mutateProgressiveHandoff(deckDir, {
    runVersion, runDir, progressiveRawWorkPlan, expectedStateSha,
    mutate(record) {
      if (deliveryReceipt.source_epoch !== record.source_epoch ||
        deliveryReceipt.final_manifest_sha256 !== record.final_manifest_sha256) {
        throw new Error("TARGET_PROGRESSIVE_DELIVERY_LINEAGE_MISMATCH");
      }
      record.delivery_receipt_sha256 = targetEvidenceDigest(deliveryReceipt);
    },
  });
}

/** Read the narrow progressive handoff; callers must still revalidate raw-owner records. */
export function readTargetProgressiveHandoff(deckDir, { runVersion, runDir } = {}) {
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "observe" });
  const record = progressiveHandoffRecord(context.state, context.exactVersion);
  if (!validProgressiveHandoffRecord(record, context.exactVersion) ||
    record.source_epoch !== context.record?.source_epoch ||
    record.source_receipt_sha256 !== context.record?.source_receipt_sha256 ||
    record.workflow !== context.record?.workflow) {
    return null;
  }
  return Object.freeze(structuredClone(record));
}

// ---- CLI authorize/checkpoint handoff helpers ----

function progressiveAuthorizeNodeId(workflow, batchKind) {
  if (!["framed", "pure"].includes(workflow) || !["pilot", "expansion"].includes(batchKind)) return null;
  return `authorize-target-${workflow}-${batchKind}`;
}

function progressiveAuthorizeCliEvidenceNote({ planHash, batchHash, grantHash, taskMandateSha256 } = {}) {
  return `plan=${planHash}; batch=${batchHash}; grant=${grantHash}; task-mandate=${taskMandateSha256}`;
}

function validProgressiveAuthorizeCliEvidence(evidence) {
  return isPlainObject(evidence) &&
    evidence.met === true && evidence.kind === "cli" &&
    typeof evidence.note === "string" &&
    /^plan=[0-9a-f]{64}; batch=[0-9a-f]{64}; grant=[0-9a-f]{64}; task-mandate=[0-9a-f]{64}$/.test(evidence.note);
}

function progressiveAuthorizeHandoffFailure(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

/**
 * Complete only the matching stable authorize node after `image2 authorize`
 * has already recorded or replayed its immutable raw-owner grant.
 */
export function recordTargetProgressiveAuthorizeCliHandoff(deckDir, {
  runVersion, runDir, planHash, batchHash, grantHash, expectedStateSha = null,
} = {}) {
  for (const [label, value] of Object.entries({ planHash, batchHash, grantHash })) {
    if (!SHA256_RE.test(value || "")) throw new TypeError(`${label} must be a lowercase SHA-256`);
  }
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  if (!validTargetEvidenceRecord(context.record, context.exactVersion) ||
    context.record.source_epoch !== context.identityRecord.source_epoch ||
    context.record.workflow !== context.inspection.workflow) {
    progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_STATE_INVALID");
  }
  let direct;
  try {
    direct = readProgressiveRawPlanDirectRecords(join(deckDir, "3_versions", context.exactVersion), { plan_sha256: planHash });
  } catch (error) {
    progressiveAuthorizeHandoffFailure(error?.code || "TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_DIRECT_RECORD_INVALID");
  }
  const plan = direct.plan.record;
  const planFacts = progressivePlanFacts(plan);
  if (planFacts.sha256 !== planHash || plan.schema !== PROGRESSIVE_RAW_WORK_PLAN_SCHEMA ||
    planFacts.run_version !== context.exactVersion ||
    planFacts.source_epoch !== context.record.source_epoch ||
    planFacts.source_receipt_sha256 !== context.record.source_receipt_sha256 ||
    planFacts.workflow !== context.record.workflow) {
    progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_PLAN_MISMATCH");
  }
  const mandate = taskMandateRecord(context.state, context.exactVersion);
  if (!currentTaskMandateMatches(mandate, context, plan.workflow) ||
    plan.task_mandate_sha256 !== taskMandateReference(mandate)) {
    progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_MANDATE_MISMATCH");
  }
  const batch = direct.batches.find((entry) => entry.sha256 === batchHash) || null;
  const grant = direct.grants.find((entry) => entry.sha256 === grantHash) || null;
  if (!batch || !grant || grant.record.plan_sha256 !== planHash ||
    grant.record.batch_sha256 !== batchHash || grant.record.run_version !== plan.run_version ||
    grant.record.workflow !== plan.workflow || grant.record.maximum_submissions !== batch.record.maximum_submissions ||
    canonicalJsonSha256(grant.record.ordered_slide_ids) !== canonicalJsonSha256(batch.record.paid_submission_slide_ids)) {
    progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_GRANT_MISMATCH");
  }
  const expectedNodeId = progressiveAuthorizeNodeId(plan.workflow, batch.record.kind);
  if (!expectedNodeId) progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_BATCH_KIND_INVALID");
  const base = Object.freeze({
    ok: true, run_version: context.exactVersion, workflow: plan.workflow,
    node_id: expectedNodeId, plan_hash: planHash, batch_hash: batchHash,
    grant_hash: grantHash, task_mandate_sha256: plan.task_mandate_sha256,
  });
  if (context.state.playbook !== "create-deck" || context.state.current_node !== expectedNodeId) {
    return Object.freeze({ ...base, status: "not-applicable", current_node: context.state.current_node || null });
  }
  const note = progressiveAuthorizeCliEvidenceNote({ planHash, batchHash, grantHash, taskMandateSha256: plan.task_mandate_sha256 });
  const existing = activeRecord(context.state, expectedNodeId);
  const existingEvidence = existing?.evidence?.[PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY] || null;
  const evidenceIsCurrent = validProgressiveAuthorizeCliEvidence(existingEvidence) && existingEvidence.note === note;
  const supersedesPriorCliGrant = existing?.status === "completed" &&
    !evidenceIsCurrent && validProgressiveAuthorizeCliEvidence(existingEvidence) &&
    Object.keys(existing.evidence || {}).length === 1;
  if (existing?.status === "completed") {
    if (evidenceIsCurrent) return Object.freeze({ ...base, status: "replay" });
    if (!supersedesPriorCliGrant) progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_NODE_CONFLICT");
  }
  if (existing && !["pending", "in_progress"].includes(existing.status) && !supersedesPriorCliGrant) {
    progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_NODE_STATE_INVALID");
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  if (!evidenceIsCurrent) {
    setNodeEvidence(next, expectedNodeId, PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY, {
      kind: "cli", note,
    }, { runVersion: context.exactVersion });
  }
  setNodeStatus(next, expectedNodeId, "completed", {}, { runVersion: context.exactVersion });
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  appendHistory(deckDir, {
    type: "page_image_progressive_authorize_cli_handoff", run_version: context.exactVersion,
    workflow: plan.workflow, node_id: expectedNodeId, plan_sha256: planHash,
    batch_sha256: batchHash, grant_sha256: grantHash,
    task_mandate_sha256: plan.task_mandate_sha256,
    ...(supersedesPriorCliGrant ? { supersedes_prior_cli_grant: true } : {}),
  });
  return Object.freeze({
    ...base, status: supersedesPriorCliGrant ? "superseded" : evidenceIsCurrent ? "repaired" : "completed",
  });
}

function progressiveCheckpointHandoffFailure(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

/**
 * Project the durable create-deck cursor onto the Controller node matching the
 * raw owner's current checkpoint action.
 */
export function recordTargetProgressiveCheckpointCliHandoff(deckDir, {
  runVersion, runDir, checkpoint_node, action_id = null,
  plan_hash = null, batch_hash = null, requires_human = false,
  waiting_for = null, expectedStateSha = null, playbookDir = DEFAULT_PLAYBOOK_DIR,
} = {}) {
  for (const [label, value] of Object.entries({ plan_hash, batch_hash })) {
    if (value != null && !SHA256_RE.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256`);
  }
  const nodeId = checkpoint_node == null ? null : String(checkpoint_node);
  if (!nodeId || !/^[a-z][a-z0-9-]{0,127}$/.test(nodeId)) {
    progressiveCheckpointHandoffFailure("TARGET_PROGRESSIVE_CHECKPOINT_NODE_INVALID");
  }
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  if (context.state.playbook !== "create-deck" ||
    !validTargetEvidenceRecord(context.record, context.exactVersion) ||
    context.record.source_epoch !== context.identityRecord.source_epoch ||
    context.record.workflow !== context.inspection.workflow) {
    progressiveCheckpointHandoffFailure("TARGET_PROGRESSIVE_CHECKPOINT_STATE_INVALID");
  }
  const workflow = context.record.workflow;
  const index = buildPlaybookIndex(playbookDir);
  if (!validatePlaybookIndex(index).valid) {
    progressiveCheckpointHandoffFailure("TARGET_PROGRESSIVE_CHECKPOINT_MANIFEST_INVALID");
  }
  const active = controllerActiveNodeIds(index, "create-deck", workflow);
  const checkpointIndex = active.indexOf(nodeId);
  if (checkpointIndex < 0) {
    progressiveCheckpointHandoffFailure("TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN");
  }
  const currentIndex = active.indexOf(context.state.current_node);
  if (currentIndex < 0) {
    progressiveCheckpointHandoffFailure("TARGET_PROGRESSIVE_CHECKPOINT_NODE_CONFLICT");
  }
  const base = Object.freeze({
    ok: true, run_version: context.exactVersion, workflow, node_id: nodeId, action_id: action_id || null,
  });
  if (currentIndex === checkpointIndex) {
    return Object.freeze({ ...base, status: "current", from_node: context.state.current_node, to_node: nodeId });
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  let completedCount = 0;
  for (let i = 0; i < checkpointIndex; i += 1) {
    const prior = active[i];
    const record = next.nodes?.[prior];
    if (!record || record.status === "in_progress") {
      setNodeStatus(next, prior, "completed", {}, { runVersion: context.exactVersion });
      completedCount += 1;
    }
  }
  const extra = {};
  if (requires_human && waiting_for) extra.waiting_for = String(waiting_for);
  setNodeStatus(next, nodeId, "in_progress", extra, { runVersion: context.exactVersion });
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  appendHistory(deckDir, {
    type: "page_image_progressive_checkpoint_cli_handoff", run_version: context.exactVersion,
    workflow, node_id: nodeId, action_id: action_id || null,
    ...(plan_hash ? { plan_sha256: plan_hash } : {}),
    ...(batch_hash ? { batch_sha256: batch_hash } : {}),
    ...(requires_human ? { requires_human: true } : {}),
  });
  return Object.freeze({
    ...base, status: "advanced", from_node: context.state.current_node,
    to_node: nodeId, completed_count: completedCount,
  });
}

function styleMasterAuthorizeNodeId(workflow) {
  if (!["framed", "pure"].includes(workflow)) return null;
  return `authorize-target-${workflow}-style-master`;
}

function styleMasterAuthorizeCliEvidenceNote({ planHash, grantHash } = {}) {
  return `plan=${planHash}; grant=${grantHash}`;
}

function validStyleMasterAuthorizeCliEvidence(evidence) {
  return isPlainObject(evidence) &&
    evidence.met === true && evidence.kind === "cli" &&
    typeof evidence.note === "string" &&
    /^plan=[0-9a-f]{64}; grant=[0-9a-f]{64}$/.test(evidence.note);
}

function styleMasterAuthorizeHandoffFailure(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

/**
 * Complete only the matching stable Style Master authorize node after
 * `style-master authorize` has already recorded or replayed its immutable
 * candidate grant.
 */
export function recordStyleMasterAuthorizeCliHandoff(deckDir, {
  runVersion, runDir, planHash, grantHash, workflow, expectedStateSha = null,
} = {}) {
  for (const [label, value] of Object.entries({ planHash, grantHash })) {
    if (!SHA256_RE.test(value || "")) throw new TypeError(`${label} must be a lowercase SHA-256`);
  }
  const expectedNodeId = styleMasterAuthorizeNodeId(workflow);
  if (!expectedNodeId) styleMasterAuthorizeHandoffFailure("STYLE_MASTER_AUTHORIZE_HANDOFF_WORKFLOW_INVALID");
  let context = null;
  try {
    context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  } catch {
    context = null;
  }
  const base = Object.freeze({
    ok: true, run_version: context?.exactVersion ?? null,
    workflow, node_id: expectedNodeId, plan_hash: planHash, grant_hash: grantHash,
  });
  if (!context ||
    !validTargetEvidenceRecord(context.record, context.exactVersion) ||
    context.record.source_epoch !== context.identityRecord.source_epoch ||
    context.record.workflow !== context.inspection.workflow ||
    context.record.workflow !== workflow ||
    context.state.playbook !== "create-deck" ||
    context.state.current_node !== expectedNodeId) {
    return Object.freeze({
      ...base, status: "not-applicable",
      ...(context ? { current_node: context.state.current_node || null } : {}),
    });
  }
  const note = styleMasterAuthorizeCliEvidenceNote({ planHash, grantHash });
  const existing = activeRecord(context.state, expectedNodeId);
  const existingEvidence = existing?.evidence?.[STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY] || null;
  const evidenceIsCurrent = validStyleMasterAuthorizeCliEvidence(existingEvidence) && existingEvidence.note === note;
  const supersedesPriorCliGrant = existing?.status === "completed" &&
    !evidenceIsCurrent && validStyleMasterAuthorizeCliEvidence(existingEvidence) &&
    Object.keys(existing.evidence || {}).length === 1;
  if (existing?.status === "completed") {
    if (evidenceIsCurrent) return Object.freeze({ ...base, status: "replay" });
    if (!supersedesPriorCliGrant) styleMasterAuthorizeHandoffFailure("STYLE_MASTER_AUTHORIZE_HANDOFF_NODE_CONFLICT");
  }
  if (existing && !["pending", "in_progress"].includes(existing.status) && !supersedesPriorCliGrant) {
    styleMasterAuthorizeHandoffFailure("STYLE_MASTER_AUTHORIZE_HANDOFF_NODE_STATE_INVALID");
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  if (!evidenceIsCurrent) {
    setNodeEvidence(next, expectedNodeId, STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY, {
      kind: "cli", note,
    }, { runVersion: context.exactVersion });
  }
  setNodeStatus(next, expectedNodeId, "completed", {}, { runVersion: context.exactVersion });
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  appendHistory(deckDir, {
    type: "style_master_authorize_cli_handoff", run_version: context.exactVersion,
    workflow, node_id: expectedNodeId, plan_sha256: planHash, grant_sha256: grantHash,
    ...(supersedesPriorCliGrant ? { supersedes_prior_cli_grant: true } : {}),
  });
  return Object.freeze({
    ...base, status: supersedesPriorCliGrant ? "superseded" : evidenceIsCurrent ? "repaired" : "completed",
  });
}

/**
 * Read one normal MD Controller decision for a current progressive route.
 */
export function readTargetProgressiveControllerDecision(deckDir, { runVersion, runDir, nodeId } = {}) {
  if (typeof nodeId !== "string" || !nodeId) return null;
  let context;
  try {
    context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "observe" });
  } catch {
    return null;
  }
  if (!hasCurrentProgressiveRawHandoff(context.state, context.exactVersion)) return null;
  const record = activeRecord(context.state, nodeId);
  const decision = record?.decision;
  if (!decision || typeof decision.value !== "string" || !["user", "agent", "cli"].includes(decision.kind) ||
    !validIsoTimestamp(decision.at)) {
    return null;
  }
  return Object.freeze({
    value: decision.value, kind: decision.kind, at: decision.at,
    ...(typeof decision.note === "string" ? { note: decision.note } : {}),
  });
}