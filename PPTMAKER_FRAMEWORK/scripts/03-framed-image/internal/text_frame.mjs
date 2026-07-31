import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";

// Framed-specific preset and typed literal validation belong to the Framed workflow.

export const FRAMED_TEXT_FRAME_PRESET = "standard-v1";

const CANVAS = Object.freeze({ css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 });
const FONT_FAMILIES = Object.freeze(["Source Sans 3", "Noto Sans SC"]);
const BASE_THEME = Object.freeze({
  panel: "#f5f0eb",
  panel_opacity: 0.96,
  text: "#2d1b11",
  muted_text: "#6b5b4f",
  kicker: "#d97706",
});
const FIELD_ORDER = Object.freeze(["kicker", "title", "subtitle", "callout"]);

export class FramedTextFrameError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FramedTextFrameError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function standardVariant({ callout }) {
  const header = {
    x: 40,
    y: 28,
    width: 920,
    height: 238,
  };
  return {
    id: callout ? "callout_present" : "callout_absent",
    panels: callout ? [
      { id: "header", ...header },
      { id: "callout", x: 40, y: 482, width: 920, height: 48 },
    ] : [{ id: "header", ...header }],
    reserved_underlay_rectangles: callout ? [
      { x: 0, y: 0, width: 1000, height: 286 },
      { x: 0, y: 466, width: 1000, height: 96 },
    ] : [{ x: 0, y: 0, width: 1000, height: 286 }],
    fields: {
      kicker: { x: 64, y: 54, width: 872, height: 22, font_size: 16, line_height: 20, weight: 600, color: BASE_THEME.kicker, max_lines: 1 },
      title: { x: 64, y: 82, width: 872, height: 104, font_size: 46, line_height: 52, weight: 700, color: BASE_THEME.text, max_lines: 2 },
      subtitle: { x: 64, y: 194, width: 872, height: 46, font_size: 23, line_height: 28, weight: 400, color: BASE_THEME.muted_text, max_lines: 1 },
      callout: callout ? { x: 64, y: 494, width: 872, height: 24, font_size: 17, line_height: 22, weight: 600, color: BASE_THEME.text, max_lines: 1 } : null,
    },
  };
}

const STANDARD_V1 = deepFreeze({
  id: FRAMED_TEXT_FRAME_PRESET,
  canvas: CANVAS,
  font_families: FONT_FAMILIES,
  theme: BASE_THEME,
  variants: {
    callout_absent: standardVariant({ callout: false }),
    callout_present: standardVariant({ callout: true }),
  },
});

export const FRAMED_TEXT_FRAME_STANDARD_V1 = STANDARD_V1;
export const FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST = canonicalJsonSha256(STANDARD_V1);

/** Resolve the sole v1 preset. No caller supplied visual settings are accepted. */
export function resolveFramedTextFramePreset(preset = FRAMED_TEXT_FRAME_PRESET) {
  if (preset !== FRAMED_TEXT_FRAME_PRESET) {
    throw new FramedTextFrameError("unsupported_frame_preset", `FRAME PRESET must equal ${FRAMED_TEXT_FRAME_PRESET}`);
  }
  return STANDARD_V1;
}

export function validateFramedTextFrame(textFrame) {
  if (!textFrame || typeof textFrame !== "object" || Array.isArray(textFrame)) {
    throw new FramedTextFrameError("invalid_text_frame", "a typed Framed text_frame receipt is required");
  }
  const expected = new Set(["preset", ...FIELD_ORDER]);
  for (const key of Object.keys(textFrame)) {
    if (!expected.has(key)) throw new FramedTextFrameError("untrusted_text_frame_override", `text_frame must not supply ${key}`);
  }
  resolveFramedTextFramePreset(textFrame.preset);
  for (const field of FIELD_ORDER) {
    const value = textFrame[field] ?? null;
    if (value !== null && (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value))) {
      throw new FramedTextFrameError("invalid_text_frame_literal", `${field} must be null or one non-empty line of display text`);
    }
  }
  if (!textFrame.title) throw new FramedTextFrameError("missing_framed_title", "Framed text_frame requires title");
}
