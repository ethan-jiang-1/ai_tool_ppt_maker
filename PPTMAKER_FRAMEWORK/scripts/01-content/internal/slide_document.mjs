import { createHash } from "node:crypto";
import { basename, isAbsolute } from "node:path";
import { parseDocument } from "yaml";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import {
  normalizeSpokenKey,
  parseMnemonicSlideId,
  resolveSlideBindings,
  validateNewSlideId,
} from "./slide_ids.mjs";

export const SLIDE_DOCUMENT_SCHEMA_VERSION = 1;
export const SLIDE_EDIT_SCHEMA_VERSION = 1;
export const IDENTITY_SCHEME_MNEMONIC_V1 = "mnemonic-v1";

const SLIDE_LIKE_HEADING_RE = /^##[ \t]+Slide\b/i;
const NUMERIC_SLIDE_LIKE_HEADING_RE = /^##[ \t]+Slide\b.*(?:^|[^A-Za-z0-9])\d+(?:$|[^A-Za-z0-9])/i;
const LEVEL_TWO_HEADING_RE = /^##(?:[ \t]+|$)/;
const FORMAL_SLIDE_HEADING_PATTERNS = [
  /^##[ \t]+Slide[ \t]+(\d+)[ \t]*([:：\-–—])[ \t]*`([^`]*)`[ \t]*$/,
  /^##[ \t]+Slide[ \t]+(\d+)[ \t]*([:：\-–—])[ \t]*([^`]*)[ \t]*$/,
];

export class SlideDocumentError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "SlideDocumentError";
    this.issues = issues;
  }
}

export class SlideEditError extends Error {
  constructor(message, code = "invalid_slide_edit", details = {}) {
    super(message);
    this.name = "SlideEditError";
    this.code = code;
    Object.assign(this, details);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sourceLocator(source) {
  if (source && typeof source === "object") {
    return String(source.relative_path || source.path || source.label || "slide-specifications.md")
      .replaceAll("\\", "/");
  }
  const raw = String(source || "slide-specifications.md").replaceAll("\\", "/");
  return isAbsolute(raw) ? basename(raw) : raw.replace(/^\.\//, "");
}

function scanLines(text) {
  const lines = [];
  let start = 0;
  let line = 1;
  while (start < text.length) {
    const newline = text.indexOf("\n", start);
    const end = newline === -1 ? text.length : newline + 1;
    let contentEnd = newline === -1 ? end : newline;
    if (contentEnd > start && text[contentEnd - 1] === "\r") contentEnd -= 1;
    lines.push({
      line,
      start,
      end,
      content_end: contentEnd,
      content: text.slice(start, contentEnd),
      newline: text.slice(contentEnd, end),
    });
    start = end;
    line += 1;
  }
  if (text.length === 0) {
    lines.push({ line: 1, start: 0, end: 0, content_end: 0, content: "", newline: "" });
  }
  return lines;
}

function byteOffset(text, charOffset) {
  return Buffer.byteLength(text.slice(0, charOffset), "utf8");
}

function makeRange(text, start, end, startLine, endLine = startLine) {
  return {
    start,
    end,
    byte_start: byteOffset(text, start),
    byte_end: byteOffset(text, end),
    start_line: startLine,
    end_line: endLine,
  };
}

function lineAtOffset(lines, offset) {
  let low = 0;
  let high = lines.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const current = lines[mid];
    if (offset < current.start) high = mid - 1;
    else if (offset >= current.end && current.end !== current.start) low = mid + 1;
    else return current.line;
  }
  return lines[Math.max(0, Math.min(lines.length - 1, low))]?.line || 1;
}

function parseHeading(content) {
  for (const pattern of FORMAL_SLIDE_HEADING_PATTERNS) {
    const match = content.match(pattern);
    if (!match) continue;
    const numberToken = match[1];
    const slideId = match[3].trim();
    const numberStart = content.indexOf(numberToken, content.indexOf("Slide") + 5);
    const idStart = content.indexOf(match[3], numberStart + numberToken.length);
    return {
      number: Number.parseInt(numberToken, 10),
      number_token: numberToken,
      number_start: numberStart,
      number_end: numberStart + numberToken.length,
      delimiter: match[2],
      slide_id: slideId,
      id_start: idStart + match[3].indexOf(slideId),
      id_end: idStart + match[3].indexOf(slideId) + slideId.length,
      backticked: content.includes("`"),
    };
  }
  return null;
}

function parseFrontmatter(text, lines) {
  const bomLength = text.startsWith("\uFEFF") ? 1 : 0;
  const firstLine = lines.find((line) => line.start === bomLength) || lines[0];
  if (!firstLine || firstLine.content !== "---") {
    return {
      present: false,
      raw: "",
      content: "",
      metadata: {},
      yaml_document: null,
      yaml_issues: [],
      range: makeRange(text, 0, 0, 1),
      content_range: makeRange(text, 0, 0, 1),
    };
  }

  const openingIndex = lines.indexOf(firstLine);
  let closingLine = null;
  for (let index = openingIndex + 1; index < lines.length; index += 1) {
    if (lines[index].content === "---") {
      closingLine = lines[index];
      break;
    }
  }
  if (!closingLine) {
    const issue = {
      severity: "ERROR",
      code: "unclosed_frontmatter",
      message: "leading YAML frontmatter is not closed with '---'",
      source: { line: firstLine.line, column: 1 },
    };
    throw new SlideDocumentError(issue.message, [issue]);
  }

  const contentStart = firstLine.end;
  const contentEnd = closingLine.start;
  const content = text.slice(contentStart, contentEnd);
  const yamlDocument = parseDocument(content, { uniqueKeys: true });
  const yamlIssues = [...yamlDocument.errors, ...yamlDocument.warnings].map((problem) => ({
    severity: "ERROR",
    code: "invalid_frontmatter_yaml",
    message: problem.message.split("\n")[0],
    source: { line: firstLine.line + 1, column: 1 },
  }));
  let metadata = {};
  if (yamlIssues.length === 0) {
    metadata = yamlDocument.toJS() ?? {};
  }
  return {
    present: true,
    raw: text.slice(0, closingLine.end),
    content,
    metadata,
    yaml_document: yamlDocument,
    yaml_issues: yamlIssues,
    range: makeRange(text, 0, closingLine.end, 1, closingLine.line),
    content_range: makeRange(
      text,
      contentStart,
      contentEnd,
      firstLine.line + 1,
      Math.max(firstLine.line + 1, closingLine.line - 1)
    ),
  };
}

function extractTitle(body) {
  const match = String(body).match(/^\*\*TITLE\*\*:[ \t]*(.*?)[ \t]*$/m);
  return match ? match[1].trim() : "";
}

function scanStructuredBodyFields(sourceText, body, bodyStart, lines) {
  const fields = [];
  const re = /^\*\*SLIDE BODY\*\*:\r?\n```yaml\r?\n([\s\S]*?)^```(?:\r?\n|$)/gm;
  let match;
  while ((match = re.exec(body)) !== null) {
    const start = bodyStart + match.index;
    const yamlOffset = match[0].indexOf(match[1]);
    const yamlStart = start + yamlOffset;
    fields.push({
      raw: match[0],
      yaml: match[1],
      range: makeRange(
        sourceText,
        start,
        start + match[0].length,
        lineAtOffset(lines, start),
        lineAtOffset(lines, Math.max(start, start + match[0].length - 1))
      ),
      yaml_range: makeRange(
        sourceText,
        yamlStart,
        yamlStart + match[1].length,
        lineAtOffset(lines, yamlStart),
        lineAtOffset(lines, Math.max(yamlStart, yamlStart + match[1].length - 1))
      ),
    });
  }
  return fields;
}

/**
 * Parse one slide source while retaining all character and UTF-8 byte ranges.
 */
export function parseSlideDocument(text, source = "slide-specifications.md") {
  const sourceText = String(text ?? "");
  const lines = scanLines(sourceText);
  const frontmatter = parseFrontmatter(sourceText, lines);
  const bodyStart = frontmatter.range.end;
  const headings = [];
  let slideListStarted = false;
  let epilogueStart = null;

  for (const line of lines) {
    if (line.start < bodyStart) continue;
    const heading = parseHeading(line.content);
    if (heading) {
      if (epilogueStart !== null) continue;
      slideListStarted = true;
      headings.push({ line, heading });
      continue;
    }
    const malformedSlideCandidate = slideListStarted
      ? SLIDE_LIKE_HEADING_RE.test(line.content)
      : NUMERIC_SLIDE_LIKE_HEADING_RE.test(line.content);
    if (malformedSlideCandidate) {
      const issue = {
        severity: "ERROR",
        code: "malformed_slide_heading",
        message:
          `malformed slide heading at line ${line.line}; expected ` +
          "## Slide NN: `slide_id`",
        source: {
          path: sourceLocator(source),
          line: line.line,
          column: 1,
          range: makeRange(sourceText, line.start, line.content_end, line.line),
        },
        repair_hint: "fix the heading grammar before structural editing",
      };
      throw new SlideDocumentError(issue.message, [issue]);
    }
    if (!slideListStarted || !LEVEL_TWO_HEADING_RE.test(line.content)) continue;
    epilogueStart = line.start;
  }

  const firstSlideStart = headings[0]?.line.start ?? (epilogueStart ?? sourceText.length);
  const blocks = headings.map(({ line, heading }, index) => {
    const nextStart = headings[index + 1]?.line.start ?? epilogueStart ?? sourceText.length;
    const bodyBlockStart = line.end;
    const raw = sourceText.slice(line.start, nextStart);
    const body = sourceText.slice(bodyBlockStart, nextStart);
    const structuredBodyFields = scanStructuredBodyFields(sourceText, body, bodyBlockStart, lines);
    return {
      slide_id: heading.slide_id,
      id: heading.slide_id,
      position: index + 1,
      heading_number: heading.number,
      heading_number_token: heading.number_token,
      delimiter: heading.delimiter,
      backticked: heading.backticked,
      title: extractTitle(body),
      raw,
      body,
      structured_body_fields: structuredBodyFields,
      range: makeRange(
        sourceText,
        line.start,
        nextStart,
        line.line,
        lineAtOffset(lines, Math.max(line.start, nextStart - 1))
      ),
      heading_range: makeRange(sourceText, line.start, line.end, line.line),
      heading_text_range: makeRange(sourceText, line.start, line.content_end, line.line),
      heading_number_range: makeRange(
        sourceText,
        line.start + heading.number_start,
        line.start + heading.number_end,
        line.line
      ),
      id_range: makeRange(
        sourceText,
        line.start + heading.id_start,
        line.start + heading.id_end,
        line.line
      ),
      body_range: makeRange(
        sourceText,
        bodyBlockStart,
        nextStart,
        line.line + 1,
        lineAtOffset(lines, Math.max(bodyBlockStart, nextStart - 1))
      ),
    };
  });

  const preambleStart = frontmatter.range.end;
  const preambleEnd = firstSlideStart;
  const finalEpilogueStart = epilogueStart ?? sourceText.length;
  return {
    schema_version: SLIDE_DOCUMENT_SCHEMA_VERSION,
    source: sourceLocator(source),
    source_text: sourceText,
    newline: sourceText.includes("\r\n") ? "\r\n" : "\n",
    sha256: sha256(sourceText),
    frontmatter,
    preamble: {
      raw: sourceText.slice(preambleStart, preambleEnd),
      range: makeRange(
        sourceText,
        preambleStart,
        preambleEnd,
        lineAtOffset(lines, preambleStart),
        lineAtOffset(lines, Math.max(preambleStart, preambleEnd - 1))
      ),
    },
    slides: blocks,
    epilogue: {
      raw: sourceText.slice(finalEpilogueStart),
      range: makeRange(
        sourceText,
        finalEpilogueStart,
        sourceText.length,
        lineAtOffset(lines, finalEpilogueStart),
        lineAtOffset(lines, Math.max(finalEpilogueStart, sourceText.length - 1))
      ),
    },
  };
}

export function serializeSlideDocument(document) {
  return document.source_text;
}

function issueForBlock(document, block, code, message, extra = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: {
      path: document.source,
      line: block.heading_range.start_line,
      column: 1,
      range: block.heading_text_range,
    },
    subject: { kind: "slide", id: block.slide_id || null },
    ...extra,
  };
}

function identityMarkerIssues(document) {
  const issues = [...document.frontmatter.yaml_issues].map((issue) => ({
    ...issue,
    source: { ...issue.source, path: document.source },
  }));
  if (issues.length > 0) return { issues, scheme: null };
  const metadata = document.frontmatter.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    issues.push({
      severity: "ERROR",
      code: "invalid_frontmatter_root",
      message: "frontmatter root must be a mapping",
      source: { path: document.source, line: 1, column: 1 },
    });
    return { issues, scheme: null };
  }
  if (!Object.prototype.hasOwnProperty.call(metadata, "identity")) {
    return { issues, scheme: null };
  }
  const identity = metadata.identity;
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    issues.push({
      severity: "ERROR",
      code: "invalid_identity_marker",
      message: "frontmatter identity must be a mapping with scheme: mnemonic-v1",
      source: { path: document.source, line: 1, column: 1 },
    });
    return { issues, scheme: null };
  }
  const keys = Object.keys(identity);
  for (const key of keys) {
    if (key !== "scheme") {
      issues.push({
        severity: "ERROR",
        code: "unknown_identity_key",
        message: `unknown identity key ${JSON.stringify(key)}`,
        source: { path: document.source, line: 1, column: 1 },
      });
    }
  }
  if (identity.scheme !== IDENTITY_SCHEME_MNEMONIC_V1) {
    issues.push({
      severity: "ERROR",
      code: "unsupported_identity_scheme",
      message: "identity.scheme must equal mnemonic-v1",
      source: { path: document.source, line: 1, column: 1 },
    });
    return { issues, scheme: null };
  }
  return { issues, scheme: IDENTITY_SCHEME_MNEMONIC_V1 };
}

/**
 * Validate source invariants. Explicit whole-page sources keep legacy read compatibility;
 * mnemonic-v1 is an assertion that every current ID follows the strict syntax.
 */
export function validateSlideDocument(document, { historyIds = [] } = {}) {
  const issues = [];
  const marker = identityMarkerIssues(document);
  issues.push(...marker.issues);
  if (document.slides.length === 0) {
    issues.push({
      severity: "ERROR",
      code: "missing_slide_blocks",
      message: "source contains no slide blocks",
      source: { path: document.source, line: 1, column: 1 },
    });
    return issues;
  }

  const ids = new Map();
  const spoken = new Map();
  for (const block of document.slides) {
    const id = block.slide_id;
    if (!id) {
      issues.push(
        issueForBlock(document, block, "empty_slide_id", "slide heading has an empty slide ID", {
          repair_hint: "an Agent must supply a durable SUBJECT + MOVE mnemonic ID",
        })
      );
    } else {
      if (!ids.has(id)) ids.set(id, []);
      ids.get(id).push(block);
      const spokenKey = normalizeSpokenKey(id);
      if (!spoken.has(spokenKey)) spoken.set(spokenKey, []);
      spoken.get(spokenKey).push(block);
      if (marker.scheme === IDENTITY_SCHEME_MNEMONIC_V1) {
        const parsed = parseMnemonicSlideId(id);
        for (const problem of parsed.problems) {
          issues.push(
            issueForBlock(
              document,
              block,
              "invalid_mnemonic_id",
              `slide ID ${JSON.stringify(id)} ${problem}`
            )
          );
        }
      }
    }

    const expected = String(block.position).padStart(2, "0");
    if (block.heading_number_token !== expected) {
      issues.push(
        issueForBlock(
          document,
          block,
          "noncanonical_heading_position",
          `slide heading number ${JSON.stringify(block.heading_number_token)} does not match ` +
            `physical position ${expected}`,
          {
            actual: block.heading_number_token,
            expected,
            repair_hint: "run ppt_flow slides normalize",
          }
        )
      );
    }
  }

  for (const [id, blocks] of ids) {
    if (blocks.length <= 1) continue;
    for (const block of blocks) {
      issues.push(
        issueForBlock(
          document,
          block,
          "duplicate_slide_id",
          `slide ID ${JSON.stringify(id)} appears ${blocks.length} times`,
          { actual: blocks.length, expected: 1 }
        )
      );
    }
  }
  for (const [spokenKey, blocks] of spoken) {
    const distinct = [...new Set(blocks.map((block) => block.slide_id))];
    if (blocks.length <= 1 || distinct.length <= 1) continue;
    for (const block of blocks) {
      issues.push(
        issueForBlock(
          document,
          block,
          "duplicate_spoken_key",
          `spoken key ${JSON.stringify(spokenKey)} is shared by: ${distinct.join(", ")}`,
          { conflicts: distinct }
        )
      );
    }
  }

  // Historical IDs reserve creation, but their continued current use is legal.
  const historicalSpoken = new Map();
  for (const id of historyIds || []) {
    const key = normalizeSpokenKey(id);
    if (!historicalSpoken.has(key)) historicalSpoken.set(key, new Set());
    historicalSpoken.get(key).add(String(id));
  }
  for (const block of document.slides) {
    const history = historicalSpoken.get(normalizeSpokenKey(block.slide_id));
    if (!history || history.has(block.slide_id)) continue;
    issues.push(
      issueForBlock(
        document,
        block,
        "historical_spoken_key_conflict",
        `slide ID ${JSON.stringify(block.slide_id)} conflicts with historical ID(s): ` +
          [...history].sort().join(", ")
      )
    );
  }
  return issues;
}

export function validateSlideDocuments(documents, options = {}) {
  return (documents || []).flatMap((document) => validateSlideDocument(document, options));
}

export function canonicalSlideEditJson(value) {
  return canonicalJson(value);
}

export function slideEditMutationPayload(transaction) {
  return {
    schema_version: transaction.schema_version,
    source: transaction.source,
    base_spec_sha256: transaction.base_spec_sha256,
    publication: transaction.publication,
    bindings: transaction.bindings || [],
    operations: transaction.operations || [],
    before_order: transaction.before_order || [],
    after_order: transaction.after_order || [],
    structured_reference_changes: transaction.structured_reference_changes || [],
    warnings: transaction.warnings || [],
  };
}

export function computeSlideEditPlanSha256(transaction) {
  return sha256(canonicalJson(slideEditMutationPayload(transaction)));
}

export function verifySlideEditPlanHash(transaction) {
  return (
    typeof transaction?.plan_sha256 === "string" &&
    transaction.plan_sha256 === computeSlideEditPlanSha256(transaction)
  );
}

function scanPageReferenceWarnings(document) {
  const warnings = [];
  const patterns = [
    { kind: "english_page_reference", re: /\b(?:page|slide)[ \t]+\d+\b/gi },
    { kind: "chinese_page_reference", re: /第[ \t]*\d+[ \t]*页/g },
  ];
  const regions = [document.preamble, ...document.slides.map((slide) => ({ raw: slide.body, range: slide.body_range })), document.epilogue];
  for (const region of regions) {
    for (const { kind, re } of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(region.raw)) !== null) {
        const absolute = region.range.start + match.index;
        const before = document.source_text.slice(0, absolute);
        const lastNewline = Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r"));
        const line = before.split(/\r\n|\n|\r/).length;
        warnings.push({
          code: "natural_language_page_reference",
          kind,
          match: match[0],
          source: {
            path: document.source,
            line,
            column: absolute - lastNewline,
            byte_offset: byteOffset(document.source_text, absolute),
          },
          message: `review page reference ${JSON.stringify(match[0])} after structural editing`,
        });
      }
    }
  }
  return warnings.sort((left, right) =>
    left.source.path.localeCompare(right.source.path) ||
    left.source.line - right.source.line ||
    left.source.column - right.source.column ||
    left.match.localeCompare(right.match)
  );
}

function headerLockIds(document) {
  const value = document.frontmatter.metadata?.render?.["header-lock"];
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function flattenSelectors(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).map((item) => String(item));
}

function normalizePlanArguments(selectors, operations, history, options) {
  if (selectors && !Array.isArray(selectors) && typeof selectors === "object") {
    const config = selectors;
    return {
      selectors: flattenSelectors(config.selectors),
      operations: config.operations || [],
      historyIds: config.historyIds || config.history_ids || [],
      options: config,
    };
  }
  const historyIds = Array.isArray(history)
    ? history
    : history?.ids || history?.historyIds || history?.history_ids || [];
  return { selectors: flattenSelectors(selectors), operations: operations || [], historyIds, options: options || {} };
}

function parseInsertedBlock(blockText, source) {
  const insertedDocument = parseSlideDocument(String(blockText ?? ""), source);
  if (
    insertedDocument.slides.length !== 1 ||
    insertedDocument.frontmatter.present ||
    insertedDocument.preamble.raw.trim() ||
    insertedDocument.epilogue.raw.trim()
  ) {
    throw new SlideEditError(
      "insert requires exactly one complete slide block with no frontmatter or epilogue",
      "invalid_insert_block"
    );
  }
  return insertedDocument.slides[0];
}

function bindingKey(token) {
  return String(token);
}

/**
 * Compile selector-bearing edits into formal-ID operations against one snapshot.
 */
export function planSlideEdit(document, selectors = [], operations = [], history = [], options = {}) {
  const args = normalizePlanArguments(selectors, operations, history, options);
  const sourceIssues = validateSlideDocument(document).filter((issue) => issue.severity === "ERROR");
  const nonHeadingIssues = sourceIssues.filter(
    (issue) => issue.code !== "noncanonical_heading_position"
  );
  if (nonHeadingIssues.length > 0) {
    throw new SlideEditError("slide source is invalid", "source_validation", { issues: nonHeadingIssues });
  }
  const requestedOperations = Array.isArray(args.operations) ? args.operations : [];
  if (requestedOperations.length === 0) {
    throw new SlideEditError("at least one slide edit operation is required", "missing_operation");
  }

  const rawTokens = [...args.selectors];
  for (const operation of requestedOperations) {
    if (operation.selector != null) rawTokens.push(...flattenSelectors(operation.selector));
    if (operation.selectors != null) rawTokens.push(...flattenSelectors(operation.selectors));
    if (operation.after != null) rawTokens.push(String(operation.after));
    if (operation.before != null) rawTokens.push(String(operation.before));
    if (operation.anchor != null) rawTokens.push(String(operation.anchor));
  }
  const bindings = resolveSlideBindings(rawTokens, document.slides);
  const bindingQueues = new Map();
  for (const binding of bindings) {
    const key = bindingKey(binding.token);
    if (!bindingQueues.has(key)) bindingQueues.set(key, []);
    bindingQueues.get(key).push(binding);
  }
  const takeBinding = (token) => {
    const queue = bindingQueues.get(bindingKey(token));
    if (!queue || queue.length === 0) {
      throw new SlideEditError(`no snapshot binding for selector ${JSON.stringify(token)}`, "missing_binding");
    }
    return queue.shift();
  };

  // Global selectors are consumed only by an operation that omits its own target.
  const globalBindings = args.selectors.map((token) => takeBinding(token));
  const formalOperations = [];
  const currentIds = document.slides.map((slide) => slide.slide_id);
  const insertedBlocks = new Map();

  for (const operation of requestedOperations) {
    const op = String(operation.op || operation.type || "").toLowerCase();
    if (op === "normalize") {
      formalOperations.push({ op: "normalize" });
      continue;
    }
    if (op === "delete") {
      const tokens = operation.selectors != null
        ? flattenSelectors(operation.selectors)
        : operation.selector != null
          ? flattenSelectors(operation.selector)
          : [];
      const targets = operation.slide_id
        ? [{ slide_id: String(operation.slide_id) }]
        : tokens.length > 0
          ? tokens.map((token) => takeBinding(token))
          : globalBindings;
      if (targets.length === 0) {
        throw new SlideEditError("delete requires at least one selector", "missing_selector");
      }
      for (const target of targets) formalOperations.push({ op: "delete", slide_id: target.slide_id });
      continue;
    }
    if (op === "move") {
      const token = operation.selector ?? operation.selectors?.[0];
      const target = operation.slide_id
        ? { slide_id: String(operation.slide_id) }
        : token != null
          ? takeBinding(String(token))
          : globalBindings[0];
      if (!target) throw new SlideEditError("move requires a target selector", "missing_selector");
      const result = { op: "move", slide_id: target.slide_id };
      if (operation.after_id != null) result.after_id = String(operation.after_id);
      else if (operation.after != null) result.after_id = takeBinding(String(operation.after)).slide_id;
      else if (operation.before_id != null) result.before_id = String(operation.before_id);
      else if (operation.before != null) result.before_id = takeBinding(String(operation.before)).slide_id;
      else if (operation.to === "start" || operation.position === "start") result.to = "start";
      else if (operation.to === "end" || operation.position === "end") result.to = "end";
      else throw new SlideEditError("move requires after, before, start, or end", "missing_anchor");
      formalOperations.push(result);
      continue;
    }
    if (op === "insert") {
      const blockText = operation.block ?? operation.source_text ?? operation.text;
      if (typeof blockText !== "string") {
        throw new SlideEditError("insert requires a complete slide block", "missing_insert_block");
      }
      const block = parseInsertedBlock(blockText, `${document.source}#insert`);
      const idValidation = validateNewSlideId(block.slide_id, {
        currentIds,
        historyIds: args.historyIds,
      });
      if (!idValidation.valid) {
        throw new SlideEditError("inserted slide ID is invalid or reserved", "invalid_insert_id", {
          issues: idValidation.issues,
        });
      }
      const result = {
        op: "insert",
        slide_id: block.slide_id,
        block: block.raw,
        block_sha256: sha256(block.raw),
      };
      if (operation.after_id != null) result.after_id = String(operation.after_id);
      else if (operation.after != null) result.after_id = takeBinding(String(operation.after)).slide_id;
      else if (operation.before_id != null) result.before_id = String(operation.before_id);
      else if (operation.before != null) result.before_id = takeBinding(String(operation.before)).slide_id;
      else if (operation.to === "start" || operation.position === "start") result.to = "start";
      else if (operation.to === "end" || operation.position === "end" || operation.after == null) result.to = "end";
      insertedBlocks.set(block.slide_id, block);
      formalOperations.push(result);
      currentIds.push(block.slide_id);
      continue;
    }
    throw new SlideEditError(`unsupported slide edit operation ${JSON.stringify(op)}`, "unsupported_operation");
  }

  const targetCounts = new Map();
  const deletedIds = new Set();
  for (const operation of formalOperations) {
    if (operation.op === "normalize") continue;
    if (operation.op !== "insert" && !currentIds.includes(operation.slide_id)) {
      throw new SlideEditError(`unknown operation slide ID ${JSON.stringify(operation.slide_id)}`, "unknown_slide_id");
    }
    if (operation.op === "delete" || operation.op === "move") {
      targetCounts.set(operation.slide_id, (targetCounts.get(operation.slide_id) || 0) + 1);
    }
    if (operation.op === "delete") deletedIds.add(operation.slide_id);
  }
  for (const [id, count] of targetCounts) {
    if (count > 1) {
      throw new SlideEditError(
        `slide ${JSON.stringify(id)} is targeted by ${count} conflicting operations`,
        "duplicate_operation_target"
      );
    }
  }
  for (const operation of formalOperations) {
    const anchor = operation.after_id || operation.before_id;
    if (!anchor) continue;
    if (!currentIds.includes(anchor)) {
      throw new SlideEditError(`unknown operation anchor ID ${JSON.stringify(anchor)}`, "unknown_anchor");
    }
    if (anchor === operation.slide_id) {
      throw new SlideEditError("a slide cannot be anchored to itself", "self_anchor");
    }
    if (deletedIds.has(anchor)) {
      throw new SlideEditError(
        `operation anchor ${JSON.stringify(anchor)} is deleted in the same transaction`,
        "deleted_anchor"
      );
    }
  }

  const beforeOrder = document.slides.map((slide) => slide.slide_id);
  const afterOrder = [...beforeOrder];
  for (const operation of formalOperations) {
    if (operation.op === "normalize") continue;
    if (operation.op === "delete") {
      afterOrder.splice(afterOrder.indexOf(operation.slide_id), 1);
      continue;
    }
    if (operation.op === "move") {
      const from = afterOrder.indexOf(operation.slide_id);
      afterOrder.splice(from, 1);
      if (operation.to === "start") afterOrder.unshift(operation.slide_id);
      else if (operation.to === "end") afterOrder.push(operation.slide_id);
      else {
        const anchor = operation.after_id || operation.before_id;
        const anchorIndex = afterOrder.indexOf(anchor);
        const insertionIndex = operation.after_id ? anchorIndex + 1 : anchorIndex;
        afterOrder.splice(insertionIndex, 0, operation.slide_id);
      }
      continue;
    }
    if (operation.op === "insert") {
      if (afterOrder.includes(operation.slide_id)) {
        throw new SlideEditError(
          `inserted slide ID ${JSON.stringify(operation.slide_id)} already exists`,
          "duplicate_insert_id"
        );
      }
      if (operation.to === "start") afterOrder.unshift(operation.slide_id);
      else if (operation.to === "end") afterOrder.push(operation.slide_id);
      else {
        const anchor = operation.after_id || operation.before_id;
        const anchorIndex = afterOrder.indexOf(anchor);
        const insertionIndex = operation.after_id ? anchorIndex + 1 : anchorIndex;
        afterOrder.splice(insertionIndex, 0, operation.slide_id);
      }
    }
  }
  if (afterOrder.length === 0) {
    throw new SlideEditError("a structural edit cannot delete every slide", "empty_deck");
  }
  if (new Set(afterOrder).size !== afterOrder.length) {
    throw new SlideEditError("planned result contains duplicate slide IDs", "duplicate_result_id");
  }

  const headerLock = headerLockIds(document);
  const removedHeaderLockIds = headerLock.filter((id) => deletedIds.has(id)).sort();
  const structuredReferenceChanges = removedHeaderLockIds.length > 0
    ? [{ kind: "render.header-lock", action: "remove", slide_ids: removedHeaderLockIds }]
    : [];
  const structural = formalOperations.some((operation) => operation.op !== "normalize");
  const transaction = {
    schema_version: SLIDE_EDIT_SCHEMA_VERSION,
    source: document.source,
    base_spec_sha256: document.sha256,
    publication: args.options.publication || {
      mode: structural ? "next-version" : "current-version",
      target_version: args.options.targetVersion || args.options.target_version || null,
    },
    bindings,
    operations: formalOperations,
    before_order: beforeOrder,
    after_order: afterOrder,
    structured_reference_changes: structuredReferenceChanges,
    warnings: structural ? scanPageReferenceWarnings(document) : [],
  };
  transaction.plan_sha256 = computeSlideEditPlanSha256(transaction);
  return transaction;
}

function normalizeBlockHeading(block, position) {
  const expected = String(position).padStart(2, "0");
  const relativeStart = block.heading_number_range.start - block.range.start;
  const relativeEnd = block.heading_number_range.end - block.range.start;
  return block.raw.slice(0, relativeStart) + expected + block.raw.slice(relativeEnd);
}

function updateHeaderLockFrontmatter(document, removedIds) {
  if (removedIds.length === 0 || !document.frontmatter.present) return document.frontmatter.raw;
  const yamlDocument = parseDocument(document.frontmatter.content, { uniqueKeys: true });
  if (yamlDocument.errors.length > 0) {
    throw new SlideEditError("cannot update invalid YAML frontmatter", "invalid_frontmatter");
  }
  const existing = document.frontmatter.metadata?.render?.["header-lock"];
  if (!Array.isArray(existing)) return document.frontmatter.raw;
  const removed = new Set(removedIds);
  yamlDocument.setIn(
    ["render", "header-lock"],
    existing.filter((id) => !removed.has(id))
  );
  let content = String(yamlDocument);
  if (document.newline === "\r\n") content = content.replace(/\n/g, "\r\n");
  const bom = document.source_text.startsWith("\uFEFF") ? "\uFEFF" : "";
  return `${bom}---${document.newline}${content}---${document.newline}`;
}

function materializeTransaction(document, transaction) {
  const blocks = new Map(document.slides.map((block) => [block.slide_id, block]));
  for (const operation of transaction.operations) {
    if (operation.op !== "insert") continue;
    if (sha256(operation.block) !== operation.block_sha256) {
      throw new SlideEditError("insert block hash does not match the confirmed plan", "insert_hash_mismatch");
    }
    blocks.set(
      operation.slide_id,
      parseInsertedBlock(operation.block, `${document.source}#insert:${operation.slide_id}`)
    );
  }
  const removedIds = transaction.structured_reference_changes
    .filter((change) => change.kind === "render.header-lock" && change.action === "remove")
    .flatMap((change) => change.slide_ids || []);
  const frontmatter = updateHeaderLockFrontmatter(document, removedIds);
  const renderedBlocks = transaction.after_order.map((id, index) => {
    const block = blocks.get(id);
    if (!block) {
      throw new SlideEditError(`confirmed plan references missing block ${JSON.stringify(id)}`, "missing_block");
    }
    return normalizeBlockHeading(block, index + 1);
  });
  return frontmatter + document.preamble.raw + renderedBlocks.join("") + document.epilogue.raw;
}

/**
 * Apply only a self-hash-valid, explicitly confirmed transaction to the exact
 * source bytes it was planned against. This function never resolves selectors.
 */
export function applySlideEdit(transaction, sourceText, { expectedPlanSha256 } = {}) {
  if (!expectedPlanSha256) {
    throw new SlideEditError(
      "apply requires the confirmed preview plan_sha256",
      "missing_plan_sha256"
    );
  }
  if (!verifySlideEditPlanHash(transaction)) {
    throw new SlideEditError("edit plan self-hash is invalid", "invalid_plan_sha256");
  }
  if (expectedPlanSha256 !== transaction.plan_sha256) {
    throw new SlideEditError(
      "confirmed plan_sha256 does not match the supplied edit plan",
      "plan_sha256_mismatch"
    );
  }
  const text = String(sourceText ?? "");
  const currentHash = sha256(text);
  if (currentHash !== transaction.base_spec_sha256) {
    throw new SlideEditError(
      "slide source changed after preview; obtain a fresh plan",
      "base_spec_sha256_mismatch",
      { expected: transaction.base_spec_sha256, actual: currentHash }
    );
  }
  const document = parseSlideDocument(text, transaction.source);
  const currentOrder = document.slides.map((slide) => slide.slide_id);
  if (canonicalJson(currentOrder) !== canonicalJson(transaction.before_order)) {
    throw new SlideEditError("current slide order does not match the confirmed plan", "before_order_mismatch");
  }

  const outputText = materializeTransaction(document, transaction);
  const outputDocument = parseSlideDocument(outputText, transaction.source);
  const outputIssues = validateSlideDocument(outputDocument).filter(
    (issue) => issue.severity === "ERROR"
  );
  if (outputIssues.length > 0) {
    throw new SlideEditError("applied slide source failed validation", "result_validation", {
      issues: outputIssues,
    });
  }
  const resultOrder = outputDocument.slides.map((slide) => slide.slide_id);
  if (canonicalJson(resultOrder) !== canonicalJson(transaction.after_order)) {
    throw new SlideEditError("applied order differs from confirmed plan", "after_order_mismatch");
  }
  const headingNormalization = outputDocument.slides
    .map((slide, index) => ({
      slide_id: slide.slide_id,
      from: document.slides.find((item) => item.slide_id === slide.slide_id)?.heading_number_token ?? null,
      to: String(index + 1).padStart(2, "0"),
    }))
    .filter((change) => change.from !== change.to);
  return {
    text: outputText,
    receipt: {
      schema_version: SLIDE_EDIT_SCHEMA_VERSION,
      source: transaction.source,
      plan_sha256: transaction.plan_sha256,
      base_spec_sha256: transaction.base_spec_sha256,
      result_spec_sha256: sha256(outputText),
      publication: transaction.publication,
      operations: transaction.operations,
      before_order: transaction.before_order,
      after_order: transaction.after_order,
      heading_normalization: headingNormalization,
      structured_reference_changes: transaction.structured_reference_changes,
      warnings: transaction.warnings,
      no_op: outputText === text,
    },
  };
}

export function sha256SlideSource(value) {
  return sha256(String(value ?? ""));
}
