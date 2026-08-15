import { describe, expect, it } from "vitest";

import {
  createPureRawWorkPlan,
  createPureTargetRawReviewContribution,
} from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { validateTargetRawReviewContribution } from "../../ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs";

const digest = (letter) => letter.repeat(64);

function pureProviderInputBinding(compiled = "a") {
  return {
    compiled_provider_input_sha256: digest(compiled),
    provider_content_sha256: digest("b"),
    visual_selection_sha256: digest("c"),
    style_master_selection_sha256: digest("d"),
    generation_profile_sha256: digest("e"),
    header_policy_sha256: digest("f"),
    page_presentation_sha256: digest("9"),
    page_design_system_sha256: null,
    local_header_profile_sha256: null,
    protected_composition_sha256: null,
  };
}

function pureReceipt() {
  return {
    schema: "page-source-receipt",
    artifact_role: "parsed-source",
    pipeline: "page-image-workflow",
    workflow: "pure",
    source_sha256: digest("a"),
    slides: [
      {
        slide_id: "DeckGo",
        position: 1,
        subject_restrictions: "none",
        header_policy: { provider_visible: { kicker: null, title: "Pure first title", subtitle: null } },
        provider_content: { items: [] },
      },
      {
        slide_id: "FlowUp",
        position: 2,
        subject_restrictions: "none",
        header_policy: { provider_visible: { kicker: null, title: "Pure second title", subtitle: null } },
        provider_content: { items: [] },
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
      provider_input_bindings_by_slide: {
        DeckGo: pureProviderInputBinding("1"),
        FlowUp: pureProviderInputBinding("2"),
      },
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
    expect(sharedInput).not.toContain("local_header");
    expect(sharedInput).not.toContain("protected_composition");
    expect(sharedInput).not.toContain("framed");
    expect(contribution.coverage.items.every((item) => item.guide_primitives.length === 0)).toBe(true);
  });
});
