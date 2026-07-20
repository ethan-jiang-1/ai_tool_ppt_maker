import { describe, expect, it } from "vitest";
import { buildPlan, loadRefinementOperations } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/internal/transport.mjs";
import { encode as encodePng } from "fast-png";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from "../../tests/helpers/html_first_fixture.mjs";
import { buildPresentation, injectSpeakerNotes } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";

describe("modern Image2 refinement journey boundary", () => {
  it("plans a bounded 2-4 page scope and exposes no provider call", async () => {
    const plan = buildPlan({
      run_version: "v1",
      delivery_digest: "d".repeat(64),
      profile_fingerprint: "p".repeat(64),
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
    const fixture = createHtmlFirstRun("image2-full-lifecycle-");
    try {
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: "AlphaGo", title: "Alpha", note: "Alpha note", body: "schema_version: 1\nfamily: hero\nprimary_visual:\n  placement: full-bleed\n  brief: Alpha visual\n  fit: cover\n  focal_point: [0.5, 0.5]\n  fallback:\n    kind: abstract-pattern\n    recipe: line-grid\n  selection: null\n" }),
        htmlFirstSlide({ number: 2, id: "BravoGo", title: "Bravo", note: "Bravo note", body: "schema_version: 1\nfamily: hero\nprimary_visual:\n  placement: full-bleed\n  brief: Bravo visual\n  fit: cover\n  focal_point: [0.5, 0.5]\n  fallback:\n    kind: abstract-pattern\n    recipe: line-grid\n  selection: null\n" }),
      ]));
      const pipeline = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs");
      const renderer = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs");
      expect(await pipeline.stage1(fixture.runDir, false)).toBe(true);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const review = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, { gate: "content", planHash: pending.gates.content.plan.plan_hash, status: "approved" });
      review.publishHtmlGateDecision(fixture.runDir, { gate: "visual", planHash: pending.gates.visual.plan.plan_hash, status: "approved" });
      await buildPresentation(fixture.runDir);
      await injectSpeakerNotes(fixture.runDir);
      const { readState, writeState } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");
      const state = readState(fixture.deck);
      state.playbook = "create-deck";
      state.current_node = "checkpoint-final-review";
      state.nodes["checkpoint-final-review"] = { status: "in_progress", execution_id: state.execution_id, evidence: {} };
      writeState(fixture.deck, state);
      review.publishHtmlDeliveryDecision(fixture.runDir, { decision: "proceed" });

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

      // Derived candidates are disposable. Accepted source remains resolvable
      // and locally rebuilds final-slide evidence without another submit.
      rmSync(join(fixture.runDir, "_generated", "image2_refinement"), { recursive: true, force: true });
      const p3 = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs");
      const rebuilt = await p3.recomposeHtmlSlidesLocally(fixture.runDir);
      expect(rebuilt.provider_calls).toBe(0);
      expect(rebuilt.final_slides).toHaveLength(2);
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
});
