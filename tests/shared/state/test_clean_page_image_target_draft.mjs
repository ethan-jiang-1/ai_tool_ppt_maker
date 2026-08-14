import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  createVersion,
  initBundle,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  activateCleanPageImageTargetDraft,
  EXECUTION_LEASE_SCHEMA,
  executionLeasePath,
  initializeTargetPageImageState,
  readState,
  statePath,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { resolveTargetAuthoringDraftRoute } from "../../../ppt_maker_harness/scripts/shared/state/target_authoring_draft_route.mjs";

function source(workflow = "pure") {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
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
    schema: "page-source-receipt",
    artifact_role: "parsed-source",
    pipeline: "page-image-workflow",
    workflow,
    source_sha256: sha256(sourceText),
    slides: [{ slide_id: "DeckGo", position: 1 }],
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "clean-page-image-target-draft-"));
  const deck = join(root, "deck_target");
  const sourceRunDir = join(deck, "3_versions", "v1");
  const sourceText = source();
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(sourceRunDir, "slide-specifications.md"), sourceText);
  initializeTargetPageImageState(deck, {
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

describe("clean Page Image target draft activation", () => {
  it("replaces the source execution with a target-only fresh draft", () => {
    const value = fixture();
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");

      const result = activateCleanPageImageTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      });

      expect(result).toMatchObject({
        ok: true,
        source_version: "v1",
        target_version: "v2",
        workflow: "pure",
        current_node: "author-target-page-image-content",
      });
      const after = readState(value.deck, { purpose: "observe" });
      expect(after).toMatchObject({
        playbook: "create-deck",
        run_version: "v2",
        current_node: "author-target-page-image-content",
        continuation_target_version: "v2",
      });
      expect(after.production_identity.by_version).toEqual({});
      expect(after).not.toHaveProperty("page_image_target_evidence");
      expect(after).not.toHaveProperty("page_image_style_master");
      expect(after).not.toHaveProperty("page_image_raw_provider_authorization");
      expect(after).not.toHaveProperty("page_image_progressive_handoff");
      expect(after.production_identity.by_version["3_versions/v2"]).toBeUndefined();
      expect(after.page_image_target_evidence?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(after.page_image_style_master?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(after.page_image_raw_provider_authorization?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(after.page_image_progressive_handoff?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(readdirSync(join(targetRunDir, "_generated")).sort()).toEqual(["README.md"]);
      const draftRoute = resolveTargetAuthoringDraftRoute(targetRunDir);
      expect(draftRoute).toMatchObject({
        run_version: "v2",
        workflow: "pure",
        draft_route_nodes: expect.arrayContaining(["author-target-page-image-content"]),
      });
      expect(result.draft_route_nodes).toEqual(draftRoute.draft_route_nodes);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses only the independent execution lease when predecessor state bytes are unsupported", () => {
    const value = fixture();
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");
      const unsupportedState = "not: [current state\n";
      writeFileSync(statePath(value.deck), unsupportedState, "utf8");
      writeFileSync(executionLeasePath(value.deck), `${JSON.stringify({
        schema: EXECUTION_LEASE_SCHEMA,
        active_run_version: "v1",
        state_sha256: sha256(unsupportedState),
      })}\n`, "utf8");

      const result = activateCleanPageImageTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      });

      expect(result).toMatchObject({ ok: true, source_version: "v1", target_version: "v2", workflow: "pure" });
      const after = readState(value.deck, { purpose: "observe", runDir: targetRunDir });
      expect(after).toMatchObject({ run_version: "v2", current_node: "author-target-page-image-content" });
      expect(after.production_identity.by_version).toEqual({});
      expect(after).not.toHaveProperty("page_image_target_evidence");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails before state or provider work when the target has derived residue", () => {
    const value = fixture();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");
      writeFileSync(join(targetRunDir, "_generated", "retained-evidence.json"), "{}\n");
      const before = readFileSync(statePath(value.deck));

      expect(() => activateCleanPageImageTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      })).toThrow("CLEAN_TARGET_FILESYSTEM_NOT_CLEAN:generated:retained-evidence.json");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails before activation when the target workflow selection conflicts", () => {
    const selectionValue = fixture();
    try {
      const targetRunDir = createVersion(selectionValue.sourceRunDir, "v2");
      writeFileSync(join(targetRunDir, "slide-specifications.md"), source("framed"));
      const selectionBefore = readFileSync(statePath(selectionValue.deck));
      expect(() => activateCleanPageImageTargetDraft(selectionValue.deck, {
        sourceRunDir: selectionValue.sourceRunDir,
        targetRunDir,
      })).toThrow("CLEAN_TARGET_WORKFLOW_MISMATCH");
      expect(readFileSync(statePath(selectionValue.deck))).toEqual(selectionBefore);

    } finally {
      rmSync(selectionValue.root, { recursive: true, force: true });
    }
  });

  it("does not overwrite a competing state write after target-draft preflight", () => {
    const value = fixture();
    try {
      const targetRunDir = createVersion(value.sourceRunDir, "v2");
      const staleStateSha = sha256(readFileSync(statePath(value.deck)));
      const competing = readState(value.deck, { purpose: "observe" });
      competing.gates.content = "approved";
      writeState(value.deck, competing);
      const concurrentState = readFileSync(statePath(value.deck));

      expect(() => activateCleanPageImageTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
        expectedStateSha: staleStateSha,
      })).toThrow("CONFLICT: state precondition changed");
      expect(readFileSync(statePath(value.deck))).toEqual(concurrentState);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("activates an explicit completed source without inferring continuation lineage", () => {
    const value = fixture();
    try {
      makeSourceInactive(value.deck);
      const targetRunDir = createVersion(value.sourceRunDir, "v2");

      const result = activateCleanPageImageTargetDraft(value.deck, {
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
        current_node: "author-target-page-image-content",
        continuation_target_version: "v2",
      });
      expect(after.production_identity.by_version["3_versions/v2"]).toBeUndefined();
      expect(after.page_image_target_evidence?.by_version?.["3_versions/v2"]).toBeUndefined();
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

      expect(() => activateCleanPageImageTargetDraft(value.deck, {
        sourceRunDir: value.sourceRunDir,
        targetRunDir,
      })).toThrow("CLEAN_TARGET_SOURCE_EXECUTION_REQUIRED");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
