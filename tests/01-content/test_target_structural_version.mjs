import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  applySlideEdit,
  applyTargetStructuralVersion,
  parsePageAuthoritySource,
  parseSlideDocument,
  planSlideEdit,
  previewTargetStructuralVersion,
} from "../../PPTMAKER_FRAMEWORK/scripts/01-content/index.mjs";
import {
  createPageAuthorityVisualLanguageResolver,
  loadPageAuthorityVisualLanguage,
} from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/index.mjs";
import { styleMasterGenerationProfileSha256 } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_schema.mjs";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createInitialState,
  readState,
  recordEffectiveStyleMasterSelection,
  statePath,
  startPlaybook,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

function visualBrief() {
  return `**VISUAL BRIEF**:\n\`\`\`yaml\nrecipe: editorial-systems\ncomposition: centered-constellation\nmotifs: []\nnegative_constraints:\n  - no-logo\n\`\`\``;
}

function source() {
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: First target fact\n${visualBrief()}\n\n## Slide 02: \`BodyMap\`\n\n**TITLE**: Second target fact\n${visualBrief()}\n`;
}

function targetPureSourceInOrder(slideIds) {
  const titles = {
    DeckGo: "Historical framed fact rewritten for Pure",
    BodyMap: "Historical pure fact",
  };
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n\n${slideIds.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`\n\n**TITLE**: ${titles[slideId]}\n${visualBrief()}`).join("\n\n")}\n`;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "page-authority-target-structural-"));
  const deck = join(root, "deck_target");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const sourceText = source();
  writeFileSync(join(runDir, "slide-specifications.md"), sourceText);
  const state = createInitialState("target", "keynote", "dark-executive", {
    mode: "image2-page-authority-v2",
    workflow: "pure",
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  return { root, deck, runDir, sourceText };
}

function targetSelection(runVersion = "v2") {
  return {
    schema: "page-authority-style-master-selection-v1",
    run_version: runVersion,
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

function previewFor(value) {
  const document = parseSlideDocument(value.sourceText, "slide-specifications.md");
  const slideEditPlan = planSlideEdit(document, [], [{ op: "move", slide_id: "BodyMap", to: "start" }], [], {
    publication: { mode: "next-version", target_version: "v2" },
  });
  const targetSourceText = applySlideEdit(slideEditPlan, value.sourceText, {
    expectedPlanSha256: slideEditPlan.plan_sha256,
  }).text;
  const registry = createPageAuthorityVisualLanguageResolver(loadPageAuthorityVisualLanguage(value.deck));
  const targetSourceReceipt = parsePageAuthoritySource(targetSourceText, { registry });
  return previewTargetStructuralVersion({
    sourceRunDir: value.runDir,
    targetRunVersion: "v2",
    slideEditPlan,
    targetWorkflow: "pure",
    targetSourceText,
    targetSourceReceipt,
  });
}

describe("TARGET structural vNext", () => {
  it("binds workflow and source receipt into one preview, then publishes fresh raw debt without provider work", () => {
    const value = fixture();
    try {
      const beforeState = readFileSync(join(value.deck, "_state", "state.yaml"));
      const plan = previewFor(value);
      expect(plan).toMatchObject({
        target_workflow: "pure",
        ordered_slide_ids: ["BodyMap", "DeckGo"],
        provider_calls: 0,
      });
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(beforeState);

      const result = applyTargetStructuralVersion({
        sourceRunDir: value.runDir,
        plan,
        planHash: plan.plan_hash,
      });
      expect(result).toMatchObject({
        target_version: "v2",
        workflow: "pure",
        source_epoch: 1,
        materialized_slide_ids: [],
        needs_raw_generation: ["BodyMap", "DeckGo"],
        provider_calls: 0,
        inherited_acceptance: false,
      });
      const state = readState(value.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({
        mode: "image2-page-authority-v2",
        workflow: "pure",
        source_epoch: 1,
      });
      expect(state.page_authority_target_evidence.by_version["3_versions/v2"]).toMatchObject({
        workflow: "pure",
        provider_authorization_sha256: null,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(state.continuation_target_version).toBe("v2");
      expect(readFileSync(join(value.deck, "3_versions", "v2", "slide-specifications.md"), "utf8"))
        .toContain("## Slide 01: `BodyMap`");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a workflow mutation after preview before materializing a vNext", () => {
    const value = fixture();
    try {
      const plan = previewFor(value);
      const tampered = { ...plan, target_workflow: "framed" };
      const beforeState = readFileSync(join(value.deck, "_state", "state.yaml"));
      expect(() => applyTargetStructuralVersion({
        sourceRunDir: value.runDir,
        plan: tampered,
        planHash: plan.plan_hash,
      })).toThrow(/confirmed target structural plan hash/);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(beforeState);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("replays an exact published plan without resetting later target Style Master or Controller state", () => {
    const value = fixture();
    try {
      const plan = previewFor(value);
      applyTargetStructuralVersion({
        sourceRunDir: value.runDir,
        plan,
        planHash: plan.plan_hash,
      });
      const targetRunDir = join(value.deck, "3_versions", "v2");
      const state = readState(value.deck, { purpose: "observe" });
      startPlaybook(state, "create-deck", { runVersion: "v2" });
      state.current_node = "plan-target-pure-progressive-raw";
      writeState(value.deck, state);
      recordEffectiveStyleMasterSelection(value.deck, {
        runVersion: "v2",
        selection: targetSelection(),
      });
      const targetBefore = readFileSync(join(targetRunDir, "slide-specifications.md"));
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"));

      const replay = applyTargetStructuralVersion({
        sourceRunDir: value.runDir,
        plan,
        planHash: plan.plan_hash,
      });

      expect(replay).toMatchObject({ replayed: true, target_run_dir: targetRunDir, provider_calls: 0 });
      expect(readFileSync(join(targetRunDir, "slide-specifications.md"))).toEqual(targetBefore);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      const after = readState(value.deck, { purpose: "observe", runVersion: "v2" });
      expect(after).toMatchObject({ playbook: "create-deck", run_version: "v2", current_node: "plan-target-pure-progressive-raw" });
      expect(after.page_authority_style_master.by_version["3_versions/v2"].workflow).toBe("pure");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails every persisted target tuple drift before changing target source or state", () => {
    const drifts = [
      {
        label: "target source",
        apply: ({ targetRunDir }) => writeFileSync(join(targetRunDir, "slide-specifications.md"), `${targetPureSourceInOrder(["BodyMap", "DeckGo"])}\n# drift\n`),
      },
      {
        label: "target receipt",
        apply: ({ deck }) => {
          const state = readState(deck, { purpose: "observe" });
          state.page_authority_target_evidence.by_version["3_versions/v2"].source_receipt_sha256 = "f".repeat(64);
          writeFileSync(statePath(deck), `${JSON.stringify(state, null, 2)}\n`);
        },
      },
      {
        label: "target mode",
        apply: ({ deck }) => {
          const state = readState(deck, { purpose: "observe" });
          state.production_mode.by_version["3_versions/v2"].source_epoch = 2;
          writeFileSync(statePath(deck), `${JSON.stringify(state, null, 2)}\n`);
        },
      },
      {
        label: "target evidence",
        apply: ({ deck }) => {
          const state = readState(deck, { purpose: "observe" });
          state.page_authority_target_evidence.by_version["3_versions/v2"].source_epoch = 2;
          writeFileSync(statePath(deck), `${JSON.stringify(state, null, 2)}\n`);
        },
      },
      {
        label: "target selection map",
        apply: ({ deck }) => {
          const state = readState(deck, { purpose: "observe" });
          state.page_authority_style_master = { by_version: { "3_versions/v2": { ...targetSelection(), candidate_width: 0 } } };
          writeFileSync(statePath(deck), `${JSON.stringify(state, null, 2)}\n`);
        },
      },
    ];
    for (const drift of drifts) {
      const value = fixture();
      try {
        const plan = previewFor(value);
        applyTargetStructuralVersion({ sourceRunDir: value.runDir, plan, planHash: plan.plan_hash });
        const targetRunDir = join(value.deck, "3_versions", "v2");
        drift.apply({ deck: value.deck, targetRunDir });
        const targetBefore = readFileSync(join(targetRunDir, "slide-specifications.md"));
        const stateBefore = readFileSync(statePath(value.deck));

        expect(() => applyTargetStructuralVersion({
          sourceRunDir: value.runDir,
          plan,
          planHash: plan.plan_hash,
        }), drift.label).toThrow();
        expect(readFileSync(join(targetRunDir, "slide-specifications.md"))).toEqual(targetBefore);
        expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      } finally {
        rmSync(value.root, { recursive: true, force: true });
      }
    }
  });

  it("keeps source selection on its source version when first publishing vNext", () => {
    const value = fixture();
    try {
      recordEffectiveStyleMasterSelection(value.deck, {
        runVersion: "v1",
        selection: targetSelection("v1"),
      });
      const plan = previewFor(value);
      applyTargetStructuralVersion({ sourceRunDir: value.runDir, plan, planHash: plan.plan_hash });
      const state = readState(value.deck, { purpose: "observe" });
      expect(state.page_authority_style_master.by_version["3_versions/v1"].run_version).toBe("v1");
      expect(state.page_authority_style_master.by_version["3_versions/v2"]).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

});
