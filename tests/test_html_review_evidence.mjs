import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from './helpers/html_first_fixture.mjs';

describe('HTML authoritative review evidence', () => {
  it('keeps inspection read-only and stales exact-plan approvals after source drift', async () => {
    const fixture = createHtmlFirstRun('html-review-evidence-');
    try {
      const { stage1 } = await import('../PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import('../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_renderer.mjs');
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const review = await import('../PPTMAKER_FRAMEWORK/scripts/lib/html_review_evidence.mjs');
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(statePath);
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(pending.ready).toBe(false);
      expect(readFileSync(statePath)).toEqual(before);
      expect(spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'state', fixture.runDir, '--check-gates']).status).toBe(1);
      expect(() => review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: 'a'.repeat(64), status: 'approved' })).toThrow(/missing, stale, or incomplete/);
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: pending.gates.content.plan.plan_hash, status: 'approved' });
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'visual', planHash: pending.gates.visual.plan.plan_hash, status: 'approved' });
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).ready).toBe(true);
      expect(spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'state', fixture.runDir, '--check-gates']).status).toBe(0);

      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ title: 'Changed copy' })]), 'utf8');
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).ready).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('fences and deletes the canonical owner through the confirmed public reset route', async () => {
    const fixture = createHtmlFirstRun('html-review-reset-');
    try {
      const { stage1 } = await import('../PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import('../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_renderer.mjs');
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const owner = join(fixture.runDir, '_generated', 'html_production');
      expect(existsSync(owner)).toBe(true);
      const rejected = spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'refresh', fixture.runDir, '--kind', 'reset-html-production', '--confirm-run-version', 'v1', '--dry-run']);
      expect(rejected.status).toBe(1);
      expect(existsSync(owner)).toBe(true);
      const reset = spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'refresh', fixture.runDir, '--kind', 'reset-html-production', '--confirm-run-version', 'v1']);
      expect(reset.status, String(reset.stderr)).toBe(0);
      expect(existsSync(owner)).toBe(false);
      const review = await import('../PPTMAKER_FRAMEWORK/scripts/lib/html_review_evidence.mjs');
      const snapshot = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(snapshot.ready).toBe(false);
      expect(snapshot.html_production_reset_id).toMatch(/^[0-9a-f]{64}$/);
      expect(review.resetHtmlProduction(fixture.runDir, { confirmedRunVersion: 'v1' })).toMatchObject({ status: 'already-complete', html_production_reset_id: snapshot.html_production_reset_id });
      const rebuilt = await renderer.publishHtmlPages(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      expect(rebuilt.html_production_reset_id).toBe(snapshot.html_production_reset_id);
      expect(rebuilt.manifests[0].manifest.html_production_reset_id).toBe(snapshot.html_production_reset_id);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
