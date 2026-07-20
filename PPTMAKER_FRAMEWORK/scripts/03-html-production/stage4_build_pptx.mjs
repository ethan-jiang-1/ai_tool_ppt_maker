#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage4_build_pptx.mjs";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { CLI_ERROR_CODES, createCliNext, diagnosticFromError, emitCliError } from "../shared/cli/cli_error.mjs";
import { HTML_FIRST_PIPELINE, probeProductionMarker } from "../shared/run-bundle/production_marker.mjs";
import { buildLegacyPresentation, buildPresentation } from "./index.mjs";

async function classifyRun(runDir) {
  const source = join(resolve(runDir), "slide-specifications.md");
  if (!existsSync(source)) return "legacy";
  return probeProductionMarker(readFileSync(source), { source: basename(source) }).branch;
}

async function runStage4(opts) {
  const legacyFields = [opts.images, opts.slidePlan, opts.out].filter((value) => value != null);
  if (opts.runDir && legacyFields.length) throw new Error("USAGE: --run-dir is mutually exclusive with legacy artifact flags");
  if (opts.runDir) {
    const runDir = resolve(opts.runDir);
    return await classifyRun(runDir) === HTML_FIRST_PIPELINE
      ? buildPresentation(runDir, { title: opts.title })
      : (await import("../05-iteration/index.mjs")).buildLegacyPresentation({ runDir, title: opts.title });
  }
  if (!opts.images || !opts.slidePlan || !opts.out) throw new Error("USAGE: legacy mode requires --images, --slide-plan, and --out");
  const planGenerated = dirname(resolve(opts.slidePlan));
  const candidateSource = join(dirname(planGenerated), "slide-specifications.md");
  if (basename(planGenerated) === "_generated" && existsSync(candidateSource) && probeProductionMarker(readFileSync(candidateSource)).branch === HTML_FIRST_PIPELINE) {
    throw new Error("USAGE: legacy artifact mode cannot target an HTML-first run; use --run-dir");
  }
  const phase5 = await import("../05-iteration/index.mjs");
  const plan = JSON.parse(readFileSync(opts.slidePlan, "utf8"));
  const legacySlides = await phase5.resolveLegacyFinalSlides({
    runDir: dirname(dirname(resolve(opts.images))),
    directory: resolve(opts.images),
    slides: plan.slides || [],
  });
  return buildLegacyPresentation({ ...opts, legacySlides });
}

export async function main(argv = process.argv) {
  const program = new Command();
  program
    .name("stage4_build_pptx.mjs")
    .description("Stage 4: Build the PPTX container from provider-neutral final slides")
    .option("--run-dir <path>", "Canonical version run directory (HTML or legacy classification)")
    .option("--images <dir>", "Legacy compatibility directory containing Stage 3 images")
    .option("--slide-plan <path>", "Legacy compatibility slide_plan.json")
    .option("--out <path>", "Legacy compatibility output .pptx path")
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
            source: { path: opts.slidePlan || opts.runDir },
            reason: { kind: usage && String(error.message).includes("HTML-first") ? "html_legacy_artifact_mode_forbidden" : "missing_ambiguous_or_invalid_slide_image" },
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
