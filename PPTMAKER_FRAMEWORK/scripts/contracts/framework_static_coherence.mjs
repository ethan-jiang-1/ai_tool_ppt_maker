/** Fail-closed audit for retired production terminology in active contracts. */
const compose = (...parts) => parts.join("");

export const LEGACY_TOKEN_EXCEPTIONS = Object.freeze([]);
export const RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS = Object.freeze([]);

export const RETIRED_WHOLE_PAGE_IDENTITIES = Object.freeze([
  compose("html", "-first-v1"),
  compose("whole", "-page-image2-v1"),
  compose("html", "-only"),
  compose("html", "-then-image2"),
  compose("image2", "-only"),
  compose("body", "+header", "-lock"),
  compose("full", "-page"),
  compose("header", "-lock"),
  compose("visual", "-slot"),
  compose("image2", "-refinement"),
  compose("migrate", "-html"),
  compose("confirm", "-html", "-migration"),
  compose("apply", "-html", "-migration"),
  compose("preview", "-html", "-migration"),
  compose("_scratch/", "html", "-migration"),
]);

export const ACTIVE_SURFACE_PREFIXES = Object.freeze([
  "PPTMAKER_FRAMEWORK/",
  "openspec/specs/",
  "tests/",
  "tests_e2e/",
]);

const PROTOCOL_PATTERNS = Object.freeze([
  compose("page-authority", "-image2-v1"),
  new RegExp(`\\b${compose("image2", "-page-authority")}(?!-v2)\\b`),
  compose("legacy", "_protocol"),
  compose("production_mode", "_transition"),
  compose("compatibility/", "current", "-v1-page-authority"),
  ...RETIRED_WHOLE_PAGE_IDENTITIES,
]);

function issue(file, line, rule, message, hint) {
  return { file, line, rule, message, hint };
}

function normalizedPath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}

function lineOf(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function isActiveSurface(file) {
  return ACTIVE_SURFACE_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function exceptionRegistryIssues(entries, label) {
  if (!Array.isArray(entries)) {
    return [issue(`<${label}>`, 1, "retired-token-exception", "exception registry must be an array", "remove retired-protocol exceptions")];
  }
  if (entries.length > 0) {
    return [issue(`<${label}>`, 1, "retired-token-exception", "active retired-protocol exceptions are forbidden", "remove the retired owner instead of registering an exception")];
  }
  return [];
}

export function validateLegacyTokenExceptions(entries = LEGACY_TOKEN_EXCEPTIONS) {
  return exceptionRegistryIssues(entries, "legacy-token-exceptions");
}

export function validateRetiredWholePageTokenExceptions(entries = RETIRED_WHOLE_PAGE_TOKEN_EXCEPTIONS) {
  return exceptionRegistryIssues(entries, "retired-whole-page-token-exceptions");
}

/** Scan active framework, specification, and proof surfaces with no exceptions. */
export function scanRetiredWholePageTerms(files) {
  const issues = [];
  const entries = files instanceof Map ? [...files.entries()] : Object.entries(files || {});
  for (const [rawFile, rawText] of entries) {
    const file = normalizedPath(rawFile);
    if (!isActiveSurface(file)) continue;
    const text = String(rawText);
    for (const identity of PROTOCOL_PATTERNS) {
      const pattern = identity instanceof RegExp
        ? new RegExp(identity.source, "gi")
        : new RegExp(identity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      for (const match of text.matchAll(pattern)) {
        issues.push(issue(
          file,
          lineOf(text, match.index),
          "retired-protocol-term",
          `${match[0]} is retired from active surfaces`,
          "remove the retired term and route current work through the selected v2 workflow",
        ));
      }
    }
  }
  return issues;
}
