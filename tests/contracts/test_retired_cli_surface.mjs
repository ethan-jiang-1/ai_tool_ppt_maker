import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";

import {
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  initializeTargetPageAuthorityState,
  resolveRunProductionAdapter,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function run(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
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

function finalDiagnostic(stderr) {
  return JSON.parse(stderr.trim().split("\n").filter(Boolean).at(-1));
}

describe("v2-only production CLI surface", () => {
  it("resolves the exact selected v2 workflow and rejects another source protocol", () => {
    const root = mkdtempSync(join(tmpdir(), "current-route-"));
    try {
      const deck = join(root, "deck_current");
      expect(() => initBundle(deck, null, "keynote", "dark-executive", { mode: "unsupported-mode" })).toThrow();
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const v2Source = "---\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n";
      writeFileSync(join(runDir, "slide-specifications.md"), v2Source);
      initializeTargetPageAuthorityState(deck, {
        runDir,
        sourceReceipt: {
          schema: "page-authority-image2-source-v2",
          pipeline: "page-authority-image2-v2",
          workflow: "pure",
          source_sha256: createHash("sha256").update(v2Source).digest("hex"),
          slides: [{ slide_id: "DeckGo", workflow: "pure" }],
        },
      });
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: true,
        mode: "image2-page-authority-v2",
        workflow: "pure",
        adapter: "page-authority-image2-v2",
      });

      const unsupportedSource = "---\nproduction:\n  pipeline: unsupported-protocol-v0\n---\n";
      writeFileSync(join(runDir, "slide-specifications.md"), unsupportedSource);
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: false,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("routes fresh v2 Style Master promotion before selected-workflow raw planning", () => {
    const root = mkdtempSync(join(tmpdir(), "target-cli-surface-"));
    const deck = join(root, "deck_target_cli");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a clear editorial visual system with no readable text.\n", "utf8");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Target CLI source
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Target CLI source-owned note.
`);
      const inspected = run(["style-master", "inspect", runDir]);
      expect(inspected.status, inspected.stderr).toBe(0);
      expect(JSON.parse(inspected.stdout)).toMatchObject({
        workflow: "pure",
        head: null,
        next_action: "plan_style_master_candidates",
      });

      const planned = run(["style-master", "plan", runDir, "--candidate-count", "0"]);
      expect(planned.status, planned.stderr).toBe(0);
      const stylePlan = JSON.parse(planned.stdout);
      expect(stylePlan).toMatchObject({
        workflow: "pure",
        max_candidate_submissions: 0,
        next_action: "review_style_master_candidates",
        plan: { candidates: [{ candidate_id: "local-existing", kind: "local-existing" }] },
      });

      const reviewed = run(["style-master", "review", runDir, "--plan-hash", stylePlan.plan_sha256]);
      expect(reviewed.status, reviewed.stderr).toBe(0);
      expect(JSON.parse(reviewed.stdout)).toMatchObject({
        plan_sha256: stylePlan.plan_sha256,
        candidates: [{ candidate_id: "local-existing" }],
      });

      const accepted = run([
        "style-master", "accept", runDir,
        "--plan-hash", stylePlan.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]);
      expect(accepted.status, accepted.stderr).toBe(0);
      expect(JSON.parse(accepted.stdout)).toMatchObject({
        plan_sha256: stylePlan.plan_sha256,
        promoted: true,
        candidate_id: "local-existing",
      });

      const result = run(["image2", "plan", runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        workflow: "pure",
        maximum_submissions: 1,
      });
      expect(resolveRunProductionAdapter(deck, { runDir })).toMatchObject({
        ok: true,
        adapter: "page-authority-image2-v2",
        workflow: "pure",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("has no retired command and hard-stops non-v2 observation and execution without writes", () => {
    const help = run(["--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).not.toMatch(/\b(?:approve|pilot)\b/);
    expect(help.stdout).toContain("style-master [options] <operation> <run_dir>");
    expect(help.stdout).toContain("image2 [options] <operation> <run_dir>");

    const root = mkdtempSync(join(tmpdir(), "unsupported-cli-surface-"));
    try {
      const deck = join(root, "deck_unsupported");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: unsupported-protocol-v0\n---\n\n## Slide 01: `PastGo`\n\n**TITLE**: Unsupported\n");
      const before = treeSnapshot(deck);

      for (const args of [
        ["status", runDir, "--json"],
        ["state", runDir, "--json"],
        ["style-master", "inspect", runDir],
        ["image2", "plan", runDir, "--json"],
        ["build", runDir],
      ]) {
        const result = run(args);
        expect(result.status, result.stderr).toBe(1);
        expect(finalDiagnostic(result.stderr)).toMatchObject({
          diagnostic: {
            operation: "export-unsupported-protocol",
            reason: { kind: "unsupported_protocol" },
            next: { action: "export" },
          },
        });
        expect(treeSnapshot(deck)).toEqual(before);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
