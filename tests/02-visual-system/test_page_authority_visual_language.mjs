import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS,
  PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS,
  PAGE_AUTHORITY_TEXT_GUARD_DIGEST,
  PageAuthorityTextGuardError,
  PageAuthorityVisualLanguageError,
  createPageAuthorityVisualLanguageResolver,
  loadPageAuthorityVisualLanguage,
  normalizePageAuthorityTextGuard,
  parsePageAuthorityVisualLanguage,
  resolvePageAuthorityVisualLanguageSelection,
} from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_visual_language.mjs";
import {
  PageAuthoritySourceError,
  parsePageAuthoritySource,
} from "../../PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs";
import {
  FRAMED_TEXT_FRAME_STANDARD_V1,
  FramedTextFrameError,
  preflightFramedTextFrame,
  resolveFramedTextFramePreset,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs";
import {
  AMBER_AGENT_MODEL_SHEET_SHA256,
  PageAuthorityReferenceMaterialError,
  createPageAuthoritySourceResolver,
  parsePageAuthorityReferenceMaterial,
  resolvePageAuthorityIdentityReference,
} from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_reference_material.mjs";
import {
  PageAuthorityRawProfileError,
  buildPageAuthorityRawGenerationProfile,
  buildPageAuthorityRawImageContract,
  loadEffectiveStyleMasterByteProfile,
} from "../../PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/page-authority/raw_profiles.mjs";
import {
  canonicalPageAuthorityProviderPayload,
  compilePageAuthorityRawBatch,
} from "../../PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/page-authority/raw_compilation.mjs";

const deckDir = resolve("deck_ai_sdlc_keynote");
const registryPath = resolve(deckDir, "2_backbone/visual-style/page-authority-visual-language.yaml");

function selection(overrides = {}) {
  return {
    authority: "framed-image2",
    visual_brief: {
      recipe: "editorial-systems",
      composition: "centered-constellation",
      motifs: [],
      negative_constraints: ["no-readable-text", "no-labels"],
    },
    identity: null,
    ...overrides,
  };
}

function source(brief) {
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n  pipeline: page-authority-image2-v1\n  page_authority_default: framed-image2\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: Stable pixels\n**VISUAL BRIEF**:\n\`\`\`yaml\n${brief}\`\`\`\n`;
}

function captureError(call, ErrorType) {
  try {
    call();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorType);
    return error;
  }
  throw new Error("expected an error");
}

describe("page-authority-text-guard-v1", () => {
  it("normalizes safe clauses and exposes one stable guard digest", () => {
    expect(normalizePageAuthorityTextGuard("Warm Amber Light Form")).toBe("warm amber light form");
    expect(PAGE_AUTHORITY_TEXT_GUARD_DIGEST).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects exact forbidden tokens, pairs, quotations, escapes, non-ASCII, and malformed spaces", () => {
    const cases = [
      ["a readable scene", "forbidden_token"],
      ["speech bubble beside a form", "forbidden_token_pair"],
      ['a "quiet" scene', "invalid_character"],
      ["a\\nquiet scene", "invalid_character"],
      ["a calm 图 scene", "non_printable_ascii"],
      [" a calm scene", "invalid_space"],
      ["a  calm scene", "invalid_space"],
    ];
    for (const [value, code] of cases) {
      const error = captureError(() => normalizePageAuthorityTextGuard(value), PageAuthorityTextGuardError);
      expect(error.code).toBe(code);
    }
    for (const token of PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS) {
      expect(() => normalizePageAuthorityTextGuard(`calm ${token} field`)).toThrow(PageAuthorityTextGuardError);
    }
    for (const pair of PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS) {
      expect(() => normalizePageAuthorityTextGuard(`calm ${pair.join(" ")} field`)).toThrow(PageAuthorityTextGuardError);
    }
  });
});

describe("Page Authority visual language registry", () => {
  it("loads only the deck-backbone registry and resolves a trusted selection", () => {
    const registry = loadPageAuthorityVisualLanguage(deckDir);
    const resolved = resolvePageAuthorityVisualLanguageSelection(registry, selection());
    expect(resolved).toMatchObject({
      projection: {
        recipe: { id: "editorial-systems" },
        composition: { id: "centered-constellation" },
        motifs: [],
        selected_identity_subject_class: "none",
      },
      provider_clauses: {
        recipe: expect.any(String),
        composition: expect.any(String),
      },
    });
    expect(resolved.projection.registry_semantic_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.isFrozen(registry)).toBe(true);
  });

  it("rejects unregistered and incompatible source selections before any compilation", () => {
    const registry = loadPageAuthorityVisualLanguage(deckDir);
    for (const context of [
      selection({ visual_brief: { ...selection().visual_brief, recipe: "unknown-recipe" } }),
      selection({ visual_brief: { ...selection().visual_brief, motifs: ["shared-work-surface"] } }),
      selection({ visual_brief: { ...selection().visual_brief, motifs: ["connected-nodes", "soft-grid", "layered-pathways", "connected-nodes"] } }),
    ]) {
      expect(() => resolvePageAuthorityVisualLanguageSelection(registry, context)).toThrow(PageAuthorityVisualLanguageError);
    }
  });

  it("keeps unselected records and revision out of a selected slide digest", () => {
    const raw = readFileSync(registryPath, "utf8");
    const base = parsePageAuthorityVisualLanguage(raw);
    const changedUnselected = parsePageAuthorityVisualLanguage(raw
      .replace("revision: 1", "revision: 2")
      .replace("grounded work surface with calm depth and soft perspective", "grounded collaborative field with calm depth and soft perspective"));
    const changedSelected = parsePageAuthorityVisualLanguage(raw.replace(
      "architectural editorial scene, layered amber and cobalt light, quiet depth",
      "architectural editorial scene, measured amber and cobalt light, quiet depth"
    ));
    const resolveDigest = (registry) => resolvePageAuthorityVisualLanguageSelection(registry, selection()).projection.registry_semantic_digest;
    expect(resolveDigest(changedUnselected)).toBe(resolveDigest(base));
    expect(resolveDigest(changedSelected)).not.toBe(resolveDigest(base));
  });

  it("rejects quoted clauses, YAML indirection, and one-sided motif compatibility", () => {
    const raw = readFileSync(registryPath, "utf8");
    const invalids = [
      raw.replace("provider_clause: architectural", "provider_clause: \"architectural"),
      raw.replace("recipe_ids: [editorial-systems, collaborative-work]", "recipe_ids: [collaborative-work]"),
      raw.replace("motif_ids: [connected-nodes, layered-pathways, soft-grid]", "motif_ids: [connected-nodes, &motif layered-pathways, *motif]"),
    ];
    for (const invalid of invalids) {
      expect(() => parsePageAuthorityVisualLanguage(invalid)).toThrow(PageAuthorityVisualLanguageError);
    }
  });

  it("makes unregistered IDs fail at the Page Authority source field when a resolver is supplied", () => {
    const registry = loadPageAuthorityVisualLanguage(deckDir);
    const error = captureError(() => parsePageAuthoritySource(source(`recipe: missing-recipe
composition: centered-constellation
motifs: []
negative_constraints: [no-readable-text, no-labels]
`), {
      registry: createPageAuthorityVisualLanguageResolver(registry),
    }), PageAuthoritySourceError);
    expect(error.issues).toContainEqual(expect.objectContaining({
      code: "unregistered_visual_recipe",
      subject: expect.objectContaining({ field: "VISUAL BRIEF" }),
    }));
  });
});

describe("standard-v1 Framed Text Frame", () => {
  it("has one fixed capture profile and deterministic fit evidence", () => {
    expect(resolveFramedTextFramePreset()).toBe(FRAMED_TEXT_FRAME_STANDARD_V1);
    expect(FRAMED_TEXT_FRAME_STANDARD_V1.canvas).toEqual({
      css_width: 1000,
      css_height: 562.5,
      capture_width: 2000,
      capture_height: 1125,
    });
    const frame = {
      preset: "standard-v1",
      kicker: "Design decision",
      title: "Fixed text authority",
      subtitle: "Image2 owns the text-free visual body",
      callout: "A local refresh changes no provider pixels",
    };
    const first = preflightFramedTextFrame(frame);
    const second = preflightFramedTextFrame(frame);
    expect(first).toMatchObject({ ok: true, authorization_allowed: true });
    expect(first.evidence.variant).toBe("callout_present");
    expect(first.evidence.preflight_digest).toBe(second.evidence.preflight_digest);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("blocks raw authorization when frame text overflows or callers inject rendering controls", () => {
    const overflow = preflightFramedTextFrame({
      preset: "standard-v1",
      kicker: null,
      title: "W".repeat(120),
      subtitle: null,
      callout: null,
    });
    expect(overflow).toMatchObject({
      ok: false,
      authorization_allowed: false,
      repair: { action: "shorten-text-frame" },
    });
    expect(overflow.repair.failures).toContainEqual(expect.objectContaining({ field: "title", code: "text_frame_overflow" }));
    expect(() => preflightFramedTextFrame({
      preset: "standard-v1",
      title: "Valid title",
      kicker: null,
      subtitle: null,
      callout: null,
      css: "position:absolute",
    })).toThrow(FramedTextFrameError);
  });
});

describe("Page Authority Image2 reference material", () => {
  const referenceDir = resolve(deckDir, "2_backbone/visual-style/assets/reference/amber-agent");
  const referenceRegistryPath = join(referenceDir, "image2-reference-material.yaml");

  it("promotes the verified doctrine sheet but resolves only clean provider roles", () => {
    expect(createHash("sha256").update(readFileSync(join(referenceDir, "model-sheet.png"))).digest("hex")).toBe(AMBER_AGENT_MODEL_SHEET_SHA256);
    const resolved = resolvePageAuthorityIdentityReference({
      deckDir,
      identity: { profile: "amber-agent", role: "guide" },
      identity_subject_count: "one",
      subject_restrictions: "no-generic-metal-robot",
    });
    expect(resolved.projection).toMatchObject({
      profile: "amber-agent",
      role: "guide",
      subject_class: "amber-light-form",
      identity_subject_count: "one",
    });
    expect(resolved.projection).not.toHaveProperty("path");
    expect(resolved.provider_reference.path).toMatch(/assets\/reference\/amber-agent\/guide\.png$/);
  });

  it("rejects model-sheet selection, invalid role paths, and incompatible restrictions", () => {
    const registry = readFileSync(referenceRegistryPath, "utf8");
    for (const invalid of [
      registry.replace("reference_path: guide.png", "reference_path: model-sheet.png"),
      registry.replace("reference_path: guide.png", "reference_path: ../../asset-manifest.yaml"),
    ]) {
      expect(() => parsePageAuthorityReferenceMaterial(invalid, { expectedProfile: "amber-agent" })).toThrow(PageAuthorityReferenceMaterialError);
    }
    expect(() => resolvePageAuthorityIdentityReference({
      deckDir,
      identity: { profile: "amber-agent", role: "model-sheet" },
      identity_subject_count: "one",
      subject_restrictions: "none",
    })).toThrow(PageAuthorityReferenceMaterialError);
    expect(() => resolvePageAuthorityIdentityReference({
      deckDir,
      identity: { profile: "amber-agent", role: "guide" },
      identity_subject_count: "one",
      subject_restrictions: "no-identity-subject",
    })).toThrow(PageAuthorityReferenceMaterialError);
  });

  it("hard-stops on role checksum drift and resolves identity before visual language", () => {
    const temp = mkdtempSync(join(tmpdir(), "page-authority-reference-"));
    try {
      const tempProfile = join(temp, "2_backbone/visual-style/assets/reference/amber-agent");
      mkdirSync(tempProfile, { recursive: true });
      for (const file of ["model-sheet.png", "guide.png", "collaborating.png", "image2-reference-material.yaml"]) {
        copyFileSync(join(referenceDir, file), join(tempProfile, file));
      }
      writeFileSync(join(tempProfile, "guide.png"), "drift", "utf8");
      expect(() => resolvePageAuthorityIdentityReference({
        deckDir: temp,
        identity: { profile: "amber-agent", role: "guide" },
        identity_subject_count: "one",
        subject_restrictions: "none",
      })).toThrow(PageAuthorityReferenceMaterialError);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }

    const sourceReceipt = parsePageAuthoritySource(source(`recipe: collaborative-work
composition: centered-constellation
motifs: []
negative_constraints: [no-readable-text, no-labels]
`).replace("**TITLE**: Stable pixels", "**TITLE**: Stable pixels\n**VISUAL IDENTITY**: amber-agent/guide\n**IDENTITY SUBJECT COUNT**: one\n**SUBJECT RESTRICTIONS**: none"), {
      registry: createPageAuthoritySourceResolver({ deckDir, visualLanguage: loadPageAuthorityVisualLanguage(deckDir) }),
    });
    expect(sourceReceipt.slides[0].visual_language.identity_reference.projection.role).toBe("guide");
  });
});

describe("Page Authority raw identity profiles", () => {
  const sourceResolver = () => createPageAuthoritySourceResolver({
    deckDir,
    visualLanguage: loadPageAuthorityVisualLanguage(deckDir),
  });
  const framedSource = (title) => source(`recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints: [no-readable-text, no-labels]
`).replace("**TITLE**: Stable pixels", `**TITLE**: ${title}`);

  it("keeps Framed display literals out of raw image identity", () => {
    const first = parsePageAuthoritySource(framedSource("Stable local title"), { registry: sourceResolver() }).slides[0];
    const second = parsePageAuthoritySource(framedSource("A different local title"), { registry: sourceResolver() }).slides[0];
    const firstContract = buildPageAuthorityRawImageContract({ slide: first });
    const secondContract = buildPageAuthorityRawImageContract({ slide: second });
    expect(firstContract.raw_image_contract_digest).toBe(secondContract.raw_image_contract_digest);
    expect(JSON.stringify(firstContract.contract)).not.toContain("Stable local title");
    expect(firstContract.contract).toMatchObject({ authority: "framed-image2", framed: { preset: "standard-v1" } });
  });

  it("makes Pure the explicit valid choice for readable provider-owned body semantics", () => {
    const pure = parsePageAuthoritySource(source(`recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints: [no-logo]
`).replace("page_authority_default: framed-image2", "page_authority_default: pure-image2").replace("**TITLE**: Stable pixels", "**TITLE**: A readable provider-owned claim\n**CALLOUT**: Body labels and values belong to Image2"), {
      registry: sourceResolver(),
    }).slides[0];
    const contract = buildPageAuthorityRawImageContract({ slide: pure });
    expect(pure.authority).toBe("pure-image2");
    expect(contract.contract.display).toEqual({
      kicker: null,
      title: "A readable provider-owned claim",
      subtitle: null,
      callout: "Body labels and values belong to Image2",
    });
  });

  it("binds effective style-master bytes to provider profile, not source contract", () => {
    const slide = parsePageAuthoritySource(framedSource("Stable local title"), { registry: sourceResolver() }).slides[0];
    const raw = buildPageAuthorityRawImageContract({ slide });
    const args = {
      provider: { provider: "image2", model: "image-2", api_revision: "2026-07-01" },
      output: { format: "png", width: 2000, height: 1125 },
      reference_transport: { style_master: "image-reference-v1", identity_reference: "none" },
    };
    const original = buildPageAuthorityRawGenerationProfile({ ...args, style_master_bytes: Buffer.from("style-master-a") });
    const changed = buildPageAuthorityRawGenerationProfile({ ...args, style_master_bytes: Buffer.from("style-master-b") });
    expect(original.raw_generation_profile_digest).not.toBe(changed.raw_generation_profile_digest);
    expect(raw.raw_image_contract_digest).toBe(buildPageAuthorityRawImageContract({ slide }).raw_image_contract_digest);
    expect(JSON.stringify(original.profile)).not.toContain("Stable local title");
    expect(JSON.stringify(raw.contract)).not.toContain("image-2");
    expect(loadEffectiveStyleMasterByteProfile(deckDir)).toMatchObject({ sha256: expect.stringMatching(/^[a-f0-9]{64}$/), bytes: expect.any(Number) });
  });

  it("requires a fitting Framed preflight and rejects unclosed provider profiles", () => {
    const overflowSlide = parsePageAuthoritySource(framedSource("W".repeat(120)), { registry: sourceResolver() }).slides[0];
    expect(() => buildPageAuthorityRawImageContract({ slide: overflowSlide })).toThrow(PageAuthorityRawProfileError);
    expect(() => buildPageAuthorityRawGenerationProfile({
      provider: { provider: "image2", model: "image-2", api_revision: "2026-07-01" },
      output: { format: "jpeg", width: 2000, height: 1125 },
      reference_transport: { style_master: "image-reference-v1", identity_reference: "none" },
      style_master_bytes: Buffer.from("style-master"),
    })).toThrow(PageAuthorityRawProfileError);
  });

  it("compiles receipt-only Framed provider payloads without Text Frame literals", () => {
    const title = "Stable local title";
    const receipt = parsePageAuthoritySource(framedSource(title), { registry: sourceResolver() });
    const generation_profile = buildPageAuthorityRawGenerationProfile({
      provider: { provider: "image2", model: "image-2", api_revision: "2026-07-01" },
      output: { format: "png", width: 2000, height: 1125 },
      reference_transport: { style_master: "image-reference-v1", identity_reference: "none" },
      style_master_bytes: Buffer.from("style-master"),
    });
    const batch = compilePageAuthorityRawBatch({ receipt, generation_profile });
    const payload = canonicalPageAuthorityProviderPayload(batch.requests[0]);
    expect(batch).toMatchObject({
      source_sha256: receipt.source_sha256,
      raw_generation_profile_digest: generation_profile.raw_generation_profile_digest,
      requests: [{ authority: "framed-image2" }],
    });
    expect(payload).not.toContain(title);
    expect(payload).toContain("no-readable-text");
    expect(payload).toContain("no-labels");
  });
});
