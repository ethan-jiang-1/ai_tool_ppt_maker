export async function materializeStructuralChange(options) {
  const module = await import("../../03-html-production/index.mjs");
  return module.materializeStructuralVersion(options);
}

export async function inspectLegacyHeaderReview(runDir, options = {}) {
  const module = await import("../../03-html-production/index.mjs");
  return module.validateProductionHeaderReview(runDir, options);
}

export async function runLegacyProduction(runDir, options = {}) {
  const module = await import("../../03-html-production/index.mjs");
  return module.runHtmlProduction(runDir, options);
}

export async function generateLegacyImages(options) {
  const module = await import("../legacy-image2/internal/image_generation.mjs");
  return module.generateImages(options);
}

export async function generateLegacyStyleMaster(options) {
  const module = await import("../legacy-image2/internal/style_master.mjs");
  return module.generateStyleMaster(options);
}

export async function runLegacyStyleMasterCli(argv, options) {
  const module = await import("../legacy-image2/internal/style_master.mjs");
  return module.runStyleMasterCli(argv, options);
}

export async function buildLegacyImageFailureDiagnostic(options) {
  const module = await import("../legacy-image2/internal/image_generation.mjs");
  return module.buildImageFailureDiagnostic(options);
}

export async function runLegacyImageGenerationCli(argv) {
  const module = await import("../legacy-image2/internal/image_generation.mjs");
  return module.runLegacyImageGenerationCli(argv);
}

export async function buildLegacyContactSheet(options) {
  const module = await import("../legacy-image2/internal/contact_sheet.mjs");
  return module.makeContactSheet(options);
}

export async function runLegacyContactSheetCli(argv) {
  const module = await import("../legacy-image2/internal/contact_sheet.mjs");
  return module.runContactSheetCli(argv);
}

export async function lockLegacyHeaders(options) {
  const module = await import("../legacy-image2/internal/header_lock.mjs");
  return module.lockHeaders(options);
}

export async function runLegacyHeaderLockCli(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Usage: node stage3_lock_headers.mjs --images <dir> --slide-plan <file> --out <dir> [--style-dir <dir>] [--color-palette <file>]");
    return;
  }
  const module = await import("../legacy-image2/internal/header_lock.mjs");
  return module.runHeaderLockCli(argv);
}

export async function resolveLegacyFinalSlides({ runDir, directory, slides }) {
  const artifacts = await import("../legacy-image2/internal/render_artifacts.mjs");
  const identity = await import("../../shared/identity/render_artifacts.mjs");
  const { join } = await import("node:path");
  const { manifest, error: manifestError } = artifacts.readArtifactManifest(join(directory, "_manifest.json"));
  const resolved = slides.map((slide) => artifacts.resolveRenderArtifact({
    directory,
    manifest,
    manifestError,
    slideId: slide.slide_id || slide.id,
    renderEngine: slide.render_engine || identity.RENDER_ENGINE_IMAGE2,
    artifactKind: identity.ARTIFACT_KIND_FINAL_SLIDE,
  }));
  return {
    resolved,
    entries: resolved.every((entry) => entry.status === identity.ARTIFACT_STATUS_VERIFIED)
      ? await artifacts.adaptLegacyFinalSlideArtifacts({ runDir, artifacts: resolved })
      : null,
  };
}

export async function buildLegacyPresentation({ runDir, title = "Presentation", images: imagesOverride = null, slidePlan: slidePlanOverride = null, out: outOverride = null }) {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const layout = await import("../../shared/run-bundle/bundle_layout.mjs");
  const phase3 = await import("../../03-html-production/index.mjs");
  const generated = layout.generatedDir(runDir);
  const images = imagesOverride || join(generated, layout.GEN_HEADER_LOCKED_SUBDIR);
  const slidePlan = slidePlanOverride || join(generated, layout.GEN_SLIDE_PLAN);
  const out = outOverride || join(generated, layout.GEN_PPT_SUBDIR, "deck.pptx");
  const plan = JSON.parse(readFileSync(slidePlan, "utf8"));
  const legacySlides = await resolveLegacyFinalSlides({ runDir, directory: images, slides: plan.slides || [] });
  return phase3.buildLegacyPresentation({ images, slidePlan, out, title, legacySlides });
}
