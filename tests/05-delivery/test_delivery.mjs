import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  createAcceptedRawEvidence,
  createFinalSlideManifest,
  createRawWorkPlan,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  PageAuthorityDeliveryError,
  assemblePageAuthorityPptx,
  validatePageAuthorityDeliveryInput,
  deliverTargetFinalSlideManifest,
  refreshTargetPageAuthorityNotes,
  validateTargetFinalDeliveryInput,
} from "../../PPTMAKER_FRAMEWORK/scripts/05-delivery/index.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";

const digest = (letter) => letter.repeat(64);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function pngBytes(width, height, color) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  return canvas.toBuffer("image/png");
}

const NATIVE_PROVIDER_PNG = pngBytes(2048, 1136, "#24506a");
const FRAMED_FINAL_PNG = pngBytes(2000, 1125, "#24506a");

async function readPptxSlideXml(pptxPath, position = 1) {
  const archive = await JSZip.loadAsync(readFileSync(pptxPath));
  const slide = archive.file(`ppt/slides/slide${position}.xml`);
  if (!slide) throw new Error(`PPTX slide ${position} is missing`);
  return slide.async("string");
}

async function readPptxMedia(pptxPath) {
  const archive = await JSZip.loadAsync(readFileSync(pptxPath));
  const names = Object.keys(archive.files).filter((name) => /^ppt\/media\/[^/]+\.png$/i.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const file = archive.file(name);
    if (!file) throw new Error(`PPTX media ${name} is missing`);
    return file.async("nodebuffer");
  }));
}

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
    raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG },
  });
  const finalBytesBySlide = {
    DeckGo: workflow === "pure" ? NATIVE_PROVIDER_PNG : FRAMED_FINAL_PNG,
  };
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

  it("rejects a native-sized Pure final whose bytes drift from accepted raw evidence", () => {
    const { evidence, notesBySlide } = deliveryInput("pure");
    const finalBytesBySlide = { DeckGo: pngBytes(2048, 1136, "#8c3f32") };
    const manifest = createFinalSlideManifest({
      evidence,
      expected_workflow: "pure",
      final_bytes_by_slide: finalBytesBySlide,
    });
    expect(() => validateTargetFinalDeliveryInput({
      manifest,
      acceptedRawEvidence: evidence,
      finalBytesBySlide,
      notesBySlide,
      sourceEpoch: 1,
    })).toThrow(/selected workflow media contract/);
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
      raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG },
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
      const assemblyXml = await readPptxSlideXml(result.assembly.path);
      expect(assemblyXml).toContain("<a:blip");
      expect(assemblyXml).toContain("<a:t>01</a:t>");

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
      const refreshedXml = await readPptxSlideXml(result.assembly.path);
      expect(refreshedXml).toContain("<a:blip");
      expect(refreshedXml).toContain("<a:t>01</a:t>");
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("embeds native Pure final PNG bytes without a raster rewrite", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_native_pure_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput("pure");
    try {
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
        title: "Native Pure delivery",
      });
      const media = await readPptxMedia(result.assembly.path);
      expect(media).toHaveLength(1);
      expect(media[0]).toEqual(NATIVE_PROVIDER_PNG);
      expect(readFileSync(join(runDir, "_generated", "page_authority_image2", "final", "01_DeckGo.png"))).toEqual(NATIVE_PROVIDER_PNG);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("writes a bounded CURRENT footer from manifest entry order without renaming its final image", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_current_footer_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const paths = pageAuthorityImage2Paths(runDir);
    const canvas = createCanvas(2048, 1136);
    canvas.getContext("2d").fillRect(0, 0, 2048, 1136);
    const finalBytes = canvas.toBuffer("image/png");
    const manifest = {
      schema: "pptmaker-page-authority-final-manifest-v1",
      source_epoch: 1,
      raw_review_coverage_sha256: digest("a"),
      entries: [{
        slide_id: "DeckGo",
        authority: "pure-image2",
        final_sha256: sha256(finalBytes),
        raw_sha256: digest("b"),
        raw_image_contract_digest: digest("c"),
        raw_generation_profile_digest: digest("d"),
        path: "DeckGo.png",
        width: 2048,
        height: 1136,
        media_profile: "test",
        finalization_fingerprint: digest("e"),
      }],
    };
    try {
      mkdirSync(paths.final_root, { recursive: true });
      writeFileSync(join(paths.final_root, "DeckGo.png"), finalBytes);
      writeFileSync(paths.final_manifest, JSON.stringify(manifest));

      const result = await assemblePageAuthorityPptx(runDir, { sourceEpoch: 1, title: "Current footer" });
      expect(result.receipt).toMatchObject({ ordered_slide_ids: ["DeckGo"] });
      expect(existsSync(join(paths.final_root, "DeckGo.png"))).toBe(true);
      expect(existsSync(join(paths.final_root, "01_DeckGo.png"))).toBe(false);
      const xml = await readPptxSlideXml(result.pptx_path);
      expect(xml).toContain("<a:blip");
      expect(xml).toContain("<a:t>01</a:t>");
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });
});
