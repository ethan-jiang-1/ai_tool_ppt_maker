import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createInitialState, readState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const PPT_FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function source() {
  const brief = `**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\``;
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: First target fact
${brief}

## Slide 02: \`BodyMap\`

**TITLE**: Second target fact
${brief}
`;
}

function runCli(args) {
  const result = spawnSync(process.execPath, [PPT_FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`ppt_flow failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

describe("TARGET structural slides CLI", () => {
  it("publishes a same-workflow v2 vNext through the exact preview hash with no provider work", () => {
    const root = mkdtempSync(join(tmpdir(), "target-structural-cli-"));
    const deck = join(root, "deck_target_cli");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const originalSource = source();
      writeFileSync(join(runDir, "slide-specifications.md"), originalSource);
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
        workflow: "pure",
      });
      state.continuation_target_version = "v1";
      writeState(deck, state);

      const preview = runCli(["slides", "move", runDir, "BodyMap", "--to", "start", "--json"]);
      expect(preview).toMatchObject({
        applied: false,
        transaction: {
          page_authority_target_structural: {
            target_workflow: "pure",
            ordered_slide_ids: ["BodyMap", "DeckGo"],
            provider_calls: 0,
          },
        },
      });
      const planSha256 = preview.transaction.plan_sha256;
      const applied = runCli([
        "slides", "move", runDir, "BodyMap", "--to", "start",
        "--apply", "--plan-sha256", planSha256, "--json",
      ]);
      expect(applied).toMatchObject({
        applied: true,
        target_run_dir: join(deck, "3_versions", "v2"),
        receipt: {
          pipeline: "page-authority-image2-v2",
          workflow: "pure",
          needs_render: ["BodyMap", "DeckGo"],
          page_authority_target_structural: {
            provider_calls: 0,
            inherited_acceptance: false,
          },
        },
      });
      expect(readFileSync(join(runDir, "slide-specifications.md"), "utf8")).toEqual(originalSource);
      expect(readFileSync(join(deck, "3_versions", "v2", "slide-specifications.md"), "utf8"))
        .toContain("## Slide 01: `BodyMap`");
      const after = readState(deck, { purpose: "observe", runVersion: "v1" });
      expect(after.production_mode.by_version["3_versions/v2"]).toEqual({
        mode: "image2-page-authority-v2",
        workflow: "pure",
        source_epoch: 1,
      });
      expect(after.page_authority_target_evidence.by_version["3_versions/v2"])
        .toMatchObject({ accepted_raw_evidence_sha256: null, final_manifest_sha256: null, delivery_receipt_sha256: null });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
