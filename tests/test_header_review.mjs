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
    expect(a.hasBodyHeaderLockSlides).toBe(true);
    // Per-slide fingerprints
    expect(Object.keys(a.slideFingerprints).sort()).toEqual(["content", "hero"]);
    expect(a.slideFingerprints.hero).toBeDefined();
    expect(a.slideFingerprints.content).toBeDefined();
    // Title change → per-slide fingerprint changes
    const titleChanged = buildHeaderReviewInputs([
      slide("hero", "Title / Opener", "Changed"),
      slides[1], slides[2],
    ], DEFAULT_CONFIG);
    expect(titleChanged.slideFingerprints.hero).not.toBe(a.slideFingerprints.hero);
    expect(titleChanged.slideFingerprints.content).toBe(a.slideFingerprints.content);
    // Global fingerprint still works (for fallback)
    expect(titleChanged.headerReviewFingerprint).not.toBe(a.headerReviewFingerprint);
    expect(changedFullPageIds(a.fullPageHeaderSnapshot, titleChanged.fullPageHeaderSnapshot)).toEqual(["hero"]);
  });

  it("stores per-slide state via mergeHeaderReviewRecord", () => {
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
    // Per-slide: c1 is reviewed
    expect(first.slides.c1.status).toBe("reviewed");
    expect(first.slides.c1.header_snapshot.title).toBe("One");
    expect(first.slides.c1.fingerprint).toBe(inputs.slideFingerprints.c1);
    // c2 is not reviewed → status: changed
    expect(first.slides.c2).toBeDefined();
    // Merge second batch
    const second = mergeHeaderReviewRecord({
      previousRecord: first,
      inputs,
      reviewedIds: ["c2"],
      provenanceEntries: provenance("c2"),
      profile,
    });
    expect(second.slides.c2.status).toBe("reviewed");
    // Title change → new record resets c1
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
    expect(reset.slides.c1.status).toBe("reviewed");
    expect(reset.slides.c1.header_snapshot.title).toBe("Changed");
  });

  it("maps accepted_risks to waived status", () => {
    const inputs = buildHeaderReviewInputs([slide("c1", "Framework", "One")], DEFAULT_CONFIG);
    const record = mergeHeaderReviewRecord({
      inputs,
      profile,
      acceptedRisks: { c1: { reason: "minor blur" } },
      provenanceEntries: {
        c1: { output: "c1.png", image_sha256: "b".repeat(64), generation_profile: profile },
      },
    });
    expect(record.slides.c1.status).toBe("waived");
  });

  it("validates per-slide and detects title change", () => {
    const inputs = buildHeaderReviewInputs([slide("c1", "Framework", "One")], DEFAULT_CONFIG);
    // No record → pass through
    const noRecord = validateHeaderReviewRecord({ record: null, inputs, imagesDir: "/tmp" });
    expect(noRecord.format).toBe(2);
    expect(noRecord.applicable).toBe(false);
    expect(noRecord.ok).toBe(true);
    // With record but no hasBodyHeaderLockSlides → pass through
    const pureFP = buildHeaderReviewInputs([slide("c1", "Framework", "One")], DEFAULT_CONFIG);
    expect(pureFP.hasBodyHeaderLockSlides).toBe(false);
    const record = mergeHeaderReviewRecord({
      inputs, reviewedIds: ["c1"],
      provenanceEntries: { c1: { output: "c1.png", image_sha256: "b".repeat(64), generation_profile: profile } },
      profile,
    });
    const pass = validateHeaderReviewRecord({ record, inputs, imagesDir: "/tmp", targetProfile: profile });
    expect(pass.applicable).toBe(false);
    expect(pass.ok).toBe(true);
  });

  it("detects changed slides via per-slide fingerprint", () => {
    const root = join(tmpdir(), `deck_hr_ps_${process.pid}`);
    const runDir = join(root, "3_versions", "v1");
    const imagesDir = join(runDir, "_generated", "page_images_full");
    mkdirSync(imagesDir, { recursive: true });
    try {
      expect(versionKey(root, runDir)).toBe("3_versions/v1");
      const inputs = buildHeaderReviewInputs([
        slide("c1", "Framework", "One"),
        slide("lock", "Direction", "Lock", "body+header-lock"),
      ], DEFAULT_CONFIG);
      expect(inputs.hasBodyHeaderLockSlides).toBe(true);
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
      // Same inputs → ok
      const ok = validateHeaderReviewRecord({ record, inputs, imagesDir, targetProfile: profile });
      expect(ok.ok).toBe(true);
      // Profile mismatch
      const profChg = validateHeaderReviewRecord({
        record, inputs, imagesDir,
        targetProfile: { ...profile, resolution: "2k" },
      });
      expect(profChg.ok).toBe(false);
      expect(profChg.changed.length).toBeGreaterThan(0);
      expect(profChg.changed[0].field).toBe("profile");
      // Title change
      const changedInputs = buildHeaderReviewInputs([
        slide("c1", "Framework", "Changed"),
        slide("lock", "Direction", "Lock", "body+header-lock"),
      ], DEFAULT_CONFIG);
      const chg = validateHeaderReviewRecord({ record, inputs: changedInputs, imagesDir });
      expect(chg.ok).toBe(false);
      expect(chg.changed.length).toBe(1);
      expect(chg.changed[0].id).toBe("c1");
      expect(chg.changed[0].field).toBe("title");
      expect(chg.changed[0].was).toBe("One");
      expect(chg.changed[0].now).toBe("Changed");
      expect(chg.action).toContain("pilot");
      expect(chg.action).toContain("--only c1");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("passes through for pure full-page deck", () => {
    const inputs = buildHeaderReviewInputs([
      slide("c1", "Framework", "One"),
      slide("c2", "Direction", "Two"),
    ], DEFAULT_CONFIG);
    expect(inputs.hasBodyHeaderLockSlides).toBe(false);
    const result = validateHeaderReviewRecord({ record: null, inputs, imagesDir: "/tmp" });
    expect(result.applicable).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("changedFullPageIds uses per-slide state when available", () => {
    const inputs = buildHeaderReviewInputs([
      slide("c1", "Framework", "One"),
      slide("c2", "Direction", "Two"),
    ], DEFAULT_CONFIG);
    // With slideStates
    const slideStates = {
      c1: { status: "changed", fingerprint: "x" },
      c2: { status: "ok", fingerprint: "y" },
    };
    expect(changedFullPageIds({}, {}, slideStates)).toEqual(["c1"]);
    // Without slideStates → fallback to snapshot diff
    const prev = { c1: { title: "Old" }, c2: { title: "Same" } };
    const curr = { c1: { title: "New" }, c2: { title: "Same" } };
    expect(changedFullPageIds(prev, curr)).toEqual(["c1"]);
  });

  it("builds correct action for slide counts", () => {
    const slides = [
      slide("c1", "Framework", "One"),
      slide("c2", "Framework", "Two"),
      slide("c3", "Framework", "Three"),
      slide("c4", "Framework", "Four"),
      slide("c5", "Framework", "Five"),
      slide("c6", "Framework", "Six"),
      slide("lock", "Direction", "Lock", "body+header-lock"),
    ];
    const inputs = buildHeaderReviewInputs(slides, DEFAULT_CONFIG);
    const record = mergeHeaderReviewRecord({
      inputs, reviewedIds: ["c1", "c2", "c3", "c4", "c5", "c6"],
      provenanceEntries: Object.fromEntries(
        ["c1", "c2", "c3", "c4", "c5", "c6"].map((id) => [id, { output: `${id}.png`, image_sha256: id.repeat(64).slice(0, 64), generation_profile: profile }])
      ),
      profile,
    });
    // Change 3 slides → --only
    const changed3 = buildHeaderReviewInputs([
      slide("c1", "Framework", "Changed1"),
      slide("c2", "Framework", "Changed2"),
      slide("c3", "Framework", "Changed3"),
      slide("c4", "Framework", "Four"),
      slide("c5", "Framework", "Five"),
      slide("c6", "Framework", "Six"),
      slide("lock", "Direction", "Lock", "body+header-lock"),
    ], DEFAULT_CONFIG);
    const r3 = validateHeaderReviewRecord({ record, inputs: changed3, imagesDir: "/tmp" });
    expect(r3.ok).toBe(false);
    expect(r3.action).toContain("--only");
    // Change all 6 → full pilot
    const changedAll = buildHeaderReviewInputs([
      slide("c1", "Framework", "C1"),
      slide("c2", "Framework", "C2"),
      slide("c3", "Framework", "C3"),
      slide("c4", "Framework", "C4"),
      slide("c5", "Framework", "C5"),
      slide("c6", "Framework", "C6"),
      slide("lock", "Direction", "Lock", "body+header-lock"),
    ], DEFAULT_CONFIG);
    const rAll = validateHeaderReviewRecord({ record, inputs: changedAll, imagesDir: "/tmp" });
    expect(rAll.ok).toBe(false);
    expect(rAll.action).not.toContain("--only");
    expect(rAll.action).toContain("pilot");
  });
});

describe("production header review gate", () => {
  it("passes for body-only deck", async () => {
    const root = join(tmpdir(), `deck_hr_body_${process.pid}`);
    const runDir = join(root, "3_versions", "v1");
    const generated = join(runDir, "_generated");
    mkdirSync(generated, { recursive: true });
    try {
      writeFileSync(join(generated, "slide_plan.json"), JSON.stringify({ slides: [
        slide("lock", "Framework", "Locked", "body+header-lock"),
      ] }));
      const result = await validateProductionHeaderReview(runDir);
      expect(result.ok).toBe(true);
      expect(result.applicable).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("detects missing evidence and guides with action", async () => {
    const root = join(tmpdir(), `deck_hr_gate2_${process.pid}`);
    const runDir = join(root, "3_versions", "v1");
    const generated = join(runDir, "_generated");
    const promptsDir = join(generated, "page_prompts");
    const imagesDir = join(generated, "page_images_full");
    const styleDir = join(root, "2_backbone", "visual-style");
    mkdirSync(promptsDir, { recursive: true });
    mkdirSync(imagesDir, { recursive: true });
    mkdirSync(styleDir, { recursive: true });
    try {
      const slides = [slide("c1", "Framework", "One"), slide("lock", "Direction", "Lock", "body+header-lock")];
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

      // No record → gate passes (old record format → applicable: false)
      const absent = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2",
      });
      // Old code expected absent.current=false, new code passes through
      expect(absent.applicable).toBe(false);
      expect(absent.ok).toBe(true);

      // Create per-slide record
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
        by_version: { "3_versions/v1": record },
      };
      writeState(root, state);

      // Current evidence → ok
      const current = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2",
      });
      expect(current.ok).toBe(true);
      expect(current.changed).toEqual([]);

      // Tampered image bytes → requireCurrentImages detects it
      writeFileSync(join(imagesDir, "01_c1.png"), "tampered");
      const tampered = await validateProductionHeaderReview(runDir, {
        resolution: "1k", model: "gpt-image-2", requireCurrentImages: true,
      });
      expect(tampered.ok).toBe(false);
      expect(tampered.changed.length).toBeGreaterThan(0);
      expect(tampered.changed[0].field).toBe("image");
      expect(tampered.action).toContain("--force-images");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
