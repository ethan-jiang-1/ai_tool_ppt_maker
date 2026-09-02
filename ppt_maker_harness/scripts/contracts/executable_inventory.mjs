/** Canonical, path-qualified direct CLI inventory. Pure checked-in data only. */
export const EXECUTABLE_INVENTORY = Object.freeze([
  "ppt_flow.mjs",
  "00-setup/env-check.mjs",
  "shared/image2/lab_cli.mjs",
  "shared/run-bundle/bundle_layout.mjs",
  "shared/run-bundle/bundle_cli.mjs",
  "shared/run-bundle/lessons.mjs",
]);

export function normalizeExecutablePath(value) {
  if (typeof value !== "string") return "";
  return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

export function isRegisteredExecutable(value) {
  return EXECUTABLE_INVENTORY.includes(normalizeExecutablePath(value));
}
