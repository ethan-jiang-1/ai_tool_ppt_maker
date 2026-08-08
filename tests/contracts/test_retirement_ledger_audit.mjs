import { describe, expect, it } from "vitest";
import {
  auditMainSpecRetirement,
  auditActiveRetirementSurface,
  auditRetirementRequirements,
  parseRetirementLedger,
} from "../../ppt_maker_harness/scripts/contracts/retirement_ledger_audit.mjs";

describe("main-spec retirement ledger audit", () => {
  it("covers current roots after main-spec synchronization", () => {
    const report = auditMainSpecRetirement({ phase: "after-sync" });
    expect(report.totals.ledger).toBe(0);
    expect(report.remaining_non_keep).toEqual([]);
    expect(report.missing_keep).toEqual([]);
    expect(report.unclassified_legacy_requirements).toEqual([]);
    expect(report.active_root_issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("scans active files only and flags a retired source marker", () => {
    const marker = ["page-image", "image2", "v1"].join("-");
    expect(auditActiveRetirementSurface({ files: { "openspec/specs/example/spec.md": marker } }))
      .toMatchObject({ ok: false, issues: [expect.objectContaining({ code: "retired-active-reference" })] });
  });

  it("distinguishes before-sync and after-sync coverage without reading production data", () => {
    const ledger = parseRetirementLedger([
      "| Capability | Exact current requirement | Disposition | Target owner | Test obligation |",
      "| `example` | `Old route` | Retire | observer | absence check |",
      "| `example` | `Neutral behavior` | Keep | current owner | regression |",
    ].join("\n"));
    const before = auditRetirementRequirements({ ledger, requirements: [
      { capability: "example", title: "Old route", body: "whole-page routing" },
      { capability: "example", title: "Neutral behavior", body: "current behavior" },
    ], phase: "before-sync" });
    const after = auditRetirementRequirements({ ledger, requirements: [{ capability: "example", title: "Neutral behavior", body: "current behavior" }], phase: "after-sync" });
    expect(before.ok).toBe(true);
    expect(after.ok).toBe(true);
  });

  it("fails an unclassified active legacy-vocabulary Requirement block", () => {
    const report = auditRetirementRequirements({ ledger: [], requirements: [{ capability: "example", title: "Undeclared route", body: "Current whole-page production is supported." }] });
    expect(report.ok).toBe(false);
    expect(report.unclassified_legacy_requirements).toHaveLength(1);
  });
});
