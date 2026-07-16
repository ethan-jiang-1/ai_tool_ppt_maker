import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCanvas } from '@napi-rs/canvas';
import { diagnosticFromError } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';
import {
  generationFingerprint,
  sha256File,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs';

function png(path, width = 40, height = 24) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#336699';
  ctx.fillRect(0, 0, width, height);
  writeFileSync(path, canvas.toBuffer('image/png'));
}

function rawEntry(id, path) {
  const profile = { model: 'image2', resolution: '1k' };
  return {
    slide_id: id,
    render_engine: 'image2',
    artifact_kind: 'raw-render',
    output: path.split('/').at(-1),
    image_sha256: sha256File(path),
    generation_profile: profile,
    generation_fingerprint: generationFingerprint({ prompt: `prompt ${id}`, profile }),
  };
}

describe('stage3_lock_headers', () => {
  it('module exists and is importable', async () => {
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs');
    expect(mod).toBeDefined();
  });

  it('uses resolved mode only, independent of render_mode_source', async () => {
    const { contractRenderMode } = await import(
      '../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs'
    );
    for (const source of [
      'explicit',
      'policy:exception',
      'derived:hero_type',
      'policy:default',
      'derived:visual_type',
    ]) {
      expect(contractRenderMode({ render_mode: 'full-page', render_mode_source: source })).toBe(
        'full-page'
      );
      expect(
        contractRenderMode({ render_mode: 'body+header-lock', render_mode_source: source })
      ).toBe('body+header-lock');
    }
  });

  it('aggregates missing and ambiguous slide images through programmatic and CLI boundaries', async () => {
    const root = join(tmpdir(), `stage3-diagnostic-${Date.now()}`);
    const images = join(root, 'images');
    const out = join(root, 'out');
    const plan = join(root, 'slide_plan.json');
    try {
      mkdirSync(images, { recursive: true });
      writeFileSync(join(images, '01_s1.png'), 'a');
      writeFileSync(join(images, '02_s1.jpg'), 'b');
      writeFileSync(plan, JSON.stringify({ slides: [{ id: 's1' }, { id: 's2' }] }), 'utf8');
      const { lockHeaders } = await import('../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs');
      let error;
      try {
        await lockHeaders({ images, slidePlan: plan, out });
      } catch (caught) {
        error = caught;
      }
      expect(diagnosticFromError(error).issues.map((issue) => [issue.subject.id, issue.reason.kind])).toEqual([
        ['s1', 'ambiguous_images'],
        ['s2', 'missing_image'],
      ]);

      const result = spawnSync('node', [
        'PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs',
        '--images', images, '--slide-plan', plan, '--out', out,
      ], { encoding: 'utf8', timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: 'artifact', stage: 'stage3', operation: 'resolve-images' });
      expect(envelope.diagnostic.issues).toHaveLength(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('publishes ID-stable body-lock and full-page final artifacts with target-owned proof', async () => {
    const root = join(tmpdir(), `stage3-manifest-${Date.now()}`);
    const images = join(root, 'images');
    const out = join(root, 'out');
    const plan = join(root, 'slide_plan.json');
    try {
      mkdirSync(images, { recursive: true });
      const lockPath = join(images, 'UXGap.png');
      const fullPath = join(images, 'PPTGo.png');
      png(lockPath);
      png(fullPath, 1672, 941);
      writeFileSync(join(images, '_manifest.json'), JSON.stringify({ version: 1, slides: {
        UXGap: rawEntry('UXGap', lockPath),
        PPTGo: rawEntry('PPTGo', fullPath),
      } }), 'utf8');
      writeFileSync(plan, JSON.stringify({ slides: [
        { id: 'UXGap', slide_id: 'UXGap', position: 1, kicker: 'K', headline: 'Gap', layout_contract: { render_mode: 'body+header-lock' } },
        { id: 'PPTGo', slide_id: 'PPTGo', position: 2, headline: 'Go', layout_contract: { render_mode: 'full-page' } },
      ] }), 'utf8');
      const { lockHeaders } = await import('../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs');
      await lockHeaders({ images, slidePlan: plan, out });

      expect(readFileSync(join(out, 'UXGap.png')).length).toBeGreaterThan(0);
      expect(readFileSync(join(out, 'PPTGo.png')).length).toBeGreaterThan(0);
      const manifest = JSON.parse(readFileSync(join(out, '_manifest.json'), 'utf8'));
      const entries = Object.values(manifest.entries);
      expect(entries).toHaveLength(2);
      expect(entries).toEqual(expect.arrayContaining([
        expect.objectContaining({
          slide_id: 'UXGap', artifact_kind: 'final-slide', render_engine: 'image2',
          output: 'UXGap.png', render_mode: 'body+header-lock',
          raw_image_sha256: sha256File(lockPath),
        }),
        expect.objectContaining({
          slide_id: 'PPTGo', artifact_kind: 'final-slide', render_engine: 'image2',
          output: 'PPTGo.png', render_mode: 'full-page',
          raw_image_sha256: sha256File(fullPath),
        }),
      ]));
      for (const entry of entries) {
        expect(entry.output_sha256).toBe(sha256File(join(out, entry.output)));
        expect(entry.header_fingerprint).toMatch(/^[a-f0-9]{64}$/);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('blocks a locatable raw file without provenance and never writes final bytes', async () => {
    const root = join(tmpdir(), `stage3-legacy-${Date.now()}`);
    const images = join(root, 'images');
    const out = join(root, 'out');
    const plan = join(root, 'slide_plan.json');
    try {
      mkdirSync(images, { recursive: true });
      png(join(images, '07_s07_problem.png'));
      writeFileSync(plan, JSON.stringify({ slides: [
        { id: 's07_problem', layout_contract: { render_mode: 'full-page' } },
      ] }), 'utf8');
      const { lockHeaders } = await import('../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs');
      await expect(lockHeaders({ images, slidePlan: plan, out })).rejects.toThrow(/not provenance-verified/i);
      expect(() => readFileSync(join(out, 's07_problem.png'))).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
