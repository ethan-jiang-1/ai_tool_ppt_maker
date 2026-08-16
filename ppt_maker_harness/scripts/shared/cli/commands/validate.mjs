import { join } from "node:path";
import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError, projectProblemFactsDiagnostic } from "../cli_error.mjs";
import { PPT_FLOW_ENTRY, emitFailed, resolveRunAdapter, targetImage2Operations } from "../command_support.mjs";
import { SLIDE_SPECS_NAME } from "../../run-bundle/bundle_layout.mjs";

export async function commandValidate(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.validate.identity");
  if (!route) return 1;
  const operations = await targetImage2Operations(route.workflow);
  let candidate;
  try {
    // Stage 1: source-only candidate parse (provider-free, zero state writes).
    candidate = operations.resolveCandidateSource(route.run_dir);
  } catch (error) {
    return emitSourceValidationFailure("ppt_flow.validate.page-image", error);
  }
  try {
    // Stage 2: source/state identity binding.
    const source = operations.resolveSource(route.run_dir);
    console.log(`✓ Target Page Image ${route.workflow} receipt validated: ${source.receipt.slides.length} slide(s)`);
    return 0;
  } catch (error) {
    if (error?.message === "TARGET_SOURCE_STATE_IDENTITY_MISMATCH") {
      return emitSourceStateStaleEnvelope(route);
    }
    throw error;
  }
}

/** Project a source-only parse failure through the Change 1 problem-fact envelope. */
function emitSourceValidationFailure(where, error) {
  const diagnostic = projectProblemFactsDiagnostic({
    error,
    operation: "validate",
    rerunText: "Repair the named Page Image source or configuration through its owner, then rerun validate.",
  });
  if (diagnostic) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image source is invalid and must be repaired before validation can continue.",
      hint: "Repair the exact named source through its owner, then rerun validate.",
      where,
      diagnostic,
    });
    return 1;
  }
  emitFailed(where, error.message || "Page Image source validation failed", "Repair canonical Page Image source or its registered visual inputs, then rerun validate.");
  return 1;
}

/** Emit the source-valid / state-binding-stale envelope (BUG-069 split projection). */
function emitSourceStateStaleEnvelope(route) {
  const sourcePath = { path: join(route.run_dir, SLIDE_SPECS_NAME) };
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "The current Page Image source is valid but its source/state identity binding is stale.",
    hint: "Rebind source/state identity through the owner (image2 plan), then rerun validate.",
    where: "ppt_flow.validate.page-image",
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "artifact",
      operation: "validate",
      reason: { kind: "target_source_state_identity_mismatch" },
      source: sourcePath,
      subject: { kind: "page-image-validate", id: route.workflow },
      source_valid: true,
      next: createCliNext("repair_prerequisite", {
        requiresHuman: false,
        inspect: [sourcePath],
        invocation: Object.freeze({ program: "node", args: Object.freeze([PPT_FLOW_ENTRY, "image2", "plan", route.run_dir]) }),
        default: `Rebind the ${route.workflow} source/state identity through the owner (image2 plan), then rerun validate.`,
      }),
    },
  });
  return 1;
}
