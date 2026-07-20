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
