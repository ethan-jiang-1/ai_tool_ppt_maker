import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCanvas } from "@napi-rs/canvas";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  materializeStructuralVersion,
  stage1,
  stage3,
  stage4,
  stage5,
} from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs";
import { buildWholePageContactSheet as makeContactSheet } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs";
import {
  buildImageManifestEntry,
  emptyImageManifest,
  generationProfile,
  readImageManifest,
  writeImageManifestAtomic,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_provenance.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";
import {
  buildHeaderReviewInputs,
  mergeHeaderReviewRecord,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/header_review.mjs";
import { DEFAULT_CONFIG } from "../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/visual_config.mjs";
import { readState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function runSlides(args) {
  const result = spawnSync("node", [PPT_FLOW, "slides", ...args, "--json"], {
    encoding: "utf8",
    timeout: 20000,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function writePng(path, color = "#245678") {
  const canvas = createCanvas(320, 180);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 320, 180);
  writeFileSync(path, canvas.toBuffer("image/png"));
}

function slideBlock(slide, position) {
  return `## Slide ${String(position).padStart(2, "0")}: ${slide.id}\n\n` +
    `**VISUAL TYPE**: ${slide.visualType || "Framework"}\n` +
    `**RENDER MODE**: ${slide.mode || "full-page"}\n` +
    `**KICKER**: CONTEXT\n` +
    `**TITLE**: ${slide.title}\n` +
    `**IMAGE PROMPT**: ${slide.prompt || `${slide.title} visual`}\n` +
    `> **SPEAKER NOTE**: Note for ${slide.id}.\n`;
}

function mnemonicSpec(slides) {
  return `---\nproduction:\n  pipeline: whole-page-image2-v1\nidentity:\n  scheme: mnemonic-v1\n---\n\n${slides.map((slide, index) => slideBlock(slide, index + 1)).join("\n")}`;
}

async function seedVerifiedSource(deck, slides) {
  const runDir = join(deck, "3_versions", "v1");
  const style = join(deck, "2_backbone", "visual-style", "style_master.jpg");
  writePng(style, "#18324a");
  expect(await stage1(runDir, false)).toBe(true);
  const generated = join(runDir, "_generated");
  const prompts = JSON.parse(readFileSync(join(generated, "page_prompts", "_prompts.json"), "utf8")).slides;
  const images = join(generated, "page_images_full");
  mkdirSync(images, { recursive: true });
  const profile = generationProfile({
    styleReferenceSha256: sha256File(style),
    resolution: "2k",
    model: "gpt-image-2",
    semanticOptions: { size: "16:9", n: 1 },
  });
  const manifest = emptyImageManifest();
  for (const [index, prompt] of prompts.entries()) {
    const output = `${prompt.id}.png`;
    const path = join(images, output);
    writePng(path, `#${String(223344 + index * 111111).slice(0, 6)}`);
    manifest.slides[prompt.id] = buildImageManifestEntry({
      slideId: prompt.id,
      output,
      prompt: prompt.prompt.trim(),
      profile,
      imagePath: path,
      generatedAt: "2026-07-16T00:00:00.000Z",
    });
  }
  writeImageManifestAtomic(images, manifest);
  return { runDir, generated, prompts, images, profile, manifest, style };
}

function installReviewState(deck, source, { reviewed = [], waived = [] } = {}) {
  const plan = JSON.parse(readFileSync(join(source.generated, "slide_plan.json"), "utf8")).slides;
  const inputs = buildHeaderReviewInputs(plan, DEFAULT_CONFIG);
  const acceptedRisks = Object.fromEntries(waived.map((id) => [id, { reason: "review exception" }]));
  const provenanceEntries = Object.fromEntries(
    [...reviewed, ...waived].map((id) => [id, source.manifest.slides[id]])
  );
  const record = mergeHeaderReviewRecord({
    inputs,
    reviewedIds: reviewed,
    provenanceEntries,
    profile: source.profile,
    acceptedRisks,
  });
  const state = readState(deck, { purpose: "execute", heal: false });
  state.nodes["header-review"] = { by_version: { "3_versions/v1": record } };
  writeState(deck, state);
}

async function rebuildLocal(runDir) {
  expect(await stage3(runDir, false)).toBe(true);
  const generated = join(runDir, "_generated");
  await makeContactSheet({
    imageDir: join(generated, "page_images_full"),
    promptJson: join(generated, "page_prompts", "_prompts.json"),
    out: join(generated, "preview", "contact_sheet.jpg"),
  });
  expect(await stage4(runDir, false)).toBe(true);
  expect(await stage5(runDir, false)).toBe(true);
}

describe("stable slide identity structural E2E", () => {
  it("confirms CLI reorder and multi-delete, then completes a zero-render target rebuild", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "structural-e2e-")), "deck_structural_e2e");
    const originalFetch = globalThis.fetch;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const slides = [
        { id: "DeckGo", title: "Opening" },
        { id: "UXGap", title: "Friction" },
        { id: "AICost", title: "Cost" },
        { id: "IDFix", title: "Identity" },
        { id: "WebWin", title: "Outcome" },
      ];
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), mnemonicSpec(slides), "utf8");
      const sourceText = readFileSync(join(v1, "slide-specifications.md"), "utf8");
      const source = await seedVerifiedSource(deck, slides);

      const movePreview = runSlides(["move", v1, "WebWin", "--after", "DeckGo"]);
      const moveApply = runSlides([
        "move", v1, "WebWin", "--after", "DeckGo", "--apply",
        "--plan-sha256", movePreview.transaction.plan_sha256,
      ]);
      const v2 = moveApply.target_run_dir;
      expect(moveApply.receipt.after_order).toEqual(["DeckGo", "WebWin", "UXGap", "AICost", "IDFix"]);

      const deletePreview = runSlides(["delete", v2, "3", "5"]);
      expect(deletePreview.transaction.bindings.map((binding) => binding.slide_id)).toEqual(["UXGap", "IDFix"]);
      const deleteApply = runSlides([
        "delete", v2, "3", "5", "--apply",
        "--plan-sha256", deletePreview.transaction.plan_sha256,
      ]);
      const v3 = deleteApply.target_run_dir;
      expect(deleteApply.receipt.after_order).toEqual(["DeckGo", "WebWin", "AICost"]);
      expect(readFileSync(join(v1, "slide-specifications.md"), "utf8")).toBe(sourceText);
      expect(readdirSync(join(deck, "3_versions")).filter((name) => name.startsWith(".v"))).toEqual([]);

      let rendererCalls = 0;
      globalThis.fetch = async () => {
        rendererCalls += 1;
        throw new Error("structural E2E attempted remote rendering");
      };
      const result = await materializeStructuralVersion({ sourceRunDir: source.runDir, targetRunDir: v3 });
      expect(rendererCalls).toBe(0);
      expect(result.needs_render).toEqual([]);
      expect(result.production_complete).toBe(true);
      expect(result.completed_local_stages).toEqual(["stage1", "stage3", "contact-sheet", "stage4", "stage5"]);
      const assembly = JSON.parse(readFileSync(join(v3, "_generated", "qa", "pptx_assembly.json"), "utf8"));
      const notes = JSON.parse(readFileSync(join(v3, "_generated", "qa", "notes_injection.json"), "utf8"));
      expect(assembly.ordered_slide_ids).toEqual(["DeckGo", "WebWin", "AICost"]);
      expect(notes.ordered_slide_ids).toEqual(assembly.ordered_slide_ids);
      expect(notes.input_sha256).toBe(sha256File(join(v3, "slide-specifications.md")));
      expect(JSON.parse(readFileSync(result.receipt_path, "utf8")).renderer_calls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("publishes an insert with one needs_render, then explicitly renders only that mnemonic", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "insert-e2e-")), "deck_insert_e2e");
    const originalFetch = globalThis.fetch;
    const previousKey = process.env.IMAGE2_API_KEY;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const slides = [
        { id: "DeckGo", title: "Opening", visualType: "Title / Opener" },
        { id: "UXGap", title: "Friction" },
        { id: "LockIt", title: "Locked", mode: "body+header-lock" },
      ];
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), mnemonicSpec(slides), "utf8");
      const source = await seedVerifiedSource(deck, slides);
      installReviewState(deck, source, { reviewed: ["DeckGo"], waived: ["UXGap"] });

      const insertPath = join(v1, "_scratch", "NewAsk.md");
      writeFileSync(insertPath, slideBlock({
        id: "NewAsk",
        title: "New request",
        prompt: "A new request visual",
        mode: "body+header-lock",
      }, 1), "utf8");
      const preview = runSlides(["insert", v1, "--source", insertPath, "--after", "UXGap"]);
      const applied = runSlides([
        "insert", v1, "--source", insertPath, "--after", "UXGap", "--apply",
        "--plan-sha256", preview.transaction.plan_sha256,
      ]);
      const v2 = applied.target_run_dir;

      let rendererCalls = 0;
      globalThis.fetch = async () => {
        rendererCalls += 1;
        throw new Error("materialization attempted remote rendering");
      };
      const impact = await materializeStructuralVersion({ sourceRunDir: v1, targetRunDir: v2 });
      expect(rendererCalls).toBe(0);
      expect(impact.needs_render).toEqual(["NewAsk"]);
      expect(impact.materialized_ids).toEqual(["DeckGo", "UXGap", "LockIt"]);
      expect(impact.production_complete).toBe(false);
      expect(existsSync(join(v2, "_generated", "header_locked", "_manifest.json"))).toBe(false);
      const targetState = readState(deck);
      expect(targetState.nodes["header-review"].by_version["3_versions/v2"].slides.DeckGo.status).toBe("reviewed");
      expect(targetState.nodes["header-review"].by_version["3_versions/v2"].slides.UXGap).toBeUndefined();

      const responseCanvas = createCanvas(320, 180);
      const responsePng = responseCanvas.toBuffer("image/png").toString("base64");
      globalThis.fetch = async () => {
        rendererCalls += 1;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: [{ b64_json: responsePng }] }),
          headers: { get: () => "application/json" },
        };
      };
      process.env.IMAGE2_API_KEY = "insert-e2e-key";
      const { generateWholePageImages: generateImages } = await import("../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs");
      const generated = join(v2, "_generated");
      const rawBefore = readImageManifest(join(generated, "page_images_full")).manifest;
      const explicit = await generateImages({
        promptJson: join(generated, "page_prompts", "_prompts.json"),
        outDir: join(generated, "page_images_full"),
        styleReference: source.style,
        resolution: "2k",
        model: "gpt-image-2",
        only: ["NewAsk"],
        force: true,
        promptIsFinal: true,
        baseUrl: ["https://renderer.example.test/v1"],
      });
      expect(explicit).toMatchObject({ generated: 1, errors: [] });
      expect(rendererCalls).toBe(1);
      const rawAfter = readImageManifest(join(generated, "page_images_full")).manifest;
      for (const id of ["DeckGo", "UXGap", "LockIt"]) {
        expect(rawAfter.slides[id].generation_fingerprint).toBe(rawBefore.slides[id].generation_fingerprint);
      }
      const currentPlan = JSON.parse(readFileSync(join(generated, "slide_plan.json"), "utf8")).slides;
      const reviewInputs = buildHeaderReviewInputs(currentPlan, DEFAULT_CONFIG);
      const reviewedState = readState(deck);
      const targetRecord = reviewedState.nodes["header-review"].by_version["3_versions/v2"];
      reviewedState.nodes["header-review"].by_version["3_versions/v2"] = mergeHeaderReviewRecord({
        previousRecord: targetRecord,
        inputs: reviewInputs,
        reviewedIds: ["UXGap"],
        provenanceEntries: { UXGap: rawAfter.slides.UXGap },
        profile: source.profile,
      });
      writeState(deck, reviewedState);
      await rebuildLocal(v2);
      const assembly = JSON.parse(readFileSync(join(generated, "qa", "pptx_assembly.json"), "utf8"));
      const notes = JSON.parse(readFileSync(join(generated, "qa", "notes_injection.json"), "utf8"));
      expect(assembly.ordered_slide_ids).toEqual(["DeckGo", "UXGap", "NewAsk", "LockIt"]);
      expect(notes.ordered_slide_ids).toEqual(assembly.ordered_slide_ids);
      expect(JSON.parse(readFileSync(join(generated, "qa", "structural_impact.json"), "utf8")).needs_render).toEqual(["NewAsk"]);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousKey === undefined) delete process.env.IMAGE2_API_KEY;
      else process.env.IMAGE2_API_KEY = previousKey;
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("does not materialize unproven position-prefixed raw bytes", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "unproven-artifact-e2e-")), "deck_artifact_e2e");
    const originalFetch = globalThis.fetch;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const finalSlides = [
        { id: "AskGo", title: "Problem" },
        { id: "PlanGo", title: "Answer" },
      ];
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), mnemonicSpec(finalSlides), "utf8");
      const source = await seedVerifiedSource(deck, finalSlides);
      delete source.manifest.slides.PlanGo;
      const unprovenPath = join(source.images, "08_PlanGo.png");
      writeFileSync(unprovenPath, readFileSync(join(source.images, "PlanGo.png")));
      rmSync(join(source.images, "PlanGo.png"), { force: true });
      writeImageManifestAtomic(source.images, source.manifest);

      const preview = runSlides(["move", v1, "PlanGo", "--to", "start"]);
      const applied = runSlides([
        "move", v1, "PlanGo", "--to", "start", "--apply",
        "--plan-sha256", preview.transaction.plan_sha256,
      ]);
      const v2 = applied.target_run_dir;
      let rendererCalls = 0;
      globalThis.fetch = async () => { rendererCalls += 1; throw new Error("artifact path rendered remotely"); };
      const first = await materializeStructuralVersion({ sourceRunDir: v1, targetRunDir: v2 });
      expect(rendererCalls).toBe(0);
      expect(first.materialized_ids).toEqual(["AskGo"]);
      expect(first.needs_render).toEqual(["PlanGo"]);
      expect(first.slides.find((slide) => slide.slide_id === "PlanGo").artifact.status).toBe("missing");
      expect(existsSync(join(v2, "_generated", "page_images_full", "AskGo.png"))).toBe(true);
      expect(readImageManifest(join(v2, "_generated", "page_images_full")).manifest.slides.AskGo)
        .toMatchObject({ materialized_from: { source_output: "AskGo.png" } });

      const currentPath = join(source.images, "PlanGo.png");
      writeFileSync(currentPath, readFileSync(unprovenPath));
      source.manifest.slides.PlanGo = buildImageManifestEntry({
        slideId: "PlanGo",
        output: "PlanGo.png",
        prompt: source.prompts.find((prompt) => prompt.id === "PlanGo").prompt.trim(),
        profile: source.profile,
        imagePath: currentPath,
      });
      writeImageManifestAtomic(source.images, source.manifest);
      const v3 = join(deck, "3_versions", "v3");
      mkdirSync(v3, { recursive: true });
      for (const entry of readdirSync(v2, { withFileTypes: true })) {
        if (entry.name === "_generated" || entry.name === "_scratch") continue;
      }
      const { createVersion } = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs");
      rmSync(v3, { recursive: true, force: true });
      const provenTarget = createVersion(v2, "v3");
      const complete = await materializeStructuralVersion({ sourceRunDir: v1, targetRunDir: provenTarget });
      expect(rendererCalls).toBe(0);
      expect(complete.needs_render).toEqual([]);
      expect(complete.production_complete).toBe(true);
      const assembly = JSON.parse(readFileSync(join(provenTarget, "_generated", "qa", "pptx_assembly.json"), "utf8"));
      const notes = JSON.parse(readFileSync(join(provenTarget, "_generated", "qa", "notes_injection.json"), "utf8"));
      expect(assembly.ordered_slide_ids).toEqual(["PlanGo", "AskGo"]);
      expect(notes.ordered_slide_ids).toEqual(assembly.ordered_slide_ids);
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(deck, { recursive: true, force: true });
    }
  });
});
