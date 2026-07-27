export {
  DEFAULT_CONFIG,
  HTML_STYLE_REFERENCE_PROJECTION_V1_PATHS,
  HTML_VISUAL_PROJECTION_V1_PATHS,
  VisualConfigError,
  buildHtmlStyleReferenceProjectionV1,
  buildHtmlVisualProjectionV1,
  hexToRgba,
  loadHtmlVisualConfig,
  loadVisualConfig,
  loadVisualConfigViews,
  parseHtmlVisualConfig,
  parseVisualConfig,
} from "./internal/visual_config.mjs";

export {
  aggregateAssetSha256,
  loadAssetManifest,
  resolveAssetFile,
  sha256Asset,
  validateAssetManifest,
} from "./internal/asset_manifest.mjs";
export { loadDeckSystem } from "./internal/deck_system.mjs";
export {
  HtmlAssetCatalogError,
  assetEvidence,
  loadHtmlAssetCatalog,
  commitPreparedRefinedHtmlAssetRegistration,
  prepareRefinedHtmlAssetRegistration,
  registerRefinedHtmlAsset,
  validateHtmlAssetBytes,
} from "./internal/html_asset_catalog.mjs";
export {
  ECHARTS_VERSION,
  renderEchartsSsrSvgSync,
  rewriteSvgInstanceIds,
  validateEchartsSvg,
} from "./internal/html_chart_svg.mjs";
export { validateHtmlComponentProjection } from "./internal/html_component_registry.mjs";
export {
  HTML_FAMILY_GEOMETRY_ID,
  htmlFamilyGeometrySemanticSha256,
  loadHtmlFamilyGeometryRegistry,
} from "./internal/html_family_geometry.mjs";

export {
  PAGE_AUTHORITY_TEXT_GUARD,
  PAGE_AUTHORITY_TEXT_GUARD_DIGEST,
  PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS,
  PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS,
  PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH,
  PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA,
  PageAuthorityTextGuardError,
  PageAuthorityVisualLanguageError,
  createPageAuthorityVisualLanguageResolver,
  loadPageAuthorityVisualLanguage,
  normalizePageAuthorityTextGuard,
  parsePageAuthorityVisualLanguage,
  resolvePageAuthorityVisualLanguageSelection,
} from "./internal/page_authority_visual_language.mjs";

export {
  FRAMED_TEXT_FRAME_PREFLIGHT_SCHEMA,
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
  FramedTextFrameError,
  preflightFramedTextFrame,
  resolveFramedTextFramePreset,
} from "./internal/page_authority_text_frame.mjs";

export {
  AMBER_AGENT_MODEL_SHEET_SHA256,
  PAGE_AUTHORITY_REFERENCE_REGISTRY_SCHEMA,
  PAGE_AUTHORITY_REFERENCE_ROOT,
  PageAuthorityReferenceMaterialError,
  createPageAuthoritySourceResolver,
  identityReferenceProjectionSha256,
  loadPageAuthorityReferenceMaterial,
  parsePageAuthorityReferenceMaterial,
  resolvePageAuthorityIdentityReference,
} from "./internal/page_authority_reference_material.mjs";
