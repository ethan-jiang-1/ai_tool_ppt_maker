import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { createAcceptedRawEvidence } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  classifyPureRefresh,
  createPureRawWorkPlan,
  publishPureFinalSlideManifest,
  authorizePureTargetRawPlan,
  buildPureTargetDelivery,
  buildPureTargetRawPlan,
  decidePureTargetRawReview,
  generatePureTargetRawPlan,
  preparePureTargetRawReview,
  refreshPureTargetNotes,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const digest = (letter) => letter.repeat(64);
function receipt(source = "a") {
  return {
    schema: "page-authority-image2-source-v2", pipeline: "page-authority-image2-v2", workflow: "pure", source_sha256: digest(source),
    slides: [{ slide_id: "DeckGo", workflow: "pure", display: { title: "Visible pure text" } }],
  };
}

describe("Pure target workflow", () => {
  it("rejects a Framed receipt before creating target work", () => {
    expect(() => createPureRawWorkPlan({
      receipt: { ...receipt(), workflow: "framed" },
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    })).toThrow(/Pure workflow requires/);
  });

  it("publishes accepted Pure raw bytes directly as a common manifest", () => {
    const source = receipt();
    const rawWorkPlan = createPureRawWorkPlan({ receipt: source, provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"), raw_contracts_by_slide: { DeckGo: digest("d") } });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: Buffer.from("raw") } });
    expect(publishPureFinalSlideManifest({ receipt: source, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide: { DeckGo: Buffer.from("raw") } })).toMatchObject({ workflow: "pure" });
  });

  it("classifies visible-text source changes as raw rebuild debt", () => {
    expect(classifyPureRefresh({ previousReceipt: receipt("a"), nextReceipt: receipt("b") })).toMatchObject({ kind: "rebuild_raw", provider_required: true });
  });

  it("runs the selected Pure receipt through raw evidence, manifest, and shared delivery with a provider fake", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-lifecycle-"));
    const deck = join(root, "deck_pure_target");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (note) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: ${note}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Pure target source-owned note."));
      const plan = buildPureTargetRawPlan(runDir);
      const projection = plan.raw_work_plan.sha256;
      expect(authorizePureTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      let providerSubmissions = 0;
      expect(await generatePureTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return image.toBuffer("image/png");
        },
      })).toMatchObject({ submitted: 1 });
      expect(await preparePureTargetRawReview(runDir)).toMatchObject({ raw_review_sha256: expect.any(String) });
      expect(decidePureTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "pure" },
      });
      const delivery = await buildPureTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      const paths = pageAuthorityImage2Paths(runDir);
      const rawEvidenceBefore = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const sourceEpochBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch;

      writeFileSync(join(runDir, "slide-specifications.md"), source("Only the Pure speaker note changed."));
      await expect(refreshPureTargetNotes(runDir)).resolves.toMatchObject({ ok: true });
      const rawEvidenceAfter = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      expect(providerSubmissions).toBe(1);
      expect(rawEvidenceAfter.raw_review_sha256).toBe(rawEvidenceBefore.raw_review_sha256);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(sourceEpochBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("advances a target source epoch and rebuilds Pure raw work after visible source drift", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-rebuild-"));
    const deck = join(root, "deck_pure_rebuild");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure target source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original pure fact"));
      let providerSubmissions = 0;
      const submit = async () => {
        providerSubmissions += 1;
        return image.toBuffer("image/png");
      };

      const initial = buildPureTargetRawPlan(runDir);
      authorizePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);

      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated pure fact"));
      expect(() => buildPureTargetRawPlan(runDir)).toThrow("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
      const rebuilt = buildPureTargetRawPlan(runDir, { allowSourceRebuild: true });
      expect(rebuilt.source_epoch).toBe(2);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ source_epoch: 2, workflow: "pure", provider_authorization_sha256: null, accepted_raw_evidence_sha256: null });

      authorizePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);
      expect(providerSubmissions).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
