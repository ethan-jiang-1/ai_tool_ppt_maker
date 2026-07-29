import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("framework directory layout", () => {
  it("exposes only the v2 workflow owners and shared delivery", () => {
    for (const path of [
      "PPTMAKER_FRAMEWORK/scripts/03-framed-image",
      "PPTMAKER_FRAMEWORK/scripts/04-pure-image",
      "PPTMAKER_FRAMEWORK/scripts/05-delivery",
      "PPTMAKER_FRAMEWORK/scripts/06-iteration",
      "PPTMAKER_FRAMEWORK/workflow/05-delivery",
      "tests/05-delivery",
    ]) expect(existsSync(path), path).toBe(true);
    for (const path of [
      "PPTMAKER_FRAMEWORK/scripts/compatibility",
      "PPTMAKER_FRAMEWORK/workflow/compatibility",
      "tests/compatibility",
    ]) expect(existsSync(path), path).toBe(false);
  });

  it("rejects retired numbered v1 and placeholder test owners", () => {
    for (const path of [
      "PPTMAKER_FRAMEWORK/scripts/04-image-production",
      "PPTMAKER_FRAMEWORK/scripts/05-iteration",
      "PPTMAKER_FRAMEWORK/workflow/04-image-production",
      "PPTMAKER_FRAMEWORK/workflow/05-iteration",
      "tests/04-image-production",
      "tests/05-iteration",
      "tests_e2e/04-image-production",
      "tests_e2e/05-iteration",
    ]) expect(existsSync(path), path).toBe(false);
  });
});
