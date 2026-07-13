import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkNpmPackages,
  findPackageInAncestorNodeModules,
} from '../PPTMAKER_FRAMEWORK/scripts/env-check.mjs';
import { parseCliErrorLine } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';

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
    const { stdout, stderr, exitCode } = runCheck('--json');
    // JSON output may have exit 1 if deps missing, but should still be valid JSON
    const data = JSON.parse(stdout);
    expect(data).toHaveProperty('allPass');
    expect(data).toHaveProperty('checks');
    expect(Array.isArray(data.checks)).toBe(true);
    if (exitCode !== 0) {
      const envelope = parseCliErrorLine(stderr.trim().split(/\r?\n/).at(-1));
      expect(envelope.diagnostic).toMatchObject({ category: 'environment', operation: 'check' });
      expect(envelope.diagnostic.next.invocation.args).toContain('--json');
    }
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

  it('IMAGE2_VENDORS alone satisfies api_key and image_base_url', async () => {
    const prev = {
      IMAGE2_VENDORS: process.env.IMAGE2_VENDORS,
      KEY_A: process.env.KEY_A,
      KEY_B: process.env.KEY_B,
      IMAGE2_API_KEY: process.env.IMAGE2_API_KEY,
      IMAGE2_BASE_URL: process.env.IMAGE2_BASE_URL,
    };
    try {
      delete process.env.IMAGE2_API_KEY;
      delete process.env.IMAGE2_BASE_URL;
      process.env.IMAGE2_VENDORS =
        'https://a.example/v1|KEY_A,https://b.example/v1|KEY_B';
      process.env.KEY_A = 'ka';
      process.env.KEY_B = 'kb';
      const { checkApiKey, checkBaseUrl } = await import(
        '../PPTMAKER_FRAMEWORK/scripts/env-check.mjs'
      );
      const key = checkApiKey();
      const url = checkBaseUrl();
      expect(key.status).toBe('ok');
      expect(key.detail).toMatch(/IMAGE2_VENDORS/);
      expect(url.status).toBe('ok');
      expect(url.detail).toMatch(/a\.example/);
    } finally {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('IMAGE2_VENDORS with missing KEY_ENV fails api_key', async () => {
    const prev = {
      IMAGE2_VENDORS: process.env.IMAGE2_VENDORS,
      MISSING_KEY_VAR: process.env.MISSING_KEY_VAR,
      IMAGE2_API_KEY: process.env.IMAGE2_API_KEY,
    };
    try {
      delete process.env.IMAGE2_API_KEY;
      delete process.env.MISSING_KEY_VAR;
      process.env.IMAGE2_VENDORS = 'https://a.example/v1|MISSING_KEY_VAR';
      const { checkApiKey } = await import('../PPTMAKER_FRAMEWORK/scripts/env-check.mjs');
      const key = checkApiKey();
      expect(key.status).toBe('fail');
      expect(key.detail).toMatch(/MISSING_KEY_VAR/);
    } finally {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});

describe('env-check --smoke', () => {
  it('checkImageSmoke fails on HTTP error without hanging', async () => {
    const prevFetch = globalThis.fetch;
    process.env.IMAGE2_API_KEY = 'k';
    process.env.IMAGE2_BASE_URL = 'https://api.example.test/v1';
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'unauthorized' }),
      json: async () => ({ error: 'unauthorized' }),
    });
    try {
      const { checkImageSmoke } = await import('../PPTMAKER_FRAMEWORK/scripts/env-check.mjs');
      const r = await checkImageSmoke();
      expect(r.check).toBe('image_smoke');
      expect(r.status).toBe('fail');
      expect(r.detail).toMatch(/401|unauthorized/i);
    } finally {
      globalThis.fetch = prevFetch;
      delete process.env.IMAGE2_API_KEY;
      delete process.env.IMAGE2_BASE_URL;
    }
  });

  it('default env-check without --smoke has no image_smoke check', () => {
    const stdout = execSync(`node ${join(process.cwd(), ENV_CHECK)} --json`, {
      encoding: 'utf-8',
      timeout: 20000,
      env: {
        ...process.env,
        IMAGE2_API_KEY: 'k',
        IMAGE2_BASE_URL: 'https://example.test/v1',
      },
    });
    const data = JSON.parse(stdout);
    expect(data.checks.find((c) => c.check === 'image_smoke')).toBeUndefined();
  });
});

describe('env-check --probe-vendors', () => {
  it('checkProbeVendors reports per-vendor ok/fail without writing .env', async () => {
    const prevFetch = globalThis.fetch;
    process.env.IMAGE2_VENDORS =
      'https://ok.example/v1|KEY_OK,https://bad.example/v1|KEY_BAD';
    process.env.KEY_OK = 'ok-key';
    process.env.KEY_BAD = 'bad-key';
    globalThis.fetch = async (url) => {
      if (String(url).includes('ok.example')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: [{ b64_json: 'abc' }] }),
          json: async () => ({ data: [{ b64_json: 'abc' }] }),
        };
      }
      return {
        ok: false,
        status: 502,
        text: async () => JSON.stringify({ error: 'bad gateway' }),
        json: async () => ({ error: 'bad gateway' }),
      };
    };
    try {
      const { checkProbeVendors } = await import('../PPTMAKER_FRAMEWORK/scripts/env-check.mjs');
      const r = await checkProbeVendors();
      expect(r.check).toBe('image_probe_vendors');
      expect(r.status).toBe('ok');
      expect(r.detail).toMatch(/1\/2/);
      expect(r.rows).toHaveLength(2);
      expect(r.rows[0].ok).toBe(true);
      expect(r.rows[1].ok).toBe(false);
      expect(r.fix).toBeNull();
    } finally {
      globalThis.fetch = prevFetch;
      delete process.env.IMAGE2_VENDORS;
      delete process.env.KEY_OK;
      delete process.env.KEY_BAD;
    }
  });

  it('rejects --smoke with --probe-vendors', () => {
    let out = '';
    let exitCode = 0;
    try {
      out = execSync(
        `node ${join(process.cwd(), ENV_CHECK)} --smoke --probe-vendors --json`,
        {
          encoding: 'utf-8',
          timeout: 15000,
          env: {
            ...process.env,
            IMAGE2_API_KEY: 'k',
            IMAGE2_BASE_URL: 'https://example.test/v1',
          },
        }
      );
    } catch (e) {
      exitCode = e.status ?? 1;
      out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    expect(exitCode).not.toBe(0);
    expect(out).toMatch(/mutually exclusive/i);
  });
});
