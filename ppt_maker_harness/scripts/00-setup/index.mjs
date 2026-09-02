/**
 * 00-setup — Operation-scoped readiness: environment checking and runtime setup facade.
 * Authority: openspec/specs/environment-check/spec.md
 */

export async function inspectBaseEnvironment(options = {}) {
  const module = await import("./internal/application.mjs");
  return module.inspectBaseEnvironment(options);
}

export async function runEnvironmentCheckCli(argv, options) {
  const module = await import("./internal/application.mjs");
  return module.runEnvironmentCheckCli(argv, options);
}

export async function inspectHtmlRuntime(options = {}) {
  const module = await import("./internal/html_runtime.mjs");
  return module.inspectHtmlRuntime(options);
}

export {
  HTML_RUNTIME_PROFILE,
  launchPinnedChromium,
} from "./internal/html_runtime.mjs";
export {
  FRAMED_FONT_RENDER_INVENTORY_SCHEMA,
  FRAMED_FONT_SELECTION_ALGORITHM,
  FRAMED_FONT_SELECTION_SCHEMA,
  HTML_FONT_ROOT,
  HtmlFontSelectionError,
  buildFontInventory,
  framedFontRenderInventoryDigest,
  loadFramedFontRenderInventory,
  parseUnicodeRanges,
  selectFramedHeaderOverlayFontFaces,
  verifyHtmlFontBundle,
} from "./internal/html_fonts.mjs";

export async function inspectFontReadiness(options = {}) {
  const module = await import("./internal/html_fonts.mjs");
  return module.verifyHtmlFontBundle(options);
}

export { discoverNpmPackages as discoverRuntimePackages } from "./internal/npm_packages.mjs";
