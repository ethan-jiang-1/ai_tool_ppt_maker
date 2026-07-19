export async function parseStructuredSlideDocument(...args) {
  const module = await import("./internal/slide_document.mjs");
  return module.parseSlideDocument(...args);
}

export async function validateStructuredSlideDocument(...args) {
  const module = await import("./internal/slide_document.mjs");
  return module.validateSlideDocument(...args);
}

export async function resolveSlideIdentityBindings(...args) {
  const module = await import("./internal/slide_ids.mjs");
  return module.resolveSlideBindings(...args);
}

export async function resolveSlideIdentities(...args) {
  const module = await import("./internal/slide_ids.mjs");
  return module.resolveSlideIds(...args);
}

export async function inspectRenderPolicy(...args) {
  const module = await import("./internal/render_policy.mjs");
  return module.parseRenderPolicy(...args);
}
