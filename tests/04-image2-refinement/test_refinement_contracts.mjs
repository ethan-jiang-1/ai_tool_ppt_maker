import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  REFINEMENT_AUTHORIZATION_SCHEMA_V1,
  REFINEMENT_AUTHORIZATION_SCHEMA_V2,
  REFINEMENT_PLAN_SCHEMA_V1,
  REFINEMENT_PLAN_SCHEMA_V2,
  authorizePlan,
  buildPlan,
  loadRefinementOperations,
  refinementRequestFingerprint,
  transitionAttempt,
  verifyRefinementRequestReferences,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import { createVersion, initHtmlFirstBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { encode as encodePng } from "fast-png";
import { htmlFirstSlide, htmlFirstSource } from "../helpers/html_first_fixture.mjs";
import { bindHtmlPrimaryVisualSelection, validateAndBuildHtmlFirstPlan } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";
import { commitPreparedRefinedHtmlAssetRegistration } from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/index.mjs";
import { prepareStateWrite, readImage2RefinementState, readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const input = { run_version: "v1", delivery_digest: "d".repeat(64), profile_fingerprint: "c".repeat(64), profile_contract: {
  schema: "pptmaker-image2-visual-slot-profile-v1",
  mode: "visual-slot",
  profile_fingerprint: "c".repeat(64),
}, request_contract_version: "pptmaker-refinement-submit-request-v1", request_fingerprints: [
  { role: "style-reference", kind: "style-reference", slide_id: null, slot: null, request_fingerprint: "d".repeat(64) },
  { role: "slot:Alpha:right", kind: "slot", slide_id: "Alpha", slot: "right", request_fingerprint: "e".repeat(64) },
  { role: "slot:Bravo:left", kind: "slot", slide_id: "Bravo", slot: "left", request_fingerprint: "f".repeat(64) },
], style_reference_status: "missing", slides: [
  { slide_id: "Alpha", slot: "right", visual_contract_fingerprint: "a".repeat(64) },
  { slide_id: "Bravo", slot: "left", visual_contract_fingerprint: "b".repeat(64) },
] };

const promotionPng = Buffer.from(encodePng({ width: 1, height: 1, data: new Uint8Array([0, 0, 0, 255]), channels: 4, depth: 8 }));

async function createPromotionFixture(kind = "visual-slot") {
  const root = mkdtempSync(join(tmpdir(), `image2-${kind}-recovery-`));
  const deck = join(root, "deck_refinement");
  initHtmlFirstBundle(deck, null, "keynote", "dark-executive");
  const runDir = join(deck, "3_versions", "v1");
  const body = ["schema_version: 1", "family: hero", "primary_visual:", "  placement: full-bleed", "  brief: A text-free visual", "  fit: cover", "  focal_point: [0.5, 0.5]", "  fallback:", "    kind: abstract-pattern", "    recipe: line-grid", "  selection: null", ""].join(String.fromCharCode(10));
  writeFileSync(join(runDir, "slide-specifications.md"), htmlFirstSource([htmlFirstSlide({ body })]));

  const operations = await loadRefinementOperations();
  const fingerprint = validateAndBuildHtmlFirstPlan({ runDir }).plan.slides[0].visual_contract_fingerprint;
  const outputSha256 = createHash("sha256").update(promotionPng).digest("hex");
  const state = readState(deck, { purpose: "execute" });
  const nextState = structuredClone(state);
  const attemptId = kind === "style-reference" ? "attempt-style" : "attempt-slot";
  nextState.nodes["image2-refinement"] = { by_version: { "3_versions/v1": {
    schema: "pptmaker-image2-refinement-state-v1",
    run_version: "v1",
    plan: null,
    authorization: null,
    attempts: kind === "style-reference" ? { [attemptId]: { attempt_id: attemptId, kind, state: "submitted", promotion_status: "committed" } } : {},
    reviews: {},
  } } };
  const stateUpdatedAt = "2026-07-20T00:00:00.000Z";
  const preparedState = prepareStateWrite(nextState, { updatedAt: stateUpdatedAt });
  const assetId = kind === "style-reference" ? "refined-style-reference" : "refined_main";
  const registration = {
    runDir,
    assetId,
    bytes: promotionPng,
    target: kind === "style-reference" ? "style-reference" : "visual-slots",
    metadata: { label: "Refined", description: "Promoted fixture", usage_guidance: "Use only for this refinement fixture" },
  };
  const commonBinding = { asset_id: assetId, output_sha256: outputSha256, candidate_sha256: outputSha256, profile_fingerprint: "a".repeat(64), plan_hash: "b".repeat(64), authorization_id: "auth-001", attempt_id: attemptId };
  const provenance = {
    schema: "pptmaker-image2-refinement-provenance-v1",
    run_version: "v1",
    style_reference: kind === "style-reference" ? commonBinding : null,
    accepted_slots: kind === "visual-slot" ? { HeroGo: { ...commonBinding, accepted_for: fingerprint } } : {},
  };
  const selection = kind === "visual-slot" ? { runDir, slideId: "HeroGo", assetId, visualContractFingerprint: fingerprint, outputSha256 } : null;
  const prepared = kind === "style-reference"
    ? await operations.prepareStyleReferencePromotion({ registration, provenance, nextStateSha256: preparedState.sha256 })
    : await operations.prepareVisualSlotPromotion({ registration, selection, provenance, nextStateSha256: preparedState.sha256 });
  const journal = {
    schema: "pptmaker-image2-refinement-promotion-journal-v1",
    transaction_id: `tx-${kind}`,
    run_version: "v1",
    kind,
    candidate_id: kind === "style-reference" ? "style-attempt-style" : "candidate-001",
    target_asset_id: assetId,
    old: prepared.old,
    next: prepared.next,
    phase: "prepared",
    recovery: {
      schema: "pptmaker-image2-refinement-recovery-v1",
      registration: { asset_id: assetId, target: registration.target, bytes_base64: promotionPng.toString("base64"), metadata: registration.metadata },
      selection: selection ? { slideId: selection.slideId, assetId: selection.assetId, visualContractFingerprint: selection.visualContractFingerprint, outputSha256: selection.outputSha256 } : null,
      provenance,
      next_state: preparedState.persist,
      state_updated_at: stateUpdatedAt,
    },
  };
  operations.createPromotionJournal(runDir, journal);
  return { root, deck, runDir, operations, prepared, journal, selection, provenance, nextState, stateUpdatedAt };
}

function commitVisualSource(fixture) {
  commitPreparedRefinedHtmlAssetRegistration(fixture.prepared.asset);
  bindHtmlPrimaryVisualSelection(fixture.selection);
}

describe("Phase 4 refinement contracts", () => {
  it("hashes scope deterministically while attempts stay random", () => {
    const first = buildPlan(input);
    const second = buildPlan({ ...input, slides: [...input.slides].reverse() });
    expect(first.plan_hash).toBe(second.plan_hash);
    expect(authorizePlan(first).attempts.map((attempt) => attempt.attempt_id)).not.toEqual(authorizePlan(first).attempts.map((attempt) => attempt.attempt_id));
  });
  it("writes new refinement plans and authorizations as v2 while rebuilding v1", () => {
    const current = buildPlan(input);
    expect(current.schema).toBe(REFINEMENT_PLAN_SCHEMA_V2);
    expect(authorizePlan(current, "auth-v2").schema).toBe(REFINEMENT_AUTHORIZATION_SCHEMA_V2);

    const legacy = buildPlan({ ...input, schema: REFINEMENT_PLAN_SCHEMA_V1 });
    expect(legacy.schema).toBe(REFINEMENT_PLAN_SCHEMA_V1);
    expect(authorizePlan(legacy, "auth-v1").schema).toBe(REFINEMENT_AUTHORIZATION_SCHEMA_V1);
  });

  it("keeps the v2 profile and role-bound request fingerprints closed and copied to attempts", () => {
    const plan = buildPlan(input);
    expect(plan.profile_contract).toEqual({
      schema: "pptmaker-image2-visual-slot-profile-v1",
      mode: "visual-slot",
      profile_fingerprint: "c".repeat(64),
    });
    expect(() => buildPlan({
      ...input,
      profile_contract: { ...input.profile_contract, model: "not-allowed" },
    })).toThrow(/closed visual-slot schema/);

    const authorization = authorizePlan(plan, "auth-request-bindings");
    for (const attempt of authorization.attempts) {
      const role = attempt.kind === "style-reference"
        ? "style-reference"
        : `slot:${attempt.slide_id}:${attempt.slot}`;
      expect(attempt.request_fingerprint).toBe(
        plan.request_fingerprints.find((binding) => binding.role === role).request_fingerprint,
      );
    }
  });

  it("excludes inline reference bytes from the fingerprint but verifies them before submit", () => {
    const bytes = Buffer.from("reference-one");
    const material = {
      request_contract_version: "pptmaker-refinement-submit-request-v1",
      kind: "slot",
      slide_id: "Alpha",
      slot: "right",
      visual_brief: "A no-text visual relationship",
      concept: { must_communicate: "Relationship", must_not: "No text" },
      geometry: { x: 1, y: 2, width: 3, height: 4 },
      profile_contract: input.profile_contract,
      references: [{
        role: "fallback-asset",
        kind: "asset",
        media: "image/png",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes,
      }],
    };
    const tampered = {
      ...material,
      references: [{ ...material.references[0], bytes: Buffer.from("reference-two") }],
    };
    expect(refinementRequestFingerprint(tampered)).toBe(refinementRequestFingerprint(material));
    expect(() => verifyRefinementRequestReferences(tampered)).toThrow(/bound SHA-256/);
  });
  it("requires a SHA-256 profile fingerprint before planning", () => {
    expect(() => buildPlan({ ...input, profile_fingerprint: "profile-v1" })).toThrow(/lowercase SHA-256/);
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

  it("recovers a visual-slot promotion after only the asset commit", async () => {
    const fixture = await createPromotionFixture();
    try {
      commitPreparedRefinedHtmlAssetRegistration(fixture.prepared.asset);
      expect(await fixture.operations.recoverRefinementPromotion({ runDir: fixture.runDir })).toMatchObject({ status: "committed", transaction_id: "tx-visual-slot" });
      expect(fixture.operations.readPromotionJournal(fixture.runDir)).toBeNull();
      expect(validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir }).plan.slides[0].visual_resolution.state).toBe("selected");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("recovers a visual-slot promotion after source and provenance commits", async () => {
    const fixture = await createPromotionFixture();
    try {
      commitVisualSource(fixture);
      fixture.operations.writeRefinementProvenance(fixture.runDir, fixture.provenance, { expectedSha256: fixture.journal.old.provenance_sha256 });
      expect(await fixture.operations.recoverRefinementPromotion({ runDir: fixture.runDir })).toMatchObject({ status: "committed", transaction_id: "tx-visual-slot" });
      expect(fixture.operations.readPromotionJournal(fixture.runDir)).toBeNull();
      expect(readImage2RefinementState(readState(fixture.deck), "v1")).not.toBeNull();
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("cleans a fully committed visual-slot journal without replaying writes", async () => {
    const fixture = await createPromotionFixture();
    try {
      commitVisualSource(fixture);
      fixture.operations.writeRefinementProvenance(fixture.runDir, fixture.provenance, { expectedSha256: fixture.journal.old.provenance_sha256 });
      fixture.operations.commitRefinementState(fixture.runDir, fixture.nextState, { expectedStateSha256: fixture.journal.old.state_sha256, updatedAt: fixture.stateUpdatedAt });
      expect(await fixture.operations.recoverRefinementPromotion({ runDir: fixture.runDir })).toMatchObject({ status: "committed", transaction_id: "tx-visual-slot", recomposed: { provider_calls: 0 } });
      expect(fixture.operations.readPromotionJournal(fixture.runDir)).toBeNull();
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects ambiguous ordering and unbound SHAs before recovery writes", async () => {
    const ambiguous = await createPromotionFixture();
    try {
      const oldManifest = existsSync(ambiguous.prepared.asset.manifest_path) ? readFileSync(ambiguous.prepared.asset.manifest_path) : null;
      commitVisualSource(ambiguous);
      if (oldManifest) writeFileSync(ambiguous.prepared.asset.manifest_path, oldManifest);
      else rmSync(ambiguous.prepared.asset.manifest_path, { force: true });
      await expect(ambiguous.operations.recoverRefinementPromotion({ runDir: ambiguous.runDir })).rejects.toThrow(/ambiguous commit ordering/);
      expect(ambiguous.operations.readPromotionJournal(ambiguous.runDir)).not.toBeNull();
    } finally { rmSync(ambiguous.root, { recursive: true, force: true }); }

    const unbound = await createPromotionFixture();
    try {
      writeFileSync(join(unbound.runDir, "slide-specifications.md"), `${readFileSync(join(unbound.runDir, "slide-specifications.md"), "utf8")}\n<!-- unbound -->\n`);
      await expect(unbound.operations.recoverRefinementPromotion({ runDir: unbound.runDir })).rejects.toThrow(/exact bound transaction state/);
      expect(unbound.operations.readPromotionJournal(unbound.runDir)).not.toBeNull();
    } finally { rmSync(unbound.root, { recursive: true, force: true }); }
  });

  it("recovers style-reference promotion without changing slide source", async () => {
    const fixture = await createPromotionFixture("style-reference");
    try {
      const sourceBefore = readFileSync(join(fixture.runDir, "slide-specifications.md"));
      commitPreparedRefinedHtmlAssetRegistration(fixture.prepared.asset);
      expect(await fixture.operations.recoverRefinementPromotion({ runDir: fixture.runDir })).toMatchObject({ status: "committed", transaction_id: "tx-style-reference" });
      expect(readFileSync(join(fixture.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      expect(fixture.operations.readPromotionJournal(fixture.runDir)).toBeNull();
      expect(readImage2RefinementState(readState(fixture.deck), "v1").attempts["attempt-style"].promotion_status).toBe("committed");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });
});
