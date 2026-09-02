import { decode as decodePng } from "fast-png";

export const PAGE_IMAGE_REQUEST_SIZE = "2000x1125";

export const PAGE_IMAGE_NATIVE_RAW_PNG = Object.freeze({ format: "png" });

export const PAGE_IMAGE_FRAMED_FINAL_PNG = Object.freeze({
  format: "png",
  width: 2000,
  height: 1125,
});

const FINAL_MEDIA_BY_WORKFLOW = Object.freeze({
  pure: Object.freeze({ png: PAGE_IMAGE_NATIVE_RAW_PNG, requires_raw_byte_identity: true }),
  framed: Object.freeze({ png: PAGE_IMAGE_FRAMED_FINAL_PNG, requires_raw_byte_identity: false }),
});

function bytes(value) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) return null;
  const copy = Buffer.from(value);
  return copy.length > 0 ? copy : null;
}

function expectedPng(value) {
  const hasWidth = Object.hasOwn(value || {}, "width");
  const hasHeight = Object.hasOwn(value || {}, "height");
  if (!value || value.format !== "png" || hasWidth !== hasHeight ||
    (hasWidth && (!Number.isSafeInteger(value.width) || value.width <= 0 ||
      !Number.isSafeInteger(value.height) || value.height <= 0))) {
    throw new TypeError("Page Image PNG expectation is invalid");
  }
  return value;
}

/** Return the exact final media contract owned by one selected workflow.  * Authority: openspec/specs/delivery/spec.md
 */
export function pageImageFinalPngForWorkflow(workflow) {
  const contract = FINAL_MEDIA_BY_WORKFLOW[workflow];
  if (!contract) throw new TypeError("Page Image workflow has no final PNG contract");
  return contract.png;
}

/** Inspect bytes without transforming them or inferring dimensions from request transport. */
export function inspectExactPageImagePng(value, expected = PAGE_IMAGE_NATIVE_RAW_PNG) {
  const required = expectedPng(expected);
  const source = bytes(value);
  if (!source) return Object.freeze({ ok: false, classification: "empty" });
  let decoded;
  try {
    decoded = decodePng(source, { checkCrc: true });
  } catch {
    return Object.freeze({ ok: false, classification: "invalid_png" });
  }
  const actual = Object.freeze({ format: "png", width: decoded.width, height: decoded.height });
  if (Object.hasOwn(required, "width") && (actual.width !== required.width || actual.height !== required.height)) {
    return Object.freeze({ ok: false, classification: "wrong_dimensions", actual });
  }
  return Object.freeze({ ok: true, bytes: source, actual });
}

/** Validate selected-workflow final bytes without pushing workflow semantics to delivery. */
export function inspectPageImageFinalMedia({ workflow, finalBytes, rawSha256, finalSha256 } = {}) {
  const contract = FINAL_MEDIA_BY_WORKFLOW[workflow];
  if (!contract) return Object.freeze({ ok: false, code: "final_media_invalid" });
  const media = inspectExactPageImagePng(finalBytes, contract.png);
  if (!media.ok) return Object.freeze({ ok: false, code: "final_media_invalid", media });
  if (contract.requires_raw_byte_identity && rawSha256 !== finalSha256) {
    return Object.freeze({ ok: false, code: "pure_final_bytes_drifted" });
  }
  return Object.freeze({ ok: true, bytes: media.bytes, actual: media.actual });
}
