import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

const PPT_FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

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

function runCli(args, { expectSuccess = true } = {}) {
  const result = spawnSync(process.execPath, [PPT_FLOW, ...args], { encoding: "utf8" });
  if (expectSuccess && result.status !== 0) {
    throw new Error(`ppt_flow failed: ${result.stderr}\n${result.stdout}`);
  }
  return result;
}

describe("narrative page-plan CLI", () => {
  it("documents preview and exact narrative publication in public help", () => {
    const help = runCli(["slides", "--help"]);
    expect(help.stdout).toContain("narrative-plan");
    expect(help.stdout).toContain("--candidate <path>");
    expect(help.stdout).toContain("--plan-sha256 <hash>");
    expect(help.stdout).toMatch(/required for\s+narrative publication/);
  });

  it("previews then publishes only through its exact hash with no provider work", () => {
    const root = mkdtempSync(join(tmpdir(), "narrative-page-plan-cli-"));
    try {
      const deck = join(root, "deck_current");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY, "utf8");
      writeFileSync(join(deck, "2_backbone", "design-constraints.md"), CONSTRAINTS, "utf8");
      const candidatePath = join(runDir, "_scratch", "candidate.json");
      writeFileSync(candidatePath, candidate(), "utf8");
      const seed = readFileSync(join(runDir, "slide-specifications.md"), "utf8");

      const preview = JSON.parse(runCli(["slides", "narrative-plan", runDir, "--candidate", candidatePath, "--json"]).stdout);
      expect(preview).toMatchObject({
        kind: "narrative-page-plan",
        publication: "initial-draft",
        plan_path: expect.stringMatching(/_scratch\/narrative-plans\/[0-9a-f]{64}\.json$/),
        provider_calls: 0,
      });
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(seed);
      expect(readState(deck, { purpose: "observe", heal: false }).page_image_target_evidence).toBeUndefined();

      const missingHash = runCli(["slides", "apply-plan", runDir, "--plan", preview.plan_path, "--apply", "--json"], { expectSuccess: false });
      expect(missingHash.status).not.toBe(0);
      expect(missingHash.stderr).toContain("missing_plan_sha256");
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(seed);

      const applied = JSON.parse(runCli([
        "slides", "apply-plan", runDir, "--plan", preview.plan_path, "--apply", "--plan-sha256", preview.plan_sha256, "--json",
      ]).stdout);
      expect(applied).toMatchObject({ applied: true, target_version: "v1", provider_calls: 0, needs_raw_generation: ["DeckGo"] });
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(TARGET_SOURCE);
      expect(readState(deck, { purpose: "observe", heal: false }).page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ workflow: "pure", provider_authorization_sha256: null });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
