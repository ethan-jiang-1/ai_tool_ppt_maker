export async function validateHtmlRun(...args) {
  const module = await import("./internal/html_slide_contract.mjs");
  return module.validateHtmlFirstRun(...args);
}

export async function buildHtmlPlan(runDir, options = {}) {
  const module = await import("./unified_pipeline.mjs");
  return module.stage1(runDir, options.dryRun ?? false, options);
}

export async function renderHtmlPages(runDir, options = {}) {
  const module = await import("./unified_pipeline.mjs");
  return module.stage2Html(runDir, options);
}

export async function composeHtmlSlides(runDir, options = {}) {
  const module = await import("./unified_pipeline.mjs");
  return module.stage3Html(runDir, options);
}

export async function buildPresentation(runDir, options = {}) {
  const module = await import("./stage4_build_pptx.mjs");
  return module.buildPptxFromRunDir(runDir, options.title);
}

export async function injectSpeakerNotes(runDir) {
  const module = await import("./stage5_inject_notes.mjs");
  return module.injectHtmlNotesFromRunDir(runDir);
}

export async function runHtmlProduction(runDir, options = {}) {
  const module = await import("./unified_pipeline.mjs");
  return module.runPipeline({ runDir, ...options });
}
