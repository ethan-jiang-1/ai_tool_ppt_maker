import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";

import { createHtmlFirstRun } from "../../helpers/html_first_fixture.mjs";
import { initBundle, initLegacyFixtureBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { buildPageAuthorityRawPlan } from "../../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/operations.mjs";
import { writePageAuthorityRawManifest } from "../../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_manifest.mjs";
import { renderPageAuthorityRawReviewProjection, writePageAuthorityRawReviewCoverage } from "../../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_review.mjs";
import { readState, recordImage2DeliveryReview, transitionProductionMode, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  WORKFLOW_INSPECTION_SCHEMA,
  canonicalJson,
  inspectWorkflow,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function pageAuthoritySource() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Slide 01: \`DeckGo\`

**TITLE**: Inspect direct evidence
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Explain the direct evidence path.
`;
}

describe("workflow inspection", () => {
  it("returns one typed primary action without changing observed files", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-unit-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      const before = { state: readFileSync(statePath), source: readFileSync(sourcePath) };
      const result = inspectWorkflow({ runDir: fixture.runDir });

      expect(result.schema).toBe(WORKFLOW_INSPECTION_SCHEMA);
      expect(result.primary_action).toMatchObject({
        owner: expect.any(String),
        action_id: expect.any(String),
        kind: expect.any(String),
        requires_human: expect.any(Boolean),
      });
      expect(result.observations).toEqual([]);
      expect(readFileSync(statePath)).toEqual(before.state);
      expect(readFileSync(sourcePath)).toEqual(before.source);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("performs no tree write or provider call while observing", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-pure-");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const before = treeSnapshot(fixture.deck);
      const result = inspectWorkflow({ runDir: fixture.runDir });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.checkpoint)).toBe(true);
      expect(Object.isFrozen(result.primary_action)).toBe(true);
      expect(Object.isFrozen(result.observations)).toBe(true);
    } finally {
      fetchSpy.mockRestore();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("uses deterministic canonical bytes for an unchanged checkpoint", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-parity-");
    try {
      const first = inspectWorkflow({ runDir: fixture.runDir });
      const second = inspectWorkflow({ runDir: fixture.runDir });
      expect(canonicalJson(first)).toBe(canonicalJson(second));
      expect(first.checkpoint).toEqual(second.checkpoint);
      expect(Object.keys(first.checkpoint)).not.toContain("observed_at");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("short-circuits later workflow facts when layout is invalid", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-layout-");
    try {
      rmSync(join(fixture.runDir, "slide-specifications.md"));
      writeFileSync(join(fixture.deck, "_state", "state.yaml"), "][}{\n", "utf8");
      const result = inspectWorkflow({ runDir: fixture.runDir });
      expect(result).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "run-bundle-layout" },
        primary_action: { owner: "run-bundle-layout", kind: "repair" },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps requested intent non-authoritative", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-intent-");
    try {
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: "build-now" }))
        .toMatchObject({ posture: "guide", root_cause: { kind: "requested-intent-invalid" } });
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: {} }))
        .toMatchObject({ posture: "guide", root_cause: { kind: "requested-intent-invalid" } });
      expect(inspectWorkflow({
        runDir: fixture.runDir,
        requestedIntent: { schema: "pptmaker-workflow-observation-intent-v1", owner: "image2-refinement", action_id: "resume" },
      })).toMatchObject({ posture: "guide", root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" } });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("routes an exact historical Image2 run to provider-free Page Authority adoption", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-image2-"));
    const deck = join(root, "deck_image2");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
      expect(inspectWorkflow({ runDir })).toMatchObject({
        posture: "guide",
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { owner: "legacy-protocol", action_id: "prepare-legacy-adoption", kind: "continue" },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects only Page Authority prerequisites for a fresh Page Authority run", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-page-authority-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-page-authority" });
      const before = treeSnapshot(deck);
      const result = inspectWorkflow({ runDir });
      expect(result).toMatchObject({
        posture: "guide",
        root_cause: { owner: "page-authority", kind: "source-receipt-missing-or-stale" },
        primary_action: { owner: "page-authority", action_id: "validate-source", kind: "continue" },
        evidence_summary: { mode: "image2-page-authority" },
      });
      expect(result.primary_action.command).toContain(" validate ");
      expect(result.primary_action.command).not.toContain("header");
      expect(result.primary_action.command).not.toContain("image2-refine");
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("distinguishes Page Authority raw-review confirmation from stale evidence without legacy routing", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-page-authority-review-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-page-authority" });
      writeFileSync(join(runDir, "slide-specifications.md"), pageAuthoritySource(), "utf8");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), "style-master-bytes", "utf8");

      const plan = buildPageAuthorityRawPlan(runDir);
      writePageAuthorityRawManifest(runDir, {
        rawBatch: plan.raw_batch,
        sourceEpoch: plan.source_epoch,
        images: { DeckGo: createCanvas(2000, 1125).toBuffer("image/png") },
      });
      const projection = await renderPageAuthorityRawReviewProjection(runDir, { rawBatch: plan.raw_batch });
      writePageAuthorityRawReviewCoverage(runDir, { sourceEpoch: plan.source_epoch, projection });

      const before = treeSnapshot(deck);
      const confirm = inspectWorkflow({ runDir });
      expect(confirm).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "page-authority", kind: "RAW_REVIEW_CONFIRM_REQUIRED" },
        primary_action: {
          owner: "page-authority",
          action_id: "confirm_raw_review",
          kind: "review",
          requires_human: true,
        },
      });
      expect(confirm.primary_action.command).toContain("image2 accept");
      expect(confirm.primary_action.command).not.toContain("header");
      expect(confirm.primary_action.command).not.toContain("image2-refine");
      expect(treeSnapshot(deck)).toEqual(before);

      writeFileSync(projection.path, "tampered", "utf8");
      const stale = inspectWorkflow({ runDir });
      expect(stale).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "page-authority", kind: "RAW_REVIEW_EVIDENCE_STALE" },
        primary_action: {
          owner: "page-authority",
          action_id: "repair_raw_review",
          kind: "repair",
          requires_human: false,
        },
      });
      expect(stale.primary_action.command).toContain("image2 review");
      expect(stale.primary_action.command).not.toContain("Header-Lock");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fences legacy controller wait state before cursor routing", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-wait-");
    try {
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      state.nodes[state.current_node] = { ...state.nodes[state.current_node], waiting_for: "user:confirm-delivery" };
      writeState(fixture.deck, state);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "guide",
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { owner: "legacy-protocol", action_id: "prepare-legacy-adoption", kind: "continue", requires_human: false },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("fences an exact html-then-image2 source before refinement routing", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-refinement-");
    try {
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      state.production_mode.by_version["3_versions/v1"] = { mode: "html-then-image2" };
      writeState(fixture.deck, state);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { action_id: "prepare-legacy-adoption" },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not project legacy review or refinement observations behind the adoption fence", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-observations-");
    try {
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      state.production_mode.by_version["3_versions/v1"] = { mode: "html-then-image2" };
      state.nodes[state.current_node] = { ...state.nodes[state.current_node], waiting_for: "user:legacy-review" };
      writeState(fixture.deck, state);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "guide",
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { owner: "legacy-protocol", action_id: "prepare-legacy-adoption" },
        observations: [],
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("reports a read-only repair action for invalid durable state", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-invalid-state-");
    try {
      const path = join(fixture.deck, "_state", "state.yaml");
      writeFileSync(path, "][}{\n", "utf8");
      const before = readFileSync(path);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "legacy-protocol", kind: "unsupported-or-corrupt" },
        primary_action: { owner: "legacy-protocol", action_id: "repair-or-export-unsupported-protocol" },
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not let an earlier inspection satisfy a later CAS-bound transition", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-cas-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const expectedStateSha = createHash("sha256").update(readFileSync(statePath)).digest("hex");
      inspectWorkflow({ runDir: fixture.runDir });
      const state = readState(fixture.deck, { purpose: "execute", heal: false });
      writeState(fixture.deck, { ...state, updated_at: "2026-07-23T00:00:00.000Z" });
      const afterConcurrentOwnerWrite = readFileSync(statePath);

      expect(() => transitionProductionMode(fixture.deck, {
        runVersion: "v1",
        toMode: "html-then-image2",
        expectedStateSha,
      })).toThrow(/CONFLICT/);
      expect(readFileSync(statePath)).toEqual(afterConcurrentOwnerWrite);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps a wrong-owner final-review request non-mutating after inspection", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-wrong-owner-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);
      inspectWorkflow({ runDir: fixture.runDir });
      const expectedStateSha = createHash("sha256").update(before).digest("hex");
      expect(() => recordImage2DeliveryReview(fixture.deck, {
        runVersion: "v1",
        decision: "proceed",
        expectedStateSha,
      })).toThrow(/image2-only/);
      expect(readFileSync(statePath)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

});
