import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { resolveImage2Credentials } from "../../../ppt_maker_harness/scripts/shared/image2/credentials.mjs";
import { inspectExactPageImagePng, PAGE_IMAGE_NATIVE_RAW_PNG } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_media_contract.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { realE2EEnabled } from "../../../tests/contracts/run_selected_verification.mjs";
import {
  cleanupRealProviderPureFixture,
  createRealProviderPureFixture,
  formatRealProviderGenerationFailure,
  loadRealProviderE2EEnvironment,
  positionRealProviderAuthorizeNode,
  readSafePptFlowJson,
  REAL_PROVIDER_SLIDE_ID,
} from "./real_provider_e2e_fixture.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const describeRealE2E = realE2EEnabled() ? describe : describe.skip;

function flow(args, env) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 540_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", () => {
      clearTimeout(timer);
      reject(new Error("ppt_flow could not start"));
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      resolveResult({ status, signal, stdout, stderr });
    });
  });
}

describeRealE2E("real provider Pure raw acceptance", () => {
  it("submits one synthetic page and stops before Page Image acceptance", async () => {
    loadRealProviderE2EEnvironment();
    const credentials = resolveImage2Credentials();
    const fixture = await createRealProviderPureFixture();
    const env = {
      IMAGE2_API_KEY: credentials.api_key,
      IMAGE2_BASE_URL: credentials.base_url,
    };
    try {
      const plan = readSafePptFlowJson(await flow(["image2", "plan", fixture.runDir], env), "image2 plan");
      expect(plan).toMatchObject({
        workflow: "pure",
        ordered_slide_ids: [REAL_PROVIDER_SLIDE_ID],
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });

      const pilot = readSafePptFlowJson(await flow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", REAL_PROVIDER_SLIDE_ID,
      ], env), "image2 pilot");
      expect(pilot).toMatchObject({
        batch: {
          kind: "pilot",
          paid_submission_slide_ids: [REAL_PROVIDER_SLIDE_ID],
          maximum_submissions: 1,
        },
      });

      const nodeId = positionRealProviderAuthorizeNode(fixture, pilot.batch);
      const authorization = readSafePptFlowJson(await flow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], env), "image2 authorize");
      expect(authorization).toMatchObject({
        maximum_submissions: 1,
        controller_handoff: { node_id: nodeId },
      });

      const generated = readSafePptFlowJson(await flow([
        "image2", "generate", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], env), "image2 generate");
      if (generated?.outcome !== "succeeded") {
        throw new Error(`image2 generate did not return succeeded [${formatRealProviderGenerationFailure(generated)}]`);
      }
      expect(generated).toMatchObject({
        item: REAL_PROVIDER_SLIDE_ID,
        outcome: "succeeded",
        materialization_provenance_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        progress: { materialized: 1, unsubmitted: 0 },
      });

      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
      expect(direct.grants).toHaveLength(1);
      expect(direct.grants[0].record.maximum_submissions).toBe(1);
      const chain = direct.attempts.filter(({ record }) => record.slide_id === REAL_PROVIDER_SLIDE_ID);
      expect(chain).toHaveLength(3);
      const claimed = chain.find(({ record }) => record.status === "claimed");
      const submitted = chain.find(({ record }) => record.status === "submitted");
      const succeeded = chain.find(({ record }) => record.status === "succeeded");
      expect(claimed).toBeDefined();
      expect(submitted?.record).toMatchObject({ previous_attempt_sha256: claimed.sha });
      expect(succeeded?.record).toMatchObject({
        status: "succeeded",
        slide_id: REAL_PROVIDER_SLIDE_ID,
        previous_attempt_sha256: submitted.sha,
        materialization_provenance_sha256: generated.materialization_provenance_sha256,
      });
      expect(chain.filter(({ record }) => record.status === "submitted")).toHaveLength(1);
      expect(direct.materializations).toHaveLength(1);
      expect(direct.materializations[0].provenance.record).toMatchObject({
        kind: "provider",
        slide_id: REAL_PROVIDER_SLIDE_ID,
      });
      expect(inspectExactPageImagePng(direct.materializations[0].bytes, PAGE_IMAGE_NATIVE_RAW_PNG)).toMatchObject({ ok: true });
      expect(direct.pilot_evidence).toEqual([]);
      expect(direct.pilot_decisions).toEqual([]);
      expect(direct.complete_reviews).toEqual([]);
      expect(direct.accepted_evidence).toEqual([]);
      expect(existsSync(fixture.paths.target_raw_evidence)).toBe(false);
      expect(existsSync(fixture.paths.target_final_manifest)).toBe(false);
    } finally {
      cleanupRealProviderPureFixture(fixture);
    }
  }, 600_000);
});
