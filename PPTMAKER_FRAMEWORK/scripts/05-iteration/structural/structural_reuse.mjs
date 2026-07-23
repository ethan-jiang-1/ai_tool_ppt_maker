import { canonicalJson } from "../../shared/identity/canonical_json.mjs";
import { ARTIFACT_STATUS_VERIFIED } from "../../shared/identity/render_artifacts.mjs";
import { sameGenerationProfile } from "../../04-image-production/index.mjs";

export const STRUCTURAL_LOCAL_STAGES = Object.freeze([
  "stage1",
  "stage3",
  "contact-sheet",
  "stage4",
  "stage5",
]);

function slideId(slide) {
  return String(slide?.slide_id || slide?.id || "").trim();
}

function slidePosition(slide, index) {
  const value = Number(slide?.position);
  return Number.isInteger(value) && value > 0 ? value : index + 1;
}

function slideTitle(slide) {
  return String(slide?.headline || slide?.title || "").trim();
}

function indexSlides(slides = []) {
  return new Map(slides.map((slide, index) => [slideId(slide), {
    slide,
    position: slidePosition(slide, index),
    title: slideTitle(slide),
  }]).filter(([id]) => id));
}

function indexPrompts(prompts = []) {
  return new Map(prompts.map((prompt) => [slideId(prompt), String(prompt?.prompt || "").trim()]).filter(([id]) => id));
}

function mapValue(values, id) {
  if (values instanceof Map) return values.get(id);
  return values?.[id];
}

export function formatSlideLabel(slide, index = 0) {
  const id = slideId(slide);
  const position = slidePosition(slide, index);
  const title = slideTitle(slide);
  return `${String(position).padStart(2, "0")} · ${id}${title ? ` · ${title}` : ""}`;
}

/**
 * Compare two Stage-1 snapshots without treating position as semantic identity.
 */
export function computeStructuralImpact({
  sourcePlan = [],
  targetPlan = [],
  sourcePrompts = [],
  targetPrompts = [],
  sourceProfiles = {},
  targetProfiles = {},
  artifactProofs = {},
  reviewWarnings = {},
} = {}) {
  const source = indexSlides(sourcePlan);
  const target = indexSlides(targetPlan);
  const sourcePromptById = indexPrompts(sourcePrompts);
  const targetPromptById = indexPrompts(targetPrompts);
  const orderedIds = [
    ...target.keys(),
    ...[...source.keys()].filter((id) => !target.has(id)),
  ];

  const slides = orderedIds.map((id) => {
    const before = source.get(id) || null;
    const after = target.get(id) || null;
    const classifications = [];
    if (before && after) classifications.push("retained");
    else if (after) classifications.push("inserted");
    else classifications.push("deleted");

    const reordered = Boolean(before && after && before.position !== after.position);
    if (reordered) classifications.push("reordered");
    const semanticChanged = Boolean(
      before && after && sourcePromptById.get(id) !== targetPromptById.get(id)
    );
    if (semanticChanged) classifications.push("semantic-changed");
    const sourceProfile = mapValue(sourceProfiles, id) ?? null;
    const targetProfile = mapValue(targetProfiles, id) ?? null;
    const profileChanged = Boolean(
      before && after && sourceProfile != null && targetProfile != null &&
      canonicalJson(sourceProfile) !== canonicalJson(targetProfile)
    );
    if (profileChanged) classifications.push("profile-changed");

    const proof = mapValue(artifactProofs, id) || null;
    const artifactStatus = after
      ? (proof?.status || "missing")
      : (proof?.status || null);
    const needsRender = Boolean(
      after && (
        !before || semanticChanged || profileChanged ||
        artifactStatus !== ARTIFACT_STATUS_VERIFIED
      )
    );
    const warnings = [
      ...[].concat(mapValue(reviewWarnings, id) || []),
      ...(artifactStatus === "legacy-located" ? ["legacy-located raw render is not reusable proof"] : []),
    ];

    return {
      slide_id: id,
      position: after?.position ?? null,
      previous_position: before?.position ?? null,
      title: after?.title || before?.title || "",
      label: formatSlideLabel(after?.slide || before?.slide || { slide_id: id }, (after?.position || before?.position || 1) - 1),
      classifications,
      artifact: proof ? { status: artifactStatus, ...proof } : { status: artifactStatus },
      required_local_stages: after ? [...STRUCTURAL_LOCAL_STAGES] : [],
      needs_render: needsRender,
      review_warnings: warnings,
    };
  });

  return {
    schema_version: 1,
    renderer_calls: 0,
    source_order: [...source.keys()],
    target_order: [...target.keys()],
    required_local_stages: target.size > 0 ? [...STRUCTURAL_LOCAL_STAGES] : [],
    needs_render: slides.filter((slide) => slide.needs_render).map((slide) => slide.slide_id),
    review_warnings: slides.flatMap((slide) => slide.review_warnings.map((warning) => ({ slide_id: slide.slide_id, warning }))),
    slides,
  };
}

/**
 * Re-establish target-scoped review evidence only from byte/profile-bound
 * source approvals. The caller owns state publication.
 */
export function carryForwardHeaderReview({
  sourceRecord,
  targetInputs,
  materializedEntries = {},
  sourceVersion,
  carriedAt = new Date().toISOString(),
} = {}) {
  if (!sourceRecord?.slides || !targetInputs) {
    return { record: null, carried_ids: [], warnings: [] };
  }
  const slides = {};
  const carriedIds = [];
  const warnings = [];
  for (const id of targetInputs.fullPageIds || []) {
    const source = sourceRecord.slides[id];
    const raw = mapValue(materializedEntries, id);
    if (!source) continue;
    if (source.status !== "reviewed") {
      if (source.status === "waived") warnings.push({ slide_id: id, reason: "waiver-not-carried" });
      continue;
    }
    if (!raw || raw.status !== ARTIFACT_STATUS_VERIFIED || !raw.entry) {
      warnings.push({ slide_id: id, reason: "verified-raw-required" });
      continue;
    }
    const rawProfile = raw.entry.generation_profile || raw.profile || null;
    if (!sameGenerationProfile(sourceRecord.generation_profile, rawProfile)) {
      warnings.push({ slide_id: id, reason: "generation-profile-mismatch" });
      continue;
    }
    const rawSha = raw.entry.image_sha256 || raw.byte_sha256 || null;
    if (!source.image_sha256 || source.image_sha256 !== rawSha) {
      warnings.push({ slide_id: id, reason: "reviewed-image-sha-mismatch" });
      continue;
    }
    const targetFingerprint = targetInputs.slideFingerprints?.[id];
    if (!targetFingerprint || source.fingerprint !== targetFingerprint) {
      warnings.push({ slide_id: id, reason: "header-review-fingerprint-mismatch" });
      continue;
    }
    slides[id] = {
      ...source,
      status: "reviewed",
      fingerprint: targetFingerprint,
      image_sha256: rawSha,
      carried_forward_at: carriedAt,
      source_lineage: {
        source_version: sourceVersion,
        source_status: "reviewed",
        source_image_sha256: source.image_sha256,
      },
    };
    carriedIds.push(id);
  }
  if (carriedIds.length === 0) return { record: null, carried_ids: [], warnings };
  return {
    record: {
      generation_profile: sourceRecord.generation_profile,
      slides,
      updated_at: carriedAt,
      source_lineage: { source_version: sourceVersion },
    },
    carried_ids: carriedIds,
    warnings,
  };
}
