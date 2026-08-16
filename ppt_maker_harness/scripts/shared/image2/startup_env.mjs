/**
 * Restricted Image2 startup environment (shared by doctor readiness, Image2
 * authorize/generate, and Style Master authorize/generate).
 *
 * One startup source and one precedence: explicit process environment first,
 * the selected deck `.env` filling only missing declared keys, then the
 * project/cwd `.env` filling only keys still missing. The loader reads only
 * declared runtime keys, never overwrites explicit environment values, and
 * never outputs values or secrets — callers receive only a bounded location
 * summary.
 *
 * Import-safe: depends only on node:fs / node:path (no npm packages, no
 * production adapter, no YAML parsing), so the pre-install `00-setup` entry
 * can statically import it.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";

/** The canonical declared Image2 runtime keys. */
export const IMAGE2_STARTUP_KEYS = Object.freeze([
  "IMAGE2_API_KEY",
  "IMAGE2_BASE_URL",
  "IMAGE2_PROVIDER_PROFILE_ID",
]);

function parseDotenvLines(raw) {
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith("export ")) key = key.slice(7).trim();
    if (!key) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in values)) values[key] = value;
  }
  return values;
}

function deckRootFor(runDir) {
  const resolved = resolve(runDir);
  return resolve(resolved, "..", "..");
}

/**
 * Resolve the restricted startup environment without mutating `env`.
 * `runDir` selects the deck `.env` then the process cwd; `searchDirs`
 * overrides the search order entirely (used by the unbound env-check entry).
 * `extraKeys` lets an entry point declare additional non-secret keys it owns
 * (for example env-check's `PPT_FONT_DIR`); it is not a general passthrough.
 */
export function resolveImage2StartupEnv({ runDir = null, searchDirs = null, extraKeys = [], env = process.env } = {}) {
  const base = env && typeof env === "object" ? env : {};
  const keys = [...IMAGE2_STARTUP_KEYS, ...extraKeys.filter((key) => typeof key === "string" && key)];
  const merged = { ...base };
  const loadedFrom = [];
  const normalizeDir = (dir) => {
    const resolved = resolve(String(dir));
    try {
      return realpathSync(resolved);
    } catch {
      return resolved;
    }
  };
  const dirs = searchDirs
    ? searchDirs.map(normalizeDir)
    : [normalizeDir(deckRootFor(runDir ?? process.cwd()))];
  if (!searchDirs) dirs.push(normalizeDir(process.cwd()));
  for (const dir of dirs) {
    const envFile = join(dir, ".env");
    if (!existsSync(envFile)) continue;
    const values = parseDotenvLines(readFileSync(envFile, "utf8"));
    let filled = false;
    for (const key of keys) {
      if (key in merged) continue;
      if (key in values) {
        merged[key] = values[key];
        filled = true;
      }
    }
    if (filled) loadedFrom.push(dir);
  }
  return Object.freeze({ env: Object.freeze(merged), loadedFrom: Object.freeze(loadedFrom) });
}

/**
 * Apply the restricted startup environment by filling missing declared keys
 * into `env` in place (default `process.env`). Idempotent; never overwrites
 * explicit values; returns only the bounded location summary.
 */
export function applyImage2StartupEnv({ runDir = null, searchDirs = null, extraKeys = [], env = process.env } = {}) {
  const { env: merged, loadedFrom } = resolveImage2StartupEnv({ runDir, searchDirs, extraKeys, env });
  const declared = new Set([...IMAGE2_STARTUP_KEYS, ...extraKeys]);
  for (const [key, value] of Object.entries(merged)) {
    if (declared.has(key) && !(key in env)) env[key] = value;
  }
  return Object.freeze({ loadedFrom });
}
