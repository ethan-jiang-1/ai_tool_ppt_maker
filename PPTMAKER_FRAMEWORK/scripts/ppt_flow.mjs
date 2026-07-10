#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script
 *
 * Friendly command surface for the PPT framework.
 * This is the default human/agent entry point. It delegates to the structural SSOT
 * and production orchestrator instead of duplicating their logic.
 *
 * 11 commands: doctor, init, status, approve, style-master, validate, pilot,
 *              build, refresh, new-version, test
 *
 * Uses commander for CLI. Delegates to:
 *   - bundle_layout.mjs         — directory SSOT, init, check, create_version
 *   - unified_pipeline.mjs      — production orchestrator (subprocess)
 *   - generate_style_master.mjs — visual style anchor (subprocess)
 *   - env-check.mjs             — environment health check (subprocess)
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync,
         rmSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REFERENCE_SCRIPTS_DIR = __dirname;
const FRAMEWORK_DIR = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Import from bundle_layout.mjs — the single source of truth
// ---------------------------------------------------------------------------

import {
  // top-level constants
  UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR,
  GUIDE_FILE, POINTER_FILE, METADATA_FILE,
  // visual-style
  STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE,
  // version
  SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR,
  // _generated
  GEN_SLIDE_PLAN, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON,
  GEN_IMAGES_SUBDIR, GEN_HEADER_LOCKED_SUBDIR,
  GEN_PPT_SUBDIR, GEN_QA_SUBDIR, GEN_PREVIEW_SUBDIR,
  // resolvers
  deckRoot, backboneDir, styleAsset, styleDir, generatedDir,
  findSlideSpecs, deckName, isVersionDir, loadDotenv,
  // catalogues
  DECK_TYPE_TEMPLATES, STYLE_PRESETS,
  // init / check / create
  initBundle, checkBundle, createVersion,
} from "./bundle_layout.mjs";

// ---------------------------------------------------------------------------
// Script paths for subprocess delegation
// ---------------------------------------------------------------------------

const UNIFIED_PIPELINE = join(REFERENCE_SCRIPTS_DIR, "unified_pipeline.mjs");
const GENERATE_STYLE_MASTER = join(REFERENCE_SCRIPTS_DIR, "generate_style_master.mjs");
const STAGE1_BUILD_INPUTS = join(REFERENCE_SCRIPTS_DIR, "stage1_build_inputs.mjs");
const STAGE3_LOCK_HEADERS = join(REFERENCE_SCRIPTS_DIR, "stage3_lock_headers.mjs");
const ENV_CHECK = join(FRAMEWORK_DIR, "scripts", "env-check.mjs");

// ---------------------------------------------------------------------------
// Subprocess runners
// ---------------------------------------------------------------------------

/**
 * Spawn a Node.js script as a subprocess with inherited stdio.
 * @param {string} script - Absolute path to the .mjs script.
 * @param {string[]} args - CLI arguments.
 * @returns {Promise<number>} Exit code.
 */
function runNode(script, args = []) {
  const cmd = ["node", script, ...args].map(String);
  console.log("→ " + cmd.join(" "));
  return new Promise((resolve) => {
    const child = spawn("node", [script, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => resolve(code !== null ? code : 1));
    child.on("error", (err) => {
      console.error(`✗ Failed to spawn node: ${err.message}`);
      resolve(1);
    });
  });
}

// ---------------------------------------------------------------------------
// Metadata helpers
// ---------------------------------------------------------------------------

/**
 * Parse simple key: value fields from a YAML-ish metadata file.
 * Skips comments and lines without colons.
 * @param {string} path
 * @returns {Record<string, string>}
 */
function metadataFields(path) {
  const fields = {};
  if (!existsSync(path)) return fields;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    if (!line.includes(":") || line.trimStart().startsWith("#")) continue;
    const [key, ...rest] = line.split(":");
    fields[key.trim()] = rest.join(":").trim();
  }
  return fields;
}

/**
 * Update one metadata gate without rewriting unrelated fields/comments.
 * Creates the parent directory if it does not exist.
 * @param {string} metadataPath
 * @param {string} gate - "content" or "visual".
 * @param {string} value - Default "approved".
 */
function updateGate(metadataPath, gate, value = "approved") {
  const key = `${gate}_gate`;
  let lines = existsSync(metadataPath)
    ? readFileSync(metadataPath, "utf-8").split("\n")
    : [];
  const replacement = `${key}: ${value}`;
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].split(":", 1)[0].trim() === key) {
      lines[i] = replacement;
      found = true;
      break;
    }
  }
  if (!found) lines.push(replacement);
  mkdirSync(dirname(metadataPath), { recursive: true });
  writeFileSync(metadataPath, lines.join("\n").trimEnd() + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Status collection and printing
// ---------------------------------------------------------------------------

/**
 * Collect status for a version run directory.
 * @param {string} runDir
 * @returns {object}
 */
function collectStatus(runDir) {
  const root = deckRoot(runDir);
  const genDir = generatedDir(runDir);
  const planPath = join(genDir, GEN_SLIDE_PLAN);

  let expected = 0;
  if (existsSync(planPath)) {
    try {
      expected = (JSON.parse(readFileSync(planPath, "utf-8")).slides || []).length;
    } catch {
      expected = 0;
    }
  }

  const imagesDir = join(genDir, GEN_IMAGES_SUBDIR);
  const lockedDir = join(genDir, GEN_HEADER_LOCKED_SUBDIR);
  const pptDir = join(genDir, GEN_PPT_SUBDIR);
  const meta = metadataFields(join(root, METADATA_FILE));

  const pngCount = (d) =>
    existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".png")).length : 0;

  /** @type {string[]} */
  let pptxFiles = [];
  if (existsSync(pptDir)) {
    pptxFiles = readdirSync(pptDir)
      .filter((f) => f.endsWith(".pptx") && !f.endsWith(".backup.pptx"))
      .sort();
  }

  return {
    run_dir: String(runDir),
    structure_issues: checkBundle(runDir, false),
    content_gate: meta.content_gate || "missing",
    visual_gate: meta.visual_gate || "missing",
    style_master: existsSync(styleAsset(runDir, STYLE_MASTER_IMAGE)),
    slide_plan: existsSync(planPath),
    expected_slides: expected,
    raw_images: pngCount(imagesDir),
    locked_images: pngCount(lockedDir),
    pptx: pptxFiles.map((f) => basename(f)),
    pilot_preview: existsSync(
      join(genDir, GEN_PREVIEW_SUBDIR, "pilot_final_contact_sheet.jpg")
    ),
  };
}

/**
 * Pretty-print status to stdout.
 * @param {object} status
 */
function printStatus(status) {
  const structure =
    status.structure_issues.length === 0
      ? "OK"
      : `${status.structure_issues.length} issue(s)`;
  const expected = status.expected_slides || "?";

  console.log(`PPT Flow status — ${status.run_dir}`);
  console.log(`  Structure:     ${structure}`);
  console.log(`  Content gate:  ${status.content_gate}`);
  console.log(`  Visual gate:   ${status.visual_gate}`);
  console.log(`  Style master:  ${status.style_master ? "ready" : "missing"}`);
  console.log(`  Slide plan:    ${status.slide_plan ? "ready" : "not built"}`);
  console.log(`  Raw images:    ${status.raw_images}/${expected}`);
  console.log(`  Locked images: ${status.locked_images}/${expected}`);
  console.log(
    `  PPTX:          ${status.pptx.length > 0 ? status.pptx.join(", ") : "not built"}`
  );
  console.log(
    `  Pilot preview: ${status.pilot_preview ? "ready" : "not built"}`
  );

  if (status.structure_issues.length > 0) {
    console.log("\nFix first:");
    for (const issue of status.structure_issues) {
      console.log(`  - ${issue}`);
    }
    return;
  }

  /** @type {string[]} */
  const nextSteps = [];
  const rd = status.run_dir;

  if (!["approved", "waived"].includes(status.content_gate)) {
    nextSteps.push(`After content review: ppt_flow.mjs approve ${rd} content`);
  }
  if (!status.style_master) {
    nextSteps.push(
      `Generate style master: ppt_flow.mjs style-master ${rd}`
    );
  }
  if (!["approved", "waived"].includes(status.visual_gate)) {
    nextSteps.push(`After visual review: ppt_flow.mjs approve ${rd} visual`);
  }
  if (
    ["approved", "waived"].includes(status.content_gate) &&
    ["approved", "waived"].includes(status.visual_gate) &&
    status.style_master
  ) {
    if (!status.pilot_preview && status.pptx.length === 0) {
      nextSteps.push(
        `Create representative pilot: ppt_flow.mjs pilot ${rd}`
      );
    } else if (status.pptx.length === 0) {
      nextSteps.push(`Build full deck: ppt_flow.mjs build ${rd}`);
    }
  }
  if (status.pptx.length > 0) {
    nextSteps.push(
      `Future edits: ppt_flow.mjs refresh ${rd} --kind <title|visual|notes>`
    );
  }
  if (nextSteps.length > 0) {
    console.log("\nNext:");
    for (const step of nextSteps) {
      console.log(`  - ${step}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Pilot slide selection (ported helper
// ---------------------------------------------------------------------------

/**
 * Choose opener/body/closer representatives without requiring hand-picked IDs.
 *
 * Strategy:
 *   - Opener = first full-page slide (or first slide)
 *   - Body = midpoint-near non-full-page slide
 *   - Closer = last full-page slide (or last slide)
 *
 * Pilot selection: classifies slides by render_mode via
 * _contract_render_mode (which handles both canonical "full-page" and
 * legacy "image_direct" header_variant values).
 *
 * @param {Array<{id: string, layout_contract?: {render_mode?: string, header_variant?: string}}>} slides
 * @param {number} [count] - Max number of slides to select (default 3).
 * @returns {string[]} Array of selected slide IDs.
 */
export function selectPilotSlideIds(slides, count = 3) {
  const ids = slides.map((s) => String(s.id || "").trim()).filter(Boolean);
  if (count < 1 || ids.length <= count) return ids;

  // Classify: full-page slides have render_mode === "full-page" or
  // legacy header_variant === "image_direct"
  const RENDER_MODE_FULL_PAGE = "full-page";
  const fullPageIndices = [];
  for (let i = 0; i < slides.length; i++) {
    const lc = slides[i].layout_contract || {};
    const mode = lc.render_mode;
    const legacy = lc.header_variant;
    if (
      mode === RENDER_MODE_FULL_PAGE ||
      legacy === "image_direct"
    ) {
      fullPageIndices.push(i);
    }
  }
  const bodyIndices = [];
  for (let i = 0; i < slides.length; i++) {
    if (!fullPageIndices.includes(i)) bodyIndices.push(i);
  }

  /** @type {number[]} */
  const chosen = [];

  function add(index) {
    if (
      index != null &&
      index >= 0 &&
      index < slides.length &&
      !chosen.includes(index)
    ) {
      chosen.push(index);
    }
  }

  // Opener: first full-page, or slide 0
  add(fullPageIndices.length > 0 ? fullPageIndices[0] : 0);

  // Body: the non-full-page slide closest to the midpoint
  if (bodyIndices.length > 0) {
    const midpoint = (slides.length - 1) / 2;
    bodyIndices.sort(
      (a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint)
    );
    add(bodyIndices[0]);
  }

  // Closer: last full-page, or last slide
  add(
    fullPageIndices.length > 0
      ? fullPageIndices[fullPageIndices.length - 1]
      : slides.length - 1
  );

  // Fallback fill: first, middle, last, then sequential
  const fallback = [0, Math.floor(slides.length / 2), slides.length - 1];
  for (let i = 0; i < slides.length; i++) {
    if (!fallback.includes(i)) fallback.push(i);
  }
  for (const idx of fallback) {
    if (chosen.length >= count) break;
    add(idx);
  }

  return chosen.slice(0, count).map((i) => String(slides[i].id));
}

// ---------------------------------------------------------------------------
// Pilot header render (Stage 3 + contact sheet on pilot subset)
// ---------------------------------------------------------------------------

/**
 * Render header-locked images and contact sheet for the pilot subset.
 * ported helper
 *
 * @param {string} runDir
 * @param {string[]} selectedIds
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
async function renderPilotHeaders(runDir, selectedIds, dryRun) {
  const genDir = generatedDir(runDir);
  const planPath = join(genDir, GEN_SLIDE_PLAN);
  const planData = JSON.parse(readFileSync(planPath, "utf-8"));
  const selectedSet = new Set(selectedIds);

  /** @type {Array<object>} */
  const slides = (planData.slides || [])
    .filter((s) => selectedSet.has(s.id))
    .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

  const qaDir = join(genDir, GEN_QA_SUBDIR);
  const pilotPlan = join(qaDir, "pilot_slide_plan.json");
  const pilotImages = join(qaDir, "pilot_header_locked");
  const preview = join(
    genDir,
    GEN_PREVIEW_SUBDIR,
    "pilot_final_contact_sheet.jpg"
  );

  if (!dryRun) {
    mkdirSync(qaDir, { recursive: true });
    if (existsSync(pilotImages)) {
      rmSync(pilotImages, { recursive: true, force: true });
    }
    mkdirSync(pilotImages, { recursive: true });
    mkdirSync(dirname(preview), { recursive: true });
    writeFileSync(
      pilotPlan,
      JSON.stringify({ slides }, null, 2) + "\n",
      "utf-8"
    );
  }

  // Stage 3: Lock headers for pilot subset
  const stage3Args = [
    "--images",
    join(genDir, GEN_IMAGES_SUBDIR),
    "--slide-plan",
    pilotPlan,
    "--out",
    pilotImages,
    "--color-palette",
    styleAsset(runDir, COLOR_PALETTE_FILE),
  ];

  if (dryRun) {
    console.log("  [DRY RUN] Pilot Stage 3 would run.");
  } else {
    const stage3Code = await runNode(STAGE3_LOCK_HEADERS, stage3Args);
    if (stage3Code !== 0) {
      console.error("✗ Pilot QA: Final Header-Locked Pages FAILED");
      return false;
    }
  }

  // Contact sheet (in-framework)
  const MAKE_CONTACT_SHEET = join(REFERENCE_SCRIPTS_DIR, "make_contact_sheet.mjs");
  const contactArgs = [
    "--image-dir",
    pilotImages,
    "--out",
    preview,
    "--columns",
    String(Math.min(3, selectedIds.length)),
  ];

  if (dryRun) {
    console.log("  [DRY RUN] Contact sheet would run.");
  } else {
    const contactCode = await runNode(MAKE_CONTACT_SHEET, contactArgs);
    if (contactCode !== 0) {
      console.error("✗ Pilot QA: Final Contact Sheet FAILED");
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Utility: Build env search dirs for .env loading
// ---------------------------------------------------------------------------

/**
 * Build the ordered list of directories to search for .env.
 * @param {string} dkRoot - Deck root path.
 * @returns {string[]}
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

// ---------------------------------------------------------------------------
// Command: doctor
// ---------------------------------------------------------------------------

/**
 * doctor — Check Node.js, npm, dependencies, in-framework Stage 2, and credentials.
 * Delegates to env-check.mjs as a subprocess.
 */
async function commandDoctor() {
  return runNode(ENV_CHECK);
}

// ---------------------------------------------------------------------------
// Command: init
// ---------------------------------------------------------------------------

/**
 * init — Create a conformant run bundle.
 * @param {string} deckDir
 * @param {{deckType: string, style: string}} opts
 */
function commandInit(deckDir, { deckType, style }) {
  const resolved = resolve(deckDir);

  if (!basename(resolved).startsWith("deck_")) {
    console.error("✗ Deck directory must start with 'deck_'.");
    return 1;
  }
  if (
    FRAMEWORK_DIR === resolved ||
    resolved.startsWith(FRAMEWORK_DIR + "/")
  ) {
    console.error("✗ A run bundle must live outside PPTMAKER_FRAMEWORK/.");
    return 1;
  }
  if (!(deckType in DECK_TYPE_TEMPLATES)) {
    console.error(
      `✗ Unknown deck-type: ${deckType}. Allowed: ${Object.keys(DECK_TYPE_TEMPLATES).sort().join(", ")}`
    );
    return 1;
  }
  if (!STYLE_PRESETS.includes(style)) {
    console.error(
      `✗ Unknown style: ${style}. Allowed: ${STYLE_PRESETS.sort().join(", ")}`
    );
    return 1;
  }

  let log;
  try {
    log = initBundle(resolved, FRAMEWORK_DIR, deckType, style);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    return 1;
  }

  console.log(`✓ Initialized ${resolved}`);
  for (const line of log) console.log(`  - ${line}`);
  console.log(
    `\nNext: ppt_flow.mjs status ${join(resolved, VERSIONS_DIR, "v1")}`
  );
  return 0;
}

// ---------------------------------------------------------------------------
// Command: status
// ---------------------------------------------------------------------------

/**
 * status — Show gates, artifacts, and next action.
 * @param {string} runDir
 * @param {{json: boolean}} opts
 */
function commandStatus(runDir, { json: asJson }) {
  const resolved = resolve(runDir);
  const status = collectStatus(resolved);
  if (asJson) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    printStatus(status);
  }
  return status.structure_issues.length > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Command: approve
// ---------------------------------------------------------------------------

/**
 * approve — Record a reviewed content/visual gate.
 * @param {string} runDir
 * @param {string} gate - "content" or "visual".
 * @param {boolean} waive
 */
function commandApprove(runDir, gate, { waive }) {
  const resolved = resolve(runDir);
  const issues = checkBundle(resolved, false);
  if (issues.length > 0) {
    printStatus(collectStatus(resolved));
    return 1;
  }
  const value = waive ? "waived" : "approved";
  const metadata = join(deckRoot(resolved), METADATA_FILE);
  updateGate(metadata, gate, value);
  console.log(`✓ ${gate}_gate: ${value} (${metadata})`);
  return 0;
}

// ---------------------------------------------------------------------------
// Command: style-master
// ---------------------------------------------------------------------------

/**
 * style-master — Generate the visual style anchor.
 * Delegates to generate_style_master.mjs as a subprocess.
 *
 * @param {string} runDir
 * @param {{resolution: string, model: string, baseUrl: string[], force: boolean, dryRun: boolean}} opts
 */
async function commandStyleMaster(
  runDir,
  { resolution, model, baseUrl = [], force, dryRun }
) {
  const resolved = resolve(runDir);
  const args = ["--run-dir", resolved, "--resolution", resolution];

  if (model) args.push("--model", model);
  for (const url of baseUrl) args.push("--base-url", url);
  if (force) args.push("--force");
  if (dryRun) args.push("--dry-run");

  return runNode(GENERATE_STYLE_MASTER, args);
}

// ---------------------------------------------------------------------------
// Command: validate
// ---------------------------------------------------------------------------

/**
 * validate — Validate slide specs before image generation.
 * Delegates to stage1_build_inputs.mjs --validate as a subprocess.
 *
 * @param {string} runDir
 */
async function commandValidate(runDir) {
  const resolved = resolve(runDir);
  const issues = checkBundle(resolved, false);
  if (issues.length > 0) {
    printStatus(collectStatus(resolved));
    return 1;
  }
  const specs = findSlideSpecs(resolved);
  if (!specs) {
    console.error(`✗ No ${SLIDE_SPECS_GLOB} found in ${resolved}`);
    return 1;
  }
  return runNode(STAGE1_BUILD_INPUTS, ["--validate", "--input", specs]);
}

// ---------------------------------------------------------------------------
// Command: pilot
// ---------------------------------------------------------------------------

/**
 * pilot — Auto-select and build representative pages.
 *
 * Runs Stage 1 (via unified_pipeline.mjs), selects pilot slide IDs,
 * runs Stage 2 with --only for the pilot subset, then renders header-locked
 * images and a contact sheet for QA.
 *
 * @param {string} runDir
 * @param {{only: string|null, count: number, resolution: string, baseUrl: string|null, dryRun: boolean}} opts
 */
async function commandPilot(
  runDir,
  { only: onlyStr, count, resolution, baseUrl, dryRun }
) {
  const resolved = resolve(runDir);

  if (count < 1) {
    console.error("✗ --count must be at least 1.");
    return 1;
  }

  // Validate structure (not requiring pipeline readiness yet)
  const preIssues = checkBundle(resolved, false);
  if (preIssues.length > 0) {
    console.error(
      `✗ Bundle does NOT conform — ${preIssues.length} violation(s):`
    );
    for (const v of preIssues) console.error(`  - ${v}`);
    return 1;
  }

  // Load .env so API credentials are available for Stage 2
  const dkRoot = deckRoot(resolved);
  loadDotenv(...buildEnvSearchDirs(dkRoot));

  // --- Stage 1: Build slide plan ---
  const stage1Args = ["--run-dir", resolved, "--stage", "1"];
  if (dryRun) stage1Args.push("--dry-run");
  let code = await runNode(UNIFIED_PIPELINE, stage1Args);
  if (code !== 0) return 1;

  // --- Select pilot slide IDs ---
  const planPath = join(generatedDir(resolved), GEN_SLIDE_PLAN);
  if (dryRun && !existsSync(planPath)) {
    console.log(
      "  [DRY RUN] Pilot IDs will be auto-selected after Stage 1 creates slide_plan.json."
    );
    return 0;
  }
  const plan = JSON.parse(readFileSync(planPath, "utf-8")).slides || [];

  /** @type {string[]} */
  let selectedIds;
  if (onlyStr) {
    selectedIds = onlyStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    selectedIds = selectPilotSlideIds(plan, count);
  }

  const known = new Set(plan.map((s) => s.id));
  const unknown = selectedIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    console.error(`✗ Unknown pilot slide IDs: ${unknown.join(", ")}`);
    return 1;
  }
  console.log(`Pilot slides: ${selectedIds.join(", ")}`);

  // Validate readiness (gates + style master)
  const readyIssues = checkBundle(resolved, true);
  if (readyIssues.length > 0) {
    console.error(
      `✗ Bundle NOT pipeline-ready — ${readyIssues.length} issue(s):`
    );
    for (const v of readyIssues) console.error(`  - ${v}`);
    return 1;
  }

  // --- Stage 2: Generate images for pilot subset ---
  const stage2Args = [
    "--run-dir",
    resolved,
    "--stage",
    "2",
    "--only",
    selectedIds.join(","),
    "--force-images",
    "--resolution",
    resolution,
  ];
  if (baseUrl) stage2Args.push("--base-url", baseUrl);
  if (dryRun) stage2Args.push("--dry-run");
  code = await runNode(UNIFIED_PIPELINE, stage2Args);
  if (code !== 0) return 1;

  // --- Render pilot headers (Stage 3 + contact sheet on pilot subset) ---
  const ok = await renderPilotHeaders(resolved, selectedIds, dryRun);
  if (!ok) return 1;

  if (!dryRun) {
    const previewPath = join(
      generatedDir(resolved),
      GEN_PREVIEW_SUBDIR,
      "pilot_final_contact_sheet.jpg"
    );
    console.log(`\n✓ Pilot ready: ${previewPath}`);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Command: build
// ---------------------------------------------------------------------------

/**
 * build — Build the complete final deck.
 * Delegates to unified_pipeline.mjs --stage all.
 *
 * @param {string} runDir
 * @param {{resolution: string, baseUrl: string|null, reuseImages: boolean, dryRun: boolean}} opts
 */
async function commandBuild(
  runDir,
  { resolution, baseUrl, reuseImages, dryRun }
) {
  const resolved = resolve(runDir);
  const args = [
    "--run-dir",
    resolved,
    "--stage",
    "all",
    "--resolution",
    resolution,
  ];

  if (!reuseImages) args.push("--force-images");
  if (baseUrl) args.push("--base-url", baseUrl);
  if (dryRun) args.push("--dry-run");

  return runNode(UNIFIED_PIPELINE, args);
}

// ---------------------------------------------------------------------------
// Command: refresh
// ---------------------------------------------------------------------------

/**
 * refresh — Run the smallest safe edit chain.
 * Delegates to unified_pipeline.mjs with appropriate --stage.
 *
 * @param {string} runDir
 * @param {{kind: string, only: string|null, all: boolean, resolution: string, baseUrl: string|null, dryRun: boolean}} opts
 */
async function commandRefresh(
  runDir,
  { kind, only: onlyStr, all: allSlides, resolution, baseUrl, dryRun }
) {
  const resolved = resolve(runDir);

  /** @type {string} */
  let stages;

  if (kind === "title") {
    if (onlyStr || allSlides) {
      console.error("✗ --only/--all apply only to --kind visual.");
      return 1;
    }
    stages = "1,3,4,5";
  } else if (kind === "notes") {
    if (onlyStr || allSlides) {
      console.error("✗ --only/--all apply only to --kind visual.");
      return 1;
    }
    stages = "5";
  } else {
    // kind === "visual"
    if (!onlyStr && !allSlides) {
      console.error(
        "✗ Visual refresh needs --only slide_id[,slide_id] or explicit --all."
      );
      return 1;
    }
    stages = "1,2,3,4,5";
  }

  const args = [
    "--run-dir",
    resolved,
    "--stage",
    stages,
    "--resolution",
    resolution,
  ];
  if (onlyStr) args.push("--only", onlyStr);
  if (allSlides) args.push("--force-images");
  if (baseUrl) args.push("--base-url", baseUrl);
  if (dryRun) args.push("--dry-run");

  return runNode(UNIFIED_PIPELINE, args);
}

// ---------------------------------------------------------------------------
// Command: new-version
// ---------------------------------------------------------------------------

/**
 * new-version — Create a clean downstream version (copies spec + overrides,
 * not generated artifacts).
 *
 * @param {string} runDir
 * @param {string|null} name - e.g. "v3".
 */
function commandNewVersion(runDir, { name }) {
  const resolved = resolve(runDir);
  try {
    const target = createVersion(resolved, name);
    console.log(`✓ Created clean version: ${target}`);
    console.log("  Generated artifacts were not copied.");
    return 0;
  } catch (err) {
    console.error(`✗ ${err.message}`);
    return 1;
  }
}

// ---------------------------------------------------------------------------
// Command: test
// ---------------------------------------------------------------------------

/**
 * test — Run all framework checks via vitest.
 */
async function commandTest() {
  const result = spawnSync("npm", ["test"], {
    stdio: "inherit",
    env: process.env,
    cwd: resolve(FRAMEWORK_DIR, ".."),
  });
  return result.status !== null ? result.status : 1;
}

// ---------------------------------------------------------------------------
// CLI — commander setup
// ---------------------------------------------------------------------------

async function main() {
  const program = new Command();

  program
    .name("ppt_flow.mjs")
    .description("One friendly entry point for the complete PPT workflow.")
    .addHelpText(
      "after",
      `
Examples:
  ppt_flow.mjs doctor
  ppt_flow.mjs init deck_mydeck --deck-type pitch --style tech-startup
  ppt_flow.mjs status deck_mydeck/3_versions/v1
  ppt_flow.mjs approve deck_mydeck/3_versions/v1 content
  ppt_flow.mjs style-master deck_mydeck/3_versions/v1
  ppt_flow.mjs validate deck_mydeck/3_versions/v1
  ppt_flow.mjs pilot deck_mydeck/3_versions/v1
  ppt_flow.mjs build deck_mydeck/3_versions/v1
  ppt_flow.mjs refresh deck_mydeck/3_versions/v1 --kind visual --only slide_03
  ppt_flow.mjs new-version deck_mydeck/3_versions/v1 --name v2
  ppt_flow.mjs test
`
    );

  // ---- doctor ----
  program
    .command("doctor")
    .description("Check Node.js, npm, deps, in-framework Stage 2, and credentials")
    .action(async () => {
      const code = await commandDoctor();
      process.exit(code);
    });

  // ---- init ----
  program
    .command("init")
    .description("Create a conformant run bundle")
    .argument("<deck_dir>", "Target deck directory (must start with deck_)")
    .requiredOption(
      "--deck-type <type>",
      `Deck type: ${Object.keys(DECK_TYPE_TEMPLATES).sort().join(", ")}`
    )
    .requiredOption(
      "--style <style>",
      `Style preset: ${STYLE_PRESETS.sort().join(", ")}`
    )
    .action(async (deckDir, opts) => {
      // Validation already done in commandInit, but commander enums are friendly
      if (!(opts.deckType in DECK_TYPE_TEMPLATES)) {
        console.error(
          `✗ Unknown deck-type: ${opts.deckType}. Allowed: ${Object.keys(DECK_TYPE_TEMPLATES).sort().join(", ")}`
        );
        process.exit(1);
      }
      if (!STYLE_PRESETS.includes(opts.style)) {
        console.error(
          `✗ Unknown style: ${opts.style}. Allowed: ${STYLE_PRESETS.sort().join(", ")}`
        );
        process.exit(1);
      }
      const code = commandInit(deckDir, {
        deckType: opts.deckType,
        style: opts.style,
      });
      process.exit(code);
    });

  // ---- status ----
  program
    .command("status")
    .description("Show gates, artifacts, and next action")
    .argument(
      "<run_dir>",
      "Path to version dir (e.g., deck_xxx/3_versions/v1)"
    )
    .option("--json", "Output machine-readable JSON")
    .action((runDir, opts) => {
      const code = commandStatus(runDir, { json: opts.json ?? false });
      process.exit(code);
    });

  // ---- approve ----
  program
    .command("approve")
    .description("Record a reviewed content/visual gate")
    .argument("<run_dir>", "Path to version dir")
    .argument("<gate>", "Gate to approve: content or visual")
    .option("--waive", "Record an explicit user decision to skip this gate")
    .action((runDir, gate, opts) => {
      if (!["content", "visual"].includes(gate)) {
        console.error(
          `✗ gate must be "content" or "visual"; got: ${gate}`
        );
        process.exit(1);
      }
      const code = commandApprove(runDir, gate, {
        waive: opts.waive ?? false,
      });
      process.exit(code);
    });

  // ---- style-master ----
  program
    .command("style-master")
    .description("Generate the visual style anchor")
    .argument("<run_dir>", "Path to version dir")
    .option("--resolution <res>", "Image resolution (1k, 2k, or 4k)", "2k")
    .option("--model <model>", "Model name", "gpt-image-2")
    .option(
      "--base-url <url>",
      "API base URL (repeatable)",
      (val, prev) => [...(prev || []), val],
      []
    )
    .option("--force", "Force regeneration")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      if (!["1k", "2k", "4k"].includes(opts.resolution)) {
        console.error(
          `✗ Resolution must be 1k, 2k, or 4k; got: ${opts.resolution}`
        );
        process.exit(1);
      }
      const code = await commandStyleMaster(runDir, {
        resolution: opts.resolution,
        model: opts.model,
        baseUrl: opts.baseUrl || [],
        force: opts.force ?? false,
        dryRun: opts.dryRun ?? false,
      });
      process.exit(code);
    });

  // ---- validate ----
  program
    .command("validate")
    .description("Validate slide specs before image generation")
    .argument("<run_dir>", "Path to version dir")
    .action(async (runDir) => {
      const code = await commandValidate(runDir);
      process.exit(code);
    });

  // ---- pilot ----
  program
    .command("pilot")
    .description("Auto-select and build representative pages")
    .argument("<run_dir>", "Path to version dir")
    .option("--only <ids>", "Optional comma-separated slide IDs")
    .option(
      "--count <n>",
      "Number of pilot slides to auto-select",
      (v) => parseInt(v, 10),
      3
    )
    .option("--resolution <res>", "Image resolution for pilot", "1k")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      if (!["1k", "2k", "4k"].includes(opts.resolution)) {
        console.error(
          `✗ Resolution must be 1k, 2k, or 4k; got: ${opts.resolution}`
        );
        process.exit(1);
      }
      const code = await commandPilot(runDir, {
        only: opts.only || null,
        count: opts.count ?? 3,
        resolution: opts.resolution,
        baseUrl: opts.baseUrl || null,
        dryRun: opts.dryRun ?? false,
      });
      process.exit(code);
    });

  // ---- build ----
  program
    .command("build")
    .description("Build the complete final deck")
    .argument("<run_dir>", "Path to version dir")
    .option("--resolution <res>", "Final image resolution", "2k")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option(
      "--reuse-images",
      "Reuse existing Stage-2 images instead of refreshing at final resolution"
    )
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      if (!["1k", "2k", "4k"].includes(opts.resolution)) {
        console.error(
          `✗ Resolution must be 1k, 2k, or 4k; got: ${opts.resolution}`
        );
        process.exit(1);
      }
      const code = await commandBuild(runDir, {
        resolution: opts.resolution,
        baseUrl: opts.baseUrl || null,
        reuseImages: opts.reuseImages ?? false,
        dryRun: opts.dryRun ?? false,
      });
      process.exit(code);
    });

  // ---- refresh ----
  program
    .command("refresh")
    .description("Run the smallest safe edit chain")
    .argument("<run_dir>", "Path to version dir")
    .option(
      "--kind <kind>",
      "Edit scope: title, visual, or notes",
      "visual"
    )
    .option("--only <ids>", "For visual: comma-separated slide IDs")
    .option("--all", "For visual: explicitly refresh all pages")
    .option("--resolution <res>", "Image resolution", "2k")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      if (!["title", "visual", "notes"].includes(opts.kind)) {
        console.error(
          `✗ --kind must be title, visual, or notes; got: ${opts.kind}`
        );
        process.exit(1);
      }
      if (!["1k", "2k", "4k"].includes(opts.resolution)) {
        console.error(
          `✗ Resolution must be 1k, 2k, or 4k; got: ${opts.resolution}`
        );
        process.exit(1);
      }
      const code = await commandRefresh(runDir, {
        kind: opts.kind,
        only: opts.only || null,
        all: opts.all ?? false,
        resolution: opts.resolution,
        baseUrl: opts.baseUrl || null,
        dryRun: opts.dryRun ?? false,
      });
      process.exit(code);
    });

  // ---- new-version ----
  program
    .command("new-version")
    .description("Create a clean downstream version")
    .argument("<run_dir>", "Path to source version dir")
    .option("--name <name>", "Explicit version name, e.g. v3")
    .action((runDir, opts) => {
      const code = commandNewVersion(runDir, {
        name: opts.name || null,
      });
      process.exit(code);
    });

  // ---- test ----
  program
    .command("test")
    .description("Run all framework checks")
    .action(async () => {
      const code = await commandTest();
      process.exit(code);
    });

  await program.parseAsync(process.argv);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const __filename_main = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1];
const isMain =
  invokedPath &&
  (invokedPath === __filename_main ||
    invokedPath === resolve(__filename_main) ||
    (basename(invokedPath) === "ppt_flow.mjs" && existsSync(invokedPath)));

if (isMain) {
  main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    process.exit(1);
  });
}

// state command
program.command('state')
  .argument('<runDir>', 'Path to version directory')
  .option('--json', 'JSON output')
  .option('--check-gates', 'Verify gates for Stage 2 readiness')
  .action(async (runDir, opts) => {
    const { readState, getCurrentNode, getCompletedNodes, getPendingNodes, isGateApproved, statePath } = await import('./lib/state.mjs');
    const deckDir = join(runDir, '..', '..');
    const s = readState(deckDir);
    if (s.corrupted) { console.error('State corrupted:', s.errors); process.exit(2); }
    if (opts.checkGates) {
      const c = isGateApproved(s, 'content'), v = isGateApproved(s, 'visual');
      if (c && v) { console.log('Gates OK'); process.exit(0); }
      else { console.log('Gates BLOCKED:' + (c?'':' content') + (v?'':' visual')); process.exit(1); }
    }
    if (opts.json) { console.log(JSON.stringify(s, null, 2)); return; }
    console.log('Playbook: ' + (s.playbook || '(none)'));
    console.log('Current:  ' + (getCurrentNode(s) || '(none)'));
    console.log('Done:     ' + getCompletedNodes(s).join(', '));
    console.log('Pending:  ' + getPendingNodes(s).join(', '));
    console.log('Gates:    content=' + (s.gates?.content||'pending') + ' visual=' + (s.gates?.visual||'pending'));
  });

