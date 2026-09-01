import { emitCliError } from "../cli_error.mjs";
import { commandReport } from "../command_result.mjs";
import { rebuildTargetPageImageArtifactView } from "../cli_artifact_view.mjs";
import { targetPageImageFailure } from "../cli_diagnostics.mjs";
import { resolveRunAdapter } from "../command_support.mjs";

// Command: artifacts
// ---------------------------------------------------------------------------

export async function commandArtifacts(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.artifacts.identity");
  if (!route) return 1;
  try {
    const output = await rebuildTargetPageImageArtifactView(route);
    const report = commandReport({
      operation: "artifacts",
      effect: { artifact_view: output.path },
      fields: {
        run_dir: output.run_dir,
        workflow: output.workflow,
        artifact_view: output.path,
        human_navigation_root: output.root,
        ...(output.pending_successor ? { next_action: output.pending_successor.next_action } : {}),
      },
    });
    console.log(JSON.stringify(report, null, 2));
    return 0;
  } catch (error) {
    const failure = targetPageImageFailure("artifact-view", route, error);
    emitCliError({
      code: failure.code,
      message: failure.message,
      hint: failure.hint,
      where: "ppt_flow.artifacts",
      diagnostic: failure.diagnostic,
    });
    return 1;
  }
}
