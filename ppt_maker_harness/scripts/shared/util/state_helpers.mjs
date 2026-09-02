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