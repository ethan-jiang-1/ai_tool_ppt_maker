import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { createAcceptedRawEvidence } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";

const pureResolverControls = vi.hoisted(() => ({ null_provider_clauses: false }));

vi.mock("../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/index.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPageAuthoritySourceResolver(...args) {
      const resolver = actual.createPageAuthoritySourceResolver(...args);
      if (!pureResolverControls.null_provider_clauses) return resolver;
      return Object.freeze({
        resolveSelection(context) {
          return Object.freeze({ ...resolver.resolveSelection(context), provider_clauses: null });
        },
      });
    },
  };
});
import { canonicalJsonSha256 } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/canonical_json.mjs";
import { prepareFramedProgressivePilotReview } from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import {
  classifyPureRefresh,
  createPureRawWorkPlan,
  publishPureFinalSlideManifest,
  authorizePureTargetRawPlan,
  authorizePureProgressiveRawBatch,
  acceptPureProgressivePilot,
  acceptPureProgressiveRawReview,
  buildPureTargetDelivery,
  buildPureProgressiveTargetDelivery,
  buildPureTargetRawPlan,
  buildPureProgressiveTargetRawPlan,
  decidePureTargetRawReview,
  generatePureProgressiveRawItem,
  generatePureTargetRawPlan,
  planPureTargetExpansion,
  planPureTargetPilot,
  preparePureProgressivePilotReview,
  preparePureProgressiveRawReview,
  preparePureTargetRawReview,
  refreshPureTargetNotes,
  resolvePureStyleMasterScope,
  validatePureRawContract,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  readProgressiveAcceptedRawWork,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_raw_owner.mjs";
import {
  readProgressiveRawPlanDirectRecords,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_store.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const digest = (letter) => letter.repeat(64);
const NATIVE_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

function receipt(source = "a") {
  return {
    schema: "page-authority-image2-source-v2", pipeline: "page-authority-image2-v2", workflow: "pure", source_sha256: digest(source),
    slides: [{ slide_id: "DeckGo", workflow: "pure", display: { title: "Visible pure text" } }],
  };
}

describe("Pure target workflow", () => {
  beforeEach(() => {
    pureResolverControls.null_provider_clauses = false;
  });

  it("rejects a Framed receipt before creating target work", () => {
    expect(() => createPureRawWorkPlan({
      receipt: { ...receipt(), workflow: "framed" },
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    })).toThrow(/Pure workflow requires/);
  });

  it("publishes accepted Pure raw bytes directly as a common manifest", () => {
    const source = receipt();
    const rawWorkPlan = createPureRawWorkPlan({ receipt: source, provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"), raw_contracts_by_slide: { DeckGo: digest("d") } });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG } });
    expect(publishPureFinalSlideManifest({ receipt: source, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide: { DeckGo: NATIVE_PROVIDER_PNG } })).toMatchObject({
      workflow: "pure",
      items: [{ final_sha256: acceptedRawEvidence.items[0].raw_sha256 }],
    });
  });

  it("rejects a Framed-sized PNG before Pure final publication", () => {
    const source = receipt();
    const rawWorkPlan = createPureRawWorkPlan({ receipt: source, provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"), raw_contracts_by_slide: { DeckGo: digest("d") } });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG } });
    const framedFinal = createCanvas(2000, 1125).toBuffer("image/png");
    expect(() => publishPureFinalSlideManifest({
      receipt: source,
      rawWorkPlan,
      acceptedRawEvidence,
      rawBytesBySlide: { DeckGo: framedFinal },
    })).toThrow(/2048x1136/);
  });

  it("classifies visible-text source changes as raw rebuild debt", () => {
    expect(classifyPureRefresh({ previousReceipt: receipt("a"), nextReceipt: receipt("b") })).toMatchObject({ kind: "rebuild_raw", provider_required: true });
  });

  it("validates the canonical Pure clause shape and preserves its digest in the plan", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-raw-contract-validation-"));
    const deck = join(root, "deck_pure_raw_contract_validation");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Validate raw contract
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureTargetRawPlan(runDir);
      const rawContract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      const expectedDigest = plan.raw_work_plan.items.find((item) => item.slide_id === "DeckGo").raw_contract_sha256;
      expect(validatePureRawContract(rawContract)).toEqual({ ok: true, raw_contract_sha256: expectedDigest });

      const clauses = rawContract.provider_clauses;
      const malformedClauses = [
        null,
        { recipe: clauses.recipe, composition: clauses.composition },
        { ...clauses, unexpected: "extra" },
        { ...clauses, recipe: "   " },
        { ...clauses, motifs: [42] },
      ];
      for (const providerClauses of malformedClauses) {
        expect(validatePureRawContract({ ...structuredClone(rawContract), provider_clauses: providerClauses }))
          .toMatchObject({ ok: false, code: "pure_raw_contract_invalid" });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops a malformed Pure clause record before source or raw-plan materialization", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-raw-contract-hard-stop-"));
    const deck = join(root, "deck_pure_raw_contract_hard_stop");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Reject malformed clauses
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const paths = pageAuthorityImage2Paths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      pureResolverControls.null_provider_clauses = true;
      const error = (() => {
        try {
          buildPureTargetRawPlan(runDir);
        } catch (value) {
          return value;
        }
        throw new Error("expected Pure raw planning to fail");
      })();

      expect(error).toMatchObject({ code: "pure_raw_contract_invalid" });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("runs the selected Pure receipt through raw evidence, manifest, and shared delivery with a provider fake", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-lifecycle-"));
    const deck = join(root, "deck_pure_target");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (note) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: ${note}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Pure target source-owned note."));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const plan = buildPureTargetRawPlan(runDir);
      const projection = plan.raw_work_plan.sha256;
      expect(authorizePureTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      let providerSubmissions = 0;
      expect(await generatePureTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      })).toMatchObject({ submitted: 1 });
      expect(await preparePureTargetRawReview(runDir)).toMatchObject({ raw_review_sha256: expect.any(String) });
      expect(decidePureTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "pure" },
      });
      const delivery = await buildPureTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      const paths = pageAuthorityImage2Paths(runDir);
      const rawEvidenceBefore = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const sourceEpochBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch;

      writeFileSync(join(runDir, "slide-specifications.md"), source("Only the Pure speaker note changed."));
      await expect(refreshPureTargetNotes(runDir)).resolves.toMatchObject({ ok: true });
      const rawEvidenceAfter = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      expect(providerSubmissions).toBe(1);
      expect(rawEvidenceAfter.raw_review_sha256).toBe(rawEvidenceBefore.raw_review_sha256);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(sourceEpochBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("delivers a small-debt Pure progressive lifecycle from v3 accepted evidence without a v2 authorization", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-target-"));
    const deck = join(root, "deck_pure_progressive");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Progressive pure fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Progressive source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      expect(pilot.batch).toMatchObject({ is_partial_pilot: false, paid_submission_slide_ids: ["DeckGo"] });

      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      const review = await preparePureProgressiveRawReview(runDir, { planHash });
      const accepted = await acceptPureProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      expect(accepted).toMatchObject({ accepted_raw_evidence_sha256: expect.any(String) });

      const delivery = await buildPureProgressiveTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      const state = readState(deck, { purpose: "observe", runVersion: "v1" });
      const handoff = state.page_authority_progressive_handoff.by_version["3_versions/v1"];
      expect(handoff).toMatchObject({
        raw_work_plan_sha256: planHash,
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: accepted.accepted_raw_evidence_sha256,
        final_manifest_sha256: delivery.finalization.final_manifest_sha256,
        delivery_receipt_sha256: expect.any(String),
      });
      expect(state.page_authority_raw_provider_authorization?.by_version?.["3_versions/v1"]).toBeUndefined();
      expect(state.page_authority_target_evidence.by_version["3_versions/v1"].provider_authorization_sha256).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes a current Pure provider-request inspection sidecar without provider work", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-provider-request-inspection-"));
    const deck = join(root, "deck_pure_provider_request_inspection");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Provider request inspection is provider-free.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Initial Pure inspection prompt"));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const initial = buildPureProgressiveTargetRawPlan(runDir);
      const initialPlanHash = initial.progressive_raw_work_plan.sha256;
      const paths = pageAuthorityImage2Paths(runDir);
      const initialBytes = readFileSync(paths.target_provider_request_inspection);
      const initialInspection = JSON.parse(initialBytes.toString("utf8"));
      const initialRequest = initial.provider_requests_by_slide.DeckGo;

      expect(initial.provider_request_inspection).toMatchObject({
        path: "_generated/page_authority_image2/raw/provider-request-inspection-v1.json",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        plan_hash: initialPlanHash,
      });
      expect(initialInspection).toMatchObject({
        schema: "page-authority-provider-request-inspection-v1",
        progressive_raw_work_plan_sha256: initialPlanHash,
        target_raw_work_plan_sha256: initial.raw_work_plan.sha256,
        source_receipt_sha256: initial.receipt.source_sha256,
        source_epoch: initial.source_epoch,
        workflow: "pure",
        provider_profile_sha256: initial.progressive_raw_work_plan.provider_profile_sha256,
        transport: { model: initialRequest.generation_profile.provider.model, size: "2000x1125" },
        ordered_slide_ids: ["DeckGo"],
      });
      expect(initialInspection.items).toEqual([{
        slide_id: "DeckGo",
        raw_contract_sha256: initial.progressive_raw_work_plan.items[0].raw_contract_sha256,
        provider_request_sha256: canonicalJsonSha256(initialRequest),
        prompt: JSON.stringify(initialRequest),
      }]);
      expect(JSON.stringify(initialInspection)).not.toMatch(/data:image|authorization|api[_-]?key/i);
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash })).toMatchObject({
        batches: [],
        grants: [],
        attempts: [],
        materializations: [],
      });

      const replay = buildPureProgressiveTargetRawPlan(runDir);
      expect(replay.provider_request_inspection).toEqual(initial.provider_request_inspection);
      expect(readFileSync(paths.target_provider_request_inspection)).toEqual(initialBytes);

      writeFileSync(join(runDir, "slide-specifications.md"), source("Replacement Pure inspection prompt"));
      const replacement = buildPureProgressiveTargetRawPlan(runDir, { allowSourceRebuild: true });
      const replacementInspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      expect(replacement.progressive_raw_work_plan.sha256).not.toBe(initialPlanHash);
      expect(replacement.provider_request_inspection).toMatchObject({
        plan_hash: replacement.progressive_raw_work_plan.sha256,
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(replacement.provider_request_inspection.sha256).not.toBe(initial.provider_request_inspection.sha256);
      expect(replacementInspection.source_receipt_sha256).not.toBe(initialInspection.source_receipt_sha256);
      expect(replacementInspection.items[0]).toMatchObject({
        provider_request_sha256: canonicalJsonSha256(replacement.provider_requests_by_slide.DeckGo),
        prompt: JSON.stringify(replacement.provider_requests_by_slide.DeckGo),
      });
      expect(replacementInspection.items[0].prompt).toContain("Replacement Pure inspection prompt");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("compiles provider_clauses text and VISUAL SCENE into the Pure raw contract", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-scene-contract-"));
    const deck = join(root, "deck_pure_scene");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**BODY**: 两个东西让 AI 学编程比别的都快
**VISUAL SCENE**: two agents at a shared desk calm work setting
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure scene source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const contract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      expect(contract.provider_clauses).toEqual(expect.objectContaining({
        recipe: expect.any(String),
        composition: expect.any(String),
        motifs: expect.any(Array),
      }));
      expect(contract.visual_scene).toBe("two agents at a shared desk calm work setting");
      expect(contract.body).toBe("两个东西让 AI 学编程比别的都快");
      expect(contract.visual_identity_role_clause).toBeNull();
      expect(contract.visual_language).toEqual(expect.objectContaining({
        recipe: expect.objectContaining({ id: "editorial-systems", provider_clause_sha256: expect.any(String) }),
      }));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects VISUAL SCENE text that fails the text guard at Pure raw planning", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-scene-guard-"));
    const deck = join(root, "deck_pure_scene_guard");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**VISUAL SCENE**: a slide with visible text annotations
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure scene guard note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      expect(() => buildPureProgressiveTargetRawPlan(runDir)).toThrow(/forbidden_token|VISUAL SCENE/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("publishes a partial Pure Pilot as exact canvas raw bytes only", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-pilot-"));
    const deck = join(root, "deck_pure_progressive_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo", "LineGo", "RoleGo", "PathGo", "DataMap"];
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Pure Pilot ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`).join("\n")}> **SPEAKER NOTE**: Partial Pure Pilot fixture.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DataMap"] });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const rawBytes = NATIVE_PROVIDER_PNG;
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => rawBytes,
      });
      const paths = pageAuthorityImage2Paths(runDir);
      const pilotRoot = join(paths.review_root, "pilot", pilot.batch.batch_hash);
      await expect(prepareFramedProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "target_source_receipt_invalid" });
      expect(existsSync(pilotRoot)).toBe(false);
      const evidence = await preparePureProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      });
      const projection = JSON.parse(readFileSync(join(pilotRoot, "projection.json"), "utf8"));
      expect(evidence).toMatchObject({ pilot_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(readFileSync(join(pilotRoot, "10_DataMap.png"))).toEqual(rawBytes);
      expect(existsSync(join(pilotRoot, "DataMap.png"))).toBe(false);
      expect(projection).toMatchObject({
        schema: "page-authority-pure-pilot-projection-v1",
        workflow: "pure",
        raw_work_plan_sha256: planHash,
        batch_sha256: pilot.batch.batch_hash,
        items: [{ slide_id: "DataMap" }],
      });
      expect(projection.items[0]).not.toHaveProperty("path");
      expect(existsSync(join(pilotRoot, "raw-underlay"))).toBe(false);
      expect(existsSync(join(pilotRoot, "text-frame-composite"))).toBe(false);
      expect(existsSync(paths.target_final_manifest)).toBe(false);

      const decision = await acceptPureProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(decision).toMatchObject({
        pilot_decision_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        progressive_handoff: { partial_pilot_decision_sha256: expect.any(String) },
        next_action: { action_id: "plan_progressive_expansion" },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("takes a partial Pilot through Expansion, complete v3 acceptance, and rebuildable delivery", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-expansion-delivery-"));
    const deck = join(root, "deck_pure_progressive_expansion");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo"];
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Expansion Pure ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
> **SPEAKER NOTE**: Progressive Expansion fixture ${index + 1}.
`).join("\n")}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const paths = pageAuthorityImage2Paths(runDir);
      await expect(buildPureProgressiveTargetDelivery(runDir)).rejects.toMatchObject({
        code: "progressive_raw_accepted_evidence_required",
      });
      expect(existsSync(paths.target_final_manifest)).toBe(false);

      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      expect(pilot.batch).toMatchObject({ is_partial_pilot: true, paid_submission_slide_ids: ["DeckGo"] });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      await preparePureProgressivePilotReview(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const pilotDecision = await acceptPureProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(pilotDecision.next_action).toMatchObject({ action_id: "plan_progressive_expansion" });

      const expansion = await planPureTargetExpansion(runDir, { planHash });
      expect(expansion.batch).toMatchObject({
        kind: "expansion",
        paid_submission_slide_ids: ["FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo"],
      });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: expansion.batch.batch_hash });
      for (const slideId of expansion.batch.paid_submission_slide_ids) {
        const generated = await generatePureProgressiveRawItem(runDir, {
          planHash,
          batchHash: expansion.batch.batch_hash,
          submit: async () => NATIVE_PROVIDER_PNG,
        });
        expect(generated.item).toBe(slideId);
      }
      const review = await preparePureProgressiveRawReview(runDir, { planHash });
      const accepted = await acceptPureProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      expect(accepted).toMatchObject({
        accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(accepted.complete_raw_review_sha256).not.toBe(review.complete_raw_review_sha256);

      const delivery = await buildPureProgressiveTargetDelivery(runDir);
      expect(delivery).toMatchObject({
        ok: true,
        delivery: { receipt: { ordered_slide_ids: slides } },
        finalization: { final_manifest_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
      });

      const directBefore = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash });
      const acceptedBefore = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      });
      rmSync(paths.raw_root, { recursive: true, force: true });
      rmSync(paths.review_root, { recursive: true, force: true });
      rmSync(paths.final_root, { recursive: true, force: true });

      const replayedPlan = buildPureProgressiveTargetRawPlan(runDir);
      expect(replayedPlan.progressive_publication).toMatchObject({ replay: true, plan_hash: planHash });
      const replayedReview = await preparePureProgressiveRawReview(runDir, { planHash });
      expect(replayedReview).toMatchObject({
        replay: true,
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
      });
      const rebuilt = await buildPureProgressiveTargetDelivery(runDir);
      expect(rebuilt.finalization.final_manifest_sha256).toBe(delivery.finalization.final_manifest_sha256);
      expect(existsSync(paths.target_raw_plan)).toBe(true);
      expect(existsSync(paths.target_raw_review)).toBe(true);
      expect(existsSync(paths.target_final_manifest)).toBe(true);

      const directAfter = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash });
      const acceptedAfter = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      });
      expect(directAfter).toEqual(directBefore);
      expect(acceptedAfter.accepted_raw_evidence_sha256).toBe(acceptedBefore.accepted_raw_evidence_sha256);
      expect(acceptedAfter.raw_bytes_by_slide).toEqual(acceptedBefore.raw_bytes_by_slide);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("advances a target source epoch and rebuilds Pure raw work after visible source drift", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-rebuild-"));
    const deck = join(root, "deck_pure_rebuild");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure target source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original pure fact"));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      let providerSubmissions = 0;
      const submit = async () => {
        providerSubmissions += 1;
        return NATIVE_PROVIDER_PNG;
      };

      const initial = buildPureTargetRawPlan(runDir);
      authorizePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);

      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated pure fact"));
      expect(() => buildPureTargetRawPlan(runDir)).toThrow("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
      const rebuilt = buildPureTargetRawPlan(runDir, { allowSourceRebuild: true });
      expect(rebuilt.source_epoch).toBe(2);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ source_epoch: 2, workflow: "pure", provider_authorization_sha256: null, accepted_raw_evidence_sha256: null });

      authorizePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);
      expect(providerSubmissions).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
