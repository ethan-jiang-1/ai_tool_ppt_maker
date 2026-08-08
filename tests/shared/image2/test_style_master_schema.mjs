import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import {
  STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
  STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
  STYLE_MASTER_GENERATION_PROFILE,
  STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA,
  STYLE_MASTER_SELECTION_SCHEMA,
  createStyleMasterCandidateAttemptRecord,
  createStyleMasterCandidateGrantRecord,
  createStyleMasterHeadRecord,
  createStyleMasterPlanRecord,
  createStyleMasterProviderRequestRecord,
  deriveStyleMasterGrantProgress,
  normalizeStyleMasterAbandonmentReason,
  parseStyleMasterCanonicalBytes,
  styleMasterCanonicalBytes,
  styleMasterGenerationProfileSha256,
  styleMasterReasonSha256,
  validateStyleMasterAbandonmentRecord,
  validateStyleMasterCandidateAttemptRecord,
  validateStyleMasterGenerationProfile,
  validateStyleMasterAttemptTransition,
  validateStyleMasterCandidateGrantRecord,
  validateStyleMasterGeneratedProvenance,
  validateStyleMasterHeadRecord,
  validateStyleMasterLocalProvenance,
  validateStyleMasterPlanIdentity,
  validateStyleMasterPlanRecord,
  validateStyleMasterProviderRequestRecord,
  validateStyleMasterSelectionRecord,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_schema.mjs";
import {
  cleanupStyleMasterStagingDirectory,
  createOrExactMatchStyleMasterRecord,
  createStyleMasterStagingDirectory,
  publishStyleMasterStagedPlan,
  readCanonicalStyleMasterRecord,
  styleMasterStorePaths,
  writeStyleMasterScopeHeadCas,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_store.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

const digest = (letter) => letter.repeat(64);

function planIdentity(overrides = {}) {
  return {
    schema: "page-image-style-master-plan-identity-v1",
    run_version: "v1",
    workflow: "framed",
    plan_generation: 1,
    previous_plan_sha256: null,
    previous_selection_sha256: null,
    style_intent_sha256: digest("a"),
    style_context_sha256: digest("b"),
    candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
    compiled_prompt_sha256: digest("c"),
    generated_candidate_count: 1,
    candidates: [{ candidate_id: "candidate-001", kind: "generated" }],
    ...overrides,
  };
}

function temporaryRun() {
  const root = mkdtempSync(join(tmpdir(), "style-master-schema-"));
  const deck = join(root, "deck_style_master_schema");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir: join(deck, "3_versions", "v1") };
}

describe("Style Master schema and immutable storage", () => {
  it("rejects retired Page Authority candidate bytes before canonical parsing", () => {
    const retiredBytes = Buffer.from('{"schema":"page-authority-style-master-plan-identity-v1","unterminated":', "utf8");
    let failure = null;
    try {
      parseStyleMasterCanonicalBytes(retiredBytes, "retired-candidate-plan.json");
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({ code: "UNSUPPORTED_PROTOCOL" });
  });

  it("uses a non-self-referential plan identity with ordered candidate slots", () => {
    const identity = planIdentity();
    const plan = createStyleMasterPlanRecord(identity);

    expect(validateStyleMasterPlanIdentity(identity)).toMatchObject({ ok: true, plan_sha256: plan.plan_sha256 });
    expect(validateStyleMasterPlanRecord(plan)).toMatchObject({ ok: true, plan_sha256: plan.plan_sha256 });
    expect(plan.plan_sha256).toBe(canonicalJsonSha256(identity));
    expect(Object.keys(identity).sort()).toEqual([
      "schema", "run_version", "workflow", "plan_generation", "previous_plan_sha256", "previous_selection_sha256",
      "style_intent_sha256", "style_context_sha256", "candidate_generation_profile_sha256", "compiled_prompt_sha256",
      "generated_candidate_count", "candidates",
    ].sort());
    expect(plan.plan_sha256).not.toEqual(digest("a"));
    expect(validateStyleMasterPlanIdentity({
      ...identity,
      candidates: [{ candidate_id: "candidate-002", kind: "generated" }],
    })).toMatchObject({ ok: false, code: "style_master_candidate_invalid" });
    expect(validateStyleMasterPlanIdentity({
      ...identity,
      generated_candidate_count: 0,
      candidates: [],
    })).toMatchObject({ ok: false });
    expect(validateStyleMasterPlanIdentity({ ...identity, created_at: "2026-08-01T00:00:00.000Z" })).toMatchObject({ ok: false });
    expect(validateStyleMasterPlanIdentity({ ...identity, candidate_generation_profile_sha256: digest("f") })).toMatchObject({
      ok: false,
      code: "style_master_profile_invalid",
    });
    expect(validateStyleMasterGenerationProfile(STYLE_MASTER_GENERATION_PROFILE)).toMatchObject({
      ok: true,
      candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
    });
    expect(validateStyleMasterGenerationProfile({
      ...STYLE_MASTER_GENERATION_PROFILE,
      output: { ...STYLE_MASTER_GENERATION_PROFILE.output, width: 1999 },
    })).toMatchObject({ ok: false, code: "style_master_profile_invalid" });
  });

  it("cross-binds immutable head, grant, attempts, and derived submission progress", () => {
    const plan = createStyleMasterPlanRecord(planIdentity());
    const head = createStyleMasterHeadRecord(plan);
    const grant = createStyleMasterCandidateGrantRecord(plan);
    const attempt = createStyleMasterCandidateAttemptRecord({
      run_version: "v1",
      workflow: "framed",
      plan_sha256: plan.plan_sha256,
      candidate_id: "candidate-001",
      candidate_grant_sha256: validateStyleMasterCandidateGrantRecord(grant, { plan }).candidate_grant_sha256,
    });
    const submitted = {
      ...attempt,
      status: "submitted",
      provider_request_sha256: digest("d"),
    };

    expect(validateStyleMasterHeadRecord(head, { plan })).toMatchObject({ ok: true });
    expect(validateStyleMasterCandidateGrantRecord(grant, { plan })).toMatchObject({ ok: true });
    expect(validateStyleMasterAttemptTransition(attempt, submitted)).toMatchObject({ ok: true, replay: false });
    expect(deriveStyleMasterGrantProgress({ plan, grant, attempts: [attempt] })).toMatchObject({
      consumed_submissions: 0,
      remaining_submissions: 1,
    });
    expect(deriveStyleMasterGrantProgress({ plan, grant, attempts: [submitted] })).toMatchObject({
      consumed_submissions: 1,
      remaining_submissions: 0,
    });
    expect(validateStyleMasterAttemptTransition(submitted, { ...submitted, candidate_grant_sha256: digest("e") })).toMatchObject({ ok: false });
  });

  it("uses exact provider request and abandonment records with replay-stable normalized reasons", () => {
    const plan = createStyleMasterPlanRecord(planIdentity());
    const head = createStyleMasterHeadRecord(plan);
    const grant = createStyleMasterCandidateGrantRecord(plan);
    const grantChecked = validateStyleMasterCandidateGrantRecord(grant, { plan });
    const request = createStyleMasterProviderRequestRecord({
      plan_sha256: plan.plan_sha256,
      candidate_id: "candidate-001",
      compiled_prompt_sha256: plan.compiled_prompt_sha256,
      candidate_generation_profile_sha256: plan.candidate_generation_profile_sha256,
    });
    const requestChecked = validateStyleMasterProviderRequestRecord(request, { plan, candidateId: "candidate-001" });
    const claimed = createStyleMasterCandidateAttemptRecord({
      run_version: plan.run_version,
      workflow: plan.workflow,
      plan_sha256: plan.plan_sha256,
      candidate_id: "candidate-001",
      candidate_grant_sha256: grantChecked.candidate_grant_sha256,
    });
    const submitted = { ...claimed, status: "submitted", provider_request_sha256: requestChecked.provider_request_sha256 };
    const reason = normalizeStyleMasterAbandonmentReason("  Cafe\u0301\t provider  outcome  ");
    const unknown = { ...submitted, status: "unknown", reason_sha256: styleMasterReasonSha256(reason) };
    const unknownChecked = validateStyleMasterCandidateAttemptRecord(unknown, { plan, grant });
    const headChecked = validateStyleMasterHeadRecord(head, { plan });
    const abandonment = {
      schema: STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
      run_version: plan.run_version,
      workflow: plan.workflow,
      scope_head_sha256: headChecked.head_sha256,
      plan_sha256: plan.plan_sha256,
      candidate_grant_sha256: grantChecked.candidate_grant_sha256,
      candidate_id: "candidate-001",
      unknown_attempt_sha256: unknownChecked.attempt_record_sha256,
      provider_request_sha256: requestChecked.provider_request_sha256,
      reason,
      reason_sha256: styleMasterReasonSha256(reason),
    };

    expect(Object.keys(request).sort()).toEqual([
      "schema", "plan_sha256", "candidate_id", "compiled_prompt_sha256", "candidate_generation_profile_sha256",
    ].sort());
    expect(Object.keys(unknown).sort()).toEqual([
      "schema", "run_version", "workflow", "plan_sha256", "candidate_id", "candidate_grant_sha256", "status",
      "provider_request_sha256", "candidate_sha256", "candidate_provenance_sha256", "reason_sha256",
    ].sort());
    expect(Object.keys(abandonment).sort()).toEqual([
      "schema", "run_version", "workflow", "scope_head_sha256", "plan_sha256", "candidate_grant_sha256", "candidate_id",
      "unknown_attempt_sha256", "provider_request_sha256", "reason", "reason_sha256",
    ].sort());
    expect(reason).toBe("Caf\u00e9 provider outcome");
    expect(normalizeStyleMasterAbandonmentReason("Caf\u00e9 provider outcome")).toBe(reason);
    expect(validateStyleMasterAbandonmentRecord(abandonment, { head, plan, grant, attempt: unknown })).toMatchObject({
      ok: true,
      abandonment_sha256: canonicalJsonSha256(abandonment),
    });
    expect(validateStyleMasterAbandonmentRecord({ ...abandonment, extra: null })).toMatchObject({ ok: false });
    expect(validateStyleMasterAbandonmentRecord({ ...abandonment, reason_sha256: digest("f") })).toMatchObject({ ok: false });
    expect(() => normalizeStyleMasterAbandonmentReason("\u0000")).toThrow();
    expect(() => normalizeStyleMasterAbandonmentReason("x".repeat(513))).toThrow();
  });

  it("keeps local and generated provenance distinct and validates selection fields", () => {
    const local = {
      schema: STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA,
      kind: "local-existing",
      source_asset: "visual-style/style_master.jpg",
      candidate_sha256: digest("a"),
      candidate_media_type: "image/jpeg",
      candidate_width: 20,
      candidate_height: 10,
    };
    const generated = {
      schema: STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
      kind: "generated",
      plan_sha256: digest("a"),
      candidate_id: "candidate-001",
      compiled_prompt_sha256: digest("b"),
      candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
      provider_request_sha256: digest("c"),
      candidate_sha256: digest("d"),
      candidate_media_type: "image/png",
      candidate_width: 2000,
      candidate_height: 1125,
    };
    const selection = {
      schema: STYLE_MASTER_SELECTION_SCHEMA,
      run_version: "v1",
      workflow: "framed",
      plan_sha256: digest("a"),
      candidate_id: "candidate-001",
      candidate_sha256: digest("b"),
      candidate_media_type: "image/png",
      candidate_width: 2000,
      candidate_height: 1125,
      candidate_provenance_sha256: digest("c"),
      style_intent_sha256: digest("d"),
      style_context_sha256: digest("e"),
      candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
      previous_selection_sha256: null,
      review_decision_sha256: digest("f"),
      accepted_at: "2026-08-01T00:00:00.000Z",
    };

    expect(validateStyleMasterLocalProvenance(local)).toMatchObject({
      ok: true,
      candidate_provenance_sha256: canonicalJsonSha256(local),
    });
    expect(validateStyleMasterGeneratedProvenance(generated)).toMatchObject({ ok: true });
    expect(validateStyleMasterSelectionRecord(selection, { expectedRunVersion: "v1", expectedWorkflow: "framed" })).toMatchObject({ ok: true });
    expect(validateStyleMasterGeneratedProvenance({ ...generated, candidate_width: 1999, candidate_height: 1111 })).toMatchObject({ ok: true });
    expect(validateStyleMasterGeneratedProvenance({ ...generated, candidate_width: 0 })).toMatchObject({ ok: false });
    expect(validateStyleMasterLocalProvenance({ ...local, plan_sha256: digest("f") })).toMatchObject({ ok: false });
    expect(validateStyleMasterGeneratedProvenance({ ...generated, candidate_generation_profile_sha256: digest("f") })).toMatchObject({
      ok: false,
      code: "style_master_profile_invalid",
    });
    expect(validateStyleMasterSelectionRecord({ ...selection, accepted_at: "soon" })).toMatchObject({ ok: false });
    expect(validateStyleMasterSelectionRecord({ ...selection, candidate_generation_profile_sha256: digest("f") })).toMatchObject({
      ok: false,
      code: "style_master_profile_invalid",
    });
  });

  it("publishes only a validated staged plan and CASes the one scope head", () => {
    const fixture = temporaryRun();
    try {
      const plan = createStyleMasterPlanRecord(planIdentity());
      const head = createStyleMasterHeadRecord(plan);
      const staging = createStyleMasterStagingDirectory(fixture.runDir, "test-plan");
      writeFileSync(join(staging, "candidate-plan.json"), styleMasterCanonicalBytes(plan));
      const paths = styleMasterStorePaths(fixture.runDir, { workflow: "framed", plan_sha256: plan.plan_sha256 });
      const publish = publishStyleMasterStagedPlan(fixture.runDir, {
        staging_path: staging,
        plan_sha256: plan.plan_sha256,
        validate_bundle: (root) => {
          const record = readCanonicalStyleMasterRecord(join(root, "candidate-plan.json"), validateStyleMasterPlanRecord);
          expect(record.plan_sha256).toBe(plan.plan_sha256);
        },
      });
      const firstHead = writeStyleMasterScopeHeadCas(fixture.runDir, {
        workflow: "framed",
        head,
        plan,
        expected_bytes: null,
      });

      expect(publish).toMatchObject({ published: true, replay: false, plan_root: paths.plan_root });
      expect(readFileSync(paths.candidate_plan)).toEqual(styleMasterCanonicalBytes(plan));
      expect(firstHead.previous_bytes).toBeNull();
      expect(validateStyleMasterHeadRecord({ ...head, ignored_runtime_state: null }, { plan })).toMatchObject({ ok: false });
      expect(validateStyleMasterHeadRecord({ ...head, plan_generation: 2 }, { plan })).toMatchObject({ ok: false });
      const exactReplay = writeStyleMasterScopeHeadCas(fixture.runDir, {
        workflow: "framed",
        head,
        plan,
        expected_bytes: firstHead.bytes,
      });
      expect(exactReplay.previous_bytes).toEqual(firstHead.bytes);
      expect(() => writeStyleMasterScopeHeadCas(fixture.runDir, {
        workflow: "framed",
        head,
        plan,
        expected_bytes: null,
      })).toThrow(/scope head changed/);
      expect(() => writeStyleMasterScopeHeadCas(fixture.runDir, {
        workflow: "framed",
        head,
        plan,
        expected_bytes: Buffer.from("not the exact canonical head"),
      })).toThrow(/scope head changed/);
      expect(cleanupStyleMasterStagingDirectory(fixture.runDir, staging)).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("creates immutable grant bytes once and exact-replays them", () => {
    const fixture = temporaryRun();
    try {
      const plan = createStyleMasterPlanRecord(planIdentity());
      const grant = createStyleMasterCandidateGrantRecord(plan);
      const paths = styleMasterStorePaths(fixture.runDir, { plan_sha256: plan.plan_sha256 });
      const first = createOrExactMatchStyleMasterRecord(paths.candidate_grant, grant, validateStyleMasterCandidateGrantRecord, { plan });
      const replay = createOrExactMatchStyleMasterRecord(paths.candidate_grant, grant, validateStyleMasterCandidateGrantRecord, { plan });
      expect(first).toMatchObject({ created: true, replay: false });
      expect(replay).toMatchObject({ created: false, replay: true });
      expect(readFileSync(paths.candidate_grant)).toEqual(styleMasterCanonicalBytes(grant));
      expect(validateStyleMasterCandidateGrantRecord({
        ...grant,
        generated_candidate_ids: ["candidate-002"],
      }, { plan })).toMatchObject({ ok: false, code: "style_master_grant_invalid" });
      const beforeConflict = readFileSync(paths.candidate_grant);
      expect(() => createOrExactMatchStyleMasterRecord(paths.candidate_grant, {
        ...grant,
        generated_candidate_ids: ["candidate-002"],
      }, validateStyleMasterCandidateGrantRecord)).toThrow(/differs from the requested canonical record/);
      expect(readFileSync(paths.candidate_grant)).toEqual(beforeConflict);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps partial staging non-authoritative and confines explicit cleanup", () => {
    const fixture = temporaryRun();
    try {
      const plan = createStyleMasterPlanRecord(planIdentity());
      const paths = styleMasterStorePaths(fixture.runDir, { workflow: "framed", plan_sha256: plan.plan_sha256 });
      const staging = createStyleMasterStagingDirectory(fixture.runDir, "partial-plan");
      writeFileSync(join(staging, "candidate-plan.json"), Buffer.from("{", "utf8"));

      expect(() => publishStyleMasterStagedPlan(fixture.runDir, {
        staging_path: staging,
        plan_sha256: plan.plan_sha256,
        validate_bundle: (root) => readCanonicalStyleMasterRecord(join(root, "candidate-plan.json"), validateStyleMasterPlanRecord),
      })).toThrow();
      expect(existsSync(staging)).toBe(true);
      expect(existsSync(paths.scope_head)).toBe(false);
      expect(existsSync(paths.plan_root)).toBe(false);
      expect(() => cleanupStyleMasterStagingDirectory(fixture.runDir, paths.plan_root)).toThrow(/must remain below/);
      expect(cleanupStyleMasterStagingDirectory(fixture.runDir, staging)).toBe(true);
      expect(existsSync(staging)).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not traverse a symlinked staging root during cleanup", () => {
    const fixture = temporaryRun();
    try {
      const paths = styleMasterStorePaths(fixture.runDir);
      const externalRoot = join(fixture.root, "external-staging");
      const externalPlan = join(externalRoot, "plan-escape");
      mkdirSync(externalPlan, { recursive: true });
      mkdirSync(paths.history_root, { recursive: true });
      symlinkSync(externalRoot, paths.staging_root, "dir");

      expect(() => cleanupStyleMasterStagingDirectory(fixture.runDir, join(paths.staging_root, "plan-escape")))
        .toThrow(/staging root must be a real directory/);
      expect(existsSync(externalPlan)).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
