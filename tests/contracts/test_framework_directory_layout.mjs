import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const baseline = JSON.parse(readFileSync("tests/contracts/image-production-ownership-baseline-v2.json", "utf8"));

describe("framework directory layout", () => {
  it("keeps CURRENT v1 in one explicit compatibility home", () => {
    expect(baseline).toMatchObject({
      schema: "pptmaker-page-authority-compatibility-ownership-baseline-v1",
      owner: "compatibility/current-v1-page-authority",
      page_authority_adapter: "compatibility/current-v1-page-authority/index.mjs",
      target_graph: "03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration",
      shared_delivery_interface: "05-delivery/index.mjs",
    });
    for (const path of [
      "PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/index.mjs",
      "PPTMAKER_FRAMEWORK/workflow/compatibility/current-v1-page-authority/change-classifier.md",
      "tests/compatibility/current-v1-page-authority/test_page_authority_raw_manifest.mjs",
      "PPTMAKER_FRAMEWORK/workflow/05-delivery",
      "tests/05-delivery",
    ]) expect(existsSync(path), path).toBe(true);
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
