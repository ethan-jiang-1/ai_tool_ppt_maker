import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import {
  inspectExactPageImagePng,
  PAGE_IMAGE_FRAMED_FINAL_PNG,
  PAGE_IMAGE_REQUEST_SIZE,
  PAGE_IMAGE_NATIVE_RAW_PNG,
  pageImageFinalPngForWorkflow,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_media_contract.mjs";

function png(width, height) {
  const canvas = createCanvas(width, height);
  canvas.getContext("2d").fillRect(0, 0, width, height);
  return canvas.toBuffer("image/png");
}

describe("Page Image native media contract", () => {
  it("keeps the provider transport parameter separate from raw and final media", () => {
    expect(PAGE_IMAGE_REQUEST_SIZE).toBe("2000x1125");
    expect(PAGE_IMAGE_NATIVE_RAW_PNG).toEqual({ format: "png" });
    expect(pageImageFinalPngForWorkflow("pure")).toBe(PAGE_IMAGE_NATIVE_RAW_PNG);
    expect(pageImageFinalPngForWorkflow("framed")).toBe(PAGE_IMAGE_FRAMED_FINAL_PNG);
    expect(() => pageImageFinalPngForWorkflow("unknown")).toThrow(/no final PNG contract/);
  });

  it("accepts the exact native provider PNG without changing its bytes", () => {
    const bytes = png(2048, 1136);
    const media = inspectExactPageImagePng(bytes, PAGE_IMAGE_NATIVE_RAW_PNG);
    expect(media).toMatchObject({ ok: true, actual: PAGE_IMAGE_NATIVE_RAW_PNG });
    expect(media.bytes).toEqual(bytes);
  });

  it("accepts provider-native dimensions and rejects empty or malformed media with bounded classifications", () => {
    const providerNative = png(1684, 934);
    expect(inspectExactPageImagePng(providerNative, PAGE_IMAGE_NATIVE_RAW_PNG)).toMatchObject({
      ok: true,
      actual: { format: "png", width: 1684, height: 934 },
    });
    expect(inspectExactPageImagePng(png(1684, 934), PAGE_IMAGE_FRAMED_FINAL_PNG)).toEqual({
      ok: false,
      classification: "wrong_dimensions",
      actual: { format: "png", width: 1684, height: 934 },
    });
    expect(inspectExactPageImagePng(Buffer.alloc(0), PAGE_IMAGE_NATIVE_RAW_PNG)).toEqual({
      ok: false,
      classification: "empty",
    });
    expect(inspectExactPageImagePng(Buffer.from("not a PNG"), PAGE_IMAGE_NATIVE_RAW_PNG)).toEqual({
      ok: false,
      classification: "invalid_png",
    });
  });
});
