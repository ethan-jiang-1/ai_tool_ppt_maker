import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

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
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, readState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

function visualBrief() {
  return `**VISUAL BRIEF**:\n\`\`\`yaml\nrecipe: editorial-systems\ncomposition: centered-constellation\nmotifs: []\nnegative_constraints:\n  - no-logo\n\`\`\``;
}

function source() {
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: First target fact\n${visualBrief()}\n\n## Slide 02: \`BodyMap\`\n\n**TITLE**: Second target fact\n${visualBrief()}\n`;
}

function mixedCurrentV1Source() {
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v1\n  page_authority_default: framed-image2\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: Historical framed fact\n**VISUAL BRIEF**:\n\`\`\`yaml\nrecipe: editorial-systems\ncomposition: centered-constellation\nmotifs: []\nnegative_constraints:\n  - no-readable-text\n  - no-labels\n\`\`\`\n\n## Slide 02: \`BodyMap\`\n\n**PAGE AUTHORITY**: pure-image2\n**TITLE**: Historical pure fact\n${visualBrief()}\n`;
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

function currentMixedFixture() {
  const root = mkdtempSync(join(tmpdir(), "page-authority-current-structural-"));
  const deck = join(root, "deck_current");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const sourceText = mixedCurrentV1Source();
  writeFileSync(join(runDir, "slide-specifications.md"), sourceText);
  const state = createInitialState("current", "keynote", "dark-executive", {
    mode: "image2-page-authority",
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  return { root, deck, runDir, sourceText };
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

  it("requires an explicit homogeneous v2 source when migrating a CURRENT mixed v1 version", () => {
    const value = currentMixedFixture();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const document = parseSlideDocument(value.sourceText, "slide-specifications.md");
      const slideEditPlan = planSlideEdit(document, [], [{ op: "move", slide_id: "BodyMap", to: "start" }], [], {
        publication: { mode: "next-version", target_version: "v2" },
      });
      const targetSourceText = targetPureSourceInOrder(["BodyMap", "DeckGo"]);
      const registry = createPageAuthorityVisualLanguageResolver(loadPageAuthorityVisualLanguage(value.deck));
      const targetSourceReceipt = parsePageAuthoritySource(targetSourceText, { registry });
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"));

      const plan = previewTargetStructuralVersion({
        sourceRunDir: value.runDir,
        targetRunVersion: "v2",
        slideEditPlan,
        targetWorkflow: "pure",
        targetSourceText,
        targetSourceReceipt,
      });
      expect(plan).toMatchObject({
        source_mode: "image2-page-authority",
        target_workflow: "pure",
        ordered_slide_ids: ["BodyMap", "DeckGo"],
        provider_calls: 0,
      });
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      const result = applyTargetStructuralVersion({
        sourceRunDir: value.runDir,
        plan,
        planHash: plan.plan_hash,
      });
      expect(result).toMatchObject({
        target_version: "v2",
        workflow: "pure",
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
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toContain("page-authority-image2-v1");
      expect(readFileSync(join(value.deck, "3_versions", "v2", "slide-specifications.md"), "utf8")).toContain("page-authority-image2-v2");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
