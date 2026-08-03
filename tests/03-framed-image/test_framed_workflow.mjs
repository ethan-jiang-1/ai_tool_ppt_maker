import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs";
import { canonicalJsonSha256 } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/canonical_json.mjs";
import {
  classifyFramedRefresh,
  createFramedRawWorkPlan,
  publishFramedFinalSlideManifest,
  readFramedTargetStoredPlanContext,
  resolveFramedTextFramePreset,
  authorizeFramedTargetRawPlan,
  authorizeFramedProgressiveRawBatch,
  acceptFramedProgressivePilot,
  acceptFramedProgressiveRawReview,
  buildFramedProgressiveTargetRawPlan,
  buildFramedTargetDelivery,
  buildFramedTargetRawPlan,
  decideFramedTargetRawReview,
  generateFramedProgressiveRawItem,
  generateFramedTargetRawPlan,
  planFramedTargetPilot,
  prepareFramedProgressivePilotReview,
  prepareFramedProgressiveRawReview,
  prepareFramedTargetRawReview,
  refreshFramedTargetNotes,
  refreshFramedTargetText,
  resolveFramedStyleMasterScope,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs";
import { verifyFramedRenderContracts } from "../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_render_contract.mjs";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { inspectWorkflow } from "../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";
import {
  readProgressiveAcceptedRawWork,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_raw_owner.mjs";
import {
  readProgressiveRawPlanDirectRecords,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_store.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const digest = (letter) => letter.repeat(64);
const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const NATIVE_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

function runFlow(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

const receipt = {
  schema: "page-authority-image2-source-v2", pipeline: "page-authority-image2-v2", workflow: "framed", source_sha256: digest("a"),
  slides: [{ slide_id: "DeckGo", workflow: "framed", text_frame: { preset: "standard-v1", kicker: null, title: "A title", subtitle: null, callout: null } }],
};

describe("Framed target workflow", () => {
  it("normalizes standard-v1 to only rendered frame facts", () => {
    const preset = resolveFramedTextFramePreset("standard-v1");
    expect(preset).toMatchObject({
      canvas: { css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 },
      theme: { panel: "#f5f0eb", panel_opacity: 0.96, text: "#2d1b11" },
      variants: {
        callout_absent: { id: "callout_absent", panels: [{ id: "header", x: 40, y: 28, width: 920, height: 238 }] },
        callout_present: { id: "callout_present", panels: [{ id: "header" }, { id: "callout", x: 40, y: 482, width: 920, height: 48 }] },
      },
    });
    expect(preset.theme).not.toHaveProperty("border");
    for (const variant of Object.values(preset.variants)) {
      for (const panel of variant.panels) {
        expect(panel).not.toHaveProperty("opacity");
        expect(panel).not.toHaveProperty("padding");
      }
    }
  });

  it("compiles provider_clauses text and VISUAL SCENE into the Framed raw contract", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-scene-contract-"));
    const deck = join(root, "deck_framed_scene");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed target fact
**VISUAL SCENE**: two agents at a shared desk calm work setting
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Framed scene source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const plan = await buildFramedTargetRawPlan(runDir);
      const contract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      expect(contract.provider_clauses).toEqual(expect.objectContaining({
        recipe: expect.any(String),
        composition: expect.any(String),
        motifs: expect.any(Array),
      }));
      expect(contract.visual_scene).toBe("two agents at a shared desk calm work setting");
      expect(contract.visual_identity_role_clause).toBeNull();
      expect(contract.framed.text_free).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects the 28-W regression through the canonical browser render contract", async () => {
    const textFrame = {
      preset: "standard-v1",
      kicker: null,
      title: "W".repeat(28),
      subtitle: null,
      callout: null,
    };
    await expect(verifyFramedRenderContracts([{
      slide_id: "WideW",
      text_frame: textFrame,
    }])).rejects.toMatchObject({
      code: "framed_text_fit_failed",
      message: expect.stringContaining("scroll overflow"),
    });
  }, 20_000);

  it("does not materialize source lineage or a raw plan when browser proof rejects the candidate", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-proof-before-write-"));
    const deck = join(root, "deck_framed_proof_before_write");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
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

**TITLE**: ${"W".repeat(28)}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Candidate proof must fail before materialization.
`);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const paths = pageAuthorityImage2Paths(runDir);
      const derived = [paths.target_source_receipt, paths.target_raw_plan, paths.target_raw_evidence, paths.target_raw_review, paths.target_final_manifest];
      const beforeState = readFileSync(join(deck, "_state", "state.yaml"));
      expect(derived.every((path) => !existsSync(path))).toBe(true);

      await expect(buildFramedTargetRawPlan(runDir, { allowSourceRebuild: true })).rejects.toMatchObject({
        code: "framed_text_fit_failed",
        message: expect.stringContaining("scroll overflow"),
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(beforeState);
      expect(derived.every((path) => !existsSync(path))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);

  it("fails closed on a post-proof plan write and repairs the same checkpoint without advancing state", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-plan-write-recovery-"));
    const deck = join(root, "deck_framed_plan_write_recovery");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
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

**TITLE**: Recover the exact plan checkpoint
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: A failed plan write must remain unauthorizable.
`);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const paths = pageAuthorityImage2Paths(runDir);
      mkdirSync(paths.target_raw_plan, { recursive: true });

      await expect(buildFramedTargetRawPlan(runDir)).rejects.toThrow();
      const stateAfterFailure = readFileSync(join(deck, "_state", "state.yaml"));
      const receiptAfterFailure = readFileSync(paths.target_source_receipt);
      await expect(authorizeFramedTargetRawPlan(runDir, { planHash: "a".repeat(64) }))
        .rejects.toMatchObject({ code: "target_raw_plan_required" });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateAfterFailure);
      expect(readFileSync(paths.target_source_receipt)).toEqual(receiptAfterFailure);

      rmSync(paths.target_raw_plan, { recursive: true, force: true });
      const repaired = await buildFramedTargetRawPlan(runDir);
      expect(readFramedTargetStoredPlanContext(runDir).source_epoch).toBe(1);
      expect(canonicalJsonSha256(JSON.parse(readFileSync(paths.target_raw_plan, "utf8"))))
        .toBe(repaired.raw_work_plan.sha256);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateAfterFailure);
      expect(readFileSync(paths.target_source_receipt)).toEqual(receiptAfterFailure);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);

  it("rejects a Pure receipt before creating target work", () => {
    expect(() => createFramedRawWorkPlan({
      receipt: { ...receipt, workflow: "pure" },
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    }))
      .toThrow(/Framed workflow requires/);
  });

  it("keeps composition substitution below the public Framed workflow boundary", async () => {
    const rawWorkPlan = createFramedRawWorkPlan({ receipt, provider_profile_sha256: digest("b"), authorization_scope_sha256: digest("c"), raw_contracts_by_slide: { DeckGo: digest("d") } });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG } });
    for (const [key, value] of Object.entries({
      compose: async () => Buffer.from("injected"),
      preflight: { ok: true },
      markup: "<main>injected</main>",
      css: ".pm-slide { color: red; }",
      asset_paths: ["/private/path.png"],
      capture_options: { scale: "css" },
      publication_root: "/private/output",
    })) {
      await expect(publishFramedFinalSlideManifest({
        receipt,
        rawWorkPlan,
        acceptedRawEvidence,
        rawBytesBySlide: { DeckGo: NATIVE_PROVIDER_PNG },
        [key]: value,
      })).rejects.toMatchObject({ code: "framed_render_input_invalid" });
    }
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
      raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG },
    });
    const nextRawWorkPlan = createRawWorkPlan({
      source_receipt_sha256: next.source_sha256,
      workflow: "framed",
      ordered_slide_ids: ["DeckGo"],
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
    });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next, rawWorkPlan, acceptedRawEvidence, nextRawWorkPlan }))
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
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next, rawWorkPlan, acceptedRawEvidence }))
      .toMatchObject({ kind: "rebuild_raw", provider_required: true, reason: "raw_contract_or_profile_drift" });
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
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const plan = await buildFramedTargetRawPlan(runDir);
      const paths = pageAuthorityImage2Paths(runDir);
      const rawPlanBytes = readFileSync(paths.target_raw_plan);
      const sourceReceiptBytes = readFileSync(paths.target_source_receipt);
      const stateBeforeRawLifecycle = readState(deck, { purpose: "observe", runVersion: "v1" });
      const storedPlan = readFramedTargetStoredPlanContext(runDir);
      expect(storedPlan.source_epoch).toBe(1);
      expect(canonicalJsonSha256(storedPlan.raw_work_plan)).toBe(plan.raw_work_plan.sha256);
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })).toEqual(stateBeforeRawLifecycle);
      const projection = plan.raw_work_plan.sha256;
      expect(await authorizeFramedTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      expect(await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => NATIVE_PROVIDER_PNG,
      })).toMatchObject({ submitted: 1 });
      expect(await prepareFramedTargetRawReview(runDir)).toMatchObject({ raw_review_sha256: expect.any(String) });
      const reviewProjection = createCanvas(1032, 347);
      const reviewContext = reviewProjection.getContext("2d");
      reviewContext.drawImage(await loadImage(readFileSync(paths.target_raw_review_projection)), 0, 0);
      const guidePixels = reviewContext.getImageData(16, 16, 500, 143).data;
      expect(Array.from(guidePixels).some((_channel, index) => index % 4 === 0 &&
        guidePixels[index] > 180 && guidePixels[index + 1] > 75 && guidePixels[index + 1] < 150 && guidePixels[index + 2] < 60)).toBe(true);
      expect(await decideFramedTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "framed" },
      });
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(1);
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
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const initialPlan = await buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      await authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedTargetRawReview(runDir);
      await decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      expect(providerSubmissions).toBe(1);

      const paths = pageAuthorityImage2Paths(runDir);
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const previousRawBytes = readFileSync(join(paths.raw_root, "01_DeckGo.png"));
      const authorizationBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_raw_provider_authorization.by_version["3_versions/v1"];
      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated heading"));

      const refreshed = await refreshFramedTargetText(runDir, { slideIds: ["DeckGo"] });
      expect(refreshed).toMatchObject({ ok: true, refreshed_slide_ids: ["DeckGo"], delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(previousRawBytes);
      const currentEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      expect(currentEvidence).not.toEqual(previousEvidence);
      expect(currentEvidence.provider_authorization_sha256).toBe(previousEvidence.provider_authorization_sha256);
      expect(currentEvidence.items).toEqual(previousEvidence.items);
      const state = readState(deck, { purpose: "observe", runVersion: "v1" });
      const target = state.page_authority_target_evidence.by_version["3_versions/v1"];
      expect(target).toMatchObject({ workflow: "framed", source_epoch: 1, accepted_raw_evidence_sha256: expect.any(String), final_manifest_sha256: expect.any(String), delivery_receipt_sha256: expect.any(String) });
      expect(state.page_authority_raw_provider_authorization.by_version["3_versions/v1"]).toEqual(authorizationBefore);
      expect(target.accepted_raw_evidence_sha256).not.toBe(canonicalJsonSha256(previousEvidence));

      const finalBytes = readFileSync(join(paths.final_root, "01_DeckGo.png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated heading", "Updated source-owned note."));
      const notes = await refreshFramedTargetNotes(runDir);
      expect(notes).toMatchObject({ ok: true, delivery: { receipt: { notes_injected: 1 } } });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(previousRawBytes);
      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(finalBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retains accepted Framed progressive raw evidence for a Text Frame-only local rebind", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-local-rebind-"));
    const deck = join(root, "deck_framed_progressive_local_rebind");
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

> **SPEAKER NOTE**: Framed progressive local-rebind fixture.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original progressive heading"));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const initial = await buildFramedProgressiveTargetRawPlan(runDir);
      const initialPlanHash = initial.progressive_raw_work_plan.sha256;
      const paths = pageAuthorityImage2Paths(runDir);
      const initialInspectionBytes = readFileSync(paths.target_provider_request_inspection);
      const initialInspection = JSON.parse(initialInspectionBytes.toString("utf8"));
      const initialRequest = initial.provider_requests_by_slide.DeckGo;
      expect(initial.provider_request_inspection).toMatchObject({
        path: "_generated/page_authority_image2/raw/provider-request-inspection-v1.json",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        plan_hash: initialPlanHash,
      });
      expect(initialInspection).toMatchObject({
        schema: "page-authority-provider-request-inspection-v1",
        progressive_raw_work_plan_sha256: initialPlanHash,
        target_raw_work_plan_sha256: initial.raw_work_plan.sha256,
        source_receipt_sha256: initial.receipt.source_sha256,
        source_epoch: initial.source_epoch,
        workflow: "framed",
        provider_profile_sha256: initial.progressive_raw_work_plan.provider_profile_sha256,
        transport: { model: initialRequest.generation_profile.provider.model, size: "2000x1125" },
        ordered_slide_ids: ["DeckGo"],
      });
      expect(initialInspection.items).toEqual([{
        slide_id: "DeckGo",
        raw_contract_sha256: initial.progressive_raw_work_plan.items[0].raw_contract_sha256,
        provider_request_sha256: canonicalJsonSha256(initialRequest),
        prompt: JSON.stringify(initialRequest),
      }]);
      expect(JSON.stringify(initialInspection)).not.toMatch(/data:image|authorization|api[_-]?key/i);
      const pilot = await planFramedTargetPilot(runDir, {
        planHash: initialPlanHash,
        slideIds: ["DeckGo"],
      });
      await authorizeFramedProgressiveRawBatch(runDir, {
        planHash: initialPlanHash,
        batchHash: pilot.batch.batch_hash,
      });
      let providerSubmissions = 0;
      await generateFramedProgressiveRawItem(runDir, {
        planHash: initialPlanHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedProgressiveRawReview(runDir, { planHash: initialPlanHash });
      const accepted = await acceptFramedProgressiveRawReview(runDir, {
        planHash: initialPlanHash,
        decision: "proceed",
      });
      expect(providerSubmissions).toBe(1);
      expect(accepted.accepted_raw_evidence_sha256).toMatch(/^[0-9a-f]{64}$/);

      const initialAccepted = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "framed",
        plan_hash: initialPlanHash,
        expected_plan: initial.progressive_raw_work_plan,
      });
      const initialDirect = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash });
      const initialState = readState(deck, { purpose: "observe", runVersion: "v1" });
      expect(initialState.page_authority_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          raw_work_plan_sha256: initialPlanHash,
          complete_raw_review_sha256: initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
          accepted_raw_evidence_sha256: accepted.accepted_raw_evidence_sha256,
        });

      writeFileSync(join(runDir, "slide-specifications.md"), source("Rebound progressive heading"));
      const stateBeforeInspection = readFileSync(join(deck, "_state", "state.yaml"));
      const directBeforeInspection = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash });
      const inspection = inspectWorkflow({ runDir });
      expect(inspection).toMatchObject({
        posture: "guide",
        root_cause: { owner: "03-framed-image", kind: "framed-local-rebind-ready" },
        primary_action: { owner: "03-framed-image", action_id: "refresh_framed_text", requires_human: false },
        evidence_summary: { progressive: "framed-local-rebind", plan_hash: initialPlanHash },
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBeforeInspection);
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash })).toEqual(directBeforeInspection);

      const rebound = await buildFramedProgressiveTargetRawPlan(runDir);
      const reboundPlanHash = rebound.progressive_raw_work_plan.sha256;
      const reboundInspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      const reboundAccepted = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "framed",
        plan_hash: reboundPlanHash,
        expected_plan: rebound.progressive_raw_work_plan,
      });
      const successorDirect = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: reboundPlanHash });
      const reboundState = readState(deck, { purpose: "observe", runVersion: "v1" });

      expect(providerSubmissions).toBe(1);
      expect(reboundPlanHash).not.toBe(initialPlanHash);
      expect(rebound.provider_request_inspection).toMatchObject({
        path: initial.provider_request_inspection.path,
        plan_hash: reboundPlanHash,
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(rebound.provider_request_inspection.sha256).not.toBe(initial.provider_request_inspection.sha256);
      expect(reboundInspection.progressive_raw_work_plan_sha256).toBe(reboundPlanHash);
      expect(reboundInspection.source_receipt_sha256).not.toBe(initialInspection.source_receipt_sha256);
      expect(reboundInspection.items[0].provider_request_sha256)
        .toBe(canonicalJsonSha256(rebound.provider_requests_by_slide.DeckGo));
      expect(rebound.progressive_raw_work_plan.source_epoch).toBe(initial.progressive_raw_work_plan.source_epoch);
      expect(rebound.progressive_raw_work_plan.source_receipt_sha256)
        .not.toBe(initial.progressive_raw_work_plan.source_receipt_sha256);
      expect(rebound.progressive_publication).toMatchObject({
        reused_slide_ids: ["DeckGo"],
        retained_complete_raw_review_sha256: initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: reboundAccepted.accepted_raw_evidence_sha256,
      });
      expect(reboundAccepted.accepted_raw_evidence.complete_raw_review_sha256)
        .not.toBe(initialAccepted.accepted_raw_evidence.complete_raw_review_sha256);
      expect(successorDirect.batches).toHaveLength(0);
      expect(successorDirect.grants).toHaveLength(0);
      expect(successorDirect.attempts).toHaveLength(0);
      expect(successorDirect.materializations).toHaveLength(1);
      expect(successorDirect.materializations[0].provenance.record).toMatchObject({
        kind: "reuse",
        reused_from_provenance_sha256: initialDirect.materializations[0].provenance.sha256,
      });
      expect(successorDirect.complete_reviews.some((entry) =>
        entry.record.retained_from_complete_raw_review_sha256 === initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
      )).toBe(true);
      expect(reboundState.page_authority_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          source_epoch: initial.progressive_raw_work_plan.source_epoch,
          source_receipt_sha256: rebound.progressive_raw_work_plan.source_receipt_sha256,
          raw_work_plan_sha256: reboundPlanHash,
          complete_raw_review_sha256: reboundAccepted.accepted_raw_evidence.complete_raw_review_sha256,
          accepted_raw_evidence_sha256: reboundAccepted.accepted_raw_evidence_sha256,
        });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("publishes a partial Framed Pilot with raw underlay and production-equivalent Text Frame composite", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-pilot-"));
    const deck = join(root, "deck_framed_progressive_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo", "LineGo", "RoleGo", "PathGo", "DataMap"];
    const source = `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Framed Pilot ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`
`).join("\n")}> **SPEAKER NOTE**: Partial Framed Pilot fixture.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DataMap"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const rawBytes = NATIVE_PROVIDER_PNG;
      await generateFramedProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => rawBytes,
      });
      const evidence = await prepareFramedProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      });
      const paths = pageAuthorityImage2Paths(runDir);
      const pilotRoot = join(paths.review_root, "pilot", pilot.batch.batch_hash);
      const projection = JSON.parse(readFileSync(join(pilotRoot, "projection.json"), "utf8"));
      expect(evidence).toMatchObject({ pilot_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(readFileSync(join(pilotRoot, "raw-underlay", "10_DataMap.png"))).toEqual(rawBytes);
      expect(existsSync(join(pilotRoot, "text-frame-composite", "10_DataMap.png"))).toBe(true);
      expect(existsSync(join(pilotRoot, "raw-underlay", "DataMap.png"))).toBe(false);
      expect(existsSync(join(pilotRoot, "text-frame-composite", "DataMap.png"))).toBe(false);
      expect(projection).toMatchObject({
        schema: "page-authority-framed-pilot-projection-v1",
        workflow: "framed",
        raw_work_plan_sha256: planHash,
        batch_sha256: pilot.batch.batch_hash,
        items: [{ slide_id: "DataMap" }],
      });
      expect(projection.items[0]).not.toHaveProperty("path");
      expect(existsSync(paths.target_final_manifest)).toBe(false);

      const decision = await acceptFramedProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(decision).toMatchObject({
        pilot_decision_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        progressive_handoff: { partial_pilot_decision_sha256: expect.any(String) },
        next_action: { action_id: "plan_progressive_expansion" },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects Framed Pilot render overrides before resolving source or starting a browser", async () => {
    for (const override of [
      { renderer: "untrusted" },
      { html: "<main>untrusted</main>" },
      { css: "* { color: red; }" },
      { fontPath: "/tmp/untrusted.woff2" },
      { capture: { width: 1 } },
      { proof: { trusted: true } },
      { outputPath: "/tmp/untrusted-pilot" },
    ]) {
      await expect(prepareFramedProgressivePilotReview(join(tmpdir(), "missing-framed-pilot-run"), {
        planHash: digest("a"),
        batchHash: digest("b"),
        ...override,
      })).rejects.toMatchObject({
        code: "framed_pilot_input_invalid",
        message: expect.stringContaining("planHash and batchHash"),
      });
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
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const initialPlan = await buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      await authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedTargetRawReview(runDir);
      await decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      const paths = pageAuthorityImage2Paths(runDir);
      const rawBytes = readFileSync(join(paths.raw_root, "01_DeckGo.png"));
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));

      writeFileSync(join(runDir, "slide-specifications.md"), source("Refreshed CLI heading"));
      const result = runFlow(["refresh", runDir, "--kind", "title", "--only", "DeckGo"]);

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("Target Framed refresh delivered without provider submission");
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(rawBytes);
      expect(JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"))).not.toEqual(previousEvidence);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
