import { relative, resolve, sep } from "node:path";
import { readFileSync, realpathSync } from "node:fs";
import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError, registerCliJsonReport } from "../cli_error.mjs";
import { commandReport } from "../command_result.mjs";
import { resolveRunHarnessBinding } from "../command_support.mjs";
import { SCRATCH_SUBDIR } from "../../run-bundle/bundle_layout.mjs";
import {
  applyNarrativePagePlan,
  previewNarrativePagePlan,
} from "../../../01-content/index.mjs";

// Command: paginate
// ---------------------------------------------------------------------------

async function narrativeVisualSystem() {
  const { createPageImageSourceResolver, loadPageImageVisualLanguage } = await import("../../../02-visual-system/index.mjs");
  return Object.freeze({ createPageImageSourceResolver, loadPageImageVisualLanguage });
}

function renderNarrativeResult(result, asJson) {
  if (asJson) {
    const report = commandReport({
      operation: "paginate",
      effect: { kind: result.kind },
      fields: result,
    });
    registerCliJsonReport(report);
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const label = result.applied ? "Applied" : "Preview";
  console.log(`${label}: ${result.plan_sha256}`);
  console.log(`Target: ${result.target_run_version} (${result.target_workflow})`);
  if (result.plan_path) console.log(`Plan: ${result.plan_path}`);
  for (const page of result.pages || []) {
    const lineage = page.blocks.map((block) => `Block ${block.block_ordinal} beats ${block.beat_ordinals.join(",")}`).join("; ");
    console.log(`${String(page.position).padStart(2, "0")}: ${page.slide_id} - ${lineage}`);
  }
}

export async function commandPaginate(subcommand, runDir, opts = {}) {
  if (!resolveRunHarnessBinding(runDir, `ppt_flow.paginate.${subcommand}.binding`)) return 1;
  try {
    const visualSystem = await narrativeVisualSystem();
    if (subcommand === "plan") {
      const result = previewNarrativePagePlan({
        sourceRunDir: runDir,
        candidatePath: opts.candidate,
        visualSystem,
      });
      renderNarrativeResult(result, opts.json);
      return 0;
    }
    if (subcommand === "apply") {
      if (!opts.planSha256) {
        const error = new Error("paginate apply requires --plan-sha256 from the confirmed narrative preview");
        error.code = "missing_plan_sha256";
        throw error;
      }
      const resolvedRunDir = resolve(runDir);
      const scratch = resolve(resolvedRunDir, SCRATCH_SUBDIR);
      const planPath = resolve(opts.plan);
      const rel = relative(scratch, planPath);
      if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) {
        throw new Error("paginate apply plan must be inside the current version _scratch/");
      }
      const realScratch = realpathSync(scratch);
      const realPlan = realpathSync(planPath);
      const realRel = relative(realScratch, realPlan);
      if (!realRel || realRel === ".." || realRel.startsWith(`..${sep}`)) {
        throw new Error("paginate apply realpath must remain inside the current version _scratch/");
      }
      const plan = JSON.parse(readFileSync(planPath, "utf8"));
      const result = applyNarrativePagePlan({
        sourceRunDir: runDir,
        plan,
        planSha256: opts.planSha256,
        visualSystem,
      });
      renderNarrativeResult(result, opts.json);
      return 0;
    }
    throw new Error(`unsupported paginate subcommand ${subcommand}`);
  } catch (error) {
    emitCliError({
      code: error.code === "missing_plan_sha256" || /_scratch|subcommand/i.test(error.message) ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED,
      message: error.message,
      hint: "Inspect the narrative plan inputs and retry",
      where: `ppt_flow.paginate.${subcommand}`,
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: error.code === "missing_plan_sha256" || /_scratch|subcommand/i.test(error.message) ? "usage" : "artifact",
        operation: subcommand,
        source: { path: resolve(runDir) },
        reason: { kind: error.code || error.name || "narrative_plan_failed" },
        next: createCliNext(error.code === "missing_plan_sha256" || /_scratch|subcommand/i.test(error.message) ? "fix_arguments" : "inspect", {
          default: "Inspect the narrative plan inputs and retry",
        }),
      },
    });
    return 1;
  }
}
