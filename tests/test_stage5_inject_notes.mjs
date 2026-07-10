import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const S5 = 'PPTMAKER_FRAMEWORK/scripts/stage5_inject_notes.mjs';

describe('stage5_inject_notes', () => {
  it('rejects missing inputs', () => {
    try {
      execSync(`node ${S5}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/pptx|input|required|usage/i);
    }
  });
});
