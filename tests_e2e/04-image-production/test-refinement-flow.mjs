import { describe, expect, it } from "vitest";
import { buildPlan } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/transport.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createVersion, initWholePageBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { recomposeHtmlSlidesLocally } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";
import { readImage2RefinementState, readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { createCurrentHtmlDelivery } from "../../tests/helpers/image2_refinement_fixture.mjs";

describe("Phase 4 refinement boundary", () => {
  it("plans only bounded visual-slot scopes", () => {
    expect(() => buildPlan({ slides: [] })).toThrow();
  });

  it("keeps fresh delivery, local edits, and structural vNext provider-free", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-normal-html-paths-");
    const transport = createFakeRefinementTransport({ onSubmit: async () => { throw new Error("normal HTML work must not submit"); } });
    try {
      const refinementAbsent = (runDir, version) => {
        expect(existsSync(join(runDir, "_generated", "image2_refinement"))).toBe(false);
        expect(existsSync(join(runDir, "_scratch", "image2_refinement"))).toBe(false);
        expect(readImage2RefinementState(readState(fixture.deck), version)).toBeNull();
      };
      refinementAbsent(fixture.runDir, "v1");

      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      writeFileSync(sourcePath, readFileSync(sourcePath, "utf8").replace("**TITLE**: Alpha", "**TITLE**: Alpha revised"));
      expect(await recomposeHtmlSlidesLocally(fixture.runDir, { slideIds: ["AlphaGo"] })).toMatchObject({ provider_calls: 0 });
      refinementAbsent(fixture.runDir, "v1");

      const v2 = createVersion(fixture.runDir, "v2");
      refinementAbsent(v2, "v2");
      expect(await recomposeHtmlSlidesLocally(v2)).toMatchObject({ provider_calls: 0 });
      refinementAbsent(v2, "v2");
      expect(transport.submitCount).toBe(0);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

  it("keeps explicit whole-page maintenance outside modern refinement", () => {
    const root = mkdtempSync(join(tmpdir(), "image2-explicit whole-page-normal-"));
    const deck = join(root, "deck_legacy");
    const transport = createFakeRefinementTransport({ onSubmit: async () => { throw new Error("explicit whole-page maintenance must not submit modern work"); } });
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const status = spawnSync(process.execPath, ["PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs", "status", runDir, "--json"], { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 });
      expect(status.status, status.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({ pipeline: "whole-page-image2-v1" });
      expect(existsSync(join(runDir, "_generated", "image2_refinement"))).toBe(false);
      expect(existsSync(join(runDir, "_scratch", "image2_refinement"))).toBe(false);
      expect(readImage2RefinementState(readState(deck), "v1")).toBeNull();
      expect(transport.submitCount).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
