import { canonicalJsonSha256 } from '../../shared/identity/canonical_json.mjs';
import {
  FRAMED_FONT_SELECTION_ALGORITHM,
  loadFramedFontRenderInventory,
} from '../../00-setup/internal/html_fonts.mjs';
import { HTML_RUNTIME_PROFILE } from '../../00-setup/internal/html_runtime_profile.mjs';
import { HTML_CAPTURE_PROFILE } from './capture_runtime.mjs';
import {
  FRAMED_TEXT_FRAME_PRESET,
  FRAMED_TEXT_FRAME_STANDARD_V1,
} from './text_frame.mjs';

export const FRAMED_RENDER_PROFILE_SCHEMA = 'pptmaker-framed-render-profile-v1';
export const FRAMED_LAYOUT_COMPILER = Object.freeze({
  schema: 'pptmaker-framed-layout-compiler-v1',
  version: '1',
});
export const FRAMED_LAYOUT_COMPILER_COHERENCE_HISTORY = Object.freeze([
  Object.freeze({ version: '1', fixture_sha256: 'd99ea26c06794eabdf73648303702776bece135d7df71bd7460e50480ce6b2be' }),
]);
export { FRAMED_FONT_SELECTION_ALGORITHM } from '../../00-setup/internal/html_fonts.mjs';

export class FramedRenderProfileError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FramedRenderProfileError';
    this.code = code;
  }
}

function plainRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `${label} must be an object`);
  }
  return value;
}

function finiteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `${label} must be a finite number`);
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `${label} must be a non-empty string`);
  }
  return value;
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item)) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `${label} must be a non-empty string array`);
  }
  return [...value];
}

function normalizedFields(fields, label) {
  const source = plainRecord(fields, label);
  const output = {};
  for (const field of ['kicker', 'title', 'subtitle', 'callout']) {
    const entry = source[field];
    if (entry === null && field === 'callout') {
      output[field] = null;
      continue;
    }
    const value = plainRecord(entry, `${label}.${field}`);
    output[field] = {
      x: finiteNumber(value.x, `${label}.${field}.x`),
      y: finiteNumber(value.y, `${label}.${field}.y`),
      width: finiteNumber(value.width, `${label}.${field}.width`),
      height: finiteNumber(value.height, `${label}.${field}.height`),
      font_size: finiteNumber(value.font_size, `${label}.${field}.font_size`),
      line_height: finiteNumber(value.line_height, `${label}.${field}.line_height`),
      weight: finiteNumber(value.weight, `${label}.${field}.weight`),
      color: nonEmptyString(value.color, `${label}.${field}.color`),
      max_lines: finiteNumber(value.max_lines, `${label}.${field}.max_lines`),
    };
  }
  return output;
}

function normalizedVariant(value, label) {
  const variant = plainRecord(value, label);
  if (!Array.isArray(variant.panels) || !Array.isArray(variant.reserved_underlay_rectangles)) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `${label} must define panels and reserved underlay rectangles`);
  }
  return {
    id: nonEmptyString(variant.id, `${label}.id`),
    panels: variant.panels.map((panel, index) => {
      const entry = plainRecord(panel, `${label}.panels[${index}]`);
      return {
        id: nonEmptyString(entry.id, `${label}.panels[${index}].id`),
        x: finiteNumber(entry.x, `${label}.panels[${index}].x`),
        y: finiteNumber(entry.y, `${label}.panels[${index}].y`),
        width: finiteNumber(entry.width, `${label}.panels[${index}].width`),
        height: finiteNumber(entry.height, `${label}.panels[${index}].height`),
      };
    }),
    reserved_underlay_rectangles: variant.reserved_underlay_rectangles.map((rectangle, index) => {
      const entry = plainRecord(rectangle, `${label}.reserved_underlay_rectangles[${index}]`);
      return {
        x: finiteNumber(entry.x, `${label}.reserved_underlay_rectangles[${index}].x`),
        y: finiteNumber(entry.y, `${label}.reserved_underlay_rectangles[${index}].y`),
        width: finiteNumber(entry.width, `${label}.reserved_underlay_rectangles[${index}].width`),
        height: finiteNumber(entry.height, `${label}.reserved_underlay_rectangles[${index}].height`),
      };
    }),
    fields: normalizedFields(variant.fields, `${label}.fields`),
  };
}

/** Select only normalized pixel-producing preset facts before hashing. */
export function normalizedFramedPresetFacts(preset = FRAMED_TEXT_FRAME_STANDARD_V1) {
  const source = plainRecord(preset, 'preset');
  if (source.id !== FRAMED_TEXT_FRAME_PRESET) {
    throw new FramedRenderProfileError('render_profile_input_invalid', `preset.id must equal ${FRAMED_TEXT_FRAME_PRESET}`);
  }
  const canvas = plainRecord(source.canvas, 'preset.canvas');
  const theme = plainRecord(source.theme, 'preset.theme');
  const variants = plainRecord(source.variants, 'preset.variants');
  return Object.freeze({
    id: source.id,
    canvas: {
      css_width: finiteNumber(canvas.css_width, 'preset.canvas.css_width'),
      css_height: finiteNumber(canvas.css_height, 'preset.canvas.css_height'),
      capture_width: finiteNumber(canvas.capture_width, 'preset.canvas.capture_width'),
      capture_height: finiteNumber(canvas.capture_height, 'preset.canvas.capture_height'),
    },
    font_families: Object.freeze(stringArray(source.font_families, 'preset.font_families')),
    theme: {
      panel: nonEmptyString(theme.panel, 'preset.theme.panel'),
      panel_opacity: finiteNumber(theme.panel_opacity, 'preset.theme.panel_opacity'),
      text: nonEmptyString(theme.text, 'preset.theme.text'),
      muted_text: nonEmptyString(theme.muted_text, 'preset.theme.muted_text'),
      kicker: nonEmptyString(theme.kicker, 'preset.theme.kicker'),
    },
    variants: {
      callout_absent: normalizedVariant(variants.callout_absent, 'preset.variants.callout_absent'),
      callout_present: normalizedVariant(variants.callout_present, 'preset.variants.callout_present'),
    },
  });
}

/**
 * The compiler's text-free geometry output. The render contract will consume
 * this same description for proof and final pixels; profile tests pin it to a
 * compiler version before that public workflow wiring is introduced.
 */
export function compileFramedLayoutGeometry({ preset = FRAMED_TEXT_FRAME_STANDARD_V1 } = {}) {
  const normalizedPreset = normalizedFramedPresetFacts(preset);
  return Object.freeze({
    schema: 'pptmaker-framed-layout-description-v1',
    compiler: FRAMED_LAYOUT_COMPILER,
    canvas: normalizedPreset.canvas,
    font_families: normalizedPreset.font_families,
    theme: normalizedPreset.theme,
    variants: normalizedPreset.variants,
  });
}

function normalizedCompiler(value) {
  const compiler = plainRecord(value, 'layout compiler');
  return {
    schema: nonEmptyString(compiler.schema, 'layout compiler.schema'),
    version: nonEmptyString(compiler.version, 'layout compiler.version'),
  };
}

function normalizedFontInventory(value) {
  const inventory = plainRecord(value, 'font render inventory');
  if (!Array.isArray(inventory.families) || !Array.isArray(inventory.faces)) {
    throw new FramedRenderProfileError('render_profile_input_invalid', 'font render inventory must define families and faces');
  }
  return {
    schema: nonEmptyString(inventory.schema, 'font render inventory.schema'),
    families: inventory.families.map((family, index) => {
      const entry = plainRecord(family, `font render inventory.families[${index}]`);
      return {
        family: nonEmptyString(entry.family, `font render inventory.families[${index}].family`),
        platform_family_name: nonEmptyString(entry.platform_family_name, `font render inventory.families[${index}].platform_family_name`),
      };
    }),
    faces: inventory.faces.map((face, index) => {
      const entry = plainRecord(face, `font render inventory.faces[${index}]`);
      return {
        path: nonEmptyString(entry.path, `font render inventory.faces[${index}].path`),
        sha256: nonEmptyString(entry.sha256, `font render inventory.faces[${index}].sha256`),
        family: nonEmptyString(entry.family, `font render inventory.faces[${index}].family`),
        style: nonEmptyString(entry.style, `font render inventory.faces[${index}].style`),
        weight: nonEmptyString(entry.weight, `font render inventory.faces[${index}].weight`),
        unicode_ranges: stringArray(entry.unicode_ranges, `font render inventory.faces[${index}].unicode_ranges`).sort(),
      };
    }).sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function normalizedRuntime(value) {
  const runtime = plainRecord(value, 'HTML runtime profile');
  return {
    id: nonEmptyString(runtime.id, 'HTML runtime profile.id'),
    supported_node_majors: [...runtime.supportedNodeMajors].map((major) => finiteNumber(major, 'HTML runtime profile.supportedNodeMajors')).sort((left, right) => left - right),
    playwright_version: nonEmptyString(runtime.playwrightVersion, 'HTML runtime profile.playwrightVersion'),
    chromium_revision: nonEmptyString(runtime.chromiumRevision, 'HTML runtime profile.chromiumRevision'),
    chromium_browser_version: nonEmptyString(runtime.chromiumBrowserVersion, 'HTML runtime profile.chromiumBrowserVersion'),
  };
}

function normalizedCapture(value) {
  const capture = plainRecord(value, 'HTML capture profile');
  return {
    id: nonEmptyString(capture.id, 'HTML capture profile.id'),
    css_width: finiteNumber(capture.cssWidth, 'HTML capture profile.cssWidth'),
    css_height: finiteNumber(capture.cssHeight, 'HTML capture profile.cssHeight'),
    viewport_height: finiteNumber(capture.viewportHeight, 'HTML capture profile.viewportHeight'),
    device_scale_factor: finiteNumber(capture.deviceScaleFactor, 'HTML capture profile.deviceScaleFactor'),
    output_width: finiteNumber(capture.outputWidth, 'HTML capture profile.outputWidth'),
    output_height: finiteNumber(capture.outputHeight, 'HTML capture profile.outputHeight'),
    raw_capture_height: finiteNumber(capture.rawCaptureHeight, 'HTML capture profile.rawCaptureHeight'),
    geometry_epsilon_css_px: finiteNumber(capture.geometryEpsilonCssPx, 'HTML capture profile.geometryEpsilonCssPx'),
    reencode: nonEmptyString(capture.reencode, 'HTML capture profile.reencode'),
  };
}

/**
 * Build the host-independent Framed pixel profile. Page literals, page-specific
 * selected faces, underlay bytes, observations, and caller metadata are not read.
 */
export function createFramedRenderProfile({
  preset = FRAMED_TEXT_FRAME_STANDARD_V1,
  layoutCompiler = FRAMED_LAYOUT_COMPILER,
  fontRenderInventory,
  fontSelectionAlgorithm = FRAMED_FONT_SELECTION_ALGORITHM,
  runtime = HTML_RUNTIME_PROFILE,
  capture = HTML_CAPTURE_PROFILE,
} = {}) {
  const normalizedPreset = normalizedFramedPresetFacts(preset);
  const normalizedInventory = normalizedFontInventory(fontRenderInventory);
  const profile = {
    schema: FRAMED_RENDER_PROFILE_SCHEMA,
    preset: {
      id: normalizedPreset.id,
      digest: canonicalJsonSha256(normalizedPreset),
    },
    layout_compiler: normalizedCompiler(layoutCompiler),
    font_render_inventory: {
      schema: normalizedInventory.schema,
      digest: canonicalJsonSha256(normalizedInventory),
    },
    font_selection_algorithm: nonEmptyString(fontSelectionAlgorithm, 'font selection algorithm'),
    runtime: normalizedRuntime(runtime),
    capture: normalizedCapture(capture),
  };
  return Object.freeze({
    ...profile,
    render_profile_digest: canonicalJsonSha256(profile),
  });
}

/** Resolve the current production profile from the verified checked-in inventory. */
export function currentFramedRenderProfile(options = {}) {
  return createFramedRenderProfile({
    ...options,
    fontRenderInventory: options.fontRenderInventory ?? loadFramedFontRenderInventory(options.fontOptions),
  });
}
