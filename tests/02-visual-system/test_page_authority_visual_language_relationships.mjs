import { describe, expect, it } from "vitest";

import {
  PageAuthorityVisualLanguageError,
  createPageAuthorityVisualLanguageResolver,
  parsePageAuthorityVisualLanguage,
  resolvePageAuthorityVisualLanguageSelection,
} from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/index.mjs";
import {
  PageAuthoritySourceError,
  parsePageAuthoritySource,
} from "../../PPTMAKER_FRAMEWORK/scripts/01-content/index.mjs";

const RELATIONSHIP_CLAUSES = `relationships:
  layer-stack:
    provider_clause: nested translucent planes rising from broad base to focused apex
    authorities: [pure-image2, framed-image2]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: bottom-to-top
  causal-flow:
    provider_clause: connected luminous forms progressing from left origin to right outcome
    authorities: [pure-image2, framed-image2]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: left-to-right
`;

function registrySource({ relationships = true } = {}) {
  return `schema: pptmaker-page-authority-visual-language-v1
revision: 1
text_guard: page-authority-text-guard-v1
recipes:
  editorial-systems:
    provider_clause: architectural editorial scene, layered amber and cobalt light, quiet depth
    authorities: [pure-image2, framed-image2]
    composition_ids: [centered-constellation]
    motif_ids: [connected-nodes]
    identity_subject_classes: [none]
compositions:
  centered-constellation:
    provider_clause: centered focal form with balanced negative space
    authorities: [pure-image2, framed-image2]
    min_motifs: 0
    max_motifs: 1
motifs:
  connected-nodes:
    provider_clause: luminous connected nodes with measured spacing
    authorities: [pure-image2, framed-image2]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
${relationships ? RELATIONSHIP_CLAUSES : ""}`;
}

function visualBrief({ relationship = null, relationshipFirst = false, relationshipValue = null, extra = "" } = {}) {
  const relationshipLine = relationship === null ? "" : `relationship: ${relationshipValue ?? relationship}\n`;
  return relationshipFirst
    ? `${relationshipLine}recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
${extra}`
    : `recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
${relationshipLine}${extra}`;
}

function source({ workflow = "pure", slideId = "DeckGo", ...brief } = {}) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`${slideId}\`

**TITLE**: Relationship selection
**VISUAL BRIEF**:
\`\`\`yaml
${visualBrief(brief)}\`\`\`
`;
}

function parseSource(value, registry) {
  return parsePageAuthoritySource(value, {
    registry: createPageAuthorityVisualLanguageResolver(registry),
  });
}

function issueCodes(error) {
  return error.issues.map((entry) => entry.code);
}

describe("Page Authority relationship visual language", () => {
  it("parses registries with and without optional relationships", () => {
    const withRelationships = parsePageAuthorityVisualLanguage(registrySource());
    const withoutRelationships = parsePageAuthorityVisualLanguage(registrySource({ relationships: false }));

    expect(Object.keys(withRelationships.relationships)).toEqual(["layer-stack", "causal-flow"]);
    expect(withoutRelationships.relationships).toEqual({});
    expect(resolvePageAuthorityVisualLanguageSelection(withoutRelationships, {
      authority: "pure-image2",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [] },
    }).provider_clauses).toEqual({
      recipe: "architectural editorial scene, layered amber and cobalt light, quiet depth",
      composition: "centered focal form with balanced negative space",
      motifs: [],
    });
  });

  it("rejects malformed relationship registry facts before selection", () => {
    const guarded = registrySource().replace("nested translucent planes rising", "text nested translucent planes rising");
    const unknownReference = registrySource().replace("recipe_ids: [editorial-systems]", "recipe_ids: [missing-recipe]");
    const unsupportedOrder = registrySource().replace("reading_order: bottom-to-top", "reading_order: clockwise");

    for (const invalid of [guarded, unknownReference, unsupportedOrder]) {
      expect(() => parsePageAuthorityVisualLanguage(invalid)).toThrow(PageAuthorityVisualLanguageError);
    }
    expect(() => parsePageAuthorityVisualLanguage(guarded)).toThrow(/forbidden token/);
    expect(() => parsePageAuthorityVisualLanguage(unknownReference)).toThrow(/unknown recipe/);
    expect(() => parsePageAuthorityVisualLanguage(unsupportedOrder)).toThrow(/unsupported value/);
  });

  it("accepts relationship selection for both workflows and projects reading order", () => {
    const registry = parsePageAuthorityVisualLanguage(registrySource());
    for (const authority of ["pure-image2", "framed-image2"]) {
      for (const [relationship, readingOrder] of [["layer-stack", "bottom-to-top"], ["causal-flow", "left-to-right"]]) {
        const resolved = resolvePageAuthorityVisualLanguageSelection(registry, {
          authority,
          visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship },
        });
        expect(resolved.projection.relationship).toMatchObject({ id: relationship, reading_order: readingOrder });
        expect(resolved.provider_clauses.relationship).toBe(registry.relationships[relationship].provider_clause);
      }
    }
  });

  it("rejects unknown, incompatible, and authority-ineligible relationship selection", () => {
    const registry = parsePageAuthorityVisualLanguage(registrySource());
    expect(() => resolvePageAuthorityVisualLanguageSelection(registry, {
      authority: "pure-image2",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "missing-relationship" },
    })).toThrow(/unregistered relationship/);

    const incompatible = parsePageAuthorityVisualLanguage(registrySource()
      .replace("    max_motifs: 1\nmotifs:", `    max_motifs: 1
  alternate-constellation:
    provider_clause: asymmetric focal form with broad negative space
    authorities: [pure-image2, framed-image2]
    min_motifs: 0
    max_motifs: 1
motifs:`)
      .replace("composition_ids: [centered-constellation]\n    reading_order: bottom-to-top", "composition_ids: [alternate-constellation]\n    reading_order: bottom-to-top"));
    expect(() => resolvePageAuthorityVisualLanguageSelection(incompatible, {
      authority: "pure-image2",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "layer-stack" },
    })).toThrow(/not compatible/);

    const ineligible = parsePageAuthorityVisualLanguage(registrySource().replace(
      "  layer-stack:\n    provider_clause: nested translucent planes rising from broad base to focused apex\n    authorities: [pure-image2, framed-image2]",
      "  layer-stack:\n    provider_clause: nested translucent planes rising from broad base to focused apex\n    authorities: [pure-image2]",
    ));
    expect(() => resolvePageAuthorityVisualLanguageSelection(ineligible, {
      authority: "framed-image2",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "layer-stack" },
    })).toThrow(/not eligible/);
  });

  it("keeps four-key source visual briefs byte-equivalent and rejects invalid relationship ingress", () => {
    const registry = parsePageAuthorityVisualLanguage(registrySource());
    const legacy = parseSource(source(), registry);
    expect(legacy.slides[0].visual_brief).toEqual({
      recipe: "editorial-systems",
      composition: "centered-constellation",
      motifs: [],
      negative_constraints: ["no-logo"],
    });
    expect(JSON.stringify(legacy.slides[0].visual_brief)).toBe('{"recipe":"editorial-systems","composition":"centered-constellation","motifs":[],"negative_constraints":["no-logo"]}');
    expect(legacy.slides[0].visual_language.projection).not.toHaveProperty("relationship");
    expect(legacy.slides[0].visual_language.provider_clauses).not.toHaveProperty("relationship");

    for (const invalid of [
      source({ relationship: "layer-stack", relationshipFirst: true }),
      source({ relationship: "layer-stack", relationshipValue: '"layer-stack"' }),
      source({ relationship: "layer_stack" }),
      source({ relationship: "layer-stack", extra: "extra: value\n" }),
    ]) {
      let error;
      try {
        parseSource(invalid, registry);
      } catch (caught) {
        error = caught;
      }
      expect(error).toBeInstanceOf(PageAuthoritySourceError);
      expect(issueCodes(error).some((code) => code.startsWith("invalid_visual_brief") || code === "invalid_visual_brief_id")).toBe(true);
    }
  });

  it("changes selected digests without changing stable slide identity", () => {
    const registry = parsePageAuthorityVisualLanguage(registrySource());
    const legacy = parseSource(source({ slideId: "DeckGo" }), registry);
    const selected = parseSource(source({ slideId: "DeckGo", relationship: "layer-stack" }), registry);

    expect(selected.slides[0].slide_id).toBe(legacy.slides[0].slide_id);
    expect(selected.slides[0].visual_language.projection.registry_semantic_digest)
      .not.toBe(legacy.slides[0].visual_language.projection.registry_semantic_digest);
    expect(selected.slides[0].visual_language.projection.relationship).toMatchObject({
      id: "layer-stack",
      reading_order: "bottom-to-top",
    });
  });
});
