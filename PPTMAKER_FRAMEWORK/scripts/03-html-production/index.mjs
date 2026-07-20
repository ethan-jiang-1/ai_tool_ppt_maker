export async function validateHtmlRun(...args) {
  const module = await import("./internal/html_slide_contract.mjs");
  return module.validateHtmlFirstRun(...args);
}

export async function validateLegacySpecs(...args) {
  const module = await import("./internal/application.mjs");
  return module.validateLegacySpecs(...args);
}

export async function runStage1Inputs(...args) {
  const module = await import("./internal/application.mjs");
  return module.runStage1Inputs(...args);
}

export async function buildHtmlPlan(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.buildHtmlPlan(runDir, options);
}

export async function renderHtmlPages(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.renderHtmlPages(runDir, options);
}

export async function composeHtmlSlides(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.composeHtmlSlides(runDir, options);
}

export async function buildPresentation(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.buildPresentation(runDir, options);
}

export async function buildLegacyPresentation(options) {
  const module = await import("./internal/application.mjs");
  return module.buildLegacyPresentation(options);
}

export async function injectSpeakerNotes(runDir) {
  const module = await import("./internal/application.mjs");
  return module.injectSpeakerNotes(runDir);
}

export async function injectLegacySpeakerNotes(runDir) {
  const module = await import("./internal/application.mjs");
  return module.injectLegacySpeakerNotes(runDir);
}

export async function runStage5Cli(...args) {
  const module = await import("./internal/application.mjs");
  return module.runStage5Cli(...args);
}

export async function runHtmlProduction(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.runHtmlProduction(runDir, options);
}

export async function materializeStructuralVersion(options) {
  const module = await import("./internal/application.mjs");
  return module.materializeStructuralVersion(options);
}

export async function validateProductionHeaderReview(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.validateProductionHeaderReview(runDir, options);
}

export {
  HTML_FIRST_PIPELINE,
  HtmlSlideContractError,
  probeProductionMarker,
  validateAndBuildHtmlFirstPlan,
  validateHtmlFirstRun,
} from "./internal/html_slide_contract.mjs";
export {
  createCanonicalHtmlValidatedRunContext,
  createMigrationPreviewHtmlValidatedRunContext,
  publishHtmlComposition,
} from "./internal/html_slide_renderer.mjs";
export {
  classifyHtmlOwnerLiveness,
  htmlOwnerRoot,
  readHtmlCurrentManifest,
  readHtmlPreviewManifest,
} from "./internal/html_object_store.mjs";
export { publishHtmlDeliveryContactSheet } from "./internal/html_preview.mjs";
