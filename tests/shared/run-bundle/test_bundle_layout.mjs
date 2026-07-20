import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import {
  initBundle,
  initLegacyBundle,
  initHtmlFirstBundle,
  renderTree,
  selfCheck,
  checkBundle,
  createVersion,
  nextVersionName,
  publishStructuralVersion,
  AGENT_POINTER_FILE,
  LESSONS_DIR,
  SCRATCH_SUBDIR,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';
import {
  writeState,
  readState,
  createInitialState,
  STATE_DIR,
  STATE_FILE,
  STATE_DIR_README,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { validateHtmlFirstRun } from '../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_contract.mjs';

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
  it('seeds HTML-first runs by default and keeps legacy scaffolding explicit', () => {
    const legacy = join(tmpdir(), `deck_legacy_seed_${Date.now()}`);
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
      initLegacyBundle(legacy, null, 'keynote', 'dark-executive');
      expect(readFileSync(join(legacy, '3_versions', 'v1', 'slide-specifications.md'), 'utf8')).not.toContain('pipeline: html-first-v1');
    } finally {
      rmSync(legacy, { recursive: true, force: true });
    }
  });
  it('all init templates seed a valid HTML-first structured starter', () => {
    for (const deckType of [null, 'keynote', 'pitch', 'report', 'training']) {
      const deck = join(tmpdir(), `deck_render_policy_${deckType || 'generic'}_${Date.now()}`);
      try {
        initBundle(deck, null, deckType, null);
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
      expect(guide).toContain('stderr 最后一个有效 JSON failure envelope');
      expect(guide).toContain('program` + `args');
      expect(guide).toContain('requires_human: true');
      expect(guide).toContain('不猜被省略');
      expect(guide).toContain('`_generated/` 是派生品');
      expect(guide).toContain('plan hash 由 Agent 保存');
      expect(guide).toContain('needs_render 只报告后续成本');
      expect(guide).toContain('新 preview → 新 vNext → 新 deck');
      expect(guide).toContain('不调用 renderer');
      expect(checkBundle(join(deck, '3_versions', 'v1'), false)).toEqual([]);
      expect(readFileSync(join(deck, 'README.md'), 'utf-8')).toContain('_state/');
      expect(readFileSync(join(deck, 'README.md'), 'utf-8')).toContain('_lessons/');
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
      const guideContent = readFileSync(join(deck, 'deck-guide.md'), 'utf-8');
      expect(guideContent).toContain('_lessons/');
      expect(guideContent).toContain('lessons.mjs');
      expect(guideContent).toContain('Git 仅是可选、用户拥有的 source/control 审计');
      expect(guideContent).toContain('`_generated/` 不是恢复目标');
      expect(guideContent).toContain('不做 Git mutation');
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

  it('preserves historical markerless catalogs and absent optional scaffolding without mutation', () => {
    for (const catalogMode of ['absent', 'v1']) {
      const deck = join(tmpdir(), `deck_legacy_catalog_${catalogMode}_${Date.now()}`);
      try {
        initLegacyBundle(deck, null, 'keynote', 'dark-executive');
        const v1 = join(deck, '3_versions', 'v1');
        const assets = join(deck, '2_backbone', 'visual-style', 'assets');
        rmSync(join(deck, '_state'), { recursive: true, force: true });
        if (catalogMode === 'absent') rmSync(assets, { recursive: true, force: true });
        const catalogPath = join(assets, 'asset-manifest.yaml');
        const beforeCatalog = existsSync(catalogPath) ? readFileSync(catalogPath) : null;
        expect(checkBundle(v1, false)).toEqual([]);
        const status = spawnSync('node', [PPT_FLOW, 'status', v1, '--json'], { encoding: 'utf8', timeout: 15_000 });
        expect(status.status, status.stderr || status.stdout).toBe(0);
        expect(JSON.parse(status.stdout)).toMatchObject({ pipeline: 'legacy-image2-first', state_present: false, html_reviews: null });
        expect(existsSync(join(deck, '_state'))).toBe(false);
        expect(existsSync(catalogPath) ? readFileSync(catalogPath) : null).toEqual(beforeCatalog);
      } finally {
        rmSync(deck, { recursive: true, force: true });
      }
    }
  });

  it('rejects opposite-branch generated owners instead of treating them as readiness', () => {
    const htmlDeck = join(tmpdir(), `deck_html_opposite_${Date.now()}`);
    const legacyDeck = join(tmpdir(), `deck_legacy_opposite_${Date.now()}`);
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

      initLegacyBundle(legacyDeck, null, 'keynote', 'dark-executive');
      const legacyRun = join(legacyDeck, '3_versions', 'v1');
      mkdirSync(join(legacyRun, '_generated', 'html_production', 'final_slides', 'objects'), { recursive: true });
      expect(checkBundle(legacyRun, false)).toContain(
        "HTML generated owner 'html_production/' is inapplicable to markerless legacy production"
      );
    } finally {
      rmSync(htmlDeck, { recursive: true, force: true });
      rmSync(legacyDeck, { recursive: true, force: true });
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
      expect(checkBundle(v1, false)).toEqual([]);
      writeFileSync(join(production, 'rogue-owner'), 'x');
      writeFileSync(join(production, 'preview', 'plans', 'rogue.json'), '{}');
      const issues = checkBundle(v1, false);
      expect(issues.some((issue) => issue.includes('rogue-owner') && issue.includes('HTML production root'))).toBe(true);
      expect(issues.some((issue) => issue.includes('rogue.json') && issue.includes('HTML preview plans'))).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('publishes structural versions from owned hidden staging without copying generated bytes', () => {
    const deck = join(tmpdir(), `deck_structural_publish_${Date.now()}`);
    try {
      initBundle(deck, null, 'keynote', 'dark-executive');
      const v1 = join(deck, '3_versions', 'v1');
      writeFileSync(join(v1, 'slide-specifications.md'), '## Slide 01: DeckGo\n\nbody\n', 'utf8');
      writeFileSync(join(v1, '_generated', 'old.bin'), 'old generated', 'utf8');
      expect(nextVersionName(v1)).toBe('v2');
      const result = publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '## Slide 01: DeckGo\n\nchanged\n',
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
      writeFileSync(join(v1, 'slide-specifications.md'), '## Slide 01: DeckGo\n\nbody\n', 'utf8');
      const result = publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '## Slide 01: DeckGo\n\nchanged\n',
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
      writeFileSync(join(v1, 'slide-specifications.md'), '## Slide 01: DeckGo\n\nbody\n', 'utf8');
      mkdirSync(join(versions, '.v2.reservation'));
      writeFileSync(join(versions, '.v2.reservation', 'owner'), 'another-owner', 'utf8');
      expect(() => publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '## Slide 01: DeckGo\n\nchanged\n',
      })).toThrow(/exist|reservation/i);
      expect(existsSync(join(versions, 'v2'))).toBe(false);
      expect(readFileSync(join(versions, '.v2.reservation', 'owner'), 'utf8')).toBe('another-owner');
      rmSync(join(versions, '.v2.reservation'), { recursive: true, force: true });

      expect(() => publishStructuralVersion({
        sourceRunDir: v1,
        versionName: 'v2',
        transformedSource: '## Slide 01: DeckGo\n\nchanged\n',
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
    writeFileSync(join(v1, 'slide-specifications.md'), '# specs\n');
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
      const loaded = readState(deck);
      expect(loaded.current_node).toBe('inspect-legacy-evidence');
      expect(loaded.playbook).toBe('legacy-image2-maintenance');
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
