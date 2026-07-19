#!/usr/bin/env node
/**
 * Stage 1: Parse human-authored markdown slide specs into machine-readable JSON.
 *
 * Stage 1: Parse human-authored markdown slide specs into machine-readable JSON.
 *
 * Reads one or more markdown files in the four-layer slide spec format (workflow/01-content),
 * produces the artifacts consumed by downstream stages:
 *
 *     slide_plan.json               — per-slide metadata: id, kicker, headline, layout contract
 *     page_prompts/_prompts.json    — per-slide assembled prompts (machine format Stage 2 reads)
 *     page_prompts/NN_id.prompt.md  — one human-readable prompt per slide (readable twin)
 *
 * Usage:
 *     node stage1_build_inputs.mjs \
 *         --input slide-specifications.md \
 *         --out-dir 3_versions/v1/_generated/ \
 *         --style-dir 2_backbone/visual-style/
 *
 * Render mode per slide (ONE vocabulary everywhere):
 *     full-page          — AI paints the whole slide including title
 *     body+header-lock   — AI paints body only; Stage 3 Header-Lock overlays kicker/title
 *
 * If a slide declares explicit `RENDER MODE` it wins; otherwise derived from
 * VISUAL TYPE → FULL_PAGE_TYPES. The resolved mode + its source are recorded in
 * slide_plan.json as layout_contract.render_mode (canonical). Legacy aliases
 * image_direct/normal are accepted on INPUT only and normalized away.
 *
 * Outputs are written under --out-dir (the generated _generated/ dir): slide_plan.json
 * at its root, prompts under page_prompts/. Style inputs are accepted as explicitly
 * resolved files so partial version overrides can inherit missing backbone assets.
 * If --style-dir is omitted, it falls back to probing near --out-dir for standalone use.
 *
 * Customization:
 *     Canvas, body-layout, safe-zone, and header geometry come from the resolved
 *     color_palette.json through visual_config.mjs. Only the VISUAL TYPE mapping is
 *     defined locally because it is a content/rendering policy rather than styling.
 */

import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage1_build_inputs.mjs";
import {
    CLI_ERROR_CODES,
    createCliNext,
    emitCliError,
} from "../shared/cli/cli_error.mjs";

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_CONFIG, loadVisualConfig, VisualConfigError } from "../02-visual-system/internal/visual_config.mjs";
import {
    DECK_SYSTEM_FILE,
    COLOR_PALETTE_FILE,
    BACKBONE_ASSETS_SUBDIR,
    ASSET_MANIFEST_FILE,
    GEN_SLIDE_PLAN,
    GEN_PROMPTS_SUBDIR,
    GEN_PROMPTS_JSON,
} from "../shared/run-bundle/bundle_layout.mjs";
import { loadAssetManifest, validateAssetManifest } from "../02-visual-system/internal/asset_manifest.mjs";
import { loadDeckSystem } from "../02-visual-system/internal/deck_system.mjs";
import {
    HTML_FIRST_PIPELINE,
    HtmlSlideContractError,
    probeProductionMarker,
    validateAndBuildHtmlFirstPlan,
} from "./internal/html_slide_contract.mjs";
import {
    CANONICAL_RENDER_MODES,
    RENDER_MODE_FULL_PAGE,
    RENDER_MODE_BODY_HEADER_LOCK,
    RenderPolicyError,
    determineRenderMode as resolveRenderMode,
    isBracketPlaceholder,
    isHeroVisualType,
    normalizeRenderMode,
    normalizeVisualType,
    parseLeadingFrontmatter,
    presentHeaderText,
    validatePolicySlideIds,
} from "../01-content/internal/render_policy.mjs";
import {
    IDENTITY_SCHEME_MNEMONIC_V1,
    SlideDocumentError,
    parseSlideDocument,
    validateSlideDocument,
} from "../01-content/internal/slide_document.mjs";
import { normalizeSpokenKey } from "../01-content/internal/slide_ids.mjs";

// ---------------------------------------------------------------------------
// Shared executable visual configuration
// ---------------------------------------------------------------------------

let CANVAS_WIDTH;
let CANVAS_HEIGHT;
let NORMAL_HEADER_SAFE_ZONE;
let CONTENT_TOP_GAP;
let CONTENT_BOTTOM;
let CALLOUT_TOP;
let CALLOUT_BOTTOM;
let NO_CALLOUT_BOTTOM;
let ACTIVE_VISUAL_CONFIG;

/**
 * Expose config values through module-scoped variables used by helpers.
 * Legacy port of `_apply_visual_config`.
 */
function applyVisualConfig(config) {
    ACTIVE_VISUAL_CONFIG = config;
    CANVAS_WIDTH = config.canvas.width_px;
    CANVAS_HEIGHT = config.canvas.height_px;
    NORMAL_HEADER_SAFE_ZONE = config.header_lock.body_header_safe_zone;
    CONTENT_TOP_GAP = config.body_layout.content_top_gap_px;
    CONTENT_BOTTOM = config.body_layout.content_bottom_px;
    CALLOUT_TOP = config.body_layout.callout_top_px;
    CALLOUT_BOTTOM = config.body_layout.callout_bottom_px;
    NO_CALLOUT_BOTTOM = config.body_layout.no_callout_bottom_px;
}

applyVisualConfig(DEFAULT_CONFIG);

export function configureVisualConfig(config) {
    applyVisualConfig(config || DEFAULT_CONFIG);
}

// IDs for specific slides that need extra header space (optional, can be empty)
const EXTRA_SAFE_IDS = {};
// Example: {"s2_13_habits": 360}

// ---------------------------------------------------------------------------
// System contracts — injected into every prompt
// ---------------------------------------------------------------------------

function systemHeaderContract(safeZone) {
    return (
        `HEADER CONTRACT - ABSOLUTE:\n` +
        `Do not render the slide kicker, title, or subtitle. ` +
        `The top y=0 to y=${safeZone} is a reserved header band. ` +
        `Keep this area clean and empty — no text, icons, cards, or diagrams.\n`
    );
}

const SYSTEM_BODY_TEXT_CONTRACT = (
    "BODY TEXT CONTRACT:\n" +
    "Keep body text large and readable. No more than 3-5 text zones per slide. " +
    "KPI numbers must appear at least 72px visual. " +
    "No dashboard microtext, checkbox labels, table rows, or footnotes.\n"
);

const SYSTEM_STYLE_ANCHORING = (
    "Use the reference image(s) as your EXACT visual style guide. " +
    "Match the color palette, typography scale, layout grid, component patterns, " +
    "and overall visual language precisely. The reference defines the deck's design system — " +
    "do not deviate from it. Only change the slide content, not the style.\n"
);

const SYSTEM_FINAL_RULES = (
    "English only. No logos. No watermarks. No page numbers. " +
    "No source notes. No clip art or stock photos.\n" +
    "Follow the deck_system.txt constraints for colors and tone.\n"
);

// ---------------------------------------------------------------------------
// File loaders
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared executable visual configuration
// ---------------------------------------------------------------------------
function loadVisualConfigFromPalette(palettePath) {
    let config;
    try {
        config = loadVisualConfig(palettePath);
    } catch (exc) {
        if (exc instanceof VisualConfigError) {
            console.error(`Invalid visual config ${palettePath}: ${exc.message}`);
            process.exit(1);
        }
        throw exc;
    }
    applyVisualConfig(config);
    if (existsSync(palettePath)) {
        console.log(
            `  Visual config: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}, ` +
            `header=${NORMAL_HEADER_SAFE_ZONE}px (${palettePath})`
        );
    }
}

/**
 * Backward-compatible alias for older tests and standalone callers.
 * Legacy port of `_load_safe_zone_from_palette`.
 */
function loadSafeZoneFromPalette(palettePath) {
    loadVisualConfigFromPalette(palettePath);
}

// ---------------------------------------------------------------------------
// Markdown parser
// ---------------------------------------------------------------------------

/**
 * Extract a bold-labeled field value from a slide body.
 * Legacy port of `_extract_field`.
 */
function extractField(body, field) {
    // Escape regex-special characters in the field name
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\*\\*${escaped}\\*\\*:[ \\t]*(.*?)[ \\t]*$`, "m");
    const m = body.match(re);
    return m ? m[1].trim() : "";
}

/**
 * Extract the IMAGE PROMPT block from a slide body.
 * Raises on missing prompt (non-raising twin: getImagePrompt).
 * Legacy port of `_extract_prompt`.
 */
function extractPrompt(body, slideId) {
    // Format A (code block): **IMAGE PROMPT**:\n```\ncontent\n```
    let m = body.match(/^\*\*IMAGE PROMPT\*\*:\s*```\s*([\s\S]*?)```/m);
    if (m) {
        return m[1].trim();
    }

    // Format B (inline): **IMAGE PROMPT**: [one-line description]
    m = body.match(/^\*\*IMAGE PROMPT\*\*:\s*(.+)$/m);
    if (m) {
        const inline = m[1].trim();
        // Return the inline text as-is; agent is expected to expand [PLACEHOLDER] descriptions
        // into full image prompts before running the pipeline
        return inline;
    }

    throw new Error(`Missing IMAGE PROMPT block for slide ${slideId}`);
}

/**
 * Return the IMAGE PROMPT text (code-fence OR inline form), or null if absent.
 * Non-raising twin of extractPrompt, for the validator.
 * Legacy port of `_get_image_prompt`.
 */
function getImagePrompt(body) {
    let m = body.match(/^\*\*IMAGE PROMPT\*\*:\s*```\s*([\s\S]*?)```/m);
    if (m) {
        return m[1].trim();
    }
    m = body.match(/^\*\*IMAGE PROMPT\*\*:\s*(\S.*)$/m);
    if (m) {
        return m[1].trim();
    }
    return null;
}

/**
 * Detect whether a slide body contains a bottom callout section.
 * Legacy port of `_has_bottom_callout`.
 */
function hasBottomCallout(body) {
    return /\b(BOTTOM CALLOUT|Bottom callout|Bottom statement|callout bar)\b/i.test(body);
}

// ---------------------------------------------------------------------------
// Header variant detection
// ---------------------------------------------------------------------------

/**
 * Return (renderMode, safeZonePx, source).
 *
 * Precedence: explicit RENDER MODE field (author override) > EXTRA_SAFE_IDS >
 * VISUAL TYPE → FULL_PAGE_TYPES mapping. `source` records which rule decided,
 * so slide_plan.json is traceable (explicit vs derived). A typo'd RENDER MODE
 * throws (see normalizeRenderMode) rather than silently falling back.
 * Legacy port of `_determine_render_mode`.
 */
function determineRenderMode(slideId, visualType, renderMode, policy = null) {
    return resolveRenderMode({
        slideId,
        visualType,
        renderMode,
        policy,
        safeZone: NORMAL_HEADER_SAFE_ZONE,
        extraSafeZone: slideId in EXTRA_SAFE_IDS ? EXTRA_SAFE_IDS[slideId] : null,
    });
}

// Back-compat name used by older call sites / docs
const determineHeaderVariant = determineRenderMode;

/**
 * Read canonical render_mode from a layout_contract.
 *
 * Prefers `render_mode` (v1.3+). Falls back to legacy `header_variant`
 * (image_direct→full-page, normal*→body+header-lock) so consumers can still
 * read older slide_plan.json files without a Stage-1 rerun.
 * Legacy port of `_contract_render_mode`.
 */
function contractRenderMode(layout) {
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
// Layout contract builder
// ---------------------------------------------------------------------------

/**
 * Build the layout_contract dict for a single slide.
 * Legacy port of `_build_layout_contract`.
 */
function buildLayoutContract(slideId, visualType, body, renderMode, policy = null) {
    const { mode, safeZone, source } = determineRenderMode(
        slideId, visualType, renderMode, policy
    );

    if (mode === RENDER_MODE_FULL_PAGE) {
        return {
            render_mode: RENDER_MODE_FULL_PAGE,
            render_mode_source: source,
            header_safe_zone: 0,
            canvas: [CANVAS_WIDTH, CANVAS_HEIGHT],
        };
    }

    const hasCallout = hasBottomCallout(body);
    const contentYMin = safeZone + CONTENT_TOP_GAP;
    const contentYMax = hasCallout ? CONTENT_BOTTOM : NO_CALLOUT_BOTTOM;

    const contract = {
        canvas: [CANVAS_WIDTH, CANVAS_HEIGHT],
        render_mode: mode,
        render_mode_source: source,
        header_safe_zone: safeZone,
        content_y_min: contentYMin,
        content_y_max: contentYMax,
        has_bottom_callout: hasCallout,
    };
    if (hasCallout) {
        contract.callout_y_min = CALLOUT_TOP;
        contract.callout_y_max = CALLOUT_BOTTOM;
    }
    return contract;
}

// ---------------------------------------------------------------------------
// Prompt assembler
// ---------------------------------------------------------------------------

function exactHeaderTextContract(slide, { freeForm = false } = {}) {
    const fields = [];
    if (slide.kicker) fields.push(`KICKER: ${JSON.stringify(slide.kicker)}`);
    if (slide.headline) fields.push(`TITLE: ${JSON.stringify(slide.headline)}`);
    if (slide.subtitle) fields.push(`SUBTITLE: ${JSON.stringify(slide.subtitle)}`);
    const composition = freeForm
        ? "Use these exact strings, but integrate them freely into the hero composition."
        : "Render these exact strings in the specified header geometry.";
    return `HEADER TEXT - EXACT:\n${fields.join("\n")}\n${composition}\n`;
}

function contentHeaderPlacementContract(slide) {
    const config = ACTIVE_VISUAL_CONFIG;
    const header = config.header_lock;
    const position = header.position;
    return (
        `HEADER PLACEMENT - ABSOLUTE SOFT TARGET:\n` +
        `Reserve the top-left header band from y=0 to y=${header.body_header_safe_zone}px ` +
        `for header text only on a ${config.canvas.width_px}x${config.canvas.height_px}px canvas. ` +
        `Body visuals, diagrams, cards, and icons must begin below y=${header.body_header_safe_zone}px.\n` +
        `Left-align all header text at x=${position.left_px}px with right margin ${position.right_margin_px}px.\n` +
        `Kicker target: y=${position.kicker_y_px}px, ${header.kicker.family} ` +
        `${header.kicker.weight}, ${header.kicker.size_px}px, ${header.kicker.color}.\n` +
        `Title target: y=${position.title_y_px}px, ${header.title.family} ` +
        `${header.title.weight}, ${header.title.size_px}px, ${header.title.color}, ` +
        `line height ${position.title_line_height_px}px.\n` +
        `Subtitle target: ${position.subtitle_gap_px}px below the title, ${header.subtitle.family} ` +
        `${header.subtitle.weight}, ${header.subtitle.size_px}px, ${header.subtitle.color}, ` +
        `line height ${position.subtitle_line_height_px}px.\n` +
        `${exactHeaderTextContract(slide)}`
    );
}

/**
 * Wrap source IMAGE PROMPT with system contracts.
 *
 * @param {string} sourcePrompt - The human-authored IMAGE PROMPT from markdown.
 * @param {object} slide - Slide record with layout_contract, kicker, headline, etc.
 * @param {string} finalRules - System final rules — either from deck_system.txt or hardcoded default.
 * Legacy port of `_assemble_prompt`.
 */
function assemblePrompt(sourcePrompt, slide, finalRules) {
    if (!finalRules) {
        finalRules = SYSTEM_FINAL_RULES;
    }

    const layout = slide.layout_contract;
    const safeZone = Number(layout.header_safe_zone);
    const mode = contractRenderMode(layout);

    if (mode === RENDER_MODE_FULL_PAGE) {
        const headerContract = isHeroVisualType(slide.visual_type)
            ? exactHeaderTextContract(slide, { freeForm: true })
            : contentHeaderPlacementContract(slide);
        return (
            `FULL-PAGE: Render the complete slide including all text.\n` +
            `Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}.\n\n` +
            `${headerContract}\n` +
            `${sourcePrompt}\n\n` +
            `${SYSTEM_STYLE_ANCHORING}${finalRules}`
        );
    }

    const hasCallout = layout.has_bottom_callout || false;
    const calloutContract = hasCallout
        ? `Reserve the bottom callout lane from y=${layout.callout_y_min} ` +
          `to y=${layout.callout_y_max}. Place the management takeaway bar there ` +
          `with large readable text.`
        : "This slide does not need a bottom callout bar.";

    return (
        `${systemHeaderContract(safeZone)}` +
        `Stage 3 (Header-Lock) will draw the structured header later.\n\n` +
        `LAYOUT CONTRACT:\n` +
        `Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}. ` +
        `Content zone: y=${layout.content_y_min} to y=${layout.content_y_max}. ` +
        `${calloutContract}\n\n` +
        `${SYSTEM_BODY_TEXT_CONTRACT}\n` +
        `SOURCE IMAGE PROMPT:\n${sourcePrompt}\n\n` +
        `${SYSTEM_STYLE_ANCHORING}${finalRules}`
    );
}

function lineNumberAt(text, index) {
    return text.slice(0, Math.max(0, index)).split("\n").length;
}

function fieldLine(text, block, field) {
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = block.body.match(new RegExp(`^\\*\\*${escaped}\\*\\*:[ \\t]*`, "m"));
    return match ? lineNumberAt(text, block.bodyStart + match.index) : block.headingLine;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Markers left behind by the unfilled --init template (an unfilled spec must not
// reach image generation).
const PLACEHOLDER_MARKERS = ["[PLACEHOLDER", "[slide_id]", "## Slide 01: `slide_id`"];

// ≥3 chars, leading upper, only UPPER/digit/underscore — matches [CASE_KICKER],
// [OUTCOME]; deliberately skips short inline refs like [C1]/[C2] used in prose.
const ALLCAPS_PLACEHOLDER_RE = /\[[A-Z][A-Z0-9_]{2,}\b/g;

function readSpecContext(mdPath) {
    let text;
    try {
        text = readFileSync(mdPath, "utf-8");
    } catch {
        throw new Error(`Cannot read spec file: ${mdPath}`);
    }
    const label = basename(mdPath);
    const document = parseSlideDocument(text, { path: mdPath, relative_path: label });
    const frontmatter = parseLeadingFrontmatter(text, label);
    const blockRecords = document.slides.map((block) => ({
        slideId: block.slide_id,
        body: block.body,
        headingStart: block.heading_range.start,
        bodyStart: block.body_range.start,
        headingLine: block.heading_range.start_line,
        position: block.position,
        headingNumber: block.heading_number,
        headingNumberToken: block.heading_number_token,
        documentBlock: block,
    }));
    const blocks = blockRecords.map(({ slideId, body }) => [slideId, body]);
    validatePolicySlideIds(frontmatter.policy, blocks.map(([id]) => id), label);
    return {
        text,
        body: frontmatter.body,
        blocks,
        blockRecords,
        policy: frontmatter.policy,
        document,
        identity: document.frontmatter.metadata?.identity || null,
    };
}

function validationRecord({
    severity = "ERROR",
    display,
    message,
    path,
    line = 1,
    slideId = null,
    field = null,
    reason,
    actual,
    expected,
}) {
    const sourcePath = resolve(path);
    return {
        severity,
        display,
        message,
        source: { path: sourcePath, line: Math.max(1, line) },
        subject: slideId || field
            ? { kind: slideId ? "slide" : "source_file", ...(slideId ? { id: slideId } : { id: basename(path) }), ...(field ? { field } : {}) }
            : { kind: "source_file", id: basename(path) },
        reason: { kind: reason, ...(actual !== undefined ? { actual } : {}), ...(expected !== undefined ? { expected } : {}) },
        lineage: [{ kind: "source", path: sourcePath, stage: "input" }],
    };
}

function slideDocumentValidationRecord(issue, mdPath) {
    const line = issue.source?.line || 1;
    const slideId = issue.subject?.id || null;
    const expected = issue.expected ?? (
        issue.code === "noncanonical_heading_position" ? issue.expected : undefined
    );
    return validationRecord({
        severity: issue.severity || "ERROR",
        display: issue.repair_hint
            ? `${issue.message}. Repair: ${issue.repair_hint}.`
            : issue.message,
        message: issue.message,
        path: mdPath,
        line,
        slideId,
        field: issue.code.includes("heading") ? "slide heading" : "slide id",
        reason: issue.code,
        ...(issue.actual !== undefined ? { actual: issue.actual } : {}),
        ...(expected !== undefined ? { expected } : {}),
    });
}

/**
 * Validate slide-specs against the pipeline's CONTENT contract before any
 * (expensive) image generation. Structure has bundle_layout.mjs --check; this is
 * its content-side analog — the L3 gate.
 *
 * Reuses the SAME block regex + field extractors as parseSlides(), so the gate
 * can't drift from what the parser actually consumes. Unlike the parser (which
 * dies on the first missing IMAGE PROMPT), this surfaces EVERY problem in one
 * pass so the author fixes the spec once, not N times.
 *
 * Returns a flat list, each item prefixed 'ERROR:' (generation would fail or
 * silently emit a broken slide) or 'WARN:' (a gap that won't break generation).
 * Empty = clean. Callers abort on any ERROR and print WARNs.
 *
 * @param {string[]} mdPaths - Array of paths to markdown slide spec files.
 * @returns {string[]} Array of problem strings.
 */
export function validateSpecRecords(mdPaths, assetManifest = null) {
    const problems = [];
    const seenIds = new Map();
    const seenSpokenKeys = new Map();

    for (const mdPath of mdPaths) {
        const label = basename(mdPath);

        if (!existsSync(mdPath)) {
            problems.push(validationRecord({
                display: `spec file not found: ${mdPath}`,
                message: "slide specification source file is missing",
                path: mdPath,
                reason: "missing_file",
                expected: "existing markdown source",
            }));
            continue;
        }

        let context;
        try {
            context = readSpecContext(mdPath);
        } catch (error) {
            if (error instanceof SlideDocumentError) {
                for (const issue of error.issues) {
                    problems.push(slideDocumentValidationRecord(issue, mdPath));
                }
                continue;
            }
            const details = error instanceof RenderPolicyError ? error.problems : [error.message];
            for (const detail of details) {
                problems.push(validationRecord({
                    display: detail,
                    message: "slide specification render policy is invalid",
                    path: mdPath,
                    reason: "invalid_render_policy",
                    expected: "valid render mapping and known slide ids",
                }));
            }
            continue;
        }
        const { text, blockRecords, policy, document } = context;

        const documentIssues = validateSlideDocument(document);
        for (const issue of documentIssues) {
            problems.push(slideDocumentValidationRecord(issue, mdPath));
        }

        const marker = PLACEHOLDER_MARKERS.find((m) => text.includes(m));
        if (marker) {
            problems.push(validationRecord({
                display: `${label} still contains an unfilled-template marker — fill real content and delete every placeholder instruction.`,
                message: "slide specification contains an unfilled template marker",
                path: mdPath,
                line: lineNumberAt(text, text.indexOf(marker)),
                field: "template",
                reason: "unfilled_template_marker",
                expected: "real slide content",
            }));
        }

        const shouty = text.match(ALLCAPS_PLACEHOLDER_RE);
        if (shouty) {
            const unique = [...new Set(shouty)].sort();
            const examples = unique.slice(0, 3).map((m) => m + "]").join(", ");
            problems.push(validationRecord({
                display: `${label} still has unfilled template placeholders (e.g. ${examples}) — replace every placeholder with real content before generating.`,
                message: "slide specification contains unfilled placeholder tokens",
                path: mdPath,
                line: lineNumberAt(text, text.search(ALLCAPS_PLACEHOLDER_RE)),
                field: "template",
                reason: "unfilled_placeholder",
                expected: "real slide content",
            }));
        }

        if (blockRecords.length === 0) {
            problems.push(validationRecord({
                display: `${label} has no slide blocks (need '## Slide N: slide_id' headings).`,
                message: "slide specification has no slide blocks",
                path: mdPath,
                field: "slide heading",
                reason: "missing_slide_blocks",
                expected: "## Slide N: slide_id",
            }));
            continue;
        }

        for (const block of blockRecords) {
            const { slideId, body } = block;
            const sid = slideId || "<unnamed>";
            const occurrences = seenIds.get(slideId) || [];
            occurrences.push({ path: mdPath, line: block.headingLine });
            seenIds.set(slideId, occurrences);
            const spokenKey = normalizeSpokenKey(slideId);
            const spokenOccurrences = seenSpokenKeys.get(spokenKey) || [];
            spokenOccurrences.push({ slideId, path: mdPath, line: block.headingLine });
            seenSpokenKeys.set(spokenKey, spokenOccurrences);

            const visualType = extractField(body, "VISUAL TYPE");
            const renderModeRaw = extractField(body, "RENDER MODE");
            const title = extractField(body, "TITLE");
            const kicker = extractField(body, "KICKER");

            if (policy && (!visualType || isBracketPlaceholder(visualType))) {
                problems.push(validationRecord({ display: `slide ${JSON.stringify(sid)}: render policy requires a real VISUAL TYPE to distinguish hero and content prompt contracts.`, message: "render policy requires a real visual type", path: mdPath, line: fieldLine(text, block, "VISUAL TYPE"), slideId: sid, field: "VISUAL TYPE", reason: "missing_required_field", expected: "non-placeholder visual type" }));
            }
            if (!policy && !visualType && !renderModeRaw) {
                problems.push(validationRecord({ display: `slide ${JSON.stringify(sid)}: no VISUAL TYPE and no RENDER MODE — legacy resolution would silently choose body+header-lock.`, message: "slide has neither visual type nor render mode", path: mdPath, line: block.headingLine, slideId: sid, field: "VISUAL TYPE/RENDER MODE", reason: "missing_required_field", expected: ["VISUAL TYPE", "RENDER MODE"] }));
            }

            let mode = null;
            try {
                mode = determineRenderMode(slideId, visualType, renderModeRaw, policy).mode;
            } catch (error) {
                const details = error instanceof RenderPolicyError ? error.problems : [error.message];
                for (const detail of details) {
                    problems.push(validationRecord({ display: detail, message: "render mode is not supported", path: mdPath, line: fieldLine(text, block, "RENDER MODE"), slideId: sid, field: "RENDER MODE", reason: "invalid_enum", expected: [RENDER_MODE_FULL_PAGE, RENDER_MODE_BODY_HEADER_LOCK] }));
                }
            }

            // b) IMAGE PROMPT is mandatory and must be real (not an [instruction] stub).
            const prompt = getImagePrompt(body);
            if (prompt === null) {
                problems.push(validationRecord({ display: `slide ${JSON.stringify(sid)}: missing IMAGE PROMPT block.`, message: "slide is missing an image prompt", path: mdPath, line: block.headingLine, slideId: sid, field: "IMAGE PROMPT", reason: "missing_required_field", expected: "non-empty image prompt" }));
            } else if (isBracketPlaceholder(prompt)) {
                problems.push(validationRecord({ display: `slide ${JSON.stringify(sid)}: IMAGE PROMPT is still a placeholder — write the actual visual description.`, message: "slide image prompt is still a placeholder", path: mdPath, line: fieldLine(text, block, "IMAGE PROMPT"), slideId: sid, field: "IMAGE PROMPT", reason: "unfilled_placeholder", expected: "concrete image prompt" }));
            }

            // c) body+header-lock slides get their TITLE overlaid by Stage 3 — an empty
            //    OR placeholder TITLE draws a blank/garbage header band onto the image.
            const titleFilled = Boolean(presentHeaderText(title));
            if (mode === RENDER_MODE_BODY_HEADER_LOCK && !titleFilled) {
                problems.push(validationRecord({ display: `slide ${JSON.stringify(sid)}: body+header-lock slide has no real TITLE — Stage 3 would overlay an empty header. Add a TITLE, or make it full-page.`, message: "body+header-lock slide is missing a real title", path: mdPath, line: fieldLine(text, block, "TITLE"), slideId: sid, field: "TITLE", reason: "missing_required_field", expected: "non-placeholder title or full-page render mode" }));
            }

            // d) quality-layer warnings (do not block generation).
            if (mode === RENDER_MODE_FULL_PAGE && !isHeroVisualType(visualType) && !titleFilled) {
                problems.push(validationRecord({ severity: "WARN", display: `slide ${JSON.stringify(sid)}: content full-page slide has no real TITLE (it would ship without a header title).`, message: "content full-page slide has no real title", path: mdPath, line: fieldLine(text, block, "TITLE"), slideId: sid, field: "TITLE", reason: "missing_recommended_field", expected: "non-placeholder title" }));
            }
            if (mode === RENDER_MODE_BODY_HEADER_LOCK && !presentHeaderText(kicker)) {
                problems.push(validationRecord({ severity: "WARN", display: `slide ${JSON.stringify(sid)}: no real KICKER (header overlay will show the title alone).`, message: "body+header-lock slide has no real kicker", path: mdPath, line: fieldLine(text, block, "KICKER"), slideId: sid, field: "KICKER", reason: "missing_recommended_field", expected: "non-placeholder kicker" }));
            }

            // e) VISUAL ASSETS validation (WARNING only — assets are optional infrastructure)
            if (assetManifest) {
                const assetRaw = extractField(body, "VISUAL ASSETS");
                if (assetRaw) {
                    const ids = assetRaw.split(",").map(s => s.trim()).filter(Boolean);
                    for (const assetId of ids) {
                        if (!assetManifest.assets || !assetManifest.assets[assetId]) {
                            problems.push(validationRecord({
                                severity: "WARN",
                                display: `slide ${JSON.stringify(sid)}: VISUAL ASSETS references unknown asset "${assetId}" (not in asset-manifest.yaml)`,
                                message: "slide references an unknown visual asset",
                                path: mdPath,
                                line: fieldLine(text, block, "VISUAL ASSETS"),
                                slideId: sid,
                                field: "VISUAL ASSETS",
                                reason: "unknown_asset_reference",
                                actual: assetId,
                                expected: "registered asset id",
                            }));
                        }
                    }
                }
            }
        }
    }

    for (const [sid, occurrences] of seenIds.entries()) {
        if (occurrences.length > 1) {
            const alreadyReported = problems.some((problem) =>
                problem.reason?.kind === "duplicate_slide_id" && problem.subject?.id === sid
            );
            if (!alreadyReported) {
                problems.push(validationRecord({ severity: "ERROR", display: `slide id ${JSON.stringify(sid)} appears ${occurrences.length} times.`, message: "slide id appears more than once", path: occurrences[0].path, line: occurrences[0].line, slideId: sid, field: "slide id", reason: "duplicate_slide_id", actual: occurrences.length, expected: 1 }));
            }
        }
    }
    for (const [spokenKey, occurrences] of seenSpokenKeys.entries()) {
        const ids = [...new Set(occurrences.map((entry) => entry.slideId))];
        if (occurrences.length <= 1 || ids.length <= 1) continue;
        const alreadyReported = problems.some((problem) =>
            problem.reason?.kind === "duplicate_spoken_key" &&
            ids.includes(problem.subject?.id)
        );
        if (!alreadyReported) {
            problems.push(validationRecord({
                severity: "ERROR",
                display: `spoken key ${JSON.stringify(spokenKey)} is shared by slide ids ${ids.join(", ")}.`,
                message: "slide spoken key appears more than once",
                path: occurrences[0].path,
                line: occurrences[0].line,
                slideId: ids[0],
                field: "slide id",
                reason: "duplicate_spoken_key",
                actual: ids,
                expected: "one formal slide id per spoken key",
            }));
        }
    }

    return problems;
}

export function validateSpecs(mdPaths, assetManifest = null) {
    return validateSpecRecords(mdPaths, assetManifest).map((problem) => `${problem.severity}: ${problem.display}`);
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse one or more markdown files into slide plan and prompts.
 *
 * @param {string[]} mdPaths - Paths to markdown slide spec files.
 * @param {string} finalRules - Custom final rules from deck_system.txt (if available).
 * @param {object|null} [assetManifest] - Optional parsed asset-manifest.yaml.
 *                              Falls back to hardcoded SYSTEM_FINAL_RULES if empty.
 * @returns {{ plan: object[], prompts: object[] }}
 * Legacy port of `parse_slides`.
 */
export function parseSlides(mdPaths, finalRules, assetManifest = null) {
    if (!finalRules) {
        finalRules = SYSTEM_FINAL_RULES;
    }

    const plan = [];
    const prompts = [];
    let seq = 1;
    const identitySchemes = [];
    const currentIds = new Map();
    const currentSpokenKeys = new Map();

    for (const mdPath of mdPaths) {
        const context = readSpecContext(mdPath);
        const { text, blockRecords, policy, document, identity } = context;
        identitySchemes.push(identity?.scheme || null);

        const documentIssues = validateSlideDocument(document).filter(
            (issue) => issue.severity === "ERROR"
        );
        if (documentIssues.length > 0) {
            throw new SlideDocumentError(
                `${basename(mdPath)} has ${documentIssues.length} slide document error(s)`,
                documentIssues
            );
        }

        // Novice guard: the file may still be the unfilled template (--init copies
        // it in with [PLACEHOLDER] markers and placeholder slide ids). Running the
        // pipeline on it would fail cryptically — say it in plain language instead.
        if (text.includes("[PLACEHOLDER") || text.includes("## Slide 01: `slide_id`") || text.includes("[slide_id]")) {
            throw new Error(
                `${mdPath} 看起来还是空模板(含 [PLACEHOLDER] 占位符)。\n` +
                `  请先填内容:打开它,把每张 slide 的 VISUAL TYPE / KICKER / TITLE / ` +
                `IMAGE PROMPT 换成你的真实内容(删掉所有 [PLACEHOLDER] 和 [INSTRUCTION] 注释),再跑管线。\n` +
                `  例子见 workflow/01-content/example-deck-brief-mini.md。`
            );
        }

        // Accept colon (:), full-width colon (：), hyphen (-), or em-dash (—) after slide number (with optional space)
        if (blockRecords.length === 0) {
            throw new Error(
                `${mdPath} 里没找到 slide 块(需要 '## Slide N: slide_id' 这样的标题)。\n` +
                `  如果这是新建的空文件,请按模板格式填入至少一张 slide。`
            );
        }

        for (const block of blockRecords) {
            const { slideId, body } = block;
            const previousId = currentIds.get(slideId);
            if (previousId) {
                throw new SlideDocumentError(
                    `slide ID ${JSON.stringify(slideId)} appears in both ${previousId.path} and ${mdPath}`,
                    []
                );
            }
            const spokenKey = normalizeSpokenKey(slideId);
            const previousSpoken = currentSpokenKeys.get(spokenKey);
            if (previousSpoken && previousSpoken.slideId !== slideId) {
                throw new SlideDocumentError(
                    `spoken key ${JSON.stringify(spokenKey)} is shared by ${previousSpoken.slideId} and ${slideId}`,
                    []
                );
            }
            currentIds.set(slideId, { path: mdPath });
            currentSpokenKeys.set(spokenKey, { path: mdPath, slideId });

            const rawVisualType = extractField(body, "VISUAL TYPE");
            if (policy && (!rawVisualType || isBracketPlaceholder(rawVisualType))) {
                throw new RenderPolicyError(
                    `slide ${JSON.stringify(slideId)}: render policy requires a real VISUAL TYPE`
                );
            }
            const visualType = normalizeVisualType(rawVisualType);
            const renderMode = extractField(body, "RENDER MODE");   // explicit author override (optional)
            const kicker = presentHeaderText(extractField(body, "KICKER"));
            const headline = presentHeaderText(extractField(body, "TITLE"));
            const subtitle = presentHeaderText(extractField(body, "SUBTITLE"));
            const sourcePrompt = extractPrompt(body, slideId);

            // Parse VISUAL ASSETS field (optional — only when manifest provided)
            const visualAssetsRaw = extractField(body, "VISUAL ASSETS");
            const rawAssetIds = visualAssetsRaw
                ? visualAssetsRaw.split(",").map(s => s.trim()).filter(Boolean)
                : [];
            const validAssetIds = [];
            if (rawAssetIds.length > 0 && assetManifest) {
                for (const id of rawAssetIds) {
                    if (assetManifest.assets && assetManifest.assets[id]) {
                        validAssetIds.push(id);
                    } else {
                        console.warn(`  WARNING: slide ${slideId} references unknown asset "${id}" — skipping`);
                    }
                }
            }

            const slideRecord = {
                id: slideId,
                slide_id: slideId,
                position: seq,
                visual_type: visualType,
            };
            if (kicker) slideRecord.kicker = kicker;
            if (headline) slideRecord.headline = headline;
            if (subtitle) {
                slideRecord.subtitle = subtitle;
            }
            if (validAssetIds.length > 0) {
                slideRecord.assets = validAssetIds;
            }

            slideRecord.layout_contract = buildLayoutContract(
                slideId, visualType, body, renderMode, policy
            );
            plan.push(slideRecord);

            const outName = `${slideId}.png`;
            const promptTwin = `${String(seq).padStart(2, "0")}--${slideId}.prompt.md`;
            const fullPrompt = assemblePrompt(sourcePrompt, slideRecord, finalRules);
            const promptEntry = {
                id: slideId,
                slide_id: slideId,
                position: seq,
                label: `${String(seq).padStart(2, "0")} · ${slideId}${headline ? ` · ${headline}` : ""}`,
                out: outName,
                prompt_twin: promptTwin,
                prompt: fullPrompt,
            };
            if (validAssetIds.length > 0) {
                promptEntry.asset_ids = validAssetIds;
            }
            prompts.push(promptEntry);
            seq++;
        }
    }

    const allMnemonic = identitySchemes.length > 0 && identitySchemes.every(
        (scheme) => scheme === IDENTITY_SCHEME_MNEMONIC_V1
    );
    return {
        plan,
        prompts,
        identity: allMnemonic ? { scheme: IDENTITY_SCHEME_MNEMONIC_V1 } : null,
    };
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

/**
 * Parse command-line arguments into a structured options object.
 * CLI argument parsing (legacy port).
 */
function parseArgs(argv) {
    const args = {
        input: [],       // internal name — maps to --spec / --input
        outDir: null,    // internal name — maps to --out / --out-dir
        styleDir: null,
        deckSystem: null,
        colorPalette: null,
        validate: false,
        inputFlags: [],
        specOccurrences: 0,
        unknown: [],
    };

    for (let i = 0; i < argv.length; i++) {
        switch (argv[i]) {
            case "--spec":
            case "--input":
                args.inputFlags.push(argv[i]);
                if (argv[i] === "--spec") args.specOccurrences += 1;
                // Collect all following args until next --flag
                while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
                    args.input.push(argv[++i]);
                }
                break;
            case "--out":
            case "--out-dir":
                if (i + 1 < argv.length) args.outDir = argv[++i];
                break;
            case "--style-dir":
                if (i + 1 < argv.length) args.styleDir = argv[++i];
                break;
            case "--deck-system":
                if (i + 1 < argv.length) args.deckSystem = argv[++i];
                break;
            case "--color-palette":
                if (i + 1 < argv.length) args.colorPalette = argv[++i];
                break;
            case "--validate":
                args.validate = true;
                break;
            default:
                // Ignore unknown flags
                args.unknown.push(argv[i]);
                break;
        }
    }

    return args;
}

function emitHtmlFirstUsage(message) {
    emitCliError({
        code: CLI_ERROR_CODES.USAGE,
        message,
        hint: "Use exactly: --validate --spec <run-dir>/slide-specifications.md",
        where: "stage1_build_inputs.html-first-arguments",
        diagnostic: {
            version: 1,
            category: "usage",
            stage: "stage1",
            operation: "parse-arguments",
            reason: { kind: "invalid_html_first_arguments" },
            next: createCliNext("fix_arguments", {
                invocation: { program: "node", args: [__filename, "--validate", "--spec", "slide-specifications.md"] },
                default: "Use the single canonical HTML-first validation source and remove aliases or overrides.",
            }),
        },
    });
}

function emitHtmlFirstFailure(error, where = "stage1_build_inputs.html-first-validation") {
    const issues = error instanceof HtmlSlideContractError ? error.issues : [];
    emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "HTML-first validation failed.",
        hint: "Repair the named canonical source or local control input, then rerun validation.",
        where,
        diagnostic: {
            version: 1,
            category: "source_validation",
            stage: "stage1",
            operation: "validate-html-first",
            ...(issues[0]?.source ? { source: issues[0].source } : {}),
            ...(issues.length ? { issues: issues.map((entry) => ({
                message: entry.message,
                ...(entry.subject ? { subject: entry.subject } : {}),
                ...(entry.source ? { source: entry.source } : {}),
                reason: { kind: entry.code || entry.kind || "html_first_invalid" },
            })) } : { reason: { kind: "html_first_invalid" } }),
            next: createCliNext("edit_source", {
                default: "Fix the retained HTML-first source/control issues; do not edit _generated artifacts.",
            }),
        },
    });
}

function handleDirectHtmlFirst(args) {
    const probes = args.input.map((path) => {
        try {
            return { path, result: probeProductionMarker(readFileSync(path), { source: basename(path) }) };
        } catch {
            return { path, result: { branch: "legacy", issues: [] } };
        }
    });
    const invalid = probes.find((entry) => entry.result.branch === "invalid");
    if (invalid) {
        emitHtmlFirstFailure(new HtmlSlideContractError("invalid leading frontmatter", invalid.result.issues));
        process.exit(1);
    }
    const marked = probes.filter((entry) => entry.result.branch === HTML_FIRST_PIPELINE);
    if (marked.length === 0) return false;
    if (!args.validate) {
        emitCliError({
            code: CLI_ERROR_CODES.FAILED,
            message: "Direct HTML-first Stage 1 publication is unavailable.",
            hint: "Use unified_pipeline.mjs --run-dir <run-dir> --stage 1.",
            where: "stage1_build_inputs.html-first-publication",
            diagnostic: {
                version: 1,
                category: "gate",
                stage: "stage1",
                operation: "publish-html-first",
                reason: { kind: "html_first_projection_requires_run_dir" },
                next: createCliNext("rerun", { default: "Use the canonical unified Stage-1 route so the run context and atomic output are authoritative." }),
            },
        });
        process.exit(1);
    }
    if (
        args.input.length !== 1
        || marked.length !== 1
        || args.inputFlags.some((flag) => flag !== "--spec")
        || args.specOccurrences !== 1
        || args.outDir !== null
        || args.styleDir !== null
        || args.deckSystem !== null
        || args.colorPalette !== null
        || args.unknown.length > 0
        || basename(args.input[0]) !== "slide-specifications.md"
    ) {
        emitHtmlFirstUsage("HTML-first direct validation accepts one canonical --spec and no aliases, overrides, or unknown options.");
        process.exit(1);
    }
    try {
        const { plan } = validateAndBuildHtmlFirstPlan({ runDir: dirname(resolve(args.input[0])) });
        console.log(`✓ HTML-first source passes the complete local contract (${plan.slides.length} slide(s)).`);
        return true;
    } catch (error) {
        emitHtmlFirstFailure(error);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.input.length === 0) {
        console.error("Error: --spec is required (one or more markdown slide spec files)");
        console.error("Usage: node stage1_build_inputs.mjs --spec <path> [--spec <path2> ...] --out <dir> [--validate]");
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Stage 1 requires at least one --spec source file.", hint: "Pass one or more markdown slide specification files.", where: "stage1_build_inputs.arguments", diagnostic: { version: 1, category: "usage", stage: "stage1", operation: "parse-arguments", next: createCliNext("fix_arguments", { invocation: { program: "node", args: [__filename, "--spec", "slide-specifications.md", "--validate"] }, default: "Pass at least one --spec path, then rerun Stage 1." }) } });
        process.exit(1);
    }

    if (handleDirectHtmlFirst(args)) return;

    // L3 content gate — validate the spec contract BEFORE anything expensive.
    // Runs on every invocation (so unified_pipeline gets it for free), lists every
    // problem at once, and aborts on any ERROR. Structure gate: bundle_layout --check.
    const problems = validateSpecRecords(args.input);
    for (const warning of problems.filter((problem) => problem.severity === "WARN")) {
        console.log(`  ⚠  ${warning.display}`);
    }
    const errors = problems.filter((problem) => problem.severity === "ERROR");
    if (errors.length > 0) {
        console.log(`✗ slide-specs failed the content contract — ${errors.length} problem(s):`);
        for (const error of errors) {
            console.log(`  - ${error.display}`);
        }
        console.log("  Fix these in slide-specifications.md, then rerun.");
        emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `${errors.length} slide specification error(s) block Stage 1.`, hint: "Edit the named markdown source problems, then rerun validation.", where: "stage1_build_inputs.validateSpecs", diagnostic: { version: 1, category: "source_validation", stage: "stage1", operation: "validate-specs", source: errors[0].source, issues: errors.map(({ message, subject, source, reason, lineage }) => ({ message, subject, source, reason, lineage })), next: createCliNext("edit_source", { inspect: errors.map(({ source }) => source), invocation: { program: "node", args: [__filename, ...args.input.flatMap((path) => ["--spec", path]), "--validate"] }, default: "Fix the retained source issues; do not edit _generated artifacts, then rerun validation." }) } });
        process.exit(1);
    }
    if (args.validate) {
        console.log(`✓ slide-specs pass the content contract (${args.input.length} file(s)).`);
        return;
    }

    if (!args.outDir) {
        console.error("Error: --out is required for generation (omit it only with --validate).");
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Stage 1 generation requires --out.", hint: "Pass the generated output directory or use --validate only.", where: "stage1_build_inputs.arguments", diagnostic: { version: 1, category: "usage", stage: "stage1", operation: "parse-arguments", source: { path: resolve(args.input[0]) }, next: createCliNext("fix_arguments", { default: "Add --out <generated-dir>, or add --validate for validation-only execution." }) } });
        process.exit(1);
    }
    const outDir = args.outDir;
    mkdirSync(outDir, { recursive: true });

    // Style dir resolution:
    //   - explicit --style-dir wins (the orchestrator always passes the
    //     override-aware backbone visual-style dir)
    //   - otherwise probe near --out-dir for standalone use (best-effort):
    //       look for a sibling "style"/"visual-style" dir next to out-dir or its parent
    let styleDir;
    if (args.styleDir) {
        styleDir = args.styleDir;
    } else if (existsSync(join(outDir, "visual-style"))) {
        styleDir = join(outDir, "visual-style");
    } else if (existsSync(join(dirname(outDir), "visual-style"))) {
        styleDir = join(dirname(outDir), "visual-style");
    } else if (existsSync(join(outDir, "style"))) {
        styleDir = join(outDir, "style");
    } else {
        styleDir = join(dirname(outDir), "style");
    }

    // Load custom deck system rules if available (from preset or manual config)
    const deckSystemPath = args.deckSystem || join(styleDir, DECK_SYSTEM_FILE);
    const palettePath = args.colorPalette || join(styleDir, COLOR_PALETTE_FILE);

    const deckSystem = loadDeckSystem(deckSystemPath);
    const finalRules = deckSystem || SYSTEM_FINAL_RULES;
    if (deckSystem) {
        console.log(`  Using ${deckSystemPath} for final rules (${deckSystem.length} chars)`);
    } else {
        console.log(`  No deck_system.txt found at ${deckSystemPath}, using hardcoded defaults`);
    }

    // Header safe zone is a live per-preset knob (color_palette.json), not hardcoded.
    loadSafeZoneFromPalette(palettePath);

    // Load asset manifest if present (optional infrastructure)
    let assetManifest = null;
    const assetDir = join(styleDir, BACKBONE_ASSETS_SUBDIR);
    if (existsSync(join(assetDir, ASSET_MANIFEST_FILE))) {
        try {
            assetManifest = loadAssetManifest(assetDir);
            const assetProblems = validateAssetManifest(assetManifest);
            if (assetProblems.length > 0) {
                console.warn(`  WARNING: asset manifest has ${assetProblems.length} issue(s):`);
                for (const p of assetProblems) console.warn(`    - ${p}`);
            }
            console.log(`  Asset manifest: ${Object.keys(assetManifest.assets || {}).length} assets registered`);
        } catch (err) {
            console.warn(`  WARNING: cannot load asset manifest: ${err.message}`);
        }
    }

    const { plan, prompts, identity } = parseSlides(args.input, finalRules, assetManifest);

    // slide_plan.json stays at the _generated/ root; per-slide prompts go into a
    // page_prompts/ subdir — one readable .prompt.md per slide plus a machine
    // _prompts.json (the schema Stage 2 consumes). One-file-per-slide makes
    // "what did page 7 get sent?" a single-file open instead of scanning a blob.
    const planPath = join(outDir, GEN_SLIDE_PLAN);
    const promptsDir = join(outDir, GEN_PROMPTS_SUBDIR);
    mkdirSync(promptsDir, { recursive: true });
    const promptsPath = join(promptsDir, GEN_PROMPTS_JSON);

    writeFileSync(
        planPath,
        JSON.stringify({ ...(identity ? { identity } : {}), slides: plan }, null, 2) + "\n",
        "utf-8"
    );
    writeFileSync(
        promptsPath,
        JSON.stringify({ ...(identity ? { identity } : {}), slides: prompts }, null, 2) + "\n",
        "utf-8"
    );

    // The position-bearing prompt twin is a cheap projection. The logical raw
    // image output remains ID-stable and never contains the current position.
    for (const entry of prompts) {
        const mdPath = join(promptsDir, entry.prompt_twin);
        writeFileSync(
            mdPath,
            `# Prompt — ${entry.id}\n\n` +
            `> Generated by Stage 1. Do not hand-edit — edit the source ` +
            `slide-specifications.md and rerun. Machine copy: \`_prompts.json\`.\n\n` +
            `\`\`\`\n${entry.prompt}\n\`\`\`\n`,
            "utf-8"
        );
    }

    console.log(`Parsed ${plan.length} slides from ${args.input.length} file(s)`);
    console.log(`  slide_plan:  ${planPath}`);
    console.log(`  prompts:     ${promptsPath}`);
    console.log(`  per-slide:   ${promptsDir}/NN--id.prompt.md  (${prompts.length} files)`);

    // Quick validation
    const fullPage = plan
        .filter((s) => contractRenderMode(s.layout_contract) === RENDER_MODE_FULL_PAGE)
        .map((s) => s.id);
    const bodyLock = plan.filter((s) => !fullPage.includes(s.id)).map((s) => s.id);
    console.log(`  body+header-lock slides: ${bodyLock.length}`);
    console.log(`  full-page slides:        ${fullPage.length}  [${fullPage.join(", ")}]`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1];
const isMain =
    invokedPath &&
    (invokedPath === __filename ||
     invokedPath === resolve(__filename) ||
     basename(invokedPath) === "stage1_build_inputs.mjs");

if (isMain) {
    const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
    installStandaloneFailureEnvelope({ where: "stage1_build_inputs" });
    if (process.argv.includes("--help")) {
        console.log("Usage: node stage1_build_inputs.mjs --spec <path> [--spec <path2>] [--out <dir>] [--style-dir <dir>] [--deck-system <file>] [--color-palette <file>] [--validate]");
        process.exit(0);
    }
    main();
}
