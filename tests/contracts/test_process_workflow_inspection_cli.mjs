import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

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

describe("workflow inspection CLI projection", () => {
  it("projects a v2 authoring draft through status and ordinary state without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-cli-v2-"));
    const deck = join(root, "deck_target");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const status = flow(["status", runDir, "--json"]);
      const state = flow(["state", runDir, "--json"]);
      expect(status.status, status.stderr).toBe(0);
      expect(state.status, state.stderr).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({ pipeline: "page-authority-image2-v2" });
      expect(JSON.parse(state.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        primary_action: { action_id: "select-target-page-authority-workflow" },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps unsupported source bytes outside controller resume", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspection-cli-unsupported-"));
    const deck = join(root, "deck_unsupported");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const source = join(runDir, "slide-specifications.md");
      writeFileSync(source, "---\nproduction:\n  pipeline: unsupported-protocol-v0\n---\n");
      const before = treeSnapshot(deck);
      const state = flow(["state", runDir, "--json"]);
      expect(state.status, state.stderr).toBe(1);
      expect(JSON.parse(state.stderr)).toMatchObject({
        diagnostic: { operation: "export-unsupported-protocol", next: { action: "export" } },
      });
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
