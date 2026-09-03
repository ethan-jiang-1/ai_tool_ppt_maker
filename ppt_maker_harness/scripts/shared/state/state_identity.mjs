/**
 * state_identity.mjs — version identity, adapter resolution, Style Master
 * selection, task mandate lifecycle, and target source-state inspection.
 *
 * Part of the state module split. Imports core I/O from state.mjs and shared
 * private helpers from state_evidence.mjs/state_execution.mjs. The dependency
 * graph is a DAG: state.mjs (base) ← state_identity ← state_evidence ← state_execution.
 */
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPlaybookIndex,
  controllerDraftRouteNodes,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import {
  canonicalVersionKey,
  initialProductionIdentityRecord,
  inspectProductionIdentity,
  isProductionIdentityRecord,
  normalizeRunVersion,
  pipelineFromSourceMarker,
} from "../run-bundle/production_identity.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE } from "../run-bundle/production_marker.mjs";
import { validateStyleMasterSelectionRecord } from "../image2/style_master_schema.mjs";
import { deepClone, nowIso, stableStringify, isPlainObject, hasExactKeys, validIsoTimestamp, versionFromReservedKey, deepFreeze } from "../util/state_helpers.mjs";
import { sha256 } from "../identity/byte_hash.mjs";
import {
  resolveExactExecution,
  writeState,
  appendHistory,
  readState,
  statePath,
  executionLeasePath,
  EXECUTION_LEASE_SCHEMA,
  inspectRunProductionIdentity,
  styleMasterSelectionRecord,
  styleMasterSourceWorkflow,
  styleMasterSelectionExpectedWorkflow,
  ensureProductionIdentityContainer,
  probeSourceMarkerForVersion,
} from "./state.mjs";
import { createDefaultState, startPlaybook } from "./state_execution.mjs";
import {
  targetEvidenceContext,
  targetEvidenceRecord,
  validTargetEvidenceRecord,
  ensureTargetEvidenceContainer,
  targetSourceFacts,
  assertTargetSourceReceiptMatchesCanonicalBytes,
  hasCurrentProgressiveRawHandoff,
  requireExactExecution,
  PAGE_IMAGE_TARGET_STATE_SCHEMA,
} from "./state_evidence.mjs";

// ---- Public exports ----
export const PAGE_IMAGE_TASK_MANDATE_SCHEMA = "page-image-task-mandate";
export const PAGE_IMAGE_TASK_MANDATE_SCOPE = "normal-page-image-production";

const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

// ---- Private helpers (deepFreeze, isPlainObject, hasExactKeys, validIsoTimestamp, versionFromReservedKey moved to shared/util/state_helpers.mjs) ----

const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");

function sameExistingPath(left, right) {
  try {
    return realpathSync.native(resolve(left)) === realpathSync.native(resolve(right));
  } catch {
    return false;
  }
}

// ---- Style Master helpers ----
// (styleMasterSourceWorkflow and styleMasterSelectionExpectedWorkflow moved to state.mjs)

function ensureStyleMasterSelectionContainer(state) {
  if (!isPlainObject(state.page_image_style_master) || !isPlainObject(state.page_image_style_master.by_version)) {
    state.page_image_style_master = { by_version: {} };
  }
  return state.page_image_style_master.by_version;
}

/** @private exported for state.mjs validateState */
export function validateStyleMasterSelectionStructure(state, errors) {
  const map = state.page_image_style_master;
  if (map === undefined) return;
  if (!hasExactKeys(map, ["by_version"]) || !isPlainObject(map.by_version)) {
    errors.push("page_image_style_master must contain only by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      errors.push(`invalid page_image_style_master version key ${key}`);
      continue;
    }
    const checked = validateStyleMasterSelectionRecord(record, {
      expectedRunVersion: runVersion,
      expectedWorkflow: styleMasterSelectionExpectedWorkflow(state, runVersion),
    });
    if (!checked.ok) errors.push(`invalid page_image_style_master record ${key}: ${checked.code}`);
  }
}

// ---- Task mandate helpers ----
const PAGE_IMAGE_TASK_MANDATE_RECORD_KEYS = Object.freeze([
  "schema", "run_version", "workflow", "execution_id",
  "execution_started_at", "issued_at", "scope",
]);

function validPageImageTaskMandateRecord(record, runVersion) {
  return hasExactKeys(record, PAGE_IMAGE_TASK_MANDATE_RECORD_KEYS) &&
    record.schema === PAGE_IMAGE_TASK_MANDATE_SCHEMA &&
    record.run_version === runVersion &&
    ["framed", "pure"].includes(record.workflow) &&
    typeof record.execution_id === "string" && record.execution_id.length > 0 &&
    validIsoTimestamp(record.execution_started_at) &&
    validIsoTimestamp(record.issued_at) &&
    record.scope === PAGE_IMAGE_TASK_MANDATE_SCOPE;
}

/** @private exported for state_progressive */
export function taskMandateReference(record) {
  return sha256(Buffer.from(stableStringify(record)));
}

/** @private exported for state_progressive */
export function taskMandateRecord(state, runVersion) {
  return state?.page_image_task_mandate?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

/** @private exported for state_progressive */
export function currentTaskMandateMatches(record, context, workflow) {
  return validPageImageTaskMandateRecord(record, context.exactVersion) &&
    record.workflow === workflow &&
    record.execution_id === context.state.execution_id &&
    record.execution_started_at === context.state.execution_started_at;
}

function ensureTaskMandateContainer(state) {
  if (!isPlainObject(state.page_image_task_mandate) || !isPlainObject(state.page_image_task_mandate.by_version)) {
    state.page_image_task_mandate = { by_version: {} };
  }
  return state.page_image_task_mandate.by_version;
}

/** @private exported for state.mjs validateState */
export function validatePageImageTaskMandateStructure(state, errors) {
  const map = state.page_image_task_mandate;
  if (map === undefined) return;
  if (!hasExactKeys(map, ["by_version"]) || !isPlainObject(map.by_version)) {
    errors.push("page_image_task_mandate must contain only by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) errors.push(`invalid page_image_task_mandate version key ${key}`);
    else if (!validPageImageTaskMandateRecord(record, runVersion)) errors.push(`invalid page_image_task_mandate record ${key}`);
  }
}

// ---- Production identity structure validation ----
// (ensureProductionIdentityContainer moved to state.mjs)

/** @private exported for state.mjs validateState */
export function validateProductionIdentityStructure(state, errors) {
  const pm = state.production_identity;
  if (pm === undefined) return;
  if (!isPlainObject(pm) || !isPlainObject(pm.by_version)) {
    errors.push("production_identity must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(pm.by_version)) {
    if (!versionFromReservedKey(key)) errors.push(`invalid production_identity version key ${key}`);
    if (!isProductionIdentityRecord(record)) {
      errors.push(`invalid production_identity record ${key}`);
    }
  }
}

// ---- Clean target + execution lease helpers ----
function cleanTargetFilesystemConflict(targetDir) {
  for (const [label, name] of [["generated", "_generated"], ["scratch", "_scratch"]]) {
    const directory = join(targetDir, name);
    if (!existsSync(directory)) return `${label}:missing`;
    let entries;
    try {
      entries = readdirSync(directory).filter((entry) => entry !== "README.md").sort();
    } catch {
      return `${label}:unreadable`;
    }
    if (entries.length > 0) return `${label}:${entries[0]}`;
  }
  return null;
}

function currentExecutionLease(deckDir) {
  const path = executionLeasePath(deckDir);
  let record;
  try {
    record = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("CLEAN_TARGET_STATE_OWNER_UNAVAILABLE");
  }
  if (!isPlainObject(record) || Object.keys(record).sort().join("\n") !== [
    "active_run_version", "schema", "state_sha256",
  ].join("\n") || record.schema !== EXECUTION_LEASE_SCHEMA ||
    !SHA256_RE.test(record.state_sha256 || "") ||
    (record.active_run_version !== null && !normalizeRunVersion(record.active_run_version))) {
    throw new Error("CLEAN_TARGET_STATE_OWNER_UNAVAILABLE");
  }
  let stateBytes;
  try {
    stateBytes = readFileSync(statePath(deckDir));
  } catch {
    throw new Error("CLEAN_TARGET_STATE_OWNER_UNAVAILABLE");
  }
  if (sha256(stateBytes) !== record.state_sha256) {
    throw new Error("CLEAN_TARGET_STATE_OWNER_UNAVAILABLE");
  }
  return Object.freeze({
    active_run_version: record.active_run_version,
    state_sha256: record.state_sha256,
  });
}

// ---- Target state failure projection ----
function targetEvidenceFailure(code, nextAction) {
  return Object.freeze({ ok: false, kind: "hard-stop", code, next_action: nextAction });
}

// ===== Public API functions =====
// (inspectRunProductionIdentity and resolveEffectiveStyleMasterSelection moved to state.mjs)

/**
 * Persist the one capability-owned selection record. Candidate lifecycle code
 * supplies an already validated record; this state owner only CAS-binds it to
 * its exact version/workflow scope and never materializes page lineage.
 */
export function recordEffectiveStyleMasterSelection(deckDir, {
  runVersion, runDir, selection, expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const stateSha = expectedStateSha ?? execution.state_sha256;
  const source = styleMasterSourceWorkflow(deckDir, exactVersion);
  if (!source.ok) throw new Error(source.code);
  const state = execution.state;
  const expectedWorkflow = styleMasterSelectionExpectedWorkflow(state, exactVersion) || source.workflow;
  if (expectedWorkflow !== source.workflow) throw new Error("STYLE_MASTER_SELECTION_SCOPE_MISMATCH");
  const checked = validateStyleMasterSelectionRecord(selection, {
    expectedRunVersion: exactVersion,
    expectedWorkflow,
  });
  if (!checked.ok) throw new Error(checked.code || "STYLE_MASTER_SELECTION_INVALID");
  if (selection.candidate_media_type !== "image/png") throw new Error("STYLE_MASTER_SELECTION_INVALID");
  const existing = styleMasterSelectionRecord(state, exactVersion);
  if (existing) {
    const checkedExisting = validateStyleMasterSelectionRecord(existing, {
      expectedRunVersion: exactVersion,
      expectedWorkflow,
    });
    if (!checkedExisting.ok) throw new Error("STYLE_MASTER_SELECTION_INVALID");
    if (selection.previous_selection_sha256 !== checkedExisting.selection_sha256) {
      throw new Error("STYLE_MASTER_SELECTION_CONFLICT");
    }
    if (checked.selection_sha256 === checkedExisting.selection_sha256) {
      return Object.freeze({
        ok: true, status: "already-current",
        selection_sha256: checkedExisting.selection_sha256,
        record: Object.freeze(structuredClone(existing)),
      });
    }
  } else if (selection.previous_selection_sha256 !== null) {
    throw new Error("STYLE_MASTER_SELECTION_CONFLICT");
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  ensureStyleMasterSelectionContainer(next)[canonicalVersionKey(exactVersion)] = structuredClone(selection);
  writeState(deckDir, next, { expectedStateSha: stateSha, updatedAt: selection.accepted_at });
  appendHistory(deckDir, {
    type: "page_image_style_master_selection_recorded",
    run_version: exactVersion, workflow: selection.workflow,
    selection_sha256: checked.selection_sha256, accepted_at: selection.accepted_at,
  });
  return Object.freeze({
    ok: true, status: "recorded",
    selection_sha256: checked.selection_sha256,
    record: Object.freeze(structuredClone(selection)),
  });
}

/**
 * Resolve the one adapter allowed to handle an exact run version.
 */
export function resolveRunProductionAdapter(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });
  const inspection = inspectRunProductionIdentity(deckDir, { runVersion: exactVersion, purpose });
  if (inspection.ok && inspection.source_pipeline === PAGE_IMAGE_WORKFLOW_PIPELINE) {
    return Object.freeze({
      ok: true, run_version: exactVersion, adapter: "page-image-workflow",
      workflow: inspection.workflow, source_epoch: inspection.source_epoch,
      source_pipeline: inspection.source_pipeline, source_branch: inspection.source_branch,
      inspection,
    });
  }
  return Object.freeze({
    ok: false, code: inspection.ok ? "CURRENT_PROTOCOL_INVALID" : inspection.code,
    run_version: exactVersion, ...(inspection.ok ? {} : inspection),
  });
}

/**
 * Bind a filesystem-clean selected Page Image version to one new draft
 * execution without creating any target production lineage.
 */
export function activateCleanPageImageTargetDraft(deckDir, {
  sourceRunVersion, sourceRunDir, targetRunVersion, targetRunDir,
  expectedStateSha = null, playbookDir = DEFAULT_PLAYBOOK_DIR,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion ?? sourceRunDir);
  const targetVersion = normalizeRunVersion(targetRunVersion ?? targetRunDir);
  if (!sourceVersion || !targetVersion || sourceVersion === targetVersion) {
    throw new TypeError("clean target activation requires distinct canonical source and target versions");
  }
  const sourceDir = resolve(deckDir, "3_versions", sourceVersion);
  const targetDir = resolve(deckDir, "3_versions", targetVersion);
  if (sourceRunDir && !sameExistingPath(sourceRunDir, sourceDir)) throw new Error("CLEAN_TARGET_SOURCE_PATH_MISMATCH");
  if (targetRunDir && !sameExistingPath(targetRunDir, targetDir)) throw new Error("CLEAN_TARGET_PATH_MISMATCH");
  const sourceMarker = probeSourceMarkerForVersion(deckDir, sourceVersion);
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  const sourcePipeline = pipelineFromSourceMarker(sourceMarker);
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!sourcePipeline.ok || sourcePipeline.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) throw new Error("CLEAN_TARGET_SOURCE_IDENTITY_MISMATCH");
  if (!targetPipeline.ok || targetPipeline.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) throw new Error("CLEAN_TARGET_SOURCE_INVALID");
  if (sourcePipeline.workflow !== targetPipeline.workflow) throw new Error("CLEAN_TARGET_WORKFLOW_MISMATCH");
  const filesystemConflict = cleanTargetFilesystemConflict(targetDir);
  if (filesystemConflict) throw new Error(`CLEAN_TARGET_FILESYSTEM_NOT_CLEAN:${filesystemConflict}`);
  const lease = currentExecutionLease(deckDir);
  if (lease.active_run_version && lease.active_run_version !== sourceVersion) throw new Error("CLEAN_TARGET_SOURCE_EXECUTION_REQUIRED");
  const stateSha = expectedStateSha ?? lease.state_sha256;
  const index = buildPlaybookIndex(playbookDir);
  const draftRouteNodes = controllerDraftRouteNodes(index, "create-deck", targetPipeline.workflow);
  const draftEntryNode = "author-target-page-image-content";
  if (!validatePlaybookIndex(index).valid || !draftRouteNodes.includes(draftEntryNode)) throw new Error("CLEAN_TARGET_DRAFT_ROUTE_INVALID");
  const next = createDefaultState();
  next.continuation_target_version = targetVersion;
  startPlaybook(next, "create-deck", { runVersion: targetVersion });
  next.current_node = draftEntryNode;
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: stateSha, updatedAt: at });
  return Object.freeze({
    ok: true, source_version: sourceVersion, target_version: targetVersion,
    workflow: targetPipeline.workflow, current_node: next.current_node,
    draft_route_nodes: Object.freeze([...draftRouteNodes]),
  });
}

/**
 * Read the one task-mandate record usable by the active Page Image execution.
 */
export function inspectCurrentPageImageTaskMandate(deckDir, { runVersion, runDir, workflow = null } = {}) {
  let context;
  try {
    context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "observe" });
  } catch (error) {
    return Object.freeze({ ok: false, code: error?.code || error?.message || "TASK_MANDATE_STATE_UNAVAILABLE" });
  }
  const selectedWorkflow = workflow ?? context.inspection.workflow;
  if (!["framed", "pure"].includes(selectedWorkflow) || selectedWorkflow !== context.inspection.workflow) {
    return Object.freeze({ ok: false, code: "TASK_MANDATE_WORKFLOW_MISMATCH", run_version: context.exactVersion });
  }
  const record = taskMandateRecord(context.state, context.exactVersion);
  if (!validPageImageTaskMandateRecord(record, context.exactVersion)) {
    return Object.freeze({ ok: false, code: "TASK_MANDATE_MISSING", run_version: context.exactVersion, workflow: selectedWorkflow });
  }
  if (!currentTaskMandateMatches(record, context, selectedWorkflow)) {
    return Object.freeze({ ok: false, code: "TASK_MANDATE_STALE", run_version: context.exactVersion, workflow: selectedWorkflow });
  }
  return Object.freeze({
    ok: true, run_version: context.exactVersion, workflow: selectedWorkflow,
    task_mandate_sha256: taskMandateReference(record),
    record: Object.freeze(structuredClone(record)),
  });
}

/**
 * Establish one non-secret normal-production mandate for the exact active
 * Page Image execution, or replay its existing identical record.
 */
export function ensureCurrentPageImageTaskMandate(deckDir, { runVersion, runDir, workflow = null, expectedStateSha = null } = {}) {
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  const selectedWorkflow = workflow ?? context.inspection.workflow;
  if (!["framed", "pure"].includes(selectedWorkflow) || selectedWorkflow !== context.inspection.workflow) {
    throw new Error("TASK_MANDATE_WORKFLOW_MISMATCH");
  }
  if (!validTargetEvidenceRecord(context.record, context.exactVersion) ||
    context.record.source_epoch !== context.identityRecord.source_epoch ||
    context.record.workflow !== selectedWorkflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const existing = taskMandateRecord(context.state, context.exactVersion);
  if (currentTaskMandateMatches(existing, context, selectedWorkflow)) {
    return Object.freeze({
      ok: true, replay: true, run_version: context.exactVersion, workflow: selectedWorkflow,
      task_mandate_sha256: taskMandateReference(existing),
      record: Object.freeze(structuredClone(existing)),
    });
  }
  const issuedAt = nowIso();
  const record = {
    schema: PAGE_IMAGE_TASK_MANDATE_SCHEMA, run_version: context.exactVersion,
    workflow: selectedWorkflow, execution_id: context.state.execution_id,
    execution_started_at: context.state.execution_started_at, issued_at: issuedAt,
    scope: PAGE_IMAGE_TASK_MANDATE_SCOPE,
  };
  if (!validPageImageTaskMandateRecord(record, context.exactVersion)) throw new Error("TASK_MANDATE_RECORD_INVALID");
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  ensureTaskMandateContainer(next)[canonicalVersionKey(context.exactVersion)] = record;
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: issuedAt });
  appendHistory(deckDir, {
    type: "page_image_task_mandate", run_version: context.exactVersion,
    workflow: selectedWorkflow, execution_id: record.execution_id,
    task_mandate_sha256: taskMandateReference(record), at: issuedAt,
  });
  return Object.freeze({
    ok: true, replay: false, run_version: context.exactVersion, workflow: selectedWorkflow,
    task_mandate_sha256: taskMandateReference(record),
    record: Object.freeze(structuredClone(record)),
  });
}

/** Bind an exact parsed target source receipt to the existing state owner. */
export function initializeTargetPageImageState(deckDir, { runVersion, runDir, sourceReceipt, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const source = targetSourceFacts(sourceReceipt);
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, source);
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  const versionKey = canonicalVersionKey(exactVersion);
  const existingIdentity = state.production_identity?.by_version?.[versionKey];
  if (existingIdentity) {
    const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker: marker });
    if (!inspection.ok) throw new Error(inspection.code || "TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    if (!isProductionIdentityRecord(existingIdentity)) throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    if (existingIdentity.workflow !== source.workflow) throw new Error("TARGET_SOURCE_STATE_WORKFLOW_MISMATCH");
  } else if (state.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    throw new Error("TARGET_SOURCE_STATE_DRAFT_REQUIRED");
  }
  const existing = targetEvidenceRecord(state, exactVersion);
  if (existing) {
    const sourceEpoch = existingIdentity?.source_epoch ?? 1;
    if (!validTargetEvidenceRecord(existing, exactVersion) ||
      existing.source_epoch !== sourceEpoch ||
      existing.source_receipt_sha256 !== source.source_receipt_sha256 ||
      existing.workflow !== source.workflow) {
      throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    }
    return Object.freeze({ ok: true, status: "already-current", run_version: exactVersion, record: Object.freeze(structuredClone(existing)) });
  }
  const record = {
    schema: PAGE_IMAGE_TARGET_STATE_SCHEMA, run_version: exactVersion,
    source_epoch: existingIdentity?.source_epoch ?? 1,
    source_receipt_sha256: source.source_receipt_sha256, workflow: source.workflow,
    provider_authorization_sha256: null, accepted_raw_evidence_sha256: null,
    final_manifest_sha256: null, delivery_receipt_sha256: null,
  };
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  if (!existingIdentity) {
    ensureProductionIdentityContainer(next);
    next.production_identity.by_version[versionKey] = initialProductionIdentityRecord(source.workflow);
  }
  ensureTargetEvidenceContainer(next);
  next.page_image_target_evidence.by_version[versionKey] = record;
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: nowIso() });
  appendHistory(deckDir, { type: "page_image_target_state_initialized", run_version: exactVersion, source_epoch: record.source_epoch, at: nowIso() });
  return Object.freeze({ ok: true, status: "initialized", run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Start a fresh target raw-evidence epoch after a selected workflow has
 * classified a same-workflow source change as raw-generation debt.
 */
export function advanceTargetPageImageSourceEpoch(deckDir, {
  runVersion, runDir, sourceReceipt,
  expectedSourceEpoch = null, expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const source = targetSourceFacts(sourceReceipt);
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, source);
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  const versionKey = canonicalVersionKey(exactVersion);
  const identityRecord = state.production_identity?.by_version?.[versionKey];
  const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionIdentityRecord(identityRecord) || identityRecord.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const previous = targetEvidenceRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(previous, exactVersion) || previous.source_epoch !== identityRecord.source_epoch ||
    previous.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  if (expectedSourceEpoch !== null && previous.source_epoch !== expectedSourceEpoch) throw new Error("TARGET_SOURCE_EPOCH_STALE");
  if (previous.source_receipt_sha256 === source.source_receipt_sha256) throw new Error("TARGET_SOURCE_TRANSITION_INVALID");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const sourceEpoch = previous.source_epoch + 1;
  next.production_identity.by_version[versionKey] = { workflow: source.workflow, source_epoch: sourceEpoch };
  ensureTargetEvidenceContainer(next);
  next.page_image_target_evidence.by_version[versionKey] = {
    schema: PAGE_IMAGE_TARGET_STATE_SCHEMA, run_version: exactVersion,
    source_epoch: sourceEpoch, source_receipt_sha256: source.source_receipt_sha256,
    workflow: source.workflow, provider_authorization_sha256: null,
    accepted_raw_evidence_sha256: null, final_manifest_sha256: null, delivery_receipt_sha256: null,
  };
  if (isPlainObject(next.page_image_raw_provider_authorization?.by_version)) {
    delete next.page_image_raw_provider_authorization.by_version[versionKey];
  }
  if (isPlainObject(next.page_image_progressive_handoff?.by_version)) {
    delete next.page_image_progressive_handoff.by_version[versionKey];
  }
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_image_target_source_epoch_advanced", run_version: exactVersion,
    workflow: source.workflow, previous_source_epoch: previous.source_epoch,
    source_epoch: sourceEpoch, previous_source_receipt_sha256: previous.source_receipt_sha256,
    source_receipt_sha256: source.source_receipt_sha256, at,
  });
  return Object.freeze({
    ok: true, run_version: exactVersion,
    previous_source_epoch: previous.source_epoch, source_epoch: sourceEpoch,
    record: Object.freeze(structuredClone(next.page_image_target_evidence.by_version[versionKey])),
  });
}

/**
 * Read-only preflight for a selected workflow's target source-state.
 */
export function inspectTargetPageImageState(deckDir, { runVersion, runDir, sourceReceipt = null } = {}) {
  let context;
  try {
    context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "observe" });
  } catch (error) {
    return targetEvidenceFailure(error.message || "TARGET_STATE_UNAVAILABLE", "repair_target_source_state");
  }
  if (hasCurrentProgressiveRawHandoff(context.state, context.exactVersion)) {
    return targetEvidenceFailure("TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED", "inspect_progressive_raw_owner");
  }
  const record = context.record;
  if (!validTargetEvidenceRecord(record, context.exactVersion)) {
    return targetEvidenceFailure("TARGET_STATE_INITIALIZATION_REQUIRED", "initialize_target_source_state");
  }
  if (record.source_epoch !== context.identityRecord.source_epoch || record.workflow !== context.inspection.workflow) {
    return targetEvidenceFailure("TARGET_SOURCE_STATE_IDENTITY_MISMATCH", "repair_target_source_state");
  }
  const sourcePath = join(deckDir, "3_versions", context.exactVersion, "slide-specifications.md");
  if (!existsSync(sourcePath) || sha256(readFileSync(sourcePath)) !== record.source_receipt_sha256) {
    return targetEvidenceFailure("TARGET_SOURCE_RECEIPT_STALE", "rebuild_target_source_receipt");
  }
  if (sourceReceipt) {
    try {
      const source = targetSourceFacts(sourceReceipt);
      if (source.source_receipt_sha256 !== record.source_receipt_sha256 || source.workflow !== record.workflow) {
        return targetEvidenceFailure("TARGET_SOURCE_STATE_IDENTITY_MISMATCH", "repair_target_source_state");
      }
    } catch (error) {
      return targetEvidenceFailure(error.message || "TARGET_SOURCE_RECEIPT_INVALID", "repair_target_source");
    }
  }
  if (!record.provider_authorization_sha256) {
    return Object.freeze({ ok: false, kind: "confirm", code: "TARGET_PROVIDER_AUTHORIZATION_REQUIRED", next_action: "authorize_target_raw_work", workflow: record.workflow, source_epoch: record.source_epoch });
  }
  if (!record.accepted_raw_evidence_sha256) {
    return Object.freeze({ ok: false, kind: "hard-stop", code: "TARGET_ACCEPTED_RAW_EVIDENCE_REQUIRED", next_action: "record_target_raw_evidence", workflow: record.workflow, source_epoch: record.source_epoch });
  }
  if (!record.final_manifest_sha256) {
    return Object.freeze({ ok: false, kind: "hard-stop", code: "TARGET_FINAL_MANIFEST_REQUIRED", next_action: "publish_target_final_manifest", workflow: record.workflow, source_epoch: record.source_epoch });
  }
  if (!record.delivery_receipt_sha256) {
    return Object.freeze({ ok: false, kind: "confirm", code: "TARGET_DELIVERY_REQUIRED", next_action: "deliver_target_final_manifest", workflow: record.workflow, source_epoch: record.source_epoch });
  }
  return Object.freeze({ ok: true, workflow: record.workflow, source_epoch: record.source_epoch, record: Object.freeze(structuredClone(record)) });
}

/**
 * Resolve only the exact current target source/state pair. This deliberately
 * stops before raw authorization, raw review, finalization, and delivery.
 */
export function resolveCurrentTargetPageImageSourceState(deckDir, { runVersion, runDir } = {}) {
  let context;
  try {
    context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "observe" });
  } catch (error) {
    return targetEvidenceFailure(error.message || "TARGET_STATE_UNAVAILABLE", "repair_target_source_state");
  }
  const record = context.record;
  if (!validTargetEvidenceRecord(record, context.exactVersion)) {
    return targetEvidenceFailure("TARGET_STATE_INITIALIZATION_REQUIRED", "initialize_target_source_state");
  }
  if (record.source_epoch !== context.identityRecord.source_epoch || record.workflow !== context.inspection.workflow) {
    return targetEvidenceFailure("TARGET_SOURCE_STATE_IDENTITY_MISMATCH", "repair_target_source_state");
  }
  const sourcePath = join(deckDir, "3_versions", context.exactVersion, "slide-specifications.md");
  if (!existsSync(sourcePath) || sha256(readFileSync(sourcePath)) !== record.source_receipt_sha256) {
    return targetEvidenceFailure("TARGET_SOURCE_RECEIPT_STALE", "rebuild_target_source_receipt");
  }
  return Object.freeze({
    ok: true, workflow: record.workflow, source_epoch: record.source_epoch,
    record: Object.freeze(structuredClone(record)),
  });
}