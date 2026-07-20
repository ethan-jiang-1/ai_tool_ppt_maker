import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateHtmlFamilyGeometryBytes } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/generate_html_family_geometry.mjs";
import { seedHtmlVisualPresetBytes } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/seed_html_visual_presets.mjs";

describe("import-safe geometry and preset contracts", () => {
  it("regenerates the checked-in geometry bytes without a Phase back edge", () => {
    expect(generateHtmlFamilyGeometryBytes()).toBe(readFileSync(
      "PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json",
      "utf8",
    ));
  });

  it("builds preset bytes as a pure function from the Phase-2 owner path", () => {
    const path = "PPTMAKER_FRAMEWORK/workflow/02-visual-system/presets/dark-executive/color_palette.json";
    const source = JSON.parse(readFileSync(path, "utf8"));
    expect(JSON.parse(seedHtmlVisualPresetBytes("dark-executive", source))).toEqual(source);
  });
});
