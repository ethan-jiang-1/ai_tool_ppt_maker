import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { resolveFramedStyleMasterScope } from "../../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { resolvePureStyleMasterScope } from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { CLI_BOUNDS, CLI_DIAGNOSTIC_SCHEMA, parseCliErrorLine } from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import { pageImageOrdinalImageFilename } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { pageImageWorkflowPaths, pageImageProgressiveRawPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { createProgressiveRawItemAttempt } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import { readProgressiveRawPlanDirectRecords, writeProgressiveRawItemAttempt } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { readState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

function pngBytes(color, width = 2048, height = 1136) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  return canvas.toBuffer("image/png");
}

function framedSource(title) {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`FramGo\`

**TITLE**: ${title}
**KICKER**: Operations
**SUBTITLE**: Current Page Image diagnostics
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: Current provider-rendered diagnostic content
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
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
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function pureSource(firstTitle = "First exact Pure page") {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`PureOne\`

**TITLE**: ${firstTitle}
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

async function createPureFixture(firstTitle = "First exact Pure page") {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-pure-progressive-cli-"));
  const deck = join(root, "deck_pure_progressive_cli");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#265e74"));
  writeFileSync(join(runDir, "slide-specifications.md"), pureSource(firstTitle));
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function runFlow(args, env = {}, { cwd = process.cwd(), unsetEnv = [] } = {}) {
  const childEnv = { ...process.env, ...env };
  for (const key of unsetEnv) delete childEnv[key];
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd,
      env: childEnv,
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

async function startMockProvider({
  responseBytes = null,
  responsePayload = null,
  responseStatus = null,
  responseBody = null,
  closeConnection = false,
} = {}) {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ method: request.method, url: request.url, idempotency_key: request.headers["idempotency-key"] || null });
    request.resume();
    if (closeConnection) {
      request.socket.destroy();
      return;
    }
    if (responseStatus !== null) {
      response.writeHead(responseStatus, { "content-type": "application/json" });
      response.end(responseBody === null ? JSON.stringify({ error: "unexpected provider call" }) : responseBody);
      return;
    }
    if (responsePayload !== null) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(responsePayload));
      return;
    }
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

async function startAsyncMockProvider({
  taskId = "ASYNC_TASK_ID_SENTINEL",
  pollResponses = [],
} = {}) {
  const calls = [];
  let pollIndex = 0;
  const server = createServer((request, response) => {
    calls.push({ method: request.method, url: request.url, idempotency_key: request.headers["idempotency-key"] || null });
    request.resume();
    if (request.method === "POST" && request.url === "/images/generations") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ task_id: taskId }] }));
      return;
    }
    if (request.method === "GET" && request.url === `/tasks/${taskId}`) {
      const step = pollResponses[Math.min(pollIndex, pollResponses.length - 1)];
      pollIndex += 1;
      if (!step) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "missing async fixture response" }));
        return;
      }
      if (step.closeConnection) {
        request.socket.destroy();
        return;
      }
      const status = Number.isSafeInteger(step.status) ? step.status : 200;
      const body = Object.hasOwn(step, "body") ? step.body : JSON.stringify(step.payload ?? {});
      response.writeHead(status, { "content-type": "application/json" });
      response.end(body);
      return;
    }
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "unexpected provider route" }));
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("async mock provider did not receive a TCP address");
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
    paths.target_provider_request_inspection,
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
  const progressive = pageImageProgressiveRawPaths(fixture.runDir);
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

function appendTerminalAttemptSibling(runDir, { plan_hash, batch_hash, slide_id, status }) {
  const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan_hash });
  const submitted = direct.attempts.find((entry) =>
    entry.record.batch_sha256 === batch_hash && entry.record.slide_id === slide_id && entry.record.status === "submitted",
  );
  const batch = direct.batches.find((entry) => entry.sha256 === batch_hash);
  const grant = direct.grants.find((entry) => entry.sha256 === submitted?.record.grant_sha256);
  const terminal = createProgressiveRawItemAttempt({
    ...submitted.record,
    status,
    previous_attempt_sha256: submitted.sha256,
  }, { plan: direct.plan.record, batch: batch.record, grant: grant.record });
  writeProgressiveRawItemAttempt(runDir, {
    plan: direct.plan.record,
    batch: batch.record,
    grant: grant.record,
    attempt: terminal,
  });
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
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category,
      reason: { kind: reason },
      next: { action, requires_human: false },
    },
  });
  expect(JSON.stringify(envelope.diagnostic.next)).not.toMatch(/force|waiv|retry/i);
}

function removeCurrentTaskMandate(fixture) {
  const state = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
  delete state.durable_state_present;
  delete state.page_image_task_mandate?.by_version?.["3_versions/v1"];
  writeState(fixture.deck, state);
}

describe("target Page Image CLI diagnostics", () => {
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
      expect(`${envelope.message} ${envelope.hint}`).toMatch(/header overlay|header fields/i);
      expect(`${envelope.message} ${envelope.hint}`).not.toMatch(/text frame|browser|provider/i);
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/SOURCE_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|page\.evaluate/i);
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, before);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), framedSource("Repaired canonical Framed title"));
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan).toMatchObject({
        schema: "page-image-progressive-raw-plan-projection",
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        next_action: { action_id: "plan_progressive_pilot", kind: "guide", requires_human: false },
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
        next_action: { action_id: "authorize_progressive_raw_batch", kind: "guide", requires_human: false },
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
        next_action: { action_id: "generate_progressive_raw_item", kind: "guide", requires_human: false },
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
        schema: "page-image-progressive-raw-plan-projection",
        workflow: "framed",
      });
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(emptyBrowserCache, { recursive: true, force: true });
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("keeps mandate-covered work agent-run and blocks a missing mandate before provider work", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider({ responseBytes: pngBytes("#397d93") });
    try {
      const plan = JSON.parse((await runFlow(["image2", "plan", fixture.runDir], provider.env)).stdout);
      expect(plan).toMatchObject({
        next_action: { action_id: "plan_progressive_pilot", kind: "guide", requires_human: false },
      });
      const pilotResult = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env);
      expect(pilotResult.status, pilotResult.stderr).toBe(0);
      const pilot = JSON.parse(pilotResult.stdout);
      expect(pilot).toMatchObject({
        next_action: { action_id: "authorize_progressive_raw_batch", kind: "guide", requires_human: false },
      });

      removeCurrentTaskMandate(fixture);
      const before = immutableSnapshot(fixture);
      const rejected = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], provider.env);
      const envelope = parseFailure(rejected);
      expect(envelope).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: {
          reason: { kind: "progressive_raw_task_mandate_required" },
          next: { requires_human: false },
        },
      });
      expect(provider.calls).toHaveLength(0);
      expect(readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash }).grants).toEqual([]);
      expectUnchanged(fixture, before);
    } finally {
      await provider.close();
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
        schema: "page-image-progressive-raw-plan-projection",
        workflow: "pure",
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        next_action: { action_id: "plan_progressive_pilot", kind: "guide", requires_human: false },
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
      expect(JSON.parse(pilot.stdout)).toMatchObject({
        next_action: { action_id: "authorize_progressive_raw_batch", kind: "guide", requires_human: false },
      });

      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);
      expect(JSON.parse(authorized.stdout)).toMatchObject({
        next_action: { action_id: "generate_progressive_raw_item", kind: "guide", requires_human: false },
      });

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
        expect.stringMatching(/^page-image-workflow-[0-9a-f]{64}$/),
        expect.stringMatching(/^page-image-workflow-[0-9a-f]{64}$/),
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

  it("continues a verified terminal sibling and reports an unrepairable branch without a fake rebuild action", async () => {
    const valid = await createPureFixture();
    const invalid = await createPureFixture();
    const provider = await startMockProvider({ responseBytes: pngBytes("#397d93") });
    try {
      const validPlan = JSON.parse((await runFlow(["image2", "plan", valid.runDir], provider.env)).stdout);
      const validPilot = JSON.parse((await runFlow([
        "image2", "pilot", valid.runDir,
        "--plan-hash", validPlan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env)).stdout).batch;
      await runFlow([
        "image2", "authorize", valid.runDir,
        "--plan-hash", validPlan.plan_hash,
        "--batch-hash", validPilot.batch_hash,
      ], provider.env);
      const validGenerated = await runFlow([
        "image2", "generate", valid.runDir,
        "--plan-hash", validPlan.plan_hash,
        "--batch-hash", validPilot.batch_hash,
      ], provider.env);
      expect(validGenerated.status, validGenerated.stderr).toBe(0);
      appendTerminalAttemptSibling(valid.runDir, {
        plan_hash: validPlan.plan_hash,
        batch_hash: validPilot.batch_hash,
        slide_id: "PureOne",
        status: "unknown",
      });
      const validBefore = readProgressiveRawPlanDirectRecords(valid.runDir, { plan_sha256: validPlan.plan_hash });
      const validReplan = await runFlow(["image2", "plan", valid.runDir], provider.env);
      expect(validReplan.status, validReplan.stderr).toBe(0);
      expect(JSON.parse(validReplan.stdout)).toMatchObject({ plan_hash: validPlan.plan_hash });
      expect(readProgressiveRawPlanDirectRecords(valid.runDir, { plan_sha256: validPlan.plan_hash })).toEqual(validBefore);

      const invalidPlan = JSON.parse((await runFlow(["image2", "plan", invalid.runDir], provider.env)).stdout);
      const invalidPilot = JSON.parse((await runFlow([
        "image2", "pilot", invalid.runDir,
        "--plan-hash", invalidPlan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env)).stdout).batch;
      await runFlow([
        "image2", "authorize", invalid.runDir,
        "--plan-hash", invalidPlan.plan_hash,
        "--batch-hash", invalidPilot.batch_hash,
      ], provider.env);
      const invalidGenerated = await runFlow([
        "image2", "generate", invalid.runDir,
        "--plan-hash", invalidPlan.plan_hash,
        "--batch-hash", invalidPilot.batch_hash,
      ], provider.env);
      expect(invalidGenerated.status, invalidGenerated.stderr).toBe(0);
      appendTerminalAttemptSibling(invalid.runDir, {
        plan_hash: invalidPlan.plan_hash,
        batch_hash: invalidPilot.batch_hash,
        slide_id: "PureOne",
        status: "known_failure",
      });
      const invalidBefore = readProgressiveRawPlanDirectRecords(invalid.runDir, { plan_sha256: invalidPlan.plan_hash });
      const invalidReplan = await runFlow(["image2", "plan", invalid.runDir], provider.env);
      const envelope = parseFailure(invalidReplan);
      expectOwnerAction(envelope, {
        category: "internal",
        reason: "progressive_raw_attempt_chain_invalid",
        action: "report_internal",
      });
      expect(readProgressiveRawPlanDirectRecords(invalid.runDir, { plan_sha256: invalidPlan.plan_hash })).toEqual(invalidBefore);
      expect(provider.calls).toHaveLength(2);
    } finally {
      await provider.close();
      rmSync(valid.root, { recursive: true, force: true });
      rmSync(invalid.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("loads cwd dotenv credentials only when an authorized generate crosses the remote boundary", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider({ responseBytes: pngBytes("#397d93") });
    const withoutInheritedCredentials = {
      cwd: fixture.root,
      unsetEnv: ["IMAGE2_API_KEY", "IMAGE2_BASE_URL"],
    };
    try {
      writeFileSync(join(fixture.root, ".env"), `${Object.entries(provider.env).map(([key, value]) => `${key}=${value}`).join("\n")}\n`);

      const planned = await runFlow(["image2", "plan", fixture.runDir], {}, withoutInheritedCredentials);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], {}, withoutInheritedCredentials);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], {}, withoutInheritedCredentials);
      expect(authorized.status, authorized.stderr).toBe(0);
      expect(provider.calls).toHaveLength(0);

      const generated = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], {}, withoutInheritedCredentials);
      expect(generated.status, generated.stderr).toBe(0);
      expect(JSON.parse(generated.stdout)).toMatchObject({
        item: "PureOne",
        outcome: "succeeded",
      });
      expect(provider.calls).toHaveLength(1);
      expect(`${generated.stdout}${generated.stderr}`).not.toContain(provider.env.IMAGE2_API_KEY);
      expect(`${generated.stdout}${generated.stderr}`).not.toContain(provider.env.IMAGE2_BASE_URL);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("stops missing credentials before the raw owner creates an attempt or contacts a provider", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider({ responseBytes: pngBytes("#397d93") });
    const withoutInheritedCredentials = {
      cwd: fixture.root,
      unsetEnv: ["IMAGE2_API_KEY", "IMAGE2_BASE_URL"],
    };
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], {}, withoutInheritedCredentials);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], {}, withoutInheritedCredentials);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], {}, withoutInheritedCredentials);
      expect(authorized.status, authorized.stderr).toBe(0);
      const before = immutableSnapshot(fixture);

      const rejected = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], {}, withoutInheritedCredentials);
      const envelope = parseFailure(rejected);
      expectOwnerAction(envelope, {
        category: "provider",
        reason: "page_image_provider_credentials_unavailable",
        action: "repair_environment",
      });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/IMAGE2_API_KEY|IMAGE2_BASE_URL/i);
      expect(provider.calls).toHaveLength(0);
      expect(readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash }).attempts).toHaveLength(0);
      expectUnchanged(fixture, before);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("resolves a Page Image async task without a second submission or CLI transport leakage", async () => {
    const image = pngBytes("#397d93");
    const provider = await startAsyncMockProvider({
      pollResponses: [
        { payload: { data: { status: "pending" } } },
        {
          payload: {
            data: {
              status: "completed",
              result: { images: [{ bytes_base64: image.toString("base64") }] },
              provider_response: "ASYNC_PROVIDER_BODY_SENTINEL",
            },
          },
        },
      ],
    });
    const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(generated.status, generated.stderr).toBe(0);
      expect(JSON.parse(generated.stdout)).toMatchObject({
        item: "PureOne",
        outcome: "succeeded",
        progress: { materialized: 1, unsubmitted: 1 },
      });
      const controlTranscript = `${planned.stdout}${planned.stderr}${pilot.stdout}${pilot.stderr}${authorized.stdout}${authorized.stderr}`;
      const generatedTranscript = `${generated.stdout}${generated.stderr}`;
      expect(controlTranscript).not.toMatch(/CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|ASYNC_TASK_ID_SENTINEL|ASYNC_PROVIDER_BODY_SENTINEL|data:image/i);
      expect(generatedTranscript).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|ASYNC_TASK_ID_SENTINEL|ASYNC_PROVIDER_BODY_SENTINEL|data:image/i);
      expect(generatedTranscript).not.toContain(image.toString("base64"));
      expect(provider.calls.map(({ method, url }) => ({ method, url }))).toEqual([
        { method: "POST", url: "/images/generations" },
        { method: "GET", url: "/tasks/ASYNC_TASK_ID_SENTINEL" },
        { method: "GET", url: "/tasks/ASYNC_TASK_ID_SENTINEL" },
      ]);
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
      expect(direct.attempts.filter((entry) => entry.record.status === "succeeded")).toHaveLength(1);
      expect(direct.materializations).toHaveLength(1);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("terminalizes received async failures while preserving an interrupted poll for reconciliation", async () => {
    const cases = [
      {
        name: "terminal task failure",
        pollResponses: [{ payload: { data: { status: "failed", provider_response: "ASYNC_PROVIDER_BODY_SENTINEL" } } }],
        expected: { provider_failure: { classification: "task_terminal_failure" } },
      },
      {
        name: "poll HTTP failure",
        pollResponses: [{ status: 503, body: "ASYNC_PROVIDER_BODY_SENTINEL" }],
        expected: { provider_failure: { classification: "http_error", http_status: 503 } },
      },
      {
        name: "completed task without media",
        pollResponses: [{
          payload: {
            data: {
              status: "completed",
              result: { images: [] },
              provider_response: "ASYNC_PROVIDER_BODY_SENTINEL",
            },
          },
        }],
        expected: {
          provider_media: {
            expected: { format: "png" },
            actual: { classification: "empty" },
          },
        },
      },
      {
        name: "completed task with invalid media",
        pollResponses: [{
          payload: {
            data: {
              status: "completed",
              result: { images: [{ bytes_base64: Buffer.from("not a PNG ASYNC_PROVIDER_BODY_SENTINEL").toString("base64") }] },
              provider_response: "ASYNC_PROVIDER_BODY_SENTINEL",
            },
          },
        }],
        expected: {
          provider_media: {
            expected: { format: "png" },
            actual: { classification: "invalid_png" },
          },
        },
      },
    ];
    for (const scenario of cases) {
      const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
      const provider = await startAsyncMockProvider({ pollResponses: scenario.pollResponses });
      try {
        const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
        expect(planned.status, planned.stderr).toBe(0);
        const plan = JSON.parse(planned.stdout);
        const pilot = await runFlow([
          "image2", "pilot", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--slide-id", "PureOne",
          "--slide-id", "PureTwo",
        ], provider.env);
        expect(pilot.status, pilot.stderr).toBe(0);
        const batch = JSON.parse(pilot.stdout).batch;
        const authorized = await runFlow([
          "image2", "authorize", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(authorized.status, authorized.stderr).toBe(0);

        const generated = await runFlow([
          "image2", "generate", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(generated.status, `${scenario.name}: ${generated.stderr}`).toBe(0);
        expect(JSON.parse(generated.stdout)).toMatchObject({
          item: "PureOne",
          outcome: "known_failure",
          ...scenario.expected,
        });
        expect(`${generated.stdout}${generated.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|ASYNC_TASK_ID_SENTINEL|ASYNC_PROVIDER_BODY_SENTINEL|data:image/i);
        expect(provider.calls).toHaveLength(2);
        const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
        expect(direct.materializations).toHaveLength(0);
        expect(direct.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
      } finally {
        await provider.close();
        rmSync(fixture.root, { recursive: true, force: true });
      }
    }

    const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
    const provider = await startAsyncMockProvider({ pollResponses: [{ closeConnection: true }] });
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const pilot = await runFlow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureOne",
        "--slide-id", "PureTwo",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = await runFlow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      const envelope = parseFailure(generated);
      expect(envelope).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: {
          category: "gate",
          reason: { kind: "progressive_raw_provider_outcome_unresolved" },
          next: { action: "reconcile", requires_human: false },
        },
      });
      expect(`${generated.stdout}${generated.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|ASYNC_TASK_ID_SENTINEL|data:image/i);
      expect(provider.calls).toHaveLength(2);
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
      expect(direct.batches).toHaveLength(1);
      expect(direct.grants).toHaveLength(1);
      expect(direct.materializations).toHaveLength(0);
      expect(direct.attempts.filter((entry) => entry.record.status === "submitted")).toHaveLength(1);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

  it("surfaces a plan-bound inspection reference without leaking its prompt or transport", async () => {
    const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
    const provider = await startMockProvider();
    try {
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan.provider_request_inspection).toMatchObject({
        path: "_generated/page_image_workflow/raw/provider-input-inspection.json",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        plan_hash: plan.plan_hash,
      });
      const inspection = readFileSync(join(fixture.runDir, plan.provider_request_inspection.path), "utf8");
      const inspectionRecord = JSON.parse(inspection);
      const inspectedRequest = JSON.parse(inspectionRecord.items[0].prompt);
      expect(inspectionRecord.transport).toMatchObject({ model: "gpt-image-2", size: "2000x1125" });
      expect(inspectedRequest.generation_profile.output).toEqual({ format: "png" });
      expect(inspection).toContain("PROMPT_LITERAL_SENTINEL");
      expect(inspection).not.toMatch(/CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|data:image|authorization/i);
      expect(`${planned.stdout}${planned.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|data:image|authorization/i);
      expect(provider.calls).toHaveLength(0);

      const rejected = await runFlow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", "0".repeat(64),
      ], provider.env);
      const envelope = parseFailure(rejected);
      expect(envelope.diagnostic).toMatchObject({ category: "artifact" });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|data:image|authorization/i);
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("terminalizes invalid provider media before Pure or Framed raw evidence", async () => {
    const cases = [
      {
        name: "empty",
        responsePayload: { data: [{ b64_json: "" }], provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL" },
        actual: { classification: "empty" },
      },
      {
        name: "malformed",
        responsePayload: {
          data: [{ b64_json: Buffer.from("not a PNG PROVIDER_RESPONSE_BODY_SENTINEL").toString("base64") }],
          provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
        },
        actual: { classification: "invalid_png" },
      },
    ];
    for (const scenario of cases) {
      const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
      const provider = await startMockProvider({ responsePayload: scenario.responsePayload });
      try {
        const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
        expect(planned.status, planned.stderr).toBe(0);
        const plan = JSON.parse(planned.stdout);
        const pilot = await runFlow([
          "image2", "pilot", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--slide-id", "PureOne",
          "--slide-id", "PureTwo",
        ], provider.env);
        expect(pilot.status, pilot.stderr).toBe(0);
        const batch = JSON.parse(pilot.stdout).batch;
        const authorized = await runFlow([
          "image2", "authorize", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(authorized.status, authorized.stderr).toBe(0);

        const generated = await runFlow([
          "image2", "generate", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(generated.status, `${scenario.name}: ${generated.stderr}`).toBe(0);
        expect(JSON.parse(generated.stdout)).toMatchObject({
          item: "PureOne",
          outcome: "known_failure",
          provider_media: {
            expected: { format: "png" },
            actual: scenario.actual,
          },
          progress: { materialized: 0, known_failure: 1, unsubmitted: 1 },
          next_action: { action_id: "generate_progressive_raw_item" },
        });
        expect(`${generated.stdout}${generated.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|PROVIDER_RESPONSE_BODY_SENTINEL|data:image|authorization/i);
        expect(provider.calls).toHaveLength(1);
        const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
        expect(direct.materializations).toHaveLength(0);
        expect(direct.attempts.some((entry) => entry.record.status === "succeeded")).toBe(false);
        expect(direct.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
        expect(existsSync(join(fixture.paths.raw_root, "PureOne.png"))).toBe(false);
      } finally {
        await provider.close();
        rmSync(fixture.root, { recursive: true, force: true });
      }
    }

    const framed = await createFixture("Framed invalid media");
    const provider = await startMockProvider({
      responsePayload: {
        data: [{ b64_json: pngBytes("#1f4d6e", 1600, 900).toString("base64") }],
        provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
      },
    });
    try {
      const planned = await runFlow(["image2", "plan", framed.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const pilot = await runFlow([
        "image2", "pilot", framed.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "FramGo",
      ], provider.env);
      expect(pilot.status, pilot.stderr).toBe(0);
      const batch = JSON.parse(pilot.stdout).batch;
      const authorized = await runFlow([
        "image2", "authorize", framed.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = await runFlow([
        "image2", "generate", framed.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], provider.env);
      expect(generated.status, generated.stderr).toBe(0);
      expect(JSON.parse(generated.stdout)).toMatchObject({
        item: "FramGo",
        outcome: "succeeded",
        progress: { materialized: 1, known_failure: 0 },
      });
      expect(`${generated.stdout}${generated.stderr}`).not.toMatch(/CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|PROVIDER_RESPONSE_BODY_SENTINEL|data:image|authorization/i);
      expect(provider.calls).toHaveLength(1);
      const direct = readProgressiveRawPlanDirectRecords(framed.runDir, { plan_sha256: plan.plan_hash });
      expect(direct.materializations).toHaveLength(1);
      expect(direct.attempts.some((entry) => entry.record.status === "succeeded")).toBe(true);
      expect(direct.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(0);
      expect(existsSync(join(framed.paths.raw_root, pageImageOrdinalImageFilename(1, "FramGo")))).toBe(false);
    } finally {
      await provider.close();
      rmSync(framed.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("terminalizes received HTTP and malformed success responses without leaking provider content", async () => {
    const cases = [
      {
        name: "HTTP error",
        responseStatus: 503,
        responseBody: "PROVIDER_RESPONSE_BODY_SENTINEL",
        providerFailure: { classification: "http_error", http_status: 503 },
      },
      {
        name: "empty invalid JSON",
        responseStatus: 200,
        responseBody: " \n\t",
        providerFailure: { classification: "invalid_json", response_shape: "empty" },
      },
      {
        name: "HTML-like invalid JSON",
        responseStatus: 200,
        responseBody: " \n<!DOCTYPE HTML><html>PROVIDER_RESPONSE_BODY_SENTINEL</html>",
        providerFailure: { classification: "invalid_json", response_shape: "html_like" },
      },
      {
        name: "other invalid JSON",
        responseStatus: 200,
        responseBody: "PROVIDER_RESPONSE_BODY_SENTINEL",
        providerFailure: { classification: "invalid_json", response_shape: "other_non_json" },
      },
    ];
    for (const scenario of cases) {
      const fixture = await createPureFixture("PROMPT_LITERAL_SENTINEL");
      const provider = await startMockProvider({
        responseStatus: scenario.responseStatus,
        responseBody: scenario.responseBody,
      });
      try {
        const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
        expect(planned.status, planned.stderr).toBe(0);
        const plan = JSON.parse(planned.stdout);
        const pilot = await runFlow([
          "image2", "pilot", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--slide-id", "PureOne",
          "--slide-id", "PureTwo",
        ], provider.env);
        expect(pilot.status, pilot.stderr).toBe(0);
        const batch = JSON.parse(pilot.stdout).batch;
        const authorized = await runFlow([
          "image2", "authorize", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(authorized.status, authorized.stderr).toBe(0);

        const generated = await runFlow([
          "image2", "generate", fixture.runDir,
          "--plan-hash", plan.plan_hash,
          "--batch-hash", batch.batch_hash,
        ], provider.env);
        expect(generated.status, `${scenario.name}: ${generated.stderr}`).toBe(0);
        const output = JSON.parse(generated.stdout);
        expect(output).toMatchObject({
          item: "PureOne",
          outcome: "known_failure",
          provider_failure: scenario.providerFailure,
          progress: { materialized: 0, known_failure: 1, unsubmitted: 1 },
          next_action: { action_id: "generate_progressive_raw_item" },
        });
        expect(output.provider_media).toBeUndefined();
        expect(`${generated.stdout}${generated.stderr}`).not.toMatch(/PROMPT_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|PROVIDER_RESPONSE_BODY_SENTINEL|data:image|authorization/i);
        expect(provider.calls).toHaveLength(1);
        const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
        expect(direct.materializations).toHaveLength(0);
        expect(direct.attempts.some((entry) => entry.record.status === "succeeded")).toBe(false);
        expect(direct.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
      } finally {
        await provider.close();
        rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  }, 90_000);

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

  it("permits only exact prior-plan reconciliation after a submitted Pure attempt drifts", async () => {
    const fixture = await createPureFixture();
    const provider = await startMockProvider({ closeConnection: true });
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
        prior_plan: false,
      });
      expect(provider.calls).toHaveLength(1);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);
});
