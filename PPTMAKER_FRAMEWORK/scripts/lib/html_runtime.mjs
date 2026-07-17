import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { verifyHtmlFontBundle } from './html_fonts.mjs';
import { HTML_RUNTIME_PROFILE } from './html_runtime_profile.mjs';

export { HTML_RUNTIME_PROFILE } from './html_runtime_profile.mjs';

export const HTML_RUNTIME_SMOKE_TIMEOUT_MS = 30_000;
export const HTML_RUNTIME_SMOKE_VIEWPORT = Object.freeze({ width: 960, height: 540 });

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const SMOKE_FIXTURE_URL = pathToFileURL(resolve(
  MODULE_DIR,
  '..',
  'fixtures',
  'html-runtime-smoke',
  'index.html'
)).href;

function parseJsonFile(path, readFile = readFileSync) {
  return JSON.parse(readFile(path, 'utf8'));
}

export function inspectNodeRuntime(nodeVersion = process.versions.node) {
  const major = Number.parseInt(String(nodeVersion).split('.')[0], 10);
  const supported = HTML_RUNTIME_PROFILE.supportedNodeMajors.includes(major);
  return {
    ok: supported,
    version: String(nodeVersion),
    major: Number.isInteger(major) ? major : null,
    supportedMajors: [...HTML_RUNTIME_PROFILE.supportedNodeMajors],
  };
}

export function assertSafeChromiumLaunchOptions(options = {}) {
  if (options.channel !== undefined) {
    throw new Error('HTML runtime does not accept a system-browser channel');
  }
  if (options.executablePath !== undefined) {
    throw new Error('HTML runtime does not accept an executablePath override');
  }
  return { ...options, headless: options.headless ?? true };
}

export function resolvePlaywrightInstallation({
  playwrightRoot,
  playwrightVersion,
  readFile = readFileSync,
  exists = existsSync,
} = {}) {
  if (!playwrightRoot) throw new Error('Canonical Playwright package root is required');
  const root = resolve(playwrightRoot);
  const packageJsonPath = join(root, 'package.json');
  if (!exists(packageJsonPath)) throw new Error('Canonical Playwright package metadata is missing');

  const packageMeta = parseJsonFile(packageJsonPath, readFile);
  const discoveredVersion = playwrightVersion ?? packageMeta.version;
  if (packageMeta.name !== 'playwright' || packageMeta.version !== discoveredVersion) {
    throw new Error('Discovered Playwright root/version do not describe the same package');
  }
  if (discoveredVersion !== HTML_RUNTIME_PROFILE.playwrightVersion) {
    throw new Error(`Playwright ${HTML_RUNTIME_PROFILE.playwrightVersion} is required`);
  }

  const requireFromPlaywright = createRequire(packageJsonPath);
  let corePackageJsonPath;
  try {
    corePackageJsonPath = requireFromPlaywright.resolve('playwright-core/package.json');
  } catch {
    throw new Error('The paired playwright-core package is missing');
  }
  const browsersJsonPath = join(dirname(corePackageJsonPath), 'browsers.json');
  if (!exists(browsersJsonPath)) throw new Error('The paired Chromium registry is missing');
  const coreMeta = parseJsonFile(corePackageJsonPath, readFile);
  const registry = parseJsonFile(browsersJsonPath, readFile);
  const chromium = registry.browsers?.find((entry) => entry.name === 'chromium');

  if (coreMeta.version !== HTML_RUNTIME_PROFILE.playwrightVersion) {
    throw new Error('The paired playwright-core version does not match the runtime profile');
  }
  if (
    chromium?.revision !== HTML_RUNTIME_PROFILE.chromiumRevision
    || chromium?.browserVersion !== HTML_RUNTIME_PROFILE.chromiumBrowserVersion
  ) {
    throw new Error('The Playwright Chromium registry does not match the runtime profile');
  }

  return {
    root,
    entryUrl: pathToFileURL(join(root, 'index.mjs')).href,
    coreRoot: dirname(corePackageJsonPath),
    version: discoveredVersion,
    chromium: {
      revision: chromium.revision,
      browserVersion: chromium.browserVersion,
    },
  };
}

export async function loadPlaywrightFromRoot(installation, importer = (url) => import(url)) {
  const loaded = await importer(installation.entryUrl);
  if (!loaded?.chromium || typeof loaded.chromium.executablePath !== 'function') {
    throw new Error('Canonical Playwright package does not expose Chromium');
  }
  return loaded;
}

export async function inspectHtmlRuntime({
  playwrightRoot,
  playwrightVersion,
  nodeVersion = process.versions.node,
  readFile = readFileSync,
  exists = existsSync,
  importer,
} = {}) {
  const node = inspectNodeRuntime(nodeVersion);
  if (!node.ok) {
    return {
      ok: false,
      profile: HTML_RUNTIME_PROFILE.id,
      node,
      playwright: null,
      chromium: null,
      error: 'unsupported_node_major',
    };
  }

  try {
    const installation = resolvePlaywrightInstallation({
      playwrightRoot,
      playwrightVersion,
      readFile,
      exists,
    });
    const playwright = await loadPlaywrightFromRoot(installation, importer);
    const executablePath = playwright.chromium.executablePath();
    const browserInstalled = Boolean(executablePath && exists(executablePath));
    return {
      ok: browserInstalled,
      profile: HTML_RUNTIME_PROFILE.id,
      node,
      playwright: { version: installation.version },
      chromium: {
        revision: installation.chromium.revision,
        browserVersion: installation.chromium.browserVersion,
        installed: browserInstalled,
        cache: process.env.PLAYWRIGHT_BROWSERS_PATH ? 'configured' : 'standard',
      },
      error: browserInstalled ? null : 'paired_chromium_missing',
      runtime: { installation, playwright },
    };
  } catch (error) {
    return {
      ok: false,
      profile: HTML_RUNTIME_PROFILE.id,
      node,
      playwright: null,
      chromium: null,
      error: 'profile_mismatch',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function launchPinnedChromium(runtimeEvidence, options = {}) {
  if (!runtimeEvidence?.ok || !runtimeEvidence.runtime?.playwright?.chromium) {
    throw new Error('Matching installed Chromium is required before launch');
  }
  return runtimeEvidence.runtime.playwright.chromium.launch(
    assertSafeChromiumLaunchOptions(options)
  );
}

async function platformFontsForSelector(cdp, selector) {
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) throw new Error(`Smoke sentinel is missing: ${selector}`);
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  return fonts.map(({ familyName, isCustomFont, glyphCount }) => ({
    familyName,
    isCustomFont,
    glyphCount,
  }));
}

function requireCustomFont(fonts, expectedFamily, role) {
  const match = fonts.find((font) => (
    font.familyName === expectedFamily
    && font.isCustomFont === true
    && font.glyphCount > 0
  ));
  if (!match) throw new Error(`${role} sentinel did not use expected custom font ${expectedFamily}`);
  return match;
}

function normalizeGeometry(geometry) {
  return Object.fromEntries(Object.entries(geometry).map(([key, value]) => [key, {
    x: Math.round(value.x),
    y: Math.round(value.y),
    width: Math.round(value.width),
    height: Math.round(value.height),
  }]));
}

function assertSmokeGeometry(geometry) {
  const expected = {
    fixture: { x: 0, y: 0, width: 960, height: 540 },
    latin: { x: 80, y: 120, width: 800, height: 96 },
    han: { x: 80, y: 300, width: 800, height: 96 },
  };
  if (JSON.stringify(geometry) !== JSON.stringify(expected)) {
    throw new Error('Static smoke fixture geometry does not match its fixed profile');
  }
}

export async function runHtmlRuntimeSmoke({
  runtimeEvidence,
  timeoutMs = HTML_RUNTIME_SMOKE_TIMEOUT_MS,
  fixtureUrl = SMOKE_FIXTURE_URL,
  verifyFonts = verifyHtmlFontBundle,
  launch = launchPinnedChromium,
  onPhase,
} = {}) {
  let browser;
  let context;
  let timer;
  let phase = 'font_integrity';
  let failurePhase = null;
  let failure = null;
  let result = null;
  const networkAttempts = [];
  const setPhase = (next) => {
    phase = next;
    onPhase?.(next);
  };

  const operation = async () => {
    const fontEvidence = verifyFonts();
    if (!fontEvidence.ok) throw new Error(`Bundled font validation failed: ${fontEvidence.error}`);

    setPhase('browser_launch');
    browser = await launch(runtimeEvidence, { headless: true });
    setPhase('context_create');
    context = await browser.newContext({
      viewport: HTML_RUNTIME_SMOKE_VIEWPORT,
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
    });
    await context.route(/^https?:\/\//i, async (route) => {
      networkAttempts.push(route.request().url());
      await route.abort('blockedbyclient');
    });

    setPhase('fixture_load');
    const page = await context.newPage();
    await page.goto(fixtureUrl, { waitUntil: 'load' });
    setPhase('font_ready');
    await page.evaluate(() => document.fonts.ready);
    const fontChecks = await page.evaluate(() => ({
      latin: document.fonts.check("600 36px 'Source Sans 3'"),
      han: document.fonts.check("600 36px 'Noto Sans SC'"),
    }));
    if (!fontChecks.latin || !fontChecks.han) throw new Error('Supporting FontFaceSet checks failed');

    setPhase('geometry');
    const geometry = normalizeGeometry(await page.evaluate(() => {
      const rect = (selector) => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        fixture: rect('#fixture'),
        latin: rect('#latin-sentinel'),
        han: rect('#han-sentinel'),
      };
    }));
    assertSmokeGeometry(geometry);

    setPhase('font_usage');
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const latinFonts = await platformFontsForSelector(cdp, '#latin-sentinel');
    const hanFonts = await platformFontsForSelector(cdp, '#han-sentinel');
    const latinFont = requireCustomFont(latinFonts, fontEvidence.platformFamilies.latin, 'Latin');
    const hanFont = requireCustomFont(hanFonts, fontEvidence.platformFamilies.han, 'Han');

    if (networkAttempts.length > 0) throw new Error('Static smoke attempted an HTTP/HTTPS request');
    setPhase('complete');
    return {
      ok: true,
      profile: HTML_RUNTIME_PROFILE.id,
      viewport: { ...HTML_RUNTIME_SMOKE_VIEWPORT },
      networkRequests: 0,
      serviceWorkers: 'blocked',
      geometry,
      fonts: {
        latin: { cssFamily: 'Source Sans 3', familyName: latinFont.familyName, isCustomFont: true, glyphCount: latinFont.glyphCount },
        han: { cssFamily: 'Noto Sans SC', familyName: hanFont.familyName, isCustomFont: true, glyphCount: hanFont.glyphCount },
      },
      fixedSentinelOnly: true,
      actualDeckCoverage: false,
      pixelOverflowCoverage: false,
    };
  };

  try {
    result = await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`HTML runtime smoke timed out during ${phase}`)), timeoutMs);
      }),
    ]);
  } catch (error) {
    failurePhase = phase;
    failure = error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timer);
    setPhase('cleanup');
    const cleanupErrors = [];
    if (context) {
      try { await context.close(); } catch (error) { cleanupErrors.push(error); }
    }
    if (browser) {
      try { await browser.close(); } catch (error) { cleanupErrors.push(error); }
    }
    if (cleanupErrors.length > 0) {
      failurePhase ??= 'cleanup';
      failure ??= new Error(`HTML runtime smoke cleanup failed: ${cleanupErrors[0] instanceof Error ? cleanupErrors[0].message : String(cleanupErrors[0])}`);
    }
  }

  if (failure) {
    return {
      ok: false,
      profile: HTML_RUNTIME_PROFILE.id,
      phase: failurePhase,
      error: failure.message.replaceAll(process.cwd(), '<cwd>'),
      networkRequests: networkAttempts.length,
      fixedSentinelOnly: true,
      actualDeckCoverage: false,
      pixelOverflowCoverage: false,
    };
  }
  return result;
}
