import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { encode as encodePng } from "fast-png";
import { describe, expect, it } from "vitest";

import { pageImageOrdinalImageFilename } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { resolveContentAddressName } from "../../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";
import {
  publishCompletePageReviewPresentation,
  publishPilotPageReviewPresentation,
  validateCompletePageReviewPresentation,
  validatePilotPageReviewPresentation,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_complete_page_review.mjs";
import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";

const digest = (letter) => letter.repeat(64);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const REVIEW_DIGEST = digest("b");
const PLAN_DIGEST = digest("a");
const BATCH_DIGEST = digest("c");

function png(color) {
  const image = createCanvas(2000, 1125);
  const context = image.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, image.width, image.height);
  return image.toBuffer("image/png");
}

function sixteenBitRgbPng() {
  return Buffer.from(encodePng({
    width: 2,
    height: 1,
    channels: 3,
    depth: 16,
    data: new Uint16Array([0x1234, 0x5678, 0x9abc, 0xabcd, 0xdef0, 0x1357]),
  }));
}

function binding(workflow, rawBytes, completeBytes = null) {
  return canonicalJsonSha256({
    schema: `test-${workflow}-complete-page-binding`,
    raw_provider_page_sha256: sha256(rawBytes),
    ...(completeBytes === null ? {} : { complete_page_sha256: sha256(completeBytes) }),
  });
}

function reviewRoot(runDir) {
  return join(pageImageWorkflowPaths(runDir).review_root, "complete-page", resolveContentAddressName(join(pageImageWorkflowPaths(runDir).review_root, "complete-page"), PLAN_DIGEST));
}

function pilotReviewRoot(runDir) {
  return join(pageImageWorkflowPaths(runDir).review_root, "pilot", resolveContentAddressName(join(pageImageWorkflowPaths(runDir).review_root, "pilot"), BATCH_DIGEST));
}

function validate({ runDir, workflow, rawBytes, bindingDigest }) {
  return validateCompletePageReviewPresentation({
    runDir,
    rawWorkPlanSha256: PLAN_DIGEST,
    sourceEpoch: 1,
    workflow,
    typedReviewContributionSha256: REVIEW_DIGEST,
    orderedSlideIds: ["DeckGo"],
    rawBytesBySlide: { DeckGo: rawBytes },
    adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
  });
}

describe("Complete Page Review presentation", () => {
  it("keeps Pure as one exact provider page with no composite artifact", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-complete-page-review-"));
    const deck = join(root, "deck_complete_review");
    initBundle(deck, null, "keynote", "dark-executive");
    const runDir = join(deck, "3_versions", "v1");
    const providerBytes = png("#174b74");
    const bindingDigest = binding("pure", providerBytes);
    try {
      const published = await publishCompletePageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        sourceEpoch: 1,
        workflow: "pure",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedSlideIds: ["DeckGo"],
        rawBytesBySlide: { DeckGo: providerBytes },
        adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
      });
      const rootPath = reviewRoot(runDir);
      const filename = pageImageOrdinalImageFilename(1, "DeckGo");
      const presentation = JSON.parse(readFileSync(join(rootPath, "complete-page-review-evidence.json"), "utf8"));

      expect(presentation).toMatchObject({
        raw_work_plan_sha256: PLAN_DIGEST,
        workflow: "pure",
        has_complete_page_artifact: false,
        items: [{
          slide_id: "DeckGo",
          raw_provider_page_sha256: sha256(providerBytes),
          complete_page_sha256: sha256(providerBytes),
          adapter_complete_page_binding_sha256: bindingDigest,
        }],
      });
      expect(readFileSync(join(rootPath, "provider-page", filename))).toEqual(providerBytes);
      expect(existsSync(join(rootPath, "complete-page", filename))).toBe(false);
      expect(validate({ runDir, workflow: "pure", rawBytes: providerBytes, bindingDigest }))
        .toMatchObject({ ok: true, complete_page_presentation_sha256: published.complete_page_presentation_sha256 });
      await expect(publishCompletePageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        sourceEpoch: 1,
        workflow: "pure",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedSlideIds: ["DeckGo"],
        rawBytesBySlide: { DeckGo: providerBytes },
        completeBytesBySlide: { DeckGo: png("#d97706") },
        adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
      })).rejects.toMatchObject({ code: "complete_page_review_invalid" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("renders a 16-bit RGB Pure provider page while retaining its exact evidence bytes", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-16bit-complete-page-review-"));
    const deck = join(root, "deck_complete_review");
    initBundle(deck, null, "keynote", "dark-executive");
    const runDir = join(deck, "3_versions", "v1");
    const providerBytes = sixteenBitRgbPng();
    const bindingDigest = binding("pure", providerBytes);
    try {
      const published = await publishCompletePageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        sourceEpoch: 1,
        workflow: "pure",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedSlideIds: ["DeckGo"],
        rawBytesBySlide: { DeckGo: providerBytes },
        adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
      });
      const rootPath = reviewRoot(runDir);
      const filename = pageImageOrdinalImageFilename(1, "DeckGo");

      expect(readFileSync(join(rootPath, "provider-page", filename))).toEqual(providerBytes);
      expect(readFileSync(join(rootPath, "complete-page-review.png")).subarray(0, 8))
        .toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(validate({ runDir, workflow: "pure", rawBytes: providerBytes, bindingDigest }))
        .toMatchObject({ ok: true, complete_page_presentation_sha256: published.complete_page_presentation_sha256 });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds Framed provider and composed pages separately and rejects composite drift", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-complete-page-review-"));
    const deck = join(root, "deck_complete_review");
    initBundle(deck, null, "keynote", "dark-executive");
    const runDir = join(deck, "3_versions", "v1");
    const providerBytes = png("#174b74");
    const compositeBytes = png("#d97706");
    const bindingDigest = binding("framed", providerBytes, compositeBytes);
    try {
      await publishCompletePageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        sourceEpoch: 1,
        workflow: "framed",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedSlideIds: ["DeckGo"],
        rawBytesBySlide: { DeckGo: providerBytes },
        completeBytesBySlide: { DeckGo: compositeBytes },
        adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
      });
      const rootPath = reviewRoot(runDir);
      const filename = pageImageOrdinalImageFilename(1, "DeckGo");
      const presentation = JSON.parse(readFileSync(join(rootPath, "complete-page-review-evidence.json"), "utf8"));

      expect(presentation).toMatchObject({
        workflow: "framed",
        has_complete_page_artifact: true,
        items: [{
          slide_id: "DeckGo",
          raw_provider_page_sha256: sha256(providerBytes),
          complete_page_sha256: sha256(compositeBytes),
          adapter_complete_page_binding_sha256: bindingDigest,
        }],
      });
      expect(readFileSync(join(rootPath, "provider-page", filename))).toEqual(providerBytes);
      expect(readFileSync(join(rootPath, "complete-page", filename))).toEqual(compositeBytes);
      expect(validate({ runDir, workflow: "framed", rawBytes: providerBytes, bindingDigest })).toMatchObject({ ok: true });

      writeFileSync(join(rootPath, "complete-page", filename), providerBytes);
      expect(validate({ runDir, workflow: "framed", rawBytes: providerBytes, bindingDigest }))
        .toMatchObject({ ok: false, code: "complete_page_review_stale" });
      await expect(publishCompletePageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        sourceEpoch: 1,
        workflow: "framed",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedSlideIds: ["DeckGo"],
        rawBytesBySlide: { DeckGo: providerBytes },
        adapterCompletePageBindingsBySlide: { DeckGo: bindingDigest },
      })).rejects.toMatchObject({ code: "complete_page_review_invalid" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a Pilot scoped to its batch while preserving full-plan ordinals", async () => {
    const root = mkdtempSync(join(tmpdir(), "pilot-page-review-"));
    const deck = join(root, "deck_pilot_review");
    initBundle(deck, null, "keynote", "dark-executive");
    const runDir = join(deck, "3_versions", "v1");
    const providerBytes = png("#174b74");
    const compositeBytes = png("#d97706");
    const bindingDigest = binding("framed", providerBytes, compositeBytes);
    try {
      const published = await publishPilotPageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        batchSha256: BATCH_DIGEST,
        sourceEpoch: 1,
        workflow: "framed",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedPlanSlideIds: ["DeckGo", "PathGo"],
        pilotSlideIds: ["PathGo"],
        rawBytesBySlide: { PathGo: providerBytes },
        completeBytesBySlide: { PathGo: compositeBytes },
        adapterCompletePageBindingsBySlide: { PathGo: bindingDigest },
      });
      const rootPath = pilotReviewRoot(runDir);
      const filename = pageImageOrdinalImageFilename(2, "PathGo");
      const presentation = JSON.parse(readFileSync(join(rootPath, "pilot-page-review-evidence.json"), "utf8"));

      expect(presentation).toMatchObject({
        schema: "page-image-pilot-page-review-presentation",
        raw_work_plan_sha256: PLAN_DIGEST,
        batch_sha256: BATCH_DIGEST,
        workflow: "framed",
        has_complete_page_artifact: true,
        items: [{ slide_id: "PathGo" }],
      });
      expect(readFileSync(join(rootPath, "provider-page", filename))).toEqual(providerBytes);
      expect(readFileSync(join(rootPath, "complete-page", filename))).toEqual(compositeBytes);
      expect(validatePilotPageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        batchSha256: BATCH_DIGEST,
        sourceEpoch: 1,
        workflow: "framed",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedPlanSlideIds: ["DeckGo", "PathGo"],
        pilotSlideIds: ["PathGo"],
        rawBytesBySlide: { PathGo: providerBytes },
        adapterCompletePageBindingsBySlide: { PathGo: bindingDigest },
      })).toMatchObject({ ok: true, pilot_page_presentation_sha256: published.pilot_page_presentation_sha256 });

      writeFileSync(join(rootPath, "provider-page", filename), compositeBytes);
      expect(validatePilotPageReviewPresentation({
        runDir,
        rawWorkPlanSha256: PLAN_DIGEST,
        batchSha256: BATCH_DIGEST,
        sourceEpoch: 1,
        workflow: "framed",
        typedReviewContributionSha256: REVIEW_DIGEST,
        orderedPlanSlideIds: ["DeckGo", "PathGo"],
        pilotSlideIds: ["PathGo"],
        rawBytesBySlide: { PathGo: providerBytes },
        adapterCompletePageBindingsBySlide: { PathGo: bindingDigest },
      })).toMatchObject({ ok: false, code: "pilot_page_review_stale" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
