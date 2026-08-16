// Shared internal problem-fact contract (capability: diagnostic-facts).
//
// This module is the single authority for the minimal cross-module problem
// fact shape shared by the Page Image source/configuration producer families:
// Page Source (content-parsing), Visual Language and Presentation
// (visual-config), and Reference Material (visual-asset-management), plus the
// aggregators and operation owners that consume their facts.
//
// It is NOT the public `pptmaker-cli-diagnostic` schema: public envelope
// projection rules are owned by cli-surface (scripts/shared/cli/cli_error.mjs).
// Producers SHALL NOT construct public envelopes here, and SHALL NOT parse
// Error.message to recover reason/owner/category/recovery facts.
//
// Fact shape (all optional except `reason`; absent facts stay null/undefined):
//   {
//     reason:   "<registered code>",
//     owner:    "page-source" | "visual-language" | "presentation"
//               | "reference-material" | null,     // null = unknown
//     source:   { path, line?, column? } | null,    // physical file locator
//     path:     "<logical registry/record path>" | null,  // distinct from source
//     subject:  { slideId?, field? } | null,
//     actual:   <safe scalar> | undefined,          // string/number/boolean only
//     expected: <safe scalar> | undefined,
//     message:  "<bounded display text>",
//   }

export const PROBLEM_OWNER = Object.freeze({
  PAGE_SOURCE: "page-source",
  VISUAL_LANGUAGE: "visual-language",
  PRESENTATION: "presentation",
  REFERENCE_MATERIAL: "reference-material",
});

const OWNER_VALUES = new Set(Object.values(PROBLEM_OWNER));
const SAFE_SCALAR_TYPES = new Set(["string", "number", "boolean"]);

function toLocator(source) {
  if (typeof source === "string" && source.length > 0) return { path: source };
  if (source && typeof source === "object" && typeof source.path === "string" && source.path.length > 0) {
    return Object.freeze({
      path: source.path,
      ...(source.line != null ? { line: source.line } : {}),
      ...(source.column != null ? { column: source.column } : {}),
    });
  }
  return null;
}

function freezeFact(fact) {
  const source = toLocator(fact.source);
  const subject = fact.subject && typeof fact.subject === "object"
    ? Object.freeze({ ...(fact.subject.slideId ? { slideId: fact.subject.slideId } : {}), ...(fact.subject.field ? { field: fact.subject.field } : {}) })
    : null;
  return Object.freeze({
    reason: fact.reason,
    owner: OWNER_VALUES.has(fact.owner) ? fact.owner : null,
    source,
    path: typeof fact.path === "string" && fact.path.length > 0 ? fact.path : null,
    subject,
    ...(SAFE_SCALAR_TYPES.has(typeof fact.actual) ? { actual: fact.actual } : {}),
    ...(SAFE_SCALAR_TYPES.has(typeof fact.expected) ? { expected: fact.expected } : {}),
    message: typeof fact.message === "string" ? fact.message : "",
  });
}

/** Build one frozen problem fact. `reason` is required; unknown owner stays null. */
export function createProblemFact(fact = {}) {
  if (!fact || typeof fact !== "object" || typeof fact.reason !== "string" || fact.reason.length === 0) {
    throw new TypeError("problem fact requires a non-empty reason");
  }
  return freezeFact(fact);
}

/**
 * Convert an internal issue list (code/message/source/path/actual/expected/
 * subject) into frozen problem facts for one producer family.
 *
 * `physicalSource` supplies the physical file locator when the producer knows
 * it and the issue itself does not carry a `source`. It is never inferred.
 */
export function toProblemFacts(issues, { owner = null, physicalSource = null } = {}) {
  const list = Array.isArray(issues) ? issues : issues ? [issues] : [];
  return Object.freeze(list.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return freezeFact({ reason: "unknown_problem_fact", owner: null, message: "" });
    }
    return freezeFact({
      reason: typeof entry.code === "string" && entry.code.length > 0 ? entry.code : "unknown_problem_fact",
      owner,
      source: entry.source || physicalSource || null,
      path: entry.path || null,
      subject: entry.subject
        ? { slideId: entry.subject.id || entry.subject.slideId || null, field: entry.subject.field || null }
        : null,
      actual: entry.actual,
      expected: entry.expected,
      message: typeof entry.message === "string" ? entry.message : "",
    });
  }));
}

/** Attach a frozen problem-fact list to an error without touching its message. */
export function attachProblemFacts(error, facts) {
  const target = error instanceof Error ? error : new Error("CLI operation failed");
  const list = Array.isArray(facts) ? facts : [];
  Object.defineProperty(target, "problemFacts", {
    value: Object.freeze([...list]),
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return target;
}

/** Read the attached problem-fact list, or null when absent/invalid. */
export function problemFactsFromError(error) {
  const facts = error?.problemFacts;
  return Array.isArray(facts) && facts.length > 0 ? facts : null;
}

/** True when the error carries at least one problem fact (contract-driven family marker). */
export function isProblemFactsCarrier(error) {
  return problemFactsFromError(error) !== null;
}
