import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  SCRATCH_SUBDIR,
  deckRoot,
  nextVersionName,
  pageImageInitialDraftSource,
  publishStructuralVersion,
} from "../../shared/run-bundle/bundle_layout.mjs";
import {
  initializeTargetPageImageState,
  inspectRunProductionMode,
  readState,
  registerTargetPageImageStructuralPublication,
} from "../../shared/state/state.mjs";
import { parsePageImageSource } from "./page_image_source.mjs";
import {
  NarrativeSourceError,
  parseDesignConstraints,
  parseStoryOutline,
} from "./narrative_source.mjs";

export const NARRATIVE_PAGE_GROUPING_CANDIDATE_SCHEMA = "narrative-page-grouping-candidate";
export const NARRATIVE_PAGE_PLAN_SCHEMA = "narrative-page-plan";

const SHA256_RE = /^[0-9a-f]{64}$/;
const PAGE_IMAGE_WORKFLOWS = new Set(["framed", "pure"]);
const TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });

export class NarrativePagePlanError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((entry) => entry.message || String(entry)).join("; "));
    this.name = "NarrativePagePlanError";
    this.issues = Object.freeze(list);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function issue(code, message, { path = null, subject = null, actual = undefined } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    ...(path ? { source: { path } } : {}),
    ...(subject ? { subject } : {}),
    ...(actual !== undefined ? { actual } : {}),
    repair_hint: "repair the Story Outline, Design Constraints, or narrative candidate, then preview a new page plan",
  };
}

function fail(code, message, options = {}) {
  throw new NarrativePagePlanError(issue(code, message, options));
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function canonicalPath(value) {
  return String(value || "").replaceAll("\\", "/");
}

function runContext(sourceRunDir) {
  const runDir = resolve(sourceRunDir || "");
  const sourceVersion = basename(runDir);
  if (!/^v[1-9][0-9]*$/.test(sourceVersion) || basename(dirname(runDir)) !== "3_versions") {
    fail("narrative_run_dir_invalid", "narrative planning requires a canonical 3_versions/vN run directory", { path: runDir });
  }
  return Object.freeze({
    runDir,
    sourceVersion,
    deckDir: deckRoot(runDir),
    sourcePath: join(runDir, "slide-specifications.md"),
    scratchDir: join(runDir, SCRATCH_SUBDIR),
  });
}

function requireVisualSystem(visualSystem) {
  if (typeof visualSystem?.loadPageImageVisualLanguage !== "function" ||
      typeof visualSystem?.createPageImageSourceResolver !== "function") {
    fail(
      "narrative_visual_system_unavailable",
      "narrative planning requires the current Visual Language registry through the visual-system public interface",
    );
  }
  return visualSystem;
}

function readUtf8(path, code, label) {
  try {
    return TEXT_DECODER.decode(readFileSync(path));
  } catch (error) {
    fail(code, `${label} must be an available UTF-8 file: ${error.message}`, { path });
  }
}

function confinedScratchFile(context, candidatePath) {
  if (typeof candidatePath !== "string" || !candidatePath.trim()) {
    fail("narrative_candidate_path_required", "narrative-plan requires one candidate path under the current _scratch directory", { path: context.scratchDir });
  }
  const absolute = resolve(candidatePath);
  const lexicalRelative = relative(context.scratchDir, absolute);
  if (!lexicalRelative || lexicalRelative === ".." || lexicalRelative.startsWith(`..${sep}`)) {
    fail("narrative_candidate_escapes_scratch", "narrative candidate must remain inside the current version _scratch directory", { path: absolute });
  }
  let realScratch;
  let realCandidate;
  try {
    realScratch = realpathSync(context.scratchDir);
    realCandidate = realpathSync(absolute);
  } catch (error) {
    fail("narrative_candidate_unavailable", `narrative candidate could not be resolved: ${error.message}`, { path: absolute });
  }
  const realRelative = relative(realScratch, realCandidate);
  if (!realRelative || realRelative === ".." || realRelative.startsWith(`..${sep}`)) {
    fail("narrative_candidate_realpath_escape", "narrative candidate realpath must remain inside the current version _scratch directory", { path: absolute });
  }
  return Object.freeze({
    path: realCandidate,
    locator: canonicalPath(realRelative),
    text: readUtf8(realCandidate, "narrative_candidate_unavailable", "Narrative candidate"),
  });
}

function parseCandidatePage(value, index, source) {
  if (!exactKeys(value, ["slide_id", "blocks"])) {
    fail("narrative_candidate_page_shape", "each narrative candidate page must contain only slide_id and blocks", {
      path: source,
      subject: { kind: "candidate_page", position: index + 1 },
    });
  }
  if (typeof value.slide_id !== "string" || !value.slide_id) {
    fail("narrative_candidate_slide_id", "each narrative candidate page needs one non-empty target slide_id", {
      path: source,
      subject: { kind: "candidate_page", position: index + 1 },
    });
  }
  if (!Array.isArray(value.blocks) || value.blocks.length === 0) {
    fail("narrative_candidate_lineage_required", "each narrative candidate page needs at least one Block lineage reference", {
      path: source,
      subject: { kind: "candidate_page", id: value.slide_id },
    });
  }
  const blocks = value.blocks.map((block, blockIndex) => {
    if (!exactKeys(block, ["block_ordinal", "block_heading", "beat_ordinals"])) {
      fail("narrative_candidate_lineage_shape", "each Block lineage reference must contain block_ordinal, block_heading, and beat_ordinals only", {
        path: source,
        subject: { kind: "candidate_page", id: value.slide_id, block_index: blockIndex + 1 },
      });
    }
    if (!Number.isInteger(block.block_ordinal) || block.block_ordinal < 1 ||
      typeof block.block_heading !== "string" || !block.block_heading ||
      !Array.isArray(block.beat_ordinals) || block.beat_ordinals.length === 0 ||
      block.beat_ordinals.some((ordinal) => !Number.isInteger(ordinal) || ordinal < 1) ||
      new Set(block.beat_ordinals).size !== block.beat_ordinals.length) {
      fail("narrative_candidate_lineage_invalid", "each Block lineage reference needs one positive ordinal, its exact heading, and unique positive beat ordinals", {
        path: source,
        subject: { kind: "candidate_page", id: value.slide_id, block_index: blockIndex + 1 },
      });
    }
    return {
      block_ordinal: block.block_ordinal,
      block_heading: block.block_heading,
      beat_ordinals: [...block.beat_ordinals],
    };
  });
  return { slide_id: value.slide_id, blocks };
}

/** Parse the ephemeral Agent-authored grouping input without reading a Run Bundle. */
export function parseNarrativePageGroupingCandidate(sourceText, { source = "narrative-page-grouping-candidate.json" } = {}) {
  const text = String(sourceText ?? "");
  let candidate;
  try {
    candidate = JSON.parse(text);
  } catch (error) {
    fail("narrative_candidate_json_invalid", `narrative candidate must be valid UTF-8 JSON: ${error.message}`, { path: source });
  }
  if (!exactKeys(candidate, ["schema", "target_page_source", "pages"]) || candidate.schema !== NARRATIVE_PAGE_GROUPING_CANDIDATE_SCHEMA) {
    fail("narrative_candidate_schema_invalid", `narrative candidate must use schema ${NARRATIVE_PAGE_GROUPING_CANDIDATE_SCHEMA} with target_page_source and pages only`, { path: source });
  }
  if (typeof candidate.target_page_source !== "string" || !candidate.target_page_source) {
    fail("narrative_candidate_target_source_required", "narrative candidate must contain one complete non-empty target Page Source text", { path: source });
  }
  if (!Array.isArray(candidate.pages) || candidate.pages.length === 0) {
    fail("narrative_candidate_pages_required", "narrative candidate must contain an ordered non-empty pages list", { path: source });
  }
  const pages = candidate.pages.map((page, index) => parseCandidatePage(page, index, source));
  if (new Set(pages.map((page) => page.slide_id)).size !== pages.length) {
    fail("narrative_candidate_slide_id_duplicate", "narrative candidate pages must not repeat a target slide_id", { path: source });
  }
  return deepFreeze({
    schema: NARRATIVE_PAGE_GROUPING_CANDIDATE_SCHEMA,
    target_page_source: candidate.target_page_source,
    pages,
  });
}

function validateLineage(candidatePages, story, source) {
  const blocks = new Map(story.blocks.map((block) => [block.ordinal, block]));
  const declaredBeats = new Set();
  for (const block of story.blocks) {
    for (let beatIndex = 1; beatIndex <= block.beats.length; beatIndex += 1) {
      declaredBeats.add(`${block.ordinal}:${beatIndex}`);
    }
  }
  const usedBeats = new Set();
  const pages = candidatePages.map((page, pageIndex) => {
    const position = pageIndex + 1;
    const lineage = page.blocks.map((reference) => {
      const block = blocks.get(reference.block_ordinal);
      if (!block || block.heading !== reference.block_heading) {
        fail("narrative_candidate_block_mismatch", "candidate Block lineage must name one current Story Outline ordinal and exact heading", {
          path: source,
          subject: { kind: "candidate_page", id: page.slide_id, block_ordinal: reference.block_ordinal },
        });
      }
      if (position < block.intended_page_range.start || position > block.intended_page_range.end) {
        fail("narrative_candidate_range_mismatch", "candidate page position falls outside its Story Outline Block intended page range", {
          path: source,
          subject: { kind: "candidate_page", id: page.slide_id, block_ordinal: block.ordinal },
        });
      }
      for (const beatOrdinal of reference.beat_ordinals) {
        const key = `${block.ordinal}:${beatOrdinal}`;
        if (!declaredBeats.has(key)) {
          fail("narrative_candidate_beat_unknown", "candidate beat ordinal does not exist in its current Story Outline Block", {
            path: source,
            subject: { kind: "candidate_page", id: page.slide_id, block_ordinal: block.ordinal, beat_ordinal: beatOrdinal },
          });
        }
        if (usedBeats.has(key)) {
          fail("narrative_candidate_beat_duplicate", "each Story Outline evidence or reasoning beat must support exactly one candidate page", {
            path: source,
            subject: { kind: "candidate_page", id: page.slide_id, block_ordinal: block.ordinal, beat_ordinal: beatOrdinal },
          });
        }
        usedBeats.add(key);
      }
      return {
        block_ordinal: block.ordinal,
        block_heading: block.heading,
        beat_ordinals: [...reference.beat_ordinals],
      };
    });
    return { position, slide_id: page.slide_id, blocks: lineage };
  });
  if (usedBeats.size !== declaredBeats.size) {
    const missing = [...declaredBeats].find((key) => !usedBeats.has(key));
    fail("narrative_candidate_beat_unmapped", "each Story Outline evidence or reasoning beat must appear in the candidate page lineage", {
      path: source,
      actual: missing,
    });
  }
  return pages;
}

function sourceInputs(context, visualSystem) {
  const storyPath = join(context.deckDir, "2_backbone", "story-outline.md");
  const constraintsPath = join(context.deckDir, "2_backbone", "design-constraints.md");
  const storyText = readUtf8(storyPath, "narrative_story_outline_unavailable", "Story Outline");
  const constraintsText = readUtf8(constraintsPath, "narrative_design_constraints_unavailable", "Design Constraints");
  let story;
  let constraints;
  try {
    story = parseStoryOutline(storyText, { source: canonicalPath(relative(context.deckDir, storyPath)) });
    constraints = parseDesignConstraints(constraintsText, { source: canonicalPath(relative(context.deckDir, constraintsPath)) });
  } catch (error) {
    if (error instanceof NarrativeSourceError) throw error;
    throw error;
  }
  const visualLanguage = visualSystem.loadPageImageVisualLanguage(context.deckDir);
  const registry = visualSystem.createPageImageSourceResolver({ deckDir: context.deckDir, visualLanguage });
  return Object.freeze({ story, constraints, visualLanguage, registry });
}

function hasInitialEvidence(state, version) {
  const key = `3_versions/${version}`;
  return [
    "page_image_target_evidence",
    "page_image_raw_provider_authorization",
    "page_image_style_master",
    "page_image_progressive_handoff",
    "page_image_task_mandate",
  ].some((name) => Boolean(state?.[name]?.by_version?.[key]));
}

function initialDraftEligibility(context, sourceText) {
  if (context.sourceVersion !== "v1") return Object.freeze({ eligible: false, state: null });
  const state = readState(context.deckDir, { purpose: "observe", heal: false, runVersion: "v1" });
  const deckType = state?.deck?.type || null;
  const exactSeed = pageImageInitialDraftSource(deckType);
  const generatedRoot = join(context.runDir, "_generated", "page_image_workflow");
  return Object.freeze({
    eligible: sourceText === exactSeed && !hasInitialEvidence(state, "v1") && !existsSync(generatedRoot),
    state,
  });
}

function planBody(plan) {
  const { plan_sha256: _ignored, ...body } = plan;
  return body;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function targetReceipt(inputs, candidate, source) {
  let receipt;
  try {
    receipt = parsePageImageSource(candidate.target_page_source, {
      source: "slide-specifications.md",
      registry: inputs.registry,
    });
  } catch (error) {
    if (error?.issues) throw error;
    fail("narrative_target_source_invalid", `candidate target Page Source is invalid: ${error.message || String(error)}`, { path: source });
  }
  const ids = receipt.slides.map((slide) => slide.slide_id);
  const candidateIds = candidate.pages.map((page) => page.slide_id);
  if (!sameJson(ids, candidateIds)) {
    fail("narrative_candidate_source_order_mismatch", "candidate page slide_id order must exactly equal the parsed target Page Source order", { path: source });
  }
  return Object.freeze({ receipt, ids });
}

function requireCurrentSourceForVNext(context, sourceText, inputs) {
  const inspection = inspectRunProductionMode(context.deckDir, {
    runVersion: context.sourceVersion,
    purpose: "observe",
  });
  if (!inspection.ok) {
    fail("narrative_current_source_unavailable", `authored narrative publication requires a current source-State binding: ${inspection.code}`, { path: context.sourcePath });
  }
  try {
    parsePageImageSource(sourceText, { source: "slide-specifications.md", registry: inputs.registry });
  } catch (error) {
    if (error?.issues) throw error;
    fail("narrative_current_source_invalid", `current Page Source is invalid: ${error.message || String(error)}`, { path: context.sourcePath });
  }
  return inspection;
}

function compilePlan(context, candidateFile, currentSourceText, visualSystem) {
  const inputs = sourceInputs(context, visualSystem);
  const candidate = parseNarrativePageGroupingCandidate(candidateFile.text, { source: candidateFile.locator });
  const target = targetReceipt(inputs, candidate, candidateFile.locator);
  const pages = validateLineage(candidate.pages, inputs.story, candidateFile.locator);
  const initial = initialDraftEligibility(context, currentSourceText);
  const publication = initial.eligible ? "initial-draft" : "next-version";
  if (publication === "next-version") requireCurrentSourceForVNext(context, currentSourceText, inputs);
  const targetVersion = publication === "initial-draft" ? "v1" : nextVersionName(context.runDir);
  const targetWorkflow = target.receipt.workflow;
  if (!PAGE_IMAGE_WORKFLOWS.has(targetWorkflow)) {
    fail("narrative_target_workflow_invalid", "target Page Source must select framed or pure", { path: candidateFile.locator });
  }
  const body = {
    schema: NARRATIVE_PAGE_PLAN_SCHEMA,
    publication,
    source_run_version: context.sourceVersion,
    target_run_version: targetVersion,
    target_workflow: targetWorkflow,
    story_outline_sha256: inputs.story.source_sha256,
    design_constraints_sha256: inputs.constraints.source_sha256,
    visual_language_sha256: inputs.visualLanguage.audit.whole_registry_sha256,
    candidate_locator: candidateFile.locator,
    candidate_sha256: sha256(candidateFile.text),
    current_source_sha256: sha256(currentSourceText),
    target_source_text: candidate.target_page_source,
    target_source_sha256: target.receipt.source_sha256,
    target_source_receipt: structuredClone(target.receipt),
    ordered_slide_ids: [...target.ids],
    pages,
    provider_calls: 0,
  };
  return deepFreeze({ ...body, plan_sha256: canonicalJsonSha256(body) });
}

function validPlan(plan) {
  const keys = [
    "schema",
    "publication",
    "source_run_version",
    "target_run_version",
    "target_workflow",
    "story_outline_sha256",
    "design_constraints_sha256",
    "visual_language_sha256",
    "candidate_locator",
    "candidate_sha256",
    "current_source_sha256",
    "target_source_text",
    "target_source_sha256",
    "target_source_receipt",
    "ordered_slide_ids",
    "pages",
    "provider_calls",
    "plan_sha256",
  ];
  return exactKeys(plan, keys) && plan.schema === NARRATIVE_PAGE_PLAN_SCHEMA &&
    ["initial-draft", "next-version"].includes(plan.publication) &&
    /^v[1-9][0-9]*$/.test(plan.source_run_version || "") && /^v[1-9][0-9]*$/.test(plan.target_run_version || "") &&
    PAGE_IMAGE_WORKFLOWS.has(plan.target_workflow) &&
    [plan.story_outline_sha256, plan.design_constraints_sha256, plan.visual_language_sha256, plan.candidate_sha256,
      plan.current_source_sha256, plan.target_source_sha256, plan.plan_sha256].every((value) => SHA256_RE.test(value || "")) &&
    typeof plan.candidate_locator === "string" && plan.candidate_locator && !plan.candidate_locator.startsWith("/") &&
    typeof plan.target_source_text === "string" && Array.isArray(plan.ordered_slide_ids) && plan.ordered_slide_ids.length > 0 &&
    Array.isArray(plan.pages) && plan.pages.length === plan.ordered_slide_ids.length && plan.provider_calls === 0 &&
    plan.plan_sha256 === canonicalJsonSha256(planBody(plan));
}

function writePlan(context, plan) {
  const directory = join(context.scratchDir, "narrative-plans");
  const output = join(directory, `${plan.plan_sha256}.json`);
  const text = `${JSON.stringify(plan, null, 2)}\n`;
  mkdirSync(directory, { recursive: true });
  if (existsSync(output)) {
    if (readUtf8(output, "narrative_plan_unavailable", "Narrative page plan") !== text) {
      fail("narrative_plan_collision", "the existing narrative page plan bytes do not match its plan_sha256", { path: output });
    }
    return output;
  }
  const temporary = join(directory, `.${plan.plan_sha256}.${process.pid}.tmp`);
  writeFileSync(temporary, text, "utf8");
  renameSync(temporary, output);
  return output;
}

/** Compile and persist one non-authoritative plan under the current version _scratch directory. */
export function previewNarrativePagePlan({ sourceRunDir, candidatePath, visualSystem } = {}) {
  const context = runContext(sourceRunDir);
  const currentVisualSystem = requireVisualSystem(visualSystem);
  const currentSourceText = readUtf8(context.sourcePath, "narrative_current_source_unavailable", "Current Page Source");
  const candidateFile = confinedScratchFile(context, candidatePath);
  const plan = compilePlan(context, candidateFile, currentSourceText, currentVisualSystem);
  const planPath = writePlan(context, plan);
  return deepFreeze({
    kind: "narrative-page-plan",
    plan_sha256: plan.plan_sha256,
    plan_path: planPath,
    publication: plan.publication,
    source_run_version: plan.source_run_version,
    target_run_version: plan.target_run_version,
    target_workflow: plan.target_workflow,
    ordered_slide_ids: [...plan.ordered_slide_ids],
    pages: structuredClone(plan.pages),
    provider_calls: 0,
  });
}

function loadBoundCandidate(context, locator) {
  if (typeof locator !== "string" || !locator || locator.startsWith("/") || locator.split("/").includes("..")) {
    fail("narrative_candidate_locator_invalid", "narrative plan candidate locator is invalid", { path: locator });
  }
  return confinedScratchFile(context, join(context.scratchDir, locator));
}

function assertPlanInputsCurrent(context, plan, currentSourceText, visualSystem) {
  const candidateFile = loadBoundCandidate(context, plan.candidate_locator);
  const inputs = sourceInputs(context, visualSystem);
  const candidate = parseNarrativePageGroupingCandidate(candidateFile.text, { source: candidateFile.locator });
  const target = targetReceipt(inputs, candidate, candidateFile.locator);
  const pages = validateLineage(candidate.pages, inputs.story, candidateFile.locator);
  const bindings = {
    story_outline_sha256: inputs.story.source_sha256,
    design_constraints_sha256: inputs.constraints.source_sha256,
    visual_language_sha256: inputs.visualLanguage.audit.whole_registry_sha256,
    candidate_locator: candidateFile.locator,
    candidate_sha256: sha256(candidateFile.text),
    target_source_text: candidate.target_page_source,
    target_source_sha256: target.receipt.source_sha256,
    target_source_receipt: target.receipt,
    ordered_slide_ids: target.ids,
    pages,
  };
  for (const [key, value] of Object.entries(bindings)) {
    if (!sameJson(value, plan[key])) {
      fail("narrative_plan_stale", `narrative plan ${key} no longer matches its current bound input`, { path: context.runDir });
    }
  }
  return Object.freeze({ inputs, targetReceipt: target.receipt, currentSourceText });
}

function atomicWrite(path, text) {
  const temporary = join(dirname(path), `.${basename(path)}.narrative-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(temporary, text, "utf8");
  renameSync(temporary, path);
}

function publicationResult(context, plan, state, { replayed = false, stateBoundOnly = false } = {}) {
  return deepFreeze({
    kind: "narrative-page-plan",
    applied: true,
    plan_sha256: plan.plan_sha256,
    source_run_dir: context.runDir,
    target_run_dir: join(dirname(context.runDir), plan.target_run_version),
    target_version: plan.target_run_version,
    workflow: plan.target_workflow,
    source_epoch: state.source_epoch,
    ordered_slide_ids: [...plan.ordered_slide_ids],
    materialized_slide_ids: [...plan.ordered_slide_ids],
    needs_raw_generation: [...plan.ordered_slide_ids],
    provider_calls: 0,
    inherited_acceptance: false,
    ...(replayed ? { replayed: true } : {}),
    ...(stateBoundOnly ? { state_bound_only: true } : {}),
  });
}

/** Apply only one exact persisted narrative plan, using the existing source-State owner. */
export function applyNarrativePagePlan({ sourceRunDir, plan, planSha256, initializeState = initializeTargetPageImageState, visualSystem } = {}) {
  const context = runContext(sourceRunDir);
  if (!validPlan(plan) || plan.plan_sha256 !== planSha256) {
    fail("narrative_plan_hash_required", "an exact narrative plan_sha256 is required for publication", { path: context.runDir });
  }
  if (plan.source_run_version !== context.sourceVersion) {
    fail("narrative_plan_source_version_stale", "narrative plan no longer names the current source version", { path: context.runDir });
  }
  const currentSourceText = readUtf8(context.sourcePath, "narrative_current_source_unavailable", "Current Page Source");
  const checked = assertPlanInputsCurrent(context, plan, currentSourceText, requireVisualSystem(visualSystem));
  const sourceIsPlannedBase = sha256(currentSourceText) === plan.current_source_sha256;
  const sourceIsExactTarget = currentSourceText === plan.target_source_text && sha256(currentSourceText) === plan.target_source_sha256;

  if (plan.publication === "initial-draft") {
    if (plan.target_run_version !== "v1" || context.sourceVersion !== "v1") {
      fail("narrative_initial_target_invalid", "initial narrative publication may target only exact v1", { path: context.runDir });
    }
    if (sourceIsPlannedBase) {
      const initial = initialDraftEligibility(context, currentSourceText);
      if (!initial.eligible) {
        fail("narrative_initial_draft_unavailable", "initial narrative publication requires the exact current deck-type seed with no source-bound evidence", { path: context.sourcePath });
      }
      atomicWrite(context.sourcePath, plan.target_source_text);
      const state = initializeState(context.deckDir, {
        runVersion: "v1",
        sourceReceipt: checked.targetReceipt,
      });
      return publicationResult(context, plan, state.record ? { source_epoch: state.record.source_epoch } : state);
    }
    if (!sourceIsExactTarget || hasInitialEvidence(readState(context.deckDir, { purpose: "observe", heal: false, runVersion: "v1" }), "v1")) {
      fail("narrative_initial_replay_conflict", "only the same exact plan may finish an interrupted initial State binding", { path: context.sourcePath });
    }
    const state = initializeState(context.deckDir, {
      runVersion: "v1",
      sourceReceipt: checked.targetReceipt,
    });
    return publicationResult(context, plan, state.record ? { source_epoch: state.record.source_epoch } : state, {
      replayed: true,
      stateBoundOnly: true,
    });
  }

  if (plan.publication !== "next-version" || plan.target_run_version !== nextVersionName(context.runDir) || !sourceIsPlannedBase) {
    fail("narrative_next_version_stale", "authored narrative publication requires the current matching source and its exact next vNext", { path: context.runDir });
  }
  requireCurrentSourceForVNext(context, currentSourceText, checked.inputs);
  const publication = publishStructuralVersion({
    sourceRunDir: context.runDir,
    versionName: plan.target_run_version,
    transformedSource: plan.target_source_text,
    expectedSourceSha256: plan.current_source_sha256,
    validateSource: ({ sourcePath }) => {
      try {
        const stagedText = readUtf8(sourcePath, "narrative_target_source_unavailable", "Staged target Page Source");
        const receipt = parsePageImageSource(stagedText, {
          source: "slide-specifications.md",
          registry: checked.inputs.registry,
        });
        return receipt.source_sha256 === plan.target_source_sha256 ? [] : ["staged narrative target source bytes changed"];
      } catch (error) {
        return [error.message || String(error)];
      }
    },
  });
  const state = registerTargetPageImageStructuralPublication(context.deckDir, {
    sourceRunVersion: context.sourceVersion,
    targetRunVersion: plan.target_run_version,
    sourceReceipt: checked.targetReceipt,
    planHash: plan.plan_sha256,
  });
  return publicationResult(context, plan, state);
}
