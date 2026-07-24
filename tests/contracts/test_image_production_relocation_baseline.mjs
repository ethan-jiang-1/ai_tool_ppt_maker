import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs";
import { PPT_FLOW_COMMAND_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";

const baseline = JSON.parse(readFileSync("tests/contracts/image-production-ownership-baseline-v2.json", "utf8"));
const SCRIPTS = "PPTMAKER_FRAMEWORK/scripts";

describe("Image Production ownership baseline", () => {
  it("assigns whole-page interfaces and executables to Image Production", () => {
    expect(baseline.schema).toBe("pptmaker-image-production-ownership-baseline-v2");
    expect(baseline.owner).toBe("04-image-production");
    expect(existsSync(`${SCRIPTS}/${baseline.whole_page_adapter}`)).toBe(true);
    for (const executable of baseline.direct_executables) {
      expect(EXECUTABLE_INVENTORY).toContain(executable);
      expect(existsSync(`${SCRIPTS}/${executable}`), executable).toBe(true);
    }
  });

  it("keeps Phase 5 free of whole-page adapter exports", () => {
    const phase5 = readFileSync(`${SCRIPTS}/${baseline.phase5_interface}`, "utf8");
    expect(phase5).not.toMatch(/wholePage|WholePage|whole-page/);
    expect(PPT_FLOW_COMMAND_INVENTORY).toHaveLength(14);
  });
});
