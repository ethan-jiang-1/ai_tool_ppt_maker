import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initHtmlFirstBundle, initLegacyFixtureBundle, initWholePageBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  buildControllerGateContext,
  selectPilotSlideIds,
} from "../../PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
import { assemblyReceiptPath } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs";
import { CONTINUATION_RETURN_CASES, IMAGE2_RETURN_CASES, PPT_FLOW_COMMAND_INVENTORY, PPT_FLOW_RETURN_AUDIT, PRODUCTION_MODE_TRANSITION_RETURN_CASES, validateCliReturnAudit } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from "../helpers/html_first_fixture.mjs";
import { createCurrentHtmlDelivery } from "../helpers/image2_refinement_fixture.mjs";

const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const PPT_FLOW_SRC = readFileSync(PPT_FLOW, "utf-8");

function lastNonEmptyLine(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "");
  return lines.length ? lines[lines.length - 1] : "";
}

function runPptFlow(args, opts = {}) {
  return spawnSync("node", [PPT_FLOW, ...args], {
    encoding: "utf-8",
    timeout: opts.timeout ?? 15000,
    env: { ...process.env, ...(opts.env || {}) },
  });
}

function parseFailureEnvelope(stderr) {
  const line = lastNonEmptyLine(stderr);
  const env = JSON.parse(line);
  expect(env.ok).toBe(false);
  return env;
}

function expectLegacyAdoptionFence(result) {
  expect(result.status, result.stderr).toBe(1);
  const envelope = parseFailureEnvelope(result.stderr);
  expect(envelope).toMatchObject({
    code: "FAILED",
    diagnostic: {
      category: "gate",
      reason: { kind: "legacy_protocol_adoption_required" },
    },
  });
  expect(envelope.where).toMatch(/\.identity$/);
}

describe("ppt_flow", () => {
  it("audits clean help and deterministic usage diagnostics across all 14 commands", () => {
    const usageProbes = {
      doctor: ["doctor", "--smoke", "--probe-vendors"],
      init: ["init"],
      status: ["status"],
      approve: ["approve"],
      "style-master": ["style-master", "/tmp/missing-run", "--resolution", "8k"],
      validate: ["validate"],
      pilot: ["pilot", "/tmp/missing-run", "--resolution", "8k"],
      build: ["build", "/tmp/missing-run", "--resolution", "8k"],
      refresh: ["refresh", "/tmp/missing-run", "--kind", "unsupported"],
      slides: ["slides", "resolve", "/tmp/missing-run"],
      "new-version": ["new-version"],
      state: ["state"],
      image2: ["image2", "plan"],
    };
    expect(PPT_FLOW_COMMAND_INVENTORY).toHaveLength(14);
    for (const command of PPT_FLOW_COMMAND_INVENTORY) {
      const help = runPptFlow([command, "--help"]);
      expect(help.status, `${command} --help\n${help.stderr}`).toBe(0);
      expect(help.stderr).not.toMatch(/"ok"\s*:\s*false/);
      if (command === "test") continue;
      const result = runPptFlow(usageProbes[command]);
      expect(result.status, `${command} usage`).not.toBe(0);
      const envelope = parseFailureEnvelope(result.stderr);
      expect(envelope.code, command).toBe("USAGE");
      expect(envelope.diagnostic, command).toMatchObject({
        version: 1,
        category: "usage",
        next: { action: "fix_arguments", requires_human: false },
      });
      expect((result.stderr.match(/"ok"\s*:\s*false/g) || []).length, command).toBe(1);
    }
  }, 30000);

  it("responds to --help and lists state", () => {
    const r = runPptFlow(["--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/\bstate\b/);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(() => JSON.parse(tail)).not.toThrow();
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("documents doctor --image2 as offline and keeps live flags distinct", () => {
    const help = runPptFlow(["doctor", "--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout).toMatch(/--image2.*offline Image2 presence/is);
    expect(help.stdout).toMatch(/--smoke.*one live first-vendor submit/is);
    expect(help.stdout).toMatch(/--probe-vendors.*every resolved\s+vendor/is);
  });

  it("state --help exits 0 without failure envelope", () => {
    const r = runPptFlow(["state", "--help"]);
    expect(r.status).toBe(0);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("doctor starts without freeze TypeError; non-zero yields FAILED envelope", () => {
    const r = runPptFlow(["doctor"], { timeout: 20000 });
    const combined = (r.stderr || "") + (r.stdout || "");
    expect(combined).not.toMatch(/Cannot assign to read only property/);
    expect(combined).not.toMatch(/program is not defined/);
    if (r.status !== 0) {
      const env = parseFailureEnvelope(r.stderr);
      expect(env.code).toBe("FAILED");
      expect(env.where).toBe("ppt_flow.doctor");
    }
  });

  it("doctor remains text-only and does not expose a JSON flag", () => {
    const help = runPptFlow(["doctor", "--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout + help.stderr).not.toMatch(/--json/);
    const unsupported = runPptFlow(["doctor", "--json"]);
    expect(unsupported.status).not.toBe(0);
    expect(parseFailureEnvelope(unsupported.stderr).code).toBe("USAGE");
  });

  it("unknown command → USAGE envelope", () => {
    const r = runPptFlow(["nosuch"]);
    expect(r.status).not.toBe(0);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
  });

  it("init unknown style → USAGE with preset hint (exactly one envelope)", () => {
    const r = runPptFlow([
      "init",
      "/tmp/deck_cli_envelope_test",
      "--deck-type",
      "keynote",
      "--style",
      "not-a-preset",
    ]);
    expect(r.status).not.toBe(0);
    const matches = (r.stderr.match(/\{[^\n]*"ok"\s*:\s*false/g) || []).length;
    expect(matches).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
    expect(env.hint).toMatch(/clean-clinical|dark-executive|tech-startup/);
    expect(env.where).toMatch(/init\.style/);
  });

  it("state --check-gates on minimal fixture → GATE_BLOCKED", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-gate-"));
    const deck = join(root, "deck_x");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const r = runPptFlow(["state", runDir, "--check-gates"]);
      expect(r.status).toBe(1);
      const env = parseFailureEnvelope(r.stderr);
      expect(env.code).toBe("GATE_BLOCKED");
      expect(env.hint).toMatch(/content|visual/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not mutate STYLE_PRESETS in place", () => {
    expect(PPT_FLOW_SRC).not.toMatch(
      /STYLE_PRESETS\.(sort|reverse|splice)\(/
    );
  });

  it("registers exactly 14 top-level commands", () => {
    const matches = PPT_FLOW_SRC.match(/\.command\("/g) || [];
    expect(matches.length).toBe(14);
  });

  it("keeps the return audit exact for all commands and Image2 cases", () => {
    expect(validateCliReturnAudit(PPT_FLOW_RETURN_AUDIT, PPT_FLOW_COMMAND_INVENTORY)).toEqual({ valid: true, errors: [] });
    expect(IMAGE2_RETURN_CASES).toEqual([
      "whole_page",
      "current_delivery",
      "plan_authorization_drift",
      "duplicate_attempt",
      "unknown_submit",
      "candidate_identity",
      "promotion_recovery",
      "cleanup_ambiguity",
    ]);
    expect(PRODUCTION_MODE_TRANSITION_RETURN_CASES).toContain("prepare_offline");
    expect(PRODUCTION_MODE_TRANSITION_RETURN_CASES).toContain("preview_authoring_guide");
    expect(PRODUCTION_MODE_TRANSITION_RETURN_CASES).toContain("confirm_atomic");
    const missing = { ...PPT_FLOW_RETURN_AUDIT.commands.image2 };
    delete missing.promotion_recovery;
    const broken = { ...PPT_FLOW_RETURN_AUDIT, commands: { ...PPT_FLOW_RETURN_AUDIT.commands, image2: missing } };
    expect(validateCliReturnAudit(broken, PPT_FLOW_COMMAND_INVENTORY)).toMatchObject({ valid: false, errors: [expect.stringMatching(/promotion_recovery/)] });

    expect(CONTINUATION_RETURN_CASES).toMatchObject({
      approve: expect.arrayContaining(["normal_approval", "guide_current_review_required", "waiver_incomplete_evidence", "conflict_plan_identity", "secret_safe_diagnostic"]),
      build: expect.arrayContaining(["normal_current_evidence", "guide_repair_recommended", "waiver_force", "conflict_journal_or_reset", "secret_safe_diagnostic"]),
      state_validate: expect.arrayContaining(["normal_read_only_validation", "guide_safe_repair", "conflict_invalid_authority", "secret_safe_diagnostic"]),
      delivery_review: expect.arrayContaining(["normal_proceed", "guide_rebuild_lineage", "waiver_forced_proceed", "conflict_review_identity", "secret_safe_diagnostic"]),
      image2_plan: expect.arrayContaining(["normal_offline_plan", "guide_delivery_repair", "waiver_force_prerequisite", "conflict_delivery_identity", "secret_safe_diagnostic"]),
      image2_generate: expect.arrayContaining(["normal_authorized_submit", "guide_credentials_required", "conflict_request_or_attempt_identity", "secret_safe_diagnostic"]),
      image2_unknown_submit: expect.arrayContaining(["normal_retain_or_abandon", "guide_reconciliation_required", "conflict_persisted_attempt_identity", "secret_safe_diagnostic"]),
    });
    const missingContinuation = {
      ...PPT_FLOW_RETURN_AUDIT,
      commands: {
        ...PPT_FLOW_RETURN_AUDIT.commands,
        continuations: { ...PPT_FLOW_RETURN_AUDIT.commands.continuations, build: ["normal_current_evidence"] },
      },
    };
    const invalidAudit = validateCliReturnAudit(missingContinuation, PPT_FLOW_COMMAND_INVENTORY);
    expect(invalidAudit.valid).toBe(false);
    expect(invalidAudit.errors).toContain("build is missing waiver_force continuation return case");
  });

  it("fences historical whole-page Image2 before creating modern state", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-image2-explicit whole-page-"));
    const deck = join(root, "deck_legacy");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const result = runPptFlow(["image2", "plan", runDir, "--profile", "a".repeat(64), "--json"]);
      expectLegacyAdoptionFence(result);
      expect(existsSync(join(runDir, "_generated", "image2_refinement"))).toBe(false);
      expect(existsSync(join(runDir, "_scratch", "image2_refinement"))).toBe(false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("fences ordinary historical production commands before provider or state work", () => {
    const fixture = createHtmlFirstRun("ppt-legacy-production-fence-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const beforeState = readFileSync(statePath);
      const commands = [
        ["style-master", fixture.runDir],
        ["image2", "plan", fixture.runDir, "--profile", "a".repeat(64), "--json"],
        ["approve", fixture.runDir, "content", "--plan-hash", "a".repeat(64)],
        ["build", fixture.runDir, "--force", "--reason", "Legacy production is fenced."],
        ["refresh", fixture.runDir, "--kind", "title", "--all", "--dry-run"],
        ["pilot", fixture.runDir, "--dry-run"],
      ];
      for (const args of commands) expectLegacyAdoptionFence(runPptFlow(args, {
        env: { IMAGE2_API_KEY: "cli-relay-key", IMAGE2_BASE_URL: "http://127.0.0.1:1/v1" },
      }));
      expect(readFileSync(statePath)).toEqual(beforeState);
      expect(existsSync(join(fixture.runDir, "_generated", "image2_refinement"))).toBe(false);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 30_000);

  it("state --json includes resume card fields", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-resume-"));
    const deck = join(root, "deck_resume");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const state = readState(deck, { purpose: "execute", heal: false });
      state.playbook = "iterate-style";
      state.current_node = "review-style-system";
      state.execution_id = "exec-resume";
      state.execution_started_at = "2026-07-24T00:00:00.000Z";
      state.run_version = "v1";
      state.nodes = {};
      state.nodes["review-style-system"] = {
        status: "in_progress",
        execution_id: state.execution_id,
        run_version: "v1",
        waiting_for: "user:review-style-master",
      };
      writeState(deck, state);
      const r = runPptFlow(["state", runDir, "--json"]);
      expect(r.status, r.stderr).toBe(0);
      const j = JSON.parse(r.stdout);
      expect(j.playbook).toBe("iterate-style");
      expect(j.current_node).toBe("review-style-system");
      expect(j.waiting_for).toBe("user:review-style-master");
      expect(typeof j.workflow_summary).toBe("string");
      expect(typeof j.suggested_next).toBe("string");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("state inspection gives legacy adoption priority without mutating historical evidence", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-html-resume-guidance-");
    try {
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      delete state.nodes["html-visual-review"].by_version["3_versions/v1"];
      const { writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      writeState(fixture.deck, state);
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);

      const result = runPptFlow(["state", fixture.runDir, "--json"]);
      expect(result.status, result.stderr).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.html_reviews.visual).toMatchObject({ decision: "pending", freshness: "missing" });
      expect(report.workflow_inspection).toMatchObject({
        posture: "guide",
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { action_id: "prepare-legacy-adoption" },
      });
      expect(report).not.toHaveProperty("html_resume_guidance");
      expect(report.suggested_next).toMatch(/--prepare-legacy-adoption/);
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("keeps adoption ahead of historical Image2 refinement work", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-html-resume-priority-", { mode: "html-then-image2" });
    try {
      const phase4 = await import("../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs");
      await phase4.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      delete state.nodes["html-visual-review"].by_version["3_versions/v1"];
      const { writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      writeState(fixture.deck, state);
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);

      const stateResult = runPptFlow(["state", fixture.runDir, "--json"]);
      expect(stateResult.status, stateResult.stderr).toBe(0);
      const report = JSON.parse(stateResult.stdout);
      expect(report.image2_refinement).toMatchObject({ present: true });
      expect(report.workflow_inspection).toMatchObject({
        root_cause: { owner: "legacy-protocol", kind: "recognized-legacy" },
        primary_action: { action_id: "prepare-legacy-adoption" },
      });
      expect(report).not.toHaveProperty("html_resume_guidance");
      expect(report.suggested_next).toMatch(/--prepare-legacy-adoption/);
      expect(report.suggested_next).not.toMatch(/image2-refinement/);

      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 180_000);

  it("state --validate-state is read-only and reports canonical version-key drift", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-state-validate-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const validBefore = readFileSync(statePath);
      const valid = runPptFlow(["state", fixture.runDir, "--validate-state"]);
      expect(valid.status, valid.stderr).toBe(0);
      expect(JSON.parse(valid.stdout)).toMatchObject({ operation: "validate-state", valid: true, issues: [] });
      expect(readFileSync(statePath)).toEqual(validBefore);

      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      const records = state.nodes["html-delivery-review"].by_version;
      records.v1 = records["3_versions/v1"];
      delete records["3_versions/v1"];
      const { writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      writeState(fixture.deck, state);
      const invalidBefore = readFileSync(statePath);
      const invalid = runPptFlow(["state", fixture.runDir, "--validate-state"]);
      expect(invalid.status).toBe(1);
      const report = JSON.parse(invalid.stdout);
      expect(report).toMatchObject({ operation: "validate-state", valid: false });
      expect(report.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: "nodes.html-delivery-review.by_version.v1", expected: "canonical 3_versions/vN key" }),
      ]));
      expect(parseFailureEnvelope(invalid.stderr)).toMatchObject({ code: "STATE_CORRUPTED" });
      expect(readFileSync(statePath)).toEqual(invalidBefore);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120000);

  it("state --validate-state reports bounded delivery SHA differences without mutating state", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-state-validate-delivery-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      const delivery = state.nodes["html-delivery-review"].by_version["3_versions/v1"];
      delivery.contact_sheet_sha256 = "f".repeat(64);
      delivery.run_version = "v2";
      const { writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      writeState(fixture.deck, state);
      const before = readFileSync(statePath);

      const result = runPptFlow(["state", fixture.runDir, "--validate-state"]);
      expect(result.status).toBe(1);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({ operation: "validate-state", valid: false });
      expect(report.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: "nodes.html-delivery-review.by_version.3_versions/v1.contact_sheet_path_sha256",
          expected: "sha256:ffffffffffff",
          kind: "reference",
        }),
        expect.objectContaining({
          path: "nodes.html-delivery-review.by_version.3_versions/v1.run_version",
          expected: "v1",
          actual: "v2",
          kind: "record",
        }),
      ]));
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120000);

  it("state --validate-state reports malformed YAML shapes instead of healing them", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-state-validate-shape-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const malformed = Buffer.from("schema_version: 3\nnodes: null\ngates: null\n", "utf8");
      writeFileSync(statePath, malformed);

      const result = runPptFlow(["state", fixture.runDir, "--validate-state"]);
      expect(result.status).toBe(1);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({ operation: "validate-state", valid: false });
      expect(report.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: "state", kind: "state" }),
      ]));
      expect(readFileSync(statePath)).toEqual(malformed);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120000);

  it("forced delivery review requires a reason and binds only reviewable current artifacts", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-delivery-force-cli-");
    try {
      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assemblyReceipt = JSON.parse(readFileSync(receiptPath, "utf8"));
      assemblyReceipt.html_delivery_digest = "f".repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assemblyReceipt, null, 2)}\n`);
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);

      const ordinary = runPptFlow(["state", fixture.runDir, "--record-delivery-review", "proceed"]);
      expect(ordinary.status).toBe(1);
      expect(parseFailureEnvelope(ordinary.stderr)).toMatchObject({ code: "FAILED" });
      expect(readFileSync(statePath)).toEqual(before);

      const missingReason = runPptFlow(["state", fixture.runDir, "--record-delivery-review", "proceed", "--force"]);
      expect(missingReason.status).toBe(1);
      expect(parseFailureEnvelope(missingReason.stderr)).toMatchObject({ code: "USAGE" });
      expect(readFileSync(statePath)).toEqual(before);

      const forced = runPptFlow([
        "state", fixture.runDir, "--record-delivery-review", "proceed", "--force",
        "--reason", "The current PPTX and contact sheet are reviewable while assembly lineage is rebuilt.",
      ]);
      expect(forced.status, forced.stderr).toBe(0);
      expect(JSON.parse(forced.stdout)).toMatchObject({
        operation: "record-delivery-review",
        decision: "proceed",
        freshness: "current",
        evidence_complete: false,
      });
      const record = readState(fixture.deck, { purpose: "observe", heal: false })
        .nodes["html-delivery-review"].by_version["3_versions/v1"];
      expect(record).toMatchObject({
        schema: "pptmaker-html-delivery-review-v2",
        decision: "proceed",
        evidence_complete: false,
        assembly_receipt_path: null,
      });
      expect(record.waived_checks.length).toBeGreaterThan(0);

      const invalidCombination = runPptFlow([
        "state", fixture.runDir, "--record-delivery-review", "repair", "--force",
        "--reason", "This combination is invalid.",
      ]);
      expect(invalidCombination.status).toBe(1);
      expect(parseFailureEnvelope(invalidCombination.stderr)).toMatchObject({ code: "USAGE" });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120000);

  it("documents the constrained continuation controls in Commander help", () => {
    const approve = runPptFlow(["approve", "--help"]);
    const build = runPptFlow(["build", "--help"]);
    const state = runPptFlow(["state", "--help"]);
    const image2 = runPptFlow(["image2", "--help"]);
    for (const result of [approve, build, state, image2]) expect(result.status, result.stderr).toBe(0);
    expect(approve.stdout).toMatch(/HTML --waive.*header risk acceptance/is);
    expect(build.stdout).toMatch(/--force.*waive reversible pending HTML gate evidence/is);
    expect(state.stdout).toMatch(/--record-delivery-review.*proceed/is);
    expect(state.stdout).toMatch(/--reason.*forced\s+proceed/is);
    expect(image2.stdout).toMatch(/--force.*offline planning/is);
    expect(image2.stdout).toMatch(/--reason.*image2 plan\s+--force/is);
  });

  it("controller gate context reuses real validators and fails closed", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-controller-ctx-")), "deck_ctx");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const ctx = await buildControllerGateContext(runDir);
      expect(ctx.deckDir).toBe(deck);
      expect(ctx.runDir).toBe(runDir);
      expect(ctx.slideSpecsValid).toBe(false);
      expect(ctx.headerReviewCurrent).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("status rejects a pre-current state without rewriting its bytes", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-status-")), "deck_status");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const stateFile = join(deck, "_state", "state.yaml");
      const historyFile = join(deck, "_state", "history.jsonl");
      writeFileSync(
        stateFile,
        `schema_version: 4
pipeline: whole-page-image2-v1
production_mode:
  by_version:
    3_versions/v1:
      mode: image2-only
playbook: create-deck
current_node: checkpoint-intake
execution_id: status-exec
execution_started_at: 2024-01-01T00:00:00.000Z
started_at: 2024-01-01T00:00:00.000Z
updated_at: 2024-01-01T00:00:00.000Z
nodes:
  checkpoint-intake:
    status: in_progress
    execution_id: status-exec
gates:
  content: pending
  visual: pending
deck:
  name: status
  type: keynote
  style: dark
playbook_stack: []
`,
        "utf-8"
      );
      const stateBefore = readFileSync(stateFile);
      const historyBefore = existsSync(historyFile) ? readFileSync(historyFile) : null;
      const r = runPptFlow(["status", runDir, "--json"]);
      expect(r.status).toBe(1);
      const envelope = parseFailureEnvelope(r.stderr);
      expect(envelope.diagnostic.next).toMatchObject({ action: "repair_prerequisite", requires_human: false });
      expect(envelope.diagnostic.next.default).toMatch(/inspect.*source\/state.*repair.*export/i);
      expect(readFileSync(stateFile)).toEqual(stateBefore);
      expect(existsSync(historyFile) ? readFileSync(historyFile) : null).toEqual(historyBefore);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides list/resolve are read-only and retain per-token binding evidence", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-read-")), "deck_slides_read");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: whole-page-image2-v1
---
# Deck

## Slide 01: \`DeckGo\`

**VISUAL TYPE**: Framework
**TITLE**: Opening claim
**IMAGE PROMPT**: Show an opening claim with two large labeled zones.

## Slide 02: \`UXGap\`

**VISUAL TYPE**: Framework
**TITLE**: Why the old workflow breaks
**IMAGE PROMPT**: Show the workflow friction with a clear before and after.
`, "utf8");
      const before = readFileSync(spec, "utf8");
      const list = runPptFlow(["slides", "list", runDir, "--json"]);
      expect(list.status).toBe(0);
      expect(JSON.parse(list.stdout).slides).toEqual([
        { slide_id: "DeckGo", position: 1, title: "Opening claim" },
        { slide_id: "UXGap", position: 2, title: "Why the old workflow breaks" },
      ]);
      const resolved = runPptFlow(["slides", "resolve", runDir, "UXGap", "UX gap", "2", "--json"]);
      expect(resolved.status).toBe(0);
      expect(JSON.parse(resolved.stdout).bindings).toEqual([
        { token: "UXGap", slide_id: "UXGap", position: 2, matched_by: "exact_id" },
        { token: "UX gap", slide_id: "UXGap", position: 2, matched_by: "spoken_key" },
        { token: "2", slide_id: "UXGap", position: 2, matched_by: "position" },
      ]);
      expect(readFileSync(spec, "utf8")).toBe(before);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides preview writes nothing; bare/hash-mismatched apply fails; confirmed move publishes clean vNext", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-move-")), "deck_slides_move");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `---
production:
  pipeline: whole-page-image2-v1
---

## Slide 01: DeckGo

**TITLE**: Opening

## Slide 02: UXGap

**TITLE**: Gap

## Slide 03: AICost

**TITLE**: Cost
`, "utf8");
      writeFileSync(join(runDir, "_generated", "stale.bin"), "must not copy", "utf8");
      const before = readFileSync(spec, "utf8");
      const preview = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.after_order).toEqual(["DeckGo", "AICost", "UXGap"]);
      expect(transaction.bindings.map((binding) => binding.matched_by)).toEqual(["position", "position"]);
      expect(readFileSync(spec, "utf8")).toBe(before);
      expect(() => statSync(join(deck, "3_versions", "v2"))).toThrow();

      const bare = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply"]);
      expect(bare.status).toBe(1);
      expect(parseFailureEnvelope(bare.stderr).code).toBe("USAGE");
      const mismatch = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply", "--plan-sha256", "0".repeat(64)]);
      expect(mismatch.status).toBe(1);
      expect(() => statSync(join(deck, "3_versions", "v2"))).toThrow();

      const applied = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply", "--plan-sha256", transaction.plan_sha256, "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      const result = JSON.parse(applied.stdout);
      const v2 = join(deck, "3_versions", "v2");
      expect(result.receipt.after_order).toEqual(transaction.after_order);
      expect(readFileSync(spec, "utf8")).toBe(before);
      expect(readFileSync(join(v2, "slide-specifications.md"), "utf8")).toMatch(
        /Slide 01: DeckGo[\s\S]*Slide 02: AICost[\s\S]*Slide 03: UXGap/
      );
      expect(readdirSync(join(v2, "_generated"))).toEqual(["README.md"]);
      expect(readdirSync(join(v2, "_scratch"))).toEqual(["README.md"]);
      expect(readdirSync(join(deck, "3_versions")).filter((name) => name.startsWith(".v2"))).toEqual([]);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides normalize is the hash-bound in-place exception and changes only heading projections", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-normalize-")), "deck_slides_normalize");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `---
production:
  pipeline: whole-page-image2-v1
---

## Slide 07: DeckGo

body one

## Slide 09: UXGap

body two
`, "utf8");
      const preview = runPptFlow(["slides", "normalize", runDir, "--json"]);
      expect(preview.status).toBe(0);
      const hash = JSON.parse(preview.stdout).transaction.plan_sha256;
      const applied = runPptFlow(["slides", "normalize", runDir, "--apply", "--plan-sha256", hash, "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      expect(readFileSync(spec, "utf8")).toBe(`---
production:
  pipeline: whole-page-image2-v1
---

## Slide 01: DeckGo

body one

## Slide 02: UXGap

body two
`);
      expect(readdirSync(join(deck, "3_versions")).filter((name) => /^v\d+$/.test(name))).toEqual(["v1"]);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides insertion requires mnemonic/history availability and apply-plan stays inside _scratch", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-insert-")), "deck_slides_insert");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), `---
production:
  pipeline: whole-page-image2-v1
---

## Slide 01: DeckGo

**TITLE**: Opening
`, "utf8");
      const block = join(v1, "_scratch", "insert.md");
      writeFileSync(block, `## Slide 01: UXGap

**TITLE**: New gap
`, "utf8");
      const preview = runPptFlow(["slides", "insert", v1, "--source", block, "--to", "end", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.after_order).toEqual(["DeckGo", "UXGap"]);
      expect(transaction.plan_sha256).toMatch(/^[a-f0-9]{64}$/);

      const planPath = join(v1, "_scratch", "plan.json");
      writeFileSync(planPath, JSON.stringify(transaction), "utf8");
      const applied = runPptFlow(["slides", "apply-plan", v1, "--plan", planPath, "--apply", "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      expect(JSON.parse(applied.stdout).receipt.needs_render).toEqual(["UXGap"]);

      const v2 = join(deck, "3_versions", "v2");
      const reused = join(v2, "_scratch", "reused.md");
      writeFileSync(reused, `## Slide 01: UXGap

**TITLE**: Reuse deleted or retained ID
`, "utf8");
      const conflict = runPptFlow(["slides", "insert", v2, "--source", reused, "--to", "end", "--json"]);
      expect(conflict.status).toBe(1);

      const outside = join(tmpdir(), `outside-plan-${Date.now()}.json`);
      writeFileSync(outside, JSON.stringify(transaction), "utf8");
      const rejected = runPptFlow(["slides", "apply-plan", v1, "--plan", outside, "--apply"]);
      expect(rejected.status).toBe(1);
      expect(parseFailureEnvelope(rejected.stderr).message).toMatch(/_scratch/);
      rmSync(outside, { force: true });
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("HTML slides apply publishes source-only vNext with local materialization debt", () => {
    const fixture = createHtmlFirstRun("ppt-slides-html-insert-");
    try {
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: "HeroGo", title: "Opening" }),
      ]), "utf8");
      const block = join(fixture.runDir, "_scratch", "insert-html.md");
      writeFileSync(block, htmlFirstSlide({ number: 1, id: "UXGap", title: "New gap" }), "utf8");
      const preview = runPptFlow(["slides", "insert", fixture.runDir, "--source", block, "--to", "end", "--json"]);
      expect(preview.status, preview.stderr || preview.stdout).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      const planPath = join(fixture.runDir, "_scratch", "html-plan.json");
      writeFileSync(planPath, JSON.stringify(transaction), "utf8");
      const applied = runPptFlow(["slides", "apply-plan", fixture.runDir, "--plan", planPath, "--apply", "--json"]);
      expect(applied.status, applied.stderr || applied.stdout).toBe(0);
      const receipt = JSON.parse(applied.stdout).receipt;
      expect(receipt).toMatchObject({
        pipeline: "html-first-v1",
        needs_render: [],
        needs_local_materialization: ["HeroGo", "UXGap"],
        review_required: true,
      });
      const v2 = join(fixture.deck, "3_versions", "v2");
      expect(existsSync(join(v2, "_generated", "html_production"))).toBe(false);
      expect(existsSync(join(v2, "_generated", "slide_plan.json"))).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("slides multi-delete binds every position before mutation and ambiguity requires a human", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-delete-")), "deck_slides_delete");
    try {
      initWholePageBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
production:
  pipeline: whole-page-image2-v1
---

## Slide 01: DeckGo

**TITLE**: Opening

## Slide 02: UXGap

**TITLE**: Cost gap

## Slide 03: AICost

**TITLE**: Cost curve

## Slide 04: IDFix

**TITLE**: Fix
`, "utf8");
      const preview = runPptFlow(["slides", "delete", runDir, "2", "4", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.bindings.map((binding) => binding.slide_id)).toEqual(["UXGap", "IDFix"]);
      expect(transaction.after_order).toEqual(["DeckGo", "AICost"]);

      const ambiguous = runPptFlow(["slides", "resolve", runDir, "cost", "--json"]);
      expect(ambiguous.status).toBe(1);
      const envelope = parseFailureEnvelope(ambiguous.stderr);
      expect(envelope.diagnostic.next.requires_human).toBe(true);
      expect(envelope.diagnostic.issues.map((issue) => issue.subject.id)).toEqual(["UXGap", "AICost"]);
      expect(envelope.diagnostic.issues[0]).toMatchObject({
        message: expect.stringMatching(/02.*UXGap.*Cost gap/),
        reason: { kind: "selector_candidate" },
      });
      expect((ambiguous.stderr.match(/"ok"\s*:\s*false/g) || [])).toHaveLength(1);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});

describe("pilot selector", () => {
  const slides = [
    { id: "hero", visual_type: "Title / Opener", layout_contract: { render_mode: "full-page" } },
    { id: "c1", visual_type: "Framework", layout_contract: { render_mode: "full-page" } },
    { id: "lock", visual_type: "Direction", layout_contract: { render_mode: "body+header-lock" } },
    { id: "c2", visual_type: "Impact / Evidence", layout_contract: { render_mode: "full-page" } },
    { id: "close", visual_type: "Closer", layout_contract: { render_mode: "full-page" } },
  ];

  it("prioritizes one or two content full-page slides by count", () => {
    expect(selectPilotSlideIds(slides, 1)).toEqual(["c1"]);
    expect(selectPilotSlideIds(slides, 2)).toEqual(["c1", "c2"]);
    expect(selectPilotSlideIds(slides, 3)).toEqual(["c1", "c2", "hero"]);
  });

  it("is deterministic and deduplicated with no content full-page", () => {
    const noContent = slides.filter((slide) => !["c1", "c2"].includes(slide.id));
    const a = selectPilotSlideIds(noContent, 3);
    expect(a).toEqual(selectPilotSlideIds(noContent, 3));
    expect(new Set(a).size).toBe(a.length);
  });

  it("state production-mode operations route through the closed CLI grammar", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-pmode-cli-"));
    try {
      const deck = join(root, "deck_pmode_cli");
      initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "html-only" });
      const runDir = join(deck, "3_versions", "v1");

      // Invalid mode is a one-envelope USAGE failure with zero writes.
      const bad = runPptFlow(["state", runDir, "--set-production-mode", "html"]);
      expect(bad.status).not.toBe(0);

      // Same-pipeline transition succeeds and updates authoritative state.
      const ok = runPptFlow(["state", runDir, "--set-production-mode", "html-then-image2"]);
      expect(ok.status, ok.stderr).toBe(0);
      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-then-image2" });

      // Cross-pipeline request fails closed without mutating state.
      const cross = runPptFlow(["state", runDir, "--set-production-mode", "image2-only"]);
      expect(cross.status).not.toBe(0);
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual({ mode: "html-then-image2" });

      // Mirror repair succeeds and clears drift.
      const mirror = runPptFlow(["state", runDir, "--repair-production-mode-mirror"]);
      expect(mirror.status, mirror.stderr).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("default init is Page Authority and status/doctor reflect the mode", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-image2-default-"));
    try {
      const deck = join(root, "deck_image2_default");
      const initResult = runPptFlow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
      expect(initResult.status, initResult.stderr).toBe(0);
      expect(initResult.stdout).toContain("production_mode: image2-page-authority");
      const runDir = join(deck, "3_versions", "v1");

      const source = readFileSync(join(runDir, "slide-specifications.md"), "utf8");
      expect(source).toContain("pipeline: page-authority-image2-v1");
      expect(source).toContain("page_authority_default: framed-image2");
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-page-authority", source_epoch: 1 });

      const stateJson = runPptFlow(["state", runDir, "--json"]);
      const card = JSON.parse(stateJson.stdout);
      expect(card.production_mode).toMatchObject({ resolvable: true, mode: "image2-page-authority" });

      const doctor = runPptFlow(["doctor", "--mode", "image2-page-authority"]);
      expect(doctor.status, doctor.stderr).toBe(0);

      const before = readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"];
      const cross = runPptFlow(["state", runDir, "--set-production-mode", "html-only"]);
      expect(cross.status).not.toBe(0);
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed on mode/source drift before root or direct adapter work", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-mode-route-drift-"));
    try {
      const deck = join(root, "deck_mode_route_drift");
      const initialized = runPptFlow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
      expect(initialized.status, initialized.stderr).toBe(0);
      const runDir = join(deck, "3_versions", "v1");
      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, "---\nproduction:\n  pipeline: html-first-v1\n---\n\n## Slide 01: `RouteUp`\n", "utf8");

      const beforeState = readFileSync(join(deck, "_state", "state.yaml"));
      const pilot = runPptFlow(["pilot", runDir, "--dry-run"]);
      expect(pilot.status).not.toBe(0);
      expect(parseFailureEnvelope(pilot.stderr)).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.pilot.identity",
        diagnostic: { reason: { kind: "current_protocol_repair_required" } },
      });
      expect((pilot.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);
      expect(existsSync(join(runDir, "_generated", "slide_plan.json"))).toBe(false);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(beforeState);

      const doctor = runPptFlow(["doctor", "--run-dir", runDir]);
      expect(doctor.status).not.toBe(0);
      expect(parseFailureEnvelope(doctor.stderr)).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.doctor.run-dir",
        diagnostic: { reason: { kind: "current_protocol_repair_required" } },
      });
      expect((doctor.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);

      const direct = spawnSync("node", [
        "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs",
        "--run-dir", runDir,
        "--stage", "1",
        "--dry-run",
      ], { encoding: "utf8", timeout: 15000, env: process.env });
      expect(direct.status).not.toBe(0);
      expect(parseFailureEnvelope(direct.stderr)).toMatchObject({
        code: "FAILED",
        where: "unified_pipeline.production-adapter",
        diagnostic: { reason: { kind: "current_protocol_repair_required" } },
      });
      expect((direct.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);
      expect(existsSync(join(runDir, "_generated", "slide_plan.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

});
