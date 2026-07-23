/** Canonical, path-qualified direct CLI inventory. Pure checked-in data only. */
export const EXECUTABLE_INVENTORY = Object.freeze([
  "ppt_flow.mjs",
  "00-setup/env-check.mjs",
  "03-html-production/stage1_build_inputs.mjs",
  "03-html-production/stage2_render_html.mjs",
  "03-html-production/stage3_compose_slides.mjs",
  "03-html-production/stage4_build_pptx.mjs",
  "03-html-production/stage5_inject_notes.mjs",
  "03-html-production/unified_pipeline.mjs",
  "04-image-production/whole-page/generate_style_master.mjs",
  "04-image-production/whole-page/make_contact_sheet.mjs",
  "04-image-production/whole-page/stage2_generate_images.mjs",
  "04-image-production/whole-page/stage3_lock_headers.mjs",
  "shared/run-bundle/bundle_layout.mjs",
  "shared/run-bundle/lessons.mjs",
]);

export function normalizeExecutablePath(value) {
  if (typeof value !== "string") return "";
  return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

export function isRegisteredExecutable(value) {
  return EXECUTABLE_INVENTORY.includes(normalizeExecutablePath(value));
}
