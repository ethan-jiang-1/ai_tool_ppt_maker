import { describe, it, expect } from 'vitest';
import { resolveSlideIds, formatAvailableSlideIds } from '../PPTMAKER_FRAMEWORK/scripts/lib/slide_ids.mjs';

const slides = [
  { id: 's01_opener' },
  { id: 's02_problem' },
  { id: 's03_one_tool_two_modes' },
  { id: 's04_closer' },
];

describe('resolveSlideIds', () => {
  it('resolves exact id', () => {
    expect(resolveSlideIds(['s03_one_tool_two_modes'], slides)).toEqual([
      's03_one_tool_two_modes',
    ]);
  });

  it('resolves s03 prefix', () => {
    expect(resolveSlideIds(['s03'], slides)).toEqual(['s03_one_tool_two_modes']);
  });

  it('resolves 1-based page number', () => {
    expect(resolveSlideIds(['3'], slides)).toEqual(['s03_one_tool_two_modes']);
  });

  it('resolves unique substring', () => {
    expect(resolveSlideIds(['two_modes'], slides)).toEqual([
      's03_one_tool_two_modes',
    ]);
  });

  it('rejects unknown with available ids in message', () => {
    expect(() => resolveSlideIds(['slide_03'], slides)).toThrow(/Available ids/);
  });

  it('rejects ambiguous substring', () => {
    expect(() => resolveSlideIds(['s'], slides)).toThrow(/ambiguous/i);
  });

  it('formatAvailableSlideIds lists ids', () => {
    expect(formatAvailableSlideIds(slides)).toContain('s01_opener');
  });
});
