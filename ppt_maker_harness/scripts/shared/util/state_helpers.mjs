/**
 * state_helpers.mjs — shared utility functions for state modules.
 *
 * These are pure helper functions extracted from the state_*.mjs modules to
 * eliminate duplicate definitions. They have no side effects and no imports
 * beyond Node.js built-ins.
 *
 * Authority: openspec/specs/node-specification/spec.md
 */

/**
 * Deep-clone a value. Returns null/undefined as-is, otherwise uses structuredClone.
 */
export function deepClone(value) {
  return value == null ? value : structuredClone(value);
}

/**
 * Current ISO-8601 timestamp string.
 */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Deterministic JSON stringification for stable hashing.
 * Sorts keys alphabetically; arrays maintain their order.
 */
export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

/**
 * Check if a value is a plain object (not null, not array, typeof object).
 */
export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/**
 * Check that a value is a plain object with exactly the given keys.
 */
export function hasExactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

/**
 * Check if a string is a valid ISO-8601 timestamp.
 */
export function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/**
 * Extract a canonical vN version from a 3_versions/vN key.
 */
export function versionFromReservedKey(key) {
  return /^3_versions\/(v[1-9][0-9]*)$/.exec(key)?.[1] || null;
}

/**
 * Deep-freeze a value recursively.
 */
export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}