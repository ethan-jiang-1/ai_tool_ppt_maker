export async function inspectLegacyProvider(options = {}) {
  const module = await import("./legacy-image2/internal/image_api_client.mjs");
  return Object.freeze({
    vendors: module.resolveVendors(options.baseUrls || []),
    model: module.DEFAULT_MODEL,
    heartbeat_ms: module.HEARTBEAT_MS,
  });
}

export async function legacyProviderDefaults() {
  const module = await import("./legacy-image2/internal/image_api_client.mjs");
  return Object.freeze({ model: module.DEFAULT_MODEL, heartbeat_ms: module.HEARTBEAT_MS });
}

export async function classifyLegacyProviderResponse(data) {
  const module = await import("./legacy-image2/internal/image_api_client.mjs");
  return Object.freeze({ image_ref: module.extractImageRef(data), task_id: module.extractTaskId(data) });
}

export async function legacyProviderHost(baseUrl) {
  const module = await import("./legacy-image2/internal/image_api_client.mjs");
  return module.providerHost(baseUrl);
}

export async function materializeStructuralChange(options) {
  const module = await import("./internal/application.mjs");
  return module.materializeStructuralChange(options);
}

export async function migrateHtmlRun(options) {
  const module = await import("./migration/html_migration.mjs");
  return module.migrateHtmlRun(options);
}

export async function previewHtmlMigration(runDir) {
  const module = await import("./migration/html_migration.mjs");
  return module.previewHtmlMigration(runDir);
}

export async function applyHtmlMigration(runDir, options = {}) {
  const module = await import("./migration/html_migration.mjs");
  return module.applyHtmlMigration(runDir, options);
}

export async function recoverHtmlMigrationApply(runDir, options = {}) {
  const module = await import("./migration/html_migration.mjs");
  return module.recoverHtmlMigrationApply(runDir, options);
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
} from "./legacy-image2/internal/header_review.mjs";
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
} from "./legacy-image2/internal/image_provenance.mjs";
export { resolveRenderArtifact } from "./legacy-image2/internal/render_artifacts.mjs";

export async function generateLegacyImages(options) {
  const module = await import("./internal/application.mjs");
  return module.generateLegacyImages(options);
}

export async function generateLegacyStyleMaster(options) {
  const module = await import("./internal/application.mjs");
  return module.generateLegacyStyleMaster(options);
}

export async function runLegacyStyleMasterCli(argv, options) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyStyleMasterCli(argv, options);
}

export async function buildLegacyImageFailureDiagnostic(options) {
  const module = await import("./internal/application.mjs");
  return module.buildLegacyImageFailureDiagnostic(options);
}

export async function runLegacyImageGenerationCli(argv) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyImageGenerationCli(argv);
}

export async function buildLegacyContactSheet(options) {
  const module = await import("./internal/application.mjs");
  return module.buildLegacyContactSheet(options);
}

export async function runLegacyContactSheetCli(argv) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyContactSheetCli(argv);
}

export async function lockLegacyHeaders(options) {
  const module = await import("./internal/application.mjs");
  return module.lockLegacyHeaders(options);
}

export async function runLegacyHeaderLockCli(argv) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyHeaderLockCli(argv);
}

export async function runLegacyProduction(runDir, options = {}) {
  const module = await import("./internal/application.mjs");
  return module.runLegacyProduction(runDir, options);
}

export async function resolveLegacyFinalSlides({ runDir, directory, slides }) {
  const module = await import("./internal/application.mjs");
  return module.resolveLegacyFinalSlides({ runDir, directory, slides });
}

export async function buildLegacyPresentation(options) {
  const module = await import("./internal/application.mjs");
  return module.buildLegacyPresentation(options);
}
