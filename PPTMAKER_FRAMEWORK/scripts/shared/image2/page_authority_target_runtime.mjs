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
import { basename, dirname, join, relative, resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE,
  PAGE_AUTHORITY_NATIVE_RAW_PNG,
} from "./page_authority_media_contract.mjs";
import {
  createAcceptedRawEvidence,
  pageAuthorityOrdinalImageFilename,
  validateAcceptedRawEvidence,
  validateAcceptedRawEvidenceForFinalization,
  validateFinalSlideManifest,
  validateRawWorkPlan,
  validateRawWorkPlanForFinalization,
} from "./page_authority_artifacts.mjs";
import {
  publishAcceptedRawEvidence,
  submitAuthorizedRawWorkPlan,
} from "./page_authority_raw_mechanics.mjs";
import {
  resolveAcceptedStyleMasterReference,
} from "./style_master_plan.mjs";
import {
  validateProgressiveRawWorkPlan,
} from "./page_authority_progressive_schema.mjs";
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
  rebindTargetProgressiveRawEvidenceForLocalCompose,
  resolveCurrentTargetPageAuthoritySourceState,
  validateTargetAcceptedRawEvidenceLocalComposeRebind,
} from "../state/state.mjs";

export const TARGET_RAW_REVIEW_SCHEMA = "page-authority-target-raw-review-v2";
export const TARGET_RAW_REVIEW_CONTRIBUTION_SCHEMA = "page-authority-target-raw-review-contribution-v1";
export const TARGET_RAW_REVIEW_PROJECTION_CAPTURE_PROFILE_SCHEMA = "page-authority-target-raw-review-projection-capture-profile-v1";
export const TARGET_RAW_CONTRACT_SCHEMA = "page-authority-target-raw-contract-v1";
export const TARGET_RAW_PROVIDER_REQUEST_SCHEMA = "page-authority-target-raw-provider-request-v1";
export const TARGET_PROVIDER_REQUEST_INSPECTION_SCHEMA = "page-authority-provider-request-inspection-v1";

export class PageAuthorityTargetRuntimeError extends Error {
  constructor(code, message, { nextAction = null } = {}) {
    super(message);
    this.name = "PageAuthorityTargetRuntimeError";
    this.code = code;
    if (nextAction) this.next_action = nextAction;
  }
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const STABLE_SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/** Return whether resolved provider clause text has the canonical Page Authority shape. */
export function isPageAuthorityProviderClausesShape(value) {
  const isLegacyShape = exactKeys(value, ["recipe", "composition", "motifs"]);
  const isRelationshipShape = exactKeys(value, ["recipe", "composition", "motifs", "relationship"]);
  return (isLegacyShape || isRelationshipShape) &&
    typeof value.recipe === "string" && value.recipe.trim().length > 0 &&
    typeof value.composition === "string" && value.composition.trim().length > 0 &&
    Array.isArray(value.motifs) && value.motifs.every((motif) => typeof motif === "string" && motif.trim().length > 0) &&
    (!Object.hasOwn(value, "relationship") || (typeof value.relationship === "string" && value.relationship.trim().length > 0));
}

/** Bind an optional selected relationship clause to the plan's visual-language projection. */
export function isPageAuthorityProviderClausesBoundToVisualLanguage(visualLanguage, providerClauses) {
  if (!isPageAuthorityProviderClausesShape(providerClauses) || !visualLanguage || typeof visualLanguage !== "object" || Array.isArray(visualLanguage)) {
    return false;
  }
  if (!Object.hasOwn(visualLanguage, "relationship")) return !Object.hasOwn(providerClauses, "relationship");
  const relationship = visualLanguage.relationship;
  if (!exactKeys(relationship, ["id", "reading_order", "provider_clause_sha256"]) ||
    typeof relationship.id !== "string" || !relationship.id ||
    !["bottom-to-top", "left-to-right"].includes(relationship.reading_order) ||
    !SHA256_RE.test(relationship.provider_clause_sha256 || "") ||
    !Object.hasOwn(providerClauses, "relationship")) {
    return false;
  }
  return sha256(providerClauses.relationship) === relationship.provider_clause_sha256;
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

function staleTargetPlanError(code, message) {
  return new PageAuthorityTargetRuntimeError(code, message, {
    nextAction: "rebuild_target_raw_plan",
  });
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

function runRelativePath(runDir, artifactPath) {
  const value = relative(runDir, artifactPath).replaceAll("\\", "/");
  if (!value || value === ".." || value.startsWith("../")) {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection must remain within the current run");
  }
  return value;
}

function requireProgressiveInspectionPlan(progressiveRawWorkPlan, rawWorkPlan, context) {
  const progressive = validateProgressiveRawWorkPlan(progressiveRawWorkPlan);
  if (!progressive.ok || progressiveRawWorkPlan.workflow !== context.workflow ||
    progressiveRawWorkPlan.source_receipt_sha256 !== context.receipt.source_sha256 ||
    progressiveRawWorkPlan.source_epoch !== context.source_epoch ||
    progressiveRawWorkPlan.provider_profile_sha256 !== rawWorkPlan.provider_profile_sha256 ||
    canonicalJson(progressiveRawWorkPlan.ordered_slide_ids) !== canonicalJson(rawWorkPlan.ordered_slide_ids) ||
    canonicalJson(progressiveRawWorkPlan.items) !== canonicalJson(rawWorkPlan.items)) {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection requires the exact current progressive raw plan");
  }
  return progressive;
}

function requireSafeProviderRequestInspectionTransport(request, providerProfileSha256) {
  const profile = request?.generation_profile;
  if (!profile || typeof profile !== "object" || canonicalJsonSha256(profile) !== providerProfileSha256 ||
    typeof profile.provider?.model !== "string" || !profile.provider.model ||
    profile.output?.format !== PAGE_AUTHORITY_NATIVE_RAW_PNG.format ||
    profile.output?.width !== PAGE_AUTHORITY_NATIVE_RAW_PNG.width ||
    profile.output?.height !== PAGE_AUTHORITY_NATIVE_RAW_PNG.height) {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection requires the canonical selected transport profile");
  }
  return Object.freeze({ model: profile.provider.model, size: PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE });
}

/**
 * Materialize a provider-free diagnostic view of the exact selected-adapter
 * request. This sidecar is deliberately not read by authorization, submission,
 * reconciliation, or materialization paths.
 */
export function writeTargetProviderRequestInspection(context, {
  rawWorkPlan,
  progressiveRawWorkPlan,
  providerRequestsBySlide,
} = {}) {
  const rawPlan = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const progressivePlan = requireProgressiveInspectionPlan(progressiveRawWorkPlan, rawWorkPlan, context);
  if (!providerRequestsBySlide || typeof providerRequestsBySlide !== "object" || Array.isArray(providerRequestsBySlide)) {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection requires selected adapter requests");
  }
  const orderedIds = rawWorkPlan.ordered_slide_ids;
  const requestIds = Object.keys(providerRequestsBySlide).sort();
  if (canonicalJson(requestIds) !== canonicalJson([...orderedIds].sort())) {
    throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection requests must exactly cover the current raw plan");
  }
  let transport = null;
  const items = rawWorkPlan.items.map((item) => {
    const request = providerRequestsBySlide[item.slide_id];
    if (!request || typeof request !== "object" || Array.isArray(request) ||
      request.schema !== TARGET_RAW_PROVIDER_REQUEST_SCHEMA || request.slide_id !== item.slide_id ||
      request.raw_contract_sha256 !== item.raw_contract_sha256 || !request.raw_contract ||
      canonicalJsonSha256(request.raw_contract) !== item.raw_contract_sha256) {
      throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection does not match the current raw contract");
    }
    const requestTransport = requireSafeProviderRequestInspectionTransport(request, rawWorkPlan.provider_profile_sha256);
    if (transport && canonicalJson(transport) !== canonicalJson(requestTransport)) {
      throw new PageAuthorityTargetRuntimeError("target_provider_request_inspection_invalid", "provider request inspection requires one shared selected transport profile");
    }
    transport = requestTransport;
    return Object.freeze({
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      provider_request_sha256: canonicalJsonSha256(request),
      prompt: JSON.stringify(request),
    });
  });
  const inspection = Object.freeze({
    schema: TARGET_PROVIDER_REQUEST_INSPECTION_SCHEMA,
    progressive_raw_work_plan_sha256: progressivePlan.sha256,
    target_raw_work_plan_sha256: rawPlan.sha256,
    source_receipt_sha256: context.receipt.source_sha256,
    source_epoch: context.source_epoch,
    workflow: context.workflow,
    provider_profile_sha256: progressiveRawWorkPlan.provider_profile_sha256,
    transport,
    ordered_slide_ids: Object.freeze([...orderedIds]),
    items: Object.freeze(items),
  });
  const inspectionSha256 = writeJson(context.paths.target_provider_request_inspection, inspection);
  return Object.freeze({
    path: runRelativePath(context.run_dir, context.paths.target_provider_request_inspection),
    sha256: inspectionSha256,
    plan_hash: progressivePlan.sha256,
  });
}

function rawPath(paths, position, slideId) {
  if (typeof slideId !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(slideId)) {
    throw new PageAuthorityTargetRuntimeError("target_slide_id_invalid", "target raw path requires a stable slide ID");
  }
  if (!Number.isInteger(position) || position < 1) {
    throw new PageAuthorityTargetRuntimeError("target_position_invalid", "target raw path requires a positive current position");
  }
  return join(paths.raw_root, pageAuthorityOrdinalImageFilename(position, slideId));
}

function reviewShape(value) {
  return exactKeys(value, [
    "schema",
    "source_epoch",
    "workflow",
    "raw_bytes_sha256",
    "typed_review_contribution_sha256",
    "projection_sha256",
    "projection_capture_profile_sha256",
    "decision",
  ]) && value.schema === TARGET_RAW_REVIEW_SCHEMA &&
    Number.isInteger(value.source_epoch) && value.source_epoch > 0 &&
    typeof value.workflow === "string" &&
    SHA256_RE.test(value.raw_bytes_sha256 || "") &&
    SHA256_RE.test(value.typed_review_contribution_sha256 || "") &&
    SHA256_RE.test(value.projection_sha256 || "") &&
    SHA256_RE.test(value.projection_capture_profile_sha256 || "") &&
    (value.decision === null || ["proceed", "repair", "redirect"].includes(value.decision));
}

const TARGET_RAW_REVIEW_CONTRIBUTION_KEYS = Object.freeze([
  "schema",
  "workflow",
  "coverage",
  "projection",
]);
const TARGET_RAW_REVIEW_CONTRIBUTION_COVERAGE_KEYS = Object.freeze([
  "ordered_stable_ids",
  "items",
]);
const TARGET_RAW_REVIEW_CONTRIBUTION_ITEM_KEYS = Object.freeze([
  "stable_id",
  "coverage_profile_digest",
  "guide_primitives",
]);
const TARGET_RAW_REVIEW_GUIDE_KEYS = Object.freeze([
  "kind",
  "guide_id",
  "x",
  "y",
  "width",
  "height",
]);
const TARGET_RAW_REVIEW_PROJECTION_KEYS = Object.freeze(["labels"]);
const TARGET_RAW_REVIEW_LABEL_KEYS = Object.freeze([
  "stable_id",
  "position",
  "title",
]);

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freezeDeep(entry);
  return Object.freeze(value);
}

const TARGET_RAW_REVIEW_PROJECTION_CAPTURE_PROFILE = freezeDeep({
  schema: TARGET_RAW_REVIEW_PROJECTION_CAPTURE_PROFILE_SCHEMA,
  contact_sheet: {
    columns: 2,
    width: 1032,
    cell_width: 500,
    cell_height: 281,
    padding: 16,
    row_gap: 16,
    label_height: 34,
    background: "#ffffff",
  },
  labels: {
    format: "position-formal-slide-id-title-v1",
    separator: " | ",
    font: { family: "Arial", weight: 700, size: 16, color: "#17212b", baseline_offset: 22 },
  },
  guides: {
    coordinate_space: "normalized-canvas-v1",
    renderer: "generic-rectangle-v1",
    rectangle: { stroke: "#d97706", line_width: 2 },
  },
  capture: { format: "png", encoder: "napi-rs-canvas-v1" },
});

/** Return the one canonical shared raw-review projection/capture profile. */
export function currentTargetRawReviewProjectionCaptureProfile() {
  return Object.freeze({
    profile: TARGET_RAW_REVIEW_PROJECTION_CAPTURE_PROFILE,
    projection_capture_profile_sha256: canonicalJsonSha256(TARGET_RAW_REVIEW_PROJECTION_CAPTURE_PROFILE),
  });
}

function reviewContributionCoverageIdentity(contribution) {
  return {
    schema: contribution.schema,
    workflow: contribution.workflow,
    coverage: contribution.coverage,
  };
}

function validStableId(value) {
  return typeof value === "string" && STABLE_SLIDE_ID_RE.test(value);
}

function validGuidePrimitive(value) {
  return exactKeys(value, TARGET_RAW_REVIEW_GUIDE_KEYS) &&
    value.kind === "rectangle" && typeof value.guide_id === "string" && value.guide_id &&
    [value.x, value.y, value.width, value.height].every(Number.isFinite) &&
    value.x >= 0 && value.y >= 0 && value.width > 0 && value.height > 0 &&
    value.x + value.width <= 1 && value.y + value.height <= 1;
}

/**
 * Validate generic, ephemeral raw-review contribution facts without
 * interpreting any workflow's source or layout semantics.
 */
export function validateTargetRawReviewContribution(contribution, {
  rawWorkPlan = null,
  expectedWorkflow = null,
} = {}) {
  try {
    if (!exactKeys(contribution, TARGET_RAW_REVIEW_CONTRIBUTION_KEYS) ||
      contribution.schema !== TARGET_RAW_REVIEW_CONTRIBUTION_SCHEMA ||
      !["framed", "pure"].includes(contribution.workflow) ||
      (expectedWorkflow !== null && contribution.workflow !== expectedWorkflow) ||
      !exactKeys(contribution.coverage, TARGET_RAW_REVIEW_CONTRIBUTION_COVERAGE_KEYS) ||
      !exactKeys(contribution.projection, TARGET_RAW_REVIEW_PROJECTION_KEYS)) {
      throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_invalid", "target raw-review contribution has an invalid canonical shape");
    }
    const orderedIds = contribution.coverage.ordered_stable_ids;
    const coverageItems = contribution.coverage.items;
    const labels = contribution.projection.labels;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0 ||
      orderedIds.some((stableId) => !validStableId(stableId)) ||
      new Set(orderedIds).size !== orderedIds.length ||
      !Array.isArray(coverageItems) || coverageItems.length !== orderedIds.length ||
      !Array.isArray(labels) || labels.length !== orderedIds.length) {
      throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_invalid", "target raw-review contribution must cover ordered stable IDs exactly");
    }
    for (const [index, stableId] of orderedIds.entries()) {
      const item = coverageItems[index];
      const label = labels[index];
      if (!exactKeys(item, TARGET_RAW_REVIEW_CONTRIBUTION_ITEM_KEYS) ||
        item.stable_id !== stableId || !SHA256_RE.test(item.coverage_profile_digest || "") ||
        !Array.isArray(item.guide_primitives) ||
        item.guide_primitives.some((primitive) => !validGuidePrimitive(primitive)) ||
        new Set(item.guide_primitives.map((primitive) => primitive.guide_id)).size !== item.guide_primitives.length) {
        throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_invalid", "target raw-review coverage facts are invalid");
      }
      if (!exactKeys(label, TARGET_RAW_REVIEW_LABEL_KEYS) || label.stable_id !== stableId ||
        label.position !== index + 1 || typeof label.title !== "string" || !label.title.trim()) {
        throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_invalid", "target raw-review projection labels are invalid");
      }
    }
    if (rawWorkPlan !== null) {
      const checkedPlan = validateRawWorkPlan(rawWorkPlan);
      if (!checkedPlan.ok || rawWorkPlan.workflow !== contribution.workflow ||
        canonicalJson(rawWorkPlan.ordered_slide_ids) !== canonicalJson(orderedIds)) {
        throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_stale", "target raw-review contribution does not bind the current raw work plan order");
      }
    }
    return Object.freeze({
      ok: true,
      typed_review_contribution_sha256: canonicalJsonSha256(reviewContributionCoverageIdentity(contribution)),
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "target_raw_review_contribution_invalid",
      message: error.message || "target raw-review contribution is invalid",
    });
  }
}

/**
 * Create one workflow-opaque raw-review contribution. Its digest binds only
 * coverage; projection labels are intentionally presentation-only snapshots.
 */
export function createTargetRawReviewContribution(input = {}) {
  if (!exactKeys(input, ["workflow", "ordered_stable_ids", "coverage_items", "projection_labels"])) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_contribution_invalid", "target raw-review contribution input has an invalid shape");
  }
  const contribution = {
    schema: TARGET_RAW_REVIEW_CONTRIBUTION_SCHEMA,
    workflow: input.workflow,
    coverage: {
      ordered_stable_ids: input.ordered_stable_ids,
      items: input.coverage_items,
    },
    projection: {
      labels: input.projection_labels,
    },
  };
  const validation = validateTargetRawReviewContribution(contribution);
  if (!validation.ok) throw new PageAuthorityTargetRuntimeError(validation.code, validation.message);
  Object.defineProperty(contribution, "typed_review_contribution_sha256", {
    value: validation.typed_review_contribution_sha256,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return freezeDeep(contribution);
}

/**
 * Project generic contribution facts into the current raw-plan order for one
 * capture. The result remains ephemeral and carries no workflow semantics.
 */
export function projectTargetRawReviewContribution(rawWorkPlan, reviewContribution) {
  const checkedPlan = validateRawWorkPlan(rawWorkPlan);
  if (!checkedPlan.ok) throw new PageAuthorityTargetRuntimeError(checkedPlan.code, checkedPlan.message);
  const validation = requireTargetReviewContribution(reviewContribution, rawWorkPlan, rawWorkPlan.workflow);
  return Object.freeze(rawWorkPlan.ordered_slide_ids.map((stableId, index) => {
    const coverage = reviewContribution.coverage.items[index];
    const label = reviewContribution.projection.labels[index];
    return Object.freeze({
      stable_id: stableId,
      position: label.position,
      title: label.title,
      guide_primitives: Object.freeze(coverage.guide_primitives.map((primitive) => Object.freeze({ ...primitive }))),
      typed_review_contribution_sha256: validation.typed_review_contribution_sha256,
    });
  }));
}

function rawBytesBySlide(paths, plan) {
  const bytes = {};
  for (const [index, item] of plan.items.entries()) {
    const path = rawPath(paths, index + 1, item.slide_id);
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

function requireTargetSourceEpoch(context) {
  if (!Number.isInteger(context?.source_epoch) || context.source_epoch <= 0) {
    throw new PageAuthorityTargetRuntimeError("target_source_epoch_required", "current target source epoch is required for raw-review coverage");
  }
  return context.source_epoch;
}

function requireTargetReviewContribution(reviewContribution, rawWorkPlan, workflow) {
  const validation = validateTargetRawReviewContribution(reviewContribution, {
    rawWorkPlan,
    expectedWorkflow: workflow,
  });
  if (!validation.ok) throw new PageAuthorityTargetRuntimeError(validation.code, validation.message);
  return validation;
}

function currentReviewProjectionSha(paths) {
  let bytes;
  try {
    bytes = readFileSync(paths.target_raw_review_projection);
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_projection_missing", "current target raw-review projection is required");
  }
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_projection_invalid", "target raw-review projection must be a PNG");
  }
  return sha256(bytes);
}

function readTargetRawReviewRecord(paths) {
  let bytes;
  try {
    bytes = readFileSync(paths.target_raw_review);
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_required", "a current target raw review is required");
  }
  let review;
  try {
    review = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_invalid", "the target raw review record is invalid");
  }
  return Object.freeze({ review, raw_review_sha256: sha256(bytes) });
}

/** Compile provider-only facts from the current accepted immutable style selection. */
export function buildTargetRawGenerationProfile({ runDir, deckDir, receipt } = {}) {
  let styleMaster;
  try {
    styleMaster = resolveAcceptedStyleMasterReference({ runDir, deckDir, receipt });
  } catch (error) {
    const missing = error?.code === "style_master_selection_missing";
    throw new PageAuthorityTargetRuntimeError(
      missing ? "target_style_master_unavailable" : "target_style_master_stale",
      missing
        ? "a current accepted Style Master selection is required before raw planning"
        : "the current Style Master selection cannot supply immutable raw-plan reference bytes",
      { nextAction: "inspect_style_master" },
    );
  }
  const identitySelected = receipt.slides.some((slide) => slide.visual_language?.identity_reference?.provider_reference?.path);
  const profile = {
    schema: "page-authority-target-raw-generation-profile-v1",
    provider: { provider: "image2", model: "gpt-image-2", api_revision: "page-authority-image2-v2" },
    output: PAGE_AUTHORITY_NATIVE_RAW_PNG,
    reference_transport: { style_master: "image-reference-v1", identity_reference: identitySelected ? "image-reference-v1" : "none" },
    effective_style_master: {
      selection_sha256: styleMaster.selection_sha256,
      plan_sha256: styleMaster.plan_sha256,
      candidate_id: styleMaster.candidate_id,
      candidate_sha256: styleMaster.candidate_sha256,
      candidate_provenance_sha256: styleMaster.candidate_provenance_sha256,
      candidate_media_type: styleMaster.candidate_media_type,
      candidate_width: styleMaster.candidate_width,
      candidate_height: styleMaster.candidate_height,
      style_intent_sha256: styleMaster.style_intent_sha256,
      style_context_sha256: styleMaster.style_context_sha256,
      candidate_generation_profile_sha256: styleMaster.candidate_generation_profile_sha256,
      bytes: styleMaster.bytes.length,
    },
  };
  return Object.freeze({
    style_master_reference: styleMaster,
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
 * Read and validate current source through the selected adapter without
 * initializing state or materializing any derived Page Authority artifact.
 */
export function resolveTargetCandidateSourceContext(runDir, {
  workflow,
  parseReceipt,
  allowWorkflowDrift = false,
} = {}) {
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
  const parsedReceipt = parseReceipt({
    runDir: resolvedRunDir,
    deckDir: deckRoot(resolvedRunDir),
    sourcePath,
    sourceText,
  });
  const receipt = requireSourceReceipt(parsedReceipt, allowWorkflowDrift ? parsedReceipt?.workflow : workflow);
  const actualSourceSha = sha256(Buffer.from(sourceText, "utf8"));
  if (actualSourceSha !== receipt.source_sha256) {
    throw new PageAuthorityTargetRuntimeError("target_source_receipt_stale", "the selected workflow receipt does not bind current source bytes");
  }
  const paths = targetPaths(resolvedRunDir);
  return Object.freeze({
    run_dir: resolvedRunDir,
    deck_dir: deckRoot(resolvedRunDir),
    source_path: sourcePath,
    source_sha256: actualSourceSha,
    receipt,
    workflow: receipt.workflow,
    paths: Object.freeze(paths),
  });
}

/**
 * Bind an already-validated selected-workflow source candidate to the state
 * owner, then materialize its source receipt through the existing writer.
 */
export function materializeTargetSourceCandidateContext(candidate, { allowSourceRebuild = false } = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) ||
    typeof candidate.run_dir !== "string" || typeof candidate.deck_dir !== "string" ||
    typeof candidate.source_path !== "string" || typeof candidate.source_sha256 !== "string" ||
    typeof candidate.workflow !== "string") {
    throw new PageAuthorityTargetRuntimeError("target_source_candidate_invalid", "a current selected-workflow source candidate is required");
  }
  const receipt = requireSourceReceipt(candidate.receipt, candidate.workflow);
  if (candidate.source_sha256 !== receipt.source_sha256) {
    throw new PageAuthorityTargetRuntimeError("target_source_candidate_invalid", "the source candidate hash must match its selected-workflow receipt");
  }
  const runDir = resolve(candidate.run_dir);
  const deckDir = deckRoot(runDir);
  if (candidate.deck_dir !== deckDir || candidate.source_path !== join(runDir, SLIDE_SPECS_NAME)) {
    throw new PageAuthorityTargetRuntimeError("target_source_candidate_invalid", "the source candidate does not describe one canonical target run");
  }
  const paths = targetPaths(runDir);
  let state;
  try {
    state = initializeTargetPageAuthorityState(deckDir, {
      runDir,
      sourceReceipt: receipt,
    });
  } catch (error) {
    if (!allowSourceRebuild || error?.message !== "TARGET_SOURCE_STATE_IDENTITY_MISMATCH") throw error;
    // Only an explicit selected-workflow raw-plan route may invalidate a
    // current target tuple. The state writer checks source/state identity and
    // resets authorization/evidence before any new provider work can occur.
    state = advanceTargetPageAuthoritySourceEpoch(deckDir, {
      runDir,
      sourceReceipt: receipt,
    });
  }
  writeJson(paths.target_source_receipt, receipt);
  return Object.freeze({
    run_dir: runDir,
    deck_dir: deckDir,
    source_path: candidate.source_path,
    source_sha256: candidate.source_sha256,
    receipt,
    workflow: candidate.workflow,
    source_epoch: state.record.source_epoch,
    paths: Object.freeze(paths),
  });
}

/** Resolve and materialize a current source for legacy selected-workflow callers. */
export function resolveTargetSourceContext(runDir, { workflow, parseReceipt, allowSourceRebuild = false } = {}) {
  return materializeTargetSourceCandidateContext(
    resolveTargetCandidateSourceContext(runDir, { workflow, parseReceipt }),
    { allowSourceRebuild },
  );
}

/**
 * Read the last accepted target tuple alongside changed source bytes without
 * mutating state. The selected workflow decides whether the tuple is safe to
 * reuse; this shared runtime only validates typed artifacts and byte hashes.
 */
export function resolveTargetLocalComposeContext(runDir, { workflow, parseReceipt } = {}) {
  const candidate = resolveTargetCandidateSourceContext(runDir, {
    workflow,
    parseReceipt,
    allowWorkflowDrift: true,
  });
  const previousReceipt = requireSourceReceipt(
    readJson(candidate.paths.target_source_receipt, "target_previous_source_receipt_required", "previous target source receipt is required for local composition"),
    workflow,
  );
  if (candidate.workflow !== previousReceipt.workflow) {
    throw new PageAuthorityTargetRuntimeError(
      "target_workflow_switch_structural_required",
      "target workflow changes require a structural vNext preview and confirmed plan hash",
      { nextAction: "preview_target_structural_vnext" },
    );
  }
  if (candidate.receipt.slides.length !== previousReceipt.slides.length ||
    candidate.receipt.slides.some((slide, index) => slide.slide_id !== previousReceipt.slides[index]?.slide_id)) {
    throw new PageAuthorityTargetRuntimeError(
      "target_structural_versioning_required",
      "target slide membership or order changes require a structural vNext preview and confirmed plan hash",
      { nextAction: "preview_target_structural_vnext" },
    );
  }
  const previousRawWorkPlan = readJson(candidate.paths.target_raw_plan, "target_previous_raw_plan_required", "previous target raw plan is required for local composition");
  requireTargetPlan(previousRawWorkPlan, previousReceipt, workflow);
  const previousAcceptedRawEvidence = readJson(candidate.paths.target_raw_evidence, "target_accepted_raw_evidence_required", "current accepted target raw evidence is required");
  const previousEvidence = validateAcceptedRawEvidence(previousAcceptedRawEvidence, { plan: previousRawWorkPlan });
  if (!previousEvidence.ok) throw new PageAuthorityTargetRuntimeError(previousEvidence.code, previousEvidence.message);
  const rawBytes = rawBytesBySlide(candidate.paths, previousRawWorkPlan);
  for (const item of previousAcceptedRawEvidence.items) {
    if (sha256(rawBytes[item.slide_id]) !== item.raw_sha256) {
      throw new PageAuthorityTargetRuntimeError("target_accepted_raw_evidence_stale", `accepted target raw bytes drifted for ${item.slide_id}`);
    }
  }
  return Object.freeze({
    ...candidate,
    previous_source_receipt: previousReceipt,
    previous_raw_work_plan: previousRawWorkPlan,
    previous_accepted_raw_evidence: previousAcceptedRawEvidence,
    raw_bytes_by_slide: Object.freeze(rawBytes),
  });
}

/**
 * Read the narrow pre-progressive source artifacts needed by a selected
 * workflow's v3 local-rebind validator. This is observation only: canonical
 * raw bytes, provenance, and acceptance remain under the progressive owner.
 */
export function resolveTargetProgressiveLocalRebindContext(runDir, { workflow, parseReceipt } = {}) {
  const candidate = resolveTargetCandidateSourceContext(runDir, {
    workflow,
    parseReceipt,
    allowWorkflowDrift: true,
  });
  const previousReceipt = requireSourceReceipt(
    readJson(candidate.paths.target_source_receipt, "target_previous_source_receipt_required", "previous target source receipt is required for progressive local rebind"),
    workflow,
  );
  if (candidate.workflow !== previousReceipt.workflow) {
    throw new PageAuthorityTargetRuntimeError(
      "target_workflow_switch_structural_required",
      "target workflow changes require a structural vNext preview and confirmed plan hash",
      { nextAction: "preview_target_structural_vnext" },
    );
  }
  if (candidate.receipt.slides.length !== previousReceipt.slides.length ||
    candidate.receipt.slides.some((slide, index) => slide.slide_id !== previousReceipt.slides[index]?.slide_id)) {
    throw new PageAuthorityTargetRuntimeError(
      "target_structural_versioning_required",
      "target slide membership or order changes require a structural vNext preview and confirmed plan hash",
      { nextAction: "preview_target_structural_vnext" },
    );
  }
  const previousRawWorkPlan = readJson(candidate.paths.target_raw_plan, "target_previous_raw_plan_required", "previous target raw plan is required for progressive local rebind");
  requireTargetPlan(previousRawWorkPlan, previousReceipt, workflow);
  return Object.freeze({
    ...candidate,
    previous_source_receipt: previousReceipt,
    previous_raw_work_plan: previousRawWorkPlan,
  });
}

/**
 * Read one current selected-workflow plan without materializing source, plan,
 * review, authorization, or state. The selected adapter recompiles opaque
 * candidate facts; shared code compares only their typed plan identity.
 */
export function resolveTargetStoredPlanContext(runDir, {
  workflow,
  parseReceipt,
  compilePlanCandidate,
} = {}) {
  if (typeof compilePlanCandidate !== "function") {
    throw new TypeError("compilePlanCandidate must be a selected workflow plan compiler");
  }
  const candidate = resolveTargetCandidateSourceContext(runDir, { workflow, parseReceipt });
  const storedReceipt = requireSourceReceipt(
    readJson(candidate.paths.target_source_receipt, "target_source_receipt_required", "a current target source receipt is required"),
    workflow,
  );
  if (canonicalJsonSha256(storedReceipt) !== canonicalJsonSha256(candidate.receipt)) {
    throw staleTargetPlanError("target_source_receipt_stale", "the stored target source receipt does not match current source");
  }
  const storedPlan = readJson(candidate.paths.target_raw_plan, "target_raw_plan_required", "a current target raw plan is required");
  const storedPlanCheck = requireTargetPlan(storedPlan, storedReceipt, workflow);
  const compiled = compilePlanCandidate(candidate);
  const compiledPlanCheck = requireTargetPlan(compiled?.raw_work_plan, candidate.receipt, workflow);
  if (compiledPlanCheck.sha256 !== storedPlanCheck.sha256) {
    throw staleTargetPlanError("target_raw_plan_stale", "the stored target raw plan does not match current selected-workflow contracts");
  }
  // Stored-plan reads are shared by legacy and progressive adapters. They only
  // need the exact source/state tuple; a v3 handoff deliberately fences the
  // retired v2 raw authorization/evidence lifecycle from this read path.
  const state = resolveCurrentTargetPageAuthoritySourceState(candidate.deck_dir, {
    runDir: candidate.run_dir,
  });
  if (!Number.isInteger(state.source_epoch) || state.source_epoch <= 0 || state.workflow !== workflow) {
    throw new PageAuthorityTargetRuntimeError(
      state.code || "target_source_state_stale",
      "the target source state is not current for the stored raw plan",
    );
  }
  return Object.freeze({
    ...candidate,
    source_epoch: state.source_epoch,
    raw_work_plan: storedPlan,
    provider_requests_by_slide: compiled.provider_requests_by_slide,
    style_master_reference: compiled.style_master_reference,
  });
}

/** Persist a selected workflow's already-validated local-compose rebind. */
export function rebindTargetLocalComposeWork(context, {
  rawWorkPlan,
  acceptedRawEvidence,
  reviewContribution,
} = {}) {
  requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PageAuthorityTargetRuntimeError(evidence.code, evidence.message);
  const statePreflight = validateTargetAcceptedRawEvidenceLocalComposeRebind(context.deck_dir, {
    runDir: context.run_dir,
    previousSourceReceipt: context.previous_source_receipt,
    nextSourceReceipt: context.receipt,
    previousRawWorkPlan: context.previous_raw_work_plan,
    nextRawWorkPlan: rawWorkPlan,
    previousAcceptedRawEvidence: context.previous_accepted_raw_evidence,
    nextAcceptedRawEvidence: acceptedRawEvidence,
  });
  validateTargetCurrentRawReview(context, rawWorkPlan, {
    reviewContribution,
    sourceEpoch: statePreflight.source_epoch,
    acceptedRawEvidence: context.previous_accepted_raw_evidence,
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

/** Persist only derived source/plan projections after a v3 raw-owner rebind. */
export function rebindTargetProgressiveLocalComposeWork(context, {
  rawWorkPlan,
  previousProgressiveRawWorkPlan,
  nextProgressiveRawWorkPlan,
  previousAcceptedRawEvidence,
  nextAcceptedRawEvidence,
} = {}) {
  requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const state = rebindTargetProgressiveRawEvidenceForLocalCompose(context.deck_dir, {
    runDir: context.run_dir,
    previousSourceReceipt: context.previous_source_receipt,
    nextSourceReceipt: context.receipt,
    previousProgressiveRawWorkPlan,
    nextProgressiveRawWorkPlan,
    previousAcceptedRawEvidence,
    nextAcceptedRawEvidence,
  });
  writeJson(context.paths.target_source_receipt, context.receipt);
  writeJson(context.paths.target_raw_plan, rawWorkPlan);
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
    atomicWrite(rawPath(context.paths, index + 1, item.slide_id), rawBytes[item.slide_id]);
  }
  return Object.freeze({
    ...targetRawPlanProjection(context, rawWorkPlan),
    submitted: submitted.submitted,
    raw_bytes_sha256: rawBytesDigest(rawWorkPlan, rawBytes),
  });
}

function projectionLabelText(item, projectionCaptureProfile) {
  const separator = projectionCaptureProfile.profile.labels.separator;
  return `${item.position}. ${item.stable_id}${separator}${item.title}`;
}

async function renderTargetRawReview(paths, projectionItems, rawBytes, projectionCaptureProfile) {
  const profile = projectionCaptureProfile.profile;
  const layout = profile.contact_sheet;
  const label = profile.labels;
  const guide = profile.guides;
  const rows = Math.ceil(projectionItems.length / layout.columns);
  const canvas = createCanvas(
    layout.width,
    layout.padding * 2 + rows * (layout.cell_height + layout.label_height) + Math.max(0, rows - 1) * layout.row_gap,
  );
  const context = canvas.getContext("2d");
  context.fillStyle = layout.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, item] of projectionItems.entries()) {
    const x = layout.padding + (index % layout.columns) * (layout.cell_width + layout.padding);
    const y = layout.padding + Math.floor(index / layout.columns) * (layout.cell_height + layout.label_height + layout.row_gap);
    context.drawImage(await loadImage(rawBytes[item.stable_id]), x, y, layout.cell_width, layout.cell_height);
    context.save();
    context.strokeStyle = guide.rectangle.stroke;
    context.lineWidth = guide.rectangle.line_width;
    for (const primitive of item.guide_primitives) {
      context.strokeRect(
        x + primitive.x * layout.cell_width,
        y + primitive.y * layout.cell_height,
        primitive.width * layout.cell_width,
        primitive.height * layout.cell_height,
      );
    }
    context.restore();
    context.fillStyle = label.font.color;
    context.font = `${label.font.weight} ${label.font.size}px ${label.font.family}`;
    context.fillText(projectionLabelText(item, projectionCaptureProfile), x, y + layout.cell_height + label.font.baseline_offset, layout.cell_width);
  }
  const bytes = canvas.toBuffer("image/png");
  atomicWrite(paths.target_raw_review_projection, bytes);
  return sha256(bytes);
}

/** Publish a reviewable contact sheet for exact current raw bytes. */
export async function prepareTargetRawReview(context, rawWorkPlan, { reviewContribution } = {}) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const sourceEpoch = requireTargetSourceEpoch(context);
  const contribution = requireTargetReviewContribution(reviewContribution, rawWorkPlan, context.workflow);
  const projectionCaptureProfile = currentTargetRawReviewProjectionCaptureProfile();
  const projectionItems = projectTargetRawReviewContribution(rawWorkPlan, reviewContribution);
  const rawBytes = rawBytesBySlide(context.paths, rawWorkPlan);
  await renderTargetRawReview(context.paths, projectionItems, rawBytes, projectionCaptureProfile);
  const projectionSha = currentReviewProjectionSha(context.paths);
  const review = {
    schema: TARGET_RAW_REVIEW_SCHEMA,
    source_epoch: sourceEpoch,
    workflow: rawWorkPlan.workflow,
    raw_bytes_sha256: rawBytesDigest(rawWorkPlan, rawBytes),
    typed_review_contribution_sha256: contribution.typed_review_contribution_sha256,
    projection_sha256: projectionSha,
    projection_capture_profile_sha256: projectionCaptureProfile.projection_capture_profile_sha256,
    decision: null,
  };
  const reviewSha = writeJson(context.paths.target_raw_review, review);
  return Object.freeze({
    ...targetRawPlanProjection(context, rawWorkPlan),
    projection_sha256: projectionSha,
    projection_capture_profile_sha256: projectionCaptureProfile.projection_capture_profile_sha256,
    typed_review_contribution_sha256: contribution.typed_review_contribution_sha256,
    raw_review_sha256: reviewSha,
    review,
  });
}

/**
 * Rebuild a version-derived complete-review projection from canonical v3
 * bytes. The v2 plan/review files are projection inputs only here: the
 * progressive raw owner remains the only authority for attempts, grants,
 * materializations, and acceptance.
 */
export async function publishProgressiveTargetCompleteRawReview(context, rawWorkPlan, {
  raw_bytes_by_slide,
  reviewContribution,
} = {}) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  if (!raw_bytes_by_slide || typeof raw_bytes_by_slide !== "object" || Array.isArray(raw_bytes_by_slide)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_bytes_invalid", "progressive complete review requires exact raw bytes by slide");
  }
  const expected = rawWorkPlan.ordered_slide_ids;
  if (Object.keys(raw_bytes_by_slide).sort().join("\n") !== [...expected].sort().join("\n")) {
    throw new PageAuthorityTargetRuntimeError("target_raw_bytes_invalid", "progressive complete review bytes must exactly cover the selected raw plan");
  }
  for (const [index, slideId] of expected.entries()) {
    atomicWrite(rawPath(context.paths, index + 1, slideId), asBytes(raw_bytes_by_slide[slideId], `progressive raw ${slideId}`));
  }
  const prepared = await prepareTargetRawReview(context, rawWorkPlan, { reviewContribution });
  return Object.freeze({
    raw_work_plan_sha256: checked.sha256,
    workflow_evidence_sha256: prepared.typed_review_contribution_sha256,
    projection_sha256: prepared.projection_sha256,
    projection_capture_profile_sha256: prepared.projection_capture_profile_sha256,
    raw_review_sha256: prepared.raw_review_sha256,
  });
}

/**
 * Read one persisted raw-review record and prove that its current projection,
 * coverage facts, and optional accepted-evidence reference remain exact.
 */
export function validateTargetCurrentRawReview(context, rawWorkPlan, {
  reviewContribution,
  sourceEpoch = context?.source_epoch ?? null,
  acceptedRawEvidence = null,
} = {}) {
  const checked = requireTargetPlan(rawWorkPlan, context.receipt, context.workflow);
  const currentSourceEpoch = requireTargetSourceEpoch({ source_epoch: sourceEpoch });
  const contribution = requireTargetReviewContribution(reviewContribution, rawWorkPlan, context.workflow);
  const projectionCaptureProfile = currentTargetRawReviewProjectionCaptureProfile();
  const { review, raw_review_sha256: rawReviewSha } = readTargetRawReviewRecord(context.paths);
  const rawBytes = rawBytesBySlide(context.paths, rawWorkPlan);
  if (!reviewShape(review) || review.source_epoch !== currentSourceEpoch || review.workflow !== rawWorkPlan.workflow ||
    review.raw_bytes_sha256 !== rawBytesDigest(rawWorkPlan, rawBytes) ||
    review.typed_review_contribution_sha256 !== contribution.typed_review_contribution_sha256 ||
    review.projection_capture_profile_sha256 !== projectionCaptureProfile.projection_capture_profile_sha256 ||
    review.projection_sha256 !== currentReviewProjectionSha(context.paths)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_stale", "the target raw review no longer binds current coverage");
  }
  if (acceptedRawEvidence !== null) {
    const accepted = validateAcceptedRawEvidence(acceptedRawEvidence);
    if (!accepted.ok || acceptedRawEvidence.raw_review_sha256 !== rawReviewSha || review.decision !== "proceed") {
      throw new PageAuthorityTargetRuntimeError("target_raw_review_stale", "the target raw review is not the accepted current coverage");
    }
  }
  return Object.freeze({
    checked,
    review,
    rawBytes: Object.freeze(rawBytes),
    contribution,
    projectionCaptureProfile,
    raw_review_sha256: rawReviewSha,
  });
}

function currentTargetReview(context, rawWorkPlan, { reviewContribution } = {}) {
  return validateTargetCurrentRawReview(context, rawWorkPlan, { reviewContribution });
}

/** Record a human raw decision; proceed alone publishes accepted evidence. */
export function decideTargetRawReview(context, rawWorkPlan, { decision, reviewContribution } = {}) {
  if (!["proceed", "repair", "redirect"].includes(decision)) {
    throw new PageAuthorityTargetRuntimeError("target_raw_review_decision_invalid", "decision must be proceed, repair, or redirect");
  }
  const { checked, review, rawBytes } = currentTargetReview(context, rawWorkPlan, { reviewContribution });
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

/**
 * Persist a rebuildable final-manifest projection from v3 accepted evidence.
 * The raw owner and the state handoff are deliberately separate writers.
 */
export function writeProgressiveTargetFinalManifest(context, {
  progressiveRawWorkPlan,
  acceptedRawEvidence,
  finalManifest,
} = {}) {
  const plan = validateRawWorkPlanForFinalization(progressiveRawWorkPlan);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: progressiveRawWorkPlan });
  const final = validateFinalSlideManifest(finalManifest, {
    evidence: acceptedRawEvidence,
    expectedWorkflow: context.workflow,
  });
  if (!plan.ok || !evidence.ok || !final.ok ||
    progressiveRawWorkPlan.workflow !== context.workflow ||
    progressiveRawWorkPlan.source_receipt_sha256 !== context.receipt.source_sha256 ||
    progressiveRawWorkPlan.source_epoch !== context.source_epoch) {
    throw new PageAuthorityTargetRuntimeError(
      final.code || evidence.code || plan.code || "target_progressive_final_manifest_invalid",
      "the progressive final manifest is invalid or does not bind the current selected workflow",
    );
  }
  writeJson(context.paths.target_final_manifest, finalManifest);
  return Object.freeze({ final_manifest: finalManifest, final_manifest_sha256: final.sha256 });
}

/** Persist delivery lineage only after the shared delivery owner returns its receipt. */
export function recordTargetDelivery(context, deliveryReceipt) {
  recordTargetDeliveryReceipt(context.deck_dir, { runDir: context.run_dir, deliveryReceipt });
  return Object.freeze({ delivery_receipt: deliveryReceipt, delivery_receipt_sha256: canonicalJsonSha256(deliveryReceipt) });
}
