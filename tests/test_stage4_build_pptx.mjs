import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { diagnosticFromError } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';

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
});
