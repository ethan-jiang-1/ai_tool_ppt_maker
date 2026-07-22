import { describe, it, expect } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { encode as encodePng } from "fast-png";
import { initHtmlFirstBundle, initLegacyBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readImage2RefinementState, readState, writeImage2RefinementState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { transitionAttempt } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import {
  buildControllerGateContext,
  selectPilotSlideIds,
} from "../../PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
import {
  generationFingerprint,
  generationProfile,
} from "../../PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/internal/image_provenance.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";
import { assemblyReceiptPath } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs";
import { CONTINUATION_RETURN_CASES, IMAGE2_RETURN_CASES, MIGRATION_CONFIRMATION_RETURN_CASES, MIGRATION_RETURN_CASES, PPT_FLOW_COMMAND_INVENTORY, PPT_FLOW_RETURN_AUDIT, validateCliReturnAudit } from "../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
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

async function startFakeImage2Relay() {
  const root = mkdtempSync(join(tmpdir(), "ppt-image2-relay-"));
  const script = join(root, "relay.mjs");
  const bytes = Buffer.from(encodePng({
    width: 1,
    height: 1,
    data: new Uint8Array([20, 30, 40, 255]),
    channels: 4,
    depth: 8,
  })).toString("base64");
  writeFileSync(script, `
import { createServer } from "node:http";
const response = ${JSON.stringify({
  status: "completed",
  provider_request_id: "fake-cli-request-001",
  bytes_base64: bytes,
  media: "image/png",
  width: 1,
  height: 1,
})};
const server = createServer((request, reply) => {
  request.resume();
  request.on("end", () => {
    reply.writeHead(200, { "Content-Type": "application/json" });
    reply.end(JSON.stringify(response));
  });
});
server.listen(0, "127.0.0.1", () => process.stdout.write(String(server.address().port) + "\\n"));
const stop = () => server.close(() => process.exit(0));
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
`);
  const child = spawn(process.execPath, [script], { stdio: ["ignore", "pipe", "pipe"] });
  const port = await new Promise((resolvePort, rejectPort) => {
    const timeout = setTimeout(() => rejectPort(new Error("fake Image2 relay did not start")), 5_000);
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => {
      clearTimeout(timeout);
      rejectPort(error);
    });
    child.stdout.once("data", (chunk) => {
      clearTimeout(timeout);
      const value = Number.parseInt(chunk.toString().trim(), 10);
      if (Number.isSafeInteger(value) && value > 0) resolvePort(value);
      else rejectPort(new Error(`fake Image2 relay reported an invalid port: ${stderr}`));
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      rejectPort(new Error(`fake Image2 relay exited before listening (${code}): ${stderr}`));
    });
  });
  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    stop() {
      if (child.exitCode === null) child.kill("SIGTERM");
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function parseFailureEnvelope(stderr) {
  const line = lastNonEmptyLine(stderr);
  const env = JSON.parse(line);
  expect(env.ok).toBe(false);
  return env;
}

describe("ppt_flow", () => {
  it("audits clean help and deterministic usage diagnostics across all 15 commands", () => {
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
      "migrate-html": ["migrate-html"],
      image2: ["image2", "plan"],
    };
    expect(PPT_FLOW_COMMAND_INVENTORY).toHaveLength(15);
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
    expect(help.stdout).toMatch(/--probe-vendors.*every resolved vendor/is);
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
    const runDir = join(root, "deck_x", "_runs", "r1");
    mkdirSync(runDir, { recursive: true });
    const r = runPptFlow(["state", runDir, "--check-gates"]);
    expect(r.status).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("GATE_BLOCKED");
    expect(env.hint).toMatch(/content|visual/);
  });

  it("does not mutate STYLE_PRESETS in place", () => {
    expect(PPT_FLOW_SRC).not.toMatch(
      /STYLE_PRESETS\.(sort|reverse|splice)\(/
    );
  });

  it("registers exactly 15 top-level commands", () => {
    const matches = PPT_FLOW_SRC.match(/\.command\("/g) || [];
    expect(matches.length).toBe(15);
  });

  it("keeps the return audit exact for all commands and Image2 cases", () => {
    expect(validateCliReturnAudit(PPT_FLOW_RETURN_AUDIT, PPT_FLOW_COMMAND_INVENTORY)).toEqual({ valid: true, errors: [] });
    expect(IMAGE2_RETURN_CASES).toEqual([
      "markerless",
      "current_delivery",
      "plan_authorization_drift",
      "duplicate_attempt",
      "unknown_submit",
      "candidate_identity",
      "promotion_recovery",
      "cleanup_ambiguity",
    ]);
    expect(MIGRATION_RETURN_CASES).toContain("prepare_success");
    expect(MIGRATION_RETURN_CASES).toContain("preview_preparation_guide");
    expect(MIGRATION_CONFIRMATION_RETURN_CASES).toContain("atomic_success");
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

  it("rejects markerless Image2 before creating modern state", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-image2-markerless-"));
    const deck = join(root, "deck_legacy");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const result = runPptFlow(["image2", "plan", runDir, "--profile", "a".repeat(64), "--json"]);
      expect(result.status).toBe(1);
      expect(parseFailureEnvelope(result.stderr)).toMatchObject({
        where: "ppt_flow.image2.plan",
        diagnostic: { category: "gate", reason: { kind: "image2_refinement_not_applicable" } },
      });
      expect(existsSync(join(runDir, "_generated", "image2_refinement"))).toBe(false);
      expect(existsSync(join(runDir, "_scratch", "image2_refinement"))).toBe(false);
      expect(readImage2RefinementState(readState(deck), "v1")).toBeNull();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("routes current HTML Image2 plan/authorization and preserves an unconfigured attempt", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-image2-cli-", { mode: "html-then-image2" });
    try {
      const legacy = runPptFlow(["style-master", fixture.runDir]);
      expect(legacy.status, legacy.stderr).toBe(0);
      const guide = JSON.parse(legacy.stdout);
      expect(guide).toMatchObject({ operation: "style-master", available: false, reason: "reserved-html-adapter" });

      const planned = runPptFlow(["image2", "plan", fixture.runDir, "--profile", "a".repeat(64), "--json"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan).toMatchObject({ run_version: "v1", total_attempts: 3 });
      expect(plan.plan_hash).toMatch(/^[0-9a-f]{64}$/);

      const stale = runPptFlow(["image2", "authorize", fixture.runDir, "--plan-hash", "f".repeat(64), "--json"]);
      expect(stale.status).toBe(1);
      expect(parseFailureEnvelope(stale.stderr)).toMatchObject({ code: "GATE_BLOCKED", diagnostic: { category: "gate" } });
      expect(readImage2RefinementState(readState(fixture.deck), "v1").authorization).toBeNull();

      const authorized = runPptFlow(["image2", "authorize", fixture.runDir, "--plan-hash", plan.plan_hash, "--json"]);
      expect(authorized.status, authorized.stderr).toBe(0);
      const authorization = JSON.parse(authorized.stdout);
      const setup = authorization.authorization.attempts.find((attempt) => attempt.kind === "style-reference");
      const unconfigured = runPptFlow(
        ["image2", "generate", fixture.runDir, "--attempt-id", setup.attempt_id, "--json"],
        // Prevent a developer's shell credentials from turning this missing-
        // configuration contract into a live provider call.
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" } },
      );
      expect(unconfigured.status).toBe(1);
      expect(parseFailureEnvelope(unconfigured.stderr)).toMatchObject({ code: "FAILED", diagnostic: { category: "provider" } });
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts[setup.attempt_id].state).toBe("planned");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("reaches the modern transport from the authorized CLI generate route", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-image2-cli-relay-", { mode: "html-then-image2" });
    let relay = null;
    try {
      const planned = runPptFlow(["image2", "plan", fixture.runDir, "--profile", "a".repeat(64), "--json"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const authorized = runPptFlow(["image2", "authorize", fixture.runDir, "--plan-hash", plan.plan_hash, "--json"]);
      expect(authorized.status, authorized.stderr).toBe(0);
      const setup = JSON.parse(authorized.stdout).authorization.attempts.find((attempt) => attempt.kind === "style-reference");
      relay = await startFakeImage2Relay();

      const generated = runPptFlow(
        ["image2", "generate", fixture.runDir, "--attempt-id", setup.attempt_id, "--base-url", relay.baseUrl, "--json"],
        {
          env: { IMAGE2_API_KEY: "cli-relay-key", IMAGE2_BASE_URL: "" },
          timeout: 120_000,
        },
      );
      expect(generated.status, generated.stderr).toBe(0);
      expect(JSON.parse(generated.stdout)).toMatchObject({
        attempt: {
          attempt_id: setup.attempt_id,
          state: "submitted",
          provider_request_id: "fake-cli-request-001",
          promotion_status: "committed",
        },
      });
    } finally {
      relay?.stop();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 180_000);

  it("state --json includes resume card fields", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-resume-"));
    const deck = join(root, "deck_resume");
    const runDir = join(deck, "3_versions", "v1");
    initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
    writeFileSync(
      join(deck, "_state", "state.yaml"),
      `playbook: iterate-style
current_node: review-gate
nodes:
  review-gate:
    status: in_progress
    waiting_for: user:review-style-master
gates:
  content: pending
  visual: pending
deck:
  name: resume
  type: keynote
  style: dark
playbook_stack: []
`,
      "utf-8"
    );
    const r = runPptFlow(["state", runDir, "--json"]);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.playbook).toBe("iterate-style");
    expect(j.current_node).toBe("review-style-system");
    expect(j.waiting_for).toBe("user:review-style-master");
    expect(typeof j.workflow_summary).toBe("string");
    expect(typeof j.suggested_next).toBe("string");
  });

  it("state resume guidance consumes current HTML evidence without mutating it", async () => {
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
      expect(report.html_resume_guidance).toMatchObject({
        schema: "pptmaker-html-resume-guidance-v1",
        outcome: "confirm",
        subject: "visual-review",
        continuation_command: expect.stringContaining("--waive --reason"),
      });
      expect(report.html_resume_guidance.recommended_command).toContain("approve");
      expect(report.suggested_next).toBe(report.html_resume_guidance.recommended_command);
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("keeps producer HTML resume guidance ahead of optional Image2 work", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-html-resume-priority-", { mode: "html-then-image2" });
    try {
      const phase4 = await import("../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs");
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
      expect(report.html_resume_guidance).toMatchObject({
        outcome: "confirm",
        subject: "visual-review",
        continuation_command: expect.stringContaining("--waive --reason"),
      });
      expect(report.suggested_next).toBe(report.html_resume_guidance.recommended_command);
      expect(report.suggested_next).not.toMatch(/image2-refinement/);

      const humanState = runPptFlow(["state", fixture.runDir]);
      expect(humanState.status, humanState.stderr).toBe(0);
      expect(humanState.stdout).toContain("Gate guidance:");
      expect(humanState.stdout).toContain("Continuation:");

      const status = runPptFlow(["status", fixture.runDir]);
      expect(status.status, status.stderr).toBe(0);
      expect(status.stdout).toContain("Gate guidance:");
      expect(status.stdout).toContain("Recommended:");
      expect(status.stdout).toContain("Continuation:");
      expect(status.stdout).not.toMatch(/Generate style master/);
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

  it("HTML approve requires an exact hash and permits a reasoned waiver without one", async () => {
    const fixture = createHtmlFirstRun("ppt-approve-html-");
    try {
      const { stage1 } = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs");
      const renderer = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs");
      const review = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const initialState = readFileSync(statePath);

      const missingHash = runPptFlow(["approve", fixture.runDir, "content"]);
      expect(missingHash.status).toBe(1);
      expect(parseFailureEnvelope(missingHash.stderr).code).toBe("USAGE");
      expect(readFileSync(statePath)).toEqual(initialState);

      const wrongHash = runPptFlow(["approve", fixture.runDir, "content", "--plan-hash", "f".repeat(64)]);
      expect(wrongHash.status).toBe(1);
      expect(readFileSync(statePath)).toEqual(initialState);

      const approved = runPptFlow(["approve", fixture.runDir, "content", "--plan-hash", pending.gates.content.plan.plan_hash]);
      expect(approved.status, approved.stderr).toBe(0);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).content).toMatchObject({ decision: "approved", freshness: "current", evidence_complete: true });

      const beforeWaiver = readFileSync(statePath);
      const missingReason = runPptFlow(["approve", fixture.runDir, "visual", "--waive"]);
      expect(missingReason.status).toBe(1);
      expect(parseFailureEnvelope(missingReason.stderr).code).toBe("USAGE");
      expect(readFileSync(statePath)).toEqual(beforeWaiver);

      const wrongWaiverHash = runPptFlow(["approve", fixture.runDir, "visual", "--waive", "--reason", "Use the current projection.", "--plan-hash", "e".repeat(64)]);
      expect(wrongWaiverHash.status).toBe(1);
      expect(readFileSync(statePath)).toEqual(beforeWaiver);

      const waived = runPptFlow(["approve", fixture.runDir, "visual", "--waive", "--reason", "Use the current projection."]);
      expect(waived.status, waived.stderr).toBe(0);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).visual).toMatchObject({ decision: "waived", freshness: "current", evidence_complete: true, waived_checks: [] });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 60000);

  it("HTML build --force publishes only needed waivers and keeps dry-run read-only", async () => {
    const fixture = createHtmlFirstRun("ppt-build-force-");
    try {
      const { stage1 } = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs");
      const { writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), htmlFirstSource([
        htmlFirstSlide({ note: "A valid note keeps this continuation test focused on gate evidence." }),
      ]));
      await stage1(fixture.runDir, false);
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const beforeDryRun = readFileSync(statePath);

      const missingReason = runPptFlow(["build", fixture.runDir, "--force"]);
      expect(missingReason.status).toBe(1);
      expect(parseFailureEnvelope(missingReason.stderr).code).toBe("USAGE");
      expect(readFileSync(statePath)).toEqual(beforeDryRun);

      const dryRun = runPptFlow(["build", fixture.runDir, "--force", "--reason", "Proceed with local delivery while review artifacts are rebuilt.", "--dry-run"]);
      expect(dryRun.status, dryRun.stderr).toBe(0);
      expect(JSON.parse(dryRun.stdout)).toMatchObject({ operation: "build", dry_run: true, force_not_needed: false, prospective_waivers: ["content", "visual"] });
      expect(readFileSync(statePath)).toEqual(beforeDryRun);

      const built = runPptFlow(["build", fixture.runDir, "--force", "--reason", "Proceed with local delivery while review artifacts are rebuilt."], { timeout: 60000 });
      expect(built.status, built.stderr).toBe(0);
      const waivedState = readState(fixture.deck, { purpose: "observe", heal: false });
      expect(waivedState.nodes["html-content-review"].by_version["3_versions/v1"]).toMatchObject({ status: "waived", evidence_complete: false });
      expect(waivedState.nodes["html-visual-review"].by_version["3_versions/v1"]).toMatchObject({ status: "waived", evidence_complete: false });
      expect(existsSync(join(fixture.runDir, "_generated", "image2_refinement"))).toBe(false);

      const gateBytes = Buffer.from(JSON.stringify({
        content: waivedState.nodes["html-content-review"].by_version["3_versions/v1"],
        visual: waivedState.nodes["html-visual-review"].by_version["3_versions/v1"],
      }));
      const unnecessary = runPptFlow(["build", fixture.runDir, "--force", "--reason", "A reason is still required when force is unnecessary."], { timeout: 60000 });
      expect(unnecessary.status, unnecessary.stderr).toBe(0);
      expect(unnecessary.stdout).toContain('"force_not_needed":true');
      const after = readState(fixture.deck, { purpose: "observe", heal: false });
      expect(Buffer.from(JSON.stringify({
        content: after.nodes["html-content-review"].by_version["3_versions/v1"],
        visual: after.nodes["html-visual-review"].by_version["3_versions/v1"],
      }))).toEqual(gateBytes);

      const partial = createHtmlFirstRun("ppt-build-force-partial-");
      try {
        await stage1(partial.runDir, false);
        const partialState = readState(partial.deck, { purpose: "observe", heal: false });
        partialState.nodes["html-visual-review"] = { by_version: { "3_versions/v1": { schema: "invalid" } } };
        writeState(partial.deck, partialState);
        const blocked = runPptFlow(["build", partial.runDir, "--force", "--reason", "Do not start assembly after a partial waiver."], { timeout: 30000 });
        expect(blocked.status).toBe(1);
        expect(existsSync(join(partial.runDir, "_generated", "ppt"))).toBe(false);
      } finally { rmSync(partial.root, { recursive: true, force: true }); }
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 180000);

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

  it("validates continuation option combinations with one usage envelope", async () => {
    const htmlFixture = createHtmlFirstRun("ppt-continuation-usage-build-");
    const deliveryFixture = await createCurrentHtmlDelivery("ppt-continuation-usage-state-", { mode: "html-then-image2" });
    try {
      const cases = [
        {
          result: runPptFlow(["build", htmlFixture.runDir, "--reason", "A reason without force is invalid." ]),
          where: "ppt_flow.build.html",
        },
        {
          result: runPptFlow(["state", deliveryFixture.runDir, "--force"]),
          where: "ppt_flow.state",
        },
        {
          result: runPptFlow(["state", deliveryFixture.runDir, "--reason", "A state reason needs a delivery decision." ]),
          where: "ppt_flow.state",
        },
        {
          result: runPptFlow(["state", deliveryFixture.runDir, "--validate-state", "--json"]),
          where: "ppt_flow.state",
        },
        {
          result: runPptFlow(["image2", "plan", deliveryFixture.runDir, "--profile", "a".repeat(64), "--reason", "A plan reason needs force." ]),
          where: "ppt_flow.image2.plan",
        },
        {
          result: runPptFlow(["image2", "generate", deliveryFixture.runDir, "--force"]),
          where: "ppt_flow.image2.generate",
        },
      ];
      for (const { result, where } of cases) {
        expect(result.status, result.stderr).toBe(1);
        expect((result.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);
        expect(parseFailureEnvelope(result.stderr)).toMatchObject({ code: "USAGE", where });
      }
    } finally {
      rmSync(htmlFixture.root, { recursive: true, force: true });
      rmSync(deliveryFixture.root, { recursive: true, force: true });
    }
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

  it("image2 plan --force records only a bound offline prerequisite waiver", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-image2-force-plan-", { mode: "html-then-image2" });
    try {
      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assemblyReceipt = JSON.parse(readFileSync(receiptPath, "utf8"));
      assemblyReceipt.html_delivery_digest = "f".repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assemblyReceipt, null, 2)}\n`);
      const profile = "a".repeat(64);

      const ordinary = runPptFlow(["image2", "plan", fixture.runDir, "--profile", profile]);
      expect(ordinary.status).toBe(1);
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toBeNull();

      const missingReason = runPptFlow(["image2", "plan", fixture.runDir, "--profile", profile, "--force"]);
      expect(missingReason.status).toBe(1);
      expect(parseFailureEnvelope(missingReason.stderr)).toMatchObject({ code: "USAGE" });

      const forced = runPptFlow([
        "image2", "plan", fixture.runDir, "--profile", profile, "--force",
        "--reason", "The current final-slide identity is sufficient for an offline refinement plan.",
      ]);
      expect(forced.status, forced.stderr).toBe(0);
      const report = JSON.parse(forced.stdout);
      expect(report).toMatchObject({
        schema: "pptmaker-image2-refinement-plan-v2",
        force_not_needed: false,
        prerequisite_waiver_fingerprint: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      const record = readImage2RefinementState(readState(fixture.deck), "v1");
      expect(record.prerequisite_waiver).toMatchObject({
        run_version: "v1",
        html_delivery_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(record.plan.prerequisite_waiver_fingerprint).toBe(report.prerequisite_waiver_fingerprint);

      const badOperation = runPptFlow(["image2", "authorize", fixture.runDir, "--force"]);
      expect(badOperation.status).toBe(1);
      expect(parseFailureEnvelope(badOperation.stderr)).toMatchObject({ code: "USAGE" });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120000);

  it("image2 unknown-submit abandon remains provider-free when credentials are absent", async () => {
    const fixture = await createCurrentHtmlDelivery("ppt-image2-abandon-offline-", { mode: "html-then-image2" });
    try {
      const phase4 = await import("../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs");
      const plan = await phase4.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      await phase4.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-abandon-offline" });
      const record = readImage2RefinementState(readState(fixture.deck), "v1");
      const attempt = Object.values(record.attempts).find((entry) => entry.kind === "style-reference");
      const submitting = transitionAttempt(attempt, "submitting", { updated_at: "2026-07-21T00:00:00.000Z" });
      record.attempts[attempt.attempt_id] = transitionAttempt(submitting, "unknown-submit", {
        provider_request_id: "task-abandon-offline-001",
        failure_code: "unknown-submit",
        updated_at: "2026-07-21T00:00:01.000Z",
      });
      writeImage2RefinementState(fixture.deck, "v1", record);

      const result = runPptFlow([
        "image2", "unknown-submit", fixture.runDir,
        "--attempt-id", attempt.attempt_id,
        "--decision", "abandon",
        "--json",
      ], { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" }, timeout: 120_000 });

      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        replacement_requires_new_authorization: true,
        attempt: { attempt_id: attempt.attempt_id, state: "unknown-submit", unknown_submit_resolution: "abandon" },
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 180_000);

  it("controller gate context reuses real validators and fails closed", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-controller-ctx-")), "deck_ctx");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
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

  it("approve dual-writes metadata and _state gates", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-approve-")), "deck_approve");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const r = runPptFlow(["approve", runDir, "visual"]);
      expect(r.status).toBe(0);
      const meta = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta).toMatch(/visual_gate:\s*approved/);
      const s = readState(deck);
      expect(s.gates.visual).toBe("approved");
      const r2 = runPptFlow(["approve", runDir, "content", "--waive"]);
      expect(r2.status).toBe(0);
      const meta2 = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta2).toMatch(/content_gate:\s*waived/);
      const s2 = readState(deck);
      expect(s2.gates.content).toBe("waived");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("approve header merges version-scoped pilot batches without metadata gate writes", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-header-approve-")), "deck_header");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const generated = join(runDir, "_generated");
      const promptsDir = join(generated, "page_prompts");
      const imagesDir = join(generated, "page_images_full");
      const qaDir = join(generated, "qa");
      const previewDir = join(generated, "preview");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
render:
  default: full-page
  header-lock: []
---

## Slide 01 — \`c1\`
**VISUAL TYPE**: Framework
**KICKER**: ONE
**TITLE**: First content title
**IMAGE PROMPT**: Create a clear three-part framework diagram with large labels.

## Slide 02 — \`c2\`
**VISUAL TYPE**: Direction
**KICKER**: TWO
**TITLE**: Second content title
**IMAGE PROMPT**: Create a clear directional roadmap with three milestones.
`, "utf-8");
      const stage1 = spawnSync("node", [
        "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs",
        "--run-dir", runDir,
        "--stage", "1",
      ], { encoding: "utf-8", timeout: 15000, env: process.env });
      expect(stage1.status).toBe(0);
      const stylePath = join(deck, "2_backbone", "visual-style", "style_master.jpg");
      writeFileSync(stylePath, "style");
      mkdirSync(imagesDir, { recursive: true });
      mkdirSync(qaDir, { recursive: true });
      mkdirSync(previewDir, { recursive: true });
      const prompts = JSON.parse(readFileSync(join(promptsDir, "_prompts.json"), "utf-8")).slides;
      const profile = generationProfile({
        styleReferenceSha256: sha256File(stylePath),
        resolution: "1k",
        model: "gpt-image-2",
        semanticOptions: { size: "16:9", n: 1 },
      });
      const manifest = { version: 1, slides: {} };
      for (const prompt of prompts) {
        const imagePath = join(imagesDir, prompt.out);
        writeFileSync(imagePath, `image-${prompt.id}`);
        manifest.slides[prompt.id] = {
          slide_id: prompt.id,
          output: prompt.out,
          generation_fingerprint: generationFingerprint({ prompt: prompt.prompt.trim(), profile }),
          image_sha256: sha256File(imagePath),
          generation_profile: profile,
          generated_at: new Date().toISOString(),
        };
      }
      writeFileSync(join(imagesDir, "_manifest.json"), JSON.stringify(manifest), "utf-8");
      writeFileSync(join(previewDir, "pilot_final_contact_sheet.jpg"), "reviewed", "utf-8");

      const plan = JSON.parse(readFileSync(join(generated, "slide_plan.json"), "utf-8")).slides;
      writeFileSync(join(qaDir, "pilot_slide_plan.json"), JSON.stringify({ slides: [plan[0]] }), "utf-8");
      const first = runPptFlow(["approve", runDir, "header"]);
      expect(first.status).toBe(0);
      let state = readState(deck);
      const v1 = state.nodes["header-review"].by_version["3_versions/v1"];
      expect(v1.slides).toBeDefined();
      expect(v1.slides.c1.status).toBe("reviewed");

      writeFileSync(join(qaDir, "pilot_slide_plan.json"), JSON.stringify({ slides: [plan[1]] }), "utf-8");
      const second = runPptFlow(["approve", runDir, "header"]);
      expect(second.status).toBe(0);
      state = readState(deck);
      const record = state.nodes["header-review"].by_version["3_versions/v1"];
      expect(record.slides.c2.status).toBe("reviewed");
      expect(state.gates.header).toBeUndefined();
      expect(readFileSync(join(deck, "project-metadata.yaml"), "utf-8")).not.toMatch(/header_gate/);

      const reviewedRefresh = runPptFlow([
        "refresh", runDir, "--kind", "title", "--only", "1", "--resolution", "1k", "--dry-run",
      ]);
      expect(reviewedRefresh.status).toBe(0);

      // Per-slide state verified: both slides are reviewed in the new format
      expect(record.slides.c1.status).toBe("reviewed");
      expect(record.slides.c2.status).toBe("reviewed");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  }, 20_000);

  it("approve header waiver requires both ids and a reason", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-header-waive-")), "deck_waive");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const result = runPptFlow(["approve", runDir, "header", "--waive", "--only", "1"]);
      expect(result.status).toBe(1);
      const envelope = parseFailureEnvelope(result.stderr);
      expect(envelope.code).toBe("USAGE");
      expect(envelope.message).toMatch(/--only.*--reason/);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("title refresh keeps body-only Header Text & Style Refresh and requires selectors for mixed decks", () => {
    const bodyDeck = join(mkdtempSync(join(tmpdir(), "ppt-title-body-")), "deck_title_body");
    const mixedDeck = join(mkdtempSync(join(tmpdir(), "ppt-title-mixed-")), "deck_title_mixed");
    try {
      initLegacyBundle(bodyDeck, null, "keynote", "dark-executive");
      const bodyRun = join(bodyDeck, "3_versions", "v1");
      writeFileSync(join(bodyRun, "slide-specifications.md"), `---
render:
  default: body+header-lock
  header-lock: []
---

## Slide 01 — \`body\`
**VISUAL TYPE**: Framework
**TITLE**: Body title
**IMAGE PROMPT**: Create a simple body diagram with two labeled sections.
`, "utf-8");
      const body = runPptFlow(["refresh", bodyRun, "--kind", "title", "--dry-run"]);
      expect(body.status).toBe(0);
      expect(body.stdout).toMatch(/--stage 3,4,5/);
      expect(body.stdout).not.toMatch(/--stage 1,2,3,4,5/);

      initLegacyBundle(mixedDeck, null, "keynote", "dark-executive");
      const mixedRun = join(mixedDeck, "3_versions", "v1");
      writeFileSync(join(mixedRun, "slide-specifications.md"), `---
render:
  default: full-page
  header-lock:
    - body
---

## Slide 01 — \`full\`
**VISUAL TYPE**: Framework
**TITLE**: Full title
**IMAGE PROMPT**: Create a complete visual with a strong central framework.

## Slide 02 — \`body\`
**VISUAL TYPE**: Direction
**TITLE**: Body title
**IMAGE PROMPT**: Create a body visual with one directional sequence.
`, "utf-8");
      const noSelector = runPptFlow(["refresh", mixedRun, "--kind", "title", "--dry-run"]);
      expect(noSelector.status).toBe(1);
      expect(parseFailureEnvelope(noSelector.stderr).code).toBe("USAGE");

      for (const selector of [["--only", "1"], ["--all"]]) {
        const result = runPptFlow([
          "refresh", mixedRun, "--kind", "title", ...selector, "--resolution", "1k", "--dry-run",
        ]);
        // New behavior: no header review record → gate passes → refresh succeeds
        expect(result.status).toBe(0);
      }
    } finally {
      rmSync(bodyDeck, { recursive: true, force: true });
      rmSync(mixedDeck, { recursive: true, force: true });
    }
  }, 20_000);

  it("status --json includes playbook breakpoint", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-status-")), "deck_status");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(
        join(deck, "_state", "state.yaml"),
        `schema_version: 4
pipeline: legacy-image2-first
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
      const r = runPptFlow(["status", runDir, "--json"]);
      expect(r.status).toBe(0);
      const j = JSON.parse(r.stdout);
      expect(j.playbook).toBe("create-deck");
      expect(j.current_node).toBe("checkpoint-intake");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides list/resolve are read-only and retain per-token binding evidence", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-read-")), "deck_slides_read");
    try {
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `---
identity:
  scheme: mnemonic-v1
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
      const stage1 = spawnSync("node", [
        "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs",
        "--run-dir", runDir,
        "--stage", "1",
      ], { encoding: "utf8", timeout: 10000 });
      expect(stage1.status, stage1.stderr).toBe(0);
      const status = runPptFlow(["status", runDir, "--json"]);
      expect(status.status).toBe(0);
      expect(JSON.parse(status.stdout).slide_labels).toEqual([
        "01 · DeckGo · Opening claim",
        "02 · UXGap · Why the old workflow breaks",
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
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `## Slide 01: DeckGo

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
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `## Slide 07: DeckGo

body one

## Slide 09: UXGap

body two
`, "utf8");
      const preview = runPptFlow(["slides", "normalize", runDir, "--json"]);
      expect(preview.status).toBe(0);
      const hash = JSON.parse(preview.stdout).transaction.plan_sha256;
      const applied = runPptFlow(["slides", "normalize", runDir, "--apply", "--plan-sha256", hash, "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      expect(readFileSync(spec, "utf8")).toBe(`## Slide 01: DeckGo

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
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), `## Slide 01: DeckGo

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
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), `## Slide 01: DeckGo

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
      const initResult = runPptFlow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive", "--mode", "html-only"]);
      expect(initResult.status, initResult.stderr).toBe(0);
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

  it("default init is image2-only and status/doctor reflect the mode", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-image2-default-"));
    try {
      const deck = join(root, "deck_image2_default");
      const initResult = runPptFlow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
      expect(initResult.status, initResult.stderr).toBe(0);
      expect(initResult.stdout).toContain("production_mode: image2-only");
      const runDir = join(deck, "3_versions", "v1");

      const source = readFileSync(join(runDir, "slide-specifications.md"), "utf8");
      expect(source).not.toContain("pipeline: html-first-v1");
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"]).toEqual({ mode: "image2-only" });

      const stateJson = runPptFlow(["state", runDir, "--json"]);
      const card = JSON.parse(stateJson.stdout);
      expect(card.production_mode).toMatchObject({ resolvable: true, mode: "image2-only" });

      const doctor = runPptFlow(["doctor", "--mode", "image2-only"]);
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
        diagnostic: { reason: { kind: "mode_source_mismatch" } },
      });
      expect((pilot.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);
      expect(existsSync(join(runDir, "_generated", "slide_plan.json"))).toBe(false);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(beforeState);

      const doctor = runPptFlow(["doctor", "--run-dir", runDir]);
      expect(doctor.status).not.toBe(0);
      expect(parseFailureEnvelope(doctor.stderr)).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.doctor.run-dir",
        diagnostic: { reason: { kind: "mode_source_mismatch" } },
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
        diagnostic: { reason: { kind: "mode_source_mismatch" } },
      });
      expect((direct.stderr.match(/"ok"\s*:\s*false/g) || []).length).toBe(1);
      expect(existsSync(join(runDir, "_generated", "slide_plan.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires first-class Image2 authorization only at a real provider boundary", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-image2-authorization-"));
    try {
      const deck = join(root, "deck_image2_authorization");
      initLegacyBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const styleMaster = join(deck, "2_backbone", "visual-style", "style_master.jpg");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style-master-prompt.md"), "first-class style prompt", "utf8");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
render:
  default: full-page
  header-lock: []
---

## Slide 01 — \`PilotGo\`
**VISUAL TYPE**: Framework
**KICKER**: PILOT
**TITLE**: First-class authorization boundary
**IMAGE PROMPT**: Create a clear, full-page framework with one focal idea and readable labels.
`, "utf8");

      const missingStyleAuthorization = runPptFlow(["style-master", runDir], {
        env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
      });
      expect(missingStyleAuthorization.status).not.toBe(0);
      expect(parseFailureEnvelope(missingStyleAuthorization.stderr)).toMatchObject({
        code: "FAILED",
        diagnostic: { category: "gate" },
      });
      expect(existsSync(styleMaster)).toBe(false);

      // Proven local reuse stays provider-free: the adapter returns before
      // credential/authorization lookup when its current style bytes exist.
      writeFileSync(styleMaster, "current-style-bytes", "utf8");
      const reusedStyle = runPptFlow(["style-master", runDir], {
        env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
      });
      expect(reusedStyle.status, reusedStyle.stderr).toBe(0);

      const pilot = runPptFlow(["pilot", runDir, "--count", "1"], {
        env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
        timeout: 30000,
      });
      expect(pilot.status).not.toBe(0);
      expect(parseFailureEnvelope(pilot.stderr)).toMatchObject({
        code: "FAILED",
        diagnostic: { category: "gate" },
      });
      expect(existsSync(join(runDir, "_generated", "page_images_full"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
