import { describe, it, expect } from 'vitest';
import { loadVisualConfig, hexToRgba } from '../PPTMAKER_FRAMEWORK/scripts/visual_config.mjs';

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
});
