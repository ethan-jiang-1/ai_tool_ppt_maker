// Tests: openspec/specs/narrative-authoring/spec.md
// Tests: openspec/specs/content-parsing/spec.md
// Tests: openspec/specs/slide-identity-and-ordering/spec.md
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, readState, writeState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

const PPT_FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

function source() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: CLI clean target draft
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: body
    literal: "The target draft must preserve text and visual instructions without inherited production evidence."
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
}

function runCli(args) {
  return spawnSync(process.execPath, [PPT_FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function activateCurrentSource(deck) {
  writeState(deck, createInitialState("target", "keynote", "dark-executive", {
    workflow: "pure",
  }));
}

describe("ppt_flow new-version Page Image draft activation", () => {
  it("creates a clean target that validates through the draft route", () => {
    const root = mkdtempSync(join(tmpdir(), "clean-page-image-new-version-cli-"));
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
      activateCurrentSource(deck);

      const created = runCli(["new-version", aliasSourceRunDir, "--name", "v2"]);
      expect(created.status, created.stderr).toBe(0);
      expect(created.stdout).toContain(`Created clean version: ${aliasTargetRunDir}`);
      expect(created.stdout).toContain("Activated Page Image pure authoring draft.");
      expect(readdirSync(join(aliasTargetRunDir, "_generated")).sort()).toEqual(["README.md"]);

      const draftState = readState(deck, { purpose: "observe" });
      expect(draftState).toMatchObject({
        playbook: "create-deck",
        run_version: "v2",
        current_node: "author-target-page-image-content",
      });
      expect(draftState.production_identity.by_version["3_versions/v2"]).toBeUndefined();
      expect(draftState.page_image_target_evidence?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(draftState.page_image_style_master?.by_version?.["3_versions/v2"]).toBeUndefined();

      const status = runCli(["status", aliasTargetRunDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: "page-image-workflow",
        playbook: "create-deck",
        current_node: "author-target-page-image-content",
      });
      const targetValidation = runCli(["validate", aliasTargetRunDir]);
      expect(targetValidation.status, targetValidation.stderr).toBe(0);
      expect(targetValidation.stderr).not.toContain("MODE_MISSING");
    } finally {
      rmSync(aliasRoot, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("replaces inherited target state with one fresh target draft", () => {
    const root = mkdtempSync(join(tmpdir(), "clean-page-image-new-version-cli-failure-"));
    const deck = join(root, "deck_target");
    const sourceRunDir = join(deck, "3_versions", "v1");
    const targetRunDir = join(deck, "3_versions", "v2");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(sourceRunDir, "slide-specifications.md"), source());
      expect(runCli(["validate", sourceRunDir]).status).toBe(0);
      activateCurrentSource(deck);
      const state = readState(deck, { purpose: "observe" });
      state.production_identity.by_version["3_versions/v2"] = {
        workflow: "pure",
        source_epoch: 1,
      };
      writeState(deck, state);

      const created = runCli(["new-version", sourceRunDir, "--name", "v2"]);

      expect(created.status).toBe(0);
      expect(created.stdout).toContain(`Created clean version: ${targetRunDir}`);
      expect(readdirSync(join(targetRunDir, "_generated")).sort()).toEqual(["README.md"]);
      expect(created.stderr).toBe("");
      const draftState = readState(deck, { purpose: "observe", runDir: targetRunDir });
      expect(draftState.production_identity.by_version).toEqual({});
      expect(draftState).not.toHaveProperty("page_image_target_evidence");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("hard-stops an undeclared source before creating a successor", () => {
    const root = mkdtempSync(join(tmpdir(), "clean-page-image-new-version-cli-undeclared-"));
    const deck = join(root, "deck_target");
    const sourceRunDir = join(deck, "3_versions", "v1");
    const targetRunDir = join(deck, "3_versions", "v2");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(sourceRunDir, "slide-specifications.md"), source().replace("pipeline: page-image-workflow", "pipeline: retired-page-image-workflow"));
      activateCurrentSource(deck);
      const sourceBytes = readFileSync(join(sourceRunDir, "slide-specifications.md"));

      const result = runCli(["new-version", sourceRunDir, "--name", "v2"]);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("CLEAN_TARGET_SOURCE_INVALID");
      expect(existsSync(targetRunDir)).toBe(false);
      expect(readFileSync(join(sourceRunDir, "slide-specifications.md"))).toEqual(sourceBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
