import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

describe("workflow inspection observation flow", () => {
  it("keeps a fresh target workflow-selection gate observable without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-e2e-"));
    const deck = join(root, "deck_target_inspection");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const status = flow(["status", runDir, "--json"]);
      const state = flow(["state", runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: "page-authority-image2-v2",
        structure_issues: [],
        current_node: "select-target-page-authority-workflow",
      });
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
        primary_action: { action_id: "select-target-page-authority-workflow", requires_human: true },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
