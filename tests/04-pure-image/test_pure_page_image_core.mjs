import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
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
        protected_geometry_sha256: null,
      });
      const serialized = JSON.stringify(contract);
      expect(contract.page_presentation.binding_sha256).toBe(coreSlide.page_presentation_sha256);
      expect(JSON.parse(request.compiled_provider_input.utf8).page_presentation).toEqual(contract.page_presentation);
      expect(serialized).not.toContain("local_header");
      expect(serialized).not.toContain("context_not_to_render");
      expect(serialized).not.toContain("protected_geometry");
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
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
