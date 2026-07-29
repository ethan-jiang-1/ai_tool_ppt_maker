import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { canonicalJson, canonicalJsonSha256 } from "../../../contracts/canonical_json.mjs";
import { parsePageAuthoritySource } from "../../../01-content/index.mjs";
import {
  createPageAuthoritySourceResolver,
  loadPageAuthorityVisualLanguage,
} from "../../../02-visual-system/index.mjs";
import { preflightFramedTextFrame } from "../../../03-framed-image/index.mjs";
import {
  deliverPageAuthorityManifest,
  refreshCurrentPageAuthorityNotes,
} from "../../../05-delivery/index.mjs";
import {
  PAGE_AUTHORITY_STYLE_MASTER_RELATIVE_PATH,
  buildPageAuthorityRawGenerationProfile,
} from "./raw_profiles.mjs";
import {
  canonicalPageAuthorityProviderPayload,
  compilePageAuthorityRawBatch,
  submitAuthorizedPageAuthorityRawBatch,
} from "./raw_compilation.mjs";
import {
  classifyPageAuthorityRawReuse,
  pageAuthorityRawImagePath,
  readPageAuthorityRawManifest,
  writePageAuthorityRawManifest,
} from "./raw_manifest.mjs";
import {
  inspectPageAuthorityRawReviewCoverage,
  recordPageAuthorityRawReviewDecision,
  renderPageAuthorityRawReviewProjection,
  writePageAuthorityRawReviewCoverage,
} from "./raw_review.mjs";
import { finalizePageAuthorityRun } from "./final_manifest.mjs";
import {
  SLIDE_SPECS_NAME,
  deckRoot,
  pageAuthorityImage2Paths,
} from "../../../shared/run-bundle/bundle_layout.mjs";
import {
  advancePageAuthoritySourceEpoch,
  readState,
  recordPageAuthorityRawProviderAuthorization,
} from "../../../shared/state/state.mjs";

export const PAGE_AUTHORITY_RAW_PLAN_SCHEMA = "pptmaker-page-authority-raw-plan-v1";

const SHA256_RE = /^[0-9a-f]{64}$/;

export class PageAuthorityOperationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityOperationError";
    this.code = code;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
  const temporary = join(dirname(path), `.${basename(path)}.tmp-${process.pid}`);
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
  return sha256(bytes);
}

function requireSourceEpoch(runDir, deckDir) {
  const runVersion = basename(runDir);
  const state = readState(deckDir, { purpose: "execute", runDir });
  const epoch = state?.production_mode?.by_version?.[`3_versions/${runVersion}`]?.source_epoch;
  if (!Number.isInteger(epoch) || epoch <= 0) {
    throw new PageAuthorityOperationError("PAGE_AUTHORITY_STATE_INVALID", "authoritative Page Authority source_epoch is unavailable");
  }
  return { runVersion, sourceEpoch: epoch };
}

function receiptPreflightBySlide(receipt) {
  const result = {};
  for (const slide of receipt.slides) {
    if (slide.authority !== "framed-image2") continue;
    const preflight = preflightFramedTextFrame(slide.text_frame);
    if (!preflight.ok || !preflight.authorization_allowed) {
      throw new PageAuthorityOperationError("FRAMED_PREFLIGHT_REQUIRED", `Framed Text Frame requires repair for ${slide.slide_id}`);
    }
    result[slide.slide_id] = preflight;
  }
  return result;
}

function generationProfile(deckDir, receipt) {
  const styleMasterPath = resolve(deckDir, PAGE_AUTHORITY_STYLE_MASTER_RELATIVE_PATH);
  if (!existsSync(styleMasterPath)) {
    throw new PageAuthorityOperationError("STYLE_MASTER_UNAVAILABLE", "effective Page Authority style-master bytes are required before raw planning");
  }
  const identitySelected = receipt.slides.some((slide) => slide.visual_language?.identity_reference?.provider_reference?.path);
  return {
    styleMasterPath,
    profile: buildPageAuthorityRawGenerationProfile({
      provider: {
        provider: "image2",
        model: "gpt-image-2",
        api_revision: "page-authority-image2-v1",
      },
      output: { format: "png", width: 2000, height: 1125 },
      style_master_bytes: readFileSync(styleMasterPath),
      reference_transport: {
        style_master: "image-reference-v1",
        identity_reference: identitySelected ? "image-reference-v1" : "none",
      },
    }),
  };
}

/** Compile Page Authority raw inputs for projected source bytes without state or artifact mutation. */
export function buildPageAuthorityRawBatchForSource({ deckDir, sourcePath, sourceText } = {}) {
  const resolvedDeckDir = resolve(deckDir || "");
  const resolvedSourcePath = resolve(sourcePath || "");
  const text = typeof sourceText === "string" ? sourceText : null;
  if (!resolvedDeckDir || !resolvedSourcePath || text === null) {
    throw new PageAuthorityOperationError("SOURCE_INPUT_INVALID", "deck, source path, and projected Page Authority source bytes are required");
  }
  const visualLanguage = loadPageAuthorityVisualLanguage(resolvedDeckDir);
  const receipt = parsePageAuthoritySource(text, {
    source: resolvedSourcePath,
    registry: createPageAuthoritySourceResolver({ deckDir: resolvedDeckDir, visualLanguage }),
  });
  const preflight_by_slide = receiptPreflightBySlide(receipt);
  const generation = generationProfile(resolvedDeckDir, receipt);
  const raw_batch = compilePageAuthorityRawBatch({
    receipt,
    generation_profile: generation.profile,
    preflight_by_slide,
  });
  return Object.freeze({
    deck_dir: resolvedDeckDir,
    source_path: resolvedSourcePath,
    receipt,
    preflight_by_slide,
    style_master_path: generation.styleMasterPath,
    raw_batch,
  });
}

function submissionBatch(rawBatch, classification) {
  const debt = new Set(classification.filter((entry) => entry.status === "needs_raw_generation").map((entry) => entry.slide_id));
  return {
    ...rawBatch,
    requests: rawBatch.requests.filter((request) => debt.has(request.slide_id)),
  };
}

function rawSourceAuthorityChanged(rawBatch, manifest, sourceEpoch) {
  if (!manifest || manifest.source_epoch !== sourceEpoch || manifest.source_sha256 === rawBatch.source_sha256 || !Array.isArray(manifest.items)) {
    return false;
  }
  const priorById = new Map(manifest.items.map((item) => [item.slide_id, item]));
  if (priorById.size !== rawBatch.requests.length) return true;
  return rawBatch.requests.some((request) => {
    const prior = priorById.get(request.slide_id);
    return !prior ||
      prior.raw_image_contract_digest !== request.raw_image_contract_digest ||
      prior.raw_generation_profile_digest !== request.raw_generation_profile_digest;
  });
}

function planFingerprint({ receipt, sourceEpoch, rawBatch, classification }) {
  return canonicalJsonSha256({
    schema: PAGE_AUTHORITY_RAW_PLAN_SCHEMA,
    source_sha256: receipt.source_sha256,
    source_epoch: sourceEpoch,
    raw_batch: rawBatch,
    classification,
  });
}

function publicPlan(plan) {
  return Object.freeze({
    schema: PAGE_AUTHORITY_RAW_PLAN_SCHEMA,
    plan_hash: plan.plan_hash,
    source_sha256: plan.receipt.source_sha256,
    source_epoch: plan.source_epoch,
    raw_generation_profile_digest: plan.raw_batch.raw_generation_profile_digest,
    reusable_slide_ids: plan.classification
      .filter((entry) => entry.status === "reusable")
      .map((entry) => entry.slide_id),
    needs_raw_generation: plan.submit_batch.requests.map((request) => request.slide_id),
    maximum_submissions: plan.submit_batch.requests.length,
  });
}

function assertExactPlan(plan, expectedPlanHash) {
  if (!SHA256_RE.test(expectedPlanHash || "") || plan.plan_hash !== expectedPlanHash) {
    throw new PageAuthorityOperationError("RAW_PLAN_STALE", "the supplied Page Authority raw plan hash is not current");
  }
}

function rawBytes(value, slideId) {
  const bytes = Buffer.isBuffer(value)
    ? value
    : value instanceof Uint8Array
      ? Buffer.from(value)
      : Buffer.isBuffer(value?.bytes)
        ? value.bytes
        : value?.bytes instanceof Uint8Array
          ? Buffer.from(value.bytes)
          : null;
  if (!bytes?.length) {
    throw new PageAuthorityOperationError("RAW_PROVIDER_RESPONSE_INVALID", `provider response for ${slideId} did not contain image bytes`);
  }
  return Buffer.from(bytes);
}

function mergedRawImages(runDir, plan, generatedResults) {
  const generatedById = new Map(
    plan.submit_batch.requests.map((request, index) => [request.slide_id, rawBytes(generatedResults[index], request.slide_id)])
  );
  const prior = readPageAuthorityRawManifest(runDir);
  const priorById = new Map(prior?.items?.map((item) => [item.slide_id, item]) || []);
  const images = {};
  for (const request of plan.raw_batch.requests) {
    if (generatedById.has(request.slide_id)) {
      images[request.slide_id] = generatedById.get(request.slide_id);
      continue;
    }
    const item = priorById.get(request.slide_id);
    if (!item || item.raw_image_contract_digest !== request.raw_image_contract_digest || item.raw_generation_profile_digest !== request.raw_generation_profile_digest) {
      throw new PageAuthorityOperationError("RAW_REUSE_STALE", `exact reusable raw bytes are unavailable for ${request.slide_id}`);
    }
    let bytes;
    try {
      bytes = readFileSync(pageAuthorityRawImagePath(runDir, request.slide_id));
    } catch {
      throw new PageAuthorityOperationError("RAW_REUSE_STALE", `exact reusable raw PNG is unavailable for ${request.slide_id}`);
    }
    if (!bytes.length || sha256(bytes) !== item.raw_sha256) {
      throw new PageAuthorityOperationError("RAW_REUSE_STALE", `exact reusable raw PNG drifted for ${request.slide_id}`);
    }
    images[request.slide_id] = bytes;
  }
  return images;
}

/** Resolve and persist the canonical source receipt without provider work. */
export function resolvePageAuthorityReceipt(runDir) {
  const resolvedRunDir = resolve(runDir);
  const deckDir = deckRoot(resolvedRunDir);
  const sourcePath = join(resolvedRunDir, SLIDE_SPECS_NAME);
  if (!existsSync(sourcePath)) {
    throw new PageAuthorityOperationError("SOURCE_MISSING", "canonical Page Authority source is missing");
  }
  const visualLanguage = loadPageAuthorityVisualLanguage(deckDir);
  const receipt = parsePageAuthoritySource(readFileSync(sourcePath, "utf8"), {
    source: sourcePath,
    registry: createPageAuthoritySourceResolver({ deckDir, visualLanguage }),
  });
  const paths = pageAuthorityImage2Paths(resolvedRunDir);
  const receiptSha256 = writeJsonAtomic(paths.receipt, receipt);
  return Object.freeze({ run_dir: resolvedRunDir, deck_dir: deckDir, source_path: sourcePath, receipt, receipt_sha256: receiptSha256 });
}

/** Compile a provider-free exact raw plan from canonical source/state facts. */
export function buildPageAuthorityRawPlan(runDir) {
  const resolved = resolvePageAuthorityReceipt(runDir);
  const { runVersion, sourceEpoch: initialSourceEpoch } = requireSourceEpoch(resolved.run_dir, resolved.deck_dir);
  const preflight_by_slide = receiptPreflightBySlide(resolved.receipt);
  const generation = generationProfile(resolved.deck_dir, resolved.receipt);
  const raw_batch = compilePageAuthorityRawBatch({
    receipt: resolved.receipt,
    generation_profile: generation.profile,
    preflight_by_slide,
  });
  const priorManifest = readPageAuthorityRawManifest(resolved.run_dir);
  const sourceEpoch = rawSourceAuthorityChanged(raw_batch, priorManifest, initialSourceEpoch)
    ? advancePageAuthoritySourceEpoch(resolved.deck_dir, {
      runDir: resolved.run_dir,
      expectedSourceEpoch: initialSourceEpoch,
    }).source_epoch
    : initialSourceEpoch;
  const classification = classifyPageAuthorityRawReuse({ rawBatch: raw_batch, sourceEpoch, runDir: resolved.run_dir });
  const submit_batch = submissionBatch(raw_batch, classification);
  const plan = {
    ...resolved,
    run_version: runVersion,
    source_epoch: sourceEpoch,
    preflight_by_slide,
    style_master_path: generation.styleMasterPath,
    raw_batch,
    submit_batch,
    classification,
  };
  plan.plan_hash = planFingerprint({ receipt: plan.receipt, sourceEpoch, rawBatch: raw_batch, classification });
  return Object.freeze(plan);
}

export function pageAuthorityRawPlanProjection(plan) {
  return publicPlan(plan);
}

/** Record the exact human raw-submit authorization, or report a zero-submit plan. */
export function authorizePageAuthorityRawPlan(runDir, { planHash } = {}) {
  const plan = buildPageAuthorityRawPlan(runDir);
  assertExactPlan(plan, planHash);
  if (plan.submit_batch.requests.length === 0) {
    return Object.freeze({ ...publicPlan(plan), authorized: false, zero_submit: true });
  }
  const authorization = recordPageAuthorityRawProviderAuthorization(plan.deck_dir, {
    runDir: plan.run_dir,
    rawBatch: plan.submit_batch,
    maxSubmissions: plan.submit_batch.requests.length,
  });
  return Object.freeze({ ...publicPlan(plan), authorized: true, authorization: authorization.record });
}

/** Submit only current debt and atomically materialize a complete raw manifest. */
export async function generatePageAuthorityRawPlan(runDir, { planHash, submit } = {}) {
  if (typeof submit !== "function") {
    throw new TypeError("generatePageAuthorityRawPlan requires a provider submit function");
  }
  const plan = buildPageAuthorityRawPlan(runDir);
  assertExactPlan(plan, planHash);
  if (plan.submit_batch.requests.length === 0) {
    return Object.freeze({ ...publicPlan(plan), submitted: 0, raw_manifest: readPageAuthorityRawManifest(plan.run_dir) });
  }
  const submitted = await submitAuthorizedPageAuthorityRawBatch({
    deckDir: plan.deck_dir,
    runDir: plan.run_dir,
    rawBatch: plan.submit_batch,
    submit,
  });
  const images = mergedRawImages(plan.run_dir, plan, submitted.results);
  const materialized = writePageAuthorityRawManifest(plan.run_dir, {
    rawBatch: plan.raw_batch,
    sourceEpoch: plan.source_epoch,
    images,
  });
  return Object.freeze({
    ...publicPlan(plan),
    submitted: submitted.submitted,
    raw_manifest_sha256: materialized.sha256,
    raw_manifest: materialized.manifest,
  });
}

/** Render fresh non-publishing raw-review evidence for the exact current plan. */
export async function preparePageAuthorityRawReview(runDir) {
  const plan = buildPageAuthorityRawPlan(runDir);
  if (plan.submit_batch.requests.length > 0) {
    throw new PageAuthorityOperationError("RAW_EVIDENCE_MISSING", "current Page Authority raw evidence is incomplete; generate or materialize raw evidence before review");
  }
  const projection = await renderPageAuthorityRawReviewProjection(plan.run_dir, { rawBatch: plan.raw_batch });
  const coverage = writePageAuthorityRawReviewCoverage(plan.run_dir, {
    sourceEpoch: plan.source_epoch,
    projection,
  });
  return Object.freeze({ ...publicPlan(plan), projection_sha256: projection.sha256, coverage });
}

export function decidePageAuthorityRawReview(runDir, { decision } = {}) {
  const resolved = resolvePageAuthorityReceipt(runDir);
  const { sourceEpoch } = requireSourceEpoch(resolved.run_dir, resolved.deck_dir);
  const before = inspectPageAuthorityRawReviewCoverage(resolved.run_dir, { sourceEpoch });
  if (before.kind !== "confirm") {
    throw new PageAuthorityOperationError(before.code || "RAW_REVIEW_NOT_CONFIRMABLE", "current Page Authority raw review evidence is not ready for a human decision");
  }
  return recordPageAuthorityRawReviewDecision(resolved.run_dir, { decision });
}

/** Finalize one current Page Authority manifest, then assemble and inject source notes. */
export async function buildPageAuthorityDelivery(runDir) {
  const plan = buildPageAuthorityRawPlan(runDir);
  if (plan.submit_batch.requests.length > 0) {
    return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_EVIDENCE_MISSING", next_action: "prepare_raw_evidence" });
  }
  const finalization = await finalizePageAuthorityRun({
    runDir: plan.run_dir,
    receipt: plan.receipt,
    sourceEpoch: plan.source_epoch,
    rawBatch: plan.raw_batch,
    preflight_by_slide: plan.preflight_by_slide,
  });
  if (!finalization.ok) return finalization;
  const delivery = await deliverPageAuthorityManifest({
    runDir: plan.run_dir,
    manifest: finalization.manifest,
    sourcePath: plan.source_path,
    sourceEpoch: plan.source_epoch,
    title: basename(plan.deck_dir),
  });
  return Object.freeze({ ok: true, finalization, ...delivery });
}

/** Inject current source notes only after a current Page Authority assembly. */
export async function refreshPageAuthorityNotes(runDir) {
  const resolved = resolvePageAuthorityReceipt(runDir);
  const { sourceEpoch } = requireSourceEpoch(resolved.run_dir, resolved.deck_dir);
  const delivery = await refreshCurrentPageAuthorityNotes({
    runDir: resolved.run_dir,
    sourcePath: resolved.source_path,
    sourceEpoch,
  });
  return Object.freeze({ ok: true, ...delivery });
}

/** A Frame-only refresh must prove exact raw reuse and never receives a submit callback. */
export async function refreshPageAuthorityFramedText(runDir, { slideIds } = {}) {
  const plan = buildPageAuthorityRawPlan(runDir);
  const selected = Array.isArray(slideIds) && slideIds.length > 0
    ? [...new Set(slideIds)]
    : plan.receipt.slides.map((slide) => slide.slide_id);
  const receiptById = new Map(plan.receipt.slides.map((slide) => [slide.slide_id, slide]));
  const classificationById = new Map(plan.classification.map((entry) => [entry.slide_id, entry]));
  for (const slideId of selected) {
    const slide = receiptById.get(slideId);
    if (!slide) throw new PageAuthorityOperationError("SLIDE_ID_INVALID", `selected Page Authority slide is not present: ${slideId}`);
    if (slide.authority !== "framed-image2") throw new PageAuthorityOperationError("PURE_REFRESH_REQUIRES_RAW", `Pure slide ${slideId} requires new raw evidence and review`);
    if (classificationById.get(slideId)?.status !== "reusable") throw new PageAuthorityOperationError("FRAMED_RAW_REUSE_REQUIRED", `Framed slide ${slideId} lacks exact reusable raw evidence`);
  }
  const result = await buildPageAuthorityDelivery(plan.run_dir);
  return Object.freeze({ ...result, refreshed_slide_ids: selected, provider_submissions: 0 });
}

/** Canonical provider payload bytes are intentionally retained only for the submit owner. */
export function pageAuthorityProviderPayloadForSubmit(request) {
  if (request?.provider_payload) return canonicalPageAuthorityProviderPayload(request);
  if (request?.schema === "pptmaker-page-authority-raw-provider-request-v1") return canonicalJson(request);
  throw new PageAuthorityOperationError("RAW_PROVIDER_REQUEST_INVALID", "a canonical Page Authority provider request is required");
}
