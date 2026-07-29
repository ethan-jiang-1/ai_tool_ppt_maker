/**
 * Read-only protocol observer for the explicit legacy-to-Page-Authority bridge.
 * It reports direct source/state facts; it never creates an adapter or mutates
 * a run bundle.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parse } from "yaml";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import {
  PAGE_AUTHORITY_IMAGE2_PIPELINE,
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
} from "../run-bundle/production_marker.mjs";
import {
  canonicalVersionKey,
  isProductionModeRecord,
  normalizeRunVersion,
} from "../run-bundle/production_mode.mjs";
import { readState, statePath } from "./state.mjs";

export const LEGACY_PROTOCOL_OBSERVATION_SCHEMA = "pptmaker-legacy-protocol-observation-v1";

const LEGACY_CLASSIFICATIONS = Object.freeze([
  "recognized-legacy",
  "current",
  "current-pair-corrupt",
  "unsupported-or-corrupt",
]);
const MAX_SUMMARY_ENTRIES = 64;
const SLIDE_HEADING = /^##\s+Slide\s+(\d+)\s*:\s*`([A-Za-z][A-Za-z0-9]{4,7})`/gm;
const HISTORICAL_HTML_PIPELINE = "html-first-v1";
const HISTORICAL_WHOLE_PAGE_PIPELINE = "whole-page-image2-v1";

/** Historical bytes are decoded only by this bounded observer/adoption seam. */
export const LEGACY_PROTOCOL_MODE_POLICIES = Object.freeze({
  "html-only": Object.freeze({ pipeline: HISTORICAL_HTML_PIPELINE }),
  "html-then-image2": Object.freeze({ pipeline: HISTORICAL_HTML_PIPELINE }),
  "image2-only": Object.freeze({ pipeline: HISTORICAL_WHOLE_PAGE_PIPELINE }),
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function regularBytes(path) {
  if (!existsSync(path)) return null;
  const stat = statSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  return readFileSync(path);
}

function sourceLedger(bytes) {
  if (!bytes) return { valid: false, count: 0, digest: null };
  const entries = [];
  for (const match of bytes.toString("utf8").matchAll(SLIDE_HEADING)) {
    entries.push({ position: Number(match[1]), slide_id: match[2] });
  }
  const positions = new Set(entries.map((entry) => entry.position));
  const ids = new Set(entries.map((entry) => entry.slide_id));
  const valid = entries.length > 0 && positions.size === entries.length && ids.size === entries.length &&
    entries.every((entry, index) => entry.position === index + 1);
  return {
    valid,
    count: entries.length,
    digest: valid ? sha256(Buffer.from(canonicalJson(entries))) : null,
  };
}

function boundedHistoricalSummary(runDir) {
  const generated = join(runDir, "_generated");
  if (!existsSync(generated)) return { present: false, valid: true, entry_count: 0, digest: sha256("absent") };
  const stat = statSync(generated);
  if (!stat.isDirectory() || stat.isSymbolicLink()) return { present: true, valid: false, entry_count: 0, digest: sha256("invalid") };
  const entries = readdirSync(generated, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, MAX_SUMMARY_ENTRIES)
    .map((entry) => ({ name: entry.name, kind: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other" }));
  return {
    present: true,
    valid: entries.every((entry) => entry.kind !== "other"),
    entry_count: entries.length,
    digest: sha256(Buffer.from(canonicalJson(entries))),
  };
}

function sourcePipelineFromHistoricalBytes(sourceBytes) {
  if (!sourceBytes) return { ok: false, pipeline: null };
  const text = sourceBytes.toString("utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return { ok: false, pipeline: null };
  try {
    const value = parse(match[1]);
    const pipeline = value?.production?.pipeline;
    return typeof pipeline === "string" ? { ok: true, pipeline } : { ok: false, pipeline: null };
  } catch {
    return { ok: false, pipeline: null };
  }
}

function expectedHistoricalModes(pipeline) {
  if (pipeline === HISTORICAL_HTML_PIPELINE) return new Set(["html-only", "html-then-image2"]);
  if (pipeline === HISTORICAL_WHOLE_PAGE_PIPELINE) return new Set(["image2-only"]);
  return null;
}

function isHistoricalRecord(record, expected) {
  return Boolean(record && typeof record === "object" && !Array.isArray(record) &&
    Object.keys(record).length === 1 && Object.hasOwn(record, "mode") && expected?.has(record.mode));
}

export function legacyProtocolPolicyForMode(mode) {
  const policy = LEGACY_PROTOCOL_MODE_POLICIES[mode];
  return policy ? Object.freeze({ mode, ...policy }) : null;
}

export function isHistoricalLegacyProtocolRecord(record) {
  const policy = legacyProtocolPolicyForMode(record?.mode);
  return Boolean(policy && record && typeof record === "object" && !Array.isArray(record) &&
    Object.keys(record).length === 1 && Object.hasOwn(record, "mode"));
}

function actionFor(classification) {
  if (classification === "recognized-legacy") return "prepare-legacy-adoption";
  if (classification === "current") return "continue-current-protocol";
  if (classification === "current-pair-corrupt") return "repair-page-authority-pair";
  return "repair-or-export-unsupported-protocol";
}

/**
 * Inspect one exact canonical run without looking at generated bytes as an
 * adapter source. The generated-tree summary is diagnostic-only and hashed.
 */
export function inspectLegacyProtocol(canonicalRun) {
  const runDir = resolve(canonicalRun || "");
  const sourceVersion = normalizeRunVersion(runDir);
  const deckDir = resolve(runDir, "..", "..");
  const sourcePath = join(runDir, "slide-specifications.md");
  const sourceBytes = sourceVersion ? regularBytes(sourcePath) : null;
  const sourcePipeline = sourcePipelineFromHistoricalBytes(sourceBytes);
  const sourceLedgerFacts = sourceLedger(sourceBytes);
  const historical = sourceVersion ? boundedHistoricalSummary(runDir) : { present: false, valid: false, entry_count: 0, digest: sha256("invalid-run") };

  let state = null;
  let stateReadError = null;
  if (sourceVersion) {
    try { state = readState(deckDir, { purpose: "observe", heal: false, runVersion: sourceVersion }); }
    catch (error) { stateReadError = error.message || String(error); }
  }
  const stateBytes = sourceVersion ? regularBytes(statePath(deckDir)) : null;
  let historicalState = null;
  if (stateBytes && (!state || state.replacement_required || state.corrupted)) {
    try { historicalState = parse(stateBytes.toString("utf8")); }
    catch { historicalState = null; }
  }
  const record = (state && !state.replacement_required && !state.corrupted ? state : historicalState)
    ?.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)] ?? null;
  const mode = typeof record?.mode === "string" ? record.mode : null;
  const markerClaimsPageAuthority = sourcePipeline.ok &&
    [PAGE_AUTHORITY_IMAGE2_PIPELINE, PAGE_AUTHORITY_IMAGE2_V2_PIPELINE].includes(sourcePipeline.pipeline);
  const recordValid = isProductionModeRecord(record);
  const recordClaimsPageAuthority = ["image2-page-authority", "image2-page-authority-v2"].includes(mode);
  const currentPair = markerClaimsPageAuthority && recordValid && (
    (sourcePipeline.pipeline === PAGE_AUTHORITY_IMAGE2_PIPELINE && record?.mode === "image2-page-authority") ||
    (sourcePipeline.pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE && record?.mode === "image2-page-authority-v2")
  );

  let classification = "unsupported-or-corrupt";
  if (markerClaimsPageAuthority || recordClaimsPageAuthority) {
    classification = currentPair ? "current" : "current-pair-corrupt";
  } else {
    const expected = sourcePipeline.ok ? expectedHistoricalModes(sourcePipeline.pipeline) : null;
    if (sourceVersion && sourceBytes && sourcePipeline.ok && expected && isHistoricalRecord(record, expected) && sourceLedgerFacts.valid && historical.valid) {
      classification = "recognized-legacy";
    }
  }

  const observation = {
    canonical_run: runDir,
    run_version: sourceVersion,
    source_sha256: sourceBytes ? sha256(sourceBytes) : null,
    state_sha256: stateBytes ? sha256(stateBytes) : null,
    source_pipeline: sourcePipeline.ok ? sourcePipeline.pipeline : null,
    source_marker_valid: sourcePipeline.ok,
    production_mode: mode,
    production_mode_record_valid: recordValid || Boolean(expectedHistoricalModes(sourcePipeline.pipeline) && isHistoricalRecord(record, expectedHistoricalModes(sourcePipeline.pipeline))),
    stable_slide_count: sourceLedgerFacts.count,
    stable_slide_ledger_sha256: sourceLedgerFacts.digest,
    historical_artifact_summary_sha256: historical.digest,
    historical_artifact_summary_valid: historical.valid,
    ...(stateReadError ? { state_read_error: stateReadError.slice(0, 160) } : {}),
  };
  // The raw state bytes are a separate CAS binding. Confirmation deliberately
  // replaces those bytes with the active transaction checkpoint, so the
  // reusable observer digest contains only semantic protocol facts.
  const semanticObservation = { ...observation };
  delete semanticObservation.state_sha256;
  const observationSha256 = sha256(Buffer.from(canonicalJson(semanticObservation)));
  return freeze({
    schema: LEGACY_PROTOCOL_OBSERVATION_SCHEMA,
    classification,
    next_action: actionFor(classification),
    observation_sha256: observationSha256,
    observation,
  });
}

export function isLegacyProtocolClassification(value) {
  return LEGACY_CLASSIFICATIONS.includes(value);
}

export function isRecognizedLegacyProtocol(observation) {
  return observation?.schema === LEGACY_PROTOCOL_OBSERVATION_SCHEMA && observation.classification === "recognized-legacy";
}

export function legacyProtocolDisplayRun(observation) {
  return observation?.observation?.run_version ? basename(observation.observation.canonical_run) : null;
}
