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

/**
 * Resolve the currently published Stage-3 final-slide set through its owner
 * manifest. This stays local/provider-free and gives downstream optional
 * workflows one audited delivery digest rather than a synthetic status hash.
 */
export async function resolveCurrentHtmlFinalSlideDelivery(runDir, { htmlProductionResetId = null } = {}) {
  const contract = await import("./internal/html_slide_contract.mjs");
  const artifacts = await import("./internal/final_slide_artifacts.mjs");
  const { plan } = contract.validateAndBuildHtmlFirstPlan({ runDir });
  return artifacts.resolveHtmlFinalSlideArtifacts({ runDir, plan, htmlProductionResetId });
}

/** Provider-free local recomposition seam used after a Phase-4 source change. */
export async function recomposeHtmlSlidesLocally(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  // Accepted Phase-4 source assets must rebuild the ordinary final-slide
  // evidence locally. This seam deliberately uses the public compositor and
  // never reaches a provider transport.
  const planned = await module.buildHtmlPlan(runDir, { dryRun: false });
  if (planned !== true) throw new Error("local recomposition could not publish the current HTML plan");
  const pages = await module.renderHtmlPages(runDir, { ...options, dryRun: false });
  const final = await module.composeHtmlSlides(runDir, { ...options, dryRun: false });
  return { ...final, pages: pages.pages, provider_calls: 0 };
}

export const recomposeHtmlSlides = recomposeHtmlSlidesLocally;

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
  bindHtmlPrimaryVisualSelection,
  prepareHtmlPrimaryVisualSelection,
  HTML_FIRST_PIPELINE,
  HtmlSlideContractError,
  probeProductionMarker,
  validateAndBuildHtmlFirstPlan,
  validateHtmlFirstRun,
} from "./internal/html_slide_contract.mjs";
export {
  createCanonicalHtmlValidatedRunContext,
  createMigrationPreviewHtmlValidatedRunContext,
  composeHtmlVisualSlotCandidate,
  composeReviewOnlyVisualSlotCandidate,
  publishHtmlComposition,
} from "./internal/html_slide_renderer.mjs";
export {
  classifyHtmlOwnerLiveness,
  htmlOwnerRoot,
  readHtmlCurrentManifest,
  readHtmlPreviewManifest,
} from "./internal/html_object_store.mjs";
export { publishHtmlDeliveryContactSheet } from "./internal/html_preview.mjs";
