import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { styleMasterGenerationProfileSha256 } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_schema.mjs";
import {
  createInitialState,
  readState,
  recordEffectiveStyleMasterSelection,
  statePath,
  startPlaybook,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const PPT_FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function source() {
  const brief = `**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\``;
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: First target fact
${brief}

## Slide 02: \`BodyMap\`

**TITLE**: Second target fact
${brief}
`;
}

function runCli(args) {
  const result = spawnSync(process.execPath, [PPT_FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`ppt_flow failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function targetSelection() {
  return {
    schema: "page-authority-style-master-selection-v1",
    run_version: "v2",
    workflow: "pure",
    plan_sha256: "a".repeat(64),
    candidate_id: "candidate-001",
    candidate_sha256: "b".repeat(64),
    candidate_media_type: "image/png",
    candidate_width: 2000,
    candidate_height: 1125,
    candidate_provenance_sha256: "c".repeat(64),
    style_intent_sha256: "d".repeat(64),
    style_context_sha256: "e".repeat(64),
    candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
    previous_selection_sha256: null,
    review_decision_sha256: "0".repeat(64),
    accepted_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("TARGET structural slides CLI", () => {
  it("publishes a same-workflow v2 vNext through the exact preview hash with no provider work", () => {
    const root = mkdtempSync(join(tmpdir(), "target-structural-cli-"));
    const deck = join(root, "deck_target_cli");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const originalSource = source();
      writeFileSync(join(runDir, "slide-specifications.md"), originalSource);
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
        workflow: "pure",
      });
      state.continuation_target_version = "v1";
      writeState(deck, state);

      const preview = runCli(["slides", "move", runDir, "BodyMap", "--to", "start", "--json"]);
      expect(preview).toMatchObject({
        applied: false,
        transaction: {
          page_authority_target_structural: {
            target_workflow: "pure",
            ordered_slide_ids: ["BodyMap", "DeckGo"],
            provider_calls: 0,
          },
        },
      });
      const planSha256 = preview.transaction.plan_sha256;
      const applied = runCli([
        "slides", "move", runDir, "BodyMap", "--to", "start",
        "--apply", "--plan-sha256", planSha256, "--json",
      ]);
      expect(applied).toMatchObject({
        applied: true,
        target_run_dir: join(deck, "3_versions", "v2"),
        receipt: {
          pipeline: "page-authority-image2-v2",
          workflow: "pure",
          needs_render: ["BodyMap", "DeckGo"],
          page_authority_target_structural: {
            provider_calls: 0,
            inherited_acceptance: false,
          },
        },
      });
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(originalSource);
      expect(readFileSync(join(deck, "3_versions", "v2", "slide-specifications.md"), "utf8"))
        .toContain("## Slide 01: `BodyMap`");
      const after = readState(deck, { purpose: "observe", runVersion: "v1" });
      expect(after.production_mode.by_version["3_versions/v2"]).toEqual({
        mode: "image2-page-authority-v2",
        workflow: "pure",
        source_epoch: 1,
      });
      expect(after.page_authority_target_evidence.by_version["3_versions/v2"])
        .toMatchObject({ accepted_raw_evidence_sha256: null, final_manifest_sha256: null, delivery_receipt_sha256: null });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("replays a persisted exact structural plan after target Controller activation without target mutation", () => {
    const root = mkdtempSync(join(tmpdir(), "target-structural-cli-replay-"));
    const deck = join(root, "deck_target_cli_replay");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
        workflow: "pure",
      });
      state.continuation_target_version = "v1";
      writeState(deck, state);

      const preview = runCli(["slides", "move", runDir, "BodyMap", "--to", "start", "--json"]);
      const planPath = join(runDir, "_scratch", "structural-replay.json");
      writeFileSync(planPath, JSON.stringify(preview.transaction));
      runCli([
        "slides", "move", runDir, "BodyMap", "--to", "start",
        "--apply", "--plan-sha256", preview.transaction.plan_sha256, "--json",
      ]);

      const targetRunDir = join(deck, "3_versions", "v2");
      const targetState = readState(deck, { purpose: "observe" });
      startPlaybook(targetState, "create-deck", { runVersion: "v2" });
      targetState.current_node = "plan-target-pure-progressive-raw";
      writeState(deck, targetState);
      recordEffectiveStyleMasterSelection(deck, {
        runVersion: "v2",
        selection: targetSelection(),
      });
      const targetBefore = readFileSync(join(targetRunDir, "slide-specifications.md"));
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      const replay = runCli(["slides", "apply-plan", runDir, "--plan", planPath, "--apply", "--json"]);
      expect(replay).toMatchObject({ applied: true, target_run_dir: targetRunDir });
      expect(readFileSync(join(targetRunDir, "slide-specifications.md"))).toEqual(targetBefore);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(readState(deck, { purpose: "observe", runVersion: "v2" })).toMatchObject({
        playbook: "create-deck",
        current_node: "plan-target-pure-progressive-raw",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails persisted apply-plan replay after target selection-map drift without mutation", () => {
    const root = mkdtempSync(join(tmpdir(), "target-structural-cli-drift-"));
    const deck = join(root, "deck_target_cli_drift");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
        workflow: "pure",
      });
      state.continuation_target_version = "v1";
      writeState(deck, state);

      const preview = runCli(["slides", "move", runDir, "BodyMap", "--to", "start", "--json"]);
      const planPath = join(runDir, "_scratch", "structural-drift.json");
      writeFileSync(planPath, JSON.stringify(preview.transaction));
      runCli([
        "slides", "move", runDir, "BodyMap", "--to", "start",
        "--apply", "--plan-sha256", preview.transaction.plan_sha256, "--json",
      ]);

      const targetRunDir = join(deck, "3_versions", "v2");
      const stateWithDrift = readState(deck, { purpose: "observe" });
      stateWithDrift.page_authority_style_master = {
        by_version: { "3_versions/v2": { ...targetSelection(), candidate_width: 0 } },
      };
      writeFileSync(statePath(deck), `${JSON.stringify(stateWithDrift, null, 2)}\n`);
      const targetBefore = readFileSync(join(targetRunDir, "slide-specifications.md"));
      const stateBefore = readFileSync(statePath(deck));

      expect(() => runCli(["slides", "apply-plan", runDir, "--plan", planPath, "--apply", "--json"]))
        .toThrow(/ppt_flow failed/);
      expect(readFileSync(join(targetRunDir, "slide-specifications.md"))).toEqual(targetBefore);
      expect(readFileSync(statePath(deck))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
