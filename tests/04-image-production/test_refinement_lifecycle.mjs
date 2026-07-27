import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initHtmlFirstBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  REFINEMENT_PLAN_SCHEMA_V1,
  REFINEMENT_STATE_SCHEMA_V1,
  buildPlan,
  authorizePlan,
  loadRefinementOperations,
  prerequisiteWaiverFingerprint,
  transitionAttempt,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/transport.mjs";
import { createCandidateRecord, sha256 } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/contracts.mjs";
import { candidatePaths, ensureRefinementDerivedRoots, persistCandidate, writeCandidateComparison, listReviews, refinementReviewDigest, cleanupRefinement } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/storage.mjs";
import { projectImage2RefinementState, readImage2RefinementState, readState, startPlaybook, writeImage2RefinementState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { assemblyReceiptPath } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs";
import { createCurrentHtmlDelivery } from "../helpers/image2_refinement_fixture.mjs";

const png = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([20, 30, 40, 255]), channels: 4, depth: 8 }));
const planInput = {
  run_version: "v1",
  delivery_digest: "d".repeat(64),
  profile_fingerprint: "c".repeat(64),
  profile_contract: {
    schema: "pptmaker-image2-visual-slot-profile-v1",
    mode: "visual-slot",
    profile_fingerprint: "c".repeat(64),
  },
  request_contract_version: "pptmaker-refinement-submit-request-v1",
  request_fingerprints: [
    { role: "slot:Alpha:primary_visual", kind: "slot", slide_id: "Alpha", slot: "primary_visual", request_fingerprint: "d".repeat(64) },
    { role: "slot:Bravo:primary_visual", kind: "slot", slide_id: "Bravo", slot: "primary_visual", request_fingerprint: "e".repeat(64) },
  ],
  style_reference_status: "current",
  slides: [
    { slide_id: "Alpha", slot: "primary_visual", visual_contract_fingerprint: "a".repeat(64) },
    { slide_id: "Bravo", slot: "primary_visual", visual_contract_fingerprint: "b".repeat(64) },
  ],
};

async function createAuthorizedRun(prefix) {
  const fixture = await createCurrentHtmlDelivery(prefix, { mode: "html-then-image2" });
  const operations = await loadRefinementOperations();
  const plan = await operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
  const authorization = await operations.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-test" });
  return { ...fixture, operations, plan, authorization, attempts: Object.values(authorization.attempts) };
}

function setAttemptSubmitting(fixture, attemptId, providerRequestId = null) {
  const state = readState(fixture.deck, { purpose: "execute" });
  const record = readImage2RefinementState(state, "v1");
  record.authorization = { ...record.authorization, used: true, used_at: "2026-07-20T00:00:00.000Z" };
  record.attempts[attemptId] = transitionAttempt(record.attempts[attemptId], "submitting", {
    updated_at: "2026-07-20T00:00:00.000Z",
    ...(providerRequestId ? { provider_request_id: providerRequestId } : {}),
  });
  writeImage2RefinementState(fixture.deck, "v1", record);
  return record.attempts[attemptId];
}

function submittedBytes(request) {
  return { status: "submitted", bytes: png, media: "image/png", width: 1, height: 1, provider_request_id: `provider-${request.attempt_id}`, receipt: { provider_request_id: `provider-${request.attempt_id}` } };
}

describe("Phase 4 lifecycle boundaries", () => {
  it("keeps random authorization/attempt identity outside the deterministic hash", () => {
    const plan = buildPlan(planInput);
    const first = authorizePlan(plan, "auth-one");
    const second = authorizePlan(plan, "auth-two");
    expect(first.plan_hash).toBe(plan.plan_hash);
    expect(second.plan_hash).toBe(plan.plan_hash);
    expect(first.attempts.map((entry) => entry.attempt_id)).not.toEqual(second.attempts.map((entry) => entry.attempt_id));
  });

  it("never reopens a terminal unknown-submit attempt", () => {
    const planned = { attempt_id: "attempt-one", authorization_id: "auth-one", plan_hash: "a".repeat(64), kind: "slot", slide_id: "Alpha", slot: "primary_visual", state: "planned" };
    const unknown = transitionAttempt(transitionAttempt(planned, "submitting"), "unknown-submit");
    expect(() => transitionAttempt(unknown, "submitting")).toThrow(/not allowed/);
  });

  it("rejects direct refinement work in html-only without creating derived state", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-html-only-disabled-");
    try {
      const operations = await loadRefinementOperations();
      const paths = operations.refinementPaths(fixture.runDir);
      await expect(operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
      })).rejects.toThrow(/disabled for html-only/);
      expect(existsSync(paths.generated)).toBe(false);
      expect(existsSync(paths.scratch)).toBe(false);
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toBeNull();
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("fake transport records exactly one submit and keeps receipts secret-safe", async () => {
    const transport = createFakeRefinementTransport({ onSubmit: async () => ({ status: "submitted", receipt: { provider_request_id: "p-1", api_key: "sentinel" } }) });
    const result = await transport.submitAttempt({ attempt_id: "attempt-one", authorization_id: "auth-one" });
    expect(transport.submitCount).toBe(1);
    expect(result.receipt).toEqual({ provider_request_id: "p-1" });
  });

  it("persists provider request identity through unknown-submit reconciliation without a resubmit", async () => {
    const fixture = await createAuthorizedRun("image2-provider-id-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const slot = fixture.attempts.find((attempt) => attempt.kind === "slot");
      let reconciledRequest = null;
      const transport = createFakeRefinementTransport({
        onSubmit: async (request) => request.kind === "style-reference"
          ? submittedBytes(request)
          : {
              status: "unknown-submit",
              provider_request_id: "task-slot-persisted-001",
              receipt: { provider_request_id: "task-slot-persisted-001" },
            },
        onReconcile: async (request) => {
          reconciledRequest = request;
          return {
            ...submittedBytes(request),
            provider_request_id: request.provider_request_id,
            receipt: { provider_request_id: request.provider_request_id },
          };
        },
      });

      await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport });
      const unknown = await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: slot.attempt_id, transport });
      expect(unknown.attempt).toMatchObject({ state: "unknown-submit", provider_request_id: "task-slot-persisted-001" });
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts[slot.attempt_id]).toMatchObject({
        state: "unknown-submit",
        provider_request_id: "task-slot-persisted-001",
      });

      const resolved = await fixture.operations.reconcileRefinementAttempt({ runDir: fixture.runDir, attemptId: slot.attempt_id, transport });
      expect(reconciledRequest).toEqual({
        attempt_id: slot.attempt_id,
        authorization_id: fixture.authorization.authorization.authorization_id,
        plan_hash: fixture.plan.plan_hash,
        provider_request_id: "task-slot-persisted-001",
      });
      expect(resolved.attempt).toMatchObject({ state: "submitted", provider_request_id: "task-slot-persisted-001" });
      expect(transport.submitCount).toBe(2);
      expect(transport.reconcileCount).toBe(1);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("verifies current request material before initializing a lazy generation transport", async () => {
    const fixture = await createAuthorizedRun("image2-lazy-transport-boundary-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const state = readState(fixture.deck, { purpose: "execute" });
      const record = readImage2RefinementState(state, "v1");
      record.attempts[setup.attempt_id] = {
        ...record.attempts[setup.attempt_id],
        request_fingerprint: "f".repeat(64),
      };
      writeImage2RefinementState(fixture.deck, "v1", record);

      let factoryCalls = 0;
      await expect(fixture.operations.generateRefinement({
        runDir: fixture.runDir,
        attemptId: setup.attempt_id,
        transportFactory: async () => {
          factoryCalls += 1;
          return createFakeRefinementTransport({ onSubmit: async (request) => submittedBytes(request) });
        },
      })).rejects.toThrow(/request fingerprint is stale/);

      expect(factoryCalls).toBe(0);
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts[setup.attempt_id]).toMatchObject({
        state: "planned",
        request_fingerprint: "f".repeat(64),
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("cleanup is hash-bound and retains one rejected candidate per slide", () => {
    const root = mkdtempSync(join(tmpdir(), "image2-cleanup-"));
    const deck = join(root, "deck_cleanup");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const run = join(deck, "3_versions", "v1");
      ensureRefinementDerivedRoots(run);
      for (const [id, at] of [["candidate-old", "2026-01-01T00:00:00.000Z"], ["candidate-new", "2026-01-02T00:00:00.000Z"]]) {
        const candidate = createCandidateRecord({ candidate_id: id, attempt_id: `attempt-${id}`, authorization_id: "auth-one", plan_hash: "a".repeat(64), run_version: "v1", slide_id: "Alpha", slot: "primary_visual", sha256: "".padStart(64, "0"), profile_fingerprint: "b".repeat(64), created_at: at });
        // The contract SHA is replaced with the measured fixture bytes.
        const measured = { ...candidate, sha256: sha256(png) };
        persistCandidate(run, measured, png);
        writeCandidateComparison(run, id, `<html>${id}</html>`, { schema: "pptmaker-image2-refinement-review-v1", run_version: "v1", slide_id: "Alpha", slot: "primary_visual", candidate_id: id, candidate_sha256: measured.sha256, decision: "use-html", reviewed_at: at, created_at: at });
      }
      const digest = refinementReviewDigest(listReviews(run));
      const result = cleanupRefinement(run, { expectedReviewSha256: digest });
      expect(result.retained_candidate_ids).toEqual(["candidate-new"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("cleanup rejects ambiguous review ordering", () => {
    const root = mkdtempSync(join(tmpdir(), "image2-cleanup-ordering-"));
    const deck = join(root, "deck_cleanup");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const run = join(deck, "3_versions", "v1");
      const at = "2026-01-01T00:00:00.000Z";
      for (const id of ["candidate-one", "candidate-two"]) {
        const candidate = createCandidateRecord({ candidate_id: id, attempt_id: `attempt-${id}`, authorization_id: "auth-one", plan_hash: "a".repeat(64), run_version: "v1", slide_id: "Alpha", slot: "primary_visual", sha256: sha256(png), profile_fingerprint: "b".repeat(64), created_at: at });
        persistCandidate(run, candidate, png);
        writeCandidateComparison(run, id, `<html>${id}</html>`, { schema: "pptmaker-image2-refinement-review-v1", run_version: "v1", slide_id: "Alpha", slot: "primary_visual", candidate_id: id, candidate_sha256: candidate.sha256, decision: "use-html", reviewed_at: at, created_at: at });
      }
      const digest = refinementReviewDigest(listReviews(run));
      expect(() => cleanupRefinement(run, { expectedReviewSha256: digest })).toThrow(/duplicate timestamps/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("cleanup rejects SHA-mismatched candidate bytes", () => {
    const root = mkdtempSync(join(tmpdir(), "image2-cleanup-sha-"));
    const deck = join(root, "deck_cleanup");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const run = join(deck, "3_versions", "v1");
      const at = "2026-01-01T00:00:00.000Z";
      const candidate = createCandidateRecord({ candidate_id: "candidate-one", attempt_id: "attempt-one", authorization_id: "auth-one", plan_hash: "a".repeat(64), run_version: "v1", slide_id: "Alpha", slot: "primary_visual", sha256: sha256(png), profile_fingerprint: "b".repeat(64), created_at: at });
      persistCandidate(run, candidate, png);
      writeCandidateComparison(run, candidate.candidate_id, "<html>candidate</html>", { schema: "pptmaker-image2-refinement-review-v1", run_version: "v1", slide_id: "Alpha", slot: "primary_visual", candidate_id: candidate.candidate_id, candidate_sha256: candidate.sha256, decision: "use-html", reviewed_at: at, created_at: at });
      const digest = refinementReviewDigest(listReviews(run));
      writeFileSync(candidatePaths(run, candidate.candidate_id).bytes, Buffer.from("tampered"));
      expect(() => cleanupRefinement(run, { expectedReviewSha256: digest })).toThrow(/SHA-mismatched/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("recommendation and decline keep the optional path lazy", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-lazy-decline-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const paths = operations.refinementPaths(fixture.runDir);
      expect(existsSync(paths.generated)).toBe(false);
      expect(existsSync(paths.scratch)).toBe(false);
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toBeNull();
      const recommendation = await operations.recommendRefinement({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      expect(recommendation.plan.slides.map((slide) => slide.slide_id)).toEqual(["AlphaGo", "BravoGo"]);
      expect(recommendation.expected_attempts).toBe(3);
      expect(existsSync(paths.generated)).toBe(false);
      expect(existsSync(paths.scratch)).toBe(false);
      expect(await operations.declineRefinement({ runDir: fixture.runDir })).toMatchObject({ declined: true, provider_calls: 0 });
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toBeNull();
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("terminal refinement handoff retains its exact continuation target", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-terminal-continuation-", { mode: "html-then-image2" });
    try {
      const state = readState(fixture.deck, { purpose: "execute", heal: false });
      startPlaybook(state, "image2-refine", { replace: true, runVersion: "v1" });
      state.current_node = "recommend-image2-refinement";
      state.nodes["recommend-image2-refinement"] = {
        status: "in_progress",
        execution_id: state.execution_id,
        run_version: "v1",
        evidence: {},
      };
      writeState(fixture.deck, state);
      const operations = await loadRefinementOperations();
      expect(await operations.declineRefinement({ runDir: fixture.runDir })).toMatchObject({ declined: true });
      expect(readState(fixture.deck, { purpose: "observe", heal: false })).toMatchObject({
        playbook: "",
        continuation_target_version: "v1",
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("requires complete delivery normally and records a plan-bound forced prerequisite waiver", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-forced-prerequisite-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const ordinaryForce = await operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
        force: true,
        reason: "This force is unnecessary because complete delivery evidence is current.",
      });
      expect(ordinaryForce.force_not_needed).toBe(true);
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toMatchObject({
        prerequisite_waiver: null,
      });

      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assembly = JSON.parse(readFileSync(receiptPath, "utf8"));
      assembly.html_delivery_digest = "f".repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assembly, null, 2)}\n`);

      await expect(operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
      })).rejects.toThrow(/complete evidence/);
      await expect(operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
        force: true,
      })).rejects.toThrow(/human reason/);

      const forced = await operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
        force: true,
        reason: "The current final slides are identifiable while the assembly lineage is rebuilt.",
      });
      expect(forced.force_not_needed).toBe(false);
      expect(forced.prerequisite_waiver_fingerprint).toMatch(/^[0-9a-f]{64}$/);
      const record = readImage2RefinementState(readState(fixture.deck), "v1");
      expect(record).toMatchObject({
        schema: "pptmaker-image-production-state-v1",
        plan: {
          schema: "pptmaker-image2-refinement-plan-v2",
          plan_hash: forced.plan_hash,
          prerequisite_waiver_fingerprint: forced.prerequisite_waiver_fingerprint,
        },
        prerequisite_waiver: {
          run_version: "v1",
          html_delivery_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        },
      });
      expect(record.prerequisite_waiver.waived_checks.length).toBeGreaterThan(0);
      expect(prerequisiteWaiverFingerprint(record.prerequisite_waiver)).toBe(forced.prerequisite_waiver_fingerprint);
      const phase3 = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs");
      const finalSlides = await phase3.resolveCurrentHtmlFinalSlideDelivery(fixture.runDir, {
        htmlProductionResetId: null,
      });
      expect(record.prerequisite_waiver.html_delivery_digest).toBe(finalSlides.html_delivery_digest);

      const authorized = await operations.authorizeRefinement({
        runDir: fixture.runDir,
        planHash: forced.plan_hash,
        authorizationId: "auth-forced-prerequisite",
      });
      expect(authorized.authorization.plan_hash).toBe(forced.plan_hash);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("does not let a forced offline plan override a current delivery repair decision", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-force-repair-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const review = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");
      review.publishHtmlDeliveryDecision(fixture.runDir, {
        decision: "repair",
        reason: "The current delivery requires an owning source repair before optional refinement.",
      });
      await expect(operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
        force: true,
        reason: "Optional planning must not replace the repair decision.",
      })).rejects.toThrow(/repair or redirect/);
      const paths = operations.refinementPaths(fixture.runDir);
      expect(existsSync(paths.generated)).toBe(false);
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).toBeNull();
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("permits exact candidate review and promotion after a forced prerequisite waiver", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-force-promote-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      await operations.enterRefinementController({ runDir: fixture.runDir });
      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assembly = JSON.parse(readFileSync(receiptPath, "utf8"));
      assembly.html_delivery_digest = "f".repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assembly, null, 2)}\n`);
      const plan = await operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
        force: true,
        reason: "The current final-slide identity is sufficient for this authorized visual-slot review.",
      });
      const authorization = await operations.authorizeRefinement({
        runDir: fixture.runDir,
        planHash: plan.plan_hash,
        authorizationId: "auth-force-promote",
      });
      const setup = Object.values(authorization.attempts).find((attempt) => attempt.kind === "style-reference");
      const alpha = Object.values(authorization.attempts).find((attempt) => attempt.slide_id === "AlphaGo");
      const bravo = Object.values(authorization.attempts).find((attempt) => attempt.slide_id === "BravoGo");
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => submittedBytes(request) });
      await operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport });
      const generated = await operations.generateRefinement({ runDir: fixture.runDir, attemptId: alpha.attempt_id, transport });
      const alternate = await operations.generateRefinement({ runDir: fixture.runDir, attemptId: bravo.attempt_id, transport });
      const review = await operations.composeCandidateReview({ runDir: fixture.runDir, candidateId: generated.candidate.candidate_id });
      expect(review.review.decision).toBe("pending");
      await operations.composeCandidateReview({ runDir: fixture.runDir, candidateId: alternate.candidate.candidate_id });
      await operations.useHtmlRefinement({
        runDir: fixture.runDir,
        slideId: alternate.candidate.slide_id,
        candidateId: alternate.candidate.candidate_id,
      });
      const accepted = await operations.acceptRefinementCandidate({
        runDir: fixture.runDir,
        slideId: "AlphaGo",
        candidateId: generated.candidate.candidate_id,
      });
      expect(accepted).toMatchObject({ provider_calls: 0, requires_final_review: true });
      const htmlReview = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");
      expect(htmlReview.inspectHtmlReviewReadiness(fixture.runDir).delivery.freshness).not.toBe("current");
      await expect(operations.completeRefinementController({ runDir: fixture.runDir })).resolves.toMatchObject({
        complete: true,
        playbook: "create-deck",
        requires_final_review: true,
      });
      expect(readState(fixture.deck)).toMatchObject({
        playbook: "create-deck",
        current_node: "checkpoint-final-review",
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("blocks ordinary authorized generation when complete delivery evidence becomes stale", async () => {
    const fixture = await createAuthorizedRun("image2-normal-delivery-stale-");
    try {
      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assembly = JSON.parse(readFileSync(receiptPath, "utf8"));
      assembly.html_delivery_digest = "f".repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assembly, null, 2)}\n`);
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => submittedBytes(request) });

      await expect(fixture.operations.generateRefinement({
        runDir: fixture.runDir,
        attemptId: setup.attempt_id,
        transport,
      })).rejects.toThrow(/complete evidence is required/);
      expect(transport.submitCount).toBe(0);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("authorization rejects stale hashes, scope changes, and reuse before submit", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-stale-authorization-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const plan = await operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      const planned = readImage2RefinementState(readState(fixture.deck), "v1");
      expect(planned).toMatchObject({
        schema: "pptmaker-image-production-state-v1",
        plan: { schema: "pptmaker-image2-refinement-plan-v2", plan_hash: plan.plan_hash },
        prerequisite_waiver: null,
      });
      const transport = createFakeRefinementTransport({ onSubmit: async () => { throw new Error("authorization must not submit"); } });
      await expect(operations.authorizeRefinement({ runDir: fixture.runDir, planHash: "f".repeat(64) })).rejects.toThrow(/exact persisted plan hash/);
      await expect(operations.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, plan: { ...plan, profile_fingerprint: "b".repeat(64) } })).rejects.toThrow(/exact persisted recommendation/);
      const authorized = await operations.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-once" });
      const persisted = readImage2RefinementState(readState(fixture.deck), "v1");
      expect(persisted).toMatchObject({
        schema: "pptmaker-image-production-state-v1",
        authorization: { schema: "pptmaker-image2-refinement-authorization-v2", authorization_id: "auth-once" },
      });
      expect(authorized.authorization.used).toBe(false);
      await expect(operations.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash })).rejects.toThrow(/single-use/);
      expect(transport.submitCount).toBe(0);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("keeps unresolved v1 refinement work authoritative until it is resolved", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-v1-conflict-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const recommendation = await operations.recommendRefinement({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      const legacyPlan = buildPlan({ ...recommendation.plan, schema: REFINEMENT_PLAN_SCHEMA_V1 });
      const legacyAuthorization = authorizePlan(legacyPlan, "legacy-auth");
      writeImage2RefinementState(fixture.deck, "v1", {
        schema: REFINEMENT_STATE_SCHEMA_V1,
        run_version: "v1",
        plan: legacyPlan,
        authorization: legacyAuthorization,
        attempts: {
          "attempt-legacy": { attempt_id: "attempt-legacy", kind: "slot", slide_id: "AlphaGo", state: "planned" },
        },
        reviews: {},
      });
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);
      await expect(operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) })).rejects.toThrow(/authorization\/review must be resolved/);
      expect(readFileSync(statePath)).toEqual(before);
      expect(readImage2RefinementState(readState(fixture.deck, { purpose: "observe" }), "v1")).toMatchObject({
        schema: "pptmaker-image-production-state-v1",
        authorization: { authorization_id: "legacy-auth" },
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("blocks page submission before or after a failed style-reference setup", async () => {
    const fixture = await createAuthorizedRun("image2-setup-failure-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const page = fixture.attempts.find((attempt) => attempt.kind === "slot");
      const transport = createFakeRefinementTransport({ onSubmit: async () => ({ status: "failed", failure_code: "setup_failed", receipt: { provider_request_id: "provider-setup" } }) });
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: page.attempt_id, transport })).rejects.toThrow(/setup dependency is planned/);
      expect(transport.submitCount).toBe(0);
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id })).rejects.toThrow(/transport must be injected/);
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts[setup.attempt_id].state).toBe("planned");
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport })).rejects.toThrow(/provider reported a failed/);
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: page.attempt_id, transport })).rejects.toThrow(/setup dependency is failed/);
      expect(transport.submitCount).toBe(1);
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts[page.attempt_id].state).toBe("planned");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("reconciles a provider-identified submitting attempt without any resubmit", async () => {
    const fixture = await createAuthorizedRun("image2-submit-recovery-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const providerRequestId = "provider-style-persisted-001";
      setAttemptSubmitting(fixture, setup.attempt_id, providerRequestId);
      const unknown = await fixture.operations.reconcileRefinementAttempt({ runDir: fixture.runDir, attemptId: setup.attempt_id });
      expect(unknown).toMatchObject({
        requires_human: true,
        attempt: { state: "unknown-submit", provider_request_id: providerRequestId },
      });

      const missingBytes = createFakeRefinementTransport({ onReconcile: async (request) => ({
        status: "submitted",
        provider_request_id: request.provider_request_id,
        receipt: { provider_request_id: request.provider_request_id },
      }) });
      const stillUnknown = await fixture.operations.reconcileRefinementAttempt({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport: missingBytes });
      expect(stillUnknown).toMatchObject({ requires_human: true, attempt: { state: "unknown-submit" } });

      const proven = createFakeRefinementTransport({ onReconcile: async (request) => ({
        ...submittedBytes(request),
        provider_request_id: request.provider_request_id,
        receipt: { provider_request_id: request.provider_request_id },
      }) });
      const reconciled = await fixture.operations.reconcileRefinementAttempt({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport: proven });
      expect(reconciled.attempt).toMatchObject({ state: "submitted", promotion_status: "committed" });
      expect(missingBytes.submitCount + proven.submitCount).toBe(0);
      expect(missingBytes.reconcileCount + proven.reconcileCount).toBe(2);
      expect([...missingBytes.calls.reconcile, ...proven.calls.reconcile]).toEqual([
        {
          attempt_id: setup.attempt_id,
          authorization_id: fixture.authorization.authorization.authorization_id,
          plan_hash: fixture.plan.plan_hash,
          provider_request_id: providerRequestId,
        },
        {
          attempt_id: setup.attempt_id,
          authorization_id: fixture.authorization.authorization.authorization_id,
          plan_hash: fixture.plan.plan_hash,
          provider_request_id: providerRequestId,
        },
      ]);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("does not initialize a reconciliation transport without persisted provider identity", async () => {
    const fixture = await createAuthorizedRun("image2-reconcile-identity-boundary-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      setAttemptSubmitting(fixture, setup.attempt_id);
      let factoryCalls = 0;

      const result = await fixture.operations.reconcileRefinementAttempt({
        runDir: fixture.runDir,
        attemptId: setup.attempt_id,
        transportFactory: async () => {
          factoryCalls += 1;
          return createFakeRefinementTransport({ onReconcile: async () => submittedBytes(setup) });
        },
      });

      expect(result).toMatchObject({
        requires_human: true,
        attempt: { state: "unknown-submit", failure_code: "provider_request_identity_unavailable" },
      });
      expect(factoryCalls).toBe(0);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("preserves a successful page candidate across a partial failure", async () => {
    const fixture = await createAuthorizedRun("image2-partial-failure-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const alpha = fixture.attempts.find((attempt) => attempt.slide_id === "AlphaGo");
      const bravo = fixture.attempts.find((attempt) => attempt.slide_id === "BravoGo");
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => request.slide_id === "AlphaGo" ? { status: "failed", failure_code: "page_failed" } : submittedBytes(request) });
      await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport });
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: alpha.attempt_id, transport })).rejects.toThrow(/provider reported a failed/);
      const success = await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: bravo.attempt_id, transport });
      expect(success.candidate.slide_id).toBe("BravoGo");
      expect(transport.submitCount).toBe(3);
      const record = readImage2RefinementState(readState(fixture.deck), "v1");
      expect(record.attempts[alpha.attempt_id].state).toBe("failed");
      expect(record.attempts[bravo.attempt_id].state).toBe("submitted");
      await expect(fixture.operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) })).rejects.toThrow(/authorization\/review must be resolved/);
      await fixture.operations.composeCandidateReview({ runDir: fixture.runDir, candidateId: success.candidate.candidate_id });
      await fixture.operations.useHtmlRefinement({ runDir: fixture.runDir, slideId: "BravoGo", candidateId: success.candidate.candidate_id });
      expect((await fixture.operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) })).plan_hash).toMatch(/^[0-9a-f]{64}$/);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("keeps unknown-submit retain and abandon terminal without retry", async () => {
    const fixture = await createAuthorizedRun("image2-unknown-decisions-");
    try {
      const setup = fixture.attempts.find((attempt) => attempt.kind === "style-reference");
      const pages = fixture.attempts.filter((attempt) => attempt.kind === "slot");
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => {
        if (request.kind === "style-reference") return submittedBytes(request);
        throw Object.assign(new Error("submit outcome unavailable"), { code: "ETIMEDOUT" });
      } });
      await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: setup.attempt_id, transport });
      const firstUnknown = await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: pages[0].attempt_id, transport });
      expect(firstUnknown.attempt.state).toBe("unknown-submit");
      const candidate = createCandidateRecord({ candidate_id: "candidate-retained", attempt_id: pages[0].attempt_id, authorization_id: fixture.authorization.authorization.authorization_id, plan_hash: fixture.plan.plan_hash, run_version: "v1", slide_id: pages[0].slide_id, slot: pages[0].slot, sha256: sha256(png), profile_fingerprint: fixture.plan.profile_fingerprint });
      persistCandidate(fixture.runDir, candidate, png);
      const retained = await fixture.operations.resolveUnknownSubmit({ runDir: fixture.runDir, attemptId: pages[0].attempt_id, decision: "retain", candidateId: candidate.candidate_id });
      expect(retained.attempt).toMatchObject({ state: "submitted", unknown_submit_resolution: "retain", candidate_id: candidate.candidate_id });

      const secondUnknown = await fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: pages[1].attempt_id, transport });
      expect(secondUnknown.attempt.state).toBe("unknown-submit");
      const abandoned = await fixture.operations.resolveUnknownSubmit({ runDir: fixture.runDir, attemptId: pages[1].attempt_id, decision: "abandon" });
      expect(abandoned).toMatchObject({ replacement_requires_new_authorization: true, attempt: { state: "unknown-submit", unknown_submit_resolution: "abandon" } });
      await expect(fixture.operations.generateRefinement({ runDir: fixture.runDir, attemptId: pages[1].attempt_id, transport })).rejects.toThrow(/duplicate or stale/);
      await expect(fixture.operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) })).rejects.toThrow(/authorization\/review must be resolved/);
      await fixture.operations.composeCandidateReview({ runDir: fixture.runDir, candidateId: candidate.candidate_id });
      await fixture.operations.useHtmlRefinement({ runDir: fixture.runDir, slideId: candidate.slide_id, candidateId: candidate.candidate_id });
      expect((await fixture.operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) })).plan_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(transport.submitCount).toBe(3);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it("controller completion and decline both resume the parent without pending debt", async () => {
    const completed = await createCurrentHtmlDelivery("image2-controller-complete-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      expect(await operations.enterRefinementController({ runDir: completed.runDir })).toMatchObject({ entered: true, playbook: "image2-refine" });
      const plan = await operations.createRefinementPlan({ runDir: completed.runDir, profileFingerprint: "a".repeat(64) });
      const authorization = await operations.authorizeRefinement({ runDir: completed.runDir, planHash: plan.plan_hash, authorizationId: "auth-controller" });
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => submittedBytes(request) });
      const candidates = [];
      for (const attempt of authorization.authorization.attempts) {
        const result = await operations.generateRefinement({ runDir: completed.runDir, attemptId: attempt.attempt_id, transport });
        if (result.candidate) candidates.push(result.candidate);
      }
      for (const candidate of candidates) {
        await operations.composeCandidateReview({ runDir: completed.runDir, candidateId: candidate.candidate_id });
        await operations.useHtmlRefinement({ runDir: completed.runDir, slideId: candidate.slide_id, candidateId: candidate.candidate_id });
      }
      expect(await operations.completeRefinementController({ runDir: completed.runDir })).toMatchObject({ complete: true, playbook: "create-deck", requires_final_review: true });
      const resumed = readState(completed.deck);
      expect(resumed).toMatchObject({ playbook: "create-deck", current_node: "checkpoint-final-review" });
      expect(projectImage2RefinementState(resumed, "v1")).toMatchObject({ status: "complete", human_action_required: false });
      expect(resumed.nodes["html-delivery-review"]?.by_version?.["3_versions/v1"] ?? null).toBeNull();
    } finally { rmSync(completed.root, { recursive: true, force: true }); }

    const declined = await createCurrentHtmlDelivery("image2-controller-decline-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      await operations.enterRefinementController({ runDir: declined.runDir });
      await operations.createRefinementPlan({ runDir: declined.runDir, profileFingerprint: "a".repeat(64) });
      const paths = operations.refinementPaths(declined.runDir);
      expect(existsSync(paths.generated)).toBe(true);
      expect(await operations.declineRefinement({ runDir: declined.runDir })).toMatchObject({ declined: true, provider_calls: 0 });
      const resumed = readState(declined.deck);
      expect(resumed).toMatchObject({ playbook: "create-deck", current_node: "checkpoint-final-review" });
      expect(readImage2RefinementState(resumed, "v1")).toBeNull();
      expect(existsSync(paths.generated)).toBe(false);
      expect(existsSync(paths.scratch)).toBe(false);
    } finally { rmSync(declined.root, { recursive: true, force: true }); }
  }, 180_000);
});
