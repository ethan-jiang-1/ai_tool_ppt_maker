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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  generateOneImage,
  resolveBaseUrls,
  bridgeCredentials,
  DEFAULT_MODEL,
} from "./image_api_client.mjs";
import { IMAGE_TRACE_SUFFIX } from "./bundle_layout.mjs";

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
 * @returns {Promise<{generated:number, skipped:number, errors:string[]}>}
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

  let baseUrls = [];
  if (!dryRun) {
    baseUrls = resolveBaseUrls(baseUrl);
  }

  let generated = 0;
  let skipped = 0;
  /** @type {string[]} */
  const errors = [];

  for (const slide of slides) {
    const slideId = slide.id;
    if (!slideId) continue;
    if (onlySet && !onlySet.has(slideId)) continue;

    const outName = slide.out || `${slideId}.png`;
    const outPath = join(outDir, outName);
    const stem = basename(outName, ".png");
    const tracePath = join(outDir, `${stem}${IMAGE_TRACE_SUFFIX}`);

    let prompt = String(slide.prompt || "").trim();
    if (!prompt) {
      errors.push(`${slideId}: empty prompt`);
      console.log(`  ERROR: ${slideId}: empty prompt`);
      continue;
    }

    // When Stage 1 already assembled the final audited prompt, do not mutate it.
    // (Anchoring clause is already in the prompt text; we only attach the reference image.)
    void promptIsFinal;

    if (dryRun) {
      console.log(`  [DRY RUN] Would generate ${outPath}`);
      generated += 1;
      continue;
    }

    try {
      const trace = await generateOneImage({
        prompt,
        outPath,
        styleReferencePath: styleReference,
        resolution,
        model,
        force,
        baseUrls,
        tracePath,
      });
      if (trace) generated += 1;
      else skipped += 1;
    } catch (err) {
      errors.push(`${slideId}: ${err.message}`);
      console.log(`  ERROR: ${slideId}: ${err.message}`);
    }
  }

  console.log(`\n--- Stage 2 complete ---`);
  console.log(`Generated: ${generated}  Skipped: ${skipped}  Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  ${e}`);
  }
  return { generated, skipped, errors };
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
        process.exit(result.errors.length > 0 ? 1 : 0);
      } catch (err) {
        console.error(`✗ ${err.message}`);
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

if (process.argv[1] === __filename || process.argv[1]?.endsWith("/stage2_generate_images.mjs")) {
  main();
}
