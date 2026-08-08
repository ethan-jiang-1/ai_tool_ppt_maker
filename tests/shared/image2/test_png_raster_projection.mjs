import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";

import {
  PngRasterProjectionError,
  createPngRasterProjectionCanvas,
  normalizeDecodedPngForProjection,
} from "../../../ppt_maker_harness/scripts/shared/image2/png_raster_projection.mjs";

function decoded({ channels, depth, data }) {
  return { width: 1, height: 1, channels, depth, data };
}

describe("PNG raster projection", () => {
  it.each([
    ["8-bit grayscale", decoded({ channels: 1, depth: 8, data: new Uint8Array([17]) }), [17, 17, 17, 255]],
    ["8-bit grayscale-alpha", decoded({ channels: 2, depth: 8, data: new Uint8Array([17, 34]) }), [17, 17, 17, 34]],
    ["8-bit RGB", decoded({ channels: 3, depth: 8, data: new Uint8Array([17, 34, 51]) }), [17, 34, 51, 255]],
    ["8-bit RGBA", decoded({ channels: 4, depth: 8, data: new Uint8Array([17, 34, 51, 68]) }), [17, 34, 51, 68]],
    ["16-bit grayscale", decoded({ channels: 1, depth: 16, data: new Uint16Array([0x1234]) }), [0x12, 0x12, 0x12, 255]],
    ["16-bit grayscale-alpha", decoded({ channels: 2, depth: 16, data: new Uint16Array([0x1234, 0xabcd]) }), [0x12, 0x12, 0x12, 0xab]],
    ["16-bit RGB", decoded({ channels: 3, depth: 16, data: new Uint16Array([0x1234, 0x5678, 0x9abc]) }), [0x12, 0x56, 0x9a, 255]],
    ["16-bit RGBA", decoded({ channels: 4, depth: 16, data: new Uint16Array([0x1234, 0x5678, 0x9abc, 0xdef0]) }), [0x12, 0x56, 0x9a, 0xde]],
  ])("normalizes %s", (_name, source, expected) => {
    const result = normalizeDecodedPngForProjection(source);
    expect(result).toMatchObject({ width: 1, height: 1 });
    expect([...result.data]).toEqual(expected);
  });

  it("rejects inconsistent sample layouts without guessing a stride", () => {
    expect(() => normalizeDecodedPngForProjection(decoded({
      channels: 3,
      depth: 8,
      data: new Uint8Array([1, 2, 3, 4]),
    }))).toThrow(PngRasterProjectionError);
  });

  it("rejects unsupported channel and typed-sample layouts", () => {
    expect(() => normalizeDecodedPngForProjection(decoded({
      channels: 5,
      depth: 8,
      data: new Uint8Array(5),
    }))).toThrow(PngRasterProjectionError);
    expect(() => normalizeDecodedPngForProjection(decoded({
      channels: 3,
      depth: 16,
      data: new Uint8Array(3),
    }))).toThrow(PngRasterProjectionError);
  });

  it("builds a same-dimension canvas from 16-bit RGB PNG bytes", () => {
    const bytes = encodePng({
      width: 1,
      height: 1,
      channels: 3,
      depth: 16,
      data: new Uint16Array([0x1234, 0x5678, 0x9abc]),
    });
    const canvas = createPngRasterProjectionCanvas(bytes);
    expect([canvas.width, canvas.height]).toEqual([1, 1]);
    expect([...canvas.getContext("2d").getImageData(0, 0, 1, 1).data]).toEqual([0x12, 0x56, 0x9a, 255]);
  });
});
