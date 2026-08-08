/**
 * Rebuildable Complete Page Review presentation artifacts.
 *
 * The selected adapter supplies already-rendered review bytes and opaque
 * binding facts. This module only persists and verifies those bytes; it does
 * not compile Framed/Pure prompts or render workflow-specific semantics.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { pageImageOrdinalImageFilename } from "./page_image_artifacts.mjs";
import { createPngRasterProjectionCanvas } from "./png_raster_projection.mjs";
import { pageImageWorkflowPaths } from "../run-bundle/page_image_paths.mjs";

export const PAGE_IMAGE_COMPLETE_PAGE_REVIEW_PRESENTATION_SCHEMA = "page-image-complete-page-review-presentation-v1";
export const PAGE_IMAGE_PILOT_PAGE_REVIEW_PRESENTATION_SCHEMA = "page-image-pilot-page-review-presentation-v1";
export const PAGE_IMAGE_COMPLETE_PAGE_REVIEW_CAPTURE_PROFILE_SCHEMA = "page-image-complete-page-review-capture-profile-v1";

const SHA256_RE = /^[0-9a-f]{64}$/;
const WORKFLOWS = new Set(["framed", "pure"]);
const PRESENTATION_ITEM_KEYS = Object.freeze([
  "slide_id",
  "raw_provider_page_sha256",
  "complete_page_sha256",
  "adapter_complete_page_binding_sha256",
]);
const PRESENTATION_KEYS = Object.freeze([
  "schema",
  "raw_work_plan_sha256",
  "source_epoch",
  "workflow",
  "typed_review_contribution_sha256",
  "projection_sha256",
  "projection_capture_profile_sha256",
  "has_complete_page_artifact",
  "items",
]);
const PILOT_PRESENTATION_KEYS = Object.freeze([
  ...PRESENTATION_KEYS,
  "batch_sha256",
]);

const CAPTURE_PROFILE = Object.freeze({
  schema: PAGE_IMAGE_COMPLETE_PAGE_REVIEW_CAPTURE_PROFILE_SCHEMA,
  provider_page: { width: 500, height: 281 },
  complete_page: { width: 500, height: 281 },
  padding: 16,
  label_height: 34,
  row_gap: 16,
  background: "#ffffff",
  label: { family: "Arial", weight: 700, size: 16, color: "#17212b", baseline_offset: 22 },
  capture: { format: "png", encoder: "napi-rs-canvas-v1" },
});

export class PageImageCompletePageReviewError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageCompletePageReviewError";
    this.code = code;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function requireDigest(value, label) {
  if (!SHA256_RE.test(value || "")) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", `${label} must be a lowercase SHA-256`);
  }
}

function requireBytes(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", `${label} must be nonempty bytes`);
  }
  const bytes = Buffer.from(value);
  if (bytes.length === 0) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", `${label} must be nonempty bytes`);
  }
  return bytes;
}

function requireOrderedSlideIds(orderedSlideIds) {
  if (!Array.isArray(orderedSlideIds) || orderedSlideIds.length === 0 ||
    orderedSlideIds.some((slideId) => typeof slideId !== "string" || !slideId) ||
    new Set(orderedSlideIds).size !== orderedSlideIds.length) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", "ordered slide IDs must be a nonempty unique list");
  }
  return orderedSlideIds;
}

function requireExactByteMap(value, orderedSlideIds, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    canonicalJson(Object.keys(value).sort()) !== canonicalJson([...orderedSlideIds].sort())) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", `${label} must cover the current ordered slide IDs exactly`);
  }
  return Object.fromEntries(orderedSlideIds.map((slideId) => [slideId, requireBytes(value[slideId], `${label} ${slideId}`)]));
}

function requireExactBindingMap(value, orderedSlideIds) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    canonicalJson(Object.keys(value).sort()) !== canonicalJson([...orderedSlideIds].sort())) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", "adapter complete-page bindings must cover the current ordered slide IDs exactly");
  }
  return Object.fromEntries(orderedSlideIds.map((slideId) => {
    requireDigest(value[slideId], `adapter complete-page binding for ${slideId}`);
    return [slideId, value[slideId]];
  }));
}

function atomicWrite(pathname, bytes) {
  mkdirSync(dirname(pathname), { recursive: true });
  const temporary = join(dirname(pathname), `.${basename(pathname)}.${process.pid}.tmp`);
  writeFileSync(temporary, bytes);
  renameSync(temporary, pathname);
}

function presentationPaths(runDir, rawWorkPlanSha256) {
  requireDigest(rawWorkPlanSha256, "raw work plan digest");
  const root = join(pageImageWorkflowPaths(runDir).review_root, "complete-page", rawWorkPlanSha256);
  return Object.freeze({
    root,
    provider_page_root: join(root, "provider-page"),
    complete_page_root: join(root, "complete-page"),
    projection: join(root, "complete-page-review.png"),
    evidence: join(root, "complete-page-review-evidence-v1.json"),
  });
}

function pilotPresentationPaths(runDir, batchSha256) {
  requireDigest(batchSha256, "Pilot batch digest");
  const root = join(pageImageWorkflowPaths(runDir).review_root, "pilot", batchSha256);
  return Object.freeze({
    root,
    provider_page_root: join(root, "provider-page"),
    complete_page_root: join(root, "complete-page"),
    projection: join(root, "pilot-page-review.png"),
    evidence: join(root, "pilot-page-review-evidence-v1.json"),
  });
}

function captureProfile() {
  return Object.freeze({
    profile: CAPTURE_PROFILE,
    projection_capture_profile_sha256: canonicalJsonSha256(CAPTURE_PROFILE),
  });
}

function readPngDigest(pathname, code) {
  let bytes;
  try {
    bytes = readFileSync(pathname);
  } catch {
    throw new PageImageCompletePageReviewError(code, "complete page review artifact is unavailable");
  }
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new PageImageCompletePageReviewError(code, "complete page review artifact must be a PNG");
  }
  return Object.freeze({ bytes, sha256: sha256(bytes) });
}

async function renderProjection(paths, orderedSlideIds, rawBytesBySlide, completeBytesBySlide, positionsBySlide = null) {
  const profile = CAPTURE_PROFILE;
  const hasCompletePage = completeBytesBySlide !== null;
  const columns = hasCompletePage ? 2 : 1;
  const pageWidth = profile.provider_page.width;
  const pageHeight = profile.provider_page.height;
  const rowHeight = pageHeight + profile.label_height;
  const canvas = createCanvas(
    profile.padding * 2 + columns * pageWidth + (columns - 1) * profile.padding,
    profile.padding * 2 + orderedSlideIds.length * rowHeight + Math.max(0, orderedSlideIds.length - 1) * profile.row_gap,
  );
  const context = canvas.getContext("2d");
  context.fillStyle = profile.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = `${profile.label.weight} ${profile.label.size}px ${profile.label.family}`;
  context.fillStyle = profile.label.color;

  try {
    for (const [index, slideId] of orderedSlideIds.entries()) {
      const y = profile.padding + index * (rowHeight + profile.row_gap);
      const rawX = profile.padding;
      const position = positionsBySlide?.[slideId] ?? index + 1;
      context.drawImage(createPngRasterProjectionCanvas(rawBytesBySlide[slideId]), rawX, y, pageWidth, pageHeight);
      context.fillText(`${position}. ${slideId} | provider page`, rawX, y + pageHeight + profile.label.baseline_offset, pageWidth);
      if (hasCompletePage) {
        const completeX = rawX + pageWidth + profile.padding;
        context.drawImage(createPngRasterProjectionCanvas(completeBytesBySlide[slideId]), completeX, y, pageWidth, pageHeight);
        context.fillText(`${position}. ${slideId} | complete page`, completeX, y + pageHeight + profile.label.baseline_offset, pageWidth);
      }
    }
  } catch (error) {
    throw new PageImageCompletePageReviewError(
      "complete_page_review_projection_invalid",
      error?.message || "complete page review images could not be rendered",
    );
  }
  const bytes = canvas.toBuffer("image/png");
  atomicWrite(paths.projection, bytes);
  return sha256(bytes);
}

function requirePilotSlideIds(orderedPlanSlideIds, pilotSlideIds) {
  const fullPlan = requireOrderedSlideIds(orderedPlanSlideIds);
  const pilot = requireOrderedSlideIds(pilotSlideIds);
  const expected = fullPlan.filter((slideId) => pilot.includes(slideId));
  if (canonicalJson(expected) !== canonicalJson(pilot)) {
    throw new PageImageCompletePageReviewError(
      "pilot_page_review_invalid",
      "Pilot slide IDs must be a nonempty ordered subset of the current full plan",
    );
  }
  return Object.freeze({
    full_plan: fullPlan,
    pilot,
    positions_by_slide: Object.freeze(Object.fromEntries(fullPlan.map((slideId, index) => [slideId, index + 1]))),
  });
}

function buildPresentation({
  rawWorkPlanSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  projectionSha256,
  projectionCaptureProfileSha256,
  hasCompletePageArtifact,
  orderedSlideIds,
  rawBytesBySlide,
  completeBytesBySlide,
  adapterCompletePageBindingsBySlide,
}) {
  return Object.freeze({
    schema: PAGE_IMAGE_COMPLETE_PAGE_REVIEW_PRESENTATION_SCHEMA,
    raw_work_plan_sha256: rawWorkPlanSha256,
    source_epoch: sourceEpoch,
    workflow,
    typed_review_contribution_sha256: typedReviewContributionSha256,
    projection_sha256: projectionSha256,
    projection_capture_profile_sha256: projectionCaptureProfileSha256,
    has_complete_page_artifact: hasCompletePageArtifact,
    items: orderedSlideIds.map((slideId) => Object.freeze({
      slide_id: slideId,
      raw_provider_page_sha256: sha256(rawBytesBySlide[slideId]),
      complete_page_sha256: sha256(completeBytesBySlide?.[slideId] ?? rawBytesBySlide[slideId]),
      adapter_complete_page_binding_sha256: adapterCompletePageBindingsBySlide[slideId],
    })),
  });
}

function buildPilotPresentation({
  rawWorkPlanSha256,
  batchSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  projectionSha256,
  projectionCaptureProfileSha256,
  hasCompletePageArtifact,
  pilotSlideIds,
  rawBytesBySlide,
  completeBytesBySlide,
  adapterCompletePageBindingsBySlide,
}) {
  return Object.freeze({
    schema: PAGE_IMAGE_PILOT_PAGE_REVIEW_PRESENTATION_SCHEMA,
    raw_work_plan_sha256: rawWorkPlanSha256,
    batch_sha256: batchSha256,
    source_epoch: sourceEpoch,
    workflow,
    typed_review_contribution_sha256: typedReviewContributionSha256,
    projection_sha256: projectionSha256,
    projection_capture_profile_sha256: projectionCaptureProfileSha256,
    has_complete_page_artifact: hasCompletePageArtifact,
    items: pilotSlideIds.map((slideId) => Object.freeze({
      slide_id: slideId,
      raw_provider_page_sha256: sha256(rawBytesBySlide[slideId]),
      complete_page_sha256: sha256(completeBytesBySlide?.[slideId] ?? rawBytesBySlide[slideId]),
      adapter_complete_page_binding_sha256: adapterCompletePageBindingsBySlide[slideId],
    })),
  });
}

/** Write the selected adapter's one complete-page review representation. */
export async function publishCompletePageReviewPresentation({
  runDir,
  rawWorkPlanSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  orderedSlideIds,
  rawBytesBySlide,
  completeBytesBySlide = null,
  adapterCompletePageBindingsBySlide,
} = {}) {
  requireDigest(rawWorkPlanSha256, "raw work plan digest");
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", "source epoch must be positive");
  }
  if (!WORKFLOWS.has(workflow)) {
    throw new PageImageCompletePageReviewError("complete_page_review_invalid", "workflow must be framed | pure");
  }
  requireDigest(typedReviewContributionSha256, "typed review contribution digest");
  const ids = requireOrderedSlideIds(orderedSlideIds);
  const raw = requireExactByteMap(rawBytesBySlide, ids, "provider pages");
  const complete = completeBytesBySlide === null ? null : requireExactByteMap(completeBytesBySlide, ids, "complete pages");
  if ((workflow === "framed") !== (complete !== null)) {
    throw new PageImageCompletePageReviewError(
      "complete_page_review_invalid",
      workflow === "framed"
        ? "Framed Complete Page Review requires a production-equivalent complete page"
        : "Pure Complete Page Review must use its provider page as the only complete page",
    );
  }
  const bindings = requireExactBindingMap(adapterCompletePageBindingsBySlide, ids);
  const paths = presentationPaths(runDir, rawWorkPlanSha256);

  for (const [index, slideId] of ids.entries()) {
    const filename = pageImageOrdinalImageFilename(index + 1, slideId);
    atomicWrite(join(paths.provider_page_root, filename), raw[slideId]);
    if (complete !== null) atomicWrite(join(paths.complete_page_root, filename), complete[slideId]);
  }
  const projectionSha256 = await renderProjection(paths, ids, raw, complete);
  const profile = captureProfile();
  const presentation = buildPresentation({
    rawWorkPlanSha256,
    sourceEpoch,
    workflow,
    typedReviewContributionSha256,
    projectionSha256,
    projectionCaptureProfileSha256: profile.projection_capture_profile_sha256,
    hasCompletePageArtifact: complete !== null,
    orderedSlideIds: ids,
    rawBytesBySlide: raw,
    completeBytesBySlide: complete,
    adapterCompletePageBindingsBySlide: bindings,
  });
  atomicWrite(paths.evidence, Buffer.from(`${canonicalJson(presentation)}\n`, "utf8"));
  const validation = validateCompletePageReviewPresentation({
    runDir,
    rawWorkPlanSha256,
    sourceEpoch,
    workflow,
    typedReviewContributionSha256,
    orderedSlideIds: ids,
    rawBytesBySlide: raw,
    adapterCompletePageBindingsBySlide: bindings,
  });
  if (!validation.ok) throw new PageImageCompletePageReviewError(validation.code, validation.message);
  return Object.freeze({
    presentation,
    complete_page_presentation_sha256: validation.complete_page_presentation_sha256,
    projection_sha256: projectionSha256,
    projection_capture_profile_sha256: profile.projection_capture_profile_sha256,
    root: paths.root,
  });
}

/** Verify a persisted Complete Page Review representation against current bytes. */
export function validateCompletePageReviewPresentation({
  runDir,
  rawWorkPlanSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  orderedSlideIds,
  rawBytesBySlide,
  adapterCompletePageBindingsBySlide,
} = {}) {
  try {
    requireDigest(rawWorkPlanSha256, "raw work plan digest");
    if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
      throw new PageImageCompletePageReviewError("complete_page_review_invalid", "source epoch must be positive");
    }
    if (!WORKFLOWS.has(workflow)) {
      throw new PageImageCompletePageReviewError("complete_page_review_invalid", "workflow must be framed | pure");
    }
    requireDigest(typedReviewContributionSha256, "typed review contribution digest");
    const ids = requireOrderedSlideIds(orderedSlideIds);
    const raw = requireExactByteMap(rawBytesBySlide, ids, "provider pages");
    const bindings = requireExactBindingMap(adapterCompletePageBindingsBySlide, ids);
    const paths = presentationPaths(runDir, rawWorkPlanSha256);
    const evidenceBytes = readFileSync(paths.evidence);
    let presentation;
    try {
      presentation = JSON.parse(evidenceBytes.toString("utf8"));
    } catch {
      throw new PageImageCompletePageReviewError("complete_page_review_invalid", "complete page review evidence is not valid JSON");
    }
    if (!evidenceBytes.equals(Buffer.from(`${canonicalJson(presentation)}\n`, "utf8")) ||
      !exactKeys(presentation, PRESENTATION_KEYS) ||
      presentation.schema !== PAGE_IMAGE_COMPLETE_PAGE_REVIEW_PRESENTATION_SCHEMA ||
      presentation.raw_work_plan_sha256 !== rawWorkPlanSha256 ||
      presentation.source_epoch !== sourceEpoch ||
      presentation.workflow !== workflow ||
      presentation.typed_review_contribution_sha256 !== typedReviewContributionSha256 ||
      !SHA256_RE.test(presentation.projection_sha256 || "") ||
      presentation.projection_capture_profile_sha256 !== captureProfile().projection_capture_profile_sha256 ||
      typeof presentation.has_complete_page_artifact !== "boolean" ||
      presentation.has_complete_page_artifact !== (workflow === "framed") ||
      !Array.isArray(presentation.items) || presentation.items.length !== ids.length) {
      throw new PageImageCompletePageReviewError("complete_page_review_stale", "complete page review evidence no longer binds the current review inputs");
    }
    for (const [index, slideId] of ids.entries()) {
      const item = presentation.items[index];
      if (!exactKeys(item, PRESENTATION_ITEM_KEYS) || item.slide_id !== slideId ||
        item.raw_provider_page_sha256 !== sha256(raw[slideId]) ||
        item.adapter_complete_page_binding_sha256 !== bindings[slideId] ||
        !SHA256_RE.test(item.complete_page_sha256 || "")) {
        throw new PageImageCompletePageReviewError("complete_page_review_stale", "complete page review evidence no longer binds current page bytes");
      }
      const filename = pageImageOrdinalImageFilename(index + 1, slideId);
      if (readPngDigest(join(paths.provider_page_root, filename), "complete_page_review_stale").sha256 !== item.raw_provider_page_sha256) {
        throw new PageImageCompletePageReviewError("complete_page_review_stale", "persisted provider page differs from complete page review evidence");
      }
      if (presentation.has_complete_page_artifact) {
        if (readPngDigest(join(paths.complete_page_root, filename), "complete_page_review_stale").sha256 !== item.complete_page_sha256) {
          throw new PageImageCompletePageReviewError("complete_page_review_stale", "persisted complete page differs from complete page review evidence");
        }
      } else if (item.complete_page_sha256 !== item.raw_provider_page_sha256) {
        throw new PageImageCompletePageReviewError("complete_page_review_stale", "provider-only complete page evidence cannot name a second page digest");
      }
    }
    if (readPngDigest(paths.projection, "complete_page_review_stale").sha256 !== presentation.projection_sha256) {
      throw new PageImageCompletePageReviewError("complete_page_review_stale", "complete page review projection differs from its evidence");
    }
    return Object.freeze({
      ok: true,
      presentation: Object.freeze(presentation),
      complete_page_presentation_sha256: canonicalJsonSha256(presentation),
      projection_sha256: presentation.projection_sha256,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "complete_page_review_invalid",
      message: error.message || "complete page review evidence is invalid",
    });
  }
}

/** Write a Pilot-only sample using the same selected-policy page representation. */
export async function publishPilotPageReviewPresentation({
  runDir,
  rawWorkPlanSha256,
  batchSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  orderedPlanSlideIds,
  pilotSlideIds,
  rawBytesBySlide,
  completeBytesBySlide = null,
  adapterCompletePageBindingsBySlide,
} = {}) {
  requireDigest(rawWorkPlanSha256, "raw work plan digest");
  requireDigest(batchSha256, "Pilot batch digest");
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PageImageCompletePageReviewError("pilot_page_review_invalid", "source epoch must be positive");
  }
  if (!WORKFLOWS.has(workflow)) {
    throw new PageImageCompletePageReviewError("pilot_page_review_invalid", "workflow must be framed | pure");
  }
  requireDigest(typedReviewContributionSha256, "typed Pilot review contribution digest");
  const selection = requirePilotSlideIds(orderedPlanSlideIds, pilotSlideIds);
  const raw = requireExactByteMap(rawBytesBySlide, selection.pilot, "Pilot provider pages");
  const complete = completeBytesBySlide === null ? null : requireExactByteMap(completeBytesBySlide, selection.pilot, "Pilot complete pages");
  if ((workflow === "framed") !== (complete !== null)) {
    throw new PageImageCompletePageReviewError(
      "pilot_page_review_invalid",
      workflow === "framed"
        ? "Framed Pilot review requires a production-equivalent complete page"
        : "Pure Pilot review must use its provider page as the only complete page",
    );
  }
  const bindings = requireExactBindingMap(adapterCompletePageBindingsBySlide, selection.pilot);
  const paths = pilotPresentationPaths(runDir, batchSha256);

  for (const slideId of selection.pilot) {
    const filename = pageImageOrdinalImageFilename(selection.positions_by_slide[slideId], slideId);
    atomicWrite(join(paths.provider_page_root, filename), raw[slideId]);
    if (complete !== null) atomicWrite(join(paths.complete_page_root, filename), complete[slideId]);
  }
  const projectionSha256 = await renderProjection(
    paths,
    selection.pilot,
    raw,
    complete,
    selection.positions_by_slide,
  );
  const profile = captureProfile();
  const presentation = buildPilotPresentation({
    rawWorkPlanSha256,
    batchSha256,
    sourceEpoch,
    workflow,
    typedReviewContributionSha256,
    projectionSha256,
    projectionCaptureProfileSha256: profile.projection_capture_profile_sha256,
    hasCompletePageArtifact: complete !== null,
    pilotSlideIds: selection.pilot,
    rawBytesBySlide: raw,
    completeBytesBySlide: complete,
    adapterCompletePageBindingsBySlide: bindings,
  });
  atomicWrite(paths.evidence, Buffer.from(`${canonicalJson(presentation)}\n`, "utf8"));
  const validation = validatePilotPageReviewPresentation({
    runDir,
    rawWorkPlanSha256,
    batchSha256,
    sourceEpoch,
    workflow,
    typedReviewContributionSha256,
    orderedPlanSlideIds: selection.full_plan,
    pilotSlideIds: selection.pilot,
    rawBytesBySlide: raw,
    adapterCompletePageBindingsBySlide: bindings,
  });
  if (!validation.ok) throw new PageImageCompletePageReviewError(validation.code, validation.message);
  return Object.freeze({
    presentation,
    pilot_page_presentation_sha256: validation.pilot_page_presentation_sha256,
    projection_sha256: projectionSha256,
    projection_capture_profile_sha256: profile.projection_capture_profile_sha256,
    root: paths.root,
  });
}

/** Verify a persisted Pilot sample representation against its exact current batch. */
export function validatePilotPageReviewPresentation({
  runDir,
  rawWorkPlanSha256,
  batchSha256,
  sourceEpoch,
  workflow,
  typedReviewContributionSha256,
  orderedPlanSlideIds,
  pilotSlideIds,
  rawBytesBySlide,
  adapterCompletePageBindingsBySlide,
} = {}) {
  try {
    requireDigest(rawWorkPlanSha256, "raw work plan digest");
    requireDigest(batchSha256, "Pilot batch digest");
    if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
      throw new PageImageCompletePageReviewError("pilot_page_review_invalid", "source epoch must be positive");
    }
    if (!WORKFLOWS.has(workflow)) {
      throw new PageImageCompletePageReviewError("pilot_page_review_invalid", "workflow must be framed | pure");
    }
    requireDigest(typedReviewContributionSha256, "typed Pilot review contribution digest");
    const selection = requirePilotSlideIds(orderedPlanSlideIds, pilotSlideIds);
    const raw = requireExactByteMap(rawBytesBySlide, selection.pilot, "Pilot provider pages");
    const bindings = requireExactBindingMap(adapterCompletePageBindingsBySlide, selection.pilot);
    const paths = pilotPresentationPaths(runDir, batchSha256);
    const evidenceBytes = readFileSync(paths.evidence);
    let presentation;
    try {
      presentation = JSON.parse(evidenceBytes.toString("utf8"));
    } catch {
      throw new PageImageCompletePageReviewError("pilot_page_review_invalid", "Pilot page review evidence is not valid JSON");
    }
    if (!evidenceBytes.equals(Buffer.from(`${canonicalJson(presentation)}\n`, "utf8")) ||
      !exactKeys(presentation, PILOT_PRESENTATION_KEYS) ||
      presentation.schema !== PAGE_IMAGE_PILOT_PAGE_REVIEW_PRESENTATION_SCHEMA ||
      presentation.raw_work_plan_sha256 !== rawWorkPlanSha256 ||
      presentation.batch_sha256 !== batchSha256 ||
      presentation.source_epoch !== sourceEpoch ||
      presentation.workflow !== workflow ||
      presentation.typed_review_contribution_sha256 !== typedReviewContributionSha256 ||
      !SHA256_RE.test(presentation.projection_sha256 || "") ||
      presentation.projection_capture_profile_sha256 !== captureProfile().projection_capture_profile_sha256 ||
      typeof presentation.has_complete_page_artifact !== "boolean" ||
      presentation.has_complete_page_artifact !== (workflow === "framed") ||
      !Array.isArray(presentation.items) || presentation.items.length !== selection.pilot.length) {
      throw new PageImageCompletePageReviewError("pilot_page_review_stale", "Pilot page review evidence no longer binds the current review inputs");
    }
    for (const [index, slideId] of selection.pilot.entries()) {
      const item = presentation.items[index];
      if (!exactKeys(item, PRESENTATION_ITEM_KEYS) || item.slide_id !== slideId ||
        item.raw_provider_page_sha256 !== sha256(raw[slideId]) ||
        item.adapter_complete_page_binding_sha256 !== bindings[slideId] ||
        !SHA256_RE.test(item.complete_page_sha256 || "")) {
        throw new PageImageCompletePageReviewError("pilot_page_review_stale", "Pilot page review evidence no longer binds current page bytes");
      }
      const filename = pageImageOrdinalImageFilename(selection.positions_by_slide[slideId], slideId);
      if (readPngDigest(join(paths.provider_page_root, filename), "pilot_page_review_stale").sha256 !== item.raw_provider_page_sha256) {
        throw new PageImageCompletePageReviewError("pilot_page_review_stale", "persisted provider page differs from Pilot page review evidence");
      }
      if (presentation.has_complete_page_artifact) {
        if (readPngDigest(join(paths.complete_page_root, filename), "pilot_page_review_stale").sha256 !== item.complete_page_sha256) {
          throw new PageImageCompletePageReviewError("pilot_page_review_stale", "persisted complete page differs from Pilot page review evidence");
        }
      } else if (item.complete_page_sha256 !== item.raw_provider_page_sha256) {
        throw new PageImageCompletePageReviewError("pilot_page_review_stale", "provider-only Pilot evidence cannot name a second page digest");
      }
    }
    if (readPngDigest(paths.projection, "pilot_page_review_stale").sha256 !== presentation.projection_sha256) {
      throw new PageImageCompletePageReviewError("pilot_page_review_stale", "Pilot page review projection differs from its evidence");
    }
    return Object.freeze({
      ok: true,
      presentation: Object.freeze(presentation),
      pilot_page_presentation_sha256: canonicalJsonSha256(presentation),
      projection_sha256: presentation.projection_sha256,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "pilot_page_review_invalid",
      message: error.message || "Pilot page review evidence is invalid",
    });
  }
}
