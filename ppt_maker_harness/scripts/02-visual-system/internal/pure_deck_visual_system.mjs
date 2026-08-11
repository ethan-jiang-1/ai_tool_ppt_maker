import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";

export const PURE_DECK_VISUAL_SYSTEM_SCHEMA = "pptmaker-pure-deck-visual-system";

const FONT_VOICES = Object.freeze(["editorial-serif", "editorial-sans", "geometric-sans", "humanist-sans"]);
const TYPE_TIERS = Object.freeze({
  eyebrow: 1,
  label: 2,
  supporting: 2,
  body: 3,
  metric: 3,
  diagram: 3,
  quote: 3,
  callout: 3,
  heading: 4,
  display: 5,
});
const COLOUR_VALUES = Object.freeze(["primary", "secondary", "accent", "neutral"]);
const WHITESPACE_DENSITIES = Object.freeze(["compact", "balanced", "generous"]);
const LAYOUT_FAMILIES = Object.freeze([
  "editorial-hero",
  "diagram-led",
  "data-led",
  "comparison",
  "timeline",
  "process",
  "quote-led",
]);
const PROFILE_KEYS = Object.freeze(["typography", "colour_use", "layout"]);
const VOICES_KEYS = Object.freeze(["display", "text"]);
const HIERARCHY_KEYS = Object.freeze([
  "kicker",
  "title",
  "subtitle",
  "body",
  "label",
  "metric",
  "diagram_text",
  "quote",
  "callout",
  "supporting_copy",
]);
const COLOUR_USE_KEYS = Object.freeze(["palette_source", "roles"]);
const COLOUR_ROLE_KEYS = Object.freeze(["primary_text", "secondary_text", "accent", "surface"]);
const LAYOUT_KEYS = Object.freeze(["zones", "whitespace", "families"]);
const ZONES_KEYS = Object.freeze(["title", "content"]);
const ZONE_KEYS = Object.freeze(["x", "y", "width", "height"]);

export class PureDeckVisualSystemError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((item) => item.message || String(item)).join("; "));
    this.name = "PureDeckVisualSystemError";
    this.code = list[0]?.code || "pure_deck_visual_system_invalid";
    this.issues = Object.freeze([...list]);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function issue(code, message, { source, path, actual, expected } = {}) {
  return {
    code,
    message,
    ...(source ? { source } : {}),
    ...(path ? { path } : {}),
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function nodeKind(node) {
  if (isAlias(node)) return "alias";
  if (isMap(node)) return "mapping";
  if (isSeq(node)) return "sequence";
  if (isScalar(node)) return "scalar";
  return "value";
}

function directYaml(node) {
  if (!node) return true;
  if (isAlias(node) || node.anchor || node.tag) return false;
  if (isMap(node)) return node.items.every((pair) => directYaml(pair.key) && directYaml(pair.value));
  if (isSeq(node)) return node.items.every((item) => directYaml(item));
  return true;
}

function plainString(node) {
  return isScalar(node) && node.type === "PLAIN" && !node.anchor && !node.tag && typeof node.value === "string";
}

function exactMap(node, expectedKeys, context, issues) {
  if (!isMap(node) || !directYaml(node)) {
    issues.push(issue("invalid_pure_visual_system_mapping", `${context} must be one direct untagged mapping`, { path: context, actual: nodeKind(node) }));
    return new Map();
  }
  const pairs = new Map();
  for (const pair of node.items) {
    if (!plainString(pair.key)) {
      issues.push(issue("invalid_pure_visual_system_key", `${context} keys must be unquoted direct strings`, { path: context }));
      continue;
    }
    const key = pair.key.value;
    if (!expectedKeys.includes(key)) {
      issues.push(issue("unknown_pure_visual_system_key", `${context} contains unknown key ${JSON.stringify(key)}`, { path: context, actual: key, expected: expectedKeys }));
      continue;
    }
    if (pairs.has(key)) {
      issues.push(issue("duplicate_pure_visual_system_key", `${context} repeats key ${JSON.stringify(key)}`, { path: context, actual: key }));
      continue;
    }
    pairs.set(key, pair.value);
  }
  for (const key of expectedKeys) {
    if (!pairs.has(key)) issues.push(issue("missing_pure_visual_system_key", `${context} is missing ${key}`, { path: context, expected: key }));
  }
  return pairs;
}

function parseString(node, context, issues) {
  if (!plainString(node)) {
    issues.push(issue("invalid_pure_visual_system_scalar", `${context} must be an unquoted direct scalar`, { path: context, actual: nodeKind(node) }));
    return null;
  }
  return node.value;
}

function parseEnum(node, context, allowed, issues) {
  const value = parseString(node, context, issues);
  if (value !== null && !allowed.includes(value)) {
    issues.push(issue("invalid_pure_visual_system_enum", `${context} must be one of ${allowed.join(", ")}`, { path: context, actual: value, expected: allowed }));
  }
  return value;
}

function parseNormalizedNumber(node, context, issues) {
  if (!isScalar(node) || node.type !== "PLAIN" || node.anchor || node.tag || typeof node.value !== "number" || !Number.isFinite(node.value)) {
    issues.push(issue("invalid_pure_visual_system_geometry", `${context} must be a finite normalized number`, { path: context, actual: node?.value }));
    return null;
  }
  if (node.value < 0 || node.value > 1) {
    issues.push(issue("invalid_pure_visual_system_geometry", `${context} must be between 0 and 1`, { path: context, actual: node.value }));
    return null;
  }
  return node.value;
}

function parseVoices(node, issues) {
  const map = exactMap(node, VOICES_KEYS, "typography.voices", issues);
  const voices = {
    display: parseEnum(map.get("display"), "typography.voices.display", FONT_VOICES, issues),
    text: parseEnum(map.get("text"), "typography.voices.text", FONT_VOICES, issues),
  };
  if (voices.display && voices.text && voices.display === voices.text) {
    issues.push(issue("pure_visual_system_font_pair_invalid", "typography.voices must name distinct display and text voices", { path: "typography.voices" }));
  }
  return voices;
}

function parseHierarchy(node, issues) {
  const map = exactMap(node, HIERARCHY_KEYS, "typography.hierarchy", issues);
  const hierarchy = {};
  for (const key of HIERARCHY_KEYS) hierarchy[key] = parseEnum(map.get(key), `typography.hierarchy.${key}`, Object.keys(TYPE_TIERS), issues);
  const titleTier = TYPE_TIERS[hierarchy.title];
  const otherTiers = HIERARCHY_KEYS.filter((key) => key !== "title").map((key) => TYPE_TIERS[hierarchy[key]]);
  if (titleTier && otherTiers.every((tier) => Number.isInteger(tier)) && otherTiers.some((tier) => titleTier <= tier)) {
    issues.push(issue("pure_visual_system_hierarchy_invalid", "typography.hierarchy.title must rank above every other text role", { path: "typography.hierarchy.title" }));
  }
  return hierarchy;
}

function parseTypography(node, issues) {
  const map = exactMap(node, ["voices", "hierarchy"], "typography", issues);
  return {
    voices: parseVoices(map.get("voices"), issues),
    hierarchy: parseHierarchy(map.get("hierarchy"), issues),
  };
}

function parseColourUse(node, issues) {
  const map = exactMap(node, COLOUR_USE_KEYS, "colour_use", issues);
  const rolesMap = exactMap(map.get("roles"), COLOUR_ROLE_KEYS, "colour_use.roles", issues);
  const roles = {};
  for (const key of COLOUR_ROLE_KEYS) roles[key] = parseEnum(rolesMap.get(key), `colour_use.roles.${key}`, COLOUR_VALUES, issues);
  const paletteSource = parseEnum(map.get("palette_source"), "colour_use.palette_source", ["style-master"], issues);
  if (roles.primary_text && roles.secondary_text && roles.primary_text === roles.secondary_text) {
    issues.push(issue("pure_visual_system_colour_roles_invalid", "primary_text and secondary_text must use distinct Style Master roles", { path: "colour_use.roles" }));
  }
  if (roles.accent && roles.accent !== "accent") {
    issues.push(issue("pure_visual_system_colour_roles_invalid", "colour_use.roles.accent must use accent", { path: "colour_use.roles.accent", actual: roles.accent }));
  }
  if (roles.surface && roles.surface !== "neutral") {
    issues.push(issue("pure_visual_system_colour_roles_invalid", "colour_use.roles.surface must use neutral", { path: "colour_use.roles.surface", actual: roles.surface }));
  }
  return { palette_source: paletteSource, roles };
}

function parseZone(node, name, issues) {
  const context = `layout.zones.${name}`;
  const map = exactMap(node, ZONE_KEYS, context, issues);
  const zone = {};
  for (const key of ZONE_KEYS) zone[key] = parseNormalizedNumber(map.get(key), `${context}.${key}`, issues);
  if (zone.width !== null && zone.width <= 0) issues.push(issue("invalid_pure_visual_system_geometry", `${context}.width must be positive`, { path: `${context}.width`, actual: zone.width }));
  if (zone.height !== null && zone.height <= 0) issues.push(issue("invalid_pure_visual_system_geometry", `${context}.height must be positive`, { path: `${context}.height`, actual: zone.height }));
  if (zone.x !== null && zone.width !== null && zone.x + zone.width > 1) issues.push(issue("invalid_pure_visual_system_geometry", `${context} exceeds normalized horizontal bounds`, { path: context, actual: zone }));
  if (zone.y !== null && zone.height !== null && zone.y + zone.height > 1) issues.push(issue("invalid_pure_visual_system_geometry", `${context} exceeds normalized vertical bounds`, { path: context, actual: zone }));
  return zone;
}

function parseFamilies(node, issues) {
  if (!isSeq(node) || !directYaml(node)) {
    issues.push(issue("invalid_pure_visual_system_families", "layout.families must be one direct ordered sequence", { path: "layout.families", actual: nodeKind(node) }));
    return [];
  }
  const families = [];
  const seen = new Set();
  for (const item of node.items) {
    const family = parseEnum(item, "layout.families", LAYOUT_FAMILIES, issues);
    if (family === null) continue;
    if (seen.has(family)) issues.push(issue("duplicate_pure_visual_system_family", `layout.families repeats ${JSON.stringify(family)}`, { path: "layout.families", actual: family }));
    seen.add(family);
    families.push(family);
  }
  if (families.length === 0) issues.push(issue("empty_pure_visual_system_families", "layout.families must permit at least one layout family", { path: "layout.families" }));
  return families;
}

function parseLayout(node, issues) {
  const map = exactMap(node, LAYOUT_KEYS, "layout", issues);
  const zonesMap = exactMap(map.get("zones"), ZONES_KEYS, "layout.zones", issues);
  const zones = {
    title: parseZone(zonesMap.get("title"), "title", issues),
    content: parseZone(zonesMap.get("content"), "content", issues),
  };
  const title = zones.title;
  const content = zones.content;
  if ([title.x, title.y, title.width, title.height, content.x, content.y, content.width, content.height].every((value) => typeof value === "number")) {
    const separated = title.x + title.width <= content.x || content.x + content.width <= title.x ||
      title.y + title.height <= content.y || content.y + content.height <= title.y;
    if (!separated) issues.push(issue("pure_visual_system_zone_overlap", "layout title and content zones must not overlap", { path: "layout.zones" }));
  }
  return {
    zones,
    whitespace: parseEnum(map.get("whitespace"), "layout.whitespace", WHITESPACE_DENSITIES, issues),
    families: parseFamilies(map.get("families"), issues),
  };
}

/** Parse one selected, content-neutral Pure presentation profile. */
export function parsePureDeckVisualProfile(raw, { source = "pure profile" } = {}) {
  let document;
  try {
    document = parseDocument(raw, {
      version: "1.2",
      schema: "core",
      uniqueKeys: true,
      merge: false,
      keepSourceTokens: true,
    });
  } catch (error) {
    throw new PureDeckVisualSystemError(issue("invalid_pure_visual_system_yaml", error.message, { source }));
  }
  const issues = [...document.errors, ...document.warnings]
    .map((error) => issue("invalid_pure_visual_system_yaml", error.message.split("\n")[0], { source }));
  const root = exactMap(document.contents, PROFILE_KEYS, "pure presentation profile", issues);
  const projection = {
    typography: parseTypography(root.get("typography"), issues),
    colour_use: parseColourUse(root.get("colour_use"), issues),
    layout: parseLayout(root.get("layout"), issues),
  };
  if (issues.length > 0) throw new PureDeckVisualSystemError(issues);
  return deepFreeze(projection);
}
