export async function materializeStructuralChange(options) {
  const module = await import("../../04-image-production/index.mjs");
  return module.applyPageAuthorityStructuralRaw(options);
}
