#!/usr/bin/env node
/**
 * Stage 5: Inject speaker notes into the PPTX from the source markdown.
 *
 * Extracts SPEAKER NOTE blocks from the same markdown files used in Stage 1,
 * injects each note into the corresponding slide's notes panel in the PPTX.
 *
 * This stage modifies the PPTX in-place. Back it up first.
 *
 * Usage:
 *   node stage5_inject_notes.mjs \
 *       --pptx 3_versions/v1/_generated/ppt/{NAME}.pptx \
 *       --input 3_versions/v1/slide-specifications.md
 *
 * Dependencies: pptxgenjs (whose transitive dependency jszip is used for the
 * actual PPTX XML manipulation, since pptxgenjs cannot open existing PPTX files).
 *
 * Imports path constants from ./bundle_layout.mjs.
 */

import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage5_inject_notes.mjs";
import { CLI_ERROR_CODES, attachCliDiagnostic, createCliNext, diagnosticFromError, emitCliError } from "../shared/cli/cli_error.mjs";

import { copyFileSync, existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Command } from "commander";
import JSZip from "jszip";

import {
  GEN_PPT_SUBDIR,
  GEN_SLIDE_PLAN,
  SLIDE_SPECS_GLOB,
  generatedDir,
  findSlideSpecs,
  deckName,
} from "../shared/run-bundle/bundle_layout.mjs";
import {
  buildNotesReceipt,
  buildHtmlNotesReceipt,
  notesReceiptPath,
  validateNotesRerunInputLineage,
  validatePptxAssemblyReceipt,
  writeNotesReceiptAtomic,
} from "../shared/identity/notes_receipt.mjs";
import { parseSlideDocument } from "../01-content/internal/slide_document.mjs";
import { probeProductionMarker, validateAndBuildHtmlFirstPlan, HTML_FIRST_PIPELINE } from "./internal/html_slide_contract.mjs";

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
    const text = readFileSync(mdPath, "utf-8");
    const document = parseSlideDocument(text, mdPath);
    for (const block of document.slides) {
      let note = "";

      // Format B: inline colon-separated — > **SPEAKER NOTE**: content
      const mB = block.body.match(/> \*\*SPEAKER NOTE\*\*:\s*(.+)$/m);
      if (mB) {
        note = mB[1].trim();
      } else {
        // Format A: multi-line blockquote — > **SPEAKER NOTE**\n> content...
        const mA = block.body.match(/> \*\*SPEAKER NOTE\*\*\s*\r?\n((?:> .+(?:\r?\n|$))+)/m);
        if (mA) {
          note = mA[1]
            .replace(/^> ?/gm, "")
            .trim();
        }
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
 * diverge when the deck was built partial (Stage 3/4 now fail loud to prevent
 * that) or the spec was edited after the .pptx was built. Aborting here beats
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
    throw attachCliDiagnostic(new Error(`Stage 5 aborted: missing SPEAKER NOTE content for slide(s) ${missing.join(", ")}`), {
      version: 1,
      category: "source_validation",
      stage: "stage5",
      operation: "validate-notes",
      issues: missing.map((slideNumber) => ({
        message: "speaker note content is missing",
        subject: { kind: "slide", id: String(slideNumber), field: "SPEAKER NOTE" },
        reason: { kind: "missing_required_field", expected: "non-empty speaker note" },
      })),
      next: createCliNext("edit_source", { default: "Add every missing speaker note in source markdown, then rerun Stage 5." }),
    });
  }
  let zip;
  try {
    const pptxBuf = readFileSync(pptx);
    zip = await JSZip.loadAsync(pptxBuf);
  } catch {
    throw attachCliDiagnostic(new Error("Stage 5 PPTX prerequisite is missing or invalid."), {
      version: 1,
      category: "artifact",
      stage: "stage5",
      operation: "load-pptx",
      source: { path: pptx },
      reason: { kind: "invalid_pptx" },
      lineage: [{ kind: "derived", path: pptx, stage: "stage4" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: pptx }], default: "Rerun Stage 4 to recreate a valid PPTX, then rerun Stage 5." }),
    });
  }

  const slideCount = countSlides(zip);

  if (notes.length !== slideCount) {
    throw attachCliDiagnostic(new Error(
      `✗ Stage 5 aborted: ${notes.length} speaker notes in the spec but ` +
        `${slideCount} slides in the PPTX. Positional matching would misalign ` +
        `notes. Rebuild the deck from the current spec (Stage 1→4) so counts agree, ` +
        `then rerun Stage 5.`
    ), {
      version: 1,
      category: "artifact",
      stage: "stage5",
      operation: "match-note-count",
      source: { path: pptx },
      reason: { kind: "count_mismatch", actual: notes.length, expected: slideCount },
      lineage: [{ kind: "derived", path: pptx, stage: "stage4" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: pptx }], default: "Rerun Stages 1 through 4 from current source so slide and note counts agree." }),
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
  const temp = join(dirname(pptx), `.${basename(pptx)}.stage5-${process.pid}-${randomUUID()}.tmp`);
  try {
    writeFileSync(temp, outBuf);
    renameSync(temp, pptx);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }

  return { slideCount, notesInjected };
}

// ---------------------------------------------------------------------------
// Convenience: run from a runDir (discover PPTX + spec automatically)
// ---------------------------------------------------------------------------

/**
 * Inject notes into a deck's PPTX using bundle_layout conventions.
 *
 * Discovers the PPTX from _generated/ppt/ and the spec from the version dir.
 *
 * @param {string} runDir - Path to the version run directory (deck_x/3_versions/vN/).
 * @returns {Promise<{slideCount: number, notesInjected: number}>}
 */
export async function injectNotesFromRunDir(runDir) {
  const inputFile = findSlideSpecs(runDir);
  if (!inputFile) {
    throw attachCliDiagnostic(new Error(`No ${SLIDE_SPECS_GLOB} found in ${runDir}`), {
      version: 1, category: "source_validation", stage: "stage5", operation: "find-notes-source", source: { path: runDir }, reason: { kind: "missing_notes_source" }, next: createCliNext("edit_source", { inspect: [{ path: runDir }], default: "Restore the slide specification source with speaker notes, then rerun Stage 5." }),
    });
  }

  const pptDir = join(generatedDir(runDir), GEN_PPT_SUBDIR);
  if (!existsSync(pptDir)) {
    throw attachCliDiagnostic(new Error(`No ppt/ dir found in _generated/. Run Stage 4 first.`), {
      version: 1, category: "artifact", stage: "stage5", operation: "find-pptx", source: { path: pptDir }, reason: { kind: "missing_pptx_directory" }, next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }], default: "Rerun Stage 4 to create the PPTX prerequisite; do not create generated directories by hand." }),
    });
  }

  const pptxFiles = readdirSync(pptDir)
    .filter((f) => f.endsWith(".pptx") && !f.endsWith(".backup.pptx"))
    .map((f) => join(pptDir, f))
    .sort();

  if (pptxFiles.length !== 1) {
    throw attachCliDiagnostic(new Error(pptxFiles.length === 0
      ? `No .pptx found in ${pptDir}. Run Stage 4 first.`
      : `${pptxFiles.length} non-backup PPTX files found in ${pptDir}; remove strays before Stage 5.`), {
      version: 1,
      category: "artifact",
      stage: "stage5",
      operation: "find-pptx",
      source: { path: pptDir },
      reason: { kind: pptxFiles.length === 0 ? "missing_pptx" : "ambiguous_pptx", actual: pptxFiles.length, expected: 1 },
      lineage: [{ kind: "source", path: inputFile, stage: "input" }, { kind: "derived", path: pptDir, stage: "stage4" }],
      next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }, { path: pptDir }], default: "Rerun Stage 4 until exactly one current PPTX exists, then rerun Stage 5." }),
    });
  }
  const pptxFile = pptxFiles[0];
  const planPath = join(generatedDir(runDir), GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) {
    throw attachCliDiagnostic(new Error("Current slide_plan.json is missing. Run Stage 1 first."), {
      version: 1, category: "artifact", stage: "stage5", operation: "load-slide-plan",
      source: { path: planPath }, reason: { kind: "missing_slide_plan" },
      next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }], default: "Rerun Stage 1 before injecting notes." }),
    });
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf8"));
  } catch (error) {
    throw attachCliDiagnostic(new Error(`Current slide_plan.json is invalid: ${error.message}`), {
      version: 1, category: "artifact", stage: "stage5", operation: "load-slide-plan",
      source: { path: planPath }, reason: { kind: "invalid_slide_plan" },
      next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }], default: "Rerun Stage 1 before injecting notes." }),
    });
  }
  const orderedSlideIds = (plan.slides || []).map((slide) => String(slide.slide_id || slide.id || ""));
  if (orderedSlideIds.length === 0 || orderedSlideIds.some((id) => !id) || new Set(orderedSlideIds).size !== orderedSlideIds.length) {
    throw attachCliDiagnostic(new Error("Current slide plan has missing or duplicate formal IDs."), {
      version: 1, category: "artifact", stage: "stage5", operation: "validate-slide-plan",
      source: { path: planPath }, reason: { kind: "invalid_slide_id_set" },
      next: createCliNext("repair_prerequisite", { inspect: [{ path: inputFile }, { path: planPath }], default: "Repair Stage 1 identity validation and rerun." }),
    });
  }
  const noteRecords = extractNoteRecordsFromMarkdown([inputFile]);
  const notesById = new Map();
  const duplicateNoteIds = [];
  for (const record of noteRecords) {
    if (notesById.has(record.slide_id)) duplicateNoteIds.push(record.slide_id);
    notesById.set(record.slide_id, record);
  }
  const planSet = new Set(orderedSlideIds);
  const missingIds = orderedSlideIds.filter((id) => !notesById.has(id));
  const unexpectedIds = [...notesById.keys()].filter((id) => !planSet.has(id));
  if (missingIds.length > 0 || unexpectedIds.length > 0 || duplicateNoteIds.length > 0) {
    throw attachCliDiagnostic(new Error(
      `Stage 5 note IDs do not match the current plan` +
      `${missingIds.length ? `; missing: ${missingIds.join(", ")}` : ""}` +
      `${unexpectedIds.length ? `; unexpected: ${unexpectedIds.join(", ")}` : ""}` +
      `${duplicateNoteIds.length ? `; duplicate: ${duplicateNoteIds.join(", ")}` : ""}`
    ), {
      version: 1,
      category: "source_validation",
      stage: "stage5",
      operation: "match-note-ids",
      source: { path: inputFile },
      issues: [
        ...missingIds.map((id) => ({ message: "planned slide has no source note block", subject: { kind: "slide", id }, reason: { kind: "missing_note_id" } })),
        ...unexpectedIds.map((id) => ({ message: "source note ID is absent from current plan", subject: { kind: "slide", id }, reason: { kind: "unexpected_note_id" } })),
        ...duplicateNoteIds.map((id) => ({ message: "source note ID is duplicated", subject: { kind: "slide", id }, reason: { kind: "duplicate_note_id" } })),
      ],
      next: createCliNext("edit_source", { inspect: [{ path: inputFile }, { path: planPath }], default: "Make source note IDs exactly match the current slide plan, then rerun Stage 5." }),
    });
  }
  const notes = orderedSlideIds.map((id) => notesById.get(id).note);
  const assembly = validatePptxAssemblyReceipt(runDir, {
    requireCurrentPptx: true,
    expectedOrderedIds: orderedSlideIds,
  });
  const rerun = assembly.valid ? null : validateNotesRerunInputLineage(runDir, {
    pptxPath: pptxFile,
    planPath,
    orderedSlideIds,
  });
  const lineage = assembly.valid ? assembly : rerun?.assembly;
  if (!lineage?.valid || (!assembly.valid && !rerun?.valid)) {
    throw attachCliDiagnostic(new Error(
      `Stage 5 cannot prove ordered PPTX lineage: ${assembly.reason}; rerun lineage: ${rerun?.reason || "unavailable"}`
    ), {
      version: 1, category: "artifact", stage: "stage5", operation: "validate-pptx-lineage",
      source: { path: pptxFile }, reason: { kind: "unproven_pptx_lineage" },
      next: createCliNext("repair_prerequisite", { inspect: [{ path: planPath }, { path: pptxFile }], default: "Rerun Stage 4 to establish current ordered-ID assembly evidence, then rerun Stage 5." }),
    });
  }
  const backup = pptxFile.replace(/\.pptx$/, ".backup.pptx");
  if (!existsSync(backup)) copyFileSync(pptxFile, backup);
  const result = await injectNotes({ pptx: pptxFile, notes });
  const receipt = buildNotesReceipt({
    runDir,
    inputPath: inputFile,
    planPath,
    pptxPath: pptxFile,
    orderedSlideIds,
    slideCount: result.slideCount,
    notesInjected: result.notesInjected,
    assembly: lineage,
    predecessor: rerun?.valid ? rerun : null,
  });
  try {
    writeNotesReceiptAtomic(runDir, receipt);
  } catch {
    const receiptPath = notesReceiptPath(runDir);
    throw attachCliDiagnostic(new Error("Stage 5 notes receipt could not be written."), {
      version: 1,
      category: "artifact",
      stage: "stage5",
      operation: "write-receipt",
      source: { path: inputFile },
      reason: { kind: "receipt_write_failed" },
      lineage: [{ kind: "source", path: inputFile, stage: "input" }, { kind: "derived", path: pptxFile, stage: "stage4" }, { kind: "derived", path: receiptPath, stage: "stage5" }],
      next: createCliNext("rerun", { inspect: [{ path: inputFile }, { path: pptxFile }], default: "Resolve filesystem availability and rerun Stage 5; do not hand-create the generated receipt." }),
    });
  }
  return { ...result, receipt, inputFile, pptxFile };
}

export async function injectHtmlNotesFromRunDir(runDir) {
  const resolvedRun = resolve(runDir);
  const source = join(resolvedRun, 'slide-specifications.md');
  const marker = probeProductionMarker(readFileSync(source));
  if (marker.branch !== HTML_FIRST_PIPELINE) throw new Error('HTML notes route requires production.pipeline html-first-v1');
  const { plan } = validateAndBuildHtmlFirstPlan({ runDir: resolvedRun });
  const orderedSlideIds = plan.slides.map((slide) => slide.slide_id);
  const planPath = join(generatedDir(resolvedRun), GEN_SLIDE_PLAN);
  if (!existsSync(planPath)) throw new Error('HTML Stage 5 requires current slide_plan.json; run Stage 1 first');
  const currentPlan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (currentPlan.ordered_plan_digest !== plan.ordered_plan_digest) throw new Error('HTML Stage 5 slide_plan.json is stale; rerun Stage 1');
  const records = extractNoteRecordsFromMarkdown([source]);
  const byId = new Map(records.map((record) => [record.slide_id, record.note]));
  if (records.length !== orderedSlideIds.length || orderedSlideIds.some((id) => !byId.has(id))) throw new Error('HTML notes do not cover the current ordered slide IDs');
  const pptDir = join(generatedDir(resolvedRun), GEN_PPT_SUBDIR);
  const pptx = readdirSync(pptDir).filter((name) => name.endsWith('.pptx') && !name.endsWith('.backup.pptx')).map((name) => join(pptDir, name));
  if (pptx.length !== 1) throw new Error('HTML Stage 5 requires exactly one current PPTX');
  const assembly = validatePptxAssemblyReceipt(resolvedRun, { requireCurrentPptx: true, expectedOrderedIds: orderedSlideIds });
  const rerun = assembly.valid ? null : validateNotesRerunInputLineage(resolvedRun, { pptxPath: pptx[0], planPath, orderedSlideIds });
  const lineage = assembly.valid ? assembly : rerun?.assembly;
  if (!lineage?.valid || (!assembly.valid && !rerun?.valid)) throw new Error(`HTML Stage 5 cannot prove current assembly lineage: ${assembly.reason}; rerun: ${rerun?.reason || 'unavailable'}`);
  const result = await injectNotes({ pptx: pptx[0], notes: orderedSlideIds.map((id) => byId.get(id) || '') });
  const receiptPath = notesReceiptPath(resolvedRun);
  const receipt = buildHtmlNotesReceipt({ runDir: resolvedRun, inputPath: source, planPath, pptxPath: pptx[0], orderedSlideIds, slideCount: result.slideCount, notesInjected: result.notesInjected, assembly: lineage, predecessor: rerun?.valid ? rerun : null });
  writeNotesReceiptAtomic(resolvedRun, receipt);
  return { ...result, receipt, receiptPath };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

/**
 * Run Stage 5 from the command line.
 * @param {string[]} [argv] - process.argv (or test args).
 * @returns {Promise<{slideCount: number, notesInjected: number}>}
 */
export async function main(argv = process.argv) {
  const program = new Command();

  program
    .name("stage5_inject_notes.mjs")
    .description("Stage 5: Inject speaker notes into the PPTX from source markdown")
    .requiredOption("--pptx <path>", "PPTX file to modify in-place")
    .requiredOption("--input <paths...>", "One or more markdown slide spec files")
    .action(async (opts) => {
      try {
        const notes = extractNotesFromMarkdown(
          Array.isArray(opts.input) ? opts.input : [opts.input]
        );
        const result = await injectNotes({ pptx: opts.pptx, notes });
        console.error(`\n--- Stage 5 complete ---`);
        console.error(`Notes injected: ${result.notesInjected}/${result.slideCount} slides`);
      } catch (err) {
        console.error(`✗ ${err.message}`);
        const inputs = Array.isArray(opts.input) ? opts.input : [opts.input];
        const structured = diagnosticFromError(err);
        const diagnostic = structured ? {
          ...structured,
          source: structured.source || { path: inputs[0] },
          issues: structured.issues?.map((issue) => ({ ...issue, source: issue.source || { path: inputs[0] }, lineage: issue.lineage || [{ kind: "source", path: inputs[0], stage: "input" }, { kind: "derived", path: opts.pptx, stage: "stage4" }] })),
          lineage: structured.lineage || [...inputs.map((path) => ({ kind: "source", path, stage: "input" })), { kind: "derived", path: opts.pptx, stage: "stage4" }],
        } : null;
        emitCliError({
          code: CLI_ERROR_CODES.FAILED,
          message: "Stage 5 could not inject speaker notes into the PPTX.",
          hint: "Inspect the source markdown and Stage 4 PPTX prerequisite, then rerun Stage 5.",
          where: "stage5_inject_notes.main",
          diagnostic: diagnostic || {
            version: 1,
            category: "artifact",
            stage: "stage5",
            operation: "inject-notes",
            source: { path: inputs[0] },
            reason: { kind: "invalid_notes_source_or_pptx" },
            lineage: [
              ...inputs.map((path) => ({ kind: "source", path, stage: "input" })),
              { kind: "derived", path: opts.pptx, stage: "stage4" },
              { kind: "derived", path: opts.pptx, stage: "stage5" },
            ],
            next: createCliNext("repair_prerequisite", {
              inspect: [...inputs.map((path) => ({ path })), { path: opts.pptx }],
              invocation: { program: "node", args: [__filename, "--pptx", opts.pptx, "--input", ...inputs] },
              default: "Edit speaker notes in source markdown or rerun Stage 4 for a valid PPTX; do not hand-edit generated receipts.",
            }),
          },
        });
        process.exit(1);
      }
    });

  // Handle --input as variadic: commander's <paths...> collects remaining args
  await program.parseAsync(argv);
}

// Run when executed directly (not imported)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith("/stage5_inject_notes.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage5_inject_notes" });
  main();
}
