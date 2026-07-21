import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { htmlFirstSlide, htmlFirstSource } from '../../tests/helpers/html_first_fixture.mjs';
import { inspectHtmlReviewReadiness } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs';
import { readState, writeState } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { assemblyReceiptPath } from '../../PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs';

const FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';

function flow(args, timeout = 120_000) {
  return spawnSync('node', [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
    env: {
      ...process.env,
      IMAGE2_API_KEY: '',
      IMAGE2_BASE_URL: '',
      OPENAI_API_KEY: '',
      GEMINI_API_KEY: '',
    },
  });
}

function failureEnvelope(result) {
  const line = String(result.stderr || '').split(/\r?\n/).filter(Boolean).at(-1);
  return JSON.parse(line);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function writeActiveGateJournal(deck) {
  const state = readFileSync(join(deck, '_state', 'state.yaml'));
  const metadata = readFileSync(join(deck, 'project-metadata.yaml'));
  const journal = {
    schema: 'pptmaker-html-gate-approval-journal-v1',
    owner_token: 'a'.repeat(64),
    owner_host: hostname(),
    owner_pid: process.pid,
    created_at_epoch_ms: Date.now(),
    run_version: 'v1',
    old_state_sha256: sha256(state),
    new_state_sha256: sha256(state),
    old_metadata_sha256: sha256(metadata),
    new_metadata_sha256: sha256(metadata),
  };
  const path = join(deck, '_state', 'gate-approval-journal.json');
  writeFileSync(path, `${JSON.stringify(journal)}\n`, 'utf8');
  return path;
}

describe('fresh HTML-first delivery E2E', () => {
  it('initializes, reviews, builds, records delivery, and finishes without Image2 state', () => {
    const root = mkdtempSync(join(tmpdir(), 'html-first-e2e-'));
    const deck = join(root, 'deck_html_e2e');
    const runDir = join(deck, '3_versions', 'v1');
    try {
      const init = flow(['init', deck, '--deck-type', 'keynote', '--style', 'dark-executive', '--mode', 'html-only'], 30_000);
      expect(init.status, init.stderr || init.stdout).toBe(0);
      expect(readFileSync(join(runDir, 'slide-specifications.md'), 'utf8')).toContain('pipeline: html-first-v1');
      writeFileSync(join(runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ id: 'StartGo', title: 'A complete local deck', note: 'Stable presenter note.' }),
      ]), 'utf8');

      const validate = flow(['validate', runDir]);
      expect(validate.status, validate.stderr || validate.stdout).toBe(0);
      const pilot = flow(['pilot', runDir]);
      expect(pilot.status, pilot.stderr || pilot.stdout).toBe(0);
      const pending = inspectHtmlReviewReadiness(runDir);
      for (const gate of ['content', 'visual']) {
        const approved = flow(['approve', runDir, gate, '--plan-hash', pending.gates[gate].plan.plan_hash]);
        expect(approved.status, approved.stderr || approved.stdout).toBe(0);
      }
      const build = flow(['build', runDir]);
      expect(build.status, build.stderr || build.stdout).toBe(0);

      const state = readState(deck);
      state.playbook = 'create-deck';
      state.current_node = 'checkpoint-final-review';
      state.nodes['checkpoint-final-review'] = { status: 'in_progress', execution_id: state.execution_id, evidence: {} };
      writeState(deck, state);
      const decision = flow(['state', runDir, '--record-delivery-review', 'proceed'], 30_000);
      expect(decision.status, decision.stderr || decision.stdout).toBe(0);
      const status = flow(['status', runDir, '--json'], 30_000);
      expect(status.status, status.stderr || status.stdout).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: 'html-first-v1',
        suggested_next: 'complete:html-delivery',
        html_reviews: { delivery: { freshness: 'current', decision: 'proceed' } },
      });
      expect(readdirSync(join(runDir, '_generated', 'ppt')).some((name) => name.endsWith('.pptx'))).toBe(true);
      expect(existsSync(join(runDir, '_generated', 'qa', 'notes_injection.json'))).toBe(true);
      expect(existsSync(join(deck, '2_backbone', 'visual-style', 'style_master.jpg'))).toBe(false);
      expect(existsSync(join(runDir, '_scratch', 'image2_refinement'))).toBe(false);
      expect(existsSync(join(runDir, '_generated', 'image2_refinement'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 180_000);

  it('guides, fences, waives, and transparently reports the recoverable HTML delivery path', () => {
    const root = mkdtempSync(join(tmpdir(), 'html-guided-recovery-e2e-'));
    const deck = join(root, 'deck_html_guided_recovery');
    const runDir = join(deck, '3_versions', 'v1');
    try {
      expect(flow(['init', deck, '--deck-type', 'keynote', '--style', 'dark-executive'], 30_000).status).toBe(0);
      writeFileSync(join(runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ id: 'GuideGo', title: 'Guided recovery', note: 'A stable note for the final review.' }),
      ]), 'utf8');
      expect(flow(['validate', runDir]).status).toBe(0);
      expect(flow(['pilot', runDir]).status).toBe(0);

      const recommendedRepair = flow(['state', runDir, '--check-gates']);
      expect(recommendedRepair.status).toBe(1);
      expect(failureEnvelope(recommendedRepair)).toMatchObject({
        code: 'GATE_BLOCKED',
        diagnostic: { category: 'gate', next: { action: 'review', requires_human: true } },
      });

      const statePath = join(deck, '_state', 'state.yaml');
      const beforeWrongHash = readFileSync(statePath);
      const wrongHash = flow(['approve', runDir, 'content', '--plan-hash', 'f'.repeat(64)]);
      expect(wrongHash.status).toBe(1);
      expect(failureEnvelope(wrongHash).code).toMatch(/FAILED|GATE_BLOCKED|CONFLICT/);
      expect(readFileSync(statePath)).toEqual(beforeWrongHash);

      const activeJournal = writeActiveGateJournal(deck);
      const beforeJournalConflict = readFileSync(statePath);
      const journalConflict = flow(['build', runDir, '--force', '--reason', 'Do not bypass an active publication owner.']);
      expect(journalConflict.status).toBe(1);
      expect(failureEnvelope(journalConflict)).toMatchObject({ code: 'FAILED' });
      expect(readFileSync(statePath)).toEqual(beforeJournalConflict);
      rmSync(activeJournal);

      const missingDelivery = flow([
        'state', runDir, '--record-delivery-review', 'proceed', '--force',
        '--reason', 'Reviewable delivery artifacts must exist before this continuation.',
      ]);
      expect(missingDelivery.status).toBe(1);
      expect(failureEnvelope(missingDelivery)).toMatchObject({ code: 'FAILED' });
      expect(readState(deck).nodes['html-delivery-review']?.by_version?.['3_versions/v1'] ?? null).toBeNull();

      const forcedBuild = flow([
        'build', runDir, '--force',
        '--reason', 'Proceed with local assembly while the complete gate review is explicitly waived.',
      ], 120_000);
      expect(forcedBuild.status, forcedBuild.stderr || forcedBuild.stdout).toBe(0);
      const waivedState = readState(deck);
      expect(waivedState.nodes['html-content-review'].by_version['3_versions/v1']).toMatchObject({ status: 'waived' });
      expect(waivedState.nodes['html-visual-review'].by_version['3_versions/v1']).toMatchObject({ status: 'waived' });

      waivedState.playbook = 'create-deck';
      waivedState.current_node = 'checkpoint-final-review';
      waivedState.nodes['checkpoint-final-review'] = {
        status: 'in_progress',
        execution_id: waivedState.execution_id,
        evidence: {},
      };
      writeState(deck, waivedState);
      const receiptPath = assemblyReceiptPath(runDir);
      const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
      receipt.html_delivery_digest = 'e'.repeat(64);
      writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');

      const forcedDelivery = flow([
        'state', runDir, '--record-delivery-review', 'proceed', '--force',
        '--reason', 'The current PPTX and contact sheet are reviewable while lineage evidence is repaired.',
      ], 30_000);
      expect(forcedDelivery.status, forcedDelivery.stderr || forcedDelivery.stdout).toBe(0);
      expect(JSON.parse(forcedDelivery.stdout)).toMatchObject({
        decision: 'proceed', freshness: 'current', evidence_complete: false,
      });

      const status = flow(['status', runDir, '--json'], 30_000);
      expect(status.status, status.stderr || status.stdout).toBe(0);
      const statusReport = JSON.parse(status.stdout);
      expect(statusReport).toMatchObject({
        pipeline: 'html-first-v1',
        workflow_summary: 'HTML delivery is accepted with incomplete lineage evidence; repair remains recommended',
        html_resume_guidance: {
          outcome: 'guide',
          subject: 'delivery-review',
          evidence_complete: false,
        },
        html_reviews: {
          content: { decision: 'waived', freshness: 'current' },
          visual: { decision: 'waived', freshness: 'current' },
          delivery: { decision: 'proceed', freshness: 'current', evidence_complete: false },
        },
      });
      expect(statusReport.suggested_next).toBe(statusReport.html_resume_guidance.recommended_command);
      expect(statusReport.suggested_next).toContain('ppt_flow.mjs build');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 180_000);
});
