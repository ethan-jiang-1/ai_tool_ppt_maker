// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/harness-charter/spec.md
// Tests: openspec/specs/harness-script-layout/spec.md
// Tests: openspec/specs/production-schema-conformance/spec.md
// Tests: openspec/specs/harness-directory-layout/spec.md
import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realE2EEnabled, runSelectedVerification, validateSelectedInvocation } from "./run_selected_verification.mjs";

const REAL_PROVIDER_ENTRY = "tests_e2e/shared/real-provider/test_real_provider_e2e_acceptance.mjs";

describe("mock selected verifier dispatcher", () => {
  it("requires one tier-compatible path and does not expand it", () => {
    expect(validateSelectedInvocation(["focused"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["focused", "tests/contracts/test_harness_architecture.mjs", "--grep", "x"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["focused", "tests_e2e/shared/workflow/test_mock_selected_journey.mjs"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["journey", "tests_e2e/shared/workflow/test_mock_selected_journey.mjs"])).toMatchObject({ ok: true, config: "vitest.e2e.config.mjs" });
    expect(validateSelectedInvocation(["real-e2e", "tests_e2e/shared/workflow/test_mock_selected_journey.mjs"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["render", "tests/contracts/test_harness_architecture.mjs"])).toMatchObject({ ok: false });
    expect(validateSelectedInvocation(["focused", "tests/contracts/not-an-admitted-test.mjs"])).toMatchObject({ ok: false });
  });

  it("makes real E2E an explicit human-controlled invocation", () => {
    expect(realE2EEnabled({})).toBe(false);
    expect(realE2EEnabled({ PPTMAKER_RUN_REAL_E2E: "0" })).toBe(false);
    expect(realE2EEnabled({ PPTMAKER_RUN_REAL_E2E: "1" })).toBe(true);
  });

  it("requires the real E2E opt-in after accepting only an explicitly real test name", () => {
    const root = mkdtempSync(join(tmpdir(), "real-e2e-dispatch-"));
    const entry = "tests_e2e/synthetic/test_real_external.mjs";
    try {
      mkdirSync(join(root, "tests_e2e", "synthetic"), { recursive: true });
      writeFileSync(join(root, entry), "import { it } from 'vitest'; it('synthetic', () => {});\n");
      expect(validateSelectedInvocation(["real-e2e", entry], root, {})).toMatchObject({ ok: false, detail: "real E2E requires PPTMAKER_RUN_REAL_E2E=1" });
      expect(validateSelectedInvocation(["real-e2e", entry], root, { PPTMAKER_RUN_REAL_E2E: "1" })).toMatchObject({ ok: true, config: "vitest.real-e2e.config.mjs" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the checked-in real acceptance entry behind the exact selected tier", () => {
    expect(validateSelectedInvocation(["real-e2e", REAL_PROVIDER_ENTRY], process.cwd(), {}))
      .toMatchObject({ ok: false, detail: "real E2E requires PPTMAKER_RUN_REAL_E2E=1" });
    expect(validateSelectedInvocation(["real-e2e", REAL_PROVIDER_ENTRY], process.cwd(), { PPTMAKER_RUN_REAL_E2E: "1" }))
      .toMatchObject({ ok: true, config: "vitest.real-e2e.config.mjs", entry: REAL_PROVIDER_ENTRY });
  });

  it("passes exactly one selected path to its owning Vitest configuration", () => {
    let received;
    const exitCode = runSelectedVerification(["focused", "tests/contracts/test_harness_architecture.mjs"], {
      spawnChild: (...args) => { received = args; return { status: 0 }; },
    });
    expect(exitCode).toBe(0);
    expect(received[1]).toEqual(expect.arrayContaining(["run", "--config", "vitest.config.mjs", "tests/contracts/test_harness_architecture.mjs"]));
    expect(received[1]).toHaveLength(5);
  });
});
