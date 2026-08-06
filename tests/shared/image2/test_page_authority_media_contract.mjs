import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import {
  inspectExactPageAuthorityPng,
  PAGE_AUTHORITY_FRAMED_FINAL_PNG,
  PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE,
  PAGE_AUTHORITY_NATIVE_RAW_PNG,
  pageAuthorityFinalPngForWorkflow,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_media_contract.mjs";

function png(width, height) {
  const canvas = createCanvas(width, height);
  canvas.getContext("2d").fillRect(0, 0, width, height);
  return canvas.toBuffer("image/png");
}

describe("Page Authority native media contract", () => {
  it("keeps the provider transport parameter separate from raw and final media", () => {
    expect(PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE).toBe("2000x1125");
    expect(PAGE_AUTHORITY_NATIVE_RAW_PNG).toEqual({ format: "png" });
    expect(pageAuthorityFinalPngForWorkflow("pure")).toBe(PAGE_AUTHORITY_NATIVE_RAW_PNG);
    expect(pageAuthorityFinalPngForWorkflow("framed")).toBe(PAGE_AUTHORITY_FRAMED_FINAL_PNG);
    expect(() => pageAuthorityFinalPngForWorkflow("unknown")).toThrow(/no final PNG contract/);
  });

  it("accepts the exact native provider PNG without changing its bytes", () => {
    const bytes = png(2048, 1136);
    const media = inspectExactPageAuthorityPng(bytes, PAGE_AUTHORITY_NATIVE_RAW_PNG);
    expect(media).toMatchObject({ ok: true, actual: PAGE_AUTHORITY_NATIVE_RAW_PNG });
    expect(media.bytes).toEqual(bytes);
  });

  it("accepts provider-native dimensions and rejects empty or malformed media with bounded classifications", () => {
    const providerNative = png(1684, 934);
    expect(inspectExactPageAuthorityPng(providerNative, PAGE_AUTHORITY_NATIVE_RAW_PNG)).toMatchObject({
      ok: true,
      actual: { format: "png", width: 1684, height: 934 },
    });
    expect(inspectExactPageAuthorityPng(png(1684, 934), PAGE_AUTHORITY_FRAMED_FINAL_PNG)).toEqual({
      ok: false,
      classification: "wrong_dimensions",
      actual: { format: "png", width: 1684, height: 934 },
    });
    expect(inspectExactPageAuthorityPng(Buffer.alloc(0), PAGE_AUTHORITY_NATIVE_RAW_PNG)).toEqual({
      ok: false,
      classification: "empty",
    });
    expect(inspectExactPageAuthorityPng(Buffer.from("not a PNG"), PAGE_AUTHORITY_NATIVE_RAW_PNG)).toEqual({
      ok: false,
      classification: "invalid_png",
    });
  });
});
