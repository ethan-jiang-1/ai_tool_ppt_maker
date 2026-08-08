import { canonicalJsonSha256 } from '../../shared/identity/canonical_json.mjs';
import {
  FRAMED_FONT_SELECTION_ALGORITHM,
  loadFramedFontRenderInventory,
} from '../../00-setup/internal/html_fonts.mjs';
import { HTML_RUNTIME_PROFILE } from '../../00-setup/internal/html_runtime_profile.mjs';
import { HTML_CAPTURE_PROFILE } from './capture_runtime.mjs';
import {
  FRAMED_HEADER_OVERLAY_PRESET,
  FRAMED_HEADER_OVERLAY_STANDARD_V1,
} from './header_overlay.mjs';

export const FRAMED_HEADER_OVERLAY_RENDER_PROFILE_SCHEMA = 'pptmaker-framed-header-overlay-render-profile-v1';
export const FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER = Object.freeze({
  schema: 'pptmaker-framed-header-overlay-layout-compiler-v1',
  version: '2',
});
export const FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER_COHERENCE_HISTORY = Object.freeze([
  Object.freeze({ version: '2', fixture_sha256: '161a5b3199332d4f79ee26bc80d9d2cdc3867a7efba2e739293367d4870a04ea' }),
]);
export { FRAMED_FONT_SELECTION_ALGORITHM } from '../../00-setup/internal/html_fonts.mjs';

const HEADER_FIELDS = Object.freeze(['kicker', 'title', 'subtitle']);
const RECTANGLE_KEYS = Object.freeze(['x', 'y', 'width', 'height']);

export class FramedHeaderOverlayProfileError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FramedHeaderOverlayProfileError';
    this.code = code;
  }
}

function plainRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, label) {
  const source = plainRecord(value, label);
  if (Object.keys(source).length !== keys.length || !keys.every((key) => Object.hasOwn(source, key))) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must contain only ${keys.join(', ')}`);
  }
  return source;
}

function finiteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must be a finite number`);
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must be a non-empty string`);
  }
  return value;
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item)) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must be a non-empty string array`);
  }
  return [...value];
}

function normalizedField(value, label) {
  const field = exactKeys(value, ['x', 'y', 'width', 'height', 'font_size', 'line_height', 'weight', 'color', 'max_lines'], label);
  const normalized = {
    x: finiteNumber(field.x, `${label}.x`),
    y: finiteNumber(field.y, `${label}.y`),
    width: finiteNumber(field.width, `${label}.width`),
    height: finiteNumber(field.height, `${label}.height`),
    font_size: finiteNumber(field.font_size, `${label}.font_size`),
    line_height: finiteNumber(field.line_height, `${label}.line_height`),
    weight: finiteNumber(field.weight, `${label}.weight`),
    color: nonEmptyString(field.color, `${label}.color`),
    max_lines: finiteNumber(field.max_lines, `${label}.max_lines`),
  };
  if (normalized.width <= 0 || normalized.height <= 0 || normalized.font_size <= 0 || normalized.line_height <= 0 || normalized.max_lines < 1) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must define a positive bounded header field`);
  }
  return normalized;
}

function normalizedFields(value, label) {
  const source = exactKeys(value, HEADER_FIELDS, label);
  return Object.freeze(Object.fromEntries(HEADER_FIELDS.map((field) => [field, normalizedField(source[field], `${label}.${field}`)])));
}

function normalizedProtectedGeometry(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label} must be a nonempty array`);
  }
  const ids = new Set();
  return Object.freeze(value.map((item, index) => {
    const entry = exactKeys(item, ['id', ...RECTANGLE_KEYS], `${label}[${index}]`);
    const normalized = {
      id: nonEmptyString(entry.id, `${label}[${index}].id`),
      x: finiteNumber(entry.x, `${label}[${index}].x`),
      y: finiteNumber(entry.y, `${label}[${index}].y`),
      width: finiteNumber(entry.width, `${label}[${index}].width`),
      height: finiteNumber(entry.height, `${label}[${index}].height`),
    };
    if (ids.has(normalized.id) || normalized.width <= 0 || normalized.height <= 0 || normalized.x < 0 || normalized.y < 0) {
      throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `${label}[${index}] must be a unique positive protected rectangle`);
    }
    ids.add(normalized.id);
    return normalized;
  }));
}

function normalizedTheme(value) {
  const theme = exactKeys(value, ['text', 'muted_text', 'kicker', 'contrast'], 'preset.theme');
  const contrast = exactKeys(theme.contrast, ['kind', 'color', 'opacity', 'offset_x', 'offset_y', 'blur'], 'preset.theme.contrast');
  if (contrast.kind !== 'text-shadow') {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', 'preset.theme.contrast.kind must equal text-shadow');
  }
  const normalizedContrast = {
    kind: contrast.kind,
    color: nonEmptyString(contrast.color, 'preset.theme.contrast.color'),
    opacity: finiteNumber(contrast.opacity, 'preset.theme.contrast.opacity'),
    offset_x: finiteNumber(contrast.offset_x, 'preset.theme.contrast.offset_x'),
    offset_y: finiteNumber(contrast.offset_y, 'preset.theme.contrast.offset_y'),
    blur: finiteNumber(contrast.blur, 'preset.theme.contrast.blur'),
  };
  if (normalizedContrast.opacity <= 0 || normalizedContrast.opacity > 0.6 || normalizedContrast.blur < 0) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', 'preset.theme.contrast must remain a minimal text-shadow treatment');
  }
  return Object.freeze({
    text: nonEmptyString(theme.text, 'preset.theme.text'),
    muted_text: nonEmptyString(theme.muted_text, 'preset.theme.muted_text'),
    kicker: nonEmptyString(theme.kicker, 'preset.theme.kicker'),
    contrast: Object.freeze(normalizedContrast),
  });
}

/** Select the pixel-producing facts of the closed transparent header preset. */
export function normalizedFramedHeaderOverlayPresetFacts(preset = FRAMED_HEADER_OVERLAY_STANDARD_V1) {
  const source = exactKeys(preset, ['id', 'canvas', 'font_families', 'theme', 'protected_geometry', 'fields'], 'preset');
  if (source.id !== FRAMED_HEADER_OVERLAY_PRESET) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', `preset.id must equal ${FRAMED_HEADER_OVERLAY_PRESET}`);
  }
  const canvas = exactKeys(source.canvas, ['css_width', 'css_height', 'capture_width', 'capture_height'], 'preset.canvas');
  const normalizedCanvas = {
    css_width: finiteNumber(canvas.css_width, 'preset.canvas.css_width'),
    css_height: finiteNumber(canvas.css_height, 'preset.canvas.css_height'),
    capture_width: finiteNumber(canvas.capture_width, 'preset.canvas.capture_width'),
    capture_height: finiteNumber(canvas.capture_height, 'preset.canvas.capture_height'),
  };
  if (Object.values(normalizedCanvas).some((value) => value <= 0)) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', 'preset.canvas must have positive dimensions');
  }
  const protectedGeometry = normalizedProtectedGeometry(source.protected_geometry, 'preset.protected_geometry');
  for (const rectangle of protectedGeometry) {
    if (rectangle.x + rectangle.width > normalizedCanvas.css_width || rectangle.y + rectangle.height > normalizedCanvas.css_height) {
      throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', 'protected geometry must stay within the canvas');
    }
  }
  return Object.freeze({
    id: source.id,
    canvas: Object.freeze(normalizedCanvas),
    font_families: Object.freeze(stringArray(source.font_families, 'preset.font_families')),
    theme: normalizedTheme(source.theme),
    protected_geometry: protectedGeometry,
    fields: normalizedFields(source.fields, 'preset.fields'),
  });
}

/** Compile the deterministic local geometry without creating any rendered panel. */
export function compileFramedHeaderOverlayGeometry({ preset = FRAMED_HEADER_OVERLAY_STANDARD_V1 } = {}) {
  const normalizedPreset = normalizedFramedHeaderOverlayPresetFacts(preset);
  return Object.freeze({
    schema: 'pptmaker-framed-header-overlay-layout-description-v1',
    compiler: FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER,
    canvas: normalizedPreset.canvas,
    font_families: normalizedPreset.font_families,
    theme: normalizedPreset.theme,
    protected_geometry: normalizedPreset.protected_geometry,
    fields: normalizedPreset.fields,
  });
}

function normalizedCompiler(value) {
  const compiler = exactKeys(value, ['schema', 'version'], 'layout compiler');
  return {
    schema: nonEmptyString(compiler.schema, 'layout compiler.schema'),
    version: nonEmptyString(compiler.version, 'layout compiler.version'),
  };
}

function normalizedFontInventory(value) {
  const inventory = plainRecord(value, 'font render inventory');
  if (!Array.isArray(inventory.families) || !Array.isArray(inventory.faces)) {
    throw new FramedHeaderOverlayProfileError('header_overlay_profile_input_invalid', 'font render inventory must define families and faces');
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

/** Build the host-independent profile of the Framed header-overlay renderer. */
export function createFramedHeaderOverlayRenderProfile({
  preset = FRAMED_HEADER_OVERLAY_STANDARD_V1,
  layoutCompiler = FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER,
  fontRenderInventory,
  fontSelectionAlgorithm = FRAMED_FONT_SELECTION_ALGORITHM,
  runtime = HTML_RUNTIME_PROFILE,
  capture = HTML_CAPTURE_PROFILE,
} = {}) {
  const normalizedPreset = normalizedFramedHeaderOverlayPresetFacts(preset);
  const normalizedInventory = normalizedFontInventory(fontRenderInventory);
  const profile = {
    schema: FRAMED_HEADER_OVERLAY_RENDER_PROFILE_SCHEMA,
    preset: {
      id: normalizedPreset.id,
      digest: canonicalJsonSha256(normalizedPreset),
    },
    protected_geometry: normalizedPreset.protected_geometry,
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

/** Resolve the production profile from the verified checked-in font inventory. */
export function currentFramedHeaderOverlayRenderProfile(options = {}) {
  return createFramedHeaderOverlayRenderProfile({
    ...options,
    fontRenderInventory: options.fontRenderInventory ?? loadFramedFontRenderInventory(options.fontOptions),
  });
}
