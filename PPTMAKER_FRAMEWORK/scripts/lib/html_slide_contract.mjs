import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Document,
  isAlias,
  isMap,
  isScalar,
  isSeq,
  parseAllDocuments,
  parseDocument,
} from "yaml";
import { parseSlideDocument, validateSlideDocument } from "./slide_document.mjs";
import { normalizeSpokenKey } from "./slide_ids.mjs";
import { canonicalJsonSha256 } from "./canonical_json.mjs";
import {
  HTML_FAMILY_GEOMETRY_ID,
  htmlFamilyGeometrySemanticSha256,
  loadHtmlFamilyGeometryRegistry,
} from "./html_family_geometry.mjs";
import {
  HTML_FONT_ROOT,
  buildFontInventory,
  parseUnicodeRanges,
  verifyHtmlFontBundle,
} from "./html_fonts.mjs";
import {
  assetEvidence,
  loadHtmlAssetCatalog,
  validateHtmlAssetBytes,
} from "./html_asset_catalog.mjs";
import {
  buildHtmlStyleReferenceProjectionV1,
  buildHtmlVisualProjectionV1,
  loadVisualConfigViews,
} from "../visual_config.mjs";
import {
  COLOR_PALETTE_FILE,
  deckRoot,
  styleAsset,
} from "../bundle_layout.mjs";

export const HTML_FIRST_PIPELINE = "html-first-v1";
export const HTML_SLIDE_PLAN_SCHEMA = "pptmaker-html-slide-plan-v1";
export const HTML_CONTRACT_VERSION = 1;
export const HTML_SOURCE_SCHEMA_VERSION = 1;
export const HTML_FAMILIES = Object.freeze([
  "hero", "split", "cards", "kpi", "comparison",
  "flow", "timeline", "data", "quote", "visual-focus",
]);

const FAMILY_SET = new Set(HTML_FAMILIES);
const SHA_RE = /^[0-9a-f]{64}$/;
const ASSET_ID_RE = /^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$/;
const TIMESTAMP_LIKE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:[Tt ][0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}(?::?[0-9]{2})?)?)?$/;
const PLACEHOLDER_RE = /^\s*(?:\([^)]*\)|\[[^\]]*\])\s*$/;
const FALLBACK_FAMILIES = Object.freeze({
  asset: new Set(["hero", "split", "quote", "visual-focus"]),
  "icon-composition": new Set(["split", "quote", "visual-focus"]),
  "abstract-pattern": new Set(["hero", "visual-focus"]),
});
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const FRAMEWORK_DIR = resolve(MODULE_DIR, "..", "..");

const FIELD_ORDERS = Object.freeze({
  text_block: ["heading", "body", "bullets"],
  card: ["label", "value", "body", "icon"],
  metric: ["value", "label", "detail"],
  step: ["label", "body", "icon"],
  quote_block: ["quote", "attribution", "context"],
  chart: ["kind", "categories", "series", "value_format", "legend"],
  data_series: ["name", "values"],
  value_format: ["kind", "decimals", "currency"],
  primary_visual: ["placement", "brief", "fit", "focal_point", "fallback", "selection"],
  fallback: ["kind", "asset_id", "asset_ids", "recipe"],
  selection: ["asset_id", "accepted_for", "output_sha256"],
});

const FAMILY_ROOT_ORDERS = Object.freeze({
  hero: ["hero_statement", "supporting_line"],
  split: ["mode", "left", "right", "text"],
  cards: ["cards"],
  kpi: ["metrics"],
  comparison: ["left", "right"],
  flow: ["steps"],
  timeline: ["steps"],
  data: ["chart", "insight"],
  quote: ["quote", "supporting"],
  "visual-focus": ["caption"],
});

export class HtmlSlideContractError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "HtmlSlideContractError";
    this.issues = issues;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function issue(code, message, { source, slideId = null, line = 1, field = null, actual, expected } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: { path: source || "slide-specifications.md", line, column: 1 },
    ...(slideId ? { subject: { kind: "slide", id: slideId, ...(field ? { field } : {}) } } : {}),
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function walkYaml(node, visitor, path = []) {
  if (!node) return;
  visitor(node, path);
  if (isMap(node)) {
    for (const pair of node.items) {
      walkYaml(pair.key, visitor, [...path, "<key>"]);
      const key = isScalar(pair.key) ? String(pair.key.value) : "<non-string>";
      walkYaml(pair.value, visitor, [...path, key]);
    }
  } else if (isSeq(node)) {
    node.items.forEach((item, index) => walkYaml(item, visitor, [...path, index]));
  }
}

function yamlAstIssues(document, source, baseLine, { commentsAllowed = false } = {}) {
  const issues = [...document.errors, ...document.warnings].map((problem) =>
    issue("invalid_yaml", problem.message.split("\n")[0], { source, line: baseLine })
  );
  if (!commentsAllowed && (document.comment || document.commentBefore)) {
    issues.push(issue("yaml_comment_forbidden", "YAML comments are forbidden at document scope", { source, line: baseLine, field: "$" }));
  }
  walkYaml(document.contents, (node, path) => {
    const field = path.filter((part) => part !== "<key>").join(".");
    if (isAlias(node)) issues.push(issue("yaml_alias_forbidden", `YAML alias is forbidden at ${field || "$"}`, { source, line: baseLine, field }));
    if (node?.anchor) issues.push(issue("yaml_anchor_forbidden", `YAML anchor is forbidden at ${field || "$"}`, { source, line: baseLine, field }));
    if (node?.tag) issues.push(issue("yaml_explicit_tag_forbidden", `explicit YAML tag is forbidden at ${field || "$"}`, { source, line: baseLine, field }));
    if (!commentsAllowed && (node?.comment || node?.commentBefore)) {
      issues.push(issue("yaml_comment_forbidden", `YAML comments are forbidden at ${field || "$"}`, { source, line: baseLine, field }));
    }
    if (isScalar(node) && node.type === "PLAIN" && typeof node.value === "string" && TIMESTAMP_LIKE_RE.test(node.value)) {
      issues.push(issue("timestamp_like_scalar_requires_quotes", `timestamp-like scalar must be quoted at ${field || "$"}`, { source, line: baseLine, field }));
    }
  });
  return issues;
}

function parseLeadingFrontmatter(sourceText, source) {
  const text = String(sourceText ?? "");
  const bom = text.startsWith("\uFEFF") ? "\uFEFF" : "";
  const body = text.slice(bom.length);
  if (!body.startsWith("---\n") && !body.startsWith("---\r\n")) {
    return { present: false, metadata: {}, document: null, issues: [], raw: "" };
  }
  const newline = body.startsWith("---\r\n") ? "\r\n" : "\n";
  const close = body.indexOf(`${newline}---${newline}`, 3 + newline.length);
  const terminalClose = body.endsWith(`${newline}---`) ? body.length - (newline.length + 3) : -1;
  const closing = close >= 0 ? close + newline.length : terminalClose;
  if (closing < 0) {
    return { present: true, metadata: {}, document: null, raw: "", issues: [issue("unclosed_frontmatter", "leading YAML frontmatter is not closed", { source })] };
  }
  const contentStart = 3 + newline.length;
  const content = body.slice(contentStart, closing);
  const document = parseDocument(content, {
    version: "1.2",
    schema: "core",
    uniqueKeys: true,
    merge: false,
    keepSourceTokens: true,
  });
  const issues = [...document.errors, ...document.warnings].map((problem) =>
    issue("invalid_frontmatter_yaml", problem.message.split("\n")[0], { source, line: 2 })
  );
  let metadata = {};
  if (issues.length === 0) {
    metadata = document.toJS({ mapAsMap: false }) ?? {};
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      issues.push(issue("invalid_frontmatter_root", "frontmatter root must be a mapping", { source }));
      metadata = {};
    }
  }
  return {
    present: true,
    metadata,
    document,
    issues,
    raw: body.slice(0, closing + 3 + (close >= 0 ? newline.length : 0)),
  };
}

function directProductionNodeIssues(frontmatter, source) {
  const issues = [];
  if (!frontmatter.document || frontmatter.issues.length > 0) return issues;
  const root = frontmatter.document.contents;
  if (!isMap(root)) return issues;
  const pairs = root.items.filter((pair) => isScalar(pair.key) && pair.key.value === "production");
  if (pairs.length !== 1) {
    if (Object.hasOwn(frontmatter.metadata || {}, "production")) {
      issues.push(issue("invalid_production_marker", "production must be one direct string-keyed mapping", { source }));
    }
    return issues;
  }
  if (pairs[0].key.anchor || pairs[0].key.tag) {
    issues.push(issue("invalid_production_key", "production must use a direct untagged string key", { source }));
  }
  const production = pairs[0].value;
  if (!isMap(production) || production.anchor || production.tag) {
    issues.push(issue("invalid_production_marker", "production must be a direct mapping", { source }));
    return issues;
  }
  for (const pair of production.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string" || pair.key.anchor || pair.key.tag) {
      issues.push(issue("invalid_production_key", "production keys must be direct strings", { source }));
    } else if (pair.key.value !== "pipeline") {
      issues.push(issue("unknown_production_key", `unknown production key ${JSON.stringify(pair.key.value)}`, { source }));
    }
  }
  const pipelinePairs = production.items.filter((pair) => isScalar(pair.key) && pair.key.value === "pipeline");
  if (
    pipelinePairs.length !== 1
    || !isScalar(pipelinePairs[0].value)
    || typeof pipelinePairs[0].value.value !== "string"
    || pipelinePairs[0].value.anchor
    || pipelinePairs[0].value.tag
  ) {
    issues.push(issue("invalid_pipeline_marker", "production.pipeline must be one direct string scalar", { source }));
  }
  return issues;
}

export function probeProductionMarker(sourceBytes, { source = "slide-specifications.md" } = {}) {
  const text = Buffer.isBuffer(sourceBytes) ? sourceBytes.toString("utf8") : String(sourceBytes ?? "");
  const frontmatter = parseLeadingFrontmatter(text, source);
  if (frontmatter.issues.length > 0) return { branch: "invalid", issues: frontmatter.issues };
  const directIssues = directProductionNodeIssues(frontmatter, source);
  if (directIssues.length > 0) return { branch: "invalid", issues: directIssues };
  if (!Object.hasOwn(frontmatter.metadata, "production")) return { branch: "legacy", issues: [] };
  const production = frontmatter.metadata.production;
  if (!production || typeof production !== "object" || Array.isArray(production)) {
    return { branch: "invalid", issues: [issue("invalid_production_marker", "production must be a mapping", { source })] };
  }
  if (production.pipeline !== HTML_FIRST_PIPELINE) {
    return {
      branch: "invalid",
      issues: [issue("unsupported_pipeline_marker", `production.pipeline must equal ${HTML_FIRST_PIPELINE}`, { source, actual: production.pipeline, expected: HTML_FIRST_PIPELINE })],
    };
  }
  return { branch: HTML_FIRST_PIPELINE, issues: [], frontmatter };
}

function absoluteLine(text, offset) {
  return text.slice(0, offset).split(/\r\n|\n/).length;
}

function findStructuredBody(document, block) {
  if (Array.isArray(block.structured_body_fields)) {
    return block.structured_body_fields.map((field) => ({
      raw: field.raw,
      yaml: field.yaml,
      start: field.range.start,
      end: field.range.end,
      yaml_start: field.yaml_range.start,
      yaml_end: field.yaml_range.end,
      line: field.range.start_line,
      yaml_line: field.yaml_range.start_line,
    }));
  }
  const matches = [];
  const re = /^\*\*SLIDE BODY\*\*:\r?\n```yaml\r?\n([\s\S]*?)^```(?:\r?\n|$)/gm;
  let match;
  while ((match = re.exec(block.body)) !== null) {
    const fullStart = block.body_range.start + match.index;
    const contentOffset = match[0].indexOf(match[1]);
    matches.push({
      raw: match[0],
      yaml: match[1],
      start: fullStart,
      end: fullStart + match[0].length,
      yaml_start: fullStart + contentOffset,
      yaml_end: fullStart + contentOffset + match[1].length,
      line: absoluteLine(document.source_text, fullStart),
      yaml_line: absoluteLine(document.source_text, fullStart + contentOffset),
    });
  }
  return matches;
}

function parseClosedYaml(yaml, { source, line, slideId }) {
  if (/^(?:%|---(?:[ \t]|$)|\.\.\.(?:[ \t]|$))/m.test(yaml)) {
    throw new HtmlSlideContractError("YAML directives/document markers are forbidden", [
      issue("yaml_document_marker_forbidden", "YAML directives and document markers are forbidden", { source, line, slideId }),
    ]);
  }
  const documents = parseAllDocuments(yaml, {
    version: "1.2",
    schema: "core",
    uniqueKeys: true,
    merge: false,
    keepSourceTokens: true,
  });
  if (documents.length !== 1) {
    throw new HtmlSlideContractError("structured body must contain one YAML document", [
      issue("multiple_yaml_documents", "structured body must contain exactly one YAML document", { source, line, slideId, actual: documents.length, expected: 1 }),
    ]);
  }
  const document = documents[0];
  const issues = yamlAstIssues(document, source, line).map((entry) => ({ ...entry, subject: { kind: "slide", id: slideId } }));
  if (!isMap(document.contents)) issues.push(issue("structured_body_root_not_mapping", "SLIDE BODY YAML root must be a mapping", { source, line, slideId }));
  if (issues.length > 0) throw new HtmlSlideContractError("invalid structured body YAML", issues);
  const value = document.toJS({ mapAsMap: false });
  assertJsonLike(value, "$", source, line, slideId);
  return { document, value };
}

function assertJsonLike(value, path, source, line, slideId) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new HtmlSlideContractError("non-finite number", [issue("non_finite_number", `${path} must be finite`, { source, line, slideId, field: path })]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonLike(item, `${path}[${index}]`, source, line, slideId));
    return;
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, item] of Object.entries(value)) assertJsonLike(item, `${path}.${key}`, source, line, slideId);
    return;
  }
  throw new HtmlSlideContractError("non-JSON YAML value", [issue("non_json_yaml_value", `${path} is not a JSON-like YAML value`, { source, line, slideId, field: path })]);
}

function mapping(value, path, issues, context, { exact = null, required = [] } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(issue("invalid_mapping", `${path} must be a mapping`, { ...context, field: path }));
    return {};
  }
  if (exact) for (const key of Object.keys(value)) if (!exact.includes(key)) {
    issues.push(issue("unknown_field", `unknown field ${path}.${key}`, { ...context, field: `${path}.${key}` }));
  }
  for (const key of required) if (!Object.hasOwn(value, key)) {
    issues.push(issue("missing_field", `missing required field ${path}.${key}`, { ...context, field: `${path}.${key}` }));
  }
  return value;
}

function text(value, path, issues, context, { max = null, singleLine = true, required = true } = {}) {
  if (value == null && !required) return null;
  if (typeof value !== "string" || !value.trim()) {
    issues.push(issue("invalid_text", `${path} must be a non-empty string`, { ...context, field: path }));
    return "";
  }
  if (singleLine && /[\r\n]/.test(value)) issues.push(issue("line_break_forbidden", `${path} must be single-line`, { ...context, field: path }));
  const measured = visibleGraphemes(value);
  if (max != null && measured > max) issues.push(issue("capacity_exceeded", `${path} exceeds ${max} graphemes`, { ...context, field: path, actual: measured, expected: max }));
  return value;
}

function finiteNumber(value, path, issues, context, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < min || value > max) {
    issues.push(issue("invalid_number", `${path} must be ${integer ? "an integer" : "a finite number"} in [${min},${max}]`, { ...context, field: path }));
  }
  return value;
}

function array(value, path, issues, context, { min = 0, max = Infinity } = {}) {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", `${path} must be an array`, { ...context, field: path }));
    return [];
  }
  if (value.length < min || value.length > max) issues.push(issue("collection_capacity", `${path} must contain ${min}-${max} items`, { ...context, field: path, actual: value.length }));
  return value;
}

export function graphemes(value) {
  return [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(String(value))].length;
}

function visibleGraphemes(value) {
  return [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(String(value))]
    .filter((entry) => entry.segment !== "\n").length;
}

function addCheck(checks, path, unit, measured, minimum = null, maximum = null) {
  checks.push({ path, unit, measured, minimum, maximum });
}

function addStringCheck(checks, path, value, max, { lines = 1 } = {}) {
  if (value == null) return;
  addCheck(checks, path, "graphemes", visibleGraphemes(value), 1, max);
  addCheck(checks, path, "lines", String(value).split("\n").length, 1, lines);
}

function addTextBlockChecks(checks, path, block, limits = {}) {
  if (!block) return;
  addStringCheck(checks, `${path}.heading`, block.heading, limits.heading ?? 40);
  addStringCheck(checks, `${path}.body`, block.body, limits.body ?? 120, { lines: limits.bodyLines ?? 6 });
  if (block.bullets) {
    addCheck(checks, `${path}.bullets`, "items", block.bullets.length, limits.bulletsMin ?? 2, limits.bulletsMax ?? 5);
    block.bullets.forEach((value, index) => addStringCheck(checks, `${path}.bullets[${index}]`, value, limits.bullet ?? 40));
  }
}

function sourceCapacityEvidence(slide) {
  const checks = [];
  addStringCheck(checks, "header.kicker", slide.header.kicker, 40);
  addStringCheck(checks, "header.title", slide.header.title, 60);
  addStringCheck(checks, "header.subtitle", slide.header.subtitle, 50);
  const body = slide.source_body;
  addStringCheck(checks, "callout", body.callout, 80);
  switch (body.family) {
    case "hero":
      addStringCheck(checks, "body.hero_statement", body.hero_statement, 120, { lines: 2 });
      addStringCheck(checks, "body.supporting_line", body.supporting_line, 160);
      break;
    case "split":
      for (const key of ["left", "right", "text"]) addTextBlockChecks(checks, `body.${key}`, body[key], { bulletsMax: 4 });
      break;
    case "cards":
      addCheck(checks, "body.cards", "items", body.cards.length, 2, 4);
      body.cards.forEach((card, index) => {
        addStringCheck(checks, `body.cards[${index}].label`, card.label, 20);
        addStringCheck(checks, `body.cards[${index}].value`, card.value, 24);
        addStringCheck(checks, `body.cards[${index}].body`, card.body, 40);
      });
      break;
    case "kpi":
      addCheck(checks, "body.metrics", "items", body.metrics.length, 1, 3);
      body.metrics.forEach((metric, index) => {
        addStringCheck(checks, `body.metrics[${index}].value`, metric.value, 12);
        addStringCheck(checks, `body.metrics[${index}].label`, metric.label, 20);
        addStringCheck(checks, `body.metrics[${index}].detail`, metric.detail, 30);
      });
      break;
    case "comparison":
      addTextBlockChecks(checks, "body.left", body.left, { bodyLines: 1, bulletsMin: 2, bulletsMax: 5, bullet: 20 });
      addTextBlockChecks(checks, "body.right", body.right, { bodyLines: 1, bulletsMin: 2, bulletsMax: 5, bullet: 20 });
      break;
    case "flow":
    case "timeline":
      addCheck(checks, "body.steps", "items", body.steps.length, 3, 5);
      body.steps.forEach((step, index) => {
        addStringCheck(checks, `body.steps[${index}].label`, step.label, 20);
        addStringCheck(checks, `body.steps[${index}].body`, step.body, 40);
      });
      break;
    case "data":
      addCheck(checks, "body.chart.categories", "items", body.chart.categories.length, 1, 12);
      addCheck(checks, "body.chart.categories", "graphemes_total", body.chart.categories.reduce((sum, value) => sum + graphemes(value), 0), 1, 120);
      body.chart.categories.forEach((value, index) => addStringCheck(checks, `body.chart.categories[${index}]`, value, 20));
      addCheck(checks, "body.chart.series", "items", body.chart.series.length, 1, 4);
      addCheck(checks, "body.chart.series", "graphemes_total", body.chart.series.reduce((sum, item) => sum + graphemes(item.name), 0), 1, 80);
      body.chart.series.forEach((series, index) => addStringCheck(checks, `body.chart.series[${index}].name`, series.name, 30));
      addTextBlockChecks(checks, "body.insight", body.insight, { heading: 30, body: 100, bodyLines: 1, bulletsMax: 4, bullet: 14 });
      break;
    case "quote": {
      const compact = body.quote.attribution != null || body.quote.context != null;
      addStringCheck(checks, "body.quote.quote", body.quote.quote, compact ? 60 : 90, { lines: 4 });
      addStringCheck(checks, "body.quote.attribution", body.quote.attribution, 20);
      addStringCheck(checks, "body.quote.context", body.quote.context, 20);
      addCheck(
        checks,
        "body.quote",
        "graphemes_total",
        [body.quote.quote, body.quote.attribution, body.quote.context]
          .filter((value) => value != null)
          .reduce((sum, value) => sum + visibleGraphemes(value), 0),
        1,
        90
      );
      addTextBlockChecks(checks, "body.supporting", body.supporting, { heading: 30, body: 60, bodyLines: 1, bulletsMin: 2, bulletsMax: 2, bullet: 16 });
      break;
    }
    case "visual-focus":
      addTextBlockChecks(checks, "body.caption", body.caption, { heading: 40, body: 100, bodyLines: 1, bulletsMax: 3, bullet: 30 });
      break;
    default:
      break;
  }
  return {
    status: "passed",
    checks: checks.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : left.unit < right.unit ? -1 : left.unit > right.unit ? 1 : 0),
  };
}

function visibleStrings(slide) {
  const output = [];
  const add = (path, value) => { if (typeof value === "string") output.push({ path, value }); };
  for (const key of ["kicker", "title", "subtitle"]) add(`header.${key}`, slide.header[key]);
  const body = slide.source_body;
  add("callout", body.callout);
  const addTextBlock = (path, block) => {
    if (!block) return;
    add(`${path}.heading`, block.heading);
    add(`${path}.body`, block.body);
    (block.bullets || []).forEach((value, index) => add(`${path}.bullets[${index}]`, value));
  };
  switch (body.family) {
    case "hero":
      add("body.hero_statement", body.hero_statement);
      add("body.supporting_line", body.supporting_line);
      break;
    case "split":
      addTextBlock("body.left", body.left); addTextBlock("body.right", body.right); addTextBlock("body.text", body.text);
      break;
    case "cards":
      body.cards.forEach((card, index) => { add(`body.cards[${index}].label`, card.label); add(`body.cards[${index}].value`, card.value); add(`body.cards[${index}].body`, card.body); });
      break;
    case "kpi":
      body.metrics.forEach((metric, index) => { add(`body.metrics[${index}].value`, metric.value); add(`body.metrics[${index}].label`, metric.label); add(`body.metrics[${index}].detail`, metric.detail); });
      break;
    case "comparison":
      addTextBlock("body.left", body.left); addTextBlock("body.right", body.right);
      break;
    case "flow":
    case "timeline":
      body.steps.forEach((step, index) => { add(`body.steps[${index}].label`, step.label); add(`body.steps[${index}].body`, step.body); });
      break;
    case "data":
      body.chart.categories.forEach((value, index) => add(`body.chart.categories[${index}]`, value));
      body.chart.series.forEach((series, index) => add(`body.chart.series[${index}].name`, series.name));
      addTextBlock("body.insight", body.insight);
      break;
    case "quote":
      add("body.quote.quote", body.quote.quote); add("body.quote.attribution", body.quote.attribution); add("body.quote.context", body.quote.context);
      addTextBlock("body.supporting", body.supporting);
      break;
    case "visual-focus":
      addTextBlock("body.caption", body.caption);
      break;
    default:
      break;
  }
  return output;
}

function assertVisibleScalarSequence(entries, ranges, context) {
  const issues = [];
  let checkedScalarCount = 0;
  const unique = new Set();
  for (const entry of entries) {
    const value = entry.value;
    for (let index = 0; index < value.length; index += 1) {
      const unit = value.charCodeAt(index);
      if (unit >= 0xd800 && unit <= 0xdbff) {
        const next = value.charCodeAt(index + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff)) {
          issues.push(issue("unpaired_surrogate", `${entry.path} contains an unpaired high surrogate`, { ...context, field: entry.path }));
          continue;
        }
        index += 1;
      } else if (unit >= 0xdc00 && unit <= 0xdfff) {
        issues.push(issue("unpaired_surrogate", `${entry.path} contains an unpaired low surrogate`, { ...context, field: entry.path }));
        continue;
      }
    }
    for (const character of value) {
      const point = character.codePointAt(0);
      if (point === 0x0a) continue;
      if (point === 0x09 || point === 0x0d || point < 0x20 || [0x85, 0x2028, 0x2029].includes(point)) {
        issues.push(issue("forbidden_visible_control", `${entry.path} contains forbidden U+${point.toString(16).toUpperCase().padStart(4, "0")}`, { ...context, field: entry.path }));
        continue;
      }
      checkedScalarCount += 1;
      unique.add(point);
      if (!ranges.some((range) => point >= range.start && point <= range.end)) {
        issues.push(issue("font_range_unsupported", `${entry.path} contains unsupported U+${point.toString(16).toUpperCase().padStart(4, "0")}`, { ...context, field: entry.path, actual: point }));
      }
    }
  }
  return { issues, checkedScalarCount, uniqueCodePoints: [...unique].sort((a, b) => a - b) };
}

export function buildHtmlSourcePreflight(slides, { fontRoot = HTML_FONT_ROOT } = {}) {
  const verified = verifyHtmlFontBundle({ root: fontRoot });
  if (!verified.ok) throw new HtmlSlideContractError("bundled font authority is invalid", [issue("invalid_font_authority", verified.error || "font bundle validation failed")]);
  const inventory = buildFontInventory({ root: fontRoot });
  const ranges = inventory.files.flatMap((file) => file.unicodeRanges.flatMap((value) => parseUnicodeRanges(value)));
  const inventoryPath = join(fontRoot, "inventory.json");
  const inventorySha256 = sha256(readFileSync(inventoryPath));
  const results = [];
  const issues = [];
  for (const slide of slides) {
    const context = { source: slide.block?.source || "slide-specifications.md", slideId: slide.block.slide_id, line: slide.block.heading_range.start_line };
    const sourceCapacity = sourceCapacityEvidence(slide);
    for (const check of sourceCapacity.checks) {
      const below = check.minimum != null && check.measured < check.minimum;
      const above = check.maximum != null && check.measured > check.maximum;
      if (below || above) {
        issues.push(issue("capacity_exceeded", `${check.path} measured ${check.measured} ${check.unit}; expected ${check.minimum ?? 0}..${check.maximum ?? "unbounded"}`, {
          ...context,
          field: check.path,
          actual: check.measured,
          expected: { minimum: check.minimum, maximum: check.maximum, unit: check.unit },
        }));
      }
    }
    const coverage = assertVisibleScalarSequence(visibleStrings(slide), ranges, context);
    issues.push(...coverage.issues);
    results.push({
      slide_id: slide.block.slide_id,
      source_capacity: sourceCapacity,
      font_ranges: {
        status: "passed",
        profile: "source-scalar-ranges-v1",
        inventory_sha256: inventorySha256,
        checked_scalar_count: coverage.checkedScalarCount,
        unique_code_points: coverage.uniqueCodePoints,
      },
    });
  }
  if (issues.length > 0) throw new HtmlSlideContractError("visible source preflight failed", issues);
  return { inventory, inventory_path: inventoryPath, inventory_sha256: inventorySha256, results };
}

function bodyProjection(sourceBody) {
  return Object.fromEntries(Object.entries(sourceBody).filter(([key]) => !["schema_version", "family", "callout", "primary_visual"].includes(key)));
}

export function resolveHtmlChartLegend(legend, seriesCount) {
  return legend === "auto" ? (seriesCount > 1 ? "show" : "hide") : legend;
}

export function formatHtmlChartValue(value, valueFormat) {
  const decimals = valueFormat.decimals;
  const normalizeZero = (number) => Object.is(number, -0) ? 0 : number;
  const fixed = (number) => normalizeZero(number).toFixed(decimals);
  if (valueFormat.kind === "percent") return `${fixed(normalizeZero(value * 100))}%`;
  if (valueFormat.kind === "currency") return `${valueFormat.currency} ${fixed(value)}`;
  if (valueFormat.kind === "compact") {
    const absolute = Math.abs(value);
    const thresholds = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    const threshold = thresholds.find(([minimum]) => absolute >= minimum);
    return threshold ? `${fixed(value / threshold[0])}${threshold[1]}` : fixed(value);
  }
  return fixed(value);
}

function rendererBodyProjection(sourceBody) {
  const body = bodyProjection(sourceBody);
  if (sourceBody.family === "data" && body.chart) {
    body.chart = {
      ...body.chart,
      legend: resolveHtmlChartLegend(body.chart.legend, body.chart.series.length),
    };
  }
  return body;
}

export function semanticContentFingerprint(slide) {
  return canonicalJsonSha256({
    semantic_content_projection_version: 1,
    contract_version: 1,
    source_schema_version: 1,
    slide_id: slide.block.slide_id,
    header: slide.header,
    family: slide.source_body.family,
    body: bodyProjection(slide.source_body),
    callout: slide.source_body.callout ?? null,
  });
}

export function styleReferenceContractFingerprint(config) {
  return canonicalJsonSha256({
    style_reference_projection_version: 1,
    visual_config_schema_version: 1,
    ...buildHtmlStyleReferenceProjectionV1(config),
  });
}

export function visualContractFingerprint(slide, config, registrySha256) {
  return canonicalJsonSha256({
    visual_contract_projection_version: 1,
    contract_version: 1,
    visual_config_schema_version: 1,
    slide_id: slide.block.slide_id,
    primary_visual: slide.source_body.primary_visual ? {
      placement: slide.source_body.primary_visual.placement,
      brief: slide.source_body.primary_visual.brief,
      fit: slide.source_body.primary_visual.fit,
      focal_point: slide.source_body.primary_visual.focal_point,
    } : null,
    family: slide.source_body.family,
    geometry: { variant: slide.variant, record: slide.geometry },
    concept: slide.concept,
    visual_projection_v1: buildHtmlVisualProjectionV1(config, { registrySha256, record: slide.geometry }),
  });
}

function requireCatalogEntry(catalog, assetId, context) {
  const entry = catalog[assetId];
  if (!entry) throw new HtmlSlideContractError(`asset ${assetId} is not registered`, [issue("asset_not_registered", `asset ${assetId} is not registered`, { ...context, field: "asset_id" })]);
  return entry;
}

function iconCompositionLayout(primaryBox, entries, config) {
  const [x, y, width, height] = primaryBox;
  const { inset_ratio: ratio, gap, max_cell_ratio: maxCellRatio } = config.components.icon_composition;
  const inner = [x + width * ratio, y + height * ratio, width * (1 - 2 * ratio), height * (1 - 2 * ratio)];
  const cellWidth = (inner[2] - gap * (entries.length - 1)) / entries.length;
  const side = Math.min(cellWidth, inner[3]) * maxCellRatio;
  return {
    inner_box: inner,
    items: entries.map(({ assetId }, index) => ({
      asset_id: assetId,
      box: [inner[0] + index * (cellWidth + gap) + (cellWidth - side) / 2, inner[1] + (inner[3] - side) / 2, side, side],
    })),
  };
}

export function resolvePrimaryVisual(slide, catalog, config, visualFingerprint) {
  const visual = slide.source_body.primary_visual;
  if (!visual) return null;
  const context = { source: slide.block.source, slideId: slide.block.slide_id, line: slide.block.heading_range.start_line };
  let fallback;
  if (visual.fallback.kind === "asset") {
    const entry = requireCatalogEntry(catalog, visual.fallback.asset_id, context);
    fallback = { kind: "asset", asset: assetEvidence(entry, visual.fallback.asset_id) };
  } else if (visual.fallback.kind === "abstract-pattern") {
    fallback = { kind: "abstract-pattern", recipe: visual.fallback.recipe };
  } else {
    const entries = visual.fallback.asset_ids.map((assetId) => {
      const entry = requireCatalogEntry(catalog, assetId, context);
      if (entry.type !== "svg") throw new HtmlSlideContractError(`icon asset ${assetId} must be SVG`, [issue("icon_asset_type", `icon asset ${assetId} must be SVG`, { ...context, field: "primary_visual.fallback.asset_ids" })]);
      validateHtmlAssetBytes(readFileSync(entry.absolute_path), { assetId, type: "svg", iconContext: true });
      return { assetId, entry };
    });
    const primaryBox = slide.geometry.boxes.primary_visual;
    fallback = {
      kind: "icon-composition",
      assets: entries.map(({ assetId, entry }) => assetEvidence(entry, assetId)),
      layout: iconCompositionLayout(primaryBox, entries, config),
    };
  }
  if (visual.selection === null) return { state: "fallback", effective: "fallback", fallback, selected: null };
  const selectedEntry = requireCatalogEntry(catalog, visual.selection.asset_id, context);
  if (selectedEntry.measured_sha256 !== visual.selection.output_sha256) {
    throw new HtmlSlideContractError("selected asset output SHA differs from catalog bytes", [issue("selection_sha_mismatch", "selection.output_sha256 differs from measured asset bytes", { ...context, field: "primary_visual.selection.output_sha256", actual: visual.selection.output_sha256, expected: selectedEntry.measured_sha256 })]);
  }
  const current = visual.selection.accepted_for === visualFingerprint;
  return {
    state: current ? "selected" : "stale",
    effective: current ? "selected" : "fallback",
    fallback,
    selected: {
      asset: assetEvidence(selectedEntry, visual.selection.asset_id),
      accepted_for: visual.selection.accepted_for,
      output_sha256: visual.selection.output_sha256,
      applicability: current ? "current" : "stale",
    },
  };
}

function publicCatalog(catalog) {
  return Object.fromEntries(Object.entries(catalog).map(([assetId, entry]) => [assetId, {
    origin: entry.origin,
    manifest_path: entry.manifest_path,
    path: entry.path,
    type: entry.type,
    label: entry.label,
    description: entry.description,
    usage_guidance: entry.usage_guidance,
    media: entry.media,
    declared_sha256: entry.declared_sha256,
    measured_sha256: entry.measured_sha256,
  }]));
}

export function orderedPlanDigest({ identity = null, theme, styleReferenceFingerprint, referencedCatalog, slides }) {
  return canonicalJsonSha256({
    ordered_plan_projection_version: 1,
    plan_schema: HTML_SLIDE_PLAN_SCHEMA,
    contract_version: HTML_CONTRACT_VERSION,
    source_schema_version: HTML_SOURCE_SCHEMA_VERSION,
    visual_config_schema_version: 1,
    production: { pipeline: HTML_FIRST_PIPELINE },
    identity,
    theme,
    style_reference_contract_fingerprint: styleReferenceFingerprint,
    referenced_catalog: referencedCatalog,
    slides: slides.map(({ source, ...slide }) => slide),
  });
}

function referencedAssetIds(slide) {
  const ids = new Set();
  const scan = (value, key = null) => {
    if (key === "icon" && typeof value === "string") ids.add(value);
    else if (Array.isArray(value)) value.forEach((item) => scan(item));
    else if (value && typeof value === "object") for (const [childKey, item] of Object.entries(value)) scan(item, childKey);
  };
  scan(bodyProjection(slide.source_body));
  const visual = slide.source_body.primary_visual;
  if (visual?.fallback?.asset_id) ids.add(visual.fallback.asset_id);
  for (const id of visual?.fallback?.asset_ids || []) ids.add(id);
  if (visual?.selection?.asset_id) ids.add(visual.selection.asset_id);
  return [...ids].sort();
}

function inlineIconIds(slide) {
  const ids = new Set();
  const scan = (value, key = null) => {
    if (key === "icon" && typeof value === "string") ids.add(value);
    else if (Array.isArray(value)) value.forEach((item) => scan(item));
    else if (value && typeof value === "object") for (const [childKey, item] of Object.entries(value)) scan(item, childKey);
  };
  scan(bodyProjection(slide.source_body));
  return [...ids];
}

function receipt(scope, path, bytes) {
  return { scope, path, sha256: sha256(bytes) };
}

function fontReceiptPaths(preflight) {
  const inventory = preflight.inventory;
  return [
    "inventory.json",
    ...inventory.css.map((entry) => entry.path),
    ...inventory.files.map((entry) => entry.path),
    inventory.legal.copyrightPath,
    inventory.legal.provenancePath,
    ...inventory.legal.licensePaths,
    inventory.sentinelPath,
  ];
}

function buildReceipts({ runDir, sourcePath, palettePath, assetCatalog, preflight }) {
  const root = deckRoot(runDir);
  const records = [
    receipt("run", relative(root, sourcePath).split(sep).join("/"), readFileSync(sourcePath)),
    receipt("run", relative(root, palettePath).split(sep).join("/"), readFileSync(palettePath)),
    receipt("framework", relative(FRAMEWORK_DIR, resolve(MODULE_DIR, "..", "contracts", "html-family-geometry-v1.json")).split(sep).join("/"), readFileSync(resolve(MODULE_DIR, "..", "contracts", "html-family-geometry-v1.json"))),
  ];
  for (const manifest of assetCatalog.manifests) records.push(receipt("run", relative(root, manifest.path).split(sep).join("/"), Buffer.from(manifest.raw, "utf8")));
  for (const entry of Object.values(assetCatalog.catalog)) records.push(receipt("run", relative(root, entry.absolute_path).split(sep).join("/"), readFileSync(entry.absolute_path)));
  for (const path of fontReceiptPaths(preflight)) {
    records.push(receipt("framework", `scripts/fonts/${path}`, readFileSync(join(HTML_FONT_ROOT, ...path.split("/")))));
  }
  records.sort((left, right) => left.scope < right.scope ? -1 : left.scope > right.scope ? 1 : left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const seen = new Set();
  for (const record of records) {
    const key = `${record.scope}\0${record.path}`;
    if (seen.has(key)) throw new HtmlSlideContractError("duplicate input receipt", [issue("duplicate_input_receipt", `duplicate input receipt ${record.scope}:${record.path}`)]);
    seen.add(key);
  }
  return records;
}

export function verifyInputReceipts(receipts, { runDir, assetCatalog = null } = {}) {
  const root = deckRoot(runDir);
  const seen = new Set();
  let previousKey = null;
  for (const record of receipts) {
    const pairKey = `${record?.scope}\0${record?.path}`;
    if (!["run", "framework"].includes(record?.scope) || typeof record?.path !== "string" || !record.path || record.path.includes("\\") || record.path.startsWith("/") || record.path.split("/").some((part) => !part || part === "." || part === "..") || !SHA_RE.test(record?.sha256 || "")) {
      throw new HtmlSlideContractError("invalid input receipt", [issue("invalid_input_receipt", "input receipt must use a safe scope/path and lowercase SHA-256")]);
    }
    if (seen.has(pairKey)) throw new HtmlSlideContractError("duplicate input receipt", [issue("duplicate_input_receipt", `duplicate input receipt ${record.scope}:${record.path}`)]);
    if (previousKey != null && pairKey < previousKey) throw new HtmlSlideContractError("unsorted input receipts", [issue("unsorted_input_receipts", "input receipts must be sorted by scope/path in code-unit order")]);
    seen.add(pairKey);
    previousKey = pairKey;
    const absolute = record.scope === "run" ? resolve(root, ...record.path.split("/")) : resolve(FRAMEWORK_DIR, ...record.path.split("/"));
    if (sha256(readFileSync(absolute)) !== record.sha256) throw new HtmlSlideContractError("input receipt drifted", [issue("input_receipt_drift", `input changed before publication: ${record.scope}:${record.path}`)]);
  }
  if (assetCatalog) {
    const reloaded = loadHtmlAssetCatalog(runDir);
    const expected = Object.fromEntries(Object.entries(assetCatalog.catalog).map(([id, entry]) => [id, {
      origin: entry.origin,
      manifest_path: entry.manifest_path,
      path: entry.path,
      type: entry.type,
      media: entry.media,
      declared_sha256: entry.declared_sha256,
      measured_sha256: entry.measured_sha256,
    }]));
    const actual = Object.fromEntries(Object.entries(reloaded.catalog).map(([id, entry]) => [id, {
      origin: entry.origin,
      manifest_path: entry.manifest_path,
      path: entry.path,
      type: entry.type,
      media: entry.media,
      declared_sha256: entry.declared_sha256,
      measured_sha256: entry.measured_sha256,
    }]));
    if (canonicalJsonSha256(actual) !== canonicalJsonSha256(expected)) {
      throw new HtmlSlideContractError("asset catalog drifted", [issue("input_receipt_drift", "asset catalog confinement or evidence changed before publication")]);
    }
  }
  return true;
}

export function buildHtmlFirstPlan(validated) {
  const { parsed, config, assetCatalog, preflight, receipts, geometryRegistrySha256 } = validated;
  const styleFingerprint = styleReferenceContractFingerprint(config);
  const preflightById = new Map(preflight.results.map((entry) => [entry.slide_id, entry]));
  const referenced = new Set();
  const slides = parsed.slides.map((slide) => {
    const context = { source: parsed.document.source, slideId: slide.block.slide_id, line: slide.block.heading_range.start_line };
    inlineIconIds(slide).forEach((id) => {
      const entry = requireCatalogEntry(assetCatalog.catalog, id, context);
      if (entry.type !== "svg") throw new HtmlSlideContractError(`inline icon ${id} must be SVG`, [issue("icon_asset_type", `inline icon ${id} must be SVG`, { ...context, field: "body.icon" })]);
      validateHtmlAssetBytes(readFileSync(entry.absolute_path), { assetId: id, type: "svg", iconContext: true });
    });
    const semantic = semanticContentFingerprint(slide);
    const visual = visualContractFingerprint(slide, config, geometryRegistrySha256);
    const resolution = resolvePrimaryVisual(slide, assetCatalog.catalog, config, visual);
    referencedAssetIds(slide).forEach((id) => referenced.add(id));
    const passed = preflightById.get(slide.block.slide_id);
    const orderedSourceBody = orderStructuredBody(slide.source_body);
    return {
      slide_id: slide.block.slide_id,
      spoken_key: normalizeSpokenKey(slide.block.slide_id),
      position: slide.block.position,
      header: slide.header,
      visual_type: slide.visual_type,
      concept: slide.concept,
      family: slide.source_body.family,
      body: rendererBodyProjection(orderedSourceBody),
      callout: orderedSourceBody.callout ?? null,
      primary_visual: orderedSourceBody.primary_visual ?? null,
      geometry: { variant: slide.variant, boxes: slide.geometry.boxes, overlays: slide.geometry.overlays },
      preflight: { source_capacity: passed.source_capacity, font_ranges: passed.font_ranges },
      semantic_content_fingerprint: semantic,
      visual_contract_fingerprint: visual,
      visual_resolution: resolution,
      source: {
        path: parsed.document.source,
        slide_line: slide.block.heading_range.start_line,
        body_line: slide.structured_range.yaml_line,
      },
    };
  });
  const theme = {
    ...config,
    geometry: { registry: config.geometry.registry, registry_sha256: geometryRegistrySha256 },
    font_profile: {
      inventory_schema: preflight.inventory.schema,
      inventory_sha256: preflight.inventory_sha256,
      families: ["Source Sans 3", "Noto Sans SC"],
    },
  };
  const referencedCatalog = Object.fromEntries([...referenced].sort().map((id) => [id, assetEvidence(assetCatalog.catalog[id], id)]));
  const orderedPlanDigestValue = orderedPlanDigest({
    identity: parsed.document.frontmatter.metadata?.identity ?? null,
    theme,
    styleReferenceFingerprint: styleFingerprint,
    referencedCatalog,
    slides,
  });
  return {
    schema: HTML_SLIDE_PLAN_SCHEMA,
    contract_version: 1,
    source_sha256: parsed.source_sha256,
    input_receipts: receipts,
    production: { pipeline: HTML_FIRST_PIPELINE },
    ...(parsed.document.frontmatter.metadata?.identity ? { identity: parsed.document.frontmatter.metadata.identity } : {}),
    theme,
    asset_catalog: publicCatalog(assetCatalog.catalog),
    style_reference_contract_fingerprint: styleFingerprint,
    slides,
    ordered_plan_digest: orderedPlanDigestValue,
  };
}

export function validateHtmlFirstRun({ runDir, sourceBytes = null } = {}) {
  const run = resolve(runDir);
  const candidates = readdirSync(run)
    .filter((name) => /^slide-specifications.*\.md$/.test(name))
    .map((name) => join(run, name));
  const sourcePath = assertCanonicalHtmlSourceCandidates(run, candidates);
  const bytes = sourceBytes == null ? readFileSync(sourcePath) : Buffer.from(sourceBytes);
  let sourceText;
  try {
    sourceText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HtmlSlideContractError("HTML-first source is not valid UTF-8", [issue("invalid_source_utf8", "slide-specifications.md must be valid UTF-8", { source: "slide-specifications.md" })]);
  }
  if (sourceText.includes("\0")) {
    throw new HtmlSlideContractError("HTML-first source contains NUL", [issue("source_nul_forbidden", "slide-specifications.md must not contain NUL", { source: "slide-specifications.md" })]);
  }
  const sourcePathRelative = relative(deckRoot(run), sourcePath).split(sep).join("/");
  const parsed = parseHtmlFirstSource(sourceText, { source: sourcePathRelative });
  const palettePath = styleAsset(run, COLOR_PALETTE_FILE);
  const config = loadVisualConfigViews(palettePath).html_first;
  const assetCatalog = loadHtmlAssetCatalog(run);
  const preflight = buildHtmlSourcePreflight(parsed.slides);
  const geometryRegistry = loadHtmlFamilyGeometryRegistry();
  const geometryRegistrySha256 = htmlFamilyGeometrySemanticSha256(geometryRegistry);
  const receipts = buildReceipts({ runDir: run, sourcePath, palettePath, assetCatalog, preflight });
  return {
    runDir: run,
    sourcePath,
    palettePath,
    parsed,
    config,
    assetCatalog,
    preflight,
    geometryRegistry,
    geometryRegistrySha256,
    receipts,
  };
}

export function validateAndBuildHtmlFirstPlan(options = {}) {
  const validated = validateHtmlFirstRun(options);
  return { validated, plan: buildHtmlFirstPlan(validated) };
}

function orderedObject(value, order, childKinds = {}) {
  const output = {};
  for (const key of order) {
    if (!Object.hasOwn(value, key)) continue;
    output[key] = orderValue(value[key], childKinds[key]);
  }
  return output;
}

function orderValue(value, kind = null) {
  if (Array.isArray(value)) return value.map((item) => orderValue(item, kind));
  if (!value || typeof value !== "object") return value;
  if (kind === "text_block") return orderedObject(value, FIELD_ORDERS.text_block);
  if (kind === "card") return orderedObject(value, FIELD_ORDERS.card);
  if (kind === "metric") return orderedObject(value, FIELD_ORDERS.metric);
  if (kind === "step") return orderedObject(value, FIELD_ORDERS.step);
  if (kind === "quote_block") return orderedObject(value, FIELD_ORDERS.quote_block);
  if (kind === "data_series") return orderedObject(value, FIELD_ORDERS.data_series);
  if (kind === "value_format") return orderedObject(value, FIELD_ORDERS.value_format);
  if (kind === "chart") return orderedObject(value, FIELD_ORDERS.chart, { series: "data_series", value_format: "value_format" });
  if (kind === "fallback") return orderedObject(value, FIELD_ORDERS.fallback);
  if (kind === "selection") return orderedObject(value, FIELD_ORDERS.selection);
  if (kind === "primary_visual") return orderedObject(value, FIELD_ORDERS.primary_visual, { fallback: "fallback", selection: "selection" });
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, orderValue(value[key])]));
}

export function orderStructuredBody(value) {
  const family = value?.family;
  const root = {};
  if (Object.hasOwn(value, "schema_version")) root.schema_version = value.schema_version;
  if (Object.hasOwn(value, "family")) root.family = family;
  const childKinds = {
    left: "text_block", right: "text_block", text: "text_block",
    cards: "card", metrics: "metric", steps: "step", chart: "chart",
    insight: "text_block", quote: "quote_block", supporting: "text_block", caption: "text_block",
  };
  for (const key of FAMILY_ROOT_ORDERS[family] || []) {
    if (Object.hasOwn(value, key)) root[key] = orderValue(value[key], childKinds[key]);
  }
  if (Object.hasOwn(value, "callout")) root.callout = value.callout;
  if (Object.hasOwn(value, "primary_visual")) root.primary_visual = orderValue(value.primary_visual, "primary_visual");
  return root;
}

function applyYamlScalarStyles(node) {
  walkYaml(node, (current) => {
    if (!isScalar(current) || typeof current.value !== "string") return;
    if (current.value.includes("\n")) current.type = "BLOCK_LITERAL";
    else if (TIMESTAMP_LIKE_RE.test(current.value)) current.type = "QUOTE_DOUBLE";
  });
}

export function canonicalStructuredYaml(value, { newline = "\n" } = {}) {
  const ordered = orderStructuredBody(value);
  const document = new Document(ordered, {
    version: "1.2",
    schema: "core",
    indent: 2,
    indentSeq: true,
    lineWidth: 0,
    blockQuote: "literal",
    simpleKeys: true,
  });
  applyYamlScalarStyles(document.contents);
  const output = document.toString({
    indent: 2,
    indentSeq: true,
    lineWidth: 0,
    blockQuote: "literal",
    simpleKeys: true,
  });
  return newline === "\n" ? output : output.replaceAll("\n", newline);
}

export function serializeStructuredBodyEdit(sourceText, slideId, nextBody, options = {}) {
  const parsed = parseHtmlFirstSource(sourceText, options);
  const slide = parsed.slides.find((entry) => entry.block.slide_id === slideId);
  if (!slide) throw new HtmlSlideContractError(`unknown slide ${slideId}`, [issue("unknown_slide", `unknown slide ${slideId}`, { source: options.source, slideId })]);
  const validation = validateStructuredBody(nextBody, { source: options.source || parsed.document.source, slideId, line: slide.structured_range.yaml_line });
  if (validation.issues.length > 0) throw new HtmlSlideContractError("edited structured body is invalid", validation.issues);
  const yaml = canonicalStructuredYaml(nextBody, { newline: parsed.document.newline });
  const start = slide.structured_range.yaml_start;
  const end = slide.structured_range.yaml_end;
  return String(sourceText).slice(0, start) + yaml + String(sourceText).slice(end);
}

function validateTextBlock(value, path, issues, context, limits = {}) {
  const block = mapping(value, path, issues, context, { exact: ["heading", "body", "bullets"] });
  const present = ["heading", "body", "bullets"].filter((key) => Object.hasOwn(block, key));
  if (present.length === 0) issues.push(issue("empty_text_block", `${path} must contain heading, body, or bullets`, { ...context, field: path }));
  if (block.heading != null) text(block.heading, `${path}.heading`, issues, context, { max: limits.heading ?? 40 });
  if (block.body != null) text(block.body, `${path}.body`, issues, context, { max: limits.body ?? 120, singleLine: limits.bodyLines === 1 });
  if (block.body != null && String(block.body).split("\n").length > (limits.bodyLines ?? 6)) issues.push(issue("line_capacity", `${path}.body has too many lines`, { ...context, field: `${path}.body` }));
  if (block.bullets != null) {
    const bullets = array(block.bullets, `${path}.bullets`, issues, context, { min: limits.bulletsMin ?? 2, max: limits.bulletsMax ?? 5 });
    bullets.forEach((item, index) => text(item, `${path}.bullets[${index}]`, issues, context, { max: limits.bullet ?? 40 }));
  }
  if (limits.bodyBulletsExclusive && block.body != null && block.bullets != null) {
    issues.push(issue("text_block_branch_conflict", `${path} cannot contain both body and bullets`, { ...context, field: path }));
  }
  if (limits.requireBullets && block.bullets == null) {
    issues.push(issue("missing_field", `${path}.bullets is required`, { ...context, field: `${path}.bullets` }));
  }
  if (limits.exactlyOne && present.length !== 1) {
    issues.push(issue("text_block_exactly_one", `${path} must contain exactly one of heading, body, or bullets`, { ...context, field: path, actual: present.length, expected: 1 }));
  }
  return block;
}

function validateIconId(value, path, issues, context) {
  if (typeof value !== "string" || !ASSET_ID_RE.test(value)) issues.push(issue("invalid_asset_id", `${path} must be a valid asset ID`, { ...context, field: path }));
}

function validateCard(value, path, issues, context) {
  const card = mapping(value, path, issues, context, { exact: ["label", "value", "body", "icon"], required: ["label"] });
  text(card.label, `${path}.label`, issues, context, { max: 20 });
  if (card.value != null) text(card.value, `${path}.value`, issues, context, { max: 24 });
  if (card.body != null) text(card.body, `${path}.body`, issues, context, { max: 40 });
  if (card.value != null && card.body != null) issues.push(issue("card_value_body_conflict", `${path} cannot contain both value and body`, { ...context, field: path }));
  if (card.icon != null) validateIconId(card.icon, `${path}.icon`, issues, context);
}

function validateMetric(value, path, issues, context) {
  const metric = mapping(value, path, issues, context, { exact: ["value", "label", "detail"], required: ["value", "label"] });
  text(metric.value, `${path}.value`, issues, context, { max: 12 });
  text(metric.label, `${path}.label`, issues, context, { max: 20 });
  if (metric.detail != null) text(metric.detail, `${path}.detail`, issues, context, { max: 30 });
}

function validateStep(value, path, issues, context) {
  const step = mapping(value, path, issues, context, { exact: ["label", "body", "icon"], required: ["label"] });
  text(step.label, `${path}.label`, issues, context, { max: 20 });
  if (step.body != null) text(step.body, `${path}.body`, issues, context, { max: 40 });
  if (step.icon != null) validateIconId(step.icon, `${path}.icon`, issues, context);
}

function validatePrimaryVisual(value, path, issues, context, allowedPlacements, family) {
  const visual = mapping(value, path, issues, context, {
    exact: ["placement", "brief", "fit", "focal_point", "fallback", "selection"],
    required: ["placement", "brief", "fit", "focal_point", "fallback", "selection"],
  });
  if (!allowedPlacements.includes(visual.placement)) issues.push(issue("invalid_visual_placement", `${path}.placement must be ${allowedPlacements.join("|")}`, { ...context, field: `${path}.placement` }));
  text(visual.brief, `${path}.brief`, issues, context, { max: 600, singleLine: false });
  if (visual.fit !== "cover") issues.push(issue("invalid_visual_fit", `${path}.fit must equal cover`, { ...context, field: `${path}.fit` }));
  const focal = array(visual.focal_point, `${path}.focal_point`, issues, context, { min: 2, max: 2 });
  focal.forEach((item, index) => finiteNumber(item, `${path}.focal_point[${index}]`, issues, context, { min: 0, max: 1 }));
  const fallback = mapping(visual.fallback, `${path}.fallback`, issues, context);
  if (fallback.kind === "asset") {
    mapping(fallback, `${path}.fallback`, issues, context, { exact: ["kind", "asset_id"], required: ["kind", "asset_id"] });
    validateIconId(fallback.asset_id, `${path}.fallback.asset_id`, issues, context);
  } else if (fallback.kind === "icon-composition") {
    mapping(fallback, `${path}.fallback`, issues, context, { exact: ["kind", "asset_ids"], required: ["kind", "asset_ids"] });
    const ids = array(fallback.asset_ids, `${path}.fallback.asset_ids`, issues, context, { min: 1, max: 3 });
    ids.forEach((id, index) => validateIconId(id, `${path}.fallback.asset_ids[${index}]`, issues, context));
    if (new Set(ids).size !== ids.length) issues.push(issue("duplicate_fallback_asset_id", `${path}.fallback.asset_ids must be unique`, { ...context, field: `${path}.fallback.asset_ids` }));
  } else if (fallback.kind === "abstract-pattern") {
    mapping(fallback, `${path}.fallback`, issues, context, { exact: ["kind", "recipe"], required: ["kind", "recipe"] });
    if (!["gradient-field", "line-grid", "soft-orbs"].includes(fallback.recipe)) issues.push(issue("invalid_abstract_recipe", `${path}.fallback.recipe is unsupported`, { ...context, field: `${path}.fallback.recipe` }));
  } else {
    issues.push(issue("invalid_fallback_kind", `${path}.fallback.kind must be asset|icon-composition|abstract-pattern`, { ...context, field: `${path}.fallback.kind` }));
  }
  if (FALLBACK_FAMILIES[fallback.kind] && !FALLBACK_FAMILIES[fallback.kind].has(family)) {
    issues.push(issue("fallback_family_incompatible", `${path}.fallback.kind ${fallback.kind} is not allowed for ${family}`, { ...context, field: `${path}.fallback.kind` }));
  }
  if (visual.selection !== null) {
    const selection = mapping(visual.selection, `${path}.selection`, issues, context, { exact: ["asset_id", "accepted_for", "output_sha256"], required: ["asset_id", "accepted_for", "output_sha256"] });
    validateIconId(selection.asset_id, `${path}.selection.asset_id`, issues, context);
    if (!SHA_RE.test(selection.accepted_for || "")) issues.push(issue("invalid_selection_fingerprint", `${path}.selection.accepted_for must be lowercase SHA-256`, { ...context, field: `${path}.selection.accepted_for` }));
    if (!SHA_RE.test(selection.output_sha256 || "")) issues.push(issue("invalid_selection_sha", `${path}.selection.output_sha256 must be lowercase SHA-256`, { ...context, field: `${path}.selection.output_sha256` }));
  }
  return visual;
}

function familyVariant(body) {
  const callout = body.callout != null ? 1 : 0;
  switch (body.family) {
    case "hero": return `hero--statement${body.hero_statement != null ? 1 : 0}--support${body.supporting_line != null ? 1 : 0}--visual${body.primary_visual != null ? 1 : 0}--callout${callout}`;
    case "split": return body.mode === "text-text" ? `split--text-text--callout${callout}` : `split--text-visual-${body.primary_visual?.placement}--callout${callout}`;
    case "cards": return `cards--n${body.cards?.length ?? 0}--callout${callout}`;
    case "kpi": return `kpi--n${body.metrics?.length ?? 0}--callout${callout}`;
    case "comparison": return `comparison--callout${callout}`;
    case "flow": return `flow--n${body.steps?.length ?? 0}--callout${callout}`;
    case "timeline": return `timeline--n${body.steps?.length ?? 0}--callout${callout}`;
    case "data": return `data--insight${body.insight != null ? 1 : 0}--callout${callout}`;
    case "quote": return `quote--support${body.supporting != null ? 1 : 0}--visual-${body.primary_visual?.placement ?? "none"}--callout${callout}`;
    case "visual-focus": return `visual-focus--caption${body.caption != null ? 1 : 0}--callout${callout}`;
    default: return null;
  }
}

export function validateStructuredBody(value, context = {}) {
  const issues = [];
  const root = mapping(value, "$", issues, context);
  if (root.schema_version !== 1) issues.push(issue("unsupported_body_schema", "schema_version must equal 1", { ...context, field: "schema_version", actual: root.schema_version, expected: 1 }));
  if (!FAMILY_SET.has(root.family)) issues.push(issue("unknown_family", `family must be one of ${HTML_FAMILIES.join(", ")}`, { ...context, field: "family" }));
  const common = ["schema_version", "family", "callout", "primary_visual"];
  if (root.callout != null) text(root.callout, "callout", issues, context, { max: 80 });

  switch (root.family) {
    case "hero": {
      mapping(root, "$", issues, context, { exact: [...common, "hero_statement", "supporting_line"] });
      if (root.hero_statement != null) {
        text(root.hero_statement, "hero_statement", issues, context, { max: 120, singleLine: false });
        if (String(root.hero_statement).split("\n").length > 2) issues.push(issue("line_capacity", "hero_statement has more than 2 lines", { ...context, field: "hero_statement" }));
      }
      if (root.supporting_line != null) text(root.supporting_line, "supporting_line", issues, context, { max: 160 });
      if (root.primary_visual != null) validatePrimaryVisual(root.primary_visual, "primary_visual", issues, context, ["full-bleed"], "hero");
      break;
    }
    case "split": {
      mapping(root, "$", issues, context, { exact: [...common, "mode", "left", "right", "text"] });
      if (root.mode === "text-text") {
        if (root.primary_visual != null || root.text != null) issues.push(issue("split_branch_conflict", "text-text cannot contain text or primary_visual", { ...context, field: "$" }));
        validateTextBlock(root.left, "left", issues, context, { bulletsMax: 4, bodyBulletsExclusive: true });
        validateTextBlock(root.right, "right", issues, context, { bulletsMax: 4, bodyBulletsExclusive: true });
      } else if (root.mode === "text-visual") {
        if (root.left != null || root.right != null) issues.push(issue("split_branch_conflict", "text-visual cannot contain left or right", { ...context, field: "$" }));
        validateTextBlock(root.text, "text", issues, context, { bulletsMax: 4, bodyBulletsExclusive: true });
        validatePrimaryVisual(root.primary_visual, "primary_visual", issues, context, ["left", "right"], "split");
      } else issues.push(issue("invalid_split_mode", "split.mode must be text-text|text-visual", { ...context, field: "mode" }));
      break;
    }
    case "cards": {
      mapping(root, "$", issues, context, { exact: [...common, "cards"] });
      if (root.primary_visual != null) issues.push(issue("primary_visual_forbidden", "cards forbids primary_visual", { ...context, field: "primary_visual" }));
      array(root.cards, "cards", issues, context, { min: 2, max: 4 }).forEach((item, index) => validateCard(item, `cards[${index}]`, issues, context));
      break;
    }
    case "kpi": {
      mapping(root, "$", issues, context, { exact: [...common, "metrics"] });
      if (root.primary_visual != null) issues.push(issue("primary_visual_forbidden", "kpi forbids primary_visual", { ...context, field: "primary_visual" }));
      array(root.metrics, "metrics", issues, context, { min: 1, max: 3 }).forEach((item, index) => validateMetric(item, `metrics[${index}]`, issues, context));
      break;
    }
    case "comparison": {
      mapping(root, "$", issues, context, { exact: [...common, "left", "right"] });
      if (root.primary_visual != null) issues.push(issue("primary_visual_forbidden", "comparison forbids primary_visual", { ...context, field: "primary_visual" }));
      validateTextBlock(root.left, "left", issues, context, { bodyLines: 1, bulletsMin: 2, bulletsMax: 5, bullet: 20, requireBullets: true });
      validateTextBlock(root.right, "right", issues, context, { bodyLines: 1, bulletsMin: 2, bulletsMax: 5, bullet: 20, requireBullets: true });
      if (root.left?.body != null || root.right?.body != null) issues.push(issue("comparison_body_forbidden", "comparison sides require bullets and forbid body", { ...context, field: "$" }));
      break;
    }
    case "flow":
    case "timeline": {
      mapping(root, "$", issues, context, { exact: [...common, "steps"] });
      if (root.primary_visual != null) issues.push(issue("primary_visual_forbidden", `${root.family} forbids primary_visual`, { ...context, field: "primary_visual" }));
      array(root.steps, "steps", issues, context, { min: 3, max: 5 }).forEach((item, index) => validateStep(item, `steps[${index}]`, issues, context));
      break;
    }
    case "data": {
      mapping(root, "$", issues, context, { exact: [...common, "chart", "insight"] });
      if (root.primary_visual != null) issues.push(issue("primary_visual_forbidden", "data forbids primary_visual", { ...context, field: "primary_visual" }));
      const chart = mapping(root.chart, "chart", issues, context, { exact: ["kind", "categories", "series", "value_format", "legend"], required: ["kind", "categories", "series", "value_format", "legend"] });
      if (!["bar", "line", "area"].includes(chart.kind)) issues.push(issue("invalid_chart_kind", "chart.kind must be bar|line|area", { ...context, field: "chart.kind" }));
      const categories = array(chart.categories, "chart.categories", issues, context, { min: 1, max: 12 });
      categories.forEach((item, index) => text(item, `chart.categories[${index}]`, issues, context, { max: 20 }));
      if (categories.reduce((sum, item) => sum + graphemes(item), 0) > 120) issues.push(issue("capacity_exceeded", "chart.categories exceeds 120 total graphemes", { ...context, field: "chart.categories" }));
      const series = array(chart.series, "chart.series", issues, context, { min: 1, max: 4 });
      series.forEach((entry, index) => {
        const item = mapping(entry, `chart.series[${index}]`, issues, context, { exact: ["name", "values"], required: ["name", "values"] });
        text(item.name, `chart.series[${index}].name`, issues, context, { max: 30 });
        const values = array(item.values, `chart.series[${index}].values`, issues, context, { min: 1, max: 12 });
        if (values.length !== categories.length) issues.push(issue("chart_length_mismatch", `chart.series[${index}].values must match categories length`, { ...context, field: `chart.series[${index}].values` }));
        values.forEach((number, valueIndex) => finiteNumber(number, `chart.series[${index}].values[${valueIndex}]`, issues, context, { min: -1e15, max: 1e15 }));
      });
      if (series.reduce((sum, item) => sum + graphemes(item?.name ?? ""), 0) > 80) issues.push(issue("capacity_exceeded", "chart series names exceed 80 total graphemes", { ...context, field: "chart.series" }));
      if (!["auto", "show", "hide"].includes(chart.legend)) issues.push(issue("invalid_legend", "chart.legend must be auto|show|hide", { ...context, field: "chart.legend" }));
      const format = mapping(chart.value_format, "chart.value_format", issues, context);
      const formatKeys = format.kind === "currency" ? ["kind", "decimals", "currency"] : ["kind", "decimals"];
      mapping(format, "chart.value_format", issues, context, { exact: formatKeys, required: formatKeys });
      if (!["number", "percent", "compact", "currency"].includes(format.kind)) issues.push(issue("invalid_value_format", "value_format.kind is unsupported", { ...context, field: "chart.value_format.kind" }));
      finiteNumber(format.decimals, "chart.value_format.decimals", issues, context, { min: 0, max: 2, integer: true });
      if (format.kind === "currency" && !/^[A-Z]{3}$/.test(format.currency || "")) issues.push(issue("invalid_currency", "currency must be three uppercase ASCII letters", { ...context, field: "chart.value_format.currency" }));
      if (format.kind === "percent") {
        series.forEach((entry, seriesIndex) => (entry?.values || []).forEach((number, valueIndex) => {
          if (typeof number === "number" && Number.isFinite(number) && (number < -1e4 || number > 1e4)) {
            issues.push(issue("percent_value_out_of_range", `chart.series[${seriesIndex}].values[${valueIndex}] must be in [-10000,10000] for percent formatting`, { ...context, field: `chart.series[${seriesIndex}].values[${valueIndex}]`, actual: number }));
          }
        }));
      }
      if (root.insight != null) validateTextBlock(root.insight, "insight", issues, context, { heading: 30, body: 100, bodyLines: 1, bulletsMax: 4, bullet: 14, bodyBulletsExclusive: true });
      break;
    }
    case "quote": {
      mapping(root, "$", issues, context, { exact: [...common, "quote", "supporting"] });
      const quote = mapping(root.quote, "quote", issues, context, { exact: ["quote", "attribution", "context"], required: ["quote"] });
      const compact = quote.attribution != null || quote.context != null;
      text(quote.quote, "quote.quote", issues, context, { max: compact ? 60 : 90, singleLine: false });
      if (String(quote.quote || "").split("\n").length > 4) issues.push(issue("line_capacity", "quote.quote has more than 4 lines", { ...context, field: "quote.quote" }));
      if (quote.attribution != null) text(quote.attribution, "quote.attribution", issues, context, { max: 20 });
      if (quote.context != null) text(quote.context, "quote.context", issues, context, { max: 20 });
      const quoteTotal = [quote.quote, quote.attribution, quote.context].filter((item) => typeof item === "string").reduce((sum, item) => sum + visibleGraphemes(item), 0);
      if (quoteTotal > 90) issues.push(issue("capacity_exceeded", "quote block exceeds 90 total graphemes", { ...context, field: "quote", actual: quoteTotal, expected: 90 }));
      if (root.supporting != null) validateTextBlock(root.supporting, "supporting", issues, context, { heading: 30, body: 60, bodyLines: 1, bulletsMin: 2, bulletsMax: 2, bullet: 16, exactlyOne: true });
      if (root.primary_visual != null) validatePrimaryVisual(root.primary_visual, "primary_visual", issues, context, ["left", "right"], "quote");
      break;
    }
    case "visual-focus": {
      mapping(root, "$", issues, context, { exact: [...common, "caption"] });
      validatePrimaryVisual(root.primary_visual, "primary_visual", issues, context, ["body"], "visual-focus");
      if (root.caption != null) validateTextBlock(root.caption, "caption", issues, context, { heading: 40, body: 100, bodyLines: 1, bulletsMax: 3, bullet: 30, exactlyOne: true });
      break;
    }
    default:
      break;
  }
  const variant = familyVariant(root);
  const geometry = loadHtmlFamilyGeometryRegistry();
  if (variant && !geometry.variants[variant]) issues.push(issue("missing_geometry_variant", `no geometry variant for ${variant}`, { ...context, field: "family" }));
  return { issues, variant, geometry: variant ? geometry.variants[variant] : null };
}

function extractMarkdownField(body, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(body).match(new RegExp(`^\\*\\*${escaped}\\*\\*:[ \\t]*(.*?)[ \\t]*$`, "m"));
  if (!match) return null;
  const trimmed = match[1].trim();
  if (!trimmed || /^\((?:none|无)\)$/i.test(trimmed) || PLACEHOLDER_RE.test(trimmed)) return null;
  return trimmed;
}

function extractConcept(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...String(body).matchAll(new RegExp(`^- \\*\\*${escaped}\\*\\*:[ \\t]*(.*?)[ \\t]*$`, "gm"))];
  return matches.map((match) => match[1].trim());
}

export function parseHtmlFirstSource(sourceText, { source = "slide-specifications.md" } = {}) {
  if (String(sourceText).includes("\0")) {
    throw new HtmlSlideContractError("HTML-first source contains NUL", [issue("source_nul_forbidden", "HTML-first source must not contain NUL", { source })]);
  }
  const marker = probeProductionMarker(sourceText, { source });
  if (marker.branch !== HTML_FIRST_PIPELINE) {
    throw new HtmlSlideContractError("source is not a valid HTML-first source", marker.issues.length ? marker.issues : [issue("html_first_marker_missing", `production.pipeline must equal ${HTML_FIRST_PIPELINE}`, { source })]);
  }
  const document = parseSlideDocument(String(sourceText), source);
  const issues = validateSlideDocument(document).filter((entry) => entry.severity === "ERROR");
  if (Object.hasOwn(document.frontmatter.metadata || {}, "render")) issues.push(issue("legacy_render_conflict", "HTML-first source forbids top-level render", { source }));
  const slides = [];
  for (const block of document.slides) {
    const context = { source, slideId: block.slide_id, line: block.heading_range.start_line };
    for (const field of ["RENDER MODE", "IMAGE PROMPT", "VISUAL ASSETS"]) {
      if (new RegExp(`^\\*\\*${field.replace(" ", "\\ ")}\\*\\*:`, "m").test(block.body)) issues.push(issue("legacy_slide_field_conflict", `HTML-first slide forbids ${field}`, { ...context, field }));
    }
    const matches = findStructuredBody(document, block);
    if (matches.length !== 1) {
      issues.push(issue(matches.length === 0 ? "missing_slide_body" : "duplicate_slide_body", `slide requires exactly one exact SLIDE BODY YAML fence; got ${matches.length}`, { ...context, field: "SLIDE BODY", actual: matches.length, expected: 1 }));
      continue;
    }
    let parsed;
    try {
      parsed = parseClosedYaml(matches[0].yaml, { source, line: matches[0].yaml_line, slideId: block.slide_id });
    } catch (error) {
      if (error instanceof HtmlSlideContractError) issues.push(...error.issues);
      else throw error;
      continue;
    }
    const bodyValidation = validateStructuredBody(parsed.value, { source, line: matches[0].yaml_line, slideId: block.slide_id });
    issues.push(...bodyValidation.issues);
    const title = extractMarkdownField(block.body, "TITLE");
    const visualType = extractMarkdownField(block.body, "VISUAL TYPE");
    const mustCommunicate = extractConcept(block.body, "MUST communicate");
    const mustNot = extractConcept(block.body, "MUST NOT");
    if (!title) issues.push(issue("missing_title", "HTML-first slide requires a non-placeholder TITLE", context));
    if (!visualType) issues.push(issue("missing_visual_type", "HTML-first slide requires a non-placeholder VISUAL TYPE", context));
    if (mustCommunicate.length !== 1) issues.push(issue("invalid_must_communicate", "CONCEPT requires exactly one MUST communicate bullet", { ...context, actual: mustCommunicate.length, expected: 1 }));
    if (mustNot.length !== 1) issues.push(issue("invalid_must_not", "CONCEPT requires exactly one MUST NOT bullet", { ...context, actual: mustNot.length, expected: 1 }));
    if (title && graphemes(title) > 60) issues.push(issue("capacity_exceeded", "TITLE exceeds 60 graphemes", { ...context, field: "header.title" }));
    if (visualType && graphemes(visualType) > 80) issues.push(issue("capacity_exceeded", "VISUAL TYPE exceeds 80 graphemes", { ...context, field: "visual_type" }));
    if (mustCommunicate[0] && graphemes(mustCommunicate[0]) > 400) issues.push(issue("capacity_exceeded", "MUST communicate exceeds 400 graphemes", { ...context, field: "concept.must_communicate" }));
    if (mustNot[0] && graphemes(mustNot[0]) > 240) issues.push(issue("capacity_exceeded", "MUST NOT exceeds 240 graphemes", { ...context, field: "concept.must_not" }));
    slides.push({
      block,
      structured_range: matches[0],
      yaml_document: parsed.document,
      source_body: parsed.value,
      variant: bodyValidation.variant,
      geometry: bodyValidation.geometry,
      header: {
        kicker: extractMarkdownField(block.body, "KICKER"),
        title,
        subtitle: extractMarkdownField(block.body, "SUBTITLE"),
      },
      visual_type: visualType,
      concept: { must_communicate: mustCommunicate[0] ?? null, must_not: mustNot[0] ?? null },
    });
  }
  if (issues.length > 0) throw new HtmlSlideContractError("HTML-first source validation failed", issues);
  return { branch: HTML_FIRST_PIPELINE, document, source_sha256: sha256(Buffer.from(String(sourceText), "utf8")), slides };
}

export function canonicalRunSourcePath(runDir) {
  return join(resolve(runDir), "slide-specifications.md");
}

export function runRelativePath(runDir, absolutePath) {
  const root = resolve(runDir, "..", "..");
  return relative(root, resolve(absolutePath)).split(sep).join("/");
}

export function frameworkRelativePath(frameworkDir, absolutePath) {
  return relative(resolve(frameworkDir), resolve(absolutePath)).split(sep).join("/");
}

export function assertCanonicalHtmlSourceCandidates(runDir, candidates) {
  const exact = canonicalRunSourcePath(runDir);
  const normalized = (candidates || []).map((path) => resolve(path));
  if (!normalized.includes(exact)) throw new HtmlSlideContractError("canonical HTML-first source is missing", [issue("canonical_source_missing", "HTML-first requires exact slide-specifications.md", { source: basename(exact) })]);
  if (normalized.length !== 1) throw new HtmlSlideContractError("multiple HTML-first source candidates", [issue("multiple_source_candidates", "HTML-first rejects slide-specifications*.md siblings", { source: basename(exact), actual: normalized.map((path) => basename(path)), expected: ["slide-specifications.md"] })]);
  return exact;
}

export function htmlGeometryRegistryId() {
  return HTML_FAMILY_GEOMETRY_ID;
}
