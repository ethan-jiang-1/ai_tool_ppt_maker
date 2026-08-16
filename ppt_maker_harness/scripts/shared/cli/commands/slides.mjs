import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { readFileSync, writeFileSync, readdirSync, realpathSync, renameSync } from "node:fs";
import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError, registerCliJsonReport } from "../cli_error.mjs";
import { resolveRunHarnessBinding } from "../command_support.mjs";
import { checkBundle, deckRoot, findSlideSpecs, nextVersionName, SCRATCH_SUBDIR } from "../../run-bundle/bundle_layout.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, probeProductionMarker } from "../../run-bundle/production_marker.mjs";
import {
  applySlideEdit,
  applyNarrativePagePlan,
  applyTargetStructuralVersion,
  computeSlideEditPlanSha256,
  formatSlideCandidate,
  parseSlideDocument,
  parsePageImageSource,
  previewNarrativePagePlan,
  planSlideEdit,
  previewTargetStructuralVersion,
  resolveSlideBindings,
  verifySlideEditPlanHash,
} from "../../../01-content/index.mjs";
import { createPageImageSourceResolver, loadPageImageVisualLanguage } from "../../../02-visual-system/index.mjs";

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
  const { createPageImageSourceResolver, loadPageImageVisualLanguage } = await import("../../../02-visual-system/index.mjs");
  const visualLanguage = loadPageImageVisualLanguage(deckRoot(context.runDir));
  return parsePageImageSource(sourceText, {
    source: context.document.source,
    registry: createPageImageSourceResolver({ deckDir: deckRoot(context.runDir), visualLanguage }),
  });
}

async function narrativeVisualSystem() {
  const { createPageImageSourceResolver, loadPageImageVisualLanguage } = await import("../../../02-visual-system/index.mjs");
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

export async function commandSlides(subcommand, runDir, args = [], opts = {}) {
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
