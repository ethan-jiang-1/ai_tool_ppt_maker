/** Static-only legacy-token contract consumed by architecture verification. */
export const LEGACY_TOKEN_EXCEPTIONS = Object.freeze([
  Object.freeze({
    token: "image2-refinement",
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs",
    reason: "read-only visual-slot state compatibility and public workflow-inspection projection",
    owner: "shared-state",
    public_compatibility: true,
    retire_by: "change:public-image-production-terminology",
  }),
  Object.freeze({
    token: "image2-refinement",
    file: "PPTMAKER_FRAMEWORK/playbook/image2-refine.md",
    reason: "documented public controller and action identifiers remain stable during this physical-owner change",
    owner: "workflow-control",
    public_compatibility: true,
    retire_by: "change:public-image-production-terminology",
  }),
  Object.freeze({
    token: "04-image2-refinement",
    file: "openspec/changes/realign-image-production-and-framework-governance/proposal.md",
    reason: "breaking migration records the retired physical path",
    owner: "openspec",
    public_compatibility: false,
    retire_by: "not-applicable:protected-migration-history",
  }),
]);

const retiredIdentity = (...parts) => parts.join("");

/**
 * Exact retired whole-page identities are rejected from live framework source,
 * main specs, and verification inputs. The strings are assembled so this
 * contract does not exempt its own rule definitions from the scanner.
 */
export const RETIRED_WHOLE_PAGE_IDENTITIES = Object.freeze([
  retiredIdentity("legacy-image2", "-first"),
  retiredIdentity("legacy-image2", "-maintenance"),
  retiredIdentity("legacy-image2", "-first", "-maintenance"),
  retiredIdentity("LEGACY", "_PIPELINE"),
  retiredIdentity("init", "LegacyBundle"),
  retiredIdentity("migrate", "-html"),
  retiredIdentity("confirm", "-html", "-migration"),
  retiredIdentity("apply", "-html", "-migration"),
  retiredIdentity("preview", "-html", "-migration"),
  retiredIdentity("_scratch/", "html", "-migration"),
  retiredIdentity("migrate", "-import"),
  retiredIdentity("html", "-migration"),
]);

export const RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS = Object.freeze([
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
    reason: "the layout owner rejects the retired scratch directory before it can be adopted",
    owner: "run-bundle-layout",
    public_compatibility: false,
    retire_by: "not-applicable:retired-scratch-rejection",
  }),
  Object.freeze({
    token: retiredIdentity("_scratch/", "html", "-migration"),
    file: "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_contract.mjs",
    reason: "the canonical HTML validator rejects the retired renderer context before source or palette selection",
    owner: "html-slide-contract",
    public_compatibility: false,
    retire_by: "not-applicable:retired-renderer-context-rejection",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_contract.mjs",
    reason: "the canonical HTML validator rejects the retired renderer context before source or palette selection",
    owner: "html-slide-contract",
    public_compatibility: false,
    retire_by: "not-applicable:retired-renderer-context-rejection",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/production_mode_transition.mjs",
    reason: "the transition owner rejects retired overlay entries before they become candidate evidence",
    owner: "production-mode-transition",
    public_compatibility: false,
    retire_by: "not-applicable:retired-transition-evidence-rejection",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "tests/shared/run-bundle/test_bundle_layout.mjs",
    reason: "negative coverage proves the retired scratch directory is rejected",
    owner: "run-bundle-layout",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "tests/03-html-production/test_html_slide_contract.mjs",
    reason: "negative coverage proves retired renderer and palette contexts cannot be selected",
    owner: "html-slide-contract",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("html", "-migration"),
    file: "tests/shared/state/test_production_mode_transition.mjs",
    reason: "negative coverage proves a retired overlay cannot become transition evidence",
    owner: "production-mode-transition",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("legacy-image2", "-first"),
    file: "tests/shared/state/test_state_yaml.mjs",
    reason: "negative coverage proves retired source markers remain byte-preserving unsupported input",
    owner: "shared-state",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("migrate", "-html"),
    file: "tests/shared/state/test_state_yaml.mjs",
    reason: "negative coverage proves retired node identities cannot be promoted into current state",
    owner: "shared-state",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("migrate", "-import"),
    file: "tests/shared/state/test_state_yaml.mjs",
    reason: "negative coverage proves retired Controller identities cannot be promoted into current state",
    owner: "shared-state",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
  Object.freeze({
    token: retiredIdentity("migrate", "-html"),
    file: "tests/contracts/test_docs_consistency.mjs",
    reason: "negative documentation assertion proves removed command spelling is absent from active guidance",
    owner: "framework-contracts",
    public_compatibility: false,
    retire_by: "not-applicable:negative-test",
  }),
]);

export const ACTIVE_SURFACE_PREFIXES = Object.freeze([
  "PPTMAKER_FRAMEWORK/",
  "openspec/specs/",
  "tests/",
  "tests_e2e/",
]);

const LEGACY_RETIRE_BY = /^(?:change:[a-z0-9][a-z0-9-]*|release:[0-9]+(?:\.[0-9]+){1,2}|not-applicable:[a-z][a-z0-9-]*)$/;
const LEGACY_OWNER = /^[a-z][a-z0-9-]{1,63}$/;
const LEGACY_TOKEN = /^[A-Za-z0-9_][A-Za-z0-9._/-]{1,127}$/;

function issue(file, line, rule, message, hint) { return { file, line, rule, message, hint }; }

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
      issues.push(issue(entry?.file || "<retired-whole-page-token-exception>", 1, "retired-whole-page-token-exception", "exception token must be one exact retired whole-page identity", "register only a literal retired identity"));
    }
  }
  return issues;
}

function normalizedPath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}

function lineOf(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function activeSurfacePath(file) {
  const path = normalizedPath(file);
  return ACTIVE_SURFACE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function exactException(file, token, exceptions) {
  return exceptions.some((entry) => entry?.file === file && entry?.token === token);
}

function literalMatches(text, token) {
  const matches = [];
  let offset = text.indexOf(token);
  while (offset >= 0) {
    matches.push(offset);
    offset = text.indexOf(token, offset + token.length);
  }
  return matches;
}

const CURRENT_WHOLE_PAGE_LABELS = Object.freeze([
  /\b(?:legacy|compatibility|maintenance)[-_ ]+(?:whole-page(?:[-_ ]+image2(?:[-_ ]+v1)?)?|image2-only)\b/gi,
  /\b(?:whole-page(?:[-_ ]+image2(?:[-_ ]+v1)?)?|image2-only)[-_ ]+(?:legacy|compatibility|maintenance)\b/gi,
]);
const MALFORMED_WHOLE_PAGE_LABEL = /\bwhole-page[ \t]+whole-page\b/gi;

/**
 * Scan only active source, main-spec, and verification surfaces. Exceptions
 * apply to one literal token in one file; they cannot suppress label rules or
 * a directory of historical behavior.
 */
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
      for (const offset of literalMatches(text, token)) {
        issues.push(issue(file, lineOf(text, offset), "retired-whole-page-identity", `${token} is retired from active surfaces`, "remove the identity or add one exact owner/reason-bounded negative exception"));
      }
    }
    for (const pattern of CURRENT_WHOLE_PAGE_LABELS) {
      for (const match of text.matchAll(pattern)) {
        issues.push(issue(file, lineOf(text, match.index), "retired-whole-page-label", `${match[0]} labels current whole-page work as retired compatibility`, "use image2-only / whole-page-image2-v1 / create-deck"));
      }
    }
    for (const match of text.matchAll(MALFORMED_WHOLE_PAGE_LABEL)) {
      issues.push(issue(file, lineOf(text, match.index), "malformed-whole-page-label", `${match[0]} is a malformed replacement phrase`, "use whole-page once"));
    }
  }
  return issues;
}
