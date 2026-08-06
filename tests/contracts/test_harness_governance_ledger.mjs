import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ledger = JSON.parse(readFileSync("tests/contracts/harness-governance-ledger-v2.json", "utf8"));
const FIELDS = ["classification", "disposition", "failure_story", "id", "invariant", "next_action", "owner", "source"];

function validateLedger(value) {
  const errors = [];
  if (value?.schema !== "pptmaker-harness-governance-ledger-v2" || !Array.isArray(value.rules)) return ["invalid schema or rules"];
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
});
