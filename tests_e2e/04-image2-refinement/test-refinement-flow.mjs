import { describe, expect, it } from "vitest";
import { buildPlan } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";

describe("Phase 4 refinement boundary", () => {
  it("plans only bounded visual-slot scopes", () => {
    expect(() => buildPlan({ slides: [] })).toThrow();
  });
});
