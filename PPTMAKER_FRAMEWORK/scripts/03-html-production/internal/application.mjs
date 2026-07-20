export async function validateLegacySpecs(...args) {
  const module = await import("./stage1_inputs.mjs");
  return module.validateSpecs(...args);
}

export async function runStage1Inputs(...args) {
  const module = await import("./stage1_inputs.mjs");
  return module.runStage1Inputs(...args);
}

export async function buildHtmlPlan(runDir, options = {}) {
  const module = await import("../unified_pipeline.mjs");
  return module.stage1(runDir, options.dryRun ?? false, options);
}

export async function renderHtmlPages(runDir, options = {}) {
  const module = await import("./html_slide_renderer.mjs");
  const context = module.createCanonicalHtmlValidatedRunContext({ runDir });
  const tokens = Array.isArray(options.slideIds)
    ? options.slideIds
    : String(options.only || "").split(",").map((token) => token.trim()).filter(Boolean);
  const request = {
    ...(tokens.length ? { slideIds: module.resolveHtmlSlideSelectors(context, tokens) } : {}),
    ...(options.compositionVariant ? { compositionVariant: options.compositionVariant } : {}),
    ...(options.dryRun ? { dryRun: true } : {}),
  };
  return options.dryRun
    ? module.buildHtmlPages(context, request)
    : module.publishHtmlPages(context, request);
}

export async function composeHtmlSlides(runDir, options = {}) {
  const module = await import("./html_slide_renderer.mjs");
  const context = module.createCanonicalHtmlValidatedRunContext({ runDir });
  const tokens = Array.isArray(options.slideIds)
    ? options.slideIds
    : String(options.only || "").split(",").map((token) => token.trim()).filter(Boolean);
  const request = {
    ...(tokens.length ? { slideIds: module.resolveHtmlSlideSelectors(context, tokens) } : {}),
    ...(options.compositionVariant ? { compositionVariant: options.compositionVariant } : {}),
    ...(options.dryRun ? { dryRun: true } : {}),
  };
  return options.dryRun
    ? module.composeHtmlSlidesVerified(context, request)
    : module.publishHtmlFinalSlides(context, request);
}

export async function buildPresentation(runDir, options = {}) {
  const module = await import("./pptx_assembly.mjs");
  return module.buildPptxFromHtmlRunDir(runDir, options.title);
}

export async function buildLegacyPresentation(options) {
  const module = await import("./pptx_assembly.mjs");
  return module.buildPptx(options);
}

export async function injectSpeakerNotes(runDir) {
  const module = await import("./notes_injection.mjs");
  return module.injectHtmlNotesFromRunDir(runDir);
}

export async function injectLegacySpeakerNotes(runDir) {
  const module = await import("./notes_injection.mjs");
  return module.injectNotesFromRunDir(runDir);
}

export async function runStage5Cli(...args) {
  const module = await import("./notes_injection.mjs");
  return module.runStage5Cli(...args);
}

export async function runHtmlProduction(runDir, options = {}) {
  const module = await import("../unified_pipeline.mjs");
  return module.runPipeline({ runDir, ...options });
}

export async function materializeStructuralVersion(options) {
  const module = await import("../unified_pipeline.mjs");
  return module.materializeStructuralVersion(options);
}

export async function validateProductionHeaderReview(runDir, options = {}) {
  const module = await import("../unified_pipeline.mjs");
  return module.validateProductionHeaderReview(runDir, options);
}
