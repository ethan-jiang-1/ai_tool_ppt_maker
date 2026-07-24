import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, readFileSync, realpathSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import {
  initBundle,
  initWholePageBundle,
  initHtmlFirstBundle,
  renderTree,
  selfCheck,
  checkBundle,
  createVersion,
  nextVersionName,
  publishStructuralVersion,
  AGENT_POINTER_FILE,
  LESSONS_DIR,
  RUN_BUNDLE_FILE,
  checkDeckRootControls,
  SCRATCH_SUBDIR,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';
import { parseRunBundleManifest } from '../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/run_bundle_locator.mjs';
import {
  writeState,
  readState,
  createInitialState,
  STATE_DIR,
  STATE_FILE,
  STATE_DIR_README,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { validateHtmlFirstRun } from '../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_contract.mjs';
import { DEFAULT_INIT_MODE } from '../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';

const FRAMEWORK_ROOT = resolve('PPTMAKER_FRAMEWORK');
const GUIDE_TEMPLATE = 'PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md';

const BUNDLE = 'PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';
const PPT_FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';
const TEST_DECK = join(tmpdir(), `deck_test_${Date.now()}`);

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 15000 }).trim();
  } catch (e) {
    return `ERROR(${e.status}): ${e.stderr}`;
  }
}

beforeAll(() => {
  if (!existsSync(TEST_DECK)) mkdirSync(TEST_DECK, { recursive: true });
});
afterAll(() => {
  try {
    rmSync(TEST_DECK, { recursive: true, force: true });
  } catch {}
});

describe('bundle_layout', () => {
  it('seeds one mode-neutral locator and operating guide across modes and deck types', () => {
    for (const mode of ['image2-only', 'html-only', 'html-then-image2']) {
      for (const deckType of [null, 'keynote', 'pitch', 'report', 'training']) {
        const deck = join(tmpdir(), `deck_continuation_${mode}_${deckType || 'generic'}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
        try {
          initBundle(deck, FRAMEWORK_ROOT, deckType, null, { mode });
          const manifest = parseRunBundleManifest(readFileSync(join(deck, RUN_BUNDLE_FILE), 'utf8'));
          const guide = readFileSync(join(deck, 'deck-guide.md'), 'utf8');
          expect(manifest.deck_root).toBe(realpathSync.native(deck));
          expect(manifest.framework_root).toBe(FRAMEWORK_ROOT);
          const relation = relative(realpathSync.native(deck), FRAMEWORK_ROOT).split(sep).join('/');
          expect(manifest.framework_relation).toBe(relation);
          expect(guide).toContain('## Source ownership');
          expect(guide).toContain('RUN_BUNDLE.md');
          expect(guide).toContain('_state/state.yaml');
          expect(guide).toContain('requires_human: true');
          expect(guide).not.toMatch(/framework_relation|current (?:version|pipeline|node)|next action|gate status|digest/i);
        } finally { rmSync(deck, { recursive: true, force: true }); }
      }
    }
    const template = readFileSync(GUIDE_TEMPLATE, 'utf8');
    expect(template).toContain('operating guide');
    expect(template).toContain('RUN_BUNDLE.md');
    expect(template).not.toContain('continuation_card.mjs');
  });

  it('measures framework_relation for an external legal deck path', () => {
    const root = mkdtempSync(join(tmpdir(), 'continuation-external-'));
    const deck = join(root, 'deck_external_relation');
    try {
      initBundle(deck, FRAMEWORK_ROOT, 'keynote', null, { mode: 'image2-only' });
      const manifest = parseRunBundleManifest(readFileSync(join(deck, RUN_BUNDLE_FILE), 'utf8'));
      const expectedRelation = (relative(realpathSync.native(deck), FRAMEWORK_ROOT) || '.').split(sep).join('/');
      expect(manifest.framework_relation).not.toBe('../PPTMAKER_FRAMEWORK');
      expect(manifest.framework_relation).toBe(expectedRelation);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('keeps structure-only checks exact-version and zero-write', () => {
    const deck = join(tmpdir(), `deck_structure_only_${Date.now()}`);
    try {
      initBundle(deck, FRAMEWORK_ROOT, 'keynote', null, { mode: 'image2-only' });
      const runDir = join(deck, '3_versions', 'v1');
      const cardBefore = readFileSync(join(deck, RUN_BUNDLE_FILE));
      const stateBefore = readFileSync(join(deck, '_state', 'state.yaml'));
      const exact = spawnSync('node', [BUNDLE, '--check', runDir, '--structure-only'], { encoding: 'utf8', timeout: 15_000 });
      expect(exact.status, exact.stderr || exact.stdout).toBe(0);
      const root = spawnSync('node', [BUNDLE, '--check', deck, '--structure-only'], { encoding: 'utf8', timeout: 15_000 });
      expect(root.status).not.toBe(0);
      expect(`${root.stderr}\n${root.stdout}`).toContain('--run-dir must be a version dir');
      expect(readFileSync(join(deck, RUN_BUNDLE_FILE))).toEqual(cardBefore);
      expect(readFileSync(join(deck, '_state', 'state.yaml'))).toEqual(stateBefore);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
  it('seeds HTML-first runs by default and whole-page runs explicitly', () => {
    const wholePage = join(tmpdir(), `deck_whole_page_seed_${Date.now()}`);
    try {
      for (const deckType of [null, 'keynote', 'pitch', 'report', 'training']) {
        const deck = join(tmpdir(), `deck_html_seed_${deckType || 'generic'}_${Date.now()}`);
        try {
          initHtmlFirstBundle(deck, null, deckType, 'dark-executive');
          const runDir = join(deck, '3_versions', 'v1');
          const htmlSource = readFileSync(join(runDir, 'slide-specifications.md'), 'utf8');
          expect(htmlSource).toContain('pipeline: html-first-v1');
          expect(htmlSource).toContain('scheme: mnemonic-v1');
          expect(htmlSource).not.toMatch(/^render:|\*\*(?:RENDER MODE|IMAGE PROMPT|VISUAL ASSETS)\*\*/m);
          expect(() => validateHtmlFirstRun({ runDir })).not.toThrow();
          expect(readFileSync(join(deck, '2_backbone', 'visual-style', 'assets', 'asset-manifest.yaml'), 'utf8')).toBe('version: 2\nassets: {}\n');
          const assetsReadme = readFileSync(join(deck, '2_backbone', 'visual-style', 'assets', 'README.md'), 'utf8');
          expect(assetsReadme).toContain('primary_visual.fallback');
          expect(assetsReadme).toContain('typed block');
          expect(assetsReadme).toContain('SHA-256');
          expect(assetsReadme).not.toContain('**VISUAL ASSETS**');
          const metadata = readFileSync(join(deck, 'project-metadata.yaml'), 'utf8');
          expect(metadata).toContain('content_gate: pending');
          expect(metadata).toContain('visual_gate: pending');
          expect(metadata).toContain('html_content_gate: pending');
          expect(metadata).toContain('html_content_gate_run_version: v1');
          expect(metadata).toContain('html_visual_gate: pending');
          expect(metadata).toContain('html_visual_gate_run_version: v1');
          expect(metadata).not.toContain('html_run_version:');
          const state = readState(deck);
          expect(state.gates).toMatchObject({
            content: 'pending',
            visual: 'pending',
            html_content: 'pending',
            html_content_run_version: 'v1',
            html_visual: 'pending',
            html_visual_run_version: 'v1',
          });
          expect(state.nodes['html-production-reset']).toBeUndefined();
          expect(existsSync(join(deck, '_state', 'README.md'))).toBe(true);
          expect(existsSync(join(deck, '_lessons', 'README.md'))).toBe(true);
          expect(existsSync(join(runDir, '_generated', 'html_production'))).toBe(false);
          expect(existsSync(join(runDir, '_generated', 'page_prompts'))).toBe(false);
          expect(existsSync(join(runDir, '_generated', 'raw_images'))).toBe(false);
          expect(existsSync(join(runDir, '_generated', 'final_slides'))).toBe(false);
          expect(existsSync(join(runDir, '_scratch', 'image2_refinement'))).toBe(false);
          expect(existsSync(join(runDir, '_generated', 'image2_refinement'))).toBe(false);
          expect(existsSync(join(deck, '2_backbone', 'visual-style', 'style_master.jpg'))).toBe(false);
        } finally { rmSync(deck, { recursive: true, force: true }); }
      }
      initWholePageBundle(wholePage, null, 'keynote', 'dark-executive');
      expect(readFileSync(join(wholePage, '3_versions', 'v1', 'slide-specifications.md'), 'utf8')).toContain('pipeline: whole-page-image2-v1');
    } finally {
      rmSync(wholePage, { recursive: true, force: true });
    }
  });
  it('all init templates seed a valid HTML-first structured starter', () => {
    for (const deckType of [null, 'keynote', 'pitch', 'report', 'training']) {
      const deck = join(tmpdir(), `deck_render_policy_${deckType || 'generic'}_${Date.now()}`);
      try {
        initBundle(deck, null, deckType, null, { mode: 'html-only' });
        const specs = readFileSync(
          join(deck, '3_versions', 'v1', 'slide-specifications.md'),
          'utf-8'
        );
        expect(specs).toContain('pipeline: html-first-v1');
        expect(specs).toMatch(/identity:\s*\n\s+scheme: mnemonic-v1/);
        expect(specs).not.toMatch(/\*\*(?:RENDER MODE|IMAGE PROMPT|VISUAL ASSETS)\*\*/);
      } finally {
        rmSync(deck, { recursive: true, force: true });
      }
    }
  });

  it('prints tree by default including _state and _lessons', () => {
    const out = run(`node ${BUNDLE}`);
    expect(out).toContain('deck_');
    expect(out).toContain('1_upstream_raw_material');
    expect(out).toContain('2_backbone');
    expect(out).toContain('3_versions');
    expect(out).toContain('_state');
    expect(out).toContain('_lessons');
    expect(out).toMatch(/retained lessons|read-before-guess|probe\/overcome/);
  });

  it('passes self-check', () => {
    const out = run(`node ${BUNDLE} --self-check`);
    expect(out).toContain('SSOT self-consistent');
  });

  it('renderTree and selfCheck include STATE_DIR and LESSONS_DIR', () => {
    expect(renderTree()).toContain(STATE_DIR);
    expect(renderTree()).toContain(LESSONS_DIR);
    expect(renderTree()).toContain('_scratch');
    expect(renderTree()).toContain(AGENT_POINTER_FILE);
    expect(selfCheck()).toEqual([]);
  });

  it('rejects --init without deck_ prefix', () => {
    const out = run(`node ${BUNDLE} --init /tmp/bad_name`);
    expect(out).toContain('must start with');
  });

  it('rejects --init inside framework', () => {
    const out = run(`node ${BUNDLE} --init PPTMAKER_FRAMEWORK/deck_test`);
    expect(out).toContain('refusing to scaffold');
  });

  it('rejects unknown deck-type', () => {
    try {
      execSync(`node ${BUNDLE} --init ${TEST_DECK} --deck-type invalid`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: 'pipe',
      });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/unknown|Error|throw/);
      expect(e.status).not.toBe(0);
    }
  });

  it('initBundle scaffolds discoverable _state and _lessons', () => {
    const deck = join(tmpdir(), `deck_state_init_${Date.now()}`);
    mkdirSync(deck, { recursive: true });
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const readme = join(deck, STATE_DIR, 'README.md');
      const yaml = join(deck, STATE_DIR, STATE_FILE);
      expect(existsSync(readme)).toBe(true);
      expect(readFileSync(readme, 'utf-8')).toContain('NODE-SPEC');
      expect(existsSync(yaml)).toBe(true);
      const body = readFileSync(yaml, 'utf-8');
      expect(body.startsWith('#')).toBe(true);
      expect(body).toContain('NODE-SPEC');
      const s = readState(deck);
      expect(s.playbook).toBe('create-deck');
      expect(readFileSync(join(deck, 'deck-guide.md'), 'utf-8')).toContain(
        '_state/state.yaml'
      );
      const agents = readFileSync(join(deck, AGENT_POINTER_FILE), 'utf-8');
      const claude = readFileSync(join(deck, 'CLAUDE.md'), 'utf-8');
      const guide = readFileSync(join(deck, 'deck-guide.md'), 'utf-8');
      expect(agents).toContain('[deck-guide.md](deck-guide.md)');
      expect(claude).toContain('[deck-guide.md](deck-guide.md)');
      expect(agents).toContain('[RUN_BUNDLE.md](RUN_BUNDLE.md)');
      expect(claude).toContain('[RUN_BUNDLE.md](RUN_BUNDLE.md)');
      expect(guide).toContain('## Source ownership');
      expect(guide).toContain('RUN_BUNDLE.md');
      expect(guide).toContain('_state/state.yaml');
      expect(guide).toContain('diagnostic.next');
      expect(guide).toContain('Never hand-edit');
      expect(guide).not.toContain('html-first-v1');
      expect(guide).not.toContain('当前版本');
      expect(guide).not.toContain('next action');
      expect(checkBundle(join(deck, '3_versions', 'v1'), false)).toEqual([]);
      expect(readFileSync(join(deck, 'README.md'), 'utf-8')).toContain('RUN_BUNDLE.md');
      expect(checkDeckRootControls(deck)).toEqual([]);
      expect(
        readFileSync(join(deck, 'project-metadata.yaml'), 'utf-8')
      ).toMatch(/#.*_state/);
      const lessonsReadme = readFileSync(join(deck, LESSONS_DIR, 'README.md'), 'utf-8');
      expect(lessonsReadme).toContain('这里放什么');
      expect(lessonsReadme).toContain('闭环');
      expect(lessonsReadme).toContain('一题一文');
      expect(lessonsReadme).toContain('image2-proven.yaml');
      // Copy-paste template present in LESSONS_DIR_README
      expect(lessonsReadme).toContain('遇到什么');
      expect(lessonsReadme).toContain('怎么试的');
      expect(readFileSync(join(deck, '.env.example'), 'utf-8')).toContain('IMAGE2_API_KEY');
      expect(existsSync(join(deck, '3_versions', 'v1', '_scratch', 'README.md'))).toBe(true);
      expect(readFileSync(join(deck, '3_versions', 'v1', '_scratch', 'README.md'), 'utf-8')).toMatch(
        /上严下松|_scratch/
      );
      const gitignore = readFileSync(join(deck, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('3_versions/*/_generated/');
      expect(gitignore).toContain('3_versions/*/_scratch/*');
      expect(gitignore).toContain('!3_versions/*/_scratch/README.md');
      expect(gitignore).not.toContain('slide-specifications.md');
      expect(gitignore).not.toContain('_state/');
      expect(gitignore).not.toContain('_lessons/');
      expect(existsSync(join(deck, '.git'))).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('structure-only check passes without _state (D10)', () => {
    const deck = join(tmpdir(), `deck_legacy_nostate_${Date.now()}`);
    const v1 = join(deck, '3_versions', 'v1');
    mkdirSync(v1, { recursive: true });
    mkdirSync(join(deck, '1_upstream_raw_material'), { recursive: true });
    mkdirSync(join(deck, '2_backbone', 'visual-style'), { recursive: true });
    writeFileSync(join(deck, 'deck-guide.md'), '# g\n');
    writeFileSync(join(deck, 'CLAUDE.md'), '# c\n');
    writeFileSync(
      join(deck, 'project-metadata.yaml'),
      'deck_name: x\ncontent_gate: pending\nvisual_gate: pending\n'
    );
    writeFileSync(join(v1, 'slide-specifications.md'), '# specs\n');
    writeFileSync(join(v1, 'README.md'), '# v1\n');
    try {
      const issues = checkBundle(v1, false);
      expect(issues.every((i) => !i.includes('_state'))).toBe(true);
      expect(issues.every((i) => !i.includes('_lessons'))).toBe(true);
      expect(issues.filter((i) => i.includes('unexpected')).length).toBe(0);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('structure check emits bounded issues and an argument-safe rerun', () => {
    const deck = join(tmpdir(), `deck_bad_structure_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      writeFileSync(join(deck, 'unexpected-root.txt'), 'x', 'utf8');
      const runDir = join(deck, '3_versions', 'v1');
      const result = spawnSync('node', [BUNDLE, '--check', runDir, '--structure-only'], { encoding: 'utf8', timeout: 10000 });
      expect(result.status).toBe(1);
      const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: 'structure', source: { path: runDir } });
      expect(envelope.diagnostic.issues.length).toBeGreaterThan(0);
      expect(envelope.diagnostic.next.invocation.args).toEqual([BUNDLE.replace('PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs', join(process.cwd(), BUNDLE)), '--check', runDir, '--structure-only']);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('structure-only check allows _lessons at deck root', () => {
    const deck = join(tmpdir(), `deck_lessons_ok_${Date.now()}`);
    const v1 = join(deck, '3_versions', 'v1');
    mkdirSync(v1, { recursive: true });
    mkdirSync(join(deck, '1_upstream_raw_material'), { recursive: true });
    mkdirSync(join(deck, '2_backbone', 'visual-style'), { recursive: true });
    mkdirSync(join(deck, LESSONS_DIR), { recursive: true });
    writeFileSync(join(deck, 'deck-guide.md'), '# g\n');
    writeFileSync(join(deck, 'CLAUDE.md'), '# c\n');
    writeFileSync(
      join(deck, 'project-metadata.yaml'),
      'deck_name: x\ncontent_gate: pending\nvisual_gate: pending\n'
    );
    writeFileSync(join(v1, 'slide-specifications.md'), '# specs\n');
    writeFileSync(join(v1, 'README.md'), '# v1\n');
    try {
      const issues = checkBundle(v1, false);
      expect(issues.filter((i) => i.includes('unexpected') && i.includes('_lessons')).length).toBe(0);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('requires durable state for whole-page status', () => {
    for (const catalogMode of ['absent', 'v1']) {
      const deck = join(tmpdir(), `deck_missing_state_catalog_${catalogMode}_${Date.now()}`);
      try {
        initWholePageBundle(deck, null, 'keynote', 'dark-executive');
        const v1 = join(deck, '3_versions', 'v1');
        const assets = join(deck, '2_backbone', 'visual-style', 'assets');
        rmSync(join(deck, '_state'), { recursive: true, force: true });
        if (catalogMode === 'absent') rmSync(assets, { recursive: true, force: true });
        const catalogPath = join(assets, 'asset-manifest.yaml');
        const beforeCatalog = existsSync(catalogPath) ? readFileSync(catalogPath) : null;
        expect(checkBundle(v1, false)).toEqual([]);
        const status = spawnSync('node', [PPT_FLOW, 'status', v1, '--json'], { encoding: 'utf8', timeout: 15_000 });
        expect(status.status).toBe(1);
        expect(existsSync(join(deck, '_state'))).toBe(false);
        expect(existsSync(catalogPath) ? readFileSync(catalogPath) : null).toEqual(beforeCatalog);
      } finally {
        rmSync(deck, { recursive: true, force: true });
      }
    }
  });

  it('rejects opposite-branch generated owners instead of treating them as readiness', () => {
    const htmlDeck = join(tmpdir(), `deck_html_opposite_${Date.now()}`);
    const wholePageDeck = join(tmpdir(), `deck_whole_page_opposite_${Date.now()}`);
    try {
      initHtmlFirstBundle(htmlDeck, null, 'keynote', 'dark-executive');
      const htmlRun = join(htmlDeck, '3_versions', 'v1');
      mkdirSync(join(htmlRun, '_generated', 'page_images_full'), { recursive: true });
      writeFileSync(join(htmlRun, '_generated', 'page_images_full', 'KeyGo.png'), 'not-authority');
      const htmlIssues = checkBundle(htmlRun, false);
      expect(htmlIssues).toContain("legacy generated owner 'page_images_full/' is inapplicable to html-first-v1");
      const htmlStatus = spawnSync('node', [PPT_FLOW, 'status', htmlRun, '--json'], { encoding: 'utf8', timeout: 15_000 });
      expect(htmlStatus.status).toBe(1);
      expect(JSON.parse(htmlStatus.stdout)).toMatchObject({ pipeline: 'html-first-v1', raw_images: 0, content_gate: 'pending', visual_gate: 'pending' });

      initWholePageBundle(wholePageDeck, null, 'keynote', 'dark-executive');
      const wholePageRun = join(wholePageDeck, '3_versions', 'v1');
      mkdirSync(join(wholePageRun, '_generated', 'html_production', 'final_slides', 'objects'), { recursive: true });
      expect(checkBundle(wholePageRun, false)).toContain(
        "HTML generated owner 'html_production/' is inapplicable to whole-page Image2 production"
      );
    } finally {
      rmSync(htmlDeck, { recursive: true, force: true });
      rmSync(wholePageDeck, { recursive: true, force: true });
    }
  });

  it('validates HTML production and migration scratch immediate ownership', () => {
    const deck = join(tmpdir(), `deck_html_layout_${Date.now()}`);
    try {
      initHtmlFirstBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      const production = join(v1, '_generated', 'html_production');
      mkdirSync(join(production, 'html_pages', 'objects'), { recursive: true });
      mkdirSync(join(production, 'final_slides', 'objects'), { recursive: true });
      mkdirSync(join(production, 'preview', 'plans'), { recursive: true });
      writeFileSync(join(production, 'preview', 'plans', `${'a'.repeat(64)}.json`), '{}');
      mkdirSync(join(v1, '_scratch', 'html-migration', 'projected-run'), { recursive: true });
      writeFileSync(join(production, '.DS_Store'), 'finder');
      writeFileSync(join(v1, '_scratch', 'html-migration', '.DS_Store'), 'finder');
      expect(checkBundle(v1, false)).toEqual(["retired 'html-migration' scratch is not permitted"]);
      writeFileSync(join(production, 'rogue-owner'), 'x');
      writeFileSync(join(production, 'preview', 'plans', 'rogue.json'), '{}');
      writeFileSync(join(v1, '_scratch', 'html-migration', '.foreign-cache'), 'x');
      writeFileSync(join(v1, '_scratch', 'html-migration', 'projected-run', 'foreign-support.json'), '{}');
      writeFileSync(join(v1, '_scratch', 'html-migration', 'projected-run', 'apply-journal.json'), '{}');
      const issues = checkBundle(v1, false);
      expect(issues.some((issue) => issue.includes('rogue-owner') && issue.includes('HTML production root'))).toBe(true);
      expect(issues.some((issue) => issue.includes('rogue.json') && issue.includes('HTML preview plans'))).toBe(true);
      expect(issues.some((issue) => issue.includes("retired 'html-migration' scratch"))).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('keeps production-mode-transition scratch isolated and closed', () => {
    const deck = join(tmpdir(), `deck_transition_layout_${Date.now()}`);
    try {
      initWholePageBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      const scratch = join(v1, '_scratch', 'production-mode-transition');
      mkdirSync(join(scratch, 'candidate-run'), { recursive: true });
      writeFileSync(join(scratch, 'plan.json'), '{}');
      writeFileSync(join(scratch, 'apply-journal.json'), '{}');
      expect(checkBundle(v1, false)).toEqual([]);
      writeFileSync(join(scratch, 'legacy-plan.json'), '{}');
      expect(checkBundle(v1, false)).toContain("unexpected 'legacy-plan.json' in production-mode-transition scratch/");
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it('accepts only a target-local closed production-mode transition receipt', () => {
    const deck = join(tmpdir(), `deck_transition_receipt_${Date.now()}`);
    try {
      initWholePageBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      const receipt = join(v1, '_generated', 'qa', 'production_mode_transition.json');
      mkdirSync(join(v1, '_generated', 'qa'), { recursive: true });
      writeFileSync(receipt, '{}');
      expect(checkBundle(v1, false)).toContain('production-mode transition receipt has an invalid closed schema or target binding');
      writeFileSync(receipt, JSON.stringify({
        schema: 'pptmaker-production-mode-transition-success-v1',
        source_execution_id: 'exec-source', source_version: 'v2', target_version: 'v1',
        target_mode: 'image2-only', target_pipeline: 'whole-page-image2-v1',
        plan_hash: 'a'.repeat(64), candidate_receipt_sha256: 'b'.repeat(64),
        target_intake_sha256: 'c'.repeat(64), source_control_fingerprint: 'd'.repeat(64),
      }));
      expect(checkBundle(v1, false)).toEqual([]);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it('keeps modern refinement source, derived, and scratch partitions lazy and closed', () => {
    const deck = join(tmpdir(), `deck_refinement_layout_${Date.now()}`);
    try {
      initHtmlFirstBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      const visualStyle = join(v1, 'overrides', 'visual-style');
      const assets = join(visualStyle, 'assets', 'refined', 'image2');
      mkdirSync(join(assets, 'style-reference'), { recursive: true });
      mkdirSync(join(assets, 'visual-slots'), { recursive: true });
      writeFileSync(join(assets, 'style-reference', 'reference.png'), 'source-asset');
      writeFileSync(join(assets, 'visual-slots', 'SlideGo.png'), 'source-asset');
      writeFileSync(join(visualStyle, 'image2-refinement.yaml'), 'schema: pptmaker-image2-refinement-provenance-v1\n');
      mkdirSync(join(v1, '_generated', 'image2_refinement', 'candidates'), { recursive: true });
      mkdirSync(join(v1, '_generated', 'image2_refinement', 'comparisons'), { recursive: true });
      mkdirSync(join(v1, '_generated', 'image2_refinement', 'attempts'), { recursive: true });
      mkdirSync(join(v1, '_scratch', 'image2_refinement', 'journals'), { recursive: true });
      expect(checkBundle(v1, false)).toEqual([]);

      writeFileSync(join(visualStyle, 'image2-provenance.yaml'), 'not canonical\n');
      writeFileSync(join(v1, '_generated', 'image2_refinement', 'delivery-manifest.json'), '{}');
      const issues = checkBundle(v1, false);
      expect(issues.some((issue) => issue.includes('image2-provenance.yaml') && issue.includes('not a canonical visual-style asset'))).toBe(true);
      expect(issues.some((issue) => issue.includes('delivery-manifest.json') && issue.includes('modern refinement derived owner'))).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('publishes structural versions from owned hidden staging without copying generated bytes', () => {
    const deck = join(tmpdir(), `deck_structural_publish_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      writeFileSync(join(v1, 'slide-specifications.md'), '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nbody\n', 'utf8');
      writeFileSync(join(v1, '_generated', 'old.bin'), 'old generated', 'utf8');
      expect(nextVersionName(v1)).toBe('v2');
      const result = publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nchanged\n',
        expectedSourceSha256: createHash('sha256').update(readFileSync(join(v1, 'slide-specifications.md'))).digest('hex'),
      });
      expect(result.target).toBe(join(deck, '3_versions', 'v2'));
      expect(readFileSync(join(result.target, 'slide-specifications.md'), 'utf8')).toContain('changed');
      expect(readFileSync(join(v1, 'slide-specifications.md'), 'utf8')).toContain('body');
      expect(readdirSync(join(result.target, '_generated'))).toEqual(['README.md']);
      expect(readdirSync(join(deck, '3_versions')).filter((name) => name.startsWith('.v2'))).toEqual([]);
      expect(checkBundle(result.target, false)).toEqual([]);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('keeps init and structural publication Git-independent', () => {
    const source = readFileSync(BUNDLE, 'utf8');
    expect(source).not.toMatch(/(?:execFile|spawn|execSync|execFileSync)\s*\(/);
    expect(source).not.toMatch(/(?:command|cmd)\s*[:=]\s*['"]git['"]/);
    const deck = join(tmpdir(), `deck_git_independent_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      writeFileSync(join(v1, 'slide-specifications.md'), '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nbody\n', 'utf8');
      const result = publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nchanged\n',
      });
      expect(result.published).toBe(true);
      expect(existsSync(join(deck, '.git'))).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('does not rewrite an existing guide or ignore file during a later init call', () => {
    const deck = join(tmpdir(), `deck_existing_git_boundary_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const guidePath = join(deck, 'deck-guide.md');
      const ignorePath = join(deck, '.gitignore');
      writeFileSync(guidePath, '# existing guide\n', 'utf8');
      writeFileSync(ignorePath, '# existing ignore\n', 'utf8');
      initBundle(deck, null, 'keynote', 'dark-executive');
      expect(readFileSync(guidePath, 'utf8')).toBe('# existing guide\n');
      expect(readFileSync(ignorePath, 'utf8')).toBe('# existing ignore\n');
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('fails closed on owned-target conflicts and stale source without exposing a partial version', () => {
    const deck = join(tmpdir(), `deck_structural_conflict_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const versions = join(deck, '3_versions');
      const v1 = join(versions, 'v1');
      writeFileSync(join(v1, 'slide-specifications.md'), '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nbody\n', 'utf8');
      mkdirSync(join(versions, '.v2.reservation'));
      writeFileSync(join(versions, '.v2.reservation', 'owner'), 'another-owner', 'utf8');
      expect(() => publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nchanged\n',
      })).toThrow(/exist|reservation/i);
      expect(existsSync(join(versions, 'v2'))).toBe(false);
      expect(readFileSync(join(versions, '.v2.reservation', 'owner'), 'utf8')).toBe('another-owner');
      rmSync(join(versions, '.v2.reservation'), { recursive: true, force: true });

      expect(() => publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n## Slide 01: DeckGo\n\nchanged\n',
        expectedSourceSha256: '0'.repeat(64),
      })).toThrow(/source changed/i);
      expect(existsSync(join(versions, 'v2'))).toBe(false);
      expect(readdirSync(versions).filter((name) => name.startsWith('.v2'))).toEqual([]);
      expect(readFileSync(join(v1, 'slide-specifications.md'), 'utf8')).toContain('body');
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('preview readiness allows pending gates when style master exists', () => {
    const deck = join(tmpdir(), `deck_preview_${Date.now()}`);
    const v1 = join(deck, '3_versions', 'v1');
    const vs = join(deck, '2_backbone', 'visual-style');
    mkdirSync(v1, { recursive: true });
    mkdirSync(join(deck, '1_upstream_raw_material'), { recursive: true });
    mkdirSync(vs, { recursive: true });
    writeFileSync(join(deck, 'deck-guide.md'), '# g\n');
    writeFileSync(join(deck, 'CLAUDE.md'), '# c\n');
    writeFileSync(
      join(deck, 'project-metadata.yaml'),
      'deck_name: x\ncontent_gate: pending\nvisual_gate: pending\n'
    );
    writeFileSync(join(v1, 'slide-specifications.md'), '---\nproduction:\n  pipeline: whole-page-image2-v1\n---\n\n# specs\n');
    writeFileSync(join(v1, 'README.md'), '# v1\n');
    writeFileSync(join(vs, 'style_master.jpg'), 'fake');
    try {
      const preview = checkBundle(v1, 'preview');
      expect(preview.filter((i) => i.includes('gate')).length).toBe(0);
      const pipeline = checkBundle(v1, 'pipeline');
      expect(pipeline.some((i) => i.includes('content_gate'))).toBe(true);
      expect(pipeline.some((i) => i.includes('visual_gate'))).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});

describe('state discoverability', () => {
  it('writeState keeps header across rewrites and heals README', () => {
    const deck = join(tmpdir(), `deck_state_write_${Date.now()}`);
    mkdirSync(join(deck, STATE_DIR), { recursive: true });
    try {
      const s1 = createInitialState('x', 'keynote', 'dark-executive');
      writeState(deck, s1);
      const yaml1 = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(yaml1.startsWith('#')).toBe(true);
      expect(existsSync(join(deck, STATE_DIR, 'README.md'))).toBe(true);
      expect(readFileSync(join(deck, STATE_DIR, 'README.md'), 'utf-8')).toBe(
        STATE_DIR_README
      );

      rmSync(join(deck, STATE_DIR, 'README.md'));
      s1.current_node = 'authoring-slides';
      writeState(deck, s1);
      const yaml2 = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(yaml2.startsWith('#')).toBe(true);
      expect(existsSync(join(deck, STATE_DIR, 'README.md'))).toBe(true);
      expect(readState(deck)).toMatchObject({ replacement_required: true });
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('state.mjs does not import bundle_layout', () => {
    const src = readFileSync(
      'PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs',
      'utf-8'
    );
    expect(src).not.toMatch(/bundle_layout/);
  });
});

describe('version _scratch (上严下松)', () => {
  it('allows bak inside version _scratch and rejects deck-root bak', () => {
    const deck = join(tmpdir(), `deck_scratch_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      writeFileSync(join(v1, SCRATCH_SUBDIR, 'slide.bak'), 'old specs\n');
      const ok = checkBundle(v1, false);
      expect(ok.every((i) => !i.includes(SCRATCH_SUBDIR) || !i.includes('unexpected'))).toBe(
        true
      );
      expect(ok.filter((i) => i.includes("unexpected '_scratch'")).length).toBe(0);

      writeFileSync(join(deck, '_slidespec.bak-kicker'), 'litter\n');
      const bad = checkBundle(v1, false);
      expect(bad.some((i) => i.includes('_slidespec.bak-kicker') && i.includes('deck root'))).toBe(
        true
      );
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('new-version seeds empty scratch without copying bak', () => {
    const deck = join(tmpdir(), `deck_scratch_nv_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      writeFileSync(join(v1, SCRATCH_SUBDIR, 'keep-me-out-of-v2.bak'), 'secret\n');
      const v2 = createVersion(v1);
      expect(existsSync(join(v2, SCRATCH_SUBDIR, 'README.md'))).toBe(true);
      expect(existsSync(join(v2, SCRATCH_SUBDIR, 'keep-me-out-of-v2.bak'))).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});

describe('mode-aware init seeds (2.1, 2.3)', () => {
  function initFor(mode) {
    const deck = join(tmpdir(), `deck_mode_${mode || 'default'}_${Date.now()}`);
    initBundle(deck, null, 'keynote', 'dark-executive', mode ? { mode } : {});
    return deck;
  }
  function source(deck) {
    return readFileSync(join(deck, '3_versions', 'v1', 'slide-specifications.md'), 'utf8');
  }

  it('defaults to DEFAULT_INIT_MODE (image2-only release default)', () => {
    expect(DEFAULT_INIT_MODE).toBe('image2-only');
    const deck = initFor(null);
    try {
      expect(source(deck)).not.toContain('pipeline: html-first-v1');
      expect(source(deck)).toContain('default: full-page');
      const state = readState(deck);
      expect(state.production_mode.by_version['3_versions/v1']).toEqual({ mode: 'image2-only' });
      expect(state.pipeline).toBe('whole-page-image2-v1');
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it('html-only / html-then-image2 seed the explicit html-first-v1 marker and mode', () => {
    for (const mode of ['html-only', 'html-then-image2']) {
      const deck = initFor(mode);
      try {
        const src = source(deck);
        expect(src).toContain('pipeline: html-first-v1');
        expect(src).toContain('scheme: mnemonic-v1');
        expect(readState(deck).production_mode.by_version['3_versions/v1']).toEqual({ mode });
      } finally { rmSync(deck, { recursive: true, force: true }); }
    }
  });

  it('image2-only seeds the explicit whole-page source and pipeline marker', () => {
    const deck = initFor('image2-only');
    try {
      const src = source(deck);
      expect(src).toContain('scheme: mnemonic-v1');
      expect(src).toContain('default: full-page');
      expect(src).toContain('pipeline: whole-page-image2-v1');
      const state = readState(deck);
      expect(state.production_mode.by_version['3_versions/v1']).toEqual({ mode: 'image2-only' });
      expect(state.pipeline).toBe('whole-page-image2-v1');
      // No style master, generated output, or provider attempt is created.
      expect(existsSync(join(deck, '2_backbone', 'visual-style', 'style_master.jpg'))).toBe(false);
      expect(existsSync(join(deck, '3_versions', 'v1', '_generated', 'page_images_full'))).toBe(false);
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it('metadata mirrors the seeded production mode as non-authoritative', () => {
    const deck = initFor('image2-only');
    try {
      const metadata = readFileSync(join(deck, 'project-metadata.yaml'), 'utf8');
      expect(metadata).toContain('production_mode: image2-only');
      expect(metadata).toContain('production_mode_run_version: v1');
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });

  it('an invalid mode is rejected before any filesystem creation', () => {
    const deck = join(tmpdir(), `deck_bad_mode_${Date.now()}`);
    expect(() => initBundle(deck, null, 'keynote', 'dark-executive', { mode: 'html' })).toThrow(/production mode/);
    expect(existsSync(deck)).toBe(false);
  });

  it('initWholePageBundle delegates to the image2-only seed (explicit whole-page)', () => {
    const deck = join(tmpdir(), `deck_whole_page_delegated_${Date.now()}`);
    try {
      initWholePageBundle(deck, null, 'keynote', 'dark-executive');
      expect(source(deck)).not.toContain('pipeline: html-first-v1');
      expect(readState(deck).production_mode.by_version['3_versions/v1']).toEqual({ mode: 'image2-only' });
    } finally { rmSync(deck, { recursive: true, force: true }); }
  });
});
