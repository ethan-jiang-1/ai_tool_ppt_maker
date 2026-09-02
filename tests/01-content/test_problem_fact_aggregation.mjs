// Tests: openspec/specs/narrative-authoring/spec.md
// Tests: openspec/specs/content-parsing/spec.md
// Tests: openspec/specs/slide-identity-and-ordering/spec.md
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PageImageSourceError,
  parsePageImageSource,
} from "../../ppt_maker_harness/scripts/01-content/index.mjs";
import {
  PAGE_IMAGE_REFERENCE_ROOT,
  createPageImageSourceResolver,
  createPageImageVisualLanguageResolver,
  parsePageImageVisualLanguage,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import { problemFactsFromError } from "../../ppt_maker_harness/scripts/shared/diagnostic/problem_fact.mjs";

const REGISTRY_SOURCE = `schema: pptmaker-page-image-visual-language
recipes:
  editorial-systems:
    provider_clause: architectural editorial scene, layered amber and cobalt light, quiet depth
    workflows: [framed, pure]
    composition_ids: [centered-constellation]
    motif_ids: [connected-nodes]
    identity_subject_classes: [none]
  unused-invalid:
    provider_clause: quiet headline depth
    workflows: [framed, pure]
    composition_ids: [centered-constellation]
    motif_ids: []
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
`;

function brief({ recipe = "editorial-systems", extra = "" } = {}) {
  return `recipe: ${recipe}
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
${extra}`;
}

const MULTI_SLIDE_IDS = ["DeckAb", "DeckAc", "DeckAd", "DeckAe", "DeckAf"];

function sourceText({ workflow = "pure", slideId = "DeckAb", identity = "", headerExtra = "", briefBody, slideCount = 1 } = {}) {
  let slides = "";
  for (let index = 1; index <= slideCount; index += 1) {
    const id = slideCount === 1 ? slideId : MULTI_SLIDE_IDS[index - 1];
    slides += `
## Slide 0${index}: \`${id}\`

**TITLE**: Title ${index}
${headerExtra}${identity}**VISUAL BRIEF**:
\`\`\`yaml
${briefBody}\`\`\`
`;
  }
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---
${slides}`;
}

const IDENTITY_BLOCK = (profile = TEST_AGENT, role = TEST_ROLE) =>
  `**VISUAL IDENTITY**: ${profile}/${role}\n**IDENTITY SUBJECT COUNT**: one\n`;

function parseWithVisualLanguage(options = {}) {
  const { workflow = "pure", identity = "", briefBody, slideCount = 1 } = options;
  const registry = parsePageImageVisualLanguage(REGISTRY_SOURCE);
  return parsePageImageSource(sourceText({ workflow, identity, briefBody, slideCount }), {
    registry: createPageImageVisualLanguageResolver(registry),
  });
}

function catchFacts(action) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(PageImageSourceError);
    return { issues: error.issues, facts: problemFactsFromError(error) };
  }
  throw new Error("expected Page Image source parsing to fail");
}

const TEST_AGENT = "test-agent";
const TEST_ROLE = "guide";
const ROLE_CLAUSE = "one test light-form guides calmly";
const REFERENCE_BYTES = Buffer.from("synthetic identity reference bytes", "utf8");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function referenceFixture() {
  const root = mkdtempSync(join(tmpdir(), "page-image-aggregation-"));
  const deck = join(root, "deck_aggregation");
  const profileDirectory = join(deck, ...PAGE_IMAGE_REFERENCE_ROOT.split("/"), TEST_AGENT);
  const referencePath = join(profileDirectory, "guide.png");
  const registryPath = join(profileDirectory, "image2-reference-material.yaml");
  mkdirSync(profileDirectory, { recursive: true });
  writeFileSync(referencePath, REFERENCE_BYTES);
  writeFileSync(registryPath, `schema: pptmaker-image2-reference-registry
profiles:
  ${TEST_AGENT}:
    subject_class: amber-light-form
    maximum_identity_subjects: 1
    compatible_restrictions:
      - none
    incompatible_restrictions:
      - no-identity-subject
    roles:
      ${TEST_ROLE}:
        reference_path: guide.png
        reference_sha256: ${sha256(REFERENCE_BYTES)}
        role_clause: ${ROLE_CLAUSE}
`, "utf8");
  return { root, deck, registryPath };
}

describe("Page Image resolver problem-fact aggregation", () => {
  it("locates an unregistered identity role at VISUAL IDENTITY with the Page Source owner", () => {
    const value = referenceFixture();
    try {
      const registry = parsePageImageVisualLanguage(REGISTRY_SOURCE);
      const resolver = createPageImageSourceResolver({ deckDir: value.deck, visualLanguage: registry });
      const { issues, facts } = catchFacts(() => parsePageImageSource(sourceText({
        identity: IDENTITY_BLOCK(TEST_AGENT, "absent-role"),
        briefBody: brief(),
      }), { registry: resolver }));

      expect(issues[0].code).toBe("unregistered_identity_role");
      expect(issues[0].subject.field).toBe("VISUAL IDENTITY");
      expect(issues[0].source.path).toBe("slide-specifications.md");
      expect(facts[0].owner).toBe("page-source");
      expect(facts[0].reason).toBe("unregistered_identity_role");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("locates an incompatible identity restriction at SUBJECT RESTRICTIONS", () => {
    const value = referenceFixture();
    try {
      const registry = parsePageImageVisualLanguage(REGISTRY_SOURCE);
      const resolver = createPageImageSourceResolver({ deckDir: value.deck, visualLanguage: registry });

      const restriction = catchFacts(() => parsePageImageSource(sourceText({
        identity: `${IDENTITY_BLOCK()}\n**SUBJECT RESTRICTIONS**: no-generic-metal-robot\n`,
        briefBody: brief(),
      }), { registry: resolver }));
      expect(restriction.issues[0].code).toBe("identity_restriction_incompatible");
      expect(restriction.issues[0].subject.field).toBe("SUBJECT RESTRICTIONS");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps the native IDENTITY SUBJECT COUNT field-level repair for a count mismatch", () => {
    const registry = parsePageImageVisualLanguage(REGISTRY_SOURCE);
    const { issues } = catchFacts(() => parsePageImageSource(sourceText({
      identity: "**VISUAL IDENTITY**: test-agent/guide\n**IDENTITY SUBJECT COUNT**: none\n",
      briefBody: brief(),
    }), { registry: createPageImageVisualLanguageResolver(registry) }));

    expect(issues[0].code).toBe("identity_subject_count_mismatch");
    expect(issues[0].subject.field).toBe("IDENTITY SUBJECT COUNT");
  });

  it("keeps a reference role-clause defect with the Reference Material owner and registry locator", () => {
    const value = referenceFixture();
    try {
      writeFileSync(value.registryPath, `schema: pptmaker-image2-reference-registry
profiles:
  ${TEST_AGENT}:
    subject_class: amber-light-form
    maximum_identity_subjects: 1
    compatible_restrictions:
      - none
    incompatible_restrictions:
      - no-identity-subject
    roles:
      ${TEST_ROLE}:
        reference_path: guide.png
        reference_sha256: ${sha256(REFERENCE_BYTES)}
        role_clause: readable label
`, "utf8");
      const registry = parsePageImageVisualLanguage(REGISTRY_SOURCE);
      const resolver = createPageImageSourceResolver({ deckDir: value.deck, visualLanguage: registry });
      const { issues, facts } = catchFacts(() => parsePageImageSource(sourceText({
        identity: IDENTITY_BLOCK(),
        briefBody: brief(),
      }), { registry: resolver }));

      expect(issues[0].code).toBe("content_overriding_visual_clause");
      expect(issues[0].source.path).toContain("image2-reference-material.yaml");
      expect(issues[0].path).toBe("profiles.test-agent.roles.guide.role_clause");
      expect(facts[0].owner).toBe("reference-material");
      expect(facts[0].source.path).toBe(value.registryPath);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps a selected Visual Language clause violation with the registry owner and logical path", () => {
    const { issues, facts } = catchFacts(() => parseWithVisualLanguage({
      briefBody: brief({ recipe: "unused-invalid" }),
    }));

    expect(issues[0].code).toBe("content_overriding_visual_clause");
    expect(issues[0].path).toBe("recipes.unused-invalid.provider_clause");
    expect(issues[0].source.path).toBe("2_backbone/visual-style/page-image-visual-language.yaml");
    expect(facts[0].owner).toBe("visual-language");
  });

  it("locates an unregistered brief ID at VISUAL BRIEF with the Page Source owner", () => {
    const { issues, facts } = catchFacts(() => parseWithVisualLanguage({
      briefBody: brief({ recipe: "absent-recipe" }),
    }));

    expect(issues[0].code).toBe("unregistered_visual_recipe");
    expect(issues[0].subject.field).toBe("VISUAL BRIEF");
    expect(issues[0].source.path).toBe("slide-specifications.md");
    expect(facts[0].owner).toBe("page-source");
  });

  it("keeps one stable root fact for a shared source across slides", () => {
    const { issues, facts } = catchFacts(() => parseWithVisualLanguage({
      slideCount: 5,
      briefBody: brief({ recipe: "unused-invalid" }),
    }));

    expect(issues).toHaveLength(5);
    expect(facts).toHaveLength(1);
    expect(facts[0].owner).toBe("visual-language");
    expect(facts[0].reason).toBe("content_overriding_visual_clause");
    expect(facts[0].source.path).toBe("2_backbone/visual-style/page-image-visual-language.yaml");
    expect(facts[0].path).toBe("recipes.unused-invalid.provider_clause");
    for (const entry of issues) {
      expect(entry.code).toBe("content_overriding_visual_clause");
      expect(entry.subject.id).toMatch(/^DeckA[b-f]$/);
    }
  });

  it("marks an unknown resolver failure as unknown instead of guessing", () => {
    const { issues, facts } = catchFacts(() => parsePageImageSource(sourceText({ briefBody: brief() }), {
      registry: {
        resolveSelection() {
          throw new Error("opaque resolver failure");
        },
      },
    }));

    expect(issues[0].code).toBe("unregistered_visual_selection");
    expect(facts[0].owner).toBeNull();
  });
});
