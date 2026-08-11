import { describe, expect, it } from 'vitest';

import { HTML_RUNTIME_PROFILE } from '../../ppt_maker_harness/scripts/00-setup/internal/html_runtime_profile.mjs';
import { HTML_CAPTURE_PROFILE } from '../../ppt_maker_harness/scripts/03-framed-image/internal/capture_runtime.mjs';
import {
  compileFramedHeaderOverlayGeometry,
  createFramedHeaderOverlayRenderProfile,
  FRAMED_FONT_SELECTION_ALGORITHM,
  FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER,
  FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER_COHERENCE_HISTORY,
  FRAMED_HEADER_OVERLAY_RENDER_PROFILE_SCHEMA,
} from '../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_profile.mjs';
import { FRAMED_HEADER_OVERLAY_STANDARD } from '../../ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs';
import { canonicalJsonSha256 } from '../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs';

const fontRenderInventory = Object.freeze({
  schema: 'pptmaker-framed-font-render-inventory',
  families: [
    { family: 'Source Sans 3', platform_family_name: 'SourceSans3VF' },
    { family: 'Noto Sans SC', platform_family_name: 'Noto Sans SC Thin' },
  ],
  faces: [
    { path: 'source-sans-3/SourceSans3VF-Upright.ttf.woff2', sha256: 'a'.repeat(64), family: 'Source Sans 3', style: 'normal', weight: '200 900', unicode_ranges: ['U+0000-024F'] },
    { path: 'noto-sans-sc/files/example.woff2', sha256: 'b'.repeat(64), family: 'Noto Sans SC', style: 'normal', weight: '100 900', unicode_ranges: ['U+4E00-9FFF'] },
  ],
});

function profile(input = {}) {
  return createFramedHeaderOverlayRenderProfile({
    preset: FRAMED_HEADER_OVERLAY_STANDARD,
    layoutCompiler: FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER,
    fontRenderInventory,
    fontSelectionAlgorithm: FRAMED_FONT_SELECTION_ALGORITHM,
    runtime: HTML_RUNTIME_PROFILE,
    capture: HTML_CAPTURE_PROFILE,
    ...input,
  });
}

describe('Framed header-overlay render profile', () => {
  it('builds one canonical identity from declared pixel-producing inputs', () => {
    expect(profile()).toMatchObject({
      schema: FRAMED_HEADER_OVERLAY_RENDER_PROFILE_SCHEMA,
      preset: { id: 'standard', digest: expect.any(String) },
      protected_geometry: FRAMED_HEADER_OVERLAY_STANDARD.protected_geometry,
      layout_compiler: FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER,
      font_render_inventory: { schema: fontRenderInventory.schema, digest: expect.any(String) },
      font_selection_algorithm: FRAMED_FONT_SELECTION_ALGORITHM,
      runtime: { id: HTML_RUNTIME_PROFILE.id },
      capture: { id: HTML_CAPTURE_PROFILE.id },
      render_profile_digest: expect.any(String),
    });
  });

  it('normalizes input ordering and excludes host or header-literal values', () => {
    const reordered = {
      schema: fontRenderInventory.schema,
      faces: [...fontRenderInventory.faces].reverse().map((face) => ({ host_path: '/different/machine/font-cache', ...face, unicode_ranges: [...face.unicode_ranges].reverse() })),
      families: fontRenderInventory.families.map((family) => ({ host_path: '/different/machine/font-cache', ...family })),
    };
    const first = profile({ localHeader: { title: 'First title' }, selectedFaces: ['host-only'], pageObservation: { width: 123 }, providerPageBytes: Buffer.from('a') });
    const second = profile({ fontRenderInventory: reordered, localHeader: { title: 'Second title' }, selectedFaces: ['different-host-only'], pageObservation: { width: 456 }, providerPageBytes: Buffer.from('b') });
    expect(second.render_profile_digest).toBe(first.render_profile_digest);
  });

  it.each([
    ['transparent header preset', () => {
      const preset = structuredClone(FRAMED_HEADER_OVERLAY_STANDARD);
      preset.theme.contrast.opacity = 0.33;
      return { preset };
    }],
    ['protected geometry', () => {
      const preset = structuredClone(FRAMED_HEADER_OVERLAY_STANDARD);
      preset.protected_geometry[0].height -= 1;
      return { preset };
    }],
    ['layout compiler', () => ({ layoutCompiler: { ...FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER, version: '3' } })],
    ['font render inventory', () => ({
      fontRenderInventory: {
        ...fontRenderInventory,
        faces: fontRenderInventory.faces.map((face, index) => index === 0 ? { ...face, sha256: 'c'.repeat(64) } : face),
      },
    })],
    ['font selection algorithm', () => ({ fontSelectionAlgorithm: 'pptmaker-framed-font-selection' })],
    ['pinned runtime', () => ({ runtime: { ...HTML_RUNTIME_PROFILE, chromiumBrowserVersion: '149.0.7827.56' } })],
    ['capture profile', () => ({ capture: { ...HTML_CAPTURE_PROFILE, reencode: 'different-pixel-capture' } })],
  ])('changes its digest when %s changes', (_name, changed) => {
    expect(profile(changed()).render_profile_digest).not.toBe(profile().render_profile_digest);
  });

  it('rejects opaque-panel and local-callout preset escape hatches', () => {
    const panelPreset = structuredClone(FRAMED_HEADER_OVERLAY_STANDARD);
    panelPreset.theme.panel = '#ffffff';
    expect(() => profile({ preset: panelPreset })).toThrow(/preset.theme must contain only/);

    const calloutPreset = structuredClone(FRAMED_HEADER_OVERLAY_STANDARD);
    calloutPreset.fields.callout = { ...calloutPreset.fields.title };
    expect(() => profile({ preset: calloutPreset })).toThrow(/preset.fields must contain only/);
  });

  it('requires a new compiler identity when the canonical geometry fixture changes', () => {
    const actualFixtureDigest = canonicalJsonSha256(compileFramedHeaderOverlayGeometry());
    const current = FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER_COHERENCE_HISTORY.at(-1);
    expect(current).toEqual({ version: FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER.version, fixture_sha256: actualFixtureDigest });
    expect(new Set(FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER_COHERENCE_HISTORY.map((entry) => entry.version)).size)
      .toBe(FRAMED_HEADER_OVERLAY_LAYOUT_COMPILER_COHERENCE_HISTORY.length);
  });
});
