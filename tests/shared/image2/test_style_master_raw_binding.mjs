import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import { describe, expect, it } from "vitest";

import {
  buildPureTargetRawPlan,
  readPureTargetStoredPlanContext,
  resolvePureStyleMasterScope,
  resolvePureTargetCandidateSource,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  styleMasterSubmitFactory,
  targetPageImageSubmitFactory,
} from "../../../ppt_maker_harness/scripts/ppt_flow.mjs";
import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { buildTargetRawGenerationProfile } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs";
import { STYLE_MASTER_GENERATION_PROFILE } from "../../../ppt_maker_harness/scripts/shared/image2/style_master_schema.mjs";
import { styleMasterStorePaths } from "../../../ppt_maker_harness/scripts/shared/image2/style_master_store.mjs";
import {
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readState, statePath } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function localImageBytes(variant = 0) {
  return Buffer.from(variant === 0
    ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC"
    : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY8hyUPkPAAO0Ac51OmnoAAAAAElFTkSuQmCC", "base64");
}

const VALID_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

const VALID_STYLE_MASTER_PNG = (() => {
  const image = createCanvas(17, 11);
  image.getContext("2d").fillRect(0, 0, 17, 11);
  return image.toBuffer("image/png");
})();

function providerJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  };
}

function styleMasterTransportRequest() {
  return {
    compiled_prompt_bytes: Buffer.from("One bounded visual style brief.", "utf8"),
    candidate_generation_profile: STYLE_MASTER_GENERATION_PROFILE,
    transport: { base_url: "https://image.example", api_key: "test-key" },
  };
}

function source({ motifs = [], relationship = null } = {}) {
  const motifsYaml = motifs.length === 0
    ? "[]"
    : `\n${motifs.map((motif) => `  - ${motif}`).join("\n")}`;
  const relationshipYaml = relationship ? `relationship: ${relationship}\n` : "";
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Immutable Style Master binding
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: ${motifsYaml}
negative_constraints:
  - no-logo
${relationshipYaml}\`\`\`
`;
}

async function fixture({ accepted = false, motifs = [], relationship = null } = {}) {
  const root = mkdtempSync(join(tmpdir(), "style-master-raw-binding-"));
  const deck = join(root, "deck_style_master_raw_binding");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), localImageBytes());
  writeFileSync(join(runDir, "slide-specifications.md"), source({ motifs, relationship }), "utf8");
  const result = accepted
    ? await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir))
    : null;
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir), result };
}

function candidateReceipt(value) {
  return resolvePureTargetCandidateSource(value.runDir).receipt;
}

function sourceEpoch(value) {
  return readState(value.deck, { purpose: "observe", runVersion: "v1" })
    .page_image_target_evidence.by_version["3_versions/v1"].source_epoch;
}

function captureError(action) {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error("expected action to fail");
}

describe("accepted Style Master raw binding", () => {
  it("blocks missing selection before source or raw-plan materialization", async () => {
    const value = await fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const error = captureError(() => buildPureTargetRawPlan(value.runDir));

      expect(error).toMatchObject({
        code: "target_style_master_unavailable",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      expect(existsSync(value.paths.target_source_receipt)).toBe(false);
      expect(existsSync(value.paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps immutable selected bytes when the compatibility payload drifts", async () => {
    const value = await fixture({ accepted: true });
    try {
      const before = buildTargetRawGenerationProfile({
        runDir: value.runDir,
        deckDir: value.deck,
        receipt: candidateReceipt(value),
      });
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      const after = buildTargetRawGenerationProfile({
        runDir: value.runDir,
        deckDir: value.deck,
        receipt: candidateReceipt(value),
      });

      expect(after.style_master_reference.bytes).toEqual(before.style_master_reference.bytes);
      expect(after.style_master_reference.bytes).not.toEqual(localImageBytes(1));
      expect(after.style_master_reference.candidate_sha256).toBe(sha256(before.style_master_reference.bytes));
      expect(after.provider_profile_sha256).toBe(before.provider_profile_sha256);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("submits the plan-bound immutable bytes after compatibility payload drift", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const referenceBytes = Buffer.from(plan.style_master_reference.bytes);
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      let providerBody = null;
      let providerIdempotencyKey = null;
      let providerCalls = 0;
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, options) => {
          providerCalls += 1;
          providerBody = JSON.parse(options.body);
          providerIdempotencyKey = options.headers["Idempotency-Key"];
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ b64_json: VALID_PROVIDER_PNG.toString("base64") }] }),
          };
        },
      });

      await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"a".repeat(64)}`,
      });
      expect(providerBody.image).toBe(`data:image/png;base64,${referenceBytes.toString("base64")}`);
      expect(providerBody.image).not.toContain(localImageBytes(1).toString("base64"));
      expect(providerIdempotencyKey).toBe(`page-image-workflow-v1-${"a".repeat(64)}`);
      expect(providerCalls).toBe(1);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a tampered compiled provider input before credentials or transport work", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const request = structuredClone(plan.provider_requests_by_slide.DeckGo);
      request.compiled_provider_input.utf8 = `${request.compiled_provider_input.utf8}\ntampered`;
      let credentialCalls = 0;
      let transportCalls = 0;
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => {
          credentialCalls += 1;
          return { base_url: "https://image.example", api_key: "test-key" };
        },
        fetchImpl: async () => {
          transportCalls += 1;
          return providerJsonResponse({});
        },
      });

      await expect(submit({
        request,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"b".repeat(64)}`,
      })).rejects.toMatchObject({ code: "PAGE_IMAGE_PROVIDER_REQUEST_INVALID" });
      expect(credentialCalls).toBe(0);
      expect(transportCalls).toBe(0);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("serializes Pure provider clauses from the plan after registry drift", async () => {
    const value = await fixture({ accepted: true, motifs: ["connected-nodes"], relationship: "layer-stack" });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const expectedClauses = structuredClone(plan.provider_requests_by_slide.DeckGo.raw_contract.provider_clauses);
      const registryPath = join(value.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      const registry = readFileSync(registryPath, "utf8");
      const driftClause = "nested focused planes rising from broad base to focused apex";
      expect(registry).toContain("nested translucent planes rising from broad base to focused apex");
      writeFileSync(registryPath, registry.replace("nested translucent planes rising from broad base to focused apex", driftClause));

      let providerBody = null;
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, options) => {
          providerBody = JSON.parse(options.body);
          return providerJsonResponse({ data: [{ b64_json: VALID_PROVIDER_PNG.toString("base64") }] });
        },
      });
      await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"f".repeat(64)}`,
      });

      const serializedPrompt = JSON.parse(providerBody.prompt);
      expect(serializedPrompt.visual.recipe).toBe(expectedClauses.recipe);
      expect(serializedPrompt.visual.composition).toBe(expectedClauses.composition);
      expect(serializedPrompt.visual.motifs).toEqual(expectedClauses.motifs);
      expect(serializedPrompt.visual.relationship).toBe(expectedClauses.relationship);
      expect(serializedPrompt.provider_rendered_content.header).toMatchObject({ title: expect.any(String) });
      expect(providerBody.prompt).not.toContain(driftClause);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("resolves an accepted async task with the same credential and one original submit", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const requests = [];
      let pollCount = 0;
      let clock = 0;
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        taskPollTimeoutMs: 50,
        taskPollIntervalMs: 5,
        now: () => clock,
        sleep: async (milliseconds) => { clock += milliseconds; },
        fetchImpl: async (url, options) => {
          requests.push({ url, method: options.method, authorization: options.headers.Authorization });
          if (options.method === "POST") {
            return providerJsonResponse({ data: [{ task_id: "task_async_fixture" }] });
          }
          pollCount += 1;
          if (pollCount === 1) return providerJsonResponse({ data: { status: "pending" } });
          return providerJsonResponse({
            data: {
              status: "completed",
              result: { images: [{ bytes_base64: VALID_PROVIDER_PNG.toString("base64") }] },
            },
          });
        },
      });

      const result = await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"c".repeat(64)}`,
      });

      expect(result).toEqual(VALID_PROVIDER_PNG);
      expect(requests.map(({ url, method }) => ({ url, method }))).toEqual([
        { url: "https://image.example/images/generations", method: "POST" },
        { url: "https://image.example/tasks/task_async_fixture", method: "GET" },
        { url: "https://image.example/tasks/task_async_fixture", method: "GET" },
      ]);
      expect(requests.map((request) => request.authorization)).toEqual([
        "Bearer test-key",
        "Bearer test-key",
        "Bearer test-key",
      ]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("classifies terminal async responses while retaining interrupted and timed-out polls as unresolved", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const args = {
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"d".repeat(64)}`,
      };
      const asyncSubmit = (pollResponse, options = {}) => targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, requestOptions) => requestOptions.method === "POST"
          ? providerJsonResponse({ task_id: "task_async_fixture" })
          : pollResponse(),
        ...options,
      });

      const terminalError = await asyncSubmit(() => providerJsonResponse({ data: { status: "failed" } }))(args)
        .catch((error) => error);
      expect(terminalError).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID",
        page_image_known_failure: true,
        page_image_known_failure_facts: { response: { classification: "task_terminal_failure" } },
      });

      const missingMediaError = await asyncSubmit(() => providerJsonResponse({
        data: { status: "completed", result: { images: [] } },
      }))(args).catch((error) => error);
      expect(missingMediaError).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_MEDIA_INVALID",
        page_image_known_failure: true,
        page_image_known_failure_facts: { actual: { classification: "empty" } },
      });

      const httpError = await asyncSubmit(() => providerJsonResponse({ response: "withheld" }, 503))(args)
        .catch((error) => error);
      expect(httpError).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID",
        page_image_known_failure: true,
        page_image_known_failure_facts: { response: { classification: "http_error", http_status: 503 } },
      });

      const interruptedError = await asyncSubmit(() => ({
        ok: true,
        status: 200,
        text: async () => { throw new Error("poll body interrupted"); },
      }))(args).catch((error) => error);
      expect(interruptedError).toMatchObject({ code: "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED" });
      expect(interruptedError.page_image_known_failure).toBeUndefined();

      let clock = 0;
      const timeoutError = await asyncSubmit(
        () => providerJsonResponse({ data: { status: "pending" } }),
        {
          taskPollTimeoutMs: 5,
          taskPollIntervalMs: 2,
          now: () => clock,
          sleep: async (milliseconds) => { clock += milliseconds; },
        },
      )(args).catch((error) => error);
      expect(timeoutError).toMatchObject({ code: "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED" });
      expect(timeoutError.page_image_known_failure).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("classifies complete unusable responses without relabeling unresolved transport", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const args = {
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"b".repeat(64)}`,
      };
      let httpBodyRead = false;
      const http = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async () => ({
          ok: false,
          status: 503,
          text: async () => {
            httpBodyRead = true;
            return "PROVIDER_RESPONSE_BODY_SENTINEL";
          },
        }),
      });
      const httpError = await http(args).catch((error) => error);
      expect(httpError).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID",
        page_image_known_failure: true,
        page_image_known_failure_facts: {
          response: { classification: "http_error", http_status: 503 },
        },
      });
      expect(httpBodyRead).toBe(false);
      expect(JSON.stringify(httpError.page_image_known_failure_facts)).not.toContain("PROVIDER_RESPONSE_BODY_SENTINEL");

      const invalidJson = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => "PROVIDER_RESPONSE_BODY_SENTINEL" }),
      });
      const invalidJsonError = await invalidJson(args).catch((error) => error);
      expect(invalidJsonError).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID",
        page_image_known_failure: true,
        page_image_known_failure_facts: { response: { classification: "invalid_json" } },
      });
      expect(JSON.stringify(invalidJsonError.page_image_known_failure_facts)).not.toContain("PROVIDER_RESPONSE_BODY_SENTINEL");

      const noResponse = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async () => { throw new Error("connection ended"); },
      });
      const noResponseError = await noResponse(args).catch((error) => error);
      expect(noResponseError).toMatchObject({ code: "PAGE_IMAGE_PROVIDER_SUBMIT_FAILED" });
      expect(noResponseError.page_image_known_failure).toBeUndefined();

      const unreadableBody = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => { throw new Error("body interrupted"); } }),
      });
      const unreadableBodyError = await unreadableBody(args).catch((error) => error);
      expect(unreadableBodyError).toMatchObject({ code: "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED" });
      expect(unreadableBodyError.page_image_known_failure).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses one shared total budget for Page Image submit and task polling", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const args = {
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-v1-${"e".repeat(64)}`,
      };
      let clock = 0;
      const calls = [];
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        providerDeadlineMs: 10,
        taskPollIntervalMs: 5,
        now: () => clock,
        sleep: async (milliseconds) => { clock += milliseconds; },
        fetchImpl: async (_url, options) => {
          calls.push(options.method);
          if (options.method === "POST") {
            clock += 7;
            return providerJsonResponse({ task_id: "shared_deadline_task" });
          }
          return providerJsonResponse({ data: { status: "pending" } });
        },
      });

      const error = await submit(args).catch((value) => value);
      expect(error).toMatchObject({ code: "PAGE_IMAGE_PROVIDER_RESPONSE_UNRESOLVED" });
      expect(calls).toEqual(["POST", "GET"]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("treats selection replacement as raw rebuild debt without advancing source epoch", async () => {
    const value = await fixture({ accepted: true });
    try {
      const first = buildPureTargetRawPlan(value.runDir);
      const rawPlanBefore = readFileSync(value.paths.target_raw_plan);
      expect(sourceEpoch(value)).toBe(1);

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      const replacement = await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(value.runDir));
      const stateAfterSelection = readFileSync(statePath(value.deck));
      expect(replacement.accepted.selection_sha256).not.toBe(value.result.accepted.selection_sha256);

      const error = captureError(() => readPureTargetStoredPlanContext(value.runDir));
      expect(error).toMatchObject({
        code: "target_raw_plan_stale",
        next_action: "rebuild_target_raw_plan",
      });
      expect(readFileSync(value.paths.target_raw_plan)).toEqual(rawPlanBefore);
      expect(readFileSync(statePath(value.deck))).toEqual(stateAfterSelection);
      expect(sourceEpoch(value)).toBe(first.source_epoch);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("routes style-intent, context, and immutable-byte drift to Style Master without raw mutation", async () => {
    const intent = await fixture({ accepted: true });
    const context = await fixture({ accepted: true });
    const bytes = await fixture({ accepted: true });
    try {
      buildPureTargetRawPlan(intent.runDir);
      const intentRawPlan = readFileSync(intent.paths.target_raw_plan);
      const intentState = readFileSync(statePath(intent.deck));
      writeFileSync(styleAsset(intent.runDir, STYLE_MASTER_PROMPT), "A changed visual direction.\n", "utf8");
      expect(captureError(() => readPureTargetStoredPlanContext(intent.runDir))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(intent.paths.target_raw_plan)).toEqual(intentRawPlan);
      expect(readFileSync(statePath(intent.deck))).toEqual(intentState);
      expect(sourceEpoch(intent)).toBe(1);

      buildPureTargetRawPlan(context.runDir);
      const contextRawPlan = readFileSync(context.paths.target_raw_plan);
      const contextState = readFileSync(statePath(context.deck));
      const registryPath = join(context.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet luminous depth"));
      expect(captureError(() => buildTargetRawGenerationProfile({
        runDir: context.runDir,
        deckDir: context.deck,
        receipt: candidateReceipt(context),
      }))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(context.paths.target_raw_plan)).toEqual(contextRawPlan);
      expect(readFileSync(statePath(context.deck))).toEqual(contextState);
      expect(sourceEpoch(context)).toBe(1);

      buildPureTargetRawPlan(bytes.runDir);
      const bytesRawPlan = readFileSync(bytes.paths.target_raw_plan);
      const bytesState = readFileSync(statePath(bytes.deck));
      const candidatePath = styleMasterStorePaths(bytes.runDir, {
        plan_sha256: bytes.result.plan.plan_sha256,
        candidate_id: "local-existing",
        candidate_media_type: "image/png",
      }).candidate_image;
      writeFileSync(candidatePath, localImageBytes(1));
      expect(captureError(() => readPureTargetStoredPlanContext(bytes.runDir))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(bytes.paths.target_raw_plan)).toEqual(bytesRawPlan);
      expect(readFileSync(statePath(bytes.deck))).toEqual(bytesState);
      expect(sourceEpoch(bytes)).toBe(1);
    } finally {
      rmSync(intent.root, { recursive: true, force: true });
      rmSync(context.root, { recursive: true, force: true });
      rmSync(bytes.root, { recursive: true, force: true });
    }
  });

  it("treats a legacy raw profile without selection binding as rebuild debt", async () => {
    const value = await fixture({ accepted: true });
    try {
      buildPureTargetRawPlan(value.runDir);
      const stored = JSON.parse(readFileSync(value.paths.target_raw_plan, "utf8"));
      const compatibilityBytes = readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE));
      const legacyProfile = {
        schema: "page-image-target-raw-generation-profile-v1",
        provider: { provider: "image2", model: "gpt-image-2", api_revision: "page-image-workflow-v1" },
        output: { format: "png", width: 2000, height: 1125 },
        reference_transport: { style_master: "image-reference-v1", identity_reference: "none" },
        effective_style_master: { sha256: sha256(compatibilityBytes), bytes: compatibilityBytes.length },
      };
      const legacyProviderProfileSha = canonicalJsonSha256(legacyProfile);
      const legacyPlan = {
        ...stored,
        provider_profile_sha256: legacyProviderProfileSha,
        authorization_scope_sha256: canonicalJsonSha256({
          source_receipt_sha256: stored.source_receipt_sha256,
          workflow: stored.workflow,
          provider_profile_sha256: legacyProviderProfileSha,
          ordered_slide_ids: stored.ordered_slide_ids,
          raw_contracts_by_slide: Object.fromEntries(stored.items.map((item) => [item.slide_id, item.raw_contract_sha256])),
        }),
      };
      writeFileSync(value.paths.target_raw_plan, `${JSON.stringify(legacyPlan)}\n`);
      const legacyBytes = readFileSync(value.paths.target_raw_plan);
      const stateBefore = readFileSync(statePath(value.deck));

      expect(captureError(() => readPureTargetStoredPlanContext(value.runDir))).toMatchObject({
        code: "target_raw_plan_stale",
        next_action: "rebuild_target_raw_plan",
      });
      expect(readFileSync(value.paths.target_raw_plan)).toEqual(legacyBytes);
      expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      expect(sourceEpoch(value)).toBe(1);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});

describe("Style Master current Image2 transport", () => {
  it("resolves inline and same-invocation task media without a second submit", async () => {
    const inlineCalls = [];
    const inline = styleMasterSubmitFactory({
      fetchImpl: async (_url, options) => {
        inlineCalls.push(options.method);
        return providerJsonResponse({ data: [{ b64_json: VALID_STYLE_MASTER_PNG.toString("base64") }] });
      },
    });
    await expect(inline(styleMasterTransportRequest())).resolves.toEqual(VALID_STYLE_MASTER_PNG);
    expect(inlineCalls).toEqual(["POST"]);

    let clock = 0;
    let polls = 0;
    const asyncCalls = [];
    const asyncSubmit = styleMasterSubmitFactory({
      providerDeadlineMs: 50,
      taskPollIntervalMs: 5,
      now: () => clock,
      sleep: async (milliseconds) => { clock += milliseconds; },
      fetchImpl: async (_url, options) => {
        asyncCalls.push(options.method);
        if (options.method === "POST") return providerJsonResponse({ task_id: "style_master_task" });
        polls += 1;
        if (polls === 1) return providerJsonResponse({ data: { status: "pending" } });
        return providerJsonResponse({
          data: {
            status: "completed",
            result: { images: [{ b64_json: VALID_STYLE_MASTER_PNG.toString("base64") }] },
          },
        });
      },
    });

    await expect(asyncSubmit(styleMasterTransportRequest())).resolves.toEqual(VALID_STYLE_MASTER_PNG);
    expect(asyncCalls).toEqual(["POST", "GET", "GET"]);
  });

  it("classifies received terminal, malformed, and invalid-media responses as known failures", async () => {
    const terminal = styleMasterSubmitFactory({
      fetchImpl: async (_url, options) => options.method === "POST"
        ? providerJsonResponse({ task_id: "style_master_task" })
        : providerJsonResponse({ data: { status: "failed" } }),
    });
    const terminalError = await terminal(styleMasterTransportRequest()).catch((value) => value);
    expect(terminalError).toMatchObject({
      code: "style_master_provider_response_invalid",
      style_master_known_failure: true,
      style_master_known_failure_facts: { response: { classification: "task_terminal_failure" } },
    });

    const malformed = styleMasterSubmitFactory({
      fetchImpl: async () => ({ ok: true, status: 200 }),
    });
    const malformedError = await malformed(styleMasterTransportRequest()).catch((value) => value);
    expect(malformedError).toMatchObject({
      code: "style_master_provider_response_invalid",
      style_master_known_failure: true,
      style_master_known_failure_facts: { response: { classification: "task_response_invalid" } },
    });

    const invalidMedia = styleMasterSubmitFactory({
      fetchImpl: async () => providerJsonResponse({ data: [{ b64_json: Buffer.from("not a PNG").toString("base64") }] }),
    });
    const invalidMediaError = await invalidMedia(styleMasterTransportRequest()).catch((value) => value);
    expect(invalidMediaError).toMatchObject({
      code: "style_master_provider_media_invalid",
      style_master_known_failure: true,
    });
  });

  it("keeps submit aborts and shared-budget exhaustion unresolved with one provider POST", async () => {
    let abortCalls = 0;
    let abortObserved = false;
    const aborted = styleMasterSubmitFactory({
      providerDeadlineMs: 20,
      fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
        abortCalls += 1;
        options.signal.addEventListener("abort", () => {
          abortObserved = true;
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        }, { once: true });
      }),
    });
    const abortError = await aborted(styleMasterTransportRequest()).catch((value) => value);
    expect(abortError).toMatchObject({ code: "style_master_provider_submit_failed" });
    expect(abortCalls).toBe(1);
    expect(abortObserved).toBe(true);

    let unreadableCalls = 0;
    const unreadableBody = styleMasterSubmitFactory({
      providerDeadlineMs: 20,
      fetchImpl: async () => {
        unreadableCalls += 1;
        return { ok: true, status: 200, text: async () => new Promise(() => {}) };
      },
    });
    const unreadableBodyError = await unreadableBody(styleMasterTransportRequest()).catch((value) => value);
    expect(unreadableBodyError).toMatchObject({ code: "style_master_provider_response_unresolved" });
    expect(unreadableCalls).toBe(1);

    let clock = 0;
    const deadlineCalls = [];
    const exhausted = styleMasterSubmitFactory({
      providerDeadlineMs: 10,
      taskPollIntervalMs: 5,
      now: () => clock,
      sleep: async (milliseconds) => { clock += milliseconds; },
      fetchImpl: async (_url, options) => {
        deadlineCalls.push(options.method);
        if (options.method === "POST") {
          clock += 7;
          return providerJsonResponse({ task_id: "style_master_deadline_task" });
        }
        return providerJsonResponse({ data: { status: "pending" } });
      },
    });
    const deadlineError = await exhausted(styleMasterTransportRequest()).catch((value) => value);
    expect(deadlineError).toMatchObject({ code: "style_master_provider_response_unresolved" });
    expect(deadlineCalls).toEqual(["POST", "GET"]);
  });
});
