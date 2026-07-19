import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateAndBuildHtmlFirstPlan } from "../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_contract.mjs";
import { materializeStructuralVersion } from "../PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs";
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from "./helpers/html_first_fixture.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync("node", [FLOW, ...args], {
    cwd: process.cwd(), encoding: "utf8", timeout: 30000,
  });
}

function jsonOutput(result) {
  return JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
}

function previewAndApply(runDir, subcommand, selectors, options = []) {
  const args = ["slides", subcommand, runDir, ...selectors, ...options, "--json"];
  const preview = flow(args);
  expect(preview.status, preview.stderr || preview.stdout).toBe(0);
  const transaction = jsonOutput(preview).transaction;
  const applied = flow([...args, "--apply", "--plan-sha256", transaction.plan_sha256]);
  expect(applied.status, applied.stderr || applied.stdout).toBe(0);
  return jsonOutput(applied);
}

describe("HTML-first structural versioning", () => {
  it("validates preview and staged apply without canonicalizing fences or publishing a plan", () => {
    const fixture = createHtmlFirstRun("html-structural-");
    try {
      const v1SourcePath = join(fixture.runDir, "slide-specifications.md");
      const original = htmlFirstSource([
        htmlFirstSlide({ number: 1, id: "FirstGo", title: "First", body: 'schema_version: 1\nfamily: hero\nhero_statement: "Alpha"\n', note: "Alpha note" }),
        htmlFirstSlide({ number: 2, id: "SecondGo", title: "Second", body: "schema_version: 1\nfamily: hero\nhero_statement: 'Beta'\n", note: "Beta note" }),
      ]);
      writeFileSync(v1SourcePath, original);
      const before = validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir }).plan;

      const moved = previewAndApply(fixture.runDir, "move", ["FirstGo"], ["--to", "end"]);
      const v2 = moved.target_run_dir;
      expect(readFileSync(v1SourcePath, "utf8")).toBe(original);
      const v2Text = readFileSync(join(v2, "slide-specifications.md"), "utf8");
      expect(v2Text.indexOf("`SecondGo`")).toBeLessThan(v2Text.indexOf("`FirstGo`"));
      expect(v2Text).toContain("hero_statement: \"Alpha\"");
      expect(v2Text).toContain("hero_statement: 'Beta'");
      expect(v2Text).toContain("Alpha note");
      expect(v2Text).toContain("Beta note");
      expect(readdirSync(join(v2, "_generated")).filter((name) => name !== "README.md")).toEqual([]);

      const after = validateAndBuildHtmlFirstPlan({ runDir: v2 }).plan;
      for (const id of ["FirstGo", "SecondGo"]) {
        const oldSlide = before.slides.find((slide) => slide.slide_id === id);
        const newSlide = after.slides.find((slide) => slide.slide_id === id);
        expect(newSlide.semantic_content_fingerprint).toBe(oldSlide.semantic_content_fingerprint);
        expect(newSlide.visual_contract_fingerprint).toBe(oldSlide.visual_contract_fingerprint);
      }
      expect(after.ordered_plan_digest).not.toBe(before.ordered_plan_digest);

      const invalidInsert = join(v2, "_scratch", "invalid-insert.md");
      writeFileSync(invalidInsert, `## Slide 03: \`BadMix\`\n\n**VISUAL TYPE**: Content\n**TITLE**: Third\n**IMAGE PROMPT**: legacy\n`);
      const rejected = flow(["slides", "insert", v2, "--source", invalidInsert, "--to", "end", "--json"]);
      expect(rejected.status).toBe(1);
      expect(existsSync(join(fixture.deck, "3_versions", "v3"))).toBe(false);

      const validInsert = join(v2, "_scratch", "valid-insert.md");
      writeFileSync(validInsert, htmlFirstSlide({ number: 3, id: "NewAsk", title: "Third", body: "schema_version: 1\nfamily: hero\nhero_statement: Gamma\n", note: "Gamma note" }));
      const inserted = previewAndApply(v2, "insert", [], ["--source", validInsert, "--to", "end"]);
      const v3 = inserted.target_run_dir;
      expect(readFileSync(join(v3, "slide-specifications.md"), "utf8")).toContain("Gamma note");
      expect(readdirSync(join(v3, "_generated")).filter((name) => name !== "README.md")).toEqual([]);

      const deleted = previewAndApply(v3, "delete", ["NewAsk"]);
      const v4 = deleted.target_run_dir;
      const v4Text = readFileSync(join(v4, "slide-specifications.md"), "utf8");
      expect(v4Text).not.toContain("NewAsk");
      expect(v4Text).toContain("hero_statement: \"Alpha\"");
      expect(v4Text).toContain("hero_statement: 'Beta'");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 20_000);

  it("rejects a missing structural source before target Stage 1 writes", async () => {
    const fixture = createHtmlFirstRun("html-materialization-guard-");
    try {
      const other = join(fixture.deck, "3_versions", "v2");
      writeFileSync(join(fixture.runDir, "_scratch", "placeholder"), "x");
      await expect(materializeStructuralVersion({ sourceRunDir: other, targetRunDir: fixture.runDir }))
        .rejects.toMatchObject({ code: "ENOENT", path: other });
      expect(existsSync(join(fixture.runDir, "_generated", "slide_plan.json"))).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
