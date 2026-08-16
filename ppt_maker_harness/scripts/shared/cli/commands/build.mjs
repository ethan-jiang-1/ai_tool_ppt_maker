import { emitCurrentProtocolError, emitFailed, refreshProgressiveControllerTaskProjection, resolveRunAdapter, targetImage2Operations } from "../command_support.mjs";

// Command: build
// ---------------------------------------------------------------------------

async function commandPageImageBuild(route) {
  try {
    const operations = await targetImage2Operations(route.workflow);
    const result = await operations.buildDelivery(route.run_dir);
    await refreshProgressiveControllerTaskProjection(route.run_dir);
    console.log(`✓ Target Page Image ${route.workflow} delivery assembled: ${result.delivery.assembly.path}`);
    return 0;
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
}

/**
 * build — Build the complete final deck.
 * Executes the receipt-bound Page Image delivery lifecycle.
 *
 * @param {string} runDir
 */
export async function commandBuild(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.build.identity");
  if (!route) return 1;
  return commandPageImageBuild(route);
}
