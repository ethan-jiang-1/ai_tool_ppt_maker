import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../helpers/html_first_fixture.mjs';
import { parseCliErrorLine } from '../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs';
import { completeMigrationHandoff, createDefaultState, inspectMigrationHandoff, readState, setNodeStatus, startPlaybook, writeState } from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { validateAndBuildHtmlFirstPlan } from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs';
import { prepareHtmlMigration, previewHtmlMigration, resolveMigrationCandidate } from '../../PPTMAKER_FRAMEWORK/scripts/05-iteration/migration/html_migration.mjs';
import { createMarkerlessMigrationFixture } from '../helpers/html_migration_fixture.mjs';

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
  const scratch = join(migrationScratch(runDir), 'projected-run');
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
  setNodeStatus(state, 'preview-html-migration', 'completed', {
    migration_plan_hash: plan.plan_hash,
    old_side_mode: plan.old_side_mode,
  });
  setNodeStatus(state, 'confirm-html-migration', 'in_progress');
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
  it('creates a synthetic markerless fixture with no provider interaction', () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      expect(readFileSync(join(fixture.runDir, 'slide-specifications.md'), 'utf8')).toContain('**IMAGE PROMPT**:');
      expect(fixture.providerCalls).toEqual([]);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('imports a loose candidate only through prepare while preview leaves it untouched', async () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      const loosePath = join(migrationScratch(fixture.runDir), 'slide-specifications.md');
      mkdirSync(dirname(loosePath), { recursive: true });
      writeFileSync(loosePath, htmlFirstSource([htmlFirstSlide({ id: 'HeroGo', title: 'Legacy authored candidate' })]), 'utf8');
      const looseBefore = readFileSync(loosePath);

      await expect(previewHtmlMigration(fixture.runDir)).resolves.toMatchObject({
        status: 'preparation_required',
        available_presets: ['clean-clinical', 'corporate-safe', 'dark-executive', 'tech-startup', 'warm-editorial'],
      });
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run'))).toBe(false);
      expect(readFileSync(loosePath)).toEqual(looseBefore);

      const prepared = prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' });
      const projected = join(migrationScratch(fixture.runDir), 'projected-run');
      expect(prepared).toMatchObject({ status: 'prepared-loose-candidate-imported', preset: 'dark-executive' });
      expect(readFileSync(join(projected, 'slide-specifications.md'))).toEqual(looseBefore);
      expect(readFileSync(loosePath)).toEqual(looseBefore);
      expect(JSON.parse(readFileSync(join(projected, 'preparation.json'), 'utf8')).candidate_source).toMatchObject({
        imported_from_legacy_loose_candidate: '_scratch/html-migration/slide-specifications.md',
      });
      expect(JSON.parse(readFileSync(join(projected, 'authoring-context.json'), 'utf8')).slides).toHaveLength(2);
      expect(existsSync(join(projected, 'overrides', 'visual-style', 'color_palette.json'))).toBe(true);

      const candidateBefore = readFileSync(join(projected, 'slide-specifications.md'));
      expect(prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' }).status).toBe('prepared-idempotent');
      expect(readFileSync(join(projected, 'slide-specifications.md'))).toEqual(candidateBefore);
      expect(() => prepareHtmlMigration(fixture.runDir, { preset: 'tech-startup' })).toThrow(/CONFLICT/);
      expect(readFileSync(join(projected, 'slide-specifications.md'))).toEqual(candidateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('prepares a markerless source into a prompt-free candidate scaffold', async () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      const prepared = prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' });
      const projected = join(migrationScratch(fixture.runDir), 'projected-run');
      const source = readFileSync(join(projected, 'slide-specifications.md'), 'utf8');
      expect(prepared).toMatchObject({ status: 'prepared', preset: 'dark-executive' });
      expect(source).not.toContain('identity:\n  scheme: mnemonic-v1');
      expect(source).not.toContain('IMAGE PROMPT');
      expect(existsSync(join(projected, '_generated'))).toBe(true);
      expect(resolveMigrationCandidate(fixture.runDir)).toMatchObject({ status: 'authoring_required' });
      const candidateBeforePreview = readFileSync(join(projected, 'slide-specifications.md'));
      await expect(previewHtmlMigration(fixture.runDir)).resolves.toMatchObject({
        status: 'authoring_required',
        missing: expect.arrayContaining(['HeroGo:family', 'ProofNow:family']),
      });
      expect(readFileSync(join(projected, 'slide-specifications.md'))).toEqual(candidateBeforePreview);
      expect(readdirSync(join(projected, '_generated'))).toEqual([]);
      expect(JSON.parse(readFileSync(join(projected, 'authoring-checklist.json'), 'utf8')).slides).toEqual([
        { slide_id: 'HeroGo', required_fields: ['CONCEPT.MUST communicate', 'CONCEPT.MUST NOT', 'SLIDE BODY'] },
        { slide_id: 'ProofNow', required_fields: ['CONCEPT.MUST communicate', 'CONCEPT.MUST NOT', 'SLIDE BODY'] },
      ]);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('adds the mnemonic marker only when every retained legacy ID qualifies', () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      const sourcePath = join(fixture.runDir, 'slide-specifications.md');
      writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8').replace('ProofNow', 'CaseWin'));
      prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' });
      expect(readFileSync(join(migrationScratch(fixture.runDir), 'projected-run', 'slide-specifications.md'), 'utf8')).toContain('identity:\n  scheme: mnemonic-v1');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects source and inherited-control drift before overwriting a prepared candidate', () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      const sourcePath = join(fixture.runDir, 'slide-specifications.md');
      const sourceBefore = readFileSync(sourcePath, 'utf8');
      prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' });
      const candidatePath = join(migrationScratch(fixture.runDir), 'projected-run', 'slide-specifications.md');
      const candidateBefore = readFileSync(candidatePath);

      writeFileSync(sourcePath, `${sourceBefore}\n`);
      expect(() => prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' })).toThrow(/CONFLICT/);
      expect(readFileSync(candidatePath)).toEqual(candidateBefore);

      writeFileSync(sourcePath, sourceBefore);
      const palettePath = join(fixture.deck, '2_backbone', 'visual-style', 'color_palette.json');
      const palette = JSON.parse(readFileSync(palettePath, 'utf8'));
      palette.background = '#101112';
      writeFileSync(palettePath, JSON.stringify(palette));
      expect(() => prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' })).toThrow(/CONFLICT/);
      expect(readFileSync(candidatePath)).toEqual(candidateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('stops an invalid prepared palette before renderer or provider work', async () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' });
      const projected = join(migrationScratch(fixture.runDir), 'projected-run');
      writeFileSync(join(projected, 'slide-specifications.md'), htmlFirstSource([htmlFirstSlide({ id: 'HeroGo', title: 'Complete candidate' })]));
      const palettePath = join(projected, 'overrides', 'visual-style', 'color_palette.json');
      const palette = JSON.parse(readFileSync(palettePath, 'utf8'));
      palette.html_first.typography.title.weight = 400;
      palette.html_first.components.card.radius = 1;
      writeFileSync(palettePath, JSON.stringify(palette));

      await expect(previewHtmlMigration(fixture.runDir)).rejects.toThrow(/migration palette validation failed/);
      expect(readdirSync(join(projected, '_generated'))).toEqual([]);
      expect(fixture.providerCalls).toEqual([]);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('exposes prepare as a closed, provider-free migration CLI operation', () => {
    const fixture = createMarkerlessMigrationFixture();
    try {
      const missingPreset = runFlow(['migrate-html', fixture.runDir, 'prepare']);
      expect(missingPreset.status).toBe(1);
      expect(lastEnvelope(missingPreset)?.code).toBe('USAGE');

      const unknownPreset = runFlow(['migrate-html', fixture.runDir, 'prepare', '--preset', 'unknown-preset']);
      expect(unknownPreset.status).toBe(1);
      expect(lastEnvelope(unknownPreset)?.code).toBe('USAGE');
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run'))).toBe(false);

      const barePreview = runFlow(['migrate-html', fixture.runDir, 'preview']);
      expect(barePreview.status, barePreview.stderr || barePreview.stdout).toBe(0);
      expect(barePreview.stdout).toMatch(/Migration preparation_required/);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run'))).toBe(false);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'plan.json'))).toBe(false);

      const prepared = runFlow(['migrate-html', fixture.runDir, 'prepare', '--preset', 'dark-executive']);
      expect(prepared.status, prepared.stderr || prepared.stdout).toBe(0);
      expect(prepared.stdout).toMatch(/Migration prepared/);
      expect(prepared.stdout).toMatch(/preset: dark-executive/);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run', 'slide-specifications.md'))).toBe(true);
      expect(fixture.providerCalls).toEqual([]);

      const conflict = runFlow(['migrate-html', fixture.runDir, 'prepare', '--preset', 'tech-startup']);
      expect(conflict.status).toBe(1);
      expect(lastEnvelope(conflict)).toMatchObject({ code: 'FAILED', where: 'ppt_flow.migrate-html.prepare' });

      const mixedPreview = runFlow(['migrate-html', fixture.runDir, 'preview', '--preset', 'dark-executive']);
      expect(mixedPreview.status).toBe(1);
      expect(lastEnvelope(mixedPreview)?.code).toBe('USAGE');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects foreign projected-candidate children before renderer setup', () => {
    const fixture = createHtmlFirstRun('html-migration-candidate-');
    try {
      writeCandidate(fixture.runDir);
      const projected = join(migrationScratch(fixture.runDir), 'projected-run');
      writeFileSync(join(projected, '.foreign-cache'), 'not allowed\n');
      expect(() => resolveMigrationCandidate(fixture.runDir)).toThrow(/unexpected '.foreign-cache'/);
      rmSync(join(projected, '.foreign-cache'));
      writeFileSync(join(projected, 'foreign.txt'), 'not allowed\n');
      expect(() => resolveMigrationCandidate(fixture.runDir)).toThrow(/unexpected 'foreign.txt'/);
      const hardStop = runFlow(['migrate-html', fixture.runDir, 'preview']);
      expect(hardStop.status).toBe(1);
      expect(lastEnvelope(hardStop)).toMatchObject({ code: 'FAILED', where: 'ppt_flow.migrate-html.preview' });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('publishes one clean target and recovers an exact post-publish journal', () => {
    const fixture = createMarkerlessMigrationFixture('html-migration-');
    try {
      const sourceBefore = readFileSync(join(fixture.runDir, 'slide-specifications.md'), 'utf8');
      expect(prepareHtmlMigration(fixture.runDir, { preset: 'dark-executive' })).toMatchObject({ status: 'prepared' });
      writeCandidate(fixture.runDir);
      const candidatePalette = join(migrationScratch(fixture.runDir), 'projected-run', 'overrides', 'visual-style', 'color_palette.json');
      mkdirSync(dirname(candidatePalette), { recursive: true });
      const palette = JSON.parse(readFileSync(join(fixture.deck, '2_backbone', 'visual-style', 'color_palette.json'), 'utf8'));
      palette.background = '#102030';
      writeFileSync(candidatePalette, `${JSON.stringify(palette, null, 2)}\n`);
      expect(validateAndBuildHtmlFirstPlan({
        runDir: fixture.runDir,
        sourcePathOverride: join(migrationScratch(fixture.runDir), 'projected-run', 'slide-specifications.md'),
        migrationCandidateRoot: join(migrationScratch(fixture.runDir), 'projected-run'),
      }).plan.theme.palette.background).toBe('#102030');
      const candidateSourcePath = join(migrationScratch(fixture.runDir), 'projected-run', 'slide-specifications.md');
      const candidateSourceBeforePreview = readFileSync(candidateSourcePath);
      const candidatePaletteBeforePreview = readFileSync(candidatePalette);
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
      expect(plan.source_diff.added_slide_ids).toContain('HeroGo');
      expect(readdirSync(join(fixture.deck, '3_versions')).filter((name) => /^v\d+$/.test(name))).toEqual(beforeVersions);
      expect(existsSync(join(migrationScratch(fixture.runDir), 'projected-run', '_generated', 'html_production', 'preview', 'manifest.json'))).toBe(true);
      expect(readFileSync(candidateSourcePath)).toEqual(candidateSourceBeforePreview);
      expect(readFileSync(candidatePalette)).toEqual(candidatePaletteBeforePreview);
      writeFileSync(join(migrationScratch(fixture.runDir), 'projected-run', '_generated', 'preview-only-sentinel.txt'), 'scratch only');

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
      const stateBeforeRejectedConfirmation = readFileSync(join(fixture.deck, '_state', 'state.yaml'));
      const rejectedConfirmation = runFlow([
        'state',
        fixture.runDir,
        '--confirm-migration-apply',
        '--plan-hash',
        '0'.repeat(64),
        '--old-side-mode',
        plan.old_side_mode,
      ]);
      expect(rejectedConfirmation.status).toBe(1);
      expect(lastEnvelope(rejectedConfirmation)?.code).toBe('FAILED');
      expect(readFileSync(join(fixture.deck, '_state', 'state.yaml'))).toEqual(stateBeforeRejectedConfirmation);
      const confirmed = runFlow([
        'state',
        fixture.runDir,
        '--confirm-migration-apply',
        '--plan-hash',
        plan.plan_hash,
        '--old-side-mode',
        plan.old_side_mode,
      ]);
      expect(confirmed.status, confirmed.stderr || confirmed.stdout).toBe(0);
      expect(JSON.parse(confirmed.stdout)).toMatchObject({
        operation: 'confirm-migration-apply',
        status: 'confirmed',
        current_node: 'apply-html-migration',
        plan_hash: plan.plan_hash,
      });
      const stateAfterConfirmation = readFileSync(join(fixture.deck, '_state', 'state.yaml'));
      const repeatedConfirmation = runFlow([
        'state',
        fixture.runDir,
        '--confirm-migration-apply',
        '--plan-hash',
        plan.plan_hash,
        '--old-side-mode',
        plan.old_side_mode,
      ]);
      expect(repeatedConfirmation.status, repeatedConfirmation.stderr || repeatedConfirmation.stdout).toBe(0);
      expect(JSON.parse(repeatedConfirmation.stdout)).toMatchObject({ status: 'idempotent', current_node: 'apply-html-migration' });
      expect(readFileSync(join(fixture.deck, '_state', 'state.yaml'))).toEqual(stateAfterConfirmation);
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
      expect(readFileSync(join(targetRunDir, 'overrides', 'visual-style', 'color_palette.json'))).toEqual(readFileSync(candidatePalette));
      expect(existsSync(join(targetRunDir, 'preparation.json'))).toBe(false);
      expect(existsSync(join(targetRunDir, 'authoring-context.json'))).toBe(false);
      expect(existsSync(join(targetRunDir, 'authoring-checklist.json'))).toBe(false);
      expect(existsSync(join(targetRunDir, '_generated', 'preview-only-sentinel.txt'))).toBe(false);
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
