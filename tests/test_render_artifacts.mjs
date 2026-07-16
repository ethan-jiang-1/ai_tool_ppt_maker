import { describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ARTIFACT_KIND_FINAL_SLIDE,
  ARTIFACT_KIND_RAW_RENDER,
  ARTIFACT_STATUS_AMBIGUOUS,
  ARTIFACT_STATUS_LEGACY_LOCATED,
  ARTIFACT_STATUS_MISSING,
  ARTIFACT_STATUS_VERIFIED,
  RENDER_ENGINE_IMAGE2,
  resolveRenderArtifact,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/render_artifacts.mjs';
import {
  materializeVerifiedRawImage,
  publishMaterializedRawImages,
  readImageManifest,
  sha256File,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs';

const profile = { model: 'image2', resolution: '1k' };

function fixture() {
  const root = join(tmpdir(), `render-artifact-${process.pid}-${Date.now()}-${Math.random()}`);
  mkdirSync(root, { recursive: true });
  return root;
}

function entry(id, output, overrides = {}) {
  return {
    slide_id: id,
    render_engine: 'image2',
    artifact_kind: 'raw-render',
    output,
    image_sha256: null,
    generation_fingerprint: 'f'.repeat(64),
    generation_profile: profile,
    ...overrides,
  };
}

describe('render artifact resolver', () => {
  it('returns verified only for kind/engine/fingerprint/profile and byte proof', () => {
    const dir = fixture();
    try {
      const path = join(dir, 'UXGap.png');
      writeFileSync(path, 'raw bytes');
      const raw = entry('UXGap', 'UXGap.png', { image_sha256: sha256File(path) });
      const manifest = { version: 1, slides: { UXGap: raw } };

      expect(resolveRenderArtifact({
        directory: dir,
        manifest,
        slideId: 'UXGap',
        renderEngine: RENDER_ENGINE_IMAGE2,
        artifactKind: ARTIFACT_KIND_RAW_RENDER,
        fingerprint: raw.generation_fingerprint,
        profile,
      })).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, path });

      expect(resolveRenderArtifact({
        directory: dir,
        manifest,
        slideId: 'UXGap',
        renderEngine: RENDER_ENGINE_IMAGE2,
        artifactKind: ARTIFACT_KIND_FINAL_SLIDE,
      }).status).not.toBe(ARTIFACT_STATUS_VERIFIED);

      expect(resolveRenderArtifact({
        directory: dir,
        manifest,
        slideId: 'UXGap',
        renderEngine: 'html',
        artifactKind: ARTIFACT_KIND_RAW_RENDER,
      }).status).not.toBe(ARTIFACT_STATUS_VERIFIED);

      writeFileSync(path, 'tampered bytes');
      expect(resolveRenderArtifact({
        directory: dir,
        manifest,
        slideId: 'UXGap',
        renderEngine: RENDER_ENGINE_IMAGE2,
        artifactKind: ARTIFACT_KIND_RAW_RENDER,
      })).toMatchObject({ status: ARTIFACT_STATUS_MISSING, reason: 'artifact SHA-256 mismatch' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('isolates multiple engine and artifact-kind variants for one stable ID', () => {
    const dir = fixture();
    try {
      for (const name of ['image2-raw.png', 'image2-final.png', 'html-raw.png']) {
        writeFileSync(join(dir, name), name);
      }
      const artifacts = [
        entry('UXGap', 'image2-raw.png', { image_sha256: sha256File(join(dir, 'image2-raw.png')) }),
        entry('UXGap', 'image2-final.png', {
          artifact_kind: 'final-slide', output_sha256: sha256File(join(dir, 'image2-final.png')),
          fingerprint: 'a'.repeat(64), profile: { mode: 'lock' },
        }),
        entry('UXGap', 'html-raw.png', {
          render_engine: 'html', image_sha256: sha256File(join(dir, 'html-raw.png')),
        }),
      ];
      const manifest = { version: 1, artifacts };
      const request = (engine, kind) => resolveRenderArtifact({
        directory: dir, manifest, slideId: 'UXGap', renderEngine: engine, artifactKind: kind,
      });
      expect(request('image2', 'raw-render').output).toBe('image2-raw.png');
      expect(request('image2', 'final-slide').output).toBe('image2-final.png');
      expect(request('html', 'raw-render').output).toBe('html-raw.png');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports a filename-only legacy artifact as located, and multiple files as ambiguous', () => {
    const dir = fixture();
    try {
      writeFileSync(join(dir, '07_s07_problem.png'), 'legacy');
      expect(resolveRenderArtifact({
        directory: dir, manifest: null, slideId: 's07_problem',
        renderEngine: 'image2', artifactKind: 'raw-render',
      })).toMatchObject({ status: ARTIFACT_STATUS_LEGACY_LOCATED });
      writeFileSync(join(dir, 's07_problem.jpg'), 'another');
      expect(resolveRenderArtifact({
        directory: dir, manifest: null, slideId: 's07_problem',
        renderEngine: 'image2', artifactKind: 'raw-render',
      })).toMatchObject({ status: ARTIFACT_STATUS_AMBIGUOUS });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('verified raw materialization', () => {
  it('materializes a proven legacy output into a target-owned stable path and manifest', () => {
    const root = fixture();
    try {
      const sourceDir = join(root, 'source');
      const targetDir = join(root, 'target');
      mkdirSync(sourceDir, { recursive: true });
      const sourcePath = join(sourceDir, '07_s07_problem.png');
      writeFileSync(sourcePath, 'proven legacy raw');
      const slide = { id: 's07_problem', out: 's07_problem.png', prompt: 'same prompt' };
      const sourceManifest = { version: 1, slides: {
        s07_problem: entry('s07_problem', '07_s07_problem.png', {
          image_sha256: sha256File(sourcePath),
          generation_fingerprint: 'fingerprint-current',
          generation_profile: profile,
        }),
      } };
      // The helper recomputes this fingerprint, so use the production builder's value.
      const { generationFingerprint } = awaitImportGuard();
      sourceManifest.slides.s07_problem.generation_fingerprint = generationFingerprint({
        prompt: slide.prompt, profile,
      });
      const result = materializeVerifiedRawImage({
        sourceDir, targetDir, slide, sourceManifest, profile, sourceVersion: 'v1',
      });
      expect(result).toMatchObject({ status: ARTIFACT_STATUS_VERIFIED, slide_id: 's07_problem' });
      expect(readFileSync(join(targetDir, 's07_problem.png'), 'utf8')).toBe('proven legacy raw');
      publishMaterializedRawImages({ targetDir, results: [result] });
      const target = readImageManifest(targetDir).manifest.slides.s07_problem;
      expect(target).toMatchObject({
        output: 's07_problem.png',
        render_engine: 'image2',
        artifact_kind: 'raw-render',
        materialized_from: { source_version: 'v1', source_output: '07_s07_problem.png' },
      });

      writeFileSync(sourcePath, 'tampered');
      expect(materializeVerifiedRawImage({
        sourceDir, targetDir: join(root, 'other'), slide, sourceManifest, profile,
      })).toMatchObject({ status: 'needs_render', reason: 'image SHA-256 mismatch' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

// Static import kept behind a tiny helper so the fixture setup reads linearly.
import { generationFingerprint } from '../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs';
function awaitImportGuard() {
  return { generationFingerprint };
}
