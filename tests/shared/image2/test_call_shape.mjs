import { describe, expect, it } from "vitest";

import {
  Image2CallShapeError,
  NAMED_DEFAULT_RESULT_PROTOCOL,
  NAMED_DEFAULT_TRANSPORT,
  RESULT_PROTOCOL_JSON_INLINE_B64,
  namedDefaultCallShapeValue,
  validateCallShapeValue,
} from "../../../ppt_maker_harness/scripts/shared/image2/call_shape.mjs";

const BASE = {
  model: "owner-model-page-image",
  prompt_budget: { limit: 12347, unit: "unicode-code-points" },
};

describe("Image2 Call Shape value", () => {
  it("makes omitted transport and result_protocol digest-identical to the named default", () => {
    const omitted = validateCallShapeValue(BASE);
    const explicit = validateCallShapeValue({
      ...BASE,
      transport: NAMED_DEFAULT_TRANSPORT,
      result_protocol: RESULT_PROTOCOL_JSON_INLINE_B64,
    });
    const named = namedDefaultCallShapeValue(BASE);
    expect(omitted.sha256).toBe(explicit.sha256);
    expect(omitted.value).toEqual(named);
    expect(omitted.value.result_protocol).toBe(NAMED_DEFAULT_RESULT_PROTOCOL);
    expect(omitted.value.transport).toEqual(NAMED_DEFAULT_TRANSPORT);
  });

  it("rejects illegal pairings, unknown fields, and unregistered dialects before fetch", () => {
    expect(() => validateCallShapeValue({
      ...BASE,
      transport: { ...NAMED_DEFAULT_TRANSPORT, http_operation: "edits", encoding: "json" },
    })).toThrow(Image2CallShapeError);
    expect(() => validateCallShapeValue({ ...BASE, packy_mode: true })).toThrow(/unknown field/);
    expect(() => validateCallShapeValue({ ...BASE, result_protocol: "raw-png-body" })).toThrow(/registered dialect/);
  });
});
