import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ContentAddressStoreError,
  resolveContentAddressName,
  shortName,
} from "../../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";

const digest = (prefix) => `${prefix}${"0".repeat(64 - prefix.length)}`;

function recordHash(pathname) {
  return JSON.parse(readFileSync(pathname, "utf8")).sha256;
}

describe("content-addressed short storage names", () => {
  it("derives exactly the first eight hex characters", () => {
    expect(shortName("0123456789abcdef".repeat(4))).toBe("01234567");
  });

  it("fails an occupied short-prefix collision without overwriting its record", () => {
    const root = mkdtempSync(join(tmpdir(), "content-address-store-"));
    const first = digest("deadbeef1");
    const second = digest("deadbeef2");
    const entry = join(root, shortName(first));
    try {
      mkdirSync(entry);
      writeFileSync(join(entry, "record.json"), JSON.stringify({ sha256: first }));

      expect(() => resolveContentAddressName(root, second, {
        recordHashReader: (candidate) => recordHash(join(candidate, "record.json")),
        forWrite: true,
      })).toThrow(ContentAddressStoreError);
      expect(() => resolveContentAddressName(root, second, {
        recordHashReader: (candidate) => recordHash(join(candidate, "record.json")),
        forWrite: true,
      })).toThrow(/deadbeef/);
      expect(recordHash(join(entry, "record.json"))).toBe(first);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses a matching short record and does not trust a foreign one", () => {
    const root = mkdtempSync(join(tmpdir(), "content-address-store-"));
    const expected = digest("01234567");
    const foreign = digest("01234568");
    try {
      mkdirSync(join(root, shortName(expected)));
      writeFileSync(join(root, shortName(expected), "record.json"), JSON.stringify({ sha256: expected }));
      expect(resolveContentAddressName(root, expected, {
        recordHashReader: (candidate) => recordHash(join(candidate, "record.json")),
      })).toBe(shortName(expected));

      rmSync(join(root, shortName(expected)), { recursive: true });
      mkdirSync(join(root, shortName(expected)));
      writeFileSync(join(root, shortName(expected), "record.json"), JSON.stringify({ sha256: foreign }));
      expect(() => resolveContentAddressName(root, expected, {
        recordHashReader: (candidate) => recordHash(join(candidate, "record.json")),
      })).toThrow(/occupied/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("falls back to a verified legacy full-hash entry", () => {
    const root = mkdtempSync(join(tmpdir(), "content-address-store-"));
    const expected = digest("01234567");
    const foreign = digest("01234568");
    try {
      mkdirSync(join(root, shortName(expected)));
      writeFileSync(join(root, shortName(expected), "record.json"), JSON.stringify({ sha256: foreign }));
      mkdirSync(join(root, expected));
      writeFileSync(join(root, expected, "record.json"), JSON.stringify({ sha256: expected }));

      expect(resolveContentAddressName(root, expected, {
        recordHashReader: (candidate) => recordHash(join(candidate, "record.json")),
      })).toBe(expected);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
