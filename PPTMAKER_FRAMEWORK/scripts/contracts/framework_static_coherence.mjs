/**
 * Static retirement audit for the one current Page Authority production
 * surface. Historical names are permitted only in exact observer, adoption,
 * fixture, or negative-test contexts.
 */
const retiredIdentity = (...parts) => parts.join("");

export const LEGACY_TOKEN_EXCEPTIONS = Object.freeze([]);

export const RETIRED_WHOLE_PAGE_IDENTITIES = Object.freeze([
  retiredIdentity("html", "-first-v1"),
  retiredIdentity("whole", "-page-image2-v1"),
  retiredIdentity("html", "-only"),
  retiredIdentity("html", "-then-image2"),
  retiredIdentity("image2", "-only"),
  retiredIdentity("body", "+header", "-lock"),
  retiredIdentity("full", "-page"),
  retiredIdentity("header", "-lock"),
  retiredIdentity("visual", "-slot"),
  retiredIdentity("image2", "-refinement"),
  retiredIdentity("migrate", "-html"),
  retiredIdentity("confirm", "-html", "-migration"),
  retiredIdentity("apply", "-html", "-migration"),
  retiredIdentity("preview", "-html", "-migration"),
  retiredIdentity("_scratch/", "html", "-migration"),
]);

export const RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS = Object.freeze([
  Object.freeze({
    token: retiredIdentity("html", "-first-v1"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only seed preserves a recognized historical source pair",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("whole", "-page-image2-v1"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only seed preserves a recognized historical source pair",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-only"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only mode is consumed by adoption coverage",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-then-image2"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only mode is consumed by adoption coverage",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("image2", "-only"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only mode is consumed by adoption coverage",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("full", "-page"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "fixture-only source preserves an exact historical observer pair",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:observer-fixture",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-first-v1"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs",
    reason: "read-only observer decodes historical source bytes",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:historical-observer",
  }),
  Object.freeze({
    token: retiredIdentity("whole", "-page-image2-v1"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs",
    reason: "read-only observer decodes historical source bytes",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:historical-observer",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-only"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs",
    reason: "read-only observer decodes historical state bytes",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:historical-observer",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-then-image2"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs",
    reason: "read-only observer decodes historical state bytes",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:historical-observer",
  }),
  Object.freeze({
    token: retiredIdentity("image2", "-only"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/legacy_protocol_adoption.mjs",
    reason: "read-only observer decodes historical state bytes",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:historical-observer",
  }),
  Object.freeze({
    token: retiredIdentity("image2", "-refinement"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs",
    reason: "negative state gate rejects retired record identity",
    owner: "shared-state",
    public_compatibility: false,
    retire_by: "not-applicable:negative-guard",
  }),
  Object.freeze({
    token: retiredIdentity("migrate", "-html"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/production_mode_transition.mjs",
    reason: "adoption transaction rejects a retired candidate overlay",
    owner: "legacy-adoption",
    public_compatibility: false,
    retire_by: "not-applicable:negative-guard",
  }),
]);

export const ACTIVE_SURFACE_PREFIXES = Object.freeze([
  "PPTMAKER_FRAMEWORK/",
  "openspec/specs/",
]);

const LEGACY_RETIRE_BY = /^(?:change:[a-z0-9][a-z0-9-]*|release:[0-9]+(?:\.[0-9]+){1,2}|not-applicable:[a-z][a-z0-9-]*)$/;
const LEGACY_OWNER = /^[a-z][a-z0-9-]{1,63}$/;
const LEGACY_TOKEN = /^[A-Za-z0-9_][A-Za-z0-9._/-]{1,127}$/;
const RETIRED_IMAGE2_ONLY = retiredIdentity("image2", "-only");
const CURRENT_WHOLE_PAGE_LABELS = Object.freeze([
  new RegExp(`\\b(?:legacy|compatibility|maintenance)[-_ ]+(?:whole-page(?:[-_ ]+image2(?:[-_ ]+v1)?)?|${RETIRED_IMAGE2_ONLY})\\b`, "gi"),
  new RegExp(`\\b(?:whole-page(?:[-_ ]+image2(?:[-_ ]+v1)?)?|${RETIRED_IMAGE2_ONLY})[-_ ]+(?:legacy|compatibility|maintenance)\\b`, "gi"),
]);
const MALFORMED_WHOLE_PAGE_LABEL = /\bwhole-page[ \t]+whole-page\b/gi;
const HISTORICAL_CONTEXT = /\b(?:historical|legacy)\b[^\n]{0,96}\b(?:observer|adoption|fixture)\b|\b(?:observer|adoption|fixture)\b[^\n]{0,96}\b(?:historical|legacy)\b|\bnegative (?:test|guard)\b/i;

function issue(file, line, rule, message, hint) { return { file, line, rule, message, hint }; }
function normalizedPath(value) { return String(value).replaceAll("\\", "/").replace(/^\.\//, ""); }
function lineOf(text, offset) { return text.slice(0, offset).split("\n").length; }
function activeSurfacePath(file) { return ACTIVE_SURFACE_PREFIXES.some((prefix) => file.startsWith(prefix)); }
function exactException(file, token, exceptions) { return exceptions.some((entry) => entry?.file === file && entry?.token === token); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function lineAt(text, offset) {
  const start = text.lastIndexOf("\n", offset) + 1;
  const end = text.indexOf("\n", offset);
  return text.slice(start, end < 0 ? text.length : end);
}

export function validateLegacyTokenExceptions(entries = LEGACY_TOKEN_EXCEPTIONS) {
  const issues = [];
  const seen = new Set();
  if (!Array.isArray(entries)) return [issue("<legacy-token-exceptions>", 1, "legacy-token-exception", "registry must be an array", "provide literal exception rows")];
  for (const entry of entries) {
    const file = entry?.file || "<legacy-token-exception>";
    if (!entry || Object.keys(entry).sort().join("\n") !== ["file", "owner", "public_compatibility", "reason", "retire_by", "token"].join("\n")) {
      issues.push(issue(file, 1, "legacy-token-exception", "entry must contain exactly token, file, reason, owner, public_compatibility, retire_by", "remove broad or undocumented fields"));
      continue;
    }
    if (!LEGACY_TOKEN.test(entry.token) || /[*?]/.test(entry.token)) issues.push(issue(file, 1, "legacy-token-exception", "token must be one literal legacy token", "remove wildcard token matching"));
    if (typeof entry.file !== "string" || !entry.file || /[*?]|\/$/.test(entry.file)) issues.push(issue(file, 1, "legacy-token-exception", "file must be one exact repository path", "name one exact file"));
    if (typeof entry.reason !== "string" || !entry.reason.trim()) issues.push(issue(file, 1, "legacy-token-exception", "reason is required", "state the concrete compatibility purpose"));
    if (!LEGACY_OWNER.test(entry.owner || "")) issues.push(issue(file, 1, "legacy-token-exception", "owner must be a stable direct owner id", "assign a direct owner"));
    if (typeof entry.public_compatibility !== "boolean") issues.push(issue(file, 1, "legacy-token-exception", "public_compatibility must be boolean", "state whether the spelling is public"));
    if (!LEGACY_RETIRE_BY.test(entry.retire_by || "")) issues.push(issue(file, 1, "legacy-token-exception", "retire_by must be change:<name>, release:<version>, or not-applicable:<invariant>", "add an explicit retirement condition"));
    const key = `${entry.token}\u0000${entry.file}`;
    if (seen.has(key)) issues.push(issue(file, 1, "legacy-token-exception", "duplicate token/file exception", "keep one authoritative row"));
    seen.add(key);
  }
  return issues;
}

export function validateRetiredWholePageTokenExceptions(entries = RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS) {
  const issues = validateLegacyTokenExceptions(entries);
  if (!Array.isArray(entries)) return issues;
  for (const entry of entries) {
    if (!entry || !RETIRED_WHOLE_PAGE_IDENTITIES.includes(entry.token)) {
      issues.push(issue(entry?.file || "<retired-whole-page-token-exception>", 1, "retired-whole-page-token-exception", "exception token must be one exact retired production identity", "register only a literal retired identity"));
    }
  }
  return issues;
}

/** Scan active code, docs, and main specs. A literal historical context is
 * allowed only for bounded observer/adoption/fixture explanations. */
export function scanRetiredWholePageTerms(files, {
  exceptions = RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS,
} = {}) {
  const issues = [];
  const entries = files instanceof Map ? [...files.entries()] : Object.entries(files || {});
  for (const [rawFile, rawText] of entries) {
    const file = normalizedPath(rawFile);
    if (!activeSurfacePath(file)) continue;
    const text = String(rawText);
    for (const token of RETIRED_WHOLE_PAGE_IDENTITIES) {
      if (exactException(file, token, exceptions)) continue;
      const pattern = new RegExp(escapeRegex(token), "gi");
      for (const match of text.matchAll(pattern)) {
        if (HISTORICAL_CONTEXT.test(lineAt(text, match.index))) continue;
        issues.push(issue(file, lineOf(text, match.index), "retired-whole-page-identity", `${token} is retired from active surfaces`, "remove the identity or place it in one labelled observer/adoption/fixture context"));
      }
    }
    for (const pattern of CURRENT_WHOLE_PAGE_LABELS) {
      for (const match of text.matchAll(pattern)) {
        issues.push(issue(file, lineOf(text, match.index), "retired-whole-page-label", `${match[0]} labels a retired production route`, "remove the route instead of presenting it as compatibility"));
      }
    }
    for (const match of text.matchAll(MALFORMED_WHOLE_PAGE_LABEL)) {
      issues.push(issue(file, lineOf(text, match.index), "malformed-whole-page-label", `${match[0]} is a malformed retired label`, "remove the retired label"));
    }
  }
  return issues;
}
