// Tests: openspec/specs/node-specification/spec.md
// Tests: openspec/specs/playbook-execution/spec.md
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { inspectWorkflow } from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import { createInitialState, readState, statePath, validateStateReadOnly, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

function currentFixture() {
  const root = mkdtempSync(join(tmpdir(), "page-image-state-"));
  const deck = join(root, "deck_current");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir: join(deck, "3_versions", "v1") };
}

function declaredCurrentFixture() {
  const fixture = currentFixture();
  writeFileSync(join(fixture.runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: page-image-workflow\n  workflow: pure\n---\n");
  writeState(fixture.deck, createInitialState("current", "keynote", "dark-executive", {
    workflow: "pure",
  }));
  return fixture;
}

describe("Page Image state boundary", () => {
  it("reads a current state without observation mutation", () => {
    const fixture = currentFixture();
    try {
      const path = statePath(fixture.deck);
      const before = readFileSync(path);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state).not.toHaveProperty("schema_version");
      expect(state.production_identity.by_version["3_versions/v1"]).toBeUndefined();
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects an unknown state container instead of projecting it", () => {
    const fixture = currentFixture();
    try {
      const path = statePath(fixture.deck);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      state.unsupported_state_container = { by_version: {} };
      writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
      const before = readFileSync(path);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })).toMatchObject({ replacement_required: true });
      expect(validateStateReadOnly(fixture.deck, { runDir: fixture.runDir }).valid).toBe(false);
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects a numeric state schema marker without rewriting the bytes", () => {
    const fixture = currentFixture();
    try {
      const path = statePath(fixture.deck);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      state.schema_version = 5;
      writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
      const before = readFileSync(path);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })).toMatchObject({ replacement_required: true });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not heal malformed bytes during observation", () => {
    const fixture = currentFixture();
    try {
      const path = statePath(fixture.deck);
      writeFileSync(path, "][}{\n");
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })).toMatchObject({ replacement_required: true });
      expect(readFileSync(path, "utf8")).toBe("][}{\n");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("preserves a declared-current one-to-one state repair as a state-owner action", () => {
    const fixture = declaredCurrentFixture();
    try {
      const path = statePath(fixture.deck);
      const state = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete state.durable_state_present;
      state.gates.content = "malformed";
      writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
      const before = readFileSync(path);

      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })).toMatchObject({
        replacement_required: true,
        current_repair_required: true,
      });
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        root_cause: { owner: "state", kind: "current-state-repair-required" },
        primary_action: { owner: "state", action_id: "validate-state", kind: "repair" },
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
