import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

import { decode as decodePng } from 'fast-png';

import {
  HTML_FONT_ROOT,
  discoverRuntimePackages,
  inspectHtmlRuntime,
  selectFramedFontFaces,
} from '../../00-setup/index.mjs';
import {
  HTML_CAPTURE_PROFILE,
  captureHtmlPngBatch,
} from './capture_runtime.mjs';
import {
  compileFramedLayoutGeometry,
  currentFramedRenderProfile,
} from './framed_render_profile.mjs';
import { validateFramedTextFrame } from './text_frame.mjs';

const FRAME_FIELDS = Object.freeze(['kicker', 'title', 'subtitle', 'callout']);
const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;

export class FramedRenderContractError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'FramedRenderContractError';
    this.code = code;
    this.details = details;
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value, key))) {
    throw new FramedRenderContractError('framed_render_input_invalid', `${label} accepts only ${keys.join(', ')}`);
  }
  return value;
}

function requiredSlideId(value) {
  if (typeof value !== 'string' || !SLIDE_ID_RE.test(value)) {
    throw new FramedRenderContractError('framed_render_input_invalid', 'a stable Framed slide_id is required');
  }
  return value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function cssString(value) {
  return JSON.stringify(String(value));
}

function cssFontFamily(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function cssFontToken(value, label) {
  const token = String(value);
  if (!/^(?:normal|italic|oblique|[1-9][0-9]{2}(?: [1-9][0-9]{2})?)$/i.test(token)) {
    throw new FramedRenderContractError('framed_font_asset_invalid', `${label} is not a permitted checked-in font CSS token`);
  }
  return token;
}

function cssRgba(hex, opacity) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hex));
  if (!match) throw new FramedRenderContractError('framed_render_profile_invalid', 'normalized Framed panel color must be a six-digit hex color');
  const value = match[1];
  return `rgba(${Number.parseInt(value.slice(0, 2), 16)}, ${Number.parseInt(value.slice(2, 4), 16)}, ${Number.parseInt(value.slice(4, 6), 16)}, ${opacity})`;
}

function fieldDefinitions(textFrame, variant) {
  return FRAME_FIELDS.filter((field) => textFrame[field]).map((field) => ({
    id: field,
    text: textFrame[field],
    ...variant.fields[field],
  }));
}

function safeZones(variant) {
  if (variant.panels.length !== variant.reserved_underlay_rectangles.length) {
    throw new FramedRenderContractError('framed_render_profile_invalid', 'each normalized Framed panel must have one reserved underlay rectangle');
  }
  return variant.panels.map((panel, index) => ({
    panel_id: panel.id,
    rectangle: variant.reserved_underlay_rectangles[index],
  }));
}

function fontRoles(selection) {
  const facesByFamily = new Map(selection.selected_faces.map((face) => [face.family, face]));
  return selection.fields.map((field) => ({
    name: field.field,
    selector: `[data-pm-field="${field.field}"]`,
    // CDP reports the checked-in file's platform family name, while the
    // compiler uses the canonical family as its private CSS alias.
    platformFamilies: field.families.map((family) => facesByFamily.get(family)?.platform_family_name).filter(Boolean),
  }));
}

function resolvedFontBytes(face) {
  const relative = String(face.path || '');
  if (!relative || relative.split('/').some((part) => part === '..' || !part)) {
    throw new FramedRenderContractError('framed_font_asset_invalid', 'selected Framed font path is invalid');
  }
  const path = resolve(HTML_FONT_ROOT, ...relative.split('/'));
  const relativePath = path.slice(resolve(HTML_FONT_ROOT).length + 1);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === '..') {
    throw new FramedRenderContractError('framed_font_asset_invalid', 'selected Framed font path escapes the checked-in inventory');
  }
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    throw new FramedRenderContractError('framed_font_asset_missing', `selected Framed font is unavailable: ${relative}`);
  }
  if (!bytes.length || sha256(bytes) !== face.sha256) {
    throw new FramedRenderContractError('framed_font_asset_invalid', `selected Framed font does not match its checked-in inventory: ${relative}`);
  }
  return bytes;
}

function fontFaceCss(selection) {
  return selection.selected_faces.map((face) => {
    const bytes = resolvedFontBytes(face).toString('base64');
    return `@font-face{font-family:${cssString(face.family)};font-style:${cssFontToken(face.style, 'font style')};font-weight:${cssFontToken(face.weight, 'font weight')};font-display:block;src:url(data:font/woff2;base64,${bytes}) format('woff2');unicode-range:${face.unicode_ranges.join(',')};}`;
  }).join('');
}

function assertVerifiedRaw(value) {
  exactKeys(value, ['bytes', 'sha256'], 'verified_raw');
  if (!Buffer.isBuffer(value.bytes) && !(value.bytes instanceof Uint8Array)) {
    throw new FramedRenderContractError('framed_raw_invalid', 'verified Framed raw bytes are required');
  }
  const bytes = Buffer.from(value.bytes);
  if (!bytes.length || typeof value.sha256 !== 'string' || sha256(bytes) !== value.sha256) {
    throw new FramedRenderContractError('framed_raw_invalid', 'verified Framed raw bytes do not match their digest');
  }
  let png;
  try {
    png = decodePng(bytes, { checkCrc: true });
  } catch {
    throw new FramedRenderContractError('framed_raw_invalid', 'verified Framed raw bytes must be a valid PNG');
  }
  if (png.width !== HTML_CAPTURE_PROFILE.outputWidth || png.height !== HTML_CAPTURE_PROFILE.outputHeight) {
    throw new FramedRenderContractError('framed_raw_invalid', `verified Framed raw PNG must be ${HTML_CAPTURE_PROFILE.outputWidth}x${HTML_CAPTURE_PROFILE.outputHeight}`);
  }
  return Object.freeze({ bytes, sha256: value.sha256 });
}

function compileDocument(contract, verifiedRaw = null) {
  const { layout, text_frame: textFrame, font_selection: selection } = contract;
  const panels = layout.panels.map((panel) => (
    `<section class="pm-panel" data-pm-panel="${panel.id}" style="left:${panel.x}px;top:${panel.y}px;width:${panel.width}px;height:${panel.height}px"></section>`
  )).join('');
  const fontFamily = layout.font_families.map(cssFontFamily).join(',');
  const fields = layout.fields.map((field) => (
    `<div class="pm-field" data-pm-field="${field.id}" data-pm-leaf="${field.id}" style="left:${field.x}px;top:${field.y}px;width:${field.width}px;height:${field.height}px;font-size:${field.font_size}px;line-height:${field.line_height}px;font-weight:${field.weight};color:${field.color};font-family:${fontFamily}">${escapeHtml(textFrame[field.id])}</div>`
  )).join('');
  const underlay = verifiedRaw
    ? `<img class="pm-underlay" alt="" src="data:image/png;base64,${verifiedRaw.bytes.toString('base64')}">`
    : '';
  const panelColor = cssRgba(layout.theme.panel, layout.theme.panel_opacity);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${fontFaceCss(selection)}
    html,body{margin:0;width:${layout.canvas.css_width}px;height:${layout.canvas.css_height}px;overflow:hidden}
    .pm-slide{position:relative;width:${layout.canvas.css_width}px;height:${layout.canvas.css_height}px;overflow:hidden;background:#ffffff}
    .pm-underlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .pm-panel{position:absolute;box-sizing:border-box;background:${panelColor}}
    .pm-field{position:absolute;box-sizing:border-box;overflow:hidden;white-space:normal;overflow-wrap:normal;word-break:normal;font-style:normal;font-kerning:normal}
  </style></head><body><main class="pm-slide" data-pptmaker-slide>${underlay}${panels}${fields}</main></body></html>`;
}

function contractLayout(textFrame, layoutGeometry, selection) {
  const variantId = textFrame.callout ? 'callout_present' : 'callout_absent';
  const variant = layoutGeometry.variants[variantId];
  if (!variant) throw new FramedRenderContractError('framed_render_profile_invalid', `normalized Framed layout does not define ${variantId}`);
  const fields = fieldDefinitions(textFrame, variant);
  const fieldNames = new Set(selection.fields.map((field) => field.field));
  if (fields.some((field) => !fieldNames.has(field.id))) {
    throw new FramedRenderContractError('framed_font_selection_invalid', 'Framed font selection does not cover every rendered field');
  }
  return Object.freeze({
    canvas: layoutGeometry.canvas,
    font_families: layoutGeometry.font_families,
    theme: layoutGeometry.theme,
    variant: variant.id,
    panels: variant.panels,
    fields,
    safe_zones: safeZones(variant),
  });
}

/** Derive one immutable Framed text/layout/font/profile contract without a browser. */
export function describeFramedFrame({ slide_id, text_frame } = {}) {
  exactKeys({ slide_id, text_frame }, ['slide_id', 'text_frame'], 'Framed frame');
  const slideId = requiredSlideId(slide_id);
  try {
    validateFramedTextFrame(text_frame);
  } catch (error) {
    throw new FramedRenderContractError(error?.code || 'framed_text_frame_invalid', error?.message || 'Framed Text Frame is invalid');
  }
  let selection;
  let profile;
  try {
    selection = selectFramedFontFaces(text_frame);
    profile = currentFramedRenderProfile();
  } catch (error) {
    throw new FramedRenderContractError(error?.code || 'framed_font_runtime_invalid', error?.message || 'Framed font/profile readiness failed', error?.details || null);
  }
  const layoutGeometry = compileFramedLayoutGeometry();
  const layout = contractLayout(text_frame, layoutGeometry, selection);
  return Object.freeze({
    schema: 'pptmaker-framed-render-contract-v1',
    slide_id: slideId,
    text_frame: Object.freeze(Object.fromEntries(FRAME_FIELDS.map((field) => [field, text_frame[field] ?? null]))),
    layout,
    font_selection: selection,
    render_profile: profile,
  });
}

function capturePageSpec(contract, verifiedRaw = null) {
  return Object.freeze({
    id: contract.slide_id,
    html: compileDocument(contract, verifiedRaw),
    expectedLeafMarkers: contract.layout.fields.map((field) => field.id),
    fontRoles: fontRoles(contract.font_selection),
    probeForbiddenRoutes: true,
    layout: {
      slide: {
        width: contract.layout.canvas.css_width,
        height: contract.layout.canvas.css_height,
      },
      panels: contract.layout.panels,
      fields: contract.layout.fields,
      panel_safe_zones: contract.layout.safe_zones,
    },
  });
}

async function resolvePinnedRuntime() {
  const packages = await discoverRuntimePackages();
  const runtime = await inspectHtmlRuntime({
    playwrightRoot: packages.playwright?.root,
    playwrightVersion: packages.playwright?.version,
  });
  if (!runtime.ok) {
    throw new FramedRenderContractError('framed_runtime_unavailable', `Framed runtime is not ready: ${runtime.error || 'unknown'}`);
  }
  return runtime;
}

function describeFrameBatch(frames, withRaw) {
  if (!Array.isArray(frames) || frames.length === 0 || frames.length > 64) {
    throw new FramedRenderContractError('framed_render_input_invalid', 'a finite nonempty Framed page batch is required');
  }
  const seen = new Set();
  return frames.map((frame) => {
    const keys = withRaw ? ['slide_id', 'text_frame', 'verified_raw'] : ['slide_id', 'text_frame'];
    exactKeys(frame, keys, 'Framed batch page');
    const contract = describeFramedFrame({ slide_id: frame.slide_id, text_frame: frame.text_frame });
    if (seen.has(contract.slide_id)) throw new FramedRenderContractError('framed_render_input_invalid', `Framed batch has duplicate slide_id ${contract.slide_id}`);
    seen.add(contract.slide_id);
    return withRaw ? { contract, verifiedRaw: assertVerifiedRaw(frame.verified_raw) } : { contract };
  });
}

function renderProofFailureCode(result) {
  const phase = String(result?.phase || '');
  const detail = String(result?.error || '');
  if (/\btimed out\b/i.test(detail)) return 'framed_render_timeout';
  if (/^(?:browser_launch|context_create)$/.test(phase)) return 'framed_runtime_unavailable';
  if (/:font_usage$/.test(phase) || /did not use bundled custom font|font evidence selector is missing|has no usable text bounds/i.test(detail)) {
    return 'framed_font_runtime_unavailable';
  }
  if (/field (?:kicker|title|subtitle|callout) (?:has scroll overflow|exceeds \d+ rendered lines)/.test(detail)) {
    return 'framed_text_fit_failed';
  }
  return 'framed_render_contract_invariant_failed';
}

function assertBatchSuccess(result, contracts) {
  if (!result?.ok || !Array.isArray(result.pages) || result.pages.length !== contracts.length) {
    throw new FramedRenderContractError(
      renderProofFailureCode(result),
      `Framed browser evaluator failed during ${result?.phase || 'unknown'}: ${result?.error || 'incomplete batch result'}`,
    );
  }
  const expected = contracts.map(({ contract }) => contract.slide_id);
  const actual = result.pages.map((page) => page.id);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new FramedRenderContractError('framed_render_contract_invariant_failed', 'Framed browser evaluator returned an out-of-order page batch');
  }
}

function owner({ captureBatch = captureHtmlPngBatch, resolveRuntime = resolvePinnedRuntime } = {}) {
  if (typeof captureBatch !== 'function' || typeof resolveRuntime !== 'function') {
    throw new TypeError('Framed render-contract test seams must be functions');
  }
  return Object.freeze({
    describeFrame: describeFramedFrame,
    async verifyFrames(frames) {
      const contracts = describeFrameBatch(frames, false);
      const runtimeEvidence = await resolveRuntime();
      const result = await captureBatch({
        runtimeEvidence,
        pages: contracts.map(({ contract }) => capturePageSpec(contract)),
      });
      assertBatchSuccess(result, contracts);
      return Object.freeze({
        render_profile_digest: contracts[0].contract.render_profile.render_profile_digest,
        pages: Object.freeze(contracts.map(({ contract }, index) => Object.freeze({
          slide_id: contract.slide_id,
          layout: contract.layout,
          render_profile_digest: contract.render_profile.render_profile_digest,
          capture: result.pages[index],
        }))),
      });
    },
    async composePages(frames) {
      const contracts = describeFrameBatch(frames, true);
      const runtimeEvidence = await resolveRuntime();
      const result = await captureBatch({
        runtimeEvidence,
        pages: contracts.map(({ contract, verifiedRaw }) => capturePageSpec(contract, verifiedRaw)),
      });
      assertBatchSuccess(result, contracts);
      const pages = {};
      for (const [index, { contract }] of contracts.entries()) {
        pages[contract.slide_id] = Buffer.from(result.pages[index].bytes);
      }
      return Object.freeze({
        render_profile_digest: contracts[0].contract.render_profile.render_profile_digest,
        final_bytes_by_slide: Object.freeze(pages),
      });
    },
  });
}

/** Private test factory; public workflow functions never receive these seams. */
export function createFramedRenderContractForTesting(options = {}) {
  return owner(options);
}

const PRODUCTION_OWNER = owner();

export const verifyFramedRenderContracts = PRODUCTION_OWNER.verifyFrames;
export const composeFramedRenderContracts = PRODUCTION_OWNER.composePages;
