import { basename } from "node:path";
import { readFileSync } from "node:fs";
import { emitFailed, resolveRunHarnessBinding } from "../command_support.mjs";
import { createVersion, findSlideSpecs } from "../../run-bundle/bundle_layout.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, probeProductionMarker } from "../../run-bundle/production_marker.mjs";

// Command: new-version
// ---------------------------------------------------------------------------

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
  try {
    const {
      activateCleanPageImageTargetDraft,
    } = await import("../../../shared/state/state.mjs");
    const source = findSlideSpecs(resolved);
    if (!source) throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    const sourcePipeline = probeProductionMarker(readFileSync(source), { source: basename(source) });
    if (sourcePipeline.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
      throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    }
    const target = createVersion(resolved, name);
    const activation = activateCleanPageImageTargetDraft(deckDir, { sourceRunDir: resolved, targetRunDir: target });
    console.log(`✓ Created clean version: ${target}`);
    console.log("  Generated artifacts were not copied.");
    if (activation) {
      console.log(`  Activated Page Image ${activation.workflow} authoring draft.`);
    }
    return 0;
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed(
      "ppt_flow.new-version",
      err.message,
      "Fix the reported error and retry new-version"
    );
    return 1;
  }
}

// ---------------------------------------------------------------------------
