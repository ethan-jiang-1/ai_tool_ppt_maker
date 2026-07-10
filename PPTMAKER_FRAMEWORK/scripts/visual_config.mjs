/**
 * Shared executable visual configuration for Stage 1 and Stage 3.
 *
 * `color_palette.json` is the human-editable source. This module is the only place
 * that defines fallback canvas, body-layout, header geometry, and header-font
 * defaults, so prompt layout and deterministic header rendering cannot drift.
 */

import { readFileSync, statSync } from "node:fs";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class VisualConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = "VisualConfigError";
    }
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
