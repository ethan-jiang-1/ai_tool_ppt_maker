/**
 * command_support.mjs — cross-command shared glue for the ppt_flow CLI.
 * Mechanical move from ppt_flow.mjs (C0 split); no ownership changes.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, renameSync, realpathSync } from "node:fs";
import { isAbsolute, join, resolve, basename, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
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
  projectProblemFactsDiagnostic,
  registerCliJsonReport,
  setCliOutputMode,
} from "./cli_error.mjs";
import {
  UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR,
  GUIDE_FILE, POINTER_FILE, METADATA_FILE,
  LESSONS_DIR,
  STYLE_MASTER_IMAGE,
  BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE,
  SLIDE_SPECS_NAME, SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR,
  deckRoot, backboneDir, styleAsset, styleDir, assetsDir, pageImageWorkflowPaths,
  findSlideSpecs, deckName, isVersionDir,
  DECK_TYPE_TEMPLATES, STYLE_PRESETS,
  initBundle, checkBundle, createVersion, nextVersionName, publishStructuralVersion,
  verifyDeckHarnessBinding,
} from "../run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
  isPageImageWorkflowSelectionPending,
  probeProductionMarker,
} from "../run-bundle/production_marker.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  inspectExactPageImagePng,
  PAGE_IMAGE_REQUEST_SIZE,
  PAGE_IMAGE_NATIVE_RAW_PNG,
} from "../image2/page_image_media_contract.mjs";
import { pageImageOrdinalImageFilename } from "../image2/page_image_artifacts.mjs";
import { inspectCurrentFinalSlideManifestFromRun } from "../image2/page_image_final_manifest.mjs";
import { writeHumanArtifactNavigation } from "../image2/page_image_human_artifact_reference.mjs";
import { resolveContentAddressName } from "../image2/content_address_store.mjs";
import { validateBoundPageImageProviderRequest } from "../image2/page_image_target_runtime.mjs";
import {
  deliveryReceiptSha256,
  inspectCurrentTargetPageImageDelivery,
} from "../../05-delivery/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const HARNESS_DIR = resolve(__dirname, "../../..");
export const PPT_FLOW_ENTRY = join(HARNESS_DIR, "scripts", "ppt_flow.mjs");

let contentApiPromise = null;
export function loadContentApi() {
  contentApiPromise ??= import("../../01-content/index.mjs");
  return contentApiPromise;
}
/** Emit FAILED envelope; caller still returns/exits the numeric code (D13). */
export function emitFailed(where, message, hint = "Inspect the diagnostic evidence before retrying", diagnostic = undefined) {
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
export function emitUsage(where, message, hint) {
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
        invocation: { program: "node", args: [PPT_FLOW_ENTRY, "--help"] },
        default: "Correct the command arguments using --help, then rerun.",
      }),
    },
  });
  return 1;
}

export function exitUsage(where, message, hint) {
  emitUsage(where, message, hint);
  process.exit(1);
}

export function hasExplicitCliOption(option) {
  return process.argv.some((argument) => argument === option || argument.startsWith(`${option}=`));
}

/**
 * Resolve one exact run to its only permitted production adapter before a
 * command reads generated output, checks readiness, or initializes a provider.
 * Every supported run has an explicit source marker and a durable identity
 * record that agrees with that marker.
 */
export function preflightAdapterSource(resolved, where) {
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
export async function resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir) {
  const { resolveTargetAuthoringDraftRoute } = await import("../../shared/state/target_authoring_draft_route.mjs");
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

export function emitCurrentProtocolError(where, resolved, code = "CURRENT_PROTOCOL_INVALID") {
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

export function emitExecutionRunVersionMismatch(where, resolved, result) {
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

export function emitUnsupportedHarnessBinding(where, resolved, binding) {
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

export function resolveRunHarnessBinding(runDir, where) {
  const resolved = resolve(runDir || "");
  const binding = verifyDeckHarnessBinding(deckRoot(resolved));
  if (binding.kind !== "resolved") {
    emitUnsupportedHarnessBinding(where, resolved, binding);
    return null;
  }
  return Object.freeze({ resolved, ...binding });
}

export async function resolveRunAdapter(runDir, where) {
  const binding = resolveRunHarnessBinding(runDir, `${where}.binding`);
  if (!binding) return null;
  const { resolved, deckDir, harnessDir } = binding;
  if (preflightAdapterSource(resolved, where)) return null;
  const targetDraft = await resolveTargetAuthoringDraftAdapter(resolved, deckDir, harnessDir);
  if (targetDraft) return Object.freeze({ ...targetDraft, run_dir: resolved, deck_dir: deckDir, harness_dir: harnessDir });
  const { resolveRunProductionAdapter } = await import("../../shared/state/state.mjs");
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

/**
 * Pre-POST profile fence (shared by preflight/probe): resolve the exact run's
 * confirmed provider profile and require IMAGE2_PROVIDER_PROFILE_ID to match.
 * Returns true on success; emits the owner-issued diagnostic and returns false
 * on any missing/invalid/mismatched profile, before any provider POST.
 */
export async function requireExactRunImage2Profile(route, { where = "ppt_flow", operation = "raw-generation-readiness" } = {}) {
  try {
    const { resolveImage2ProviderProfile } = await import("../../shared/image2/provider_profile.mjs");
    const { requireMatchingImage2RuntimeProfileId } = await import("../../shared/image2/runtime_profile_id.mjs");
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    const profile = resolveImage2ProviderProfile(route.run_dir);
    applyImage2StartupEnv({ runDir: route.run_dir });
    requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
    return true;
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
      where,
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: sourceFailure ? "source_validation" : "environment",
        operation,
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
    return false;
  }
}

export function createGateDiagnostic({ operation, source, issues = [], action = "review", invocation, defaultText }) {
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
export function exitWithCode(code, where, message, hint) {
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
export function runNode(script, args = [], { env = {} } = {}) {
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
export function metadataFields(path) {
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
export function updateGate(metadataPath, gate, value = "approved") {
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
export function collectStatus(runDir) {
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
function projectInspectionNext(inspection) {
  const action = inspection?.primary_action || {};
  return action.command || action.display_label || (action.owner && action.action_id
    ? `${action.owner}:${action.action_id}`
    : action.action_id || null);
}

export async function enrichStatusWithState(status, runDir, route = null) {
  const { readState, buildResumeCard, statePath, inspectRunProductionIdentity } = await import("../../shared/state/state.mjs");
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
  const { buildPlaybookIndex } = await import("../../shared/state/md_controller_reader.mjs");
  const { inspectWorkflow } = await import("../../shared/workflow/inspect_workflow.mjs");
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
  status.workflow_inspection = workflowInspection;
  status.suggested_next = projectInspectionNext(workflowInspection);
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
  const inspection = workflowInspection || (await import("../../shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir: resolved });
  const { isWorkflowInspectionSourceReady } = await import("../../shared/workflow/inspect_workflow.mjs");

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
export function printStatus(status) {
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

  const inspectionNext = status.suggested_next || projectInspectionNext(status.workflow_inspection);
  if (inspectionNext) {
    console.log("\nNext:");
    console.log(`  - ${inspectionNext}`);
  }
}

// Utility: Build env search dirs for .env loading
// ---------------------------------------------------------------------------

/**
 * Build the ordered list of directories to search for .env.
 * @param {string} dkRoot - Deck root path.
 * @returns {string[]}
 */
export function buildEnvSearchDirs(dkRoot) {
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

export async function resolveImage2Run(runDir, where) {
  const route = await resolveRunAdapter(runDir, where);
  return route?.adapter === "page-image-workflow" ? route.run_dir : null;
}
export const PAGE_IMAGE_OPERATIONS = new Set([
  "plan",
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
export const PAGE_IMAGE_HASH_RE = /^[0-9a-f]{64}$/;
export const PAGE_IMAGE_PROVIDER_IDEMPOTENCY_KEY_RE = /^page-image-workflow-[0-9a-f]{64}$/;

export function pageImageDiagnosticReasonKind(value, fallback = "page_image_operation_failed") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}

export const FRAMED_SOURCE_VALIDATION_CODES = new Set([
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

export const PAGE_DESIGN_SYSTEM_SOURCE_VALIDATION_CODES = new Set([
  "page_design_system_source_unavailable",
  "page_design_system_source_invalid",
  "page_design_system_source_escape",
  "page_design_system_source_unreadable",
  "page_design_system_source_too_large",
  "page_design_system_source_utf8_invalid",
]);

export const PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES = new Set([
  "pure_provider_input_too_large",
  "framed_provider_input_too_large",
]);

export const FRAMED_ENVIRONMENT_CODES = new Set([
  "font_render_inventory_invalid",
  "framed_font_asset_missing",
  "framed_font_asset_invalid",
  "framed_font_runtime_invalid",
  "framed_font_runtime_unavailable",
  "framed_runtime_unavailable",
  "framed_render_timeout",
]);

export const FRAMED_INTERNAL_CODES = new Set([
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

export const TARGET_GATE_CODES = new Set([
  "provider_authorization_required",
  "raw_review_required",
  "target_provider_authorization_required",
]);

export function isTargetArtifactFailure(code) {
  if (["target_style_master_unavailable", "target_style_master_stale", "target_page_derived_publication_invalid", "framed_raw_contract_profile_stale", "human_navigation_invalid"].includes(code)) return true;
  return /^target_(?:source_receipt|source_state|raw_plan|raw_evidence|raw_review|accepted_raw_evidence|final_manifest|final_bytes|delivery)_.*(?:stale|required|missing|invalid|mismatch|drift)$/.test(code)
    || code === "target_raw_review_contribution_stale";
}

export function isTargetProviderFailure(code) {
  return /^page_image_provider_/.test(code)
    || /^target_provider_/.test(code)
    || code === "provider_submit_required"
    || code === "target_raw_bytes_invalid";
}

export function isImage2ProviderProfileSourceFailure(reason) {
  return reason.startsWith("image2_provider_profile_") && !isImage2RuntimeProfileFailure(reason);
}

export function isImage2RuntimeProfileFailure(reason) {
  return reason === "image2_provider_profile_id_missing" ||
    reason === "image2_provider_profile_id_invalid" ||
    reason === "image2_provider_profile_id_mismatch";
}

export function isImage2PromptBudgetFailure(reason) {
  return reason === "image2_prompt_budget_overflow" || reason === "image2_prompt_safety_overflow";
}

export function image2ProfileSourceLocator(route, error) {
  if (typeof error?.source !== "string" || !error.source || typeof route?.deck_dir !== "string") return null;
  const candidate = resolve(route.deck_dir, ...error.source.split("/"));
  const relation = relative(route.deck_dir, candidate);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) return null;
  return { path: candidate };
}

export function image2CapabilityFailureDiagnostic({ common, route, error, reason, operation }) {
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

const STORE_LOCK_FORBIDDEN_HINT = "Re-read the exact raw-owner facts after confirming no other writer process is active; do not delete the lock, rebuild the batch, retry the provider request, or resubmit the item.";

/**
 * Three-branch failure mapping for `progressive_raw_store_locked`. Only the
 * dead-writer-with-unresolved-attempt branch may offer `reconcile`; a live or
 * unprovable writer waits; a proven-dead writer without a reconcilable attempt
 * is reported as an anomaly. No branch suggests lock deletion or resubmission.
 */
function progressiveStoreLockedFailure(error, common) {
  const ownerAction = error?.next_action || null;
  const lockOwner = error?.details?.lock_owner || null;
  const waitSelector = ownerAction?.action_id === "wait_progressive_raw_completion" ||
    lockOwner?.alive === true ||
    lockOwner?.alive == null;
  if (waitSelector) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "Another progressive raw-owner writer holds the store lock; re-read exact owner facts after it exits.",
      hint: STORE_LOCK_FORBIDDEN_HINT,
      diagnostic: {
        ...common,
        category: "gate",
        ...(lockOwner?.pid ? { subject: { kind: "progressive_raw_lock", id: String(lockOwner.pid) } } : {}),
        next: createCliNext("wait_then_reread", {
          requiresHuman: false,
          default: "Wait for the active raw-owner writer to exit, then re-run the same command to re-read exact owner facts.",
        }),
      },
    };
  }
  if (ownerAction?.action_id === "reconcile_progressive_raw_attempt" && ownerAction?.attempt_sha256) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "A persisted provider submission must be reconciled before progressive work can continue.",
      hint: `Run image2 reconcile with the exact plan and attempt selectors; ${STORE_LOCK_FORBIDDEN_HINT}`,
      diagnostic: {
        ...common,
        category: "artifact",
        subject: { kind: "progressive_raw_attempt", id: ownerAction.attempt_sha256 },
        next: createCliNext("reconcile", {
          default: "Reconcile the exact submitted attempt without resubmitting it.",
        }),
      },
    };
  }
  return {
    code: CLI_ERROR_CODES.FAILED,
    message: "The progressive raw-owner store lock has no live writer and no reconcilable attempt.",
    hint: STORE_LOCK_FORBIDDEN_HINT,
    diagnostic: {
      ...common,
      category: "internal",
      next: createCliNext("report_internal", {
        default: "Report the unexplained progressive raw-owner lock with its exact run, plan, and lock-owner facts.",
      }),
    },
  };
}

export function targetPageImageFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code);
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `target-page-image-${operation}`,
    reason: { kind: reason },
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const problemDiagnostic = projectProblemFactsDiagnostic({
    error,
    operation: `target-page-image-${operation}`,
    rerunText: `Repair the named Page Image source or configuration through its owner, then rerun image2 ${operation}.`,
  });
  if (problemDiagnostic) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image source or configuration is invalid and must be repaired before this checkpoint can continue.",
      hint: "Repair the exact named source through its owner, then rerun the same image2 command.",
      diagnostic: problemDiagnostic,
    };
  }

  const capabilityFailure = image2CapabilityFailureDiagnostic({ common, route, error, reason, operation: `target-page-image-${operation}` });
  if (capabilityFailure) return capabilityFailure;

  if (reason.startsWith("progressive_raw")) {
    if (reason === "progressive_raw_store_locked") {
      return progressiveStoreLockedFailure(error, common);
    }
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

export function progressiveUnsupportedOption(operation) {
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

export function requiredPageImageHash(operation, option, value, label) {
  if (!hasExplicitCliOption(option) || !PAGE_IMAGE_HASH_RE.test(value || "")) {
    emitUsage(`ppt_flow.image2.target.${operation}`, `${option} must be one lowercase SHA-256`, `Pass the exact current ${label} SHA-256 issued by the raw owner.`);
    return null;
  }
  return value;
}

export function requiredPilotSlideIds(opts) {
  const values = Array.isArray(opts.slideId) ? opts.slideId : opts.slideId ? [opts.slideId] : [];
  if (!hasExplicitCliOption("--slide-id") || values.length === 0 || values.some((value) => !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value || ""))) {
    emitUsage("ppt_flow.image2.target.pilot", "At least one exact formal --slide-id is required", "Repeat --slide-id once for each current formal slide ID in the proposed Pilot scope.");
    return null;
  }
  return values;
}

export function requiredProgressiveDecision(operation, value, allowed = ["proceed", "repair", "redirect"]) {
  if (!hasExplicitCliOption("--decision") || !allowed.includes(value)) {
    const options = allowed.length === 2 ? `${allowed[0]} or ${allowed[1]}` : allowed.join(", ");
    emitUsage(`ppt_flow.image2.target.${operation}`, `--decision must be ${options}`, "Record the explicit human decision for the exact current owner-issued evidence.");
    return null;
  }
  return value;
}

export function imageDataUrl(path) {
  const extension = path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${extension};base64,${readFileSync(path).toString("base64")}`;
}

export function imageBytesDataUrl(bytes, mediaType) {
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

export function pageImageProviderResponseRecord(payload) {
  return payload?.data && !Array.isArray(payload.data) ? payload.data
    : Array.isArray(payload?.data) ? payload.data[0]
      : payload;
}

export function imageBytesFromPageImageProvider(payload) {
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

export function pageImageProviderTaskId(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.task_id || payload?.task_id;
  if (typeof value !== "string") return null;
  const taskId = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(taskId) ? taskId : null;
}

export function pageImageProviderHasInlineImage(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return [record?.bytes_base64, record?.b64_json, payload?.bytes_base64, payload?.b64_json]
    .some((value) => typeof value === "string" && value.trim().length > 0);
}

export function pageImageProviderTaskStatus(payload) {
  const record = pageImageProviderResponseRecord(payload);
  const value = record?.status || payload?.status;
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function pageImageProviderTaskResult(payload) {
  const record = pageImageProviderResponseRecord(payload);
  return record?.result || payload?.result || null;
}

export function pageImageProviderTaskResultPayload(payload) {
  const result = pageImageProviderTaskResult(payload);
  const images = Array.isArray(result?.images) ? result.images : null;
  return images ? { data: images[0] } : result;
}

export function pageImageProviderMediaKnownFailure(actual) {
  const error = new Error("Target Page Image provider returned invalid PNG media");
  error.code = "PAGE_IMAGE_PROVIDER_MEDIA_INVALID";
  error.page_image_known_failure = true;
  error.page_image_known_failure_facts = Object.freeze({
    expected: PAGE_IMAGE_NATIVE_RAW_PNG,
    actual: Object.freeze(actual),
  });
  return error;
}

export const PAGE_IMAGE_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

export const IMAGE2_PROVIDER_INVALID_JSON_RESPONSE_SHAPES = new Set([
  "empty",
  "html_like",
  "other_non_json",
]);

export function image2InvalidJsonResponseShape(responseText) {
  if (typeof responseText !== "string") return "other_non_json";
  if (responseText.trim().length === 0) return "empty";
  const leadingText = responseText.trimStart();
  return /^(?:<!doctype\s+html(?=[\s>])|<html(?=[\s/>]))/i.test(leadingText)
    ? "html_like"
    : "other_non_json";
}

export function pageImageProviderResponseKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
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

export function pageImageProviderTaskPollUnresolved() {
  const error = new Error("Target Page Image provider task outcome could not be resolved");
  error.code = "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED";
  return error;
}

export function pageImageProviderSubmitUnresolved() {
  const error = new Error("Target Page Image provider submission failed before a response");
  error.code = "PAGE_IMAGE_PROVIDER_SUBMIT_FAILED";
  return error;
}

export const STYLE_MASTER_PROVIDER_RESPONSE_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);

export function styleMasterProviderKnownFailure(classification, { httpStatus = null, responseShape = null } = {}) {
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

export function styleMasterProviderMediaKnownFailure() {
  const error = new Error("Style Master provider returned invalid candidate media");
  error.code = "style_master_provider_media_invalid";
  error.style_master_known_failure = true;
  return error;
}

export function styleMasterProviderTaskPollUnresolved() {
  const error = new Error("Style Master provider task outcome could not be resolved");
  error.code = "style_master_provider_response_unresolved";
  return error;
}

export function styleMasterProviderSubmitUnresolved() {
  const error = new Error("Style Master provider submission did not return a response");
  error.code = "style_master_provider_submit_failed";
  return error;
}

export const IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS = 600_000;
export const IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS = 1_000;

export function image2ProviderOperationTiming({ providerDeadlineMs, taskPollTimeoutMs, taskPollIntervalMs }) {
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

export function createImage2ProviderDeadline({ now, timeoutMs }) {
  const startedAt = now();
  const deadlineAt = startedAt + timeoutMs;
  return Object.freeze({
    remainingMs() {
      return Math.max(0, deadlineAt - now());
    },
  });
}

export function image2ProviderDeadlineAbortError() {
  const error = new Error("Image2 provider operation deadline elapsed");
  error.name = "AbortError";
  return error;
}

export function awaitWithinImage2ProviderDeadline(work, signal) {
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

export async function readImage2ProviderResponseJson({
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

export async function sleepWithinImage2ProviderDeadline({ deadline, sleep, intervalMs, unresolved }) {
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

export async function resolveImage2ProviderTask({
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

export function targetPageImagePngBytesFromProvider(payload) {
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
        const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
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
export async function targetPageImageGenerateCredentials(runDir, { expectedProfileId } = {}) {
  try {
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir });
    const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId });
  } catch {
    const error = new Error("Target Page Image provider credentials are unavailable");
    error.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
    throw error;
  }
}

export async function initializeStyleMasterImage2Transport({ run_dir: runDir, candidate_generation_profile: profile } = {}) {
  try {
    const { applyImage2StartupEnv } = await import("../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir });
    const { resolveImage2Credentials } = await import("../../shared/image2/credentials.mjs");
    return resolveImage2Credentials({ expectedProfileId: profile?.provider?.profile_id });
  } catch {
    const error = new Error("Style Master provider credentials are unavailable");
    error.code = "style_master_provider_credentials_unavailable";
    throw error;
  }
}

export function styleMasterProviderBytesFromPayload(payload) {
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

export async function targetImage2Operations(workflow) {
  if (workflow === "framed") {
    const owner = await import("../../03-framed-image/index.mjs");
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
    const owner = await import("../../04-pure-image/index.mjs");
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
export async function refreshProgressiveControllerTaskProjection(runDir, { workflowInspection = null, state = null } = {}) {
  const inspection = workflowInspection || (await import("../../shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir });
  const { progressiveControllerTaskProjectionEligibility } = await import("../../shared/workflow/progressive_controller_task_projection_eligibility.mjs");
  const eligibility = progressiveControllerTaskProjectionEligibility({ runDir, inspection, state });
  if (!eligibility.eligible) return Object.freeze({ status: "not-applicable" });
  const { refreshPageProductionTaskProjection } = await import("../../shared/workflow/page_production_task_projection.mjs");
  return refreshPageProductionTaskProjection({ runDir, inspection, state: eligibility.state });
}

/**
 * Advance the durable create-deck cursor to the Controller node matching the
 * raw owner's current checkpoint after a successful image2 mutation. The
 * checkpoint comes from the shared owner-action mapping; a hard-stop
 * inspection or a checkpoint without a Controller node skips the handoff
 * without failing the already-successful operation. Shared by the image2
 * command path and the cursor integration tests.
 */
export async function advanceProgressiveControllerCheckpoint(route, { workflowInspection = null } = {}) {
  const inspection = workflowInspection || (await import("../../shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir: route.run_dir });
  const { progressiveControllerCheckpoint } = await import("../../shared/workflow/progressive_controller_task_projection_eligibility.mjs");
  let checkpoint = null;
  try {
    checkpoint = progressiveControllerCheckpoint(inspection);
  } catch {
    return Object.freeze({ status: "skipped", reason: "checkpoint-unavailable" });
  }
  if (!checkpoint?.controller_node) {
    return Object.freeze({ status: "skipped", reason: "no-controller-node" });
  }
  const action = inspection?.primary_action || {};
  const planHash = typeof action.plan_hash === "string" && PAGE_IMAGE_HASH_RE.test(action.plan_hash) ? action.plan_hash : null;
  const batchHash = typeof action.batch_hash === "string" && PAGE_IMAGE_HASH_RE.test(action.batch_hash) ? action.batch_hash : null;
  const planShort = planHash ? planHash.slice(0, 8) : null;
  const batchShort = batchHash ? batchHash.slice(0, 8) : null;
  const { recordTargetProgressiveCheckpointCliHandoff } = await import("../../shared/state/state.mjs");
  const handoff = recordTargetProgressiveCheckpointCliHandoff(route.deck_dir, {
    runDir: route.run_dir,
    checkpoint_node: checkpoint.controller_node,
    action_id: checkpoint.action_id,
    plan_hash: planHash,
    batch_hash: batchHash,
    requires_human: checkpoint.requires_human,
    waiting_for: checkpoint.requires_human
      ? `Human decision on ${checkpoint.action_id}${planShort ? ` for plan ${planShort}` : ""}${batchShort ? ` batch ${batchShort}` : ""}`
      : null,
  });
  return Object.freeze({ status: handoff.status, handoff, checkpoint });
}

export function artifactReferenceEntry({ label, artifactType, purpose, locator, kind, sha256 }) {
  return Object.freeze({
    label,
    artifact_type: artifactType,
    purpose,
    locator,
    reference: Object.freeze({ kind, sha256 }),
  });
}

export function artifactUnavailable(category, reason) {
  return Object.freeze({ category, reason });
}

export function pageArtifactGroup(position, slideId, artifacts) {
  return Object.freeze({ position, slide_id: slideId, artifacts: Object.freeze(artifacts) });
}

/** Compose the provider-free human view solely from current owner inspections. */
export async function rebuildTargetPageImageArtifactView(route) {
  const operations = await targetImage2Operations(route.workflow);
  const styleMasterOwner = await import("../../shared/image2/style_master_plan.mjs");
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

  const rawOwner = await import("../../shared/image2/page_image_progressive_raw_owner.mjs");
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

export const STYLE_MASTER_OPERATIONS = new Set([
  "inspect",
  "plan",
  "authorize",
  "generate",
  "review",
  "accept",
  "abandon",
]);
export const STYLE_MASTER_PLAN_HASH_RE = /^[0-9a-f]{64}$/;

export function styleMasterNextInvocation(route, operation, options = {}) {
  const args = [PPT_FLOW_ENTRY, "style-master", operation, route.run_dir];
  if (options.planHash) args.push("--plan-hash", options.planHash);
  if (options.candidateCount !== undefined) args.push("--candidate-count", String(options.candidateCount));
  if (options.decision) args.push("--decision", options.decision);
  if (options.candidateId) args.push("--candidate-id", options.candidateId);
  if (options.reason) args.push("--reason", options.reason);
  return Object.freeze({ program: "node", args: Object.freeze(args) });
}

export function styleMasterUnexpectedOption(operation) {
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

export function requiredStyleMasterPlanHash(operation, opts) {
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

export function requestedStyleMasterCandidateCount(opts) {
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

export function styleMasterFailure(operation, route, error) {
  const reason = pageImageDiagnosticReasonKind(error?.code, "style_master_operation_failed");
  const common = {
    schema: CLI_DIAGNOSTIC_SCHEMA,
    operation: `style-master-${operation}`,
    reason: Object.freeze({ kind: reason }),
  };
  const source = { path: join(route.run_dir, SLIDE_SPECS_NAME) };

  const problemDiagnostic = projectProblemFactsDiagnostic({
    error,
    operation: `style-master-${operation}`,
    rerunText: `Repair the named Page Image source or configuration through its owner, then rerun style-master ${operation}.`,
  });
  if (problemDiagnostic) {
    return {
      code: CLI_ERROR_CODES.FAILED,
      message: "The current Page Image source or configuration is invalid and must be repaired before this Style Master checkpoint can continue.",
      hint: "Repair the exact named source through its owner, then rerun the same style-master command.",
      diagnostic: problemDiagnostic,
    };
  }

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
