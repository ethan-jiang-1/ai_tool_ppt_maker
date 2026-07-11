import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initBundle,
  renderTree,
  selfCheck,
  checkBundle,
  LEARNING_DIR,
} from '../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs';
import {
  writeState,
  readState,
  createInitialState,
  STATE_DIR,
  STATE_FILE,
  STATE_DIR_README,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs';

const BUNDLE = 'PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs';
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
  it('prints tree by default including _state and _learning', () => {
    const out = run(`node ${BUNDLE}`);
    expect(out).toContain('deck_');
    expect(out).toContain('1_upstream_raw_material');
    expect(out).toContain('2_backbone');
    expect(out).toContain('3_versions');
    expect(out).toContain('_state');
    expect(out).toContain('_learning');
    expect(out).toMatch(/operational lessons|read-before-guess/);
  });

  it('passes self-check', () => {
    const out = run(`node ${BUNDLE} --self-check`);
    expect(out).toContain('SSOT self-consistent');
  });

  it('renderTree and selfCheck include STATE_DIR and LEARNING_DIR', () => {
    expect(renderTree()).toContain(STATE_DIR);
    expect(renderTree()).toContain(LEARNING_DIR);
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

  it('initBundle scaffolds discoverable _state and _learning', () => {
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
      expect(readFileSync(join(deck, 'README.md'), 'utf-8')).toContain('_state/');
      expect(readFileSync(join(deck, 'README.md'), 'utf-8')).toContain('_learning/');
      expect(
        readFileSync(join(deck, 'project-metadata.yaml'), 'utf-8')
      ).toMatch(/#.*_state/);
      const learningReadme = readFileSync(join(deck, LEARNING_DIR, 'README.md'), 'utf-8');
      expect(learningReadme).toContain('这里放什么');
      expect(learningReadme).toContain('image2-proven.yaml');
      expect(readFileSync(join(deck, '.env.example'), 'utf-8')).toContain('IMAGE2_API_KEY');
      expect(readFileSync(join(deck, 'deck-guide.md'), 'utf-8')).toContain('_learning/');
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
      expect(issues.every((i) => !i.includes('_learning'))).toBe(true);
      expect(issues.filter((i) => i.includes('unexpected')).length).toBe(0);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('structure-only check allows _learning at deck root', () => {
    const deck = join(tmpdir(), `deck_learning_ok_${Date.now()}`);
    const v1 = join(deck, '3_versions', 'v1');
    mkdirSync(v1, { recursive: true });
    mkdirSync(join(deck, '1_upstream_raw_material'), { recursive: true });
    mkdirSync(join(deck, '2_backbone', 'visual-style'), { recursive: true });
    mkdirSync(join(deck, LEARNING_DIR), { recursive: true });
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
      expect(issues.filter((i) => i.includes('unexpected') && i.includes('_learning')).length).toBe(0);
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
      s1.current_node = 'wave0';
      writeState(deck, s1);
      const yaml2 = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(yaml2.startsWith('#')).toBe(true);
      expect(existsSync(join(deck, STATE_DIR, 'README.md'))).toBe(true);
      const loaded = readState(deck);
      expect(loaded.current_node).toBe('wave0');
      expect(loaded.playbook).toBe('create-deck');
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('state.mjs does not import bundle_layout', () => {
    const src = readFileSync(
      'PPTMAKER_FRAMEWORK/scripts/lib/state.mjs',
      'utf-8'
    );
    expect(src).not.toMatch(/bundle_layout/);
  });
});
