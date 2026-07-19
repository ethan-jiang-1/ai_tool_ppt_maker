import { describe, expect, it } from 'vitest';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHtmlFirstRun } from './helpers/html_first_fixture.mjs';
import { validateAndBuildHtmlFirstPlan } from '../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_contract.mjs';
import { buildHtmlReviewPlan, publishHtmlReviewPlan } from '../PPTMAKER_FRAMEWORK/scripts/lib/html_preview.mjs';
import { readHtmlPreviewManifest, htmlOwnerRoot } from '../PPTMAKER_FRAMEWORK/scripts/lib/html_object_store.mjs';

describe('HTML preview review-plan contract', () => {
  it('writes immutable reset-bound plans and independent current slots', async () => {
    const fixture = createHtmlFirstRun('html-preview-plan-');
    try {
      const { plan } = validateAndBuildHtmlFirstPlan({ runDir: fixture.runDir });
      const composition = { pages: plan.slides.map((slide) => ({ slide_id: slide.slide_id, html_sha256: 'a'.repeat(64), composition_variant: 'effective' })) };
      const result = await publishHtmlReviewPlan({ runDir: fixture.runDir, plan, composition, kind: 'content' });
      expect(result.reviewPlan).toMatchObject({ schema: 'pptmaker-html-review-plan-v1', publication_scope: 'canonical-run', html_production_reset_id: null, kind: 'content', approvable: true });
      expect(readFileSync(result.stored.path, 'utf8')).toContain(result.reviewPlan.plan_hash);
      const manifest = readHtmlPreviewManifest(htmlOwnerRoot(fixture.runDir, 'preview'), { publicationScope: 'canonical-run', htmlProductionResetId: null, logicalRunVersion: 'v1' });
      expect(manifest.manifest.review_plans.content.path).toBe(`plans/${result.reviewPlan.plan_hash}.json`);
      expect(manifest.manifest.review_plans.visual).toBeNull();
      expect(buildHtmlReviewPlan({ plan, kind: 'visual', logicalRunVersion: 'v1' })).toMatchObject({ approvable: false, outstanding: ['artifact:HeroGo'] });
      expect(() => buildHtmlReviewPlan({ plan, kind: 'content', logicalRunVersion: 'v1', publicationScope: 'migration-preview', htmlProductionResetId: 'a'.repeat(64) })).toThrow(/null reset/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
