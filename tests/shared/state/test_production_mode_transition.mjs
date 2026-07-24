import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parse, stringify } from "yaml";
import {
  createDefaultState,
  readState,
  recordProductionModeTransitionRecoveryConfirmation,
  writeState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  applyProductionModeTransition,
  confirmPreparedProductionModeTransition,
  prepareProductionModeTransition,
  previewProductionModeTransition,
  recoverProductionModeTransition,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/production_mode_transition.mjs";
import { htmlFirstSlide, htmlFirstSource } from "../../helpers/html_first_fixture.mjs";
import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function runFlow(args) {
  return spawnSync("node", [FLOW, ...args], { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 });
}

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

function source(marker = "whole-page") {
  const pipeline = marker === "html" ? "html-first-v1" : "whole-page-image2-v1";
  const frontmatter = `---\nproduction:\n  pipeline: ${pipeline}\n---\n\n`;
  return `${frontmatter}## Slide 01: \`HeroGo\`\n\n**TITLE**: Explicit target source\n`;
}

function transitionFixture({ sourceMarker = "whole-page", sourceMode = "image2-only" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "production_mode_transition_"));
  const deck = join(root, "deck_production_mode_transition");
  initBundle(deck, null, "keynote", "dark-executive", { mode: sourceMode });
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(deck, "deck-guide.md"), "# guide\n");
  writeFileSync(join(runDir, "slide-specifications.md"), source(sourceMarker));
  const state = createDefaultState();
  state.pipeline = sourceMarker === "html" ? "html-first-v1" : "whole-page-image2-v1";
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
  writeFileSync(join(candidate, "slide-specifications.md"), htmlFirstSource([htmlFirstSlide({ id: "HeroGo", title: "Explicit target source" })]));
  mkdirSync(join(candidate, "overrides", "visual-style"), { recursive: true });
  copyFileSync(join(runDir, "..", "..", "2_backbone", "visual-style", "color_palette.json"), join(candidate, "overrides", "visual-style", "color_palette.json"));
}

function authorImage2Candidate(runDir) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(intake));
  writeFileSync(join(candidate, "slide-specifications.md"), source("whole-page"));
  mkdirSync(join(candidate, "overrides", "visual-style"), { recursive: true });
  writeFileSync(join(candidate, "overrides", "visual-style", "color_palette.json"), "{}\n");
}

function assertNoTransitionPublication(fixture) {
  const parent = join(fixture.deck, "3_versions");
  expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition", "apply-journal.json"))).toBe(false);
  expect(existsSync(join(parent, "v2"))).toBe(false);
  expect(readdirSync(parent).some((entry) => entry.startsWith(".v2.production-mode-transition-"))).toBe(false);
}

function prepareUncertainRecovery({ sameHost = false } = {}) {
  const fixture = transitionFixture();
  prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
  authorHtmlCandidate(fixture.runDir);
  const preview = previewProductionModeTransition(fixture.runDir);
  confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
  const ownerToken = "a".repeat(64);
  const journalPath = join(fixture.runDir, "_scratch", "production-mode-transition", "apply-journal.json");
  const journal = {
    schema: "pptmaker-production-mode-transition-apply-journal-v1",
    owner_token: ownerToken,
    owner_host: sameHost ? hostname().trim().toLowerCase() : "foreign-owner",
    owner_pid: sameHost ? process.pid : 99_999_999,
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
  return { fixture, preview, ownerToken, journalPath, journal };
}

function blockedRecoveryBytes(fixture, journalPath) {
  const state = join(fixture.deck, "_state", "state.yaml");
  const history = join(fixture.deck, "_state", "history.jsonl");
  return {
    state: readFileSync(state),
    history: existsSync(history) ? readFileSync(history) : null,
    journal: readFileSync(journalPath),
  };
}

function expectBlockedRecovery(fixture, journalPath, before) {
  expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(before.state);
  expect(existsSync(join(fixture.deck, "_state", "history.jsonl")) ? readFileSync(join(fixture.deck, "_state", "history.jsonl")) : null).toEqual(before.history);
  expect(readFileSync(journalPath)).toEqual(before.journal);
  expect(existsSync(join(fixture.deck, "3_versions", "v2"))).toBe(false);
  expect(readdirSync(join(fixture.deck, "3_versions")).some((entry) => entry.startsWith(".v2.production-mode-transition-"))).toBe(false);
}

describe("production-mode transition adapter", () => {
  it("keeps the state CLI transition grammar mutually exclusive and hash-bound", () => {
    const fixture = transitionFixture();
    try {
      const stateBeforeInvalidFlags = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      for (const invalidArgs of [
        ["--confirm-production-mode-transition", "--plan-hash", "a".repeat(64), "--force"],
        ["--confirm-production-mode-transition", "--plan-hash", "a".repeat(64), "--reason", "not-a-waiver"],
      ]) {
        const invalid = runFlow(["state", fixture.runDir, ...invalidArgs]);
        expect(invalid.status).toBe(1);
        expect(JSON.parse(invalid.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1))).toMatchObject({ code: "USAGE", where: "ppt_flow.state" });
        expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBeforeInvalidFlags);
        expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition"))).toBe(false);
      }

      const mixed = runFlow(["state", fixture.runDir, "--prepare-production-mode-transition", "html-only", "--preview-production-mode-transition"]);
      expect(mixed.status).toBe(1);
      expect(JSON.parse(mixed.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1))).toMatchObject({ code: "USAGE", where: "ppt_flow.state" });
      expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition", "candidate-run"))).toBe(false);

      const prepared = runFlow(["state", fixture.runDir, "--prepare-production-mode-transition", "html-only"]);
      expect(prepared.status, prepared.stderr).toBe(0);
      expect(JSON.parse(prepared.stdout)).toMatchObject({ operation: "prepare-production-mode-transition", target_mode: "html-only" });
      authorHtmlCandidate(fixture.runDir);
      const preview = runFlow(["state", fixture.runDir, "--preview-production-mode-transition"]);
      expect(preview.status, preview.stderr).toBe(0);
      const previewRecord = JSON.parse(preview.stdout);
      expect(previewRecord).toMatchObject({ operation: "preview-production-mode-transition", target_mode: "html-only" });
      const confirm = runFlow(["state", fixture.runDir, "--confirm-production-mode-transition", "--plan-hash", previewRecord.plan_hash]);
      expect(confirm.status, confirm.stderr).toBe(0);
      const apply = runFlow(["state", fixture.runDir, "--apply-production-mode-transition", "--plan-hash", previewRecord.plan_hash]);
      expect(apply.status, apply.stderr).toBe(0);
      expect(JSON.parse(apply.stdout)).toMatchObject({ operation: "apply-production-mode-transition", target_version: "v2", needs_local_materialization: true });
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });

  it("publishes an Image2-to-HTML target from only authored candidate inputs", () => {
    const fixture = transitionFixture();
    try {
      const sourceOnlyPixel = join(fixture.runDir, "_generated", "source-only-pixel.png");
      const sourceOnlyPrompt = join(fixture.runDir, "_scratch", "source-only-prompt.json");
      mkdirSync(join(fixture.runDir, "_generated"), { recursive: true });
      mkdirSync(join(fixture.runDir, "_scratch"), { recursive: true });
      writeFileSync(sourceOnlyPixel, "source pixels");
      writeFileSync(sourceOnlyPrompt, '{"source":"authority"}\n');
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
      const confirmationAt = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v1" })
        .nodes["apply-production-mode-transition"].transition_confirmation.at;
      const result = applyProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      expect(result).toMatchObject({ status: "handoff-complete", target_version: "v2", current_node: "preview-content", needs_local_materialization: true });
      const target = join(fixture.deck, "3_versions", "v2");
      expect(readFileSync(join(target, "slide-specifications.md"), "utf8")).toContain("pipeline: html-first-v1");
      expect(existsSync(join(target, "_generated", "qa", "production_mode_transition.json"))).toBe(true);
      expect(existsSync(join(target, "_generated", "html_production"))).toBe(false);
      expect(existsSync(join(target, "_generated", "source-only-pixel.png"))).toBe(false);
      expect(existsSync(join(target, "_scratch", "source-only-prompt.json"))).toBe(false);
      expect(readFileSync(join(fixture.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      const state = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-only" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "html-only" });
      expect(state.nodes["checkpoint-intake"].decision).toMatchObject({ kind: "user", value: "proceed", at: confirmationAt });
      expect(state.nodes["checkpoint-intake"].evidence["intake-confirmed"]).toMatchObject({ kind: "user", met: true, at: confirmationAt });
      expect(state.nodes["checkpoint-intake"].decision).not.toHaveProperty("reason");
      expect(state.nodes["checkpoint-intake"].decision.value).not.toBe("waived");
      expect(state.playbook_stack).toEqual([]);
      expect(state.nodes["html-delivery-review"]).toBeUndefined();
      expect(state.image2_provider_authorization?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(state.image2_delivery_review?.by_version?.["3_versions/v2"]).toBeUndefined();
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

  it("rejects a retired HTML-migration overlay before it can become transition evidence", () => {
    const fixture = transitionFixture();
    try {
      prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
      authorHtmlCandidate(fixture.runDir);
      const candidate = join(fixture.runDir, "_scratch", "production-mode-transition", "candidate-run");
      mkdirSync(join(candidate, "html-migration", "projected-run"), { recursive: true });
      writeFileSync(join(candidate, "html-migration", "projected-run", "receipt.json"), '{"retired":true}\n');
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));

      expect(() => previewProductionModeTransition(fixture.runDir)).toThrow(/retired html-migration overlay cannot be transition evidence/);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition", "plan.json"))).toBe(false);
      expect(existsSync(join(fixture.runDir, "_scratch", "production-mode-transition", "apply-journal.json"))).toBe(false);
      expect(existsSync(join(fixture.deck, "3_versions", "v2"))).toBe(false);
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

  it("keeps uncertain-owner recovery as a revalidated fact attestation rather than a waiver", () => {
    const cases = [
      {
        name: "missing attestation",
        setup: ({ fixture, preview, ownerToken }) => ({ fixture, preview, ownerToken }),
      },
      {
        name: "journal drift after attestation",
        setup: ({ fixture, preview, ownerToken, journalPath, journal }) => {
          recordProductionModeTransitionRecoveryConfirmation(fixture.deck, { sourceRunVersion: "v1", planHash: preview.plan_hash, ownerToken });
          writeFileSync(journalPath, JSON.stringify({ ...journal, claimed_at_epoch_ms: journal.claimed_at_epoch_ms - 1 }));
          return { fixture, preview, ownerToken };
        },
      },
      {
        name: "plan drift after attestation",
        setup: ({ fixture, preview, ownerToken }) => {
          recordProductionModeTransitionRecoveryConfirmation(fixture.deck, { sourceRunVersion: "v1", planHash: preview.plan_hash, ownerToken });
          const planPath = join(fixture.runDir, "_scratch", "production-mode-transition", "plan.json");
          const plan = JSON.parse(readFileSync(planPath, "utf8"));
          plan.target_mode = "image2-only";
          writeFileSync(planPath, JSON.stringify(plan));
          return { fixture, preview, ownerToken };
        },
      },
      {
        name: "source identity drift after attestation",
        setup: ({ fixture, preview, ownerToken }) => {
          recordProductionModeTransitionRecoveryConfirmation(fixture.deck, { sourceRunVersion: "v1", planHash: preview.plan_hash, ownerToken });
          writeFileSync(join(fixture.runDir, "slide-specifications.md"), source("html"));
          return { fixture, preview, ownerToken };
        },
      },
    ];

    for (const entry of cases) {
      const prepared = prepareUncertainRecovery();
      try {
        const { fixture, ownerToken } = entry.setup(prepared);
        const before = blockedRecoveryBytes(fixture, prepared.journalPath);
        expect(() => recoverProductionModeTransition(fixture.runDir, { ownerToken })).toThrow();
        expectBlockedRecovery(fixture, prepared.journalPath, before);
      } finally {
        rmSync(prepared.fixture.deck, { recursive: true, force: true });
      }
    }
  });

  it("blocks a live same-host writer and recovery grammar bypasses without durable mutation", () => {
    const prepared = prepareUncertainRecovery({ sameHost: true });
    try {
      const before = blockedRecoveryBytes(prepared.fixture, prepared.journalPath);
      expect(() => recoverProductionModeTransition(prepared.fixture.runDir, { ownerToken: prepared.ownerToken })).toThrow(/owner is still live/);
      expectBlockedRecovery(prepared.fixture, prepared.journalPath, before);

      for (const args of [
        ["state", prepared.fixture.runDir, "--recover-production-mode-transition", prepared.ownerToken, "--force"],
        ["state", prepared.fixture.runDir, "--recover-production-mode-transition", prepared.ownerToken, "--reason", "not-a-waiver"],
      ]) {
        const result = runFlow(args);
        expect(result.status).toBe(1);
        expect(JSON.parse(result.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1))).toMatchObject({ code: "USAGE", where: "ppt_flow.state" });
        expectBlockedRecovery(prepared.fixture, prepared.journalPath, before);
      }
    } finally {
      rmSync(prepared.fixture.deck, { recursive: true, force: true });
    }
  });

  it("hard-stops missing, malformed, and digest-mismatched target-intake tuples before transition publication", () => {
    for (const mutateTuple of [
      (record) => { delete record.transition_target_intake; },
      (record) => { delete record.transition_confirmation; },
      (record) => { record.transition_target_intake_sha256 = "0".repeat(64); },
      (record) => { record.transition_confirmation = { kind: "user", decision: "waived", at: record.transition_confirmation.at }; },
    ]) {
      const fixture = transitionFixture();
      try {
        prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
        authorHtmlCandidate(fixture.runDir);
        const preview = previewProductionModeTransition(fixture.runDir);
        confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });

        const stateFile = join(fixture.deck, "_state", "state.yaml");
        const malformed = parse(readFileSync(stateFile, "utf8"));
        mutateTuple(malformed.nodes["apply-production-mode-transition"]);
        writeFileSync(stateFile, stringify(malformed));
        const stateBeforeApply = readFileSync(stateFile);
        const historyFile = join(fixture.deck, "_state", "history.jsonl");
        const historyBeforeApply = existsSync(historyFile) ? readFileSync(historyFile) : null;

        expect(() => applyProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash })).toThrow(/active transition checkpoint is missing or drifted/);
        expect(readFileSync(stateFile)).toEqual(stateBeforeApply);
        expect(existsSync(historyFile) ? readFileSync(historyFile) : null).toEqual(historyBeforeApply);
        assertNoTransitionPublication(fixture);
      } finally {
        rmSync(fixture.deck, { recursive: true, force: true });
      }
    }
  });

  it("rejects a retired transition receipt field without aliasing it into the current transaction", () => {
    const fixture = transitionFixture();
    try {
      prepareProductionModeTransition(fixture.runDir, { targetMode: "html-only" });
      authorHtmlCandidate(fixture.runDir);
      const preview = previewProductionModeTransition(fixture.runDir);
      confirmPreparedProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash });
      const stateFile = join(fixture.deck, "_state", "state.yaml");
      const historical = parse(readFileSync(stateFile, "utf8"));
      historical.nodes["apply-production-mode-transition"].migration_receipt = "retired-receipt";
      writeFileSync(stateFile, stringify(historical));
      const stateBefore = readFileSync(stateFile);
      const historyFile = join(fixture.deck, "_state", "history.jsonl");
      const historyBefore = existsSync(historyFile) ? readFileSync(historyFile) : null;

      expect(() => applyProductionModeTransition(fixture.runDir, { planHash: preview.plan_hash })).toThrow(/active transition checkpoint is missing or drifted/);
      expect(readFileSync(stateFile)).toEqual(stateBefore);
      expect(existsSync(historyFile) ? readFileSync(historyFile) : null).toEqual(historyBefore);
      assertNoTransitionPublication(fixture);
    } finally {
      rmSync(fixture.deck, { recursive: true, force: true });
    }
  });
});
