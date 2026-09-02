/**
 * 01-content — Page Image source authoring: narrative sources, slide documents, and source receipts.
 * Authority: openspec/specs/content-parsing/spec.md
 * Authority: openspec/specs/narrative-authoring/spec.md
 * Authority: openspec/specs/slide-identity-and-ordering/spec.md
 */

export {
  IDENTITY_SCHEME_MNEMONIC,
  SlideDocumentError,
  applySlideEdit,
  canonicalSlideEditJson,
  computeSlideEditPlanSha256,
  parseSlideDocument,
  planSlideEdit,
  serializeSlideDocument,
  sha256SlideSource,
  validateSlideDocument,
  validateSlideDocuments,
  verifySlideEditPlanHash,
} from "./internal/slide_document.mjs";

export {
  SlideIdentityError,
  SlideSelectorError,
  buildSlideIdReservation,
  formatAvailableSlideIds,
  formatSlideCandidate,
  isMnemonicSlideId,
  normalizeSpokenKey,
  parseMnemonicSlideId,
  resolveSlideBindings,
  validateNewSlideId,
} from "./internal/slide_ids.mjs";

export {
  PAGE_IMAGE_CLASSES,
  PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA,
  PageImageSourceError,
  PROVIDER_CONTENT_COPY_POLICIES,
  PROVIDER_CONTENT_ROLES,
  parsePageImageSource,
} from "./internal/page_image_source.mjs";

export {
  DESIGN_CONSTRAINTS_SCHEMA,
  STORY_OUTLINE_SCHEMA,
  NarrativeSourceError,
  parseDesignConstraints,
  parseStoryOutline,
} from "./internal/narrative_source.mjs";

export {
  NARRATIVE_PAGE_GROUPING_CANDIDATE_SCHEMA,
  NARRATIVE_PAGE_PLAN_SCHEMA,
  NarrativePagePlanError,
  applyNarrativePagePlan,
  parseNarrativePageGroupingCandidate,
  previewNarrativePagePlan,
} from "./internal/narrative_page_plan.mjs";

export {
  TARGET_STRUCTURAL_PLAN_SCHEMA,
  applyTargetStructuralVersion,
  deriveTargetStructuralSource,
  previewTargetStructuralVersion,
} from "./internal/target_structural_version.mjs";
