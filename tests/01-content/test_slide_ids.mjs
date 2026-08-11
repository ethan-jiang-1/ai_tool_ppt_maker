import { describe, it, expect } from 'vitest';
import {
  findNearConfusions,
  formatAvailableSlideIds,
  isMnemonicSlideId,
  normalizeSpokenKey,
  parseMnemonicSlideId,
  resolveSlideBindings,
  validateNewSlideId,
} from '../../ppt_maker_harness/scripts/01-content/internal/slide_ids.mjs';

describe('mnemonic slide identity', () => {
  it.each(['UXGap', 'AIFee', 'IDFix', 'PPTGo', 'AICost', 'WebWin', 'DataWin', 'WebGrow'])(
    'accepts the canonical two-block mnemonic %s',
    (id) => {
      const parsed = parseMnemonicSlideId(id);
      expect(parsed.valid).toBe(true);
      expect(parsed.blocks).toHaveLength(2);
      expect(parsed.blocks.join('')).toBe(id);
      expect(isMnemonicSlideId(id)).toBe(true);
    }
  );

  it.each(['PAIN', 'UX-Gap', 'UXG4p', 'uxgap', 'ABCDEFGHI'])('rejects %s', (id) => {
    expect(parseMnemonicSlideId(id).valid).toBe(false);
  });

  it('rejects IDs outside the mnemonic syntax', () => {
    expect(isMnemonicSlideId('s07_problem')).toBe(false);
    expect(isMnemonicSlideId('')).toBe(false);
  });

  it('normalizes voice-friendly variants without changing formal identity', () => {
    const variants = ['UX gap', 'UXGap', 'uxgap', 'ux-gap', '@UXGap'];
    expect(variants.map(normalizeSpokenKey)).toEqual(Array(variants.length).fill('uxgap'));
  });

  it('reserves deleted formal IDs and spoken keys from deck history', () => {
    const reused = validateNewSlideId('UXGap', { historyIds: ['UXGap'] });
    expect(reused.valid).toBe(false);
    expect(reused.issues.map((issue) => issue.code)).toContain('reserved_formal_id');

    const spoken = validateNewSlideId('UxGap', { historyIds: ['UXGap'] });
    expect(spoken.valid).toBe(false);
    expect(spoken.issues.find((issue) => issue.code === 'reserved_spoken_key')?.conflicts).toEqual([
      'UXGap',
    ]);
  });

  it('reports deterministic near-confusion without auto-correcting', () => {
    expect(findNearConfusions('UXGap', ['UxGat', 'AICost'])).toEqual(['UxGat']);
    const result = validateNewSlideId('UXGap', { currentIds: ['UxGat'] });
    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ severity: 'WARN', code: 'near_confusable_slide_id' })
    );
  });

  it('keeps semantic quality Agent-owned and exposes length preference separately', () => {
    const clearLongerId = validateNewSlideId('DataWin');
    expect(clearLongerId.valid).toBe(true);
    expect(clearLongerId.preferred_length).toBe(false);
    expect(clearLongerId.issues).toEqual([]);

    // AI + Cst is syntactically parseable. Rejecting the forced compression is
    // an authoring judgment, not something the deterministic validator can prove.
    expect(validateNewSlideId('AICst').valid).toBe(true);
  });
});

describe('resolveSlideBindings', () => {
  const mnemonicSlides = [
    { id: 'DeckGo', position: 1, headline: 'Open with the central claim' },
    { id: 'UXGap', position: 2, headline: 'Why the old workflow breaks' },
    { id: 'AICost', position: 3, headline: 'The cost of image generation' },
    { id: 'BodyMap', position: 4, headline: 'Problem framing' },
  ];

  it('uses shared precedence and preserves one binding per original token', () => {
    expect(resolveSlideBindings(['UXGap', 'UX gap', '2'], mnemonicSlides)).toEqual([
      { token: 'UXGap', slide_id: 'UXGap', position: 2, matched_by: 'exact_id' },
      { token: 'UX gap', slide_id: 'UXGap', position: 2, matched_by: 'spoken_key' },
      { token: '2', slide_id: 'UXGap', position: 2, matched_by: 'position' },
    ]);
  });

  it('supports pN and unique title fragments', () => {
    expect(resolveSlideBindings(['p3', 'central claim'], mnemonicSlides)).toEqual([
      { token: 'p3', slide_id: 'AICost', position: 3, matched_by: 'position' },
      { token: 'central claim', slide_id: 'DeckGo', position: 1, matched_by: 'title' },
    ]);
  });

  it('fails closed with bounded position, ID, and title candidates', () => {
    const ambiguous = [
      { id: 'UXGap', headline: 'Cost gap' },
      { id: 'AICost', headline: 'Cost curve' },
    ];
    expect(() => resolveSlideBindings(['cost'], ambiguous)).toThrow(/ambiguous.*01.*UXGap.*Cost gap/i);
  });

  it('does not approximate-select unknown spoken IDs', () => {
    expect(() => resolveSlideBindings(['UXGat'], mnemonicSlides)).toThrow(/matched no slide/i);
  });
});
