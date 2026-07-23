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
  generationFingerprint,
  generationProfile,
  inspectImageProvenance,
  materializeVerifiedRawImage,
  provenanceRepairHint,
  publishMaterializedRawImages,
  readImageManifest,
} from "./internal/image_provenance.mjs";
export { readArtifactManifest, resolveRenderArtifact } from "./internal/render_artifacts.mjs";

export async function inspectLegacyProvider(options = {}) {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ vendors: module.resolveVendors(options.baseUrls || []), model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}
export async function legacyProviderDefaults() {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}
export async function classifyLegacyProviderResponse(data) {
  const module = await import("./internal/image_api_client.mjs");
  return Object.freeze({ image_ref: module.extractImageRef(data), task_id: module.extractTaskId(data) });
}
export async function legacyProviderHost(baseUrl) { return (await import("./internal/image_api_client.mjs")).providerHost(baseUrl); }
export async function generateLegacyImages(options) { return (await import("./internal/image_generation.mjs")).generateImages(options); }
export async function generateLegacyStyleMaster(options) { return (await import("./internal/style_master.mjs")).generateStyleMaster(options); }
export async function runLegacyStyleMasterCli(argv, options) { return (await import("./internal/style_master.mjs")).runStyleMasterCli(argv, options); }
export async function buildLegacyImageFailureDiagnostic(options) { return (await import("./internal/image_generation.mjs")).buildImageFailureDiagnostic(options); }
export async function runLegacyImageGenerationCli(argv) { return (await import("./internal/image_generation.mjs")).runLegacyImageGenerationCli(argv); }
export async function buildLegacyContactSheet(options) { return (await import("./internal/contact_sheet.mjs")).makeContactSheet(options); }
export async function runLegacyContactSheetCli(argv) { return (await import("./internal/contact_sheet.mjs")).runContactSheetCli(argv); }
export async function lockLegacyHeaders(options) { return (await import("./internal/header_lock.mjs")).lockHeaders(options); }
export async function runLegacyHeaderLockCli(argv) {
  if (argv.includes("--help") || argv.includes("-h")) return console.log("Usage: node stage3_lock_headers.mjs --images <dir> --slide-plan <file> --out <dir> [--style-dir <dir>]");
  return (await import("./internal/header_lock.mjs")).runHeaderLockCli(argv);
}
export async function resolveLegacyFinalSlides({ runDir, directory, slides }) {
  const artifacts = await import("./internal/render_artifacts.mjs");
  const identity = await import("../../shared/identity/render_artifacts.mjs");
  const { join } = await import("node:path");
  const { manifest, error: manifestError } = artifacts.readArtifactManifest(join(directory, "_manifest.json"));
  const resolved = slides.map((slide) => artifacts.resolveRenderArtifact({ directory, manifest, manifestError, slideId: slide.slide_id || slide.id, renderEngine: slide.render_engine || identity.RENDER_ENGINE_IMAGE2, artifactKind: identity.ARTIFACT_KIND_FINAL_SLIDE }));
  return { resolved, entries: resolved.every((entry) => entry.status === identity.ARTIFACT_STATUS_VERIFIED) ? await artifacts.adaptLegacyFinalSlideArtifacts({ runDir, artifacts: resolved }) : null };
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
  return phase3.buildLegacyPresentation({ images, slidePlan, out, title, legacySlides: await resolveLegacyFinalSlides({ runDir, directory: images, slides: plan.slides || [] }) });
}
