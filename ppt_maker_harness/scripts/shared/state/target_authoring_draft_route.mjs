import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SLIDE_SPECS_NAME,
  deckRoot,
} from "../run-bundle/bundle_layout.mjs";
import {
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
  isTargetWorkflowSelectionPending,
  probeProductionMarker,
} from "../run-bundle/production_marker.mjs";
import { readState } from "./state.mjs";
import {
  buildPlaybookIndex,
  controllerDraftRouteIncludes,
  controllerDraftRouteNodes,
  validatePlaybookIndex,
} from "./md_controller_reader.mjs";

const DEFAULT_PLAYBOOK_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../playbook");

/**
 * Resolve the narrowly permitted unbound Page Authority authoring route.
 * This is observation-only and deliberately does not parse or materialize a
 * selected workflow source receipt.
 */
export function resolveTargetAuthoringDraftRoute(runDir, { playbookDir = DEFAULT_PLAYBOOK_DIR } = {}) {
  const resolvedRunDir = resolve(runDir || "");
  const sourcePath = join(resolvedRunDir, SLIDE_SPECS_NAME);
  if (!existsSync(sourcePath)) return null;

  const marker = probeProductionMarker(readFileSync(sourcePath), { source: SLIDE_SPECS_NAME });
  const selectionPending = isTargetWorkflowSelectionPending(marker);
  if (marker.branch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE && !selectionPending) return null;

  const workflow = selectionPending ? null : marker.frontmatter?.metadata?.production?.workflow || null;
  const deckDir = realpathSync.native(deckRoot(resolvedRunDir));
  const state = readState(deckDir, { purpose: "observe", heal: false, runDir: resolvedRunDir });
  const index = buildPlaybookIndex(playbookDir);
  if (!validatePlaybookIndex(index).valid) return null;

  const runVersion = basename(resolvedRunDir);
  const versionKey = `3_versions/${runVersion}`;
  const isDraft = state && !state.replacement_required && !state.corrupted &&
    state.pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE &&
    state.production_mode?.by_version?.[versionKey] === undefined &&
    state.playbook === "create-deck" &&
    state.run_version === runVersion &&
    controllerDraftRouteIncludes(index, "create-deck", workflow, state.current_node);
  if (!isDraft) return null;

  return Object.freeze({
    run_dir: resolvedRunDir,
    deck_dir: deckDir,
    run_version: runVersion,
    workflow,
    marker,
    draft_route_nodes: Object.freeze([...controllerDraftRouteNodes(index, "create-deck", workflow)]),
  });
}
