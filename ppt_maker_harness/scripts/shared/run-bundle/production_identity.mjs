/**
 * State-owned current Page Image production identity.
 *
 * The source marker owns the pipeline and workflow selection. State records
 * only that accepted workflow plus the epoch that fences state-owned evidence.
 */
import { PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOWS } from "./production_marker.mjs";

const RUN_VERSION_RE = /^v[1-9][0-9]*$/;
const IDENTITY_KEYS = Object.freeze(["workflow", "source_epoch"]);

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
  if (sourceMarker.branch === PAGE_IMAGE_WORKFLOW_PIPELINE) {
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

export function isProductionIdentityRecord(record) {
  return Boolean(record && typeof record === "object" && !Array.isArray(record) &&
    Object.keys(record).length === IDENTITY_KEYS.length &&
    IDENTITY_KEYS.every((key) => Object.hasOwn(record, key)) &&
    PAGE_IMAGE_WORKFLOWS.includes(record.workflow) &&
    Number.isInteger(record.source_epoch) && record.source_epoch >= 1);
}

export function initialProductionIdentityRecord(workflow) {
  if (!PAGE_IMAGE_WORKFLOWS.includes(workflow)) {
    throw new TypeError("production identity requires workflow framed | pure");
  }
  return Object.freeze({ workflow, source_epoch: 1 });
}

function readByVersion(state) {
  const byVersion = state?.production_identity?.by_version;
  return byVersion && typeof byVersion === "object" && !Array.isArray(byVersion) ? byVersion : null;
}

/** Inspect only one current source/state identity pair. This function never writes. */
export function inspectProductionIdentity({ state, runDir, runVersion, sourceMarker } = {}) {
  const resolvedVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!resolvedVersion) return { ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion };
  const versionKey = canonicalVersionKey(resolvedVersion);
  const byVersion = readByVersion(state);
  if (!byVersion || !Object.hasOwn(byVersion, versionKey)) {
    return { ok: false, code: "IDENTITY_MISSING", run_version: resolvedVersion, version_key: versionKey };
  }
  const record = byVersion[versionKey];
  if (!isProductionIdentityRecord(record)) {
    return { ok: false, code: "IDENTITY_RECORD_INVALID", run_version: resolvedVersion, version_key: versionKey };
  }
  const marker = pipelineFromSourceMarker(sourceMarker);
  if (!marker.ok) return { ok: false, code: marker.code, run_version: resolvedVersion, marker };
  if (marker.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE || marker.workflow !== record.workflow) {
    return {
      ok: false,
      code: "IDENTITY_SOURCE_MISMATCH",
      run_version: resolvedVersion,
      workflow: record.workflow,
      marker,
    };
  }
  return Object.freeze({
    ok: true,
    run_version: resolvedVersion,
    version_key: versionKey,
    workflow: record.workflow,
    source_epoch: record.source_epoch,
    source_branch: marker.branch,
    source_pipeline: marker.pipeline,
    consistent: true,
  });
}
