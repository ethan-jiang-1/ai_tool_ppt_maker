// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/diagnostic-facts/spec.md
import { describe, expect, it } from "vitest";

import {
  attachCliDiagnostic,
  diagnosticFromError,
  projectProblemFactsDiagnostic,
} from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import {
  PROBLEM_OWNER,
  attachProblemFacts,
  toProblemFacts,
} from "../../../ppt_maker_harness/scripts/shared/diagnostic/problem_fact.mjs";

function carrier(facts, issues = []) {
  const error = new Error("aggregated Page Image source failure");
  attachProblemFacts(error, facts);
  if (issues.length) error.issues = issues;
  return error;
}

describe("problem-fact public projection", () => {
  it("projects a registry clause root into one source_validation envelope", () => {
    const error = carrier(
      toProblemFacts([{
        code: "content_overriding_visual_clause",
        message: "recipes.unused-invalid.provider_clause: must not prescribe source content token \"headline\"",
        source: { path: "2_backbone/visual-style/page-image-visual-language.yaml" },
        path: "recipes.unused-invalid.provider_clause",
      }], { owner: PROBLEM_OWNER.VISUAL_LANGUAGE }),
      [{ code: "content_overriding_visual_clause", message: "recipes.unused-invalid.provider_clause: must not prescribe source content token \"headline\"", subject: { kind: "slide", id: "DeckAb" } }],
    );
    const diagnostic = projectProblemFactsDiagnostic({
      error,
      operation: "target-page-image-plan",
      rerunText: "Repair the named source, then rerun image2 plan.",
    });

    expect(diagnostic).not.toBeNull();
    expect(diagnostic.category).toBe("source_validation");
    expect(diagnostic.reason.kind).toBe("content_overriding_visual_clause");
    expect(diagnostic.source).toEqual({ path: "2_backbone/visual-style/page-image-visual-language.yaml" });
    expect(diagnostic.next.action).toBe("edit_source");
    expect(diagnostic.next.requires_human).toBe(false);
    expect(diagnostic.next.inspect).toEqual([{ path: "2_backbone/visual-style/page-image-visual-language.yaml" }]);
    expect(diagnostic.issues[0].subject).toEqual({ kind: "slide", id: "DeckAb" });
  });

  it("never projects a fact with unknown owner (fail closed at the caller)", () => {
    const error = carrier(toProblemFacts([{ code: "opaque_resolver_failure" }], { owner: null }));
    expect(projectProblemFactsDiagnostic({ error, operation: "target-page-image-plan", rerunText: "rerun" })).toBeNull();
  });

  it("returns null for errors without problem facts", () => {
    expect(projectProblemFactsDiagnostic({ error: new Error("plain"), operation: "target-page-image-plan", rerunText: "rerun" })).toBeNull();
  });

  it("omits source and inspect when the producer has no exact locator", () => {
    const error = carrier(toProblemFacts([{ code: "unknown_reference_key", message: "registry contains unknown key" }], {
      owner: PROBLEM_OWNER.REFERENCE_MATERIAL,
    }));
    const diagnostic = projectProblemFactsDiagnostic({ error, operation: "target-page-image-plan", rerunText: "rerun" });
    expect(diagnostic.source).toBeUndefined();
    expect(diagnostic.next.inspect).toBeUndefined();
    expect(diagnostic.next.action).toBe("edit_source");
  });

  it("keeps safe scalar actual/expected in the reason", () => {
    const error = carrier(toProblemFacts([{ code: "reference_sha_mismatch", message: "bytes differ", actual: "abc", expected: "def" }], {
      owner: PROBLEM_OWNER.REFERENCE_MATERIAL,
      physicalSource: { path: "/tmp/deck/profile/guide.png" },
    }));
    const diagnostic = projectProblemFactsDiagnostic({ error, operation: "target-page-image-plan", rerunText: "rerun" });
    expect(diagnostic.reason).toEqual({ kind: "reference_sha_mismatch", actual: "abc", expected: "def" });
  });
});

describe("delivery-notes diagnostic seam", () => {
  it("attaches and retrieves a bounded diagnostic within the delivery-notes jurisdiction", () => {
    const error = new Error("notes delivery failed");
    attachCliDiagnostic(error, {
      schema: "pptmaker-cli-diagnostic",
      category: "artifact",
      next: { action: "report_internal", requires_human: false, default: "Report the notes delivery defect." },
    });
    expect(diagnosticFromError(error).category).toBe("artifact");
    expect(error.message).toBe("notes delivery failed");
  });

  it("returns null when no diagnostic is attached", () => {
    expect(diagnosticFromError(new Error("plain"))).toBeNull();
  });
});
