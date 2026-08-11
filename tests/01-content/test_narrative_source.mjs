import { describe, expect, it } from "vitest";

import {
  DESIGN_CONSTRAINTS_SCHEMA,
  NarrativeSourceError,
  STORY_OUTLINE_SCHEMA,
  parseDesignConstraints,
  parseStoryOutline,
} from "../../ppt_maker_harness/scripts/01-content/index.mjs";

const STORY_OUTLINE = `---
schema: story-outline
---

# Story Outline

## Central Claim

Reliable operational data turns AI adoption into an accountable capability.

## Audience Outcome

Operations leaders can choose the first governed data investment.

## Block 1: Establish The Gap

**Audience Question**: Why do pilots stall after the first demonstration?
**Argument Function**: Establish the business consequence of ungoverned data.
**Evidence / Reasoning Beats**:
- Teams cannot explain which sources informed a response.
- Operators cannot correct a failure without reconstructing context.
**Intended Page Range**: 1-2

## Block 2: Show The Path

**Audience Question**: What changes that operating reality?
**Argument Function**: Show the governed operating model.
**Evidence / Reasoning Beats**:
- Source lineage makes results inspectable.
**Intended Page Range**: 3-4
`;

const DESIGN_CONSTRAINTS = `---
schema: design-constraints
---

# Design Constraints

## Audience

Operations leaders who understand their current reporting process.

## Language and Tone

Plain, concrete, and evidence-led English.

## Forbidden Claims

- Do not promise fully autonomous operations.

## Required Terminology

- governed data
- source lineage
`;

function issueCodes(error) {
  return error.issues.map((entry) => entry.code);
}

function expectNarrativeError(parse, source) {
  try {
    parse(source);
  } catch (error) {
    expect(error).toBeInstanceOf(NarrativeSourceError);
    return error;
  }
  throw new Error("expected NarrativeSourceError");
}

describe("narrative source grammar", () => {
  it("normalizes a Block-first Story Outline with every evidence beat", () => {
    const story = parseStoryOutline(STORY_OUTLINE, { source: "2_backbone/story-outline.md" });

    expect(story).toMatchObject({
      schema: STORY_OUTLINE_SCHEMA,
      source: "2_backbone/story-outline.md",
      central_claim: "Reliable operational data turns AI adoption into an accountable capability.",
      audience_outcome: "Operations leaders can choose the first governed data investment.",
      blocks: [
        {
          ordinal: 1,
          heading: "Establish The Gap",
          beats: [
            "Teams cannot explain which sources informed a response.",
            "Operators cannot correct a failure without reconstructing context.",
          ],
          intended_page_range: { start: 1, end: 2 },
        },
        { ordinal: 2, heading: "Show The Path", intended_page_range: { start: 3, end: 4 } },
      ],
    });
    expect(story.source_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.isFrozen(story.blocks[0])).toBe(true);
  });

  it("normalizes the focused content-boundary Design Constraints source", () => {
    const constraints = parseDesignConstraints(DESIGN_CONSTRAINTS);

    expect(constraints).toMatchObject({
      schema: DESIGN_CONSTRAINTS_SCHEMA,
      audience: "Operations leaders who understand their current reporting process.",
      language_and_tone: "Plain, concrete, and evidence-led English.",
      forbidden_claims: ["Do not promise fully autonomous operations."],
      required_terminology: ["governed data", "source lineage"],
    });
    expect(Object.isFrozen(constraints.forbidden_claims)).toBe(true);
  });

  it("requires current frontmatter, complete fields, ordered Blocks, beats, and valid inclusive page ranges", () => {
    expect(issueCodes(expectNarrativeError(parseStoryOutline, STORY_OUTLINE.replace("schema: story-outline", "schema: retired-outline"))))
      .toContain("narrative_schema_mismatch");
    expect(issueCodes(expectNarrativeError(parseStoryOutline, STORY_OUTLINE.replace("## Audience Outcome\n\nOperations leaders can choose the first governed data investment.\n\n", ""))))
      .toContain("narrative_section_required");
    expect(issueCodes(expectNarrativeError(parseStoryOutline, STORY_OUTLINE.replace("## Block 2:", "## Block 3:"))))
      .toContain("narrative_block_order");
    expect(issueCodes(expectNarrativeError(parseStoryOutline, STORY_OUTLINE.replace("- Source lineage makes results inspectable.\n", ""))))
      .toContain("narrative_list_required");
    expect(issueCodes(expectNarrativeError(parseStoryOutline, STORY_OUTLINE.replace("1-2", "2-1"))))
      .toContain("invalid_intended_page_range");
  });

  it("requires every focused Design Constraints section and list", () => {
    expect(issueCodes(expectNarrativeError(parseDesignConstraints, DESIGN_CONSTRAINTS.replace("## Language and Tone\n\nPlain, concrete, and evidence-led English.\n\n", ""))))
      .toContain("narrative_section_required");
    expect(issueCodes(expectNarrativeError(parseDesignConstraints, DESIGN_CONSTRAINTS.replace("- governed data\n- source lineage\n", ""))))
      .toContain("narrative_list_required");
  });

  it("rejects visual, page class, geometry, and density decisions from both narrative sources", () => {
    for (const [parse, source] of [
      [parseStoryOutline, STORY_OUTLINE.replace("## Central Claim", "Visual Language: editorial-systems\n\n## Central Claim")],
      [parseDesignConstraints, DESIGN_CONSTRAINTS.replace("## Audience", "Page Class: opening\n\n## Audience")],
      [parseDesignConstraints, DESIGN_CONSTRAINTS.replace("## Audience", "Safe zone: 12%\n\n## Audience")],
      [parseDesignConstraints, DESIGN_CONSTRAINTS.replace("## Audience", "Words per slide: 20\n\n## Audience")],
    ]) {
      const error = expectNarrativeError(parse, source);
      expect(issueCodes(error)).toContain("narrative_ownership_error");
      expect(error.issues.find((entry) => entry.code === "narrative_ownership_error").message)
        .toContain("Visual Language");
    }
  });
});
