import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import { canonicalJsonSha256 } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/canonical_json.mjs";
import {
  classifyFramedRefresh,
  createFramedRawWorkPlan,
  prepareFramedRawContribution,
  publishFramedFinalSlideManifest,
  authorizeFramedTargetRawPlan,
  buildFramedTargetDelivery,
  buildFramedTargetRawPlan,
  decideFramedTargetRawReview,
  generateFramedTargetRawPlan,
  prepareFramedTargetRawReview,
  refreshFramedTargetNotes,
  refreshFramedTargetText,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const digest = (letter) => letter.repeat(64);
const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function runFlow(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

const receipt = {
  schema: "page-authority-image2-source-v2", pipeline: "page-authority-image2-v2", workflow: "framed", source_sha256: digest("a"),
  slides: [{ slide_id: "DeckGo", workflow: "framed", text_frame: { preset: "standard-v1", kicker: null, title: "A title", subtitle: null, callout: null } }],
};

describe("Framed target workflow", () => {
  it("rejects a Pure receipt before creating target work", () => {
    expect(() => prepareFramedRawContribution({ ...receipt, workflow: "pure" }))
      .toThrow(/Framed workflow requires/);
  });

  it("keeps Text Frame content local while composing final manifest bytes", async () => {
    const contribution = prepareFramedRawContribution(receipt);
    expect(contribution.items[0]).toMatchObject({ text_free: true, preflight: { preset: "standard-v1", reserved_underlay_rectangles: expect.any(Array) } });
    const rawWorkPlan = createFramedRawWorkPlan({ receipt, provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"), raw_contracts_by_slide: { DeckGo: digest("d") } });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: Buffer.from("raw") } });
    const manifest = await publishFramedFinalSlideManifest({
      receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide: { DeckGo: Buffer.from("raw") },
      compose: async ({ text_frame, raw_bytes }) => Buffer.from(`${raw_bytes}:${text_frame.title}`),
    });
    expect(manifest).toMatchObject({ workflow: "framed" });
  });

  it("keeps text-only refresh provider-free only with exact accepted underlay evidence", () => {
    const next = {
      ...receipt,
      source_sha256: digest("f"),
      slides: [{ ...receipt.slides[0], text_frame: { ...receipt.slides[0].text_frame, title: "Updated stable heading" } }],
    };
    const rawWorkPlan = createFramedRawWorkPlan({
      receipt,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    });
    const acceptedRawEvidence = createAcceptedRawEvidence({
      plan: rawWorkPlan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
    });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next, rawWorkPlan, acceptedRawEvidence }))
      .toMatchObject({ kind: "local_compose", provider_required: false });
    const styleMasterDrift = createRawWorkPlan({
      source_receipt_sha256: next.source_sha256,
      workflow: "framed",
      ordered_slide_ids: ["DeckGo"],
      provider_profile_sha256: digest("e"),
      authorization_scope_sha256: digest("f"),
      items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
    });
    expect(classifyFramedRefresh({
      previousReceipt: receipt,
      nextReceipt: next,
      rawWorkPlan,
      acceptedRawEvidence,
      nextRawWorkPlan: styleMasterDrift,
    })).toMatchObject({ kind: "rebuild_raw", provider_required: true, reason: "raw_contract_or_profile_drift" });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next }))
      .toMatchObject({ kind: "raw_evidence_required", provider_required: true });
    expect(classifyFramedRefresh({
      previousReceipt: receipt,
      nextReceipt: { ...next, slides: [{ ...next.slides[0], visual_brief: { recipe: "changed" } }] },
      rawWorkPlan,
      acceptedRawEvidence,
    })).toMatchObject({ kind: "rebuild_raw", provider_required: true });
  });

  it("runs the selected Framed receipt through local composition and shared delivery with a provider fake", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-lifecycle-"));
    const deck = join(root, "deck_framed_target");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed target fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Framed target source-owned note.
`);
      const plan = buildFramedTargetRawPlan(runDir);
      const projection = plan.raw_work_plan.sha256;
      expect(authorizeFramedTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      expect(await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => image.toBuffer("image/png"),
      })).toMatchObject({ submitted: 1 });
      expect(await prepareFramedTargetRawReview(runDir)).toMatchObject({ raw_review_sha256: expect.any(String) });
      expect(decideFramedTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "framed" },
      });
      const delivery = await buildFramedTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rebinds exact Framed underlay evidence for text-only refresh without another provider submission", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-refresh-"));
    const deck = join(root, "deck_framed_refresh");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = (title, note = "Framed target source-owned note.") => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: ${note}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original heading"));
      const initialPlan = buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return image.toBuffer("image/png");
        },
      });
      await prepareFramedTargetRawReview(runDir);
      decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      expect(providerSubmissions).toBe(1);

      const paths = pageAuthorityImage2Paths(runDir);
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const previousRawBytes = readFileSync(join(paths.raw_root, "DeckGo.png"));
      const authorizationBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_raw_provider_authorization.by_version["3_versions/v1"];
      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated heading"));

      const refreshed = await refreshFramedTargetText(runDir, { slideIds: ["DeckGo"] });
      expect(refreshed).toMatchObject({ ok: true, refreshed_slide_ids: ["DeckGo"], delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "DeckGo.png"))).toEqual(previousRawBytes);
      const currentEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      expect(currentEvidence).not.toEqual(previousEvidence);
      expect(currentEvidence.provider_authorization_sha256).toBe(previousEvidence.provider_authorization_sha256);
      expect(currentEvidence.items).toEqual(previousEvidence.items);
      const state = readState(deck, { purpose: "observe", runVersion: "v1" });
      const target = state.page_authority_target_evidence.by_version["3_versions/v1"];
      expect(target).toMatchObject({ workflow: "framed", source_epoch: 1, accepted_raw_evidence_sha256: expect.any(String), final_manifest_sha256: expect.any(String), delivery_receipt_sha256: expect.any(String) });
      expect(state.page_authority_raw_provider_authorization.by_version["3_versions/v1"]).toEqual(authorizationBefore);
      expect(target.accepted_raw_evidence_sha256).not.toBe(canonicalJsonSha256(previousEvidence));

      const finalBytes = readFileSync(join(paths.final_root, "DeckGo.png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated heading", "Updated source-owned note."));
      const notes = await refreshFramedTargetNotes(runDir);
      expect(notes).toMatchObject({ ok: true, delivery: { receipt: { notes_injected: 1 } } });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "DeckGo.png"))).toEqual(previousRawBytes);
      expect(readFileSync(join(paths.final_root, "DeckGo.png"))).toEqual(finalBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("runs the public title-refresh command through Framed local composition without provider work", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-cli-refresh-"));
    const deck = join(root, "deck_framed_cli_refresh");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Framed target source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original CLI heading"));
      const initialPlan = buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return image.toBuffer("image/png");
        },
      });
      await prepareFramedTargetRawReview(runDir);
      decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      const paths = pageAuthorityImage2Paths(runDir);
      const rawBytes = readFileSync(join(paths.raw_root, "DeckGo.png"));
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));

      writeFileSync(join(runDir, "slide-specifications.md"), source("Refreshed CLI heading"));
      const result = runFlow(["refresh", runDir, "--kind", "title", "--only", "DeckGo"]);

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("Target Framed refresh delivered without provider submission");
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "DeckGo.png"))).toEqual(rawBytes);
      expect(JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"))).not.toEqual(previousEvidence);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
