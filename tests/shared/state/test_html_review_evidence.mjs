import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { hostname } from 'node:os';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../../helpers/html_first_fixture.mjs';
import { acquireHtmlPublishLock, htmlOwnerRoot, releaseHtmlPublishLock } from '../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_object_store.mjs';
import { createHash } from 'node:crypto';

const sha = (value) => createHash('sha256').update(value).digest('hex');

function writeGateJournal(fixture, {
  oldState,
  newState,
  oldMetadata,
  newMetadata,
  ownerToken = 'a'.repeat(64),
  ownerHost = hostname(),
  ownerPid = 99_999_999,
  createdAt = Date.now() - 61_000,
} = {}) {
  const journal = {
    schema: 'pptmaker-html-gate-approval-journal-v1',
    owner_token: ownerToken,
    owner_host: ownerHost,
    owner_pid: ownerPid,
    created_at_epoch_ms: createdAt,
    run_version: 'v1',
    old_state_sha256: sha(oldState),
    new_state_sha256: sha(newState),
    old_metadata_sha256: sha(oldMetadata),
    new_metadata_sha256: sha(newMetadata),
  };
  const path = join(fixture.deck, '_state', 'gate-approval-journal.json');
  writeFileSync(path, `${JSON.stringify(journal)}\n`, 'utf8');
  return { path, journal };
}

describe('HTML authoritative review evidence', () => {
  it('keeps inspection read-only and stales exact-plan approvals after source drift', async () => {
    const fixture = createHtmlFirstRun('html-review-evidence-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
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

      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ note: 'Notes-only edit' })]), 'utf8');
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).ready).toBe(true);
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ title: 'Changed copy' })]), 'utf8');
      const changed = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(changed.ready).toBe(false);
      expect(changed.gates.content.ready).toBe(false);
      expect(changed.gates.visual.ready).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('fences and deletes the canonical owner through the confirmed public reset route', async () => {
    const fixture = createHtmlFirstRun('html-review-reset-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      expect(await stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const owner = join(fixture.runDir, '_generated', 'html_production');
      expect(existsSync(owner)).toBe(true);
      const liveOwnerRoot = htmlOwnerRoot(fixture.runDir, 'html-pages');
      const liveLock = acquireHtmlPublishLock({ ownerRoot: liveOwnerRoot, ownerKind: 'html-pages', publicationScope: 'canonical-run', inputScopeSha256: sha('live-reset-lock') });
      expect(() => review.resetHtmlProduction(fixture.runDir, { confirmedRunVersion: 'v1' })).toThrow(/active html-pages publication blocks HTML reset/);
      releaseHtmlPublishLock(liveLock);
      const foreignOwnerRoot = htmlOwnerRoot(fixture.runDir, 'preview');
      mkdirSync(foreignOwnerRoot, { recursive: true });
      acquireHtmlPublishLock({ ownerRoot: foreignOwnerRoot, ownerKind: 'preview', publicationScope: 'canonical-run', inputScopeSha256: sha('foreign-reset-lock'), host: 'other-host', pid: 99999999, now: 1 });
      const rejected = spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'refresh', fixture.runDir, '--kind', 'reset-html-production', '--confirm-run-version', 'v1', '--dry-run']);
      expect(rejected.status).toBe(1);
      expect(existsSync(owner)).toBe(true);
      const reset = spawnSync('node', ['PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs', 'refresh', fixture.runDir, '--kind', 'reset-html-production', '--confirm-run-version', 'v1']);
      expect(reset.status, String(reset.stderr)).toBe(0);
      expect(existsSync(owner)).toBe(false);
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

  it('recovers every allowed gate-journal byte pair and rejects the forbidden ordering', async () => {
    const fixture = createHtmlFirstRun('html-review-journal-matrix-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const readiness = review.inspectHtmlReviewReadiness(fixture.runDir);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const metadataPath = join(fixture.deck, 'project-metadata.yaml');
      const oldState = readFileSync(statePath);
      const oldMetadata = readFileSync(metadataPath);
      review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'content',
        planHash: readiness.gates.content.plan.plan_hash,
        status: 'approved',
      });
      const newState = readFileSync(statePath);
      const newMetadata = readFileSync(metadataPath);

      const cases = [
        { state: oldState, metadata: oldMetadata, status: 'aborted' },
        { state: newState, metadata: oldMetadata, status: 'mirror-completed' },
        { state: newState, metadata: newMetadata, status: 'cleaned' },
      ];
      for (const entry of cases) {
        writeFileSync(statePath, entry.state);
        writeFileSync(metadataPath, entry.metadata);
        const { path } = writeGateJournal(fixture, { oldState, newState, oldMetadata, newMetadata });
        if (entry.status === 'aborted') {
          const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
          expect(() => stateApi.writeState(fixture.deck, state)).toThrow(/journal fences state writes/);
        }
        expect(review.recoverHtmlGatePublication(fixture.runDir)).toMatchObject({ status: entry.status });
        expect(existsSync(path)).toBe(false);
      }

      writeFileSync(statePath, oldState);
      writeFileSync(metadataPath, newMetadata);
      const forbidden = writeGateJournal(fixture, { oldState, newState, oldMetadata, newMetadata });
      expect(() => review.recoverHtmlGatePublication(fixture.runDir)).toThrow(/journal is forbidden/);
      expect(existsSync(forbidden.path)).toBe(true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('enforces gate-journal recovery age and exact cross-host token', async () => {
    const fixture = createHtmlFirstRun('html-review-journal-owner-');
    try {
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const metadataPath = join(fixture.deck, 'project-metadata.yaml');
      const state = readFileSync(statePath);
      const metadata = readFileSync(metadataPath);
      const newState = Buffer.from('new-state');
      const newMetadata = Buffer.from('new-metadata');

      const young = writeGateJournal(fixture, {
        oldState: state,
        newState,
        oldMetadata: metadata,
        newMetadata,
        createdAt: Date.now() - 30_000,
      });
      expect(() => review.recoverHtmlGatePublication(fixture.runDir)).toThrow(/requires owner age and exact confirmation/);
      rmSync(young.path);

      const token = 'b'.repeat(64);
      writeGateJournal(fixture, {
        oldState: state,
        newState,
        oldMetadata: metadata,
        newMetadata,
        ownerToken: token,
        ownerHost: 'other-host',
        createdAt: Date.now() - 301_000,
      });
      expect(() => review.recoverHtmlGatePublication(fixture.runDir, { confirmedOwnerToken: 'c'.repeat(64) })).toThrow(/requires owner age and exact confirmation/);
      expect(review.recoverHtmlGatePublication(fixture.runDir, { confirmedOwnerToken: token })).toMatchObject({ status: 'aborted' });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('fences ordinary state writers while an HTML reset is deletion-pending', async () => {
    const fixture = createHtmlFirstRun('html-review-reset-fence-');
    try {
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      const token = 'd'.repeat(64);
      state.nodes ||= {};
      state.nodes['html-production-reset'] = { by_version: { '3_versions/v1': {
        schema: 'pptmaker-html-production-reset-v1',
        pipeline: 'html-first-v1',
        run_version: 'v1',
        html_production_reset_id: 'e'.repeat(64),
        status: 'deletion_pending',
        started_at: new Date().toISOString(),
        completed_at: null,
        owner_token: token,
        owner_host: hostname(),
        owner_pid: process.pid,
        owner_claimed_at_epoch_ms: Date.now(),
      } } };
      stateApi.writeState(fixture.deck, state, { resetOwnerToken: token });
      const pending = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      pending.current_node = 'unexpected-writer';
      expect(() => stateApi.writeState(fixture.deck, pending)).toThrow(/reset fences state writes/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
