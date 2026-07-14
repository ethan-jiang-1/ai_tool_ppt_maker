import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { resolveAssetPath } from './bundle_layout.mjs';

const VALID_TYPES = new Set(['svg', 'png', 'jpg']);

/**
 * Load and parse the asset-manifest.yaml file.
 * Missing file → returns empty catalog (not an error).
 * Invalid YAML → throws.
 * @param {string} assetsDir - Path to the assets/ directory.
 * @returns {{ version: number, assets: Record<string, object> }}
 */
export function loadAssetManifest(assetsDir) {
  const p = `${assetsDir}/asset-manifest.yaml`;
  if (!existsSync(p)) {
    return { version: 1, assets: {} };
  }
  let raw;
  try {
    raw = readFileSync(p, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read asset manifest ${p}: ${err.message}`);
  }
  if (!raw || raw.trim() === '') {
    return { version: 1, assets: {} };
  }
  let parsed;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(`Invalid YAML in asset manifest ${p}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    return { version: 1, assets: {} };
  }
  if (typeof parsed.version !== 'number') parsed.version = 1;
  if (!parsed.assets || typeof parsed.assets !== 'object') parsed.assets = {};
  return parsed;
}

/**
 * Validate an asset manifest object.
 * @param {object} manifest - Parsed manifest from loadAssetManifest.
 * @returns {string[]} Problems (empty = valid).
 */
export function validateAssetManifest(manifest) {
  const problems = [];
  if (!Number.isInteger(manifest.version) || manifest.version < 1) {
    problems.push(`manifest version must be a positive integer, got ${JSON.stringify(manifest.version)}`);
  }
  const assets = manifest.assets || {};
  for (const [id, entry] of Object.entries(assets)) {
    if (!id || typeof id !== 'string' || !/^[a-z][a-z0-9_]*(-[a-z0-9_]+)*$/.test(id)) {
      problems.push(`asset key ${JSON.stringify(id)} is not a valid kebab-case identifier`);
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      problems.push(`asset ${JSON.stringify(id)}: entry must be an object`);
      continue;
    }
    for (const field of ['path', 'type', 'label', 'description', 'usage_guidance']) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
        problems.push(`asset ${JSON.stringify(id)}: missing or empty required field "${field}"`);
      }
    }
    if (entry.path) {
      if (entry.path.startsWith('/')) {
        problems.push(`asset ${JSON.stringify(id)}: path must not be absolute (starts with /)`);
      }
      if (entry.path.includes('..')) {
        problems.push(`asset ${JSON.stringify(id)}: path must not contain ".."`);
      }
    }
    if (entry.type && !VALID_TYPES.has(entry.type)) {
      problems.push(`asset ${JSON.stringify(id)}: invalid type ${JSON.stringify(entry.type)} — allowed: ${[...VALID_TYPES].sort().join(', ')}`);
    }
  }
  return problems;
}

/**
 * Resolve an asset file path, checking override first, then backbone.
 * @param {string} runDir - Version directory.
 * @param {object} manifest - Parsed manifest.
 * @param {string} assetId - Asset identifier.
 * @returns {string|null} Absolute file path, or null.
 */
export function resolveAssetFile(runDir, manifest, assetId) {
  const entry = manifest.assets?.[assetId];
  if (!entry || !entry.path) return null;
  const resolved = resolveAssetPath(runDir, entry.path);
  if (!existsSync(resolved)) return null;
  return resolved;
}

/**
 * Compute SHA-256 of an asset file by its asset ID.
 * @param {string} runDir - Version directory.
 * @param {object} manifest - Parsed manifest.
 * @param {string} assetId - Asset identifier.
 * @returns {string|null} Hex SHA-256 digest, or null.
 */
export function sha256Asset(runDir, manifest, assetId) {
  const filePath = resolveAssetFile(runDir, manifest, assetId);
  if (!filePath) return null;
  try {
    const buf = readFileSync(filePath);
    return createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Compute an aggregate SHA-256 over a set of asset files.
 * Sorts IDs alphabetically, concatenates individual hex digests,
 * and returns SHA-256 of the concatenation.
 * Missing files are skipped with a stderr warning.
 * Returns "" for empty/null assetIds or when all files are missing.
 * @param {string} runDir - Version directory.
 * @param {object} manifest - Parsed manifest.
 * @param {string[]} assetIds - Asset identifiers.
 * @returns {string} Hex SHA-256 digest.
 */
export function aggregateAssetSha256(runDir, manifest, assetIds) {
  if (!assetIds || assetIds.length === 0) return '';
  const sorted = [...assetIds].sort();
  const digests = [];
  for (const id of sorted) {
    const hash = sha256Asset(runDir, manifest, id);
    if (hash) {
      digests.push(hash);
    } else {
      console.warn(`  WARNING: asset "${id}" file not found, skipping in aggregate`);
    }
  }
  if (digests.length === 0) return '';
  return createHash('sha256').update(digests.join('')).digest('hex');
}
