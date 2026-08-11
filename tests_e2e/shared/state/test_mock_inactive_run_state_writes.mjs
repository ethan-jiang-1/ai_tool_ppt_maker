import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createInitialState,
  readState,
  statePath,
  validateState,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Active execution fence
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: State integrity check
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function lastEnvelope(result) {
  const line = result.stderr.split(/\r?\n/).filter(Boolean).at(-1);
  return JSON.parse(line);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "inactive-run-cli-"));
  const deck = join(root, "deck_inactive_run");
  const v1 = join(deck, "3_versions", "v1");
  const v2 = join(deck, "3_versions", "v2");
  initBundle(deck, null, "keynote", "dark-executive");
  mkdirSync(v2, { recursive: true });
  writeFileSync(join(v1, "slide-specifications.md"), source);
  writeFileSync(join(v2, "slide-specifications.md"), source);
  const state = createInitialState("inactive", "keynote", "dark-executive", {
    mode: "image2-page-workflow",
    workflow: "pure",
  });
  state.run_version = "v2";
  state.continuation_target_version = "v2";
  state.production_mode.by_version["3_versions/v2"] = {
    mode: "image2-page-workflow",
    workflow: "pure",
    source_epoch: 1,
  };
  writeState(deck, state);
  return { root, deck, v1, v2 };
}

function pollute(deck) {
  const state = structuredClone(readState(deck, { purpose: "observe" }));
  state.code = "execution_run_version_mismatch";
  state.requested_run_version = "v2";
  state.active_run_version = "v2";
  writeFileSync(statePath(deck), JSON.stringify(state, null, 2));
}

describe("inactive run state writes CLI journey", () => {
  it("hard-stops inactive build and permits only the exact active-state repair", () => {
    const value = fixture();
    try {
      const before = readFileSync(statePath(value.deck));
      const inactiveBuild = flow(["build", value.v1]);
      expect(inactiveBuild.status, inactiveBuild.stderr).toBe(1);
      expect(lastEnvelope(inactiveBuild)).toMatchObject({
        code: "FAILED",
        diagnostic: {
          category: "gate",
          reason: {
            kind: "execution_run_version_mismatch",
            actual: "v1",
            expected: "v2",
          },
          next: {
            action: "inspect",
            inspect: [{ path: value.v2 }],
          },
        },
      });
      expect(readFileSync(statePath(value.deck))).toEqual(before);

      pollute(value.deck);
      const polluted = readFileSync(statePath(value.deck));
      const repaired = flow(["state", value.v2, "--repair-known-execution-mismatch"]);
      expect(repaired.status, repaired.stderr).toBe(0);
      expect(repaired.stdout).toContain("State repair: repaired");
      expect(readFileSync(statePath(value.deck))).not.toEqual(polluted);
      expect(validateState(readState(value.deck, { purpose: "observe" }))).toMatchObject({ valid: true });

      const repairedBytes = readFileSync(statePath(value.deck));
      const rerun = flow(["state", value.v2, "--repair-known-execution-mismatch"]);
      expect(rerun.status, rerun.stderr).toBe(0);
      expect(rerun.stdout).toContain("State repair: no-repair-needed");
      expect(readFileSync(statePath(value.deck))).toEqual(repairedBytes);

      const inactiveRepair = flow(["state", value.v1, "--repair-known-execution-mismatch"]);
      expect(inactiveRepair.status, inactiveRepair.stderr).toBe(1);
      expect(lastEnvelope(inactiveRepair)).toMatchObject({
        code: "FAILED",
        diagnostic: { reason: { kind: "execution_run_version_mismatch", actual: "v1", expected: "v2" } },
      });
      expect(readFileSync(statePath(value.deck))).toEqual(repairedBytes);

      const mixed = flow(["state", value.v2, "--repair-known-execution-mismatch", "--json"]);
      expect(mixed.status, mixed.stderr).toBe(1);
      expect(lastEnvelope(mixed)).toMatchObject({ code: "USAGE" });
      expect(readFileSync(statePath(value.deck))).toEqual(repairedBytes);

      const mixedValidation = flow(["state", value.v2, "--repair-known-execution-mismatch", "--validate-state"]);
      expect(mixedValidation.status, mixedValidation.stderr).toBe(1);
      expect(lastEnvelope(mixedValidation)).toMatchObject({ code: "USAGE" });
      expect(readFileSync(statePath(value.deck))).toEqual(repairedBytes);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
