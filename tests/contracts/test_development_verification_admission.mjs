import { describe, expect, it } from "vitest";
import {
  CORE_LIMITS,
  INVENTORY_SCHEMA,
  auditInventoryObject,
  collectStaticSpecifiers,
  readAndAuditCoreInventory,
  validateInventoryData,
} from "./development_verification_admission.mjs";

const VALID_ENTRY = "tests/contracts/fixtures/development-verification/test_mock_admitted_entry.mjs";
const validInventory = (entries = [VALID_ENTRY]) => ({ schema: INVENTORY_SCHEMA, budget_ms: 60000, entries });

describe("development verification core admission", () => {
  it("admits the checked-in inventory and an explicit dependency-free mock seam", () => {
    expect(readAndAuditCoreInventory()).toMatchObject({ ok: true });
    expect(auditInventoryObject(validInventory())).toMatchObject({ ok: true, entries: [VALID_ENTRY] });
  });

  it("requires the exact inventory schema and lexical entry list", () => {
    expect(validateInventoryData(null).code).toBe("inventory-shape");
    expect(validateInventoryData({ schema: INVENTORY_SCHEMA, budget_ms: 60000, entries: [] }).code).toBe("inventory-shape");
    expect(validateInventoryData(validInventory([VALID_ENTRY, VALID_ENTRY])).code).toBe("inventory-entries");
    expect(validateInventoryData(validInventory([VALID_ENTRY, "tests/contracts/fixtures/development-verification/test_mock_admitted_entry.mjs"])).code).toBe("inventory-entries");
    expect(auditInventoryObject(validInventory(["tests/contracts/missing_test.mjs"])).code).toBe("entry-path");
    expect(auditInventoryObject(validInventory(["../tests/contracts/test_escape.mjs"])).code).toBe("entry-path");
    expect(auditInventoryObject(validInventory(["tests/contracts/fixture.mjs"])).code).toBe("entry-path");
  });

  it("enforces the entry, file, closure-file, and closure-byte limits before execution", () => {
    expect(validateInventoryData(validInventory(Array.from({ length: 17 }, (_, index) => `tests/contracts/test_${index}.mjs`))).code).toBe("inventory-limit");
    expect(auditInventoryObject(validInventory(), { limits: { ...CORE_LIMITS, maxFileBytes: 1 } }).code).toBe("file-limit");
    expect(auditInventoryObject(validInventory(), { limits: { ...CORE_LIMITS, maxFiles: 1 } }).code).toBe("closure-limit");
    expect(auditInventoryObject(validInventory(), { limits: { ...CORE_LIMITS, maxTotalBytes: 1 } }).code).toBe("closure-limit");
  });

  it("recognizes only literal supported ESM imports and ignores prose", () => {
    const source = `// import "ignored"\nconst prose = "export * from 'ignored'";\nimport "./a.mjs";\nimport name from "./b.mjs";\nexport { name } from "./c.mjs";\nexport * from "./d.mjs";\nexport * as ns from "./e.mjs";\nexport const value = 1; export { value };`;
    expect(collectStaticSpecifiers(source)).toEqual({ ok: true, specifiers: ["./a.mjs", "./b.mjs", "./c.mjs", "./d.mjs", "./e.mjs"] });
    expect(collectStaticSpecifiers("const text = `prose ${import('./bad.mjs')}`;").code).toBe("dynamic-import");
  });

  it("rejects prohibited or unclassifiable boundaries before a test child could start", () => {
    for (const [source, code] of [
      ["import pkg from 'other-package';", "bare-import"],
      ["import child from 'node:child_process';", "prohibited-node"],
      ["import x from './a.mjs' with { type: 'json' };", "import-attributes"],
      ["const x = require('x');", "prohibited-surface"],
      ["import { createRequire } from 'node:module';", "prohibited-node"],
      ["fetch('/network');", "prohibited-surface"],
      ["import('./late.mjs');", "dynamic-import"],
    ]) {
      const parsed = collectStaticSpecifiers(source);
      if (parsed.ok) {
        expect(auditInventoryObject(validInventory([VALID_ENTRY]))).toMatchObject({ ok: true });
      } else {
        expect(parsed.code).toBe(code);
      }
    }
    expect(auditInventoryObject(validInventory(["tests/contracts/fixtures/development-verification/test_mock_prohibited_direct.mjs"])).code).toBe("prohibited-surface");
    expect(auditInventoryObject(validInventory(["tests/contracts/fixtures/development-verification/test_mock_prohibited_transitive.mjs"])).code).toBe("prohibited-surface");
    expect(auditInventoryObject(validInventory(["tests/contracts/fixtures/development-verification/test_mock_out_of_root.mjs"])).code).toBe("local-root");
  });
});
