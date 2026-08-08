import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

const renderControls = vi.hoisted(() => ({
  browser_launches: 0,
  composition_calls: 0,
  composition_error: null,
  latest_profile_digest: null,
  profile_calls: 0,
  profile_digest_override: null,
  profile_error: null,
  proof_calls: 0,
  proof_error: null,
  proof_error_before_launch: false,
  proof_batches: [],
  safe_zone_drift: false,
}));
const framedResolverControls = vi.hoisted(() => ({ null_provider_clauses: false }));

vi.mock("../../ppt_maker_harness/scripts/02-visual-system/index.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPageImageSourceResolver(...args) {
      const resolver = actual.createPageImageSourceResolver(...args);
      if (!framedResolverControls.null_provider_clauses) return resolver;
      return Object.freeze({
        resolveSelection(context) {
          return Object.freeze({ ...resolver.resolveSelection(context), provider_clauses: null });
        },
      });
    },
  };
});

vi.mock("../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_profile.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    currentFramedHeaderOverlayRenderProfile(...args) {
      renderControls.profile_calls += 1;
      if (renderControls.profile_error) throw renderControls.profile_error;
      const profile = actual.currentFramedHeaderOverlayRenderProfile(...args);
      const current = renderControls.profile_digest_override
        ? Object.freeze({ ...profile, render_profile_digest: renderControls.profile_digest_override })
        : profile;
      renderControls.latest_profile_digest = current.render_profile_digest;
      return current;
    },
  };
});

vi.mock("../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    describeFramedHeaderOverlay(...args) {
      const frame = actual.describeFramedHeaderOverlay(...args);
      if (!renderControls.safe_zone_drift) return frame;
      const protectedGeometry = frame.layout.protected_geometry.map((rectangle, index) => (
        index === 0
          ? Object.freeze({
            ...rectangle,
            width: rectangle.width - 1,
          })
          : rectangle
      ));
      return Object.freeze({
        ...frame,
        layout: Object.freeze({ ...frame.layout, protected_geometry: Object.freeze(protectedGeometry) }),
      });
    },
    async verifyFramedHeaderOverlays(frames) {
      renderControls.proof_calls += 1;
      renderControls.proof_batches.push(frames.map((frame) => frame.slide_id));
      if (renderControls.proof_error) {
        if (!renderControls.proof_error_before_launch) renderControls.browser_launches += 1;
        throw renderControls.proof_error;
      }
      renderControls.browser_launches += 1;
      return Object.freeze({
        render_profile_digest: renderControls.latest_profile_digest,
        pages: Object.freeze(frames.map((frame) => Object.freeze({ slide_id: frame.slide_id }))),
      });
    },
    async composeFramedHeaderOverlays(frames) {
      renderControls.composition_calls += 1;
      renderControls.browser_launches += 1;
      if (renderControls.composition_error) throw renderControls.composition_error;
      return Object.freeze({
        render_profile_digest: renderControls.latest_profile_digest,
        final_bytes_by_slide: Object.freeze(Object.fromEntries(
          frames.map((frame) => [frame.slide_id, Buffer.from(frame.verified_raw.bytes)]),
        )),
      });
    },
  };
});

import {
  authorizeFramedTargetRawPlan,
  buildFramedTargetDelivery,
  buildFramedTargetRawPlan,
  decideFramedTargetRawReview,
  generateFramedTargetRawPlan,
  prepareFramedTargetRawReview,
  readFramedTargetStoredPlanContext,
  refreshFramedTargetNotes,
  refreshFramedTargetText,
  resolveFramedStyleMasterScope,
  validateFramedRawContract,
} from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { canonicalJsonSha256 } from "../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { pageImageOrdinalImageFilename } from "../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

function errorWithCode(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function source({ invalid = false } = {}) {
  if (invalid) {
    return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: framed
---

## Slide 01: \`DeckGo\`

**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`
`;
  }
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Exact lifecycle proof
**FRAME PRESET**: standard-v1
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: "The provider composes this exact lifecycle evidence with the page."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: The plan owns this source exactly.

## Slide 02: \`BodyMap\`

**TITLE**: The batch stays bounded
**FRAME PRESET**: standard-v1
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: label
    literal: "One selected batch, one current lineage"
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Later raw commands read the stored plan.
`;
}

async function createFixture({ invalid = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "framed-plan-lifecycle-"));
  const deck = join(root, "deck_framed_plan_lifecycle");
  const runDir = join(deck, "3_versions", "v1");
  const image = createCanvas(2000, 1125);
  const context = image.getContext("2d");
  context.fillStyle = "#1f4d6e";
  context.fillRect(0, 0, 2000, 1125);
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
  writeFileSync(join(runDir, "slide-specifications.md"), source({ invalid }));
  if (!invalid) await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
  return { root, deck, runDir, image: image.toBuffer("image/png"), paths: pageImageWorkflowPaths(runDir) };
}

function derivedPaths(paths) {
  return [
    paths.target_source_receipt,
    paths.target_raw_plan,
    paths.target_raw_evidence,
    paths.target_raw_review,
    paths.target_raw_review_projection,
    paths.target_final_manifest,
  ];
}

async function expectNoProviderSubmit(runDir, image) {
  let submissions = 0;
  await expect(generateFramedTargetRawPlan(runDir, {
    planHash: "a".repeat(64),
    submit: async () => {
      submissions += 1;
      return image;
    },
  })).rejects.toThrow();
  expect(submissions).toBe(0);
}

function expectNoMaterialization(fixture, stateBefore) {
  expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
  expect(derivedPaths(fixture.paths).every((path) => !existsSync(path))).toBe(true);
}

function sourceEpoch(fixture) {
  return readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
    .page_image_target_evidence.by_version["3_versions/v1"].source_epoch;
}

async function expectStalePlanStopsProvider(fixture, planHash, expectedCode) {
  const rawPlanBytes = readFileSync(fixture.paths.target_raw_plan);
  let submissions = 0;
  await expect(generateFramedTargetRawPlan(fixture.runDir, {
    planHash,
    submit: async () => {
      submissions += 1;
      return fixture.image;
    },
  })).rejects.toMatchObject({
    code: expectedCode,
    next_action: "rebuild_target_raw_plan",
  });
  expect(submissions).toBe(0);
  expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBytes);
}

async function repairPlanAndSubmit(fixture, { allowSourceRebuild = false } = {}) {
  const repaired = await buildFramedTargetRawPlan(fixture.runDir, { allowSourceRebuild });
  await authorizeFramedTargetRawPlan(fixture.runDir, { planHash: repaired.raw_work_plan.sha256 });
  let submissions = 0;
  await generateFramedTargetRawPlan(fixture.runDir, {
    planHash: repaired.raw_work_plan.sha256,
    submit: async () => {
      submissions += 1;
      return fixture.image;
    },
  });
  expect(submissions).toBe(2);
  return repaired;
}

async function buildAcceptedRawWork(fixture, { onSubmit = null } = {}) {
  const plan = await buildFramedTargetRawPlan(fixture.runDir);
  await authorizeFramedTargetRawPlan(fixture.runDir, { planHash: plan.raw_work_plan.sha256 });
  await generateFramedTargetRawPlan(fixture.runDir, {
    planHash: plan.raw_work_plan.sha256,
    submit: async () => {
      onSubmit?.();
      return fixture.image;
    },
  });
  await prepareFramedTargetRawReview(fixture.runDir);
  await decideFramedTargetRawReview(fixture.runDir, { decision: "proceed" });
  return plan;
}

describe("Framed proof-before-materialization lifecycle", () => {
  beforeEach(() => {
    Object.assign(renderControls, {
      browser_launches: 0,
      composition_calls: 0,
      composition_error: null,
      latest_profile_digest: null,
      profile_calls: 0,
      profile_digest_override: null,
      profile_error: null,
      proof_calls: 0,
      proof_error: null,
      proof_error_before_launch: false,
      proof_batches: [],
      safe_zone_drift: false,
    });
    framedResolverControls.null_provider_clauses = false;
  });

  it("does not write or submit when the current source is invalid", async () => {
    const fixture = await createFixture({ invalid: true });
    try {
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      await expect(buildFramedTargetRawPlan(fixture.runDir)).rejects.toThrow();
      expectNoMaterialization(fixture, stateBefore);
      expect(renderControls.profile_calls).toBe(0);
      expect(renderControls.browser_launches).toBe(0);
      await expectNoProviderSubmit(fixture.runDir, fixture.image);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not write or submit when the selected font profile is unavailable", async () => {
    const fixture = await createFixture();
    try {
      renderControls.profile_error = errorWithCode("framed_font_asset_missing", "selected font is unavailable");
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      await expect(buildFramedTargetRawPlan(fixture.runDir)).rejects.toMatchObject({ code: "framed_font_asset_missing" });
      expectNoMaterialization(fixture, stateBefore);
      expect(renderControls.proof_calls).toBe(0);
      expect(renderControls.browser_launches).toBe(0);
      await expectNoProviderSubmit(fixture.runDir, fixture.image);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("stops malformed Framed clauses before proof or source materialization", async () => {
    const fixture = await createFixture();
    try {
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      framedResolverControls.null_provider_clauses = true;

      await expect(buildFramedTargetRawPlan(fixture.runDir)).rejects.toMatchObject({
        code: "framed_raw_contract_invalid",
      });
      expectNoMaterialization(fixture, stateBefore);
      expect(renderControls.proof_calls).toBe(0);
      expect(renderControls.browser_launches).toBe(0);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not write or submit when the pinned runtime is unavailable", async () => {
    const fixture = await createFixture();
    try {
      renderControls.proof_error = errorWithCode("framed_runtime_unavailable", "pinned runtime is unavailable");
      renderControls.proof_error_before_launch = true;
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      await expect(buildFramedTargetRawPlan(fixture.runDir)).rejects.toMatchObject({ code: "framed_runtime_unavailable" });
      expectNoMaterialization(fixture, stateBefore);
      expect(renderControls.proof_calls).toBe(1);
      expect(renderControls.browser_launches).toBe(0);
      await expectNoProviderSubmit(fixture.runDir, fixture.image);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not write or submit when browser proof rejects layout", async () => {
    const fixture = await createFixture();
    try {
      renderControls.proof_error = errorWithCode("framed_text_fit_failed", "title field has scroll overflow");
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      await expect(buildFramedTargetRawPlan(fixture.runDir)).rejects.toMatchObject({ code: "framed_text_fit_failed" });
      expectNoMaterialization(fixture, stateBefore);
      expect(renderControls.proof_calls).toBe(1);
      expect(renderControls.browser_launches).toBe(1);
      await expectNoProviderSubmit(fixture.runDir, fixture.image);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("materializes one exact plan, keeps later raw commands browser-free, and binds one review composite before final delivery", async () => {
    const fixture = await createFixture();
    try {
      const plan = await buildFramedTargetRawPlan(fixture.runDir);
      const rawPlanBytes = readFileSync(fixture.paths.target_raw_plan);
      const sourceReceiptBytes = readFileSync(fixture.paths.target_source_receipt);
      const rawContracts = Object.fromEntries(Object.entries(plan.provider_requests_by_slide)
        .map(([slideId, request]) => [slideId, request.raw_contract]));
      expect(renderControls.proof_calls).toBe(1);
      expect(renderControls.browser_launches).toBe(1);
      expect(renderControls.proof_batches).toEqual([["DeckGo", "BodyMap"]]);
      expect(plan.page_image_core).toMatchObject({ schema: "page-image-core-facts-v1", workflow: "framed" });
      expect(plan.page_image_core.slides[0]).toMatchObject({
        slide_id: "DeckGo",
        provider_content: {
          items: [{
            role: "callout",
            literal: "The provider composes this exact lifecycle evidence with the page.",
            copy_policy: "exact",
          }],
        },
        header_policy: {
          local_header: { kicker: null, title: "Exact lifecycle proof", subtitle: null },
          context_not_to_render: { kicker: null, title: "Exact lifecycle proof", subtitle: null },
        },
      });
      expect(rawContracts.DeckGo).toMatchObject({
        page_image_core: {
          schema: "page-image-core-slide-facts-v1",
          canonical_semantic_sha256: plan.page_image_core.slides[0].canonical_semantic_sha256,
        },
        provider_rendered_content: {
          items: [{
            role: "callout",
            literal: "The provider composes this exact lifecycle evidence with the page.",
            copy_policy: "exact",
          }],
        },
        framed: {
          local_header: { kicker: null, title: "Exact lifecycle proof", subtitle: null },
          context_not_to_render: { kicker: null, title: "Exact lifecycle proof", subtitle: null },
        },
      });
      for (const [slideId, rawContract] of Object.entries(rawContracts)) {
        const coreSlide = plan.page_image_core.slides.find((slide) => slide.slide_id === slideId);
        const request = plan.provider_requests_by_slide[slideId];
        const binding = plan.raw_work_plan.items.find((item) => item.slide_id === slideId).provider_input_binding;
        expect(rawContract.framed.render_profile_digest).toBe(renderControls.latest_profile_digest);
        expect(validateFramedRawContract(rawContract)).toMatchObject({
          ok: true,
          raw_contract_sha256: plan.raw_work_plan.items.find((item) => item.slide_id === slideId).raw_contract_sha256,
          render_profile_digest: renderControls.latest_profile_digest,
        });
        expect(binding).toMatchObject({
          compiled_provider_input_sha256: request.compiled_provider_input.sha256,
          provider_content_sha256: coreSlide.provider_content_sha256,
          visual_selection_sha256: coreSlide.visual_selection_sha256,
          style_master_selection_sha256: coreSlide.style_master_selection_sha256,
          generation_profile_sha256: coreSlide.generation_profile_sha256,
          header_policy_sha256: coreSlide.header_policy_sha256,
          deck_visual_system_sha256: null,
          local_header_profile_sha256: rawContract.framed.render_profile_digest,
          protected_geometry_sha256: canonicalJsonSha256(rawContract.framed.protected_geometry),
        });
      }
      const staleContract = structuredClone(rawContracts.DeckGo);
      staleContract.framed.render_profile_digest = "d".repeat(64);
      expect(validateFramedRawContract(staleContract)).toMatchObject({
        ok: false,
        code: "framed_raw_contract_profile_stale",
      });
      const clauses = rawContracts.DeckGo.provider_clauses;
      const malformedClauses = [
        null,
        { recipe: clauses.recipe, composition: clauses.composition },
        { ...clauses, unexpected: "extra" },
        { ...clauses, composition: "   " },
        { ...clauses, motifs: [42] },
      ];
      for (const providerClauses of malformedClauses) {
        expect(validateFramedRawContract({ ...structuredClone(rawContracts.DeckGo), provider_clauses: providerClauses }))
          .toMatchObject({ ok: false, code: "framed_raw_contract_invalid" });
      }

      const stored = readFramedTargetStoredPlanContext(fixture.runDir);
      expect(stored.source_epoch).toBe(1);
      expect(stored.receipt.source_sha256).toBe(plan.receipt.source_sha256);
      expect(canonicalJsonSha256(stored.raw_work_plan)).toBe(plan.raw_work_plan.sha256);
      expect(renderControls.proof_calls).toBe(1);

      const planHash = plan.raw_work_plan.sha256;
      await authorizeFramedTargetRawPlan(fixture.runDir, { planHash });
      let submissions = 0;
      await generateFramedTargetRawPlan(fixture.runDir, {
        planHash,
        submit: async () => {
          submissions += 1;
          return fixture.image;
        },
      });
      await prepareFramedTargetRawReview(fixture.runDir);
      await decideFramedTargetRawReview(fixture.runDir, { decision: "proceed" });
      const authorization = readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_image_raw_provider_authorization.by_version["3_versions/v1"];
      const review = JSON.parse(readFileSync(fixture.paths.target_raw_review, "utf8"));
      const acceptedRawEvidence = JSON.parse(readFileSync(fixture.paths.target_raw_evidence, "utf8"));
      const completeReviewRoot = join(fixture.paths.review_root, "complete-page", planHash);
      const completePresentation = JSON.parse(readFileSync(join(completeReviewRoot, "complete-page-review-evidence-v1.json"), "utf8"));
      expect(authorization.raw_work_plan_sha256).toBe(planHash);
      expect(review).toMatchObject({
        source_epoch: 1,
        workflow: "framed",
        raw_bytes_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        typed_review_contribution_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        complete_page_presentation_sha256: canonicalJsonSha256(completePresentation),
        projection_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        projection_capture_profile_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(completePresentation).toMatchObject({
        raw_work_plan_sha256: planHash,
        workflow: "framed",
        has_complete_page_artifact: true,
        items: expect.arrayContaining([
          expect.objectContaining({ slide_id: "DeckGo" }),
          expect.objectContaining({ slide_id: "BodyMap" }),
        ]),
      });
      for (const [index, slideId] of plan.raw_work_plan.ordered_slide_ids.entries()) {
        const filename = pageImageOrdinalImageFilename(index + 1, slideId);
        expect(existsSync(join(completeReviewRoot, "provider-page", filename))).toBe(true);
        expect(existsSync(join(completeReviewRoot, "complete-page", filename))).toBe(true);
      }
      expect(review).not.toHaveProperty("raw_work_plan_sha256");
      expect(review).not.toHaveProperty("source_receipt_sha256");
      expect(acceptedRawEvidence.raw_work_plan_sha256).toBe(planHash);
      expect(submissions).toBe(2);
      expect(renderControls.proof_calls).toBe(1);
      expect(renderControls.browser_launches).toBe(2);
      expect(renderControls.composition_calls).toBe(1);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(1);

      const delivery = await buildFramedTargetDelivery(fixture.runDir);
      expect(renderControls.proof_calls).toBe(1);
      expect(renderControls.browser_launches).toBe(3);
      expect(renderControls.composition_calls).toBe(2);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(delivery.finalization.final_manifest.accepted_raw_evidence_sha256)
        .toBe(canonicalJsonSha256(acceptedRawEvidence));
      expect(delivery.delivery.receipt.final_manifest_sha256)
        .toBe(delivery.finalization.final_manifest_sha256);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("stops stale source before provider work and recovers through the same plan checkpoint", async () => {
    const fixture = await createFixture();
    try {
      const initial = await buildFramedTargetRawPlan(fixture.runDir);
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), source().replace("Exact lifecycle proof", "Repaired source lifecycle"));

      await expectStalePlanStopsProvider(fixture, initial.raw_work_plan.sha256, "target_source_receipt_stale");
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(1);

      const repaired = await repairPlanAndSubmit(fixture, { allowSourceRebuild: true });
      expect(repaired.raw_work_plan.sha256).not.toBe(initial.raw_work_plan.sha256);
      expect(sourceEpoch(fixture)).toBe(2);
      expect(renderControls.proof_calls).toBe(2);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("stops render-profile drift before provider work and repairs without manufacturing a source epoch", async () => {
    const fixture = await createFixture();
    try {
      const initial = await buildFramedTargetRawPlan(fixture.runDir);
      renderControls.profile_digest_override = "b".repeat(64);

      await expectStalePlanStopsProvider(fixture, initial.raw_work_plan.sha256, "target_raw_plan_stale");
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(1);

      const repaired = await repairPlanAndSubmit(fixture);
      expect(repaired.raw_work_plan.sha256).not.toBe(initial.raw_work_plan.sha256);
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(2);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("routes style-context registry drift back to Style Master before raw rebuild", async () => {
    const fixture = await createFixture();
    try {
      const initial = await buildFramedTargetRawPlan(fixture.runDir);
      const rawPlanBefore = readFileSync(fixture.paths.target_raw_plan);
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      const registryPath = join(fixture.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet luminous depth"));

      await expectStalePlanStopsProvider(fixture, initial.raw_work_plan.sha256, "target_source_receipt_stale");
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(1);
      await expect(buildFramedTargetRawPlan(fixture.runDir, { allowSourceRebuild: true })).rejects.toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBefore);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(1);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("stops a tampered stored plan before provider work and repairs it through the same plan checkpoint", async () => {
    const fixture = await createFixture();
    try {
      const initial = await buildFramedTargetRawPlan(fixture.runDir);
      const tampered = JSON.parse(readFileSync(fixture.paths.target_raw_plan, "utf8"));
      tampered.items[0].raw_contract_sha256 = "c".repeat(64);
      writeFileSync(fixture.paths.target_raw_plan, `${JSON.stringify(tampered)}\n`);

      await expectStalePlanStopsProvider(fixture, initial.raw_work_plan.sha256, "target_raw_plan_stale");
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(1);

      const repaired = await repairPlanAndSubmit(fixture);
      expect(repaired.raw_work_plan.sha256).toBe(initial.raw_work_plan.sha256);
      expect(sourceEpoch(fixture)).toBe(1);
      expect(renderControls.proof_calls).toBe(2);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("revalidates accepted raw-review record and projection bytes before local rebind", async () => {
    const fixture = await createFixture();
    try {
      let providerSubmissions = 0;
      const acceptedPlan = await buildAcceptedRawWork(fixture, { onSubmit: () => { providerSubmissions += 1; } });
      await buildFramedTargetDelivery(fixture.runDir);
      const reviewBytes = readFileSync(fixture.paths.target_raw_review);
      const completeReviewRoot = join(fixture.paths.review_root, "complete-page", acceptedPlan.raw_work_plan.sha256);
      const completePresentationPath = join(completeReviewRoot, "complete-page-review-evidence-v1.json");
      const completePresentationBytes = readFileSync(completePresentationPath);
      const projectionPath = join(completeReviewRoot, "complete-page-review.png");
      const projectionBytes = readFileSync(projectionPath);
      const previousEvidence = JSON.parse(readFileSync(fixture.paths.target_raw_evidence, "utf8"));

      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("The plan owns this source exactly.", "Rebound notes preserve the prior page review."),
      );
      await expect(refreshFramedTargetNotes(fixture.runDir)).resolves.toMatchObject({
        ok: true,
      });
      const reboundEvidence = JSON.parse(readFileSync(fixture.paths.target_raw_evidence, "utf8"));
      expect(reboundEvidence.raw_review_sha256).toBe(previousEvidence.raw_review_sha256);
      expect(sourceEpoch(fixture)).toBe(1);
      expect(readFileSync(fixture.paths.target_raw_review)).toEqual(reviewBytes);
      expect(readFileSync(completePresentationPath)).toEqual(completePresentationBytes);
      expect(readFileSync(projectionPath)).toEqual(projectionBytes);
      expect(renderControls.composition_calls).toBe(2);
      expect(providerSubmissions).toBe(2);

      const sourceReceiptBeforeRecordDrift = readFileSync(fixture.paths.target_source_receipt);
      const planBeforeRecordDrift = readFileSync(fixture.paths.target_raw_plan);
      const evidenceBeforeRecordDrift = readFileSync(fixture.paths.target_raw_evidence);
      const stateBeforeRecordDrift = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      writeFileSync(fixture.paths.target_raw_review, Buffer.concat([reviewBytes, Buffer.from("\n")]));
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("The plan owns this source exactly.", "Record drift must stop"),
      );
      await expect(refreshFramedTargetNotes(fixture.runDir))
        .rejects.toMatchObject({ code: "target_complete_page_review_stale" });
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBeforeRecordDrift);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(planBeforeRecordDrift);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBeforeRecordDrift);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBeforeRecordDrift);
      expect(renderControls.composition_calls).toBe(2);

      writeFileSync(fixture.paths.target_raw_review, reviewBytes);
      const sourceReceiptBeforeProjectionDrift = readFileSync(fixture.paths.target_source_receipt);
      const planBeforeProjectionDrift = readFileSync(fixture.paths.target_raw_plan);
      const evidenceBeforeProjectionDrift = readFileSync(fixture.paths.target_raw_evidence);
      const stateBeforeProjectionDrift = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      const tamperedProjection = Buffer.from(projectionBytes);
      tamperedProjection[tamperedProjection.length - 1] ^= 1;
      writeFileSync(projectionPath, tamperedProjection);
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("The plan owns this source exactly.", "Projection drift must stop"),
      );
      await expect(refreshFramedTargetNotes(fixture.runDir))
        .rejects.toMatchObject({ code: "target_complete_page_review_stale" });
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBeforeProjectionDrift);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(planBeforeProjectionDrift);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBeforeProjectionDrift);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBeforeProjectionDrift);
      expect(renderControls.composition_calls).toBe(2);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not publish a refreshed final manifest when final composition rejects the updated Text Frame", async () => {
    const fixture = await createFixture();
    try {
      let providerSubmissions = 0;
      await buildAcceptedRawWork(fixture, { onSubmit: () => { providerSubmissions += 1; } });
      await buildFramedTargetDelivery(fixture.runDir);
      const finalManifestBefore = readFileSync(fixture.paths.target_final_manifest);
      const rawReviewBefore = readFileSync(fixture.paths.target_raw_review);
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      renderControls.composition_error = errorWithCode("framed_text_fit_failed", "title field has scroll overflow");
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("Exact lifecycle proof", "Final fit must stop publication"),
      );

      await expect(refreshFramedTargetText(fixture.runDir, { slideIds: ["DeckGo"] }))
        .rejects.toMatchObject({ code: "framed_local_compose_rebuild_required" });
      expect(providerSubmissions).toBe(2);
      expect(readFileSync(fixture.paths.target_final_manifest)).toEqual(finalManifestBefore);
      expect(readFileSync(fixture.paths.target_raw_review)).toEqual(rawReviewBefore);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(renderControls.composition_calls).toBe(2);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("requires raw rebuild when profile or canonical safe-zone facts drift", async () => {
    const fixture = await createFixture();
    try {
      let providerSubmissions = 0;
      await buildAcceptedRawWork(fixture, { onSubmit: () => { providerSubmissions += 1; } });
      const sourceReceiptBeforeProfileDrift = readFileSync(fixture.paths.target_source_receipt);
      const rawPlanBeforeProfileDrift = readFileSync(fixture.paths.target_raw_plan);
      const evidenceBeforeProfileDrift = readFileSync(fixture.paths.target_raw_evidence);
      const stateBeforeProfileDrift = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      renderControls.profile_digest_override = "b".repeat(64);
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("Exact lifecycle proof", "Profile drift requires raw rebuild"),
      );

      await expect(refreshFramedTargetText(fixture.runDir, { slideIds: ["DeckGo"] }))
        .rejects.toMatchObject({ code: "framed_local_compose_rebuild_required" });
      expect(providerSubmissions).toBe(2);
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBeforeProfileDrift);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBeforeProfileDrift);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBeforeProfileDrift);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBeforeProfileDrift);
      expect(renderControls.composition_calls).toBe(1);

      renderControls.profile_digest_override = null;
      renderControls.safe_zone_drift = true;
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("Exact lifecycle proof", "Safe-zone coverage must remain exact"),
      );
      await expect(refreshFramedTargetText(fixture.runDir, { slideIds: ["DeckGo"] }))
        .rejects.toMatchObject({ code: "framed_local_compose_rebuild_required" });
      expect(providerSubmissions).toBe(2);
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBeforeProfileDrift);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBeforeProfileDrift);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBeforeProfileDrift);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBeforeProfileDrift);
      expect(renderControls.composition_calls).toBe(1);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("routes reordered or switched sources to structural versioning before local underlay rebind", async () => {
    const fixture = await createFixture();
    try {
      let providerSubmissions = 0;
      await buildAcceptedRawWork(fixture, { onSubmit: () => { providerSubmissions += 1; } });
      const sourceReceiptBefore = readFileSync(fixture.paths.target_source_receipt);
      const rawPlanBefore = readFileSync(fixture.paths.target_raw_plan);
      const evidenceBefore = readFileSync(fixture.paths.target_raw_evidence);
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      const original = source();
      const reordered = original
        .replace("`DeckGo`", "`SwapTmp`")
        .replace("`BodyMap`", "`DeckGo`")
        .replace("`SwapTmp`", "`BodyMap`");

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), reordered);
      await expect(refreshFramedTargetNotes(fixture.runDir)).rejects.toMatchObject({
        code: "target_structural_versioning_required",
        next_action: "preview_target_structural_vnext",
      });
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBefore);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBefore);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBefore);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(renderControls.browser_launches).toBe(2);
      expect(renderControls.composition_calls).toBe(1);

      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        original
          .replace("workflow: framed", "workflow: pure")
          .replaceAll("**FRAME PRESET**: standard-v1\n", ""),
      );
      await expect(refreshFramedTargetText(fixture.runDir)).rejects.toMatchObject({
        code: "target_workflow_switch_structural_required",
        next_action: "preview_target_structural_vnext",
      });
      expect(readFileSync(fixture.paths.target_source_receipt)).toEqual(sourceReceiptBefore);
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBefore);
      expect(readFileSync(fixture.paths.target_raw_evidence)).toEqual(evidenceBefore);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(renderControls.browser_launches).toBe(2);
      expect(renderControls.composition_calls).toBe(1);
      expect(providerSubmissions).toBe(2);
      expect(sourceEpoch(fixture)).toBe(1);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps an exact notes-only refresh browser- and provider-free", async () => {
    const fixture = await createFixture();
    try {
      let providerSubmissions = 0;
      await buildAcceptedRawWork(fixture, { onSubmit: () => { providerSubmissions += 1; } });
      await buildFramedTargetDelivery(fixture.runDir);
      const browserLaunchesBefore = renderControls.browser_launches;
      const compositionCallsBefore = renderControls.composition_calls;

      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("The plan owns this source exactly.", "Only this speaker note changed."),
      );
      await expect(refreshFramedTargetNotes(fixture.runDir)).resolves.toMatchObject({ ok: true });
      expect(providerSubmissions).toBe(2);
      expect(renderControls.browser_launches).toBe(browserLaunchesBefore);
      expect(renderControls.composition_calls).toBe(compositionCallsBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("routes profile drift to raw rebuild instead of rebinding a notes-only underlay", async () => {
    const fixture = await createFixture();
    try {
      await buildAcceptedRawWork(fixture);
      const rawPlanBytes = readFileSync(fixture.paths.target_raw_plan);
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      renderControls.profile_digest_override = "b".repeat(64);
      writeFileSync(
        join(fixture.runDir, "slide-specifications.md"),
        source().replace("The plan owns this source exactly.", "Only this speaker note changed."),
      );

      await expect(refreshFramedTargetNotes(fixture.runDir)).rejects.toMatchObject({
        code: "framed_notes_refresh_rebuild_required",
      });
      expect(readFileSync(fixture.paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(sourceEpoch(fixture)).toBe(1);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
