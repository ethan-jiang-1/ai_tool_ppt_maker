import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createVersion,
  initBundle,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  activateCleanPageAuthorityTargetDraft,
  initializeTargetPageAuthorityState,
  readState,
  statePath,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { resolveTargetAuthoringDraftRoute } from "../../../ppt_maker_harness/scripts/shared/state/target_authoring_draft_route.mjs";

function source(workflow = "pure") {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: Clean target draft
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

function sourceReceipt(sourceText, workflow = "pure") {
  return {
    schema: "page-authority-image2-source-v2",
    pipeline: "page-authority-image2-v2",
    workflow,
    source_sha256: createHash("sha256").update(sourceText).digest("hex"),
    slides: [{ slide_id: "DeckGo", workflow }],
  };
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "clean-page-authority-target-draft-"));
  const deck = join(root, "deck_target");
  const sourceRunDir = join(deck, "3_versions", "v1");
  const sourceText = source();
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(sourceRunDir, "slide-specifications.md"), sourceText);
  initializeTargetPageAuthorityState(deck, {
    runDir: sourceRunDir,
    sourceReceipt: sourceReceipt(sourceText),
  });
  return { root, deck, sourceRunDir };
}

function makeSourceInactive(deck) {
  const state = readState(deck, { purpose: "observe" });
  state.playbook = "";
  state.current_node = "";
  state.execution_id = "";
  state.execution_started_at = "";
  state.run_version = "";
  state.nodes = {};
  state.playbook_stack = [];
  state.continuation_target_version = "v1";
  writeState(deck, state);
}

describe("clean Page Authority target draft activation", () => {
  it("replaces the source execution with a target draft while preserving source lineage", () => {
    const value = fixture();
    try {
      const sourceBefore = readState(value.deck, { purpose: "observe" });
      const sourceMode = structuredClone(sourceBefore.production_mode.by_version["3_versions/v1"]);
      const sourceEvidence = structuredClone(sourceBefore.page_authority_target_evidence.by_version["3_versions/v1"]);
      const targetRunDir = createVersion(value.sourceRunDir, "v2");

      const result = activateCleanPageAuthorityTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      });

      expect(result).toMatchObject({
        ok: true,
        source_version: "v1",
        target_version: "v2",
        workflow: "pure",
        current_node: "author-target-page-authority-content",
      });
      const after = readState(value.deck, { purpose: "observe" });
      expect(after).toMatchObject({
        playbook: "create-deck",
        run_version: "v2",
        current_node: "author-target-page-authority-content",
        continuation_target_version: "v2",
      });
      expect(after.production_mode.by_version["3_versions/v1"]).toEqual(sourceMode);
      expect(after.page_authority_target_evidence.by_version["3_versions/v1"]).toEqual(sourceEvidence);
      expect(after.production_mode.by_version["3_versions/v2"]).toBeUndefined();
      expect(after.page_authority_target_evidence.by_version["3_versions/v2"]).toBeUndefined();
      expect(after.page_authority_style_master?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(after.page_authority_raw_provider_authorization?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(after.page_authority_progressive_handoff?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(readdirSync(join(targetRunDir, "_generated")).sort()).toEqual(["README.md"]);
      expect(resolveTargetAuthoringDraftRoute(targetRunDir)).toMatchObject({
        run_version: "v2",
        workflow: "pure",
        draft_route_nodes: expect.arrayContaining(["author-target-page-authority-content"]),
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed when the clean target already has a lineage record", () => {
    const value = fixture();
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");
      const state = readState(value.deck, { purpose: "observe" });
      state.production_mode.by_version["3_versions/v2"] = {
        mode: "image2-page-authority-v2",
        workflow: "pure",
        source_epoch: 1,
      };
      writeState(value.deck, state);
      const before = readFileSync(statePath(value.deck));

      expect(() => activateCleanPageAuthorityTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      })).toThrow("CLEAN_TARGET_LINEAGE_CONFLICT:production_mode");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("activates an explicit completed source without inferring continuation lineage", () => {
    const value = fixture();
    try {
      makeSourceInactive(value.deck);
      const targetRunDir = createVersion(value.sourceRunDir, "v2");

      const result = activateCleanPageAuthorityTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      });

      expect(result).toMatchObject({
        ok: true,
        source_version: "v1",
        target_version: "v2",
        workflow: "pure",
      });
      const after = readState(value.deck, { purpose: "observe" });
      expect(after).toMatchObject({
        playbook: "create-deck",
        run_version: "v2",
        current_node: "author-target-page-authority-content",
        continuation_target_version: "v2",
      });
      expect(after.production_mode.by_version["3_versions/v2"]).toBeUndefined();
      expect(after.page_authority_target_evidence.by_version["3_versions/v2"]).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed when another version owns the active Controller execution", () => {
    const value = fixture();
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");
      const state = readState(value.deck, { purpose: "observe" });
      state.run_version = "v2";
      state.nodes = {};
      writeState(value.deck, state);
      const before = readFileSync(statePath(value.deck));

      expect(() => activateCleanPageAuthorityTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      })).toThrow("CLEAN_TARGET_SOURCE_EXECUTION_REQUIRED");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
