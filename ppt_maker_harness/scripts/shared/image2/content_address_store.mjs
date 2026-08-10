/**
 * content_address_store.mjs — deterministic short on-disk names for
 * content-addressed immutable owner storage.
 *
 * Identity is always the full 64-hex SHA-256 (state, receipts, records,
 * JSON). Physical directory/file names on disk use the first 8 hex chars so
 * paths stay short and are deterministically derivable from the full hash.
 *
 * Resolution relies on a writer invariant: an owner never publishes under a
 * short name already held by a different record — it fails loudly instead.
 * So a short-named entry uniquely corresponds to the full hash that wrote it.
 * `resolveContentAddressName` therefore needs no record read: it prefers the
 * 8-char short name, falls back to the legacy full 64-hex name (pre-migration
 * layout), and otherwise returns the short name as the target for a new write.
 * The store's read functions still validate every record and compare hashes,
 * so a collision can never surface the wrong bytes as correct evidence.
 *
 * This is a dependency-free leaf (no state/run-bundle writer imports), like
 * page_image_paths.mjs.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const CONTENT_ADDRESS_SHORT_LENGTH = 8;
export const CONTENT_ADDRESS_SHA256_RE = /^[0-9a-f]{64}$/;
// Canonical short on-disk names: exactly the first 8 hex chars.
export const CONTENT_ADDRESS_SHORT_NAME_RE = /^[0-9a-f]{8}$/;
// Legacy pre-migration on-disk names: the full 64-hex SHA-256.
export const CONTENT_ADDRESS_LEGACY_NAME_RE = /^[0-9a-f]{64}$/;
// Deck-root quiescence lock: while present, content-addressed writers must fail.
export const CONTENT_ADDRESS_MIGRATION_LOCK = ".content-address-migration.lock";

export class ContentAddressStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ContentAddressStoreError";
    this.code = code;
  }
}

/**
 * Fail when a content-address migration is in progress for a deck. Writers
 * call this AFTER acquiring their own resource lock so the migration's lock
 * preflight can always observe an active writer and the writer never mutates
 * bytes while the migration is renaming paths.
 */
export function assertNoActiveMigration(deckRoot) {
  if (typeof deckRoot !== "string" || !deckRoot) return;
  const lock = join(deckRoot, CONTENT_ADDRESS_MIGRATION_LOCK);
  if (existsSync(lock)) {
    throw new Error(
      `content-address migration is in progress for this deck; retry after it completes (${lock})`
    );
  }
}

/** Deterministic short on-disk name for a content-address: its first 8 hex chars. */
export function shortName(fullHash, prefixLength = CONTENT_ADDRESS_SHORT_LENGTH) {
  if (!CONTENT_ADDRESS_SHA256_RE.test(fullHash || "")) {
    throw new TypeError(`content address must be a lowercase SHA-256: ${JSON.stringify(fullHash)}`);
  }
  if (!Number.isInteger(prefixLength) || prefixLength < 1 || prefixLength > 64) {
    throw new TypeError("prefixLength must be an integer in 1..64");
  }
  return fullHash.slice(0, prefixLength);
}

/**
 * Resolve the on-disk entry name for a full content-address within one parent
 * directory. Prefers the 8-char short name; falls back to the legacy full
 * 64-hex name (pre-migration layout); otherwise returns the short name as the
 * target for an artifact that is not yet present.
 *
 * `recordHashReader` receives the physical candidate path and must return the
 * complete content address embedded by that candidate's canonical record (or
 * null when the record is absent or invalid). Supplying it makes resolution
 * record-verified: a foreign short prefix never shadows a matching legacy
 * path. `suffix` supports addressed files such as `<hash>.json` without
 * teaching callers a second resolver.
 */
export function resolveContentAddressName(parentDir, fullHash, {
  recordHashReader = null,
  suffix = "",
  forWrite = false,
} = {}) {
  if (!CONTENT_ADDRESS_SHA256_RE.test(fullHash || "")) {
    throw new TypeError(`content address must be a lowercase SHA-256: ${JSON.stringify(fullHash)}`);
  }
  if (typeof suffix !== "string" || !/^(?:\.[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(suffix)) {
    throw new TypeError("content-address suffix must be empty or a simple extension");
  }
  if (recordHashReader !== null && typeof recordHashReader !== "function") {
    throw new TypeError("recordHashReader must be a function when supplied");
  }
  const short = shortName(fullHash);
  const readHash = (name) => {
    if (recordHashReader === null) return null;
    try {
      const actual = recordHashReader(join(parentDir, `${name}${suffix}`));
      return CONTENT_ADDRESS_SHA256_RE.test(actual || "") ? actual : null;
    } catch {
      return null;
    }
  };
  const shortPath = join(parentDir, `${short}${suffix}`);
  const legacyPath = join(parentDir, `${fullHash}${suffix}`);
  const shortExists = existsSync(shortPath);
  const legacyExists = existsSync(legacyPath);

  if (shortExists && (recordHashReader === null || readHash(short) === fullHash)) return `${short}${suffix}`;
  if (legacyExists && (recordHashReader === null || readHash(fullHash) === fullHash)) return `${fullHash}${suffix}`;
  if (shortExists) {
    const actual = readHash(short);
    const detail = actual === null ? "an invalid or unreadable record" : `the different address ${actual}`;
    throw new ContentAddressStoreError(
      forWrite ? "content_address_collision" : "content_address_record_mismatch",
      `content-address short name ${short} is occupied by ${detail}; requested ${fullHash}`,
    );
  }
  if (legacyExists) {
    throw new ContentAddressStoreError(
      "content_address_record_mismatch",
      `legacy content-address entry ${fullHash} does not embed its requested full address`,
    );
  }
  return `${short}${suffix}`;
}

/**
 * True when a candidate on-disk entry name is a canonical short name for
 * fullHash, or the legacy full name (pre-migration). Used by readers that
 * enumerate siblings and then verify the record.
 */
export function nameMatchesAddress(name, fullHash) {
  return typeof name === "string" && (name === shortName(fullHash) || name === fullHash);
}

/** List sibling on-disk entry names under a parent that carry a content-address name (short or legacy). */
export function listContentAddressEntries(parentDir) {
  try {
    return readdirSync(parentDir, { withFileTypes: true })
      .filter(
        (entry) =>
          !entry.isSymbolicLink() &&
          (CONTENT_ADDRESS_SHORT_NAME_RE.test(entry.name) || CONTENT_ADDRESS_LEGACY_NAME_RE.test(entry.name))
      )
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}
