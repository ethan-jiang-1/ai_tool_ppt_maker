import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  createProgressiveRawBatch,
  createProgressiveRawItemAttempt,
  createProgressiveRawMaterializationProvenance,
  createProgressiveRawScopeHead,
  createProgressiveRawWorkPlan,
  validateProgressiveRawBatch,
  validateProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_schema.mjs";
import { sha256Bytes } from "../../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import {
  publishProgressiveRawMaterialization,
  publishProgressiveRawStagedPlan,
  progressiveRawStorePaths,
  readProgressiveRawPlanDirectRecords,
  readProgressiveRawScopeHead,
  stageProgressiveRawPlanContainer,
  writeProgressiveRawItemAttempt,
  writeProgressiveRawScopeHeadCas,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_store.mjs";
import { pageAuthorityImage2Paths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_authority_paths.mjs";
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
  readProgressiveAcceptedRawWork,
  reconcileProgressiveRawAttempt,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_raw_owner.mjs";

const digest = (letter) => letter.repeat(64);

function fixturePlan(count = 1, {
  source_receipt_sha256 = digest("a"),
  source_epoch = 1,
  provider_profile_sha256 = digest("b"),
  effective_style_master_sha256 = digest("c"),
  source_execution_sha256 = digest("d"),
} = {}) {
  const ids = Array.from({ length: count }, (_value, index) => `Slide${String(index + 1).padStart(2, "0")}`);
  return createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256,
    source_epoch,
    workflow: "pure",
    provider_profile_sha256,
    effective_style_master_sha256,
    source_execution_sha256,
    ordered_slide_ids: ids,
    items: ids.map((slide_id, index) => ({ slide_id, raw_contract_sha256: `${index.toString(16)}`.repeat(64) })),
  });
}

function fixtureRun() {
  const root = mkdtempSync(join(tmpdir(), "progressive-page-production-"));
  const deck = join(root, "deck_progressive_fixture");
  const runDir = join(deck, "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  return { root, deck, runDir };
}

function appendTerminalAttemptSibling(runDir, { plan, batch_hash, status }) {
  const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
  const submitted = direct.attempts.find((entry) =>
    entry.record.batch_sha256 === batch_hash && entry.record.status === "submitted",
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

describe("progressive Page Authority raw owner", () => {
  it("preserves legacy v2 raw records and returns only the owner-issued progressive replan action", () => {
    const { root, runDir } = fixtureRun();
    try {
      const legacyPlan = createRawWorkPlan({
        source_receipt_sha256: digest("a"),
        workflow: "pure",
        ordered_slide_ids: ["Slide01"],
        provider_profile_sha256: digest("b"),
        authorization_scope_sha256: digest("c"),
        items: [{ slide_id: "Slide01", raw_contract_sha256: digest("d") }],
      });
      const legacyEvidence = createAcceptedRawEvidence({
        plan: legacyPlan,
        provider_authorization_sha256: digest("e"),
        raw_review_sha256: digest("f"),
        raw_bytes_by_slide: { Slide01: Buffer.from("legacy raw bytes") },
      });
      const legacyPaths = pageAuthorityImage2Paths(runDir);
      mkdirSync(dirname(legacyPaths.target_raw_plan), { recursive: true });
      writeFileSync(legacyPaths.target_raw_plan, Buffer.from(`${JSON.stringify(legacyPlan)}\n`, "utf8"));
      writeFileSync(legacyPaths.target_raw_evidence, Buffer.from(`${JSON.stringify(legacyEvidence)}\n`, "utf8"));
      const legacyPlanBytes = readFileSync(legacyPaths.target_raw_plan);
      const legacyEvidenceBytes = readFileSync(legacyPaths.target_raw_evidence);
      const v3Paths = progressiveRawStorePaths(runDir, { workflow: "pure" });

      expect(existsSync(v3Paths.history_root)).toBe(false);
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: true,
        legacy_v2: true,
        plan: null,
        progress: null,
        primary_action: { action_id: "replan_progressive_raw_work", kind: "repair" },
      });
      expect(readProgressiveRawScopeHead(runDir, { workflow: "pure" })).toBeNull();
      expect(existsSync(v3Paths.history_root)).toBe(false);
      expect(readFileSync(legacyPaths.target_raw_plan)).toEqual(legacyPlanBytes);
      expect(readFileSync(legacyPaths.target_raw_evidence)).toEqual(legacyEvidenceBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds v3 batches to one complete ordered plan and rejects cross-bound tuples", () => {
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
    expect(validateProgressiveRawBatch(batch, { plan })).toMatchObject({ ok: true, sha256: batch.sha256 });
    expect(validateProgressiveRawBatch({ ...batch, provider_profile_sha256: digest("9") }, { plan }))
      .toMatchObject({ ok: false, code: "progressive_raw_cross_bound" });
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
      })).toMatchObject({ published: true, plan_root: expect.stringContaining(plan.sha256) });
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

  it("binds a batch grant to exact current plan facts and blocks stale provider preflight", async () => {
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
      const grant = await authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
      })).resolves.toMatchObject({ replay: true, grant_hash: grant.grant_hash, maximum_submissions: 2 });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: digest("e"),
        batch_hash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      await expect(authorizeProgressiveRawBatch({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: digest("e"),
      })).rejects.toMatchObject({ code: "progressive_raw_batch_stale" });

      const submit = vi.fn(async () => Buffer.from("must not submit"));
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        expected_plan: fixturePlan(2, { source_receipt_sha256: digest("f") }),
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request-v1" },
          Slide02: { schema: "fixture-request-v1" },
        },
        submit,
      })).rejects.toMatchObject({ code: "progressive_raw_plan_stale" });
      expect(submit).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 }).grants)
        .toHaveLength(1);
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" }).primary_action)
        .toMatchObject({ action_id: "publish_target_final_manifest", plan_hash: plan.sha256 });
      expect(readProgressiveAcceptedRawWork({ runDir, workflow: "pure", plan_hash: plan.sha256 }).raw_bytes_by_slide.Slide01)
        .toEqual(Buffer.from("fixture raw bytes"));
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_profile_sha256: digest("1"),
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
        submit: async () => { throw new Error("connection ended after submit"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const blocked = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
      expect(blocked.primary_action).toMatchObject({ action_id: "reconcile_progressive_raw_attempt", plan_hash: plan.sha256 });
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_requests_by_slide: { Slide02: { schema: "fixture-request-v1" } },
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

  it("keeps a succeeded and unknown sibling branch as an integrity hard-stop", async () => {
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
      const submitted = vi.fn(async () => Buffer.from("fixture succeeded bytes"));
      await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
        submit: submitted,
      });
      appendTerminalAttemptSibling(runDir, {
        plan,
        batch_hash: pilot.batch.batch_hash,
        status: "unknown",
      });

      const before = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "pure" })).toMatchObject({
        ok: false,
        code: "progressive_raw_attempt_chain_invalid",
      });
      const blockedSubmit = vi.fn(async () => Buffer.from("must not submit"));
      await expect(generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
        submit: blockedSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_attempt_chain_invalid" });
      expect(submitted).toHaveBeenCalledTimes(1);
      expect(blockedSubmit).not.toHaveBeenCalled();
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 })).toEqual(before);
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
          provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
      expect(reconciled).toMatchObject({ outcome: "succeeded", historical: false, progress: { materialized: 1 } });
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        progress: { claimed: 1, submitted: 0 },
        primary_action: { action_id: "generate_progressive_raw_item" },
      });

      const seenSubmitted = [];
      const first = await generateProgressiveRawItem({
        runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request-v1", item: "one" },
          Slide02: { schema: "fixture-request-v1", item: "two" },
        },
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
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request-v1", item: "one" },
          Slide02: { schema: "fixture-request-v1", item: "two" },
        },
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
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request-v1" },
          Slide02: { schema: "fixture-request-v1" },
        },
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
        provider_requests_by_slide: {
          Slide01: { schema: "fixture-request-v1" },
          Slide02: { schema: "fixture-request-v1" },
        },
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

  it("returns only bounded tagged Page Authority media facts without materializing rejected bytes", async () => {
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
        submit: async () => {
          const error = new Error("PROVIDER_RESPONSE_BODY_SENTINEL");
          error.page_authority_known_failure = true;
          error.page_authority_known_failure_facts = {
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

  it("returns only bounded tagged Page Authority response facts without materializing rejected bytes", async () => {
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
        submit: async () => {
          const error = new Error("PROVIDER_RESPONSE_BODY_SENTINEL");
          error.page_authority_known_failure = true;
          error.page_authority_known_failure_facts = {
            response: {
              classification: "http_error",
              http_status: 502,
              provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
            },
          };
          throw error;
        },
      });

      expect(result).toMatchObject({
        item: "Slide01",
        outcome: "known_failure",
        provider_failure: { classification: "http_error", http_status: 502 },
        progress: { materialized: 0, known_failure: 1 },
        next_action: { action_id: "plan_progressive_pilot" },
      });
      expect(result.provider_media).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain("PROVIDER_RESPONSE_BODY_SENTINEL");
      const records = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
      expect(records.materializations).toHaveLength(0);
      expect(records.attempts.some((entry) => entry.record.status === "succeeded")).toBe(false);
      expect(records.attempts.filter((entry) => entry.record.status === "known_failure")).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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

  it("reconciles an exact historical submitted attempt without advancing the current head", async () => {
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
        provider_requests_by_slide: { Slide01: { schema: "fixture-request-v1" } },
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
        historical: true,
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
