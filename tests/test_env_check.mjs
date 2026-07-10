import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const ENV_CHECK = 'PPTMAKER_FRAMEWORK/scripts/env-check.mjs';

function runCheck(args = '') {
  try {
    const out = execSync(`node ${ENV_CHECK} ${args}`, {
      encoding: 'utf-8',
      timeout: 15000,
      env: { ...process.env, PATH: process.env.PATH }
    });
    return { exitCode: 0, stdout: out };
  } catch (e) {
    return { exitCode: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('00-env-check', () => {
  it('produces text output by default', () => {
    const { stdout } = runCheck();
    expect(stdout).toContain('Environment Check');
    expect(stdout).toContain('Node.js');
    expect(stdout).toContain('npm');
  });

  it('produces JSON with --json', () => {
    const { stdout, exitCode } = runCheck('--json');
    // JSON output may have exit 1 if deps missing, but should still be valid JSON
    const data = JSON.parse(stdout);
    expect(data).toHaveProperty('allPass');
    expect(data).toHaveProperty('checks');
    expect(Array.isArray(data.checks)).toBe(true);
  });

  it('checks Node.js version', () => {
    const { stdout } = runCheck('--json');
    const data = JSON.parse(stdout);
    const nodeCheck = data.checks.find(c => c.check === 'nodejs');
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck.foundation).toBe(true);
    expect(nodeCheck.status).toBe('ok');
  });

  it('treats in-framework Stage 2 scripts as stage2_generator ok', () => {
    const { stdout } = runCheck('--json');
    const data = JSON.parse(stdout);
    const stage2 = data.checks.find(c => c.check === 'stage2_generator');
    expect(stage2).toBeDefined();
    expect(stage2.status).toBe('ok');
    expect(stage2.detail).toMatch(/in-framework/);
  });
});
