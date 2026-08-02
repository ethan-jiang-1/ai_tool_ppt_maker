import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { resolveFramedStyleMasterScope } from "../../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import { resolvePureStyleMasterScope } from "../../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { CLI_BOUNDS, parseCliErrorLine } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
import { pageAuthorityImage2Paths, pageAuthorityProgressiveRawPaths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_store.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function pngBytes(color) {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

function framedSource(title) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`FramGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: The CLI must preserve the current owner boundary.
`;
}

async function createFixture(title) {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-target-cli-diagnostic-"));
  const deck = join(root, "deck_target_cli_diagnostic");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#1f4d6e"));
  writeFileSync(join(runDir, "slide-specifications.md"), framedSource(title));
  await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir) };
}

function pureSource() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`PureOne\`

**TITLE**: First exact Pure page
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: The first exact item is submitted alone.

## Slide 02: \`PureTwo\`

**TITLE**: Second exact Pure page
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: The second exact item waits for another invocation.
`;
}

async function createPureFixture() {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-pure-progressive-cli-"));
  const deck = join(root, "deck_pure_progressive_cli");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#265e74"));
  writeFileSync(join(runDir, "slide-specifications.md"), pureSource());
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir) };
}

function runFlow(args, env = {}) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, 45_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`ppt_flow timed out: ${args.join(" ")}`));
        return;
      }
      resolveResult({ status, signal, stdout, stderr });
    });
  });
}

async function startMockProvider({ responseBytes = null } = {}) {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ method: request.method, url: request.url, idempotency_key: request.headers["idempotency-key"] || null });
    request.resume();
    if (responseBytes) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ b64_json: responseBytes.toString("base64") }] }));
      return;
    }
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "unexpected provider call" }));
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("mock provider did not receive a TCP address");
  return {
    calls,
    env: {
      IMAGE2_API_KEY: "CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL",
      IMAGE2_BASE_URL: `http://127.0.0.1:${address.port}`,
    },
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
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

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function immutableSnapshot(fixture) {
  const progressive = pageAuthorityProgressiveRawPaths(fixture.runDir);
  return {
    state: readFileSync(join(fixture.deck, "_state", "state.yaml")),
    derived: derivedPaths(fixture.paths).map((path) => (existsSync(path) ? readFileSync(path) : null)),
    rawFiles: existsSync(fixture.paths.raw_root) ? readdirSync(fixture.paths.raw_root).sort() : null,
    progressive: existsSync(progressive.history_root) ? treeSnapshot(progressive.history_root) : null,
  };
}

function expectUnchanged(fixture, snapshot) {
  expect(immutableSnapshot(fixture)).toEqual(snapshot);
}

function parseFailure(result) {
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
  expect(result.stdout).toBe("");
  const lines = result.stderr.split(/\r?\n/).filter(Boolean);
  const envelope = parseCliErrorLine(lines.at(-1));
  expect(envelope).toBeTruthy();
  expect(lines.map(parseCliErrorLine).filter(Boolean)).toHaveLength(1);
  expect(Buffer.byteLength(lines.at(-1), "utf8")).toBeLessThanOrEqual(CLI_BOUNDS.envelopeBytes);
  return envelope;
}

function expectOwnerAction(envelope, { category, reason, action }) {
  expect(envelope).toMatchObject({
    ok: false,
    code: "FAILED",
    diagnostic: {
      version: 1,
      category,
      reason: { kind: reason },
      next: { action, requires_human: false },
    },
  });
  expect(JSON.stringify(envelope.diagnostic.next)).not.toMatch(/force|waiv|retry/i);
}

describe("target Page Authority CLI diagnostics", () => {
  it("short-circuits an unfit Framed source, preserves owner boundaries, and succeeds after the same plan repair", async () => {
    const fixture = await createFixture(`SOURCE_LITERAL_SENTINEL ${"W".repeat(28)}`);
    const provider = await startMockProvider();
    try {
      const before = immutableSnapshot(fixture);
      const rejected = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      const envelope = parseFailure(rejected);

      expectOwnerAction(envelope, {
        category: "source_validation",
        reason: "framed_text_fit_failed",
        action: "edit_source",
      });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/SOURCE_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|page\.evaluate/i);
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, before);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), framedSource("Repaired canonical Framed title"));
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan).toMatchObject({
        schema: "page-authority-progressive-raw-plan-projection-v1",
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(provider.calls).toHaveLength(0);

      const beforeStaleHash = immutableSnapshot(fixture);
      const stale = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", "0".repeat(64),
      ], provider.env);
      const staleEnvelope = parseFailure(stale);
      expectOwnerAction(staleEnvelope, {
        category: "artifact",
        reason: "progressive_raw_batch_stale",
        action: "repair_prerequisite",
      });
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, beforeStaleHash);

      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "FramGo",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout);
      expect(batch).toMatchObject({
        plan_hash: plan.plan_hash,
        batch: {
          batch_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
          ordered_slide_ids: ["FramGo"],
          paid_submission_slide_ids: ["FramGo"],
          maximum_submissions: 1,
        },
      });
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);
      expect(JSON.parse(authorized.stdout)).toMatchObject({
        plan_hash: plan.plan_hash,
        batch_hash: batch.batch.batch_hash,
        grant_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        maximum_submissions: 1,
      });
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("reports an unavailable pinned runtime before materialization and succeeds after the same plan environment repair", async () => {
    const fixture = await createFixture("Runtime readiness");
    const emptyBrowserCache = mkdtempSync(join(tmpdir(), "pptmaker-empty-browser-cache-"));
    const provider = await startMockProvider();
    try {
      const before = immutableSnapshot(fixture);
      const rejected = await runFlow(["image2", "plan", fixture.runDir], {
        ...provider.env,
        PLAYWRIGHT_BROWSERS_PATH: emptyBrowserCache,
      });
      const envelope = parseFailure(rejected);

      expectOwnerAction(envelope, {
        category: "environment",
        reason: "framed_runtime_unavailable",
        action: "repair_environment",
      });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|PLAYWRIGHT_BROWSERS_PATH/i);
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, before);

      const repaired = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(repaired.status, repaired.stderr).toBe(0);
      expect(JSON.parse(repaired.stdout)).toMatchObject({
        schema: "page-authority-progressive-raw-plan-projection-v1",
        workflow: "framed",
      });
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(emptyBrowserCache, { recursive: true, force: true });
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("runs the fixed Pure progressive CLI forms one item at a time", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider({ responseBytes: pngBytes("#397d93") });
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan).toMatchObject({
        schema: "page-authority-progressive-raw-plan-projection-v1",
        workflow: "pure",
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });

      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureTwo",
        "--slide-id", "PureOne",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      expect(batch).toMatchObject({
        ordered_slide_ids: ["PureOne", "PureTwo"],
        paid_submission_slide_ids: ["PureOne", "PureTwo"],
        is_partial_pilot: false,
        maximum_submissions: 2,
      });

      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);

      const first = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(first.status, first.stderr).toBe(0);
      expect(JSON.parse(first.stdout)).toMatchObject({
        item: "PureOne",
        outcome: "succeeded",
        progress: { materialized: 1, unsubmitted: 1 },
        next_action: { action_id: "generate_progressive_raw_item" },
      });
      expect(provider.calls).toHaveLength(1);

      const second = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(second.status, second.stderr).toBe(0);
      expect(JSON.parse(second.stdout)).toMatchObject({
        item: "PureTwo",
        outcome: "succeeded",
        progress: { materialized: 2, unsubmitted: 0 },
        next_action: { action_id: "prepare_progressive_raw_review" },
      });
      expect(provider.calls).toHaveLength(2);
      expect(provider.calls.map((call) => call.idempotency_key)).toEqual([
        expect.stringMatching(/^page-authority-v3-[0-9a-f]{64}$/),
        expect.stringMatching(/^page-authority-v3-[0-9a-f]{64}$/),
      ]);

      const syntheticPilotReview = await runFlow([
        "image2", "pilot-review", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      const syntheticEnvelope = parseFailure(syntheticPilotReview);
      expect(syntheticEnvelope).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: {
          category: "gate",
          reason: { kind: "progressive_raw_pilot_unavailable" },
        },
      });
      expect(provider.calls).toHaveLength(2);

      const review = await runFlow([
        "image2", "review", fixture.runDir,
        "--plan-hash", plan.plan_hash,
      ], provider.env);
      expect(review.status, review.stderr).toBe(0);
      expect(JSON.parse(review.stdout)).toMatchObject({
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("rejects retired and bypassing progressive forms before mutation or provider initialization", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider();
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const planHash = JSON.parse(planned.stdout).plan_hash;
      const before = immutableSnapshot(fixture);
      const rejectedForms = [
        ["image2", "authorize", fixture.runDir, "--plan-hash", planHash],
        ["image2", "generate", fixture.runDir, "--plan-hash", planHash],
        ["image2", "pilot", fixture.runDir, "--plan-hash", planHash, "--slides", "PureOne"],
        ["image2", "pilot", fixture.runDir, "--plan-hash", planHash, "--slide-id", "Slide 01"],
        ["image2", "pilot", fixture.runDir, "--plan-hash", planHash, "--slide-id", "PureOne", "--provider", "other"],
        ["image2", "plan", fixture.runDir, "--force"],
      ];
      for (const args of rejectedForms) {
        const result = await runFlow(args, provider.env);
        const envelope = parseFailure(result);
        expect(envelope).toMatchObject({ diagnostic: { category: "usage" } });
        expectUnchanged(fixture, before);
      }
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("permits only exact historical reconciliation after a submitted Pure attempt drifts", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider();
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const planHash = JSON.parse(planned.stdout).plan_hash;
      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", planHash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batchHash = JSON.parse(pilot.stdout).batch.batch_hash;
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", planHash,
        "--batch-hash", batchHash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);

      const unresolved = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", planHash,
        "--batch-hash", batchHash,
      ], provider.env);
      const unresolvedEnvelope = parseFailure(unresolved);
      expect(unresolvedEnvelope).toMatchObject({
        diagnostic: {
          category: "gate",
          reason: { kind: "progressive_raw_provider_outcome_unresolved" },
          next: { action: "reconcile", requires_human: false },
        },
      });
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: planHash });
      const submitted = direct.attempts.find((entry) => entry.record.status === "submitted");
      expect(submitted?.sha256).toMatch(/^[0-9a-f]{64}$/);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), pureSource().replace("First exact Pure page", "Drifted exact Pure page"));
      const reconciled = await runFlow([
        "image2", "reconcile", fixture.runDir,
        "--plan-hash", planHash,
        "--attempt-sha256", submitted.sha256,
      ], provider.env);
      expect(reconciled.status, reconciled.stderr).toBe(0);
      expect(JSON.parse(reconciled.stdout)).toMatchObject({
        plan_hash: planHash,
        attempt_sha256: submitted.sha256,
        reconciled: true,
        outcome: "unknown",
        historical: false,
      });
      expect(provider.calls).toHaveLength(1);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);
});
