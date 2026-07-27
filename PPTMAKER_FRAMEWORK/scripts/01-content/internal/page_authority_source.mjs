import { createHash } from "node:crypto";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
import {
  PAGE_AUTHORITY_IMAGE2_PIPELINE,
  probeProductionMarker,
} from "../../shared/run-bundle/production_marker.mjs";
import {
  SlideDocumentError,
  parseSlideDocument,
  validateSlideDocument,
} from "./slide_document.mjs";

export const PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA = "pptmaker-page-authority-source-receipt-v1";
export const PAGE_AUTHORITIES = Object.freeze(["pure-image2", "framed-image2"]);
export const FRAMED_TEXT_PRESET = "standard-v1";

const DISPLAY_FIELDS = Object.freeze(["KICKER", "TITLE", "SUBTITLE", "CALLOUT"]);
const PAGE_AUTHORITY_FIELDS = Object.freeze([
  "PAGE AUTHORITY",
  ...DISPLAY_FIELDS,
  "FRAME PRESET",
  "VISUAL BRIEF",
  "VISUAL IDENTITY",
  "IDENTITY SUBJECT COUNT",
  "SUBJECT RESTRICTIONS",
]);
const LEGACY_FIELDS = new Set(["RENDER MODE", "IMAGE PROMPT"]);
const VISUAL_BRIEF_KEYS = Object.freeze(["recipe", "composition", "motifs", "negative_constraints"]);
const NEGATIVE_CONSTRAINTS = Object.freeze([
  "no-readable-text",
  "no-labels",
  "no-logo",
  "no-watermark",
]);
const IDENTITY_SUBJECT_COUNTS = Object.freeze(["none", "one"]);
const SUBJECT_RESTRICTIONS = Object.freeze([
  "none",
  "no-generic-metal-robot",
  "no-identity-subject",
]);
const LOWER_KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISUAL_BRIEF_BLOCK_RE = /^\*\*VISUAL BRIEF\*\*:[ \t]*\r?\n```yaml\r?\n([\s\S]*?)^```(?:\r?\n|$)/gm;
const BOLD_FIELD_RE = /^\*\*([^*\r\n]+)\*\*:[ \t]*(.*?)\r?$/gm;

export class PageAuthoritySourceError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((issue) => issue.message || String(issue)).join("; "));
    this.name = "PageAuthoritySourceError";
    this.issues = Object.freeze([...list]);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze(entry);
  return Object.freeze(value);
}

function lineAndColumn(sourceText, offset) {
  const prior = sourceText.slice(0, offset);
  const line = prior.split("\n").length;
  const lastNewline = prior.lastIndexOf("\n");
  return { line, column: offset - (lastNewline + 1) + 1 };
}

function span(sourceText, start, end) {
  const first = lineAndColumn(sourceText, start);
  const last = lineAndColumn(sourceText, Math.max(start, end - 1));
  return {
    start,
    end,
    byte_start: Buffer.byteLength(sourceText.slice(0, start), "utf8"),
    byte_end: Buffer.byteLength(sourceText.slice(0, end), "utf8"),
    start_line: first.line,
    end_line: last.line,
    start_column: first.column,
    end_column: last.column,
  };
}

function issue(document, block, code, message, { field, fieldSpan, expected, actual } = {}) {
  const fieldRange = fieldSpan || block.heading_text_range;
  return {
    severity: "ERROR",
    code,
    message,
    source: {
      path: document.source,
      line: fieldRange.start_line,
      column: fieldRange.start_column || 1,
      range: fieldRange,
    },
    subject: { kind: "slide", id: block.slide_id || null, ...(field ? { field } : {}) },
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
    repair_hint: "repair the Page Authority source field before requesting raw Image2 work",
  };
}

function frontmatterIssue(document, code, message, { expected, actual } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: {
      path: document.source,
      line: 1,
      column: 1,
      range: document.frontmatter.range,
    },
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
    repair_hint: "repair the Page Authority production marker before requesting raw Image2 work",
  };
}

function nonEmptyInlineValue(document, block, parsedField, issues) {
  const value = parsedField.value.trim();
  if (value) return value;
  issues.push(issue(document, block, "empty_page_authority_field", `**${parsedField.label}** must have one non-empty inline value`, {
    field: parsedField.label,
    fieldSpan: parsedField.range,
  }));
  return null;
}

function hasQuotedLiteral(value) {
  return /^['"]/.test(value) || /['"]$/.test(value);
}

function isLowerKebabId(value) {
  return typeof value === "string" && LOWER_KEBAB_ID.test(value);
}

function containsYamlIndirection(node) {
  if (!node) return false;
  if (isAlias(node) || node.anchor || node.tag) return true;
  if (isMap(node)) return node.items.some((pair) => containsYamlIndirection(pair.key) || containsYamlIndirection(pair.value));
  if (isSeq(node)) return node.items.some((item) => containsYamlIndirection(item));
  return false;
}

function nodeSpan(document, yamlStart, node, fallback) {
  if (!Array.isArray(node?.range) || node.range.length < 2) return fallback;
  return span(document.source_text, yamlStart + node.range[0], yamlStart + node.range[1]);
}

function requirePlainId(document, block, node, yamlStart, field, issues) {
  if (
    !isScalar(node)
    || node.type !== "PLAIN"
    || node.anchor
    || node.tag
    || !isLowerKebabId(node.value)
  ) {
    issues.push(issue(
      document,
      block,
      "invalid_visual_brief_id",
      `${field} must be one unquoted lower-kebab ID`,
      { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, node, block.body_range), actual: node?.value }
    ));
    return null;
  }
  return node.value;
}

function requirePlainList(document, block, node, yamlStart, field, issues, { allowed = null, max = 6 } = {}) {
  if (!isSeq(node) || node.anchor || node.tag) {
    issues.push(issue(
      document,
      block,
      "invalid_visual_brief_list",
      `${field} must be an ordered YAML sequence`,
      { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, node, block.body_range) }
    ));
    return [];
  }
  if (node.items.length > max) {
    issues.push(issue(
      document,
      block,
      "visual_brief_list_too_long",
      `${field} may contain at most ${max} entries`,
      { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, node, block.body_range), actual: node.items.length, expected: max }
    ));
  }
  const values = [];
  const seen = new Set();
  for (const item of node.items) {
    const value = requirePlainId(document, block, item, yamlStart, field, issues);
    if (!value) continue;
    if (allowed && !allowed.has(value)) {
      issues.push(issue(
        document,
        block,
        "unknown_negative_constraint",
        `${field} contains unsupported value ${JSON.stringify(value)}`,
        { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, item, block.body_range), actual: value, expected: [...allowed] }
      ));
    }
    if (seen.has(value)) {
      issues.push(issue(
        document,
        block,
        "duplicate_visual_brief_value",
        `${field} must not repeat ${JSON.stringify(value)}`,
        { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, item, block.body_range), actual: value }
      ));
    }
    seen.add(value);
    values.push(value);
  }
  return values;
}

function parseVisualBrief(document, block, visualBlock, issues) {
  let yamlDocument;
  try {
    yamlDocument = parseDocument(visualBlock.yaml, {
      version: "1.2",
      schema: "core",
      uniqueKeys: true,
      merge: false,
      keepSourceTokens: true,
    });
  } catch (error) {
    issues.push(issue(document, block, "invalid_visual_brief_yaml", `VISUAL BRIEF YAML could not be parsed: ${error.message}`, {
      field: "VISUAL BRIEF",
      fieldSpan: visualBlock.yaml_range,
    }));
    return null;
  }
  for (const problem of [...yamlDocument.errors, ...yamlDocument.warnings]) {
    issues.push(issue(document, block, "invalid_visual_brief_yaml", problem.message.split("\n")[0], {
      field: "VISUAL BRIEF",
      fieldSpan: visualBlock.yaml_range,
    }));
  }
  const root = yamlDocument.contents;
  if (!isMap(root) || root.anchor || root.tag || containsYamlIndirection(root)) {
    issues.push(issue(document, block, "invalid_visual_brief_mapping", "VISUAL BRIEF must be one direct untagged YAML mapping", {
      field: "VISUAL BRIEF",
      fieldSpan: visualBlock.yaml_range,
    }));
    return null;
  }
  if (root.items.length !== VISUAL_BRIEF_KEYS.length) {
    issues.push(issue(document, block, "invalid_visual_brief_keys", "VISUAL BRIEF must contain exactly recipe, composition, motifs, negative_constraints", {
      field: "VISUAL BRIEF",
      fieldSpan: visualBlock.yaml_range,
    }));
  }
  const pairs = new Map();
  for (const [index, pair] of root.items.entries()) {
    const expectedKey = VISUAL_BRIEF_KEYS[index];
    if (!isScalar(pair.key) || pair.key.type !== "PLAIN" || pair.key.anchor || pair.key.tag || typeof pair.key.value !== "string") {
      issues.push(issue(document, block, "invalid_visual_brief_key", "VISUAL BRIEF keys must be direct unquoted strings", {
        field: "VISUAL BRIEF",
        fieldSpan: nodeSpan(document, visualBlock.yaml_start, pair.key, visualBlock.yaml_range),
      }));
      continue;
    }
    if (pair.key.value !== expectedKey) {
      issues.push(issue(document, block, "invalid_visual_brief_key_order", `VISUAL BRIEF key ${JSON.stringify(pair.key.value)} is not valid at this position`, {
        field: "VISUAL BRIEF",
        fieldSpan: nodeSpan(document, visualBlock.yaml_start, pair.key, visualBlock.yaml_range),
        actual: pair.key.value,
        expected: expectedKey,
      }));
    }
    if (pairs.has(pair.key.value)) {
      issues.push(issue(document, block, "duplicate_visual_brief_key", `VISUAL BRIEF repeats key ${JSON.stringify(pair.key.value)}`, {
        field: "VISUAL BRIEF",
        fieldSpan: nodeSpan(document, visualBlock.yaml_start, pair.key, visualBlock.yaml_range),
      }));
    }
    pairs.set(pair.key.value, pair.value);
  }
  for (const key of VISUAL_BRIEF_KEYS) {
    if (!pairs.has(key)) {
      issues.push(issue(document, block, "missing_visual_brief_key", `VISUAL BRIEF is missing ${key}`, {
        field: "VISUAL BRIEF",
        fieldSpan: visualBlock.yaml_range,
      }));
    }
  }
  const recipe = requirePlainId(document, block, pairs.get("recipe"), visualBlock.yaml_start, "recipe", issues);
  const composition = requirePlainId(document, block, pairs.get("composition"), visualBlock.yaml_start, "composition", issues);
  const motifs = requirePlainList(document, block, pairs.get("motifs"), visualBlock.yaml_start, "motifs", issues);
  const negativeConstraints = requirePlainList(
    document,
    block,
    pairs.get("negative_constraints"),
    visualBlock.yaml_start,
    "negative_constraints",
    issues,
    { allowed: new Set(NEGATIVE_CONSTRAINTS) }
  );
  return recipe && composition ? {
    recipe,
    composition,
    motifs,
    negative_constraints: negativeConstraints,
  } : null;
}

function scanSlideFields(document, block, issues) {
  const fields = new Map();
  for (const match of block.body.matchAll(BOLD_FIELD_RE)) {
    const label = match[1].trim().replace(/\s+/g, " ").toUpperCase();
    if (!PAGE_AUTHORITY_FIELDS.includes(label) && !LEGACY_FIELDS.has(label)) continue;
    const start = block.body_range.start + match.index;
    const parsed = {
      label,
      value: match[2],
      range: span(document.source_text, start, start + match[0].length),
    };
    const records = fields.get(label) || [];
    records.push(parsed);
    fields.set(label, records);
  }
  for (const [label, records] of fields) {
    if (records.length > 1) {
      for (const duplicate of records.slice(1)) {
        issues.push(issue(document, block, "duplicate_page_authority_field", `slide may contain **${label}** only once`, {
          field: label,
          fieldSpan: duplicate.range,
        }));
      }
    }
    if (LEGACY_FIELDS.has(label)) {
      for (const legacy of records) {
        issues.push(issue(document, block, "legacy_page_authority_ingress", `**${label}** is forbidden for ${PAGE_AUTHORITY_IMAGE2_PIPELINE}`, {
          field: label,
          fieldSpan: legacy.range,
        }));
      }
    }
  }
  return fields;
}

function oneField(fields, label) {
  return fields.get(label)?.[0] || null;
}

function parseOptionalEnum(document, block, field, allowed, defaultValue, issues) {
  if (!field) return defaultValue;
  const value = nonEmptyInlineValue(document, block, field, issues);
  if (!value) return defaultValue;
  if (hasQuotedLiteral(value) || !allowed.includes(value)) {
    issues.push(issue(document, block, "invalid_page_authority_enum", `**${field.label}** must equal ${allowed.join(" | ")}`, {
      field: field.label,
      fieldSpan: field.range,
      actual: value,
      expected: allowed,
    }));
    return defaultValue;
  }
  return value;
}

function parseIdentity(document, block, field, issues) {
  if (!field) return null;
  const value = nonEmptyInlineValue(document, block, field, issues);
  if (!value) return null;
  const parts = value.split("/");
  if (hasQuotedLiteral(value) || parts.length !== 2 || !isLowerKebabId(parts[0]) || !isLowerKebabId(parts[1])) {
    issues.push(issue(document, block, "invalid_visual_identity", "VISUAL IDENTITY must be one unquoted <profile>/<role> pair of lower-kebab IDs", {
      field: field.label,
      fieldSpan: field.range,
      actual: value,
    }));
    return null;
  }
  return { profile: parts[0], role: parts[1] };
}

function displayFields(document, block, fields, issues) {
  const result = {};
  for (const label of DISPLAY_FIELDS) {
    const field = oneField(fields, label);
    if (!field) {
      result[label.toLowerCase()] = null;
      continue;
    }
    const value = nonEmptyInlineValue(document, block, field, issues);
    result[label.toLowerCase()] = value;
  }
  return result;
}

function visualBlocks(document, block) {
  const blocks = [];
  for (const match of block.body.matchAll(VISUAL_BRIEF_BLOCK_RE)) {
    const start = block.body_range.start + match.index;
    const yamlOffset = match[0].indexOf(match[1]);
    const yamlStart = start + yamlOffset;
    blocks.push({
      yaml: match[1],
      range: span(document.source_text, start, start + match[0].length),
      yaml_range: span(document.source_text, yamlStart, yamlStart + match[1].length),
      yaml_start: yamlStart,
    });
  }
  return blocks;
}

function validateAuthorityAwareSemantics(document, block, authority, display, visualBrief, identity, count, restrictions, framePreset, fields, issues) {
  const visualField = oneField(fields, "VISUAL BRIEF");
  const visualSpan = visualField?.range || block.body_range;
  if (authority === "framed-image2") {
    if (!display.title) {
      issues.push(issue(document, block, "missing_framed_title", "Framed slides require a non-empty **TITLE**", {
        field: "TITLE",
        fieldSpan: oneField(fields, "TITLE")?.range || block.heading_text_range,
      }));
    }
    if (visualBrief) {
      for (const required of ["no-readable-text", "no-labels"]) {
        if (!visualBrief.negative_constraints.includes(required)) {
          issues.push(issue(document, block, "missing_framed_negative_constraint", `Framed VISUAL BRIEF must include ${required}`, {
            field: "VISUAL BRIEF",
            fieldSpan: visualSpan,
            expected: required,
          }));
        }
      }
    }
  } else if (framePreset !== null) {
    issues.push(issue(document, block, "pure_slide_frame_preset_forbidden", "Pure slides must not select FRAME PRESET", {
      field: "FRAME PRESET",
      fieldSpan: oneField(fields, "FRAME PRESET")?.range || block.heading_text_range,
    }));
  }

  const hasDisplay = Object.values(display).some((value) => value !== null);
  if (authority === "pure-image2" && hasDisplay && visualBrief) {
    for (const contradictory of ["no-readable-text", "no-labels"]) {
      if (visualBrief.negative_constraints.includes(contradictory)) {
        issues.push(issue(document, block, "pure_display_constraint_contradiction", `Pure slides with display content must not include ${contradictory}`, {
          field: "VISUAL BRIEF",
          fieldSpan: visualSpan,
          actual: contradictory,
        }));
      }
    }
  }
  if (identity && count !== "one") {
    issues.push(issue(document, block, "identity_subject_count_mismatch", "a selected VISUAL IDENTITY requires IDENTITY SUBJECT COUNT: one", {
      field: "IDENTITY SUBJECT COUNT",
      fieldSpan: oneField(fields, "IDENTITY SUBJECT COUNT")?.range || oneField(fields, "VISUAL IDENTITY")?.range || block.heading_text_range,
      expected: "one",
      actual: count,
    }));
  }
  if (!identity && count !== "none") {
    issues.push(issue(document, block, "identity_subject_count_mismatch", "an absent VISUAL IDENTITY requires IDENTITY SUBJECT COUNT: none", {
      field: "IDENTITY SUBJECT COUNT",
      fieldSpan: oneField(fields, "IDENTITY SUBJECT COUNT")?.range || block.heading_text_range,
      expected: "none",
      actual: count,
    }));
  }
  if (identity && restrictions === "no-identity-subject") {
    issues.push(issue(document, block, "identity_restriction_contradiction", "no-identity-subject cannot be combined with a selected VISUAL IDENTITY", {
      field: "SUBJECT RESTRICTIONS",
      fieldSpan: oneField(fields, "SUBJECT RESTRICTIONS")?.range || oneField(fields, "VISUAL IDENTITY")?.range || block.heading_text_range,
    }));
  }
}

function resolveVisualBrief(registry, context, document, block, visualBrief, issues) {
  if (!visualBrief) return null;
  if (!registry) {
    issues.push(issue(document, block, "visual_language_registry_required", "Page Authority parsing requires a trusted visual-language resolver", {
      field: "VISUAL BRIEF",
      fieldSpan: block.body_range,
    }));
    return null;
  }
  if (typeof registry.resolveSelection !== "function") {
    throw new TypeError("registry.resolveSelection must be a function when supplied to parsePageAuthoritySource");
  }
  try {
    return registry.resolveSelection(context);
  } catch (error) {
    const details = Array.isArray(error?.issues) ? error.issues : [];
    if (details.length > 0) {
      for (const detail of details) {
        issues.push(issue(document, block, detail.code || "unregistered_visual_selection", detail.message || String(detail), {
          field: "VISUAL BRIEF",
          fieldSpan: block.body_range,
        }));
      }
    } else {
      issues.push(issue(document, block, "unregistered_visual_selection", error?.message || "VISUAL BRIEF does not resolve in the visual language registry", {
        field: "VISUAL BRIEF",
        fieldSpan: block.body_range,
      }));
    }
    return null;
  }
}

/**
 * Parse Page Authority source into an immutable receipt. The trusted registry
 * resolver is supplied by visual-config; this module never reads visual-style.
 */
export function parsePageAuthoritySource(sourceText, { source = "slide-specifications.md", registry = null } = {}) {
  const marker = probeProductionMarker(sourceText, { source });
  if (marker.branch !== PAGE_AUTHORITY_IMAGE2_PIPELINE) {
    const markerIssues = marker.issues?.length ? marker.issues : [frontmatterIssue({
      source,
      frontmatter: { range: span(String(sourceText ?? ""), 0, 0) },
    }, "page_authority_marker_required", `production.pipeline must equal ${PAGE_AUTHORITY_IMAGE2_PIPELINE}`, {
      expected: PAGE_AUTHORITY_IMAGE2_PIPELINE,
      actual: marker.branch,
    })];
    throw new PageAuthoritySourceError(markerIssues);
  }

  let document;
  try {
    document = parseSlideDocument(sourceText, source);
  } catch (error) {
    if (error instanceof SlideDocumentError) throw new PageAuthoritySourceError(error.issues);
    throw error;
  }
  const issues = [...validateSlideDocument(document)];
  if (Object.hasOwn(document.frontmatter.metadata, "render")) {
    issues.push(frontmatterIssue(document, "legacy_page_authority_ingress", "frontmatter render is forbidden for page-authority-image2-v1", {
      actual: "render",
    }));
  }
  const defaultAuthority = marker.frontmatter.metadata.production.page_authority_default;
  const receipts = [];

  for (const block of document.slides) {
    const fields = scanSlideFields(document, block, issues);
    const authority = parseOptionalEnum(
      document,
      block,
      oneField(fields, "PAGE AUTHORITY"),
      PAGE_AUTHORITIES,
      defaultAuthority,
      issues
    );
    const display = displayFields(document, block, fields, issues);
    const frameField = oneField(fields, "FRAME PRESET");
    const framePreset = frameField
      ? parseOptionalEnum(document, block, frameField, [FRAMED_TEXT_PRESET], null, issues)
      : authority === "framed-image2" ? FRAMED_TEXT_PRESET : null;
    const parsedVisualBlocks = visualBlocks(document, block);
    const visualField = oneField(fields, "VISUAL BRIEF");
    if (!visualField) {
      issues.push(issue(document, block, "missing_visual_brief", "every Page Authority slide requires exactly one VISUAL BRIEF YAML mapping", {
        field: "VISUAL BRIEF",
        fieldSpan: block.heading_text_range,
      }));
    } else if (parsedVisualBlocks.length !== 1 || visualField.value.trim()) {
      issues.push(issue(document, block, "invalid_visual_brief_fence", "VISUAL BRIEF must be followed immediately by one ```yaml fenced mapping", {
        field: "VISUAL BRIEF",
        fieldSpan: visualField.range,
      }));
    }
    if (parsedVisualBlocks.length > 1) {
      for (const duplicate of parsedVisualBlocks.slice(1)) {
        issues.push(issue(document, block, "duplicate_page_authority_field", "slide may contain **VISUAL BRIEF** only once", {
          field: "VISUAL BRIEF",
          fieldSpan: duplicate.range,
        }));
      }
    }
    const visualBrief = parsedVisualBlocks.length === 1 ? parseVisualBrief(document, block, parsedVisualBlocks[0], issues) : null;
    const identity = parseIdentity(document, block, oneField(fields, "VISUAL IDENTITY"), issues);
    const count = parseOptionalEnum(
      document,
      block,
      oneField(fields, "IDENTITY SUBJECT COUNT"),
      IDENTITY_SUBJECT_COUNTS,
      "none",
      issues
    );
    const restrictions = parseOptionalEnum(
      document,
      block,
      oneField(fields, "SUBJECT RESTRICTIONS"),
      SUBJECT_RESTRICTIONS,
      "none",
      issues
    );
    validateAuthorityAwareSemantics(document, block, authority, display, visualBrief, identity, count, restrictions, framePreset, fields, issues);
    const compiledVisualBrief = resolveVisualBrief(registry, {
      authority,
      visual_brief: visualBrief,
      identity,
      identity_subject_count: count,
      subject_restrictions: restrictions,
    }, document, block, visualBrief, issues);

    const diagnostic_spans = {};
    for (const [label, values] of fields) {
      if (values[0]) diagnostic_spans[label] = values[0].range;
    }
    if (parsedVisualBlocks[0]) diagnostic_spans["VISUAL BRIEF"] = parsedVisualBlocks[0].range;
    receipts.push({
      slide_id: block.slide_id,
      authority,
      display,
      frame_preset: authority === "framed-image2" ? framePreset : null,
      text_frame: authority === "framed-image2" ? {
        preset: framePreset,
        kicker: display.kicker,
        title: display.title,
        subtitle: display.subtitle,
        callout: display.callout,
      } : null,
      visual_brief: visualBrief,
      ...(compiledVisualBrief ? { visual_language: compiledVisualBrief } : {}),
      visual_identity: identity,
      identity_subject_count: count,
      subject_restrictions: restrictions,
      diagnostic_spans,
    });
  }

  if (issues.length > 0) throw new PageAuthoritySourceError(issues);
  return deepFreeze({
    schema: PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA,
    pipeline: PAGE_AUTHORITY_IMAGE2_PIPELINE,
    page_authority_default: defaultAuthority,
    source_sha256: sha256(document.source_text),
    slides: receipts,
  });
}
