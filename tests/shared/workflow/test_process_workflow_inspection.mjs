import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  WORKFLOW_INSPECTION_SCHEMA,
  inspectWorkflow,
  isWorkflowInspectionSourceReady,
} from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import { canonicalJson } from "../../../ppt_maker_harness/scripts/contracts/canonical_json.mjs";

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function unsupportedFixture(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_unsupported");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: current-protocol-invalid\n---\n");
  return { root, deck, runDir };
}

describe("workflow inspection protocol fence", () => {
  it("returns one stable repair hard-stop for an unsupported source", () => {
    const fixture = unsupportedFixture("workflow-inspect-unit-");
    try {
      const first = inspectWorkflow({ runDir: fixture.runDir });
      const second = inspectWorkflow({ runDir: fixture.runDir });
      expect(first).toMatchObject({
        schema: WORKFLOW_INSPECTION_SCHEMA,
        posture: "hard-stop",
        root_cause: { owner: "production-protocol", kind: "current-protocol-invalid" },
        primary_action: { action_id: "repair-current-protocol-identity", kind: "repair" },
        observations: [],
      });
      expect(canonicalJson(first)).toBe(canonicalJson(second));
      expect(isWorkflowInspectionSourceReady(first)).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not mutate the bundle or call a provider while observing unsupported input", () => {
    const fixture = unsupportedFixture("workflow-inspect-nowrite-");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const before = treeSnapshot(fixture.deck);
      inspectWorkflow({ runDir: fixture.runDir });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
