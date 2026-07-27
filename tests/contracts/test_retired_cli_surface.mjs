import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { initBundle, initLegacyFixtureBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createDefaultState, resolveRunProductionAdapter, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function run(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

describe("retired production CLI surface", () => {
  it("initializes and resolves only the current Page Authority route", () => {
    const root = mkdtempSync(join(tmpdir(), "current-route-"));
    try {
      const deck = join(root, "deck_current");
      expect(() => initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" })).toThrow(/only supports image2-page-authority/);
      initBundle(deck, null, "keynote", "dark-executive");
      const route = resolveRunProductionAdapter(deck, { runDir: join(deck, "3_versions", "v1") });
      expect(route).toMatchObject({ ok: true, mode: "image2-page-authority", adapter: "page-authority-image2" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("exposes Page Authority commands only and fences a recognized historical run at adoption", () => {
    const help = run(["--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).not.toMatch(/\b(?:approve|pilot|style-master)\b/);
    expect(help.stdout).toContain("image2 [options] <operation> <run_dir>");

    const root = mkdtempSync(join(tmpdir(), "retired-cli-surface-"));
    try {
      const deck = join(root, "deck_historical");
      initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: `PastGo`\n\n**TITLE**: Historical\n");
      const state = createDefaultState();
      state.pipeline = "whole-page-image2-v1";
      state.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
      writeState(deck, state);

      const status = run(["status", runDir, "--json"]);
      expect(status.status).toBe(1);
      expect(status.stderr).toContain("LEGACY_PROTOCOL_ADOPTION_REQUIRED");
      expect(status.stderr).toContain("prepare-legacy-adoption");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
