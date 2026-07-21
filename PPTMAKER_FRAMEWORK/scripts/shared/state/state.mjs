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
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseDocument, stringify } from "yaml";
import {
  buildPlaybookIndex,
  controllerNodeIds,
  eligibleNextNodes,
  resolveNode,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import { validateNotesReceipt } from "../identity/notes_receipt.mjs";
import { HTML_FIRST_PIPELINE, probeProductionMarker } from "../run-bundle/production_marker.mjs";

export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const STATE_SCHEMA_VERSION = 3;
export const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
export const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
export const RESERVED_NODE_IDS = Object.freeze(["header-review", "html-content-review", "html-visual-review", "html-delivery-review", "html-production-reset", "image2-refinement"]);
export const IMAGE2_REFINEMENT_STATE_SCHEMA_V1 = "pptmaker-image2-refinement-state-v1";
export const IMAGE2_REFINEMENT_STATE_SCHEMA_V2 = "pptmaker-image2-refinement-state-v2";
export const IMAGE2_REFINEMENT_STATE_SCHEMA = IMAGE2_REFINEMENT_STATE_SCHEMA_V2;

export const STATE_YAML_HEADER = `\
# _state/state.yaml — MD Controller execution state (not a hand-edit playground)
# Schema authority: PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md
# API: PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs
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

**不要手改:** 优先使用 \`scripts/shared/state/state.mjs\` / \`ppt_flow\`；读取时会迁移并修复可安全修复的旧 schema。
`;

const YAML_PARSE_OPTS = { strict: false, uniqueKeys: false, logLevel: "error" };
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");
const STATE_MIGRATION_MAP = JSON.parse(readFileSync(join(DEFAULT_PLAYBOOK_DIR, "state-migration-map-v3.json"), "utf8"));
const LEGACY_PIPELINE = "legacy-image2-first";
const GATE_JOURNAL_FILE = "gate-approval-journal.json";
const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

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
function appendDiagnostic(state, message) {
  if (!Array.isArray(state.diagnostics)) state.diagnostics = [];
  if (!state.diagnostics.includes(message)) state.diagnostics.push(message);
}

function refinementVersionKey(runVersion) {
  if (!VERSION_RE.test(String(runVersion || ""))) throw new TypeError("runVersion must be normalized vN");
  return `3_versions/${runVersion}`;
}

function validCanonicalWaivedChecks(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 64) return false;
  let prior = null;
  for (const entry of value) {
    if (!isPlainObject(entry) || !hasExactKeys(entry, ["code", "subject"]) || !/^[a-z][a-z0-9_]{0,63}$/.test(entry.code || "")) return false;
    if (entry.subject !== null && (!isPlainObject(entry.subject) || !hasExactKeys(entry.subject, ["kind", "id"]) || !["gate", "slide", "recipe", "artifact", "receipt"].includes(entry.subject.kind) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(entry.subject.id || ""))) return false;
    const key = `${entry.code}\u0000${entry.subject?.kind || ""}\u0000${entry.subject?.id || ""}`;
    if (prior !== null && prior >= key) return false;
    prior = key;
  }
  return true;
}

function validPrerequisiteWaiver(value, runVersion) {
  if (!hasExactKeys(value, ["reason", "waived_checks", "run_version", "html_production_reset_id", "html_delivery_digest", "recorded_at"])) return false;
  return typeof value.reason === "string" && value.reason.trim() === value.reason && value.reason.length > 0 && Buffer.byteLength(value.reason, "utf8") <= 1024 &&
    validCanonicalWaivedChecks(value.waived_checks) && value.run_version === runVersion &&
    (value.html_production_reset_id === null || SHA256_RE.test(value.html_production_reset_id || "")) &&
    SHA256_RE.test(value.html_delivery_digest || "") && typeof value.recorded_at === "string" && !Number.isNaN(Date.parse(value.recorded_at));
}

function validRefinementRecord(record, runVersion) {
  if (!isPlainObject(record) || ![IMAGE2_REFINEMENT_STATE_SCHEMA_V1, IMAGE2_REFINEMENT_STATE_SCHEMA_V2].includes(record.schema) || record.run_version !== runVersion) return false;
  const keys = record.schema === IMAGE2_REFINEMENT_STATE_SCHEMA_V2
    ? ["schema", "run_version", "plan", "authorization", "attempts", "reviews", "prerequisite_waiver"]
    : ["schema", "run_version", "plan", "authorization", "attempts", "reviews"];
  if (Object.keys(record).length !== keys.length || keys.some((key) => !Object.hasOwn(record, key))) return false;
  return (record.plan === null || isPlainObject(record.plan)) &&
    (record.authorization === null || isPlainObject(record.authorization)) &&
    isPlainObject(record.attempts) &&
    isPlainObject(record.reviews) &&
    (record.schema === IMAGE2_REFINEMENT_STATE_SCHEMA_V1 || record.prerequisite_waiver === null || validPrerequisiteWaiver(record.prerequisite_waiver, runVersion)) &&
    Object.keys(record.attempts).every((id) => /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(id)) &&
    Object.keys(record.reviews).every((id) => typeof id === "string" && id.trim() !== "");
}

export function readImage2RefinementState(state, runVersion) {
  const container = state?.nodes?.["image2-refinement"];
  if (container != null && (!isPlainObject(container) || Object.keys(container).some((key) => key !== "by_version") || !isPlainObject(container.by_version))) throw new Error("image2 refinement reserved record must contain only by_version");
  const records = container?.by_version || {};
  for (const key of Object.keys(records)) if (!/^3_versions\/v[1-9][0-9]*$/.test(key)) throw new Error("image2 refinement state contains a mismatched version key");
  const record = records[refinementVersionKey(runVersion)] || null;
  if (record === null) return null;
  if (!validRefinementRecord(record, runVersion)) throw new Error("image2 refinement state record is invalid");
  return structuredClone(record);
}

/** Safe consumer projection for status/MD controllers; raw receipts and IDs
 * remain in the reserved record and are never exposed as mutable authority. */
export function projectImage2RefinementState(state, runVersion) {
  const record = readImage2RefinementState(state, runVersion);
  if (!record) return Object.freeze({ present: false, status: "absent", authorization: null, attempts: [], reviews: [] });
  const attempts = Object.values(record.attempts).map((attempt) => Object.freeze({
    attempt_id: attempt.attempt_id,
    kind: attempt.kind,
    slide_id: attempt.slide_id || null,
    state: attempt.state,
    promotion_status: attempt.promotion_status || null,
    failure_code: attempt.failure_code || null,
    unknown_submit_resolution: attempt.unknown_submit_resolution || null,
    requires_human: attempt.state === "unknown-submit",
  })).sort((a, b) => a.attempt_id.localeCompare(b.attempt_id));
  const reviews = Object.values(record.reviews).map((review) => Object.freeze({ slide_id: review.slide_id, candidate_id: review.candidate_id, decision: review.decision, current: review.decision !== "pending" })).sort((a, b) => a.slide_id.localeCompare(b.slide_id));
  const hasUnknown = attempts.some((attempt) => attempt.state === "unknown-submit" && !attempt.unknown_submit_resolution);
  const hasFailure = attempts.some((attempt) => attempt.state === "failed");
  const hasResolvedUnknown = attempts.some((attempt) => attempt.state === "unknown-submit" && attempt.unknown_submit_resolution);
  const pendingReview = reviews.some((review) => review.decision === "pending");
  const status = !record.plan
    ? "planned"
    : !record.authorization
      ? "awaiting-authorization"
      : hasUnknown
        ? "unknown-submit"
        : pendingReview
          ? "review-pending"
          : hasFailure || hasResolvedUnknown
            ? "failed"
            : attempts.some((attempt) => ["planned", "submitting"].includes(attempt.state) || attempt.promotion_status === "pending")
              ? "in-progress"
              : "complete";
  return Object.freeze({
    present: true,
    status,
    plan_hash: record.plan?.plan_hash || null,
    authorization: record.authorization ? Object.freeze({ authorization_id: record.authorization.authorization_id, plan_hash: record.authorization.plan_hash, used: record.authorization.used === true }) : null,
    attempts: Object.freeze(attempts),
    reviews: Object.freeze(reviews),
    human_action_required: hasUnknown || hasFailure || hasResolvedUnknown || pendingReview || !record.authorization || !record.plan,
  });
}

export function writeImage2RefinementState(deckDir, runVersion, record, { expectedStateSha = null, expectedStateSha256 = null } = {}) {
  if (!validRefinementRecord(record, runVersion)) throw new TypeError("image2 refinement state record is invalid");
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: refinement state is unavailable");
  state.nodes ||= {};
  const prior = state.nodes["image2-refinement"]?.by_version || {};
  state.nodes["image2-refinement"] = { by_version: { ...prior, [refinementVersionKey(runVersion)]: structuredClone(record) } };
  const expected = expectedStateSha256 || expectedStateSha;
  writeState(deckDir, state, { ...(expected ? { expectedStateSha: expected } : {}) });
  return readImage2RefinementState(state, runVersion);
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

function migrationDefinition(pipeline, playbook) {
  return STATE_MIGRATION_MAP?.pipelines?.[pipeline]?.playbooks?.[playbook] || null;
}

function migrateControllerSnapshot(rootState, snapshot, pipeline, { stack = false } = {}) {
  const definition = migrationDefinition(pipeline, snapshot.playbook);
  if (!definition) return;
  const sourcePlaybook = snapshot.playbook;
  const records = stack ? snapshot.controller_nodes : snapshot.nodes;
  const aliases = definition.nodes || {};
  const recognized = Boolean(snapshot.current_node && aliases[snapshot.current_node]) ||
    Object.keys(records || {}).some((id) => aliases[id] && aliases[id] !== id);
  if (!recognized) return;
  if (snapshot.current_node && aliases[snapshot.current_node] && aliases[snapshot.current_node] !== snapshot.current_node) {
    const prior = snapshot.current_node;
    snapshot.current_node = aliases[prior];
    appendDiagnostic(rootState, `${stack ? "playbook_stack entry " : ""}${sourcePlaybook}: ${prior} current_node migrated to ${snapshot.current_node}`);
  }
  for (const [legacyId, canonicalId] of Object.entries(aliases)) {
    if (!records?.[legacyId] || legacyId === canonicalId) continue;
    records[canonicalId] = mergeMissing(records[canonicalId], records[legacyId]);
    delete records[legacyId];
    appendDiagnostic(rootState, `${stack ? "playbook_stack entry " : ""}${sourcePlaybook}: ${legacyId} migrated to ${canonicalId}`);
  }
  snapshot.playbook = definition.target_playbook;
}

function applyNodeAliases(state, pipeline) {
  migrateControllerSnapshot(state, state, pipeline);
  for (const entry of state.playbook_stack || []) {
    migrateControllerSnapshot(state, entry, pipeline, { stack: true });
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

export function healState(raw, opts = {}) {
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

  // Phase 1: normalize — ensure playbook_stack is a clean plain-object array before alias migration
  normalizePlaybookStack(state, migrationTime);

  // Phase 2: alias — migrate legacy node IDs (top-level + playbook_stack entries)
  const pipeline = opts.pipeline || state.pipeline || state.deck?.pipeline || HTML_FIRST_PIPELINE;
  state.pipeline = pipeline;
  applyNodeAliases(state, pipeline);

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

  // Phase 3: restrict — validate migrated current_node against playbook index
  restrictActiveWorkingSet(state);

  for (const [id, record] of Object.entries(state.nodes)) {
    if (isReservedNode(id)) continue;
    state.nodes[id] = normalizeNodeRecord(record, id, state.execution_id, migrationTime, state);
  }
  for (const gate of ["content", "visual", "html_content", "html_visual"]) {
    if (!GATE_STATUSES.includes(state.gates[gate])) {
      if (state.gates[gate] != null) appendDiagnostic(state, `gate ${gate} healed to pending`);
      state.gates[gate] = "pending";
    }
  }
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

function detectDeckPipeline(deckDir, state = {}) {
  const explicit = state?.pipeline || state?.deck?.pipeline;
  if ([HTML_FIRST_PIPELINE, LEGACY_PIPELINE].includes(explicit)) return explicit;
  const versionsDir = join(deckDir, "3_versions");
  let versions = [];
  try {
    versions = readdirSync(versionsDir)
      .filter((name) => /^v[1-9][0-9]*$/.test(name))
      .sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)));
  } catch {
    versions = [];
  }
  const preferred = state?.run_version || state?.deck?.run_version;
  if (typeof preferred === "string" && versions.includes(preferred)) {
    versions = [preferred, ...versions.filter((name) => name !== preferred)];
  }
  for (const version of versions) {
    const source = join(versionsDir, version, "slide-specifications.md");
    if (!existsSync(source)) continue;
    try {
      const marker = probeProductionMarker(readFileSync(source), { source: "slide-specifications.md" });
      if (marker.branch === HTML_FIRST_PIPELINE) return HTML_FIRST_PIPELINE;
      if (marker.branch === "legacy") return LEGACY_PIPELINE;
    } catch {
      return LEGACY_PIPELINE;
    }
  }
  if (state?.playbook) {
    try {
      const controller = buildPlaybookIndex(DEFAULT_PLAYBOOK_DIR).controllers.get(state.playbook);
      if (controller?.supportedPipelines?.length === 1) return controller.supportedPipelines[0];
    } catch { /* use markerless compatibility fallback */ }
  }
  return LEGACY_PIPELINE;
}

function classifyDeckPipeline(deckDir, state = {}) {
  const explicit = state?.pipeline || state?.deck?.pipeline || null;
  const versionsDir = join(deckDir, "3_versions");
  let markerPipeline = null;
  let markerIssue = null;
  let sources = [];
  try {
    sources = readdirSync(versionsDir)
      .filter((name) => /^v[1-9][0-9]*$/.test(name) && existsSync(join(versionsDir, name, "slide-specifications.md")))
      .sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)));
  } catch { /* an empty historical deck remains legacy-compatible */ }
  for (const version of sources) {
    try {
      const marker = probeProductionMarker(readFileSync(join(versionsDir, version, "slide-specifications.md")), { source: "slide-specifications.md" });
      const observed = marker.branch === HTML_FIRST_PIPELINE ? HTML_FIRST_PIPELINE : marker.branch === "legacy" ? LEGACY_PIPELINE : null;
      if (!observed) { markerIssue = "invalid canonical production marker"; break; }
      if (markerPipeline && markerPipeline !== observed) {
        const migrationWorkspace = state?.playbook === "migrate-import" || existsSync(join(deckDir, "3_versions", version, "_generated", "qa", "html_migration.json"));
        if (!migrationWorkspace) { markerIssue = "conflicting production pipelines across versions"; break; }
        markerPipeline = state?.pipeline || observed;
        continue;
      }
      markerPipeline = observed;
    } catch { markerIssue = "unreadable canonical production marker"; break; }
  }
  if (explicit && ![HTML_FIRST_PIPELINE, LEGACY_PIPELINE].includes(explicit)) markerIssue ||= "unknown persisted pipeline";
  if (explicit && markerPipeline && explicit !== markerPipeline) {
    // initBundle historically seeds a legacy state before an opt-in HTML
    // source is authored. That pristine handoff is the only permitted
    // legacy-to-HTML inference; an active legacy execution remains a
    // replacement-required conflict.
    const controllerIds = Object.keys(state?.nodes || {}).filter((id) => !isReservedNode(id));
    const pristineSeed = explicit === LEGACY_PIPELINE && markerPipeline === HTML_FIRST_PIPELINE &&
      state?.playbook === "create-deck" && controllerIds.every((id) => id === "instantiation") &&
      controllerIds.every((id) => ["completed", "skipped"].includes(state.nodes[id]?.status));
    const migrationSource = state?.playbook === "migrate-import";
    if (!pristineSeed && !migrationSource) markerIssue ||= "persisted pipeline conflicts with canonical source";
  }
  return { pipeline: markerPipeline || explicit || detectDeckPipeline(deckDir, state), issue: markerIssue };
}

function migrationHandoffReceipt(deckDir, state) {
  if (state?.playbook !== "migrate-import" || !state.execution_id) return null;
  const current = state.nodes?.[state.current_node];
  if (!current || current.status !== "in_progress") return null;
  const sourceExecutionId = current.migration_source_execution_id || current.source_execution_id || state.migration_source_execution_id || state.execution_id;
  const planHash = current.migration_plan_hash || current.plan_hash || state.migration_plan_hash || state.plan_hash;
  const mode = current.old_side_mode || state.old_side_mode;
  if (typeof sourceExecutionId !== "string" || !sourceExecutionId || !SHA256_RE.test(planHash || "") || !["verified-current", "degraded-missing", "degraded-stale"].includes(mode)) return null;
  const versionsDir = join(deckDir, "3_versions");
  let versions = [];
  try { versions = readdirSync(versionsDir).filter((name) => VERSION_RE.test(name)); } catch { return null; }
  for (const targetVersion of versions) {
    const path = join(versionsDir, targetVersion, "_generated", "qa", "html_migration.json");
    if (!existsSync(path)) continue;
    try {
      const receipt = JSON.parse(readFileSync(path, "utf8"));
      if (receipt.source_execution_id !== sourceExecutionId || receipt.plan_hash !== planHash || receipt.target_version !== targetVersion || receipt.old_side_mode !== mode) continue;
      return { path, receipt, targetVersion, sourceExecutionId, planHash, mode };
    } catch { /* malformed receipt is not a handoff */ }
  }
  return null;
}

export function inspectMigrationHandoff(deckDir, state = null) {
  const current = state || readState(deckDir, { purpose: "observe", heal: false });
  const handoff = migrationHandoffReceipt(deckDir, current);
  if (!handoff) return null;
  return Object.freeze({
    code: "migration_handoff_pending",
    source_version: handoff.receipt.source_version,
    target_version: handoff.targetVersion,
    suggested_next: "resume migration-target-review",
  });
}

export function completeMigrationHandoff(deckDir, { targetVersion } = {}) {
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: migration source state is unusable");
  const handoff = migrationHandoffReceipt(deckDir, state);
  if (!handoff || (targetVersion && targetVersion !== handoff.targetVersion)) throw new Error("replacement_required: migration handoff receipt/state mismatch");
  const next = structuredClone(state);
  next.playbook = "migrate-import";
  next.current_node = "migration-target-review";
  next.execution_id = newExecutionId();
  next.execution_started_at = nowIso();
  next.nodes = preserveReservedNodes(next.nodes);
  next.nodes["migration-target-review"] = { status: "in_progress", execution_id: next.execution_id, migration_source_execution_id: handoff.sourceExecutionId, migration_plan_hash: handoff.planHash, old_side_mode: handoff.mode, target_version: handoff.targetVersion };
  next.run_version = handoff.targetVersion;
  next.pipeline = HTML_FIRST_PIPELINE;
  next.gates.html_content = "pending";
  next.gates.html_visual = "pending";
  next.gates.html_content_run_version = handoff.targetVersion;
  next.gates.html_visual_run_version = handoff.targetVersion;
  writeState(deckDir, next, { expectedStateSha: sha256(readFileSync(statePath(deckDir))) });
  return Object.freeze({ status: "handoff-complete", target_version: handoff.targetVersion, current_node: next.current_node });
}

function replacementRequired(reason, pipeline = null) {
  return Object.freeze({
    replacement_required: true,
    code: "replacement_required",
    pipeline,
    reason: String(reason),
    durable_state_present: false,
  });
}

export function readState(deckDir, opts = {}) {
  const shouldHeal = opts.heal !== false;
  const purpose = opts.purpose || "execute";
  if (!["observe", "execute"].includes(purpose)) throw new TypeError("state read purpose must be observe or execute");
  const path = statePath(deckDir);
  if (!existsSync(path)) {
    const classification = classifyDeckPipeline(deckDir);
    if (classification.issue || classification.pipeline === HTML_FIRST_PIPELINE) {
      return replacementRequired(classification.issue || "HTML-first run is missing authoritative state", classification.pipeline);
    }
    const projection = createDefaultState();
    projection.durable_state_present = false;
    return projection;
  }
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    const classification = classifyDeckPipeline(deckDir);
    if (!shouldHeal || purpose === "observe" || classification.pipeline === HTML_FIRST_PIPELINE) {
      return classification.pipeline === HTML_FIRST_PIPELINE
        ? replacementRequired("HTML-first state cannot be read without replacing authoritative evidence", classification.pipeline)
        : { corrupted: true, errors: [error.message] };
    }
    const seeded = createDefaultState();
    writeState(deckDir, seeded);
    seeded._healed = true;
    return seeded;
  }
  const parsed = parseStateYaml(raw);
  if (!parsed.ok) {
    const classification = classifyDeckPipeline(deckDir);
    if (!shouldHeal || purpose === "observe" || classification.pipeline === HTML_FIRST_PIPELINE) {
      return classification.pipeline === HTML_FIRST_PIPELINE
        ? replacementRequired("HTML-first state is not safely parseable", classification.pipeline)
        : { corrupted: true, errors: parsed.errors };
    }
    const broken = `${path}.broken.${Date.now()}`;
    try { renameSync(path, broken); } catch { /* best effort */ }
    const seeded = seedFromBroken(raw);
    writeState(deckDir, seeded);
    try { appendHistory(deckDir, { type: "state_healed", reason: "unparseable", backup: broken }); } catch { /* optional */ }
    seeded._healed = true;
    return seeded;
  }
  const classification = classifyDeckPipeline(deckDir, parsed.value);
  if (classification.issue) return replacementRequired(classification.issue, classification.pipeline);
  if (!shouldHeal) return parsed.value;
  const { state, dirty } = healState(parsed.value, {
    pipeline: opts.pipeline || classification.pipeline,
  });
  if (dirty || parsed.hadErrors) {
    const journalPresent = existsSync(join(deckDir, STATE_DIR, GATE_JOURNAL_FILE));
    if (journalPresent) {
      if (purpose === "execute") throw new Error("CONFLICT: gate approval journal fences state healing");
      state._heal_pending = true;
      state.durable_state_present = true;
      return state;
    }
    writeState(deckDir, state, { expectedStateSha: sha256(Buffer.from(raw)) });
    try { appendHistory(deckDir, { type: "state_healed", reason: dirty ? "schema" : "parse_errors" }); } catch { /* optional */ }
    state._healed = true;
  }
  state.durable_state_present = true;
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

export function prepareStateWrite(state, { updatedAt = nowIso() } = {}) {
  const { _healed, ...persist } = state;
  delete persist._heal_pending;
  delete persist.durable_state_present;
  persist.schema_version = STATE_SCHEMA_VERSION;
  persist.updated_at = updatedAt;
  normalizePlaybookStack(persist, persist.updated_at);
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

function currentResetRecordFromBytes(bytes) {
  if (!bytes?.length) return null;
  const parsed = parseStateYaml(bytes.toString("utf8"));
  if (!parsed.ok) return null;
  const records = parsed.value?.nodes?.["html-production-reset"]?.by_version;
  if (!isPlainObject(records)) return null;
  return Object.values(records).find((record) => record?.status === "deletion_pending") || null;
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
  const currentReset = currentResetRecordFromBytes(oldBytes);
  if (currentReset && opts.resetOwnerToken !== currentReset.owner_token) throw new Error("CONFLICT: HTML production reset fences state writes");
  const prepared = prepareStateWrite(state, { updatedAt: opts.updatedAt || nowIso() });
  if (journal.record && prepared.sha256 !== journal.record.new_state_sha256) throw new Error("CONFLICT: journal owner attempted unbound state bytes");
  const candidateReset = state?.nodes?.["html-production-reset"]?.by_version
    ? Object.values(state.nodes["html-production-reset"].by_version).find((record) => record?.status === "deletion_pending")
    : null;
  if (!currentReset && candidateReset && opts.resetOwnerToken !== candidateReset.owner_token) throw new Error("CONFLICT: reset start requires its exact owner token");
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
    const resetNow = currentResetRecordFromBytes(currentBytes);
    if (resetNow && opts.resetOwnerToken !== resetNow.owner_token) throw new Error("CONFLICT: HTML production reset ownership changed before state commit");
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  state.schema_version = STATE_SCHEMA_VERSION;
  state.updated_at = prepared.persist.updated_at;
  cleanStaleTemps(dir);
}

/**
 * Atomically turns one current migration preview confirmation into the only
 * apply record. Receipt inspection remains delegated to the migration owner.
 */
export async function confirmHtmlMigrationApply(sourceRunDir, { planHash, oldSideMode } = {}) {
  if (!SHA256_RE.test(planHash || "")) throw new TypeError("plan hash must be a 64-lowercase-hex SHA-256");
  if (!["verified-current", "degraded-missing", "degraded-stale"].includes(oldSideMode || "")) {
    throw new TypeError("old-side mode must be verified-current, degraded-missing, or degraded-stale");
  }
  const runDir = resolve(sourceRunDir);
  const sourcePath = join(runDir, "slide-specifications.md");
  if (!existsSync(sourcePath)) throw new Error("migration source version has no slide specifications");
  const marker = probeProductionMarker(readFileSync(sourcePath), { source: "slide-specifications.md" });
  if (marker.branch !== "legacy") throw new Error("migration confirmation accepts only a markerless source version");

  const deckDir = resolve(runDir, "..", "..");
  const current = readState(deckDir, { purpose: "execute", heal: false });
  if (current?.replacement_required || current?.corrupted) throw new Error("migration source state is unusable");
  if (current.playbook !== "migrate-import" || !current.execution_id) throw new Error("active migrate-import confirmation execution is required");
  const executionId = current.execution_id;
  const confirmed = current.nodes?.["confirm-html-migration"];
  const preview = current.nodes?.["preview-html-migration"];
  const activeApply = current.nodes?.["apply-html-migration"];
  const sourceVersion = basename(runDir);

  const migration = await import("../../05-iteration/migration/html_migration.mjs");
  const inspection = migration.inspectHtmlMigrationConfirmation(runDir, { planHash, oldSideMode });
  if (inspection.source_version !== sourceVersion) throw new Error("migration confirmation source version drifted");

  if (
    current.current_node === "apply-html-migration" &&
    activeApply?.status === "in_progress" &&
    activeApply.execution_id === executionId &&
    activeApply.migration_plan_hash === planHash &&
    activeApply.old_side_mode === oldSideMode &&
    activeApply.migration_source_version === sourceVersion
  ) {
    return Object.freeze({ status: "idempotent", source_version: sourceVersion, target_version: inspection.target_version, plan_hash: planHash, old_side_mode: oldSideMode, current_node: "apply-html-migration" });
  }

  if (
    current.current_node !== "confirm-html-migration" ||
    confirmed?.status !== "in_progress" ||
    confirmed.execution_id !== executionId ||
    preview?.status !== "completed" ||
    preview.execution_id !== executionId ||
    preview.migration_plan_hash !== planHash ||
    preview.old_side_mode !== oldSideMode
  ) {
    throw new Error("active migrate-import confirmation execution is required");
  }

  const next = structuredClone(current);
  const at = nowIso();
  next.nodes["confirm-html-migration"] = {
    ...next.nodes["confirm-html-migration"],
    status: "completed",
    execution_id: executionId,
    decision: { value: "apply", kind: "user", at },
    completed: at,
  };
  next.nodes["apply-html-migration"] = {
    status: "in_progress",
    execution_id: executionId,
    migration_plan_hash: planHash,
    old_side_mode: oldSideMode,
    migration_source_version: sourceVersion,
    started: at,
  };
  next.current_node = "apply-html-migration";
  const expectedStateSha = sha256(readFileSync(statePath(deckDir)));
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  return Object.freeze({ status: "confirmed", source_version: sourceVersion, target_version: inspection.target_version, plan_hash: planHash, old_side_mode: oldSideMode, current_node: "apply-html-migration" });
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
  const html_resume_guidance = statusSnapshot?.html_resume_guidance || null;
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

  // CLI owns the structured HTML review projection and commands. The shared
  // card only consumes that producer output, preserving a waiting human's
  // priority and never constructing a waiver or state mutation itself.
  if (!waiting_for && html_resume_guidance?.recommended_command) {
    workflow_summary = html_resume_guidance.summary || workflow_summary;
    suggested_next = html_resume_guidance.recommended_command;
  }

  if (playbook === "image2-refine" && !html_resume_guidance?.recommended_command) {
    const version = controller?.ctx?.runVersion || controller?.ctx?.run_version || null;
    const refinement = version ? (() => { try { return projectImage2RefinementState(state, version); } catch { return null; } })() : null;
    if (refinement?.status === "unknown-submit") suggested_next = "human:resolve-unknown-submit";
    else if (refinement?.status === "review-pending") suggested_next = "human:review-image2-refinement";
    else if (refinement?.status === "complete") suggested_next = "complete:image2-refinement-await-final-html-review";
    else if (!refinement?.present) suggested_next = "start:image2-refine/plan";
  }

  const activeNodeIds = controller?.index ? controllerNodeIds(controller.index, playbook) : undefined;
  return {
    playbook,
    current_node,
    node_status,
    waiting_for,
    note,
    gates,
    html_resume_guidance,
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
    pipeline: LEGACY_PIPELINE,
    playbook: "",
    current_node: "",
    execution_id: "",
    execution_started_at: "",
    started_at: "",
    updated_at: "",
    nodes: {},
    gates: { content: "pending", visual: "pending", html_content: "pending", html_visual: "pending" },
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
  const nodes = isPlainObject(state.nodes) ? state.nodes : {};
  const gates = isPlainObject(state.gates) ? state.gates : {};
  if (!isPlainObject(state.nodes)) errors.push("missing nodes");
  if (!isPlainObject(state.gates)) errors.push("missing gates");
  if (state.playbook && (!state.execution_id || !state.execution_started_at)) errors.push("active playbook missing execution fields");
  for (const [name, node] of controllerEntries(nodes)) {
    if (!NODE_STATUSES.includes(node?.status)) errors.push(`invalid status for ${name}`);
    if (node?.execution_id !== state.execution_id) errors.push(`execution mismatch for ${name}`);
    if (node?.status === "in_progress" && node.completed) errors.push(`illegal: ${name} completed→in_progress`);
  }
  if (nodes["image2-refinement"] !== undefined) {
    const byVersion = nodes["image2-refinement"]?.by_version;
    if (!isPlainObject(byVersion)) errors.push("image2-refinement must contain by_version");
    else {
      for (const key of Object.keys(byVersion)) {
        const match = /^3_versions\/(v[1-9][0-9]*)$/.exec(key);
        if (!match) errors.push(`invalid image2-refinement version key ${key}`);
        else if (!validRefinementRecord(byVersion[key], match[1])) errors.push(`invalid image2-refinement record ${key}`);
      }
    }
  }
  for (const gate of ["content", "visual", "html_content", "html_visual"]) if (!GATE_STATUSES.includes(gates[gate])) errors.push(`invalid gate ${gate}`);
  return { valid: errors.length === 0, errors };
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

function versionFromReservedKey(key) {
  return /^3_versions\/(v[1-9][0-9]*)$/.exec(key)?.[1] || null;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function validNullableSha256(value) {
  return value === null || (typeof value === "string" && SHA256_RE.test(value));
}

function validateReservedRecordIdentity(record, key, recordPath, issues) {
  const runVersion = versionFromReservedKey(key);
  if (!runVersion) {
    issues.push(stateIssue(recordPath, "canonical 3_versions/vN key", "noncanonical", "record"));
    return null;
  }
  if (!isPlainObject(record)) {
    issues.push(stateIssue(recordPath, "mapping record", typeof record, "record"));
    return null;
  }
  if (record.run_version !== runVersion) {
    issues.push(stateIssue(`${recordPath}.run_version`, runVersion, record.run_version, "record"));
  }
  return runVersion;
}

function validateWaivedChecksReadOnly(value, path, issues) {
  if (!Array.isArray(value) || value.length > 64) {
    issues.push(stateIssue(path, "0..64 canonical checks", Array.isArray(value) ? `array:${value.length}` : typeof value, "record"));
    return false;
  }
  let allValid = true;
  let prior = null;
  for (const entry of value) {
    const entryValid = isPlainObject(entry) && hasExactKeys(entry, ["code", "subject"]) && /^[a-z][a-z0-9_]{0,63}$/.test(entry.code || "") &&
      (entry.subject === null || (isPlainObject(entry.subject) && hasExactKeys(entry.subject, ["kind", "id"]) && ["gate", "slide", "recipe", "artifact", "receipt"].includes(entry.subject.kind) && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(entry.subject.id || "")));
    if (!entryValid) {
      issues.push(stateIssue(path, "canonical waived check", "invalid", "record"));
      allValid = false;
      continue;
    }
    const key = `${entry.code}\u0000${entry.subject?.kind || ""}\u0000${entry.subject?.id || ""}`;
    if (prior !== null && prior >= key) {
      issues.push(stateIssue(path, "sorted duplicate-free checks", "noncanonical", "record"));
      allValid = false;
    }
    prior = key;
  }
  return allValid;
}

function hasWaivedSubject(checks, kind, id) {
  return Array.isArray(checks) && checks.some((entry) => entry?.subject?.kind === kind && entry.subject.id === id);
}

function validateReferencePairShape(record, pathKey, shaKey, recordPath, issues, { required = false } = {}) {
  const pathValue = record[pathKey];
  const shaValue = record[shaKey];
  if (pathValue === null && shaValue === null) {
    if (required) issues.push(stateIssue(`${recordPath}.${pathKey}`, "path plus sha256", "missing", "record"));
    return false;
  }
  if (typeof pathValue !== "string" || !pathValue || typeof shaValue !== "string" || !SHA256_RE.test(shaValue)) {
    issues.push(stateIssue(`${recordPath}.${pathKey}`, "path plus sha256", "missing-or-invalid", "record"));
    return false;
  }
  return true;
}

function validateHtmlGateRecordReadOnly(id, record, key, recordPath, issues) {
  const gate = id === "html-content-review" ? "content" : "visual";
  const audit = gate === "content"
    ? ["content_review_fingerprint", "ordered_plan_digest"]
    : ["visual_system_fingerprint", "component_recipe_coverage", "page_visual_dependencies", "shown_artifacts"];
  const common = ["schema", "gate", "pipeline", "run_version", "status", "waiver_reason", "review_plan_hash", "html_production_reset_id"];
  const v1 = [...common, ...audit, "decided_at"];
  const v2 = [...common, "evidence_complete", "waived_checks", ...audit, "decided_at"];
  const runVersion = validateReservedRecordIdentity(record, key, recordPath, issues);
  if (!runVersion) return;
  if (record.schema === "pptmaker-html-gate-review-v1") {
    if (!hasExactKeys(record, v1)) issues.push(stateIssue(recordPath, "closed gate v1 record", "unknown-or-missing-key", "record"));
  } else if (record.schema === "pptmaker-html-gate-review-v2") {
    if (!hasExactKeys(record, v2)) issues.push(stateIssue(recordPath, "closed gate v2 record", "unknown-or-missing-key", "record"));
  } else {
    issues.push(stateIssue(`${recordPath}.schema`, "supported gate record schema", record.schema || "missing", "record"));
    return;
  }
  if (record.gate !== gate) issues.push(stateIssue(`${recordPath}.gate`, gate, record.gate, "record"));
  if (record.pipeline !== HTML_FIRST_PIPELINE) issues.push(stateIssue(`${recordPath}.pipeline`, HTML_FIRST_PIPELINE, record.pipeline, "record"));
  if (!["approved", "waived"].includes(record.status)) issues.push(stateIssue(`${recordPath}.status`, "approved|waived", record.status, "record"));
  if (!validNullableSha256(record.html_production_reset_id)) issues.push(stateIssue(`${recordPath}.html_production_reset_id`, "null or sha256", "invalid", "record"));
  if (!validIsoTimestamp(record.decided_at)) issues.push(stateIssue(`${recordPath}.decided_at`, "UTC ISO-8601", "invalid", "record"));
  const hasPlanHash = typeof record.review_plan_hash === "string" && SHA256_RE.test(record.review_plan_hash);
  if (record.schema === "pptmaker-html-gate-review-v1") {
    if (!hasPlanHash) issues.push(stateIssue(`${recordPath}.review_plan_hash`, "sha256", "missing-or-invalid", "record"));
    if (record.status === "approved" && record.waiver_reason !== null) issues.push(stateIssue(`${recordPath}.waiver_reason`, "null for approved", "present", "record"));
    if (record.status === "waived" && (typeof record.waiver_reason !== "string" || !record.waiver_reason)) issues.push(stateIssue(`${recordPath}.waiver_reason`, "non-empty waiver reason", "missing-or-invalid", "record"));
    return;
  }
  const checksValid = validateWaivedChecksReadOnly(record.waived_checks, `${recordPath}.waived_checks`, issues);
  const checks = Array.isArray(record.waived_checks) ? record.waived_checks : [];
  if (typeof record.evidence_complete !== "boolean") issues.push(stateIssue(`${recordPath}.evidence_complete`, "boolean", typeof record.evidence_complete, "record"));
  if (record.status === "approved") {
    if (record.waiver_reason !== null) issues.push(stateIssue(`${recordPath}.waiver_reason`, "null for approved", "present", "record"));
    if (record.evidence_complete !== true) issues.push(stateIssue(`${recordPath}.evidence_complete`, "true for approved", record.evidence_complete, "record"));
    if (checks.length !== 0 || !checksValid) issues.push(stateIssue(`${recordPath}.waived_checks`, "empty for approved", `array:${checks.length}`, "record"));
    if (!hasPlanHash) issues.push(stateIssue(`${recordPath}.review_plan_hash`, "sha256 for approved", "missing-or-invalid", "record"));
    return;
  }
  if (typeof record.waiver_reason !== "string" || !record.waiver_reason) issues.push(stateIssue(`${recordPath}.waiver_reason`, "non-empty waiver reason", "missing-or-invalid", "record"));
  if (record.evidence_complete === true) {
    if (checks.length !== 0 || !checksValid) issues.push(stateIssue(`${recordPath}.waived_checks`, "empty for complete waiver", `array:${checks.length}`, "record"));
    if (!hasPlanHash) issues.push(stateIssue(`${recordPath}.review_plan_hash`, "sha256 for complete waiver", "missing-or-invalid", "record"));
  } else if (record.evidence_complete === false) {
    if (checks.length === 0 || !checksValid) issues.push(stateIssue(`${recordPath}.waived_checks`, "non-empty canonical checks", `array:${checks.length}`, "record"));
    if (record.review_plan_hash !== null && !hasPlanHash) issues.push(stateIssue(`${recordPath}.review_plan_hash`, "null or sha256 for incomplete waiver", "invalid", "record"));
  }
}

function validateHtmlDeliveryRecordReadOnly(record, key, recordPath, issues) {
  const v1 = ["schema", "pipeline", "run_version", "html_production_reset_id", "html_delivery_digest", "contact_sheet_manifest_path", "contact_sheet_manifest_sha256", "contact_sheet_path", "contact_sheet_sha256", "assembly_receipt_path", "assembly_receipt_sha256", "pptx_sha256", "notes_receipt_path", "notes_receipt_sha256", "decision", "reason", "decided_at"];
  const v2 = [...v1, "pptx_path", "evidence_complete", "waived_checks"];
  const runVersion = validateReservedRecordIdentity(record, key, recordPath, issues);
  if (!runVersion) return;
  const isV1 = record.schema === "pptmaker-html-delivery-review-v1";
  const isV2 = record.schema === "pptmaker-html-delivery-review-v2";
  if (isV1) {
    if (!hasExactKeys(record, v1)) issues.push(stateIssue(recordPath, "closed delivery v1 record", "unknown-or-missing-key", "record"));
  } else if (isV2) {
    if (!hasExactKeys(record, v2)) issues.push(stateIssue(recordPath, "closed delivery v2 record", "unknown-or-missing-key", "record"));
  } else {
    issues.push(stateIssue(`${recordPath}.schema`, "supported delivery record schema", record.schema || "missing", "record"));
    return;
  }
  if (record.pipeline !== HTML_FIRST_PIPELINE) issues.push(stateIssue(`${recordPath}.pipeline`, HTML_FIRST_PIPELINE, record.pipeline, "record"));
  if (!validNullableSha256(record.html_production_reset_id)) issues.push(stateIssue(`${recordPath}.html_production_reset_id`, "null or sha256", "invalid", "record"));
  if (!SHA256_RE.test(record.html_delivery_digest || "")) issues.push(stateIssue(`${recordPath}.html_delivery_digest`, "sha256", "missing-or-invalid", "record"));
  if (!["proceed", "repair", "redirect"].includes(record.decision)) issues.push(stateIssue(`${recordPath}.decision`, "proceed|repair|redirect", record.decision, "record"));
  if (!validIsoTimestamp(record.decided_at)) issues.push(stateIssue(`${recordPath}.decided_at`, "UTC ISO-8601", "invalid", "record"));
  const complete = isV1 || record.evidence_complete === true;
  const requiredLineage = complete;
  validateReferencePairShape(record, "contact_sheet_manifest_path", "contact_sheet_manifest_sha256", recordPath, issues, { required: true });
  validateReferencePairShape(record, "contact_sheet_path", "contact_sheet_sha256", recordPath, issues, { required: true });
  const assemblyPresent = validateReferencePairShape(record, "assembly_receipt_path", "assembly_receipt_sha256", recordPath, issues, { required: requiredLineage });
  const notesPresent = validateReferencePairShape(record, "notes_receipt_path", "notes_receipt_sha256", recordPath, issues, { required: requiredLineage });
  if (!SHA256_RE.test(record.pptx_sha256 || "")) issues.push(stateIssue(`${recordPath}.pptx_sha256`, "sha256", "missing-or-invalid", "record"));
  if (isV1) {
    if (record.decision === "proceed" && record.reason !== null) issues.push(stateIssue(`${recordPath}.reason`, "null for normal proceed", "present", "record"));
    if (["repair", "redirect"].includes(record.decision) && (typeof record.reason !== "string" || !record.reason)) issues.push(stateIssue(`${recordPath}.reason`, "non-empty repair/redirect reason", "missing-or-invalid", "record"));
    return;
  }
  const pptxPresent = validateReferencePairShape(record, "pptx_path", "pptx_sha256", recordPath, issues, { required: true });
  const checksValid = validateWaivedChecksReadOnly(record.waived_checks, `${recordPath}.waived_checks`, issues);
  const checks = Array.isArray(record.waived_checks) ? record.waived_checks : [];
  if (typeof record.evidence_complete !== "boolean") issues.push(stateIssue(`${recordPath}.evidence_complete`, "boolean", typeof record.evidence_complete, "record"));
  if (record.evidence_complete === true) {
    if (checks.length !== 0 || !checksValid) issues.push(stateIssue(`${recordPath}.waived_checks`, "empty for complete evidence", `array:${checks.length}`, "record"));
    if (!assemblyPresent || !notesPresent || !pptxPresent) issues.push(stateIssue(recordPath, "complete delivery artifact set", "incomplete", "record"));
  } else if (record.evidence_complete === false) {
    if (record.decision !== "proceed") issues.push(stateIssue(`${recordPath}.decision`, "proceed for incomplete evidence", record.decision, "record"));
    if (typeof record.reason !== "string" || !record.reason) issues.push(stateIssue(`${recordPath}.reason`, "non-empty forced-proceed reason", "missing-or-invalid", "record"));
    if (checks.length === 0 || !checksValid) issues.push(stateIssue(`${recordPath}.waived_checks`, "non-empty canonical checks", `array:${checks.length}`, "record"));
    if (!assemblyPresent && !hasWaivedSubject(checks, "receipt", "assembly-v2")) issues.push(stateIssue(`${recordPath}.assembly_receipt_path`, "waived assembly-v2 receipt", "uncovered-null", "record"));
    if (!notesPresent && !hasWaivedSubject(checks, "receipt", "notes-v3")) issues.push(stateIssue(`${recordPath}.notes_receipt_path`, "waived notes-v3 receipt", "uncovered-null", "record"));
  }
  if (["repair", "redirect"].includes(record.decision) && (typeof record.reason !== "string" || !record.reason)) issues.push(stateIssue(`${recordPath}.reason`, "non-empty repair/redirect reason", "missing-or-invalid", "record"));
}

function validateHtmlResetRecordReadOnly(record, key, recordPath, issues) {
  const keys = ["schema", "pipeline", "run_version", "html_production_reset_id", "status", "started_at", "completed_at", "owner_token", "owner_host", "owner_pid", "owner_claimed_at_epoch_ms"];
  if (!validateReservedRecordIdentity(record, key, recordPath, issues)) return;
  if (!hasExactKeys(record, keys)) issues.push(stateIssue(recordPath, "closed HTML reset record", "unknown-or-missing-key", "record"));
  if (record.schema !== "pptmaker-html-production-reset-v1") issues.push(stateIssue(`${recordPath}.schema`, "pptmaker-html-production-reset-v1", record.schema || "missing", "record"));
  if (record.pipeline !== HTML_FIRST_PIPELINE) issues.push(stateIssue(`${recordPath}.pipeline`, HTML_FIRST_PIPELINE, record.pipeline, "record"));
  if (!SHA256_RE.test(record.html_production_reset_id || "")) issues.push(stateIssue(`${recordPath}.html_production_reset_id`, "sha256", "missing-or-invalid", "record"));
  if (!SHA256_RE.test(record.owner_token || "")) issues.push(stateIssue(`${recordPath}.owner_token`, "sha256", "missing-or-invalid", "record"));
  if (!["deletion_pending", "complete"].includes(record.status)) issues.push(stateIssue(`${recordPath}.status`, "deletion_pending|complete", record.status, "record"));
  if (!validIsoTimestamp(record.started_at)) issues.push(stateIssue(`${recordPath}.started_at`, "UTC ISO-8601", "invalid", "record"));
  if (record.status === "deletion_pending" ? record.completed_at !== null : !validIsoTimestamp(record.completed_at)) issues.push(stateIssue(`${recordPath}.completed_at`, record.status === "deletion_pending" ? "null" : "UTC ISO-8601", "invalid", "record"));
}

function validateConfinedReferenceReadOnly(runDir, pathValue, shaValue, pathField, issues) {
  if (pathValue === null && shaValue === null) return;
  if (typeof pathValue !== "string" || !pathValue || typeof shaValue !== "string" || !SHA256_RE.test(shaValue)) {
    issues.push(stateIssue(pathField, "confined path plus sha256", "missing-or-invalid", "reference"));
    return;
  }
  if (!runDir) return;
  const root = resolve(runDir);
  if (pathValue.includes("\\") || pathValue.startsWith("/") || pathValue.split("/").some((part) => !part || part === "." || part === "..")) {
    issues.push(stateIssue(pathField, "confined run-relative path", "invalid-path", "reference"));
    return;
  }
  const absolute = resolve(root, pathValue);
  const rel = relative(root, absolute);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) {
    issues.push(stateIssue(pathField, "confined run-relative path", "escaping-path", "reference"));
    return;
  }
  if (!existsSync(absolute)) {
    issues.push(stateIssue(pathField, "existing referenced file", "missing", "reference", "rebuild_or_repair"));
    return;
  }
  let stat;
  try { stat = lstatSync(absolute); } catch {
    issues.push(stateIssue(pathField, "regular referenced file", "unreadable", "reference", "rebuild_or_repair"));
    return;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    issues.push(stateIssue(pathField, "regular confined file", stat.isSymbolicLink() ? "symbolic-link" : "not-file", "reference", "rebuild_or_repair"));
    return;
  }
  const actual = sha256(readFileSync(absolute));
  if (actual !== shaValue) issues.push(stateIssue(`${pathField}_sha256`, `sha256:${shaValue.slice(0, 12)}`, `sha256:${actual.slice(0, 12)}`, "reference", "rebuild_or_repair"));
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
  const topLevel = ["schema_version", "pipeline", "playbook", "current_node", "execution_id", "execution_started_at", "started_at", "updated_at", "nodes", "gates", "deck", "playbook_stack", "diagnostics"];
  for (const key of Object.keys(state)) if (!topLevel.includes(key)) issues.push(stateIssue(key, "known top-level state key", "unknown", "state"));
  for (const error of validateState(state).errors.slice(0, 20)) issues.push(stateIssue("state", "valid schema-v3 invariant", error, "state"));

  const nodes = state.nodes;
  if (isPlainObject(nodes)) {
    for (const id of ["html-content-review", "html-visual-review", "html-delivery-review", "html-production-reset", "image2-refinement"]) {
      const container = nodes[id];
      if (container == null) continue;
      if (!hasExactKeys(container, ["by_version"]) || !isPlainObject(container.by_version)) {
        issues.push(stateIssue(`nodes.${id}`, "by_version-only reserved record", "invalid", "record"));
        continue;
      }
      for (const [key, record] of Object.entries(container.by_version)) {
        const recordPath = `nodes.${id}.by_version.${key}`;
        if (["html-content-review", "html-visual-review"].includes(id)) {
          validateHtmlGateRecordReadOnly(id, record, key, recordPath, issues);
        } else if (id === "html-delivery-review") {
          validateHtmlDeliveryRecordReadOnly(record, key, recordPath, issues);
          if (isPlainObject(record)) {
            validateConfinedReferenceReadOnly(runDir, record.contact_sheet_manifest_path, record.contact_sheet_manifest_sha256, `${recordPath}.contact_sheet_manifest_path`, issues);
            validateConfinedReferenceReadOnly(runDir, record.contact_sheet_path, record.contact_sheet_sha256, `${recordPath}.contact_sheet_path`, issues);
            validateConfinedReferenceReadOnly(runDir, record.assembly_receipt_path, record.assembly_receipt_sha256, `${recordPath}.assembly_receipt_path`, issues);
            validateConfinedReferenceReadOnly(runDir, record.notes_receipt_path, record.notes_receipt_sha256, `${recordPath}.notes_receipt_path`, issues);
            if (record.schema === "pptmaker-html-delivery-review-v2") {
              validateConfinedReferenceReadOnly(runDir, record.pptx_path, record.pptx_sha256, `${recordPath}.pptx_path`, issues);
            }
          }
        } else if (id === "html-production-reset") {
          validateHtmlResetRecordReadOnly(record, key, recordPath, issues);
        } else if (id === "image2-refinement") {
          const runVersion = validateReservedRecordIdentity(record, key, recordPath, issues);
          if (runVersion && !validRefinementRecord(record, runVersion)) {
            issues.push(stateIssue(recordPath, "closed image2 refinement v1/v2 record", "unknown-or-invalid", "record"));
          }
        }
      }
    }
  }
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
  visual_preset_seeded: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "color_palette.json")),
  style_master_exists: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "style_master.jpg")),
  slide_specs_exists: (_state, ctx) => existsSync(join(ctx.runDir || "", "slide-specifications.md")),
  slide_specs_valid: (_state, ctx) => typeof ctx.slideSpecsValid === "function" ? Boolean(ctx.slideSpecsValid()) : ctx.slideSpecsValid === true,
  pptx_generated: (_state, ctx) => {
    try { return readdirSync(join(ctx.runDir || "", "_generated", "ppt")).some((name) => name.endsWith(".pptx") && !name.endsWith(".backup.pptx")); } catch { return false; }
  },
  speaker_notes_injected: (_state, ctx) => validateNotesReceipt(ctx.runDir || "").valid,
  header_review_current: (_state, ctx) => typeof ctx.headerReviewCurrent === "function" ? Boolean(ctx.headerReviewCurrent()) : ctx.headerReviewCurrent === true,
  html_first_marked: (_state, ctx) => typeof ctx.htmlFirstMarked === "function" ? Boolean(ctx.htmlFirstMarked()) : ctx.htmlFirstMarked === true,
  html_delivery_review_current: (_state, ctx) => typeof ctx.htmlDeliveryReviewCurrent === "function" ? Boolean(ctx.htmlDeliveryReviewCurrent()) : ctx.htmlDeliveryReviewCurrent === true,
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
  const { node, validation, index } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  const controller = index.controllers.get(state?.playbook);
  if (ctx.pipeline && controller && !controller.supportedPipelines.includes(ctx.pipeline)) return { pass: false, missing: [`pipeline:${ctx.pipeline}`], unknown: [`controller ${state.playbook} does not own ${ctx.pipeline}`] };
  const required = node.requires.map((id) => `node_done:${id}`);
  return checkConditions([...required, ...node.entry], node, state, ctx);
}
export function checkExit(nodeName, playbookDir, state, ctx = {}) {
  const { node, validation, index } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, missing: [], unknown: validation.errors.map((error) => error.message || String(error)) };
  const controller = index.controllers.get(state?.playbook);
  if (ctx.pipeline && controller && !controller.supportedPipelines.includes(ctx.pipeline)) return { pass: false, missing: [`pipeline:${ctx.pipeline}`], unknown: [`controller ${state.playbook} does not own ${ctx.pipeline}`] };
  return checkConditions(node.exit, node, state, ctx);
}
export function getMissingConditions(nodeName, playbookDir, state, ctx = {}) {
  const result = checkEntry(nodeName, playbookDir, state, ctx);
  return [...result.missing, ...result.unknown];
}
export function getEligibleNextNodes(index, playbook, state, ctx = {}) {
  return eligibleNextNodes(index, playbook, state, (id) => checkEntry(id, index.playbookDir, state, ctx));
}
