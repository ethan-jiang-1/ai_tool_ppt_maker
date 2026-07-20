import { describe, it, expect } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { chmodSync, mkdirSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkImageSmoke,
  checkNode,
  checkNpmPackages,
  checkProbeVendors,
  discoverNpmPackages,
  findPackageInAncestorNodeModules,
  probeGitSafetyForTest,
} from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs';
import { parseCliErrorLine } from '../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs';

const ENV_CHECK = 'PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs';
const REQUIRED = ['@napi-rs/canvas', 'pptxgenjs', 'commander', 'playwright', 'echarts'];

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
    const root = join(nmDir, ...pkg.split('/'));
    mkdirSync(root, { recursive: true });
    if (pkg === 'playwright' || pkg === 'echarts') {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: pkg, version: pkg === 'playwright' ? '1.61.1' : '6.1.0' }));
    }
  }
}

function writeFakeGit(binDir, body) {
  const script = join(binDir, 'git');
  writeFileSync(script, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  chmodSync(script, 0o755);
  return script;
}

function gitRunner(...responses) {
  const calls = [];
  const run = (invocation) => {
    calls.push(invocation);
    return responses[calls.length - 1] ?? { kind: 'malformed' };
  };
  return { calls, run };
}

const GIT_ENV = {
  PATH: '/safe/bin',
  IMAGE2_API_KEY: 'secret-key',
  IMAGE2_BASE_URL: 'https://secret.example/v1',
  PPT_FONT_DIR: '/private/fonts',
  GIT_DIR: '/private/git-dir',
};

describe('env-check optional Git probe', () => {
  it('normalizes missing Git without raw child details', () => {
    const { calls, run } = gitRunner({ kind: 'missing' });
    const result = probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
    expect(result).toEqual(expect.objectContaining({ check: 'git', status: 'warn' }));
    expect(result).not.toHaveProperty('foundation');
    expect(JSON.stringify(result)).not.toContain('private');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(calls).toHaveLength(1);
  });

  it.each([
    'git version 2.48.1\n',
    'git version 2.48.1.windows.1\n',
    'git version 2.48.1 (Apple Git-154)\n',
  ])('recognizes conservative Git version form %j', (versionText) => {
    const { calls, run } = gitRunner(
      { kind: 'ok', rc: 0, stdout: versionText },
      { kind: 'ok', rc: 0, stdout: 'true\n' },
      { kind: 'ok', rc: 0, stdout: 'a'.repeat(40) },
    );
    const result = probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
    expect(result).toEqual({
      check: 'git',
      status: 'ok',
      detail: 'Git 2.48.1 confirms history for the current invocation directory.',
      fix: null,
    });
    expect(calls.map(({ args }) => args)).toEqual([
      ['--version'],
      ['rev-parse', '--is-inside-work-tree'],
      ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'],
    ]);
  });

  it('rejects version suffixes outside the narrow allowlist', () => {
    const { calls, run } = gitRunner(
      { kind: 'ok', rc: 0, stdout: 'git version 2.48.1-custom\n' },
    );
    const result = probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
    expect(result.status).toBe('warn');
    expect(calls).toHaveLength(1);
  });

  it('treats false and nonzero worktree results as nonblocking unconfirmed state', () => {
    for (const worktree of [
      { kind: 'ok', rc: 0, stdout: 'false\n' },
      { kind: 'exit', rc: 128, stdout: '', stderrEmpty: false },
    ]) {
      const { calls, run } = gitRunner(
        { kind: 'ok', rc: 0, stdout: 'git version 2.48.1\n' },
        worktree,
      );
      const result = probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('not confirmed as a Git worktree');
      expect(calls).toHaveLength(2);
    }
  });

  it('recognizes no HEAD only for a quiet rc=1 response', () => {
    const ordinary = gitRunner(
      { kind: 'ok', rc: 0, stdout: 'git version 2.48.1\n' },
      { kind: 'ok', rc: 0, stdout: 'true\n' },
      { kind: 'exit', rc: 1, stdout: '', stderrEmpty: true },
    );
    const noHead = probeGitSafetyForTest({ run: ordinary.run, platform: 'linux', env: GIT_ENV });
    expect(noHead.detail).toContain('no verifiable Git history checkpoint');

    for (const abnormal of [
      { kind: 'exit', rc: 1, stdout: '', stderrEmpty: false },
      { kind: 'timeout' },
      { kind: 'permission' },
      { kind: 'exit', rc: 2, stdout: '', stderrEmpty: true },
      { kind: 'ok', rc: 0, stdout: 'not-an-oid' },
    ]) {
      const { run } = gitRunner(
        { kind: 'ok', rc: 0, stdout: 'git version 2.48.1\n' },
        { kind: 'ok', rc: 0, stdout: 'true\n' },
        abnormal,
      );
      const result = probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
      expect(result.status).toBe('warn');
      expect(result.detail).toContain('observation is unavailable');
      expect(result.detail).not.toContain('history checkpoint');
    }
  });

  it('uses fixed bounded invocations and a restricted POSIX child environment', () => {
    const { calls, run } = gitRunner(
      { kind: 'ok', rc: 0, stdout: 'git version 2.48.1\n' },
      { kind: 'ok', rc: 0, stdout: 'true\n' },
      { kind: 'ok', rc: 0, stdout: 'b'.repeat(64) },
    );
    probeGitSafetyForTest({ run, platform: 'linux', env: GIT_ENV });
    for (const call of calls) {
      expect(call.command).toBe('git');
      expect(call.cwd).toBe(process.cwd());
      expect(call.shell).toBe(false);
      expect(call.timeoutMs).toBe(2_000);
      expect(call.maxBuffer).toBe(4 * 1024);
      expect(call.env).toMatchObject({
        PATH: '/safe/bin',
        LC_ALL: 'C',
        LANG: 'C',
        GIT_TERMINAL_PROMPT: '0',
        GIT_OPTIONAL_LOCKS: '0',
        GIT_NO_REPLACE_OBJECTS: '1',
        GIT_CONFIG_NOSYSTEM: '1',
      });
      expect(call.env).not.toHaveProperty('IMAGE2_API_KEY');
      expect(call.env).not.toHaveProperty('IMAGE2_BASE_URL');
      expect(call.env).not.toHaveProperty('PPT_FONT_DIR');
      expect(call.env).not.toHaveProperty('GIT_DIR');
    }
  });

  it('canonicalizes Windows path forwarding and filters inherited Git names case-insensitively', () => {
    const { calls, run } = gitRunner({ kind: 'missing' });
    probeGitSafetyForTest({
      run,
      platform: 'win32',
      env: {
        PATH: 'upper-path',
        Path: 'preferred-path',
        pAtH: 'third-path',
        PATHEXT: '.EXE;.CMD',
        SYSTEMROOT: 'C:\\Windows',
        git_dir: 'C:\\private',
        GIT_CONFIG_GLOBAL: 'C:\\private-config',
      },
    });
    const child = calls[0].env;
    expect(Object.keys(child).filter((key) => key.toUpperCase() === 'PATH')).toEqual(['PATH']);
    expect(child.PATH).toBe('preferred-path');
    expect(child).toMatchObject({ PATHEXT: '.EXE;.CMD', SystemRoot: 'C:\\Windows' });
    expect(Object.keys(child).filter((key) => key.toUpperCase() === 'GIT_DIR')).toEqual([]);
    expect(child.GIT_CONFIG_GLOBAL).toBe('\\\\.\\nul');
  });
});

describe('env-check optional Git public wiring', () => {
  const canUsePosixFakeGit = process.platform !== 'win32';

  (canUsePosixFakeGit ? it : it.skip)('shows exactly one advisory Git record without changing READY semantics', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-git-public-'));
    try {
      const bin = join(root, 'bin');
      mkdirSync(bin);
      writeFakeGit(bin, [
        'if [ "$1" = "--version" ]; then echo "git version 2.48.1"; exit 0; fi',
        'if [ "$1" = "rev-parse" ]; then echo "false"; exit 0; fi',
        'exit 2',
      ].join('\n'));
      const env = {
        ...process.env,
        PATH: `${bin}:${process.env.PATH || ''}`,
        IMAGE2_API_KEY: 'test-key',
        IMAGE2_BASE_URL: 'https://example.test/v1',
      };
      const json = execSync(`node ${join(process.cwd(), ENV_CHECK)} --json`, {
        encoding: 'utf8', timeout: 15_000, env,
      });
      const report = JSON.parse(json);
      const gitRecords = report.checks.filter((check) => check.check === 'git');
      expect(gitRecords).toHaveLength(1);
      expect(gitRecords[0]).toMatchObject({ status: 'warn' });
      expect(gitRecords[0]).not.toHaveProperty('foundation');
      expect(report.allPass).toBe(true);

      const direct = execSync(`node ${join(process.cwd(), ENV_CHECK)}`, {
        encoding: 'utf8', timeout: 15_000, env,
      });
      expect(direct).toContain('△ git');
      expect(direct).toContain('READY');

      const doctor = execSync(`node ${join(process.cwd(), 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs')} doctor`, {
        encoding: 'utf8', timeout: 20_000, env,
      });
      expect(doctor).toContain('△ git');
      expect(doctor).toContain('READY');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  (canUsePosixFakeGit ? it : it.skip)('keeps a real hard failure blocking beside a Git warning', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-git-hard-fail-'));
    try {
      const bin = join(root, 'bin');
      mkdirSync(bin);
      writeFakeGit(bin, [
        'if [ "$1" = "--version" ]; then echo "git version 2.48.1"; exit 0; fi',
        'if [ "$1" = "rev-parse" ]; then echo "false"; exit 0; fi',
        'exit 2',
      ].join('\n'));
      let stdout = '';
      let status = 0;
      try {
        stdout = execSync(`node ${join(process.cwd(), ENV_CHECK)} --json --image2`, {
          encoding: 'utf8',
          timeout: 15_000,
          env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH || ''}`,
            IMAGE2_API_KEY: 'test-key',
            IMAGE2_BASE_URL: '',
          },
        });
      } catch (error) {
        status = error.status ?? 1;
        stdout = error.stdout ?? '';
      }
      const report = JSON.parse(stdout);
      expect(status).not.toBe(0);
      expect(report.allPass).toBe(false);
      expect(report.checks.find((check) => check.check === 'git')).toMatchObject({ status: 'warn' });
      expect(report.checks.find((check) => check.check === 'image_base_url')).toMatchObject({ status: 'fail' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('00-env-check', () => {
  it('starts without node_modules and reports package/runtime failures instead of import failure', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'env-no-node-modules-'));
    try {
      let stdout = '';
      let status = 0;
      try {
        stdout = execFileSync('node', [join(process.cwd(), ENV_CHECK), '--json'], {
          cwd,
          encoding: 'utf8',
          timeout: 15_000,
          env: { PATH: process.env.PATH, HOME: process.env.HOME },
        });
      } catch (error) {
        status = error.status ?? 1;
        stdout = error.stdout ?? '';
      }
      expect(status).not.toBe(0);
      const report = JSON.parse(stdout);
      expect(report.checks.find((check) => check.check === 'playwright')).toMatchObject({ status: 'fail' });
      expect(report.checks.find((check) => check.check === 'chromium')).toMatchObject({ status: 'fail' });
      expect(report.checks.find((check) => check.check === 'api_key')).toBeUndefined();
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

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

  it.each([
    ['base', []],
    ['image2', ['--image2']],
    ['smoke', ['--smoke']],
    ['probe-vendors', ['--probe-vendors']],
  ])('emits exactly one parseable JSON document in %s mode', (_mode, modeArgs) => {
    const live = modeArgs.some((arg) => arg === '--smoke' || arg === '--probe-vendors');
    const preload = join(process.cwd(), 'tests', 'helpers', 'fixtures', 'mock_image_probe_fetch.mjs');
    const script = join(process.cwd(), ENV_CHECK);
    const stdout = execFileSync('node', [
      ...(live ? ['--import', preload] : []),
      script,
      '--json',
      ...modeArgs,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...process.env,
        IMAGE2_API_KEY: 'test-only-key',
        IMAGE2_BASE_URL: 'https://json.example/v1',
      },
    });
    const report = JSON.parse(stdout);
    expect(report.checks).toEqual(expect.any(Array));
    expect(stdout.trim().startsWith('{')).toBe(true);
    expect(stdout.trim().endsWith('}')).toBe(true);
  }, 35_000);

  it('checks Node.js version', () => {
    const { stdout } = runCheck('--json');
    const data = JSON.parse(stdout);
    const nodeCheck = data.checks.find(c => c.check === 'nodejs');
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck.foundation).toBe(true);
    expect(nodeCheck.status).toBe('ok');
  });

  it.each([22, 24, 26])('accepts supported Node major %s', (major) => {
    expect(checkNode(`${major}.0.0`).status).toBe('ok');
  });

  it.each([20, 23, 25])('rejects unsupported Node major %s', (major) => {
    expect(checkNode(`${major}.0.0`).status).toBe('fail');
  });

  it('default mode includes HTML runtime checks and omits Image2 presence', () => {
    const { stdout } = runCheck('--json');
    const data = JSON.parse(stdout);
    expect(data.image2).toBe(false);
    expect(data.checks.filter((check) => ['chromium', 'html_fonts', 'html_runtime_smoke'].includes(check.check)).map((check) => check.status)).toEqual(['ok', 'ok', 'ok']);
    expect(data.checks.find((check) => check.check === 'api_key')).toBeUndefined();
    expect(data.checks.find((check) => check.check === 'image_base_url')).toBeUndefined();
    expect(data.checks.find((check) => check.check === 'stage2_generator')).toBeUndefined();
  });

  it('treats in-framework Stage 2 scripts as stage2_generator ok only in Image2 mode', () => {
    const { stdout } = runCheck('--json --image2');
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
      expect(results[0].detail).toBe('installed (ancestor node_modules)');
      expect(results[0].detail).not.toContain(nm);
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

  it('fails a present but mismatched Playwright package', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-playwright-drift-'));
    try {
      const nm = join(root, 'node_modules');
      stubPackages(nm);
      writeFileSync(join(nm, 'playwright', 'package.json'), JSON.stringify({ name: 'playwright', version: '1.60.0' }));
      const playwright = checkNpmPackages(root).find((check) => check.check === 'playwright');
      expect(playwright).toMatchObject({ status: 'fail' });
      expect(playwright.detail).toMatch(/does not match 1\.61\.1/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails a present but mismatched ECharts package and exposes the exact root handoff', () => {
    const root = mkdtempSync(join(tmpdir(), 'env-echarts-drift-'));
    try {
      const nm = join(root, 'node_modules');
      stubPackages(nm);
      writeFileSync(join(nm, 'echarts', 'package.json'), JSON.stringify({ name: 'echarts', version: '6.0.0' }));
      const discovered = discoverNpmPackages(root);
      expect(discovered.checks.find((check) => check.check === 'echarts')).toMatchObject({ status: 'fail' });
      expect(discovered.echarts).toEqual({ root: join(nm, 'echarts'), version: '6.0.0' });
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
        stdout = execSync(`node ${join(process.cwd(), ENV_CHECK)} --json --image2`, {
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

  it('IMAGE2_API_KEY alone satisfies api_key', async () => {
    const prev = process.env.IMAGE2_API_KEY;
    try {
      process.env.IMAGE2_API_KEY = 'test-key';
      const { checkApiKey } = await import(
        '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs'
      );
      const key = checkApiKey();
      expect(key.status).toBe('ok');
      expect(key.detail).toMatch(/IMAGE2_API_KEY/);
    } finally {
      if (prev === undefined) delete process.env.IMAGE2_API_KEY;
      else process.env.IMAGE2_API_KEY = prev;
    }
  });

  it('IMAGE2_BASE_URL alone satisfies image_base_url', async () => {
    const prev = process.env.IMAGE2_BASE_URL;
    try {
      process.env.IMAGE2_BASE_URL = 'https://example.test/v1';
      const { checkBaseUrl } = await import(
        '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs'
      );
      const url = checkBaseUrl();
      expect(url.status).toBe('ok');
      expect(url.detail).toBe('found (IMAGE2_BASE_URL)');
      expect(url.detail).not.toMatch(/example/);
    } finally {
      if (prev === undefined) delete process.env.IMAGE2_BASE_URL;
      else process.env.IMAGE2_BASE_URL = prev;
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
      const { checkImageSmoke } = await import('../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs');
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

  it.each([307, 308, 503])('makes one POST and never follows/retries HTTP %s', async (status) => {
    let calls = 0;
    let options;
    const result = await checkImageSmoke({
      vendors: [{ base_url: 'https://one.example/v1', api_key: 'key-one' }],
      fetchImpl: async (_url, opts) => {
        calls += 1;
        options = opts;
        return { ok: false, status, text: async () => JSON.stringify({ error: 'withheld' }) };
      },
    });
    expect(result.status).toBe('fail');
    expect(calls).toBe(1);
    expect(options).toMatchObject({ method: 'POST', redirect: 'error' });
  });
});

describe('env-check --probe-vendors', () => {
  it('checkProbeVendors reports ok/fail without writing .env', async () => {
    const prevFetch = globalThis.fetch;
    process.env.IMAGE2_API_KEY = 'ok-key';
    process.env.IMAGE2_BASE_URL = 'https://ok.example/v1';
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
      const { checkProbeVendors } = await import('../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs');
      const r = await checkProbeVendors();
      expect(r.check).toBe('image_probe_vendors');
      expect(r.status).toBe('ok');
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].ok).toBe(true);
      expect(r.fix).toBeNull();
    } finally {
      globalThis.fetch = prevFetch;
      delete process.env.IMAGE2_API_KEY;
      delete process.env.IMAGE2_BASE_URL;
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

  it('submits exactly once per injected resolver entry and keeps output secret-safe', async () => {
    const vendors = [
      { base_url: 'https://first.example/v1', api_key: 'SECRET_ONE' },
      { base_url: 'https://second.example/v1', api_key: 'SECRET_TWO' },
      { base_url: 'https://third.example/v1', api_key: 'SECRET_THREE' },
    ];
    const calls = [];
    const logs = [];
    const result = await checkProbeVendors({
      vendors,
      log: (line) => logs.push(line),
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, text: async () => JSON.stringify({ task_id: `task-${calls.length}` }) };
      },
    });
    expect(result.status).toBe('ok');
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.options.method === 'POST' && call.options.redirect === 'error')).toBe(true);
    expect(`${JSON.stringify(result)}${logs.join('\n')}`).not.toMatch(/SECRET_ONE|SECRET_TWO|SECRET_THREE/);
  });

  it.each([
    ['redirect', async () => ({ ok: false, status: 307, text: async () => '' })],
    ['transient 5xx', async () => ({ ok: false, status: 503, text: async () => '{}' })],
    ['network error', async () => { throw new Error('network'); }],
  ])('does not retry a vendor after %s', async (_name, response) => {
    let calls = 0;
    const result = await checkProbeVendors({
      vendors: [{ base_url: 'https://only.example/v1', api_key: 'key' }],
      log: () => {},
      fetchImpl: async (...args) => { calls += 1; return response(...args); },
    });
    expect(result.status).toBe('fail');
    expect(calls).toBe(1);
  });

  it('does not retry after timeout', async () => {
    let calls = 0;
    const result = await checkProbeVendors({
      vendors: [{ base_url: 'https://timeout.example/v1', api_key: 'key' }],
      log: () => {},
      timeoutMs: 10,
      fetchImpl: async (_url, { signal }) => {
        calls += 1;
        return new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
      },
    });
    expect(result.status).toBe('fail');
    expect(result.rows[0].error).toBe('timeout');
    expect(calls).toBe(1);
  });
});
