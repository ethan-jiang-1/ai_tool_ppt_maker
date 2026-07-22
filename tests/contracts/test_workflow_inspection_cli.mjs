import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { rmSync } from "node:fs";

import { createHtmlFirstRun } from "../helpers/html_first_fixture.mjs";
import { canonicalJson } from "../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

describe("workflow inspection CLI projection", () => {
  it("shares canonical inspection and keeps raw state only under durable_state", () => {
    const fixture = createHtmlFirstRun("workflow-inspection-cli-");
    try {
      const state = flow(["state", fixture.runDir, "--json"]);
      const status = flow(["status", fixture.runDir, "--json"]);
      expect(state.status, state.stderr).toBe(0);
      expect(status.status, status.stderr).toBe(0);
      const stateReport = JSON.parse(state.stdout);
      const statusReport = JSON.parse(status.stdout);

      expect(canonicalJson(stateReport.workflow_inspection)).toBe(canonicalJson(statusReport.workflow_inspection));
      expect(stateReport.durable_state).toMatchObject({ schema_version: 5, production_mode: { by_version: {} } });
      expect(stateReport).not.toHaveProperty("schema_version");
      expect(stateReport).not.toHaveProperty("nodes");
      expect(stateReport.workflow_summary).toBe(stateReport.workflow_inspection.primary_action.display_label);
      expect(statusReport.workflow_summary).toBe(statusReport.workflow_inspection.primary_action.display_label);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
