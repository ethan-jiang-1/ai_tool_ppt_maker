import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import {
  buildPureTargetRawPlan,
  resolvePureStyleMasterScope,
  validatePureRawContract,
} from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const SOURCE = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
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

describe("Pure Page Image Core adapter", () => {
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
        schema: "page-image-core-facts-v1",
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
          schema: "page-image-core-slide-facts-v1",
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
        local_header_profile_sha256: null,
        protected_geometry_sha256: null,
      });
      const serialized = JSON.stringify(contract);
      expect(serialized).not.toContain("local_header");
      expect(serialized).not.toContain("context_not_to_render");
      expect(serialized).not.toContain("protected_geometry");
      expect(serialized).not.toContain("text_frame");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
