import { describe, expect, it } from "vitest";

import {
  PAGE_IMAGE_INVALIDATION_SCHEMA,
  evaluatePageImageInvalidation,
} from "../../../ppt_maker_harness/scripts/shared/page-image/page_image_invalidation.mjs";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);

function receipt({ workflow = "framed", source = "a" } = {}) {
  return {
    schema: "page-source-receipt",
    artifact_role: "parsed-source",
    pipeline: "page-image-workflow",
    workflow,
    source_sha256: digest(source),
    slides: [{
      slide_id: "DeckGo",
      position: 1,
      page_class: "standard",
      subject_restrictions: "none",
      provider_content: { items: [] },
      header_policy: workflow === "framed"
        ? {
          local_header: { kicker: null, title: "Current title", subtitle: null },
        }
        : { provider_visible: { kicker: null, title: "Current title", subtitle: null } },
      visual_language: {},
    }],
  };
}

function rawPlan(currentReceipt, {
  compiled = "1",
  rawContract = "d",
  providerProfile = "b",
  binding = {},
} = {}) {
  return createRawWorkPlan({
    source_receipt_sha256: currentReceipt.source_sha256,
    workflow: currentReceipt.workflow,
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest(providerProfile),
    authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest(rawContract),
      provider_input_binding: {
        ...pageImageProviderInputBinding({ workflow: currentReceipt.workflow, compiled }),
        ...binding,
      },
    }],
  });
}

function acceptedEvidence(plan) {
  return createAcceptedRawEvidence({
    plan,
    provider_authorization_sha256: digest("e"),
    raw_review_sha256: digest("f"),
    raw_bytes_by_slide: { DeckGo: Buffer.from("accepted raw page") },
  });
}

describe("Page Image invalidation", () => {
  it("requires a raw rebuild when a Framed header changes compiled provider input", () => {
    const previousReceipt = receipt({ source: "a" });
    const nextReceipt = receipt({ source: "b" });
    const previousPlan = rawPlan(previousReceipt, { compiled: "1" });
    const nextPlan = rawPlan(nextReceipt, { compiled: "9" });

    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: nextPlan,
      acceptedRawEvidence: acceptedEvidence(previousPlan),
    })).toMatchObject({
      schema: PAGE_IMAGE_INVALIDATION_SCHEMA,
      workflow: "framed",
      kind: "raw_rebuild",
      provider_required: true,
      reason: "compiled_provider_input_drift",
    });
  });

  it("requires a raw rebuild and a new review when Framed source restrictions drift", () => {
    const previousReceipt = receipt({ source: "a" });
    const nextReceipt = {
      ...receipt({ source: "b" }),
      slides: [{
        ...receipt({ source: "b" }).slides[0],
        subject_restrictions: "no-identity-subject",
      }],
    };
    const previousPlan = rawPlan(previousReceipt);
    const nextPlan = rawPlan(nextReceipt, { compiled: "9", rawContract: "9" });

    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: nextPlan,
      acceptedRawEvidence: acceptedEvidence(previousPlan),
    })).toMatchObject({
      workflow: "framed",
      kind: "raw_rebuild",
      provider_required: true,
      next_action: "authorize_and_rebuild_framed_raw",
      reason: "raw_contract_drift",
    });
  });

  it("allows Framed local overlay refresh only when every bound provider fact remains equal", () => {
    const previousReceipt = receipt({ source: "a" });
    const nextReceipt = receipt({ source: "b" });
    const previousPlan = rawPlan(previousReceipt);
    const nextPlan = rawPlan(nextReceipt);

    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: nextPlan,
      acceptedRawEvidence: acceptedEvidence(previousPlan),
    })).toMatchObject({
      workflow: "framed",
      kind: "local_overlay_refresh",
      provider_required: false,
      next_action: "compose_framed_final_through_owner",
    });
  });

  it("rejects Framed overlay reuse when a raw contract, profile, composition, or accepted evidence binding drifts", () => {
    const previousReceipt = receipt({ source: "a" });
    const nextReceipt = receipt({ source: "b" });
    const previousPlan = rawPlan(previousReceipt);
    const currentEvidence = acceptedEvidence(previousPlan);

    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: rawPlan(nextReceipt, { rawContract: "9" }),
      acceptedRawEvidence: currentEvidence,
    })).toMatchObject({ kind: "raw_rebuild", reason: "raw_contract_drift" });

    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: rawPlan(nextReceipt, {
        binding: { protected_composition_sha256: digest("9") },
      }),
      acceptedRawEvidence: currentEvidence,
    })).toMatchObject({ kind: "raw_rebuild", reason: "protected_composition_drift" });

    const staleEvidencePlan = rawPlan(previousReceipt, { providerProfile: "9" });
    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: rawPlan(nextReceipt),
      acceptedRawEvidence: acceptedEvidence(staleEvidencePlan),
      acceptedRawWorkPlan: staleEvidencePlan,
    })).toMatchObject({ kind: "raw_evidence_required", reason: "accepted_evidence_binding_stale" });
  });

  it("compares direct plan bindings even when the source receipt is unchanged", () => {
    const currentReceipt = receipt({ source: "a" });
    const currentPlan = rawPlan(currentReceipt);

    expect(evaluatePageImageInvalidation({
      previousReceipt: currentReceipt,
      nextReceipt: currentReceipt,
      previousRawWorkPlan: currentPlan,
      nextRawWorkPlan: rawPlan(currentReceipt, { rawContract: "9" }),
    })).toMatchObject({ kind: "raw_rebuild", reason: "raw_contract_drift" });
  });

  it("rebuilds Framed raw work for every compiled input and local profile binding drift", () => {
    const previousReceipt = receipt({ source: "a" });
    const nextReceipt = receipt({ source: "b" });
    const previousPlan = rawPlan(previousReceipt);
    const evidence = acceptedEvidence(previousPlan);
    const cases = [
      ["compiled_provider_input_sha256", "compiled_provider_input_drift", "9"],
      ["provider_content_sha256", "provider_content_drift", "9"],
      ["visual_selection_sha256", "visual_selection_drift", "9"],
      ["style_master_selection_sha256", "style_master_selection_drift", "9"],
      ["generation_profile_sha256", "generation_profile_drift", "9"],
      ["header_policy_sha256", "header_policy_drift", "9"],
      ["page_presentation_sha256", "page_presentation_drift", "8"],
      ["page_design_system_sha256", "page_design_system_drift", "8"],
      ["local_header_profile_sha256", "local_header_profile_drift", "9"],
      ["protected_composition_sha256", "protected_composition_drift", "9"],
    ];

    for (const [field, reason, replacement] of cases) {
      expect(evaluatePageImageInvalidation({
        previousReceipt,
        nextReceipt,
        previousRawWorkPlan: previousPlan,
        nextRawWorkPlan: rawPlan(nextReceipt, { binding: { [field]: digest(replacement) } }),
        acceptedRawEvidence: evidence,
      })).toMatchObject({ kind: "raw_rebuild", reason });
    }
    expect(evaluatePageImageInvalidation({
      previousReceipt,
      nextReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: rawPlan(nextReceipt, { providerProfile: "9" }),
      acceptedRawEvidence: evidence,
    })).toMatchObject({ kind: "raw_rebuild", reason: "generation_profile_drift" });
  });

  it("turns selected Pure page-presentation drift into raw rebuild debt without mutating accepted evidence", () => {
    const currentReceipt = receipt({ workflow: "pure", source: "a" });
    const previousPlan = rawPlan(currentReceipt);
    const nextPlan = rawPlan(currentReceipt, {
      binding: { page_presentation_sha256: digest("8") },
    });
    const historicalEvidence = acceptedEvidence(previousPlan);
    const evidenceBefore = structuredClone(historicalEvidence);

    expect(evaluatePageImageInvalidation({
      previousReceipt: currentReceipt,
      nextReceipt: currentReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: nextPlan,
      acceptedRawEvidence: historicalEvidence,
    })).toMatchObject({
      workflow: "pure",
      kind: "raw_rebuild",
      provider_required: true,
      reason: "page_presentation_drift",
      next_action: "authorize_and_rebuild_pure_raw",
    });
    expect(historicalEvidence).toEqual(evidenceBefore);
  });

  it("treats Page Design System null transitions as raw rebuild debt", () => {
    const currentReceipt = receipt({ workflow: "pure", source: "a" });
    const previousPlan = rawPlan(currentReceipt);
    const nextPlan = rawPlan(currentReceipt, {
      binding: { page_design_system_sha256: digest("8") },
    });

    expect(evaluatePageImageInvalidation({
      previousReceipt: currentReceipt,
      nextReceipt: currentReceipt,
      previousRawWorkPlan: previousPlan,
      nextRawWorkPlan: nextPlan,
      acceptedRawEvidence: acceptedEvidence(previousPlan),
    })).toMatchObject({
      workflow: "pure",
      kind: "raw_rebuild",
      provider_required: true,
      reason: "page_design_system_drift",
      next_action: "authorize_and_rebuild_pure_raw",
    });
  });

  it("keeps Pure source changes on raw rebuild while routing explicit notes-only work to delivery", () => {
    const previousReceipt = receipt({ workflow: "pure", source: "a" });
    const nextReceipt = receipt({ workflow: "pure", source: "b" });

    expect(evaluatePageImageInvalidation({ previousReceipt, nextReceipt }))
      .toMatchObject({ kind: "raw_rebuild", workflow: "pure", reason: "provider_visible_source_drift" });
    expect(evaluatePageImageInvalidation({ previousReceipt, nextReceipt, changeKind: "notes-only" }))
      .toMatchObject({ kind: "notes_only", provider_required: false, next_action: "refresh_target_notes_delivery" });
  });
});
