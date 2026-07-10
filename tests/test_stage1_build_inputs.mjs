import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const STAGE1 = 'PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs';

describe('stage1_build_inputs', () => {
  it('shows usage with --help or no args', () => {
    try {
      execSync(`node ${STAGE1}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/spec|validate|usage/i);
    }
  });

  it('rejects missing spec', () => {
    try {
      execSync(`node ${STAGE1} --validate`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/spec|required/i);
    }
  });
});
