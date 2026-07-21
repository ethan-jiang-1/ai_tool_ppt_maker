/**
 * Shared executable visual configuration for Stage 1 and Stage 3.
 *
 * `color_palette.json` is the human-editable source. This module is the only place
 * that defines fallback canvas, body-layout, header geometry, and header-font
 * defaults, so prompt layout and deterministic header rendering cannot drift.
 */

import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";
import { STYLE_PRESETS, STYLE_PRESETS_DIR } from "../../shared/run-bundle/bundle_layout.mjs";
import { HTML_FAMILY_GEOMETRY_ID } from "./html_family_geometry.mjs";
import {
    HTML_COMPONENTS_SPEC,
    HTML_SPACING_SPEC,
    HTML_TYPOGRAPHY_SPEC,
} from "../../contracts/html_visual_tokens.mjs";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class VisualConfigError extends Error {
    constructor(message, { differences = null } = {}) {
        super(message);
        this.name = "VisualConfigError";
        if (differences != null) this.differences = Object.freeze([...differences]);
    }
}

const FRAMEWORK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const HTML_EXACT_KEYS = Object.freeze([
    "schema_version", "canvas", "palette", "typography", "spacing",
    "components", "image_language", "geometry",
]);

const HTML_PALETTE_KEYS = Object.freeze([
    "background", "surface", "text", "muted_text", "accent",
    "accent_secondary", "accent_tertiary", "divider",
]);
const MIGRATION_PALETTE_DIAGNOSTIC_LIMIT = 24;

export const HTML_VISUAL_PROJECTION_V1_PATHS = Object.freeze([
    "canvas",
    "geometry.registry",
    "geometry.registry_sha256",
    "geometry.record",
]);

export const HTML_STYLE_REFERENCE_PROJECTION_V1_PATHS = Object.freeze([
    ...HTML_PALETTE_KEYS.map((key) => `palette.${key}`),
    "image_language.medium",
    "image_language.material",
    "image_language.lighting",
    "image_language.texture",
    "image_language.composition",
    "image_language.avoid",
]);

export function buildHtmlVisualProjectionV1(config, { registrySha256, record }) {
    return {
        canvas: config.canvas,
        registry: config.geometry.registry,
        registry_sha256: registrySha256,
        record,
    };
}

export function buildHtmlStyleReferenceProjectionV1(config) {
    return {
        palette: config.palette,
        image_language: config.image_language,
    };
}

function htmlGraphemes(value) {
    return [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(String(value))].length;
}

function exactKeys(value, expected, context) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new VisualConfigError(`${context} must be an object`);
    }
    const actual = Object.keys(value);
    const unknown = actual.filter((key) => !expected.includes(key));
    const missing = expected.filter((key) => !actual.includes(key));
    if (unknown.length || missing.length) {
        throw new VisualConfigError(`${context} keys mismatch; missing=${missing.join(",") || "none"}; unknown=${unknown.join(",") || "none"}`);
    }
    return value;
}

function resolvePaletteReference(data, reference, context) {
    if (typeof reference !== "string") throw new VisualConfigError(`${context} must be a palette path string`);
    let value;
    if (reference === "background") value = data.background;
    else {
        const match = /^colors\.([a-z0-9_]+)\.hex$/.exec(reference);
        if (!match) throw new VisualConfigError(`${context} has unsupported palette path ${JSON.stringify(reference)}`);
        value = data.colors?.[match[1]]?.hex;
    }
    if (typeof value !== "string" || !HEX_COLOR_RE.test(value)) {
        throw new VisualConfigError(`${context} does not resolve to #RRGGBB`);
    }
    return value.toLowerCase();
}

function resolveHtmlColor(value, palette, context) {
    if (typeof value !== "string") throw new VisualConfigError(`${context} must be a palette reference`);
    const match = /^palette\.([a-z_]+)$/.exec(value);
    if (!match || !Object.hasOwn(palette, match[1])) throw new VisualConfigError(`${context} references an unknown palette token`);
    return palette[match[1]];
}

function deepResolveComponentColors(value, palette, context = "html_first.components") {
    if (Array.isArray(value)) return value.map((item, index) => deepResolveComponentColors(item, palette, `${context}[${index}]`));
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepResolveComponentColors(item, palette, `${context}.${key}`)]));
    }
    if (typeof value === "string" && value.startsWith("palette.")) return resolveHtmlColor(value, palette, context);
    return value;
}

export function parseHtmlVisualConfig(data) {
    const html = exactKeys(data?.html_first, HTML_EXACT_KEYS, "html_first");
    if (html.schema_version !== 1) throw new VisualConfigError("html_first.schema_version must equal 1");
    if (JSON.stringify(html.canvas) !== JSON.stringify({ width: 1000, height: 562.5 })) {
        throw new VisualConfigError("html_first.canvas must equal {width:1000,height:562.5}");
    }
    const paletteSource = exactKeys(html.palette, HTML_PALETTE_KEYS, "html_first.palette");
    const palette = Object.fromEntries(HTML_PALETTE_KEYS.map((key) => [
        key,
        resolvePaletteReference(data, paletteSource[key], `html_first.palette.${key}`),
    ]));

    const typographySource = exactKeys(html.typography, Object.keys(HTML_TYPOGRAPHY_SPEC), "html_first.typography");
    const typography = {};
    for (const [role, [weight, size, lineHeight, color]] of Object.entries(HTML_TYPOGRAPHY_SPEC)) {
        const record = exactKeys(typographySource[role], ["families", "weight", "size", "line_height", "color"], `html_first.typography.${role}`);
        if (JSON.stringify(record.families) !== JSON.stringify(["Source Sans 3", "Noto Sans SC"])) throw new VisualConfigError(`html_first.typography.${role}.families is invalid`);
        if (record.weight !== weight || record.size !== size || record.line_height !== lineHeight || record.color !== `palette.${color}`) throw new VisualConfigError(`html_first.typography.${role} differs from schema v1`);
        typography[role] = { ...record, color: palette[color] };
    }

    if (JSON.stringify(html.spacing) !== JSON.stringify(HTML_SPACING_SPEC)) throw new VisualConfigError("html_first.spacing differs from schema v1");
    const componentKeys = ["text_block", "card", "metric", "step", "quote", "chart", "icon", "icon_composition", "callout", "abstract_pattern"];
    exactKeys(html.components, componentKeys, "html_first.components");
    if (JSON.stringify(html.components) !== JSON.stringify(HTML_COMPONENTS_SPEC)) throw new VisualConfigError("html_first.components differs from schema v1");
    const components = deepResolveComponentColors(html.components, palette);

    const language = exactKeys(html.image_language, ["medium", "material", "lighting", "texture", "composition", "avoid"], "html_first.image_language");
    const resolvedLanguage = {};
    for (const key of ["medium", "material", "lighting", "texture", "composition"]) {
        if (typeof language[key] !== "string" || !language[key].trim() || /[\r\n]/.test(language[key]) || htmlGraphemes(language[key]) > 200) throw new VisualConfigError(`html_first.image_language.${key} must be non-empty single-line text of at most 200 graphemes`);
        resolvedLanguage[key] = language[key];
    }
    if (language.avoid !== "forbidden") throw new VisualConfigError("html_first.image_language.avoid must equal forbidden");
    if (!Array.isArray(data.forbidden) || data.forbidden.length > 16 || data.forbidden.some((item) => typeof item !== "string" || !item.trim() || /[\r\n]/.test(item) || htmlGraphemes(item) > 100)) {
        throw new VisualConfigError("forbidden must be an array of at most 16 non-empty single-line strings of at most 100 graphemes");
    }
    resolvedLanguage.avoid = [...data.forbidden];
    if (JSON.stringify(html.geometry) !== JSON.stringify({ registry: HTML_FAMILY_GEOMETRY_ID })) throw new VisualConfigError("html_first.geometry.registry is unsupported");

    return Object.freeze({
        schema_version: 1,
        canvas: { width: 1000, height: 562.5 },
        palette,
        typography,
        spacing: { ...HTML_SPACING_SPEC },
        components,
        image_language: resolvedLanguage,
        geometry: { registry: HTML_FAMILY_GEOMETRY_ID },
    });
}

function parseStrictJsonWithDuplicateAudit(raw, path) {
    let data;
    try { data = JSON.parse(raw); } catch (error) {
        throw new VisualConfigError(`could not read ${path}: ${error.message}`);
    }
    const document = parseDocument(raw, { version: "1.2", schema: "json", uniqueKeys: true });
    if (document.errors.length || document.warnings.length) {
        const problem = [...document.errors, ...document.warnings][0];
        throw new VisualConfigError(`could not read ${path}: ${problem.message.split("\n")[0]}`);
    }
    return data;
}

function safeActualSummary(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return `array(length=${value.length})`;
    if (typeof value === "string") return `string(length=${[...value].length})`;
    if (typeof value === "number" || typeof value === "boolean") return typeof value;
    if (value && typeof value === "object") return `object(keys=${Object.keys(value).sort().slice(0, 8).join(",") || "none"})`;
    return typeof value;
}

function diagnosticDifference(differences, path, expected, actual) {
    if (differences.length >= MIGRATION_PALETTE_DIAGNOSTIC_LIMIT) return;
    differences.push(Object.freeze({ path, expected, actual: safeActualSummary(actual) }));
}

function exactDiagnosticKeys(value, expected, path, differences) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        diagnosticDifference(differences, path, `object with keys: ${expected.join(",")}`, value);
        return false;
    }
    const actual = Object.keys(value);
    const unknown = actual.filter((key) => !expected.includes(key));
    const missing = expected.filter((key) => !actual.includes(key));
    if (unknown.length || missing.length) {
        diagnosticDifference(differences, path, `exact keys: ${expected.join(",")}`, { missing, unknown });
    }
    return true;
}

function sameJson(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function collectHtmlMigrationPaletteDifferences(data) {
    const differences = [];
    const html = data?.html_first;
    if (!exactDiagnosticKeys(html, HTML_EXACT_KEYS, "html_first", differences)) return differences;
    if (html.schema_version !== 1) diagnosticDifference(differences, "html_first.schema_version", "number(1)", html.schema_version);
    if (!sameJson(html.canvas, { width: 1000, height: 562.5 })) {
        diagnosticDifference(differences, "html_first.canvas", "{width:1000,height:562.5}", html.canvas);
    }

    if (exactDiagnosticKeys(html.palette, HTML_PALETTE_KEYS, "html_first.palette", differences)) {
        for (const token of HTML_PALETTE_KEYS) {
            const reference = html.palette[token];
            if (readPaletteToken(data, reference) == null) {
                diagnosticDifference(differences, `html_first.palette.${token}`, "reference to an existing #RRGGBB root token", reference);
            }
        }
    }

    if (exactDiagnosticKeys(html.typography, Object.keys(HTML_TYPOGRAPHY_SPEC), "html_first.typography", differences)) {
        for (const [role, [weight, size, lineHeight, color]] of Object.entries(HTML_TYPOGRAPHY_SPEC)) {
            const record = html.typography[role];
            if (!exactDiagnosticKeys(record, ["families", "weight", "size", "line_height", "color"], `html_first.typography.${role}`, differences)) continue;
            if (!sameJson(record.families, ["Source Sans 3", "Noto Sans SC"])) diagnosticDifference(differences, `html_first.typography.${role}.families`, "[Source Sans 3,Noto Sans SC]", record.families);
            if (record.weight !== weight) diagnosticDifference(differences, `html_first.typography.${role}.weight`, `number(${weight})`, record.weight);
            if (record.size !== size) diagnosticDifference(differences, `html_first.typography.${role}.size`, `number(${size})`, record.size);
            if (record.line_height !== lineHeight) diagnosticDifference(differences, `html_first.typography.${role}.line_height`, `number(${lineHeight})`, record.line_height);
            if (record.color !== `palette.${color}`) diagnosticDifference(differences, `html_first.typography.${role}.color`, `palette.${color}`, record.color);
        }
    }

    if (!sameJson(html.spacing, HTML_SPACING_SPEC)) diagnosticDifference(differences, "html_first.spacing", "HTML spacing schema v1", html.spacing);
    if (exactDiagnosticKeys(html.components, Object.keys(HTML_COMPONENTS_SPEC), "html_first.components", differences)) {
        for (const [name, expected] of Object.entries(HTML_COMPONENTS_SPEC)) {
            if (!sameJson(html.components[name], expected)) diagnosticDifference(differences, `html_first.components.${name}`, "HTML component schema v1", html.components[name]);
        }
    }

    if (exactDiagnosticKeys(html.image_language, ["medium", "material", "lighting", "texture", "composition", "avoid"], "html_first.image_language", differences)) {
        for (const key of ["medium", "material", "lighting", "texture", "composition"]) {
            const value = html.image_language[key];
            if (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value) || htmlGraphemes(value) > 200) {
                diagnosticDifference(differences, `html_first.image_language.${key}`, "non-empty single-line string up to 200 graphemes", value);
            }
        }
        if (html.image_language.avoid !== "forbidden") diagnosticDifference(differences, "html_first.image_language.avoid", "string(forbidden)", html.image_language.avoid);
    }
    const forbidden = data?.forbidden;
    if (!Array.isArray(forbidden) || forbidden.length > 16 || forbidden.some((item) => typeof item !== "string" || !item.trim() || /[\r\n]/.test(item) || htmlGraphemes(item) > 100)) {
        diagnosticDifference(differences, "forbidden", "array of up to 16 non-empty single-line strings up to 100 graphemes", forbidden);
    }
    if (!sameJson(html.geometry, { registry: HTML_FAMILY_GEOMETRY_ID })) {
        diagnosticDifference(differences, "html_first.geometry", `registry ${HTML_FAMILY_GEOMETRY_ID}`, html.geometry);
    }
    return differences;
}

/**
 * Closed migration-only palette validation with safe, bounded field diagnostics.
 */
export function validateHtmlMigrationPalette(path) {
    let raw;
    try {
        raw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
    } catch (error) {
        throw new VisualConfigError(`migration palette validation failed: ${path}`, {
            differences: [Object.freeze({ path: "$", expected: "valid UTF-8 strict JSON", actual: "unreadable bytes" })],
        });
    }
    let data;
    try {
        data = parseStrictJsonWithDuplicateAudit(raw, path);
    } catch {
        throw new VisualConfigError(`migration palette validation failed: ${path}`, {
            differences: [Object.freeze({ path: "$", expected: "strict JSON with unique keys", actual: "invalid JSON" })],
        });
    }
    const differences = collectHtmlMigrationPaletteDifferences(data);
    if (differences.length > 0) {
        const fields = differences.map((entry) => entry.path).join(",");
        const error = new VisualConfigError(`migration palette validation failed at ${fields}`);
        error.differences = Object.freeze(differences);
        throw error;
    }
    try {
        return loadVisualConfigViews(path);
    } catch (error) {
        const diagnostic = new VisualConfigError(`migration palette validation failed: ${error.message}`);
        diagnostic.differences = Object.freeze([Object.freeze({ path: "$", expected: "valid complete visual palette", actual: "legacy root validation failed" })]);
        throw diagnostic;
    }
}

function shippedPresetPalettePath(preset) {
    if (!STYLE_PRESETS.includes(preset)) {
        throw new VisualConfigError(`unknown HTML migration preset ${JSON.stringify(preset)}; allowed=${[...STYLE_PRESETS].sort().join(",")}`);
    }
    return join(FRAMEWORK_DIR, STYLE_PRESETS_DIR, preset, "color_palette.json");
}

function paletteReferenceLocation(reference) {
    if (reference === "background") return ["background"];
    const match = /^colors\.([a-z0-9_]+)\.hex$/.exec(reference);
    return match ? ["colors", match[1], "hex"] : null;
}

function readPaletteToken(data, reference) {
    const location = paletteReferenceLocation(reference);
    if (!location) return null;
    let value = data;
    for (const key of location) {
        if (!value || typeof value !== "object" || !Object.hasOwn(value, key)) return null;
        value = value[key];
    }
    return typeof value === "string" && HEX_COLOR_RE.test(value) ? value.toLowerCase() : null;
}

function writePaletteToken(data, reference, value) {
    const location = paletteReferenceLocation(reference);
    if (!location) throw new VisualConfigError(`migration preset has unsupported palette reference ${JSON.stringify(reference)}`);
    let target = data;
    for (const key of location.slice(0, -1)) target = target[key];
    target[location.at(-1)] = value;
}

export function listHtmlMigrationPresets() {
    return Object.freeze([...STYLE_PRESETS].sort());
}

/**
 * Seed a complete HTML-first palette from one shipped preset. Only palette
 * tokens explicitly referenced by that preset may inherit a legacy value.
 */
export function buildHtmlMigrationPaletteProjection({ preset, legacyPalettePath = null } = {}) {
    const presetPath = shippedPresetPalettePath(preset);
    let presetRaw;
    try {
        presetRaw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(presetPath));
    } catch (error) {
        throw new VisualConfigError(`could not read migration preset ${JSON.stringify(preset)}: ${error.message}`);
    }
    const presetData = parseStrictJsonWithDuplicateAudit(presetRaw, presetPath);
    parseVisualConfig(presetData);
    const presetHtml = parseHtmlVisualConfig(presetData);
    const palette = JSON.parse(JSON.stringify(presetData));
    const legacyData = legacyPalettePath == null ? null : loadVisualConfigViews(legacyPalettePath).data;
    const provenance = {};

    for (const [token, reference] of Object.entries(presetData.html_first.palette)) {
        const legacyValue = legacyData == null ? null : readPaletteToken(legacyData, reference);
        if (legacyValue != null) {
            writePaletteToken(palette, reference, legacyValue);
            provenance[token] = "legacy";
        } else {
            provenance[token] = "preset";
        }
    }

    // Validate the final complete artifact before a migration writer can stage it.
    parseVisualConfig(palette);
    const htmlFirst = parseHtmlVisualConfig(palette);
    return Object.freeze({
        preset,
        preset_path: presetPath,
        palette,
        provenance: Object.freeze(provenance),
        html_first: htmlFirst,
        preset_html_first: presetHtml,
    });
}

export function loadVisualConfigViews(path) {
    let raw;
    try { raw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path)); } catch (error) {
        throw new VisualConfigError(`could not read ${path}: ${error.message}`);
    }
    const data = parseStrictJsonWithDuplicateAudit(raw, path);
    return { raw, data, legacy: parseVisualConfig(data), html_first: parseHtmlVisualConfig(data) };
}

export function loadHtmlVisualConfig(path) {
    return loadVisualConfigViews(path).html_first;
}

// ---------------------------------------------------------------------------
// Default values (ported
// ---------------------------------------------------------------------------

const DEFAULT_CANVAS = Object.freeze({
    width_px: 1672,
    height_px: 941,
});

const DEFAULT_BODY_LAYOUT = Object.freeze({
    content_top_gap_px: 30,
    content_bottom_px: 780,
    callout_top_px: 805,
    callout_bottom_px: 900,
    no_callout_bottom_px: 890,
});

const DEFAULT_HEADER_POSITION = Object.freeze({
    left_px: 46,
    right_margin_px: 58,
    kicker_y_px: 24,
    title_y_px: 58,
    subtitle_gap_px: 8,
    title_line_height_px: 52,
    subtitle_line_height_px: 31,
});

const DEFAULT_KICKER_FONT = Object.freeze({
    family: "Source Sans Pro",
    weight: "Semibold",
    size_px: 22,
    color: "#becbda",
});

const DEFAULT_TITLE_FONT = Object.freeze({
    family: "Source Sans Pro",
    weight: "Bold",
    size_px: 46,
    color: "#f4f8fc",
});

const DEFAULT_SUBTITLE_FONT = Object.freeze({
    family: "Source Sans Pro",
    weight: "Regular",
    size_px: 27,
    color: "#a4b8cc",
});

const DEFAULT_HEADER_LOCK = Object.freeze({
    body_header_safe_zone: 260,
    opener_safe_zone: 390,
    position: DEFAULT_HEADER_POSITION,
    kicker: DEFAULT_KICKER_FONT,
    title: DEFAULT_TITLE_FONT,
    subtitle: DEFAULT_SUBTITLE_FONT,
});

export const DEFAULT_CONFIG = Object.freeze({
    background: "#0a1628",
    canvas: DEFAULT_CANVAS,
    body_layout: DEFAULT_BODY_LAYOUT,
    header_lock: DEFAULT_HEADER_LOCK,
});

// ---------------------------------------------------------------------------
// Internal validators (ported
// ---------------------------------------------------------------------------

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Normalise a value to a plain object, raising on non-objects.
 * ported helper
 */
function _mapping(value, context) {
    if (value == null) {
        return {};
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        throw new VisualConfigError(`${context} must be an object`);
    }
    return value;
}

/**
 * Extract and validate a positive (or non-negative) integer from a mapping.
 * ported helper
 */
function _positiveInt(mapping, key, defaultValue, context, { allowZero = false } = {}) {
    const value = key in mapping ? mapping[key] : defaultValue;
    const minimum = allowZero ? 0 : 1;
    if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
        const rule = allowZero ? "a non-negative integer" : "a positive integer";
        throw new VisualConfigError(`${context}.${key} must be ${rule}`);
    }
    return value;
}

/**
 * Extract and validate a non-empty string from a mapping.
 * ported helper
 */
function _text(mapping, key, defaultValue, context) {
    const value = key in mapping ? mapping[key] : defaultValue;
    if (typeof value !== "string" || !value.trim()) {
        throw new VisualConfigError(`${context}.${key} must be a non-empty string`);
    }
    return value.trim();
}

/**
 * Extract and validate a #RRGGBB color string from a mapping.
 * ported helper
 */
function _color(mapping, key, defaultValue, context) {
    const value = _text(mapping, key, defaultValue, context);
    if (!HEX_COLOR_RE.test(value)) {
        throw new VisualConfigError(`${context}.${key} must be a #RRGGBB color`);
    }
    return value.toLowerCase();
}

/**
 * Build a font config object from a mapping and defaults.
 * ported helper
 */
function _font(mapping, defaultFont, context) {
    return Object.freeze({
        family: _text(mapping, "family", defaultFont.family, context),
        weight: _text(mapping, "weight", defaultFont.weight, context),
        size_px: _positiveInt(mapping, "size_px", defaultFont.size_px, context),
        color: _color(mapping, "color", defaultFont.color, context),
    });
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a palette mapping, applying shared defaults for omitted fields.
 * ported helper
 *
 * @param {Record<string, any>} data - Parsed JSON object from color_palette.json.
 * @returns {ReturnType<typeof DEFAULT_CONFIG>} Frozen visual config object.
 */
export function parseVisualConfig(data) {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        throw new VisualConfigError("color_palette.json root must be an object");
    }

    const canvasData = _mapping(data.canvas, "canvas");
    const bodyData = _mapping(data.body_layout, "body_layout");
    const headerData = _mapping(data.header_lock, "header_lock");
    const positionData = _mapping(headerData.position, "header_lock.position");
    const fontsData = _mapping(headerData.fonts, "header_lock.fonts");

    // ---- canvas ---------------------------------------------------------
    const canvas = Object.freeze({
        width_px: _positiveInt(
            canvasData, "width_px", DEFAULT_CONFIG.canvas.width_px, "canvas"
        ),
        height_px: _positiveInt(
            canvasData, "height_px", DEFAULT_CONFIG.canvas.height_px, "canvas"
        ),
    });

    // ---- body_layout ----------------------------------------------------
    const body = Object.freeze({
        content_top_gap_px: _positiveInt(
            bodyData, "content_top_gap_px",
            DEFAULT_CONFIG.body_layout.content_top_gap_px, "body_layout",
            { allowZero: true }
        ),
        content_bottom_px: _positiveInt(
            bodyData, "content_bottom_px",
            DEFAULT_CONFIG.body_layout.content_bottom_px, "body_layout"
        ),
        callout_top_px: _positiveInt(
            bodyData, "callout_top_px",
            DEFAULT_CONFIG.body_layout.callout_top_px, "body_layout"
        ),
        callout_bottom_px: _positiveInt(
            bodyData, "callout_bottom_px",
            DEFAULT_CONFIG.body_layout.callout_bottom_px, "body_layout"
        ),
        no_callout_bottom_px: _positiveInt(
            bodyData, "no_callout_bottom_px",
            DEFAULT_CONFIG.body_layout.no_callout_bottom_px, "body_layout"
        ),
    });

    // ---- position -------------------------------------------------------
    const position = Object.freeze({
        left_px: _positiveInt(
            positionData, "left_px",
            DEFAULT_CONFIG.header_lock.position.left_px,
            "header_lock.position", { allowZero: true }
        ),
        right_margin_px: _positiveInt(
            positionData, "right_margin_px",
            DEFAULT_CONFIG.header_lock.position.right_margin_px,
            "header_lock.position", { allowZero: true }
        ),
        kicker_y_px: _positiveInt(
            positionData, "kicker_y_px",
            DEFAULT_CONFIG.header_lock.position.kicker_y_px,
            "header_lock.position", { allowZero: true }
        ),
        title_y_px: _positiveInt(
            positionData, "title_y_px",
            DEFAULT_CONFIG.header_lock.position.title_y_px,
            "header_lock.position", { allowZero: true }
        ),
        subtitle_gap_px: _positiveInt(
            positionData, "subtitle_gap_px",
            DEFAULT_CONFIG.header_lock.position.subtitle_gap_px,
            "header_lock.position", { allowZero: true }
        ),
        title_line_height_px: _positiveInt(
            positionData, "title_line_height_px",
            DEFAULT_CONFIG.header_lock.position.title_line_height_px,
            "header_lock.position"
        ),
        subtitle_line_height_px: _positiveInt(
            positionData, "subtitle_line_height_px",
            DEFAULT_CONFIG.header_lock.position.subtitle_line_height_px,
            "header_lock.position"
        ),
    });

    // ---- header_lock ----------------------------------------------------
    const fontsDefault = DEFAULT_CONFIG.header_lock;
    const header = Object.freeze({
        body_header_safe_zone: _positiveInt(
            headerData, "body_header_safe_zone",
            fontsDefault.body_header_safe_zone, "header_lock"
        ),
        opener_safe_zone: _positiveInt(
            headerData, "opener_safe_zone",
            fontsDefault.opener_safe_zone, "header_lock"
        ),
        position,
        kicker: _font(
            _mapping(fontsData.kicker, "header_lock.fonts.kicker"),
            fontsDefault.kicker, "header_lock.fonts.kicker"
        ),
        title: _font(
            _mapping(fontsData.title, "header_lock.fonts.title"),
            fontsDefault.title, "header_lock.fonts.title"
        ),
        subtitle: _font(
            _mapping(fontsData.subtitle, "header_lock.fonts.subtitle"),
            fontsDefault.subtitle, "header_lock.fonts.subtitle"
        ),
    });

    // ---- cross-field constraints ----------------------------------------
    if (body.content_bottom_px >= canvas.height_px) {
        throw new VisualConfigError(
            "body_layout.content_bottom_px must be inside the canvas"
        );
    }
    if (body.no_callout_bottom_px >= canvas.height_px) {
        throw new VisualConfigError(
            "body_layout.no_callout_bottom_px must be inside the canvas"
        );
    }
    if (
        !(body.content_bottom_px < body.callout_top_px) ||
        !(body.callout_top_px < body.callout_bottom_px) ||
        !(body.callout_bottom_px < canvas.height_px)
    ) {
        throw new VisualConfigError(
            "body_layout must satisfy content_bottom_px < callout_top_px < " +
            "callout_bottom_px < canvas.height_px"
        );
    }
    if (header.body_header_safe_zone >= body.no_callout_bottom_px) {
        throw new VisualConfigError(
            "header_lock.body_header_safe_zone must leave room for body content"
        );
    }
    if (position.left_px + position.right_margin_px >= canvas.width_px) {
        throw new VisualConfigError(
            "header_lock.position margins consume the canvas width"
        );
    }

    // ---- background color -----------------------------------------------
    const background = _color(
        data, "background", DEFAULT_CONFIG.background, "color_palette"
    );

    return Object.freeze({
        background,
        canvas,
        body_layout: body,
        header_lock: header,
    });
}

// ---------------------------------------------------------------------------
// File loader
// ---------------------------------------------------------------------------

/**
 * Load an existing palette, or return shared defaults when it is absent.
 * ported helper
 *
 * @param {string} path - Filesystem path to color_palette.json.
 * @returns {ReturnType<typeof DEFAULT_CONFIG>} Frozen visual config object.
 */
export function loadVisualConfig(path) {
    let isFile;
    try {
        isFile = statSync(path).isFile();
    } catch {
        isFile = false;
    }
    if (!isFile) {
        return DEFAULT_CONFIG;
    }

    let raw;
    try {
        raw = readFileSync(path, "utf-8");
    } catch (exc) {
        throw new VisualConfigError(`could not read ${path}: ${exc.message}`);
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch (exc) {
        throw new VisualConfigError(`could not read ${path}: ${exc.message}`);
    }

    return parseVisualConfig(data);
}

// ---------------------------------------------------------------------------
// Color utility
// ---------------------------------------------------------------------------

/**
 * Convert a validated #RRGGBB color to an opaque RGBA array.
 * ported helper
 *
 * @param {string} value - A hex color string like "#ff8800".
 * @returns {[number, number, number, number]} [r, g, b, a] with a = 255.
 */
export function hexToRgba(value) {
    const clean = value.replace(/^#/, "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b, 255];
}
