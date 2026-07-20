import { describe, expect, it } from "vitest";
import {
  carryForwardHeaderReview,
  computeStructuralImpact,
  formatSlideLabel,
} from "../../PPTMAKER_FRAMEWORK/scripts/05-iteration/structural/structural_reuse.mjs";

const profile = { model: "gpt-image-2", resolution: "2k", style_reference_sha256: "a".repeat(64) };

function plan(id, position, title = id) {
  return { id, slide_id: id, position, headline: title };
}

function prompt(id, value) {
  return { id, slide_id: id, prompt: value };
}

describe("structural reuse impact", () => {
  it("classifies reorder, insert, delete, semantic/profile changes by stable ID", () => {
    const impact = computeStructuralImpact({
      sourcePlan: [plan("DeckGo", 1), plan("UXGap", 2), plan("DropMe", 3), plan("CostUp", 4)],
      targetPlan: [plan("UXGap", 1), plan("DeckGo", 2), plan("CostUp", 3), plan("NewAsk", 4)],
      sourcePrompts: [prompt("DeckGo", "same-a"), prompt("UXGap", "same-b"), prompt("DropMe", "drop"), prompt("CostUp", "old")],
      targetPrompts: [prompt("UXGap", "same-b"), prompt("DeckGo", "same-a"), prompt("CostUp", "new"), prompt("NewAsk", "new")],
      sourceProfiles: { DeckGo: profile, UXGap: profile, CostUp: profile },
      targetProfiles: { DeckGo: profile, UXGap: profile, CostUp: { ...profile, resolution: "4k" } },
      artifactProofs: {
        DeckGo: { status: "verified", byte_sha256: "1" },
        UXGap: { status: "verified", byte_sha256: "2" },
        CostUp: { status: "verified", byte_sha256: "3" },
        NewAsk: { status: "missing" },
      },
    });
    expect(impact.renderer_calls).toBe(0);
    expect(impact.needs_render).toEqual(["CostUp", "NewAsk"]);
    expect(impact.slides.find((slide) => slide.slide_id === "UXGap").classifications).toEqual(["retained", "reordered"]);
    expect(impact.slides.find((slide) => slide.slide_id === "DeckGo").needs_render).toBe(false);
    expect(impact.slides.find((slide) => slide.slide_id === "CostUp").classifications).toEqual([
      "retained", "reordered", "semantic-changed", "profile-changed",
    ]);
    expect(impact.slides.find((slide) => slide.slide_id === "NewAsk").classifications).toEqual(["inserted"]);
    expect(impact.slides.find((slide) => slide.slide_id === "DropMe")).toMatchObject({
      classifications: ["deleted"], position: null, needs_render: false,
    });
  });

  it("reports legacy-located as needs_render and formats discussable labels", () => {
    const impact = computeStructuralImpact({
      sourcePlan: [plan("UXGap", 1, "Old")],
      targetPlan: [plan("UXGap", 1, "Friction")],
      sourcePrompts: [prompt("UXGap", "same")],
      targetPrompts: [prompt("UXGap", "same")],
      artifactProofs: { UXGap: { status: "legacy-located" } },
    });
    expect(impact.needs_render).toEqual(["UXGap"]);
    expect(impact.review_warnings[0].warning).toMatch(/not reusable/);
    expect(formatSlideLabel(plan("UXGap", 7, "Friction"))).toBe("07 · UXGap · Friction");
  });
});

describe("header review carry-forward", () => {
  it("carries only reviewed evidence with matching profile, bytes, and header fingerprint", () => {
    const sourceRecord = {
      generation_profile: profile,
      slides: {
        UXGap: { status: "reviewed", fingerprint: "fp-a", image_sha256: "sha-a", header_snapshot: { title: "A" } },
        WaiveX: { status: "waived", fingerprint: "fp-b", image_sha256: "sha-b" },
        StaleX: { status: "reviewed", fingerprint: "fp-c", image_sha256: "old-sha" },
      },
    };
    const carried = carryForwardHeaderReview({
      sourceRecord,
      targetInputs: {
        fullPageIds: ["UXGap", "WaiveX", "StaleX"],
        slideFingerprints: { UXGap: "fp-a", WaiveX: "fp-b", StaleX: "fp-c" },
      },
      materializedEntries: {
        UXGap: { status: "verified", entry: { generation_profile: profile, image_sha256: "sha-a" } },
        WaiveX: { status: "verified", entry: { generation_profile: profile, image_sha256: "sha-b" } },
        StaleX: { status: "verified", entry: { generation_profile: profile, image_sha256: "new-sha" } },
      },
      sourceVersion: "3_versions/v1",
      carriedAt: "2026-07-16T00:00:00.000Z",
    });
    expect(carried.carried_ids).toEqual(["UXGap"]);
    expect(carried.record.slides.UXGap).toMatchObject({
      status: "reviewed",
      source_lineage: { source_version: "3_versions/v1", source_status: "reviewed" },
    });
    expect(carried.warnings).toEqual(expect.arrayContaining([
      { slide_id: "WaiveX", reason: "waiver-not-carried" },
      { slide_id: "StaleX", reason: "reviewed-image-sha-mismatch" },
    ]));
  });
});
