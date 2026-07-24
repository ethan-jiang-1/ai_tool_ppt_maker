import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ARTIFACT_KIND_FINAL_SLIDE, ARTIFACT_KIND_RAW_RENDER, ARTIFACT_STATUS_AMBIGUOUS,
  ARTIFACT_STATUS_MISSING, ARTIFACT_STATUS_VERIFIED, RENDER_ENGINE_IMAGE2,
  WHOLE_PAGE_ARTIFACT_PIPELINE,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/render_artifacts.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";
import { resolveRenderArtifact } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/render_artifacts.mjs";
import { generationFingerprint, materializeVerifiedRawImage, publishMaterializedRawImages, readImageManifest } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_provenance.mjs";

const profile = { model: "image2", resolution: "1k" };
const fixture = () => { const root = join(tmpdir(), `render-artifact-${process.pid}-${Date.now()}-${Math.random()}`); mkdirSync(root, { recursive: true }); return root; };
const entry = (id, output, overrides = {}) => ({ slide_id: id, render_engine: "image2", artifact_kind: "raw-render", output, image_sha256: null, generation_fingerprint: "f".repeat(64), generation_profile: profile, ...overrides });

const currentRawManifest = (slides) => ({ version: 2, pipeline: WHOLE_PAGE_ARTIFACT_PIPELINE, slides });
const currentFinalManifest = (entries) => ({ version: 2, pipeline: WHOLE_PAGE_ARTIFACT_PIPELINE, entries });

describe("current whole-page artifact provenance", () => {
  it("requires exact kind, engine, lineage, profile and bytes", () => {
    const dir = fixture();
    try {
      const path = join(dir, "UXGap.png"); writeFileSync(path, "raw bytes");
      const raw = entry("UXGap", "UXGap.png", { image_sha256: sha256File(path) });
      const manifest = currentRawManifest({ UXGap: raw });
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_RAW_RENDER, fingerprint: raw.generation_fingerprint, profile })).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, path });
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_FINAL_SLIDE }).status).not.toBe(ARTIFACT_STATUS_VERIFIED);
      writeFileSync(path, "tampered bytes");
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_RAW_RENDER })).toMatchObject({ status: ARTIFACT_STATUS_MISSING, reason: "artifact SHA-256 mismatch" });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("isolates current variants and rejects old manifest or filename inference", () => {
    const dir = fixture();
    try {
      for (const name of ["image2-raw.png", "image2-final.png", "html-raw.png"]) writeFileSync(join(dir, name), name);
      const rawPath = join(dir, "UXGap.png");
      const finalPath = join(dir, "UXGap.png");
      writeFileSync(rawPath, "current raw");
      const raw = entry("UXGap", "UXGap.png", { image_sha256: sha256File(rawPath) });
      const final = entry("UXGap", "UXGap.png", {
        artifact_kind: "final-slide",
        output_sha256: sha256File(finalPath),
        fingerprint: "a".repeat(64),
        profile: { mode: "lock" },
      });
      expect(resolveRenderArtifact({ directory: dir, manifest: currentRawManifest({ UXGap: raw }), slideId: "UXGap", renderEngine: "image2", artifactKind: "raw-render" }).status).toBe(ARTIFACT_STATUS_VERIFIED);
      expect(resolveRenderArtifact({ directory: dir, manifest: currentFinalManifest({ "UXGap::image2::final-slide": final }), slideId: "UXGap", renderEngine: "image2", artifactKind: "final-slide" }).status).toBe(ARTIFACT_STATUS_VERIFIED);
      writeFileSync(join(dir, "07_s07_problem.png"), "unproven bytes");
      expect(resolveRenderArtifact({ directory: dir, manifest: null, slideId: "s07_problem", renderEngine: "image2", artifactKind: "raw-render" })).toMatchObject({ status: ARTIFACT_STATUS_MISSING });
      expect(resolveRenderArtifact({ directory: dir, manifest: { version: 1, artifacts: [raw] }, slideId: "UXGap", renderEngine: "image2", artifactKind: "raw-render" })).toMatchObject({ status: ARTIFACT_STATUS_MISSING });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("materializes only stable current raw bytes into target ownership", () => {
    const root = fixture();
    try {
      const sourceDir = join(root, "source"); const targetDir = join(root, "target"); mkdirSync(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, "s07_problem.png"); writeFileSync(sourcePath, "proven current raw");
      const slide = { id: "s07_problem", out: "s07_problem.png", prompt: "same prompt" };
      const sourceManifest = currentRawManifest({ s07_problem: entry("s07_problem", "s07_problem.png", { image_sha256: sha256File(sourcePath), generation_fingerprint: generationFingerprint({ prompt: slide.prompt, profile }), generation_profile: profile }) });
      const result = materializeVerifiedRawImage({ sourceDir, targetDir, slide, sourceManifest, profile, sourceVersion: "v1" });
      expect(result).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, slide_id: "s07_problem" });
      expect(readFileSync(join(targetDir, "s07_problem.png"), "utf8")).toBe("proven current raw");
      publishMaterializedRawImages({ targetDir, results: [result] });
      expect(readImageManifest(targetDir).manifest.slides.s07_problem).toMatchObject({ output: "s07_problem.png", materialized_from: { source_version: "v1" } });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
