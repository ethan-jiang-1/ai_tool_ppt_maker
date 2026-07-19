export async function loadVisualSystem(...args) {
  const module = await import("./internal/visual_config.mjs");
  return module.loadVisualConfig(...args);
}

export async function loadHtmlVisualSystem(...args) {
  const module = await import("./internal/visual_config.mjs");
  return module.loadHtmlVisualConfig(...args);
}

export async function loadVisualAssetCatalog(...args) {
  const module = await import("./internal/html_asset_catalog.mjs");
  return module.loadHtmlAssetCatalog(...args);
}

export async function loadFamilyGeometry(...args) {
  const module = await import("./internal/html_family_geometry.mjs");
  return module.loadHtmlFamilyGeometryRegistry(...args);
}

export async function loadDeckSystem(...args) {
  const module = await import("./internal/deck_system.mjs");
  return module.loadDeckSystem(...args);
}
