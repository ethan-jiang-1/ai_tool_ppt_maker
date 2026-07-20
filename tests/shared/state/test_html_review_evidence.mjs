import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { hostname } from 'node:os';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../../helpers/html_first_fixture.mjs';
import { acquireHtmlPublishLock, htmlOwnerRoot, releaseHtmlPublishLock } from '../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_object_store.mjs';
import { assemblyReceiptPath } from '../../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs';
import { createHash } from 'node:crypto';
import { createCurrentHtmlDelivery } from '../../helpers/image2_refinement_fixture.mjs';

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
  it('approves exact pilot hashes immediately and stales them after source drift (BUG-016)', async () => {
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

  it('writes v2 gate waivers and rejects ambiguous v1 records without mutation', async () => {
    const fixture = createHtmlFirstRun('html-review-v1-v2-gate-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);

      const waived = review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'content',
        status: 'waived',
        waiverReason: 'Proceed with the current source while review artifacts are rebuilt.',
      });
      expect(waived).toMatchObject({ status: 'waived', evidence_complete: false });
      expect(waived.waived_checks).toHaveLength(1);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).content).toMatchObject({
        decision: 'waived',
        freshness: 'current',
        evidence_complete: false,
      });

      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      const v2 = state.nodes['html-content-review'].by_version['3_versions/v1'];
      const { evidence_complete, waived_checks, ...v1 } = v2;
      v1.schema = 'pptmaker-html-gate-review-v1';
      v1.status = 'approved';
      v1.waiver_reason = null;
      v1.review_plan_hash = null;
      state.nodes['html-content-review'].by_version['3_versions/v1'] = v1;
      stateApi.writeState(fixture.deck, state);

      const before = readFileSync(join(fixture.deck, '_state', 'state.yaml'));
      const observed = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(observed.content).toMatchObject({ freshness: 'invalid', evidence_complete: null });
      expect(readFileSync(join(fixture.deck, '_state', 'state.yaml'))).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('projects a valid current v1 gate record as complete without rewriting it', async () => {
    const fixture = createHtmlFirstRun('html-review-v1-reader-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: pending.gates.content.plan.plan_hash, status: 'approved' });

      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      const v2 = state.nodes['html-content-review'].by_version['3_versions/v1'];
      const { evidence_complete, waived_checks, ...v1 } = v2;
      v1.schema = 'pptmaker-html-gate-review-v1';
      state.nodes['html-content-review'].by_version['3_versions/v1'] = v1;
      stateApi.writeState(fixture.deck, state);

      const path = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(path);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).content).toMatchObject({
        decision: 'approved',
        freshness: 'current',
        evidence_complete: true,
        waived_checks: [],
      });
      expect(readFileSync(path)).toEqual(before);
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ title: 'Changed after the v1 review' }),
      ]), 'utf8');
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).content).toMatchObject({
        decision: 'approved',
        freshness: 'stale',
        evidence_complete: null,
        waived_checks: [],
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it('writes v2 gate records while retaining valid v1 read compatibility', async () => {
    const fixture = createHtmlFirstRun('html-review-v2-reader-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'content',
        planHash: pending.gates.content.plan.plan_hash,
        status: 'approved',
      });

      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      const versionKey = '3_versions/v1';
      const v2 = state.nodes['html-content-review'].by_version[versionKey];
      expect(v2).toMatchObject({
        schema: 'pptmaker-html-gate-review-v2',
        status: 'approved',
        evidence_complete: true,
        waived_checks: [],
      });

      const legacy = { ...v2, schema: 'pptmaker-html-gate-review-v1' };
      delete legacy.evidence_complete;
      delete legacy.waived_checks;
      state.nodes['html-content-review'].by_version[versionKey] = legacy;
      stateApi.writeState(fixture.deck, state);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(statePath);
      const inspected = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(inspected.content).toMatchObject({
        decision: 'approved',
        freshness: 'current',
        evidence_complete: true,
        waived_checks: [],
      });
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 60_000);

  it('fails closed on a malformed current v2 gate record without replacing it', async () => {
    const fixture = createHtmlFirstRun('html-review-malformed-v2-gate-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'content',
        planHash: pending.gates.content.plan.plan_hash,
        status: 'approved',
      });

      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      state.nodes['html-content-review'].by_version['3_versions/v1'].waived_checks = null;
      stateApi.writeState(fixture.deck, state);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(statePath);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).content).toMatchObject({
        freshness: 'invalid',
        evidence_complete: null,
      });
      expect(readFileSync(statePath)).toEqual(before);
      expect(() => review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'content',
        status: 'waived',
        waiverReason: 'The malformed record must be repaired before a new decision is published.',
      })).toThrow(/current HTML content review record is invalid or ambiguous/);
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 60_000);

  it('fails closed on a malformed current v2 delivery record without replacing it', async () => {
    const fixture = await createCurrentHtmlDelivery('html-review-malformed-v2-delivery-');
    try {
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      const state = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      state.nodes['html-delivery-review'].by_version['3_versions/v1'].waived_checks = null;
      stateApi.writeState(fixture.deck, state);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(statePath);
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).delivery).toMatchObject({
        freshness: 'invalid',
        evidence_complete: null,
      });
      expect(readFileSync(statePath)).toEqual(before);
      expect(() => review.publishHtmlDeliveryDecision(fixture.runDir, { decision: 'proceed' }))
        .toThrow(/current HTML delivery review record is invalid or ambiguous/);
      expect(readFileSync(statePath)).toEqual(before);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it('publishes an incomplete gate waiver through the existing authority without changing legacy mirrors', async () => {
    const fixture = createHtmlFirstRun('html-review-waiver-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      await stage1(fixture.runDir, false);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const metadataPath = join(fixture.deck, 'project-metadata.yaml');
      const beforeState = readFileSync(statePath);
      const beforeMetadata = readFileSync(metadataPath, 'utf8');
      const beforeLegacy = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false }).gates;

      expect(() => review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'visual',
        planHash: 'a'.repeat(64),
        status: 'waived',
        waiverReason: 'The visual preview will be repaired after this local milestone.',
      })).toThrow(/supplied waiver plan hash/);
      expect(readFileSync(statePath)).toEqual(beforeState);

      const result = review.publishHtmlGateDecision(fixture.runDir, {
        gate: 'visual',
        status: 'waived',
        waiverReason: 'The visual preview will be repaired after this local milestone.',
      });
      expect(result).toMatchObject({ gate: 'visual', status: 'waived', evidence_complete: false });
      expect(result.waived_checks.length).toBeGreaterThan(0);
      const stored = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false })
        .nodes['html-visual-review'].by_version['3_versions/v1'];
      expect(stored).toMatchObject({
        schema: 'pptmaker-html-gate-review-v2',
        status: 'waived',
        evidence_complete: false,
        review_plan_hash: null,
      });
      expect(stored.waived_checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: expect.any(String), subject: expect.anything() }),
      ]));
      expect(JSON.stringify(stored.waived_checks)).not.toContain('The visual preview');
      expect(JSON.stringify(stored.waived_checks)).not.toContain(fixture.root);
      const afterState = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false });
      expect(afterState.gates.content).toBe(beforeLegacy.content);
      expect(afterState.gates.visual).toBe(beforeLegacy.visual);
      const legacyLines = (text) => text.match(/^(?:content_gate|visual_gate):.*$/gm);
      expect(legacyLines(readFileSync(metadataPath, 'utf8'))).toEqual(legacyLines(beforeMetadata));
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).visual).toMatchObject({
        decision: 'waived',
        freshness: 'current',
        evidence_complete: false,
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 60_000);

  it('records a forced v2 delivery evidence waiver only for reviewable current artifacts', async () => {
    const fixture = await createCurrentHtmlDelivery('html-delivery-force-');
    try {
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      const stateApi = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
      const receiptPath = assemblyReceiptPath(fixture.runDir);
      const assemblyReceipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
      assemblyReceipt.html_delivery_digest = 'f'.repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(assemblyReceipt, null, 2)}\n`);
      const statePath = join(fixture.deck, '_state', 'state.yaml');
      const before = readFileSync(statePath);
      expect(() => review.publishHtmlDeliveryDecision(fixture.runDir, { decision: 'proceed' })).toThrow(/delivery evidence is missing or stale/);
      expect(readFileSync(statePath)).toEqual(before);

      const result = review.publishHtmlDeliveryDecision(fixture.runDir, {
        decision: 'proceed',
        force: true,
        reason: 'The generated PPTX and contact sheet are reviewable while assembly lineage is rebuilt.',
      });
      expect(result).toMatchObject({ decision: 'proceed', freshness: 'current', evidence_complete: false });
      expect(result.waived_checks.length).toBeGreaterThan(0);
      const record = stateApi.readState(fixture.deck, { purpose: 'observe', heal: false })
        .nodes['html-delivery-review'].by_version['3_versions/v1'];
      expect(record).toMatchObject({
        schema: 'pptmaker-html-delivery-review-v2',
        decision: 'proceed',
        evidence_complete: false,
        assembly_receipt_path: null,
        assembly_receipt_sha256: null,
      });
      expect(record.pptx_path).toMatch(/^_generated\//);
      expect(record.contact_sheet_path).toMatch(/^_generated\//);
      expect(record.waived_checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: expect.any(String), subject: expect.anything() }),
      ]));
      const snapshot = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(snapshot.delivery).toMatchObject({
        decision: 'proceed',
        freshness: 'current',
        evidence_complete: false,
      });
      expect(snapshot.delivery.waived_checks.length).toBeGreaterThan(0);
      expect(stateApi.validateStateReadOnly(fixture.deck, { runDir: fixture.runDir }))
        .toMatchObject({ valid: true, issues: [] });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }, 120_000);

  it('reconstructs and SHA-verifies shown composition evidence before treating visual approval as current (BUG-019)', async () => {
    const fixture = createHtmlFirstRun('html-review-composition-reload-');
    try {
      const { stage1 } = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs');
      const renderer = await import('../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs');
      const review = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs');
      await stage1(fixture.runDir, false);
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});

      const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'content', planHash: pending.gates.content.plan.plan_hash, status: 'approved' });
      review.publishHtmlGateDecision(fixture.runDir, { gate: 'visual', planHash: pending.gates.visual.plan.plan_hash, status: 'approved' });
      expect(review.inspectHtmlReviewReadiness(fixture.runDir).visual.freshness).toBe('current');

      const plan = pending.gates.visual.plan;
      const shown = plan.shown_artifacts.find((entry) => entry.composition_variant === 'effective' && entry.path);
      const path = join(fixture.runDir, shown.path);
      const original = readFileSync(path);
      writeFileSync(path, Buffer.concat([original, Buffer.from('corrupt')])) ;

      const stale = review.inspectHtmlReviewReadiness(fixture.runDir);
      expect(stale.ready).toBe(false);
      expect(stale.visual.freshness).toBe('stale');
      expect(stale.gates.visual.mismatches).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: 'shown_artifacts.path.sha256',
          kind: 'artifact',
          slide_id: 'HeroGo',
          next_action: 'rerun_local_review',
        }),
      ]));
      for (const issue of stale.gates.visual.mismatches) {
        expect(JSON.stringify(issue)).not.toContain('Hello');
        expect(JSON.stringify(issue)).not.toContain('SPEAKER NOTE');
      }
      expect(stale.gates.visual.mismatches).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: 'shown_artifacts.path.sha256',
          kind: 'artifact',
          slide_id: shown.slide_id,
          next_action: 'rerun_local_review',
        }),
      ]));
      expect(JSON.stringify(stale.gates.visual.mismatches)).not.toContain('corrupt');
      expect(JSON.stringify(stale.gates.visual.mismatches)).not.toContain(fixture.root);
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
