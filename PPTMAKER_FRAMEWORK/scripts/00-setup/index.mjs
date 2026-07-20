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
  HTML_FONT_ROOT,
  buildFontInventory,
  parseUnicodeRanges,
  verifyHtmlFontBundle,
} from "./internal/html_fonts.mjs";

export async function inspectFontReadiness(options = {}) {
  const module = await import("./internal/html_fonts.mjs");
  return module.verifyHtmlFontBundle(options);
}

export { discoverNpmPackages as discoverRuntimePackages } from "./internal/npm_packages.mjs";
