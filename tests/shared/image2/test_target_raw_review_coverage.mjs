import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  authorizePureTargetRawPlan,
  buildPureTargetRawPlan,
  buildPureTargetDelivery,
  createPureTargetRawReviewContribution,
  decidePureTargetRawReview,
  generatePureTargetRawPlan,
  preparePureTargetRawReview,
  resolvePureStyleMasterScope,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  createRawWorkPlan,
  pageImageOrdinalImageFilename,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { resolveContentAddressName } from "../../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";
import {
  createTargetRawReviewContribution,
  prepareTargetRawReview,
  projectTargetRawReviewContribution,
  validateTargetRawReviewContribution,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

let originalRuntimeProfileId;

beforeEach(() => {
  originalRuntimeProfileId = process.env.IMAGE2_PROVIDER_PROFILE_ID;
  process.env.IMAGE2_PROVIDER_PROFILE_ID = "test-image2-profile";
});

afterEach(() => {
  if (originalRuntimeProfileId === undefined) delete process.env.IMAGE2_PROVIDER_PROFILE_ID;
  else process.env.IMAGE2_PROVIDER_PROFILE_ID = originalRuntimeProfileId;
});

function source() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Bound review projection
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Coverage must bind actual projection bytes.
`;
}

function solidPng(fillStyle) {
  const image = createCanvas(2000, 1125);
  const context = image.getContext("2d");
  context.fillStyle = fillStyle;
  context.fillRect(0, 0, 2000, 1125);
  return image.toBuffer("image/png");
}

async function createPureFixture(root, name, imageBytes) {
  const deck = join(root, name);
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), imageBytes);
  writeFileSync(join(runDir, "slide-specifications.md"), source());
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  return { deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

async function submitPureRaw(runDir, imageBytes) {
  const plan = buildPureTargetRawPlan(runDir);
  await authorizePureTargetRawPlan(runDir, { planHash: plan.raw_work_plan.sha256 });
  await generatePureTargetRawPlan(runDir, { planHash: plan.raw_work_plan.sha256, submit: async () => imageBytes });
  return plan;
}

describe("target raw-review coverage", () => {
  it("projects labels and generic guides in raw-work-plan order", () => {
    const plan = createRawWorkPlan({
      source_receipt_sha256: "a".repeat(64),
      workflow: "framed",
      ordered_slide_ids: ["FlowUp", "DeckGo"],
      provider_profile_sha256: "b".repeat(64),
      authorization_scope_sha256: "c".repeat(64),
      items: [
        {
          slide_id: "FlowUp",
          raw_contract_sha256: "d".repeat(64),
          provider_input_binding: pageImageProviderInputBinding({ workflow: "framed", compiled: "1" }),
        },
        {
          slide_id: "DeckGo",
          raw_contract_sha256: "e".repeat(64),
          provider_input_binding: pageImageProviderInputBinding({ workflow: "framed", compiled: "2" }),
        },
      ],
    });
    const contribution = createTargetRawReviewContribution({
      workflow: "framed",
      ordered_stable_ids: ["FlowUp", "DeckGo"],
      coverage_items: [
        {
          stable_id: "FlowUp",
          coverage_profile_digest: "f".repeat(64),
          guide_primitives: [{ kind: "rectangle", guide_id: "guide_1", x: 0, y: 0, width: 1, height: 0.5 }],
        },
        { stable_id: "DeckGo", coverage_profile_digest: "f".repeat(64), guide_primitives: [] },
      ],
      projection_labels: [
        { stable_id: "FlowUp", position: 1, title: "First current title" },
        { stable_id: "DeckGo", position: 2, title: "Second current title" },
      ],
    });

    expect(projectTargetRawReviewContribution(plan, contribution)).toMatchObject([
      {
        stable_id: "FlowUp",
        position: 1,
        title: "First current title",
        guide_primitives: [{ kind: "rectangle", guide_id: "guide_1", x: 0, y: 0, width: 1, height: 0.5 }],
      },
      { stable_id: "DeckGo", position: 2, title: "Second current title", guide_primitives: [] },
    ]);
    const partial = structuredClone(contribution);
    partial.coverage.items.pop();
    expect(validateTargetRawReviewContribution(partial, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
      .toMatchObject({ ok: false, code: "target_raw_review_contribution_invalid" });
  });

  it("binds source epoch, exact raw bytes, contribution, profile, and actual projection PNG", async () => {
    const root = mkdtempSync(join(tmpdir(), "target-review-coverage-"));
    const deck = join(root, "deck_target_review_coverage");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const imageBytes = image.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), imageBytes);
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureTargetRawPlan(runDir);
      await authorizePureTargetRawPlan(runDir, { planHash: plan.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: plan.raw_work_plan.sha256, submit: async () => imageBytes });
      const paths = pageImageWorkflowPaths(runDir);
      const contribution = createPureTargetRawReviewContribution({ receipt: plan.receipt, rawWorkPlan: plan.raw_work_plan });
      const partialContribution = structuredClone(contribution);
      partialContribution.coverage.items.pop();
      await expect(prepareTargetRawReview(plan, plan.raw_work_plan, { reviewContribution: partialContribution }))
        .rejects.toMatchObject({ code: "target_raw_review_contribution_invalid" });
      expect(existsSync(paths.target_raw_review)).toBe(false);
      expect(existsSync(paths.target_raw_review_projection)).toBe(false);

      const prepared = await preparePureTargetRawReview(runDir);
      const review = JSON.parse(readFileSync(paths.target_raw_review, "utf8"));
      const reviewRoot = join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), plan.raw_work_plan.sha256));
      const reviewEvidencePath = join(reviewRoot, "complete-page-review-evidence.json");
      const reviewProjectionPath = join(reviewRoot, "complete-page-review.png");
      const projectionBytes = readFileSync(reviewProjectionPath);
      const presentation = JSON.parse(readFileSync(reviewEvidencePath, "utf8"));

      expect(review).toEqual({
        schema: "page-image-complete-page-review",
        source_epoch: plan.source_epoch,
        workflow: "pure",
        raw_bytes_sha256: canonicalJsonSha256([{ slide_id: "DeckGo", raw_sha256: sha256(imageBytes) }]),
        typed_review_contribution_sha256: contribution.typed_review_contribution_sha256,
        complete_page_presentation_sha256: canonicalJsonSha256(presentation),
        projection_sha256: sha256(projectionBytes),
        projection_capture_profile_sha256: presentation.projection_capture_profile_sha256,
        decision: null,
      });
      expect(presentation).toMatchObject({
        schema: "page-image-complete-page-review-presentation",
        raw_work_plan_sha256: plan.raw_work_plan.sha256,
        source_epoch: plan.source_epoch,
        workflow: "pure",
        typed_review_contribution_sha256: contribution.typed_review_contribution_sha256,
        projection_sha256: sha256(projectionBytes),
        has_complete_page_artifact: false,
        items: [{
          slide_id: "DeckGo",
          raw_provider_page_sha256: sha256(imageBytes),
          complete_page_sha256: sha256(imageBytes),
        }],
      });
      expect(prepared).toMatchObject({
        typed_review_contribution_sha256: contribution.typed_review_contribution_sha256,
        complete_page_presentation_sha256: canonicalJsonSha256(presentation),
        projection_capture_profile_sha256: presentation.projection_capture_profile_sha256,
      });
      expect(review).not.toHaveProperty("raw_work_plan_sha256");
      expect(review).not.toHaveProperty("source_receipt_sha256");
      expect(existsSync(paths.target_raw_review_projection)).toBe(false);
      expect(() => decidePureTargetRawReview(runDir, { decision: "force" })).toThrow(/decision must be proceed or repair/);
      expect(() => decidePureTargetRawReview(runDir, { decision: "redirect" })).toThrow(/decision must be proceed or repair/);
      expect(existsSync(paths.target_raw_evidence)).toBe(false);

      const expectReviewDriftStops = (driftedReview) => {
        writeFileSync(paths.target_raw_review, JSON.stringify(driftedReview));
        expect(() => decidePureTargetRawReview(runDir, { decision: "proceed" })).toThrow(/current coverage/);
        expect(existsSync(paths.target_raw_evidence)).toBe(false);
        writeFileSync(paths.target_raw_review, JSON.stringify(review));
      };
      expectReviewDriftStops({ ...review, source_epoch: review.source_epoch + 1 });
      expectReviewDriftStops({ ...review, projection_capture_profile_sha256: "f".repeat(64) });

      const rawSlidePath = join(paths.raw_root, pageImageOrdinalImageFilename(1, "DeckGo"));
      writeFileSync(rawSlidePath, solidPng("#7c2d12"));
      expect(() => decidePureTargetRawReview(runDir, { decision: "proceed" })).toThrow(/current adapter evidence/);
      expect(existsSync(paths.target_raw_evidence)).toBe(false);
      writeFileSync(rawSlidePath, imageBytes);

      const tampered = Buffer.from(projectionBytes);
      tampered[tampered.length - 1] ^= 1;
      writeFileSync(reviewProjectionPath, tampered);
      expect(() => decidePureTargetRawReview(runDir, { decision: "proceed" })).toThrow(/current adapter evidence/);
      expect(existsSync(paths.target_raw_evidence)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects copied review artifacts, then rebuilds them through the same owner", async () => {
    const root = mkdtempSync(join(tmpdir(), "target-review-copy-"));
    const firstBytes = solidPng("#1f4d6e");
    const secondBytes = solidPng("#7c2d12");
    const first = await createPureFixture(root, "deck_review_copy_source", firstBytes);
    const second = await createPureFixture(root, "deck_review_copy_target", secondBytes);
    try {
      await submitPureRaw(first.runDir, firstBytes);
      await preparePureTargetRawReview(first.runDir);
      await submitPureRaw(second.runDir, secondBytes);
      mkdirSync(dirname(second.paths.target_raw_review), { recursive: true });
      writeFileSync(second.paths.target_raw_review, readFileSync(first.paths.target_raw_review));

      expect(() => decidePureTargetRawReview(second.runDir, { decision: "proceed" })).toThrow(/current adapter evidence/);
      await expect(buildPureTargetDelivery(second.runDir)).rejects.toMatchObject({ code: "target_accepted_raw_evidence_required" });
      expect(existsSync(second.paths.target_raw_evidence)).toBe(false);

      await preparePureTargetRawReview(second.runDir);
      expect(decidePureTargetRawReview(second.runDir, { decision: "proceed" }))
        .toMatchObject({ decision: "proceed", accepted_raw_evidence: { workflow: "pure" } });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
