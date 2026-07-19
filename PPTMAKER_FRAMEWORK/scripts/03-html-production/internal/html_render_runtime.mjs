import { createHash } from 'node:crypto';
import { decode as decodePng, encode as encodePng } from 'fast-png';
import { HTML_RUNTIME_PROFILE, launchPinnedChromium } from '../../00-setup/internal/html_runtime.mjs';

export const HTML_CAPTURE_PROFILE = Object.freeze({
  id: 'html-capture-v1',
  cssWidth: 1000,
  cssHeight: 562.5,
  viewportHeight: 563,
  deviceScaleFactor: 2,
  outputWidth: 2000,
  outputHeight: 1125,
  rawCaptureHeight: 1126,
  geometryEpsilonCssPx: 0.5,
  reencode: 'fast-png-crop-final-device-row-v1',
});
export const HTML_RENDER_TIMEOUT_MS = 30_000;

const FORBIDDEN_SCHEME_RE = /^(?:http|https|file|ftp|blob|ws|wss|custom):/i;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function installNetworkDenialGuards(context) {
  const attempts = [];
  const record = (kind, value) => attempts.push({ kind, value: String(value) });
  context.route('**/*', async (route) => {
    record('request', route.request().url());
    await route.abort('blockedbyclient');
  });
  context.on('request', (request) => record('request-observed', request.url()));
  context.on('websocket', (webSocket) => {
    record('websocket', webSocket.url());
    try { webSocket.close(); } catch {}
  });
  context.addInitScript(() => {
    const denials = [];
    Object.defineProperty(globalThis, '__pptmakerNetworkDenials', { value: denials, configurable: false, enumerable: false });
    const deny = (kind, value) => {
      denials.push({ kind, value: String(value) });
      throw new Error(`HTML external activity denied: ${kind}`);
    };
    for (const [name, kind] of [['fetch', 'fetch'], ['XMLHttpRequest', 'xhr'], ['WebSocket', 'websocket'], ['EventSource', 'eventsource'], ['Worker', 'worker'], ['SharedWorker', 'sharedworker']]) {
      try {
        if (name === 'fetch') globalThis.fetch = (...args) => deny(kind, args[0]);
        else if (globalThis[name]) globalThis[name] = function GuardedNetworkConstructor(...args) { return deny(kind, args[0]); };
      } catch {}
    }
    try { if (navigator.sendBeacon) navigator.sendBeacon = (...args) => deny('beacon', args[0]); } catch {}
    try {
      const serviceWorker = navigator.serviceWorker;
      if (serviceWorker) serviceWorker.register = (...args) => deny('service-worker', args[0]);
    } catch {}
    try {
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function guardedSetAttribute(name, value) {
        if (/^(?:src|href|action|poster|data)$/i.test(name) && /^(?:http|https|file|ftp|blob|ws|wss|custom):/i.test(String(value))) deny('resource-attribute', value);
        return originalSetAttribute.call(this, name, value);
      };
    } catch {}
  });
  return { attempts, readPageDenials: (page) => page.evaluate(() => [...(globalThis.__pptmakerNetworkDenials || [])]) };
}

function cropOneDeviceRow(decoded) {
  if (decoded.width !== HTML_CAPTURE_PROFILE.outputWidth || decoded.height !== HTML_CAPTURE_PROFILE.rawCaptureHeight) {
    throw new Error(`fractional capture produced ${decoded.width}x${decoded.height}; expected ${HTML_CAPTURE_PROFILE.outputWidth}x${HTML_CAPTURE_PROFILE.rawCaptureHeight}`);
  }
  const rowBytes = decoded.width * 4;
  const data = new Uint8Array(rowBytes * HTML_CAPTURE_PROFILE.outputHeight);
  for (let row = 0; row < HTML_CAPTURE_PROFILE.outputHeight; row += 1) {
    data.set(decoded.data.subarray(row * rowBytes, (row + 1) * rowBytes), row * rowBytes);
  }
  return encodePng({ width: HTML_CAPTURE_PROFILE.outputWidth, height: HTML_CAPTURE_PROFILE.outputHeight, data });
}

function assertNonBlankPng(bytes) {
  const decoded = decodePng(bytes, { checkCrc: true });
  if (decoded.width !== HTML_CAPTURE_PROFILE.outputWidth || decoded.height !== HTML_CAPTURE_PROFILE.outputHeight) throw new Error('final PNG dimensions do not match the exact capture profile');
  const first = decoded.data.subarray(0, 4); let visible = 0; let differs = false;
  for (let index = 0; index < decoded.data.length; index += 4) {
    if (decoded.data[index + 3] > 0) visible += 1;
    if (decoded.data[index] !== first[0] || decoded.data[index + 1] !== first[1] || decoded.data[index + 2] !== first[2] || decoded.data[index + 3] !== first[3]) differs = true;
  }
  if (!visible || !differs) throw new Error('final PNG is blank or a single-color frame');
  return { width: decoded.width, height: decoded.height, visiblePixels: visible };
}

export async function captureHtmlPng({ runtimeEvidence, html, timeoutMs = HTML_RENDER_TIMEOUT_MS, launch = launchPinnedChromium, onPhase, fontRoles = null, probeForbiddenRoutes = false, expectedLeafMarkers = null } = {}) {
  if (typeof html !== 'string' || !html) throw new TypeError('self-contained HTML is required');
  let browser; let context; let timer; let phase = 'launch'; let failure = null; let result = null;
  const setPhase = (next) => { phase = next; onPhase?.(next); };
  const operation = async () => {
    setPhase('browser_launch');
    browser = await launch(runtimeEvidence, { headless: true });
    setPhase('context_create');
    context = await browser.newContext({
      viewport: { width: HTML_CAPTURE_PROFILE.cssWidth, height: HTML_CAPTURE_PROFILE.viewportHeight },
      deviceScaleFactor: HTML_CAPTURE_PROFILE.deviceScaleFactor,
      serviceWorkers: 'block',
      locale: 'en-US',
      timezoneId: 'UTC',
      reducedMotion: 'reduce',
    });
    const guards = installNetworkDenialGuards(context);
    const page = await context.newPage();
    setPhase('document_load');
    await page.setContent(html, { waitUntil: 'load', timeout: timeoutMs });
    await page.evaluate(() => document.fonts.ready);
    setPhase('geometry');
    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[data-pptmaker-slide]') || document.documentElement;
      const rect = root.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    if (Math.abs(geometry.width - HTML_CAPTURE_PROFILE.cssWidth) > HTML_CAPTURE_PROFILE.geometryEpsilonCssPx || Math.abs(geometry.height - HTML_CAPTURE_PROFILE.cssHeight) > HTML_CAPTURE_PROFILE.geometryEpsilonCssPx) throw new Error(`slide geometry ${geometry.width}x${geometry.height} is outside the exact profile`);
    const leafEvidence = await page.evaluate((expected) => {
      const actual = [...document.querySelectorAll('[data-pm-leaf]')].map((node) => node.getAttribute('data-pm-leaf'));
      if (expected) {
        const sortedActual = [...actual].sort(); const sortedExpected = [...expected].sort();
        if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) throw new Error(`leaf marker set mismatch: expected ${sortedExpected.length}, observed ${sortedActual.length}`);
      }
      const root = document.querySelector('[data-pptmaker-slide]'); const rootRect = root.getBoundingClientRect();
      const entries = actual.map((marker) => {
        const node = [...document.querySelectorAll('[data-pm-leaf]')].find((candidate) => candidate.getAttribute('data-pm-leaf') === marker);
        const style = getComputedStyle(node); const range = document.createRange(); range.selectNodeContents(node);
        const rangeRects = [...range.getClientRects()].map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }));
        const rect = node.getBoundingClientRect();
        const boxes = rangeRects.length ? rangeRects : [{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }];
        if (style.visibility === 'hidden' || Number(style.opacity) === 0) throw new Error(`leaf ${marker} is not visible`);
        for (const box of boxes) if (box.x < rootRect.x - 0.5 || box.y < rootRect.y - 0.5 || box.x + box.width > rootRect.right + 0.5 || box.y + box.height > rootRect.bottom + 0.5) throw new Error(`leaf ${marker} escapes the slide bounds`);
        return { marker, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, range_boxes: boxes };
      });
      return entries;
    }, expectedLeafMarkers);
    let fonts = null;
    if (fontRoles) fonts = await collectHtmlFontEvidence({ page, context, roles: fontRoles });
    let networkProbe = null;
    if (probeForbiddenRoutes) networkProbe = await exerciseForbiddenRouteDenials(page);
    setPhase('capture');
    const rawPng = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: HTML_CAPTURE_PROFILE.cssWidth, height: HTML_CAPTURE_PROFILE.viewportHeight }, animations: 'disabled', scale: 'device' });
    const finalPng = cropOneDeviceRow(decodePng(rawPng, { checkCrc: true }));
    setPhase('verify');
    const pngEvidence = assertNonBlankPng(finalPng);
    const pageDenials = await guards.readPageDenials(page);
    result = {
      ok: true,
      profile: HTML_CAPTURE_PROFILE.id,
      runtimeProfile: HTML_RUNTIME_PROFILE.id,
      geometry,
      rawCapture: { width: HTML_CAPTURE_PROFILE.outputWidth, height: HTML_CAPTURE_PROFILE.rawCaptureHeight, sha256: sha256(rawPng) },
      png: { ...pngEvidence, sha256: sha256(finalPng), bytes: finalPng.length },
      network: { routeAttempts: guards.attempts, pageDenials, serviceWorkers: 'blocked' },
      fonts,
      networkProbe,
      leafEvidence,
      bytes: finalPng,
    };
    return result;
  };
  try {
    result = await Promise.race([operation(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`HTML capture timed out during ${phase}`)), timeoutMs); })]);
  } catch (error) { failure = error instanceof Error ? error : new Error(String(error)); }
  finally {
    clearTimeout(timer);
    const cleanupErrors = [];
    if (context) try { await context.close(); } catch (error) { cleanupErrors.push(error); }
    if (browser) try { await browser.close(); } catch (error) { cleanupErrors.push(error); }
    if (cleanupErrors.length && !failure) failure = cleanupErrors[0] instanceof Error ? cleanupErrors[0] : new Error(String(cleanupErrors[0]));
  }
  if (failure) return { ok: false, profile: HTML_CAPTURE_PROFILE.id, phase, error: failure.message.replaceAll(process.cwd(), '<cwd>') };
  return result;
}

export async function exerciseForbiddenRouteDenials(page, schemes = ['http', 'https', 'file', 'ftp', 'blob', 'ws', 'wss', 'custom', 'service-worker']) {
  return page.evaluate(async (requestedSchemes) => {
    const output = [];
    for (const scheme of requestedSchemes) {
      const url = scheme === 'service-worker' ? 'https://pptmaker.invalid/sw.js' : `${scheme}://pptmaker.invalid/resource`;
      let denied = false;
      try {
        if (scheme === 'service-worker') {
          if (!navigator.serviceWorker?.register) throw new Error('service-worker-unavailable-under-opaque-document');
          await navigator.serviceWorker.register(url);
        } else if (scheme === 'ws' || scheme === 'wss') {
          new WebSocket(url);
        } else {
          const frame = document.createElement('iframe');
          frame.setAttribute('src', url);
          frame.setAttribute('aria-hidden', 'true');
          document.body.appendChild(frame);
        }
      } catch (error) {
        denied = true;
        output.push({ scheme, denied, reason: String(error.message || error).slice(0, 120) });
        continue;
      }
      // Route/CSP may reject asynchronously; a short task boundary makes that
      // denial observable without allowing the document to navigate.
      await new Promise((resolve) => setTimeout(resolve, 0));
      denied = true;
      output.push({ scheme, denied, reason: 'blocked-by-route-or-CSP' });
    }
    return output;
  }, schemes);
}

async function platformFontsForSelector(cdp, selector) {
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) throw new Error(`font evidence selector is missing: ${selector}`);
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  return fonts.map(({ familyName, isCustomFont, glyphCount }) => ({ familyName, isCustomFont, glyphCount }));
}

export async function collectHtmlFontEvidence({ page, context, roles } = {}) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const evidence = {};
  for (const role of roles || []) {
    const fonts = await platformFontsForSelector(cdp, role.selector);
    const families = role.platformFamilies || role.families || [role.platformFamily || role.family];
    const matched = families.map((family) => {
      const match = fonts.find((font) => font.familyName === family && font.isCustomFont === true && font.glyphCount > 0);
      if (!match) throw new Error(`${role.name || role.selector} did not use bundled custom font ${family}`);
      return match;
    });
    const boxes = await page.evaluate(({ selector, svg }) => {
      const element = document.querySelector(selector); if (!element) throw new Error(`missing bbox selector ${selector}`);
      if (svg) { const box = element.getBBox(); return [{ x: box.x, y: box.y, width: box.width, height: box.height }]; }
      const range = document.createRange(); range.selectNodeContents(element);
      return [...range.getClientRects()].map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }));
    }, { selector: role.selector, svg: role.svg === true });
    if (!boxes.length || boxes.some((box) => box.width <= 0 || box.height <= 0)) throw new Error(`${role.name || role.selector} has no usable text bounds`);
    evidence[role.name || role.selector] = { selector: role.selector, cssFamilies: role.cssFamilies || (role.family ? [role.family] : null), fonts: matched, boxes };
  }
  return evidence;
}

export function assertForbiddenScheme(value) {
  if (!FORBIDDEN_SCHEME_RE.test(String(value))) throw new Error(`not a forbidden scheme: ${value}`);
  return true;
}
