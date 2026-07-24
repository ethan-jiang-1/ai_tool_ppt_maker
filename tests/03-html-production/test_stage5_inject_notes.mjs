import { describe, it, expect } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";
import {
  extractNoteRecordsFromMarkdown,
  injectNotes,
  injectNotesFromRunDir,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/notes_injection.mjs";
import {
  notesReceiptPath,
  validateNotesCompletionReceipt,
  validateNotesRerunInputLineage,
  validateNotesReceipt,
  writeNotesReceiptAtomic,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs";
import { diagnosticFromError } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";

const S5 = "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage5_inject_notes.mjs";

function tmpRun(tag) {
  const run = join(tmpdir(), `stage5_${tag}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(run, "_generated", "ppt"), { recursive: true });
  return run;
}

async function writeMinimalPptx(path, slideCount = 1) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`);
  for (let i = 1; i <= slideCount; i += 1) {
    zip.file(`ppt/slides/slide${i}.xml`, "<p:sld/>");
    zip.file(`ppt/slides/_rels/slide${i}.xml.rels`, `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
  }
  writeFileSync(path, await zip.generateAsync({ type: "nodebuffer" }));
}

function writeAssemblyEvidence(run, pptx, ids = ["One"], schemaVersion = 1) {
  const generated = join(run, "_generated");
  const plan = join(generated, "slide_plan.json");
  const images = join(generated, "header_locked");
  const qa = join(generated, "qa");
  mkdirSync(images, { recursive: true });
  mkdirSync(qa, { recursive: true });
  writeFileSync(plan, JSON.stringify({ slides: ids.map((id, index) => ({
    id, slide_id: id, position: index + 1,
  })) }), "utf8");
  const finalImages = ids.map((id) => {
    const path = join(images, `${id}.png`);
    writeFileSync(path, `final ${id}`);
    return {
      slide_id: id,
      render_engine: "image2",
      artifact_kind: "final-slide",
      path: `_generated/header_locked/${id}.png`,
      sha256: sha256File(path),
      fingerprint: sha256File(path),
    };
  });
  writeFileSync(join(qa, "pptx_assembly.json"), JSON.stringify({
    schema_version: schemaVersion,
    ...(schemaVersion === 2 ? { pipeline: "whole-page-image2-v1", producer: "whole-page-image2-stage3-v1" } : {}),
    slide_plan_path: "_generated/slide_plan.json",
    slide_plan_sha256: sha256File(plan),
    ordered_slide_ids: ids,
    final_images: schemaVersion === 2 ? finalImages.map((entry) => ({ slide_id: entry.slide_id, artifact_kind: 'final-slide', producer: 'whole-page-image2-stage3-v1', final_slide_fingerprint: entry.fingerprint, path: entry.path, sha256: entry.sha256, width: 2000, height: 1125, media_profile: 'whole-page-final-slide-v1:test' })) : finalImages,
    ...(schemaVersion === 2 ? { html_production_reset_id: null, html_delivery_digest: null } : {}),
    pptx_path: `_generated/ppt/${pptx.split("/").at(-1)}`,
    pptx_sha256: sha256File(pptx),
    created_at: new Date().toISOString(),
  }), "utf8");
}

describe("stage5_inject_notes", () => {
  it("declares jszip directly and exposes side-effect-free help", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.dependencies.jszip).toBeTruthy();
    const help = execFileSync("node", [S5, "--help"], { encoding: "utf8" });
    expect(help).toMatch(/--pptx/);
    expect(help).toMatch(/--input/);
  });

  it("rejects missing inputs", () => {
    expect(() => execFileSync("node", [S5], { encoding: "utf8", stdio: "pipe" })).toThrow();
  });

  it("rejects empty speaker notes before replacing the PPTX", async () => {
    const run = tmpRun("empty");
    try {
      const pptx = join(run, "deck.pptx");
      await writeMinimalPptx(pptx);
      const before = readFileSync(pptx);
      let error;
      try {
        await injectNotes({ pptx, notes: [""] });
      } catch (caught) {
        error = caught;
      }
      expect(error.message).toMatch(/missing SPEAKER NOTE/);
      expect(diagnosticFromError(error).issues[0]).toMatchObject({ subject: { id: "1", field: "SPEAKER NOTE" }, reason: { kind: "missing_required_field" } });
      expect(readFileSync(pptx)).toEqual(before);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("writes a current receipt after atomic run-dir injection", async () => {
    const run = tmpRun("receipt");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      await writeMinimalPptx(pptx);
      writeFileSync(join(run, "slide-specifications.md"), "## Slide 1: One\n\n> **SPEAKER NOTE**: hello\n", "utf8");
      writeAssemblyEvidence(run, pptx);
      const result = await injectNotesFromRunDir(run);
      expect(result.notesInjected).toBe(1);
      expect(existsSync(notesReceiptPath(run))).toBe(true);
      expect(validateNotesReceipt(run)).toMatchObject({ valid: true, reason: "current" });
      expect(existsSync(pptx.replace(/\.pptx$/, ".backup.pptx"))).toBe(true);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it('publishes notes schema v3 from a explicit whole-page common assembly-v2 lineage', async () => {
    const run = tmpRun('common-v3');
    try {
      const pptx = join(run, '_generated', 'ppt', 'deck.pptx');
      await writeMinimalPptx(pptx);
      writeFileSync(join(run, 'slide-specifications.md'), '## Slide 1: One\n\n> **SPEAKER NOTE**: hello\n', 'utf8');
      writeAssemblyEvidence(run, pptx, ['One'], 2);
      const result = await injectNotesFromRunDir(run);
      expect(result.receipt).toMatchObject({ schema_version: 3, pipeline: 'whole-page-image2-v1', html_production_reset_id: null, html_delivery_digest: null });
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: true, reason: 'current' });
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("stale source or path escape blocks receipt validation", async () => {
    const run = tmpRun("stale");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      const spec = join(run, "slide-specifications.md");
      await writeMinimalPptx(pptx);
      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**: hello\n", "utf8");
      writeAssemblyEvidence(run, pptx);
      await injectNotesFromRunDir(run);
      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**: changed\n", "utf8");
      expect(validateNotesReceipt(run)).toMatchObject({ valid: false });
      const receipt = JSON.parse(readFileSync(notesReceiptPath(run), "utf8"));
      receipt.input_path = "../outside.md";
      writeNotesReceiptAtomic(run, receipt);
      expect(validateNotesReceipt(run)).toMatchObject({ valid: false });
      expect(validateNotesReceipt(run).reason).toMatch(/escapes|missing/);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("preserves prior rerun lineage before rejecting ambiguous target PPTX files", async () => {
    const run = tmpRun("multiple");
    try {
      const pptDir = join(run, "_generated", "ppt");
      await writeMinimalPptx(join(pptDir, "a.pptx"));
      writeFileSync(join(run, "slide-specifications.md"), "## Slide 1: One\n\n> **SPEAKER NOTE**: hello\n", "utf8");
      writeAssemblyEvidence(run, join(pptDir, "a.pptx"));
      await injectNotesFromRunDir(run);
      await writeMinimalPptx(join(pptDir, "b.pptx"));
      let error;
      try {
        await injectNotesFromRunDir(run);
      } catch (caught) {
        error = caught;
      }
      expect(error.message).toMatch(/2 non-backup PPTX/);
      expect(diagnosticFromError(error)).toMatchObject({ reason: { kind: "ambiguous_pptx", actual: 2, expected: 1 } });
      expect(existsSync(notesReceiptPath(run))).toBe(true);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("adds source/PPTX lineage to direct missing-note diagnostics", async () => {
    const run = tmpRun("cli-diagnostic");
    try {
      const pptx = join(run, "deck.pptx");
      const spec = join(run, "slide-specifications.md");
      await writeMinimalPptx(pptx);
      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**: \n", "utf8");
      const result = spawnSync("node", [S5, "--pptx", pptx, "--input", spec], { encoding: "utf8", timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: "source_validation", stage: "stage5", source: { path: spec } });
      expect(envelope.diagnostic.issues[0].source.path).toBe(spec);
      expect(envelope.diagnostic.issues[0].lineage.map((item) => item.path)).toEqual([spec, pptx]);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("rejects equal note and plan counts when formal ID sets differ", async () => {
    const run = tmpRun("id-mismatch");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      await writeMinimalPptx(pptx);
      writeFileSync(join(run, "slide-specifications.md"), "## Slide 1: Other\n\n> **SPEAKER NOTE**: hello\n", "utf8");
      writeAssemblyEvidence(run, pptx, ["One"]);
      await expect(injectNotesFromRunDir(run)).rejects.toThrow(/missing: One.*unexpected: Other/i);
      expect(existsSync(notesReceiptPath(run))).toBe(false);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("keeps completion strict while allowing a notes-only successor from valid rerun lineage", async () => {
    const run = tmpRun("rerun-lineage");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      const spec = join(run, "slide-specifications.md");
      await writeMinimalPptx(pptx);
      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**: first\n", "utf8");
      writeAssemblyEvidence(run, pptx);
      await injectNotesFromRunDir(run);
      const firstReceipt = JSON.parse(readFileSync(notesReceiptPath(run), "utf8"));
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: true });

      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**: changed\n", "utf8");
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: false });
      expect(validateNotesRerunInputLineage(run)).toMatchObject({ valid: true });

      await injectNotesFromRunDir(run);
      const secondReceipt = JSON.parse(readFileSync(notesReceiptPath(run), "utf8"));
      expect(secondReceipt.schema_version).toBe(2);
      expect(secondReceipt.predecessor).toMatchObject({
        input_pptx_sha256: firstReceipt.pptx_sha256,
      });
      expect(secondReceipt.root_assembly).toEqual(firstReceipt.root_assembly);
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: true });

      writeFileSync(pptx, Buffer.concat([readFileSync(pptx), Buffer.from('tamper')]));
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: false });
      expect(validateNotesRerunInputLineage(run)).toMatchObject({ valid: false });
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("normalizes blank multiline quote paragraphs while retaining legacy receipt behavior", async () => {
    const run = tmpRun("notes-projection");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      const spec = join(run, "slide-specifications.md");
      await writeMinimalPptx(pptx);
      writeFileSync(spec, [
        "## Slide 1: One",
        "",
        "> **SPEAKER NOTE**",
        ">",
        "> First paragraph.",
        ">",
        "> Second paragraph.",
        "",
      ].join("\n"), "utf8");
      writeAssemblyEvidence(run, pptx, ["One"], 2);

      expect(extractNoteRecordsFromMarkdown([spec])).toMatchObject([
        { slide_id: "One", note: "First paragraph.\n\nSecond paragraph." },
      ]);
      const result = await injectNotesFromRunDir(run);
      expect(result.receipt.notes_fingerprint).toBeUndefined();
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: true });

      writeFileSync(spec, `${readFileSync(spec, "utf8")}Human-only planning prose.\n`, "utf8");
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: false });

      writeFileSync(spec, readFileSync(spec, "utf8").replace("Second paragraph.", "Changed paragraph."), "utf8");
      expect(validateNotesCompletionReceipt(run)).toMatchObject({ valid: false });

      writeFileSync(spec, "## Slide 1: One\n\n> **SPEAKER NOTE**\n>\n>   \n", "utf8");
      expect(extractNoteRecordsFromMarkdown([spec])).toMatchObject([{ slide_id: "One", note: "" }]);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });

  it("rejects a blank-only multiline speaker note before changing the PPTX", async () => {
    const run = tmpRun("blank-multiline");
    try {
      const pptx = join(run, "_generated", "ppt", "deck.pptx");
      await writeMinimalPptx(pptx);
      writeFileSync(join(run, "slide-specifications.md"), [
        "## Slide 1: One",
        "",
        "> **SPEAKER NOTE**",
        ">",
        ">   ",
        "",
      ].join("\n"), "utf8");
      writeAssemblyEvidence(run, pptx);
      const before = readFileSync(pptx);
      await expect(injectNotesFromRunDir(run)).rejects.toThrow(/missing SPEAKER NOTE/);
      expect(readFileSync(pptx)).toEqual(before);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });
});
