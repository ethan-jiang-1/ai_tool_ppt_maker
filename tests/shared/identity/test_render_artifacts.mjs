import { describe, expect, it } from "vitest";
import { sha256Bytes } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";
import {
  ARTIFACT_KIND_FINAL_SLIDE,
  finalSlideFingerprintV1,
  normalizeFinalSlideRecord,
  verifyCallerSuppliedBytes,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/identity/render_artifacts.mjs";

const bytes = Buffer.from("provider-neutral final slide");
const byteSha256 = sha256Bytes(bytes);
const producerPrivateFingerprint = "a".repeat(64);

describe("provider-neutral final-slide identity", () => {
  it("verifies caller-supplied bytes without filesystem discovery", () => {
    expect(verifyCallerSuppliedBytes({ bytes, declaredSha256: byteSha256 })).toBe(byteSha256);
    expect(() => verifyCallerSuppliedBytes({ bytes, declaredSha256: "b".repeat(64) })).toThrow(/SHA-256/);
  });

  it("normalizes the same final-slide record and rejects fingerprint drift", () => {
    const fingerprint = finalSlideFingerprintV1({
      producer: "test-producer-v1", producerPrivateFingerprint, byteSha256,
      width: 2000, height: 1125, mediaProfile: "test-media-v1",
    });
    expect(normalizeFinalSlideRecord({
      slideId: "UXGap", producer: "test-producer-v1", producerPrivateFingerprint,
      byteSha256, width: 2000, height: 1125, mediaProfile: "test-media-v1",
      declaredFingerprint: fingerprint, path: "objects/example.png",
    })).toEqual({
      slide_id: "UXGap", artifact_kind: ARTIFACT_KIND_FINAL_SLIDE, producer: "test-producer-v1",
      final_slide_fingerprint: fingerprint, path: "objects/example.png", sha256: byteSha256,
      width: 2000, height: 1125, media_profile: "test-media-v1",
    });
    expect(() => normalizeFinalSlideRecord({
      slideId: "UXGap", producer: "test-producer-v1", producerPrivateFingerprint,
      byteSha256, width: 2000, height: 1125, mediaProfile: "test-media-v1",
      declaredFingerprint: "c".repeat(64), path: "objects/example.png",
    })).toThrow(/fingerprint drifted/);
  });
});
