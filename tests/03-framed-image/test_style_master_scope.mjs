import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveFramedStyleMasterScope } from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { SLIDE_SPECS_NAME, initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { statePath } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

function source() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed Style Master scope
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "framed-style-master-scope-"));
  const deck = join(root, "deck_framed_style_master_scope");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), source(), "utf8");
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

describe("Framed Style Master scope", () => {
  it("reuses Framed's read-only candidate-source resolver without materializing page lineage", () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const scope = resolveFramedStyleMasterScope(value.runDir);

      expect(scope).toMatchObject({
        draft: true,
        workflow: "framed",
        source_candidate: {
          run_dir: value.runDir,
          source_path: join(value.runDir, SLIDE_SPECS_NAME),
          workflow: "framed",
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
