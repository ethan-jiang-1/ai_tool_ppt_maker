import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { pageAuthorityImage2Paths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { resolveFramedTargetSource } from "../../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import { resolvePureTargetSource } from "../../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

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

function createSelectedTargetFixture(workflow) {
  const root = mkdtempSync(join(tmpdir(), `workflow-inspection-${workflow}-`));
  const deck = join(root, "deck_target_inspection");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const negativeConstraints = workflow === "framed" ? "  - no-readable-text\n  - no-labels" : "  - no-logo";
  const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: Target prerequisite
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
${negativeConstraints}
\`\`\`

> **SPEAKER NOTE**: Target observation fixture.
`;
  writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
  const state = createInitialState("target", "keynote", "dark-executive", {
    mode: "image2-page-authority-v2",
    workflow,
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  if (workflow === "framed") resolveFramedTargetSource(runDir);
  else resolvePureTargetSource(runDir);
  return { root, deck, runDir };
}

describe("workflow inspection observation flow", () => {
  it("keeps a fresh target workflow-selection gate observable without writes", () => {
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
        pipeline: "page-authority-image2-v2",
        structure_issues: [],
        current_node: "select-target-page-authority-workflow",
      });
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
        primary_action: { action_id: "select-target-page-authority-workflow", requires_human: true },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["framed", "pure"])("keeps selected %s workflow observations read-only", (workflow) => {
    const fixture = createSelectedTargetFixture(workflow);
    try {
      const paths = pageAuthorityImage2Paths(fixture.runDir);
      expect(() => readFileSync(paths.target_source_receipt)).not.toThrow();
      expect(() => readFileSync(paths.receipt)).toThrow();
      const targetReceipt = readFileSync(paths.target_source_receipt);
      const before = treeSnapshot(fixture.deck);
      const status = flow(["status", fixture.runDir, "--json"]);
      const state = flow(["state", fixture.runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        evidence_summary: { workflow },
        primary_action: { action_id: "authorize_target_raw_work" },
      });
      expect(readFileSync(paths.target_source_receipt)).toEqual(targetReceipt);
      expect(() => readFileSync(paths.receipt)).toThrow();
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps a v2 workflow mismatch behind its marker/state hard-stop without coercion", () => {
    const fixture = createSelectedTargetFixture("pure");
    try {
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
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
        message: expect.stringContaining("UNSUPPORTED_PROTOCOL"),
      });
      expect(stateResult.status, stateResult.stderr).toBe(0);
      expect(JSON.parse(stateResult.stdout).workflow_inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "production-mode", kind: "MODE_SOURCE_IDENTITY_MISMATCH" },
        primary_action: { action_id: "repair-current-route" },
      });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
