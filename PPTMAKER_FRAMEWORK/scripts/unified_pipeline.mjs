#!/usr/bin/env node
/**
 * unified_pipeline.mjs — Node.js ESM pipeline script
 *
 * Single entry point that delegates to the appropriate scripts for each stage.
 * Reads configuration from the run bundle and handles stage-to-stage handoffs.
 *
 * The run-bundle directory structure is defined ONLY in bundle_layout.mjs (the
 * single source of truth) — this orchestrator imports it and never restates paths.
 * Run `node bundle_layout.mjs` to print the canonical tree.
 *
 * Usage:
 *     # Run all 5 stages
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all
 *
 *     # Run a single stage (for editing chain reruns)
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage 3
 *
 *     # Run with custom API base URL
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all --base-url https://api.example.com/v1
 *
 *     # Dry run (print what would be executed)
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all --dry-run
 *
 * Editing chains (after initial production):
 *     Chain A (title text only):  --stage 1,3,4,5
 *     Chain B (image/visual):     --stage 1,2,3,4,5
 *     Chain C (speaker notes):    --stage 5
 */

import "./lib/cli_bootstrap.mjs?entry=unified_pipeline.mjs";
import { CLI_ERROR_CODES, createCliNext, diagnosticFromError, emitCliError, emitCliProgress, sanitizeCliDiagnostic } from "./lib/cli_error.mjs";

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

// --- Import from bundle_layout.mjs — the single source of truth ---------------
import {
  // top-level
  UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR,
  GUIDE_FILE, POINTER_FILE, METADATA_FILE,
  // visual-style
  STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE,
  // version
  SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR,
  // _generated
  GEN_SLIDE_PLAN, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON,
  GEN_IMAGES_SUBDIR, GEN_HEADER_LOCKED_SUBDIR,
  GEN_PPT_SUBDIR, GEN_PREVIEW_SUBDIR,
  GEN_QA_SUBDIR,
  // resolvers
  deckRoot, backboneDir, styleAsset, generatedDir,
  findSlideSpecs, deckName, checkBundle, loadDotenv,
} from "./bundle_layout.mjs";
import { resolveSlideIds } from "./lib/slide_ids.mjs";

// --- Configuration -----------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** PPTMAKER_FRAMEWORK/ — parent of scripts/ */
export const FRAMEWORK_DIR = resolve(__dirname, "..");

/** scripts/ — where the per-stage scripts live */
export const REFERENCE_SCRIPTS_DIR = __dirname;

// Stage 1–5 are all in-framework Node (.mjs). No external skills. No Python. No bash.

// --- JSON helpers ------------------------------------------------------------

/**
 * Load and parse a JSON file.
 * @param {string} path
 * @returns {object}
 */
export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Write a canonical prompt manifest containing only selected slide IDs.
 * @param {string} source - Path to full _prompts.json.
 * @param {string} target - Output path for filtered JSON.
 * @param {string[]} selectedIds - Slide IDs to include.
 * @returns {string} The target path.
 * @throws {Error} if any selected ID is unknown.
 */
export function writePromptSubset(source, target, selectedIds) {
  const promptData = loadJson(source);
  const selected = new Set(selectedIds);
  const filtered = (promptData.slides || []).filter(
    (slide) => selected.has(slide.id)
  );
  const found = new Set(filtered.map((s) => s.id));
  const missing = selectedIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(`unknown slide IDs: ${missing.join(", ")}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    JSON.stringify({ slides: filtered }, null, 2) + "\n",
    "utf-8"
  );
  return target;
}

/**
 * Run a stage function, handling logging consistently.
 *
 * @param {() => Promise<boolean>} fn - Async function that returns true on success.
 * @param {string} stageName - Human-readable stage name.
 * @param {boolean} dryRun - If true, print but don't execute.
 * @returns {Promise<boolean>}
 */
export async function runStage(fn, stageName, dryRun) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: ${stageName}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would execute the above stage.\n");
    return true;
  }

  try {
    const ok = await fn();
    if (ok) {
      console.log(`\n  ✓ ${stageName} completed successfully.`);
    } else {
      console.log(`\n  ✗ ${stageName} FAILED.`);
    }
    return ok;
  } catch (err) {
    console.log(`\n  ✗ ${stageName} FAILED: ${err.message}`);
    return false;
  }
}

function failStage(stageFunction, diagnostic) {
  stageFunction.lastFailure = sanitizeCliDiagnostic(diagnostic);
  return false;
}

function pipelineStageDiagnostic(stageNum, runDir, diagnostic, resolution) {
  const category = diagnostic?.category || (stageNum === 1 ? "source_validation" : "artifact");
  const action = category === "gate" ? "review"
    : category === "source_validation" ? "edit_source"
      : ["environment", "provider"].includes(category) ? "repair_environment"
        : category === "internal" ? "report_internal"
          : "repair_prerequisite";
  return sanitizeCliDiagnostic({
    version: 1,
    category,
    stage: `stage${stageNum}`,
    operation: "run-stage",
    ...(diagnostic?.subject ? { subject: diagnostic.subject } : {}),
    ...(diagnostic?.source ? { source: diagnostic.source } : { source: { path: runDir } }),
    ...(diagnostic?.reason ? { reason: diagnostic.reason } : { reason: { kind: "stage_failed" } }),
    ...(diagnostic?.lineage ? { lineage: diagnostic.lineage } : {}),
    ...(diagnostic?.issues ? { issues: diagnostic.issues } : {}),
    next: createCliNext(action, {
      requiresHuman: category === "gate",
      inspect: diagnostic?.next?.inspect || (diagnostic?.source ? [diagnostic.source] : [{ path: runDir }]),
      invocation: { program: "node", args: [__filename_main, "--run-dir", runDir, "--stage", String(stageNum), "--resolution", resolution] },
      default: category === "gate"
        ? "Stop for the named human review or approval, then rerun the selected stage."
        : category === "source_validation"
          ? "Edit the named source fields, then rerun Stage 1."
          : ["environment", "provider"].includes(category)
            ? "Repair the named environment or provider prerequisite without exposing secrets, then rerun."
            : category === "internal"
              ? "Inspect and report the framework failure before retrying."
              : `Repair or rerun the prerequisite for Stage ${stageNum}; do not edit _generated artifacts directly.`,
    }),
  });
}

// --- Stage runners -----------------------------------------------------------

/**
 * Stage 1: Parse the slide-specifications markdown to JSON specs.
 *
 * Uses the Node.js ESM port (stage1_build_inputs.mjs) programmatically.
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage1(runDir, dryRun) {
  stage1.lastFailure = null;
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return failStage(stage1, { version: 1, category: "source_validation", stage: "stage1", operation: "find-source", source: { path: runDir }, reason: { kind: "missing_slide_specification" }, next: createCliNext("edit_source", { inspect: [{ path: runDir }], default: "Restore the slide specification source, then rerun Stage 1." }) });
  }

  console.log(`  Input: ${inputFile}`);

  const buildDir = generatedDir(runDir);
  if (!dryRun) {
    mkdirSync(buildDir, { recursive: true });
  }

  // Use the Node.js ESM port's parseSlides function programmatically.
  // This avoids spawning a subprocess for a stage we have natively.
  const { parseSlides, configureVisualConfig, validateSpecRecords } = await import("./stage1_build_inputs.mjs");
  const { loadVisualConfig } = await import("./visual_config.mjs");

  const deckSystemPath = styleAsset(runDir, DECK_SYSTEM_FILE);
  const palettePath = styleAsset(runDir, COLOR_PALETTE_FILE);

  let finalRules;
  if (existsSync(deckSystemPath)) {
    finalRules = readFileSync(deckSystemPath, "utf-8").trim() + "\n";
    console.log(`  Using ${deckSystemPath} for final rules (${finalRules.length} chars)`);
  } else {
    finalRules = null;
    console.log(`  No deck_system.txt found at ${deckSystemPath}, using hardcoded defaults`);
  }

  // Load visual config to set module-level variables in stage1_build_inputs.mjs
  if (existsSync(palettePath)) {
    try {
      const config = loadVisualConfig(palettePath);
      configureVisualConfig(config);
      console.log(
        `  Visual config: ${config.canvas.width_px}x${config.canvas.height_px}, ` +
        `header=${config.header_lock.body_header_safe_zone}px (${palettePath})`
      );
    } catch (exc) {
      console.log(`  ✗ Invalid visual config: ${exc.message}`);
      return failStage(stage1, { version: 1, category: "artifact", stage: "stage1", operation: "load-visual-config", source: { path: palettePath }, reason: { kind: "invalid_visual_config" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: palettePath }], default: "Repair the visual configuration source, then rerun Stage 1." }) });
    }
  } else {
    const { DEFAULT_CONFIG } = await import("./visual_config.mjs");
    configureVisualConfig(DEFAULT_CONFIG);
  }

  const validationErrors = validateSpecRecords([inputFile]).filter((problem) => problem.severity === "ERROR");
  if (validationErrors.length > 0) {
    return failStage(stage1, {
      version: 1,
      category: "source_validation",
      stage: "stage1",
      operation: "validate-specs",
      source: validationErrors[0].source,
      issues: validationErrors.map(({ message, subject, source, reason, lineage }) => ({ message, subject, source, reason, lineage })),
      next: createCliNext("edit_source", { inspect: validationErrors.map(({ source }) => source), default: "Fix the retained source issues, then rerun Stage 1." }),
    });
  }

  const { plan, prompts } = parseSlides([inputFile], finalRules);

  const planPath = join(buildDir, GEN_SLIDE_PLAN);
  const promptsDir = join(buildDir, GEN_PROMPTS_SUBDIR);
  mkdirSync(promptsDir, { recursive: true });
  const promptsPath = join(promptsDir, GEN_PROMPTS_JSON);

  writeFileSync(planPath, JSON.stringify({ slides: plan }, null, 2) + "\n", "utf-8");
  writeFileSync(promptsPath, JSON.stringify({ slides: prompts }, null, 2) + "\n", "utf-8");

  // One human-readable prompt file per slide
  for (const entry of prompts) {
    const stem = basename(entry.out, ".png");
    const mdPath = join(promptsDir, `${stem}.prompt.md`);
    writeFileSync(
      mdPath,
      `# Prompt — ${entry.id}\n\n` +
      `> Generated by Stage 1. Do not hand-edit — edit the source ` +
      `slide-specifications.md and rerun. Machine copy: \`_prompts.json\`.\n\n` +
      `\`\`\`\n${entry.prompt}\n\`\`\`\n`,
      "utf-8"
    );
  }

  console.log(`  Parsed ${plan.length} slides`);
  console.log(`  slide_plan:  ${planPath}`);
  console.log(`  prompts:     ${promptsPath}`);
  console.log(`  per-slide:   ${promptsDir}/NN_id.prompt.md  (${prompts.length} files)`);

  return true;
}

/**
 * Stage 2: Generate images with style anchoring (in-framework Node).
 *
 * Uses scripts/stage2_generate_images.mjs + make_contact_sheet.mjs.
 * Credentials: IMAGE2_API_KEY / IMAGE2_BASE_URL (APIMART_* / OPENAI_* aliases accepted).
 *
 * @param {string} runDir
 * @param {string|null} [baseUrl]
 * @param {string|null} [only]
 * @param {boolean} [forceImages]
 * @param {string} [resolution]
 * @param {string} [model]
 * @param {boolean} [dryRun]
 * @returns {Promise<boolean>}
 */
export async function stage2(runDir, {
  baseUrl = null,
  only = null,
  forceImages = false,
  resolution = "2k",
  model = "gpt-image-2",
  requireHeaderReview = false,
  dryRun = false,
} = {}) {
  stage2.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const promptsFile = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
  if (!existsSync(promptsFile) && !dryRun) {
    console.log(`  ✗ ${promptsFile} not found. Run Stage 1 first.`);
    return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "load-prompts", source: { path: promptsFile }, reason: { kind: "missing_prompt_manifest" }, lineage: [{ kind: "derived", path: promptsFile, stage: "stage1" }], next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the prompt manifest, then rerun Stage 2." }) });
  }

  const styleMaster = styleAsset(runDir, STYLE_MASTER_IMAGE);
  if (!existsSync(styleMaster) && !dryRun) {
    console.log(`  ✗ ${styleMaster} not found. Generate ${STYLE_MASTER_IMAGE} first.`);
    return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "load-style-reference", source: { path: styleMaster }, reason: { kind: "missing_style_reference" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: styleMaster }], default: "Generate the style master prerequisite, then rerun Stage 2." }) });
  }

  const outDir = join(buildDir, GEN_IMAGES_SUBDIR);
  if (!dryRun) {
    mkdirSync(outDir, { recursive: true });
  }

  if (requireHeaderReview && !dryRun) {
    const review = await validateProductionHeaderReview(runDir, {
      resolution,
      model,
      forceImages,
    });
    if (!review.ok) {
      if (review.changed.length > 0) {
        console.log(`  ⚠ ${review.hint}`);
        console.log(`  → 执行: ${review.action}`);
      }
      return failStage(stage2, { version: 1, category: "gate", stage: "stage2", operation: "header-review", source: { path: runDir }, issues: (review.changed || []).map((change) => ({ message: "slide header review evidence is stale or missing", subject: { kind: "slide", id: change.id }, reason: { kind: "review_required" } })), next: createCliNext("review", { requiresHuman: true, inspect: [{ path: runDir }], default: "Stop for current header review evidence before production image generation." }) });
    }
  }

  const { bridgeCredentials, resolveBaseUrls } = await import("./image_api_client.mjs");
  bridgeCredentials();

  /** @type {string[]} */
  let selectedIds = [];
  if (only) {
    const tokens = [];
    for (let slideId of only.split(",")) {
      slideId = slideId.trim();
      if (slideId) tokens.push(slideId);
    }
    if (tokens.length > 0) {
      try {
        const plan = JSON.parse(readFileSync(join(buildDir, GEN_SLIDE_PLAN), "utf-8"));
        selectedIds = resolveSlideIds(tokens, plan.slides || []);
      } catch (err) {
        console.log(`  ✗ --only: ${err.message}`);
        return failStage(stage2, { version: 1, category: "usage", stage: "stage2", operation: "resolve-selection", source: { path: join(buildDir, GEN_SLIDE_PLAN) }, reason: { kind: "unknown_slide_selector" }, next: createCliNext("fix_arguments", { inspect: [{ path: join(buildDir, GEN_SLIDE_PLAN) }], default: "Choose slide ids from the current slide plan, then rerun Stage 2." }) });
      }
    }
  }

  /** @type {string[]} */
  let baseUrls = [];
  try {
    baseUrls = resolveBaseUrls(baseUrl ? [baseUrl] : []);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
    return failStage(stage2, { version: 1, category: "environment", stage: "stage2", operation: "resolve-provider", source: { path: deckRoot(runDir) }, reason: { kind: "provider_configuration_unavailable" }, next: createCliNext("repair_environment", { default: "Repair provider configuration without exposing credentials, then rerun Stage 2." }) });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 2: Generate Images`);
  console.log(`  Generator: scripts/stage2_generate_images.mjs (in-framework)`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would generate images + contact sheet.\n");
    return true;
  }

  try {
    const { buildImageFailureDiagnostic, generateImages } = await import("./stage2_generate_images.mjs");
    const result = await generateImages({
      promptJson: promptsFile,
      outDir,
      styleReference: styleMaster,
      resolution,
      model,
      only: selectedIds,
      force: !!forceImages,
      promptIsFinal: true,
      baseUrl: baseUrls,
      dryRun: false,
    });
    if (result.errors.length > 0) {
      console.log(`\n  ✗ Stage 2: Generate Images FAILED (${result.errors.length} error(s))`);
      return failStage(stage2, buildImageFailureDiagnostic({ failures: result.failures, promptJson: promptsFile, outDir, styleReference: styleMaster, resolution, selectedIds: result.selectedIds }));
    }
    const promptData = loadJson(promptsFile);
    const selectedSet = selectedIds.length > 0 ? new Set(selectedIds) : null;
    const provenanceSlides = (promptData.slides || []).filter(
      (slide) => !selectedSet || selectedSet.has(slide.id)
    );
    const { validateImageProvenance, provenanceRepairHint } = await import("./lib/image_provenance.mjs");
    const provenance = validateImageProvenance({
      slides: provenanceSlides,
      outDir,
      profile: result.profile,
    });
    if (!provenance.current) {
      const ids = provenance.stale.map((entry) => entry.slideId);
      console.log(
        `\n  ✗ Stage 2 provenance FAILED: ${provenance.stale.map((entry) => `${entry.slideId}: ${entry.reason}`).join("; ")}`
      );
      console.log(`  ${provenanceRepairHint(ids)}`);
      return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "validate-provenance", source: { path: promptsFile }, issues: provenance.stale.map((entry) => ({ message: "slide image provenance is stale", subject: { kind: "slide", id: entry.slideId }, source: { path: outDir }, reason: { kind: "stale_image_provenance" }, lineage: [{ kind: "derived", path: promptsFile, stage: "stage1" }, { kind: "derived", path: outDir, stage: "stage2" }] })), next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }, { path: outDir }], default: "Regenerate only the stale slide images, then rerun Stage 2 validation." }) });
    }
    console.log(`\n  ✓ Stage 2: Generate Images completed successfully.`);
  } catch (err) {
    console.log(`\n  ✗ Stage 2: Generate Images FAILED: ${err.message}`);
    return failStage(stage2, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage2", operation: "generate-images", source: { path: promptsFile }, reason: { kind: "image_generation_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }, { path: styleMaster }], default: "Repair the named Stage 2 prerequisite, then rerun." }) });
  }

  // --- Contact sheet (QA preview) ---
  const previewDir = join(buildDir, GEN_PREVIEW_SUBDIR);
  mkdirSync(previewDir, { recursive: true });
  let contactPrompts = promptsFile;
  let contactName = "contact_sheet.jpg";
  if (selectedIds.length > 0) {
    contactPrompts = join(previewDir, "_pilot_prompts.json");
    try {
      writePromptSubset(promptsFile, contactPrompts, selectedIds);
    } catch (exc) {
      console.log(`  ✗ Cannot build pilot contact sheet; ${exc.message}`);
      return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "build-contact-selection", source: { path: promptsFile }, reason: { kind: "invalid_prompt_selection" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }], default: "Rerun Stage 1 and select current slide ids before rebuilding the contact sheet." }) });
    }
    contactName = "pilot_contact_sheet.jpg";
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 2 QA: Contact Sheet`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    const { makeContactSheet } = await import("./make_contact_sheet.mjs");
    await makeContactSheet({
      imageDir: outDir,
      promptJson: contactPrompts,
      out: join(previewDir, contactName),
      columns: 4,
    });
    console.log(`\n  ✓ Stage 2 QA: Contact Sheet completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 2 QA: Contact Sheet FAILED: ${err.message}`);
    return failStage(stage2, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "contact-sheet", operation: "compose", source: { path: contactPrompts }, reason: { kind: "contact_sheet_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: contactPrompts }, { path: outDir }], default: "Repair the selected image prerequisites, then regenerate the contact sheet." }) });
  }
}

/**
 * Stage 3: Lock headers (Node @napi-rs/canvas text overlay).
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage3(runDir, dryRun) {
  stage3.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_image_directory" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 2 to recreate slide images, then rerun Stage 3." }) });
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_images" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 2 to recreate slide images, then rerun Stage 3." }) });
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-slide-plan", source: { path: slidePlan }, reason: { kind: "missing_slide_plan" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 3." }) });
    }

    const planData = loadJson(slidePlan);
    const expected = (planData.slides || []).length;
    const actual = pngs.length;
    if (actual < expected) {
      console.log(`  ⚠  Image count mismatch: ${actual} images found, ${expected} slides expected.`);
      console.log(`  Stage 2 likely failed partway — re-run --stage 2 to generate the missing images.`);
      console.log(`  Stage 3 will abort (not build a partial deck) until every slide has an image.`);
    }
  }

  const outDir = join(buildDir, GEN_HEADER_LOCKED_SUBDIR);
  if (!dryRun) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 3: Lock Headers`);
  console.log(`  Output: ${outDir}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would lock headers.\n");
    return true;
  }

  try {
    const { lockHeaders } = await import("./stage3_lock_headers.mjs");
    await lockHeaders({
      images: imagesDir,
      slidePlan,
      out: outDir,
      colorPalette: styleAsset(runDir, COLOR_PALETTE_FILE),
    });
    console.log(`\n  ✓ Stage 3: Lock Headers completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 3: Lock Headers FAILED: ${err.message}`);
    return failStage(stage3, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage3", operation: "lock-headers", source: { path: slidePlan }, reason: { kind: "header_lock_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }, { path: imagesDir }], default: "Repair Stage 1/2 prerequisites, then rerun Stage 3." }) });
  }
}

/**
 * Stage 4: Build PPTX container.
 *
 * Uses stage4_build_pptx.mjs programmatically (Node / pptxgenjs).
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage4(runDir, dryRun) {
  stage4.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_HEADER_LOCKED_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_header_locked_directory" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 3 to recreate header-locked images, then rerun Stage 4." }) });
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_header_locked_images" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 3 to recreate header-locked images, then rerun Stage 4." }) });
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-slide-plan", source: { path: slidePlan }, reason: { kind: "missing_slide_plan" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 4." }) });
    }
    const review = await validateProductionHeaderReview(runDir, { requireCurrentImages: true });
    if (!review.ok) {
      if (review.changed.length > 0) {
        console.log(`  ⚠ ${review.hint}`);
        console.log(`  → 执行: ${review.action}`);
      }
      return failStage(stage4, { version: 1, category: "gate", stage: "stage4", operation: "header-review", source: { path: runDir }, issues: (review.changed || []).map((change) => ({ message: "slide header review evidence is stale or missing", subject: { kind: "slide", id: change.id }, reason: { kind: "review_required" } })), next: createCliNext("review", { requiresHuman: true, inspect: [{ path: runDir }], default: "Stop for current header review evidence before assembling the PPTX." }) });
    }
  }

  const pptDir = join(buildDir, GEN_PPT_SUBDIR);
  if (!dryRun) {
    mkdirSync(pptDir, { recursive: true });
  }

  // Deck name derives from the DECK ROOT (deck_mypitch/3_versions/v1 -> "mypitch"),
  // NOT runDir.parent (which is "3_versions"). See bundle_layout.deckName.
  const name = deckName(runDir);
  const pptxPath = join(pptDir, `${name}.pptx`);
  const title = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 4: Build PPTX`);
  console.log(`  Output: ${pptxPath}`);
  console.log(`  Title: ${title}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would build the PPTX.\n");
    return true;
  }

  try {
    // Programmatic call — no subprocess needed for the Node-native stage
    const { buildPptx } = await import("./stage4_build_pptx.mjs");
    await buildPptx({
      images: imagesDir,
      slidePlan,
      out: pptxPath,
      title,
    });
    console.log(`\n  ✓ Stage 4: Build PPTX completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 4: Build PPTX FAILED: ${err.message}`);
    return failStage(stage4, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage4", operation: "build-pptx", source: { path: slidePlan }, reason: { kind: "pptx_build_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }, { path: imagesDir }], default: "Repair Stage 3 outputs, then rerun Stage 4." }) });
  }
}

export async function validateProductionHeaderReview(runDir, {
  resolution = null,
  model = null,
  forceImages = false,
  requireCurrentImages = false,
  onlyIds = null,
} = {}) {
  const buildDir = generatedDir(runDir);
  const planPath = join(buildDir, GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) {
    return { format: 2, applicable: true, ok: false, changed: [],
      action: null, hint: "slide plan missing — run Stage 1 first" };
  }
  const slides = loadJson(planPath).slides || [];
  const palettePath = styleAsset(runDir, COLOR_PALETTE_FILE);
  const { loadVisualConfig, DEFAULT_CONFIG } = await import("./visual_config.mjs");
  const visualConfig = existsSync(palettePath) ? loadVisualConfig(palettePath) : DEFAULT_CONFIG;
  const {
    buildHeaderReviewInputs,
    HEADER_REVIEW_NODE,
    validateHeaderReviewRecord,
    versionKey,
  } = await import("./lib/header_review.mjs");
  const inputs = buildHeaderReviewInputs(slides, visualConfig);
  const root = deckRoot(runDir);
  const { readState } = await import("./lib/state.mjs");
  const state = readState(root);
  const key = versionKey(root, runDir);
  const record = state.nodes?.[HEADER_REVIEW_NODE]?.by_version?.[key] || null;
  let targetProfile = null;
  const profileResolution = resolution || record?.generation_profile?.resolution || null;
  const profileModel = model || record?.generation_profile?.model || null;
  if (profileResolution && profileModel) {
    const { generationProfile, sha256File } = await import("./lib/image_provenance.mjs");
    const styleMaster = styleAsset(runDir, STYLE_MASTER_IMAGE);
    targetProfile = generationProfile({
      styleReferenceSha256: sha256File(styleMaster),
      resolution: profileResolution,
      model: profileModel,
      semanticOptions: { size: "16:9", n: 1 },
    });
  }
  const result = validateHeaderReviewRecord({
    record,
    inputs,
    imagesDir: join(buildDir, GEN_IMAGES_SUBDIR),
    targetProfile,
    onlyIds,
  });

  // Stage 4: per-slide image integrity check
  if (requireCurrentImages && result.ok) {
    const promptsPath = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
    const prompts = existsSync(promptsPath) ? loadJson(promptsPath).slides || [] : [];
    const promptById = new Map(prompts.map((slide) => [slide.id, slide]));
    const { generationFingerprint, readImageManifest, sha256File } = await import("./lib/image_provenance.mjs");
    const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
    const { manifest, error: manifestError } = readImageManifest(imagesDir);
    const imageChanged = [];
    if (manifestError) {
      imageChanged.push({ id: "_manifest", field: "image", was: null, now: null });
    }
    const checkIds = onlyIds && onlyIds.length > 0
      ? onlyIds.filter((id) => inputs.fullPageIds.includes(id))
      : inputs.fullPageIds;
    for (const id of checkIds) {
      const prompt = promptById.get(id);
      const entry = manifest?.slides?.[id];
      if (!prompt || !entry) {
        imageChanged.push({ id, field: "image", was: null, now: null });
        continue;
      }
      const expected = generationFingerprint({
        prompt: String(prompt.prompt || "").trim(),
        profile: entry.generation_profile,
      });
      if (entry.generation_fingerprint !== expected) {
        imageChanged.push({ id, field: "image", was: null, now: null });
        continue;
      }
      const imagePath = join(imagesDir, entry.output);
      if (!existsSync(imagePath) || sha256File(imagePath) !== entry.image_sha256) {
        imageChanged.push({ id, field: "image", was: null, now: null });
      }
    }
    if (imageChanged.length > 0) {
      const changedIds = [...new Set(imageChanged.map((c) => c.id))];
      return {
        format: 2, applicable: true, ok: false,
        changed: imageChanged,
        action: changedIds.length <= 5
          ? `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build "{runDir}" --force-images --only ${changedIds.join(",")}`
          : `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build "{runDir}" --force-images`,
        hint: `${imageChanged.length} 张图片需重新生成，跑 --force-images 后 pilot 确认`,
      };
    }
  }

  // forceImages overwrite warning — not a hard block, just inform
  if (forceImages && record?.slides) {
    const reviewedIds = Object.entries(record.slides)
      .filter(([, s]) => s && s.status === "reviewed")
      .map(([id]) => id);
    if (reviewedIds.length > 0) {
      result.hint = (result.hint || "") + ` (注意: ${reviewedIds.length} 页已 review 的图片将被覆盖)`;
    }
  }

  return result;
}

/**
 * Stage 5: Inject speaker notes into PPTX.
 *
 * Uses the Node.js ESM port (stage5_inject_notes.mjs) programmatically.
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage5(runDir, dryRun) {
  stage5.lastFailure = null;
  const pptDir = join(generatedDir(runDir), GEN_PPT_SUBDIR);

  // Speaker notes come from the per-slide spec markdown (in the version dir).
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return failStage(stage5, { version: 1, category: "source_validation", stage: "stage5", operation: "find-notes-source", source: { path: runDir }, reason: { kind: "missing_notes_source" }, next: createCliNext("edit_source", { inspect: [{ path: runDir }], default: "Restore the slide specification source with speaker notes, then rerun Stage 5." }) });
  }

  if (dryRun) {
    // Nothing generated yet during a dry run; show the intended target.
    const pptxFile = join(pptDir, "<deck_name>.pptx");
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  Stage: Stage 5: Inject Notes`);
    console.log(`  PPTX: ${pptxFile}`);
    console.log(`  Input: ${inputFile}`);
    console.log(`${"=".repeat(60)}\n`);
    console.log("  [DRY RUN] Would inject notes.\n");
    return true;
  }

  try {
    const { injectNotesFromRunDir } = await import("./stage5_inject_notes.mjs");
    const result = await injectNotesFromRunDir(runDir);

    console.log(`\n  ✓ Stage 5: Inject Notes completed successfully.`);
    console.log(`  Notes injected: ${result.notesInjected}/${result.slideCount} slides`);
    console.log(`  Receipt: ${join(generatedDir(runDir), GEN_QA_SUBDIR, "notes_injection.json")}`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 5: Inject Notes FAILED: ${err.message}`);
    return failStage(stage5, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage5", operation: "inject-notes", source: { path: inputFile }, reason: { kind: "notes_injection_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }, { path: pptDir }], default: "Repair the source notes or Stage 4 PPTX prerequisite, then rerun Stage 5." }) });
  }
}

// --- Bundle validation -------------------------------------------------------

/**
 * Enforce the run-bundle constitution before doing anything.
 *
 * Delegates to bundle_layout.checkBundle (the single enforcement point). Any
 * deviation from the canonical structure aborts the run. `mode` selects
 * structure | preview (style master) | pipeline (style master + gates).
 *
 * @param {string} runDir
 * @param {boolean|string} [mode=true] - readiness mode (bool aliases kept).
 * @returns {boolean} true if valid.
 */
export function validateRunDir(runDir, mode = true) {
  const violations = checkBundle(resolve(runDir), mode);
  if (violations.length > 0) {
    console.log(`  ✗ Bundle does NOT conform to the structure (宪法) — ${violations.length} violation(s):`);
    for (const v of violations) {
      console.log(`      - ${v}`);
    }
    console.log("  The directory structure is the constitution. Fix the above, then rerun.");
    console.log("  Canonical structure:  node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs");
    return false;
  }
  return true;
}

// --- Credentials loading -----------------------------------------------------

/**
 * Load .env credentials and walk CWD parents into a flat array.
 * @param {string} dkRoot - Deck root path.
 * @returns {string[]} Array of directories to search for .env.
 */
function buildEnvSearchDirs(dkRoot) {
  const cwd = process.cwd();
  const searchDirs = [dkRoot, cwd];
  let p = cwd;
  while (p) {
    const parent = dirname(p);
    if (parent === p) break;
    if (!searchDirs.includes(parent)) searchDirs.push(parent);
    p = parent;
  }
  return searchDirs;
}

// --- Main --------------------------------------------------------------------

async function main() {
  const program = new Command();

  program
    .name("unified_pipeline.mjs")
    .description("Unified PPT production pipeline for _ppt_framework")
    .addHelpText("after", `
Examples:
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage all
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage 2 --only slide_05
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage all --dry-run
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage 5
    `)
    .requiredOption("--run-dir <path>", "Path to a version dir (e.g., deck_xxx/3_versions/v1)")
    .requiredOption("--stage <stages>", "Stage to run: all, 1, 2, 3, 4, 5, or comma-separated (e.g., 1,3,4)")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--only <ids>", "Only process specific slide IDs (Stage 2, comma-separated)")
    .option("--force-images", "Regenerate all selected Stage-2 images even if files exist")
    .option("--preview", "Stage-2 readiness: style master only (skip metadata gate check)")
    .option("--resolution <res>", "Stage-2 image resolution (default: 2k; use 1k for pilots)", "2k")
    .option("--model <name>", "Stage-2 image model", "gpt-image-2")
    .option("--dry-run", "Print what would be executed without running")
    .action(async (opts) => {
      const runDir = resolve(opts.runDir);

      // Load credentials from .env into process.env so the API key + base URL
      // reach Stage 2's subprocess. Search deck root first (the documented home),
      // then cwd and its parents — a SUPERSET of env-check's search so the two
      // never disagree (env-check greenlighting a key the pipeline then can't find).
      // Explicit env wins (loadDotenv does not override already-set vars).
      const dkRoot = deckRoot(runDir);
      const searchDirs = buildEnvSearchDirs(dkRoot);
      const envLoaded = loadDotenv(...searchDirs);
      if (envLoaded) {
        console.log(`Loaded credentials from ${envLoaded}`);
      }

      // Parse stages first — the structure gate only needs to require the Phase-2
      // Stage-2 assets and human gate decisions only when Stage 2 is in the run.
      /** @type {number[]} */
      let stages;
      if (opts.stage === "all") {
        stages = [1, 2, 3, 4, 5];
      } else {
        stages = opts.stage.split(",").map((s) => {
          const n = parseInt(s.trim(), 10);
          if (![1, 2, 3, 4, 5].includes(n)) {
            console.log(`  ✗ Invalid stage: ${s.trim()}. Must be 1-5.`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Pipeline stage selection must contain only stages 1 through 5.", hint: "Use all or a comma-separated subset of 1,2,3,4,5.", where: "unified_pipeline.arguments.stage", diagnostic: { version: 1, category: "usage", operation: "parse-stages", reason: { kind: "invalid_stage" }, next: createCliNext("fix_arguments", { default: "Correct --stage to all or valid stage numbers, then rerun." }) } });
            process.exit(1);
          }
          return n;
        });
      }

      // Validate resolution
      if (opts.resolution && !["1k", "2k", "4k"].includes(opts.resolution)) {
        console.log(`  ✗ Invalid resolution: ${opts.resolution}. Must be 1k, 2k, or 4k.`);
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Pipeline resolution must be 1k, 2k, or 4k.", hint: "Choose a supported image resolution.", where: "unified_pipeline.arguments.resolution", diagnostic: { version: 1, category: "usage", operation: "parse-resolution", reason: { kind: "invalid_enum", expected: ["1k", "2k", "4k"] }, next: createCliNext("fix_arguments", { default: "Correct --resolution, then rerun the selected stages." }) } });
        process.exit(1);
      }

      /** @type {boolean|string} */
      let readyMode = false;
      if (stages.includes(2)) {
        readyMode = opts.preview ? "preview" : "pipeline";
      }
      if (!validateRunDir(runDir, readyMode)) {
        emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Run-bundle structure or readiness checks block the selected pipeline stages.", hint: "Repair the named run-bundle source or gate prerequisite, then rerun.", where: "unified_pipeline.validate-run-dir", diagnostic: { version: 1, category: readyMode ? "gate" : "structure", operation: "validate-run-dir", source: { path: runDir }, next: createCliNext(readyMode ? "review" : "edit_source", { requiresHuman: !!readyMode, inspect: [{ path: runDir }], default: readyMode ? "Review and resolve the required production gates before continuing." : "Repair the run-bundle source structure, then rerun the pipeline." }) } });
        process.exit(1);
      }

      console.log(`Pipeline: ${runDir}`);
      console.log(`Stages: ${stages.join(",")}`);
      if (opts.dryRun) {
        console.log("Mode: DRY RUN (no execution)");
      }
      console.log();

      // Max stage validation — stages must be sequential from the current run.
      // We don't validate here since partial chains (1,3,4,5) are valid editing chains.

      if (!opts.preview && !stages.includes(1) && (stages.includes(2) || stages.includes(4))) {
        const refreshed = await stage1(runDir, opts.dryRun);
        if (!refreshed) {
          console.log("\n  Pipeline stopped while refreshing Stage 1 for header review.");
          emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Stage 1 refresh failed before header review.", hint: "Repair the slide specification source, then rerun the requested chain.", where: "unified_pipeline.header-review-refresh", diagnostic: pipelineStageDiagnostic(1, runDir, stage1.lastFailure, opts.resolution) });
          process.exit(1);
        }
      }

      // Stage dispatch table
      const stageImplementations = { 1: stage1, 2: stage2, 3: stage3, 4: stage4, 5: stage5 };
      const stageFuncs = {
        1: () => stage1(runDir, opts.dryRun),
        2: () => stage2(runDir, {
          baseUrl: opts.baseUrl || null,
          only: opts.only || null,
          forceImages: opts.forceImages || false,
          resolution: opts.resolution || "2k",
          model: opts.model || "gpt-image-2",
          requireHeaderReview: !opts.preview,
          dryRun: opts.dryRun,
        }),
        3: () => stage3(runDir, opts.dryRun),
        4: () => stage4(runDir, opts.dryRun),
        5: () => stage5(runDir, opts.dryRun),
      };

      for (const stageNum of stages) {
        emitCliProgress("stage_start", { stage: `stage${stageNum}` });
        let success;
        try {
          success = await stageFuncs[stageNum]();
        } catch (err) {
          stageImplementations[stageNum].lastFailure = diagnosticFromError(err) || sanitizeCliDiagnostic({
            version: 1,
            category: "internal",
            stage: `stage${stageNum}`,
            operation: "run-stage",
            source: { path: runDir },
            reason: { kind: "unexpected_stage_exception" },
            next: createCliNext("report_internal", { inspect: [{ path: runDir }], default: "Inspect and report the unexpected Stage failure before retrying." }),
          });
          success = false;
        }
        if (!success) {
          console.log(`\n  Pipeline stopped at Stage ${stageNum}.`);
          console.log(`  Fix the issue above and re-run with: --stage ${stageNum}`);
          emitCliError({
            code: CLI_ERROR_CODES.FAILED,
            message: `Pipeline stopped because Stage ${stageNum} failed.`,
            hint: "Inspect the stage-specific source and artifact lineage, then rerun the smallest safe chain.",
            where: `unified_pipeline.stage${stageNum}`,
            diagnostic: pipelineStageDiagnostic(stageNum, runDir, stageImplementations[stageNum].lastFailure, opts.resolution),
          });
          process.exit(1);
        }
        emitCliProgress("stage_complete", { stage: `stage${stageNum}` });
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`  Pipeline complete. Output: ${join(generatedDir(runDir), GEN_PPT_SUBDIR)}`);
      console.log(`${"=".repeat(60)}`);
    });

  await program.parseAsync(process.argv);
}

// Run when executed directly (not imported)
const __filename_main = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename_main ||
    process.argv[1]?.endsWith("/unified_pipeline.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "unified_pipeline" });
  main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    emitCliError({ code: CLI_ERROR_CODES.UNCAUGHT, message: "The unified pipeline failed unexpectedly.", hint: "Inspect the orchestrator command location and report the framework failure.", where: "unified_pipeline.main", diagnostic: { version: 1, category: "internal", operation: "run-pipeline", next: createCliNext("report_internal", { default: "Inspect unified_pipeline.mjs without relying on captured exception prose, then report the defect." }) } });
    process.exit(1);
  });
}
