import { describe, it, expect } from 'vitest';

describe('stage3_lock_headers', () => {
  it('module exists and is importable', async () => {
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs');
    expect(mod).toBeDefined();
  });

  it('uses resolved mode only, independent of render_mode_source', async () => {
    const { contractRenderMode } = await import(
      '../PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs'
    );
    for (const source of [
      'explicit',
      'policy:exception',
      'derived:hero_type',
      'policy:default',
      'derived:visual_type',
    ]) {
      expect(contractRenderMode({ render_mode: 'full-page', render_mode_source: source })).toBe(
        'full-page'
      );
      expect(
        contractRenderMode({ render_mode: 'body+header-lock', render_mode_source: source })
      ).toBe('body+header-lock');
    }
  });
});
