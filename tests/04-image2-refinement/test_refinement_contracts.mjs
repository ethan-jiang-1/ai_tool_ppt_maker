import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authorizePlan, buildPlan, loadRefinementOperations, transitionAttempt } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import { createVersion, initHtmlFirstBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { encode as encodePng } from "fast-png";
import { htmlFirstSlide, htmlFirstSource } from "../helpers/html_first_fixture.mjs";
import { validateAndBuildHtmlFirstPlan } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";
import { prepareStateWrite, readImage2RefinementState, readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const input = { run_version: "v1", delivery_digest: "d".repeat(64), profile_fingerprint: "p".repeat(64), style_reference_status: "missing", slides: [
  { slide_id: "Alpha", slot: "right", visual_contract_fingerprint: "a".repeat(64) },
  { slide_id: "Bravo", slot: "left", visual_contract_fingerprint: "b".repeat(64) },
] };

describe("Phase 4 refinement contracts", () => {
  it("hashes scope deterministically while attempts stay random", () => {
    const first = buildPlan(input);
    const second = buildPlan({ ...input, slides: [...input.slides].reverse() });
    expect(first.plan_hash).toBe(second.plan_hash);
    expect(authorizePlan(first).attempts.map((attempt) => attempt.attempt_id)).not.toEqual(authorizePlan(first).attempts.map((attempt) => attempt.attempt_id));
  });
  it("does not reopen unknown submissions", () => {
    const submitting = transitionAttempt({ attempt_id: "a", state: "planned" }, "submitting");
    const unknown = transitionAttempt(submitting, "unknown-submit");
    expect(() => transitionAttempt(unknown, "submitting")).toThrow(/not allowed/);
  });

  it("creates one exact promotion journal bound to current version source and state", async () => {
    const root = mkdtempSync(join(tmpdir(), "image2-journal-"));
    const deck = join(root, "deck_refinement");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const operations = await loadRefinementOperations();
      const paths = operations.refinementPaths(runDir);
      const hash = (path) => createHash("sha256").update(existsSync(path) ? readFileSync(path) : Buffer.alloc(0)).digest("hex");
      const old = {
        asset_manifest_sha256: hash(paths.asset_manifest),
        slide_specifications_sha256: hash(paths.slide_specifications),
        provenance_sha256: hash(paths.provenance),
        state_sha256: hash(paths.state),
      };
      const record = {
        schema: "pptmaker-image2-refinement-promotion-journal-v1",
        transaction_id: "tx-001",
        run_version: "v1",
        kind: "visual-slot",
        candidate_id: "candidate-001",
        target_asset_id: "refined_main",
        old,
        next: old,
      };
      expect(operations.createPromotionJournal(runDir, record)).toMatchObject({ transaction_id: "tx-001" });
      expect(operations.readPromotionJournal(runDir)).toEqual(record);
      expect(() => operations.createPromotionJournal(runDir, record)).toThrow(/already exists/);
      expect(operations.recoverPromotionJournal(runDir)).toMatchObject({ status: "uncommitted", transaction_id: "tx-001" });
      expect(operations.readPromotionJournal(runDir)).toBeNull();

      const provenance = { schema: "pptmaker-image2-refinement-provenance-v1", run_version: "v1", style_reference: null, accepted_slots: {} };
      const written = operations.writeRefinementProvenance(runDir, provenance, { expectedSha256: old.provenance_sha256 });
      expect(written.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(() => operations.writeRefinementProvenance(runDir, { ...provenance, extra: true })).toThrow(/canonical schema/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("commits a prepared visual-slot promotion only through its bound journal", async () => {
    const root = mkdtempSync(join(tmpdir(), "image2-promotion-"));
    const deck = join(root, "deck_refinement");
    try {
      initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const body = ["schema_version: 1", "family: hero", "primary_visual:", "  placement: full-bleed", "  brief: A text-free visual", "  fit: cover", "  focal_point: [0.5, 0.5]", "  fallback:", "    kind: abstract-pattern", "    recipe: line-grid", "  selection: null", ""].join(String.fromCharCode(10));
      writeFileSync(join(runDir, "slide-specifications.md"), htmlFirstSource([htmlFirstSlide({ body })]));
      const operations = await loadRefinementOperations();
      const fingerprint = validateAndBuildHtmlFirstPlan({ runDir }).plan.slides[0].visual_contract_fingerprint;
      const state = readState(deck, { purpose: "execute" });
      const nextState = structuredClone(state);
      nextState.nodes["image2-refinement"] = { by_version: { "3_versions/v1": { schema: "pptmaker-image2-refinement-state-v1", run_version: "v1", plan: null, authorization: null, attempts: {}, reviews: {} } } };
      const stateUpdatedAt = "2026-07-20T00:00:00.000Z";
      const nextStateSha256 = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt }).sha256;
      const bytes = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([0, 0, 0, 255]), channels: 4, depth: 8 }));
      const outputSha256 = createHash("sha256").update(bytes).digest("hex");
      const binding = { asset_id: "refined_main", accepted_for: fingerprint, output_sha256: outputSha256, candidate_sha256: outputSha256, profile_fingerprint: "a".repeat(64), plan_hash: "b".repeat(64), authorization_id: "auth-001", attempt_id: "attempt-001" };
      const selection = { runDir, slideId: "HeroGo", assetId: "refined_main", visualContractFingerprint: fingerprint, outputSha256 };
      const prepared = await operations.prepareVisualSlotPromotion({ registration: { runDir, assetId: "refined_main", bytes, target: "visual-slots", metadata: { label: "Refined", description: "Promoted fixture", usage_guidance: "Use in this visual slot" } }, selection, provenance: { schema: "pptmaker-image2-refinement-provenance-v1", run_version: "v1", style_reference: null, accepted_slots: { HeroGo: binding } }, nextStateSha256 });
      const journal = { schema: "pptmaker-image2-refinement-promotion-journal-v1", transaction_id: "tx-promote", run_version: "v1", kind: "visual-slot", candidate_id: "candidate-001", target_asset_id: "refined_main", old: prepared.old, next: prepared.next };
      expect(await operations.executePreparedVisualSlotPromotion({ prepared, journal, nextState, selection, stateUpdatedAt })).toMatchObject({ status: "committed" });
      expect(validateAndBuildHtmlFirstPlan({ runDir }).plan.slides[0].visual_resolution.state).toBe("selected");
      const v2 = createVersion(runDir, "v2");
      expect(existsSync(join(v2, "_generated", "image2_refinement"))).toBe(false);
      expect(existsSync(join(v2, "_scratch", "image2_refinement"))).toBe(false);
      expect(readImage2RefinementState(readState(deck), "v2")).toBeNull();
      expect(validateAndBuildHtmlFirstPlan({ runDir: v2 }).plan.slides[0].visual_resolution.state).toBe("selected");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
