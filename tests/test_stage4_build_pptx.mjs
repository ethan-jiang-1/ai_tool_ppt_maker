import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { diagnosticFromError } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { sha256File } from '../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs';

const S4 = 'PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs';

describe('stage4_build_pptx', () => {
  it('rejects missing inputs', () => {
    try {
      execSync(`node ${S4}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/image|slide.plan|required|usage/i);
    }
  });

  it('retains per-slide missing image evidence at the PPTX boundary', async () => {
    const root = join(tmpdir(), `stage4-diagnostic-${Date.now()}`);
    const images = join(root, 'images');
    const plan = join(root, 'slide_plan.json');
    const out = join(root, 'deck.pptx');
    try {
      mkdirSync(images, { recursive: true });
      writeFileSync(plan, JSON.stringify({ slides: [{ id: 's1' }, { id: 's2' }] }), 'utf8');
      const { buildPptx } = await import('../PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs');
      let error;
      try {
        await buildPptx({ images, slidePlan: plan, out });
      } catch (caught) {
        error = caught;
      }
      expect(diagnosticFromError(error).issues.map((issue) => issue.subject.id)).toEqual(['s1', 's2']);
      const result = spawnSync('node', [S4, '--images', images, '--slide-plan', plan, '--out', out], { encoding: 'utf8', timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: 'artifact', stage: 'stage4', operation: 'resolve-images' });
      expect(envelope.diagnostic.issues[0].lineage.at(-1).path).toBe(out);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('assembles manifest-proven final slides in plan order and publishes an atomic receipt', async () => {
    const root = join(tmpdir(), `stage4-order-${Date.now()}`);
    const generated = join(root, '_generated');
    const images = join(generated, 'header_locked');
    const plan = join(generated, 'slide_plan.json');
    const out = join(generated, 'ppt', 'deck.pptx');
    try {
      mkdirSync(images, { recursive: true });
      const entries = {};
      for (const [index, id] of ['UXGap', 'AICost'].entries()) {
        const canvas = createCanvas(32, 18);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = index ? '#990000' : '#009900';
        ctx.fillRect(0, 0, 32, 18);
        const path = join(images, `${id}.png`);
        writeFileSync(path, canvas.toBuffer('image/png'));
        entries[`${id}::image2::final-slide`] = {
          slide_id: id,
          render_engine: 'image2',
          artifact_kind: 'final-slide',
          output: `${id}.png`,
          output_sha256: sha256File(path),
          fingerprint: id.repeat(64).slice(0, 64),
          profile: { render_mode: 'full-page' },
        };
      }
      writeFileSync(join(images, '_manifest.json'), JSON.stringify({ version: 1, entries }), 'utf8');
      writeFileSync(plan, JSON.stringify({ slides: [
        { id: 'AICost', slide_id: 'AICost', position: 1 },
        { id: 'UXGap', slide_id: 'UXGap', position: 2 },
      ] }), 'utf8');
      const { buildPptx } = await import('../PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs');
      const result = await buildPptx({ images, slidePlan: plan, out });

      expect(result.slideCount).toBe(2);
      expect(existsSync(out)).toBe(true);
      expect(result.receipt.ordered_slide_ids).toEqual(['AICost', 'UXGap']);
      expect(result.receipt.final_images.map((image) => image.slide_id)).toEqual(['AICost', 'UXGap']);
      expect(result.receipt.pptx_sha256).toBe(sha256File(out));
      expect(JSON.parse(readFileSync(result.receiptPath, 'utf8'))).toEqual(result.receipt);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses legacy-located final bytes and leaves no assembly receipt', async () => {
    const root = join(tmpdir(), `stage4-legacy-${Date.now()}`);
    const generated = join(root, '_generated');
    const images = join(generated, 'header_locked');
    const plan = join(generated, 'slide_plan.json');
    const out = join(generated, 'ppt', 'deck.pptx');
    try {
      mkdirSync(images, { recursive: true });
      writeFileSync(join(images, '07_s07_problem.png'), 'legacy final');
      writeFileSync(plan, JSON.stringify({ slides: [{ id: 's07_problem' }] }), 'utf8');
      const { buildPptx } = await import('../PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs');
      await expect(buildPptx({ images, slidePlan: plan, out })).rejects.toThrow(/legacy-located/i);
      expect(existsSync(join(generated, 'qa', 'pptx_assembly.json'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
