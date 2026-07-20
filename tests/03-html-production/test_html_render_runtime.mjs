import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverNpmPackages } from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs';
import { inspectHtmlRuntime } from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs';
import { captureHtmlPng, HTML_CAPTURE_PROFILE } from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_render_runtime.mjs';

const ROOT = process.cwd();
const FONT_ROOT = join(ROOT, 'PPTMAKER_FRAMEWORK', 'scripts', 'fonts');
const dataUrl = (path) => `data:font/woff2;base64,${readFileSync(path).toString('base64')}`;

function inlineFontCss() {
  const source = dataUrl(join(FONT_ROOT, 'source-sans-3', 'SourceSans3VF-Upright.ttf.woff2'));
  const notoDir = join(FONT_ROOT, 'noto-sans-sc', 'files');
  const notoCss = readFileSync(join(FONT_ROOT, 'noto-sans-sc', 'local.css'), 'utf8').replaceAll(/url\(\.\/files\/([^\)]+)\)/g, (_, file) => `url(${dataUrl(join(notoDir, file))})`);
  return `@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:100 900;font-display:block;src:url(${source}) format('woff2');}\n${notoCss}`;
}

const HTML = `<!doctype html><html lang="und"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; frame-src 'none'; child-src 'none'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none';"><style>${inlineFontCss()}html,body{margin:0;padding:0;width:1000px;height:563px;overflow:hidden;background:#f7f8fa} [data-pptmaker-slide]{position:relative;width:1000px;height:562.5px;background:#f7f8fa;color:#132238;font-family:'Source Sans 3';font-size:32px;line-height:1.2} .role{position:absolute;left:60px;white-space:nowrap}.latin{top:55px;font-family:'Source Sans 3'}.han{top:125px;font-family:'Noto Sans SC'}.mixed{top:195px;font-family:'Source Sans 3','Noto Sans SC'}.svg-role{position:absolute;left:60px;top:265px;width:400px;height:100px}.svg-role text{font-family:'Noto Sans SC';font-size:32px;fill:#2d5b9b}</style></head><body><main data-pptmaker-slide><div class="role latin" id="latin">PPT 2026</div><div class="role han" id="han">中文标题</div><div class="role mixed" id="mixed">Hello 中文</div><svg class="svg-role" viewBox="0 0 400 100" aria-label="svg text"><text id="svg-text" x="0" y="45">中文图形</text></svg></main></body></html>`;

async function runtime() {
  const discovered = discoverNpmPackages(ROOT).playwright;
  return inspectHtmlRuntime({ playwrightRoot: discovered.root, playwrightVersion: discovered.version });
}

describe('pinned HTML capture runtime', () => {
  it('captures the exact profile with deterministic fractional re-encode and cleanup', async () => {
    const evidence = await runtime();
    expect(evidence.ok).toBe(true);
    const options = {
      runtimeEvidence: evidence,
      html: HTML,
      fontRoles: [
        { name: 'html-latin', selector: '#latin', family: 'Source Sans 3', platformFamily: 'SourceSans3VF' },
        { name: 'html-han', selector: '#han', family: 'Noto Sans SC', platformFamily: 'Noto Sans SC Thin' },
        { name: 'html-mixed', selector: '#mixed', families: ['SourceSans3VF', 'Noto Sans SC Thin'] },
        { name: 'svg-text', selector: '#svg-text', family: 'Noto Sans SC', platformFamily: 'Noto Sans SC Thin', svg: true },
      ],
      probeForbiddenRoutes: true,
    };
    const first = await captureHtmlPng(options);
    const second = await captureHtmlPng(options);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.png.width).toBe(HTML_CAPTURE_PROFILE.outputWidth);
    expect(first.png.height).toBe(HTML_CAPTURE_PROFILE.outputHeight);
    expect(first.rawCapture.width).toBe(2000);
    expect(first.rawCapture.height).toBe(1126);
    expect(first.png.sha256).toBe(second.png.sha256);
    expect(first.rawCapture.sha256).toBe(second.rawCapture.sha256);
    expect(first.png.visiblePixels).toBeGreaterThan(0);
    expect(first.geometry.width).toBeCloseTo(1000, 1);
    expect(first.geometry.height).toBeCloseTo(562.5, 1);
    expect(first.network.routeAttempts).toHaveLength(0);
    expect(first.networkProbe).toHaveLength(9);
    expect(first.networkProbe.every(({ denied }) => denied)).toBe(true);
    expect(first.fonts['html-latin'].fonts[0].isCustomFont).toBe(true);
    expect(first.fonts['html-han'].fonts[0].glyphCount).toBeGreaterThan(0);
    expect(first.fonts['svg-text'].boxes[0].width).toBeGreaterThan(0);
    expect(first.fonts['svg-text'].boxes[0].height).toBeGreaterThan(0);
    expect(first.fonts['html-mixed'].boxes[0].width).toBeGreaterThan(0);
  }, 60_000);

  it('fails closed on geometry drift before screenshot publication', async () => {
    const evidence = await runtime();
    const result = await captureHtmlPng({ runtimeEvidence: evidence, html: HTML.replace('height:562.5px', 'height:561px') });
    expect(result.ok).toBe(false);
    expect(result.phase).toBe('geometry');
    expect(result.error).toMatch(/geometry/);
  }, 60_000);

  it('keeps the final PNG hash a raw-byte identity', async () => {
    const evidence = await runtime();
    const result = await captureHtmlPng({ runtimeEvidence: evidence, html: HTML });
    expect(result.ok).toBe(true);
    expect(createHash('sha256').update(result.bytes).digest('hex')).toBe(result.png.sha256);
  }, 60_000);

  it('times out and always closes a partially opened browser', async () => {
    let closed = false;
    const fakeBrowser = {
      newContext: () => new Promise(() => {}),
      close: async () => { closed = true; },
    };
    const result = await captureHtmlPng({
      runtimeEvidence: { ok: true },
      html: '<main data-pptmaker-slide style="width:1000px;height:562.5px"></main>',
      timeoutMs: 25,
      launch: async () => fakeBrowser,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/);
    expect(closed).toBe(true);
  });
});
