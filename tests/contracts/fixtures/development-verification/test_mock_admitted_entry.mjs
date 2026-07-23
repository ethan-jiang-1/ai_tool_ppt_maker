import { expect, it } from "vitest";
import { mockValue } from "./mock_static_dependency.mjs";

it("keeps an explicit mock core seam dependency-free", () => {
  expect(mockValue).toBe("admitted");
});
