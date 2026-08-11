import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  PURE_DECK_VISUAL_SYSTEM_SCHEMA,
  PureDeckVisualSystemError,
  loadPureDeckVisualSystem,
  parsePureDeckVisualSystem,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import { resolveFramedTargetCandidateSource } from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { canonicalJsonSha256 } from "../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import {
  PURE_DECK_VISUAL_SYSTEM_FILE,
  initBundle,
  pureDeckVisualSystemAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

function source({ whitespace = "generous" } = {}) {
  return `schema: pptmaker-pure-deck-visual-system
revision: 1
typography:
  voices:
    display: editorial-serif
    text: editorial-sans
  hierarchy:
    kicker: eyebrow
    title: display
    subtitle: supporting
    body: body
    label: label
    metric: metric
    diagram_text: diagram
    quote: quote
    callout: callout
    supporting_copy: supporting
colour_use:
  palette_source: style-master
  roles:
    primary_text: primary
    secondary_text: secondary
    accent: accent
    surface: neutral
layout:
  zones:
    title: { x: 0.08, y: 0.08, width: 0.84, height: 0.22 }
    content: { x: 0.08, y: 0.34, width: 0.84, height: 0.54 }
  whitespace: ${whitespace}
  families: [editorial-hero, diagram-led, data-led]
`;
}

function reorderedSource() {
  return `layout:
  families: [editorial-hero, diagram-led, data-led]
  whitespace: generous
  zones:
    content: { height: 0.54, width: 0.84, y: 0.34, x: 0.08 }
    title: { height: 0.22, width: 0.84, y: 0.08, x: 0.08 }
colour_use:
  roles:
    surface: neutral
    accent: accent
    secondary_text: secondary
    primary_text: primary
  palette_source: style-master
typography:
  hierarchy:
    supporting_copy: supporting
    callout: callout
    quote: quote
    diagram_text: diagram
    metric: metric
    label: label
    body: body
    subtitle: supporting
    title: display
    kicker: eyebrow
  voices:
    text: editorial-sans
    display: editorial-serif
revision: 1
schema: pptmaker-pure-deck-visual-system
`;
}

const FRAMED_SOURCE = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed keeps its own visual configuration
**FRAME PRESET**: standard
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: "The provider owns this page body."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;

function issueCodes(error) {
  return error.issues.map((entry) => entry.code);
}

describe("Pure deck visual system", () => {
  it("parses one immutable, content-neutral canonical projection", () => {
    const projection = parsePureDeckVisualSystem(source());

    expect(projection).toEqual({
      schema: PURE_DECK_VISUAL_SYSTEM_SCHEMA,
      revision: 1,
      typography: {
        voices: { display: "editorial-serif", text: "editorial-sans" },
        hierarchy: {
          kicker: "eyebrow",
          title: "display",
          subtitle: "supporting",
          body: "body",
          label: "label",
          metric: "metric",
          diagram_text: "diagram",
          quote: "quote",
          callout: "callout",
          supporting_copy: "supporting",
        },
      },
      colour_use: {
        palette_source: "style-master",
        roles: { primary_text: "primary", secondary_text: "secondary", accent: "accent", surface: "neutral" },
      },
      layout: {
        zones: {
          title: { x: 0.08, y: 0.08, width: 0.84, height: 0.22 },
          content: { x: 0.08, y: 0.34, width: 0.84, height: 0.54 },
        },
        whitespace: "generous",
        families: ["editorial-hero", "diagram-led", "data-led"],
      },
    });
    expect(Object.isFrozen(projection.layout.zones.title)).toBe(true);
  });

  it("gives semantically identical mapping orders one canonical digest", () => {
    const canonical = parsePureDeckVisualSystem(source());
    const reordered = parsePureDeckVisualSystem(reorderedSource());

    expect(reordered).toEqual(canonical);
    expect(canonicalJsonSha256(reordered)).toBe(canonicalJsonSha256(canonical));
  });

  it("rejects free prompt, content, lifecycle, enum, hierarchy, and geometry ingress", () => {
    const unknownPrompt = source().replace("revision: 1", "revision: 1\nprovider_prompt: make this beautiful");
    const sourceLiteral = source().replace("families: [editorial-hero, diagram-led, data-led]", "families: [editorial-hero, diagram-led, data-led]\nslide_literal: confidential claim");
    const lifecycle = source().replace("revision: 1", "revision: 1\nreview_decision: proceed");
    const invalidWhitespace = source({ whitespace: "maximal" });
    const invalidHierarchy = source().replace("title: display", "title: body");
    const escapedZone = source().replace("width: 0.84, height: 0.22", "width: 0.94, height: 0.22");

    for (const value of [unknownPrompt, sourceLiteral, lifecycle, invalidWhitespace, invalidHierarchy, escapedZone]) {
      expect(() => parsePureDeckVisualSystem(value)).toThrow(PureDeckVisualSystemError);
    }
    expect(() => parsePureDeckVisualSystem(unknownPrompt)).toThrow(/unknown key/);
    try {
      parsePureDeckVisualSystem(escapedZone);
    } catch (error) {
      expect(issueCodes(error)).toContain("invalid_pure_visual_system_geometry");
    }
  });

  it("loads the seeded source and isolates version overrides without rewriting backbone", () => {
    const root = mkdtempSync(join(tmpdir(), "pure-deck-visual-system-"));
    try {
      const deck = join(root, "deck_visual_system");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const backbonePath = pureDeckVisualSystemAsset(runDir);
      const baseline = loadPureDeckVisualSystem(runDir);
      const backboneBytes = readFileSync(backbonePath, "utf8");
      const overridePath = join(runDir, "overrides", "visual-style", PURE_DECK_VISUAL_SYSTEM_FILE);
      mkdirSync(join(runDir, "overrides", "visual-style"), { recursive: true });
      writeFileSync(overridePath, source({ whitespace: "balanced" }), "utf8");
      const overridden = loadPureDeckVisualSystem(runDir);

      expect(existsSync(backbonePath)).toBe(true);
      expect(baseline.projection.schema).toBe(PURE_DECK_VISUAL_SYSTEM_SCHEMA);
      expect(overridden.projection.layout.whitespace).toBe("balanced");
      expect(overridden.sha256).not.toBe(baseline.sha256);
      expect(readFileSync(backbonePath, "utf8")).toBe(backboneBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed for a missing source and an escaping override directory", () => {
    const root = mkdtempSync(join(tmpdir(), "pure-deck-visual-system-confined-"));
    try {
      const deck = join(root, "deck_visual_system");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      const backbonePath = pureDeckVisualSystemAsset(runDir);
      rmSync(backbonePath);
      expect(() => loadPureDeckVisualSystem(runDir)).toThrow(PureDeckVisualSystemError);

      writeFileSync(backbonePath, source(), "utf8");
      const outside = join(root, "outside-visual-style");
      mkdirSync(outside);
      writeFileSync(join(outside, PURE_DECK_VISUAL_SYSTEM_FILE), source(), "utf8");
      const overrideStyle = join(runDir, "overrides", "visual-style");
      symlinkSync(outside, overrideStyle, "dir");
      expect(() => loadPureDeckVisualSystem(runDir)).toThrow(/escapes its selected visual-style owner/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not make Framed source parsing consume a Pure deck visual-system source", () => {
    const root = mkdtempSync(join(tmpdir(), "pure-deck-visual-system-framed-"));
    try {
      const deck = join(root, "deck_visual_system");
      const runDir = join(deck, "3_versions", "v1");
      initBundle(deck, null, "keynote", "dark-executive");
      rmSync(pureDeckVisualSystemAsset(runDir));
      writeFileSync(join(runDir, "slide-specifications.md"), FRAMED_SOURCE, "utf8");

      expect(resolveFramedTargetCandidateSource(runDir).receipt).toMatchObject({ workflow: "framed" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
