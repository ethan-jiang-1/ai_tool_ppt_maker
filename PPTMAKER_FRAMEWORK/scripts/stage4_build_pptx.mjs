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

import "./lib/cli_bootstrap.mjs?entry=stage4_build_pptx.mjs";
import { CLI_ERROR_CODES, attachCliDiagnostic, createCliNext, diagnosticFromError, emitCliError } from "./lib/cli_error.mjs";

import { existsSync, readFileSync, readdirSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve, basename, extname, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import PptxGenJS from "pptxgenjs";

import {
  GEN_HEADER_LOCKED_SUBDIR,
  GEN_SLIDE_PLAN,
  GEN_PPT_SUBDIR,
  GEN_QA_SUBDIR,
  generatedDir,
} from "./bundle_layout.mjs";
import {
  ARTIFACT_KIND_FINAL_SLIDE,
  ARTIFACT_STATUS_VERIFIED,
  RENDER_ENGINE_IMAGE2,
  resolveHtmlFinalSlideArtifacts,
  readArtifactManifest,
  resolveRenderArtifact,
} from "./lib/render_artifacts.mjs";
import { sha256File } from "./lib/image_provenance.mjs";
import { HTML_FIRST_PIPELINE, validateAndBuildHtmlFirstPlan } from "./lib/html_slide_contract.mjs";
import { inspectHtmlReviewReadiness } from "./lib/html_review_evidence.mjs";
import { publishHtmlDeliveryContactSheet } from "./lib/html_preview.mjs";

// ---------------------------------------------------------------------------
// 16:9 standard — 16:9 full-bleed
// ---------------------------------------------------------------------------

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_HEIGHT_IN = 7.5;

/** Image extensions recognised as slide images. */
const IMG_EXTS = new Set([".png", ".jpg", ".jpeg"]);
export const PPTX_ASSEMBLY_RECEIPT_VERSION = 1;
export const PPTX_ASSEMBLY_HTML_RECEIPT_VERSION = 2;
export const PPTX_ASSEMBLY_RECEIPT_NAME = "pptx_assembly.json";

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temp, path);
  return path;
}

function runRelativePath(runDir, path) {
  return relative(runDir, path).split(sep).join("/");
}

export function pptxAssemblyReceiptPath({ images, out }) {
  const generated = dirname(resolve(images));
  const runDir = dirname(generated);
  return {
    generated,
    runDir,
    path: join(generated, GEN_QA_SUBDIR, PPTX_ASSEMBLY_RECEIPT_NAME),
    outPath: resolve(out),
  };
}

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
  const receiptLocation = pptxAssemblyReceiptPath({ images, out });
  rmSync(receiptLocation.path, { force: true });
  // ---- load slide plan -----------------------------------------------------
  let planData;
  try {
    planData = JSON.parse(readFileSync(slidePlan, "utf-8"));
  } catch (err) {
    throw attachCliDiagnostic(new Error(`Cannot read slide plan ${slidePlan}: ${err.message}`), {
      version: 1,
      category: "artifact",
      stage: "stage4",
      operation: "load-slide-plan",
      source: { path: slidePlan },
      reason: { kind: "invalid_slide_plan" },
      lineage: [{ kind: "derived", path: slidePlan, stage: "stage1" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 4." }),
    });
  }
  const slides = planData.slides ?? [];

  // ---- resolve images — fail loud BEFORE building --------------------------
  // A skipped slide would silently shrink the deck and misalign downstream
  // speaker notes; validate the full image set upfront (deterministic).
  const imgDir = resolve(images);
  const resolved = [];
  const problems = [];
  const manifestPath = join(imgDir, "_manifest.json");
  const { manifest, error: manifestError } = readArtifactManifest(manifestPath);

  for (const slide of slides) {
    const sid = slide.slide_id || slide.id;
    const engine = slide.render_engine || planData.render_engine || RENDER_ENGINE_IMAGE2;
    const artifact = resolveRenderArtifact({
      directory: imgDir,
      manifest,
      manifestError,
      slideId: sid,
      renderEngine: engine,
      artifactKind: ARTIFACT_KIND_FINAL_SLIDE,
    });
    if (artifact.status !== ARTIFACT_STATUS_VERIFIED) {
      problems.push({
        slideId: sid,
        engine,
        reason: artifact.status === "legacy-located"
          ? "legacy_located_image"
          : artifact.status === "ambiguous"
            ? "ambiguous_images"
            : "missing_image",
        hits: artifact.candidates || (artifact.path ? [artifact.path] : []),
        artifact,
      });
    } else {
      resolved.push(artifact);
    }
  }

  if (problems.length > 0) {
    throw attachCliDiagnostic(new Error(
      `✗ Stage 4 cannot build the deck — ${problems.length} image problem(s):\n` +
        problems.map((problem) => problem.reason === "missing_image"
          ? `  - no verified final-slide for ${JSON.stringify(problem.slideId)} (${problem.engine})`
          : problem.reason === "legacy_located_image"
            ? `  - final image for ${JSON.stringify(problem.slideId)} is only legacy-located`
            : `  - ambiguous final images for ${JSON.stringify(problem.slideId)}: ${problem.hits.map((hit) => basename(hit)).join(", ")}`).join("\n") +
        `\n  Re-run local Stage 3 so every planned ID has one verified final-slide artifact.`
    ), {
      version: 1,
      category: "artifact",
      stage: "stage4",
      operation: "resolve-images",
      source: { path: slidePlan },
      issues: problems.map((problem) => ({
        message: problem.reason === "missing_image"
          ? "verified final slide image is missing"
          : problem.reason === "legacy_located_image"
            ? "final slide image is only legacy-located"
            : "multiple final slide images are ambiguous",
        subject: { kind: "slide", id: problem.slideId },
        source: { path: problem.hits[0] || imgDir },
        reason: { kind: problem.reason, status: problem.artifact.status, render_engine: problem.engine, ...(problem.hits.length ? { actual: problem.hits.length, expected: 1 } : { expected: 1 }) },
        lineage: [{ kind: "derived", path: slidePlan, stage: "stage1" }, { kind: "derived", path: problem.hits[0] || imgDir, stage: "stage3" }, { kind: "derived", path: out, stage: "stage4" }],
      })),
      next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }, { path: imgDir }], default: "Rerun Stage 3, and Stage 2 if needed, then rebuild the PPTX." }),
    });
  }

  // ---- build PPTX ----------------------------------------------------------
  const pres = new PptxGenJS();

  // 16:9 — LAYOUT_WIDE is 13.333" x 7.5"
  pres.layout = "LAYOUT_WIDE";
  pres.author = "PPT Maker Framework";
  pres.title = title;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const imgPath = resolved[i].path;
    const slideId = slide.slide_id || slide.id;

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
  const tempPptx = join(dirname(outPath), `.${basename(outPath)}.stage4-${process.pid}-${Date.now()}.tmp.pptx`);
  try {
    await pres.writeFile({ fileName: tempPptx });
    renameSync(tempPptx, outPath);
  } catch (error) {
    rmSync(tempPptx, { force: true });
    throw error;
  }

  const receipt = {
    schema_version: PPTX_ASSEMBLY_RECEIPT_VERSION,
    slide_plan_path: runRelativePath(receiptLocation.runDir, resolve(slidePlan)),
    slide_plan_sha256: sha256File(slidePlan),
    ordered_slide_ids: slides.map((slide) => slide.slide_id || slide.id),
    final_images: resolved.map((artifact) => ({
      slide_id: artifact.slide_id,
      render_engine: artifact.render_engine,
      artifact_kind: artifact.artifact_kind,
      path: runRelativePath(receiptLocation.runDir, artifact.path),
      sha256: artifact.byte_sha256,
      fingerprint: artifact.fingerprint,
    })),
    pptx_path: runRelativePath(receiptLocation.runDir, outPath),
    pptx_sha256: sha256File(outPath),
    created_at: new Date().toISOString(),
  };
  writeJsonAtomic(receiptLocation.path, receipt);

  console.error(`\n--- Stage 4 complete ---`);
  console.error(`PPTX: ${outPath}  (${slides.length} slides)`);

  return { slideCount: slides.length, outPath, receipt, receiptPath: receiptLocation.path };
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
  const sourcePath = join(resolve(runDir), 'slide-specifications.md');
  if (existsSync(sourcePath)) {
    try {
      const marker = (await import('./lib/html_slide_contract.mjs')).probeProductionMarker(readFileSync(sourcePath));
      if (marker.branch === HTML_FIRST_PIPELINE) return buildPptxFromHtmlRunDir(runDir, title);
    } catch {}
  }
  const genDir = generatedDir(runDir);
  return buildPptx({
    images: join(genDir, GEN_HEADER_LOCKED_SUBDIR),
    slidePlan: join(genDir, GEN_SLIDE_PLAN),
    out: join(genDir, GEN_PPT_SUBDIR, "deck.pptx"),
    title,
  });
}

export async function buildPptxFromHtmlRunDir(runDir, title = 'Presentation') {
  const resolvedRun = resolve(runDir);
  const { plan: validatedPlan } = validateAndBuildHtmlFirstPlan({ runDir: resolvedRun });
  const planPath = join(generatedDir(resolvedRun), GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) throw new Error('current HTML slide_plan.json is missing; run Stage 1 first');
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (plan.schema !== validatedPlan.schema || plan.ordered_plan_digest !== validatedPlan.ordered_plan_digest) throw new Error('current HTML slide_plan.json is stale; rerun Stage 1');
  const readiness = inspectHtmlReviewReadiness(resolvedRun);
  if (!readiness.ready) throw new Error(`HTML Stage 4 requires current authoritative content/visual review: ${readiness.reason}`);
  const resolved = resolveHtmlFinalSlideArtifacts({ runDir: resolvedRun, plan, htmlProductionResetId: readiness.html_production_reset_id });
  const generated = generatedDir(resolvedRun); const outPath = join(generated, GEN_PPT_SUBDIR, 'deck.pptx'); mkdirSync(dirname(outPath), { recursive: true });
  const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.author = 'PPT Maker Framework'; pres.title = title;
  for (const entry of resolved.entries) { const slide = pres.addSlide(); slide.addImage({ path: entry.absolute_path, x: 0, y: 0, w: SLIDE_WIDTH_IN, h: SLIDE_HEIGHT_IN }); }
  const temp = join(dirname(outPath), `.${basename(outPath)}.html-stage4-${process.pid}-${Date.now()}.tmp.pptx`);
  try { await pres.writeFile({ fileName: temp }); renameSync(temp, outPath); } catch (error) { rmSync(temp, { force: true }); throw error; }
  const receipt = { schema_version: PPTX_ASSEMBLY_HTML_RECEIPT_VERSION, pipeline: HTML_FIRST_PIPELINE, producer: 'html-compositor-v1', slide_plan_path: runRelativePath(resolvedRun, planPath), slide_plan_sha256: sha256File(planPath), ordered_slide_ids: resolved.entries.map((entry) => entry.slide_id), final_images: resolved.entries.map(({ absolute_path: _absolutePath, ...entry }) => entry), html_production_reset_id: readiness.html_production_reset_id, html_delivery_digest: resolved.html_delivery_digest, pptx_path: runRelativePath(resolvedRun, outPath), pptx_sha256: sha256File(outPath), created_at: new Date().toISOString() };
  const receiptPath = join(generated, GEN_QA_SUBDIR, PPTX_ASSEMBLY_RECEIPT_NAME); writeJsonAtomic(receiptPath, receipt);
  const contactSheet = await publishHtmlDeliveryContactSheet({ runDir: resolvedRun, orderedEntries: resolved.entries.map((entry) => ({ slide_id: entry.slide_id, path: entry.absolute_path })), publicationScope: 'canonical-run', htmlProductionResetId: readiness.html_production_reset_id, slot: 'delivery', ownerDigest: resolved.html_delivery_digest });
  return { slideCount: resolved.entries.length, outPath, receipt, receiptPath, contactSheet };
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
    .description("Stage 4: Build the PPTX container from provider-neutral final slides")
    .option("--run-dir <path>", "Canonical version run directory (HTML or legacy classification)")
    .option("--images <dir>", "Legacy compatibility directory containing Stage 3 images")
    .option("--slide-plan <path>", "Legacy compatibility slide_plan.json")
    .option("--out <path>", "Legacy compatibility output .pptx path")
    .option("--title <string>", "Deck title", "Presentation")
    .action(async (opts) => {
      try {
        const legacyFields = [opts.images, opts.slidePlan, opts.out].filter((value) => value != null);
        if (opts.runDir && legacyFields.length) throw new Error('USAGE: --run-dir is mutually exclusive with legacy artifact flags');
        if (opts.runDir) await buildPptxFromRunDir(resolve(opts.runDir), opts.title);
        else if (!opts.images || !opts.slidePlan || !opts.out) throw new Error('USAGE: legacy mode requires --images, --slide-plan, and --out');
        else await buildPptx({ images: opts.images, slidePlan: opts.slidePlan, out: opts.out, title: opts.title });
      } catch (err) {
        console.error(`✗ ${err.message}`);
        const structured = diagnosticFromError(err);
        emitCliError({
          code: String(err.message || '').startsWith('USAGE:') ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED,
          message: "Stage 4 could not assemble the PPTX from the selected slide artifacts.",
          hint: "Restore a one-to-one slide plan and header-locked image set, then rerun Stage 4.",
          where: "stage4_build_pptx.main",
          diagnostic: structured || {
            version: 1,
            category: "artifact",
            stage: "stage4",
            operation: "build-pptx",
            source: { path: opts.slidePlan },
            reason: { kind: "missing_ambiguous_or_invalid_slide_image" },
            lineage: [
              { kind: "derived", path: opts.slidePlan, stage: "stage1" },
              { kind: "derived", path: opts.images, stage: "stage3" },
              { kind: "derived", path: opts.out, stage: "stage4" },
            ],
            next: createCliNext("repair_prerequisite", {
              inspect: [{ path: opts.slidePlan }, { path: opts.images }],
              invocation: { program: "node", args: [__filename, "--images", opts.images, "--slide-plan", opts.slidePlan, "--out", opts.out, "--title", opts.title] },
              default: "Rerun Stage 3, and Stage 2 if needed, until every slide has exactly one image; do not patch the PPTX directly.",
            }),
          },
        });
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
