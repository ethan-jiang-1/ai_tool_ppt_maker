import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCliErrorLine } from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

const LAB_CLI = "ppt_maker_harness/scripts/shared/image2/lab_cli.mjs";

function runLab(args, env = {}) {
  return spawnSync(process.execPath, [LAB_CLI, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, ...env },
  });
}

function envelope(result) {
  return parseCliErrorLine(String(result.stderr || "").trim().split(/\r?\n/).filter(Boolean).at(-1));
}

function candidateYaml({ protocol = "json-inline-b64" } = {}) {
  return [
    "schema: pptmaker-image2-call-shape",
    "model: lab-test-model",
    "prompt_budget:",
    "  limit: 128",
    "  unit: utf8-bytes",
    `result_protocol: ${protocol}`,
    "",
  ].join("\n");
}

describe("Image2 Lab CLI", () => {
  it("hard-stops a non-vN run before fetch", () => {
    const result = runLab(["plan", "--run-dir", tmpdir(), "--candidate", "missing.yaml", "--prompt-file", "missing.txt"], {
      IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
      IMAGE2_BASE_URL: "https://lab.example/v1",
    });
    expect(result.status).not.toBe(0);
    expect(envelope(result)?.diagnostic?.reason?.kind).toBe("run_dir_invalid");
    expect(`${result.stdout}${result.stderr}`).not.toContain("LAB_SECRET_SENTINEL");
  });

  it("prints plan_hash without fetching", () => {
    const root = mkdtempSync(join(tmpdir(), "lab-cli-plan-"));
    try {
      const deck = join(root, "deck_lab");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const candidate = join(deck, "_lab", "fixtures", "candidate.yaml");
      const prompt = join(deck, "_lab", "fixtures", "prompt.txt");
      writeFileSync(candidate, candidateYaml());
      writeFileSync(prompt, "lab connectivity square\n");
      const result = runLab(["plan", "--run-dir", runDir, "--candidate", candidate, "--prompt-file", prompt], {
        IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
        IMAGE2_BASE_URL: "https://lab.example/v1",
      });
      expect(result.status, result.stderr).toBe(0);
      const receipt = JSON.parse(result.stdout);
      expect(receipt).toMatchObject({ ok: true, submit_count: 1 });
      expect(receipt.plan_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(`${result.stdout}${result.stderr}`).not.toContain("LAB_SECRET_SENTINEL");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("heals a missing Lab scaffold before writing a plan", () => {
    const root = mkdtempSync(join(tmpdir(), "lab-cli-heal-"));
    try {
      const deck = join(root, "deck_lab");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const candidate = join(runDir, "_scratch", "candidate.yaml");
      const prompt = join(runDir, "_scratch", "prompt.txt");
      writeFileSync(candidate, candidateYaml());
      writeFileSync(prompt, "lab connectivity square\n");
      rmSync(join(deck, "_lab"), { recursive: true, force: true });

      const result = runLab(["plan", "--run-dir", runDir, "--candidate", candidate, "--prompt-file", prompt], {
        IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
        IMAGE2_BASE_URL: "https://lab.example/v1",
      });

      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(join(deck, "_lab", "README.md"))).toBe(true);
      expect(existsSync(join(deck, "_lab", ".gitignore"))).toBe(true);
      expect(existsSync(join(deck, "_lab", "fixtures"))).toBe(true);
      expect(existsSync(join(deck, "_lab", "runs", "v1", "plans"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a symlink Lab workspace before scaffold writes", () => {
    const root = mkdtempSync(join(tmpdir(), "lab-cli-workspace-symlink-"));
    try {
      const deck = join(root, "deck_lab");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const candidate = join(runDir, "_scratch", "candidate.yaml");
      const prompt = join(runDir, "_scratch", "prompt.txt");
      const outside = join(root, "outside-lab");
      writeFileSync(candidate, candidateYaml());
      writeFileSync(prompt, "lab connectivity square\n");
      rmSync(join(deck, "_lab"), { recursive: true, force: true });
      mkdirSync(outside);
      writeFileSync(join(outside, "sentinel.txt"), "keep\n");
      symlinkSync(outside, join(deck, "_lab"));
      const before = readdirSync(outside).sort();

      const result = runLab(["plan", "--run-dir", runDir, "--candidate", candidate, "--prompt-file", prompt], {
        IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
        IMAGE2_BASE_URL: "https://lab.example/v1",
      });

      expect(result.status).not.toBe(0);
      expect(envelope(result)?.diagnostic?.reason?.kind).toMatch(/harness_binding_invalid|lab_path_unsafe/);
      expect(readdirSync(outside).sort()).toEqual(before);
      expect(existsSync(join(outside, "README.md"))).toBe(false);
      expect(existsSync(join(outside, "fixtures"))).toBe(false);
      expect(existsSync(join(outside, "runs"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an unregistered dialect before fetch", () => {
    const root = mkdtempSync(join(tmpdir(), "lab-cli-dialect-"));
    try {
      const deck = join(root, "deck_lab");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const candidate = join(deck, "_lab", "fixtures", "bad.yaml");
      const prompt = join(deck, "_lab", "fixtures", "prompt.txt");
      writeFileSync(candidate, candidateYaml({ protocol: "raw-png" }));
      writeFileSync(prompt, "lab connectivity square\n");
      const result = runLab(["plan", "--run-dir", runDir, "--candidate", candidate, "--prompt-file", prompt], {
        IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
      });
      expect(result.status).not.toBe(0);
      expect(envelope(result)?.diagnostic?.reason?.kind).toMatch(/result_protocol|call_shape/);
      expect(`${result.stdout}${result.stderr}`).not.toContain("LAB_SECRET_SENTINEL");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a symlink candidate before fetch", () => {
    const root = mkdtempSync(join(tmpdir(), "lab-cli-symlink-"));
    try {
      const deck = join(root, "deck_lab");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const real = join(deck, "_lab", "fixtures", "real.yaml");
      const linked = join(deck, "_lab", "fixtures", "linked.yaml");
      const prompt = join(deck, "_lab", "fixtures", "prompt.txt");
      writeFileSync(real, candidateYaml());
      writeFileSync(prompt, "lab connectivity square\n");
      symlinkSync(real, linked);
      const result = runLab(["plan", "--run-dir", runDir, "--candidate", linked, "--prompt-file", prompt], {
        IMAGE2_API_KEY: "LAB_SECRET_SENTINEL",
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).not.toContain("LAB_SECRET_SENTINEL");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
