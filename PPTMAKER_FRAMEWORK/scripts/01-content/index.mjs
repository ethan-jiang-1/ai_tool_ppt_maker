export {
  IDENTITY_SCHEME_MNEMONIC_V1,
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
  classifySlideId,
  formatAvailableSlideIds,
  formatSlideCandidate,
  isLegacySlideId,
  isMnemonicSlideId,
  normalizeSpokenKey,
  parseMnemonicSlideId,
  resolveSlideBindings,
  resolveSlideIds,
  validateNewSlideId,
} from "./internal/slide_ids.mjs";

export {
  FRAMED_TEXT_PRESET,
  PAGE_AUTHORITY_SOURCE_V2_RECEIPT_SCHEMA,
  PageAuthoritySourceError,
  parsePageAuthoritySource,
} from "./internal/page_authority_source.mjs";

export {
  TARGET_STRUCTURAL_PLAN_SCHEMA,
  applyTargetStructuralVersion,
  deriveTargetStructuralSource,
  previewTargetStructuralVersion,
} from "./internal/target_structural_version.mjs";
