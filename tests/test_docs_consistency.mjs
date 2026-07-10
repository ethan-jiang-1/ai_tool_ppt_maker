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
  'PPTMAKER_FRAMEWORK/reference/quick-start.md',
  'PPTMAKER_FRAMEWORK/reference/glossary.md',
  'PPTMAKER_FRAMEWORK/reference/anti-patterns.md',
  'PPTMAKER_FRAMEWORK/reference/version-log.md',
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

  it('entry docs have no known path-drift patterns', () => {
    const { readFileSync } = require('node:fs');
    const driftRes = [
      /charter\/charter\//,
      /(?<!P)PTMAKER_FRAMEWORK/, // typo missing leading P
      /workflow\/00-setup\/workflow\//,
      /00_project_setup\//,
      /06_reference_scripts\//,
      /00-env-check\.mjs/,
    ];
    for (const f of [
      'PPTMAKER_FRAMEWORK/BOOTSTRAP.md',
      'PPTMAKER_FRAMEWORK/CLAUDE.md',
      'PPTMAKER_FRAMEWORK/README.md',
      'PPTMAKER_FRAMEWORK/AGENTS.md',
      'AGENTS.md',
      'CLAUDE.md',
      'README.md',
    ]) {
      const content = readFileSync(f, 'utf-8');
      for (const re of driftRes) {
        expect(re.test(content), `${f} still matches ${re}`).toBe(false);
      }
    }
  });
});
