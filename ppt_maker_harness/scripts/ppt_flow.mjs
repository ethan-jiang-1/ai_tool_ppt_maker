#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script
 *
 * Friendly command surface for the PPT Maker Harness.
 * This is the default human/agent entry point. It delegates to the structural SSOT
 * and production orchestrator instead of duplicating their logic.
 *
 * Current commands: doctor, init, status, validate, build, refresh, slides,
 *                   new-version, test, state, image2, style-master
 *
 * Uses commander for CLI. Delegates to:
 *   - bundle_layout.mjs         — directory SSOT, init, check, create_version
 *   - env-check.mjs             — environment health check (subprocess)
 *   - shared/state/state.mjs    — state / gates (state command)
 *
 * Hard failures: JSON envelope on last non-empty stderr line (shared/cli/cli_error.mjs).
 */

import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs";

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync,
         rmSync, renameSync, realpathSync } from "node:fs";
import { isAbsolute, join, resolve, basename, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { decode as decodePng } from "fast-png";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
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
const HARNESS_DIR = resolve(__dirname, "..");

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
  deckRoot, backboneDir, styleAsset, styleDir, assetsDir, pageImageWorkflowPaths,
  findSlideSpecs, deckName, isVersionDir, loadDotenv,
  // catalogues
  DECK_TYPE_TEMPLATES, STYLE_PRESETS,
  // init / check / create
  initBundle, checkBundle, createVersion, nextVersionName, publishStructuralVersion,
  verifyDeckHarnessBinding,
} from "./shared/run-bundle/bundle_layout.mjs";
const directRootEntry = process.argv[1] ? resolve(process.argv[1]) === __filename : false;
const rootCommand = directRootEntry ? process.argv[2] : null;
const contentApi = !directRootEntry || !["doctor", "--help", "-h", undefined].includes(rootCommand)
  ? await import("./01-content/index.mjs")
  : Object.create(null);
const {
  applySlideEdit,
  applyNarrativePagePlan,
  applyTargetStructuralVersion,
  computeSlideEditPlanSha256,
  formatAvailableSlideIds,
  formatSlideCandidate,
  parseSlideDocument,
  parsePageImageSource,
  previewNarrativePagePlan,
  planSlideEdit,
  previewTargetStructuralVersion,
  resolveSlideBindings,
  validateSlideDocument,
  verifySlideEditPlanHash,
} = contentApi;
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
  isPageImageWorkflowSelectionPending,
  probeProductionMarker,
} from "./shared/run-bundle/production_marker.mjs";
import { sha256Bytes } from "./shared/identity/byte_hash.mjs";
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_REQUEST_SIZE,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "./shared/image2/page_image_media_contract.mjs";
import { pageImageOrdinalImageFilename } from "./shared/image2/page_image_artifacts.mjs";
import { inspectCurrentFinalSlideManifestFromRun } from "./shared/image2/page_image_final_manifest.mjs";
import { writeHumanArtifactNavigation } from "./shared/image2/page_image_human_artifact_reference.mjs";
import { resolveContentAddressName } from "./shared/image2/content_address_store.mjs";
import { validateBoundPageImageProviderRequest } from "./shared/image2/page_image_target_runtime.mjs";
import {
  deliveryReceiptSha256,
  inspectCurrentTargetPageImageDelivery,
} from "./05-delivery/index.mjs";

// ---------------------------------------------------------------------------
// Script paths for subprocess delegation
// ---------------------------------------------------------------------------

const ENV_CHECK = join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs");

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();

/** Emit FAILED envelope; caller still returns/exits the numeric code (D13). */
function emitFailed(where, message, hint = "Inspect the diagnostic evidence before retrying", diagnostic = undefined) {
  const childResult = runNode.lastChildResult;
  const replacementRequired = /\breplacement_required\b/.test(String(message || ""));
  const inferred = diagnostic || (replacementRequired ? {
    schema: CLI_DIAGNOSTIC_SCHEMA,
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
    schema: CLI_DIAGNOSTIC_SCHEMA,
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
      schema: CLI_DIAGNOSTIC_SCHEMA,
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
 * Every supported run has an explicit source marker and a durable identity
 * record that agrees with that marker.
 */
function preflightAdapterSource(resolved, where) {
  const canonicalSource = join(resolved, SLIDE_SPECS_NAME);
  const source = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(resolved);
  if (!source) return false;

  const sourceBytes = readFileSync(source);
  const marker = probeProductionMarker(sourceBytes, { source: basename(source) });
  if (marker.branch === "invalid") {
    if (isPageImageWorkflowSelectionPending(marker)) return false;
    emitCurrentProtocolError(`${where}.source`, resolved, marker.issues[0]?.code || "CURRENT_PROTOCOL_INVALID");
    return true;
  }
  return false;
}

/**
 * A fresh current bundle has no durable identity record until its authored source has a
 * valid workflow receipt.  This narrow draft route lets the selected adapter
 * create that first binding; it never applies to an undeclared protocol or an active
 * non-draft execution.
 */
async function resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir) {
  const { resolveTargetAuthoringDraftRoute } = await import("./shared/state/target_authoring_draft_route.mjs");
  const draft = resolveTargetAuthoringDraftRoute(resolved, { playbookDir: join(harnessDir, "playbook") });
  if (!draft || draft.deck_dir !== deckDir) return null;
  return Object.freeze({
    ok: true,
    run_version: draft.run_version,
    workflow: draft.workflow,
    source_pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
    adapter: "page-image-workflow",
    draft: true,
    target_workflow_selection_required: draft.workflow === null,
  });
}

function emitCurrentProtocolError(where, resolved, code = "CURRENT_PROTOCOL_INVALID") {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "This run contains a record that cannot establish exact current Page Image Workflow identity.",
    hint: "Repair the current source, state, or delivery identity through its owner before continuing.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "repair-current-protocol",
      source: { path: resolved },
      reason: { kind: "current_protocol_invalid", actual: code },
      next: createCliNext("repair_prerequisite", {
        default: "Repair the current source, state, or delivery identity through its owner, then retry.",
      }),
    },
  });
}

function emitExecutionRunVersionMismatch(where, resolved, result) {
  const requested = result?.requested_run_version || null;
  const active = result?.active_run_version || null;
  const activeRunDir = active ? join(deckRoot(resolved), VERSIONS_DIR, active) : resolved;
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "The selected run is not the active Page Image execution.",
    hint: "Inspect the active execution before selecting a mutation target; this command made no changes.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "select-active-execution",
      source: { path: resolved },
      reason: {
        kind: "execution_run_version_mismatch",
        actual: requested,
        expected: active,
      },
      next: createCliNext("inspect", {
        requiresHuman: false,
        inspect: [{ path: activeRunDir }],
        default: "Inspect the active run before selecting another Page Image mutation target.",
      }),
    },
  });
}

function emitUnsupportedHarnessBinding(where, resolved, binding) {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.",
    hint: "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming this content.",
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "verify-harness-binding",
      source: { path: resolved },
      reason: { kind: "harness_binding_invalid", actual: binding.code },
      next: createCliNext("repair_prerequisite", {
        requiresHuman: true,
        default: "Confirm reconstruction of a new current Run Bundle; preserve the existing Bundle unchanged.",
      }),
    },
  });
}

function resolveRunHarnessBinding(runDir, where) {
  const resolved = resolve(runDir || "");
  const binding = verifyDeckHarnessBinding(deckRoot(resolved));
  if (binding.kind !== "resolved") {
    emitUnsupportedHarnessBinding(where, resolved, binding);
    return null;
  }
  return Object.freeze({ resolved, ...binding });
}

async function resolveRunAdapter(runDir, where) {
  const binding = resolveRunHarnessBinding(runDir, `${where}.binding`);
  if (!binding) return null;
  const { resolved, deckDir, harnessDir } = binding;
  if (preflightAdapterSource(resolved, where)) return null;
  const targetDraft = await resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir);
  if (targetDraft) return Object.freeze({ ...targetDraft, run_dir: resolved, deck_dir: deckDir, harness_dir: harnessDir });
  const { resolveRunProductionAdapter } = await import("./shared/state/state.mjs");
  const route = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
  if (route.ok && route.adapter === "page-image-workflow") {
    return Object.freeze({ ...route, run_dir: resolved, deck_dir: deckDir, harness_dir: harnessDir });
  }
  if (route.code === "execution_run_version_mismatch") {
    emitExecutionRunVersionMismatch(where, resolved, route);
    return null;
  }
  emitCurrentProtocolError(where, resolved, route.code);
  return null;
}

function createGateDiagnostic({ operation, source, issues = [], action = "review", invocation, defaultText }) {
  return {
    schema: CLI_DIAGNOSTIC_SCHEMA,
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

  const pageImagePaths = pageImageWorkflowPaths(runDir);
  const meta = metadataFields(join(root, METADATA_FILE));

  const pngCount = (d) =>
    existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".png")).length : 0;

  /** @type {string[]} */
  let pptxFiles = [];
  if (existsSync(pageImagePaths.final_root)) {
    pptxFiles = readdirSync(pageImagePaths.final_root)
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
    source_receipt: existsSync(pageImagePaths.receipt),
    expected_slides: expected,
    slide_labels: slideLabels,
    raw_images: pngCount(pageImagePaths.raw_root),
    final_images: pngCount(pageImagePaths.final_root),
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
  const { readState, buildResumeCard, statePath, inspectRunProductionIdentity } = await import("./shared/state/state.mjs");
  const root = deckRoot(runDir);
  status.state_present = existsSync(statePath(root));
  // Status projects only exact, current run-bound authority. Unsupported state
  // is a hard-stop and is never upgraded from visible topology.
  const s = readState(root, { purpose: "observe", heal: false, runDir });
  if (s.replacement_required) {
    status.playbook = "";
    status.current_node = "";
    status.state_unavailable = true;
    return status;
  }
  const version = basename(resolve(runDir));
  const identityInspection = route?.draft
    ? { ok: false, code: "IDENTITY_MISSING" }
    : inspectRunProductionIdentity(root, { runDir, purpose: "observe" });
  status.production_identity = identityInspection.ok
    ? {
      resolvable: true,
      workflow: identityInspection.workflow,
      source_epoch: identityInspection.source_epoch,
    }
    : { resolvable: false, code: identityInspection.code };
  const { buildPlaybookIndex } = await import("./shared/state/md_controller_reader.mjs");
  const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
  const workflowInspection = inspectWorkflow({ runDir });
  const controllerCtx = await buildControllerGateContext(runDir, {
    workflowInspection,
    harnessDir: route?.harness_dir ?? HARNESS_DIR,
  });
  if (identityInspection.ok) controllerCtx.productionWorkflow = identityInspection.workflow;
  const card = buildResumeCard(s, {
    style_master: status.style_master,
    raw_images: status.raw_images,
    expected_slides: status.expected_slides,
    pptx: status.pptx,
    content_gate: status.content_gate,
    visual_gate: status.visual_gate,
  }, {
    index: buildPlaybookIndex(join(route?.harness_dir ?? HARNESS_DIR, "playbook")),
    ctx: controllerCtx,
  });
  status.playbook = card.playbook;
  status.current_node = card.current_node;
  return status;
}

/**
 * Build the real deterministic gate context used by controller-aware resume
 * cards. This deliberately reuses Page Image source validation and the production
 * Page Image receipt validation instead of maintaining state-only
 * approximations.
 */
export async function buildControllerGateContext(runDir, { workflowInspection = null, harnessDir = HARNESS_DIR } = {}) {
  const resolved = resolve(runDir);
  const inspection = workflowInspection || (await import("./shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir: resolved });
  const { isWorkflowInspectionSourceReady } = await import("./shared/workflow/inspect_workflow.mjs");

  return {
    deckDir: deckRoot(resolved),
    runDir: resolved,
    runVersion: basename(resolved),
    pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
    harnessDir,
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

  if (!status.style_master) nextSteps.push(`Create the Page Image visual profile before raw planning: ${rd}`);
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
async function commandDoctor({ image2 = false, smoke = false, probeVendors = false, runDir = null, operation = null } = {}) {
  const args = [];
  if (image2) {
    emitUsage("ppt_flow.doctor.image2", "--image2 is no longer a public doctor flag", "Use --operation raw-generation when raw Image2 readiness is required.");
    return null;
  }
  let route = null;
  if (runDir) {
    route = await resolveRunAdapter(runDir, "ppt_flow.doctor.run-dir");
    if (!route) return null;
  }
  if (route && (operation === "raw-generation" || operation === "full-build" || smoke || probeVendors)) {
    try {
      const { resolveImage2ProviderProfile } = await import("./shared/image2/provider_profile.mjs");
      const { requireMatchingImage2RuntimeProfileId } = await import("./shared/image2/runtime_profile_id.mjs");
      const profile = resolveImage2ProviderProfile(route.run_dir);
      loadDotenv(route.deck_dir);
      loadDotenv(process.cwd());
      requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
    } catch (error) {
      const reason = pageImageDiagnosticReasonKind(error?.code);
      const sourceFailure = isImage2ProviderProfileSourceFailure(reason);
      const sourcePath = sourceFailure && error?.source
        ? join(route.deck_dir, ...String(error.source).split("/"))
        : null;
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: sourceFailure
          ? "The selected Image2 provider profile source is not ready."
          : "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
        hint: sourceFailure
          ? "Repair the selected non-secret provider profile source, then rerun this exact readiness check."
          : "Repair IMAGE2_PROVIDER_PROFILE_ID for this environment, then rerun this exact readiness check.",
        where: "ppt_flow.doctor.profile",
        diagnostic: {
          schema: CLI_DIAGNOSTIC_SCHEMA,
          category: sourceFailure ? "source_validation" : "environment",
          operation: "raw-generation-readiness",
          ...(sourcePath ? { source: { path: sourcePath } } : {}),
          reason: { kind: sourceFailure ? reason : "image2_provider_profile_id_mismatch" },
          next: createCliNext(sourceFailure ? "edit_source" : "repair_environment", {
            ...(sourcePath ? { inspect: [{ path: sourcePath }] } : {}),
            default: sourceFailure
              ? "Repair the selected provider profile source, then rerun this exact readiness check."
              : "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun this exact readiness check.",
          }),
        },
      });
      return null;
    }
  }
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
    HARNESS_DIR === resolved ||
    resolved.startsWith(HARNESS_DIR + "/")
  ) {
    console.error("✗ A run bundle must live outside ppt_maker_harness/.");
    return emitUsage(
      "ppt_flow.init",
      "A run bundle must live outside ppt_maker_harness/.",
      "Create the deck directory next to (not inside) ppt_maker_harness/"
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
    log = initBundle(resolved, HARNESS_DIR, deckType, style);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed("ppt_flow.init", err.message, "Fix the reported init error and retry");
    return 1;
  }

  console.log(`✓ Initialized ${resolved}`);
  for (const line of log) console.log(`  - ${line}`);
  console.log("  production_identity: unbound until the source workflow is selected and accepted by State");
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
    status.pipeline = PAGE_IMAGE_WORKFLOW_PIPELINE;
    status.structure_issues = status.structure_issues
      .filter((issue) => issue !== PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
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
    console.log(`✓ Target Page Image ${route.workflow} receipt validated: ${source.receipt.slides.length} slide(s)`);
    return 0;
  } catch (error) {
    emitFailed("ppt_flow.validate.page-image", error.message || "Page Image validation failed", "Repair canonical Page Image source or its registered visual inputs, then rerun validate.");
    return 1;
  }
}

// Command: build
// ---------------------------------------------------------------------------

async function commandPageImageBuild(route, { resolution, model, baseUrl, reuseImages, dryRun, force, reason, retiredControlsExplicit }) {
  if (baseUrl || reuseImages || dryRun || force || reason != null || retiredControlsExplicit) {
    return emitUsage(
      "ppt_flow.build.page-image",
      "Page Image build accepts no resolution, model, provider, image-reuse, dry-run, or retired gate overrides",
      "Use receipt-bound image2 plan/authorize/generate/review first, then run build with only the canonical run directory."
    );
  }
  try {
    const operations = await targetImage2Operations(route.workflow);
    const result = await operations.buildDelivery(route.run_dir);
    await refreshProgressiveControllerTaskProjection(route.run_dir);
    console.log(`✓ Target Page Image ${route.workflow} delivery assembled: ${result.delivery.assembly.path}`);
    return 0;
  } catch (error) {
    if (error?.code === "current_protocol_invalid") {
      emitCurrentProtocolError("ppt_flow.build.page-image.identity", route.run_dir, error.code);
      return 1;
    }
    emitFailed(
      "ppt_flow.build.page-image",
      error.message || "Page Image build failed.",
      "Repair the canonical receipt, raw evidence, final manifest, assembly, or speaker notes before retrying."
    );
    return 1;
  }
}

/**
 * build — Build the complete final deck.
 * Executes the receipt-bound Page Image delivery lifecycle.
 *
 * @param {string} runDir
 * @param {{resolution: string, model: string, baseUrl: string|null, reuseImages: boolean, dryRun: boolean, force?: boolean, reason?: string|null}} opts
 */
async function commandBuild(runDir, opts) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.build.identity");
  if (!route) return 1;
  return commandPageImageBuild(route, opts);
}
// Command: refresh
// ---------------------------------------------------------------------------

async function commandPageImageRefresh(route, {
  kind,
  only,
  all,
}) {
  if (route.adapter === "page-image-workflow") {
    if (kind === "visual") {
      return emitUsage(
        "ppt_flow.refresh.target.visual",
        "Target Page Image visual refresh requires a selected-workflow raw rebuild",
        "Run image2 plan, authorize the exact raw scope when needed, generate, review, then build."
      );
    }
    try {
      const operations = await targetImage2Operations(route.workflow);
      if (kind === "notes") {
        if (only || all) return emitUsage("ppt_flow.refresh.target.notes", "Target Page Image notes refresh accepts no slide selectors", "Rerun notes against the current shared target delivery.");
        const result = await operations.refreshNotes(route.run_dir);
        console.log(`✓ Target Page Image notes refreshed: ${result.delivery.notes.notesInjected} slide(s)`);
        return 0;
      }
      if (route.workflow !== "framed") {
        return emitUsage("ppt_flow.refresh.target.title", "Target Pure visible text requires a Pure raw rebuild", "Run the selected Pure image2 raw lifecycle; Framed local refresh is not legal for Pure.");
      }
      if (only && all) return emitUsage("ppt_flow.refresh.target.title", "--only and --all are mutually exclusive", "Select exact Framed stable IDs or use --all.");
      if (!only && !all) return emitUsage("ppt_flow.refresh.target.title", "Framed header overlay refresh requires --only or --all", "Select exact current Framed stable IDs before a provider-free refresh.");
      const slideIds = only ? only.split(",").map((id) => id.trim()).filter(Boolean) : null;
      const result = await operations.refreshFramedText(route.run_dir, { slideIds });
      console.log(`✓ Target Framed refresh delivered without provider submission: ${result.delivery.assembly.path}`);
      return 0;
    } catch (error) {
      if (error?.code === "current_protocol_invalid") {
        emitCurrentProtocolError("ppt_flow.refresh.target.identity", route.run_dir, error.code);
        return 1;
      }
      const rawRequired = /TARGET_(?:ACCEPTED_RAW_EVIDENCE_REQUIRED|RAW_REVIEW|SOURCE_RECEIPT_STALE)|raw_evidence|raw_review/i.test(`${error.code || ""} ${error.message || ""}`);
      if (rawRequired) {
        emitCliError({
          code: CLI_ERROR_CODES.GATE_BLOCKED,
          message: error.message,
          hint: "Use the selected target raw plan and review lifecycle before target finalization.",
          where: "ppt_flow.refresh.target.title",
          diagnostic: {
            schema: CLI_DIAGNOSTIC_SCHEMA,
            category: "gate",
            operation: "target-framed-refresh",
            source: { path: route.run_dir },
            reason: { kind: pageImageDiagnosticReasonKind(error.code, "raw_evidence_required") },
            next: createCliNext("repair_prerequisite", { default: "Build a fresh selected-workflow target raw plan; authorize only a nonzero current scope." }),
          },
        });
        return 1;
      }
      emitFailed("ppt_flow.refresh.target", error.message || "Target Page Image refresh failed.", "Repair the selected workflow source, evidence, final manifest, or notes before retrying.");
      return 1;
    }
  }
}

/**
 * refresh — Run the smallest safe edit chain.
 * Routes only the current Page Image ownership/invalidation path.
 *
 * @param {string} runDir
 * @param {{kind: string, only: string|null, all: boolean}} opts
 */
async function commandRefresh(runDir, { kind, only, all }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.refresh.identity");
  if (!route) return 1;
  return commandPageImageRefresh(route, { kind, only, all });
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
async function commandNewVersion(runDir, { name }) {
  const binding = resolveRunHarnessBinding(runDir, "ppt_flow.new-version.binding");
  if (!binding) return 1;
  const { resolved, deckDir } = binding;
  try {
    const {
      activateCleanPageImageTargetDraft,
    } = await import("./shared/state/state.mjs");
    const source = findSlideSpecs(resolved);
    if (!source) throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    const sourcePipeline = probeProductionMarker(readFileSync(source), { source: basename(source) });
    if (sourcePipeline.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
      throw new Error("CLEAN_TARGET_SOURCE_INVALID");
    }
    const target = createVersion(resolved, name);
    const activation = activateCleanPageImageTargetDraft(deckDir, { sourceRunDir: resolved, targetRunDir: target });
    console.log(`✓ Created clean version: ${target}`);
    console.log("  Generated artifacts were not copied.");
    if (activation) {
      console.log(`  Activated Page Image ${activation.workflow} authoring draft.`);
    }
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
  if (result.kind === "narrative-page-plan") {
    const label = result.applied ? "Applied" : "Preview";
    console.log(`${label}: ${result.plan_sha256}`);
    console.log(`Target: ${result.target_run_version} (${result.target_workflow})`);
    if (result.plan_path) console.log(`Plan: ${result.plan_path}`);
    for (const page of result.pages || []) {
      const lineage = page.blocks.map((block) => `Block ${block.block_ordinal} beats ${block.beat_ordinals.join(",")}`).join("; ");
      console.log(`${String(page.position).padStart(2, "0")}: ${page.slide_id} - ${lineage}`);
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
      // A malformed source cannot silently
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
  if (marker.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    throw new Error("projected source must remain an exact current Page Image marker");
  }
  return marker.branch;
}

function targetStructuralBaseSlidePlan(transaction) {
  const { page_image_target_structural: _ignored, ...base } = transaction;
  return Object.freeze({ ...base, plan_sha256: computeSlideEditPlanSha256(base) });
}

async function parseTargetStructuralReceipt(context, sourceText) {
  const { createPageImageSourceResolver, loadPageImageVisualLanguage } = await import("./02-visual-system/index.mjs");
  const visualLanguage = loadPageImageVisualLanguage(deckRoot(context.runDir));
  return parsePageImageSource(sourceText, {
    source: context.document.source,
    registry: createPageImageSourceResolver({ deckDir: deckRoot(context.runDir), visualLanguage }),
  });
}

async function narrativeVisualSystem() {
  const { createPageImageSourceResolver, loadPageImageVisualLanguage } = await import("./02-visual-system/index.mjs");
  return Object.freeze({ createPageImageSourceResolver, loadPageImageVisualLanguage });
}

/** Bind a current same-workflow structural vNext to the existing exact preview. */
async function enrichTargetPageImageStructuralPlan(context, transaction, applied, targetBranch) {
  if (targetBranch !== PAGE_IMAGE_WORKFLOW_PIPELINE || transaction.publication.mode !== "next-version") return null;
  const marker = probeProductionMarker(applied.text, { source: context.document.source });
  const workflow = marker.frontmatter?.metadata?.production?.workflow;
  const baseSlidePlan = targetStructuralBaseSlidePlan(transaction);
  const targetReceipt = await parseTargetStructuralReceipt(context, applied.text);
  const existing = transaction.page_image_target_structural;
  if (existing) {
    if (existing.slide_edit_plan_sha256 !== baseSlidePlan.plan_sha256 ||
      existing.target_workflow !== workflow ||
      existing.target_source_sha256 !== targetReceipt.source_sha256 ||
      existing.target_source_receipt?.source_sha256 !== targetReceipt.source_sha256) {
      throw new Error("Target Page Image structural plan changed after preview; obtain a fresh preview");
    }
    return Object.freeze({ plan: existing });
  }
  const candidate = previewTargetStructuralVersion({
    sourceRunDir: context.runDir,
    targetRunVersion: transaction.publication.target_version,
    slideEditPlan: baseSlidePlan,
    targetWorkflow: workflow,
    targetSourceText: applied.text,
    targetSourceReceipt: targetReceipt,
  });
  transaction.page_image_target_structural = candidate;
  transaction.plan_sha256 = computeSlideEditPlanSha256(transaction);
  return Object.freeze({ plan: candidate });
}

async function projectConfirmedSlideTransaction(context, transaction, expectedHash) {
  const applied = applySlideEdit(transaction, context.sourceText, {
    expectedPlanSha256: expectedHash,
  });
  const targetBranch = await validateProjectedSlideSource(context, applied.text);
  const targetPageImageStructural = await enrichTargetPageImageStructuralPlan(context, transaction, applied, targetBranch);
  return { ...applied, targetBranch, targetPageImageStructural };
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
  const targetPageImageStructural = applied.targetPageImageStructural;
  if (targetPageImageStructural) {
    const publication = applyTargetStructuralVersion({
      sourceRunDir: context.runDir,
      plan: targetPageImageStructural.plan,
      planHash: targetPageImageStructural.plan.plan_hash,
    });
    return {
      kind: "slide-edit",
      applied: true,
      transaction,
      receipt: {
        ...applied.receipt,
        source_run_dir: context.runDir,
        target_run_dir: publication.target_run_dir,
        pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
        workflow: publication.workflow,
        needs_render: publication.needs_raw_generation,
        page_image_target_structural: {
          plan_hash: targetPageImageStructural.plan.plan_hash,
          materialized_slide_ids: publication.materialized_slide_ids,
          needs_raw_generation: publication.needs_raw_generation,
          provider_calls: publication.provider_calls,
          inherited_acceptance: publication.inherited_acceptance,
        },
      },
      target_run_dir: publication.target_run_dir,
    };
  }
  throw new Error("structural target plan is required for every current Page Image next-version publication");
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
  if (!resolveRunHarnessBinding(runDir, `ppt_flow.slides.${subcommand}.binding`)) return 1;
  try {
    if (subcommand === "narrative-plan") {
      const result = previewNarrativePagePlan({
        sourceRunDir: runDir,
        candidatePath: opts.candidate,
        visualSystem: await narrativeVisualSystem(),
      });
      renderSlidesResult(result, opts.json);
      return 0;
    }
    if (subcommand === "apply-plan") {
      if (!opts.apply) throw new Error("apply-plan requires explicit --apply");
      const resolvedRunDir = resolve(runDir);
      const scratch = resolve(resolvedRunDir, SCRATCH_SUBDIR);
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
      const persisted = JSON.parse(readFileSync(planPath, "utf8"));
      if (persisted?.schema === "narrative-page-plan") {
        if (!opts.planSha256) {
          const error = new Error("narrative apply-plan requires --plan-sha256 from the confirmed narrative preview");
          error.code = "missing_plan_sha256";
          throw error;
        }
        const result = applyNarrativePagePlan({
          sourceRunDir: runDir,
          plan: persisted,
          planSha256: opts.planSha256,
          visualSystem: await narrativeVisualSystem(),
        });
        renderSlidesResult(result, opts.json);
        return 0;
      }
    }
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
        schema: CLI_DIAGNOSTIC_SCHEMA,
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
 * test — Run the bounded core verification tier via npm test.
 */
async function commandTest() {
  const result = spawnSync("npm", ["test"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    env: process.env,
    cwd: resolve(HARNESS_DIR, ".."),
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
      "Inspect the failing core test suite, fix the source, then rerun ppt_flow test",
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
  return route?.adapter === "page-image-workflow" ? route.run_dir : null;
}
const PAGE_IMAGE_OPERATIONS = new Set([
  "plan",
  "artifact-view",
  "pilot",
  "expansion",
  "authorize",
  "generate",
  "pilot-review",
  "pilot-accept",
  "review",
  "accept",
  "reconcile",
]);
const PAGE_IMAGE_HASH_RE = /^[0-9a-f]{64}$/;
const PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE = /^page-image-workflow-[0-9a-f]{64}$/;

function pageImageDiagnosticReasonKind(value, fallback = "page_image_operation_failed") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}

const FRAMED_SOURCE_VALIDATION_CODES = new Set([
  "invalid_header_overlay",
  "untrusted_header_overlay_override",
  "invalid_header_overlay_literal",
  "missing_framed_title",
  "unsupported_header_overlay_preset",
  "unsupported_framed_code_points",
  "font_selection_input_invalid",
  "framed_header_policy_invalid",
  "framed_header_overlay_input_invalid",
  "framed_header_overlay_profile_invalid",
  "framed_header_overlay_contract_invariant_failed",
  "framed_text_fit_failed",
  "framed_visual_language_required",
  "target_source_missing",
  "target_source_receipt_invalid",
]);

const PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES = new Set([
  "page_design_system_source_unavailable",
  "page_design_system_source_invalid",
  "page_design_system_source_escape",
  "page_design_system_source_unreadable",
  "page_design_system_source_too_large",
  "page_design_system_source_utf8_invalid",
]);

const PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES = new Set([
  "pure_provider_input_too_large",
  "framed_provider_input_too_large",
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
  if (["target_style_master_unavailable", "target_style_master_stale", "target_page_derived_publication_invalid", "framed_raw_contract_profile_stale", "human_navigation_invalid"].includes(code)) return true;
  return /^target_(?:source_receipt|source_state|raw_plan|raw_evidence|raw_review|accepted_raw_evidence|final_manifest|final_bytes|delivery)_.*(?:stale|required|missing|invalid|mismatch|drift)$/.test(code)
    || code === "target_raw_review_contribution_stale";
}

function isTargetProviderFailure(code) {
  return /^page_image_provider_/.test(code)
    || /^target_provider_/.test(code)
    || code === "provider_submit_required"
    || code === "target_raw_bytes_invalid";
}

function isImage2ProviderProfileSourceFailure(reason) {
  return reason.startsWith("image2_provider_profile_") && !isImage2RuntimeProfileFailure(reason);
}

function isImage2RuntimeProfileFailure(reason) {
  return reason === "image2_provider_profile_id_missing" ||
    reason === "image2_provider_profile_id_invalid" ||
    reason === "image2_provider_profile_id_mismatch";
}

function isImage2PromptBudgetFailure(reason) {
  return reason === "image2_prompt_budget_overflow" || reason === "image2_prompt_safety_overflow";
}

function image2ProfileSourceLocator(route, error) {
  if (typeof error?.source !== "string" || !error.source || typeof route?.deck_dir !== "string") return null;
  const candidate = resolve(route.deck_dir, ...error.source.split("/"));
  const relation = relative(route.deck_dir, candidate);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) return null;
  return { path: candidate };
}

function image2CapabilityFailureDiagnostic({ common, route, error, reason, operation }) {
  if (isImage2ProviderProfileSourceFailure(reason)) {
    const source = image2ProfileSourceLocator(route, error);
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Image2 provider profile source is not ready.",
      hint: "Repair the selected non-secret provider profile source, then rerun this exact checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        ...(source ? { source } : {}),
        next: createCliNext("edit_source", {
          ...(source ? { inspect: [source] } : {}),
          default: "Repair the selected provider profile source through its source owner, then rerun this exact checkpoint.",
        }),
      },
    };
  }
  if (isImage2RuntimeProfileFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
      hint: "Repair the environment-owned runtime profile selection, then rerun this exact checkpoint.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun this exact checkpoint.",
        }),
      },
    };
  }
  if (isImage2PromptBudgetFailure(reason)) {
    const measurement = error?.measurement;
    const operationId = typeof measurement?.operation === "string" ? measurement.operation : operation;
    const unit = typeof measurement?.unit === "string" ? measurement.unit : undefined;
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The exact Image2 provider prompt exceeds its local admitted budget.",
      hint: "Repair the contributing source or confirmed capability declaration, then rerun the same provider-free plan checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        subject: {
          kind: "image2_prompt_budget",
          ...(operationId ? { id: operationId } : {}),
          ...(unit ? { field: unit } : {}),
        },
        reason: {
          kind: reason,
          ...(Number.isSafeInteger(measurement?.measured) ? { actual: measurement.measured } : {}),
          ...(Number.isSafeInteger(measurement?.limit) ? { expected: measurement.limit } : {}),
        },
        next: createCliNext("edit_source", {
          default: "Repair the contributing source or confirmed capability declaration, then rerun the same provider-free plan checkpoint.",
        }),
      },
    };
  }
  return null;
}

function targetPageImageFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code);
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `target-page-image-${operation}`,
    reason: { kind: reason },
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const capabilityFailure = image2CapabilityFailureDiagnostic({ common, route, error, reason, operation: `target-page-image-${operation}` });
  if (capabilityFailure) return capabilityFailure;

  if (reason.startsWith("progressive_raw")) {
    if (reason === "progressive_raw_attempt_chain_invalid") {
      return {
        code: CLI_ERROR_CODES.FAILED,
        message: "The progressive Page Image attempt history has an immutable integrity conflict.",
        hint: "Report the Harness integrity defect; do not retry, rebuild, edit records, or start provider work.",
        diagnostic: {
          ...common,
          category: "internal",
          next: createCliNext("report_internal", {
            default: "Report the progressive raw integrity conflict with its exact run and plan facts before any further work.",
          }),
        },
      };
    }
    const ownerAction = error?.next_action || null;
    const reconciliation = reason.includes("reconciliation") || reason.includes("outcome_unresolved");
    const gate = reconciliation || /(?:grant_required|authorization|required|batch_terminal|pilot_|complete_review)/.test(reason);
    const provider = reason.includes("provider") && !reconciliation;
    const ownerRequiresHuman = typeof ownerAction?.requires_human === "boolean"
      ? ownerAction.requires_human
      : null;
    const nextAction = reconciliation
      ? "reconcile"
      : ownerRequiresHuman === false
        ? "repair_prerequisite"
        : gate
          ? "review"
          : "repair_prerequisite";
    return {
      code: gate ? CLI_ERROR_CODES.GATE_BLOCKED : CLI_ERROR_CODES.FAILED,
      message: reconciliation
        ? "A persisted provider submission must be reconciled before progressive work can continue."
        : gate
          ? "The progressive Page Image checkpoint is not ready for this operation."
          : provider
            ? "The progressive Page Image provider operation did not complete."
            : "The progressive Page Image raw-owner facts are stale or invalid.",
      hint: "Use the owner-issued next action; do not retry or infer another batch, grant, or provider result.",
      diagnostic: {
        ...common,
        category: provider ? "provider" : gate ? "gate" : "artifact",
        ...(ownerAction ? { subject: { kind: "progressive_raw_action", id: ownerAction.action_id } } : {}),
        next: createCliNext(nextAction, {
          ...(ownerRequiresHuman === null ? {} : { requiresHuman: ownerRequiresHuman }),
          default: ownerAction?.action_id
            ? `Run the raw owner's ${ownerAction.action_id} action after re-reading exact current owner facts.`
            : "Inspect the exact progressive raw owner facts and run its one current action.",
        }),
      },
    };
  }

  if (PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES.has(reason)) {
    const exactSourcePath = typeof error?.details?.source === "string" && error.details.source
      ? resolve(error.details.source)
      : null;
    const exactSource = exactSourcePath ? { path: exactSourcePath } : null;
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Page Design System source is invalid or cannot be read safely.",
      hint: "Repair the exact selected Page Design System source, then rerun the same image2 checkpoint.",
      diagnostic: {
        ...common,
        category: "source_validation",
        ...(exactSource ? { source: exactSource } : {}),
        next: createCliNext("edit_source", {
          ...(exactSource ? { inspect: [exactSource] } : {}),
          default: "Repair the exact selected Page Design System source through its source owner, then rerun the same image2 checkpoint.",
        }),
      },
    };
  }

  if (PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The selected Page Image canonical provider input exceeds its local size bound.",
      hint: "Reduce the contributing source or visual configuration, then rebuild the current Page Image plan.",
      diagnostic: {
        ...common,
        category: "source_validation",
        next: createCliNext("edit_source", {
          default: "Reduce the contributing Page Image source or visual configuration, then rerun image2 plan.",
        }),
      },
    };
  }

  if (FRAMED_SOURCE_VALIDATION_CODES.has(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Framed header overlay is invalid or cannot fit the selected page presentation.",
      hint: "Repair the named Page Source header fields or selected Framed presentation profile, then rerun image2 plan.",
      diagnostic: {
        ...common,
        category: "source_validation",
        source,
        next: createCliNext("edit_source", {
          inspect: [source],
          default: "Repair the current Page Source header fields or selected Framed presentation profile, then rerun image2 plan.",
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
    hint: "Report the Harness defect; source and provider configuration are not the repair owner.",
      diagnostic: {
        ...common,
        category: "internal",
        next: createCliNext("report_internal", {
          default: "Inspect the Framed compiler, profile, or capture owner and report the Harness defect before rerunning.",
        }),
      },
    };
  }

  if (reason === "target_style_master_stale" && error?.next_action === "plan_style_master_successor") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master selection is stale for the selected workflow source.",
      hint: "Publish a provider-free Style Master successor plan, then complete its review and selection before rebuilding raw work.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("plan_style_master_successor", {
          default: "Run Style Master inspection, publish one current successor plan with an explicit candidate count, then review and select it before rerunning image2 plan.",
        }),
      },
    };
  }

  if (operation === "artifact-view" && reason.startsWith("style_master_")) {
    const ownerFailure = styleMasterFailure("inspect", route, error);
    return {
      ...ownerFailure,
      diagnostic: {
        ...ownerFailure.diagnostic,
        operation: common.operation,
      },
    };
  }

  if (isTargetArtifactFailure(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image plan or evidence is stale or incomplete.",
      hint: "Repair the owning Page Image artifact, then rerun the same checkpoint.",
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
      message: "The current Page Image authorization or review gate is not satisfied.",
      hint: "Complete the owner-issued authorization or Complete Page Review prerequisite before continuing.",
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
    message: "The target Page Image operation failed unexpectedly.",
    hint: "Report the Harness failure; provider configuration is not the repair owner for an unknown cause.",
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Inspect the registered Page Image owner and report the Harness failure before rerunning.",
      }),
    },
  };
}

function progressiveUnsupportedOption(operation) {
  const allowed = {
    plan: new Set(),
    "artifact-view": new Set(),
    pilot: new Set(["--plan-hash", "--slide-id"]),
    expansion: new Set(["--plan-hash"]),
    authorize: new Set(["--plan-hash", "--batch-hash"]),
    generate: new Set(["--plan-hash", "--batch-hash"]),
    "pilot-review": new Set(["--plan-hash", "--batch-hash"]),
    "pilot-accept": new Set(["--plan-hash", "--batch-hash", "--decision"]),
    review: new Set(["--plan-hash"]),
    accept: new Set(["--plan-hash", "--decision"]),
    reconcile: new Set(["--plan-hash", "--attempt-sha256"]),
  }[operation] || new Set();
  const rejected = [
    "--slides",
    "--base-url",
    "--profile",
    "--prompt",
    "--provider",
    "--output",
    "--path",
    "--force",
    "--retry",
    "--attempt-id",
    "--candidate-id",
    "--review-hash",
    "--reason",
    "--dry-run",
    "--slot",
    "--slide-id",
    "--plan-hash",
    "--batch-hash",
    "--attempt-sha256",
    "--decision",
  ];
  return rejected.find((option) => hasExplicitCliOption(option) && !allowed.has(option)) || null;
}

function requiredPageImageHash(operation, option, value, label) {
  if (!hasExplicitCliOption(option) || !PAGE_IMAGE_HASH_RE.test(value || "")) {
    emitUsage(`ppt_flow.image2.target.${operation}`, `${option} must be one lowercase SHA-256`, `Pass the exact current ${label} SHA-256 issued by the raw owner.`);
    return null;
  }
  return value;
}

function requiredPilotSlideIds(opts) {
  const values = Array.isArray(opts.slideId) ? opts.slideId : opts.slideId ? [opts.slideId] : [];
  if (!hasExplicitCliOption("--slide-id") || values.length === 0 || values.some((value) => !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value || ""))) {
    emitUsage("ppt_flow.image2.target.pilot", "At least one exact formal --slide-id is required", "Repeat --slide-id once for each current formal slide ID in the proposed Pilot scope.");
    return null;
  }
  return values;
}

function requiredProgressiveDecision(operation, value, allowed = ["proceed", "repair", "redirect"]) {
  if (!hasExplicitCliOption("--decision") || !allowed.includes(value)) {
    const options = allowed.length === 2 ? `${allowed[0]} or ${allowed[1]}` : allowed.join(", ");
    emitUsage(`ppt_flow.image2.target.${operation}`, `--decision must be ${options}`, "Record the explicit human decision for the exact current owner-issued evidence.");
    return null;
  }
  return value;
}

function imageDataUrl(path) {
  const extension = path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${extension};base64,${readFileSync(path).toString("base64")}`;
}

function imageBytesDataUrl(bytes, mediaType) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    const error = new Error("Target Page Image Style Master reference bytes are invalid");
    error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
    throw error;
  }
  if (mediaType !== "image/png" || bytes.length === 0) {
    const error = new Error("Target Page Image Style Master reference media is invalid");
    error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
    throw error;
  }
  return `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function pageImageProviderResponseRecord(payload) {
  return payload?.data && !Array.isArray(payload.data) ? payload.data
    : Array.isArray(payload?.data) ? payload.data[0]
      : payload;
}

function imageBytesFromPageImageProvider(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const encoded = record?.bytes_base64 || record?.b64_json || payload?.bytes_base64 || payload?.b64_json;
  if (typeof encoded !== "string" || !encoded.trim()) {
    const error = new Error("Page Image provider returned no inline PNG bytes");
    error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length) {
    const error = new Error("Page Image provider returned empty PNG bytes");
    error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
    throw error;
  }
  return bytes;
}

function pageImageProviderTaskId(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.task_id || payload?.task_id;
  if (typeof value !== "string") return null;
  const taskId = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(taskId) ? taskId : null;
}

function pageImageProviderHasInlineImage(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return [record?.bytes_base64, record?.b64_json, payload?.bytes_base64, payload?.b64_json]
    .some((value) => typeof value === "string" && value.trim().length > 0);
}

function pageImageProviderTaskStatus(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.status || payload?.status;
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function pageImageProviderTaskResult(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return record?.result || payload?.result || null;
}

function pageImageProviderTaskResultPayload(payload) {
  const result = pageImageProviderTaskResult(payload);
  const images = Array.isArray(result?.images) ? result.images : null;
  return images ? { data: images[0] } : result;
}

function pageImageProviderMediaKnownFailure(actual) {
  const error = new Error("Target Page Image provider returned invalid PNG media");
  error.code = "PAGE_IMAGE_PROVIDER_MEDIA_INVALID";
  error.page_image_known_failure = true;
  error.page_image_known_failure_facts = Object.freeze({
    expected: PAGE_IMAGE_NATIVE_RAW_PNG,
    actual: Object.freeze(actual),
  });
  return error;
}

const PAGE_IMAGE_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

const IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES = new Set([
  "empty",
  "html_like",
  "other_non_json",
]);

function image2InvalidJsonResponseShape(responseText) {
  if (typeof responseText !== "string") return "other_non_json";
  if (responseText.trim().length === 0) return "empty";
  const leadingText = responseText.trimStart();
  return /^(?:<!doctype\s+html(?=[\s>])|<html(?=[\s/>]))/i.test(leadingText)
    ? "html_like"
    : "other_non_json";
}

function pageImageProviderResponseKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
  if (!PAGE_IMAGE_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS.has(classification)) {
    throw new Error("Target Page Image response failure classification is invalid");
  }
  const response = { classification };
  if (classification === "http_error" && Number.isSafeInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) {
    response.http_status = httpStatus;
  }
  if (classification === "invalid_json" && IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES.has(responseShape)) {
    response.response_shape = responseShape;
  }
  const error = new Error("Target Page Image provider returned an unusable response");
  error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID";
  error.page_image_known_failure = true;
  error.page_image_known_failure_facts = Object.freeze({
    response: Object.freeze(response),
  });
  return error;
}

function pageImageProviderTaskPollUnresolved() {
  const error = new Error("Target Page Image provider task outcome could not be resolved");
  error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED";
  return error;
}

function pageImageProviderSubmitUnresolved() {
  const error = new Error("Target Page Image provider submission failed before a response");
  error.code = "PAGE_IMAGE_PROVIDER_SUBMIT_FAILED";
  return error;
}

const STYLE_MASTER_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

function styleMasterProviderKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
  if (!STYLE_MASTER_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS.has(classification)) {
    throw new Error("Style Master response failure classification is invalid");
  }
  const response = { classification };
  if (classification === "http_error" && Number.isSafeInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) {
    response.http_status = httpStatus;
  }
  if (classification === "invalid_json" && IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES.has(responseShape)) {
    response.response_shape = responseShape;
  }
  const error = new Error("Style Master provider returned an unusable response");
  error.code = "style_master_provider_response_invalid";
  error.style_master_known_failure = true;
  error.style_master_known_failure_facts = Object.freeze({ response: Object.freeze(response) });
  return error;
}

function styleMasterProviderMediaKnownFailure() {
  const error = new Error("Style Master provider returned invalid candidate media");
  error.code = "style_master_provider_media_invalid";
  error.style_master_known_failure = true;
  return error;
}

function styleMasterProviderTaskPollUnresolved() {
  const error = new Error("Style Master provider task outcome could not be resolved");
  error.code = "style_master_provider_response_unresolved";
  return error;
}

function styleMasterProviderSubmitUnresolved() {
  const error = new Error("Style Master provider submission did not return a response");
  error.code = "style_master_provider_submit_failed";
  return error;
}

const IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS = 600_000;
const IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS = 1_000;

function image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs }) {
  return Object.freeze({
    // taskPollTimeoutMs remains test-only and bounds the complete operation
    // rather than granting polls a fresh window.
    timeoutMs: Number.isSafeInteger(providerDeadlineMs) && providerDeadlineMs > 0
      ? providerDeadlineMs
      : Number.isSafeInteger(taskPollTimeoutMs) && taskPollTimeoutMs > 0
        ? taskPollTimeoutMs
        : IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS,
    intervalMs: Number.isSafeInteger(taskPollIntervalMs) && taskPollIntervalMs > 0
      ? taskPollIntervalMs
      : IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
  });
}

function createImage2ProviderDeadline({ now, timeoutMs }) {
  const startedAt = now();
  const deadlineAt = startedAt + timeoutMs;
  return Object.freeze({
    remainingMs() {
      return Math.max(0, deadlineAt - now());
    },
  });
}

function image2ProviderDeadlineAbortError() {
  const error = new Error("Image2 provider operation deadline elapsed");
  error.name = "AbortError";
  return error;
}

function awaitWithinImage2ProviderDeadline(work, signal) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      settle(value);
    };
    const onAbort = () => finish(rejectPromise, image2ProviderDeadlineAbortError());
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve()
      .then(work)
      .then((value) => finish(resolvePromise, value), (error) => finish(rejectPromise, error));
  });
}

async function readImage2ProviderResponseJson({
  url,
  options,
  fetchImpl,
  deadline,
  knownFailure,
  unresolved,
  requestUnresolved = unresolved,
}) {
  const remainingMs = deadline.remainingMs();
  if (remainingMs <= 0) throw unresolved();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, remainingMs));
  try {
    let response;
    try {
      response = await awaitWithinImage2ProviderDeadline(
        () => fetchImpl(url, { ...options, signal: controller.signal }),
        controller.signal,
      );
    } catch {
      throw requestUnresolved();
    }
    if (!response || typeof response.ok !== "boolean") {
      throw knownFailure("task_response_invalid");
    }
    if (!response.ok) {
      throw knownFailure("http_error", { httpStatus: response.status });
    }
    if (typeof response.text !== "function") {
      throw knownFailure("task_response_invalid");
    }
    let responseText;
    try {
      responseText = await awaitWithinImage2ProviderDeadline(() => response.text(), controller.signal);
    } catch {
      throw unresolved();
    }
    if (deadline.remainingMs() <= 0) throw unresolved();
    try {
      return JSON.parse(responseText);
    } catch {
      throw knownFailure("invalid_json", { responseShape: image2InvalidJsonResponseShape(responseText) });
    }
  } finally {
    clearTimeout(timer);
  }
}

async function sleepWithinImage2ProviderDeadline({ deadline, sleep, intervalMs, unresolved }) {
  const remainingMs = deadline.remainingMs();
  if (remainingMs <= 0) throw unresolved();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, remainingMs));
  try {
    await awaitWithinImage2ProviderDeadline(() => sleep(Math.min(intervalMs, remainingMs)), controller.signal);
  } catch {
    throw unresolved();
  } finally {
    clearTimeout(timer);
  }
  if (deadline.remainingMs() <= 0) throw unresolved();
}

async function resolveImage2ProviderTask({
  baseUrl,
  apiKey,
  taskId,
  fetchImpl,
  sleep,
  deadline,
  pollIntervalMs,
  knownFailure,
  unresolved,
  completePayload,
}) {
  const taskUrl = `${baseUrl}/tasks/${encodeURIComponent(taskId)}`;

  while (deadline.remainingMs() > 0) {
    const payload = await readImage2ProviderResponseJson({
      url: taskUrl,
      options: {
        method: "GET",
        redirect: "error",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      fetchImpl,
      deadline,
      knownFailure,
      unresolved,
    });
    const status = pageImageProviderTaskStatus(payload);
    if (status === "completed") {
      return completePayload(pageImageProviderTaskResultPayload(payload));
    }
    if (["failed", "error", "cancelled", "canceled", "expired"].includes(status)) {
      throw knownFailure("task_terminal_failure");
    }
    if (!["pending", "queued", "submitted", "running", "processing"].includes(status)) {
      throw knownFailure("task_response_invalid");
    }
    await sleepWithinImage2ProviderDeadline({ deadline, sleep, intervalMs: pollIntervalMs, unresolved });
  }
  throw unresolved();
}

function targetPageImagePngBytesFromProvider(payload) {
  let bytes;
  try {
    bytes = imageBytesFromPageImageProvider(payload);
  } catch {
    throw pageImageProviderMediaKnownFailure({ classification: "empty" });
  }
  const inspected = inspectExactPageImagePng(bytes, PAGE_IMAGE_NATIVE_RAW_PNG);
  if (!inspected.ok && inspected.classification === "invalid_png") {
    throw pageImageProviderMediaKnownFailure({ classification: "invalid_png" });
  }
  if (!inspected.ok) {
    throw pageImageProviderMediaKnownFailure({
      ...(inspected.actual || { classification: inspected.classification }),
    });
  }
  return inspected.bytes;
}

/** Submit an opaque target adapter request without re-evaluating its workflow. */
export function targetPageImageSubmitFactory(plan, {
  credentialResolver = null,
  fetchImpl = fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  providerDeadlineMs = null,
  taskPollTimeoutMs = null,
  taskPollIntervalMs = IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
} = {}) {
  const transportTiming = image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs });
  const slideById = new Map(plan.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const rawWorkPlan = plan.progressive_raw_work_plan || plan.raw_work_plan;
  return async ({ request, item, provider_idempotency_key: providerIdempotencyKey }) => {
    let boundRequest;
    try {
      boundRequest = validateBoundPageImageProviderRequest({
        plan: rawWorkPlan,
        slideId: item?.slide_id,
        request,
      }).request;
    } catch {
      const error = new Error("Target Page Image provider request is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const planItem = rawWorkPlan.items.find((entry) => entry.slide_id === item.slide_id);
    if (!planItem || (item.raw_contract_sha256 && item.raw_contract_sha256 !== planItem.raw_contract_sha256)) {
      const error = new Error("Target Page Image provider item is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const slide = slideById.get(item.slide_id);
    if (!slide || !boundRequest.generation_profile?.provider?.model) {
      const error = new Error("Target Page Image provider request is not bound to the current selected workflow plan");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    if (!PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE.test(providerIdempotencyKey || "")) {
      const error = new Error("Target Page Image provider request is missing its persisted idempotency identity");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    let credentials;
    try {
      if (credentialResolver) {
        credentials = credentialResolver();
      } else {
        const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
        credentials = resolveImage2Credentials();
      }
    } catch {
      const error = new Error("Target Page Image provider credentials are unavailable");
      error.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
      throw error;
    }
    const styleMaster = plan.style_master_reference;
    const profileStyle = boundRequest.generation_profile?.effective_style_master;
    if (!styleMaster || !profileStyle ||
      !Buffer.isBuffer(styleMaster.bytes) ||
      sha256Bytes(styleMaster.bytes) !== styleMaster.candidate_sha256 ||
      profileStyle.selection_sha256 !== styleMaster.selection_sha256 ||
      profileStyle.plan_sha256 !== styleMaster.plan_sha256 ||
      profileStyle.candidate_id !== styleMaster.candidate_id ||
      profileStyle.candidate_sha256 !== styleMaster.candidate_sha256 ||
      profileStyle.candidate_provenance_sha256 !== styleMaster.candidate_provenance_sha256 ||
      profileStyle.candidate_media_type !== styleMaster.candidate_media_type ||
      profileStyle.candidate_width !== styleMaster.candidate_width ||
      profileStyle.candidate_height !== styleMaster.candidate_height ||
      profileStyle.bytes !== styleMaster.bytes.length) {
      const error = new Error("Target Page Image provider request lost its selected immutable Style Master reference");
      error.code = "PAGE_IMAGE_PROVIDER_REQUEST_INVALID";
      throw error;
    }
    const images = [imageBytesDataUrl(styleMaster.bytes, styleMaster.candidate_media_type)];
    const identityPath = slide.visual_language?.identity_reference?.provider_reference?.path;
    if (identityPath) images.push(imageDataUrl(identityPath));
    const body = {
      model: boundRequest.generation_profile.provider.model,
      prompt: boundRequest.compiled_provider_input.utf8,
      n: 1,
      size: PAGE_IMAGE_REQUEST_SIZE,
      image: images[0],
      images,
      image_urls: images,
    };
    // The same deadline owns the submit response and every task poll spawned
    // by that submit. It begins immediately before the provider POST.
    const deadline = createImage2ProviderDeadline({ now, timeoutMs: transportTiming.timeoutMs });
    const payload = await readImage2ProviderResponseJson({
      url: `${credentials.base_url}/images/generations`,
      options: {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${credentials.api_key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": providerIdempotencyKey,
        },
        body: JSON.stringify(body),
      },
      fetchImpl,
      deadline,
      knownFailure: pageImageProviderResponseKnownFailure,
      unresolved: pageImageProviderTaskPollUnresolved,
      requestUnresolved: pageImageProviderSubmitUnresolved,
    });
    const taskId = pageImageProviderTaskId(payload);
    if (taskId && !pageImageProviderHasInlineImage(payload)) {
      return resolveImage2ProviderTask({
        baseUrl: credentials.base_url,
        apiKey: credentials.api_key,
        taskId,
        fetchImpl,
        sleep,
        deadline,
        pollIntervalMs: transportTiming.intervalMs,
        knownFailure: pageImageProviderResponseKnownFailure,
        unresolved: pageImageProviderTaskPollUnresolved,
        completePayload: targetPageImagePngBytesFromProvider,
      });
    }
    return targetPageImagePngBytesFromProvider(payload);
  };
}

/** Resolve the one remote Image2 credential pair before the raw owner may write an attempt. */
async function targetPageImageGenerateCredentials(runDir, { expectedProfileId } = {}) {
  try {
    loadDotenv(deckRoot(runDir));
    loadDotenv(process.cwd());
    const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId });
  } catch {
    const error = new Error("Target Page Image provider credentials are unavailable");
    error.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
    throw error;
  }
}

async function initializeStyleMasterImage2Transport({ run_dir: runDir, candidate_generation_profile: profile } = {}) {
  try {
    loadDotenv(deckRoot(runDir));
    loadDotenv(process.cwd());
    const { resolveImage2Credentials } = await import("./shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId: profile?.provider?.profile_id });
  } catch {
    const error = new Error("Style Master provider credentials are unavailable");
    error.code = "style_master_provider_credentials_unavailable";
    throw error;
  }
}

function styleMasterProviderBytesFromPayload(payload) {
  try {
    const bytes = imageBytesFromPageImageProvider(payload);
    const decoded = decodePng(bytes, { checkCrc: true });
    if (!Number.isInteger(decoded.width) || decoded.width <= 0 || !Number.isInteger(decoded.height) || decoded.height <= 0) {
      throw new Error("invalid dimensions");
    }
    return bytes;
  } catch {
    throw styleMasterProviderMediaKnownFailure();
  }
}

/** Submit one plan-bound Style Master candidate request through the existing Image2 transport. */
export function styleMasterSubmitFactory({
  fetchImpl = fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  providerDeadlineMs = null,
  taskPollTimeoutMs = null,
  taskPollIntervalMs = IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS,
} = {}) {
  const transportTiming = image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs });
  return async ({ compiled_prompt_bytes: compiledPromptBytes, candidate_generation_profile: profile, transport }) => {
    if (!Buffer.isBuffer(compiledPromptBytes) || compiledPromptBytes.length === 0 ||
      !profile?.provider?.model || !transport?.base_url || !transport?.api_key) {
      const error = new Error("Style Master provider request is not bound to its plan generation profile");
      error.code = "style_master_provider_request_invalid";
      error.style_master_known_failure = true;
      throw error;
    }
    const deadline = createImage2ProviderDeadline({ now, timeoutMs: transportTiming.timeoutMs });
    const payload = await readImage2ProviderResponseJson({
      url: `${transport.base_url}/images/generations`,
      options: {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${transport.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: profile.provider.model,
          prompt: compiledPromptBytes.toString("utf8"),
          n: 1,
          size: "2000x1125",
        }),
      },
      fetchImpl,
      deadline,
      knownFailure: styleMasterProviderKnownFailure,
      unresolved: styleMasterProviderTaskPollUnresolved,
      requestUnresolved: styleMasterProviderSubmitUnresolved,
    });
    const taskId = pageImageProviderTaskId(payload);
    if (taskId && !pageImageProviderHasInlineImage(payload)) {
      return resolveImage2ProviderTask({
        baseUrl: transport.base_url,
        apiKey: transport.api_key,
        taskId,
        fetchImpl,
        sleep,
        deadline,
        pollIntervalMs: transportTiming.intervalMs,
        knownFailure: styleMasterProviderKnownFailure,
        unresolved: styleMasterProviderTaskPollUnresolved,
        completePayload: styleMasterProviderBytesFromPayload,
      });
    }
    return styleMasterProviderBytesFromPayload(payload);
  };
}

async function targetImage2Operations(workflow) {
  if (workflow === "framed") {
    const owner = await import("./03-framed-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolveFramedTargetSource,
      resolveCandidateSource: owner.resolveFramedTargetCandidateSource,
      resolveStyleMasterScope: owner.resolveFramedStyleMasterScope,
      buildPlan: owner.buildFramedProgressiveTargetRawPlan,
      readStoredPlan: owner.readFramedProgressiveTargetStoredPlanContext,
      projectPlan: owner.framedProgressiveRawPlanProjection,
      pilot: owner.planFramedTargetPilot,
      expansion: owner.planFramedTargetExpansion,
      authorize: owner.authorizeFramedProgressiveRawBatch,
      generate: owner.generateFramedProgressiveRawItem,
      pilotReview: owner.prepareFramedProgressivePilotReview,
      pilotAccept: owner.acceptFramedProgressivePilot,
      review: owner.prepareFramedProgressiveRawReview,
      accept: owner.acceptFramedProgressiveRawReview,
      reconcile: owner.reconcileFramedProgressiveRawAttempt,
      inspectPilotReview: owner.inspectFramedProgressivePilotPageReview,
      inspectCurrentReview: owner.inspectFramedProgressiveCurrentCompletePageReview,
      inspectAcceptedReview: owner.inspectFramedProgressiveCompletePageReview,
      buildDelivery: owner.buildFramedProgressiveTargetDelivery,
      refreshFramedText: owner.refreshFramedTargetText,
      refreshNotes: owner.refreshFramedTargetNotes,
    });
  }
  if (workflow === "pure") {
    const owner = await import("./04-pure-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolvePureTargetSource,
      resolveCandidateSource: owner.resolvePureTargetCandidateSource,
      resolveStyleMasterScope: owner.resolvePureStyleMasterScope,
      buildPlan: owner.buildPureProgressiveTargetRawPlan,
      readStoredPlan: owner.readPureProgressiveTargetStoredPlanContext,
      projectPlan: owner.pureProgressiveRawPlanProjection,
      pilot: owner.planPureTargetPilot,
      expansion: owner.planPureTargetExpansion,
      authorize: owner.authorizePureProgressiveRawBatch,
      generate: owner.generatePureProgressiveRawItem,
      pilotReview: owner.preparePureProgressivePilotReview,
      pilotAccept: owner.acceptPureProgressivePilot,
      review: owner.preparePureProgressiveRawReview,
      accept: owner.acceptPureProgressiveRawReview,
      reconcile: owner.reconcilePureProgressiveRawAttempt,
      inspectPilotReview: owner.inspectPureProgressivePilotPageReview,
      inspectCurrentReview: owner.inspectPureProgressiveCurrentCompletePageReview,
      inspectAcceptedReview: owner.inspectPureProgressiveCompletePageReview,
      buildDelivery: owner.buildPureProgressiveTargetDelivery,
      refreshNotes: owner.refreshPureTargetNotes,
    });
  }
  const error = new Error("Target Page Image workflow is unavailable");
  error.code = "TARGET_WORKFLOW_REQUIRED";
  throw error;
}

/** Rebuild the non-authoritative progressive collaboration card after a Controller checkpoint. */
async function refreshProgressiveControllerTaskProjection(runDir, { workflowInspection = null, state = null } = {}) {
  const inspection = workflowInspection || (await import("./shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir });
  const { progressiveControllerTaskProjectionEligibility } = await import("./shared/workflow/progressive_controller_task_projection_eligibility.mjs");
  const eligibility = progressiveControllerTaskProjectionEligibility({ runDir, inspection, state });
  if (!eligibility.eligible) return Object.freeze({ status: "not-applicable" });
  const { refreshPageProductionTaskProjection } = await import("./shared/workflow/page_production_task_projection.mjs");
  return refreshPageProductionTaskProjection({ runDir, inspection, state: eligibility.state });
}

function artifactReferenceEntry({ label, artifactType, purpose, locator, kind, sha256 }) {
  return Object.freeze({
    label,
    artifact_type: artifactType,
    purpose,
    locator,
    reference: Object.freeze({ kind, sha256 }),
  });
}

function artifactUnavailable(category, reason) {
  return Object.freeze({ category, reason });
}

function pageArtifactGroup(position, slideId, artifacts) {
  return Object.freeze({ position, slide_id: slideId, artifacts: Object.freeze(artifacts) });
}

/** Compose the provider-free human view solely from current owner inspections. */
async function rebuildTargetPageImageArtifactView(route) {
  const operations = await targetImage2Operations(route.workflow);
  const styleMasterOwner = await import("./shared/image2/style_master_plan.mjs");
  const styleScope = operations.resolveStyleMasterScope(route.run_dir);
  const pendingSuccessor = await styleMasterOwner.inspectPendingStyleMasterSuccessorCandidateArtifacts({
    scope: styleScope,
  });
  const paths = pageImageWorkflowPaths(route.run_dir);

  if (pendingSuccessor) {
    const styleMaster = [];
    const unavailable = [];
    for (const candidate of pendingSuccessor.candidates) {
      if (candidate.availability === "available") {
        styleMaster.push(artifactReferenceEntry({
          label: candidate.candidate_id,
          artifactType: candidate.candidate_media_type,
          purpose: "Inspect this pending Style Master candidate; it is not accepted for raw work.",
          locator: candidate.locator,
          kind: "style",
          sha256: candidate.candidate_sha256,
        }));
        continue;
      }
      unavailable.push(artifactUnavailable(
        `Style Master candidate ${candidate.candidate_id}`,
        `generated candidate lifecycle is ${candidate.lifecycle_state}; verified media is unavailable`,
      ));
    }
    unavailable.push(
      artifactUnavailable("Provider input", "a pending Style Master successor has no current raw plan"),
      artifactUnavailable("Raw and Complete Page Review", "a pending Style Master successor has no current raw plan"),
      artifactUnavailable("Final media", "a pending Style Master successor is not accepted for raw work"),
      artifactUnavailable("Delivery", "a pending Style Master successor is not accepted for delivery"),
    );
    const output = writeHumanArtifactNavigation({
      run_dir: route.run_dir,
      workflow: route.workflow,
      style_master: styleMaster,
      page_artifacts: [],
      deck_artifacts: [],
      unavailable,
    });
    return Object.freeze({
      ...output,
      pending_successor: Object.freeze({ next_action: pendingSuccessor.next_action }),
    });
  }

  const rawOwner = await import("./shared/image2/page_image_progressive_raw_owner.mjs");
  const candidate = operations.resolveCandidateSource(route.run_dir);
  const styleInspection = await styleMasterOwner.inspectStyleMasterCandidates({ scope: styleScope });
  const styleMaster = [];
  const deckArtifacts = [];
  const pageById = new Map();
  const unavailable = [];

  if (styleInspection.selection) {
    const selected = styleMasterOwner.resolveAcceptedStyleMasterReference({
      runDir: route.run_dir,
      receipt: candidate.receipt,
    });
    styleMaster.push(artifactReferenceEntry({
      label: selected.candidate_id,
      artifactType: selected.candidate_media_type,
      purpose: "Inspect the current accepted Style Master candidate.",
      locator: selected.candidate_path,
      kind: "style",
      sha256: selected.candidate_sha256,
    }));
  } else {
    unavailable.push(artifactUnavailable("Style Master", "no current accepted Style Master candidate is available"));
  }

  const rawInspection = rawOwner.inspectProgressiveRawLifecycle({
    runDir: route.run_dir,
    workflow: route.workflow,
  });
  if (!rawInspection.ok) {
    const error = new Error("current progressive raw lifecycle is invalid");
    error.code = rawInspection.code;
    throw error;
  }
  if (!rawInspection.plan) {
    unavailable.push(
      artifactUnavailable("Provider input", "no current raw plan has been published"),
      artifactUnavailable("Raw and Complete Page Review", "no current raw plan has been published"),
      artifactUnavailable("Final media", "no accepted raw evidence is available"),
      artifactUnavailable("Delivery", "no delivery receipt is available"),
    );
    return writeHumanArtifactNavigation({
      run_dir: route.run_dir,
      workflow: route.workflow,
      style_master: styleMaster,
      page_artifacts: [],
      deck_artifacts: deckArtifacts,
      unavailable,
    });
  }

  // This public selected-workflow reader revalidates the current source/plan binding.
  const stored = operations.readStoredPlan(route.run_dir);
  const currentRaw = rawOwner.inspectProgressiveRawLifecycle({
    runDir: route.run_dir,
    workflow: route.workflow,
    expected_plan: stored.progressive_raw_work_plan,
  });
  if (!currentRaw.ok || !currentRaw.plan) {
    const error = new Error("current progressive raw plan is unavailable");
    error.code = currentRaw.code || "progressive_raw_owner_invalid";
    throw error;
  }
  deckArtifacts.push(artifactReferenceEntry({
    label: "current raw work plan",
    artifactType: "Page Image raw work plan",
    purpose: "Inspect the current provider-free raw lifecycle scope.",
    locator: paths.target_raw_plan,
    kind: "plan",
    sha256: currentRaw.plan.plan_hash,
  }));
  if (existsSync(paths.target_provider_request_inspection)) {
    unavailable.push(artifactUnavailable("Provider input", "detailed provider input remains outside Human Navigation"));
  } else {
    unavailable.push(artifactUnavailable("Provider input", "the current raw plan has no provider-input inspection projection"));
  }

  const pilotReview = operations.inspectPilotReview(route.run_dir);
  if (pilotReview.available) {
    const reviewRoot = join(paths.review_root, "pilot", resolveContentAddressName(join(paths.review_root, "pilot"), pilotReview.batch.sha256));
    for (const slideId of pilotReview.batch.review_sample_slide_ids) {
      const position = stored.progressive_raw_work_plan.ordered_slide_ids.indexOf(slideId) + 1;
      const filename = pageImageOrdinalImageFilename(position, slideId);
      const existing = pageById.get(slideId);
      const pageArtifacts = [
        ...(existing?.artifacts || []),
        artifactReferenceEntry({
          label: "Pilot provider page",
          artifactType: "Pilot Page Review provider PNG",
          purpose: "Inspect the current Pilot provider-rendered page.",
          locator: join(reviewRoot, "provider-page", filename),
          kind: "review",
          sha256: pilotReview.pilot_evidence_sha256,
        }),
      ];
      if (pilotReview.presentation.presentation.has_complete_page_artifact) {
        pageArtifacts.push(artifactReferenceEntry({
          label: "Framed Pilot page",
          artifactType: "production-equivalent Pilot PNG",
          purpose: "Inspect the Framed Pilot page with its validated header overlay.",
          locator: join(reviewRoot, "complete-page", filename),
          kind: "review",
          sha256: pilotReview.pilot_evidence_sha256,
        }));
      }
      pageById.set(slideId, pageArtifactGroup(position, slideId, pageArtifacts));
    }
    deckArtifacts.push(artifactReferenceEntry({
      label: "Pilot Page Review contact sheet",
      artifactType: "Pilot Page Review contact-sheet PNG",
      purpose: "Inspect the current Pilot review across its selected sample.",
      locator: join(reviewRoot, "pilot-page-review.png"),
      kind: "review",
      sha256: pilotReview.presentation.projection_sha256,
    }));
  } else {
    unavailable.push(artifactUnavailable("Pilot Page Review", "a current partial Pilot review is not available"));
  }

  const currentReview = operations.inspectCurrentReview(route.run_dir);
  let acceptedReview = null;
  const completeReview = currentReview.available
    ? currentReview
    : currentRaw.evidence?.accepted_raw_evidence_sha256
      ? operations.inspectAcceptedReview(route.run_dir)
      : null;
  if (completeReview) {
    const review = completeReview.presentation;
    const reviewRoot = join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), completeReview.raw.plan.sha256));
    const isCurrentReview = currentReview.available;
    for (const [index, slideId] of completeReview.raw.plan.ordered_slide_ids.entries()) {
      const filename = pageImageOrdinalImageFilename(index + 1, slideId);
      const existing = pageById.get(slideId);
      const pageArtifacts = [
        ...(existing?.artifacts || []),
        artifactReferenceEntry({
          label: isCurrentReview ? "current provider page" : "provider page",
          artifactType: "Complete Page Review provider PNG",
          purpose: isCurrentReview
            ? "Inspect the current provider-rendered page before the Complete Page Review decision."
            : "Inspect the accepted provider-rendered page in the complete-page review.",
          locator: join(reviewRoot, "provider-page", filename),
          kind: "review",
          sha256: completeReview.raw.complete_raw_review_sha256,
        }),
      ];
      if (review.has_complete_page_artifact) {
        pageArtifacts.push(artifactReferenceEntry({
          label: isCurrentReview ? "current Framed complete page" : "Framed complete page",
          artifactType: "production-equivalent complete-page PNG",
          purpose: isCurrentReview
            ? "Inspect the current Framed provider page with its validated header overlay before the Complete Page Review decision."
            : "Inspect the Framed provider page with its validated header overlay.",
          locator: join(reviewRoot, "complete-page", filename),
          kind: "review",
          sha256: completeReview.raw.complete_raw_review_sha256,
        }));
      }
      pageById.set(slideId, pageArtifactGroup(existing?.position || index + 1, slideId, pageArtifacts));
    }
    deckArtifacts.push(artifactReferenceEntry({
      label: "Complete Page Review contact sheet",
      artifactType: "Complete Page Review contact-sheet PNG",
      purpose: isCurrentReview
        ? "Inspect the current complete-page review across the full plan before its decision."
        : "Inspect the accepted complete-page review across the full plan.",
      locator: join(reviewRoot, "complete-page-review.png"),
      kind: "review",
      sha256: review.projection_sha256,
    }));
    if (!isCurrentReview) acceptedReview = completeReview;
  } else {
    unavailable.push(artifactUnavailable("Complete Page Review", "no current undecided or accepted complete-page review evidence is available"));
  }

  let finalInspection = null;
  if (acceptedReview) {
    finalInspection = inspectCurrentFinalSlideManifestFromRun({
      runDir: route.run_dir,
      rawWorkPlan: acceptedReview.raw.plan,
      acceptedRawEvidence: acceptedReview.raw.accepted_raw_evidence,
    });
    if (finalInspection.available) {
      for (const item of finalInspection.manifest.items) {
        const group = pageById.get(item.slide_id);
        if (!group) continue;
        pageById.set(item.slide_id, pageArtifactGroup(group.position, group.slide_id, [
          ...group.artifacts,
          artifactReferenceEntry({
            label: "final slide",
            artifactType: "final PNG",
            purpose: "Inspect the exact final page media used for delivery.",
            locator: join(paths.final_root, item.path),
            kind: "manifest",
            sha256: finalInspection.manifest_sha256,
          }),
        ]));
      }
    } else {
      unavailable.push(artifactUnavailable("Final media", "a current final manifest has not been published"));
    }
  } else {
    unavailable.push(artifactUnavailable("Final media", "accepted complete-page review evidence is not available"));
  }

  const delivery = await inspectCurrentTargetPageImageDelivery({ runDir: route.run_dir });
  if (delivery.available) {
    const deliverySha256 = deliveryReceiptSha256(delivery.receipt);
    for (const entry of delivery.delivery_media.manifest.entries) {
      const group = pageById.get(entry.slide_id);
      if (!group) continue;
      pageById.set(entry.slide_id, pageArtifactGroup(group.position, group.slide_id, [
        ...group.artifacts,
        artifactReferenceEntry({
          label: "delivery slide",
          artifactType: "delivery JPEG",
          purpose: "Inspect the JPEG image embedded in the delivered PPTX.",
          locator: delivery.delivery_media.media_by_slide[entry.slide_id].path,
          kind: "delivery",
          sha256: deliverySha256,
        }),
      ]));
    }
    deckArtifacts.push(
      artifactReferenceEntry({
        label: "delivered PPTX",
        artifactType: "PPTX",
        purpose: "Inspect the current assembled presentation.",
        locator: delivery.pptxPath,
        kind: "pptx",
        sha256: delivery.receipt.pptx_sha256,
      }),
      artifactReferenceEntry({
        label: "notes receipt",
        artifactType: "notes receipt JSON",
        purpose: "Inspect the current speaker-notes injection receipt.",
        locator: join(paths.final_root, "notes-receipt.json"),
        kind: "notes",
        sha256: delivery.receipt.notes_receipt_sha256,
      }),
      artifactReferenceEntry({
        label: "delivery receipt",
        artifactType: "delivery receipt JSON",
        purpose: "Inspect the current delivery lineage binding.",
        locator: delivery.receiptPath,
        kind: "delivery",
        sha256: deliverySha256,
      }),
    );
  } else {
    unavailable.push(artifactUnavailable("Delivery", "a current delivery receipt has not been published"));
  }

  return writeHumanArtifactNavigation({
    run_dir: route.run_dir,
    workflow: route.workflow,
    style_master: styleMaster,
    page_artifacts: [...pageById.values()].sort((left, right) => left.position - right.position || left.slide_id.localeCompare(right.slide_id)),
    deck_artifacts: deckArtifacts,
    unavailable,
  });
}

/** Execute the fixed progressive raw lifecycle through the marker-selected owner. */
async function commandTargetPageImageImage2(operation, route, opts = {}) {
  if (!PAGE_IMAGE_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.image2.target.operation", `Target Page Image image2 operation ${JSON.stringify(operation)} is not supported`, "Use plan, artifact-view, pilot, expansion, authorize, generate, pilot-review, pilot-accept, review, accept, or reconcile.");
  }
  const override = progressiveUnsupportedOption(operation);
  if (override) {
    return emitUsage("ppt_flow.image2.target", `${override} is not accepted for progressive Page Image`, "Use only the registered progressive form and exact raw-owner hashes or formal IDs.");
  }
  try {
    if (operation === "artifact-view") {
      const output = await rebuildTargetPageImageArtifactView(route);
      const result = {
        run_dir: output.run_dir,
        workflow: output.workflow,
        artifact_view: output.path,
        human_navigation_root: output.root,
        ...(output.pending_successor ? { next_action: output.pending_successor.next_action } : {}),
      };
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }
    const operations = await targetImage2Operations(route.workflow);
    let output;
    if (operation === "plan") {
      const plan = await operations.buildPlan(route.run_dir, { allowSourceRebuild: true });
      output = operations.projectPlan(plan);
    } else if (operation === "pilot") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const slideIds = requiredPilotSlideIds(opts);
      if (!planHash || !slideIds) return 1;
      output = await operations.pilot(route.run_dir, { planHash, slideIds });
    } else if (operation === "expansion") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      if (!planHash) return 1;
      output = await operations.expansion(route.run_dir, { planHash });
    } else if (operation === "authorize") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      output = await operations.authorize(route.run_dir, { planHash, batchHash });
      const { recordTargetProgressiveAuthorizeCliHandoff } = await import("./shared/state/state.mjs");
      const controllerHandoff = recordTargetProgressiveAuthorizeCliHandoff(route.deck_dir, {
        runDir: route.run_dir,
        planHash,
        batchHash,
        grantHash: output.grant_hash,
      });
      output = Object.freeze({ ...output, controller_handoff: controllerHandoff });
    } else if (operation === "generate") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      const plan = await operations.readStoredPlan(route.run_dir);
      let credentials = null;
      output = await operations.generate(route.run_dir, {
        planHash,
        batchHash,
        preflight: async ({ request }) => {
          credentials = await targetPageImageGenerateCredentials(route.run_dir, {
            expectedProfileId: request?.generation_profile?.provider?.profile_id,
          });
        },
        submit: targetPageImageSubmitFactory(plan, {
          credentialResolver: () => {
            if (!credentials) throw new Error("Target Page Image provider credentials were not preflighted");
            return credentials;
          },
        }),
      });
    } else if (operation === "pilot-review") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      output = await operations.pilotReview(route.run_dir, { planHash, batchHash });
    } else if (operation === "pilot-accept") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      const decision = requiredProgressiveDecision(operation, opts.decision);
      if (!planHash || !batchHash || !decision) return 1;
      output = await operations.pilotAccept(route.run_dir, { planHash, batchHash, decision });
    } else if (operation === "review") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      if (!planHash) return 1;
      output = await operations.review(route.run_dir, { planHash });
    } else if (operation === "accept") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const decision = requiredProgressiveDecision(operation, opts.decision, ["proceed", "repair"]);
      if (!planHash || !decision) return 1;
      output = await operations.accept(route.run_dir, { planHash, decision });
    } else {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const attemptSha256 = requiredPageImageHash(operation, "--attempt-sha256", opts.attemptSha256, "submitted attempt");
      if (!planHash || !attemptSha256) return 1;
      output = await operations.reconcile(route.run_dir, { planHash, attemptSha256 });
    }
    await refreshProgressiveControllerTaskProjection(route.run_dir);
    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    const failure = targetPageImageFailure(operation, route, error);
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
  return commandTargetPageImageImage2(operation, route, opts);
}

const STYLE_MASTER_OPERATIONS = new Set([
  "inspect",
  "plan",
  "authorize",
  "generate",
  "review",
  "accept",
  "abandon",
]);
const STYLE_MASTER_PLAN_HASH_RE = /^[0-9a-f]{64}$/;

function styleMasterNextInvocation(route, operation, options = {}) {
  const args = [__filename, "style-master", operation, route.run_dir];
  if (options.planHash) args.push("--plan-hash", options.planHash);
  if (options.candidateCount !== undefined) args.push("--candidate-count", String(options.candidateCount));
  if (options.decision) args.push("--decision", options.decision);
  if (options.candidateId) args.push("--candidate-id", options.candidateId);
  if (options.reason) args.push("--reason", options.reason);
  return Object.freeze({ program: "node", args: Object.freeze(args) });
}

function styleMasterUnexpectedOption(operation) {
  const allowed = {
    inspect: new Set(["--plan-hash"]),
    plan: new Set(["--candidate-count"]),
    authorize: new Set(["--plan-hash"]),
    generate: new Set(["--plan-hash"]),
    review: new Set(["--plan-hash"]),
    accept: new Set(["--plan-hash", "--decision", "--candidate-id"]),
    abandon: new Set(["--plan-hash", "--reason"]),
  }[operation] || new Set();
  return ["--plan-hash", "--candidate-count", "--decision", "--candidate-id", "--reason"]
    .find((option) => hasExplicitCliOption(option) && !allowed.has(option)) || null;
}

function requiredStyleMasterPlanHash(operation, opts) {
  if (!hasExplicitCliOption("--plan-hash")) {
    emitUsage(`ppt_flow.style-master.${operation}`, "--plan-hash is required", "Pass the exact current Style Master plan SHA-256.");
    return null;
  }
  if (!STYLE_MASTER_PLAN_HASH_RE.test(opts.planHash || "")) {
    emitUsage(`ppt_flow.style-master.${operation}`, "--plan-hash must be one lowercase SHA-256", "Pass the exact current Style Master plan SHA-256.");
    return null;
  }
  return opts.planHash;
}

function requestedStyleMasterCandidateCount(opts) {
  if (!hasExplicitCliOption("--candidate-count")) {
    emitUsage("ppt_flow.style-master.plan", "--candidate-count is required", "Pass one explicit candidate count from 0 through 4.");
    return null;
  }
  if (!/^[0-4]$/.test(String(opts.candidateCount || ""))) {
    emitUsage("ppt_flow.style-master.plan", "--candidate-count must be an integer from 0 through 4", "Pass one explicit candidate count from 0 through 4.");
    return null;
  }
  return Number(opts.candidateCount);
}

function styleMasterFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code, "style_master_operation_failed");
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `style-master-${operation}`,
    reason: Object.freeze({ kind: reason }),
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const capabilityFailure = image2CapabilityFailureDiagnostic({ common, route, error, reason, operation: `style-master-${operation}` });
  if (capabilityFailure) return capabilityFailure;

  if ([
    "style_master_intent_invalid",
    "style_master_context_invalid",
    "style_master_prompt_invalid",
    "style_master_local_invalid",
    "style_master_local_unstable",
    "style_master_scope_candidate_invalid",
  ].includes(reason)) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master intent, visual context, or local candidate is invalid.",
      hint: "Repair the canonical source or local presentation asset, then rerun the Style Master operation.",
      diagnostic: {
        ...common,
        category: "source_validation",
        source,
        next: createCliNext("edit_source", {
          inspect: [source],
          default: "Repair the selected workflow source or canonical Style Master input, then rerun this operation.",
        }),
      },
    };
  }

  if (reason === "style_master_scope_workflow_required") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "Style Master work requires one selected target workflow.",
      hint: "Record the selected Framed or Pure workflow before starting Style Master work.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("review", {
          default: "Select one target workflow through the Controller, then rerun Style Master inspection.",
        }),
      },
    };
  }

  if (reason === "style_master_provider_credentials_unavailable") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "Style Master candidate generation cannot access the Image2 credentials.",
      hint: "Repair Image2 credentials or endpoint configuration, then rerun the exact generate operation.",
      diagnostic: {
        ...common,
        category: "environment",
        next: createCliNext("repair_environment", {
          default: "Repair the Image2 credential and endpoint configuration, then rerun the exact Style Master generate operation.",
        }),
      },
    };
  }

  if (reason === "style_master_grant_missing" || reason === "style_master_plan_not_authorizable") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "Style Master candidate generation requires its exact current cost authorization.",
      hint: "Review and authorize the exact current Style Master candidate plan before generation.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("approve", {
          invocation: styleMasterNextInvocation(route, "authorize", {
            planHash: error?.plan_sha256 || null,
          }),
          default: "Obtain human approval for the exact current Style Master candidate cost, then authorize that plan.",
        }),
      },
    };
  }

  if (reason === "style_master_attempt_unknown") {
    return {
      code: CLI_ERROR_CODES.GATE_BLOCKED,
      message: "A submitted Style Master candidate has an unknown provider outcome.",
      hint: "Provide a human reason to abandon the exact current plan; do not retry the provider request.",
      diagnostic: {
        ...common,
        category: "gate",
        next: createCliNext("review", {
          default: "Review the unknown submitted candidate and provide a reasoned exact-plan abandonment if recovery is required.",
        }),
      },
    };
  }

  if (reason.startsWith("style_master_provider_") || reason.startsWith("style_master_transport_")) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Style Master Image2 provider operation did not complete.",
      hint: "Repair provider availability, then inspect the exact candidate plan before continuing.",
      diagnostic: {
        ...common,
        category: "provider",
        next: createCliNext("inspect", {
          invocation: styleMasterNextInvocation(route, "inspect"),
          default: "Inspect the exact current Style Master plan before deciding whether provider recovery is known or unknown.",
        }),
      },
    };
  }

  if (reason === "style_master_selection_conflict") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The effective Style Master selection changed before promotion could commit.",
      hint: "Inspect and review the current Style Master selection before another promotion attempt.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("review", {
          default: "Review the current Style Master candidates and selection before recording another visual-direction decision.",
        }),
      },
    };
  }

  if (reason === "style_master_plan_stale") {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The Style Master plan no longer matches the current confirmed compiler or capability profile.",
      hint: "Preserve the historical plan and publish its existing provider-free successor before continuing.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("plan_style_master_successor", {
          default: "Publish the current Style Master successor plan, then complete its existing review and selection path.",
        }),
      },
    };
  }

  if (reason.startsWith("style_master_")) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Style Master lifecycle record is stale, incomplete, or inconsistent.",
      hint: "Inspect the current Style Master owner projection and follow its one next action.",
      diagnostic: {
        ...common,
        category: "artifact",
        next: createCliNext("inspect", {
          invocation: styleMasterNextInvocation(route, "inspect"),
          default: "Inspect the current Style Master owner projection, then follow its exact next action.",
        }),
      },
    };
  }

  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The Style Master operation failed unexpectedly.",
    hint: "Report the Harness failure; do not infer a provider or recovery route.",
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Inspect the registered Style Master owner and report the Harness failure before rerunning.",
      }),
    },
  };
}

async function commandStyleMaster(operation, runDir, opts = {}) {
  if (!STYLE_MASTER_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.style-master.operation", `Style Master operation ${JSON.stringify(operation)} is not supported`, "Use inspect, plan, authorize, generate, review, accept, or abandon.");
  }
  const unexpected = styleMasterUnexpectedOption(operation);
  if (unexpected) {
    return emitUsage(`ppt_flow.style-master.${operation}`, `${unexpected} is not accepted for Style Master ${operation}`, "Use only the fixed arguments for this current Style Master operation.");
  }

  let planHash = null;
  let candidateCount = null;
  if (["authorize", "generate", "review", "accept", "abandon"].includes(operation)) {
    planHash = requiredStyleMasterPlanHash(operation, opts);
    if (planHash === null) return 1;
  } else if (operation === "inspect" && hasExplicitCliOption("--plan-hash")) {
    if (!STYLE_MASTER_PLAN_HASH_RE.test(opts.planHash || "")) {
      return emitUsage("ppt_flow.style-master.inspect", "--plan-hash must be one lowercase SHA-256", "Pass the exact current Style Master plan SHA-256.");
    }
    planHash = opts.planHash;
  } else if (operation === "plan") {
    candidateCount = requestedStyleMasterCandidateCount(opts);
    if (candidateCount === null) return 1;
  }

  if (operation === "accept") {
    if (!["proceed", "repair", "redirect"].includes(opts.decision)) {
      return emitUsage("ppt_flow.style-master.accept", "--decision must be proceed, repair, or redirect", "Record one explicit current Style Master visual-direction decision.");
    }
    if (opts.decision === "proceed" && !opts.candidateId) {
      return emitUsage("ppt_flow.style-master.accept", "--candidate-id is required when --decision proceed", "Name one eligible candidate from the exact reviewed plan.");
    }
    if (opts.decision !== "proceed" && opts.candidateId) {
      return emitUsage("ppt_flow.style-master.accept", "--candidate-id is allowed only when --decision proceed", "Remove --candidate-id for repair or redirect.");
    }
  }
  if (operation === "abandon" && !opts.reason) {
    return emitUsage("ppt_flow.style-master.abandon", "--reason is required", "Provide one bounded human reason for abandoning the exact unknown plan.");
  }

  const route = await resolveRunAdapter(runDir, `ppt_flow.style-master.${operation}.identity`);
  if (!route) return 1;
  try {
    const workflowOperations = await targetImage2Operations(route.workflow);
    const scope = await workflowOperations.resolveStyleMasterScope(route.run_dir);
    const owner = await import("./shared/image2/style_master_plan.mjs");
    const common = { scope, refreshScope: workflowOperations.resolveStyleMasterScope };
    let output;
    if (operation === "inspect") {
      output = await owner.inspectStyleMasterCandidates({ ...common, planSha256: planHash });
    } else if (operation === "plan") {
      output = await owner.planStyleMasterCandidates({ ...common, candidateCount });
    } else if (operation === "authorize") {
      output = await owner.authorizeStyleMasterCandidates({ ...common, planSha256: planHash });
    } else if (operation === "generate") {
      output = await owner.generateStyleMasterCandidates({
        ...common,
        planSha256: planHash,
        initialize: initializeStyleMasterImage2Transport,
        submit: styleMasterSubmitFactory(),
      });
    } else if (operation === "review") {
      output = owner.projectStyleMasterCandidateReview(await owner.prepareStyleMasterCandidateReview({
        ...common,
        planSha256: planHash,
      }));
    } else if (operation === "accept") {
      output = await owner.acceptStyleMasterCandidateReview({
        ...common,
        planSha256: planHash,
        decision: opts.decision,
        candidateId: opts.candidateId || null,
      });
    } else {
      output = await owner.abandonStyleMasterCandidates({ ...common, planSha256: planHash, reason: opts.reason });
    }
    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    const failure = styleMasterFailure(operation, route, error);
    emitCliError({
      code: failure.code,
      message: failure.message,
      hint: failure.hint,
      where: `ppt_flow.style-master.${operation}`,
      diagnostic: failure.diagnostic,
    });
    return 1;
  }
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
  ppt_flow.mjs style-master plan deck_mydeck/3_versions/v1 --candidate-count 2
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
    .option("--run-dir <runDir>", "Resolve the exact run's production identity and scope checks to it")
    .option("--operation <operation>", "Run-bound Page Image operation: framed-local-refresh|raw-generation|full-build|assembly-notes")
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
        exitUsage("ppt_flow.doctor", "--operation requires --run-dir", "Bind the operation to an exact Page Image run so source/state validation happens before readiness checks.");
      }
      const code = await commandDoctor({
        image2: false,
        smoke: opts.smoke ?? false,
        probeVendors: opts.probeVendors ?? false,
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
      });
      process.exit(code);
    });

  // ---- slides ----
  program
    .command("slides")
    .description("Preview stable-ID edits or narrative page plans; apply only an exact confirmed plan")
    .argument("<subcommand>", "list, resolve, normalize, move, delete, insert, narrative-plan, or apply-plan")
    .argument("<run_dir>", "Path to current version dir")
    .argument("[selectors...]", "Slide selectors for resolve/move/delete")
    .option("--after <selector>", "Place target after snapshot selector")
    .option("--before <selector>", "Place target before snapshot selector")
    .option("--to <edge>", "Place target at start or end")
    .option("--source <path>", "Insert source containing one complete slide block")
    .option("--candidate <path>", "Agent-authored narrative candidate under current _scratch/")
    .option("--plan <path>", "Persisted exact plan under current _scratch/")
    .option("--apply", "Apply the confirmed preview")
    .option("--plan-sha256 <hash>", "Exact hash from the confirmed preview; required for narrative publication")
    .option("--json", "Output one machine-readable report")
    .action(async (subcommand, runDir, selectors, opts) => {
      const allowed = new Set(["list", "resolve", "normalize", "move", "delete", "insert", "narrative-plan", "apply-plan"]);
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
      if (subcommand === "narrative-plan" && !opts.candidate) {
        exitUsage("ppt_flow.slides.narrative-plan", "narrative-plan requires --candidate", "Create one narrative candidate JSON under the current _scratch/ and pass its path");
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
        candidate: opts.candidate || null,
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
    .action(async (runDir, opts) => {
      const code = await commandNewVersion(runDir, {
        name: opts.name || null,
      });
      process.exit(code);
    });

  // ---- test ----
  program
    .command("test")
    .description("Run bounded core verification")
    .action(async () => {
      const code = await commandTest();
      process.exit(code);
    });

  // ---- state ----
  program
    .command("state")
    .description("Show current Page Image state")
    .argument("<runDir>", "Path to version directory")
    .option("--json", "JSON output")
    .option("--validate-state", "Validate persisted state and evidence without writing")
    .option("--repair-known-execution-mismatch", "Repair only the exact BUG-066 execution-mismatch state signature")
    .action(async (runDir, opts) => {
      // Validate the closed state grammar before resolving a run, importing a
      // state owner, or probing source. Mixed forms must be a zero-read/zero-
      // write USAGE failure.
      if ((opts.validateState && opts.json) || (opts.repairKnownExecutionMismatch && (opts.json || opts.validateState))) {
        emitUsage(
          "ppt_flow.state",
          opts.repairKnownExecutionMismatch
            ? "--repair-known-execution-mismatch is mutually exclusive with --json and --validate-state"
            : "--validate-state is mutually exclusive with --json",
          "Run exactly one closed state operation at a time.",
        );
        process.exitCode = 1;
        return;
      }
      if (opts.json) setCliOutputMode("json");
      const binding = resolveRunHarnessBinding(runDir, "ppt_flow.state.binding");
      if (!binding) {
        process.exitCode = 1;
        return;
      }
      const { resolved, deckDir, harnessDir } = binding;
      const {
        readState,
        buildResumeCard,
        repairKnownExecutionMismatch,
        statePath,
      } = await import("./shared/state/state.mjs");
      if (opts.repairKnownExecutionMismatch) {
        const repaired = repairKnownExecutionMismatch(deckDir, { runDir: resolved });
        if (!repaired.ok) {
          if (repaired.code === "execution_run_version_mismatch") {
            emitExecutionRunVersionMismatch("ppt_flow.state.repair-known-execution-mismatch", resolved, repaired);
          } else {
            emitCliError({
              code: CLI_ERROR_CODES.FAILED,
              message: "The state record is not eligible for the exact known execution-mismatch repair.",
              hint: "Preserve the state bytes and use the named owner action for the reported integrity condition.",
              where: "ppt_flow.state.repair-known-execution-mismatch",
              diagnostic: {
                schema: CLI_DIAGNOSTIC_SCHEMA,
                category: "gate",
                operation: "repair-known-execution-mismatch",
                source: { path: resolved },
                reason: { kind: repaired.code },
                next: createCliNext("inspect", {
                  requiresHuman: false,
                  inspect: [{ path: resolved }],
                  default: "Inspect the retained active-run state before taking another owner-authorized action.",
                }),
              },
            });
          }
          process.exitCode = 1;
          return;
        }
        console.log(`State repair: ${repaired.status}`);
        return;
      }
      if (opts.validateState) {
        // This closed diagnostic operation always returns its bounded report,
        // including when the failure envelope makes the process exit non-zero.
        setCliOutputMode("json");
        const { inspectWorkflow } = await import("./shared/workflow/inspect_workflow.mjs");
        const workflowInspection = inspectWorkflow({ runDir: resolved });
        if (workflowInspection.root_cause.kind === "current-protocol-invalid") {
          emitCurrentProtocolError("ppt_flow.state.validate-state.identity", resolved);
          process.exitCode = 1;
          return;
        }
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
              schema: CLI_DIAGNOSTIC_SCHEMA,
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
      if (workflowInspection.root_cause.kind === "current-protocol-invalid") {
        emitCurrentProtocolError("ppt_flow.state.identity", resolved);
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
          where: "ppt_flow.state.current-protocol-invalid",
          diagnostic: {
            schema: CLI_DIAGNOSTIC_SCHEMA,
            category: "artifact",
            operation: "observe-state",
            reason: { kind: currentRepair ? "current_state_repair_required" : "replacement_required" },
            next: createCliNext("repair_prerequisite", {
              default: currentRepair
                ? "Retry the owning current-state operation so it can canonicalize the one-to-one defect; do not edit YAML or infer a route."
                : "Preserve the existing bytes and run ppt_flow init for a fresh current run; do not edit or infer a route from unsupported state.",
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
      const controllerIndex = buildPlaybookIndex(join(harnessDir, "playbook"));
      const controllerCtx = await buildControllerGateContext(resolved, { workflowInspection, harnessDir });
      const indexedCard = buildResumeCard(s, statusSnapshot, {
        index: controllerIndex,
        ctx: controllerCtx,
      });
      const taskProjection = await refreshProgressiveControllerTaskProjection(resolved, {
        workflowInspection,
        state: s,
      });
      const taskProjectionStatus = taskProjection?.status || "not-applicable";
      const inspectionSummary = workflowInspection.primary_action.summary || workflowInspection.primary_action.display_label || workflowInspection.primary_action.action_id;
      const inspectionNext = workflowInspection.primary_action.command || workflowInspection.primary_action.display_label || `${workflowInspection.primary_action.owner}:${workflowInspection.primary_action.action_id}`;

      if (opts.json) {
        const report = {
          durable_state: s,
          production_identity: indexedCard.production_identity,
          pipeline: s.pipeline || PAGE_IMAGE_WORKFLOW_PIPELINE,
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
          task_projection: { status: taskProjectionStatus },
        };
        registerCliJsonReport(report);
        console.log(JSON.stringify(report, null, 2));
        return;
      }
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
      console.log("Task projection: " + taskProjectionStatus);
    });

  // ---- style-master (candidate lifecycle before page raw work) ----
  program
    .command("style-master")
    .description("Current Page Image Style Master candidate lifecycle")
    .argument("<operation>", "inspect, plan, authorize, generate, review, accept, or abandon")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--plan-hash <sha256>", "Exact current Style Master plan hash")
    .option("--candidate-count <count>", "New generated candidate count: 0 through 4")
    .option("--decision <decision>", "Visual-direction decision: proceed, repair, or redirect")
    .option("--candidate-id <slot-id>", "Eligible reviewed candidate ID for proceed")
    .option("--reason <text>", "Bounded human reason for exact unknown-plan abandonment")
    .addHelpText("after", "\ninspect -> plan -> authorize -> generate -> review -> accept\nA zero-generated local plan skips authorize and generate.\n")
    .action(async (operation, runDir, opts) => {
      const code = await commandStyleMaster(operation, runDir, opts);
      process.exit(code);
    });

  // ---- image2 (Page Image raw lifecycle) ----
  program
    .command("image2")
    .description("Receipt-bound progressive Page Image lifecycle and explicit artifact view")
    .argument("<operation>", "plan, artifact-view, pilot, expansion, authorize, generate, pilot-review, pilot-accept, review, accept, or reconcile")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--plan-hash <sha256>", "Exact current progressive full-plan hash")
    .option("--batch-hash <sha256>", "Exact current progressive batch hash")
    .option("--attempt-sha256 <sha256>", "Exact submitted progressive attempt hash for reconciliation")
    .option("--slide-id <formal-id>", "Repeat an exact formal slide ID for Pilot scope", (value, previous) => [...(previous || []), value])
    .option("--decision <decision>", "Pilot: proceed, repair, or redirect; Complete Page Review: proceed or repair")
    .option("--json", "Output one machine-readable success report")
    .addHelpText("after", "\nartifact-view rebuilds only the current Human Navigation Path; it performs no provider work or state/task-projection write.\nplan -> pilot | expansion -> authorize -> generate (one item) -> pilot-review/pilot-accept | Complete Page Review -> build\nPilot accepts repeated exact --slide-id values; all paid work requires exact plan and batch hashes.\n")
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
        diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-command", next: createCliNext("fix_arguments", { invocation: { program: "node", args: [__filename, "--help"] }, default: "Inspect --help, correct the command arguments, then rerun." }) },
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
        hint: "Inspect the command location and report the Harness failure.",
        where: "ppt_flow.main",
        diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "internal", operation: "run-command", next: createCliNext("report_internal", { default: "Inspect ppt_flow.mjs without relying on captured exception prose, then report the defect." }) },
      },
      1
    );
  });
}
