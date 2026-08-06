import { describe, expect, it } from "vitest";
import { normalizeExecutablePath } from "../../../ppt_maker_harness/scripts/contracts/executable_inventory.mjs";

describe("mock selected public journey", () => {
  it("keeps a selected public command route dependency-free", () => {
    expect(normalizeExecutablePath("./ppt_flow.mjs")).toBe("ppt_flow.mjs");
  });
});
