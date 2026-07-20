import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const HTML_FONT_ROOT = resolve(MODULE_DIR, '..', '..', 'fonts');

const SOURCE_CSS = 'source-sans-3/local.css';
const NOTO_ORIGINAL_CSS = 'noto-sans-sc/original.css';
const NOTO_LOCAL_CSS = 'noto-sans-sc/local.css';
const SOURCE_LICENSE = 'licenses/SOURCE-SANS-3-OFL.md';
const NOTO_LICENSE = 'licenses/NOTO-SANS-SC-OFL.txt';
const COPYRIGHT = 'COPYRIGHT.txt';
const PROVENANCE = 'PROVENANCE.md';
const SENTINELS = 'sentinels.json';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readBytes(root, path, readFile = readFileSync) {
  return readFile(join(root, ...path.split('/')));
}

function readText(root, path, readFile = readFileSync) {
  return String(readBytes(root, path, readFile));
}

function cssProperty(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`, 'i').exec(block);
  return match?.[1].trim() ?? null;
}

export function parseFontFaces(css) {
  const faces = [];
  for (const match of String(css).matchAll(/@font-face\s*\{([^}]+)\}/gi)) {
    const block = match[1];
    const url = /url\((['"]?)([^)'"\s]+)\1\)/i.exec(block)?.[2] ?? null;
    faces.push({
      family: cssProperty(block, 'font-family')?.replace(/^['"]|['"]$/g, '') ?? null,
      style: cssProperty(block, 'font-style'),
      weight: cssProperty(block, 'font-weight'),
      url,
      unicodeRange: cssProperty(block, 'unicode-range'),
    });
  }
  return faces;
}

export function parseUnicodeRanges(value) {
  if (!value) throw new Error('Font face is missing unicode-range');
  const ranges = String(value).split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
    const match = /^U\+([0-9A-F]{1,6})(?:-([0-9A-F]{1,6}))?$/i.exec(item);
    if (!match) throw new Error(`Malformed unicode range: ${item}`);
    const start = Number.parseInt(match[1], 16);
    const end = Number.parseInt(match[2] ?? match[1], 16);
    if (start > end || end > 0x10ffff) throw new Error(`Invalid unicode range: ${item}`);
    return { value: item.toUpperCase(), start, end };
  });
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].start <= sorted[index - 1].end) {
      throw new Error(`Conflicting unicode ranges: ${sorted[index - 1].value} / ${sorted[index].value}`);
    }
  }
  return ranges;
}

function relativeUrlToPath(cssPath, url) {
  if (!url || /^(?:https?:|data:)/i.test(url)) return null;
  const cssDir = dirname(cssPath);
  const normalized = relative('.', join(cssDir, url)).split(sep).join('/');
  if (normalized.startsWith('../') || normalized === '..') return null;
  return normalized;
}

function fileRecord(root, path, extra = {}, readFile = readFileSync) {
  const bytes = readBytes(root, path, readFile);
  return { path, bytes: bytes.length, sha256: sha256(bytes), ...extra };
}

export function buildFontInventory({ root = HTML_FONT_ROOT, readFile = readFileSync } = {}) {
  const sourceCss = readText(root, SOURCE_CSS, readFile);
  const notoOriginalCss = readText(root, NOTO_ORIGINAL_CSS, readFile);
  const notoLocalCss = readText(root, NOTO_LOCAL_CSS, readFile);
  const sourceFaces = parseFontFaces(sourceCss);
  const originalFaces = parseFontFaces(notoOriginalCss);
  const localFaces = parseFontFaces(notoLocalCss);
  if (sourceFaces.length !== 1 || originalFaces.length === 0 || originalFaces.length !== localFaces.length) {
    throw new Error('Font CSS face inventory is incomplete');
  }

  const sourceFace = sourceFaces[0];
  const sourcePath = relativeUrlToPath(SOURCE_CSS, sourceFace.url);
  const files = [fileRecord(root, sourcePath, {
    role: 'source-sans-3-variable-normal',
    family: sourceFace.family,
    style: sourceFace.style,
    weight: sourceFace.weight,
    unicodeRanges: parseUnicodeRanges(sourceFace.unicodeRange).map((range) => range.value),
    sourceUrl: 'https://raw.githubusercontent.com/adobe-fonts/source-sans/3.052R/WOFF2/VF/SourceSans3VF-Upright.ttf.woff2',
    release: '3.052R',
    originalFilename: 'SourceSans3VF-Upright.ttf.woff2',
    licensePath: SOURCE_LICENSE,
  }, readFile)];

  originalFaces.forEach((face, index) => {
    const localFace = localFaces[index];
    if (
      face.family !== localFace.family
      || face.style !== localFace.style
      || face.weight !== localFace.weight
      || face.unicodeRange !== localFace.unicodeRange
    ) {
      throw new Error(`Noto CSS face ${index} metadata differs after URL rewrite`);
    }
    const path = relativeUrlToPath(NOTO_LOCAL_CSS, localFace.url);
    files.push(fileRecord(root, path, {
      role: 'noto-sans-sc-shard',
      family: face.family,
      style: face.style,
      weight: face.weight,
      unicodeRanges: parseUnicodeRanges(face.unicodeRange).map((range) => range.value),
      sourceUrl: face.url,
      snapshot: 'google-fonts-css-v40-2026-07-18',
      licensePath: NOTO_LICENSE,
      faceIndex: index,
    }, readFile));
  });

  const css = [SOURCE_CSS, NOTO_ORIGINAL_CSS, NOTO_LOCAL_CSS]
    .map((path) => fileRecord(root, path, {}, readFile));
  const totalFontBytes = files.reduce((total, file) => total + file.bytes, 0);

  return {
    schema: 'pptmaker-html-font-inventory-v1',
    generatedFromCommittedSnapshot: '2026-07-18',
    families: [
      { family: 'Source Sans 3', platformFamilyName: 'SourceSans3VF', style: 'normal', weight: '200 900', profile: 'Latin' },
      { family: 'Noto Sans SC', platformFamilyName: 'Noto Sans SC Thin', style: 'normal', weight: '100 900', profile: 'Simplified Chinese (Hans)' },
    ],
    css,
    files,
    legal: {
      copyrightPath: COPYRIGHT,
      provenancePath: PROVENANCE,
      licensePaths: [SOURCE_LICENSE, NOTO_LICENSE],
    },
    sentinelPath: SENTINELS,
    snapshot: {
      id: 'google-fonts-css-v40-2026-07-18',
      requestUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap',
      userAgentClass: 'modern Chromium on Windows x86-64',
      servedPath: 's/notosanssc/v40',
      faceCount: originalFaces.length,
      originalCssSha256: css.find((entry) => entry.path === NOTO_ORIGINAL_CSS).sha256,
    },
    totals: {
      fontFiles: files.length,
      fontBytes: totalFontBytes,
      cssBytes: css.reduce((total, file) => total + file.bytes, 0),
    },
    claims: {
      actualDeckCoverage: false,
      pixelOverflow: false,
      fullCjk: false,
    },
  };
}

function codePoints(text) {
  return [...String(text)].map((character) => character.codePointAt(0));
}

function rangesForFiles(files) {
  return files.flatMap((file) => file.unicodeRanges.map((value) => parseUnicodeRanges(value)[0]));
}

function assertSentinelCoverage(inventory, sentinels) {
  for (const role of ['latin', 'han']) {
    const sentinel = sentinels[role];
    const familyFiles = inventory.files.filter((file) => file.family === sentinel.family);
    const ranges = rangesForFiles(familyFiles);
    const unsupported = codePoints(sentinel.text).filter((point) => (
      !ranges.some((range) => point >= range.start && point <= range.end)
    ));
    if (unsupported.length > 0) {
      throw new Error(`${role} sentinel has unsupported code points`);
    }
  }
}

export function verifyHtmlFontBundle({
  root = HTML_FONT_ROOT,
  readFile = readFileSync,
  exists = existsSync,
  stat = statSync,
} = {}) {
  try {
    const inventoryPath = join(root, 'inventory.json');
    if (!exists(inventoryPath)) throw new Error('Font inventory is missing');
    const inventory = JSON.parse(String(readFile(inventoryPath)));
    if (inventory.schema !== 'pptmaker-html-font-inventory-v1') {
      throw new Error('Font inventory schema is unsupported');
    }
    const rebuilt = buildFontInventory({ root, readFile });
    if (JSON.stringify(inventory) !== JSON.stringify(rebuilt)) {
      throw new Error('Font CSS, files, or inventory are not coherent');
    }

    for (const path of [
      inventory.legal.copyrightPath,
      inventory.legal.provenancePath,
      ...inventory.legal.licensePaths,
      inventory.sentinelPath,
    ]) {
      const fullPath = join(root, ...path.split('/'));
      if (!exists(fullPath) || !stat(fullPath).isFile() || stat(fullPath).size === 0) {
        throw new Error(`Required font material is missing: ${path}`);
      }
    }
    for (const licensePath of inventory.legal.licensePaths) {
      if (!readText(root, licensePath, readFile).includes('SIL OPEN FONT LICENSE Version 1.1')) {
        throw new Error(`Complete OFL material is missing: ${licensePath}`);
      }
    }

    const localCss = [SOURCE_CSS, NOTO_LOCAL_CSS].map((path) => readText(root, path, readFile)).join('\n');
    if (/local\s*\(/i.test(localCss)) throw new Error('Local font CSS must not use local()');
    if (/https?:\/\//i.test(localCss)) throw new Error('Runtime font CSS must use only relative URLs');
    const sentinels = JSON.parse(readText(root, inventory.sentinelPath, readFile));
    assertSentinelCoverage(inventory, sentinels);

    return {
      ok: true,
      profile: 'fixed-bilingual-runtime-smoke-only',
      families: inventory.families.map((entry) => entry.family),
      platformFamilies: {
        latin: inventory.families.find((entry) => entry.profile === 'Latin').platformFamilyName,
        han: inventory.families.find((entry) => entry.profile === 'Simplified Chinese (Hans)').platformFamilyName,
      },
      fontFiles: inventory.totals.fontFiles,
      fontBytes: inventory.totals.fontBytes,
      sentinelCoverage: true,
      actualDeckCoverage: false,
    };
  } catch (error) {
    return {
      ok: false,
      profile: 'fixed-bilingual-runtime-smoke-only',
      error: error instanceof Error ? error.message : String(error),
      actualDeckCoverage: false,
    };
  }
}
