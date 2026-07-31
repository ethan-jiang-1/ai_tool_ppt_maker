import { describe, expect, it } from "vitest";

import {
  createPureRawWorkPlan,
  createPureTargetRawReviewContribution,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { validateTargetRawReviewContribution } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs";

const digest = (letter) => letter.repeat(64);

function pureReceipt() {
  return {
    schema: "page-authority-image2-source-v2",
    pipeline: "page-authority-image2-v2",
    workflow: "pure",
    source_sha256: digest("a"),
    slides: [
      {
        slide_id: "DeckGo",
        workflow: "pure",
        display: { title: "Pure first title" },
        text_frame: { title: "must not cross the Pure boundary" },
        framed: { reserved_underlay_rectangles: [{ x: 0, y: 0, width: 1, height: 1 }] },
      },
      {
        slide_id: "FlowUp",
        workflow: "pure",
        display: { title: "Pure second title" },
        text_frame: { title: "must not cross the Pure boundary either" },
        framed: { reserved_underlay_rectangles: [{ x: 1, y: 1, width: 1, height: 1 }] },
      },
    ],
  };
}

describe("Pure raw-review contribution", () => {
  it("contributes only generic identity and profile facts to shared review", () => {
    const receipt = pureReceipt();
    const plan = createPureRawWorkPlan({
      receipt,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d"), FlowUp: digest("e") },
    });
    const contribution = createPureTargetRawReviewContribution({ receipt, rawWorkPlan: plan });

    expect(validateTargetRawReviewContribution(contribution, { rawWorkPlan: plan, expectedWorkflow: "pure" }))
      .toMatchObject({ ok: true, typed_review_contribution_sha256: contribution.typed_review_contribution_sha256 });
    expect(contribution.coverage).toEqual({
      ordered_stable_ids: ["DeckGo", "FlowUp"],
      items: [
        { stable_id: "DeckGo", coverage_profile_digest: plan.provider_profile_sha256, guide_primitives: [] },
        { stable_id: "FlowUp", coverage_profile_digest: plan.provider_profile_sha256, guide_primitives: [] },
      ],
    });
    expect(contribution.projection.labels).toEqual([
      { stable_id: "DeckGo", position: 1, title: "Pure first title" },
      { stable_id: "FlowUp", position: 2, title: "Pure second title" },
    ]);
    const sharedInput = JSON.stringify(contribution);
    expect(sharedInput).not.toContain("text_frame");
    expect(sharedInput).not.toContain("reserved_underlay_rectangles");
    expect(sharedInput).not.toContain("framed");
    expect(contribution.coverage.items.every((item) => item.guide_primitives.length === 0)).toBe(true);
  });
});
