/**
 * state.mjs — persisted MD Controller execution state.
 *
 * Core I/O, validation, and re-export layer for the state module split. All
 * playbook-lifecycle, identity, evidence, and progressive-handoff exports are
 * re-exported from the four sibling state_*.mjs modules.
 *
 * MD Controllers remain the workflow source of truth. This module stores the
 * active execution pointer/evidence and evaluates gates from declarations read
 * by md_controller_reader.mjs.
 * CLI diagnostic consumer authority: openspec/specs/node-specification/spec.md
 * plus active node-specification deltas from `openspec status`; do not duplicate
 * the producer schema owned by cli-surface in this module.
  * Authority: openspec/specs/node-specification/spec.md
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
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import { canonicalVersionKey, normalizeRunVersion, inspectProductionIdentity, isProductionIdentityRecord, pipelineFromSourceMarker } from "../run-bundle/production_identity.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, isPageImageWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import {
  validateProductionIdentityStructure,
  validateStyleMasterSelectionStructure,
  validatePageImageTaskMandateStructure,
} from "./state_identity.mjs";
import {
  validatePageImageRawAuthorizationStructure,
  validateTargetEvidenceStructure,
  validateProgressiveHandoffStructure,
} from "./state_evidence.mjs";

// ---- Core constants ----
export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const EXECUTION_LEASE_FILE = "current-execution-lease.json";
export const EXECUTION_LEASE_SCHEMA = "pptmaker-current-execution-lease";

export const STATE_YAML_HEADER = `\
# _state/state.yaml — MD Controller execution state (not a hand-edit playground)
# Schema authority: ppt_maker_harness/charter/NODE-SPEC.md
# API: ppt_maker_harness/scripts/shared/state/state.mjs
# CLI: node ppt_maker_harness/scripts/ppt_flow.mjs state <runDir> [--json|--validate-state]
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

// ---- Private helpers ----
const YAML_PARSE_OPTS = { strict: false, uniqueKeys: false, logLevel: "error" };
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");
const GATE_JOURNAL_FILE = "gate-approval-journal.json";
const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const RESERVED_NODE_IDS = Object.freeze([]);

function nowIso() { return new Date().toISOString(); }
function newExecutionId() { return `exec-${randomUUID()}`; }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function deepClone(value) { return value == null ? value : structuredClone(value); }
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

// ---- State top-level key validation ----
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

// ---- Replacement / repair helpers ----
function replacementRequired(reason, pipeline = null) {
  return Object.freeze({
    replacement_required: true, code: "replacement_required",
    pipeline, reason: String(reason), durable_state_present: false,
  });
}
function currentRepairRequired(reason, pipeline = null) {
  return Object.freeze({
    replacement_required: true, current_repair_required: true,
    code: "replacement_required", pipeline,
    reason: String(reason), durable_state_present: false,
  });
}
function stateRepairFencePresent(deckDir, state) {
  return existsSync(join(deckDir, STATE_DIR, GATE_JOURNAL_FILE)) ? true : false;
}
function currentOneToOneRepair(state, { deckDir, runVersion, sourceMarker }) {
  if (!isPlainObject(state) || stateRepairFencePresent(deckDir, state)) return null;
  if (!isPlainObject(state.gates)) return null;
  const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
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
    repair: Object.freeze({ field: `gates.${invalidGates[0]}`, from: state.gates[invalidGates[0]], to: "pending" }),
  });
}
function markStateRepaired(state, repair) {
  Object.defineProperty(state, "state_repaired", {
    value: repair, enumerable: false, configurable: false, writable: false,
  });
  return state;
}
function markDurableStatePresent(state) {
  Object.defineProperty(state, "durable_state_present", {
    value: true, enumerable: false, configurable: false, writable: false,
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

// ---- Execution binding helpers (used by healState/validateState/readState) ----
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
function assertCurrentPlaybookStack(state) {
  const errors = executionBindingErrors({
    ...(isPlainObject(state) ? state : {}),
    playbook: "", run_version: "",
  }).filter((error) => error.startsWith("playbook_stack"));
  if (errors.length > 0) throw new Error(`STATE_PLAYBOOK_STACK_INVALID: ${errors[0]}`);
  return state.playbook_stack;
}

// ---- Controller identity validation (used by validateState) ----
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
    playbook: state.playbook, current_node: state.current_node,
    controller_nodes: Object.fromEntries(activeNodes),
  }, "active state", errors);
  for (const [indexPosition, frame] of (state.playbook_stack || []).entries()) {
    validateControllerFrameIdentity(index, frame, `playbook_stack[${indexPosition}]`, errors);
  }
}

// ---- State issue / read-only validation helpers ----
function stateIssue(path, expected, actual, kind = "state", next_action = "repair_state") {
  return Object.freeze({
    path, expected: expected == null ? "null" : String(expected).slice(0, 128),
    actual: actual == null ? "null" : String(actual).slice(0, 128),
    kind, next_action,
  });
}
function hasExactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
function versionFromReservedKey(key) {
  return /^3_versions\/(v[1-9][0-9]*)$/.exec(key)?.[1] || null;
}
function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}
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
      issues.push(stateIssue(recordPath, "exact {workflow: framed|pure, source_epoch: positive integer} record", "unknown-or-invalid", "record", "repair_page_image_state"));
    }
  }
}

// ---- Core public API: state I/O ----

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

/** Undeclared state is not promotable. Reads validate declared current bytes;
 * only an owning execution path may make a current repair. */
export function healState(raw) {
  return { state: isPlainObject(raw) ? deepClone(raw) : raw, dirty: false };
}

export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }
export function executionLeasePath(deckDir) { return join(deckDir, STATE_DIR, EXECUTION_LEASE_FILE); }

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
      const continuation = !parsed.value.playbook
        ? exactContinuationTargetVersion(parsed.value.continuation_target_version)
        : null;
      return Object.freeze({
        ...replacementRequired(`source/state identity is unsupported: ${markerPipeline?.code || sourceMarker.code || "marker unavailable"}`),
        ...(continuation ? { continuation_target_version: continuation } : {}),
      });
    }
  } else if (parsed.value.playbook) {
    return replacementRequired("authoritative active state has no exact run version");
  }
  const validation = validateState(parsed.value);
  if (!validation.valid) {
    const repair = version && sourceMarker ? currentOneToOneRepair(parsed.value, {
      deckDir, runVersion: version, sourceMarker,
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
      ok: false, code: "execution_run_version_mismatch",
      requested_run_version: requested, active_run_version: active,
    });
  }
  const sourceMarker = probeSourceMarkerForVersion(deckDir, requested);
  if (sourceMarker.ok === false) {
    return Object.freeze({ ok: false, code: sourceMarker.code, run_version: requested, marker: sourceMarker });
  }
  const sourcePipeline = pipelineFromSourceMarker(sourceMarker);
  if (!sourcePipeline.ok) {
    return Object.freeze({
      ok: false, code: sourceMarker.code || sourcePipeline.code || "MARKER_INVALID",
      run_version: requested, marker: sourceMarker,
    });
  }
  const path = statePath(deckDir);
  const stateBytes = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
  return Object.freeze({
    ok: true, run_version: requested, active_run_version: active,
    state: deepFreeze(deepClone(state)), state_sha256: sha256(stateBytes),
    source_identity: sourceMarker.identity ? deepFreeze(deepClone(sourceMarker.identity)) : null,
    source_marker: deepFreeze(deepClone(sourceMarker)),
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

/** Direct workflow-owner boundary for exported run-scoped mutation APIs. */
export function requireExactExecutionForRun(runDir, { purpose = "execute" } = {}) {
  const canonicalRunDir = resolve(runDir || "");
  return requireExactExecution(resolve(canonicalRunDir, "..", ".."), { runDir: canonicalRunDir }, purpose);
}

/** Resolve an exact execution; throws on failure. */
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
  "code", "requested_run_version", "active_run_version",
]);

function repairHardStop(code, { requestedRunVersion = null, activeRunVersion = null } = {}) {
  return Object.freeze({
    ok: false, code,
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
      requestedRunVersion: requested, activeRunVersion: active,
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
      requestedRunVersion: requested, activeRunVersion: active,
    });
  }
  appendHistory(deckDir, {
    type: "state_known_execution_mismatch_repaired",
    run_version: active, repaired_keys: KNOWN_EXECUTION_MISMATCH_KEYS,
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

export function validateState(state) {
  const errors = [];
  if (!isPlainObject(state)) return { valid: false, errors: ["state is null"] };
  if (state.corrupted) return { valid: false, errors: state.errors || ["corrupted"] };
  const nodes = isPlainObject(state.nodes) ? state.nodes : {};
  const gates = isPlainObject(state.gates) ? state.gates : {};
  if (!isPlainObject(state.nodes)) errors.push("missing nodes");
  if (!isPlainObject(state.gates)) errors.push("missing gates");
  const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
  const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
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
    issues.push(stateIssue("run_version", selectedMismatch.requested_run_version, selectedMismatch.active_run_version || "missing", "execution", "select_active_run_version"));
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

// ---- Re-exports from submodules ----
export {
  NODE_STATUSES,
  GATE_STATUSES,
  RESERVED_NODE_IDS,
  resolveContinuationTargetVersion,
  getNodeStatus,
  getCurrentNode,
  getCompletedNodes,
  getPendingNodes,
  isNodeCompleted,
  isNodeDone,
  isPlaybookComplete,
  getGateStatus,
  isGateApproved,
  buildResumeCard,
  projectProductionIdentityCompletion,
  setNodeStatus,
  resetNode,
  skipNode,
  setGate,
  setNodeEvidence,
  setNodeDecision,
  startPlaybook,
  switchPlaybook,
  resumePlaybook,
  createDefaultState,
  createInitialState,
  createTargetAuthoringState,
  CONDITIONS,
  checkEntry,
  checkExit,
  getMissingConditions,
  getEligibleNextNodes,
} from "./state_execution.mjs";

export {
  PAGE_IMAGE_TASK_MANDATE_SCHEMA,
  PAGE_IMAGE_TASK_MANDATE_SCOPE,
  inspectRunProductionIdentity,
  resolveRunProductionAdapter,
  resolveEffectiveStyleMasterSelection,
  recordEffectiveStyleMasterSelection,
  activateCleanPageImageTargetDraft,
  inspectCurrentPageImageTaskMandate,
  ensureCurrentPageImageTaskMandate,
  initializeTargetPageImageState,
  advanceTargetPageImageSourceEpoch,
  inspectTargetPageImageState,
  resolveCurrentTargetPageImageSourceState,
} from "./state_identity.mjs";

export {
  PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA,
  PAGE_IMAGE_TARGET_STATE_SCHEMA,
  recordTargetAcceptedRawEvidence,
  recordTargetFinalManifest,
  recordTargetDeliveryReceipt,
  recordPageImageRawProviderAuthorization,
  inspectPageImageRawProviderAuthorization,
  validateTargetAcceptedRawEvidenceLocalComposeRebind,
  rebindTargetAcceptedRawEvidenceForLocalCompose,
  rebindTargetProgressiveRawEvidenceForLocalCompose,
  registerTargetPageImageStructuralPublication,
  revalidateTargetPageImageStructuralReplay,
} from "./state_evidence.mjs";

export {
  PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA,
  PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY,
  STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY,
  recordTargetProgressiveRawPlan,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressiveAcceptedRawEvidence,
  recordTargetProgressiveFinalManifest,
  recordTargetProgressiveDeliveryReceipt,
  readTargetProgressiveHandoff,
  recordTargetProgressiveAuthorizeCliHandoff,
  recordTargetProgressiveCheckpointCliHandoff,
  recordStyleMasterAuthorizeCliHandoff,
  readTargetProgressiveControllerDecision,
} from "./state_progressive.mjs";