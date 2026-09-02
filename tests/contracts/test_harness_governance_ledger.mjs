// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/harness-charter/spec.md
// Tests: openspec/specs/harness-script-layout/spec.md
// Tests: openspec/specs/production-schema-conformance/spec.md
// Tests: openspec/specs/harness-directory-layout/spec.md
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const ledger = JSON.parse(readFileSync("tests/contracts/harness-governance-ledger.json", "utf8"));
const FIELDS = ["classification", "disposition", "failure_story", "id", "invariant", "next_action", "owner", "source"];

function validateLedger(value) {
  const errors = [];
  if (value?.schema !== "pptmaker-harness-governance-ledger" || !Array.isArray(value.rules)) return ["invalid schema or rules"];
  const ids = new Set();
  for (const row of value.rules) {
    if (!row || Object.keys(row).sort().join("\n") !== FIELDS.join("\n")) { errors.push("row must use the closed governance schema"); continue; }
    if (!/^[a-z][a-z0-9-]{2,63}$/.test(row.id) || ids.has(row.id)) errors.push(`invalid or duplicate id ${row.id}`);
    ids.add(row.id);
    if (!['guide', 'confirm', 'hard-stop'].includes(row.classification)) errors.push(`invalid classification ${row.id}`);
    if (!['retain', 'remove', 'advisory'].includes(row.disposition)) errors.push(`invalid disposition ${row.id}`);
    if (row.classification === 'hard-stop' && row.disposition === 'retain') {
      for (const key of ['source', 'invariant', 'failure_story', 'owner', 'next_action']) {
        if (typeof row[key] !== 'string' || !row[key].trim()) errors.push(`retained hard-stop ${row.id} lacks ${key}`);
      }
    }
  }
  return errors;
}

function resolveSourceTarget(source) {
  // Two forms: "path:funcName" (function must be declared) or "path" (file must exist).
  // Ledger source paths are relative to ppt_maker_harness/ (e.g. "scripts/contracts/x.mjs").
  const colon = source.lastIndexOf(":");
  let filePath = source;
  let funcName = null;
  if (colon > source.lastIndexOf("/") && !/^[a-zA-Z]:/.test(source)) {
    filePath = source.slice(0, colon);
    funcName = source.slice(colon + 1);
  }
  if (filePath.startsWith("scripts/")) filePath = `ppt_maker_harness/${filePath}`;
  return { filePath, funcName };
}

function validateLedgerSources(value) {
  const errors = [];
  for (const row of value.rules) {
    const { filePath, funcName } = resolveSourceTarget(row.source);
    const abs = join(REPO_ROOT, filePath);
    if (!existsSync(abs)) {
      errors.push(`${row.id}: source file does not exist: ${filePath}`);
      continue;
    }
    if (funcName) {
      const text = readFileSync(abs, "utf8");
      if (!new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${funcName}\\b`).test(text) &&
          !new RegExp(`(?:^|\\n)\\s*export\\s+const\\s+${funcName}\\b`).test(text)) {
        errors.push(`${row.id}: source function is not declared: ${funcName} in ${filePath}`);
      }
    }
  }
  return errors;
}

describe("Harness governance ledger", () => {
  it("contains only actionable audited governance rules", () => {
    expect(validateLedger(ledger)).toEqual([]);
  });

  it("rejects a retained hard-stop without a failure story or owner", () => {
    const invalid = structuredClone(ledger);
    invalid.rules[0].failure_story = "";
    invalid.rules[0].owner = "";
    expect(validateLedger(invalid)).toEqual(expect.arrayContaining([
      expect.stringContaining("failure_story"),
      expect.stringContaining("owner"),
    ]));
  });

  it("resolves every source pointer to an existing file and declared symbol", () => {
    expect(validateLedgerSources(ledger)).toEqual([]);
  });

  it("rejects a dead source function pointer", () => {
    const invalid = structuredClone(ledger);
    invalid.rules[0].source = "scripts/shared/state/state.mjs:validateProductionModeStructure";
    expect(validateLedgerSources(invalid)).toEqual(expect.arrayContaining([
      expect.stringContaining("validateProductionModeStructure"),
    ]));
  });
});
