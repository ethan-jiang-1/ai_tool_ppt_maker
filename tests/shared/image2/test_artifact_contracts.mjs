import { describe, expect, it } from "vitest";
import {
  createAcceptedRawEvidence,
  createFinalSlideManifest,
  createRawWorkPlan,
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";

const digest = (letter) => letter.repeat(64);

function plan(workflow = "framed") {
  return createRawWorkPlan({
    source_receipt_sha256: digest("a"),
    workflow,
    ordered_slide_ids: ["DeckGo", "BodyMap"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [
      { slide_id: "DeckGo", raw_contract_sha256: digest("d") },
      { slide_id: "BodyMap", raw_contract_sha256: digest("e") },
    ],
  });
}

describe("Page Authority v2 typed artifacts", () => {
  it("binds ordered raw evidence and final slides to the selected workflow", () => {
    const rawPlan = plan();
    const evidence = createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a"), BodyMap: Buffer.from("raw-b") },
    });
    const manifest = createFinalSlideManifest({
      evidence,
      expected_workflow: "framed",
      final_bytes_by_slide: { DeckGo: Buffer.from("final-a"), BodyMap: Buffer.from("final-b") },
    });
    expect(validateRawWorkPlan(rawPlan)).toMatchObject({ ok: true });
    expect(validateAcceptedRawEvidence(evidence, { plan: rawPlan })).toMatchObject({ ok: true });
    expect(validateFinalSlideManifest(manifest, { evidence, expectedWorkflow: "framed" })).toMatchObject({ ok: true });
    expect(manifest.items.map((item) => [item.slide_id, item.position])).toEqual([["DeckGo", 1], ["BodyMap", 2]]);
  });

  it("fails closed for source/profile/evidence drift and wrong workflow publication", () => {
    const rawPlan = plan("pure");
    const evidence = createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a"), BodyMap: Buffer.from("raw-b") },
    });
    expect(validateAcceptedRawEvidence(evidence, { plan: { ...rawPlan, provider_profile_sha256: digest("9") } })).toMatchObject({ ok: false, code: "raw_evidence_stale" });
    expect(() => createFinalSlideManifest({
      evidence,
      expected_workflow: "framed",
      final_bytes_by_slide: { DeckGo: Buffer.from("final-a"), BodyMap: Buffer.from("final-b") },
    })).toThrow(/selected workflow/);
    expect(validateFinalSlideManifest({
      schema: "page-authority-final-slide-manifest-v2",
      source_receipt_sha256: digest("a"),
      accepted_raw_evidence_sha256: digest("b"),
      workflow: "pure",
      items: [{ slide_id: "DeckGo", position: 1, final_sha256: digest("c"), path: "DeckGo.png" }],
    }, { evidence, expectedWorkflow: "pure" })).toMatchObject({ ok: false, code: "final_manifest_stale" });
    expect(validateAcceptedRawEvidence({
      schema: "pptmaker-page-authority-raw-manifest-v1",
      raw_work_plan_sha256: rawPlan.sha256,
      source_receipt_sha256: rawPlan.source_receipt_sha256,
      workflow: "pure",
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      items: [],
    }, { plan: rawPlan })).toMatchObject({ ok: false, code: "raw_evidence_invalid" });
    expect(() => createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a") },
    })).toThrow(/cover the raw work plan exactly/);
  });
});
