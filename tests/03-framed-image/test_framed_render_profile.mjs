import { describe, expect, it } from 'vitest';

import { HTML_RUNTIME_PROFILE } from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime_profile.mjs';
import { HTML_CAPTURE_PROFILE } from '../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/capture_runtime.mjs';
import {
  compileFramedLayoutGeometry,
  createFramedRenderProfile,
  FRAMED_FONT_SELECTION_ALGORITHM,
  FRAMED_LAYOUT_COMPILER,
  FRAMED_LAYOUT_COMPILER_COHERENCE_HISTORY,
  FRAMED_RENDER_PROFILE_SCHEMA,
} from '../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_render_profile.mjs';
import { FRAMED_TEXT_FRAME_STANDARD_V1 } from '../../PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs';
import { canonicalJsonSha256 } from '../../PPTMAKER_FRAMEWORK/scripts/shared/identity/canonical_json.mjs';

const fontRenderInventory = Object.freeze({
  schema: 'pptmaker-framed-font-render-inventory-v1',
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
  return createFramedRenderProfile({
    preset: FRAMED_TEXT_FRAME_STANDARD_V1,
    layoutCompiler: FRAMED_LAYOUT_COMPILER,
    fontRenderInventory,
    fontSelectionAlgorithm: FRAMED_FONT_SELECTION_ALGORITHM,
    runtime: HTML_RUNTIME_PROFILE,
    capture: HTML_CAPTURE_PROFILE,
    ...input,
  });
}

describe('Framed render profile', () => {
  it('builds one canonical identity from declared pixel-producing inputs', () => {
    expect(profile()).toMatchObject({
      schema: FRAMED_RENDER_PROFILE_SCHEMA,
      preset: { id: 'standard-v1', digest: expect.any(String) },
      layout_compiler: FRAMED_LAYOUT_COMPILER,
      font_render_inventory: { schema: fontRenderInventory.schema, digest: expect.any(String) },
      font_selection_algorithm: FRAMED_FONT_SELECTION_ALGORITHM,
      runtime: { id: HTML_RUNTIME_PROFILE.id },
      capture: { id: HTML_CAPTURE_PROFILE.id },
      render_profile_digest: expect.any(String),
    });
  });

  it('normalizes input ordering and excludes host or page-specific values', () => {
    const reordered = {
      schema: fontRenderInventory.schema,
      faces: [...fontRenderInventory.faces].reverse().map((face) => ({ host_path: '/different/machine/font-cache', ...face, unicode_ranges: [...face.unicode_ranges].reverse() })),
      families: fontRenderInventory.families.map((family) => ({ host_path: '/different/machine/font-cache', ...family })),
    };
    const first = profile({ textFrame: { title: 'First title' }, selectedFaces: ['host-only'], pageObservation: { width: 123 }, underlayBytes: Buffer.from('a') });
    const second = profile({ fontRenderInventory: reordered, textFrame: { title: 'Second title' }, selectedFaces: ['different-host-only'], pageObservation: { width: 456 }, underlayBytes: Buffer.from('b') });
    expect(second.render_profile_digest).toBe(first.render_profile_digest);
  });

  it.each([
    ['normalized preset', () => {
      const preset = structuredClone(FRAMED_TEXT_FRAME_STANDARD_V1);
      preset.theme.panel = '#ffffff';
      return { preset };
    }],
    ['layout compiler', () => ({ layoutCompiler: { ...FRAMED_LAYOUT_COMPILER, version: '2' } })],
    ['font render inventory', () => ({
      fontRenderInventory: {
        ...fontRenderInventory,
        faces: fontRenderInventory.faces.map((face, index) => index === 0 ? { ...face, sha256: 'c'.repeat(64) } : face),
      },
    })],
    ['font selection algorithm', () => ({ fontSelectionAlgorithm: 'pptmaker-framed-font-selection-v2' })],
    ['pinned runtime', () => ({ runtime: { ...HTML_RUNTIME_PROFILE, chromiumBrowserVersion: '149.0.7827.56' } })],
    ['capture profile', () => ({ capture: { ...HTML_CAPTURE_PROFILE, reencode: 'different-pixel-capture-v2' } })],
  ])('changes its digest when %s changes', (_name, changed) => {
    expect(profile(changed()).render_profile_digest).not.toBe(profile().render_profile_digest);
  });

  it('keeps non-pixel metadata and Text Frame-only values outside the profile', () => {
    const preset = { ...FRAMED_TEXT_FRAME_STANDARD_V1, host_path: '/private/host-a' };
    const first = profile({
      preset,
      textFrame: { title: 'First title' },
      selectedFaces: ['a.woff2'],
      pageObservation: { scroll_width: 1 },
      underlayBytes: Buffer.from('first'),
    });
    const second = profile({
      preset: { ...preset, host_path: '/private/host-b', editorial_note: 'not pixels' },
      fontRenderInventory: {
        ...fontRenderInventory,
        note: 'not pixels',
        faces: fontRenderInventory.faces.map((face) => ({ ...face, source_url: 'https://example.invalid/font' })),
      },
      runtime: { ...HTML_RUNTIME_PROFILE, executablePath: '/private/host-b/chromium' },
      capture: { ...HTML_CAPTURE_PROFILE, temporary_root: '/private/host-b/tmp' },
      textFrame: { title: 'Updated title' },
      selectedFaces: ['b.woff2'],
      pageObservation: { scroll_width: 999 },
      underlayBytes: Buffer.from('second'),
    });
    expect(second.render_profile_digest).toBe(first.render_profile_digest);
  });

  it('requires a new compiler identity when the canonical geometry fixture changes', () => {
    const actualFixtureDigest = canonicalJsonSha256(compileFramedLayoutGeometry());
    const current = FRAMED_LAYOUT_COMPILER_COHERENCE_HISTORY.at(-1);
    expect(current).toEqual({ version: FRAMED_LAYOUT_COMPILER.version, fixture_sha256: actualFixtureDigest });
    expect(new Set(FRAMED_LAYOUT_COMPILER_COHERENCE_HISTORY.map((entry) => entry.version)).size)
      .toBe(FRAMED_LAYOUT_COMPILER_COHERENCE_HISTORY.length);
  });
});
