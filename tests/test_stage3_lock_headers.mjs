import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { diagnosticFromError } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';

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
});
