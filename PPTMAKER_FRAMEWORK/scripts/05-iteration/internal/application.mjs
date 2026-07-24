export async function materializeStructuralChange(options) {
  const module = await import("../../03-html-production/index.mjs");
  return module.materializeStructuralVersion(options);
}
