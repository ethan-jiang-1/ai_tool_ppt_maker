import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHtmlFirstRun } from './helpers/html_first_fixture.mjs';

const stage2 = 'PPTMAKER_FRAMEWORK/scripts/stage2_render_html.mjs';
const stage3 = 'PPTMAKER_FRAMEWORK/scripts/stage3_compose_slides.mjs';

describe('HTML Stage 2/3 direct CLI surfaces', () => {
  it('help is side-effect free and advertises only canonical run-dir controls', () => {
    const a = execFileSync('node', [stage2, '--help'], { encoding: 'utf8' });
    const b = execFileSync('node', [stage3, '--help'], { encoding: 'utf8' });
    expect(a).toContain('--run-dir'); expect(a).toContain('--variant'); expect(a).not.toContain('--provider');
    expect(b).toContain('--run-dir'); expect(b).toContain('--dry-run'); expect(b).not.toContain('--browser');
  });

  it('rejects arbitrary path/provider/browser overrides before rendering', () => {
    for (const script of [stage2, stage3]) {
      let error;
      try { execFileSync('node', [script, '--run-dir', '/tmp/run', '--provider', 'x'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (caught) { error = caught; }
      expect(error?.status).not.toBe(0);
      const last = String(error?.stderr || '').trim().split(/\r?\n/).at(-1);
      expect(JSON.parse(last)).toMatchObject({ ok: false, code: 'USAGE' });
    }
  });

  it('publishes only pages in Stage 2 and only final slides in Stage 3', () => {
    const fixture = createHtmlFirstRun('html-stage-clis-');
    try {
      execFileSync('node', [stage2, '--run-dir', fixture.runDir], { encoding: 'utf8', timeout: 60_000 });
      const production = join(fixture.runDir, '_generated', 'html_production');
      expect(existsSync(join(production, 'html_pages', 'manifest.json'))).toBe(true);
      expect(existsSync(join(production, 'final_slides', 'manifest.json'))).toBe(false);
      execFileSync('node', [stage3, '--run-dir', fixture.runDir], { encoding: 'utf8', timeout: 60_000 });
      expect(existsSync(join(production, 'final_slides', 'manifest.json'))).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
