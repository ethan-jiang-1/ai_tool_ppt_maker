import { describe, expect, it } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DEFAULT_CONFIG } from "../PPTMAKER_FRAMEWORK/scripts/visual_config.mjs";
import { sha256File } from "../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs";
import {
  generationFingerprint,
  generationProfile,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs";
import { writeState, createDefaultState } from "../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs";
import { validateProductionHeaderReview } from "../PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs";
import {
  buildHeaderReviewInputs,
  changedFullPageIds,
  mergeHeaderReviewRecord,
  validateHeaderReviewRecord,
  versionKey,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/header_review.mjs";

function slide(id, visualType, title, mode = "full-page") {
  return {
    id,
    visual_type: visualType,
    headline: title,
    kicker: "K",
    subtitle: null,
    layout_contract: { render_mode: mode },
  };
}

const profile = {
  model: "gpt-image-2",
  resolution: "1k",
  size: "16:9",
  style_reference_sha256: "a".repeat(64),
  semantic_options: { n: 1, size: "16:9" },
};

describe("header review evidence", () => {
  it("fingerprints all full-page headers and shared geometry", () => {
    const slides = [
      slide("hero", "Title / Opener", "Hero"),
      slide("content", "Framework", "Content"),
      slide("lock", "Direction", "Lock", "body+header-lock"),
    ];
    const a = buildHeaderReviewInputs(slides, DEFAULT_CONFIG);
    expect(a.contentFullPageIds).toEqual(["content"]);
    expect(a.fullPageIds).toEqual(["hero", "content"]);
    expect(a.fullPageHeaderSnapshot.hero.hero).toBe(true);
    const alias = buildHeaderReviewInputs([
      slide("hero", "Section Divider", "Hero"),
    ], DEFAULT_CONFIG);
    const canonical = buildHeaderReviewInputs([
      slide("hero", "Section Divider / Bridge", "Hero"),
    ], DEFAULT_CONFIG);
    expect(alias.headerReviewFingerprint).toBe(canonical.headerReviewFingerprint);
    const titleChanged = buildHeaderReviewInputs([
      slide("hero", "Title / Opener", "Changed"),
      slides[1], slides[2],
    ], DEFAULT_CONFIG);
    expect(titleChanged.headerReviewFingerprint).not.toBe(a.headerReviewFingerprint);
    expect(changedFullPageIds(a.fullPageHeaderSnapshot, titleChanged.fullPageHeaderSnapshot)).toEqual(["hero"]);
  });

  it("merges partial batches and resets reviewed ids on a new fingerprint/profile", () => {
    const inputs = buildHeaderReviewInputs([
      slide("c1", "Framework", "One"),
      slide("c2", "Direction", "Two"),
      slide("hero", "Closer", "Close"),
    ], DEFAULT_CONFIG);
    const provenance = (id) => ({
      [id]: { output: `${id}.png`, image_sha256: id.repeat(64).slice(0, 64), generation_profile: profile },
    });
    const first = mergeHeaderReviewRecord({
      inputs, reviewedIds: ["c1"], provenanceEntries: provenance("c1"), profile,
    });
    expect(first.status).toBe("in_progress");
    expect(first.missing_content_review_count).toBe(1);
    const second = mergeHeaderReviewRecord({
      previousRecord: first,
      inputs,
      reviewedIds: ["c2"],
      provenanceEntries: provenance("c2"),
      profile,
    });
    expect(second.status).toBe("completed");
    expect(second.reviewed_content_full_page_ids).toEqual(["c1", "c2"]);

    const changedInputs = buildHeaderReviewInputs([
      slide("c1", "Framework", "Changed"),
      slide("c2", "Direction", "Two"),
      slide("hero", "Closer", "Close"),
    ], DEFAULT_CONFIG);
    const reset = mergeHeaderReviewRecord({
      previousRecord: second,
      inputs: changedInputs,
      reviewedIds: ["c1"],
      provenanceEntries: provenance("c1"),
      profile,
    });
    expect(reset.reviewed_content_full_page_ids).toEqual(["c1"]);
    expect(reset.changed_full_page_ids).toEqual(["c1"]);
    expect(reset.status).toBe("in_progress");
  });

  it("accepted risk is specific and can satisfy named content coverage", () => {
    const inputs = buildHeaderReviewInputs([slide("c1", "Framework", "One")], DEFAULT_CONFIG);
    const record = mergeHeaderReviewRecord({
      inputs,
      profile,
      acceptedRisks: { c1: { reason: "minor blur" } },
      provenanceEntries: {
        c1: { output: "c1.png", image_sha256: "b".repeat(64), generation_profile: profile },
      },
    });
    expect(record.status).toBe("completed");
    expect(record.accepted_risks.c1.reason).toBe("minor blur");
  });

  it("validates version key, profile, and reviewed image bytes", () => {
    const root = join(tmpdir(), `deck_header_review_${process.pid}`);
    const runDir = join(root, "3_versions", "v2");
    const imagesDir = join(runDir, "_generated", "page_images_full");
    mkdirSync(imagesDir, { recursive: true });
    try {
      expect(versionKey(root, runDir)).toBe("3_versions/v2");
      const inputs = buildHeaderReviewInputs([slide("c1", "Framework", "One")], DEFAULT_CONFIG);
      const imagePath = join(imagesDir, "c1.png");
      writeFileSync(imagePath, "image-a");
      const record = mergeHeaderReviewRecord({
        inputs,
        reviewedIds: ["c1"],
        provenanceEntries: {
          c1: { output: "c1.png", image_sha256: sha256File(imagePath), generation_profile: profile },
        },
        profile,
      });
      expect(validateHeaderReviewRecord({ record, inputs, imagesDir, targetProfile: profile }).current).toBe(true);
      expect(validateHeaderReviewRecord({
        record, inputs, imagesDir, targetProfile: { ...profile, resolution: "2k" },
      }).errors).toContain("generation profile does not match header review");
      writeFileSync(imagePath, "image-b");
      expect(validateHeaderReviewRecord({ record, inputs, imagesDir }).errors).toContain("reviewed image bytes changed for c1");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not require a first hero-only baseline but enforces one once recorded", () => {
    const root = join(tmpdir(), `deck_header_hero_${process.pid}`);
    const imagesDir = join(root, "images");
    mkdirSync(imagesDir, { recursive: true });
    try {
      const inputs = buildHeaderReviewInputs([
        slide("hero", "Title / Opener", "Hero"),
      ], DEFAULT_CONFIG);
      expect(validateHeaderReviewRecord({ record: null, inputs, imagesDir }).applicable).toBe(false);
      writeFileSync(join(imagesDir, "hero.png"), "hero-image");
      const record = mergeHeaderReviewRecord({
        inputs,
        reviewedIds: ["hero"],
        provenanceEntries: {
          hero: { output: "hero.png", image_sha256: sha256File(join(imagesDir, "hero.png")), generation_profile: profile },
        },
        profile,
      });
      const validation = validateHeaderReviewRecord({ record, inputs, imagesDir, targetProfile: profile });
      expect(validation.applicable).toBe(true);
      expect(validation.current).toBe(true);
      writeFileSync(join(imagesDir, "hero.png"), "changed");
      expect(validateHeaderReviewRecord({ record, inputs, imagesDir }).current).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("production header review gate", () => {
  it("is not applicable to a body-only deck", async () => {
    const root = join(tmpdir(), `deck_header_body_${process.pid}`);
    const runDir = join(root, "3_versions", "v1");
    const generated = join(runDir, "_generated");
    mkdirSync(generated, { recursive: true });
    try {
      writeFileSync(join(generated, "slide_plan.json"), JSON.stringify({ slides: [
        slide("lock", "Framework", "Locked", "body+header-lock"),
      ] }));
      const result = await validateProductionHeaderReview(runDir);
      expect(result.current).toBe(true);
      expect(result.applicable).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("blocks absent/stale evidence and accepts current version/profile/hash only", async () => {
    const root = join(tmpdir(), `deck_header_gate_${process.pid}`);
    const runDir = join(root, "3_versions", "v1");
    const generated = join(runDir, "_generated");
    const promptsDir = join(generated, "page_prompts");
    const imagesDir = join(generated, "page_images_full");
    const styleDir = join(root, "2_backbone", "visual-style");
    mkdirSync(promptsDir, { recursive: true });
    mkdirSync(imagesDir, { recursive: true });
    mkdirSync(styleDir, { recursive: true });
    try {
      const slides = [slide("c1", "Framework", "One")];
      const promptSlides = [{ id: "c1", out: "01_c1.png", prompt: "final prompt" }];
      writeFileSync(join(generated, "slide_plan.json"), JSON.stringify({ slides }));
      writeFileSync(join(promptsDir, "_prompts.json"), JSON.stringify({ slides: promptSlides }));
      writeFileSync(join(styleDir, "style_master.jpg"), "style-a");
      writeFileSync(join(imagesDir, "01_c1.png"), "image-a");
      const targetProfile = generationProfile({
        styleReferenceSha256: sha256File(join(styleDir, "style_master.jpg")),
        resolution: "1k",
        model: "gpt-image-2",
        semanticOptions: { size: "16:9", n: 1 },
      });
      const imageSha = sha256File(join(imagesDir, "01_c1.png"));
      writeFileSync(join(imagesDir, "_manifest.json"), JSON.stringify({
        version: 1,
        slides: {
          c1: {
            slide_id: "c1",
            output: "01_c1.png",
            generation_fingerprint: generationFingerprint({ prompt: "final prompt", profile: targetProfile }),
            image_sha256: imageSha,
            generation_profile: targetProfile,
            generated_at: new Date().toISOString(),
          },
        },
      }));

      const absent = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2",
      });
      expect(absent.current).toBe(false);
      expect(absent.errors.join(" ")).toMatch(/missing/);

      const inputs = buildHeaderReviewInputs(slides, DEFAULT_CONFIG);
      const record = mergeHeaderReviewRecord({
        inputs,
        reviewedIds: ["c1"],
        provenanceEntries: {
          c1: { output: "01_c1.png", image_sha256: imageSha, generation_profile: targetProfile },
        },
        profile: targetProfile,
      });
      const state = createDefaultState();
      state.nodes["header-review"] = {
        status: "completed",
        by_version: { "3_versions/v1": record },
      };
      writeState(root, state);

      const current = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2",
      });
      expect(current.current).toBe(true);
      const force = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2", forceImages: true,
      });
      expect(force.errors.join(" ")).toMatch(/overwrite reviewed/);
      const otherProfile = await validateProductionHeaderReview(runDir, {
        resolution: "2k", model: "gpt-image-2",
      });
      expect(otherProfile.errors.join(" ")).toMatch(/profile|provenance/);
      writeFileSync(join(imagesDir, "01_c1.png"), "tampered");
      const tampered = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2",
      });
      expect(tampered.errors.join(" ")).toMatch(/bytes changed/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
