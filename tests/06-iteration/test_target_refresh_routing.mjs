import { describe, expect, it } from "vitest";

import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import {
  classifyTargetRefresh,
} from "../../ppt_maker_harness/scripts/06-iteration/index.mjs";
import { pageImageProviderInputBinding } from "../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);

function framedReceipt(source = "a", title = "Framed title") {
  return {
    schema: "page-image-workflow-source",
    pipeline: "page-image-workflow",
    workflow: "framed",
    source_sha256: digest(source),
    slides: [{
      slide_id: "DeckGo",
      position: 1,
      provider_content: { items: [] },
      header_policy: {
        frame_preset: "standard",
        local_header: { kicker: null, title, subtitle: null },
        context_not_to_render: { kicker: null, title, subtitle: null },
      },
      visual_language: { recipe: "editorial-systems" },
    }],
  };
}

function pureReceipt(source = "a", title = "Pure title") {
  return {
    schema: "page-image-workflow-source",
    pipeline: "page-image-workflow",
    workflow: "pure",
    source_sha256: digest(source),
    slides: [{
      slide_id: "DeckGo",
      position: 1,
      provider_content: { items: [] },
      header_policy: { provider_visible: { kicker: null, title, subtitle: null } },
      visual_language: { recipe: "editorial-systems" },
    }],
  };
}

function framedPlan(receipt, { rawContract = "d", binding = {} } = {}) {
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: "framed",
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest(rawContract),
      provider_input_binding: {
        ...pageImageProviderInputBinding({ workflow: "framed" }),
        ...binding,
      },
    }],
  });
}

function framedEvidence(receipt) {
  const plan = framedPlan(receipt);
  return {
    plan,
    evidence: createAcceptedRawEvidence({
      plan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
    }),
  };
}

describe("TARGET refresh routing", () => {
  it("routes a Framed header literal edit through raw rebuild and an equality-proven refresh through local compose", () => {
    const previous = framedReceipt("a", "Original title");
    const { plan, evidence } = framedEvidence(previous);
    const titleChanged = framedReceipt("f", "Updated title");
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: titleChanged,
      rawWorkPlan: plan,
      nextRawWorkPlan: framedPlan(titleChanged, {
        binding: { compiled_provider_input_sha256: digest("9") },
      }),
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_rebuild",
      owner: "03-framed-image",
      provider_required: true,
      reason: "compiled_provider_input_drift",
    });

    const providerFreeNext = framedReceipt("f", "Original title");
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: providerFreeNext,
      rawWorkPlan: plan,
      nextRawWorkPlan: framedPlan(providerFreeNext),
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_local_compose",
      owner: "03-framed-image",
      provider_required: false,
      delivery_owner: "05-delivery",
    });

    const styleChanged = framedReceipt("e", "Original title");
    styleChanged.slides[0].visual_language = { recipe: "bold-editorial" };
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: styleChanged,
      rawWorkPlan: plan,
      nextRawWorkPlan: framedPlan(styleChanged, {
        binding: { visual_selection_sha256: digest("9") },
      }),
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_rebuild",
      owner: "03-framed-image",
      provider_required: true,
    });

    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: previous,
      rawWorkPlan: plan,
      nextRawWorkPlan: framedPlan(previous, { rawContract: "f" }),
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_rebuild",
      owner: "03-framed-image",
      provider_required: true,
      reason: "raw_contract_drift",
    });
  });

  it("routes every Pure display change through the Pure raw rebuild owner", () => {
    expect(classifyTargetRefresh({
      workflow: "pure",
      previousReceipt: pureReceipt("a", "Original title"),
      nextReceipt: pureReceipt("9", "Updated title"),
    })).toMatchObject({
      kind: "pure_rebuild",
      owner: "04-pure-image",
      provider_required: true,
      delivery_owner: "05-delivery",
    });
  });

  it("routes source-classified notes-only work directly to shared delivery", () => {
    expect(classifyTargetRefresh({
      workflow: "pure",
      previousReceipt: pureReceipt("a"),
      nextReceipt: pureReceipt("9"),
      changeKind: "notes-only",
    })).toMatchObject({
      kind: "notes_only_delivery",
      owner: "05-delivery",
      provider_required: false,
      next_action: "refresh_target_notes_delivery",
    });
  });

  it("makes structural membership and workflow changes use exact-hash vNext planning", () => {
    const previous = framedReceipt("a");
    const reordered = framedReceipt("9");
    reordered.slides.push({
      slide_id: "BodyMap",
      position: 2,
      provider_content: { items: [] },
      header_policy: {
        frame_preset: "standard",
        local_header: { kicker: null, title: "Body", subtitle: null },
        context_not_to_render: { kicker: null, title: "Body", subtitle: null },
      },
      visual_language: { recipe: "editorial-systems" },
    });
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: reordered,
    })).toMatchObject({
      kind: "structural_versioning",
      owner: "01-content",
      requires_structural_preview: true,
      provider_calls_before_apply: 0,
    });
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: pureReceipt("9"),
    })).toMatchObject({
      kind: "workflow_switch",
      owner: "01-content",
      requires_structural_preview: true,
      provider_calls_before_apply: 0,
    });
  });

  it("refuses a caller-selected workflow that differs from the current state-bound receipt", () => {
    expect(() => classifyTargetRefresh({
      workflow: "pure",
      previousReceipt: framedReceipt("a"),
      nextReceipt: framedReceipt("9"),
    })).toThrow(/state-bound source workflow/);
  });
});
