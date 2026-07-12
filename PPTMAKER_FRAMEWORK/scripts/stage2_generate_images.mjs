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

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  generateOneImage,
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
      console.log(`  ERROR ${index}/${total}: ${slideId}: stale cached image (${provenance.reason}); ${hint}`);
      continue;
    }

    if (force && Object.hasOwn(manifest.slides, slideId)) {
      delete manifest.slides[slideId];
      writeImageManifestAtomic(outDir, manifest);
      manifestError = null;
    }

    console.log(`  generating slide ${index}/${total} (id=${slideId})`);
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
      console.log(`  done ${index}/${total} (id=${slideId})`);
    } catch (err) {
      errors.push(`${slideId}: ${err.message}`);
      console.log(`  ERROR ${index}/${total}: ${slideId}: ${err.message}`);
    }
  }

  console.log(`\n--- Stage 2 complete ---`);
  console.log(`Generated: ${generated}  Skipped: ${skipped}  Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  ${e}`);
  }
  return { generated, skipped, errors, profile, selectedIds: workSlides.map((slide) => slide.id) };
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
