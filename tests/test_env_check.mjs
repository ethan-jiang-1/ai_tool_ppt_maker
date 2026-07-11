import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkNpmPackages,
  findPackageInAncestorNodeModules,
} from '../PPTMAKER_FRAMEWORK/scripts/env-check.mjs';

const ENV_CHECK = 'PPTMAKER_FRAMEWORK/scripts/env-check.mjs';
const REQUIRED = ['@napi-rs/canvas', 'pptxgenjs', 'commander'];

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

function stubPackages(nmDir) {
  for (const pkg of REQUIRED) {
    mkdirSync(join(nmDir, ...pkg.split('/')), { recursive: true });
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

describe('env-check deps walk-up', () => {
  it('finds packages in a parent node_modules from a child start dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-deps-parent-'));
    try {
      const nm = join(root, 'node_modules');
      stubPackages(nm);
      const deck = join(root, 'deck_x');
      mkdirSync(deck, { recursive: true });

      for (const pkg of REQUIRED) {
        expect(findPackageInAncestorNodeModules(pkg, deck)).toBe(nm);
      }
      const results = checkNpmPackages(deck);
      expect(results.every(r => r.status === 'ok')).toBe(true);
      expect(results[0].detail).toContain(nm);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails when no ancestor has the packages', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-deps-isolated-'));
    try {
      const results = checkNpmPackages(root);
      expect(results.every(r => r.status === 'fail')).toBe(true);
      for (const pkg of REQUIRED) {
        expect(findPackageInAncestorNodeModules(pkg, root)).toBeNull();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses node_modules at the start directory when complete', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-deps-cwd-'));
    try {
      const nm = join(root, 'node_modules');
      stubPackages(nm);
      expect(findPackageInAncestorNodeModules('commander', root)).toBe(nm);
      expect(checkNpmPackages(root).every(r => r.status === 'ok')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('continues past an empty local node_modules to parent packages', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-deps-empty-local-'));
    try {
      const parentNm = join(root, 'node_modules');
      stubPackages(parentNm);
      const deck = join(root, 'deck_x');
      mkdirSync(join(deck, 'node_modules'), { recursive: true });
      // leave deck/node_modules empty — Node would keep walking up

      for (const pkg of REQUIRED) {
        expect(findPackageInAncestorNodeModules(pkg, deck)).toBe(parentNm);
      }
      expect(checkNpmPackages(deck).every(r => r.status === 'ok')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('env-check Image2 base URL hard fail', () => {
  it('fails image_base_url when key present but no URL', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'env-nourl-'));
    try {
      const cleanEnv = {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        IMAGE2_API_KEY: 'test-key-only',
      };
      // Ensure no inherited URL aliases leak in
      for (const k of [
        'IMAGE2_BASE_URL', 'IMAGE2_BASE_URLS',
        'OPENAI_API_KEY', 'OPENAI_BASE_URL',
        'APIMART_API_KEY', 'APIMART_BASE_URL', 'APIMART_BASE_URLS',
      ]) {
        // omit from cleanEnv
      }
      let stdout = '';
      let exitCode = 0;
      try {
        stdout = execSync(`node ${join(process.cwd(), ENV_CHECK)} --json`, {
          encoding: 'utf-8',
          timeout: 15000,
          cwd,
          env: cleanEnv,
        });
      } catch (e) {
        exitCode = e.status ?? 1;
        stdout = e.stdout ?? '';
      }
      expect(exitCode).not.toBe(0);
      const data = JSON.parse(stdout);
      const urlCheck = data.checks.find(c => c.check === 'image_base_url');
      expect(urlCheck).toBeDefined();
      expect(urlCheck.status).toBe('fail');
      expect(urlCheck.fix).toMatch(/IMAGE2_BASE_URL/);
      const keyCheck = data.checks.find(c => c.check === 'api_key');
      expect(keyCheck.status).toBe('ok');
      expect(keyCheck.detail).toContain('IMAGE2_API_KEY');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
