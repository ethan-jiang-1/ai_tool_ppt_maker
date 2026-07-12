import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";
import {
  injectNotes,
  injectNotesFromRunDir,
} from "../PPTMAKER_FRAMEWORK/scripts/stage5_inject_notes.mjs";
import {
  notesReceiptPath,
  validateNotesReceipt,
  writeNotesReceiptAtomic,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/notes_receipt.mjs";

const S5 = "PPTMAKER_FRAMEWORK/scripts/stage5_inject_notes.mjs";

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
      await expect(injectNotes({ pptx, notes: [""] })).rejects.toThrow(/missing SPEAKER NOTE/);
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
      const result = await injectNotesFromRunDir(run);
      expect(result.notesInjected).toBe(1);
      expect(existsSync(notesReceiptPath(run))).toBe(true);
      expect(validateNotesReceipt(run)).toMatchObject({ valid: true, reason: "current" });
      expect(existsSync(pptx.replace(/\.pptx$/, ".backup.pptx"))).toBe(true);
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

  it("invalidates an old receipt before rejecting ambiguous target PPTX files", async () => {
    const run = tmpRun("multiple");
    try {
      const pptDir = join(run, "_generated", "ppt");
      await writeMinimalPptx(join(pptDir, "a.pptx"));
      writeFileSync(join(run, "slide-specifications.md"), "## Slide 1: One\n\n> **SPEAKER NOTE**: hello\n", "utf8");
      await injectNotesFromRunDir(run);
      await writeMinimalPptx(join(pptDir, "b.pptx"));
      await expect(injectNotesFromRunDir(run)).rejects.toThrow(/2 non-backup PPTX/);
      expect(existsSync(notesReceiptPath(run))).toBe(false);
    } finally {
      rmSync(run, { recursive: true, force: true });
    }
  });
});
