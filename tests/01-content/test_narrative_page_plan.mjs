import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  NarrativePagePlanError,
  applyNarrativePagePlan,
  parseNarrativePageGroupingCandidate,
  previewNarrativePagePlan,
} from "../../ppt_maker_harness/scripts/01-content/index.mjs";
import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  initializeTargetPageImageState,
  readState,
} from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
import {
  createPageImageSourceResolver,
  loadPageImageVisualLanguage,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import { parsePageImageSource } from "../../ppt_maker_harness/scripts/01-content/index.mjs";

const NARRATIVE_VISUAL_SYSTEM = Object.freeze({
  createPageImageSourceResolver,
  loadPageImageVisualLanguage,
});

function previewNarrativePlan(options) {
  return previewNarrativePagePlan({ ...options, visualSystem: NARRATIVE_VISUAL_SYSTEM });
}

function applyNarrativePlan(options) {
  return applyNarrativePagePlan({ ...options, visualSystem: NARRATIVE_VISUAL_SYSTEM });
}

const STORY = `---
schema: story-outline
---

# Story Outline

## Central Claim

Governed data makes AI operations accountable.

## Audience Outcome

Leaders choose a first governed data investment.

## Block 1: Establish The Risk

**Audience Question**: Why is an ungoverned pilot unsafe?
**Argument Function**: Establish the operating risk.
**Evidence / Reasoning Beats**:
- Teams cannot trace a response to its source.
**Intended Page Range**: 1-1

## Block 2: Show The Choice

**Audience Question**: What is the practical first move?
**Argument Function**: Present a credible next step.
**Evidence / Reasoning Beats**:
- Governed lineage makes decisions inspectable.
**Intended Page Range**: 2-2
`;

const CONSTRAINTS = `---
schema: design-constraints
---

# Design Constraints

## Audience

Operations leaders.

## Language and Tone

Plain and evidence-led English.

## Forbidden Claims

- Do not promise autonomous operations.

## Required Terminology

- governed data
`;

function visualBrief() {
  return `**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\``;
}

function targetSource({ title = "Trace the decision", workflow = "pure" } = {}) {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
${visualBrief()}

## Slide 02: \`PathWay\`

**TITLE**: Choose the governed path
${visualBrief()}
`;
}

function candidate(target = targetSource()) {
  return JSON.stringify({
    schema: "narrative-page-grouping-candidate",
    target_page_source: target,
    pages: [
      {
        slide_id: "DeckGo",
        blocks: [{ block_ordinal: 1, block_heading: "Establish The Risk", beat_ordinals: [1] }],
      },
      {
        slide_id: "PathWay",
        blocks: [{ block_ordinal: 2, block_heading: "Show The Choice", beat_ordinals: [1] }],
      },
    ],
  }, null, 2);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "narrative-page-plan-"));
  const deck = join(root, "deck_current");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY, "utf8");
  writeFileSync(join(deck, "2_backbone", "design-constraints.md"), CONSTRAINTS, "utf8");
  const candidatePath = join(runDir, "_scratch", "candidate.json");
  writeFileSync(candidatePath, candidate(), "utf8");
  return { root, deck, runDir, candidatePath };
}

function persistedPlan(preview) {
  return JSON.parse(readFileSync(preview.plan_path, "utf8"));
}

function receiptFor(deck, source) {
  const registry = createPageImageSourceResolver({
    deckDir: deck,
    visualLanguage: loadPageImageVisualLanguage(deck),
  });
  return parsePageImageSource(source, { registry });
}

function assertNoPublication(value, operation) {
  const sourceBefore = readFileSync(join(value.runDir, "slide-specifications.md"), "utf8");
  const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"), "utf8");
  expect(operation).toThrow(NarrativePagePlanError);
  expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toEqual(sourceBefore);
  expect(readFileSync(join(value.deck, "_state", "state.yaml"), "utf8")).toEqual(stateBefore);
  expect(existsSync(join(value.deck, "3_versions", "v2"))).toBe(false);
}

describe("narrative page planning", () => {
  it("compiles a deterministic initial page plan without publishing source, State, or provider work", () => {
    const value = fixture();
    try {
      const beforeSource = readFileSync(join(value.runDir, "slide-specifications.md"), "utf8");
      const beforeState = readFileSync(join(value.deck, "_state", "state.yaml"), "utf8");
      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });

      expect(preview).toMatchObject({
        kind: "narrative-page-plan",
        publication: "initial-draft",
        source_run_version: "v1",
        target_run_version: "v1",
        target_workflow: "pure",
        ordered_slide_ids: ["DeckGo", "PathWay"],
        provider_calls: 0,
      });
      expect(preview.plan_path).toMatch(/_scratch\/narrative-plans\/[0-9a-f]{64}\.json$/);
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toEqual(beforeSource);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"), "utf8")).toEqual(beforeState);

      const repeat = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      expect(repeat.plan_sha256).toBe(preview.plan_sha256);
      expect(readFileSync(repeat.plan_path, "utf8")).toEqual(readFileSync(preview.plan_path, "utf8"));
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("publishes the initial source through the existing State owner with render debt only", () => {
    const value = fixture();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      const result = applyNarrativePlan({
        sourceRunDir: value.runDir,
        plan: persistedPlan(preview),
        planSha256: preview.plan_sha256,
      });

      expect(result).toMatchObject({
        applied: true,
        target_version: "v1",
        materialized_slide_ids: ["DeckGo", "PathWay"],
        needs_raw_generation: ["DeckGo", "PathWay"],
        provider_calls: 0,
        inherited_acceptance: false,
      });
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toBe(targetSource());
      const state = readState(value.deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state.page_image_target_evidence.by_version["3_versions/v1"]).toMatchObject({
        workflow: "pure",
        provider_authorization_sha256: null,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("replays only the same exact initial plan after a State-binding failure", () => {
    const value = fixture();
    try {
      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      const plan = persistedPlan(preview);
      expect(() => applyNarrativePlan({
        sourceRunDir: value.runDir,
        plan,
        planSha256: preview.plan_sha256,
        initializeState: () => { throw new Error("injected initial State binding failure"); },
      })).toThrow("injected initial State binding failure");
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toBe(targetSource());
      expect(readState(value.deck, { purpose: "observe", heal: false }).page_image_target_evidence).toBeUndefined();

      const recovery = applyNarrativePlan({ sourceRunDir: value.runDir, plan, planSha256: preview.plan_sha256 });
      expect(recovery).toMatchObject({ replayed: true, state_bound_only: true, provider_calls: 0 });
      expect(readState(value.deck, { purpose: "observe", heal: false }).page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ workflow: "pure" });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects confined-candidate grammar and target Page Source order before writing a plan", () => {
    const malformed = JSON.parse(candidate());
    malformed.extra = true;
    expect(() => parseNarrativePageGroupingCandidate(JSON.stringify(malformed))).toThrow(NarrativePagePlanError);

    const value = fixture();
    try {
      const reversed = JSON.parse(candidate());
      reversed.pages.reverse();
      writeFileSync(value.candidatePath, JSON.stringify(reversed, null, 2), "utf8");
      const sourceBefore = readFileSync(join(value.runDir, "slide-specifications.md"), "utf8");
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"), "utf8");
      expect(() => previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath }))
        .toThrow(NarrativePagePlanError);
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toEqual(sourceBefore);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"), "utf8")).toEqual(stateBefore);
      expect(existsSync(join(value.runDir, "_scratch", "narrative-plans"))).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects candidates outside scratch and lineage outside the intended page range before preview output", () => {
    const value = fixture();
    try {
      const outside = join(value.root, "candidate.json");
      writeFileSync(outside, candidate(), "utf8");
      expect(() => previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: outside }))
        .toThrow(NarrativePagePlanError);
      expect(existsSync(join(value.runDir, "_scratch", "narrative-plans"))).toBe(false);

      const invalid = JSON.parse(candidate());
      invalid.pages[0].blocks[0] = { block_ordinal: 2, block_heading: "Show The Choice", beat_ordinals: [1] };
      invalid.pages[1].blocks[0] = { block_ordinal: 1, block_heading: "Establish The Risk", beat_ordinals: [1] };
      writeFileSync(value.candidatePath, JSON.stringify(invalid, null, 2), "utf8");
      expect(() => previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath }))
        .toThrow(NarrativePagePlanError);
      expect(existsSync(join(value.runDir, "_scratch", "narrative-plans"))).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("does not read a historical outline when compiling the current Story Outline", () => {
    const value = fixture();
    try {
      const historicalOutline = join(value.deck, "2_backbone", "outline.md");
      writeFileSync(historicalOutline, "retired outline bytes must not be parsed\n", "utf8");
      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      expect(preview).toMatchObject({ publication: "initial-draft", ordered_slide_ids: ["DeckGo", "PathWay"] });
      expect(readFileSync(historicalOutline, "utf8")).toBe("retired outline bytes must not be parsed\n");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops every changed bound narrative input before source or State mutation", () => {
    const mutations = [
      {
        name: "Story Outline",
        apply: (value) => writeFileSync(join(value.deck, "2_backbone", "story-outline.md"), STORY.replace("accountable", "auditable"), "utf8"),
      },
      {
        name: "Design Constraints",
        apply: (value) => writeFileSync(join(value.deck, "2_backbone", "design-constraints.md"), CONSTRAINTS.replace("Plain", "Direct"), "utf8"),
      },
      {
        name: "Visual Language registry",
        apply: (value) => {
          const path = join(value.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
          writeFileSync(path, `${readFileSync(path, "utf8")}\n# narrative preview drift\n`, "utf8");
        },
      },
      {
        name: "candidate bytes",
        apply: (value) => writeFileSync(value.candidatePath, `${candidate()}\n`, "utf8"),
      },
      {
        name: "candidate locator",
        apply: (value) => rmSync(value.candidatePath),
      },
      {
        name: "current Page Source",
        apply: (value) => {
          const path = join(value.runDir, "slide-specifications.md");
          writeFileSync(path, `${readFileSync(path, "utf8")}\n`, "utf8");
        },
      },
    ];
    for (const mutation of mutations) {
      const value = fixture();
      try {
        const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
        const plan = persistedPlan(preview);
        mutation.apply(value);
        assertNoPublication(value, () => applyNarrativePlan({
          sourceRunDir: value.runDir,
          plan,
          planSha256: preview.plan_sha256,
        }));
      } finally {
        rmSync(value.root, { recursive: true, force: true });
      }
    }
  });

  it("requires the exact confirmed plan hash before any initial publication", () => {
    const value = fixture();
    try {
      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      assertNoPublication(value, () => applyNarrativePlan({
        sourceRunDir: value.runDir,
        plan: persistedPlan(preview),
        planSha256: "0".repeat(64),
      }));
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects invalid lineage before writing a plan or current source", () => {
    const value = fixture();
    try {
      const invalid = JSON.parse(candidate());
      invalid.pages[0].blocks[0].beat_ordinals = [2];
      writeFileSync(value.candidatePath, JSON.stringify(invalid, null, 2), "utf8");
      const beforeSource = readFileSync(join(value.runDir, "slide-specifications.md"), "utf8");
      expect(() => previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath }))
        .toThrow(NarrativePagePlanError);
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8")).toEqual(beforeSource);
      expect(existsSync(join(value.runDir, "_scratch", "narrative-plans"))).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("publishes an authored source as a clean vNext", () => {
    const value = fixture();
    try {
      const authored = targetSource({ title: "Original source", workflow: "pure" });
      writeFileSync(join(value.runDir, "slide-specifications.md"), authored, "utf8");
      initializeTargetPageImageState(value.deck, { runVersion: "v1", sourceReceipt: receiptFor(value.deck, authored) });
      writeFileSync(value.candidatePath, candidate(targetSource({ title: "Reframed source", workflow: "pure" })), "utf8");

      const preview = previewNarrativePlan({ sourceRunDir: value.runDir, candidatePath: value.candidatePath });
      expect(preview).toMatchObject({ publication: "next-version", target_run_version: "v2" });
      const result = applyNarrativePlan({ sourceRunDir: value.runDir, plan: persistedPlan(preview), planSha256: preview.plan_sha256 });
      expect(result).toMatchObject({ target_version: "v2", provider_calls: 0, inherited_acceptance: false });
      expect(readFileSync(join(value.deck, "3_versions", "v2", "slide-specifications.md"), "utf8"))
        .toBe(targetSource({ title: "Reframed source", workflow: "pure" }));
      expect(readState(value.deck, { purpose: "observe", heal: false }).page_image_target_evidence.by_version["3_versions/v2"])
        .toMatchObject({ workflow: "pure", provider_authorization_sha256: null });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
