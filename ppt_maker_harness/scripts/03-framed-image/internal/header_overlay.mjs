// The Framed adapter owns only this closed local header overlay. Provider page
// content, including body copy and callouts, never enters this module.

const HEADER_FIELDS = Object.freeze(["kicker", "title", "subtitle"]);

export class FramedHeaderOverlayError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedHeaderOverlayError";
    this.code = code;
  }
}

/** Validate the only local-rendering input permitted to the Framed adapter. */
export function validateFramedHeaderOverlay(headerOverlay) {
  if (!headerOverlay || typeof headerOverlay !== "object" || Array.isArray(headerOverlay)) {
    throw new FramedHeaderOverlayError("invalid_header_overlay", "a typed Framed header overlay is required");
  }
  const expected = new Set(["profile", ...HEADER_FIELDS]);
  for (const key of Object.keys(headerOverlay)) {
    if (!expected.has(key)) {
      throw new FramedHeaderOverlayError("untrusted_header_overlay_override", `header overlay must not supply ${key}`);
    }
  }
  const profile = headerOverlay.profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile) ||
    typeof profile.id !== "string" || !profile.id || !Array.isArray(profile.permitted_fields)) {
    throw new FramedHeaderOverlayError("invalid_header_overlay_profile", "header overlay requires one resolved Framed presentation profile");
  }
  for (const field of HEADER_FIELDS) {
    const value = headerOverlay[field] ?? null;
    if (value !== null && (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value))) {
      throw new FramedHeaderOverlayError("invalid_header_overlay_literal", `${field} must be null or one non-empty line of header text`);
    }
    if (value !== null && !profile.permitted_fields.includes(field)) {
      throw new FramedHeaderOverlayError("framed_header_field_forbidden", `resolved Framed profile ${profile.id} does not permit ${field}`);
    }
  }
  if (!headerOverlay.title) {
    throw new FramedHeaderOverlayError("missing_framed_title", "Framed header overlay requires title");
  }
  return Object.freeze(Object.fromEntries([
    ["profile", profile],
    ...HEADER_FIELDS.map((field) => [field, headerOverlay[field] ?? null]),
  ]));
}
