import { canonicalJsonSha256 } from "./canonical_json.mjs";

export const HTML_REVIEW_PLAN_SCHEMA = "pptmaker-html-review-plan-v1";

export function htmlContentReviewProjectionV1(plan) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("content review projection requires an HTML plan");
  return plan.slides.map((slide) => ({
    slide_id: slide.slide_id,
    position: slide.position,
    header: slide.header,
    visual_type: slide.visual_type,
    concept: slide.concept,
    family: slide.family,
    body: slide.body,
    callout: slide.callout,
    primary_visual: slide.primary_visual,
  }));
}

export function htmlPageVisualDependenciesV1(plan) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("visual review projection requires an HTML plan");
  return plan.slides.map((slide) => ({
    slide_id: slide.slide_id,
    visual_contract_fingerprint: slide.visual_contract_fingerprint,
    component_recipe_hash: canonicalJsonSha256({ family: slide.family, geometry: slide.geometry }),
  })).sort((left, right) => left.slide_id < right.slide_id ? -1 : left.slide_id > right.slide_id ? 1 : 0);
}

export function buildHtmlReviewPlan({ plan, composition = null, kind, publicationScope = "canonical-run", htmlProductionResetId = null, logicalRunVersion, outstanding = [], compositionVariant = "effective" } = {}) {
  if (!plan || !Array.isArray(plan.slides)) throw new TypeError("review plan requires a validated HTML plan");
  if (!["content", "visual"].includes(kind)) throw new TypeError("review plan kind must be content or visual");
  if (!["canonical-run", "migration-preview"].includes(publicationScope)) throw new TypeError("review plan publication scope is invalid");
  if (publicationScope === "migration-preview" && htmlProductionResetId !== null) throw new TypeError("migration-preview review plans require a null reset ID");
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
