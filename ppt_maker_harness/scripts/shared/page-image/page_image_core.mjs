import { createHash } from "node:crypto";

import { canonicalJson, canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { hasCurrentPageImagePresentationEnvelope } from "./page_image_presentation_envelope.mjs";
import { hasCurrentPageImageSourceReceiptEnvelope } from "./page_image_source_receipt.mjs";

export const PAGE_IMAGE_CORE_FACTS_SCHEMA = "page-image-core-facts";
export const PAGE_IMAGE_CORE_SLIDE_FACTS_SCHEMA = "page-image-core-slide-facts";
export const PAGE_IMAGE_CORE_CONTENT_ROLES = Object.freeze([
  "body",
  "label",
  "metric",
  "diagram_text",
  "quote",
  "callout",
  "supporting_copy",
]);
export const PAGE_IMAGE_CORE_COPY_POLICIES = Object.freeze(["exact", "presentation_adaptable"]);
export const PAGE_IMAGE_PROVIDER_INPUT_MAX_UTF8_BYTES = 32768;

const SHA256_RE = /^[0-9a-f]{64}$/;
const WORKFLOWS = new Set(["framed", "pure"]);
const HEADER_KEYS = Object.freeze(["kicker", "title", "subtitle"]);
const PAGE_CLASSES = new Set(["standard", "opening", "transition", "closing"]);
const SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);

export class PageImageCoreError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PageImageCoreError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze(entry);
  return Object.freeze(value);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasExactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function assertJsonValue(value, field) {
  try {
    canonicalJson(value);
  } catch (error) {
    throw new PageImageCoreError("page_image_core_non_json_fact", `${field} must be a finite JSON value`, { field, cause: error.message });
  }
  return value;
}

function assertSha256(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (!SHA256_RE.test(value || "")) {
    throw new PageImageCoreError("page_image_core_digest_invalid", `${field} must be a lowercase SHA-256`, { field });
  }
  return value;
}

function normalizeHeaderValues(value, field, { requireTitle = false } = {}) {
  if (!hasExactKeys(value, HEADER_KEYS)) {
    throw new PageImageCoreError("page_image_core_header_invalid", `${field} must contain exactly kicker, title, and subtitle`, { field });
  }
  const normalized = {};
  for (const key of HEADER_KEYS) {
    const literal = value[key];
    if (literal !== null && (typeof literal !== "string" || literal.length === 0)) {
      throw new PageImageCoreError("page_image_core_header_literal_invalid", `${field}.${key} must be null or a non-empty string`, { field, key });
    }
    normalized[key] = literal;
  }
  if (requireTitle && !normalized.title) {
    throw new PageImageCoreError("page_image_core_framed_title_required", "Framed header policy requires an exact title", { field });
  }
  return normalized;
}

/** Normalize the closed Provider Content Schema independently of YAML parsing.  * Authority: openspec/specs/harness-script-layout/spec.md
 * Authority: openspec/specs/image-generation/spec.md
 */
export function normalizePageImageProviderContent(value) {
  if (!hasExactKeys(value, ["items"]) || !Array.isArray(value.items)) {
    throw new PageImageCoreError("page_image_core_provider_content_invalid", "Provider Content Schema must be an object with one items array");
  }
  if (value.items.length > 8) {
    throw new PageImageCoreError("page_image_core_provider_content_limit", "Provider Content Schema permits at most 8 items", { actual: value.items.length, expected: 8 });
  }
  const normalized = [];
  let adaptableCount = 0;
  for (const [index, item] of value.items.entries()) {
    const field = `items[${index}]`;
    if (!isPlainObject(item) || ![2, 3].includes(Object.keys(item).length) ||
      !Object.hasOwn(item, "role") || !Object.hasOwn(item, "literal") ||
      Object.keys(item).some((key) => !["role", "literal", "copy_policy"].includes(key))) {
      throw new PageImageCoreError("page_image_core_provider_content_item_invalid", `${field} must contain role, literal, and optional copy_policy`, { field });
    }
    if (!PAGE_IMAGE_CORE_CONTENT_ROLES.includes(item.role)) {
      throw new PageImageCoreError("page_image_core_provider_content_role_invalid", `${field}.role is not a supported semantic role`, { field, actual: item.role, expected: PAGE_IMAGE_CORE_CONTENT_ROLES });
    }
    if (typeof item.literal !== "string" || item.literal.length === 0 || [...item.literal].length > 240) {
      throw new PageImageCoreError("page_image_core_provider_content_literal_invalid", `${field}.literal must contain 1..240 Unicode code points`, { field });
    }
    const copyPolicy = item.copy_policy === undefined ? "exact" : item.copy_policy;
    if (!PAGE_IMAGE_CORE_COPY_POLICIES.includes(copyPolicy)) {
      throw new PageImageCoreError("page_image_core_provider_content_policy_invalid", `${field}.copy_policy must be exact or presentation_adaptable`, { field, actual: copyPolicy, expected: PAGE_IMAGE_CORE_COPY_POLICIES });
    }
    if (copyPolicy === "presentation_adaptable") {
      adaptableCount += 1;
      if (item.role !== "supporting_copy") {
        throw new PageImageCoreError("page_image_core_provider_content_adaptation_invalid", `${field}.copy_policy is permitted only for supporting_copy`, { field, actual: item.role });
      }
    }
    normalized.push({ role: item.role, literal: item.literal, copy_policy: copyPolicy });
  }
  if (adaptableCount > 2) {
    throw new PageImageCoreError("page_image_core_provider_content_adaptation_limit", "Provider Content Schema permits at most 2 adaptable supporting_copy items", { actual: adaptableCount, expected: 2 });
  }
  return deepFreeze({ items: normalized });
}

/** Validate the source-owned Header Rendering Policy without compiling a provider request. */
export function normalizePageImageHeaderPolicy(value, workflow) {
  if (!WORKFLOWS.has(workflow)) {
    throw new PageImageCoreError("page_image_core_workflow_invalid", "Header Rendering Policy requires workflow framed or pure", { actual: workflow });
  }
  if (workflow === "framed") {
    if (!hasExactKeys(value, ["local_header"])) {
      throw new PageImageCoreError("page_image_core_framed_header_policy_invalid", "Framed Header Rendering Policy requires local_header only");
    }
    const localHeader = normalizeHeaderValues(value.local_header, "local_header", { requireTitle: true });
    return deepFreeze({
      local_header: localHeader,
    });
  }
  if (!hasExactKeys(value, ["provider_visible"])) {
    throw new PageImageCoreError("page_image_core_pure_header_policy_invalid", "Pure Header Rendering Policy requires provider_visible only");
  }
  return deepFreeze({ provider_visible: normalizeHeaderValues(value.provider_visible, "provider_visible") });
}

function normalizeVisualSelections(sourceReceipt, visualSelections) {
  if (!Array.isArray(visualSelections) || visualSelections.length !== sourceReceipt.slides.length) {
    throw new PageImageCoreError("page_image_core_visual_selection_invalid", "visualSelections must name every source slide in source order");
  }
  return visualSelections.map((entry, index) => {
    const sourceSlide = sourceReceipt.slides[index];
    if (!hasExactKeys(entry, ["slide_id", "selection"]) || entry.slide_id !== sourceSlide.slide_id || !isPlainObject(entry.selection)) {
      throw new PageImageCoreError("page_image_core_visual_selection_invalid", "visualSelections must bind each selected visual fact to its stable slide ID", { index });
    }
    assertJsonValue(entry.selection, `visualSelections[${index}].selection`);
    if (entry.selection.projection?.workflow && entry.selection.projection.workflow !== sourceReceipt.workflow) {
      throw new PageImageCoreError("page_image_core_visual_workflow_mismatch", "selected visual facts do not bind the source workflow", { slide_id: sourceSlide.slide_id });
    }
    const presentation = entry.selection.presentation;
    if (!hasCurrentPageImagePresentationEnvelope(presentation, {
      workflow: sourceReceipt.workflow,
      pageClass: sourceSlide.page_class,
    })) {
      throw new PageImageCoreError("page_image_core_presentation_mismatch", "selected presentation facts must bind the source workflow, class, and canonical projection", { slide_id: sourceSlide.slide_id });
    }
    if (!isPlainObject(sourceSlide.visual_language) || canonicalJson(entry.selection) !== canonicalJson(sourceSlide.visual_language)) {
      throw new PageImageCoreError("page_image_core_visual_selection_mismatch", "selected visual facts must exactly match the current source receipt", { slide_id: sourceSlide.slide_id });
    }
    return { slide_id: entry.slide_id, selection: entry.selection };
  });
}

function requireCurrentReceipt(sourceReceipt, headerRenderingPolicy) {
  if (!hasCurrentPageImageSourceReceiptEnvelope(sourceReceipt) || !WORKFLOWS.has(sourceReceipt.workflow) ||
    !SHA256_RE.test(sourceReceipt.source_sha256 || "") || !Array.isArray(sourceReceipt.slides) || sourceReceipt.slides.length === 0) {
    throw new PageImageCoreError("page_image_core_source_receipt_invalid", "Page Image Core requires a current normalized source receipt");
  }
  if (!isPlainObject(headerRenderingPolicy) || headerRenderingPolicy.workflow !== sourceReceipt.workflow) {
    throw new PageImageCoreError("page_image_core_header_rendering_policy_invalid", "Header Rendering Policy must bind the source receipt workflow");
  }
  assertJsonValue(headerRenderingPolicy, "headerRenderingPolicy");
  const stableIds = new Set();
  const normalizedSlides = sourceReceipt.slides.map((slide, index) => {
    if (!isPlainObject(slide) || typeof slide.slide_id !== "string" || !slide.slide_id || slide.position !== index + 1 ||
      !PAGE_CLASSES.has(slide.page_class) || !SUBJECT_RESTRICTIONS.has(slide.subject_restrictions) ||
      Object.hasOwn(slide, "workflow") || Object.hasOwn(slide, "authority")) {
      throw new PageImageCoreError("page_image_core_source_slide_invalid", "source receipt must contain ordered stable slide IDs with no per-slide workflow", { index });
    }
    if (stableIds.has(slide.slide_id)) {
      throw new PageImageCoreError("page_image_core_duplicate_slide_id", "source receipt contains a duplicate stable slide ID", { slide_id: slide.slide_id });
    }
    stableIds.add(slide.slide_id);
    return {
      slide_id: slide.slide_id,
      position: slide.position,
      page_class: slide.page_class,
      subject_restrictions: slide.subject_restrictions,
      provider_content: normalizePageImageProviderContent(slide.provider_content),
      header_policy: normalizePageImageHeaderPolicy(slide.header_policy, sourceReceipt.workflow),
      visual_language: slide.visual_language,
    };
  });
  return { workflow: sourceReceipt.workflow, source_sha256: sourceReceipt.source_sha256, slides: normalizedSlides };
}

/**
 * Create immutable shared semantic facts. Adapters may derive different provider
 * inputs from these facts, but neither adapter nor transport owns their content
 * validation, canonical bytes, or common lineage identities.
 */
export function createPageImageCoreFacts({
  sourceReceipt,
  visualSelections,
  styleMasterSelection,
  generationProfile,
  headerRenderingPolicy,
  pageDesignSystemSha256,
} = {}) {
  const source = requireCurrentReceipt(sourceReceipt, headerRenderingPolicy);
  if (!isPlainObject(styleMasterSelection)) {
    throw new PageImageCoreError("page_image_core_style_master_invalid", "Page Image Core requires one selected Style Master fact");
  }
  if (styleMasterSelection.workflow !== source.workflow) {
    throw new PageImageCoreError("page_image_core_style_master_workflow_mismatch", "Style Master selection does not bind the source workflow");
  }
  if (!isPlainObject(generationProfile)) {
    throw new PageImageCoreError("page_image_core_generation_profile_invalid", "Page Image Core requires one generation profile fact");
  }
  assertJsonValue(styleMasterSelection, "styleMasterSelection");
  assertJsonValue(generationProfile, "generationProfile");
  assertSha256(pageDesignSystemSha256, "pageDesignSystemSha256", { nullable: true });
  const visuals = normalizeVisualSelections(sourceReceipt, visualSelections);
  const visualById = new Map(visuals.map((entry) => [entry.slide_id, entry.selection]));
  const styleMasterSelectionSha256 = canonicalJsonSha256(styleMasterSelection);
  const generationProfileSha256 = canonicalJsonSha256(generationProfile);
  const headerRenderingPolicySha256 = canonicalJsonSha256(headerRenderingPolicy);
  const slides = source.slides.map((slide) => {
    const semantic = {
      schema: PAGE_IMAGE_CORE_SLIDE_FACTS_SCHEMA,
      workflow: source.workflow,
      slide_id: slide.slide_id,
      position: slide.position,
      page_class: slide.page_class,
      subject_restrictions: slide.subject_restrictions,
      subject_restrictions_sha256: canonicalJsonSha256(slide.subject_restrictions),
      provider_content: slide.provider_content,
      provider_content_sha256: canonicalJsonSha256(slide.provider_content),
      header_policy: slide.header_policy,
      header_policy_sha256: canonicalJsonSha256(slide.header_policy),
      visual_selection: visualById.get(slide.slide_id),
      visual_selection_sha256: canonicalJsonSha256(visualById.get(slide.slide_id)),
      page_presentation_sha256: visualById.get(slide.slide_id).presentation.binding_sha256,
      page_design_system_sha256: pageDesignSystemSha256,
      style_master_selection_sha256: styleMasterSelectionSha256,
      generation_profile_sha256: generationProfileSha256,
      header_rendering_policy_sha256: headerRenderingPolicySha256,
    };
    const canonicalSemanticJson = canonicalJson(semantic);
    return {
      // Source receipt identity is lineage, not a page-pixel semantic fact.
      // This keeps notes-only source edits from changing a raw contract.
      source_receipt_sha256: source.source_sha256,
      ...semantic,
      canonical_semantic_json: canonicalSemanticJson,
      canonical_semantic_sha256: sha256(canonicalSemanticJson),
    };
  });
  const facts = {
    schema: PAGE_IMAGE_CORE_FACTS_SCHEMA,
    source_receipt_sha256: source.source_sha256,
    workflow: source.workflow,
    style_master_selection_sha256: styleMasterSelectionSha256,
    generation_profile_sha256: generationProfileSha256,
    header_rendering_policy_sha256: headerRenderingPolicySha256,
    page_design_system_sha256: pageDesignSystemSha256,
    slides,
  };
  const canonicalFactsJson = canonicalJson(facts);
  return deepFreeze({
    ...facts,
    canonical_facts_json: canonicalFactsJson,
    canonical_facts_sha256: sha256(canonicalFactsJson),
  });
}

/**
 * Bind adapter-compiled bytes to the shared semantic facts without compiling
 * provider input in the Core. The selected adapter supplies its policy-specific
 * local profile and protected-composition digests.
 */
export function createPageImageProviderInputBinding({
  coreSlide,
  compiledProviderInputSha256,
  localHeaderProfileSha256 = null,
  protectedCompositionSha256 = null,
} = {}) {
  if (!isPlainObject(coreSlide) || coreSlide.schema !== PAGE_IMAGE_CORE_SLIDE_FACTS_SCHEMA ||
    !WORKFLOWS.has(coreSlide.workflow) || typeof coreSlide.slide_id !== "string" || !coreSlide.slide_id) {
    throw new PageImageCoreError("page_image_core_provider_input_binding_invalid", "provider input binding requires one current Core slide fact");
  }
  for (const field of [
    "provider_content_sha256",
    "visual_selection_sha256",
    "style_master_selection_sha256",
    "generation_profile_sha256",
    "header_policy_sha256",
  ]) {
    assertSha256(coreSlide[field], `coreSlide.${field}`);
  }
  assertSha256(coreSlide.page_presentation_sha256, "coreSlide.page_presentation_sha256");
  assertSha256(coreSlide.page_design_system_sha256, "coreSlide.page_design_system_sha256", { nullable: true });
  assertSha256(compiledProviderInputSha256, "compiledProviderInputSha256");
  assertSha256(localHeaderProfileSha256, "localHeaderProfileSha256", { nullable: true });
  assertSha256(protectedCompositionSha256, "protectedCompositionSha256", { nullable: true });
  if (coreSlide.workflow === "framed" && (!localHeaderProfileSha256 || !protectedCompositionSha256)) {
    throw new PageImageCoreError("page_image_core_framed_binding_invalid", "Framed provider input binding requires local profile and protected composition digests");
  }
  if (coreSlide.workflow === "pure" && (localHeaderProfileSha256 !== null || protectedCompositionSha256 !== null)) {
    throw new PageImageCoreError("page_image_core_pure_binding_invalid", "Pure provider input binding cannot contain Framed profile or protected composition digests");
  }
  return deepFreeze({
    compiled_provider_input_sha256: compiledProviderInputSha256,
    provider_content_sha256: coreSlide.provider_content_sha256,
    visual_selection_sha256: coreSlide.visual_selection_sha256,
    style_master_selection_sha256: coreSlide.style_master_selection_sha256,
    generation_profile_sha256: coreSlide.generation_profile_sha256,
    header_policy_sha256: coreSlide.header_policy_sha256,
    page_presentation_sha256: coreSlide.page_presentation_sha256,
    page_design_system_sha256: coreSlide.page_design_system_sha256,
    local_header_profile_sha256: localHeaderProfileSha256,
    protected_composition_sha256: protectedCompositionSha256,
  });
}
