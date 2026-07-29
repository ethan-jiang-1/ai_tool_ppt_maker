import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function currentV1Source() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Slide 01: \`DeckGo\`

**TITLE**: Current compatibility fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`
`;
}

function createCurrentFixture(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_current");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, "slide-specifications.md"), currentV1Source(), "utf8");
  const state = createInitialState("current", "keynote", "dark-executive", { mode: "image2-page-authority" });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  return { root, deck, runDir };
}

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
  it("keeps current Page Authority state and status free of retired projections", () => {
    const fixture = createCurrentFixture("workflow-inspection-cli-");
    try {
      const before = treeSnapshot(fixture.deck);
      const state = flow(["state", fixture.runDir, "--json"]);
      const status = flow(["status", fixture.runDir, "--json"]);
      expect(state.status, state.stderr).toBe(0);
      expect(status.status, status.stderr).toBe(0);
      const stateReport = JSON.parse(state.stdout);
      const statusReport = JSON.parse(status.stdout);

      expect(stateReport.durable_state).toMatchObject({ schema_version: 5, production_mode: { by_version: { "3_versions/v1": { mode: "image2-page-authority" } } } });
      expect(stateReport).not.toHaveProperty("schema_version");
      expect(stateReport).not.toHaveProperty("nodes");
      expect(statusReport).not.toHaveProperty("workflow_inspection");
      expect(statusReport).not.toHaveProperty("image2_refinement");
      expect(statusReport).not.toHaveProperty("html_reviews");
      expect(stateReport).not.toHaveProperty("html_resume_guidance");
      expect(stateReport).not.toHaveProperty("image2_refinement");
      expect(stateReport).not.toHaveProperty("html_reviews");
      expect(treeSnapshot(fixture.deck)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps an unusable observation behind one stderr failure envelope", () => {
    const fixture = createCurrentFixture("workflow-inspection-cli-invalid-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      writeFileSync(statePath, "][}{\n", "utf8");
      const before = readFileSync(statePath);
      const result = flow(["state", fixture.runDir, "--json"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr.trim().split("\n")).toHaveLength(1);
      expect(JSON.parse(result.stderr)).toMatchObject({ ok: false, code: expect.any(String) });
      expect(readFileSync(statePath)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps source mutation visible to the current state owner", () => {
    const fixture = createCurrentFixture("workflow-inspection-cli-checkpoint-");
    try {
      const first = flow(["status", fixture.runDir, "--json"]);
      expect(first.status, first.stderr).toBe(0);
      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}\n`);
      const second = flow(["state", fixture.runDir, "--json"]);
      expect(second.status, second.stderr).toBe(0);
      const firstReport = JSON.parse(first.stdout);
      const secondReport = JSON.parse(second.stdout);
      expect(firstReport.pipeline).toBe("page-authority-image2-v1");
      expect(secondReport.durable_state.production_mode.by_version["3_versions/v1"].mode).toBe("image2-page-authority");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("persists a v1 receipt only through explicit validation", () => {
    const fixture = createCurrentFixture("workflow-inspection-cli-validate-");
    try {
      const receipt = join(fixture.runDir, "_generated", "page_authority_image2", "receipts", "source-receipt.json");
      expect(existsSync(receipt)).toBe(false);
      const result = flow(["validate", fixture.runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(existsSync(receipt)).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
