import { attachCliDiagnostic, createCliNext } from "../../shared/cli/cli_error.mjs";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { parseSlideDocument } from "../../01-content/index.mjs";

function normalizeSpeakerNote(value) {
  const lines = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  while (lines[0] === "") lines.shift();
  while (lines.at(-1) === "") lines.pop();
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** Escape text for safe inclusion inside XML <a:t> elements. */
function xmlEscape(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Generate a random integer in [0, max). */
function randInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Build the XML for a single notes slide.
 *
 * Mimics the structure pptxgenjs emits for <a:rPr> and <a:endParaRPr>.
 * Multi-line notes become separate <a:p> elements (one per paragraph).
 * @param {string} noteText - Raw speaker note text (may contain newlines).
 * @param {number} slideNum - 1-based slide number for the slide-number field.
 * @returns {string} Full notes slide XML string.
 */
function buildNotesSlideXml(noteText, slideNum) {
  const escaped = xmlEscape(noteText);
  const paragraphs = escaped.split("\n");

  const paraXml = paragraphs
    .map(
      (line) =>
        `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${line}</a:t></a:r><a:endParaRPr lang="en-US" dirty="0"/></a:p>`
    )
    .join("");

  const fldGuid = `{${randomUUID().toUpperCase()}}`;
  const creationId = String(randInt(2000000000) + 100000000);

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"`,
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"`,
    ` xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">`,
    `<p:cSld>`,
    `<p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>`,
    `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paraXml}</p:txBody></p:sp>`,
    `<p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Number Placeholder 3"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldNum" sz="quarter" idx="10"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:fld id="${fldGuid}" type="slidenum"><a:rPr lang="en-US"/><a:t>${slideNum}</a:t></a:fld><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`,
    `</p:spTree>`,
    `<p:extLst><p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}"><p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="${creationId}"/></p:ext></p:extLst>`,
    `</p:cSld>`,
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>`,
    `</p:notes>`,
  ].join("\n");
}

/**
 * Build the relationships XML for a notes slide.
 * @param {number} slideNum - 1-based slide number.
 * @returns {string}
 */
function buildNotesSlideRelsXml(slideNum) {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNum}.xml"/>`,
    `</Relationships>`,
  ].join("\n");
}

/**
 * Parse a .rels XML string and return the next available relationship Id.
 * E.g. if existing Ids are rId1 and rId2, returns "rId3".
 * @param {string} relsXml
 * @returns {string}
 */
function nextRId(relsXml) {
  const ids = [...relsXml.matchAll(/Id="(rId\d+)"/g)];
  if (ids.length === 0) return "rId1";
  const max = Math.max(
    ...ids.map((m) => parseInt(m[1].replace("rId", ""), 10))
  );
  return `rId${max + 1}`;
}

/**
 * Add a notes-slide relationship to a slide's .rels XML.
 * Does nothing if the relationship already exists.
 * @param {string} relsXml - Current slide rels XML.
 * @param {number} slideNum - 1-based slide number.
 * @returns {string} Updated rels XML.
 */
function addNotesRelsToSlide(relsXml, slideNum) {
  if (relsXml.includes('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"')) {
    return relsXml;
  }
  const newRId = nextRId(relsXml);
  const relLine = `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${slideNum}.xml"/>`;
  return relsXml.replace(
    "</Relationships>",
    `${relLine}</Relationships>`
  );
}

/**
 * Add a notes-slide content-type override to [Content_Types].xml.
 * Does nothing if the override already exists.
 * @param {string} typesXml
 * @param {number} slideNum - 1-based slide number.
 * @returns {string}
 */
function addNotesOverrideToContentTypes(typesXml, slideNum) {
  const partName = `/ppt/notesSlides/notesSlide${slideNum}.xml`;
  if (typesXml.includes(partName)) {
    return typesXml;
  }
  const overrideLine = `<Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`;
  return typesXml.replace("</Types>", ` ${overrideLine}</Types>`);
}

// ---------------------------------------------------------------------------
// Notes extraction (from markdown)
// ---------------------------------------------------------------------------

/**
 * Extract SPEAKER NOTE text from each slide block, in order.
 *
 * Slide-id matching:
 *  - Slides are split on "## Slide N" headers.
 *  - Format B (inline):  > **SPEAKER NOTE**: text
 *  - Format A (multi-line): > **SPEAKER NOTE**\n> line1\n> line2
 *
 * @param {string[]} mdPaths - Paths to markdown slide-specification files.
 * @returns {string[]} Array of note strings (empty string where no note found).
 */
export function extractNotesFromMarkdown(mdPaths) {
  return extractNoteRecordsFromMarkdown(mdPaths).map((record) => record.note);
}

/** Parse notes with formal ID evidence through the shared document model. */
export function extractNoteRecordsFromMarkdown(mdPaths) {
  const records = [];
  for (const mdPath of mdPaths) {
    const document = parseSlideDocument(readFileSync(mdPath, "utf8"), mdPath);
    for (const block of document.slides) {
      const lines = block.body.replace(/\r\n?/g, "\n").split("\n");
      let note = "";
      for (let index = 0; index < lines.length; index += 1) {
        const inline = /^>[ \t]*\*\*SPEAKER NOTE\*\*:[ \t]*(.*)$/.exec(lines[index]);
        if (inline) { note = normalizeSpeakerNote(inline[1]); break; }
        if (!/^>[ \t]*\*\*SPEAKER NOTE\*\*[ \t]*$/.test(lines[index])) continue;
        const quoted = [];
        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
          const quote = /^>[ \t]?(.*)$/.exec(lines[cursor]);
          if (!quote) break;
          quoted.push(quote[1]);
        }
        note = normalizeSpeakerNote(quoted.join("\n"));
        break;
      }
      records.push({
        slide_id: block.slide_id,
        note,
        source: { path: mdPath, line: block.heading_range.start_line },
      });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// PPTX injection (via JSZip — pptxgenjs cannot open existing files)
// ---------------------------------------------------------------------------

/**
 * Count slides in a PPTX by examining the zip entries.
 * @param {JSZip} zip - Loaded PPTX zip.
 * @returns {number}
 */
function countSlides(zip) {
  const re = /^ppt\/slides\/slide(\d+)\.xml$/;
  let max = 0;
  for (const name of Object.keys(zip.files)) {
    const m = name.match(re);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return max;
}

/**
 * Inject speaker notes into a PPTX file (in-place).
 *
 * Notes are matched to slides positionally, so the counts MUST agree. They only
 * diverge when the current final manifest is incomplete or the source was edited
 * after assembly. Aborting here beats
 * the old warn-and-continue, which silently shifted every note after the gap.
 *
 * @param {object} opts
 * @param {string} opts.pptx   - Path to the PPTX file to modify.
 * @param {string[]} opts.notes - Speaker note strings, one per slide.
 * @returns {Promise<{slideCount: number, notesInjected: number}>}
 */
export async function injectNotes({ pptx, notes }) {
  if (notes.some((note) => typeof note !== "string" || note.trim() === "")) {
    const missing = notes.map((note, index) => (!note || !note.trim() ? index + 1 : null)).filter(Boolean);
    throw attachCliDiagnostic(new Error(`Notes injection aborted: missing SPEAKER NOTE content for slide(s) ${missing.join(", ")}`), {
      version: 1,
      category: "source_validation",
      operation: "validate-notes",
      issues: missing.map((slideNumber) => ({
        message: "speaker note content is missing",
        subject: { kind: "slide", id: String(slideNumber), field: "SPEAKER NOTE" },
        reason: { kind: "missing_required_field", expected: "non-empty speaker note" },
      })),
      next: createCliNext("edit_source", { default: "Add every missing speaker note in current source markdown, then rerun notes injection." }),
    });
  }
  let zip;
  try {
    const pptxBuf = readFileSync(pptx);
    zip = await JSZip.loadAsync(pptxBuf);
  } catch {
    throw attachCliDiagnostic(new Error("Page Authority PPTX prerequisite is missing or invalid."), {
      version: 1,
      category: "artifact",
      operation: "load-pptx",
      source: { path: pptx },
      reason: { kind: "invalid_pptx" },
      lineage: [{ kind: "derived", path: pptx, owner: "page-authority-assembly" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: pptx }], default: "Repair current Page Authority final evidence and rerun assembly before notes injection." }),
    });
  }

  const slideCount = countSlides(zip);

  if (notes.length !== slideCount) {
    throw attachCliDiagnostic(new Error(
      `✗ Notes injection aborted: ${notes.length} speaker notes in the source but ` +
        `${slideCount} slides in the PPTX. Positional matching would misalign ` +
        `notes. Rebuild current Page Authority final evidence so counts agree, ` +
        `then rerun notes injection.`
    ), {
      version: 1,
      category: "artifact",
      operation: "match-note-count",
      source: { path: pptx },
      reason: { kind: "count_mismatch", actual: notes.length, expected: slideCount },
      lineage: [{ kind: "derived", path: pptx, owner: "page-authority-assembly" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: pptx }], default: "Rebuild current Page Authority final evidence so slide and note counts agree." }),
    });
  }

  // Read [Content_Types].xml once — we'll update it as notes are added.
  let contentTypesXml = await zip.files["[Content_Types].xml"].async("text");

  let notesInjected = 0;

  for (let i = 0; i < notes.length; i++) {
    const noteText = notes[i];
    if (!noteText) continue;

    const slideNum = i + 1; // 1-based

    // ---- notes slide XML --------------------------------------------------
    const notesSlidePath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    zip.file(notesSlidePath, buildNotesSlideXml(noteText, slideNum));

    // ---- notes slide rels -------------------------------------------------
    const notesSlideRelsPath = `ppt/notesSlides/_rels/notesSlide${slideNum}.xml.rels`;
    zip.file(notesSlideRelsPath, buildNotesSlideRelsXml(slideNum));

    // ---- update slide rels ------------------------------------------------
    const slideRelsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    if (zip.files[slideRelsPath]) {
      let relsXml = await zip.files[slideRelsPath].async("text");
      relsXml = addNotesRelsToSlide(relsXml, slideNum);
      zip.file(slideRelsPath, relsXml);
    }

    // ---- update [Content_Types].xml ---------------------------------------
    contentTypesXml = addNotesOverrideToContentTypes(contentTypesXml, slideNum);

    notesInjected++;
  }

  // Write back the updated [Content_Types].xml
  zip.file("[Content_Types].xml", contentTypesXml);

  // ---- save ---------------------------------------------------------------
  const outBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const temp = join(dirname(pptx), `.${basename(pptx)}.notes-${process.pid}-${randomUUID()}.tmp`);
  try {
    writeFileSync(temp, outBuf);
    renameSync(temp, pptx);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }

  return { slideCount, notesInjected };
}
