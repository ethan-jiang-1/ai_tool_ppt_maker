import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HTML_RUNTIME_PROFILE,
  assertSafeChromiumLaunchOptions,
  inspectHtmlRuntime,
  inspectNodeRuntime,
  launchPinnedChromium,
  resolvePlaywrightInstallation,
} from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs';

function fakeInstallation({ version = '1.61.1', revision = '1228', browserVersion = '149.0.7827.55' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'html-runtime-profile-'));
  const playwrightRoot = join(root, 'node_modules', 'playwright');
  const coreRoot = join(root, 'node_modules', 'playwright-core');
  mkdirSync(playwrightRoot, { recursive: true });
  mkdirSync(coreRoot, { recursive: true });
  writeFileSync(join(playwrightRoot, 'package.json'), JSON.stringify({ name: 'playwright', version, main: 'index.js' }));
  writeFileSync(join(playwrightRoot, 'index.mjs'), 'export const chromium = {};\n');
  writeFileSync(join(coreRoot, 'package.json'), JSON.stringify({ name: 'playwright-core', version }));
  writeFileSync(join(coreRoot, 'browsers.json'), JSON.stringify({
    browsers: [{ name: 'chromium', revision, browserVersion }],
  }));
  return { root, playwrightRoot };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.PLAYWRIGHT_BROWSERS_PATH;
});

describe('HTML runtime profile', () => {
  it.each([22, 24, 26])('accepts supported Node %s', (major) => {
    expect(inspectNodeRuntime(`${major}.1.0`).ok).toBe(true);
  });

  it.each([20, 23, 25])('rejects unsupported Node %s', (major) => {
    expect(inspectNodeRuntime(`${major}.9.0`).ok).toBe(false);
  });

  it('pins exact Playwright and Chromium identities', () => {
    expect(HTML_RUNTIME_PROFILE).toMatchObject({
      playwrightVersion: '1.61.1',
      chromiumRevision: '1228',
      chromiumBrowserVersion: '149.0.7827.55',
    });
  });

  it('resolves metadata through the canonical discovered package root', () => {
    const selected = fakeInstallation();
    const shadow = fakeInstallation({ version: '1.60.0' });
    expect(shadow.playwrightRoot).not.toBe(selected.playwrightRoot);
    const result = resolvePlaywrightInstallation({
      playwrightRoot: selected.playwrightRoot,
      playwrightVersion: '1.61.1',
    });
    expect(result.root).toBe(selected.playwrightRoot);
    expect(result.version).toBe('1.61.1');
  });

  it('rejects package, core, and Chromium profile drift', () => {
    expect(() => resolvePlaywrightInstallation({
      playwrightRoot: fakeInstallation({ version: '1.60.0' }).playwrightRoot,
      playwrightVersion: '1.60.0',
    })).toThrow(/1\.61\.1/);
    expect(() => resolvePlaywrightInstallation({
      playwrightRoot: fakeInstallation({ revision: '9999' }).playwrightRoot,
      playwrightVersion: '1.61.1',
    })).toThrow(/Chromium registry/);
  });

  it.each(['standard', 'configured'])('reports %s cache and matching browser presence', async (cache) => {
    const selected = fakeInstallation();
    const executablePath = join(selected.root, 'chromium');
    writeFileSync(executablePath, 'paired browser');
    if (cache === 'configured') process.env.PLAYWRIGHT_BROWSERS_PATH = join(selected.root, 'cache');
    const evidence = await inspectHtmlRuntime({
      playwrightRoot: selected.playwrightRoot,
      playwrightVersion: '1.61.1',
      nodeVersion: '24.0.0',
      importer: async () => ({ chromium: { executablePath: () => executablePath } }),
    });
    expect(evidence.ok).toBe(true);
    expect(evidence.chromium.cache).toBe(cache);
  });

  it('fails closed when the paired browser is missing', async () => {
    const selected = fakeInstallation();
    const evidence = await inspectHtmlRuntime({
      playwrightRoot: selected.playwrightRoot,
      playwrightVersion: '1.61.1',
      nodeVersion: '24.0.0',
      importer: async () => ({ chromium: { executablePath: () => join(selected.root, 'missing') } }),
    });
    expect(evidence).toMatchObject({ ok: false, error: 'paired_chromium_missing' });
  });

  it('rejects system channels and arbitrary executable overrides', async () => {
    expect(() => assertSafeChromiumLaunchOptions({ channel: 'chrome' })).toThrow(/channel/);
    expect(() => assertSafeChromiumLaunchOptions({ executablePath: '/system/chrome' })).toThrow(/executablePath/);
    const launch = vi.fn(async () => ({ close: vi.fn() }));
    await launchPinnedChromium({ ok: true, runtime: { playwright: { chromium: { launch } } } });
    expect(launch).toHaveBeenCalledWith({ headless: true });
  });
});
