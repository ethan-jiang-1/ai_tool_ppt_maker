import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { stringify } from "yaml";

import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { PAGE_IMAGE_WORKFLOW_PIPELINE, probeProductionMarker } from "../../shared/run-bundle/production_marker.mjs";
import { nextVersionName, publishStructuralVersion } from "../../shared/run-bundle/bundle_layout.mjs";
import {
  inspectRunProductionMode,
  registerTargetPageImageStructuralPublication,
  revalidateTargetPageImageStructuralReplay,
} from "../../shared/state/state.mjs";
import { applySlideEdit, parseSlideDocument, verifySlideEditPlanHash } from "./slide_document.mjs";

export const TARGET_STRUCTURAL_PLAN_SCHEMA = "page-image-target-structural-plan";

const SHA256_RE = /^[0-9a-f]{64}$/;
const PAGE_IMAGE_WORKFLOWS = new Set(["framed", "pure"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function runContext(sourceRunDir) {
  const runDir = resolve(sourceRunDir || "");
  const sourceVersion = basename(runDir);
  if (!/^v[1-9][0-9]*$/.test(sourceVersion) || basename(dirname(runDir)) !== "3_versions") {
    throw new Error("target structural work requires a canonical 3_versions/vN source run");
  }
  return Object.freeze({ runDir, sourceVersion, deckDir: dirname(dirname(runDir)) });
}

function requireWorkflow(workflow) {
  if (!PAGE_IMAGE_WORKFLOWS.has(workflow)) throw new TypeError("target workflow must be framed or pure");
  return workflow;
}

function targetReceiptFacts(receipt, sourceText, workflow, expectedOrder) {
  if (!receipt || receipt.schema !== "page-image-workflow-source" || receipt.pipeline !== PAGE_IMAGE_WORKFLOW_PIPELINE ||
    receipt.workflow !== workflow || receipt.source_sha256 !== sha256(sourceText) || !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    throw new Error("target structural source receipt does not bind the candidate source");
  }
  const slideIds = receipt.slides.map((slide) => slide?.slide_id);
  if (slideIds.some((slideId) => typeof slideId !== "string" || !slideId) || new Set(slideIds).size !== slideIds.length ||
    receipt.slides.some((slide, index) => slide?.position !== index + 1 || Object.hasOwn(slide || {}, "workflow") || Object.hasOwn(slide || {}, "authority")) ||
    slideIds.join("\n") !== expectedOrder.join("\n")) {
    throw new Error("target structural source receipt does not bind the planned stable-ID order");
  }
  return Object.freeze({ source_sha256: receipt.source_sha256, ordered_slide_ids: Object.freeze([...slideIds]) });
}

function validateTargetSource(sourceText, workflow, expectedOrder, receipt) {
  const marker = probeProductionMarker(sourceText, { source: "slide-specifications.md" });
  if (marker.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE || marker.frontmatter?.metadata?.production?.workflow !== workflow) {
    throw new Error("target structural source must carry the exact current Page Image Workflow marker");
  }
  const document = parseSlideDocument(sourceText, "slide-specifications.md");
  const order = document.slides.map((slide) => slide.slide_id);
  if (order.join("\n") !== expectedOrder.join("\n")) {
    throw new Error("target structural source order differs from the confirmed stable-ID plan");
  }
  return targetReceiptFacts(receipt, sourceText, workflow, order);
}

function validateSlidePlan(slideEditPlan, sourceText, targetVersion) {
  if (!verifySlideEditPlanHash(slideEditPlan)) throw new Error("target structural slide plan self-hash is invalid");
  if (slideEditPlan?.publication?.mode !== "next-version" || slideEditPlan.publication.target_version !== targetVersion) {
    throw new Error("target structural slide plan must publish the exact target vNext");
  }
  return applySlideEdit(slideEditPlan, sourceText, { expectedPlanSha256: slideEditPlan.plan_sha256 });
}

function structuralPlanBody(plan) {
  const { plan_hash: _ignored, ...body } = plan || {};
  return body;
}

function validTargetStructuralPlan(plan) {
  const keys = [
    "schema",
    "source_run_version",
    "target_run_version",
    "source_mode",
    "slide_edit_plan",
    "slide_edit_plan_sha256",
    "target_workflow",
    "target_source_text",
    "target_source_sha256",
    "target_source_receipt",
    "ordered_slide_ids",
    "provider_calls",
    "plan_hash",
  ];
  return exactKeys(plan, keys) && plan.schema === TARGET_STRUCTURAL_PLAN_SCHEMA &&
    /^v[1-9][0-9]*$/.test(plan.source_run_version || "") && /^v[1-9][0-9]*$/.test(plan.target_run_version || "") &&
    plan.source_run_version !== plan.target_run_version && typeof plan.source_mode === "string" &&
    verifySlideEditPlanHash(plan.slide_edit_plan) && plan.slide_edit_plan_sha256 === plan.slide_edit_plan.plan_sha256 &&
    PAGE_IMAGE_WORKFLOWS.has(plan.target_workflow) && typeof plan.target_source_text === "string" &&
    SHA256_RE.test(plan.target_source_sha256 || "") && Array.isArray(plan.ordered_slide_ids) && plan.ordered_slide_ids.length > 0 &&
    plan.provider_calls === 0 &&
    typeof plan.plan_hash === "string" && plan.plan_hash === canonicalJsonSha256(structuralPlanBody(plan));
}

/**
 * Produce a target current Page Image Workflow source from one confirmed stable-ID slide edit while
 * preserving the source body. Callers may instead supply a rewritten target
 * source to previewTargetStructuralVersion when a workflow switch needs
 * source-owned semantic edits.
 */
export function deriveTargetStructuralSource({ sourceText, slideEditPlan, targetWorkflow } = {}) {
  const workflow = requireWorkflow(targetWorkflow);
  const applied = applySlideEdit(slideEditPlan, sourceText, {
    expectedPlanSha256: slideEditPlan?.plan_sha256,
  });
  const document = parseSlideDocument(applied.text, "slide-specifications.md");
  if (!document.frontmatter.present || !document.frontmatter.metadata || typeof document.frontmatter.metadata !== "object") {
    throw new Error("target structural source requires canonical frontmatter");
  }
  const marker = probeProductionMarker(applied.text, { source: "slide-specifications.md" });
  if (marker.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    throw new Error("target structural source requires the exact current Page Image source marker");
  }
  const metadata = { ...document.frontmatter.metadata };
  metadata.production = { pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE, workflow };
  const newline = document.newline;
  const prefix = applied.text.startsWith("\uFEFF") ? "\uFEFF" : "";
  const frontmatter = stringify(metadata).replaceAll("\n", newline);
  const targetSourceText = `${prefix}---${newline}${frontmatter}---${newline}${applied.text.slice(document.frontmatter.range.end)}`;
  return Object.freeze({
    target_source_text: targetSourceText,
    target_workflow: workflow,
    ordered_slide_ids: Object.freeze([...applied.receipt.after_order]),
    slide_edit_receipt: Object.freeze({ ...applied.receipt }),
  });
}

/**
 * Preview a current structural vNext without publishing a version, mutating state,
 * submitting provider work, or inheriting a source acceptance. The receipt is
 * produced by the source/visual owner and bound to the exact target bytes.
 */
export function previewTargetStructuralVersion({
  sourceRunDir,
  targetRunVersion = null,
  slideEditPlan,
  targetWorkflow,
  targetSourceText = null,
  targetSourceReceipt,
} = {}) {
  const context = runContext(sourceRunDir);
  const workflow = requireWorkflow(targetWorkflow);
  const targetVersion = targetRunVersion || slideEditPlan?.publication?.target_version || nextVersionName(context.runDir);
  if (!/^v[1-9][0-9]*$/.test(targetVersion) || targetVersion !== nextVersionName(context.runDir)) {
    throw new Error("target structural preview requires the next canonical vNext");
  }
  if (existsSync(join(dirname(context.runDir), targetVersion))) {
    throw new Error("target structural vNext already exists; inspect that exact version");
  }
  const sourceText = readFileSync(join(context.runDir, "slide-specifications.md"), "utf8");
  const sourceInspection = inspectRunProductionMode(context.deckDir, { runVersion: context.sourceVersion, purpose: "observe" });
  if (!sourceInspection.ok) throw new Error(`target structural source is unavailable: ${sourceInspection.code}`);
  const applied = validateSlidePlan(slideEditPlan, sourceText, targetVersion);
  const candidate = targetSourceText === null
    ? deriveTargetStructuralSource({ sourceText, slideEditPlan, targetWorkflow: workflow }).target_source_text
    : String(targetSourceText);
  const targetFacts = validateTargetSource(candidate, workflow, applied.receipt.after_order, targetSourceReceipt);
  const body = {
    schema: TARGET_STRUCTURAL_PLAN_SCHEMA,
    source_run_version: context.sourceVersion,
    target_run_version: targetVersion,
    source_mode: sourceInspection.mode,
    slide_edit_plan: structuredClone(slideEditPlan),
    slide_edit_plan_sha256: slideEditPlan.plan_sha256,
    target_workflow: workflow,
    target_source_text: candidate,
    target_source_sha256: targetFacts.source_sha256,
    target_source_receipt: structuredClone(targetSourceReceipt),
    ordered_slide_ids: [...targetFacts.ordered_slide_ids],
    provider_calls: 0,
  };
  return Object.freeze({ ...body, plan_hash: canonicalJsonSha256(body) });
}

/** Apply only the exact previewed target vNext and initialize fresh Page Image state. */
export function applyTargetStructuralVersion({ sourceRunDir, plan, planHash, expectedStateSha = null } = {}) {
  const context = runContext(sourceRunDir);
  if (!validTargetStructuralPlan(plan) || plan.plan_hash !== planHash) {
    throw new Error("confirmed target structural plan hash is required");
  }
  if (plan.source_run_version !== context.sourceVersion) throw new Error("target structural plan no longer names the current source");
  const sourceText = readFileSync(join(context.runDir, "slide-specifications.md"), "utf8");
  const applied = validateSlidePlan(plan.slide_edit_plan, sourceText, plan.target_run_version);
  const targetFacts = validateTargetSource(
    plan.target_source_text,
    plan.target_workflow,
    applied.receipt.after_order,
    plan.target_source_receipt,
  );
  if (targetFacts.source_sha256 !== plan.target_source_sha256 || targetFacts.ordered_slide_ids.join("\n") !== plan.ordered_slide_ids.join("\n")) {
    throw new Error("target structural plan source tuple drifted");
  }

  const targetRunDir = join(dirname(context.runDir), plan.target_run_version);
  if (existsSync(targetRunDir)) {
    const targetText = readFileSync(join(targetRunDir, "slide-specifications.md"), "utf8");
    if (targetText !== plan.target_source_text) throw new Error("target structural replay target source bytes changed after publication");
    validateTargetSource(targetText, plan.target_workflow, plan.ordered_slide_ids, plan.target_source_receipt);
    const replay = revalidateTargetPageImageStructuralReplay(context.deckDir, {
      sourceRunVersion: context.sourceVersion,
      targetRunVersion: plan.target_run_version,
      sourceReceipt: plan.target_source_receipt,
      planHash,
    });
    if (replay.workflow !== plan.target_workflow || replay.source_mode !== plan.source_mode) {
      throw new Error("target structural replay source or workflow drifted");
    }
    return Object.freeze({
      plan_hash: planHash,
      source_run_dir: context.runDir,
      target_run_dir: targetRunDir,
      target_version: plan.target_run_version,
      workflow: plan.target_workflow,
      source_epoch: replay.source_epoch,
      ordered_slide_ids: Object.freeze([...plan.ordered_slide_ids]),
      materialized_slide_ids: Object.freeze([]),
      needs_raw_generation: Object.freeze([...plan.ordered_slide_ids]),
      provider_calls: 0,
      inherited_acceptance: false,
      replayed: true,
    });
  }

  if (plan.target_run_version !== nextVersionName(context.runDir)) {
    throw new Error("target structural plan no longer names the current next vNext");
  }
  const sourceInspection = inspectRunProductionMode(context.deckDir, { runVersion: context.sourceVersion, purpose: "execute" });
  if (!sourceInspection.ok || sourceInspection.mode !== plan.source_mode) {
    throw new Error("target structural source mode changed after preview");
  }

  const publication = publishStructuralVersion({
    sourceRunDir: context.runDir,
    versionName: plan.target_run_version,
    transformedSource: plan.target_source_text,
    expectedSourceSha256: plan.slide_edit_plan.base_spec_sha256,
    validateSource: ({ sourcePath }) => {
      try {
        const stagedText = readFileSync(sourcePath, "utf8");
        validateTargetSource(stagedText, plan.target_workflow, plan.ordered_slide_ids, plan.target_source_receipt);
        return [];
      } catch (error) {
        return [error.message || String(error)];
      }
    },
  });
  const state = registerTargetPageImageStructuralPublication(context.deckDir, {
    sourceRunVersion: context.sourceVersion,
    targetRunVersion: plan.target_run_version,
    sourceReceipt: plan.target_source_receipt,
    planHash,
    expectedStateSha,
  });
  return Object.freeze({
    plan_hash: planHash,
    source_run_dir: context.runDir,
    target_run_dir: publication.target,
    target_version: plan.target_run_version,
    workflow: plan.target_workflow,
    source_epoch: state.source_epoch,
    ordered_slide_ids: Object.freeze([...plan.ordered_slide_ids]),
    materialized_slide_ids: Object.freeze([]),
    needs_raw_generation: Object.freeze([...plan.ordered_slide_ids]),
    provider_calls: 0,
    inherited_acceptance: false,
  });
}
