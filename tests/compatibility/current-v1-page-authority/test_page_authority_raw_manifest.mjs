import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  classifyPageAuthorityRawReuse,
  readPageAuthorityRawManifest,
  validatePageAuthorityRawManifest,
  writePageAuthorityRawManifest,
} from "../../../PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/page-authority/raw_manifest.mjs";
import {
  recordPageAuthorityRawProviderAuthorization,
  createInitialState,
  writeState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { submitAuthorizedPageAuthorityRawBatch } from "../../../PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/page-authority/raw_compilation.mjs";
import { validatePageAuthorityAssemblyInput } from "../../../PPTMAKER_FRAMEWORK/scripts/05-delivery/internal/page_authority_pptx_assembly_v1.mjs";
import { validatePageAuthorityNotesInput } from "../../../PPTMAKER_FRAMEWORK/scripts/05-delivery/internal/page_authority_notes_v1.mjs";
import { applyPageAuthorityStructuralRaw, previewPageAuthorityStructuralRaw } from "../../../PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/page-authority/structural_raw.mjs";

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

function finalManifest({ sourceEpoch = 1 } = {}) {
  return {
    schema: "pptmaker-page-authority-final-manifest-v1",
    source_epoch: sourceEpoch,
    raw_review_coverage_sha256: digest("b"),
    entries: [{
      slide_id: "DeckGo",
      authority: "framed-image2",
      final_sha256: digest("f"),
      raw_sha256: digest("a"),
      raw_image_contract_digest: digest("c"),
      raw_generation_profile_digest: digest("d"),
      path: "DeckGo.png",
      width: 2000,
      height: 1125,
      media_profile: "page-authority-framed-local-v1",
      finalization_fingerprint: digest("e"),
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

  it("short-circuits provider submission behind current authorization", async () => {
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

    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("accepts only the exact current Page Authority final and notes lineage", () => {
    const manifest = finalManifest();
    expect(validatePageAuthorityAssemblyInput(manifest, { sourceEpoch: 1 }).ordered_slide_ids).toEqual(["DeckGo"]);
    expect(() => validatePageAuthorityAssemblyInput(finalManifest({ sourceEpoch: 2 }), { sourceEpoch: 1 })).toThrow(/stale/);
    const assembly = {
      schema: "pptmaker-page-authority-pptx-assembly-v1",
      source_epoch: 1,
      final_manifest_sha256: digest("f"),
      ordered_slide_ids: ["DeckGo"],
    };
    expect(validatePageAuthorityNotesInput({ assembly, finalManifest: manifest, finalManifestSha256: digest("f"), notesBySlide: { DeckGo: "note" }, sourceEpoch: 1 })).toEqual({ ordered_slide_ids: ["DeckGo"] });
    expect(() => validatePageAuthorityNotesInput({ assembly, finalManifest: manifest, finalManifestSha256: digest("a"), notesBySlide: { DeckGo: "note" }, sourceEpoch: 1 })).toThrow(/stale/);
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
