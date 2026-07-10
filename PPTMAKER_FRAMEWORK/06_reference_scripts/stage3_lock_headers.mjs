#!/usr/bin/env node
/**
 * Stage 3: Lock headers — overlay kicker/title/subtitle text onto AI-generated images.
 *
 * Reads raw images from Stage 2 and slide_plan.json from Stage 1.
 * - body+header-lock slides: render kicker + title + subtitle at fixed pixel positions (@napi-rs/canvas)
 * - full-page slides: pass through unchanged (AI already rendered the full page including text)
 *
 * This is the Header-Lock mechanism: AI handles creative body visuals, Node.js handles
 * deterministic text placement.
 *
 * Usage:
 *     node stage3_lock_headers.mjs \
 *         --images 3_versions/v1/_generated/page_images_full/ \
 *         --slide-plan 3_versions/v1/_generated/slide_plan.json \
 *         --out 3_versions/v1/_generated/header_locked/ \
 *         --style-dir 2_backbone/visual-style/
 *
 * Customization:
 *     Canvas, header positions, line heights, colors, font family/weight, and sizes
 *     all come from color_palette.json through visual_config.mjs. Fonts resolve
 *     cross-platform automatically (see _load_font): a bundled `fonts/` dir next to
 *     this script wins, then $PPT_FONT_DIR, then the common OS font dirs.
 *     If it's absent, rendering degrades to a readable, correctly-sized fallback
 *     sans (loud warning) and only hard-aborts if no usable font exists at all — it
 *     never silently emits mis-sized headers. For CJK text, add Noto Sans CJK and
 *     point FONT_BOLD/SEMIBOLD/REGULAR at it.
 */

// --- Node.js builtins (all imports at top for ESM purity) -------------------
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { readdir } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// --- @napi-rs/canvas --------------------------------------------------------
import { createCanvas, Image, GlobalFonts } from "@napi-rs/canvas";

// --- Shared imports from sibling ESM modules --------------------------------
import {
  loadVisualConfig,
  DEFAULT_CONFIG,
  hexToRgba,
  VisualConfigError,
} from "./visual_config.mjs";

import {
  BACKBONE_STYLE_SUBDIR,
  COLOR_PALETTE_FILE,
  styleAsset,
  styleDir,
  generatedDir,
} from "./bundle_layout.mjs";

// ---------------------------------------------------------------------------
// Canonical render-mode vocabulary (inlined from stage1_build_inputs.py)
// No ESM port of stage1 exists yet, so constant definitions live here.
// ---------------------------------------------------------------------------

export const RENDER_MODE_FULL_PAGE = "full-page";
export const RENDER_MODE_BODY_HEADER_LOCK = "body+header-lock";
const CANONICAL_RENDER_MODES = new Set([
  RENDER_MODE_FULL_PAGE,
  RENDER_MODE_BODY_HEADER_LOCK,
]);

/**
 * Read canonical render_mode from a layout_contract.
 *
 * Prefers `render_mode` (v1.3+). Falls back to legacy `header_variant`
 * alias (`image_direct` / `body+header-lock`). If neither is recognised,
 * defaults to body+header-lock.
 *
 * Mirrors Python `stage1._contract_render_mode`.
 * @param {Record<string, any>} layout
 * @returns {string}
 */
function contractRenderMode(layout) {
  if (!layout || typeof layout !== "object") {
    return RENDER_MODE_BODY_HEADER_LOCK;
  }
  // canonical render_mode (v1.3+)
  const mode = layout.render_mode;
  if (CANONICAL_RENDER_MODES.has(mode)) {
    return mode;
  }
  // legacy header_variant alias
  const hv = layout.header_variant;
  if (hv) {
    const key = hv.toLowerCase().replace(/[ _-]/g, "");
    if (key === "fulpage" || key === "imagedirect" || key === "full-page") {
      return RENDER_MODE_FULL_PAGE;
    }
    if (key === "bodyheaderlock" || key === "body+headerlock" || key === "normal") {
      return RENDER_MODE_BODY_HEADER_LOCK;
    }
  }
  return RENDER_MODE_BODY_HEADER_LOCK;
}

// ---------------------------------------------------------------------------
// Shared executable visual configuration
// ---------------------------------------------------------------------------

let CANVAS_SIZE = [1672, 941];
let KICKER_SIZE = 22;
let TITLE_SIZE = 46;
let SUBTITLE_SIZE = 27;
let KICKER_POS = [46, 24];
let TITLE_POS = [46, 58];
let SUBTITLE_Y_OFFSET = 8;
let TITLE_LINE_HEIGHT = 52;
let SUBTITLE_LINE_HEIGHT = 31;
let MAX_TITLE_WIDTH = 1568;
let KICKER_COLOR = [190, 203, 218, 255];
let TITLE_COLOR = [244, 248, 252, 255];
let SUBTITLE_COLOR = [164, 184, 204, 255];
let TEXT_SHADOW = [180, 180, 180, 80];

let KICKER_FONT_FAMILY = "Source Sans Pro";
let KICKER_FONT_WEIGHT = "Semibold";
let TITLE_FONT_FAMILY = "Source Sans Pro";
let TITLE_FONT_WEIGHT = "Bold";
let SUBTITLE_FONT_FAMILY = "Source Sans Pro";
let SUBTITLE_FONT_WEIGHT = "Regular";

// Backward-compatible names for callers that used _load_font(FONT_REGULAR, size).
let FONT_BOLD = "Source Sans Pro";
let FONT_SEMIBOLD = "Source Sans Pro";
let FONT_REGULAR = "Source Sans Pro";

/**
 * Expose the shared config through module globals used by rendering helpers.
 * Mirrors Python `_apply_visual_config`.
 * @param {ReturnType<typeof DEFAULT_CONFIG>} config
 */
function applyVisualConfig(config) {
  const { header_lock: header } = config;
  const position = header.position;

  CANVAS_SIZE = [config.canvas.width_px, config.canvas.height_px];
  KICKER_SIZE = header.kicker.size_px;
  TITLE_SIZE = header.title.size_px;
  SUBTITLE_SIZE = header.subtitle.size_px;
  KICKER_POS = [position.left_px, position.kicker_y_px];
  TITLE_POS = [position.left_px, position.title_y_px];
  SUBTITLE_Y_OFFSET = position.subtitle_gap_px;
  TITLE_LINE_HEIGHT = position.title_line_height_px;
  SUBTITLE_LINE_HEIGHT = position.subtitle_line_height_px;
  MAX_TITLE_WIDTH = config.canvas.width_px - position.left_px - position.right_margin_px;
  KICKER_COLOR = hexToRgba(header.kicker.color);
  TITLE_COLOR = hexToRgba(header.title.color);
  SUBTITLE_COLOR = hexToRgba(header.subtitle.color);

  const backgroundRed = parseInt(config.background.substring(1, 3), 16);
  TEXT_SHADOW =
    backgroundRed > 128
      ? [180, 180, 180, 80]
      : [0, 6, 16, 180];

  KICKER_FONT_FAMILY = header.kicker.family;
  KICKER_FONT_WEIGHT = header.kicker.weight;
  TITLE_FONT_FAMILY = header.title.family;
  TITLE_FONT_WEIGHT = header.title.weight;
  SUBTITLE_FONT_FAMILY = header.subtitle.family;
  SUBTITLE_FONT_WEIGHT = header.subtitle.weight;

  FONT_BOLD = TITLE_FONT_FAMILY;
  FONT_SEMIBOLD = KICKER_FONT_FAMILY;
  FONT_REGULAR = SUBTITLE_FONT_FAMILY;
}

applyVisualConfig(DEFAULT_CONFIG);

// ---------------------------------------------------------------------------
// ADVANCED: Opener variant (larger title for session openers)
// ---------------------------------------------------------------------------
// Session opener slides often want larger fonts and a deeper header safe zone
// (e.g. 390px vs 260px) for visual impact. Uncomment and customize if your deck
// has distinct opener slides:
//
// const OPENER_LEFT = 58;
// const OPENER_KICKER_Y = 40;
// const OPENER_TITLE_Y = 92;
// const OPENER_TITLE_SIZE = 82;
// const OPENER_SUBTITLE_SIZE = 34;
// const OPENER_SAFE_ZONE = 390;
// const OPENER_MAX_TITLE_WIDTH = CANVAS_SIZE[0] - OPENER_LEFT - 300;
//
// const OPENER_IDS = new Set(["slide_01_title", "slide_07_bridge"]);
//
// To activate: in drawHeader(), check if slide['id'] in OPENER_IDS and
// route to a separate drawOpenerHeader() function with the above constants.

// ---------------------------------------------------------------------------
// ADVANCED: Body shift (when AI content drifts into header zone)
// ---------------------------------------------------------------------------
// Sometimes GPT Image 2 places visual elements too close to the header,
// especially on complex slides with diagrams near the top. Shifting the raw
// image body DOWN by ~24px (filling the gap with background color) avoids
// collisions without regenerating.
//
// const BODY_SHIFT_BY_ID = {
//     "slide_04_diagram": 24,
//     "slide_13_habits": 24,
// };
//
// To activate: before drawing header, crop top N px of the image, paste
// the image shifted down, and fill the gap with background color sampled
// from the top edge of the original image.

// ---------------------------------------------------------------------------
// Font resolution
// ---------------------------------------------------------------------------

// A framework-bundled fonts dir wins (drop OTFs here for a reproducible deck that
// doesn't depend on OS-installed fonts); then $PPT_FONT_DIR; then common OS dirs.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _BUNDLED_FONTS_DIR = resolve(__dirname, "fonts");

// Size-respecting fallbacks tried (in order) when the configured face is absent — a
// different typeface, but readable and correctly sized.
const _FALLBACK_FONTS = [
  "DejaVuSans-Bold.ttf",
  "DejaVuSans.ttf",
  "Arial Bold.ttf",
  "Arial.ttf",
  "ArialBd.ttf",
  "LiberationSans-Bold.ttf",
  "LiberationSans-Regular.ttf",
  "Helvetica.ttc",
];

/** @type {Set<string>} — warn once per missing intended face, not per slide */
const _FONT_WARNED = new Set();

// --- Filesystem helpers ---

/**
 * `statSync(p).isDirectory()` with error swallowing.
 * @param {string} p
 * @returns {boolean}
 */
function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Search-ordered font directories: bundled > $PPT_FONT_DIR > common OS dirs.
 * @returns {string[]}
 */
function fontDirs() {
  const home = process.env.HOME || "/tmp";
  const dirs = [_BUNDLED_FONTS_DIR];
  const envDir = process.env.PPT_FONT_DIR;
  if (envDir) dirs.push(resolve(envDir));
  dirs.push(
    "/Library/Fonts",
    join(home, "Library", "Fonts"),                      // macOS user
    "/System/Library/Fonts",
    "/System/Library/Fonts/Supplemental",
    "/usr/share/fonts",                                   // Linux
    "/usr/local/share/fonts",
    join(home, ".fonts"),
    join(home, ".local", "share", "fonts"),
    "C:/Windows/Fonts",                                   // Windows
  );
  return dirs.filter((d) => isDir(d));
}

/**
 * Recursive walk collecting all files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function walkFiles(dir) {
  if (!isDir(dir)) return [];
  const result = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = join(current, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        result.push(full);
      }
    }
  }
  return result;
}

/**
 * Detect file-extension portion of a filename (includes leading dot).
 * @param {string} name
 * @returns {string}
 */
function fileExt(name) {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.substring(dot);
}

// --- Font file discovery ---

/**
 * Locate a font FILE by name across the search dirs (recursive — Linux nests
 * fonts deeply). Returns the first match or null.
 * Mirrors Python `_find_font_file`.
 * @param {string} name
 * @returns {string | null}
 */
function findFontFile(name) {
  for (const d of fontDirs()) {
    const exact = join(d, name);
    if (existsSync(exact)) {
      return exact;
    }
    // Recursive search for files whose basename matches
    const allFiles = walkFiles(d);
    const matches = allFiles
      .filter((f) => basename(f) === name)
      .sort();
    if (matches.length > 0) {
      return matches[0];
    }
  }
  return null;
}

/**
 * Generate common font filenames from configured family + weight.
 * Mirrors Python `_font_name_candidates`.
 * @param {string} family
 * @param {string} weight
 * @returns {string[]}
 */
function fontNameCandidates(family, weight) {
  const ext = fileExt(family).toLowerCase();
  if ([".otf", ".ttf", ".ttc"].includes(ext)) {
    return [family];
  }
  const familyForms = [family, family.replace(/\s+/g, ""), family.replace(/\s+/g, "-")];
  const weightForms = [weight, weight.replace(/\s+/g, ""), weight.replace(/\s+/g, "-")];
  /** @type {string[]} */
  const names = [];
  for (const familyForm of familyForms) {
    for (const weightForm of weightForms) {
      for (const separator of ["-", "", " "]) {
        const stem = weightForm ? `${familyForm}${separator}${weightForm}` : familyForm;
        for (const ext of [".otf", ".ttf", ".ttc"]) {
          const candidate = stem + ext;
          if (!names.includes(candidate)) {
            names.push(candidate);
          }
        }
      }
    }
  }
  return names;
}

/**
 * Find the configured font file for (family, weight), or return a fallback.
 * Returns [fontPath, candidates].
 * Mirrors Python `_find_configured_font`.
 * @param {string} family
 * @param {string} weight
 * @returns {[string | null, string[]]}
 */
function findConfiguredFont(family, weight) {
  const candidates = fontNameCandidates(family, weight);
  // 1. Exact name match
  for (const candidate of candidates) {
    const hit = findFontFile(candidate);
    if (hit) return [hit, candidates];
  }

  // 2. Last resort: alphanumeric-token fuzzy match across all font dirs
  const familyKey = family.toLowerCase().replace(/[^a-z0-9]/g, "");
  const weightKey = weight.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fontExts = new Set([".otf", ".ttf", ".ttc"]);
  for (const directory of fontDirs()) {
    const files = walkFiles(directory).sort();
    for (const path of files) {
      if (!fontExts.has(fileExt(path).toLowerCase())) continue;
      const stemKey = basename(path)
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (stemKey.includes(familyKey) && (!weightKey || stemKey.includes(weightKey))) {
        return [path, candidates];
      }
    }
  }
  return [null, candidates];
}

// ---------------------------------------------------------------------------
// Font registration (Canvas-specific)
// ---------------------------------------------------------------------------

/**
 * Map a weight string to a CSS font-weight value for ctx.font strings.
 * @param {string} weight
 * @returns {string}
 */
function weightToCss(weight) {
  const w = weight.toLowerCase().trim();
  if (w === "bold" || w.includes("700")) return "bold";
  if (w === "semibold" || w.includes("600")) return "600";
  if (w === "medium" || w.includes("500")) return "500";
  if (w === "regular" || w === "normal" || w.includes("400")) return "normal";
  if (w === "light" || w.includes("300")) return "300";
  if (w === "extralight" || w === "ultralight" || w.includes("200")) return "200";
  if (w === "thin" || w.includes("100")) return "100";
  if (w === "extrabold" || w === "ultrabold" || w.includes("800")) return "800";
  if (w === "black" || w === "heavy" || w.includes("900")) return "900";
  return "normal";
}

/**
 * Track which (family, weight) combos have already been registered.
 * @type {Map<string, string>} "family|weight" → registeredFamilyName
 */
const _REGISTERED_FONTS = new Map();

/**
 * Load a font into @napi-rs/canvas's GlobalFonts registry.
 *
 * Returns the family name to use in ctx.font strings. When a font FILE is
 * found on disk it is registered under a synthetic internal name (the file
 * IS the correct weight variant, so the cssWeight is always "normal" for
 * registered fonts). When no file is found but the name matches a system
 * font already known to the canvas backend, it passes the name through
 * directly.
 *
 * Resolution order mirrors Python `_load_font`:
 *   1. Configured face (by-name file match → fuzzy alphanumeric match)
 *   2. Size-respecting fallback sans (loud one-time warning)
 *   3. Hard abort with install guidance
 *
 * @param {string} family
 * @param {string} weight
 * @param {number} size
 * @returns {{ family: string; cssWeight: string; size: number }}
 */
function loadFont(family, weight, size) {
  const faceLabel = `${family} ${weight}`.trim();
  const cacheKey = `${family}|${weight}`;

  if (_REGISTERED_FONTS.has(cacheKey)) {
    return {
      family: _REGISTERED_FONTS.get(cacheKey),
      cssWeight: weightToCss(weight),
      size,
    };
  }

  // 1. Try configured font (exact file match ↔ fuzzy alphanumeric)
  const [hit, candidates] = findConfiguredFont(family, weight);
  if (hit) {
    const regName = `__hdr_${_REGISTERED_FONTS.size}`;
    try {
      GlobalFonts.register(readFileSync(hit), { family: regName });
      _REGISTERED_FONTS.set(cacheKey, regName);
      return { family: regName, cssWeight: "normal", size };
    } catch (err) {
      console.error(`  Failed to register font ${hit}: ${err.message}`);
    }
  }

  // 2. Try font family / candidate names directly (system fonts)
  const toTry = [family, ...candidates];
  for (const candidate of toTry) {
    const fbPath = findFontFile(candidate);
    if (fbPath) {
      const regName = `__hdr_fb_${_REGISTERED_FONTS.size}`;
      try {
        GlobalFonts.register(readFileSync(fbPath), { family: regName });
        _REGISTERED_FONTS.set(cacheKey, regName);
        return { family: regName, cssWeight: "normal", size };
      } catch {
        continue;
      }
    } else {
      // No file on disk — pass the candidate name through; the canvas
      // backend may recognise it as a system-installed font.
      _REGISTERED_FONTS.set(cacheKey, candidate);
      return { family: candidate, cssWeight: weightToCss(weight), size };
    }
  }

  // 3. Fallback fonts — readable, correctly-sized, but not the style-anchor typeface
  for (const fb of _FALLBACK_FONTS) {
    const fbPath = findFontFile(fb);
    if (fbPath) {
      const regName = `__hdr_fb_${_REGISTERED_FONTS.size}`;
      try {
        GlobalFonts.register(readFileSync(fbPath), { family: regName });
        _REGISTERED_FONTS.set(cacheKey, regName);
        warnFontFallback(faceLabel, fb);
        return { family: regName, cssWeight: "normal", size };
      } catch {
        continue;
      }
    } else {
      // Some fallbacks may be known to the OS canvas backend
      _REGISTERED_FONTS.set(cacheKey, fb);
      warnFontFallback(faceLabel, fb);
      return { family: fb, cssWeight: "normal", size };
    }
  }

  // 4. Nothing usable — abort loudly
  throw new SystemExitError(
    `✗ No usable font for header-lock. Wanted '${faceLabel}', and no fallback ` +
      `(${_FALLBACK_FONTS.join(", ")}) was found either.\n` +
      `  Fix: put a .otf/.ttf into ${_BUNDLED_FONTS_DIR}/ (create it), or set ` +
      `$PPT_FONT_DIR to a dir containing sans-serif fonts, then rerun Stage 3.`
  );
}

/**
 * Emit the one-time fallback warning.
 * @param {string} faceLabel
 * @param {string} fallbackName
 */
function warnFontFallback(faceLabel, fallbackName) {
  if (_FONT_WARNED.has(faceLabel)) return;
  _FONT_WARNED.add(faceLabel);
  console.log(
    `  ⚠  font '${faceLabel}' not found — falling back to '${fallbackName}' (readable & ` +
      `correctly sized, but NOT the style-anchor typeface). Drop the OTF into ` +
      `${_BUNDLED_FONTS_DIR}/ or set $PPT_FONT_DIR for an exact match.`
  );
}

// ---------------------------------------------------------------------------
// Error class for clean SystemExit-style abort
// ---------------------------------------------------------------------------

class SystemExitError extends Error {
  constructor(message) {
    super(message);
    this.name = "SystemExitError";
  }
}

// ---------------------------------------------------------------------------
// Text rendering helpers
// ---------------------------------------------------------------------------

/**
 * Word-wrap `text` to fit within `maxWidth` pixels when rendered with the
 * given font spec. Uses a small shared canvas for measurement.
 *
 * Mirrors Python `_word_wrap`.
 *
 * @param {string} text
 * @param {{ family: string; cssWeight: string; size: number }} fontSpec
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wordWrap(text, fontSpec, maxWidth) {
  const words = text.split(/\s+/);
  if (words.length === 0) return [];

  const measureCanvas = createCanvas(100, 100);
  const measCtx = measureCanvas.getContext("2d");
  measCtx.font = `${fontSpec.cssWeight} ${fontSpec.size}px "${fontSpec.family}"`;

  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (measCtx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Build an RGBA CSS string from [r, g, b, a].
 * @param {[number, number, number, number]} rgba
 * @returns {string}
 */
function rgbaString(rgba) {
  return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${(rgba[3] / 255).toFixed(2)})`;
}

/**
 * Draw text with a soft shadow (stroke outline) for readability on
 * varied backgrounds. Mirrors Python `_draw_text_with_shadow`.
 *
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {[number, number]} xy - [x, y] top-left position
 * @param {string} text
 * @param {{ family: string; cssWeight: string; size: number }} fontSpec
 * @param {[number, number, number, number]} fill - [r, g, b, a] text color
 * @param {[number, number, number, number]} shadow - [r, g, b, a] stroke/shadow color
 * @param {number} [strokeWidth=1]
 */
function drawTextWithShadow(ctx, xy, text, fontSpec, fill, shadow, strokeWidth = 1) {
  ctx.save();
  ctx.font = `${fontSpec.cssWeight} ${fontSpec.size}px "${fontSpec.family}"`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  ctx.strokeStyle = rgbaString(shadow);
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, xy[0], xy[1]);

  ctx.fillStyle = rgbaString(fill);
  ctx.fillText(text, xy[0], xy[1]);

  ctx.restore();
}

/**
 * Overlay kicker + title + subtitle onto a slide image.
 * Mirrors Python `_draw_header`.
 *
 * @param {import("@napi-rs/canvas").Canvas} imageCanvas - slide image as a canvas
 * @param {Record<string, any>} slide
 * @returns {import("@napi-rs/canvas").Canvas} new canvas with header overlaid
 */
function drawHeader(imageCanvas, slide) {
  const w = imageCanvas.width;
  const h = imageCanvas.height;

  const outCanvas = createCanvas(w, h);
  const ctx = outCanvas.getContext("2d");
  ctx.drawImage(imageCanvas, 0, 0);

  const kicker = (slide.kicker || "").toUpperCase().trim();
  const title = (slide.headline || "").trim();
  const subtitle = (slide.subtitle || "").trim();

  const kickerFont = loadFont(KICKER_FONT_FAMILY, KICKER_FONT_WEIGHT, KICKER_SIZE);
  const titleFont = loadFont(TITLE_FONT_FAMILY, TITLE_FONT_WEIGHT, TITLE_SIZE);
  const subtitleFont = loadFont(SUBTITLE_FONT_FAMILY, SUBTITLE_FONT_WEIGHT, SUBTITLE_SIZE);

  // Kicker
  if (kicker && kicker !== "(NONE)" && kicker !== "(无)") {
    drawTextWithShadow(ctx, KICKER_POS, kicker, kickerFont, KICKER_COLOR, TEXT_SHADOW, 1);
  }

  // Title (word-wrapped)
  const titleLines = wordWrap(title, titleFont, MAX_TITLE_WIDTH);
  for (let i = 0; i < titleLines.length; i++) {
    const y = TITLE_POS[1] + i * TITLE_LINE_HEIGHT;
    drawTextWithShadow(ctx, [TITLE_POS[0], y], titleLines[i], titleFont, TITLE_COLOR, TEXT_SHADOW, 2);
  }

  // Subtitle (optional)
  if (subtitle) {
    const subY = TITLE_POS[1] + titleLines.length * TITLE_LINE_HEIGHT + SUBTITLE_Y_OFFSET;
    const subLines = wordWrap(subtitle, subtitleFont, MAX_TITLE_WIDTH);
    for (let i = 0; i < subLines.length; i++) {
      drawTextWithShadow(
        ctx,
        [TITLE_POS[0], subY + i * SUBTITLE_LINE_HEIGHT],
        subLines[i],
        subtitleFont,
        SUBTITLE_COLOR,
        TEXT_SHADOW,
        1
      );
    }
  }

  return outCanvas;
}

// ---------------------------------------------------------------------------
// Image file resolution
// ---------------------------------------------------------------------------

const _IMG_EXTS = new Set([".png", ".jpg", ".jpeg"]);

/**
 * Escape string for use in a regex.
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * All images matching a slide id under the canonical NN_<id> (or bare <id>)
 * naming — ANCHORED and sorted. An unanchored substring match (the old
 * `*<id>*.png`) cross-hits ids like 's1' onto '10_s10.png'; this anchors the id
 * to the end of the stem. Returns [] (missing) or possibly >1 (ambiguous); the
 * caller turns either into a loud error instead of silently taking candidates[0].
 *
 * Mirrors Python `match_slide_image`.
 *
 * @param {string} imgDir
 * @param {string} slideId
 * @returns {Promise<string[]>}
 */
async function matchSlideImage(imgDir, slideId) {
  const pat = new RegExp(`^(\\d+_)?${escapeRegex(slideId)}$`);
  /** @type {string[]} */
  const result = [];
  let entries;
  try {
    entries = await readdir(imgDir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const ext = fileExt(ent.name).toLowerCase();
    if (!_IMG_EXTS.has(ext)) continue;
    const stem = ent.name.replace(/\.[^.]+$/, "");
    if (pat.test(stem)) {
      result.push(join(imgDir, ent.name));
    }
  }
  return result.sort();
}

/**
 * Map every slide id → its one image, or ABORT listing all problems.
 *
 * Fail-loud replaces the old "warn and skip": a skipped slide used to silently
 * shrink the deck and shift every downstream speaker note by one. If Stage 2
 * only produced some images, this stops here and tells you to finish Stage 2 —
 * the deck is never built half-complete.
 *
 * Mirrors Python `resolve_images`.
 *
 * @param {string} imgDir
 * @param {Array<Record<string, any>>} slides
 * @returns {Promise<Record<string, string>>}
 */
async function resolveImages(imgDir, slides) {
  /** @type {Record<string, string>} */
  const resolved = {};
  /** @type {string[]} */
  const problems = [];
  const dirName = basename(imgDir);

  for (const slide of slides) {
    const sid = slide.id;
    const hits = await matchSlideImage(imgDir, sid);
    if (hits.length === 0) {
      problems.push(
        `no image for slide ${JSON.stringify(sid)} (expected NN_${sid}.png in ${dirName}/)`
      );
    } else if (hits.length > 1) {
      problems.push(
        `ambiguous images for slide ${JSON.stringify(sid)}: [${hits.map((h) => basename(h)).join(", ")}]`
      );
    } else {
      resolved[sid] = hits[0];
    }
  }

  if (problems.length > 0) {
    throw new SystemExitError(
      `✗ Stage 3 cannot start — ${problems.length} image problem(s):\n` +
        problems.map((p) => `  - ${p}`).join("\n") +
        `\n  Stage 2 likely didn't finish. Re-run Stage 2 (e.g. --stage 2) to ` +
        `generate the missing images, then Stage 3. (Building a partial deck would ` +
        `misalign every downstream speaker note.)`
    );
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Visual config loading from palette
// ---------------------------------------------------------------------------

/**
 * Load the same full layout/font configuration consumed by Stage 1.
 * Mirrors Python `_load_colors_from_palette`.
 * @param {string} palettePath
 */
function loadColorsFromPalette(palettePath) {
  let config;
  try {
    config = loadVisualConfig(palettePath);
  } catch (exc) {
    if (exc instanceof VisualConfigError) {
      throw new SystemExitError(`Invalid visual config ${palettePath}: ${exc.message}`);
    }
    throw exc;
  }
  applyVisualConfig(config);
  if (existsSync(palettePath)) {
    console.log(`  Loaded canvas, header geometry, colors, and fonts from ${palettePath}`);
  }
}

// ---------------------------------------------------------------------------
// Image loading helper
// ---------------------------------------------------------------------------

/**
 * Load an image from a file path into a canvas, resized to target dimensions.
 * @param {string} imgPath
 * @param {[number, number]} targetSize - [width, height]
 * @returns {import("@napi-rs/canvas").Canvas}
 */
function loadImageToCanvas(imgPath, targetSize) {
  const img = new Image();
  img.src = readFileSync(imgPath);
  const canvas = createCanvas(targetSize[0], targetSize[1]);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetSize[0], targetSize[1]);
  return canvas;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      images: { type: "string" },
      "slide-plan": { type: "string" },
      out: { type: "string" },
      "style-dir": { type: "string" },
      "color-palette": { type: "string" },
    },
    allowPositionals: false,
  });

  const _images = values.images;
  const _slidePlan = values["slide-plan"];
  const _out = values.out;
  const _styleDir = values["style-dir"];
  const _colorPalette = values["color-palette"];

  if (!_images || !_slidePlan || !_out) {
    throw new SystemExitError("Missing required arguments: --images, --slide-plan, --out");
  }

  // Resolve palette path
  let palettePath;
  if (_colorPalette) {
    palettePath = _colorPalette;
  } else if (_styleDir) {
    palettePath = join(_styleDir, COLOR_PALETTE_FILE);
  } else {
    const planParent = resolve(dirname(_slidePlan));
    const candidates = [
      join(planParent, "visual-style"),
      join(resolve(planParent, ".."), "visual-style"),
      join(planParent, "style"),
      join(resolve(planParent, ".."), "style"),
    ];
    const styleDirFallback = candidates.find((c) => isDir(c)) || candidates[0];
    palettePath = join(styleDirFallback, COLOR_PALETTE_FILE);
  }
  loadColorsFromPalette(palettePath);

  // Load slide plan
  let planData;
  try {
    planData = JSON.parse(readFileSync(_slidePlan, "utf-8"));
  } catch (exc) {
    throw new SystemExitError(`Could not read slide plan ${_slidePlan}: ${exc.message}`);
  }
  const slides = planData.slides || [];

  const imgDir = resolve(_images);
  const outDir = resolve(_out);
  mkdirSync(outDir, { recursive: true });

  // Fail loud on a partial/ambiguous image set BEFORE writing anything.
  const images = await resolveImages(imgDir, slides);

  let bodyLockCount = 0;
  let fullPageCount = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideId = slide.id;
    const imgPath = images[slideId];

    const layout = slide.layout_contract || {};
    const mode = contractRenderMode(layout);
    const imageCanvas = loadImageToCanvas(imgPath, CANVAS_SIZE);

    /** @type {import("@napi-rs/canvas").Canvas} */
    let finalCanvas;
    if (mode === RENDER_MODE_FULL_PAGE) {
      // Pass-through: AI rendered the complete slide
      finalCanvas = imageCanvas;
      fullPageCount++;
    } else {
      finalCanvas = drawHeader(imageCanvas, slide);
      bodyLockCount++;
    }

    const seq = String(i + 1).padStart(2, "0");
    const outName = `${seq}_${slideId}.png`;
    writeFileSync(join(outDir, outName), finalCanvas.toBuffer("image/png"));
    console.log(`  ${outName}  (${mode})`);
  }

  console.log(`\n--- Stage 3 complete ---`);
  console.log(`body+header-lock (text overlay): ${bodyLockCount}`);
  console.log(`full-page (passthrough):         ${fullPageCount}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1] &&
  (process.argv[1] === __filename ||
    process.argv[1] === resolve(__filename) ||
    basename(process.argv[1]) === basename(__filename));

if (isMain) {
  main().catch((err) => {
    if (err instanceof SystemExitError) {
      console.error(err.message);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });
}
