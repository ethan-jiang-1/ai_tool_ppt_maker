import { describe, expect, it } from "vitest";

import {
  PAGE_IMAGE_CORE_FACTS_SCHEMA,
  PageImageCoreError,
  createPageImageCoreFacts,
  normalizePageImageHeaderPolicy,
  normalizePageImageProviderContent,
} from "../../../ppt_maker_harness/scripts/shared/page-image/page_image_core.mjs";

function visualSelection() {
  return {
    projection: { recipe: { id: "editorial-systems" } },
    provider_clauses: { recipe: "architectural editorial scene" },
  };
}

function sourceReceipt({ workflow = "framed" } = {}) {
  const selection = visualSelection();
  return {
    schema: "page-image-workflow-source-v1",
    pipeline: "page-image-workflow-v1",
    workflow,
    source_sha256: "a".repeat(64),
    slides: [{
      slide_id: "DeckGo",
      position: 1,
      provider_content: {
        items: [
          { role: "metric", literal: "92%", copy_policy: "exact" },
          { role: "supporting_copy", literal: "A practical service promise", copy_policy: "presentation_adaptable" },
        ],
      },
      header_policy: workflow === "framed"
        ? {
          frame_preset: "standard-v1",
          local_header: { kicker: "Operations", title: "A current source", subtitle: null },
          context_not_to_render: { kicker: "Operations", title: "A current source", subtitle: null },
        }
        : { provider_visible: { kicker: "Operations", title: "A current source", subtitle: null } },
      visual_language: selection,
    }],
  };
}

function coreInputs(receipt) {
  return {
    sourceReceipt: receipt,
    visualSelections: receipt.slides.map((slide) => ({ slide_id: slide.slide_id, selection: slide.visual_language })),
    styleMasterSelection: { workflow: receipt.workflow, selection_sha256: "b".repeat(64) },
    generationProfile: { provider: { model: "gpt-image-2" }, output: { format: "png" } },
    headerRenderingPolicy: { workflow: receipt.workflow, policy: receipt.workflow === "framed" ? "local-transparent-overlay" : "provider-visible" },
  };
}

describe("Page Image Core", () => {
  it("returns immutable shared semantic facts and canonical UTF-8 identities", () => {
    const receipt = sourceReceipt();
    const facts = createPageImageCoreFacts(coreInputs(receipt));

    expect(facts).toMatchObject({
      schema: PAGE_IMAGE_CORE_FACTS_SCHEMA,
      workflow: "framed",
      source_receipt_sha256: "a".repeat(64),
      slides: [{
        slide_id: "DeckGo",
        position: 1,
        header_policy: {
          context_not_to_render: { title: "A current source" },
        },
      }],
    });
    expect(facts.slides[0].provider_content.items[0]).toEqual({ role: "metric", literal: "92%", copy_policy: "exact" });
    expect(facts.slides[0].canonical_semantic_json).toContain('"slide_id":"DeckGo"');
    expect(facts.slides[0].canonical_semantic_sha256).toHaveLength(64);
    expect(facts.canonical_facts_sha256).toHaveLength(64);
    expect(Object.isFrozen(facts.slides[0].provider_content.items[0])).toBe(true);
  });

  it("gives both policies the same normalized provider content while keeping header policy isolated", () => {
    const framed = createPageImageCoreFacts(coreInputs(sourceReceipt({ workflow: "framed" })));
    const pure = createPageImageCoreFacts(coreInputs(sourceReceipt({ workflow: "pure" })));

    expect(framed.slides[0].provider_content).toEqual(pure.slides[0].provider_content);
    expect(framed.slides[0].header_policy).toHaveProperty("context_not_to_render");
    expect(pure.slides[0].header_policy).toHaveProperty("provider_visible");
  });

  it("owns literal-policy validation and normalizes exact as the default", () => {
    expect(normalizePageImageProviderContent({
      items: [{ role: "body", literal: "An exact sentence" }],
    })).toEqual({
      items: [{ role: "body", literal: "An exact sentence", copy_policy: "exact" }],
    });
    expect(() => normalizePageImageProviderContent({
      items: [{ role: "metric", literal: "92%", copy_policy: "presentation_adaptable" }],
    })).toThrow(PageImageCoreError);
  });

  it("rejects mismatched selected visual facts, headers, and workflow scope", () => {
    const receipt = sourceReceipt();
    const visualMismatch = coreInputs(receipt);
    visualMismatch.visualSelections[0] = { slide_id: "DeckGo", selection: { projection: { recipe: { id: "other" } } } };
    expect(() => createPageImageCoreFacts(visualMismatch)).toThrow(/exactly match/);

    expect(() => normalizePageImageHeaderPolicy({
      frame_preset: "standard-v1",
      local_header: { kicker: null, title: "A title", subtitle: null },
      context_not_to_render: { kicker: null, title: "A different title", subtitle: null },
    }, "framed")).toThrow(/same exact literals/);

    const scopeMismatch = coreInputs(receipt);
    scopeMismatch.styleMasterSelection.workflow = "pure";
    expect(() => createPageImageCoreFacts(scopeMismatch)).toThrow(/does not bind/);
  });
});
