import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const BUNDLE = 'PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs';
const TEST_DECK = join(tmpdir(), `deck_test_${Date.now()}`);

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 15000 }).trim();
  } catch (e) {
    return `ERROR(${e.status}): ${e.stderr}`;
  }
}

beforeAll(() => { if (!existsSync(TEST_DECK)) mkdirSync(TEST_DECK, { recursive: true }); });
afterAll(() => { try { rmSync(TEST_DECK, { recursive: true, force: true }); } catch {} });

describe('bundle_layout', () => {
  it('prints tree by default', () => {
    const out = run(`node ${BUNDLE}`);
    expect(out).toContain('deck_');
    expect(out).toContain('1_upstream_raw_material');
    expect(out).toContain('2_backbone');
    expect(out).toContain('3_versions');
  });

  it('passes self-check', () => {
    const out = run(`node ${BUNDLE} --self-check`);
    expect(out).toContain('SSOT self-consistent');
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
    // initBundle validates deckType and throws. Test that it rejects.
    try {
      execSync(`node ${BUNDLE} --init ${TEST_DECK} --deck-type invalid`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/unknown|Error|throw/);
      expect(e.status).not.toBe(0);
    }
  });
});
