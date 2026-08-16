import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { runAllChecks } from "../../ppt_maker_harness/scripts/00-setup/internal/env_check.mjs";
import {
  PPT_FLOW_COMMAND_INVENTORY,
  parseCliErrorLine,
} from "../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import {
  COMMAND_CONTRACTS,
  validateCommandContracts,
} from "../../ppt_maker_harness/scripts/shared/cli/command_result.mjs";

const ENV_CHECK = "ppt_maker_harness/scripts/00-setup/env-check.mjs";
const PPT_FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const BUNDLE_LAYOUT = "ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
const ROOT_README = readFileSync("README.md", "utf8");
const BOOTSTRAP = readFileSync("ppt_maker_harness/BOOTSTRAP.md", "utf8");
const COMMANDS = readFileSync("ppt_maker_harness/COMMANDS.md", "utf8");
const OPEN_SPEC_CONFIG = readFileSync("openspec/config.yaml", "utf8");

function run(script, args = []) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

describe("command-surface entry seams", () => {
  it("keeps direct env-check help aligned with its parser and default local check offline", async () => {
    const help = run(ENV_CHECK, ["--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain("--json");
    expect(help.stdout).not.toContain("--mode <mode>");
    expect(help.stdout).toContain("--operation <operation>");
    expect(help.stdout).toContain("--smoke");
    expect(help.stdout).toContain("--probe-vendors");
    expect(help.stdout).not.toContain("--image2");

    const accepted = run(ENV_CHECK, ["--json", "--operation", "framed-local-refresh"]);
    expect(accepted.stderr).not.toMatch(/unknown --operation/i);
    expect(() => JSON.parse(accepted.stdout)).not.toThrow();

    const retiredMode = run(ENV_CHECK, ["--mode", "image2-page-workflow"]);
    expect(retiredMode.status).not.toBe(0);
    expect(retiredMode.stderr).toContain("--mode is not a current environment-check argument");

    const retired = run(ENV_CHECK, ["--image2"]);
    expect(retired.status).not.toBe(0);
    expect(parseCliErrorLine(retired.stderr.trim().split(/\r?\n/u).filter(Boolean).at(-1))?.diagnostic).toMatchObject({
      category: "usage",
      next: { action: "fix_arguments" },
    });
    expect(retired.stderr).toContain("--operation raw-generation");

    const providerApi = {
      inspect: vi.fn(async () => { throw new Error("default foundation must remain offline"); }),
      defaults: vi.fn(async () => { throw new Error("default foundation must remain offline"); }),
      classify: vi.fn(async () => { throw new Error("default foundation must remain offline"); }),
      host: vi.fn(async () => { throw new Error("default foundation must remain offline"); }),
    };
    await runAllChecks({ profile: "page-image-framed", providerApi });
    for (const probe of Object.values(providerApi)) expect(probe).not.toHaveBeenCalled();
  }, 60_000);

  it("rejects retired mode selectors before root or standalone initialization creates a bundle", () => {
    const root = mkdtempSync(join(tmpdir(), "pptmaker-retired-mode-"));
    const rootTarget = join(root, "deck_root_rejected");
    const standaloneTarget = join(root, "deck_standalone_rejected");
    try {
      const rootInit = run(PPT_FLOW, ["init", rootTarget, "--deck-type", "keynote", "--style", "dark-executive", "--mode", "image2-page-workflow"]);
      expect(rootInit.status).not.toBe(0);
      expect(existsSync(rootTarget)).toBe(false);

      const standaloneInit = run(BUNDLE_LAYOUT, ["--init", standaloneTarget, "--deck-type", "keynote", "--style", "dark-executive", "--mode", "image2-page-workflow"]);
      expect(standaloneInit.status).not.toBe(0);
      expect(standaloneInit.stderr).toContain("--mode is not a current bundle initialization argument");
      expect(existsSync(standaloneTarget)).toBe(false);

      const doctor = run(PPT_FLOW, ["doctor", "--mode", "image2-page-workflow"]);
      expect(doctor.status).not.toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the closed audited command inventory entry and accurately names verification tiers", () => {
    expect(PPT_FLOW_COMMAND_INVENTORY.length).toBeGreaterThan(0);
    expect(new Set(PPT_FLOW_COMMAND_INVENTORY).size).toBe(PPT_FLOW_COMMAND_INVENTORY.length);
    const contracts = validateCommandContracts({ contracts: COMMAND_CONTRACTS, inventory: PPT_FLOW_COMMAND_INVENTORY });
    expect(contracts.issues, contracts.issues.join("; ")).toEqual([]);
    const help = run(PPT_FLOW, ["--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain("test");
    const testHelp = run(PPT_FLOW, ["test", "--help"]);
    expect(testHelp.status, testHelp.stderr).toBe(0);
    expect(testHelp.stdout).toMatch(/core verification/i);

    const guidance = `${ROOT_README}\n${BOOTSTRAP}\n${COMMANDS}`;
    for (const tier of ["core", "focused", "sweep", "mock E2E", "real E2E"]) {
      expect(guidance, tier).toContain(tier);
    }
    expect(guidance).toMatch(/real E2E[\s\S]{0,180}(?:explicit|separate) authorization/i);
  });

  it("keeps refresh kinds closed to the current public contract", () => {
    const help = run(PPT_FLOW, ["refresh", "--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain("--kind <kind>");
    expect(help.stdout).toContain("title, visual, or notes");
    expect(help.stdout).toContain("--only <ids>");
    expect(help.stdout).toContain("--all");

    const retiredKind = ["reset", "html", "production"].join("-");
    expect(help.stdout).not.toContain(retiredKind);
    const rejected = run(PPT_FLOW, ["refresh", "unused", "--kind", retiredKind]);
    expect(rejected.status, rejected.stderr).toBe(1);
    expect(parseCliErrorLine(rejected.stderr.trim().split(/\r?\n/u).filter(Boolean).at(-1))?.diagnostic).toMatchObject({
      category: "usage",
      next: { action: "fix_arguments", requires_human: false },
    });
  });

  it("keeps root onboarding, classifier pointers, and active terminology current", () => {
    const retiredProtocolStem = ["image2", "page", "authority"].join("-");
    expect(ROOT_README).toMatch(/Node\.js 22\.x, 24\.x, or 26\.x/);
    expect(`${ROOT_README}\n${BOOTSTRAP}`).not.toMatch(/Node(?:\.js)?\s*18|18\+/i);
    expect(ROOT_README).not.toMatch(/doctor --mode/i);
    expect(ROOT_README).not.toMatch(new RegExp(`${retiredProtocolStem}(?!-v2)`));
    expect(ROOT_README).not.toContain("framed-image2");

    const onboarding = `${ROOT_README}\n${BOOTSTRAP}`;
    expect(onboarding).not.toMatch(/image2 plan[\s\S]{0,240}image2 authorize[\s\S]{0,240}image2 generate[\s\S]{0,240}image2 review[\s\S]{0,240}image2 accept/i);
    expect(onboarding).not.toMatch(/doctor --image2/i);
    expect(onboarding).not.toMatch(/doctor --mode/i);
    expect(onboarding).toContain("doctor --run-dir <run-dir> --operation raw-generation");

    expect(COMMANDS).toContain("scripts/06-iteration/change-classifier.md");
    expect(COMMANDS).not.toContain("scripts/05-iteration/change-classifier.md");
    expect(OPEN_SPEC_CONFIG).toContain("ppt_maker_harness/playbook/create-deck.md");
    expect(OPEN_SPEC_CONFIG).not.toContain("scripts/06-iteration/change-classifier.md");
    expect(OPEN_SPEC_CONFIG).not.toContain("scripts/05-iteration/change-classifier.md");
  });
});
