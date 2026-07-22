import { describe, expect, it } from "vitest";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { createHtmlFirstRun } from "../../helpers/html_first_fixture.mjs";
import {
  WORKFLOW_INSPECTION_SCHEMA,
  canonicalJson,
  inspectWorkflow,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

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
});
