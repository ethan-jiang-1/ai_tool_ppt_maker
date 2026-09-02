import { createCanvas } from "@napi-rs/canvas";
import { decode as decodePng } from "fast-png";

export class PngRasterProjectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PngRasterProjectionError";
    this.code = "png_raster_projection_invalid";
  }
}

function fail(message) {
  throw new PngRasterProjectionError(message);
}

function requirePositiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(`PNG raster projection requires a positive ${label}`);
  }
  return value;
}

function sourceSample(value, depth) {
  return depth === 16 ? value >>> 8 : value;
}

/** Normalize a decoded fast-png result for a rebuildable raster projection.  * Authority: openspec/specs/harness-script-layout/spec.md
 * Authority: openspec/specs/delivery/spec.md
 */
export function normalizeDecodedPngForProjection(decoded) {
  if (!decoded || typeof decoded !== "object") {
    fail("PNG raster projection requires decoded PNG data");
  }
  const width = requirePositiveSafeInteger(decoded.width, "width");
  const height = requirePositiveSafeInteger(decoded.height, "height");
  const channels = decoded.channels;
  const depth = decoded.depth;
  if (!Number.isInteger(channels) || channels < 1 || channels > 4) {
    fail("PNG raster projection supports one to four channels");
  }
  if (depth !== 8 && depth !== 16) {
    fail("PNG raster projection supports 8-bit or 16-bit samples");
  }
  const pixelCount = width * height;
  const sampleCount = pixelCount * channels;
  if (!Number.isSafeInteger(pixelCount) || !Number.isSafeInteger(sampleCount)) {
    fail("PNG raster projection dimensions are too large");
  }
  const data = decoded.data;
  const expectedConstructor = depth === 8 ? Uint8Array : Uint16Array;
  if (!(data instanceof expectedConstructor) || data.length !== sampleCount) {
    fail("PNG raster projection decoded sample layout is inconsistent");
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);
  for (let pixel = 0, source = 0, target = 0; pixel < pixelCount; pixel += 1, source += channels, target += 4) {
    const first = sourceSample(data[source], depth);
    if (channels === 1 || channels === 2) {
      rgba[target] = first;
      rgba[target + 1] = first;
      rgba[target + 2] = first;
      rgba[target + 3] = channels === 2 ? sourceSample(data[source + 1], depth) : 255;
      continue;
    }
    rgba[target] = first;
    rgba[target + 1] = sourceSample(data[source + 1], depth);
    rgba[target + 2] = sourceSample(data[source + 2], depth);
    rgba[target + 3] = channels === 4 ? sourceSample(data[source + 3], depth) : 255;
  }
  return Object.freeze({ width, height, data: rgba });
}

/** Decode exact PNG bytes only to create an independently rebuildable canvas. */
export function createPngRasterProjectionCanvas(bytes) {
  let decoded;
  try {
    decoded = decodePng(bytes, { checkCrc: true });
  } catch {
    fail("PNG raster projection requires CRC-valid PNG bytes");
  }
  const raster = normalizeDecodedPngForProjection(decoded);
  const canvas = createCanvas(raster.width, raster.height);
  const context = canvas.getContext("2d");
  const image = context.createImageData(raster.width, raster.height);
  image.data.set(raster.data);
  context.putImageData(image, 0, 0);
  return canvas;
}
