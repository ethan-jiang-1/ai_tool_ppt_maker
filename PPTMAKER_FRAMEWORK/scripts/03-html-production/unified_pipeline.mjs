#!/usr/bin/env node
/**
 * unified_pipeline.mjs — Node.js ESM pipeline script
 *
 * Single entry point that delegates to the appropriate scripts for each stage.
 * Reads configuration from the run bundle and handles stage-to-stage handoffs.
 *
 * The run-bundle directory structure is defined ONLY in bundle_layout.mjs (the
 * single source of truth) — this orchestrator imports it and never restates paths.
 * Run `node bundle_layout.mjs` to print the canonical tree.
 *
 * Usage:
 *     # Run all 5 stages
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all
 *
 *     # Run a single stage (for editing chain reruns)
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage 3
 *
 *     # Run with custom API base URL
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all --base-url https://api.example.com/v1
 *
 *     # Dry run (print what would be executed)
 *     node unified_pipeline.mjs --run-dir deck_myproject/3_versions/v1 --stage all --dry-run
 *
 * Descriptive refresh paths after initial production (these are not CLI enums):
 *     Header Text & Style Refresh: --stage 1,3,4,5
 *     Generated Image Rebuild:     logical 1 + forced selected 2 + review + 3,4,5/reuse
 *     Notes-Only Refresh:           --stage 5
 */

import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/unified_pipeline.mjs";
import { CLI_ERROR_CODES, createCliNext, diagnosticFromError, emitCliError, emitCliProgress, sanitizeCliDiagnostic } from "../shared/cli/cli_error.mjs";

import { existsSync, readFileSync, readdirSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join, basename, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

// --- Import from bundle_layout.mjs — the single source of truth ---------------
import {
  // top-level
  UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR,
  GUIDE_FILE, POINTER_FILE, METADATA_FILE,
  // visual-style
  STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE,
  // version
  SLIDE_SPECS_GLOB, OVERRIDES_SUBDIR, GENERATED_SUBDIR,
  // _generated
  GEN_SLIDE_PLAN, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON,
  GEN_IMAGES_SUBDIR, GEN_HEADER_LOCKED_SUBDIR,
  GEN_PPT_SUBDIR, GEN_PREVIEW_SUBDIR,
  GEN_QA_SUBDIR,
  // resolvers
  deckRoot, backboneDir, styleAsset, assetsDir, generatedDir,
  findSlideSpecs, deckName, checkBundle, loadDotenv,
} from "../shared/run-bundle/bundle_layout.mjs";
import { HTML_FIRST_PIPELINE } from "../shared/run-bundle/production_marker.mjs";
import { resolveSlideIds } from "../01-content/index.mjs";
import { loadAssetManifest, resolveAssetFile, validateAssetManifest } from "../02-visual-system/index.mjs";
import {
  carryForwardHeaderReview,
  computeStructuralImpact,
  versionKey,
} from "../04-image-production/index.mjs";
import { resolveRunProductionAdapter } from "../shared/state/state.mjs";

// --- Configuration -----------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** PPTMAKER_FRAMEWORK/ — parent of scripts/ */
export const FRAMEWORK_DIR = resolve(__dirname, "..");

/** scripts/ — where the per-stage scripts live */
export const REFERENCE_SCRIPTS_DIR = __dirname;

// Stage 1–5 are all in-framework Node (.mjs). No external skills. No Python. No bash.

// --- JSON helpers ------------------------------------------------------------

/**
 * Load and parse a JSON file.
 * @param {string} path
 * @returns {object}
 */
export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Write a canonical prompt manifest containing only selected slide IDs.
 * @param {string} source - Path to full _prompts.json.
 * @param {string} target - Output path for filtered JSON.
 * @param {string[]} selectedIds - Slide IDs to include.
 * @returns {string} The target path.
 * @throws {Error} if any selected ID is unknown.
 */
export function writePromptSubset(source, target, selectedIds) {
  const promptData = loadJson(source);
  const selected = new Set(selectedIds);
  const filtered = (promptData.slides || []).filter(
    (slide) => selected.has(slide.id)
  );
  const found = new Set(filtered.map((s) => s.id));
  const missing = selectedIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(`unknown slide IDs: ${missing.join(", ")}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    JSON.stringify({ slides: filtered }, null, 2) + "\n",
    "utf-8"
  );
  return target;
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", "utf-8");
  renameSync(temp, path);
  return path;
}

function writeHtmlPlanAtomic(runDir, path, value, verify) {
  const temp = join(runDir, `.slide_plan-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { encoding: "utf-8", flag: "wx" });
    verify();
    mkdirSync(dirname(path), { recursive: true });
    renameSync(temp, path);
    return path;
  } finally {
    rmSync(temp, { force: true });
  }
}

async function targetGenerationProfiles(runDir, prompts, { resolution, model }) {
  const {
    generationProfile,
  } = await import("../04-image-production/index.mjs");
  const { sha256Bytes, sha256File } = await import("../shared/identity/byte_hash.mjs");
  const styleReferenceSha256 = sha256File(styleAsset(runDir, STYLE_MASTER_IMAGE));
  let manifest = null;
  try { manifest = loadAssetManifest(assetsDir(runDir)); } catch { /* optional */ }
  const profiles = {};
  for (const slide of prompts) {
    const id = String(slide.slide_id || slide.id || "");
    const assetHashes = {};
    for (const assetId of slide.asset_ids || []) {
      const path = manifest ? resolveAssetFile(runDir, manifest, assetId) : null;
      if (path && existsSync(path)) assetHashes[assetId] = sha256File(path);
    }
    const sortedIds = Object.keys(assetHashes).sort();
    const assetRefs = sortedIds.length > 0 ? {
      aggregate_sha256: sha256Bytes(sortedIds.map((key) => assetHashes[key]).join("")),
      asset_count: sortedIds.length,
      assets: assetHashes,
    } : {};
    profiles[id] = generationProfile({
      styleReferenceSha256,
      resolution,
      model,
      semanticOptions: { size: "16:9", n: 1 },
      assetRefs,
    });
  }
  return profiles;
}

/**
 * Materialize verified source raw renders into a structural target. This path
 * performs local file work only; it never invokes Stage 2 or any renderer.
 */
export async function materializeStructuralVersion({
  sourceRunDir,
  targetRunDir,
  resolution = "2k",
  model = "gpt-image-2",
  rebuildLocal = true,
} = {}) {
  const sourceDir = resolve(sourceRunDir);
  const targetDir = resolve(targetRunDir);
  if (sourceDir === targetDir) throw new Error("structural materialization requires distinct source and target versions");
  const targetSource = join(targetDir, "slide-specifications.md");
  if (existsSync(targetSource)) {
    const { HTML_FIRST_PIPELINE, probeProductionMarker } = await import("./internal/html_slide_contract.mjs");
    const marker = probeProductionMarker(readFileSync(targetSource), { source: "slide-specifications.md" });
    if (marker.branch === HTML_FIRST_PIPELINE) {
      return materializeHtmlStructuralVersion({ sourceDir, targetDir, rebuildLocal });
    }
  }
  if (!await stage1(targetDir, false)) {
    const error = new Error("target Stage 1 failed before structural materialization");
    error.cliDiagnostic = stage1.lastFailure;
    throw error;
  }

  const sourceBuild = generatedDir(sourceDir);
  const targetBuild = generatedDir(targetDir);
  const sourcePlanPath = join(sourceBuild, GEN_SLIDE_PLAN);
  const sourcePromptsPath = join(sourceBuild, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
  const targetPlanPath = join(targetBuild, GEN_SLIDE_PLAN);
  const targetPromptsPath = join(targetBuild, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
  for (const path of [sourcePlanPath, sourcePromptsPath, targetPlanPath, targetPromptsPath]) {
    if (!existsSync(path)) throw new Error(`structural materialization prerequisite missing: ${path}`);
  }
  const sourcePlan = loadJson(sourcePlanPath).slides || [];
  const sourcePrompts = loadJson(sourcePromptsPath).slides || [];
  const targetPlan = loadJson(targetPlanPath).slides || [];
  const targetPrompts = loadJson(targetPromptsPath).slides || [];
  const targetProfiles = await targetGenerationProfiles(targetDir, targetPrompts, { resolution, model });
  const sourceImages = join(sourceBuild, GEN_IMAGES_SUBDIR);
  const targetImages = join(targetBuild, GEN_IMAGES_SUBDIR);
  const root = deckRoot(targetDir);
  const sourceKey = versionKey(root, sourceDir);
  const targetKey = versionKey(root, targetDir);
  const {
    generationFingerprint,
    materializeVerifiedRawImage,
    publishMaterializedRawImages,
    readImageManifest,
  } = await import("../04-image-production/index.mjs");
  const {
    ARTIFACT_KIND_RAW_RENDER,
    ARTIFACT_STATUS_VERIFIED,
    RENDER_ENGINE_IMAGE2,
  } = await import("../shared/identity/render_artifacts.mjs");
  const { resolveRenderArtifact } = await import("../04-image-production/index.mjs");
  const sourceManifestRead = readImageManifest(sourceImages);
  const sourceIds = new Set(sourcePlan.map((slide) => String(slide.slide_id || slide.id || "")));
  const results = [];
  const artifactProofs = {};
  for (const slide of targetPrompts) {
    const id = String(slide.slide_id || slide.id || "");
    const profile = targetProfiles[id];
    if (!sourceIds.has(id)) {
      const result = { status: "needs_render", slide_id: id, reason: "stable ID is inserted in the target" };
      results.push(result);
      artifactProofs[id] = { status: "missing", reason: result.reason };
      continue;
    }
    const fingerprint = generationFingerprint({ prompt: String(slide.prompt || "").trim(), profile });
    const proof = resolveRenderArtifact({
      directory: sourceImages,
      manifest: sourceManifestRead.manifest,
      manifestError: sourceManifestRead.error,
      slideId: id,
      renderEngine: RENDER_ENGINE_IMAGE2,
      artifactKind: ARTIFACT_KIND_RAW_RENDER,
      fingerprint,
      profile,
      defaultEngine: RENDER_ENGINE_IMAGE2,
      defaultKind: ARTIFACT_KIND_RAW_RENDER,
    });
    artifactProofs[id] = {
      status: proof.status,
      ...(proof.reason ? { reason: proof.reason } : {}),
      ...(proof.byte_sha256 ? { byte_sha256: proof.byte_sha256 } : {}),
    };
    if (proof.status !== ARTIFACT_STATUS_VERIFIED) {
      results.push({ status: "needs_render", slide_id: id, reason: proof.reason, target_profile: profile, proof });
      continue;
    }
    results.push(materializeVerifiedRawImage({
      sourceDir: sourceImages,
      targetDir: targetImages,
      slide,
      sourceManifest: sourceManifestRead.manifest,
      sourceManifestError: sourceManifestRead.error,
      profile,
      sourceVersion: sourceKey,
    }));
  }
  const verified = results.filter((result) => result.status === ARTIFACT_STATUS_VERIFIED);
  publishMaterializedRawImages({ targetDir: targetImages, results: verified, replace: true });

  const sourceProfiles = Object.fromEntries(Object.entries(sourceManifestRead.manifest.slides || {})
    .map(([id, entry]) => [id, entry?.generation_profile || null]));
  const { readState, writeState } = await import("../shared/state/state.mjs");
  const {
    HEADER_REVIEW_NODE,
    buildHeaderReviewInputs,
  } = await import("../04-image-production/index.mjs");
  const { loadVisualConfig, DEFAULT_CONFIG } = await import("../02-visual-system/index.mjs");
  const palettePath = styleAsset(targetDir, COLOR_PALETTE_FILE);
  const visualConfig = existsSync(palettePath) ? loadVisualConfig(palettePath) : DEFAULT_CONFIG;
  const state = readState(root);
  const sourceRecord = state.nodes?.[HEADER_REVIEW_NODE]?.by_version?.[sourceKey] || null;
  const targetInputs = buildHeaderReviewInputs(targetPlan, visualConfig);
  const resultById = Object.fromEntries(results.map((result) => [result.slide_id, result]));
  const review = carryForwardHeaderReview({
    sourceRecord,
    targetInputs,
    materializedEntries: resultById,
    sourceVersion: sourceKey,
  });
  if (review.record) {
    state.nodes[HEADER_REVIEW_NODE] ||= {};
    state.nodes[HEADER_REVIEW_NODE].by_version ||= {};
    state.nodes[HEADER_REVIEW_NODE].by_version[targetKey] = review.record;
    writeState(root, state);
  }

  const impact = computeStructuralImpact({
    sourcePlan,
    targetPlan,
    sourcePrompts,
    targetPrompts,
    sourceProfiles,
    targetProfiles,
    artifactProofs,
    reviewWarnings: review.warnings.reduce((groups, warning) => {
      groups[warning.slide_id] ||= [];
      groups[warning.slide_id].push(warning.reason);
      return groups;
    }, {}),
  });
  const completedLocalStages = ["stage1"];
  if (impact.needs_render.length === 0 && rebuildLocal) {
    if (!await stage3(targetDir, false)) {
      const error = new Error("target Stage 3 failed after raw materialization");
      error.cliDiagnostic = stage3.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage3");
    const { buildWholePageContactSheet } = await import("../04-image-production/index.mjs");
    await buildWholePageContactSheet({
      imageDir: join(targetBuild, GEN_IMAGES_SUBDIR),
      promptJson: targetPromptsPath,
      out: join(targetBuild, GEN_PREVIEW_SUBDIR, "contact_sheet.jpg"),
      columns: 4,
    });
    completedLocalStages.push("contact-sheet");
    if (!await stage4(targetDir, false)) {
      const error = new Error("target Stage 4 failed after structural materialization");
      error.cliDiagnostic = stage4.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage4");
    if (!await stage5(targetDir, false)) {
      const error = new Error("target Stage 5 failed after structural materialization");
      error.cliDiagnostic = stage5.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage5");
  }
  const receipt = {
    ...impact,
    source_version: sourceKey,
    target_version: targetKey,
    materialized_ids: verified.map((result) => result.slide_id),
    carried_review_ids: review.carried_ids,
    review_warnings: review.warnings,
    completed_local_stages: completedLocalStages,
    production_complete: impact.needs_render.length === 0 && completedLocalStages.includes("stage5"),
    generated_at: new Date().toISOString(),
  };
  const receiptPath = join(targetBuild, GEN_QA_SUBDIR, "structural_impact.json");
  writeJsonAtomic(receiptPath, receipt);
  return { ...receipt, receipt_path: receiptPath, materialization_results: results };
}

function bySlideId(entries = []) {
  return new Map(entries.map((entry) => [String(entry.slide_id || ""), entry]).filter(([id]) => id));
}

function orderedIdsFromPlan(plan) {
  return (plan.slides || []).map((slide) => String(slide.slide_id || slide.id || "")).filter(Boolean);
}

function mergeHtmlManifestEntries({ previous, produced, orderedIds, expectedFingerprints }) {
  const byId = new Map();
  for (const entry of previous?.manifest?.entries || []) {
    const id = String(entry.slide_id || "");
    if (orderedIds.includes(id) && entry.composition_variant === "effective" && entry.composition_fingerprint === expectedFingerprints.get(id)) {
      byId.set(id, entry);
    }
  }
  for (const entry of produced) byId.set(entry.slide_id, entry);
  return orderedIds.map((id) => byId.get(id)).filter(Boolean);
}

async function readHtmlManifestsForReuse(sourceDir, targetResetId) {
  const {
    HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
    HTML_PAGES_MANIFEST_SCHEMA,
    htmlOwnerRoot,
    readHtmlCurrentManifest,
  } = await import("./internal/html_object_store.mjs");
  const { inspectHtmlReviewReadiness } = await import("../shared/state/html_review_evidence.mjs");
  try {
    const sourceReadiness = inspectHtmlReviewReadiness(sourceDir);
    if (sourceReadiness.conflict) return { pages: null, finalSlides: null, reason: sourceReadiness.reason };
    const pages = readHtmlCurrentManifest(htmlOwnerRoot(sourceDir, "html-pages"), {
      expectedSchema: HTML_PAGES_MANIFEST_SCHEMA,
      publicationScope: "canonical-run",
      htmlProductionResetId: sourceReadiness.html_production_reset_id,
    });
    const finalSlides = readHtmlCurrentManifest(htmlOwnerRoot(sourceDir, "final-slides"), {
      expectedSchema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
      publicationScope: "canonical-run",
      htmlProductionResetId: sourceReadiness.html_production_reset_id,
    });
    return { pages, finalSlides, source_reset_id: sourceReadiness.html_production_reset_id, target_reset_id: targetResetId, reason: null };
  } catch (error) {
    return { pages: null, finalSlides: null, reason: error.message };
  }
}

async function publishReusableHtmlEntries({
  runDir,
  ownerKind,
  schema,
  extension,
  resetId,
  logicalRunVersion,
  operation,
  orderedIds,
  expectedFingerprints,
  entries,
}) {
  if (entries.length === 0) return null;
  const {
    acquireHtmlPublishLock,
    ensureHtmlOwnerRoot,
    publishHtmlCurrentManifest,
    readHtmlCurrentManifest,
    releaseHtmlPublishLock,
    writeHtmlObject,
  } = await import("./internal/html_object_store.mjs");
  const { canonicalJsonSha256 } = await import("../contracts/canonical_json.mjs");
  const ownerRoot = ensureHtmlOwnerRoot(runDir, ownerKind);
  const previous = readHtmlCurrentManifest(ownerRoot, {
    expectedSchema: schema,
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
  });
  const inputScopeSha256 = canonicalJsonSha256({
    operation,
    slide_ids: entries.map((entry) => entry.metadata.slide_id),
    logical_run_version: logicalRunVersion,
    html_production_reset_id: resetId,
  });
  const lock = acquireHtmlPublishLock({
    ownerRoot,
    ownerKind,
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
    inputScopeSha256,
    priorManifestSha256: previous?.sha256 ?? null,
  });
  try {
    const produced = entries.map((entry) => {
      const object = writeHtmlObject({ ownerRoot, bytes: entry.bytes, extension, ownerToken: lock.ownerToken });
      return { ...entry.metadata, path: object.path, sha256: object.sha256 };
    });
    const merged = mergeHtmlManifestEntries({ previous, produced, orderedIds, expectedFingerprints });
    return publishHtmlCurrentManifest({
      ownerRoot,
      ownerToken: lock.ownerToken,
      schema,
      publicationScope: "canonical-run",
      htmlProductionResetId: resetId,
      entries: merged,
      priorManifestSha256: previous?.sha256 ?? null,
    });
  } finally {
    releaseHtmlPublishLock(lock);
  }
}

async function publishHtmlStructuralReviewArtifacts({ runDir, plan, resetId }) {
  const {
    HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
    HTML_PAGES_MANIFEST_SCHEMA,
    htmlOwnerRoot,
    readHtmlCurrentManifest,
  } = await import("./internal/html_object_store.mjs");
  const {
    publishHtmlDeliveryContactSheet,
    publishHtmlReviewPlan,
  } = await import("./internal/html_preview.mjs");
  const pagesRoot = htmlOwnerRoot(runDir, "html-pages");
  const finalRoot = htmlOwnerRoot(runDir, "final-slides");
  const currentPages = readHtmlCurrentManifest(pagesRoot, {
    expectedSchema: HTML_PAGES_MANIFEST_SCHEMA,
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
  });
  const currentFinal = readHtmlCurrentManifest(finalRoot, {
    expectedSchema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
  });
  const pageById = bySlideId(currentPages?.manifest?.entries || []);
  const contentPlan = await publishHtmlReviewPlan({
    runDir,
    plan,
    kind: "content",
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
    logicalRunVersion: basename(runDir),
    compositionVariant: "effective",
  });
  const finalIds = new Set((currentFinal?.manifest?.entries || []).map((entry) => entry.slide_id));
  const complete = orderedIdsFromPlan(plan).every((id) => finalIds.has(id));
  const reviewComposition = {
    final_slides: (currentFinal?.manifest?.entries || []).map((entry) => ({
      slide_id: entry.slide_id,
      composition_variant: "effective",
      png_sha256: entry.sha256,
      html_sha256: entry.html_sha256,
      review_object_path: relative(runDir, join(finalRoot, ...entry.path.split("/"))).split(sep).join("/"),
      review_page_object_path: pageById.has(entry.slide_id)
        ? relative(runDir, join(pagesRoot, ...pageById.get(entry.slide_id).path.split("/"))).split(sep).join("/")
        : null,
    })),
  };
  const visualPlan = await publishHtmlReviewPlan({
    runDir,
    plan,
    composition: reviewComposition,
    kind: "visual",
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
    logicalRunVersion: basename(runDir),
    compositionVariant: "effective",
    outstanding: complete ? [] : ["incomplete-final-slide-set"],
  });
  const contactSheet = complete ? await publishHtmlDeliveryContactSheet({
    runDir,
    orderedEntries: currentFinal.manifest.entries.map((entry) => ({
      slide_id: entry.slide_id,
      path: join(finalRoot, ...entry.path.split("/")),
    })),
    publicationScope: "canonical-run",
    htmlProductionResetId: resetId,
    slot: "visual_review",
    ownerDigest: visualPlan.reviewPlan.plan_hash,
  }) : null;
  return { contentPlan, visualPlan, contactSheet, complete };
}

async function materializeHtmlStructuralVersion({ sourceDir, targetDir, rebuildLocal = true }) {
  const { validateAndBuildHtmlFirstPlan } = await import("./internal/html_slide_contract.mjs");
  const { plan: sourcePlan } = validateAndBuildHtmlFirstPlan({ runDir: sourceDir });
  if (!await stage1(targetDir, false)) {
    const error = new Error("target HTML Stage 1 failed before structural materialization");
    error.cliDiagnostic = stage1.lastFailure;
    throw error;
  }
  const root = deckRoot(targetDir);
  const sourceKey = versionKey(root, sourceDir);
  const targetKey = versionKey(root, targetDir);
  const targetBuild = generatedDir(targetDir);
  const {
    HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
    HTML_PAGES_MANIFEST_SCHEMA,
    htmlOwnerRoot,
  } = await import("./internal/html_object_store.mjs");
  const {
    buildHtmlPages,
    createCanonicalHtmlValidatedRunContext,
  } = await import("./internal/html_slide_renderer.mjs");
  const { finalSlideFingerprintV1 } = await import("../shared/identity/render_artifacts.mjs");
  const { inspectHtmlReviewReadiness } = await import("../shared/state/html_review_evidence.mjs");

  const targetContext = createCanonicalHtmlValidatedRunContext({ runDir: targetDir });
  const { plan: targetPlan } = validateAndBuildHtmlFirstPlan({ runDir: targetDir });
  const targetReadiness = inspectHtmlReviewReadiness(targetDir);
  if (targetReadiness.conflict) {
    const error = new Error(`target HTML materialization is blocked: ${targetReadiness.reason}`);
    error.cliDiagnostic = { version: 1, category: "conflict", operation: "structural-materialization", source: { path: targetDir }, reason: { kind: "html_reset_conflict" }, next: createCliNext("rerun", { default: "Resolve the HTML reset conflict, then rerun local materialization." }) };
    throw error;
  }
  const resetId = targetReadiness.html_production_reset_id;
  const pagePlan = buildHtmlPages(targetContext, { compositionVariant: "effective", dryRun: false });
  const orderedIds = orderedIdsFromPlan(targetPlan);
  const expectedFingerprints = new Map(pagePlan.pages.map((page) => [page.slide_id, page.composition_fingerprint]));
  const sourceManifests = await readHtmlManifestsForReuse(sourceDir, resetId);
  const sourcePagesById = bySlideId(sourceManifests.pages?.manifest?.entries || []);
  const sourceFinalById = bySlideId(sourceManifests.finalSlides?.manifest?.entries || []);
  const sourcePagesRoot = htmlOwnerRoot(sourceDir, "html-pages");
  const sourceFinalRoot = htmlOwnerRoot(sourceDir, "final-slides");
  const reusablePageEntries = [];
  const reusableFinalEntries = [];
  const reuseResults = [];
  const reusablePageIds = new Set();
  const reusableFinalIds = new Set();
  for (const page of pagePlan.pages) {
    const sourcePage = sourcePagesById.get(page.slide_id);
    if (sourcePage?.composition_variant === "effective" &&
      sourcePage.composition_fingerprint === page.composition_fingerprint &&
      sourcePage.html_sha256 === page.html_sha256 &&
      sourcePage.sha256 === page.html_sha256) {
      reusablePageIds.add(page.slide_id);
      reusablePageEntries.push({
        bytes: readFileSync(join(sourcePagesRoot, ...sourcePage.path.split("/"))),
        metadata: {
          slide_id: page.slide_id,
          artifact_kind: "html-page",
          composition_variant: "effective",
          html_sha256: page.html_sha256,
          composition_fingerprint: page.composition_fingerprint,
          composition_input_receipt: page.composition_input_receipt,
        },
      });
    }
    const sourceFinal = sourceFinalById.get(page.slide_id);
    if (reusablePageIds.has(page.slide_id) &&
      sourceFinal?.composition_variant === "effective" &&
      sourceFinal.composition_fingerprint === page.composition_fingerprint &&
      sourceFinal.html_sha256 === page.html_sha256) {
      reusableFinalIds.add(page.slide_id);
      reusableFinalEntries.push({
        bytes: readFileSync(join(sourceFinalRoot, ...sourceFinal.path.split("/"))),
        metadata: {
          slide_id: page.slide_id,
          artifact_kind: "final-slide",
          producer: sourceFinal.producer,
          composition_variant: "effective",
          html_sha256: page.html_sha256,
          composition_fingerprint: page.composition_fingerprint,
          composition_input_receipt: page.composition_input_receipt,
          final_slide_fingerprint: finalSlideFingerprintV1({
            producer: sourceFinal.producer,
            producerPrivateFingerprint: page.composition_fingerprint,
            byteSha256: sourceFinal.sha256,
            width: sourceFinal.width,
            height: sourceFinal.height,
            mediaProfile: sourceFinal.media_profile,
          }),
          width: sourceFinal.width,
          height: sourceFinal.height,
          media_profile: sourceFinal.media_profile,
        },
      });
    }
    reuseResults.push({
      slide_id: page.slide_id,
      html_page: reusablePageIds.has(page.slide_id) ? "reused" : "local",
      final_slide: reusableFinalIds.has(page.slide_id) ? "reused" : "local",
    });
  }

  const completedLocalStages = ["stage1"];
  const pageManifest = await publishReusableHtmlEntries({
    runDir: targetDir,
    ownerKind: "html-pages",
    schema: HTML_PAGES_MANIFEST_SCHEMA,
    extension: "html",
    resetId,
    logicalRunVersion: basename(targetDir),
    operation: "structural-html-page-reuse",
    orderedIds,
    expectedFingerprints,
    entries: reusablePageEntries,
  });
  if (pageManifest) completedLocalStages.push("stage2-html-reuse");
  const finalManifest = await publishReusableHtmlEntries({
    runDir: targetDir,
    ownerKind: "final-slides",
    schema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
    extension: "png",
    resetId,
    logicalRunVersion: basename(targetDir),
    operation: "structural-html-final-slide-reuse",
    orderedIds,
    expectedFingerprints,
    entries: reusableFinalEntries,
  });
  if (finalManifest) completedLocalStages.push("stage3-html-reuse");

  const pageMissingIds = orderedIds.filter((id) => !reusablePageIds.has(id));
  if (pageMissingIds.length > 0) {
    if (!await stage2Html(targetDir, { only: pageMissingIds.join(","), dryRun: false })) {
      const error = new Error("target HTML Stage 2 failed after structural source publication");
      error.cliDiagnostic = stage2Html.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage2-html");
  }
  const finalMissingIds = orderedIds.filter((id) => !reusableFinalIds.has(id));
  if (finalMissingIds.length > 0) {
    if (!await stage3Html(targetDir, { only: finalMissingIds.join(","), dryRun: false })) {
      const error = new Error("target HTML Stage 3 failed after structural source publication");
      error.cliDiagnostic = stage3Html.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage3-html");
  }
  const reviewArtifacts = await publishHtmlStructuralReviewArtifacts({ runDir: targetDir, plan: targetPlan, resetId });
  completedLocalStages.push("review-plans");
  if (reviewArtifacts.contactSheet) completedLocalStages.push("visual-review-contact-sheet");

  const readiness = inspectHtmlReviewReadiness(targetDir);
  const receipt = {
    schema_version: 1,
    pipeline: "html-first-v1",
    source_version: sourceKey,
    target_version: targetKey,
    renderer_calls: 0,
    remote_calls: 0,
    source_order: orderedIdsFromPlan(sourcePlan),
    target_order: orderedIds,
    needs_render: [],
    needs_local_materialization: [],
    materialized_ids: orderedIds,
    reused_html_page_ids: [...reusablePageIds],
    reused_final_slide_ids: [...reusableFinalIds],
    locally_composed_ids: orderedIds.filter((id) => !reusableFinalIds.has(id)),
    reuse_results: reuseResults,
    source_reuse_status: sourceManifests.reason ? { status: "unavailable", reason: sourceManifests.reason } : { status: "available", html_production_reset_id: sourceManifests.source_reset_id },
    review_required: !readiness.ready,
    review: {
      content_plan_hash: readiness.gates?.content?.plan?.plan_hash || reviewArtifacts.contentPlan.reviewPlan.plan_hash,
      visual_plan_hash: readiness.gates?.visual?.plan?.plan_hash || reviewArtifacts.visualPlan.reviewPlan.plan_hash,
      content_ready: Boolean(readiness.gates?.content?.ready),
      visual_ready: Boolean(readiness.gates?.visual?.ready),
    },
    completed_local_stages: completedLocalStages,
    production_complete: false,
    generated_at: new Date().toISOString(),
  };

  if (readiness.ready && rebuildLocal) {
    if (!await stage4Html(targetDir, { dryRun: false })) {
      const error = new Error("target HTML Stage 4 failed after structural review approval");
      error.cliDiagnostic = stage4Html.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage4-html");
    if (!await stage5Html(targetDir, { dryRun: false })) {
      const error = new Error("target HTML Stage 5 failed after structural review approval");
      error.cliDiagnostic = stage5Html.lastFailure;
      throw error;
    }
    completedLocalStages.push("stage5-html");
    receipt.needs_local_materialization = [];
    receipt.review_required = false;
    receipt.production_complete = true;
  }
  const receiptPath = join(targetBuild, GEN_QA_SUBDIR, "structural_impact.json");
  writeJsonAtomic(receiptPath, receipt);
  return { ...receipt, receipt_path: receiptPath };
}

/**
 * Run a stage function, handling logging consistently.
 *
 * @param {() => Promise<boolean>} fn - Async function that returns true on success.
 * @param {string} stageName - Human-readable stage name.
 * @param {boolean} dryRun - If true, print but don't execute.
 * @returns {Promise<boolean>}
 */
export async function runStage(fn, stageName, dryRun) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: ${stageName}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would execute the above stage.\n");
    return true;
  }

  try {
    const ok = await fn();
    if (ok) {
      console.log(`\n  ✓ ${stageName} completed successfully.`);
    } else {
      console.log(`\n  ✗ ${stageName} FAILED.`);
    }
    return ok;
  } catch (err) {
    console.log(`\n  ✗ ${stageName} FAILED: ${err.message}`);
    return false;
  }
}

function failStage(stageFunction, diagnostic) {
  stageFunction.lastFailure = sanitizeCliDiagnostic(diagnostic);
  return false;
}

function pipelineStageDiagnostic(stageNum, runDir, diagnostic, resolution) {
  const category = diagnostic?.category || (stageNum === 1 ? "source_validation" : "artifact");
  const action = category === "gate" ? "review"
    : category === "source_validation" ? "edit_source"
      : ["environment", "provider"].includes(category) ? "repair_environment"
        : category === "internal" ? "report_internal"
          : "repair_prerequisite";
  return sanitizeCliDiagnostic({
    version: 1,
    category,
    stage: `stage${stageNum}`,
    operation: "run-stage",
    ...(diagnostic?.subject ? { subject: diagnostic.subject } : {}),
    ...(diagnostic?.source ? { source: diagnostic.source } : { source: { path: runDir } }),
    ...(diagnostic?.reason ? { reason: diagnostic.reason } : { reason: { kind: "stage_failed" } }),
    ...(diagnostic?.lineage ? { lineage: diagnostic.lineage } : {}),
    ...(diagnostic?.issues ? { issues: diagnostic.issues } : {}),
    next: createCliNext(action, {
      requiresHuman: category === "gate",
      inspect: diagnostic?.next?.inspect || (diagnostic?.source ? [diagnostic.source] : [{ path: runDir }]),
      invocation: { program: "node", args: [__filename_main, "--run-dir", runDir, "--stage", String(stageNum), "--resolution", resolution] },
      default: category === "gate"
        ? "Stop for the named human review or approval, then rerun the selected stage."
        : category === "source_validation"
          ? "Edit the named source fields, then rerun Stage 1."
          : ["environment", "provider"].includes(category)
            ? "Repair the named environment or provider prerequisite without exposing secrets, then rerun."
            : category === "internal"
              ? "Inspect and report the framework failure before retrying."
              : `Repair or rerun the prerequisite for Stage ${stageNum}; do not edit _generated artifacts directly.`,
    }),
  });
}

// --- Stage runners -----------------------------------------------------------

/**
 * Stage 1: Parse the slide-specifications markdown to JSON specs.
 *
 * Uses the Node.js ESM port (stage1_build_inputs.mjs) programmatically.
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage1(runDir, dryRun, { beforeHtmlFirstPublish = null } = {}) {
  stage1.lastFailure = null;
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return failStage(stage1, { version: 1, category: "source_validation", stage: "stage1", operation: "find-source", source: { path: runDir }, reason: { kind: "missing_slide_specification" }, next: createCliNext("edit_source", { inspect: [{ path: runDir }], default: "Restore the slide specification source, then rerun Stage 1." }) });
  }

  console.log(`  Input: ${inputFile}`);

  const canonicalInput = join(runDir, "slide-specifications.md");
  const branchInput = existsSync(canonicalInput) ? canonicalInput : inputFile;
  if (branchInput) {
    const {
      HTML_FIRST_PIPELINE,
      probeProductionMarker,
      validateAndBuildHtmlFirstPlan,
      verifyInputReceipts,
    } = await import("./internal/html_slide_contract.mjs");
    const marker = probeProductionMarker(readFileSync(branchInput), { source: basename(branchInput) });
    if (marker.branch === "invalid") {
      return failStage(stage1, {
        version: 1,
        category: "source_validation",
        stage: "stage1",
        operation: "probe-html-first",
        source: marker.issues[0]?.source || { path: canonicalInput },
        issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })),
        next: createCliNext("edit_source", { default: "Repair leading frontmatter, then rerun Stage 1." }),
      });
    }
    if (marker.branch === HTML_FIRST_PIPELINE) {
      if (branchInput !== canonicalInput) {
        return failStage(stage1, {
          version: 1,
          category: "source_validation",
          stage: "stage1",
          operation: "select-html-first-source",
          source: { path: basename(branchInput) },
          reason: { kind: "canonical_source_missing", actual: basename(branchInput), expected: "slide-specifications.md" },
          next: createCliNext("edit_source", { default: "Restore exact slide-specifications.md and move backup copies under _scratch/." }),
        });
      }
      try {
        const { validated, plan } = validateAndBuildHtmlFirstPlan({ runDir });
        if (dryRun) {
          console.log(`  HTML-first validation passed (${plan.slides.length} slide(s)); no plan published.`);
          return true;
        }
        const planPath = join(generatedDir(runDir), GEN_SLIDE_PLAN);
        writeHtmlPlanAtomic(runDir, planPath, plan, () => {
          if (typeof beforeHtmlFirstPublish === "function") beforeHtmlFirstPublish({ validated, plan, planPath });
          verifyInputReceipts(validated.receipts, { runDir, assetCatalog: validated.assetCatalog });
        });
        console.log(`  HTML-first slide_plan: ${planPath}`);
        return true;
      } catch (error) {
        const issues = Array.isArray(error?.issues) ? error.issues : [];
        return failStage(stage1, {
          version: 1,
          category: issues.some((entry) => /asset|config|font|receipt/.test(entry.code || entry.kind || "")) ? "artifact" : "source_validation",
          stage: "stage1",
          operation: "validate-html-first",
          ...(issues[0]?.source ? { source: issues[0].source } : { source: { path: canonicalInput } }),
          ...(issues.length ? { issues: issues.map((entry) => ({ message: entry.message, subject: entry.subject, source: entry.source, reason: { kind: entry.code || entry.kind || "html_first_invalid" } })) } : { reason: { kind: "html_first_invalid" } }),
          next: createCliNext("repair_prerequisite", { default: "Repair the retained HTML-first source/control issue, then rerun Stage 1." }),
        });
      }
    }
  }

  const buildDir = generatedDir(runDir);
  if (!dryRun) {
    mkdirSync(buildDir, { recursive: true });
  }

  // Use the Node.js ESM port's parseSlides function programmatically.
  // This avoids spawning a subprocess for a stage we have natively.
  const { parseSlides, configureVisualConfig, validateSpecRecords } = await import("./internal/stage1_inputs.mjs");
  const { loadVisualConfig } = await import("../02-visual-system/index.mjs");

  const deckSystemPath = styleAsset(runDir, DECK_SYSTEM_FILE);
  const palettePath = styleAsset(runDir, COLOR_PALETTE_FILE);

  let finalRules;
  if (existsSync(deckSystemPath)) {
    finalRules = readFileSync(deckSystemPath, "utf-8").trim() + "\n";
    console.log(`  Using ${deckSystemPath} for final rules (${finalRules.length} chars)`);
  } else {
    finalRules = null;
    console.log(`  No deck_system.txt found at ${deckSystemPath}, using hardcoded defaults`);
  }

  // Load visual config to set module-level variables in stage1_build_inputs.mjs
  if (existsSync(palettePath)) {
    try {
      const config = loadVisualConfig(palettePath);
      configureVisualConfig(config);
      console.log(
        `  Visual config: ${config.canvas.width_px}x${config.canvas.height_px}, ` +
        `header=${config.header_lock.body_header_safe_zone}px (${palettePath})`
      );
    } catch (exc) {
      console.log(`  ✗ Invalid visual config: ${exc.message}`);
      return failStage(stage1, { version: 1, category: "artifact", stage: "stage1", operation: "load-visual-config", source: { path: palettePath }, reason: { kind: "invalid_visual_config" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: palettePath }], default: "Repair the visual configuration source, then rerun Stage 1." }) });
    }
  } else {
    const { DEFAULT_CONFIG } = await import("../02-visual-system/index.mjs");
    configureVisualConfig(DEFAULT_CONFIG);
  }

  // Load asset manifest if present (optional infrastructure)
  let assetManifest = null;
  try {
    const assetDir = assetsDir(runDir);
    if (existsSync(join(assetDir, 'asset-manifest.yaml'))) {
      assetManifest = loadAssetManifest(assetDir);
      const assetProblems = validateAssetManifest(assetManifest);
      if (assetProblems.length > 0) {
        console.warn(`  WARNING: asset manifest has ${assetProblems.length} issue(s):`);
        for (const p of assetProblems) console.warn(`    - ${p}`);
      }
      console.log(`  Asset manifest: ${Object.keys(assetManifest.assets || {}).length} assets registered`);
    }
  } catch (err) {
    console.warn(`  WARNING: cannot load asset manifest: ${err.message}`);
  }

  const validationErrors = validateSpecRecords([inputFile], assetManifest).filter((problem) => problem.severity === "ERROR");
  if (validationErrors.length > 0) {
    return failStage(stage1, {
      version: 1,
      category: "source_validation",
      stage: "stage1",
      operation: "validate-specs",
      source: validationErrors[0].source,
      issues: validationErrors.map(({ message, subject, source, reason, lineage }) => ({ message, subject, source, reason, lineage })),
      next: createCliNext("edit_source", { inspect: validationErrors.map(({ source }) => source), default: "Fix the retained source issues, then rerun Stage 1." }),
    });
  }

  const { plan, prompts, identity } = parseSlides([inputFile], finalRules, assetManifest);

  const planPath = join(buildDir, GEN_SLIDE_PLAN);
  const promptsDir = join(buildDir, GEN_PROMPTS_SUBDIR);
  mkdirSync(promptsDir, { recursive: true });
  const promptsPath = join(promptsDir, GEN_PROMPTS_JSON);

  writeFileSync(planPath, JSON.stringify({ ...(identity ? { identity } : {}), slides: plan }, null, 2) + "\n", "utf-8");
  writeFileSync(promptsPath, JSON.stringify({ ...(identity ? { identity } : {}), slides: prompts }, null, 2) + "\n", "utf-8");

  // One human-readable prompt file per slide
  for (const entry of prompts) {
    const mdPath = join(promptsDir, entry.prompt_twin);
    writeFileSync(
      mdPath,
      `# Prompt — ${entry.id}\n\n` +
      `> Generated by Stage 1. Do not hand-edit — edit the source ` +
      `slide-specifications.md and rerun. Machine copy: \`_prompts.json\`.\n\n` +
      `\`\`\`\n${entry.prompt}\n\`\`\`\n`,
      "utf-8"
    );
  }

  console.log(`  Parsed ${plan.length} slides`);
  console.log(`  slide_plan:  ${planPath}`);
  console.log(`  prompts:     ${promptsPath}`);
  console.log(`  per-slide:   ${promptsDir}/NN--id.prompt.md  (${prompts.length} files)`);

  return true;
}

/**
 * Stage 2: Generate images with style anchoring (in-framework Node).
 *
 * Uses scripts/04-image-production/whole-page/stage2_generate_images.mjs + make_contact_sheet.mjs.
 * Credentials: IMAGE2_API_KEY / IMAGE2_BASE_URL.
 *
 * @param {string} runDir
 * @param {string|null} [baseUrl]
 * @param {string|null} [only]
 * @param {boolean} [forceImages]
 * @param {string} [resolution]
 * @param {string} [model]
 * @param {boolean} [dryRun]
 * @param {"pilot"|"build"|"refresh"} [authorizationOperation]
 * @returns {Promise<boolean>}
 */
export async function stage2(runDir, {
  baseUrl = null,
  only = null,
  forceImages = false,
  resolution = "2k",
  model = "gpt-image-2",
  requireHeaderReview = false,
  dryRun = false,
  authorizationOperation = "build",
} = {}) {
  stage2.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const promptsFile = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
  if (!existsSync(promptsFile) && !dryRun) {
    console.log(`  ✗ ${promptsFile} not found. Run Stage 1 first.`);
    return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "load-prompts", source: { path: promptsFile }, reason: { kind: "missing_prompt_manifest" }, lineage: [{ kind: "derived", path: promptsFile, stage: "stage1" }], next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the prompt manifest, then rerun Stage 2." }) });
  }

  const styleMaster = styleAsset(runDir, STYLE_MASTER_IMAGE);
  if (!existsSync(styleMaster) && !dryRun) {
    console.log(`  ✗ ${styleMaster} not found. Generate ${STYLE_MASTER_IMAGE} first.`);
    return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "load-style-reference", source: { path: styleMaster }, reason: { kind: "missing_style_reference" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: styleMaster }], default: "Generate the style master prerequisite, then rerun Stage 2." }) });
  }

  const outDir = join(buildDir, GEN_IMAGES_SUBDIR);

  if (requireHeaderReview && !dryRun) {
    const review = await validateProductionHeaderReview(runDir, {
      resolution,
      model,
      forceImages,
    });
    if (!review.ok) {
      if (review.changed.length > 0) {
        console.log(`  ⚠ ${review.hint}`);
        console.log(`  → 执行: ${review.action}`);
      }
      return failStage(stage2, { version: 1, category: "gate", stage: "stage2", operation: "header-review", source: { path: runDir }, issues: (review.changed || []).map((change) => ({ message: "slide header review evidence is stale or missing", subject: { kind: "slide", id: change.id }, reason: { kind: "review_required" } })), next: createCliNext("review", { requiresHuman: true, inspect: [{ path: runDir }], default: "Stop for current header review evidence before production image generation." }) });
    }
  }

  /** @type {string[]} */
  let selectedIds = [];
  if (only) {
    const tokens = [];
    for (let slideId of only.split(",")) {
      slideId = slideId.trim();
      if (slideId) tokens.push(slideId);
    }
    if (tokens.length > 0) {
      try {
        const plan = JSON.parse(readFileSync(join(buildDir, GEN_SLIDE_PLAN), "utf-8"));
        selectedIds = resolveSlideIds(tokens, plan.slides || []);
      } catch (err) {
        console.log(`  ✗ --only: ${err.message}`);
        return failStage(stage2, { version: 1, category: "usage", stage: "stage2", operation: "resolve-selection", source: { path: join(buildDir, GEN_SLIDE_PLAN) }, reason: { kind: "unknown_slide_selector" }, next: createCliNext("fix_arguments", { inspect: [{ path: join(buildDir, GEN_SLIDE_PLAN) }], default: "Choose slide ids from the current slide plan, then rerun Stage 2." }) });
      }
    }
  }

  // Keep the optional CLI URL unresolved until generateOneImage reaches an
  // actual remote submit. Current-provenance reuse must not touch transport.
  const baseUrls = baseUrl ? [baseUrl] : [];

  let beforeSubmit = null;
  try {
    const { resolveRunProductionAdapter, image2AuthorizationProfileFingerprint, inspectImage2ProviderAuthorization } = await import("../shared/state/state.mjs");
    const route = resolveRunProductionAdapter(deckRoot(runDir), { runDir, purpose: "observe" });
    if (!route.ok) {
      return failStage(stage2, { version: 1, category: "gate", stage: "stage2", operation: "resolve-production-adapter", source: { path: runDir }, reason: { kind: route.code === "transition_required" ? "mode_source_mismatch" : "production_mode_unavailable" }, next: createCliNext("repair_prerequisite", { requiresHuman: route.code === "transition_required", default: "Resolve the exact production-mode identity before Image2 Stage 2." }) });
    }
    if (route.mode === "image2-only") {
      const { sha256File } = await import("../shared/identity/byte_hash.mjs");
      const profileFingerprint = image2AuthorizationProfileFingerprint({
        operation: authorizationOperation,
        profile: {
          model,
          resolution,
          size: "16:9",
          n: 1,
          style_reference_sha256: sha256File(styleMaster),
        },
      });
      beforeSubmit = async ({ selectedIds: scopedIds, maxSubmissions }) => {
        const authorization = inspectImage2ProviderAuthorization(deckRoot(runDir), {
          runDir,
          operation: authorizationOperation,
          scope: { slide_ids: scopedIds },
          profileFingerprint,
          maxSubmissions,
        });
        if (authorization.ok) return;
        const error = new Error(`Image2 provider authorization is required before submit: ${authorization.code}`);
        error.image2Authorization = authorization;
        throw error;
      };
    }
  } catch (error) {
    return failStage(stage2, { version: 1, category: "gate", stage: "stage2", operation: "authorize-provider", source: { path: runDir }, reason: { kind: "provider_authorization_unavailable" }, next: createCliNext("repair_prerequisite", { requiresHuman: true, default: "Record a current scoped Image2 provider authorization before submitting this batch." }) });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 2: Generate Images`);
  console.log(`  Generator: scripts/04-image-production/whole-page/stage2_generate_images.mjs (in-framework)`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would generate images + contact sheet.\n");
    return true;
  }

  try {
    // Load asset manifest for asset resolver (optional infrastructure)
    let assetResolver = null;
    try {
      const assetDir = assetsDir(runDir);
      const manifest = loadAssetManifest(assetDir);
      if (manifest.assets && Object.keys(manifest.assets).length > 0) {
        const capturedRunDir = runDir;
        const capturedManifest = manifest;
        assetResolver = (assetId) => resolveAssetFile(capturedRunDir, capturedManifest, assetId);
        console.log(`  Asset resolver: ${Object.keys(manifest.assets).length} assets available`);
      }
    } catch (_err) {
      // Manifest may not exist or be invalid — optional, no hard error
    }

    const { buildWholePageImageFailureDiagnostic, generateWholePageImages } = await import("../04-image-production/index.mjs");
    const result = await generateWholePageImages({
      promptJson: promptsFile,
      outDir,
      styleReference: styleMaster,
      resolution,
      model,
      only: selectedIds,
      force: !!forceImages,
      promptIsFinal: true,
      baseUrl: baseUrls,
      dryRun: false,
      assetResolver,
      beforeSubmit,
    });
    if (result.errors.length > 0) {
      console.log(`\n  ✗ Stage 2: Generate Images FAILED (${result.errors.length} error(s))`);
      return failStage(stage2, await buildWholePageImageFailureDiagnostic({ failures: result.failures, promptJson: promptsFile, outDir, styleReference: styleMaster, resolution, selectedIds: result.selectedIds }));
    }
    // Post-generation provenance check — per-slide profiles replace the old batch validateImageProvenance
    const promptData = loadJson(promptsFile);
    const selectedSet = selectedIds.length > 0 ? new Set(selectedIds) : null;
    const provenanceSlides = (promptData.slides || []).filter(
      (slide) => !selectedSet || selectedSet.has(slide.id)
    );
    const { inspectImageProvenance, readImageManifest, provenanceRepairHint } = await import("../04-image-production/index.mjs");
    const { manifest: provManifest, error: provManifestError } = readImageManifest(outDir);
    const stale = [];
    for (const slide of provenanceSlides) {
      const slideProfile = result.profiles.get(slide.id);
      if (!slideProfile) { stale.push({ slideId: slide.id, reason: "missing per-slide profile" }); continue; }
      const check = inspectImageProvenance({ slide, outDir, manifest: provManifest, manifestError: provManifestError, profile: slideProfile });
      if (!check.current) stale.push({ slideId: slide.id, reason: check.reason });
    }
    if (stale.length > 0) {
      const ids = stale.map((entry) => entry.slideId);
      console.log(
        `\n  ✗ Stage 2 provenance FAILED: ${stale.map((entry) => `${entry.slideId}: ${entry.reason}`).join("; ")}`
      );
      console.log(`  ${provenanceRepairHint(ids)}`);
      return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "validate-provenance", source: { path: promptsFile }, issues: stale.map((entry) => ({ message: "slide image provenance is stale", subject: { kind: "slide", id: entry.slideId }, source: { path: outDir }, reason: { kind: "stale_image_provenance" }, lineage: [{ kind: "derived", path: promptsFile, stage: "stage1" }, { kind: "derived", path: outDir, stage: "stage2" }] })), next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }, { path: outDir }], default: "Regenerate only the stale slide images, then rerun Stage 2 validation." }) });
    }
    console.log(`\n  ✓ Stage 2: Generate Images completed successfully.`);
  } catch (err) {
    console.log(`\n  ✗ Stage 2: Generate Images FAILED: ${err.message}`);
    return failStage(stage2, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage2", operation: "generate-images", source: { path: promptsFile }, reason: { kind: "image_generation_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }, { path: styleMaster }], default: "Repair the named Stage 2 prerequisite, then rerun." }) });
  }

  // --- Contact sheet (QA preview) ---
  const previewDir = join(buildDir, GEN_PREVIEW_SUBDIR);
  mkdirSync(previewDir, { recursive: true });
  let contactPrompts = promptsFile;
  let contactName = "contact_sheet.jpg";
  if (selectedIds.length > 0) {
    contactPrompts = join(previewDir, "_pilot_prompts.json");
    try {
      writePromptSubset(promptsFile, contactPrompts, selectedIds);
    } catch (exc) {
      console.log(`  ✗ Cannot build pilot contact sheet; ${exc.message}`);
      return failStage(stage2, { version: 1, category: "artifact", stage: "stage2", operation: "build-contact-selection", source: { path: promptsFile }, reason: { kind: "invalid_prompt_selection" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: promptsFile }], default: "Rerun Stage 1 and select current slide ids before rebuilding the contact sheet." }) });
    }
    contactName = "pilot_contact_sheet.jpg";
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 2 QA: Contact Sheet`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    const { buildWholePageContactSheet } = await import("../04-image-production/index.mjs");
    await buildWholePageContactSheet({
      imageDir: outDir,
      promptJson: contactPrompts,
      out: join(previewDir, contactName),
      columns: 4,
    });
    console.log(`\n  ✓ Stage 2 QA: Contact Sheet completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 2 QA: Contact Sheet FAILED: ${err.message}`);
    return failStage(stage2, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "contact-sheet", operation: "compose", source: { path: contactPrompts }, reason: { kind: "contact_sheet_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: contactPrompts }, { path: outDir }], default: "Repair the selected image prerequisites, then regenerate the contact sheet." }) });
  }
}

/**
 * Stage 3: Lock headers (Node @napi-rs/canvas text overlay).
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage3(runDir, dryRun) {
  stage3.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_image_directory" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 2 to recreate slide images, then rerun Stage 3." }) });
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 2 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_images" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 2 to recreate slide images, then rerun Stage 3." }) });
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return failStage(stage3, { version: 1, category: "artifact", stage: "stage3", operation: "load-slide-plan", source: { path: slidePlan }, reason: { kind: "missing_slide_plan" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 3." }) });
    }

    const planData = loadJson(slidePlan);
    const expected = (planData.slides || []).length;
    const actual = pngs.length;
    if (actual < expected) {
      console.log(`  ⚠  Image count mismatch: ${actual} images found, ${expected} slides expected.`);
      console.log(`  Stage 2 likely failed partway — re-run --stage 2 to generate the missing images.`);
      console.log(`  Stage 3 will abort (not build a partial deck) until every slide has an image.`);
    }
  }

  const outDir = join(buildDir, GEN_HEADER_LOCKED_SUBDIR);
  if (!dryRun) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 3: Lock Headers`);
  console.log(`  Output: ${outDir}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would lock headers.\n");
    return true;
  }

  try {
    const { lockWholePageHeaders } = await import("../04-image-production/index.mjs");
    await lockWholePageHeaders({
      images: imagesDir,
      slidePlan,
      out: outDir,
      colorPalette: styleAsset(runDir, COLOR_PALETTE_FILE),
    });
    console.log(`\n  ✓ Stage 3: Lock Headers completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 3: Lock Headers FAILED: ${err.message}`);
    return failStage(stage3, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage3", operation: "lock-headers", source: { path: slidePlan }, reason: { kind: "header_lock_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }, { path: imagesDir }], default: "Repair Stage 1/2 prerequisites, then rerun Stage 3." }) });
  }
}

/** HTML-first local Stage 2 adapter. Provider credentials and legacy paths are never resolved. */
export async function stage2Html(runDir, { only = null, compositionVariant = 'effective', dryRun = false } = {}) {
  stage2Html.lastFailure = null;
  try {
    const { createCanonicalHtmlValidatedRunContext, buildHtmlPages, publishHtmlPages, resolveHtmlSlideSelectors } = await import('./internal/html_slide_renderer.mjs');
    const context = createCanonicalHtmlValidatedRunContext({ runDir });
    const tokens = only ? String(only).split(',').map((token) => token.trim()).filter(Boolean) : [];
    const request = { ...(tokens.length ? { slideIds: resolveHtmlSlideSelectors(context, tokens) } : {}), compositionVariant, dryRun };
    const result = dryRun ? buildHtmlPages(context, request) : await publishHtmlPages(context, request);
    console.log(`  HTML Stage 2: ${result.pages.length} page(s) ${dryRun ? 'planned' : 'published locally'}`);
    return true;
  } catch (error) {
    stage2Html.lastFailure = diagnosticFromError(error) || { version: 1, category: 'artifact', stage: 'stage2', operation: 'render-html', reason: { kind: 'html_render_failed' }, next: createCliNext('repair_prerequisite', { default: 'Repair the local structured source/runtime, then rerun HTML Stage 2.' }) };
    return false;
  }
}

/** HTML-first local Stage 3 adapter. */
export async function stage3Html(runDir, { only = null, compositionVariant = 'effective', dryRun = false } = {}) {
  stage3Html.lastFailure = null;
  try {
    const { createCanonicalHtmlValidatedRunContext, composeHtmlSlidesVerified, publishHtmlFinalSlides, resolveHtmlSlideSelectors } = await import('./internal/html_slide_renderer.mjs');
    const context = createCanonicalHtmlValidatedRunContext({ runDir });
    const tokens = only ? String(only).split(',').map((token) => token.trim()).filter(Boolean) : [];
    const request = { ...(tokens.length ? { slideIds: resolveHtmlSlideSelectors(context, tokens) } : {}), compositionVariant, dryRun };
    const result = dryRun ? await composeHtmlSlidesVerified(context, request) : await publishHtmlFinalSlides(context, request);
    console.log(`  HTML Stage 3: ${result.final_slides.length} final slide(s) ${dryRun ? 'planned' : 'verified locally'}`);
    return true;
  } catch (error) {
    stage3Html.lastFailure = diagnosticFromError(error) || { version: 1, category: 'artifact', stage: 'stage3', operation: 'compose-html', reason: { kind: 'html_composition_failed' }, next: createCliNext('repair_prerequisite', { default: 'Repair the local HTML page/runtime evidence, then rerun HTML Stage 3.' }) };
    return false;
  }
}

export async function stage4Html(runDir, { dryRun = false } = {}) {
  stage4Html.lastFailure = null;
  try {
    if (dryRun) { console.log('  HTML Stage 4: provider-neutral assembly planned (no PPTX write)'); return true; }
    const { buildPresentation } = await import('./index.mjs');
    const result = await buildPresentation(runDir);
    console.log(`  HTML Stage 4: PPTX ${result.outPath}`);
    return true;
  } catch (error) {
    stage4Html.lastFailure = diagnosticFromError(error) || { version: 1, category: 'artifact', stage: 'stage4', operation: 'assemble-html', reason: { kind: 'html_assembly_failed' }, next: createCliNext('repair_prerequisite', { default: 'Repair current HTML final-slide evidence, then rerun Stage 4.' }) };
    return false;
  }
}

export async function stage5Html(runDir, { dryRun = false } = {}) {
  stage5Html.lastFailure = null;
  try {
    if (dryRun) { console.log('  HTML Stage 5: notes injection planned (no PPTX/receipt write)'); return true; }
    const { injectSpeakerNotes } = await import('./index.mjs');
    const result = await injectSpeakerNotes(runDir);
    console.log(`  HTML Stage 5: notes injected ${result.notesInjected}/${result.slideCount}`);
    return true;
  } catch (error) {
    stage5Html.lastFailure = diagnosticFromError(error) || { version: 1, category: 'artifact', stage: 'stage5', operation: 'inject-html-notes', reason: { kind: 'html_notes_failed' }, next: createCliNext('repair_prerequisite', { default: 'Repair current HTML PPTX/source lineage, then rerun Stage 5.' }) };
    return false;
  }
}

/**
 * Stage 4: Build PPTX container.
 *
 * Uses stage4_build_pptx.mjs programmatically (Node / pptxgenjs).
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage4(runDir, dryRun) {
  stage4.lastFailure = null;
  const buildDir = generatedDir(runDir);
  const imagesDir = join(buildDir, GEN_HEADER_LOCKED_SUBDIR);
  const slidePlan = join(buildDir, GEN_SLIDE_PLAN);

  if (!dryRun) {
    if (!existsSync(imagesDir)) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_header_locked_directory" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 3 to recreate header-locked images, then rerun Stage 4." }) });
    }
    const pngs = existsSync(imagesDir)
      ? readdirSync(imagesDir).filter((f) => f.endsWith(".png"))
      : [];
    if (pngs.length === 0) {
      console.log(`  ✗ No images found in ${imagesDir}. Run Stage 3 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-images", source: { path: imagesDir }, reason: { kind: "missing_header_locked_images" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }], default: "Rerun Stage 3 to recreate header-locked images, then rerun Stage 4." }) });
    }
    if (!existsSync(slidePlan)) {
      console.log(`  ✗ ${slidePlan} not found. Run Stage 1 first.`);
      return failStage(stage4, { version: 1, category: "artifact", stage: "stage4", operation: "load-slide-plan", source: { path: slidePlan }, reason: { kind: "missing_slide_plan" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: runDir }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 4." }) });
    }
    const review = await validateProductionHeaderReview(runDir, { requireCurrentImages: true });
    if (!review.ok) {
      if (review.changed.length > 0) {
        console.log(`  ⚠ ${review.hint}`);
        console.log(`  → 执行: ${review.action}`);
      }
      return failStage(stage4, { version: 1, category: "gate", stage: "stage4", operation: "header-review", source: { path: runDir }, issues: (review.changed || []).map((change) => ({ message: "slide header review evidence is stale or missing", subject: { kind: "slide", id: change.id }, reason: { kind: "review_required" } })), next: createCliNext("review", { requiresHuman: true, inspect: [{ path: runDir }], default: "Stop for current header review evidence before assembling the PPTX." }) });
    }
  }

  const pptDir = join(buildDir, GEN_PPT_SUBDIR);
  if (!dryRun) {
    mkdirSync(pptDir, { recursive: true });
  }

  // Deck name derives from the DECK ROOT (deck_mypitch/3_versions/v1 -> "mypitch"),
  // NOT runDir.parent (which is "3_versions"). See bundle_layout.deckName.
  const name = deckName(runDir);
  const pptxPath = join(pptDir, `${name}.pptx`);
  const title = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Stage: Stage 4: Build PPTX`);
  console.log(`  Output: ${pptxPath}`);
  console.log(`  Title: ${title}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log("  [DRY RUN] Would build the PPTX.\n");
    return true;
  }

  try {
    const { buildWholePagePresentation } = await import("../04-image-production/index.mjs");
    await buildWholePagePresentation({ runDir, images: imagesDir, slidePlan, out: pptxPath, title });
    console.log(`\n  ✓ Stage 4: Build PPTX completed successfully.`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 4: Build PPTX FAILED: ${err.message}`);
    return failStage(stage4, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage4", operation: "build-pptx", source: { path: slidePlan }, reason: { kind: "pptx_build_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: slidePlan }, { path: imagesDir }], default: "Repair Stage 3 outputs, then rerun Stage 4." }) });
  }
}

export async function validateProductionHeaderReview(runDir, {
  resolution = null,
  model = null,
  forceImages = false,
  requireCurrentImages = false,
  onlyIds = null,
} = {}) {
  const buildDir = generatedDir(runDir);
  const planPath = join(buildDir, GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) {
    return { format: 2, applicable: true, ok: false, changed: [],
      action: null, hint: "slide plan missing — run Stage 1 first" };
  }
  const slides = loadJson(planPath).slides || [];
  const palettePath = styleAsset(runDir, COLOR_PALETTE_FILE);
  const { loadVisualConfig, DEFAULT_CONFIG } = await import("../02-visual-system/index.mjs");
  const visualConfig = existsSync(palettePath) ? loadVisualConfig(palettePath) : DEFAULT_CONFIG;
  const {
    buildHeaderReviewInputs,
    HEADER_REVIEW_NODE,
    validateHeaderReviewRecord,
    versionKey,
  } = await import("../04-image-production/index.mjs");
  const inputs = buildHeaderReviewInputs(slides, visualConfig);
  const root = deckRoot(runDir);
  const { readState } = await import("../shared/state/state.mjs");
  const state = readState(root);
  const key = versionKey(root, runDir);
  const record = state.nodes?.[HEADER_REVIEW_NODE]?.by_version?.[key] || null;
  let targetProfile = null;
  const profileResolution = resolution || record?.generation_profile?.resolution || null;
  const profileModel = model || record?.generation_profile?.model || null;
  if (profileResolution && profileModel) {
    const { generationProfile } = await import("../04-image-production/index.mjs");
    const { sha256File } = await import("../shared/identity/byte_hash.mjs");
    const styleMaster = styleAsset(runDir, STYLE_MASTER_IMAGE);
    targetProfile = generationProfile({
      styleReferenceSha256: sha256File(styleMaster),
      resolution: profileResolution,
      model: profileModel,
      semanticOptions: { size: "16:9", n: 1 },
    });
  }
  const result = validateHeaderReviewRecord({
    record,
    inputs,
    imagesDir: join(buildDir, GEN_IMAGES_SUBDIR),
    targetProfile,
    onlyIds,
  });

  // Stage 4: per-slide image integrity check
  if (requireCurrentImages && result.ok) {
    const promptsPath = join(buildDir, GEN_PROMPTS_SUBDIR, GEN_PROMPTS_JSON);
    const prompts = existsSync(promptsPath) ? loadJson(promptsPath).slides || [] : [];
    const promptById = new Map(prompts.map((slide) => [slide.id, slide]));
    const { generationFingerprint, readImageManifest } = await import("../04-image-production/index.mjs");
    const { sha256File } = await import("../shared/identity/byte_hash.mjs");
    const imagesDir = join(buildDir, GEN_IMAGES_SUBDIR);
    const { manifest, error: manifestError } = readImageManifest(imagesDir);
    const imageChanged = [];
    if (manifestError) {
      imageChanged.push({ id: "_manifest", field: "image", was: null, now: null });
    }
    const checkIds = onlyIds && onlyIds.length > 0
      ? onlyIds.filter((id) => inputs.fullPageIds.includes(id))
      : inputs.fullPageIds;
    for (const id of checkIds) {
      const prompt = promptById.get(id);
      const entry = manifest?.slides?.[id];
      if (!prompt || !entry) {
        imageChanged.push({ id, field: "image", was: null, now: null });
        continue;
      }
      const expected = generationFingerprint({
        prompt: String(prompt.prompt || "").trim(),
        profile: entry.generation_profile,
      });
      if (entry.generation_fingerprint !== expected) {
        imageChanged.push({ id, field: "image", was: null, now: null });
        continue;
      }
      const imagePath = join(imagesDir, entry.output);
      if (!existsSync(imagePath) || sha256File(imagePath) !== entry.image_sha256) {
        imageChanged.push({ id, field: "image", was: null, now: null });
      }
    }
    if (imageChanged.length > 0) {
      const changedIds = [...new Set(imageChanged.map((c) => c.id))];
      return {
        format: 2, applicable: true, ok: false,
        changed: imageChanged,
        action: changedIds.length <= 5
          ? `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build "{runDir}" --force-images --only ${changedIds.join(",")}`
          : `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build "{runDir}" --force-images`,
        hint: `${imageChanged.length} 张图片需重新生成，跑 --force-images 后 pilot 确认`,
      };
    }
  }

  // forceImages overwrite warning — not a hard block, just inform
  if (forceImages && record?.slides) {
    const reviewedIds = Object.entries(record.slides)
      .filter(([, s]) => s && s.status === "reviewed")
      .map(([id]) => id);
    if (reviewedIds.length > 0) {
      result.hint = (result.hint || "") + ` (注意: ${reviewedIds.length} 页已 review 的图片将被覆盖)`;
    }
  }

  return result;
}

/**
 * Stage 5: Inject speaker notes into PPTX.
 *
 * Uses the Node.js ESM port (stage5_inject_notes.mjs) programmatically.
 *
 * @param {string} runDir
 * @param {boolean} dryRun
 * @returns {Promise<boolean>}
 */
export async function stage5(runDir, dryRun) {
  stage5.lastFailure = null;
  const pptDir = join(generatedDir(runDir), GEN_PPT_SUBDIR);

  // Speaker notes come from the per-slide spec markdown (in the version dir).
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    console.log(`  ✗ No ${SLIDE_SPECS_GLOB} found in ${runDir}`);
    return failStage(stage5, { version: 1, category: "source_validation", stage: "stage5", operation: "find-notes-source", source: { path: runDir }, reason: { kind: "missing_notes_source" }, next: createCliNext("edit_source", { inspect: [{ path: runDir }], default: "Restore the slide specification source with speaker notes, then rerun Stage 5." }) });
  }

  if (dryRun) {
    // Nothing generated yet during a dry run; show the intended target.
    const pptxFile = join(pptDir, "<deck_name>.pptx");
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  Stage: Stage 5: Inject Notes`);
    console.log(`  PPTX: ${pptxFile}`);
    console.log(`  Input: ${inputFile}`);
    console.log(`${"=".repeat(60)}\n`);
    console.log("  [DRY RUN] Would inject notes.\n");
    return true;
  }

  try {
    const { injectWholePageSpeakerNotes } = await import("./index.mjs");
    const result = await injectWholePageSpeakerNotes(runDir);

    console.log(`\n  ✓ Stage 5: Inject Notes completed successfully.`);
    console.log(`  Notes injected: ${result.notesInjected}/${result.slideCount} slides`);
    console.log(`  Receipt: ${join(generatedDir(runDir), GEN_QA_SUBDIR, "notes_injection.json")}`);
    return true;
  } catch (err) {
    console.log(`\n  ✗ Stage 5: Inject Notes FAILED: ${err.message}`);
    return failStage(stage5, diagnosticFromError(err) || { version: 1, category: "artifact", stage: "stage5", operation: "inject-notes", source: { path: inputFile }, reason: { kind: "notes_injection_failed" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }, { path: pptDir }], default: "Repair the source notes or Stage 4 PPTX prerequisite, then rerun Stage 5." }) });
  }
}

// --- Bundle validation -------------------------------------------------------

/**
 * Enforce the run-bundle constitution before doing anything.
 *
 * Delegates to bundle_layout.checkBundle (the single enforcement point). Any
 * deviation from the canonical structure aborts the run. `mode` selects
 * structure | preview (style master) | pipeline (style master + gates).
 *
 * @param {string} runDir
 * @param {boolean|string} [mode=true] - readiness mode (bool aliases kept).
 * @returns {boolean} true if valid.
 */
export function validateRunDir(runDir, mode = true) {
  const violations = checkBundle(resolve(runDir), mode);
  if (violations.length > 0) {
    console.log(`  ✗ Bundle does NOT conform to the structure (宪法) — ${violations.length} violation(s):`);
    for (const v of violations) {
      console.log(`      - ${v}`);
    }
    console.log("  The directory structure is the constitution. Fix the above, then rerun.");
    console.log("  Canonical structure:  node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs");
    return false;
  }
  return true;
}

// --- Credentials loading -----------------------------------------------------

/**
 * Load .env credentials and walk CWD parents into a flat array.
 * @param {string} dkRoot - Deck root path.
 * @returns {string[]} Array of directories to search for .env.
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

// --- Main --------------------------------------------------------------------

async function main() {
  const program = new Command();

  program
    .name("unified_pipeline.mjs")
    .description("Unified PPT production pipeline for _ppt_framework")
    .addHelpText("after", `
Examples:
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage all
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage 2 --only slide_05
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage all --dry-run
  unified_pipeline.mjs --run-dir deck_mypitch/3_versions/v1 --stage 5
    `)
    .requiredOption("--run-dir <path>", "Path to a version dir (e.g., deck_xxx/3_versions/v1)")
    .requiredOption("--stage <stages>", "Stage to run: all, 1, 2, 3, 4, 5, or comma-separated (e.g., 1,3,4)")
    .option("--base-url <url>", "Override API base URL for Stage 2")
    .option("--only <ids>", "Only process specific slide IDs (Stage 2, comma-separated)")
    .option("--force-images", "Regenerate all selected Stage-2 images even if files exist")
    .option("--preview", "Stage-2 readiness: style master only (skip metadata gate check)")
    .option("--resolution <res>", "Stage-2 image resolution (default: 2k; use 1k for pilots)", "2k")
    .option("--model <name>", "Stage-2 image model", "gpt-image-2")
    .option("--dry-run", "Print what would be executed without running")
    .action(async (opts) => {
      const runDir = resolve(opts.runDir);

      // Parse stages first — the structure gate only needs to require the Phase-2
      // Stage-2 assets and human gate decisions only when Stage 2 is in the run.
      /** @type {number[]} */
      let stages;
      if (opts.stage === "all") {
        stages = [1, 2, 3, 4, 5];
      } else {
        stages = opts.stage.split(",").map((s) => {
          const n = parseInt(s.trim(), 10);
          if (![1, 2, 3, 4, 5].includes(n)) {
            console.log(`  ✗ Invalid stage: ${s.trim()}. Must be 1-5.`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Pipeline stage selection must contain only stages 1 through 5.", hint: "Use all or a comma-separated subset of 1,2,3,4,5.", where: "unified_pipeline.arguments.stage", diagnostic: { version: 1, category: "usage", operation: "parse-stages", reason: { kind: "invalid_stage" }, next: createCliNext("fix_arguments", { default: "Correct --stage to all or valid stage numbers, then rerun." }) } });
            process.exit(1);
          }
          return n;
        });
      }

      // Validate resolution
      if (opts.resolution && !["1k", "2k", "4k"].includes(opts.resolution)) {
        console.log(`  ✗ Invalid resolution: ${opts.resolution}. Must be 1k, 2k, or 4k.`);
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Pipeline resolution must be 1k, 2k, or 4k.", hint: "Choose a supported image resolution.", where: "unified_pipeline.arguments.resolution", diagnostic: { version: 1, category: "usage", operation: "parse-resolution", reason: { kind: "invalid_enum", expected: ["1k", "2k", "4k"] }, next: createCliNext("fix_arguments", { default: "Correct --resolution, then rerun the selected stages." }) } });
        process.exit(1);
      }

      const canonicalSource = join(runDir, "slide-specifications.md");
      const sourceCandidate = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(runDir);
      let sourceMarker = null;
      if (sourceCandidate) {
        const { probeProductionMarker } = await import("./internal/html_slide_contract.mjs");
        const marker = probeProductionMarker(readFileSync(sourceCandidate), { source: basename(sourceCandidate) });
        if (marker.branch === "invalid") {
          emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Leading source frontmatter is invalid.", hint: "Repair the canonical source marker, then rerun.", where: "unified_pipeline.probe-html-first", diagnostic: { version: 1, category: "source_validation", operation: "probe-html-first", source: marker.issues[0]?.source || { path: "slide-specifications.md" }, issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })), next: createCliNext("edit_source", { default: "Repair leading frontmatter before readiness or stage execution." }) } });
          process.exit(1);
        }
        if (marker.branch === HTML_FIRST_PIPELINE && sourceCandidate !== canonicalSource) {
          emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "HTML-first requires the canonical source filename.", hint: "Restore slide-specifications.md and move backup copies under _scratch/.", where: "unified_pipeline.select-html-first-source", diagnostic: { version: 1, category: "source_validation", operation: "select-html-first-source", source: { path: basename(sourceCandidate) }, reason: { kind: "canonical_source_missing", actual: basename(sourceCandidate), expected: "slide-specifications.md" }, next: createCliNext("edit_source", { default: "Restore exact slide-specifications.md before readiness or stage execution." }) } });
          process.exit(1);
        }
        sourceMarker = marker;
      }

      const route = resolveRunProductionAdapter(deckRoot(runDir), { runDir, purpose: "observe" });
      if (!route.ok) {
        emitCliError({
          code: CLI_ERROR_CODES.FAILED,
          message: `Production adapter cannot resolve the exact run identity: ${route.code}.`,
          hint: route.code === "transition_required"
            ? "Resolve the mode/source mismatch through the versioned transition path before running stages."
            : "Initialize a fresh current run or register the exact current production mode before running stages.",
          where: "unified_pipeline.production-adapter",
          diagnostic: {
            version: 1,
            category: "gate",
            operation: "resolve-production-adapter",
            source: { path: runDir },
            reason: { kind: route.code === "transition_required" ? "mode_source_mismatch" : "production_mode_unavailable" },
            next: createCliNext("repair_prerequisite", {
              requiresHuman: route.code === "transition_required",
              default: "Resolve the exact production-mode identity before stage dispatch.",
            }),
          },
        });
        process.exit(1);
      }

      const htmlFirst = route.adapter === "html";
      if (sourceMarker) {
        if (htmlFirst !== (sourceMarker.branch === HTML_FIRST_PIPELINE)) {
          emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "The verified production adapter and source marker disagree.", hint: "Repair the mode/source relationship before running any stage.", where: "unified_pipeline.production-adapter", diagnostic: { version: 1, category: "gate", operation: "verify-production-adapter", source: { path: basename(sourceCandidate) }, reason: { kind: "mode_source_mismatch" }, next: createCliNext("repair_prerequisite", { requiresHuman: true, default: "Repair the exact run's production-mode and source relationship before stage dispatch." }) } });
          process.exit(1);
        }
      }

      if (htmlFirst && (process.argv.includes('--base-url') || process.argv.includes('--force-images') || process.argv.includes('--model') || process.argv.includes('--resolution'))) {
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: 'HTML-first local stages do not accept whole-page provider or image controls.', hint: 'Remove provider/resolution/force flags and use the canonical local HTML branch.', where: 'unified_pipeline.html-first.arguments', diagnostic: { version: 1, category: 'usage', reason: { kind: 'html_whole_page_option_forbidden' }, next: createCliNext('fix_arguments', { default: 'Use only --run-dir, --stage, --only, --dry-run, and --preview for HTML-first.' }) } });
        process.exit(1);
      }

      // Whole-page production keeps the provider dotenv search. HTML-first Stage 1
      // deliberately avoids provider/prerequisite setup.
      const dkRoot = deckRoot(runDir);
      if (!htmlFirst) {
        const searchDirs = buildEnvSearchDirs(dkRoot);
        const envLoaded = loadDotenv(...searchDirs);
        if (envLoaded) console.log(`Loaded credentials from ${envLoaded}`);
      }

      /** @type {boolean|string} */
      let readyMode = false;
      if (stages.includes(2) && !htmlFirst) {
        readyMode = opts.preview ? "preview" : "pipeline";
      }
      if (!validateRunDir(runDir, readyMode)) {
        emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Run-bundle structure or readiness checks block the selected pipeline stages.", hint: "Repair the named run-bundle source or gate prerequisite, then rerun.", where: "unified_pipeline.validate-run-dir", diagnostic: { version: 1, category: readyMode ? "gate" : "structure", operation: "validate-run-dir", source: { path: runDir }, next: createCliNext(readyMode ? "review" : "edit_source", { requiresHuman: !!readyMode, inspect: [{ path: runDir }], default: readyMode ? "Review and resolve the required production gates before continuing." : "Repair the run-bundle source structure, then rerun the pipeline." }) } });
        process.exit(1);
      }

      console.log(`Pipeline: ${runDir}`);
      console.log(`Stages: ${stages.join(",")}`);
      if (opts.dryRun) {
        console.log("Mode: DRY RUN (no execution)");
      }
      console.log();

      // Max stage validation — stages must be sequential from the current run.
      // We don't validate here since partial chains (1,3,4,5) are valid editing chains.

      if (!opts.preview && !stages.includes(1) && (stages.includes(2) || stages.includes(4))) {
        const refreshed = await stage1(runDir, opts.dryRun);
        if (!refreshed) {
          console.log("\n  Pipeline stopped while refreshing Stage 1 for header review.");
          emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Stage 1 refresh failed before header review.", hint: "Repair the slide specification source, then rerun the requested chain.", where: "unified_pipeline.header-review-refresh", diagnostic: pipelineStageDiagnostic(1, runDir, stage1.lastFailure, opts.resolution) });
          process.exit(1);
        }
      }

      // Stage dispatch table
      const image2Operation = ["pilot", "build", "refresh"].includes(process.env.PPTMAKER_IMAGE2_OPERATION)
        ? process.env.PPTMAKER_IMAGE2_OPERATION
        : opts.preview ? "pilot" : "build";
      const stageImplementations = { 1: stage1, 2: htmlFirst ? stage2Html : stage2, 3: htmlFirst ? stage3Html : stage3, 4: htmlFirst ? stage4Html : stage4, 5: htmlFirst ? stage5Html : stage5 };
      const stageFuncs = {
        1: () => stage1(runDir, opts.dryRun),
        2: () => htmlFirst ? stage2Html(runDir, { only: opts.only || null, dryRun: opts.dryRun }) : stage2(runDir, {
          baseUrl: opts.baseUrl || null,
          only: opts.only || null,
          forceImages: opts.forceImages || false,
          resolution: opts.resolution || "2k",
          model: opts.model || "gpt-image-2",
          requireHeaderReview: !opts.preview,
          dryRun: opts.dryRun,
          authorizationOperation: image2Operation,
        }),
        3: () => htmlFirst ? stage3Html(runDir, { only: opts.only || null, dryRun: opts.dryRun }) : stage3(runDir, opts.dryRun),
        4: () => htmlFirst ? stage4Html(runDir, { dryRun: opts.dryRun }) : stage4(runDir, opts.dryRun),
        5: () => htmlFirst ? stage5Html(runDir, { dryRun: opts.dryRun }) : stage5(runDir, opts.dryRun),
      };

      for (const stageNum of stages) {
        emitCliProgress("stage_start", { stage: `stage${stageNum}` });
        let success;
        try {
          success = await stageFuncs[stageNum]();
        } catch (err) {
          stageImplementations[stageNum].lastFailure = diagnosticFromError(err) || sanitizeCliDiagnostic({
            version: 1,
            category: "internal",
            stage: `stage${stageNum}`,
            operation: "run-stage",
            source: { path: runDir },
            reason: { kind: "unexpected_stage_exception" },
            next: createCliNext("report_internal", { inspect: [{ path: runDir }], default: "Inspect and report the unexpected Stage failure before retrying." }),
          });
          success = false;
        }
        if (!success) {
          console.log(`\n  Pipeline stopped at Stage ${stageNum}.`);
          console.log(`  Fix the issue above and re-run with: --stage ${stageNum}`);
          emitCliError({
            code: CLI_ERROR_CODES.FAILED,
            message: `Pipeline stopped because Stage ${stageNum} failed.`,
            hint: "Inspect the stage-specific source and artifact lineage, then rerun the smallest safe chain.",
            where: `unified_pipeline.stage${stageNum}`,
            diagnostic: pipelineStageDiagnostic(stageNum, runDir, stageImplementations[stageNum].lastFailure, opts.resolution),
          });
          process.exit(1);
        }
        emitCliProgress("stage_complete", { stage: `stage${stageNum}` });
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`  Pipeline complete. Output: ${join(generatedDir(runDir), GEN_PPT_SUBDIR)}`);
      console.log(`${"=".repeat(60)}`);
    });

  await program.parseAsync(process.argv);
}

// Run when executed directly (not imported)
const __filename_main = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename_main ||
    process.argv[1]?.endsWith("/unified_pipeline.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "unified_pipeline" });
  main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    emitCliError({ code: CLI_ERROR_CODES.UNCAUGHT, message: "The unified pipeline failed unexpectedly.", hint: "Inspect the orchestrator command location and report the framework failure.", where: "unified_pipeline.main", diagnostic: { version: 1, category: "internal", operation: "run-pipeline", next: createCliNext("report_internal", { default: "Inspect unified_pipeline.mjs without relying on captured exception prose, then report the defect." }) } });
    process.exit(1);
  });
}
