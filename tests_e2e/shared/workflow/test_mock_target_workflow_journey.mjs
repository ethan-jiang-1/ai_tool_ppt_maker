import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import {
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageOrdinalImageFilename } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { resolveContentAddressName } from "../../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";
import { pageImageDerivedPagePaths, pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { readState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

function pngBytes(color) {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

function targetSource(workflow, slides) {
  const header = (slide) => workflow === "framed" && slide.pageClass === "opening"
    ? ""
    : "**KICKER**: Operations\n**SUBTITLE**: Current provider-rendered page composition\n";
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

${slides.map((slide, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slide.id}\`

**TITLE**: ${slide.title}
${slide.pageClass ? `**PAGE CLASS**: ${slide.pageClass}\n` : ""}${slide.subjectRestrictions ? `**SUBJECT RESTRICTIONS**: ${slide.subjectRestrictions}\n` : ""}${header(slide)}**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: ${slide.title} supporting page content
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: ${slide.note}`).join("\n\n")}
`;
}

function createTargetFixture(prefix, workflow, slides) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, `deck_${workflow}_journey`);
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#1f4d6e"));
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a clear editorial visual system with clear content hierarchy.\n", "utf8");
  writeFileSync(join(runDir, "slide-specifications.md"), targetSource(workflow, slides));
  return { root, deck, runDir };
}

function flow(args, env = {}) {
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

function expectSuccess(result) {
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return result;
}

function jsonSuccess(result) {
  return JSON.parse(expectSuccess(result).stdout);
}

async function startMockProvider(bytes, { closeCalls = [] } = {}) {
  const calls = [];
  const closedCalls = new Set(closeCalls);
  const encoded = bytes.toString("base64");
  const server = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.once("end", () => {
      let body = null;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        // The request still counts: the child exercised the provider boundary.
      }
      calls.push({ method: request.method, url: request.url, body });
      if (request.method !== "POST" || request.url !== "/images/generations") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "unexpected mock provider route" }));
        return;
      }
      if (closedCalls.has(calls.length)) {
        request.socket.destroy();
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ b64_json: encoded }] }));
    });
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
      IMAGE2_API_KEY: "mock-target-workflow-key",
      IMAGE2_BASE_URL: `http://127.0.0.1:${address.port}`,
    },
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

function jsonFailure(result) {
  expect(result.status, result.stderr || result.stdout).toBe(1);
  const line = result.stderr.split(/\r?\n/).filter(Boolean).at(-1);
  return JSON.parse(line);
}

function pilotReviewArtifactRoot(runDir, batchHash) {
  const pilotRoot = join(pageImageWorkflowPaths(runDir).review_root, "pilot");
  return join(pilotRoot, resolveContentAddressName(pilotRoot, batchHash, {
    recordHashReader: (pathname) => {
      try {
        return JSON.parse(readFileSync(join(pathname, "pilot-page-review-evidence.json"), "utf8")).batch_sha256 || null;
      } catch {
        return null;
      }
    },
  }));
}

async function generateBatch(runDir, env, planHash, batch) {
  const generated = [];
  for (const slideId of batch.paid_submission_slide_ids) {
    const result = jsonSuccess(await flow([
      "image2", "generate", runDir,
      "--plan-hash", planHash,
      "--batch-hash", batch.batch_hash,
    ], env));
    expect(result).toMatchObject({
      plan_hash: planHash,
      batch_hash: batch.batch_hash,
      item: slideId,
      outcome: "succeeded",
    });
    generated.push(result);
  }
  return generated;
}

function positionAuthorizeNode(runDir, workflow, batch) {
  if (!["framed", "pure"].includes(workflow) || !["pilot", "expansion"].includes(batch?.kind)) {
    throw new Error("test fixture requires a current Framed/Pure Pilot or Expansion batch");
  }
  const deck = resolve(runDir, "..", "..");
  const state = structuredClone(readState(deck, { purpose: "observe", runVersion: "v1" }));
  delete state.durable_state_present;
  state.playbook = "create-deck";
  state.current_node = `authorize-target-${workflow}-${batch.kind}`;
  writeState(deck, state);
  return state.current_node;
}

async function authorizeBatch(runDir, env, planHash, batch, workflow, { handoffStatus = "completed" } = {}) {
  const nodeId = positionAuthorizeNode(runDir, workflow, batch);
  const result = jsonSuccess(await flow([
    "image2", "authorize", runDir,
    "--plan-hash", planHash,
    "--batch-hash", batch.batch_hash,
  ], env));
  expect(result).toMatchObject({
    plan_hash: planHash,
    batch_hash: batch.batch_hash,
    next_action: { action_id: "generate_progressive_raw_item", kind: "guide", requires_human: false },
    controller_handoff: {
      status: handoffStatus,
      workflow,
      node_id: nodeId,
      plan_hash: planHash,
      batch_hash: batch.batch_hash,
      grant_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    },
  });
  return result;
}

async function runTargetRawLifecycle(runDir, env, slides, {
  styleMaster: includeStyleMaster = true,
  handoffStatus = "completed",
} = {}) {
  const styleMaster = includeStyleMaster ? await runStyleMasterLifecycle(runDir, env) : null;
  const plan = jsonSuccess(await flow(["image2", "plan", runDir], env));
  expect(plan).toMatchObject({
    schema: "page-image-progressive-raw-plan-projection",
    plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
  });
  const pilot = jsonSuccess(await flow([
    "image2", "pilot", runDir,
    "--plan-hash", plan.plan_hash,
    ...slides.flatMap((slide) => ["--slide-id", slide.id]),
  ], env));
  expect(pilot).toMatchObject({
    plan_hash: plan.plan_hash,
    batch: {
      kind: "pilot",
      is_partial_pilot: false,
      ordered_slide_ids: slides.map((slide) => slide.id),
      paid_submission_slide_ids: slides.map((slide) => slide.id),
      maximum_submissions: slides.length,
    },
  });
  const authorization = await authorizeBatch(runDir, env, plan.plan_hash, pilot.batch, plan.workflow, { handoffStatus });
  expect(authorization).toMatchObject({
    plan_hash: plan.plan_hash,
    batch_hash: pilot.batch.batch_hash,
    grant_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    maximum_submissions: slides.length,
  });
  const generated = await generateBatch(runDir, env, plan.plan_hash, pilot.batch);
  expect(generated.at(-1)).toMatchObject({
    progress: { materialized: slides.length, unsubmitted: 0 },
    next_action: { action_id: "prepare_progressive_raw_review" },
  });
  const review = jsonSuccess(await flow([
    "image2", "review", runDir,
    "--plan-hash", plan.plan_hash,
  ], env));
  const accepted = jsonSuccess(await flow([
    "image2", "accept", runDir,
    "--plan-hash", plan.plan_hash,
    "--decision", "proceed",
  ], env));
  expect(accepted).toMatchObject({
    complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
  });
  expect(accepted.complete_raw_review_sha256).not.toBe(review.complete_raw_review_sha256);
  expectSuccess(await flow(["build", runDir], env));
  return { rawPlan: plan, styleMaster, pilot, authorization, generated, review, accepted };
}

async function runPartialTargetRawLifecycle(runDir, env, slides, { styleMaster: includeStyleMaster = true } = {}) {
  const styleMaster = includeStyleMaster ? await runStyleMasterLifecycle(runDir, env) : null;
  const plan = jsonSuccess(await flow(["image2", "plan", runDir], env));
  const planHash = plan.plan_hash;
  const pilotSlideIds = slides.slice(0, 2).map((slide) => slide.id);
  const pilot = jsonSuccess(await flow([
    "image2", "pilot", runDir,
    "--plan-hash", planHash,
    ...pilotSlideIds.flatMap((slideId) => ["--slide-id", slideId]),
  ], env));
  expect(pilot).toMatchObject({
    plan_hash: planHash,
    batch: {
      kind: "pilot",
      is_partial_pilot: true,
      ordered_slide_ids: pilotSlideIds,
      paid_submission_slide_ids: pilotSlideIds,
      maximum_submissions: pilotSlideIds.length,
    },
  });
  const pilotAuthorization = await authorizeBatch(runDir, env, planHash, pilot.batch, plan.workflow);
  const pilotGenerated = await generateBatch(runDir, env, planHash, pilot.batch);
  const pilotReview = jsonSuccess(await flow([
    "image2", "pilot-review", runDir,
    "--plan-hash", planHash,
    "--batch-hash", pilot.batch.batch_hash,
  ], env));
  const pilotAccepted = jsonSuccess(await flow([
    "image2", "pilot-accept", runDir,
    "--plan-hash", planHash,
    "--batch-hash", pilot.batch.batch_hash,
    "--decision", "proceed",
  ], env));
  expect(pilotAccepted).toMatchObject({
    pilot_decision_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    next_action: { action_id: "plan_progressive_expansion" },
  });
  const expansion = jsonSuccess(await flow([
    "image2", "expansion", runDir,
    "--plan-hash", planHash,
  ], env));
  const expansionIds = slides.slice(2).map((slide) => slide.id);
  expect(expansion).toMatchObject({
    plan_hash: planHash,
    batch: {
      kind: "expansion",
      is_partial_pilot: false,
      ordered_slide_ids: expansionIds,
      paid_submission_slide_ids: expansionIds,
      maximum_submissions: expansionIds.length,
    },
  });
  const expansionAuthorization = await authorizeBatch(runDir, env, planHash, expansion.batch, plan.workflow);
  const expansionGenerated = await generateBatch(runDir, env, planHash, expansion.batch);
  expect(expansionGenerated.at(-1)).toMatchObject({
    next_action: { action_id: "prepare_progressive_raw_review" },
  });
  const review = jsonSuccess(await flow([
    "image2", "review", runDir,
    "--plan-hash", planHash,
  ], env));
  const accepted = jsonSuccess(await flow([
    "image2", "accept", runDir,
    "--plan-hash", planHash,
    "--decision", "proceed",
  ], env));
  expectSuccess(await flow(["build", runDir], env));
  return {
    rawPlan: plan,
    styleMaster,
    pilot,
    pilotAuthorization,
    pilotGenerated,
    pilotReview,
    pilotAccepted,
    expansion,
    expansionAuthorization,
    expansionGenerated,
    review,
    accepted,
  };
}

async function runStyleMasterLifecycle(runDir, env) {
  const paths = pageImageWorkflowPaths(runDir);
  const inspected = jsonSuccess(await flow(["style-master", "inspect", runDir], env));
  expect(inspected).toMatchObject({ head: null, next_action: "plan_style_master_candidates" });
  const planned = jsonSuccess(await flow(["style-master", "plan", runDir, "--candidate-count", "0"], env));
  expect(planned).toMatchObject({
    max_candidate_submissions: 0,
    next_action: "review_style_master_candidates",
    plan: { candidates: [{ candidate_id: "local-existing", kind: "local-existing" }] },
  });
  const reviewed = jsonSuccess(await flow(["style-master", "review", runDir, "--plan-hash", planned.plan_sha256], env));
  const accepted = jsonSuccess(await flow([
    "style-master", "accept", runDir,
    "--plan-hash", planned.plan_sha256,
    "--decision", "proceed",
    "--candidate-id", "local-existing",
  ], env));
  expect(accepted).toMatchObject({ promoted: true, workflow: planned.workflow, candidate_id: "local-existing" });
  expect(existsSync(paths.target_source_receipt)).toBe(false);
  expect(existsSync(paths.target_raw_plan)).toBe(false);
  return { inspected, planned, reviewed, accepted };
}

describe("mock TARGET workflow journey", () => {
  it("publishes C5 before public authorization without exposing request text in Human Navigation", async () => {
    const slides = [{ id: "PureGo", title: "C5 public plan heading", note: "C5 plan fixture." }];
    const fixture = createTargetFixture("target-c5-public-plan-", "pure", slides);
    const provider = await startMockProvider(pngBytes("#205070"));
    try {
      await runStyleMasterLifecycle(fixture.runDir, provider.env);
      const callsBeforePlan = provider.calls.length;
      const plan = jsonSuccess(await flow(["image2", "plan", fixture.runDir], provider.env));
      const paths = pageImageWorkflowPaths(fixture.runDir);
      const pagePaths = pageImageDerivedPagePaths(fixture.runDir, "PureGo");
      expect(plan).toMatchObject({ workflow: "pure", plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/) });
      for (const path of [
        paths.derived_index,
        pagePaths.source_receipt,
        pagePaths.layout,
        pagePaths.render_model,
        pagePaths.generation_spec,
        pagePaths.image2_request,
        pagePaths.artifact_index,
      ]) expect(existsSync(path)).toBe(true);
      expect(existsSync(pagePaths.framed_header_html)).toBe(false);
      const request = JSON.parse(readFileSync(pagePaths.image2_request, "utf8"));
      expect(request.payload).toMatchObject({
        request_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        canonical_utf8: expect.stringContaining("page-image-pure-provider-input"),
      });
      expect(provider.calls).toHaveLength(callsBeforePlan);

      expectSuccess(await flow(["image2", "artifact-view", fixture.runDir], provider.env));
      const navigation = readFileSync(paths.human_navigation_index, "utf8");
      expect(navigation).not.toContain(request.payload.canonical_utf8);
      expect(navigation).not.toContain("_generated/page_image_workflow/derived");

      const pilot = jsonSuccess(await flow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "PureGo",
      ], provider.env));
      await authorizeBatch(fixture.runDir, provider.env, plan.plan_hash, pilot.batch, "pure");
      expect(provider.calls).toHaveLength(callsBeforePlan);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("retains the exact Framed C6 request binding through public authorization and review", async () => {
    const slides = [{
      id: "FramGo",
      title: "C6 public request binding",
      note: "C6 public workflow fixture.",
      subjectRestrictions: "no-identity-subject",
    }];
    const fixture = createTargetFixture("target-framed-c6-public-", "framed", slides);
    const provider = await startMockProvider(pngBytes("#5d277f"));
    try {
      const lifecycle = await runTargetRawLifecycle(fixture.runDir, provider.env, slides);
      const paths = pageImageWorkflowPaths(fixture.runDir);
      const pagePaths = pageImageDerivedPagePaths(fixture.runDir, "FramGo");
      const inspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      const c5Request = JSON.parse(readFileSync(pagePaths.image2_request, "utf8"));
      const inspectedRequest = JSON.parse(inspection.items[0].prompt);
      const providerInput = JSON.parse(inspectedRequest.compiled_provider_input.utf8);
      const providerCall = provider.calls.find((call) => {
        try {
          return JSON.parse(call.body?.prompt || "{}").schema === "page-image-framed-provider-input";
        } catch {
          return false;
        }
      });

      expect(inspection).toMatchObject({
        workflow: "framed",
        progressive_raw_work_plan_sha256: lifecycle.rawPlan.plan_hash,
        target_raw_work_plan_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(c5Request.payload).toMatchObject({
        canonical_utf8: inspectedRequest.compiled_provider_input.utf8,
        request_digest: inspectedRequest.compiled_provider_input.sha256,
        adapter_binding: inspection.items[0].provider_input_binding,
      });
      expect(providerInput).toMatchObject({
        subject_restrictions: "no-identity-subject",
        protected_composition: {
          coordinate_space: "normalized-canvas",
          reserved_header: expect.any(Object),
          body_safe: expect.objectContaining({ x: 0, width: 1 }),
        },
      });
      expect(providerInput).not.toHaveProperty("local_header");
      expect(providerInput).not.toHaveProperty("context_not_to_render");
      expect(providerInput).not.toHaveProperty("protected_geometry");
      expect(providerCall?.body?.prompt).toBe(inspectedRequest.compiled_provider_input.utf8);
      expect(lifecycle.authorization).toMatchObject({ plan_hash: lifecycle.rawPlan.plan_hash });
      expect(lifecycle.review).toMatchObject({ complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(lifecycle.accepted).toMatchObject({
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("runs a Framed selected Page Class edit through raw rebuild and notes-only refreshes", async () => {
    const slides = [
      { id: "FramGo", title: "Original framed heading", note: "Original Framed note." },
      { id: "BodyMap", title: "Second framed heading", note: "Second Framed note." },
    ];
    const fixture = createTargetFixture("target-framed-journey-", "framed", slides);
    const provider = await startMockProvider(pngBytes("#5d277f"));
    try {
      const initial = await runTargetRawLifecycle(fixture.runDir, provider.env, slides);
      expect(initial.styleMaster.planned.workflow).toBe("framed");
      expect(JSON.stringify(initial.styleMaster)).not.toMatch(/"pure"|Text Frame/i);
      expect(initial.rawPlan).toMatchObject({ workflow: "framed", source_epoch: 1, ordered_slide_ids: ["FramGo", "BodyMap"] });
      expect(provider.calls).toHaveLength(2);
      expect(provider.calls.every((call) => call.body?.model === "gpt-image-2")).toBe(true);

      const paths = pageImageWorkflowPaths(fixture.runDir);
      const framGoImage = pageImageOrdinalImageFilename(1, "FramGo");
      const presentationUpdated = [
        { ...slides[0], pageClass: "opening" },
        slides[1],
      ];
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("framed", presentationUpdated));
      const rejectedRefresh = await flow([
        "refresh", fixture.runDir, "--kind", "title", "--only", "FramGo",
      ], provider.env);
      expect(rejectedRefresh.status).not.toBe(0);
      expect(`${rejectedRefresh.stdout}\n${rejectedRefresh.stderr}`).toMatch(/Framed local refresh requires/i);
      expect(provider.calls).toHaveLength(2);

      const rebuilt = await runTargetRawLifecycle(fixture.runDir, provider.env, presentationUpdated, {
        styleMaster: false,
        handoffStatus: "superseded",
      });
      expect(rebuilt.rawPlan).toMatchObject({ workflow: "framed", source_epoch: 2 });
      expect(provider.calls).toHaveLength(4);
      const finalAfterTitleRefresh = readFileSync(join(paths.final_root, framGoImage));

      const notesUpdated = [
        { ...presentationUpdated[0], note: "Updated source-owned Framed note." },
        presentationUpdated[1],
      ];
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("framed", notesUpdated));
      const notes = expectSuccess(await flow(["refresh", fixture.runDir, "--kind", "notes"], provider.env));
      expect(notes.stdout).toContain("Target Page Image notes refreshed");
      expect(provider.calls).toHaveLength(4);
      expect(readFileSync(join(paths.final_root, framGoImage))).toEqual(finalAfterTitleRefresh);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("runs fresh Pure and rebuilds its visible pixels through a fresh raw lifecycle", async () => {
    const initialSlides = [{ id: "PureGo", title: "Original pure heading", note: "Original Pure note." }];
    const fixture = createTargetFixture("target-pure-journey-", "pure", initialSlides);
    const provider = await startMockProvider(pngBytes("#205070"));
    try {
      const initial = await runTargetRawLifecycle(fixture.runDir, provider.env, initialSlides);
      expect(initial.styleMaster.planned.workflow).toBe("pure");
      expect(JSON.stringify(initial.styleMaster)).not.toMatch(/"framed"|Text Frame|safe-zone/i);
      expect(initial.rawPlan).toMatchObject({ workflow: "pure", source_epoch: 1 });
      expect(provider.calls).toHaveLength(1);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("pure", [
        { ...initialSlides[0], title: "Updated pure heading" },
      ]));
      const rejectedRefresh = await flow([
        "refresh", fixture.runDir, "--kind", "title", "--only", "PureGo",
      ], provider.env);
      expect(rejectedRefresh.status).not.toBe(0);
      expect(`${rejectedRefresh.stdout}\n${rejectedRefresh.stderr}`).toContain("Target Pure visible text requires a Pure raw rebuild");
      expect(provider.calls).toHaveLength(1);

      const rebuilt = await runTargetRawLifecycle(fixture.runDir, provider.env, [
        { ...initialSlides[0], title: "Updated pure heading" },
      ], {
        styleMaster: false,
        handoffStatus: "superseded",
      });
      expect(rebuilt.rawPlan).toMatchObject({ workflow: "pure", source_epoch: 2 });
      expect(provider.calls).toHaveLength(2);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({
          source_epoch: 2,
          workflow: "pure",
          accepted_raw_evidence_sha256: null,
          final_manifest_sha256: null,
          delivery_receipt_sha256: null,
        });
      expect(state.page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          source_epoch: 2,
          workflow: "pure",
          accepted_raw_evidence_sha256: expect.any(String),
          final_manifest_sha256: expect.any(String),
          delivery_receipt_sha256: expect.any(String),
        });
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it.each(["framed", "pure"])("runs a fresh %s partial Pilot through Expansion, complete review, and delivery", async (workflow) => {
    const slides = [
      { id: "DeckGo", title: `${workflow} progressive opening`, note: "Progressive opening note." },
      { id: "FlowGo", title: `${workflow} progressive flow`, note: "Progressive flow note." },
      { id: "DataGo", title: `${workflow} progressive data`, note: "Progressive data note." },
      { id: "ToneGo", title: `${workflow} progressive tone`, note: "Progressive tone note." },
      { id: "FormGo", title: `${workflow} progressive form`, note: "Progressive form note." },
      { id: "GridGo", title: `${workflow} progressive grid`, note: "Progressive grid note." },
    ];
    const fixture = createTargetFixture(`target-${workflow}-partial-`, workflow, slides);
    const provider = await startMockProvider(pngBytes("#356d8d"));
    try {
      const lifecycle = await runPartialTargetRawLifecycle(fixture.runDir, provider.env, slides);
      expect(lifecycle.styleMaster.planned.workflow).toBe(workflow);
      expect(lifecycle.rawPlan).toMatchObject({
        workflow,
        source_epoch: 1,
        ordered_slide_ids: slides.map((slide) => slide.id),
      });
      expect(lifecycle.accepted).toMatchObject({
        accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(lifecycle.accepted.complete_raw_review_sha256).not.toBe(lifecycle.review.complete_raw_review_sha256);
      expect(provider.calls).toHaveLength(slides.length);
      expect(provider.calls.every((call) => call.body?.model === "gpt-image-2")).toBe(true);

      const paths = pageImageWorkflowPaths(fixture.runDir);
      const pilotRoot = pilotReviewArtifactRoot(fixture.runDir, lifecycle.pilot.batch.batch_hash);
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, {
        plan_sha256: lifecycle.rawPlan.plan_hash,
      });
      const acceptedEvidence = direct.accepted_evidence.find((entry) =>
        entry.sha256 === lifecycle.accepted.accepted_raw_evidence_sha256,
      );
      const finalManifest = JSON.parse(readFileSync(paths.target_final_manifest, "utf8"));
      expect(acceptedEvidence).toMatchObject({ record: { workflow } });
      expect(finalManifest).toMatchObject({ workflow });
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ workflow, accepted_raw_evidence_sha256: null });
      expect(state.page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({ workflow, accepted_raw_evidence_sha256: lifecycle.accepted.accepted_raw_evidence_sha256 });
      const deckGoImage = pageImageOrdinalImageFilename(1, "DeckGo");
      if (workflow === "framed") {
        expect(existsSync(join(pilotRoot, "provider-page", deckGoImage))).toBe(true);
        expect(existsSync(join(pilotRoot, "complete-page", deckGoImage))).toBe(true);
      } else {
        expect(existsSync(join(pilotRoot, "provider-page", deckGoImage))).toBe(true);
        expect(existsSync(join(pilotRoot, "complete-page"))).toBe(false);
      }
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

  it.each(["framed", "pure"])("resumes %s one item at a time and requires reconciliation plus a new grant after an unknown outcome", async (workflow) => {
    const slides = [
      { id: "DeckGo", title: `${workflow} retry opening`, note: "Retry opening note." },
      { id: "FlowGo", title: `${workflow} retry flow`, note: "Retry flow note." },
      { id: "DataGo", title: `${workflow} retry data`, note: "Retry data note." },
      { id: "ToneGo", title: `${workflow} retry tone`, note: "Retry tone note." },
      { id: "FormGo", title: `${workflow} retry form`, note: "Retry form note." },
      { id: "GridGo", title: `${workflow} retry grid`, note: "Retry grid note." },
    ];
    const fixture = createTargetFixture(`target-${workflow}-resume-`, workflow, slides);
    const provider = await startMockProvider(pngBytes("#8a4b62"), { closeCalls: [2] });
    try {
      await runStyleMasterLifecycle(fixture.runDir, provider.env);
      const plan = jsonSuccess(await flow(["image2", "plan", fixture.runDir], provider.env));
      const pilot = jsonSuccess(await flow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "DeckGo",
        "--slide-id", "FlowGo",
      ], provider.env));
      const grant = await authorizeBatch(fixture.runDir, provider.env, plan.plan_hash, pilot.batch, workflow);
      const committed = jsonSuccess(await flow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], provider.env));
      expect(committed).toMatchObject({
        item: "DeckGo",
        outcome: "succeeded",
        progress: { materialized: 1, unsubmitted: 5 },
        next_action: { action_id: "generate_progressive_raw_item" },
      });

      const interrupted = jsonFailure(await flow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], provider.env));
      expect(interrupted).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: { reason: { kind: "progressive_raw_provider_outcome_unresolved" } },
      });
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
      const submitted = direct.attempts.find((entry) =>
        entry.record.slide_id === "FlowGo" && entry.record.status === "submitted",
      );
      expect(submitted).toMatchObject({
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        record: { slide_id: "FlowGo", status: "submitted" },
      });
      expect(provider.calls).toHaveLength(2);

      const driftedSlides = [
        { ...slides[0], title: `${workflow} changed after submitted attempt` },
        ...slides.slice(1),
      ];
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource(workflow, driftedSlides));
      const blocked = jsonFailure(await flow(["image2", "plan", fixture.runDir], provider.env));
      expect(JSON.stringify(blocked)).toMatch(/reconcile_progressive_raw_attempt|reconcile/i);
      expect(provider.calls).toHaveLength(2);

      const reconciled = jsonSuccess(await flow([
        "image2", "reconcile", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--attempt-sha256", submitted.sha256,
      ], provider.env));
      expect(reconciled).toMatchObject({
        plan_hash: plan.plan_hash,
        attempt_sha256: submitted.sha256,
        reconciled: true,
        outcome: "unknown",
      });
      expect(provider.calls).toHaveLength(2);

      const successor = jsonSuccess(await flow(["image2", "plan", fixture.runDir], provider.env));
      expect(successor).toMatchObject({
        workflow,
        source_epoch: 2,
      });
      expect(successor.plan_hash).not.toBe(plan.plan_hash);
      const retry = jsonSuccess(await flow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", successor.plan_hash,
        "--slide-id", "FlowGo",
      ], provider.env));
      const retryGrant = await authorizeBatch(fixture.runDir, provider.env, successor.plan_hash, retry.batch, workflow, {
        handoffStatus: "superseded",
      });
      expect(retry.batch.batch_hash).not.toBe(pilot.batch.batch_hash);
      expect(retryGrant.grant_hash).not.toBe(grant.grant_hash);
      const retried = jsonSuccess(await flow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", successor.plan_hash,
        "--batch-hash", retry.batch.batch_hash,
      ], provider.env));
      expect(retried).toMatchObject({ item: "FlowGo", outcome: "succeeded" });
      expect(provider.calls).toHaveLength(3);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it.each(["framed", "pure"])("uses one complete raw-quality decision for %s small debt and its resulting zero-debt state", async (workflow) => {
    const slides = [
      { id: "DeckGo", title: `${workflow} small debt opening`, note: "Small debt opening note." },
      { id: "FlowGo", title: `${workflow} small debt flow`, note: "Small debt flow note." },
      { id: "DataGo", title: `${workflow} small debt data`, note: "Small debt data note." },
    ];
    const fixture = createTargetFixture(`target-${workflow}-small-debt-`, workflow, slides);
    const provider = await startMockProvider(pngBytes("#32636f"));
    try {
      const lifecycle = await runTargetRawLifecycle(fixture.runDir, provider.env, slides);
      expect(lifecycle.pilot.batch).toMatchObject({
        is_partial_pilot: false,
        paid_submission_slide_ids: slides.map((slide) => slide.id),
      });
      expect(lifecycle.generated.at(-1)).toMatchObject({
        progress: { materialized: slides.length, unsubmitted: 0, paid_debt: [] },
        next_action: { action_id: "prepare_progressive_raw_review" },
      });
      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: lifecycle.rawPlan.plan_hash });
      expect(direct.pilot_evidence).toEqual([]);
      expect(direct.pilot_decisions).toEqual([]);
      expect(provider.calls).toHaveLength(slides.length);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

});
