import { describe, expect, it } from "vitest";
import { buildPlan, createReviewRecord, loadRefinementOperations } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/transport.mjs";
import { listReviews, readCandidate, refinementReviewDigest } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/storage.mjs";
import { encode as encodePng } from "fast-png";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { createCurrentHtmlDelivery } from "../../tests/helpers/image2_refinement_fixture.mjs";
import { buildPresentation, injectSpeakerNotes, validateAndBuildHtmlFirstPlan } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";
import { commitPreparedRefinedHtmlAssetRegistration } from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/index.mjs";
import { prepareStateWrite, readImage2RefinementState, readState, replaceImageProductionStateRecord } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

describe("modern Image2 refinement journey boundary", () => {
  it("plans a bounded 2-4 page scope and exposes no provider call", async () => {
    const plan = buildPlan({
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
        { role: "style-reference", kind: "style-reference", slide_id: null, slot: null, request_fingerprint: "d".repeat(64) },
        { role: "slot:Alpha:primary_visual", kind: "slot", slide_id: "Alpha", slot: "primary_visual", request_fingerprint: "e".repeat(64) },
        { role: "slot:Bravo:primary_visual", kind: "slot", slide_id: "Bravo", slot: "primary_visual", request_fingerprint: "f".repeat(64) },
      ],
      style_reference_status: "missing",
      slides: [
        { slide_id: "Alpha", slot: "primary_visual" },
        { slide_id: "Bravo", slot: "primary_visual" },
      ],
    });
    const transport = createFakeRefinementTransport({ onSubmit: async () => { throw new Error("must not submit during plan"); } });
    expect(plan.total_attempts).toBe(3);
    expect(transport.submitCount).toBe(0);
  });

  it("does not turn an unknown reconciliation into a resubmit", async () => {
    const transport = createFakeRefinementTransport({ reconcile: async () => null });
    const result = await transport.reconcileAttempt({ attempt_id: "attempt-one", authorization_id: "auth-one" });
    expect(result.status).toBe("unknown-submit");
    expect(transport.submitCount).toBe(0);
    expect(transport.reconcileCount).toBe(1);
  });

  it("runs the authorized fake-provider lifecycle and promotes locally", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-full-lifecycle-", { mode: "html-then-image2" });
    try {
      const review = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");

      const ops = await loadRefinementOperations();
      const plan = await ops.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      expect(plan.slides).toHaveLength(2);
      expect(plan.total_attempts).toBe(3);
      const authorization = await ops.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-lifecycle" });
      const png = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([20, 30, 40, 255]), channels: 4, depth: 8 }));
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => ({ status: "submitted", bytes: png, sha256: createHash("sha256").update(png).digest("hex"), media: "image/png", width: 1, height: 1, provider_request_id: `provider-${request.attempt_id}`, receipt: { provider_request_id: `provider-${request.attempt_id}`, api_key: "redacted" } }) });
      const results = [];
      for (const attempt of authorization.authorization.attempts) results.push(await ops.generateRefinement({ runDir: fixture.runDir, attemptId: attempt.attempt_id, transport }));
      expect(transport.submitCount).toBe(3);
      const candidates = results.filter((entry) => entry.candidate).map((entry) => entry.candidate);
      expect(candidates).toHaveLength(2);
      for (const candidate of candidates) await ops.composeCandidateReview({ runDir: fixture.runDir, candidateId: candidate.candidate_id });
      await ops.acceptRefinementCandidate({ runDir: fixture.runDir, slideId: candidates[0].slide_id, candidateId: candidates[0].candidate_id, localRecompose: async () => ({ provider_calls: 0, local: true }) });
      await ops.useHtmlRefinement({ runDir: fixture.runDir, slideId: candidates[1].slide_id, candidateId: candidates[1].candidate_id });
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).delivery.freshness).toBe("stale");
      expect(existsSync(join(fixture.runDir, "overrides", "visual-style", "assets", "refined", "image2", "visual-slots"))).toBe(true);
      expect(readFileSync(join(fixture.runDir, "overrides", "visual-style", "image2-refinement.yaml"), "utf8")).toContain("pptmaker-image2-refinement-provenance-v1");
      const reviewHash = refinementReviewDigest(listReviews(fixture.runDir));
      expect(await ops.cleanupRefinementEvidence({ runDir: fixture.runDir, expectedReviewSha256: reviewHash })).toMatchObject({ retained_candidate_ids: [candidates[1].candidate_id] });

      // Derived candidates are disposable. Accepted source remains resolvable
      // and locally rebuilds final-slide evidence without another submit.
      rmSync(join(fixture.runDir, "_generated", "image2_refinement"), { recursive: true, force: true });
      const p3 = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs");
      const rebuilt = await p3.recomposeHtmlSlidesLocally(fixture.runDir);
      expect(rebuilt.provider_calls).toBe(0);
      expect(rebuilt.final_slides).toHaveLength(2);
      const renderer = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs");
      const reviewContext = renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      await renderer.publishHtmlComposition(reviewContext, {});
      const selectedIds = validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir }).plan.slides
        .filter((slide) => slide.visual_resolution?.effective === "selected")
        .map((slide) => slide.slide_id);
      if (selectedIds.length) {
        await renderer.publishHtmlComposition(reviewContext, {
          compositionVariant: "forced-fallback",
          slideIds: selectedIds,
        });
      }
      const renewed = review.inspectHtmlReviewReadiness(fixture.runDir);
      if (!renewed.gates.content.ready) review.publishHtmlGateDecision(fixture.runDir, { gate: "content", planHash: renewed.gates.content.plan.plan_hash, status: "approved" });
      if (!renewed.gates.visual.ready) review.publishHtmlGateDecision(fixture.runDir, { gate: "visual", planHash: renewed.gates.visual.plan.plan_hash, status: "approved" });
      await buildPresentation(fixture.runDir);
      await injectSpeakerNotes(fixture.runDir);
      review.publishHtmlDeliveryDecision(fixture.runDir, { decision: "proceed" });
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).delivery).toMatchObject({ freshness: "current", decision: "proceed" });
      expect(transport.submitCount).toBe(3);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

  it("recovers an asset-only promotion in a fresh process without another submit", async () => {
    const fixture = await createCurrentHtmlDelivery("image2-interrupted-promotion-", { mode: "html-then-image2" });
    try {
      const ops = await loadRefinementOperations();
      const plan = await ops.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      const authorization = await ops.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-interrupted" });
      const png = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([50, 60, 70, 255]), channels: 4, depth: 8 }));
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => ({ status: "submitted", bytes: png, media: "image/png", width: 1, height: 1, provider_request_id: `provider-${request.attempt_id}` }) });
      const candidates = [];
      for (const attempt of authorization.authorization.attempts) {
        const result = await ops.generateRefinement({ runDir: fixture.runDir, attemptId: attempt.attempt_id, transport });
        if (result.candidate) candidates.push(result.candidate);
      }
      expect(transport.submitCount).toBe(3);
      for (const candidate of candidates) await ops.composeCandidateReview({ runDir: fixture.runDir, candidateId: candidate.candidate_id });

      const selected = readCandidate(fixture.runDir, candidates[0].candidate_id);
      const state = readState(fixture.deck, { purpose: "execute" });
      const record = readImage2RefinementState(state, "v1");
      const target = validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir }).plan.slides.find((slide) => slide.slide_id === selected.metadata.slide_id);
      const assetId = `refined-${selected.metadata.slide_id.toLowerCase()}`;
      const provenancePath = join(fixture.runDir, "overrides", "visual-style", "image2-refinement.yaml");
      const priorProvenance = parseYaml(readFileSync(provenancePath, "utf8"));
      const binding = { asset_id: assetId, accepted_for: target.visual_contract_fingerprint, output_sha256: selected.metadata.sha256, candidate_sha256: selected.metadata.sha256, profile_fingerprint: plan.profile_fingerprint, plan_hash: plan.plan_hash, authorization_id: selected.metadata.authorization_id, attempt_id: selected.metadata.attempt_id };
      const provenance = { ...priorProvenance, accepted_slots: { ...(priorProvenance.accepted_slots || {}), [selected.metadata.slide_id]: binding } };
      const stateUpdatedAt = "2026-07-20T00:00:00.000Z";
      const nextRecord = { ...record, reviews: { ...record.reviews, [selected.metadata.slide_id]: createReviewRecord({ ...record.reviews[selected.metadata.slide_id], decision: "accept", reviewed_at: stateUpdatedAt }) } };
      const nextState = structuredClone(state);
      replaceImageProductionStateRecord(nextState, "v1", nextRecord);
      const preparedState = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt });
      const registration = { runDir: fixture.runDir, assetId, bytes: selected.bytes, target: "visual-slots", metadata: { label: `Refined ${selected.metadata.slide_id}`, description: "Accepted interrupted Image2 candidate", usage_guidance: "Use only in the bound HTML visual slot" } };
      const selection = { runDir: fixture.runDir, slideId: selected.metadata.slide_id, assetId, visualContractFingerprint: target.visual_contract_fingerprint, outputSha256: selected.metadata.sha256 };
      const prepared = await ops.prepareVisualSlotPromotion({ registration, selection, provenance, nextStateSha256: preparedState.sha256 });
      const journal = {
        schema: "pptmaker-image2-refinement-promotion-journal-v1",
        transaction_id: "tx-e2e-interrupted",
        run_version: "v1",
        kind: "visual-slot",
        candidate_id: selected.metadata.candidate_id,
        target_asset_id: assetId,
        old: prepared.old,
        next: prepared.next,
        phase: "prepared",
        recovery: {
          schema: "pptmaker-image2-refinement-recovery-v1",
          registration: { asset_id: assetId, target: registration.target, bytes_base64: selected.bytes.toString("base64"), metadata: registration.metadata },
          selection: { slideId: selection.slideId, assetId: selection.assetId, visualContractFingerprint: selection.visualContractFingerprint, outputSha256: selection.outputSha256 },
          provenance,
          next_state: preparedState.persist,
          state_updated_at: stateUpdatedAt,
        },
      };
      ops.createPromotionJournal(fixture.runDir, journal);
      commitPreparedRefinedHtmlAssetRegistration(prepared.asset);

      const entryUrl = pathToFileURL(resolve("PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs")).href;
      const recoveryScript = `const api = await import(${JSON.stringify(entryUrl)}); const result = await api.recoverRefinementPromotion({ runDir: process.argv[1] }); console.log(JSON.stringify({ status: result.status, transaction_id: result.transaction_id, provider_calls: result.recomposed?.provider_calls ?? result.recompose?.provider_calls ?? null }));`;
      const recoveredProcess = spawnSync(process.execPath, ["--input-type=module", "--eval", recoveryScript, fixture.runDir], { cwd: process.cwd(), encoding: "utf8", timeout: 120_000 });
      expect(recoveredProcess.status, recoveredProcess.stderr).toBe(0);
      const recovered = JSON.parse(recoveredProcess.stdout.trim().split("\n").filter(Boolean).at(-1));
      expect(recovered).toEqual({ status: "committed", transaction_id: "tx-e2e-interrupted", provider_calls: 0 });
      expect(transport.submitCount).toBe(3);
      expect(validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir }).plan.slides.find((slide) => slide.slide_id === selected.metadata.slide_id).visual_resolution.state).toBe("selected");
      expect(ops.readPromotionJournal(fixture.runDir)).toBeNull();

      await ops.useHtmlRefinement({ runDir: fixture.runDir, slideId: candidates[1].slide_id, candidateId: candidates[1].candidate_id });
      const reviewHash = refinementReviewDigest(listReviews(fixture.runDir));
      expect(await ops.cleanupRefinementEvidence({ runDir: fixture.runDir, expectedReviewSha256: reviewHash })).toMatchObject({ retained_candidate_ids: [candidates[1].candidate_id] });
      expect(existsSync(prepared.asset.asset_path)).toBe(true);
      expect(existsSync(join(fixture.runDir, "_generated", "image2_refinement", "candidates", `${candidates[1].candidate_id}.png`))).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 180_000);
});
