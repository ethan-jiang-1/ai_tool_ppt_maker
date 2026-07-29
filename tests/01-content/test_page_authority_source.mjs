import { describe, expect, it } from "vitest";
import {
  PageAuthoritySourceError,
  PAGE_AUTHORITY_SOURCE_V2_RECEIPT_SCHEMA,
  parsePageAuthoritySource,
} from "../../PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs";
import {
  PAGE_AUTHORITY_IMAGE2_PIPELINE,
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
  probeProductionMarker,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/production_marker.mjs";
import {
  createPageAuthorityVisualLanguageResolver,
  loadPageAuthorityVisualLanguage,
} from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_visual_language.mjs";

const registry = createPageAuthorityVisualLanguageResolver(
  loadPageAuthorityVisualLanguage("deck_ai_sdlc_keynote")
);

function visualBrief({
  recipe = "editorial-systems",
  composition = "centered-constellation",
  motifs = "[]",
  constraints = "\n  - no-readable-text\n  - no-labels",
} = {}) {
  return `**VISUAL BRIEF**:\n\`\`\`yaml\nrecipe: ${recipe}\ncomposition: ${composition}\nmotifs: ${motifs}\nnegative_constraints:${constraints}\n\`\`\`\n`;
}

function slide(number, id, body) {
  return `## Slide ${String(number).padStart(2, "0")}: \`${id}\`\n\n${body}\n`;
}

function source({ pipeline = PAGE_AUTHORITY_IMAGE2_PIPELINE, defaultAuthority = "framed-image2", workflow = "framed", slides } = {}) {
  const production = pipeline === PAGE_AUTHORITY_IMAGE2_V2_PIPELINE
    ? `  pipeline: ${pipeline}\n  workflow: ${workflow}`
    : `  pipeline: ${pipeline}\n  page_authority_default: ${defaultAuthority}`;
  return `---\nidentity:\n  scheme: mnemonic-v1\nproduction:\n${production}\n---\n\n${slides || slide(1, "DeckGo", `**TITLE**: Stable pixels\n${visualBrief()}`)}`;
}

function parse(text, options = {}) {
  return parsePageAuthoritySource(text, { registry, ...options });
}

function captureError(call) {
  try {
    call();
  } catch (error) {
    expect(error).toBeInstanceOf(PageAuthoritySourceError);
    return error;
  }
  throw new Error("expected PageAuthoritySourceError");
}

describe("Page Authority production marker", () => {
  it("recognizes only the new closed production mapping", () => {
    const result = probeProductionMarker(source());
    expect(result.branch).toBe(PAGE_AUTHORITY_IMAGE2_PIPELINE);

    for (const invalid of [
      source().replace("  page_authority_default: framed-image2\n", ""),
      source().replace("  page_authority_default: framed-image2", "  page_authority_default: html"),
      source().replace("  page_authority_default: framed-image2", "  page_authority_default: framed-image2\n  render: full-page"),
    ]) {
      expect(probeProductionMarker(invalid)).toMatchObject({ branch: "invalid" });
    }
  });

  it("recognizes the exact v2 workflow mapping and rejects hybrids", () => {
    const valid = source({ pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, workflow: "pure" });
    expect(probeProductionMarker(valid)).toMatchObject({
      branch: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
      frontmatter: { metadata: { production: { workflow: "pure" } } },
    });
    for (const invalid of [
      valid.replace("  workflow: pure\n", ""),
      valid.replace("  workflow: pure", "  workflow: pure\n  page_authority_default: framed-image2"),
      valid.replace("  workflow: pure", "  workflow: mixed"),
    ]) {
      expect(probeProductionMarker(invalid)).toMatchObject({ branch: "invalid" });
    }
  });
});

describe("parsePageAuthoritySource", () => {
  it("resolves per-slide authority and keeps the Framed text frame local", () => {
    const receipt = parse(source({
      slides: [
        slide(1, "DeckGo", `**KICKER**: Design decision\n**TITLE**: Stable pixels\n**SUBTITLE**: Image2 owns the visual body\n${visualBrief()}`),
        slide(2, "BodyMap", `**PAGE AUTHORITY**: pure-image2\n**TITLE**: Provider-owned title\n${visualBrief({ constraints: " [no-logo]" })}`),
      ].join("\n"),
    }), { source: "3_versions/v4/slide-specifications.md" });

    expect(receipt).toMatchObject({
      pipeline: PAGE_AUTHORITY_IMAGE2_PIPELINE,
      page_authority_default: "framed-image2",
    });
    expect(receipt.slides.map((item) => item.authority)).toEqual(["framed-image2", "pure-image2"]);
    expect(receipt.slides[0].text_frame).toEqual({
      preset: "standard-v1",
      kicker: "Design decision",
      title: "Stable pixels",
      subtitle: "Image2 owns the visual body",
      callout: null,
    });
    expect(receipt.slides[1].text_frame).toBeNull();
    expect(receipt.slides[0].diagnostic_spans["VISUAL BRIEF"]).toMatchObject({
      start_line: expect.any(Number),
      byte_start: expect.any(Number),
    });
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.slides[0])).toBe(true);
  });

  it("binds one v2 workflow into the receipt and rejects per-slide authority", () => {
    const target = source({
      pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
      workflow: "pure",
      slides: slide(1, "DeckGo", `**TITLE**: Provider-owned title\n${visualBrief({ constraints: " [no-logo]" })}`),
    });
    const receipt = parse(target);
    expect(receipt).toMatchObject({
      schema: PAGE_AUTHORITY_SOURCE_V2_RECEIPT_SCHEMA,
      pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
      workflow: "pure",
    });
    expect(receipt.slides).toEqual([expect.objectContaining({ slide_id: "DeckGo", workflow: "pure" })]);
    expect(receipt.slides[0]).not.toHaveProperty("authority");

    const error = captureError(() => parse(target.replace("**TITLE**", "**PAGE AUTHORITY**: framed-image2\n**TITLE**")));
    expect(error.issues).toContainEqual(expect.objectContaining({ code: "target_per_slide_authority_forbidden" }));

    const framed = source({ pipeline: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE, workflow: "framed" });
    const bodyError = captureError(() => parse(framed.replace("**TITLE**: Stable pixels", "**TITLE**: Stable pixels\n**BODY**: Semantic body text belongs to Pure")));
    expect(bodyError.issues).toContainEqual(expect.objectContaining({
      code: "framed_semantic_body_forbidden",
      repair_hint: expect.stringContaining("Structural Versioning Path"),
    }));
  });

  it("requires visual-config to resolve every registered visual selection", () => {
    const error = captureError(() => parsePageAuthoritySource(source()));
    expect(error.issues).toContainEqual(expect.objectContaining({
      code: "visual_language_registry_required",
      subject: expect.objectContaining({ field: "VISUAL BRIEF" }),
    }));
  });

  it("rejects legacy render and free-prompt ingress before returning a receipt", () => {
    for (const field of ["**RENDER MODE**: full-page", "**IMAGE PROMPT**: paint a diagram"]) {
      const error = captureError(() => parse(source({
        slides: slide(1, "DeckGo", `**TITLE**: Stable pixels\n${field}\n${visualBrief()}`),
      })));
      expect(error.issues).toContainEqual(expect.objectContaining({
        code: "legacy_page_authority_ingress",
        subject: expect.objectContaining({ field: field.match(/\*\*(.*?)\*\*/)[1] }),
      }));
    }

    const frontmatterError = captureError(() => parse(source().replace(
      "production:\n",
      "render:\n  default: full-page\nproduction:\n"
    )));
    expect(frontmatterError.issues).toContainEqual(expect.objectContaining({ code: "legacy_page_authority_ingress" }));
  });

  it("rejects non-closed visual brief forms at the field span", () => {
    const malformed = [
      visualBrief({ recipe: '"editorial-systems"' }),
      visualBrief().replace("composition: centered-constellation", "unknown: centered-constellation"),
      visualBrief().replace("recipe: editorial-systems", "recipe: &recipe editorial-systems\ncomposition: *recipe"),
      "**VISUAL BRIEF**: an editorial scene\n",
    ];
    for (const brief of malformed) {
      const error = captureError(() => parse(source({
        slides: slide(1, "DeckGo", `**TITLE**: Stable pixels\n${brief}`),
      })));
      expect(error.issues).toContainEqual(expect.objectContaining({
        source: expect.objectContaining({ path: "slide-specifications.md" }),
      }));
      expect(error.issues.some((item) => /visual_brief|VISUAL BRIEF/.test(item.code) || item.subject?.field === "VISUAL BRIEF")).toBe(true);
    }
  });

  it("rejects contradictions rather than changing text ownership", () => {
    const cases = [
      {
        body: `**PAGE AUTHORITY**: pure-image2\n**TITLE**: Image-owned title\n**FRAME PRESET**: standard-v1\n${visualBrief({ constraints: " [no-readable-text]" })}`,
        codes: ["pure_slide_frame_preset_forbidden", "pure_display_constraint_contradiction"],
      },
      {
        body: `**TITLE**: Stable pixels\n${visualBrief({ constraints: " [no-readable-text]" })}`,
        codes: ["missing_framed_negative_constraint"],
      },
      {
        body: `**TITLE**: Stable pixels\n**VISUAL IDENTITY**: amber-agent/guide\n**IDENTITY SUBJECT COUNT**: one\n**SUBJECT RESTRICTIONS**: no-identity-subject\n${visualBrief()}`,
        codes: ["identity_restriction_contradiction"],
      },
    ];
    for (const { body, codes } of cases) {
      const error = captureError(() => parse(source({ slides: slide(1, "DeckGo", body) })));
      expect(error.issues.map((item) => item.code)).toEqual(expect.arrayContaining(codes));
    }
  });
});
