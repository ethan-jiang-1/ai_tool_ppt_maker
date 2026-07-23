import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCanvas } from '@napi-rs/canvas';
import { createVersion, initLegacyBundle } from '../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';
import {
  materializeStructuralVersion,
  stage1,
  stage2,
} from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs';
import {
  buildImageManifestEntry,
  generationProfile,
  readImageManifest,
  writeImageManifestAtomic,
} from '../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_provenance.mjs';
import { sha256File } from '../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs';
import {
  buildHeaderReviewInputs,
  mergeHeaderReviewRecord,
} from '../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/header_review.mjs';
import { DEFAULT_CONFIG } from '../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/visual_config.mjs';
import { createDefaultState, readState, writeState } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../helpers/html_first_fixture.mjs';

const UP = 'PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs';

function structuralSpec(slides) {
  return `---\nidentity:\n  scheme: mnemonic-v1\n---\n\n${slides.map((slide, index) => `## Slide ${String(index + 1).padStart(2, '0')}: ${slide.id}\n\n` +
    `**VISUAL TYPE**: ${slide.visualType || 'Framework'}\n` +
    `**RENDER MODE**: ${slide.mode || 'body+header-lock'}\n` +
    `**KICKER**: CONTEXT\n` +
    `**TITLE**: ${slide.title}\n` +
    `**IMAGE PROMPT**: ${slide.prompt}\n` +
    `> **SPEAKER NOTE**: Note for ${slide.id}.\n`).join('\n')}`;
}

function writeTestPng(path, color) {
  const canvas = createCanvas(320, 180);
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.fillRect(0, 0, 320, 180);
  writeFileSync(path, canvas.toBuffer('image/png'));
}

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
      initLegacyBundle(deck, null, 'keynote', 'dark-executive');
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
      expect(envelope.diagnostic.next.invocation.args).toEqual([UP.replace('PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs', join(process.cwd(), UP)), '--run-dir', runDir, '--stage', '1', '--resolution', '2k']);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('turns production readiness into a human-owned gate action', () => {
    const deck = join(mkdtempSync(join(tmpdir(), 'pipeline-gate-')), 'deck_pipeline_gate');
    try {
      initLegacyBundle(deck, null, 'keynote', 'dark-executive');
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

  it('materializes verified retained raw renders and reviewed evidence without a renderer', async () => {
    const deck = join(mkdtempSync(join(tmpdir(), 'pipeline-structural-')), 'deck_pipeline_structural');
    const originalFetch = globalThis.fetch;
    try {
      initLegacyBundle(deck, null, 'keynote', 'dark-executive');
      const source = join(deck, '3_versions', 'v1');
      const style = join(deck, '2_backbone', 'visual-style', 'style_master.jpg');
      writeFileSync(style, 'stable-style', 'utf8');
      const retained = [
        { id: 'DeckGo', title: 'Opening', prompt: 'Opening visual', mode: 'full-page', visualType: 'Title / Opener' },
        { id: 'UXGap', title: 'Friction', prompt: 'Friction visual', mode: 'full-page' },
        { id: 'LockIt', title: 'Locked body', prompt: 'Locked body visual' },
      ];
      writeFileSync(join(source, 'slide-specifications.md'), structuralSpec(retained), 'utf8');
      expect(await stage1(source, false)).toBe(true);

      const sourceGenerated = join(source, '_generated');
      const sourcePrompts = JSON.parse(readFileSync(join(sourceGenerated, 'page_prompts', '_prompts.json'), 'utf8')).slides;
      const images = join(sourceGenerated, 'page_images_full');
      mkdirSync(images, { recursive: true });
      const profile = generationProfile({
        styleReferenceSha256: sha256File(style),
        resolution: '2k',
        model: 'gpt-image-2',
        semanticOptions: { size: '16:9', n: 1 },
      });
      const manifest = { version: 1, slides: {} };
      for (const prompt of sourcePrompts) {
        const imagePath = join(images, `${prompt.id}.png`);
        writeTestPng(imagePath, prompt.id === 'DeckGo' ? '#123456' : prompt.id === 'UXGap' ? '#236789' : '#345678');
        manifest.slides[prompt.id] = buildImageManifestEntry({
          slideId: prompt.id,
          output: `${prompt.id}.png`,
          prompt: prompt.prompt.trim(),
          profile,
          imagePath,
          generatedAt: '2026-07-16T00:00:00.000Z',
        });
      }
      writeImageManifestAtomic(images, manifest);

      let rendererCalls = 0;
      globalThis.fetch = async () => {
        rendererCalls += 1;
        throw new Error('current Stage 2 attempted a remote renderer call');
      };
      const previousKey = process.env.IMAGE2_API_KEY;
      const previousBaseUrl = process.env.IMAGE2_BASE_URL;
      delete process.env.IMAGE2_API_KEY;
      delete process.env.IMAGE2_BASE_URL;
      expect(await stage2(source, { forceImages: false, requireHeaderReview: false })).toBe(true);
      expect(rendererCalls).toBe(0);
      if (previousKey === undefined) delete process.env.IMAGE2_API_KEY;
      else process.env.IMAGE2_API_KEY = previousKey;
      if (previousBaseUrl === undefined) delete process.env.IMAGE2_BASE_URL;
      else process.env.IMAGE2_BASE_URL = previousBaseUrl;

      const sourcePlan = JSON.parse(readFileSync(join(sourceGenerated, 'slide_plan.json'), 'utf8')).slides;
      const reviewInputs = buildHeaderReviewInputs(sourcePlan, DEFAULT_CONFIG);
      const sourceRecord = mergeHeaderReviewRecord({
        inputs: reviewInputs,
        reviewedIds: ['DeckGo'],
        provenanceEntries: { DeckGo: manifest.slides.DeckGo },
        profile,
        acceptedRisks: { UXGap: { reason: 'test waiver' } },
      });
      sourceRecord.slides.UXGap = {
        status: 'waived',
        fingerprint: reviewInputs.slideFingerprints.UXGap || 'waived-fingerprint',
        image_sha256: manifest.slides.UXGap.image_sha256,
      };
      const state = createDefaultState();
      state.nodes['header-review'] = { by_version: { '3_versions/v1': sourceRecord } };
      writeState(deck, state);

      const target = createVersion(source, 'v2');
      writeFileSync(join(target, 'slide-specifications.md'), structuralSpec([
        retained[1],
        retained[0],
        retained[2],
        { id: 'NewAsk', title: 'New request', prompt: 'New request visual' },
      ]), 'utf8');

      globalThis.fetch = async () => {
        rendererCalls += 1;
        throw new Error('structural path attempted a remote renderer call');
      };
      const result = await materializeStructuralVersion({ sourceRunDir: source, targetRunDir: target });
      expect(rendererCalls).toBe(0);
      const targetPrompts = JSON.parse(readFileSync(join(target, '_generated', 'page_prompts', '_prompts.json'), 'utf8')).slides;
      expect(
        result.materialized_ids,
        JSON.stringify({
          results: result.materialization_results,
          sourcePrompts: Object.fromEntries(sourcePrompts.map((item) => [item.id, item.prompt])),
          targetPrompts: Object.fromEntries(targetPrompts.map((item) => [item.id, item.prompt])),
          manifest,
        }, null, 2),
      ).toEqual(['UXGap', 'DeckGo', 'LockIt']);
      expect(result.needs_render).toEqual(['NewAsk']);
      expect(result.slides.find((slide) => slide.slide_id === 'UXGap').classifications).toEqual(['retained', 'reordered']);
      expect(result.slides.find((slide) => slide.slide_id === 'NewAsk').classifications).toEqual(['inserted']);

      const targetImages = join(target, '_generated', 'page_images_full');
      const targetManifest = readImageManifest(targetImages).manifest;
      expect(Object.keys(targetManifest.slides).sort()).toEqual(['DeckGo', 'LockIt', 'UXGap']);
      expect(targetManifest.slides.DeckGo).toMatchObject({
        output: 'DeckGo.png',
        materialized_from: { source_version: '3_versions/v1', source_output: 'DeckGo.png' },
      });
      expect(sha256File(join(targetImages, 'DeckGo.png'))).toBe(manifest.slides.DeckGo.image_sha256);
      expect(existsSync(join(targetImages, 'NewAsk.png'))).toBe(false);
      expect(existsSync(join(target, '_generated', 'header_locked', '_manifest.json'))).toBe(false);

      const targetState = readState(deck);
      expect(targetState.nodes['header-review'].by_version['3_versions/v2'].slides.DeckGo).toMatchObject({
        status: 'reviewed',
        source_lineage: { source_version: '3_versions/v1' },
      });
      expect(targetState.nodes['header-review'].by_version['3_versions/v2'].slides.UXGap).toBeUndefined();
      expect(result.review_warnings).toContainEqual({ slide_id: 'UXGap', reason: 'waiver-not-carried' });
      expect(JSON.parse(readFileSync(result.receipt_path, 'utf8')).renderer_calls).toBe(0);

      const beforeExplicit = readImageManifest(targetImages).manifest;
      const responseCanvas = createCanvas(320, 180);
      const responsePng = responseCanvas.toBuffer('image/png').toString('base64');
      globalThis.fetch = async () => {
        rendererCalls += 1;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: [{ b64_json: responsePng }] }),
          headers: { get: () => 'application/json' },
        };
      };
      const explicitPreviousKey = process.env.IMAGE2_API_KEY;
      process.env.IMAGE2_API_KEY = 'structural-explicit-refresh-test';
      const { generateLegacyImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/05-iteration/index.mjs');
      const explicit = await generateImages({
        promptJson: join(target, '_generated', 'page_prompts', '_prompts.json'),
        outDir: targetImages,
        styleReference: style,
        resolution: '2k',
        model: 'gpt-image-2',
        only: ['NewAsk'],
        force: true,
        promptIsFinal: true,
        baseUrl: ['https://renderer.example.test/v1'],
      });
      if (explicitPreviousKey === undefined) delete process.env.IMAGE2_API_KEY;
      else process.env.IMAGE2_API_KEY = explicitPreviousKey;
      expect(explicit).toMatchObject({ generated: 1, errors: [] });
      expect(rendererCalls).toBe(1);
      const afterExplicit = readImageManifest(targetImages).manifest;
      for (const id of ['DeckGo', 'UXGap', 'LockIt']) {
        expect(afterExplicit.slides[id].generation_fingerprint).toBe(beforeExplicit.slides[id].generation_fingerprint);
      }

      globalThis.fetch = async () => {
        rendererCalls += 1;
        throw new Error('structural path attempted a remote renderer call');
      };

      const completeTarget = createVersion(source, 'v3');
      writeFileSync(join(completeTarget, 'slide-specifications.md'), structuralSpec([
        retained[1], retained[0],
      ]), 'utf8');
      const complete = await materializeStructuralVersion({ sourceRunDir: source, targetRunDir: completeTarget });
      expect(rendererCalls).toBe(1);
      expect(complete.needs_render).toEqual([]);
      expect(complete.production_complete).toBe(true);
      expect(complete.completed_local_stages).toEqual(['stage1', 'stage3', 'contact-sheet', 'stage4', 'stage5']);
      const finalManifest = JSON.parse(readFileSync(join(completeTarget, '_generated', 'header_locked', '_manifest.json'), 'utf8'));
      expect(Object.values(finalManifest.entries).map((entry) => entry.slide_id).sort()).toEqual(['DeckGo', 'UXGap']);
      const assembly = JSON.parse(readFileSync(join(completeTarget, '_generated', 'qa', 'pptx_assembly.json'), 'utf8'));
      expect(assembly.ordered_slide_ids).toEqual(['UXGap', 'DeckGo']);
      const notes = JSON.parse(readFileSync(join(completeTarget, '_generated', 'qa', 'notes_injection.json'), 'utf8'));
      expect(notes.ordered_slide_ids).toEqual(['UXGap', 'DeckGo']);
      expect(existsSync(join(completeTarget, '_generated', 'preview', 'contact_sheet.jpg'))).toBe(true);
      const completeRaw = readImageManifest(join(completeTarget, '_generated', 'page_images_full')).manifest;
      expect(completeRaw.slides.DeckGo.generation_fingerprint).toBe(manifest.slides.DeckGo.generation_fingerprint);
      expect(completeRaw.slides.UXGap.generation_fingerprint).toBe(manifest.slides.UXGap.generation_fingerprint);

      writeTestPng(join(images, 'UXGap.png'), '#ff0000');
      const staleTarget = createVersion(source, 'v4');
      writeFileSync(join(staleTarget, 'slide-specifications.md'), structuralSpec([
        retained[1], retained[0], retained[2],
      ]), 'utf8');
      const stale = await materializeStructuralVersion({ sourceRunDir: source, targetRunDir: staleTarget });
      expect(rendererCalls).toBe(1);
      expect(stale.needs_render).toEqual(['UXGap']);
      expect(stale.materialized_ids).toEqual(['DeckGo', 'LockIt']);
      expect(stale.materialization_results.find((entry) => entry.slide_id === 'UXGap')).toMatchObject({
        status: 'needs_render',
        reason: 'artifact SHA-256 mismatch',
      });
      expect(existsSync(join(staleTarget, '_generated', 'page_images_full', 'DeckGo.png'))).toBe(true);
      expect(existsSync(join(staleTarget, '_generated', 'page_images_full', 'UXGap.png'))).toBe(false);
      expect(existsSync(join(staleTarget, '_generated', 'header_locked', '_manifest.json'))).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('materializes HTML structural targets locally without inheriting source approvals or Image2 output', async () => {
    const fixture = createHtmlFirstRun('pipeline-html-structural-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'HeroGo', title: 'Opening', note: 'Opening note' }),
        htmlFirstSlide({ number: 2, id: 'UXGap', title: 'Friction', note: 'Friction note' }),
      ]));
      expect(await stage1(fixture.runDir, false)).toBe(true);
      expect(await (await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs')).stage2Html(fixture.runDir, { dryRun: false })).toBe(true);
      expect(await (await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs')).stage3Html(fixture.runDir, { dryRun: false })).toBe(true);

      const review = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const sourceReadiness = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: sourceReadiness.gates.content.plan.plan_hash, status: 'approved' });
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'visual', planHash: sourceReadiness.gates.visual.plan.plan_hash, status: 'approved' });
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).ready).toBe(true);

      const target = createVersion(fixture.runDir, 'v2');
      writeFileSync(join(target, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ number: 1, id: 'UXGap', title: 'Friction', note: 'Friction note' }),
        htmlFirstSlide({ number: 2, id: 'HeroGo', title: 'Opening', note: 'Opening note' }),
      ]));
      const result = await materializeStructuralVersion({ sourceRunDir: fixture.runDir, targetRunDir: target });
      expect(result).toMatchObject({
        pipeline: 'html-first-v1',
        renderer_calls: 0,
        remote_calls: 0,
        source_order: ['HeroGo', 'UXGap'],
        target_order: ['UXGap', 'HeroGo'],
        needs_render: [],
        needs_local_materialization: [],
        materialized_ids: ['UXGap', 'HeroGo'],
        review_required: true,
        production_complete: false,
      });
      expect(result.reused_html_page_ids.sort()).toEqual(['HeroGo', 'UXGap']);
      expect(result.reused_final_slide_ids.sort()).toEqual(['HeroGo', 'UXGap']);
      expect(existsSync(join(target, '_generated', 'html_production', 'html_pages', 'manifest.json'))).toBe(true);
      expect(existsSync(join(target, '_generated', 'html_production', 'final_slides', 'manifest.json'))).toBe(true);
      expect(existsSync(join(target, '_generated', 'html_production', 'preview', 'manifest.json'))).toBe(true);
      expect(existsSync(join(target, '_generated', 'ppt', 'deck.pptx'))).toBe(false);
      expect(existsSync(join(target, '_generated', 'qa', 'pptx_assembly.json'))).toBe(false);
      expect(existsSync(join(target, '_generated', 'page_images_full'))).toBe(false);
      expect(existsSync(join(target, '_generated', 'header_locked'))).toBe(false);

      const targetReadiness = review.inspectHtmlReviewReadiness(target);
      expect(targetReadiness.ready).toBe(false);
      expect(targetReadiness.gates.content.ready).toBe(false);
      expect(targetReadiness.gates.visual.ready).toBe(false);
      const targetState = readState(fixture.deck);
      expect(targetState.nodes['html-content-review'].by_version['3_versions/v1']).toBeDefined();
      expect(targetState.nodes['html-content-review'].by_version['3_versions/v2']).toBeUndefined();

      const sourceFinal = JSON.parse(readFileSync(join(fixture.runDir, '_generated', 'html_production', 'final_slides', 'manifest.json'), 'utf8'));
      const targetFinal = JSON.parse(readFileSync(join(target, '_generated', 'html_production', 'final_slides', 'manifest.json'), 'utf8'));
      expect(targetFinal.html_production_reset_id).toBe(null);
      expect(targetFinal.entries.map((entry) => entry.slide_id)).toEqual(['UXGap', 'HeroGo']);
      for (const entry of targetFinal.entries) {
        const sourceEntry = sourceFinal.entries.find((candidate) => candidate.slide_id === entry.slide_id);
        expect(sourceEntry.sha256).toBe(entry.sha256);
        expect(entry.path).toMatch(/^objects\//);
      }
      expect(JSON.parse(readFileSync(result.receipt_path, 'utf8')).review_required).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
