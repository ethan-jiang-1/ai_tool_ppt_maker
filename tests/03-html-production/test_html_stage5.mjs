import { describe, expect, it } from 'vitest';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import JSZip from 'jszip';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../helpers/html_first_fixture.mjs';
import { readState, writeState } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { buildPresentation, injectSpeakerNotes } from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs';

async function approveHtmlReview(runDir) {
  const review = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
  const pending = review.inspectHtmlReviewReadiness(runDir);
  review.publishHtmlGateDecision(runDir, { gate: 'content', planHash: pending.gates.content.plan.plan_hash, status: 'approved' });
  review.publishHtmlGateDecision(runDir, { gate: 'visual', planHash: pending.gates.visual.plan.plan_hash, status: 'approved' });
}

describe('HTML Stage 5 notes lineage', () => {
  it('injects notes by stable slide ID and publishes schema v3', async () => {
    const fixture = createHtmlFirstRun('html-stage5-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ note: 'Stable note for this ID' })]));
      const { createCanonicalHtmlValidatedRunContext, publishHtmlComposition } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const { stage1 } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      await publishHtmlComposition(context, {});
      await approveHtmlReview(fixture.runDir);
      await buildPresentation(fixture.runDir);
      const result = await injectSpeakerNotes(fixture.runDir);
      expect(result.notesInjected).toBe(1);
      const receipt = JSON.parse(readFileSync(result.receiptPath, 'utf8'));
      expect(receipt).toMatchObject({ schema_version: 3, pipeline: 'html-first-v1', ordered_slide_ids: ['HeroGo'], html_production_reset_id: null, notes_injected: 1, slide_count: 1 });
      expect(receipt.html_delivery_digest).toMatch(/^[0-9a-f]{64}$/);
      const { validateNotesCompletionReceipt } = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs');
      expect(validateNotesCompletionReceipt(fixture.runDir)).toMatchObject({ valid: true, reason: 'current' });
      const state = readState(fixture.deck);
      state.playbook = 'create-deck';
      state.current_node = 'checkpoint-final-review';
      state.nodes['checkpoint-final-review'] = { status: 'in_progress', execution_id: state.execution_id, run_version: 'v1', evidence: {} };
      writeState(fixture.deck, state);
      const reviewResult = spawnSync('node', [
        'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'state', fixture.runDir,
        '--record-delivery-review', 'proceed',
      ], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
      expect(reviewResult.status, reviewResult.stderr || reviewResult.stdout).toBe(0);
      const reviewed = readState(fixture.deck, { heal: false });
      const delivery = reviewed.nodes['html-delivery-review'].by_version['3_versions/v1'];
      expect(delivery).toMatchObject({
        schema: 'pptmaker-html-delivery-review-v2',
        decision: 'proceed',
        reason: null,
        run_version: 'v1',
        evidence_complete: true,
        waived_checks: [],
      });
      expect(Object.keys(delivery).sort()).toEqual([
        'schema', 'pipeline', 'run_version', 'html_production_reset_id', 'html_delivery_digest',
        'contact_sheet_manifest_path', 'contact_sheet_manifest_sha256', 'contact_sheet_path', 'contact_sheet_sha256',
        'assembly_receipt_path', 'assembly_receipt_sha256', 'pptx_path', 'pptx_sha256',
        'notes_receipt_path', 'notes_receipt_sha256', 'decision', 'reason', 'evidence_complete',
        'waived_checks', 'decided_at',
      ].sort());
      expect(reviewed.nodes['checkpoint-final-review'].decision).toMatchObject({ value: 'proceed', kind: 'user', evidence_ref: { node_id: 'html-delivery-review', version_key: '3_versions/v1' } });
      const reviewApi = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      expect(reviewApi.inspectHtmlReviewReadiness(fixture.runDir).delivery).toMatchObject({ freshness: 'current', decision: 'proceed' });
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ note: null })]).replace(
        '**SLIDE BODY**:\n```yaml\nschema_version: 1\nfamily: hero\n```\n',
        '**SLIDE BODY**:\n```yaml\nschema_version: 1\nfamily: hero\n```\n> **SPEAKER NOTE**\n>\n> Changed after delivery review\n',
      ));
      expect(reviewApi.inspectHtmlReviewReadiness(fixture.runDir)).toMatchObject({
        content: { freshness: 'current' },
        visual: { freshness: 'current' },
        delivery: { freshness: 'stale', decision: 'proceed' },
      });

      const notesRefresh = spawnSync('node', [
        'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'refresh', fixture.runDir,
        '--kind', 'notes',
      ], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
      expect(notesRefresh.status, notesRefresh.stderr || notesRefresh.stdout).toBe(0);
      const refreshedReceipt = JSON.parse(readFileSync(join(fixture.runDir, '_generated', 'qa', 'notes_injection.json'), 'utf8'));
      expect(refreshedReceipt.notes_fingerprint).toMatch(/^[0-9a-f]{64}$/);
      const refreshedState = readState(fixture.deck);
      refreshedState.playbook = 'create-deck';
      refreshedState.current_node = 'checkpoint-final-review';
      refreshedState.nodes['checkpoint-final-review'] = {
        status: 'in_progress',
        execution_id: refreshedState.execution_id,
        run_version: 'v1',
        evidence: {},
      };
      writeState(fixture.deck, refreshedState);
      const renewedReview = spawnSync('node', [
        'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'state', fixture.runDir,
        '--record-delivery-review', 'proceed',
      ], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
      expect(renewedReview.status, renewedReview.stderr || renewedReview.stdout).toBe(0);
      expect(reviewApi.inspectHtmlReviewReadiness(fixture.runDir)).toMatchObject({
        content: { freshness: 'current' },
        visual: { freshness: 'current' },
        delivery: { freshness: 'current', decision: 'proceed' },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('reorders notes by stable slide ID after a structural reorder', async () => {
    const fixture = createHtmlFirstRun('html-stage5-reorder-');
    try {
      const source = (slides) => writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource(slides), 'utf8');
      source([
        htmlFirstSlide({ number: 1, id: 'AlphaGo', title: 'Alpha', note: 'Note Alpha' }),
        htmlFirstSlide({ number: 2, id: 'BetaGo', title: 'Beta', note: 'Note Beta' }),
      ]);
      const pipeline = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      expect(await pipeline.stage1(fixture.runDir, false)).toBe(true);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      await approveHtmlReview(fixture.runDir);
      await buildPresentation(fixture.runDir);
      await injectSpeakerNotes(fixture.runDir);

      source([
        htmlFirstSlide({ number: 1, id: 'BetaGo', title: 'Beta', note: 'Note Beta' }),
        htmlFirstSlide({ number: 2, id: 'AlphaGo', title: 'Alpha', note: 'Note Alpha' }),
      ]);
      expect(await pipeline.stage1(fixture.runDir, false)).toBe(true);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      await approveHtmlReview(fixture.runDir);
      const built = await buildPresentation(fixture.runDir);
      await injectSpeakerNotes(fixture.runDir);
      const zip = await JSZip.loadAsync(readFileSync(built.outPath));
      expect(await zip.file('ppt/notesSlides/notesSlide1.xml').async('text')).toContain('Note Beta');
      expect(await zip.file('ppt/notesSlides/notesSlide2.xml').async('text')).toContain('Note Alpha');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);

  it('rejects an empty note slot before modifying the HTML assembly', async () => {
    const fixture = createHtmlFirstRun('html-stage5-empty-note-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide()]), 'utf8');
      const { createCanonicalHtmlValidatedRunContext, publishHtmlComposition } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      const { stage1 } = await import('../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      await publishHtmlComposition(context, {});
      await approveHtmlReview(fixture.runDir);
      await buildPresentation(fixture.runDir);
      await expect(injectSpeakerNotes(fixture.runDir)).rejects.toThrow(/missing SPEAKER NOTE/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);
});
