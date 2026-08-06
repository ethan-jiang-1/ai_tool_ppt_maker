import { mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState, writeState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

const PPT_FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

function source() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: CLI clean target draft
**VISUAL SCENE**: calm shared systems work on a single clear surface
**BODY**: The target draft must preserve text and visual instructions without inherited production evidence.
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
}

function runCli(args) {
  return spawnSync(process.execPath, [PPT_FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function makeSourceInactive(deck) {
  const state = readState(deck, { purpose: "observe" });
  state.playbook = "";
  state.current_node = "";
  state.execution_id = "";
  state.execution_started_at = "";
  state.run_version = "";
  state.nodes = {};
  state.playbook_stack = [];
  state.continuation_target_version = "v1";
  writeState(deck, state);
}

function finalFailureEnvelope(stderr) {
  const line = stderr.split(/\r?\n/).filter(Boolean).at(-1);
  return JSON.parse(line);
}

describe("ppt_flow new-version Page Authority draft activation", () => {
  it("creates a clean target that validates through the draft route", () => {
    const root = mkdtempSync(join(tmpdir(), "clean-page-authority-new-version-cli-"));
    const deck = join(root, "deck_target");
    const sourceRunDir = join(deck, "3_versions", "v1");
    const aliasRoot = `${root}-alias`;
    const aliasDeck = join(aliasRoot, "deck_target");
    const aliasSourceRunDir = join(aliasDeck, "3_versions", "v1");
    const aliasTargetRunDir = join(aliasDeck, "3_versions", "v2");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      symlinkSync(root, aliasRoot, "dir");
      writeFileSync(join(sourceRunDir, "slide-specifications.md"), source());
      const sourceValidation = runCli(["validate", aliasSourceRunDir]);
      expect(sourceValidation.status, sourceValidation.stderr).toBe(0);
      makeSourceInactive(deck);

      const created = runCli(["new-version", aliasSourceRunDir, "--name", "v2"]);
      expect(created.status, created.stderr).toBe(0);
      expect(created.stdout).toContain(`Created clean version: ${aliasTargetRunDir}`);
      expect(created.stdout).toContain("Activated Page Authority pure authoring draft.");
      expect(readdirSync(join(aliasTargetRunDir, "_generated")).sort()).toEqual(["README.md"]);

      const draftState = readState(deck, { purpose: "observe" });
      expect(draftState).toMatchObject({
        playbook: "create-deck",
        run_version: "v2",
        current_node: "author-target-page-authority-content",
      });
      expect(draftState.production_mode.by_version["3_versions/v2"]).toBeUndefined();
      expect(draftState.page_authority_target_evidence.by_version["3_versions/v2"]).toBeUndefined();
      expect(draftState.page_authority_style_master?.by_version?.["3_versions/v2"]).toBeUndefined();

      const status = runCli(["status", aliasTargetRunDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: "page-authority-image2-v2",
        playbook: "create-deck",
        current_node: "author-target-page-authority-content",
      });
      const targetValidation = runCli(["validate", aliasTargetRunDir]);
      expect(targetValidation.status, targetValidation.stderr).toBe(0);
      expect(targetValidation.stderr).not.toContain("MODE_MISSING");
    } finally {
      rmSync(aliasRoot, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not report a created version when target-draft activation rejects inherited lineage", () => {
    const root = mkdtempSync(join(tmpdir(), "clean-page-authority-new-version-cli-failure-"));
    const deck = join(root, "deck_target");
    const sourceRunDir = join(deck, "3_versions", "v1");
    const targetRunDir = join(deck, "3_versions", "v2");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(sourceRunDir, "slide-specifications.md"), source());
      expect(runCli(["validate", sourceRunDir]).status).toBe(0);
      makeSourceInactive(deck);
      const state = readState(deck, { purpose: "observe" });
      state.production_mode.by_version["3_versions/v2"] = {
        mode: "image2-page-authority-v2",
        workflow: "pure",
        source_epoch: 1,
      };
      writeState(deck, state);

      const failed = runCli(["new-version", sourceRunDir, "--name", "v2"]);

      expect(failed.status).toBe(1);
      expect(failed.stdout).not.toContain("Created clean version:");
      expect(readdirSync(join(targetRunDir, "_generated")).sort()).toEqual(["README.md"]);
      expect(finalFailureEnvelope(failed.stderr)).toMatchObject({
        ok: false,
        code: "FAILED",
        where: "ppt_flow.new-version",
        diagnostic: {
          version: 1,
          category: "structure",
          next: { action: "repair_prerequisite", requires_human: false },
        },
      });
      expect(failed.stderr).toContain("CLEAN_TARGET_LINEAGE_CONFLICT:production_mode");
      expect(readState(deck, { purpose: "observe" }).production_mode.by_version["3_versions/v2"])
        .toEqual(state.production_mode.by_version["3_versions/v2"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
