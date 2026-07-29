/**
 * Current Page Authority production policy.
 *
 * This module intentionally has one current vocabulary. Historical source and
 * state pairs belong to the read-only legacy observer; they cannot become a
 * policy, adapter, or state record through this interface.
 */
import { PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, TARGET_WORKFLOWS } from "./production_marker.mjs";

export const TARGET_PRODUCTION_MODE = "image2-page-authority-v2";
export const PRODUCTION_MODES = Object.freeze([TARGET_PRODUCTION_MODE]);
export const PRODUCTION_PAGE_AUTHORITIES = Object.freeze(["image2"]);
export const PRODUCTION_REFINEMENT_POLICIES = Object.freeze(["not-applicable"]);
export const PRODUCTION_STYLE_MASTER_POLICIES = Object.freeze(["current"]);
export const PRODUCTION_ADAPTERS = Object.freeze(["page-authority-image2-v2"]);

const TARGET_POLICY = Object.freeze({
  mode: TARGET_PRODUCTION_MODE,
  pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
  page_authority: "image2",
  refinement_policy: "not-applicable",
  style_master_policy: "current",
  adapter: "page-authority-image2-v2",
});
const RUN_VERSION_RE = /^v[1-9][0-9]*$/;

export function isProductionMode(value) {
  return typeof value === "string" && PRODUCTION_MODES.includes(value);
}

export function normalizeProductionMode(value) {
  return isProductionMode(value) ? value : null;
}

export function productionPolicyForMode(mode) {
  if (mode === TARGET_PRODUCTION_MODE) return { ok: true, ...TARGET_POLICY };
  return {
    ok: false,
    code: "INVALID_PRODUCTION_MODE",
    actual: mode,
    valid_modes: [...PRODUCTION_MODES],
  };
}

export function normalizeRunVersion(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const bare = value.replace(/[\\/]+$/, "").split(/[\\/]/).pop();
  return RUN_VERSION_RE.test(bare) ? bare : null;
}

export function canonicalVersionKey(runVersion) {
  const normalized = normalizeRunVersion(runVersion);
  return normalized ? `3_versions/${normalized}` : null;
}

export function pipelineFromSourceMarker(sourceMarker) {
  if (!sourceMarker || typeof sourceMarker !== "object") {
    return { ok: false, code: "MARKER_MISSING", issues: [] };
  }
  const issues = Array.isArray(sourceMarker.issues) ? sourceMarker.issues : [];
  if (sourceMarker.branch === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    return {
      ok: true,
      pipeline: sourceMarker.branch,
      branch: sourceMarker.branch,
      workflow: sourceMarker.frontmatter?.metadata?.production?.workflow ?? null,
    };
  }
  return {
    ok: false,
    code: sourceMarker.branch === "invalid" ? "MARKER_INVALID" : "MARKER_NOT_CURRENT",
    branch: sourceMarker.branch,
    issues,
  };
}

function readByVersion(state) {
  const byVersion = state?.production_mode?.by_version;
  return byVersion && typeof byVersion === "object" && !Array.isArray(byVersion) ? byVersion : null;
}

function readCurrentRecord(record, versionKey) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { ok: false, code: "MODE_RECORD_MALFORMED", version_key: versionKey };
  }
  if (!isProductionMode(record.mode)) {
    return {
      ok: false,
      code: "MODE_INVALID",
      version_key: versionKey,
      actual: record.mode,
      valid_modes: [...PRODUCTION_MODES],
    };
  }
  const expectedKeys = ["mode", "workflow", "source_epoch"];
  if (Object.keys(record).length !== expectedKeys.length || !expectedKeys.every((key) => Object.hasOwn(record, key)) ||
    !Number.isInteger(record.source_epoch) || record.source_epoch < 1 ||
    !TARGET_WORKFLOWS.includes(record.workflow)) {
    return {
      ok: false,
      code: "PAGE_AUTHORITY_STATE_INVALID",
      version_key: versionKey,
      mode: record.mode,
      next_action: "repair_page_authority_state",
    };
  }
  return { ok: true, mode: record.mode, workflow: record.workflow };
}

export function isProductionModeRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  return record.mode === TARGET_PRODUCTION_MODE && Object.keys(record).length === 3 &&
    Number.isInteger(record.source_epoch) && record.source_epoch >= 1 &&
    TARGET_WORKFLOWS.includes(record.workflow) && Object.hasOwn(record, "mode") &&
    Object.hasOwn(record, "workflow") && Object.hasOwn(record, "source_epoch");
}

export function initialProductionModeRecord(mode = TARGET_PRODUCTION_MODE, workflow = null) {
  if (!isProductionMode(mode)) throw new TypeError("mode must be a supported Page Authority mode");
  if (mode === TARGET_PRODUCTION_MODE) {
    if (!TARGET_WORKFLOWS.includes(workflow)) throw new TypeError("v2 mode requires workflow framed | pure");
    return { mode: TARGET_PRODUCTION_MODE, workflow, source_epoch: 1 };
  }
}

/** Inspect only the one current Page Authority source/state pair. */
export function inspectProductionMode({ state, runDir, runVersion, sourceMarker } = {}) {
  const resolvedVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!resolvedVersion) return { ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion };
  const versionKey = canonicalVersionKey(resolvedVersion);
  const byVersion = readByVersion(state);
  if (!byVersion || !Object.hasOwn(byVersion, versionKey)) {
    return { ok: false, code: "MODE_MISSING", run_version: resolvedVersion, version_key: versionKey };
  }
  const record = readCurrentRecord(byVersion[versionKey], versionKey);
  if (!record.ok) return { ...record, run_version: resolvedVersion };
  const marker = pipelineFromSourceMarker(sourceMarker);
  if (!marker.ok) {
    return { ok: false, code: marker.code, run_version: resolvedVersion, marker };
  }
  const policy = productionPolicyForMode(record.mode);
  if (!policy.ok || marker.pipeline !== policy.pipeline || (record.mode === TARGET_PRODUCTION_MODE && marker.workflow !== record.workflow)) {
    return {
      ok: false,
      code: "MODE_SOURCE_IDENTITY_MISMATCH",
      run_version: resolvedVersion,
      mode: record.mode,
      workflow: record.workflow,
      marker,
    };
  }
  return {
    ok: true,
    run_version: resolvedVersion,
    version_key: versionKey,
    mode: record.mode,
    ...(record.workflow ? { workflow: record.workflow } : {}),
    policy,
    source_branch: marker.branch,
    source_pipeline: marker.pipeline,
    consistent: true,
  };
}
