import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isHeroVisualType,
  normalizeVisualType,
  presentHeaderText,
} from "./render_policy.mjs";
import {
  readImageManifest,
  generationFingerprint,
  sha256Bytes,
  sha256File,
  stableJson,
} from "./image_provenance.mjs";

export const HEADER_REVIEW_NODE = "header-review";

export function versionKey(deckRoot, runDir) {
  return relative(deckRoot, runDir).split(sep).join("/");
}

function headerFields(slide) {
  return {
    kicker: presentHeaderText(slide.kicker) || null,
    title: presentHeaderText(slide.headline ?? slide.title) || null,
    subtitle: presentHeaderText(slide.subtitle) || null,
  };
}

export function buildHeaderReviewInputs(slides, visualConfig) {
  const fullPageHeaderSnapshot = {};
  const contentFullPageIds = [];
  for (const slide of slides) {
    const id = String(slide.id || "").trim();
    if (!id || slide.layout_contract?.render_mode !== "full-page") continue;
    const hero = isHeroVisualType(slide.visual_type);
    fullPageHeaderSnapshot[id] = {
      render_mode: "full-page",
      visual_type: normalizeVisualType(slide.visual_type) || null,
      hero,
      ...headerFields(slide),
    };
    if (!hero) contentFullPageIds.push(id);
  }
  const geometry = {
    canvas: visualConfig.canvas,
    body_header_safe_zone: visualConfig.header_lock.body_header_safe_zone,
    position: visualConfig.header_lock.position,
    kicker: visualConfig.header_lock.kicker,
    title: visualConfig.header_lock.title,
    subtitle: visualConfig.header_lock.subtitle,
    alignment: "left",
  };
  const fingerprint = sha256Bytes(stableJson({
    full_page_header_snapshot: fullPageHeaderSnapshot,
    content_header_geometry: geometry,
  }));
  return {
    headerReviewFingerprint: fingerprint,
    fullPageHeaderSnapshot,
    contentFullPageIds,
    fullPageIds: Object.keys(fullPageHeaderSnapshot),
    contentHeaderGeometry: geometry,
  };
}

export function changedFullPageIds(previousSnapshot = {}, currentSnapshot = {}) {
  const ids = new Set([...Object.keys(previousSnapshot || {}), ...Object.keys(currentSnapshot || {})]);
  return [...ids].filter((id) => !isDeepStrictEqual(previousSnapshot?.[id], currentSnapshot?.[id])).sort();
}

export function requiredContentReviewCount(contentFullPageIds) {
  return Math.min(2, contentFullPageIds.length);
}

export function sameGenerationProfile(a, b) {
  return Boolean(a && b && stableJson(a) === stableJson(b));
}

export function collectPilotProvenance({
  selectedIds,
  prompts,
  imagesDir,
  currentStyleReferenceSha256 = null,
}) {
  const promptById = new Map((prompts || []).map((slide) => [slide.id, slide]));
  const { manifest, error } = readImageManifest(imagesDir);
  if (error) throw new Error(error);
  const entries = {};
  let profile = null;
  for (const id of selectedIds) {
    const prompt = promptById.get(id);
    const entry = manifest.slides?.[id];
    if (!prompt) throw new Error(`pilot id ${id} is missing from current prompts`);
    if (!entry) throw new Error(`pilot id ${id} has no raw-image manifest entry`);
    const imagePath = join(imagesDir, entry.output);
    if (!existsSync(imagePath)) throw new Error(`pilot image missing for ${id}: ${entry.output}`);
    if (sha256File(imagePath) !== entry.image_sha256) {
      throw new Error(`pilot image SHA-256 mismatch for ${id}`);
    }
    if (!profile) profile = entry.generation_profile;
    else if (!sameGenerationProfile(profile, entry.generation_profile)) {
      throw new Error("pilot images use mixed generation profiles");
    }
    if (
      currentStyleReferenceSha256 &&
      entry.generation_profile?.style_reference_sha256 !== currentStyleReferenceSha256
    ) {
      throw new Error(`pilot style-reference provenance is stale for ${id}`);
    }
    const expectedFingerprint = generationFingerprint({
      prompt: String(prompt.prompt || "").trim(),
      profile: entry.generation_profile,
    });
    if (entry.generation_fingerprint !== expectedFingerprint) {
      throw new Error(`pilot provenance is stale for ${id}`);
    }
    entries[id] = {
      output: entry.output,
      generation_fingerprint: entry.generation_fingerprint,
      image_sha256: entry.image_sha256,
      generation_profile: entry.generation_profile,
    };
  }
  return { entries, profile };
}

export function mergeHeaderReviewRecord({
  previousRecord = null,
  inputs,
  reviewedIds = [],
  provenanceEntries = {},
  profile,
  acceptedRisks = {},
}) {
  const previousSnapshot = previousRecord?.full_page_header_snapshot || {};
  const sameReview = previousRecord &&
    previousRecord.header_review_fingerprint === inputs.headerReviewFingerprint &&
    sameGenerationProfile(previousRecord.generation_profile, profile);
  const changedIds = sameReview
    ? [...(previousRecord.changed_full_page_ids || [])]
    : previousRecord
      ? changedFullPageIds(previousSnapshot, inputs.fullPageHeaderSnapshot)
      : [];
  const record = sameReview ? structuredClone(previousRecord) : {
    status: "in_progress",
    reviewed_content_full_page_ids: [],
    reviewed_changed_full_page_ids: [],
    reviewed_image_provenance: {},
    accepted_risks: {},
  };
  record.header_review_fingerprint = inputs.headerReviewFingerprint;
  record.full_page_header_snapshot = inputs.fullPageHeaderSnapshot;
  record.generation_profile = profile;
  record.reviewed_content_full_page_ids = [...new Set([
    ...(record.reviewed_content_full_page_ids || []),
    ...reviewedIds.filter((id) => inputs.contentFullPageIds.includes(id)),
  ])].sort();
  record.reviewed_changed_full_page_ids = [...new Set([
    ...(record.reviewed_changed_full_page_ids || []),
    ...reviewedIds.filter((id) => changedIds.includes(id)),
  ])].sort();
  record.reviewed_image_provenance = {
    ...(record.reviewed_image_provenance || {}),
    ...provenanceEntries,
  };
  record.accepted_risks = { ...(record.accepted_risks || {}), ...acceptedRisks };
  record.changed_full_page_ids = changedIds;
  const reviewedContent = record.reviewed_content_full_page_ids.filter((id) =>
    inputs.contentFullPageIds.includes(id)
  );
  const acceptedIds = new Set(Object.keys(record.accepted_risks));
  const coveredContentIds = new Set([
    ...reviewedContent,
    ...[...acceptedIds].filter((id) => inputs.contentFullPageIds.includes(id)),
  ]);
  const resolvedChanged = new Set([
    ...record.reviewed_changed_full_page_ids,
    ...acceptedIds,
  ]);
  const missingChanged = changedIds.filter((id) => !resolvedChanged.has(id));
  const missingContentCount = Math.max(
    0,
    requiredContentReviewCount(inputs.contentFullPageIds) - coveredContentIds.size
  );
  record.missing_content_review_count = missingContentCount;
  record.missing_changed_full_page_ids = missingChanged;
  record.status = missingContentCount === 0 && missingChanged.length === 0
    ? "completed"
    : "in_progress";
  record.updated_at = new Date().toISOString();
  return record;
}

export function validateHeaderReviewRecord({
  record,
  inputs,
  imagesDir,
  targetProfile = null,
}) {
  const previousSnapshot = record?.full_page_header_snapshot || {};
  const changedIds = changedFullPageIds(previousSnapshot, inputs.fullPageHeaderSnapshot);
  const applicable = inputs.contentFullPageIds.length > 0 || Boolean(record);
  if (!applicable) return { applicable: false, current: true, changedIds, errors: [] };
  const errors = [];
  if (!record) errors.push("header review evidence is missing for this version");
  else {
    if (record.status !== "completed") errors.push(`header review status is ${record.status || "missing"}`);
    if (record.header_review_fingerprint !== inputs.headerReviewFingerprint) {
      errors.push("header review fingerprint is stale");
    }
    if (targetProfile && !sameGenerationProfile(record.generation_profile, targetProfile)) {
      errors.push("generation profile does not match header review");
    }
    for (const [id, provenance] of Object.entries(record.reviewed_image_provenance || {})) {
      const imagePath = join(imagesDir, provenance.output);
      if (!existsSync(imagePath)) errors.push(`reviewed image missing for ${id}`);
      else if (sha256File(imagePath) !== provenance.image_sha256) {
        errors.push(`reviewed image bytes changed for ${id}`);
      }
    }
  }
  return { applicable: true, current: errors.length === 0, changedIds, errors };
}
