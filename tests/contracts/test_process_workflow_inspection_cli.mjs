import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

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

function finalDiagnostic(result) {
  return JSON.parse(result.stderr.trim().split("\n").filter(Boolean).at(-1));
}

const UNDECLARED_SOURCE = [
  "---",
  "production:",
  "  pipeline: unrecognized-image2",
  "---",
  "",
  "## Slide 01: `PastGo`",
  "",
  "**TITLE**: Undeclared source",
  "",
].join("\n");

const UNDECLARED_STATE = [
  "pipeline: unrecognized-image2",
  "mode: unrecognized-mode",
  "",
].join("\n");

describe("workflow inspection CLI projection", () => {
  it("projects a current authoring draft through status and ordinary state without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-cli-"));
    const deck = join(root, "deck_target");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const status = flow(["status", runDir, "--json"]);
      const state = flow(["state", runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({ pipeline: "page-image-workflow" });
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        primary_action: { action_id: "select-target-page-image-workflow" },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps an undeclared source marker outside controller resume", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-cli-unsupported-"));
    const deck = join(root, "deck_unsupported");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const source = join(runDir, "slide-specifications.md");
      writeFileSync(source, "---\nproduction:\n  pipeline: current-protocol-invalid\n---\n");
      const before = treeSnapshot(deck);
      const state = flow(["state", runDir, "--json"]);
      expect(state.status, state.stderr).toBe(1);
      expect(finalDiagnostic(state)).toMatchObject({
        diagnostic: { operation: "repair-current-protocol", next: { action: "repair_prerequisite" } },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects undeclared source and state markers without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-cli-retained-"));
    const sourceDeck = join(root, "deck_retained_source");
    const stateDeck = join(root, "deck_retained_state");
    const sourceRunDir = join(sourceDeck, "3_versions", "v1");
    const stateRunDir = join(stateDeck, "3_versions", "v1");
    try {
      initBundle(sourceDeck, null, "keynote", "dark-executive");
      const retainedSourcePath = join(sourceRunDir, "slide-specifications.md");
      writeFileSync(retainedSourcePath, UNDECLARED_SOURCE);
      const sourceBefore = treeSnapshot(sourceDeck);

      const status = flow(["status", sourceRunDir, "--json"]);
      expect(status.status, status.stderr).toBe(1);
      expect(finalDiagnostic(status)).toMatchObject({
        diagnostic: {
          operation: "repair-current-protocol",
          reason: { kind: "current_protocol_invalid" },
          next: { action: "repair_prerequisite" },
        },
      });
      expect(readFileSync(retainedSourcePath, "utf8")).toBe(UNDECLARED_SOURCE);
      expect(treeSnapshot(sourceDeck)).toEqual(sourceBefore);

      initBundle(stateDeck, null, "keynote", "dark-executive");
      const retainedStatePath = join(stateDeck, "_state", "state.yaml");
      writeFileSync(retainedStatePath, UNDECLARED_STATE);
      const stateBefore = treeSnapshot(stateDeck);

      const resume = flow(["state", stateRunDir, "--json"]);
      expect(resume.status, resume.stderr).not.toBe(0);
      expect(finalDiagnostic(resume)).toMatchObject({
        diagnostic: {
          operation: "observe-state",
          reason: { kind: "replacement_required" },
          next: { action: "repair_prerequisite" },
        },
      });
      expect(readFileSync(retainedStatePath, "utf8")).toBe(UNDECLARED_STATE);
      expect(treeSnapshot(stateDeck)).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
