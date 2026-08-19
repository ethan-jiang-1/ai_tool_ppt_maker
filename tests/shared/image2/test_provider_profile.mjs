import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_PAGE_IMAGE_TRANSPORT,
  IMAGE2_PROMPT_BUDGET_UNITS,
  IMAGE2_PROVIDER_PROMPT_SAFETY_MAX_UTF8_BYTES,
  Image2PromptBudgetError,
  Image2ProviderProfileError,
  evaluateImage2PromptBudget,
  resolveImage2ProviderProfile,
  selectImage2ProviderOperation,
} from "../../../ppt_maker_harness/scripts/shared/image2/provider_profile.mjs";
import {
  isImage2ProviderProfileId,
  requireMatchingImage2RuntimeProfileId,
  resolveImage2RuntimeProfileId,
} from "../../../ppt_maker_harness/scripts/shared/image2/runtime_profile_id.mjs";
import {
  IMAGE2_PROVIDER_PROFILE_FILE,
  checkBundle,
  createVersion,
  image2ProviderProfileAsset,
  image2ProviderProfileOverrideAsset,
  initBundle,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

const PENDING_SOURCE = [
  "schema: pptmaker-image2-provider-profile",
  "profile_id: null",
  "endpoint_profile: null",
  "owner_declaration:",
  "  authority: deck-author",
  "  status: pending",
  "operations:",
  "  style-master-text-generation: null",
  "  page-image-reference-generation: null",
  "",
].join("\n");

function confirmedSource({
  profileId = "image2-production",
  pageLimit = 12347,
  pageUnit = "unicode-code-points",
  pageTransport = null,
  styleMasterTransport = false,
} = {}) {
  const pageTransportYaml = pageTransport
    ? [
        "    transport:",
        `      http_operation: ${pageTransport.http_operation}`,
        `      encoding: ${pageTransport.encoding}`,
        `      width: ${pageTransport.width}`,
        `      height: ${pageTransport.height}`,
        `      dimension_multiple: ${pageTransport.dimension_multiple}`,
        `      completion: ${pageTransport.completion}`,
      ]
    : [];
  const styleTransportYaml = styleMasterTransport
    ? [
        "    transport:",
        "      http_operation: generations",
        "      encoding: json",
        "      width: 2000",
        "      height: 1125",
        "      dimension_multiple: 1",
        "      completion: async-poll",
      ]
    : [];
  return [
    "schema: pptmaker-image2-provider-profile",
    `profile_id: ${profileId}`,
    "endpoint_profile: primary-image-endpoint",
    "owner_declaration:",
    "  authority: deck-author",
    "  status: confirmed",
    "operations:",
    "  style-master-text-generation:",
    "    route_id: style-master-route",
    "    model: owner-model-style-master",
    "    prompt_budget:",
    "      limit: 4000",
    "      unit: utf8-bytes",
    ...styleTransportYaml,
    "  page-image-reference-generation:",
    "    route_id: page-image-route",
    "    model: owner-model-page-image",
    "    prompt_budget:",
    `      limit: ${pageLimit}`,
    `      unit: ${pageUnit}`,
    ...pageTransportYaml,
    "",
  ].join("\n");
}

function temporaryBundle() {
  const root = mkdtempSync(join(tmpdir(), "image2-provider-profile-"));
  const deck = join(root, "deck_profile");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir: join(deck, "3_versions", "v1") };
}

function expectProfileFailure(run, code) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(Image2ProviderProfileError);
    expect(error.code).toBe(code);
    return error;
  }
  throw new Error(`expected Image2 provider profile failure ${code}`);
}

function expectSafeProfileFailure(run, code, prohibited = []) {
  const error = expectProfileFailure(run, code);
  const diagnostic = JSON.stringify(error);
  for (const value of prohibited) expect(diagnostic).not.toContain(value);
  return error;
}

describe("Image2 provider profile", () => {
  it("seeds a pending source and never gives it a partial binding", () => {
    const fixture = temporaryBundle();
    try {
      const source = image2ProviderProfileAsset(fixture.runDir);
      expect(readFileSync(source, "utf8")).toBe(PENDING_SOURCE);
      const error = expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_pending");
      expect(error.source).toBe(`2_backbone/visual-style/${IMAGE2_PROVIDER_PROFILE_FILE}`);
      expect(error).not.toHaveProperty("profile_sha256");
      expect(checkBundle(fixture.runDir, false)).toHaveLength(1);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("resolves one path-free confirmed profile and its two explicit operations", () => {
    const fixture = temporaryBundle();
    try {
      writeFileSync(image2ProviderProfileAsset(fixture.runDir), confirmedSource(), "utf8");
      const profile = resolveImage2ProviderProfile(fixture.runDir);
      const page = selectImage2ProviderOperation(profile, "page-image-reference-generation");
      const style = selectImage2ProviderOperation(profile, "style-master-text-generation");

      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile).toMatchObject({
        profile_id: "image2-production",
        endpoint_profile: "primary-image-endpoint",
        operations: {
          "page-image-reference-generation": {
            route_id: "page-image-route",
            model: "owner-model-page-image",
            prompt_budget: { limit: 12347, unit: "unicode-code-points" },
          },
        },
      });
      expect(profile.profile_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(profile)).not.toContain(fixture.root);
      expect(page).toEqual({
        profile_id: "image2-production",
        profile_sha256: profile.profile_sha256,
        endpoint_profile: "primary-image-endpoint",
        route_id: "page-image-route",
        operation: "page-image-reference-generation",
        model: "owner-model-page-image",
        prompt_budget: { limit: 12347, unit: "unicode-code-points" },
        transport: DEFAULT_PAGE_IMAGE_TRANSPORT,
      });
      expect(style.model).toBe("owner-model-style-master");
      expect(style).not.toHaveProperty("transport");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("selects an invalid override without falling back to its confirmed backbone", () => {
    const fixture = temporaryBundle();
    try {
      writeFileSync(image2ProviderProfileAsset(fixture.runDir), confirmedSource(), "utf8");
      const override = image2ProviderProfileOverrideAsset(fixture.runDir);
      mkdirSync(join(override, ".."), { recursive: true });
      writeFileSync(override, "profile_id: secret-source-prose\n", "utf8");

      const error = expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_shape_invalid");
      expect(error.source).toBe(`3_versions/v1/overrides/visual-style/${IMAGE2_PROVIDER_PROFILE_FILE}`);
      expect(JSON.stringify(error)).not.toContain("secret-source-prose");
      expect(JSON.stringify(error)).not.toContain("owner-model-page-image");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects malformed, mixed, unsafe, and unavailable sources before any lifecycle write", () => {
    const fixture = temporaryBundle();
    try {
      const source = image2ProviderProfileAsset(fixture.runDir);
      const state = join(fixture.deck, "_state", "state.yaml");
      const stateBefore = readFileSync(state);
      const malformed = [
        "schema: pptmaker-image2-provider-profile",
        "profile_id: profile-a",
        "endpoint_profile: endpoint-a",
        "owner_declaration: { authority: deck-author, status: confirmed }",
        "operations:",
        "  style-master-text-generation: null",
        "  page-image-reference-generation: null",
        "",
      ].join("\n");
      writeFileSync(source, malformed, "utf8");
      expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_shape_invalid");

      writeFileSync(source, "schema: &profile pptmaker-image2-provider-profile\n", "utf8");
      expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_yaml_invalid");

      rmSync(source);
      expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_missing");

      writeFileSync(source, confirmedSource(), "utf8");
      const escaped = join(fixture.root, "escaped-profile.yaml");
      writeFileSync(escaped, confirmedSource({ profileId: "escaped-profile" }), "utf8");
      rmSync(source);
      symlinkSync(escaped, source);
      expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_unsafe");
      expect(readFileSync(state)).toEqual(stateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects direct-YAML escape hatches and exact-shape drift without exposing source prose", () => {
    const fixture = temporaryBundle();
    try {
      const source = image2ProviderProfileAsset(fixture.runDir);
      const state = join(fixture.deck, "_state", "state.yaml");
      const stateBefore = readFileSync(state);
      const secret = "source-secret-not-for-diagnostics";
      const baseUrl = "https://private.example.test/v1";
      const cases = [
        {
          code: "image2_provider_profile_utf8_invalid",
          bytes: Buffer.from([0xff, 0xfe, 0x00]),
        },
        {
          code: "image2_provider_profile_yaml_invalid",
          bytes: Buffer.from(`schema: ${secret}\nschema: duplicate\n`),
        },
        {
          code: "image2_provider_profile_yaml_invalid",
          bytes: Buffer.from(`schema: !secret ${secret}\n`),
        },
        {
          code: "image2_provider_profile_yaml_invalid",
          bytes: Buffer.from([
            "defaults: &profile",
            `  model: ${secret}`,
            "schema: pptmaker-image2-provider-profile",
            "<<: *profile",
            "",
          ].join("\n")),
        },
        {
          code: "image2_provider_profile_shape_invalid",
          bytes: Buffer.from(confirmedSource().replace("endpoint_profile: primary-image-endpoint", `endpoint_profile: primary-image-endpoint\nbase_url: ${baseUrl}`)),
        },
        {
          code: "image2_provider_profile_shape_invalid",
          bytes: Buffer.from(confirmedSource().replace("page-image-reference-generation:", "unknown-provider-operation:")),
        },
        {
          code: "image2_provider_profile_shape_invalid",
          bytes: Buffer.from(confirmedSource({ pageUnit: "token-estimate" })),
        },
      ];
      for (const testCase of cases) {
        writeFileSync(source, testCase.bytes);
        expectSafeProfileFailure(
          () => resolveImage2ProviderProfile(fixture.runDir),
          testCase.code,
          [secret, baseUrl, "owner-model-page-image"],
        );
        expect(readFileSync(state)).toEqual(stateBefore);
      }

      writeFileSync(source, confirmedSource(), "utf8");
      expect(resolveImage2ProviderProfile(fixture.runDir).profile_id).toBe("image2-production");
      expect(readFileSync(state)).toEqual(stateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("copies only the ordinary profile override into a clean successor", () => {
    const fixture = temporaryBundle();
    try {
      const override = image2ProviderProfileOverrideAsset(fixture.runDir);
      mkdirSync(join(override, ".."), { recursive: true });
      writeFileSync(override, confirmedSource({ profileId: "version-specific" }), "utf8");
      const successor = createVersion(fixture.runDir, "v2");
      expect(readFileSync(join(successor, "overrides", "visual-style", IMAGE2_PROVIDER_PROFILE_FILE), "utf8"))
        .toBe(confirmedSource({ profileId: "version-specific" }));
      expect(existsSync(join(successor, "_generated", "page_image_workflow", "raw", "plan-manifest.json"))).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("resolves omitted page-image transport to the current generations default", () => {
    const fixture = temporaryBundle();
    try {
      writeFileSync(image2ProviderProfileAsset(fixture.runDir), confirmedSource(), "utf8");
      const omitted = resolveImage2ProviderProfile(fixture.runDir);
      writeFileSync(
        image2ProviderProfileAsset(fixture.runDir),
        confirmedSource({ pageTransport: DEFAULT_PAGE_IMAGE_TRANSPORT }),
        "utf8",
      );
      const explicit = resolveImage2ProviderProfile(fixture.runDir);
      expect(omitted.operations["page-image-reference-generation"].transport).toEqual(DEFAULT_PAGE_IMAGE_TRANSPORT);
      expect(explicit.profile_sha256).toBe(omitted.profile_sha256);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects illegal page-image transport before a binding", () => {
    const fixture = temporaryBundle();
    try {
      const source = image2ProviderProfileAsset(fixture.runDir);
      const illegal = [
        { http_operation: "edits", encoding: "json", width: 2000, height: 1125, dimension_multiple: 1, completion: "async-poll" },
        { http_operation: "generations", encoding: "multipart", width: 2000, height: 1125, dimension_multiple: 1, completion: "async-poll" },
        { http_operation: "generations", encoding: "json", width: 2000, height: 1125, dimension_multiple: 16, completion: "async-poll" },
      ];
      for (const pageTransport of illegal) {
        writeFileSync(source, confirmedSource({ pageTransport }), "utf8");
        expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_shape_invalid");
      }
      writeFileSync(source, confirmedSource({ styleMasterTransport: true }), "utf8");
      expectProfileFailure(() => resolveImage2ProviderProfile(fixture.runDir), "image2_provider_profile_shape_invalid");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

describe("Image2 runtime profile identity", () => {
  it("accepts only lower-kebab non-secret selector IDs and exact matches", () => {
    for (const value of ["profile", "image2-production", "v2-route9"]) expect(isImage2ProviderProfileId(value)).toBe(true);
    for (const value of ["", "Image2", "image2_1", "image2-", " image2"]) expect(isImage2ProviderProfileId(value)).toBe(false);
    expect(resolveImage2RuntimeProfileId({ env: { IMAGE2_PROVIDER_PROFILE_ID: "image2-production" } })).toBe("image2-production");
    expect(requireMatchingImage2RuntimeProfileId({
      expectedProfileId: "image2-production",
      env: { IMAGE2_PROVIDER_PROFILE_ID: "image2-production" },
    })).toBe("image2-production");
    expect(() => requireMatchingImage2RuntimeProfileId({
      expectedProfileId: "image2-production",
      env: { IMAGE2_PROVIDER_PROFILE_ID: "other-profile" },
    })).toThrow(/does not match/);
  });
});

describe("Image2 final-prompt budget", () => {
  function operationProfile(unit, limit) {
    return {
      operation: "page-image-reference-generation",
      prompt_budget: { unit, limit },
    };
  }

  it("measures all exact supported units including CJK and BMP/non-BMP emoji", () => {
    const prompt = "A中☺😀";
    const expected = {
      "utf8-bytes": Buffer.byteLength(prompt, "utf8"),
      "utf16-code-units": prompt.length,
      "unicode-code-points": Array.from(prompt).length,
    };
    expect(IMAGE2_PROMPT_BUDGET_UNITS).toEqual(["unicode-code-points", "utf16-code-units", "utf8-bytes"]);
    for (const unit of IMAGE2_PROMPT_BUDGET_UNITS) {
      const result = evaluateImage2PromptBudget({ prompt, operationProfile: operationProfile(unit, expected[unit]) });
      expect(result.measurement).toEqual({
        operation: "page-image-reference-generation",
        limit: expected[unit],
        unit,
        measured: expected[unit],
      });
    }
  });

  it("uses arbitrary exact boundaries with no provider-specific numeric branch", () => {
    for (const limit of [4000, 16000, 12347]) {
      const prompt = "a".repeat(limit);
      expect(evaluateImage2PromptBudget({ prompt, operationProfile: operationProfile("unicode-code-points", limit) }).measurement.measured)
        .toBe(limit);
      try {
        evaluateImage2PromptBudget({ prompt: `${prompt}a`, operationProfile: operationProfile("unicode-code-points", limit) });
        throw new Error("expected one-over budget failure");
      } catch (error) {
        expect(error).toBeInstanceOf(Image2PromptBudgetError);
        expect(error.code).toBe("image2_prompt_budget_overflow");
        expect(error.measurement).toMatchObject({ limit, measured: limit + 1, unit: "unicode-code-points" });
      }
    }
  });

  it("retains the independent 32,768 UTF-8 byte safety ceiling", () => {
    const prompt = "a".repeat(IMAGE2_PROVIDER_PROMPT_SAFETY_MAX_UTF8_BYTES + 1);
    expect(() => evaluateImage2PromptBudget({
      prompt,
      operationProfile: operationProfile("utf8-bytes", prompt.length + 1),
    })).toThrow(/safety ceiling/);
  });

  it("rejects malformed final bytes and invalid budget facts before measurement", () => {
    const malformedBytes = () => evaluateImage2PromptBudget({
      prompt: Buffer.from([0xff]),
      operationProfile: operationProfile("utf8-bytes", 1),
    });
    const invalidUnit = () => evaluateImage2PromptBudget({
      prompt: "valid",
      operationProfile: operationProfile("chars", 5),
    });
    const invalidLimit = () => evaluateImage2PromptBudget({
      prompt: "valid",
      operationProfile: operationProfile("utf8-bytes", 0),
    });
    for (const [run, code] of [
      [malformedBytes, "image2_prompt_utf8_invalid"],
      [invalidUnit, "image2_prompt_budget_invalid"],
      [invalidLimit, "image2_prompt_budget_invalid"],
    ]) {
      try {
        run();
      } catch (error) {
        expect(error).toBeInstanceOf(Image2PromptBudgetError);
        expect(error.code).toBe(code);
        continue;
      }
      throw new Error(`expected ${code}`);
    }
  });
});
