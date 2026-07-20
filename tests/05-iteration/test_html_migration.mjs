import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../helpers/html_first_fixture.mjs';
import { parseCliErrorLine } from '../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs';
import { completeMigrationHandoff, createDefaultState, inspectMigrationHandoff, readState, setNodeStatus, startPlaybook, writeState } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';

const FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';
const HEX64 = /^[0-9a-f]{64}$/;

function runFlow(args, { timeout = 120_000 } = {}) {
  return spawnSync('node', [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
    env: { ...process.env, OPENAI_API_KEY: '', GEMINI_API_KEY: '' },
  });
}

function lastEnvelope(result) {
  const line = String(result.stderr || '').trim().split(/\r?\n/).filter(Boolean).at(-1);
  return parseCliErrorLine(line);
}

function migrationScratch(runDir) {
  return join(runDir, '_scratch', 'html-migration');
}

function writeCandidate(runDir) {
  const scratch = migrationScratch(runDir);
  mkdirSync(scratch, { recursive: true });
  writeFileSync(
    join(scratch, 'slide-specifications.md'),
    htmlFirstSource([
      htmlFirstSlide({ title: 'Migrated HTML candidate', note: 'Carry the stable note' }),
    ]),
    'utf8'
  );
  return scratch;
}

function seedActiveMigrationExecution(deckDir, plan) {
  const state = createDefaultState();
  startPlaybook(state, 'migrate-import');
  setNodeStatus(state, 'handoff', 'in_progress', {
    migration_plan_hash: plan.plan_hash,
    old_side_mode: plan.old_side_mode,
  });
  writeState(deckDir, state);
  return state;
}

function writeRecoveryJournal(runDir, state, plan, token) {
  const parent = dirname(runDir);
  const journal = {
    schema: 'pptmaker-html-migration-apply-journal-v1',
    owner_token: token,
    host: `${process.env.HOSTNAME || process.env.COMPUTERNAME || 'localhost'}-foreign`,
    pid: 99999999,
    created_at_epoch_ms: Date.now() - 301_000,
    source_execution_id: state.execution_id,
    source_version: 'v1',
    target_version: plan.target_version,
    plan_hash: plan.plan_hash,
    old_side_mode: plan.old_side_mode,
    reservation_basename: `.${plan.target_version}.migration-reservation-${token}`,
    staging_basename: `.${plan.target_version}.migration-staging-${token}`,
  };
  mkdirSync(join(parent, journal.reservation_basename), { recursive: true });
  mkdirSync(join(parent, journal.staging_basename), { recursive: true });
  writeFileSync(join(migrationScratch(runDir), 'apply-journal.json'), `${JSON.stringify(journal, null, 2)}\n`, 'utf8');
  return {
    journal,
    reservation: join(parent, journal.reservation_basename),
    staging: join(parent, journal.staging_basename),
  };
}

describe('HTML migration preview/apply/recovery', () => {
  it('publishes one clean target and recovers an exact post-publish journal', () => {
    const fixture = createHtmlFirstRun('html-migration-');
    try {
      const sourceBefore = readFileSync(join(fixture.runDir, 'slide-specifications.md'), 'utf8');
      writeCandidate(fixture.runDir);
      const beforeVersions = readdirSync(join(fixture.deck, '3_versions')).filter((name) => /^v\d+$/.test(name));

      const preview = runFlow(['migrate-html', fixture.runDir, 'preview']);
      expect(preview.status, preview.stderr || preview.stdout).toBe(0);
      expect(preview.stdout).toMatch(/plan_hash:/);
      const plan = JSON.parse(readFileSync(join(migrationScratch(fixture.runDir), 'plan.json'), 'utf8'));
      expect(plan).toMatchObject({
        schema: 'pptmaker-html-migration-preview-v1',
        publication_scope: 'migration-preview',
        html_production_reset_id: null,
        source_version: 'v1',
        target_version: 'v2',
        old_side_mode: 'degraded-missing',
      });
      expect(plan.plan_hash).toMatch(HEX64);
      expect(plan.contact_sheet_sha).toMatch(HEX64);
      expect(plan.source_diff.changed_slide_ids).toContain('HeroGo');
      expect(readdirSync(join(fixture.deck, '3_versions')).filter((name) => /^v\d+$/.test(name))).toEqual(beforeVersions);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run', '_generated', 'html_production', 'preview', 'manifest.json'))).toBe(true);

      const noExecution = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--plan-hash',
        plan.plan_hash,
        '--old-side-mode',
        plan.old_side_mode,
      ], { timeout: 30_000 });
      expect(noExecution.status).toBe(1);
      expect(lastEnvelope(noExecution)?.code).toBe('FAILED');
      expect(existsSync(join(fixture.deck, '3_versions', 'v2'))).toBe(false);

      const state = seedActiveMigrationExecution(fixture.deck, plan);
      const apply = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--plan-hash',
        plan.plan_hash,
        '--old-side-mode',
        plan.old_side_mode,
      ]);
      expect(apply.status, apply.stderr || apply.stdout).toBe(0);
      expect(apply.stdout).toMatch(/Migration published/);
      const targetRunDir = join(fixture.deck, '3_versions', 'v2');
      const receiptPath = join(targetRunDir, '_generated', 'qa', 'html_migration.json');
      expect(existsSync(receiptPath)).toBe(true);
      expect(readFileSync(join(fixture.runDir, 'slide-specifications.md'), 'utf8')).toBe(sourceBefore);
      expect(readFileSync(join(targetRunDir, 'slide-specifications.md'), 'utf8')).toContain('Migrated HTML candidate');
      const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
      expect(receipt).toMatchObject({
        schema: 'pptmaker-html-migration-success-v1',
        pipeline: 'html-first-v1',
        publication_scope: 'canonical-run',
        source_execution_id: state.execution_id,
        source_version: 'v1',
        target_version: 'v2',
        plan_hash: plan.plan_hash,
        old_side_mode: plan.old_side_mode,
      });
      expect(receipt.contact_sheet_sha).toBe(plan.contact_sheet_sha);
      expect(existsSync(join(fixture.runDir, '_scratch', 'html-migration', 'apply-journal.json'))).toBe(false);

      const secondApply = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--plan-hash',
        plan.plan_hash,
        '--old-side-mode',
        plan.old_side_mode,
      ], { timeout: 30_000 });
      expect(secondApply.status, secondApply.stderr || secondApply.stdout).toBe(0);
      expect(secondApply.stdout).toMatch(/Migration idempotent/);

      const token = 'c'.repeat(64);
      const recoveryPaths = writeRecoveryJournal(fixture.runDir, state, plan, token);
      const mixed = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--recover-journal',
        token,
        '--plan-hash',
        plan.plan_hash,
      ], { timeout: 30_000 });
      expect(mixed.status).toBe(1);
      expect(lastEnvelope(mixed)?.code).toBe('USAGE');
      expect(existsSync(join(migrationScratch(fixture.runDir), 'apply-journal.json'))).toBe(true);

      const wrongToken = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--recover-journal',
        'd'.repeat(64),
      ], { timeout: 30_000 });
      expect(wrongToken.status).toBe(1);
      expect(lastEnvelope(wrongToken)?.code).toBe('FAILED');
      expect(existsSync(join(migrationScratch(fixture.runDir), 'apply-journal.json'))).toBe(true);

      const recovered = runFlow([
        'migrate-html',
        fixture.runDir,
        'apply',
        '--recover-journal',
        token,
      ], { timeout: 30_000 });
      expect(recovered.status, recovered.stderr || recovered.stdout).toBe(0);
      expect(recovered.stdout).toMatch(/Migration idempotent/);
      expect(recovered.stdout).toMatch(/recovery_mode: confirmed-owner/);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'apply-journal.json'))).toBe(false);
      expect(existsSync(recoveryPaths.reservation)).toBe(false);
      expect(existsSync(recoveryPaths.staging)).toBe(false);

      const stateBeforeHandoff = readFileSync(join(fixture.deck, '_state', 'state.yaml'));
      expect(inspectMigrationHandoff(fixture.deck, readState(fixture.deck, { heal: false }))).toMatchObject({
        code: 'migration_handoff_pending',
        source_version: 'v1',
        target_version: 'v2',
      });
      expect(readFileSync(join(fixture.deck, '_state', 'state.yaml'))).toEqual(stateBeforeHandoff);
      expect(completeMigrationHandoff(fixture.deck, { targetVersion: 'v2' })).toMatchObject({ status: 'handoff-complete', current_node: 'migration-target-review' });
      const targetState = readState(fixture.deck, { heal: false });
      expect(targetState).toMatchObject({ pipeline: 'html-first-v1', playbook: 'migrate-import', current_node: 'migration-target-review', run_version: 'v2' });
      expect(targetState.gates).toMatchObject({ html_content: 'pending', html_visual: 'pending', html_content_run_version: 'v2', html_visual_run_version: 'v2' });
      expect(targetState.nodes['html-delivery-review']?.by_version?.['3_versions/v2']).toBeUndefined();
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 180_000);
});
