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

export { loadDotenv };

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
  const key = process.env.OPENAI_API_KEY || process.env.APIMART_API_KEY;
  const source = process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : (process.env.APIMART_API_KEY ? 'APIMART_API_KEY' : null);
  return {
    check: 'api_key',
    status: source ? 'ok' : 'fail',
    detail: source ? `found (${source})` : 'not set',
    fix: source ? null : (
      'Stage 2 (image generation) needs a key. Put it in .env (loaded automatically):\n' +
      '  OPENAI_API_KEY=sk-...'
    ),
  };
}

function checkBaseUrl() {
  const url = process.env.OPENAI_BASE_URL || process.env.APIMART_BASE_URL || process.env.APIMART_BASE_URLS;
  return {
    check: 'image_base_url',
    status: 'ok',
    detail: url ? `set (${url})` : 'unset — the Stage-2 backend uses its default endpoint',
    fix: null,
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

function checkNpmPackages() {
  const pkgPath = join(process.cwd(), 'package.json');
  const nmPath = join(process.cwd(), 'node_modules');
  const pkgs = [
    { importName: '@napi-rs/canvas', pkg: '@napi-rs/canvas', required: true },
    { importName: 'pptxgenjs', pkg: 'pptxgenjs', required: true },
    { importName: 'commander', pkg: 'commander', required: true },
  ];

  const installed = existsSync(nmPath);
  return pkgs.map(({ importName, pkg, required }) => {
    const importable = installed && existsSync(join(nmPath, ...importName.split('/')));
    return {
      check: pkg,
      status: importable ? 'ok' : (required ? 'fail' : 'warn'),
      detail: importable ? 'installed' : 'not installed',
      fix: importable ? null : 'Run `npm install` in the project root.',
    };
  });
}

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
  // Load .env from cwd/parents first
  for (let p = process.cwd(); p !== dirname(p); p = dirname(p)) {
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

function main() {
  const { results, allPass } = runAllChecks();
  const foundationOk = results.filter(r => r.foundation).every(r => r.status === 'ok');

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ allPass, foundationOk, checks: results }, null, 2));
  } else {
    console.log(formatText(results, allPass));
  }

  process.exit(allPass ? 0 : 1);
}

main();
