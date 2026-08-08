import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_INIT_MODE,
  PAGE_IMAGE_WORKFLOW_PATHS,
  checkBundle,
  checkProgressivePageProductionHistoryLayout,
  checkStyleMasterCompatibilityPayload,
  checkStyleMasterHistoryLayout,
  initBundle,
  pageImageWorkflowPaths,
  pageImageProgressiveRawPaths,
  pageImageStyleMasterPaths,
  renderTree,
  STYLE_MASTER_IMAGE,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE,
  initialProductionModeRecord,
  inspectProductionMode,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/production_mode.mjs";
import {
  createInitialState,
  initializeTargetPageImageState,
  readState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import {
  PAGE_IMAGE_WORKFLOW_V1_PIPELINE,
  PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
  probeProductionMarker,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/production_marker.mjs";

describe("Page Image bundle layout", () => {
  it("declares one rebuildable Page Image artifact topology", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-layout-"));
    try {
      const runDir = join(root, "deck_current", "3_versions", "v1");
      const paths = pageImageWorkflowPaths(runDir);
      expect(Object.keys(paths).sort()).toEqual(Object.keys(PAGE_IMAGE_WORKFLOW_PATHS).sort());
      expect(paths.raw_manifest).toContain("_generated/page_image_workflow/raw/plan-manifest-v1.json");
      expect(paths.target_provider_request_inspection).toContain("_generated/page_image_workflow/raw/provider-input-inspection-v1.json");
      expect(paths.final_manifest).toContain("_generated/page_image_workflow/final/manifest-v1.json");
      expect(paths.delivery_media_root).toContain("_generated/page_image_workflow/final/delivery-media");
      expect(paths.delivery_media_manifest).toContain("_generated/page_image_workflow/final/delivery-media-manifest-v1.json");
      expect(renderTree()).toContain("NN_slideID.png");
      expect(renderTree()).toContain("delivery-media/{NN_slideID.jpg}");
      expect(renderTree()).toContain("delivery-media-manifest-v1.json");
      expect(renderTree()).toContain("page_image_workflow");
      expect(renderTree()).not.toContain("html_production");
      expect(renderTree()).toContain("page-image-style-master-iterations");
      expect(renderTree()).toContain("scopes/vN/{framed,pure}/head.json");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("initializes a current authoring draft without guessing its workflow", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-init-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      expect(DEFAULT_INIT_MODE).toBe(PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE);
      const source = readFileSync(join(runDir, "slide-specifications.md"), "utf8");
      expect(source).toContain("pipeline: page-image-workflow-v1");
      expect(source).not.toMatch(/^  workflow:/m);
      expect(source).not.toContain("page_image_default");
      expect(checkBundle(runDir, false)).toEqual([PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE]);
      const state = readState(deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state.pipeline).toBe(PAGE_IMAGE_WORKFLOW_V1_PIPELINE);
      expect(state.production_mode.by_version["3_versions/v1"]).toBeUndefined();
      expect(state.current_node).toBe("select-target-page-image-workflow");
      expect(existsSync(pageImageWorkflowPaths(runDir).root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes structured diagnostic guidance for runtime Agents", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-diagnostic-guide-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck, null, "keynote", "dark-executive");
      const guide = readFileSync(join(deck, "deck-guide.md"), "utf8");
      expect(guide).toMatch(/final valid JSON failure envelope on stderr/);
      expect(guide).toContain("diagnostic.category");
      expect(guide).toContain("diagnostic.next");
      expect(guide).toMatch(/never prose/);
      expect(guide).toMatch(/1\. \*\*What happened\*\*/);
      expect(guide).toMatch(/2\. \*\*What it affects\*\*/);
      expect(guide).toMatch(/3\. \*\*What the Agent can mechanically do\*\*/);
      expect(guide).toMatch(/4\. \*\*The one human action or confirmation required\*\*/);
      expect(guide).toMatch(/No human action is required now/i);
      expect(guide).toMatch(/This\s+guide does not locate a run or select pre-install recovery/i);
      expect(guide).not.toMatch(/code\s*\+\s*hint.*repair/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds an explicit current workflow through the state owner after authoring", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-target-bind-"));
    try {
      const deck = join(root, "deck_target");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const source = "---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-image-workflow-v1\n  workflow: pure\n---\n\n## Slide 01: `DeckGo`\n\n**TITLE**: Target source\n";
      writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
      const result = initializeTargetPageImageState(deck, {
        runDir,
        sourceReceipt: {
          schema: "page-image-workflow-source-v1",
          pipeline: "page-image-workflow-v1",
          workflow: "pure",
          source_sha256: createHash("sha256").update(source).digest("hex"),
          slides: [{ slide_id: "DeckGo", position: 1 }],
        },
      });
      expect(result).toMatchObject({ ok: true, status: "initialized" });
      expect(readState(deck, { purpose: "observe", heal: false, runVersion: "v1" })
        .production_mode.by_version["3_versions/v1"])
        .toEqual({ mode: PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, workflow: "pure", source_epoch: 1 });
      expect(checkBundle(runDir, false)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects every non-Page-Image generated owner from current validation", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-owner-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck);
      const runDir = join(deck, "3_versions", "v1");
      const retiredOwner = join(runDir, "_generated", "retired-owner");
      writeFileSync(retiredOwner, "not current", "utf8");
      expect(checkBundle(runDir, false)).toContain("unexpected current generated owner 'retired-owner' — Page Image owns page_image_workflow/ only");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps staging and unreferenced plans non-authoritative during layout inspection", () => {
    const root = mkdtempSync(join(tmpdir(), "style-master-layout-history-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const paths = pageImageStyleMasterPaths(runDir);
      const planSha256 = "a".repeat(64);
      const staging = join(paths.staging_root, "plan-crashed");
      const unreferencedPlan = join(paths.plans_root, planSha256);
      const overridePath = join(runDir, "overrides", "visual-style", STYLE_MASTER_IMAGE);
      mkdirSync(staging, { recursive: true });
      mkdirSync(unreferencedPlan, { recursive: true });
      writeFileSync(join(staging, "candidate-plan.json"), "partial", "utf8");
      writeFileSync(join(unreferencedPlan, "candidate-plan.json"), "complete-but-unreferenced", "utf8");
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const stagingBefore = readFileSync(join(staging, "candidate-plan.json"));
      const planBefore = readFileSync(join(unreferencedPlan, "candidate-plan.json"));

      expect(checkStyleMasterHistoryLayout(runDir)).toEqual([]);
      expect(checkBundle(runDir, false)).toEqual([PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE]);
      expect(existsSync(join(paths.scopes_root, "v1", "framed", "head.json"))).toBe(false);
      expect(existsSync(overridePath)).toBe(false);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(readFileSync(join(staging, "candidate-plan.json"))).toEqual(stagingBefore);
      expect(readFileSync(join(unreferencedPlan, "candidate-plan.json"))).toEqual(planBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps progressive page-production staging and unreferenced plans non-authoritative", () => {
    const root = mkdtempSync(join(tmpdir(), "progressive-page-production-layout-history-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const paths = pageImageProgressiveRawPaths(runDir);
      const planSha256 = "a".repeat(64);
      const staging = join(paths.staging_root, "plan-crashed");
      const unreferencedPlan = join(paths.plans_root, planSha256);
      mkdirSync(staging, { recursive: true });
      mkdirSync(unreferencedPlan, { recursive: true });
      writeFileSync(join(staging, "work-plan.json"), "partial", "utf8");
      writeFileSync(join(unreferencedPlan, "work-plan.json"), "complete-but-unreferenced", "utf8");
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const stagingBefore = readFileSync(join(staging, "work-plan.json"));
      const planBefore = readFileSync(join(unreferencedPlan, "work-plan.json"));

      expect(checkProgressivePageProductionHistoryLayout(runDir)).toEqual([]);
      expect(checkBundle(runDir, false)).toEqual([PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE]);
      expect(existsSync(join(paths.scopes_root, "v1", "pure", "head.json"))).toBe(false);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(readFileSync(join(staging, "work-plan.json"))).toEqual(stagingBefore);
      expect(readFileSync(join(unreferencedPlan, "work-plan.json"))).toEqual(planBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports malformed progressive page-production topology without selecting or cleaning it", () => {
    const root = mkdtempSync(join(tmpdir(), "progressive-page-production-layout-invalid-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const paths = pageImageProgressiveRawPaths(runDir);
      mkdirSync(join(paths.scopes_root, "v7", "unexpected-workflow"), { recursive: true });
      writeFileSync(join(paths.history_root, "current.json"), "not-a-head", "utf8");
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      expect(checkProgressivePageProductionHistoryLayout(runDir)).toEqual(expect.arrayContaining([
        expect.stringContaining("unexpected 'current.json' in progressive page-production history"),
        expect.stringContaining("progressive page-production scope v7 contains noncanonical workflow 'unexpected-workflow'"),
      ]));
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(join(paths.scopes_root, "v7", "unexpected-workflow"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports invalid Style Master history topology without selecting or cleaning it", () => {
    const root = mkdtempSync(join(tmpdir(), "style-master-layout-invalid-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const paths = pageImageStyleMasterPaths(runDir);
      mkdirSync(join(paths.scopes_root, "v7", "unexpected-workflow"), { recursive: true });
      writeFileSync(join(paths.history_root, "current.json"), "not-a-head", "utf8");
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      expect(checkStyleMasterHistoryLayout(runDir)).toEqual(expect.arrayContaining([
        expect.stringContaining("unexpected 'current.json' in Style Master history"),
        expect.stringContaining("Style Master scope v7 contains noncanonical workflow 'unexpected-workflow'"),
      ]));
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(join(paths.scopes_root, "v7", "unexpected-workflow"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses the override-first compatibility path and requires JPEG only for an accepted projection", () => {
    const root = mkdtempSync(join(tmpdir(), "style-master-layout-payload-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(4, 3);
      const png = Buffer.from(canvas.toBuffer("image/png"));
      const jpeg = Buffer.from(canvas.toBuffer("image/jpeg"));
      const backbonePath = styleAsset(runDir, STYLE_MASTER_IMAGE);
      const overridePath = join(runDir, "overrides", "visual-style", STYLE_MASTER_IMAGE);
      writeFileSync(backbonePath, png);

      expect(styleAsset(runDir, STYLE_MASTER_IMAGE)).toBe(backbonePath);
      expect(checkStyleMasterCompatibilityPayload(runDir)).toEqual([]);
      expect(checkStyleMasterCompatibilityPayload(runDir, { requireJpeg: true }))
        .toEqual([`accepted Style Master compatibility payload must be a valid JPEG at ${backbonePath}`]);

      mkdirSync(join(runDir, "overrides", "visual-style"), { recursive: true });
      writeFileSync(overridePath, jpeg);
      expect(styleAsset(runDir, STYLE_MASTER_IMAGE)).toBe(overridePath);
      expect(checkStyleMasterCompatibilityPayload(runDir, { requireJpeg: true })).toEqual([]);
      expect(readFileSync(backbonePath)).toEqual(png);

      rmSync(join(runDir, "overrides"), { recursive: true, force: true });
      writeFileSync(backbonePath, jpeg);
      expect(styleAsset(runDir, STYLE_MASTER_IMAGE)).toBe(backbonePath);
      expect(checkStyleMasterCompatibilityPayload(runDir, { requireJpeg: true })).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("resolves v2 workflow state marker-first and rejects a workflow mismatch", () => {
    const source = `---\nproduction:\n  pipeline: ${PAGE_IMAGE_WORKFLOW_V1_PIPELINE}\n  workflow: pure\n---\n`;
    const state = {
      production_mode: {
        by_version: { "3_versions/v2": initialProductionModeRecord(PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, "pure") },
      },
    };
    expect(inspectProductionMode({ state, runVersion: "v2", sourceMarker: probeProductionMarker(source) })).toMatchObject({
      ok: true,
      mode: PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE,
      workflow: "pure",
    });
    state.production_mode.by_version["3_versions/v2"] = initialProductionModeRecord(PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, "framed");
    const beforeMismatchInspection = structuredClone(state);
    expect(inspectProductionMode({ state, runVersion: "v2", sourceMarker: probeProductionMarker(source) })).toMatchObject({
      ok: false,
      code: "MODE_SOURCE_IDENTITY_MISMATCH",
    });
    expect(state).toEqual(beforeMismatchInspection);
    expect(() => createInitialState("target", "keynote", "dark", { mode: PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE })).toThrow("workflow");
    expect(createInitialState("target", "keynote", "dark", { mode: PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, workflow: "pure" })
      .production_mode.by_version["3_versions/v1"])
      .toEqual({ mode: PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, workflow: "pure", source_epoch: 1 });
  });
});
