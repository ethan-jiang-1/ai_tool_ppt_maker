import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolvePureStyleMasterScope } from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { SLIDE_SPECS_NAME, initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_authority_paths.mjs";
import { statePath } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "pure-style-master-scope-"));
  const deck = join(root, "deck_pure_style_master_scope");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), [
    "---",
    "identity:",
    "  scheme: mnemonic-v1",
    "production:",
    "  pipeline: page-authority-image2-v2",
    "  workflow: pure",
    "---",
    "",
    "## Slide 01: `DeckGo`",
    "",
    "**TITLE**: Pure Style Master scope",
    "**VISUAL BRIEF**:",
    "```yaml",
    "recipe: editorial-systems",
    "composition: centered-constellation",
    "motifs: []",
    "negative_constraints:",
    "  - no-logo",
    "```",
  ].join("\n"), "utf8");
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir) };
}

describe("Pure Style Master scope", () => {
  it("reuses Pure's read-only candidate-source resolver without materializing page lineage", () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const scope = resolvePureStyleMasterScope(value.runDir);

      expect(scope).toMatchObject({
        draft: true,
        workflow: "pure",
        source_candidate: {
          run_dir: value.runDir,
          source_path: join(value.runDir, SLIDE_SPECS_NAME),
          workflow: "pure",
        },
      });
      expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      expect(existsSync(value.paths.target_source_receipt)).toBe(false);
      expect(existsSync(value.paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
