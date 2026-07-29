import { describe, expect, it } from "vitest";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  inspectCurrentFinalSlideManifest,
  publishCurrentFinalSlideManifest,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_final_manifest.mjs";

const digest = (letter) => letter.repeat(64);

function currentInputs() {
  const rawWorkPlan = createRawWorkPlan({
    source_receipt_sha256: digest("a"), workflow: "framed", ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"),
    items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
  });
  const acceptedRawEvidence = createAcceptedRawEvidence({
    plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"),
    raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
  });
  return { rawWorkPlan, acceptedRawEvidence };
}

describe("Page Authority common final manifest helper", () => {
  it("publishes and validates only exact current evidence and bytes", () => {
    const { rawWorkPlan, acceptedRawEvidence } = currentInputs();
    const finalBytesBySlide = { DeckGo: Buffer.from("final") };
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
      finalBytesBySlide: { DeckGo: Buffer.from("final") },
    })).toThrow(/current raw work plan/);
  });
});
