import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  HTML_RUNTIME_SMOKE_TIMEOUT_MS,
  HTML_RUNTIME_SMOKE_VIEWPORT,
  inspectHtmlRuntime,
  runHtmlRuntimeSmoke,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/html_runtime.mjs';
import { DEFAULT_CONFIG } from '../PPTMAKER_FRAMEWORK/scripts/visual_config.mjs';

const PLAYWRIGHT_ROOT = join(process.cwd(), 'node_modules', 'playwright');
const FIXTURE_PATH = join(
  process.cwd(),
  'PPTMAKER_FRAMEWORK',
  'scripts',
  'fixtures',
  'html-runtime-smoke',
  'index.html'
);

async function installedRuntime() {
  return inspectHtmlRuntime({
    playwrightRoot: PLAYWRIGHT_ROOT,
    playwrightVersion: '1.61.1',
  });
}

describe('HTML runtime static smoke contract', () => {
  it('uses a renderer-independent fixed fixture without changing legacy canvas', () => {
    const fixture = readFileSync(FIXTURE_PATH, 'utf8');
    expect(HTML_RUNTIME_SMOKE_TIMEOUT_MS).toBe(30_000);
    expect(HTML_RUNTIME_SMOKE_VIEWPORT).toEqual({ width: 960, height: 540 });
    expect(fixture).toMatch(/renderer-independent-runtime-smoke/);
    expect(fixture).not.toMatch(/<script|slide[-_ ]renderer|1600px|900px/i);
    expect(DEFAULT_CONFIG.canvas).toEqual({ width_px: 1672, height_px: 941 });
  });

  it('contains no installer, runtime download, or system-browser fallback path', () => {
    const runtime = readFileSync(join(process.cwd(), 'PPTMAKER_FRAMEWORK', 'scripts', 'lib', 'html_runtime.mjs'), 'utf8');
    const fonts = readFileSync(join(process.cwd(), 'PPTMAKER_FRAMEWORK', 'scripts', 'lib', 'html_fonts.mjs'), 'utf8');
    expect(runtime).not.toMatch(/playwright\s+install|installBrowser|executablePath\s*:/);
    expect(runtime).not.toMatch(/\bfetch\s*\(|node:child_process/);
    expect(fonts).not.toMatch(/\bfetch\s*\(|node:child_process|fonttools/i);
    expect(runtime).toMatch(/does not accept a system-browser channel/);
  });

  it('launches paired Chromium and proves local custom-font usage with zero network', async () => {
    const runtime = await installedRuntime();
    if (!runtime.ok && process.env.HTML_RUNTIME_TEST_ALLOW_BROWSER_SKIP === '1') return;
    expect(runtime.ok, 'Run npm run setup:chromium or explicitly opt into unavailable-browser skip').toBe(true);

    const evidence = await runHtmlRuntimeSmoke({ runtimeEvidence: runtime });
    expect(evidence).toMatchObject({
      ok: true,
      profile: 'html-runtime-v1',
      viewport: { width: 960, height: 540 },
      networkRequests: 0,
      serviceWorkers: 'blocked',
      fixedSentinelOnly: true,
      actualDeckCoverage: false,
      pixelOverflowCoverage: false,
      fonts: {
        latin: { cssFamily: 'Source Sans 3', familyName: 'SourceSans3VF', isCustomFont: true },
        han: { cssFamily: 'Noto Sans SC', familyName: 'Noto Sans SC Thin', isCustomFont: true },
      },
    });
    expect(evidence.fonts.latin.glyphCount).toBeGreaterThan(0);
    expect(evidence.fonts.han.glyphCount).toBeGreaterThan(0);
  }, 35_000);

  it('aborts and records HTTP attempts rather than consuming a response', async () => {
    const runtime = await installedRuntime();
    if (!runtime.ok && process.env.HTML_RUNTIME_TEST_ALLOW_BROWSER_SKIP === '1') return;
    expect(runtime.ok).toBe(true);
    const remoteFixture = 'data:text/html,<img src="https://example.invalid/remote.png">';
    const evidence = await runHtmlRuntimeSmoke({ runtimeEvidence: runtime, fixtureUrl: remoteFixture });
    expect(evidence.ok).toBe(false);
    expect(evidence.networkRequests).toBe(1);
  }, 35_000);

  it('bounds a stalled phase and closes both context and browser', async () => {
    const contextClose = vi.fn(async () => {});
    const browserClose = vi.fn(async () => {});
    const context = {
      route: vi.fn(async () => {}),
      newPage: vi.fn(async () => ({ goto: () => new Promise(() => {}) })),
      close: contextClose,
    };
    const browser = {
      newContext: vi.fn(async () => context),
      close: browserClose,
    };
    const evidence = await runHtmlRuntimeSmoke({
      runtimeEvidence: { ok: true },
      timeoutMs: 20,
      launch: vi.fn(async () => browser),
    });
    expect(evidence).toMatchObject({
      ok: false,
      phase: 'fixture_load',
      error: expect.stringMatching(/timed out during fixture_load/),
    });
    expect(contextClose).toHaveBeenCalledOnce();
    expect(browserClose).toHaveBeenCalledOnce();
  });
});
