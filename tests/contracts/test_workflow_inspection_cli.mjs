import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
      expect(stateReport.suggested_next).toBe(stateReport.workflow_inspection.primary_action.display_label);
      expect(statusReport.suggested_next).toBe(statusReport.workflow_inspection.primary_action.display_label);
      expect(stateReport).not.toHaveProperty("html_resume_guidance");
      expect(statusReport).not.toHaveProperty("html_resume_guidance");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps an unusable observation behind one stderr failure envelope", () => {
    const fixture = createHtmlFirstRun("workflow-inspection-cli-invalid-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      writeFileSync(statePath, "][}{\n", "utf8");
      const before = readFileSync(statePath);
      const result = flow(["state", fixture.runDir, "--json"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr.trim().split("\n")).toHaveLength(1);
      expect(JSON.parse(result.stderr)).toMatchObject({ ok: false, code: expect.any(String) });
      expect(readFileSync(statePath)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("creates a new inspection projection when the source checkpoint changes", () => {
    const fixture = createHtmlFirstRun("workflow-inspection-cli-checkpoint-");
    try {
      const first = flow(["status", fixture.runDir, "--json"]);
      expect(first.status, first.stderr).toBe(0);
      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}\n`);
      const second = flow(["state", fixture.runDir, "--json"]);
      expect(second.status, second.stderr).toBe(0);
      const firstInspection = JSON.parse(first.stdout).workflow_inspection;
      const secondInspection = JSON.parse(second.stdout).workflow_inspection;
      expect(firstInspection.checkpoint.source_sha256).not.toBe(secondInspection.checkpoint.source_sha256);
      expect(canonicalJson(firstInspection)).not.toBe(canonicalJson(secondInspection));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
