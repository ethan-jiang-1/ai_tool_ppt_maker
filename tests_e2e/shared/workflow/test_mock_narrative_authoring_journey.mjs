import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

const STORY = `---
schema: story-outline
---

# Story Outline

## Central Claim

Governed data makes AI operations accountable.

## Audience Outcome

Leaders choose a governed first investment.

## Block 1: Establish The Risk

**Audience Question**: Why is an ungoverned pilot unsafe?
**Argument Function**: Establish the operating risk.
**Evidence / Reasoning Beats**:
- Teams cannot trace a response to its source.
**Intended Page Range**: 1-1
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

const TARGET_SOURCE = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Trace the decision
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;

function candidate() {
  return JSON.stringify({
    schema: "narrative-page-grouping-candidate",
    target_page_source: TARGET_SOURCE,
    pages: [{
      slide_id: "DeckGo",
      blocks: [{ block_ordinal: 1, block_heading: "Establish The Risk", beat_ordinals: [1] }],
    }],
  }, null, 2);
}

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function jsonSuccess(result) {
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return JSON.parse(result.stdout);
}

describe("mock narrative authoring journey", () => {
  it("places narrative authoring before Page Source and invalidates a revised story without authorization", () => {
    const root = mkdtempSync(join(tmpdir(), "mock-narrative-authoring-"));
    const deck = join(root, "deck_narrative_authoring");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const initial = jsonSuccess(flow(["state", runDir, "--json"]));
      expect(initial).toMatchObject({
        current_node: "author-target-narrative-sources",
        workflow_inspection: {
          posture: "guide",
          primary_action: { action_id: "author-target-narrative-sources", requires_human: false },
        },
      });

      writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY, "utf8");
      writeFileSync(join(deck, "2_backbone", "design-constraints.md"), CONSTRAINTS, "utf8");
      const candidatePath = join(runDir, "_scratch", "page-grouping.json");
      writeFileSync(candidatePath, candidate(), "utf8");
      const sourceBefore = readFileSync(join(runDir, "slide-specifications.md"), "utf8");

      const preview = jsonSuccess(flow(["slides", "narrative-plan", runDir, "--candidate", candidatePath, "--json"]));
      expect(preview).toMatchObject({ kind: "narrative-page-plan", provider_calls: 0, ordered_slide_ids: ["DeckGo"] });
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(sourceBefore);
      expect(readState(deck, { purpose: "observe", heal: false })).not.toHaveProperty("page_image_target_evidence");

      writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY.replace("accountable", "auditable"), "utf8");
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"), "utf8");
      const stale = flow([
        "slides", "apply-plan", runDir,
        "--plan", preview.plan_path,
        "--apply",
        "--plan-sha256", preview.plan_sha256,
        "--json",
      ]);
      expect(stale.status).toBe(1);
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(sourceBefore);
      expect(readFileSync(join(deck, "_state", "state.yaml"), "utf8")).toEqual(stateBefore);
      const state = readState(deck, { purpose: "observe", heal: false });
      expect(state).not.toHaveProperty("page_image_raw_provider_authorization");
      expect(state).not.toHaveProperty("page_image_target_evidence");

      const refreshed = jsonSuccess(flow(["slides", "narrative-plan", runDir, "--candidate", candidatePath, "--json"]));
      expect(refreshed.plan_sha256).not.toBe(preview.plan_sha256);
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(sourceBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
