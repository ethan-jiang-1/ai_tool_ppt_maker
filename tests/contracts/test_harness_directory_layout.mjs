import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Harness directory layout", () => {
  it("exposes only the v2 workflow owners and shared delivery", () => {
    for (const path of [
      "ppt_maker_harness/scripts/03-framed-image",
      "ppt_maker_harness/scripts/04-pure-image",
      "ppt_maker_harness/scripts/05-delivery",
      "ppt_maker_harness/scripts/06-iteration",
      "ppt_maker_harness/workflow/05-delivery",
      "tests/05-delivery",
    ]) expect(existsSync(path), path).toBe(true);
    for (const path of [
      "ppt_maker_harness/scripts/compatibility",
      "ppt_maker_harness/workflow/compatibility",
      "tests/compatibility",
    ]) expect(existsSync(path), path).toBe(false);
  });

  it("rejects retired numbered v1 and placeholder test owners", () => {
    for (const path of [
      "ppt_maker_harness/scripts/04-image-production",
      "ppt_maker_harness/scripts/05-iteration",
      "ppt_maker_harness/workflow/04-image-production",
      "ppt_maker_harness/workflow/05-iteration",
      "tests/04-image-production",
      "tests/05-iteration",
      "tests_e2e/04-image-production",
      "tests_e2e/05-iteration",
    ]) expect(existsSync(path), path).toBe(false);
  });
});
