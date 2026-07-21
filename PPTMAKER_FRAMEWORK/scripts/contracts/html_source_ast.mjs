import { createHash } from "node:crypto";
import { parse } from "yaml";
import { canonicalJsonSha256 } from "./canonical_json.mjs";
import { projectHtmlSlideBodyV1 } from "./html_review_projection.mjs";

export const HTML_SOURCE_AST_SCHEMA = "pptmaker-html-source-ast-v1";
export const HTML_SLIDE_PLAN_SCHEMA = "pptmaker-html-slide-plan-v1";
export const HTML_NOTES_PROJECTION_SCHEMA = "pptmaker-html-notes-projection-v1";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function normalizeHtmlSpeakerNoteV1(value) {
  const lines = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  while (lines[0] === "") lines.shift();
  while (lines.at(-1) === "") lines.pop();
  return lines.join("\n");
}

function speakerNoteFromBlock(block) {
  const lines = String(block ?? "").replace(/\r\n?/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const inline = /^>[ \t]*\*\*SPEAKER NOTE\*\*:[ \t]*(.*)$/.exec(lines[index]);
    if (inline) return normalizeHtmlSpeakerNoteV1(inline[1]);
    if (!/^>[ \t]*\*\*SPEAKER NOTE\*\*[ \t]*$/.test(lines[index])) continue;
    const quoted = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const quote = /^>[ \t]?(.*)$/.exec(lines[cursor]);
      if (!quote) break;
      quoted.push(quote[1]);
    }
    return normalizeHtmlSpeakerNoteV1(quoted.join("\n"));
  }
  return "";
}

export function parseHtmlSourceAstV1({ sourceBytes, planBytes }) {
  if (!(sourceBytes instanceof Uint8Array) || !(planBytes instanceof Uint8Array)) {
    throw new TypeError("HTML source AST requires caller-supplied source and plan bytes");
  }
  let plan;
  try { plan = JSON.parse(Buffer.from(planBytes).toString("utf8")); }
  catch { throw new Error("current HTML slide plan JSON is invalid"); }
  if (!plan || plan.schema !== HTML_SLIDE_PLAN_SCHEMA || !Array.isArray(plan.slides)) {
    throw new Error("current HTML slide plan schema is invalid");
  }
  const sourceSha256 = sha256(sourceBytes);
  const ids = plan.slides.map((slide) => slide?.slide_id);
  if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    throw new Error("current HTML slide plan identities are invalid");
  }
  const sourceText = Buffer.from(sourceBytes).toString("utf8");
  const heading = /^## Slide\s+\d+[^`\n]*`([^`]+)`[^\n]*$/gm;
  const matches = [...sourceText.matchAll(heading)];
  if (matches.length !== ids.length) throw new Error("current HTML source slide inventory differs from the plan");
  const notesProjection = [];
  const currentSlides = matches.map((match, index) => {
    const slideId = match[1].trim();
    if (slideId !== ids[index]) throw new Error("current HTML source slide order differs from the plan");
    const block = sourceText.slice(match.index, matches[index + 1]?.index ?? sourceText.length);
    const field = (name) => {
      const found = block.match(new RegExp(`^\\*\\*${name}\\*\\*:\\s*(.*)$`, "mi"));
      const value = found?.[1]?.trim() || "";
      return value && !/^\[[^\]]*\]$/.test(value) ? value : null;
    };
    const communicate = block.match(/^- \*\*MUST communicate\*\*:\s*(.*)$/mi)?.[1]?.trim() || null;
    const mustNot = block.match(/^- \*\*MUST NOT\*\*:\s*(.*)$/mi)?.[1]?.trim() || null;
    const yaml = block.match(/\*\*SLIDE BODY\*\*:\s*\n```yaml\s*\n([\s\S]*?)```/i)?.[1];
    if (yaml == null) throw new Error(`current HTML source body is missing for ${slideId}`);
    const structured = parse(yaml);
    if (!structured || typeof structured !== "object" || Array.isArray(structured)) throw new Error(`current HTML source body is invalid for ${slideId}`);
    const family = structured.family;
    const body = projectHtmlSlideBodyV1(structured);
    notesProjection.push(Object.freeze({ slide_id: slideId, note: speakerNoteFromBlock(block) }));
    return {
      ...plan.slides[index],
      position: index + 1,
      header: { kicker: field("KICKER"), title: field("TITLE"), subtitle: field("SUBTITLE") },
      visual_type: field("VISUAL TYPE"),
      concept: { must_communicate: communicate, must_not: mustNot },
      family,
      body,
      callout: structured.callout ?? null,
      primary_visual: structured.primary_visual ?? null,
    };
  });
  const currentPlan = Object.freeze({ ...plan, source_sha256: sourceSha256, slides: Object.freeze(currentSlides) });
  const notes = Object.freeze(notesProjection);
  return Object.freeze({
    schema: HTML_SOURCE_AST_SCHEMA,
    source_sha256: sourceSha256,
    ordered_slide_ids: Object.freeze(ids),
    notes_projection: notes,
    notes_fingerprint: canonicalJsonSha256({ schema: HTML_NOTES_PROJECTION_SCHEMA, notes }),
    plan: currentPlan,
  });
}

export function htmlNotesProjectionFromSourceAstV1(options) {
  const source = parseHtmlSourceAstV1(options);
  return Object.freeze({ projection: source.notes_projection, fingerprint: source.notes_fingerprint });
}
