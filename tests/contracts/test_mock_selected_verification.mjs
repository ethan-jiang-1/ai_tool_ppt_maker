import { describe, expect, it } from "vitest";
import { runSelectedVerification, validateSelectedInvocation } from "./run_selected_verification.mjs";

describe("mock selected verifier dispatcher", () => {
  it("requires one tier-compatible path and does not expand it", () => {
    expect(validateSelectedInvocation(["focused"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["focused", "tests/contracts/test_framework_architecture.mjs", "--grep", "x"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["focused", "tests_e2e/shared/workflow/test_mock_selected_journey.mjs"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["journey", "tests_e2e/shared/workflow/test_mock_selected_journey.mjs"])).toMatchObject({ ok: true, config: "vitest.e2e.config.mjs" });
    expect(validateSelectedInvocation(["render", "tests/contracts/test_framework_architecture.mjs"])).toMatchObject({ ok: false });
  });

  it("passes exactly one selected path to its owning Vitest configuration", () => {
    let received;
    const exitCode = runSelectedVerification(["focused", "tests/contracts/test_framework_architecture.mjs"], {
      spawnChild: (...args) => { received = args; return { status: 0 }; },
    });
    expect(exitCode).toBe(0);
    expect(received[1]).toEqual(expect.arrayContaining(["run", "--config", "vitest.config.mjs", "tests/contracts/test_framework_architecture.mjs"]));
    expect(received[1]).toHaveLength(5);
  });
});
