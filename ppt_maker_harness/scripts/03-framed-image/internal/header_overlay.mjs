import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";

// The Framed adapter owns only this closed local header overlay. Provider page
// content, including body copy and callouts, never enters this module.

export const FRAMED_HEADER_OVERLAY_PRESET = "standard";

const CANVAS = Object.freeze({
  css_width: 1000,
  css_height: 562.5,
  capture_width: 2000,
  capture_height: 1125,
});
const FONT_FAMILIES = Object.freeze(["Source Sans 3", "Noto Sans SC"]);
const THEME = Object.freeze({
  text: "#fffdf8",
  muted_text: "#eee4d7",
  kicker: "#ffd27f",
  contrast: Object.freeze({
    kind: "text-shadow",
    color: "#000000",
    opacity: 0.42,
    offset_x: 0,
    offset_y: 1,
    blur: 3,
  }),
});
const HEADER_FIELDS = Object.freeze(["kicker", "title", "subtitle"]);

export class FramedHeaderOverlayError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedHeaderOverlayError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const STANDARD = deepFreeze({
  id: FRAMED_HEADER_OVERLAY_PRESET,
  canvas: CANVAS,
  font_families: FONT_FAMILIES,
  theme: THEME,
  protected_geometry: [
    { id: "header", x: 40, y: 28, width: 920, height: 238 },
  ],
  fields: {
    kicker: { x: 64, y: 54, width: 872, height: 22, font_size: 16, line_height: 20, weight: 600, color: THEME.kicker, max_lines: 1 },
    title: { x: 64, y: 82, width: 872, height: 104, font_size: 46, line_height: 52, weight: 700, color: THEME.text, max_lines: 2 },
    subtitle: { x: 64, y: 194, width: 872, height: 46, font_size: 23, line_height: 28, weight: 400, color: THEME.muted_text, max_lines: 1 },
  },
});

export const FRAMED_HEADER_OVERLAY_STANDARD = STANDARD;
export const FRAMED_HEADER_OVERLAY_STANDARD_DIGEST = canonicalJsonSha256(STANDARD);

/** Resolve the sole current overlay preset. Caller-supplied styling is rejected. */
export function resolveFramedHeaderOverlayPreset(preset = FRAMED_HEADER_OVERLAY_PRESET) {
  if (preset !== FRAMED_HEADER_OVERLAY_PRESET) {
    throw new FramedHeaderOverlayError("unsupported_header_overlay_preset", `FRAME PRESET must equal ${FRAMED_HEADER_OVERLAY_PRESET}`);
  }
  return STANDARD;
}

/** Validate the only local-rendering input permitted to the Framed adapter. */
export function validateFramedHeaderOverlay(headerOverlay) {
  if (!headerOverlay || typeof headerOverlay !== "object" || Array.isArray(headerOverlay)) {
    throw new FramedHeaderOverlayError("invalid_header_overlay", "a typed Framed header overlay is required");
  }
  const expected = new Set(["preset", ...HEADER_FIELDS]);
  for (const key of Object.keys(headerOverlay)) {
    if (!expected.has(key)) {
      throw new FramedHeaderOverlayError("untrusted_header_overlay_override", `header overlay must not supply ${key}`);
    }
  }
  resolveFramedHeaderOverlayPreset(headerOverlay.preset);
  for (const field of HEADER_FIELDS) {
    const value = headerOverlay[field] ?? null;
    if (value !== null && (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value))) {
      throw new FramedHeaderOverlayError("invalid_header_overlay_literal", `${field} must be null or one non-empty line of header text`);
    }
  }
  if (!headerOverlay.title) {
    throw new FramedHeaderOverlayError("missing_framed_title", "Framed header overlay requires title");
  }
  return Object.freeze(Object.fromEntries([
    ["preset", headerOverlay.preset],
    ...HEADER_FIELDS.map((field) => [field, headerOverlay[field] ?? null]),
  ]));
}
