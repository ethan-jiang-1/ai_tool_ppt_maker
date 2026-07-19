import { loadHtmlFamilyGeometryRegistry } from './html_family_geometry.mjs';

export const HTML_COMPONENT_REGISTRY_VERSION = 'html-component-registry-v1';
export const HTML_COMPONENT_FAMILIES = Object.freeze(['hero', 'split', 'cards', 'kpi', 'comparison', 'flow', 'timeline', 'data', 'quote', 'visual-focus']);
const FAMILY_FIELDS = Object.freeze({
  hero: new Set(['hero_statement', 'supporting_line', 'primary_visual']),
  split: new Set(['mode', 'left', 'right', 'text', 'primary_visual']),
  cards: new Set(['cards']),
  kpi: new Set(['metrics']),
  comparison: new Set(['left', 'right']),
  flow: new Set(['steps']),
  timeline: new Set(['steps']),
  data: new Set(['chart', 'insight']),
  quote: new Set(['quote', 'supporting', 'primary_visual']),
  'visual-focus': new Set(['caption', 'primary_visual']),
});
const COLLECTIONS = Object.freeze({ cards: ['cards', 'card'], kpi: ['metrics', 'metric'], flow: ['steps', 'step'], timeline: ['steps', 'step'] });
const HEADER = new Set(['kicker', 'title', 'subtitle']);
const ALLOWED_BOX_NAMES = new Set(['hero_statement', 'supporting_line', 'text', 'left', 'right', 'chart', 'insight', 'quote', 'supporting', 'caption', 'callout', 'primary_visual', 'card_1', 'card_2', 'card_3', 'card_4', 'metric_1', 'metric_2', 'metric_3', 'step_1', 'step_2', 'step_3', 'step_4', 'step_5']);

function fail(message, details = {}) { const error = new Error(message); error.code = details.code || 'html_component_registry'; Object.assign(error, details); throw error; }
function sameJson(left, right) { return JSON.stringify(left) === JSON.stringify(right); }

export function buildHtmlComponentRegistry() {
  const geometry = loadHtmlFamilyGeometryRegistry();
  const variants = Object.fromEntries(Object.entries(geometry.variants).map(([variant, record]) => [variant, Object.freeze({ family: variant.split('--')[0], boxes: Object.freeze({ ...record.boxes }), overlays: Object.freeze(record.overlays.map((entry) => Object.freeze({ ...entry }))) })]));
  return Object.freeze({ schema: HTML_COMPONENT_REGISTRY_VERSION, families: HTML_COMPONENT_FAMILIES, variants: Object.freeze(variants) });
}

export const HTML_COMPONENT_REGISTRY = buildHtmlComponentRegistry();

function expectedCollectionKeys(family, variant) {
  const collection = COLLECTIONS[family]; if (!collection) return [];
  const count = Number(/--n(\d+)/.exec(variant)?.[1] || 0); if (!count) return [];
  return Array.from({ length: count }, (_, index) => `${collection[1]}_${index + 1}`);
}

export function validateHtmlComponentProjection(slide, { registry = HTML_COMPONENT_REGISTRY } = {}) {
  if (!slide || typeof slide !== 'object') fail('slide projection must be an object');
  if (!HTML_COMPONENT_FAMILIES.includes(slide.family)) fail(`unsupported component family ${slide.family}`);
  const variant = slide.geometry?.variant;
  const expected = registry.variants[variant];
  if (!expected || expected.family !== slide.family) fail(`component variant ${variant} is not registered for ${slide.family}`);
  if (!sameJson(slide.geometry.boxes, expected.boxes)) fail(`geometry boxes for ${variant} differ from the closed registry`, { code: 'geometry_registry_mismatch' });
  if (!sameJson(slide.geometry.overlays || [], expected.overlays)) fail(`geometry overlays for ${variant} differ from the closed registry`, { code: 'geometry_overlay_mismatch' });
  const boxKeys = Object.keys(slide.geometry.boxes || {});
  const extraBoxes = boxKeys.filter((key) => !Object.hasOwn(expected.boxes, key));
  if (extraBoxes.length) fail(`undeclared geometry boxes: ${extraBoxes.join(', ')}`, { code: 'undeclared_box' });
  const body = slide.body || {};
  const bodyKeys = Object.keys(body).filter((key) => !['schema_version', 'family', 'callout'].includes(key));
  const allowed = FAMILY_FIELDS[slide.family];
  if (bodyKeys.some((key) => !allowed.has(key))) fail(`body field outside ${slide.family} registry: ${bodyKeys.find((key) => !allowed.has(key))}`, { code: 'undeclared_block' });
  for (const key of allowed) {
    if (key === 'primary_visual') continue;
    const present = Object.hasOwn(body, key);
    if (!present && ['hero_statement', 'supporting_line', 'text', 'insight', 'caption', 'supporting'].includes(key)) continue;
  }
  const expectedCollections = expectedCollectionKeys(slide.family, variant);
  if (expectedCollections.length) {
    const [sourceKey] = COLLECTIONS[slide.family];
    if (!Array.isArray(body[sourceKey]) || body[sourceKey].length !== expectedCollections.length) fail(`${slide.family}.${sourceKey} count does not match ${variant}`, { code: 'collection_count_mismatch' });
    const actual = expectedCollections.filter((key) => !Object.hasOwn(expected.boxes, key));
    if (actual.length) fail(`registry omitted collection boxes ${actual.join(', ')}`, { code: 'collection_box_missing' });
  }
  const overlayKeys = (expected.overlays || []).map((entry) => `${entry.back}->${entry.front}`);
  const actualOverlayKeys = (slide.geometry.overlays || []).map((entry) => `${entry.back}->${entry.front}`);
  if (!sameJson(actualOverlayKeys, overlayKeys)) fail(`overlay collection order differs for ${variant}`, { code: 'overlay_order_mismatch' });
  return Object.freeze({ registry_version: registry.schema, family: slide.family, variant, box_keys: boxKeys, overlay_keys: overlayKeys });
}

export function validateAllHtmlComponentVariants(registry = HTML_COMPONENT_REGISTRY) {
  if (registry.schema !== HTML_COMPONENT_REGISTRY_VERSION || Object.keys(registry.variants).length !== 68) fail('component registry must enumerate exactly 68 geometry variants');
  for (const [variant, record] of Object.entries(registry.variants)) {
    if (!HTML_COMPONENT_FAMILIES.includes(record.family)) fail(`unknown registry family ${record.family}`);
    if (!record.boxes || !Array.isArray(record.overlays)) fail(`registry variant ${variant} is malformed`);
    for (const key of Object.keys(record.boxes)) if (HEADER.has(key) || ALLOWED_BOX_NAMES.has(key)) continue; else fail(`registry variant ${variant} has undeclared box ${key}`);
  }
  return registry;
}

validateAllHtmlComponentVariants();
