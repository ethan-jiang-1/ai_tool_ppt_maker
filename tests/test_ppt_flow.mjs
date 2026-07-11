import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initBundle } from "../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs";
import { readState } from "../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs";

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

  it("registers exactly 12 top-level commands", () => {
    const matches = PPT_FLOW_SRC.match(/\.command\("/g) || [];
    expect(matches.length).toBe(12);
  });

  it("state --json includes resume card fields", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-resume-"));
    const deck = join(root, "deck_resume");
    const runDir = join(deck, "3_versions", "v1");
    mkdirSync(join(deck, "_state"), { recursive: true });
    mkdirSync(runDir, { recursive: true });
    writeFileSync(
      join(deck, "_state", "state.yaml"),
      `playbook: iterate-style
current_node: review-gate
nodes:
  review-gate:
    status: in_progress
    waiting_for: user:review-style-master
gates:
  content: pending
  visual: pending
deck:
  name: resume
  type: keynote
  style: dark
playbook_stack: []
`,
      "utf-8"
    );
    const r = runPptFlow(["state", runDir, "--json"]);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.playbook).toBe("iterate-style");
    expect(j.current_node).toBe("review-gate");
    expect(j.workflow_summary).toMatch(/等人|waiting|review/i);
    expect(j.suggested_next).toContain("user:review-style-master");
  });

  it("approve dual-writes metadata and _state gates", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-approve-")), "deck_approve");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const r = runPptFlow(["approve", runDir, "visual"]);
      expect(r.status).toBe(0);
      const meta = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta).toMatch(/visual_gate:\s*approved/);
      const s = readState(deck);
      expect(s.gates.visual).toBe("approved");
      const r2 = runPptFlow(["approve", runDir, "content", "--waive"]);
      expect(r2.status).toBe(0);
      const meta2 = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta2).toMatch(/content_gate:\s*waived/);
      const s2 = readState(deck);
      expect(s2.gates.content).toBe("waived");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("status --json includes playbook breakpoint", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-status-")), "deck_status");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(
        join(deck, "_state", "state.yaml"),
        `playbook: create-deck
current_node: hitl1
nodes:
  hitl1:
    status: in_progress
gates:
  content: pending
  visual: pending
deck:
  name: status
  type: keynote
  style: dark
playbook_stack: []
`,
        "utf-8"
      );
      const r = runPptFlow(["status", runDir, "--json"]);
      expect(r.status).toBe(0);
      const j = JSON.parse(r.stdout);
      expect(j.playbook).toBe("create-deck");
      expect(j.current_node).toBe("hitl1");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});
