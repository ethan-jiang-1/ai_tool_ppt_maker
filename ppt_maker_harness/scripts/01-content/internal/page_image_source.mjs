import { createHash } from "node:crypto";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  probeProductionMarker,
} from "../../shared/run-bundle/production_marker.mjs";
import { PAGE_IMAGE_CLASSES } from "../../shared/run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_CORE_CONTENT_ROLES,
  PAGE_IMAGE_CORE_COPY_POLICIES,
  PageImageCoreError,
  normalizePageImageProviderContent,
} from "../../shared/page-image/page_image_core.mjs";
import {
  IDENTITY_SCHEME_MNEMONIC,
  SlideDocumentError,
  parseSlideDocument,
  validateSlideDocument,
} from "./slide_document.mjs";

export const PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA = "page-image-workflow-source";
export { PAGE_IMAGE_CLASSES };
export const PROVIDER_CONTENT_ROLES = PAGE_IMAGE_CORE_CONTENT_ROLES;
export const PROVIDER_CONTENT_COPY_POLICIES = PAGE_IMAGE_CORE_COPY_POLICIES;

const HEADER_FIELDS = Object.freeze(["KICKER", "TITLE", "SUBTITLE"]);
const INLINE_PAGE_IMAGE_FIELDS = Object.freeze([
  ...HEADER_FIELDS,
  "PAGE CLASS",
  "VISUAL IDENTITY",
  "IDENTITY SUBJECT COUNT",
  "SUBJECT RESTRICTIONS",
]);
const FENCED_PAGE_IMAGE_FIELDS = Object.freeze(["SLIDE BODY", "VISUAL BRIEF"]);
const PROHIBITED_PAGE_IMAGE_FIELDS = new Set([
  "WORKFLOW",
  "RENDER MODE",
  "IMAGE PROMPT",
  "PROMPT",
  "PROVIDER PROMPT",
  "BODY",
  "CALLOUT",
  "DISPLAY",
  "VISUAL SCENE",
  "TEXT FRAME",
  "LAYOUT",
  "COORDINATES",
  "POSITION",
  "X",
  "Y",
  "WIDTH",
  "HEIGHT",
  "FONT",
  "FONT SIZE",
]);
const VISUAL_BRIEF_REQUIRED_KEYS = Object.freeze(["recipe", "composition", "motifs", "negative_constraints"]);
const VISUAL_BRIEF_KEYS = Object.freeze([...VISUAL_BRIEF_REQUIRED_KEYS, "relationship"]);
const NEGATIVE_CONSTRAINTS = Object.freeze([
  "no-logo",
  "no-watermark",
]);
const FORBIDDEN_TEXT_FREE_VISUAL_CLAUSES = new Set(["no-readable-text", "no-labels"]);
const IDENTITY_SUBJECT_COUNTS = Object.freeze(["none", "one"]);
const SUBJECT_RESTRICTIONS = Object.freeze([
  "none",
  "no-generic-metal-robot",
  "no-identity-subject",
]);
const LOWER_KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISUAL_BRIEF_BLOCK_RE = /^\*\*VISUAL BRIEF\*\*:[ \t]*\r?\n```yaml\r?\n([\s\S]*?)^```(?:\r?\n|$)/gm;
const SLIDE_BODY_BLOCK_RE = /^\*\*SLIDE BODY\*\*:[ \t]*\r?\n```yaml\r?\n([\s\S]*?)^```(?:\r?\n|$)/gm;
const BOLD_FIELD_RE = /^\*\*([^*\r\n]+)\*\*:[ \t]*(.*?)\r?$/gm;

export class PageImageSourceError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((issue) => issue.message || String(issue)).join("; "));
    this.name = "PageImageSourceError";
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

function issue(document, block, code, message, { field, fieldSpan, expected, actual, repairHint } = {}) {
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
    repair_hint: repairHint || "repair the Page Image source field before requesting raw Image2 work",
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
    repair_hint: "repair the Page Image production marker before requesting raw Image2 work",
  };
}

function nonEmptyInlineValue(document, block, parsedField, issues) {
  const value = parsedField.value.trim();
  if (value) return value;
  issues.push(issue(document, block, "empty_page_image_field", `**${parsedField.label}** must have one non-empty inline value`, {
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
    if (field === "negative_constraints" && FORBIDDEN_TEXT_FREE_VISUAL_CLAUSES.has(value)) {
      issues.push(issue(
        document,
        block,
        "forbidden_text_free_visual_clause",
        `${field} must not include ${JSON.stringify(value)}; provider-visible source content is defined by SLIDE BODY`,
        { field: "VISUAL BRIEF", fieldSpan: nodeSpan(document, yamlStart, item, block.body_range), actual: value }
      ));
    }
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
  if (root.items.length < VISUAL_BRIEF_REQUIRED_KEYS.length || root.items.length > VISUAL_BRIEF_KEYS.length) {
    issues.push(issue(document, block, "invalid_visual_brief_keys", "VISUAL BRIEF must contain recipe, composition, motifs, negative_constraints, and optional trailing relationship", {
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
  for (const key of VISUAL_BRIEF_REQUIRED_KEYS) {
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
  const relationship = pairs.has("relationship")
    ? requirePlainId(document, block, pairs.get("relationship"), visualBlock.yaml_start, "relationship", issues)
    : null;
  return recipe && composition ? {
    recipe,
    composition,
    motifs,
    negative_constraints: negativeConstraints,
    ...(relationship ? { relationship } : {}),
  } : null;
}

function scanSlideFields(document, block, issues) {
  const fields = new Map();
  for (const match of block.body.matchAll(BOLD_FIELD_RE)) {
    const label = match[1].trim().replace(/\s+/g, " ").toUpperCase();
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
        issues.push(issue(document, block, "duplicate_page_image_field", `slide may contain **${label}** only once`, {
          field: label,
          fieldSpan: duplicate.range,
        }));
      }
    }
    const recognized = INLINE_PAGE_IMAGE_FIELDS.includes(label) || FENCED_PAGE_IMAGE_FIELDS.includes(label);
    for (const record of records) {
      if (PROHIBITED_PAGE_IMAGE_FIELDS.has(label)) {
        issues.push(issue(document, block, "prohibited_page_image_ingress", `**${label}** is not part of the current Page Image source grammar`, {
          field: label,
          fieldSpan: record.range,
          repairHint: "move provider-visible copy into SLIDE BODY.items and keep layout or prompt instructions out of source",
        }));
      } else if (!recognized) {
        issues.push(issue(document, block, "unsupported_page_image_field", `**${label}** is not a supported Page Image source field`, {
          field: label,
          fieldSpan: record.range,
          repairHint: "use the closed header, SLIDE BODY, and VISUAL BRIEF fields only",
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
    issues.push(issue(document, block, "invalid_page_image_enum", `**${field.label}** must equal ${allowed.join(" | ")}`, {
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

function headerFields(document, block, fields, issues) {
  const result = {};
  for (const label of HEADER_FIELDS) {
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

function fencedYamlBlocks(document, block, expression) {
  const blocks = [];
  for (const match of block.body.matchAll(expression)) {
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

function visualBlocks(document, block) {
  return fencedYamlBlocks(document, block, VISUAL_BRIEF_BLOCK_RE);
}

function slideBodyBlocks(document, block) {
  return fencedYamlBlocks(document, block, SLIDE_BODY_BLOCK_RE);
}

function directYamlString(document, block, node, yamlStart, field, issues) {
  if (!isScalar(node) || node.anchor || node.tag || typeof node.value !== "string") {
    issues.push(issue(document, block, "invalid_provider_content_scalar", `${field} must be a direct YAML string`, {
      field: "SLIDE BODY",
      fieldSpan: nodeSpan(document, yamlStart, node, block.body_range),
    }));
    return null;
  }
  return node.value;
}

function parseProviderContent(document, block, bodyBlock, issues) {
  if (!bodyBlock) return { items: [] };
  const issueCountAtStart = issues.length;
  let yamlDocument;
  try {
    yamlDocument = parseDocument(bodyBlock.yaml, {
      version: "1.2",
      schema: "core",
      uniqueKeys: true,
      merge: false,
      keepSourceTokens: true,
    });
  } catch (error) {
    issues.push(issue(document, block, "invalid_slide_body_yaml", `SLIDE BODY YAML could not be parsed: ${error.message}`, {
      field: "SLIDE BODY",
      fieldSpan: bodyBlock.yaml_range,
    }));
    return { items: [] };
  }
  for (const problem of [...yamlDocument.errors, ...yamlDocument.warnings]) {
    issues.push(issue(document, block, "invalid_slide_body_yaml", problem.message.split("\n")[0], {
      field: "SLIDE BODY",
      fieldSpan: bodyBlock.yaml_range,
    }));
  }
  const root = yamlDocument.contents;
  if (!isMap(root) || root.anchor || root.tag || containsYamlIndirection(root)) {
    issues.push(issue(document, block, "invalid_slide_body_mapping", "SLIDE BODY must be one direct untagged YAML mapping", {
      field: "SLIDE BODY",
      fieldSpan: bodyBlock.yaml_range,
    }));
    return { items: [] };
  }
  const rootPairs = new Map();
  for (const pair of root.items) {
    const key = directYamlString(document, block, pair.key, bodyBlock.yaml_start, "SLIDE BODY key", issues);
    if (!key) continue;
    if (key !== "items") {
      issues.push(issue(document, block, "unknown_slide_body_key", `SLIDE BODY contains unsupported key ${JSON.stringify(key)}`, {
        field: "SLIDE BODY",
        fieldSpan: nodeSpan(document, bodyBlock.yaml_start, pair.key, bodyBlock.yaml_range),
        actual: key,
        expected: ["items"],
      }));
    }
    if (rootPairs.has(key)) {
      issues.push(issue(document, block, "duplicate_slide_body_key", `SLIDE BODY repeats key ${JSON.stringify(key)}`, {
        field: "SLIDE BODY",
        fieldSpan: nodeSpan(document, bodyBlock.yaml_start, pair.key, bodyBlock.yaml_range),
      }));
    }
    rootPairs.set(key, pair.value);
  }
  if (rootPairs.size !== 1 || !rootPairs.has("items")) {
    issues.push(issue(document, block, "invalid_slide_body_keys", "SLIDE BODY must contain exactly one items key", {
      field: "SLIDE BODY",
      fieldSpan: bodyBlock.yaml_range,
      expected: ["items"],
    }));
  }
  const itemNodes = rootPairs.get("items");
  if (!isSeq(itemNodes) || itemNodes.anchor || itemNodes.tag || containsYamlIndirection(itemNodes)) {
    issues.push(issue(document, block, "invalid_slide_body_items", "SLIDE BODY.items must be an ordered direct YAML sequence", {
      field: "SLIDE BODY",
      fieldSpan: nodeSpan(document, bodyBlock.yaml_start, itemNodes, bodyBlock.yaml_range),
    }));
    return { items: [] };
  }
  const items = [];
  for (const [index, item] of itemNodes.items.entries()) {
    const itemPath = `SLIDE BODY.items[${index}]`;
    if (!isMap(item) || item.anchor || item.tag || containsYamlIndirection(item)) {
      issues.push(issue(document, block, "invalid_slide_body_item", `${itemPath} must be one direct untagged mapping`, {
        field: "SLIDE BODY",
        fieldSpan: nodeSpan(document, bodyBlock.yaml_start, item, bodyBlock.yaml_range),
      }));
      continue;
    }
    const pairs = new Map();
    for (const pair of item.items) {
      const key = directYamlString(document, block, pair.key, bodyBlock.yaml_start, `${itemPath} key`, issues);
      if (!key) continue;
      if (!["role", "literal", "copy_policy"].includes(key)) {
        issues.push(issue(document, block, "unknown_slide_body_item_key", `${itemPath} contains unsupported key ${JSON.stringify(key)}`, {
          field: "SLIDE BODY",
          fieldSpan: nodeSpan(document, bodyBlock.yaml_start, pair.key, bodyBlock.yaml_range),
          actual: key,
          expected: ["role", "literal", "copy_policy"],
        }));
      }
      if (pairs.has(key)) {
        issues.push(issue(document, block, "duplicate_slide_body_item_key", `${itemPath} repeats key ${JSON.stringify(key)}`, {
          field: "SLIDE BODY",
          fieldSpan: nodeSpan(document, bodyBlock.yaml_start, pair.key, bodyBlock.yaml_range),
        }));
      }
      pairs.set(key, pair.value);
    }
    for (const key of ["role", "literal"]) {
      if (!pairs.has(key)) {
        issues.push(issue(document, block, "missing_slide_body_item_key", `${itemPath} is missing ${key}`, {
          field: "SLIDE BODY",
          fieldSpan: nodeSpan(document, bodyBlock.yaml_start, item, bodyBlock.yaml_range),
          expected: key,
        }));
      }
    }
    const role = directYamlString(document, block, pairs.get("role"), bodyBlock.yaml_start, `${itemPath}.role`, issues);
    const literal = directYamlString(document, block, pairs.get("literal"), bodyBlock.yaml_start, `${itemPath}.literal`, issues);
    const hasCopyPolicy = pairs.has("copy_policy");
    const policy = hasCopyPolicy
      ? directYamlString(document, block, pairs.get("copy_policy"), bodyBlock.yaml_start, `${itemPath}.copy_policy`, issues)
      : null;
    if (role !== null && literal !== null && (!hasCopyPolicy || policy !== null)) {
      items.push({ role, literal, ...(hasCopyPolicy ? { copy_policy: policy } : {}) });
    }
  }
  if (issues.length !== issueCountAtStart) return { items: [] };
  try {
    return normalizePageImageProviderContent({ items });
  } catch (error) {
    const coreError = error instanceof PageImageCoreError ? error : null;
    const code = {
      page_image_core_provider_content_limit: "slide_body_item_limit_exceeded",
      page_image_core_provider_content_role_invalid: "invalid_provider_content_role",
      page_image_core_provider_content_literal_invalid: "invalid_provider_content_literal",
      page_image_core_provider_content_policy_invalid: "invalid_provider_content_copy_policy",
      page_image_core_provider_content_adaptation_invalid: "provider_content_adaptation_role_forbidden",
      page_image_core_provider_content_adaptation_limit: "provider_content_adaptation_limit_exceeded",
    }[coreError?.code] || "invalid_provider_content";
    issues.push(issue(document, block, code, coreError?.message || "SLIDE BODY.items is invalid", {
      field: "SLIDE BODY",
      fieldSpan: bodyBlock.yaml_range,
      ...(coreError?.details?.actual !== undefined ? { actual: coreError.details.actual } : {}),
      ...(coreError?.details?.expected !== undefined ? { expected: coreError.details.expected } : {}),
    }));
    return { items: [] };
  }
}

function headerPolicy(document, block, workflow, header, fields, issues) {
  if (workflow === "framed") {
    if (!header.title) {
      issues.push(issue(document, block, "missing_framed_title", "Framed slides require a non-empty **TITLE**", {
        field: "TITLE",
        fieldSpan: oneField(fields, "TITLE")?.range || block.heading_text_range,
      }));
    }
    return {
      local_header: { ...header },
    };
  }
  return { provider_visible: { ...header } };
}

function validateVisualSemantics(document, block, identity, count, restrictions, fields, issues) {
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
    issues.push(issue(document, block, "visual_language_registry_required", "Page Image parsing requires a trusted visual-language resolver", {
      field: "VISUAL BRIEF",
      fieldSpan: block.body_range,
    }));
    return null;
  }
  if (typeof registry.resolveSelection !== "function") {
    throw new TypeError("registry.resolveSelection must be a function when supplied to parsePageImageSource");
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
 * Parse Page Image source into an immutable receipt. The trusted registry
 * resolver is supplied by visual-config; this module never reads visual-style.
 */
export function parsePageImageSource(sourceText, { source = "slide-specifications.md", registry = null } = {}) {
  const marker = probeProductionMarker(sourceText, { source });
  if (marker.branch !== PAGE_IMAGE_WORKFLOW_PIPELINE) {
    const markerIssues = marker.issues?.length ? marker.issues : [frontmatterIssue({
      source,
      frontmatter: { range: span(String(sourceText ?? ""), 0, 0) },
    }, "page_image_marker_required", "production.pipeline must select the current Page Image Workflow protocol", {
      expected: PAGE_IMAGE_WORKFLOW_PIPELINE,
      actual: marker.branch,
    })];
    throw new PageImageSourceError(markerIssues);
  }
  const workflow = marker.frontmatter.metadata.production.workflow;

  let document;
  try {
    document = parseSlideDocument(sourceText, source);
  } catch (error) {
    if (error instanceof SlideDocumentError) throw new PageImageSourceError(error.issues);
    throw error;
  }
  const issues = [...validateSlideDocument(document)];
  if (document.frontmatter.metadata?.identity?.scheme !== IDENTITY_SCHEME_MNEMONIC) {
    issues.push(frontmatterIssue(
      document,
      "current_identity_required",
      "identity.scheme must select the current mnemonic identity before Page Image receipt creation",
      {
        expected: IDENTITY_SCHEME_MNEMONIC,
        actual: document.frontmatter.metadata?.identity?.scheme,
      },
    ));
  }
  if (Object.hasOwn(document.frontmatter.metadata, "render")) {
    issues.push(frontmatterIssue(document, "prohibited_page_image_ingress", "frontmatter render is not part of the current Page Image source grammar", {
      actual: "render",
    }));
  }
  const receipts = [];

  for (const block of document.slides) {
    const fields = scanSlideFields(document, block, issues);
    const header = headerFields(document, block, fields, issues);
    const pageClass = parseOptionalEnum(
      document,
      block,
      oneField(fields, "PAGE CLASS"),
      PAGE_IMAGE_CLASSES,
      "standard",
      issues,
    );
    const normalizedHeaderPolicy = headerPolicy(document, block, workflow, header, fields, issues);
    const parsedVisualBlocks = visualBlocks(document, block);
    const visualField = oneField(fields, "VISUAL BRIEF");
    if (!visualField) {
      issues.push(issue(document, block, "missing_visual_brief", "every Page Image slide requires exactly one VISUAL BRIEF YAML mapping", {
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
        issues.push(issue(document, block, "duplicate_page_image_field", "slide may contain **VISUAL BRIEF** only once", {
          field: "VISUAL BRIEF",
          fieldSpan: duplicate.range,
        }));
      }
    }
    const visualBrief = parsedVisualBlocks.length === 1 ? parseVisualBrief(document, block, parsedVisualBlocks[0], issues) : null;
    const parsedSlideBodyBlocks = slideBodyBlocks(document, block);
    const slideBodyField = oneField(fields, "SLIDE BODY");
    if (slideBodyField && (parsedSlideBodyBlocks.length !== 1 || slideBodyField.value.trim())) {
      issues.push(issue(document, block, "invalid_slide_body_fence", "SLIDE BODY must be followed immediately by one ```yaml fenced mapping", {
        field: "SLIDE BODY",
        fieldSpan: slideBodyField.range,
      }));
    }
    if (parsedSlideBodyBlocks.length > 1) {
      for (const duplicate of parsedSlideBodyBlocks.slice(1)) {
        issues.push(issue(document, block, "duplicate_page_image_field", "slide may contain **SLIDE BODY** only once", {
          field: "SLIDE BODY",
          fieldSpan: duplicate.range,
        }));
      }
    }
    const providerContent = parsedSlideBodyBlocks.length === 1
      ? parseProviderContent(document, block, parsedSlideBodyBlocks[0], issues)
      : { items: [] };
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
    validateVisualSemantics(document, block, identity, count, restrictions, fields, issues);
    const compiledVisualBrief = resolveVisualBrief(registry, {
      workflow,
      page_class: pageClass,
      header_policy: normalizedHeaderPolicy,
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
    if (parsedSlideBodyBlocks[0]) diagnostic_spans["SLIDE BODY"] = parsedSlideBodyBlocks[0].range;
    receipts.push({
      slide_id: block.slide_id,
      position: block.position,
      page_class: pageClass,
      provider_content: providerContent,
      header_policy: normalizedHeaderPolicy,
      visual_brief: visualBrief,
      ...(compiledVisualBrief ? { visual_language: compiledVisualBrief } : {}),
      visual_identity: identity,
      identity_subject_count: count,
      subject_restrictions: restrictions,
      diagnostic_spans,
    });
  }

  if (issues.length > 0) throw new PageImageSourceError(issues);
  return deepFreeze({
    schema: PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA,
    pipeline: PAGE_IMAGE_WORKFLOW_PIPELINE,
    workflow,
    source_sha256: sha256(document.source_text),
    slides: receipts,
  });
}
