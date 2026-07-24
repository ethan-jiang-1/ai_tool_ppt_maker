import { canonicalJsonSha256 } from "./canonical_json.mjs";

export const HTML_REVIEW_PLAN_SCHEMA = "pptmaker-html-review-plan-v1";
export const HTML_REVIEW_BODY_EXCLUDED_FIELDS = Object.freeze([
  "schema_version",
  "family",
  "callout",
  "primary_visual",
]);

/** Smallest HTML-first repair path for each independently owned stale set. */
export const HTML_STALE_OWNERSHIP_MATRIX_V1 = Object.freeze({
  notes_only: Object.freeze({ refresh_path: "Notes-Only Refresh", stale_owners: Object.freeze(["notes", "delivery"]) }),
  visible_copy: Object.freeze({ refresh_path: "Local Slide Rebuild", stale_owners: Object.freeze(["content", "delivery"]) }),
  visual_system_or_recipe: Object.freeze({ refresh_path: "Local Deck Rebuild", stale_owners: Object.freeze(["visual", "delivery"]) }),
  fallback_or_asset: Object.freeze({ refresh_path: "Local Slide Rebuild", stale_owners: Object.freeze(["content", "visual", "delivery"]) }),
  structural: Object.freeze({ refresh_path: "Structural Versioning Path", stale_owners: Object.freeze(["content", "visual", "notes", "delivery"]) }),
});

/**
 * Renderer and review plans share this source-body projection. It omits fields
 * owned by other render surfaces and normalizes the data-chart legend exactly
 * once, so read-back cannot drift from the pilot representation.
 */
export function projectHtmlSlideBodyV1(sourceBody) {
  if (!sourceBody || typeof sourceBody !== "object" || Array.isArray(sourceBody)) {
    throw new TypeError("HTML slide body projection requires an object");
  }
  const body = Object.fromEntries(
    Object.entries(sourceBody).filter(([key]) => !HTML_REVIEW_BODY_EXCLUDED_FIELDS.includes(key)),
  );
  if (sourceBody.family === "data" && body.chart?.legend === "auto") {
    body.chart = {
      ...body.chart,
      legend: (body.chart.series || []).length > 1 ? "show" : "hide",
    };
  }
  return body;
}

export function htmlContentReviewProjectionV1(plan) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("content review projection requires an HTML plan");
  return plan.slides.map((slide) => ({
    slide_id: slide.slide_id,
    position: slide.position,
    header: slide.header,
    visual_type: slide.visual_type,
    concept: slide.concept,
    family: slide.family,
    body: projectHtmlSlideBodyV1({ family: slide.family, ...(slide.body || {}) }),
    callout: slide.callout,
    primary_visual: slide.primary_visual,
  }));
}

/**
 * Freshness compares source-owned review material, not raw source provenance.
 * Immutable plan hashes, source SHA, and input receipts remain audit facts on
 * the stored object but do not make a notes-only edit stale.
 */
export function htmlReviewCurrentProjectionV1(reviewPlan) {
  if (!reviewPlan || typeof reviewPlan !== "object" || !["content", "visual"].includes(reviewPlan.kind)) {
    throw new TypeError("current review projection requires a content or visual review plan");
  }
  const common = {
    schema: reviewPlan.schema,
    publication_scope: reviewPlan.publication_scope,
    html_production_reset_id: reviewPlan.html_production_reset_id,
    pipeline: reviewPlan.pipeline,
    logical_run_version: reviewPlan.logical_run_version,
    kind: reviewPlan.kind,
    approvable: reviewPlan.approvable,
    outstanding: reviewPlan.outstanding,
  };
  if (reviewPlan.kind === "content") {
    return {
      ...common,
      content_projection: reviewPlan.content_projection,
      content_fingerprint: reviewPlan.content_fingerprint,
    };
  }
  return {
    ...common,
    composition_variant: reviewPlan.composition_variant,
    composition_variants: reviewPlan.composition_variants,
    visual_system_fingerprint: reviewPlan.visual_system_fingerprint,
    page_visual_dependencies: reviewPlan.page_visual_dependencies,
    coverage: reviewPlan.coverage,
    shown_artifacts: reviewPlan.shown_artifacts,
  };
}

export function htmlPageVisualDependenciesV1(plan) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("visual review projection requires an HTML plan");
  return plan.slides.map((slide) => ({
    slide_id: slide.slide_id,
    visual_contract_fingerprint: slide.visual_contract_fingerprint,
    component_recipe_hash: canonicalJsonSha256({
      family: slide.family,
      geometry: slide.geometry,
      primary_visual: slide.primary_visual == null ? null : {
        placement: slide.primary_visual.placement ?? null,
        fit: slide.primary_visual.fit ?? null,
        focal_point: slide.primary_visual.focal_point ?? null,
        fallback: slide.primary_visual.fallback ?? null,
        selection: slide.primary_visual.selection ?? null,
      },
    }),
  })).sort((left, right) => left.slide_id < right.slide_id ? -1 : left.slide_id > right.slide_id ? 1 : 0);
}

export function buildHtmlReviewPlan({ plan, composition = null, kind, publicationScope = "canonical-run", htmlProductionResetId = null, logicalRunVersion, outstanding = [], compositionVariant = "effective" } = {}) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("review plan requires a validated HTML plan");
  if (!["content", "visual"].includes(kind)) throw new TypeError("review plan kind must be content or visual");
  if (publicationScope !== "canonical-run") throw new TypeError("review plan publication scope is invalid");
  if (typeof logicalRunVersion !== "string" || !logicalRunVersion) throw new TypeError("review plan logical run version is required");
  if (!["effective", "forced-fallback"].includes(compositionVariant)) throw new TypeError("review plan composition variant is invalid");
  const shown = composition?.final_slides || composition?.pages || [];
  const artifactRefs = shown.map((entry) => ({ slide_id: entry.slide_id, composition_variant: entry.composition_variant || compositionVariant, path: entry.review_object_path || null, sha256: entry.png_sha256 || entry.html_sha256 || null, page_path: entry.review_page_object_path || null, page_sha256: entry.html_sha256 || null }));
  const validArtifacts = artifactRefs.filter((entry) => /^[0-9a-f]{64}$/.test(entry.sha256 || ""));
  const shownEffective = new Set(validArtifacts.filter((entry) => entry.composition_variant === "effective").map((entry) => entry.slide_id));
  const shownForced = new Set(validArtifacts.filter((entry) => entry.composition_variant === "forced-fallback").map((entry) => entry.slide_id));
  const compositionVariants = [...new Set(artifactRefs.map((entry) => entry.composition_variant))].sort();
  const requiredForced = plan.slides.filter((slide) => slide.visual_resolution?.effective === "selected").map((slide) => slide.slide_id);
  const missingArtifacts = kind === "visual" ? [
    ...plan.slides.map((slide) => slide.slide_id).filter((slideId) => !shownEffective.has(slideId)).map((slideId) => `effective:${slideId}`),
    ...requiredForced.filter((slideId) => !shownForced.has(slideId)).map((slideId) => `forced-fallback:${slideId}`),
  ] : [];
  const allOutstanding = [...new Set([...outstanding, ...missingArtifacts])].sort();
  const contentProjection = kind === "content" ? htmlContentReviewProjectionV1(plan) : null;
  const body = {
    schema: HTML_REVIEW_PLAN_SCHEMA,
    publication_scope: publicationScope,
    html_production_reset_id: htmlProductionResetId,
    pipeline: "html-first-v1",
    logical_run_version: logicalRunVersion,
    kind,
    approvable: allOutstanding.length === 0,
    outstanding: allOutstanding,
    input_receipts: plan.input_receipts,
    source_sha256: plan.source_sha256,
    ordered_plan_digest: plan.ordered_plan_digest,
    composition_variant: compositionVariant,
    composition_variants: compositionVariants,
    content_projection: contentProjection,
    content_fingerprint: kind === "content" ? canonicalJsonSha256({ schema: "content_review_fingerprint_v1", projection: contentProjection }) : null,
    visual_system_fingerprint: kind === "visual" ? plan.style_reference_contract_fingerprint : null,
    page_visual_dependencies: kind === "visual" ? htmlPageVisualDependenciesV1(plan) : [],
    coverage: kind === "visual" ? { required_effective_slide_ids: plan.slides.map((slide) => slide.slide_id), required_forced_fallback_slide_ids: requiredForced, shown_effective_slide_ids: [...shownEffective].sort(), shown_forced_fallback_slide_ids: [...shownForced].sort(), complete: allOutstanding.length === 0 } : null,
    shown_artifacts: artifactRefs,
  };
  return Object.freeze({ ...body, plan_hash: canonicalJsonSha256(body) });
}
