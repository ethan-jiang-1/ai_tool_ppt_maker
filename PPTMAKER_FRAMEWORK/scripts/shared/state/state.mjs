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
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import { parseDocument, stringify } from "yaml";
import {
  buildPlaybookIndex,
  controllerNodeIds,
  controllerActiveNodeIds,
  resolveNode,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";
import { inspectPageAuthorityDeliveryEvidence } from "./page_authority_delivery_evidence.mjs";
import {
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "../image2/page_authority_artifacts.mjs";
import { PAGE_AUTHORITY_IMAGE2_PIPELINE, PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, TARGET_WORKFLOWS, isTargetWorkflowSelectionPending, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { TARGET_PRODUCTION_MODE, canonicalVersionKey, initialProductionModeRecord, inspectProductionMode, isProductionMode, isProductionModeRecord, normalizeRunVersion, pipelineFromSourceMarker, productionPolicyForMode } from "../run-bundle/production_mode.mjs";
import { isHistoricalLegacyProtocolRecord, legacyProtocolPolicyForMode } from "./legacy_protocol_adoption.mjs";

export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const STATE_SCHEMA_VERSION = 5;
export const NODE_STATUSES = Object.freeze(["pending", "in_progress", "completed", "skipped", "failed"]);
export const GATE_STATUSES = Object.freeze(["pending", "approved", "waived"]);
export const RESERVED_NODE_IDS = Object.freeze([]);
export const LEGACY_RESERVED_NODE_IDS = Object.freeze([]);
const RETIRED_STATE_NODE_IDS = Object.freeze(["header-review", "html-content-review", "html-visual-review", "html-delivery-review", "html-production-reset", "image2-refinement", "image-production"]);

export const STATE_YAML_HEADER = `\
# _state/state.yaml — MD Controller execution state (not a hand-edit playground)
# Schema authority: PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md
# API: PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs
# CLI: node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> [--json|--check-gates]
# Fields: schema_version, pipeline, production_mode.by_version, playbook, current_node, execution_id, nodes.*, gates.*, deck.*, playbook_stack
# MD Controller source: PPTMAKER_FRAMEWORK/playbook/*.md
# Read boundary: observation validates current schema-5 authority and never rewrites, infers, or continues unsupported historical state
`;

export const STATE_DIR_README = `\
# 执行状态 (_state)

**这里放什么:** MD Controller 跑到哪了——当前执行、节点、闸门、等待原因。Playbook 内容仍以 \`PPTMAKER_FRAMEWORK/playbook/*.md\` 为真相源。

**主要文件:**
- \`state.yaml\` — 当前执行工作集（原子写）
- \`history.jsonl\` — 可选参考日志，不参与自动恢复

**断线后:** 先跑 \`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir>\`。

**Schema 权威:** \`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md\`。

**不要手改:** 优先使用 \`scripts/shared/state/state.mjs\` / \`ppt_flow\`；读取只验证当前 schema-5 权威状态，不会重写、推断或继续不受支持的历史状态。
`;

const YAML_PARSE_OPTS = { strict: false, uniqueKeys: false, logLevel: "error" };
const DEFAULT_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");
const GATE_JOURNAL_FILE = "gate-approval-journal.json";
const SHA256_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const TRANSITION_SUSPENSION_SCHEMA = "pptmaker-production-mode-transition-suspension-v1";
const TRANSITION_APPLY_NODE = "apply-production-mode-transition";
const TRANSITION_INTAKE_FIELDS = Object.freeze(["topic", "audience", "duration", "language", "takeaway", "content_constraints", "visual_dna", "success_criteria"]);
const TRANSITION_UNCERTAIN_RECOVERY_AGE_MS = 300000;
const PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH = "2_backbone/visual-style/page-authority-visual-language.yaml";
const PAGE_AUTHORITY_TRANSITION_RECEIPT_RELATIVE_PATH = "_generated/page_authority_image2/receipts/production-mode-transition.json";
// These field names and byte schemas predate retirement. They remain fixed so
// an in-flight adoption transaction can be recovered exactly, but the only
// accepted action is the bounded historical-to-Page-Authority adoption below.
const LEGACY_ADOPTION_KIND = "legacy-adoption";
const TRANSITION_RECORD_KEYS = Object.freeze([
  "status",
  "execution_id",
  "run_version",
  "transition_kind",
  "transition_adoption",
  "transition_plan_hash",
  "transition_candidate_receipt_sha256",
  "transition_target_intake",
  "transition_target_intake_sha256",
  "transition_confirmation",
  "transition_source_execution_id",
  "transition_source_version",
  "transition_source_mode",
  "transition_source_pipeline",
  "transition_target_version",
  "transition_target_mode",
  "transition_target_pipeline",
  "transition_target_workflow",
  "started",
]);
const TRANSITION_RECOVERY_CONFIRMATION_KEYS = Object.freeze([
  "kind",
  "decision",
  "source_execution_id",
  "source_version",
  "target_version",
  "plan_hash",
  "journal_sha256",
  "confirmed_at",
]);

function nowIso() { return new Date().toISOString(); }
function newExecutionId() { return `exec-${randomUUID()}`; }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function deepClone(value) { return value == null ? value : structuredClone(value); }
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function isReservedNode(id) { return RESERVED_NODE_IDS.includes(id) || LEGACY_RESERVED_NODE_IDS.includes(id); }
function controllerEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => !isReservedNode(id)); }
function reservedEntries(nodes = {}) { return Object.entries(nodes).filter(([id]) => isReservedNode(id)); }
function isoOr(value, fallback) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return value;
}
function isLegacyAdoptionSuspensionFrame(frame) {
  return isPlainObject(frame) && frame.schema === TRANSITION_SUSPENSION_SCHEMA && frame.disposition === "transition-suspended";
}

function historicalModeMatchesPipeline(mode, pipeline) {
  return legacyProtocolPolicyForMode(mode)?.pipeline === pipeline;
}

function validTransitionIntake(value) {
  return isPlainObject(value) &&
    Object.keys(value).length === TRANSITION_INTAKE_FIELDS.length &&
    TRANSITION_INTAKE_FIELDS.every((field) => typeof value[field] === "string" && value[field].trim().length > 0);
}

function validLegacyAdoptionBinding(value) {
  return hasExactKeys(value, ["observation_sha256", "source_state_sha256", "matrix_sha256"]) &&
    SHA256_RE.test(value.observation_sha256 || "") && SHA256_RE.test(value.source_state_sha256 || "") && SHA256_RE.test(value.matrix_sha256 || "");
}

function validTransitionRecoveryConfirmation(value, record) {
  return hasExactKeys(value, TRANSITION_RECOVERY_CONFIRMATION_KEYS) &&
    value.kind === "user" &&
    value.decision === "no-active-apply" &&
    value.source_execution_id === record.transition_source_execution_id &&
    value.source_version === record.transition_source_version &&
    value.target_version === record.transition_target_version &&
    value.plan_hash === record.transition_plan_hash &&
    SHA256_RE.test(value.journal_sha256 || "") &&
    validIsoTimestamp(value.confirmed_at);
}

function activeLegacyAdoptionRecord(state) {
  if (state?.playbook !== "production-mode-transition" || state?.current_node !== TRANSITION_APPLY_NODE || !state?.execution_id) return null;
  const record = state.nodes?.[TRANSITION_APPLY_NODE];
  if (!isPlainObject(record) || record.status !== "in_progress" || record.execution_id !== state.execution_id || record.run_version !== state.run_version) return null;
  const recordKeys = Object.keys(record);
  if (!TRANSITION_RECORD_KEYS.every((key) => Object.hasOwn(record, key)) ||
    recordKeys.some((key) => !TRANSITION_RECORD_KEYS.includes(key) && key !== "transition_recovery_confirmation")) return null;
  const required = [
    "transition_plan_hash", "transition_candidate_receipt_sha256", "transition_target_intake_sha256",
  ];
  if (!required.every((key) => SHA256_RE.test(record[key] || ""))) return null;
  if (record.transition_kind !== LEGACY_ADOPTION_KIND || !validLegacyAdoptionBinding(record.transition_adoption)) return null;
  if (!validTransitionIntake(record.transition_target_intake) ||
    sha256(Buffer.from(stableStringify(record.transition_target_intake))) !== record.transition_target_intake_sha256) return null;
  if (!hasExactKeys(record.transition_confirmation, ["kind", "decision", "at"]) ||
    record.transition_confirmation.kind !== "user" ||
    record.transition_confirmation.decision !== "proceed" ||
    !validIsoTimestamp(record.transition_confirmation.at)) return null;
  if (typeof record.transition_source_execution_id !== "string" || !record.transition_source_execution_id ||
    record.transition_source_version !== state.run_version ||
    !historicalModeMatchesPipeline(record.transition_source_mode, record.transition_source_pipeline) ||
    !normalizeRunVersion(record.transition_target_version) ||
    record.transition_target_mode !== TARGET_PRODUCTION_MODE ||
    record.transition_target_pipeline !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE ||
    !TARGET_WORKFLOWS.includes(record.transition_target_workflow)) return null;
  if (!validIsoTimestamp(record.started)) return null;
  if (Object.hasOwn(record, "transition_recovery_confirmation") &&
    !validTransitionRecoveryConfirmation(record.transition_recovery_confirmation, record)) return null;
  return record;
}

/**
 * State-owned read boundary for the one confirmed historical adoption.
 * Consumers may inspect the exact tuple, but they cannot reinterpret an
 * incomplete target-intake confirmation as permission to publish or recover.
 */
export function inspectActiveLegacyProtocolAdoption(deckDir, { sourceRunVersion, sourceRunDir, purpose = "observe" } = {}) {
  const sourceVersion = selectedRunVersion({ runVersion: sourceRunVersion, runDir: sourceRunDir });
  if (!sourceVersion) return Object.freeze({ ok: false, code: "TRANSITION_SOURCE_VERSION_INVALID" });
  const state = readLegacyAdoptionState(deckDir, { purpose, sourceRunVersion: sourceVersion });
  if (state?.replacement_required || state?.execution_run_version_mismatch) {
    return Object.freeze({ ok: false, code: "TRANSITION_STATE_UNAVAILABLE" });
  }
  const record = activeLegacyAdoptionRecord(state);
  if (!record) return Object.freeze({ ok: false, code: "TRANSITION_CHECKPOINT_DRIFT" });
  return Object.freeze({ ok: true, source_version: sourceVersion, state, record: Object.freeze(structuredClone(record)) });
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

function legacyAdoptionSuspensionErrors(state, frame, index) {
  const label = `playbook_stack[${index}]`;
  const keys = [
    "schema", "disposition", "playbook", "current_node", "execution_id", "execution_started_at", "run_version", "controller_nodes",
    "source_run_version", "source_mode", "source_pipeline", "target_run_version", "target_mode", "target_pipeline", "target_workflow", "transition_kind", "transition_plan_hash", "parent_stack",
  ];
  const errors = [];
  if (!Object.keys(frame).every((key) => keys.includes(key)) || !keys.every((key) => Object.hasOwn(frame, key))) {
    errors.push(`${label} has invalid transition suspension keys`);
  }
  if (frame.schema !== TRANSITION_SUSPENSION_SCHEMA || frame.disposition !== "transition-suspended") errors.push(`${label} is not a closed transition suspension`);
  errors.push(...ordinaryFrameBindingErrors(frame, label));
  if (frame.source_run_version !== frame.run_version || !normalizeRunVersion(frame.source_run_version)) errors.push(`${label} source run_version mismatch`);
  if (!historicalModeMatchesPipeline(frame.source_mode, frame.source_pipeline)) errors.push(`${label} source mode/pipeline mismatch`);
  if (!normalizeRunVersion(frame.target_run_version) || frame.target_mode !== TARGET_PRODUCTION_MODE ||
    frame.target_pipeline !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE || !TARGET_WORKFLOWS.includes(frame.target_workflow)) {
    errors.push(`${label} target mode/pipeline/workflow mismatch`);
  }
  if (frame.transition_kind !== LEGACY_ADOPTION_KIND) errors.push(`${label} transition kind is invalid`);
  if (frame.source_run_version === frame.target_run_version || frame.source_pipeline === frame.target_pipeline) errors.push(`${label} is not cross-pipeline`);
  if (!SHA256_RE.test(frame.transition_plan_hash || "")) errors.push(`${label} transition plan hash is invalid`);
  if (!Array.isArray(frame.parent_stack) || frame.parent_stack.some(isLegacyAdoptionSuspensionFrame)) errors.push(`${label} has invalid suspended parent stack`);
  else frame.parent_stack.forEach((parent, parentIndex) => errors.push(...ordinaryFrameBindingErrors(parent, `${label}.parent_stack[${parentIndex}]`)));
  const sourceMode = state?.production_mode?.by_version?.[canonicalVersionKey(frame.source_run_version)]?.mode;
  if (sourceMode !== frame.source_mode) errors.push(`${label} source mode disagrees with authoritative state`);
  const apply = activeLegacyAdoptionRecord(state);
  if (!apply || apply.transition_source_execution_id !== frame.execution_id || apply.transition_source_version !== frame.source_run_version ||
    apply.transition_target_version !== frame.target_run_version || apply.transition_kind !== frame.transition_kind || apply.transition_plan_hash !== frame.transition_plan_hash) {
    errors.push(`${label} does not match the active transition record`);
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
  if (!Array.isArray(state?.playbook_stack)) return errors;
  const suspensions = state.playbook_stack.filter(isLegacyAdoptionSuspensionFrame);
  if (suspensions.length > 0 && (suspensions.length !== 1 || state.playbook_stack.length !== 1)) errors.push("transition suspension must be the only stack frame");
  for (const [index, frame] of state.playbook_stack.entries()) {
    if (isLegacyAdoptionSuspensionFrame(frame)) errors.push(...legacyAdoptionSuspensionErrors(state, frame, index));
    else errors.push(...ordinaryFrameBindingErrors(frame, `playbook_stack[${index}]`));
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

export function normalizePlaybookStack(state, migrationTime = nowIso()) {
  if (!isPlainObject(state)) return state;
  if (!Array.isArray(state.playbook_stack)) {
    state.playbook_stack = [];
    return state;
  }
  state.playbook_stack = state.playbook_stack
    .filter(isPlainObject)
    .map((entry, index) => {
      // A transition suspension is schema-closed and non-resumable. Preserve
      // its bytes for the validator and state-owned terminal operations; do
      // not coerce it into an ordinary parent frame during a read/heal cycle.
      if (isLegacyAdoptionSuspensionFrame(entry)) return deepClone(entry);
      const legacySnapshot = !isPlainObject(entry.controller_nodes);
      const runVersion = normalizeRunVersion(entry.run_version);
      const normalized = {
        playbook: entry.playbook == null ? "" : String(entry.playbook),
        current_node: entry.current_node == null ? "" : String(entry.current_node),
        execution_id: typeof entry.execution_id === "string" && entry.execution_id ? entry.execution_id : newExecutionId(),
        execution_started_at: isoOr(entry.execution_started_at, migrationTime),
        run_version: runVersion || "",
        controller_nodes: legacySnapshot ? {} : deepClone(entry.controller_nodes),
      };
      // Keep an already-persisted diagnostic stable across an observation/heal
      // round trip. In particular, do not replace the original reason a legacy
      // frame was rejected merely because its normalized snapshot is now empty.
      if (entry.diagnostic != null) normalized.diagnostic = String(entry.diagnostic);
      else if (legacySnapshot) normalized.diagnostic = `legacy stack entry ${index} had no recoverable controller snapshot`;
      else if (!runVersion) normalized.diagnostic = `legacy stack entry ${index} had no provable run_version`;
      for (const rec of Object.values(normalized.controller_nodes)) {
        if (isPlainObject(rec)) {
          rec.execution_id = normalized.execution_id;
          if (runVersion) rec.run_version = runVersion;
        }
      }
      return normalized;
    });
  return state;
}

/** Historical state is not promotable. Reads validate the durable schema-5
 * bytes; only an owning execution path may make a current repair. */
export function healState(raw) {
  return { state: isPlainObject(raw) ? deepClone(raw) : raw, dirty: false };
}

export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }

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
  if (state?.playbook === "production-mode-transition" || state?.playbook_stack?.some(isLegacyAdoptionSuspensionFrame)) return true;
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
  const mode = inspectProductionMode({ state: candidate, runVersion, sourceMarker });
  if (!mode.ok) return null;
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

function readProductionModeMirror(deckDir) {
  const path = join(deckDir, "project-metadata.yaml");
  if (!existsSync(path)) return null;
  try {
    const value = parseDocument(readFileSync(path, "utf8"), YAML_PARSE_OPTS).toJS({ mapAsMap: false });
    return isPlainObject(value) ? value : null;
  } catch { return null; }
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

function metadataMirrorDrift(mirror, runVersion, authoritativeMode) {
  if (!mirror) return null;
  const mirroredMode = mirror.production_mode;
  const mirroredVersion = mirror.production_mode_run_version;
  if (mirroredMode === undefined && mirroredVersion === undefined) return null;
  if (mirroredVersion === runVersion) {
    return mirroredMode === authoritativeMode
      ? null
      : Object.freeze({ kind: "mode-mismatch", run_version: runVersion, expected: authoritativeMode, mirrored: mirroredMode ?? null });
  }
  return Object.freeze({ kind: "version-mismatch", run_version: runVersion, mirrored_version: mirroredVersion ?? null });
}

/**
 * State-owned exact-run production-mode inspection. Combines canonical state
 * with the exact version's source marker (via the pure policy module) and
 * reports typed metadata-mirror drift plus state-pipeline drift. This is pure
 * observation: it short-circuits on missing/invalid/inconsistent authority
 * BEFORE any generated/provider check, never mutates state/source/metadata, and
 * never falls back to metadata or generated artifacts.
 */
export function inspectRunProductionMode(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });
  const state = readState(deckDir, { purpose, heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) {
    return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", run_version: exactVersion, state });
  }
  if (state?.execution_run_version_mismatch) return Object.freeze({ ok: false, ...state, run_version: exactVersion });
  const sourceMarker = probeSourceMarkerForVersion(deckDir, exactVersion);
  if (sourceMarker.ok === false) {
    return Object.freeze({ ok: false, code: sourceMarker.code, run_version: exactVersion, marker: sourceMarker });
  }
  const inspection = inspectProductionMode({ state, runVersion: exactVersion, sourceMarker });
  if (!inspection.ok) return Object.freeze({ ...inspection, run_version: exactVersion });
  const mirror = readProductionModeMirror(deckDir);
  const drift = metadataMirrorDrift(mirror, exactVersion, inspection.mode);
  const derivedPipeline = inspection.policy.pipeline;
  const stateDrift = typeof state.pipeline === "string" && state.pipeline && state.pipeline !== derivedPipeline
    ? Object.freeze({ kind: "pipeline-projection", expected: derivedPipeline, actual: state.pipeline })
    : null;
  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    version_key: inspection.version_key,
    mode: inspection.mode,
    ...(inspection.workflow ? { workflow: inspection.workflow } : {}),
    policy: inspection.policy,
    source_branch: inspection.source_branch,
    source_pipeline: inspection.source_pipeline,
    consistent: true,
    metadata_mirror: Object.freeze({ present: Boolean(mirror), drift }),
    state_drift: stateDrift,
  });
}

/**
 * Resolve the one adapter allowed to handle an exact run version. This is the
 * public routing boundary for root orchestration and direct multi-pipeline
 * executables: durable runs must have an authoritative production-mode record
 * that agrees with the source marker before any adapter, readiness, provider,
 * or generated-artifact work begins.
 *
 * Every supported run has an explicit source marker and an authoritative mode.
 */
export function resolveRunProductionAdapter(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });

  const inspection = inspectRunProductionMode(deckDir, {
    runVersion: exactVersion,
    purpose,
  });
  if (inspection.ok && ["page-authority-image2", "page-authority-image2-v2"].includes(inspection.policy.adapter)) {
    return Object.freeze({
      ok: true,
      run_version: exactVersion,
      mode: inspection.mode,
      policy: inspection.policy,
      adapter: inspection.policy.adapter,
      ...(inspection.workflow ? { workflow: inspection.workflow } : {}),
      inspection,
    });
  }

  if (inspection.ok) {
    return Object.freeze({
      ok: false,
      code: "LEGACY_PROTOCOL_ADOPTION_REQUIRED",
      run_version: exactVersion,
      mode: inspection.mode,
      policy: inspection.policy,
    });
  }

  return Object.freeze({ ok: false, ...inspection });
}

/**
 * Register a clean Page Authority structural publication. This current-only
 * helper is deliberately not a production-mode converter: historical runs use
 * the separate observer/adoption transaction.
 */
export function registerPageAuthorityVersionPublication(deckDir, { sourceRunVersion, sourceRunDir, targetRunVersion, targetRunDir, expectedStateSha = null } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion ?? sourceRunDir);
  const targetVersion = normalizeRunVersion(targetRunVersion ?? targetRunDir);
  if (!sourceVersion || !targetVersion) throw new TypeError("source and target run versions must be canonical vN");
  if (sourceVersion === targetVersion) throw new TypeError("source and target versions must differ");
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: Page Authority publication state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: sourceVersion });
  if (executionMismatch) return Object.freeze({ ok: false, ...executionMismatch });
  const sourceKey = canonicalVersionKey(sourceVersion);
  const targetKey = canonicalVersionKey(targetVersion);
  const byVersion = isPlainObject(state.production_mode?.by_version) ? state.production_mode.by_version : null;
  const sourceRecord = byVersion?.[sourceKey];
  const sourceMode = isProductionModeRecord(sourceRecord) ? sourceRecord.mode : null;
  if (sourceMode !== "image2-page-authority") return Object.freeze({ ok: false, code: "SOURCE_MODE_MISSING", source_version: sourceVersion });
  const policy = productionPolicyForMode(sourceMode);
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  if (targetMarker.ok === false) return Object.freeze({ ok: false, code: "TARGET_MARKER_UNAVAILABLE", target_version: targetVersion, marker: targetMarker });
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!targetPipeline.ok || targetPipeline.pipeline !== PAGE_AUTHORITY_IMAGE2_PIPELINE || targetPipeline.pipeline !== policy.pipeline) {
    return Object.freeze({ ok: false, code: "PAGE_AUTHORITY_PIPELINE_MISMATCH", source_mode: sourceMode, derived_pipeline: policy.pipeline, target_pipeline: targetPipeline.ok ? targetPipeline.pipeline : null });
  }
  const existingTarget = byVersion?.[targetKey];
  if (isProductionModeRecord(existingTarget)) {
    if (existingTarget.mode === sourceMode && state.continuation_target_version === targetVersion) {
      return Object.freeze({ ok: true, status: "already-current", target_version: targetVersion, mode: sourceMode });
    }
    if (existingTarget.mode !== sourceMode) {
      return Object.freeze({ ok: false, code: "TARGET_PAGE_AUTHORITY_CONFLICT", target_version: targetVersion, existing: existingTarget.mode, expected: sourceMode });
    }
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  ensureProductionModeContainer(next);
  if (!existingTarget) next.production_mode.by_version[targetKey] = initialProductionModeRecord(sourceMode);
  // This publication owner is the only same-pipeline version creator. The
  // target directory and canonical source were verified above, so bind the
  // inactive continuation selector in the same CAS-protected state commit.
  next.continuation_target_version = targetVersion;
  writeState(deckDir, next, { expectedStateSha, updatedAt: nowIso() });
  appendHistory(deckDir, { type: "page_authority_version_publication", run_version: targetVersion, mode: sourceMode, source_version: sourceVersion, at: nowIso() });
  return Object.freeze({ ok: true, status: existingTarget ? "already-current" : "registered", target_version: targetVersion, source_version: sourceVersion, mode: sourceMode });
}

export const PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_SCHEMA = "pptmaker-page-authority-raw-provider-authorization-v1";
export const PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_V2_SCHEMA = "pptmaker-page-authority-raw-provider-authorization-v2";
export const PAGE_AUTHORITY_DELIVERY_REVIEW_SCHEMA = "pptmaker-page-authority-delivery-review-v1";
export const PAGE_AUTHORITY_TARGET_STATE_SCHEMA = "page-authority-image2-target-state-v1";
const PAGE_AUTHORITY_FINAL_REVIEW_NODE = "checkpoint-page-authority-delivery-review";
const PAGE_AUTHORITY_DELIVERY_EVIDENCE_FIELDS = Object.freeze([
  "source_sha256",
  "source_receipt_sha256",
  "raw_manifest_sha256",
  "raw_review_projection_sha256",
  "raw_review_coverage_sha256",
  "final_manifest_sha256",
  "final_projection_sha256",
  "assembly_receipt_sha256",
  "pptx_sha256",
  "notes_receipt_sha256",
]);

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function validPageAuthorityRawScope(scope, profileDigest) {
  if (!Array.isArray(scope) || scope.length === 0) return false;
  let previous = null;
  for (const item of scope) {
    if (!hasExactKeys(item, ["slide_id", "raw_image_contract_digest", "raw_generation_profile_digest"]) ||
      typeof item.slide_id !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(item.slide_id) ||
      !SHA256_RE.test(item.raw_image_contract_digest || "") ||
      item.raw_generation_profile_digest !== profileDigest) return false;
    if (previous !== null && previous >= item.slide_id) return false;
    previous = item.slide_id;
  }
  return true;
}

function validPageAuthorityRawAuthorizationRecord(record, runVersion) {
  if (record?.schema === PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_V2_SCHEMA) {
    const keys = ["schema", "run_version", "source_epoch", "source_receipt_sha256", "workflow", "raw_work_plan_sha256", "provider_profile_sha256", "authorization_scope_sha256", "max_submissions", "execution_id", "decided_at"];
    return hasExactKeys(record, keys) &&
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
  const keys = ["schema", "run_version", "source_epoch", "raw_generation_profile_digest", "scope", "max_submissions", "execution_id", "decided_at"];
  return hasExactKeys(record, keys) &&
    record.schema === PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_SCHEMA &&
    record.run_version === runVersion &&
    Number.isInteger(record.source_epoch) && record.source_epoch > 0 &&
    SHA256_RE.test(record.raw_generation_profile_digest || "") &&
    validPageAuthorityRawScope(record.scope, record.raw_generation_profile_digest) &&
    Number.isInteger(record.max_submissions) && record.max_submissions > 0 &&
    typeof record.execution_id === "string" && record.execution_id.length > 0 &&
    validIsoTimestamp(record.decided_at);
}

function validPageAuthorityDeliveryReviewRecord(record, runVersion) {
  const keys = [
    "schema",
    "run_version",
    "source_epoch",
    ...PAGE_AUTHORITY_DELIVERY_EVIDENCE_FIELDS,
    "decision",
    "reason",
    "execution_id",
    "decided_at",
  ];
  if (!hasExactKeys(record, keys) || record.schema !== PAGE_AUTHORITY_DELIVERY_REVIEW_SCHEMA || record.run_version !== runVersion ||
    !Number.isInteger(record.source_epoch) || record.source_epoch <= 0 ||
    !["proceed", "repair", "redirect"].includes(record.decision) ||
    typeof record.execution_id !== "string" || !record.execution_id || !validIsoTimestamp(record.decided_at)) return false;
  if (!PAGE_AUTHORITY_DELIVERY_EVIDENCE_FIELDS.every((field) => SHA256_RE.test(record[field] || ""))) return false;
  if (record.decision === "proceed") return record.reason === null;
  return typeof record.reason === "string" && record.reason.trim().length > 0 && record.reason === record.reason.trim();
}

function validatePageAuthorityRawAuthorizationStructure(state, errors) {
  const map = state.page_authority_raw_provider_authorization;
  if (map === undefined) return;
  if (!isPlainObject(map) || !isPlainObject(map.by_version)) {
    errors.push("page_authority_raw_provider_authorization must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      errors.push(`invalid page_authority_raw_provider_authorization version key ${key}`);
    } else if (!validPageAuthorityRawAuthorizationRecord(record, runVersion)) {
      errors.push(`invalid page_authority_raw_provider_authorization record ${key}`);
    }
  }
}

function validatePageAuthorityDeliveryReviewStructure(state, errors) {
  const map = state.page_authority_delivery_review;
  if (map === undefined) return;
  if (!isPlainObject(map) || !isPlainObject(map.by_version)) {
    errors.push("page_authority_delivery_review must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      errors.push(`invalid page_authority_delivery_review version key ${key}`);
    } else if (!validPageAuthorityDeliveryReviewRecord(record, runVersion)) {
      errors.push(`invalid page_authority_delivery_review record ${key}`);
    }
  }
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
    record.schema === PAGE_AUTHORITY_TARGET_STATE_SCHEMA &&
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
  const map = state.page_authority_target_evidence;
  if (map === undefined) return;
  if (!isPlainObject(map) || !isPlainObject(map.by_version)) {
    errors.push("page_authority_target_evidence must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(map.by_version)) {
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) errors.push(`invalid page_authority_target_evidence version key ${key}`);
    else if (!validTargetEvidenceRecord(record, runVersion)) errors.push(`invalid page_authority_target_evidence record ${key}`);
  }
}

function ensureTargetEvidenceContainer(state) {
  if (!isPlainObject(state.page_authority_target_evidence) || !isPlainObject(state.page_authority_target_evidence.by_version)) {
    state.page_authority_target_evidence = { by_version: {} };
  }
}

function targetEvidenceRecord(state, runVersion) {
  return state?.page_authority_target_evidence?.by_version?.[canonicalVersionKey(runVersion)] || null;
}

function targetSourceFacts(receipt) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" || receipt.pipeline !== "page-authority-image2-v2" ||
    !SHA256_RE.test(receipt.source_sha256 || "") || !["framed", "pure"].includes(receipt.workflow) ||
    !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new Error("TARGET_SOURCE_RECEIPT_INVALID");
  }
  const slideIds = receipt.slides.map((slide) => slide?.slide_id);
  if (receipt.slides.some((slide) => slide?.workflow !== receipt.workflow || typeof slide.slide_id !== "string" || !slide.slide_id) ||
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
  if (marker.branch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) throw new Error("TARGET_SOURCE_MARKER_INVALID");
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

function targetEvidenceContext(deckDir, { runVersion, runDir, purpose = "execute" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose });
  if (!inspection.ok) throw new Error(inspection.code || "TARGET_STATE_UNAVAILABLE");
  if (inspection.mode !== "image2-page-authority-v2" || !["framed", "pure"].includes(inspection.workflow)) {
    throw new Error("TARGET_MODE_REQUIRED");
  }
  const state = readState(deckDir, { purpose, heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  const modeRecord = state.production_mode?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!isProductionModeRecord(modeRecord) || modeRecord.mode !== "image2-page-authority-v2") throw new Error("PAGE_AUTHORITY_STATE_INVALID");
  return Object.freeze({ exactVersion, inspection, state, modeRecord, record: targetEvidenceRecord(state, exactVersion) });
}

function targetEvidenceFailure(code, nextAction) {
  return Object.freeze({ ok: false, kind: "hard-stop", code, next_action: nextAction });
}

/** Bind an exact parsed target source receipt to the existing state owner. */
export function initializeTargetPageAuthorityState(deckDir, { runVersion, runDir, sourceReceipt, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new Error("RUN_VERSION_INVALID");
  const source = targetSourceFacts(sourceReceipt);
  const { marker } = assertTargetSourceReceiptMatchesCanonicalBytes(deckDir, exactVersion, source);

  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  if (state?.execution_run_version_mismatch) throw new Error("TARGET_SOURCE_EXECUTION_MISMATCH");
  const versionKey = canonicalVersionKey(exactVersion);
  const existingMode = state.production_mode?.by_version?.[versionKey];
  if (existingMode) {
    const inspection = inspectProductionMode({ state, runVersion: exactVersion, sourceMarker: marker });
    if (!inspection.ok) throw new Error(inspection.code || "TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    if (!isProductionModeRecord(existingMode) || existingMode.mode !== TARGET_PRODUCTION_MODE) {
      throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    }
    if (existingMode.workflow !== source.workflow) throw new Error("TARGET_SOURCE_STATE_WORKFLOW_MISMATCH");
  } else if (state.pipeline !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    // A missing record is legal only for the v2 draft seeded by fresh init.
    throw new Error("TARGET_SOURCE_STATE_DRAFT_REQUIRED");
  }

  const existing = targetEvidenceRecord(state, exactVersion);
  if (existing) {
    const sourceEpoch = existingMode?.source_epoch ?? 1;
    if (!validTargetEvidenceRecord(existing, exactVersion) ||
      existing.source_epoch !== sourceEpoch ||
      existing.source_receipt_sha256 !== source.source_receipt_sha256 ||
      existing.workflow !== source.workflow) {
      throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    }
    return Object.freeze({ ok: true, status: "already-current", run_version: exactVersion, record: Object.freeze(structuredClone(existing)) });
  }
  const record = {
    schema: PAGE_AUTHORITY_TARGET_STATE_SCHEMA,
    run_version: exactVersion,
    source_epoch: existingMode?.source_epoch ?? 1,
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
  next.schema_version = STATE_SCHEMA_VERSION;
  if (!existingMode) {
    ensureProductionModeContainer(next);
    next.production_mode.by_version[versionKey] = initialProductionModeRecord(TARGET_PRODUCTION_MODE, source.workflow);
  }
  ensureTargetEvidenceContainer(next);
  next.page_authority_target_evidence.by_version[versionKey] = record;
  writeState(deckDir, next, { expectedStateSha, updatedAt: nowIso() });
  appendHistory(deckDir, { type: "page_authority_target_state_initialized", run_version: exactVersion, source_epoch: record.source_epoch, at: nowIso() });
  return Object.freeze({ ok: true, status: "initialized", run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Start a fresh target raw-evidence epoch after a selected workflow has
 * classified a same-workflow source change as raw-generation debt. This state
 * owner deliberately validates identity and lineage only; Framed/Pure semantic
 * classification remains with the selected adapter.
 */
export function advanceTargetPageAuthoritySourceEpoch(deckDir, {
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
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  if (state?.execution_run_version_mismatch) throw new Error("TARGET_SOURCE_EXECUTION_MISMATCH");
  const versionKey = canonicalVersionKey(exactVersion);
  const modeRecord = state.production_mode?.by_version?.[versionKey];
  const inspection = inspectProductionMode({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionModeRecord(modeRecord) || modeRecord.mode !== TARGET_PRODUCTION_MODE ||
    modeRecord.workflow !== source.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const previous = targetEvidenceRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(previous, exactVersion) || previous.source_epoch !== modeRecord.source_epoch ||
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
  next.schema_version = STATE_SCHEMA_VERSION;
  const sourceEpoch = previous.source_epoch + 1;
  next.production_mode.by_version[versionKey] = {
    mode: TARGET_PRODUCTION_MODE,
    workflow: source.workflow,
    source_epoch: sourceEpoch,
  };
  ensureTargetEvidenceContainer(next);
  next.page_authority_target_evidence.by_version[versionKey] = {
    schema: PAGE_AUTHORITY_TARGET_STATE_SCHEMA,
    run_version: exactVersion,
    source_epoch: sourceEpoch,
    source_receipt_sha256: source.source_receipt_sha256,
    workflow: source.workflow,
    provider_authorization_sha256: null,
    accepted_raw_evidence_sha256: null,
    final_manifest_sha256: null,
    delivery_receipt_sha256: null,
  };
  if (isPlainObject(next.page_authority_raw_provider_authorization?.by_version)) {
    delete next.page_authority_raw_provider_authorization.by_version[versionKey];
  }
  if (isPlainObject(next.page_authority_delivery_review?.by_version)) {
    delete next.page_authority_delivery_review.by_version[versionKey];
  }
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_authority_target_source_epoch_advanced",
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
    record: Object.freeze(structuredClone(next.page_authority_target_evidence.by_version[versionKey])),
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
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  if (state?.execution_run_version_mismatch) throw new Error("TARGET_SOURCE_EXECUTION_MISMATCH");
  const versionKey = canonicalVersionKey(exactVersion);
  const modeRecord = state.production_mode?.by_version?.[versionKey];
  const inspection = inspectProductionMode({ state, runVersion: exactVersion, sourceMarker: marker });
  if (!inspection.ok || !isProductionModeRecord(modeRecord) || modeRecord.mode !== TARGET_PRODUCTION_MODE ||
    modeRecord.workflow !== facts.nextSource.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const existing = targetEvidenceRecord(state, exactVersion);
  if (!validTargetEvidenceRecord(existing, exactVersion) ||
    existing.source_epoch !== modeRecord.source_epoch ||
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
  const authorization = state.page_authority_raw_provider_authorization?.by_version?.[versionKey];
  if (!validPageAuthorityRawAuthorizationRecord(authorization, exactVersion) ||
    authorization.schema !== PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_V2_SCHEMA ||
    targetEvidenceDigest(authorization) !== existing.provider_authorization_sha256 ||
    authorization.source_epoch !== existing.source_epoch ||
    authorization.workflow !== facts.previousSource.workflow ||
    authorization.provider_profile_sha256 !== previousRawWorkPlan.provider_profile_sha256) {
    throw new Error("TARGET_LOCAL_COMPOSE_AUTHORIZATION_STALE");
  }

  return Object.freeze({
    ok: true,
    run_version: exactVersion,
    facts,
    state: Object.freeze(structuredClone(state)),
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
  next.schema_version = STATE_SCHEMA_VERSION;
  const record = next.page_authority_target_evidence.by_version[versionKey];
  record.source_receipt_sha256 = facts.nextSource.source_receipt_sha256;
  record.accepted_raw_evidence_sha256 = facts.nextEvidence.sha256;
  record.final_manifest_sha256 = null;
  record.delivery_receipt_sha256 = null;
  if (!validTargetEvidenceRecord(record, exactVersion)) throw new Error("TARGET_STATE_RECORD_INVALID");
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha: args.expectedStateSha ?? null, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_authority_target_local_compose_rebound",
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
 * Register one already-published v2 structural target with fresh evidence.
 * The source version remains an observation input only: no authorization,
 * review, final, delivery, or active-execution state crosses this boundary.
 */
export function registerTargetPageAuthorityStructuralPublication(deckDir, {
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

  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("STATE_UNAVAILABLE");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: sourceVersion });
  if (executionMismatch) throw new Error("TARGET_STRUCTURAL_SOURCE_EXECUTION_MISMATCH");
  const sourceKey = canonicalVersionKey(sourceVersion);
  const targetKey = canonicalVersionKey(targetVersion);
  const sourceMode = state.production_mode?.by_version?.[sourceKey];
  if (!isProductionModeRecord(sourceMode)) throw new Error("TARGET_STRUCTURAL_SOURCE_MODE_MISSING");
  const sourceMarker = probeSourceMarkerForVersion(deckDir, sourceVersion);
  const sourceInspection = inspectProductionMode({ state, runVersion: sourceVersion, sourceMarker });
  if (!sourceInspection.ok) throw new Error("TARGET_STRUCTURAL_SOURCE_IDENTITY_MISMATCH");
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!targetPipeline.ok || targetPipeline.pipeline !== "page-authority-image2-v2" || targetPipeline.workflow !== targetSource.workflow) {
    throw new Error("TARGET_STRUCTURAL_TARGET_IDENTITY_MISMATCH");
  }

  const existingMode = state.production_mode?.by_version?.[targetKey];
  if (existingMode && (!isProductionModeRecord(existingMode) || existingMode.mode !== "image2-page-authority-v2" || existingMode.workflow !== targetSource.workflow)) {
    throw new Error("TARGET_STRUCTURAL_TARGET_MODE_CONFLICT");
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
  next.schema_version = STATE_SCHEMA_VERSION;
  ensureProductionModeContainer(next);
  ensureTargetEvidenceContainer(next);
  if (!existingMode) {
    next.production_mode.by_version[targetKey] = initialProductionModeRecord("image2-page-authority-v2", targetSource.workflow);
  }
  if (!existingEvidence) {
    next.page_authority_target_evidence.by_version[targetKey] = {
      schema: PAGE_AUTHORITY_TARGET_STATE_SCHEMA,
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
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_authority_target_structural_publication",
    source_version: sourceVersion,
    target_version: targetVersion,
    workflow: targetSource.workflow,
    plan_hash: planHash,
    source_epoch: 1,
    at,
  });
  return Object.freeze({
    ok: true,
    status: existingMode && existingEvidence ? "already-current" : "registered",
    source_version: sourceVersion,
    target_version: targetVersion,
    workflow: targetSource.workflow,
    source_epoch: 1,
  });
}

function mutateTargetEvidenceRecord(deckDir, { runVersion, runDir, expectedStateSha = null, mutate } = {}) {
  const context = targetEvidenceContext(deckDir, { runVersion, runDir, purpose: "execute" });
  if (!validTargetEvidenceRecord(context.record, context.exactVersion)) throw new Error("TARGET_STATE_INITIALIZATION_REQUIRED");
  if (context.record.source_epoch !== context.modeRecord.source_epoch || context.record.workflow !== context.inspection.workflow) {
    throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
  }
  const next = structuredClone(context.state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  const record = next.page_authority_target_evidence.by_version[canonicalVersionKey(context.exactVersion)];
  mutate(record, context);
  if (!validTargetEvidenceRecord(record, context.exactVersion)) throw new Error("TARGET_STATE_RECORD_INVALID");
  writeState(deckDir, next, { expectedStateSha, updatedAt: nowIso() });
  return Object.freeze({ run_version: context.exactVersion, record: Object.freeze(structuredClone(record)) });
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
  if (!deliveryReceipt || deliveryReceipt.schema !== "page-authority-delivery-receipt-v2" ||
    !SHA256_RE.test(deliveryReceipt.final_manifest_sha256 || "") || !Number.isInteger(deliveryReceipt.source_epoch) || deliveryReceipt.source_epoch <= 0) {
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
export function inspectTargetPageAuthorityState(deckDir, { runVersion, runDir, sourceReceipt = null } = {}) {
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
  if (record.source_epoch !== context.modeRecord.source_epoch || record.workflow !== context.inspection.workflow) {
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

function pageAuthorityAuthorizationScopeFromBatch(rawBatch) {
  if (!rawBatch || typeof rawBatch !== "object" || Array.isArray(rawBatch) ||
    rawBatch.schema !== "pptmaker-page-authority-raw-batch-v1" ||
    !SHA256_RE.test(rawBatch.raw_generation_profile_digest || "") ||
    !Array.isArray(rawBatch.requests) || rawBatch.requests.length === 0) return null;
  const scope = rawBatch.requests.map((request) => ({
    slide_id: request?.slide_id,
    raw_image_contract_digest: request?.raw_image_contract_digest,
    raw_generation_profile_digest: request?.raw_generation_profile_digest,
  })).sort((left, right) => String(left.slide_id).localeCompare(String(right.slide_id)));
  if (!validPageAuthorityRawScope(scope, rawBatch.raw_generation_profile_digest)) return null;
  return scope;
}

function pageAuthorityAuthorizationScopeFromRawWorkPlan(rawWorkPlan) {
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
 * Record the sole Page Authority raw-submit decision. The source epoch is
 * always derived from authoritative state; callers cannot choose or advance it.
 */
export function recordPageAuthorityRawProviderAuthorization(deckDir, { runVersion, runDir, rawBatch = null, rawWorkPlan = null, maxSubmissions, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  if (rawBatch && rawWorkPlan) throw new TypeError("rawBatch and rawWorkPlan are mutually exclusive");
  const scope = pageAuthorityAuthorizationScopeFromBatch(rawBatch);
  const targetPlan = pageAuthorityAuthorizationScopeFromRawWorkPlan(rawWorkPlan);
  if (!scope && !targetPlan) throw new TypeError("rawBatch or rawWorkPlan must be a non-empty canonical Page Authority raw input");
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) throw new TypeError("maxSubmissions must be a positive integer");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`Page Authority authorization unavailable: ${inspection.code}`);
  if (scope && inspection.mode !== "image2-page-authority") throw new Error("Page Authority raw authorization is only available for image2-page-authority");
  if (targetPlan && (inspection.mode !== "image2-page-authority-v2" || inspection.workflow !== targetPlan.workflow)) {
    throw new Error("Page Authority target raw authorization requires the exact v2 workflow pair");
  }
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: Page Authority authorization state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: exactVersion });
  if (executionMismatch) throw new Error(`execution_run_version_mismatch: active=${executionMismatch.active_run_version || "none"} requested=${exactVersion}`);
  const sourceEpoch = state.production_mode?.by_version?.[canonicalVersionKey(exactVersion)]?.source_epoch;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("PAGE_AUTHORITY_STATE_INVALID: authoritative source_epoch is unavailable");
  const record = targetPlan
    ? {
      schema: PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_V2_SCHEMA,
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
    }
    : {
      schema: PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_SCHEMA,
      run_version: exactVersion,
      source_epoch: sourceEpoch,
      raw_generation_profile_digest: rawBatch.raw_generation_profile_digest,
      scope,
      max_submissions: maxSubmissions,
      execution_id: state.execution_id,
      decided_at: nowIso(),
    };
  if (!validPageAuthorityRawAuthorizationRecord(record, exactVersion)) throw new Error("derived Page Authority authorization record is invalid");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  if (!isPlainObject(next.page_authority_raw_provider_authorization) || !isPlainObject(next.page_authority_raw_provider_authorization.by_version)) {
    next.page_authority_raw_provider_authorization = { by_version: {} };
  }
  next.page_authority_raw_provider_authorization.by_version[canonicalVersionKey(exactVersion)] = record;
  if (targetPlan) {
    const targetEvidence = targetEvidenceRecord(next, exactVersion);
    if (!validTargetEvidenceRecord(targetEvidence, exactVersion)) {
      throw new Error("TARGET_STATE_INITIALIZATION_REQUIRED");
    }
    if (targetEvidence.source_epoch !== sourceEpoch ||
      targetEvidence.source_receipt_sha256 !== record.source_receipt_sha256 ||
      targetEvidence.workflow !== record.workflow) {
      throw new Error("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
    }
    targetEvidence.provider_authorization_sha256 = targetEvidenceDigest(record);
    targetEvidence.accepted_raw_evidence_sha256 = null;
    targetEvidence.final_manifest_sha256 = null;
    targetEvidence.delivery_receipt_sha256 = null;
  }
  writeState(deckDir, next, { expectedStateSha, updatedAt: record.decided_at });
  appendHistory(deckDir, { type: "page_authority_raw_provider_authorization", run_version: exactVersion, source_epoch: sourceEpoch, at: record.decided_at });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Advance the one authoritative Page Authority source epoch after a caller has
 * proven that source-owned raw semantics changed. Provider profile drift never
 * uses this writer. Old authorization and delivery evidence remain historical
 * facts in history only; they cannot authorize or complete the new epoch.
 */
export function advancePageAuthoritySourceEpoch(deckDir, { runVersion, runDir, expectedSourceEpoch = null, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`Page Authority source epoch is unavailable: ${inspection.code}`);
  if (inspection.mode !== "image2-page-authority") throw new Error("Page Authority source epoch is only available for image2-page-authority");
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: Page Authority source epoch state is unavailable");
  const versionKey = canonicalVersionKey(exactVersion);
  const record = state.production_mode?.by_version?.[versionKey];
  if (!isProductionModeRecord(record) || record.mode !== "image2-page-authority") {
    throw new Error("PAGE_AUTHORITY_STATE_INVALID: authoritative source epoch is unavailable");
  }
  if (expectedSourceEpoch !== null && record.source_epoch !== expectedSourceEpoch) {
    throw new Error("PAGE_AUTHORITY_SOURCE_EPOCH_STALE: obtain a fresh Page Authority raw plan");
  }

  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  const sourceEpoch = record.source_epoch + 1;
  next.production_mode.by_version[versionKey] = { mode: "image2-page-authority", source_epoch: sourceEpoch };
  if (isPlainObject(next.page_authority_raw_provider_authorization?.by_version)) {
    delete next.page_authority_raw_provider_authorization.by_version[versionKey];
  }
  if (isPlainObject(next.page_authority_delivery_review?.by_version)) {
    delete next.page_authority_delivery_review.by_version[versionKey];
  }
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, {
    type: "page_authority_source_epoch_advanced",
    run_version: exactVersion,
    previous_source_epoch: record.source_epoch,
    source_epoch: sourceEpoch,
    at,
  });
  return Object.freeze({ ok: true, run_version: exactVersion, previous_source_epoch: record.source_epoch, source_epoch: sourceEpoch });
}

/** Verify an exact Page Authority raw-submit decision immediately before submit. */
export function inspectPageAuthorityRawProviderAuthorization(deckDir, { runVersion, runDir, rawBatch = null, rawWorkPlan = null, maxSubmissions } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  if (rawBatch && rawWorkPlan) return Object.freeze({ ok: false, code: "AUTHORIZATION_INPUT_AMBIGUOUS", run_version: exactVersion });
  const scope = pageAuthorityAuthorizationScopeFromBatch(rawBatch);
  const targetPlan = pageAuthorityAuthorizationScopeFromRawWorkPlan(rawWorkPlan);
  if (!scope && !targetPlan) return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_INVALID", run_version: exactVersion });
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_INVALID", run_version: exactVersion });
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) return Object.freeze({ ok: false, code: inspection.code, run_version: exactVersion });
  if (scope && inspection.mode !== "image2-page-authority") return Object.freeze({ ok: false, code: "AUTHORIZATION_NOT_APPLICABLE", run_version: exactVersion, mode: inspection.mode });
  if (targetPlan && (inspection.mode !== "image2-page-authority-v2" || inspection.workflow !== targetPlan.workflow)) {
    return Object.freeze({ ok: false, code: "AUTHORIZATION_NOT_APPLICABLE", run_version: exactVersion, mode: inspection.mode });
  }
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", run_version: exactVersion });
  const record = state.page_authority_raw_provider_authorization?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!validPageAuthorityRawAuthorizationRecord(record, exactVersion)) return Object.freeze({ ok: false, code: "AUTHORIZATION_MISSING", run_version: exactVersion });
  const sourceEpoch = state.production_mode?.by_version?.[canonicalVersionKey(exactVersion)]?.source_epoch;
  if (record.source_epoch !== sourceEpoch) return Object.freeze({ ok: false, code: "AUTHORIZATION_SOURCE_EPOCH_STALE", run_version: exactVersion });
  if (record.execution_id !== state.execution_id) return Object.freeze({ ok: false, code: "AUTHORIZATION_EXECUTION_STALE", run_version: exactVersion });
  if (targetPlan) {
    if (record.schema !== PAGE_AUTHORITY_RAW_PROVIDER_AUTHORIZATION_V2_SCHEMA ||
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
  if (record.raw_generation_profile_digest !== rawBatch.raw_generation_profile_digest) return Object.freeze({ ok: false, code: "AUTHORIZATION_PROFILE_MISMATCH", run_version: exactVersion });
  if (stableStringify(record.scope) !== stableStringify(scope)) return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_MISMATCH", run_version: exactVersion });
  if (record.max_submissions < maxSubmissions) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_EXCEEDED", run_version: exactVersion, authorized: record.max_submissions, required: maxSubmissions });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Record the Page Authority delivery decision from exact current derived
 * evidence. The shared evidence reader retains digests, not paths or duplicated
 * generated artifacts.
 */
export async function recordPageAuthorityDeliveryReview(deckDir, { runVersion, runDir, decision, reason = null, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  if (!["proceed", "repair", "redirect"].includes(decision)) throw new TypeError("decision must be proceed, repair, or redirect");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`Page Authority delivery review unavailable: ${inspection.code}`);
  if (inspection.mode !== "image2-page-authority") throw new Error("Page Authority delivery review is only available for image2-page-authority");
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion: exactVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: Page Authority delivery review state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: exactVersion });
  if (executionMismatch) throw new Error(`execution_run_version_mismatch: active=${executionMismatch.active_run_version || "none"} requested=${exactVersion}`);
  if (state.playbook !== "create-deck" || typeof state.execution_id !== "string" || !state.execution_id) {
    throw new Error("active Page Authority create-deck execution is required");
  }
  const sourceEpoch = state.production_mode?.by_version?.[canonicalVersionKey(exactVersion)]?.source_epoch;
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("PAGE_AUTHORITY_STATE_INVALID: authoritative source_epoch is unavailable");
  const evidenceInspection = inspectPageAuthorityDeliveryEvidence(runDir || join(deckDir, "3_versions", exactVersion), { sourceEpoch });
  if (!evidenceInspection.ok) {
    throw new Error(`PAGE_AUTHORITY_DELIVERY_EVIDENCE_${evidenceInspection.code}: ${evidenceInspection.next_action}`);
  }
  const trimmedReason = reason == null ? null : String(reason).trim();
  if (decision === "proceed" && trimmedReason !== null) throw new Error("proceed must not carry a reason");
  if (decision !== "proceed" && !trimmedReason) throw new Error(`${decision} requires a non-empty bounded reason`);
  const record = {
    schema: PAGE_AUTHORITY_DELIVERY_REVIEW_SCHEMA,
    run_version: exactVersion,
    source_epoch: sourceEpoch,
    ...evidenceInspection.evidence,
    decision,
    reason: trimmedReason,
    execution_id: state.execution_id,
    decided_at: nowIso(),
  };
  if (!validPageAuthorityDeliveryReviewRecord(record, exactVersion)) throw new Error("derived Page Authority delivery review record is invalid");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  if (!isPlainObject(next.page_authority_delivery_review) || !isPlainObject(next.page_authority_delivery_review.by_version)) {
    next.page_authority_delivery_review = { by_version: {} };
  }
  next.page_authority_delivery_review.by_version[canonicalVersionKey(exactVersion)] = record;
  const at = record.decided_at;
  next.nodes ||= {};
  next.nodes[PAGE_AUTHORITY_FINAL_REVIEW_NODE] = {
    ...next.nodes[PAGE_AUTHORITY_FINAL_REVIEW_NODE],
    status: "completed",
    execution_id: next.execution_id,
    run_version: exactVersion,
    decision: { value: decision, kind: "user", at },
    page_authority_delivery_review: {
      run_version: exactVersion,
      fingerprint: sha256(stableStringify(record)),
    },
    completed: at,
  };
  next.current_node = PAGE_AUTHORITY_FINAL_REVIEW_NODE;
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, { type: "page_authority_delivery_review", run_version: exactVersion, source_epoch: sourceEpoch, decision, at });
  return Object.freeze({ ok: true, run_version: exactVersion, decision, record: Object.freeze(structuredClone(record)), node: PAGE_AUTHORITY_FINAL_REVIEW_NODE });
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
  if (parsed.value.schema_version !== STATE_SCHEMA_VERSION) {
    return replacementRequired(`unsupported state schema_version ${String(parsed.value.schema_version)}`);
  }
  const version = selectedRunVersion(opts) || normalizeRunVersion(parsed.value.run_version) ||
    (!parsed.value.playbook ? exactContinuationTargetVersion(parsed.value.continuation_target_version) : null);
  let sourceMarker = null;
  if (version) {
    sourceMarker = probeSourceMarkerForVersion(deckDir, version);
    const markerPipeline = sourceMarker.ok === false ? null : pipelineFromSourceMarker(sourceMarker);
    const draftRecord = parsed.value.production_mode?.by_version?.[canonicalVersionKey(version)];
    const targetAuthoringDraft = isTargetWorkflowSelectionPending(sourceMarker) &&
      parsed.value.pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE && draftRecord === undefined;
    if (!markerPipeline?.ok && !targetAuthoringDraft) {
      // An inactive historical fixture may still name one visible run for a
      // locator or observer. This is not a production-state read: the
      // replacement fence remains true and no current adapter can use it.
      const continuation = !parsed.value.playbook
        ? exactContinuationTargetVersion(parsed.value.continuation_target_version)
        : null;
      return Object.freeze({
        ...replacementRequired(`source/state identity is unsupported: ${markerPipeline?.code || sourceMarker.code || "marker unavailable"}`),
        ...(continuation ? { continuation_target_version: continuation } : {}),
      });
    }
    // A valid marker belongs to the source owner. The exact mode/pipeline pair
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
    const repaired = { ...repair.state, durable_state_present: true };
    const mismatch = selectedExecutionMismatch(repaired, opts);
    return markStateRepaired(mismatch ? { ...repaired, ...mismatch } : repaired, repair.repair);
  }
  const mismatch = selectedExecutionMismatch(parsed.value, opts);
  const state = { ...parsed.value, durable_state_present: true };
  return mismatch ? Object.freeze({ ...state, ...mismatch }) : state;
}

/**
 * Read the historical source state only while executing the explicit adoption
 * transaction. Unlike `readState`, this never treats the result as current
 * Page Authority authority, repairs it, or derives a production route.
 */
export function readLegacyAdoptionState(deckDir, { purpose = "observe", sourceRunVersion, sourceRunDir } = {}) {
  if (!["observe", "execute"].includes(purpose)) throw new TypeError("state read purpose must be observe or execute");
  const sourceVersion = selectedRunVersion({ runVersion: sourceRunVersion, runDir: sourceRunDir });
  if (!sourceVersion) return replacementRequired("legacy adoption source version is invalid");
  const path = statePath(deckDir);
  if (!existsSync(path)) return replacementRequired("legacy adoption state is missing");
  let bytes;
  try { bytes = readFileSync(path); } catch { return replacementRequired("legacy adoption state cannot be read"); }
  const parsed = parseStateYaml(bytes.toString("utf8"));
  if (!parsed.ok || parsed.hadErrors || parsed.value.schema_version !== STATE_SCHEMA_VERSION) {
    return replacementRequired("legacy adoption state is not safely parseable");
  }
  const record = parsed.value.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)];
  if (!isHistoricalLegacyProtocolRecord(record)) {
    return replacementRequired("legacy adoption source has no exact historical mode record");
  }
  const state = { ...parsed.value, durable_state_present: true };
  const mismatch = selectedExecutionMismatch(state, { runVersion: sourceVersion });
  return mismatch ? Object.freeze({ ...state, ...mismatch }) : state;
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
  const bindingErrors = executionBindingErrors(state);
  if (bindingErrors.length > 0) throw new Error(`execution_run_version_mismatch: ${bindingErrors[0]}`);
  const continuationTargetError = continuationTargetVisibilityError(state, deckDir);
  if (continuationTargetError) throw new Error(`continuation_target_invalid: ${continuationTargetError}`);
  const prepared = prepareStateWrite(state, { updatedAt: opts.updatedAt || nowIso() });
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
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  state.schema_version = STATE_SCHEMA_VERSION;
  state.updated_at = prepared.persist.updated_at;
  cleanStaleTemps(dir);
}

/**
 * Capture the one confirmed historical-to-Page-Authority adoption. Candidate
 * preparation and preview live outside state; this is the first
 * pointer-changing operation and is fenced by exact source-state bytes and
 * target-authored receipts.
 */
export function confirmLegacyProtocolAdoption(deckDir, {
  sourceRunVersion,
  sourceRunDir,
  targetRunVersion,
  planHash,
  candidateReceiptSha256,
  targetIntake,
  targetIntakeSha256,
  targetWorkflow,
  adoption,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = selectedRunVersion({ runVersion: sourceRunVersion, runDir: sourceRunDir });
  const targetVersion = normalizeRunVersion(targetRunVersion);
  const targetMode = TARGET_PRODUCTION_MODE;
  const targetPipeline = PAGE_AUTHORITY_IMAGE2_V2_PIPELINE;
  if (!sourceVersion || !targetVersion || sourceVersion === targetVersion) throw new TypeError("legacy adoption source and target must be distinct canonical run versions");
  if (!SHA256_RE.test(planHash || "") || !SHA256_RE.test(candidateReceiptSha256 || "") || !validLegacyAdoptionBinding(adoption)) {
    throw new TypeError("legacy adoption plan, candidate receipt, and observer bindings must be exact");
  }
  if (!TARGET_WORKFLOWS.includes(targetWorkflow)) {
    throw new TypeError("legacy adoption target workflow must equal framed | pure");
  }
  if (!validTransitionIntake(targetIntake)) throw new TypeError("legacy adoption target intake must contain every explicit intake field");
  const intakeSha = sha256(Buffer.from(stableStringify(targetIntake)));
  if (!SHA256_RE.test(targetIntakeSha256 || "") || targetIntakeSha256 !== intakeSha) throw new Error("legacy adoption target intake digest is stale or invalid");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");

  const versions = visibleRunVersions(deckDir);
  const expectedTarget = `v${(versions.reduce((highest, version) => Math.max(highest, Number(version.slice(1))), 0) + 1)}`;
  if (targetVersion !== expectedTarget) throw new Error(`legacy adoption target must be anticipated ${expectedTarget}`);
  if (existsSync(join(deckDir, "3_versions", targetVersion))) throw new Error("legacy adoption target version already exists");

  const current = readLegacyAdoptionState(deckDir, { purpose: "execute", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: legacy adoption source state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  if (!current.playbook || !current.execution_id || current.run_version !== sourceVersion) throw new Error("active historical source execution is required");
  if (current.playbook === "production-mode-transition" && current.current_node === TRANSITION_APPLY_NODE) throw new Error("legacy adoption apply is already active");
  if (current.playbook_stack.some(isLegacyAdoptionSuspensionFrame)) throw new Error("legacy adoption suspension is already active");
  const sourceMode = current.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)]?.mode;
  const sourcePolicy = legacyProtocolPolicyForMode(sourceMode);
  if (!sourcePolicy) throw new Error("legacy adoption source has no authoritative historical mode");
  if (current.production_mode?.by_version?.[canonicalVersionKey(targetVersion)]) throw new Error("legacy adoption target mode already exists");

  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: legacy adoption source state precondition changed");
  if (adoption.source_state_sha256 !== sourceStateSha) {
    throw new Error("CONFLICT: legacy adoption source state binding changed");
  }
  const frame = {
    schema: TRANSITION_SUSPENSION_SCHEMA,
    disposition: "transition-suspended",
    playbook: current.playbook,
    current_node: current.current_node,
    execution_id: current.execution_id,
    execution_started_at: current.execution_started_at,
    run_version: sourceVersion,
    controller_nodes: Object.fromEntries(controllerEntries(current.nodes).map(([id, record]) => [id, deepClone(record)])),
    source_run_version: sourceVersion,
    source_mode: sourceMode,
    source_pipeline: sourcePolicy.pipeline,
    target_run_version: targetVersion,
    target_mode: targetMode,
    target_pipeline: targetPipeline,
    target_workflow: targetWorkflow,
    transition_kind: LEGACY_ADOPTION_KIND,
    transition_plan_hash: planHash,
    parent_stack: deepClone(current.playbook_stack),
  };
  const at = nowIso();
  const transitionExecutionId = newExecutionId();
  const next = structuredClone(current);
  next.schema_version = STATE_SCHEMA_VERSION;
  next.playbook = "production-mode-transition";
  next.current_node = TRANSITION_APPLY_NODE;
  next.execution_id = transitionExecutionId;
  next.execution_started_at = at;
  next.run_version = sourceVersion;
  next.pipeline = sourcePolicy.pipeline;
  next.nodes = preserveReservedNodes(current.nodes);
  next.nodes[TRANSITION_APPLY_NODE] = {
    status: "in_progress",
    execution_id: transitionExecutionId,
    run_version: sourceVersion,
    transition_kind: LEGACY_ADOPTION_KIND,
    transition_adoption: deepClone(adoption),
    transition_plan_hash: planHash,
    transition_candidate_receipt_sha256: candidateReceiptSha256,
    transition_target_intake: structuredClone(targetIntake),
    transition_target_intake_sha256: targetIntakeSha256,
    transition_confirmation: { kind: "user", decision: "proceed", at },
    transition_source_execution_id: frame.execution_id,
    transition_source_version: sourceVersion,
    transition_source_mode: sourceMode,
    transition_source_pipeline: sourcePolicy.pipeline,
    transition_target_version: targetVersion,
    transition_target_mode: targetMode,
    transition_target_pipeline: targetPipeline,
    transition_target_workflow: targetWorkflow,
    started: at,
  };
  next.playbook_stack = [frame];
  writeState(deckDir, next, { expectedStateSha: sourceStateSha, updatedAt: at });
  appendHistory(deckDir, {
    type: "legacy_protocol_adoption_confirmed",
    transition_kind: LEGACY_ADOPTION_KIND,
    source_execution_id: frame.execution_id,
    source_version: sourceVersion,
    source_mode: sourceMode,
    target_version: targetVersion,
    target_mode: targetMode,
    target_workflow: targetWorkflow,
    plan_hash: planHash,
    candidate_receipt_sha256: candidateReceiptSha256,
    at,
  });
  return Object.freeze({
    status: "confirmed",
    source_version: sourceVersion,
    source_execution_id: frame.execution_id,
    target_version: targetVersion,
    target_mode: targetMode,
    target_pipeline: targetPipeline,
    target_workflow: targetWorkflow,
    adoption_kind: LEGACY_ADOPTION_KIND,
    plan_hash: planHash,
    transition_execution_id: transitionExecutionId,
  });
}

/** Restore the exact captured historical source only when no target exists. */
export function restoreLegacyProtocolAdoptionSource(deckDir, { sourceRunVersion, planHash, expectedStateSha = null } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("transition source version and plan hash are required");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");
  const current = readLegacyAdoptionState(deckDir, { purpose: "execute", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: legacy adoption state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  const record = activeLegacyAdoptionRecord(current);
  const frame = current.playbook_stack?.[0];
  if (!record || !isLegacyAdoptionSuspensionFrame(frame) || frame.source_run_version !== sourceVersion || record.transition_plan_hash !== planHash || frame.transition_plan_hash !== planHash) {
    throw new Error("active legacy adoption checkpoint is missing or drifted");
  }
  if (existsSync(join(deckDir, "3_versions", record.transition_target_version))) throw new Error("CONFLICT: legacy adoption target is visible and must be inspected");
  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: legacy adoption state precondition changed");
  const next = structuredClone(current);
  next.playbook = frame.playbook;
  next.current_node = frame.current_node;
  next.execution_id = frame.execution_id;
  next.execution_started_at = frame.execution_started_at;
  next.run_version = frame.run_version;
  next.pipeline = frame.source_pipeline;
  next.nodes = { ...deepClone(frame.controller_nodes), ...preserveReservedNodes(current.nodes) };
  next.playbook_stack = deepClone(frame.parent_stack);
  writeState(deckDir, next, { expectedStateSha: sourceStateSha });
  appendHistory(deckDir, {
    type: "legacy_protocol_adoption_source_restored",
    source_execution_id: frame.execution_id,
    source_version: sourceVersion,
    target_version: record.transition_target_version,
    plan_hash: planHash,
  });
  return Object.freeze({ status: "source_restored", source_version: sourceVersion, target_version: record.transition_target_version, plan_hash: planHash, adoption_kind: LEGACY_ADOPTION_KIND });
}

function legacyAdoptionJournalSnapshot(deckDir, record, ownerToken) {
  if (!SHA256_RE.test(ownerToken || "")) throw new TypeError("transition recovery owner token must be a lowercase SHA-256");
  const path = join(deckDir, "3_versions", record.transition_source_version, "_scratch", "production-mode-transition", "apply-journal.json");
  if (!existsSync(path)) throw new Error("transition apply journal is missing");
  const bytes = readFileSync(path);
  let journal;
  try { journal = JSON.parse(bytes.toString("utf8")); } catch { throw new Error("transition apply journal is invalid"); }
  const claimedAt = Number(journal?.claimed_at_epoch_ms);
  if (!isPlainObject(journal) || journal.schema !== "pptmaker-production-mode-transition-apply-journal-v1" ||
    journal.owner_token !== ownerToken || !SHA256_RE.test(journal.owner_token) ||
    typeof journal.owner_host !== "string" || !journal.owner_host || !Number.isInteger(journal.owner_pid) || journal.owner_pid <= 0 ||
    !Number.isFinite(claimedAt) || claimedAt <= 0 || journal.plan_hash !== record.transition_plan_hash ||
    journal.source_execution_id !== record.transition_source_execution_id || journal.source_version !== record.transition_source_version ||
    journal.target_version !== record.transition_target_version || journal.target_mode !== record.transition_target_mode ||
    journal.target_pipeline !== record.transition_target_pipeline || journal.target_workflow !== record.transition_target_workflow) {
    throw new Error("transition apply journal does not match the active checkpoint");
  }
  return Object.freeze({ path, bytes, sha256: sha256(bytes), journal, age_ms: Math.max(0, Date.now() - claimedAt) });
}

/**
 * Persist the human no-active-apply statement for one exact uncertain journal.
 * The token is only compared in memory and is intentionally absent from both
 * state and return values.
 */
export function recordLegacyProtocolAdoptionRecoveryConfirmation(deckDir, {
  sourceRunVersion,
  planHash,
  ownerToken,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("transition source version and plan hash are required");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");
  const current = readLegacyAdoptionState(deckDir, { purpose: "execute", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: legacy adoption state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  const record = activeLegacyAdoptionRecord(current);
  if (!record || record.transition_plan_hash !== planHash) throw new Error("active legacy adoption checkpoint is missing or drifted");
  const snapshot = legacyAdoptionJournalSnapshot(deckDir, record, ownerToken);
  if (snapshot.journal.owner_host.trim().toLowerCase() === hostname().trim().toLowerCase()) throw new Error("legacy adoption journal is same-host; uncertain-owner confirmation is inapplicable");
  if (snapshot.age_ms < TRANSITION_UNCERTAIN_RECOVERY_AGE_MS) throw new Error("legacy adoption journal is not old enough for uncertain-owner recovery confirmation");
  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: legacy adoption state precondition changed");
  const at = nowIso();
  const next = structuredClone(current);
  next.nodes[TRANSITION_APPLY_NODE] = {
    ...next.nodes[TRANSITION_APPLY_NODE],
    transition_recovery_confirmation: {
      kind: "user",
      decision: "no-active-apply",
      source_execution_id: record.transition_source_execution_id,
      source_version: record.transition_source_version,
      target_version: record.transition_target_version,
      plan_hash: record.transition_plan_hash,
      journal_sha256: snapshot.sha256,
      confirmed_at: at,
    },
  };
  writeState(deckDir, next, { expectedStateSha: sourceStateSha, updatedAt: at });
  return Object.freeze({
    status: "recorded",
    source_version: record.transition_source_version,
    target_version: record.transition_target_version,
    plan_hash: record.transition_plan_hash,
    journal_sha256: snapshot.sha256,
  });
}

/**
 * Closed public recovery-confirmation form. The caller supplies only the
 * uncertain journal token; the state owner derives the active plan binding.
 */
export function recordActiveLegacyProtocolAdoptionRecoveryConfirmation(deckDir, {
  sourceRunVersion,
  ownerToken,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion) throw new TypeError("transition source version is required");
  const current = readLegacyAdoptionState(deckDir, { purpose: "execute", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: legacy adoption state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  const record = activeLegacyAdoptionRecord(current);
  if (!record) throw new Error("active legacy adoption checkpoint is missing or drifted");
  return recordLegacyProtocolAdoptionRecoveryConfirmation(deckDir, {
    sourceRunVersion: sourceVersion,
    planHash: record.transition_plan_hash,
    ownerToken,
    expectedStateSha: sha256(readFileSync(statePath(deckDir))),
  });
}

/** Re-inspect the durable journal before an uncertain-owner takeover. */
export function verifyLegacyProtocolAdoptionRecoveryConfirmation(deckDir, { sourceRunVersion, planHash, ownerToken } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) return Object.freeze({ ok: false, code: "TRANSITION_RECOVERY_INPUT_INVALID" });
  const current = readLegacyAdoptionState(deckDir, { purpose: "observe", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted || current?.execution_run_version_mismatch) return Object.freeze({ ok: false, code: current?.code || "TRANSITION_STATE_UNAVAILABLE" });
  const record = activeLegacyAdoptionRecord(current);
  if (!record || record.transition_plan_hash !== planHash) return Object.freeze({ ok: false, code: "TRANSITION_CHECKPOINT_DRIFT" });
  let snapshot;
  try { snapshot = legacyAdoptionJournalSnapshot(deckDir, record, ownerToken); } catch { return Object.freeze({ ok: false, code: "TRANSITION_JOURNAL_DRIFT" }); }
  const confirmation = record.transition_recovery_confirmation;
  const matches = isPlainObject(confirmation) && confirmation.kind === "user" && confirmation.decision === "no-active-apply" &&
    confirmation.source_execution_id === record.transition_source_execution_id && confirmation.source_version === record.transition_source_version &&
    confirmation.target_version === record.transition_target_version && confirmation.plan_hash === record.transition_plan_hash &&
    confirmation.journal_sha256 === snapshot.sha256 && validIsoTimestamp(confirmation.confirmed_at);
  if (!matches) return Object.freeze({ ok: false, code: "TRANSITION_RECOVERY_CONFIRMATION_REQUIRED" });
  if (snapshot.journal.owner_host.trim().toLowerCase() === hostname().trim().toLowerCase() || snapshot.age_ms < TRANSITION_UNCERTAIN_RECOVERY_AGE_MS) return Object.freeze({ ok: false, code: "TRANSITION_JOURNAL_NOT_UNCERTAIN_OR_OLD" });
  return Object.freeze({ ok: true, source_version: record.transition_source_version, target_version: record.transition_target_version, plan_hash: record.transition_plan_hash, journal_sha256: snapshot.sha256 });
}

/** Complete the only terminal legacy-adoption path after a target-local receipt. */
export function completeLegacyProtocolAdoptionHandoff(deckDir, {
  sourceRunVersion,
  planHash,
  receiptSha256 = null,
  sourceControlFingerprint = null,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("legacy adoption source version and plan hash are required");
  if (receiptSha256 !== null && !SHA256_RE.test(receiptSha256)) throw new TypeError("receiptSha256 must be a lowercase SHA-256");
  if (sourceControlFingerprint !== null && !SHA256_RE.test(sourceControlFingerprint)) throw new TypeError("sourceControlFingerprint must be a lowercase SHA-256");
  const current = readLegacyAdoptionState(deckDir, { purpose: "execute", sourceRunVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: legacy adoption state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  const record = activeLegacyAdoptionRecord(current);
  const frame = current.playbook_stack?.[0];
  if (!record || !isLegacyAdoptionSuspensionFrame(frame) || record.transition_plan_hash !== planHash || frame.transition_plan_hash !== planHash) throw new Error("active legacy adoption checkpoint is missing or drifted");
  const targetDir = join(deckDir, "3_versions", record.transition_target_version);
  const receiptPath = join(targetDir, ...PAGE_AUTHORITY_TRANSITION_RECEIPT_RELATIVE_PATH.split("/"));
  if (!existsSync(targetDir) || !existsSync(receiptPath)) throw new Error("legacy_adoption_target_required: target receipt is not visible");
  const receiptBytes = readFileSync(receiptPath);
  const actualReceiptSha = sha256(receiptBytes);
  if (receiptSha256 && receiptSha256 !== actualReceiptSha) throw new Error("legacy adoption target receipt changed");
  let receipt;
  try { receipt = JSON.parse(receiptBytes.toString("utf8")); } catch { throw new Error("legacy adoption target receipt is invalid"); }
  if (!isPlainObject(receipt) || receipt.schema !== "pptmaker-production-mode-transition-success-v1" ||
    receipt.transition_kind !== record.transition_kind || receipt.plan_hash !== planHash || receipt.source_execution_id !== record.transition_source_execution_id ||
    receipt.source_version !== sourceVersion || receipt.target_version !== record.transition_target_version ||
    receipt.target_mode !== record.transition_target_mode || receipt.target_pipeline !== record.transition_target_pipeline ||
    receipt.target_workflow !== record.transition_target_workflow || !SHA256_RE.test(receipt.target_source_sha256 || "") ||
    receipt.candidate_receipt_sha256 !== record.transition_candidate_receipt_sha256 ||
    receipt.target_intake_sha256 !== record.transition_target_intake_sha256 || !SHA256_RE.test(receipt.source_control_fingerprint || "")) {
    throw new Error("legacy adoption target receipt does not match the active checkpoint");
  }
  if (!hasExactKeys(receipt.adoption, ["observation_sha256", "source_state_sha256", "matrix_sha256", "workflow"]) ||
    receipt.adoption.observation_sha256 !== record.transition_adoption.observation_sha256 ||
    receipt.adoption.source_state_sha256 !== record.transition_adoption.source_state_sha256 ||
    receipt.adoption.matrix_sha256 !== record.transition_adoption.matrix_sha256 ||
    receipt.adoption.workflow !== record.transition_target_workflow) {
    throw new Error("legacy adoption target receipt does not match the active checkpoint");
  }
  if (sourceControlFingerprint && sourceControlFingerprint !== receipt.source_control_fingerprint) throw new Error("legacy adoption source/control fingerprint changed");
  const targetSourcePath = join(targetDir, "slide-specifications.md");
  if (!existsSync(targetSourcePath) || sha256(readFileSync(targetSourcePath)) !== receipt.target_source_sha256) {
    throw new Error("legacy adoption target source receipt is stale");
  }
  const marker = probeSourceMarkerForVersion(deckDir, record.transition_target_version);
  const targetPipeline = pipelineFromSourceMarker(marker);
  if (!targetPipeline?.ok || targetPipeline.pipeline !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE ||
    targetPipeline.workflow !== record.transition_target_workflow) {
    throw new Error("legacy adoption target marker is not the selected v2 Page Authority workflow");
  }
  const required = [
    join(deckDir, "deck-guide.md"),
    join(targetDir, "slide-specifications.md"),
    join(deckDir, ...PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH.split("/")),
  ];
  if (required.some((path) => !existsSync(path))) throw new Error("legacy adoption target baseline prerequisites are incomplete");
  const stateBytes = readFileSync(statePath(deckDir));
  const stateSha = sha256(stateBytes);
  if (expectedStateSha && expectedStateSha !== stateSha) throw new Error("CONFLICT: legacy adoption state precondition changed");
  const at = nowIso();
  const intakeDecisionAt = record.transition_confirmation.at;
  const targetExecutionId = newExecutionId();
  const baseline = {
    target_execution_id: targetExecutionId,
    target_run_version: record.transition_target_version,
    plan_hash: planHash,
    success_receipt_sha256: actualReceiptSha,
    source_control_fingerprint: receipt.source_control_fingerprint,
    source_receipt_sha256: receipt.target_source_sha256,
    workflow: record.transition_target_workflow,
    adoption_kind: LEGACY_ADOPTION_KIND,
  };
  const targetNodes = {
    select: "select-target-page-authority-workflow",
    author: "author-target-page-authority-content",
    authorEvidence: "page-authority-source-receipt-v2",
    configure: "configure-target-page-authority-visual-system",
    configureEvidence: "target-page-authority-visual-language",
    next: `authorize-target-${record.transition_target_workflow}-raw`,
  };
  const next = structuredClone(current);
  next.playbook = "create-deck";
  next.current_node = targetNodes.next;
  next.execution_id = targetExecutionId;
  next.execution_started_at = at;
  next.run_version = record.transition_target_version;
  next.continuation_target_version = record.transition_target_version;
  next.pipeline = record.transition_target_pipeline;
  ensureProductionModeContainer(next);
  ensureTargetEvidenceContainer(next);
  const targetKey = canonicalVersionKey(record.transition_target_version);
  const existingTargetMode = next.production_mode.by_version[targetKey];
  const existingTargetEvidence = next.page_authority_target_evidence.by_version[targetKey];
  const existingAuthorization = next.page_authority_raw_provider_authorization?.by_version?.[targetKey];
  const existingDeliveryReview = next.page_authority_delivery_review?.by_version?.[targetKey];
  if (existingTargetMode || existingTargetEvidence || existingAuthorization || existingDeliveryReview) {
    throw new Error("CONFLICT: legacy adoption target already has target-owned execution evidence");
  }
  // The historical source remains byte-preserved observer input; the active
  // state graph retains only the adopted Page Authority run.
  delete next.production_mode.by_version[canonicalVersionKey(sourceVersion)];
  next.production_mode.by_version[targetKey] = initialProductionModeRecord(TARGET_PRODUCTION_MODE, record.transition_target_workflow);
  next.page_authority_target_evidence.by_version[targetKey] = {
    schema: PAGE_AUTHORITY_TARGET_STATE_SCHEMA,
    run_version: record.transition_target_version,
    source_epoch: 1,
    source_receipt_sha256: receipt.target_source_sha256,
    workflow: record.transition_target_workflow,
    provider_authorization_sha256: null,
    accepted_raw_evidence_sha256: null,
    final_manifest_sha256: null,
    delivery_receipt_sha256: null,
  };
  next.nodes = preserveReservedNodes(current.nodes);
  next.nodes["checkpoint-intake"] = {
    status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at,
    decision: { value: "proceed", kind: "user", at: intakeDecisionAt }, evidence: { "intake-confirmed": { met: true, kind: "user", at: intakeDecisionAt, note: record.transition_target_intake_sha256 } },
    transition_baseline: { ...baseline, target_intake_sha256: record.transition_target_intake_sha256 },
  };
  next.nodes[targetNodes.select] = {
    status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at,
    decision: { value: record.transition_target_workflow, kind: "user", at: intakeDecisionAt },
    transition_baseline: baseline,
  };
  for (const [nodeId, evidenceKey] of [[targetNodes.author, targetNodes.authorEvidence], [targetNodes.configure, targetNodes.configureEvidence]]) {
    next.nodes[nodeId] = { status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at, evidence: { [evidenceKey]: { met: true, kind: "agent", at, note: receipt.source_control_fingerprint } }, transition_baseline: baseline };
  }
  next.playbook_stack = [];
  writeState(deckDir, next, { expectedStateSha: stateSha, updatedAt: at });
  appendHistory(deckDir, { type: "legacy_protocol_adoption_source_archived", adoption_kind: LEGACY_ADOPTION_KIND, source_execution_id: frame.execution_id, source_version: sourceVersion, target_version: record.transition_target_version, plan_hash: planHash, receipt_sha256: actualReceiptSha, at });
  appendHistory(deckDir, { type: "legacy_protocol_adoption_handoff", adoption_kind: LEGACY_ADOPTION_KIND, target_execution_id: targetExecutionId, source_version: sourceVersion, target_version: record.transition_target_version, target_mode: TARGET_PRODUCTION_MODE, target_workflow: record.transition_target_workflow, plan_hash: planHash, receipt_sha256: actualReceiptSha, at });
  return Object.freeze({ status: "handoff-complete", source_version: sourceVersion, target_version: record.transition_target_version, target_mode: TARGET_PRODUCTION_MODE, target_workflow: record.transition_target_workflow, adoption_kind: LEGACY_ADOPTION_KIND, current_node: targetNodes.next, receipt_sha256: actualReceiptSha });
}

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

function modeForControllerContext(state, ctx = {}) {
  if (isProductionMode(ctx.productionMode)) return ctx.productionMode;
  const runVersion = normalizeRunVersion(ctx.runVersion ?? ctx.run_version ?? ctx.runDir ?? ctx.run_dir);
  if (!runVersion) return null;
  const record = state?.production_mode?.by_version?.[canonicalVersionKey(runVersion)];
  if (isProductionModeRecord(record)) return record.mode;
  // Fresh v2 bundles are explicitly marked as target authoring drafts. This
  // selects only the workflow-choice node; it never guesses a workflow.
  return state?.pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE
    ? TARGET_PRODUCTION_MODE
    : null;
}

function workflowForControllerContext(state, ctx = {}, mode = modeForControllerContext(state, ctx)) {
  if (mode !== TARGET_PRODUCTION_MODE) return null;
  const requested = ctx.productionWorkflow ?? ctx.production_workflow ?? null;
  const runVersion = normalizeRunVersion(ctx.runVersion ?? ctx.run_version ?? ctx.runDir ?? ctx.run_dir);
  const record = runVersion
    ? state?.production_mode?.by_version?.[canonicalVersionKey(runVersion)]
    : null;
  const bound = isProductionModeRecord(record) && record.mode === TARGET_PRODUCTION_MODE
    ? record.workflow
    : null;
  if (requested != null && !TARGET_WORKFLOWS.includes(requested)) return null;
  if (bound && requested && bound !== requested) return null;
  return bound || requested || null;
}

function activeControllerNodeIds(index, playbook, state, ctx = {}) {
  const mode = modeForControllerContext(state, ctx);
  if (!mode) return controllerNodeIds(index, playbook);
  return controllerActiveNodeIds(index, playbook, mode, workflowForControllerContext(state, ctx, mode));
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
      production_mode: null,
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

  const modeRunVersion = controller?.ctx?.runVersion || controller?.ctx?.run_version || null;
  const production_mode = modeRunVersion ? projectModeCard(state, modeRunVersion) : null;
  const resolvedMode = production_mode?.resolvable ? production_mode.mode : null;
  const controllerCtx = resolvedMode
    ? { ...(controller?.ctx || {}), productionMode: resolvedMode }
    : (controller?.ctx || {});
  let eligible_candidates = [];
  if (controller?.index && playbook) {
    eligible_candidates = getEligibleNextNodes(controller.index, playbook, state, controllerCtx);
  }
  const suggested_next = "inspect:workflow-inspection";

  // Derive the active node set from the exact authoritative mode when resolvable
  // (mode-filtered working set); otherwise fall back to the full controller set.
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
    production_mode,
  };
}

/** Read the state-owned Page Authority delivery decision and its node binding. */
export function inspectPageAuthorityDeliveryReview(state, { runVersion, evidence = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion);
  if (!exactVersion) return Object.freeze({ present: false, current: false, code: "RUN_VERSION_INVALID" });
  const record = state?.page_authority_delivery_review?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!validPageAuthorityDeliveryReviewRecord(record, exactVersion)) {
    return Object.freeze({ present: false, current: false, code: "DELIVERY_REVIEW_MISSING" });
  }
  if (record.execution_id !== state?.execution_id) {
    return Object.freeze({ present: true, current: false, code: "DELIVERY_REVIEW_EXECUTION_STALE", record: Object.freeze(structuredClone(record)) });
  }
  const node = activeRecord(state, PAGE_AUTHORITY_FINAL_REVIEW_NODE);
  const binding = node?.page_authority_delivery_review;
  if (node?.status !== "completed" || node?.decision?.kind !== "user" || node?.decision?.value !== record.decision ||
    binding?.run_version !== exactVersion || binding?.fingerprint !== sha256(stableStringify(record))) {
    return Object.freeze({ present: true, current: false, code: "DELIVERY_REVIEW_NODE_UNBOUND", record: Object.freeze(structuredClone(record)) });
  }
  if (evidence != null) {
    if (!isPlainObject(evidence) || evidence.source_epoch !== record.source_epoch) {
      return Object.freeze({ present: true, current: false, code: "DELIVERY_REVIEW_EVIDENCE_STALE", record: Object.freeze(structuredClone(record)) });
    }
    const mismatch = PAGE_AUTHORITY_DELIVERY_EVIDENCE_FIELDS.find((field) => evidence[field] !== record[field]);
    if (mismatch) {
      return Object.freeze({ present: true, current: false, code: "DELIVERY_REVIEW_EVIDENCE_STALE", field: mismatch, record: Object.freeze(structuredClone(record)) });
    }
  }
  return Object.freeze({ present: true, current: true, decision: record.decision, record: Object.freeze(structuredClone(record)) });
}

/** Resume-card mode projection: resolvable mode + derived policy, or a typed gap. */
function projectModeCard(state, runVersion) {
  const exactVersion = normalizeRunVersion(runVersion);
  const versionKey = canonicalVersionKey(exactVersion);
  if (!versionKey) return Object.freeze({ resolvable: false, code: "RUN_VERSION_INVALID" });
  const record = isPlainObject(state?.production_mode?.by_version) ? state.production_mode.by_version[versionKey] : null;
  const mode = isProductionModeRecord(record) ? record.mode : null;
  if (!mode) return Object.freeze({ resolvable: false, code: "MODE_MISSING", run_version: exactVersion });
  return Object.freeze({ resolvable: true, run_version: exactVersion, mode, policy: productionPolicyForMode(mode) });
}

/** Project completion from the only current Page Authority delivery evidence. */
export function projectModeCompletion(state, { runVersion } = {}) {
  const exactVersion = normalizeRunVersion(runVersion);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  const versionKey = canonicalVersionKey(exactVersion);
  const record = isPlainObject(state?.production_mode?.by_version) ? state.production_mode.by_version[versionKey] : null;
  const mode = isProductionModeRecord(record) ? record.mode : null;
  if (!mode) return Object.freeze({ ok: false, code: "MODE_MISSING", run_version: exactVersion, next_action: "register_production_mode" });
  if (mode !== "image2-page-authority") {
    return Object.freeze({ ok: false, code: "LEGACY_PROTOCOL_ADOPTION_REQUIRED", run_version: exactVersion });
  }
  const policy = productionPolicyForMode(mode);
  const pageAuthority = inspectPageAuthorityDeliveryReview(state, { runVersion: exactVersion });
  const missing = [];
  if (!pageAuthority.current || pageAuthority.decision !== "proceed") {
    missing.push({ owner: "page-authority-delivery-review", action: "complete_evidence_bound_page_authority_delivery_review" });
  }
  return Object.freeze({ ok: true, mode, policy, complete: missing.length === 0, missing });
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
  normalizePlaybookStack(state);
  if (state.playbook_stack.length > 0) throw new Error("cannot start a top-level playbook while playbook_stack is non-empty; use switchPlaybook");
  if (state.playbook && activeExecutionIncomplete(state) && !replace) throw new Error("active playbook execution is incomplete; pass replace:true to replace it");
  if (state.playbook) requireExecutionRunVersion(state, { runVersion, runDir });
  const exactRunVersion = selectedRunVersion({ runVersion, runDir }) || normalizeRunVersion(state.run_version) || "v1";
  const now = nowIso();
  state.schema_version = STATE_SCHEMA_VERSION;
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
  normalizePlaybookStack(state);
  if (state.playbook_stack.some(isLegacyAdoptionSuspensionFrame)) {
    throw new Error("transition suspension is non-resumable; use the closed transition apply or recovery operation");
  }
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
  normalizePlaybookStack(state);
  if (state.playbook_stack.length === 0) return state;
  if (state.playbook_stack.some(isLegacyAdoptionSuspensionFrame)) {
    throw new Error("transition suspension is non-resumable; use the closed transition apply or recovery operation");
  }
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
    schema_version: STATE_SCHEMA_VERSION,
    pipeline: PAGE_AUTHORITY_IMAGE2_PIPELINE,
    production_mode: { by_version: {} },
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
export function createInitialState(deckName, deckType, style, { mode = "image2-page-authority", workflow = null } = {}) {
  const policy = productionPolicyForMode(mode);
  if (!policy.ok) throw new TypeError("initial state requires a valid production mode");
  if (mode === "image2-page-authority-v2" && !["framed", "pure"].includes(workflow)) {
    throw new TypeError("v2 initial state requires workflow framed | pure");
  }
  const state = createDefaultState();
  state.pipeline = policy.pipeline;
  state.production_mode.by_version[canonicalVersionKey("v1")] = initialProductionModeRecord(policy.mode, workflow);
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck", { runVersion: "v1" });
  state.current_node = "checkpoint-intake";
  return state;
}

/** Create a fresh v2 authoring state before the human records a workflow. */
export function createTargetAuthoringState(deckName, deckType, style) {
  const state = createDefaultState();
  state.pipeline = PAGE_AUTHORITY_IMAGE2_V2_PIPELINE;
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck", { runVersion: "v1" });
  state.current_node = "select-target-page-authority-workflow";
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
  if (state.continuation_target_version != null && state.continuation_target_version !== "" && !exactContinuationTargetVersion(state.continuation_target_version)) {
    errors.push("continuation_target_version must be a normalized vN");
  }
  errors.push(...executionBindingErrors(state));
  for (const [name, node] of controllerEntries(nodes)) {
    if (!NODE_STATUSES.includes(node?.status)) errors.push(`invalid status for ${name}`);
    if (node?.execution_id !== state.execution_id) errors.push(`execution mismatch for ${name}`);
    if (node?.status === "in_progress" && node.completed) errors.push(`illegal: ${name} completed→in_progress`);
  }
  for (const id of RETIRED_STATE_NODE_IDS) if (nodes[id] !== undefined) errors.push(`${id} is retired and cannot appear in current state`);
  for (const gate of ["content", "visual"]) if (!GATE_STATUSES.includes(gates[gate])) errors.push(`invalid gate ${gate}`);
  validateProductionModeStructure(state, errors);
  validatePageAuthorityRawAuthorizationStructure(state, errors);
  validatePageAuthorityDeliveryReviewStructure(state, errors);
  validateTargetEvidenceStructure(state, errors);
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
  if (state.playbook === "production-mode-transition" && !activeLegacyAdoptionRecord(state)) {
    errors.push("active legacy adoption record is malformed or contains retired receipt identity");
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

/** Ensure the production-mode container exists with a plain by_version map. */
function ensureProductionModeContainer(state) {
  const prior = isPlainObject(state.production_mode) && isPlainObject(state.production_mode.by_version)
    ? state.production_mode.by_version
    : {};
  state.production_mode = { by_version: prior };
  return state.production_mode.by_version;
}

/** Structural validation for the in-memory state used by validateState. */
function validateProductionModeStructure(state, errors) {
  const pm = state.production_mode;
  if (pm === undefined) return;
  if (!isPlainObject(pm) || !isPlainObject(pm.by_version)) {
    errors.push("production_mode must contain by_version");
    return;
  }
  for (const [key, record] of Object.entries(pm.by_version)) {
    if (!versionFromReservedKey(key)) errors.push(`invalid production_mode version key ${key}`);
    if (!isProductionModeRecord(record)) {
      errors.push(`invalid production_mode record ${key}`);
    }
  }
}

/** Read-only validation for persisted bytes used by validateStateReadOnly. */
function validateProductionModeReadOnly(state, issues) {
  const pm = state.production_mode;
  if (pm == null) return;
  if (!hasExactKeys(pm, ["by_version"]) || !isPlainObject(pm.by_version)) {
    issues.push(stateIssue("production_mode", "by_version-only production_mode map", "invalid", "record"));
    return;
  }
  for (const [key, record] of Object.entries(pm.by_version)) {
    const recordPath = `production_mode.by_version.${key}`;
    const runVersion = versionFromReservedKey(key);
    if (!runVersion) {
      issues.push(stateIssue(recordPath, "canonical 3_versions/vN key", "noncanonical", "record"));
      continue;
    }
    if (!isProductionModeRecord(record)) {
      issues.push(stateIssue(
        recordPath,
        "exact {mode: image2-page-authority, source_epoch: positive integer} record",
        "unknown-or-invalid",
        "record",
        "repair_page_authority_state",
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
  const topLevel = ["schema_version", "pipeline", "production_mode", "page_authority_raw_provider_authorization", "page_authority_delivery_review", "page_authority_target_evidence", "playbook", "current_node", "execution_id", "execution_started_at", "run_version", "continuation_target_version", "started_at", "updated_at", "nodes", "gates", "deck", "playbook_stack", "diagnostics"];
  for (const key of Object.keys(state)) if (!topLevel.includes(key)) issues.push(stateIssue(key, "known top-level state key", "unknown", "state"));
  for (const error of validateState(state).errors.slice(0, 20)) issues.push(stateIssue("state", "valid schema-v5 invariant", error, "state"));
  const continuationTargetError = continuationTargetVisibilityError(state, deckDir);
  if (continuationTargetError) {
    issues.push(stateIssue("continuation_target_version", "normalized visible canonical vN", state.continuation_target_version || "missing", "state", "guide_explicit_run"));
  }
  validateProductionModeReadOnly(state, issues);
  const nodes = state.nodes;
  if (isPlainObject(nodes)) {
    for (const id of RETIRED_STATE_NODE_IDS) if (nodes[id] !== undefined) issues.push(stateIssue(`nodes.${id}`, "no retired state record", "retired", "record", "repair_state"));
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
  visual_preset_seeded: (_state, ctx) => existsSync(join(ctx.deckDir || "", ...PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH.split("/"))),
  style_master_exists: (_state, ctx) => existsSync(join(ctx.deckDir || "", "2_backbone", "visual-style", "style_master.jpg")),
  slide_specs_exists: (_state, ctx) => existsSync(join(ctx.runDir || "", "slide-specifications.md")),
  slide_specs_valid: (_state, ctx) => typeof ctx.slideSpecsValid === "function" ? Boolean(ctx.slideSpecsValid()) : ctx.slideSpecsValid === true,
  pptx_generated: (state, ctx) => {
    const runVersion = normalizeRunVersion(ctx.runVersion || ctx.runDir);
    const sourceEpoch = state?.production_mode?.by_version?.[canonicalVersionKey(runVersion)]?.source_epoch;
    return inspectPageAuthorityDeliveryEvidence(ctx.runDir || "", { sourceEpoch }).ok;
  },
  speaker_notes_injected: (state, ctx) => {
    const runVersion = normalizeRunVersion(ctx.runVersion || ctx.runDir);
    const sourceEpoch = state?.production_mode?.by_version?.[canonicalVersionKey(runVersion)]?.source_epoch;
    return inspectPageAuthorityDeliveryEvidence(ctx.runDir || "", { sourceEpoch }).ok;
  },
  transition_apply_current: (state, ctx) => {
    const record = activeLegacyAdoptionRecord(state);
    const frame = state?.playbook_stack?.[0];
    return Boolean(record && isLegacyAdoptionSuspensionFrame(frame) && selectedRunVersion(ctx) === record.transition_source_version &&
      frame.execution_id === record.transition_source_execution_id && frame.transition_plan_hash === record.transition_plan_hash);
  },
  // Terminal transition finalization replaces the active execution rather than
  // exposing a generally-completable node, so no ordinary controller check can
  // make this exit true.
  transition_publish_or_recovery_recorded: () => false,
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
    return { pass: false, missing: [], unknown: [`node ${state.playbook}/${nodeName} is inactive for the authoritative production mode`] };
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
    return { pass: false, missing: [], unknown: [`node ${state.playbook}/${nodeName} is inactive for the authoritative production mode`] };
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
