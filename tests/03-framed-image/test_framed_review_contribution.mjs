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
const STANDARD_RESERVED_HEADER = Object.freeze({ x: 40 / 1000, y: 28 / 562.5, width: 920 / 1000, height: 238 / 562.5 });
const STANDARD_PROTECTED_COMPOSITION = Object.freeze({
  coordinate_space: "normalized-canvas",
  reserved_header: STANDARD_RESERVED_HEADER,
  body_safe: Object.freeze({ x: 0, y: STANDARD_RESERVED_HEADER.y + STANDARD_RESERVED_HEADER.height, width: 1, height: 1 - STANDARD_RESERVED_HEADER.y - STANDARD_RESERVED_HEADER.height }),
});
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
    page_design_system_sha256: null,
    local_header_profile_sha256: digest("1"),
    protected_composition_sha256: digest("2"),
  };
}

function headerPolicy(title) {
  const header = { kicker: null, title, subtitle: null };
  return {
    local_header: header,
  };
}

function framedReceipt({ firstTitle = "First framed title", secondTitle = "Second framed title" } = {}) {
  return {
    schema: "page-source-receipt",
    artifact_role: "parsed-source",
    pipeline: "page-image-workflow",
    workflow: "framed",
    source_sha256: digest("a"),
    slides: [
      { slide_id: "DeckGo", position: 1, page_class: "standard", subject_restrictions: "none", header_policy: headerPolicy(firstTitle), visual_language: { presentation: { workflow: "framed", page_class: "standard", binding_sha256: digest("9"), profile: STANDARD_PRESENTATION_PROFILE, protected_composition: STANDARD_PROTECTED_COMPOSITION } } },
      { slide_id: "FlowUp", position: 2, page_class: "standard", subject_restrictions: "none", header_policy: headerPolicy(secondTitle), visual_language: { presentation: { workflow: "framed", page_class: "standard", binding_sha256: digest("9"), profile: STANDARD_PRESENTATION_PROFILE, protected_composition: STANDARD_PROTECTED_COMPOSITION } } },
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
  it("maps transparent header protected composition and render profile into generic coverage", () => {
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
        guide_primitives: [
          { kind: "rectangle", guide_id: "reserved_header", ...STANDARD_RESERVED_HEADER },
          { kind: "rectangle", guide_id: "body_safe", ...STANDARD_PROTECTED_COMPOSITION.body_safe },
        ],
      },
      {
        stable_id: "FlowUp",
        guide_primitives: [
          { kind: "rectangle", guide_id: "reserved_header", ...STANDARD_RESERVED_HEADER },
          { kind: "rectangle", guide_id: "body_safe", ...STANDARD_PROTECTED_COMPOSITION.body_safe },
        ],
      },
    ]);
    expect(contribution.projection.labels).toEqual([
      { stable_id: "DeckGo", position: 1, title: "First framed title" },
      { stable_id: "FlowUp", position: 2, title: "Second framed title" },
    ]);
    expect(JSON.stringify(contribution.coverage)).not.toContain("panel");
    expect(JSON.stringify(contribution.coverage)).not.toContain("callout");
  });

  it("keeps composition guides as data without a lifecycle controller", () => {
    const receipt = framedReceipt();
    const plan = rawWorkPlan(receipt);
    const contribution = createFramedTargetRawReviewContribution({ receipt, rawWorkPlan: plan });

    expect(Object.keys(contribution)).toEqual(["schema", "workflow", "coverage", "projection"]);
    expect(Object.keys(contribution.coverage.items[0])).toEqual([
      "stable_id",
      "coverage_profile_digest",
      "guide_primitives",
    ]);
    for (const guide of contribution.coverage.items[0].guide_primitives) {
      expect(Object.keys(guide)).toEqual(["kind", "guide_id", "x", "y", "width", "height"]);
    }

    for (const field of ["approval", "waiver", "retry", "state", "decision", "occupancy", "collision", "ocr"]) {
      const invalid = structuredClone(contribution);
      invalid.coverage.items[0].guide_primitives[0][field] = true;
      expect(validateTargetRawReviewContribution(invalid, { rawWorkPlan: plan, expectedWorkflow: "framed" }))
        .toMatchObject({ ok: false, code: "target_raw_review_contribution_invalid" });
    }
  });

  it("keeps the review-guide identity tied to protected composition rather than header text", () => {
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

  it("invalidates coverage identity when protected composition drifts", () => {
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
