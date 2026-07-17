#!/usr/bin/env node
/**
 * Zero-dependency environment checker for PPTMAKER_FRAMEWORK.
 *
 * Run this FIRST — it is the hard startup gate. Node.js 18+ and npm are the
 * FOUNDATION. Also checks API key, deps, fonts, and prints a clear READY/NOT READY
 * report.
 *
 * Cross-platform: macOS, Linux, Windows. Node built-in modules only.
 *
 *     node scripts/env-check.mjs           # human-readable
 *     node scripts/env-check.mjs --json    # machine-readable
 *     node scripts/env-check.mjs --smoke   # + live Image2 submit probe (task_id)
 */

import "./lib/cli_bootstrap.mjs?entry=env-check.mjs";
import {
  CLI_ERROR_CODES,
  CLI_JSON_REPORT_SCHEMAS,
  createCliNext,
  emitCliError,
  registerCliJsonReport,
  setCliOutputMode,
} from './lib/cli_error.mjs';

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { devNull, homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IS_WINDOWS = process.platform === 'win32';

// --- Helpers ---

function run(cmd, args = [], timeout = 15) {
  try {
    const stdout = execFileSync(cmd, args, { timeout: timeout * 1000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { rc: 0, stdout: stdout.trim(), stderr: '' };
  } catch (e) {
    if (e.code === 'ENOENT') return { rc: -1, stdout: '', stderr: 'command not found' };
    if (e.killed) return { rc: -2, stdout: '', stderr: 'timed out' };
    return { rc: e.status ?? -1, stdout: (e.stdout ?? '').trim(), stderr: (e.stderr ?? '').trim() };
  }
}

// Git is an optional, user-owned source audit. Keep its bounded child-process
// observation separate from `run()`, which intentionally retains general output.
const GIT_PROBE_TIMEOUT_MS = 2_000;
const GIT_PROBE_MAX_BUFFER = 4 * 1024;
const GIT_VERSION_RE = /^git version (\d+\.\d+\.\d+)(?:\.windows\.\d+| \(Apple Git-\d+\))?\r?\n?$/;
const GIT_HEAD_OID_RE = /^(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/;

function isWindowsPlatform(platformName) {
  return platformName === 'win32';
}

function gitNullDevice(platformName) {
  return isWindowsPlatform(platformName) ? '\\\\.\\nul' : devNull;
}

function readEnvValue(env, requestedKey, { caseInsensitive = false } = {}) {
  if (!env || typeof env !== 'object') return undefined;
  if (!caseInsensitive) return env[requestedKey];
  const wanted = requestedKey.toUpperCase();
  for (const [key, value] of Object.entries(env)) {
    if (key.toUpperCase() === wanted) return value;
  }
  return undefined;
}

function firstWindowsPath(env) {
  // Prefer the conventional spelling when a process has both spellings, then
  // collapse it to one canonical child key.
  const preferred = readEnvValue(env, 'Path');
  if (preferred !== undefined) return preferred;
  const uppercase = readEnvValue(env, 'PATH');
  if (uppercase !== undefined) return uppercase;
  return readEnvValue(env, 'PATH', { caseInsensitive: true });
}

function buildGitChildEnv(sourceEnv = process.env, platformName = process.platform) {
  const windows = isWindowsPlatform(platformName);
  const env = {};

  if (windows) {
    const pathValue = firstWindowsPath(sourceEnv);
    if (typeof pathValue === 'string' && pathValue) env.PATH = pathValue;
    for (const key of ['PATHEXT', 'SystemRoot', 'ComSpec', 'WINDIR']) {
      const value = readEnvValue(sourceEnv, key, { caseInsensitive: true });
      if (typeof value === 'string' && value) env[key] = value;
    }
  } else {
    const pathValue = readEnvValue(sourceEnv, 'PATH');
    if (typeof pathValue === 'string' && pathValue) env.PATH = pathValue;
  }

  // These are the only Git-related values that cross the boundary. Inherited
  // GIT_* variables are deliberately not copied, case-insensitively on Windows.
  Object.assign(env, {
    LC_ALL: 'C',
    LANG: 'C',
    GIT_TERMINAL_PROMPT: '0',
    GIT_OPTIONAL_LOCKS: '0',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: gitNullDevice(platformName),
  });

  return env;
}

function normalizeGitRunnerResult(value) {
  if (!value || typeof value !== 'object') return { kind: 'malformed' };
  const allowedKinds = new Set(['ok', 'missing', 'timeout', 'permission', 'exit', 'malformed']);
  if (!allowedKinds.has(value.kind)) return { kind: 'malformed' };
  const result = { kind: value.kind };
  if (Number.isInteger(value.rc)) result.rc = value.rc;
  if (typeof value.stdout === 'string') result.stdout = value.stdout;
  if (typeof value.stderrEmpty === 'boolean') result.stderrEmpty = value.stderrEmpty;
  return result;
}

function runGitProbeCommand({ command, args, cwd, shell, timeoutMs, maxBuffer, env }) {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      shell,
      timeout: timeoutMs,
      maxBuffer,
      encoding: 'utf-8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { kind: 'ok', rc: 0, stdout: String(stdout) };
  } catch (error) {
    if (error?.code === 'ENOENT') return { kind: 'missing' };
    if (error?.code === 'ETIMEDOUT' || error?.killed) return { kind: 'timeout' };
    if (error?.code === 'EACCES' || error?.code === 'EPERM') return { kind: 'permission' };
    if (Number.isInteger(error?.status)) {
      return {
        kind: 'exit',
        rc: error.status,
        stdout: typeof error.stdout === 'string' ? error.stdout : '',
        stderrEmpty: String(error.stderr ?? '').length === 0,
      };
    }
    return { kind: 'malformed' };
  }
}

function gitCheck(status, detail, fix = null) {
  return { check: 'git', status, detail, fix };
}

function gitUnavailableCheck() {
  return gitCheck(
    'warn',
    'Git safety observation is unavailable for the current invocation directory; deck work can continue.',
    'Git is optional. Retry later if you want user-owned source history and comparison.'
  );
}

function gitUnconfirmedWorktreeCheck() {
  return gitCheck(
    'warn',
    'Current invocation directory is not confirmed as a Git worktree; deck work can continue.',
    'Git is optional. If wanted, choose and confirm a project root for user-owned source history later.'
  );
}

function gitNoHeadCheck() {
  return gitCheck(
    'warn',
    'Current invocation directory has no verifiable Git history checkpoint; deck work can continue.',
    'Git is optional. A first source checkpoint is a user-owned choice, not an environment repair step.'
  );
}

function gitMissingCheck() {
  return gitCheck(
    'warn',
    'Git is optional and is not available; deck work can continue.',
    'Install Git if you want user-owned source history and comparison, then run `git --version`.'
  );
}

function isGitSuccess(result) {
  return result.kind === 'ok' && result.rc === 0;
}

function isExpectedNoHead(result) {
  return result.kind === 'exit'
    && result.rc === 1
    && (result.stdout ?? '').trim() === ''
    && result.stderrEmpty === true;
}

/**
 * Test seam for the isolated Git observation. It accepts only a normalized
 * command runner and returns only the public check record.
 */
function probeGitSafetyForTest({ run: injectedRun, platform: platformName = process.platform, env = process.env } = {}) {
  const runCommand = typeof injectedRun === 'function' ? injectedRun : runGitProbeCommand;
  const childEnv = buildGitChildEnv(env, platformName);
  const invoke = (args) => {
    try {
      return normalizeGitRunnerResult(runCommand({
        command: 'git',
        args,
        cwd: process.cwd(),
        shell: false,
        timeoutMs: GIT_PROBE_TIMEOUT_MS,
        maxBuffer: GIT_PROBE_MAX_BUFFER,
        env: childEnv,
      }));
    } catch {
      return { kind: 'malformed' };
    }
  };

  const version = invoke(['--version']);
  if (version.kind === 'missing') return gitMissingCheck();
  if (!isGitSuccess(version)) return gitUnavailableCheck();

  const versionMatch = GIT_VERSION_RE.exec(version.stdout ?? '');
  if (!versionMatch) return gitUnavailableCheck();

  const worktree = invoke(['rev-parse', '--is-inside-work-tree']);
  if (isGitSuccess(worktree) && (worktree.stdout ?? '').trim() === 'true') {
    const head = invoke(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}']);
    if (isGitSuccess(head) && GIT_HEAD_OID_RE.test((head.stdout ?? '').trim())) {
      return gitCheck(
        'ok',
        `Git ${versionMatch[1]} confirms history for the current invocation directory.`,
        null
      );
    }
    if (isExpectedNoHead(head)) return gitNoHeadCheck();
    return gitUnavailableCheck();
  }

  if (isGitSuccess(worktree) && (worktree.stdout ?? '').trim() === 'false') {
    return gitUnconfirmedWorktreeCheck();
  }
  if (worktree.kind === 'exit') return gitUnconfirmedWorktreeCheck();
  return gitUnavailableCheck();
}

function checkGitSafety() {
  return probeGitSafetyForTest();
}

function loadDotenv(...searchDirs) {
  for (const d of searchDirs) {
    const envFile = join(d, '.env');
    if (!existsSync(envFile)) continue;
    for (const raw of readFileSync(envFile, 'utf-8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const eqIdx = line.indexOf('=');
      let key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (key.startsWith('export ')) key = key.slice(7);
      val = val.replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
    return envFile;
  }
  return null;
}

/**
 * Yield absolute ancestor directories from `start` up to the filesystem root.
 * Shared by .env loading and per-package node_modules walk-up.
 */
function* walkUpDirs(start = process.cwd()) {
  for (let p = resolve(start); ; p = dirname(p)) {
    yield p;
    const parent = dirname(p);
    if (parent === p) break;
  }
}

/**
 * Find the nearest ancestor `node_modules` that contains `pkg`
 * (e.g. `@napi-rs/canvas` → `node_modules/@napi-rs/canvas`).
 * Continues past empty/incomplete local `node_modules` (Node-like).
 * @returns {string|null} absolute path to the matching `node_modules` dir
 */
function findPackageInAncestorNodeModules(pkg, start = process.cwd()) {
  const parts = pkg.split('/');
  for (const dir of walkUpDirs(start)) {
    const nm = join(dir, 'node_modules');
    if (existsSync(join(nm, ...parts))) return nm;
  }
  return null;
}

export { loadDotenv, walkUpDirs, findPackageInAncestorNodeModules };

// --- Checks ---

function checkNode() {
  const v = process.versions.node.split('.').map(Number);
  const ok = v[0] >= 18;
  const winFix = 'Windows: install from https://nodejs.org (LTS), or `winget install OpenJS.NodeJS.LTS`';
  const unixFix = 'macOS: `brew install node@20`. Linux: use your package manager or https://nodejs.org';
  return {
    check: 'nodejs',
    foundation: true,
    status: ok ? 'ok' : 'fail',
    detail: `Node.js ${process.versions.node}`,
    fix: ok ? null : `Need Node.js 18+. ${IS_WINDOWS ? winFix : unixFix}`,
  };
}

function checkNpm() {
  const { rc, stdout } = run('npm', ['--version']);
  const ok = rc === 0;
  const winFix = 'npm ships with Node.js — reinstall Node.js from https://nodejs.org';
  const unixFix = 'npm ships with Node.js — reinstall Node.js';
  return {
    check: 'npm',
    foundation: true,
    status: ok ? 'ok' : 'fail',
    detail: ok ? `npm ${stdout}` : 'not found',
    fix: ok ? null : `npm not found. ${IS_WINDOWS ? winFix : unixFix}`,
  };
}

function checkApiKey() {
  const key = process.env.IMAGE2_API_KEY || '';
  const ok = Boolean(key);
  return {
    check: 'api_key',
    status: ok ? 'ok' : 'fail',
    detail: ok ? 'found (IMAGE2_API_KEY)' : 'not set',
    fix: ok ? null : (
      'Stage 2 (image generation) needs a key. Put it in .env (loaded automatically):\n' +
      '  IMAGE2_API_KEY=sk-...'
    ),
  };
}

function checkBaseUrl() {
  const url = (process.env.IMAGE2_BASE_URL || '').trim();
  const ok = Boolean(url);
  return {
    check: 'image_base_url',
    status: ok ? 'ok' : 'fail',
    detail: ok ? `set (${url})` : 'not set',
    fix: ok ? null : (
      'Image API base URL is required. Put it in .env:\n' +
      '  IMAGE2_BASE_URL=https://your-relay/v1'
    ),
  };
}

function checkFonts() {
  const bundled = join(resolve(__dirname, 'fonts'));
  const searchDirs = [
    bundled,
    '/Library/Fonts', join(homedir(), 'Library', 'Fonts'),
    '/usr/share/fonts', join(homedir(), '.fonts'),
    join(homedir(), '.local', 'share', 'fonts'),
    'C:/Windows/Fonts',
  ];
  const envDir = process.env.PPT_FONT_DIR;
  if (envDir) searchDirs.unshift(envDir);

  let found = false;
  for (const d of searchDirs) {
    try {
      const files = readdirSync(d, { recursive: true });
      if (files.some(f => f.includes('SourceSansPro') && f.endsWith('.otf'))) { found = true; break; }
    } catch {}
  }

  return {
    check: 'fonts',
    status: found ? 'ok' : 'warn',
    detail: found ? 'Source Sans Pro available' : 'Source Sans Pro not found — Stage 3 will use a readable fallback sans',
    fix: found ? null : 'Optional. Drop SourceSansPro-*.otf into scripts/fonts/ (or set PPT_FONT_DIR).',
  };
}

function checkNpmPackages(start = process.cwd()) {
  const pkgs = [
    { importName: '@napi-rs/canvas', pkg: '@napi-rs/canvas', required: true },
    { importName: 'pptxgenjs', pkg: 'pptxgenjs', required: true },
    { importName: 'commander', pkg: 'commander', required: true },
  ];

  return pkgs.map(({ importName, pkg, required }) => {
    const nm = findPackageInAncestorNodeModules(importName, start);
    const ok = nm != null;
    return {
      check: pkg,
      status: ok ? 'ok' : (required ? 'fail' : 'warn'),
      detail: ok ? `installed (via ${nm})` : 'not installed',
      fix: ok ? null : 'Run `npm install` in the project root.',
    };
  });
}

export { checkNpmPackages };

function checkStage2Generator() {
  // In-framework Node Stage 2 — no external skills.
  const scriptPath = join(__dirname, 'stage2_generate_images.mjs');
  const contactPath = join(__dirname, 'make_contact_sheet.mjs');
  const clientPath = join(__dirname, 'image_api_client.mjs');
  const ok = existsSync(scriptPath) && existsSync(contactPath) && existsSync(clientPath);
  return {
    check: 'stage2_generator',
    status: ok ? 'ok' : 'fail',
    detail: ok
      ? 'in-framework (stage2_generate_images.mjs + make_contact_sheet.mjs)'
      : 'missing in-framework Stage 2 scripts under PPTMAKER_FRAMEWORK/scripts/',
    fix: ok ? null : (
      'Stage 2 must ship inside the framework as Node ESM.\n' +
      '  Expected: scripts/stage2_generate_images.mjs, make_contact_sheet.mjs, image_api_client.mjs\n' +
      '  External skills / Python / bash are not allowed.\n' +
      '  Then re-run: node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor'
    ),
  };
}

function checkDiskSpaceSync() {
  try {
    if (IS_WINDOWS) {
      const { stdout } = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8', timeout: 5000 });
      const match = stdout.match(/C:\s+\d+\s+(\d+)/);
      if (match) {
        const freeMb = Math.floor(Number(match[1]) / (1024 * 1024));
        return {
          check: 'disk_space', status: freeMb > 200 ? 'ok' : 'warn',
          detail: `${freeMb} MB free`,
          fix: freeMb > 200 ? null : `Only ${freeMb} MB free. Image generation needs ~200 MB.`,
        };
      }
    }
    const { stdout } = execSync('df -m .', { encoding: 'utf-8', timeout: 5000 });
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const cols = lines[1].split(/\s+/);
      const freeMb = Number(cols[3]);
      if (!isNaN(freeMb)) {
        return {
          check: 'disk_space', status: freeMb > 200 ? 'ok' : 'warn',
          detail: `${freeMb} MB free`,
          fix: freeMb > 200 ? null : `Only ${freeMb} MB free. Image generation needs ~200 MB.`,
        };
      }
    }
  } catch {}
  return { check: 'disk_space', status: 'ok', detail: 'could not check (skipping)', fix: null };
}

// --- Runner ---

function runAllChecks() {
  // Load .env from cwd/parents first (same walk-up helper as deps)
  for (const p of walkUpDirs()) {
    if (existsSync(join(p, '.env'))) { loadDotenv(p); break; }
  }

  const results = [
    checkNode(),
    checkNpm(),
    checkApiKey(),
    checkBaseUrl(),
    ...checkNpmPackages(),
    checkStage2Generator(),
    checkFonts(),
    checkDiskSpaceSync(),
    checkGitSafety(),
  ];

  const allPass = results.every(r => r.status !== 'fail');
  return { results, allPass };
}

/**
 * Minimal live Image2 probe against first resolveVendors() entry.
 * Success = extractImageRef OR task id (same as client).
 * @returns {Promise<{check:string,status:string,detail:string,fix:string|null}>}
 */
async function checkImageSmoke() {
  try {
    const {
      resolveVendors,
      extractImageRef,
      extractTaskId,
      DEFAULT_MODEL,
      providerHost,
    } = await import('./image_api_client.mjs');
    const vendors = resolveVendors();
    const { base_url: base, api_key: key } = vendors[0];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let resp;
    try {
      resp = await fetch(`${base}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: 'env-check smoke: solid mid-gray square, no text',
          n: 1,
          size: '1024x1024',
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const text = await resp.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        check: 'image_smoke',
        status: 'fail',
        detail: `non-JSON response (${resp.status})`,
        fix: 'Check IMAGE2_BASE_URL points at an Image2-compatible /v1 relay.',
      };
    }
    if (!resp.ok) {
      return {
        check: 'image_smoke',
        status: 'fail',
        detail: `HTTP ${resp.status} from ${providerHost(base) || 'provider'} (response body withheld)`,
        fix: 'Verify IMAGE2_API_KEY and IMAGE2_BASE_URL; re-run doctor --smoke.',
      };
    }
    const syncRef = extractImageRef(data);
    const taskId = extractTaskId(data);
    if (syncRef) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit ok (sync image from ${providerHost(base) || 'provider'})`,
        fix: null,
      };
    }
    if (taskId) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit ok (async task accepted by ${providerHost(base) || 'provider'})`,
        fix: null,
      };
    }
    return {
      check: 'image_smoke',
      status: 'fail',
      detail: `provider response omitted both image ref and task id (${providerHost(base) || 'provider'})`,
      fix: 'Relay submit contract unexpected; see _lessons/ and image_api_client unwrap rules.',
    };
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'timed out after 30s' : 'provider request failed before a valid response';
    return {
      check: 'image_smoke',
      status: 'fail',
      detail: msg,
      fix: 'Fix credentials/network, then: node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --smoke',
    };
  }
}

/**
 * Probe every resolveVendors() entry; print human report; return aggregate check.
 * Does not write .env.
 * @returns {Promise<{check:string,status:string,detail:string,fix:string|null,rows?:object[]}>}
 */
async function checkProbeVendors() {
  const {
    resolveVendors,
    extractImageRef,
    extractTaskId,
    DEFAULT_MODEL,
    HEARTBEAT_MS,
    providerHost,
  } = await import('./image_api_client.mjs');

  let vendors;
  try {
    vendors = resolveVendors();
  } catch (err) {
    return {
      check: 'image_probe_vendors',
      status: 'fail',
      detail: 'provider configuration could not be resolved',
      fix: 'Fix IMAGE2_API_KEY and IMAGE2_BASE_URL, then re-run doctor --probe-vendors',
    };
  }

  /** @type {{ base_url: string, ok: boolean, mode: string, elapsed_s: number, error: string|null, key_env?: string|null }[]} */
  const rows = [];
  const n = vendors.length;

  for (let i = 0; i < n; i += 1) {
    const { base_url: base, api_key: key } = vendors[i];
    const idx = i + 1;
    const host = providerHost(base) || 'provider';
    console.log(`  probing ${idx}/${n} → ${host}`);
    const started = Date.now();
    let lastHb = started;
    const controller = new AbortController();
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastHb >= HEARTBEAT_MS) {
        const elapsedSec = Math.floor((now - started) / 1000);
        console.log(`  … still waiting vendor=${host} phase=submit elapsed=${elapsedSec}s`);
        lastHb = now;
      }
    }, Math.min(1_000, HEARTBEAT_MS));
    const hardTimeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const resp = await fetch(`${base}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: 'env-check probe: solid mid-gray square, no text',
          n: 1,
          size: '1024x1024',
        }),
        signal: controller.signal,
      });
      const text = await resp.text();
      const elapsed_s = Math.round(((Date.now() - started) / 1000) * 10) / 10;
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        rows.push({
          base_url: base,
          ok: false,
          mode: 'unknown',
          elapsed_s,
          error: `non-JSON (${resp.status})`,
        });
        console.log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  non-JSON`);
        continue;
      }
      if (!resp.ok) {
        const err = `http_error:${resp.status}`;
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        console.log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${err}`);
        continue;
      }
      const syncRef = extractImageRef(data);
      const taskId = extractTaskId(data);
      if (syncRef) {
        rows.push({ base_url: base, ok: true, mode: 'sync', elapsed_s, error: null });
        console.log(`  [${idx}/${n}] OK    sync  ${elapsed_s}s  ${host}`);
      } else if (taskId) {
        rows.push({ base_url: base, ok: true, mode: 'async', elapsed_s, error: null });
        console.log(`  [${idx}/${n}] OK    async  ${elapsed_s}s  ${host}`);
      } else {
        const err = 'missing_image_or_task';
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        console.log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${err}`);
      }
    } catch (err) {
      const elapsed_s = Math.round(((Date.now() - started) / 1000) * 10) / 10;
      const msg = err?.name === 'AbortError' ? 'timeout' : 'network_error';
      rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: msg });
      console.log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${msg}`);
    } finally {
      clearInterval(timer);
      clearTimeout(hardTimeout);
    }
  }

  const okRows = rows.filter((r) => r.ok).sort((a, b) => a.elapsed_s - b.elapsed_s);
  const failRows = rows.filter((r) => !r.ok);
  console.log('');
  console.log('  --- Summary ---');
  console.log(`  OK:   ${okRows.map((r) => `${r.base_url} (${r.elapsed_s}s ${r.mode})`).join(', ') || '(none)'}`);
  console.log(`  FAIL: ${failRows.map((r) => `${r.base_url} (${r.error})`).join(', ') || '(none)'}`);

  const anyOk = okRows.length > 0;
  const okList = okRows.map((r) => r.base_url).join(', ');
  console.log('');
  console.log('  --- Result ---');
  if (anyOk) {
    console.log(`  OK: ${okList}`);
  } else {
    console.log('  FAIL: check IMAGE2_API_KEY and IMAGE2_BASE_URL');
  }

  return {
    check: 'image_probe_vendors',
    status: anyOk ? 'ok' : 'fail',
    detail: anyOk
      ? `provider OK (${okRows[0].elapsed_s}s ${okRows[0].mode})`
      : 'provider check failed',
    fix: anyOk
      ? null
      : 'Check IMAGE2_API_KEY and IMAGE2_BASE_URL, then re-run doctor --probe-vendors.',
    rows,
  };
}

export {
  runAllChecks,
  checkImageSmoke,
  checkProbeVendors,
  checkApiKey,
  checkBaseUrl,
  probeGitSafetyForTest,
};

function formatText(results, allPass) {
  const lines = [];
  const platformName = IS_WINDOWS ? 'Windows' : process.platform;
  lines.push('='.repeat(56));
  lines.push('  PPTMAKER_FRAMEWORK Environment Check');
  lines.push(`  Platform: ${platformName}`);
  lines.push('='.repeat(56));
  lines.push('');

  const foundation = results.filter(r => r.foundation);
  const foundationOk = foundation.every(r => r.status === 'ok');

  for (const r of results) {
    const icon = { ok: '✓', warn: '△', fail: '✗' }[r.status];
    const tag = r.foundation ? '  [FOUNDATION]' : '';
    lines.push(`  ${icon} ${r.check}${tag}: ${r.detail}`);
    if (r.fix) {
      lines.push(`    → ${r.fix}`);
      lines.push('');
    }
  }

  lines.push('');
  const warns = results.filter(r => r.status === 'warn').length;
  const stage2Missing = results.some(r => r.check === 'stage2_generator' && r.status !== 'ok');

  if (!foundationOk) {
    lines.push('  ⛔ FOUNDATION NOT READY — Node.js 18+ and npm must be set up FIRST.');
    lines.push('     Fix the [FOUNDATION] items above, then re-run.');
  } else if (allPass) {
    if (warns) {
      lines.push(`  ✓  READY — foundation OK, no blockers. ${warns} advisory warning(s) above.`);
    } else {
      lines.push('  ✓  READY — all checks passed.');
      lines.push('  You can now start building decks.');
    }
  } else if (stage2Missing) {
    lines.push('  ✗  NOT READY — in-framework Stage 2 scripts missing (hard requirement).');
    lines.push('     Restore scripts/stage2_generate_images.mjs (+ contact sheet + image client), then re-run doctor.');
  } else {
    lines.push('  ✗  NOT READY — foundation is fine, but a hard requirement failed. Fix those and re-run.');
  }

  return lines.join('\n');
}

// --- Main ---

async function main() {
  const wantSmoke = process.argv.includes('--smoke');
  const wantProbe = process.argv.includes('--probe-vendors');
  const wantJson = process.argv.includes('--json');
  if (wantJson) setCliOutputMode('json');

  if (wantSmoke && wantProbe) {
    console.error(
      'Usage: pass only one of --smoke or --probe-vendors (mutually exclusive).'
    );
    emitCliError({
      code: CLI_ERROR_CODES.USAGE,
      message: '--smoke and --probe-vendors are mutually exclusive.',
      hint: 'Choose the single live provider check that matches the task.',
      where: 'env-check.arguments',
      diagnostic: {
        version: 1,
        category: 'usage',
        operation: 'parse-arguments',
        next: createCliNext('fix_arguments', { default: 'Use --smoke for the first-vendor gate or --probe-vendors for the full channel report, not both.' }),
      },
    });
    process.exit(1);
  }

  const { results } = runAllChecks();

  if (wantSmoke || wantProbe) {
    const keyOk = results.find((r) => r.check === 'api_key')?.status === 'ok';
    const urlOk = results.find((r) => r.check === 'image_base_url')?.status === 'ok';
    if (keyOk && urlOk) {
      if (wantProbe) {
        results.push(await checkProbeVendors());
      } else {
        results.push(await checkImageSmoke());
      }
    } else {
      results.push({
        check: wantProbe ? 'image_probe_vendors' : 'image_smoke',
        status: 'fail',
        detail: 'skipped — api_key or image_base_url missing',
        fix: 'Set IMAGE2_API_KEY and IMAGE2_BASE_URL, then re-run',
      });
    }
  }

  const allPass = results.every((r) => r.status !== 'fail');
  const foundationOk = results.filter((r) => r.foundation).every((r) => r.status === 'ok');

  const report = {
    allPass,
    foundationOk,
    checks: results,
    smoke: wantSmoke,
    probeVendors: wantProbe,
  };
  if (wantJson) {
    registerCliJsonReport(report, { schema: CLI_JSON_REPORT_SCHEMAS.ENV_CHECK });
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatText(results, allPass));
  }

  if (!allPass) {
    const failed = results.filter((result) => result.status === 'fail');
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: `Environment check found ${failed.length} blocking requirement(s).`,
      hint: 'Repair the named local prerequisites, then rerun doctor.',
      where: 'env-check.results',
      diagnostic: {
        version: 1,
        category: 'environment',
        operation: wantProbe ? 'probe-vendors' : wantSmoke ? 'smoke' : 'check',
        issues: failed.map((result) => ({
          message: `${result.check} is not ready`,
          subject: { kind: 'environment_check', id: result.check },
          reason: { kind: 'check_failed', actual: result.status, expected: 'ok' },
        })),
        next: createCliNext('repair_environment', {
          invocation: { program: 'node', args: [__filename, ...(wantJson ? ['--json'] : []), ...(wantSmoke ? ['--smoke'] : []), ...(wantProbe ? ['--probe-vendors'] : [])] },
          default: 'Repair the failed environment checks without exposing credential values, then rerun.',
        }),
      },
    });
  }

  process.exit(allPass ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  (resolve(process.argv[1]) === __filename ||
    process.argv[1].endsWith('/env-check.mjs') ||
    process.argv[1].endsWith('\\env-check.mjs'));
if (isMain) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "env-check" });
  if (process.argv.includes("--help")) {
    console.log("Usage: node env-check.mjs [--json] [--smoke] [--probe-vendors]");
    process.exit(0);
  }
  main().catch((err) => {
    console.error(`✗ env-check failed: ${err.message}`);
    emitCliError({ code: CLI_ERROR_CODES.UNCAUGHT, message: 'Environment check failed unexpectedly.', hint: 'Inspect the environment checker implementation without exposing local values.', where: 'env-check.main', diagnostic: { version: 1, category: 'internal', operation: 'check', next: createCliNext('report_internal', { default: 'Inspect env-check.mjs and report the unexpected checker failure.' }) } });
    process.exit(1);
  });
}
