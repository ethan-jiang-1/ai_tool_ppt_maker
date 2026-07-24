export {
  HEADER_REVIEW_NODE,
  buildHeaderReviewInputs,
  changedFullPageIds,
  collectPilotProvenance,
  mergeHeaderReviewRecord,
  sameGenerationProfile,
  validateHeaderReviewRecord,
  versionKey,
} from "./internal/header_review.mjs";
export {
  carryForwardHeaderReview,
  computeStructuralImpact,
} from "./structural_reuse.mjs";
export {
  generationFingerprint,
  generationProfile,
  inspectImageProvenance,
  materializeVerifiedRawImage,
  provenanceRepairHint,
  publishMaterializedRawImages,
  readImageManifest,
} from "./internal/image_provenance.mjs";
export { readArtifactManifest, resolveRenderArtifact } from "./internal/render_artifacts.mjs";

export async function inspectWholePageProvider(options = {}) {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ vendors: module.resolveVendors(options.baseUrls || []), model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}
export async function wholePageProviderDefaults() {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}
export async function classifyWholePageProviderResponse(data) {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ image_ref: module.extractImageRef(data), task_id: module.extractTaskId(data) });
}
export async function wholePageProviderHost(baseUrl) { return (await import("./internal/image_api_client.mjs")).providerHost(baseUrl); }
export async function inspectWholePageHeaderReview(runDir, options = {}) {
  const module = await import("../../03-html-production/index.mjs");
  return module.validateProductionHeaderReview(runDir, options);
}
export async function generateWholePageImages(options) { return (await import("./internal/image_generation.mjs")).generateImages(options); }
export async function generateWholePageStyleMaster(options) { return (await import("./internal/style_master.mjs")).generateStyleMaster(options); }
export async function runWholePageStyleMasterCli(argv, options) { return (await import("./internal/style_master.mjs")).runStyleMasterCli(argv, options); }
export async function buildWholePageImageFailureDiagnostic(options) { return (await import("./internal/image_generation.mjs")).buildImageFailureDiagnostic(options); }
export async function runWholePageImageGenerationCli(argv) { return (await import("./internal/image_generation.mjs")).runWholePageImageGenerationCli(argv); }
export async function buildWholePageContactSheet(options) { return (await import("./internal/contact_sheet.mjs")).makeContactSheet(options); }
export async function runWholePageContactSheetCli(argv) { return (await import("./internal/contact_sheet.mjs")).runContactSheetCli(argv); }
export async function lockWholePageHeaders(options) { return (await import("./internal/header_lock.mjs")).lockHeaders(options); }
export async function runWholePageHeaderLockCli(argv) {
  if (argv.includes("--help") || argv.includes("-h")) return console.log("Usage: node stage3_lock_headers.mjs --images <dir> --slide-plan <file> --out <dir> [--style-dir <dir>]");
  return (await import("./internal/header_lock.mjs")).runHeaderLockCli(argv);
}
export async function resolveWholePageFinalSlides({ runDir, directory, slides }) {
  const artifacts = await import("./internal/render_artifacts.mjs");
  const identity = await import("../../shared/identity/render_artifacts.mjs");
  const { join } = await import("node:path");
  const { manifest, error: manifestError } = artifacts.readArtifactManifest(join(directory, "_manifest.json"));
  const resolved = slides.map((slide) => artifacts.resolveRenderArtifact({ directory, manifest, manifestError, slideId: slide.slide_id || slide.id, renderEngine: slide.render_engine || identity.RENDER_ENGINE_IMAGE2, artifactKind: identity.ARTIFACT_KIND_FINAL_SLIDE }));
  return {
    resolved,
    entries: resolved.every((entry) => entry.status === identity.ARTIFACT_STATUS_VERIFIED)
      ? await artifacts.adaptWholePageFinalSlideArtifacts({ runDir, artifacts: resolved })
      : [],
  };
}
export async function buildWholePagePresentation({ runDir, title = "Presentation", images: imagesOverride = null, slidePlan: slidePlanOverride = null, out: outOverride = null }) {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const layout = await import("../../shared/run-bundle/bundle_layout.mjs");
  const phase3 = await import("../../03-html-production/index.mjs");
  const generated = layout.generatedDir(runDir);
  const images = imagesOverride || join(generated, layout.GEN_HEADER_LOCKED_SUBDIR);
  const slidePlan = slidePlanOverride || join(generated, layout.GEN_SLIDE_PLAN);
  const out = outOverride || join(generated, layout.GEN_PPT_SUBDIR, "deck.pptx");
  const plan = JSON.parse(readFileSync(slidePlan, "utf8"));
  return phase3.assembleWholePagePptx({ runDir, images, slidePlan, out, title, finalSlides: await resolveWholePageFinalSlides({ runDir, directory: images, slides: plan.slides || [] }) });
}
