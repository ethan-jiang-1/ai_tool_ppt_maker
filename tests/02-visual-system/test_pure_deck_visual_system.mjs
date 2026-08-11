import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  PAGE_IMAGE_PRESENTATION_SCHEMA,
  PageImagePresentationError,
  loadPageImagePresentationPackage,
  resolvePageImagePresentation,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import {
  FRAMED_HEADER_PROFILES_FILE,
  PAGE_CLASS_CATALOG_FILE,
  PAGE_IMAGE_DECK_DEFAULTS_FILE,
  PAGE_IMAGE_PRESENTATION_SUBDIR,
  PURE_DECK_VISUAL_SYSTEM_FILE,
  initBundle,
  pageImagePresentationAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "page-image-presentation-"));
  const deck = join(root, "deck_presentation");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  return { root, deck, runDir };
}

function framedHeader() {
  return {
    local_header: { kicker: null, title: "A title", subtitle: null },
    context_not_to_render: { kicker: null, title: "A title", subtitle: null },
  };
}

describe("Page Image presentation package", () => {
  it("loads the seeded four-file package and resolves isolated class projections", () => {
    const value = fixture();
    try {
      const presentationPackage = loadPageImagePresentationPackage(value.runDir);
      const pure = resolvePageImagePresentation({ package: presentationPackage, workflow: "pure", pageClass: "opening" });
      const framed = resolvePageImagePresentation({ package: presentationPackage, workflow: "framed", pageClass: "opening", headerPolicy: framedHeader() });
      const repeat = resolvePageImagePresentation({ package: loadPageImagePresentationPackage(value.runDir), workflow: "pure", pageClass: "opening" });

      expect(pure).toMatchObject({ schema: PAGE_IMAGE_PRESENTATION_SCHEMA, workflow: "pure", page_class: "opening", profile_id: "opening" });
      expect(pure).not.toHaveProperty("protected_geometry");
      expect(pure.provenance).toEqual({
        catalog: pageImagePresentationAsset(value.runDir, PAGE_CLASS_CATALOG_FILE),
        defaults: pageImagePresentationAsset(value.runDir, PAGE_IMAGE_DECK_DEFAULTS_FILE),
        profile: pageImagePresentationAsset(value.runDir, PURE_DECK_VISUAL_SYSTEM_FILE),
      });
      expect(repeat.binding_sha256).toBe(pure.binding_sha256);
      expect(framed).toMatchObject({ schema: PAGE_IMAGE_PRESENTATION_SCHEMA, workflow: "framed", page_class: "opening", profile_id: "opening" });
      expect(framed.profile).toHaveProperty("protected_geometry");
      expect(framed.provenance.profile).toBe(pageImagePresentationAsset(value.runDir, FRAMED_HEADER_PROFILES_FILE));
      expect(framed).not.toHaveProperty("pure_profiles");
      expect(Object.isFrozen(framed)).toBe(true);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses the matching version override without rewriting the backbone source", () => {
    const value = fixture();
    try {
      const backbone = pageImagePresentationAsset(value.runDir, PURE_DECK_VISUAL_SYSTEM_FILE);
      const before = readFileSync(backbone, "utf8");
      const override = join(value.runDir, "overrides", "visual-style", PAGE_IMAGE_PRESENTATION_SUBDIR, PURE_DECK_VISUAL_SYSTEM_FILE);
      mkdirSync(join(value.runDir, "overrides", "visual-style", PAGE_IMAGE_PRESENTATION_SUBDIR), { recursive: true });
      writeFileSync(override, before.replace("whitespace: generous", "whitespace: balanced"), "utf8");

      const selected = resolvePageImagePresentation({ package: loadPageImagePresentationPackage(value.runDir), workflow: "pure", pageClass: "standard" });
      expect(pageImagePresentationAsset(value.runDir, PURE_DECK_VISUAL_SYSTEM_FILE)).toBe(override);
      expect(selected.profile.layout.whitespace).toBe("balanced");
      expect(readFileSync(backbone, "utf8")).toBe(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails the complete package when a catalog binding names no workflow profile", () => {
    const value = fixture();
    try {
      const catalog = pageImagePresentationAsset(value.runDir, PAGE_CLASS_CATALOG_FILE);
      writeFileSync(catalog, readFileSync(catalog, "utf8").replace("opening: { pure: opening, framed: opening }", "opening: { pure: absent, framed: opening }"), "utf8");
      expect(() => loadPageImagePresentationPackage(value.runDir)).toThrow(PageImagePresentationError);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a Framed header literal that the selected profile does not permit", () => {
    const value = fixture();
    try {
      const presentationPackage = loadPageImagePresentationPackage(value.runDir);
      expect(() => resolvePageImagePresentation({
        package: presentationPackage,
        workflow: "framed",
        pageClass: "opening",
        headerPolicy: {
          local_header: { kicker: null, title: "A title", subtitle: "Not permitted" },
          context_not_to_render: { kicker: null, title: "A title", subtitle: "Not permitted" },
        },
      })).toThrow(/does not permit a Framed subtitle literal/);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps a selected binding stable when a valid unselected sibling profile changes", () => {
    const value = fixture();
    try {
      const before = resolvePageImagePresentation({ package: loadPageImagePresentationPackage(value.runDir), workflow: "pure", pageClass: "standard" });
      const pure = pageImagePresentationAsset(value.runDir, PURE_DECK_VISUAL_SYSTEM_FILE);
      writeFileSync(pure, readFileSync(pure, "utf8").replace("  opening:\n", "  opening:\n    # sibling-only update\n"), "utf8");
      const after = resolvePageImagePresentation({ package: loadPageImagePresentationPackage(value.runDir), workflow: "pure", pageClass: "standard" });
      expect(after.binding_sha256).toBe(before.binding_sha256);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("stops package evaluation when an unselected sibling profile is malformed", () => {
    const value = fixture();
    try {
      const pure = pageImagePresentationAsset(value.runDir, PURE_DECK_VISUAL_SYSTEM_FILE);
      writeFileSync(pure, readFileSync(pure, "utf8").replace("  opening:\n    typography:", "  opening:\n    provider_prompt: forbidden\n    typography:"), "utf8");
      expect(() => loadPageImagePresentationPackage(value.runDir)).toThrow(PageImagePresentationError);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("requires all four direct presentation sources", () => {
    const value = fixture();
    try {
      const framed = pageImagePresentationAsset(value.runDir, FRAMED_HEADER_PROFILES_FILE);
      rmSync(framed);
      expect(existsSync(framed)).toBe(false);
      expect(() => loadPageImagePresentationPackage(value.runDir)).toThrow(/presentation source is unavailable/);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
