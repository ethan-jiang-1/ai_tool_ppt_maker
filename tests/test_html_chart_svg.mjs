import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ECHARTS_VERSION,
  ZRENDER_VERSION,
  renderEchartsSsrSvg,
  resolveEchartsInstallation,
  rewriteSvgInstanceIds,
  validateClosedEchartsOption,
  validateEchartsSvg,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/html_chart_svg.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ECHARTS_ROOT = join(ROOT, 'node_modules', 'echarts');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const OPTION = Object.freeze({
  animation: false,
  grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', name: 'Series', data: [1, 2, 3] }],
});

describe('closed ECharts SSR runtime', () => {
  it('binds the exact discovered ECharts and zrender installation', () => {
    expect(resolveEchartsInstallation({ echartsRoot: ECHARTS_ROOT })).toMatchObject({
      version: ECHARTS_VERSION,
      zrenderVersion: ZRENDER_VERSION,
    });
    expect(() => resolveEchartsInstallation({ echartsRoot: ECHARTS_ROOT, echartsVersion: '6.0.0' })).toThrow(/6\.1\.0/);
  });

  it('accepts only the closed JSON option vocabulary', () => {
    expect(validateClosedEchartsOption(OPTION)).toEqual(OPTION);
    expect(() => validateClosedEchartsOption({ ...OPTION, animation: true })).toThrow(/animation:false/);
    expect(() => validateClosedEchartsOption({ ...OPTION, dataset: { source: [] } })).toThrow(/outside the closed/);
    expect(() => validateClosedEchartsOption({ ...OPTION, series: [{ type: 'custom', data: [1], renderItem() {} }] })).toThrow();
    expect(() => validateClosedEchartsOption({ ...OPTION, title: { text: 'https://example.invalid' } })).toThrow(/external/);
  });

  it('rewrites ids, local references, and ECharts classes with one deterministic instance prefix', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="clip"><path d="M0 0h1v1z"/></clipPath></defs><path class="zr7-cls-4" clip-path="url(#clip)"/><use href="#clip"/><style>.zr7-cls-4:hover{fill:red}</style></svg>';
    const sourceSvgSha256 = sha256(svg);
    const first = rewriteSvgInstanceIds(svg, { slideId: 'DataArc', fieldPath: 'body.chart', occurrence: 0, sourceSvgSha256 });
    const second = rewriteSvgInstanceIds(svg, { slideId: 'DataArc', fieldPath: 'body.chart', occurrence: 0, sourceSvgSha256 });
    expect(first).toEqual(second);
    expect(first.prefix).toMatch(/^pm-[0-9a-f]{16}-$/);
    expect(first.svg).toContain(`id="${first.prefix}clip"`);
    expect(first.svg).toContain(`url(#${first.prefix}clip)`);
    expect(first.svg).toContain(`href="#${first.prefix}clip"`);
    expect(first.svg).not.toContain('zr7-');
    expect(validateEchartsSvg(first.svg).ids).toBe(1);
  });

  it('structurally rejects active, external, broken, and foreign SVG output', () => {
    expect(() => validateEchartsSvg('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')).toThrow(/forbidden/);
    expect(() => validateEchartsSvg('<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.invalid/x"/></svg>')).toThrow(/local fragment/);
    expect(() => validateEchartsSvg('<svg xmlns="http://www.w3.org/2000/svg"><use href="#missing"/></svg>')).toThrow(/missing/);
    expect(() => validateEchartsSvg('<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="urn:bad"><x:thing/></svg>')).toThrow(/foreign/);
    expect(() => validateEchartsSvg('<svg xmlns="http://www.w3.org/2000/svg"><style>@import "x"</style></svg>')).toThrow(/external/);
  });

  it('canonicalizes repeated in-process SSR renders to byte-identical SVG', async () => {
    const request = { echartsRoot: ECHARTS_ROOT, option: OPTION, width: 1000, height: 562.5, slideId: 'DataArc', fieldPath: 'body.chart', occurrence: 0 };
    const first = await renderEchartsSsrSvg(request);
    const second = await renderEchartsSsrSvg(request);
    expect(first.rawSvg).not.toBe(second.rawSvg);
    expect(first.rawSvgSha256).not.toBe(second.rawSvgSha256);
    expect(first.sourceSvgSha256).toBe(second.sourceSvgSha256);
    expect(first.svg).toBe(second.svg);
    expect(first.sha256).toBe(second.sha256);
    expect(first.svg).not.toMatch(/\bzr\d+-/);
  });
});
