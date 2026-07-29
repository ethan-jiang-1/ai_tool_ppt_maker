import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createInitialState,
  initializeTargetPageAuthorityState,
  writeState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { inspectWorkflow } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function fixture(workflow = "pure") {
  const root = mkdtempSync(join(tmpdir(), "workflow-inspect-target-"));
  const deck = join(root, "deck_target_page_authority");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const source = `---\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: ${workflow}\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: Target prerequisite\n`;
  writeFileSync(join(runDir, "slide-specifications.md"), source);
  const state = createInitialState("target", "keynote", "dark-executive", {
    mode: "image2-page-authority-v2",
    workflow,
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  initializeTargetPageAuthorityState(deck, {
    runVersion: "v1",
    sourceReceipt: {
      schema: "page-authority-image2-source-v2",
      pipeline: "page-authority-image2-v2",
      workflow,
      source_sha256: createHash("sha256").update(source).digest("hex"),
      slides: [{ slide_id: "DeckGo", workflow }],
    },
  });
  return { root, deck, runDir };
}

describe("TARGET workflow inspection", () => {
  it("projects a fresh v2 bundle as a workflow-choice confirm without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-target-draft-"));
    const deck = join(root, "deck_target_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      expect(inspectWorkflow({ runDir })).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
        primary_action: { action_id: "select-target-page-authority-workflow", requires_human: true },
        evidence_summary: { pipeline: "page-authority-image2-v2", mode: null, workflow: null },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects a v2 workflow marker-first with one selected owner action and no writes", () => {
    const value = fixture();
    try {
      const before = treeSnapshot(value.deck);
      expect(inspectWorkflow({ runDir: value.runDir })).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "shared-raw", kind: "TARGET_PROVIDER_AUTHORIZATION_REQUIRED" },
        primary_action: { owner: "shared-raw", action_id: "authorize_target_raw_work", requires_human: true },
        evidence_summary: { mode: "image2-page-authority-v2", workflow: "pure" },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("reports a marker/state repair for a v2/v1 hybrid without healing it", () => {
    const value = fixture();
    try {
      const path = join(value.deck, "_state", "state.yaml");
      const state = createInitialState("hybrid", "keynote", "dark-executive");
      state.continuation_target_version = "v1";
      writeState(value.deck, state);
      const before = readFileSync(path);
      expect(inspectWorkflow({ runDir: value.runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "production-mode", kind: "MODE_SOURCE_IDENTITY_MISMATCH" },
        primary_action: { action_id: "repair-current-route" },
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
