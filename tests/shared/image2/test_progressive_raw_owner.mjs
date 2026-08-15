import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import {
  PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA,
  PROGRESSIVE_RAW_BATCH_GRANT_SCHEMA,
  PROGRESSIVE_RAW_BATCH_SCHEMA,
  PROGRESSIVE_RAW_COMPLETE_REVIEW_SCHEMA,
  PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA,
  PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA,
  PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA,
  createProgressiveRawBatch,
  createProgressiveRawItemAttempt,
  createProgressiveRawMaterializationProvenance,
  createProgressiveRawScopeHead,
  createProgressiveRawWorkPlan,
  progressiveRawAttemptKey,
  progressiveRawIdempotencyKey,
  validateProgressiveRawBatch,
  validateProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import { sha256Bytes } from "../../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import {
  findProgressiveRawCompleteReviewBySha,
  findProgressiveRawMaterializationByProvenance,
  publishProgressiveRawMaterialization,
  publishProgressiveRawStagedPlan,
  progressiveRawStorePaths,
  readHistoricalCutoverProgressiveRawPlanDirectRecords,
  readProgressiveRawPlanDirectRecords,
  readProgressiveRawScopeHead,
  stageProgressiveRawPlanContainer,
  writeProgressiveRawItemAttempt,
  writeProgressiveRawScopeHeadCas,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";
import {
  PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA,
  PAGE_IMAGE_PROVIDER_REQUEST_SCHEMA,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_provider_request_binding.mjs";
import {
  acceptProgressiveRawCompleteReview,
  acceptProgressiveRawPilot,
  authorizeProgressiveRawBatch,
  generateProgressiveRawItem,
  inspectProgressiveRawLifecycle,
  planProgressiveRawExpansion,
  planProgressiveRawPilot,
  prepareProgressiveRawCompleteReview,
  prepareProgressiveRawPilotEvidence,
  publishProgressiveRawWorkPlan,
  readCurrentProgressiveRawCompleteReview,
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";

const digest = (letter) => letter.repeat(64);
const fixtureProfilesBySha = new Map();

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
  const generationProfile = fixtureProfilesBySha.get(plan.provider_profile_sha256);
  if (!generationProfile) throw new Error("fixture provider profile is unavailable for the plan");
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

function fixturePlan(count = 1, {
  workflow = "pure",
  source_receipt_sha256 = digest("a"),
  source_epoch = 1,
  profile_token = "b",
  effective_style_master_sha256 = digest("c"),
  source_execution_sha256 = digest("d"),
  task_mandate_sha256 = undefined,
  pageDesignSystem = null,
} = {}) {
  const ids = Array.from({ length: count }, (_value, index) => `Slide${String(index + 1).padStart(2, "0")}`);
  const generationProfile = fixtureGenerationProfile(profile_token);
  const provider_profile_sha256 = canonicalJsonSha256(generationProfile);
  fixtureProfilesBySha.set(provider_profile_sha256, generationProfile);
  return createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256,
    source_epoch,
    workflow,
    provider_profile_sha256,
    effective_style_master_sha256,
    source_execution_sha256,
    ...(task_mandate_sha256 === undefined ? {} : { task_mandate_sha256 }),
    ordered_slide_ids: ids,
    items: ids.map((slide_id) => {
      const rawContract = fixtureRawContract(slide_id);
      const compiledProviderInput = fixtureCompiledProviderInput(slide_id, rawContract, generationProfile);
      return {
        slide_id,
        raw_contract_sha256: canonicalJsonSha256(rawContract),
        provider_input_binding: {
          ...pageImageProviderInputBinding({ workflow, pageDesignSystem }),
          compiled_provider_input_sha256: compiledProviderInput.sha256,
          generation_profile_sha256: provider_profile_sha256,
        },
      };
    }),
  });
}

function fixtureTaskMandate(plan, task_mandate_sha256 = plan.task_mandate_sha256) {
  return Object.freeze({
    ok: true,
    run_version: plan.run_version,
    workflow: plan.workflow,
    task_mandate_sha256,
  });
}

function fixtureRun() {
  const root = mkdtempSync(join(tmpdir(), "progressive-page-production-"));
  const deck = join(root, "deck_progressive_fixture");
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  return { root, deck, runDir };
}

function canonicalRecordBytes(record) {
  return Buffer.from(`${canonicalJson(record)}\n`, "utf8");
}

function withFixtureSha(record) {
  Object.defineProperty(record, "sha256", {
    value: canonicalJsonSha256(record),
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return Object.freeze(record);
}

function formerPlanFromCurrent(currentPlan) {
  const plan = structuredClone(currentPlan);
  for (const item of plan.items) delete item.provider_input_binding.page_design_system_sha256;
  return withFixtureSha(plan);
}

function formerPlanBinding(plan) {
  return {
    plan_sha256: plan.sha256,
    run_version: plan.run_version,
    source_receipt_sha256: plan.source_receipt_sha256,
    source_epoch: plan.source_epoch,
    workflow: plan.workflow,
    provider_profile_sha256: plan.provider_profile_sha256,
    effective_style_master_sha256: plan.effective_style_master_sha256,
    source_execution_sha256: plan.source_execution_sha256,
  };
}

function writeCanonicalRecord(pathname, record) {
  mkdirSync(dirname(pathname), { recursive: true });
  const bytes = canonicalRecordBytes(record);
  writeFileSync(pathname, bytes);
  return bytes;
}

function seedFormerProgressiveHead(runDir, {
  count = 1,
  withAcceptedEvidence = false,
  withSubmittedAttempt = false,
} = {}) {
  const plan = formerPlanFromCurrent(fixturePlan(count));
  const planPaths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256 });
  const planBytes = writeCanonicalRecord(planPaths.work_plan, plan);
  const head = withFixtureSha({
    schema: PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.sha256,
    plan_generation: 1,
    previous_plan_sha256: null,
  });
  const headPaths = progressiveRawStorePaths(runDir, { workflow: plan.workflow });
  const headBytes = writeCanonicalRecord(headPaths.scope_head, head);
  const seeded = { plan, head, planBytes, headBytes, records: [] };

  if (withAcceptedEvidence) {
    const bytes = Buffer.from("former accepted raw bytes");
    const provenance = withFixtureSha({
      schema: PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA,
      kind: "reuse",
      ...formerPlanBinding(plan),
      slide_id: plan.items[0].slide_id,
      raw_contract_sha256: plan.items[0].raw_contract_sha256,
      raw_sha256: sha256Bytes(bytes),
      batch_sha256: null,
      grant_sha256: null,
      attempt_key_sha256: null,
      reused_from_provenance_sha256: digest("9"),
    });
    const materializationPaths = progressiveRawStorePaths(runDir, {
      plan_sha256: plan.sha256,
      provenance_sha256: provenance.sha256,
    });
    writeCanonicalRecord(materializationPaths.materialization_provenance, provenance);
    writeFileSync(materializationPaths.materialization_bytes, bytes);
    const coverage = plan.items.map((item) => ({
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      raw_sha256: provenance.raw_sha256,
      materialization_provenance_sha256: provenance.sha256,
    }));
    const prepared = withFixtureSha({
      schema: PROGRESSIVE_RAW_COMPLETE_REVIEW_SCHEMA,
      ...formerPlanBinding(plan),
      ordered_slide_ids: [...plan.ordered_slide_ids],
      items: coverage,
      workflow_evidence_sha256: digest("7"),
      projection_sha256: digest("8"),
      decision: null,
      previous_review_sha256: null,
      retained_from_complete_raw_review_sha256: null,
    });
    const decided = withFixtureSha({
      ...structuredClone(prepared),
      decision: "proceed",
      previous_review_sha256: prepared.sha256,
    });
    const accepted = withFixtureSha({
      schema: PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA,
      raw_work_plan_sha256: plan.sha256,
      run_version: plan.run_version,
      source_receipt_sha256: plan.source_receipt_sha256,
      source_epoch: plan.source_epoch,
      workflow: plan.workflow,
      provider_profile_sha256: plan.provider_profile_sha256,
      effective_style_master_sha256: plan.effective_style_master_sha256,
      source_execution_sha256: plan.source_execution_sha256,
      complete_raw_review_sha256: decided.sha256,
      ordered_slide_ids: [...plan.ordered_slide_ids],
      items: coverage,
    });
    for (const review of [prepared, decided]) {
      writeCanonicalRecord(join(planPaths.complete_reviews_root, `${review.sha256.slice(0, 8)}.json`), review);
    }
    writeCanonicalRecord(join(planPaths.accepted_evidence_root, `${accepted.sha256.slice(0, 8)}.json`), accepted);
    seeded.materialization = { provenance, bytes };
    seeded.review = { prepared, decided, accepted };
  }

  if (withSubmittedAttempt) {
    const item = plan.items[0];
    const batch = withFixtureSha({
      schema: PROGRESSIVE_RAW_BATCH_SCHEMA,
      ...formerPlanBinding(plan),
      kind: "pilot",
      batch_generation: 1,
      previous_batch_sha256: null,
      ordered_slide_ids: [item.slide_id],
      items: [item],
      review_sample_slide_ids: [item.slide_id],
      paid_submission_slide_ids: [item.slide_id],
      maximum_submissions: 1,
      is_partial_pilot: false,
    });
    const grant = withFixtureSha({
      schema: PROGRESSIVE_RAW_BATCH_GRANT_SCHEMA,
      ...formerPlanBinding(plan),
      batch_sha256: batch.sha256,
      ordered_slide_ids: [item.slide_id],
      items: [item],
      maximum_submissions: 1,
    });
    const attemptKey = progressiveRawAttemptKey({
      plan_sha256: plan.sha256,
      batch_sha256: batch.sha256,
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
    });
    const claimed = withFixtureSha({
      schema: PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA,
      attempt_key_sha256: attemptKey,
      ...formerPlanBinding(plan),
      batch_sha256: batch.sha256,
      grant_sha256: grant.sha256,
      slide_id: item.slide_id,
      raw_contract_sha256: item.raw_contract_sha256,
      status: "claimed",
      previous_attempt_sha256: null,
      provider_request_sha256: null,
      provider_idempotency_key: null,
      materialization_provenance_sha256: null,
    });
    const submitted = withFixtureSha({
      ...structuredClone(claimed),
      status: "submitted",
      previous_attempt_sha256: claimed.sha256,
      provider_request_sha256: digest("6"),
      provider_idempotency_key: progressiveRawIdempotencyKey({ attempt_key_sha256: attemptKey }),
    });
    const batchPaths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256, batch_sha256: batch.sha256 });
    writeCanonicalRecord(batchPaths.batch, batch);
    writeCanonicalRecord(batchPaths.grant, grant);
    for (const attempt of [claimed, submitted]) {
      const attemptPaths = progressiveRawStorePaths(runDir, { plan_sha256: plan.sha256, attempt_sha256: attempt.sha256 });
      seeded.records.push({ path: attemptPaths.attempt, bytes: writeCanonicalRecord(attemptPaths.attempt, attempt) });
    }
    seeded.batch = batch;
    seeded.grant = grant;
    seeded.claimed = claimed;
    seeded.submitted = submitted;
  }
  return Object.freeze(seeded);
}

function appendTerminalAttemptSibling(runDir, { plan, batch_hash, slide_id = null, status }) {
  const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
  const submitted = direct.attempts.find((entry) =>
    entry.record.batch_sha256 === batch_hash && entry.record.status === "submitted" &&
    (slide_id === null || entry.record.slide_id === slide_id),
  );
  const batch = direct.batches.find((entry) => entry.sha256 === batch_hash);
  const grant = direct.grants.find((entry) => entry.sha256 === submitted?.record.grant_sha256);
  const terminal = createProgressiveRawItemAttempt({
    ...submitted.record,
    status,
    previous_attempt_sha256: submitted.sha256,
  }, { plan, batch: batch.record, grant: grant.record });
  writeProgressiveRawItemAttempt(runDir, { plan, batch: batch.record, grant: grant.record, attempt: terminal });
  return Object.freeze({ submitted, terminal });
}

describe("progressive Page Image raw owner", () => {
  it("does not adopt pre-head derived raw projections as progressive authority", () => {
    const { root, runDir } = fixtureRun();
    try {
      const projectionPlan = createRawWorkPlan({
        source_receipt_sha256: digest("a"),
        workflow: "pure",
        ordered_slide_ids: ["Slide01"],
        provider_profile_sha256: digest("b"),
        authorization_scope_sha256: digest("c"),
        items: [{
          slide_id: "Slide01",
          raw_contract_sha256: digest("d"),
          provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
        }],
      });
      const projectionEvidence = createAcceptedRawEvidence({
        plan: projectionPlan,
        provider_authorization_sha256: digest("e"),
        raw_review_sha256: digest("f"),
        raw_bytes_by_slide: { Slide01: Buffer.from("derived raw bytes") },
      });
      const projectionPaths = pageImageWorkflowPaths(runDir);
      mkdirSync(dirname(projectionPaths.target_raw_plan), { recursive: true });
      writeFileSync(projectionPaths.target_raw_plan, Buffer.from(`${JSON.stringify(projectionPlan)}\n`, "utf8"));
      writeFileSync(projectionPaths.target_raw_evidence, Buffer.from(`${JSON.stringify(projectionEvidence)}\n`, "utf8"));
      const projectionPlanBytes = readFileSync(projectionPaths.target_raw_plan);
      const projectionEvidenceBytes = readFileSync(projectionPaths.target_raw_evidence);
      const progressivePaths = progressiveRawStorePaths(runDir, { workflow: "pure" });

      expect(existsSync(progressivePaths.history_root)).toBe(false);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: true,
        plan: null,
        progress: null,
        primary_action: { action_id: "plan_progressive_raw_work", kind: "guide" },
      });
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure" })).toBeNull();
      expect(existsSync(progressivePaths.history_root)).toBe(false);
      expect(readFileSync(projectionPaths.target_raw_plan)).toEqual(projectionPlanBytes);
      expect(readFileSync(projectionPaths.target_raw_evidence)).toEqual(projectionEvidenceBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds Page Image batches to one complete ordered plan and rejects cross-bound tuples", () => {
    const plan = fixturePlan(2);
    const batch = createProgressiveRawBatch({
      plan_sha256: plan.sha256,
      run_version: plan.run_version,
      source_receipt_sha256: plan.source_receipt_sha256,
      source_epoch: plan.source_epoch,
      workflow: plan.workflow,
      provider_profile_sha256: plan.provider_profile_sha256,
      effective_style_master_sha256: plan.effective_style_master_sha256,
      source_execution_sha256: plan.source_execution_sha256,
      kind: "pilot",
      batch_generation: 1,
      ordered_slide_ids: ["Slide01"],
      items: [plan.items[0]],
      review_sample_slide_ids: ["Slide01"],
      paid_submission_slide_ids: ["Slide01"],
      maximum_submissions: 1,
      is_partial_pilot: true,
    }, { plan });

    expect(validateProgressiveRawWorkPlan(plan)).toMatchObject({ ok: true, sha256: plan.sha256 });
    const unboundPlan = structuredClone(plan);
    delete unboundPlan.items[0].provider_input_binding;
    expect(validateProgressiveRawWorkPlan(unboundPlan)).toMatchObject({ ok: false, code: "progressive_raw_invalid_items" });
    const pureWithoutPagePresentation = structuredClone(plan);
    pureWithoutPagePresentation.items[0].provider_input_binding.page_presentation_sha256 = null;
    expect(validateProgressiveRawWorkPlan(pureWithoutPagePresentation)).toMatchObject({
      ok: false,
      code: "progressive_raw_invalid_digest",
    });
    const framedWithoutPagePresentation = structuredClone(fixturePlan(1, { workflow: "framed" }));
    framedWithoutPagePresentation.items[0].provider_input_binding.page_presentation_sha256 = null;
    expect(validateProgressiveRawWorkPlan(framedWithoutPagePresentation)).toMatchObject({
      ok: false,
      code: "progressive_raw_invalid_digest",
    });
    expect(validateProgressiveRawWorkPlan(fixturePlan(1, { pageDesignSystem: "8" }))).toMatchObject({ ok: true });
    const missingPageDesignSystem = structuredClone(plan);
    delete missingPageDesignSystem.items[0].provider_input_binding.page_design_system_sha256;
    expect(validateProgressiveRawWorkPlan(missingPageDesignSystem)).toMatchObject({
      ok: false,
      code: "progressive_raw_invalid_provider_input_binding",
    });
    const extraPageDesignSystem = structuredClone(plan);
    extraPageDesignSystem.items[0].provider_input_binding.page_design_system_origin = "backbone";
    expect(validateProgressiveRawWorkPlan(extraPageDesignSystem)).toMatchObject({
      ok: false,
      code: "progressive_raw_invalid_provider_input_binding",
    });
    const malformedPageDesignSystem = structuredClone(plan);
    malformedPageDesignSystem.items[0].provider_input_binding.page_design_system_sha256 = "D".repeat(64);
    expect(validateProgressiveRawWorkPlan(malformedPageDesignSystem)).toMatchObject({
      ok: false,
      code: "progressive_raw_invalid_digest",
    });
    expect(validateProgressiveRawBatch(batch, { plan })).toMatchObject({ ok: true, sha256: batch.sha256 });
    expect(validateProgressiveRawBatch({ ...batch, provider_profile_sha256: digest("9") }, { plan }))
      .toMatchObject({ ok: false, code: "progressive_raw_cross_bound" });
  });

  it("advances an exact former head to a fresh current plan without reusing historical evidence", async () => {
    const { root, runDir } = fixtureRun();
    try {
      const former = seedFormerProgressiveHead(runDir, { withAcceptedEvidence: true });
      const formerDirectBefore = readHistoricalCutoverProgressiveRawPlanDirectRecords(runDir, {
        plan_sha256: former.plan.sha256,
      });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: false,
        code: "progressive_raw_plan_stale",
        next_action: { action_id: "rebuild_progressive_raw_work" },
      });
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: former.plan.sha256,
        slide_ids: ["Slide01"],
      })).rejects.toMatchObject({
        code: "progressive_raw_plan_stale",
        next_action: { action_id: "rebuild_progressive_raw_work" },
      });

      const successor = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      const publication = publishProgressiveRawWorkPlan({
        runDir,
        plan: successor,
        reuse_current_materializations: true,
        retain_current_complete_review: true,
      });
      expect(publication).toMatchObject({
        plan_hash: successor.sha256,
        reused_slide_ids: [],
        head: {
          plan_generation: 2,
          previous_plan_sha256: former.plan.sha256,
        },
      });
      expect(publication.retained_complete_raw_review_sha256).toBeUndefined();
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure", plan: successor }).record)
        .toMatchObject({ plan_sha256: successor.sha256, previous_plan_sha256: former.plan.sha256 });
      expect(readFileSync(progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 }).work_plan))
        .toEqual(former.planBytes);
      expect(readHistoricalCutoverProgressiveRawPlanDirectRecords(runDir, { plan_sha256: former.plan.sha256 }))
        .toEqual(formerDirectBefore);

      const successorDirect = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: successor.sha256 });
      expect(successorDirect).toMatchObject({
        batches: [],
        grants: [],
        attempts: [],
        materializations: [],
        complete_reviews: [],
        accepted_evidence: [],
      });
      expect(findProgressiveRawMaterializationByProvenance(runDir, {
        provenance_sha256: former.materialization.provenance.sha256,
      })).toBeNull();
      expect(findProgressiveRawCompleteReviewBySha(runDir, {
        complete_raw_review_sha256: former.review.decided.sha256,
      })).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reconciles an exact former submitted attempt without resubmission before successor publication", async () => {
    const { root, runDir } = fixtureRun();
    try {
      const former = seedFormerProgressiveHead(runDir, { withSubmittedAttempt: true });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: false,
        code: "progressive_raw_reconciliation_required",
        next_action: {
          action_id: "reconcile_progressive_raw_attempt",
          plan_hash: former.plan.sha256,
          attempt_sha256: former.submitted.sha256,
        },
      });
      const successor = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      expect(() => publishProgressiveRawWorkPlan({ runDir, plan: successor }))
        .toThrow(/submitted attempt blocks successor publication/i);
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: former.plan.sha256,
        slide_ids: ["Slide01"],
      })).rejects.toMatchObject({ code: "progressive_raw_reconciliation_required" });

      const lookup = vi.fn(async () => ({ outcome: "known_failure" }));
      const reconciled = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: former.plan.sha256,
        attempt_sha256: former.submitted.sha256,
        lookup,
      });
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(reconciled).toMatchObject({
        replay: false,
        outcome: "known_failure",
        next_action: { action_id: "rebuild_progressive_raw_work" },
      });
      const direct = readHistoricalCutoverProgressiveRawPlanDirectRecords(runDir, {
        plan_sha256: former.plan.sha256,
      });
      expect(direct.attempts).toHaveLength(3);
      expect(direct.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
      expect(readFileSync(progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 }).work_plan))
        .toEqual(former.planBytes);
      for (const retained of former.records) expect(readFileSync(retained.path)).toEqual(retained.bytes);

      const replay = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: former.plan.sha256,
        attempt_sha256: former.submitted.sha256,
        lookup,
      });
      expect(replay).toMatchObject({ replay: true, outcome: "known_failure" });
      expect(lookup).toHaveBeenCalledTimes(1);

      expect(publishProgressiveRawWorkPlan({ runDir, plan: successor })).toMatchObject({
        head: { previous_plan_sha256: former.plan.sha256, plan_generation: 2 },
        reused_slide_ids: [],
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps mixed former/current shapes and corrupted former containers fail-closed", () => {
    const scenarios = [
      {
        name: "mixed binding keys",
        mutate(runDir, former) {
          const mixed = structuredClone(former.plan);
          mixed.items[0].provider_input_binding.page_design_system_sha256 = null;
          writeFileSync(
            progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 }).work_plan,
            canonicalRecordBytes(mixed),
          );
        },
      },
      {
        name: "malformed direct record",
        mutate(runDir, former) {
          const paths = progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 });
          writeCanonicalRecord(join(paths.attempts_root, "aaaaaaaa.json"), {});
        },
      },
      {
        name: "noncanonical plan bytes",
        mutate(runDir, former) {
          writeFileSync(
            progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 }).work_plan,
            Buffer.from(JSON.stringify(former.plan), "utf8"),
          );
        },
      },
      {
        name: "content-address mismatch",
        mutate(runDir, former) {
          const other = formerPlanFromCurrent(fixturePlan(1, { source_receipt_sha256: digest("e") }));
          writeFileSync(
            progressiveRawStorePaths(runDir, { plan_sha256: former.plan.sha256 }).work_plan,
            canonicalRecordBytes(other),
          );
        },
      },
    ];
    for (const scenario of scenarios) {
      const { root, runDir } = fixtureRun();
      try {
        const former = seedFormerProgressiveHead(runDir, { count: 2 });
        scenario.mutate(runDir, former);
        const result = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
        expect(result, scenario.name).toMatchObject({
          ok: false,
          next_action: { action_id: "report_internal" },
        });
        expect(() => publishProgressiveRawWorkPlan({ runDir, plan: fixturePlan(2) }), scenario.name)
          .toThrow();
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("rejects a stale scope-head CAS after a former-head race", () => {
    const { root, runDir } = fixtureRun();
    try {
      const former = seedFormerProgressiveHead(runDir);
      const successor = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      const desiredHead = createProgressiveRawScopeHead({
        run_version: successor.run_version,
        workflow: successor.workflow,
        plan_sha256: successor.sha256,
        plan_generation: 2,
        previous_plan_sha256: former.plan.sha256,
      }, { plan: successor });
      const racedHead = {
        schema: PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA,
        run_version: former.plan.run_version,
        workflow: former.plan.workflow,
        plan_sha256: former.plan.sha256,
        plan_generation: 2,
        previous_plan_sha256: digest("9"),
      };
      const scopePath = progressiveRawStorePaths(runDir, { workflow: "pure" }).scope_head;
      writeCanonicalRecord(scopePath, racedHead);
      expect(() => writeProgressiveRawScopeHeadCas(runDir, {
        workflow: "pure",
        head: desiredHead,
        plan: successor,
        expected_bytes: former.headBytes,
      })).toThrow(/scope head changed before compare-and-swap/i);
      expect(readFileSync(scopePath)).toEqual(canonicalRecordBytes(racedHead));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires a matching current Task Mandate before a new batch grant or provider attempt", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6, { task_mandate_sha256: digest("e") });
    const matchingMandate = fixtureTaskMandate(plan);
    const staleMandate = fixtureTaskMandate(plan, digest("f"));
    try {
      expect(validateProgressiveRawWorkPlan(plan)).toMatchObject({ ok: true, sha256: plan.sha256 });
      publishProgressiveRawWorkPlan({ runDir, plan });

      expect(inspectProgressiveRawLifecycle({
        runDir,
        workflow: plan.workflow,
        task_mandate: matchingMandate,
      }).primary_action).toMatchObject({
        action_id: "plan_progressive_pilot",
        kind: "guide",
        requires_human: false,
      });
      expect(inspectProgressiveRawLifecycle({
        runDir,
        workflow: plan.workflow,
        task_mandate: staleMandate,
      }).primary_action).toMatchObject({
        action_id: "rebuild_progressive_raw_work",
        kind: "guide",
        requires_human: false,
      });

      await expect(planProgressiveRawPilot({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
        task_mandate: staleMandate,
      })).rejects.toMatchObject({
        code: "progressive_raw_task_mandate_required",
        next_action: { action_id: "rebuild_progressive_raw_work" },
      });
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).batches).toEqual([]);

      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
        task_mandate: matchingMandate,
      });
      expect(pilot.next_action).toMatchObject({
        action_id: "authorize_progressive_raw_batch",
        kind: "guide",
        requires_human: false,
      });

      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        task_mandate: staleMandate,
      })).rejects.toMatchObject({ code: "progressive_raw_task_mandate_required" });
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).grants).toEqual([]);

      const grant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        task_mandate: matchingMandate,
      });
      expect(grant.next_action).toMatchObject({
        action_id: "generate_progressive_raw_item",
        kind: "guide",
        requires_human: false,
      });

      const preflight = vi.fn(async () => {});
      const submit = vi.fn(async () => Buffer.from("must not submit"));
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        task_mandate: staleMandate,
        preflight,
        submit,
      })).rejects.toMatchObject({ code: "progressive_raw_task_mandate_required" });
      expect(preflight).not.toHaveBeenCalled();
      expect(submit).not.toHaveBeenCalled();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a current plan inspectable but blocks new runtime work under a Task Mandate", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(1);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      expect(inspectProgressiveRawLifecycle({
        runDir,
        workflow: plan.workflow,
        task_mandate: fixtureTaskMandate({ ...plan, task_mandate_sha256: digest("e") }),
      })).toMatchObject({
        ok: true,
        plan: { plan_hash: plan.sha256 },
        primary_action: { action_id: "rebuild_progressive_raw_work" },
      });
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).plan.record)
        .toEqual(plan);
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: plan.workflow,
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
        task_mandate: fixtureTaskMandate({ ...plan, task_mandate_sha256: digest("e") }),
      })).rejects.toMatchObject({ code: "progressive_raw_task_mandate_required" });
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).batches).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a staged or published-but-unheaded plan outside the current lifecycle", () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      const staged = stageProgressiveRawPlanContainer(runDir, { plan, unique: "pre-head" });
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure" })).toBeNull();
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: null,
        primary_action: { action_id: "plan_progressive_raw_work" },
      });

      expect(publishProgressiveRawStagedPlan(runDir, {
        staging_path: staged.staging_path,
        plan_sha256: plan.sha256,
      })).toMatchObject({ published: true, plan_root: expect.stringContaining(plan.sha256.slice(0, 8)) });
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure" })).toBeNull();
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: null,
        primary_action: { action_id: "plan_progressive_raw_work" },
      });

      const head = createProgressiveRawScopeHead({
        run_version: plan.run_version,
        workflow: plan.workflow,
        plan_sha256: plan.sha256,
        plan_generation: 1,
      }, { plan });
      writeProgressiveRawScopeHeadCas(runDir, {
        workflow: "pure",
        head,
        plan,
        expected_bytes: null,
      });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: { plan_hash: plan.sha256 },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("derives a Pilot only from exact current formal IDs and projects full-plan order", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const invalidScopes = [[], ["Slide01", "Slide01"], ["Slide07"], 2, plan.ordered_slide_ids];
      for (const slide_ids of invalidScopes) {
        await expect(planProgressiveRawPilot({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          slide_ids,
        })).rejects.toMatchObject({ code: "progressive_raw_pilot_scope_invalid" });
      }
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: digest("e"),
        slide_ids: ["Slide01"],
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });

      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide02", "Slide01"],
        display_by_slide: {
          Slide01: { title: "First formal title" },
          Slide02: { title: "Second formal title" },
        },
      });
      expect(pilot).toMatchObject({
        replay: false,
        batch: {
          kind: "pilot",
          is_partial_pilot: true,
          ordered_slide_ids: ["Slide01", "Slide02"],
          review_sample_slide_ids: ["Slide01", "Slide02"],
          paid_submission_slide_ids: ["Slide01", "Slide02"],
          maximum_submissions: 2,
          display: [
            { slide_id: "Slide01", position: 1, title: "First formal title" },
            { slide_id: "Slide02", position: 2, title: "Second formal title" },
          ],
        },
      });
      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01", "Slide02"],
      })).resolves.toMatchObject({
        replay: true,
        batch: { batch_hash: pilot.batch.batch_hash },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds a batch grant to exact current source, profile, and geometry before provider work", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(2, { workflow: "framed" });
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01", "Slide02"],
      });
      const grant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      })).resolves.toMatchObject({ replay: true, grant_hash: grant.grant_hash, maximum_submissions: 2 });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: digest("e"),
        batch_hash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: digest("e"),
      })).rejects.toMatchObject({ code: "progressive_raw_batch_stale" });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        expected_plan: fixturePlan(2, { workflow: "framed", profile_token: "stale" }),
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });

      const compositionDrift = structuredClone(plan);
      compositionDrift.items[0].provider_input_binding.protected_composition_sha256 = digest("9");
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        expected_plan: compositionDrift,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });

      const submit = vi.fn(async () => Buffer.from("must not submit"));
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "framed",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        expected_plan: fixturePlan(2, { workflow: "framed", source_receipt_sha256: digest("f") }),
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request" },
          Slide02: { schema: "fixture-request" },
        },
        submit,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      expect(submit).not.toHaveBeenCalled();
      const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(direct.grants).toHaveLength(1);
      expect(direct.attempts).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stages one full plan, consumes one submission per invocation, then accepts complete coverage", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      const published = publishProgressiveRawWorkPlan({ runDir, plan });
      expect(published).toMatchObject({ plan_hash: plan.sha256, replay: false, head: { plan_sha256: plan.sha256 } });
      expect(publishProgressiveRawWorkPlan({ runDir, plan })).toMatchObject({ replay: true });

      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
        display_by_slide: { Slide01: { title: "A bounded title" } },
      });
      expect(pilot.batch).toMatchObject({
        is_partial_pilot: false,
        paid_submission_slide_ids: ["Slide01"],
        display: [{ slide_id: "Slide01", position: 1, title: "A bounded title" }],
      });

      const grant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      expect(grant.maximum_submissions).toBe(1);

      let submissions = 0;
      const generated = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => {
          submissions += 1;
          return Buffer.from("fixture raw bytes");
        },
      });
      expect(submissions).toBe(1);
      expect(generated).toMatchObject({ item: "Slide01", outcome: "succeeded", progress: { materialized: 1 } });
      expect(generated.next_action.action_id).toBe("prepare_progressive_raw_review");

      const review = await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });
      expect(review.complete_raw_review_sha256).toMatch(/^[0-9a-f]{64}$/);
      const accepted = await acceptProgressiveRawCompleteReview({ runDir, workflow: "pure", plan_hash: plan.sha256, decision: "proceed" });
      expect(accepted.accepted_raw_evidence_sha256).toMatch(/^[0-9a-f]{64}$/);
      const replayPublish = vi.fn(async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }));
      await expect(prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        publish: replayPublish,
      })).resolves.toMatchObject({
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: accepted.accepted_raw_evidence_sha256,
        replay: true,
      });
      expect(replayPublish).toHaveBeenCalledTimes(1);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action)
        .toMatchObject({ action_id: "publish_target_final_manifest", plan_hash: plan.sha256 });
      expect(readProgressiveAcceptedRawWork({ runDir, workflow: "pure", plan_hash: plan.sha256 }).raw_bytes_by_slide.Slide01)
        .toEqual(Buffer.from("fixture raw bytes"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reads only the exact current undecided Complete Page Review", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const batch = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: batch.batch.batch_hash });
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: batch.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => Buffer.from("current review bytes"),
      });
      const prepared = await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });

      const current = readCurrentProgressiveRawCompleteReview({ runDir, workflow: "pure", expected_plan: plan });
      expect(current).toMatchObject({
        available: true,
        plan: { sha256: plan.sha256 },
        complete_raw_review_sha256: prepared.complete_raw_review_sha256,
      });
      expect(current.raw_bytes_by_slide.Slide01).toEqual(Buffer.from("current review bytes"));
      expect([...current.materializations.keys()]).toEqual(["Slide01"]);
      await expect(() => readCurrentProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        expected_plan: fixturePlan(1, { source_receipt_sha256: digest("f") }),
      })).toThrow(/current source, workflow, profile, or raw contracts/i);

      const repaired = await acceptProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        decision: "repair",
      });
      expect(repaired).toMatchObject({
        accepted_raw_evidence_sha256: null,
        next_action: { action_id: "rebuild_progressive_raw_work", kind: "repair" },
      });
      expect(readCurrentProgressiveRawCompleteReview({ runDir, workflow: "pure", expected_plan: plan }))
        .toEqual({ available: false });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        evidence: { complete_raw_review_sha256: null, accepted_raw_evidence_sha256: null },
        controller_handoffs: {
          complete_raw_review: {
            complete_raw_review_sha256: repaired.complete_raw_review_sha256,
            decision: "repair",
          },
        },
        primary_action: { action_id: "rebuild_progressive_raw_work", kind: "repair", plan_hash: plan.sha256 },
      });

      const before = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      const blockedPublish = vi.fn(async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }));
      await expect(prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        publish: blockedPublish,
      })).rejects.toMatchObject({
        code: "progressive_raw_complete_review_unavailable",
        next_action: { action_id: "rebuild_progressive_raw_work", kind: "repair", plan_hash: plan.sha256 },
      });
      expect(blockedPublish).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 })).toEqual(before);

      const blockedValidate = vi.fn(async () => ({ ok: true }));
      await expect(acceptProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        decision: "repair",
        validate: blockedValidate,
      })).rejects.toMatchObject({
        code: "progressive_raw_complete_review_required",
        next_action: { action_id: "rebuild_progressive_raw_work", kind: "repair", plan_hash: plan.sha256 },
      });
      expect(blockedValidate).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 })).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a current Complete Page Review whose materialized bytes are missing", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const batch = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: batch.batch.batch_hash });
      const generated = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: batch.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => Buffer.from("missing review bytes"),
      });
      await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });
      const materialization = progressiveRawStorePaths(runDir, {
        plan_sha256: plan.sha256,
        provenance_sha256: generated.materialization_provenance_sha256,
      });
      unlinkSync(materialization.materialization_bytes);

      expect(() => readCurrentProgressiveRawCompleteReview({ runDir, workflow: "pure", expected_plan: plan }))
        .toThrow(/raw\.png/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects tampered compiled input before it claims or submits an item", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const staleRequests = structuredClone(fixtureProviderRequests(plan));
      staleRequests.Slide01.compiled_provider_input.utf8 = `${staleRequests.Slide01.compiled_provider_input.utf8}\nchanged`;
      const submit = vi.fn();
      const preflight = vi.fn();

      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: staleRequests,
        preflight,
        submit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_request_invalid" });
      expect(preflight).not.toHaveBeenCalled();
      expect(submit).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).attempts).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("runs provider credential preflight after exact eligibility and before attempt persistence", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const missingCredentials = new Error("credentials unavailable");
      missingCredentials.code = "PAGE_IMAGE_PROVIDER_CREDENTIALS_UNAVAILABLE";
      const preflight = vi.fn(async ({ request, item, plan_hash, batch_hash, grant_hash }) => {
        expect(Object.isFrozen(request)).toBe(true);
        expect(item).toEqual({ slide_id: "Slide01", raw_contract_sha256: plan.items[0].raw_contract_sha256 });
        expect(plan_hash).toBe(plan.sha256);
        expect(batch_hash).toBe(pilot.batch.batch_hash);
        expect(grant_hash).toMatch(/^[0-9a-f]{64}$/);
        throw missingCredentials;
      });
      const submit = vi.fn();

      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        preflight,
        submit,
      })).rejects.toBe(missingCredentials);
      expect(preflight).toHaveBeenCalledTimes(1);
      expect(submit).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).attempts).toEqual([]);

      const stalePreflight = vi.fn();
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: digest("e"),
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        preflight: stalePreflight,
        submit,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      expect(stalePreflight).not.toHaveBeenCalled();
      expect(submit).not.toHaveBeenCalled();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("derives current provider-free reuse from accepted direct records across plan generations", async () => {
    const { root, runDir } = fixtureRun();
    const firstPlan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan: firstPlan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const firstBytes = Buffer.from("accepted provider bytes for direct reuse");
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(firstPlan),
        submit: async () => firstBytes,
      });
      await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });
      await acceptProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        decision: "proceed",
      });

      const secondPlan = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      const secondPublication = publishProgressiveRawWorkPlan({
        runDir,
        plan: secondPlan,
        reuse_current_materializations: true,
      });
      expect(secondPublication.reused_slide_ids).toEqual(["Slide01"]);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: { plan_hash: secondPlan.sha256 },
        progress: { materialized: 1, paid_debt: [] },
        primary_action: { action_id: "prepare_progressive_raw_review" },
      });
      const secondRecords = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: secondPlan.sha256 });
      expect(secondRecords.materializations).toHaveLength(1);
      expect(secondRecords.materializations[0].provenance.record).toMatchObject({
        kind: "reuse",
        slide_id: "Slide01",
        raw_sha256: sha256Bytes(firstBytes),
      });
      expect(secondRecords.materializations[0].bytes).toEqual(firstBytes);

      await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: secondPlan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("1"), projection_sha256: digest("2") }),
      });
      await acceptProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: secondPlan.sha256,
        decision: "proceed",
      });

      const thirdPlan = fixturePlan(1, {
        source_receipt_sha256: digest("7"),
        source_execution_sha256: digest("8"),
      });
      expect(publishProgressiveRawWorkPlan({
        runDir,
        plan: thirdPlan,
        reuse_current_materializations: true,
      })).toMatchObject({ reused_slide_ids: ["Slide01"] });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: { plan_hash: thirdPlan.sha256 },
        progress: { materialized: 1, paid_debt: [] },
      });

      const profileDrift = fixturePlan(1, {
        source_receipt_sha256: digest("9"),
        source_execution_sha256: digest("0"),
        profile_token: "1",
      });
      expect(publishProgressiveRawWorkPlan({
        runDir,
        plan: profileDrift,
        reuse_current_materializations: true,
      })).toMatchObject({ reused_slide_ids: [] });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: { plan_hash: profileDrift.sha256 },
        progress: { materialized: 0, paid_debt: ["Slide01"] },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retains an accepted complete review only for a fully reusable successor", async () => {
    const { root, runDir } = fixtureRun();
    const firstPlan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan: firstPlan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const bytes = Buffer.from("accepted raw bytes retained across a local rebind");
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(firstPlan),
        submit: async () => bytes,
      });
      const firstReview = await prepareProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });
      const firstAccepted = await acceptProgressiveRawCompleteReview({
        runDir,
        workflow: "pure",
        plan_hash: firstPlan.sha256,
        decision: "proceed",
      });

      const successor = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      const publication = publishProgressiveRawWorkPlan({
        runDir,
        plan: successor,
        reuse_current_materializations: true,
        retain_current_complete_review: true,
      });
      expect(publication).toMatchObject({
        reused_slide_ids: ["Slide01"],
        retained_complete_raw_review_sha256: firstAccepted.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(firstReview.complete_raw_review_sha256).not.toBe(publication.complete_raw_review_sha256);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        plan: { plan_hash: successor.sha256 },
        progress: { materialized: 1, paid_debt: [] },
        primary_action: { action_id: "publish_target_final_manifest" },
      });
      const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: successor.sha256 });
      expect(records).toMatchObject({ batches: [], grants: [], attempts: [] });
      expect(records.complete_reviews).toHaveLength(2);
      expect(records.complete_reviews.every((review) =>
        review.record.retained_from_complete_raw_review_sha256 === firstAccepted.complete_raw_review_sha256,
      )).toBe(true);
      expect(records.accepted_evidence[0].record).toMatchObject({
        raw_work_plan_sha256: successor.sha256,
        complete_raw_review_sha256: publication.complete_raw_review_sha256,
      });
      expect(readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: successor.sha256,
      }).raw_bytes_by_slide.Slide01).toEqual(bytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("leaves an uncertain submission terminally blocked until explicit reconciliation", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => { throw new Error("connection ended after submit"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const blocked = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
      expect(blocked.primary_action).toMatchObject({ action_id: "reconcile_progressive_raw_attempt", plan_hash: plan.sha256 });
      const staleLookup = vi.fn();
      await expect(reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: blocked.primary_action.attempt_sha256,
        expected_plan: fixturePlan(1, { profile_token: "stale" }),
        lookup: staleLookup,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      expect(staleLookup).not.toHaveBeenCalled();
      await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: blocked.primary_action.attempt_sha256,
        lookup: async () => null,
      });
      const terminal = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
      expect(terminal.progress).toMatchObject({ unknown: 1 });
      expect(terminal.primary_action.action_id).toBe("plan_progressive_pilot");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a successor Pilot transport interruption reconcilable after a terminal unknown predecessor", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const predecessor = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      const predecessorGrant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: predecessor.batch.batch_hash,
      });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: predecessor.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => { throw new Error("predecessor transport interrupted"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const predecessorAttempt = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action.attempt_sha256;
      await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: predecessorAttempt,
        lookup: async () => null,
      });

      const successor = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      expect(successor.batch).toMatchObject({
        batch_generation: 2,
        previous_batch_sha256: predecessor.batch.batch_hash,
      });
      const successorGrant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: successor.batch.batch_hash,
      });
      const successorSubmit = vi.fn(async () => { throw new Error("successor transport interrupted"); });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: successor.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: successorSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      const submitted = records.attempts.find((entry) =>
        entry.record.status === "submitted" && entry.record.batch_sha256 === successor.batch.batch_hash,
      );
      expect(submitted?.record.slide_id).toBe("Slide01");
      expect(successorSubmit).toHaveBeenCalledTimes(1);
      expect(records.grants).toHaveLength(2);
      expect(records.grants.some((entry) => entry.sha256 === predecessorGrant.grant_hash)).toBe(true);
      expect(records.grants.some((entry) => entry.sha256 === successorGrant.grant_hash)).toBe(true);
      expect(records.attempts.some((entry) =>
        entry.record.batch_sha256 === predecessor.batch.batch_hash && entry.record.status === "unknown",
      )).toBe(true);
      expect(records.materializations).toHaveLength(0);
      expect(records.pilot_evidence).toHaveLength(0);
      expect(records.accepted_evidence).toHaveLength(0);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: true,
        primary_action: {
          action_id: "reconcile_progressive_raw_attempt",
          attempt_sha256: submitted.sha256,
        },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("derives a known-failure terminal from a redundant unknown sibling before reconciling newer work", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const predecessor = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: predecessor.batch.batch_hash,
      });
      const predecessorSubmit = vi.fn(async () => ({ outcome: "known_failure" }));
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: predecessor.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: predecessorSubmit,
      });

      const successor = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide02"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: successor.batch.batch_hash,
      });
      const successorSubmit = vi.fn(async () => { throw new Error("successor transport interrupted"); });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: successor.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: successorSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const successorSubmitted = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).attempts
        .find((entry) => entry.record.batch_sha256 === successor.batch.batch_hash && entry.record.status === "submitted");

      appendTerminalAttemptSibling(runDir, {
        plan,
        batch_hash: predecessor.batch.batch_hash,
        status: "unknown",
      });
      const before = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      const inspected = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });

      expect(inspected).toMatchObject({
        ok: true,
        progress: { known_failure: 1, submitted: 1, unsubmitted: 4 },
        primary_action: {
          action_id: "reconcile_progressive_raw_attempt",
          attempt_sha256: successorSubmitted.sha256,
        },
      });
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 })).toEqual(before);
      expect(predecessorSubmit).toHaveBeenCalledTimes(1);
      expect(successorSubmit).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("continues from a verified succeeded and unknown sibling without mutating its attempt chain", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(3);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01", "Slide02", "Slide03"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const firstSubmit = vi.fn(async () => { throw new Error("first provider response became unknown"); });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: firstSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const firstSubmitted = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).attempts.find((entry) =>
        entry.record.batch_sha256 === pilot.batch.batch_hash && entry.record.slide_id === "Slide01" && entry.record.status === "submitted",
      );
      await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: firstSubmitted.sha256,
        lookup: async () => null,
      });

      const secondSubmit = vi.fn(async () => Buffer.from("fixture succeeded bytes"));
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: secondSubmit,
      });
      appendTerminalAttemptSibling(runDir, {
        plan,
        batch_hash: pilot.batch.batch_hash,
        slide_id: "Slide02",
        status: "unknown",
      });

      const before = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: true,
        progress: { materialized: 1, unknown: 1, unsubmitted: 1 },
        primary_action: { action_id: "generate_progressive_raw_item", batch_hash: pilot.batch.batch_hash },
      });
      const secondSubmitted = before.attempts.find((entry) =>
        entry.record.batch_sha256 === pilot.batch.batch_hash && entry.record.slide_id === "Slide02" && entry.record.status === "submitted",
      );
      const lookup = vi.fn();
      const replay = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: secondSubmitted.sha256,
        lookup,
      });
      expect(replay).toMatchObject({
        attempt_sha256: secondSubmitted.sha256,
        reconciled: true,
        replay: true,
        outcome: "succeeded",
        next_action: { action_id: "generate_progressive_raw_item", batch_hash: pilot.batch.batch_hash },
      });
      expect(firstSubmit).toHaveBeenCalledTimes(1);
      expect(secondSubmit).toHaveBeenCalledTimes(1);
      expect(lookup).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 })).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps malformed terminal branches and foreign attempt transitions fail-closed before submission", async () => {
    const cases = [
      {
        name: "another terminal sibling",
        prepare: ({ runDir, plan, batch_hash }) => appendTerminalAttemptSibling(runDir, {
          plan,
          batch_hash,
          slide_id: "Slide01",
          status: "known_failure",
        }),
        code: "progressive_raw_attempt_chain_invalid",
      },
      {
        name: "terminal descendant",
        prepare: ({ runDir, plan, batch_hash }) => {
          appendTerminalAttemptSibling(runDir, { plan, batch_hash, slide_id: "Slide01", status: "unknown" });
          const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
          const unknown = direct.attempts.find((entry) => entry.record.batch_sha256 === batch_hash && entry.record.status === "unknown");
          const batch = direct.batches.find((entry) => entry.sha256 === batch_hash);
          const grant = direct.grants.find((entry) => entry.sha256 === unknown.record.grant_sha256);
          const descendant = createProgressiveRawItemAttempt({
            ...unknown.record,
            previous_attempt_sha256: unknown.sha256,
          }, { plan, batch: batch.record, grant: grant.record });
          writeProgressiveRawItemAttempt(runDir, { plan, batch: batch.record, grant: grant.record, attempt: descendant });
        },
        code: "progressive_raw_attempt_transition_invalid",
      },
      {
        name: "foreign attempt predecessor",
        count: 2,
        prepare: async ({ runDir, plan, batch_hash }) => {
          await generateProgressiveRawItem({
            runDir,
            workflow: "pure",
            plan_hash: plan.sha256,
            batch_hash,
            provider_requests_by_slide: fixtureProviderRequests(plan),
            submit: async () => Buffer.from("second provider bytes"),
          });
          const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
          const firstSubmitted = direct.attempts.find((entry) => entry.record.slide_id === "Slide01" && entry.record.status === "submitted");
          const secondSubmitted = direct.attempts.find((entry) => entry.record.slide_id === "Slide02" && entry.record.status === "submitted");
          const batch = direct.batches.find((entry) => entry.sha256 === batch_hash);
          const grant = direct.grants.find((entry) => entry.sha256 === secondSubmitted.record.grant_sha256);
          const foreign = createProgressiveRawItemAttempt({
            ...secondSubmitted.record,
            status: "unknown",
            previous_attempt_sha256: firstSubmitted.sha256,
          }, { plan, batch: batch.record, grant: grant.record });
          writeProgressiveRawItemAttempt(runDir, { plan, batch: batch.record, grant: grant.record, attempt: foreign });
        },
        code: "progressive_raw_attempt_chain_invalid",
      },
    ];
    for (const scenario of cases) {
      const { root, runDir } = fixtureRun();
      const plan = fixturePlan(scenario.count || 1);
      try {
        publishProgressiveRawWorkPlan({ runDir, plan });
        const pilot = await planProgressiveRawPilot({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          slide_ids: plan.ordered_slide_ids,
        });
        await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
        await generateProgressiveRawItem({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          provider_requests_by_slide: fixtureProviderRequests(plan),
          submit: async () => Buffer.from("first provider bytes"),
        });
        await scenario.prepare({ runDir, plan, batch_hash: pilot.batch.batch_hash });

        expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({ ok: false, code: scenario.code });
        const submit = vi.fn();
        await expect(generateProgressiveRawItem({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          provider_requests_by_slide: fixtureProviderRequests(plan),
          submit,
        })).rejects.toMatchObject({ code: scenario.code });
        expect(submit).not.toHaveBeenCalled();
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("keeps a terminal success with missing provider bytes as an integrity hard-stop", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => Buffer.from("provider bytes that will be removed"),
      });
      appendTerminalAttemptSibling(runDir, {
        plan,
        batch_hash: pilot.batch.batch_hash,
        slide_id: "Slide01",
        status: "unknown",
      });
      const succeeded = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).attempts
        .find((entry) => entry.record.status === "succeeded");
      const paths = progressiveRawStorePaths(runDir, {
        plan_sha256: plan.sha256,
        provenance_sha256: succeeded.record.materialization_provenance_sha256,
      });
      unlinkSync(paths.materialization_bytes);

      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: false,
        code: "ENOENT",
      });
      const submit = vi.fn();
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit,
      })).rejects.toMatchObject({ code: "ENOENT" });
      expect(submit).not.toHaveBeenCalled();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("derives Expansion only after a partial Pilot proceed and rejects another Pilot bypass", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      expect(pilot.batch).toMatchObject({
        kind: "pilot",
        is_partial_pilot: true,
        paid_submission_slide_ids: ["Slide01"],
      });
      await expect(planProgressiveRawExpansion({ runDir, workflow: "pure", plan_hash: plan.sha256 }))
        .rejects.toMatchObject({ code: "progressive_raw_expansion_unavailable" });

      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => Buffer.from("partial Pilot bytes"),
      });

      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide02", "Slide03", "Slide04", "Slide05", "Slide06"],
      })).rejects.toMatchObject({
        code: "progressive_raw_pilot_unavailable",
        next_action: { action_id: "prepare_progressive_pilot_review" },
      });

      await prepareProgressiveRawPilotEvidence({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
      });
      await acceptProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        decision: "proceed",
      });

      await expect(planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide02", "Slide03", "Slide04", "Slide05", "Slide06"],
      })).rejects.toMatchObject({
        code: "progressive_raw_pilot_unavailable",
        next_action: { action_id: "plan_progressive_expansion" },
      });

      const expansion = await planProgressiveRawExpansion({ runDir, workflow: "pure", plan_hash: plan.sha256 });
      expect(expansion.batch).toMatchObject({
        kind: "expansion",
        batch_generation: 2,
        previous_batch_sha256: pilot.batch.batch_hash,
        ordered_slide_ids: ["Slide02", "Slide03", "Slide04", "Slide05", "Slide06"],
        paid_submission_slide_ids: ["Slide02", "Slide03", "Slide04", "Slide05", "Slide06"],
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps partial Pilot repair and redirect decisions separate from cost and full-plan acceptance", async () => {
    for (const decision of ["repair", "redirect"]) {
      const { root, runDir } = fixtureRun();
      const plan = fixturePlan(6);
      try {
        publishProgressiveRawWorkPlan({ runDir, plan });
        const pilot = await planProgressiveRawPilot({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          slide_ids: ["Slide01"],
        });
        await authorizeProgressiveRawBatch({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
        });
        await generateProgressiveRawItem({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          provider_requests_by_slide: fixtureProviderRequests(plan),
          submit: async () => Buffer.from(`partial Pilot ${decision} bytes`),
        });
        await prepareProgressiveRawPilotEvidence({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          publish: async () => ({ workflow_evidence_sha256: digest("e"), projection_sha256: digest("f") }),
        });

        const accepted = await acceptProgressiveRawPilot({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          decision,
        });
        const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });

        expect(accepted).toMatchObject({
          pilot_decision_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
          next_action: { action_id: "rebuild_progressive_raw_work", kind: "repair" },
        });
        expect(direct.grants).toHaveLength(1);
        expect(direct.pilot_decisions).toHaveLength(1);
        expect(direct.pilot_decisions[0].record.decision).toBe(decision);
        expect(direct.accepted_evidence).toHaveLength(0);
        await expect(planProgressiveRawExpansion({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
        })).rejects.toMatchObject({
          code: "progressive_raw_expansion_unavailable",
          next_action: { action_id: "rebuild_progressive_raw_work" },
        });
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("reconciles a valid published materialization bundle without a second provider lookup", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => { throw new Error("connection ended after submit"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      const submitted = direct.attempts.find((entry) => entry.record.status === "submitted");
      const batch = direct.batches.find((entry) => entry.sha256 === submitted.record.batch_sha256);
      const grant = direct.grants.find((entry) => entry.sha256 === submitted.record.grant_sha256);
      const bytes = Buffer.from("published before terminal attempt visibility");
      const provenance = createProgressiveRawMaterializationProvenance({
        ...plan,
        plan_sha256: plan.sha256,
        kind: "provider",
        slide_id: submitted.record.slide_id,
        raw_contract_sha256: submitted.record.raw_contract_sha256,
        raw_sha256: sha256Bytes(bytes),
        batch_sha256: batch.sha256,
        grant_sha256: grant.sha256,
        attempt_key_sha256: submitted.record.attempt_key_sha256,
      }, { plan });
      publishProgressiveRawMaterialization(runDir, { plan, provenance, bytes });

      const blocked = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
      expect(blocked).toMatchObject({
        ok: true,
        primary_action: { action_id: "reconcile_progressive_raw_attempt", attempt_sha256: submitted.sha256 },
      });
      const lookup = vi.fn();
      const reconciled = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: submitted.sha256,
        lookup,
      });
      expect(lookup).not.toHaveBeenCalled();
      expect(reconciled).toMatchObject({ outcome: "succeeded", prior_plan: false, progress: { materialized: 1 } });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action.action_id)
        .toBe("prepare_progressive_raw_review");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("terminalizes a known provider failure without reopening the old grant", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => { throw new Error("connection ended after submit"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const attemptSha256 = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action.attempt_sha256;
      const reconciled = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: attemptSha256,
        lookup: async () => ({ outcome: "known_failure" }),
      });
      expect(reconciled).toMatchObject({
        outcome: "known_failure",
        progress: { known_failure: 1, materialized: 0 },
        next_action: { action_id: "plan_progressive_pilot" },
      });
      const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(records.batches).toHaveLength(1);
      expect(records.grants).toHaveLength(1);
      expect(records.attempts.some((entry) => entry.record.status === "known_failure")).toBe(true);
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "progressive_raw_batch_terminal" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("persists a pre-submit claim and submits only one durable item per invocation", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(2);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01", "Slide02"],
      });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action)
        .toMatchObject({ action_id: "generate_progressive_raw_item", batch_hash: pilot.batch.batch_hash });
      expect(inspectProgressiveRawLifecycle({
        runDir,
        workflow: "pure",
        expected_plan: fixturePlan(2, { source_receipt_sha256: digest("e") }),
      }).primary_action).toMatchObject({ action_id: "rebuild_progressive_raw_work" });

      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: {},
        submit: async () => Buffer.from("must not submit"),
      })).rejects.toMatchObject({ code: "progressive_raw_provider_request_invalid" });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        progress: { claimed: 0, submitted: 0 },
        primary_action: { action_id: "generate_progressive_raw_item" },
      });

      const seenSubmitted = [];
      const first = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async ({ item, provider_idempotency_key }) => {
          const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
          const submitted = records.attempts.filter((entry) => entry.record.status === "submitted");
          expect(submitted).toHaveLength(1);
          expect(submitted[0].record).toMatchObject({
            slide_id: item.slide_id,
            provider_idempotency_key,
          });
          seenSubmitted.push(item.slide_id);
          return Buffer.from("first committed bytes");
        },
      });
      expect(first).toMatchObject({
        item: "Slide01",
        outcome: "succeeded",
        progress: { materialized: 1, unsubmitted: 1, claimed: 0, submitted: 0 },
        next_action: { action_id: "generate_progressive_raw_item" },
      });
      expect(seenSubmitted).toEqual(["Slide01"]);

      const second = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async ({ item }) => {
          expect(item.slide_id).toBe("Slide02");
          return Buffer.from("second committed bytes");
        },
      });
      expect(second).toMatchObject({
        item: "Slide02",
        outcome: "succeeded",
        progress: { materialized: 2, unsubmitted: 0, claimed: 0, submitted: 0 },
        next_action: { action_id: "prepare_progressive_raw_review" },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("continues later authorized items after known failure, then requires a successor grant for retry", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(2);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01", "Slide02"],
      });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      const first = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => ({ outcome: "known_failure" }),
      });
      expect(first).toMatchObject({
        item: "Slide01",
        outcome: "known_failure",
        progress: { known_failure: 1, unsubmitted: 1 },
        next_action: { action_id: "generate_progressive_raw_item" },
      });
      const second = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async ({ item }) => {
          expect(item.slide_id).toBe("Slide02");
          return Buffer.from("second item after known failure");
        },
      });
      expect(second.next_action).toMatchObject({ action_id: "plan_progressive_pilot" });

      const retry = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      expect(retry.batch).toMatchObject({
        batch_generation: 2,
        previous_batch_sha256: pilot.batch.batch_hash,
        paid_submission_slide_ids: ["Slide01"],
      });
      const oldGrant = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).grants[0].sha256;
      const grant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: retry.batch.batch_hash,
      });
      expect(grant.grant_hash).not.toBe(oldGrant);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns only bounded tagged Page Image media facts without materializing rejected bytes", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });

      const result = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => {
          const error = new Error("PROVIDER_RESPONSE_BODY_SENTINEL");
          error.page_image_known_failure = true;
          error.page_image_known_failure_facts = {
            expected: {
              format: "png",
              provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
            },
            actual: {
              format: "png",
              width: 1600,
              height: 900,
              provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
            },
          };
          throw error;
        },
      });

      expect(result).toMatchObject({
        item: "Slide01",
        outcome: "known_failure",
        provider_media: {
          expected: { format: "png" },
          actual: { format: "png", width: 1600, height: 900 },
        },
        progress: { materialized: 0, known_failure: 1 },
        next_action: { action_id: "plan_progressive_pilot" },
      });
      expect(JSON.stringify(result)).not.toContain("PROVIDER_RESPONSE_BODY_SENTINEL");
      const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(records.materializations).toHaveLength(0);
      expect(records.attempts.some((entry) => entry.record.status === "succeeded")).toBe(false);
      expect(records.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns only bounded tagged Page Image response facts without materializing rejected bytes", async () => {
    const cases = [
      {
        response: { classification: "invalid_json", response_shape: "html_like" },
        expected: { classification: "invalid_json", response_shape: "html_like" },
      },
      {
        response: { classification: "invalid_json", response_shape: "provider-defined-shape" },
        expected: { classification: "invalid_json" },
      },
      {
        response: { classification: "task_terminal_failure", response_shape: "html_like" },
        expected: { classification: "task_terminal_failure" },
      },
    ];
    for (const scenario of cases) {
      const { root, runDir } = fixtureRun();
      const plan = fixturePlan();
      try {
        publishProgressiveRawWorkPlan({ runDir, plan });
        const pilot = await planProgressiveRawPilot({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          slide_ids: ["Slide01"],
        });
        await authorizeProgressiveRawBatch({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
        });

        const result = await generateProgressiveRawItem({
          runDir,
          workflow: "pure",
          plan_hash: plan.sha256,
          batch_hash: pilot.batch.batch_hash,
          provider_requests_by_slide: fixtureProviderRequests(plan),
          submit: async () => {
            const error = new Error("PROVIDER_RESPONSE_BODY_SENTINEL");
            error.page_image_known_failure = true;
            error.page_image_known_failure_facts = {
              response: {
                ...scenario.response,
                provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
                response_header: "PROVIDER_RESPONSE_HEADER_SENTINEL",
                response_length: 123,
                task_id: "PROVIDER_TASK_ID_SENTINEL",
              },
            };
            throw error;
          },
        });

        expect(result).toMatchObject({
          item: "Slide01",
          outcome: "known_failure",
          provider_failure: scenario.expected,
          progress: { materialized: 0, known_failure: 1 },
          next_action: { action_id: "plan_progressive_pilot" },
        });
        expect(result.provider_failure).toEqual(scenario.expected);
        expect(result.provider_media).toBeUndefined();
        expect(JSON.stringify(result)).not.toMatch(/PROVIDER_RESPONSE_BODY_SENTINEL|PROVIDER_RESPONSE_HEADER_SENTINEL|PROVIDER_TASK_ID_SENTINEL/);
        const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
        expect(records.materializations).toHaveLength(0);
        expect(records.attempts.some((entry) => entry.record.status === "succeeded")).toBe(false);
        expect(records.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("routes a terminal partial Pilot with missing coverage through a fresh successor grant", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan(6);
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      const oldGrant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      const terminal = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => ({ outcome: "known_failure" }),
      });
      expect(terminal).toMatchObject({
        outcome: "known_failure",
        next_action: { action_id: "plan_progressive_pilot", kind: "confirm", requires_human: true },
      });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        primary_action: { action_id: "plan_progressive_pilot", kind: "confirm", requires_human: true },
      });

      const beforeReview = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      const publish = vi.fn();
      await expect(prepareProgressiveRawPilotEvidence({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        publish,
      })).rejects.toMatchObject({
        code: "progressive_raw_pilot_coverage_missing",
        next_action: { action_id: "plan_progressive_pilot", kind: "confirm", requires_human: true },
      });
      expect(publish).not.toHaveBeenCalled();
      const afterReview = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(afterReview.pilot_evidence).toEqual(beforeReview.pilot_evidence);
      expect(afterReview.pilot_decisions).toEqual(beforeReview.pilot_decisions);
      expect(afterReview.attempts).toEqual(beforeReview.attempts);

      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "progressive_raw_batch_terminal" });

      const successor = await planProgressiveRawPilot({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["Slide01"],
      });
      expect(successor).toMatchObject({
        replay: false,
        batch: {
          batch_generation: 2,
          previous_batch_sha256: pilot.batch.batch_hash,
          paid_submission_slide_ids: ["Slide01"],
        },
      });
      const successorGrant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: successor.batch.batch_hash,
      });
      expect(successorGrant.grant_hash).not.toBe(oldGrant.grant_hash);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reconciles an exact prior-plan submitted attempt without advancing the current head", async () => {
    const { root, runDir } = fixtureRun();
    const plan = fixturePlan();
    try {
      publishProgressiveRawWorkPlan({ runDir, plan });
      const pilot = await planProgressiveRawPilot({ runDir, workflow: "pure", plan_hash: plan.sha256, slide_ids: ["Slide01"] });
      await authorizeProgressiveRawBatch({ runDir, workflow: "pure", plan_hash: plan.sha256, batch_hash: pilot.batch.batch_hash });
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: fixtureProviderRequests(plan),
        submit: async () => { throw new Error("connection ended after submit"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const oldAttempt = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action.attempt_sha256;

      // This models retained history from a pre-hardening scope head. Normal owner
      // publication rejects this advance while the submitted attempt is unresolved.
      const plan2 = fixturePlan(1, {
        source_receipt_sha256: digest("e"),
        source_execution_sha256: digest("f"),
      });
      const staged = stageProgressiveRawPlanContainer(runDir, { plan: plan2 });
      publishProgressiveRawStagedPlan(runDir, { staging_path: staged.staging_path, plan_sha256: plan2.sha256 });
      const currentHead = readProgressiveRawScopeHead(runDir, { workflow: "pure" });
      const head2 = createProgressiveRawScopeHead({
        run_version: "v1",
        workflow: "pure",
        plan_sha256: plan2.sha256,
        plan_generation: 2,
        previous_plan_sha256: plan.sha256,
      }, { plan: plan2 });
      writeProgressiveRawScopeHeadCas(runDir, {
        workflow: "pure",
        head: head2,
        plan: plan2,
        expected_bytes: currentHead.bytes,
      });

      const reconciled = await reconcileProgressiveRawAttempt({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        attempt_sha256: oldAttempt,
        lookup: async () => null,
      });
      expect(reconciled).toMatchObject({
        prior_plan: true,
        outcome: "unknown",
        current_plan_hash: plan2.sha256,
        next_action: { action_id: "plan_progressive_pilot" },
      });
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure" }).record.plan_sha256).toBe(plan2.sha256);
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan2.sha256 })).toMatchObject({
        batches: [],
        grants: [],
        attempts: [],
        materializations: [],
      });
      const oldRecords = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(oldRecords.attempts.some((entry) => entry.record.status === "unknown")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
