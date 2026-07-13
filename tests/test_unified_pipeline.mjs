import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initBundle } from '../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs';

const UP = 'PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs';

describe('unified_pipeline', () => {
  it('rejects without run-dir', () => {
    try {
      execSync(`node ${UP}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/run.dir|required|usage/i);
    }
  });

  it('preserves Stage issues while rebuilding the parent rerun action', () => {
    const deck = join(mkdtempSync(join(tmpdir(), 'pipeline-diagnostic-')), 'deck_pipeline');
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const runDir = join(deck, '3_versions', 'v1');
      const spec = join(runDir, 'slide-specifications.md');
      writeFileSync(spec, `## Slide 01: s01\n\n**VISUAL TYPE**: Framework\n**RENDER MODE**: unsupported\n**TITLE**: A title\n`, 'utf8');
      const result = spawnSync('node', [UP, '--run-dir', runDir, '--stage', '1'], { encoding: 'utf8', timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.where).toBe('unified_pipeline.stage1');
      expect(envelope.diagnostic).toMatchObject({
        category: 'source_validation',
        stage: 'stage1',
        operation: 'run-stage',
        next: { action: 'edit_source', requires_human: false },
      });
      expect(envelope.diagnostic.issues.length).toBeGreaterThanOrEqual(2);
      expect(envelope.diagnostic.issues).toContainEqual(expect.objectContaining({
        subject: { kind: 'slide', id: 's01', field: 'RENDER MODE' },
        source: { path: spec, line: 4 },
      }));
      expect(envelope.diagnostic.next.invocation.args).toEqual([UP.replace('PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs', join(process.cwd(), UP)), '--run-dir', runDir, '--stage', '1', '--resolution', '2k']);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('turns production readiness into a human-owned gate action', () => {
    const deck = join(mkdtempSync(join(tmpdir(), 'pipeline-gate-')), 'deck_pipeline_gate');
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const runDir = join(deck, '3_versions', 'v1');
      writeFileSync(join(deck, '2_backbone', 'visual-style', 'style_master.jpg'), 'style', 'utf8');
      const result = spawnSync('node', [UP, '--run-dir', runDir, '--stage', '2', '--dry-run'], { encoding: 'utf8', timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: 'gate', next: { action: 'review', requires_human: true } });
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});
