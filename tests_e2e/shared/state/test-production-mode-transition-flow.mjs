import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createDefaultState, readState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { htmlFirstSlide, htmlFirstSource } from "../../../tests/helpers/html_first_fixture.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const intake = {
  topic: "Target-owned topic", audience: "Target audience", duration: "20 minutes", language: "English",
  takeaway: "One explicit target takeaway", content_constraints: "No inherited renderer source",
  visual_dna: "Target-owned visual control", success_criteria: "Runnable target contract",
};

function source(marker) {
  const pipeline = marker === "html"
    ? "html-first-v1"
    : marker === "whole-page"
      ? "whole-page-image2-v1"
      : (() => { throw new Error(`unsupported test source marker ${marker}`); })();
  const frontmatter = `---\nproduction:\n  pipeline: ${pipeline}\n---\n\n`;
  return `${frontmatter}## Slide 01: \`HeroGo\`\n\n**TITLE**: Explicit target source\n`;
}

function flow(args) {
  return spawnSync("node", [FLOW, ...args], { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 });
}

function setup({ sourceMarker, sourceMode }) {
  const root = mkdtempSync(join(tmpdir(), "production-mode-transition-e2e-"));
  const deck = join(root, "deck_transition_e2e");
  initBundle(deck, null, "keynote", "dark-executive", { mode: sourceMode });
  const runDir = join(deck, "3_versions", "v1");
  writeFileSync(join(runDir, "slide-specifications.md"), source(sourceMarker));
  const state = createDefaultState();
  state.pipeline = sourceMarker === "html" ? "html-first-v1" : "whole-page-image2-v1";
  state.playbook = "create-deck";
  state.current_node = sourceMode === "image2-only" ? "author-whole-page-content" : "author-structured-content";
  state.execution_id = "exec-source";
  state.execution_started_at = "2026-07-22T00:00:00.000Z";
  state.run_version = "v1";
  state.nodes[state.current_node] = { status: "in_progress", execution_id: state.execution_id, run_version: "v1" };
  state.production_mode.by_version["3_versions/v1"] = { mode: sourceMode };
  writeState(deck, state);
  return { root, deck, runDir };
}

function authorCandidate(runDir, targetMode) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(intake));
  mkdirSync(join(candidate, "overrides", "visual-style"), { recursive: true });
  if (targetMode === "html-only") {
    writeFileSync(join(candidate, "slide-specifications.md"), htmlFirstSource([htmlFirstSlide({ id: "HeroGo", title: "Target HTML source" })]));
    copyFileSync(join(runDir, "..", "..", "2_backbone", "visual-style", "color_palette.json"), join(candidate, "overrides", "visual-style", "color_palette.json"));
  } else {
    writeFileSync(join(candidate, "slide-specifications.md"), source("whole-page"));
    writeFileSync(join(candidate, "overrides", "visual-style", "color_palette.json"), "{}\n");
  }
}

function completeViaCli(fixture, targetMode) {
  const prepared = flow(["state", fixture.runDir, "--prepare-production-mode-transition", targetMode]);
  expect(prepared.status, prepared.stderr).toBe(0);
  authorCandidate(fixture.runDir, targetMode);
  const preview = flow(["state", fixture.runDir, "--preview-production-mode-transition"]);
  expect(preview.status, preview.stderr).toBe(0);
  const plan = JSON.parse(preview.stdout);
  const confirm = flow(["state", fixture.runDir, "--confirm-production-mode-transition", "--plan-hash", plan.plan_hash]);
  expect(confirm.status, confirm.stderr).toBe(0);
  const applied = flow(["state", fixture.runDir, "--apply-production-mode-transition", "--plan-hash", plan.plan_hash]);
  expect(applied.status, applied.stderr).toBe(0);
  return JSON.parse(applied.stdout);
}

describe("state-owned production-mode transition E2E", () => {
  it("publishes isolated Image2-to-HTML and HTML-to-Image2 targets without a preview provider call", () => {
    const image2Source = setup({ sourceMarker: "whole-page", sourceMode: "image2-only" });
    const htmlSource = setup({ sourceMarker: "html", sourceMode: "html-only" });
    try {
      const html = completeViaCli(image2Source, "html-only");
      expect(html).toMatchObject({ target_mode: "html-only", needs_local_materialization: true, current_node: "preview-content" });
      const htmlTarget = join(image2Source.deck, "3_versions", "v2");
      expect(existsSync(join(htmlTarget, "_generated", "html_production"))).toBe(false);
      expect(readState(image2Source.deck, { purpose: "observe", heal: false, runVersion: "v2" }).production_mode.by_version["3_versions/v2"]).toEqual({ mode: "html-only" });

      const image2 = completeViaCli(htmlSource, "image2-only");
      expect(image2).toMatchObject({ target_mode: "image2-only", needs_render: true, current_node: "authorize-image2-style-master" });
      const image2Target = join(htmlSource.deck, "3_versions", "v2");
      expect(existsSync(join(image2Target, "_generated", "html_production"))).toBe(false);
      const state = readState(htmlSource.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "image2-only" });
      expect(state.nodes["image2-provider-authorization"]).toBeUndefined();
    } finally {
      rmSync(image2Source.root, { recursive: true, force: true });
      rmSync(htmlSource.root, { recursive: true, force: true });
    }
  }, 120_000);
});
