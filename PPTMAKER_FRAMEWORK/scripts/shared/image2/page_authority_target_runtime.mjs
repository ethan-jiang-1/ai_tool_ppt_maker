/**
 * Opaque v2 raw-artifact runtime.
 *
 * This module owns only byte persistence, provider authorization/review
 * mechanics, and bindings between already-selected workflow artifacts.  It
 * deliberately receives workflow-specific compilation and finalization from
 * the selected adapter rather than interpreting Framed/Pure semantics here.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  createAcceptedRawEvidence,
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "./page_authority_artifacts.mjs";
import {
  publishAcceptedRawEvidence,
  submitAuthorizedRawWorkPlan,
} from "./page_authority_raw_mechanics.mjs";
import {
  deckRoot,
  pageAuthorityImage2Paths,
  SLIDE_SPECS_NAME,
} from "../run-bundle/bundle_layout.mjs";
import {
  advanceTargetPageAuthoritySourceEpoch,
  initializeTargetPageAuthorityState,
  recordPageAuthorityRawProviderAuthorization,
  recordTargetAcceptedRawEvidence,
  recordTargetDeliveryReceipt,
  recordTargetFinalManifest,
  rebindTargetAcceptedRawEvidenceForLocalCompose,
  validateTargetAcceptedRawEvidenceLocalComposeRebind,
} from "../state/state.mjs";

export const TARGET_RAW_REVIEW_SCHEMA = "page-authority-target-raw-review-v1";
export const TARGET_RAW_CONTRACT_SCHEMA = "page-authority-target-raw-contract-v1";
export const TARGET_RAW_PROVIDER_REQUEST_SCHEMA = "page-authority-target-raw-provider-request-v1";
export const TARGET_STYLE_MASTER_RELATIVE_PATH = "2_backbone/visual-style/style_master.jpg";

export class PageAuthorityTargetRuntimeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityTargetRuntimeError";
    this.code = code;
  }
}

const SHA256_RE = /^[0-9a-f]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function asBytes(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_bytes_invalid", `${label} must be nonempty bytes`);
  }
  const bytes = Buffer.from(value);
  if (bytes.length === 0) throw new PageAuthorityTargetRuntimeError("target_raw_bytes_invalid", `${label} must be nonempty bytes`);
  return bytes;
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.tmp`);
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
}

function writeJson(path, value) {
  const bytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
  atomicWrite(path, bytes);
  return sha256(bytes);
}

function readJson(path, code, message) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new PageAuthorityTargetRuntimeError(code, message);
  }
}

function requireSourceReceipt(receipt, workflow) {
  if (!receipt || receipt.schema !== "page-authority-image2-source-v2" ||
    receipt.pipeline !== "page-authority-image2-v2" || receipt.workflow !== workflow ||
    !SHA256_RE.test(receipt.source_sha256 || "") || !Array.isArray(receipt.slides) || receipt.slides.length === 0 ||
    receipt.slides.some((slide) => !slide || slide.workflow !== workflow || typeof slide.slide_id !== "string" || !slide.slide_id)) {
    throw new PageAuthorityTargetRuntimeError("target_source_receipt_invalid", "the selected target workflow requires its exact current source receipt");
  }
  return receipt;
}

function requireTargetPlan(plan, receipt, workflow) {
  const checked = validateRawWorkPlan(plan);
  if (!checked.ok || plan.workflow !== workflow || plan.source_receipt_sha256 !== receipt.source_sha256) {
    throw new PageAuthorityTargetRuntimeError(checked.code || "target_raw_plan_invalid", "the selected workflow raw plan is invalid or stale");
  }
  return checked;
}

/**
 * Return a workflow-opaque receipt fingerprint for operations whose only
 * source-owned delta is delivery metadata such as speaker notes. Diagnostic
 * byte spans deliberately do not participate: changing an earlier note moves
 * later spans without changing any pixel-owning source fact.
 */
export function targetSourceSemanticSha256(receipt, workflow) {
  const checked = requireSourceReceipt(receipt, workflow);
  return canonicalJsonSha256({
    schema: checked.schema,
    pipeline: checked.pipeline,
    workflow: checked.workflow,
    slides: checked.slides.map(({ diagnostic_spans: _diagnosticSpans, ...slide }) => slide),
  });
}

function targetPaths(runDir) {
  const paths = pageAuthorityImage2Paths(runDir);
  return {
    ...paths,
    target_source_receipt: paths.target_source_receipt,
    target_raw_plan: paths.target_raw_plan,
    target_raw_evidence: paths.target_raw_evidence,
    target_raw_review: paths.target_raw_review,
    target_raw_review_projection: paths.target_raw_review_projection,
    target_final_manifest: paths.target_final_manifest,
  };
}

function rawPath(paths, slideId) {
  if (typeof slideId !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(slideId)) {
    throw new PageAuthorityTargetRuntimeError("target_slide_id_invalid", "target raw path requires a stable slide ID");
  }
  return join(paths.raw_root, `${slideId}.png`);
}

function reviewShape(value) {
  return exactKeys(value, [
    "schema",
    "raw_work_plan_sha256",
    "source_receipt_sha256",
    "workflow",
    "raw_bytes_sha256",
    "projection_sha256",
    "decision",
  ]) && value.schema === TARGET_RAW_REVIEW_SCHEMA &&
    SHA256_RE.test(value.raw_work_plan_sha256 || "") &&
    SHA256_RE.test(value.source_receipt_sha256 || "") &&
    typeof value.workflow === "string" &&
    SHA256_RE.test(value.raw_bytes_sha256 || "") &&
    SHA256_RE.test(value.projection_sha256 || "") &&
    (value.decision === null || ["proceed", "repair", "redirect"].includes(value.decision));
}

function rawBytesBySlide(paths, plan) {
  const bytes = {};
  for (const item of plan.items) {
    const path = rawPath(paths, item.slide_id);
    let value;
    try {
      value = readFileSync(path);
    } catch {
      throw new PageAuthorityTargetRuntimeError("target_raw_evidence_missing", `current target raw bytes are unavailable for ${item.slide_id}`);
    }
    if (!value.length) throw new PageAuthorityTargetRuntimeError("target_raw_evidence_missing", `current target raw bytes are empty for ${item.slide_id}`);
    bytes[item.slide_id] = value;
  }
  return bytes;
}

function rawBytesDigest(plan, rawBytes) {
  return canonicalJsonSha256(plan.items.map((item) => ({
    slide_id: item.slide_id,
    raw_sha256: sha256(rawBytes[item.slide_id]),
  })));
}

/** Compile provider-only facts without inspecting workflow-specific contracts. */
export function buildTargetRawGenerationProfile(deckDir, receipt) {
  const styleMasterPath = join(resolve(deckDir || ""), TARGET_STYLE_MASTER_RELATIVE_PATH);
  let styleMasterBytes;
  try {
    styleMasterBytes = readFileSync(styleMasterPath);
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_style_master_unavailable", "effective target style-master bytes are required before raw planning");
  }
  if (!styleMasterBytes.length) throw new PageAuthorityTargetRuntimeError("target_style_master_unavailable", "effective target style-master bytes must not be empty");
  const identitySelected = receipt.slides.some((slide) => slide.visual_language?.identity_reference?.provider_reference?.path);
  const profile = {
    schema: "page-authority-target-raw-generation-profile-v1",
    provider: { provider: "image2", model: "gpt-image-2", api_revision: "page-authority-image2-v2" },
    output: { format: "png", width: 2000, height: 1125 },
    reference_transport: { style_master: "image-reference-v1", identity_reference: identitySelected ? "image-reference-v1" : "none" },
    effective_style_master: { sha256: sha256(styleMasterBytes), bytes: styleMasterBytes.length },
  };
  return Object.freeze({
    style_master_path: styleMasterPath,
    profile: Object.freeze(profile),
    provider_profile_sha256: canonicalJsonSha256(profile),
  });
}

/** Wrap an adapter-owned opaque raw contract in a transport-neutral request. */
export function createTargetProviderRequest({ slideId, rawContract, generationProfile } = {}) {
  if (typeof slideId !== "string" || !slideId || !rawContract || typeof rawContract !== "object" ||
    !generationProfile || typeof generationProfile !== "object") {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_invalid", "a selected workflow raw contract and generation profile are required");
  }
  return Object.freeze({
    schema: TARGET_RAW_PROVIDER_REQUEST_SCHEMA,
    slide_id: slideId,
    raw_contract: rawContract,
    raw_contract_sha256: canonicalJsonSha256(rawContract),
    generation_profile: generationProfile,
  });
}

/**
 * Resolve source bytes through the selected adapter callback, then bind the
 * receipt to the state owner.  The callback is the source/visual boundary;
 * this runtime never parses or interprets workflow fields itself.
 */
export function resolveTargetSourceContext(runDir, { workflow, parseReceipt, allowSourceRebuild = false } = {}) {
  if (typeof parseReceipt !== "function") {
    throw new TypeError("parseReceipt must be a selected workflow source parser");
  }
  const resolvedRunDir = resolve(runDir || "");
  const sourcePath = join(resolvedRunDir, SLIDE_SPECS_NAME);
  let sourceText;
  try {
    sourceText = readFileSync(sourcePath, "utf8");
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_source_missing", "the canonical target slide source is unavailable");
  }
  const receipt = requireSourceReceipt(parseReceipt({
    runDir: resolvedRunDir,
    deckDir: deckRoot(resolvedRunDir),
    sourcePath,
    sourceText,
  }), workflow);
  const actualSourceSha = sha256(Buffer.from(sourceText, "utf8"));
  if (actualSourceSha !== receipt.source_sha256) {
    throw new PageAuthorityTargetRuntimeError("target_source_receipt_stale", "the selected workflow receipt does not bind current source bytes");
  }
  let state;
  try {
    state = initializeTargetPageAuthorityState(deckRoot(resolvedRunDir), {
      runDir: resolvedRunDir,
      sourceReceipt: receipt,
    });
  } catch (error) {
    if (!allowSourceRebuild || error?.message !== "TARGET_SOURCE_STATE_IDENTITY_MISMATCH") throw error;
    // Only an explicit selected-workflow raw-plan route may invalidate a
    // current target tuple. The state writer checks source/state identity and
    // resets authorization/evidence before any new provider work can occur.
    state = advanceTargetPageAuthoritySourceEpoch(deckRoot(resolvedRunDir), {
      runDir: resolvedRunDir,
      sourceReceipt: receipt,
    });
  }
  const paths = targetPaths(resolvedRunDir);
  writeJson(paths.target_source_receipt, receipt);
  return Object.freeze({
    run_dir: resolvedRunDir,
    deck_dir: deckRoot(resolvedRunDir),
    source_path: sourcePath,
    receipt,
    workflow,
    source_epoch: state.record.source_epoch,
    paths: Object.freeze(paths),
  });
}

/**
 * Read the last accepted target tuple alongside changed source bytes without
 * mutating state. The selected workflow decides whether the tuple is safe to
 * reuse; this shared runtime only validates typed artifacts and byte hashes.
 */
export function resolveTargetLocalComposeContext(runDir, { workflow, parseReceipt } = {}) {
  if (typeof parseReceipt !== "function") {
    throw new TypeError("parseReceipt must be a selected workflow source parser");
  }
  const resolvedRunDir = resolve(runDir || "");
  const sourcePath = join(resolvedRunDir, SLIDE_SPECS_NAME);
  let sourceText;
  try {
    sourceText = readFileSync(sourcePath, "utf8");
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_source_missing", "the canonical target slide source is unavailable");
  }
  const receipt = requireSourceReceipt(parseReceipt({
    runDir: resolvedRunDir,
    deckDir: deckRoot(resolvedRunDir),
    sourcePath,
    sourceText,
  }), workflow);
  if (sha256(Buffer.from(sourceText, "utf8")) !== receipt.source_sha256) {
    throw new PageAuthorityTargetRuntimeError("target_source_receipt_stale", "the selected workflow receipt does not bind current source bytes");
  }
  const paths = targetPaths(resolvedRunDir);
  const previousReceipt = requireSourceReceipt(
    readJson(paths.target_source_receipt, "target_previous_source_receipt_required", "previous target source receipt is required for local composition"),
    workflow,
  );
  const previousRawWorkPlan = readJson(paths.target_raw_plan, "target_previous_raw_plan_required", "previous target raw plan is required for local composition");
  requireTargetPlan(previousRawWorkPlan, previousReceipt, workflow);
  const previousAcceptedRawEvidence = readJson(paths.target_raw_evidence, "target_accepted_raw_evidence_required", "current accepted target raw evidence is required");
  const previousEvidence = validateAcceptedRawEvidence(previousAcceptedRawEvidence, { plan: previousRawWorkPlan });
  if (!previousEvidence.ok) throw new PageAuthorityTargetRuntimeError(previousEvidence.code, previousEvidence.message);
  const rawBytes = rawBytesBySlide(paths, previousRawWorkPlan);
  for (const item of previousAcceptedRawEvidence.items) {
    if (sha256(rawBytes[item.slide_id]) !== item.raw_sha256) {
      throw new PageAuthorityTargetRuntimeError("target_accepted_raw_evidence_stale", `accepted target raw bytes drifted for ${item.slide_id}`);
    }
  }
  return Object.freeze({
    run_dir: resolvedRunDir,
    deck_dir: deckRoot(resolvedRunDir),
    source_path: sourcePath,
    receipt,
    workflow,
    paths: Object.freeze(paths),
    previous_source_receipt: previousReceipt,
    previous_raw_work_plan: previousRawWorkPlan,
    previous_accepted_raw_evidence: previousAcceptedRawEvidence,
    raw_bytes_by_slide: Object.freeze(rawBytes),
  });
}

/** Persist a selected workflow's already-validated local-compose rebind. */
export function rebindTargetLocalComposeWork(context, { rawWorkPlan, acceptedRawEvidence } = {}) {
  requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PageAuthorityTargetRuntimeError(evidence.code, evidence.message);
  validateTargetAcceptedRawEvidenceLocalComposeRebind(context.deck_dir, {
    runDir: context.run_dir,
    previousSourceReceipt: context.previous_source_receipt,
    nextSourceReceipt: context.receipt,
    previousRawWorkPlan: context.previous_raw_work_plan,
    nextRawWorkPlan: rawWorkPlan,
    previousAcceptedRawEvidence: context.previous_accepted_raw_evidence,
    nextAcceptedRawEvidence: acceptedRawEvidence,
  });
  writeJson(context.paths.target_source_receipt, context.receipt);
  writeJson(context.paths.target_raw_plan, rawWorkPlan);
  writeJson(context.paths.target_raw_evidence, acceptedRawEvidence);
  const state = rebindTargetAcceptedRawEvidenceForLocalCompose(context.deck_dir, {
    runDir: context.run_dir,
    previousSourceReceipt: context.previous_source_receipt,
    nextSourceReceipt: context.receipt,
    previousRawWorkPlan: context.previous_raw_work_plan,
    nextRawWorkPlan: rawWorkPlan,
    previousAcceptedRawEvidence: context.previous_accepted_raw_evidence,
    nextAcceptedRawEvidence: acceptedRawEvidence,
  });
  return Object.freeze({ ...context, source_epoch: state.source_epoch, rebound_state: state });
}

/** Persist a typed raw plan without interpreting any workflow semantic field. */
export function writeTargetRawWorkPlan(context, rawWorkPlan) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  writeJson(context.paths.target_raw_plan, rawWorkPlan);
  return Object.freeze({ raw_work_plan: rawWorkPlan, raw_work_plan_sha256: checked.sha256 });
}

/** Rebuild a selected adapter plan and return its public provider-free projection. */
export function targetRawPlanProjection(context, rawWorkPlan) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  return Object.freeze({
    schema: "page-authority-target-raw-plan-projection-v1",
    plan_hash: checked.sha256,
    source_sha256: context.receipt.source_sha256,
    workflow: context.workflow,
    source_epoch: context.source_epoch,
    ordered_slide_ids: Object.freeze([...rawWorkPlan.ordered_slide_ids]),
    maximum_submissions: rawWorkPlan.items.length,
  });
}

function assertPlanHash(plan, planHash) {
  const checked = validateRawWorkPlan(plan);
  if (!checked.ok || !SHA256_RE.test(planHash || "") || checked.sha256 !== planHash) {
    throw new PageAuthorityTargetRuntimeError("target_raw_plan_stale", "the supplied target raw plan hash is not current");
  }
  return checked;
}

/** Record the target's exact nonzero provider authorization. */
export function authorizeTargetRawWork(context, rawWorkPlan, { planHash } = {}) {
  assertPlanHash(rawWorkPlan, planHash);
  const result = recordPageAuthorityRawProviderAuthorization(context.deck_dir, {
    runDir: context.run_dir,
    rawWorkPlan,
    maxSubmissions: rawWorkPlan.items.length,
  });
  return Object.freeze({ ...targetRawPlanProjection(context, rawWorkPlan), authorized: true, authorization: result.record });
}

/** Submit opaque adapter-owned requests only after the state owner approves scope. */
export async function generateTargetRawWork(context, rawWorkPlan, { planHash, providerRequestsBySlide, submit } = {}) {
  assertPlanHash(rawWorkPlan, planHash);
  if (!providerRequestsBySlide || typeof providerRequestsBySlide !== "object" || Array.isArray(providerRequestsBySlide)) {
    throw new PageAuthorityTargetRuntimeError("target_provider_requests_invalid", "selected workflow provider requests are required");
  }
  if (typeof submit !== "function") throw new PageAuthorityTargetRuntimeError("provider_submit_required", "a provider submit function is required");
  const expected = rawWorkPlan.ordered_slide_ids;
  if (Object.keys(providerRequestsBySlide).sort().join("\n") !== [...expected].sort().join("\n")) {
    throw new PageAuthorityTargetRuntimeError("target_provider_requests_invalid", "provider requests must exactly cover the selected raw plan");
  }
  const submitted = await submitAuthorizedRawWorkPlan({
    deckDir: context.deck_dir,
    runDir: context.run_dir,
    rawWorkPlan,
    submit: async ({ authorization, raw_work_plan_sha256, item }) => submit(Object.freeze({
      authorization,
      raw_work_plan_sha256,
      item,
      request: providerRequestsBySlide[item.slide_id],
    })),
  });
  const rawBytes = {};
  for (const [index, item] of rawWorkPlan.items.entries()) {
    rawBytes[item.slide_id] = asBytes(submitted.results[index], `provider bytes for ${item.slide_id}`);
    atomicWrite(rawPath(context.paths, item.slide_id), rawBytes[item.slide_id]);
  }
  return Object.freeze({
    ...targetRawPlanProjection(context, rawWorkPlan),
    submitted: submitted.submitted,
    raw_bytes_sha256: rawBytesDigest(rawWorkPlan, rawBytes),
  });
}

async function renderTargetRawReview(paths, plan, rawBytes) {
  const width = 1032;
  const cellWidth = 500;
  const cellHeight = 281;
  const padding = 16;
  const labelHeight = 34;
  const rows = Math.ceil(plan.items.length / 2);
  const canvas = createCanvas(width, padding * 2 + rows * (cellHeight + labelHeight) + Math.max(0, rows - 1) * padding);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, item] of plan.items.entries()) {
    const x = padding + (index % 2) * (cellWidth + padding);
    const y = padding + Math.floor(index / 2) * (cellHeight + labelHeight + padding);
    context.drawImage(await loadImage(rawBytes[item.slide_id]), x, y, cellWidth, cellHeight);
    context.fillStyle = "#17212b";
    context.font = "700 16px Arial";
    context.fillText(item.slide_id, x, y + cellHeight + 22);
  }
  const bytes = canvas.toBuffer("image/png");
  atomicWrite(paths.target_raw_review_projection, bytes);
  return sha256(bytes);
}

/** Publish a reviewable contact sheet for exact current raw bytes. */
export async function prepareTargetRawReview(context, rawWorkPlan) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const rawBytes = rawBytesBySlide(context.paths, rawWorkPlan);
  const projectionSha = await renderTargetRawReview(context.paths, rawWorkPlan, rawBytes);
  const review = {
    schema: TARGET_RAW_REVIEW_SCHEMA,
    raw_work_plan_sha256: checked.sha256,
    source_receipt_sha256: rawWorkPlan.source_receipt_sha256,
    workflow: rawWorkPlan.workflow,
    raw_bytes_sha256: rawBytesDigest(rawWorkPlan, rawBytes),
    projection_sha256: projectionSha,
    decision: null,
  };
  const reviewSha = writeJson(context.paths.target_raw_review, review);
  return Object.freeze({ ...targetRawPlanProjection(context, rawWorkPlan), projection_sha256: projectionSha, raw_review_sha256: reviewSha, review });
}

function currentTargetReview(context, rawWorkPlan) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const review = readJson(context.paths.target_raw_review, "target_raw_review_required", "a current target raw review is required");
  const rawBytes = rawBytesBySlide(context.paths, rawWorkPlan);
  if (!reviewShape(review) || review.raw_work_plan_sha256 !== checked.sha256 ||
    review.source_receipt_sha256 !== rawWorkPlan.source_receipt_sha256 || review.workflow !== rawWorkPlan.workflow ||
    review.raw_bytes_sha256 !== rawBytesDigest(rawWorkPlan, rawBytes)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_stale", "the target raw review no longer binds current raw bytes");
  }
  return { checked, review, rawBytes };
}

/** Record a human raw decision; proceed alone publishes accepted evidence. */
export function decideTargetRawReview(context, rawWorkPlan, { decision } = {}) {
  if (!["proceed", "repair", "redirect"].includes(decision)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_decision_invalid", "decision must be proceed, repair, or redirect");
  }
  const { checked, review, rawBytes } = currentTargetReview(context, rawWorkPlan);
  const nextReview = { ...review, decision };
  const reviewSha = writeJson(context.paths.target_raw_review, nextReview);
  if (decision !== "proceed") {
    return Object.freeze({ decision, raw_review_sha256: reviewSha, accepted_raw_evidence: null });
  }
  const evidence = publishAcceptedRawEvidence({
    deckDir: context.deck_dir,
    runDir: context.run_dir,
    rawWorkPlan,
    raw_review_sha256: reviewSha,
    raw_bytes_by_slide: rawBytes,
  });
  const evidenceCheck = validateAcceptedRawEvidence(evidence, { plan: rawWorkPlan });
  if (!evidenceCheck.ok) throw new PageAuthorityTargetRuntimeError(evidenceCheck.code, evidenceCheck.message);
  writeJson(context.paths.target_raw_evidence, evidence);
  recordTargetAcceptedRawEvidence(context.deck_dir, {
    runDir: context.run_dir,
    rawWorkPlan,
    acceptedRawEvidence: evidence,
  });
  return Object.freeze({ decision, raw_review_sha256: reviewSha, accepted_raw_evidence: evidence, accepted_raw_evidence_sha256: evidenceCheck.sha256, raw_work_plan_sha256: checked.sha256 });
}

/** Read exact evidence and bytes for selected-adapter finalization. */
export function readTargetAcceptedRawWork(context, rawWorkPlan) {
  requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const evidence = readJson(context.paths.target_raw_evidence, "target_accepted_raw_evidence_required", "current accepted target raw evidence is required");
  const check = validateAcceptedRawEvidence(evidence, { plan: rawWorkPlan });
  if (!check.ok) throw new PageAuthorityTargetRuntimeError(check.code, check.message);
  const rawBytes = rawBytesBySlide(context.paths, rawWorkPlan);
  for (const item of evidence.items) {
    if (sha256(rawBytes[item.slide_id]) !== item.raw_sha256) {
      throw new PageAuthorityTargetRuntimeError("target_accepted_raw_evidence_stale", `accepted target raw bytes drifted for ${item.slide_id}`);
    }
  }
  return Object.freeze({ accepted_raw_evidence: evidence, accepted_raw_evidence_sha256: check.sha256, raw_bytes_by_slide: Object.freeze(rawBytes) });
}

/**
 * Read a selected adapter's already-published final bytes without rebuilding
 * them. This shared reader validates only typed artifact bindings and byte
 * hashes; it never interprets Framed or Pure semantics.
 */
export function readTargetFinalWork(context, {
  sourceReceipt = context?.receipt,
  rawWorkPlan,
  acceptedRawEvidence,
} = {}) {
  const receipt = requireSourceReceipt(sourceReceipt, context?.workflow);
  requireTargetPlan(rawWorkPlan, receipt, context.workflow);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PageAuthorityTargetRuntimeError(evidence.code, evidence.message);
  const paths = context.paths || targetPaths(context.run_dir);
  const manifest = readJson(paths.target_final_manifest, "target_final_manifest_required", "a current target final manifest is required for notes refresh");
  const checked = validateFinalSlideManifest(manifest, {
    evidence: acceptedRawEvidence,
    expectedWorkflow: context.workflow,
  });
  if (!checked.ok) throw new PageAuthorityTargetRuntimeError(checked.code, checked.message);
  const finalBytes = {};
  for (const item of manifest.items) {
    const path = join(paths.final_root, item.path);
    let bytes;
    try {
      bytes = readFileSync(path);
    } catch {
      throw new PageAuthorityTargetRuntimeError("target_final_bytes_missing", `current target final bytes are unavailable for ${item.slide_id}`);
    }
    if (!bytes.length || sha256(bytes) !== item.final_sha256) {
      throw new PageAuthorityTargetRuntimeError("target_final_bytes_stale", `current target final bytes drifted for ${item.slide_id}`);
    }
    finalBytes[item.slide_id] = bytes;
  }
  return Object.freeze({
    final_manifest: manifest,
    final_manifest_sha256: checked.sha256,
    final_bytes_by_slide: Object.freeze(finalBytes),
  });
}

/** Persist an adapter-owned final manifest after it binds exact accepted evidence. */
export function writeTargetFinalManifest(context, { rawWorkPlan, acceptedRawEvidence, finalManifest } = {}) {
  requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const check = validateFinalSlideManifest(finalManifest, { evidence: acceptedRawEvidence, expectedWorkflow: context.workflow });
  if (!check.ok) throw new PageAuthorityTargetRuntimeError(check.code, check.message);
  writeJson(context.paths.target_final_manifest, finalManifest);
  recordTargetFinalManifest(context.deck_dir, {
    runDir: context.run_dir,
    acceptedRawEvidence,
    finalManifest,
  });
  return Object.freeze({ final_manifest: finalManifest, final_manifest_sha256: check.sha256 });
}

/** Persist delivery lineage only after the shared delivery owner returns its receipt. */
export function recordTargetDelivery(context, deliveryReceipt) {
  recordTargetDeliveryReceipt(context.deck_dir, { runDir: context.run_dir, deliveryReceipt });
  return Object.freeze({ delivery_receipt: deliveryReceipt, delivery_receipt_sha256: canonicalJsonSha256(deliveryReceipt) });
}
