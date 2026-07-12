#!/usr/bin/env node
/**
 * Stage 1: Parse human-authored markdown slide specs into machine-readable JSON.
 *
 * Stage 1: Parse human-authored markdown slide specs into machine-readable JSON.
 *
 * Reads one or more markdown files in the four-layer slide spec format (workflow/02-content),
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

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_CONFIG, loadVisualConfig, VisualConfigError } from "./visual_config.mjs";
import {
    DECK_SYSTEM_FILE,
    COLOR_PALETTE_FILE,
    GEN_SLIDE_PLAN,
    GEN_PROMPTS_SUBDIR,
    GEN_PROMPTS_JSON,
} from "./bundle_layout.mjs";
import { loadDeckSystem } from "./lib/deck_system.mjs";
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
} from "./lib/render_policy.mjs";

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

// ---------------------------------------------------------------------------
// Slide block regex
// ---------------------------------------------------------------------------

// Slide-block heading regex — the ONE pattern the parser and the validator share.
// Matches "## Slide N: slide_id" headings; captures slide_id and separates blocks.
// In JS we use a two-pass approach: find heading positions, then slice bodies,
// because JS regex has no \Z equivalent that coexists with the m flag.
const SLIDE_BLOCK_HEADING_RE = /^## Slide \d+\s*[：:\-–—]\s*`?([^`\n]+)`?/gm;

/**
 * Parse a markdown text into an array of [slideId, body] tuples.
 * Splits on "## Slide N: slide_id" headings.
 * Shared by parseSlides() and validateSpecs() so they cannot drift.
 */
function splitSlideBlocks(text) {
    const blocks = [];
    const matches = [...text.matchAll(SLIDE_BLOCK_HEADING_RE)];

    for (let i = 0; i < matches.length; i++) {
        const slideId = matches[i][1].trim();
        const bodyStart = matches[i].index + matches[i][0].length;
        const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : text.length;
        const body = text.slice(bodyStart, bodyEnd);
        blocks.push([slideId, body]);
    }

    return blocks;
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
    const frontmatter = parseLeadingFrontmatter(text, label);
    const blocks = splitSlideBlocks(frontmatter.body);
    validatePolicySlideIds(frontmatter.policy, blocks.map(([id]) => id), label);
    return { text, body: frontmatter.body, blocks, policy: frontmatter.policy };
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
export function validateSpecs(mdPaths) {
    const problems = [];
    const seenIds = {};

    for (const mdPath of mdPaths) {
        const label = basename(mdPath);

        if (!existsSync(mdPath)) {
            problems.push(`ERROR: spec file not found: ${mdPath}`);
            continue;
        }

        let context;
        try {
            context = readSpecContext(mdPath);
        } catch (error) {
            const details = error instanceof RenderPolicyError ? error.problems : [error.message];
            for (const detail of details) problems.push(`ERROR: ${detail}`);
            continue;
        }
        const { text, blocks, policy } = context;

        const marker = PLACEHOLDER_MARKERS.find((m) => text.includes(m));
        if (marker) {
            problems.push(
                `ERROR: ${label} still contains the unfilled-template marker ${JSON.stringify(marker)} — ` +
                `fill real content and delete every [PLACEHOLDER]/[INSTRUCTION] note.`
            );
        }

        const shouty = text.match(ALLCAPS_PLACEHOLDER_RE);
        if (shouty) {
            const unique = [...new Set(shouty)].sort();
            const examples = unique.slice(0, 3).map((m) => m + "]").join(", ");
            problems.push(
                `ERROR: ${label} still has unfilled template placeholders (e.g. ${examples}) — ` +
                `replace every [SHOUTY_TOKEN] with real content before generating.`
            );
        }

        if (blocks.length === 0) {
            problems.push(
                `ERROR: ${label} has no slide blocks (need '## Slide N: slide_id' headings).`
            );
            continue;
        }

        for (const [slideId, body] of blocks) {
            const sid = slideId || "<unnamed>";
            seenIds[slideId] = (seenIds[slideId] || 0) + 1;

            const visualType = extractField(body, "VISUAL TYPE");
            const renderModeRaw = extractField(body, "RENDER MODE");
            const title = extractField(body, "TITLE");
            const kicker = extractField(body, "KICKER");

            if (policy && (!visualType || isBracketPlaceholder(visualType))) {
                problems.push(
                    `ERROR: slide ${JSON.stringify(sid)}: render policy requires a real VISUAL TYPE ` +
                    `to distinguish hero and content prompt contracts.`
                );
            }
            if (!policy && !visualType && !renderModeRaw) {
                problems.push(
                    `ERROR: slide ${JSON.stringify(sid)}: no VISUAL TYPE and no RENDER MODE — ` +
                    `legacy resolution would silently choose body+header-lock.`
                );
            }

            let mode = null;
            try {
                mode = determineRenderMode(slideId, visualType, renderModeRaw, policy).mode;
            } catch (error) {
                const details = error instanceof RenderPolicyError ? error.problems : [error.message];
                for (const detail of details) problems.push(`ERROR: ${detail}`);
            }

            // b) IMAGE PROMPT is mandatory and must be real (not an [instruction] stub).
            const prompt = getImagePrompt(body);
            if (prompt === null) {
                problems.push(`ERROR: slide ${JSON.stringify(sid)}: missing IMAGE PROMPT block.`);
            } else if (isBracketPlaceholder(prompt)) {
                problems.push(
                    `ERROR: slide ${JSON.stringify(sid)}: IMAGE PROMPT is still a placeholder (${prompt.slice(0, 40)}…) — ` +
                    `write the actual visual description.`
                );
            }

            // c) body+header-lock slides get their TITLE overlaid by Stage 3 — an empty
            //    OR placeholder TITLE draws a blank/garbage header band onto the image.
            const titleFilled = Boolean(presentHeaderText(title));
            if (mode === RENDER_MODE_BODY_HEADER_LOCK && !titleFilled) {
                problems.push(
                    `ERROR: slide ${JSON.stringify(sid)}: body+header-lock slide has no real TITLE — Stage 3 would ` +
                    `overlay an empty/placeholder header. Add a TITLE, or make it full-page.`
                );
            }

            // d) quality-layer warnings (do not block generation).
            if (mode === RENDER_MODE_FULL_PAGE && !isHeroVisualType(visualType) && !titleFilled) {
                problems.push(
                    `WARN: slide ${JSON.stringify(sid)}: content full-page slide has no real TITLE ` +
                    `(it would ship without a header title).`
                );
            }
            if (mode === RENDER_MODE_BODY_HEADER_LOCK && !presentHeaderText(kicker)) {
                problems.push(`WARN: slide ${JSON.stringify(sid)}: no real KICKER (header overlay will show the title alone).`);
            }
        }
    }

    for (const [sid, n] of Object.entries(seenIds)) {
        if (n > 1) {
            problems.push(`WARN: slide id ${JSON.stringify(sid)} appears ${n} times (duplicate ids are confusing to trace).`);
        }
    }

    return problems;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse one or more markdown files into slide plan and prompts.
 *
 * @param {string[]} mdPaths - Paths to markdown slide spec files.
 * @param {string} finalRules - Custom final rules from deck_system.txt (if available).
 *                              Falls back to hardcoded SYSTEM_FINAL_RULES if empty.
 * @returns {{ plan: object[], prompts: object[] }}
 * Legacy port of `parse_slides`.
 */
export function parseSlides(mdPaths, finalRules) {
    if (!finalRules) {
        finalRules = SYSTEM_FINAL_RULES;
    }

    const plan = [];
    const prompts = [];
    let seq = 1;

    for (const mdPath of mdPaths) {
        const context = readSpecContext(mdPath);
        const { text, blocks, policy } = context;

        // Novice guard: the file may still be the unfilled template (--init copies
        // it in with [PLACEHOLDER] markers and placeholder slide ids). Running the
        // pipeline on it would fail cryptically — say it in plain language instead.
        if (text.includes("[PLACEHOLDER") || text.includes("## Slide 01: `slide_id`") || text.includes("[slide_id]")) {
            throw new Error(
                `${mdPath} 看起来还是空模板(含 [PLACEHOLDER] 占位符)。\n` +
                `  请先填内容:打开它,把每张 slide 的 VISUAL TYPE / KICKER / TITLE / ` +
                `IMAGE PROMPT 换成你的真实内容(删掉所有 [PLACEHOLDER] 和 [INSTRUCTION] 注释),再跑管线。\n` +
                `  例子见 workflow/02-content/example-deck-brief-mini.md。`
            );
        }

        // Accept colon (:), full-width colon (：), hyphen (-), or em-dash (—) after slide number (with optional space)
        if (blocks.length === 0) {
            throw new Error(
                `${mdPath} 里没找到 slide 块(需要 '## Slide N: slide_id' 这样的标题)。\n` +
                `  如果这是新建的空文件,请按模板格式填入至少一张 slide。`
            );
        }

        for (const [slideId, body] of blocks) {
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

            const slideRecord = {
                id: slideId,
                visual_type: visualType,
            };
            if (kicker) slideRecord.kicker = kicker;
            if (headline) slideRecord.headline = headline;
            if (subtitle) {
                slideRecord.subtitle = subtitle;
            }

            slideRecord.layout_contract = buildLayoutContract(
                slideId, visualType, body, renderMode, policy
            );
            plan.push(slideRecord);

            const outName = `${String(seq).padStart(2, "0")}_${slideId}.png`;
            const fullPrompt = assemblePrompt(sourcePrompt, slideRecord, finalRules);
            prompts.push({ id: slideId, out: outName, prompt: fullPrompt });
            seq++;
        }
    }

    return { plan, prompts };
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
    };

    for (let i = 0; i < argv.length; i++) {
        switch (argv[i]) {
            case "--spec":
            case "--input":
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
                break;
        }
    }

    return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.input.length === 0) {
        console.error("Error: --spec is required (one or more markdown slide spec files)");
        console.error("Usage: node stage1_build_inputs.mjs --spec <path> [--spec <path2> ...] --out <dir> [--validate]");
        process.exit(1);
    }

    // L3 content gate — validate the spec contract BEFORE anything expensive.
    // Runs on every invocation (so unified_pipeline gets it for free), lists every
    // problem at once, and aborts on any ERROR. Structure gate: bundle_layout --check.
    const problems = validateSpecs(args.input);
    for (const w of problems.filter((p) => p.startsWith("WARN:"))) {
        console.log(`  ⚠  ${w.slice("WARN:".length).trim()}`);
    }
    const errors = problems.filter((p) => p.startsWith("ERROR:"));
    if (errors.length > 0) {
        console.log(`✗ slide-specs failed the content contract — ${errors.length} problem(s):`);
        for (const e of errors) {
            console.log(`  - ${e.slice("ERROR:".length).trim()}`);
        }
        console.log("  Fix these in slide-specifications.md, then rerun.");
        process.exit(1);
    }
    if (args.validate) {
        console.log(`✓ slide-specs pass the content contract (${args.input.length} file(s)).`);
        return;
    }

    if (!args.outDir) {
        console.error("Error: --out is required for generation (omit it only with --validate).");
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

    const { plan, prompts } = parseSlides(args.input, finalRules);

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
        JSON.stringify({ slides: plan }, null, 2) + "\n",
        "utf-8"
    );
    writeFileSync(
        promptsPath,
        JSON.stringify({ slides: prompts }, null, 2) + "\n",
        "utf-8"
    );

    // One human-readable prompt file per slide: NN_id.prompt.md (derived from `out`,
    // which is NN_id.png). This is the readable twin of the machine _prompts.json.
    for (const entry of prompts) {
        const stem = basename(entry.out, ".png"); // e.g. "01_s1_title"
        const mdPath = join(promptsDir, `${stem}.prompt.md`);
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
    console.log(`  per-slide:   ${promptsDir}/NN_id.prompt.md  (${prompts.length} files)`);

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
    main();
}
