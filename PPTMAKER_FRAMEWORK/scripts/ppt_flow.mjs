#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script
 *
 * Friendly command surface for the PPT framework.
 * This is the default human/agent entry point. It delegates to the structural SSOT
 * and production orchestrator instead of duplicating their logic.
 *
 * 12 commands: doctor, init, status, approve, style-master, validate, pilot,
 *              build, refresh, new-version, test, state
 *
 * Uses commander for CLI. Delegates to:
 *   - bundle_layout.mjs         — directory SSOT, init, check, create_version
 *   - unified_pipeline.mjs      — production orchestrator (subprocess)
 *   - generate_style_master.mjs — visual style anchor (subprocess)
 *   - env-check.mjs             — environment health check (subprocess)
 *   - lib/state.mjs             — state / gates (state command)
 *
 * Hard failures: JSON envelope on last non-empty stderr line (lib/cli_error.mjs).
 */

import "./lib/cli_bootstrap.mjs?entry=ppt_flow.mjs";

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync,
         rmSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  CLI_ERROR_CODES,
  CLI_JSON_REPORT_SCHEMAS,
  CLI_PROGRESS_ENV,
  CLI_TRANSACTION_SYMBOL,
  buildDelegatedDiagnostic,
  createChildOutputCollector,
  createCliNext,
  emitCliError,
  emitCliProgress,
  exitCliError,
  registerCliJsonReport,
  setCliOutputMode,
} from "./lib/cli_error.mjs";

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
import { resolveSlideIds, formatAvailableSlideIds } from "./lib/slide_ids.mjs";
import { isHeroVisualType } from "./lib/render_policy.mjs";

// ---------------------------------------------------------------------------
// Script paths for subprocess delegation
// ---------------------------------------------------------------------------

const UNIFIED_PIPELINE = join(REFERENCE_SCRIPTS_DIR, "unified_pipeline.mjs");
const GENERATE_STYLE_MASTER = join(REFERENCE_SCRIPTS_DIR, "generate_style_master.mjs");
const STAGE1_BUILD_INPUTS = join(REFERENCE_SCRIPTS_DIR, "stage1_build_inputs.mjs");
const STAGE3_LOCK_HEADERS = join(REFERENCE_SCRIPTS_DIR, "stage3_lock_headers.mjs");
const ENV_CHECK = join(FRAMEWORK_DIR, "scripts", "env-check.mjs");

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();

/** Emit FAILED envelope; caller still returns/exits the numeric code (D13). */
function emitFailed(where, message, hint = "Inspect the diagnostic evidence before retrying", diagnostic = undefined) {
  const childResult = runNode.lastChildResult;
  const inferred = diagnostic || (childResult ? buildDelegatedDiagnostic({
    invocation: childResult.invocation,
    childError: childResult.childError,
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    overflow: childResult.overflow,
    next: createCliNext("inspect", { default: "Inspect the retained child evidence and parent command context before retrying." }),
  }) : {
    version: 1,
    category: /(?:init|status|approve|new-version)/.test(where) ? "structure" : /doctor/.test(where) ? "environment" : "artifact",
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    next: createCliNext(/doctor/.test(where) ? "repair_environment" : "repair_prerequisite", {
      default: /doctor/.test(where) ? "Repair the named environment prerequisite, then rerun." : "Inspect and repair the named source or prerequisite, then rerun the command.",
    }),
  });
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message,
    hint,
    where,
    diagnostic: inferred,
  });
}

/** Emit USAGE envelope; return 1 for command* return paths. */
function emitUsage(where, message, hint) {
  emitCliError({
    code: CLI_ERROR_CODES.USAGE,
    message,
    hint,
    where,
    diagnostic: {
      version: 1,
      category: "usage",
      operation: where.split(".").at(-1).replaceAll("_", "-"),
      next: createCliNext("fix_arguments", {
        invocation: { program: "node", args: [__filename, "--help"] },
        default: "Correct the command arguments using --help, then rerun.",
      }),
    },
  });
  return 1;
}

function exitUsage(where, message, hint) {
  emitUsage(where, message, hint);
  process.exit(1);
}

function validateResolution(where, resolution) {
  if (["1k", "2k", "4k"].includes(resolution)) return;
  exitUsage(where, "Resolution must be 1k, 2k, or 4k.", "Pass --resolution 1k, 2k, or 4k");
}

function createGateDiagnostic({ operation, source, issues = [], action = "review", invocation, defaultText }) {
  return {
    version: 1,
    category: "gate",
    operation,
    ...(source ? { source: { path: source } } : {}),
    ...(issues.length ? { issues } : {}),
    next: createCliNext(action, {
      requiresHuman: true,
      ...(source ? { inspect: [{ path: source }] } : {}),
      ...(invocation ? { invocation } : {}),
      default: defaultText,
    }),
  };
}

/** After subprocess/command code: emit FAILED if non-zero, then exit. */
function exitWithCode(code, where, message, hint) {
  if (code !== 0) {
    const childResult = runNode.lastChildResult;
    emitFailed(
      where,
      message || `Delegated command exited ${code}`,
      hint || "Inspect the delegated diagnostic evidence before retrying",
      childResult ? buildDelegatedDiagnostic({
        invocation: childResult.invocation,
        childError: childResult.childError,
        operation: where.split(".").at(-1).replaceAll("_", "-"),
        overflow: childResult.overflow,
        next: createCliNext("inspect", {
          requiresHuman: false,
          default: "Inspect the retained child evidence and parent command context before retrying.",
        }),
      }) : undefined
    );
    runNode.lastChildResult = null;
  }
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Subprocess runners
// ---------------------------------------------------------------------------

/**
 * Spawn a registered Node.js child with transactional output capture.
 * @param {string} script - Absolute path to the .mjs script.
 * @param {string[]} args - CLI arguments.
 * @returns {Promise<number>} Exit code.
 */
function runNode(script, args = []) {
  const cmd = ["node", script, ...args].map(String);
  console.log("→ " + cmd.join(" "));
  return new Promise((resolve) => {
    const collector = createChildOutputCollector({
      registered: true,
      onProgress: (event, fields) => emitCliProgress(event, fields),
    });
    const child = spawn("node", [script, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, [CLI_PROGRESS_ENV]: "1" },
    });
    const transaction = globalThis[CLI_TRANSACTION_SYMBOL];
    if (transaction?.installed) transaction.activeChild = child;
    child.stdout.on("data", (chunk) => collector.pushStdout(chunk));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => collector.pushStderr(chunk));
    child.on("close", (rawCode) => {
      if (transaction?.activeChild === child) transaction.activeChild = null;
      const result = collector.finish(rawCode);
      if (result.code === 0 && !result.overflow) {
        runNode.lastChildResult = null;
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
      } else {
        runNode.lastChildResult = {
          ...result,
          invocation: { program: "node", args: [script, ...args] },
        };
      }
      resolve(result.overflow ? 1 : result.code);
    });
    child.on("error", () => {
      if (transaction?.activeChild === child) transaction.activeChild = null;
      runNode.lastChildResult = {
        childError: null,
        overflow: false,
        invocation: { program: "node", args: [script, ...args] },
      };
      resolve(1);
    });
  });
}
runNode.lastChildResult = null;

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
 * Attach playbook breakpoint + optional workflow_summary onto a status object.
 * @param {object} status
 * @param {string} runDir
 */
async function enrichStatusWithState(status, runDir) {
  const { readState, buildResumeCard } = await import("./lib/state.mjs");
  const root = deckRoot(runDir);
  const s = readState(root);
  if (s.corrupted) {
    status.playbook = "";
    status.current_node = "";
    status.state_corrupted = true;
    return status;
  }
  const card = buildResumeCard(s, {
    style_master: status.style_master,
    raw_images: status.raw_images,
    expected_slides: status.expected_slides,
    pptx: status.pptx,
    pilot_preview: status.pilot_preview,
    content_gate: status.content_gate,
    visual_gate: status.visual_gate,
  });
  status.playbook = card.playbook;
  status.current_node = card.current_node;
  status.workflow_summary = card.workflow_summary;
  status.suggested_next = card.suggested_next;
  return status;
}

/**
 * Build the real deterministic gate context used by controller-aware resume
 * cards. This deliberately reuses Stage 1 validation and the production
 * header-review validator instead of maintaining state-only approximations.
 */
export async function buildControllerGateContext(runDir) {
  const resolved = resolve(runDir);
  const specPath = findSlideSpecs(resolved);
  let slideSpecsValid = false;
  if (specPath) {
    try {
      const { validateSpecs } = await import("./stage1_build_inputs.mjs");
      slideSpecsValid = !validateSpecs([specPath]).some((problem) => problem.startsWith("ERROR:"));
    } catch {
      slideSpecsValid = false;
    }
  }

  let headerReviewCurrent = false;
  try {
    const { validateProductionHeaderReview } = await import("./unified_pipeline.mjs");
    headerReviewCurrent = (await validateProductionHeaderReview(resolved, {
      requireCurrentImages: true,
    })).ok;
  } catch {
    headerReviewCurrent = false;
  }

  return {
    deckDir: deckRoot(resolved),
    runDir: resolved,
    frameworkDir: FRAMEWORK_DIR,
    slideSpecsValid,
    headerReviewCurrent,
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
  if (status.playbook != null || status.current_node != null) {
    console.log(`  Playbook:      ${status.playbook || "(none)"}`);
    console.log(`  Current node:  ${status.current_node || "(none)"}`);
  }
  if (status.workflow_summary) {
    console.log(`  Summary:       ${status.workflow_summary}`);
  }
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

  if (!status.style_master) {
    nextSteps.push(
      `Generate style master: ppt_flow.mjs style-master ${rd}`
    );
  }
  if (status.style_master && !status.pilot_preview && status.pptx.length === 0) {
    nextSteps.push(
      `Preview sample pages (gates not required): ppt_flow.mjs pilot ${rd}`
    );
  }
  if (!["approved", "waived"].includes(status.content_gate)) {
    nextSteps.push(`After content review: ppt_flow.mjs approve ${rd} content`);
  }
  if (!["approved", "waived"].includes(status.visual_gate)) {
    nextSteps.push(`After visual review: ppt_flow.mjs approve ${rd} visual`);
  }
  if (
    ["approved", "waived"].includes(status.content_gate) &&
    ["approved", "waived"].includes(status.visual_gate) &&
    status.style_master
  ) {
    if (status.pptx.length === 0) {
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
 * Choose deterministic representatives while guaranteeing content full-page
 * coverage when those slides exist.
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

  const fullPageIndices = [];
  const contentFullPageIndices = [];
  const heroFullPageIndices = [];
  const bodyIndices = [];
  for (let i = 0; i < slides.length; i++) {
    const lc = slides[i].layout_contract || {};
    const fullPage = lc.render_mode === "full-page" || lc.header_variant === "image_direct";
    if (fullPage) {
      fullPageIndices.push(i);
      if (isHeroVisualType(slides[i].visual_type)) heroFullPageIndices.push(i);
      else contentFullPageIndices.push(i);
    } else {
      bodyIndices.push(i);
    }
  }

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

  const requiredContent = Math.min(count, contentFullPageIndices.length, count >= 2 ? 2 : 1);
  for (let i = 0; i < requiredContent; i++) add(contentFullPageIndices[i]);

  const midpoint = (slides.length - 1) / 2;
  const nearestToMidpoint = (indices) => [...indices].sort(
    (a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint) || a - b
  );

  // Representative fill order: first/last hero, midpoint body, remaining
  // content full-page, then stable deck positions.
  add(heroFullPageIndices[0]);
  add(heroFullPageIndices[heroFullPageIndices.length - 1]);
  add(nearestToMidpoint(bodyIndices)[0]);
  for (const idx of contentFullPageIndices) add(idx);
  for (const idx of fullPageIndices) add(idx);

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
 * @param {{smoke?: boolean, probeVendors?: boolean}} [opts]
 */
async function commandDoctor({ smoke = false, probeVendors = false } = {}) {
  const args = [];
  if (smoke) args.push("--smoke");
  if (probeVendors) args.push("--probe-vendors");
  return runNode(ENV_CHECK, args);
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
    return emitUsage(
      "ppt_flow.init",
      "Deck directory must start with 'deck_'.",
      "Pass a path whose basename starts with deck_, e.g. deck_mydeck"
    );
  }
  if (
    FRAMEWORK_DIR === resolved ||
    resolved.startsWith(FRAMEWORK_DIR + "/")
  ) {
    console.error("✗ A run bundle must live outside PPTMAKER_FRAMEWORK/.");
    return emitUsage(
      "ppt_flow.init",
      "A run bundle must live outside PPTMAKER_FRAMEWORK/.",
      "Create the deck directory next to (not inside) PPTMAKER_FRAMEWORK/"
    );
  }
  if (!(deckType in DECK_TYPE_TEMPLATES)) {
    const allowed = DECK_TYPES_SORTED().join(", ");
    console.error(`✗ Unknown deck-type: ${deckType}. Allowed: ${allowed}`);
    return emitUsage(
      "ppt_flow.init.deck-type",
      `Unknown deck-type: ${deckType}`,
      `Allowed: ${allowed}`
    );
  }
  if (!STYLE_PRESETS.includes(style)) {
    const allowed = STYLE_PRESETS_SORTED().join(", ");
    console.error(`✗ Unknown style: ${style}. Allowed: ${allowed}`);
    return emitUsage(
      "ppt_flow.init.style",
      `Unknown style: ${style}`,
      `Allowed: ${allowed}`
    );
  }

  let log;
  try {
    log = initBundle(resolved, FRAMEWORK_DIR, deckType, style);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed("ppt_flow.init", err.message, "Fix the reported init error and retry");
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
 * status — Show gates, artifacts, playbook breakpoint, and next action.
 * @param {string} runDir
 * @param {{json: boolean}} opts
 */
async function commandStatus(runDir, { json: asJson }) {
  const resolved = resolve(runDir);
  const status = collectStatus(resolved);
  await enrichStatusWithState(status, resolved);
  if (asJson) {
    registerCliJsonReport(status);
    console.log(JSON.stringify(status, null, 2));
  } else {
    printStatus(status);
  }
  if (status.structure_issues.length > 0) {
    emitFailed(
      "ppt_flow.status",
      `Bundle has ${status.structure_issues.length} structure issue(s)`,
      "Fix structure issues listed above, then re-run status"
    );
    return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Command: approve
// ---------------------------------------------------------------------------

/**
 * approve — Record a reviewed content/visual gate (metadata + _state dual-write).
 * @param {string} runDir
 * @param {string} gate - "content" or "visual".
 * @param {boolean} waive
 */
async function commandApprove(runDir, gate, { waive }) {
  const resolved = resolve(runDir);
  const issues = checkBundle(resolved, false);
  if (issues.length > 0) {
    const status = collectStatus(resolved);
    await enrichStatusWithState(status, resolved);
    printStatus(status);
    emitFailed(
      "ppt_flow.approve",
      `Cannot approve: ${issues.length} bundle issue(s)`,
      "Fix structure issues, then re-run approve"
    );
    return 1;
  }
  const value = waive ? "waived" : "approved";
  const root = deckRoot(resolved);
  const metadata = join(root, METADATA_FILE);
  updateGate(metadata, gate, value);

  const { readState, writeState, setGate, appendHistory } = await import(
    "./lib/state.mjs"
  );
  const s = readState(root);
  if (!s.corrupted) {
    setGate(s, gate, value);
    writeState(root, s);
    try {
      appendHistory(root, {
        type: "gate_set",
        gate,
        value,
        source: "ppt_flow.approve",
      });
    } catch {
      /* history is optional */
    }
  }

  console.log(`✓ ${gate}_gate: ${value} (${metadata})`);
  console.log(`✓ _state.gates.${gate}: ${value}`);
  return 0;
}

async function commandApproveHeader(runDir, {
  waive = false,
  only: onlyStr = null,
  reason = null,
} = {}) {
  const resolved = resolve(runDir);
  const issues = checkBundle(resolved, false);
  if (issues.length > 0) {
    emitFailed("ppt_flow.approve.header", `Cannot approve: ${issues.length} bundle issue(s)`, "Fix structure issues, then re-run approve header");
    return 1;
  }
  if (waive && (!onlyStr || !String(reason || "").trim())) {
    return emitUsage(
      "ppt_flow.approve.header",
      "approve header --waive requires --only and --reason",
      "Pass --waive --only slide_id[,slide_id] --reason \"accepted symptom\""
    );
  }

  let code = await runNode(UNIFIED_PIPELINE, ["--run-dir", resolved, "--stage", "1"]);
  if (code !== 0) {
    emitFailed("ppt_flow.approve.header", `Stage 1 exited ${code}`, "Fix current source/config errors, then re-run approve header");
    return 1;
  }

  const genDir = generatedDir(resolved);
  const plan = JSON.parse(readFileSync(join(genDir, GEN_SLIDE_PLAN), "utf-8")).slides || [];
  let selectedIds;
  if (waive) {
    try {
      selectedIds = resolveSlideIds(
        onlyStr.split(",").map((id) => id.trim()).filter(Boolean),
        plan
      );
    } catch (err) {
      return emitUsage("ppt_flow.approve.header", err.message, `Available ids: ${formatAvailableSlideIds(plan)}`);
    }
  } else {
    const pilotPlanPath = join(genDir, GEN_QA_SUBDIR, "pilot_slide_plan.json");
    const pilotContactSheet = join(genDir, GEN_PREVIEW_SUBDIR, "pilot_final_contact_sheet.jpg");
    if (!existsSync(pilotPlanPath)) {
      emitFailed(
        "ppt_flow.approve.header",
        "current pilot_slide_plan.json is missing",
        `Run ppt_flow pilot ${resolved} --force-images, review it, then approve header`
      );
      return 1;
    }
    if (!existsSync(pilotContactSheet)) {
      emitFailed(
        "ppt_flow.approve.header",
        "current pilot final contact sheet is missing",
        `Run ppt_flow pilot ${resolved} --force-images, review it, then approve header`
      );
      return 1;
    }
    selectedIds = (JSON.parse(readFileSync(pilotPlanPath, "utf-8")).slides || [])
      .map((slide) => String(slide.id || "").trim())
      .filter(Boolean);
  }

  const selectedCurrentFullPageIds = selectedIds.filter((id) =>
    plan.some((slide) => slide.id === id && slide.layout_contract?.render_mode === "full-page")
  );

  try {
    const prompts = JSON.parse(readFileSync(
      join(genDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON),
      "utf-8"
    )).slides || [];
    const { loadVisualConfig, DEFAULT_CONFIG } = await import("./visual_config.mjs");
    const palettePath = styleAsset(resolved, COLOR_PALETTE_FILE);
    const visualConfig = existsSync(palettePath) ? loadVisualConfig(palettePath) : DEFAULT_CONFIG;
    const {
      buildHeaderReviewInputs,
      collectPilotProvenance,
      HEADER_REVIEW_NODE,
      mergeHeaderReviewRecord,
      versionKey,
    } = await import("./lib/header_review.mjs");
    const inputs = buildHeaderReviewInputs(plan, visualConfig);
    const root = deckRoot(resolved);
    const { readState, writeState, appendHistory } = await import("./lib/state.mjs");
    const state = readState(root);
    if (state.corrupted) throw new Error("state is corrupted");
    const key = versionKey(root, resolved);
    const previousRecord = state.nodes?.[HEADER_REVIEW_NODE]?.by_version?.[key] || null;
    const { changedFullPageIds } = await import("./lib/header_review.mjs");
    const changedIds = previousRecord?.slides
      ? changedFullPageIds({}, {}, previousRecord.slides)  // per-slide state
      : previousRecord?.full_page_header_snapshot
        ? changedFullPageIds(previousRecord.full_page_header_snapshot, inputs.fullPageHeaderSnapshot)  // old format fallback
        : [];
    const selectedReviewIds = selectedIds.filter((id) =>
      selectedCurrentFullPageIds.includes(id) || changedIds.includes(id)
    );
    if (selectedReviewIds.length === 0) {
      throw new Error("selected pilot has no current or changed full-page slides to approve");
    }
    const provenance = collectPilotProvenance({
      selectedIds: selectedReviewIds,
      prompts,
      imagesDir: join(genDir, GEN_IMAGES_SUBDIR),
      currentStyleReferenceSha256: (await import("./lib/image_provenance.mjs")).sha256File(
        styleAsset(resolved, STYLE_MASTER_IMAGE)
      ),
    });
    if (!state.nodes) state.nodes = {};
    if (!state.nodes[HEADER_REVIEW_NODE]) {
      state.nodes[HEADER_REVIEW_NODE] = { by_version: {} };
    }
    const node = state.nodes[HEADER_REVIEW_NODE];
    if (!node.by_version || typeof node.by_version !== "object") node.by_version = {};
    const acceptedRisks = waive
      ? Object.fromEntries(selectedReviewIds.map((id) => [id, { reason: reason.trim(), accepted_at: new Date().toISOString() }]))
      : {};
    const record = mergeHeaderReviewRecord({
      previousRecord,
      inputs,
      reviewedIds: waive ? [] : selectedReviewIds,
      provenanceEntries: provenance.entries,
      profile: provenance.profile,
      acceptedRisks,
    });
    node.by_version[key] = record;
    writeState(root, state);
    try {
      appendHistory(root, {
        type: waive ? "header_risk_accepted" : "header_review_approved",
        version: key,
        ids: selectedReviewIds,
        fingerprint: inputs.headerReviewFingerprint,
        status: "completed",
        reason: waive ? reason.trim() : undefined,
      });
    } catch {
      /* history is optional */
    }
    const slideStatuses = Object.entries(record.slides || {}).map(([id, s]) => `${id}:${s.status}`).join(", ");
    console.log(`✓ header review ${key}: ${slideStatuses || "no slides"}`);
    return 0;
  } catch (err) {
    emitFailed(
      "ppt_flow.approve.header",
      err.message,
      `Run ppt_flow pilot ${resolved} --only ${selectedIds.join(",")} --force-images, review it, then approve header`
    );
    return 1;
  }
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
  { resolution, model, baseUrl = [], force, dryRun, noDeckSystem = false }
) {
  const resolved = resolve(runDir);
  const args = ["--run-dir", resolved, "--resolution", resolution];

  if (model) args.push("--model", model);
  for (const url of baseUrl) args.push("--base-url", url);
  if (force) args.push("--force");
  if (noDeckSystem) args.push("--no-deck-system");
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
    emitFailed(
      "ppt_flow.validate",
      `Cannot validate: ${issues.length} bundle issue(s)`,
      "Fix structure issues, then re-run validate"
    );
    return 1;
  }
  const specs = findSlideSpecs(resolved);
  if (!specs) {
    console.error(`✗ No ${SLIDE_SPECS_GLOB} found in ${resolved}`);
    emitFailed(
      "ppt_flow.validate",
      `No ${SLIDE_SPECS_GLOB} found in ${resolved}`,
      "Add slide-specifications.md under the version directory"
    );
    return 1;
  }
  const code = await runNode(STAGE1_BUILD_INPUTS, [
    "--validate",
    "--input",
    specs,
  ]);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.validate",
      `validate exited ${code}`,
      "Fix slide-spec validation errors, then re-run validate"
    );
  }
  return code;
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
 * @param {{only: string|null, count: number, resolution: string, model: string, baseUrl: string|null, dryRun: boolean, forceImages?: boolean}} opts
 */
async function commandPilot(
  runDir,
  { only: onlyStr, count, resolution, model, baseUrl, dryRun, forceImages = false }
) {
  const resolved = resolve(runDir);

  if (count < 1) {
    console.error("✗ --count must be at least 1.");
    return emitUsage(
      "ppt_flow.pilot.count",
      "--count must be at least 1",
      "Pass --count N with N >= 1"
    );
  }

  // Validate structure (not requiring pipeline readiness yet)
  const preIssues = checkBundle(resolved, false);
  if (preIssues.length > 0) {
    console.error(
      `✗ Bundle does NOT conform — ${preIssues.length} violation(s):`
    );
    for (const v of preIssues) console.error(`  - ${v}`);
    emitFailed(
      "ppt_flow.pilot",
      `Bundle does not conform — ${preIssues.length} violation(s)`,
      "Fix structure violations, then re-run pilot"
    );
    return 1;
  }

  // Load .env so API credentials are available for Stage 2
  const dkRoot = deckRoot(resolved);
  loadDotenv(...buildEnvSearchDirs(dkRoot));

  // --- Stage 1: Build slide plan ---
  const stage1Args = ["--run-dir", resolved, "--stage", "1"];
  if (dryRun) stage1Args.push("--dry-run");
  let code = await runNode(UNIFIED_PIPELINE, stage1Args);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.pilot",
      `Stage 1 exited ${code}`,
      "Fix Stage 1 errors, then re-run pilot"
    );
    return 1;
  }

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
    const tokens = onlyStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      selectedIds = resolveSlideIds(tokens, plan);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      return emitUsage(
        "ppt_flow.pilot.only",
        err.message,
        `Available ids: ${formatAvailableSlideIds(plan)}`
      );
    }
  } else {
    selectedIds = selectPilotSlideIds(plan, count);
  }

  console.log(`Pilot slides: ${selectedIds.join(", ")}`);

  // Preview readiness: style master required; metadata gates NOT required
  const readyIssues = checkBundle(resolved, "preview");
  if (readyIssues.length > 0) {
    console.error(
      `✗ Bundle NOT preview-ready — ${readyIssues.length} issue(s):`
    );
    for (const v of readyIssues) console.error(`  - ${v}`);
    emitFailed(
      "ppt_flow.pilot",
      `Bundle not preview-ready — ${readyIssues.length} issue(s)`,
      "Generate style_master.jpg, then re-run pilot (gates need not be approved)"
    );
    return 1;
  }

  // --- Stage 2: Generate images for pilot subset (preview readiness) ---
  const stage2Args = [
    "--run-dir",
    resolved,
    "--stage",
    "2",
    "--only",
    selectedIds.join(","),
    "--preview",
    "--resolution",
    resolution,
    "--model",
    model,
  ];
  if (forceImages) stage2Args.push("--force-images");
  if (baseUrl) stage2Args.push("--base-url", baseUrl);
  if (dryRun) stage2Args.push("--dry-run");
  code = await runNode(UNIFIED_PIPELINE, stage2Args);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.pilot",
      `Stage 2 exited ${code}`,
      "Fix Stage 2 / image generation errors, then re-run pilot"
    );
    return 1;
  }

  // --- Render pilot headers (Stage 3 + contact sheet on pilot subset) ---
  const ok = await renderPilotHeaders(resolved, selectedIds, dryRun);
  if (!ok) {
    emitFailed(
      "ppt_flow.pilot",
      "Pilot QA rendering failed",
      "Fix Stage 3 / contact sheet errors, then re-run pilot"
    );
    return 1;
  }

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
 * @param {{resolution: string, model: string, baseUrl: string|null, reuseImages: boolean, dryRun: boolean}} opts
 */
async function commandBuild(
  runDir,
  { resolution, model, baseUrl, reuseImages, dryRun }
) {
  const resolved = resolve(runDir);
  if (!dryRun) {
    const stage1Code = await runNode(UNIFIED_PIPELINE, [
      "--run-dir", resolved, "--stage", "1",
    ]);
    if (stage1Code !== 0) {
      emitFailed("ppt_flow.build", `Stage 1 exited ${stage1Code}`, "Fix current source/config errors, then rerun build");
      return 1;
    }
    const { validateProductionHeaderReview } = await import("./unified_pipeline.mjs");
    const review = await validateProductionHeaderReview(resolved, {
      resolution,
      model,
      forceImages: !reuseImages,
    });
    if (!review.ok) {
      emitCliError({
        code: CLI_ERROR_CODES.GATE_BLOCKED,
        message: review.hint || "header review required",
        hint: review.action || "run pilot to review header changes",
        where: "ppt_flow.build.header-review",
        diagnostic: createGateDiagnostic({
          operation: "header-review",
          source: resolved,
          issues: (review.changed || []).map((change) => ({ message: "slide header review evidence is stale or missing", subject: { kind: "slide", id: change.id }, reason: { kind: "review_required" } })),
          invocation: { program: "node", args: [__filename, "pilot", resolved, "--resolution", resolution] },
          defaultText: "Stop for current header review or explicit risk acceptance before building the final deck.",
        }),
      });
      return 1;
    }
  }
  const args = [
    "--run-dir",
    resolved,
    "--stage",
    "all",
    "--resolution",
    resolution,
    "--model",
    model,
  ];

  if (!reuseImages) args.push("--force-images");
  if (baseUrl) args.push("--base-url", baseUrl);
  if (dryRun) args.push("--dry-run");

  const code = await runNode(UNIFIED_PIPELINE, args);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.build",
      `build exited ${code}`,
      "Fix pipeline errors, then re-run build"
    );
  }
  return code;
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
  /** @type {string|null} */
  let resolvedOnly = onlyStr;

  if (kind === "title") {
    if (onlyStr && allSlides) {
      return emitUsage(
        "ppt_flow.refresh",
        "--only and --all are mutually exclusive",
        "Pass one title selector: --only <ids> or --all"
      );
    }
    const stage1Args = ["--run-dir", resolved, "--stage", "1"];
    if (dryRun) stage1Args.push("--dry-run");
    const stage1Code = await runNode(UNIFIED_PIPELINE, stage1Args);
    if (stage1Code !== 0) {
      emitFailed("ppt_flow.refresh.title", `Stage 1 exited ${stage1Code}`, "Fix current source/config errors, then rerun title refresh");
      return stage1Code;
    }
    const planPath = join(generatedDir(resolved), GEN_SLIDE_PLAN);
    if (dryRun && !existsSync(planPath)) {
      console.log("  [DRY RUN] Title routing will resolve after Stage 1 creates slide_plan.json.");
      return 0;
    }
    const plan = JSON.parse(readFileSync(planPath, "utf-8")).slides || [];
    let affected;
    if (onlyStr) {
      try {
        affected = resolveSlideIds(
          onlyStr.split(",").map((id) => id.trim()).filter(Boolean),
          plan
        );
      } catch (err) {
        return emitUsage("ppt_flow.refresh.title", err.message, `Available ids: ${formatAvailableSlideIds(plan)}`);
      }
    } else if (allSlides) {
      affected = plan.map((slide) => slide.id);
    } else {
      const fullPageIds = plan
        .filter((slide) => slide.layout_contract?.render_mode === "full-page")
        .map((slide) => slide.id);
      if (fullPageIds.length > 0) {
        return emitUsage(
          "ppt_flow.refresh.title",
          "mixed/full-page title refresh requires --only or --all",
          `Pass --only <affected-ids> or --all; full-page ids: ${fullPageIds.join(",")}`
        );
      }
      affected = plan.map((slide) => slide.id);
    }
    const fullPageAffected = affected.filter((id) =>
      plan.some((slide) => slide.id === id && slide.layout_contract?.render_mode === "full-page")
    );
    if (fullPageAffected.length > 0) {
      const { validateProductionHeaderReview } = await import("./unified_pipeline.mjs");
      const review = await validateProductionHeaderReview(resolved, { onlyIds: fullPageAffected });
      if (!review.ok) {
        emitCliError({
          code: CLI_ERROR_CODES.TITLE_REVIEW_REQUIRED,
          message: review.hint || `full-page title review required for: ${fullPageAffected.join(", ")}`,
          hint: review.action || `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot ${resolved} --only ${fullPageAffected.join(",")}`,
          where: "ppt_flow.refresh.title",
          diagnostic: createGateDiagnostic({
            operation: "title-header-review",
            source: resolved,
            issues: fullPageAffected.map((id) => ({ message: "full-page title change requires current image review", subject: { kind: "slide", id }, reason: { kind: "review_required" } })),
            invocation: { program: "node", args: [__filename, "pilot", resolved, "--only", fullPageAffected.join(","), "--force-images"] },
            defaultText: "Stop for current review of the affected full-page title images before continuing.",
          }),
        });
        return 1;
      }
    }
    stages = "3,4,5";
    resolvedOnly = null;
  } else if (kind === "notes") {
    if (onlyStr || allSlides) {
      console.error("✗ --only/--all apply only to --kind visual.");
      return emitUsage(
        "ppt_flow.refresh",
        "--only/--all apply only to --kind visual",
        "Omit --only/--all for title/notes, or use --kind visual"
      );
    }
    stages = "5";
  } else {
    // kind === "visual"
    if (!onlyStr && !allSlides) {
      console.error(
        "✗ Visual refresh needs --only slide_id[,slide_id] or explicit --all."
      );
      return emitUsage(
        "ppt_flow.refresh",
        "Visual refresh needs --only or --all",
        "Pass --only slide_id[,slide_id] or explicit --all"
      );
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
  if (resolvedOnly) args.push("--only", resolvedOnly);
  if (kind === "visual" && (resolvedOnly || allSlides)) args.push("--force-images");
  if (baseUrl) args.push("--base-url", baseUrl);
  if (dryRun) args.push("--dry-run");

  const code = await runNode(UNIFIED_PIPELINE, args);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.refresh",
      `refresh exited ${code}`,
      "Fix pipeline errors, then re-run refresh"
    );
  }
  return code;
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
    emitFailed(
      "ppt_flow.new-version",
      err.message,
      "Fix the reported error and retry new-version"
    );
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
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    env: process.env,
    cwd: resolve(FRAMEWORK_DIR, ".."),
  });
  const collector = createChildOutputCollector({ registered: false });
  collector.pushStdout(result.stdout || "");
  collector.pushStderr(result.stderr || "");
  const captured = collector.finish(result.status !== null ? result.status : 1);
  const code = captured.overflow ? 1 : captured.code;
  runNode.lastChildResult = {
    ...captured,
    invocation: { program: "npm", args: ["test"] },
  };
  if (code === 0) {
    if (captured.stdout) process.stdout.write(captured.stdout);
    if (captured.stderr) process.stderr.write(captured.stderr);
  }
  if (code !== 0) {
    emitFailed(
      "ppt_flow.test",
      `npm test exited ${code}`,
      "Inspect the failing test suite, fix the source, then rerun ppt_flow test",
      buildDelegatedDiagnostic({
        invocation: { program: "npm", args: ["test"] },
        overflow: captured.overflow,
        operation: "test",
        next: createCliNext("edit_source", {
          default: "Inspect the test failures in a direct test run, fix source code or tests, then rerun.",
          invocation: { program: "npm", args: ["test"] },
        }),
      })
    );
  }
  return code;
}

async function commandStyleMasterWrapped(
  runDir,
  opts
) {
  const code = await commandStyleMaster(runDir, opts);
  if (code !== 0) {
    emitFailed(
      "ppt_flow.style-master",
      `style-master exited ${code}`,
      "Fix style-master / API errors, then retry"
    );
  }
  return code;
}

async function commandBuildWrapped(runDir, opts) {
  return commandBuild(runDir, opts);
}

// ---------------------------------------------------------------------------
// CLI — commander setup
// ---------------------------------------------------------------------------

async function main() {
  const program = new Command();
  program.exitOverride();

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
  ppt_flow.mjs state deck_mydeck/3_versions/v1 --check-gates
`
    );

  // ---- doctor ----
  program
    .command("doctor")
    .description("Check Node.js, npm, deps, in-framework Stage 2, and credentials")
    .option("--smoke", "Live Image2 probe of first vendor (image ref or task_id)")
    .option(
      "--probe-vendors",
      "Live probe every IMAGE2 vendor; print channel report (not --smoke)"
    )
    .action(async (opts) => {
      if (opts.smoke && opts.probeVendors) {
        exitUsage(
          "ppt_flow.doctor",
          "--smoke and --probe-vendors are mutually exclusive.",
          "Use --smoke for the first-vendor gate or --probe-vendors for the full channel report"
        );
      }
      const code = await commandDoctor({
        smoke: opts.smoke ?? false,
        probeVendors: opts.probeVendors ?? false,
      });
      exitWithCode(
        code,
        "ppt_flow.doctor",
        `doctor exited ${code}`,
        "Fix env / Image2 channel issues reported by env-check, then re-run doctor"
      );
    });

  // ---- init ----
  program
    .command("init")
    .description("Create a conformant run bundle")
    .argument("<deck_dir>", "Target deck directory (must start with deck_)")
    .requiredOption(
      "--deck-type <type>",
      `Deck type: ${DECK_TYPES_SORTED().join(", ")}`
    )
    .requiredOption(
      "--style <style>",
      `Style preset: ${STYLE_PRESETS_SORTED().join(", ")}`
    )
    .action(async (deckDir, opts) => {
      const code = commandInit(deckDir, {
        deckType: opts.deckType,
        style: opts.style,
      });
      process.exit(code);
    });

  // ---- status ----
  program
    .command("status")
    .description("Show gates, artifacts, playbook breakpoint, and next action")
    .argument(
      "<run_dir>",
      "Path to version dir (e.g., deck_xxx/3_versions/v1)"
    )
    .option("--json", "Output machine-readable JSON")
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const code = await commandStatus(runDir, { json: opts.json ?? false });
      process.exit(code);
    });

  // ---- approve ----
  program
    .command("approve")
    .description("Record a reviewed content, visual, or header gate")
    .argument("<run_dir>", "Path to version dir")
    .argument("<gate>", "Gate to approve: content, visual, or header")
    .option("--waive", "Record an explicit user decision to skip this gate")
    .option("--only <ids>", "For header risk acceptance: comma-separated slide IDs")
    .option("--reason <text>", "For header risk acceptance: persisted symptom/reason")
    .action(async (runDir, gate, opts) => {
      if (!["content", "visual", "header"].includes(gate)) {
        exitUsage("ppt_flow.approve.gate", 'gate must be "content", "visual", or "header".', 'Pass "content", "visual", or "header" as the gate argument');
      }
      const code = gate === "header"
        ? await commandApproveHeader(runDir, {
            waive: opts.waive ?? false,
            only: opts.only || null,
            reason: opts.reason || null,
          })
        : await commandApprove(runDir, gate, { waive: opts.waive ?? false });
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
    .option("--no-deck-system", "Do not append deck_system.txt constraints")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      validateResolution("ppt_flow.style-master.resolution", opts.resolution);
      const code = await commandStyleMasterWrapped(runDir, {
        resolution: opts.resolution,
        model: opts.model,
        baseUrl: opts.baseUrl || [],
        force: opts.force ?? false,
        dryRun: opts.dryRun ?? false,
        noDeckSystem: opts.noDeckSystem ?? false,
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
    .option("--only <ids>", "Optional comma-separated slide IDs (or page nums / s03)")
    .option(
      "--count <n>",
      "Number of pilot slides to auto-select",
      (v) => parseInt(v, 10),
      3
    )
    .option("--resolution <res>", "Image resolution for pilot", "1k")
    .option("--model <name>", "Image model for pilot", "gpt-image-2")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--force-images", "Regenerate pilot images even if files exist")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      validateResolution("ppt_flow.pilot.resolution", opts.resolution);
      const code = await commandPilot(runDir, {
        only: opts.only || null,
        count: opts.count ?? 3,
        resolution: opts.resolution,
        model: opts.model,
        baseUrl: opts.baseUrl || null,
        dryRun: opts.dryRun ?? false,
        forceImages: opts.forceImages ?? false,
      });
      process.exit(code);
    });

  // ---- build ----
  program
    .command("build")
    .description("Build the complete final deck")
    .argument("<run_dir>", "Path to version dir")
    .option("--resolution <res>", "Final image resolution", "2k")
    .option("--model <name>", "Final image model", "gpt-image-2")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option(
      "--reuse-images",
      "Reuse existing Stage-2 images instead of refreshing at final resolution"
    )
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      validateResolution("ppt_flow.build.resolution", opts.resolution);
      const code = await commandBuildWrapped(runDir, {
        resolution: opts.resolution,
        model: opts.model,
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
    .option("--only <ids>", "For title/visual: comma-separated slide IDs")
    .option("--all", "For title/visual: explicitly select all pages")
    .option("--resolution <res>", "Image resolution", "2k")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      if (!["title", "visual", "notes"].includes(opts.kind)) {
        exitUsage("ppt_flow.refresh.kind", "--kind must be title, visual, or notes.", "Pass --kind title, visual, or notes");
      }
      validateResolution("ppt_flow.refresh.resolution", opts.resolution);
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

  // ---- state ----
  program
    .command("state")
    .description("Show playbook state / check gates")
    .argument("<runDir>", "Path to version directory")
    .option("--json", "JSON output")
    .option("--check-gates", "Verify gates for Stage 2 readiness")
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const {
        readState,
        isGateApproved,
        buildResumeCard,
      } = await import("./lib/state.mjs");
      const resolved = resolve(runDir);
      const deckDir = deckRoot(resolved);
      const s = readState(deckDir);
      if (s.corrupted) {
        console.error("State corrupted:", s.errors);
        if (opts.json) registerCliJsonReport(
          { corrupted: true, error_count: Array.isArray(s.errors) ? s.errors.length : 0 },
          { schema: CLI_JSON_REPORT_SCHEMAS.STATE_FAILURE }
        );
        exitCliError(
          {
            code: CLI_ERROR_CODES.STATE_CORRUPTED,
            message: "State data is corrupted and could not be healed deterministically.",
            hint: "Inspect or recreate the state source before resuming the workflow.",
            where: "ppt_flow.state",
            diagnostic: {
              version: 1,
              category: "artifact",
              operation: "read-state",
              source: { path: join(deckDir, "_state", "state.yaml") },
              reason: { kind: "state_corrupted" },
              next: createCliNext("repair_prerequisite", {
                inspect: [{ path: join(deckDir, "_state", "state.yaml") }],
                default: "Repair a healable state file or explicitly recreate state before continuing.",
              }),
            },
          },
          2
        );
      }
      const healed = !!s._healed;
      if (healed) delete s._healed;
      if (opts.checkGates) {
        const c = isGateApproved(s, "content");
        const v = isGateApproved(s, "visual");
        if (c && v) {
          console.log("Gates OK");
          process.exit(0);
        }
        const pending = [];
        if (!c) pending.push("content");
        if (!v) pending.push("visual");
        console.log("Gates BLOCKED:" + (c ? "" : " content") + (v ? "" : " visual"));
        exitCliError(
          {
            code: CLI_ERROR_CODES.GATE_BLOCKED,
            message: `Gates blocked: ${pending.join(", ")}`,
            hint: `Pending gate(s): ${pending.join(", ")}. Run approve for each, or --waive if intentional.`,
            where: "ppt_flow.state.check-gates",
            diagnostic: createGateDiagnostic({
              operation: "check-gates",
              source: join(deckDir, "project-metadata.yaml"),
              issues: pending.map((gate) => ({ message: "production gate is pending", subject: { kind: "gate", id: gate }, reason: { kind: "approval_required" } })),
              defaultText: "Stop for explicit content and visual gate decisions before Stage 2 production.",
            }),
          },
          1
        );
      }

      let statusSnapshot = null;
      try {
        const st = collectStatus(resolved);
        statusSnapshot = {
          style_master: st.style_master,
          raw_images: st.raw_images,
          expected_slides: st.expected_slides,
          pptx: st.pptx,
          pilot_preview: st.pilot_preview,
          content_gate: st.content_gate,
          visual_gate: st.visual_gate,
        };
      } catch {
        statusSnapshot = null;
      }
      const { buildPlaybookIndex } = await import("./lib/md_controller_reader.mjs");
      const controllerIndex = buildPlaybookIndex(join(FRAMEWORK_DIR, "playbook"));
      const controllerCtx = await buildControllerGateContext(resolved);
      const indexedCard = buildResumeCard(s, statusSnapshot, {
        index: controllerIndex,
        ctx: controllerCtx,
      });

      if (opts.json) {
        if (healed) s.healed = true;
        const report = {
          ...s,
          node_status: indexedCard.node_status,
          waiting_for: indexedCard.waiting_for,
          note: indexedCard.note,
          completed_nodes: indexedCard.completed_nodes,
          pending_nodes: indexedCard.pending_nodes,
          eligible_candidates: indexedCard.eligible_candidates,
          workflow_summary: indexedCard.workflow_summary,
          suggested_next: indexedCard.suggested_next,
        };
        registerCliJsonReport(report);
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      if (healed) console.log("Note:     state.yaml was auto-tidied (heal)");
      console.log("Playbook: " + (indexedCard.playbook || "(none)"));
      console.log("Current:  " + (indexedCard.current_node || "(none)"));
      console.log("Status:   " + (indexedCard.node_status || "(none)"));
      if (indexedCard.waiting_for) console.log("Waiting:  " + indexedCard.waiting_for);
      if (indexedCard.note) console.log("Note:     " + indexedCard.note);
      console.log("Done:     " + indexedCard.completed_nodes.join(", "));
      console.log("Pending:  " + indexedCard.pending_nodes.join(", "));
      if (indexedCard.eligible_candidates.length > 1) {
        console.log("Eligible: " + indexedCard.eligible_candidates.join(", "));
      }
      console.log(
        "Gates:    content=" +
          (s.gates?.content || "pending") +
          " visual=" +
          (s.gates?.visual || "pending")
      );
      console.log("Summary:  " + indexedCard.workflow_summary);
      console.log("Next:     " + indexedCard.suggested_next);
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (
      err?.code === "commander.helpDisplayed" ||
      err?.code === "commander.versionDisplayed"
    ) {
      process.exit(0);
    }
    console.error("✗ Command arguments are invalid.");
    exitCliError(
      {
        code: CLI_ERROR_CODES.USAGE,
        message: "Command arguments are invalid.",
        hint: "Run with --help for usage",
        where: "ppt_flow.main",
        diagnostic: { version: 1, category: "usage", operation: "parse-command", next: createCliNext("fix_arguments", { invocation: { program: "node", args: [__filename, "--help"] }, default: "Inspect --help, correct the command arguments, then rerun." }) },
      },
      typeof err?.exitCode === "number" && err.exitCode !== 0 ? err.exitCode : 1
    );
  }
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
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "ppt_flow.main" });
  main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    exitCliError(
      {
        code: CLI_ERROR_CODES.UNCAUGHT,
        message: "ppt_flow failed unexpectedly.",
        hint: "Inspect the command location and report the framework failure.",
        where: "ppt_flow.main",
        diagnostic: { version: 1, category: "internal", operation: "run-command", next: createCliNext("report_internal", { default: "Inspect ppt_flow.mjs without relying on captured exception prose, then report the defect." }) },
      },
      1
    );
  });
}
