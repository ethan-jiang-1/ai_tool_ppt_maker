import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  HTML_STYLE_REFERENCE_PROJECTION_V1_PATHS,
  HTML_VISUAL_PROJECTION_V1_PATHS,
  buildHtmlStyleReferenceProjectionV1,
  buildHtmlVisualProjectionV1,
  loadHtmlVisualConfig,
  loadVisualConfig,
  loadVisualConfigViews,
  hexToRgba,
} from '../PPTMAKER_FRAMEWORK/scripts/visual_config.mjs';

describe('visual_config', () => {
  it('exports loadVisualConfig and hexToRgba', () => {
    expect(typeof loadVisualConfig).toBe('function');
    expect(typeof hexToRgba).toBe('function');
  });

  it('hexToRgba converts correctly', () => {
    expect(hexToRgba('#ffffff')).toEqual([255, 255, 255, 255]);
    expect(hexToRgba('#000000')).toEqual([0, 0, 0, 255]);
    expect(hexToRgba('#ff0000')).toEqual([255, 0, 0, 255]);
  });

  it('loads built-in defaults when no path given', () => {
    const cfg = loadVisualConfig();
    expect(cfg).toHaveProperty('canvas');
    expect(cfg.canvas.width_px).toBeGreaterThan(0);
    expect(cfg.canvas.height_px).toBeGreaterThan(0);
    expect(cfg).toHaveProperty('header_lock');
  });

  it('loads a real color_palette', () => {
    const cfg = loadVisualConfig('PPTMAKER_FRAMEWORK/01_visual_style_master/presets/dark-executive/color_palette.json');
    expect(cfg.canvas.width_px).toBe(1672);
    expect(cfg.canvas.height_px).toBe(941);
    expect(cfg).toHaveProperty('header_lock');
  });

  it('validates all five HTML-first preset projections without widening legacy output', () => {
    for (const preset of ['clean-clinical', 'corporate-safe', 'dark-executive', 'tech-startup', 'warm-editorial']) {
      const path = resolve(`PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/${preset}/color_palette.json`);
      const legacy = loadVisualConfig(path);
      const views = loadVisualConfigViews(path);
      expect(views.legacy).toEqual(legacy);
      expect(Object.hasOwn(legacy, 'html_first')).toBe(false);
      expect(views.html_first.canvas).toEqual({ width: 1000, height: 562.5 });
      expect(views.html_first.typography.title.families).toEqual(['Source Sans 3', 'Noto Sans SC']);
      expect(views.html_first.geometry.registry).toBe('html-family-geometry-v1');
      expect(loadHtmlVisualConfig(path)).toEqual(views.html_first);
    }
  });

  it('keeps the renderer-neutral authoring template schema-valid', () => {
    const path = resolve('PPTMAKER_FRAMEWORK/workflow/02-visual-system/template-color-palette.json');
    const views = loadVisualConfigViews(path);
    expect(views.data.name).toBe('Visual System Template');
    expect(views.html_first.canvas).toEqual({ width: 1000, height: 562.5 });
    expect(views.html_first.geometry.registry).toBe('html-family-geometry-v1');
  });

  it('keeps the visual and style-reference projection allowlists closed and disjoint', () => {
    const config = loadHtmlVisualConfig(resolve('PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/dark-executive/color_palette.json'));
    expect(HTML_VISUAL_PROJECTION_V1_PATHS.filter((path) => HTML_STYLE_REFERENCE_PROJECTION_V1_PATHS.includes(path))).toEqual([]);
    expect(buildHtmlStyleReferenceProjectionV1(config)).toEqual({ palette: config.palette, image_language: config.image_language });
    expect(buildHtmlVisualProjectionV1(config, { registrySha256: 'a'.repeat(64), record: { boxes: {}, overlays: [] } })).toEqual({
      canvas: config.canvas,
      registry: 'html-family-geometry-v1',
      registry_sha256: 'a'.repeat(64),
      record: { boxes: {}, overlays: [] },
    });
    expect(HTML_VISUAL_PROJECTION_V1_PATHS).toEqual(['canvas', 'geometry.registry', 'geometry.registry_sha256', 'geometry.record']);
    expect(HTML_STYLE_REFERENCE_PROJECTION_V1_PATHS).toHaveLength(14);
  });

  it('rejects duplicate JSON keys on the HTML projection', () => {
    const dir = mkdtempSync(join(tmpdir(), 'html-config-'));
    try {
      const sourcePath = resolve('PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/dark-executive/color_palette.json');
      const path = join(dir, 'color_palette.json');
      const raw = readFileSync(sourcePath, 'utf8').replace('"background": "#0a1628"', '"background": "#0a1628",\n  "background": "#ffffff"');
      writeFileSync(path, raw);
      expect(() => loadVisualConfigViews(path)).toThrow(/map keys must be unique|background/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects invalid UTF-8 and bounded image-language violations without HTML defaults', () => {
    const dir = mkdtempSync(join(tmpdir(), 'html-config-bounds-'));
    try {
      const sourcePath = resolve('PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/dark-executive/color_palette.json');
      const path = join(dir, 'color_palette.json');
      writeFileSync(path, Buffer.from([0xff]));
      expect(() => loadVisualConfigViews(path)).toThrow(/could not read/i);

      const data = JSON.parse(readFileSync(sourcePath, 'utf8'));
      delete data.html_first;
      writeFileSync(path, JSON.stringify(data));
      expect(() => loadVisualConfigViews(path)).toThrow(/html_first/);

      const bounded = JSON.parse(readFileSync(sourcePath, 'utf8'));
      bounded.html_first.image_language.medium = 'M'.repeat(201);
      writeFileSync(path, JSON.stringify(bounded));
      expect(() => loadVisualConfigViews(path)).toThrow(/200 graphemes/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
