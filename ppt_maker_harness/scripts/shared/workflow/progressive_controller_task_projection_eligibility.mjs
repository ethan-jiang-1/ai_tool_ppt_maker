/**
 * Read-only eligibility for the rebuildable progressive collaboration card.
 * It deliberately consumes already-owned inspection and state facts; it never
 * reads the card, mutates authority, or invokes a provider.
 */
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { pageImageProgressiveRawPaths } from "../run-bundle/page_image_paths.mjs";
import { readState } from "../state/state.mjs";
import {
  buildPlaybookIndex,
  controllerActiveNodeIds,
  validatePlaybookIndex,
} from "../state/md_controller_reader.mjs";

const HARNESS_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");

function requiredObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is required`);
  return value;
}

/** Map one owner-issued inspection action to the selected workflow's Controller node. */
export function progressiveControllerCheckpoint(inspection) {
  const inspected = requiredObject(inspection, "workflow inspection");
  const summary = requiredObject(inspected.evidence_summary, "workflow inspection evidence summary");
  const workflow = ["framed", "pure"].includes(summary.workflow) ? summary.workflow : null;
  if (!workflow) throw new Error("PROGRESSIVE_CONTROLLER_WORKFLOW_REQUIRED");
  const action = requiredObject(inspected.primary_action, "workflow inspection primary action");
  const stage = inspected?.evidence_summary?.latest_batch?.kind === "expansion" ? "expansion" : "pilot";
  const suffix = `target-${workflow}`;
  const nodeByAction = {
    plan_progressive_raw_work: `plan-${suffix}-progressive-raw`,
    plan_progressive_pilot: `recommend-${suffix}-pilot`,
    authorize_progressive_raw_batch: `authorize-${suffix}-${stage}`,
    generate_progressive_raw_item: `generate-${suffix}-${stage}`,
    prepare_progressive_pilot_review: `review-${suffix}-pilot`,
    accept_progressive_pilot: `review-${suffix}-pilot`,
    plan_progressive_expansion: `plan-${suffix}-expansion`,
    prepare_progressive_raw_review: `review-${suffix}-raw`,
    accept_progressive_raw_review: `review-${suffix}-raw`,
    publish_target_final_manifest: `publish-${suffix}-final-manifest`,
    "deliver-target-page-image": "deliver-target-page-image",
    "review-target-page-image-delivery": "review-target-page-image-delivery",
    "complete-target-delivery": "complete-target-page-image-iteration",
  };
  return Object.freeze({
    workflow,
    controller_node: nodeByAction[action.action_id] || null,
    owner: typeof action.owner === "string" ? action.owner : "progressive-raw-owner",
    action_id: typeof action.action_id === "string" ? action.action_id : "rebuild_progressive_raw_work",
    kind: typeof action.kind === "string" ? action.kind : "repair",
    requires_human: action.requires_human === true,
  });
}

function ineligible(reason) {
  return Object.freeze({ eligible: false, reason });
}

/**
 * The single predicate that permits a collaboration-card rebuild. It accepts
 * an already-observed inspection and never turns an observation into authority.
 */
export function progressiveControllerTaskProjectionEligibility({ runDir, inspection, state = null, playbookDir = HARNESS_PLAYBOOK_DIR } = {}) {
  try {
    const resolvedRunDir = resolve(runDir || "");
    const summary = inspection?.evidence_summary;
    if (!summary || !["framed", "pure"].includes(summary.workflow)) {
      return ineligible("PROGRESSIVE_CONTROLLER_WORKFLOW_REQUIRED");
    }
    const checkpoint = progressiveControllerCheckpoint(inspection);
    if (!checkpoint.controller_node) return ineligible("PROGRESSIVE_CONTROLLER_NODE_MISMATCH");
    const paths = pageImageProgressiveRawPaths(resolvedRunDir);
    const currentState = state || readState(paths.deck_root, { purpose: "observe", runDir: resolvedRunDir });
    if (!currentState || currentState.replacement_required || currentState.corrupted) {
      return ineligible("PROGRESSIVE_CONTROLLER_STATE_UNAVAILABLE");
    }
    if (currentState.playbook !== "create-deck" || currentState.run_version !== paths.run_version || !currentState.execution_id) {
      return ineligible("PROGRESSIVE_CONTROLLER_IDENTITY_MISMATCH");
    }
    const index = buildPlaybookIndex(playbookDir);
    if (!validatePlaybookIndex(index).valid) return ineligible("PROGRESSIVE_CONTROLLER_MANIFEST_INVALID");
    const active = controllerActiveNodeIds(index, "create-deck", checkpoint.workflow);
    if (!active.includes(currentState.current_node) || currentState.current_node !== checkpoint.controller_node) {
      return ineligible("PROGRESSIVE_CONTROLLER_NODE_MISMATCH");
    }
    return Object.freeze({
      eligible: true,
      state: currentState,
      run_version: basename(resolvedRunDir),
      checkpoint,
      controller: Object.freeze({ active: Object.freeze(active), current_node: currentState.current_node }),
    });
  } catch (error) {
    return ineligible(error?.message || "PROGRESSIVE_CONTROLLER_STATE_UNAVAILABLE");
  }
}
