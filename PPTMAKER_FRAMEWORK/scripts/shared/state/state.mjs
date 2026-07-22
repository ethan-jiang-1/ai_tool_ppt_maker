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
import { validateNotesReceipt, notesReceiptPath } from "../identity/notes_receipt.mjs";
import { HTML_FIRST_PIPELINE, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import { canonicalVersionKey, classifyProductionModeTransition, inspectProductionMode, isProductionMode, normalizeRunVersion, pipelineFromSourceMarker, productionModeFromSourceMarker, productionPolicyForMode } from "../run-bundle/production_mode.mjs";

export const STATE_DIR = "_state";
export const STATE_FILE = "state.yaml";
export const HISTORY_FILE = "history.jsonl";
export const STATE_SCHEMA_VERSION = 5;
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
# Fields: schema_version, pipeline, production_mode.by_version, playbook, current_node, execution_id, nodes.*, gates.*, deck.*, playbook_stack
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
const LEGACY_MIGRATION_OLD_SIDE_MODES = new Set(["verified-current", "degraded-missing", "degraded-stale"]);
const TRANSITION_SUSPENSION_SCHEMA = "pptmaker-production-mode-transition-suspension-v1";
const TRANSITION_APPLY_NODE = "apply-production-mode-transition";
const TRANSITION_INTAKE_FIELDS = Object.freeze(["topic", "audience", "duration", "language", "takeaway", "content_constraints", "visual_dna", "success_criteria"]);
const TRANSITION_UNCERTAIN_RECOVERY_AGE_MS = 300000;

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

function isTransitionSuspensionFrame(frame) {
  return isPlainObject(frame) && frame.schema === TRANSITION_SUSPENSION_SCHEMA && frame.disposition === "transition-suspended";
}

function isTransitionPipeline(value) {
  return value === HTML_FIRST_PIPELINE || value === LEGACY_PIPELINE;
}

function validTransitionIntake(value) {
  return isPlainObject(value) &&
    Object.keys(value).length === TRANSITION_INTAKE_FIELDS.length &&
    TRANSITION_INTAKE_FIELDS.every((field) => typeof value[field] === "string" && value[field].trim().length > 0);
}

function activeTransitionRecord(state) {
  if (state?.playbook !== "migrate-import" || state?.current_node !== TRANSITION_APPLY_NODE || !state?.execution_id) return null;
  const record = state.nodes?.[TRANSITION_APPLY_NODE];
  if (!isPlainObject(record) || record.status !== "in_progress" || record.execution_id !== state.execution_id || record.run_version !== state.run_version) return null;
  const required = [
    "transition_plan_hash", "transition_candidate_receipt_sha256", "transition_target_intake_sha256",
  ];
  if (!required.every((key) => SHA256_RE.test(record[key] || ""))) return null;
  if (typeof record.transition_source_execution_id !== "string" || !record.transition_source_execution_id ||
    record.transition_source_version !== state.run_version ||
    !isProductionMode(record.transition_source_mode) ||
    !isTransitionPipeline(record.transition_source_pipeline) ||
    !normalizeRunVersion(record.transition_target_version) ||
    !isProductionMode(record.transition_target_mode) ||
    !isTransitionPipeline(record.transition_target_pipeline)) return null;
  return record;
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

function legacyApplySourceVersion(state) {
  if (state?.playbook !== "migrate-import" || state?.current_node !== "apply-html-migration" || !state?.execution_id) return null;
  const record = state.nodes?.["apply-html-migration"];
  if (!isPlainObject(record) || record.status !== "in_progress" || record.execution_id !== state.execution_id) return null;
  const sourceVersion = normalizeRunVersion(record.migration_source_version);
  if (!sourceVersion || !SHA256_RE.test(record.migration_plan_hash || "") || !LEGACY_MIGRATION_OLD_SIDE_MODES.has(record.old_side_mode)) return null;
  return sourceVersion;
}

function legacyConfirmationSourceVersion(state, selected) {
  const selectedVersion = selectedRunVersion(selected);
  if (!selectedVersion || state?.playbook !== "migrate-import" || state?.current_node !== "confirm-html-migration" || !state?.execution_id) return null;
  const confirmation = state.nodes?.["confirm-html-migration"];
  const preview = state.nodes?.["preview-html-migration"];
  if (!isPlainObject(confirmation) || confirmation.status !== "in_progress" || confirmation.execution_id !== state.execution_id) return null;
  if (!isPlainObject(preview) || preview.status !== "completed" || preview.execution_id !== state.execution_id) return null;
  if (!SHA256_RE.test(preview.migration_plan_hash || "") || !LEGACY_MIGRATION_OLD_SIDE_MODES.has(preview.old_side_mode)) return null;
  return selectedVersion;
}

function resolveV5RunBinding(state, deckDir) {
  if (!state?.playbook) return Object.freeze({ ok: true, run_version: null });
  const persisted = normalizeRunVersion(state.run_version);
  if (persisted) return Object.freeze({ ok: true, run_version: persisted, source: "persisted" });
  const legacy = legacyApplySourceVersion(state);
  if (legacy) return Object.freeze({ ok: true, run_version: legacy, source: "legacy-apply" });
  const visible = visibleRunVersions(deckDir);
  if (visible.length === 1) return Object.freeze({ ok: true, run_version: visible[0], source: "visible-topology" });
  // A v4 active execution has no version identity to bind when its run
  // directory is absent. Choosing v1 here would make an invocation-order
  // guess durable, so preserve the bytes for the explicit repair route.
  if (visible.length === 0) {
    // A malformed pre-v4 shell without an execution ID is not a recoverable
    // controller execution. Preserve the long-standing repair behavior for
    // that bootstrap shape only; it cannot apply to v4 or to any execution
    // that has an identity capable of being routed to the wrong run.
    const sourceSchema = Number.isInteger(state?.schema_version) ? state.schema_version : 0;
    if (sourceSchema < 4 && !state?.execution_id) {
      return Object.freeze({ ok: true, run_version: "v1", source: "pre-v4-unbound-bootstrap" });
    }
    return Object.freeze({ ok: false, reason: "active execution has no persisted run_version and no visible run version" });
  }
  return Object.freeze({ ok: false, reason: "active execution has no persisted run_version and visible topology is ambiguous" });
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

function transitionSuspensionErrors(state, frame, index) {
  const label = `playbook_stack[${index}]`;
  const keys = [
    "schema", "disposition", "playbook", "current_node", "execution_id", "execution_started_at", "run_version", "controller_nodes",
    "source_run_version", "source_mode", "source_pipeline", "target_run_version", "target_mode", "target_pipeline", "transition_plan_hash", "parent_stack",
  ];
  const errors = [];
  if (!Object.keys(frame).every((key) => keys.includes(key)) || !keys.every((key) => Object.hasOwn(frame, key))) {
    errors.push(`${label} has invalid transition suspension keys`);
  }
  if (frame.schema !== TRANSITION_SUSPENSION_SCHEMA || frame.disposition !== "transition-suspended") errors.push(`${label} is not a closed transition suspension`);
  errors.push(...ordinaryFrameBindingErrors(frame, label));
  if (frame.source_run_version !== frame.run_version || !normalizeRunVersion(frame.source_run_version)) errors.push(`${label} source run_version mismatch`);
  if (!isProductionMode(frame.source_mode) || !isTransitionPipeline(frame.source_pipeline) || productionPolicyForMode(frame.source_mode).pipeline !== frame.source_pipeline) errors.push(`${label} source mode/pipeline mismatch`);
  if (!normalizeRunVersion(frame.target_run_version) || !isProductionMode(frame.target_mode) || !isTransitionPipeline(frame.target_pipeline) || productionPolicyForMode(frame.target_mode).pipeline !== frame.target_pipeline) errors.push(`${label} target mode/pipeline mismatch`);
  if (frame.source_run_version === frame.target_run_version || frame.source_pipeline === frame.target_pipeline) errors.push(`${label} is not cross-pipeline`);
  if (!SHA256_RE.test(frame.transition_plan_hash || "")) errors.push(`${label} transition plan hash is invalid`);
  if (!Array.isArray(frame.parent_stack) || frame.parent_stack.some(isTransitionSuspensionFrame)) errors.push(`${label} has invalid suspended parent stack`);
  else frame.parent_stack.forEach((parent, parentIndex) => errors.push(...ordinaryFrameBindingErrors(parent, `${label}.parent_stack[${parentIndex}]`)));
  const sourceMode = state?.production_mode?.by_version?.[canonicalVersionKey(frame.source_run_version)]?.mode;
  if (sourceMode !== frame.source_mode) errors.push(`${label} source mode disagrees with authoritative state`);
  const apply = activeTransitionRecord(state);
  if (!apply || apply.transition_source_execution_id !== frame.execution_id || apply.transition_source_version !== frame.source_run_version ||
    apply.transition_target_version !== frame.target_run_version || apply.transition_plan_hash !== frame.transition_plan_hash) {
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
  const suspensions = state.playbook_stack.filter(isTransitionSuspensionFrame);
  if (suspensions.length > 0 && (suspensions.length !== 1 || state.playbook_stack.length !== 1)) errors.push("transition suspension must be the only stack frame");
  for (const [index, frame] of state.playbook_stack.entries()) {
    if (isTransitionSuspensionFrame(frame)) errors.push(...transitionSuspensionErrors(state, frame, index));
    else errors.push(...ordinaryFrameBindingErrors(frame, `playbook_stack[${index}]`));
  }
  return errors;
}

function bindOrdinaryStackFrames(state, runVersion) {
  if (!runVersion || !Array.isArray(state.playbook_stack)) return;
  for (const frame of state.playbook_stack) {
    if (!isPlainObject(frame) || !isPlainObject(frame.controller_nodes)) continue;
    frame.run_version = runVersion;
    for (const record of Object.values(frame.controller_nodes)) {
      if (isPlainObject(record)) record.run_version = runVersion;
    }
  }
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
  const state = readState(deckDir, { purpose: "execute", heal: false, runVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: refinement state is unavailable");
  if (state?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: refinement state belongs to another run version");
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
      // A transition suspension is schema-closed and non-resumable. Preserve
      // its bytes for the validator and state-owned terminal operations; do
      // not coerce it into an ordinary parent frame during a read/heal cycle.
      if (isTransitionSuspensionFrame(entry)) return deepClone(entry);
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

function normalizeNodeRecord(record, nodeId, executionId, runVersion, migrationTime, state) {
  const rec = isPlainObject(record) ? record : {};
  if (!NODE_STATUSES.includes(rec.status)) {
    if (rec.status != null) appendDiagnostic(state, `${nodeId}.status ${JSON.stringify(rec.status)} healed to pending`);
    rec.status = "pending";
    rec.note = [rec.note, "healed invalid status to pending"].filter(Boolean).join("; ");
  }
  if (rec.waiting_for != null) rec.waiting_for = String(rec.waiting_for);
  if (rec.note != null) rec.note = String(rec.note);
  if (executionId) rec.execution_id = executionId;
  if (runVersion) rec.run_version = runVersion;
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
    // The transition node is state-owned. It is intentionally admitted here
    // before controller declarations are updated so an observation/heal cannot
    // erase an already-confirmed recoverable transaction.
    if (activeTransitionRecord(state)) allowed.add(TRANSITION_APPLY_NODE);
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
  // v3->v4 boundary detection: production-mode records are inferred from source
  // markers ONLY when migrating from a pre-v4 schema. A post-v4 missing mode is
  // corruption and must fail closed rather than be re-inferred.
  const rawSchemaVersion = typeof raw?.schema_version === "number" ? raw.schema_version : 0;
  const migratingFromPreV4 = rawSchemaVersion < 4;

  state.schema_version = STATE_SCHEMA_VERSION;
  state.playbook = typeof state.playbook === "string" ? state.playbook : "";
  state.current_node = typeof state.current_node === "string" ? state.current_node : "";
  state.started_at = typeof state.started_at === "string" ? state.started_at : "";
  state.updated_at = typeof state.updated_at === "string" ? state.updated_at : "";
  state.nodes = isPlainObject(state.nodes) ? state.nodes : {};
  state.gates = isPlainObject(state.gates) ? state.gates : {};
  state.deck = isPlainObject(state.deck) ? state.deck : {};
  ensureProductionModeContainer(state);
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

  // v4->v5 gives every active execution an exact version identity. A legacy
  // in-flight HTML migration carries a closed source-version field which is
  // stronger than visible-version topology; every other migration requires one
  // persisted version or exactly one visible version.
  const binding = opts.runVersionBinding || resolveV5RunBinding(state, opts.deckDir);
  const upgradingToV5 = rawSchemaVersion < STATE_SCHEMA_VERSION;
  const boundRunVersion = binding.ok ? binding.run_version : null;
  if (state.playbook && !boundRunVersion) {
    state.run_version = "";
    appendDiagnostic(state, "active execution has no unambiguous run_version; explicit replacement or repair required");
  } else if (state.playbook && upgradingToV5) {
    state.run_version = boundRunVersion;
  } else {
    if (!state.playbook) delete state.run_version;
  }
  if (upgradingToV5) bindOrdinaryStackFrames(state, boundRunVersion);

  // Phase 3: restrict — validate migrated current_node against playbook index
  restrictActiveWorkingSet(state);

  for (const [id, record] of Object.entries(state.nodes)) {
    if (isReservedNode(id)) continue;
    state.nodes[id] = normalizeNodeRecord(record, id, state.execution_id, upgradingToV5 ? boundRunVersion : null, migrationTime, state);
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
  // Phase 4 (v3->v4 boundary only): populate missing production-mode records
  // from the canonical source marker. Pure over markers; never re-runs on v4.
  if (opts.deckDir && migratingFromPreV4) {
    migrateProductionModeFromMarkers(state, opts.deckDir);
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
  const activeTransitionTarget = normalizeRunVersion(state?.run_version);
  const completedTransitionTarget = activeTransitionTarget &&
    existsSync(join(versionsDir, activeTransitionTarget, "_generated", "qa", "production_mode_transition.json"));
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
        const registeredMode = state?.production_mode?.by_version?.[canonicalVersionKey(version)]?.mode;
        const registeredCrossPipeline = isProductionMode(registeredMode) && productionPolicyForMode(registeredMode).pipeline === observed &&
          existsSync(join(deckDir, "3_versions", version, "_generated", "qa", "production_mode_transition.json"));
        if (!migrationWorkspace && !registeredCrossPipeline && !completedTransitionTarget) { markerIssue = "conflicting production pipelines across versions"; break; }
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
  next.nodes["migration-target-review"] = { status: "in_progress", execution_id: next.execution_id, run_version: handoff.targetVersion, migration_source_execution_id: handoff.sourceExecutionId, migration_plan_hash: handoff.planHash, old_side_mode: handoff.mode, target_version: handoff.targetVersion };
  next.run_version = handoff.targetVersion;
  next.pipeline = HTML_FIRST_PIPELINE;
  // The bounded legacy-to-HTML migration registers its successfully published
  // HTML target as html-only through the state owner — not a general cross-
  // pipeline switch. The source version's mode is left untouched.
  ensureProductionModeContainer(next);
  next.production_mode.by_version[canonicalVersionKey(handoff.targetVersion)] = { mode: "html-only" };
  next.gates.html_content = "pending";
  next.gates.html_visual = "pending";
  next.gates.html_content_run_version = handoff.targetVersion;
  next.gates.html_visual_run_version = handoff.targetVersion;
  writeState(deckDir, next, { expectedStateSha: sha256(readFileSync(statePath(deckDir))) });
  appendHistory(deckDir, { type: "production_mode_registration", run_version: handoff.targetVersion, mode: "html-only", source: "legacy-to-html-migration", at: nowIso() });
  return Object.freeze({ status: "handoff-complete", target_version: handoff.targetVersion, current_node: next.current_node, registered_mode: "html-only" });
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
 * A markerless run with no durable state is the sole compatibility exception.
 * It remains explicitly labelled historical compatibility rather than being
 * upgraded, written, or presented as first-class `image2-only` authority.
 */
export function resolveRunProductionAdapter(deckDir, { runVersion, runDir, purpose = "observe" } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion });

  const inspection = inspectRunProductionMode(deckDir, {
    runVersion: exactVersion,
    purpose,
  });
  if (inspection.ok) {
    return Object.freeze({
      ok: true,
      run_version: exactVersion,
      mode: inspection.mode,
      policy: inspection.policy,
      adapter: inspection.policy.page_authority === "html" ? "html" : "whole-page-image2",
      compatibility: null,
      inspection,
    });
  }

  // Historical markerless decks can still be inspected and maintained without
  // creating state. This exception is intentionally narrow: a durable state
  // with a missing/corrupt v4 record never falls back to marker inference.
  if (!existsSync(statePath(deckDir))) {
    const marker = probeSourceMarkerForVersion(deckDir, exactVersion);
    const pipeline = marker.ok === false ? marker : pipelineFromSourceMarker(marker);
    if (pipeline.ok && pipeline.pipeline === LEGACY_PIPELINE) {
      const policy = productionPolicyForMode("image2-only");
      return Object.freeze({
        ok: true,
        run_version: exactVersion,
        mode: null,
        policy,
        adapter: "whole-page-image2",
        compatibility: "historical-markerless",
        inspection: Object.freeze({
          ok: false,
          code: inspection.code,
          source_branch: pipeline.branch,
          source_pipeline: pipeline.pipeline,
        }),
      });
    }
  }

  return Object.freeze({ ok: false, ...inspection });
}

/**
 * Preserve every node record while moving an inapplicable current pointer only
 * through an explicitly declared controller handoff. This runs inside the
 * production-mode transition CAS write; it never synthesizes `skipped` or
 * completion records for the old/new branch.
 */
function applyModeTransitionHandoff(state, toMode) {
  if (!state?.playbook || !state?.current_node) return null;
  const index = buildPlaybookIndex(DEFAULT_PLAYBOOK_DIR);
  const validation = validatePlaybookIndex(index);
  if (!validation.valid) throw new Error("playbook index is invalid; production-mode handoff cannot be resolved");
  const controller = index.controllers.get(state.playbook);
  if (!controller) throw new Error(`unknown active controller ${state.playbook}`);
  const active = controllerActiveNodeIds(index, state.playbook, toMode);
  if (active.includes(state.current_node)) return null;
  const current = resolveNode(index, state.playbook, state.current_node);
  const target = current?.modeTransitionHandoff;
  if (!target || !active.includes(target)) {
    throw new Error(`mode_transition_handoff required for inactive current node ${state.playbook}/${state.current_node}`);
  }
  const fromNode = state.current_node;
  state.current_node = target;
  return Object.freeze({ from_node: fromNode, to_node: target });
}

/**
 * Atomic same-pipeline production-mode transition for the exact run version.
 * `html-only <-> html-then-image2` (both html-first-v1) updates only the mode
 * record through expected-state CAS and appends a bounded audit event. Any
 * cross-pipeline request (`html-* <-> image2-only`) returns `transition_required`
 * WITHOUT mutating state, source, or generated bytes. Disabling required
 * refinement removes only the completion obligation; refinement records are
 * untouched. Enabling it makes refinement required again (revalidated by the
 * status projection).
 */
export function transitionProductionMode(deckDir, { runVersion, runDir, toMode, expectedStateSha = null, reason } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  if (!isProductionMode(toMode)) throw new TypeError("toMode must be a valid production mode");
  const versionKey = canonicalVersionKey(exactVersion);
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: production-mode transition state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: exactVersion });
  if (executionMismatch) return Object.freeze({ ok: false, ...executionMismatch });
  const byVersion = isPlainObject(state.production_mode?.by_version) ? state.production_mode.by_version : null;
  const currentRecord = byVersion?.[versionKey];
  const fromMode = isPlainObject(currentRecord) && hasExactKeys(currentRecord, ["mode"]) && isProductionMode(currentRecord.mode) ? currentRecord.mode : null;
  if (!fromMode) {
    return Object.freeze({ ok: false, code: "MODE_MISSING", run_version: exactVersion, version_key: versionKey });
  }
  const sourceMarker = probeSourceMarkerForVersion(deckDir, exactVersion);
  if (sourceMarker.ok === false) throw new Error(`source marker unavailable for ${exactVersion}`);
  const derived = pipelineFromSourceMarker(sourceMarker);
  const sourcePipeline = derived.ok ? derived.pipeline : null;
  const classification = classifyProductionModeTransition({ fromMode, toMode, sourcePipeline });
  if (!classification.ok) {
    return Object.freeze({ ok: false, code: classification.code || "transition_required", run_version: exactVersion, from_mode: fromMode, to_mode: toMode, kind: classification.kind });
  }
  if (fromMode === toMode) {
    return Object.freeze({ ok: true, status: "no-op", run_version: exactVersion, mode: toMode });
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  ensureProductionModeContainer(next);
  next.production_mode.by_version[versionKey] = { mode: toMode };
  const handoff = applyModeTransitionHandoff(next, toMode);
  const at = nowIso();
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, { type: "production_mode_transition", run_version: exactVersion, from_mode: fromMode, to_mode: toMode, ...(reason ? { reason: String(reason) } : {}), at });
  if (handoff) appendHistory(deckDir, { type: "production_mode_handoff", run_version: exactVersion, from_mode: fromMode, to_mode: toMode, ...handoff, at });
  // Best-effort metadata-mirror publication. State stays authoritative even if
  // this is interrupted; the next inspection reports repairable mirror drift.
  let mirror;
  try {
    mirror = repairProductionModeMirror(deckDir, { runVersion: exactVersion });
  } catch (error) {
    mirror = Object.freeze({ ok: false, code: "MIRROR_REPAIR_FAILED", reason: error.message || String(error) });
  }
  return Object.freeze({ ok: true, status: "transitioned", run_version: exactVersion, version_key: versionKey, from_mode: fromMode, to_mode: toMode, ...(handoff ? { handoff } : {}), mirror });
}

function updateMirrorField(text, key, value) {
  const re = new RegExp(`^${key}:.*$`, "m");
  const line = `${key}: ${value}`;
  if (re.test(text)) return text.replace(re, line);
  const trimmed = text.endsWith("\n") ? text : `${text}\n`;
  return `${trimmed}${line}\n`;
}

/**
 * State-owned metadata-mirror writer/repair. Rewrites the `production_mode` and
 * `production_mode_run_version` lines of project-metadata.yaml from the
 * authoritative state record for the exact version, preserving every other
 * field/comment. The mirror is display-only: it never supplies a missing mode,
 * overrides state, or introduces another journal/success store. A missing
 * metadata file or missing authoritative mode returns a typed non-write.
 */
export function repairProductionModeMirror(deckDir, { runVersion, runDir } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  const metadataPath = join(deckDir, "project-metadata.yaml");
  if (!existsSync(metadataPath)) return Object.freeze({ ok: false, code: "METADATA_MISSING", run_version: exactVersion });
  const state = readState(deckDir, { purpose: "observe", heal: false });
  if (state?.replacement_required || state?.corrupted) return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", run_version: exactVersion });
  const record = isPlainObject(state.production_mode?.by_version) ? state.production_mode.by_version[canonicalVersionKey(exactVersion)] : null;
  const mode = isPlainObject(record) && hasExactKeys(record, ["mode"]) && isProductionMode(record.mode) ? record.mode : null;
  if (!mode) return Object.freeze({ ok: false, code: "MODE_MISSING", run_version: exactVersion });
  let text = readFileSync(metadataPath, "utf8");
  text = updateMirrorField(text, "production_mode", mode);
  text = updateMirrorField(text, "production_mode_run_version", exactVersion);
  writeFileSync(metadataPath, text, "utf8");
  return Object.freeze({ ok: true, mirrored_mode: mode, mirrored_run_version: exactVersion });
}

/**
 * State-owned idempotent registration of a published same-pipeline target
 * version's production mode, copied from the source's authoritative record.
 * Verifies the target's canonical source marker matches the source mode's
 * derived pipeline and the source/target relationship (distinct versions) before
 * writing ONLY the target `by_version` record through expected-state CAS. It
 * never copies metadata, gates, refinement, or generated evidence as authority.
 *
 * Outcomes: `registered` (new), `already-current` (idempotent same-mode), or a
 * typed non-write (`SOURCE_MODE_MISSING`, `TARGET_MARKER_UNAVAILABLE`,
 * `PIPELINE_MISMATCH`, `TARGET_MODE_CONFLICT`). A visible target whose
 * registration did not commit surfaces as `mode_registration_required` at
 * inspection (the target lacks a mode); the mechanical registration here is the
 * repair and never asks the human to choose a mode.
 */
export function registerProductionModeFromSource(deckDir, { sourceRunVersion, sourceRunDir, targetRunVersion, targetRunDir, expectedStateSha = null } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion ?? sourceRunDir);
  const targetVersion = normalizeRunVersion(targetRunVersion ?? targetRunDir);
  if (!sourceVersion || !targetVersion) throw new TypeError("source and target run versions must be canonical vN");
  if (sourceVersion === targetVersion) throw new TypeError("source and target versions must differ");
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: registration state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: sourceVersion });
  if (executionMismatch) return Object.freeze({ ok: false, ...executionMismatch });
  const sourceKey = canonicalVersionKey(sourceVersion);
  const targetKey = canonicalVersionKey(targetVersion);
  const byVersion = isPlainObject(state.production_mode?.by_version) ? state.production_mode.by_version : null;
  const sourceRecord = byVersion?.[sourceKey];
  const sourceMode = isPlainObject(sourceRecord) && hasExactKeys(sourceRecord, ["mode"]) && isProductionMode(sourceRecord.mode) ? sourceRecord.mode : null;
  if (!sourceMode) return Object.freeze({ ok: false, code: "SOURCE_MODE_MISSING", source_version: sourceVersion });
  const policy = productionPolicyForMode(sourceMode);
  const targetMarker = probeSourceMarkerForVersion(deckDir, targetVersion);
  if (targetMarker.ok === false) return Object.freeze({ ok: false, code: "TARGET_MARKER_UNAVAILABLE", target_version: targetVersion, marker: targetMarker });
  const targetPipeline = pipelineFromSourceMarker(targetMarker);
  if (!targetPipeline.ok || targetPipeline.pipeline !== policy.pipeline) {
    return Object.freeze({ ok: false, code: "PIPELINE_MISMATCH", source_mode: sourceMode, derived_pipeline: policy.pipeline, target_pipeline: targetPipeline.ok ? targetPipeline.pipeline : null });
  }
  const existingTarget = byVersion?.[targetKey];
  if (isPlainObject(existingTarget) && hasExactKeys(existingTarget, ["mode"]) && isProductionMode(existingTarget.mode)) {
    if (existingTarget.mode === sourceMode && state.continuation_target_version === targetVersion) {
      return Object.freeze({ ok: true, status: "already-current", target_version: targetVersion, mode: sourceMode });
    }
    if (existingTarget.mode !== sourceMode) {
      return Object.freeze({ ok: false, code: "TARGET_MODE_CONFLICT", target_version: targetVersion, existing: existingTarget.mode, expected: sourceMode });
    }
  }
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  ensureProductionModeContainer(next);
  if (!existingTarget) next.production_mode.by_version[targetKey] = { mode: sourceMode };
  // This publication owner is the only same-pipeline version creator. The
  // target directory and canonical source were verified above, so bind the
  // inactive continuation selector in the same CAS-protected state commit.
  next.continuation_target_version = targetVersion;
  writeState(deckDir, next, { expectedStateSha, updatedAt: nowIso() });
  appendHistory(deckDir, { type: "production_mode_registration", run_version: targetVersion, mode: sourceMode, source_version: sourceVersion, source: "same-pipeline-version", at: nowIso() });
  return Object.freeze({ ok: true, status: existingTarget ? "already-current" : "registered", target_version: targetVersion, source_version: sourceVersion, mode: sourceMode });
}

export const IMAGE2_DELIVERY_REVIEW_SCHEMA = "pptmaker-image2-delivery-review-v1";
export const IMAGE2_PROVIDER_AUTHORIZATION_SCHEMA = "pptmaker-image2-provider-authorization-v1";
const IMAGE2_AUTH_OPERATIONS = Object.freeze(["style-master", "pilot", "build", "refresh"]);
const IMAGE2_FINAL_REVIEW_NODE = "checkpoint-image2-final-review";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

/** Build the opaque, secret-free generation-profile binding used by Image2 authorization. */
export function image2AuthorizationProfileFingerprint({ operation, profile } = {}) {
  if (!IMAGE2_AUTH_OPERATIONS.includes(operation)) throw new TypeError("operation must be style-master, pilot, build, or refresh");
  if (!isPlainObject(profile)) throw new TypeError("profile must be a plain object");
  return sha256(stableStringify({
    schema: "pptmaker-image2-provider-profile-v1",
    operation,
    profile,
  }));
}

function confinedRunRelative(runDir, absPath) {
  const rel = relative(resolve(runDir), resolve(absPath));
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || pathIsAbsolute(rel) || rel.includes("\\")) return null;
  return rel;
}
function pathIsAbsolute(p) { return p.startsWith("/"); }

function fileLineage(runDir, absPath) {
  if (!absPath || !existsSync(absPath)) return null;
  const rel = confinedRunRelative(runDir, absPath);
  if (!rel) return null;
  let stat;
  try { stat = lstatSync(absPath); } catch { return null; }
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  return Object.freeze({ path: rel, sha256: sha256(readFileSync(absPath)) });
}

/** Derive current whole-page delivery lineage the caller must NOT supply. */
function resolveImage2DeliveryLineage(deckDir, runVersion, state) {
  const runDir = join(deckDir, "3_versions", runVersion);
  const genDir = join(runDir, "_generated");
  let pptxPath = null;
  const pptDir = join(genDir, "ppt");
  if (existsSync(pptDir)) {
    const candidate = readdirSync(pptDir).filter((f) => f.endsWith(".pptx") && !f.endsWith(".backup.pptx")).sort()[0];
    if (candidate) pptxPath = join(pptDir, candidate);
  }
  const contactSheet = fileLineage(runDir, join(genDir, "preview", "contact_sheet.jpg"));
  const pptx = fileLineage(runDir, pptxPath);
  const notes = fileLineage(runDir, notesReceiptPath(runDir));
  const headerRec = reservedVersionRecord(state, "header-review", runVersion);
  const headerReviewFingerprint = headerRec ? sha256(stableStringify(headerRec)) : null;
  return { contact_sheet: contactSheet, pptx, notes_receipt: notes, header_review_fingerprint: headerReviewFingerprint };
}

function validImage2AuthScope(scope) {
  if (!isPlainObject(scope)) return false;
  if (Array.isArray(scope.slide_ids)) {
    if (scope.slide_ids.length === 0) return false;
    if (!scope.slide_ids.every((id) => typeof id === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(id))) return false;
    const sorted = [...scope.slide_ids].sort();
    return sorted.every((id, i) => id === sorted[i]);
  }
  return scope.role === "style-master";
}

/** Normalize an authorization scope to the canonical sorted form (or null). */
function normalizeImage2AuthScope(scope) {
  if (isPlainObject(scope) && Array.isArray(scope.slide_ids)) {
    const ids = scope.slide_ids.filter((id) => typeof id === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(id)).sort();
    return { slide_ids: ids };
  }
  if (isPlainObject(scope) && scope.role === "style-master") return { role: "style-master" };
  return null;
}

function validImage2DeliveryRecord(record, runVersion) {
  const keys = ["schema", "run_version", "decision", "reason", "contact_sheet_path", "contact_sheet_sha256", "pptx_path", "pptx_sha256", "notes_receipt_path", "notes_receipt_sha256", "header_review_fingerprint", "execution_id", "decided_at"];
  if (!hasExactKeys(record, keys)) return false;
  if (record.schema !== IMAGE2_DELIVERY_REVIEW_SCHEMA) return false;
  if (record.run_version !== runVersion) return false;
  if (!["proceed", "repair", "redirect"].includes(record.decision)) return false;
  if (!validIsoTimestamp(record.decided_at) || typeof record.execution_id !== "string" || !record.execution_id) return false;
  if (!validNullableSha256(record.header_review_fingerprint)) return false;
  const lineages = [
    [record.contact_sheet_path, record.contact_sheet_sha256],
    [record.pptx_path, record.pptx_sha256],
    [record.notes_receipt_path, record.notes_receipt_sha256],
  ];
  for (const [p, s] of lineages) {
    if (typeof p !== "string" || !p || typeof s !== "string" || !SHA256_RE.test(s)) return false;
  }
  if (record.decision === "proceed") {
    if (record.reason !== null) return false;
    if (record.header_review_fingerprint === null) return false;
  } else {
    if (typeof record.reason !== "string" || !record.reason.trim() || record.reason !== record.reason.trim()) return false;
  }
  return true;
}

function validImage2AuthorizationRecord(record, runVersion) {
  const keys = ["schema", "run_version", "operation", "scope", "profile_fingerprint", "max_submissions", "execution_id", "decided_at"];
  if (!hasExactKeys(record, keys)) return false;
  if (record.schema !== IMAGE2_PROVIDER_AUTHORIZATION_SCHEMA) return false;
  if (record.run_version !== runVersion) return false;
  if (!IMAGE2_AUTH_OPERATIONS.includes(record.operation)) return false;
  if (!validImage2AuthScope(record.scope)) return false;
  if (!SHA256_RE.test(record.profile_fingerprint || "")) return false;
  if (!Number.isInteger(record.max_submissions) || record.max_submissions <= 0) return false;
  if (typeof record.execution_id !== "string" || !record.execution_id) return false;
  if (!validIsoTimestamp(record.decided_at)) return false;
  return true;
}

function validateImage2MapsStructure(state, errors) {
  for (const [mapKey, validator] of [["image2_delivery_review", validImage2DeliveryRecord], ["image2_provider_authorization", validImage2AuthorizationRecord]]) {
    const map = state[mapKey];
    if (map === undefined) continue;
    if (!isPlainObject(map) || !isPlainObject(map.by_version)) { errors.push(`${mapKey} must contain by_version`); continue; }
    for (const [key, record] of Object.entries(map.by_version)) {
      const runVersion = versionFromReservedKey(key);
      if (!runVersion) { errors.push(`invalid ${mapKey} version key ${key}`); continue; }
      if (!validator(record, runVersion)) errors.push(`invalid ${mapKey} record ${key}`);
    }
  }
}

/**
 * State-owned first-class Image2 delivery/final-review writer (`--record-
 * image2-delivery-review`). Derives current whole-page header/contact-sheet/
 * PPTX/notes lineage from the run dir (the caller supplies none of it), binds
 * the active execution ID, and writes through expected-state CAS. `proceed`
 * requires complete current evidence with no reason; `repair`/`redirect` require
 * a bounded reason and leave completion false. Rejects HTML modes. This change
 * adds no force/waiver path.
 */
export function recordImage2DeliveryReview(deckDir, { runVersion, runDir, decision, reason = null, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  if (!["proceed", "repair", "redirect"].includes(decision)) throw new TypeError("decision must be proceed, repair, or redirect");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`image2 delivery review unavailable: ${inspection.code}`);
  if (inspection.mode !== "image2-only") throw new Error("image2 delivery review is first-class image2-only; HTML modes use the HTML delivery review");
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: image2 delivery review state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: exactVersion });
  if (executionMismatch) throw new Error(`execution_run_version_mismatch: active=${executionMismatch.active_run_version || "none"} requested=${exactVersion}`);
  if (state.playbook !== "create-deck" || !state.execution_id || state.current_node !== IMAGE2_FINAL_REVIEW_NODE) {
    throw new Error("active first-class Image2 final-review node is required");
  }
  const activeFinalReview = activeRecord(state, IMAGE2_FINAL_REVIEW_NODE);
  if (!activeFinalReview || !["in_progress", "completed"].includes(activeFinalReview.status)) {
    throw new Error("active first-class Image2 final-review node is required");
  }
  const lineage = resolveImage2DeliveryLineage(deckDir, exactVersion, state);
  const trimmedReason = reason == null ? null : String(reason).trim();
  if (decision === "proceed") {
    if (trimmedReason !== null) throw new Error("proceed must not carry a reason");
    if (!lineage.contact_sheet || !lineage.pptx || !lineage.notes_receipt || !lineage.header_review_fingerprint) {
      throw new Error("proceed requires current contact sheet, PPTX, notes receipt, and header review evidence");
    }
  } else {
    if (!trimmedReason) throw new Error(`${decision} requires a non-empty bounded reason`);
  }
  const record = {
    schema: IMAGE2_DELIVERY_REVIEW_SCHEMA,
    run_version: exactVersion,
    decision,
    reason: trimmedReason,
    contact_sheet_path: lineage.contact_sheet?.path,
    contact_sheet_sha256: lineage.contact_sheet?.sha256,
    pptx_path: lineage.pptx?.path,
    pptx_sha256: lineage.pptx?.sha256,
    notes_receipt_path: lineage.notes_receipt?.path,
    notes_receipt_sha256: lineage.notes_receipt?.sha256,
    header_review_fingerprint: lineage.header_review_fingerprint,
    execution_id: state.execution_id,
    decided_at: nowIso(),
  };
  if (!validImage2DeliveryRecord(record, exactVersion)) throw new Error("derived image2 delivery review record is invalid");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  if (!isPlainObject(next.image2_delivery_review) || !isPlainObject(next.image2_delivery_review.by_version)) next.image2_delivery_review = { by_version: {} };
  next.image2_delivery_review.by_version[canonicalVersionKey(exactVersion)] = record;
  const at = record.decided_at;
  const reviewFingerprint = sha256(stableStringify(record));
  next.nodes ||= {};
  next.nodes[IMAGE2_FINAL_REVIEW_NODE] = {
    ...next.nodes[IMAGE2_FINAL_REVIEW_NODE],
    status: "completed",
    execution_id: next.execution_id,
    run_version: exactVersion,
    decision: { value: decision, kind: "user", at },
    image2_delivery_review: {
      run_version: exactVersion,
      fingerprint: reviewFingerprint,
    },
    completed: at,
  };
  next.current_node = IMAGE2_FINAL_REVIEW_NODE;
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  appendHistory(deckDir, { type: "image2_delivery_review", run_version: exactVersion, decision, at });
  return Object.freeze({ ok: true, run_version: exactVersion, decision, record: Object.freeze(structuredClone(record)), node: IMAGE2_FINAL_REVIEW_NODE });
}

/**
 * State-owned first-class Image2 provider-authorization writer. Persists the
 * active controller node's typed human authorization bound to exact run
 * version, operation, sorted stable slide IDs (or the style-master role),
 * generation-profile fingerprint, positive max submission count, active
 * execution ID, and decision time. First-class image2-only only; reuses one
 * state-owned map rather than a second provider-attempt store.
 */
export function recordImage2ProviderAuthorization(deckDir, { runVersion, runDir, operation, scope, profileFingerprint, maxSubmissions, expectedStateSha = null } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) throw new TypeError("runVersion/runDir must name a canonical vN version");
  if (!IMAGE2_AUTH_OPERATIONS.includes(operation)) throw new TypeError("operation must be style-master, pilot, build, or refresh");
  if (!SHA256_RE.test(profileFingerprint || "")) throw new TypeError("profileFingerprint must be a sha256");
  const normalizedScope = normalizeImage2AuthScope(scope);
  if (!normalizedScope || !validImage2AuthScope(normalizedScope)) throw new TypeError("scope must be {role:'style-master'} or sorted non-empty slide_ids");
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) throw new TypeError("maxSubmissions must be a positive integer");
  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) throw new Error(`image2 authorization unavailable: ${inspection.code}`);
  if (inspection.mode !== "image2-only") throw new Error("image2 provider authorization is first-class image2-only");
  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: image2 authorization state is unavailable");
  const executionMismatch = selectedExecutionMismatch(state, { runVersion: exactVersion });
  if (executionMismatch) throw new Error(`execution_run_version_mismatch: active=${executionMismatch.active_run_version || "none"} requested=${exactVersion}`);
  const record = {
    schema: IMAGE2_PROVIDER_AUTHORIZATION_SCHEMA,
    run_version: exactVersion,
    operation,
    scope: Object.freeze(structuredClone(normalizedScope)),
    profile_fingerprint: profileFingerprint,
    max_submissions: maxSubmissions,
    execution_id: state.execution_id,
    decided_at: nowIso(),
  };
  if (!validImage2AuthorizationRecord(record, exactVersion)) throw new Error("derived image2 authorization record is invalid");
  const next = structuredClone(state);
  delete next.durable_state_present;
  delete next._healed;
  delete next._heal_pending;
  next.schema_version = STATE_SCHEMA_VERSION;
  if (!isPlainObject(next.image2_provider_authorization) || !isPlainObject(next.image2_provider_authorization.by_version)) next.image2_provider_authorization = { by_version: {} };
  next.image2_provider_authorization.by_version[canonicalVersionKey(exactVersion)] = record;
  writeState(deckDir, next, { expectedStateSha, updatedAt: record.decided_at });
  appendHistory(deckDir, { type: "image2_provider_authorization", run_version: exactVersion, operation, at: record.decided_at });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
}

/**
 * Re-derive and verify the authorization immediately before a first-class
 * Image2 transport submit. The caller must already have proved that it will
 * submit at least one request; reuse-only paths never call this function.
 */
export function inspectImage2ProviderAuthorization(deckDir, { runVersion, runDir, operation, scope, profileFingerprint, maxSubmissions } = {}) {
  const exactVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  if (!IMAGE2_AUTH_OPERATIONS.includes(operation)) return Object.freeze({ ok: false, code: "AUTHORIZATION_OPERATION_INVALID" });
  const normalizedScope = normalizeImage2AuthScope(scope);
  if (!normalizedScope || !validImage2AuthScope(normalizedScope)) return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_INVALID" });
  if (!SHA256_RE.test(profileFingerprint || "")) return Object.freeze({ ok: false, code: "AUTHORIZATION_PROFILE_INVALID" });
  if (!Number.isInteger(maxSubmissions) || maxSubmissions <= 0) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_INVALID" });

  const inspection = inspectRunProductionMode(deckDir, { runVersion: exactVersion, purpose: "execute" });
  if (!inspection.ok) return Object.freeze({ ok: false, code: inspection.code, run_version: exactVersion });
  if (inspection.mode !== "image2-only") return Object.freeze({ ok: false, code: "AUTHORIZATION_NOT_APPLICABLE", run_version: exactVersion, mode: inspection.mode });

  const state = readState(deckDir, { purpose: "execute", heal: false });
  if (state?.replacement_required || state?.corrupted) return Object.freeze({ ok: false, code: "STATE_UNAVAILABLE", run_version: exactVersion });
  const record = state.image2_provider_authorization?.by_version?.[canonicalVersionKey(exactVersion)];
  if (!validImage2AuthorizationRecord(record, exactVersion)) return Object.freeze({ ok: false, code: "AUTHORIZATION_MISSING", run_version: exactVersion });
  if (record.execution_id !== state.execution_id) return Object.freeze({ ok: false, code: "AUTHORIZATION_EXECUTION_STALE", run_version: exactVersion });
  if (record.operation !== operation) return Object.freeze({ ok: false, code: "AUTHORIZATION_OPERATION_MISMATCH", run_version: exactVersion, expected: operation, actual: record.operation });
  if (stableStringify(record.scope) !== stableStringify(normalizedScope)) return Object.freeze({ ok: false, code: "AUTHORIZATION_SCOPE_MISMATCH", run_version: exactVersion });
  if (record.profile_fingerprint !== profileFingerprint) return Object.freeze({ ok: false, code: "AUTHORIZATION_PROFILE_MISMATCH", run_version: exactVersion });
  if (record.max_submissions < maxSubmissions) return Object.freeze({ ok: false, code: "AUTHORIZATION_COUNT_EXCEEDED", run_version: exactVersion, authorized: record.max_submissions, required: maxSubmissions });
  return Object.freeze({ ok: true, run_version: exactVersion, record: Object.freeze(structuredClone(record)) });
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
  const rawBinding = resolveV5RunBinding(parsed.value, deckDir);
  // The only pre-v5 exception is deliberately private to the closed legacy
  // confirmation writer below. It receives unhealed bytes solely so it can
  // re-inspect the exact source, preview, hash, and mode before one atomic
  // v5-binding write. Ordinary reads remain replacement-required.
  const pendingLegacyConfirmation = !rawBinding.ok && opts.allowLegacyConfirmation === true
    ? legacyConfirmationSourceVersion(parsed.value, opts)
    : null;
  if (!rawBinding.ok && !pendingLegacyConfirmation) return replacementRequired(rawBinding.reason, classification.pipeline);
  if (pendingLegacyConfirmation && shouldHeal) {
    return replacementRequired("legacy confirmation must be completed through its closed confirmation operation", classification.pipeline);
  }
  if (!shouldHeal) {
    const mismatch = selectedExecutionMismatch(parsed.value, opts);
    return mismatch ? Object.freeze({ ...parsed.value, ...mismatch }) : parsed.value;
  }
  const { state, dirty } = healState(parsed.value, {
    pipeline: opts.pipeline || classification.pipeline,
    deckDir,
    runVersionBinding: rawBinding,
  });
  const bindingErrors = executionBindingErrors(state);
  if (bindingErrors.length > 0) return replacementRequired(bindingErrors[0], classification.pipeline);
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
  const mismatch = selectedExecutionMismatch(state, opts);
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
  const bindingErrors = executionBindingErrors(state);
  if (bindingErrors.length > 0) throw new Error(`execution_run_version_mismatch: ${bindingErrors[0]}`);
  const continuationTargetError = continuationTargetVisibilityError(state, deckDir);
  if (continuationTargetError) throw new Error(`continuation_target_invalid: ${continuationTargetError}`);
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
 * apply record after the Phase-5 migration owner has verified the exact
 * preview receipt. Shared state intentionally does not import a Phase module.
 */
export function recordHtmlMigrationConfirmation(sourceRunDir, { planHash, oldSideMode, inspection } = {}) {
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
  const current = readState(deckDir, { purpose: "execute", heal: false, runDir, allowLegacyConfirmation: true });
  if (current?.replacement_required || current?.corrupted) throw new Error("migration source state is unusable");
  const historicalBinding = legacyConfirmationSourceVersion(current, { runDir });
  if (current?.execution_run_version_mismatch && !historicalBinding) throw new Error("replacement_required: migration confirmation run binding is unavailable");
  if (current.playbook !== "migrate-import" || !current.execution_id) throw new Error("active migrate-import confirmation execution is required");
  const executionId = current.execution_id;
  const confirmed = current.nodes?.["confirm-html-migration"];
  const preview = current.nodes?.["preview-html-migration"];
  const activeApply = current.nodes?.["apply-html-migration"];
  const sourceVersion = basename(runDir);

  if (!isPlainObject(inspection) ||
    inspection.source_version !== sourceVersion ||
    inspection.plan_hash !== planHash ||
    inspection.old_side_mode !== oldSideMode ||
    normalizeRunVersion(inspection.target_version) !== inspection.target_version) {
    throw new Error("migration confirmation inspection is missing or drifted");
  }

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
  next.schema_version = STATE_SCHEMA_VERSION;
  next.run_version = sourceVersion;
  next.nodes["confirm-html-migration"] = {
    ...next.nodes["confirm-html-migration"],
    status: "completed",
    execution_id: executionId,
    run_version: sourceVersion,
    decision: { value: "apply", kind: "user", at },
    completed: at,
  };
  next.nodes["preview-html-migration"] = {
    ...next.nodes["preview-html-migration"],
    execution_id: executionId,
    run_version: sourceVersion,
  };
  next.nodes["apply-html-migration"] = {
    status: "in_progress",
    execution_id: executionId,
    run_version: sourceVersion,
    migration_plan_hash: planHash,
    old_side_mode: oldSideMode,
    migration_source_version: sourceVersion,
    started: at,
  };
  next.current_node = "apply-html-migration";
  bindOrdinaryStackFrames(next, sourceVersion);
  const expectedStateSha = sha256(readFileSync(statePath(deckDir)));
  writeState(deckDir, next, { expectedStateSha, updatedAt: at });
  return Object.freeze({ status: "confirmed", source_version: sourceVersion, target_version: inspection.target_version, plan_hash: planHash, old_side_mode: oldSideMode, current_node: "apply-html-migration" });
}

/**
 * Capture a confirmed cross-pipeline preview as the sole active transition.
 * Candidate preparation and preview deliberately live outside state; this is
 * the first pointer-changing operation and is fenced by the exact source
 * state bytes and all preview receipts.
 */
export function confirmProductionModeTransition(deckDir, {
  sourceRunVersion,
  sourceRunDir,
  targetRunVersion,
  targetMode,
  planHash,
  candidateReceiptSha256,
  targetIntake,
  targetIntakeSha256,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = selectedRunVersion({ runVersion: sourceRunVersion, runDir: sourceRunDir });
  const targetVersion = normalizeRunVersion(targetRunVersion);
  if (!sourceVersion || !targetVersion || sourceVersion === targetVersion) throw new TypeError("transition source and target must be distinct canonical run versions");
  if (!isProductionMode(targetMode) || !SHA256_RE.test(planHash || "") || !SHA256_RE.test(candidateReceiptSha256 || "")) {
    throw new TypeError("transition mode, plan hash, and candidate receipt must be exact");
  }
  if (!validTransitionIntake(targetIntake)) throw new TypeError("transition target intake must contain every explicit intake field");
  const intakeSha = sha256(Buffer.from(stableStringify(targetIntake)));
  if (!SHA256_RE.test(targetIntakeSha256 || "") || targetIntakeSha256 !== intakeSha) throw new Error("transition target intake digest is stale or invalid");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");

  const versions = visibleRunVersions(deckDir);
  const expectedTarget = `v${(versions.reduce((highest, version) => Math.max(highest, Number(version.slice(1))), 0) + 1)}`;
  if (targetVersion !== expectedTarget) throw new Error(`transition target must be anticipated ${expectedTarget}`);
  if (existsSync(join(deckDir, "3_versions", targetVersion))) throw new Error("transition target version already exists");

  const current = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: transition source state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: transition source belongs to another run version");
  if (!current.playbook || !current.execution_id || current.run_version !== sourceVersion) throw new Error("active source execution is required");
  if (current.playbook === "migrate-import" && current.current_node === TRANSITION_APPLY_NODE) throw new Error("transition apply is already active");
  if (current.playbook_stack.some(isTransitionSuspensionFrame)) throw new Error("transition suspension is already active");
  const sourceMode = current.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)]?.mode;
  if (!isProductionMode(sourceMode)) throw new Error("transition source has no authoritative production mode");
  const sourcePolicy = productionPolicyForMode(sourceMode);
  const targetPolicy = productionPolicyForMode(targetMode);
  if (sourcePolicy.pipeline === targetPolicy.pipeline) throw new Error("same-pipeline mode changes must use the in-place transition");
  if (current.production_mode?.by_version?.[canonicalVersionKey(targetVersion)]) throw new Error("transition target mode already exists");

  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: transition source state precondition changed");
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
    target_pipeline: targetPolicy.pipeline,
    transition_plan_hash: planHash,
    parent_stack: deepClone(current.playbook_stack),
  };
  const at = nowIso();
  const transitionExecutionId = newExecutionId();
  const next = structuredClone(current);
  next.schema_version = STATE_SCHEMA_VERSION;
  next.playbook = "migrate-import";
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
    transition_target_pipeline: targetPolicy.pipeline,
    started: at,
  };
  next.playbook_stack = [frame];
  writeState(deckDir, next, { expectedStateSha: sourceStateSha, updatedAt: at });
  appendHistory(deckDir, {
    type: "production_mode_transition_confirmed",
    source_execution_id: frame.execution_id,
    source_version: sourceVersion,
    source_mode: sourceMode,
    target_version: targetVersion,
    target_mode: targetMode,
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
    target_pipeline: targetPolicy.pipeline,
    plan_hash: planHash,
    transition_execution_id: transitionExecutionId,
  });
}

/** Restore the exact captured source only when no anticipated target exists. */
export function restoreProductionModeTransitionSource(deckDir, { sourceRunVersion, planHash, expectedStateSha = null } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("transition source version and plan hash are required");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");
  const current = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: transition state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: transition source belongs to another run version");
  const record = activeTransitionRecord(current);
  const frame = current.playbook_stack?.[0];
  if (!record || !isTransitionSuspensionFrame(frame) || frame.source_run_version !== sourceVersion || record.transition_plan_hash !== planHash || frame.transition_plan_hash !== planHash) {
    throw new Error("active transition checkpoint is missing or drifted");
  }
  if (existsSync(join(deckDir, "3_versions", record.transition_target_version))) throw new Error("CONFLICT: transition target is visible and must be registered or inspected");
  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: transition state precondition changed");
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
    type: "production_mode_transition_source_restored",
    source_execution_id: frame.execution_id,
    source_version: sourceVersion,
    target_version: record.transition_target_version,
    plan_hash: planHash,
  });
  return Object.freeze({ status: "source_restored", source_version: sourceVersion, target_version: record.transition_target_version, plan_hash: planHash });
}

function transitionJournalSnapshot(deckDir, record, ownerToken) {
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
    journal.target_version !== record.transition_target_version || journal.target_mode !== record.transition_target_mode || journal.target_pipeline !== record.transition_target_pipeline) {
    throw new Error("transition apply journal does not match the active checkpoint");
  }
  return Object.freeze({ path, bytes, sha256: sha256(bytes), journal, age_ms: Math.max(0, Date.now() - claimedAt) });
}

/**
 * Persist the human no-active-apply statement for one exact uncertain journal.
 * The token is only compared in memory and is intentionally absent from both
 * state and return values.
 */
export function recordProductionModeTransitionRecoveryConfirmation(deckDir, {
  sourceRunVersion,
  planHash,
  ownerToken,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("transition source version and plan hash are required");
  if (expectedStateSha !== null && !SHA256_RE.test(expectedStateSha)) throw new TypeError("expectedStateSha must be a lowercase SHA-256");
  const current = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: transition state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: transition source belongs to another run version");
  const record = activeTransitionRecord(current);
  if (!record || record.transition_plan_hash !== planHash) throw new Error("active transition checkpoint is missing or drifted");
  const snapshot = transitionJournalSnapshot(deckDir, record, ownerToken);
  if (snapshot.journal.owner_host.trim().toLowerCase() === hostname().trim().toLowerCase()) throw new Error("transition journal is same-host; uncertain-owner confirmation is inapplicable");
  if (snapshot.age_ms < TRANSITION_UNCERTAIN_RECOVERY_AGE_MS) throw new Error("transition journal is not old enough for uncertain-owner recovery confirmation");
  const sourceBytes = readFileSync(statePath(deckDir));
  const sourceStateSha = sha256(sourceBytes);
  if (expectedStateSha && expectedStateSha !== sourceStateSha) throw new Error("CONFLICT: transition state precondition changed");
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
export function recordActiveProductionModeTransitionRecoveryConfirmation(deckDir, {
  sourceRunVersion,
  ownerToken,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion) throw new TypeError("transition source version is required");
  const current = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: transition state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: transition source belongs to another run version");
  const record = activeTransitionRecord(current);
  if (!record) throw new Error("active transition checkpoint is missing or drifted");
  return recordProductionModeTransitionRecoveryConfirmation(deckDir, {
    sourceRunVersion: sourceVersion,
    planHash: record.transition_plan_hash,
    ownerToken,
    expectedStateSha: sha256(readFileSync(statePath(deckDir))),
  });
}

/** Re-inspect the durable journal before an uncertain-owner takeover. */
export function verifyProductionModeTransitionRecoveryConfirmation(deckDir, { sourceRunVersion, planHash, ownerToken } = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) return Object.freeze({ ok: false, code: "TRANSITION_RECOVERY_INPUT_INVALID" });
  const current = readState(deckDir, { purpose: "observe", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted || current?.execution_run_version_mismatch) return Object.freeze({ ok: false, code: current?.code || "TRANSITION_STATE_UNAVAILABLE" });
  const record = activeTransitionRecord(current);
  if (!record || record.transition_plan_hash !== planHash) return Object.freeze({ ok: false, code: "TRANSITION_CHECKPOINT_DRIFT" });
  let snapshot;
  try { snapshot = transitionJournalSnapshot(deckDir, record, ownerToken); } catch { return Object.freeze({ ok: false, code: "TRANSITION_JOURNAL_DRIFT" }); }
  const confirmation = record.transition_recovery_confirmation;
  const matches = isPlainObject(confirmation) && confirmation.kind === "user" && confirmation.decision === "no-active-apply" &&
    confirmation.source_execution_id === record.transition_source_execution_id && confirmation.source_version === record.transition_source_version &&
    confirmation.target_version === record.transition_target_version && confirmation.plan_hash === record.transition_plan_hash &&
    confirmation.journal_sha256 === snapshot.sha256 && validIsoTimestamp(confirmation.confirmed_at);
  if (!matches) return Object.freeze({ ok: false, code: "TRANSITION_RECOVERY_CONFIRMATION_REQUIRED" });
  if (snapshot.journal.owner_host.trim().toLowerCase() === hostname().trim().toLowerCase() || snapshot.age_ms < TRANSITION_UNCERTAIN_RECOVERY_AGE_MS) return Object.freeze({ ok: false, code: "TRANSITION_JOURNAL_NOT_UNCERTAIN_OR_OLD" });
  return Object.freeze({ ok: true, source_version: record.transition_source_version, target_version: record.transition_target_version, plan_hash: record.transition_plan_hash, journal_sha256: snapshot.sha256 });
}

/** Complete the only terminal cross-pipeline path after a target-local receipt. */
export function completeProductionModeTransitionHandoff(deckDir, {
  sourceRunVersion,
  planHash,
  receiptSha256 = null,
  sourceControlFingerprint = null,
  expectedStateSha = null,
} = {}) {
  const sourceVersion = normalizeRunVersion(sourceRunVersion);
  if (!sourceVersion || !SHA256_RE.test(planHash || "")) throw new TypeError("transition source version and plan hash are required");
  if (receiptSha256 !== null && !SHA256_RE.test(receiptSha256)) throw new TypeError("receiptSha256 must be a lowercase SHA-256");
  if (sourceControlFingerprint !== null && !SHA256_RE.test(sourceControlFingerprint)) throw new TypeError("sourceControlFingerprint must be a lowercase SHA-256");
  const current = readState(deckDir, { purpose: "execute", heal: false, runVersion: sourceVersion });
  if (current?.replacement_required || current?.corrupted) throw new Error("replacement_required: transition state is unavailable");
  if (current?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: transition source belongs to another run version");
  const record = activeTransitionRecord(current);
  const frame = current.playbook_stack?.[0];
  if (!record || !isTransitionSuspensionFrame(frame) || record.transition_plan_hash !== planHash || frame.transition_plan_hash !== planHash) throw new Error("active transition checkpoint is missing or drifted");
  const targetDir = join(deckDir, "3_versions", record.transition_target_version);
  const receiptPath = join(targetDir, "_generated", "qa", "production_mode_transition.json");
  if (!existsSync(targetDir) || !existsSync(receiptPath)) throw new Error("mode_registration_required: transition target receipt is not visible");
  const receiptBytes = readFileSync(receiptPath);
  const actualReceiptSha = sha256(receiptBytes);
  if (receiptSha256 && receiptSha256 !== actualReceiptSha) throw new Error("transition target receipt changed");
  let receipt;
  try { receipt = JSON.parse(receiptBytes.toString("utf8")); } catch { throw new Error("transition target receipt is invalid"); }
  if (!isPlainObject(receipt) || receipt.schema !== "pptmaker-production-mode-transition-success-v1" ||
    receipt.plan_hash !== planHash || receipt.source_execution_id !== record.transition_source_execution_id ||
    receipt.source_version !== sourceVersion || receipt.target_version !== record.transition_target_version ||
    receipt.target_mode !== record.transition_target_mode || receipt.target_pipeline !== record.transition_target_pipeline ||
    receipt.candidate_receipt_sha256 !== record.transition_candidate_receipt_sha256 ||
    receipt.target_intake_sha256 !== record.transition_target_intake_sha256 || !SHA256_RE.test(receipt.source_control_fingerprint || "")) {
    throw new Error("transition target receipt does not match the active checkpoint");
  }
  if (sourceControlFingerprint && sourceControlFingerprint !== receipt.source_control_fingerprint) throw new Error("transition source/control fingerprint changed");
  const marker = probeSourceMarkerForVersion(deckDir, record.transition_target_version);
  const targetPipeline = pipelineFromSourceMarker(marker);
  if (!targetPipeline?.ok || targetPipeline.pipeline !== record.transition_target_pipeline) throw new Error("transition target marker does not match selected mode");
  const required = [join(deckDir, "deck-guide.md"), join(targetDir, "slide-specifications.md"), join(targetDir, "overrides", "visual-style", "color_palette.json")];
  if (required.some((path) => !existsSync(path))) throw new Error("transition target baseline prerequisites are incomplete");
  const stateBytes = readFileSync(statePath(deckDir));
  const stateSha = sha256(stateBytes);
  if (expectedStateSha && expectedStateSha !== stateSha) throw new Error("CONFLICT: transition state precondition changed");
  const at = nowIso();
  const targetExecutionId = newExecutionId();
  const baseline = { target_execution_id: targetExecutionId, target_run_version: record.transition_target_version, plan_hash: planHash, success_receipt_sha256: actualReceiptSha, source_control_fingerprint: receipt.source_control_fingerprint };
  const authorNode = record.transition_target_mode === "image2-only" ? "author-whole-page-content" : "author-structured-content";
  const configureNode = record.transition_target_mode === "image2-only" ? "configure-whole-page-visual-system" : "configure-visual-system";
  const nextNode = record.transition_target_mode === "image2-only" ? "authorize-image2-style-master" : "preview-content";
  const next = structuredClone(current);
  next.playbook = "create-deck";
  next.current_node = nextNode;
  next.execution_id = targetExecutionId;
  next.execution_started_at = at;
  next.run_version = record.transition_target_version;
  next.pipeline = record.transition_target_pipeline;
  ensureProductionModeContainer(next);
  const existingTargetMode = next.production_mode.by_version[canonicalVersionKey(record.transition_target_version)]?.mode;
  if (existingTargetMode && existingTargetMode !== record.transition_target_mode) throw new Error("CONFLICT: transition target mode conflicts with receipt");
  next.production_mode.by_version[canonicalVersionKey(record.transition_target_version)] = { mode: record.transition_target_mode };
  next.nodes = preserveReservedNodes(current.nodes);
  next.nodes.instantiation = { status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at, transition_baseline: baseline };
  next.nodes["checkpoint-intake"] = {
    status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at,
    decision: { value: "proceed", kind: "user", at }, evidence: { "intake-confirmed": { met: true, kind: "user", at, note: record.transition_target_intake_sha256 } },
    transition_baseline: { ...baseline, target_intake_sha256: record.transition_target_intake_sha256 },
  };
  for (const [nodeId, evidenceKey] of [[authorNode, authorNode === "author-whole-page-content" ? "whole-page-content-authored" : "structured-content-authored"], [configureNode, configureNode === "configure-whole-page-visual-system" ? "whole-page-visual-system-configured" : "visual-system-configured"]]) {
    next.nodes[nodeId] = { status: "completed", execution_id: targetExecutionId, run_version: record.transition_target_version, completed: at, evidence: { [evidenceKey]: { met: true, kind: "agent", at, note: receipt.source_control_fingerprint } }, transition_baseline: baseline };
  }
  next.playbook_stack = [];
  writeState(deckDir, next, { expectedStateSha: stateSha, updatedAt: at });
  appendHistory(deckDir, { type: "production_mode_transition_source_archived", source_execution_id: frame.execution_id, source_version: sourceVersion, target_version: record.transition_target_version, plan_hash: planHash, receipt_sha256: actualReceiptSha, at });
  appendHistory(deckDir, { type: "production_mode_transition_handoff", target_execution_id: targetExecutionId, source_version: sourceVersion, target_version: record.transition_target_version, target_mode: record.transition_target_mode, plan_hash: planHash, receipt_sha256: actualReceiptSha, at });
  return Object.freeze({ status: "handoff-complete", source_version: sourceVersion, target_version: record.transition_target_version, target_mode: record.transition_target_mode, current_node: nextNode, receipt_sha256: actualReceiptSha });
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
  return isPlainObject(record) && hasExactKeys(record, ["mode"]) && isProductionMode(record.mode)
    ? record.mode
    : null;
}

function nodeIsActiveForController(index, controller, nodeId, state, ctx = {}) {
  const mode = modeForControllerContext(state, ctx);
  return !mode || controllerActiveNodeIds(index, controller.playbook, mode).includes(nodeId);
}

export function buildResumeCard(state, statusSnapshot = null, controller = null) {
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
      html_resume_guidance: null,
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
  const html_resume_guidance = statusSnapshot?.html_resume_guidance || null;
  const execLabel = `${playbook || "（未初始化）"} / ${current_node || "（未初始化）"}`;
  let workflow_summary;
  if (waiting_for) workflow_summary = `卡在等人：${waiting_for}（${execLabel}）`;
  else if (statusSnapshot && !statusSnapshot.style_master) workflow_summary = `视觉母版未就绪（${execLabel}）`;
  else if (statusSnapshot && statusSnapshot.style_master && Number(statusSnapshot.expected_slides) > 0 && Number(statusSnapshot.raw_images) < Number(statusSnapshot.expected_slides)) {
    workflow_summary = `生产页图进行中 ${statusSnapshot.raw_images}/${statusSnapshot.expected_slides}（执行点 ${execLabel}）`;
  } else if (statusSnapshot && Array.isArray(statusSnapshot.pptx) && statusSnapshot.pptx.length > 0) workflow_summary = `已有交付 PPTX，可迭代（执行点 ${execLabel}）`;
  else workflow_summary = `执行点：${execLabel}`;

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

  if (!waiting_for && !html_resume_guidance?.recommended_command && resolvedMode === "html-then-image2") {
    const version = controller?.ctx?.runVersion || controller?.ctx?.run_version || null;
    const refinement = version ? (() => { try { return projectImage2RefinementState(state, version); } catch { return null; } })() : null;
    if (refinement?.status !== "complete") {
      workflow_summary = `Required Image2 refinement is ${refinement?.status || "not-started"}`;
      suggested_next = refinement?.present
        ? (refinement.human_action_required ? "human:review-image2-refinement" : "continue:image2-refinement")
        : "start:image2-refine/plan";
    }
  }

  if (playbook === "image2-refine" && !html_resume_guidance?.recommended_command) {
    const version = controller?.ctx?.runVersion || controller?.ctx?.run_version || null;
    const refinement = version ? (() => { try { return projectImage2RefinementState(state, version); } catch { return null; } })() : null;
    if (refinement?.status === "unknown-submit") suggested_next = "human:resolve-unknown-submit";
    else if (refinement?.status === "review-pending") suggested_next = "human:review-image2-refinement";
    else if (refinement?.status === "complete") suggested_next = "complete:image2-refinement-await-final-html-review";
    else if (!refinement?.present) suggested_next = "start:image2-refine/plan";
  }

  // Derive the active node set from the exact authoritative mode when resolvable
  // (mode-filtered working set); otherwise fall back to the full controller set.
  const activeNodeIds = controller?.index
    ? (resolvedMode ? controllerActiveNodeIds(controller.index, playbook, resolvedMode) : controllerNodeIds(controller.index, playbook))
    : undefined;
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
    production_mode,
  };
}

function reservedVersionRecord(state, reservedId, runVersion) {
  const container = state?.nodes?.[reservedId];
  if (!isPlainObject(container) || !isPlainObject(container.by_version)) return null;
  const rec = container.by_version[canonicalVersionKey(runVersion)];
  return isPlainObject(rec) ? rec : null;
}

function readHtmlDeliveryDecision(state, runVersion) {
  const rec = reservedVersionRecord(state, "html-delivery-review", runVersion);
  if (!rec) return { present: false, decision: null };
  return { present: true, decision: typeof rec.decision === "string" ? rec.decision : null };
}

function readImage2DeliveryDecision(state, runVersion) {
  // The image2-primary delivery/final-review record is a dedicated state-owned
  // map (see recordImage2DeliveryReview). Read defensively so this projection
  // stays correct before/after that record exists.
  const byVersion = isPlainObject(state?.image2_delivery_review?.by_version) ? state.image2_delivery_review.by_version : null;
  const rec = byVersion ? byVersion[canonicalVersionKey(runVersion)] : null;
  if (!isPlainObject(rec)) return { present: false, decision: null };
  const durableCreateExecution = state?.playbook === "create-deck" && typeof state?.execution_id === "string" && state.execution_id;
  if (durableCreateExecution) {
    const node = activeRecord(state, IMAGE2_FINAL_REVIEW_NODE);
    const binding = node?.image2_delivery_review;
    const bound = node?.status === "completed" &&
      node?.decision?.kind === "user" &&
      node?.decision?.value === rec.decision &&
      binding?.run_version === runVersion &&
      binding?.fingerprint === sha256(stableStringify(rec));
    if (!bound) return { present: false, decision: null, code: "FINAL_REVIEW_NODE_UNBOUND" };
  }
  return { present: true, decision: typeof rec.decision === "string" ? rec.decision : null };
}

function safeRefinementStatus(state, runVersion) {
  try { return projectImage2RefinementState(state, runVersion); } catch { return Object.freeze({ present: false, status: "invalid" }); }
}

/** Resume-card mode projection: resolvable mode + derived policy, or a typed gap. */
function projectModeCard(state, runVersion) {
  const exactVersion = normalizeRunVersion(runVersion);
  const versionKey = canonicalVersionKey(exactVersion);
  if (!versionKey) return Object.freeze({ resolvable: false, code: "RUN_VERSION_INVALID" });
  const record = isPlainObject(state?.production_mode?.by_version) ? state.production_mode.by_version[versionKey] : null;
  const mode = isPlainObject(record) && hasExactKeys(record, ["mode"]) && isProductionMode(record.mode) ? record.mode : null;
  if (!mode) return Object.freeze({ resolvable: false, code: "MODE_MISSING", run_version: exactVersion });
  return Object.freeze({ resolvable: true, run_version: exactVersion, mode, policy: productionPolicyForMode(mode) });
}

/**
 * Mode-aware completion projection over authoritative state records. State owns
 * the mode + record-level completion truth; the CLI status layer composes this
 * with artifact freshness. Returns the mode, whether the run is complete under
 * that mode, and the nearest owning missing prerequisite per mode:
 *  - html-only: current HTML delivery review (proceed); retained/absent
 *    refinement is not debt.
 *  - html-then-image2: HTML delivery + a current required refinement lifecycle.
 *  - image2-only: the evidence-bound image2 delivery/final-review record.
 * A missing/invalid mode fails closed rather than guessing completion.
 */
export function projectModeCompletion(state, { runVersion } = {}) {
  const exactVersion = normalizeRunVersion(runVersion);
  if (!exactVersion) return Object.freeze({ ok: false, code: "RUN_VERSION_INVALID" });
  const versionKey = canonicalVersionKey(exactVersion);
  const record = isPlainObject(state?.production_mode?.by_version) ? state.production_mode.by_version[versionKey] : null;
  const mode = isPlainObject(record) && hasExactKeys(record, ["mode"]) && isProductionMode(record.mode) ? record.mode : null;
  if (!mode) return Object.freeze({ ok: false, code: "MODE_MISSING", run_version: exactVersion, next_action: "register_or_migrate_production_mode" });
  const policy = productionPolicyForMode(mode);
  const delivery = readHtmlDeliveryDecision(state, exactVersion);
  const refinement = safeRefinementStatus(state, exactVersion);

  if (mode === "html-only") {
    const missing = [];
    if (!delivery.present || delivery.decision !== "proceed") missing.push({ owner: "html-delivery-review", action: "complete_html_delivery_review" });
    return Object.freeze({ ok: true, mode, policy, complete: missing.length === 0, missing });
  }
  if (mode === "html-then-image2") {
    const missing = [];
    if (!delivery.present || delivery.decision !== "proceed") missing.push({ owner: "html-delivery-review", action: "complete_html_delivery_review" });
    if (refinement.status !== "complete") missing.push({ owner: "image2-refinement", action: "complete_required_refinement_lifecycle" });
    return Object.freeze({ ok: true, mode, policy, complete: missing.length === 0, missing });
  }
  const image2 = readImage2DeliveryDecision(state, exactVersion);
  const missing = [];
  if (!image2.present || image2.decision !== "proceed") missing.push({ owner: "image2-delivery-review", action: "complete_evidence_bound_image2_final_review" });
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
  if (state.playbook_stack.some(isTransitionSuspensionFrame)) {
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
  if (state.playbook_stack.some(isTransitionSuspensionFrame)) {
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
    pipeline: LEGACY_PIPELINE,
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
    gates: { content: "pending", visual: "pending", html_content: "pending", html_visual: "pending" },
    deck: { name: "", type: "", style: "" },
    playbook_stack: [],
  };
}
export function createInitialState(deckName, deckType, style) {
  const state = createDefaultState();
  state.deck = { name: String(deckName || ""), type: String(deckType || ""), style: String(style || "") };
  startPlaybook(state, "create-deck", { runVersion: "v1" });
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
  if (state.continuation_target_version != null && state.continuation_target_version !== "" && !exactContinuationTargetVersion(state.continuation_target_version)) {
    errors.push("continuation_target_version must be a normalized vN");
  }
  errors.push(...executionBindingErrors(state));
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
  validateProductionModeStructure(state, errors);
  validateImage2MapsStructure(state, errors);
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

/**
 * Ensure the production-mode container exists with a plain by_version map. This
 * only normalizes shape; it never infers a mode (see migrateProductionModeFromMarkers
 * for the v3->v4 boundary-only inference).
 */
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
    if (!isPlainObject(record) || !hasExactKeys(record, ["mode"]) || !isProductionMode(record.mode)) {
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
    if (!isPlainObject(record) || !hasExactKeys(record, ["mode"])) {
      issues.push(stateIssue(recordPath, "closed {mode} record", "unknown-or-missing-key", "record"));
      continue;
    }
    if (!isProductionMode(record.mode)) {
      issues.push(stateIssue(`${recordPath}.mode`, "html-only|html-then-image2|image2-only", record.mode, "record"));
    }
  }
}

/** Read-only validation for the first-class Image2 evidence maps. */
function validateImage2MapsReadOnly(state, issues) {
  for (const [mapKey, validator, label] of [
    ["image2_delivery_review", validImage2DeliveryRecord, "closed image2 delivery-review record"],
    ["image2_provider_authorization", validImage2AuthorizationRecord, "closed image2 authorization record"],
  ]) {
    const map = state[mapKey];
    if (map == null) continue;
    if (!hasExactKeys(map, ["by_version"]) || !isPlainObject(map.by_version)) {
      issues.push(stateIssue(mapKey, "by_version-only map", "invalid", "record"));
      continue;
    }
    for (const [key, record] of Object.entries(map.by_version)) {
      const recordPath = `${mapKey}.by_version.${key}`;
      const runVersion = versionFromReservedKey(key);
      if (!runVersion) { issues.push(stateIssue(recordPath, "canonical 3_versions/vN key", "noncanonical", "record")); continue; }
      if (!validator(record, runVersion)) issues.push(stateIssue(recordPath, label, "unknown-or-invalid", "record"));
    }
  }
}

/**
 * v3->v4 boundary migration: for each visible version, populate a MISSING
 * production-mode record from its canonical source marker (html-first-v1 ->
 * html-only, markerless legacy -> image2-only). Pure over markers only;
 * refinement/metadata/history/generated bytes never influence it. Idempotent:
 * a valid existing record is never rewritten. Invalid markers leave the record
 * absent so later inspection/validation fails closed. This runs ONLY when
 * migrating from a pre-v4 schema; a post-v4 missing mode is corruption and is
 * not re-inferred.
 */
function migrateProductionModeFromMarkers(state, deckDir) {
  const byVersion = ensureProductionModeContainer(state);
  const versionsDir = join(deckDir, "3_versions");
  let versions = [];
  try {
    versions = readdirSync(versionsDir)
      .filter((name) => VERSION_RE.test(name))
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  } catch { return; }
  for (const version of versions) {
    const key = canonicalVersionKey(version);
    if (!key) continue;
    const existing = byVersion[key];
    if (isPlainObject(existing) && hasExactKeys(existing, ["mode"]) && isProductionMode(existing.mode)) continue;
    const source = join(versionsDir, version, "slide-specifications.md");
    if (!existsSync(source)) continue;
    let marker;
    try {
      marker = probeProductionMarker(readFileSync(source), { source: "slide-specifications.md" });
    } catch { continue; }
    const derived = productionModeFromSourceMarker(marker);
    if (!derived.ok) continue;
    byVersion[key] = { mode: derived.mode };
    appendDiagnostic(state, `production_mode.${key} migrated from ${derived.branch} source marker -> ${derived.mode}`);
  }
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
  const topLevel = ["schema_version", "pipeline", "production_mode", "image2_delivery_review", "image2_provider_authorization", "playbook", "current_node", "execution_id", "execution_started_at", "run_version", "continuation_target_version", "started_at", "updated_at", "nodes", "gates", "deck", "playbook_stack", "diagnostics"];
  for (const key of Object.keys(state)) if (!topLevel.includes(key)) issues.push(stateIssue(key, "known top-level state key", "unknown", "state"));
  for (const error of validateState(state).errors.slice(0, 20)) issues.push(stateIssue("state", "valid schema-v5 invariant", error, "state"));
  const continuationTargetError = continuationTargetVisibilityError(state, deckDir);
  if (continuationTargetError) {
    issues.push(stateIssue("continuation_target_version", "normalized visible canonical vN", state.continuation_target_version || "missing", "state", "guide_explicit_run"));
  }
  validateProductionModeReadOnly(state, issues);
  validateImage2MapsReadOnly(state, issues);

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
  transition_apply_current: (state, ctx) => {
    const record = activeTransitionRecord(state);
    const frame = state?.playbook_stack?.[0];
    return Boolean(record && isTransitionSuspensionFrame(frame) && selectedRunVersion(ctx) === record.transition_source_version &&
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
  const required = node.requires.map((id) => `node_done:${id}`);
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
  const mode = modeForControllerContext(state, ctx);
  const ids = controller && mode
    ? controllerActiveNodeIds(index, playbook, mode)
    : controllerNodeIds(index, playbook);
  return ids.filter((id) => {
    const record = activeRecord(state, id);
    if (record && ["completed", "skipped", "in_progress"].includes(record.status)) return false;
    return checkEntry(id, index.playbookDir, state, ctx).pass;
  });
}
