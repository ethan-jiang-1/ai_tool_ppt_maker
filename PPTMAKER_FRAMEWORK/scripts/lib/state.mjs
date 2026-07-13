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
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseDocument, stringify } from "yaml";
import {
  buildPlaybookIndex,
  controllerNodeIds,
  eligibleNextNodes,
  resolveNode,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import { validateNotesReceipt } from "./notes_receipt.mjs";

export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const STATE_SCHEMA_VERSION = 2;
export const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
export const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
export const RESERVED_NODE_IDS = Object.freeze(["header-review"]);

export const STATE_YAML_HEADER = `\
# _state/state.yaml — MD Controller execution state (not a hand-edit playground)
# Schema authority: PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md
# API: PPTMAKER_FRAMEWORK/scripts/lib/state.mjs
# CLI: node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> [--json|--check-gates]
# Fields: schema_version, playbook, current_node, execution_id, nodes.*, gates.*, deck.*, playbook_stack
# MD Controller source: PPTMAKER_FRAMEWORK/playbook/*.md
# Heal: readState defaults to tolerant parse + schema migration/repair
`;

export const STATE_DIR_README = `\
# 执行状态 (_state)

**这里放什么:** MD Controller 跑到哪了——当前执行、节点、闸门、等待原因。Playbook 内容仍以 \`PPTMAKER_FRAMEWORK/playbook/*.md\` 为真相源。

**主要文件:**
- \`state.yaml\` — 当前执行工作集（原子写）
- \`history.jsonl\` — 可选参考日志，不参与自动恢复

**断线后:** 先跑 \`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir>\`。

**Schema 权威:** \`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md\`。

**不要手改:** 优先使用 \`scripts/lib/state.mjs\` / \`ppt_flow\`；读取时会迁移并修复可安全修复的旧 schema。
`;

const YAML_PARSE_OPTS = { strict: false, uniqueKeys: false, logLevel: "error" };
const NODE_ALIASES = Object.freeze({
  "edit-text": Object.freeze({ "verify-output": "verify-text-output" }),
  "edit-visual": Object.freeze({ "verify-output": "verify-visual-output" }),
});
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "playbook");

function nowIso() { return new Date().toISOString(); }
function newExecutionId() { return `exec-${randomUUID()}`; }
function deepClone(value) { return value == null ? value : structuredClone(value); }
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function isReservedNode(id) { return RESERVED_NODE_IDS.includes(id); }
function controllerEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => !isReservedNode(id)); }
function reservedEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => isReservedNode(id)); }
function isoOr(value, fallback) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return value;
}
function appendDiagnostic(state, message) {
  if (!Array.isArray(state.diagnostics)) state.diagnostics = [];
  if (!state.diagnostics.includes(message)) state.diagnostics.push(message);
}
function mergeMissing(canonical, legacy) {
  const out = isPlainObject(canonical) ? canonical : {};
  if (!isPlainObject(legacy)) return out;
  for (const [key, value] of Object.entries(legacy)) {
    if (out[key] == null) out[key] = deepClone(value);
  }
  return out;
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

export function normalizePlaybookStack(state, migrationTime = nowIso()) {
  if (!isPlainObject(state)) return state;
  if (!Array.isArray(state.playbook_stack)) {
    state.playbook_stack = [];
    return state;
  }
  state.playbook_stack = state.playbook_stack
    .filter(isPlainObject)
    .map((entry, index) => {
      const legacySnapshot = !isPlainObject(entry.controller_nodes);
      const normalized = {
        playbook: entry.playbook == null ? "" : String(entry.playbook),
        current_node: entry.current_node == null ? "" : String(entry.current_node),
        execution_id: typeof entry.execution_id === "string" && entry.execution_id ? entry.execution_id : newExecutionId(),
        execution_started_at: isoOr(entry.execution_started_at, migrationTime),
        controller_nodes: legacySnapshot ? {} : deepClone(entry.controller_nodes),
      };
      if (legacySnapshot) normalized.diagnostic = `legacy stack entry ${index} had no recoverable controller snapshot`;
      else if (entry.diagnostic != null) normalized.diagnostic = String(entry.diagnostic);
      for (const rec of Object.values(normalized.controller_nodes)) {
        if (isPlainObject(rec)) rec.execution_id = normalized.execution_id;
      }
      return normalized;
    });
  return state;
}

function normalizeEvidence(record, migrationTime, state, nodeId) {
  if (!isPlainObject(record.evidence)) record.evidence = {};
  for (const [key, evidence] of Object.entries(record.evidence)) {
    if (evidence === true) {
      record.evidence[key] = { met: true, kind: "agent", at: migrationTime };
      appendDiagnostic(state, `${nodeId}.evidence.${key} migrated from boolean with agent provenance`);
      continue;
    }
    if (!isPlainObject(evidence) || evidence.met !== true || !["user", "agent", "cli"].includes(evidence.kind)) {
      delete record.evidence[key];
      appendDiagnostic(state, `${nodeId}.evidence.${key} was invalid and removed`);
      continue;
    }
    evidence.at = isoOr(evidence.at, migrationTime);
    if (evidence.note != null) evidence.note = String(evidence.note);
  }
  if (typeof record.decision === "string" && record.decision.trim()) {
    record.decision = { value: record.decision.trim(), kind: "agent", at: migrationTime };
    appendDiagnostic(state, `${nodeId}.decision migrated from scalar with agent provenance`);
  } else if (record.decision != null) {
    const d = record.decision;
    if (!isPlainObject(d) || typeof d.value !== "string" || !d.value.trim() || !["user", "agent", "cli"].includes(d.kind)) {
      delete record.decision;
      appendDiagnostic(state, `${nodeId}.decision was invalid and removed`);
    } else {
      d.value = d.value.trim();
      d.at = isoOr(d.at, migrationTime);
      if (d.note != null) d.note = String(d.note);
    }
  }
}

function normalizeNodeRecord(record, nodeId, executionId, migrationTime, state) {
  const rec = isPlainObject(record) ? record : {};
  if (!NODE_STATUSES.includes(rec.status)) {
    if (rec.status != null) appendDiagnostic(state, `${nodeId}.status ${JSON.stringify(rec.status)} healed to pending`);
    rec.status = "pending";
    rec.note = [rec.note, "healed invalid status to pending"].filter(Boolean).join("; ");
  }
  if (rec.waiting_for != null) rec.waiting_for = String(rec.waiting_for);
  if (rec.note != null) rec.note = String(rec.note);
  if (executionId) rec.execution_id = executionId;
  if (["pending", "in_progress"].includes(rec.status)) delete rec.completed;
  if (rec.status === "completed") {
    delete rec.failed_reason;
    delete rec.error;
  }
  normalizeEvidence(rec, migrationTime, state, nodeId);
  return rec;
}

function applyNodeAliases(state) {
  const aliases = NODE_ALIASES[state.playbook] || {};
  for (const [legacyId, canonicalId] of Object.entries(aliases)) {
    if (!state.nodes?.[legacyId]) continue;
    state.nodes[canonicalId] = mergeMissing(state.nodes[canonicalId], state.nodes[legacyId]);
    delete state.nodes[legacyId];
    if (state.current_node === legacyId) state.current_node = canonicalId;
    appendDiagnostic(state, `${legacyId} migrated to ${canonicalId} for ${state.playbook}`);
  }
}

function restrictActiveWorkingSet(state) {
  if (!state.playbook) return;
  try {
    const index = buildPlaybookIndex(DEFAULT_PLAYBOOK_DIR);
    const allowed = new Set(controllerNodeIds(index, state.playbook));
    if (allowed.size === 0) return;
    for (const [id] of controllerEntries(state.nodes)) {
      if (allowed.has(id)) continue;
      delete state.nodes[id];
      appendDiagnostic(state, `${id} removed from active ${state.playbook} working set`);
    }
    if (state.current_node && !allowed.has(state.current_node)) {
      appendDiagnostic(state, `current_node ${state.current_node} is not declared by ${state.playbook}`);
      state.current_node = "";
    }
  } catch (error) {
    appendDiagnostic(state, `active working-set validation unavailable: ${error.message || String(error)}`);
  }
}

export function healState(raw) {
  const state = isPlainObject(raw) ? deepClone(raw) : {};
  const before = JSON.stringify(state);
  const migrationTime = isoOr(state.updated_at, isoOr(state.started_at, nowIso()));

  state.schema_version = STATE_SCHEMA_VERSION;
  state.playbook = typeof state.playbook === "string" ? state.playbook : "";
  state.current_node = typeof state.current_node === "string" ? state.current_node : "";
  state.started_at = typeof state.started_at === "string" ? state.started_at : "";
  state.updated_at = typeof state.updated_at === "string" ? state.updated_at : "";
  state.nodes = isPlainObject(state.nodes) ? state.nodes : {};
  state.gates = isPlainObject(state.gates) ? state.gates : {};
  state.deck = isPlainObject(state.deck) ? state.deck : {};
  state.deck = {
    name: state.deck.name == null ? "" : String(state.deck.name),
    type: state.deck.type == null ? "" : String(state.deck.type),
    style: state.deck.style == null ? "" : String(state.deck.style),
  };

  applyNodeAliases(state);
  if (state.playbook) {
    if (typeof state.execution_id !== "string" || !state.execution_id) state.execution_id = newExecutionId();
    state.execution_started_at = isoOr(state.execution_started_at, isoOr(state.started_at, migrationTime));
    if (!state.started_at) state.started_at = state.execution_started_at;
  } else {
    state.execution_id = "";
    state.execution_started_at = "";
    for (const [id] of controllerEntries(state.nodes)) delete state.nodes[id];
    state.current_node = "";
  }

  restrictActiveWorkingSet(state);

  for (const [id, record] of Object.entries(state.nodes)) {
    if (isReservedNode(id)) continue;
    state.nodes[id] = normalizeNodeRecord(record, id, state.execution_id, migrationTime, state);
  }
  for (const gate of ["content", "visual"]) {
    if (!GATE_STATUSES.includes(state.gates[gate])) {
      if (state.gates[gate] != null) appendDiagnostic(state, `gate ${gate} healed to pending`);
      state.gates[gate] = "pending";
    }
  }
  normalizePlaybookStack(state, migrationTime);
  for (const entry of state.playbook_stack) {
    if (entry.diagnostic) appendDiagnostic(state, entry.diagnostic);
  }
  if (!Array.isArray(state.diagnostics) || state.diagnostics.length === 0) delete state.diagnostics;
  return { state, dirty: before !== JSON.stringify(state) };
}

function seedFromBroken(rawText) {
  const seeded = createDefaultState();
  const match = /(?:^|\n)deck:\s*\n(?:[ \t]+.*\n)*?[ \t]+name:\s*["']?([^\n"']+)/.exec(rawText)
    || /(?:^|\n)name:\s*["']?([^\n"']+)/.exec(rawText);
  if (match) seeded.deck.name = match[1].trim();
  return seeded;
}

export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }

export function readState(deckDir, opts = {}) {
  const shouldHeal = opts.heal !== false;
  const path = statePath(deckDir);
  if (!existsSync(path)) return createDefaultState();
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if (!shouldHeal) return { corrupted: true, errors: [error.message] };
    const seeded = createDefaultState();
    writeState(deckDir, seeded);
    seeded._healed = true;
    return seeded;
  }
  const parsed = parseStateYaml(raw);
  if (!parsed.ok) {
    if (!shouldHeal) return { corrupted: true, errors: parsed.errors };
    const broken = `${path}.broken.${Date.now()}`;
    try { renameSync(path, broken); } catch { /* best effort */ }
    const seeded = seedFromBroken(raw);
    writeState(deckDir, seeded);
    try { appendHistory(deckDir, { type: "state_healed", reason: "unparseable", backup: broken }); } catch { /* optional */ }
    seeded._healed = true;
    return seeded;
  }
  if (!shouldHeal) return parsed.value;
  const { state, dirty } = healState(parsed.value);
  if (dirty || parsed.hadErrors) {
    writeState(deckDir, state);
    try { appendHistory(deckDir, { type: "state_healed", reason: dirty ? "schema" : "parse_errors" }); } catch { /* optional */ }
    state._healed = true;
  }
  return state;
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

export function writeState(deckDir, state) {
  const { _healed, ...persist } = state;
  persist.schema_version = STATE_SCHEMA_VERSION;
  persist.updated_at = nowIso();
  normalizePlaybookStack(persist, persist.updated_at);
  ensureStateDirHints(deckDir);
  const path = statePath(deckDir);
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  cleanStaleTemps(dir);
  const temp = join(dir, `.${STATE_FILE}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  writeFileSync(temp, STATE_YAML_HEADER + stringifyStateYaml(persist), "utf8");
  renameSync(temp, path);
  state.schema_version = STATE_SCHEMA_VERSION;
  state.updated_at = persist.updated_at;
  cleanStaleTemps(dir);
}

function activeRecord(state, name) {
  const record = state?.nodes?.[name];
  if (!isPlainObject(record) || isReservedNode(name)) return record || null;
  if (!state.execution_id || record.execution_id !== state.execution_id) return null;
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

export function buildResumeCard(state, statusSnapshot = null, controller = null) {
  const playbook = state?.playbook == null ? "" : String(state.playbook);
  const current_node = state?.current_node == null ? "" : String(state.current_node);
  const nodeRec = state?.nodes?.[current_node] || {};
  const node_status = nodeRec.status == null ? "" : String(nodeRec.status);
  const waiting_for = nodeRec.waiting_for ? String(nodeRec.waiting_for) : null;
  const note = nodeRec.note ? String(nodeRec.note) : null;
  const gates = { ...(state?.gates || {}) };
  const playbook_stack = Array.isArray(state?.playbook_stack) ? deepClone(state.playbook_stack) : [];
  const execLabel = `${playbook || "（未初始化）"} / ${current_node || "（未初始化）"}`;
  let workflow_summary;
  if (waiting_for) workflow_summary = `卡在等人：${waiting_for}（${execLabel}）`;
  else if (statusSnapshot && !statusSnapshot.style_master) workflow_summary = `视觉母版未就绪（${execLabel}）`;
  else if (statusSnapshot && statusSnapshot.style_master && Number(statusSnapshot.expected_slides) > 0 && Number(statusSnapshot.raw_images) < Number(statusSnapshot.expected_slides)) {
    workflow_summary = `生产页图进行中 ${statusSnapshot.raw_images}/${statusSnapshot.expected_slides}（执行点 ${execLabel}）`;
  } else if (statusSnapshot && Array.isArray(statusSnapshot.pptx) && statusSnapshot.pptx.length > 0) workflow_summary = `已有交付 PPTX，可迭代（执行点 ${execLabel}）`;
  else workflow_summary = `执行点：${execLabel}`;

  let eligible_candidates = [];
  if (controller?.index && playbook) {
    eligible_candidates = getEligibleNextNodes(controller.index, playbook, state, controller.ctx || {});
  }
  let suggested_next;
  if (waiting_for) suggested_next = `waiting:${waiting_for}`;
  else if (node_status === "in_progress") suggested_next = `continue:${playbook}/${current_node}`;
  else if (eligible_candidates.length === 1) suggested_next = `start:${playbook}/${eligible_candidates[0]}`;
  else if (eligible_candidates.length > 1) suggested_next = `choose:${eligible_candidates.join(",")}`;
  else if (current_node) suggested_next = `advance-or-inspect:${playbook}/${current_node}`;
  else suggested_next = "inspect:run ppt_flow state|status";

  const activeNodeIds = controller?.index ? controllerNodeIds(controller.index, playbook) : undefined;
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
  };
}

function requireActiveExecution(state) {
  if (!state?.playbook || !state?.execution_id) throw new Error("active playbook execution required");
}

export function setNodeStatus(state, name, status, extra = {}) {
  requireActiveExecution(state);
  if (!NODE_STATUSES.includes(status)) throw new Error(`invalid node status: ${status}`);
  const previous = activeRecord(state, name) || {};
  const record = { ...previous, ...extra, status, execution_id: state.execution_id };
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

export function resetNode(state, name) {
  requireActiveExecution(state);
  state.nodes ||= {};
  state.nodes[name] = { status: "pending", execution_id: state.execution_id };
  return state;
}
export function skipNode(state, name, reason = "") { return setNodeStatus(state, name, "skipped", { skip_reason: String(reason) }); }
export function setGate(state, name, status) {
  if (!GATE_STATUSES.includes(status)) throw new Error(`invalid gate status: ${status}`);
  state.gates ||= {};
  state.gates[name] = status;
  return state;
}

function validateEvidenceKind(kind) {
  if (!["user", "agent", "cli"].includes(kind)) throw new Error(`invalid evidence kind: ${kind}`);
}
export function setNodeEvidence(state, nodeId, key, { kind, note } = {}) {
  requireActiveExecution(state);
  validateEvidenceKind(kind);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key || "")) throw new Error(`invalid evidence key: ${key}`);
  state.nodes ||= {};
  const record = activeRecord(state, nodeId) || { status: "in_progress", execution_id: state.execution_id };
  record.evidence ||= {};
  record.evidence[key] = { met: true, kind, at: nowIso(), ...(note == null ? {} : { note: String(note) }) };
  record.execution_id = state.execution_id;
  state.nodes[nodeId] = record;
  state.current_node = nodeId;
  return state;
}
export function setNodeDecision(state, nodeId, value, { kind, note } = {}, playbookIndex) {
  requireActiveExecution(state);
  validateEvidenceKind(kind);
  const declaration = playbookIndex ? resolveNode(playbookIndex, state.playbook, nodeId) : null;
  if (!declaration) throw new Error(`unknown node declaration: ${state.playbook}/${nodeId}`);
  if (!declaration.decisions.includes(String(value))) throw new Error(`invalid decision ${value}; allowed: ${declaration.decisions.join(", ")}`);
  state.nodes ||= {};
  const record = activeRecord(state, nodeId) || { status: "in_progress", execution_id: state.execution_id };
  record.decision = { value: String(value), kind, at: nowIso(), ...(note == null ? {} : { note: String(note) }) };
  record.execution_id = state.execution_id;
  state.nodes[nodeId] = record;
  state.current_node = nodeId;
  return state;
}

function preserveReservedNodes(nodes = {}) { return Object.fromEntries(reservedEntries(nodes).map(([id, rec]) => [id, deepClone(rec)])); }
function activeExecutionIncomplete(state) {
  return controllerEntries(state?.nodes).some(([, rec]) => !["completed", "skipped"].includes(rec?.status));
}
export function startPlaybook(state, playbook, { replace = false } = {}) {
  normalizePlaybookStack(state);
  if (state.playbook_stack.length > 0) throw new Error("cannot start a top-level playbook while playbook_stack is non-empty; use switchPlaybook");
  if (state.playbook && activeExecutionIncomplete(state) && !replace) throw new Error("active playbook execution is incomplete; pass replace:true to replace it");
  const now = nowIso();
  state.schema_version = STATE_SCHEMA_VERSION;
  state.playbook = String(playbook);
  state.current_node = "";
  state.execution_id = newExecutionId();
  state.execution_started_at = now;
  if (!state.started_at) state.started_at = now;
  state.nodes = preserveReservedNodes(state.nodes);
  return state;
}
export function switchPlaybook(state, newPlaybook) {
  requireActiveExecution(state);
  normalizePlaybookStack(state);
  const snapshot = Object.fromEntries(controllerEntries(state.nodes).map(([id, rec]) => [id, deepClone(rec)]));
  state.playbook_stack.push({
    playbook: state.playbook,
    current_node: state.current_node,
    execution_id: state.execution_id,
    execution_started_at: state.execution_started_at,
    controller_nodes: snapshot,
  });
  const reserved = preserveReservedNodes(state.nodes);
  state.playbook = String(newPlaybook);
  state.current_node = "";
  state.execution_id = newExecutionId();
  state.execution_started_at = nowIso();
  state.nodes = reserved;
  return state;
}
export function resumePlaybook(state) {
  normalizePlaybookStack(state);
  if (state.playbook_stack.length === 0) return state;
  const reserved = preserveReservedNodes(state.nodes);
  const parent = state.playbook_stack.pop();
  state.playbook = parent.playbook;
  state.current_node = parent.current_node;
  state.execution_id = parent.execution_id;
  state.execution_started_at = parent.execution_started_at;
  state.nodes = { ...deepClone(parent.controller_nodes), ...reserved };
  return state;
}

export function createDefaultState() {
  return {
    schema_version: STATE_SCHEMA_VERSION,
    playbook: "",
    current_node: "",
    execution_id: "",
    execution_started_at: "",
    started_at: "",
    updated_at: "",
    nodes: {},
    gates: { content: "pending", visual: "pending" },
    deck: { name: "", type: "", style: "" },
    playbook_stack: [],
  };
}
export function createInitialState(deckName, deckType, style) {
  const state = createDefaultState();
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck");
  state.current_node = "instantiation";
  return state;
}

export function validateState(state) {
  const errors = [];
  if (!isPlainObject(state)) return { valid: false, errors: ["state is null"] };
  if (state.corrupted) return { valid: false, errors: state.errors || ["corrupted"] };
  if (state.schema_version !== STATE_SCHEMA_VERSION) errors.push(`unsupported schema_version ${state.schema_version}`);
  if (!isPlainObject(state.nodes)) errors.push("missing nodes");
  if (!isPlainObject(state.gates)) errors.push("missing gates");
  if (state.playbook && (!state.execution_id || !state.execution_started_at)) errors.push("active playbook missing execution fields");
  for (const [name, node] of controllerEntries(state.nodes)) {
    if (!NODE_STATUSES.includes(node?.status)) errors.push(`invalid status for ${name}`);
    if (node?.execution_id !== state.execution_id) errors.push(`execution mismatch for ${name}`);
    if (node?.status === "in_progress" && node.completed) errors.push(`illegal: ${name} completed→in_progress`);
  }
  for (const gate of ["content", "visual"]) if (!GATE_STATUSES.includes(state.gates?.[gate])) errors.push(`invalid gate ${gate}`);
  return { valid: errors.length === 0, errors };
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
  visual_preset_seeded: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "color_palette.json")),
  style_master_exists: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "style_master.jpg")),
  slide_specs_exists: (_state, ctx) => existsSync(join(ctx.runDir || "", "slide-specifications.md")),
  slide_specs_valid: (_state, ctx) => typeof ctx.slideSpecsValid === "function" ? Boolean(ctx.slideSpecsValid()) : ctx.slideSpecsValid === true,
  pptx_generated: (_state, ctx) => {
    try { return readdirSync(join(ctx.runDir || "", "_generated", "ppt")).some((name) => name.endsWith(".pptx") && !name.endsWith(".backup.pptx")); } catch { return false; }
  },
  speaker_notes_injected: (_state, ctx) => validateNotesReceipt(ctx.runDir || "").valid,
  header_review_current: (_state, ctx) => typeof ctx.headerReviewCurrent === "function" ? Boolean(ctx.headerReviewCurrent()) : ctx.headerReviewCurrent === true,
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
  const { node, validation } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  const required = node.requires.map((id) => `node_done:${id}`);
  return checkConditions([...required, ...node.entry], node, state, ctx);
}
export function checkExit(nodeName, playbookDir, state, ctx = {}) {
  const { node, validation } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  return checkConditions(node.exit, node, state, ctx);
}
export function getMissingConditions(nodeName, playbookDir, state, ctx = {}) {
  const result = checkEntry(nodeName, playbookDir, state, ctx);
  return [...result.missing, ...result.unknown];
}
export function getEligibleNextNodes(index, playbook, state, ctx = {}) {
  return eligibleNextNodes(index, playbook, state, (id) => checkEntry(id, index.playbookDir, state, ctx));
}
