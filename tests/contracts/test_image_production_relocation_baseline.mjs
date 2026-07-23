import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs";
import { PPT_FLOW_COMMAND_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";

const baseline = JSON.parse(readFileSync("tests/contracts/image-production-relocation-baseline-v1.json", "utf8"));
const SCRIPTS = "PPTMAKER_FRAMEWORK/scripts";

describe("Image Production relocation baseline", () => {
  it("records the pre-move Git baseline and exact direct executable replacements", () => {
    expect(baseline.schema).toBe("pptmaker-image-production-relocation-baseline-v1");
    expect(baseline.pre_move_commit).toMatch(/^[0-9a-f]{40}$/);
    expect(Object.values(baseline.pre_move_objects)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^[0-9a-f]{40}$/),
    ]));
    for (const [retired, replacement] of Object.entries(baseline.direct_executable_replacements)) {
      expect(existsSync(`${SCRIPTS}/${retired}`), retired).toBe(false);
      expect(EXECUTABLE_INVENTORY).toContain(replacement);
      expect(existsSync(`${SCRIPTS}/${replacement}`), replacement).toBe(true);
    }
  });

  it("retains the public command count and workflow-inspection compatibility vocabulary", () => {
    expect(PPT_FLOW_COMMAND_INVENTORY).toHaveLength(baseline.public_compatibility.ppt_flow_top_level_commands);
    const source = readFileSync(`${SCRIPTS}/shared/workflow/inspect_workflow.mjs`, "utf8");
    expect(source).toContain(baseline.public_compatibility.workflow_inspection_owner);
    for (const action of baseline.public_compatibility.workflow_inspection_actions) expect(source).toContain(action);
  });
});
