import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";
import {
  createAcceptedRawEvidence,
  createFinalSlideManifest,
  createRawWorkPlan,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  PageAuthorityDeliveryError,
  validatePageAuthorityDeliveryInput,
  deliverTargetFinalSlideManifest,
  refreshTargetPageAuthorityNotes,
  validateTargetFinalDeliveryInput,
} from "../../PPTMAKER_FRAMEWORK/scripts/05-delivery/index.mjs";

const digest = (letter) => letter.repeat(64);

function deliveryInput(workflow = "pure") {
  const plan = createRawWorkPlan({
    source_receipt_sha256: digest("a"),
    workflow,
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
  });
  const evidence = createAcceptedRawEvidence({
    plan,
    provider_authorization_sha256: digest("e"),
    raw_review_sha256: digest("f"),
    raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
  });
  const finalBytesBySlide = { DeckGo: Buffer.from("final") };
  const manifest = createFinalSlideManifest({
    evidence,
    expected_workflow: workflow,
    final_bytes_by_slide: finalBytesBySlide,
  });
  return { manifest, evidence, finalBytesBySlide, notesBySlide: { DeckGo: "Source-owned note" } };
}

describe("target Page Authority delivery", () => {
  it("accepts Framed, Pure, and bounded CURRENT manifests through one protocol interface", () => {
    const pure = deliveryInput("pure");
    const framed = deliveryInput("framed");
    const current = {
      schema: "pptmaker-page-authority-final-manifest-v1",
      source_epoch: 1,
      raw_review_coverage_sha256: digest("a"),
      entries: [{
        slide_id: "DeckGo",
        authority: "framed-image2",
        final_sha256: digest("b"),
        raw_sha256: digest("c"),
        raw_image_contract_digest: digest("d"),
        raw_generation_profile_digest: digest("e"),
        path: "DeckGo.png",
        width: 2000,
        height: 1125,
        media_profile: "test",
        finalization_fingerprint: digest("f"),
      }],
    };
    expect(validatePageAuthorityDeliveryInput({ ...pure, acceptedRawEvidence: pure.evidence, sourceEpoch: 1 })).toMatchObject({ protocol: "target-v2" });
    expect(validatePageAuthorityDeliveryInput({ ...framed, acceptedRawEvidence: framed.evidence, sourceEpoch: 1 })).toMatchObject({ protocol: "target-v2" });
    expect(validatePageAuthorityDeliveryInput({ manifest: current, sourceEpoch: 1 })).toMatchObject({ protocol: "current-v1" });
  });

  it("accepts one common manifest regardless of its provenance and retains ordered source notes", () => {
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    expect(validateTargetFinalDeliveryInput({
      manifest,
      acceptedRawEvidence: evidence,
      finalBytesBySlide,
      notesBySlide,
      sourceEpoch: 1,
    })).toMatchObject({ ordered_slide_ids: ["DeckGo"], source_epoch: 1 });
  });

  it("rejects incomplete or byte-mismatched final input before assembly", () => {
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    expect(() => validateTargetFinalDeliveryInput({
      manifest,
      acceptedRawEvidence: evidence,
      finalBytesBySlide: {},
      notesBySlide,
      sourceEpoch: 1,
    })).toThrow(PageAuthorityDeliveryError);
    expect(() => validateTargetFinalDeliveryInput({
      manifest,
      acceptedRawEvidence: evidence,
      finalBytesBySlide: { DeckGo: Buffer.from("drift") },
      notesBySlide,
      sourceEpoch: 1,
    })).toThrow(/drifted/);
  });

  it("writes delivery artifacts only after every target prerequisite validates", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_target_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const plan = createRawWorkPlan({
      source_receipt_sha256: digest("a"), workflow: "framed", ordered_slide_ids: ["DeckGo"],
      provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"),
      items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
    });
    const evidence = createAcceptedRawEvidence({
      plan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
    });
    const canvas = createCanvas(2000, 1125);
    const context = canvas.getContext("2d");
    context.fillStyle = "#24506a";
    context.fillRect(0, 0, 2000, 1125);
    context.fillStyle = "#ffffff";
    context.font = "700 80px Arial";
    context.fillText("Target delivery", 100, 200);
    const finalBytesBySlide = { DeckGo: canvas.toBuffer("image/png") };
    const manifest = createFinalSlideManifest({ evidence, expected_workflow: "framed", final_bytes_by_slide: finalBytesBySlide });
    try {
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide: { DeckGo: "Source-owned note" },
        sourceEpoch: 1,
        title: "Target delivery",
      });
      expect(result.receipt).toMatchObject({ ordered_slide_ids: ["DeckGo"], notes_injected: 1 });
      expect(existsSync(result.assembly.path)).toBe(true);
      expect(existsSync(result.projection.path)).toBe(true);
      expect(existsSync(result.receipt_path)).toBe(true);

      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, "## Slide 01: `DeckGo`\n\n> **SPEAKER NOTE**: Updated source-owned note\n");
      const refreshed = await refreshTargetPageAuthorityNotes({
        runDir,
        sourcePath,
        sourceEpoch: 1,
      });
      expect(refreshed.notes).toMatchObject({ notesInjected: 1 });
      expect(refreshed.receipt).toMatchObject({
        schema: "page-authority-delivery-receipt-v2",
        final_manifest_sha256: manifest.sha256,
        notes_injected: 1,
      });
      expect(JSON.parse(readFileSync(result.receipt_path, "utf8"))).toEqual(refreshed.receipt);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });
});
