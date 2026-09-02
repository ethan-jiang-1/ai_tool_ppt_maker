/**
 * state_execution.mjs — MD Controller playbook lifecycle, node/gate operations,
 * entry/exit gate evaluation, and resume-card projection.
 *
 * Part of the state module split. It imports core I/O from state.mjs and
 * evidence helpers from state_evidence.mjs. The dependency graph is a DAG:
 * state.mjs (base) → state_identity → state_evidence ← state_execution.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildPlaybookIndex,
  controllerActiveNodeIds,
  controllerNodeIds,
  resolveNode,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import {
  canonicalVersionKey,
  initialProductionIdentityRecord,
  isProductionIdentityRecord,
  normalizeRunVersion,
} from "../run-bundle/production_identity.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOWS } from "../run-bundle/production_marker.mjs";
import { STYLE_MASTER_IMAGE, styleMasterLocalSourcePath } from "../run-bundle/style_master_media.mjs";
import { resolveEffectiveStyleMasterSelection, RESERVED_NODE_IDS, deepClone, isReservedNode, reservedEntries, preserveReservedNodes } from "./state.mjs";
import { targetEvidenceRecord, validTargetEvidenceRecord } from "./state_evidence.mjs";
import { nowIso } from "../util/state_helpers.mjs";
import { sha256 } from "../identity/byte_hash.mjs";

export const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
export const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);

const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

function newExecutionId() { return `exec-${randomUUID()}`; }
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function controllerEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => !isReservedNode(id)); }
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

/** @private exported for state_progressive */
export function activeRecord(state, name) {
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

// (preserveReservedNodes moved to state.mjs)

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

export const CONDITIONS = {
  run_bundle_exists: (_state, ctx) => existsSync(ctx.deckDir || ""),
  deck_guide_created: (_state, ctx) => existsSync(join(ctx.deckDir || "", "deck-guide.md")),
  visual_preset_seeded: (_state, ctx) => existsSync(join(ctx.deckDir || "", ...PAGE_IMAGE_VISUAL_LANGUAGE_RELATIVE_PATH.split("/"))),
  style_master_exists: (_state, ctx) => {
    const runDir = ctx.runDir || ctx.run_dir;
    if (typeof runDir === "string" && runDir) return existsSync(styleMasterLocalSourcePath(runDir));
    return existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", STYLE_MASTER_IMAGE));
  },
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

function currentEvidence(state, nodeId, key, userOnly = false) {
  const evidence = activeRecord(state, nodeId)?.evidence?.[key];
  return Boolean(evidence?.met === true && (!userOnly || evidence.kind === "user"));
}
function currentDecision(state, nodeId, userOnly = false) {
  const decision = activeRecord(state, nodeId)?.decision;
  return Boolean(decision?.value && (!userOnly || decision.kind === "user"));
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
