import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState, statePath, validateStateReadOnly } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

function currentFixture() {
  const root = mkdtempSync(join(tmpdir(), "page-authority-state-"));
  const deck = join(root, "deck_current");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir: join(deck, "3_versions", "v1") };
}

describe("Page Authority state boundary", () => {
  it("reads a current state without observation mutation", () => {
    const fixture = currentFixture();
    try {
      const path = statePath(fixture.deck);
      const before = readFileSync(path);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.schema_version).toBe(5);
      expect(state.production_mode.by_version["3_versions/v1"]).toBeUndefined();
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
});
