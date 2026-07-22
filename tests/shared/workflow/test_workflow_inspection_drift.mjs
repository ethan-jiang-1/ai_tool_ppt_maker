import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ layoutReads: 0, afterSecondLayoutRead: null }));

vi.mock("../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    checkBundle(...args) {
      const value = actual.checkBundle(...args);
      hooks.layoutReads += 1;
      if (hooks.layoutReads === 2) hooks.afterSecondLayoutRead?.();
      return value;
    },
  };
});

const { createHtmlFirstRun } = await import("../../helpers/html_first_fixture.mjs");
const { inspectWorkflow } = await import("../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs");

describe("workflow inspection checkpoint drift", () => {
  it("returns one refresh action when a direct fact changes during composition", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-drift-");
    try {
      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      hooks.layoutReads = 0;
      hooks.afterSecondLayoutRead = () => writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}\n`);
      const result = inspectWorkflow({ runDir: fixture.runDir });
      expect(result).toMatchObject({
        posture: "guide",
        root_cause: { owner: "workflow-inspection", kind: "checkpoint-changed", detail: "source_sha256" },
        primary_action: { owner: "workflow-inspection", action_id: "refresh-workflow-inspection", kind: "continue", requires_human: false },
      });
      expect(hooks.layoutReads).toBe(2);
    } finally {
      hooks.afterSecondLayoutRead = null;
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
