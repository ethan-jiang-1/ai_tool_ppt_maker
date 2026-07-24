#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage4_build_pptx.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { CLI_ERROR_CODES, createCliNext, diagnosticFromError, emitCliError } from "../shared/cli/cli_error.mjs";
import {
  HTML_FIRST_PIPELINE,
  WHOLE_PAGE_IMAGE2_PIPELINE,
  probeProductionMarker,
} from "../shared/run-bundle/production_marker.mjs";
import { buildPresentation } from "./index.mjs";

async function classifyRun(runDir) {
  const source = join(resolve(runDir), "slide-specifications.md");
  if (!existsSync(source)) throw new Error("current slide-specifications.md is required for Stage 4");
  const marker = probeProductionMarker(readFileSync(source), { source });
  if (marker.branch !== HTML_FIRST_PIPELINE && marker.branch !== WHOLE_PAGE_IMAGE2_PIPELINE) {
    throw new Error("Stage 4 requires an explicit current production.pipeline marker");
  }
  return marker.branch;
}

async function runStage4(opts) {
  if (!opts.runDir) throw new Error("USAGE: --run-dir is required");
  const runDir = resolve(opts.runDir);
  return await classifyRun(runDir) === HTML_FIRST_PIPELINE
    ? buildPresentation(runDir, { title: opts.title })
    : (await import("../04-image-production/index.mjs")).buildWholePagePresentation({ runDir, title: opts.title });
}

export async function main(argv = process.argv) {
  const program = new Command();
  program
    .name("stage4_build_pptx.mjs")
    .description("Stage 4: Build the PPTX container from current final slides")
    .option("--run-dir <path>", "Canonical version run directory")
    .option("--title <string>", "Deck title", "Presentation")
    .action(async (opts) => {
      try {
        await runStage4(opts);
      } catch (error) {
        console.error(`✗ ${error.message}`);
        const structured = diagnosticFromError(error);
        const usage = String(error.message || "").startsWith("USAGE:");
        emitCliError({
          code: usage ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED,
          message: usage ? String(error.message).slice("USAGE:".length).trim() : "Stage 4 could not assemble the PPTX from the selected slide artifacts.",
          hint: "Restore a one-to-one slide plan and header-locked image set, then rerun Stage 4.",
          where: "stage4_build_pptx.main",
          diagnostic: structured || {
            version: 1,
            category: usage ? "usage" : "artifact",
            stage: "stage4",
            operation: "build-pptx",
            source: { path: opts.runDir },
            reason: { kind: "missing_ambiguous_or_invalid_current_final_slide" },
            next: createCliNext("repair_prerequisite", { default: "Rerun Stage 3, and Stage 2 if needed, then rebuild the PPTX." }),
          },
        });
        process.exitCode = 1;
      }
    });
  await program.parseAsync(argv);
}

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage4_build_pptx" });
  await main();
}
