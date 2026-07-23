/**
 * production_mode.mjs — pure production-mode policy vocabulary and routing.
 *
 * Single source of truth for the closed three-mode production vocabulary and its
 * mapping onto the existing HTML and whole-page Image2 renderer contracts. This
 * module is intentionally PURE: it performs no filesystem, state, metadata,
 * history, or generated-artifact reads or writes. The filesystem/parser/
 * migration/CAS authority lives in state.mjs, which supplies a canonical state
 * snapshot and an exact source-marker probe result and then calls these
 * functions.
 *
 * CLI diagnostic consumer authority:
 *   openspec/specs/node-specification/spec.md
 *   openspec/specs/pipeline-orchestration/spec.md
 * plus the active `add-production-mode-and-image2-primary` deltas. Do not
 * duplicate the producer schema owned by cli-surface in this module.
 *
 * Vocabulary note: `whole-page-image2-v1` is the explicit source marker for
 * the whole-page Image2 branch. Every supported source declares one supported
 * `production.pipeline` value.
 */
import { HTML_FIRST_PIPELINE, WHOLE_PAGE_IMAGE2_PIPELINE } from "./production_marker.mjs";

/**
 * Closed production-mode vocabulary. Exactly these three values are valid.
 * @readonly
 * @type {readonly string[]}
 */
export const PRODUCTION_MODES = Object.freeze(["html-only", "html-then-image2", "image2-only"]);

/**
 * @readonly
 * @type {readonly string[]}
 */
export const PRODUCTION_PAGE_AUTHORITIES = Object.freeze(["html", "image2"]);

/**
 * @readonly
 * @type {readonly string[]}
 */
export const PRODUCTION_REFINEMENT_POLICIES = Object.freeze(["disabled", "required", "not-applicable"]);

/**
 * @readonly
 * @type {readonly string[]}
 */
export const PRODUCTION_STYLE_MASTER_POLICIES = Object.freeze(["reserved-html-adapter", "current"]);

/**
 * Canonical policy table. The one and only mapping from a production mode to its
 * renderer contract. Callers MUST NOT keep a private copy of this table.
 *
 * - html-only        -> html-first-v1     / html    / disabled           / reserved-html-adapter
 * - html-then-image2 -> html-first-v1     / html    / required           / reserved-html-adapter
 * - image2-only      -> whole-page-image2-v1 / image2 / not-applicable   / current
 *
 * The image2-only pipeline value is written in source frontmatter.
 *
 * @readonly
 */
const POLICY_TABLE = Object.freeze({
  "html-only": Object.freeze({
    mode: "html-only",
    pipeline: HTML_FIRST_PIPELINE,
    page_authority: "html",
    refinement_policy: "disabled",
    style_master_policy: "reserved-html-adapter",
  }),
  "html-then-image2": Object.freeze({
    mode: "html-then-image2",
    pipeline: HTML_FIRST_PIPELINE,
    page_authority: "html",
    refinement_policy: "required",
    style_master_policy: "reserved-html-adapter",
  }),
  "image2-only": Object.freeze({
    mode: "image2-only",
    pipeline: WHOLE_PAGE_IMAGE2_PIPELINE,
    page_authority: "image2",
    refinement_policy: "not-applicable",
    style_master_policy: "current",
  }),
});

const RUN_VERSION_RE = /^v[1-9][0-9]*$/;

/**
 * True only for an exact member of the closed vocabulary.
 * @param {unknown} value
 * @returns {value is string}
 */
export function isProductionMode(value) {
  return typeof value === "string" && PRODUCTION_MODES.includes(value);
}

/**
 * Return the canonical mode string, or null when the value is not a valid mode.
 * Does not coerce, alias, or guess — a missing/invalid mode never becomes a mode.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeProductionMode(value) {
  return isProductionMode(value) ? value : null;
}

/**
 * Resolve the full policy for a mode.
 *
 * @param {unknown} mode
 * @returns {{ ok: true } | { ok: false, code: "INVALID_PRODUCTION_MODE", actual: unknown, valid_modes: string[] }}
 *   On success the result additionally carries `mode`, `pipeline`,
 *   `page_authority`, `refinement_policy`, and `style_master_policy`.
 */
export function productionPolicyForMode(mode) {
  if (!isProductionMode(mode)) {
    return {
      ok: false,
      code: "INVALID_PRODUCTION_MODE",
      actual: mode,
      valid_modes: [...PRODUCTION_MODES],
    };
  }
  const policy = POLICY_TABLE[mode];
  return { ok: true, ...policy };
}

/**
 * Extract a normalized `vN` run version from a run directory path or an
 * already-normalized version. Returns null when no canonical version segment is
 * present (pure string transform; no filesystem access).
 *
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeRunVersion(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const trimmed = value.replace(/[\\/]+$/, "");
  const bare = trimmed.split(/[\\/]/).pop();
  return RUN_VERSION_RE.test(bare) ? bare : null;
}

/**
 * Canonical state-map key for a normalized run version (`3_versions/vN`).
 * Returns null for a non-canonical version.
 * @param {unknown} runVersion
 * @returns {string | null}
 */
export function canonicalVersionKey(runVersion) {
  const normalized = normalizeRunVersion(runVersion);
  return normalized ? `3_versions/${normalized}` : null;
}

/**
 * Normalize an explicit marker probe result into its derived source pipeline.
 *
 * @param {{ branch?: string, issues?: unknown[] } | null | undefined} sourceMarker
 *   output of probeProductionMarker from production_marker.mjs
 * @returns {{ ok: true, pipeline: string, branch: string } |
 *           { ok: false, code: string, branch?: string, issues: unknown[] }}
 */
export function pipelineFromSourceMarker(sourceMarker) {
  if (!sourceMarker || typeof sourceMarker !== "object") {
    return { ok: false, code: "MARKER_MISSING", issues: [] };
  }
  const branch = sourceMarker.branch;
  const issues = Array.isArray(sourceMarker.issues) ? sourceMarker.issues : [];
  if (branch === HTML_FIRST_PIPELINE) {
    return { ok: true, pipeline: HTML_FIRST_PIPELINE, branch };
  }
  if (branch === WHOLE_PAGE_IMAGE2_PIPELINE) {
    return { ok: true, pipeline: WHOLE_PAGE_IMAGE2_PIPELINE, branch };
  }
  return {
    ok: false,
    code: branch === "invalid" ? "MARKER_INVALID" : "MARKER_UNKNOWN",
    branch,
    issues,
  };
}

/**
 * Closed source mapping: an explicit `html-first-v1` marker becomes
 * `html-only`; an explicit `whole-page-image2-v1` marker becomes
 * `image2-only`. Invalid or unknown markers fail closed.
 *
 * @param {{ branch?: string, issues?: unknown[] } | null | undefined} sourceMarker
 * @returns {{ ok: true, mode: string, pipeline: string, branch: string } |
 *           { ok: false, code: string, branch?: string, issues: unknown[] }}
 */
export function productionModeFromSourceMarker(sourceMarker) {
  const pipeline = pipelineFromSourceMarker(sourceMarker);
  if (!pipeline.ok) return pipeline;
  if (pipeline.pipeline === HTML_FIRST_PIPELINE) {
    return { ok: true, mode: "html-only", pipeline: HTML_FIRST_PIPELINE, branch: pipeline.branch };
  }
  return { ok: true, mode: "image2-only", pipeline: WHOLE_PAGE_IMAGE2_PIPELINE, branch: pipeline.branch };
}

function readByVersion(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return null;
  const pm = state.production_mode;
  if (!pm || typeof pm !== "object" || Array.isArray(pm)) return null;
  const bv = pm.by_version;
  if (!bv || typeof bv !== "object" || Array.isArray(bv)) return null;
  return bv;
}

function readModeFromRecord(record, versionKey) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { ok: false, code: "MODE_RECORD_MALFORMED", version_key: versionKey };
  }
  if (!Object.prototype.hasOwnProperty.call(record, "mode")) {
    return { ok: false, code: "MODE_MISSING", version_key: versionKey };
  }
  const mode = record.mode;
  if (!isProductionMode(mode)) {
    return {
      ok: false,
      code: "MODE_INVALID",
      version_key: versionKey,
      actual: mode,
      valid_modes: [...PRODUCTION_MODES],
    };
  }
  return { ok: true, mode };
}

/**
 * Inspect the exact run version's authoritative production mode and confirm it is
 * consistent with the canonical source marker. Pure: takes a state snapshot plus
 * a marker probe result; touches no files.
 *
 * Either `runVersion` (normalized `vN`) or `runDir` (path whose final segment is
 * `vN`) identifies the exact version. Resolution is per-version: a deck-global
 * current value or metadata mirror MUST NOT be substituted by the caller.
 *
 * Outcomes:
 *   - ok + consistent:        mode resolves and its derived pipeline matches source.
 *   - RUN_VERSION_INVALID:    caller did not name a canonical version.
 *   - MODE_MISSING:           no record for the exact version (migrate/register).
 *   - MODE_INVALID / MODE_RECORD_MALFORMED: record exists but is not canonical.
 *   - MARKER_INVALID/MISSING: source marker cannot establish the renderer contract.
 *   - transition_required:    mode's derived pipeline differs from the source
 *                             marker — cross-pipeline; ordinary production blocks.
 *
 * @param {{ state: unknown, runDir?: string, runVersion?: string, sourceMarker?: unknown }} input
 */
export function inspectProductionMode({ state, runDir, runVersion, sourceMarker } = {}) {
  const resolvedVersion = normalizeRunVersion(runVersion ?? runDir);
  if (!resolvedVersion) {
    return { ok: false, code: "RUN_VERSION_INVALID", runDir, runVersion };
  }
  const versionKey = canonicalVersionKey(resolvedVersion);
  const byVersion = readByVersion(state);
  if (!byVersion || !Object.prototype.hasOwnProperty.call(byVersion, versionKey)) {
    return { ok: false, code: "MODE_MISSING", run_version: resolvedVersion, version_key: versionKey };
  }
  const modeResult = readModeFromRecord(byVersion[versionKey], versionKey);
  if (!modeResult.ok) {
    return { ...modeResult, run_version: resolvedVersion };
  }
  const mode = modeResult.mode;
  const policy = productionPolicyForMode(mode); // ok:true by construction
  const markerPipeline = pipelineFromSourceMarker(sourceMarker);
  if (!markerPipeline.ok) {
    return {
      ok: false,
      code: markerPipeline.code,
      run_version: resolvedVersion,
      mode,
      policy,
      marker: markerPipeline,
    };
  }
  if (markerPipeline.pipeline !== policy.pipeline) {
    return {
      ok: false,
      code: "transition_required",
      run_version: resolvedVersion,
      mode,
      policy,
      source_branch: markerPipeline.branch,
      source_pipeline: markerPipeline.pipeline,
      derived_pipeline: policy.pipeline,
    };
  }
  return {
    ok: true,
    run_version: resolvedVersion,
    version_key: versionKey,
    mode,
    policy,
    source_branch: markerPipeline.branch,
    source_pipeline: markerPipeline.pipeline,
    consistent: true,
  };
}

function validateSourcePipeline(sourcePipeline, expectedPipeline) {
  if (sourcePipeline === undefined || sourcePipeline === null) {
    return { ok: true, source_pipeline: null, checked: false };
  }
  if (sourcePipeline === expectedPipeline) {
    return { ok: true, source_pipeline: sourcePipeline, checked: true };
  }
  return {
    ok: false,
    code: "transition_required",
    source_pipeline: sourcePipeline,
    derived_pipeline: expectedPipeline,
  };
}

/**
 * Classify a requested mode transition on the exact same run version.
 *
 * - html-only <-> html-then-image2 share the html-first-v1 pipeline: an allowed,
 *   atomic same-pipeline transition.
 * - any html-* <-> image2-only crosses pipelines: not performable in place; the
 *   cross-pipeline versioned transition (deferred to Change 2) is required.
 * - from === to is an idempotent no-op.
 *
 * `sourcePipeline` is optional; when supplied it is checked against the
 * transition's shared pipeline and a mismatch yields `transition_required`.
 *
 * @param {{ fromMode: unknown, toMode: unknown, sourcePipeline?: string }} input
 */
export function classifyProductionModeTransition({ fromMode, toMode, sourcePipeline } = {}) {
  if (!isProductionMode(fromMode)) {
    return {
      ok: false,
      code: "INVALID_FROM_MODE",
      actual: fromMode,
      valid_modes: [...PRODUCTION_MODES],
    };
  }
  if (!isProductionMode(toMode)) {
    return {
      ok: false,
      code: "INVALID_TO_MODE",
      actual: toMode,
      valid_modes: [...PRODUCTION_MODES],
    };
  }
  const fromPolicy = POLICY_TABLE[fromMode];
  const toPolicy = POLICY_TABLE[toMode];
  if (fromMode === toMode) {
    const sourceCheck = validateSourcePipeline(sourcePipeline, toPolicy.pipeline);
    if (!sourceCheck.ok) {
      return { ...sourceCheck, from_mode: fromMode, to_mode: toMode, kind: "no-op" };
    }
    return {
      ok: true,
      kind: "no-op",
      allowed: true,
      from_mode: fromMode,
      to_mode: toMode,
      pipeline: toPolicy.pipeline,
      source_pipeline: sourceCheck.source_pipeline,
      source_checked: sourceCheck.checked,
    };
  }
  if (fromPolicy.pipeline === toPolicy.pipeline) {
    const sourceCheck = validateSourcePipeline(sourcePipeline, toPolicy.pipeline);
    if (!sourceCheck.ok) {
      return {
        ...sourceCheck,
        kind: "cross-pipeline",
        from_mode: fromMode,
        to_mode: toMode,
        from_pipeline: fromPolicy.pipeline,
        to_pipeline: toPolicy.pipeline,
      };
    }
    return {
      ok: true,
      kind: "same-pipeline",
      allowed: true,
      from_mode: fromMode,
      to_mode: toMode,
      pipeline: toPolicy.pipeline,
      source_pipeline: sourceCheck.source_pipeline,
      source_checked: sourceCheck.checked,
    };
  }
  return {
    ok: false,
    kind: "cross-pipeline",
    allowed: false,
    code: "transition_required",
    from_mode: fromMode,
    to_mode: toMode,
    from_pipeline: fromPolicy.pipeline,
    to_pipeline: toPolicy.pipeline,
  };
}
