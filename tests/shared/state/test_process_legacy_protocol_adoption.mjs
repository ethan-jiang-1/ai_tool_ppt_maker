import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { initLegacyFixtureBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createDefaultState,
  readLegacyAdoptionState,
  readState,
  recordLegacyProtocolAdoptionRecoveryConfirmation,
  writeState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  applyLegacyProtocolAdoption,
  confirmPreparedLegacyProtocolAdoption,
  prepareLegacyProtocolAdoption,
  previewLegacyProtocolAdoption,
  recoverLegacyProtocolAdoption,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/production_mode_transition.mjs";
import { inspectLegacyProtocol } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const INTAKE = Object.freeze({
  topic: "Target-owned topic",
  audience: "Target audience",
  duration: "20 minutes",
  language: "English",
  takeaway: "One target-owned outcome",
  content_constraints: "No inherited legacy material",
  visual_dna: "A target-owned visual system",
  success_criteria: "A clean Page Authority raw boundary",
});

function legacySource(pipeline = "whole-page-image2-v1") {
  return `---
production:
  pipeline: ${pipeline}
---

## Slide 01: \`HeroGo\`

**TITLE**: Historical slide
`;
}

function pageAuthoritySource({ title = "Target-owned slide", workflow = "framed", includeLegacyField = false } = {}) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`HeroGo\`

**TITLE**: ${title}
${includeLegacyField ? "**RENDER MODE**: full-page\n" : ""}**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Target-owned note.
`;
}

function currentV1PageAuthoritySource() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Slide 01: \`HeroGo\`

**TITLE**: Current compatibility slide
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Current compatibility note.
`;
}

function retainedRow(workflow = "framed") {
  return {
    source_slide_id: "HeroGo",
    target_slide_id: "HeroGo",
    disposition: "retained",
    workflow,
    text_frame_disposition: workflow === "framed" ? "authored" : "not-applicable",
    visual_brief_disposition: "authored",
    reference_disposition: "none",
    speaker_notes_disposition: "authored",
  };
}

function flow(args) {
  return spawnSync("node", [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function fixture({ pipeline = "whole-page-image2-v1", mode = "image2-only" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "legacy-adoption-"));
  const deck = join(root, "deck_legacy_adoption");
  const fixtureMode = ["html-only", "html-then-image2", "image2-only"].includes(mode) ? mode : "image2-only";
  initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: fixtureMode });
  const runDir = join(deck, "3_versions", "v1");
  writeFileSync(join(runDir, "slide-specifications.md"), legacySource(pipeline));
  const state = createDefaultState();
  state.pipeline = pipeline;
  if (mode === "image2-page-authority") {
    state.playbook = "";
    state.current_node = "";
    state.execution_id = "";
    state.execution_started_at = "";
    state.run_version = "";
    state.production_mode.by_version["3_versions/v1"] = { mode, source_epoch: 1 };
  } else {
    state.playbook = "create-deck";
    state.current_node = mode === "image2-only" ? "author-whole-page-content" : "author-structured-content";
    state.execution_id = "exec-historical-source";
    state.execution_started_at = "2026-07-27T00:00:00.000Z";
    state.run_version = "v1";
    state.nodes[state.current_node] = {
      status: "in_progress",
      execution_id: state.execution_id,
      run_version: "v1",
    };
    state.production_mode.by_version["3_versions/v1"] = { mode };
  }
  writeState(deck, state);
  return { root, deck, runDir };
}

function authorCandidate(runDir, { workflow = "framed", rows = [retainedRow(workflow)], source = pageAuthoritySource({ workflow }) } = {}) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target.json"), JSON.stringify({
    schema: "pptmaker-production-mode-transition-target-v2",
    target_mode: "image2-page-authority-v2",
    workflow,
  }));
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(INTAKE));
  writeFileSync(join(candidate, "slide-specifications.md"), source);
  writeFileSync(join(candidate, "adoption-matrix.json"), JSON.stringify({
    schema: "pptmaker-page-authority-legacy-adoption-matrix-v2",
    source_version: "v1",
    rows,
  }));
  return candidate;
}

function confirmedFixture() {
  const value = fixture();
  prepareLegacyProtocolAdoption(value.runDir);
  authorCandidate(value.runDir);
  const preview = previewLegacyProtocolAdoption(value.runDir);
  confirmPreparedLegacyProtocolAdoption(value.runDir, { planHash: preview.plan_hash });
  return { ...value, preview };
}

describe("legacy protocol adoption", () => {
  it("classifies only the four direct protocol outcomes without writes or provider work", () => {
    const legacy = fixture();
    const current = fixture({ pipeline: "page-authority-image2-v1", mode: "image2-page-authority" });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const sourceBefore = readFileSync(join(legacy.runDir, "slide-specifications.md"));
      const stateBefore = readFileSync(join(legacy.deck, "_state", "state.yaml"));
      expect(inspectLegacyProtocol(legacy.runDir)).toMatchObject({
        classification: "recognized-legacy",
        next_action: "prepare-legacy-adoption",
      });
      expect(readFileSync(join(legacy.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      expect(readFileSync(join(legacy.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      writeFileSync(join(current.runDir, "slide-specifications.md"), currentV1PageAuthoritySource());
      expect(inspectLegacyProtocol(current.runDir)).toMatchObject({ classification: "current" });

      writeFileSync(join(legacy.runDir, "slide-specifications.md"), pageAuthoritySource());
      expect(inspectLegacyProtocol(legacy.runDir)).toMatchObject({ classification: "current-pair-corrupt" });

      writeFileSync(join(legacy.runDir, "slide-specifications.md"), legacySource("unsupported-v0"));
      expect(inspectLegacyProtocol(legacy.runDir)).toMatchObject({ classification: "unsupported-or-corrupt" });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(legacy.root, { recursive: true, force: true });
      rmSync(current.root, { recursive: true, force: true });
    }
  });

  it("binds a complete authored matrix into the exact preview and publishes a clean Page Authority target", () => {
    const value = fixture();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      mkdirSync(join(value.runDir, "_generated", "legacy-only"), { recursive: true });
      writeFileSync(join(value.runDir, "_generated", "legacy-only", "pixels.png"), "legacy pixels");
      const sourceBefore = readFileSync(join(value.runDir, "slide-specifications.md"));
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"));

      expect(prepareLegacyProtocolAdoption(value.runDir)).toMatchObject({
        plan_kind: "legacy-adoption",
        target_mode: "image2-page-authority-v2",
        target_workflow: null,
      });
      authorCandidate(value.runDir);
      const preview = previewLegacyProtocolAdoption(value.runDir);
      expect(preview).toMatchObject({
        plan_kind: "legacy-adoption",
        target_mode: "image2-page-authority-v2",
        target_workflow: "framed",
        deterministic_impact: { needs_raw_generation: ["HeroGo"] },
        adoption: { workflow: "framed", matrix_rows: [retainedRow()] },
      });
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      confirmPreparedLegacyProtocolAdoption(value.runDir, { planHash: preview.plan_hash });
      const applied = applyLegacyProtocolAdoption(value.runDir, { planHash: preview.plan_hash });
      expect(applied).toMatchObject({
        target_version: "v2",
        target_mode: "image2-page-authority-v2",
        target_workflow: "framed",
        current_node: "authorize-target-framed-raw",
        needs_raw_generation: ["HeroGo"],
      });
      const target = join(value.deck, "3_versions", "v2");
      const state = readState(value.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.production_mode.by_version["3_versions/v1"]).toBeUndefined();
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "image2-page-authority-v2", workflow: "framed", source_epoch: 1 });
      expect(state.current_node).toBe("authorize-target-framed-raw");
      expect(state.page_authority_target_evidence.by_version["3_versions/v2"]).toMatchObject({
        schema: "page-authority-image2-target-state-v1",
        run_version: "v2",
        source_epoch: 1,
        workflow: "framed",
        provider_authorization_sha256: null,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(state.page_authority_raw_provider_authorization?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(state.page_authority_delivery_review?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(readFileSync(join(target, "slide-specifications.md"), "utf8")).toContain("page-authority-image2-v2");
      expect(existsSync(join(target, "_generated", "legacy-only", "pixels.png"))).toBe(false);
      expect(existsSync(join(target, "adoption-matrix.json"))).toBe(false);
      expect(existsSync(join(target, "_scratch", "production-mode-transition"))).toBe(false);
      expect(readFileSync(join(value.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects incomplete, derived, or drifted candidate material before state confirmation", () => {
    const value = fixture();
    try {
      prepareLegacyProtocolAdoption(value.runDir);
      const candidate = authorCandidate(value.runDir, { rows: [] });
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"));
      expect(() => previewLegacyProtocolAdoption(value.runDir)).toThrow(/adoption matrix is invalid/);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      writeFileSync(join(candidate, "adoption-matrix.json"), JSON.stringify({
        schema: "pptmaker-page-authority-legacy-adoption-matrix-v2",
        source_version: "v1",
        rows: [retainedRow()],
      }));
      const preview = previewLegacyProtocolAdoption(value.runDir);
      writeFileSync(join(candidate, "slide-specifications.md"), pageAuthoritySource({ title: "Drifted target-owned source" }));
      expect(() => confirmPreparedLegacyProtocolAdoption(value.runDir, { planHash: preview.plan_hash })).toThrow(/preview inputs changed/);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      rmSync(candidate, { recursive: true, force: true });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps legacy-adoption uncertain recovery under the same exact journal owner", () => {
    const value = confirmedFixture();
    try {
      const ownerToken = "a".repeat(64);
      const journalPath = join(value.runDir, "_scratch", "production-mode-transition", "apply-journal.json");
      writeFileSync(journalPath, JSON.stringify({
        schema: "pptmaker-production-mode-transition-apply-journal-v1",
        owner_token: ownerToken,
        owner_host: "foreign-legacy-adoption-owner",
        owner_pid: 999999,
        claimed_at_epoch_ms: Date.now() - 300_001,
        plan_hash: value.preview.plan_hash,
        source_execution_id: value.preview.source_execution_id,
        source_version: "v1",
        target_version: "v2",
        target_mode: "image2-page-authority-v2",
        target_pipeline: "page-authority-image2-v2",
        target_workflow: "framed",
        reservation_basename: `.v2.production-mode-transition-reservation-${ownerToken}`,
        staging_basename: `.v2.production-mode-transition-staging-${ownerToken}`,
      }));
      expect(() => recoverLegacyProtocolAdoption(value.runDir, { ownerToken })).toThrow(/confirmation is required/);
      expect(existsSync(journalPath)).toBe(true);
      recordLegacyProtocolAdoptionRecoveryConfirmation(value.deck, {
        sourceRunVersion: "v1",
        planHash: value.preview.plan_hash,
        ownerToken,
      });
      expect(recoverLegacyProtocolAdoption(value.runDir, { ownerToken })).toMatchObject({
        status: "source_restored",
        source_version: "v1",
      });
      expect(existsSync(journalPath)).toBe(false);
      expect(existsSync(join(value.deck, "3_versions", "v2"))).toBe(false);
      expect(readLegacyAdoptionState(value.deck, { purpose: "observe", sourceRunVersion: "v1" })).toMatchObject({
        playbook: "create-deck",
        execution_id: expect.any(String),
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("exposes the observer and adoption forms as one closed state CLI grammar", () => {
    const value = fixture();
    try {
      const inspect = flow(["state", value.runDir, "--inspect-legacy-protocol"]);
      expect(inspect.status, inspect.stderr).toBe(0);
      expect(JSON.parse(inspect.stdout)).toMatchObject({
        operation: "inspect-legacy-protocol",
        classification: "recognized-legacy",
      });
      const mixed = flow(["state", value.runDir, "--inspect-legacy-protocol", "--prepare-legacy-adoption"]);
      expect(mixed.status).toBe(1);
      expect(JSON.parse(mixed.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1))).toMatchObject({ code: "USAGE" });
      const genericPageAuthority = flow(["state", value.runDir, "--prepare-production-mode-transition", "image2-page-authority"]);
      expect(genericPageAuthority.status).toBe(1);
      expect(JSON.parse(genericPageAuthority.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1))).toMatchObject({ code: "USAGE" });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
