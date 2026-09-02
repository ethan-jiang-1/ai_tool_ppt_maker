// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/diagnostic-facts/spec.md
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const CURRENT_HELP_TARGETS = [
  "ppt_maker_harness/scripts/00-setup/env-check.mjs",
  "ppt_maker_harness/COMMANDS.md",
  "ppt_maker_harness/BOOTSTRAP.md",
  "ppt_maker_harness/playbook/probe-image-channels.md",
  "ppt_maker_harness/playbook/image2-lab.md",
  "ppt_maker_harness/workflow/00-setup/03-runtime-and-tools.md",
];

function help(script, extra = []) {
  return spawnSync(process.execPath, [script, ...extra, "--help"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
  });
}

describe("retired Image2 live flags are not current work", () => {
  it("does not advertise --smoke or --probe-vendors as accepted help", () => {
    const envHelp = help("ppt_maker_harness/scripts/00-setup/env-check.mjs");
    const probeHelp = help("ppt_maker_harness/scripts/ppt_flow.mjs", ["probe"]);
    const doctorHelp = help("ppt_maker_harness/scripts/ppt_flow.mjs", ["doctor"]);
    for (const result of [envHelp, probeHelp, doctorHelp]) {
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).not.toMatch(/^\s*--smoke\b/m);
      expect(result.stdout).not.toMatch(/^\s*--probe-vendors\b/m);
    }
  });

  it("does not document retired live flags as current work in active guidance", () => {
    for (const file of CURRENT_HELP_TARGETS) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/Use --smoke for the first-vendor gate/);
      expect(text, file).not.toMatch(/doctor --probe-vendors/);
      expect(text, file).not.toMatch(/`probe --smoke`/);
    }
  });
});
