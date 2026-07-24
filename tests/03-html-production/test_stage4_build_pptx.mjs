import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { diagnosticFromError } from '../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { sha256File } from '../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs';
import { createHtmlFirstRun } from '../helpers/html_first_fixture.mjs';
import { buildPresentation } from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs';
import { buildWholePagePresentation } from '../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs';

const S4 = 'PPTMAKER_FRAMEWORK/scripts/03-html-production/stage4_build_pptx.mjs';

async function buildWholePage(options) {
  const runDir = join(options.images, '..', '..');
  return buildWholePagePresentation({ ...options, runDir });
}

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
    const generated = join(root, '_generated');
    const images = join(generated, 'header_locked');
    const plan = join(generated, 'slide_plan.json');
    const out = join(generated, 'ppt', 'deck.pptx');
    try {
      mkdirSync(images, { recursive: true });
      writeFileSync(join(root, 'slide-specifications.md'), '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n', 'utf8');
      writeFileSync(plan, JSON.stringify({ slides: [{ id: 's1' }, { id: 's2' }] }), 'utf8');
      let error;
      try {
        await buildWholePage({ images, slidePlan: plan, out });
      } catch (caught) {
        error = caught;
      }
      expect(diagnosticFromError(error).issues.map((issue) => issue.subject.id)).toEqual(['s1', 's2']);
      const result = spawnSync('node', [S4, '--run-dir', root], { encoding: 'utf8', timeout: 10000 });
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
      writeFileSync(join(images, '_manifest.json'), JSON.stringify({ version: 2, pipeline: 'whole-page-image2-v1', entries }), 'utf8');
      writeFileSync(plan, JSON.stringify({ slides: [
        { id: 'AICost', slide_id: 'AICost', position: 1 },
        { id: 'UXGap', slide_id: 'UXGap', position: 2 },
      ] }), 'utf8');
      const result = await buildWholePage({ images, slidePlan: plan, out });

      expect(result.slideCount).toBe(2);
      expect(existsSync(out)).toBe(true);
      expect(result.receipt).toMatchObject({ schema_version: 2, pipeline: 'whole-page-image2-v1', html_production_reset_id: null, html_delivery_digest: null });
      expect(result.receipt.ordered_slide_ids).toEqual(['AICost', 'UXGap']);
      expect(result.receipt.final_images.map((image) => image.slide_id)).toEqual(['AICost', 'UXGap']);
      expect(result.receipt.final_images.every((image) => image.artifact_kind === 'final-slide' && /^[0-9a-f]{64}$/.test(image.final_slide_fingerprint))).toBe(true);
      expect(result.receipt.pptx_sha256).toBe(sha256File(out));
      expect(JSON.parse(readFileSync(result.receiptPath, 'utf8'))).toEqual(result.receipt);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses an unproven historical final filename and leaves no assembly receipt', async () => {
    const root = join(tmpdir(), `stage4-unproven-${Date.now()}`);
    const generated = join(root, '_generated');
    const images = join(generated, 'header_locked');
    const plan = join(generated, 'slide_plan.json');
    const out = join(generated, 'ppt', 'deck.pptx');
    try {
      mkdirSync(images, { recursive: true });
      writeFileSync(join(images, '07_s07_problem.png'), 'unproven final');
      writeFileSync(plan, JSON.stringify({ slides: [{ id: 's07_problem' }] }), 'utf8');
      await expect(buildWholePage({ images, slidePlan: plan, out })).rejects.toThrow(/current verified final-slide/i);
      expect(existsSync(join(generated, 'qa', 'pptx_assembly.json'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('assembles canonical HTML final-slide manifest through the provider-neutral adapter', async () => {
    const fixture = createHtmlFirstRun('stage4-html-');
    try {
      const { createCanonicalHtmlValidatedRunContext, publishHtmlComposition } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const { stage1 } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      await publishHtmlComposition(context, {});
      const review = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: pending.gates.content.plan.plan_hash, status: 'approved' });
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'visual', planHash: pending.gates.visual.plan.plan_hash, status: 'approved' });
      const result = await buildPresentation(fixture.runDir);
      expect(result.slideCount).toBe(1);
      expect(result.receipt.schema_version).toBe(2);
      expect(result.receipt.pipeline).toBe('html-first-v1');
      expect(result.receipt.html_delivery_digest).toMatch(/^[0-9a-f]{64}$/);
      expect(result.receipt.final_images[0]).toMatchObject({ artifact_kind: 'final-slide', producer: 'html-compositor-v1', width: 2000, height: 1125, media_profile: 'html-capture-v1' });
      expect(result.receipt.final_images[0].final_slide_fingerprint).toMatch(/^[0-9a-f]{64}$/);
      expect(result.receipt.final_images[0]).not.toHaveProperty('composition_fingerprint');
      expect(result.contactSheet.published).toBe(true);
      const store = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_object_store.mjs');
      const preview = store.readHtmlPreviewManifest(store.htmlOwnerRoot(fixture.runDir, 'preview'), { publicationScope: 'canonical-run', htmlProductionResetId: null, logicalRunVersion: 'v1' });
      expect(preview.manifest.contact_sheets.visual_review).not.toBeNull();
      expect(preview.manifest.contact_sheets.delivery).not.toBeNull();
      expect(existsSync(result.outPath)).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('blocks canonical HTML assembly until both authoritative review records are current', async () => {
    const fixture = createHtmlFirstRun('stage4-html-gates-');
    try {
      const { stage1 } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      await expect(buildPresentation(fixture.runDir)).rejects.toThrow(/authoritative content\/visual review/);
      expect(existsSync(join(fixture.runDir, '_generated', 'ppt', 'deck.pptx'))).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('does not expose direct artifact flags', () => {
    const fixture = createHtmlFirstRun('stage4-html-artifact-mode-');
    try {
      const result = spawnSync('node', [S4, '--images', join(fixture.runDir, '_generated', 'header_locked')], { encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('"code":"FAILED"');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
