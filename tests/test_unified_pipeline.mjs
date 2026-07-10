import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const UP = 'PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs';

describe('unified_pipeline', () => {
  it('rejects without run-dir', () => {
    try {
      execSync(`node ${UP}`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      expect(e.stderr || e.stdout || '').toMatch(/run.dir|required|usage/i);
    }
  });
});
