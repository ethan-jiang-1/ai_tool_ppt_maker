import { createHash } from "node:crypto";
import { parseDocument } from "yaml";

export const STORY_OUTLINE_SCHEMA = "story-outline";
export const DESIGN_CONSTRAINTS_SCHEMA = "design-constraints";

export class NarrativeSourceError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((issue) => issue.message || String(issue)).join("; "));
    this.name = "NarrativeSourceError";
    this.issues = Object.freeze(list);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function sourceLabel(source) {
  return String(source || "narrative-source.md").replaceAll("\\", "/");
}

function issue(source, code, message, { section = null, actual = undefined, repairHint } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: { path: source },
    ...(section ? { subject: { kind: "narrative_source", section } } : {}),
    ...(actual !== undefined ? { actual } : {}),
    repair_hint: repairHint || "repair the canonical narrative source before creating a page plan",
  };
}

function parseFrontmatter(sourceText, source, expectedSchema, issues) {
  if (!sourceText.startsWith("---\n") && !sourceText.startsWith("---\r\n")) {
    issues.push(issue(source, "missing_narrative_frontmatter", `expected leading frontmatter with schema: ${expectedSchema}`));
    return { body: sourceText, metadata: {} };
  }
  const newline = sourceText.startsWith("---\r\n") ? "\r\n" : "\n";
  const closing = sourceText.indexOf(`${newline}---`, 3);
  if (closing < 0) {
    issues.push(issue(source, "unclosed_narrative_frontmatter", "leading narrative frontmatter is not closed with '---'"));
    return { body: sourceText, metadata: {} };
  }
  const yamlText = sourceText.slice(3 + newline.length, closing);
  const document = parseDocument(yamlText, { version: "1.2", schema: "core", uniqueKeys: true, merge: false });
  for (const problem of [...document.errors, ...document.warnings]) {
    issues.push(issue(source, "invalid_narrative_frontmatter", problem.message.split("\n")[0]));
  }
  const metadata = document.errors.length === 0 ? document.toJS() : {};
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    issues.push(issue(source, "invalid_narrative_frontmatter", "narrative frontmatter must be a YAML mapping"));
  } else if (metadata.schema !== expectedSchema) {
    issues.push(issue(source, "narrative_schema_mismatch", `schema must be ${expectedSchema}`, { actual: metadata.schema }));
  }
  const bodyStart = closing + newline.length + 3;
  const body = sourceText.slice(bodyStart).replace(/^\r?\n/, "");
  return { body, metadata: metadata && typeof metadata === "object" ? metadata : {} };
}

function h2Sections(body) {
  const headings = [];
  const expression = /^##[ \t]+([^\r\n]+)[ \t]*$/gm;
  let match;
  while ((match = expression.exec(body)) !== null) headings.push({ heading: match[1].trim(), start: match.index, end: expression.lastIndex });
  return headings.map((entry, index) => ({
    heading: entry.heading,
    text: body.slice(entry.end, headings[index + 1]?.start ?? body.length).trim(),
  }));
}

function oneSection(sections, name, source, issues) {
  const matches = sections.filter((section) => section.heading === name);
  if (matches.length !== 1) {
    issues.push(issue(source, "narrative_section_required", `expected exactly one ## ${name} section`, { section: name }));
    return "";
  }
  const text = matches[0].text.trim();
  if (!text) issues.push(issue(source, "narrative_section_empty", `## ${name} must not be empty`, { section: name }));
  return text;
}

function normalizedText(value) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(" ").trim();
}

function labeledValue(text, label, source, issues, section) {
  const pattern = new RegExp(`^\\*\\*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\*:[ \\t]*(.+?)\\s*$`, "m");
  const match = text.match(pattern);
  if (!match || !match[1].trim()) {
    issues.push(issue(source, "narrative_field_required", `**${label}** must have one non-empty value`, { section }));
    return "";
  }
  return match[1].trim();
}

function labeledList(text, label, source, issues, section) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^\\*\\*${escapedLabel}\\*\\*:[ \\t]*\\r?\\n`, "m");
  const match = pattern.exec(text);
  if (!match) {
    issues.push(issue(source, "narrative_field_required", `**${label}** must be an ordered list`, { section }));
    return [];
  }
  const nextField = /^\\*\\*[^*]+\\*\\*:/gm;
  nextField.lastIndex = pattern.lastIndex;
  const following = nextField.exec(text);
  const listText = text.slice(pattern.lastIndex, following?.index ?? text.length);
  const values = listText.split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$/)?.[1]?.trim() || null)
    .filter(Boolean);
  if (values.length === 0) {
    issues.push(issue(source, "narrative_list_required", `**${label}** must contain at least one item`, { section }));
  }
  return values;
}

function plainList(text, source, issues, section) {
  const values = text.split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$/)?.[1]?.trim() || null)
    .filter(Boolean);
  if (values.length === 0) {
    issues.push(issue(source, "narrative_list_required", `## ${section} must contain at least one list item`, { section }));
  }
  return values;
}

function rejectMisownedNarrativeValues(text, source, issues) {
  const forbidden = [
    /\b(?:recipe|composition|motifs?|relationship|negative_constraints)\s*:/i,
    /\b(?:visual[- ]language|page class|page_class)\b/i,
    /\b(?:coordinates?|font(?: size)?|safe[- ]zone|text density|words? per slide)\b/i,
  ];
  for (const expression of forbidden) {
    if (!expression.test(text)) continue;
    issues.push(issue(
      source,
      "narrative_ownership_error",
      "Narrative sources own the argument and content boundaries only; move visual selections to Visual Language and page class, geometry, or density rules to Page Class and Layout Configuration.",
      { repairHint: "move the visual or layout rule to its owning source, then keep only narrative content and claim boundaries here" },
    ));
    return;
  }
}

function parsePageRange(value, source, issues, section) {
  const match = String(value).match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) {
    issues.push(issue(source, "invalid_intended_page_range", "**Intended Page Range** must use inclusive N-M integers", { section, actual: value }));
    return { start: null, end: null };
  }
  const start = Number.parseInt(match[1], 10);
  const end = Number.parseInt(match[2], 10);
  if (start < 1 || end < start) {
    issues.push(issue(source, "invalid_intended_page_range", "**Intended Page Range** must be positive and ascending", { section, actual: value }));
  }
  return { start, end };
}

export function parseStoryOutline(sourceText, { source = "story-outline.md" } = {}) {
  const text = String(sourceText ?? "");
  const label = sourceLabel(source);
  const issues = [];
  const { body } = parseFrontmatter(text, label, STORY_OUTLINE_SCHEMA, issues);
  rejectMisownedNarrativeValues(body, label, issues);
  const sections = h2Sections(body);
  const centralClaim = normalizedText(oneSection(sections, "Central Claim", label, issues));
  const audienceOutcome = normalizedText(oneSection(sections, "Audience Outcome", label, issues));
  const blockSections = sections.filter((section) => /^Block\s+\d+\s*:\s*.+$/i.test(section.heading));
  if (blockSections.length === 0) issues.push(issue(label, "narrative_block_required", "Story Outline must contain at least one ## Block N: Heading section"));
  const blocks = blockSections.map((section, index) => {
    const match = section.heading.match(/^Block\s+(\d+)\s*:\s*(.+)$/i);
    const ordinal = Number.parseInt(match[1], 10);
    const heading = match[2].trim();
    const expectedOrdinal = index + 1;
    if (ordinal !== expectedOrdinal) issues.push(issue(label, "narrative_block_order", `Block ordinals must start at 1 and be consecutive; expected ${expectedOrdinal}`, { section: section.heading, actual: ordinal }));
    const audienceQuestion = labeledValue(section.text, "Audience Question", label, issues, section.heading);
    const argumentFunction = labeledValue(section.text, "Argument Function", label, issues, section.heading);
    const beats = labeledList(section.text, "Evidence / Reasoning Beats", label, issues, section.heading);
    const range = parsePageRange(labeledValue(section.text, "Intended Page Range", label, issues, section.heading), label, issues, section.heading);
    return { ordinal, heading, audience_question: audienceQuestion, argument_function: argumentFunction, beats, intended_page_range: range };
  });
  if (issues.length > 0) throw new NarrativeSourceError(issues);
  return deepFreeze({
    schema: STORY_OUTLINE_SCHEMA,
    source: label,
    source_sha256: sha256(text),
    central_claim: centralClaim,
    audience_outcome: audienceOutcome,
    blocks,
  });
}

export function parseDesignConstraints(sourceText, { source = "design-constraints.md" } = {}) {
  const text = String(sourceText ?? "");
  const label = sourceLabel(source);
  const issues = [];
  const { body } = parseFrontmatter(text, label, DESIGN_CONSTRAINTS_SCHEMA, issues);
  rejectMisownedNarrativeValues(body, label, issues);
  const sections = h2Sections(body);
  const audience = normalizedText(oneSection(sections, "Audience", label, issues));
  const languageTone = normalizedText(oneSection(sections, "Language and Tone", label, issues));
  const forbiddenClaims = plainList(oneSection(sections, "Forbidden Claims", label, issues), label, issues, "Forbidden Claims");
  const requiredTerminology = plainList(oneSection(sections, "Required Terminology", label, issues), label, issues, "Required Terminology");
  if (issues.length > 0) throw new NarrativeSourceError(issues);
  return deepFreeze({
    schema: DESIGN_CONSTRAINTS_SCHEMA,
    source: label,
    source_sha256: sha256(text),
    audience,
    language_and_tone: languageTone,
    forbidden_claims: forbiddenClaims,
    required_terminology: requiredTerminology,
  });
}
