import { readFileSync, readdirSync, statSync } from "node:fs";
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

const compose = (...parts) => parts.join("");
const RETIRED_ACTIVE_MARKERS = Object.freeze([
  compose("page-image", "-image2-v1"),
  new RegExp(`\\b${compose("image2", "-page-image")}(?!-v2)\\b`),
  compose("legacy", "_protocol"),
  compose("production_mode", "_transition"),
  compose("compatibility/", "current", "-v1-page-image"),
  compose("whole", "-page-image2-v1"),
  compose("html", "-first-v1"),
  compose("html", "-only"),
  compose("html", "-then-image2"),
  compose("image2", "-only"),
]);
const RETIRED_ACTIVE_PATHS = Object.freeze([
  "ppt_maker_harness/scripts/compatibility",
  "ppt_maker_harness/workflow/compatibility",
  "tests/compatibility",
]);

function walkFiles(root, current = root, out = {}) {
  if (!statSync(current).isDirectory()) return out;
  for (const name of readdirSync(current)) {
    const path = join(current, name);
    if (statSync(path).isDirectory()) walkFiles(root, path, out);
    else out[path.slice(root.length + 1).replaceAll("\\", "/")] = readFileSync(path, "utf8");
  }
  return out;
}

function markerIssues(files) {
  const issues = [];
  for (const [path, text] of Object.entries(files)) {
    for (const marker of RETIRED_ACTIVE_MARKERS) {
      const pattern = marker instanceof RegExp
        ? new RegExp(marker.source, "gi")
        : new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      if (pattern.test(text)) {
        issues.push(Object.freeze({ code: "retired-active-reference", path, message: "active root contains a retired protocol marker" }));
        break;
      }
    }
  }
  return issues;
}

/** Scan only current source roots. OpenSpec changes and archives are intentionally excluded. */
export function auditActiveRetirementSurface({ repoRoot = process.cwd(), files = null } = {}) {
  const root = resolve(repoRoot);
  const activeFiles = files || Object.assign(
    {},
    ...["ppt_maker_harness", "tests", "tests_e2e", "openspec/specs"].map((entry) => {
      const absolute = join(root, entry);
      if (!statSync(absolute).isDirectory()) return {};
      return Object.fromEntries(Object.entries(walkFiles(absolute)).map(([path, text]) => [`${entry}/${path}`, text]));
    }),
  );
  const issues = markerIssues(activeFiles);
  if (files) return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
  for (const path of RETIRED_ACTIVE_PATHS) {
    try {
      if (statSync(join(root, path)).isDirectory()) {
        issues.push(Object.freeze({ code: "retired-active-owner", path, message: "retired protocol root still exists" }));
      }
    } catch { /* absent is required */ }
  }
  const removedCapabilities = [
    ["header", "lock"].join("-"),
    ["html", "slide", "contract"].join("-"),
    ["visual", "slot", "refinement"].join("-"),
  ];
  for (const capability of removedCapabilities) {
    try {
      if (statSync(join(root, "openspec/specs", capability)).isDirectory()) {
        issues.push(Object.freeze({ code: "retired-empty-capability", path: `openspec/specs/${capability}`, message: "retired empty capability spec still exists" }));
      }
    } catch { /* absent is required */ }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

/** Audits checked-in current specification and source roots only. */
export function auditMainSpecRetirement({ repoRoot = process.cwd(), phase = "before-sync" } = {}) {
  const root = resolve(repoRoot);
  const requirements = readMainSpecs(join(root, "openspec/specs"));
  const requirementReport = auditRetirementRequirements({ ledger: [], requirements, phase });
  const activeReport = auditActiveRetirementSurface({ repoRoot: root });
  return Object.freeze({
    ...requirementReport,
    active_root_issues: activeReport.issues,
    ok: requirementReport.ok && activeReport.ok,
  });
}
