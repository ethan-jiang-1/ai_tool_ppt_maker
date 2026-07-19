export async function inspectLegacyProvider(options = {}) {
  const module = await import("../00-setup/env-check.mjs");
  if (options.probeVendors) return module.checkProbeVendors(options);
  if (options.smoke) return module.checkImageSmoke(options);
  return { ok: true, selected: false };
}

export async function materializeStructuralChange(options) {
  const module = await import("../03-html-production/unified_pipeline.mjs");
  return module.materializeStructuralVersion(options);
}

export async function migrateHtmlRun(options) {
  const module = await import("./migration/html_migration.mjs");
  return module.migrateHtmlRun(options);
}

export async function runLegacyProduction(runDir, options = {}) {
  const module = await import("../03-html-production/unified_pipeline.mjs");
  return module.runPipeline({ runDir, ...options });
}
