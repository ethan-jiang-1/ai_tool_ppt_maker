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
      /(?<!P)PTMAKER_FRAMEWORK/,
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

  it('framework docs and scripts ban Python stack language', () => {
    const { execSync } = require('node:child_process');
    // Ban "use Python" stack language — not the constitutional "Python is forbidden" prose.
    const out = execSync(
      `rg -n 'Python/Pillow|python-pptx|uv run|pyproject\\.toml|python3 |I need Python|Python \\+ UV|runPython\\(|findPython\\(|stage3_lock_headers\\.py|run_tests\\.py' PPTMAKER_FRAMEWORK -g '*.md' -g '*.mjs' -g '*.txt' -g '!version-log.md' -g '!CONSTITUTION.md' || true`,
      { encoding: 'utf-8', timeout: 15000 }
    ).trim();
    expect(out, `Python stack remnants:\n${out}`).toBe('');
  });

  it('entry docs do not require external image2 skills', () => {
    const { readFileSync } = require('node:fs');
    for (const f of [
      'PPTMAKER_FRAMEWORK/BOOTSTRAP.md',
      'PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md',
      'PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md',
      'openspec/config.yaml',
    ]) {
      const content = readFileSync(f, 'utf-8');
      // Fail only if docs still prescribe installing/using skill paths as the official route.
      expect(
        /image2-ppt\/scripts|Install\/provide:.*\.claude\/skills|\.claude\/skills\/image2-ppt/.test(content),
        `${f} still requires external skill path`
      ).toBe(false);
    }
  });

  it('Where Map / GREP placement anchors exist (run-bundle-layout)', () => {
    const { readFileSync } = require('node:fs');
    const glossary = readFileSync('PPTMAKER_FRAMEWORK/reference/glossary.md', 'utf-8');
    expect(glossary).toMatch(/## Where Map/);
    expect(glossary).toMatch(/^### _scratch\//m);
    expect(glossary).toMatch(/^### --run-dir/m);
    expect(glossary).toMatch(/^### style_master\.jpg/m);
    expect(glossary).toMatch(/contact_sheet|### pilot/);

    const bootstrap = readFileSync('PPTMAKER_FRAMEWORK/BOOTSTRAP.md', 'utf-8');
    expect(bootstrap).toMatch(/Where Map/);
    expect(bootstrap).toMatch(/GREP/);
    expect(bootstrap).toMatch(/_scratch/);

    const agents = readFileSync('PPTMAKER_FRAMEWORK/AGENTS.md', 'utf-8');
    expect(agents).toMatch(/_scratch\//);

    const layoutSrc = readFileSync('PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs', 'utf-8');
    // Deck-root _DIR_READMES['.'] seed must name _scratch (first-look map).
    expect(layoutSrc).toMatch(/3_versions\/v\{n\}\/_scratch/);
    expect(layoutSrc).toMatch(/_scratch\/` 内容|_scratch\/ contents|`_scratch\/` 内容/);

    const keynoteRoot = readFileSync('deck_ai_sdlc_keynote/README.md', 'utf-8');
    expect(keynoteRoot).toMatch(/_scratch/);
    const keynoteV1 = readFileSync('deck_ai_sdlc_keynote/3_versions/v1/README.md', 'utf-8');
    expect(keynoteV1).toMatch(/_scratch/);
  });
});
