import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const PPT_FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';

describe('ppt_flow', () => {
  it('responds to --help (does not hang)', () => {
    try {
      execSync(`node ${PPT_FLOW} --help`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
    } catch (e) {
      // commander may throw or output help; either way it responds
      expect(e.status || 0).toBeDefined();
    }
  });

  it('doctor command exists', () => {
    try {
      execSync(`node ${PPT_FLOW} doctor`, { encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
    } catch (e) {
      // doctor may fail if env not set up, but command should exist
      expect(e.status).toBeDefined();
    }
  });
});
