import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ARTIFACT_KIND_FINAL_SLIDE, ARTIFACT_KIND_RAW_RENDER, ARTIFACT_STATUS_AMBIGUOUS,
  ARTIFACT_STATUS_LEGACY_LOCATED, ARTIFACT_STATUS_MISSING, ARTIFACT_STATUS_VERIFIED,
  RENDER_ENGINE_IMAGE2,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/render_artifacts.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";
import { resolveRenderArtifact } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/render_artifacts.mjs";
import { generationFingerprint, materializeVerifiedRawImage, publishMaterializedRawImages, readImageManifest } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_provenance.mjs";

const profile = { model: "image2", resolution: "1k" };
const fixture = () => { const root = join(tmpdir(), `render-artifact-${process.pid}-${Date.now()}-${Math.random()}`); mkdirSync(root, { recursive: true }); return root; };
const entry = (id, output, overrides = {}) => ({ slide_id: id, render_engine: "image2", artifact_kind: "raw-render", output, image_sha256: null, generation_fingerprint: "f".repeat(64), generation_profile: profile, ...overrides });

describe("legacy artifact discovery", () => {
  it("requires exact kind, engine, lineage, profile and bytes", () => {
    const dir = fixture();
    try {
      const path = join(dir, "UXGap.png"); writeFileSync(path, "raw bytes");
      const raw = entry("UXGap", "UXGap.png", { image_sha256: sha256File(path) });
      const manifest = { version: 1, slides: { UXGap: raw } };
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_RAW_RENDER, fingerprint: raw.generation_fingerprint, profile })).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, path });
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_FINAL_SLIDE }).status).not.toBe(ARTIFACT_STATUS_VERIFIED);
      writeFileSync(path, "tampered bytes");
      expect(resolveRenderArtifact({ directory: dir, manifest, slideId: "UXGap", renderEngine: RENDER_ENGINE_IMAGE2, artifactKind: ARTIFACT_KIND_RAW_RENDER })).toMatchObject({ status: ARTIFACT_STATUS_MISSING, reason: "artifact SHA-256 mismatch" });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("isolates variants and reports filename-only ambiguity", () => {
    const dir = fixture();
    try {
      for (const name of ["image2-raw.png", "image2-final.png", "html-raw.png"]) writeFileSync(join(dir, name), name);
      const artifacts = [
        entry("UXGap", "image2-raw.png", { image_sha256: sha256File(join(dir, "image2-raw.png")) }),
        entry("UXGap", "image2-final.png", { artifact_kind: "final-slide", output_sha256: sha256File(join(dir, "image2-final.png")), fingerprint: "a".repeat(64), profile: { mode: "lock" } }),
        entry("UXGap", "html-raw.png", { render_engine: "html", image_sha256: sha256File(join(dir, "html-raw.png")) }),
      ];
      const request = (engine, kind) => resolveRenderArtifact({ directory: dir, manifest: { version: 1, artifacts }, slideId: "UXGap", renderEngine: engine, artifactKind: kind });
      expect(request("image2", "raw-render").output).toBe("image2-raw.png");
      expect(request("image2", "final-slide").output).toBe("image2-final.png");
      expect(request("html", "raw-render").output).toBe("html-raw.png");
      writeFileSync(join(dir, "07_s07_problem.png"), "legacy");
      expect(resolveRenderArtifact({ directory: dir, manifest: null, slideId: "s07_problem", renderEngine: "image2", artifactKind: "raw-render" })).toMatchObject({ status: ARTIFACT_STATUS_LEGACY_LOCATED });
      writeFileSync(join(dir, "s07_problem.jpg"), "another");
      expect(resolveRenderArtifact({ directory: dir, manifest: null, slideId: "s07_problem", renderEngine: "image2", artifactKind: "raw-render" })).toMatchObject({ status: ARTIFACT_STATUS_AMBIGUOUS });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("materializes proven legacy raw bytes into target ownership", () => {
    const root = fixture();
    try {
      const sourceDir = join(root, "source"); const targetDir = join(root, "target"); mkdirSync(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, "07_s07_problem.png"); writeFileSync(sourcePath, "proven legacy raw");
      const slide = { id: "s07_problem", out: "s07_problem.png", prompt: "same prompt" };
      const sourceManifest = { version: 1, slides: { s07_problem: entry("s07_problem", "07_s07_problem.png", { image_sha256: sha256File(sourcePath), generation_fingerprint: generationFingerprint({ prompt: slide.prompt, profile }), generation_profile: profile }) } };
      const result = materializeVerifiedRawImage({ sourceDir, targetDir, slide, sourceManifest, profile, sourceVersion: "v1" });
      expect(result).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, slide_id: "s07_problem" });
      expect(readFileSync(join(targetDir, "s07_problem.png"), "utf8")).toBe("proven legacy raw");
      publishMaterializedRawImages({ targetDir, results: [result] });
      expect(readImageManifest(targetDir).manifest.slides.s07_problem).toMatchObject({ output: "s07_problem.png", materialized_from: { source_version: "v1" } });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
