import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const S4 = 'PPTMAKER_FRAMEWORK/06_reference_scripts/stage4_build_pptx.mjs';

describe('stage4_build_pptx', () => {
  it('rejects missing inputs', () => {
    try {
      execSync(`node ${S4}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/image|slide.plan|required|usage/i);
    }
  });
});
