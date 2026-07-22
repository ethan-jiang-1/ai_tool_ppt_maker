import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createDefaultState,
  readState,
  recordProductionModeTransitionRecoveryConfirmation,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  applyProductionModeTransition,
  confirmPreparedProductionModeTransition,
  prepareProductionModeTransition,
  previewProductionModeTransition,
  recoverProductionModeTransition,
} from "../../PPTMAKER_FRAMEWORK/scripts/05-iteration/migration/production_mode_transition.mjs";

const intake = Object.freeze({
  topic: "Target topic",
  audience: "Target audience",
  duration: "20 minutes",
  language: "English",
  takeaway: "A target-owned takeaway",
  content_constraints: "No inherited prose",
  visual_dna: "Target-owned visual system",
  success_criteria: "A runnable target contract",
});

function source(marker = "legacy") {
  const frontmatter = marker === "html" ? "---\nproduction:\n  pipeline: html-first-v1\n---\n\n" : "";
  return `${frontmatter}## Slide 01: \`HeroGo\`\n\n**TITLE**: Explicit target source\n`;
}

function transitionFixture({ sourceMarker = "legacy", sourceMode = "image2-only" } = {}) {
  const deck = mkdtempSync(join(tmpdir(), "deck_production_mode_transition_"));
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(deck, "deck-guide.md"), "# guide\n");
  writeFileSync(join(runDir, "slide-specifications.md"), source(sourceMarker));
  const state = createDefaultState();
  state.pipeline = sourceMarker === "html" ? "html-first-v1" : "legacy-image2-first";
  state.playbook = "create-deck";
  state.current_node = sourceMode === "image2-only" ? "author-whole-page-content" : "author-structured-content";
  state.execution_id = "exec-source";
  state.execution_started_at = "2026-01-01T00:00:00.000Z";
  state.run_version = "v1";
  state.nodes[state.current_node] = {
    status: "in_progress",
    execution_id: "exec-source",
    run_version: "v1",
  };
  state.production_mode.by_version["3_versions/v1"] = { mode: sourceMode };
  writeState(deck, state);
  return { deck, runDir };
}

function authorHtmlCandidate(runDir) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(intake));
  writeFileSync(join(candidate, "slide-specifications.md"), source("html"));
  mkdirSync(join(candidate, "overrides", "visual-style"), { recursive: true });
  writeFileSync(join(candidate, "overrides", "visual-style", "color_palette.json"), "{}\n");
}

function authorImage2Candidate(runDir) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(intake));
  writeFileSync(join(candidate, "slide-specifications.md"), source("legacy"));
  mkdirSync(join(candidate, "overrides", "visual-style"), { recursive: true });
  writeFileSync(join(candidate, "overrides", "visual-style", "color_palette.json"), "{}\n");
}

describe("production-mode transition adapter", () => {
  it("publishes an Image2-to-HTML target from only authored candidate inputs", () => {
    const fixture = transitionFixture();
    try {
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      const sourceBefore = readFileSync(join(fixture.runDir, "slide-specifications.md"));
      const prepared = prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
      expect(prepared).toMatchObject({ status: "prepared", source_version: "v1", anticipated_target_version: "v2" });
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      authorHtmlCandidate(fixture.runDir);
      const preview = previewProductionModeTransition(fixture.runDir);
      expect(preview).toMatchObject({ status: "previewed", target_version: "v2", target_mode: "html-only", needs_local_materialization: true });
      const confirmed = confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      expect(confirmed).toMatchObject({ status: "confirmed", target_version: "v2", target_mode: "html-only" });
      const result = applyProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      expect(result).toMatchObject({ status: "handoff-complete", target_version: "v2", current_node: "preview-content", needs_local_materialization: true });
      const target = join(fixture.deck, "3_versions", "v2");
      expect(readFileSync(join(target, "slide-specifications.md"), "utf8")).toEqual(source("html"));
      expect(existsSync(join(target, "_generated", "qa", "production_mode_transition.json"))).toBe(true);
      expect(existsSync(join(target, "_generated", "html_production"))).toBe(false);
      expect(readFileSync(join(fixture.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      const state = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-only" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "html-only" });
      expect(state.nodes["checkpoint-intake"].decision).toMatchObject({ kind: "user", value: "proceed" });
      expect(state.nodes["html-delivery-review"]).toBeUndefined();
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });

  it("returns an authoring guide without inferring target source or intake", () => {
    const fixture = transitionFixture();
    try {
      prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
      const result = previewProductionModeTransition(fixture.runDir);
      expect(result).toMatchObject({ status: "authoring_required" });
      expect(result.missing).toContain("target-intake.json");
      expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition", "candidate-run", "slide-specifications.md"))).toBe(false);
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });

  it("publishes an HTML-to-Image2 source/control target offline", () => {
    const fixture = transitionFixture({ sourceMarker: "html", sourceMode: "html-only" });
    try {
      prepareProductionModeTransition(fixture.runDir, { targetMode: "image2-only" });
      authorImage2Candidate(fixture.runDir);
      const preview = previewProductionModeTransition(fixture.runDir);
      expect(preview).toMatchObject({ status: "previewed", target_mode: "image2-only", needs_render: true });
      confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      const result = applyProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      expect(result).toMatchObject({ status: "handoff-complete", target_mode: "image2-only", current_node: "authorize-image2-style-master", needs_render: true });
      const target = join(fixture.deck, "3_versions", "v2");
      expect(existsSync(join(target, "_generated", "html_production"))).toBe(false);
      expect(existsSync(join(target, "_generated", "qa", "production_mode_transition.json"))).toBe(true);
      const state = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.nodes["author-whole-page-content"].status).toBe("completed");
      expect(state.nodes["image2-provider-authorization"]).toBeUndefined();
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });

  it("requires and consumes a durable confirmation before uncertain no-target recovery", () => {
    const fixture = transitionFixture();
    try {
      prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
      authorHtmlCandidate(fixture.runDir);
      const preview = previewProductionModeTransition(fixture.runDir);
      confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      const ownerToken = "a".repeat(64);
      const journalPath = join(fixture.runDir, "_scratch", "production-mode-transition", "apply-journal.json");
      const journal = {
        schema: "pptmaker-production-mode-transition-apply-journal-v1",
        owner_token: ownerToken,
        owner_host: "foreign-owner",
        owner_pid: 99_999_999,
        claimed_at_epoch_ms: Date.now() - 300_001,
        plan_hash: preview.plan_hash,
        source_execution_id: "exec-source",
        source_version: "v1",
        target_version: "v2",
        target_mode: "html-only",
        target_pipeline: "html-first-v1",
        reservation_basename: `.v2.production-mode-transition-reservation-${ownerToken}`,
        staging_basename: `.v2.production-mode-transition-staging-${ownerToken}`,
      };
      writeFileSync(journalPath, JSON.stringify(journal));
      expect(() => recoverProductionModeTransition(fixture.runDir, { ownerToken })).toThrow(/confirmation is required/);
      expect(existsSync(journalPath)).toBe(true);
      recordProductionModeTransitionRecoveryConfirmation(fixture.deck, { sourceRunVersion: "v1", planHash: preview.plan_hash, ownerToken });
      const recovered = recoverProductionModeTransition(fixture.runDir, { ownerToken });
      expect(recovered).toMatchObject({ status: "source_restored", source_version: "v1" });
      expect(existsSync(journalPath)).toBe(false);
      const state = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state).toMatchObject({ playbook: "create-deck", current_node: "author-whole-page-content", execution_id: "exec-source" });
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });
});
