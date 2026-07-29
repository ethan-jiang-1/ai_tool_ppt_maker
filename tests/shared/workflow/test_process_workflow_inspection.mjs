import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { initBundle, initLegacyFixtureBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  WORKFLOW_INSPECTION_SCHEMA,
  inspectWorkflow,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";
import { canonicalJson } from "../../../PPTMAKER_FRAMEWORK/scripts/contracts/canonical_json.mjs";

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function createLegacyObservationFixture(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_historical");
  const runDir = join(deck, "3_versions", "v1");
  initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "html-only" });
  return { root, deck, runDir };
}

function createTargetDraftObservationFixture(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_page_authority");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir };
}

describe("workflow inspection", () => {
  it("returns one typed primary action without changing observed files", () => {
    const fixture = createLegacyObservationFixture("workflow-inspect-unit-");
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
    const fixture = createLegacyObservationFixture("workflow-inspect-pure-");
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
    const fixture = createLegacyObservationFixture("workflow-inspect-parity-");
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
    const fixture = createTargetDraftObservationFixture("workflow-inspect-layout-");
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
    const fixture = createLegacyObservationFixture("workflow-inspect-intent-");
    try {
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: "build-now" }))
        .toMatchObject({ posture: "guide", root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" } });
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: {} }))
        .toMatchObject({ posture: "guide", root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" } });
      expect(inspectWorkflow({
        runDir: fixture.runDir,
        requestedIntent: { schema: "pptmaker-workflow-observation-intent-v1", owner: "page-authority", action_id: "build" },
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

  it("requires an explicit target workflow selection for a fresh Page Authority run", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-page-authority-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const result = inspectWorkflow({ runDir });
      expect(result).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
        primary_action: { owner: "01-content", action_id: "select-target-page-authority-workflow", kind: "select", requires_human: true },
        evidence_summary: { pipeline: "page-authority-image2-v2", mode: null, workflow: null },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports a read-only repair action for invalid durable state", () => {
    const fixture = createLegacyObservationFixture("workflow-inspect-invalid-state-");
    try {
      const path = join(fixture.deck, "_state", "state.yaml");
      writeFileSync(path, "][}{\n", "utf8");
      const before = readFileSync(path);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "run-bundle-layout", kind: "layout-invalid" },
        primary_action: { owner: "run-bundle-layout", action_id: "repair-layout" },
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

});
