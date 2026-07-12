#!/usr/bin/env node
/**
 * Stage 4: Build the PPTX container — wrap final slide images into a .pptx file.
 *
 * Reads header-locked PNG images from Stage 3 and slide_plan.json from Stage 1.
 * Creates a 16:9 PPTX with one full-bleed image per slide. No editable text objects
 * — the PPTX is a media container; all content is in the images.
 *
 * Usage:
 *   node stage4_build_pptx.mjs \
 *       --images header_locked/ \
 *       --slide-plan slide_plan.json \
 *       --out ppt/deck.pptx \
 *       --title "My Presentation"
 *
 * Dependencies: pptxgenjs
 *
 * Imports path constants from bundle_layout.mjs.
 */

import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, basename, extname, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import PptxGenJS from "pptxgenjs";

import {
  GEN_HEADER_LOCKED_SUBDIR,
  GEN_SLIDE_PLAN,
  GEN_PPT_SUBDIR,
  generatedDir,
} from "./bundle_layout.mjs";

// ---------------------------------------------------------------------------
// 16:9 standard — 16:9 full-bleed
// ---------------------------------------------------------------------------

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_HEIGHT_IN = 7.5;

/** Image extensions recognised as slide images. */
const IMG_EXTS = new Set([".png", ".jpg", ".jpeg"]);

// ---------------------------------------------------------------------------
// Image matching — anchored to prevent substring cross-hits
// ---------------------------------------------------------------------------

/**
 * Escape a string for use in a literal regex.
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Images matching a slide id under the canonical NN_<id> (or bare <id>) naming
 * — ANCHORED and sorted. An unanchored substring match cross-hits ids like 's1'
 * onto '10_s10.png'; anchoring the id to the stem's end prevents wrong-image builds.
 *
 * Matches the slide-id regex:  r"^(\d+_)?{re.escape(slide_id)}$"
 *
 * @param {string} imgDir - Directory containing Stage 3 header-locked images.
 * @param {string} slideId - The slide identifier (e.g. "opener", "s1", "closer").
 * @returns {string[]} Sorted array of absolute file paths.
 */
function matchSlideImage(imgDir, slideId) {
  const pat = new RegExp(`^(\\d+_)?${escapeRegex(slideId)}$`);
  const results = [];
  let entries;
  try {
    entries = readdirSync(imgDir);
  } catch {
    return results;
  }
  for (const name of entries) {
    const ext = extname(name).toLowerCase();
    if (!IMG_EXTS.has(ext)) continue;
    const stem = basename(name, ext);
    if (pat.test(stem)) {
      results.push(resolve(imgDir, name));
    }
  }
  results.sort();
  return results;
}

// ---------------------------------------------------------------------------
// Programmatic API
// ---------------------------------------------------------------------------

/**
 * Build a 16:9 .pptx from a set of header-locked slide images.
 *
 * @param {object} opts
 * @param {string} opts.images    - Directory containing Stage 3 header-locked PNGs.
 * @param {string} opts.slidePlan - Path to slide_plan.json from Stage 1.
 * @param {string} opts.out       - Output .pptx path.
 * @param {string} [opts.title]   - Deck title (metadata only).
 * @returns {Promise<{slideCount: number, outPath: string}>}
 */
export async function buildPptx({ images, slidePlan, out, title = "Presentation" }) {
  // ---- load slide plan -----------------------------------------------------
  let planData;
  try {
    planData = JSON.parse(readFileSync(slidePlan, "utf-8"));
  } catch (err) {
    throw new Error(`Cannot read slide plan ${slidePlan}: ${err.message}`);
  }
  const slides = planData.slides ?? [];

  // ---- resolve images — fail loud BEFORE building --------------------------
  // A skipped slide would silently shrink the deck and misalign downstream
  // speaker notes; validate the full image set upfront (deterministic).
  const imgDir = resolve(images);
  const resolved = [];
  const problems = [];

  for (const slide of slides) {
    const sid = slide.id;
    const hits = matchSlideImage(imgDir, sid);
    if (hits.length === 0) {
      problems.push(
        `no image for slide ${JSON.stringify(sid)} (expected NN_${sid}.png in ${basename(imgDir)}/)`
      );
    } else if (hits.length > 1) {
      problems.push(
        `ambiguous images for slide ${JSON.stringify(sid)}: ${hits.map((h) => basename(h)).join(", ")}`
      );
    } else {
      resolved.push(hits[0]);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `✗ Stage 4 cannot build the deck — ${problems.length} image problem(s):\n` +
        problems.map((p) => `  - ${p}`).join("\n") +
        `\n  Re-run Stage 3 (and Stage 2 if images are missing) so every slide has ` +
        `exactly one header-locked image, then Stage 4.`
    );
  }

  // ---- build PPTX ----------------------------------------------------------
  const pres = new PptxGenJS();

  // 16:9 — LAYOUT_WIDE is 13.333" x 7.5"
  pres.layout = "LAYOUT_WIDE";
  pres.author = "PPT Maker Framework";
  pres.title = title;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const imgPath = resolved[i];
    const slideId = slide.id;

    const pptSlide = pres.addSlide();

    // Full-bleed image shape — 16:9 full-bleed
    //   new_slide.shapes.add_picture(str(img_path),
    //       left=Inches(0), top=Inches(0),
    //       width=SLIDE_WIDTH_IN, height=SLIDE_HEIGHT_IN)
    pptSlide.addImage({
      path: imgPath,
      x: 0,
      y: 0,
      w: SLIDE_WIDTH_IN,
      h: SLIDE_HEIGHT_IN,
    });

    console.error(`  Slide ${i + 1}: ${slideId}  ← ${basename(imgPath)}`);
  }

  // Ensure output directory exists
  const outPath = resolve(out);
  mkdirSync(dirname(outPath), { recursive: true });

  await pres.writeFile({ fileName: outPath });

  console.error(`\n--- Stage 4 complete ---`);
  console.error(`PPTX: ${outPath}  (${slides.length} slides)`);

  return { slideCount: slides.length, outPath };
}

/**
 * Convenience wrapper that resolves image dir, slide plan, and output path
 * from runDir using bundle_layout.mjs constants — callers don't hardcode
 * subdirectory names.
 *
 * @param {string} runDir   - Path to the version run directory (deck_x/3_versions/vN/).
 * @param {string} [title]  - Deck title.
 * @returns {Promise<{slideCount: number, outPath: string}>}
 */
export async function buildPptxFromRunDir(runDir, title = "Presentation") {
  const genDir = generatedDir(runDir);
  return buildPptx({
    images: join(genDir, GEN_HEADER_LOCKED_SUBDIR),
    slidePlan: join(genDir, GEN_SLIDE_PLAN),
    out: join(genDir, GEN_PPT_SUBDIR, "deck.pptx"),
    title,
  });
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

/**
 * Run Stage 4 from the command line.
 * @param {string[]} [argv] - process.argv (or test args).
 * @returns {Promise<{slideCount: number, outPath: string}>}
 */
export async function main(argv = process.argv) {
  const program = new Command();

  program
    .name("stage4_build_pptx.mjs")
    .description("Stage 4: Build the PPTX container from header-locked slide images")
    .requiredOption("--images <dir>", "Directory containing Stage 3 header-locked images")
    .requiredOption("--slide-plan <path>", "slide_plan.json from Stage 1")
    .requiredOption("--out <path>", "Output .pptx path")
    .option("--title <string>", "Deck title", "Presentation")
    .action(async (opts) => {
      try {
        await buildPptx({
          images: opts.images,
          slidePlan: opts.slidePlan,
          out: opts.out,
          title: opts.title,
        });
      } catch (err) {
        console.error(`✗ ${err.message}`);
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

// Run when executed directly (not imported)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith("/stage4_build_pptx.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage4_build_pptx" });
  main();
}
