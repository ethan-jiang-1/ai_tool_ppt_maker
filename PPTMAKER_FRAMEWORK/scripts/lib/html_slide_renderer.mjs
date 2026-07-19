import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from './canonical_json.mjs';
import { canonicalJsonSha256 } from './canonical_json.mjs';
import { validateAndBuildHtmlFirstPlan, verifyInputReceipts } from './html_slide_contract.mjs';
import { HTML_FONT_ROOT, parseUnicodeRanges } from './html_fonts.mjs';
import { validateHtmlAssetBytes } from './html_asset_catalog.mjs';
import { rewriteSvgInstanceIds } from './html_chart_svg.mjs';
import { renderEchartsSsrSvgSync, validateEchartsSvg } from './html_chart_svg.mjs';
import { validateHtmlComponentProjection } from './html_component_registry.mjs';
import { discoverNpmPackages } from '../env-check.mjs';
import { resolveSlideBindings } from './slide_ids.mjs';
import { inspectHtmlRuntime } from './html_runtime.mjs';
import { captureHtmlPng } from './html_render_runtime.mjs';
import { acquireHtmlPublishLock, ensureHtmlOwnerRoot, htmlOwnerRoot, publishHtmlCurrentManifest, readHtmlCurrentManifest, releaseHtmlPublishLock, writeHtmlObject, HTML_FINAL_SLIDES_MANIFEST_SCHEMA, HTML_PAGES_MANIFEST_SCHEMA } from './html_object_store.mjs';
import { publishHtmlDeliveryContactSheet, publishHtmlReviewPlan } from './html_preview.mjs';
import { finalSlideFingerprintV1 } from './render_artifacts.mjs';
import { inspectHtmlReviewReadiness } from './html_review_evidence.mjs';

export const HTML_RENDERER_VERSION = 'html-renderer-v1';
export const HTML_COMPOSITOR_VERSION = 'html-compositor-v1';
export const HTML_PUBLICATION_SCOPES = Object.freeze(new Set(['canonical-run', 'migration-preview']));
export const HTML_COMPOSITION_VARIANTS = Object.freeze(new Set(['effective', 'forced-fallback']));

const CONTEXTS = new WeakMap();
const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REQUEST_KEYS = new Set(['slideIds', 'compositionVariant', 'dryRun']);
const HEADER_KEYS = new Set(['kicker', 'title', 'subtitle']);

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function cssNumber(value) { if (!Number.isFinite(value)) throw new Error('renderer geometry must be finite'); return Number(value); }
function boxStyle(box) { const [x, y, width, height] = box.map(cssNumber); return `left:${x}px;top:${y}px;width:${width}px;height:${height}px;`; }
function plainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype); }
function assertRequest(request = {}) {
  if (!plainObject(request) || Object.keys(request).some((key) => !REQUEST_KEYS.has(key))) throw new TypeError('renderer request contains an unsupported key');
  const slideIds = request.slideIds == null ? null : request.slideIds;
  if (slideIds != null && (!Array.isArray(slideIds) || slideIds.some((id) => typeof id !== 'string' || !id.trim()))) throw new TypeError('slideIds must be an array of non-empty strings');
  const compositionVariant = request.compositionVariant ?? 'effective';
  if (!HTML_COMPOSITION_VARIANTS.has(compositionVariant)) throw new TypeError('compositionVariant must be effective or forced-fallback');
  if (request.dryRun != null && typeof request.dryRun !== 'boolean') throw new TypeError('dryRun must be boolean');
  return Object.freeze({ slideIds: slideIds ? [...slideIds] : null, compositionVariant, dryRun: request.dryRun === true });
}

function rangesForFile(file) { return file.unicodeRanges.flatMap((range) => parseUnicodeRanges(range)); }
function selectFontFiles(context, slide) {
  const points = new Set(slide.preflight?.font_ranges?.unique_code_points || []);
  const files = context.validated.preflight.inventory.files.filter((file) => {
    const ranges = rangesForFile(file);
    return ranges.some((range) => [...points].some((point) => point >= range.start && point <= range.end));
  });
  return files.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

function fontCss(context, slide) {
  return selectFontFiles(context, slide).map((file) => {
    const bytes = readFileSync(join(HTML_FONT_ROOT, ...file.path.split('/')));
    if (sha256(bytes) !== file.sha256) throw new Error(`font receipt drifted: ${file.path}`);
    const family = escapeHtml(file.family); const weight = escapeHtml(file.weight);
    const ranges = file.unicodeRanges.join(',');
    return `@font-face{font-family:'${family}';font-style:${escapeHtml(file.style)};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');unicode-range:${ranges};}`;
  }).join('');
}

function collectAssetIds(value, ids = new Set()) {
  if (Array.isArray(value)) value.forEach((entry) => collectAssetIds(entry, ids));
  else if (plainObject(value)) for (const [key, entry] of Object.entries(value)) {
    if (key === 'asset_id' && typeof entry === 'string') ids.add(entry);
    if (key === 'asset_ids' && Array.isArray(entry)) entry.filter((id) => typeof id === 'string').forEach((id) => ids.add(id));
    collectAssetIds(entry, ids);
  }
  return ids;
}

function assetHtml(context, slide, assetId, fieldPath, occurrence = 0) {
  const entry = context.validated.assetCatalog.catalog[assetId];
  if (!entry) throw new Error(`renderer asset ${assetId} is not registered`);
  const bytes = readFileSync(entry.absolute_path);
  if (sha256(bytes) !== entry.measured_sha256) throw new Error(`renderer asset receipt drifted: ${assetId}`);
  if (entry.type === 'svg') {
    validateHtmlAssetBytes(bytes, { assetId, type: 'svg' });
    const sourceSha = sha256(bytes);
    const rewritten = rewriteSvgInstanceIds(bytes.toString('utf8'), { slideId: slide.slide_id, fieldPath, occurrence, sourceSvgSha256: sourceSha });
    return `<span class="pm-svg" data-pm-asset="${escapeHtml(assetId)}">${rewritten.svg}</span>`;
  }
  const media = entry.type === 'png' ? 'image/png' : 'image/jpeg';
  return `<img alt="" data-pm-asset="${escapeHtml(assetId)}" src="data:${media};base64,${bytes.toString('base64')}">`;
}

function textValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(' · ');
  if (plainObject(value)) return Object.entries(value).filter(([key]) => !['asset_id', 'asset_ids', 'selection', 'fallback', 'primary_visual'].includes(key)).map(([key, entry]) => textValue(entry)).filter(Boolean).join(' · ');
  return '';
}

function platformFamiliesForText(value) {
  const text = String(value ?? '');
  const hasHan = /[\u3400-\u9fff]/u.test(text);
  const hasLatin = /[A-Za-z0-9]/.test(text);
  if (hasHan && hasLatin) return ['SourceSans3VF', 'Noto Sans SC Thin'];
  if (hasHan) return ['Noto Sans SC Thin'];
  return ['SourceSans3VF'];
}

function pageFontRoles(slide, page) {
  const values = new Map();
  for (const [key, value] of Object.entries(slide.header || {})) if (HEADER_KEYS.has(key) && value != null && String(value).trim()) values.set(`${slide.slide_id}:header.${key}`, value);
  if (slide.callout) values.set(`${slide.slide_id}:callout`, textValue(slide.callout));
  const bodyValues = [];
  for (const [key, value] of Object.entries(slide.body || {})) {
    if (['schema_version', 'family', 'primary_visual', 'callout', 'chart'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((entry, index) => bodyValues.push([`${key}_${index + 1}`, textValue(entry)]));
    else bodyValues.push([key, textValue(value)]);
  }
  bodyValues.forEach(([key, value]) => values.set(`${slide.slide_id}:${key}`, value));
  if (slide.body?.chart) values.set(`${slide.slide_id}:chart`, [
    ...slide.body.chart.categories,
    ...slide.body.chart.series.flatMap((entry) => [entry.name, ...entry.values]),
  ].join(' '));
  return page.leaf_markers.filter((marker) => values.has(marker)).map((marker) => ({
    name: marker,
    selector: `[data-pm-leaf="${marker.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"]`,
    platformFamilies: platformFamiliesForText(values.get(marker)),
  }));
}

function chartOption(slide, theme) {
  const chart = slide.body.chart;
  const series = chart.series.map((entry) => ({
    type: chart.kind === 'area' ? 'line' : chart.kind,
    name: entry.name,
    data: [...entry.values],
    ...(chart.kind === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
  }));
  return {
    animation: false,
    grid: { left: theme.components.chart.plot_padding.left, right: theme.components.chart.plot_padding.right, top: theme.components.chart.plot_padding.top, bottom: theme.components.chart.plot_padding.bottom, containLabel: true },
    legend: { show: chart.legend === 'show' },
    xAxis: { type: 'category', data: [...chart.categories], axisLabel: { color: theme.palette.muted_text } },
    yAxis: { type: 'value', axisLabel: { color: theme.palette.muted_text } },
    series,
  };
}

function renderChart(context, slide) {
  if (slide.family !== 'data' || !slide.body?.chart || !slide.geometry.boxes?.chart) return { html: '', leaves: [] };
  const box = slide.geometry.boxes.chart;
  const rendered = renderEchartsSsrSvgSync({
    echartsRoot: context.echarts.root,
    echartsVersion: context.echarts.version,
    option: chartOption(slide, context.validated.config),
    width: box[2],
    height: box[3],
    slideId: slide.slide_id,
    fieldPath: 'body.chart',
    occurrence: 0,
  });
  const svg = rendered.svg.replaceAll('font-family:sans-serif', "font-family:'Source Sans 3','Noto Sans SC'");
  validateEchartsSvg(svg);
  const marker = `${slide.slide_id}:chart`;
  return { html: `<div class="pm-box pm-chart" data-pm-box="chart" data-pm-leaf="${escapeHtml(marker)}" style="${boxStyle(box)}">${svg}</div>`, leaves: [marker] };
}

function renderBodyBoxes(context, slide) {
  const body = slide.body || {};
  const boxes = Object.entries(slide.geometry.boxes || {}).filter(([key]) => !HEADER_KEYS.has(key) && key !== 'callout' && key !== 'primary_visual');
  const leaves = [];
  const html = [];
  const used = new Set();
  const values = [];
  for (const [key, value] of Object.entries(body)) {
    if (['schema_version', 'family', 'primary_visual', 'callout', 'chart'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((entry, index) => values.push({ key: `${key}_${index + 1}`, value: entry }));
    else values.push({ key, value });
  }
  for (const [boxKey, box] of boxes) {
    const candidate = values.find((entry) => entry.key === boxKey) || values.find((entry) => !used.has(entry.key));
    if (!candidate) continue;
    used.add(candidate.key);
    const text = textValue(candidate.value);
    const marker = `${slide.slide_id}:${candidate.key}`;
    leaves.push(marker);
    html.push(`<div class="pm-box pm-body" data-pm-box="${escapeHtml(boxKey)}" data-pm-leaf="${escapeHtml(marker)}" style="${boxStyle(box)}">${escapeHtml(text)}</div>`);
  }
  if (!html.length && boxes[0]) {
    const marker = `${slide.slide_id}:body`;
    leaves.push(marker);
    html.push(`<div class="pm-box pm-body" data-pm-box="body" data-pm-leaf="${escapeHtml(marker)}" style="${boxStyle(boxes[0][1])}">${escapeHtml(textValue(body))}</div>`);
  }
  const chart = renderChart(context, slide);
  return { html: [...html, chart.html].filter(Boolean), leaves: [...leaves, ...chart.leaves] };
}

function renderPrimaryVisual(context, slide, variant) {
  const box = slide.geometry.boxes?.primary_visual;
  if (!box || !slide.visual_resolution) return { html: '', leaves: [] };
  const visual = variant === 'forced-fallback' ? slide.visual_resolution.fallback : (slide.visual_resolution.effective === 'selected' ? slide.visual_resolution.selected : slide.visual_resolution.fallback);
  if (!visual) return { html: '', leaves: [] };
  let content = '';
  if (visual.kind === 'asset') content = assetHtml(context, slide, visual.asset.asset_id, 'primary_visual.asset', 0);
  else if (visual.kind === 'icon-composition') content = visual.assets.map((asset, index) => assetHtml(context, slide, asset.asset_id, 'primary_visual.icon', index)).join('');
  else if (visual.kind === 'abstract-pattern') content = `<span class="pm-pattern pm-pattern-${escapeHtml(visual.recipe)}" data-pm-pattern="${escapeHtml(visual.recipe)}"></span>`;
  const marker = `${slide.slide_id}:primary_visual:${variant}`;
  return { html: `<div class="pm-box pm-visual" data-pm-box="primary_visual" data-pm-leaf="${escapeHtml(marker)}" style="${boxStyle(box)}">${content}</div>`, leaves: [marker] };
}

function renderPage(context, slide, variant) {
  validateHtmlComponentProjection(slide);
  const theme = context.validated.config;
  const header = slide.header || {};
  const headerHtml = Object.entries(header).filter(([key, value]) => HEADER_KEYS.has(key) && value != null && String(value).trim()).map(([key, value]) => {
    const box = slide.geometry.boxes?.[key];
    return box ? `<div class="pm-box pm-${key}" data-pm-box="${key}" data-pm-leaf="${escapeHtml(`${slide.slide_id}:header.${key}`)}" style="${boxStyle(box)}">${escapeHtml(value)}</div>` : '';
  }).join('');
  const body = renderBodyBoxes(context, slide);
  const visual = renderPrimaryVisual(context, slide, variant);
  const callout = slide.callout && slide.geometry.boxes?.callout ? `<div class="pm-box pm-callout" data-pm-box="callout" data-pm-leaf="${escapeHtml(`${slide.slide_id}:callout`)}" style="${boxStyle(slide.geometry.boxes.callout)}">${escapeHtml(textValue(slide.callout))}</div>` : '';
  const leaves = [...Object.entries(header).filter(([key, value]) => HEADER_KEYS.has(key) && value != null && String(value).trim()).map(([key]) => `${slide.slide_id}:header.${key}`), ...body.leaves, ...visual.leaves, ...(callout ? [`${slide.slide_id}:callout`] : [])];
  const palette = theme.palette;
  const css = `html,body{margin:0;padding:0;width:1000px;height:563px;overflow:hidden;background:${palette.background};} [data-pptmaker-slide]{position:relative;width:1000px;height:562.5px;overflow:hidden;background:${palette.background};color:${palette.text};font-family:'Source Sans 3','Noto Sans SC';font-synthesis:none;line-break:strict;hyphens:none;} .pm-box{position:absolute;box-sizing:border-box;overflow:hidden;overflow-wrap:normal;white-space:pre-wrap;word-break:normal;font-synthesis:none;hyphens:none;} .pm-kicker{font:600 16px/1.2 'Source Sans 3','Noto Sans SC';color:${palette.muted_text};}.pm-title{font:700 30px/1.1 'Source Sans 3','Noto Sans SC';color:${palette.text};}.pm-subtitle{font:400 18px/1.2 'Source Sans 3','Noto Sans SC';color:${palette.muted_text};}.pm-body{font:400 20px/1.25 'Source Sans 3','Noto Sans SC';color:${palette.text};}.pm-callout{font:600 18px/1.2 'Source Sans 3','Noto Sans SC';color:${palette.text};background:${theme.components.callout.background};border:1px solid ${theme.components.callout.border};padding:${theme.components.callout.padding_y}px ${theme.components.callout.padding_x}px;border-radius:${theme.components.callout.radius}px;}.pm-visual{display:flex;align-items:center;justify-content:center;}.pm-visual img,.pm-visual .pm-svg{max-width:100%;max-height:100%;}.pm-pattern{display:block;width:100%;height:100%;}.pm-pattern-gradient-field{background:linear-gradient(135deg,${palette.background},${palette.accent},${palette.accent_secondary});}.pm-pattern-line-grid{background-color:${palette.background};background-image:linear-gradient(${palette.divider} 1px,transparent 1px),linear-gradient(90deg,${palette.divider} 1px,transparent 1px);background-size:32px 32px;}.pm-pattern-soft-orbs{background:radial-gradient(circle at 25% 35%,${palette.accent},transparent 42%),radial-gradient(circle at 75% 65%,${palette.accent_secondary},transparent 42%),${palette.background};}`;
  const csp = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; frame-src 'none'; child-src 'none'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none';";
  const html = `<!doctype html><html lang="und"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${fontCss(context, slide)}${css}</style></head><body><main data-pptmaker-slide data-pm-slide-id="${escapeHtml(slide.slide_id)}" data-pm-composition-variant="${variant}">${headerHtml}${body.html.join('')}${visual.html}${callout}</main></body></html>`;
  if (Buffer.byteLength(html, 'utf8') > 64 * 1024 * 1024) throw new Error(`serialized HTML page exceeds 64 MiB for ${slide.slide_id}`);
  return Object.freeze({ slide_id: slide.slide_id, composition_variant: variant, effective_visual_state: slide.visual_resolution?.state ?? null, html, html_sha256: sha256(Buffer.from(html)), leaf_markers: leaves });
}

function effectiveVisualProjection(slide, variant) {
  const resolution = slide.visual_resolution;
  if (!resolution) return null;
  const selected = variant === 'forced-fallback' ? null : resolution.effective === 'selected' ? resolution.selected : null;
  const fallback = resolution.fallback;
  const asset = selected?.asset || fallback?.asset;
  return {
    state: variant === 'forced-fallback' ? 'forced-fallback' : resolution.state,
    effective: variant === 'forced-fallback' ? 'fallback' : resolution.effective,
    fallback: fallback ? { kind: fallback.kind, recipe: fallback.recipe ?? null, assets: fallback.assets?.map((entry) => ({ asset_id: entry.asset_id, type: entry.type, measured_sha256: entry.measured_sha256 })) ?? (fallback.asset ? [{ asset_id: fallback.asset.asset_id, type: fallback.asset.type, measured_sha256: fallback.asset.measured_sha256 }] : []) } : null,
    selected: selected ? { asset_id: asset.asset_id, type: asset.type, measured_sha256: asset.measured_sha256 } : null,
  };
}

function mergeCurrentEntries({ previous, produced, orderedSlideIds, expectedFingerprints }) {
  const producedById = new Map(produced.map((entry) => [entry.slide_id, entry]));
  const previousById = new Map((previous?.manifest.entries || []).filter((entry) => typeof entry.slide_id === 'string' && entry.composition_fingerprint === expectedFingerprints.get(entry.slide_id) && (!entry.composition_input_receipt || entry.composition_input_receipt.composition_fingerprint === expectedFingerprints.get(entry.slide_id))).map((entry) => [entry.slide_id, entry]));
  return orderedSlideIds.flatMap((slideId) => {
    const entry = producedById.get(slideId) || previousById.get(slideId);
    return entry ? [entry] : [];
  });
}

function compositionProjection(record, slide, variant) {
  const referenced = [...collectAssetIds(variant === 'forced-fallback' ? { primary_visual: slide.visual_resolution?.fallback } : { primary_visual: slide.visual_resolution?.effective === 'selected' ? slide.visual_resolution.selected : slide.visual_resolution?.fallback })].sort();
  const assets = referenced.map((assetId) => {
    const entry = record.validated.assetCatalog.catalog[assetId];
    return { asset_id: assetId, type: entry?.type ?? null, measured_sha256: entry?.measured_sha256 ?? null };
  });
  const fonts = selectFontFiles(record, slide).map((file) => ({ sha256: file.sha256, family: file.family, weight: file.weight, unicode_ranges: file.unicodeRanges }));
  return {
    schema: 'composition_input_projection_v1',
    slide_id: slide.slide_id,
    composition_variant: variant,
    renderer: HTML_RENDERER_VERSION,
    compositor: HTML_COMPOSITOR_VERSION,
    component_registry: 'html-component-registry-v1',
    chart: slide.body?.chart ? { kind: slide.body.chart.kind, categories: slide.body.chart.categories, series: slide.body.chart.series, value_format: slide.body.chart.value_format, legend: slide.body.chart.legend, echarts: record.echarts ? { version: record.echarts.version, zrender_version: '6.1.0' } : null } : null,
    runtime_profile: 'html-runtime-v1',
    theme: record.validated.config,
    family: slide.family,
    header: slide.header,
    body: slide.body,
    callout: slide.callout,
    visual_type: slide.visual_type,
    visual: effectiveVisualProjection(slide, variant),
    geometry: slide.geometry,
    assets,
    fonts,
  };
}

export function compositionFingerprintV1(validatedRun, slideId, compositionVariant = 'effective') {
  const record = contextRecord(validatedRun); const normalized = assertRequest({ slideIds: [slideId], compositionVariant });
  const slide = selectedSlides(record, normalized)[0];
  return canonicalJsonSha256(compositionProjection(record, slide, compositionVariant));
}

export function resolveHtmlSlideSelectors(validatedRun, tokens) {
  const record = contextRecord(validatedRun);
  if (!Array.isArray(tokens) || tokens.some((token) => typeof token !== 'string' || !token.trim())) throw new TypeError('HTML slide selectors must be non-empty strings');
  return resolveSlideBindings(tokens, record.plan.slides.map((slide) => ({ ...slide, title: slide.header?.title ?? '' }))).map((binding) => binding.slide_id);
}

export function compositionInputReceiptV1(validatedRun, slideId, compositionVariant = 'effective') {
  const record = contextRecord(validatedRun); const normalized = assertRequest({ slideIds: [slideId], compositionVariant });
  const slide = selectedSlides(record, normalized)[0];
  const projection = compositionProjection(record, slide, compositionVariant);
  return Object.freeze({ schema: 'composition_input_receipt_v1', slide_id: slide.slide_id, composition_variant: compositionVariant, composition_fingerprint: canonicalJsonSha256(projection), current_plan_membership: { slide_id: slide.slide_id, composition_variant: compositionVariant }, projection, confined_font_inputs: selectFontFiles(record, slide).map((file) => ({ scope: 'framework', path: `scripts/fonts/${file.path}`, sha256: file.sha256 })) });
}

export function htmlDeliveryDigestV1(plan, finalSlides) {
  if (!plan || !Array.isArray(plan.slides) || !Array.isArray(finalSlides)) throw new TypeError('plan and finalSlides are required for delivery digest');
  if (finalSlides.length !== plan.slides.length || finalSlides.some((entry, index) => entry.slide_id !== plan.slides[index].slide_id || entry.composition_variant !== 'effective')) throw new Error('effective final-slide set is incomplete or out of plan order');
  return canonicalJsonSha256({ schema: 'html_delivery_digest_v1', ordered_plan_digest: plan.ordered_plan_digest, slides: finalSlides.map((entry) => ({ slide_id: entry.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.png_sha256 })) });
}

function contextRecord(context) {
  const record = CONTEXTS.get(context);
  if (!record) throw new TypeError('validated HTML renderer context is opaque or invalid');
  return record;
}

export function createCanonicalHtmlValidatedRunContext(options = {}) {
  if (!plainObject(options) || Object.keys(options).some((key) => !new Set(['runDir', 'sourceBytes']).has(key))) throw new TypeError('canonical renderer context options are closed');
  const { runDir, sourceBytes = null } = options;
  const { validated, plan } = validateAndBuildHtmlFirstPlan({ runDir, sourceBytes });
  verifyInputReceipts(validated.receipts, { runDir: validated.runDir, assetCatalog: validated.assetCatalog });
  const context = Object.freeze({});
  const discovered = discoverNpmPackages(FRAMEWORK_ROOT);
  if (!discovered.echarts || discovered.echarts.version !== '6.1.0') throw new Error('exact ECharts 6.1.0 must be discovered before renderer context issuance');
  if (!discovered.playwright) throw new Error('paired Playwright must be discovered before renderer context issuance');
  const resetSnapshot = inspectHtmlReviewReadiness(validated.runDir);
  if (resetSnapshot.conflict) throw new Error(`CONFLICT: ${resetSnapshot.reason}`);
  CONTEXTS.set(context, Object.freeze({ validated, plan, publicationScope: 'canonical-run', htmlProductionResetId: resetSnapshot.html_production_reset_id, echarts: discovered.echarts, playwright: discovered.playwright }));
  return context;
}

function createMigrationPreviewHtmlValidatedRunContext(validated, plan, { htmlProductionResetId = null } = {}) {
  if (!validated || !plan || htmlProductionResetId !== null) throw new TypeError('migration preview contexts require validated projected inputs and a null reset ID');
  const context = Object.freeze({});
  CONTEXTS.set(context, Object.freeze({ validated, plan, publicationScope: 'migration-preview', htmlProductionResetId: null }));
  return context;
}

function selectedSlides(record, request) {
  const byId = new Map(record.plan.slides.map((slide) => [slide.slide_id, slide]));
  const ids = request.slideIds || record.plan.slides.map((slide) => slide.slide_id);
  const seen = new Set();
  return ids.map((id) => {
    if (seen.has(id)) throw new Error(`duplicate renderer slide ID ${id}`);
    seen.add(id);
    const slide = byId.get(id);
    if (!slide) throw new Error(`renderer slide ID ${id} is not in the validated plan`);
    return slide;
  });
}

export function buildHtmlPages(validatedRun, request = {}) {
  const record = contextRecord(validatedRun); const normalized = assertRequest(request);
  const pages = selectedSlides(record, normalized).map((slide) => {
    const page = renderPage(record, slide, normalized.compositionVariant);
    return Object.freeze({ ...page, composition_fingerprint: canonicalJsonSha256(compositionProjection(record, slide, normalized.compositionVariant)), composition_input_receipt: compositionInputReceiptV1(validatedRun, slide.slide_id, normalized.compositionVariant) });
  });
  return Object.freeze({ publication_scope: record.publicationScope, html_production_reset_id: record.htmlProductionResetId, composition_variant: normalized.compositionVariant, dry_run: normalized.dryRun, pages, diagnostics: Object.freeze({ renderer: HTML_RENDERER_VERSION, page_count: pages.length }) });
}

export function composeHtmlSlides(validatedRun, request = {}) {
  const pages = buildHtmlPages(validatedRun, request);
  return Object.freeze({ ...pages, compositor: HTML_COMPOSITOR_VERSION, final_slides: pages.pages.map((page) => Object.freeze({ slide_id: page.slide_id, composition_variant: page.composition_variant, html_sha256: page.html_sha256, page })) });
}

export async function composeHtmlSlidesVerified(validatedRun, request = {}) {
  const record = contextRecord(validatedRun); const normalized = assertRequest(request);
  const pagesResult = buildHtmlPages(validatedRun, normalized);
  if (normalized.dryRun) return Object.freeze({ ...pagesResult, compositor: HTML_COMPOSITOR_VERSION, final_slides: [], dry_run: true });
  const runtimeEvidence = await inspectHtmlRuntime({ playwrightRoot: record.playwright.root, playwrightVersion: record.playwright.version });
  if (!runtimeEvidence.ok) throw new Error(`paired HTML runtime is not ready: ${runtimeEvidence.error || 'unknown failure'}`);
  const byId = new Map(record.plan.slides.map((slide) => [slide.slide_id, slide]));
  const finalSlides = [];
  for (const page of pagesResult.pages) {
    const slide = byId.get(page.slide_id);
    const capture = await captureHtmlPng({
      runtimeEvidence,
      html: page.html,
      expectedLeafMarkers: page.leaf_markers,
      fontRoles: pageFontRoles(slide, page),
      probeForbiddenRoutes: true,
    });
    if (!capture.ok) throw new Error(`HTML composition failed for ${page.slide_id} during ${capture.phase}: ${capture.error}`);
    finalSlides.push(Object.freeze({
      slide_id: page.slide_id,
      artifact_kind: 'final-slide',
      producer: HTML_COMPOSITOR_VERSION,
      composition_variant: page.composition_variant,
      composition_fingerprint: page.composition_fingerprint,
      composition_input_receipt: page.composition_input_receipt,
      html_sha256: page.html_sha256,
      composition_fingerprint: page.composition_fingerprint,
      composition_input_receipt: page.composition_input_receipt,
      png_sha256: capture.png.sha256,
      width: capture.png.width,
      height: capture.png.height,
      media_profile: capture.profile,
      page,
      capture,
    }));
  }
  const deliveryDigest = normalized.compositionVariant === 'effective' && finalSlides.length === record.plan.slides.length ? htmlDeliveryDigestV1(record.plan, finalSlides) : null;
  return Object.freeze({ ...pagesResult, compositor: HTML_COMPOSITOR_VERSION, html_delivery_digest: deliveryDigest, final_slides: finalSlides });
}

function publishOwnerEntries(record, { ownerKind, schema, entries, extension, operation }) {
  const resetBeforeLock = inspectHtmlReviewReadiness(record.validated.runDir);
  if (resetBeforeLock.conflict || resetBeforeLock.html_production_reset_id !== record.htmlProductionResetId) throw new Error('CONFLICT: HTML production reset changed before publication lock');
  const ownerRoot = ensureHtmlOwnerRoot(record.validated.runDir, ownerKind);
  const previous = readHtmlCurrentManifest(ownerRoot, { expectedSchema: schema, publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId });
  const scopeInput = canonicalJsonSha256({ operation, slide_ids: entries.map((entry) => entry.metadata.slide_id), reset_id: record.htmlProductionResetId });
  const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind, publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, inputScopeSha256: scopeInput, priorManifestSha256: previous?.sha256 ?? null });
  try {
    verifyInputReceipts(record.validated.receipts, { runDir: record.validated.runDir, assetCatalog: record.validated.assetCatalog });
    const objects = entries.map((entry) => writeHtmlObject({ ownerRoot, bytes: entry.bytes, extension, ownerToken: lock.ownerToken }));
    const producedEntries = entries.map((entry, index) => ({ ...entry.metadata, path: objects[index].path, sha256: objects[index].sha256 }));
    const expectedFingerprints = new Map(record.plan.slides.map((slide) => [slide.slide_id, canonicalJsonSha256(compositionProjection(record, slide, 'effective'))]));
    const manifestEntries = mergeCurrentEntries({ previous, produced: producedEntries, orderedSlideIds: record.plan.slides.map((slide) => slide.slide_id), expectedFingerprints });
    verifyInputReceipts(record.validated.receipts, { runDir: record.validated.runDir, assetCatalog: record.validated.assetCatalog });
    const resetBeforeCommit = inspectHtmlReviewReadiness(record.validated.runDir);
    if (resetBeforeCommit.conflict || resetBeforeCommit.html_production_reset_id !== record.htmlProductionResetId) throw new Error('CONFLICT: HTML production reset changed before manifest commit');
    return publishHtmlCurrentManifest({ ownerRoot, ownerToken: lock.ownerToken, schema, publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, entries: manifestEntries, priorManifestSha256: previous?.sha256 ?? null });
  } finally { releaseHtmlPublishLock(lock); }
}

export async function publishHtmlPages(validatedRun, request = {}) {
  const record = contextRecord(validatedRun); const normalized = assertRequest(request);
  const pagesResult = buildHtmlPages(validatedRun, normalized);
  if (normalized.dryRun) return pagesResult;
  if (normalized.compositionVariant === 'forced-fallback') return Object.freeze({ ...pagesResult, published: false, reason: 'forced-fallback-review-only' });
  const manifest = publishOwnerEntries(record, {
    ownerKind: 'html-pages', schema: HTML_PAGES_MANIFEST_SCHEMA, extension: 'html', operation: 'publish-html-pages',
    entries: pagesResult.pages.map((page) => ({ bytes: Buffer.from(page.html), metadata: { slide_id: page.slide_id, artifact_kind: 'html-page', composition_variant: page.composition_variant, html_sha256: page.html_sha256, composition_fingerprint: page.composition_fingerprint, composition_input_receipt: page.composition_input_receipt } })),
  });
  const reviewPlan = await publishHtmlReviewPlan({ runDir: record.validated.runDir, plan: record.plan, composition: pagesResult, kind: 'content', publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, compositionVariant: normalized.compositionVariant });
  const currentIds = new Set(manifest.manifest.entries.map((entry) => entry.slide_id));
  return Object.freeze({ ...pagesResult, published: true, manifests: [manifest], incomplete_slide_ids: record.plan.slides.map((slide) => slide.slide_id).filter((slideId) => !currentIds.has(slideId)), review_plan: reviewPlan });
}

export async function publishHtmlFinalSlides(validatedRun, request = {}) {
  const record = contextRecord(validatedRun); const normalized = assertRequest(request);
  const composed = await composeHtmlSlidesVerified(validatedRun, normalized);
  if (normalized.dryRun) return composed;
  if (normalized.compositionVariant === 'forced-fallback') {
    const reviewPlan = await publishHtmlReviewPlan({ runDir: record.validated.runDir, plan: record.plan, composition: composed, kind: 'visual', publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, compositionVariant: normalized.compositionVariant });
    return Object.freeze({ ...composed, published: false, reason: 'forced-fallback-review-only', review_plan: reviewPlan });
  }
  const pagesRoot = htmlOwnerRoot(record.validated.runDir, 'html-pages');
  const currentPages = readHtmlCurrentManifest(pagesRoot, { expectedSchema: HTML_PAGES_MANIFEST_SCHEMA, publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId });
  if (!currentPages) throw new Error('current HTML page manifest is missing; run Stage 2 first');
  const pageById = new Map(currentPages.manifest.entries.map((entry) => [entry.slide_id, entry]));
  for (const page of composed.pages) {
    const current = pageById.get(page.slide_id);
    if (!current || current.html_sha256 !== page.html_sha256 || current.composition_fingerprint !== page.composition_fingerprint) throw new Error(`current HTML page evidence is stale for ${page.slide_id}; rerun Stage 2`);
  }
  const manifest = publishOwnerEntries(record, {
    ownerKind: 'final-slides', schema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA, extension: 'png', operation: 'publish-html-final-slides',
    entries: composed.final_slides.map((slide) => ({ bytes: slide.capture.bytes, metadata: { slide_id: slide.slide_id, artifact_kind: 'final-slide', producer: slide.producer, composition_variant: slide.composition_variant, html_sha256: slide.html_sha256, composition_fingerprint: slide.composition_fingerprint, composition_input_receipt: slide.composition_input_receipt, final_slide_fingerprint: finalSlideFingerprintV1({ producer: slide.producer, producerPrivateFingerprint: slide.composition_fingerprint, byteSha256: slide.png_sha256, width: slide.width, height: slide.height, mediaProfile: slide.media_profile }), width: slide.width, height: slide.height, media_profile: slide.media_profile } })),
  });
  const finalRoot = htmlOwnerRoot(record.validated.runDir, 'final-slides');
  const complete = manifest.manifest.entries.length === record.plan.slides.length;
  const reviewPlan = await publishHtmlReviewPlan({ runDir: record.validated.runDir, plan: record.plan, composition: composed, kind: 'visual', publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, compositionVariant: normalized.compositionVariant, outstanding: complete ? [] : ['incomplete-final-slide-set'] });
  const contactSheet = complete ? await publishHtmlDeliveryContactSheet({ runDir: record.validated.runDir, orderedEntries: manifest.manifest.entries.map((entry) => ({ slide_id: entry.slide_id, path: join(finalRoot, ...entry.path.split('/')) })), publicationScope: record.publicationScope, htmlProductionResetId: record.htmlProductionResetId, slot: 'visual_review', ownerDigest: reviewPlan.reviewPlan.plan_hash }) : null;
  const currentIds = new Set(manifest.manifest.entries.map((entry) => entry.slide_id));
  return Object.freeze({ ...composed, published: true, manifests: [manifest], incomplete_slide_ids: record.plan.slides.map((slide) => slide.slide_id).filter((slideId) => !currentIds.has(slideId)), contact_sheet: contactSheet, review_plan: reviewPlan });
}

export async function publishHtmlComposition(validatedRun, request = {}) {
  const normalized = assertRequest(request);
  if (normalized.dryRun) return composeHtmlSlidesVerified(validatedRun, normalized);
  const pages = await publishHtmlPages(validatedRun, normalized);
  if (normalized.compositionVariant === 'forced-fallback') return publishHtmlFinalSlides(validatedRun, normalized);
  const final = await publishHtmlFinalSlides(validatedRun, normalized);
  return Object.freeze({ ...final, pages: pages.pages, manifests: [...pages.manifests, ...final.manifests] });
}
