import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

const LESSONS_CLI = "ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs";
const TEST_DECK = join(tmpdir(), `deck_lessons_test_${Date.now()}`);
const RUN_DIR = join(TEST_DECK, "3_versions", "v1");

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 15000 }).trim();
    return { out, code: 0 };
  } catch (e) {
    // stderr contains error messages from console.error + emitCliError
    const combined = [(e.stdout || "").trim(), (e.stderr || "").trim()]
      .filter(Boolean)
      .join("\n");
    return { out: combined, code: e.status || 1 };
  }
}

function mkdirs(p) {
  mkdirSync(p, { recursive: true });
}

beforeAll(() => {
  initBundle(TEST_DECK, null, null, null);
});

afterAll(() => {
  try { rmSync(TEST_DECK, { recursive: true, force: true }); } catch { /* ok */ }
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe("lessons list", () => {
  it("reports 0 lessons on empty deck", () => {
    const { out, code } = run(`node ${LESSONS_CLI} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("0 lessons");
  });

  it("lists lessons with summaries when they exist", () => {
    const lessonsDir = join(TEST_DECK, "_lessons");
    mkdirs(lessonsDir);
    writeFileSync(join(lessonsDir, "test-lesson.md"), "# Test Heading\n\ncontent", "utf-8");
    writeFileSync(join(lessonsDir, "image-proven.yaml"), "# Proven comment\nmodel: test\n", "utf-8");

    const { out, code } = run(`node ${LESSONS_CLI} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("test-lesson.md");
    expect(out).toContain("Test Heading");
    expect(out).toContain("image-proven.yaml");
    expect(out).toContain("Proven comment");
    expect(out).toContain("2 lessons");

    rmSync(lessonsDir, { recursive: true, force: true });
  });

  it("uses filename as summary when no heading exists", () => {
    const lessonsDir = join(TEST_DECK, "_lessons");
    mkdirs(lessonsDir);
    writeFileSync(join(lessonsDir, "no-heading.md"), "just content\nno heading\n", "utf-8");

    const { out, code } = run(`node ${LESSONS_CLI} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("no-heading.md");
    expect(out).toContain("1 lesson");

    rmSync(lessonsDir, { recursive: true, force: true });
  });

  it("supports --json output", () => {
    const lessonsDir = join(TEST_DECK, "_lessons");
    mkdirs(lessonsDir);
    writeFileSync(join(lessonsDir, "t.md"), "# T\n\nx", "utf-8");

    const { out, code } = run(`node ${LESSONS_CLI} list ${RUN_DIR} --json`);
    expect(code).toBe(0);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].file).toBe("t.md");
    expect(parsed[0].summary).toBe("T");

    rmSync(lessonsDir, { recursive: true, force: true });
  });

  it("ignores README.md", () => {
    const lessonsDir = join(TEST_DECK, "_lessons");
    mkdirs(lessonsDir);
    writeFileSync(join(lessonsDir, "README.md"), "# readme\n", "utf-8");
    writeFileSync(join(lessonsDir, "real.md"), "# real\n", "utf-8");

    const { out, code } = run(`node ${LESSONS_CLI} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("real.md");
    expect(out).not.toContain("README.md");
    expect(out).toContain("1 lesson");

    rmSync(lessonsDir, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// add
// ---------------------------------------------------------------------------

describe("lessons add", () => {
  const lessonsDir = join(TEST_DECK, "_lessons");

  it("creates a lesson file with 4-question template", () => {
    const { out, code } = run(`node ${LESSONS_CLI} add ${RUN_DIR} --title "font-fix"`);
    expect(code).toBe(0);
    expect(out).toContain("Created");
    const filePath = join(lessonsDir, "font-fix.md");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("# font-fix");
    expect(content).toContain("**遇到什么:**");
    expect(content).toContain("**怎么试的:**");
    expect(content).toContain("**结论:**");
    expect(content).toContain("**下次先看哪:**");
  });

  it("refuses to overwrite existing file", () => {
    // font-fix.md was created by the first test above — try to overwrite it
    const { out, code } = run(`node ${LESSONS_CLI} add ${RUN_DIR} --title "font-fix"`);
    expect(code).not.toBe(0);
    expect(out).toContain("already exists");
  });

  it("creates _lessons/ directory when absent", () => {
    // remove everything and verify add recreates
    try { rmSync(lessonsDir, { recursive: true, force: true }); } catch { /* ok */ }
    expect(existsSync(lessonsDir)).toBe(false);

    const { code } = run(`node ${LESSONS_CLI} add ${RUN_DIR} --title "fresh"`);
    expect(code).toBe(0);
    expect(existsSync(lessonsDir)).toBe(true);
    expect(existsSync(join(lessonsDir, "fresh.md"))).toBe(true);
  });

  it("fails when --title is missing", () => {
    const { out, code } = run(`node ${LESSONS_CLI} add ${RUN_DIR}`);
    expect(code).not.toBe(0);
    expect(out).toContain("--title");
  });
});

// ---------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------

describe("lessons check", () => {
  it("prints nothing-to-review when empty", () => {
    const tmp = join(tmpdir(), `deck_empty_${Date.now()}`);
    const rd = join(tmp, "3_versions", "v1");
    initBundle(tmp, null, null, null);

    const { out, code } = run(`node ${LESSONS_CLI} check ${rd}`);
    expect(code).toBe(0);
    expect(out).toContain("No lessons yet");

    try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ok */ }
  });

  it("prints reminder listing filenames when lessons exist", () => {
    // Create known file in TEST_DECK/_lessons/
    const lDir = join(TEST_DECK, "_lessons");
    mkdirs(lDir);
    writeFileSync(join(lDir, "known-lesson.md"), "# Known\n\ncontent", "utf-8");

    const { out, code } = run(`node ${LESSONS_CLI} check ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("known-lesson.md");
    expect(out).toContain("lessons to review");
  });
});

describe("lessons Harness binding", () => {
  it("hard-stops a locatorless Deck before creating a lesson", () => {
    const legacyDeck = join(tmpdir(), `deck_legacy_lessons_${Date.now()}`);
    const legacyRun = join(legacyDeck, "3_versions", "v1");
    try {
      mkdirs(legacyRun);
      const lessonsDir = join(legacyDeck, "_lessons");
      const { out, code } = run(`node ${LESSONS_CLI} add ${legacyRun} --title "must-not-write"`);
      expect(code).not.toBe(0);
      expect(out).toContain("exact local PPT Maker Harness identity");
      expect(existsSync(lessonsDir)).toBe(false);
    } finally {
      rmSync(legacyDeck, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------

describe("lessons search", () => {
  it("finds matching lessons", () => {
    const { out, code } = run(`node ${LESSONS_CLI} search ${RUN_DIR} "Known"`);
    expect(code).toBe(0);
    expect(out).toContain("known-lesson.md");
  });

  it("reports no matches when nothing found", () => {
    const { out, code } = run(`node ${LESSONS_CLI} search ${RUN_DIR} "nonexistent12345"`);
    expect(code).toBe(0);
    expect(out).toContain("no matches");
  });

  it("fails when keyword is missing", () => {
    const { out, code } = run(`node ${LESSONS_CLI} search ${RUN_DIR}`);
    expect(code).not.toBe(0);
    expect(out).toContain("keyword");
  });
});

// ---------------------------------------------------------------------------
// CLI usage
// ---------------------------------------------------------------------------

describe("lessons help", () => {
  it("shows help with --help", () => {
    const { out, code } = run(`node ${LESSONS_CLI} --help`);
    expect(code).toBe(0);
    expect(out).toContain("Usage:");
    expect(out).toContain("list");
    expect(out).toContain("add");
    expect(out).toContain("check");
    expect(out).toContain("search");
  });

  it("shows help with no arguments", () => {
    const { out, code } = run(`node ${LESSONS_CLI}`);
    expect(code).toBe(0);
    expect(out).toContain("Usage:");
  });
});
