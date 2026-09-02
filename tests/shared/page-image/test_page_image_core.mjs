// Tests: openspec/specs/visual-config/spec.md
import { describe, expect, it } from "vitest";

import {
  PAGE_IMAGE_CORE_FACTS_SCHEMA,
  PageImageCoreError,
  createPageImageCoreFacts,
  createPageImageProviderInputBinding,
  normalizePageImageHeaderPolicy,
  normalizePageImageProviderContent,
} from "../../../ppt_maker_harness/scripts/shared/page-image/page_image_core.mjs";
import {
  hasCurrentPageImageSourceReceiptEnvelope,
} from "../../../ppt_maker_harness/scripts/shared/page-image/page_image_source_receipt.mjs";

function visualSelection(workflow) {
  return {
    projection: { recipe: { id: "editorial-systems" } },
    provider_clauses: { recipe: "architectural editorial scene" },
    presentation: {
      schema: "page-layout",
      artifact_role: "resolved-presentation",
      workflow,
      page_class: "standard",
      profile_id: "standard",
      subject_restrictions: "none",
      binding_sha256: "c".repeat(64),
      provenance: { catalog: "catalog.yaml", defaults: "defaults.yaml", profile: "profile.yaml" },
    },
  };
}

function sourceReceipt({ workflow = "framed" } = {}) {
  const selection = visualSelection(workflow);
  return {
    schema: "page-source-receipt",
    artifact_role: "parsed-source",
    pipeline: "page-image-workflow",
    workflow,
    source_sha256: "a".repeat(64),
    slides: [{
      slide_id: "DeckGo",
      position: 1,
      page_class: "standard",
      subject_restrictions: "none",
      provider_content: {
        items: [
          { role: "metric", literal: "92%", copy_policy: "exact" },
          { role: "supporting_copy", literal: "A practical service promise", copy_policy: "presentation_adaptable" },
        ],
      },
      header_policy: workflow === "framed"
        ? {
          local_header: { kicker: "Operations", title: "A current source", subtitle: null },
        }
        : { provider_visible: { kicker: "Operations", title: "A current source", subtitle: null } },
      visual_language: selection,
    }],
  };
}

function coreInputs(receipt, { pageDesignSystemSha256 = null } = {}) {
  return {
    sourceReceipt: receipt,
    visualSelections: receipt.slides.map((slide) => ({ slide_id: slide.slide_id, selection: slide.visual_language })),
    styleMasterSelection: { workflow: receipt.workflow, selection_sha256: "b".repeat(64) },
    generationProfile: { provider: { model: "gpt-image-2" }, output: { format: "png" } },
    headerRenderingPolicy: { workflow: receipt.workflow, policy: receipt.workflow === "framed" ? "local-transparent-overlay" : "provider-visible" },
    pageDesignSystemSha256,
  };
}

describe("Page Image Core", () => {
  it("accepts only the declared parsed-source receipt envelope", () => {
    const receipt = sourceReceipt({ workflow: "pure" });
    expect(hasCurrentPageImageSourceReceiptEnvelope(receipt, { workflow: "pure" })).toBe(true);
    expect(hasCurrentPageImageSourceReceiptEnvelope({ ...receipt, artifact_role: "reviewable-page" })).toBe(false);
    expect(hasCurrentPageImageSourceReceiptEnvelope({ ...receipt, schema: ["page-image-workflow", "source"].join("-") })).toBe(false);
    expect(hasCurrentPageImageSourceReceiptEnvelope({ ...receipt, stage: "page-source-receipt" })).toBe(false);
  });

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
        subject_restrictions: "none",
        header_policy: {
          local_header: { title: "A current source" },
        },
      }],
    });
    expect(facts.slides[0].provider_content.items[0]).toEqual({ role: "metric", literal: "92%", copy_policy: "exact" });
    expect(facts.slides[0].canonical_semantic_json).toContain('"slide_id":"DeckGo"');
    expect(facts.slides[0].canonical_semantic_sha256).toHaveLength(64);
    expect(facts.slides[0].page_design_system_sha256).toBeNull();
    expect(facts.canonical_facts_sha256).toHaveLength(64);
    expect(Object.isFrozen(facts.slides[0].provider_content.items[0])).toBe(true);
  });

  it("gives both policies the same normalized provider content while keeping header policy isolated", () => {
    const framed = createPageImageCoreFacts(coreInputs(sourceReceipt({ workflow: "framed" })));
    const pure = createPageImageCoreFacts(coreInputs(sourceReceipt({ workflow: "pure" })));

    expect(framed.slides[0].provider_content).toEqual(pure.slides[0].provider_content);
    expect(framed.slides[0].header_policy).toHaveProperty("local_header");
    expect(framed.slides[0].header_policy).not.toHaveProperty("context_not_to_render");
    expect(pure.slides[0].header_policy).toHaveProperty("provider_visible");
    expect(framed.slides[0].page_presentation_sha256).toBe("c".repeat(64));
    expect(pure.slides[0].page_presentation_sha256).toBe("c".repeat(64));
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

  it("binds an explicit nullable Page Design System digest into Core semantics and provider lineage", () => {
    const receipt = sourceReceipt({ workflow: "pure" });
    const nullFacts = createPageImageCoreFacts(coreInputs(receipt));
    const digest = "d".repeat(64);
    const boundFacts = createPageImageCoreFacts(coreInputs(receipt, { pageDesignSystemSha256: digest }));

    expect(boundFacts.page_design_system_sha256).toBe(digest);
    expect(boundFacts.slides[0].page_design_system_sha256).toBe(digest);
    expect(boundFacts.slides[0].canonical_semantic_sha256).not.toBe(nullFacts.slides[0].canonical_semantic_sha256);
    expect(createPageImageProviderInputBinding({
      coreSlide: boundFacts.slides[0],
      compiledProviderInputSha256: "e".repeat(64),
    })).toMatchObject({ page_design_system_sha256: digest });

    const missing = coreInputs(receipt);
    delete missing.pageDesignSystemSha256;
    expect(() => createPageImageCoreFacts(missing)).toThrow(/pageDesignSystemSha256/);
    expect(() => createPageImageCoreFacts(coreInputs(receipt, { pageDesignSystemSha256: "D".repeat(64) })))
      .toThrow(/lowercase SHA-256/);
  });

  it("rejects mismatched selected visual facts, headers, and workflow scope", () => {
    const receipt = sourceReceipt();
    const visualMismatch = coreInputs(receipt);
    visualMismatch.visualSelections[0] = { slide_id: "DeckGo", selection: { projection: { recipe: { id: "other" } } } };
    expect(() => createPageImageCoreFacts(visualMismatch)).toThrow(/presentation facts/);

    expect(() => normalizePageImageHeaderPolicy({
      local_header: { kicker: null, title: "A title", subtitle: null },
      context_not_to_render: { kicker: null, title: "A different title", subtitle: null },
    }, "framed")).toThrow(/local_header only/);

    const missingRestriction = sourceReceipt();
    delete missingRestriction.slides[0].subject_restrictions;
    expect(() => createPageImageCoreFacts(coreInputs(missingRestriction))).toThrow(/source receipt/);

    const malformedRestriction = sourceReceipt();
    malformedRestriction.slides[0].subject_restrictions = "no-robot";
    expect(() => createPageImageCoreFacts(coreInputs(malformedRestriction))).toThrow(/source receipt/);

    const scopeMismatch = coreInputs(receipt);
    scopeMismatch.styleMasterSelection.workflow = "pure";
    expect(() => createPageImageCoreFacts(scopeMismatch)).toThrow(/does not bind/);

    const missingPresentation = coreInputs(sourceReceipt({ workflow: "pure" }));
    delete missingPresentation.visualSelections[0].selection.presentation;
    expect(() => createPageImageCoreFacts(missingPresentation)).toThrow(/presentation facts/);

    const legacyPresentation = coreInputs(sourceReceipt({ workflow: "pure" }));
    legacyPresentation.visualSelections[0].selection.presentation.stage = "page-layout";
    legacyPresentation.sourceReceipt.slides[0].visual_language.presentation.stage = "page-layout";
    expect(() => createPageImageCoreFacts(legacyPresentation)).toThrow(/presentation facts/);
  });
});
