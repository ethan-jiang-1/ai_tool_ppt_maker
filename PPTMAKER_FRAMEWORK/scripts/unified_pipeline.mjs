#!/usr/bin/env node
/**
 * unified_pipeline.mjs — Node.js ESM port of unified_pipeline.py
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

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync,
         copyFileSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
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

// --- Configuration -----------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** PPTMAKER_FRAMEWORK/ — parent of scripts/ */
export const FRAMEWORK_DIR = resolve(__dirname, "..");

/** scripts/ — where the per-stage scripts live */
export const REFERENCE_SCRIPTS_DIR = __dirname;

// Stage 1: Parse markdown to JSON — use the Node.js ESM port programmatically
// (imported below as parseSlides from stage1_build_inputs.mjs)

// Stage 3: Header-Lock (Python script — no Node.js port yet)
const STAGE3_SCRIPT = join(REFERENCE_SCRIPTS_DIR, "stage3_lock_headers.py");

// Stage 4: Build PPTX — use the Node.js ESM port programmatically
// (imported below as buildPptx from stage4_build_pptx.mjs)

// Stage 5: Inject notes — use the Node.js ESM port programmatically
// (imported below as injectNotes/extractNotesFromMarkdown from stage5_inject_notes.mjs)

// --- Python discovery --------------------------------------------------------

/**
 * Find a usable Python executable. Tries python3 first, then python.
 * @returns {string}
 */
export function findPython() {
  return "python3";
}

// --- Skill script discovery --------------------------------------------------

/**
 * Find a skill script by searching common skill directory locations.
 *
 * Searches:
 *   1. Project-level: <FRAMEWORK_DIR>/../.claude/skills, .agents/skills
 *   2. CWD and parents: .claude/skills, .agents/skills
 *   3. Global: ~/.claude/skills, ~/.agents/skills
 *
 * @param {string[]} relativePaths - Candidate paths relative to a skills root.
 * @returns {string | null}
 */
export function findSkillScript(relativePaths) {
  const searchRoots = [];

  // Project-level skills — include the framework's parent even when launched
  // from an external deck directory.
  const projectBases = [resolve(FRAMEWORK_DIR, "..")];
  const cwd = process.cwd();
  projectBases.push(cwd);
  // Walk up CWD parents
  let p = cwd;
  while (p) {
    if (!projectBases.includes(p)) projectBases.push(p);
    const parent = dirname(p);
    if (parent === p) break;
    p = parent;
  }

  for (const base of projectBases) {
    for (const skillsDir of [".claude/skills", ".agents/skills"]) {
      const candidate = join(base, skillsDir);
      if (existsSync(candidate) && !searchRoots.includes(candidate)) {
        searchRoots.push(candidate);
      }
    }
  }

  // Global skills
  const home = homedir();
  for (const skillsDir of [".claude/skills", ".agents/skills"]) {
    const candidate = join(home, skillsDir);
    if (existsSync(candidate)) {
      searchRoots.push(candidate);
    }
  }

  for (const root of searchRoots) {
    for (const rel of relativePaths) {
      const candidate = join(root, rel);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Find the stage 2 image generation script (from skill layer).
 * @returns {string | null}
 */
export function findStage2Script() {
  return findSkillScript([
    "image2-ppt/scripts/generate_full_page_images.py",
  ]);
}

/**
 * Find the contact-sheet script (from skill layer).
 * @returns {string | null}
 */
export function findContactSheetScript() {
  return findSkillScript([
    "image2-ppt/scripts/make_contact_sheet.py",
  ]);
}

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

// --- Subprocess runners ------------------------------------------------------

/**
 * Run a Python script as a subprocess. Returns a promise that resolves
 * with true on success, false on failure.
 *
 * @param {string} script - Absolute path to the Python script.
 * @param {string[]} args - CLI arguments.
 * @param {string} stageName - Human-readable stage name for logging.
 * @param {boolean} dryRun - If true, print but don't execute.
 * @returns {Promise<boolean>}
 */
export function runPythonStage(script, args, stageName, dryRun) {
  const python = findPython();
  const cmd = [python, script, ...args];
  const cmdStr = cmd.map((c) => (c.includes(" ") ? `"${c}"` : c)).join(" ");

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: ${stageName}`);
  console.log(`  Command: ${cmdStr}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would execute the above command.\n");
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const child = spawn(python, [script, ...args], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.log(`\n  ✗ Stage ${stageName} FAILED (exit code ${code})`);
        resolve(false);
      } else {
        console.log(`\n  ✓ Stage ${stageName} completed successfully.`);
        resolve(true);
      }
    });

    child.on("error", (err) => {
      console.log(`\n  ✗ Stage ${stageName} FAILED: ${err.message}`);
      resolve(false);
    });
  });
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
  const { parseSlides } = await import("./stage1_build_inputs.mjs");
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
      console.log(
        `  Visual config: ${config.canvas.width_px}x${config.canvas.height_px}, ` +
        `header=${config.header_lock.body_header_safe_zone}px (${palettePath})`
      );
    } catch (exc) {
      console.log(`  ✗ Invalid visual config: ${exc.message}`);
      return false;
    }
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
 * Stage 2: Generate images with style anchoring.
 *
 * Routes to the image2-ppt skill (generate_full_page_images.py + contact sheet).
 * Bridges generic OPENAI_API_KEY / OPENAI_BASE_URL credentials to whatever the
 * underlying skill natively reads (APIMART_API_KEY / --base-url).
 *
 * @param {string} runDir
 * @param {string|null} [baseUrl]
 * @param {string|null} [only]
 * @param {boolean} [forceImages]
 * @param {string} [resolution]
 * @param {boolean} [dryRun]
 * @returns {Promise<boolean>}
 */
export async function stage2(runDir, {
  baseUrl = null,
  only = null,
  forceImages = false,
  resolution = "2k",
  dryRun = false,
} = {}) {
  const script = findStage2Script();
  if (!script) {
    console.log("  ✗ Stage 2 script not found. Looking for:");
    console.log("    image2-ppt/scripts/generate_full_page_images.py");
    console.log("    in .claude/skills/ or .agents/skills/ (project or global).");
    return false;
  }

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

  // Bridge generic OPENAI_* credentials to the image2-ppt skill's native vars.
  if (!("APIMART_API_KEY" in process.env) && process.env.OPENAI_API_KEY) {
    process.env.APIMART_API_KEY = process.env.OPENAI_API_KEY;
  }
  const resolvedBase = baseUrl
    || process.env.OPENAI_BASE_URL
    || process.env.APIMART_BASE_URL;

  const args = [
    "--prompt-json", promptsFile,
    "--out-dir", outDir,
    "--resolution", resolution,
    "--style-reference", styleMaster,
    "--prompt-is-final",
  ];

  if (resolvedBase) {
    args.push("--base-url", resolvedBase);
  }

  /** @type {string[]} */
  const selectedIds = [];
  if (only) {
    // Split comma-separated --only list into individual --only flags
    // (the Stage-2 skill uses action="append", one id per flag).
    for (let slideId of only.split(",")) {
      slideId = slideId.trim();
      if (slideId) {
        selectedIds.push(slideId);
        args.push("--only", slideId);
      }
    }
  }

  // An explicit --only means "refresh these pages", not "select them and then
  // silently skip because old files exist". Full-deck refresh remains opt-in.
  if (forceImages || only) {
    args.push("--force");
  }

  const ok = await runPythonStage(script, args, "Stage 2: Generate Images", dryRun);
  if (!ok) return false;

  // --- Contact sheet (QA preview) ---
  const contactScript = findContactSheetScript();
  if (!contactScript) {
    console.log("  ✗ Contact-sheet script not found in image2-ppt skill.");
    return false;
  }
  const previewDir = join(buildDir, GEN_PREVIEW_SUBDIR);
  if (!dryRun) {
    mkdirSync(previewDir, { recursive: true });
  }
  let contactPrompts = promptsFile;
  let contactName = "contact_sheet.jpg";
  if (selectedIds.length > 0 && !dryRun) {
    contactPrompts = join(previewDir, "_pilot_prompts.json");
    try {
      writePromptSubset(promptsFile, contactPrompts, selectedIds);
    } catch (exc) {
      console.log(`  ✗ Cannot build pilot contact sheet; ${exc.message}`);
      return false;
    }
    contactName = "pilot_contact_sheet.jpg";
  }

  const contactArgs = [
    "--image-dir", outDir,
    "--prompt-json", contactPrompts,
    "--out", join(previewDir, contactName),
    "--columns", "4",
  ];
  return runPythonStage(contactScript, contactArgs, "Stage 2 QA: Contact Sheet", dryRun);
}

/**
 * Stage 3: Lock headers (Python/Pillow text overlay).
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

    // Validate image count matches expected slide count (early heads-up).
    // stage3_lock_headers.resolve_images will fail loud if any slide lacks its
    // image — it does not build a partial deck. So warn, but don't claim we'll proceed.
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

  // slide_plan lives in _generated/, so stage3 can't derive style/ from its parent.
  // Pass the override-aware backbone visual-style dir explicitly (color_palette.json lives there).
  const args = [
    "--images", imagesDir,
    "--slide-plan", slidePlan,
    "--out", outDir,
    "--color-palette", styleAsset(runDir, COLOR_PALETTE_FILE),
  ];
  return runPythonStage(STAGE3_SCRIPT, args, "Stage 3: Lock Headers", dryRun);
}

/**
 * Stage 4: Build PPTX container.
 *
 * Uses the Node.js ESM port (stage4_build_pptx.mjs) programmatically so we
 * don't need a Python subprocess for this stage.
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

  let pptxFiles = [];
  if (existsSync(pptDir)) {
    pptxFiles = readdirSync(pptDir)
      .filter((f) => f.endsWith(".pptx") && !f.endsWith(".backup.pptx"))
      .map((f) => join(pptDir, f))
      .sort();
  }
  if (pptxFiles.length === 0) {
    console.log(`  ✗ No .pptx found in ${pptDir}. Run Stage 4 first.`);
    return false;
  }

  if (pptxFiles.length > 1) {
    console.log(
      `  ⚠  ${pptxFiles.length} .pptx files in ${pptDir}; using ${basename(pptxFiles[0])}. ` +
      `Remove strays so the target is unambiguous.`
    );
  }
  const pptxFile = pptxFiles[0];

  // Back up the pre-notes deck — but never CLOBBER an existing backup, or a second
  // Stage-5 run would overwrite the clean images-only backup with the already-
  // notes-injected deck, destroying the recoverable pre-notes state.
  const backup = join(dirname(pptxFile),
    basename(pptxFile).replace(/\.pptx$/, ".backup.pptx"));
  if (existsSync(backup)) {
    console.log(`  Keeping existing backup ${basename(backup)} (not overwriting).`);
  } else {
    console.log(`  Backing up PPTX to ${basename(backup)}`);
    copyFileSync(pptxFile, backup);
  }

  try {
    const { extractNotesFromMarkdown, injectNotes } = await import("./stage5_inject_notes.mjs");
    const notes = extractNotesFromMarkdown([inputFile]);
    const result = await injectNotes({ pptx: pptxFile, notes });

    console.log(`\n  ✓ Stage 5: Inject Notes completed successfully.`);
    console.log(`  Notes injected: ${result.notesInjected}/${result.slideCount} slides`);
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
 * deviation from the canonical structure aborts the run. `requireReady` toggles
 * Stage-2 readiness: style_master.jpg plus recorded content/visual gate decisions.
 * Cheap authoring reruns (e.g. Stage 1 or 5) do not demand them.
 *
 * @param {string} runDir
 * @param {boolean} [requireReady=true] - Require Stage-2 readiness.
 * @returns {boolean} true if valid.
 */
export function validateRunDir(runDir, requireReady = true) {
  const violations = checkBundle(resolve(runDir), requireReady);
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
    .option("--resolution <res>", "Stage-2 image resolution (default: 2k; use 1k for pilots)", "2k")
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

      if (!validateRunDir(runDir, stages.includes(2))) {
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

      // Stage dispatch table
      const stageFuncs = {
        1: () => stage1(runDir, opts.dryRun),
        2: () => stage2(runDir, {
          baseUrl: opts.baseUrl || null,
          only: opts.only || null,
          forceImages: opts.forceImages || false,
          resolution: opts.resolution || "2k",
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
  main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    process.exit(1);
  });
}
