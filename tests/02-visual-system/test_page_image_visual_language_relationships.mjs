// Tests: openspec/specs/visual-config/spec.md
// Tests: openspec/specs/visual-asset-management/spec.md
import { describe, expect, it } from "vitest";

import {
  PageImageVisualLanguageError,
  createPageImageVisualLanguageResolver,
  parsePageImageVisualLanguage,
  resolvePageImageVisualLanguageSelection,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import {
  PageImageSourceError,
  parsePageImageSource,
} from "../../ppt_maker_harness/scripts/01-content/index.mjs";

const RELATIONSHIP_CLAUSES = `relationships:
  layer-stack:
    provider_clause: nested translucent planes rising from broad base to focused apex
    workflows: [framed, pure]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: bottom-to-top
  causal-flow:
    provider_clause: connected luminous forms progressing from left origin to right outcome
    workflows: [framed, pure]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: left-to-right
`;

function registrySource({ relationships = true } = {}) {
  return `schema: pptmaker-page-image-visual-language
recipes:
  editorial-systems:
    provider_clause: architectural editorial scene, layered amber and cobalt light, quiet depth
    workflows: [framed, pure]
    composition_ids: [centered-constellation]
    motif_ids: [connected-nodes]
    identity_subject_classes: [none]
compositions:
  centered-constellation:
    provider_clause: centered focal form with balanced negative space
    workflows: [framed, pure]
    min_motifs: 0
    max_motifs: 1
motifs:
  connected-nodes:
    provider_clause: luminous connected nodes with measured spacing
    workflows: [framed, pure]
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
  scheme: mnemonic
production:
  pipeline: page-image-workflow
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
  return parsePageImageSource(value, {
    registry: createPageImageVisualLanguageResolver(registry),
  });
}

function issueCodes(error) {
  return error.issues.map((entry) => entry.code);
}

describe("Page Image visual language", () => {
  it("parses content-neutral registries with workflow-oriented eligibility", () => {
    const withRelationships = parsePageImageVisualLanguage(registrySource());
    const withoutRelationships = parsePageImageVisualLanguage(registrySource({ relationships: false }));

    expect(Object.keys(withRelationships.relationships)).toEqual(["layer-stack", "causal-flow"]);
    expect(withoutRelationships.relationships).toEqual({});
    expect(resolvePageImageVisualLanguageSelection(withoutRelationships, {
      workflow: "pure",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [] },
    }).provider_clauses).toEqual({
      recipe: "architectural editorial scene, layered amber and cobalt light, quiet depth",
      composition: "centered focal form with balanced negative space",
      motifs: [],
    });
  });

  it("rejects retired authorities structurally and content-overriding clauses at selection", () => {
    const retiredAuthority = registrySource().replace("workflows: [framed, pure]", "authorities: [pure-image2, framed-image2]");
    const textFree = registrySource().replace(
      "architectural editorial scene, layered amber and cobalt light, quiet depth",
      "architectural editorial scene with no-readable-text",
    );
    const sourceLiteral = registrySource().replace(
      "centered focal form with balanced negative space",
      "centered focal form with headline",
    );

    expect(() => parsePageImageVisualLanguage(retiredAuthority)).toThrow(PageImageVisualLanguageError);

    for (const invalid of [textFree, sourceLiteral]) {
      const parsed = parsePageImageVisualLanguage(invalid);
      expect(() => resolvePageImageVisualLanguageSelection(parsed, {
        workflow: "pure",
        visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [] },
      })).toThrow(PageImageVisualLanguageError);
    }
    const textFreeError = (() => {
      try {
        resolvePageImageVisualLanguageSelection(parsePageImageVisualLanguage(textFree), {
          workflow: "pure",
          visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [] },
        });
        return null;
      } catch (error) {
        return error;
      }
    })();
    expect(textFreeError).not.toBeNull();
    expect(textFreeError.issues.map((entry) => entry.code)).toContain("forbidden_text_free_visual_clause");
    expect(textFreeError.issues[0].path).toBe("recipes.editorial-systems.provider_clause");
    expect(textFreeError.issues[0].source).toBe("2_backbone/visual-style/page-image-visual-language.yaml");
  });

  it("does not let an unselected semantic-violation record invalidate the page", () => {
    const withUnusedInvalid = registrySource().replace(
      "recipes:\n",
      "recipes:\n  unused-invalid:\n    provider_clause: quiet headline depth\n    workflows: [framed, pure]\n    composition_ids: [centered-constellation]\n    motif_ids: []\n    identity_subject_classes: [none]\n",
    );
    const registry = parsePageImageVisualLanguage(withUnusedInvalid);
    const resolved = resolvePageImageVisualLanguageSelection(registry, {
      workflow: "pure",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [] },
    });
    expect(resolved.projection.recipe.id).toBe("editorial-systems");

    expect(() => resolvePageImageVisualLanguageSelection(registry, {
      workflow: "pure",
      visual_brief: { recipe: "unused-invalid", composition: "centered-constellation", motifs: [] },
    })).toThrow(/source content token/);
  });

  it("accepts registered relationship selection for either workflow", () => {
    const registry = parsePageImageVisualLanguage(registrySource());
    for (const workflow of ["framed", "pure"]) {
      for (const [relationship, readingOrder] of [["layer-stack", "bottom-to-top"], ["causal-flow", "left-to-right"]]) {
        const resolved = resolvePageImageVisualLanguageSelection(registry, {
          workflow,
          visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship },
        });
        expect(resolved.projection.relationship).toMatchObject({ id: relationship, reading_order: readingOrder });
        expect(resolved.provider_clauses.relationship).toBe(registry.relationships[relationship].provider_clause);
      }
    }
  });

  it("rejects unknown, incompatible, and workflow-ineligible relationship selection", () => {
    const registry = parsePageImageVisualLanguage(registrySource());
    expect(() => resolvePageImageVisualLanguageSelection(registry, {
      workflow: "pure",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "missing-relationship" },
    })).toThrow(/unregistered relationship/);

    const incompatible = parsePageImageVisualLanguage(registrySource()
      .replace("    max_motifs: 1\nmotifs:", `    max_motifs: 1
  alternate-constellation:
    provider_clause: asymmetric focal form with broad negative space
    workflows: [framed, pure]
    min_motifs: 0
    max_motifs: 1
motifs:`)
      .replace("composition_ids: [centered-constellation]\n    reading_order: bottom-to-top", "composition_ids: [alternate-constellation]\n    reading_order: bottom-to-top"));
    expect(() => resolvePageImageVisualLanguageSelection(incompatible, {
      workflow: "pure",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "layer-stack" },
    })).toThrow(/not compatible/);

    const ineligible = parsePageImageVisualLanguage(registrySource().replace(
      "  layer-stack:\n    provider_clause: nested translucent planes rising from broad base to focused apex\n    workflows: [framed, pure]",
      "  layer-stack:\n    provider_clause: nested translucent planes rising from broad base to focused apex\n    workflows: [pure]",
    ));
    expect(() => resolvePageImageVisualLanguageSelection(ineligible, {
      workflow: "framed",
      visual_brief: { recipe: "editorial-systems", composition: "centered-constellation", motifs: [], relationship: "layer-stack" },
    })).toThrow(/not eligible/);
  });

  it("keeps visual selection separate from source content and rejects invalid visual ingress", () => {
    const registry = parsePageImageVisualLanguage(registrySource());
    const receipt = parseSource(source({ relationship: "layer-stack" }), registry);
    expect(receipt.slides[0].provider_content).toEqual({ items: [] });
    expect(receipt.slides[0].visual_language.projection.relationship).toMatchObject({
      id: "layer-stack",
      reading_order: "bottom-to-top",
    });

    for (const invalid of [
      source({ relationship: "layer-stack", relationshipFirst: true }),
      source({ relationship: "layer-stack", relationshipValue: '"layer-stack"' }),
      source({ relationship: "layer_stack" }),
      source({ relationship: "layer-stack", extra: "extra: value\n" }),
      source({ extra: "  - no-readable-text\n" }),
    ]) {
      let error;
      try {
        parseSource(invalid, registry);
      } catch (caught) {
        error = caught;
      }
      expect(error).toBeInstanceOf(PageImageSourceError);
      expect(issueCodes(error).some((code) => code.startsWith("invalid_visual_brief") || code === "invalid_visual_brief_id" || code === "forbidden_text_free_visual_clause")).toBe(true);
    }
  });
});
