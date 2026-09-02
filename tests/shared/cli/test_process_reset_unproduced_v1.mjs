// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/diagnostic-facts/spec.md
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { parseCliErrorLine } from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";

const PPT_FLOW = resolve("ppt_maker_harness/scripts/ppt_flow.mjs");

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

## Slide 02: \`PathWay\`

**TITLE**: Choose the governed path
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

function flow(args) {
  return spawnSync(process.execPath, [PPT_FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function lastEnvelope(stderr) {
  const line = String(stderr || "").trim().split(/\r?\n/u).filter(Boolean).at(-1);
  return parseCliErrorLine(line);
}

function fingerprint(root) {
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
  return hash.digest("hex");
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "reset-unproduced-v1-cli-"));
  const deck = join(root, "deck_current");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "story-outline.md"), STORY, "utf8");
  writeFileSync(join(deck, "2_backbone", "design-constraints.md"), CONSTRAINTS, "utf8");
  const candidatePath = join(runDir, "_scratch", "candidate.json");
  writeFileSync(candidatePath, candidate(), "utf8");
  return { root, deck, runDir, candidatePath };
}

function publishV1(value) {
  const preview = JSON.parse(flow(["paginate", "plan", value.runDir, "--candidate", value.candidatePath, "--json"]).stdout);
  const applied = flow([
    "paginate", "apply", value.runDir, "--plan", preview.plan_path, "--plan-sha256", preview.plan_sha256, "--json",
  ]);
  expect(applied.status, applied.stderr).toBe(0);
}

describe("reset-unproduced-v1 CLI", () => {
  it("rejects missing confirm flag and non-v1 run-dir without writes", () => {
    const value = fixture();
    try {
      publishV1(value);
      const before = fingerprint(value.deck);
      const missing = flow(["reset-unproduced-v1", value.runDir]);
      expect(missing.status).not.toBe(0);
      expect(lastEnvelope(missing.stderr)?.diagnostic).toMatchObject({
        category: "usage",
        next: { action: "fix_arguments" },
      });
      expect(fingerprint(value.deck)).toBe(before);

      const v2 = join(value.deck, "3_versions", "v2");
      mkdirSync(v2, { recursive: true });
      writeFileSync(join(v2, "slide-specifications.md"), "x", "utf8");
      const notV1 = flow(["reset-unproduced-v1", v2, "--confirm-abandon"]);
      expect(notV1.status).not.toBe(0);
      expect(lastEnvelope(notV1.stderr)?.diagnostic).toMatchObject({
        category: "usage",
        next: { action: "fix_arguments" },
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops irreversible evidence without writes", () => {
    const value = fixture();
    try {
      publishV1(value);
      const rawDir = join(value.runDir, "_generated", "page_image_workflow", "raw");
      mkdirSync(rawDir, { recursive: true });
      writeFileSync(join(rawDir, "DeckGo.png"), "png");
      const before = fingerprint(value.deck);
      const refused = flow(["reset-unproduced-v1", value.runDir, "--confirm-abandon"]);
      expect(refused.status).not.toBe(0);
      expect(lastEnvelope(refused.stderr)?.diagnostic).toMatchObject({
        category: "gate",
        next: { action: "repair_prerequisite" },
      });
      expect(lastEnvelope(refused.stderr)?.code).toBe("GATE_BLOCKED");
      expect(refused.stderr).not.toMatch(/internal/i);
      expect(fingerprint(value.deck)).toBe(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("resets unproduced unique v1 and republishes as initial-draft", () => {
    const value = fixture();
    try {
      publishV1(value);
      const reset = flow(["reset-unproduced-v1", value.runDir, "--confirm-abandon", "--json"]);
      expect(reset.status, reset.stderr).toBe(0);
      const report = JSON.parse(reset.stdout);
      expect(report).toMatchObject({
        operation: "reset-unproduced-v1",
        state: "success",
        effect: { run_version: "v1", seed_restored: true, irreversible_records_deleted: false },
      });

      writeFileSync(value.candidatePath, candidate(), "utf8");
      const previewed = flow(["paginate", "plan", value.runDir, "--candidate", value.candidatePath, "--json"]);
      expect(previewed.status, previewed.stderr).toBe(0);
      const preview = JSON.parse(previewed.stdout);
      expect(preview).toMatchObject({ publication: "initial-draft", target_run_version: "v1" });
      const applied = JSON.parse(flow([
        "paginate", "apply", value.runDir, "--plan", preview.plan_path, "--plan-sha256", preview.plan_sha256, "--json",
      ]).stdout);
      expect(applied).toMatchObject({ applied: true, target_version: "v1", provider_calls: 0 });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
