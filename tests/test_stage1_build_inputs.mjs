import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  configureVisualConfig,
  parseSlides,
  validateSpecRecords,
  validateSpecs,
} from '../PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs';
import { parseCliErrorLine } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';
import { DEFAULT_CONFIG } from '../PPTMAKER_FRAMEWORK/scripts/visual_config.mjs';

const STAGE1 = 'PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs';

function slide(id, {
  number = 1,
  visualType = 'Framework',
  renderMode = '',
  kicker = 'CONTEXT',
  title = 'A precise title',
  subtitle = '',
  prompt = 'Create a clear visual with two large labeled panels.',
} = {}) {
  return `## Slide ${String(number).padStart(2, '0')}: ${id}\n\n` +
    `**VISUAL TYPE**: ${visualType}\n` +
    (renderMode ? `**RENDER MODE**: ${renderMode}\n` : '') +
    `**KICKER**: ${kicker}\n` +
    `**TITLE**: ${title}\n` +
    (subtitle ? `**SUBTITLE**: ${subtitle}\n` : '') +
    `**IMAGE PROMPT**: ${prompt}\n`;
}

function specFile(content) {
  const dir = mkdtempSync(join(tmpdir(), 'ppt-stage1-'));
  const path = join(dir, 'slide-specifications.md');
  writeFileSync(path, content, 'utf-8');
  return path;
}

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

  it('keeps legacy derivation while a present policy defaults content to full-page', () => {
    configureVisualConfig(DEFAULT_CONFIG);
    const legacy = specFile(slide('legacy_content'));
    const policy = specFile(
      `---\nrender:\n  default: full-page\n  header-lock: []\n---\n` + slide('policy_content')
    );
    const legacyResult = parseSlides([legacy]);
    const policyResult = parseSlides([policy]);
    expect(legacyResult.plan[0].layout_contract).toMatchObject({
      render_mode: 'body+header-lock',
      render_mode_source: 'derived:visual_type',
    });
    expect(policyResult.plan[0].layout_contract).toMatchObject({
      render_mode: 'full-page',
      render_mode_source: 'policy:default',
      header_safe_zone: 0,
    });
  });

  it('supports policy exceptions and canonicalizes the template divider alias', () => {
    const path = specFile(
      `---\nrender:\n  default: body+header-lock\n  header-lock: [content]\n---\n` +
      slide('divider', { visualType: 'section   divider' }) + '\n' +
      slide('content', { number: 2 })
    );
    const { plan } = parseSlides([path]);
    expect(plan[0].visual_type).toBe('Section Divider / Bridge');
    expect(plan[0].layout_contract.render_mode_source).toBe('derived:hero_type');
    expect(plan[1].layout_contract.render_mode_source).toBe('policy:exception');
  });

  it('fails closed on unknown render keys and exception ids', () => {
    const typo = specFile(
      `---\nrender:\n  default: full-page\n  header_lock: []\n---\n` + slide('s1')
    );
    expect(validateSpecs([typo]).join('\n')).toMatch(/unknown render key.*header_lock/i);

    const unknown = specFile(
      `---\nrender:\n  header-lock: [missing]\n---\n` + slide('s1')
    );
    expect(validateSpecs([unknown]).join('\n')).toMatch(/unknown slide id.*missing/i);
  });

  it('requires VISUAL TYPE under policy and warns for a content full-page missing title', () => {
    const missingType = specFile(
      `---\nrender: {}\n---\n` + slide('s1', { visualType: '[TYPE]' })
    );
    expect(validateSpecs([missingType]).join('\n')).toMatch(/requires a real VISUAL TYPE/i);

    const missingTitle = specFile(
      `---\nrender: {}\n---\n` + slide('s1', { title: '' })
    );
    const messages = validateSpecs([missingTitle]);
    expect(messages.some((m) => m.startsWith('ERROR:'))).toBe(false);
    expect(messages.join('\n')).toMatch(/content full-page slide has no real TITLE/i);
  });

  it('assembles distinct content, hero, and body-lock header contracts', () => {
    const contentPath = specFile(`---\nrender: {}\n---\n` + slide('content'));
    const heroPath = specFile(`---\nrender: {}\n---\n` + slide('hero', {
      visualType: 'Title / Opener', title: 'Hero exact text', kicker: '(none)',
    }));
    const bodyA = specFile(slide('body', { renderMode: 'body+header-lock', title: 'First title' }));
    const bodyB = specFile(slide('body', { renderMode: 'body+header-lock', title: 'Second title' }));

    const contentPrompt = parseSlides([contentPath]).prompts[0].prompt;
    const hero = parseSlides([heroPath]);
    const promptA = parseSlides([bodyA]).prompts[0].prompt;
    const promptB = parseSlides([bodyB]).prompts[0].prompt;

    expect(contentPrompt).toContain('HEADER PLACEMENT - ABSOLUTE SOFT TARGET');
    expect(contentPrompt).toContain('TITLE: "A precise title"');
    expect(hero.prompts[0].prompt).not.toContain('HEADER PLACEMENT');
    expect(hero.prompts[0].prompt).toContain('TITLE: "Hero exact text"');
    expect(hero.plan[0]).not.toHaveProperty('kicker');
    expect(promptA).toBe(promptB);
    expect(promptA).not.toContain('First title');
  });

  it('scopes policies independently across multiple input files', () => {
    const policy = specFile(`---\nrender: {}\n---\n` + slide('new_content'));
    const legacy = specFile(slide('old_content'));
    const { plan } = parseSlides([policy, legacy]);
    expect(plan.map((s) => s.layout_contract.render_mode)).toEqual([
      'full-page',
      'body+header-lock',
    ]);
  });

  it('retains structured source, line, slide, field, reason, and aggregate CLI issues', () => {
    const path = specFile(
      `## Slide 01: s01\n\n` +
      `**VISUAL TYPE**: Framework\n` +
      `**RENDER MODE**: unsupported-mode\n` +
      `**TITLE**: A title\n\n` +
      `## Slide 02: s02\n\n` +
      `**VISUAL TYPE**: Framework\n` +
      `**RENDER MODE**: body+header-lock\n` +
      `**TITLE**: \n`
    );
    const records = validateSpecRecords([path]).filter((record) => record.severity === 'ERROR');
    expect(records.length).toBeGreaterThanOrEqual(3);
    expect(records.find((record) => record.subject.id === 's01' && record.subject.field === 'RENDER MODE')).toMatchObject({
      source: { path, line: 4 },
      reason: { kind: 'invalid_enum', expected: ['full-page', 'body+header-lock'] },
    });
    expect(records.find((record) => record.subject.id === 's02' && record.subject.field === 'TITLE')).toMatchObject({
      reason: { kind: 'missing_required_field' },
    });

    const result = spawnSync('node', [STAGE1, '--spec', path, '--validate'], { encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(1);
    const envelope = parseCliErrorLine(result.stderr.trim().split(/\r?\n/).at(-1));
    expect(envelope.diagnostic.category).toBe('source_validation');
    expect(envelope.diagnostic.issues.length).toBe(records.length);
    expect(envelope.diagnostic.issues.some((issue) => issue.subject?.id === 's01' && issue.source?.line === 4)).toBe(true);
    expect(`${result.stdout}${result.stderr}`).not.toContain('unsupported-mode');
  });

  it('emits stable formal identity, derived position, and mnemonic scheme projection', () => {
    const path = specFile(
      `---\nidentity:\n  scheme: mnemonic-v1\n---\n` +
      slide('DeckGo') + '\n' +
      slide('UXGap', { number: 2 })
    );
    const result = parseSlides([path]);

    expect(result.identity).toEqual({ scheme: 'mnemonic-v1' });
    expect(result.plan).toEqual([
      expect.objectContaining({ id: 'DeckGo', slide_id: 'DeckGo', position: 1 }),
      expect.objectContaining({ id: 'UXGap', slide_id: 'UXGap', position: 2 }),
    ]);
    expect(result.prompts).toEqual([
      expect.objectContaining({
        id: 'DeckGo', slide_id: 'DeckGo', position: 1,
        label: '01 · DeckGo · A precise title',
        out: 'DeckGo.png', prompt_twin: '01--DeckGo.prompt.md',
      }),
      expect.objectContaining({
        id: 'UXGap', slide_id: 'UXGap', position: 2,
        label: '02 · UXGap · A precise title',
        out: 'UXGap.png', prompt_twin: '02--UXGap.prompt.md',
      }),
    ]);
  });

  it('keeps semantic generation inputs stable across reorder-only changes', () => {
    const before = specFile(
      slide('UXGap', { title: 'User experience gap' }) + '\n' +
      slide('AICost', { number: 2, title: 'AI generation cost' })
    );
    const after = specFile(
      slide('AICost', { title: 'AI generation cost' }) + '\n' +
      slide('UXGap', { number: 2, title: 'User experience gap' })
    );
    const first = parseSlides([before]);
    const second = parseSlides([after]);
    const byId = (entries) => Object.fromEntries(entries.map((entry) => [entry.id, entry]));

    expect(byId(second.prompts).UXGap).toMatchObject({
      position: 2,
      out: 'UXGap.png',
      prompt_twin: '02--UXGap.prompt.md',
      prompt: byId(first.prompts).UXGap.prompt,
    });
    expect(byId(second.prompts).AICost).toMatchObject({
      position: 1,
      out: 'AICost.png',
      prompt_twin: '01--AICost.prompt.md',
      prompt: byId(first.prompts).AICost.prompt,
    });
  });

  it('blocks heading drift, duplicate IDs, spoken collisions, and malformed slide headings', () => {
    const drift = specFile(
      slide('DeckGo') + '\n' + slide('UXGap', { number: 7 })
    );
    const driftRecords = validateSpecRecords([drift]);
    expect(driftRecords).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'noncanonical_heading_position' }),
      display: expect.stringMatching(/slides normalize/i),
    }));

    const duplicate = specFile(
      slide('UXGap') + '\n' + slide('UXGap', { number: 2 })
    );
    expect(validateSpecRecords([duplicate])).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'duplicate_slide_id' }),
    }));

    const spoken = specFile(
      slide('UXGap') + '\n' + slide('UxGap', { number: 2 })
    );
    expect(validateSpecRecords([spoken])).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'duplicate_spoken_key' }),
    }));

    const malformed = specFile(slide('DeckGo') + '\n## Slide seven UXGap\n\nNot epilogue.\n');
    expect(validateSpecRecords([malformed])).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'malformed_slide_heading' }),
      source: expect.objectContaining({ line: 8 }),
    }));
  });

  it('accepts markerless legacy IDs and validates every mnemonic-native ID', () => {
    const legacy = specFile(slide('s07_problem'));
    expect(validateSpecRecords([legacy]).filter((record) => record.severity === 'ERROR')).toEqual([]);
    expect(parseSlides([legacy]).plan[0]).toMatchObject({
      id: 's07_problem', slide_id: 's07_problem', position: 1,
    });

    const invalidNative = specFile(
      `---\nidentity:\n  scheme: mnemonic-v1\n---\n` + slide('s07_problem')
    );
    expect(validateSpecRecords([invalidNative])).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'invalid_mnemonic_id' }),
    }));

    const unsupported = specFile(
      `---\nidentity:\n  scheme: future-v2\n---\n` + slide('DeckGo')
    );
    expect(validateSpecRecords([unsupported])).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      reason: expect.objectContaining({ kind: 'unsupported_identity_scheme' }),
    }));
  });

  it('validates local numbering per input and derives positions globally', () => {
    const first = specFile(slide('DeckGo') + '\n' + slide('UXGap', { number: 2 }));
    const second = specFile(slide('AICost') + '\n' + slide('IDFix', { number: 2 }));
    const result = parseSlides([first, second]);
    expect(result.plan.map((entry) => [entry.id, entry.position])).toEqual([
      ['DeckGo', 1], ['UXGap', 2], ['AICost', 3], ['IDFix', 4],
    ]);
    expect(result.prompts.map((entry) => entry.prompt_twin)).toEqual([
      '01--DeckGo.prompt.md', '02--UXGap.prompt.md',
      '03--AICost.prompt.md', '04--IDFix.prompt.md',
    ]);
  });

  it('validates marked source only through the canonical --spec route', () => {
    const temp = mkdtempSync(join(tmpdir(), 'html-stage1-'));
    try {
      const deck = join(temp, 'deck_html');
      const runDir = join(deck, '3_versions', 'v1');
      const style = join(deck, '2_backbone', 'visual-style');
      mkdirSync(runDir, { recursive: true }); mkdirSync(style, { recursive: true });
      copyFileSync(resolve('PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/dark-executive/color_palette.json'), join(style, 'color_palette.json'));
      const path = join(runDir, 'slide-specifications.md');
      writeFileSync(path, `---
production:
  pipeline: html-first-v1
---
## Slide 01: \`HeroGo\`
**VISUAL TYPE**: Title / Opener
**TITLE**: Hello
**CONCEPT**:
- **MUST communicate**: One idea
- **MUST NOT**: Noise
**SLIDE BODY**:
\`\`\`yaml
schema_version: 1
family: hero
\`\`\`
`);
      const valid = spawnSync('node', [STAGE1, '--validate', '--spec', path], { encoding: 'utf8', timeout: 10000 });
      expect(valid.status).toBe(0);
      expect(valid.stdout).toMatch(/complete local contract/);
      const alias = spawnSync('node', [STAGE1, '--validate', '--input', path], { encoding: 'utf8', timeout: 10000 });
      expect(alias.status).toBe(1);
      expect(parseCliErrorLine(alias.stderr.trim().split(/\r?\n/).at(-1)).code).toBe('USAGE');
      const unknown = spawnSync('node', [STAGE1, '--validate', '--spec', path, '--mystery'], { encoding: 'utf8', timeout: 10000 });
      expect(unknown.status).toBe(1);
      const publish = spawnSync('node', [STAGE1, '--spec', path, '--out', join(runDir, '_generated')], { encoding: 'utf8', timeout: 10000 });
      expect(publish.status).toBe(1);
      expect(parseCliErrorLine(publish.stderr.trim().split(/\r?\n/).at(-1)).diagnostic.reason.kind).toBe('html_first_projection_requires_run_dir');
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
