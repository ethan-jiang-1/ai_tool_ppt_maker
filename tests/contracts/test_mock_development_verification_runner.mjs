// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/harness-charter/spec.md
// Tests: openspec/specs/harness-script-layout/spec.md
// Tests: openspec/specs/production-schema-conformance/spec.md
// Tests: openspec/specs/harness-directory-layout/spec.md
import { EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDevelopmentVerification } from "./run_development_verification.mjs";

function mockChild({ code = 0, output = "", close = true } = {}) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => { child.emit("close", null, "SIGTERM"); return true; };
  if (close) process.nextTick(() => { child.stdout.emit("data", output); child.emit("close", code, null); });
  return child;
}

describe("mock development verifier runner", () => {
  it("owns one exact final summary without raw child progress", async () => {
    const result = await runDevelopmentVerification({ resolveVitest: () => "/mock/vitest.mjs", spawnChild: () => mockChild({ output: "dot progress" }) });
    expect(result.exitCode).toBe(0);
    expect(Object.keys(result.output)).toEqual(["schema", "tier", "result", "duration_ms", "next_action"]);
    expect(result.output).toMatchObject({ schema: "development-verification", tier: "core", result: "passed" });
  });

  it("maps a failed child, unavailable runner, bounded tail, and timeout to one nonzero result", async () => {
    const failed = await runDevelopmentVerification({ resolveVitest: () => "/mock/vitest.mjs", spawnChild: () => mockChild({ code: 1, output: "x".repeat(20_000) }) });
    expect(failed.output.result).toBe("failed");
    expect(Buffer.byteLength(JSON.stringify(failed.output.failure_tail), "utf8")).toBeLessThanOrEqual(8192);
    const unavailable = await runDevelopmentVerification({ resolveVitest: () => { throw new Error("missing mock Vitest"); } });
    expect(unavailable.output.result).toBe("unavailable");
    const timedOut = await runDevelopmentVerification({ resolveVitest: () => "/mock/vitest.mjs", spawnChild: () => mockChild({ close: false }), executionMs: 5, shutdownMs: 5 });
    expect(timedOut.output.result).toBe("timed_out");
    expect(timedOut.exitCode).toBe(1);
  });

  it("short-circuits malformed and prohibited mock inventories before Vitest resolution or child startup", async () => {
    const root = mkdtempSync(join(tmpdir(), "pptmaker-mock-verifier-"));
    try {
      const contracts = join(root, "tests/contracts");
      mkdirSync(contracts, { recursive: true });
      const inventory = join(contracts, "development-verification-core.json");
      writeFileSync(inventory, "{");
      let resolved = false;
      let spawned = false;
      const malformed = await runDevelopmentVerification({ root, resolveVitest: () => { resolved = true; return "/mock/vitest.mjs"; }, spawnChild: () => { spawned = true; return mockChild(); } });
      expect(malformed.output.result).toBe("invalid_inventory");
      expect(resolved).toBe(false);
      expect(spawned).toBe(false);

      writeFileSync(join(contracts, "test_mock_prohibited_entry.mjs"), 'import "playwright";\n');
      writeFileSync(inventory, JSON.stringify({ schema: "pptmaker-development-verification-core", budget_ms: 60000, entries: ["tests/contracts/test_mock_prohibited_entry.mjs"] }));
      const prohibited = await runDevelopmentVerification({ root, resolveVitest: () => { resolved = true; return "/mock/vitest.mjs"; }, spawnChild: () => { spawned = true; return mockChild(); } });
      expect(prohibited.output.result).toBe("invalid_inventory");
      expect(spawned).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
