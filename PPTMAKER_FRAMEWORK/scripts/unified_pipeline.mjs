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
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return false;
  }

  console.log(`  Input: ${inputFile}`);

  const buildDir = generatedDir(runDir);
  if (!dryRun) {
    mkdirSync(buildDir, { recursive: true });
  }

  // Use the Node.js ESM port's parseSlides function programmatically.
  // This avoids spawning a subprocess for a stage we have natively.
  const { parseSlides, configureVisualConfig } = await import("./stage1_build_inputs.mjs");
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
      return false;
    }
  } else {
    const { DEFAULT_CONFIG } = await import("./visual_config.mjs");
    configureVisualConfig(DEFAULT_CONFIG);
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
  const buildDir = generatedDir(runDir);
  const promptsFile = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
  if (!existsSync(promptsFile) && !dryRun) {
    console.log(`  ✗ ${promptsFile} not found. Run Stage 1 first.`);
    return false;
  }

  const styleMaster = styleAsset(runDir, STYLE_MASTER_IMAGE);
  if (!existsSync(styleMaster) && !dryRun) {
    console.log(`  ✗ ${styleMaster} not found. Generate ${STYLE_MASTER_IMAGE} first.`);
    return false;
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
    if (!review.current) {
      console.log(`  ✗ Header review gate: ${review.errors.join("; ")}`);
      console.log(`  Hint: ${review.hint}`);
      return false;
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
        return false;
      }
    }
  }

  /** @type {string[]} */
  let baseUrls = [];
  try {
    baseUrls = resolveBaseUrls(baseUrl ? [baseUrl] : []);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
    return false;
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
    const { generateImages } = await import("./stage2_generate_images.mjs");
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
      return false;
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
      return false;
    }
    console.log(`\n  ✓ Stage 2: Generate Images completed successfully.`);
  } catch (err) {
    console.log(`\n  ✗ Stage 2: Generate Images FAILED: ${err.message}`);
    return false;
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
      return false;
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
    return false;
  }
}

/**
 * Stage 3: Lock headers (Node @napi-rs/canvas text overlay).
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage3(runDir, dryRun) {
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return false;
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return false;
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return false;
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
    return false;
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
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_HEADER_LOCKED_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return false;
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return false;
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return false;
    }
    const review = await validateProductionHeaderReview(runDir, { requireCurrentImages: true });
    if (!review.current) {
      console.log(`  ✗ Header review gate: ${review.errors.join("; ")}`);
      console.log(`  Hint: ${review.hint}`);
      return false;
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
    return false;
  }
}

export async function validateProductionHeaderReview(runDir, {
  resolution = null,
  model = null,
  forceImages = false,
  requireCurrentImages = false,
} = {}) {
  const buildDir = generatedDir(runDir);
  const planPath = join(buildDir, GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) {
    return { current: false, errors: ["current slide plan is missing"], hint: "run Stage 1, then pilot and approve header" };
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
  const validation = validateHeaderReviewRecord({
    record,
    inputs,
    imagesDir: join(buildDir, GEN_IMAGES_SUBDIR),
    targetProfile,
  });
  const protectedIds = new Set([
    ...Object.keys(record?.reviewed_image_provenance || {}),
    ...Object.keys(record?.accepted_risks || {}),
  ]);
  const protectedFullPageIds = inputs.fullPageIds.filter((id) => protectedIds.has(id));
  const errors = [...validation.errors];
  if (requireCurrentImages) {
    const promptsPath = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
    const prompts = existsSync(promptsPath) ? loadJson(promptsPath).slides || [] : [];
    const promptById = new Map(prompts.map((slide) => [slide.id, slide]));
    const { generationFingerprint, readImageManifest, sha256File } = await import("./lib/image_provenance.mjs");
    const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
    const { manifest, error: manifestError } = readImageManifest(imagesDir);
    if (manifestError) errors.push(manifestError);
    for (const id of inputs.fullPageIds) {
      const prompt = promptById.get(id);
      const entry = manifest.slides?.[id];
      if (!prompt) errors.push(`current prompt missing for full-page id ${id}`);
      if (!entry) errors.push(`current raw-image provenance missing for full-page id ${id}`);
      if (prompt && entry) {
        const expected = generationFingerprint({
          prompt: String(prompt.prompt || "").trim(),
          profile: entry.generation_profile,
        });
        if (entry.generation_fingerprint !== expected) {
          errors.push(`raw-image provenance is stale for full-page id ${id}`);
        }
        const imagePath = join(imagesDir, entry.output);
        if (!existsSync(imagePath)) errors.push(`raw image missing for full-page id ${id}`);
        else if (sha256File(imagePath) !== entry.image_sha256) {
          errors.push(`raw image bytes changed for full-page id ${id}`);
        }
      }
    }
  }
  if (record && targetProfile) {
    const promptsPath = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
    const prompts = existsSync(promptsPath) ? loadJson(promptsPath).slides || [] : [];
    const promptById = new Map(prompts.map((slide) => [slide.id, slide]));
    const { generationFingerprint, readImageManifest } = await import("./lib/image_provenance.mjs");
    const { manifest, error: manifestError } = readImageManifest(join(buildDir, GEN_IMAGES_SUBDIR));
    if (manifestError) errors.push(manifestError);
    for (const [id, reviewed] of Object.entries(record.reviewed_image_provenance || {})) {
      const prompt = promptById.get(id);
      const entry = manifest.slides?.[id];
      if (!prompt) errors.push(`current prompt missing for reviewed id ${id}`);
      if (!entry) errors.push(`current manifest entry missing for reviewed id ${id}`);
      if (prompt && entry) {
        const expected = generationFingerprint({
          prompt: String(prompt.prompt || "").trim(),
          profile: targetProfile,
        });
        if (entry.generation_fingerprint !== expected) {
          errors.push(`raw-image provenance is stale for reviewed id ${id}`);
        }
        if (entry.image_sha256 !== reviewed.image_sha256) {
          errors.push(`manifest image hash differs from reviewed evidence for ${id}`);
        }
      }
    }
  }
  if (forceImages && protectedFullPageIds.length > 0) {
    errors.push(`force-images would overwrite reviewed full-page ids: ${protectedFullPageIds.join(", ")}`);
  }
  const pilotIds = validation.changedIds.length > 0
    ? validation.changedIds
    : inputs.contentFullPageIds.slice(0, Math.min(2, inputs.contentFullPageIds.length));
  const profileArgs = resolution ? ` --resolution ${resolution}` : "";
  const hint = protectedFullPageIds.length > 0 && targetProfile && validation.errors.length === 0
    ? "use ppt_flow build --reuse-images with this matching profile"
    : `run ppt_flow pilot ${runDir} --only ${pilotIds.join(",")} --force-images${profileArgs}, review it, then approve header`;
  return { ...validation, inputs, record, current: errors.length === 0, errors, hint, targetProfile };
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
  const pptDir = join(generatedDir(runDir), GEN_PPT_SUBDIR);

  // Speaker notes come from the per-slide spec markdown (in the version dir).
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return false;
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
    return false;
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
            process.exit(1);
          }
          return n;
        });
      }

      // Validate resolution
      if (opts.resolution && !["1k", "2k", "4k"].includes(opts.resolution)) {
        console.log(`  ✗ Invalid resolution: ${opts.resolution}. Must be 1k, 2k, or 4k.`);
        process.exit(1);
      }

      /** @type {boolean|string} */
      let readyMode = false;
      if (stages.includes(2)) {
        readyMode = opts.preview ? "preview" : "pipeline";
      }
      if (!validateRunDir(runDir, readyMode)) {
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
          process.exit(1);
        }
      }

      // Stage dispatch table
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
        const success = await stageFuncs[stageNum]();
        if (!success) {
          console.log(`\n  Pipeline stopped at Stage ${stageNum}.`);
          console.log(`  Fix the issue above and re-run with: --stage ${stageNum}`);
          process.exit(1);
        }
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
    process.exit(1);
  });
}
