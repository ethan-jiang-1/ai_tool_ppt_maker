// Tests: openspec/specs/diagnostic-facts/spec.md
import { describe, expect, it } from "vitest";

import {
  PROBLEM_OWNER,
  attachProblemFacts,
  createProblemFact,
  isProblemFactsCarrier,
  problemFactsFromError,
  toProblemFacts,
} from "../../../ppt_maker_harness/scripts/shared/diagnostic/problem_fact.mjs";

describe("problem-fact contract", () => {
  it("builds a frozen fact with known owner and physical locator", () => {
    const fact = createProblemFact({
      reason: "content_overriding_visual_clause",
      owner: PROBLEM_OWNER.VISUAL_LANGUAGE,
      source: { path: "2_backbone/visual-style/page-image-visual-language.yaml", line: 3 },
      path: "recipes.editorial-systems.provider_clause",
      subject: { slideId: "DeckAb", field: "VISUAL BRIEF" },
      actual: "headline",
      message: "must not prescribe source content token",
    });
    expect(Object.isFrozen(fact)).toBe(true);
    expect(Object.isFrozen(fact.source)).toBe(true);
    expect(fact.owner).toBe("visual-language");
    expect(fact.source).toEqual({ path: "2_backbone/visual-style/page-image-visual-language.yaml", line: 3 });
    expect(fact.path).toBe("recipes.editorial-systems.provider_clause");
    expect(fact.subject).toEqual({ slideId: "DeckAb", field: "VISUAL BRIEF" });
    expect(fact.actual).toBe("headline");
  });

  it("normalizes string sources and rejects unsafe actuals", () => {
    const fact = createProblemFact({
      reason: "page_image_presentation_source_missing",
      owner: PROBLEM_OWNER.PRESENTATION,
      source: "3_versions/v1/overrides/visual-style/page-image-presentation/framed-header-profiles.yaml",
      actual: { nested: "unsafe object" },
    });
    expect(fact.source).toEqual({ path: "3_versions/v1/overrides/visual-style/page-image-presentation/framed-header-profiles.yaml" });
    expect(fact.actual).toBeUndefined();
  });

  it("keeps unknown owners null and never infers", () => {
    const fact = createProblemFact({ reason: "unknown_problem_fact", owner: "guessed-owner" });
    expect(fact.owner).toBeNull();
  });

  it("converts internal issues to facts for one producer family", () => {
    const facts = toProblemFacts([
      { code: "unregistered_visual_recipe", message: "VISUAL BRIEF selects unregistered recipe", subject: { kind: "slide", id: "DeckAb", field: "VISUAL BRIEF" } },
    ], { owner: PROBLEM_OWNER.PAGE_SOURCE });
    expect(facts).toHaveLength(1);
    expect(facts[0].owner).toBe("page-source");
    expect(facts[0].subject).toEqual({ slideId: "DeckAb", field: "VISUAL BRIEF" });
    expect(Object.isFrozen(facts)).toBe(true);
  });

  it("attaches and reads facts without touching the message", () => {
    const error = new Error("original message");
    const facts = toProblemFacts([{ code: "reference_registry_unavailable", message: "could not read registry" }], {
      owner: PROBLEM_OWNER.REFERENCE_MATERIAL,
      physicalSource: { path: "/tmp/deck/profile/image2-reference-material.yaml" },
    });
    attachProblemFacts(error, facts);
    expect(error.message).toBe("original message");
    expect(isProblemFactsCarrier(error)).toBe(true);
    expect(problemFactsFromError(error)).toHaveLength(1);
    expect(problemFactsFromError(error)[0].source).toEqual({ path: "/tmp/deck/profile/image2-reference-material.yaml" });
    expect(problemFactsFromError(error)[0].owner).toBe("reference-material");
    expect(Object.keys(error)).not.toContain("problemFacts");
  });

  it("returns null for carriers without facts", () => {
    expect(problemFactsFromError(new Error("plain"))).toBeNull();
    expect(isProblemFactsCarrier(new Error("plain"))).toBe(false);
  });

  it("requires a non-empty reason", () => {
    expect(() => createProblemFact({ reason: "" })).toThrow(TypeError);
    expect(() => createProblemFact({})).toThrow(TypeError);
  });
});
