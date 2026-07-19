import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isHeroVisualType,
  normalizeVisualType,
  presentHeaderText,
} from "../../../01-content/internal/render_policy.mjs";
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
  const slideFingerprints = {};
  let hasBodyHeaderLockSlides = false;
  for (const slide of slides) {
    const id = String(slide.id || "").trim();
    if (!id) continue;
    if (slide.layout_contract?.render_mode === "body+header-lock") {
      hasBodyHeaderLockSlides = true;
    }
    if (slide.layout_contract?.render_mode !== "full-page") continue;
    const hero = isHeroVisualType(slide.visual_type);
    const snapshot = {
      render_mode: "full-page",
      visual_type: normalizeVisualType(slide.visual_type) || null,
      hero,
      ...headerFields(slide),
    };
    fullPageHeaderSnapshot[id] = snapshot;
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
  // Per-slide fingerprints for state comparison
  for (const id of Object.keys(fullPageHeaderSnapshot)) {
    slideFingerprints[id] = sha256Bytes(stableJson({
      ...fullPageHeaderSnapshot[id],
      content_header_geometry: geometry,
    }));
  }
  // Global fingerprint retained for changedFullPageIds fallback (first pilot, no per-slide state)
  const fingerprint = sha256Bytes(stableJson({
    full_page_header_snapshot: fullPageHeaderSnapshot,
    content_header_geometry: geometry,
  }));
  return {
    headerReviewFingerprint: fingerprint,
    slideFingerprints,
    hasBodyHeaderLockSlides,
    fullPageHeaderSnapshot,
    contentFullPageIds,
    fullPageIds: Object.keys(fullPageHeaderSnapshot),
    contentHeaderGeometry: geometry,
  };
}

export function changedFullPageIds(previousSnapshot = {}, currentSnapshot = {}, slideStates = null) {
  // Per-slide state available → read status directly
  if (slideStates) {
    return Object.entries(slideStates)
      .filter(([, s]) => s && s.status === "changed")
      .map(([id]) => id)
      .sort();
  }
  // Fallback: global snapshot diff (first pilot, before per-slide state exists)
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
  // Build per-slide state from previous record or start fresh
  const slides = {};
  const previousSlides = previousRecord?.slides || {};
  // Migrate old accepted_risks → waived status
  const acceptedIds = new Set(Object.keys(acceptedRisks));
  // Copy existing slide states, marking old accepted risks as waived
  for (const [id, s] of Object.entries(previousSlides)) {
    if (acceptedIds.has(id)) {
      slides[id] = { ...s, status: "waived" };
    } else {
      slides[id] = { ...s };
    }
  }
  // Mark newly reviewed slides (accepted risks override to waived)
  for (const id of reviewedIds) {
    const snapshot = inputs.fullPageHeaderSnapshot[id];
    if (!snapshot) continue;
    const status = acceptedIds.has(id) ? "waived" : "reviewed";
    slides[id] = {
      status,
      fingerprint: inputs.slideFingerprints[id] || "",
      header_snapshot: {
        kicker: snapshot.kicker ?? null,
        title: snapshot.title ?? null,
        subtitle: snapshot.subtitle ?? null,
        visual_type: snapshot.visual_type ?? null,
      },
      image_sha256: provenanceEntries[id]?.image_sha256 || null,
      reviewed_at: new Date().toISOString(),
    };
  }
  // Apply accepted risks to slides not in reviewedIds
  for (const id of acceptedIds) {
    if (!slides[id] || slides[id].status !== "reviewed") {
      const snapshot = inputs.fullPageHeaderSnapshot[id];
      slides[id] = {
        status: "waived",
        fingerprint: inputs.slideFingerprints[id] || "",
        header_snapshot: snapshot ? {
          kicker: snapshot.kicker ?? null,
          title: snapshot.title ?? null,
          subtitle: snapshot.subtitle ?? null,
          visual_type: snapshot.visual_type ?? null,
        } : null,
        image_sha256: provenanceEntries[id]?.image_sha256 || null,
      };
    }
  }
  // Mark slides not yet reviewed as changed (first body+header-lock transition)
  const wasMixed = previousRecord && previousRecord.slides;
  if (!wasMixed && inputs.hasBodyHeaderLockSlides) {
    for (const id of inputs.fullPageIds) {
      if (!slides[id]) {
        const snapshot = inputs.fullPageHeaderSnapshot[id];
        slides[id] = {
          status: "changed",
          fingerprint: inputs.slideFingerprints[id] || "",
          header_snapshot: snapshot ? {
            kicker: snapshot.kicker ?? null,
            title: snapshot.title ?? null,
            subtitle: snapshot.subtitle ?? null,
            visual_type: snapshot.visual_type ?? null,
          } : null,
          image_sha256: null,
        };
      }
    }
  }
  // Detect changes: slides in current plan whose fingerprint differs from stored
  for (const id of inputs.fullPageIds) {
    const currentFp = inputs.slideFingerprints[id];
    const stored = slides[id];
    if (!currentFp) continue;
    if (!stored) {
      // New slide, no previous record
      const snapshot = inputs.fullPageHeaderSnapshot[id];
      slides[id] = {
        status: "changed",
        fingerprint: currentFp,
        header_snapshot: snapshot ? {
          kicker: snapshot.kicker ?? null,
          title: snapshot.title ?? null,
          subtitle: snapshot.subtitle ?? null,
          visual_type: snapshot.visual_type ?? null,
        } : null,
        image_sha256: null,
      };
    } else if (stored.status !== "reviewed" && stored.status !== "waived") {
      // Already pending — keep current fingerprint so gate can detect if changed again
      if (stored.fingerprint !== currentFp) {
        stored.fingerprint = currentFp;
        if (stored.status !== "changed") stored.status = "changed";
      }
    }
  }
  // Clean up slides not in current plan
  for (const id of Object.keys(slides)) {
    if (!inputs.fullPageIds.includes(id)) delete slides[id];
  }

  return {
    generation_profile: profile || previousRecord?.generation_profile || null,
    slides,
    updated_at: new Date().toISOString(),
  };
}

export function validateHeaderReviewRecord({
  record,
  inputs,
  imagesDir,
  targetProfile = null,
  onlyIds = null,
}) {
  // Old format (no slides field) → pass through
  if (!record || !record.slides) {
    return { format: 2, applicable: false, ok: true, changed: [], action: null, hint: null };
  }
  // Pure full-page deck (no body+header-lock baseline) → not applicable
  if (!inputs.hasBodyHeaderLockSlides) {
    return { format: 2, applicable: false, ok: true, changed: [], action: null, hint: null };
  }
  // Profile mismatch → all content full-page slides need review
  if (targetProfile && record.generation_profile &&
      !sameGenerationProfile(record.generation_profile, targetProfile)) {
    const allChanged = inputs.contentFullPageIds.map((id) => ({ id, field: "profile", was: null, now: null }));
    const actionIds = allChanged.map((c) => c.id);
    return {
      format: 2, applicable: true, ok: false,
      changed: allChanged,
      action: _buildAction(actionIds),
      hint: `generation profile 不匹配（当前: ${targetProfile.resolution || "?"}/${targetProfile.model || "?"}），需重新 pilot`,
    };
  }

  // Per-slide comparison
  const checkIds = onlyIds && onlyIds.length > 0
    ? onlyIds.filter((id) => inputs.fullPageIds.includes(id))
    : inputs.fullPageIds;
  if (onlyIds && onlyIds.length > 0) {
    const missing = onlyIds.filter((id) => !inputs.fullPageIds.includes(id));
    if (missing.length > 0 && checkIds.length === 0) {
      return { format: 2, applicable: true, ok: true, changed: [], action: null,
        hint: `${missing.join(",")} not found in slide plan` };
    }
  }

  const changed = [];
  for (const id of checkIds) {
    const currentFp = inputs.slideFingerprints[id];
    if (!currentFp) continue;
    const stored = record.slides[id];
    if (!stored || stored.fingerprint !== currentFp) {
      const snapshot = stored?.header_snapshot || null;
      const currentHeader = inputs.fullPageHeaderSnapshot[id] || {};
      // Diff text fields
      let found = false;
      for (const field of ["kicker", "title", "subtitle"]) {
        const was = snapshot?.[field] ?? null;
        const now = currentHeader[field] ?? null;
        if (was !== now) {
          changed.push({ id, field, was, now });
          found = true;
        }
      }
      // Non-text change: fingerprint differs but text fields same → visual_type or geometry
      if (!found) {
        if (snapshot?.visual_type !== (currentHeader.visual_type || null)) {
          changed.push({ id, field: "visual_type", was: snapshot?.visual_type ?? null, now: currentHeader.visual_type || null });
        } else {
          changed.push({ id, field: "layout", was: null, now: null });
        }
      }
    }
  }

  if (changed.length === 0) {
    return { format: 2, applicable: true, ok: true, changed: [], action: null, hint: null };
  }

  const changedIds = [...new Set(changed.map((c) => c.id))].sort();
  return {
    format: 2, applicable: true, ok: false,
    changed,
    action: _buildAction(changedIds),
    hint: changed.length === 1
      ? `1 页标题有变化（${changedIds[0]}），跑 pilot 确认效果后继续`
      : `${changed.length} 处标题有变化（${changedIds.length} 页），跑 pilot 确认效果后继续`,
  };
}

function _buildAction(changedIds) {
  if (changedIds.length === 0) return null;
  if (changedIds.length <= 5) {
    return `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot "{runDir}" --only ${changedIds.join(",")}`;
  }
  return `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot "{runDir}"`;
}
