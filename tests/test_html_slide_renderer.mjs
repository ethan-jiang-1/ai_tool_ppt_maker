import { describe, expect, it } from 'vitest';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHtmlFirstRun, htmlFirstSource, htmlFirstSlide } from './helpers/html_first_fixture.mjs';
import {
  buildHtmlPages,
  composeHtmlSlides,
  composeHtmlSlidesVerified,
  publishHtmlComposition,
  publishHtmlFinalSlides,
  publishHtmlPages,
  compositionFingerprintV1,
  compositionInputReceiptV1,
  htmlDeliveryDigestV1,
  createCanonicalHtmlValidatedRunContext,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_renderer.mjs';

describe('opaque HTML slide renderer seam', () => {
  it('issues only an opaque canonical context and builds a self-contained escaped page', () => {
    const fixture = createHtmlFirstRun('renderer-context-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ title: 'A <safe> & exact', body: 'schema_version: 1\nfamily: hero\nhero_statement: "Use <local> bytes"\n' }),
      ]));
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const result = buildHtmlPages(context, { slideIds: ['HeroGo'], compositionVariant: 'effective', dryRun: true });
      expect(result.publication_scope).toBe('canonical-run');
      expect(result.html_production_reset_id).toBeNull();
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].html).toContain("default-src 'none'");
      expect(result.pages[0].html).toContain('A &lt;safe&gt; &amp; exact');
      expect(result.pages[0].html).not.toContain(fixture.root);
      expect(result.pages[0].html).not.toContain('file:');
      expect(result.pages[0].html).toContain('data:font/woff2;base64,');
      expect(result.pages[0].leaf_markers).toContain('HeroGo:header.title');
      expect(result.dry_run).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects forged contexts, path/reset injection, and request widening', () => {
    const fixture = createHtmlFirstRun('renderer-forge-');
    try {
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      expect(() => buildHtmlPages({ ...context }, {})).toThrow(/opaque|invalid/);
      expect(() => buildHtmlPages(context, { runDir: fixture.runDir })).toThrow(/unsupported key/);
      expect(() => buildHtmlPages(context, { htmlProductionResetId: 'a'.repeat(64) })).toThrow(/unsupported key/);
      expect(() => createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir, htmlProductionResetId: 'a'.repeat(64) })).toThrow(/options are closed/);
      expect(() => buildHtmlPages(context, { compositionVariant: 'anything' })).toThrow(/effective or forced/);
      expect(() => buildHtmlPages(context, { slideIds: ['Unknown'] })).toThrow(/not in the validated plan/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('keeps composition variant explicit and composes without exposing private context', () => {
    const fixture = createHtmlFirstRun('renderer-compose-');
    try {
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const result = composeHtmlSlides(context, { compositionVariant: 'forced-fallback' });
      expect(result.composition_variant).toBe('forced-fallback');
      expect(result.final_slides[0]).toMatchObject({ slide_id: 'HeroGo', composition_variant: 'forced-fallback' });
      expect(Object.keys(result)).not.toContain('runDir');
      expect(Object.keys(result)).not.toContain('validated');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('renders the closed data chart adapter with deterministic canonical SVG', () => {
    const fixture = createHtmlFirstRun('renderer-chart-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ body: 'schema_version: 1\nfamily: data\nchart:\n  kind: bar\n  categories: [A, B, C]\n  series:\n    - name: Revenue\n      values: [1, 2, 3]\n  value_format:\n    kind: number\n    decimals: 0\n  legend: hide\n' }),
      ]));
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const pages = buildHtmlPages(context, { dryRun: true }).pages;
      const repeated = buildHtmlPages(context, { dryRun: true }).pages;
      expect(pages[0].html).toContain('data-pm-box="chart"');
      expect(pages[0].html).toContain('<svg');
      expect(pages[0].html).not.toMatch(/\bzr\d+-/);
      expect(pages[0].html_sha256).toBe(repeated[0].html_sha256);
      expect(pages[0].effective_visual_state).toBeNull();
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('verifies sequential composition with exact markers, font evidence, and final PNG', async () => {
    const fixture = createHtmlFirstRun('renderer-verified-');
    try {
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const result = await composeHtmlSlidesVerified(context, { compositionVariant: 'effective' });
      expect(result.final_slides).toHaveLength(1);
      expect(result.final_slides[0]).toMatchObject({ artifact_kind: 'final-slide', width: 2000, height: 1125 });
      expect(result.final_slides[0].capture.leafEvidence.length).toBe(result.pages[0].leaf_markers.length);
      expect(result.final_slides[0].capture.networkProbe.every(({ denied }) => denied)).toBe(true);
      expect(result.final_slides[0].capture.fonts['HeroGo:header.title'].fonts[0].isCustomFont).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('keeps composition identity slide-local while making delivery order-dependent', () => {
    const fixture = createHtmlFirstRun('renderer-fingerprint-');
    try {
      const source = htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'AlphaGo', title: 'Alpha' }),
        htmlFirstSlide({ number: 2, id: 'BetaGo', title: 'Beta' }),
      ]);
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), source);
      const first = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const alpha = compositionFingerprintV1(first, 'AlphaGo');
      const beta = compositionFingerprintV1(first, 'BetaGo');
      const receipt = compositionInputReceiptV1(first, 'AlphaGo');
      expect(receipt.composition_fingerprint).toBe(alpha);
      const firstDelivery = [{ slide_id: 'AlphaGo', composition_variant: 'effective', composition_fingerprint: alpha, png_sha256: 'a'.repeat(64) }, { slide_id: 'BetaGo', composition_variant: 'effective', composition_fingerprint: beta, png_sha256: 'b'.repeat(64) }];
      const plan = { ordered_plan_digest: 'c'.repeat(64), slides: [{ slide_id: 'AlphaGo' }, { slide_id: 'BetaGo' }] };
      const digest = htmlDeliveryDigestV1(plan, firstDelivery);
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'BetaGo', title: 'Beta' }),
        htmlFirstSlide({ number: 2, id: 'AlphaGo', title: 'Alpha' }),
      ]));
      const reordered = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      expect(compositionFingerprintV1(reordered, 'AlphaGo')).toBe(alpha);
      expect(compositionFingerprintV1(reordered, 'BetaGo')).toBe(beta);
      const reorderedDigest = htmlDeliveryDigestV1({ ...plan, slides: [{ slide_id: 'BetaGo' }, { slide_id: 'AlphaGo' }] }, [firstDelivery[1], firstDelivery[0]]);
      expect(reorderedDigest).not.toBe(digest);
      expect(compositionFingerprintV1(first, 'AlphaGo', 'forced-fallback')).not.toBe(alpha);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('publishes Stage 2 pages before Stage 3 final slides using separate current manifests', async () => {
    const fixture = createHtmlFirstRun('renderer-publish-');
    try {
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      await expect(publishHtmlFinalSlides(context, {})).rejects.toThrow(/run Stage 2 first/);
      const stage2 = await publishHtmlPages(context, {});
      expect(stage2.manifests).toHaveLength(1);
      expect(stage2.manifests[0].manifest.schema).toMatch(/pptmaker-html-pages-manifest-v1/);
      const stage3 = await publishHtmlFinalSlides(context, {});
      expect(stage3.manifests).toHaveLength(1);
      expect(stage3.manifests[0].manifest.schema).toMatch(/pptmaker-html-final-slides-manifest-v1/);
      expect(stage3.contact_sheet?.published).toBe(true);
      expect([...stage2.manifests, ...stage3.manifests].flatMap((entry) => entry.manifest.entries).every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256))).toBe(true);
      expect([...stage2.manifests, ...stage3.manifests].flatMap((entry) => entry.manifest.entries).every((entry) => !entry.path.includes('composition'))).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('merges scoped rebuilds in current plan order and evicts deleted IDs', async () => {
    const fixture = createHtmlFirstRun('renderer-scoped-publish-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'AlphaGo', title: 'Alpha' }),
        htmlFirstSlide({ number: 2, id: 'BetaGo', title: 'Beta' }),
      ]));
      const first = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      await publishHtmlComposition(first, {});
      const scoped = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const partial = await publishHtmlComposition(scoped, { slideIds: ['BetaGo'] });
      expect(partial.manifests[0].manifest.entries.map((entry) => entry.slide_id)).toEqual(['AlphaGo', 'BetaGo']);
      expect(partial.manifests[1].manifest.entries.map((entry) => entry.slide_id)).toEqual(['AlphaGo', 'BetaGo']);

      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'BetaGo', title: 'Beta' }),
      ]));
      const deleted = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const afterDelete = await publishHtmlComposition(deleted, {});
      expect(afterDelete.manifests[0].manifest.entries.map((entry) => entry.slide_id)).toEqual(['BetaGo']);
      expect(afterDelete.manifests[1].manifest.entries.map((entry) => entry.slide_id)).toEqual(['BetaGo']);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
