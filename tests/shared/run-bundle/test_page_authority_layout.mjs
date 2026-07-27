import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_INIT_MODE,
  PAGE_AUTHORITY_IMAGE2_PATHS,
  checkBundle,
  initBundle,
  initLegacyFixtureBundle,
  pageAuthorityImage2Paths,
  renderTree,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

describe("Page Authority bundle layout", () => {
  it("declares one rebuildable Page Authority artifact topology", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-layout-"));
    try {
      const runDir = join(root, "deck_current", "3_versions", "v1");
      const paths = pageAuthorityImage2Paths(runDir);
      expect(Object.keys(paths).sort()).toEqual(Object.keys(PAGE_AUTHORITY_IMAGE2_PATHS).sort());
      expect(paths.raw_manifest).toContain("_generated/page_authority_image2/raw/manifest.json");
      expect(paths.final_manifest).toContain("_generated/page_authority_image2/final/manifest.json");
      expect(renderTree()).toContain("page_authority_image2");
      expect(renderTree()).not.toContain("html_production");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("initializes only the current Page Authority topology", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-init-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      expect(DEFAULT_INIT_MODE).toBe("image2-page-authority");
      expect(checkBundle(runDir, false)).toEqual([]);
      expect(existsSync(pageAuthorityImage2Paths(runDir).root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects every non-Page-Authority generated owner from current validation", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-owner-"));
    try {
      const deck = join(root, "deck_current");
      initBundle(deck);
      const runDir = join(deck, "3_versions", "v1");
      const retiredOwner = join(runDir, "_generated", "retired-owner");
      writeFileSync(retiredOwner, "not current", "utf8");
      expect(checkBundle(runDir, false)).toContain("unexpected current generated owner 'retired-owner' — Page Authority owns page_authority_image2/ only");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps historical fixture construction explicitly observer-only", () => {
    const root = mkdtempSync(join(tmpdir(), "legacy-observer-fixture-"));
    try {
      const deck = join(root, "deck_historical");
      initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
      const runDir = join(deck, "3_versions", "v1");
      expect(checkBundle(runDir, false)).toContain("historical production source is observer/adoption-only and cannot pass normal bundle validation");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
