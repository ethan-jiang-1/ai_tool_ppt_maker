import { describe, expect, it } from 'vitest';
import {
  HTML_COMPONENT_REGISTRY,
  validateAllHtmlComponentVariants,
  validateHtmlComponentProjection,
} from '../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_component_registry.mjs';
import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from '../helpers/html_first_fixture.mjs';
import { createCanonicalHtmlValidatedRunContext, buildHtmlPages } from '../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe('closed HTML component registry', () => {
  it('enumerates exactly all 68 immutable geometry variants', () => {
    expect(Object.keys(HTML_COMPONENT_REGISTRY.variants)).toHaveLength(68);
    expect(validateAllHtmlComponentVariants()).toBe(HTML_COMPONENT_REGISTRY);
    expect(Object.keys(HTML_COMPONENT_REGISTRY.variants).some((key) => key.startsWith('hero--'))).toBe(true);
    expect(Object.keys(HTML_COMPONENT_REGISTRY.variants).some((key) => key.startsWith('visual-focus--'))).toBe(true);
  });

  it('rejects extra boxes, reordered overlays, and unregistered body fields', () => {
    const base = {
      family: 'hero',
      body: { hero_statement: 'x' },
      geometry: { variant: 'hero--statement1--support0--visual0--callout0', boxes: HTML_COMPONENT_REGISTRY.variants['hero--statement1--support0--visual0--callout0'].boxes, overlays: [] },
    };
    expect(validateHtmlComponentProjection(base)).toMatchObject({ family: 'hero' });
    expect(() => validateHtmlComponentProjection({ ...base, geometry: { ...base.geometry, boxes: { ...base.geometry.boxes, arbitrary: [0, 0, 1, 1] } } })).toThrow(/differ|undeclared/);
    expect(() => validateHtmlComponentProjection({ ...base, body: { ...base.body, arbitrary: 'x' } })).toThrow(/outside/);
    expect(() => validateHtmlComponentProjection({ ...base, geometry: { ...base.geometry, overlays: [{ back: 'x', front: 'y' }] } })).toThrow(/overlays/);
  });

  it('checks collection count against the variant rather than trusting source order', () => {
    const variant = 'cards--n3--callout0';
    const base = { family: 'cards', body: { cards: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] }, geometry: { variant, boxes: HTML_COMPONENT_REGISTRY.variants[variant].boxes, overlays: [] } };
    expect(validateHtmlComponentProjection(base).variant).toBe(variant);
    expect(() => validateHtmlComponentProjection({ ...base, body: { cards: base.body.cards.slice(0, 2) } })).toThrow(/count/);
  });

  it('runs registry validation before page construction', () => {
    const fixture = createHtmlFirstRun('registry-render-');
    try {
      writeFileSync(join(fixture.runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ body: 'schema_version: 1\nfamily: cards\ncards:\n  - label: one\n    value: A\n  - label: two\n    value: B\n' }),
      ]));
      const context = createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir });
      expect(buildHtmlPages(context, { dryRun: true }).pages[0].leaf_markers.length).toBeGreaterThan(0);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

