import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ledger = JSON.parse(readFileSync("tests/contracts/workflow-control-ledger-v2.json", "utf8"));
const goals = JSON.parse(readFileSync("tests/contracts/workflow-control-goal-entry-v2.json", "utf8"));

describe("workflow control ledger", () => {
  it("has complete, bounded retirement evidence", () => {
    expect(ledger.schema).toBe("pptmaker-workflow-control-ledger-v2");
    const ids = new Set();
    for (const entry of ledger.entries) {
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(["durable", "derived"]).toContain(entry.surface);
      expect(entry.direct_owner).toEqual(expect.any(String));
      expect(entry.writer).toEqual(expect.any(Array));
      expect(entry.readers).toEqual(expect.any(Array));
      expect(entry.invalidation).toEqual(expect.any(String));
      expect(entry.reconstructibility).toMatch(/^(yes|no)$/);
      expect(["retain-direct", "retain-diagnostic", "retain-display", "retire-reader", "compatibility"]).toContain(entry.decision);
      expect(entry.replacement_tests.length).toBeGreaterThan(0);
      if (entry.decision === "compatibility") {
        expect(entry.retirement_owner).toEqual(expect.any(String));
        expect(entry.removal_trigger).toEqual(expect.any(String));
        expect(entry.retire_by).toMatch(/^(change:[a-z0-9-]+|release:\d+\.\d+\.\d+)$/);
      }
    }
  });

  it("declares one direct entry for every supported goal", () => {
    expect(goals.schema).toBe("pptmaker-workflow-goal-entry-v2");
    expect(goals.entries.map((entry) => entry.goal).sort()).toEqual([
      "exact-run-resume", "greenfield-init", "html-then-image2-refinement", "image2-only-production",
      "local-refresh", "recovery", "structural-versioning",
    ]);
    expect(goals.entries.filter((entry) => entry.inspection)).toEqual([
      expect.objectContaining({ goal: "exact-run-resume", entry: "workflow_inspection" }),
    ]);
  });
});
