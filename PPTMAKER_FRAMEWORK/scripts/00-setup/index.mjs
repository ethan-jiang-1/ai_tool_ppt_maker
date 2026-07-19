export async function inspectBaseEnvironment(options = {}) {
  const module = await import("./env-check.mjs");
  return module.runChecks(options);
}

export async function inspectHtmlRuntime(options = {}) {
  const module = await import("./internal/html_runtime.mjs");
  return module.inspectHtmlRuntime(options);
}

export async function inspectFontReadiness(options = {}) {
  const module = await import("./internal/html_fonts.mjs");
  return module.verifyHtmlFontBundle(options);
}

export async function discoverRuntimePackages(start) {
  const module = await import("./env-check.mjs");
  return module.discoverNpmPackages(start);
}
