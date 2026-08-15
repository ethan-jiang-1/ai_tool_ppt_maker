import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveImage2Credentials } from "../../ppt_maker_harness/scripts/shared/image2/credentials.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import {
  cleanupRealProviderPureFixture,
  createRealProviderPureFixture,
  formatRealProviderGenerationFailure,
  loadRealProviderE2EEnvironment,
  positionRealProviderAuthorizeNode,
  readSafePptFlowJson,
  REAL_PROVIDER_SLIDE_ID,
} from "../../tests_e2e/shared/real-provider/real_provider_e2e_fixture.mjs";

let originalRuntimeProfileId;

beforeEach(() => {
  originalRuntimeProfileId = process.env.IMAGE2_PROVIDER_PROFILE_ID;
  process.env.IMAGE2_PROVIDER_PROFILE_ID = "test-image2-profile";
});

afterEach(() => {
  if (originalRuntimeProfileId === undefined) delete process.env.IMAGE2_PROVIDER_PROFILE_ID;
  else process.env.IMAGE2_PROVIDER_PROFILE_ID = originalRuntimeProfileId;
});

const require = createRequire(import.meta.url);
const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const REAL_ENTRY = "tests_e2e/shared/real-provider/test_real_provider_e2e_acceptance.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "", PPTMAKER_RUN_REAL_E2E: "" },
    timeout: 30_000,
  });
}

describe("real provider E2E acceptance guards", () => {
  it("uses the existing one-endpoint credential resolver without a network attempt", () => {
    expect(() => resolveImage2Credentials({ env: {} })).toThrow(/IMAGE2_API_KEY/);
    expect(() => resolveImage2Credentials({ env: { IMAGE2_API_KEY: "test-key" } })).toThrow(/base URL/);
    expect(() => resolveImage2Credentials({ env: { IMAGE2_API_KEY: "test-key", IMAGE2_BASE_URL: "https://one.example,https://two.example" } })).toThrow(/one endpoint/);
    expect(resolveImage2Credentials({ env: { IMAGE2_API_KEY: "test-key", IMAGE2_BASE_URL: "https://image.example/v1/" } })).toEqual({
      api_key: "test-key",
      base_url: "https://image.example/v1",
    });
  });

  it("loads the project dotenv before live credential preflight", () => {
    const root = mkdtempSync(join(tmpdir(), "real-provider-dotenv-"));
    const originalKey = process.env.IMAGE2_API_KEY;
    const originalBaseUrl = process.env.IMAGE2_BASE_URL;
    try {
      delete process.env.IMAGE2_API_KEY;
      delete process.env.IMAGE2_BASE_URL;
      writeFileSync(join(root, ".env"), "IMAGE2_API_KEY=test-key\nIMAGE2_BASE_URL=https://image.example/v1\n", "utf8");

      expect(loadRealProviderE2EEnvironment(root)).toBe(join(root, ".env"));
      expect(resolveImage2Credentials()).toEqual({ api_key: "test-key", base_url: "https://image.example/v1" });
    } finally {
      if (originalKey === undefined) delete process.env.IMAGE2_API_KEY;
      else process.env.IMAGE2_API_KEY = originalKey;
      if (originalBaseUrl === undefined) delete process.env.IMAGE2_BASE_URL;
      else process.env.IMAGE2_BASE_URL = originalBaseUrl;
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects known provider failures without retaining provider content", () => {
    const diagnostic = formatRealProviderGenerationFailure({
      outcome: "known_failure",
      provider_failure: {
        classification: "http_error",
        http_status: 503,
        provider_body: "PROVIDER_BODY_SENTINEL",
      },
      provider_media: { actual: { classification: "invalid_png", bytes: "PROVIDER_BODY_SENTINEL" } },
    });
    expect(diagnostic).toBe("outcome=known_failure,provider_failure=http_error:503,provider_media=invalid_png");
    expect(diagnostic).not.toContain("PROVIDER_BODY_SENTINEL");
  });

  it("constructs and cleans a provider-free one-page Pure fixture", async () => {
    const fixture = await createRealProviderPureFixture();
    try {
      expect(relative(tmpdir(), fixture.root).startsWith("..")).toBe(false);
      expect(fixture.deck).toContain("deck_real_provider_e2e");
      expect(fixture.runDir).toContain("3_versions");

      const plan = readSafePptFlowJson(flow(["image2", "plan", fixture.runDir]), "image2 plan");
      expect(plan).toMatchObject({ workflow: "pure", ordered_slide_ids: [REAL_PROVIDER_SLIDE_ID] });
      const pilot = readSafePptFlowJson(flow([
        "image2", "pilot", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", REAL_PROVIDER_SLIDE_ID,
      ]), "image2 pilot");
      expect(pilot.batch).toMatchObject({ paid_submission_slide_ids: [REAL_PROVIDER_SLIDE_ID], maximum_submissions: 1 });

      expect(positionRealProviderAuthorizeNode(fixture, pilot.batch)).toBe("authorize-target-pure-pilot");
      const authorization = readSafePptFlowJson(flow([
        "image2", "authorize", fixture.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ]), "image2 authorize");
      expect(authorization).toMatchObject({
        maximum_submissions: 1,
        next_action: { action_id: "generate_progressive_raw_item" },
      });

      const direct = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.plan_hash });
      expect(direct.grants).toHaveLength(1);
      expect(direct.attempts).toEqual([]);
      expect(direct.pilot_evidence).toEqual([]);
      expect(direct.pilot_decisions).toEqual([]);
      expect(direct.complete_reviews).toEqual([]);
      expect(direct.accepted_evidence).toEqual([]);
      expect(existsSync(fixture.paths.target_raw_evidence)).toBe(false);
      expect(existsSync(fixture.paths.target_final_manifest)).toBe(false);
    } finally {
      cleanupRealProviderPureFixture(fixture);
    }
    expect(existsSync(fixture.root)).toBe(false);
  });

  it("short-circuits malformed local source before raw planning or submission", async () => {
    const fixture = await createRealProviderPureFixture();
    try {
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), "not a valid target source\n", "utf8");
      expect(flow(["image2", "plan", fixture.runDir]).status).not.toBe(0);
      expect(existsSync(fixture.paths.target_raw_plan)).toBe(false);
      expect(existsSync(fixture.paths.target_raw_evidence)).toBe(false);
      expect(existsSync(fixture.paths.target_final_manifest)).toBe(false);
    } finally {
      cleanupRealProviderPureFixture(fixture);
    }
  });

  it("redacts child output from public-command failures", () => {
    const stderr = JSON.stringify({
      ok: false,
      code: "FAILED",
      message: "prompt=secret provider body",
      hint: "response=secret provider body",
      where: "image2",
      diagnostic: {
        schema: "pptmaker-cli-diagnostic",
        category: "provider",
        operation: "generate",
        reason: { kind: "provider_outcome_unknown", actual: "secret provider body" },
        next: { action: "reconcile", requires_human: false, default: "Inspect the owner-issued reconciliation action." },
      },
    });
    expect(() => readSafePptFlowJson({ status: 1, stdout: "prompt=secret provider body", stderr }, "image2 generate"))
      .toThrow("image2 generate failed with exit status 1 [provider,generate,provider_outcome_unknown,reconcile]");
  });

  it("skips broad E2E discovery when the live opt-in is absent", () => {
    const vitest = require.resolve("vitest/vitest.mjs");
    const result = spawnSync(process.execPath, [vitest, "run", "--config", "vitest.e2e.config.mjs", REAL_ENTRY], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "", PPTMAKER_RUN_REAL_E2E: "" },
      timeout: 30_000,
    });
    expect(result.status, result.stderr).toBe(0);
  });
});
