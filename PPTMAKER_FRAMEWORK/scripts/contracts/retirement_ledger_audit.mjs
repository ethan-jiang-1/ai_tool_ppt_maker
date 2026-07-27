import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const RETIREMENT_DISPOSITIONS = Object.freeze(["Replace", "Retire", "Collapse", "Keep"]);

const LEDGER_ROW = /^\| `([^`]+)` \| `([^`]+)` \| (Replace|Retire|Collapse|Keep) \| (.*?) \|/;
const REQUIREMENT_BLOCK = /^### Requirement: (.+)\n([\s\S]*?)(?=^### Requirement: |\z)/gm;
const retiredIdentity = (...parts) => parts.join("");
const DIRECT_LEGACY_TERMS = Object.freeze([
  retiredIdentity("full", "-page"),
  retiredIdentity("body", "+header", "-lock"),
  retiredIdentity("html", "-first"),
  retiredIdentity("html", "-only"),
  retiredIdentity("html", "-then-image2"),
  retiredIdentity("image2", "-only"),
  retiredIdentity("whole", "-page"),
  retiredIdentity("visual", "-slot"),
  retiredIdentity("header", "-lock"),
  retiredIdentity("header", "-review"),
]);
const DIRECT_LEGACY_VOCABULARY = new RegExp(`\\b(?:${DIRECT_LEGACY_TERMS.map((term) => term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})\\b|render\\.default|html production|html approval`, "i");
const EXPLICIT_HISTORICAL_REFERENCE = /\b(?:shall not|must not|retired|historical|observer|adoption)\b/i;

function rowKey(capability, title) { return `${capability}\u0000${title}`; }

export function parseRetirementLedger(markdown) {
  const rows = [];
  for (const line of String(markdown).split("\n")) {
    const match = line.match(LEDGER_ROW);
    if (!match) continue;
    rows.push(Object.freeze({ capability: match[1], title: match[2], disposition: match[3], targetOwner: match[4].trim() }));
  }
  const duplicates = rows.filter((row, index) => rows.findIndex((candidate) => rowKey(candidate.capability, candidate.title) === rowKey(row.capability, row.title)) !== index);
  if (duplicates.length) throw new Error(`retirement ledger has duplicate exact requirement rows: ${duplicates.map((row) => `${row.capability}/${row.title}`).join(", ")}`);
  return Object.freeze(rows);
}

export function parseRequirementBlocks(capability, markdown) {
  const records = [];
  for (const match of String(markdown).matchAll(REQUIREMENT_BLOCK)) records.push(Object.freeze({ capability, title: match[1].trim(), body: match[2] }));
  return Object.freeze(records);
}

export function auditRetirementRequirements({ ledger, requirements, phase = "before-sync" } = {}) {
  if (!["before-sync", "after-sync"].includes(phase)) throw new Error("audit phase must be before-sync or after-sync");
  const byKey = new Map(ledger.map((row) => [rowKey(row.capability, row.title), row]));
  const requirementKeys = new Set(requirements.map((record) => rowKey(record.capability, record.title)));
  const missingLedgerTitles = ledger.filter((row) => !requirementKeys.has(rowKey(row.capability, row.title)));
  const remainingNonKeep = ledger.filter((row) => row.disposition !== "Keep" && requirementKeys.has(rowKey(row.capability, row.title)));
  const missingKeep = ledger.filter((row) => row.disposition === "Keep" && !requirementKeys.has(rowKey(row.capability, row.title)));
  const unclassifiedLegacyRequirements = requirements.filter((record) => {
    const text = `${record.title}\n${record.body}`;
    return DIRECT_LEGACY_VOCABULARY.test(text) && !byKey.has(rowKey(record.capability, record.title)) && !EXPLICIT_HISTORICAL_REFERENCE.test(text);
  });
  const expected = phase === "before-sync"
    ? { missingLedgerTitles, remainingNonKeep: [], missingKeep: [] }
    : { missingLedgerTitles: [], remainingNonKeep, missingKeep };
  return Object.freeze({
    phase,
    totals: Object.freeze({ ledger: ledger.length, requirements: requirements.length, dispositions: Object.freeze(Object.fromEntries(RETIREMENT_DISPOSITIONS.map((disposition) => [disposition, ledger.filter((row) => row.disposition === disposition).length]))) }),
    missing_ledger_titles: Object.freeze(expected.missingLedgerTitles),
    remaining_non_keep: Object.freeze(expected.remainingNonKeep),
    missing_keep: Object.freeze(expected.missingKeep),
    unclassified_legacy_requirements: Object.freeze(unclassifiedLegacyRequirements),
    ok: expected.missingLedgerTitles.length === 0 && expected.remainingNonKeep.length === 0 && expected.missingKeep.length === 0 && unclassifiedLegacyRequirements.length === 0,
  });
}

function readMainSpecs(specsRoot) {
  const requirements = [];
  for (const capability of readdirSync(specsRoot).sort()) requirements.push(...parseRequirementBlocks(capability, readFileSync(join(specsRoot, capability, "spec.md"), "utf8")));
  return requirements;
}

/** Audits checked-in specification text only; no run-bundle or generated data is read. */
export function auditMainSpecRetirement({ repoRoot = process.cwd(), phase = "before-sync" } = {}) {
  const root = resolve(repoRoot);
  const ledger = parseRetirementLedger(readFileSync(join(root, "_backlog/plans/unify-image2-page-authority/main-spec-retirement-ledger.md"), "utf8"));
  return auditRetirementRequirements({ ledger, requirements: readMainSpecs(join(root, "openspec/specs")), phase });
}
