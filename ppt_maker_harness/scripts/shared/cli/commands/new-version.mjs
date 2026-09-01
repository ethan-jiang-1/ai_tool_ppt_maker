import { basename } from "node:path";
import { readFileSync } from "node:fs";
import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError } from "../cli_error.mjs";
import { emitFailed } from "../cli_diagnostics.mjs";
import { resolveRunHarnessBinding } from "../command_support.mjs";
import { commandResult } from "../command_result.mjs";
import { createVersion, findSlideSpecs } from "../../run-bundle/bundle_layout.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, probeProductionMarker } from "../../run-bundle/production_marker.mjs";

// Command: new-version
// ---------------------------------------------------------------------------

function renderNewVersionText(result) {
  const lines = [`✓ Created clean version: ${result.facts.target}`];
  lines.push("  Generated artifacts were not copied.");
  if (result.facts.activation) {
    lines.push(`  Activated Page Image ${result.facts.activation.workflow} authoring draft.`);
  }
  return lines.join("\n");
}

/**
 * new-version — Create a clean downstream version (copies spec + overrides,
 * not generated artifacts).
 *
 * @param {string} runDir
 * @param {string|null} name - e.g. "v3".
 */
export async function commandNewVersion(runDir, { name }) {
  const binding = resolveRunHarnessBinding(runDir, "ppt_flow.new-version.binding");
  if (!binding) return 1;
  const { resolved, deckDir } = binding;

  const { activateCleanPageImageTargetDraft } = await import("../../../shared/state/state.mjs");
  let target;
  try {
    const source = findSlideSpecs(resolved);
    if (!source) throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    const sourcePipeline = probeProductionMarker(readFileSync(source), { source: basename(source) });
    if (sourcePipeline.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
      throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    }
    target = createVersion(resolved, name);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed(
      "ppt_flow.new-version",
      err.message,
      "Fix the reported error and retry new-version"
    );
    return 1;
  }

  // The visible vN/ is published. Target-draft activation is a separate,
  // versionable effect; its failure must not hide the published version.
  let activation;
  try {
    activation = activateCleanPageImageTargetDraft(deckDir, { sourceRunDir: resolved, targetRunDir: target });
  } catch (activationError) {
    const result = commandResult({
      operation: "new-version",
      state: "partial-effect",
      effect: { target },
      partial: { activation: { status: "failed" } },
      facts: { target, activation: null },
    });
    console.log(renderNewVersionText(result));
    console.error(`✗ ${activationError.message}`);
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Clean version created but the target authoring draft was not activated.",
      hint: "Re-run new-version to resume activation of the created target; do not delete the created version directory.",
      where: "ppt_flow.new-version",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "artifact",
        operation: "new-version",
        reason: { kind: "target_draft_activation_failed" },
        source: { path: target },
        next: createCliNext("repair_prerequisite", { default: "Re-run new-version to resume activation of the created target; do not delete the created version directory." }),
      },
    });
    return 1;
  }

  const ownerResult = commandResult({
    operation: "new-version",
    state: "success",
    effect: { target, activation: activation?.workflow ?? null },
    facts: { target, activation },
  });
  console.log(renderNewVersionText(ownerResult));
  return 0;
}
