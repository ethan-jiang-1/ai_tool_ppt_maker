import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  applyNarrativePagePlan,
  previewNarrativePagePlan,
} from "../../../ppt_maker_harness/scripts/01-content/index.mjs";
import { createVersion, initBundle, pageImageInitialDraftSource } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  UnproducedV1ResetError,
  UNPRODUCED_V1_RESET_CODES,
  resetUnproducedV1Draft,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/reset_unproduced_v1.mjs";
import { readState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import {
  createPageImageSourceResolver,
  loadPageImageVisualLanguage,
} from "../../../ppt_maker_harness/scripts/02-visual-system/index.mjs";

const NARRATIVE_VISUAL_SYSTEM = Object.freeze({
  createPageImageSourceResolver,
  loadPageImageVisualLanguage,
});

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
  const root = mkdtempSync(join(tmpdir(), "reset-unproduced-v1-"));
  const deck = join(root, "deck_current");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY, "utf8");
  writeFileSync(join(deck, "2_backbone", "design-constraints.md"), CONSTRAINTS, "utf8");
  const candidatePath = join(runDir, "_scratch", "candidate.json");
  writeFileSync(candidatePath, candidate(), "utf8");
  return { root, deck, runDir, candidatePath };
}

function applyFirstPublication(value) {
  const preview = previewNarrativePagePlan({
    sourceRunDir: value.runDir,
    candidatePath: value.candidatePath,
    visualSystem: NARRATIVE_VISUAL_SYSTEM,
  });
  return applyNarrativePagePlan({
    sourceRunDir: value.runDir,
    plan: JSON.parse(readFileSync(preview.plan_path, "utf8")),
    planSha256: preview.plan_sha256,
    visualSystem: NARRATIVE_VISUAL_SYSTEM,
  });
}

function treeFingerprint(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const pathname = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(pathname);
      else files.push(pathname);
    }
  }
  files.sort();
  const hash = createHash("sha256");
  for (const pathname of files) {
    hash.update(pathname.slice(root.length));
    hash.update(readFileSync(pathname));
  }
  return { files, digest: hash.digest("hex") };
}

describe("reset unproduced v1 owner", () => {
  it("reseeds unique unproduced v1 so a later plan is initial-draft", () => {
    const value = fixture();
    try {
      applyFirstPublication(value);
      expect(previewNarrativePagePlan({
        sourceRunDir: value.runDir,
        candidatePath: value.candidatePath,
        visualSystem: NARRATIVE_VISUAL_SYSTEM,
      })).toMatchObject({ publication: "next-version", target_run_version: "v2" });

      const result = resetUnproducedV1Draft(value.runDir);
      expect(result).toMatchObject({
        ok: true,
        run_version: "v1",
        seed_restored: true,
        irreversible_records_deleted: false,
      });
      expect(readFileSync(join(value.runDir, "slide-specifications.md"), "utf8"))
        .toBe(pageImageInitialDraftSource("keynote"));
      const state = readState(value.deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state.production_identity?.by_version?.["3_versions/v1"]).toBeUndefined();
      expect(state.current_node).toBe("author-target-narrative-sources");
      expect(existsSync(join(value.runDir, "_generated", "page_image_workflow"))).toBe(false);

      writeFileSync(value.candidatePath, candidate(), "utf8");
      const preview = previewNarrativePagePlan({
        sourceRunDir: value.runDir,
        candidatePath: value.candidatePath,
        visualSystem: NARRATIVE_VISUAL_SYSTEM,
      });
      expect(preview).toMatchObject({ publication: "initial-draft", target_run_version: "v1" });
      const applied = applyNarrativePagePlan({
        sourceRunDir: value.runDir,
        plan: JSON.parse(readFileSync(preview.plan_path, "utf8")),
        planSha256: preview.plan_sha256,
        visualSystem: NARRATIVE_VISUAL_SYSTEM,
      });
      expect(applied).toMatchObject({ target_version: "v1", provider_calls: 0 });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("refuses a successor version and a raw PNG without changing bytes", () => {
    const successor = fixture();
    try {
      applyFirstPublication(successor);
      createVersion(successor.runDir);
      const before = treeFingerprint(successor.deck);
      expect(() => resetUnproducedV1Draft(successor.runDir)).toThrow(UnproducedV1ResetError);
      try {
        resetUnproducedV1Draft(successor.runDir);
      } catch (error) {
        expect(error.code).toBe(UNPRODUCED_V1_RESET_CODES.SUCCESSOR_PRESENT);
      }
      expect(treeFingerprint(successor.deck)).toEqual(before);
    } finally {
      rmSync(successor.root, { recursive: true, force: true });
    }

    const produced = fixture();
    try {
      applyFirstPublication(produced);
      const rawDir = join(produced.runDir, "_generated", "page_image_workflow", "raw");
      mkdirSync(rawDir, { recursive: true });
      writeFileSync(join(rawDir, "DeckGo.png"), "png");
      const before = treeFingerprint(produced.deck);
      try {
        resetUnproducedV1Draft(produced.runDir);
        throw new Error("expected irreversible refuse");
      } catch (error) {
        expect(error).toBeInstanceOf(UnproducedV1ResetError);
        expect(error.code).toBe(UNPRODUCED_V1_RESET_CODES.IRREVERSIBLE_EVIDENCE);
      }
      expect(treeFingerprint(produced.deck)).toEqual(before);
      expect(previewNarrativePagePlan({
        sourceRunDir: produced.runDir,
        candidatePath: produced.candidatePath,
        visualSystem: NARRATIVE_VISUAL_SYSTEM,
      })).toMatchObject({ publication: "next-version", target_run_version: "v2" });
    } finally {
      rmSync(produced.root, { recursive: true, force: true });
    }
  });

  it("keeps append-mostly plan files and only refuses when attempts exist", () => {
    const value = fixture();
    try {
      applyFirstPublication(value);
      const plans = join(value.deck, "1_upstream_raw_material", "page-image-workflow-iterations", "plans", "deadbeef");
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, "work-plan.json");
      writeFileSync(planPath, "{\"ok\":true}\n", "utf8");
      const result = resetUnproducedV1Draft(value.runDir);
      expect(result.irreversible_records_deleted).toBe(false);
      expect(readFileSync(planPath, "utf8")).toBe("{\"ok\":true}\n");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
