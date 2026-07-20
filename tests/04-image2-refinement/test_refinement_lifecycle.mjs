import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initHtmlFirstBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { buildPlan, authorizePlan, transitionAttempt } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/internal/transport.mjs";
import { createCandidateRecord, sha256 } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/internal/contracts.mjs";
import { ensureRefinementDerivedRoots, persistCandidate, writeCandidateComparison, listReviews, refinementReviewDigest, cleanupRefinement } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/internal/storage.mjs";

const png = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([20, 30, 40, 255]), channels: 4, depth: 8 }));
const planInput = {
  run_version: "v1",
  delivery_digest: "d".repeat(64),
  profile_fingerprint: "p".repeat(64),
  style_reference_status: "current",
  slides: [
    { slide_id: "Alpha", slot: "primary_visual", visual_contract_fingerprint: "a".repeat(64) },
    { slide_id: "Bravo", slot: "primary_visual", visual_contract_fingerprint: "b".repeat(64) },
  ],
};

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

  it("fake transport records exactly one submit and keeps receipts secret-safe", async () => {
    const transport = createFakeRefinementTransport({ onSubmit: async () => ({ status: "submitted", receipt: { provider_request_id: "p-1", api_key: "sentinel" } }) });
    const result = await transport.submitAttempt({ attempt_id: "attempt-one", authorization_id: "auth-one" });
    expect(transport.submitCount).toBe(1);
    expect(result.receipt).toEqual({ provider_request_id: "p-1" });
  });

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
});
