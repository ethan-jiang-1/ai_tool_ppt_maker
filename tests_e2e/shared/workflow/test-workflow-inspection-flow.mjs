import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { resolveFramedStyleMasterScope, resolveFramedTargetSource } from "../../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { resolvePureStyleMasterScope, resolvePureTargetSource } from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { acceptLocalStyleMasterFixture } from "../../../tests/helpers/accepted_style_master.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function pngBytes() {
  const canvas = createCanvas(2000, 1125);
  canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

async function createSelectedTargetFixture(workflow) {
  const root = mkdtempSync(join(tmpdir(), `workflow-inspection-${workflow}-`));
  const deck = join(root, "deck_target_inspection");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes());
  const header = "**KICKER**: Operations\n**SUBTITLE**: Current provider-rendered page composition\n";
  const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: Target prerequisite
${header}**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: Current provider-rendered observation content
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Target observation fixture.
`;
  writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
  const state = createInitialState("target", "keynote", "dark-executive", {
    mode: "image2-page-workflow",
    workflow,
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  if (workflow === "framed") {
    resolveFramedTargetSource(runDir);
    await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
  } else {
    resolvePureTargetSource(runDir);
    await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  }
  return { root, deck, runDir };
}

describe("workflow inspection observation flow", () => {
  it("keeps fresh narrative authoring observable without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-e2e-"));
    const deck = join(root, "deck_target_inspection");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const status = flow(["status", runDir, "--json"]);
      const state = flow(["state", runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: "page-image-workflow",
        structure_issues: [],
        current_node: "author-target-narrative-sources",
      });
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "guide",
        root_cause: { owner: "narrative-authoring", kind: "NARRATIVE_SOURCES_REQUIRED" },
        primary_action: { action_id: "author-target-narrative-sources", requires_human: false },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["framed", "pure"])("keeps selected %s workflow observations read-only", async (workflow) => {
    const fixture = await createSelectedTargetFixture(workflow);
    try {
      const paths = pageImageWorkflowPaths(fixture.runDir);
      expect(paths.receipt).toBe(paths.target_source_receipt);
      const sourceReceipt = readFileSync(paths.receipt);
      const before = treeSnapshot(fixture.deck);
      const status = flow(["status", fixture.runDir, "--json"]);
      const state = flow(["state", fixture.runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "guide",
        evidence_summary: { workflow },
        primary_action: { action_id: "plan_progressive_raw_work" },
      });
      expect(readFileSync(paths.receipt)).toEqual(sourceReceipt);
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps a workflow mismatch behind its marker/state hard-stop without coercion", async () => {
    const fixture = await createSelectedTargetFixture("pure");
    try {
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-workflow",
        workflow: "framed",
      });
      state.continuation_target_version = "v1";
      writeState(fixture.deck, state);
      const before = treeSnapshot(fixture.deck);
      const status = flow(["status", fixture.runDir, "--json"]);
      const stateResult = flow(["state", fixture.runDir, "--json"]);
      expect(status.status).not.toBe(0);
      expect(JSON.parse(status.stderr)).toMatchObject({
        ok: false,
        code: "FAILED",
        diagnostic: {
          operation: "repair-current-protocol",
          reason: { kind: "current_protocol_invalid" },
          next: { action: "repair_prerequisite" },
        },
      });
      expect(stateResult.status, stateResult.stderr).toBe(1);
      expect(JSON.parse(stateResult.stderr)).toMatchObject({
        ok: false,
        code: "FAILED",
        diagnostic: {
          operation: "repair-current-protocol",
          reason: { kind: "current_protocol_invalid" },
          next: { action: "repair_prerequisite" },
        },
      });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
