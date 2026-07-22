import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createHtmlFirstRun } from "../../../tests/helpers/html_first_fixture.mjs";
import { canonicalJson } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

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
  it("keeps status/state parity and records the BUG-033 earliest owner diagnostic without writes", () => {
    const fixture = createHtmlFirstRun("workflow-inspection-e2e-");
    try {
      const before = treeSnapshot(fixture.deck);
      const status = flow(["status", fixture.runDir, "--json"]);
      const state = flow(["state", fixture.runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      const statusInspection = JSON.parse(status.stdout).workflow_inspection;
      const stateInspection = JSON.parse(state.stdout).workflow_inspection;
      expect(canonicalJson(statusInspection)).toBe(canonicalJson(stateInspection));
      expect(statusInspection).toMatchObject({
        root_cause: { owner: "html-review", kind: "content-review-missing" },
        primary_action: { action_id: "review-content" },
      });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
