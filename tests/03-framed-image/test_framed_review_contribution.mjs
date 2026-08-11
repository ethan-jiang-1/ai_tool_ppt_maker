import { describe, expect, it } from "vitest";

import {
  createFramedRawWorkPlan,
  createFramedTargetRawReviewContribution,
} from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { currentFramedHeaderOverlayRenderProfile } from "../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_profile.mjs";
import {
  framedRenderProfileFacts,
  STANDARD_FRAMED_PRESENTATION_PROFILE,
} from "../helpers/framed_presentation_profile.mjs";
import { validateTargetRawReviewContribution } from "../../ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs";

const digest = (letter) => letter.repeat(64);
const STANDARD_PRESENTATION_PROFILE = STANDARD_FRAMED_PRESENTATION_PROFILE;
const STANDARD_RENDER_PROFILE = currentFramedHeaderOverlayRenderProfile({
  preset: framedRenderProfileFacts(STANDARD_PRESENTATION_PROFILE),
});

function framedProviderInputBinding(compiled) {
  return {
    compiled_provider_input_sha256: digest(compiled),
    provider_content_sha256: digest("b"),
    visual_selection_sha256: digest("c"),
    style_master_selection_sha256: digest("d"),
    generation_profile_sha256: digest("e"),
    header_policy_sha256: digest("f"),
    page_presentation_sha256: digest("9"),
    local_header_profile_sha256: digest("1"),
    protected_geometry_sha256: digest("2"),
  };
}

function headerPolicy(title) {
  const header = { kicker: null, title, subtitle: null };
  return {
    local_header: header,
    context_not_to_render: { ...header },
  };
}

function framedReceipt({ firstTitle = "First framed title", secondTitle = "Second framed title" } = {}) {
  return {
    schema: "page-image-workflow-source",
    pipeline: "page-image-workflow",
    workflow: "framed",
    source_sha256: digest("a"),
    slides: [
      { slide_id: "DeckGo", position: 1, page_class: "standard", header_policy: headerPolicy(firstTitle), visual_language: { presentation: { workflow: "framed", page_class: "standard", binding_sha256: digest("9"), profile: STANDARD_PRESENTATION_PROFILE } } },
      { slide_id: "FlowUp", position: 2, page_class: "standard", header_policy: headerPolicy(secondTitle), visual_language: { presentation: { workflow: "framed", page_class: "standard", binding_sha256: digest("9"), profile: STANDARD_PRESENTATION_PROFILE } } },
    ],
  };
}

function rawWorkPlan(receipt) {
  return createFramedRawWorkPlan({
    receipt,
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    raw_contracts_by_slide: { DeckGo: digest("d"), FlowUp: digest("e") },
    provider_input_bindings_by_slide: {
      DeckGo: framedProviderInputBinding("3"),
      FlowUp: framedProviderInputBinding("4"),
    },
  });
}

describe("Framed raw-review contribution", () => {
  it("maps transparent header protected geometry and render profile into generic coverage", () => {
    const receipt = framedReceipt();
    const plan = rawWorkPlan(receipt);
    const contribution = createFramedTargetRawReviewContribution({ receipt, rawWorkPlan: plan });

    expect(validateTargetRawReviewContribution(contribution, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
      .toMatchObject({ ok: true, typed_review_contribution_sha256: contribution.typed_review_contribution_sha256 });
    expect(contribution.coverage.ordered_stable_ids).toEqual(["DeckGo", "FlowUp"]);
    expect(contribution.coverage.items.map((item) => item.coverage_profile_digest))
      .toEqual([STANDARD_RENDER_PROFILE.render_profile_digest, STANDARD_RENDER_PROFILE.render_profile_digest]);
    expect(contribution.coverage.items).toMatchObject([
      {
        stable_id: "DeckGo",
        coverage_profile_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        guide_primitives: [{ kind: "rectangle", guide_id: "guide_1", x: 40 / 1000, y: 28 / 562.5, width: 920 / 1000, height: 238 / 562.5 }],
      },
      {
        stable_id: "FlowUp",
        guide_primitives: [{ kind: "rectangle", guide_id: "guide_1", x: 40 / 1000, y: 28 / 562.5, width: 920 / 1000, height: 238 / 562.5 }],
      },
    ]);
    expect(contribution.projection.labels).toEqual([
      { stable_id: "DeckGo", position: 1, title: "First framed title" },
      { stable_id: "FlowUp", position: 2, title: "Second framed title" },
    ]);
    expect(JSON.stringify(contribution.coverage)).not.toContain("panel");
    expect(JSON.stringify(contribution.coverage)).not.toContain("callout");
  });

  it("keeps the review-guide identity tied to protected geometry rather than header text", () => {
    const initialReceipt = framedReceipt();
    const plan = rawWorkPlan(initialReceipt);
    const initial = createFramedTargetRawReviewContribution({ receipt: initialReceipt, rawWorkPlan: plan });
    const relabeled = createFramedTargetRawReviewContribution({
      receipt: framedReceipt({ firstTitle: "Retitled header", secondTitle: "Another header" }),
      rawWorkPlan: plan,
    });

    expect(relabeled.projection.labels.map((label) => label.title)).not.toEqual(initial.projection.labels.map((label) => label.title));
    expect(relabeled.typed_review_contribution_sha256).toBe(initial.typed_review_contribution_sha256);
  });

  it("invalidates coverage identity when protected geometry drifts", () => {
    const receipt = framedReceipt();
    const plan = rawWorkPlan(receipt);
    const contribution = createFramedTargetRawReviewContribution({ receipt, rawWorkPlan: plan });
    const drifted = structuredClone(contribution);
    drifted.coverage.items[1].guide_primitives[0].height -= 0.01;

    expect(validateTargetRawReviewContribution(drifted, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
      .toMatchObject({ ok: true, typed_review_contribution_sha256: expect.any(String) });
    expect(validateTargetRawReviewContribution(drifted, { rawWorkPlan: plan, expectedWorkflow: "framed" }).typed_review_contribution_sha256)
      .not.toBe(contribution.typed_review_contribution_sha256);
  });
});
