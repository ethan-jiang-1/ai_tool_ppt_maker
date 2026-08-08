/**
 * Bounded human display references for Page Image projections.
 *
 * This module formats already-authoritative full digests only. It deliberately
 * exposes no reverse lookup, selector parsing, or lifecycle operation.
 */
const SHA256_RE = /^[0-9a-f]{64}$/;

export const PAGE_PRODUCTION_DISPLAY_REFERENCE_PREFIXES = Object.freeze({
  plan: "p",
  batch: "b",
  evidence: "e",
  review: "r",
  manifest: "m",
  delivery: "d",
  style: "s",
  input: "i",
  raw: "w",
  final: "f",
  notes: "n",
  pptx: "x",
});

function displayReferenceKey(kind, sha256) {
  return `${kind}\u0000${sha256}`;
}

function requireDisplayReferenceKind(kind) {
  if (typeof kind !== "string" || !Object.hasOwn(PAGE_PRODUCTION_DISPLAY_REFERENCE_PREFIXES, kind)) {
    throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_KIND_INVALID");
  }
  return kind;
}

function requireDisplayReferenceDigest(sha256) {
  if (typeof sha256 !== "string" || !SHA256_RE.test(sha256)) {
    throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_DIGEST_INVALID");
  }
  return sha256;
}

/**
 * Format typed full digests for display only. The returned index intentionally
 * has no method that accepts an abbreviated reference as lifecycle input.
 */
export function createPageProductionDisplayReferenceIndex(entries) {
  if (!Array.isArray(entries)) throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_ENTRIES_INVALID");
  const unique = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_ENTRY_INVALID");
    }
    const kind = requireDisplayReferenceKind(entry.kind);
    const sha256 = requireDisplayReferenceDigest(entry.sha256);
    unique.set(displayReferenceKey(kind, sha256), Object.freeze({ kind, sha256 }));
  }

  const collisionGroups = new Map();
  for (const entry of [...unique.values()].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
    if (left.sha256 === right.sha256) return 0;
    return left.sha256 < right.sha256 ? -1 : 1;
  })) {
    const collisionKey = displayReferenceKey(entry.kind, entry.sha256.slice(0, 8));
    const group = collisionGroups.get(collisionKey) || [];
    group.push(entry);
    collisionGroups.set(collisionKey, group);
  }

  const displayByKey = new Map();
  for (const group of collisionGroups.values()) {
    for (const [index, entry] of group.entries()) {
      const suffix = group.length > 1 ? `~${index + 1}` : "";
      displayByKey.set(
        displayReferenceKey(entry.kind, entry.sha256),
        `${PAGE_PRODUCTION_DISPLAY_REFERENCE_PREFIXES[entry.kind]}-${entry.sha256.slice(0, 8)}${suffix}`,
      );
    }
  }

  return Object.freeze({
    describe(kind, sha256) {
      const checkedKind = requireDisplayReferenceKind(kind);
      const checkedDigest = requireDisplayReferenceDigest(sha256);
      const display = displayByKey.get(displayReferenceKey(checkedKind, checkedDigest));
      if (!display) throw new Error("PAGE_PRODUCTION_DISPLAY_REFERENCE_UNKNOWN");
      return display;
    },
  });
}
