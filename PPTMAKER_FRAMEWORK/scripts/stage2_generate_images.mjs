#!/usr/bin/env node
/**
 * Stage 2: Generate full-page slide images with style anchoring.
 *
 * In-framework Node implementation — no external skills, no Python, no bash.
 *
 * Usage:
 *   node stage2_generate_images.mjs \
 *     --prompt-json .../_prompts.json \
 *     --out-dir .../page_images_full \
 *     --style-reference .../style_master.jpg \
 *     --resolution 2k \
 *     [--only id] [--force] [--prompt-is-final] [--base-url URL] [--dry-run]
 */

import "./lib/cli_bootstrap.mjs?entry=stage2_generate_images.mjs";
import { CLI_ERROR_CODES, createCliNext, emitCliError, emitCliProgress } from "./lib/cli_error.mjs";

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  generateOneImage,
  ImageProviderError,
  resolveVendors,
  bridgeCredentials,
  DEFAULT_MODEL,
} from "./image_api_client.mjs";
import { IMAGE_TRACE_SUFFIX } from "./bundle_layout.mjs";
import {
  buildImageManifestEntry,
  generationProfile,
  inspectImageProvenance,
  provenanceRepairHint,
  readImageManifest,
  sha256File,
  writeImageManifestAtomic,
} from "./lib/image_provenance.mjs";

const __filename = fileURLToPath(import.meta.url);

/**
 * @param {object} opts
 * @param {string} opts.promptJson
 * @param {string} opts.outDir
 * @param {string} opts.styleReference
 * @param {string} [opts.resolution]
 * @param {string} [opts.model]
 * @param {string[]} [opts.only]
 * @param {boolean} [opts.force]
 * @param {boolean} [opts.promptIsFinal]
 * @param {string[]} [opts.baseUrl]
 * @param {boolean} [opts.dryRun]
 * @returns {Promise<{generated:number, skipped:number, errors:string[],failures:object[]}>}
 */
export async function generateImages({
  promptJson,
  outDir,
  styleReference,
  resolution = "2k",
  model = DEFAULT_MODEL,
  only = [],
  force = false,
  promptIsFinal = false,
  baseUrl = [],
  dryRun = false,
} = {}) {
  bridgeCredentials();

  if (!existsSync(promptJson)) {
    throw new Error(`Prompt JSON not found: ${promptJson}`);
  }
  if (!existsSync(styleReference)) {
    throw new Error(`Style reference not found: ${styleReference}`);
  }

  const data = JSON.parse(readFileSync(promptJson, "utf-8"));
  const slides = data.slides || data.prompts || [];
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error(`No slides in ${promptJson}`);
  }

  const onlySet = only.length > 0 ? new Set(only) : null;
  mkdirSync(outDir, { recursive: true });
  const styleReferenceSha256 = sha256File(styleReference);
  const profile = generationProfile({
    styleReferenceSha256,
    resolution,
    model,
    semanticOptions: { size: "16:9", n: 1 },
  });
  let { manifest, error: manifestError } = readImageManifest(outDir);

  let baseUrls = [];
  if (!dryRun) {
    // Fail-fast credential resolve; CLI --base-url extras only (empty → full IMAGE2_VENDORS/env).
    resolveVendors(baseUrl);
    baseUrls = baseUrl;
  }

  let generated = 0;
  let skipped = 0;
  /** @type {string[]} */
  const errors = [];
  /** @type {Array<{slideId:string,outPath:string,category:string,reason:object,message:string}>} */
  const failures = [];

  const workSlides = slides.filter((slide) => {
    const slideId = slide.id;
    if (!slideId) return false;
    if (onlySet && !onlySet.has(slideId)) return false;
    return true;
  });
  const total = workSlides.length;
  let index = 0;

  for (const slide of workSlides) {
    index += 1;
    const slideId = slide.id;
    const outName = slide.out || `${slideId}.png`;
    const outPath = join(outDir, outName);
    const stem = basename(outName, ".png");
    const tracePath = join(outDir, `${stem}${IMAGE_TRACE_SUFFIX}`);

    let prompt = String(slide.prompt || "").trim();
    if (!prompt) {
      errors.push(`${slideId}: empty prompt`);
      failures.push({ slideId, outPath, category: "source_validation", reason: { kind: "missing_prompt" }, message: "slide image prompt is empty" });
      console.log(`  ERROR ${index}/${total}: ${slideId}: empty prompt`);
      continue;
    }

    // When Stage 1 already assembled the final audited prompt, do not mutate it.
    // (Anchoring clause is already in the prompt text; we only attach the reference image.)
    void promptIsFinal;

    if (dryRun) {
      console.log(`  [DRY RUN] ${index}/${total} Would generate ${outPath}`);
      generated += 1;
      continue;
    }

    if (!force && existsSync(outPath)) {
      const provenance = inspectImageProvenance({
        slide: { ...slide, prompt },
        outDir,
        manifest,
        manifestError,
        profile,
      });
      if (provenance.current) {
        skipped += 1;
        console.log(`  done ${index}/${total} (id=${slideId}) skipped-exists`);
        continue;
      }
      const hint = provenanceRepairHint([slideId]);
      errors.push(`${slideId}: stale cached image (${provenance.reason}); ${hint}`);
      failures.push({ slideId, outPath, category: "artifact", reason: { kind: "stale_image_provenance" }, message: "cached slide image provenance is stale" });
      console.log(`  ERROR ${index}/${total}: ${slideId}: stale cached image (${provenance.reason}); ${hint}`);
      continue;
    }

    if (force && Object.hasOwn(manifest.slides, slideId)) {
      delete manifest.slides[slideId];
      writeImageManifestAtomic(outDir, manifest);
      manifestError = null;
    }

    emitCliProgress("item_start", { stage: "stage2", index, total, id: slideId });
    try {
      const trace = await generateOneImage({
        prompt,
        outPath,
        styleReferencePath: styleReference,
        resolution,
        model,
        force: true,
        baseUrls,
        tracePath,
      });
      if (!trace || !existsSync(outPath)) {
        throw new Error("generator returned without a current output image");
      }
      const entry = buildImageManifestEntry({
        slideId,
        output: outName,
        prompt,
        profile,
        imagePath: outPath,
      });
      manifest.slides[slideId] = entry;
      writeImageManifestAtomic(outDir, manifest);
      manifestError = null;
      generated += 1;
      emitCliProgress("item_complete", { stage: "stage2", index, total, id: slideId, status: "generated" });
    } catch (err) {
      errors.push(`${slideId}: ${err.message}`);
      failures.push({
        slideId,
        outPath,
        category: err instanceof ImageProviderError ? "provider" : "artifact",
        reason: err instanceof ImageProviderError
          ? { kind: err.reason || "provider_generation_failed", ...(err.status !== null ? { actual: err.status } : {}) }
          : { kind: "image_generation_failed" },
        message: err instanceof ImageProviderError ? "image provider failed for selected slide" : "slide image artifact could not be produced",
      });
      console.log(`  ERROR ${index}/${total}: ${slideId}: ${err.message}`);
    }
  }

  console.log(`\n--- Stage 2 complete ---`);
  console.log(`Generated: ${generated}  Skipped: ${skipped}  Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  ${e}`);
  }
  return { generated, skipped, errors, failures, profile, selectedIds: workSlides.map((slide) => slide.id) };
}

export function buildImageFailureDiagnostic({ failures, promptJson, outDir, styleReference, resolution, selectedIds = [] }) {
  const categories = new Set(failures.map((failure) => failure.category));
  const category = categories.size === 1 ? [...categories][0] : "artifact";
  const action = category === "provider" ? "repair_environment" : "repair_prerequisite";
  return {
    version: 1,
    category,
    stage: "stage2",
    operation: "generate-images",
    source: { path: promptJson },
    issues: failures.map((failure) => ({
      message: failure.message,
      subject: { kind: "slide", id: failure.slideId },
      source: { path: promptJson },
      reason: failure.reason,
      lineage: [
        { kind: "derived", path: promptJson, stage: "stage1" },
        { kind: "derived", path: failure.outPath, stage: "stage2" },
      ],
    })),
    next: createCliNext(action, {
      inspect: [{ path: promptJson }, { path: outDir }],
      invocation: { program: "node", args: [__filename, "--prompt-json", promptJson, "--out-dir", outDir, "--style-reference", styleReference, "--resolution", resolution, ...selectedIds.flatMap((id) => ["--only", id]), "--force"] },
      default: category === "provider"
        ? "Repair provider availability without exposing credentials, then rerun only the failed slides."
        : "Repair or rerun the named prerequisite; do not hand-edit generated images.",
    }),
  };
}

/**
 * @param {string[]} [argv]
 * @returns {Promise<void>}
 */
export async function main(argv = process.argv) {
  const program = new Command();
  program
    .name("stage2_generate_images.mjs")
    .description("Stage 2: generate slide images (in-framework Node, no skills)")
    .requiredOption("--prompt-json <path>", "Stage 1 _prompts.json")
    .requiredOption("--out-dir <path>", "Output directory for PNGs")
    .requiredOption("--style-reference <path>", "style_master.jpg path")
    .option("--resolution <res>", "1k | 2k | 4k", "2k")
    .option("--model <name>", "Image model", DEFAULT_MODEL)
    .option("--only <id>", "Slide id to generate (repeatable)", (v, prev) => [...prev, v], [])
    .option("--force", "Regenerate even if PNG exists")
    .option("--prompt-is-final", "Do not mutate prompt text (Stage 1 already assembled)")
    .option("--base-url <url>", "API base URL (repeatable)", (v, prev) => [...prev, v], [])
    .option("--dry-run", "Print plan only")
    .action(async (opts) => {
      try {
        const result = await generateImages({
          promptJson: opts.promptJson,
          outDir: opts.outDir,
          styleReference: opts.styleReference,
          resolution: opts.resolution,
          model: opts.model,
          only: opts.only || [],
          force: !!opts.force,
          promptIsFinal: !!opts.promptIsFinal,
          baseUrl: opts.baseUrl || [],
          dryRun: !!opts.dryRun,
        });
        if (result.errors.length > 0) {
          emitCliError({
            code: CLI_ERROR_CODES.FAILED,
            message: `${result.errors.length} selected slide image(s) failed in Stage 2.`,
            hint: "Inspect the retained slide/artifact evidence and repair the source or provider prerequisite.",
            where: "stage2_generate_images.generate",
            diagnostic: buildImageFailureDiagnostic({ failures: result.failures, promptJson: opts.promptJson, outDir: opts.outDir, styleReference: opts.styleReference, resolution: opts.resolution, selectedIds: result.selectedIds }),
          });
        }
        process.exit(result.errors.length > 0 ? 1 : 0);
      } catch (err) {
        console.error(`✗ ${err.message}`);
        const missingPrompt = !existsSync(opts.promptJson);
        const missingStyle = !existsSync(opts.styleReference);
        emitCliError({
          code: CLI_ERROR_CODES.FAILED,
          message: "Stage 2 prerequisites are missing or invalid.",
          hint: "Restore the Stage 1 prompt manifest and style reference before generating images.",
          where: "stage2_generate_images.main",
          diagnostic: {
            version: 1,
            category: "artifact",
            stage: "stage2",
            operation: "load-prerequisites",
            source: { path: missingPrompt ? opts.promptJson : opts.styleReference },
            reason: { kind: missingPrompt ? "missing_prompt_manifest" : missingStyle ? "missing_style_reference" : "invalid_generation_prerequisite" },
            lineage: [{ kind: "derived", path: opts.promptJson, stage: "stage1" }, { kind: "derived", path: opts.outDir, stage: "stage2" }],
            next: createCliNext("repair_prerequisite", { inspect: [{ path: opts.promptJson }, { path: opts.styleReference }], default: "Rerun Stage 1 or style-master for the missing prerequisite, then rerun Stage 2." }),
          },
        });
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

if (process.argv[1] === __filename || process.argv[1]?.endsWith("/stage2_generate_images.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage2_generate_images" });
  main();
}
