import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle, initLegacyFixtureBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createDefaultState,
  createInitialState,
  initializeTargetPageAuthorityState,
  resolveRunProductionAdapter,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function run(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

describe("retired production CLI surface", () => {
  it("resolves exact v1 compatibility and v2 selected workflows, while rejecting a hybrid pair", () => {
    const root = mkdtempSync(join(tmpdir(), "current-route-"));
    try {
      const deck = join(root, "deck_current");
      expect(() => initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" })).toThrow(/only supports image2-page-authority/);
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const v2Source = "---\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n";
      writeFileSync(join(runDir, "slide-specifications.md"), v2Source);
      initializeTargetPageAuthorityState(deck, {
        runDir,
        sourceReceipt: {
          schema: "page-authority-image2-source-v2",
          pipeline: "page-authority-image2-v2",
          workflow: "pure",
          source_sha256: createHash("sha256").update(v2Source).digest("hex"),
          slides: [{ slide_id: "DeckGo", workflow: "pure" }],
        },
      });
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: true,
        mode: "image2-page-authority-v2",
        workflow: "pure",
        adapter: "page-authority-image2-v2",
      });

      const v1Source = "---\nproduction:\n  pipeline: page-authority-image2-v1\n  page_authority_default: pure-image2\n---\n";
      writeFileSync(join(runDir, "slide-specifications.md"), v1Source);
      writeState(deck, createInitialState("current", "keynote", "dark-executive"));
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: true,
        mode: "image2-page-authority",
        adapter: "page-authority-image2",
      });

      writeFileSync(join(runDir, "slide-specifications.md"), v2Source);
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: false,
        code: "MODE_SOURCE_IDENTITY_MISMATCH",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("routes fresh v2 image2 planning through the selected workflow owner", () => {
    const root = mkdtempSync(join(tmpdir(), "target-cli-surface-"));
    const deck = join(root, "deck_target_cli");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Target CLI source
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Target CLI source-owned note.
`);
      const result = run(["image2", "plan", runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        workflow: "pure",
        maximum_submissions: 1,
      });
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: true,
        adapter: "page-authority-image2-v2",
        workflow: "pure",
      });
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
