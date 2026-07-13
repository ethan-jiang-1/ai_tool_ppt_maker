#!/usr/bin/env node
/**
 * Stage 3: Lock headers — overlay kicker/title/subtitle text onto AI-generated images.
 *
 * Uses @napi-rs/canvas for image/text compositing.
 *
 * Reads raw images from Stage 2 and slide_plan.json from Stage 1.
 * - body+header-lock slides: render kicker + title + subtitle at fixed pixel
 *   positions configured via color_palette.json
 * - full-page slides: pass through unchanged (AI already rendered the full page
 *   including text)
 *
 * This is the Header-Lock mechanism: AI handles creative body visuals, the
 * pipeline handles deterministic text placement.
 *
 * Usage:
 *     node stage3_lock_headers.mjs \
 *         --images 3_versions/v1/_generated/page_images_full/ \
 *         --slide-plan 3_versions/v1/_generated/slide_plan.json \
 *         --out 3_versions/v1/_generated/header_locked/ \
 *         --style-dir 2_backbone/visual-style/
 *
 * Customization:
 *     Canvas, header positions, line heights, colors, font family/weight, and
 *     sizes all come from color_palette.json through visual_config.mjs. Fonts
 *     resolve cross-platform automatically (see _loadFont): a bundled fonts/
 *     dir next to this script wins, then $PPT_FONT_DIR, then the common OS
 *     font dirs.  If absent, rendering degrades to a readable, correctly-sized
 *     fallback sans (loud warning) and only hard-aborts if no usable font
 *     exists at all — it never silently emits mis-sized headers. For CJK text,
 *     add Noto Sans CJK and point FONT_BOLD/SEMIBOLD/REGULAR at it.
 */

import "./lib/cli_bootstrap.mjs?entry=stage3_lock_headers.mjs";
import { CLI_ERROR_CODES, attachCliDiagnostic, createCliNext, diagnosticFromError, emitCliError } from "./lib/cli_error.mjs";

import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { join, resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Imports from sibling ESM modules
// ---------------------------------------------------------------------------

import {
  loadVisualConfig,
  DEFAULT_CONFIG,
  hexToRgba,
  VisualConfigError,
} from "./visual_config.mjs";

import { COLOR_PALETTE_FILE } from "./bundle_layout.mjs";

// ---------------------------------------------------------------------------
// Canonical render-mode vocabulary (shared with stage1)
//
// No ESM port of stage1 exists yet, so constant definitions and the
// _contract_render_mode helper are defined here (ported helper
// ---------------------------------------------------------------------------

const RENDER_MODE_FULL_PAGE = "full-page";
const RENDER_MODE_BODY_HEADER_LOCK = "body+header-lock";
const CANONICAL_RENDER_MODES = new Set([
  RENDER_MODE_FULL_PAGE,
  RENDER_MODE_BODY_HEADER_LOCK,
]);

/**
 * Read canonical render_mode from a layout_contract.
 *
 * Prefers `render_mode` (v1.3+). Falls back to legacy `header_variant`
 * (image_direct → full-page, normal* → body+header-lock) so Stage 3 can
 * still consume older slide_plan.json files without a Stage-1 rerun.
 *
 * ported helper
 *
 * @param {Record<string, any>} layout
 * @returns {string}
 */
export function contractRenderMode(layout) {
  const mode = layout.render_mode;
  if (CANONICAL_RENDER_MODES.has(mode)) {
    return mode;
  }
  const legacy = layout.header_variant || "";
  if (legacy === "image_direct") {
    return RENDER_MODE_FULL_PAGE;
  }
  if (legacy === "normal" || legacy === "normal_extra_safe" || legacy === "") {
    return RENDER_MODE_BODY_HEADER_LOCK;
  }
  // Unknown legacy value — treat as body+header-lock (safe default: overlay)
  return RENDER_MODE_BODY_HEADER_LOCK;
}

// ---------------------------------------------------------------------------
// Shared executable visual configuration
// ---------------------------------------------------------------------------

/**
 * Expose the shared config through module globals used by rendering helpers.
 * ported helper
 *
 * @param {ReturnType<typeof DEFAULT_CONFIG>} config
 */
function _applyVisualConfig(config) {
  const header = config.header_lock;
  const position = header.position;

  _CANVAS_SIZE = [config.canvas.width_px, config.canvas.height_px];
  _KICKER_SIZE = header.kicker.size_px;
  _TITLE_SIZE = header.title.size_px;
  _SUBTITLE_SIZE = header.subtitle.size_px;
  _KICKER_POS = [position.left_px, position.kicker_y_px];
  _TITLE_POS = [position.left_px, position.title_y_px];
  _SUBTITLE_Y_OFFSET = position.subtitle_gap_px;
  _TITLE_LINE_HEIGHT = position.title_line_height_px;
  _SUBTITLE_LINE_HEIGHT = position.subtitle_line_height_px;
  _MAX_TITLE_WIDTH =
    config.canvas.width_px - position.left_px - position.right_margin_px;
  _KICKER_COLOR = hexToRgba(header.kicker.color);
  _TITLE_COLOR = hexToRgba(header.title.color);
  _SUBTITLE_COLOR = hexToRgba(header.subtitle.color);

  const backgroundRed = parseInt(config.background.substring(1, 3), 16);
  _TEXT_SHADOW =
    backgroundRed > 128
      ? [180, 180, 180, 80]
      : [0, 6, 16, 180];

  _KICKER_FONT_FAMILY = header.kicker.family;
  _KICKER_FONT_WEIGHT = header.kicker.weight;
  _TITLE_FONT_FAMILY = header.title.family;
  _TITLE_FONT_WEIGHT = header.title.weight;
  _SUBTITLE_FONT_FAMILY = header.subtitle.family;
  _SUBTITLE_FONT_WEIGHT = header.subtitle.weight;

  // Backward-compatible names for callers that used _loadFont(FONT_REGULAR, size)
  FONT_BOLD = _TITLE_FONT_FAMILY;
  FONT_SEMIBOLD = _KICKER_FONT_FAMILY;
  FONT_REGULAR = _SUBTITLE_FONT_FAMILY;
}

// -- Module-scoped globals (populated by _applyVisualConfig, read by rendering) --

let _CANVAS_SIZE, _KICKER_SIZE, _TITLE_SIZE, _SUBTITLE_SIZE;
let _KICKER_POS, _TITLE_POS, _SUBTITLE_Y_OFFSET;
let _TITLE_LINE_HEIGHT, _SUBTITLE_LINE_HEIGHT, _MAX_TITLE_WIDTH;
let _KICKER_COLOR, _TITLE_COLOR, _SUBTITLE_COLOR, _TEXT_SHADOW;
let _KICKER_FONT_FAMILY, _KICKER_FONT_WEIGHT;
let _TITLE_FONT_FAMILY, _TITLE_FONT_WEIGHT;
let _SUBTITLE_FONT_FAMILY, _SUBTITLE_FONT_WEIGHT;
let FONT_BOLD, FONT_SEMIBOLD, FONT_REGULAR;

// Apply defaults from the built-in DEFAULT_CONFIG on module load.
_applyVisualConfig(DEFAULT_CONFIG);

// ---------------------------------------------------------------------------
// ADVANCED: Opener variant (larger title for session openers)
// ---------------------------------------------------------------------------
// Session opener slides often want larger fonts and a deeper header safe zone
// (e.g. 390px vs 260px) for visual impact. Uncomment and customize if your
// deck has distinct opener slides:
//
// const OPENER_LEFT = 58;
// const OPENER_KICKER_Y = 40;
// const OPENER_TITLE_Y = 92;
// const OPENER_TITLE_SIZE = 82;
// const OPENER_SUBTITLE_SIZE = 34;
// const OPENER_SAFE_ZONE = 390;
// const OPENER_MAX_TITLE_WIDTH = _CANVAS_SIZE[0] - OPENER_LEFT - 300;
//
// const OPENER_IDS = new Set(["slide_01_title", "slide_07_bridge"]);
//
// To activate: in _drawHeader(), check if slide['id'] in OPENER_IDS and
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
// Font resolution (cross-platform)
//
// A framework-bundled fonts/ dir wins (drop OTFs here for a reproducible deck
// that doesn't depend on OS-installed fonts); then $PPT_FONT_DIR; then common
// OS dirs.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const _BUNDLED_FONTS_DIR = join(__dirname, "fonts");

/**
 * Size-respecting fallbacks tried (in order) when the configured face is
 * absent — a different typeface, but readable and correctly sized. NEVER use a
 * bitmap default that would ignore the palette's size_px.
 */
const _FALLBACK_FONTS = [
  "DejaVuSans-Bold.ttf",
  "DejaVuSans.ttf",               // Linux common
  "Arial Bold.ttf",
  "Arial.ttf",
  "ArialBd.ttf",                  // Windows / macOS supplemental
  "LiberationSans-Bold.ttf",
  "LiberationSans-Regular.ttf",
  "Helvetica.ttc",
];

/** Warn once per missing intended face, not per slide. */
/** @type {Set<string>} */
const _FONT_WARNED = new Set();

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/**
 * Check whether `p` is an existing directory (errors swallowed).
 * @param {string} p
 * @returns {boolean}
 */
function _isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively collect every file path under `root`. Errors for individual
 * directories are silently skipped (permission-denied, etc.).
 * @param {string} root
 * @returns {string[]}
 */
function _walkFiles(root) {
  const results = [];
  const stack = [root];
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
        results.push(full);
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// _os_font_dirs  (ported helper
// ---------------------------------------------------------------------------

/**
 * Search-ordered font directories: bundled > $PPT_FONT_DIR > common OS dirs.
 * @returns {string[]}
 */
function _osFontDirs() {
  const dirs = [_BUNDLED_FONTS_DIR];
  const env = process.env.PPT_FONT_DIR;
  if (env) {
    dirs.push(env);
  }
  dirs.push(
    "/Library/Fonts",
    join(homedir(), "Library", "Fonts"),                      // macOS
    "/System/Library/Fonts",
    "/System/Library/Fonts/Supplemental",
    "/usr/share/fonts",                                        // Linux
    "/usr/local/share/fonts",
    join(homedir(), ".fonts"),
    join(homedir(), ".local", "share", "fonts"),
    "C:/Windows/Fonts",                                        // Windows
  );
  return dirs.filter((d) => _isDir(d));
}

// ---------------------------------------------------------------------------
// _find_font_file  (ported helper
// ---------------------------------------------------------------------------

/**
 * Locate a font FILE by name across the search dirs (recursive — Linux nests
 * fonts deeply). Returns the first match or null.
 *
 * @param {string} name
 * @returns {string|null}
 */
function _findFontFile(name) {
  for (const d of _osFontDirs()) {
    const exact = join(d, name);
    try {
      if (statSync(exact).isFile()) {
        return exact;
      }
    } catch {
      // not found — continue
    }
    // Recursive walk — find files whose basename matches `name`.
    const hits = _walkFiles(d)
      .filter((f) => basename(f) === name)
      .sort();
    if (hits.length > 0) {
      return hits[0];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// _font_name_candidates  (ported helper
// ---------------------------------------------------------------------------

/**
 * Generate common font filenames from configured family + weight.
 *
 * @param {string} family
 * @param {string} weight
 * @returns {string[]}
 */
function _fontNameCandidates(family, weight) {
  const ext = extname(family).toLowerCase();
  if (ext === ".otf" || ext === ".ttf" || ext === ".ttc") {
    return [family];
  }
  const familyForms = [
    family,
    family.replace(/ /g, ""),
    family.replace(/ /g, "-"),
  ];
  const weightForms = [
    weight,
    weight.replace(/ /g, ""),
    weight.replace(/ /g, "-"),
  ];
  /** @type {string[]} */
  const names = [];
  for (const familyForm of familyForms) {
    for (const weightForm of weightForms) {
      for (const separator of ["-", "", " "]) {
        const stem = weightForm
          ? `${familyForm}${separator}${weightForm}`
          : familyForm;
        for (const extension of [".otf", ".ttf", ".ttc"]) {
          const candidate = stem + extension;
          if (!names.includes(candidate)) {
            names.push(candidate);
          }
        }
      }
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// _find_configured_font  (ported helper
// ---------------------------------------------------------------------------

/**
 * Find the configured font file for (family, weight).
 *
 * @param {string} family
 * @param {string} weight
 * @returns {{ hit: string|null, candidates: string[] }}
 */
function _findConfiguredFont(family, weight) {
  const candidates = _fontNameCandidates(family, weight);

  // 1. Exact filename match
  for (const candidate of candidates) {
    const hit = _findFontFile(candidate);
    if (hit) {
      return { hit, candidates };
    }
  }

  // 2. Last resort for installed files whose vendor naming differs slightly:
  //    compare alphanumeric tokens in the stem instead of requiring one filename.
  const familyKey = family.toLowerCase().replace(/[^a-z0-9]/g, "");
  const weightKey = weight.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fontExts = new Set([".otf", ".ttf", ".ttc"]);
  for (const directory of _osFontDirs()) {
    const files = _walkFiles(directory).sort();
    for (const path of files) {
      if (!fontExts.has(extname(path).toLowerCase())) {
        continue;
      }
      const stemKey = basename(path, extname(path))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (
        stemKey.includes(familyKey) &&
        (!weightKey || stemKey.includes(weightKey))
      ) {
        return { hit: path, candidates };
      }
    }
  }
  return { hit: null, candidates };
}

// ---------------------------------------------------------------------------
// Font registration for @napi-rs/canvas
// ---------------------------------------------------------------------------

/**
 * Track font cache: "family|weight" → registered canvas family name.
 * @type {Map<string, string>}
 */
const _REGISTERED_FONTS = new Map();

/**
 * Map a weight string to a numeric CSS weight value suitable for ctx.font.
 * @param {string} weight
 * @returns {string}
 */
function _weightToCss(weight) {
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
 * Register a font file buffer with @napi-rs/canvas's GlobalFonts registry under
 * a unique synthetic family name.  Idempotent for the same (family, weight) pair.
 *
 * @param {Buffer} buffer - font file contents
 * @param {string} family
 * @param {string} weight
 * @returns {string} - the family name to use in ctx.font strings
 */
function _registerFontBuffer(buffer, family, weight) {
  const key = `${family}|${weight}`;
  const existing = _REGISTERED_FONTS.get(key);
  if (existing) {
    return existing;
  }
  const synthName = `__hdr_${_REGISTERED_FONTS.size}`;
  GlobalFonts.register(buffer, { family: synthName });
  _REGISTERED_FONTS.set(key, synthName);
  return synthName;
}

/**
 * Emit the one-time fallback warning.
 * @param {string} faceLabel
 * @param {string} fallbackName
 */
function _warnFontFallback(faceLabel, fallbackName) {
  if (_FONT_WARNED.has(faceLabel)) {
    return;
  }
  _FONT_WARNED.add(faceLabel);
  console.warn(
    `  ⚠  font '${faceLabel}' not found — falling back to '${fallbackName}' (readable & ` +
      `correctly sized, but NOT the style-anchor typeface). Drop the OTF into ` +
      `${_BUNDLED_FONTS_DIR}/ or set $PPT_FONT_DIR for an exact match.`,
  );
}

// ---------------------------------------------------------------------------
// _load_font  (ported helper
//
// Resolve a size-respecting TrueType/OpenType font for use with
// @napi-rs/canvas.  Returns an object with `family` (registered canvas family
// name), `cssWeight`, and `size` (pixel size).  Never returns a fixed-size
// bitmap default.
//
// The preferred form is _loadFont(family, weight, size). The historical
// _loadFont(filenameOrFamily, size) form remains supported for callers/tests.
//
// Order: configured face (bundled/env/OS dirs, then by-name) → size-respecting
// fallback sans (loud one-time warning) → hard abort with install guidance.
// ---------------------------------------------------------------------------

/**
 * @typedef {{ family: string, cssWeight: string, size: number }} FontSpec
 */

/**
 * Load a font for use with @napi-rs/canvas.  Two calling conventions:
 *
 *   _loadFont(family, size)          — legacy, weight defaults to ""
 *   _loadFont(family, weight, size)  — preferred
 *
 * @param {string} family
 * @param {string|number} weightOrSize
 * @param {number} [size]
 * @returns {FontSpec}
 */
function _loadFont(family, weightOrSize, size) {
  /** @type {string} */
  let weight;
  let actualSize;

  if (size === undefined || size === null) {
    // Legacy form: _loadFont(family, size)
    if (typeof weightOrSize !== "number") {
      throw new TypeError("_loadFont(family, size) requires an integer size");
    }
    weight = "";
    actualSize = weightOrSize;
  } else {
    // Preferred form: _loadFont(family, weight, size)
    weight = String(weightOrSize);
    actualSize = size;
  }

  const faceLabel = `${family} ${weight}`.trim();
  const cacheKey = `${family}|${weight}`;

  // Return cached font spec if we have already registered this face.
  const cached = _REGISTERED_FONTS.get(cacheKey);
  if (cached) {
    return { family: cached, cssWeight: _weightToCss(weight), size: actualSize };
  }

  // ---- 1. Try the configured face -----------------------------------------

  const { hit, candidates } = _findConfiguredFont(family, weight);
  if (hit) {
    const synthName = _registerFontBuffer(readFileSync(hit), family, weight);
    return { family: synthName, cssWeight: "normal", size: actualSize };
  }

  // Try bare family and each candidate filename as a system font lookup.
  // Font loading
  // approximate this by searching for a file on disk, and if none is found we
  // pass the candidate through so the canvas backend may recognise it.
  const toTry = [family, ...candidates];
  for (const candidate of toTry) {
    const fbPath = _findFontFile(candidate);
    if (fbPath) {
      const synthName = _registerFontBuffer(readFileSync(fbPath), family, weight);
      return { family: synthName, cssWeight: "normal", size: actualSize };
    } else {
      // No file on disk — pass the candidate string through; the canvas
      // backend may resolve it as a system-installed font.
      _REGISTERED_FONTS.set(cacheKey, candidate);
      return {
        family: candidate,
        cssWeight: _weightToCss(weight),
        size: actualSize,
      };
    }
  }

  // ---- 2. A readable, correctly-sized fallback — different typeface, loud
  //        warning ------------------------------------------------------------

  for (const fb of _FALLBACK_FONTS) {
    const fbPath = _findFontFile(fb);
    if (fbPath) {
      const synthName = _registerFontBuffer(readFileSync(fbPath), family, weight);
      _warnFontFallback(faceLabel, fb);
      return { family: synthName, cssWeight: "normal", size: actualSize };
    } else {
      // Some fallbacks may be known to the OS canvas backend.
      _REGISTERED_FONTS.set(cacheKey, fb);
      _warnFontFallback(faceLabel, fb);
      return { family: fb, cssWeight: "normal", size: actualSize };
    }
  }

  // ---- 3. Nothing usable — abort loudly rather than emit garbage headers ---

  throw attachCliDiagnostic(new Error(
    `✗ No usable font for header-lock. Wanted '${faceLabel}', and no fallback ` +
      `(${_FALLBACK_FONTS.join(", ")}) was found either.\n` +
      `  Fix: put a .otf/.ttf into ${_BUNDLED_FONTS_DIR}/ (create it), or set ` +
      `$PPT_FONT_DIR to a dir containing sans-serif fonts, then rerun Stage 3.`,
  ), {
    version: 1,
    category: "environment",
    stage: "stage3",
    operation: "load-fonts",
    source: { path: _BUNDLED_FONTS_DIR },
    reason: { kind: "font_unavailable" },
    next: createCliNext("repair_environment", { inspect: [{ path: _BUNDLED_FONTS_DIR }], default: "Install a usable configured font or set PPT_FONT_DIR, then rerun Stage 3." }),
  });
}

// ---------------------------------------------------------------------------
// Palette loading  (ported helper
// ---------------------------------------------------------------------------

/**
 * Load the same full layout/font configuration consumed by Stage 1.
 *
 * @param {string} palettePath
 */
function _loadColorsFromPalette(palettePath) {
  let config;
  try {
    config = loadVisualConfig(palettePath);
  } catch (exc) {
    if (exc instanceof VisualConfigError) {
      throw new Error(
        `Invalid visual config ${palettePath}: ${exc.message}`,
      );
    }
    throw exc;
  }
  _applyVisualConfig(config);
  if (existsSync(palettePath)) {
    console.log(
      `  Loaded canvas, header geometry, colors, and fonts from ${palettePath}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Text rendering helpers
// ---------------------------------------------------------------------------

/**
 * Convert [r, g, b, a] (a = 0–255) to an rgba() CSS string.
 * @param {[number, number, number, number]} rgba
 * @returns {string}
 */
function _rgbaString(rgba) {
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${(rgba[3] / 255).toFixed(3)})`;
}

/**
 * Word-wrap `text` to fit within `maxWidth` pixels when rendered with the
 * given font spec. Uses a small scratch canvas solely for measurement.
 *
 * ported helper
 *
 * @param {string} text
 * @param {FontSpec} fontSpec
 * @param {number} maxWidth
 * @returns {string[]}
 */
function _wordWrap(text, fontSpec, maxWidth) {
  const words = text.split(/\s+/);
  if (words.length === 0) {
    return [];
  }

  // Scratch canvas for measurement only — its size does not matter.
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
 * Draw text with a soft shadow for readability on varied backgrounds.
 * Uses CSS stroke (rendered behind fill) to simulate stroke behind fill.
 *
 * ported helper
 *
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {[number, number]} xy
 * @param {string} text
 * @param {FontSpec} fontSpec
 * @param {[number, number, number, number]} fill - [r, g, b, a] with a = 0–255
 * @param {[number, number, number, number]} shadow - [r, g, b, a] with a = 0–255
 * @param {number} [strokeWidth=1]
 */
function _drawTextWithShadow(ctx, xy, text, fontSpec, fill, shadow, strokeWidth) {
  const sw = strokeWidth !== undefined ? strokeWidth : 1;

  ctx.save();
  ctx.font = `${fontSpec.cssWeight} ${fontSpec.size}px "${fontSpec.family}"`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // Shadow: rendered as a stroke behind the fill.
  ctx.strokeStyle = _rgbaString(shadow);
  ctx.lineWidth = sw;
  ctx.lineJoin = "round";
  ctx.strokeText(text, xy[0], xy[1]);

  // Main fill.
  ctx.fillStyle = _rgbaString(fill);
  ctx.fillText(text, xy[0], xy[1]);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// _draw_header  (ported helper
// ---------------------------------------------------------------------------

/**
 * Overlay kicker + title + subtitle onto a slide image.
 *
 * Header draw: an RGBA-style overlay is
 * composited onto the image (Image.alpha_composite).  The @napi-rs/canvas
 * model draws directly onto the canvas context: everything goes onto one
 * layer, which is equivalent for a non-overlapping placement.
 *
 * @param {import("@napi-rs/canvas").Canvas} imageCanvas - already-loaded & resized
 * @param {Record<string, any>} slide - slide data from slide_plan.json
 * @returns {import("@napi-rs/canvas").Canvas}
 */
function _drawHeader(imageCanvas, slide) {
  const canvas = createCanvas(_CANVAS_SIZE[0], _CANVAS_SIZE[1]);
  const ctx = canvas.getContext("2d");

  // Draw the base (AI-generated) image onto the canvas.
  ctx.drawImage(imageCanvas, 0, 0, _CANVAS_SIZE[0], _CANVAS_SIZE[1]);

  const kickerRaw = slide.kicker || "";
  const kicker = kickerRaw.toUpperCase().trim();
  const title = (slide.headline || "").trim();
  const subtitle = (slide.subtitle || "").trim();

  const labelFont = _loadFont(
    _KICKER_FONT_FAMILY,
    _KICKER_FONT_WEIGHT,
    _KICKER_SIZE,
  );
  const titleFont = _loadFont(
    _TITLE_FONT_FAMILY,
    _TITLE_FONT_WEIGHT,
    _TITLE_SIZE,
  );
  const subtitleFont = _loadFont(
    _SUBTITLE_FONT_FAMILY,
    _SUBTITLE_FONT_WEIGHT,
    _SUBTITLE_SIZE,
  );

  // Kicker
  if (kicker && kicker !== "(NONE)" && kicker !== "(无)") {
    _drawTextWithShadow(
      ctx,
      _KICKER_POS,
      kicker,
      labelFont,
      _KICKER_COLOR,
      _TEXT_SHADOW,
      1,
    );
  }

  // Title (word-wrapped)
  const titleLines = _wordWrap(title, titleFont, _MAX_TITLE_WIDTH);
  for (let i = 0; i < titleLines.length; i++) {
    const y = _TITLE_POS[1] + i * _TITLE_LINE_HEIGHT;
    _drawTextWithShadow(
      ctx,
      [_TITLE_POS[0], y],
      titleLines[i],
      titleFont,
      _TITLE_COLOR,
      _TEXT_SHADOW,
      2,
    );
  }

  // Subtitle (optional)
  if (subtitle) {
    const subY =
      _TITLE_POS[1] +
      titleLines.length * _TITLE_LINE_HEIGHT +
      _SUBTITLE_Y_OFFSET;
    const subLines = _wordWrap(subtitle, subtitleFont, _MAX_TITLE_WIDTH);
    for (let i = 0; i < subLines.length; i++) {
      _drawTextWithShadow(
        ctx,
        [_TITLE_POS[0], subY + i * _SUBTITLE_LINE_HEIGHT],
        subLines[i],
        subtitleFont,
        _SUBTITLE_COLOR,
        _TEXT_SHADOW,
        1,
      );
    }
  }

  return canvas;
}

// ---------------------------------------------------------------------------
// Image file resolution
// ---------------------------------------------------------------------------

const _IMG_EXTS = new Set([".png", ".jpg", ".jpeg"]);

/**
 * Escape a string for use as a literal in a RegExp.
 * @param {string} s
 * @returns {string}
 */
function _escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * All images matching a slide id under the canonical NN_<id> (or bare <id>)
 * naming — ANCHORED and sorted. An unanchored substring match (the old
 * `*<id>*.png`) cross-hits ids like 's1' onto '10_s10.png'; this anchors the
 * id to the end of the stem. Returns [] (missing) or possibly >1 (ambiguous);
 * the caller turns either into a loud error instead of silently taking
 * candidates[0].
 *
 * ported helper
 *
 * @param {string} imgDir
 * @param {string} slideId
 * @returns {string[]}
 */
function _matchSlideImage(imgDir, slideId) {
  const pat = new RegExp(`^(\\d+_)?${_escapeRegex(slideId)}$`);
  /** @type {string[]} */
  const result = [];
  let entries;
  try {
    entries = readdirSync(imgDir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const ent of entries) {
    if (!ent.isFile()) {
      continue;
    }
    const ext = extname(ent.name).toLowerCase();
    if (!_IMG_EXTS.has(ext)) {
      continue;
    }
    const stem = basename(ent.name, extname(ent.name));
    if (pat.test(stem)) {
      result.push(join(imgDir, ent.name));
    }
  }
  return result.sort();
}

/**
 * Map every slide id to its one image, or ABORT listing all problems.
 *
 * Fail-loud replaces the old "warn and skip": a skipped slide used to silently
 * shrink the deck and shift every downstream speaker note by one. If Stage 2
 * only produced some images, this stops here and tells you to finish Stage 2 —
 * the deck is never built half-complete.
 *
 * ported helper
 *
 * @param {string} imgDir
 * @param {Array<{ id: string }>} slides
 * @returns {Record<string, string>}
 */
function _resolveImages(imgDir, slides) {
  /** @type {Record<string, string>} */
  const resolved = {};
  /** @type {Array<{slideId:string,reason:string,hits:string[]}>} */
  const problems = [];
  const dirName = basename(imgDir);

  for (const slide of slides) {
    const sid = slide.id;
    const hits = _matchSlideImage(imgDir, sid);
    if (hits.length === 0) {
      problems.push({ slideId: sid, reason: "missing_image", hits: [] });
    } else if (hits.length > 1) {
      problems.push({ slideId: sid, reason: "ambiguous_images", hits });
    } else {
      resolved[sid] = hits[0];
    }
  }

  if (problems.length > 0) {
    throw attachCliDiagnostic(new Error(
      `✗ Stage 3 cannot start — ${problems.length} image problem(s):\n` +
        problems.map((problem) => problem.reason === "missing_image"
          ? `  - no image for slide ${JSON.stringify(problem.slideId)} (expected NN_${problem.slideId}.png in ${dirName}/)`
          : `  - ambiguous images for slide ${JSON.stringify(problem.slideId)}: [${problem.hits.map((hit) => basename(hit)).join(", ")}]`).join("\n") +
        `\n  Stage 2 likely didn't finish. Re-run Stage 2 (e.g. --stage 2) to ` +
        `generate the missing images, then Stage 3. (Building a partial deck would ` +
        `misalign every downstream speaker note.)`,
    ), {
      version: 1,
      category: "artifact",
      stage: "stage3",
      operation: "resolve-images",
      source: { path: imgDir },
      issues: problems.map((problem) => ({
        message: problem.reason === "missing_image" ? "slide image is missing" : "multiple slide images are ambiguous",
        subject: { kind: "slide", id: problem.slideId },
        source: { path: problem.hits[0] || imgDir },
        reason: { kind: problem.reason, ...(problem.hits.length ? { actual: problem.hits.length, expected: 1 } : { expected: 1 }) },
        lineage: [{ kind: "derived", path: problem.hits[0] || imgDir, stage: "stage2" }],
      })),
      next: createCliNext("repair_prerequisite", { inspect: [{ path: imgDir }], default: "Rerun Stage 2 for the retained slide ids, then rerun Stage 3." }),
    });
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Image loading helper
// ---------------------------------------------------------------------------

/**
 * Read PNG dimensions from the IHDR chunk (first 24 bytes of file).
 * Pure Node.js Buffer — does NOT invoke @napi-rs/canvas, so it cannot
 * trigger "Invalid SVG" or similar decode errors on unusual PNG encodings
 * from certain image vendors (BUG-004).
 *
 * @param {string} imgPath
 * @returns {{width: number, height: number} | null}
 */
function _readPngDimensions(imgPath) {
  try {
    const buf = readFileSync(imgPath);
    if (buf.length < 24) return null;
    // PNG signature check
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
    // IHDR starts at byte 16: width (4 bytes, big-endian), height (4 bytes)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

/**
 * Load an image from a file path into an @napi-rs/canvas Canvas, resized to
 * the target dimensions.  Uses async loadImage() to guarantee the image is
 * fully decoded before drawImage — the sync new Image() + .src pattern can
 * race and produce blank canvases (BUG-009).
 *
 * @param {string} imgPath
 * @param {[number, number]} targetSize - [width, height]
 * @returns {Promise<import("@napi-rs/canvas").Canvas>}
 */
async function _loadImageToCanvas(imgPath, targetSize) {
  const img = await loadImage(readFileSync(imgPath));
  const canvas = createCanvas(targetSize[0], targetSize[1]);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetSize[0], targetSize[1]);
  return canvas;
}

// ---------------------------------------------------------------------------
// Argument parsing  (ported helper
// ---------------------------------------------------------------------------

/**
 * Parse command-line arguments into an options object.
 *
 * @param {string[]} argv
 * @returns {{ images: string, slidePlan: string, out: string, styleDir: string|null, colorPalette: string|null }}
 */
function _parseArgs(argv) {
  const opts = {
    images: null,
    slidePlan: null,
    out: null,
    styleDir: null,
    colorPalette: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--images":
        opts.images = argv[++i];
        break;
      case "--slide-plan":
        opts.slidePlan = argv[++i];
        break;
      case "--out":
        opts.out = argv[++i];
        break;
      case "--style-dir":
        opts.styleDir = argv[++i];
        break;
      case "--color-palette":
        opts.colorPalette = argv[++i];
        break;
      default:
        // ignore unknown flags
        break;
    }
  }

  const missing = [];
  if (!opts.images) missing.push("--images");
  if (!opts.slidePlan) missing.push("--slide-plan");
  if (!opts.out) missing.push("--out");
  if (missing.length > 0) {
    throw new Error(
      `Missing required argument(s): ${missing.join(", ")}\n` +
        `Usage: node stage3_lock_headers.mjs --images <dir> --slide-plan <file> --out <dir> [--style-dir <dir>] [--color-palette <file>]`,
    );
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Programmatic entry used by unified_pipeline / ppt_flow.
 * @param {{ images: string, slidePlan: string, out: string, styleDir?: string|null, colorPalette?: string|null }} opts
 */
export async function lockHeaders(opts) {
  return runLockHeaders(opts);
}

/**
 * @param {{ images: string, slidePlan: string, out: string, styleDir?: string|null, colorPalette?: string|null }} opts
 */
async function runLockHeaders(opts) {
  if (!opts?.images || !opts?.slidePlan || !opts?.out) {
    throw new Error(
      "stage3_lock_headers requires --images, --slide-plan, and --out",
    );
  }

  // -----------------------------------------------------------------------
  // Resolve color_palette.json path.
  //
  // The orchestrator passes --color-palette explicitly after file-level
  // override resolution.  Standalone callers may still pass --style-dir or
  // rely on probing near --slide-plan for backward compat.
  // -----------------------------------------------------------------------
  let palettePath;
  if (opts.colorPalette) {
    palettePath = opts.colorPalette;
  } else if (opts.styleDir) {
    palettePath = join(opts.styleDir, COLOR_PALETTE_FILE);
  } else {
    const planParent = dirname(resolve(opts.slidePlan));
    const candidates = [
      join(planParent, "visual-style"),
      join(dirname(planParent), "visual-style"),
      join(planParent, "style"),
      join(dirname(planParent), "style"),
    ];
    const styleDir =
      candidates.find((c) => _isDir(c)) || candidates[0];
    palettePath = join(styleDir, COLOR_PALETTE_FILE);
  }
  _loadColorsFromPalette(palettePath);

  // Load slide plan.
  let planData;
  try {
    planData = JSON.parse(readFileSync(opts.slidePlan, "utf-8"));
  } catch (exc) {
    throw attachCliDiagnostic(new Error(
      `Failed to read slide plan ${opts.slidePlan}: ${exc.message}`,
    ), {
      version: 1,
      category: "artifact",
      stage: "stage3",
      operation: "load-slide-plan",
      source: { path: opts.slidePlan },
      reason: { kind: "invalid_slide_plan" },
      next: createCliNext("repair_prerequisite", { inspect: [{ path: opts.slidePlan }], default: "Rerun Stage 1 to recreate the slide plan, then rerun Stage 3." }),
    });
  }
  const slides = planData.slides || [];

  const imgDir = resolve(opts.images);
  const outDir = resolve(opts.out);
  mkdirSync(outDir, { recursive: true });

  // Fail loud on a partial/ambiguous image set BEFORE writing anything.
  const images = _resolveImages(imgDir, slides);

  let bodyLockCount = 0;
  let fullPageCount = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideId = slide.id;
    const imgPath = images[slideId];

    const layout = slide.layout_contract || {};
    const mode = contractRenderMode(layout);
    const seq = String(i + 1).padStart(2, "0");
    const outName = `${seq}_${slideId}.png`;
    const outPath = join(outDir, outName);

    if (mode === RENDER_MODE_FULL_PAGE) {
      // Full-page passthrough: check PNG dimensions without decoding.
      // If the source image already matches the canonical canvas size,
      // copy it directly — avoids @napi-rs/canvas decode errors on
      // unusual PNG encodings from certain vendors (BUG-004).
      const dims = _readPngDimensions(imgPath);
      if (dims && dims.width === _CANVAS_SIZE[0] && dims.height === _CANVAS_SIZE[1]) {
        copyFileSync(imgPath, outPath);
        fullPageCount++;
        console.log(`  ${outName}  (${mode}, direct copy)`);
        continue;
      }
      // Dimensions mismatch — fall through to canvas resize below.
    }

    // Load and resize the raw image into a Canvas.
    const imageCanvas = await _loadImageToCanvas(imgPath, _CANVAS_SIZE);

    /** @type {import("@napi-rs/canvas").Canvas} */
    let finalCanvas;
    if (mode === RENDER_MODE_FULL_PAGE) {
      finalCanvas = imageCanvas;
      fullPageCount++;
    } else {
      finalCanvas = _drawHeader(imageCanvas, slide);
      bodyLockCount++;
    }

    const buffer = finalCanvas.toBuffer("image/png");
    writeFileSync(outPath, buffer);
    console.log(`  ${outName}  (${mode})`);
  }

  console.log(`\n--- Stage 3 complete ---`);
  console.log(`body+header-lock (text overlay): ${bodyLockCount}`);
  console.log(`full-page (passthrough):         ${fullPageCount}`);
}

async function main(argv = process.argv) {
  let opts;
  try {
    opts = _parseArgs(argv.slice(2));
  } catch (err) {
    emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Stage 3 requires images, slide plan, and output paths.", hint: "Pass --images, --slide-plan, and --out.", where: "stage3_lock_headers.arguments", diagnostic: { version: 1, category: "usage", stage: "stage3", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Pass every required Stage 3 path, then rerun." }) } });
    throw err;
  }
  try {
    return await runLockHeaders(opts);
  } catch (err) {
    const structured = diagnosticFromError(err);
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Stage 3 could not produce the complete header-locked image set.",
      hint: "Inspect the slide plan, Stage 2 images, and visual configuration, then rerun the prerequisite stage.",
      where: "stage3_lock_headers.main",
      diagnostic: structured || {
        version: 1,
        category: "artifact",
        stage: "stage3",
        operation: "lock-headers",
        source: { path: opts.slidePlan || opts.images || "stage3-input" },
        reason: { kind: "missing_ambiguous_or_invalid_stage_input" },
        lineage: [
          ...(opts.slidePlan ? [{ kind: "derived", path: opts.slidePlan, stage: "stage1" }] : []),
          ...(opts.images ? [{ kind: "derived", path: opts.images, stage: "stage2" }] : []),
          ...(opts.out ? [{ kind: "derived", path: opts.out, stage: "stage3" }] : []),
        ],
        next: createCliNext("repair_prerequisite", {
          inspect: [opts.slidePlan, opts.images, opts.colorPalette].filter(Boolean).map((path) => ({ path })),
          invocation: opts.images && opts.slidePlan && opts.out ? { program: "node", args: [__filename, "--images", opts.images, "--slide-plan", opts.slidePlan, "--out", opts.out] } : undefined,
          default: "Repair or rerun Stage 1/2 inputs; do not edit Stage 3 generated images directly.",
        }),
      },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const _isMain =
  process.argv[1] &&
  (process.argv[1] === __filename ||
    process.argv[1] === resolve(__filename) ||
    basename(process.argv[1]) === basename(__filename));

if (_isMain) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage3_lock_headers" });
  if (process.argv.includes("--help")) {
    console.log("Usage: node stage3_lock_headers.mjs --images <dir> --slide-plan <file> --out <dir> [--style-dir <dir>] [--color-palette <file>]");
    process.exit(0);
  }
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
