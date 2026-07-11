import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const PPT_FLOW_SRC = readFileSync(PPT_FLOW, "utf-8");

function lastNonEmptyLine(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "");
  return lines.length ? lines[lines.length - 1] : "";
}

function runPptFlow(args, opts = {}) {
  return spawnSync("node", [PPT_FLOW, ...args], {
    encoding: "utf-8",
    timeout: opts.timeout ?? 15000,
    env: process.env,
  });
}

function parseFailureEnvelope(stderr) {
  const line = lastNonEmptyLine(stderr);
  const env = JSON.parse(line);
  expect(env.ok).toBe(false);
  return env;
}

describe("ppt_flow", () => {
  it("responds to --help and lists state", () => {
    const r = runPptFlow(["--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/\bstate\b/);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(() => JSON.parse(tail)).not.toThrow();
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("state --help exits 0 without failure envelope", () => {
    const r = runPptFlow(["state", "--help"]);
    expect(r.status).toBe(0);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("doctor starts without freeze TypeError; non-zero yields FAILED envelope", () => {
    const r = runPptFlow(["doctor"], { timeout: 20000 });
    const combined = (r.stderr || "") + (r.stdout || "");
    expect(combined).not.toMatch(/Cannot assign to read only property/);
    expect(combined).not.toMatch(/program is not defined/);
    if (r.status !== 0) {
      const env = parseFailureEnvelope(r.stderr);
      expect(env.code).toBe("FAILED");
      expect(env.where).toBe("ppt_flow.doctor");
    }
  });

  it("unknown command → USAGE envelope", () => {
    const r = runPptFlow(["nosuch"]);
    expect(r.status).not.toBe(0);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
  });

  it("init unknown style → USAGE with preset hint (exactly one envelope)", () => {
    const r = runPptFlow([
      "init",
      "/tmp/deck_cli_envelope_test",
      "--deck-type",
      "keynote",
      "--style",
      "not-a-preset",
    ]);
    expect(r.status).not.toBe(0);
    const matches = (r.stderr.match(/\{[^\n]*"ok"\s*:\s*false/g) || []).length;
    expect(matches).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
    expect(env.hint).toMatch(/clean-clinical|dark-executive|tech-startup/);
    expect(env.where).toMatch(/init\.style/);
  });

  it("state --check-gates on minimal fixture → GATE_BLOCKED", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-gate-"));
    const runDir = join(root, "deck_x", "_runs", "r1");
    mkdirSync(runDir, { recursive: true });
    const r = runPptFlow(["state", runDir, "--check-gates"]);
    expect(r.status).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("GATE_BLOCKED");
    expect(env.hint).toMatch(/content|visual/);
  });

  it("does not mutate STYLE_PRESETS in place", () => {
    expect(PPT_FLOW_SRC).not.toMatch(
      /STYLE_PRESETS\.(sort|reverse|splice)\(/
    );
  });
});
