/**
 * Lessons Flow E2E Tests
 *
 * Validates the full lesson lifecycle through the CLI surface:
 * capture → retrieve → status visibility → search.
 *
 * Exercises real shell commands (spawnSync) against temp deck fixtures,
 * not just module imports.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const LESSONS = "ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs";
const PPT_FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";

let TEST_DECK;
let RUN_DIR;

function run(cmd) {
  try {
    return { out: execSync(cmd, { encoding: "utf-8", timeout: 15000 }).trim(), code: 0 };
  } catch (e) {
    const combined = [(e.stdout || "").trim(), (e.stderr || "").trim()]
      .filter(Boolean)
      .join("\n");
    return { out: combined, code: e.status || 1 };
  }
}

beforeAll(async () => {
  const { initBundle } = await import(
    "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs"
  );
  TEST_DECK = join(tmpdir(), `deck_e2e_lessons_${Date.now()}`);
  initBundle(TEST_DECK, null, null, null);
  RUN_DIR = join(TEST_DECK, "3_versions", "v1");
});

afterAll(() => {
  try { rmSync(TEST_DECK, { recursive: true, force: true }); } catch { /* ok */ }
});

// ---------------------------------------------------------------------------
describe("Lessons E2E: full lifecycle", () => {
  it("starts with zero lessons (list)", () => {
    const { out, code } = run(`node ${LESSONS} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("0 lessons");
  });

  it("starts with no lessons (check)", () => {
    const { out, code } = run(`node ${LESSONS} check ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("No lessons yet");
  });

  it("adds a lesson via CLI", () => {
    const { out, code } = run(`node ${LESSONS} add ${RUN_DIR} --title "vendor-debug"`);
    expect(code).toBe(0);
    expect(out).toContain("Created");

    const filePath = join(TEST_DECK, "_lessons", "vendor-debug.md");
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("# vendor-debug");
    expect(content).toContain("**遇到什么:**");
    expect(content).toContain("**怎么试的:**");
    expect(content).toContain("**结论:**");
    expect(content).toContain("**下次先看哪:**");
  });

  it("prevents overwriting an existing lesson", () => {
    const { code } = run(`node ${LESSONS} add ${RUN_DIR} --title "vendor-debug"`);
    expect(code).not.toBe(0);
  });

  it("adds a second lesson", () => {
    const { code } = run(`node ${LESSONS} add ${RUN_DIR} --title "font-workaround"`);
    expect(code).toBe(0);
    expect(existsSync(join(TEST_DECK, "_lessons", "font-workaround.md"))).toBe(true);
  });

  it("lists both lessons with summaries", () => {
    const { out, code } = run(`node ${LESSONS} list ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("vendor-debug.md");
    expect(out).toContain("font-workaround.md");
    expect(out).toContain("2 lessons");
  });

  it("outputs JSON for machine consumption", () => {
    const { out, code } = run(`node ${LESSONS} list ${RUN_DIR} --json`);
    expect(code).toBe(0);
    const arr = JSON.parse(out);
    expect(arr.length).toBe(2);
    expect(arr.map((x) => x.file).sort()).toEqual([
      "font-workaround.md",
      "vendor-debug.md",
    ]);
  });

  it("check shows reminder with both filenames", () => {
    const { out, code } = run(`node ${LESSONS} check ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("vendor-debug.md");
    expect(out).toContain("font-workaround.md");
    expect(out).toContain("2 lessons to review");
  });

  it("search finds matching lesson", () => {
    const { out, code } = run(`node ${LESSONS} search ${RUN_DIR} "vendor"`);
    expect(code).toBe(0);
    expect(out).toContain("vendor-debug.md");
  });

  it("search reports no matches for unknown keyword", () => {
    const { out, code } = run(`node ${LESSONS} search ${RUN_DIR} "nonexistent999"`);
    expect(code).toBe(0);
    expect(out).toContain("no matches");
  });

  it("ppt_flow status shows lesson count in JSON", () => {
    // initBundle creates a structure-compliant deck; status --json succeeds
    const { out, code } = run(`node ${PPT_FLOW} status ${RUN_DIR} --json`);
    expect(code).toBe(0);
    const data = JSON.parse(out);
    expect(data.lessons_count).toBe(2);
  });

  it("ppt_flow status shows lesson count in human output", () => {
    const { out, code } = run(`node ${PPT_FLOW} status ${RUN_DIR}`);
    expect(code).toBe(0);
    expect(out).toContain("Lessons:");
    expect(out).toContain("2 (");
  });
});
