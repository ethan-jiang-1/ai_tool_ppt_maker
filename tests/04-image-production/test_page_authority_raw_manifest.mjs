import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  classifyPageAuthorityRawReuse,
  readPageAuthorityRawManifest,
  validatePageAuthorityRawManifest,
  writePageAuthorityRawManifest,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_manifest.mjs";
import {
  recordPageAuthorityRawProviderAuthorization,
  createInitialState,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { submitAuthorizedPageAuthorityRawBatch } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_compilation.mjs";
import {
  inspectPageAuthorityRawReviewCoverage,
  recordPageAuthorityRawReviewDecision,
  renderPageAuthorityRawReviewProjection,
  writePageAuthorityRawReviewCoverage,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_review.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import { finalizePage } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/finalizer.mjs";
import { assemblePageAuthorityPptx } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/pptx_assembly.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { applyPageAuthorityStructuralRaw, previewPageAuthorityStructuralRaw } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/structural_raw.mjs";

const digest = (letter) => letter.repeat(64);

function batch({ source = "a", contract = "c", profile = "b" } = {}) {
  return {
    schema: "pptmaker-page-authority-raw-batch-v1",
    source_sha256: digest(source),
    raw_generation_profile_digest: digest(profile),
    requests: [{
      slide_id: "DeckGo",
      authority: "framed-image2",
      raw_image_contract_digest: digest(contract),
      raw_generation_profile_digest: digest(profile),
      provider_payload: {},
    }],
  };
}

describe("Page Authority raw manifest", () => {
  it("reuses only the exact raw contract/profile/epoch tuple", () => {
    const deck = mkdtempSync(join(tmpdir(), "deck_page_authority_raw_"));
    const runDir = join(deck, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    try {
      const original = batch();
      writePageAuthorityRawManifest(runDir, {
        rawBatch: original,
        sourceEpoch: 1,
        images: { DeckGo: Buffer.from("raw-png") },
      });
      const manifest = readPageAuthorityRawManifest(runDir);
      expect(validatePageAuthorityRawManifest(manifest, { rawBatch: original, sourceEpoch: 1, runDir }).ok).toBe(true);
      expect(classifyPageAuthorityRawReuse({ rawBatch: batch({ source: "d" }), sourceEpoch: 1, runDir })[0].status).toBe("reusable");
      expect(classifyPageAuthorityRawReuse({ rawBatch: batch({ profile: "e" }), sourceEpoch: 1, runDir })[0]).toMatchObject({
        status: "needs_raw_generation", reason: "generation_profile_changed",
      });
      expect(classifyPageAuthorityRawReuse({ rawBatch: batch(), sourceEpoch: 2, runDir })[0]).toMatchObject({
        status: "needs_raw_generation", reason: "source_epoch_changed",
      });
      expect(classifyPageAuthorityRawReuse({ rawBatch: batch({ contract: "f" }), sourceEpoch: 1, runDir })[0]).toMatchObject({
        status: "needs_raw_generation", reason: "raw_contract_changed",
      });
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("short-circuits provider submission and requires current raw-review proceed coverage", async () => {
    const deck = mkdtempSync(join(tmpdir(), "deck_page_authority_gate_"));
    const runDir = join(deck, "3_versions", "v1");
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: page-authority-image2-v1\n  page_authority_default: framed-image2\n---\n", "utf8");
    const rawBatch = batch();
    let submits = 0;
    try {
      writeState(deck, createInitialState("gated", "keynote", "dark", { mode: "image2-page-authority" }));
      await expect(submitAuthorizedPageAuthorityRawBatch({
        deckDir: deck,
        runDir,
        rawBatch,
        submit: async () => { submits += 1; },
      })).rejects.toMatchObject({ code: "provider_authorization_required" });
      expect(submits).toBe(0);

      recordPageAuthorityRawProviderAuthorization(deck, { runDir, rawBatch, maxSubmissions: 1 });
      await submitAuthorizedPageAuthorityRawBatch({
        deckDir: deck,
        runDir,
        rawBatch,
        submit: async ({ request }) => { submits += 1; return request.slide_id; },
      });
      expect(submits).toBe(1);

      const canvas = createCanvas(32, 18);
      writePageAuthorityRawManifest(runDir, { rawBatch, sourceEpoch: 1, images: { DeckGo: canvas.toBuffer("image/png") } });
      const projection = await renderPageAuthorityRawReviewProjection(runDir, { rawBatch });
      writePageAuthorityRawReviewCoverage(runDir, { sourceEpoch: 1, projection });
      expect(inspectPageAuthorityRawReviewCoverage(runDir, { sourceEpoch: 1 })).toMatchObject({ kind: "confirm", code: "RAW_REVIEW_CONFIRM_REQUIRED" });
      recordPageAuthorityRawReviewDecision(runDir, { decision: "proceed" });
      expect(inspectPageAuthorityRawReviewCoverage(runDir, { sourceEpoch: 1 }).ok).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("finalizes Pure only through the shared receipt/evidence interface", async () => {
    const bytes = createCanvas(2000, 1125).toBuffer("image/png");
    const rawSha = createHash("sha256").update(bytes).digest("hex");
    const rawContract = digest("d");
    const result = await finalizePage(
      { slide_id: "DeckGo", authority: "pure-image2" },
      { bytes, sha256: rawSha, raw_image_contract_digest: rawContract },
      { ok: true, coverage: { decision: "proceed", tuples: [{ slide_id: "DeckGo", raw_sha256: rawSha }] } },
    );
    expect(result).toMatchObject({ slide_id: "DeckGo", authority: "pure-image2", final_sha256: rawSha, width: 2000, height: 1125 });
  });

  it("assembles only the ordered final-manifest entries", async () => {
    const deck = mkdtempSync(join(tmpdir(), "deck_page_authority_pptx_")); const runDir = join(deck, "3_versions", "v1"); mkdirSync(runDir, { recursive: true });
    try {
      const paths = pageAuthorityImage2Paths(runDir); mkdirSync(paths.final_root, { recursive: true });
      const bytes = createCanvas(2000, 1125).toBuffer("image/png"); const hash = createHash("sha256").update(bytes).digest("hex"); writeFileSync(join(paths.final_root, "DeckGo.png"), bytes);
      writeFileSync(paths.final_manifest, JSON.stringify({ schema: "pptmaker-page-authority-final-manifest-v1", entries: [{ slide_id: "DeckGo", final_sha256: hash, finalization_fingerprint: digest("e"), path: "DeckGo.png" }] }));
      const assembly = await assemblePageAuthorityPptx(runDir, { title: "Page Authority" });
      expect(assembly.receipt.ordered_slide_ids).toEqual(["DeckGo"]); expect(existsSync(assembly.pptx_path)).toBe(true);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it("materializes exact structural raw bytes as target-local unreviewed evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "deck_page_authority_structural_")); const source = join(root, "3_versions", "v1"); const target = join(root, "3_versions", "v2"); mkdirSync(source, { recursive: true }); mkdirSync(target, { recursive: true });
    try {
      writePageAuthorityRawManifest(source, { rawBatch: batch(), sourceEpoch: 1, images: { DeckGo: Buffer.from("raw-png") } });
      const slideEditBasePlanSha256 = digest("f");
      const plan = previewPageAuthorityStructuralRaw({ sourceRunDir: source, targetRunDir: target, targetRawBatch: batch(), slideEditBasePlanSha256 });
      expect(plan.slide_edit_base_plan_sha256).toBe(slideEditBasePlanSha256);
      const result = applyPageAuthorityStructuralRaw({
        plan,
        planHash: plan.plan_hash,
        targetRawBatch: batch(),
        expectedSlideEditBasePlanSha256: slideEditBasePlanSha256,
      });
      expect(result).toMatchObject({ materialized_slide_ids: ["DeckGo"], needs_raw_generation: [], provider_calls: 0 });
      expect(readPageAuthorityRawManifest(target).items[0]).toMatchObject({ provenance: "unreviewed", source_lineage: { run_dir: source } });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
