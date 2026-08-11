/**
 * Zero-dependency environment checker for ppt_maker_harness.
 *
 * Run this FIRST — it is the hard startup gate. Supported Node.js and npm are
 * the FOUNDATION. It reports Page Image readiness for the requested
 * operation; local Framed composition is the default and is provider-free.
 *
 * Cross-platform: macOS, Linux, Windows. Node built-in modules only.
 *
 *     node scripts/00-setup/env-check.mjs           # human-readable
 *     node scripts/00-setup/env-check.mjs --json    # machine-readable
 *     node scripts/00-setup/env-check.mjs --operation raw-generation
 *     node scripts/00-setup/env-check.mjs --smoke   # + live Image2 submit probe (task_id)
 */

import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  CLI_JSON_REPORT_SCHEMAS,
  createCliNext,
  emitCliError,
  registerCliJsonReport,
  setCliOutputMode,
} from '../../shared/cli/cli_error.mjs';
import { HTML_RUNTIME_PROFILE } from './html_runtime_profile.mjs';
import { normalizeImage2BaseUrl } from '../../shared/image2/credentials.mjs';

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { devNull, homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_CHECK_CLI = 'ppt_maker_harness/scripts/00-setup/env-check.mjs';
const IS_WINDOWS = process.platform === 'win32';
const SMOKE_CONNECTIVITY_ONLY_EVIDENCE = 'connectivity-only evidence; production prompt fit, requested or returned media dimensions, decoded media, async completion, and run authorization are not verified';

export const COMMON_CHECK_NAMES = Object.freeze([
  'nodejs', 'npm', '@napi-rs/canvas', 'pptxgenjs', 'commander', 'fonts', 'disk_space', 'git',
]);
export const HTML_CHECK_NAMES = Object.freeze(['playwright', 'chromium', 'html_fonts', 'framed_render_profile', 'html_runtime_smoke']);
export const HTML_PACKAGE_CHECK_NAMES = Object.freeze(['playwright']);
// BASE_CHECK_NAMES is intentionally in runtime-emission order (not common-first)
// so the emitted check stream matches documented/expected ordering.
export const BASE_CHECK_NAMES = Object.freeze([
  'nodejs', 'npm', '@napi-rs/canvas', 'pptxgenjs', 'commander', 'playwright',
  'chromium', 'html_fonts', 'framed_render_profile', 'html_runtime_smoke', 'fonts', 'disk_space', 'git',
]);
export const IMAGE2_CHECK_NAMES = Object.freeze(['api_key', 'image_base_url', 'page_image_raw_generator']);
export const LIVE_CHECK_NAMES = Object.freeze(['image_smoke', 'image_probe_vendors']);
export const DOCTOR_MODES = Object.freeze(['image2-page-workflow']);
export const PAGE_IMAGE_DOCTOR_PROFILES = Object.freeze(['framed-runtime', 'image2-raw']);
export const PAGE_IMAGE_DOCTOR_OPERATIONS = Object.freeze([
  'framed-local-refresh',
  'raw-generation',
  'image2-raw',
  'full-build',
  'assembly-notes',
]);

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

function checkNode(nodeVersion = process.versions.node) {
  const major = Number.parseInt(String(nodeVersion).split('.')[0], 10);
  const ok = HTML_RUNTIME_PROFILE.supportedNodeMajors.includes(major);
  const winFix = 'Windows: install from https://nodejs.org (LTS), or `winget install OpenJS.NodeJS.LTS`';
  const unixFix = 'macOS: `brew install node@24`. Linux: install Node.js 24 LTS from your package manager or https://nodejs.org';
  return {
    check: 'nodejs',
    foundation: true,
    status: ok ? 'ok' : 'fail',
    detail: `Node.js ${nodeVersion} (supported majors: 22, 24, 26)`,
    fix: ok ? null : `Need Node.js 22.x, 24.x, or 26.x (24.x recommended). ${IS_WINDOWS ? winFix : unixFix}`,
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
    fix: ok ? null : 'Set IMAGE2_API_KEY in the deck or project .env, then rerun the selected raw-generation readiness check.',
  };
}

function checkBaseUrl() {
  const url = (process.env.IMAGE2_BASE_URL || '').trim();
  if (!url) {
    return {
      check: 'image_base_url',
      status: 'fail',
      detail: 'not set',
      fix: (
        'Image API base URL is required. Put it in .env:\n' +
        '  IMAGE2_BASE_URL=https://your-relay/v1'
      ),
    };
  }
  try {
    normalizeImage2BaseUrl(url);
  } catch {
    return {
      check: 'image_base_url',
      status: 'fail',
      detail: 'invalid (IMAGE2_BASE_URL must name one endpoint)',
      fix: 'Set IMAGE2_BASE_URL to one valid endpoint; comma-separated endpoint lists are not supported.',
    };
  }
  return {
    check: 'image_base_url',
    status: 'ok',
    detail: 'found (IMAGE2_BASE_URL)',
    fix: null,
  };
}

function checkFonts() {
  const bundled = resolve(__dirname, '..', '..', 'fonts');
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
    detail: found ? 'Source Sans Pro available' : 'Source Sans Pro not found — Framed composition will use a readable fallback sans',
    fix: found ? null : 'Optional. Drop SourceSansPro-*.otf into scripts/fonts/ (or set PPT_FONT_DIR).',
  };
}

import { discoverNpmPackages } from './npm_packages.mjs';

function checkNpmPackages(start = process.cwd()) {
  return discoverNpmPackages(start).checks;
}

export { checkNode, checkNpmPackages, discoverNpmPackages };

function checkPageImageRawGenerator() {
  const root = resolve(__dirname, '..', '..');
  const required = [
    '03-framed-image/index.mjs',
    '04-pure-image/index.mjs',
    'shared/image2/page_image_target_runtime.mjs',
  ];
  const missing = required.filter((name) => !existsSync(join(root, name)));
  const ok = missing.length === 0;
  return {
    check: 'page_image_raw_generator',
    status: ok ? 'ok' : 'fail',
    detail: ok
      ? 'receipt-bound Page Image raw compiler and evidence owners are present'
      : `missing Page Image raw owner(s): ${missing.join(', ')}`,
    fix: ok ? null : 'Restore the current Framed/Pure raw owners and their shared target runtime under scripts/.',
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

function unavailableHtmlRuntimeChecks(reason) {
  return [
    {
      check: 'chromium', status: 'fail', detail: `not checked (${reason})`,
      fix: 'Run `npm install`, then `npm run setup:chromium` in the project root.',
    },
    {
      check: 'html_fonts', status: 'fail', detail: `not checked (${reason})`,
      fix: 'Restore the complete ppt_maker_harness package, including scripts/fonts/.',
    },
    {
      check: 'framed_render_profile', status: 'fail', detail: `not checked (${reason})`,
      fix: 'Repair the Framed runtime, font inventory, and capture-profile owners, then rerun doctor.',
    },
    {
      check: 'html_runtime_smoke', status: 'fail', detail: `not checked (${reason})`,
      fix: 'Repair the preceding local runtime checks, then rerun doctor.',
    },
  ];
}

function framedProfileFacts(profile) {
  if (!profile || typeof profile !== 'object' ||
    typeof profile.schema !== 'string' ||
    typeof profile.render_profile_digest !== 'string' ||
    !profile.runtime || !profile.font_render_inventory || !profile.capture) {
    throw new Error('Framed profile shape is invalid');
  }
  return Object.freeze({
    schema: profile.schema,
    render_profile_digest: profile.render_profile_digest,
    runtime: Object.freeze({ ...profile.runtime }),
    font_render_inventory: Object.freeze({ ...profile.font_render_inventory }),
    capture: Object.freeze({ ...profile.capture }),
  });
}

async function checkFramedRenderProfile(runtime) {
  try {
    // Keep the direct doctor pre-install-safe: this production owner is loaded
    // only after the package-backed browser and font prerequisites have passed.
    const { currentFramedHeaderOverlayRenderProfile } = await import('../../03-framed-image/internal/framed_render_profile.mjs');
    const profile = framedProfileFacts(currentFramedHeaderOverlayRenderProfile());
    if (profile.runtime.id !== runtime.profile ||
      profile.runtime.playwright_version !== runtime.playwright?.version ||
      profile.runtime.chromium_revision !== runtime.chromium?.revision ||
      profile.runtime.chromium_browser_version !== runtime.chromium?.browserVersion) {
      throw new Error('Framed profile does not match the verified pinned runtime');
    }
    return {
      check: 'framed_render_profile',
      status: 'ok',
      detail: `canonical Framed profile ${profile.render_profile_digest.slice(0, 12)} is ready (runtime ${profile.runtime.id}, font inventory ${profile.font_render_inventory.digest.slice(0, 12)}, capture ${profile.capture.id})`,
      fix: null,
      profile,
    };
  } catch {
    return {
      check: 'framed_render_profile',
      status: 'fail',
      detail: 'canonical Framed runtime, font inventory, or capture profile is unavailable or inconsistent',
      fix: 'Repair the Framed runtime, font inventory, and capture-profile owners, then rerun doctor.',
    };
  }
}

async function checkHtmlRuntime(playwright) {
  const { inspectHtmlRuntime, runHtmlRuntimeSmoke } = await import('./html_runtime.mjs');
  const { verifyHtmlFontBundle } = await import('./html_fonts.mjs');
  const runtime = await inspectHtmlRuntime({
    playwrightRoot: playwright.root,
    playwrightVersion: playwright.version,
  });
  const fontEvidence = verifyHtmlFontBundle();
  const chromium = {
    check: 'chromium',
    status: runtime.ok ? 'ok' : 'fail',
    detail: runtime.ok
      ? `paired Chromium ${runtime.chromium.browserVersion} (revision ${runtime.chromium.revision}) installed`
      : (runtime.error === 'paired_chromium_missing' ? 'paired Chromium is not installed' : 'Playwright/Chromium profile mismatch'),
    fix: runtime.ok ? null : 'Run `npm run setup:chromium` in the project root; doctor never installs a browser.',
  };
  const htmlFonts = {
    check: 'html_fonts',
    status: fontEvidence.ok ? 'ok' : 'fail',
    detail: fontEvidence.ok
      ? `${fontEvidence.fontFiles} bundled WOFF2 files; fixed bilingual corpus coverage verified`
      : 'bundled font inventory, files, CSS, coverage, or legal material is invalid',
    fix: fontEvidence.ok ? null : 'Restore the complete PPT Maker Harness package under ppt_maker_harness/scripts/fonts/.',
  };
  const framedRenderProfile = runtime.ok && fontEvidence.ok
    ? await checkFramedRenderProfile(runtime)
    : {
      check: 'framed_render_profile', status: 'fail',
      detail: 'not checked because Chromium or bundled fonts are not ready',
      fix: 'Repair chromium and html_fonts first, then rerun doctor.',
    };

  let smoke;
  if (runtime.ok && fontEvidence.ok && framedRenderProfile.status === 'ok') {
    const evidence = await runHtmlRuntimeSmoke({ runtimeEvidence: runtime });
    smoke = {
      check: 'html_runtime_smoke',
      status: evidence.ok ? 'ok' : 'fail',
      detail: evidence.ok
        ? `offline Chromium smoke passed (network=0, custom Latin/Han fonts, ${evidence.viewport.width}x${evidence.viewport.height} fixture)`
        : `offline Chromium smoke failed during ${evidence.phase ?? 'unknown phase'}`,
      fix: evidence.ok ? null : 'Repair Chromium/font assets, then rerun doctor; no installer or network fallback is used.',
    };
  } else {
    smoke = {
      check: 'html_runtime_smoke', status: 'fail',
      detail: 'not run because Chromium, bundled fonts, or the canonical Framed profile are not ready',
      fix: 'Repair chromium, html_fonts, and framed_render_profile first, then rerun doctor.',
    };
  }
  return [chromium, htmlFonts, framedRenderProfile, smoke];
}

function fallbackProviderDiagnostics() {
  let baseUrl = '';
  try {
    baseUrl = normalizeImage2BaseUrl(process.env.IMAGE2_BASE_URL || '');
  } catch {
    // The caller's image_base_url check owns the bounded malformed-config result.
  }
  const apiKey = String(process.env.IMAGE2_API_KEY || '');
  return {
    async inspect() { return { vendors: baseUrl && apiKey ? [{ base_url: baseUrl, api_key: apiKey }] : [], model: 'gpt-image-2', heartbeat_ms: 1_000 }; },
    async defaults() { return { model: 'gpt-image-2', heartbeat_ms: 1_000 }; },
    async classify(data) { return { image_ref: data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.url || null, task_id: data?.task_id || data?.data?.[0]?.task_id || null }; },
    async host(base) { try { return new URL(base).host; } catch { return null; } },
  };
}

function providerDiagnostics(value) {
  return value || fallbackProviderDiagnostics();
}

async function runAllChecks({ includeImage2 = false, profile = 'common+html', start = process.cwd(), providerApi = null } = {}) {
  // Load .env from cwd/parents first (same walk-up helper as deps)
  for (const p of walkUpDirs(start)) {
    if (existsSync(join(p, '.env'))) { loadDotenv(p); break; }
  }

  const framedRuntime = ['page-image-framed', 'page-image-full', 'page-image-unbound'].includes(profile);
  const includeHtml = profile === 'common+html' || framedRuntime;
  const pageImageRaw = ['page-image-raw', 'page-image-full', 'page-image-unbound'].includes(profile);
  const node = checkNode();
  const npm = checkNpm();
  const packages = discoverNpmPackages(start);
  // Raw-only work does not require the local Framed browser runtime.
  const packageChecks = includeHtml
    ? packages.checks
    : packages.checks.filter((check) => !HTML_PACKAGE_CHECK_NAMES.includes(check.check));
  const selectedPackageChecks = packageChecks;
  const results = [
    node,
    npm,
    ...selectedPackageChecks,
    checkFonts(),
    checkDiskSpaceSync(),
    checkGitSafety(),
  ];

  if (includeHtml) {
    const npmBackedReady = node.status === 'ok'
      && npm.status === 'ok'
      && selectedPackageChecks.every((check) => check.status === 'ok')
      && packages.playwright?.version === HTML_RUNTIME_PROFILE.playwrightVersion;
    const runtimeChecks = npmBackedReady
      ? await checkHtmlRuntime(packages.playwright)
      : unavailableHtmlRuntimeChecks('npm-backed prerequisites are not ready');
    results.splice(2 + selectedPackageChecks.length, 0, ...runtimeChecks);
  }

  if (includeImage2) {
    const apiKey = checkApiKey();
    const baseUrl = checkBaseUrl();
    const generator = checkPageImageRawGenerator();
    results.push(apiKey, baseUrl, generator);
  }

  const allPass = results.every(r => r.status !== 'fail');
  return { results, allPass };
}

/**
 * Minimal live Image2 probe against first resolveVendors() entry.
 * Success = extractImageRef OR task id (same as client).
 * @returns {Promise<{check:string,status:string,detail:string,fix:string|null}>}
 */
export async function checkImageSmoke({ vendors: injectedVendors, fetchImpl = globalThis.fetch, providerApi = null } = {}) {
  try {
    const diagnostics = providerDiagnostics(providerApi);
    const provider = injectedVendors ? await diagnostics.defaults() : await diagnostics.inspect();
    const vendors = injectedVendors ?? provider.vendors;
    const { base_url: base, api_key: key } = vendors[0];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let resp;
    try {
      resp = await fetchImpl(`${base}/images/generations`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
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
        detail: `HTTP ${resp.status} from ${await diagnostics.host(base) || 'provider'} (response body withheld)`,
        fix: 'Verify IMAGE2_API_KEY and IMAGE2_BASE_URL; re-run doctor --smoke.',
      };
    }
    const classified = await diagnostics.classify(data);
    const syncRef = classified.image_ref;
    const taskId = classified.task_id;
    if (syncRef) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit accepted (sync image reference from ${await diagnostics.host(base) || 'provider'}; ${SMOKE_CONNECTIVITY_ONLY_EVIDENCE})`,
        fix: null,
      };
    }
    if (taskId) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit accepted (async task identifier from ${await diagnostics.host(base) || 'provider'}; ${SMOKE_CONNECTIVITY_ONLY_EVIDENCE})`,
        fix: null,
      };
    }
    return {
      check: 'image_smoke',
      status: 'fail',
      detail: `provider response omitted both image ref and task id (${await diagnostics.host(base) || 'provider'})`,
      fix: 'Relay submit contract unexpected; see _lessons/ and image_api_client unwrap rules.',
    };
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'timed out after 30s' : 'provider request failed before a valid response';
    return {
      check: 'image_smoke',
      status: 'fail',
      detail: msg,
      fix: 'Fix credentials/network, then: node ppt_maker_harness/scripts/ppt_flow.mjs doctor --smoke',
    };
  }
}

/**
 * Probe every resolveVendors() entry; print human report; return aggregate check.
 * Does not write .env.
 * @returns {Promise<{check:string,status:string,detail:string,fix:string|null,rows?:object[]}>}
 */
export async function checkProbeVendors({
  vendors: injectedVendors,
  fetchImpl = globalThis.fetch,
  log = console.log,
  timeoutMs = 120_000,
  providerApi = null,
} = {}) {
  const diagnostics = providerDiagnostics(providerApi);

  let vendors;
  let provider;
  try {
    provider = injectedVendors ? await diagnostics.defaults() : await diagnostics.inspect();
    vendors = injectedVendors ?? provider.vendors;
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
    const host = await diagnostics.host(base) || 'provider';
    log(`  probing ${idx}/${n} → ${host}`);
    const started = Date.now();
    let lastHb = started;
    const controller = new AbortController();
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastHb >= provider.heartbeat_ms) {
        const elapsedSec = Math.floor((now - started) / 1000);
        log(`  … still waiting vendor=${host} phase=submit elapsed=${elapsedSec}s`);
        lastHb = now;
      }
    }, Math.min(1_000, provider.heartbeat_ms));
    const hardTimeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetchImpl(`${base}/images/generations`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
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
        log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  non-JSON`);
        continue;
      }
      if (!resp.ok) {
        const err = `http_error:${resp.status}`;
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${err}`);
        continue;
      }
      const classified = await diagnostics.classify(data);
      const syncRef = classified.image_ref;
      const taskId = classified.task_id;
      if (syncRef) {
        rows.push({ base_url: base, ok: true, mode: 'sync', elapsed_s, error: null });
        log(`  [${idx}/${n}] OK    sync  ${elapsed_s}s  ${host}`);
      } else if (taskId) {
        rows.push({ base_url: base, ok: true, mode: 'async', elapsed_s, error: null });
        log(`  [${idx}/${n}] OK    async  ${elapsed_s}s  ${host}`);
      } else {
        const err = 'missing_image_or_task';
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${err}`);
      }
    } catch (err) {
      const elapsed_s = Math.round(((Date.now() - started) / 1000) * 10) / 10;
      const msg = err?.name === 'AbortError' ? 'timeout' : 'network_error';
      rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: msg });
      log(`  [${idx}/${n}] FAIL  ${host}  ${elapsed_s}s  ${msg}`);
    } finally {
      clearInterval(timer);
      clearTimeout(hardTimeout);
    }
  }

  const okRows = rows.filter((r) => r.ok).sort((a, b) => a.elapsed_s - b.elapsed_s);
  const failRows = rows.filter((r) => !r.ok);
  log('');
  log('  --- Summary ---');
  log(`  OK:   ${okRows.map((r) => `${r.base_url} (${r.elapsed_s}s ${r.mode})`).join(', ') || '(none)'}`);
  log(`  FAIL: ${failRows.map((r) => `${r.base_url} (${r.error})`).join(', ') || '(none)'}`);

  const anyOk = okRows.length > 0;
  const okList = okRows.map((r) => r.base_url).join(', ');
  log('');
  log('  --- Result ---');
  if (anyOk) {
    log(`  OK: ${okList}`);
  } else {
    log('  FAIL: check IMAGE2_API_KEY and IMAGE2_BASE_URL');
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
  checkApiKey,
  checkBaseUrl,
  checkPageImageRawGenerator,
  probeGitSafetyForTest,
};

function formatText(results, allPass, { image2 = false, profiles = [], smoke = false } = {}) {
  const lines = [];
  const platformName = IS_WINDOWS ? 'Windows' : process.platform;
  lines.push('='.repeat(56));
  lines.push('  PPT Maker Harness Environment Check');
  lines.push(`  Platform: ${platformName}`);
  lines.push(`  Mode: ${image2 ? 'base + Image2' : 'base (offline local runtime)'}`);
  lines.push('='.repeat(56));
  lines.push('');

  for (const profile of profiles) {
    const state = profile.current_action_ready ? 'READY' : profile.deferred ? 'NOT ASSESSED FOR CURRENT ACTION' : 'NOT READY';
    lines.push(`  Profile ${profile.id}: ${state}`);
  }
  if (profiles.length) lines.push('');

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
  const generatorMissing = results.some(r => r.check === 'page_image_raw_generator' && r.status !== 'ok');

  if (!foundationOk) {
    lines.push('  ⛔ FOUNDATION NOT READY — supported Node.js (22/24/26) and npm must be set up FIRST.');
    lines.push('     Fix the [FOUNDATION] items above, then re-run.');
  } else if (allPass) {
    if (smoke) {
      lines.push('  ✓  READY — local prerequisites and endpoint connectivity-only evidence passed.');
      lines.push('  Production prompt fit, media dimensions/decoding, async completion, and run authorization remain unverified.');
    } else if (warns) {
      lines.push(`  ✓  READY — foundation OK, no blockers. ${warns} advisory warning(s) above.`);
    } else {
      lines.push('  ✓  READY — all checks passed.');
      lines.push('  You can now start building decks.');
    }
  } else if (generatorMissing) {
    lines.push('  ✗  NOT READY — the selected in-Harness Image2 generator is missing.');
    lines.push('     Restore the named owner modules, then re-run doctor.');
  } else {
    lines.push('  ✗  NOT READY — foundation is fine, but a hard requirement failed. Fix those and re-run.');
  }

  return lines.join('\n');
}

// --- Main ---

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

function emitEnvCheckUsage(message, hint) {
  console.error(`Usage: ${message}`);
  emitCliError({
    code: CLI_ERROR_CODES.USAGE,
    message,
    hint,
    where: 'env-check.arguments',
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: 'usage',
      operation: 'parse-arguments',
      next: createCliNext('fix_arguments', { default: hint }),
    },
  });
}

function pageImageDoctorPlan(operation) {
  if (operation == null) {
    return {
      profile: 'page-image-unbound',
      includeImage2: true,
      activeProfiles: ['framed-runtime'],
      deferredProfiles: ['image2-raw'],
    };
  }
  if (operation === 'framed-local-refresh') {
    return { profile: 'page-image-framed', includeImage2: false, activeProfiles: ['framed-runtime'], deferredProfiles: [] };
  }
  if (operation === 'raw-generation' || operation === 'image2-raw') {
    return { profile: 'page-image-raw', includeImage2: true, activeProfiles: ['image2-raw'], deferredProfiles: [] };
  }
  if (operation === 'full-build') {
    return { profile: 'page-image-full', includeImage2: true, activeProfiles: [...PAGE_IMAGE_DOCTOR_PROFILES], deferredProfiles: [] };
  }
  return { profile: 'common', includeImage2: false, activeProfiles: [], deferredProfiles: [] };
}

function profileReady(results, names) {
  const selected = results.filter((result) => names.has(result.check));
  return selected.length > 0 && selected.every((result) => result.status !== 'fail');
}

function pageImageProfileReports(results, { activeProfiles, deferredProfiles }) {
  const framedChecks = new Set([
    'nodejs', 'npm', '@napi-rs/canvas', 'pptxgenjs', 'commander',
    'playwright', 'chromium', 'html_fonts', 'framed_render_profile', 'html_runtime_smoke',
  ]);
  const rawChecks = new Set([
    'nodejs', 'npm', '@napi-rs/canvas', 'pptxgenjs', 'commander',
    'api_key', 'image_base_url', 'page_image_raw_generator',
  ]);
  const reports = [];
  for (const id of [...activeProfiles, ...deferredProfiles]) {
    const names = id === 'framed-runtime' ? framedChecks : rawChecks;
    reports.push(Object.freeze({
      id,
      current_action_ready: profileReady(results, names),
      deferred: deferredProfiles.includes(id),
    }));
  }
  return Object.freeze(reports);
}

export async function runEnvCheckCli(argv = process.argv, { providerApi = null } = {}) {
  const retiredImage2Flag = argv.includes('--image2');
  const wantSmoke = argv.includes('--smoke');
  const wantProbe = argv.includes('--probe-vendors');
  const wantJson = argv.includes('--json');
  const mode = argValue(argv, '--mode');
  const operation = argValue(argv, '--operation');
  if (wantJson) setCliOutputMode('json');

  if (retiredImage2Flag) {
    emitEnvCheckUsage('--image2 is no longer a public doctor flag', 'Use --mode image2-page-workflow --operation raw-generation.');
    process.exit(1);
  }
  if (mode != null && !DOCTOR_MODES.includes(mode)) {
    emitEnvCheckUsage(`unknown --mode ${JSON.stringify(mode)}`, `Allowed: ${DOCTOR_MODES.join(', ')}.`);
    process.exit(1);
  }
  if (operation != null && !PAGE_IMAGE_DOCTOR_OPERATIONS.includes(operation)) {
    emitEnvCheckUsage(`unknown --operation ${JSON.stringify(operation)}`, `Allowed: ${PAGE_IMAGE_DOCTOR_OPERATIONS.join(', ')}.`);
    process.exit(1);
  }
  if (operation != null && mode != null && mode !== 'image2-page-workflow') {
    emitEnvCheckUsage('--operation requires --mode image2-page-workflow', 'Select the current Page Image mode before an operation-scoped doctor check.');
    process.exit(1);
  }

  const resolvedMode = mode ?? 'image2-page-workflow';
  const resolvedOperation = operation ?? 'framed-local-refresh';
  const plan = pageImageDoctorPlan(resolvedOperation);
  let profile = plan.profile;
  let wantImage2 = plan.includeImage2 || wantSmoke || wantProbe;
  let activeProfiles = plan.activeProfiles;
  let deferredProfiles = plan.deferredProfiles;
  if ((wantSmoke || wantProbe) && operation == null) {
    profile = 'page-image-full';
    wantImage2 = true;
    activeProfiles = [...PAGE_IMAGE_DOCTOR_PROFILES];
    deferredProfiles = [];
  }

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
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: 'usage',
        operation: 'parse-arguments',
        next: createCliNext('fix_arguments', { default: 'Use --smoke for the first-vendor gate or --probe-vendors for the full channel report, not both.' }),
      },
    });
    process.exit(1);
  }

  const { results } = await runAllChecks({ includeImage2: wantImage2, profile, providerApi });

  if (wantSmoke || wantProbe) {
    const selectedChecksReady = results.every((result) => result.status !== 'fail');
    if (selectedChecksReady) {
      if (wantProbe) {
        results.push(await checkProbeVendors({ log: wantJson ? console.error : console.log, providerApi }));
      } else {
        results.push(await checkImageSmoke({ providerApi }));
      }
    } else {
      results.push({
        check: wantProbe ? 'image_probe_vendors' : 'image_smoke',
        status: 'fail',
        detail: 'skipped because base or Image2 presence checks are not ready',
        fix: 'Repair the failed base/Image2 checks, then re-run after submit confirmation.',
      });
    }
  }

  const profiles = pageImageProfileReports(results, { activeProfiles, deferredProfiles });
  const deferredChecks = new Set(
    deferredProfiles.includes('image2-raw')
      ? ['api_key', 'image_base_url', 'page_image_raw_generator']
      : []
  );
  const allPass = results.filter((result) => !deferredChecks.has(result.check)).every((result) => result.status !== 'fail');
  const foundationOk = results.filter((r) => r.foundation).every((r) => r.status === 'ok');

  const report = {
    allPass,
    foundationOk,
    checks: results,
    smoke: wantSmoke,
    probeVendors: wantProbe,
    image2: wantImage2,
    profile,
    mode: resolvedMode,
    operation: resolvedOperation,
    ...(profiles.length ? { profiles } : {}),
  };
  if (wantJson) {
    registerCliJsonReport(report, { schema: CLI_JSON_REPORT_SCHEMAS.ENV_CHECK });
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatText(results, allPass, { image2: wantImage2, profiles, smoke: wantSmoke }));
  }

  if (!allPass) {
    const failed = results.filter((result) => result.status === 'fail' && !deferredChecks.has(result.check));
    const invocationArgs = [ENV_CHECK_CLI, ...(wantJson ? ['--json'] : []), '--mode', resolvedMode, '--operation', resolvedOperation, ...(wantSmoke ? ['--smoke'] : []), ...(wantProbe ? ['--probe-vendors'] : [])];
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: `Environment check found ${failed.length} blocking requirement(s).`,
      hint: 'Repair the named local prerequisites, then rerun doctor.',
      where: 'env-check.results',
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: 'environment',
        operation: wantProbe ? 'probe-vendors' : wantSmoke ? 'smoke' : 'check',
        issues: failed.map((result) => ({
          message: `${result.check} is not ready`,
          subject: { kind: 'environment_check', id: result.check },
          reason: { kind: 'check_failed', actual: result.status, expected: 'ok' },
        })),
        next: createCliNext('repair_environment', {
          invocation: { program: 'node', args: invocationArgs },
          default: 'Repair the failed environment checks without exposing credential values, then rerun.',
        }),
      },
    });
  }

  process.exit(allPass ? 0 : 1);
}
