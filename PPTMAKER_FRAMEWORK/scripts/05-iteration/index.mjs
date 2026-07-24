export async function materializeStructuralChange(options) {
  const module = await import("./internal/application.mjs");
  return module.materializeStructuralChange(options);
}
