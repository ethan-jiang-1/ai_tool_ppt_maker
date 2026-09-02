/**
 * Owner-issued abandon/reseed of an unproduced unique v1 authoring draft.
 *
 * Public CLI: ppt_flow reset-unproduced-v1. This module owns admission and
 * mutation; it does not invent a second in-place structural publication path.
  * Authority: openspec/specs/run-bundle-management/spec.md
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import {
  createTargetAuthoringState,
  readState,
  requireExactExecutionForRun,
  setNodeStatus,
  writeState,
  appendHistory,
} from "../state/state.mjs";
import { inspectProductionIdentity } from "./production_identity.mjs";
import { probeProductionMarker } from "./production_marker.mjs";
import {
  GENERATED_SUBDIR,
  SLIDE_SPECS_NAME,
  VERSIONS_DIR,
  pageImageProgressiveRawPaths,
  pageImageStyleMasterPaths,
} from "./page_image_paths.mjs";
import { pageImageInitialDraftSource, SCRATCH_SUBDIR, findSlideSpecs } from "./bundle_layout.mjs";

export const UNPRODUCED_V1_RESET_CODES = Object.freeze({
  NOT_V1: "UNPRODUCED_V1_NOT_V1",
  SUCCESSOR_PRESENT: "UNPRODUCED_V1_SUCCESSOR_PRESENT",
  IDENTITY_UNRESOLVABLE: "UNPRODUCED_V1_IDENTITY_UNRESOLVABLE",
  IRREVERSIBLE_EVIDENCE: "UNPRODUCED_V1_IRREVERSIBLE_EVIDENCE",
});

export class UnproducedV1ResetError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "UnproducedV1ResetError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

const VERSION_KEY = "3_versions/v1";
const IRREVERSIBLE_DIGEST_FIELDS = Object.freeze([
  "provider_authorization_sha256",
  "accepted_raw_evidence_sha256",
  "final_manifest_sha256",
  "delivery_receipt_sha256",
]);
const IRREVERSIBLE_FILE_NAMES = new Set([
  "grant.json",
  "candidate-grant.json",
  "attempt.json",
  "raw.png",
  "image.png",
  "image.jpg",
]);
const IRREVERSIBLE_DIR_NAMES = new Set([
  "attempts",
  "materializations",
  "pilot-evidence",
  "pilot-decisions",
  "complete-reviews",
  "accepted-evidence",
  "_staging",
]);

function fail(code, details) {
  throw new UnproducedV1ResetError(code, details);
}

function publishedVersions(deckDir) {
  const parent = join(deckDir, VERSIONS_DIR);
  if (!existsSync(parent)) return [];
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v[1-9][0-9]*$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const pathname = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(pathname);
      else if (entry.isFile()) out.push(pathname);
    }
  }
  return out;
}

function relativeSegments(root, pathname) {
  return pathname.slice(root.length).split(/[\\/]/).filter(Boolean);
}

function iterationStoreIrreversible(root) {
  if (!root || !existsSync(root)) return null;
  for (const pathname of listFiles(root)) {
    const segments = relativeSegments(root, pathname);
    if (segments.some((segment) => IRREVERSIBLE_DIR_NAMES.has(segment))) return pathname;
    if (IRREVERSIBLE_FILE_NAMES.has(basename(pathname))) return pathname;
  }
  return null;
}

function generatedIrreversible(runDir) {
  const generated = join(runDir, GENERATED_SUBDIR);
  for (const pathname of listFiles(generated)) {
    if (/\.(?:png|jpe?g|pptx)$/i.test(pathname)) return pathname;
  }
  return null;
}

function stateIrreversible(state) {
  if (state?.page_image_raw_provider_authorization?.by_version?.[VERSION_KEY]) {
    return "page_image_raw_provider_authorization";
  }
  if (state?.page_image_style_master?.by_version?.[VERSION_KEY]) {
    return "page_image_style_master";
  }
  const evidence = state?.page_image_target_evidence?.by_version?.[VERSION_KEY];
  if (!evidence || typeof evidence !== "object") return null;
  for (const field of IRREVERSIBLE_DIGEST_FIELDS) {
    if (typeof evidence[field] === "string" && evidence[field]) return field;
  }
  return null;
}

function wipeKeepRootReadme(dir) {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "README.md" && entry.isFile()) continue;
    rmSync(join(dir, entry.name), { recursive: true, force: true });
  }
}

function clearVersionScopeHeads(scopesRoot, version) {
  const cleared = [];
  const versionRoot = join(scopesRoot, version);
  if (!existsSync(versionRoot)) return cleared;
  for (const workflow of readdirSync(versionRoot, { withFileTypes: true })) {
    if (!workflow.isDirectory()) continue;
    for (const name of ["head.json", ".head.lock"]) {
      const pathname = join(versionRoot, workflow.name, name);
      if (!existsSync(pathname)) continue;
      rmSync(pathname);
      cleared.push(`${version}/${workflow.name}/${name}`);
    }
  }
  return cleared;
}

function inspectAdmission(runDir) {
  const resolved = resolve(runDir || "");
  if (basename(resolved) !== "v1" || basename(dirname(resolved)) !== VERSIONS_DIR) {
    fail(UNPRODUCED_V1_RESET_CODES.NOT_V1, { run_dir: resolved });
  }
  const deckDir = resolve(resolved, "..", "..");
  const versions = publishedVersions(deckDir);
  if (versions.length !== 1 || versions[0] !== "v1") {
    fail(UNPRODUCED_V1_RESET_CODES.SUCCESSOR_PRESENT, { versions });
  }

  const state = readState(deckDir, { purpose: "observe", heal: false, runVersion: "v1" });
  if (!state || state.replacement_required || state.corrupted) {
    fail(UNPRODUCED_V1_RESET_CODES.IDENTITY_UNRESOLVABLE, { reason: "state_unavailable" });
  }

  const source = findSlideSpecs(resolved);
  if (!source) fail(UNPRODUCED_V1_RESET_CODES.IDENTITY_UNRESOLVABLE, { reason: "source_missing" });
  const marker = probeProductionMarker(readFileSync(source), { source: basename(source) });
  const identity = inspectProductionIdentity({
    state,
    runVersion: "v1",
    sourceMarker: marker,
  });
  if (!identity.ok) {
    fail(UNPRODUCED_V1_RESET_CODES.IDENTITY_UNRESOLVABLE, { reason: identity.code });
  }

  const irreversible = stateIrreversible(state)
    || generatedIrreversible(resolved)
    || iterationStoreIrreversible(pageImageProgressiveRawPaths(resolved).history_root)
    || iterationStoreIrreversible(pageImageStyleMasterPaths(resolved).history_root);
  if (irreversible) {
    fail(UNPRODUCED_V1_RESET_CODES.IRREVERSIBLE_EVIDENCE, { evidence: irreversible });
  }

  return Object.freeze({ resolved, deckDir, state, identity });
}

/**
 * Admit and reseed an unproduced unique v1. Throws UnproducedV1ResetError
 * before any write when admission fails.
 */
export function resetUnproducedV1Draft(runDir) {
  const admitted = inspectAdmission(runDir);
  const execution = requireExactExecutionForRun(admitted.resolved, { purpose: "execute" });
  const deck = admitted.state.deck || {};
  const seed = pageImageInitialDraftSource(deck.type || null);
  const sourcePath = join(admitted.resolved, SLIDE_SPECS_NAME);
  writeFileSync(sourcePath, seed, "utf8");

  const next = createTargetAuthoringState(deck.name || "", deck.type || "", deck.style || "");
  next.continuation_target_version = "v1";
  next.gates.content = "pending";
  next.gates.visual = "pending";
  setNodeStatus(next, "checkpoint-intake", "completed");
  next.current_node = "author-target-narrative-sources";
  writeState(admitted.deckDir, next, { expectedStateSha: execution.state_sha256 });

  wipeKeepRootReadme(join(admitted.resolved, GENERATED_SUBDIR));
  wipeKeepRootReadme(join(admitted.resolved, SCRATCH_SUBDIR));
  const clearedHeads = [
    ...clearVersionScopeHeads(pageImageProgressiveRawPaths(admitted.resolved).scopes_root, "v1"),
    ...clearVersionScopeHeads(pageImageStyleMasterPaths(admitted.resolved).scopes_root, "v1"),
  ];

  appendHistory(admitted.deckDir, {
    type: "unproduced_v1_reset",
    run_version: "v1",
    irreversible_records_deleted: false,
  });

  return Object.freeze({
    ok: true,
    run_version: "v1",
    run_dir: admitted.resolved,
    seed_restored: true,
    irreversible_records_deleted: false,
    cleared_scope_heads: Object.freeze(clearedHeads),
    previous_workflow: admitted.identity.workflow,
  });
}
