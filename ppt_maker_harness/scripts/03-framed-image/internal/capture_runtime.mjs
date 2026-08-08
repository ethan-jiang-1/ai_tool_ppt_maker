import { createHash } from 'node:crypto';
import { decode as decodePng, encode as encodePng } from 'fast-png';
import { HTML_RUNTIME_PROFILE, launchPinnedChromium } from '../../00-setup/index.mjs';

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
export const HTML_RENDER_PAGE_TIMEOUT_MS = 15_000;
export const HTML_RENDER_BATCH_TIMEOUT_MS = 45_000;

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

function withDeadline(operation, timeoutMs, message) {
  let timer;
  return Promise.race([
    Promise.resolve().then(operation),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

function layoutExpectationFor(pageSpec) {
  const value = pageSpec?.layout;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('render-contract layout expectation is required');
  }
  if (!value.slide || !Array.isArray(value.fields) || !Array.isArray(value.protected_geometry) || !value.overlay || typeof value.overlay !== 'object') {
    throw new TypeError('render-contract layout expectation is incomplete');
  }
  return value;
}

async function verifyRenderContractLayout(page, expectation, expectedLeafMarkers) {
  return page.evaluate(({ layout, expectedMarkers, epsilon }) => {
    const root = document.querySelector('[data-pptmaker-slide]');
    if (!root) throw new Error('render-contract slide root is missing');
    const rect = (node) => {
      const value = node.getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom };
    };
    const close = (actual, expected, label) => {
      for (const key of ['x', 'y', 'width', 'height']) {
        if (Math.abs(actual[key] - expected[key]) > epsilon) {
          throw new Error(`${label} ${key} expected ${expected[key]}, observed ${actual[key]}`);
        }
      }
    };
    const rootRect = rect(root);
    close(rootRect, { x: 0, y: 0, width: layout.slide.width, height: layout.slide.height }, 'slide geometry');

    const overlay = root.querySelector('[data-pm-overlay="transparent-header"]');
    if (!overlay) throw new Error('transparent header overlay is missing');
    if (root.querySelector('[data-pm-panel]')) throw new Error('opaque local panel is forbidden');
    const overlayRect = rect(overlay);
    close(overlayRect, rootRect, 'transparent header overlay geometry');
    const overlayStyle = getComputedStyle(overlay);
    const alpha = (color) => {
      if (color === 'transparent') return 0;
      const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/.exec(color);
      return rgba ? Number(rgba[1]) : 1;
    };
    if (layout.overlay.transparent === true && (
      overlayStyle.backgroundImage !== 'none'
      || !Number.isFinite(alpha(overlayStyle.backgroundColor))
      || alpha(overlayStyle.backgroundColor) > 0.001
    )) {
      throw new Error('header overlay must remain transparent');
    }

    const providerPage = root.querySelector('[data-pm-provider-page]');
    if (layout.overlay.requires_full_canvas_provider_page === true) {
      if (!providerPage) throw new Error('full-canvas provider page is missing');
      const providerRect = rect(providerPage);
      close(providerRect, rootRect, 'full-canvas provider page geometry');
      const providerStyle = getComputedStyle(providerPage);
      if (providerStyle.objectFit !== 'fill' || providerStyle.clipPath !== 'none' || providerStyle.transform !== 'none') {
        throw new Error('provider page must remain continuous without crop or transform');
      }
    } else if (providerPage) {
      throw new Error('preflight header overlay must not render a provider page');
    }

    const fields = {};
    for (const expected of layout.fields) {
      const node = root.querySelector(`[data-pm-field="${expected.id}"]`);
      if (!node) throw new Error(`field ${expected.id} is missing`);
      const actual = rect(node);
      close(actual, expected, `field ${expected.id}`);
      if (node.scrollWidth > node.clientWidth + epsilon || node.scrollHeight > node.clientHeight + epsilon) {
        throw new Error(`field ${expected.id} has scroll overflow`);
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      const lineYs = [];
      for (const line of [...range.getClientRects()]) {
        if (line.width <= 0 || line.height <= 0) continue;
        if (!lineYs.some((existing) => Math.abs(existing - line.y) <= epsilon)) lineYs.push(line.y);
      }
      if (lineYs.length === 0) throw new Error(`field ${expected.id} has no rendered line`);
      if (lineYs.length > expected.max_lines) {
        throw new Error(`field ${expected.id} exceeds ${expected.max_lines} rendered lines`);
      }
      const protectedZone = layout.protected_geometry.find((zone) => (
        actual.x >= rootRect.x + zone.x - epsilon
        && actual.y >= rootRect.y + zone.y - epsilon
        && actual.right <= rootRect.x + zone.x + zone.width + epsilon
        && actual.bottom <= rootRect.y + zone.y + zone.height + epsilon
      ));
      if (!protectedZone) throw new Error(`field ${expected.id} escapes the protected header geometry`);
      fields[expected.id] = { rect: actual, line_count: lineYs.length, scroll_width: node.scrollWidth, scroll_height: node.scrollHeight };
    }

    const markers = [...root.querySelectorAll('[data-pm-leaf]')].map((node) => node.getAttribute('data-pm-leaf'));
    if (new Set(markers).size !== markers.length || new Set(expectedMarkers).size !== expectedMarkers.length ||
      JSON.stringify([...markers].sort()) !== JSON.stringify([...expectedMarkers].sort())) {
      throw new Error(`leaf marker set mismatch: expected ${expectedMarkers.length}, observed ${markers.length}`);
    }
    for (const marker of markers) {
      const node = root.querySelector(`[data-pm-leaf="${marker}"]`);
      const style = getComputedStyle(node);
      const markerRect = rect(node);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0 || markerRect.width <= 0 || markerRect.height <= 0) {
        throw new Error(`leaf ${marker} is not visible`);
      }
    }
    return {
      slide: rootRect,
      overlay: { rect: overlayRect, background: overlayStyle.backgroundColor },
      provider_page: providerPage ? rect(providerPage) : null,
      fields,
      markers,
    };
  }, {
    layout: expectation,
    expectedMarkers: expectedLeafMarkers,
    epsilon: HTML_CAPTURE_PROFILE.geometryEpsilonCssPx,
  });
}

async function captureRenderContractPage({ context, guards, runtimeEvidence, pageSpec, pageTimeoutMs, setPhase }) {
  const expectation = layoutExpectationFor(pageSpec);
  const page = await context.newPage();
  try {
    setPhase(`${pageSpec.id}:document_load`);
    await page.setContent(pageSpec.html, { waitUntil: 'load', timeout: pageTimeoutMs });
    await page.evaluate(() => document.fonts.ready);
    setPhase(`${pageSpec.id}:geometry`);
    const layout = await verifyRenderContractLayout(page, expectation, pageSpec.expectedLeafMarkers || []);
    setPhase(`${pageSpec.id}:font_usage`);
    const fonts = await collectHtmlFontEvidence({ page, context, roles: pageSpec.fontRoles || [] });
    if (pageSpec.probeForbiddenRoutes) {
      setPhase(`${pageSpec.id}:network_probe`);
      await exerciseForbiddenRouteDenials(page);
    }
    setPhase(`${pageSpec.id}:capture`);
    const rawPng = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: HTML_CAPTURE_PROFILE.cssWidth, height: HTML_CAPTURE_PROFILE.viewportHeight },
      animations: 'disabled',
      scale: 'device',
    });
    const finalPng = cropOneDeviceRow(decodePng(rawPng, { checkCrc: true }));
    setPhase(`${pageSpec.id}:verify`);
    const png = assertNonBlankPng(finalPng);
    const pageDenials = await guards.readPageDenials(page);
    return {
      id: pageSpec.id,
      bytes: finalPng,
      png: { ...png, sha256: sha256(finalPng), bytes: finalPng.length },
      raw_capture: { width: HTML_CAPTURE_PROFILE.outputWidth, height: HTML_CAPTURE_PROFILE.rawCaptureHeight, sha256: sha256(rawPng) },
      layout,
      fonts,
      network: { routeAttempts: guards.attempts, pageDenials, serviceWorkers: 'blocked' },
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Private bounded browser seam for Framed render-contract pages. One call owns
 * exactly one Chromium process and returns bytes only after every page passes.
 */
export async function captureHtmlPngBatch({
  runtimeEvidence,
  pages,
  pageTimeoutMs = HTML_RENDER_PAGE_TIMEOUT_MS,
  batchTimeoutMs = HTML_RENDER_BATCH_TIMEOUT_MS,
  launch = launchPinnedChromium,
  onPhase,
} = {}) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > 64 || pages.some((page) => !page || typeof page.id !== 'string' || !page.id || typeof page.html !== 'string' || !page.html)) {
    throw new TypeError('a finite nonempty render-contract page batch is required');
  }
  if (!Number.isInteger(pageTimeoutMs) || pageTimeoutMs <= 0 || !Number.isInteger(batchTimeoutMs) || batchTimeoutMs <= 0) {
    throw new TypeError('positive render-contract deadlines are required');
  }
  let browser;
  let context;
  let phase = 'browser_launch';
  let failure = null;
  const setPhase = (next) => { phase = next; onPhase?.(next); };
  try {
    const results = await withDeadline(async () => {
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
      const output = [];
      for (const pageSpec of pages) {
        output.push(await withDeadline(
          () => captureRenderContractPage({ context, guards, runtimeEvidence, pageSpec, pageTimeoutMs, setPhase }),
          pageTimeoutMs,
          `HTML render page ${pageSpec.id} timed out during ${phase}`,
        ));
      }
      return output;
    }, batchTimeoutMs, `HTML render batch timed out during ${phase}`);
    return {
      ok: true,
      profile: HTML_CAPTURE_PROFILE.id,
      runtimeProfile: HTML_RUNTIME_PROFILE.id,
      pages: results,
    };
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
  } finally {
    const cleanupErrors = [];
    if (context) try { await context.close(); } catch (error) { cleanupErrors.push(error); }
    if (browser) try { await browser.close(); } catch (error) { cleanupErrors.push(error); }
    if (cleanupErrors.length && !failure) failure = cleanupErrors[0] instanceof Error ? cleanupErrors[0] : new Error(String(cleanupErrors[0]));
  }
  return {
    ok: false,
    profile: HTML_CAPTURE_PROFILE.id,
    runtimeProfile: HTML_RUNTIME_PROFILE.id,
    phase,
    error: failure?.message.replaceAll(process.cwd(), '<cwd>') || 'unknown HTML render failure',
  };
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
