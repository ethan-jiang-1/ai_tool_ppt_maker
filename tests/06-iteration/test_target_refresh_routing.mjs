import { describe, expect, it } from "vitest";

import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  classifyTargetRefresh,
} from "../../PPTMAKER_FRAMEWORK/scripts/06-iteration/index.mjs";

const digest = (letter) => letter.repeat(64);

function framedReceipt(source = "a", title = "Framed title") {
  return {
    schema: "page-authority-image2-source-v2",
    pipeline: "page-authority-image2-v2",
    workflow: "framed",
    source_sha256: digest(source),
    slides: [{
      slide_id: "DeckGo",
      workflow: "framed",
      text_frame: { preset: "standard-v1", kicker: null, title, subtitle: null, callout: null },
      visual_brief: { recipe: "editorial-systems" },
    }],
  };
}

function pureReceipt(source = "a", title = "Pure title") {
  return {
    schema: "page-authority-image2-source-v2",
    pipeline: "page-authority-image2-v2",
    workflow: "pure",
    source_sha256: digest(source),
    slides: [{ slide_id: "DeckGo", workflow: "pure", display: { title } }],
  };
}

function framedEvidence(receipt) {
  const plan = createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: "framed",
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
  });
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
  it("routes Framed text-only edits through local compose and style changes through raw rebuild", () => {
    const previous = framedReceipt("a", "Original title");
    const { plan, evidence } = framedEvidence(previous);
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: framedReceipt("z", "Updated title"),
      rawWorkPlan: plan,
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_local_compose",
      owner: "03-framed-image",
      provider_required: false,
      delivery_owner: "05-delivery",
    });

    const styleChanged = framedReceipt("z", "Original title");
    styleChanged.slides[0].visual_brief = { recipe: "bold-editorial" };
    expect(classifyTargetRefresh({
      workflow: "framed",
      previousReceipt: previous,
      nextReceipt: styleChanged,
      rawWorkPlan: plan,
      acceptedRawEvidence: evidence,
    })).toMatchObject({
      kind: "framed_rebuild",
      owner: "03-framed-image",
      provider_required: true,
    });
  });

  it("routes every Pure display change through the Pure raw rebuild owner", () => {
    expect(classifyTargetRefresh({
      workflow: "pure",
      previousReceipt: pureReceipt("a", "Original title"),
      nextReceipt: pureReceipt("z", "Updated title"),
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
      nextReceipt: pureReceipt("z"),
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
    const reordered = framedReceipt("z");
    reordered.slides.push({
      slide_id: "BodyMap",
      workflow: "framed",
      text_frame: { preset: "standard-v1", kicker: null, title: "Body", subtitle: null, callout: null },
      visual_brief: { recipe: "editorial-systems" },
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
      nextReceipt: pureReceipt("z"),
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
      nextReceipt: framedReceipt("z"),
    })).toThrow(/state-bound source workflow/);
  });
});
