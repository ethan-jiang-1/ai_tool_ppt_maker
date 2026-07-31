import { describe, expect, it } from "vitest";

import {
  createFramedRawWorkPlan,
  createFramedTargetRawReviewContribution,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import { currentFramedRenderProfile } from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_render_profile.mjs";
import { validateTargetRawReviewContribution } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs";

const digest = (letter) => letter.repeat(64);

function framedReceipt({ firstTitle = "First framed title", secondTitle = "Second framed title" } = {}) {
  return {
    schema: "page-authority-image2-source-v2",
    pipeline: "page-authority-image2-v2",
    workflow: "framed",
    source_sha256: digest("a"),
    slides: [
      {
        slide_id: "DeckGo",
        workflow: "framed",
        display: { title: firstTitle },
        text_frame: { preset: "standard-v1", kicker: null, title: firstTitle, subtitle: null, callout: null },
      },
      {
        slide_id: "FlowUp",
        workflow: "framed",
        display: { title: secondTitle },
        text_frame: { preset: "standard-v1", kicker: null, title: secondTitle, subtitle: null, callout: "One current guide" },
      },
    ],
  };
}

function rawWorkPlan(receipt) {
  return createFramedRawWorkPlan({
    receipt,
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    raw_contracts_by_slide: { DeckGo: digest("d"), FlowUp: digest("e") },
  });
}

describe("Framed raw-review contribution", () => {
  it("maps canonical Framed safe zones and render profile into generic coverage", () => {
    const receipt = framedReceipt();
    const plan = rawWorkPlan(receipt);
    const contribution = createFramedTargetRawReviewContribution({ receipt, rawWorkPlan: plan });

    expect(validateTargetRawReviewContribution(contribution, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
      .toMatchObject({ ok: true, typed_review_contribution_sha256: contribution.typed_review_contribution_sha256 });
    expect(contribution.coverage.ordered_stable_ids).toEqual(["DeckGo", "FlowUp"]);
    expect(contribution.coverage.items.map((item) => item.coverage_profile_digest))
      .toEqual([currentFramedRenderProfile().render_profile_digest, currentFramedRenderProfile().render_profile_digest]);
    expect(contribution.coverage.items).toMatchObject([
      {
        stable_id: "DeckGo",
        coverage_profile_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        guide_primitives: [{ kind: "rectangle", guide_id: "guide_1", x: 0, y: 0, width: 1, height: 286 / 562.5 }],
      },
      {
        stable_id: "FlowUp",
        guide_primitives: [
          { kind: "rectangle", guide_id: "guide_1", x: 0, y: 0, width: 1, height: 286 / 562.5 },
          { kind: "rectangle", guide_id: "guide_2", x: 0, y: 466 / 562.5, width: 1, height: 96 / 562.5 },
        ],
      },
    ]);
    expect(contribution.projection.labels).toEqual([
      { stable_id: "DeckGo", position: 1, title: "First framed title" },
      { stable_id: "FlowUp", position: 2, title: "Second framed title" },
    ]);
    expect(contribution.coverage.items.some((item) => Object.hasOwn(item, "title"))).toBe(false);
  });

  it("keeps accepted-review reuse eligible when only Text Frame labels change", () => {
    const initialReceipt = framedReceipt();
    const plan = rawWorkPlan(initialReceipt);
    const initial = createFramedTargetRawReviewContribution({ receipt: initialReceipt, rawWorkPlan: plan });
    const relabeled = createFramedTargetRawReviewContribution({
      receipt: framedReceipt({ firstTitle: "Retitled without underlay drift", secondTitle: "Another historical label" }),
      rawWorkPlan: plan,
    });

    expect(relabeled.projection.labels.map((label) => label.title)).not.toEqual(initial.projection.labels.map((label) => label.title));
    expect(relabeled.typed_review_contribution_sha256).toBe(initial.typed_review_contribution_sha256);
  });

  it("invalidates coverage identity when a Framed safe-zone guide drifts", () => {
    const receipt = framedReceipt();
    const plan = rawWorkPlan(receipt);
    const contribution = createFramedTargetRawReviewContribution({ receipt, rawWorkPlan: plan });
    const drifted = structuredClone(contribution);
    drifted.coverage.items[1].guide_primitives[1].height -= 0.01;

    expect(validateTargetRawReviewContribution(drifted, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
      .toMatchObject({ ok: true, typed_review_contribution_sha256: expect.any(String) });
    expect(validateTargetRawReviewContribution(drifted, { rawWorkPlan: plan, expectedWorkflow: "framed" }).typed_review_contribution_sha256)
      .not.toBe(contribution.typed_review_contribution_sha256);
  });
});
