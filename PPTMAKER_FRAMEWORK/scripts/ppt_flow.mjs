#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script
 *
 * Friendly command surface for the PPT framework.
 * This is the default human/agent entry point. It delegates to the structural SSOT
 * and production orchestrator instead of duplicating their logic.
 *
 * Current commands: doctor, init, status, validate, build, refresh, slides,
 *                   new-version, test, state, image2
 *
 * Uses commander for CLI. Delegates to:
 *   - bundle_layout.mjs         — directory SSOT, init, check, create_version
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
  STYLE_MASTER_IMAGE,
  BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE,
  // version
  SLIDE_SPECS_NAME, SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR,
  // resolvers
  deckRoot, backboneDir, styleAsset, styleDir, assetsDir, pageAuthorityImage2Paths,
  findSlideSpecs, deckName, isVersionDir, loadDotenv,
  // catalogues
  DECK_TYPE_TEMPLATES, STYLE_PRESETS,
  // init / check / create
  initBundle, checkBundle, createVersion, nextVersionName, publishStructuralVersion, DEFAULT_INIT_MODE,
  productionPolicyForMode,
} from "./shared/run-bundle/bundle_layout.mjs";
const directRootEntry = process.argv[1] ? resolve(process.argv[1]) === __filename : false;
const rootCommand = directRootEntry ? process.argv[2] : null;
const contentApi = !directRootEntry || !["doctor", "--help", "-h", undefined].includes(rootCommand)
  ? await import("./01-content/index.mjs")
  : Object.create(null);
const {
  applySlideEdit,
  applyTargetStructuralVersion,
  computeSlideEditPlanSha256,
  formatAvailableSlideIds,
  formatSlideCandidate,
  parseSlideDocument,
  parsePageAuthoritySource,
  planSlideEdit,
  previewTargetStructuralVersion,
  resolveSlideBindings,
  resolveSlideIds,
  validateSlideDocument,
  verifySlideEditPlanHash,
} = contentApi;
import {
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
  TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
  isTargetWorkflowSelectionPending,
  probeProductionMarker,
} from "./shared/run-bundle/production_marker.mjs";

// ---------------------------------------------------------------------------
// Script paths for subprocess delegation
// ---------------------------------------------------------------------------

const ENV_CHECK = join(FRAMEWORK_DIR, "scripts", "00-setup", "env-check.mjs");

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();

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
    category: /(?:init|status|new-version)/.test(where) ? "structure" : /doctor/.test(where) ? "environment" : "artifact",
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
  return false;
}

/**
 * A fresh v2 bundle has no durable mode record until its authored source has a
 * valid workflow receipt.  This narrow draft route lets the selected adapter
 * create that first binding; it never applies to a v1/v2 hybrid or an active
 * non-draft execution.
 */
async function resolveTargetAuthoringDraftAdapter(resolved, deckDir) {
  const sourcePath = join(resolved, SLIDE_SPECS_NAME);
  if (!existsSync(sourcePath)) return null;
  const marker = probeProductionMarker(readFileSync(sourcePath), { source: SLIDE_SPECS_NAME });
  const selectionPending = isTargetWorkflowSelectionPending(marker);
  if (marker.branch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE && !selectionPending) return null;
  const { readState } = await import("./shared/state/state.mjs");
  const state = readState(deckDir, { purpose: "observe", heal: false, runDir: resolved });
  const versionKey = `3_versions/${basename(resolved)}`;
  const isDraft = state && !state.replacement_required && !state.corrupted &&
    state.pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE &&
    state.production_mode?.by_version?.[versionKey] === undefined &&
    state.playbook === "create-deck" && state.run_version === basename(resolved) &&
    state.current_node === "select-target-page-authority-workflow";
  if (!isDraft) return null;
  return Object.freeze({
    ok: true,
    run_version: basename(resolved),
    mode: "image2-page-authority-v2",
    workflow: selectionPending ? null : marker.frontmatter.metadata.production.workflow,
    policy: { adapter: "page-authority-image2-v2", pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE },
    adapter: "page-authority-image2-v2",
    draft: true,
    target_workflow_selection_required: selectionPending,
  });
}

function emitUnsupportedProtocol(where, resolved, code = "UNSUPPORTED_PROTOCOL") {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "UNSUPPORTED_PROTOCOL: this run is not an exact v2 Page Authority source/state pair.",
    hint: "Preserve existing bytes and export the named run; current framework commands do not select, decode, or migrate another protocol.",
    where,
    diagnostic: {
      version: 1,
      category: "gate",
      operation: "export-unsupported-protocol",
      source: { path: resolved },
      reason: { kind: "unsupported_protocol", actual: code },
      next: createCliNext("export", {
        requiresHuman: true,
        default: "Export the named unsupported run unchanged. Any later conversion requires separately authorized deck-scoped work.",
      }),
    },
  });
}

async function resolveRunAdapter(runDir, where) {
  const resolved = resolve(runDir || "");
  const deckDir = deckRoot(resolved);
  const targetDraft = await resolveTargetAuthoringDraftAdapter(resolved, deckDir);
  if (targetDraft) return Object.freeze({ ...targetDraft, run_dir: resolved, deck_dir: deckDir });
  if (preflightAdapterSource(resolved, where)) return null;
  const { resolveRunProductionAdapter } = await import("./shared/state/state.mjs");
  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (route.ok && route.adapter === "page-authority-image2-v2") {
    return Object.freeze({ ...route, run_dir: resolved, deck_dir: deckDir });
  }
  emitUnsupportedProtocol(where, resolved, route.code);
  return null;
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
  const canonicalSource = join(runDir, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(runDir);
  const marker = source
    ? probeProductionMarker(readFileSync(source), { source: basename(source) })
    : { branch: "invalid", issues: [] };
  const pipeline = marker.branch === "invalid" ? "invalid" : marker.branch;

  let expected = 0;
  let slideLabels = [];
  if (source) {
    try {
      const slides = parseSlideDocument(readFileSync(source, "utf-8"), source).slides;
      expected = slides.length;
      slideLabels = slides.map((slide) => formatSlideCandidate({
        slide_id: slide.slide_id,
        position: slide.position,
        title: slide.title || "",
      }));
    } catch {
      expected = 0;
      slideLabels = [];
    }
  }

  const pageAuthorityPaths = pageAuthorityImage2Paths(runDir);
  const meta = metadataFields(join(root, METADATA_FILE));

  const pngCount = (d) =>
    existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".png")).length : 0;

  /** @type {string[]} */
  let pptxFiles = [];
  if (existsSync(pageAuthorityPaths.final_root)) {
    pptxFiles = readdirSync(pageAuthorityPaths.final_root)
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
    content_gate: meta.content_gate || "missing",
    visual_gate: meta.visual_gate || "missing",
    style_master: existsSync(styleAsset(runDir, STYLE_MASTER_IMAGE)),
    source_receipt: existsSync(pageAuthorityPaths.receipt),
    expected_slides: expected,
    slide_labels: slideLabels,
    raw_images: pngCount(pageAuthorityPaths.raw_root),
    final_images: pngCount(pageAuthorityPaths.final_root),
    pptx: pptxFiles.map((f) => basename(f)),
    lessons_count: lessonsCount,
  };
}

/**
 * Attach playbook breakpoint + optional workflow_summary onto a status object.
 * @param {object} status
 * @param {string} runDir
 */
async function enrichStatusWithState(status, runDir, route = null) {
  const { readState, buildResumeCard, statePath, inspectRunProductionMode } = await import("./shared/state/state.mjs");
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
  const { buildPlaybookIndex } = await import("./shared/state/md_controller_reader.mjs");
  const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
  const workflowInspection = inspectWorkflow({ runDir });
  const controllerCtx = await buildControllerGateContext(runDir, { workflowInspection });
  if (modeInspection.ok && modeInspection.mode) controllerCtx.productionMode = modeInspection.mode;
  const card = buildResumeCard(s, {
    style_master: status.style_master,
    raw_images: status.raw_images,
    expected_slides: status.expected_slides,
    pptx: status.pptx,
    content_gate: status.content_gate,
    visual_gate: status.visual_gate,
  }, {
    index: buildPlaybookIndex(join(FRAMEWORK_DIR, "playbook")),
    ctx: controllerCtx,
  });
  status.playbook = card.playbook;
  status.current_node = card.current_node;
  return status;
}

/**
 * Build the real deterministic gate context used by controller-aware resume
 * cards. This deliberately reuses Page Authority source validation and the production
 * Page Authority receipt validation instead of maintaining state-only
 * approximations.
 */
export async function buildControllerGateContext(runDir, { workflowInspection = null } = {}) {
  const resolved = resolve(runDir);
  const inspection = workflowInspection || (await import("./shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir: resolved });
  const { isWorkflowInspectionSourceReady } = await import("./shared/workflow/inspect_workflow.mjs");

  return {
    deckDir: deckRoot(resolved),
    runDir: resolved,
    runVersion: basename(resolved),
    pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
    frameworkDir: FRAMEWORK_DIR,
    slideSpecsValid: isWorkflowInspectionSourceReady(inspection),
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
  console.log(`  Content gate:  ${status.content_gate}`);
  console.log(`  Visual gate:   ${status.visual_gate}`);
  console.log(`  Style master:  ${status.style_master ? "ready" : "missing"}`);
  console.log(`  Source receipt:${status.source_receipt ? "ready" : "not built"}`);
  for (const label of status.slide_labels || []) console.log(`    ${label}`);
  console.log(`  Raw images:    ${status.raw_images}/${expected}`);
  console.log(`  Final images:  ${status.final_images}/${expected}`);
  console.log(
    `  PPTX:          ${status.pptx.length > 0 ? status.pptx.join(", ") : "not built"}`
  );
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

  /** @type {string[]} */
  const nextSteps = [];
  const rd = status.run_dir;

  if (!status.style_master) nextSteps.push(`Create the Page Authority visual profile before raw planning: ${rd}`);
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
  let resolvedMode = mode ?? DEFAULT_INIT_MODE;
  if (resolvedMode !== DEFAULT_INIT_MODE) {
    emitUsage("ppt_flow.doctor.mode", `mode must be ${DEFAULT_INIT_MODE}`, "Use the Page Authority operation-scoped readiness check.");
    return null;
  }
  if (image2) {
    emitUsage("ppt_flow.doctor.image2", "--image2 is no longer a public doctor flag", "Use --operation raw-generation when raw Image2 readiness is required.");
    return null;
  }
  if (runDir) {
    const route = await resolveRunAdapter(runDir, "ppt_flow.doctor.run-dir");
    if (!route) return null;
    resolvedMode = route.mode || DEFAULT_INIT_MODE;
  }
  args.push("--mode", resolvedMode);
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
    console.error(`✗ New decks use ${DEFAULT_INIT_MODE}; unsupported production modes cannot be initialized.`);
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
  if (route.target_workflow_selection_required) {
    status.pipeline = PAGE_AUTHORITY_IMAGE2_V2_PIPELINE;
    status.structure_issues = status.structure_issues
      .filter((issue) => issue !== TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
  }
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

async function commandValidate(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.validate.identity");
  if (!route) return 1;
  try {
    const operations = await targetImage2Operations(route.workflow);
    const source = operations.resolveSource(route.run_dir);
    console.log(`✓ Target Page Authority ${route.workflow} receipt validated: ${source.receipt.slides.length} slide(s)`);
    return 0;
  } catch (error) {
    emitFailed("ppt_flow.validate.page-authority", error.message || "Page Authority validation failed", "Repair canonical Page Authority source or its registered visual inputs, then rerun validate.");
    return 1;
  }
}

// Command: build
// ---------------------------------------------------------------------------

async function commandPageAuthorityBuild(route, { resolution, model, baseUrl, reuseImages, dryRun, force, reason, retiredControlsExplicit }) {
  if (baseUrl || reuseImages || dryRun || force || reason != null || retiredControlsExplicit) {
    return emitUsage(
      "ppt_flow.build.page-authority",
      "Page Authority build accepts no resolution, model, provider, image-reuse, dry-run, or retired gate overrides",
      "Use receipt-bound image2 plan/authorize/generate/review first, then run build with only the canonical run directory."
    );
  }
  try {
    const operations = await targetImage2Operations(route.workflow);
    const result = await operations.buildDelivery(route.run_dir);
    console.log(`✓ Target Page Authority ${route.workflow} delivery assembled: ${result.delivery.assembly.path}`);
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
 * Executes the receipt-bound Page Authority delivery lifecycle.
 *
 * @param {string} runDir
 * @param {{resolution: string, model: string, baseUrl: string|null, reuseImages: boolean, dryRun: boolean, force?: boolean, reason?: string|null}} opts
 */
async function commandBuild(runDir, opts) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.build.identity");
  if (!route) return 1;
  return commandPageAuthorityBuild(route, opts);
}
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
  retiredControlsExplicit,
}) {
  if (confirmRunVersion || baseUrl || dryRun || retiredControlsExplicit) {
    return emitUsage(
      "ppt_flow.refresh.page-authority",
      "Page Authority refresh accepts no provider, resolution, dry-run, reset, or retired override controls",
      "Use the canonical receipt-bound lifecycle and select only title or notes refresh work."
    );
  }
  if (route.adapter === "page-authority-image2-v2") {
    if (kind === "visual") {
      return emitUsage(
        "ppt_flow.refresh.target.visual",
        "Target Page Authority visual refresh requires a selected-workflow raw rebuild",
        "Run image2 plan, authorize the exact raw scope when needed, generate, review, then build."
      );
    }
    if (kind === "reset-html-production") {
      return emitUsage("ppt_flow.refresh.target.reset", "reset-html-production is not available for target Page Authority", "Use the selected workflow evidence owner actions instead of a retired HTML reset.");
    }
    try {
      const operations = await targetImage2Operations(route.workflow);
      if (kind === "notes") {
        if (only || all) return emitUsage("ppt_flow.refresh.target.notes", "Target Page Authority notes refresh accepts no slide selectors", "Rerun notes against the current shared target delivery.");
        const result = await operations.refreshNotes(route.run_dir);
        console.log(`✓ Target Page Authority notes refreshed: ${result.delivery.notes.notesInjected} slide(s)`);
        return 0;
      }
      if (route.workflow !== "framed") {
        return emitUsage("ppt_flow.refresh.target.title", "Target Pure visible text requires a Pure raw rebuild", "Run the selected Pure image2 raw lifecycle; Framed local refresh is not legal for Pure.");
      }
      if (only && all) return emitUsage("ppt_flow.refresh.target.title", "--only and --all are mutually exclusive", "Select exact Framed stable IDs or use --all.");
      if (!only && !all) return emitUsage("ppt_flow.refresh.target.title", "Framed Text Frame refresh requires --only or --all", "Select exact current Framed stable IDs before a provider-free refresh.");
      const slideIds = only ? only.split(",").map((id) => id.trim()).filter(Boolean) : null;
      const result = await operations.refreshFramedText(route.run_dir, { slideIds });
      console.log(`✓ Target Framed refresh delivered without provider submission: ${result.delivery.assembly.path}`);
      return 0;
    } catch (error) {
      const rawRequired = /TARGET_(?:ACCEPTED_RAW_EVIDENCE_REQUIRED|RAW_REVIEW|SOURCE_RECEIPT_STALE)|raw_evidence|raw_review/i.test(`${error.code || ""} ${error.message || ""}`);
      if (rawRequired) {
        emitCliError({
          code: CLI_ERROR_CODES.GATE_BLOCKED,
          message: error.message,
          hint: "Use the selected target raw plan and review lifecycle before target finalization.",
          where: "ppt_flow.refresh.target.title",
          diagnostic: {
            version: 1,
            category: "gate",
            operation: "target-framed-refresh",
            source: { path: route.run_dir },
            reason: { kind: pageAuthorityDiagnosticReasonKind(error.code, "raw_evidence_required") },
            next: createCliNext("repair_prerequisite", { default: "Build a fresh selected-workflow target raw plan; authorize only a nonzero current scope." }),
          },
        });
        return 1;
      }
      emitFailed("ppt_flow.refresh.target", error.message || "Target Page Authority refresh failed.", "Repair the selected workflow source, evidence, final manifest, or notes before retrying.");
      return 1;
    }
  }
}

/**
 * refresh — Run the smallest safe edit chain.
 * Routes only the current Page Authority ownership/invalidation path.
 *
 * @param {string} runDir
 * @param {{kind: string, only: string|null, all: boolean, resolution: string, baseUrl: string|null, dryRun: boolean}} opts
 */
async function commandRefresh(runDir, { kind, only, all, resolution, baseUrl, dryRun, confirmRunVersion = null, retiredControlsExplicit = false }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.refresh.identity");
  if (!route) return 1;
  return commandPageAuthorityRefresh(route, { kind, only, all, resolution, baseUrl, dryRun, confirmRunVersion, retiredControlsExplicit });
}
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
  if (marker.branch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    throw new Error("projected source must remain an exact v2 Page Authority marker");
  }
  return marker.branch;
}

function targetStructuralBaseSlidePlan(transaction) {
  const { page_authority_target_structural: _ignored, ...base } = transaction;
  return Object.freeze({ ...base, plan_sha256: computeSlideEditPlanSha256(base) });
}

async function parseTargetStructuralReceipt(context, sourceText) {
  const { createPageAuthoritySourceResolver, loadPageAuthorityVisualLanguage } = await import("./02-visual-system/index.mjs");
  const visualLanguage = loadPageAuthorityVisualLanguage(deckRoot(context.runDir));
  return parsePageAuthoritySource(sourceText, {
    source: context.document.source,
    registry: createPageAuthoritySourceResolver({ deckDir: deckRoot(context.runDir), visualLanguage }),
  });
}

/** Bind a v2 same-workflow structural vNext to the existing exact preview. */
async function enrichTargetPageAuthorityStructuralPlan(context, transaction, applied, targetBranch) {
  if (targetBranch !== PAGE_AUTHORITY_IMAGE2_V2_PIPELINE || transaction.publication.mode !== "next-version") return null;
  const marker = probeProductionMarker(applied.text, { source: context.document.source });
  const workflow = marker.frontmatter?.metadata?.production?.workflow;
  const baseSlidePlan = targetStructuralBaseSlidePlan(transaction);
  const targetReceipt = await parseTargetStructuralReceipt(context, applied.text);
  const candidate = previewTargetStructuralVersion({
    sourceRunDir: context.runDir,
    targetRunVersion: transaction.publication.target_version,
    slideEditPlan: baseSlidePlan,
    targetWorkflow: workflow,
    targetSourceText: applied.text,
    targetSourceReceipt: targetReceipt,
  });
  const existing = transaction.page_authority_target_structural;
  if (existing) {
    if (existing.slide_edit_plan_sha256 !== baseSlidePlan.plan_sha256 || existing.plan_hash !== candidate.plan_hash) {
      throw new Error("Target Page Authority structural plan changed after preview; obtain a fresh preview");
    }
    return Object.freeze({ plan: existing });
  }
  transaction.page_authority_target_structural = candidate;
  transaction.plan_sha256 = computeSlideEditPlanSha256(transaction);
  return Object.freeze({ plan: candidate });
}

async function projectConfirmedSlideTransaction(context, transaction, expectedHash) {
  const applied = applySlideEdit(transaction, context.sourceText, {
    expectedPlanSha256: expectedHash,
  });
  const targetBranch = await validateProjectedSlideSource(context, applied.text);
  const targetPageAuthorityStructural = await enrichTargetPageAuthorityStructuralPlan(context, transaction, applied, targetBranch);
  return { ...applied, targetBranch, targetPageAuthorityStructural };
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
  const targetPageAuthorityStructural = applied.targetPageAuthorityStructural;
  if (targetPageAuthorityStructural) {
    const publication = applyTargetStructuralVersion({
      sourceRunDir: context.runDir,
      plan: targetPageAuthorityStructural.plan,
      planHash: targetPageAuthorityStructural.plan.plan_hash,
    });
    return {
      kind: "slide-edit",
      applied: true,
      transaction,
      receipt: {
        ...applied.receipt,
        source_run_dir: context.runDir,
        target_run_dir: publication.target_run_dir,
        pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
        workflow: publication.workflow,
        needs_render: publication.needs_raw_generation,
        page_authority_target_structural: {
          plan_hash: targetPageAuthorityStructural.plan.plan_hash,
          materialized_slide_ids: publication.materialized_slide_ids,
          needs_raw_generation: publication.needs_raw_generation,
          provider_calls: publication.provider_calls,
          inherited_acceptance: publication.inherited_acceptance,
        },
      },
      target_run_dir: publication.target_run_dir,
    };
  }
  throw new Error("structural target plan is required for every v2 next-version publication");
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

async function commandBuildWrapped(runDir, opts) {
  return commandBuild(runDir, opts);
}

async function resolveImage2Run(runDir, where) {
  const route = await resolveRunAdapter(runDir, where);
  return route?.adapter === "page-authority-image2-v2" ? route.run_dir : null;
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

const FRAMED_SOURCE_VALIDATION_CODES = new Set([
  "invalid_text_frame",
  "untrusted_text_frame_override",
  "invalid_text_frame_literal",
  "missing_framed_title",
  "unsupported_frame_preset",
  "unsupported_framed_code_points",
  "font_selection_input_invalid",
  "framed_text_frame_invalid",
  "framed_text_fit_failed",
  "framed_render_input_invalid",
  "framed_visual_language_required",
  "target_source_missing",
  "target_source_receipt_invalid",
]);

const FRAMED_ENVIRONMENT_CODES = new Set([
  "font_render_inventory_invalid",
  "framed_font_asset_missing",
  "framed_font_asset_invalid",
  "framed_font_runtime_invalid",
  "framed_font_runtime_unavailable",
  "framed_runtime_unavailable",
  "framed_render_timeout",
]);

const FRAMED_INTERNAL_CODES = new Set([
  "framed_render_profile_invalid",
  "framed_render_profile_required",
  "framed_render_profile_stale",
  "framed_font_selection_invalid",
  "framed_render_contract_invariant_failed",
  "framed_raw_contract_invalid",
  "framed_raw_invalid",
  "target_raw_review_contribution_invalid",
  "target_provider_request_invalid",
  "target_source_candidate_invalid",
]);

const TARGET_GATE_CODES = new Set([
  "provider_authorization_required",
  "raw_review_required",
  "target_provider_authorization_required",
]);

function isTargetArtifactFailure(code) {
  if (code === "target_style_master_unavailable" || code === "framed_raw_contract_profile_stale") return true;
  return /^target_(?:source_receipt|source_state|raw_plan|raw_evidence|raw_review|accepted_raw_evidence|final_manifest|final_bytes|delivery)_.*(?:stale|required|missing|invalid|mismatch|drift)$/.test(code)
    || code === "target_raw_review_contribution_stale";
}

function isTargetProviderFailure(code) {
  return /^page_authority_provider_/.test(code)
    || /^target_provider_/.test(code)
    || code === "provider_submit_required"
    || code === "target_raw_bytes_invalid";
}

function targetPageAuthorityFailure(operation, route, error) {
  const reason = pageAuthorityDiagnosticReasonKind(error?.code);
  const common = {
    version: 1,
    operation: `target-page-authority-${operation}`,
    reason: { kind: reason },
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  if (FRAMED_SOURCE_VALIDATION_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Framed Text Frame is invalid or cannot fit the canonical frame.",
      hint: "Repair the named source Text Frame, then rerun image2 plan.",
      diagnostic: {
        ...common,
        category: "source_validation",
        source,
        next: createCliNext("edit_source", {
          inspect: [source],
          default: "Repair the current Framed Text Frame in source, then rerun image2 plan.",
        }),
      },
    };
  }

  if (FRAMED_ENVIRONMENT_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The local Framed browser or checked-in font runtime is not ready.",
      hint: "Repair the local Framed runtime or font inventory, then rerun the same checkpoint.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Run the Framed-local doctor repair path, then rerun the same image2 checkpoint.",
        }),
      },
    };
  }

  if (FRAMED_INTERNAL_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The canonical Framed render contract is inconsistent.",
      hint: "Report the framework defect; source and provider configuration are not the repair owner.",
      diagnostic: {
        ...common,
        category: "internal",
        next: createCliNext("report_internal", {
          default: "Inspect the Framed compiler, profile, or capture owner and report the framework defect before rerunning.",
        }),
      },
    };
  }

  if (isTargetArtifactFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Authority plan or evidence is stale or incomplete.",
      hint: "Repair the owning Page Authority artifact, then rerun the same checkpoint.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("repair_prerequisite", {
          default: "Rebuild the named current plan or evidence through its owner, then rerun the same checkpoint.",
        }),
      },
    };
  }

  if (TARGET_GATE_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "The current Page Authority authorization or review gate is not satisfied.",
      hint: "Complete the owner-issued authorization or raw-review prerequisite before continuing.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("repair_prerequisite", {
          default: "Complete the exact current authorization or review prerequisite, then rerun this operation.",
        }),
      },
    };
  }

  if (isTargetProviderFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Image2 provider request did not complete.",
      hint: "Repair provider configuration or availability, then rerun the authorized operation.",
      diagnostic: {
        ...common,
        category: "provider",
        next: createCliNext("repair_environment", {
          default: "Repair the provider configuration or availability, then rerun the already authorized operation.",
        }),
      },
    };
  }

  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The target Page Authority operation failed unexpectedly.",
    hint: "Report the framework failure; provider configuration is not the repair owner for an unknown cause.",
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Inspect the registered Page Authority owner and report the framework failure before rerunning.",
      }),
    },
  };
}

function targetUnsupportedOverride(opts) {
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

/** Submit an opaque target adapter request without re-evaluating its workflow. */
function targetPageAuthoritySubmitFactory(plan) {
  const slideById = new Map(plan.receipt.slides.map((slide) => [slide.slide_id, slide]));
  return async ({ request, item }) => {
    const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
    let credentials;
    try {
      credentials = resolveImage2Credentials();
    } catch {
      const error = new Error("Target Page Authority provider credentials are unavailable");
      error.code = "PAGE_AUTHORITY_PROVIDER_CREDENTIALS_UNAVAILABLE";
      throw error;
    }
    const slide = slideById.get(item.slide_id);
    if (!slide || request?.slide_id !== item.slide_id || !request?.generation_profile?.provider?.model) {
      const error = new Error("Target Page Authority provider request is not bound to the current selected workflow plan");
      error.code = "PAGE_AUTHORITY_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const references = [plan.style_master_path];
    const identityPath = slide.visual_language?.identity_reference?.provider_reference?.path;
    if (identityPath) references.push(identityPath);
    const images = references.map(imageDataUrl);
    const body = {
      model: request.generation_profile.provider.model,
      prompt: JSON.stringify(request),
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
      const error = new Error("Target Page Authority provider submission failed before a response");
      error.code = "PAGE_AUTHORITY_PROVIDER_SUBMIT_FAILED";
      throw error;
    }
    let payload;
    try {
      payload = JSON.parse(await response.text());
    } catch {
      const error = new Error("Target Page Authority provider response was not valid JSON");
      error.code = "PAGE_AUTHORITY_PROVIDER_RESPONSE_INVALID";
      throw error;
    }
    if (!response.ok) {
      const error = new Error(`Target Page Authority provider submission failed with HTTP ${response.status}`);
      error.code = "PAGE_AUTHORITY_PROVIDER_SUBMIT_FAILED";
      throw error;
    }
    return imageBytesFromPageAuthorityProvider(payload);
  };
}

async function targetImage2Operations(workflow) {
  if (workflow === "framed") {
    const owner = await import("./03-framed-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolveFramedTargetSource,
      buildPlan: owner.buildFramedTargetRawPlan,
      readStoredPlan: owner.readFramedTargetStoredPlanContext,
      projectPlan: owner.framedTargetRawPlanProjection,
      authorize: owner.authorizeFramedTargetRawPlan,
      generate: owner.generateFramedTargetRawPlan,
      review: owner.prepareFramedTargetRawReview,
      accept: owner.decideFramedTargetRawReview,
      buildDelivery: owner.buildFramedTargetDelivery,
      refreshFramedText: owner.refreshFramedTargetText,
      refreshNotes: owner.refreshFramedTargetNotes,
    });
  }
  if (workflow === "pure") {
    const owner = await import("./04-pure-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolvePureTargetSource,
      buildPlan: owner.buildPureTargetRawPlan,
      readStoredPlan: owner.buildPureTargetRawPlan,
      projectPlan: owner.pureTargetRawPlanProjection,
      authorize: owner.authorizePureTargetRawPlan,
      generate: owner.generatePureTargetRawPlan,
      review: owner.preparePureTargetRawReview,
      accept: owner.decidePureTargetRawReview,
      buildDelivery: owner.buildPureTargetDelivery,
      refreshNotes: owner.refreshPureTargetNotes,
    });
  }
  const error = new Error("Target Page Authority workflow is unavailable");
  error.code = "TARGET_WORKFLOW_REQUIRED";
  throw error;
}

/** Execute the same public raw lifecycle through the marker-selected v2 owner. */
async function commandTargetPageAuthorityImage2(operation, route, opts = {}) {
  if (!PAGE_AUTHORITY_IMAGE2_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.image2.target.operation", `Target Page Authority image2 operation ${JSON.stringify(operation)} is not supported`, "Use plan, authorize, generate, review, or accept for the selected workflow raw lifecycle.");
  }
  const override = targetUnsupportedOverride(opts);
  if (override) {
    return emitUsage("ppt_flow.image2.target", `--${override} is not accepted for target Page Authority`, "Use the canonical --run-dir receipt path without prompt, profile, output, or retired-artifact overrides.");
  }
  try {
    const operations = await targetImage2Operations(route.workflow);
    let output;
    if (operation === "plan") {
      const plan = await operations.buildPlan(route.run_dir, { allowSourceRebuild: true });
      output = operations.projectPlan(plan);
    } else if (operation === "authorize") {
      if (!opts.planHash) return emitUsage("ppt_flow.image2.target.authorize", "--plan-hash is required", "Pass the exact current target raw plan hash.");
      output = await operations.authorize(route.run_dir, { planHash: opts.planHash });
    } else if (operation === "generate") {
      if (!opts.planHash) return emitUsage("ppt_flow.image2.target.generate", "--plan-hash is required", "Pass the exact authorized target raw plan hash.");
      const plan = await operations.readStoredPlan(route.run_dir);
      output = await operations.generate(route.run_dir, {
        planHash: opts.planHash,
        submit: targetPageAuthoritySubmitFactory(plan),
      });
    } else if (operation === "review") {
      output = await operations.review(route.run_dir);
    } else {
      if (!['proceed', 'repair', 'redirect'].includes(opts.decision)) {
        return emitUsage("ppt_flow.image2.target.accept", "--decision must be proceed, repair, or redirect", "Record the explicit human raw-review decision for the selected target workflow evidence.");
      }
      output = await operations.accept(route.run_dir, { decision: opts.decision });
    }
    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    const failure = targetPageAuthorityFailure(operation, route, error);
    emitCliError({
      code: failure.code,
      message: failure.message,
      hint: failure.hint,
      where: `ppt_flow.image2.target.${operation}`,
      diagnostic: failure.diagnostic,
    });
    return 1;
  }
}

async function commandImage2(operation, runDir, opts = {}) {
  const route = await resolveRunAdapter(runDir, `ppt_flow.image2.${operation}.identity`);
  if (!route) return 1;
  return commandTargetPageAuthorityImage2(operation, route, opts);
}
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
  ppt_flow.mjs validate deck_mydeck/3_versions/v1
  ppt_flow.mjs image2 plan deck_mydeck/3_versions/v1
  ppt_flow.mjs build deck_mydeck/3_versions/v1
  ppt_flow.mjs refresh deck_mydeck/3_versions/v1 --kind title --only slide_03
  ppt_flow.mjs slides list deck_mydeck/3_versions/v1
  ppt_flow.mjs slides move deck_mydeck/3_versions/v1 7 --after 3
  ppt_flow.mjs new-version deck_mydeck/3_versions/v1 --name v2
  ppt_flow.mjs test
  ppt_flow.mjs state deck_mydeck/3_versions/v1 --json
`
    );

  // ---- doctor ----
  program
    .command("doctor")
    .description("Check offline local runtime and optional Image2 readiness")
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
      if (opts.operation && !opts.runDir) {
        exitUsage("ppt_flow.doctor", "--operation requires --run-dir", "Bind the operation to an exact Page Authority run so source/state validation happens before readiness checks.");
      }
      const code = await commandDoctor({
        image2: false,
        smoke: opts.smoke ?? false,
        probeVendors: opts.probeVendors ?? false,
        mode: null,
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
    .action(async (deckDir, opts) => {
      const code = commandInit(deckDir, {
        deckType: opts.deckType,
        style: opts.style,
        mode: DEFAULT_INIT_MODE,
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

  // ---- validate ----
  program
    .command("validate")
    .description("Validate slide specs before image generation")
    .argument("<run_dir>", "Path to version dir")
    .action(async (runDir) => {
      const code = await commandValidate(runDir);
      process.exit(code);
    });

  // ---- build ----
  program
    .command("build")
    .description("Build the complete final deck")
    .argument("<run_dir>", "Path to version dir")
    .action(async (runDir, opts) => {
      const code = await commandBuildWrapped(runDir, {
        resolution: null,
        model: null,
        baseUrl: null,
        reuseImages: false,
        dryRun: false,
        force: false,
        reason: null,
        retiredControlsExplicit: false,
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
      "title"
    )
    .option("--only <ids>", "For title/visual: comma-separated slide IDs")
    .option("--all", "For title/visual: explicitly select all pages")
    .action(async (runDir, opts) => {
      if (!["title", "visual", "notes"].includes(opts.kind)) {
        exitUsage("ppt_flow.refresh.kind", "--kind must be title, visual, or notes.", "Pass a supported refresh kind");
      }
      const code = await commandRefresh(runDir, {
        kind: opts.kind,
        only: opts.only || null,
        all: opts.all ?? false,
        resolution: null,
        baseUrl: null,
        dryRun: false,
        confirmRunVersion: null,
        retiredControlsExplicit: false,
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
    .description("Show v2 Page Authority state")
    .argument("<runDir>", "Path to version directory")
    .option("--json", "JSON output")
    .option("--validate-state", "Validate persisted state and evidence without writing")
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      // Validate the closed state grammar before resolving a run, importing a
      // state owner, or probing source. Mixed forms must be a zero-read/zero-
      // write USAGE failure.
      if (opts.validateState && opts.json) {
        emitUsage("ppt_flow.state", "--validate-state is mutually exclusive with --json", "Run one state projection at a time.");
        process.exitCode = 1;
        return;
      }
      const {
        readState,
        buildResumeCard,
        statePath,
      } = await import("./shared/state/state.mjs");
      const resolved = resolve(runDir);
      const deckDir = deckRoot(resolved);
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
      // State projection shares the inspection checkpoint with status.  In
      // particular, an unsupported source never reaches state/status artifact
      // collection, controller indexing, or a route initializer.
      const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
      const workflowInspection = inspectWorkflow({ runDir: resolved });
      if (workflowInspection.root_cause.kind === "unsupported-protocol") {
        emitUnsupportedProtocol("ppt_flow.state.identity", resolved, "UNSUPPORTED_PROTOCOL");
        process.exitCode = 1;
        return;
      }
      const s = readState(deckDir, { purpose: "observe", heal: false });
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
      let statusSnapshot = null;
      try {
        const st = collectStatus(resolved);
        statusSnapshot = {
          style_master: st.style_master,
          raw_images: st.raw_images,
          expected_slides: st.expected_slides,
          pptx: st.pptx,
          content_gate: st.content_gate,
          visual_gate: st.visual_gate,
        };
      } catch {
        statusSnapshot = null;
      }
      const { buildPlaybookIndex } = await import("./shared/state/md_controller_reader.mjs");
      const controllerIndex = buildPlaybookIndex(join(FRAMEWORK_DIR, "playbook"));
      const controllerCtx = await buildControllerGateContext(resolved, { workflowInspection });
      const indexedCard = buildResumeCard(s, statusSnapshot, {
        index: controllerIndex,
        ctx: controllerCtx,
      });
      const inspectionSummary = workflowInspection.primary_action.summary || workflowInspection.primary_action.display_label || workflowInspection.primary_action.action_id;
      const inspectionNext = workflowInspection.primary_action.command || workflowInspection.primary_action.display_label || `${workflowInspection.primary_action.owner}:${workflowInspection.primary_action.action_id}`;

      if (opts.json) {
        const report = {
          durable_state: s,
          production_mode: indexedCard.production_mode,
          pipeline: s.pipeline || PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
          state_present: existsSync(statePath(deckDir)),
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

  // ---- image2 (Page Authority raw lifecycle) ----
  program
    .command("image2")
    .description("Receipt-bound Page Authority raw lifecycle")
    .argument("<operation>", "plan, authorize, generate, review, or accept")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--slides <ids>", "Comma-separated stable slide IDs for plan")
    .option("--base-url <url>", "Override the Image2 provider base URL for generate/reconciliation")
    .option("--plan-hash <hash>", "Exact deterministic plan hash")
    .option("--decision <decision>", "Page Authority raw review: proceed, repair, or redirect")
    .option("--json", "Output one machine-readable success report")
    .addHelpText("after", "\nplan -> authorize -> generate -> review -> accept --decision proceed -> build\nNo operation submits before exact human authorization.\n")
    .action(async (operation, runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const code = await commandImage2(operation, runDir, {
        ...opts,
        slotExplicit: false,
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
