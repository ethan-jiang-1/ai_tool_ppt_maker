import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import {
  buildPureTargetRawPlan,
  buildPureProgressiveTargetRawPlan,
  resolvePureStyleMasterScope,
  resolvePureTargetCandidateSource,
  validatePureRawContract,
} from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  initBundle,
  pureDeckVisualSystemAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageDerivedPagePaths, pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { inspectProgressiveRawLifecycle } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import { statePath } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const SOURCE = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**KICKER**: Operations
**TITLE**: A complete provider-rendered page
**SUBTITLE**: Headers and structured body have one semantic owner
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: metric
    literal: "92%"
  - role: callout
    literal: "Escalations resolved within one working day"
  - role: supporting_copy
    literal: "A practical service promise"
    copy_policy: presentation_adaptable
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

const MULTI_SLIDE_SOURCE = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**KICKER**: Operations
**TITLE**: One deck system, distinct page facts
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: metric
    literal: "92%"
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
relationship: layer-stack
\`\`\`

## Slide 02: \`FlowUp\`

**KICKER**: Delivery
**TITLE**: A different literal and visual selection
**PAGE CLASS**: opening
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: "Teams see the handoff in one shared operating view."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs:
  - connected-nodes
negative_constraints:
  - no-logo
relationship: causal-flow
\`\`\`
`;

function captureError(action) {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error("expected action to fail");
}

describe("Pure Page Image Core adapter", () => {
  it("stops a missing Pure presentation source before Style Master readiness or source-plan writes", () => {
    const root = mkdtempSync(join(tmpdir(), "pure-page-image-core-missing-system-"));
    const deck = join(root, "deck_pure_page_image_core");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), SOURCE);
      rmSync(pureDeckVisualSystemAsset(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(statePath(deck));

      expect(captureError(() => buildPureTargetRawPlan(runDir))).toMatchObject({
        code: "page_image_presentation_source_missing",
      });
      expect(readFileSync(statePath(deck))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops a malformed unselected Pure profile before receipt, raw-plan, or state mutation", () => {
    const root = mkdtempSync(join(tmpdir(), "pure-page-image-core-malformed-sibling-"));
    const deck = join(root, "deck_pure_page_image_core");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), SOURCE);
      const pure = pureDeckVisualSystemAsset(runDir);
      writeFileSync(pure, readFileSync(pure, "utf8").replace("  opening:\n    typography:", "  opening:\n    provider_prompt: forbidden\n    typography:"));
      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(statePath(deck));

      expect(captureError(() => buildPureTargetRawPlan(runDir)).code).toMatch(/^page_image_presentation_/);
      expect(readFileSync(statePath(deck))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("compiles Core-owned headers and structured provider content without Framed renderer facts", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-page-image-core-"));
    const deck = join(root, "deck_pure_page_image_core");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), SOURCE);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const plan = buildPureTargetRawPlan(runDir);
      const coreSlide = plan.page_image_core.slides[0];
      const contract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      const request = plan.provider_requests_by_slide.DeckGo;
      const binding = plan.raw_work_plan.items[0].provider_input_binding;

      expect(plan.page_image_core).toMatchObject({
        schema: "page-image-core-facts",
        workflow: "pure",
        slides: [{
          slide_id: "DeckGo",
          header_policy: {
            provider_visible: {
              kicker: "Operations",
              title: "A complete provider-rendered page",
              subtitle: "Headers and structured body have one semantic owner",
            },
          },
        }],
      });
      expect(coreSlide.subject_restrictions).toBe("none");
      expect(contract).toMatchObject({
        workflow: "pure",
        page_image_core: {
          schema: "page-image-core-slide-facts",
          canonical_semantic_sha256: coreSlide.canonical_semantic_sha256,
        },
        provider_rendered_content: {
          header: coreSlide.header_policy.provider_visible,
          items: [
            { role: "metric", literal: "92%", copy_policy: "exact" },
            { role: "callout", literal: "Escalations resolved within one working day", copy_policy: "exact" },
            { role: "supporting_copy", literal: "A practical service promise", copy_policy: "presentation_adaptable" },
          ],
        },
      });
      expect(validatePureRawContract(contract)).toMatchObject({ ok: true });
      expect(binding).toMatchObject({
        compiled_provider_input_sha256: request.compiled_provider_input.sha256,
        provider_content_sha256: coreSlide.provider_content_sha256,
        visual_selection_sha256: coreSlide.visual_selection_sha256,
        style_master_selection_sha256: coreSlide.style_master_selection_sha256,
        generation_profile_sha256: coreSlide.generation_profile_sha256,
        header_policy_sha256: coreSlide.header_policy_sha256,
        page_presentation_sha256: coreSlide.page_presentation_sha256,
        local_header_profile_sha256: null,
        protected_composition_sha256: null,
      });
      const serialized = JSON.stringify(contract);
      expect(contract.page_presentation.binding_sha256).toBe(coreSlide.page_presentation_sha256);
      expect(JSON.parse(request.compiled_provider_input.utf8).page_presentation).toEqual(contract.page_presentation);
      expect(JSON.parse(request.compiled_provider_input.utf8)).not.toHaveProperty("subject_restrictions");
      expect(serialized).not.toContain("local_header");
      expect(serialized).not.toContain("protected_composition");
      expect(serialized).not.toContain("text_frame");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds each selected Pure presentation without treating inspection as acceptance", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-page-image-core-multi-"));
    const deck = join(root, "deck_pure_page_image_core");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), MULTI_SLIDE_SOURCE);
      const sourceBefore = resolvePureTargetCandidateSource(runDir).receipt;
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const [first, second] = plan.raw_work_plan.items;
      const firstRequest = plan.provider_requests_by_slide.DeckGo;
      const secondRequest = plan.provider_requests_by_slide.FlowUp;
      const firstInput = JSON.parse(firstRequest.compiled_provider_input.utf8);
      const secondInput = JSON.parse(secondRequest.compiled_provider_input.utf8);
      const inspection = JSON.parse(readFileSync(join(runDir, plan.provider_request_inspection.path), "utf8"));
      const paths = pageImageWorkflowPaths(runDir);
      const derivedIndex = JSON.parse(readFileSync(paths.derived_index, "utf8"));

      expect(first.provider_input_binding.page_presentation_sha256)
        .not.toBe(second.provider_input_binding.page_presentation_sha256);
      expect(firstInput.page_presentation).toMatchObject({ page_class: "standard", profile_id: "standard" });
      expect(secondInput.page_presentation).toMatchObject({ page_class: "opening", profile_id: "opening" });
      expect(firstRequest.raw_contract.page_presentation).not.toEqual(secondRequest.raw_contract.page_presentation);
      expect(firstRequest.raw_contract.provider_rendered_content).not.toEqual(secondRequest.raw_contract.provider_rendered_content);
      expect(firstRequest.raw_contract.visual_language).not.toEqual(secondRequest.raw_contract.visual_language);
      expect(inspection.items.map((item) => item.provider_input_binding.page_presentation_sha256))
        .toEqual([first.provider_input_binding.page_presentation_sha256, second.provider_input_binding.page_presentation_sha256]);
      expect(JSON.stringify(inspection)).not.toMatch(/api[_-]?key|authorization|data:image|accepted|selector|pixel/i);
      expect(inspection).not.toHaveProperty("accepted_raw_evidence_sha256");
      expect(sourceBefore.source_sha256).toBe(plan.receipt.source_sha256);
      expect(plan.derived_data_publication).toMatchObject({
        root: paths.derived_root,
        index: paths.derived_index,
        workflow: "pure",
        source_receipt_sha256: plan.receipt.source_sha256,
        raw_work_plan_sha256: plan.raw_work_plan.sha256,
        progressive_raw_work_plan_sha256: plan.progressive_raw_work_plan.sha256,
      });
      expect(derivedIndex.publication).toMatchObject({
        workflow: "pure",
        source_receipt_sha256: plan.receipt.source_sha256,
        progressive_raw_work_plan_sha256: plan.progressive_raw_work_plan.sha256,
      });
      expect(derivedIndex.payload.pages.map((page) => [page.position, page.slide_id]))
        .toEqual([[1, "DeckGo"], [2, "FlowUp"]]);
      for (const id of ["DeckGo", "FlowUp"]) {
        const pagePaths = pageImageDerivedPagePaths(runDir, id);
        for (const path of [
          pagePaths.source_receipt,
          pagePaths.layout,
          pagePaths.render_model,
          pagePaths.generation_spec,
          pagePaths.image2_request,
          pagePaths.artifact_index,
        ]) expect(existsSync(path)).toBe(true);
        expect(existsSync(pagePaths.framed_header_html)).toBe(false);
        const request = JSON.parse(readFileSync(pagePaths.image2_request, "utf8"));
        expect(request.payload.canonical_utf8).toBe(plan.provider_requests_by_slide[id].compiled_provider_input.utf8);
        expect(request.payload.request_digest).toBe(plan.provider_requests_by_slide[id].compiled_provider_input.sha256);
        expect(JSON.parse(readFileSync(pagePaths.artifact_index, "utf8")).payload.artifact_references)
          .not.toHaveProperty("framed_header_html");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops before current-plan publication when C5 replacement is invalid, then repairs through the same plan checkpoint", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-page-derived-publication-failure-"));
    const deck = join(root, "deck_pure_page_derived_failure");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), SOURCE);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const outside = join(root, "outside-derived");
      mkdirSync(outside);
      mkdirSync(dirname(paths.derived_root), { recursive: true });
      symlinkSync(outside, paths.derived_root);

      const error = captureError(() => buildPureProgressiveTargetRawPlan(runDir));
      expect(error).toMatchObject({
        code: "target_page_derived_publication_invalid",
        next_action: "rebuild_target_raw_plan",
      });
      const lifecycle = inspectProgressiveRawLifecycle({ runDir, workflow: "pure" });
      expect(lifecycle).toMatchObject({ ok: true, plan: null });
      expect(lifecycle).not.toHaveProperty("grant");
      expect(lifecycle).not.toHaveProperty("attempts");
      expect(lifecycle).not.toHaveProperty("review");

      rmSync(paths.derived_root);
      const repaired = buildPureProgressiveTargetRawPlan(runDir);
      expect(repaired.derived_data_publication.index).toBe(paths.derived_index);
      expect(repaired.progressive_raw_work_plan.sha256).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
