// Tests: openspec/specs/image-generation/spec.md
// Tests: openspec/specs/style-master-generation/spec.md
// Tests: openspec/specs/image2-lab/spec.md
// Tests: openspec/specs/pipeline-orchestration/spec.md
import { describe, expect, it } from "vitest";
import {
  normalizeImage2BaseUrl,
  resolveImage2Credentials,
} from "../../../ppt_maker_harness/scripts/shared/image2/credentials.mjs";
import {
  requireMatchingImage2RuntimeProfileId,
  resolveImage2RuntimeProfileId,
} from "../../../ppt_maker_harness/scripts/shared/image2/runtime_profile_id.mjs";

describe("shared Image2 credentials", () => {
  it("uses the current endpoint override precedence", () => {
    const env = { IMAGE2_API_KEY: "test-key", IMAGE2_BASE_URL: "https://env.example.test/v1/" };
    expect(resolveImage2Credentials({ env })).toEqual({ base_url: "https://env.example.test/v1", api_key: "test-key" });
    expect(resolveImage2Credentials({ extraBaseUrls: ["https://cli.example.test/v1/"], env }))
      .toEqual({ base_url: "https://cli.example.test/v1", api_key: "test-key" });
  });

  it("stays import-safe and reports configuration failures", () => {
    expect(() => resolveImage2Credentials({ env: { IMAGE2_BASE_URL: "https://env.example.test/v1" } })).toThrow(/IMAGE2_API_KEY is not set/);
    expect(() => resolveImage2Credentials({ env: { IMAGE2_API_KEY: "test-key" } })).toThrow(/No image API base URL/);
    expect(() => normalizeImage2BaseUrl("https://key:secret@example.test/v1")).toThrow(/must not contain credentials/);
  });

  it("rejects a comma-separated selected endpoint before any caller can fetch it", () => {
    const commaList = "https://first.example.test/v1,https://second.example.test/v1";
    expect(() => normalizeImage2BaseUrl(commaList)).toThrow(/one endpoint/i);
    expect(() => resolveImage2Credentials({
      env: { IMAGE2_API_KEY: "test-key", IMAGE2_BASE_URL: commaList },
    })).toThrow(/comma-separated/i);
    expect(() => resolveImage2Credentials({
      extraBaseUrls: [commaList],
      env: { IMAGE2_API_KEY: "test-key", IMAGE2_BASE_URL: "https://env.example.test/v1" },
    })).toThrow(/comma-separated/i);
  });

  it("keeps the non-secret runtime profile selector independent from credentials", () => {
    const runtimeOnly = { IMAGE2_PROVIDER_PROFILE_ID: "test-image2-profile" };
    expect(resolveImage2RuntimeProfileId({ env: runtimeOnly })).toBe("test-image2-profile");
    expect(requireMatchingImage2RuntimeProfileId({
      expectedProfileId: "test-image2-profile",
      env: runtimeOnly,
    })).toBe("test-image2-profile");

    const env = {
      ...runtimeOnly,
      IMAGE2_API_KEY: "test-key",
      IMAGE2_BASE_URL: "https://env.example.test/v1/",
    };
    expect(resolveImage2Credentials({ env, expectedProfileId: "test-image2-profile" })).toEqual({
      base_url: "https://env.example.test/v1",
      api_key: "test-key",
      profile_id: "test-image2-profile",
    });
    expect(() => resolveImage2Credentials({ env, expectedProfileId: "another-profile" }))
      .toThrow(/does not match/);
  });
});
