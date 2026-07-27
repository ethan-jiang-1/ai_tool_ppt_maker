#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script
 *
 * Friendly command surface for the PPT framework.
 * This is the default human/agent entry point. It delegates to the structural SSOT
 * and production orchestrator instead of duplicating their logic.
 *
 * 14 commands: doctor, init, status, approve, style-master, validate, pilot,
 *              build, refresh, slides, new-version, test, state, image2
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

import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs";

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync,
         rmSync, renameSync, realpathSync } from "node:fs";
import { join, resolve, basename, dirname, relative, sep } from "node:path";
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
} from "./shared/cli/cli_error.mjs";

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
  LESSONS_DIR,
  // visual-style
  STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE,
  BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE,
  // version
  SLIDE_SPECS_NAME, SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR,
  // _generated
  GEN_SLIDE_PLAN, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON,
  GEN_IMAGES_SUBDIR, GEN_HEADER_LOCKED_SUBDIR,
  GEN_PPT_SUBDIR, GEN_QA_SUBDIR, GEN_PREVIEW_SUBDIR,
  // resolvers
  deckRoot, backboneDir, styleAsset, styleDir, assetsDir, generatedDir,
  findSlideSpecs, deckName, isVersionDir, loadDotenv,
  // catalogues
  DECK_TYPE_TEMPLATES, STYLE_PRESETS,
  // init / check / create
  initBundle, checkBundle, createVersion, nextVersionName, publishStructuralVersion, DEFAULT_INIT_MODE,
  PRODUCTION_MODES, productionPolicyForMode,
} from "./shared/run-bundle/bundle_layout.mjs";
const directRootEntry = process.argv[1] ? resolve(process.argv[1]) === __filename : false;
const rootCommand = directRootEntry ? process.argv[2] : null;
const contentApi = !directRootEntry || !["doctor", "--help", "-h", undefined].includes(rootCommand)
  ? await import("./01-content/index.mjs")
  : Object.create(null);
const {
  applySlideEdit,
  computeSlideEditPlanSha256,
  formatAvailableSlideIds,
  formatSlideCandidate,
  isHeroVisualType,
  parseSlideDocument,
  planSlideEdit,
  resolveSlideBindings,
  resolveSlideIds,
  validateSlideDocument,
  verifySlideEditPlanHash,
} = contentApi;
import { HTML_FIRST_PIPELINE, PAGE_AUTHORITY_IMAGE2_PIPELINE, WHOLE_PAGE_IMAGE2_PIPELINE, probeProductionMarker } from "./shared/run-bundle/production_marker.mjs";

// ---------------------------------------------------------------------------
// Script paths for subprocess delegation
// ---------------------------------------------------------------------------

const UNIFIED_PIPELINE = join(REFERENCE_SCRIPTS_DIR, "03-html-production", "unified_pipeline.mjs");
const GENERATE_STYLE_MASTER = join(REFERENCE_SCRIPTS_DIR, "04-image-production", "whole-page", "generate_style_master.mjs");
const STAGE1_BUILD_INPUTS = join(REFERENCE_SCRIPTS_DIR, "03-html-production", "stage1_build_inputs.mjs");
const STAGE3_LOCK_HEADERS = join(REFERENCE_SCRIPTS_DIR, "04-image-production", "whole-page", "stage3_lock_headers.mjs");
const ENV_CHECK = join(FRAMEWORK_DIR, "scripts", "00-setup", "env-check.mjs");

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();
const MIGRATION_PLAN_SHA_RE = /^[0-9a-f]{64}$/;

/** Emit FAILED envelope; caller still returns/exits the numeric code (D13). */
function emitFailed(where, message, hint = "Inspect the diagnostic evidence before retrying", diagnostic = undefined) {
  const childResult = runNode.lastChildResult;
  const historicalReplacement = /\breplacement_required\b/.test(String(message || ""));
  const inferred = diagnostic || (historicalReplacement ? {
    version: 1,
    category: "artifact",
    operation: where.split(".").at(-1).replaceAll("_", "-"),
    reason: { kind: "replacement_required" },
    next: createCliNext("repair_prerequisite", {
      default: "Preserve the existing bytes and run fresh explicit ppt_flow init; fresh authoring carries no old state, receipt, approval, provider authority, generated artifact, or execution evidence.",
    }),
  } : childResult ? buildDelegatedDiagnostic({
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

function hasExplicitCliOption(option) {
  return process.argv.some((argument) => argument === option || argument.startsWith(`${option}=`));
}

/**
 * Resolve one exact run to its only permitted production adapter before a
 * command reads generated output, checks readiness, or initializes a provider.
 * Every supported run has an explicit source marker and a durable mode record.
 */
function preflightAdapterSource(resolved, where) {
  const canonicalSource = join(resolved, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(resolved);
  if (!source) return false;

  const sourceLocator = relative(deckRoot(resolved), source).split(sep).join("/");
  const marker = probeProductionMarker(readFileSync(source), { source: basename(source) });
  if (marker.branch === "invalid") {
    const unsupportedHistoricalMarker = marker.issues.some((issue) =>
      ["missing_production_marker", "unsupported_pipeline_marker"].includes(issue.code)
    );
    if (unsupportedHistoricalMarker) return false;
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Leading source frontmatter is invalid.",
      hint: "Repair the canonical source marker before routing production work.",
      where: `${where}.source`,
      diagnostic: {
        version: 1,
        category: "source_validation",
        operation: "probe-production-marker",
        source: marker.issues[0]?.source || { path: sourceLocator },
        issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })),
        next: createCliNext("edit_source", { default: "Repair leading frontmatter before adapter routing, readiness, or writes." }),
      },
    });
    return true;
  }
  if (marker.branch === HTML_FIRST_PIPELINE && source !== canonicalSource) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "HTML-first requires the canonical source filename.",
      hint: "Restore slide-specifications.md and move backup copies under _scratch/.",
      where: `${where}.source`,
      diagnostic: {
        version: 1,
        category: "source_validation",
        operation: "select-html-first-source",
        source: { path: sourceLocator },
        reason: { kind: "canonical_source_missing", actual: basename(source), expected: SLIDE_SPECS_NAME },
        next: createCliNext("edit_source", { default: "Restore the exact canonical source before adapter routing, readiness, or writes." }),
      },
    });
    return true;
  }
  return false;
}

async function resolveRunAdapter(runDir, where, { allowPageAuthority = false } = {}) {
  const resolved = resolve(runDir || "");
  const deckDir = deckRoot(resolved);
  const { inspectLegacyProtocol } = await import("./shared/state/legacy_protocol_adoption.mjs");
  const protocol = inspectLegacyProtocol(resolved);
  if (protocol.classification === "recognized-legacy") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "LEGACY_PROTOCOL_ADOPTION_REQUIRED: this historical run must use the provider-free Page Authority adoption route before production work.",
      hint: "Inspect or prepare the explicit Page Authority candidate and per-slide adoption matrix; adoption itself makes no provider request.",
      where,
      diagnostic: {
        version: 1,
        category: "gate",
        operation: "resolve-legacy-protocol",
        source: { path: resolved },
        reason: { kind: "legacy_protocol_adoption_required", actual: protocol.observation_sha256 },
        next: createCliNext("repair_prerequisite", {
          default: `Run ppt_flow state ${JSON.stringify(resolved)} --prepare-legacy-adoption, then preview the exact provider-free adoption plan.`,
        }),
      },
    });
    return null;
  }
  if (protocol.classification === "current-pair-corrupt") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "CURRENT_PROTOCOL_REPAIR_REQUIRED: the Page Authority source/state pair is incomplete or inconsistent.",
      hint: "Preserve the current bytes and repair the Page Authority pair through its owning state/source boundary; do not infer legacy adoption.",
      where,
      diagnostic: {
        version: 1,
        category: "gate",
        operation: "resolve-current-protocol",
        source: { path: resolved },
        reason: { kind: "current_protocol_repair_required", actual: protocol.observation_sha256 },
        next: createCliNext("repair_prerequisite", {
          default: "Repair the exact Page Authority source/state pair, then rerun the selected operation.",
        }),
      },
    });
    return null;
  }
  if (protocol.classification === "unsupported-or-corrupt") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "UNSUPPORTED_PROTOCOL_REPAIR_REQUIRED: the run does not contain an exact supported legacy or Page Authority source/state pair.",
      hint: "Preserve the current bytes and use the owning repair/export path; do not infer a production adapter or adoption candidate.",
      where,
      diagnostic: {
        version: 1,
        category: "gate",
        operation: "resolve-unsupported-protocol",
        source: { path: resolved },
        reason: { kind: "unsupported_protocol_repair_required", actual: protocol.observation_sha256 },
        next: createCliNext("repair_prerequisite", {
          default: "Inspect the exact source/state pair and repair or export it before selecting a production route.",
        }),
      },
    });
    return null;
  }
  if (preflightAdapterSource(resolved, where)) return null;
  const { resolveRunProductionAdapter } = await import("./shared/state/state.mjs");
  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (route.ok && route.adapter === "page-authority-image2" && !allowPageAuthority) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Page Authority Image2 is not available through a legacy production command.",
      hint: "Use the receipt-bound Page Authority lifecycle; Header-Lock and whole-page adapters are not valid for this run.",
      where,
      diagnostic: {
        version: 1,
        category: "gate",
        operation: "resolve-production-adapter",
        source: { path: resolved },
        reason: { kind: "page_authority_adapter_pending" },
        next: createCliNext("repair_prerequisite", { default: "Use the Page Authority receipt-to-delivery command once available; do not invoke a legacy adapter." }),
      },
    });
    return null;
  }
  if (route.ok) return Object.freeze({ ...route, run_dir: resolved, deck_dir: deckDir });

  const code = route.code || "STATE_UNAVAILABLE";
  const historicalState = route.state?.replacement_required === true && route.state?.current_repair_required !== true;
  const currentRepair = route.state?.current_repair_required === true;
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: `Production adapter cannot resolve the exact run identity: ${code}.`,
    hint: code === "transition_required"
      ? "Resolve the mode/source mismatch through the versioned transition path before retrying."
      : historicalState
        ? "Preserve unsupported state bytes and start a fresh explicitly initialized current run."
        : "Initialize or register the exact run version's production mode before retrying.",
    where,
    diagnostic: {
      version: 1,
      category: "gate",
      operation: "resolve-production-adapter",
      source: { path: resolved },
      reason: { kind: code === "transition_required" ? "mode_source_mismatch" : "production_mode_unavailable" },
      next: createCliNext("repair_prerequisite", {
        requiresHuman: code === "transition_required",
        default: code === "transition_required"
          ? "Repair the authoritative mode/source relationship before selecting an adapter."
          : historicalState
            ? "Preserve the existing bytes and run ppt_flow init for a fresh current run; do not edit or infer a route from unsupported historical state."
            : currentRepair
              ? "Retry the owning current-state operation so it can canonicalize the one-to-one defect before continuing."
              : "Register the exact production mode through its state owner, then retry.",
      }),
    },
  });
  return null;
}

async function rejectHtmlFirstDelivery(runDir, where, { allowHtml = false } = {}) {
  const resolved = resolve(runDir);
  const canonicalSource = join(resolved, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(resolved);
  if (!source) return false;
  const sourceLocator = relative(deckRoot(resolved), source).split(sep).join("/");
  const { HTML_FIRST_PIPELINE, probeProductionMarker } = await import("./03-html-production/index.mjs");
  const marker = probeProductionMarker(readFileSync(source), { source: SLIDE_SPECS_NAME });
  if (marker.branch === "invalid") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Leading source frontmatter is invalid.",
      hint: "Repair the canonical source marker before continuing.",
      where,
      diagnostic: {
        version: 1,
        category: "source_validation",
        operation: "probe-html-first",
        source: marker.issues[0]?.source || { path: sourceLocator },
        issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })),
        next: createCliNext("edit_source", { default: "Repair leading frontmatter before readiness, credentials, or writes." }),
      },
    });
    return true;
  }
  if (marker.branch === HTML_FIRST_PIPELINE && source !== canonicalSource) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "HTML-first requires the canonical source filename.",
      hint: "Restore slide-specifications.md and move backup copies under _scratch/.",
      where,
      diagnostic: {
        version: 1,
        category: "source_validation",
        operation: "select-html-first-source",
        source: { path: sourceLocator },
        reason: { kind: "canonical_source_missing", actual: basename(source), expected: SLIDE_SPECS_NAME },
        next: createCliNext("edit_source", { default: "Restore the exact canonical source before readiness, credentials, or writes." }),
      },
    });
    return true;
  }
  if (marker.branch !== HTML_FIRST_PIPELINE) return false;
  if (allowHtml) return false;
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "This whole-page-only command is not applicable to HTML-first production.",
    hint: "Use the local HTML preview/review/build route for this run.",
    where,
    diagnostic: {
      version: 1,
      category: "gate",
      operation: "route-html-first",
      source: { path: sourceLocator },
      reason: { kind: "html_whole_page_option_inapplicable" },
      next: createCliNext("rerun", { default: "Use the matching HTML-first local command and review flow." }),
    },
  });
  return true;
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
 * @param {{env?: Record<string, string>}} [opts] - bounded internal routing context.
 * @returns {Promise<number>} Exit code.
 */
function runNode(script, args = [], { env = {} } = {}) {
  const cmd = ["node", script, ...args].map(String);
  console.log("→ " + cmd.join(" "));
  return new Promise((resolve) => {
    const collector = createChildOutputCollector({
      registered: true,
      onProgress: (event, fields) => emitCliProgress(event, fields),
    });
    const child = spawn("node", [script, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...env, [CLI_PROGRESS_ENV]: "1" },
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
  const canonicalSource = join(runDir, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(runDir);
  const marker = source
    ? probeProductionMarker(readFileSync(source), { source: basename(source) })
    : { branch: "invalid", issues: [] };
  const htmlFirst = marker.branch === HTML_FIRST_PIPELINE;
  const pipeline = marker.branch === "invalid"
    ? "invalid"
    : htmlFirst ? HTML_FIRST_PIPELINE : WHOLE_PAGE_IMAGE2_PIPELINE;

  let expected = 0;
  let slideLabels = [];
  if (existsSync(planPath)) {
    try {
      const slides = JSON.parse(readFileSync(planPath, "utf-8")).slides || [];
      expected = slides.length;
      slideLabels = slides.map((slide) => formatSlideCandidate({
        slide_id: slide.slide_id || slide.id,
        position: slide.position,
        title: slide.headline || slide.title || "",
      }));
    } catch {
      expected = 0;
      slideLabels = [];
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

  const lessonsDir = join(root, LESSONS_DIR);
  let lessonsCount = 0;
  if (existsSync(lessonsDir) && statSync(lessonsDir).isDirectory()) {
    lessonsCount = readdirSync(lessonsDir)
      .filter((f) => f !== "README.md" && (f.endsWith(".md") || f.endsWith(".yaml")))
      .length;
  }

  return {
    run_dir: String(runDir),
    pipeline,
    structure_issues: checkBundle(runDir, false),
    content_gate: htmlFirst ? (meta.html_content_gate || "missing") : (meta.content_gate || "missing"),
    visual_gate: htmlFirst ? (meta.html_visual_gate || "missing") : (meta.visual_gate || "missing"),
    style_master: htmlFirst ? false : existsSync(styleAsset(runDir, STYLE_MASTER_IMAGE)),
    slide_plan: existsSync(planPath),
    expected_slides: expected,
    slide_labels: slideLabels,
    raw_images: htmlFirst ? 0 : pngCount(imagesDir),
    locked_images: htmlFirst ? 0 : pngCount(lockedDir),
    pptx: pptxFiles.map((f) => basename(f)),
    pilot_preview: !htmlFirst && existsSync(
      join(genDir, GEN_PREVIEW_SUBDIR, "pilot_final_contact_sheet.jpg")
    ),
    lessons_count: lessonsCount,
  };
}

function applyWorkflowInspectionDisplay(target, inspection) {
  target.workflow_inspection = inspection;
  const primary = inspection.primary_action;
  target.workflow_summary = primary.summary || primary.display_label || primary.action_id;
  target.suggested_next = primary.command || primary.display_label || `${primary.owner}:${primary.action_id}`;
}

/**
 * Attach playbook breakpoint + optional workflow_summary onto a status object.
 * @param {object} status
 * @param {string} runDir
 */
async function enrichStatusWithState(status, runDir, route = null) {
  const { readState, buildResumeCard, statePath, projectImage2RefinementState, inspectRunProductionMode } = await import("./shared/state/state.mjs");
  const root = deckRoot(runDir);
  status.state_present = existsSync(statePath(root));
  // Status projects only exact, current run-bound authority. Historical state
  // is a hard-stop and is never upgraded from visible topology.
  const s = readState(root, { purpose: "observe", heal: false, runDir });
  if (s.replacement_required) {
    status.playbook = "";
    status.current_node = "";
    status.state_unavailable = true;
    return status;
  }
  const version = basename(resolve(runDir));
  const modeInspection = route?.mode
    ? { ok: true, mode: route.mode, policy: route.policy }
    : inspectRunProductionMode(root, { runDir, purpose: "observe" });
  status.production_mode = modeInspection.ok
    ? { resolvable: true, mode: modeInspection.mode, policy: modeInspection.policy }
    : { resolvable: false, code: modeInspection.code };
  if (modeInspection.mode === "html-then-image2") {
    try {
      status.image2_refinement = projectImage2RefinementState(s, version);
    } catch (error) {
      status.image2_refinement = { present: false, status: "invalid", reason: error.message };
    }
  } else {
    status.image2_refinement = null;
  }
  if (status.pipeline === HTML_FIRST_PIPELINE) {
    try {
      const { inspectHtmlReviewReadiness } = await import("./shared/state/html_review_evidence.mjs");
      status.html_reviews = inspectHtmlReviewReadiness(runDir);
      status.content_gate = status.html_reviews.gates?.content?.record?.status || "pending";
      status.visual_gate = status.html_reviews.gates?.visual?.record?.status || "pending";
    } catch (error) {
      status.html_reviews = { ready: false, conflict: false, reason: error.message, gates: {} };
      status.content_gate = "pending";
      status.visual_gate = "pending";
    }
  } else {
    status.html_reviews = null;
  }
  const { buildPlaybookIndex } = await import("./shared/state/md_controller_reader.mjs");
  const controllerCtx = await buildControllerGateContext(runDir);
  if (modeInspection.ok && modeInspection.mode) controllerCtx.productionMode = modeInspection.mode;
  const card = buildResumeCard(s, {
    style_master: status.style_master,
    raw_images: status.raw_images,
    expected_slides: status.expected_slides,
    pptx: status.pptx,
    pilot_preview: status.pilot_preview,
    content_gate: status.content_gate,
    visual_gate: status.visual_gate,
  }, {
    index: buildPlaybookIndex(join(FRAMEWORK_DIR, "playbook")),
    ctx: controllerCtx,
  });
  status.playbook = card.playbook;
  status.current_node = card.current_node;
  const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
  applyWorkflowInspectionDisplay(status, inspectWorkflow({ runDir }));
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
      const { validateSlideSpecs } = await import("./03-html-production/index.mjs");
      slideSpecsValid = !(await validateSlideSpecs([specPath])).some((problem) => problem.startsWith("ERROR:"));
    } catch {
      slideSpecsValid = false;
    }
  }

  let headerReviewCurrent = false;
  try {
      const { inspectWholePageHeaderReview } = await import("./04-image-production/index.mjs");
      headerReviewCurrent = (await inspectWholePageHeaderReview(resolved, {
      requireCurrentImages: true,
    })).ok;
  } catch {
    headerReviewCurrent = false;
  }

  let htmlFirstMarked = false;
  let htmlDeliveryReviewCurrent = false;
  try {
    const p3 = await import("./03-html-production/index.mjs");
    if (specPath) {
      const marker = p3.probeProductionMarker(readFileSync(specPath), { source: "slide-specifications.md" });
      htmlFirstMarked = marker.branch === HTML_FIRST_PIPELINE;
      if (htmlFirstMarked) {
        const review = (await import("./shared/state/html_review_evidence.mjs")).inspectHtmlReviewReadiness(resolved);
        htmlDeliveryReviewCurrent = review.delivery?.freshness === "current" && review.delivery?.decision === "proceed";
      }
    }
  } catch {
    htmlFirstMarked = false;
    htmlDeliveryReviewCurrent = false;
  }

  return {
    deckDir: deckRoot(resolved),
    runDir: resolved,
    runVersion: basename(resolved),
    pipeline: htmlFirstMarked ? HTML_FIRST_PIPELINE : WHOLE_PAGE_IMAGE2_PIPELINE,
    frameworkDir: FRAMEWORK_DIR,
    slideSpecsValid,
    headerReviewCurrent,
    htmlFirstMarked,
    htmlDeliveryReviewCurrent,
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
  console.log(`  Pipeline:      ${status.pipeline}`);
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
  if (status.pipeline !== HTML_FIRST_PIPELINE) {
    console.log(`  Style master:  ${status.style_master ? "ready" : "missing"}`);
  }
  console.log(`  Slide plan:    ${status.slide_plan ? "ready" : "not built"}`);
  for (const label of status.slide_labels || []) console.log(`    ${label}`);
  if (status.pipeline !== HTML_FIRST_PIPELINE) {
    console.log(`  Raw images:    ${status.raw_images}/${expected}`);
    console.log(`  Locked images: ${status.locked_images}/${expected}`);
  }
  console.log(
    `  PPTX:          ${status.pptx.length > 0 ? status.pptx.join(", ") : "not built"}`
  );
  if (status.pipeline !== HTML_FIRST_PIPELINE) {
    console.log(`  Pilot preview: ${status.pilot_preview ? "ready" : "not built"}`);
  } else if (status.html_reviews) {
    console.log(`  HTML reviews:  ${status.html_reviews.ready ? "current" : status.html_reviews.reason}`);
  }
  if (status.image2_refinement?.present) console.log(`  Image2 refine: ${status.image2_refinement.status}`);
  console.log(
    `  Lessons:       ${status.lessons_count > 0 ? `${status.lessons_count} (run \`lessons.mjs list\` to review)` : "none"}`
  );

  if (status.structure_issues.length > 0) {
    console.log("\nFix first:");
    for (const issue of status.structure_issues) {
      console.log(`  - ${issue}`);
    }
    return;
  }

  if (status.pipeline === HTML_FIRST_PIPELINE) {
    if (status.suggested_next) {
      console.log("\nNext:");
      console.log(`  - ${status.suggested_next}`);
      return;
    }
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
  const MAKE_CONTACT_SHEET = join(REFERENCE_SCRIPTS_DIR, "04-image-production", "whole-page", "make_contact_sheet.mjs");
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
 * doctor — Check base local runtime and optional Image2 readiness.
 * Delegates to env-check.mjs as a subprocess.
 * @param {{image2?: boolean, smoke?: boolean, probeVendors?: boolean}} [opts]
 */
async function commandDoctor({ image2 = false, smoke = false, probeVendors = false, mode = null, runDir = null, operation = null } = {}) {
  const args = [];
  let resolvedMode = mode;
  if (resolvedMode && !PRODUCTION_MODES.includes(resolvedMode)) {
    emitUsage("ppt_flow.doctor.mode", `mode must be one of ${[...PRODUCTION_MODES].join(", ")}`, "Pass a supported production mode before running environment checks.");
    return null;
  }
  if (runDir) {
    const route = await resolveRunAdapter(runDir, "ppt_flow.doctor.run-dir", { allowPageAuthority: true });
    if (!route) return null;
    resolvedMode = route.mode || "image2-only";
  }
  if (resolvedMode) args.push("--mode", resolvedMode);
  else if (image2) args.push("--image2");
  if (smoke) args.push("--smoke");
  if (probeVendors) args.push("--probe-vendors");
  if (operation) args.push("--operation", operation);
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
function commandInit(deckDir, { deckType, style, mode }) {
  const resolved = resolve(deckDir);
  const normalizedMode = mode == null ? DEFAULT_INIT_MODE : mode;

  if (normalizedMode !== DEFAULT_INIT_MODE) {
    console.error(`✗ New decks use ${DEFAULT_INIT_MODE}; legacy production modes are existing-run only.`);
    return emitUsage(
      "ppt_flow.init.mode",
      `New deck initialization does not support ${normalizedMode}`,
      `Omit --mode or pass --mode ${DEFAULT_INIT_MODE}`
    );
  }

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
    log = initBundle(resolved, FRAMEWORK_DIR, deckType, style, { mode: normalizedMode });
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed("ppt_flow.init", err.message, "Fix the reported init error and retry");
    return 1;
  }

  const modePolicy = productionPolicyForMode(normalizedMode);
  console.log(`✓ Initialized ${resolved}`);
  for (const line of log) console.log(`  - ${line}`);
  console.log(`  production_mode: ${normalizedMode} (pipeline: ${modePolicy.pipeline})`);
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
  const route = await resolveRunAdapter(runDir, "ppt_flow.status.identity");
  if (!route) return 1;
  const resolved = route.run_dir;
  const status = collectStatus(resolved);
  await enrichStatusWithState(status, resolved, route);
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
async function commandApprove(runDir, gate, { waive, planHash = null, reason = null }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.approve.identity");
  if (!route) return 1;
  const resolved = route.run_dir;
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
  const root = route.deck_dir;
  if (route.adapter === "html") {
    if (!waive && !planHash) return emitUsage("ppt_flow.approve", "HTML approval requires --plan-hash", "Pass the exact current review plan hash shown by HTML preview/status");
    if (waive && !String(reason || "").trim()) return emitUsage("ppt_flow.approve", "HTML waiver requires --reason", "Pass a bounded human reason with --waive --reason");
    if (!waive && reason != null) return emitUsage("ppt_flow.approve", "ordinary HTML approval does not accept --reason", "Use --waive --reason only for an explicit continuation");
    try {
      const { publishHtmlGateDecision } = await import("./shared/state/html_review_evidence.mjs");
      const result = publishHtmlGateDecision(resolved, { gate, planHash, status: value, waiverReason: reason });
      console.log(`✓ html-${gate}-review: ${value} (${result.review_plan_hash || "current computable projection"})`);
      return 0;
    } catch (error) {
      emitFailed("ppt_flow.approve.html", error.message, waive ? "Repair the shown review evidence, or retry the explicit waiver with the current source identity." : "Regenerate the complete current HTML review plan and approve its exact hash");
      return 1;
    }
  }
  if (planHash || reason) return emitUsage("ppt_flow.approve", "--plan-hash/--reason are HTML review controls", "Remove HTML-only controls for whole-page Image2 header approval");
  const { readState, writeState, setGate, appendHistory } = await import(
    "./shared/state/state.mjs"
  );
  const s = readState(root);
  if (s.replacement_required) {
    emitFailed(
      "ppt_flow.approve.state",
      "authoritative state uses an unsupported protocol",
      "Preserve the existing bytes and run fresh explicit ppt_flow init; do not edit or infer a route from unsupported historical state.",
      {
        version: 1,
        category: "artifact",
        operation: "approve-gate",
        reason: { kind: "replacement_required" },
        next: createCliNext("repair_prerequisite", {
          default: "Preserve the existing bytes and run ppt_flow init for a fresh current run; do not edit or infer a route from unsupported historical state.",
        }),
      }
    );
    return 1;
  }
  const metadata = join(root, METADATA_FILE);
  updateGate(metadata, gate, value);
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

  console.log(`✓ ${gate}_gate: ${value} (${metadata})`);
  console.log(`✓ _state.gates.${gate}: ${value}`);
  return 0;
}

async function commandApproveHeader(runDir, {
  waive = false,
  only: onlyStr = null,
  reason = null,
} = {}) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.approve.header.identity");
  if (!route) return 1;
  const resolved = route.run_dir;
  if (await rejectHtmlFirstDelivery(resolved, "ppt_flow.approve.header")) return 1;
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
    const { loadVisualConfig, DEFAULT_CONFIG } = await import("./02-visual-system/index.mjs");
    const palettePath = styleAsset(resolved, COLOR_PALETTE_FILE);
    const visualConfig = existsSync(palettePath) ? loadVisualConfig(palettePath) : DEFAULT_CONFIG;
    const {
      buildHeaderReviewInputs,
      collectPilotProvenance,
      HEADER_REVIEW_NODE,
      mergeHeaderReviewRecord,
      versionKey,
    } = await import("./04-image-production/index.mjs");
    const inputs = buildHeaderReviewInputs(plan, visualConfig);
    const root = deckRoot(resolved);
    const { readState, writeState, appendHistory } = await import("./shared/state/state.mjs");
    const state = readState(root);
    if (state.corrupted) throw new Error("state is corrupted");
    const key = versionKey(root, resolved);
    const previousRecord = state.nodes?.[HEADER_REVIEW_NODE]?.by_version?.[key] || null;
    const { changedFullPageIds } = await import("./04-image-production/index.mjs");
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
      currentStyleReferenceSha256: (await import("./shared/identity/byte_hash.mjs")).sha256File(
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
  const route = await resolveRunAdapter(runDir, "ppt_flow.style-master.identity");
  if (!route) return null;
  const resolved = route.run_dir;
  if (route.adapter === "html") {
    // HTML modes: the current style-master generator is the in-framework Image2
    // adapter; an HTML visual-system adapter is a reserved future seam. Return
    // a successful zero-write typed "not available" guide rather than
    // generating or erroring. Required provider authorization stays a hard stop
    // for the image2-only generator below.
    const report = {
      operation: "style-master",
      available: false,
      mode: route.mode,
      reason: "reserved-html-adapter",
      detail: "The current style-master generator is the in-framework Image2 adapter; HTML visual style is owned by the HTML visual review path.",
      next: "Continue HTML production through content/visual review; no style-master artifact is required.",
    };
    console.log(JSON.stringify(report));
    return 0;
  }
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
  const route = await resolveRunAdapter(runDir, "ppt_flow.validate.identity", { allowPageAuthority: true });
  if (!route) return 1;
  const resolved = route.run_dir;
  if (route.adapter === "page-authority-image2") {
    try {
      const { resolvePageAuthorityReceipt } = await import("./04-image-production/index.mjs");
      const result = resolvePageAuthorityReceipt(resolved);
      console.log(`✓ Page Authority receipt validated: ${result.receipt.slides.length} slide(s)`);
      return 0;
    } catch (error) {
      emitFailed("ppt_flow.validate.page-authority", error.message || "Page Authority validation failed", "Repair canonical Page Authority source or its registered visual inputs, then rerun validate.");
      return 1;
    }
  }
  const canonicalSpecs = join(resolved, SLIDE_SPECS_NAME);
  const sourceCandidate = existsSync(canonicalSpecs) ? canonicalSpecs : findSlideSpecs(resolved);
  if (sourceCandidate) {
    const marker = probeProductionMarker(readFileSync(sourceCandidate), { source: basename(sourceCandidate) });
    if (marker.branch === "invalid") {
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "Leading source frontmatter is invalid.",
        hint: "Repair the canonical source marker, then rerun validation.",
        where: "ppt_flow.validate",
        diagnostic: {
          version: 1,
          category: "source_validation",
          operation: "probe-html-first",
          source: marker.issues[0]?.source || { path: basename(sourceCandidate) },
          issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })),
          next: createCliNext("edit_source", { default: "Repair leading frontmatter before validation." }),
        },
      });
      return 1;
    }
    if (marker.branch === HTML_FIRST_PIPELINE && sourceCandidate !== canonicalSpecs) {
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "HTML-first requires the canonical source filename.",
        hint: "Restore slide-specifications.md and move backup copies under _scratch/.",
        where: "ppt_flow.validate",
        diagnostic: {
          version: 1,
          category: "source_validation",
          operation: "select-html-first-source",
          source: { path: basename(sourceCandidate) },
          reason: { kind: "canonical_source_missing", actual: basename(sourceCandidate), expected: SLIDE_SPECS_NAME },
          next: createCliNext("edit_source", { default: "Restore the exact canonical source before validation." }),
        },
      });
      return 1;
    }
  }
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
  const specs = existsSync(canonicalSpecs) ? canonicalSpecs : findSlideSpecs(resolved);
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
    "--spec",
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
  { only: onlyStr, count, resolution, model, baseUrl, dryRun, forceImages = false, wholePageControlsExplicit = false }
) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.pilot.identity");
  if (!route) return 1;
  const resolved = route.run_dir;
  if (await rejectHtmlFirstDelivery(resolved, "ppt_flow.pilot", { allowHtml: true })) return 1;
  if (route.adapter === "html") {
    if (forceImages || baseUrl || wholePageControlsExplicit) return emitUsage("ppt_flow.pilot.html", "HTML preview does not accept provider/model/resolution/force controls", "Use only --only and --dry-run for local HTML preview");
    const args = ["--run-dir", resolved, "--stage", "1,2,3", "--preview"];
    if (onlyStr) args.push("--only", onlyStr);
    if (dryRun) args.push("--dry-run");
    const code = await runNode(UNIFIED_PIPELINE, args);
    if (code !== 0) { emitFailed("ppt_flow.pilot.html", `HTML preview exited ${code}`, "Repair current local HTML source/runtime evidence and rerun preview"); return code; }
    if (!dryRun) {
      const { plan } = (await import("./03-html-production/index.mjs")).validateAndBuildHtmlFirstPlan({ runDir: resolved });
      const requested = onlyStr ? new Set(onlyStr.split(",").map((value) => value.trim()).filter(Boolean)) : null;
      const forcedIds = plan.slides.filter((slide) => slide.visual_resolution?.effective === "selected" && (!requested || requested.has(slide.slide_id))).map((slide) => slide.slide_id);
      if (forcedIds.length > 0) {
        const forcedArgs = ["--run-dir", resolved, "--variant", "forced-fallback", ...forcedIds.flatMap((slideId) => ["--only", slideId])];
        const forcedCode = await runNode(join(REFERENCE_SCRIPTS_DIR, "03-html-production", "stage3_compose_slides.mjs"), forcedArgs);
        if (forcedCode !== 0) { emitFailed("ppt_flow.pilot.html.forced-fallback", `forced-fallback preview exited ${forcedCode}`, "Repair fallback assets/runtime and rerun HTML preview"); return forcedCode; }
      }
      const { inspectHtmlReviewReadiness } = await import("./shared/state/html_review_evidence.mjs");
      const readiness = inspectHtmlReviewReadiness(resolved);
      console.log(`HTML content review plan: ${readiness.gates.content.plan?.plan_hash || "incomplete"}`);
      console.log(`HTML visual review plan: ${readiness.gates.visual.plan?.plan_hash || "incomplete"}`);
    }
    return 0;
  }

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
  code = await runNode(UNIFIED_PIPELINE, stage2Args, {
    env: { PPTMAKER_IMAGE2_OPERATION: "pilot" },
  });
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

async function commandPageAuthorityBuild(route, { resolution, model, baseUrl, reuseImages, dryRun, force, reason, wholePageControlsExplicit }) {
  if (baseUrl || reuseImages || dryRun || force || reason != null || wholePageControlsExplicit) {
    return emitUsage(
      "ppt_flow.build.page-authority",
      "Page Authority build accepts no resolution, model, provider, image-reuse, dry-run, or legacy gate overrides",
      "Use receipt-bound image2 plan/authorize/generate/review first, then run build with only the canonical run directory."
    );
  }
  try {
    const { buildPageAuthorityDelivery } = await import("./04-image-production/index.mjs");
    const result = await buildPageAuthorityDelivery(route.run_dir);
    if (!result.ok) {
      const confirm = result.kind === "confirm";
      emitCliError({
        code: CLI_ERROR_CODES.GATE_BLOCKED,
        message: `Page Authority finalization is blocked: ${result.code || "raw_review_required"}`,
        hint: confirm
          ? "Review the current Page Authority raw projection and record proceed, repair, or redirect."
          : "Repair the named Page Authority raw evidence before finalization.",
        where: "ppt_flow.build.page-authority",
        diagnostic: {
          version: 1,
          category: "gate",
          operation: "page-authority-finalize",
          source: { path: route.run_dir },
          reason: { kind: pageAuthorityDiagnosticReasonKind(result.code, "raw_review_required") },
          next: createCliNext(confirm ? "review" : "repair_prerequisite", {
            requiresHuman: confirm,
            default: confirm
              ? "Open the current raw-review projection and record its explicit human decision."
              : "Regenerate or repair current raw evidence, then build again.",
          }),
        },
      });
      return 1;
    }
    console.log(`✓ Page Authority delivery assembled: ${result.assembly.pptx_path}`);
    return 0;
  } catch (error) {
    emitFailed(
      "ppt_flow.build.page-authority",
      error.message || "Page Authority build failed.",
      "Repair the canonical receipt, raw evidence, final manifest, assembly, or speaker notes before retrying."
    );
    return 1;
  }
}

/**
 * build — Build the complete final deck.
 * Delegates to unified_pipeline.mjs --stage all.
 *
 * @param {string} runDir
 * @param {{resolution: string, model: string, baseUrl: string|null, reuseImages: boolean, dryRun: boolean, force?: boolean, reason?: string|null}} opts
 */
async function commandBuild(
  runDir,
  { resolution, model, baseUrl, reuseImages, dryRun, force = false, reason = null, wholePageControlsExplicit = false }
) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.build.identity", { allowPageAuthority: true });
  if (!route) return 1;
  const resolved = route.run_dir;
  if (route.adapter === "page-authority-image2") {
    return commandPageAuthorityBuild(route, { resolution, model, baseUrl, reuseImages, dryRun, force, reason, wholePageControlsExplicit });
  }
  if (await rejectHtmlFirstDelivery(resolved, "ppt_flow.build", { allowHtml: true })) return 1;
  if (route.adapter === "html") {
    if (force && !String(reason || "").trim()) return emitUsage("ppt_flow.build.html", "HTML build --force requires --reason", "Provide a bounded human reason for the explicit gate waiver.");
    if (!force && reason != null) return emitUsage("ppt_flow.build.html", "--reason applies only with HTML build --force", "Remove --reason or add --force for an explicit continuation.");
    let forceNotNeeded = false;
    if (force) {
      const { inspectHtmlReviewReadiness, publishHtmlGateDecision } = await import("./shared/state/html_review_evidence.mjs");
      const before = inspectHtmlReviewReadiness(resolved);
      if (before.conflict) {
        emitFailed("ppt_flow.build.html", before.reason, "Resolve the producer-owned journal or reset conflict before building.");
        return 1;
      }
      const pending = ["content", "visual"].filter((gate) => !before.gates?.[gate]?.ready);
      forceNotNeeded = pending.length === 0;
      if (dryRun) {
        console.log(JSON.stringify({
          operation: "build",
          dry_run: true,
          force_not_needed: forceNotNeeded,
          prospective_waivers: pending,
          stages: ["1", "2", "3", "4", "5"],
        }));
        return 0;
      }
      for (const gate of pending) {
        try {
          publishHtmlGateDecision(resolved, { gate, status: "waived", waiverReason: reason });
        } catch (error) {
          emitFailed("ppt_flow.build.html", error.message, "Repair the current source/identity conflict before retrying the explicit continuation.");
          return 1;
        }
      }
      const after = inspectHtmlReviewReadiness(resolved);
      if (!after.ready) {
        emitFailed("ppt_flow.build.html", after.reason, "Repair or publish the remaining current gate decision before local assembly.");
        return 1;
      }
      if (forceNotNeeded) console.log(JSON.stringify({ operation: "build", force_not_needed: true }));
    }
    const args = ["--run-dir", resolved, "--stage", "all"];
    if (dryRun) args.push("--dry-run");
    const code = await runNode(UNIFIED_PIPELINE, args);
    if (code !== 0) emitFailed("ppt_flow.build", `HTML build exited ${code}`, "Resolve current HTML source/review evidence, then rerun build");
    return code;
  }
  if (force || reason != null) return emitUsage("ppt_flow.build", "--force/--reason are HTML-first continuation controls", "Remove them for explicit whole-page builds.");
  if (!dryRun) {
    const stage1Code = await runNode(UNIFIED_PIPELINE, [
      "--run-dir", resolved, "--stage", "1",
    ]);
    if (stage1Code !== 0) {
      emitFailed("ppt_flow.build", `Stage 1 exited ${stage1Code}`, "Fix current source/config errors, then rerun build");
      return 1;
    }
    const { inspectWholePageHeaderReview } = await import("./04-image-production/index.mjs");
    const review = await inspectWholePageHeaderReview(resolved, {
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

  const code = await runNode(UNIFIED_PIPELINE, args, {
    env: { PPTMAKER_IMAGE2_OPERATION: "build" },
  });
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

async function commandPageAuthorityRefresh(route, {
  kind,
  only,
  all,
  resolution,
  baseUrl,
  dryRun,
  confirmRunVersion,
  wholePageControlsExplicit,
}) {
  if (confirmRunVersion || baseUrl || dryRun || wholePageControlsExplicit) {
    return emitUsage(
      "ppt_flow.refresh.page-authority",
      "Page Authority refresh accepts no provider, resolution, dry-run, reset, or legacy override controls",
      "Use the canonical receipt-bound lifecycle and select only title or notes refresh work."
    );
  }
  if (kind === "visual") {
    return emitUsage(
      "ppt_flow.refresh.page-authority.visual",
      "Page Authority visual refresh requires a new receipt-bound raw plan",
      "Run image2 plan, authorize the exact raw scope when needed, generate, review, then build."
    );
  }
  if (kind === "reset-html-production") {
    return emitUsage("ppt_flow.refresh.page-authority.reset", "reset-html-production is not available for Page Authority", "Use the Page Authority evidence owner actions instead of a legacy HTML reset.");
  }
  if (kind === "notes") {
    if (only || all) return emitUsage("ppt_flow.refresh.page-authority.notes", "Page Authority notes refresh accepts no slide selectors", "Rerun notes against the current assembled Page Authority delivery.");
    try {
      const { refreshPageAuthorityNotes } = await import("./04-image-production/index.mjs");
      const result = await refreshPageAuthorityNotes(route.run_dir);
      console.log(`✓ Page Authority notes refreshed: ${result.notes.path}`);
      return 0;
    } catch (error) {
      emitFailed("ppt_flow.refresh.page-authority.notes", error.message || "Page Authority notes refresh failed.", "Repair current assembly or source speaker notes, then rerun notes refresh.");
      return 1;
    }
  }
  if (only && all) return emitUsage("ppt_flow.refresh.page-authority.title", "--only and --all are mutually exclusive", "Select exact Framed stable IDs or use --all after confirming every slide is Framed.");
  if (!only && !all) return emitUsage("ppt_flow.refresh.page-authority.title", "Framed Text Frame refresh requires --only or --all", "Select exact current Framed stable IDs before a provider-free refresh.");
  const slideIds = only ? only.split(",").map((id) => id.trim()).filter(Boolean) : null;
  try {
    const { refreshPageAuthorityFramedText } = await import("./04-image-production/index.mjs");
    const result = await refreshPageAuthorityFramedText(route.run_dir, { slideIds });
    if (!result.ok) {
      emitCliError({
        code: CLI_ERROR_CODES.GATE_BLOCKED,
        message: `Page Authority Framed refresh is blocked: ${result.code || "raw_review_required"}`,
        hint: "Review or repair current raw evidence before local Page Authority finalization.",
        where: "ppt_flow.refresh.page-authority.title",
        diagnostic: {
          version: 1,
          category: "gate",
          operation: "page-authority-framed-refresh",
          source: { path: route.run_dir },
          reason: { kind: pageAuthorityDiagnosticReasonKind(result.code, "raw_review_required") },
          next: createCliNext(result.kind === "confirm" ? "review" : "repair_prerequisite", {
            requiresHuman: result.kind === "confirm",
            default: "Use the current Page Authority raw review evidence before local finalization.",
          }),
        },
      });
      return 1;
    }
    console.log(`✓ Page Authority Framed refresh completed without provider submission: ${result.refreshed_slide_ids.join(", ")}`);
    return 0;
  } catch (error) {
    const rawRequired = /PURE_REFRESH_REQUIRES_RAW|FRAMED_RAW_REUSE_REQUIRED|RAW_REUSE_STALE/.test(`${error.code || ""} ${error.message || ""}`);
    if (rawRequired) {
      emitCliError({
        code: CLI_ERROR_CODES.GATE_BLOCKED,
        message: error.message,
        hint: "Use the receipt-bound raw plan and review lifecycle before finalization.",
        where: "ppt_flow.refresh.page-authority.title",
        diagnostic: {
          version: 1,
          category: "gate",
          operation: "page-authority-framed-refresh",
          source: { path: route.run_dir },
          reason: { kind: pageAuthorityDiagnosticReasonKind(error.code, "raw_evidence_required") },
          next: createCliNext("repair_prerequisite", { default: "Build a fresh Page Authority raw plan; authorize only a nonzero current scope." }),
        },
      });
      return 1;
    }
    emitFailed("ppt_flow.refresh.page-authority.title", error.message || "Page Authority Framed refresh failed.", "Repair the current Page Authority receipt, raw evidence, final manifest, or notes before retrying.");
    return 1;
  }
}

/**
 * refresh — Run the smallest safe edit chain.
 * Delegates to unified_pipeline.mjs with appropriate --stage.
 *
 * @param {string} runDir
 * @param {{kind: string, only: string|null, all: boolean, resolution: string, baseUrl: string|null, dryRun: boolean}} opts
 */
async function commandRefresh(
  runDir,
  { kind, only: onlyStr, all: allSlides, resolution, baseUrl, dryRun, confirmRunVersion = null, wholePageControlsExplicit = false }
) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.refresh.identity", { allowPageAuthority: true });
  if (!route) return 1;
  const resolved = route.run_dir;
  if (route.adapter === "page-authority-image2") {
    return commandPageAuthorityRefresh(route, {
      kind,
      only: onlyStr,
      all: allSlides,
      resolution,
      baseUrl,
      dryRun,
      confirmRunVersion,
      wholePageControlsExplicit,
    });
  }
  if (kind === "reset-html-production") {
    if (onlyStr || allSlides || dryRun || baseUrl || wholePageControlsExplicit) return emitUsage("ppt_flow.refresh.reset-html-production", "reset-html-production accepts only --confirm-run-version", "Remove selectors/dry-run/provider/resolution controls and confirm the exact vN");
    if (!confirmRunVersion) return emitUsage("ppt_flow.refresh.reset-html-production", "--confirm-run-version is required", "Pass the exact target run version, for example --confirm-run-version v1");
    if (await rejectHtmlFirstDelivery(resolved, "ppt_flow.refresh.reset-html-production", { allowHtml: true })) return 1;
    try {
      const { resetHtmlProduction } = await import("./shared/state/html_review_evidence.mjs");
      const result = resetHtmlProduction(resolved, { confirmedRunVersion: confirmRunVersion });
      console.log(`✓ HTML production reset ${result.status}: ${result.run_version}`);
      return 0;
    } catch (error) {
      emitFailed("ppt_flow.refresh.reset-html-production", error.message, "Resolve active ownership/state conflicts and retry the exact confirmed reset");
      return 1;
    }
  }
  if (confirmRunVersion) return emitUsage("ppt_flow.refresh", "--confirm-run-version applies only to reset-html-production", "Remove the confirmation flag or select --kind reset-html-production");
  if (await rejectHtmlFirstDelivery(resolved, "ppt_flow.refresh", { allowHtml: true })) return 1;
  if (route.adapter === "html") {
    if (baseUrl || wholePageControlsExplicit) return emitUsage("ppt_flow.refresh.html", "HTML refresh does not accept provider/resolution controls", "Remove whole-page image options and use local HTML refresh");
    if (kind === "notes") {
      if (onlyStr || allSlides) return emitUsage("ppt_flow.refresh.html.notes", "Notes-Only Refresh does not accept slide selectors", "Remove --only/--all and rerun notes refresh");
      const args = ["--run-dir", resolved, "--stage", "5"];
      if (dryRun) args.push("--dry-run");
      const code = await runNode(UNIFIED_PIPELINE, args);
      if (code !== 0) emitFailed("ppt_flow.refresh.html.notes", `HTML notes refresh exited ${code}`, "Repair current assembly/notes lineage and rerun Notes-Only Refresh");
      return code;
    }
    if (onlyStr && allSlides) return emitUsage("ppt_flow.refresh.html", "--only and --all are mutually exclusive", "Select one HTML refresh scope");
    if (!onlyStr && !allSlides) return emitUsage("ppt_flow.refresh.html", "HTML Local Slide/Deck Rebuild requires --only or --all", "Pass --only <stable-id> for a local slide or --all for a local deck rebuild");
    const args = ["--run-dir", resolved, "--stage", "1,2,3", "--preview"];
    if (onlyStr) args.push("--only", onlyStr);
    if (dryRun) args.push("--dry-run");
    const code = await runNode(UNIFIED_PIPELINE, args);
    if (code !== 0) { emitFailed("ppt_flow.refresh.html", `HTML local rebuild exited ${code}`, "Repair current source/runtime and rerun the smallest local scope"); return code; }
    if (dryRun) return 0;
    const { inspectHtmlReviewReadiness } = await import("./shared/state/html_review_evidence.mjs");
    const readiness = inspectHtmlReviewReadiness(resolved);
    if (!readiness.ready) {
      console.log(`HTML review required: content=${readiness.gates.content.plan?.plan_hash || "incomplete"} visual=${readiness.gates.visual.plan?.plan_hash || "incomplete"}`);
      return 0;
    }
    const deliveryCode = await runNode(UNIFIED_PIPELINE, ["--run-dir", resolved, "--stage", "4,5"]);
    if (deliveryCode !== 0) emitFailed("ppt_flow.refresh.html.delivery", `HTML delivery refresh exited ${deliveryCode}`, "Repair current delivery lineage and rerun local refresh");
    return deliveryCode;
  }

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
      const { inspectWholePageHeaderReview } = await import("./04-image-production/index.mjs");
      const review = await inspectWholePageHeaderReview(resolved, { onlyIds: fullPageAffected });
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

  const code = await runNode(UNIFIED_PIPELINE, args, {
    env: { PPTMAKER_IMAGE2_OPERATION: "refresh" },
  });
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
// Command: slides
// ---------------------------------------------------------------------------

function readCanonicalSlideSource(runDir) {
  const resolved = resolve(runDir);
  const structureIssues = checkBundle(resolved, false);
  if (structureIssues.length > 0) {
    const error = new Error(`run bundle has ${structureIssues.length} structure issue(s)`);
    error.slideDiagnostic = {
      category: "structure",
      operation: "load-slide-source",
      source: { path: resolved },
      issues: structureIssues.map((message) => ({ message, reason: { kind: "structure_violation" } })),
    };
    throw error;
  }
  const sourcePath = findSlideSpecs(resolved);
  if (!sourcePath || basename(sourcePath) !== "slide-specifications.md") {
    throw new Error("slides editing requires exactly one canonical slide-specifications.md");
  }
  const sourceText = readFileSync(sourcePath, "utf8");
  const source = relative(deckRoot(resolved), sourcePath).split(sep).join("/");
  return {
    runDir: resolved,
    sourcePath,
    sourceText,
    document: parseSlideDocument(sourceText, source),
  };
}

function renderSlidesResult(result, asJson) {
  if (asJson) {
    registerCliJsonReport(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.kind === "slide-list") {
    for (const slide of result.slides) console.log(formatSlideCandidate(slide));
    return;
  }
  if (result.kind === "slide-resolution") {
    for (const binding of result.bindings) {
      const slide = result.slides.find((entry) => entry.slide_id === binding.slide_id);
      console.log(`${binding.token} -> ${formatSlideCandidate(slide)} (${binding.matched_by})`);
    }
    return;
  }
  const label = result.applied ? "Applied" : "Preview";
  console.log(`${label}: ${result.transaction.plan_sha256}`);
  console.log(`Before: ${result.transaction.before_order.join(" -> ")}`);
  console.log(`After:  ${result.transaction.after_order.join(" -> ")}`);
  if (result.target_run_dir) console.log(`Created: ${result.target_run_dir}`);
  if (result.receipt?.no_op) console.log("No source bytes changed.");
  if (result.transaction.warnings.length > 0) console.log(`Review warnings: ${result.transaction.warnings.length}`);
}

function collectDeckHistoryIds(runDir) {
  const versionsDir = dirname(runDir);
  const ids = [];
  for (const entry of readdirSync(versionsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^v\d+$/.test(entry.name)) continue;
    const versionDir = join(versionsDir, entry.name);
    const sourcePath = findSlideSpecs(versionDir);
    if (!sourcePath) continue;
    try {
      const document = parseSlideDocument(
        readFileSync(sourcePath, "utf8"),
        relative(deckRoot(runDir), sourcePath).split(sep).join("/")
      );
      ids.push(...document.slides.map((slide) => slide.slide_id).filter(Boolean));
    } catch {
      // A malformed historical source remains inspectable but cannot silently
      // contribute invented IDs. Current source validation still fails closed.
    }
  }
  return [...new Set(ids)];
}

function slideTransaction({ context, operations, targetVersion = null }) {
  const structural = operations.some((operation) => operation.op !== "normalize");
  const versionName = targetVersion || (structural ? nextVersionName(context.runDir) : null);
  return planSlideEdit(context.document, [], operations, collectDeckHistoryIds(context.runDir), {
    publication: {
      mode: structural ? "next-version" : "current-version",
      target_version: versionName,
    },
  });
}

function atomicWriteCurrentSource(path, text) {
  const temp = join(dirname(path), `.${basename(path)}.normalize-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(temp, text, "utf8");
  renameSync(temp, path);
}

async function validateProjectedSlideSource(context, projectedText) {
  const marker = probeProductionMarker(projectedText, { source: context.document.source });
  if (marker.branch === "invalid") {
    const error = new Error("projected leading frontmatter is invalid");
    error.issues = marker.issues;
    throw error;
  }
  if (marker.branch === HTML_FIRST_PIPELINE) {
    const { validateHtmlRun } = await import("./03-html-production/index.mjs");
    await validateHtmlRun({ runDir: context.runDir, sourceBytes: Buffer.from(projectedText, "utf8") });
  }
  return marker.branch;
}

function pageAuthorityStructuralBasePlanHash(transaction) {
  const { page_authority_structural_raw: ignored, ...base } = transaction;
  return computeSlideEditPlanSha256(base);
}

async function enrichPageAuthorityStructuralRawPlan(context, transaction, applied, targetBranch) {
  if (targetBranch !== PAGE_AUTHORITY_IMAGE2_PIPELINE || transaction.publication.mode !== "next-version") return null;
  const basePlanHash = pageAuthorityStructuralBasePlanHash(transaction);
  const targetRunDir = join(dirname(context.runDir), transaction.publication.target_version);
  const pageAuthority = await import("./04-image-production/index.mjs");
  const target = pageAuthority.buildPageAuthorityRawBatchForSource({
    deckDir: deckRoot(context.runDir),
    sourcePath: join(targetRunDir, SLIDE_SPECS_NAME),
    sourceText: applied.text,
  });
  const candidate = pageAuthority.previewPageAuthorityStructuralRaw({
    sourceRunDir: context.runDir,
    targetRunDir,
    targetRawBatch: target.raw_batch,
    slideEditBasePlanSha256: basePlanHash,
  });
  const existing = transaction.page_authority_structural_raw;
  if (existing) {
    if (existing.slide_edit_base_plan_sha256 !== basePlanHash || existing.plan_hash !== candidate.plan_hash) {
      throw new Error("Page Authority structural raw plan changed after preview; obtain a fresh preview");
    }
    return Object.freeze({ plan: existing, pageAuthority });
  }
  transaction.page_authority_structural_raw = candidate;
  transaction.plan_sha256 = computeSlideEditPlanSha256(transaction);
  return Object.freeze({ plan: candidate, pageAuthority });
}

async function projectConfirmedSlideTransaction(context, transaction, expectedHash) {
  const applied = applySlideEdit(transaction, context.sourceText, {
    expectedPlanSha256: expectedHash,
  });
  const targetBranch = await validateProjectedSlideSource(context, applied.text);
  const pageAuthorityStructuralRaw = await enrichPageAuthorityStructuralRawPlan(context, transaction, applied, targetBranch);
  return { ...applied, targetBranch, pageAuthorityStructuralRaw };
}

async function applyConfirmedSlideTransaction(context, transaction, expectedHash) {
  if (readFileSync(context.sourcePath, "utf8") !== context.sourceText) {
    throw new Error("source changed after preview; obtain a fresh preview");
  }
  const applied = await projectConfirmedSlideTransaction(context, transaction, expectedHash);
  if (transaction.publication.mode === "current-version") {
    atomicWriteCurrentSource(context.sourcePath, applied.text);
    return {
      kind: "slide-edit",
      applied: true,
      transaction,
      receipt: applied.receipt,
      target_run_dir: context.runDir,
    };
  }
  const pageAuthorityStructuralRaw = applied.pageAuthorityStructuralRaw;
  const publication = publishStructuralVersion({
    sourceRunDir: context.runDir,
    versionName: transaction.publication.target_version,
    transformedSource: applied.text,
    expectedSourceSha256: transaction.base_spec_sha256,
    validateSource: ({ stagingRunDir, sourcePath }) => {
      const stagedText = readFileSync(sourcePath, "utf8");
      const stagedMarker = probeProductionMarker(stagedText, { source: SLIDE_SPECS_NAME });
      if (stagedMarker.branch === "invalid") {
        const error = new Error("staged leading frontmatter is invalid");
        error.issues = stagedMarker.issues;
        throw error;
      }
      if (stagedMarker.branch === HTML_FIRST_PIPELINE) {
        return [];
      }
      const staged = parseSlideDocument(stagedText, basename(sourcePath));
      return validateSlideDocument(staged).filter((issue) => issue.severity === "ERROR");
    },
    ...(pageAuthorityStructuralRaw ? {
      materializeStaging: ({ stagingRunDir, sourcePath }) => {
        const target = pageAuthorityStructuralRaw.pageAuthority.buildPageAuthorityRawBatchForSource({
          deckDir: deckRoot(context.runDir),
          sourcePath,
          sourceText: readFileSync(sourcePath, "utf8"),
        });
        return pageAuthorityStructuralRaw.pageAuthority.applyPageAuthorityStructuralRaw({
          plan: pageAuthorityStructuralRaw.plan,
          planHash: pageAuthorityStructuralRaw.plan.plan_hash,
          expectedSlideEditBasePlanSha256: pageAuthorityStructuralRaw.plan.slide_edit_base_plan_sha256,
          targetRawBatch: target.raw_batch,
          materializationRunDir: stagingRunDir,
        });
      },
    } : {}),
  });
  const targetBranch = applied.targetBranch;
  const receipt = {
    ...applied.receipt,
    source_run_dir: context.runDir,
    target_run_dir: publication.target,
    ...(targetBranch === HTML_FIRST_PIPELINE ? {
      pipeline: HTML_FIRST_PIPELINE,
      needs_render: [],
      needs_local_materialization: transaction.after_order,
      required_local_stages: ["stage1", "stage2-html", "stage3-html", "review", "stage4-html", "stage5-html"],
      review_required: true,
    } : targetBranch === PAGE_AUTHORITY_IMAGE2_PIPELINE ? {
      pipeline: PAGE_AUTHORITY_IMAGE2_PIPELINE,
      needs_render: publication.materialization?.needs_raw_generation || [],
      page_authority_structural_raw: {
        plan_hash: pageAuthorityStructuralRaw?.plan.plan_hash || null,
        materialized_slide_ids: publication.materialization?.materialized_slide_ids || [],
        needs_raw_generation: publication.materialization?.needs_raw_generation || [],
        provider_calls: publication.materialization?.provider_calls ?? 0,
      },
    } : {
      needs_render: transaction.operations
        .filter((operation) => operation.op === "insert")
        .map((operation) => operation.slide_id),
    }),
  };
  return {
    kind: "slide-edit",
    applied: true,
    transaction,
    receipt,
    target_run_dir: publication.target,
  };
}

function ensureConfirmedApply(opts, transaction) {
  if (!opts.planSha256) {
    const error = new Error("--apply requires --plan-sha256 from a confirmed preview");
    error.code = "missing_plan_sha256";
    throw error;
  }
  if (opts.planSha256 !== transaction.plan_sha256) {
    const error = new Error("confirmed --plan-sha256 differs from the current canonical preview");
    error.code = "plan_sha256_mismatch";
    throw error;
  }
}

function slideOperationsFor(subcommand, args, opts) {
  if (subcommand === "normalize") return [{ op: "normalize" }];
  if (subcommand === "move") {
    const operation = { op: "move", selector: args[0] };
    if (opts.after != null) operation.after = opts.after;
    else if (opts.before != null) operation.before = opts.before;
    else if (opts.to) operation.to = opts.to;
    else throw new Error("move requires --after, --before, or --to start|end");
    return [operation];
  }
  if (subcommand === "delete") return [{ op: "delete", selectors: args }];
  if (subcommand === "insert") {
    const blockPath = resolve(opts.source);
    const operation = { op: "insert", block: readFileSync(blockPath, "utf8") };
    if (opts.after != null) operation.after = opts.after;
    else if (opts.before != null) operation.before = opts.before;
    else operation.to = opts.to || "end";
    return [operation];
  }
  throw new Error(`unsupported slides subcommand ${subcommand}`);
}

async function commandSlides(subcommand, runDir, args = [], opts = {}) {
  try {
    const context = readCanonicalSlideSource(runDir);
    const slides = context.document.slides.map((slide) => ({
      slide_id: slide.slide_id,
      position: slide.position,
      title: slide.title,
    }));
    if (subcommand === "list") {
      renderSlidesResult({ kind: "slide-list", slides }, opts.json);
      return 0;
    }
    if (subcommand === "resolve") {
      const bindings = resolveSlideBindings(args, slides);
      renderSlidesResult({ kind: "slide-resolution", bindings, slides }, opts.json);
      return 0;
    }
    if (subcommand === "apply-plan") {
      if (!opts.apply) throw new Error("apply-plan requires explicit --apply");
      const scratch = resolve(context.runDir, SCRATCH_SUBDIR);
      const planPath = resolve(opts.plan);
      const rel = relative(scratch, planPath);
      if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) {
        throw new Error("apply-plan input must be inside the current version _scratch/");
      }
      const realScratch = realpathSync(scratch);
      const realPlan = realpathSync(planPath);
      const realRel = relative(realScratch, realPlan);
      if (!realRel || realRel === ".." || realRel.startsWith(`..${sep}`)) {
        throw new Error("apply-plan realpath must remain inside the current version _scratch/");
      }
      const transaction = JSON.parse(readFileSync(planPath, "utf8"));
      if (!verifySlideEditPlanHash(transaction)) throw new Error("persisted slide plan self-hash is invalid");
      if (transaction.source !== context.document.source) {
        throw new Error("persisted slide plan source does not match the current canonical source");
      }
      if (opts.planSha256 && opts.planSha256 !== transaction.plan_sha256) {
        throw new Error("--plan-sha256 differs from persisted slide plan");
      }
      const result = await applyConfirmedSlideTransaction(context, transaction, transaction.plan_sha256);
      renderSlidesResult(result, opts.json);
      return 0;
    }

    const operations = slideOperationsFor(subcommand, args, opts);
    const transaction = slideTransaction({ context, operations });
    const previewHash = transaction.plan_sha256;
    await projectConfirmedSlideTransaction(context, transaction, previewHash);
    if (!opts.apply) {
      renderSlidesResult({ kind: "slide-edit", applied: false, transaction }, opts.json);
      return 0;
    }
    ensureConfirmedApply(opts, transaction);
    const result = await applyConfirmedSlideTransaction(context, transaction, opts.planSha256);
    renderSlidesResult(result, opts.json);
    return 0;
  } catch (error) {
    const requiresHuman = /ambiguous/i.test(error.message);
    const selectorIssues = Array.isArray(error.candidates)
      ? error.candidates.map((candidate) => ({
          message: `slide selector candidate: ${formatSlideCandidate(candidate)}`,
          subject: { kind: "slide", id: candidate.slide_id },
          reason: { kind: "selector_candidate" },
        }))
      : [];
    emitCliError({
      code: error.code === "missing_plan_sha256" ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED,
      message: error.message,
      hint: /plan_sha256|source changed|target version/i.test(error.message)
        ? "Obtain a fresh slides preview and apply its exact plan_sha256"
        : "Inspect the current slide source and operation, then retry",
      where: `ppt_flow.slides.${subcommand}`,
      diagnostic: {
        version: 1,
        category: error.code === "missing_plan_sha256" ? "usage"
          : /ambiguous/.test(error.message) ? "source_validation"
            : /structure|version|staging|reservation/.test(error.message) ? "structure"
              : "source_validation",
        operation: subcommand,
        source: { path: resolve(runDir) },
        reason: { kind: error.code || error.name || "slide_edit_failed" },
        ...((error.issues || selectorIssues.length > 0) ? { issues: error.issues || selectorIssues } : {}),
        next: createCliNext(error.code === "missing_plan_sha256" ? "fix_arguments" : "edit_source", {
          requiresHuman,
          inspect: [{ path: resolve(runDir) }],
          default: requiresHuman
            ? "Stop for a choice among the bounded slide candidates, then rerun preview."
            : "Read current source, obtain a fresh preview, and retry without editing generated artifacts.",
        }),
      },
    });
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
  // commandStyleMaster emits the authoritative identity failure itself. Do not
  // wrap it in a second envelope at the root boundary.
  if (code === null) return 1;
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

async function resolveImage2Run(runDir, where) {
  const route = await resolveRunAdapter(runDir, where);
  if (!route) return null;
  const resolved = route.run_dir;
  const source = join(resolved, SLIDE_SPECS_NAME);
  if (route.adapter === "whole-page-image2") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "ppt_flow image2 refinement is not applicable to image2-only whole-page runs.",
      hint: "image2-only production uses whole-page generation through pilot/build, not the modern visual-slot refinement lifecycle.",
      where,
      diagnostic: { version: 1, category: "gate", operation: "image2-not-applicable", source: { path: source }, reason: { kind: "image2_refinement_not_applicable" }, next: createCliNext("rerun", { default: "Use pilot/build for image2-only whole-page production." }) },
    });
    return null;
  }
  if (route.mode === "html-only") {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Modern Image2 refinement is disabled for html-only runs.",
      hint: "Switch this run version to html-then-image2 (state --set-production-mode html-then-image2) to enable the refinement lifecycle.",
      where,
      diagnostic: { version: 1, category: "gate", operation: "image2-disabled", source: { path: source }, reason: { kind: "image2_refinement_disabled" }, next: createCliNext("rerun", { default: "Use html-then-image2 to make refinement a completion requirement." }) },
    });
    return null;
  }
  // html-then-image2: the shared resolver already verified the canonical
  // source marker before this refinement-specific branch runs.
  if (!existsSync(source)) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Modern Image2 refinement requires a marked HTML-first run.",
      hint: "Use the optional image2 route only after current HTML delivery review.",
      where,
      diagnostic: { version: 1, category: "gate", operation: "image2-ownership", source: { path: source }, reason: { kind: "html_first_marker_required" }, next: createCliNext("review", { requiresHuman: true, default: "Open the current HTML-first run and complete delivery review before entering refinement." }) },
    });
    return null;
  }
  return resolved;
}

async function createImage2CliTransport(runDir, baseUrl = null) {
  // Credential resolution is deliberately at the remote boundary. Offline
  // planning/authorization and abandon decisions must never touch it.
  loadDotenv(...buildEnvSearchDirs(deckRoot(runDir)));
  const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
  const credentials = resolveImage2Credentials({
    extraBaseUrls: baseUrl ? [baseUrl] : [],
  });
  const phase4 = await import("./04-image-production/index.mjs");
  return phase4.createModernRefinementTransport({ credentials });
}

const PAGE_AUTHORITY_IMAGE2_OPERATIONS = new Set(["plan", "authorize", "generate", "review", "accept"]);

function pageAuthorityDiagnosticReasonKind(value, fallback = "page_authority_operation_failed") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}

function pageAuthorityLegacyOverride(opts) {
  const forbidden = [
    ["slides", opts.slides],
    ["slot", opts.slotExplicit ? opts.slot : null],
    ["profile", opts.profile],
    ["base-url", opts.baseUrl],
    ["attempt-id", opts.attemptId],
    ["slide-id", opts.slideId],
    ["candidate-id", opts.candidateId],
    ["review-hash", opts.reviewHash],
    ["force", opts.force],
    ["reason", opts.reason],
    ["dry-run", opts.dryRun],
  ].find(([, value]) => value !== null && value !== undefined && value !== false);
  return forbidden ? forbidden[0] : null;
}

function imageDataUrl(path) {
  const extension = path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${extension};base64,${readFileSync(path).toString("base64")}`;
}

function imageBytesFromPageAuthorityProvider(payload) {
  const record = payload?.data && !Array.isArray(payload.data) ? payload.data
    : Array.isArray(payload?.data) ? payload.data[0]
      : payload;
  const encoded = record?.bytes_base64 || record?.b64_json || payload?.bytes_base64 || payload?.b64_json;
  if (typeof encoded !== "string" || !encoded.trim()) {
    const error = new Error("Page Authority provider returned no inline PNG bytes");
    error.code = "PAGE_AUTHORITY_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length) {
    const error = new Error("Page Authority provider returned empty PNG bytes");
    error.code = "PAGE_AUTHORITY_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  return bytes;
}

function pageAuthoritySubmitFactory(plan, operations) {
  const slideById = new Map(plan.receipt.slides.map((slide) => [slide.slide_id, slide]));
  return async ({ request }) => {
    const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
    const credentials = resolveImage2Credentials();
    const slide = slideById.get(request.slide_id);
    if (!slide) {
      const error = new Error("Page Authority provider request is not bound to the current receipt");
      error.code = "PAGE_AUTHORITY_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const references = [plan.style_master_path];
    const identityPath = slide.visual_language?.identity_reference?.provider_reference?.path;
    if (identityPath) references.push(identityPath);
    const images = references.map(imageDataUrl);
    const body = {
      model: request.generation_profile.provider.model,
      prompt: operations.pageAuthorityProviderPayloadForSubmit(request),
      n: 1,
      size: "2000x1125",
      image: images[0],
      images,
      image_urls: images,
    };
    let response;
    try {
      response = await fetch(`${credentials.base_url}/images/generations`, {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${credentials.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch {
      const error = new Error("Page Authority provider submission failed before a response");
      error.code = "PAGE_AUTHORITY_PROVIDER_SUBMIT_FAILED";
      throw error;
    }
    let payload;
    try {
      payload = JSON.parse(await response.text());
    } catch {
      const error = new Error("Page Authority provider response was not valid JSON");
      error.code = "PAGE_AUTHORITY_PROVIDER_RESPONSE_INVALID";
      throw error;
    }
    if (!response.ok) {
      const error = new Error(`Page Authority provider submission failed with HTTP ${response.status}`);
      error.code = "PAGE_AUTHORITY_PROVIDER_SUBMIT_FAILED";
      throw error;
    }
    return imageBytesFromPageAuthorityProvider(payload);
  };
}

async function commandPageAuthorityImage2(operation, route, opts = {}) {
  if (!PAGE_AUTHORITY_IMAGE2_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.image2.page-authority.operation", `Page Authority image2 operation ${JSON.stringify(operation)} is not supported`, "Use plan, authorize, generate, review, or accept for the receipt-bound raw lifecycle.");
  }
  const override = pageAuthorityLegacyOverride(opts);
  if (override) {
    return emitUsage("ppt_flow.image2.page-authority", `--${override} is not accepted for Page Authority`, "Use the canonical --run-dir receipt path without prompt, profile, output, or legacy-artifact overrides.");
  }
  try {
    const operations = await import("./04-image-production/index.mjs");
    let output;
    if (operation === "plan") {
      output = operations.pageAuthorityRawPlanProjection(operations.buildPageAuthorityRawPlan(route.run_dir));
    } else if (operation === "authorize") {
      if (!opts.planHash) return emitUsage("ppt_flow.image2.page-authority.authorize", "--plan-hash is required", "Pass the exact current Page Authority raw plan hash.");
      const result = operations.authorizePageAuthorityRawPlan(route.run_dir, { planHash: opts.planHash });
      output = {
        plan: operations.pageAuthorityRawPlanProjection(operations.buildPageAuthorityRawPlan(route.run_dir)),
        authorized: result.authorized,
        zero_submit: result.zero_submit === true,
      };
    } else if (operation === "generate") {
      if (!opts.planHash) return emitUsage("ppt_flow.image2.page-authority.generate", "--plan-hash is required", "Pass the exact authorized Page Authority raw plan hash.");
      const plan = operations.buildPageAuthorityRawPlan(route.run_dir);
      const result = await operations.generatePageAuthorityRawPlan(route.run_dir, {
        planHash: opts.planHash,
        submit: pageAuthoritySubmitFactory(plan, operations),
      });
      output = {
        plan: operations.pageAuthorityRawPlanProjection(operations.buildPageAuthorityRawPlan(route.run_dir)),
        submitted: result.submitted,
        raw_manifest_sha256: result.raw_manifest_sha256 || null,
      };
    } else if (operation === "review") {
      const result = await operations.preparePageAuthorityRawReview(route.run_dir);
      output = {
        plan: operations.pageAuthorityRawPlanProjection(operations.buildPageAuthorityRawPlan(route.run_dir)),
        projection_sha256: result.projection_sha256,
        decision: result.coverage.decision,
      };
    } else {
      if (!['proceed', 'repair', 'redirect'].includes(opts.decision)) {
        return emitUsage("ppt_flow.image2.page-authority.accept", "--decision must be proceed, repair, or redirect", "Record the explicit human raw-review decision for the current Page Authority evidence.");
      }
      const coverage = operations.decidePageAuthorityRawReview(route.run_dir, { decision: opts.decision });
      output = { decision: coverage.decision, decided_at: coverage.decided_at };
    }
    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    const errorDetail = `${error.code || ""} ${error.message || ""}`;
    const gateBlocked = /STALE|stale|RAW_REVIEW|AUTHORIZATION|RAW_EVIDENCE/i.test(errorDetail);
    const unauthorizedSubmit = /provider_authorization_required|AUTHORIZATION_(?:MISSING|SOURCE_EPOCH_STALE|EXECUTION_STALE|PROFILE_MISMATCH|SCOPE_MISMATCH|COUNT_EXCEEDED)/i.test(errorDetail);
    emitCliError({
      code: gateBlocked ? CLI_ERROR_CODES.GATE_BLOCKED : CLI_ERROR_CODES.FAILED,
      message: error.message || "Page Authority Image2 operation failed.",
      hint: gateBlocked
        ? unauthorizedSubmit
          ? "Record or repair the exact current raw-submit authorization before requesting another provider submission."
          : "Rebuild the receipt-bound raw plan or review evidence, then take the owner-issued next action."
        : "Repair the canonical Page Authority source, local evidence, or configured provider readiness before retrying.",
      where: `ppt_flow.image2.page-authority.${operation}`,
      diagnostic: {
        version: 1,
        category: gateBlocked ? "gate" : "provider",
        operation: `page-authority-${operation}`,
        source: { path: route.run_dir },
        reason: { kind: pageAuthorityDiagnosticReasonKind(error.code) },
        next: createCliNext("repair_prerequisite", {
          default: gateBlocked
            ? unauthorizedSubmit
              ? "Use the current receipt-bound raw plan to record exact authorization before generate; do not retry a provider submit first."
              : "Repair the exact current Page Authority raw plan or review evidence before retrying."
            : "Repair the named Page Authority prerequisite without using a direct provider override.",
        }),
      },
    });
    return 1;
  }
}

async function commandImage2(operation, runDir, opts = {}) {
  const route = await resolveRunAdapter(runDir, `ppt_flow.image2.${operation}.identity`, { allowPageAuthority: true });
  if (!route) return 1;
  if (route.adapter === "page-authority-image2") return commandPageAuthorityImage2(operation, route, opts);
  const allowed = new Set(["plan", "authorize", "generate", "accept", "use-html", "cleanup", "unknown-submit", "resolve-unknown-submit"]);
  if (!allowed.has(operation)) return emitUsage("ppt_flow.image2.operation", `unknown image2 operation ${JSON.stringify(operation)}`, `Use one of: plan, authorize, generate, accept, use-html, cleanup, unknown-submit`);
  const resolved = await resolveImage2Run(runDir, `ppt_flow.image2.${operation}`);
  if (!resolved) return 1;
  if (opts.force && operation !== "plan") {
    return emitUsage(`ppt_flow.image2.${operation}`, "--force applies only to image2 plan", "Use --force --reason only for an explicit offline prerequisite waiver.");
  }
  const remoteReconciliation = ["unknown-submit", "resolve-unknown-submit"].includes(operation) && opts.decision === "retain" && !opts.candidateId;
  if (opts.baseUrl && operation !== "generate" && !remoteReconciliation) {
    return emitUsage(`ppt_flow.image2.${operation}`, "--base-url applies only to provider generation or retain reconciliation", "Use --base-url only when the command will initialize the authorized provider transport.");
  }
  if (!opts.force && opts.reason != null) {
    return emitUsage(`ppt_flow.image2.${operation}`, "--reason applies only to image2 plan --force", "Remove --reason or add --force to an offline plan continuation.");
  }
  if (operation === "plan" && opts.force && !String(opts.reason || "").trim()) {
    return emitUsage("ppt_flow.image2.plan", "image2 plan --force requires --reason", "Provide a bounded human reason for the explicit delivery prerequisite waiver.");
  }
  try {
    const ops = await import("./04-image-production/index.mjs");
    const slides = opts.slides ? String(opts.slides).split(",").map((id) => id.trim()).filter(Boolean).map((slide_id) => ({ slide_id, slot: opts.slot || "primary_visual" })) : null;
    let result;
    if (operation === "plan") {
      result = await ops.createRefinementPlan({
        runDir: resolved,
        slides,
        profileFingerprint: opts.profile || null,
        force: opts.force === true,
        reason: opts.reason || null,
      });
    } else if (operation === "authorize") {
      if (!opts.planHash) return emitUsage("ppt_flow.image2.authorize", "--plan-hash is required", "Pass the exact deterministic hash printed by image2 plan");
      result = await ops.authorizeRefinement({ runDir: resolved, planHash: opts.planHash });
    } else if (operation === "generate") {
      if (!opts.attemptId) return emitUsage("ppt_flow.image2.generate", "--attempt-id is required", "Pass one persisted planned attempt ID; retries require a new plan");
      result = await ops.generateRefinement({
        runDir: resolved,
        attemptId: opts.attemptId,
        transportFactory: () => createImage2CliTransport(resolved, opts.baseUrl || null),
      });
    } else if (operation === "accept") {
      if (!opts.slideId || !opts.candidateId) return emitUsage("ppt_flow.image2.accept", "--slide-id and --candidate-id are required", "Pass the exact reviewed page and immutable candidate ID");
      result = await ops.acceptRefinementCandidate({ runDir: resolved, slideId: opts.slideId, candidateId: opts.candidateId });
    } else if (operation === "use-html") {
      if (!opts.slideId) return emitUsage("ppt_flow.image2.use-html", "--slide-id is required", "Pass the exact reviewed page ID");
      result = await ops.useHtmlRefinement({ runDir: resolved, slideId: opts.slideId, candidateId: opts.candidateId || null });
    } else if (operation === "cleanup") {
      result = await ops.cleanupRefinementEvidence({ runDir: resolved, expectedReviewSha256: opts.reviewHash || null, dryRun: opts.dryRun === true });
    } else {
      if (!opts.attemptId || !opts.decision) return emitUsage(`ppt_flow.image2.${operation}`, "--attempt-id and --decision are required", "Resolve an unknown-submit attempt with --decision retain or abandon");
      if (opts.decision === "retain" && opts.candidateId) result = await ops.resolveUnknownSubmit({ runDir: resolved, attemptId: opts.attemptId, decision: "retain", candidateId: opts.candidateId });
      else if (opts.decision === "retain") {
        result = await ops.reconcileRefinementAttempt({
          runDir: resolved,
          attemptId: opts.attemptId,
          transportFactory: () => createImage2CliTransport(resolved, opts.baseUrl || null),
        });
      }
      else result = await ops.resolveUnknownSubmit({ runDir: resolved, attemptId: opts.attemptId, decision: opts.decision, candidateId: opts.candidateId || null });
    }
    const output = operation === "plan"
      ? { ...result, force_not_needed: result.force_not_needed === true }
      : result;
    if (opts.json) console.log(JSON.stringify(output, null, 2));
    else console.log(JSON.stringify(output));
    return 0;
  } catch (error) {
    const stale = /STALE|stale|drift/i.test(error.message || "");
    emitCliError({
      code: stale ? CLI_ERROR_CODES.GATE_BLOCKED : CLI_ERROR_CODES.FAILED,
      message: error.message || "Image2 refinement failed.",
      hint: stale ? "Re-run image2 plan and authorize the exact current hash; do not retry a chargeable attempt." : "Inspect the retained Phase-4 state and follow the safe human-action diagnostic.",
      where: `ppt_flow.image2.${operation}`,
      diagnostic: { version: 1, category: stale ? "gate" : "provider", operation: `image2-${operation}`, source: { path: resolved }, reason: { kind: stale ? "stale_plan_or_source" : "refinement_operation_failed" }, next: createCliNext(stale ? "review" : "inspect", { requiresHuman: stale, default: stale ? "Obtain a fresh plan hash and explicit authorization." : "Inspect the exact attempt/candidate state before taking another action." }) },
    });
    return 1;
  }
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
  ppt_flow.mjs slides list deck_mydeck/3_versions/v1
  ppt_flow.mjs slides move deck_mydeck/3_versions/v1 7 --after 3
  ppt_flow.mjs new-version deck_mydeck/3_versions/v1 --name v2
  ppt_flow.mjs test
  ppt_flow.mjs state deck_mydeck/3_versions/v1 --check-gates
  ppt_flow.mjs image2 plan deck_mydeck/3_versions/v1
`
    );

  // ---- doctor ----
  program
    .command("doctor")
    .description("Check offline local runtime and optional Image2 readiness")
    .option("--image2", "Add offline Image2 presence checks (no provider submit)")
    .option("--mode <mode>", "Scope checks to a production mode: html-only|html-then-image2|image2-only|image2-page-authority")
    .option("--run-dir <runDir>", "Resolve the exact run's production mode and scope checks to it")
    .option("--operation <operation>", "Run-bound Page Authority operation: framed-local-refresh|raw-generation|full-build|assembly-notes")
    .option("--smoke", "Add Image2 presence plus one live first-vendor submit")
    .option(
      "--probe-vendors",
      "Add Image2 presence and live-probe every resolved vendor (not --smoke)"
    )
    .action(async (opts) => {
      if (opts.smoke && opts.probeVendors) {
        exitUsage(
          "ppt_flow.doctor",
          "--smoke and --probe-vendors are mutually exclusive.",
          "Use --smoke for the first-vendor gate or --probe-vendors for the full channel report"
        );
      }
      const selectors = Number(Boolean(opts.image2)) + Number(Boolean(opts.mode)) + Number(Boolean(opts.runDir));
      if (selectors > 1) {
        exitUsage(
          "ppt_flow.doctor",
          "--image2, --mode, and --run-dir are mutually exclusive.",
          "Use one scope selector: --mode <mode>, --run-dir <run>, or the compatibility --image2."
        );
      }
      if (opts.operation && !opts.runDir) {
        exitUsage("ppt_flow.doctor", "--operation requires --run-dir", "Bind the operation to an exact Page Authority run so source/state validation happens before readiness checks.");
      }
      const code = await commandDoctor({
        image2: opts.image2 ?? false,
        smoke: opts.smoke ?? false,
        probeVendors: opts.probeVendors ?? false,
        mode: opts.mode ?? null,
        runDir: opts.runDir ?? null,
        operation: opts.operation ?? null,
      });
      if (code === null) {
        process.exit(1);
        return;
      }
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
    .option(
      "--mode <mode>",
      `New-deck production mode: ${DEFAULT_INIT_MODE} (default: ${DEFAULT_INIT_MODE})`
    )
    .action(async (deckDir, opts) => {
      const code = commandInit(deckDir, {
        deckType: opts.deckType,
        style: opts.style,
        mode: opts.mode,
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
    .option("--reason <text>", "For HTML --waive or header risk acceptance: persisted human reason")
    .option("--plan-hash <hash>", "Exact current HTML content/visual review plan hash")
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
        : await commandApprove(runDir, gate, { waive: opts.waive ?? false, planHash: opts.planHash || null, reason: opts.reason || null });
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
        wholePageControlsExplicit: hasExplicitCliOption("--resolution") || hasExplicitCliOption("--model"),
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
    .option("--force", "Explicitly waive reversible pending HTML gate evidence")
    .option("--reason <text>", "Bounded human reason required with HTML --force")
    .option("--dry-run", "Print what would be executed")
    .action(async (runDir, opts) => {
      validateResolution("ppt_flow.build.resolution", opts.resolution);
      const code = await commandBuildWrapped(runDir, {
        resolution: opts.resolution,
        model: opts.model,
        baseUrl: opts.baseUrl || null,
        reuseImages: opts.reuseImages ?? false,
        dryRun: opts.dryRun ?? false,
        force: opts.force ?? false,
        reason: opts.reason || null,
        wholePageControlsExplicit: hasExplicitCliOption("--resolution") || hasExplicitCliOption("--model"),
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
    .option("--confirm-run-version <vN>", "Exact run version confirmation for reset-html-production")
    .action(async (runDir, opts) => {
      if (!["title", "visual", "notes", "reset-html-production"].includes(opts.kind)) {
        exitUsage("ppt_flow.refresh.kind", "--kind must be title, visual, notes, or reset-html-production.", "Pass a supported refresh kind");
      }
      validateResolution("ppt_flow.refresh.resolution", opts.resolution);
      const code = await commandRefresh(runDir, {
        kind: opts.kind,
        only: opts.only || null,
        all: opts.all ?? false,
        resolution: opts.resolution,
        baseUrl: opts.baseUrl || null,
        dryRun: opts.dryRun ?? false,
        confirmRunVersion: opts.confirmRunVersion || null,
        wholePageControlsExplicit: hasExplicitCliOption("--resolution"),
      });
      process.exit(code);
    });

  // ---- slides ----
  program
    .command("slides")
    .description("Preview and apply stable-ID slide order edits")
    .argument("<subcommand>", "list, resolve, normalize, move, delete, insert, or apply-plan")
    .argument("<run_dir>", "Path to current version dir")
    .argument("[selectors...]", "Slide selectors for resolve/move/delete")
    .option("--after <selector>", "Place target after snapshot selector")
    .option("--before <selector>", "Place target before snapshot selector")
    .option("--to <edge>", "Place target at start or end")
    .option("--source <path>", "Insert source containing one complete slide block")
    .option("--plan <path>", "Persisted edit plan under current _scratch/")
    .option("--apply", "Apply the confirmed preview")
    .option("--plan-sha256 <hash>", "Canonical hash from the confirmed preview")
    .option("--json", "Output one machine-readable report")
    .action(async (subcommand, runDir, selectors, opts) => {
      const allowed = new Set(["list", "resolve", "normalize", "move", "delete", "insert", "apply-plan"]);
      if (!allowed.has(subcommand)) {
        exitUsage("ppt_flow.slides.subcommand", `unknown slides subcommand ${JSON.stringify(subcommand)}`, `Use one of: ${[...allowed].join(", ")}`);
      }
      if (opts.json) setCliOutputMode("json");
      const args = selectors || [];
      if (subcommand === "resolve" && args.length === 0) {
        exitUsage("ppt_flow.slides.resolve", "resolve requires at least one selector", "Pass one or more position, ID, or title selectors");
      }
      if (subcommand === "move" && args.length !== 1) {
        exitUsage("ppt_flow.slides.move", "move requires exactly one target selector", "Pass one target plus --after, --before, or --to");
      }
      if (subcommand === "delete" && args.length === 0) {
        exitUsage("ppt_flow.slides.delete", "delete requires at least one selector", "Pass one or more snapshot selectors");
      }
      if (subcommand === "insert" && !opts.source) {
        exitUsage("ppt_flow.slides.insert", "insert requires --source", "Pass --source <one-slide-block.md>");
      }
      if (subcommand === "apply-plan" && !opts.plan) {
        exitUsage("ppt_flow.slides.apply-plan", "apply-plan requires --plan", "Pass a plan file inside the current version _scratch/");
      }
      if (opts.to && !["start", "end"].includes(opts.to)) {
        exitUsage("ppt_flow.slides.to", "--to must be start or end", "Pass --to start or --to end");
      }
      const code = await commandSlides(subcommand, runDir, args, {
        after: opts.after,
        before: opts.before,
        to: opts.to,
        source: opts.source,
        plan: opts.plan,
        apply: opts.apply ?? false,
        planSha256: opts.planSha256 || null,
        json: opts.json ?? false,
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
    .option("--validate-state", "Validate persisted state and evidence without writing")
    .option("--recover-gate-journal <ownerToken>", "Explicitly recover an abandoned HTML gate journal")
    .option("--record-delivery-review <decision>", "Record HTML delivery review: proceed, repair, or redirect")
    .option("--plan-hash <hash>", "Exact production-mode transition preview plan hash")
    .option("--prepare-production-mode-transition <mode>", "Prepare a cross-pipeline target candidate")
    .option("--preview-production-mode-transition", "Preview the prepared cross-pipeline target candidate")
    .option("--confirm-production-mode-transition", "Confirm the exact cross-pipeline target preview")
    .option("--apply-production-mode-transition", "Publish and hand off an exact confirmed cross-pipeline transition")
    .option("--confirm-production-mode-transition-recovery <ownerToken>", "Record an exact old-enough uncertain transition-journal confirmation")
    .option("--recover-production-mode-transition [ownerToken]", "Recover an exact transition journal or visible target")
    .option("--inspect-legacy-protocol", "Read the exact legacy/Page Authority protocol classification without writing")
    .option("--prepare-legacy-adoption", "Prepare the fixed Page Authority adoption candidate")
    .option("--preview-legacy-adoption", "Preview the prepared Page Authority adoption candidate")
    .option("--confirm-legacy-adoption", "Confirm the exact Page Authority adoption preview")
    .option("--apply-legacy-adoption", "Publish and hand off an exact confirmed legacy adoption")
    .option("--confirm-legacy-adoption-recovery <ownerToken>", "Record an exact old-enough uncertain legacy-adoption journal confirmation")
    .option("--recover-legacy-adoption [ownerToken]", "Recover an exact legacy-adoption journal or visible target")
    .option("--force", "For --record-delivery-review proceed: waive a reversible HTML evidence risk")
    .option("--reason <text>", "Required for repair/redirect and forced proceed decisions")
    .option("--set-production-mode <mode>", "Set the exact run version's production mode (same-pipeline html-only<->html-then-image2)")
    .option("--repair-production-mode-mirror", "Rewrite the metadata production-mode mirror from authoritative state")
    .option("--register-production-mode-from <sourceRunDir>", "Register this (target) version's mode from a same-pipeline source version")
    .option("--record-image2-delivery-review <decision>", "Record first-class image2-only delivery review: proceed, repair, or redirect")
    .option("--record-page-authority-delivery-review <decision>", "Record Page Authority delivery review: proceed, repair, or redirect")
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      // Validate the closed state grammar before resolving a run, importing a
      // state owner, or probing source. Mixed forms must be a zero-read/zero-
      // write USAGE failure.
      const transitionOperations = Number(Boolean(opts.prepareProductionModeTransition)) + Number(Boolean(opts.previewProductionModeTransition)) + Number(Boolean(opts.confirmProductionModeTransition)) + Number(Boolean(opts.applyProductionModeTransition)) + Number(Boolean(opts.confirmProductionModeTransitionRecovery)) + Number(Boolean(opts.recoverProductionModeTransition)) + Number(Boolean(opts.inspectLegacyProtocol)) + Number(Boolean(opts.prepareLegacyAdoption)) + Number(Boolean(opts.previewLegacyAdoption)) + Number(Boolean(opts.confirmLegacyAdoption)) + Number(Boolean(opts.applyLegacyAdoption)) + Number(Boolean(opts.confirmLegacyAdoptionRecovery)) + Number(Boolean(opts.recoverLegacyAdoption));
      const specialOperations = Number(Boolean(opts.recoverGateJournal)) + Number(Boolean(opts.recordDeliveryReview)) + Number(Boolean(opts.validateState)) + transitionOperations + Number(Boolean(opts.setProductionMode)) + Number(Boolean(opts.repairProductionModeMirror)) + Number(Boolean(opts.registerProductionModeFrom)) + Number(Boolean(opts.recordImage2DeliveryReview)) + Number(Boolean(opts.recordPageAuthorityDeliveryReview));
      if (specialOperations > 1 || (specialOperations > 0 && (opts.json || opts.checkGates))) {
        emitUsage("ppt_flow.state", "state repair/evidence operations are mutually exclusive with --json/--check-gates and each other", "Run one closed state operation at a time.");
        process.exitCode = 1;
        return;
      }
      if (opts.force && !opts.recordDeliveryReview) {
        emitUsage("ppt_flow.state", "--force applies only to --record-delivery-review proceed", "Use --force together with proceed and a bounded --reason.");
        process.exitCode = 1;
        return;
      }
      if (opts.reason != null && !opts.recordDeliveryReview && !opts.recordImage2DeliveryReview && !opts.recordPageAuthorityDeliveryReview && !opts.setProductionMode) {
        emitUsage("ppt_flow.state", "--reason applies only to a delivery-review operation or --set-production-mode", "Use --reason with a closed state operation that accepts it.");
        process.exitCode = 1;
        return;
      }
      if (opts.planHash && !opts.confirmProductionModeTransition && !opts.applyProductionModeTransition && !opts.confirmLegacyAdoption && !opts.applyLegacyAdoption) {
        emitUsage("ppt_flow.state", "--plan-hash applies only to production-mode-transition or legacy-adoption confirmation or apply", "Use the exact preview hash with one closed confirmation or apply operation.");
        process.exitCode = 1;
        return;
      }
      const {
        readState,
        isGateApproved,
        buildResumeCard,
        statePath,
        projectImage2RefinementState,
      } = await import("./shared/state/state.mjs");
      const resolved = resolve(runDir);
      const deckDir = deckRoot(resolved);
      const canonicalSource = join(resolved, SLIDE_SPECS_NAME);
      let htmlFirst = false;
      if (existsSync(canonicalSource)) {
        const { HTML_FIRST_PIPELINE, probeProductionMarker } = await import("./03-html-production/index.mjs");
        const marker = probeProductionMarker(readFileSync(canonicalSource), { source: SLIDE_SPECS_NAME });
        htmlFirst = marker.branch === HTML_FIRST_PIPELINE;
      }
      if ((opts.recoverGateJournal || opts.recordDeliveryReview) && !htmlFirst) {
        emitUsage("ppt_flow.state", "HTML state operations are inapplicable to whole-page Image2 runs", "Use the matching whole-page production route.");
        process.exitCode = 1;
        return;
      }
      if (opts.inspectLegacyProtocol) {
        try {
          const { inspectLegacyProtocol } = await import("./shared/state/legacy_protocol_adoption.mjs");
          const result = inspectLegacyProtocol(resolved);
          console.log(JSON.stringify({ operation: "inspect-legacy-protocol", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.inspect-legacy-protocol", error.message, "Inspect the canonical source/state pair and repair only its owning protocol boundary.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.prepareProductionModeTransition) {
        const genericTransitionModes = PRODUCTION_MODES.filter((mode) => mode !== "image2-page-authority");
        if (!genericTransitionModes.includes(opts.prepareProductionModeTransition)) {
          emitUsage("ppt_flow.state.prepare-production-mode-transition", `target mode must be one of ${genericTransitionModes.join(", ")}`, "Use --prepare-legacy-adoption for the fixed Page Authority target.");
          process.exitCode = 1;
          return;
        }
        try {
          const { prepareProductionModeTransition } = await import("./shared/state/production_mode_transition.mjs");
          const result = await prepareProductionModeTransition(resolved, { targetMode: opts.prepareProductionModeTransition });
          console.log(JSON.stringify({ operation: "prepare-production-mode-transition", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.prepare-production-mode-transition", error.message, "Resolve the selected source mode or candidate ownership conflict, then retry the closed prepare operation.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.prepareLegacyAdoption) {
        try {
          const { prepareLegacyProtocolAdoption } = await import("./shared/state/production_mode_transition.mjs");
          const result = await prepareLegacyProtocolAdoption(resolved);
          console.log(JSON.stringify({ operation: "prepare-legacy-adoption", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.prepare-legacy-adoption", error.message, "Inspect the exact source/state pair, then author only the confined Page Authority candidate inputs.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.previewProductionModeTransition) {
        try {
          const { previewProductionModeTransition } = await import("./shared/state/production_mode_transition.mjs");
          const result = await previewProductionModeTransition(resolved);
          console.log(JSON.stringify({ operation: "preview-production-mode-transition", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.preview-production-mode-transition", error.message, "Complete the target-owned candidate fields or prepare a fresh transition preview.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.previewLegacyAdoption) {
        try {
          const { previewLegacyProtocolAdoption } = await import("./shared/state/production_mode_transition.mjs");
          const result = await previewLegacyProtocolAdoption(resolved);
          console.log(JSON.stringify({ operation: "preview-legacy-adoption", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.preview-legacy-adoption", error.message, "Complete the confined Page Authority candidate and exact adoption matrix, then prepare a fresh preview.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.confirmProductionModeTransition) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.planHash || "")) {
          emitUsage("ppt_flow.state.confirm-production-mode-transition", "confirmation requires only --plan-hash <64-lowercase-hex>", "Copy the exact production-mode transition preview hash.");
          process.exitCode = 1;
          return;
        }
        try {
          const { confirmPreparedProductionModeTransition } = await import("./shared/state/production_mode_transition.mjs");
          const result = await confirmPreparedProductionModeTransition(resolved, { planHash: opts.planHash });
          console.log(JSON.stringify({ operation: "confirm-production-mode-transition", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.confirm-production-mode-transition", error.message, "Reinspect the unchanged source and candidate, then confirm only the exact current transition preview.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.confirmLegacyAdoption) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.planHash || "")) {
          emitUsage("ppt_flow.state.confirm-legacy-adoption", "confirmation requires only --plan-hash <64-lowercase-hex>", "Copy the exact legacy-adoption preview hash.");
          process.exitCode = 1;
          return;
        }
        try {
          const { confirmPreparedLegacyProtocolAdoption } = await import("./shared/state/production_mode_transition.mjs");
          const result = await confirmPreparedLegacyProtocolAdoption(resolved, { planHash: opts.planHash });
          console.log(JSON.stringify({ operation: "confirm-legacy-adoption", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.confirm-legacy-adoption", error.message, "Reinspect the unchanged legacy source and Page Authority candidate, then confirm only the exact current adoption preview.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.applyProductionModeTransition) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.planHash || "")) {
          emitUsage("ppt_flow.state.apply-production-mode-transition", "apply requires only --plan-hash <64-lowercase-hex>", "Apply only the exact confirmed production-mode transition hash.");
          process.exitCode = 1;
          return;
        }
        try {
          const { applyProductionModeTransition } = await import("./shared/state/production_mode_transition.mjs");
          const result = await applyProductionModeTransition(resolved, { planHash: opts.planHash });
          console.log(JSON.stringify({ operation: "apply-production-mode-transition", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.apply-production-mode-transition", error.message, "Use the exact active transition checkpoint or its closed recovery operation; do not edit state or generated artifacts manually.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.applyLegacyAdoption) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.planHash || "")) {
          emitUsage("ppt_flow.state.apply-legacy-adoption", "apply requires only --plan-hash <64-lowercase-hex>", "Apply only the exact confirmed legacy-adoption hash.");
          process.exitCode = 1;
          return;
        }
        try {
          const { applyLegacyProtocolAdoption } = await import("./shared/state/production_mode_transition.mjs");
          const result = await applyLegacyProtocolAdoption(resolved, { planHash: opts.planHash });
          console.log(JSON.stringify({ operation: "apply-legacy-adoption", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.apply-legacy-adoption", error.message, "Use the exact active adoption checkpoint or its closed recovery operation; do not edit state or generated artifacts manually.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.confirmProductionModeTransitionRecovery) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.confirmProductionModeTransitionRecovery)) {
          emitUsage("ppt_flow.state.confirm-production-mode-transition-recovery", "--confirm-production-mode-transition-recovery requires a 64-lowercase-hex owner token", "Use the exact opaque token from the uncertain-owner recovery diagnostic.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recordActiveProductionModeTransitionRecoveryConfirmation } = await import("./shared/state/state.mjs");
          const result = recordActiveProductionModeTransitionRecoveryConfirmation(deckDir, {
            sourceRunVersion: basename(resolved),
            ownerToken: opts.confirmProductionModeTransitionRecovery,
          });
          console.log(JSON.stringify({ operation: "confirm-production-mode-transition-recovery", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.confirm-production-mode-transition-recovery", error.message, "Re-inspect the exact active transition journal and retry only its matching owner token after the required age.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.confirmLegacyAdoptionRecovery) {
        if (!MIGRATION_PLAN_SHA_RE.test(opts.confirmLegacyAdoptionRecovery)) {
          emitUsage("ppt_flow.state.confirm-legacy-adoption-recovery", "--confirm-legacy-adoption-recovery requires a 64-lowercase-hex owner token", "Use the exact opaque token from the uncertain-owner recovery diagnostic.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recordActiveProductionModeTransitionRecoveryConfirmation } = await import("./shared/state/state.mjs");
          const result = recordActiveProductionModeTransitionRecoveryConfirmation(deckDir, {
            sourceRunVersion: basename(resolved),
            ownerToken: opts.confirmLegacyAdoptionRecovery,
          });
          console.log(JSON.stringify({ operation: "confirm-legacy-adoption-recovery", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.confirm-legacy-adoption-recovery", error.message, "Re-inspect the exact active adoption journal and retry only its matching owner token after the required age.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.recoverProductionModeTransition) {
        const ownerToken = opts.recoverProductionModeTransition === true ? null : opts.recoverProductionModeTransition;
        if (ownerToken !== null && !MIGRATION_PLAN_SHA_RE.test(ownerToken)) {
          emitUsage("ppt_flow.state.recover-production-mode-transition", "recovery owner token must be a 64-lowercase-hex token", "Pass no token for an exact visible target or the exact token for an uncertain journal.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recoverProductionModeTransition } = await import("./shared/state/production_mode_transition.mjs");
          const result = await recoverProductionModeTransition(resolved, { ownerToken });
          console.log(JSON.stringify({ operation: "recover-production-mode-transition", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.recover-production-mode-transition", error.message, "Follow the producer-owned journal or visible-target recovery checkpoint without replacing source work.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.recoverLegacyAdoption) {
        const ownerToken = opts.recoverLegacyAdoption === true ? null : opts.recoverLegacyAdoption;
        if (ownerToken !== null && !MIGRATION_PLAN_SHA_RE.test(ownerToken)) {
          emitUsage("ppt_flow.state.recover-legacy-adoption", "recovery owner token must be a 64-lowercase-hex token", "Pass no token for an exact visible target or the exact token for an uncertain adoption journal.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recoverLegacyProtocolAdoption } = await import("./shared/state/production_mode_transition.mjs");
          const result = await recoverLegacyProtocolAdoption(resolved, { ownerToken });
          console.log(JSON.stringify({ operation: "recover-legacy-adoption", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.recover-legacy-adoption", error.message, "Follow the producer-owned adoption journal or visible-target recovery checkpoint without replacing source work.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.validateState) {
        // This closed diagnostic operation always returns its bounded report,
        // including when the failure envelope makes the process exit non-zero.
        setCliOutputMode("json");
        const { validateStateReadOnly } = await import("./shared/state/state.mjs");
        const result = validateStateReadOnly(deckDir, { runDir: resolved });
        const report = { operation: "validate-state", ...result };
        registerCliJsonReport(report);
        console.log(JSON.stringify(report));
        if (!result.valid) {
          emitCliError({
            code: CLI_ERROR_CODES.STATE_CORRUPTED,
            message: "State validation found bounded record or evidence mismatches.",
            hint: "Use the reported field paths to rebuild artifacts or repair the owning state record through its public workflow.",
            where: "ppt_flow.state.validate-state",
            diagnostic: {
              version: 1,
              category: "artifact",
              operation: "validate-state",
              reason: { kind: "state_validation_failed" },
              issues: result.issues,
              next: createCliNext("repair_prerequisite", { default: "Repair the named state or evidence prerequisite, then validate again." }),
            },
          });
          process.exitCode = 1;
        }
        return;
      }
      if (opts.recoverGateJournal) {
        if (!/^[0-9a-f]{64}$/.test(opts.recoverGateJournal)) {
          emitUsage("ppt_flow.state.recover-gate-journal", "--recover-gate-journal requires a 64-lowercase-hex owner token", "Use the exact opaque token shown by plain state/status.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recoverHtmlGatePublication } = await import("./shared/state/html_review_evidence.mjs");
          const result = recoverHtmlGatePublication(resolved, { confirmedOwnerToken: opts.recoverGateJournal });
          console.log(JSON.stringify({ operation: "recover-gate-journal", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.recover-gate-journal", error.message, "Confirm that the exact journal owner stopped and retry after the required recovery age.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.recordDeliveryReview) {
        if (!new Set(["proceed", "repair", "redirect"]).has(opts.recordDeliveryReview)) {
          emitUsage("ppt_flow.state.record-delivery-review", "delivery decision must be proceed, repair, or redirect", "Choose one of the declared final-review decisions.");
          process.exitCode = 1;
          return;
        }
        if (opts.force && opts.recordDeliveryReview !== "proceed") {
          emitUsage("ppt_flow.state.record-delivery-review", "--force is valid only with proceed", "Use --force --reason only for an explicit proceed continuation.");
          process.exitCode = 1;
          return;
        }
        if (opts.recordDeliveryReview === "proceed" && !opts.force && opts.reason != null) {
          emitUsage("ppt_flow.state.record-delivery-review", "proceed forbids --reason", "Remove --reason for a proceed decision.");
          process.exitCode = 1;
          return;
        }
        if (opts.recordDeliveryReview === "proceed" && opts.force && !String(opts.reason || "").trim()) {
          emitUsage("ppt_flow.state.record-delivery-review", "forced proceed requires --reason", "Provide a bounded durable reason for the evidence waiver.");
          process.exitCode = 1;
          return;
        }
        if (["repair", "redirect"].includes(opts.recordDeliveryReview) && !String(opts.reason || "").trim()) {
          emitUsage("ppt_flow.state.record-delivery-review", `${opts.recordDeliveryReview} requires --reason`, "Provide a bounded durable human reason.");
          process.exitCode = 1;
          return;
        }
        try {
          const { publishHtmlDeliveryDecision } = await import("./shared/state/html_review_evidence.mjs");
          const result = publishHtmlDeliveryDecision(resolved, { decision: opts.recordDeliveryReview, reason: opts.reason, force: opts.force === true });
          console.log(JSON.stringify({ operation: "record-delivery-review", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.record-delivery-review", error.message, "Show the current contact sheet/PPTX/notes evidence and retry the exact final-review decision.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.setProductionMode) {
        if (!PRODUCTION_MODES.includes(opts.setProductionMode)) {
          emitUsage("ppt_flow.state.set-production-mode", `mode must be one of ${[...PRODUCTION_MODES].join(", ")}`, "Cross-pipeline html-*<->image2-only transitions are deferred to versioned transitions.");
          process.exitCode = 1;
          return;
        }
        try {
          const { transitionProductionMode } = await import("./shared/state/state.mjs");
          const result = transitionProductionMode(deckDir, { runDir: resolved, toMode: opts.setProductionMode, reason: opts.reason });
          if (!result.ok) {
            const guidance = result.code === "transition_required"
              ? "Cross-pipeline transitions require a versioned transition (deferred). Use --mode at init or the structural versioning path."
              : "Register the exact current run version's production mode first.";
            emitFailed(`ppt_flow.state.set-production-mode.${result.code}`, `production-mode transition not applied: ${result.code}`, guidance);
            process.exitCode = 1;
            return;
          }
          console.log(JSON.stringify({ operation: "set-production-mode", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.set-production-mode", error.message, "Resolve the reported state/marker conflict and retry the same-pipeline transition.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.repairProductionModeMirror) {
        try {
          const { repairProductionModeMirror } = await import("./shared/state/state.mjs");
          const result = repairProductionModeMirror(deckDir, { runDir: resolved });
          if (!result.ok) {
            emitFailed(`ppt_flow.state.repair-production-mode-mirror.${result.code}`, `mirror not repaired: ${result.code}`, "Ensure the exact run version has an authoritative production mode, then retry.");
            process.exitCode = 1;
            return;
          }
          console.log(JSON.stringify({ operation: "repair-production-mode-mirror", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.repair-production-mode-mirror", error.message, "Retry the mirror repair after resolving the reported state issue.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.registerProductionModeFrom) {
        try {
          const { registerProductionModeFromSource } = await import("./shared/state/state.mjs");
          const sourceVersion = basename(resolve(opts.registerProductionModeFrom));
          const result = registerProductionModeFromSource(deckDir, { sourceRunVersion: sourceVersion, targetRunVersion: basename(resolved) });
          if (!result.ok) {
            emitFailed(`ppt_flow.state.register-production-mode-from.${result.code}`, `mode not registered: ${result.code}`, "Verify the source/target same-pipeline relationship and the source's authoritative mode, then retry.");
            process.exitCode = 1;
            return;
          }
          console.log(JSON.stringify({ operation: "register-production-mode-from", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.register-production-mode-from", error.message, "Retry the idempotent registration after resolving the reported relationship/state issue.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.recordImage2DeliveryReview) {
        if (!new Set(["proceed", "repair", "redirect"]).has(opts.recordImage2DeliveryReview)) {
          emitUsage("ppt_flow.state.record-image2-delivery-review", "decision must be proceed, repair, or redirect", "Choose one of the declared first-class image2 final-review decisions.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recordImage2DeliveryReview } = await import("./shared/state/state.mjs");
          const result = recordImage2DeliveryReview(deckDir, { runDir: resolved, decision: opts.recordImage2DeliveryReview, reason: opts.reason });
          console.log(JSON.stringify({ operation: "record-image2-delivery-review", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.record-image2-delivery-review", error.message, "Show the current whole-page contact sheet/PPTX/notes/header evidence and retry the exact final-review decision.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.recordPageAuthorityDeliveryReview) {
        if (!new Set(["proceed", "repair", "redirect"]).has(opts.recordPageAuthorityDeliveryReview)) {
          emitUsage("ppt_flow.state.record-page-authority-delivery-review", "decision must be proceed, repair, or redirect", "Choose one of the declared Page Authority final-review decisions.");
          process.exitCode = 1;
          return;
        }
        if (opts.recordPageAuthorityDeliveryReview === "proceed" && opts.reason != null) {
          emitUsage("ppt_flow.state.record-page-authority-delivery-review", "proceed forbids --reason", "Remove --reason for a proceed decision.");
          process.exitCode = 1;
          return;
        }
        if (["repair", "redirect"].includes(opts.recordPageAuthorityDeliveryReview) && !String(opts.reason || "").trim()) {
          emitUsage("ppt_flow.state.record-page-authority-delivery-review", `${opts.recordPageAuthorityDeliveryReview} requires --reason`, "Provide a bounded durable human reason.");
          process.exitCode = 1;
          return;
        }
        try {
          const { recordPageAuthorityDeliveryReview } = await import("./shared/state/state.mjs");
          const result = await recordPageAuthorityDeliveryReview(deckDir, {
            runDir: resolved,
            decision: opts.recordPageAuthorityDeliveryReview,
            reason: opts.reason,
          });
          console.log(JSON.stringify({ operation: "record-page-authority-delivery-review", ...result }));
          return;
        } catch (error) {
          emitFailed("ppt_flow.state.record-page-authority-delivery-review", error.message, "Show the current Page Authority raw/final projections and PPTX/notes evidence, then record the exact delivery decision.");
          process.exitCode = 1;
          return;
        }
      }
      if (opts.checkGates && htmlFirst) {
        const { inspectHtmlReviewReadiness, recoverHtmlGatePublication } = await import("./shared/state/html_review_evidence.mjs");
        recoverHtmlGatePublication(resolved);
        const readiness = inspectHtmlReviewReadiness(resolved);
        if (readiness.ready) { console.log("HTML gates OK"); process.exit(0); }
        const pending = ["content", "visual"].filter((gate) => !readiness.gates?.[gate]?.ready);
        exitCliError({ code: readiness.conflict ? CLI_ERROR_CODES.FAILED : CLI_ERROR_CODES.GATE_BLOCKED, message: readiness.reason, hint: `Pending HTML review: ${pending.join(", ") || "reset/recovery conflict"}.`, where: "ppt_flow.state.check-html-gates", diagnostic: createGateDiagnostic({ operation: "check-html-gates", source: resolved, issues: pending.map((gate) => ({ message: "authoritative HTML review is pending or stale", subject: { kind: "gate", id: gate }, reason: { kind: "approval_required" } })), defaultText: "Regenerate current HTML review plans and record explicit decisions before Stage 4." }) }, 1);
      }
      const s = readState(deckDir, { purpose: "observe" });
      if (s.replacement_required) {
        const currentRepair = s.current_repair_required === true;
        exitCliError({
          code: CLI_ERROR_CODES.STATE_CORRUPTED,
          message: currentRepair
            ? "Authoritative current state has a bounded owner repair."
            : "Authoritative state uses an unsupported protocol.",
          hint: currentRepair
            ? "Retry the owning current-state operation; do not edit YAML or infer a replacement route."
            : "Preserve its bytes; start a fresh explicitly initialized run instead of editing or inferring a route from unsupported state.",
          where: "ppt_flow.state.unsupported-protocol",
          diagnostic: {
            version: 1,
            category: "artifact",
            operation: "observe-state",
            reason: { kind: currentRepair ? "current_state_repair_required" : "replacement_required" },
            next: createCliNext("repair_prerequisite", {
              default: currentRepair
                ? "Retry the owning current-state operation so it can canonicalize the one-to-one defect; do not edit YAML or infer a route."
                : "Preserve the existing bytes and run ppt_flow init for a fresh current run; do not edit or infer a route from unsupported historical state.",
            }),
          },
        }, 2);
      }
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
      let htmlReviews = null;
      if (htmlFirst) {
        try {
          const { inspectHtmlReviewReadiness } = await import("./shared/state/html_review_evidence.mjs");
          htmlReviews = inspectHtmlReviewReadiness(resolved);
        } catch {
          htmlReviews = { pipeline: HTML_FIRST_PIPELINE, state_present: true, content: { decision: "pending", freshness: "invalid", review_required: true }, visual: { decision: "pending", freshness: "invalid", outstanding_recipe_keys: [], outstanding_slide_ids: [] }, delivery: { freshness: "invalid", decision: null, reason_present: false }, reset: { status: "absent", ownership: "none", retry_after_ms: null }, journal: { status: "invalid" } };
        }
      }
      const { buildPlaybookIndex } = await import("./shared/state/md_controller_reader.mjs");
      const controllerIndex = buildPlaybookIndex(join(FRAMEWORK_DIR, "playbook"));
      const controllerCtx = await buildControllerGateContext(resolved);
      const indexedCard = buildResumeCard(s, statusSnapshot, {
        index: controllerIndex,
        ctx: controllerCtx,
      });
      const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
      const workflowInspection = inspectWorkflow({ runDir: resolved });
      const inspectionSummary = workflowInspection.primary_action.summary || workflowInspection.primary_action.display_label || workflowInspection.primary_action.action_id;
      const inspectionNext = workflowInspection.primary_action.command || workflowInspection.primary_action.display_label || `${workflowInspection.primary_action.owner}:${workflowInspection.primary_action.action_id}`;

      if (opts.json) {
        const refinementProjection = (() => {
          try { return projectImage2RefinementState(s, basename(resolved)); }
          catch (error) { return { present: false, status: "invalid", reason: error.message }; }
        })();
        const report = {
          durable_state: s,
          production_mode: indexedCard.production_mode,
          pipeline: htmlFirst ? HTML_FIRST_PIPELINE : (s.pipeline || "whole-page-image2-v1"),
          state_present: existsSync(statePath(deckDir)),
          html_reviews: htmlReviews,
          image2_refinement: refinementProjection,
          playbook: indexedCard.playbook,
          current_node: indexedCard.current_node,
          gates: indexedCard.gates,
          node_status: indexedCard.node_status,
          waiting_for: indexedCard.waiting_for,
          note: indexedCard.note,
          completed_nodes: indexedCard.completed_nodes,
          pending_nodes: indexedCard.pending_nodes,
          eligible_candidates: indexedCard.eligible_candidates,
          workflow_summary: inspectionSummary,
          suggested_next: inspectionNext,
          workflow_inspection: workflowInspection,
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
      console.log("Summary:  " + inspectionSummary);
      console.log("Next:     " + inspectionNext);
    });

  // ---- image2 (closed optional Phase-4 command family) ----
  program
    .command("image2")
    .description("Receipt-bound Page Authority raw lifecycle or existing HTML-first refinement")
    .argument("<operation>", "Page Authority: plan, authorize, generate, review, accept; legacy: plan, authorize, generate, accept, use-html, cleanup, or unknown-submit")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--slides <ids>", "Comma-separated stable slide IDs for plan")
    .option("--slot <slot>", "One no-text visual slot (default primary_visual)", "primary_visual")
    .option("--profile <fingerprint>", "Safe provider profile fingerprint")
    .option("--base-url <url>", "Override the Image2 provider base URL for generate/reconciliation")
    .option("--plan-hash <hash>", "Exact deterministic plan hash")
    .option("--attempt-id <id>", "Persisted setup/page attempt ID")
    .option("--slide-id <id>", "Stable slide ID for review/promotion")
    .option("--candidate-id <id>", "Immutable candidate ID")
    .option("--review-hash <hash>", "Exact cleanup review-set hash")
    .option("--decision <decision>", "Page Authority raw review: proceed|repair|redirect; legacy unknown-submit: retain|abandon")
    .option("--force", "Explicitly waive an incomplete HTML delivery prerequisite for offline planning")
    .option("--reason <text>", "Bounded human reason required with image2 plan --force")
    .option("--dry-run", "Show cleanup scope without deleting derived evidence")
    .option("--json", "Output one machine-readable success report")
    .addHelpText("after", "\nPage Authority: plan -> authorize -> generate -> review -> accept --decision proceed -> build\nExisting HTML refinement: plan -> authorize -> generate -> accept|use-html -> cleanup\nNo operation submits before exact human authorization.\n")
    .action(async (operation, runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const code = await commandImage2(operation, runDir, {
        ...opts,
        slotExplicit: hasExplicitCliOption("--slot"),
      });
      process.exit(code);
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
  const { installStandaloneFailureEnvelope } = await import("./shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "ppt_flow.main" });
  await main().catch((err) => {
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
