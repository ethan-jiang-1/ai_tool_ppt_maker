import { registerCliJsonReport } from "../cli_error.mjs";
import { collectStatus, emitFailed, enrichStatusWithState, printStatus, resolveRunAdapter } from "../command_support.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE } from "../../run-bundle/production_marker.mjs";

// ---------------------------------------------------------------------------
// Command: status
// ---------------------------------------------------------------------------

/**
 * status — Show gates, artifacts, playbook breakpoint, and next action.
 * @param {string} runDir
 * @param {{json: boolean}} opts
 */
export async function commandStatus(runDir, { json: asJson }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.status.identity");
  if (!route) return 1;
  const resolved = route.run_dir;
  const status = collectStatus(resolved);
  if (route.target_workflow_selection_required) {
    status.pipeline = PAGE_IMAGE_WORKFLOW_PIPELINE;
    status.structure_issues = status.structure_issues
      .filter((issue) => issue !== PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
  }
  await enrichStatusWithState(status, resolved, route);
  if (asJson) {
    registerCliJsonReport(status);
    console.log(JSON.stringify(status, null, 2));
  } else {
    printStatus(status);
  }
  if (status.structure_issues.length > 0) {
    emitFailed(
      "ppt_flow.status",
      `Bundle has ${status.structure_issues.length} structure issue(s)`,
      "Fix structure issues listed above, then re-run status"
    );
    return 1;
  }
  return 0;
}
