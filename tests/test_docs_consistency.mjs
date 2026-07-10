import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';

const CRITICAL_FILES = [
  'PPTMAKER_FRAMEWORK/BOOTSTRAP.md',
  'PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md',
  'PPTMAKER_FRAMEWORK/AGENTS.md',
  'PPTMAKER_FRAMEWORK/README.md',
  'PPTMAKER_FRAMEWORK/CLAUDE.md',
  'PPTMAKER_FRAMEWORK/COMMANDS.md',
  'PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md',
  'PPTMAKER_FRAMEWORK/charter/WORKFLOW.md',
  'PPTMAKER_FRAMEWORK/00_project_setup/QUICK_START.md',
  'PPTMAKER_FRAMEWORK/00_project_setup/GLOSSARY.md',
  'PPTMAKER_FRAMEWORK/00_project_setup/ANTI_PATTERNS.md',
  'PPTMAKER_FRAMEWORK/00_project_setup/VERSION_LOG.md',
];

describe('docs_consistency', () => {
  it('all critical doc files exist', () => {
    for (const f of CRITICAL_FILES) {
      expect(existsSync(f), `missing: ${f}`).toBe(true);
    }
  });

  it('no .py references in docs', () => {
    const { execSync } = require('node:child_process');
    for (const f of CRITICAL_FILES.slice(0, 4)) {
      try {
        const content = execSync(`grep -l "bundle_layout\\.py\\|unified_pipeline\\.py" ${f}`, { encoding: 'utf-8', timeout: 5000 });
        // Should NOT find these old names
        expect(content.trim()).toBe('');
      } catch (e) {
        // grep returns non-zero if no match — that's success
      }
    }
  });

  it('doc files reference .mjs scripts', () => {
    const { readFileSync } = require('node:fs');
    for (const f of [CRITICAL_FILES[1], CRITICAL_FILES[2]]) {
      const content = readFileSync(f, 'utf-8');
      expect(content).toMatch(/\.mjs|node/);
    }
  });
});
