import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import {
  STATE_SCHEMA_VERSION,
  STATE_DIR,
  STATE_FILE,
  createDefaultState,
  readState,
  writeState,
  healState,
  validateState,
  validateStateReadOnly,
  statePath,
  historyPath,
  inspectRunProductionMode,
  resolveRunProductionAdapter,
  transitionProductionMode,
  repairProductionModeMirror,
  projectModeCompletion,
  buildResumeCard,
  recordImage2DeliveryReview,
  recordImage2ProviderAuthorization,
  inspectImage2ProviderAuthorization,
  image2AuthorizationProfileFingerprint,
  registerProductionModeFromSource,
  recordHtmlMigrationConfirmation,
  confirmProductionModeTransition,
  restoreProductionModeTransitionSource,
  recordProductionModeTransitionRecoveryConfirmation,
  verifyProductionModeTransitionRecoveryConfirmation,
  completeProductionModeTransitionHandoff,
  resumePlaybook,
  checkEntry,
  checkExit,
  getEligibleNextNodes,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { buildPlaybookIndex } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs";
import { notesReceiptPath } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs";
import { createVersion } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function tmpDeck(tag) {
  return mkdtempSync(join(tmpdir(), `deck_pmode_${tag}_`));
}

function writeRawState(deckDir, stateObj) {
  mkdirSync(join(deckDir, STATE_DIR), { recursive: true });
  // Minimal raw YAML writer preserving key order/indent without the yaml dep.
  const lines = [];
  for (const [k, v] of Object.entries(stateObj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const [kk, vv] of Object.entries(v)) {
        if (vv && typeof vv === "object" && !Array.isArray(vv)) {
          lines.push(`  ${kk}:`);
          for (const [kkk, vvv] of Object.entries(vv)) lines.push(`    ${kkk}: ${typeof vvv === "string" ? vvv : JSON.stringify(vvv)}`);
        } else {
          lines.push(`  ${kk}: ${typeof vv === "string" ? vv : JSON.stringify(vv)}`);
        }
      }
    } else {
      lines.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
    }
  }
  writeFileSync(statePath(deckDir), `${lines.join("\n")}\n`, "utf8");
}

function v3State({ pipeline, executionId = "exec-test" } = {}) {
  return {
    schema_version: 3,
    pipeline,
    playbook: "create-deck",
    current_node: "instantiation",
    execution_id: executionId,
    execution_started_at: "2024-01-01T00:00:00.000Z",
    started_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    nodes: { instantiation: { status: "completed", execution_id: executionId } },
    gates: { content: "pending", visual: "pending", html_content: "pending", html_visual: "pending" },
    deck: { name: "t", type: "keynote", style: "x" },
    playbook_stack: [],
  };
}

function writeSource(deckDir, version, marker) {
  const runDir = join(deckDir, "3_versions", version);
  mkdirSync(runDir, { recursive: true });
  const frontmatter = marker === "html" ? "---\nproduction:\n  pipeline: html-first-v1\n---\n\n" : "";
  writeFileSync(join(runDir, "slide-specifications.md"), `${frontmatter}## Slide 01: \`HeroGo\`\n`, "utf8");
}

describe("schema v5 production-mode container (1.2)", () => {
  it("createDefaultState ships schema v5 with an empty production_mode map", () => {
    const s = createDefaultState();
    expect(STATE_SCHEMA_VERSION).toBe(5);
    expect(s.schema_version).toBe(5);
    expect(s.production_mode).toEqual({ by_version: {} });
    // state.pipeline remains as a compatibility projection.
    expect(typeof s.pipeline).toBe("string");
  });

  it("round-trips production_mode.by_version records through write/read", () => {
    const deck = tmpDeck("roundtrip");
    try {
      const s = createDefaultState();
      s.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
      s.production_mode.by_version["3_versions/v2"] = { mode: "html-then-image2" };
      writeState(deck, s);
      const readBack = readState(deck, { purpose: "execute" });
      expect(readBack.schema_version).toBe(5);
      expect(readBack.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-only" });
      expect(readBack.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "html-then-image2" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("validateState rejects noncanonical version keys and bad record shapes", () => {
    expect(validateState({ ...createDefaultState(), production_mode: { by_version: { "versions/v1": { mode: "html-only" } } } }).valid).toBe(false);
    expect(validateState({ ...createDefaultState(), production_mode: { by_version: { "3_versions/v1": { mode: "html-only", extra: 1 } } } }).valid).toBe(false);
    expect(validateState({ ...createDefaultState(), production_mode: { by_version: { "3_versions/v1": { mode: "html-first-v1" } } } }).valid).toBe(false);
    expect(validateState({ ...createDefaultState(), production_mode: { by_version: { "3_versions/v1": { mode: "html-only" } } } }).valid).toBe(true);
  });

  it("validateStateReadOnly accepts valid production_mode and reports drift on disk", () => {
    const deck = tmpDeck("readonly");
    try {
      const s = createDefaultState();
      s.production_mode.by_version["3_versions/v1"] = { mode: "html-only" };
      writeState(deck, s);
      const ok = validateStateReadOnly(deck, { runDir: join(deck, "3_versions", "v1") });
      expect(ok.valid).toBe(true);
      const bad = validateStateReadOnly(deck);
      expect(bad.valid).toBe(true);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("validateStateReadOnly flags a noncanonical production_mode record on disk without healing", () => {
    const deck = tmpDeck("readonly-bad");
    try {
      writeRawState(deck, {
        ...v3State({ pipeline: "html-first-v1" }),
        schema_version: 4,
        production_mode: { by_version: { "3_versions/v1": { mode: "html-first-v1" } } },
      });
      writeSource(deck, "v1", "html");
      const before = readFileSync(statePath(deck));
      const result = validateStateReadOnly(deck, { runDir: join(deck, "3_versions", "v1") });
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => /production_mode/.test(i.path))).toBe(true);
      // Observation did not mutate state.
      expect(readFileSync(statePath(deck))).toEqual(before);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("read-only state access refuses a selected run that differs from active execution", () => {
    const deck = tmpDeck("readonly-run-mismatch");
    try {
      const state = createDefaultState();
      state.deck = { name: "t", type: "keynote", style: "x" };
      state.playbook = "create-deck";
      state.current_node = "instantiation";
      state.execution_id = "exec-readonly";
      state.execution_started_at = "2024-01-01T00:00:00.000Z";
      state.run_version = "v1";
      state.nodes.instantiation = { status: "in_progress", execution_id: state.execution_id, run_version: "v1" };
      writeState(deck, state);
      const result = readState(deck, { purpose: "observe", heal: false, runDir: join(deck, "3_versions", "v2") });
      expect(result).toMatchObject({ code: "execution_run_version_mismatch", requested_run_version: "v2", active_run_version: "v1" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("read-only validation refuses a selected run that differs from active execution", () => {
    const deck = tmpDeck("validate-readonly-run-mismatch");
    try {
      const state = createDefaultState();
      state.playbook = "create-deck";
      state.current_node = "instantiation";
      state.execution_id = "exec-validation";
      state.execution_started_at = "2024-01-01T00:00:00.000Z";
      state.run_version = "v1";
      state.nodes.instantiation = { status: "in_progress", execution_id: state.execution_id, run_version: "v1" };
      writeState(deck, state);
      const result = validateStateReadOnly(deck, { runDir: join(deck, "3_versions", "v2") });
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(expect.objectContaining({ path: "run_version", kind: "execution" }));
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("pre-v5 production-mode migration (1.3)", () => {
  it("migrates an html-first version to html-only", () => {
    const deck = tmpDeck("mig-html");
    try {
      writeRawState(deck, v3State({ pipeline: "html-first-v1" }));
      writeSource(deck, "v1", "html");
      const state = readState(deck, { purpose: "execute" });
      expect(state.schema_version).toBe(5);
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("migrates a markerless version to image2-only without writing a marker", () => {
    const deck = tmpDeck("mig-legacy");
    try {
      writeRawState(deck, v3State({ pipeline: "legacy-image2-first" }));
      writeSource(deck, "v1", "legacy");
      const state = readState(deck, { purpose: "execute" });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-only" });
      // Migration never invents a legacy-image2-first frontmatter marker.
      const src = readFileSync(join(deck, "3_versions", "v1", "slide-specifications.md"), "utf8");
      expect(src).not.toContain("legacy-image2-first");
      expect(src).not.toMatch(/^production:/m);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("preserves ambiguous multi-version v4 execution bytes for explicit replacement", () => {
    const deck = tmpDeck("mig-mixed");
    try {
      // A migration workspace allows conflicting markers across versions.
      writeRawState(deck, { ...v3State({ pipeline: "legacy-image2-first" }), playbook: "migrate-import" });
      writeSource(deck, "v1", "legacy");
      writeSource(deck, "v2", "html");
      const before = readFileSync(statePath(deck));
      const state = readState(deck, { purpose: "execute" });
      expect(state).toMatchObject({ replacement_required: true, code: "replacement_required" });
      expect(readFileSync(statePath(deck))).toEqual(before);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("binds an exact legacy apply source despite multiple visible versions", () => {
    const deck = tmpDeck("mig-legacy-apply");
    try {
      writeRawState(deck, {
        ...v3State({ pipeline: "legacy-image2-first" }),
        schema_version: 4,
        playbook: "migrate-import",
        current_node: "apply-html-migration",
        nodes: {
          "apply-html-migration": {
            status: "in_progress",
            execution_id: "exec-test",
            migration_source_version: "v1",
            migration_plan_hash: "a".repeat(64),
            old_side_mode: "verified-current",
          },
        },
      });
      writeSource(deck, "v1", "legacy");
      writeSource(deck, "v2", "html");
      const state = readState(deck, { purpose: "execute" });
      expect(state.run_version).toBe("v1");
      expect(state.nodes["apply-html-migration"]).toMatchObject({ execution_id: "exec-test", run_version: "v1", migration_source_version: "v1" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("binds a multi-version legacy confirmation only through its exact closed write", () => {
    const deck = tmpDeck("mig-legacy-confirmation");
    try {
      const planHash = "b".repeat(64);
      writeRawState(deck, {
        ...v3State({ pipeline: "legacy-image2-first" }),
        schema_version: 4,
        playbook: "migrate-import",
        current_node: "confirm-html-migration",
        nodes: {
          "preview-html-migration": {
            status: "completed",
            execution_id: "exec-test",
            migration_plan_hash: planHash,
            old_side_mode: "verified-current",
          },
          "confirm-html-migration": { status: "in_progress", execution_id: "exec-test" },
        },
      });
      writeSource(deck, "v1", "legacy");
      writeSource(deck, "v2", "html");
      const before = readFileSync(statePath(deck));
      expect(readState(deck, { purpose: "observe", runDir: join(deck, "3_versions", "v1") })).toMatchObject({ replacement_required: true });
      expect(readFileSync(statePath(deck))).toEqual(before);

      const result = recordHtmlMigrationConfirmation(join(deck, "3_versions", "v1"), {
        planHash,
        oldSideMode: "verified-current",
        inspection: { source_version: "v1", target_version: "v2", plan_hash: planHash, old_side_mode: "verified-current" },
      });
      expect(result).toMatchObject({ status: "confirmed", source_version: "v1", current_node: "apply-html-migration" });
      const state = readState(deck, { purpose: "execute", heal: false, runDir: join(deck, "3_versions", "v1") });
      expect(state.schema_version).toBe(5);
      expect(state.run_version).toBe("v1");
      expect(state.nodes["preview-html-migration"].run_version).toBe("v1");
      expect(state.nodes["apply-html-migration"]).toMatchObject({ execution_id: "exec-test", run_version: "v1", migration_plan_hash: planHash });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("is idempotent: a second read does not rewrite or change records", () => {
    const deck = tmpDeck("mig-idempotent");
    try {
      writeRawState(deck, v3State({ pipeline: "html-first-v1" }));
      writeSource(deck, "v1", "html");
      const first = readState(deck, { purpose: "execute" });
      expect(first.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
      const bytesAfterFirst = readFileSync(statePath(deck));
      const second = readState(deck, { purpose: "execute" });
      expect(second.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
      // Second read observes a now-v5 file without changing it.
      expect(readFileSync(statePath(deck))).toEqual(bytesAfterFirst);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("does not infer a mode from refinement/metadata/history/generated bytes", () => {
    const deck = tmpDeck("mig-purity");
    try {
      writeRawState(deck, v3State({ pipeline: "html-first-v1" }));
      writeSource(deck, "v1", "html");
      // Stray refinement + metadata + history that must NOT turn this into html-then-image2.
      mkdirSync(join(deck, STATE_DIR), { recursive: true });
      writeFileSync(join(deck, STATE_DIR, "history.jsonl"), JSON.stringify({ type: "image2-refinement" }) + "\n", "utf8");
      writeFileSync(join(deck, "project-metadata.yaml"), "production_mode: html-then-image2\n", "utf8");
      const gen = join(deck, "3_versions", "v1", "_generated");
      mkdirSync(join(gen, "prompts"), { recursive: true });
      writeFileSync(join(gen, "prompts", "x.txt"), "image2", "utf8");
      const state = readState(deck, { purpose: "execute" });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("post-v4 record loss fails closed: a missing mode is NOT re-inferred", () => {
    const deck = tmpDeck("mig-postv4");
    try {
      // A v4 state whose only version mode was deleted/corrupted away.
      writeRawState(deck, { ...v3State({ pipeline: "html-first-v1" }), schema_version: 4 });
      writeSource(deck, "v1", "html");
      const state = readState(deck, { purpose: "execute" });
      expect(state.production_mode.by_version["3_versions/v1"]).toBeUndefined();
      expect(state.durable_state_present).toBe(true);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("observation of a markerless deck with no state file stays non-writing", () => {
    const deck = tmpDeck("mig-observe");
    try {
      writeSource(deck, "v1", "legacy");
      expect(existsSync(statePath(deck))).toBe(false);
      const projection = readState(deck, { purpose: "observe" });
      expect(projection.durable_state_present).toBe(false);
      expect(existsSync(statePath(deck))).toBe(false);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("healState preserves existing valid modes and the state.pipeline projection", () => {
    const deck = tmpDeck("mig-preserve");
    try {
      writeRawState(deck, {
        ...v3State({ pipeline: "html-first-v1" }),
        production_mode: { by_version: { "3_versions/v1": { mode: "html-then-image2" } } },
      });
      writeSource(deck, "v1", "html");
      const state = readState(deck, { purpose: "execute" });
      // Existing valid record is not rewritten by marker inference.
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-then-image2" });
      // state.pipeline remains as the actual-pipeline compatibility projection.
      expect(state.pipeline).toBe("html-first-v1");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("state-owned cross-pipeline transition checkpoint (1.2)", () => {
  const intake = Object.freeze({
    topic: "Target topic",
    audience: "Target audience",
    duration: "20 minutes",
    language: "en",
    takeaway: "Target takeaway",
    content_constraints: "No copied source prose",
    visual_dna: "Target controls",
    success_criteria: "Target criteria",
  });

  function transitionState(deck) {
    const state = createDefaultState();
    state.playbook = "create-deck";
    state.current_node = "author-whole-page-content";
    state.execution_id = "exec-source";
    state.execution_started_at = "2024-01-01T00:00:00.000Z";
    state.run_version = "v1";
    state.pipeline = "legacy-image2-first";
    state.nodes["author-whole-page-content"] = { status: "in_progress", execution_id: "exec-source", run_version: "v1", evidence: { source: { met: true, kind: "user", at: "2024-01-01T00:00:00.000Z" } } };
    state.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
    writeSource(deck, "v1", "legacy");
    writeState(deck, state);
    return state;
  }

  it("captures one non-resumable source suspension only after exact confirmation", () => {
    const deck = tmpDeck("transition-confirm");
    try {
      transitionState(deck);
      const planHash = "c".repeat(64);
      const candidateReceiptSha256 = "d".repeat(64);
      const targetIntakeSha256 = sha(JSON.stringify(Object.fromEntries(Object.keys(intake).sort().map((key) => [key, intake[key]]))));
      const confirmed = confirmProductionModeTransition(deck, {
        sourceRunVersion: "v1",
        targetRunVersion: "v2",
        targetMode: "html-only",
        planHash,
        candidateReceiptSha256,
        targetIntake: intake,
        targetIntakeSha256,
      });
      expect(confirmed).toMatchObject({ status: "confirmed", source_version: "v1", target_version: "v2", target_mode: "html-only" });
      const state = readState(deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state.playbook).toBe("migrate-import");
      expect(state.current_node).toBe("apply-production-mode-transition");
      expect(state.nodes["apply-production-mode-transition"]).toMatchObject({
        status: "in_progress",
        transition_plan_hash: planHash,
        transition_source_execution_id: "exec-source",
        transition_target_version: "v2",
      });
      expect(state.nodes["apply-production-mode-transition"].migration_plan_hash).toBeUndefined();
      expect(state.playbook_stack).toHaveLength(1);
      expect(state.playbook_stack[0]).toMatchObject({ disposition: "transition-suspended", source_run_version: "v1", target_run_version: "v2" });
      expect(() => resumePlaybook(state, { runVersion: "v1" })).toThrow(/non-resumable/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("restores the exact source execution only while the anticipated target is absent", () => {
    const deck = tmpDeck("transition-restore");
    try {
      transitionState(deck);
      const planHash = "e".repeat(64);
      confirmProductionModeTransition(deck, {
        sourceRunVersion: "v1", targetRunVersion: "v2", targetMode: "html-only", planHash,
        candidateReceiptSha256: "f".repeat(64), targetIntake: intake,
        targetIntakeSha256: sha(JSON.stringify(Object.fromEntries(Object.keys(intake).sort().map((key) => [key, intake[key]])))),
      });
      const restored = restoreProductionModeTransitionSource(deck, { sourceRunVersion: "v1", planHash });
      expect(restored.status).toBe("source_restored");
      const state = readState(deck, { purpose: "observe", heal: false, runVersion: "v1" });
      expect(state).toMatchObject({ playbook: "create-deck", current_node: "author-whole-page-content", execution_id: "exec-source", run_version: "v1" });
      expect(state.nodes["author-whole-page-content"].evidence.source).toMatchObject({ kind: "user", met: true });
      expect(state.production_mode.by_version).toEqual({ "3_versions/v1": { mode: "image2-only" } });
      expect(state.nodes["apply-production-mode-transition"]).toBeUndefined();
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("binds uncertain-owner confirmation to journal bytes without persisting its token", () => {
    const deck = tmpDeck("transition-uncertain-confirmation");
    try {
      transitionState(deck);
      const planHash = "1".repeat(64);
      const ownerToken = "2".repeat(64);
      confirmProductionModeTransition(deck, {
        sourceRunVersion: "v1", targetRunVersion: "v2", targetMode: "html-only", planHash,
        candidateReceiptSha256: "3".repeat(64), targetIntake: intake,
        targetIntakeSha256: sha(JSON.stringify(Object.fromEntries(Object.keys(intake).sort().map((key) => [key, intake[key]])))),
      });
      const journalPath = join(deck, "3_versions", "v1", "_scratch", "production-mode-transition", "apply-journal.json");
      mkdirSync(dirname(journalPath), { recursive: true });
      writeFileSync(journalPath, JSON.stringify({
        schema: "pptmaker-production-mode-transition-apply-journal-v1",
        owner_token: ownerToken,
        owner_host: "other-host",
        owner_pid: 123,
        claimed_at_epoch_ms: Date.now() - 300001,
        plan_hash: planHash,
        source_execution_id: "exec-source",
        source_version: "v1",
        target_version: "v2",
        target_mode: "html-only",
        target_pipeline: "html-first-v1",
      }));
      const recorded = recordProductionModeTransitionRecoveryConfirmation(deck, { sourceRunVersion: "v1", planHash, ownerToken });
      expect(recorded).toMatchObject({ status: "recorded", source_version: "v1", target_version: "v2", plan_hash: planHash });
      expect(JSON.stringify(readState(deck, { purpose: "observe", heal: false, runVersion: "v1" }))).not.toContain(ownerToken);
      expect(verifyProductionModeTransitionRecoveryConfirmation(deck, { sourceRunVersion: "v1", planHash, ownerToken })).toMatchObject({ ok: true });
      writeFileSync(journalPath, `${readFileSync(journalPath, "utf8")} `);
      expect(verifyProductionModeTransitionRecoveryConfirmation(deck, { sourceRunVersion: "v1", planHash, ownerToken })).toMatchObject({ ok: false, code: "TRANSITION_RECOVERY_CONFIRMATION_REQUIRED" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("registers a receipt-bound target baseline without copying source controller authority", () => {
    const deck = tmpDeck("transition-handoff");
    try {
      transitionState(deck);
      const planHash = "4".repeat(64);
      const candidateReceiptSha256 = "5".repeat(64);
      const targetIntakeSha256 = sha(JSON.stringify(Object.fromEntries(Object.keys(intake).sort().map((key) => [key, intake[key]]))));
      confirmProductionModeTransition(deck, { sourceRunVersion: "v1", targetRunVersion: "v2", targetMode: "html-only", planHash, candidateReceiptSha256, targetIntake: intake, targetIntakeSha256 });
      writeSource(deck, "v2", "html");
      writeFileSync(join(deck, "deck-guide.md"), "# guide\n");
      mkdirSync(join(deck, "3_versions", "v2", "overrides", "visual-style"), { recursive: true });
      writeFileSync(join(deck, "3_versions", "v2", "overrides", "visual-style", "color_palette.json"), "{}");
      const fingerprint = "6".repeat(64);
      const receiptPath = join(deck, "3_versions", "v2", "_generated", "qa", "production_mode_transition.json");
      mkdirSync(dirname(receiptPath), { recursive: true });
      writeFileSync(receiptPath, JSON.stringify({ schema: "pptmaker-production-mode-transition-success-v1", plan_hash: planHash, source_execution_id: "exec-source", source_version: "v1", target_version: "v2", target_mode: "html-only", target_pipeline: "html-first-v1", candidate_receipt_sha256: candidateReceiptSha256, target_intake_sha256: targetIntakeSha256, source_control_fingerprint: fingerprint }));
      const result = completeProductionModeTransitionHandoff(deck, { sourceRunVersion: "v1", planHash });
      expect(result).toMatchObject({ status: "handoff-complete", target_version: "v2", current_node: "preview-content" });
      const state = readState(deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state).toMatchObject({ playbook: "create-deck", run_version: "v2", current_node: "preview-content" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "html-only" });
      expect(state.nodes["checkpoint-intake"].decision).toMatchObject({ value: "proceed", kind: "user" });
      expect(state.nodes["author-structured-content"].transition_baseline.source_control_fingerprint).toBe(fingerprint);
      expect(state.nodes["author-whole-page-content"]).toBeUndefined();
      expect(state.nodes["html-delivery-review"]).toBeUndefined();
      expect(state.playbook_stack).toEqual([]);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

function seedV4Deck(tag, { mode, marker, pipeline, version = "v1", refinement = false }) {
  const deck = tmpDeck(tag);
  const state = createDefaultState();
  state.pipeline = pipeline;
  state.production_mode.by_version[`3_versions/${version}`] = { mode };
  if (refinement) {
    state.nodes["image2-refinement"] = { by_version: { [`3_versions/${version}`]: { schema: "pptmaker-image2-refinement-state-v2", run_version: version, plan: null, authorization: null, attempts: {}, reviews: {}, prerequisite_waiver: null } } };
  }
  writeState(deck, state);
  writeSource(deck, version, marker);
  return deck;
}

describe("state-owned exact-run inspection (1.4)", () => {
  it("resolves a consistent html-only run and reports its policy", () => {
    const deck = seedV4Deck("insp-consistent", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const before = readFileSync(statePath(deck));
      const r = inspectRunProductionMode(deck, { runVersion: "v1" });
      expect(r.ok).toBe(true);
      expect(r.mode).toBe("html-only");
      expect(r.policy.pipeline).toBe("html-first-v1");
      expect(r.source_branch).toBe("html-first-v1");
      expect(r.consistent).toBe(true);
      // Pure observation: no mutation.
      expect(readFileSync(statePath(deck))).toEqual(before);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("short-circuits with transition_required when mode pipeline differs from source marker", () => {
    const deck = seedV4Deck("insp-drift", { mode: "image2-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const r = inspectRunProductionMode(deck, { runVersion: "v1" });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("transition_required");
      expect(r.mode).toBe("image2-only");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("fails closed with MODE_MISSING when the exact version has no mode (no fallback)", () => {
    const deck = tmpDeck("insp-missing");
    try {
      const state = createDefaultState();
      state.pipeline = "html-first-v1";
      writeState(deck, state);
      writeSource(deck, "v1", "html");
      const r = inspectRunProductionMode(deck, { runVersion: "v1" });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("MODE_MISSING");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("rejects a noncanonical version without consulting artifacts", () => {
    const deck = seedV4Deck("insp-badver", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const r = inspectRunProductionMode(deck, { runDir: "deck_root" });
      expect(r.code).toBe("RUN_VERSION_INVALID");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("reports metadata-mirror drift while keeping state authoritative", () => {
    const deck = seedV4Deck("insp-mirror", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      writeFileSync(join(deck, "project-metadata.yaml"), "production_mode: image2-only\nproduction_mode_run_version: v1\n", "utf8");
      const before = readFileSync(statePath(deck));
      const r = inspectRunProductionMode(deck, { runVersion: "v1" });
      expect(r.ok).toBe(true);
      expect(r.mode).toBe("html-only");
      expect(r.metadata_mirror.drift).toMatchObject({ kind: "mode-mismatch", expected: "html-only", mirrored: "image2-only" });
      // Metadata cannot overwrite the state record; nothing mutated.
      expect(readFileSync(statePath(deck))).toEqual(before);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("run-scoped adapter routing (3.1)", () => {
  it("routes a durable exact version from authoritative mode and verified source", () => {
    const deck = seedV4Deck("adapter-durable", { mode: "html-then-image2", marker: "html", pipeline: "html-first-v1" });
    try {
      expect(resolveRunProductionAdapter(deck, { runVersion: "v1" })).toMatchObject({
        ok: true,
        run_version: "v1",
        mode: "html-then-image2",
        adapter: "html",
        compatibility: null,
      });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("keeps only state-absent markerless decks on the non-writing compatibility adapter", () => {
    const deck = tmpDeck("adapter-historical");
    try {
      writeSource(deck, "v1", "legacy");
      expect(resolveRunProductionAdapter(deck, { runVersion: "v1" })).toMatchObject({
        ok: true,
        mode: null,
        adapter: "whole-page-image2",
        compatibility: "historical-markerless",
      });
      expect(existsSync(statePath(deck))).toBe(false);

      const state = createDefaultState();
      state.production_mode.by_version["3_versions/v1"] = { mode: "html-only" };
      writeState(deck, state);
      expect(resolveRunProductionAdapter(deck, { runVersion: "v1" })).toMatchObject({
        ok: false,
        code: "transition_required",
      });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("same-pipeline production-mode transition (1.5)", () => {
  function stateSha(deck) { return sha(readFileSync(statePath(deck))); }
  function historyEvents(deck) {
    const p = historyPath(deck);
    return existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  }

  it("atomically transitions html-only -> html-then-image2 under CAS and audits it", () => {
    const deck = seedV4Deck("tr-html2", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const before = stateSha(deck);
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: before });
      expect(r).toMatchObject({ ok: true, status: "transitioned", from_mode: "html-only", to_mode: "html-then-image2" });
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-then-image2" });
      expect(historyEvents(deck).some((e) => e.type === "production_mode_transition" && e.from_mode === "html-only" && e.to_mode === "html-then-image2")).toBe(true);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("preserves all refinement bytes when disabling required refinement", () => {
    const deck = seedV4Deck("tr-disable", { mode: "html-then-image2", marker: "html", pipeline: "html-first-v1", refinement: true });
    try {
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-only", expectedStateSha: stateSha(deck) });
      expect(r.ok).toBe(true);
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
      // Refinement record is fully retained.
      expect(state.nodes["image2-refinement"].by_version["3_versions/v1"]).toMatchObject({ schema: "pptmaker-image2-refinement-state-v2" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("rejects cross-pipeline transition without mutating state, source, or audit", () => {
    const deck = seedV4Deck("tr-cross", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const beforeState = readFileSync(statePath(deck));
      const beforeHistory = existsSync(historyPath(deck)) ? readFileSync(historyPath(deck)) : Buffer.alloc(0);
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "image2-only", expectedStateSha: stateSha(deck) });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("transition_required");
      expect(readFileSync(statePath(deck))).toEqual(beforeState);
      const afterHistory = existsSync(historyPath(deck)) ? readFileSync(historyPath(deck)) : Buffer.alloc(0);
      expect(afterHistory).toEqual(beforeHistory);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("treats same-mode as an idempotent no-op without writing or auditing", () => {
    const deck = seedV4Deck("tr-noop", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const before = stateSha(deck);
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-only", expectedStateSha: before });
      expect(r).toMatchObject({ ok: true, status: "no-op" });
      expect(stateSha(deck)).toBe(before);
      expect(historyEvents(deck).some((e) => e.type === "production_mode_transition")).toBe(false);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("fails closed under a stale CAS precondition", () => {
    const deck = seedV4Deck("tr-stale", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      expect(() => transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: "0".repeat(64) })).toThrow(/CONFLICT/);
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-only" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("moves an inactive create-deck pointer through declared CAS-bound handoffs and preserves branch records", () => {
    const deck = seedV4Deck("tr-handoff", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const state = readState(deck, { purpose: "execute", heal: false });
      state.playbook = "create-deck";
      state.execution_id = "exec-handoff";
      state.execution_started_at = "2024-01-01T00:00:00.000Z";
      state.run_version = "v1";
      state.current_node = "readiness";
      state.nodes.readiness = { status: "in_progress", execution_id: state.execution_id, run_version: "v1", evidence: { delivery: { met: true, kind: "cli", at: "2024-01-01T00:00:00.000Z" } } };
      state.nodes["handoff-to-image2-refinement"] = { status: "pending", execution_id: state.execution_id, run_version: "v1" };
      writeState(deck, state);

      const enabled = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: stateSha(deck) });
      expect(enabled).toMatchObject({ ok: true, handoff: { from_node: "readiness", to_node: "handoff-to-image2-refinement" } });
      let transitioned = readState(deck, { purpose: "execute", heal: false });
      expect(transitioned.current_node).toBe("handoff-to-image2-refinement");
      expect(transitioned.nodes.readiness).toMatchObject({ status: "in_progress", execution_id: "exec-handoff" });

      const disabled = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-only", expectedStateSha: stateSha(deck) });
      expect(disabled).toMatchObject({ ok: true, handoff: { from_node: "handoff-to-image2-refinement", to_node: "readiness" } });
      transitioned = readState(deck, { purpose: "execute", heal: false });
      expect(transitioned.current_node).toBe("readiness");
      expect(transitioned.nodes["handoff-to-image2-refinement"]).toMatchObject({ status: "pending", execution_id: "exec-handoff" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("returns MODE_MISSING when no current mode exists", () => {
    const deck = tmpDeck("tr-missing");
    try {
      const state = createDefaultState();
      state.pipeline = "html-first-v1";
      writeState(deck, state);
      writeSource(deck, "v1", "html");
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2" });
      expect(r).toMatchObject({ ok: false, code: "MODE_MISSING" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("mode-filtered controller execution (4.2)", () => {
  const playbookDir = "PPTMAKER_FRAMEWORK/playbook";

  it("excludes inactive nodes from entry, exit, and successor evaluation without marking them skipped", () => {
    const state = createDefaultState();
    state.playbook = "create-deck";
    state.execution_id = "exec-filter";
    state.run_version = "v1";
    state.production_mode.by_version["3_versions/v1"] = { mode: "html-only" };
    state.nodes["author-whole-page-content"] = { status: "pending", execution_id: state.execution_id, run_version: "v1" };

    const entry = checkEntry("author-whole-page-content", playbookDir, state, { runVersion: "v1" });
    const exit = checkExit("author-whole-page-content", playbookDir, state, { runVersion: "v1" });
    expect(entry.pass).toBe(false);
    expect(exit.pass).toBe(false);
    expect(entry.unknown.join(" ")).toMatch(/inactive/);
    expect(exit.unknown.join(" ")).toMatch(/inactive/);

    const index = buildPlaybookIndex(playbookDir);
    const eligible = getEligibleNextNodes(index, "create-deck", state, { runVersion: "v1" });
    expect(eligible).not.toContain("author-whole-page-content");
    expect(state.nodes["author-whole-page-content"].status).toBe("pending");
  });

  it("fails closed before projecting another run's active controller progress", () => {
    const state = createDefaultState();
    state.playbook = "create-deck";
    state.current_node = "checkpoint-intake";
    state.execution_id = "exec-v2";
    state.execution_started_at = "2024-01-01T00:00:00.000Z";
    state.run_version = "v2";
    state.nodes["checkpoint-intake"] = { status: "in_progress", execution_id: "exec-v2", run_version: "v2", waiting_for: "user:confirm" };
    const index = buildPlaybookIndex(playbookDir);
    const ctx = { runVersion: "v1" };
    expect(checkEntry("checkpoint-intake", playbookDir, state, ctx)).toMatchObject({ pass: false, unknown: ["execution_run_version_mismatch"] });
    expect(getEligibleNextNodes(index, "create-deck", state, ctx)).toEqual([]);
    expect(buildResumeCard(state, null, { index, ctx })).toMatchObject({
      code: "execution_run_version_mismatch",
      current_node: "",
      node_status: "",
      eligible_candidates: [],
    });
  });

  it("returns the final HTML handoff when a completed html-only branch changes mode", () => {
    const deck = seedV4Deck("tr-final-handoff", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      const state = readState(deck, { purpose: "execute", heal: false });
      state.playbook = "create-deck";
      state.execution_id = "exec-final";
      state.execution_started_at = "2024-01-01T00:00:00.000Z";
      state.current_node = "final";
      state.run_version = "v1";
      state.nodes.final = { status: "completed", execution_id: state.execution_id, run_version: "v1" };
      state.nodes.readiness = { status: "completed", execution_id: state.execution_id, run_version: "v1" };
      writeState(deck, state);
      const result = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(result).toMatchObject({ ok: true, handoff: { from_node: "final", to_node: "handoff-to-image2-refinement" } });
      const after = readState(deck, { purpose: "execute", heal: false });
      expect(after.nodes.final).toMatchObject({ status: "completed", execution_id: "exec-final" });
      expect(after.current_node).toBe("handoff-to-image2-refinement");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

describe("metadata mirror writer/repair (1.7)", () => {
  function writeMetadata(deck, extra = "") {
    writeFileSync(join(deck, "project-metadata.yaml"), `topic: t\naudience: a\n${extra}`, "utf8");
  }
  function readMetadata(deck) {
    return readFileSync(join(deck, "project-metadata.yaml"), "utf8");
  }

  it("rewrites the mirror from authoritative state and clears drift", () => {
    const deck = seedV4Deck("mirror-repair", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      writeMetadata(deck, "production_mode: image2-only\nproduction_mode_run_version: v1\n");
      expect(inspectRunProductionMode(deck, { runVersion: "v1" }).metadata_mirror.drift).not.toBeNull();
      const r = repairProductionModeMirror(deck, { runVersion: "v1" });
      expect(r).toMatchObject({ ok: true, mirrored_mode: "html-only", mirrored_run_version: "v1" });
      expect(inspectRunProductionMode(deck, { runVersion: "v1" }).metadata_mirror.drift).toBeNull();
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("preserves other metadata fields and comments", () => {
    const deck = seedV4Deck("mirror-preserve", { mode: "image2-only", marker: "legacy", pipeline: "legacy-image2-first" });
    try {
      writeMetadata(deck, "# HTML fields below are status mirrors only\nhtml_content_gate: pending\n");
      repairProductionModeMirror(deck, { runVersion: "v1" });
      const md = readMetadata(deck);
      expect(md).toContain("topic: t");
      expect(md).toContain("audience: a");
      expect(md).toContain("# HTML fields below are status mirrors only");
      expect(md).toContain("html_content_gate: pending");
      expect(md).toContain("production_mode: image2-only");
      expect(md).toContain("production_mode_run_version: v1");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("returns MODE_MISSING when state has no authoritative mode", () => {
    const deck = tmpDeck("mirror-missing");
    try {
      const state = createDefaultState();
      state.pipeline = "html-first-v1";
      writeState(deck, state);
      writeMetadata(deck);
      const r = repairProductionModeMirror(deck, { runVersion: "v1" });
      expect(r).toMatchObject({ ok: false, code: "MODE_MISSING" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("a transition best-effort publishes the mirror; state stays authoritative", () => {
    const deck = seedV4Deck("mirror-transition", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      writeMetadata(deck, "production_mode: html-only\nproduction_mode_run_version: v1\n");
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(r.mirror).toMatchObject({ ok: true, mirrored_mode: "html-then-image2" });
      expect(inspectRunProductionMode(deck, { runVersion: "v1" }).metadata_mirror.drift).toBeNull();
      expect(readMetadata(deck)).toContain("production_mode: html-then-image2");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("a transition whose mirror is absent leaves state authoritative and reports drift", () => {
    const deck = seedV4Deck("mirror-absent", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      // No project-metadata.yaml present.
      const r = transitionProductionMode(deck, { runVersion: "v1", toMode: "html-then-image2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(r.ok).toBe(true);
      expect(r.mirror.ok).toBe(false);
      // State is authoritative regardless.
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-then-image2" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

function inMemoryState({ mode, deliveryDecision, refinement = null, image2Decision }) {
  const state = createDefaultState();
  state.production_mode.by_version["3_versions/v1"] = { mode };
  if (deliveryDecision !== undefined) {
    state.nodes["html-delivery-review"] = { by_version: { "3_versions/v1": { decision: deliveryDecision } } };
  }
  if (refinement === "complete") {
    state.nodes["image2-refinement"] = { by_version: { "3_versions/v1": { schema: "pptmaker-image2-refinement-state-v2", run_version: "v1", plan: { plan_hash: "x" }, authorization: { authorization_id: "a", plan_hash: "x", used: true }, attempts: {}, reviews: {}, prerequisite_waiver: null } } };
  } else if (refinement === "planned") {
    state.nodes["image2-refinement"] = { by_version: { "3_versions/v1": { schema: "pptmaker-image2-refinement-state-v2", run_version: "v1", plan: null, authorization: null, attempts: {}, reviews: {}, prerequisite_waiver: null } } };
  }
  if (image2Decision !== undefined) {
    state.image2_delivery_review = { by_version: { "3_versions/v1": { decision: image2Decision } } };
  }
  return state;
}

describe("mode-aware completion projection (1.6)", () => {
  it("fails closed with MODE_MISSING when no authoritative mode exists", () => {
    const state = createDefaultState();
    const r = projectModeCompletion(state, { runVersion: "v1" });
    expect(r).toMatchObject({ ok: false, code: "MODE_MISSING" });
    expect(r.next_action).toBe("register_or_migrate_production_mode");
  });

  it("html-only is complete with a proceeding delivery review and no refinement debt", () => {
    expect(projectModeCompletion(inMemoryState({ mode: "html-only", deliveryDecision: "proceed" }), { runVersion: "v1" }))
      .toMatchObject({ ok: true, mode: "html-only", complete: true, missing: [] });
  });

  it("html-only ignores retained refinement as completion debt", () => {
    const r = projectModeCompletion(inMemoryState({ mode: "html-only", deliveryDecision: "proceed", refinement: "planned" }), { runVersion: "v1" });
    expect(r.complete).toBe(true);
  });

  it("html-only is incomplete when delivery review is absent", () => {
    const r = projectModeCompletion(inMemoryState({ mode: "html-only" }), { runVersion: "v1" });
    expect(r.complete).toBe(false);
    expect(r.missing).toContainEqual({ owner: "html-delivery-review", action: "complete_html_delivery_review" });
  });

  it("html-then-image2 is incomplete until the required refinement lifecycle is complete", () => {
    const onlyDelivery = projectModeCompletion(inMemoryState({ mode: "html-then-image2", deliveryDecision: "proceed" }), { runVersion: "v1" });
    expect(onlyDelivery.complete).toBe(false);
    expect(onlyDelivery.missing.some((m) => m.owner === "image2-refinement")).toBe(true);
    const complete = projectModeCompletion(inMemoryState({ mode: "html-then-image2", deliveryDecision: "proceed", refinement: "complete" }), { runVersion: "v1" });
    expect(complete.complete).toBe(true);
  });

  it("image2-only is complete only with the evidence-bound image2 final review", () => {
    expect(projectModeCompletion(inMemoryState({ mode: "image2-only" }), { runVersion: "v1" }).complete).toBe(false);
    expect(projectModeCompletion(inMemoryState({ mode: "image2-only", image2Decision: "proceed" }), { runVersion: "v1" }).complete).toBe(true);
  });

  it("resume-card exposes the resolvable mode and derived policy", () => {
    const state = inMemoryState({ mode: "html-then-image2" });
    const card = buildResumeCard(state, null, { ctx: { runVersion: "v1" } });
    expect(card.production_mode).toMatchObject({ resolvable: true, mode: "html-then-image2" });
    expect(card.production_mode.policy.pipeline).toBe("html-first-v1");
  });

  it("resume-card reports MODE_MISSING when the version has no mode", () => {
    const card = buildResumeCard(createDefaultState(), null, { ctx: { runVersion: "v1" } });
    expect(card.production_mode).toMatchObject({ resolvable: false, code: "MODE_MISSING" });
  });
});

function seedImage2Deck(tag, { withArtifacts = true } = {}) {
  const deck = tmpDeck(tag);
  const state = createDefaultState();
  state.pipeline = "legacy-image2-first";
  state.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
  state.playbook = "create-deck";
  state.execution_id = "exec-img";
  state.run_version = "v1";
  state.execution_started_at = "2024-01-01T00:00:00.000Z";
  state.current_node = "checkpoint-image2-final-review";
  state.nodes["checkpoint-image2-final-review"] = { status: "in_progress", execution_id: state.execution_id, run_version: "v1" };
  state.nodes["header-review"] = { by_version: { "3_versions/v1": { schema: "pptmaker-header-review-v1", run_version: "v1", snapshots: {} } } };
  writeState(deck, state);
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "slide-specifications.md"), "## Slide 01: `HeroGo`\n", "utf8");
  if (withArtifacts) {
    const gen = join(runDir, "_generated");
    mkdirSync(join(gen, "preview"), { recursive: true });
    mkdirSync(join(gen, "ppt"), { recursive: true });
    mkdirSync(dirname(notesReceiptPath(runDir)), { recursive: true });
    writeFileSync(join(gen, "preview", "contact_sheet.jpg"), "jpg-bytes", "utf8");
    writeFileSync(join(gen, "ppt", "deck.pptx"), "pptx-bytes", "utf8");
    writeFileSync(notesReceiptPath(runDir), "receipt-bytes", "utf8");
  }
  return deck;
}

describe("first-class Image2 delivery review + provider authorization (1.9)", () => {
  function stateSha(deck) { return sha(readFileSync(statePath(deck))); }

  it("records an evidence-bound image2 delivery proceed and completes the run", () => {
    const deck = seedImage2Deck("img2-proceed");
    try {
      const r = recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) });
      expect(r.ok).toBe(true);
      expect(r.record.decision).toBe("proceed");
      expect(r.record.contact_sheet_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(r.record.pptx_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(r.record.notes_receipt_sha256).toMatch(/^[0-9a-f]{64}$/);
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.nodes["checkpoint-image2-final-review"]).toMatchObject({
        status: "completed",
        execution_id: "exec-img",
        decision: { value: "proceed", kind: "user" },
        image2_delivery_review: { run_version: "v1" },
      });
      expect(projectModeCompletion(state, { runVersion: "v1" }).complete).toBe(true);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("proceed without current artifacts fails closed with no force path", () => {
    const deck = seedImage2Deck("img2-noart", { withArtifacts: false });
    try {
      expect(() => recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) })).toThrow(/current contact sheet|requires current/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("repair requires a bounded reason and leaves completion false", () => {
    const deck = seedImage2Deck("img2-repair");
    try {
      expect(() => recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "repair", expectedStateSha: stateSha(deck) })).toThrow(/reason/);
      const r = recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "repair", reason: "title bytes drifted", expectedStateSha: stateSha(deck) });
      expect(r.record.decision).toBe("repair");
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(projectModeCompletion(state, { runVersion: "v1" }).complete).toBe(false);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("rejects HTML modes (final review is first-class image2-only)", () => {
    const deck = seedV4Deck("img2-html", { mode: "html-only", marker: "html", pipeline: "html-first-v1" });
    try {
      expect(() => recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) })).toThrow(/image2-only/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("re-derives lineage on change (a new proceed captures the current sha)", () => {
    const deck = seedImage2Deck("img2-stale");
    try {
      const first = recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) });
      writeFileSync(join(deck, "3_versions", "v1", "_generated", "ppt", "deck.pptx"), "changed-pptx-bytes", "utf8");
      const state = readState(deck, { purpose: "execute", heal: false });
      state.current_node = "checkpoint-image2-final-review";
      state.nodes["checkpoint-image2-final-review"].status = "in_progress";
      delete state.nodes["checkpoint-image2-final-review"].completed;
      writeState(deck, state);
      const second = recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) });
      expect(second.record.pptx_sha256).not.toBe(first.record.pptx_sha256);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("refuses final-review publication outside the declared active final-review node", () => {
    const deck = seedImage2Deck("img2-wrong-node");
    try {
      const state = readState(deck, { purpose: "execute", heal: false });
      state.current_node = "produce-image2-deck";
      state.nodes["produce-image2-deck"] = { status: "in_progress", execution_id: state.execution_id, run_version: "v1" };
      writeState(deck, state);
      const before = readFileSync(statePath(deck));
      expect(() => recordImage2DeliveryReview(deck, { runVersion: "v1", decision: "proceed", expectedStateSha: stateSha(deck) })).toThrow(/final-review node/);
      expect(readFileSync(statePath(deck))).toEqual(before);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("records a scoped provider authorization and rejects an invalid scope", () => {
    const deck = seedImage2Deck("img2-auth");
    try {
      const r = recordImage2ProviderAuthorization(deck, {
        runVersion: "v1",
        operation: "pilot",
        scope: { slide_ids: ["BetaGo", "AlphaGo"] },
        profileFingerprint: "a".repeat(64),
        maxSubmissions: 2,
        expectedStateSha: stateSha(deck),
      });
      expect(r.ok).toBe(true);
      expect(r.record.scope.slide_ids).toEqual(["AlphaGo", "BetaGo"]);
      expect(() => recordImage2ProviderAuthorization(deck, {
        runVersion: "v1", operation: "pilot", scope: { slide_ids: [] }, profileFingerprint: "b".repeat(64), maxSubmissions: 1, expectedStateSha: stateSha(deck),
      })).toThrow(/scope/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("re-derives authorization scope, profile, execution, and maximum submits before transport", () => {
    const deck = seedImage2Deck("img2-auth-inspection");
    try {
      const profileFingerprint = image2AuthorizationProfileFingerprint({
        operation: "pilot",
        profile: { model: "gpt-image-2", resolution: "1k", style_reference_sha256: "a".repeat(64) },
      });
      recordImage2ProviderAuthorization(deck, {
        runVersion: "v1",
        operation: "pilot",
        scope: { slide_ids: ["AlphaGo", "BetaGo"] },
        profileFingerprint,
        maxSubmissions: 2,
        expectedStateSha: stateSha(deck),
      });

      expect(inspectImage2ProviderAuthorization(deck, {
        runVersion: "v1",
        operation: "pilot",
        scope: { slide_ids: ["BetaGo", "AlphaGo"] },
        profileFingerprint,
        maxSubmissions: 2,
      })).toMatchObject({ ok: true });
      expect(inspectImage2ProviderAuthorization(deck, {
        runVersion: "v1",
        operation: "pilot",
        scope: { slide_ids: ["AlphaGo"] },
        profileFingerprint,
        maxSubmissions: 1,
      })).toMatchObject({ ok: false, code: "AUTHORIZATION_SCOPE_MISMATCH" });
      expect(inspectImage2ProviderAuthorization(deck, {
        runVersion: "v1",
        operation: "pilot",
        scope: { slide_ids: ["AlphaGo", "BetaGo"] },
        profileFingerprint,
        maxSubmissions: 3,
      })).toMatchObject({ ok: false, code: "AUTHORIZATION_COUNT_EXCEEDED" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});

function writeVersionSource(deck, version, marker) {
  const runDir = join(deck, "3_versions", version);
  mkdirSync(runDir, { recursive: true });
  const frontmatter = marker === "html" ? "---\nproduction:\n  pipeline: html-first-v1\n---\n\n" : "---\nidentity:\n  scheme: mnemonic-v1\n---\n\n";
  writeFileSync(join(runDir, "slide-specifications.md"), `${frontmatter}## Slide 01: \`HeroGo\`\n`, "utf8");
}

describe("same-pipeline version mode registration (2.5)", () => {
  it("registers a published target from the source mode idempotently", () => {
    const deck = seedImage2Deck("reg-basic");
    try {
      writeVersionSource(deck, "v2", "legacy");
      const r = registerProductionModeFromSource(deck, { sourceRunVersion: "v1", targetRunVersion: "v2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(r).toMatchObject({ ok: true, status: "registered", mode: "image2-only", target_version: "v2" });
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "image2-only" });
      // Idempotent: re-registering the same mode is already-current, not a new write.
      const r2 = registerProductionModeFromSource(deck, { sourceRunVersion: "v1", targetRunVersion: "v2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(r2).toMatchObject({ ok: true, status: "already-current" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("respects the deck-wide marker-consistency guard (cross-pipeline markers make state unavailable)", () => {
    const deck = seedImage2Deck("reg-mismatch");
    try {
      // A v2 html marker conflicts with v1's markerless source deck-wide; the
      // state owner rejects this before registration, so registration cannot
      // proceed (defense-in-depth; the per-target PIPELINE_MISMATCH guard stays
      // for any future path that bypasses deck-wide classification).
      writeVersionSource(deck, "v2", "html");
      expect(() => registerProductionModeFromSource(deck, { sourceRunVersion: "v1", targetRunVersion: "v2" })).toThrow(/replacement_required|unavailable/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("fails closed when the target already holds a conflicting mode", () => {
    const deck = seedImage2Deck("reg-conflict");
    try {
      writeVersionSource(deck, "v2", "legacy");
      const state = readState(deck, { purpose: "execute", heal: false });
      state.production_mode.by_version["3_versions/v2"] = { mode: "html-only" };
      writeState(deck, state);
      const r = registerProductionModeFromSource(deck, { sourceRunVersion: "v1", targetRunVersion: "v2", expectedStateSha: sha(readFileSync(statePath(deck))) });
      expect(r).toMatchObject({ ok: false, code: "TARGET_MODE_CONFLICT", existing: "html-only", expected: "image2-only" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("reports SOURCE_MODE_MISSING when the source has no authoritative mode", () => {
    const deck = tmpDeck("reg-nosrc");
    try {
      const state = createDefaultState();
      state.pipeline = "legacy-image2-first";
      writeState(deck, state);
      writeVersionSource(deck, "v1", "legacy");
      writeVersionSource(deck, "v2", "legacy");
      const r = registerProductionModeFromSource(deck, { sourceRunVersion: "v1", targetRunVersion: "v2" });
      expect(r).toMatchObject({ ok: false, code: "SOURCE_MODE_MISSING" });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("createVersion wiring registers the target mode after visibility", () => {
    const deck = seedImage2Deck("reg-createversion");
    try {
      const v1 = join(deck, "3_versions", "v1");
      const v2 = createVersion(v1);
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v2"]).toEqual({ mode: "image2-only" });
      expect(v2).toMatch(/v2$/);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});
