/**
 * state.mjs — persisted MD Controller execution state.
 *
 * MD Controllers remain the workflow source of truth. This module stores the
 * active execution pointer/evidence and evaluates gates from declarations read
 * by md_controller_reader.mjs.
 * CLI diagnostic consumer authority: openspec/specs/node-specification/spec.md
 * plus active node-specification deltas from `openspec status`; do not duplicate
 * the producer schema owned by cli-surface in this module.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseDocument, stringify } from "yaml";
import {
  buildPlaybookIndex,
  controllerNodeIds,
  controllerActiveNodeIds,
  controllerDraftRouteNodes,
  resolveNode,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import {
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "../image2/page_image_artifacts.mjs";
import {
  PROGRESSIVE_RAW_WORK_PLAN_SCHEMA,
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawWorkPlan,
} from "../image2/page_image_progressive_schema.mjs";
import {
  readProgressiveRawPlanDirectRecords,
} from "../image2/page_image_progressive_store.mjs";
import {
  validateStyleMasterSelectionRecord,
} from "../image2/style_master_schema.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOWS, isPageImageWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { canonicalVersionKey, initialProductionIdentityRecord, inspectProductionIdentity, isProductionIdentityRecord, normalizeRunVersion, pipelineFromSourceMarker } from "../run-bundle/production_identity.mjs";
import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { hasCurrentPageImageSourceReceiptEnvelope } from "../page-image/page_image_source_receipt.mjs";

export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const EXECUTION_LEASE_FILE = "current-execution-lease.json";
export const EXECUTION_LEASE_SCHEMA = "pptmaker-current-execution-lease";
export const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
export const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
export const RESERVED_NODE_IDS = Object.freeze([]);

export const STATE_YAML_HEADER = `\
# _state/state.yaml — MD Controller execution state (not a hand-edit playground)
# Schema authority: ppt_maker_harness/charter/NODE-SPEC.md
# API: ppt_maker_harness/scripts/shared/state/state.mjs
# CLI: node ppt_maker_harness/scripts/ppt_flow.mjs state <runDir> [--json|--check-gates]
# Fields: pipeline, production_identity.by_version, page_image_task_mandate.by_version, playbook, current_node, execution_id, nodes.*, gates.*, deck.*, playbook_stack
# MD Controller source: ppt_maker_harness/playbook/*.md
# Read boundary: observation validates the declared current authority and never rewrites, infers, or continues unsupported state
`;

export const STATE_DIR_README = `\
# 执行状态 (_state)

**这里放什么:** MD Controller 跑到哪了——当前执行、节点、闸门、等待原因。Playbook 内容仍以 \`ppt_maker_harness/playbook/*.md\` 为真相源。

**主要文件:**
- \`state.yaml\` — 当前执行工作集（原子写）
- \`history.jsonl\` — 可选参考日志，不参与自动恢复

**断线后:** 先跑 \`node ppt_maker_harness/scripts/ppt_flow.mjs state <runDir>\`。

**Schema 权威:** \`ppt_maker_harness/charter/NODE-SPEC.md\`。

**不要手改:** 优先使用 \`scripts/shared/state/state.mjs\` / \`ppt_flow\`；读取只验证当前声明的权威状态，不会重写、推断或继续不受支持的状态。
`;

const YAML_PARSE_OPTS = { strict: false, uniqueKeys: false, logLevel: "error" };
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");
const GATE_JOURNAL_FILE = "gate-approval-journal.json";
const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

function sameExistingPath(left, right) {
  try {
    return realpathSync.native(resolve(left)) === realpathSync.native(resolve(right));
  } catch {
    return false;
  }
}

const STATE_TOP_LEVEL_KEYS = new Set([
  "pipeline",
  "production_identity",
  "page_image_raw_provider_authorization",
  "page_image_target_evidence",
  "page_image_progressive_handoff",
  "page_image_task_mandate",
  "page_image_style_master",
  "playbook",
  "current_node",
  "execution_id",
  "execution_started_at",
  "run_version",
  "continuation_target_version",
  "started_at",
  "updated_at",
  "nodes",
  "gates",
  "deck",
  "playbook_stack",
  "diagnostics",
]);
function nowIso() { return new Date().toISOString(); }
function newExecutionId() { return `exec-${randomUUID()}`; }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function deepClone(value) { return value == null ? value : structuredClone(value); }
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function isReservedNode(id) { return RESERVED_NODE_IDS.includes(id); }
function controllerEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => !isReservedNode(id)); }
function reservedEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => isReservedNode(id)); }
function isoOr(value, fallback) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return value;
}
function selectedRunVersion({ runVersion, runDir } = {}) {
  return normalizeRunVersion(runVersion ?? runDir);
}

function visibleRunVersions(deckDir) {
  if (!deckDir) return [];
  try {
    return readdirSync(join(deckDir, "3_versions"))
      .filter((name) => VERSION_RE.test(name))
      .sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));
  } catch {
    return [];
  }
}

function exactContinuationTargetVersion(value) {
  return typeof value === "string" && VERSION_RE.test(value) ? value : null;
}

function continuationTargetVisibilityError(state, deckDir) {
  const value = state?.continuation_target_version;
  if (value == null || value === "") return null;
  const target = exactContinuationTargetVersion(value);
  if (!target) return "continuation_target_version must be a normalized vN";
  if (!visibleRunVersions(deckDir).includes(target)) {
    return `continuation_target_version ${target} is not a visible canonical version`;
  }
  return null;
}

/**
 * Resolve the one state-owned run a continuation card may inspect. This is a
 * read-only selector: active execution identity wins, otherwise the durable
 * inactive target must name an exact visible version. Callers must guide on a
 * failed result; they must not enumerate or infer a replacement.
 */
export function resolveContinuationTargetVersion(state, deckDir) {
  const active = state?.playbook ? exactContinuationTargetVersion(state.run_version) : null;
  if (state?.playbook && !active) {
    return Object.freeze({ ok: false, reason: "active execution has no normalized run_version" });
  }
  const target = active || exactContinuationTargetVersion(state?.continuation_target_version);
  if (!target) return Object.freeze({ ok: false, reason: "continuation target is missing or malformed" });
  if (!visibleRunVersions(deckDir).includes(target)) {
    return Object.freeze({ ok: false, reason: `continuation target ${target} is not visible` });
  }
  return Object.freeze({ ok: true, run_version: target, source: active ? "active-run-version" : "continuation-target" });
}

function ordinaryFrameBindingErrors(frame, label) {
  const errors = [];
  const frameRunVersion = normalizeRunVersion(frame?.run_version);
  if (!frameRunVersion) return [`${label} missing canonical run_version`];
  if (!isPlainObject(frame?.controller_nodes)) return [`${label} missing controller_nodes`];
  for (const [name, record] of Object.entries(frame.controller_nodes)) {
    if (!isPlainObject(record) || record.execution_id !== frame.execution_id || record.run_version !== frameRunVersion) {
      errors.push(`${label} run_version mismatch for ${name}`);
    }
  }
  return errors;
}

function executionBindingErrors(state) {
  const errors = [];
  const activeRunVersion = normalizeRunVersion(state?.run_version);
  if (state?.playbook) {
    if (!activeRunVersion) errors.push("active execution missing canonical run_version");
    for (const [name, record] of controllerEntries(state.nodes)) {
      if (!isPlainObject(record) || record.execution_id !== state.execution_id) {
        errors.push(`execution mismatch for ${name}`);
        continue;
      }
      if (!activeRunVersion || record.run_version !== activeRunVersion) errors.push(`run_version mismatch for ${name}`);
    }
  } else if (state?.run_version) {
    errors.push("inactive state must not retain run_version");
  }
  if (!Array.isArray(state?.playbook_stack)) {
    errors.push("playbook_stack must be an array");
    return errors;
  }
  for (const [index, frame] of state.playbook_stack.entries()) {
    errors.push(...ordinaryFrameBindingErrors(frame, `playbook_stack[${index}]`));
  }
  return errors;
}

function executionRunVersionMismatch(state, { runVersion, runDir } = {}) {
  const requested = selectedRunVersion({ runVersion, runDir });
  if (!requested || !state?.playbook) return null;
  const active = normalizeRunVersion(state.run_version);
  if (!active) return Object.freeze({ code: "execution_run_version_mismatch", requested_run_version: requested, active_run_version: null });
  if (active !== requested) return Object.freeze({ code: "execution_run_version_mismatch", requested_run_version: requested, active_run_version: active });
  return null;
}

function selectedExecutionMismatch(state, selected = {}) {
  const mismatch = executionRunVersionMismatch(state, selected);
  if (mismatch) return mismatch;
  if (state?.playbook && !normalizeRunVersion(state.run_version)) {
    return Object.freeze({ code: "execution_run_version_mismatch", requested_run_version: selectedRunVersion(selected), active_run_version: null });
  }
  return null;
}

function requireExecutionRunVersion(state, { runVersion, runDir } = {}) {
  if (!state?.playbook) return null;
  const active = normalizeRunVersion(state.run_version);
  if (!active) throw new Error("execution_run_version_mismatch: active execution has no canonical run_version");
  const requested = selectedRunVersion({ runVersion, runDir });
  if (requested && requested !== active) {
    throw new Error(`execution_run_version_mismatch: active=${active} requested=${requested}`);
  }
  return active;
}

export function ensureStateDirHints(deckDir) {
  const dir = join(deckDir, STATE_DIR);
  mkdirSync(dir, { recursive: true });
  const readme = join(dir, "README.md");
  if (!existsSync(readme)) writeFileSync(readme, STATE_DIR_README, "utf8");
}

export function parseStateYaml(text) {
  try {
    const doc = parseDocument(text, YAML_PARSE_OPTS);
    const hadErrors = Array.isArray(doc.errors) && doc.errors.length > 0;
    const value = doc.toJS({ mapAsMap: false });
    if (!isPlainObject(value)) {
      return { ok: false, errors: hadErrors ? doc.errors.map((e) => e.message || String(e)) : ["YAML root is not a mapping"] };
    }
    return { ok: true, value, hadErrors };
  } catch (error) {
    return { ok: false, errors: [error.message || String(error)] };
  }
}

export function stringifyStateYaml(state) {
  return stringify(state, { indent: 2, lineWidth: 0 });
}

function assertCurrentPlaybookStack(state) {
  const errors = executionBindingErrors({
    ...(isPlainObject(state) ? state : {}),
    playbook: "",
    run_version: "",
  }).filter((error) => error.startsWith("playbook_stack"));
  if (errors.length > 0) throw new Error(`STATE_PLAYBOOK_STACK_INVALID: ${errors[0]}`);
  return state.playbook_stack;
}

/** Undeclared state is not promotable. Reads validate declared current bytes;
 * only an owning execution path may make a current repair. */
export function healState(raw) {
  return { state: isPlainObject(raw) ? deepClone(raw) : raw, dirty: false };
}

export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }
export function executionLeasePath(deckDir) { return join(deckDir, STATE_DIR, EXECUTION_LEASE_FILE); }

function replacementRequired(reason, pipeline = null) {
  return Object.freeze({
    replacement_required: true,
    code: "replacement_required",
    pipeline,
    reason: String(reason),
    durable_state_present: false,
  });
}

function currentRepairRequired(reason, pipeline = null) {
  return Object.freeze({
    replacement_required: true,
    current_repair_required: true,
    code: "replacement_required",
    pipeline,
    reason: String(reason),
    durable_state_present: false,
  });
}

function stateRepairFencePresent(deckDir, state) {
  if (existsSync(join(deckDir, STATE_DIR, GATE_JOURNAL_FILE))) return true;
  return false;
}

function currentOneToOneRepair(state, { deckDir, runVersion, sourceMarker }) {
  if (!isPlainObject(state) || stateRepairFencePresent(deckDir, state)) return null;
  if (!isPlainObject(state.gates)) return null;
  const invalidGates = ["content", "visual"]
    .filter((name) => !GATE_STATUSES.includes(state.gates[name]));
  if (invalidGates.length !== 1) return null;

  const candidate = deepClone(state);
  candidate.gates[invalidGates[0]] = "pending";
  if (!validateState(candidate).valid) return null;
  const identity = inspectProductionIdentity({ state: candidate, runVersion, sourceMarker });
  if (!identity.ok) return null;
  return Object.freeze({
    state: candidate,
    repair: Object.freeze({
      field: `gates.${invalidGates[0]}`,
      from: state.gates[invalidGates[0]],
      to: "pending",
    }),
  });
}

function markStateRepaired(state, repair) {
  Object.defineProperty(state, "state_repaired", {
    value: repair,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return state;
}

function markDurableStatePresent(state) {
  Object.defineProperty(state, "durable_state_present", {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return state;
}

function probeSourceMarkerForVersion(deckDir, runVersion) {
  const source = join(deckDir, "3_versions", runVersion, "slide-specifications.md");
  if (!existsSync(source)) return { ok: false, code: "MARKER_MISSING", issues: [] };
  try {
    return probeProductionMarker(readFileSync(source), { source: "slide-specifications.md" });
  } catch (error) {
    return { ok: false, code: "MARKER_INVALID", issues: [error.message || String(error)] };
  }
}

/**
 * State-owned exact-run production-identity inspection. It combines canonical
 * state with the exact source marker and short-circuits before any
 * generated/provider check. It never reads a project-metadata mirror.
 */
export function inspectRunProductionIdentity(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });
  const execution = resolveExactExecution(deckDir, { runVersion: exactVersion, purpose });
  if (!execution.ok) return execution;
  const { state, source_marker: sourceMarker } = execution;
  const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker });
  if (!inspection.ok) return Object.freeze({ ...inspection, run_version: exactVersion });
  const stateDrift = typeof state.pipeline === "string" && state.pipeline && state.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE
    ? Object.freeze({ kind: "pipeline-projection", expected: PAGE_IMAGE_WORKFLOW_PIPELINE, actual: state.pipeline })
    : null;
  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    version_key: inspection.version_key,
    workflow: inspection.workflow,
    source_epoch: inspection.source_epoch,
    source_branch: inspection.source_branch,
    source_pipeline: inspection.source_pipeline,
    consistent: true,
    state_drift: stateDrift,
  });
}

function styleMasterSourceWorkflow(deckDir, runVersion) {
  const marker = probeSourceMarkerForVersion(deckDir, runVersion);
  if (marker?.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE || !PAGE_IMAGE_WORKFLOWS.includes(marker?.frontmatter?.metadata?.production?.workflow)) {
    return Object.freeze({ ok: false, code: marker?.code || "STYLE_MASTER_SOURCE_UNAVAILABLE" });
  }
  return Object.freeze({ ok: true, workflow: marker.frontmatter.metadata.production.workflow });
}

/**
 * Read one exact selection record without treating an unrelated file,
 * candidate history, or Controller checkbox as selection authority.
 */
export function resolveEffectiveStyleMasterSelection(deckDir, { runVersion, runDir, state = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  const currentState = state || readState(deckDir, { purpose: "observe", heal: false });
  if (currentState?.replacement_required || currentState?.corrupted) {
    return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", current: false });
  }
  const record = styleMasterSelectionRecord(currentState, exactVersion);
  if (!record) return Object.freeze({ ok: false, code: "STYLE_MASTER_SELECTION_MISSING", current: false });
  const source = styleMasterSourceWorkflow(deckDir, exactVersion);
  if (!source.ok) return Object.freeze({ ok: false, code: source.code, current: false });
  const expectedWorkflow = styleMasterSelectionExpectedWorkflow(currentState, exactVersion) || source.workflow;
  const checked = validateStyleMasterSelectionRecord(record, {
    expectedRunVersion: exactVersion,
    expectedWorkflow,
  });
  if (!checked.ok || source.workflow !== record.workflow) {
    return Object.freeze({ ok: false, code: "STYLE_MASTER_SELECTION_STALE", current: false });
  }
  return Object.freeze({
    ok: true,
    current: true,
    run_version: exactVersion,
    workflow: record.workflow,
    selection_sha256: checked.selection_sha256,
    record: Object.freeze(structuredClone(record)),
  });
}

/**
 * Persist the one capability-owned selection record. Candidate lifecycle code
 * supplies an already validated record; this state owner only CAS-binds it to
 * its exact version/workflow scope and never materializes page lineage.
 */
export function recordEffectiveStyleMasterSelection(deckDir, {
  runVersion,
  runDir,
  selection,
  expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  // This mutation is always CAS-bound to the state bytes it inspected. Callers
  // may supply an earlier explicit precondition when their owning transaction
  // already has one; otherwise retain the exact resolver's byte identity.
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
        ok: true,
        status: "already-current",
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
    run_version: exactVersion,
    workflow: selection.workflow,
    selection_sha256: checked.selection_sha256,
    accepted_at: selection.accepted_at,
  });
  return Object.freeze({
    ok: true,
    status: "recorded",
    selection_sha256: checked.selection_sha256,
    record: Object.freeze(structuredClone(selection)),
  });
}

/**
 * Resolve the one adapter allowed to handle an exact run version. This is the
 * public routing boundary for root orchestration and direct multi-pipeline
 * executables: durable runs must have an authoritative production-identity record
 * that agrees with the source marker before any adapter, readiness, provider,
 * or generated-artifact work begins.
 *
 * Every supported run has an explicit source marker and an authoritative identity.
 */
export function resolveRunProductionAdapter(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });

  const inspection = inspectRunProductionIdentity(deckDir, {
    runVersion: exactVersion,
    purpose,
  });
  if (inspection.ok && inspection.source_pipeline === PAGE_IMAGE_WORKFLOW_PIPELINE) {
    return Object.freeze({
      ok: true,
      run_version: exactVersion,
      adapter: "page-image-workflow",
      workflow: inspection.workflow,
      source_epoch: inspection.source_epoch,
      source_pipeline: inspection.source_pipeline,
      source_branch: inspection.source_branch,
      inspection,
    });
  }

  return Object.freeze({
    ok: false,
    code: inspection.ok ? "CURRENT_PROTOCOL_INVALID" : inspection.code,
    run_version: exactVersion,
    ...(inspection.ok ? {} : inspection),
  });
}

export const PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA = "page-image-workflow-provider-authorization";
export const PAGE_IMAGE_TARGET_STATE_SCHEMA = "page-image-workflow-target-state";
export const PAGE_IMAGE_TASK_MANDATE_SCHEMA = "page-image-task-mandate";
export const PAGE_IMAGE_TASK_MANDATE_SCOPE = "normal-page-image-production";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

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

function validatePageImageRawAuthorizationStructure(state, errors) {
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

const PAGE_IMAGE_TASK_MANDATE_RECORD_KEYS = Object.freeze([
  "schema",
  "run_version",
  "workflow",
  "execution_id",
  "execution_started_at",
  "issued_at",
  "scope",
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

function taskMandateReference(record) {
  return sha256(Buffer.from(stableStringify(record)));
}

function validatePageImageTaskMandateStructure(state, errors) {
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

function taskMandateRecord(state, runVersion) {
  return state?.page_image_task_mandate?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

function currentTaskMandateMatches(record, context, workflow) {
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

function styleMasterSelectionExpectedWorkflow(state, runVersion) {
  const identity = state?.production_identity?.by_version?.[canonicalVersionKey(runVersion)];
  return isProductionIdentityRecord(identity) ? identity.workflow : null;
}

function validateStyleMasterSelectionStructure(state, errors) {
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

function ensureStyleMasterSelectionContainer(state) {
  if (!isPlainObject(state.page_image_style_master) || !isPlainObject(state.page_image_style_master.by_version)) {
    state.page_image_style_master = { by_version: {} };
  }
  return state.page_image_style_master.by_version;
}

function styleMasterSelectionRecord(state, runVersion) {
  return state?.page_image_style_master?.by_version?.[canonicalVersionKey(runVersion)] || null;
}


const TARGET_EVIDENCE_RECORD_KEYS = Object.freeze([
  "schema",
  "run_version",
  "source_epoch",
  "source_receipt_sha256",
  "workflow",
  "provider_authorization_sha256",
  "accepted_raw_evidence_sha256",
  "final_manifest_sha256",
  "delivery_receipt_sha256",
]);

function nullableDigest(value) {
  return value === null || SHA256_RE.test(value || "");
}

function targetEvidenceDigest(value) {
  return sha256(Buffer.from(stableStringify(value)));
}

function validTargetEvidenceRecord(record, runVersion) {
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

function validateTargetEvidenceStructure(state, errors) {
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

function ensureTargetEvidenceContainer(state) {
  if (!isPlainObject(state.page_image_target_evidence) || !isPlainObject(state.page_image_target_evidence.by_version)) {
    state.page_image_target_evidence = { by_version: {} };
  }
}

function targetEvidenceRecord(state, runVersion) {
  return state?.page_image_target_evidence?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

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

/**
 * Bind a filesystem-clean selected Page Image version to one new draft
 * execution without creating any target production lineage.
 */
export function activateCleanPageImageTargetDraft(deckDir, {
  sourceRunVersion,
  sourceRunDir,
  targetRunVersion,
  targetRunDir,
  expectedStateSha = null,
  playbookDir = DEFAULT_PLAYBOOK_DIR,
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
  if (!sourcePipeline.ok || sourcePipeline.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    throw new Error("CLEAN_TARGET_SOURCE_IDENTITY_MISMATCH");
  }
  if (!targetPipeline.ok || targetPipeline.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    throw new Error("CLEAN_TARGET_SOURCE_INVALID");
  }
  if (sourcePipeline.workflow !== targetPipeline.workflow) {
    throw new Error("CLEAN_TARGET_WORKFLOW_MISMATCH");
  }
  const filesystemConflict = cleanTargetFilesystemConflict(targetDir);
  if (filesystemConflict) throw new Error(`CLEAN_TARGET_FILESYSTEM_NOT_CLEAN:${filesystemConflict}`);

  // The state owner consumes only this controller lease to prevent replacing a
  // different active run. Predecessor state is never a successor input.
  const lease = currentExecutionLease(deckDir);
  if (lease.active_run_version && lease.active_run_version !== sourceVersion) {
    throw new Error("CLEAN_TARGET_SOURCE_EXECUTION_REQUIRED");
  }
  const stateSha = expectedStateSha ?? lease.state_sha256;

  const index = buildPlaybookIndex(playbookDir);
  const draftRouteNodes = controllerDraftRouteNodes(index, "create-deck", targetPipeline.workflow);
  const draftEntryNode = "author-target-page-image-content";
  if (!validatePlaybookIndex(index).valid || !draftRouteNodes.includes(draftEntryNode)) {
    throw new Error("CLEAN_TARGET_DRAFT_ROUTE_INVALID");
  }

  const next = createDefaultState();
  next.continuation_target_version = targetVersion;
  startPlaybook(next, "create-deck", { runVersion: targetVersion });
  next.current_node = draftEntryNode;

  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: stateSha, updatedAt: at });
  return Object.freeze({
    ok: true,
    source_version: sourceVersion,
    target_version: targetVersion,
    workflow: targetPipeline.workflow,
    current_node: next.current_node,
    draft_route_nodes: Object.freeze([...draftRouteNodes]),
  });
}

// Progressive raw facts remain exclusively in the append-mostly raw owner.
// State keeps only the typed Controller handoff references needed to resume.
export const PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA = "page-image-workflow-handoff";
export const PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY = "exact-batch-grant-recorded";
const PROGRESSIVE_HANDOFF_RECORD_KEYS = Object.freeze([
  "schema",
  "run_version",
  "source_epoch",
  "source_receipt_sha256",
  "workflow",
  "raw_work_plan_sha256",
  "partial_pilot_decision_sha256",
  "complete_raw_review_sha256",
  "accepted_raw_evidence_sha256",
  "final_manifest_sha256",
  "delivery_receipt_sha256",
]);

function validProgressiveHandoffRecord(record, runVersion) {
  return hasExactKeys(record, PROGRESSIVE_HANDOFF_RECORD_KEYS) &&
    record.schema === PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA &&
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

function validateProgressiveHandoffStructure(state, errors) {
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

function ensureProgressiveHandoffContainer(state) {
  if (!isPlainObject(state.page_image_progressive_handoff) || !isPlainObject(state.page_image_progressive_handoff.by_version)) {
    state.page_image_progressive_handoff = { by_version: {} };
  }
  return state.page_image_progressive_handoff.by_version;
}

function progressiveHandoffRecord(state, runVersion) {
  return state?.page_image_progressive_handoff?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

// A current progressive handoff fences obsolete state-side raw projections.
// Retained records must not be repurposed for progressive cost, evidence,
// finalization, or delivery work.
function hasCurrentProgressiveRawHandoff(state, runVersion) {
  return validProgressiveHandoffRecord(progressiveHandoffRecord(state, runVersion), runVersion);
}

function assertDirectRawLifecycleAvailable(state, runVersion) {
  if (hasCurrentProgressiveRawHandoff(state, runVersion)) {
    throw new Error("TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED");
  }
}

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

function targetLocalComposeRebindFacts({
  previousSourceReceipt,
  nextSourceReceipt,
  previousRawWorkPlan,
  nextRawWorkPlan,
  previousAcceptedRawEvidence,
  nextAcceptedRawEvidence,
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
  return Object.freeze({
    previousSource,
    nextSource,
    previousPlan,
    nextPlan,
    previousEvidence,
    nextEvidence,
  });
}

function sameProgressiveRawTuples(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
    left.every((item, index) => item.slide_id === right[index]?.slide_id &&
      item.raw_contract_sha256 === right[index]?.raw_contract_sha256 &&
      item.raw_sha256 === right[index]?.raw_sha256);
}

function progressiveLocalRebindFacts({
  previousSourceReceipt,
  nextSourceReceipt,
  previousProgressiveRawWorkPlan,
  nextProgressiveRawWorkPlan,
  previousAcceptedRawEvidence,
  nextAcceptedRawEvidence,
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
  return Object.freeze({
    previousSource,
    nextSource,
    previousPlan,
    nextPlan,
    previousEvidence,
    nextEvidence,
  });
}

function targetEvidenceContext(deckDir, { runVersion, runDir, purpose = "execute" } = {}) {
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
  return Object.freeze({ exactVersion, inspection, state, stateSha: execution.state_sha256, sourceIdentity: execution.source_identity, identityRecord, record: targetEvidenceRecord(state, exactVersion) });
}

/**
 * Read the one task-mandate record usable by the active Page Image execution.
 * This is deliberately observation-only: a missing or stale record remains a
 * provider-free planning recovery, never an inferred authority.
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
    ok: true,
    run_version: context.exactVersion,
    workflow: selectedWorkflow,
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
      ok: true,
      replay: true,
      run_version: context.exactVersion,
      workflow: selectedWorkflow,
      task_mandate_sha256: taskMandateReference(existing),
      record: Object.freeze(structuredClone(existing)),
    });
  }

  const issuedAt = nowIso();
  const record = {
    schema: PAGE_IMAGE_TASK_MANDATE_SCHEMA,
    run_version: context.exactVersion,
    workflow: selectedWorkflow,
    execution_id: context.state.execution_id,
    execution_started_at: context.state.execution_started_at,
    issued_at: issuedAt,
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
    type: "page_image_task_mandate",
    run_version: context.exactVersion,
    workflow: selectedWorkflow,
    execution_id: record.execution_id,
    task_mandate_sha256: taskMandateReference(record),
    at: issuedAt,
  });
  return Object.freeze({
    ok: true,
    replay: false,
    run_version: context.exactVersion,
    workflow: selectedWorkflow,
    task_mandate_sha256: taskMandateReference(record),
    record: Object.freeze(structuredClone(record)),
  });
}

function targetEvidenceFailure(code, nextAction) {
  return Object.freeze({ ok: false, kind: "hard-stop", code, next_action: nextAction });
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
    if (!isProductionIdentityRecord(existingIdentity)) {
      throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    }
    if (existingIdentity.workflow !== source.workflow) throw new Error("TARGET_SOURCE_STATE_WORKFLOW_MISMATCH");
  } else if (state.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    // A missing record is legal only for the current draft seeded by fresh init.
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
    schema: PAGE_IMAGE_TARGET_STATE_SCHEMA,
    run_version: exactVersion,
    source_epoch: existingIdentity?.source_epoch ?? 1,
    source_receipt_sha256: source.source_receipt_sha256,
    workflow: source.workflow,
    provider_authorization_sha256: null,
    accepted_raw_evidence_sha256: null,
    final_manifest_sha256: null,
    delivery_receipt_sha256: null,
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
 * classified a same-workflow source change as raw-generation debt. This state
 * owner deliberately validates identity and lineage only; Framed/Pure semantic
 * classification remains with the selected adapter.
 */
export function advanceTargetPageImageSourceEpoch(deckDir, {
  runVersion,
  runDir,
  sourceReceipt,
  expectedSourceEpoch = null,
  expectedStateSha = null,
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
  if (!inspection.ok || !isProductionIdentityRecord(identityRecord) ||
    identityRecord.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const previous = targetEvidenceRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(previous, exactVersion) || previous.source_epoch !== identityRecord.source_epoch ||
    previous.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  if (expectedSourceEpoch !== null && previous.source_epoch !== expectedSourceEpoch) {
    throw new Error("TARGET_SOURCE_EPOCH_STALE");
  }
  if (previous.source_receipt_sha256 === source.source_receipt_sha256) {
    throw new Error("TARGET_SOURCE_TRANSITION_INVALID");
  }

  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  const sourceEpoch = previous.source_epoch + 1;
  next.production_identity.by_version[versionKey] = {
    workflow: source.workflow,
    source_epoch: sourceEpoch,
  };
  ensureTargetEvidenceContainer(next);
  next.page_image_target_evidence.by_version[versionKey] = {
    schema: PAGE_IMAGE_TARGET_STATE_SCHEMA,
    run_version: exactVersion,
    source_epoch: sourceEpoch,
    source_receipt_sha256: source.source_receipt_sha256,
    workflow: source.workflow,
    provider_authorization_sha256: null,
    accepted_raw_evidence_sha256: null,
    final_manifest_sha256: null,
    delivery_receipt_sha256: null,
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
    type: "page_image_target_source_epoch_advanced",
    run_version: exactVersion,
    workflow: source.workflow,
    previous_source_epoch: previous.source_epoch,
    source_epoch: sourceEpoch,
    previous_source_receipt_sha256: previous.source_receipt_sha256,
    source_receipt_sha256: source.source_receipt_sha256,
    at,
  });
  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    previous_source_epoch: previous.source_epoch,
    source_epoch: sourceEpoch,
    record: Object.freeze(structuredClone(next.page_image_target_evidence.by_version[versionKey])),
  });
}

/**
 * Read-only preflight for a selected workflow's local-compose evidence rebind.
 * It validates bindings, not Framed/Pure semantics; the selected workflow owns
 * that classification and may use this before writing any derived artifact.
 */
export function validateTargetAcceptedRawEvidenceLocalComposeRebind(deckDir, {
  runVersion,
  runDir,
  previousSourceReceipt,
  nextSourceReceipt,
  previousRawWorkPlan,
  nextRawWorkPlan,
  previousAcceptedRawEvidence,
  nextAcceptedRawEvidence,
  expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const facts = targetLocalComposeRebindFacts({
    previousSourceReceipt,
    nextSourceReceipt,
    previousRawWorkPlan,
    nextRawWorkPlan,
    previousAcceptedRawEvidence,
    nextAcceptedRawEvidence,
  });
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, facts.nextSource);
  const execution = requireExactExecution(deckDir, { runVersion: exactVersion });
  const state = execution.state;
  const versionKey = canonicalVersionKey(exactVersion);
  const identityRecord = state.production_identity?.by_version?.[versionKey];
  const inspection = inspectProductionIdentity({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionIdentityRecord(identityRecord) ||
    identityRecord.workflow !== facts.nextSource.workflow) {
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
  // A provider authorization remains bound to the raw submission that created
  // the reusable bytes. A local-compose rebind advances only source/evidence
  // lineage, so a later provider-free rebind must not require that historical
  // authorization to name the immediately preceding source or plan again.
  // The exact current raw contracts, order, profile, bytes, and evidence were
  // already checked above; retain the authorization's immutable identity,
  // epoch, workflow, and provider-profile bindings here.
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
    ok: true,
    run_version: exactVersion,
    source_epoch: existing.source_epoch,
    facts,
    state: Object.freeze(structuredClone(state)),
    state_sha256: execution.state_sha256,
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
    type: "page_image_target_local_compose_rebound",
    run_version: exactVersion,
    workflow: facts.nextSource.workflow,
    source_epoch: record.source_epoch,
    previous_source_receipt_sha256: facts.previousSource.source_receipt_sha256,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256,
    previous_raw_work_plan_sha256: facts.previousPlan.sha256,
    raw_work_plan_sha256: facts.nextPlan.sha256,
    previous_accepted_raw_evidence_sha256: facts.previousEvidence.sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256,
    at,
  });
  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    source_epoch: record.source_epoch,
    record: Object.freeze(structuredClone(record)),
  });
}

/**
 * Rebind source/state handoffs after the raw owner has published a fully
 * validated provider-free local-rebind successor. State keeps references
 * only; it never reconstructs or authorizes raw materialization facts.
 */
export function rebindTargetProgressiveRawEvidenceForLocalCompose(deckDir, {
  runVersion,
  runDir,
  previousSourceReceipt,
  nextSourceReceipt,
  previousProgressiveRawWorkPlan,
  nextProgressiveRawWorkPlan,
  previousAcceptedRawEvidence,
  nextAcceptedRawEvidence,
  expectedStateSha = null,
} = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const facts = progressiveLocalRebindFacts({
    previousSourceReceipt,
    nextSourceReceipt,
    previousProgressiveRawWorkPlan,
    nextProgressiveRawWorkPlan,
    previousAcceptedRawEvidence,
    nextAcceptedRawEvidence,
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
    schema: PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA,
    run_version: exactVersion,
    source_epoch: nextProgressiveRawWorkPlan.source_epoch,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256,
    workflow: facts.nextSource.workflow,
    raw_work_plan_sha256: facts.nextPlan.sha256,
    partial_pilot_decision_sha256: null,
    complete_raw_review_sha256: nextAcceptedRawEvidence.complete_raw_review_sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256,
    final_manifest_sha256: null,
    delivery_receipt_sha256: null,
  };
  if (!validProgressiveHandoffRecord(handoffs[versionKey], exactVersion)) throw new Error("TARGET_PROGRESSIVE_HANDOFF_INVALID");
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? execution.state_sha256, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_image_progressive_local_rebind",
    run_version: exactVersion,
    workflow: facts.nextSource.workflow,
    source_epoch: targetRecord.source_epoch,
    previous_source_receipt_sha256: facts.previousSource.source_receipt_sha256,
    source_receipt_sha256: facts.nextSource.source_receipt_sha256,
    previous_raw_work_plan_sha256: facts.previousPlan.sha256,
    raw_work_plan_sha256: facts.nextPlan.sha256,
    previous_accepted_raw_evidence_sha256: facts.previousEvidence.sha256,
    accepted_raw_evidence_sha256: facts.nextEvidence.sha256,
    at,
  });
  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    source_epoch: targetRecord.source_epoch,
    record: Object.freeze(structuredClone(targetRecord)),
    progressive_handoff: Object.freeze(structuredClone(handoffs[versionKey])),
  });
}

/**
 * Register one already-published current structural target with fresh evidence.
 * The source version remains an observation input only: no authorization,
 * review, final, delivery, or active-execution state crosses this boundary.
 */
export function registerTargetPageImageStructuralPublication(deckDir, {
  sourceRunVersion,
  sourceRunDir,
  targetRunVersion,
  targetRunDir,
  sourceReceipt,
  planHash,
  expectedStateSha = null,
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
      schema: PAGE_IMAGE_TARGET_STATE_SCHEMA,
      run_version: targetVersion,
      source_epoch: 1,
      source_receipt_sha256: targetSource.source_receipt_sha256,
      workflow: targetSource.workflow,
      provider_authorization_sha256: null,
      accepted_raw_evidence_sha256: null,
      final_manifest_sha256: null,
      delivery_receipt_sha256: null,
    };
  }
  // A vNext starts its own workflow. Keep the published target as the durable
  // continuation selector, but never let the source execution masquerade as
  // active target work.
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
    type: "page_image_target_structural_publication",
    source_version: sourceVersion,
    target_version: targetVersion,
    workflow: targetSource.workflow,
    plan_hash: planHash,
    source_epoch: 1,
    at,
  });
  return Object.freeze({
    ok: true,
    status: existingIdentity && existingEvidence ? "already-current" : "registered",
    source_version: sourceVersion,
    target_version: targetVersion,
    workflow: targetSource.workflow,
    source_epoch: 1,
  });
}

/**
 * Revalidate a previously published structural target without publishing or
 * touching current target execution. This is deliberately separate from the
 * first-publication writer so an active target Controller cannot be mistaken
 * for a source-side execution conflict.
 */
export function revalidateTargetPageImageStructuralReplay(deckDir, {
  sourceRunVersion,
  sourceRunDir,
  targetRunVersion,
  targetRunDir,
  sourceReceipt,
  planHash,
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
    ok: true,
    status: "exact-replay",
    source_version: sourceVersion,
    source_workflow: sourceInspection.workflow,
    source_epoch: sourceInspection.source_epoch,
    target_version: targetVersion,
    workflow: targetSource.workflow,
    target_source_epoch: targetIdentityRecord.source_epoch,
    selection_present: Boolean(selection),
  });
}

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

function progressivePlanFacts(progressiveRawWorkPlan) {
  const checked = validateProgressiveRawWorkPlan(progressiveRawWorkPlan);
  if (!checked.ok) throw new Error(checked.code || "TARGET_PROGRESSIVE_PLAN_INVALID");
  return Object.freeze({
    sha256: checked.sha256,
    run_version: progressiveRawWorkPlan.run_version,
    source_epoch: progressiveRawWorkPlan.source_epoch,
    source_receipt_sha256: progressiveRawWorkPlan.source_receipt_sha256,
    workflow: progressiveRawWorkPlan.workflow,
  });
}

function mutateProgressiveHandoff(deckDir, {
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  expectedStateSha = null,
  mutate,
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
      schema: PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA,
      run_version: context.exactVersion,
      source_epoch: facts.source_epoch,
      source_receipt_sha256: facts.source_receipt_sha256,
      workflow: facts.workflow,
      raw_work_plan_sha256: facts.sha256,
      partial_pilot_decision_sha256: null,
      complete_raw_review_sha256: null,
      accepted_raw_evidence_sha256: null,
      final_manifest_sha256: null,
      delivery_receipt_sha256: null,
    };
  handoffs[versionKey] = record;
  mutate(record, facts, context);
  if (!validProgressiveHandoffRecord(record, context.exactVersion)) throw new Error("TARGET_PROGRESSIVE_HANDOFF_INVALID");
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  return Object.freeze({
    run_version: context.exactVersion,
    record: Object.freeze(structuredClone(record)),
  });
}

/** Record the provider-free plan reference without copying raw-owner facts into state. */
export function recordTargetProgressiveRawPlan(deckDir, { runVersion, runDir, progressiveRawWorkPlan, expectedStateSha = null } = {}) {
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
    mutate() {},
  });
}

/** Persist only the exact partial-Pilot decision reference for Controller resume. */
export function recordTargetProgressivePilotDecision(deckDir, {
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  pilotDecisionSha256,
  expectedStateSha = null,
} = {}) {
  if (!SHA256_RE.test(pilotDecisionSha256 || "")) throw new TypeError("pilotDecisionSha256 must be a lowercase SHA-256");
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
    mutate(record) {
      record.partial_pilot_decision_sha256 = pilotDecisionSha256;
    },
  });
}

/** Persist only the exact complete-review reference for Controller resume. */
export function recordTargetProgressiveCompleteRawReview(deckDir, {
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  completeRawReviewSha256,
  expectedStateSha = null,
} = {}) {
  if (!SHA256_RE.test(completeRawReviewSha256 || "")) throw new TypeError("completeRawReviewSha256 must be a lowercase SHA-256");
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
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
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  acceptedRawEvidence,
  expectedStateSha = null,
} = {}) {
  const facts = progressivePlanFacts(progressiveRawWorkPlan);
  const evidence = validateProgressiveAcceptedRawEvidence(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  if (!evidence.ok || acceptedRawEvidence.raw_work_plan_sha256 !== facts.sha256) {
    throw new Error(evidence.code || "TARGET_PROGRESSIVE_RAW_EVIDENCE_INVALID");
  }
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
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
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  acceptedRawEvidence,
  finalManifest,
  expectedStateSha = null,
} = {}) {
  const evidence = validateProgressiveAcceptedRawEvidence(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  const final = validateFinalSlideManifest(finalManifest, { evidence: acceptedRawEvidence });
  if (!evidence.ok || !final.ok) throw new Error(final.code || evidence.code || "TARGET_PROGRESSIVE_FINAL_MANIFEST_INVALID");
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
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
  runVersion,
  runDir,
  progressiveRawWorkPlan,
  deliveryReceipt,
  expectedStateSha = null,
} = {}) {
  if (!deliveryReceipt || deliveryReceipt.schema !== "page-image-delivery-receipt" ||
    !SHA256_RE.test(deliveryReceipt.final_manifest_sha256 || "") ||
    !SHA256_RE.test(deliveryReceipt.delivery_media_manifest_sha256 || "") ||
    !Number.isInteger(deliveryReceipt.source_epoch) || deliveryReceipt.source_epoch <= 0) {
    throw new Error("TARGET_DELIVERY_RECEIPT_INVALID");
  }
  return mutateProgressiveHandoff(deckDir, {
    runVersion,
    runDir,
    progressiveRawWorkPlan,
    expectedStateSha,
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

function progressiveAuthorizeNodeId(workflow, batchKind) {
  if (!["framed", "pure"].includes(workflow) || !["pilot", "expansion"].includes(batchKind)) return null;
  return `authorize-target-${workflow}-${batchKind}`;
}

function progressiveAuthorizeCliEvidenceNote({ planHash, batchHash, grantHash, taskMandateSha256 } = {}) {
  return `plan=${planHash}; batch=${batchHash}; grant=${grantHash}; task-mandate=${taskMandateSha256}`;
}

function validProgressiveAuthorizeCliEvidence(evidence) {
  return isPlainObject(evidence) &&
    evidence.met === true &&
    evidence.kind === "cli" &&
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
 * has already recorded or replayed its immutable raw-owner grant. The direct
 * plan/batch/grant store remains authoritative; State owns only the typed CLI
 * handoff needed by the MD Controller.
 */
export function recordTargetProgressiveAuthorizeCliHandoff(deckDir, {
  runVersion,
  runDir,
  planHash,
  batchHash,
  grantHash,
  expectedStateSha = null,
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
    direct = readProgressiveRawPlanDirectRecords(join(deckDir, "3_versions", context.exactVersion), {
      plan_sha256: planHash,
    });
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
    ok: true,
    run_version: context.exactVersion,
    workflow: plan.workflow,
    node_id: expectedNodeId,
    plan_hash: planHash,
    batch_hash: batchHash,
    grant_hash: grantHash,
    task_mandate_sha256: plan.task_mandate_sha256,
  });
  if (context.state.playbook !== "create-deck" || context.state.current_node !== expectedNodeId) {
    return Object.freeze({
      ...base,
      status: "not-applicable",
      current_node: context.state.current_node || null,
    });
  }

  const note = progressiveAuthorizeCliEvidenceNote({
    planHash,
    batchHash,
    grantHash,
    taskMandateSha256: plan.task_mandate_sha256,
  });
  const existing = activeRecord(context.state, expectedNodeId);
  const existingEvidence = existing?.evidence?.[PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY] || null;
  const evidenceIsCurrent = validProgressiveAuthorizeCliEvidence(existingEvidence) && existingEvidence.note === note;
  const supersedesPriorCliGrant = existing?.status === "completed" &&
    !evidenceIsCurrent &&
    validProgressiveAuthorizeCliEvidence(existingEvidence) &&
    Object.keys(existing.evidence || {}).length === 1;
  if (existing?.status === "completed") {
    if (evidenceIsCurrent) {
      return Object.freeze({ ...base, status: "replay" });
    }
    if (!supersedesPriorCliGrant) {
      progressiveAuthorizeHandoffFailure("TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_NODE_CONFLICT");
    }
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
      kind: "cli",
      note,
    }, { runVersion: context.exactVersion });
  }
  setNodeStatus(next, expectedNodeId, "completed", {}, { runVersion: context.exactVersion });
  writeState(deckDir, next, { expectedStateSha: expectedStateSha ?? context.stateSha, updatedAt: nowIso() });
  appendHistory(deckDir, {
    type: "page_image_progressive_authorize_cli_handoff",
    run_version: context.exactVersion,
    workflow: plan.workflow,
    node_id: expectedNodeId,
    plan_sha256: planHash,
    batch_sha256: batchHash,
    grant_sha256: grantHash,
    task_mandate_sha256: plan.task_mandate_sha256,
    ...(supersedesPriorCliGrant ? { supersedes_prior_cli_grant: true } : {}),
  });
  return Object.freeze({
    ...base,
    status: supersedesPriorCliGrant ? "superseded" : evidenceIsCurrent ? "repaired" : "completed",
  });
}

/**
 * Read one normal MD Controller decision for a current progressive route.
 * The node record remains the owner of the optional human note; this helper
 * only returns a narrow typed projection and never promotes it to evidence.
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
    value: decision.value,
    kind: decision.kind,
    at: decision.at,
    ...(typeof decision.note === "string" ? { note: decision.note } : {}),
  });
}

/** Persist accepted raw evidence only when it binds the initialized target tuple. */
export function recordTargetAcceptedRawEvidence(deckDir, { runVersion, runDir, rawWorkPlan, acceptedRawEvidence, expectedStateSha = null } = {}) {
  const plan = validateRawWorkPlan(rawWorkPlan);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!plan.ok || !evidence.ok) throw new Error(evidence.code || plan.code || "TARGET_RAW_EVIDENCE_INVALID");
  return mutateTargetEvidenceRecord(deckDir, {
    runVersion,
    runDir,
    expectedStateSha,
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
    runVersion,
    runDir,
    expectedStateSha,
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
    runVersion,
    runDir,
    expectedStateSha,
    mutate(record) {
      if (deliveryReceipt.source_epoch !== record.source_epoch || deliveryReceipt.final_manifest_sha256 !== record.final_manifest_sha256) {
        throw new Error("TARGET_DELIVERY_LINEAGE_MISMATCH");
      }
      record.delivery_receipt_sha256 = targetEvidenceDigest(deliveryReceipt);
    },
  });
}

/** Read-only target state projection with one earliest repair-or-rerun action. */
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
 * stops before raw authorization, raw review, finalization, and delivery so
 * pre-raw owners can reuse the same byte/state boundary without treating
 * downstream lifecycle work as a source-currentness requirement.
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
    ok: true,
    workflow: record.workflow,
    source_epoch: record.source_epoch,
    record: Object.freeze(structuredClone(record)),
  });
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
      run_version: exactVersion,
      source_epoch: sourceEpoch,
      source_receipt_sha256: targetPlan.source_receipt_sha256,
      workflow: targetPlan.workflow,
      raw_work_plan_sha256: targetPlan.raw_work_plan_sha256,
      provider_profile_sha256: targetPlan.provider_profile_sha256,
      authorization_scope_sha256: targetPlan.authorization_scope_sha256,
      max_submissions: maxSubmissions,
      execution_id: state.execution_id,
      decided_at: nowIso(),
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
  if (!validTargetEvidenceRecord(targetEvidence, exactVersion)) {
    throw new Error("TARGET_STATE_INITIALIZATION_REQUIRED");
  }
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

export function readState(deckDir, opts = {}) {
  const purpose = opts.purpose || "execute";
  if (!["observe", "execute"].includes(purpose)) throw new TypeError("state read purpose must be observe or execute");
  const path = statePath(deckDir);
  if (!existsSync(path)) {
    return replacementRequired("authoritative state is missing");
  }
  let raw = "";
  let rawBytes = null;
  try {
    rawBytes = readFileSync(path);
    raw = rawBytes.toString("utf8");
  } catch (error) {
    return replacementRequired("authoritative state cannot be read");
  }
  const parsed = parseStateYaml(raw);
  if (!parsed.ok || parsed.hadErrors) return replacementRequired("authoritative state is not safely parseable");
  const version = selectedRunVersion(opts) || normalizeRunVersion(parsed.value.run_version) ||
    (!parsed.value.playbook ? exactContinuationTargetVersion(parsed.value.continuation_target_version) : null);
  let sourceMarker = null;
  if (version) {
    sourceMarker = probeSourceMarkerForVersion(deckDir, version);
    const markerPipeline = sourceMarker.ok === false ? null : pipelineFromSourceMarker(sourceMarker);
    const draftRecord = parsed.value.production_identity?.by_version?.[canonicalVersionKey(version)];
    const targetAuthoringDraft = isPageImageWorkflowSelectionPending(sourceMarker) &&
      parsed.value.pipeline === PAGE_IMAGE_WORKFLOW_PIPELINE && draftRecord === undefined;
    if (!markerPipeline?.ok && !targetAuthoringDraft) {
      // An inactive fixture may still name one visible run for the locator.
      // This is not a production-state read: the replacement fence remains
      // true and no current adapter can use it.
      const continuation = !parsed.value.playbook
        ? exactContinuationTargetVersion(parsed.value.continuation_target_version)
        : null;
      return Object.freeze({
        ...replacementRequired(`source/state identity is unsupported: ${markerPipeline?.code || sourceMarker.code || "marker unavailable"}`),
        ...(continuation ? { continuation_target_version: continuation } : {}),
      });
    }
    // A valid marker belongs to the source owner. The exact identity/pipeline pair
    // is evaluated by resolveRunProductionAdapter so drift remains visible as a
    // hard-stop instead of being misclassified as historical state.
  } else if (parsed.value.playbook) {
    return replacementRequired("authoritative active state has no exact run version");
  }
  const validation = validateState(parsed.value);
  if (!validation.valid) {
    const repair = version && sourceMarker ? currentOneToOneRepair(parsed.value, {
      deckDir,
      runVersion: version,
      sourceMarker,
    }) : null;
    if (!repair) return replacementRequired(`current state requires owner repair: ${validation.errors[0]}`);
    if (purpose === "observe") {
      return currentRepairRequired(`current state has a fence-clear one-to-one repair at ${repair.repair.field}`,
        pipelineFromSourceMarker(sourceMarker).pipeline);
    }
    try {
      writeState(deckDir, repair.state, { expectedStateSha: sha256(rawBytes) });
    } catch {
      return currentRepairRequired(`current state repair must be retried through its owning execution path at ${repair.repair.field}`,
        pipelineFromSourceMarker(sourceMarker).pipeline);
    }
    return markStateRepaired(markDurableStatePresent({ ...repair.state }), repair.repair);
  }
  return markDurableStatePresent({ ...parsed.value });
}

/**
 * Resolve the only execution that may mutate a run-scoped Page Image record.
 * This intentionally returns a separate discriminated result: callers never
 * receive an execution diagnostic disguised as a writable state object.
 */
export function resolveExactExecution(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const requested = selectedRunVersion({ runVersion, runDir });
  if (!requested) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });

  const state = readState(deckDir, { purpose, heal: false });
  if (state?.replacement_required || state?.corrupted) {
    return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", run_version: requested, state });
  }

  const active = state?.playbook ? normalizeRunVersion(state.run_version) : null;
  if (!active || active !== requested) {
    return Object.freeze({
      ok: false,
      code: "execution_run_version_mismatch",
      requested_run_version: requested,
      active_run_version: active,
    });
  }

  const sourceMarker = probeSourceMarkerForVersion(deckDir, requested);
  if (sourceMarker.ok === false) {
    return Object.freeze({ ok: false, code: sourceMarker.code, run_version: requested, marker: sourceMarker });
  }
  const sourcePipeline = pipelineFromSourceMarker(sourceMarker);
  if (!sourcePipeline.ok) {
    return Object.freeze({
      ok: false,
      code: sourceMarker.code || sourcePipeline.code || "MARKER_INVALID",
      run_version: requested,
      marker: sourceMarker,
    });
  }
  const path = statePath(deckDir);
  const stateBytes = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
  return Object.freeze({
    ok: true,
    run_version: requested,
    active_run_version: active,
    state: deepFreeze(deepClone(state)),
    state_sha256: sha256(stateBytes),
    source_identity: sourceMarker.identity ? deepFreeze(deepClone(sourceMarker.identity)) : null,
    source_marker: deepFreeze(deepClone(sourceMarker)),
  });
}

/** Direct workflow-owner boundary for exported run-scoped mutation APIs. */
export function requireExactExecutionForRun(runDir, { purpose = "execute" } = {}) {
  const canonicalRunDir = resolve(runDir || "");
  return requireExactExecution(resolve(canonicalRunDir, "..", ".."), { runDir: canonicalRunDir }, purpose);
}

function requireExactExecution(deckDir, selected, purpose = "execute") {
  const execution = resolveExactExecution(deckDir, { ...selected, purpose });
  if (!execution.ok) {
    const error = new Error(execution.code || "EXECUTION_RESOLUTION_FAILED");
    error.code = execution.code || "EXECUTION_RESOLUTION_FAILED";
    error.execution = execution;
    throw error;
  }
  return execution;
}

const KNOWN_EXECUTION_MISMATCH_KEYS = Object.freeze([
  "code",
  "requested_run_version",
  "active_run_version",
]);

function repairHardStop(code, { requestedRunVersion = null, activeRunVersion = null } = {}) {
  return Object.freeze({
    ok: false,
    code,
    ...(requestedRunVersion ? { requested_run_version: requestedRunVersion } : {}),
    ...(activeRunVersion ? { active_run_version: activeRunVersion } : {}),
  });
}

/**
 * Repair only the three top-level keys emitted by BUG-066. This deliberately
 * reads raw bytes because the record is otherwise invalid and cannot enter the
 * ordinary state reader. Every other malformed record remains untouched.
 */
export function repairKnownExecutionMismatch(deckDir, { runVersion, runDir } = {}) {
  const requested = selectedRunVersion({ runVersion, runDir });
  if (!requested) return repairHardStop("RUN_VERSION_INVALID");
  const path = statePath(deckDir);
  if (!existsSync(path)) return repairHardStop("STATE_UNAVAILABLE", { requestedRunVersion: requested });

  let rawBytes;
  try {
    rawBytes = readFileSync(path);
  } catch {
    return repairHardStop("STATE_UNAVAILABLE", { requestedRunVersion: requested });
  }
  const parsed = parseStateYaml(rawBytes.toString("utf8"));
  if (!parsed.ok || parsed.hadErrors || !isPlainObject(parsed.value)) {
    return repairHardStop("REPAIR_STATE_PARSE_INVALID", { requestedRunVersion: requested });
  }
  const state = parsed.value;
  const active = state.playbook ? normalizeRunVersion(state.run_version) : null;
  if (!active || active !== requested) {
    return repairHardStop("execution_run_version_mismatch", {
      requestedRunVersion: requested,
      activeRunVersion: active,
    });
  }

  const sourceMarker = probeSourceMarkerForVersion(deckDir, active);
  if (sourceMarker.ok === false) return repairHardStop(sourceMarker.code, { requestedRunVersion: requested, activeRunVersion: active });
  if (!pipelineFromSourceMarker(sourceMarker).ok) {
    return repairHardStop(sourceMarker.code || "MARKER_INVALID", { requestedRunVersion: requested, activeRunVersion: active });
  }

  const unknownKeys = Object.keys(state).filter((key) => !STATE_TOP_LEVEL_KEYS.has(key));
  const hasKnownSignature = KNOWN_EXECUTION_MISMATCH_KEYS.some((key) => Object.hasOwn(state, key));
  if (!hasKnownSignature) {
    const valid = validateState(state).valid && inspectProductionIdentity({ state, runVersion: active, sourceMarker }).ok;
    return valid
      ? Object.freeze({ ok: true, status: "no-repair-needed", run_version: active })
      : repairHardStop("REPAIR_SIGNATURE_REQUIRED", { requestedRunVersion: requested, activeRunVersion: active });
  }
  if (unknownKeys.length !== KNOWN_EXECUTION_MISMATCH_KEYS.length ||
    !KNOWN_EXECUTION_MISMATCH_KEYS.every((key) => unknownKeys.includes(key)) ||
    state.code !== "execution_run_version_mismatch" ||
    state.requested_run_version !== requested ||
    state.active_run_version !== active) {
    return repairHardStop("REPAIR_SIGNATURE_INVALID", { requestedRunVersion: requested, activeRunVersion: active });
  }

  const repaired = deepClone(state);
  for (const key of KNOWN_EXECUTION_MISMATCH_KEYS) delete repaired[key];
  const validation = validateState(repaired);
  if (!validation.valid || !inspectProductionIdentity({ state: repaired, runVersion: active, sourceMarker }).ok) {
    return repairHardStop("REPAIR_CANDIDATE_INVALID", { requestedRunVersion: requested, activeRunVersion: active });
  }
  try {
    writeState(deckDir, repaired, { expectedStateSha: sha256(rawBytes) });
  } catch (error) {
    return repairHardStop(error?.code || (/^CONFLICT:/.test(error?.message || "") ? "CONFLICT" : "REPAIR_WRITE_FAILED"), {
      requestedRunVersion: requested,
      activeRunVersion: active,
    });
  }
  appendHistory(deckDir, {
    type: "state_known_execution_mismatch_repaired",
    run_version: active,
    repaired_keys: KNOWN_EXECUTION_MISMATCH_KEYS,
  });
  return Object.freeze({ ok: true, status: "repaired", run_version: active });
}

export function appendHistory(deckDir, event) {
  const value = { ...event, at: event?.at || nowIso() };
  const path = historyPath(deckDir);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(value)}\n`, "utf8");
}

export function readHistory(deckDir) {
  const path = historyPath(deckDir);
  if (!existsSync(path)) return [];
  try {
    return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function cleanStaleTemps(dir) {
  try {
    for (const name of readdirSync(dir)) {
      if (name.startsWith(`.${STATE_FILE}.tmp-`)) rmSync(join(dir, name), { force: true });
    }
  } catch { /* optional */ }
}

export function prepareStateWrite(state, { updatedAt = nowIso() } = {}) {
  const { _healed, ...persist } = state;
  delete persist._heal_pending;
  delete persist.durable_state_present;
  persist.updated_at = updatedAt;
  assertCurrentPlaybookStack(persist);
  const bytes = Buffer.from(STATE_YAML_HEADER + stringifyStateYaml(persist), "utf8");
  return Object.freeze({ persist, bytes, sha256: sha256(bytes), updatedAt });
}

function readJournalSnapshot(deckDir) {
  const path = join(deckDir, STATE_DIR, GATE_JOURNAL_FILE);
  if (!existsSync(path)) return { path, bytes: null, record: null };
  const bytes = readFileSync(path);
  let record;
  try { record = JSON.parse(bytes.toString("utf8")); } catch { throw new Error("CONFLICT: gate approval journal is invalid"); }
  return { path, bytes, record };
}

function executionLeaseRecord(state, stateSha) {
  const activeRunVersion = state.playbook ? normalizeRunVersion(state.run_version) : null;
  if (state.playbook && !activeRunVersion) throw new Error("STATE_CANDIDATE_INVALID: active playbook missing normalized run version");
  return Buffer.from(`${JSON.stringify({
    schema: EXECUTION_LEASE_SCHEMA,
    active_run_version: activeRunVersion,
    state_sha256: stateSha,
  })}\n`, "utf8");
}

function writeExecutionLease(deckDir, state, stateSha) {
  const path = executionLeasePath(deckDir);
  const dir = dirname(path);
  const bytes = executionLeaseRecord(state, stateSha);
  const temp = join(dir, `.${EXECUTION_LEASE_FILE}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  writeFileSync(temp, bytes);
  try {
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
}

export function writeState(deckDir, state, opts = {}) {
  const expectedStateSha = opts.expectedStateSha ?? null;
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");
  const path = statePath(deckDir);
  const oldBytes = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
  const oldSha = sha256(oldBytes);
  if (expectedStateSha !== null && oldSha !== expectedStateSha) throw new Error("CONFLICT: state precondition changed");
  const journal = readJournalSnapshot(deckDir);
  if (journal.record) {
    if (!opts.journalOwnerToken || opts.journalOwnerToken !== journal.record.owner_token) throw new Error("CONFLICT: gate approval journal fences state writes");
  }
  const prepared = prepareStateWrite(state, { updatedAt: opts.updatedAt || nowIso() });
  // The writer is the final grammar admission boundary. In particular, caller
  // diagnostics must never be cleaned into an otherwise durable state record.
  const validation = validateState(prepared.persist);
  if (!validation.valid) throw new Error(`STATE_CANDIDATE_INVALID: ${validation.errors[0]}`);
  const continuationTargetError = continuationTargetVisibilityError(prepared.persist, deckDir);
  if (continuationTargetError) throw new Error(`continuation_target_invalid: ${continuationTargetError}`);
  if (journal.record && prepared.sha256 !== journal.record.new_state_sha256) throw new Error("CONFLICT: journal owner attempted unbound state bytes");
  ensureStateDirHints(deckDir);
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  cleanStaleTemps(dir);
  const temp = join(dir, `.${STATE_FILE}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  writeFileSync(temp, prepared.bytes);
  try {
    const currentBytes = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
    if (sha256(currentBytes) !== oldSha) throw new Error("CONFLICT: state changed before commit");
    const currentJournal = readJournalSnapshot(deckDir);
    if (Boolean(currentJournal.record) !== Boolean(journal.record) || (journal.bytes && !currentJournal.bytes?.equals(journal.bytes))) throw new Error("CONFLICT: gate approval journal changed before state commit");
    renameSync(temp, path);
    writeExecutionLease(deckDir, prepared.persist, prepared.sha256);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  state.updated_at = prepared.persist.updated_at;
  cleanStaleTemps(dir);
}

// Retired protocols have no state API, receipt initializer, or transition.
function activeRecord(state, name) {
  const record = state?.nodes?.[name];
  if (!isPlainObject(record) || isReservedNode(name)) return record || null;
  if (!state.execution_id || record.execution_id !== state.execution_id) return null;
  const activeRunVersion = normalizeRunVersion(state.run_version);
  if (!activeRunVersion || record.run_version !== activeRunVersion) return null;
  return record;
}

export function getNodeStatus(state, name) { return activeRecord(state, name)?.status || "pending"; }
export function getCurrentNode(state) { return state?.current_node || ""; }
export function getCompletedNodes(state, nodeIds) {
  const ids = nodeIds || controllerEntries(state?.nodes).map(([id]) => id);
  return ids.filter((id) => getNodeStatus(state, id) === "completed");
}
export function getPendingNodes(state, nodeIds) {
  const ids = nodeIds || controllerEntries(state?.nodes).map(([id]) => id);
  return ids.filter((id) => getNodeStatus(state, id) === "pending");
}
export function isNodeCompleted(state, name) { return getNodeStatus(state, name) === "completed"; }
export function isNodeDone(state, name) { return ["completed", "skipped"].includes(getNodeStatus(state, name)); }
export function isPlaybookComplete(state, nodeIds) {
  const ids = nodeIds || controllerEntries(state?.nodes).map(([id]) => id);
  return ids.length > 0 && ids.every((id) => ["completed", "skipped"].includes(getNodeStatus(state, id)));
}
export function getGateStatus(state, name) { return state?.gates?.[name] || "pending"; }
export function isGateApproved(state, name) { return ["approved", "waived"].includes(getGateStatus(state, name)); }

function workflowForControllerContext(state, ctx = {}) {
  const requested = ctx.productionWorkflow ?? ctx.production_workflow ?? null;
  const runVersion = normalizeRunVersion(ctx.runVersion ?? ctx.run_version ?? ctx.runDir ?? ctx.run_dir);
  const record = runVersion
    ? state?.production_identity?.by_version?.[canonicalVersionKey(runVersion)]
    : null;
  const bound = isProductionIdentityRecord(record)
    ? record.workflow
    : null;
  if (requested != null && !PAGE_IMAGE_WORKFLOWS.includes(requested)) return null;
  if (bound && requested && bound !== requested) return null;
  return bound || requested || null;
}

function activeControllerNodeIds(index, playbook, state, ctx = {}) {
  return controllerActiveNodeIds(index, playbook, workflowForControllerContext(state, ctx));
}

function nodeIsActiveForController(index, controller, nodeId, state, ctx = {}) {
  return activeControllerNodeIds(index, controller.playbook, state, ctx).includes(nodeId);
}

function activeRequiredNodeIds(index, controller, node, state, ctx = {}) {
  const active = new Set(activeControllerNodeIds(index, controller.playbook, state, ctx));
  return node.requires.filter((nodeId) => active.has(nodeId));
}

export function buildResumeCard(state, _statusSnapshot = null, controller = null) {
  const selected = controller?.ctx || {};
  const executionMismatch = selectedExecutionMismatch(state, selected);
  if (executionMismatch) {
    return {
      playbook: "",
      current_node: "",
      node_status: "",
      waiting_for: null,
      note: null,
      gates: {},
      playbook_stack: [],
      completed_nodes: [],
      pending_nodes: [],
      eligible_candidates: [],
      workflow_summary: "execution_run_version_mismatch",
      suggested_next: "repair:execution_run_version_mismatch",
      production_identity: null,
      ...executionMismatch,
    };
  }
  const playbook = state?.playbook == null ? "" : String(state.playbook);
  const current_node = state?.current_node == null ? "" : String(state.current_node);
  const nodeRec = state?.nodes?.[current_node] || {};
  const node_status = nodeRec.status == null ? "" : String(nodeRec.status);
  const waiting_for = nodeRec.waiting_for ? String(nodeRec.waiting_for) : null;
  const note = nodeRec.note ? String(nodeRec.note) : null;
  const gates = { ...(state?.gates || {}) };
  const playbook_stack = Array.isArray(state?.playbook_stack) ? deepClone(state.playbook_stack) : [];
  const execLabel = `${playbook || "（未初始化）"} / ${current_node || "（未初始化）"}`;
  const workflow_summary = `执行点：${execLabel}`;

  const identityRunVersion = controller?.ctx?.runVersion || controller?.ctx?.run_version || null;
  const production_identity = identityRunVersion ? projectProductionIdentityCard(state, identityRunVersion) : null;
  const suppliedWorkflow = controller?.ctx?.productionWorkflow ?? controller?.ctx?.production_workflow ?? null;
  const controllerCtx = production_identity?.resolvable && suppliedWorkflow == null
    ? { ...(controller?.ctx || {}), productionWorkflow: production_identity.workflow }
    : (controller?.ctx || {});
  let eligible_candidates = [];
  if (controller?.index && playbook) {
    eligible_candidates = getEligibleNextNodes(controller.index, playbook, state, controllerCtx);
  }
  const suggested_next = "inspect:workflow-inspection";

  // Derive the active node set from the exact authoritative workflow when resolvable.
  const activeNodeIds = controller?.index
    ? activeControllerNodeIds(controller.index, playbook, state, controllerCtx)
    : undefined;
  return {
    playbook,
    current_node,
    node_status,
    waiting_for,
    note,
    gates,
    playbook_stack,
    completed_nodes: activeNodeIds ? getCompletedNodes(state, activeNodeIds) : getCompletedNodes(state),
    pending_nodes: activeNodeIds ? getPendingNodes(state, activeNodeIds) : getPendingNodes(state),
    eligible_candidates,
    workflow_summary,
    suggested_next,
    production_identity,
  };
}

/** Resume-card identity projection: workflow plus source epoch, or a typed gap. */
function projectProductionIdentityCard(state, runVersion) {
  const exactVersion = normalizeRunVersion(runVersion);
  const versionKey = canonicalVersionKey(exactVersion);
  if (!versionKey) return Object.freeze({ resolvable: false, code: "RUN_VERSION_INVALID" });
  const record = isPlainObject(state?.production_identity?.by_version) ? state.production_identity.by_version[versionKey] : null;
  if (!isProductionIdentityRecord(record)) return Object.freeze({ resolvable: false, code: "IDENTITY_MISSING", run_version: exactVersion });
  return Object.freeze({ resolvable: true, run_version: exactVersion, workflow: record.workflow, source_epoch: record.source_epoch });
}

/** Project completion from the selected current workflow's delivery receipt. */
export function projectProductionIdentityCompletion(state, { runVersion } = {}) {
  const exactVersion = normalizeRunVersion(runVersion);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  const versionKey = canonicalVersionKey(exactVersion);
  const record = isPlainObject(state?.production_identity?.by_version) ? state.production_identity.by_version[versionKey] : null;
  if (!isProductionIdentityRecord(record)) return Object.freeze({ ok: false, code: "IDENTITY_MISSING", run_version: exactVersion, next_action: "register_production_identity" });
  const targetEvidence = targetEvidenceRecord(state, exactVersion);
  const missing = [];
  if (!validTargetEvidenceRecord(targetEvidence, exactVersion) || !SHA256_RE.test(targetEvidence.delivery_receipt_sha256 || "")) {
    missing.push({ owner: "05-delivery", action: "complete_current_delivery" });
  }
  return Object.freeze({ ok: true, workflow: record.workflow, source_epoch: record.source_epoch, complete: missing.length === 0, missing });
}

function requireActiveExecution(state, selected = {}) {
  if (!state?.playbook || !state?.execution_id) throw new Error("active playbook execution required");
  return requireExecutionRunVersion(state, selected);
}

export function setNodeStatus(state, name, status, extra = {}, selected = {}) {
  const activeRunVersion = requireActiveExecution(state, selected);
  if (!NODE_STATUSES.includes(status)) throw new Error(`invalid node status: ${status}`);
  const previous = activeRecord(state, name) || {};
  if (extra.run_version != null && extra.run_version !== activeRunVersion) throw new Error("execution_run_version_mismatch: node record run_version differs from active execution");
  const record = { ...previous, ...extra, status, execution_id: state.execution_id };
  record.run_version = activeRunVersion;
  record.evidence = isPlainObject(record.evidence) ? record.evidence : {};
  const now = nowIso();
  if (status === "in_progress") {
    record.started = now;
    delete record.completed;
  } else if (status === "pending") {
    delete record.started;
    delete record.completed;
  } else {
    record.completed = now;
  }
  if (status === "completed") {
    delete record.failed_reason;
    delete record.error;
    delete record.waiting_for;
  }
  state.nodes ||= {};
  state.nodes[name] = record;
  state.current_node = name;
  return state;
}

export function resetNode(state, name, selected = {}) {
  const activeRunVersion = requireActiveExecution(state, selected);
  state.nodes ||= {};
  state.nodes[name] = { status: "pending", execution_id: state.execution_id, run_version: activeRunVersion };
  return state;
}
export function skipNode(state, name, reason = "", selected = {}) { return setNodeStatus(state, name, "skipped", { skip_reason: String(reason) }, selected); }
export function setGate(state, name, status) {
  if (!GATE_STATUSES.includes(status)) throw new Error(`invalid gate status: ${status}`);
  state.gates ||= {};
  state.gates[name] = status;
  return state;
}

function validateEvidenceKind(kind) {
  if (!["user", "agent", "cli"].includes(kind)) throw new Error(`invalid evidence kind: ${kind}`);
}
export function setNodeEvidence(state, nodeId, key, { kind, note } = {}, selected = {}) {
  const activeRunVersion = requireActiveExecution(state, selected);
  validateEvidenceKind(kind);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key || "")) throw new Error(`invalid evidence key: ${key}`);
  state.nodes ||= {};
  const record = activeRecord(state, nodeId) || { status: "in_progress", execution_id: state.execution_id, run_version: activeRunVersion };
  record.evidence ||= {};
  record.evidence[key] = { met: true, kind, at: nowIso(), ...(note == null ? {} : { note: String(note) }) };
  record.execution_id = state.execution_id;
  record.run_version = activeRunVersion;
  state.nodes[nodeId] = record;
  state.current_node = nodeId;
  return state;
}
export function setNodeDecision(state, nodeId, value, { kind, note } = {}, playbookIndex, selected = {}) {
  const activeRunVersion = requireActiveExecution(state, selected);
  validateEvidenceKind(kind);
  const declaration = playbookIndex ? resolveNode(playbookIndex, state.playbook, nodeId) : null;
  if (!declaration) throw new Error(`unknown node declaration: ${state.playbook}/${nodeId}`);
  if (!declaration.decisions.includes(String(value))) throw new Error(`invalid decision ${value}; allowed: ${declaration.decisions.join(", ")}`);
  state.nodes ||= {};
  const record = activeRecord(state, nodeId) || { status: "in_progress", execution_id: state.execution_id, run_version: activeRunVersion };
  record.decision = { value: String(value), kind, at: nowIso(), ...(note == null ? {} : { note: String(note) }) };
  record.execution_id = state.execution_id;
  record.run_version = activeRunVersion;
  state.nodes[nodeId] = record;
  state.current_node = nodeId;
  return state;
}

function preserveReservedNodes(nodes = {}) { return Object.fromEntries(reservedEntries(nodes).map(([id, rec]) => [id, deepClone(rec)])); }
function activeExecutionIncomplete(state) {
  return controllerEntries(state?.nodes).some(([, rec]) => !["completed", "skipped"].includes(rec?.status));
}
export function startPlaybook(state, playbook, { replace = false, runVersion, runDir } = {}) {
  assertCurrentPlaybookStack(state);
  if (state.playbook_stack.length > 0) throw new Error("cannot start a top-level playbook while playbook_stack is non-empty; use switchPlaybook");
  if (state.playbook && activeExecutionIncomplete(state) && !replace) throw new Error("active playbook execution is incomplete; pass replace:true to replace it");
  if (state.playbook) requireExecutionRunVersion(state, { runVersion, runDir });
  const exactRunVersion = selectedRunVersion({ runVersion, runDir }) || normalizeRunVersion(state.run_version) || "v1";
  const now = nowIso();
  state.playbook = String(playbook);
  state.current_node = "";
  state.execution_id = newExecutionId();
  state.execution_started_at = now;
  state.run_version = exactRunVersion;
  if (!state.started_at) state.started_at = now;
  state.nodes = preserveReservedNodes(state.nodes);
  return state;
}
export function switchPlaybook(state, newPlaybook, selected = {}) {
  const activeRunVersion = requireActiveExecution(state, selected);
  assertCurrentPlaybookStack(state);
  const snapshot = Object.fromEntries(controllerEntries(state.nodes).map(([id, rec]) => [id, deepClone(rec)]));
  state.playbook_stack.push({
    playbook: state.playbook,
    current_node: state.current_node,
    execution_id: state.execution_id,
    execution_started_at: state.execution_started_at,
    run_version: activeRunVersion,
    controller_nodes: snapshot,
  });
  const reserved = preserveReservedNodes(state.nodes);
  state.playbook = String(newPlaybook);
  state.current_node = "";
  state.execution_id = newExecutionId();
  state.execution_started_at = nowIso();
  state.run_version = activeRunVersion;
  state.nodes = reserved;
  return state;
}
export function resumePlaybook(state, selected = {}) {
  requireExecutionRunVersion(state, selected);
  assertCurrentPlaybookStack(state);
  if (state.playbook_stack.length === 0) return state;
  const reserved = preserveReservedNodes(state.nodes);
  const parent = state.playbook_stack.pop();
  state.playbook = parent.playbook;
  state.current_node = parent.current_node;
  state.execution_id = parent.execution_id;
  state.execution_started_at = parent.execution_started_at;
  state.run_version = parent.run_version;
  state.nodes = { ...deepClone(parent.controller_nodes), ...reserved };
  return state;
}

export function createDefaultState() {
  return {
    pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
    production_identity: { by_version: {} },
    playbook: "",
    current_node: "",
    execution_id: "",
    execution_started_at: "",
    run_version: "",
    continuation_target_version: "",
    started_at: "",
    updated_at: "",
    nodes: {},
    gates: { content: "pending", visual: "pending" },
    deck: { name: "", type: "", style: "" },
    playbook_stack: [],
  };
}
export function createInitialState(deckName, deckType, style, { workflow = null } = {}) {
  if (!["framed", "pure"].includes(workflow)) {
    throw new TypeError("initial state requires workflow framed | pure");
  }
  const state = createDefaultState();
  state.pipeline = PAGE_IMAGE_WORKFLOW_PIPELINE;
  state.production_identity.by_version[canonicalVersionKey("v1")] = initialProductionIdentityRecord(workflow);
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck", { runVersion: "v1" });
  state.current_node = "checkpoint-intake";
  return state;
}

/** Create a fresh authoring state before the human records a workflow. */
export function createTargetAuthoringState(deckName, deckType, style) {
  const state = createDefaultState();
  state.pipeline = PAGE_IMAGE_WORKFLOW_PIPELINE;
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck", { runVersion: "v1" });
  state.current_node = "author-target-narrative-sources";
  return state;
}

export function validateState(state) {
  const errors = [];
  if (!isPlainObject(state)) return { valid: false, errors: ["state is null"] };
  if (state.corrupted) return { valid: false, errors: state.errors || ["corrupted"] };
  const nodes = isPlainObject(state.nodes) ? state.nodes : {};
  const gates = isPlainObject(state.gates) ? state.gates : {};
  if (!isPlainObject(state.nodes)) errors.push("missing nodes");
  if (!isPlainObject(state.gates)) errors.push("missing gates");
  for (const key of Object.keys(state)) {
    if (!STATE_TOP_LEVEL_KEYS.has(key)) errors.push(`unknown top-level state key ${key}`);
  }
  if (state.playbook && (!state.execution_id || !state.execution_started_at)) errors.push("active playbook missing execution fields");
  if (state.continuation_target_version != null && state.continuation_target_version !== "" && !exactContinuationTargetVersion(state.continuation_target_version)) {
    errors.push("continuation_target_version must be a normalized vN");
  }
  errors.push(...executionBindingErrors(state));
  for (const [name, node] of controllerEntries(nodes)) {
    if (!NODE_STATUSES.includes(node?.status)) errors.push(`invalid status for ${name}`);
    if (node?.execution_id !== state.execution_id) errors.push(`execution mismatch for ${name}`);
    if (node?.status === "in_progress" && node.completed) errors.push(`illegal: ${name} completed→in_progress`);
  }
  for (const gate of ["content", "visual"]) if (!GATE_STATUSES.includes(gates[gate])) errors.push(`invalid gate ${gate}`);
  validateProductionIdentityStructure(state, errors);
  validateStyleMasterSelectionStructure(state, errors);
  validatePageImageRawAuthorizationStructure(state, errors);
  validatePageImageTaskMandateStructure(state, errors);
  validateTargetEvidenceStructure(state, errors);
  validateProgressiveHandoffStructure(state, errors);
  validateCurrentControllerIdentity(state, errors);
  return { valid: errors.length === 0, errors };
}

function validateControllerFrameIdentity(index, frame, label, errors) {
  const controller = index.controllers.get(frame?.playbook);
  if (!controller) {
    errors.push(`${label} uses retired or unknown Controller ${String(frame?.playbook || "")}`);
    return;
  }
  const nodeIds = new Set(controllerNodeIds(index, controller.playbook));
  if (!nodeIds.has(frame.current_node)) {
    errors.push(`${label} uses retired or unknown node ${String(frame.current_node || "")}`);
  }
  for (const nodeId of Object.keys(frame.controller_nodes || {})) {
    if (!nodeIds.has(nodeId)) errors.push(`${label} contains retired or unknown node ${nodeId}`);
  }
}

function validateCurrentControllerIdentity(state, errors) {
  const activeNodes = controllerEntries(state?.nodes || {});
  if (!state?.playbook) {
    if (activeNodes.length > 0) errors.push("inactive state retains Controller node identity");
    return;
  }
  let index;
  try {
    index = buildPlaybookIndex(DEFAULT_PLAYBOOK_DIR);
  } catch {
    errors.push("current Controller registry is unavailable");
    return;
  }
  if (!validatePlaybookIndex(index).valid) {
    errors.push("current Controller registry is invalid");
    return;
  }
  validateControllerFrameIdentity(index, {
    playbook: state.playbook,
    current_node: state.current_node,
    controller_nodes: Object.fromEntries(activeNodes),
  }, "active state", errors);
  for (const [indexPosition, frame] of (state.playbook_stack || []).entries()) {
    validateControllerFrameIdentity(index, frame, `playbook_stack[${indexPosition}]`, errors);
  }
}

function stateIssue(path, expected, actual, kind = "state", next_action = "repair_state") {
  return Object.freeze({
    path,
    expected: expected == null ? "null" : String(expected).slice(0, 128),
    actual: actual == null ? "null" : String(actual).slice(0, 128),
    kind,
    next_action,
  });
}

function hasExactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/** Ensure the production-identity container exists with a plain by_version map. */
function ensureProductionIdentityContainer(state) {
  const prior = isPlainObject(state.production_identity) && isPlainObject(state.production_identity.by_version)
    ? state.production_identity.by_version
    : {};
  state.production_identity = { by_version: prior };
  return state.production_identity.by_version;
}

/** Structural validation for the in-memory state used by validateState. */
function validateProductionIdentityStructure(state, errors) {
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

/** Read-only validation for persisted bytes used by validateStateReadOnly. */
function validateProductionIdentityReadOnly(state, issues) {
  const pm = state.production_identity;
  if (pm == null) return;
  if (!hasExactKeys(pm, ["by_version"]) || !isPlainObject(pm.by_version)) {
    issues.push(stateIssue("production_identity", "by_version-only production_identity map", "invalid", "record"));
    return;
  }
  for (const [key, record] of Object.entries(pm.by_version)) {
    const recordPath = `production_identity.by_version.${key}`;
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      issues.push(stateIssue(recordPath, "canonical 3_versions/vN key", "noncanonical", "record"));
      continue;
    }
    if (!isProductionIdentityRecord(record)) {
      issues.push(stateIssue(
        recordPath,
        "exact {workflow: framed|pure, source_epoch: positive integer} record",
        "unknown-or-invalid",
        "record",
        "repair_page_image_state",
      ));
    }
  }
}

/** Read-only validation for the first-class Image2 evidence maps. */
function versionFromReservedKey(key) {
  return /^3_versions\/(v[1-9][0-9]*)$/.exec(key)?.[1] || null;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/**
 * Validate persisted bytes without calling readState/heal/writeState. This is
 * intentionally diagnostic-only so a corrupted record cannot be changed by
 * observing it through the public CLI.
 */
export function validateStateReadOnly(deckDir, { runDir = null } = {}) {
  const path = statePath(deckDir);
  const issues = [];
  if (!existsSync(path)) return Object.freeze({ valid: false, issues: Object.freeze([stateIssue("state.yaml", "existing state file", "missing", "state", "initialize_or_restore_state")]) });
  const bytes = readFileSync(path);
  const parsed = parseStateYaml(bytes.toString("utf8"));
  if (!parsed.ok) return Object.freeze({ valid: false, issues: Object.freeze(parsed.errors.slice(0, 20).map(() => stateIssue("state.yaml", "valid YAML mapping", "parse-error", "yaml", "repair_state"))) });
  if (parsed.hadErrors) issues.push(stateIssue("state.yaml", "unambiguous YAML", "parser-diagnostics", "yaml", "repair_state"));
  const state = parsed.value;
  const selectedMismatch = selectedExecutionMismatch(state, { runDir });
  if (selectedMismatch) {
    issues.push(stateIssue(
      "run_version",
      selectedMismatch.requested_run_version,
      selectedMismatch.active_run_version || "missing",
      "execution",
      "select_active_run_version",
    ));
  }
  for (const key of Object.keys(state)) if (!STATE_TOP_LEVEL_KEYS.has(key)) issues.push(stateIssue(key, "known top-level state key", "unknown", "state"));
  for (const error of validateState(state).errors.slice(0, 20)) issues.push(stateIssue("state", "valid schema invariant", error, "state"));
  const continuationTargetError = continuationTargetVisibilityError(state, deckDir);
  if (continuationTargetError) {
    issues.push(stateIssue("continuation_target_version", "normalized visible canonical vN", state.continuation_target_version || "missing", "state", "guide_explicit_run"));
  }
  validateProductionIdentityReadOnly(state, issues);
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues.slice(0, 64)) });
}

function currentEvidence(state, nodeId, key, userOnly = false) {
  const evidence = activeRecord(state, nodeId)?.evidence?.[key];
  return Boolean(evidence?.met === true && (!userOnly || evidence.kind === "user"));
}
function currentDecision(state, nodeId, userOnly = false) {
  const decision = activeRecord(state, nodeId)?.decision;
  return Boolean(decision?.value && (!userOnly || decision.kind === "user"));
}

export const CONDITIONS = {
  run_bundle_exists: (_state, ctx) => existsSync(ctx.deckDir || ""),
  deck_guide_created: (_state, ctx) => existsSync(join(ctx.deckDir || "", "deck-guide.md")),
  visual_preset_seeded: (_state, ctx) => existsSync(join(ctx.deckDir || "", ...PAGE_IMAGE_VISUAL_LANGUAGE_RELATIVE_PATH.split("/"))),
  style_master_exists: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "style_master.jpg")),
  style_master_accepted: (state, ctx) => {
    try {
      const result = resolveEffectiveStyleMasterSelection(ctx.deckDir || "", {
        runVersion: ctx.runVersion || ctx.run_version || ctx.runDir || ctx.run_dir,
        state,
      });
      return result.ok === true && result.current === true;
    } catch {
      return false;
    }
  },
  slide_specs_exists: (_state, ctx) => existsSync(join(ctx.runDir || "", "slide-specifications.md")),
  slide_specs_valid: (_state, ctx) => typeof ctx.slideSpecsValid === "function" ? Boolean(ctx.slideSpecsValid()) : ctx.slideSpecsValid === true,
  pptx_generated: (state, ctx) => {
    const runVersion = normalizeRunVersion(ctx.runVersion || ctx.runDir);
    const evidence = targetEvidenceRecord(state, runVersion);
    return validTargetEvidenceRecord(evidence, runVersion) && SHA256_RE.test(evidence.delivery_receipt_sha256 || "");
  },
  speaker_notes_injected: (state, ctx) => {
    const runVersion = normalizeRunVersion(ctx.runVersion || ctx.runDir);
    const evidence = targetEvidenceRecord(state, runVersion);
    return validTargetEvidenceRecord(evidence, runVersion) && SHA256_RE.test(evidence.delivery_receipt_sha256 || "");
  },
};

function resolveCondition(condition, node, state, ctx) {
  if (CONDITIONS[condition]) return () => CONDITIONS[condition](state, ctx);
  if (condition.startsWith("gate_approved:")) return () => isGateApproved(state, condition.slice(14));
  if (condition.startsWith("node_completed:")) return () => isNodeCompleted(state, condition.slice(15));
  if (condition.startsWith("node_done:")) return () => isNodeDone(state, condition.slice(10));
  if (condition.startsWith("node_status:")) {
    const parts = condition.slice(12).split(":");
    const expected = parts.pop();
    return () => getNodeStatus(state, parts.join(":")) === expected;
  }
  if (condition.startsWith("evidence:")) return () => currentEvidence(state, node.id, condition.slice(9));
  if (condition.startsWith("user_evidence:")) return () => currentEvidence(state, node.id, condition.slice(14), true);
  if (condition === "decision_recorded") return () => currentDecision(state, node.id);
  if (condition === "user_decision_recorded") return () => currentDecision(state, node.id, true);
  if (condition.startsWith("node_evidence:")) {
    const [, upstream, key] = condition.split(":");
    return () => node.requires.includes(upstream) && getNodeStatus(state, upstream) === "completed" && currentEvidence(state, upstream, key);
  }
  if (condition.startsWith("node_decision:")) {
    const [, upstream, ...valueParts] = condition.split(":");
    const value = valueParts.join(":");
    return () => node.requires.includes(upstream) && getNodeStatus(state, upstream) === "completed" && activeRecord(state, upstream)?.decision?.value === value;
  }
  return null;
}

function checkConditions(conditions, node, state, ctx) {
  const missing = [];
  const unknown = [];
  for (const condition of conditions) {
    const check = resolveCondition(condition, node, state, ctx);
    if (!check) unknown.push(condition);
    else {
      try { if (!check()) missing.push(condition); } catch { missing.push(condition); }
    }
  }
  return { pass: missing.length === 0 && unknown.length === 0, missing, unknown };
}

function readValidatedNode(nodeName, playbookDir, state) {
  const index = buildPlaybookIndex(playbookDir);
  const validation = validatePlaybookIndex(index);
  const node = resolveNode(index, state?.playbook, nodeName);
  if (!node || !validation.valid || index.duplicates.has(nodeName)) return { index, node: null, validation };
  return { index, node, validation };
}

export function checkEntry(nodeName, playbookDir, state, ctx = {}) {
  const executionMismatch = selectedExecutionMismatch(state, ctx);
  if (executionMismatch) return { pass: false, missing: [], unknown: [executionMismatch.code] };
  const { node, validation, index } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  const controller = index.controllers.get(state?.playbook);
  if (ctx.pipeline && controller && !controller.supportedPipelines.includes(ctx.pipeline)) return { pass: false, missing: [`pipeline:${ctx.pipeline}`], unknown: [`controller ${state.playbook} does not own ${ctx.pipeline}`] };
  if (controller && !nodeIsActiveForController(index, controller, nodeName, state, ctx)) {
    return { pass: false, missing: [], unknown: [`node ${state.playbook}/${nodeName} is inactive for the authoritative production workflow`] };
  }
  const requiredNodeIds = controller
    ? activeRequiredNodeIds(index, controller, node, state, ctx)
    : node.requires;
  const required = requiredNodeIds.map((id) => `node_done:${id}`);
  return checkConditions([...required, ...node.entry], node, state, ctx);
}
export function checkExit(nodeName, playbookDir, state, ctx = {}) {
  const executionMismatch = selectedExecutionMismatch(state, ctx);
  if (executionMismatch) return { pass: false, missing: [], unknown: [executionMismatch.code] };
  const { node, validation, index } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  const controller = index.controllers.get(state?.playbook);
  if (ctx.pipeline && controller && !controller.supportedPipelines.includes(ctx.pipeline)) return { pass: false, missing: [`pipeline:${ctx.pipeline}`], unknown: [`controller ${state.playbook} does not own ${ctx.pipeline}`] };
  if (controller && !nodeIsActiveForController(index, controller, nodeName, state, ctx)) {
    return { pass: false, missing: [], unknown: [`node ${state.playbook}/${nodeName} is inactive for the authoritative production workflow`] };
  }
  return checkConditions(node.exit, node, state, ctx);
}
export function getMissingConditions(nodeName, playbookDir, state, ctx = {}) {
  const result = checkEntry(nodeName, playbookDir, state, ctx);
  return [...result.missing, ...result.unknown];
}
export function getEligibleNextNodes(index, playbook, state, ctx = {}) {
  if (selectedExecutionMismatch(state, ctx)) return [];
  const controller = index.controllers.get(playbook);
  const ids = controller
    ? activeControllerNodeIds(index, playbook, state, ctx)
    : controllerNodeIds(index, playbook);
  return ids.filter((id) => {
    const record = activeRecord(state, id);
    if (record && ["completed", "skipped", "in_progress"].includes(record.status)) return false;
    return checkEntry(id, index.playbookDir, state, ctx).pass;
  });
}
