import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import {
  inspectCurrentFinalSlideManifest,
  publishCurrentFinalSlideManifest,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_final_manifest.mjs";
import { CurrentProtocolInvalidError } from "../../../ppt_maker_harness/scripts/shared/workflow/current_protocol_invalid.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);

function framedFinalPng() {
  const canvas = createCanvas(2000, 1125);
  canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

function currentInputs() {
  const rawWorkPlan = createRawWorkPlan({
    source_receipt_sha256: digest("a"), workflow: "framed", ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow: "framed" }),
    }],
  });
  const acceptedRawEvidence = createAcceptedRawEvidence({
    plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"),
    raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
  });
  return { rawWorkPlan, acceptedRawEvidence };
}

describe("Page Image common final manifest helper", () => {
  it("publishes and validates only exact current evidence and bytes", () => {
    const { rawWorkPlan, acceptedRawEvidence } = currentInputs();
    const finalBytesBySlide = { DeckGo: framedFinalPng() };
    const manifest = publishCurrentFinalSlideManifest({
      rawWorkPlan, acceptedRawEvidence, ownerWorkflow: "framed", finalBytesBySlide,
    });
    expect(inspectCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, manifest, finalBytesBySlide })).toMatchObject({ ok: true });
    expect(inspectCurrentFinalSlideManifest({
      rawWorkPlan,
      acceptedRawEvidence,
      manifest,
      finalBytesBySlide: { DeckGo: Buffer.from("drift") },
    })).toMatchObject({ ok: false, code: "final_manifest_bytes_stale", next_action: "rebuild_final_through_owner" });
  });

  it("does not publish a final manifest from stale accepted evidence", () => {
    const { rawWorkPlan, acceptedRawEvidence } = currentInputs();
    expect(() => publishCurrentFinalSlideManifest({
      rawWorkPlan: { ...rawWorkPlan, provider_profile_sha256: digest("9") },
      acceptedRawEvidence,
      ownerWorkflow: "framed",
      finalBytesBySlide: { DeckGo: framedFinalPng() },
    })).toThrow(CurrentProtocolInvalidError);
  });
});
