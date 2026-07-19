import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SaxesParser } from 'saxes';
import { canonicalJson } from './canonical_json.mjs';

export const ECHARTS_VERSION = '6.1.0';
export const ZRENDER_VERSION = '6.1.0';
export const ECHARTS_SVG_SCHEMA = 'pptmaker-echarts-ssr-svg-v1';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';
const ACTIVE_ELEMENTS = new Set(['script', 'foreignObject', 'animate', 'animateMotion', 'animateTransform', 'set', 'discard', 'iframe', 'object', 'image']);
const OPTION_KEYS = Object.freeze(new Set([
  'animation', 'backgroundColor', 'grid', 'legend', 'series', 'title', 'tooltip', 'xAxis', 'yAxis',
]));
const AXIS_KEYS = Object.freeze(new Set(['type', 'data', 'axisLabel', 'axisLine', 'axisTick', 'splitLine', 'boundaryGap', 'min', 'max']));
const SERIES_KEYS = Object.freeze(new Set(['type', 'data', 'name', 'smooth', 'stack', 'areaStyle', 'lineStyle', 'itemStyle', 'barMaxWidth']));
const GRID_KEYS = Object.freeze(new Set(['left', 'right', 'top', 'bottom', 'containLabel']));
const ID_RE = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;
const FRAGMENT_RE = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/;
const URL_FRAGMENT_RE = /^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/;

function fail(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  throw error;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

// ECharts' SSR renderer uses a process-local zrender counter in class names.
// Normalize only that generated vocabulary before hashing; authored geometry and
// all other bytes remain untouched.
function canonicalizeEchartsSvgTransientNames(svg) {
  const classes = new Map();
  return String(svg).replace(/\bzr\d+-cls-\d+\b/g, (name) => {
    if (!classes.has(name)) classes.set(name, `zr-cls-${classes.size}`);
    return classes.get(name);
  });
}

function assertFinite(value, path) {
  if (typeof value === 'number' && !Number.isFinite(value)) fail('echarts_option_invalid', `${path} must be finite`);
}

function assertClosedValue(value, path, depth = 0) {
  if (depth > 12) fail('echarts_option_complexity', `${path} exceeds nesting limit`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    if (typeof value === 'string' && /(?:javascript:|data:text\/html|https?:|file:|blob:|ws:|wss:)/i.test(value)) fail('echarts_option_external_reference', `${path} contains an external or executable reference`);
    return;
  }
  if (typeof value === 'number') { assertFinite(value, path); return; }
  if (Array.isArray(value)) {
    if (value.length > 256) fail('echarts_option_complexity', `${path} has too many entries`);
    value.forEach((entry, index) => assertClosedValue(entry, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) fail('echarts_option_invalid', `${path} must be a plain JSON value`);
  for (const [key, entry] of Object.entries(value)) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(key)) fail('echarts_option_invalid', `${path}.${key} is not a closed option key`);
    assertClosedValue(entry, `${path}.${key}`, depth + 1);
  }
}

function assertKnownKeys(value, path, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail('echarts_option_key_forbidden', `${path}.${key} is outside the closed ECharts option vocabulary`);
}

export function validateClosedEchartsOption(option) {
  assertClosedValue(option, '$');
  assertKnownKeys(option, '$', OPTION_KEYS);
  if (!option || typeof option !== 'object' || Array.isArray(option)) fail('echarts_option_invalid', 'ECharts option must be an object');
  if (option.animation !== false) fail('echarts_option_animation', 'SSR ECharts options must set animation:false');
  if (!Array.isArray(option.series) || option.series.length < 1 || option.series.length > 4) fail('echarts_option_series', 'SSR ECharts options require 1..4 series');
  if (option.xAxis != null) assertKnownKeys(option.xAxis, '$.xAxis', AXIS_KEYS);
  if (option.yAxis != null) assertKnownKeys(option.yAxis, '$.yAxis', AXIS_KEYS);
  if (option.grid != null) assertKnownKeys(option.grid, '$.grid', GRID_KEYS);
  option.series.forEach((series, index) => {
    assertKnownKeys(series, `$.series[${index}]`, SERIES_KEYS);
    if (!['bar', 'line', 'area'].includes(series.type)) fail('echarts_option_series', `$.series[${index}].type is unsupported`);
    if (!Array.isArray(series.data) || series.data.length < 1 || series.data.length > 12) fail('echarts_option_series', `$.series[${index}].data must contain 1..12 values`);
    series.data.forEach((value, valueIndex) => { if (typeof value !== 'number' || !Number.isFinite(value)) fail('echarts_option_series', `$.series[${index}].data[${valueIndex}] must be finite`); });
  });
  return structuredClone(option);
}

export function resolveEchartsInstallation({ echartsRoot, echartsVersion, readFile = readFileSync, exists = existsSync } = {}) {
  if (!echartsRoot) throw new Error('Canonical ECharts package root is required');
  const root = resolve(echartsRoot);
  const packagePath = join(root, 'package.json');
  if (!exists(packagePath)) throw new Error('Canonical ECharts package metadata is missing');
  const meta = JSON.parse(readFile(packagePath, 'utf8'));
  const discoveredVersion = echartsVersion ?? meta.version;
  if (meta.name !== 'echarts' || discoveredVersion !== meta.version || discoveredVersion !== ECHARTS_VERSION) throw new Error(`ECharts ${ECHARTS_VERSION} is required at the discovered package root`);
  const requireFromEcharts = createRequire(packagePath);
  const zrenderPackagePath = requireFromEcharts.resolve('zrender/package.json');
  const zrender = JSON.parse(readFile(zrenderPackagePath, 'utf8'));
  if (zrender.name !== 'zrender' || zrender.version !== ZRENDER_VERSION) throw new Error(`zrender ${ZRENDER_VERSION} is required with ECharts ${ECHARTS_VERSION}`);
  return Object.freeze({ root, entryUrl: pathToFileURL(join(root, 'index.js')).href, version: discoveredVersion, zrenderRoot: resolve(zrenderPackagePath, '..'), zrenderVersion: zrender.version });
}

async function loadEcharts(installation, importer = (url) => import(url)) {
  const module = await importer(installation.entryUrl);
  if (!module?.init) throw new Error('Canonical ECharts package does not expose init');
  return module;
}

function validateCssText(css, path) {
  if (/@import|url\s*\(|(?:javascript:|https?:|file:|blob:|ws:|wss:)/i.test(css)) fail('echarts_svg_external_reference', `${path} contains an external or executable CSS reference`);
  if (/[{}](?:[^{}]*[{}]){8,}/.test(css)) fail('echarts_svg_complexity', `${path} contains excessive nested CSS`);
}

export function validateEchartsSvg(svg, { allowText = true } = {}) {
  const text = typeof svg === 'string' ? svg : new TextDecoder('utf-8', { fatal: true }).decode(svg);
  if (text.length > 8 * 1024 * 1024) fail('echarts_svg_too_large', 'SSR SVG exceeds 8 MiB');
  const parser = new SaxesParser({ xmlns: true, fragment: false });
  let root = null; let depth = 0; let elements = 0; let styleText = ''; const ids = new Set(); const refs = [];
  parser.on('doctype', () => fail('echarts_svg_active_content', 'DOCTYPE is forbidden in SSR SVG'));
  parser.on('processinginstruction', ({ target }) => { if (String(target).toLowerCase() !== 'xml' || root) fail('echarts_svg_active_content', 'processing instructions are forbidden in SSR SVG'); });
  parser.on('opentag', (tag) => {
    depth += 1; elements += 1;
    if (depth > 128 || elements > 100_000) fail('echarts_svg_complexity', 'SSR SVG exceeds structural limits');
    if (!root) root = tag;
    if (tag.uri !== SVG_NS) fail('echarts_svg_foreign_namespace', `foreign SVG element <${tag.name}> is forbidden`);
    if (ACTIVE_ELEMENTS.has(tag.local)) fail('echarts_svg_active_content', `<${tag.local}> is forbidden in SSR SVG`);
    for (const attribute of Object.values(tag.attributes || {})) {
      const local = attribute.local || attribute.name; const value = String(attribute.value);
      if (/^on/i.test(local) || (attribute.uri === XML_NS && local === 'base')) fail('echarts_svg_active_attribute', `${attribute.name} is forbidden in SSR SVG`);
      if (attribute.uri && attribute.uri !== SVG_NS && attribute.uri !== XLINK_NS && attribute.uri !== XML_NS && attribute.uri !== XMLNS_NS) fail('echarts_svg_foreign_namespace', `${attribute.name} uses a foreign namespace`);
      if (local === 'id') { if (!ID_RE.test(value) || ids.has(value)) fail('echarts_svg_id', `invalid or duplicate SVG id ${value}`); ids.add(value); }
      if (local === 'href' || (attribute.uri === XLINK_NS && local === 'href')) { if (!FRAGMENT_RE.test(value)) fail('echarts_svg_external_reference', `${attribute.name} must be a local fragment`); refs.push(value.slice(1)); }
      if (/url\(/i.test(value)) { if (!URL_FRAGMENT_RE.test(value.trim())) fail('echarts_svg_external_reference', `${attribute.name} must reference one local fragment`); refs.push(value.trim().slice(5, -1)); }
    }
    if (tag.local === 'style') styleText = '';
  });
  parser.on('text', (value) => { if (depth > 0 && root?.local === 'svg') styleText += value; });
  parser.on('cdata', (value) => { styleText += value; });
  parser.on('closetag', (tag) => { if (tag?.local === 'style') validateCssText(styleText, 'svg style'); depth -= 1; });
  parser.on('error', (error) => { throw error; });
  try { parser.write(text).close(); } catch (error) { fail('echarts_svg_invalid', `SSR SVG parse failed: ${error.message}`); }
  if (!root || root.local !== 'svg' || root.uri !== SVG_NS) fail('echarts_svg_root', 'SSR SVG root must be <svg> in the SVG namespace');
  for (const ref of refs) if (!ids.has(ref)) fail('echarts_svg_reference', `SSR SVG references missing #${ref}`);
  if (!allowText && /<text\b/i.test(text)) fail('echarts_svg_text', 'text is forbidden for this SVG role');
  return Object.freeze({ schema: ECHARTS_SVG_SCHEMA, bytes: Buffer.byteLength(text), elements, ids: ids.size });
}

export function rewriteSvgInstanceIds(svg, { slideId, fieldPath, occurrence = 0, sourceSvgSha256 } = {}) {
  if (!slideId || !fieldPath || !Number.isInteger(occurrence) || occurrence < 0 || !/^[0-9a-f]{64}$/.test(sourceSvgSha256 || '')) throw new TypeError('slideId, fieldPath, occurrence, and sourceSvgSha256 are required for deterministic SVG rewriting');
  const prefix = `pm-${sha256(canonicalJson([slideId, fieldPath, occurrence, sourceSvgSha256])).slice(0, 16)}-`;
  const ids = new Set();
  const rewritten = String(svg)
    .replace(/\bid="([A-Za-z_][A-Za-z0-9_.:-]*)"/g, (_, id) => { ids.add(id); return `id="${prefix}${id}"`; })
    .replace(/(href|xlink:href)="#([A-Za-z_][A-Za-z0-9_.:-]*)"/g, (_, attr, id) => `${attr}="#${prefix}${id}"`)
    .replace(/url\(#([A-Za-z_][A-Za-z0-9_.:-]*)\)/g, (_, id) => `url(#${prefix}${id})`)
    .replace(/\bclass="([^"]*)"/g, (_, classes) => `class="${classes.split(/\s+/).filter(Boolean).map((name) => /^zr(?:\d+)?-/.test(name) ? `${prefix}${name.replace(/^zr(?:\d+)?-/, '')}` : name).join(' ')}"`)
    .replace(/\.zr(?:\d+)?-/g, `.${prefix}`);
  return Object.freeze({ svg: rewritten, prefix, sourceIds: [...ids] });
}

export async function renderEchartsSsrSvg({ echartsRoot, echartsVersion = ECHARTS_VERSION, option, width, height, slideId, fieldPath, occurrence = 0, importer } = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new TypeError('width and height must be positive finite numbers');
  const normalizedOption = validateClosedEchartsOption(option);
  const installation = resolveEchartsInstallation({ echartsRoot, echartsVersion });
  const echarts = await loadEcharts(installation, importer);
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width, height });
  try {
    chart.setOption(normalizedOption, { notMerge: true, lazyUpdate: false });
    const rawSvg = chart.renderToSVGString();
    validateEchartsSvg(rawSvg);
    const canonicalSvg = canonicalizeEchartsSvgTransientNames(rawSvg);
    validateEchartsSvg(canonicalSvg);
    const sourceSvgSha256 = sha256(canonicalSvg);
    const result = rewriteSvgInstanceIds(canonicalSvg, { slideId, fieldPath, occurrence, sourceSvgSha256 });
    validateEchartsSvg(result.svg);
    return Object.freeze({ ...result, rawSvg, rawSvgSha256: sha256(rawSvg), sourceSvgSha256, sha256: sha256(result.svg), width, height, echartsVersion: installation.version, zrenderVersion: installation.zrenderVersion });
  } finally {
    chart.dispose();
  }
}

export function renderEchartsSsrSvgSync({ echartsRoot, echartsVersion = ECHARTS_VERSION, option, width, height, slideId, fieldPath, occurrence = 0 } = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new TypeError('width and height must be positive finite numbers');
  const normalizedOption = validateClosedEchartsOption(option);
  const installation = resolveEchartsInstallation({ echartsRoot, echartsVersion });
  const requireFromEcharts = createRequire(join(installation.root, 'package.json'));
  const echarts = requireFromEcharts('echarts');
  if (!echarts?.init) throw new Error('Canonical ECharts package does not expose init');
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width, height });
  try {
    chart.setOption(normalizedOption, { notMerge: true, lazyUpdate: false });
    const rawSvg = chart.renderToSVGString();
    validateEchartsSvg(rawSvg);
    const canonicalSvg = canonicalizeEchartsSvgTransientNames(rawSvg);
    validateEchartsSvg(canonicalSvg);
    const sourceSvgSha256 = sha256(canonicalSvg);
    const result = rewriteSvgInstanceIds(canonicalSvg, { slideId, fieldPath, occurrence, sourceSvgSha256 });
    validateEchartsSvg(result.svg);
    return Object.freeze({ ...result, rawSvg, rawSvgSha256: sha256(rawSvg), sourceSvgSha256, sha256: sha256(result.svg), width, height, echartsVersion: installation.version, zrenderVersion: installation.zrenderVersion });
  } finally {
    chart.dispose();
  }
}
