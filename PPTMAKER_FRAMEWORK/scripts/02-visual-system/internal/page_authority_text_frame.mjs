import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";

export const FRAMED_TEXT_FRAME_PRESET = "standard-v1";
export const FRAMED_TEXT_FRAME_PREFLIGHT_SCHEMA = "pptmaker-framed-text-frame-preflight-v1";

const CANVAS = Object.freeze({ css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 });
const FONT_FAMILIES = Object.freeze(["Source Sans 3", "Noto Sans SC"]);
const BASE_THEME = Object.freeze({
  panel: "#f5f0eb",
  panel_opacity: 0.96,
  text: "#2d1b11",
  muted_text: "#6b5b4f",
  kicker: "#d97706",
  border: "#e1d4c6",
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
    padding: 24,
    opacity: BASE_THEME.panel_opacity,
  };
  return {
    id: callout ? "callout_present" : "callout_absent",
    panels: callout ? [
      { id: "header", ...header },
      { id: "callout", x: 40, y: 482, width: 920, height: 48, padding: 14, opacity: BASE_THEME.panel_opacity },
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

function glyphWidthFactor(character) {
  const code = character.codePointAt(0);
  if (/\s/.test(character)) return 0.29;
  if (code >= 0x2e80) return 1;
  if (/[A-Z]/.test(character)) return 0.63;
  if (/[a-z]/.test(character)) return 0.54;
  if (/[0-9]/.test(character)) return 0.56;
  return 0.36;
}

function measuredWidth(text, fontSize) {
  return [...text].reduce((total, character) => total + glyphWidthFactor(character) * fontSize, 0);
}

function isCjk(character) {
  return character.codePointAt(0) >= 0x2e80;
}

function splitForWrap(text) {
  const parts = [];
  let latin = "";
  const flushLatin = () => {
    if (latin) parts.push({ text: latin, breakable_before: true });
    latin = "";
  };
  for (const character of [...text.trim()]) {
    if (/\s/.test(character)) {
      flushLatin();
      continue;
    }
    if (isCjk(character)) {
      flushLatin();
      parts.push({ text: character, breakable_before: false });
    } else {
      latin += character;
    }
  }
  flushLatin();
  return parts;
}

function wrapText(text, geometry) {
  const parts = splitForWrap(text);
  if (parts.length === 0) return { lines: [], widest: 0, unbreakable_overflow: false };
  const lines = [];
  let current = "";
  let unbreakableOverflow = false;
  for (const part of parts) {
    const separated = current && part.breakable_before ? `${current} ${part.text}` : `${current}${part.text}`;
    if (measuredWidth(separated, geometry.font_size) <= geometry.width) {
      current = separated;
      continue;
    }
    if (!current) {
      current = part.text;
      unbreakableOverflow = true;
      continue;
    }
    lines.push(current);
    current = part.text;
    if (measuredWidth(current, geometry.font_size) > geometry.width) unbreakableOverflow = true;
  }
  if (current) lines.push(current);
  return {
    lines,
    widest: Math.max(...lines.map((line) => measuredWidth(line, geometry.font_size))),
    unbreakable_overflow: unbreakableOverflow,
  };
}

function validateTextFrame(textFrame) {
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

/**
 * Pure, deterministic preflight. A false result is a hard pre-authorization
 * stop: no caller may submit an Image2 underlay until its text frame fits.
 */
export function preflightFramedTextFrame(textFrame) {
  validateTextFrame(textFrame);
  const preset = resolveFramedTextFramePreset(textFrame.preset);
  const variant = textFrame.callout ? preset.variants.callout_present : preset.variants.callout_absent;
  const fields = {};
  const failures = [];
  for (const field of FIELD_ORDER) {
    const value = textFrame[field] ?? null;
    const geometry = variant.fields[field];
    if (!value) {
      fields[field] = { present: false };
      continue;
    }
    if (!geometry) {
      failures.push({ code: "text_frame_variant_forbids_field", field, message: `${variant.id} does not permit ${field}` });
      continue;
    }
    const wrapped = wrapText(value, geometry);
    const usedHeight = wrapped.lines.length * geometry.line_height;
    const fits = !wrapped.unbreakable_overflow && wrapped.lines.length <= geometry.max_lines && usedHeight <= geometry.height;
    const entry = {
      present: true,
      text_sha256: canonicalJsonSha256(value),
      line_count: wrapped.lines.length,
      line_widths: wrapped.lines.map((line) => Number(measuredWidth(line, geometry.font_size).toFixed(3))),
      used_height: usedHeight,
      width_limit: geometry.width,
      height_limit: geometry.height,
      line_limit: geometry.max_lines,
      ...(fits ? {} : { overflow: { unbreakable_token: wrapped.unbreakable_overflow, line_count: wrapped.lines.length, used_height: usedHeight } }),
    };
    fields[field] = entry;
    if (!fits) failures.push({ code: "text_frame_overflow", field, message: `${field} does not fit ${FRAMED_TEXT_FRAME_PRESET}` });
  }
  const evidence = {
    schema: FRAMED_TEXT_FRAME_PREFLIGHT_SCHEMA,
    preset: FRAMED_TEXT_FRAME_PRESET,
    preset_digest: FRAMED_TEXT_FRAME_STANDARD_V1_DIGEST,
    variant: variant.id,
    canvas: CANVAS,
    reserved_underlay_rectangles: variant.reserved_underlay_rectangles,
    fields,
  };
  return deepFreeze({
    ok: failures.length === 0,
    authorization_allowed: failures.length === 0,
    ...(failures.length ? { repair: { action: "shorten-text-frame", failures } } : {}),
    evidence: { ...evidence, preflight_digest: canonicalJsonSha256(evidence) },
  });
}
