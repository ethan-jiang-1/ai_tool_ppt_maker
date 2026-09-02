// Tests: openspec/specs/image-generation/spec.md
// Tests: openspec/specs/style-master-generation/spec.md
// Tests: openspec/specs/image2-lab/spec.md
// Tests: openspec/specs/pipeline-orchestration/spec.md
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalJson, canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import {
  progressiveRawStorePaths,
  reclaimProgressiveRawPlanLockIfStale,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import {
  authorizeProgressiveRawBatch,
  generateProgressiveRawItem,
  inspectProgressiveRawLifecycle,
  planProgressiveRawPilot,
  prepareProgressiveRawPilotEvidence,
  publishProgressiveRawWorkPlan,
  reconcileProgressiveRawAttempt,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import {
  createProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";
import { PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA, PAGE_IMAGE_PROVIDER_REQUEST_SCHEMA } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_provider_request_binding.mjs";
import { targetPageImageFailure } from "../../../ppt_maker_harness/scripts/shared/cli/cli_diagnostics.mjs";

const digest = (letter) => letter.repeat(64);
const DEAD_PID = 2_147_483_647; // provably not a live process on any supported host
const ALIVE_PID = process.pid;

function fixtureGenerationProfile(token = "b") {
  return Object.freeze({
    provider: { model: `fixture-image-model-${token}` },
    output: { format: "png", width: 1600, height: 900 },
  });
}

function fixtureRawContract(slideId) {
  return Object.freeze({ schema: "fixture-page-image-raw-contract", slide_id: slideId });
}

function fixtureCompiledProviderInput(slideId, rawContract, generationProfile) {
  const utf8 = canonicalJson({
    schema: "fixture-page-image-provider-input",
    slide_id: slideId,
    raw_contract_sha256: canonicalJsonSha256(rawContract),
    generation_profile_sha256: canonicalJsonSha256(generationProfile),
  });
  return Object.freeze({
    schema: PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA,
    utf8,
    sha256: sha256Bytes(Buffer.from(utf8, "utf8")),
  });
}

function fixtureProviderRequests(plan) {
  const generationProfile = fixtureGenerationProfile();
  return Object.fromEntries(plan.items.map((item) => {
    const rawContract = fixtureRawContract(item.slide_id);
    const compiledProviderInput = fixtureCompiledProviderInput(item.slide_id, rawContract, generationProfile);
    return [item.slide_id, {
      schema: PAGE_IMAGE_PROVIDER_REQUEST_SCHEMA,
      slide_id: item.slide_id,
      raw_contract: rawContract,
      raw_contract_sha256: canonicalJsonSha256(rawContract),
      generation_profile: generationProfile,
      compiled_provider_input: compiledProviderInput,
    }];
  }));
}

function fixturePlan(count = 2) {
  const ids = Array.from({ length: count }, (_value, index) => `Slide${String(index + 1).padStart(2, "0")}`);
  const generationProfile = fixtureGenerationProfile();
  const provider_profile_sha256 = canonicalJsonSha256(generationProfile);
  return createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256: digest("a"),
    source_epoch: 1,
    workflow: "pure",
    provider_profile_sha256,
    effective_style_master_sha256: digest("c"),
    source_execution_sha256: digest("d"),
    ordered_slide_ids: ids,
    items: ids.map((slide_id) => {
      const rawContract = fixtureRawContract(slide_id);
      const compiledProviderInput = fixtureCompiledProviderInput(slide_id, rawContract, generationProfile);
      return {
        slide_id,
        raw_contract_sha256: canonicalJsonSha256(rawContract),
        provider_input_binding: {
          ...pageImageProviderInputBinding({ workflow: "pure" }),
          compiled_provider_input_sha256: compiledProviderInput.sha256,
          generation_profile_sha256: provider_profile_sha256,
        },
      };
    }),
  });
}

function fixtureRun() {
  const root = mkdtempSync(join(tmpdir(), "progressive-store-lock-"));
  const deck = join(root, "deck_lock_fixture");
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  return { root, deck, runDir };
}

/** Manually plant a plan lock with an owner record for the given pid. */
function plantPlanLock(runDir, plan, pid) {
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256 });
  mkdirSync(paths.plan_lock, { recursive: false });
  writeFileSync(join(paths.plan_lock, "owner.json"), canonicalJson({
    pid,
    started_at: "2026-08-16T00:00:00.000Z",
    scope: "test",
  }));
  return paths.plan_lock;
}

/** Drive a partial Pilot flow until one item is left as a persisted submitted attempt. */
async function seededSubmittedAttempt(runDir) {
  const plan = fixturePlan(6);
  publishProgressiveRawWorkPlan({ runDir, plan });
  const pilot = await planProgressiveRawPilot({
    runDir,
    workflow: "pure",
    plan_hash: plan.sha256,
    slide_ids: ["Slide01", "Slide02"],
  });
  await authorizeProgressiveRawBatch({
    runDir,
    workflow: "pure",
    plan_hash: plan.sha256,
    batch_hash: pilot.batch.batch_hash,
  });
  await expect(generateProgressiveRawItem({
    runDir,
    workflow: "pure",
    plan_hash: plan.sha256,
    batch_hash: pilot.batch.batch_hash,
    provider_requests_by_slide: fixtureProviderRequests(plan),
    submit: async () => {
      throw new Error("provider transport dropped the request");
    },
  })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
  const inspection = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
  expect(inspection.primary_action.action_id).toBe("reconcile_progressive_raw_attempt");
  return {
    plan,
    batch_hash: pilot.batch.batch_hash,
    attempt_sha256: inspection.primary_action.attempt_sha256,
  };
}

describe("progressive store lock diagnostics", () => {
  it("leaves no lock directory behind after a normal mutation", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      const paths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256 });
      publishProgressiveRawWorkPlan({ runDir, plan });
      expect(existsSync(paths.plan_lock)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports a live lock owner with a wait next action", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      plantPlanLock(runDir, plan, ALIVE_PID);
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      })).rejects.toMatchObject({
        code: "progressive_raw_store_locked",
        next_action: { action_id: "wait_progressive_raw_completion", requires_human: false },
        details: { lock_owner: { alive: true, owner_record_present: true } },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports a dead lock owner without a reconcilable attempt as an anomaly", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      plantPlanLock(runDir, plan, DEAD_PID);
      const error = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      }).then(() => null, (caught) => caught);
      expect(error?.code).toBe("progressive_raw_store_locked");
      expect(error?.next_action).toBeUndefined();
      expect(error?.details?.lock_owner).toMatchObject({ alive: false, owner_record_present: true, anomaly: true });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("offers the exact reconcile selector for a dead owner with one submitted attempt", async () => {
    const { root, runDir } = fixtureRun();
    try {
      const seeded = await seededSubmittedAttempt(runDir);
      plantPlanLock(runDir, seeded.plan, DEAD_PID);
      const error = await prepareProgressiveRawPilotEvidence({
        runDir,
        workflow: "pure",
        plan_hash: seeded.plan.sha256,
        batch_hash: seeded.batch_hash,
        publish: async () => {
          throw new Error("publish must not run under a dead lock");
        },
      }).then(() => null, (caught) => caught);
      expect(error?.code).toBe("progressive_raw_store_locked");
      expect(error?.next_action).toMatchObject({
        action_id: "reconcile_progressive_raw_attempt",
        attempt_sha256: seeded.attempt_sha256,
      });
      expect(error?.details?.lock_owner).toMatchObject({ alive: false, anomaly: false });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reconcile reclaims a provably dead lock and terminalizes the exact attempt", async () => {
    const { root, runDir } = fixtureRun();
    try {
      const seeded = await seededSubmittedAttempt(runDir);
      plantPlanLock(runDir, seeded.plan, DEAD_PID);
      expect(reclaimProgressiveRawPlanLockIfStale(runDir, { plan_sha256: seeded.plan.sha256 }).reclaimed).toBe(true);

      const reconciled = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: seeded.plan.sha256,
        attempt_sha256: seeded.attempt_sha256,
        lookup: async () => Buffer.from("recovered raw bytes"),
      });
      expect(reconciled).toMatchObject({ reconciled: true, outcome: "succeeded" });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action.action_id).not.toBe("reconcile_progressive_raw_attempt");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reconcile never reclaims a live or unprovable lock", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const paths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256 });
      plantPlanLock(runDir, plan, ALIVE_PID);
      expect(reclaimProgressiveRawPlanLockIfStale(runDir, { plan_sha256: plan.sha256 }).reclaimed).toBe(false);
      rmSync(join(paths.plan_lock, "owner.json"), { force: true });
      expect(reclaimProgressiveRawPlanLockIfStale(runDir, { plan_sha256: plan.sha256 }).reclaimed).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("maps the three store-lock branches to distinct CLI envelopes with reconcile only in branch 2", () => {
    const route = { run_dir: "/tmp/run", deck_dir: "/tmp/deck", workflow: "pure" };
    const plan = digest("p");
    const attempt = digest("t");

    const waitEnvelope = targetPageImageFailure("pilot-review", route, {
      code: "progressive_raw_store_locked",
      next_action: { action_id: "wait_progressive_raw_completion", requires_human: false },
      details: { lock_owner: { pid: 123, alive: true, owner_record_present: true } },
    });
    expect(waitEnvelope.diagnostic.next.action).toBe("wait_then_reread");
    expect(waitEnvelope.diagnostic.next.requires_human).toBe(false);
    expect(waitEnvelope.diagnostic.category).toBe("gate");
    expect(waitEnvelope.diagnostic.subject).toMatchObject({ kind: "progressive_raw_lock", id: "123" });

    const reconcileEnvelope = targetPageImageFailure("pilot-review", route, {
      code: "progressive_raw_store_locked",
      next_action: { action_id: "reconcile_progressive_raw_attempt", kind: "repair", plan_hash: plan, attempt_sha256: attempt },
      details: { lock_owner: { pid: 124, alive: false, owner_record_present: true, anomaly: false } },
    });
    expect(reconcileEnvelope.diagnostic.next.action).toBe("reconcile");
    expect(reconcileEnvelope.diagnostic.subject).toMatchObject({ kind: "progressive_raw_attempt", id: attempt });
    expect(reconcileEnvelope.diagnostic.category).toBe("artifact");

    const anomalyEnvelope = targetPageImageFailure("pilot-review", route, {
      code: "progressive_raw_store_locked",
      details: { lock_owner: { pid: 125, alive: false, owner_record_present: true, anomaly: true } },
    });
    expect(anomalyEnvelope.diagnostic.next.action).toBe("report_internal");
    expect(anomalyEnvelope.diagnostic.category).toBe("internal");

    const conservativeEnvelope = targetPageImageFailure("pilot-review", route, {
      code: "progressive_raw_store_locked",
      details: { lock_owner: { pid: null, alive: null, owner_record_present: false } },
    });
    expect(conservativeEnvelope.diagnostic.next.action).toBe("wait_then_reread");

    for (const envelope of [waitEnvelope, reconcileEnvelope, anomalyEnvelope, conservativeEnvelope]) {
      expect(envelope.hint).toContain("do not delete the lock");
      expect(envelope.hint).toContain("resubmit");
    }
    for (const envelope of [waitEnvelope, anomalyEnvelope, conservativeEnvelope]) {
      expect(envelope.diagnostic.next.action).not.toBe("reconcile");
    }
  });
});
