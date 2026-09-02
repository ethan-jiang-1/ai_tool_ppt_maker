// Tests: openspec/specs/image-generation/spec.md
// Tests: openspec/specs/style-master-generation/spec.md
// Tests: openspec/specs/image2-lab/spec.md
// Tests: openspec/specs/pipeline-orchestration/spec.md
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  StyleMasterScopeError,
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_scope.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  SLIDE_SPECS_NAME,
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  initializeTargetPageImageState,
  statePath,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

function source() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Style Master scope
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: The source stays read-only during Style Master scope resolution.
`;
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "style-master-scope-"));
  const deck = join(root, "deck_style_master_scope");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), source(), "utf8");
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function derivedPaths(paths) {
  return [
    paths.target_source_receipt,
    paths.target_raw_plan,
    paths.target_raw_evidence,
    paths.target_raw_review,
    paths.target_raw_review_projection,
    paths.target_final_manifest,
  ];
}

function sourceCandidate(fixture) {
  const sourcePath = join(fixture.runDir, SLIDE_SPECS_NAME);
  const sourceSha = createHash("sha256").update(readFileSync(sourcePath)).digest("hex");
  return {
    run_dir: fixture.runDir,
    deck_dir: fixture.deck,
    source_path: sourcePath,
    source_sha256: sourceSha,
    workflow: "framed",
    receipt: { workflow: "framed", source_sha256: sourceSha },
  };
}

describe("Style Master scope", () => {
  it("resolves an active fresh selected-workflow draft read-only and exposes only canonical local paths", () => {
    const fixture = createFixture();
    try {
      const stateBefore = readFileSync(statePath(fixture.deck));
      expect(derivedPaths(fixture.paths).every((path) => !readFileSyncSafe(path))).toBe(true);

      const scope = bindStyleMasterScopeCandidate(
        resolveStyleMasterScopeContext(fixture.runDir),
        sourceCandidate(fixture),
      );

      expect(scope).toMatchObject({
        run_dir: fixture.runDir,
        deck_dir: fixture.deck,
        run_version: "v1",
        workflow: "framed",
        draft: true,
        source_candidate: {
          run_dir: fixture.runDir,
          source_path: join(fixture.runDir, SLIDE_SPECS_NAME),
          workflow: "framed",
        },
      });
      expect(scope.local_existing_source_path).toBe(styleAsset(fixture.runDir, STYLE_MASTER_IMAGE));
      expect(scope.style_intent_source_path).toBe(styleAsset(fixture.runDir, STYLE_MASTER_PROMPT));
      expect(readFileSync(statePath(fixture.deck))).toEqual(stateBefore);
      expect(derivedPaths(fixture.paths).every((path) => !readFileSyncSafe(path))).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("uses the exact current source/state pair and admits only a validated source-drift recovery candidate", () => {
    const fixture = createFixture();
    try {
      const candidate = sourceCandidate(fixture);
      initializeTargetPageImageState(fixture.deck, {
        runDir: fixture.runDir,
        sourceReceipt: {
          schema: "page-source-receipt",
    artifact_role: "parsed-source",
          pipeline: "page-image-workflow",
          workflow: "framed",
          source_sha256: candidate.source_sha256,
          slides: [{ slide_id: "DeckGo", position: 1 }],
        },
      });
      const stateBefore = readFileSync(statePath(fixture.deck));
      expect(resolveStyleMasterScopeContext(fixture.runDir)).toMatchObject({
        draft: false,
        workflow: "framed",
        run_version: "v1",
      });
      expect(readFileSync(statePath(fixture.deck))).toEqual(stateBefore);

      writeFileSync(join(fixture.runDir, SLIDE_SPECS_NAME), source().replace("Style Master scope", "Stale Style Master scope"), "utf8");
      expect(() => resolveStyleMasterScopeContext(fixture.runDir)).toThrow(expect.objectContaining({
        name: StyleMasterScopeError.name,
        code: "style_master_scope_stale",
      }));
      const recoveryCandidate = sourceCandidate(fixture);
      expect(resolveStyleMasterScopeContext(fixture.runDir, { sourceCandidate: recoveryCandidate })).toMatchObject({
        draft: false,
        workflow: "framed",
        run_version: "v1",
      });
      expect(readFileSync(statePath(fixture.deck))).toEqual(stateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

});

function readFileSyncSafe(path) {
  try {
    readFileSync(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}
