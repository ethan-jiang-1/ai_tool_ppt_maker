import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  HTML_FONT_ROOT,
  buildFontInventory,
  parseFontFaces,
  parseUnicodeRanges,
  verifyHtmlFontBundle,
} from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_fonts.mjs';

const INVENTORY_PATH = join(HTML_FONT_ROOT, 'inventory.json');

function injectedRead(replacements = new Map()) {
  return (path, ...args) => {
    const normalized = String(path);
    if (replacements.has(normalized)) return replacements.get(normalized);
    return readFileSync(path, ...args);
  };
}

describe('HTML font bundle', () => {
  it('verifies the canonical official snapshot and fixed bilingual corpus', () => {
    expect(verifyHtmlFontBundle()).toMatchObject({
      ok: true,
      families: ['Source Sans 3', 'Noto Sans SC'],
      fontFiles: 102,
      sentinelCoverage: true,
      actualDeckCoverage: false,
    });
  });

  it('records original/local CSS identity and every referenced file', () => {
    const inventory = buildFontInventory();
    expect(inventory.snapshot).toMatchObject({
      servedPath: 's/notosanssc/v40',
      faceCount: 101,
    });
    expect(inventory.css.map((entry) => entry.path)).toEqual([
      'source-sans-3/local.css',
      'noto-sans-sc/original.css',
      'noto-sans-sc/local.css',
    ]);
    expect(inventory.files.filter((entry) => entry.role === 'noto-sans-sc-shard')).toHaveLength(101);
    expect(inventory.files.every((entry) => entry.bytes > 0 && /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
  });

  it('parses the controlled CSS without accepting malformed or conflicting ranges', () => {
    expect(parseFontFaces("@font-face { font-family: 'X'; font-style: normal; font-weight: 400; src: url('./x.woff2'); unicode-range: U+41-5A; }")).toHaveLength(1);
    expect(() => parseUnicodeRanges('U+NOPE')).toThrow(/Malformed/);
    expect(() => parseUnicodeRanges('U+0041-005A, U+0050-0060')).toThrow(/Conflicting/);
  });

  it('fails on digest drift', () => {
    const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'));
    const fontPath = join(HTML_FONT_ROOT, ...inventory.files[0].path.split('/'));
    const replacements = new Map([[fontPath, Buffer.from('drift')]]);
    expect(verifyHtmlFontBundle({ readFile: injectedRead(replacements) })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/not coherent/),
    });
  });

  it('fails when CSS and inventory disagree or CSS uses local()', () => {
    const cssPath = join(HTML_FONT_ROOT, 'source-sans-3', 'local.css');
    const replacements = new Map([[cssPath, Buffer.from(readFileSync(cssPath, 'utf8').replace("url('./SourceSans3VF", "local('Source Sans 3'), url('./SourceSans3VF"))]]);
    expect(verifyHtmlFontBundle({ readFile: injectedRead(replacements) }).ok).toBe(false);
  });

  it('fails when legal material is missing', () => {
    const missing = join(HTML_FONT_ROOT, 'licenses', 'NOTO-SANS-SC-OFL.txt');
    const exists = (path) => String(path) !== missing;
    expect(verifyHtmlFontBundle({ exists, stat: statSync })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/material is missing/),
    });
  });

  it('fails when the fixed sentinel exceeds declared coverage', () => {
    const sentinelPath = join(HTML_FONT_ROOT, 'sentinels.json');
    const sentinels = JSON.parse(readFileSync(sentinelPath, 'utf8'));
    sentinels.latin.text += '\u{10FFFF}';
    const replacements = new Map([[sentinelPath, Buffer.from(JSON.stringify(sentinels))]]);
    expect(verifyHtmlFontBundle({ readFile: injectedRead(replacements) })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/unsupported code points/),
    });
  });

  it('keeps one font authority and no third-party font toolchain', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
    expect(dependencies.some((name) => /fontsource|fonttools/i.test(name))).toBe(false);
    expect(HTML_FONT_ROOT).toBe(join(process.cwd(), 'PPTMAKER_FRAMEWORK', 'scripts', 'fonts'));

    const frameworkRoot = join(process.cwd(), 'PPTMAKER_FRAMEWORK');
    const frameworkDirectories = readdirSync(frameworkRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(frameworkDirectories).toEqual(['charter', 'playbook', 'reference', 'scripts', 'workflow']);
    const fontDirectories = readdirSync(frameworkRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name === 'fonts')
      .map((entry) => join(entry.parentPath, entry.name));
    expect(fontDirectories).toEqual([HTML_FONT_ROOT]);

    const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'));
    expect(inventory.files.every((entry) => !/(?:^|\/)(?:deck_|_generated)/.test(entry.path))).toBe(true);
    for (const cssPath of ['source-sans-3/local.css', 'noto-sans-sc/local.css']) {
      expect(readFileSync(join(HTML_FONT_ROOT, ...cssPath.split('/')), 'utf8')).not.toMatch(/https?:\/\//);
    }

    const readme = readFileSync(join(HTML_FONT_ROOT, 'README.md'), 'utf8');
    expect(readme).toMatch(/sole canonical distribution root/);
    expect(readme).toMatch(/does not promise.*full CJK/i);
    expect(readme).not.toMatch(/deck_.*(?:font|WOFF2)/i);
  });
});
