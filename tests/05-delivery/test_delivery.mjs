// Tests: openspec/specs/delivery/spec.md
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { encode as encodePng } from "fast-png";
import JSZip from "jszip";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
  formatPageImageOrdinal,
} from "../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { publishCurrentFinalSlideManifest } from "../../ppt_maker_harness/scripts/shared/image2/page_image_final_manifest.mjs";
import {
  PageImageDeliveryError,
  assemblePageImagePptx,
  assertPresentCurrentTargetDeliveryIdentity,
  inspectCurrentTargetPageImageDelivery,
  validatePageImageDeliveryInput,
  deliverTargetFinalSlideManifest,
  refreshTargetPageImageNotes,
  validateTargetFinalDeliveryInput,
} from "../../ppt_maker_harness/scripts/05-delivery/index.mjs";
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  derivePageImageDeliveryMedia,
  publishPageImageDeliveryMedia,
} from "../../ppt_maker_harness/scripts/05-delivery/internal/page_image_delivery_media.mjs";
import { pageImageProviderInputBinding } from "../helpers/page_image_provider_input_binding.mjs";

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
  const names = Object.keys(archive.files).filter((name) => /^ppt\/media\/[^/]+\.jpe?g$/i.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const file = archive.file(name);
    if (!file) throw new Error(`PPTX media ${name} is missing`);
    return file.async("nodebuffer");
  }));
}

function deliveryInput(workflow = "pure", nativeProviderPng = NATIVE_PROVIDER_PNG) {
  const plan = createRawWorkPlan({
    source_receipt_sha256: digest("a"),
    workflow,
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow }),
    }],
  });
  const evidence = createAcceptedRawEvidence({
    plan,
    provider_authorization_sha256: digest("e"),
    raw_review_sha256: digest("f"),
    raw_bytes_by_slide: { DeckGo: nativeProviderPng },
  });
  const finalBytesBySlide = {
    DeckGo: workflow === "pure" ? nativeProviderPng : FRAMED_FINAL_PNG,
  };
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan: plan,
    acceptedRawEvidence: evidence,
    ownerWorkflow: workflow,
    finalBytesBySlide,
  });
  return { plan, manifest, evidence, finalBytesBySlide, notesBySlide: { DeckGo: "Source-owned note" } };
}

function persistFinalManifest(runDir, manifest) {
  const paths = pageImageWorkflowPaths(runDir);
  mkdirSync(paths.final_root, { recursive: true });
  writeFileSync(paths.target_final_manifest, `${JSON.stringify(manifest)}\n`);
  return paths;
}

function transparentPng(width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#d94841";
  context.fillRect(Math.floor(width / 2), Math.floor(height / 2), 1, 1);
  return canvas.toBuffer("image/png");
}

function sixteenBitRgbPng(width, height) {
  const data = new Uint16Array(width * height * 3);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    data[pixel * 3] = 0x1234;
    data[pixel * 3 + 1] = 0x5678;
    data[pixel * 3 + 2] = 0x9abc;
  }
  return Buffer.from(encodePng({ width, height, channels: 3, depth: 16, data }));
}

describe("target Page Image delivery", () => {
  it("inspects only a fully bound current delivery without writing", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_delivery_inspection_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      expect(await inspectCurrentTargetPageImageDelivery({ runDir })).toEqual({ available: false });
      persistFinalManifest(runDir, manifest);
      await deliverTargetFinalSlideManifest({
        runDir, manifest, acceptedRawEvidence: evidence, finalBytesBySlide, notesBySlide, sourceEpoch: 1,
      });
      const before = readFileSync(join(pageImageWorkflowPaths(runDir).final_root, "delivery-receipt.json"));
      const inspected = await inspectCurrentTargetPageImageDelivery({ runDir });
      expect(inspected).toMatchObject({ available: true, receipt: { schema: "page-image-delivery-receipt" } });
      expect(readFileSync(join(pageImageWorkflowPaths(runDir).final_root, "delivery-receipt.json"))).toEqual(before);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("hard-stops a present malformed final manifest before finalization can overwrite it", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_delivery_existing_manifest_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const paths = pageImageWorkflowPaths(runDir);
    const malformed = Buffer.from('{"schema":"foreign-final-manifest"}\n');
    try {
      mkdirSync(paths.final_root, { recursive: true });
      writeFileSync(paths.target_final_manifest, malformed);

      await expect(assertPresentCurrentTargetDeliveryIdentity({ runDir }))
        .rejects.toMatchObject({ code: "current_protocol_invalid" });
      expect(readFileSync(paths.target_final_manifest)).toEqual(malformed);
      expect(existsSync(join(paths.final_root, "delivery-receipt.json"))).toBe(false);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("accepts Framed and Pure replacement manifests through one protocol interface", () => {
    const pure = deliveryInput("pure");
    const framed = deliveryInput("framed");
    expect(validatePageImageDeliveryInput({ ...pure, acceptedRawEvidence: pure.evidence, sourceEpoch: 1 }))
      .toMatchObject({ protocol: "page-image-workflow" });
    expect(validatePageImageDeliveryInput({ ...framed, acceptedRawEvidence: framed.evidence, sourceEpoch: 1 }))
      .toMatchObject({ protocol: "page-image-workflow" });
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
    })).toThrow(PageImageDeliveryError);
    expect(() => validateTargetFinalDeliveryInput({
      manifest,
      acceptedRawEvidence: evidence,
      finalBytesBySlide: { DeckGo: Buffer.from("drift") },
      notesBySlide,
      sourceEpoch: 1,
    })).toThrow(/drifted/);
  });

  it("rejects a native-sized Pure final whose bytes drift from accepted raw evidence", () => {
    const { plan, evidence, notesBySlide } = deliveryInput("pure");
    const finalBytesBySlide = { DeckGo: pngBytes(2048, 1136, "#8c3f32") };
    const manifest = publishCurrentFinalSlideManifest({
      rawWorkPlan: plan,
      acceptedRawEvidence: evidence,
      ownerWorkflow: "pure",
      finalBytesBySlide,
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
      items: [{
        slide_id: "DeckGo",
        raw_contract_sha256: digest("d"),
        provider_input_binding: pageImageProviderInputBinding({ workflow: "framed" }),
      }],
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
    const manifest = publishCurrentFinalSlideManifest({
      rawWorkPlan: plan,
      acceptedRawEvidence: evidence,
      ownerWorkflow: "framed",
      finalBytesBySlide,
    });
    try {
      const paths = persistFinalManifest(runDir, manifest);
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
      expect(result.assembly.receipt).toMatchObject({ schema: "page-image-pptx-assembly" });
      expect(result.notes.receipt).toMatchObject({ schema: "page-image-notes-receipt" });
      expect(result.delivery_media.manifest).toMatchObject({
        schema: "page-image-delivery-media",
        profile: { quality: 95, chroma_subsampling: "4:4:4", alpha_background: "#ffffff" },
      });
      expect(result.receipt).toMatchObject({
        delivery_media_manifest_sha256: result.delivery_media.manifest_sha256,
        delivery_entries: result.assembly.receipt.delivery_entries,
      });
      expect(existsSync(result.projection.path)).toBe(true);
      expect(existsSync(result.receipt_path)).toBe(true);
      const assemblyXml = await readPptxSlideXml(result.assembly.path);
      expect(assemblyXml).toContain("<a:blip");
      expect(assemblyXml).toContain("<a:t>01</a:t>");

      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, "## Slide 01: `DeckGo`\n\n> **SPEAKER NOTE**: Updated source-owned note\n");
      const refreshed = await refreshTargetPageImageNotes({
        runDir,
        sourcePath,
        sourceEpoch: 1,
      });
      expect(refreshed.notes.receipt).toMatchObject({ notes_injected: 1 });
      expect(refreshed.receipt).toMatchObject({
        schema: "page-image-delivery-receipt",
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

  it("embeds non-default native Pure final JPEG media without changing source PNG bytes", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_native_pure_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const providerNative = pngBytes(1684, 934, "#24506a");
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput("pure", providerNative);
    try {
      const paths = persistFinalManifest(runDir, manifest);
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
      expect(manifest.items[0]).toMatchObject({ width: 1684, height: 934 });
      expect(media[0]).not.toEqual(providerNative);
      await expect(sharp(media[0]).metadata()).resolves.toMatchObject({
        format: "jpeg", width: 1684, height: 934, chromaSubsampling: "4:4:4",
      });
      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(providerNative);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("renders a 16-bit RGB Pure final contact projection without changing final PNG identity", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_16bit_pure_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const providerNative = sixteenBitRgbPng(4, 2);
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput("pure", providerNative);
    try {
      const paths = persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
        title: "16-bit Pure delivery",
      });

      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(providerNative);
      expect(readFileSync(result.projection.path).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(result.receipt.final_entries).toEqual([{ slide_id: "DeckGo", final_sha256: sha256(providerNative) }]);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("assembles the persisted replacement manifest in its current order", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_replacement_footer_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide } = deliveryInput("pure");
    try {
      const paths = persistFinalManifest(runDir, manifest);
      writeFileSync(join(paths.final_root, manifest.items[0].path), finalBytesBySlide.DeckGo);
      const derived = await derivePageImageDeliveryMedia({
        finalManifest: manifest,
        finalManifestSha256: manifest.sha256,
        finalBytesBySlide,
      });
      publishPageImageDeliveryMedia(paths, derived);
      const result = await assemblePageImagePptx(runDir, {
        sourceEpoch: 1,
        title: "Replacement footer",
        manifest,
        acceptedRawEvidence: evidence,
      });
      expect(result.receipt).toMatchObject({ ordered_slide_ids: ["DeckGo"] });
      expect(existsSync(join(paths.final_root, "01_DeckGo.png"))).toBe(true);
      const xml = await readPptxSlideXml(result.pptx_path);
      expect(xml).toContain("<a:blip");
      expect(xml).toContain("<a:t>01</a:t>");
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("accepts a blank quote line inside a multiline speaker note", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_blank_quote_note_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
      });
      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, [
        "## Slide 01: `DeckGo`",
        "",
        "> **SPEAKER NOTE**",
        ">",
        "> First owned paragraph after a blank quote line.",
        "",
      ].join("\n"));
      const refreshed = await refreshTargetPageImageNotes({ runDir, sourcePath, sourceEpoch: 1 });
      expect(refreshed.notes.receipt).toMatchObject({ notes_injected: 1 });
      expect(refreshed.receipt).toMatchObject({ schema: "page-image-delivery-receipt", notes_injected: 1 });
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("rejects a blank-only speaker note without replacing the PPTX or publishing a receipt", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_blank_only_note_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
      });
      const pptxBefore = readFileSync(result.assembly.path);
      const receiptBefore = readFileSync(result.receipt_path);
      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, "## Slide 01: `DeckGo`\n\n> **SPEAKER NOTE**\n>\n>\n");
      await expect(refreshTargetPageImageNotes({ runDir, sourcePath, sourceEpoch: 1 }))
        .rejects.toThrow(/missing SPEAKER NOTE content for slide\(s\) 1/);
      expect(readFileSync(result.assembly.path)).toEqual(pptxBefore);
      expect(readFileSync(result.receipt_path)).toEqual(receiptBefore);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("renders manifest-order ordinal footers across digit boundaries without changing final bytes", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_ordinal_footer_digits_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const nativePng = pngBytes(2048, 1136, "#24506a");
    const slideIds = Array.from({ length: 10 }, (_, index) => `Slide${index + 1}`);
    const items = slideIds.map((slide_id) => ({
      slide_id,
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
    }));
    const plan = createRawWorkPlan({
      source_receipt_sha256: digest("a"),
      workflow: "pure",
      ordered_slide_ids: slideIds,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      items,
    });
    const evidence = createAcceptedRawEvidence({
      plan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: Object.fromEntries(slideIds.map((id) => [id, nativePng])),
    });
    const finalBytesBySlide = Object.fromEntries(slideIds.map((id) => [id, nativePng]));
    const manifest = publishCurrentFinalSlideManifest({
      rawWorkPlan: plan,
      acceptedRawEvidence: evidence,
      ownerWorkflow: "pure",
      finalBytesBySlide,
    });
    const notesBySlide = Object.fromEntries(slideIds.map((id) => [id, `Note for ${id}`]));
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
      });
      expect(result.receipt).toMatchObject({ notes_injected: 10 });
      expect(await readPptxSlideXml(result.assembly.path, 1)).toContain("<a:t>01</a:t>");
      expect(await readPptxSlideXml(result.assembly.path, 10)).toContain("<a:t>10</a:t>");
      expect(formatPageImageOrdinal(100)).toBe("100");
      expect(readFileSync(join(pageImageWorkflowPaths(runDir).final_root, manifest.items[0].path))).toEqual(nativePng);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("flattens transparent final PNG pixels over white for JPEG delivery", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_transparent_jpeg_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const transparentProviderPng = transparentPng(2048, 1136);
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput("pure", transparentProviderPng);
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
      });
      const jpeg = readFileSync(result.delivery_media.media_by_slide.DeckGo.path);
      const decoded = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });
      expect(decoded.info.channels).toBe(3);
      expect([...decoded.data.subarray(0, 3)]).toEqual(expect.arrayContaining([expect.any(Number)]));
      expect(decoded.data[0]).toBeGreaterThan(245);
      expect(decoded.data[1]).toBeGreaterThan(245);
      expect(decoded.data[2]).toBeGreaterThan(245);
      expect(readFileSync(join(pageImageWorkflowPaths(runDir).final_root, manifest.items[0].path))).toEqual(transparentProviderPng);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("requires normal delivery rebuild for stale JPEG media and preserves receipts", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_stale_jpeg_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir, manifest, acceptedRawEvidence: evidence, finalBytesBySlide, notesBySlide, sourceEpoch: 1,
      });
      const beforePptx = readFileSync(result.assembly.path);
      const beforeNotes = readFileSync(result.notes.path);
      writeFileSync(result.delivery_media.media_by_slide.DeckGo.path, Buffer.from("corrupt JPEG"));
      await expect(refreshTargetPageImageNotes({
        runDir,
        sourcePath: join(runDir, "slide-specifications.md"),
      })).rejects.toMatchObject({ code: "delivery_media_rebuild_required" });
      expect(readFileSync(result.assembly.path)).toEqual(beforePptx);
      expect(readFileSync(result.notes.path)).toEqual(beforeNotes);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("routes an incomplete delivery receipt to the current-protocol hard-stop", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_old_delivery_receipt_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      persistFinalManifest(runDir, manifest);
      const result = await deliverTargetFinalSlideManifest({
        runDir, manifest, acceptedRawEvidence: evidence, finalBytesBySlide, notesBySlide, sourceEpoch: 1,
      });
      const beforePptx = readFileSync(result.assembly.path);
      const oldReceipt = JSON.parse(readFileSync(result.receipt_path, "utf8"));
      delete oldReceipt.delivery_media_manifest_sha256;
      delete oldReceipt.delivery_entries;
      writeFileSync(result.receipt_path, JSON.stringify(oldReceipt));
      await expect(refreshTargetPageImageNotes({
        runDir,
        sourcePath: join(runDir, "slide-specifications.md"),
      })).rejects.toMatchObject({ code: "current_protocol_invalid" });
      expect(readFileSync(result.assembly.path)).toEqual(beforePptx);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("keeps a prior delivery intact when JPEG derivation fails", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_failed_jpeg_delivery_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      persistFinalManifest(runDir, manifest);
      const first = await deliverTargetFinalSlideManifest({
        runDir, manifest, acceptedRawEvidence: evidence, finalBytesBySlide, notesBySlide, sourceEpoch: 1,
      });
      const beforePptx = readFileSync(first.assembly.path);
      const beforeAssembly = readFileSync(first.assembly.receipt_path);
      const beforeNotes = readFileSync(first.notes.path);
      const beforeDelivery = readFileSync(first.receipt_path);
      await expect(deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
        deliveryMediaDeriver: async () => { throw new Error("forced JPEG encoder failure"); },
      })).rejects.toMatchObject({ code: "delivery_media_derivation_failed" });
      expect(readFileSync(first.assembly.path)).toEqual(beforePptx);
      expect(readFileSync(first.assembly.receipt_path)).toEqual(beforeAssembly);
      expect(readFileSync(first.notes.path)).toEqual(beforeNotes);
      expect(readFileSync(first.receipt_path)).toEqual(beforeDelivery);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("keeps final PNG, JPEG media, contact projection, and receipt unchanged when raster projection derivation fails", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_failed_raster_projection_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide, notesBySlide } = deliveryInput();
    try {
      const paths = persistFinalManifest(runDir, manifest);
      const first = await deliverTargetFinalSlideManifest({
        runDir, manifest, acceptedRawEvidence: evidence, finalBytesBySlide, notesBySlide, sourceEpoch: 1,
      });
      const beforeFinalPng = readFileSync(join(paths.final_root, manifest.items[0].path));
      const beforeJpeg = readFileSync(first.delivery_media.media_by_slide.DeckGo.path);
      const beforeMediaManifest = readFileSync(paths.delivery_media_manifest);
      const beforeProjection = readFileSync(first.projection.path);
      const beforeReceipt = readFileSync(first.receipt_path);

      await expect(deliverTargetFinalSlideManifest({
        runDir,
        manifest,
        acceptedRawEvidence: evidence,
        finalBytesBySlide,
        notesBySlide,
        sourceEpoch: 1,
        projectionDeriver: () => { throw new Error("forced raster projection failure"); },
      })).rejects.toMatchObject({ code: "final_projection_invalid" });

      expect(readFileSync(join(paths.final_root, manifest.items[0].path))).toEqual(beforeFinalPng);
      expect(readFileSync(first.delivery_media.media_by_slide.DeckGo.path)).toEqual(beforeJpeg);
      expect(readFileSync(paths.delivery_media_manifest)).toEqual(beforeMediaManifest);
      expect(readFileSync(first.projection.path)).toEqual(beforeProjection);
      expect(readFileSync(first.receipt_path)).toEqual(beforeReceipt);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("rejects an undeclared final manifest before writing delivery artifacts", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_delivery_undeclared_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const paths = pageImageWorkflowPaths(runDir);
    try {
      await expect(deliverTargetFinalSlideManifest({
        runDir,
        manifest: { schema: "unrecognized-final-slide-manifest" },
        acceptedRawEvidence: { schema: "unrecognized-accepted-raw-evidence" },
        finalBytesBySlide: { DeckGo: NATIVE_PROVIDER_PNG },
        notesBySlide: { DeckGo: "Source-owned note" },
      })).rejects.toMatchObject({ code: "current_protocol_invalid" });
      expect(existsSync(paths.final_root)).toBe(false);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("rejects a persisted undeclared manifest before assembly reads final media", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_assembly_undeclared_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const { manifest, evidence, finalBytesBySlide } = deliveryInput("pure");
    const paths = pageImageWorkflowPaths(runDir);
    try {
      mkdirSync(paths.final_root, { recursive: true });
      writeFileSync(paths.target_final_manifest, JSON.stringify({
        schema: "unrecognized-final-slide-manifest",
      }));
      writeFileSync(join(paths.final_root, manifest.items[0].path), finalBytesBySlide.DeckGo);

      await expect(assemblePageImagePptx(runDir, {
        sourceEpoch: 1,
        manifest,
        acceptedRawEvidence: evidence,
      })).rejects.toMatchObject({ code: "current_protocol_invalid" });

      expect(existsSync(join(paths.final_root, "deck.pptx"))).toBe(false);
      expect(readFileSync(join(paths.final_root, manifest.items[0].path))).toEqual(finalBytesBySlide.DeckGo);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });

  it("rejects a persisted undeclared manifest before a notes-only refresh reads or rewrites the PPTX", async () => {
    const deckDir = mkdtempSync(join(tmpdir(), "deck_notes_undeclared_"));
    const runDir = join(deckDir, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    const paths = pageImageWorkflowPaths(runDir);
    const pptxPath = join(paths.final_root, "deck.pptx");
    const sentinel = Buffer.from("retained-delivery-pptx");
    try {
      mkdirSync(paths.final_root, { recursive: true });
      writeFileSync(join(paths.final_root, "delivery-receipt.json"), JSON.stringify({
        schema: "page-image-delivery-receipt",
        source_epoch: 1,
      }));
      writeFileSync(paths.target_final_manifest, JSON.stringify({
        schema: "unrecognized-final-slide-manifest",
      }));
      writeFileSync(pptxPath, sentinel);

      await expect(refreshTargetPageImageNotes({ runDir, sourcePath: join(runDir, "slide-specifications.md") }))
        .rejects.toMatchObject({ code: "current_protocol_invalid" });

      expect(readFileSync(pptxPath)).toEqual(sentinel);
      expect(existsSync(join(paths.final_root, "pptx-assembly.json"))).toBe(false);
      expect(existsSync(join(paths.final_root, "notes-receipt.json"))).toBe(false);
    } finally {
      rmSync(deckDir, { recursive: true, force: true });
    }
  });
});
