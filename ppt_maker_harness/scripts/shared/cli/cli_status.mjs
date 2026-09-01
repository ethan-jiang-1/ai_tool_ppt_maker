/**
 * cli_status.mjs — status collection, state enrichment, and stdout printing.
 * Mechanical move from command_support.mjs; no behavior changes.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  METADATA_FILE,
  LESSONS_DIR,
  STYLE_MASTER_IMAGE,
  SLIDE_SPECS_NAME,
  deckRoot,
  findSlideSpecs,
  checkBundle,
  pageImageWorkflowPaths,
  styleAsset,
} from "../run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  probeProductionMarker,
} from "../run-bundle/production_marker.mjs";
import { HARNESS_DIR, metadataFields } from "./command_support.mjs";

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
