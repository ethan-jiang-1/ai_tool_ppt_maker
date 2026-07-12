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

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { homedir, tmpdir, platform } from 'node:os';
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

function sharedImage2KeyFromEnv() {
  return (
    process.env.IMAGE2_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.APIMART_API_KEY ||
    ''
  );
}

/** @returns {{ base_url: string, key_env: string|null, api_key: string, error?: string }[]} */
function parseVendorsEnvStatic() {
  const raw = (process.env.IMAGE2_VENDORS || '').trim();
  if (!raw) return [];
  /** @type {{ base_url: string, key_env: string|null, api_key: string, error?: string }[]} */
  const out = [];
  for (const part of raw.split(',')) {
    const item = part.trim();
    if (!item) continue;
    const pipe = item.indexOf('|');
    const base_url = (pipe >= 0 ? item.slice(0, pipe) : item).trim().replace(/\/+$/, '');
    const key_env = pipe >= 0 ? item.slice(pipe + 1).trim() : null;
    if (!base_url) continue;
    let api_key = '';
    if (key_env) {
      api_key = process.env[key_env] || '';
      if (!api_key) {
        out.push({ base_url, key_env, api_key: '', error: `${key_env} is not set` });
        continue;
      }
    } else {
      api_key = sharedImage2KeyFromEnv();
      if (!api_key) {
        out.push({
          base_url,
          key_env: null,
          api_key: '',
          error: 'IMAGE2_API_KEY missing for item without |KEY_ENV',
        });
        continue;
      }
    }
    out.push({ base_url, key_env, api_key });
  }
  return out;
}

function checkApiKey() {
  const vendors = parseVendorsEnvStatic();
  if (vendors.length > 0) {
    const bad = vendors.filter((v) => v.error);
    if (bad.length === 0) {
      return {
        check: 'api_key',
        status: 'ok',
        detail: `found (IMAGE2_VENDORS ×${vendors.length})`,
        fix: null,
      };
    }
    const missing = bad.map((v) => v.key_env || 'IMAGE2_API_KEY').join(', ');
    return {
      check: 'api_key',
      status: 'fail',
      detail: `IMAGE2_VENDORS key missing: ${missing}`,
      fix:
        `Set the missing env var(s) named in IMAGE2_VENDORS (${missing}), or use a shared IMAGE2_API_KEY.`,
    };
  }

  const key = sharedImage2KeyFromEnv();
  const source = process.env.IMAGE2_API_KEY
    ? 'IMAGE2_API_KEY'
    : (process.env.OPENAI_API_KEY
      ? 'OPENAI_API_KEY'
      : (process.env.APIMART_API_KEY ? 'APIMART_API_KEY' : null));
  return {
    check: 'api_key',
    status: source ? 'ok' : 'fail',
    detail: source ? `found (${source})` : 'not set',
    fix: source ? null : (
      'Stage 2 (image generation) needs a key. Put it in .env (loaded automatically):\n' +
      '  IMAGE2_API_KEY=sk-...\n' +
      '  # or IMAGE2_VENDORS=https://…/v1|YOUR_KEY_ENV_VAR'
    ),
  };
}

function checkBaseUrl() {
  const vendors = parseVendorsEnvStatic();
  if (vendors.length > 0) {
    return {
      check: 'image_base_url',
      status: 'ok',
      detail: `set (IMAGE2_VENDORS → ${vendors[0].base_url})`,
      fix: null,
    };
  }
  const url =
    process.env.IMAGE2_BASE_URL ||
    process.env.IMAGE2_BASE_URLS ||
    process.env.OPENAI_BASE_URL ||
    process.env.APIMART_BASE_URL ||
    process.env.APIMART_BASE_URLS;
  const ok = Boolean(url && String(url).trim());
  return {
    check: 'image_base_url',
    status: ok ? 'ok' : 'fail',
    detail: ok ? `set (${String(url).split(',')[0].trim()})` : 'not set',
    fix: ok ? null : (
      'Image API base URL is required (no silent default). Put it in .env:\n' +
      '  IMAGE2_BASE_URL=https://your-relay/v1\n' +
      '  # or IMAGE2_VENDORS=https://a/v1|KEY_ENV,https://b/v1|KEY_ENV'
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
        fix: 'Check IMAGE2_BASE_URL / IMAGE2_VENDORS points at an Image2-compatible /v1 relay.',
      };
    }
    if (!resp.ok) {
      return {
        check: 'image_smoke',
        status: 'fail',
        detail: `HTTP ${resp.status}: ${JSON.stringify(data).slice(0, 160)}`,
        fix: 'Verify keys and IMAGE2_VENDORS / IMAGE2_BASE_URL; re-run doctor --smoke.',
      };
    }
    const syncRef = extractImageRef(data);
    const taskId = extractTaskId(data);
    if (syncRef) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit ok (sync image from ${base})`,
        fix: null,
      };
    }
    if (taskId) {
      return {
        check: 'image_smoke',
        status: 'ok',
        detail: `submit ok (task_id=${taskId})`,
        fix: null,
      };
    }
    return {
      check: 'image_smoke',
      status: 'fail',
      detail: `no image ref or task_id: ${JSON.stringify(data).slice(0, 160)}`,
      fix: 'Relay submit contract unexpected; see _lessons/ and image_api_client unwrap rules.',
    };
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'timed out after 30s' : (err?.message || String(err));
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
  } = await import('./image_api_client.mjs');

  let vendors;
  try {
    vendors = resolveVendors();
  } catch (err) {
    return {
      check: 'image_probe_vendors',
      status: 'fail',
      detail: err?.message || String(err),
      fix: 'Fix IMAGE2_VENDORS / keys, then re-run doctor --probe-vendors',
    };
  }

  /** @type {{ base_url: string, ok: boolean, mode: string, elapsed_s: number, error: string|null, key_env?: string|null }[]} */
  const rows = [];
  const n = vendors.length;

  for (let i = 0; i < n; i += 1) {
    const { base_url: base, api_key: key } = vendors[i];
    const idx = i + 1;
    console.log(`  probing ${idx}/${n} → ${base}`);
    const started = Date.now();
    let lastHb = started;
    const controller = new AbortController();
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastHb >= HEARTBEAT_MS) {
        const elapsedSec = Math.floor((now - started) / 1000);
        console.log(
          `  … still waiting vendor=${base} phase=submit elapsed=${elapsedSec}s`
        );
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
        console.log(`  [${idx}/${n}] FAIL  ${base}  ${elapsed_s}s  non-JSON`);
        continue;
      }
      if (!resp.ok) {
        const err = `HTTP ${resp.status}: ${JSON.stringify(data).slice(0, 120)}`;
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        console.log(`  [${idx}/${n}] FAIL  ${base}  ${elapsed_s}s  ${err}`);
        continue;
      }
      const syncRef = extractImageRef(data);
      const taskId = extractTaskId(data);
      if (syncRef) {
        rows.push({ base_url: base, ok: true, mode: 'sync', elapsed_s, error: null });
        console.log(`  [${idx}/${n}] OK    sync  ${elapsed_s}s  ${base}`);
      } else if (taskId) {
        rows.push({ base_url: base, ok: true, mode: 'async', elapsed_s, error: null });
        console.log(`  [${idx}/${n}] OK    async task=${taskId}  ${elapsed_s}s  ${base}`);
      } else {
        const err = `no image/task_id: ${JSON.stringify(data).slice(0, 120)}`;
        rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: err });
        console.log(`  [${idx}/${n}] FAIL  ${base}  ${elapsed_s}s  ${err}`);
      }
    } catch (err) {
      const elapsed_s = Math.round(((Date.now() - started) / 1000) * 10) / 10;
      const msg =
        err?.name === 'AbortError' ? 'timed out' : (err?.message || String(err));
      rows.push({ base_url: base, ok: false, mode: 'unknown', elapsed_s, error: msg.slice(0, 160) });
      console.log(`  [${idx}/${n}] FAIL  ${base}  ${elapsed_s}s  ${msg}`);
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

  // Suggested IMAGE2_VENDORS: rebuild with KEY_ENV names from env parse when possible
  const parsed = parseVendorsEnvStatic();
  const keyEnvByUrl = new Map(parsed.map((p) => [p.base_url, p.key_env]));
  const ordered = [...okRows, ...failRows];
  const suggested = ordered
    .map((r) => {
      const ke = keyEnvByUrl.get(r.base_url);
      return ke ? `${r.base_url}|${ke}` : r.base_url;
    })
    .join(',');
  if (suggested) {
    console.log('');
    console.log('  Suggested IMAGE2_VENDORS (ok by speed, then failed):');
    console.log(`  IMAGE2_VENDORS=${suggested}`);
    console.log('  (not written — confirm before updating .env)');
  }

  const anyOk = okRows.length > 0;
  return {
    check: 'image_probe_vendors',
    status: anyOk ? 'ok' : 'fail',
    detail: anyOk
      ? `${okRows.length}/${rows.length} vendors OK`
      : `0/${rows.length} vendors OK`,
    fix: anyOk
      ? null
      : 'All vendors failed. Check keys/URLs or try doctor --probe-vendors after fixing .env.',
    rows,
  };
}

export { runAllChecks, checkImageSmoke, checkProbeVendors, checkApiKey, checkBaseUrl };

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

  if (wantSmoke && wantProbe) {
    console.error(
      'Usage: pass only one of --smoke or --probe-vendors (mutually exclusive).'
    );
    console.error(
      JSON.stringify({
        ok: false,
        code: 'USAGE',
        message: '--smoke and --probe-vendors are mutually exclusive',
        hint: 'Use --smoke for first-vendor gate; --probe-vendors for full channel report',
        where: 'env-check.main',
      })
    );
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
        fix: 'Set IMAGE2_VENDORS (or IMAGE2_API_KEY + IMAGE2_BASE_URL), then re-run',
      });
    }
  }

  const allPass = results.every((r) => r.status !== 'fail');
  const foundationOk = results.filter((r) => r.foundation).every((r) => r.status === 'ok');

  if (process.argv.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          allPass,
          foundationOk,
          checks: results,
          smoke: wantSmoke,
          probeVendors: wantProbe,
        },
        null,
        2
      )
    );
  } else {
    console.log(formatText(results, allPass));
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
    process.exit(1);
  });
}
