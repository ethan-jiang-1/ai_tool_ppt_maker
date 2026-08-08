import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAcceptedRawEvidence,
  createFinalSlideManifest,
  createRawWorkPlan,
  formatPageImageOrdinal,
  pageImageOrdinalImageFilename,
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { resolveTargetCandidateSourceContext } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { statePath } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function plan(workflow = "framed") {
  return createRawWorkPlan({
    source_receipt_sha256: digest("a"),
    workflow,
    ordered_slide_ids: ["DeckGo", "BodyMap"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [
      { slide_id: "DeckGo", raw_contract_sha256: digest("d"), provider_input_binding: pageImageProviderInputBinding({ workflow, compiled: "1" }) },
      { slide_id: "BodyMap", raw_contract_sha256: digest("e"), provider_input_binding: pageImageProviderInputBinding({ workflow, compiled: "2" }) },
    ],
  });
}

describe("Page Image typed artifacts", () => {
  it("binds ordered raw evidence and final slides to the selected workflow", () => {
    const rawPlan = plan();
    const evidence = createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a"), BodyMap: Buffer.from("raw-b") },
    });
    const manifest = createFinalSlideManifest({
      evidence,
      expected_workflow: "framed",
      final_bytes_by_slide: { DeckGo: Buffer.from("final-a"), BodyMap: Buffer.from("final-b") },
    });
    expect(validateRawWorkPlan(rawPlan)).toMatchObject({ ok: true });
    expect(validateAcceptedRawEvidence(evidence, { plan: rawPlan })).toMatchObject({ ok: true });
    expect(validateFinalSlideManifest(manifest, { evidence, expectedWorkflow: "framed" })).toMatchObject({ ok: true });
    expect(manifest.items.map((item) => [item.slide_id, item.position])).toEqual([["DeckGo", 1], ["BodyMap", 2]]);
    expect(manifest.items.map((item) => item.path)).toEqual(["01_DeckGo.png", "02_BodyMap.png"]);
  });

  it("uses one ordinal projection for human-facing files while evidence keeps stable paths", () => {
    const slideIds = Array.from({ length: 100 }, (_, index) => `Slide${String(index + 1).padStart(3, "0")}`);
    const rawPlan = createRawWorkPlan({
      source_receipt_sha256: digest("a"),
      workflow: "pure",
      ordered_slide_ids: slideIds,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      items: slideIds.map((slide_id) => ({
        slide_id,
        raw_contract_sha256: digest("d"),
        provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
      })),
    });
    const rawBytesBySlide = Object.fromEntries(slideIds.map((slideId) => [slideId, Buffer.from(`raw-${slideId}`)]));
    const finalBytesBySlide = Object.fromEntries(slideIds.map((slideId) => [slideId, Buffer.from(`final-${slideId}`)]));
    const evidence = createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: rawBytesBySlide,
    });
    const reorderedSlideIds = [...slideIds].reverse();
    const reorderedPlan = createRawWorkPlan({
      source_receipt_sha256: digest("a"),
      workflow: "pure",
      ordered_slide_ids: reorderedSlideIds,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      items: reorderedSlideIds.map((slide_id) => ({
        slide_id,
        raw_contract_sha256: digest("d"),
        provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
      })),
    });
    const reorderedEvidence = createAcceptedRawEvidence({
      plan: reorderedPlan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: rawBytesBySlide,
    });
    const manifest = createFinalSlideManifest({
      evidence,
      expected_workflow: "pure",
      final_bytes_by_slide: finalBytesBySlide,
    });

    expect(formatPageImageOrdinal(1)).toBe("01");
    expect(formatPageImageOrdinal(10)).toBe("10");
    expect(formatPageImageOrdinal(100)).toBe("100");
    expect(pageImageOrdinalImageFilename(1, "DeckGo")).toBe("01_DeckGo.png");
    expect(pageImageOrdinalImageFilename(10, "DataMap")).toBe("10_DataMap.png");
    expect(pageImageOrdinalImageFilename(100, "Slide100")).toBe("100_Slide100.png");
    expect(() => formatPageImageOrdinal(0)).toThrow(/positive integer/);
    expect(() => formatPageImageOrdinal(1.5)).toThrow(/positive integer/);
    expect(() => pageImageOrdinalImageFilename(1, "01_DeckGo")).toThrow(/stable Page Image slide ID/);
    expect(manifest.items.at(0).path).toBe("01_Slide001.png");
    expect(manifest.items.at(9).path).toBe("10_Slide010.png");
    expect(manifest.items.at(99).path).toBe("100_Slide100.png");
    expect(evidence.items.at(0).path).toBe("Slide001.png");
    expect(evidence.items.at(9).path).toBe("Slide010.png");
    expect(evidence.items.at(99).path).toBe("Slide100.png");
    expect(reorderedEvidence.items.find((item) => item.slide_id === "Slide001"))
      .toEqual(evidence.items.find((item) => item.slide_id === "Slide001"));
    expect(pageImageOrdinalImageFilename(1, "Slide001")).toBe("01_Slide001.png");
    expect(pageImageOrdinalImageFilename(100, "Slide001")).toBe("100_Slide001.png");
    expect(validateFinalSlideManifest(manifest, { evidence, expectedWorkflow: "pure" })).toMatchObject({ ok: true });
  });

  it("fails closed for source/profile/evidence drift and wrong workflow publication", () => {
    const rawPlan = plan("pure");
    const evidence = createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a"), BodyMap: Buffer.from("raw-b") },
    });
    const unboundPlan = structuredClone(rawPlan);
    delete unboundPlan.items[0].provider_input_binding;
    expect(validateRawWorkPlan(unboundPlan)).toMatchObject({ ok: false, code: "raw_plan_invalid" });
    const pureWithoutDeckSystem = structuredClone(rawPlan);
    pureWithoutDeckSystem.items[0].provider_input_binding.deck_visual_system_sha256 = null;
    expect(validateRawWorkPlan(pureWithoutDeckSystem)).toMatchObject({
      ok: false,
      code: "raw_plan_provider_input_binding_invalid",
    });
    const framedWithDeckSystem = structuredClone(plan("framed"));
    framedWithDeckSystem.items[0].provider_input_binding.deck_visual_system_sha256 = digest("9");
    expect(validateRawWorkPlan(framedWithDeckSystem)).toMatchObject({
      ok: false,
      code: "raw_plan_provider_input_binding_invalid",
    });
    expect(validateAcceptedRawEvidence(evidence, { plan: { ...rawPlan, provider_profile_sha256: digest("9") } })).toMatchObject({ ok: false, code: "raw_evidence_stale" });
    expect(() => createFinalSlideManifest({
      evidence,
      expected_workflow: "framed",
      final_bytes_by_slide: { DeckGo: Buffer.from("final-a"), BodyMap: Buffer.from("final-b") },
    })).toThrow(/selected workflow/);
    expect(validateFinalSlideManifest({
      schema: "page-image-final-slide-manifest-v1",
      source_receipt_sha256: digest("a"),
      accepted_raw_evidence_sha256: digest("b"),
      workflow: "pure",
      items: [{ slide_id: "DeckGo", position: 1, final_sha256: digest("c"), path: "01_DeckGo.png" }],
    }, { evidence, expectedWorkflow: "pure" })).toMatchObject({ ok: false, code: "final_manifest_stale" });
    expect(validateAcceptedRawEvidence({
      schema: "pptmaker-page-image-raw-manifest-v1",
      raw_work_plan_sha256: rawPlan.sha256,
      source_receipt_sha256: rawPlan.source_receipt_sha256,
      workflow: "pure",
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      items: [],
    }, { plan: rawPlan })).toMatchObject({ ok: false, code: "raw_evidence_invalid" });
    expect(validateAcceptedRawEvidence({
      schema: "page-authority-accepted-raw-evidence-v2",
    }, { plan: rawPlan })).toMatchObject({ ok: false, code: "UNSUPPORTED_PROTOCOL" });
    expect(() => createAcceptedRawEvidence({
      plan: rawPlan,
      provider_authorization_sha256: digest("f"),
      raw_review_sha256: digest("0"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw-a") },
    })).toThrow(/cover the raw work plan exactly/);
  });

  it("reads a selected-workflow source candidate without materializing lineage", () => {
    const root = mkdtempSync(join(tmpdir(), "target-candidate-source-"));
    const deck = join(root, "deck_candidate_source");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const sourcePath = join(runDir, "slide-specifications.md");
      const sourceText = "candidate source bytes\n";
      writeFileSync(sourcePath, sourceText, "utf8");
      const paths = pageImageWorkflowPaths(runDir);
      const derived = [
        paths.target_source_receipt,
        paths.target_raw_plan,
        paths.target_raw_evidence,
        paths.target_raw_review,
        paths.target_raw_review_projection,
        paths.target_final_manifest,
      ];
      const beforeState = readFileSync(statePath(deck));
      expect(derived.every((path) => !existsSync(path))).toBe(true);

      let parserInput = null;
      const candidate = resolveTargetCandidateSourceContext(runDir, {
        workflow: "framed",
        parseReceipt: (input) => {
          parserInput = input;
          return {
            schema: "page-image-workflow-source-v1",
            pipeline: "page-image-workflow-v1",
            workflow: "framed",
            source_sha256: sha256(input.sourceText),
            slides: [{ slide_id: "DeckGo", position: 1 }],
          };
        },
      });

      expect(parserInput).toMatchObject({ runDir, deckDir: deck, sourcePath, sourceText });
      expect(candidate).toMatchObject({
        run_dir: runDir,
        deck_dir: deck,
        source_path: sourcePath,
        source_sha256: sha256(sourceText),
        workflow: "framed",
        receipt: { source_sha256: sha256(sourceText) },
      });
      expect(candidate).not.toHaveProperty("source_epoch");
      expect(readFileSync(statePath(deck))).toEqual(beforeState);
      expect(derived.every((path) => !existsSync(path))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
