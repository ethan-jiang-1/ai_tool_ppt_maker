import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { stage1 } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs";
import { parseCliErrorLine } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from "../helpers/html_first_fixture.mjs";

const STAGE1 = "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage1_build_inputs.mjs";
const UNIFIED = "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs";
const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const STYLE_MASTER = "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/generate_style_master.mjs";

function run(script, args, env = {}) {
  return spawnSync("node", [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30000,
    env: { ...process.env, ...env },
  });
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function snapshot(root) {
  const files = {};
  const visit = (directory) => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files[relative(root, path).split("\\").join("/")] = hashFile(path);
    }
  };
  visit(root);
  return files;
}

function lastEnvelope(result) {
  const line = String(result.stderr || "").trim().split(/\r?\n/).filter(Boolean).at(-1);
  return parseCliErrorLine(line);
}

function failureEnvelopeCount(result) {
  return String(result.stderr || "").split(/\r?\n/).filter(Boolean)
    .map((line) => parseCliErrorLine(line))
    .filter((value) => value?.ok === false).length;
}

describe("HTML-first orchestration boundaries", () => {
  it("keeps all three general validation routes byte-for-byte write-free", () => {
    const fixture = createHtmlFirstRun("html-validation-routes-");
    try {
      const spec = join(fixture.runDir, "slide-specifications.md");
      const before = snapshot(fixture.deck);
      const commands = [
        run(FLOW, ["validate", fixture.runDir]),
        run(STAGE1, ["--validate", "--spec", spec]),
        run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "1", "--dry-run"]),
      ];
      for (const result of commands) expect(result.status, result.stderr || result.stdout).toBe(0);
      expect(snapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("publishes only slide_plan.json and preserves the prior plan on receipt drift", async () => {
    const fixture = createHtmlFirstRun("html-stage1-write-set-");
    try {
      const before = snapshot(fixture.deck);
      const result = run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "1"]);
      expect(result.status, result.stderr || result.stdout).toBe(0);
      const after = snapshot(fixture.deck);
      const added = Object.keys(after).filter((path) => !Object.hasOwn(before, path));
      const changed = Object.keys(before).filter((path) => after[path] !== before[path]);
      expect(added).toEqual(["3_versions/v1/_generated/slide_plan.json"]);
      expect(changed).toEqual([]);
      expect(Object.keys(after).some((path) => /page_prompts|html_production|screenshot|\.pptx|refinement/i.test(path))).toBe(false);

      const planPath = join(fixture.runDir, "_generated", "slide_plan.json");
      const priorPlan = readFileSync(planPath);
      const priorFiles = snapshot(join(fixture.runDir, "_generated"));
      const palettePath = join(fixture.deck, "2_backbone", "visual-style", "color_palette.json");
      const paletteBytes = readFileSync(palettePath);
      const ok = await stage1(fixture.runDir, false, {
        beforeHtmlFirstPublish: () => writeFileSync(palettePath, Buffer.concat([paletteBytes, Buffer.from("\n")])),
      });
      expect(ok).toBe(false);
      expect(readFileSync(planPath)).toEqual(priorPlan);
      expect(snapshot(join(fixture.runDir, "_generated"))).toEqual(priorFiles);
      expect(readdirSync(fixture.runDir).some((name) => name.startsWith(".slide_plan-"))).toBe(false);
      writeFileSync(palettePath, paletteBytes);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not create _generated when HTML-first validation fails", async () => {
    const fixture = createHtmlFirstRun("html-invalid-no-generated-");
    try {
      rmSync(join(fixture.runDir, "_generated"), { recursive: true, force: true });
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), htmlFirstSource([
        htmlFirstSlide({ body: "schema_version: 1\nfamily: cards\n" }),
      ]));
      expect(await stage1(fixture.runDir, false)).toBe(false);
      expect(existsSync(join(fixture.runDir, "_generated"))).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("never reclassifies a marked backup source as legacy when the canonical file is missing", () => {
    const fixture = createHtmlFirstRun("html-canonical-source-");
    try {
      const canonical = join(fixture.runDir, "slide-specifications.md");
      const backup = join(fixture.runDir, "slide-specifications-backup.md");
      renameSync(canonical, backup);
      const before = snapshot(fixture.deck);
      const commands = [
        run(FLOW, ["validate", fixture.runDir]),
        run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "1", "--dry-run"]),
        run(FLOW, ["build", fixture.runDir, "--dry-run"]),
        run(STYLE_MASTER, ["--run-dir", fixture.runDir, "--dry-run"]),
      ];
      for (const result of commands) {
        expect(result.status, result.stderr || result.stdout).toBe(1);
        expect(lastEnvelope(result)?.diagnostic?.reason?.kind, result.stderr).toBe("canonical_source_missing");
      }
      expect(snapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("routes malformed leading frontmatter to source validation before delivery prerequisites", () => {
    const fixture = createHtmlFirstRun("html-malformed-marker-");
    try {
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), "---\nproduction: [\n---\n");
      const before = snapshot(fixture.deck);
      const commands = [
        run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "2", "--dry-run"]),
        run(FLOW, ["build", fixture.runDir, "--dry-run"]),
        run(STYLE_MASTER, ["--run-dir", fixture.runDir, "--dry-run"]),
      ];
      for (const result of commands) {
        expect(result.status, result.stderr || result.stdout).toBe(1);
        expect(lastEnvelope(result)?.diagnostic?.category, result.stderr).toBe("source_validation");
      }
      expect(snapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("routes HTML delivery locally and rejects legacy provider controls before writes", () => {
    const fixture = createHtmlFirstRun("html-delivery-guards-");
    try {
      rmSync(join(fixture.deck, "2_backbone", "visual-style", "style_master_prompt.txt"), { force: true });
      const before = snapshot(fixture.deck);
      const localPreview = run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "2", "--dry-run"], { OPENAI_API_KEY: "", GEMINI_API_KEY: "" });
      expect(localPreview.status, localPreview.stderr).toBe(0);
      expect(localPreview.stdout).toContain("HTML Stage 2");
      const localCompose = run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "1,3", "--dry-run"], { OPENAI_API_KEY: "", GEMINI_API_KEY: "" });
      expect(localCompose.status, localCompose.stderr).toBe(0);
      expect(localCompose.stdout).toContain("HTML Stage 3");
      const localBuild = run(FLOW, ["build", fixture.runDir, "--dry-run"], { OPENAI_API_KEY: "", GEMINI_API_KEY: "" });
      expect(localBuild.status, localBuild.stderr).toBe(0);
      expect(localBuild.stdout).toContain("HTML Stage 5");
      const localPilot = run(FLOW, ["pilot", fixture.runDir, "--dry-run"], { OPENAI_API_KEY: "", GEMINI_API_KEY: "" });
      expect(localPilot.status, localPilot.stderr).toBe(0);
      expect(localPilot.stdout).toContain("HTML Stage 3");
      const localDeckRefresh = run(FLOW, ['refresh', fixture.runDir, '--kind', 'visual', '--all', '--dry-run'], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(localDeckRefresh.status, localDeckRefresh.stderr).toBe(0);
      const refreshProvider = run(FLOW, ['refresh', fixture.runDir, '--kind', 'visual', '--all', '--base-url', 'https://provider.invalid']);
      expect(refreshProvider.status).toBe(1);
      const provider = run(UNIFIED, ["--run-dir", fixture.runDir, "--stage", "2", "--base-url", "https://provider.invalid", "--dry-run"], { OPENAI_API_KEY: "", GEMINI_API_KEY: "" });
      expect(provider.status).toBe(1);
      expect(lastEnvelope(provider)?.code).toBe("USAGE");
      const styleMaster = run(STYLE_MASTER, ["--run-dir", fixture.runDir]);
      expect(styleMaster.status).toBe(1);
      expect(snapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("completes ppt_flow build locally after current HTML review approvals", async () => {
    const fixture = createHtmlFirstRun("html-local-build-");
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ note: 'Ready for delivery' })]));
      const preview = run(FLOW, ['pilot', fixture.runDir], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(preview.status, preview.stderr || preview.stdout).toBe(0);
      const review = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      const contentApproval = run(FLOW, ['approve', fixture.runDir, 'content', '--plan-hash', pending.gates.content.plan.plan_hash]);
      expect(contentApproval.status, contentApproval.stderr || contentApproval.stdout).toBe(0);
      const visualApproval = run(FLOW, ['approve', fixture.runDir, 'visual', '--plan-hash', pending.gates.visual.plan.plan_hash]);
      expect(visualApproval.status, visualApproval.stderr || visualApproval.stdout).toBe(0);
      const built = run(FLOW, ['build', fixture.runDir], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(built.status, built.stderr || built.stdout).toBe(0);
      expect(existsSync(join(fixture.runDir, '_generated', 'ppt', 'deck.pptx'))).toBe(true);
      expect(existsSync(join(fixture.runDir, '_generated', 'qa', 'notes_injection.json'))).toBe(true);

      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ title: 'Locally changed', note: 'Ready for delivery' })]));
      const refreshed = run(FLOW, ['refresh', fixture.runDir, '--kind', 'title', '--only', 'HeroGo'], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(refreshed.status, refreshed.stderr || refreshed.stdout).toBe(0);
      expect(refreshed.stdout).toContain('HTML review required');
      const afterEdit = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(afterEdit.gates.content.ready).toBe(false);
      expect(afterEdit.gates.visual.ready).toBe(true);
      const contentReapproval = run(FLOW, ['approve', fixture.runDir, 'content', '--plan-hash', afterEdit.gates.content.plan.plan_hash]);
      expect(contentReapproval.status, contentReapproval.stderr || contentReapproval.stdout).toBe(0);
      const delivered = run(FLOW, ['refresh', fixture.runDir, '--kind', 'title', '--only', 'HeroGo'], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(delivered.status, delivered.stderr || delivered.stdout).toBe(0);
      expect(delivered.stdout).toContain('HTML Stage 5');
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ title: 'Locally changed', note: 'Updated notes only' })]));
      const notesOnly = run(FLOW, ['refresh', fixture.runDir, '--kind', 'notes'], { OPENAI_API_KEY: '', GEMINI_API_KEY: '' });
      expect(notesOnly.status, notesOnly.stderr || notesOnly.stdout).toBe(0);
      expect(notesOnly.stdout).toContain('HTML Stage 5');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
