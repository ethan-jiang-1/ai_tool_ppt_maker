import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError } from "../cli_error.mjs";
import { refreshProgressiveControllerTaskProjection, targetImage2Operations } from "../cli_artifact_view.mjs";
import { emitCurrentProtocolError, emitFailed } from "../cli_diagnostics.mjs";
import { resolveRunAdapter } from "../command_support.mjs";
import { commandResult } from "../command_result.mjs";

// Command: build
// ---------------------------------------------------------------------------

function renderBuildText(result) {
  return `✓ Target Page Image ${result.facts.workflow} delivery assembled: ${result.facts.assemblyPath}`;
}

async function commandPageImageBuild(route) {
  const operations = await targetImage2Operations(route.workflow);
  let deliveryResult;
  try {
    deliveryResult = await operations.buildDelivery(route.run_dir);
  } catch (error) {
    if (error?.code === "current_protocol_invalid") {
      emitCurrentProtocolError("ppt_flow.build.page-image.identity", route.run_dir, error.code);
      return 1;
    }
    emitFailed(
      "ppt_flow.build.page-image",
      error.message || "Page Image build failed.",
      "Repair the canonical receipt, raw evidence, final manifest, assembly, or speaker notes before retrying."
    );
    return 1;
  }

  // Delivery succeeded. Projection refresh is a separate, versionable effect
  // (frozen two-effect contract); its failure must not hide the delivery.
  try {
    await refreshProgressiveControllerTaskProjection(route.run_dir);
  } catch (projectionError) {
    const result = commandResult({
      operation: "build",
      state: "partial-effect",
      effect: { workflow: route.workflow, assemblyPath: deliveryResult.delivery.assembly.path },
      partial: { projection: { status: "failed" } },
      facts: { workflow: route.workflow, assemblyPath: deliveryResult.delivery.assembly.path },
    });
    console.log(renderBuildText(result));
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Delivery assembled but the task-projection refresh failed.",
      hint: "Repair the projection refresh root cause, then re-run build; the assembled delivery will not be repeated.",
      where: "ppt_flow.build.page-image",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "artifact",
        operation: "build",
        reason: { kind: "task_projection_refresh_failed" },
        source: { path: route.run_dir },
        next: createCliNext("repair_prerequisite", { default: "Repair the task-projection refresh failure, then re-run build." }),
      },
    });
    return 1;
  }

  const result = commandResult({
    operation: "build",
    state: "success",
    effect: { workflow: route.workflow, assemblyPath: deliveryResult.delivery.assembly.path },
    facts: { workflow: route.workflow, assemblyPath: deliveryResult.delivery.assembly.path },
  });
  console.log(renderBuildText(result));
  return 0;
}

/**
 * build — Build the complete final deck.
 * Executes the receipt-bound Page Image delivery lifecycle.
 *
 * @param {string} runDir
  * Authority: openspec/specs/pipeline-orchestration/spec.md
 * Authority: openspec/specs/cli-surface/spec.md
 */
export async function commandBuild(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.build.identity");
  if (!route) return 1;
  return commandPageImageBuild(route);
}
