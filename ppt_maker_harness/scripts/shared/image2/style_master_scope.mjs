import { basename, join, resolve } from "node:path";

import {
  SLIDE_SPECS_NAME,
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  deckRoot,
  styleAsset,
} from "../run-bundle/bundle_layout.mjs";
import { isPageImageVersionDir } from "../run-bundle/page_image_paths.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE } from "../run-bundle/production_marker.mjs";
import {
  resolveCurrentTargetPageImageSourceState,
  resolveRunProductionAdapter,
} from "../state/state.mjs";
import { resolveTargetAuthoringDraftRoute } from "../state/target_authoring_draft_route.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;

export class StyleMasterScopeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "StyleMasterScopeError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new StyleMasterScopeError(code, message);
}

function assertCandidateScope(candidate, { runDir, deckDir, workflow }) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) ||
    candidate.run_dir !== runDir || candidate.deck_dir !== deckDir ||
    candidate.source_path !== join(runDir, SLIDE_SPECS_NAME) ||
    candidate.workflow !== workflow || candidate.receipt?.workflow !== workflow ||
    !SHA256_RE.test(candidate.source_sha256 || "") || candidate.receipt?.source_sha256 !== candidate.source_sha256) {
    fail("style_master_scope_candidate_invalid", "selected workflow candidate source does not bind one canonical Style Master scope");
  }
  return Object.freeze(candidate);
}

function scopeContextResult({ runDir, deckDir, runVersion, workflow, draft }) {
  return Object.freeze({
    run_dir: runDir,
    deck_dir: deckDir,
    run_version: runVersion,
    workflow,
    draft,
    style_intent_source_path: styleAsset(runDir, STYLE_MASTER_PROMPT),
    // This is a candidate input only. It is never selection or historical
    // provenance authority; the plan owner later validates and snapshots it.
    local_existing_source_path: styleAsset(runDir, STYLE_MASTER_IMAGE),
  });
}

/**
 * Resolve exactly one Style Master scope using either the active unbound draft
 * route or an exact current source/state pair. The selected workflow's public
 * interface supplies the read-only candidate source separately, avoiding a
 * shared-module workflow branch or a materializing resolveSource call.
 */
export function resolveStyleMasterScopeContext(runDir, { sourceCandidate = null } = {}) {
  const resolvedRunDir = resolve(runDir || "");
  if (!isPageImageVersionDir(resolvedRunDir)) {
    fail("style_master_scope_run_invalid", "Style Master scope requires one canonical Page Image version directory");
  }
  const deckDir = deckRoot(resolvedRunDir);
  const runVersion = basename(resolvedRunDir);

  const draft = resolveTargetAuthoringDraftRoute(resolvedRunDir);
  if (draft) {
    if (!draft.workflow) {
      fail("style_master_scope_workflow_required", "select a target workflow before Style Master scope resolution");
    }
    return scopeContextResult({
      runDir: resolvedRunDir,
      deckDir,
      runVersion,
      workflow: draft.workflow,
      draft: true,
    });
  }

  const route = resolveRunProductionAdapter(deckDir, { runDir: resolvedRunDir, purpose: "observe" });
  if (!route.ok || route.adapter !== "page-image-workflow" || route.policy?.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE ||
    route.run_version !== runVersion || !route.workflow) {
    fail("style_master_scope_unsupported", "Style Master requires an active fresh draft or exact current Page Image source/state pair");
  }
  const targetState = resolveCurrentTargetPageImageSourceState(deckDir, { runDir: resolvedRunDir });
  if (!targetState.ok) {
    const sourceDrift = targetState.code === "TARGET_SOURCE_STATE_IDENTITY_MISMATCH" ||
      targetState.code === "TARGET_SOURCE_RECEIPT_STALE";
    if (sourceDrift && sourceCandidate !== null) {
      assertCandidateScope(sourceCandidate, {
        runDir: resolvedRunDir,
        deckDir,
        workflow: route.workflow,
      });
      return scopeContextResult({
        runDir: resolvedRunDir,
        deckDir,
        runVersion,
        workflow: route.workflow,
        draft: false,
      });
    }
    fail("style_master_scope_stale", "Style Master scope requires current source receipt and state evidence before candidate resolution");
  }
  return scopeContextResult({
    runDir: resolvedRunDir,
    deckDir,
    runVersion,
    workflow: route.workflow,
    draft: false,
  });
}

/** Bind a selected workflow's read-only candidate source to an exact scope. */
export function bindStyleMasterScopeCandidate(scope, sourceCandidate) {
  if (!scope || typeof scope !== "object" || Array.isArray(scope) ||
    typeof scope.run_dir !== "string" || typeof scope.deck_dir !== "string" ||
    typeof scope.run_version !== "string" || typeof scope.workflow !== "string" ||
    typeof scope.draft !== "boolean" || typeof scope.style_intent_source_path !== "string" ||
    typeof scope.local_existing_source_path !== "string") {
    fail("style_master_scope_invalid", "Style Master candidate binding requires an exact resolved scope");
  }
  const candidate = assertCandidateScope(sourceCandidate, {
    runDir: scope.run_dir,
    deckDir: scope.deck_dir,
    workflow: scope.workflow,
  });
  return Object.freeze({ ...scope, source_candidate: candidate });
}
