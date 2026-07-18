#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HTML_COMPONENTS_SPEC,
  HTML_SPACING_SPEC,
  htmlTypographySource,
} from "../lib/html_visual_tokens.mjs";

const FRAMEWORK = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PRESETS = resolve(FRAMEWORK, "workflow", "01-visual", "presets");

const records = {
  "clean-clinical": {
    palette: ["background", "colors.panel_card.hex", "colors.primary_text.hex", "colors.secondary_text.hex", "colors.emphasis.hex", "colors.positive_accent.hex", "colors.warning.hex", "colors.divider.hex"],
    language: ["clinical editorial vector diagrams and restrained data visualization", "matte white paper with restrained teal and blue accents", "soft diffuse daylight with no dramatic glow", "nearly textureless with subtle paper grain", "precise grid, generous whitespace, evidence-first hierarchy"],
  },
  "corporate-safe": {
    palette: ["background", "colors.panel_card.hex", "colors.primary_text.hex", "colors.secondary_text.hex", "colors.primary_brand.hex", "colors.positive_accent.hex", "colors.warning.hex", "colors.divider.hex"],
    language: ["polished corporate information design and restrained vector geometry", "matte white boardroom paper with solid blue and slate surfaces", "neutral even studio light", "clean flat surfaces with minimal texture", "conservative grid, aligned panels, clear executive hierarchy"],
  },
  "dark-executive": {
    palette: ["background", "colors.panel_card.hex", "colors.primary_text.hex", "colors.secondary_text.hex", "colors.emphasis.hex", "colors.positive_accent.hex", "colors.data_analysis.hex", "colors.muted.hex"],
    language: ["cinematic dark-interface information design with crisp vector forms", "deep navy glass, brushed metal, and luminous cyan-blue accents", "controlled edge lighting and restrained cool glow", "fine technical grain without noisy particles", "high-contrast focal hierarchy, disciplined asymmetry, generous negative space"],
  },
  "tech-startup": {
    palette: ["background", "colors.panel_card.hex", "colors.primary_text.hex", "colors.secondary_text.hex", "colors.accent_cyber.hex", "colors.emphasis.hex", "colors.data.hex", "colors.muted.hex"],
    language: ["futuristic SaaS information design with synthwave vector geometry", "deep purple glass with neon cyan and magenta light", "controlled neon rim light with localized glow", "subtle digital grain and gradient depth", "bold central focal point, energetic diagonals, clean product-like spacing"],
  },
  "warm-editorial": {
    palette: ["background", "colors.panel_card.hex", "colors.primary_text.hex", "colors.secondary_text.hex", "colors.accent_warmth.hex", "colors.premium.hex", "colors.calm.hex", "colors.divider.hex"],
    language: ["warm editorial illustration and refined information design", "cream paper, charcoal ink, rust, and muted-gold accents", "soft warm natural light", "subtle paper grain and tactile print finish", "editorial rhythm, human scale, asymmetric whitespace, calm hierarchy"],
  },
};

const paletteKeys = ["background", "surface", "text", "muted_text", "accent", "accent_secondary", "accent_tertiary", "divider"];
const languageKeys = ["medium", "material", "lighting", "texture", "composition"];
for (const [name, record] of Object.entries(records)) {
  const path = resolve(PRESETS, name, "color_palette.json");
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.html_first = {
    schema_version: 1,
    canvas: { width: 1000, height: 562.5 },
    palette: Object.fromEntries(paletteKeys.map((key, index) => [key, record.palette[index]])),
    typography: htmlTypographySource(),
    spacing: HTML_SPACING_SPEC,
    components: HTML_COMPONENTS_SPEC,
    image_language: { ...Object.fromEntries(languageKeys.map((key, index) => [key, record.language[index]])), avoid: "forbidden" },
    geometry: { registry: "html-family-geometry-v1" },
  };
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}
