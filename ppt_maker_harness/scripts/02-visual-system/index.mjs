/**
 * 02-visual-system — Visual system configuration and reference material facade.
 * Authority: openspec/specs/visual-config/spec.md
 * Authority: openspec/specs/visual-asset-management/spec.md
 */

export {
  PAGE_IMAGE_VISUAL_CLAUSE_DIGEST,
  PAGE_IMAGE_VISUAL_CLAUSE_FORBIDDEN_CONTENT_TOKENS,
  PAGE_IMAGE_VISUAL_CLAUSE_FORBIDDEN_PAIRS,
  PAGE_IMAGE_VISUAL_LANGUAGE_RELATIVE_PATH,
  PAGE_IMAGE_VISUAL_LANGUAGE_SCHEMA,
  PageImageVisualClauseError,
  PageImageVisualLanguageError,
  createPageImageVisualLanguageResolver,
  loadPageImageVisualLanguage,
  normalizePageImageVisualClause,
  parsePageImageVisualLanguage,
  resolvePageImageVisualLanguageSelection,
} from "./internal/page_image_visual_language.mjs";

export {
  AMBER_AGENT_MODEL_SHEET_SHA256,
  PAGE_IMAGE_REFERENCE_REGISTRY_SCHEMA,
  PAGE_IMAGE_REFERENCE_ROOT,
  PageImageReferenceMaterialError,
  createPageImageSourceResolver,
  identityReferenceProjectionSha256,
  loadPageImageReferenceMaterial,
  parsePageImageReferenceMaterial,
  resolvePageImageIdentityReference,
} from "./internal/page_image_reference_material.mjs";

export {
  PURE_DECK_VISUAL_SYSTEM_SCHEMA,
  PureDeckVisualSystemError,
  parsePureDeckVisualProfile,
} from "./internal/pure_deck_visual_system.mjs";

export {
  PAGE_IMAGE_PRESENTATION_FILES,
  PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE,
  PAGE_IMAGE_PRESENTATION_SCHEMA,
  PageImagePresentationError,
  hasCurrentPageImagePresentationEnvelope,
  loadPageImagePresentationPackage,
  resolvePageImagePresentation,
} from "./internal/page_image_presentation.mjs";

export {
  PAGE_DESIGN_SYSTEM_BINDING_SCHEMA,
  PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES,
  PageDesignSystemError,
  resolvePageDesignSystemBinding,
} from "./internal/page_design_system.mjs";
