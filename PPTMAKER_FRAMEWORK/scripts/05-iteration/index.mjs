export async function inspectLegacyProvider(options = {}) {
  const module = await import("../04-image-production/index.mjs");
  return Object.freeze({
    vendors: module.resolveVendors(options.baseUrls || []),
    model: module.DEFAULT_MODEL,
    heartbeat_ms: module.HEARTBEAT_MS,
  });
}

export async function legacyProviderDefaults() {
  const module = await import("../04-image-production/index.mjs");
  return Object.freeze({ model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}

export async function classifyLegacyProviderResponse(data) {
  const module = await import("../04-image-production/index.mjs");
  return Object.freeze({ image_ref: module.extractImageRef(data), task_id: module.extractTaskId(data) });
}

export async function legacyProviderHost(baseUrl) {
  const module = await import("../04-image-production/index.mjs");
  return module.providerHost(baseUrl);
}

export async function materializeStructuralChange(options) {
  const module = await import("./internal/application.mjs");
  return module.materializeStructuralChange(options);
}

export async function prepareProductionModeTransition(runDir, options = {}) {
  const module = await import("./migration/production_mode_transition.mjs");
  return module.prepareProductionModeTransition(runDir, options);
}

export async function previewProductionModeTransition(runDir) {
  const module = await import("./migration/production_mode_transition.mjs");
  return module.previewProductionModeTransition(runDir);
}

export async function confirmProductionModeTransition(runDir, options = {}) {
  const module = await import("./migration/production_mode_transition.mjs");
  return module.confirmPreparedProductionModeTransition(runDir, options);
}

export async function applyProductionModeTransition(runDir, options = {}) {
  const module = await import("./migration/production_mode_transition.mjs");
  return module.applyProductionModeTransition(runDir, options);
}

export async function recoverProductionModeTransition(runDir, options = {}) {
  const module = await import("./migration/production_mode_transition.mjs");
  return module.recoverProductionModeTransition(runDir, options);
}

export async function inspectLegacyHeaderReview(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.inspectLegacyHeaderReview(runDir, options);
}

export {
  HEADER_REVIEW_NODE,
  buildHeaderReviewInputs,
  changedFullPageIds,
  collectPilotProvenance,
  mergeHeaderReviewRecord,
  validateHeaderReviewRecord,
  versionKey,
} from "../04-image-production/index.mjs";
export {
  carryForwardHeaderReview,
  computeStructuralImpact,
} from "./structural/structural_reuse.mjs";
export {
  generationFingerprint,
  generationProfile,
  inspectImageProvenance,
  materializeVerifiedRawImage,
  provenanceRepairHint,
  publishMaterializedRawImages,
  readImageManifest,
} from "../04-image-production/index.mjs";
export { resolveRenderArtifact } from "../04-image-production/index.mjs";

export async function generateLegacyImages(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.generateLegacyImages(options);
}

export async function generateLegacyStyleMaster(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.generateLegacyStyleMaster(options);
}

export async function runLegacyStyleMasterCli(argv, options) {
  const module = await import("../04-image-production/index.mjs");
  return module.runLegacyStyleMasterCli(argv, options);
}

export async function buildLegacyImageFailureDiagnostic(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.buildLegacyImageFailureDiagnostic(options);
}

export async function runLegacyImageGenerationCli(argv) {
  const module = await import("../04-image-production/index.mjs");
  return module.runLegacyImageGenerationCli(argv);
}

export async function buildLegacyContactSheet(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.buildLegacyContactSheet(options);
}

export async function runLegacyContactSheetCli(argv) {
  const module = await import("../04-image-production/index.mjs");
  return module.runLegacyContactSheetCli(argv);
}

export async function lockLegacyHeaders(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.lockLegacyHeaders(options);
}

export async function runLegacyHeaderLockCli(argv) {
  const module = await import("../04-image-production/index.mjs");
  return module.runLegacyHeaderLockCli(argv);
}

export async function runLegacyProduction(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyProduction(runDir, options);
}

export async function resolveLegacyFinalSlides({ runDir, directory, slides }) {
  const module = await import("../04-image-production/index.mjs");
  return module.resolveLegacyFinalSlides({ runDir, directory, slides });
}

export async function buildLegacyPresentation(options) {
  const module = await import("../04-image-production/index.mjs");
  return module.buildLegacyPresentation(options);
}
