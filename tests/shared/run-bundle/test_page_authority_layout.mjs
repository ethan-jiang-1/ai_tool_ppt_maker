import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_INIT_MODE,
  PAGE_AUTHORITY_IMAGE2_PATHS,
  checkBundle,
  initBundle,
  initLegacyFixtureBundle,
  pageAuthorityImage2Paths,
  renderTree,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  TARGET_PRODUCTION_MODE,
  initialProductionModeRecord,
  inspectProductionMode,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/production_mode.mjs";
import {
  createInitialState,
  initializeTargetPageAuthorityState,
  readState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
  TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
  probeProductionMarker,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/production_marker.mjs";

describe("Page Authority bundle layout", () => {
  it("declares one rebuildable Page Authority artifact topology", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-layout-"));
    try {
      const runDir = join(root, "deck_current", "3_versions", "v1");
      const paths = pageAuthorityImage2Paths(runDir);
      expect(Object.keys(paths).sort()).toEqual(Object.keys(PAGE_AUTHORITY_IMAGE2_PATHS).sort());
      expect(paths.raw_manifest).toContain("_generated/page_authority_image2/raw/manifest.json");
      expect(paths.final_manifest).toContain("_generated/page_authority_image2/final/manifest.json");
      expect(renderTree()).toContain("page_authority_image2");
      expect(renderTree()).not.toContain("html_production");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("initializes a v2 authoring draft without guessing its workflow", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-init-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      expect(DEFAULT_INIT_MODE).toBe(TARGET_PRODUCTION_MODE);
      const source = readFileSync(join(runDir, "slide-specifications.md"), "utf8");
      expect(source).toContain("pipeline: page-authority-image2-v2");
      expect(source).not.toMatch(/^  workflow:/m);
      expect(source).not.toContain("page_authority_default");
      expect(checkBundle(runDir, false)).toEqual([TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE]);
      const state = readState(deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state.pipeline).toBe(PAGE_AUTHORITY_IMAGE2_V2_PIPELINE);
      expect(state.production_mode.by_version["3_versions/v1"]).toBeUndefined();
      expect(state.current_node).toBe("select-target-page-authority-workflow");
      expect(existsSync(pageAuthorityImage2Paths(runDir).root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds an explicit v2 workflow through the state owner after authoring", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-target-bind-"));
    try {
      const deck = join(root, "deck_target");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const source = "---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n\n## Slide 01: `DeckGo`\n\n**TITLE**: Target source\n";
      writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
      const result = initializeTargetPageAuthorityState(deck, {
        runDir,
        sourceReceipt: {
          schema: "page-authority-image2-source-v2",
          pipeline: "page-authority-image2-v2",
          workflow: "pure",
          source_sha256: createHash("sha256").update(source).digest("hex"),
          slides: [{ slide_id: "DeckGo", workflow: "pure" }],
        },
      });
      expect(result).toMatchObject({ ok: true, status: "initialized" });
      expect(readState(deck, { purpose: "observe", heal: false, runVersion: "v1" })
        .production_mode.by_version["3_versions/v1"])
        .toEqual({ mode: TARGET_PRODUCTION_MODE, workflow: "pure", source_epoch: 1 });
      expect(checkBundle(runDir, false)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects every non-Page-Authority generated owner from current validation", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-owner-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck);
      const runDir = join(deck, "3_versions", "v1");
      const retiredOwner = join(runDir, "_generated", "retired-owner");
      writeFileSync(retiredOwner, "not current", "utf8");
      expect(checkBundle(runDir, false)).toContain("unexpected current generated owner 'retired-owner' — Page Authority owns page_authority_image2/ only");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps historical fixture construction explicitly observer-only", () => {
    const root = mkdtempSync(join(tmpdir(), "legacy-observer-fixture-"));
    try {
      const deck = join(root, "deck_historical");
      initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
      const runDir = join(deck, "3_versions", "v1");
      expect(checkBundle(runDir, false)).toContain("historical production source is observer/adoption-only and cannot pass normal bundle validation");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("resolves v2 workflow state marker-first and rejects a workflow mismatch", () => {
    const source = `---\nproduction:\n  pipeline: ${PAGE_AUTHORITY_IMAGE2_V2_PIPELINE}\n  workflow: pure\n---\n`;
    const state = {
      production_mode: {
        by_version: { "3_versions/v2": initialProductionModeRecord(TARGET_PRODUCTION_MODE, "pure") },
      },
    };
    expect(inspectProductionMode({ state, runVersion: "v2", sourceMarker: probeProductionMarker(source) })).toMatchObject({
      ok: true,
      mode: TARGET_PRODUCTION_MODE,
      workflow: "pure",
    });
    state.production_mode.by_version["3_versions/v2"] = initialProductionModeRecord(TARGET_PRODUCTION_MODE, "framed");
    const beforeMismatchInspection = structuredClone(state);
    expect(inspectProductionMode({ state, runVersion: "v2", sourceMarker: probeProductionMarker(source) })).toMatchObject({
      ok: false,
      code: "MODE_SOURCE_IDENTITY_MISMATCH",
    });
    expect(state).toEqual(beforeMismatchInspection);
    expect(() => createInitialState("target", "keynote", "dark", { mode: TARGET_PRODUCTION_MODE })).toThrow("workflow");
    expect(createInitialState("target", "keynote", "dark", { mode: TARGET_PRODUCTION_MODE, workflow: "pure" })
      .production_mode.by_version["3_versions/v1"])
      .toEqual({ mode: TARGET_PRODUCTION_MODE, workflow: "pure", source_epoch: 1 });
  });
});
