#!/usr/bin/env node
/**
 * bundle_layout.mjs — THE SINGLE SOURCE OF TRUTH for the run-bundle directory structure.
 *
 * Everything that needs to know "where does X live in a run bundle" imports from here:
 * - the pipeline scripts (unified_pipeline.mjs) build every path from these constants;
 * - the docs are generated/validated against `renderTree()` so they can never drift.
 *
 * If you want to change the run-bundle layout, change it HERE and nowhere else. Do not
 * hardcode bundle paths in any other script or restate the tree by hand in any doc —
 * that is exactly the fragmentation this file exists to prevent.
 *
 * --------------------------------------------------------------------------------
 * The layout — a three-tier change-frequency gradient
 * --------------------------------------------------------------------------------
 *
 *     deck_<name>/                       the deck (one evolving entity)
 *     ├── deck-guide.md                  read-first control-flow doc (human + agent)
 *     ├── AGENTS.md                      agent-agnostic pointer to deck-guide.md
 *     ├── CLAUDE.md                      Claude pointer to deck-guide.md (auto-load)
 *     ├── project-metadata.yaml          topic / audience / language / north-star
 *     ├── _state/                        playbook execution progress (state.yaml; history.jsonl on demand)
 *     ├── _lessons/                      retained lessons after probe/overcome (read-before-guess; not secrets / not progress)
 *     │
 *     ├── 1_upstream_raw_material/       UPSTREAM  · raw research/material · shared · append-mostly
 *     │
 *     ├── 2_backbone/                    MIDSTREAM · 主干 / default source-of-truth · shared · stable
 *     │   ├── core-metaphor.md
 *     │   ├── core-formula.md
 *     │   ├── design-constraints.md
 *     │   ├── outline.md
 *     │   ├── manuscript/
 *     │   └── visual-style/
 *     │       ├── style-master-prompt.md   the prompt that GENERATES style_master
 *     │       ├── style_master.jpg
 *     │       ├── deck_system.txt
 *     │       └── color_palette.json
 *     │
 *     └── 3_versions/
 *         └── v1/                        DOWNSTREAM delta · one design iteration · --run-dir
 *             ├── slide-specifications.md  per-slide 4-layer specs (pipeline input)
 *             ├── overrides/               only what THIS version changes vs backbone
 *             │   └── visual-style/ · manuscript/
 *             ├── _generated/              GENERATED · never hand-edit · rm -rf & rerun
 *             └── _scratch/                THIS version temp/bak only · not SSOT · deletable
 *
 * Strictness gradient (constitutional): deck root strictest → mid tiers whitelist →
 * version leaf looser → _scratch internals loosest. Do not dump bak at deck root.
 *
 * Rules encoded here:
 * - A "version" (deck_<name>/3_versions/vN) is the DOWNSTREAM delta only. Create one
 *   with `--new-version`; it copies slide-specifications.md + overrides/ but never
 *   `_generated/` or `_scratch/` contents. Backbone & upstream are referenced, never copied.
 * - Override precedence: for any backbone asset, a version's overrides/<relpath> wins
 *   if present, else the backbone default is used (see resolveBackboneAsset).
 * - Deck name (for the .pptx) derives from the deck root dir, two levels above a version.
 *
 * Node.js ESM port — zero external dependencies. Zero external dependencies
 * bundle_layout.mjs. All constants, functions, and CLI modes preserved identically.
 */

import "../cli/cli_bootstrap.mjs?entry=shared/run-bundle/bundle_layout.mjs";
import {
    CLI_ERROR_CODES,
    createCliNext,
    emitCliError,
} from "../cli/cli_error.mjs";

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readState, writeState, setNodeStatus, createInitialState, STATE_DIR, STATE_FILE, STATE_DIR_README, statePath } from '../state/state.mjs';
import { inspectHtmlReviewReadiness as inspectHtmlReviewReadinessCore } from '../state/internal/html_review_evidence_core.mjs';
import { HTML_FIRST_PIPELINE, probeProductionMarker } from './production_marker.mjs';

// ---------------------------------------------------------------------------
// Self-location (self path resolution
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// --- Top-level bundle dirs (relative to deck_<name>/) ----------------------
// ---------------------------------------------------------------------------
export const UPSTREAM_DIR = '1_upstream_raw_material';
export const BACKBONE_DIR = '2_backbone';
export const VERSIONS_DIR = '3_versions';

export const GUIDE_FILE = 'deck-guide.md';
export const AGENT_POINTER_FILE = 'AGENTS.md';
export const POINTER_FILE = 'CLAUDE.md';
export const METADATA_FILE = 'project-metadata.yaml';

/** Deck-root self-retained lessons surface (agentic probe → overcome → retain). */
export const LESSONS_DIR = '_lessons';
export const LESSONS_IMAGE2_PROVEN = 'image2-proven.yaml';

/** Canonical README body for _lessons/ (Chinese, same voice as _state README). */
export const LESSONS_DIR_README = `\
# 自留教训 (_lessons)

**这里放什么:** 本 deck 在运作中**遇事自己琢磨、试探、克服**之后，值得下次复用的**非密钥**教训。下次 Agent/人进 deck：**先读这里再猜**，免得从头学一遍。禁止只把经验留在聊天里。

**闭环:** 试通或修好之后**必须留下**——这是 Agent workflow 的自留教训面，不是可选项。

**不放什么:** 密钥与生效凭据（→ \`.env\`）、playbook 执行进度（→ \`_state/\`）、上游素材、\`_generated/\` 产物、没有复用价值的一次性吐槽。

**谁读写:** Agent（编排器）和懂行的维护者。Framework 只定目录与规矩，不替各 deck 写具体教训。

**怎么写（规矩）:**
1. **一题一文** — 一件可复用的教训对应一个文件（\`.md\` 或 \`.yaml\`）
2. **文件名可扫读** — \`kebab-case\` + 主题（例：\`image2-proven.yaml\`、\`header-lock-font-path.md\`）；禁止 \`notes.md\` / \`tmp.md\`
3. **正文至少四问** — 遇到什么？怎么试的？结论是什么？下次先看哪？
4. **修好就留** — 试通/自愈成功后写条目；禁止「修好了只在聊天里说一声」
5. **禁止密钥** — 不得写入 API key / token / 密码；非密钥的 endpoint URL 可以写

**新建 .md 教训模板（复制粘贴用）:**
\`\`\`markdown
# <kebab-case-标题>

**遇到什么:**

**怎么试的:**

**结论:**

**下次先看哪:**
\`\`\`

**打个比方（不是目录清单）:** 配通出图 API、某页 render mode 踩坑后的结论——都可以各写一篇丢进来。

**禁止**把 API key 写入本目录。
`;

// ---------------------------------------------------------------------------
// --- Inside 2_backbone/ ----------------------------------------------------
// ---------------------------------------------------------------------------
export const BACKBONE_METAPHOR = 'core-metaphor.md';
export const BACKBONE_FORMULA = 'core-formula.md';
export const BACKBONE_CONSTRAINTS = 'design-constraints.md';
export const BACKBONE_OUTLINE = 'outline.md';
export const BACKBONE_MANUSCRIPT_SUBDIR = 'manuscript';
export const BACKBONE_STYLE_SUBDIR = 'visual-style';

// ---------------------------------------------------------------------------
// --- Inside 2_backbone/visual-style/ (or a version override of it) ---------
// ---------------------------------------------------------------------------
export const STYLE_MASTER_PROMPT = 'style-master-prompt.md';
export const STYLE_MASTER_IMAGE = 'style_master.jpg';
export const DECK_SYSTEM_FILE = 'deck_system.txt';
export const COLOR_PALETTE_FILE = 'color_palette.json';

// ---------------------------------------------------------------------------
// --- Inside 2_backbone/visual-style/assets/ (NEW — visual asset catalog) ---
// ---------------------------------------------------------------------------
export const BACKBONE_ASSETS_SUBDIR = 'assets';
export const ASSET_MANIFEST_FILE = 'asset-manifest.yaml';
export const ASSET_SVG_SUBDIR = 'svg';
export const ASSET_REFERENCE_SUBDIR = 'reference';
export const ASSET_ICONS_SUBDIR = 'icons';

// ---------------------------------------------------------------------------
// --- Inside a version dir (deck_<name>/3_versions/vN) ----------------------
// ---------------------------------------------------------------------------
export const SLIDE_SPECS_NAME = 'slide-specifications.md';
export const SLIDE_SPECS_GLOB = 'slide-specifications*.md';
export const OVERRIDES_SUBDIR = 'overrides';
export const GENERATED_SUBDIR = '_generated';
/** Version-local temp/bak outlet (upper-strict / lower-loose leaf). */
export const SCRATCH_SUBDIR = '_scratch';

export const VERSION_SUBDIRS = Object.freeze([
  OVERRIDES_SUBDIR,
  GENERATED_SUBDIR,
  SCRATCH_SUBDIR,
]);

/** Canonical README for version `_scratch/` (Chinese). */
export const SCRATCH_DIR_README = `\
# 本版临时区 (_scratch)

**宪章：上严下松。** run bundle **根最严**；越往下越松；这里是本版**最松**的官方出口。

**这里放什么:** 仅属**这一版**的临时拷贝——改 \`slide-specifications.md\` 前的 \`.bak\`、对照稿、一次性草稿。不是真相源，可随时删。

**不放什么 / 去哪放:**
| 东西 | 放哪 |
|------|------|
| style master 被拒轮次 | \`1_upstream_raw_material/style-master-iterations/\` |
| 管线产物 / pptx.backup | \`_generated/\` |
| 克服困难后的教训 | \`_lessons/\` |
| playbook 断点 | \`_state/\` |

**禁止:** 自创 \`_tmp/\` · \`backup/\` · \`_bak/\`；把 bak 丢到 **deck 根** 或 \`2_backbone/\`。
`;

/** Deck-root allowed names (strictest layer). Dotfiles handled by _ignorable. */
export const DECK_ROOT_ALLOWED = new Set([
  'deck-guide.md',
  'AGENTS.md',
  'CLAUDE.md',
  'project-metadata.yaml',
  'README.md',
  'MIGRATION.md',
  '.gitignore',
  '.env',
  '.env.example',
  UPSTREAM_DIR,
  BACKBONE_DIR,
  VERSIONS_DIR,
  STATE_DIR,
  LESSONS_DIR,
]);

// ---------------------------------------------------------------------------
// --- Inside a version's _generated/ ----------------------------------------
// ---------------------------------------------------------------------------
export const GEN_SLIDE_PLAN = 'slide_plan.json';
export const GEN_PROMPTS_SUBDIR = 'page_prompts';
export const GEN_PROMPTS_JSON = '_prompts.json';
export const GEN_IMAGES_SUBDIR = 'page_images_full';
export const GEN_HEADER_LOCKED_SUBDIR = 'header_locked';
export const GEN_PPT_SUBDIR = 'ppt';
export const GEN_QA_SUBDIR = 'qa';
export const GEN_PREVIEW_SUBDIR = 'preview';
export const GEN_HTML_PRODUCTION_SUBDIR = 'html_production';
export const GEN_HTML_PAGES_SUBDIR = 'html_pages';
export const GEN_HTML_FINAL_SLIDES_SUBDIR = 'final_slides';
export const GEN_HTML_PREVIEW_SUBDIR = 'preview';
export const IMAGE_TRACE_SUFFIX = '.image-task.json';

// ---------------------------------------------------------------------------
// --- CANONICAL STRUCTURE (the ONE data source) -----------------------------
// ---------------------------------------------------------------------------

export const BACKBONE_FILE_SEEDS = Object.freeze({
    [BACKBONE_METAPHOR]:    'workflow/01-content/template-core-metaphor.md',
    [BACKBONE_FORMULA]:     'workflow/01-content/template-core-formula.md',
    [BACKBONE_CONSTRAINTS]: 'workflow/01-content/template-design-constraints.md',
    [BACKBONE_OUTLINE]:     null,
});

export const BACKBONE_SUBDIRS = Object.freeze([BACKBONE_MANUSCRIPT_SUBDIR, BACKBONE_STYLE_SUBDIR]);
export const BACKBONE_OPTIONAL = new Set(['visual-style.md']);

export const VISUAL_STYLE_FILES = Object.freeze([
    STYLE_MASTER_PROMPT, STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE,
]);

export const VISUAL_STYLE_OPTIONAL = new Set([
    'visual-style.md',
    'style_master' + IMAGE_TRACE_SUFFIX,
]);

const _ALLOWED_IN_BACKBONE = new Set([
    ...Object.keys(BACKBONE_FILE_SEEDS),
    ...BACKBONE_SUBDIRS,
    ...BACKBONE_OPTIONAL,
    'README.md',
]);

const _ALLOWED_IN_VISUAL_STYLE = new Set([
    ...VISUAL_STYLE_FILES,
    ...VISUAL_STYLE_OPTIONAL,
    BACKBONE_ASSETS_SUBDIR,
    'README.md',
]);

const _ALLOWED_IN_ASSETS = new Set([
    ASSET_MANIFEST_FILE,
    ASSET_SVG_SUBDIR,
    ASSET_REFERENCE_SUBDIR,
    ASSET_ICONS_SUBDIR,
    'README.md',
]);

// ---------------------------------------------------------------------------
// --- PRESET CATALOGS (the ONE data source for --init preset seeding) -------
// ---------------------------------------------------------------------------

export const STYLE_PRESETS_DIR = 'workflow/02-visual-system/presets';
export const STYLE_PRESETS = Object.freeze([
    'clean-clinical', 'corporate-safe', 'dark-executive',
    'tech-startup', 'warm-editorial',
]);

export const STYLE_PRESET_FILES = Object.freeze([DECK_SYSTEM_FILE, COLOR_PALETTE_FILE]);

export const DECK_TYPE_DIR = 'workflow/01-content/presets/deck-type-templates';
export const DECK_TYPE_TEMPLATES = Object.freeze({
    keynote:  'keynote-template.md',
    pitch:    'pitch-deck-template.md',
    report:   'report-template.md',
    training: 'training-template.md',
});

// ---------------------------------------------------------------------------
// --- Path resolvers (import these; do not re-derive paths by hand) ---------
// ---------------------------------------------------------------------------

export function deckRoot(runDir) {
    return path.dirname(path.dirname(runDir));
}

export function backboneDir(runDir) {
    return path.join(deckRoot(runDir), BACKBONE_DIR);
}

export function resolveBackboneAsset(runDir, relpath) {
    const override = path.join(runDir, OVERRIDES_SUBDIR, relpath);
    if (fs.existsSync(override)) {
        return override;
    }
    return path.join(backboneDir(runDir), relpath);
}

export function styleAsset(runDir, filename) {
    return resolveBackboneAsset(runDir, `${BACKBONE_STYLE_SUBDIR}/${filename}`);
}

export function styleDir(runDir) {
    return resolveBackboneAsset(runDir, BACKBONE_STYLE_SUBDIR);
}

export function assetsDir(runDir) {
    return resolveBackboneAsset(runDir, `${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}`);
}

export function resolveAssetPath(runDir, relpath) {
    return resolveBackboneAsset(runDir, `${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}/${relpath}`);
}

export function generatedDir(runDir) {
    return path.join(runDir, GENERATED_SUBDIR);
}

export function findSlideSpecs(runDir) {
    if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) return null;
    const regex = _globToRegex(SLIDE_SPECS_GLOB);
    const matches = fs.readdirSync(runDir)
        .filter(f => regex.test(f) && fs.statSync(path.join(runDir, f)).isFile())
        .sort();
    return matches.length > 0 ? path.join(runDir, matches[0]) : null;
}

export function deckName(runDir) {
    return path.basename(deckRoot(runDir)).replace('deck_', '');
}

export function isVersionDir(runDir) {
    const parentName = path.basename(path.dirname(runDir));
    return (
        parentName === VERSIONS_DIR
        && /^v\d+$/.test(path.basename(runDir))
        && path.basename(deckRoot(runDir)).startsWith('deck_')
    );
}

// ---------------------------------------------------------------------------
// --- Credentials: load .env so key + base URL reach the pipeline -----------
// ---------------------------------------------------------------------------

export function loadDotenv(...searchDirs) {
    for (const d of searchDirs) {
        const envFile = path.join(d, '.env');
        if (!fs.existsSync(envFile) || !fs.statSync(envFile).isFile()) continue;

        const content = fs.readFileSync(envFile, 'utf-8');
        for (let raw of content.split('\n')) {
            let line = raw.trim();
            if (!line || line.startsWith('#') || !line.includes('=')) continue;
            if (line.startsWith('export ')) {
                line = line.slice('export '.length);
            }
            const eqIdx = line.indexOf('=');
            const key = line.slice(0, eqIdx).trim();
            let val = line.slice(eqIdx + 1).trim();
            val = val.replace(/^["']|["']$/g, '');
            if (key && !(key in process.env)) {
                process.env[key] = val;
            }
        }
        return envFile;
    }
    return null;
}

// ---------------------------------------------------------------------------
// --- Constitution enforcer -------------------------------------------------
// ---------------------------------------------------------------------------

function _ignorable(name) {
    return name.startsWith('.') || name === '__pycache__';
}

/**
 * Normalize checkBundle readiness mode.
 * @param {boolean|string} [mode=true]
 * @returns {'structure'|'preview'|'pipeline'}
 */
export function normalizeCheckMode(mode = true) {
    if (mode === false || mode === 'structure') return 'structure';
    if (mode === 'preview') return 'preview';
    if (mode === true || mode === 'pipeline') return 'pipeline';
    throw new Error(
        `checkBundle mode must be structure|preview|pipeline or boolean; got: ${mode}`);
}

function htmlReviewTrustedContext(runDir) {
    const run = path.resolve(runDir);
    const root = deckRoot(run);
    const production = path.join(run, GENERATED_SUBDIR, GEN_HTML_PRODUCTION_SUBDIR);
    const names = { 'html-pages': GEN_HTML_PAGES_SUBDIR, 'final-slides': GEN_HTML_FINAL_SLIDES_SUBDIR, preview: GEN_HTML_PREVIEW_SUBDIR };
    return Object.freeze({
        schema: 'pptmaker-html-review-trusted-context-v1',
        run,
        root,
        metadataFile: path.join(root, METADATA_FILE),
        planPath: path.join(run, GENERATED_SUBDIR, GEN_SLIDE_PLAN),
        htmlProductionRoot: production,
        htmlOwnerRoot(ownerKind) {
            if (!names[ownerKind]) throw new Error(`unsupported HTML owner kind ${ownerKind}`);
            return path.join(production, names[ownerKind]);
        },
    });
}

const _HTML_OWNER_NAMES = new Set([GEN_HTML_PAGES_SUBDIR, GEN_HTML_FINAL_SLIDES_SUBDIR, GEN_HTML_PREVIEW_SUBDIR]);
const _SHA_OBJECT_RE = /^[0-9a-f]{64}\.(?:html|png)$/;
const _HTML_OBJECT_TEMP_RE = /^\.object\.[0-9a-f]{64}\.[0-9a-f]{64}\.[a-z0-9]+\.tmp$/;
const _HTML_MANIFEST_TEMP_RE = /^\.manifest\.[0-9a-f]{64}\.tmp$/;
const _HTML_PLAN_RE = /^[0-9a-f]{64}\.json$/;

function _checkHtmlOwnerTree(ownerPath, ownerName, problems) {
    const allowed = ownerName === GEN_HTML_PREVIEW_SUBDIR
        ? new Set(['objects', 'plans', 'manifest.json', '.publish.lock'])
        : new Set(['objects', 'manifest.json', '.publish.lock']);
    for (const entry of fs.readdirSync(ownerPath, { withFileTypes: true })) {
        if (allowed.has(entry.name) || _HTML_MANIFEST_TEMP_RE.test(entry.name)) continue;
        problems.push(`unexpected '${entry.name}' in HTML production owner ${ownerName}/`);
    }
    const objects = path.join(ownerPath, 'objects');
    if (fs.existsSync(objects) && fs.statSync(objects).isDirectory()) {
        for (const entry of fs.readdirSync(objects, { withFileTypes: true })) {
            if (_SHA_OBJECT_RE.test(entry.name) || _HTML_OBJECT_TEMP_RE.test(entry.name)) continue;
            problems.push(`unexpected '${entry.name}' in HTML immutable objects for ${ownerName}/`);
        }
    }
    const lock = path.join(ownerPath, '.publish.lock');
    if (fs.existsSync(lock) && fs.statSync(lock).isDirectory()) {
        for (const entry of fs.readdirSync(lock, { withFileTypes: true })) {
            if (entry.name !== 'owner.json') problems.push(`unexpected '${entry.name}' in HTML publish lock for ${ownerName}/`);
        }
    }
    const plans = path.join(ownerPath, 'plans');
    if (ownerName === GEN_HTML_PREVIEW_SUBDIR && fs.existsSync(plans) && fs.statSync(plans).isDirectory()) {
        for (const entry of fs.readdirSync(plans, { withFileTypes: true })) {
            if (!_HTML_PLAN_RE.test(entry.name)) problems.push(`unexpected '${entry.name}' in HTML preview plans/`);
        }
    }
}

function _checkHtmlGeneratedTopology(runDir, problems) {
    const generated = path.join(runDir, GENERATED_SUBDIR);
    const production = path.join(generated, GEN_HTML_PRODUCTION_SUBDIR);
    if (fs.existsSync(production) && fs.statSync(production).isDirectory()) {
        for (const entry of fs.readdirSync(production, { withFileTypes: true })) {
            if (!_HTML_OWNER_NAMES.has(entry.name)) problems.push(`unexpected '${entry.name}' in HTML production root`);
        }
        for (const ownerName of _HTML_OWNER_NAMES) {
            const ownerPath = path.join(production, ownerName);
            if (fs.existsSync(ownerPath) && fs.statSync(ownerPath).isDirectory()) _checkHtmlOwnerTree(ownerPath, ownerName, problems);
        }
    }
    const migration = path.join(runDir, SCRATCH_SUBDIR, 'html-migration');
    if (fs.existsSync(migration) && fs.statSync(migration).isDirectory()) {
        const allowed = new Set(['slide-specifications.md', 'overrides', 'projected-run', 'plan.json', 'apply-journal.json']);
        for (const entry of fs.readdirSync(migration, { withFileTypes: true })) {
            if (!allowed.has(entry.name)) problems.push(`unexpected '${entry.name}' in html-migration scratch/`);
        }
    }
}

function _checkPipelineGeneratedOwnership(runDir, htmlFirst, problems) {
    const generated = path.join(runDir, GENERATED_SUBDIR);
    if (!fs.existsSync(generated) || !fs.statSync(generated).isDirectory()) return;
    if (htmlFirst) {
        for (const name of [GEN_PROMPTS_SUBDIR, GEN_IMAGES_SUBDIR, GEN_HEADER_LOCKED_SUBDIR, GEN_PREVIEW_SUBDIR]) {
            const candidate = path.join(generated, name);
            if (fs.existsSync(candidate)) {
                problems.push(`legacy generated owner '${name}/' is inapplicable to ${HTML_FIRST_PIPELINE}`);
            }
        }
        return;
    }
    const htmlOwner = path.join(generated, GEN_HTML_PRODUCTION_SUBDIR);
    if (fs.existsSync(htmlOwner)) {
        problems.push(`HTML generated owner '${GEN_HTML_PRODUCTION_SUBDIR}/' is inapplicable to markerless legacy production`);
    }
}

/**
 * Validate a version dir against the run-bundle constitution.
 * @param {string} runDir
 * @param {boolean|string} [requirePipelineReady=true] - `true`/`'pipeline'`,
 *   `'preview'` (style master, no gates), or `false`/`'structure'`.
 * @returns {string[]}
 */
export function checkBundle(runDir, requirePipelineReady = true) {
    const mode = normalizeCheckMode(requirePipelineReady);
    const problems = [];

    if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
        return [`run dir not found: ${runDir}`];
    }

    if (!isVersionDir(runDir)) {
        problems.push(
            `--run-dir must be a version dir inside ${VERSIONS_DIR}/ ` +
            `(e.g. deck_x/${VERSIONS_DIR}/v1); got: ${runDir}`);
        return problems;
    }

    const root = deckRoot(runDir);
    const canonicalSource = path.join(runDir, SLIDE_SPECS_NAME);
    const sourceCandidate = fs.existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(runDir);
    let htmlFirst = false;
    let branchValid = true;
    if (sourceCandidate) {
        const marker = probeProductionMarker(fs.readFileSync(sourceCandidate), { source: path.basename(sourceCandidate) });
        if (marker.branch === 'invalid') {
            branchValid = false;
            for (const entry of marker.issues) problems.push(`invalid production marker: ${entry.message}`);
        } else {
            htmlFirst = marker.branch === HTML_FIRST_PIPELINE;
            if (htmlFirst && sourceCandidate !== canonicalSource) {
                problems.push(`HTML-first requires exact canonical source ${SLIDE_SPECS_NAME}; found ${path.basename(sourceCandidate)}`);
            }
        }
    }
    const needStyle = branchValid && !htmlFirst && (mode === 'preview' || mode === 'pipeline');
    const needGates = branchValid && !htmlFirst && mode === 'pipeline';

    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (_ignorable(entry.name)) continue;
        if (!DECK_ROOT_ALLOWED.has(entry.name)) {
            problems.push(
                `unexpected '${entry.name}' at deck root — root is the strictest layer (上严下松). ` +
                `Allowed: ${[...DECK_ROOT_ALLOWED].sort().join(', ')}. ` +
                `Version temp/bak → ${VERSIONS_DIR}/v{n}/${SCRATCH_SUBDIR}/; do not litter the deck root.`
            );
        }
    }

    for (const requiredFile of [GUIDE_FILE, POINTER_FILE, METADATA_FILE]) {
        const fp = path.join(root, requiredFile);
        if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
            problems.push(`missing deck root control file: ${requiredFile}`);
        }
    }
    const upstreamPath = path.join(root, UPSTREAM_DIR);
    if (!fs.existsSync(upstreamPath) || !fs.statSync(upstreamPath).isDirectory()) {
        problems.push(`missing shared upstream dir: ${UPSTREAM_DIR}/`);
    }

    const bbPath = path.join(root, BACKBONE_DIR);
    if (!fs.existsSync(bbPath) || !fs.statSync(bbPath).isDirectory()) {
        problems.push(`missing shared midstream dir: ${BACKBONE_DIR}/ (at deck root ${root})`);
    }
    const vsPath = path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
    if (!fs.existsSync(vsPath) || !fs.statSync(vsPath).isDirectory()) {
        problems.push(
            `missing canonical ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ dir ` +
            `(check spelling — it must be exactly '${BACKBONE_STYLE_SUBDIR}')`);
    }
    if (needStyle && !fs.existsSync(styleAsset(runDir, STYLE_MASTER_IMAGE))) {
        problems.push(
            `missing ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${STYLE_MASTER_IMAGE} ` +
            `(Phase-2 output; generate it before running the pipeline, or add a version override)`);
    }
    if (needGates) {
        const metadataPath = path.join(root, METADATA_FILE);
        if (fs.existsSync(metadataPath) && fs.statSync(metadataPath).isFile()) {
            const fields = {};
            for (const line of fs.readFileSync(metadataPath, 'utf-8').split('\n')) {
                if (line.includes(':') && !line.trimStart().startsWith('#')) {
                    const colonIdx = line.indexOf(':');
                    const k = line.slice(0, colonIdx).trim();
                    const v = line.slice(colonIdx + 1).trim().toLowerCase();
                    fields[k] = v;
                }
            }
            for (const gate of ['content_gate', 'visual_gate']) {
                if (fields[gate] !== 'approved' && fields[gate] !== 'waived') {
                    problems.push(
                        `${gate} is not approved/waived in ${METADATA_FILE} ` +
                        `(record approved after confirmation, or waived if the user explicitly skips)`);
                }
            }
        }
    }

    if (!findSlideSpecs(runDir)) {
        problems.push(`missing ${SLIDE_SPECS_GLOB} in the version dir ${runDir}`);
    }

    for (const entry of fs.readdirSync(runDir, { withFileTypes: true })) {
        const name = entry.name;
        if (_ignorable(name)) continue;
        const isSlideSpec = entry.isFile() && name.startsWith('slide-specifications') && name.endsWith('.md');
        if (
            isSlideSpec ||
            name === OVERRIDES_SUBDIR ||
            name === GENERATED_SUBDIR ||
            name === SCRATCH_SUBDIR ||
            name === 'README.md'
        ) {
            continue;
        }
        problems.push(
            `unexpected '${name}' at version root — not part of the canonical structure. ` +
            `A version holds only: slide-specifications.md, ${OVERRIDES_SUBDIR}/, ` +
            `${GENERATED_SUBDIR}/, ${SCRATCH_SUBDIR}/, README.md. Sources live in ${BACKBONE_DIR}/ (deck root); ` +
            `temp/bak → ${SCRATCH_SUBDIR}/; generated → ${GENERATED_SUBDIR}/. Do not improvise.`);
    }

    if (fs.existsSync(bbPath) && fs.statSync(bbPath).isDirectory()) {
        for (const entry of fs.readdirSync(bbPath, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!_ALLOWED_IN_BACKBONE.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${BACKBONE_DIR}/ — not canonical. ` +
                    `Allowed: ${[..._ALLOWED_IN_BACKBONE].sort().join(', ')}`);
            }
        }
    }

    if (fs.existsSync(vsPath) && fs.statSync(vsPath).isDirectory()) {
        for (const entry of fs.readdirSync(vsPath, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!_ALLOWED_IN_VISUAL_STYLE.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ — ` +
                    `not canonical. Allowed: ${[..._ALLOWED_IN_VISUAL_STYLE].sort().join(', ')}`);
            }
        }
        // Validate assets/ subdirectory contents if present (optional infrastructure)
        const assetsPath = path.join(vsPath, BACKBONE_ASSETS_SUBDIR);
        if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory()) {
            for (const entry of fs.readdirSync(assetsPath, { withFileTypes: true })) {
                if (_ignorable(entry.name)) continue;
                if (!_ALLOWED_IN_ASSETS.has(entry.name)) {
                    problems.push(
                        `unexpected '${entry.name}' in ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}/ — ` +
                        `not canonical. Allowed: ${[..._ALLOWED_IN_ASSETS].sort().join(', ')}`);
                }
            }
        }
    }

    const overridesPath = path.join(runDir, OVERRIDES_SUBDIR);
    if (fs.existsSync(overridesPath) && fs.statSync(overridesPath).isDirectory()) {
        const allowedOverrideRoots = new Set([BACKBONE_STYLE_SUBDIR, BACKBONE_MANUSCRIPT_SUBDIR, 'README.md']);
        for (const entry of fs.readdirSync(overridesPath, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!allowedOverrideRoots.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${OVERRIDES_SUBDIR}/ — allowed categories: ` +
                    `${[...allowedOverrideRoots].sort().join(', ')}`);
            }
        }
        const overrideStyle = path.join(overridesPath, BACKBONE_STYLE_SUBDIR);
        if (fs.existsSync(overrideStyle) && fs.statSync(overrideStyle).isDirectory()) {
            for (const entry of fs.readdirSync(overrideStyle, { withFileTypes: true })) {
                if (_ignorable(entry.name)) continue;
                if (!_ALLOWED_IN_VISUAL_STYLE.has(entry.name)) {
                    problems.push(
                        `unexpected '${entry.name}' in ${OVERRIDES_SUBDIR}/${BACKBONE_STYLE_SUBDIR}/ — ` +
                        `not a canonical visual-style asset`);
                }
            }
            const overrideAssets = path.join(overrideStyle, BACKBONE_ASSETS_SUBDIR);
            if (fs.existsSync(overrideAssets) && fs.statSync(overrideAssets).isDirectory()) {
                for (const entry of fs.readdirSync(overrideAssets, { withFileTypes: true })) {
                    if (_ignorable(entry.name)) continue;
                    if (!_ALLOWED_IN_ASSETS.has(entry.name)) {
                        problems.push(
                            `unexpected '${entry.name}' in ${OVERRIDES_SUBDIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}/ — ` +
                            `not canonical. Allowed: ${[..._ALLOWED_IN_ASSETS].sort().join(', ')}`);
                    }
                }
            }
        }
    }

    _checkPipelineGeneratedOwnership(runDir, htmlFirst, problems);
    if (htmlFirst) _checkHtmlGeneratedTopology(runDir, problems);
    if (htmlFirst && mode === 'pipeline') {
        try {
            const readiness = inspectHtmlReviewReadinessCore(htmlReviewTrustedContext(runDir));
            if (!readiness.ready) problems.push(`HTML review readiness is blocked: ${readiness.reason}`);
        } catch (error) {
            problems.push(`HTML review readiness is invalid: ${error.message}`);
        }
    }

    return problems;
}

// ---------------------------------------------------------------------------
// --- Version creation ------------------------------------------------------
// ---------------------------------------------------------------------------

function _copyTree(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            _copyTree(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function _seedCleanVersion(sourceRunDir, target, versionName) {
    const specs = findSlideSpecs(sourceRunDir);
    if (specs === null) {
        throw new Error(`missing ${SLIDE_SPECS_NAME} in ${sourceRunDir}`);
    }
    fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(specs, path.join(target, SLIDE_SPECS_NAME));

    const sourceOverrides = path.join(sourceRunDir, OVERRIDES_SUBDIR);
    const targetOverrides = path.join(target, OVERRIDES_SUBDIR);
    if (fs.existsSync(sourceOverrides) && fs.statSync(sourceOverrides).isDirectory()) {
        _copyTree(sourceOverrides, targetOverrides);
    } else {
        fs.mkdirSync(targetOverrides, { recursive: true });
    }

    const generated = path.join(target, GENERATED_SUBDIR);
    fs.mkdirSync(generated, { recursive: true });
    _writeIfAbsent(
        path.join(generated, 'README.md'),
        '# 派生品(_generated)——别手改\n\n' +
        '这是一个干净的新版本。管线产物会在首次运行时写到这里。\n');
    const scratch = path.join(target, SCRATCH_SUBDIR);
    fs.mkdirSync(scratch, { recursive: true });
    _writeIfAbsent(path.join(scratch, 'README.md'), SCRATCH_DIR_README);
    _writeIfAbsent(
        path.join(target, 'README.md'),
        `# 这一版(${versionName})\n\n` +
        `源自 \`${path.basename(sourceRunDir)}\`，只复制了 \`${SLIDE_SPECS_NAME}\` + \`${OVERRIDES_SUBDIR}/\`。\n` +
        `\`${GENERATED_SUBDIR}/\` 与 \`${SCRATCH_SUBDIR}/\` 是干净的（旧版临时 bak 不拷贝）。\n` +
        `临时/备份只放 \`${SCRATCH_SUBDIR}/\`（上严下松）。\n`);
}

export function nextVersionName(sourceRunDir) {
    sourceRunDir = path.resolve(sourceRunDir);
    const numbers = [];
    const parentDir = path.dirname(sourceRunDir);
    if (fs.existsSync(parentDir)) {
        for (const child of fs.readdirSync(parentDir, { withFileTypes: true })) {
            if (!child.isDirectory()) continue;
            const match = child.name.match(/^v(\d+)$/);
            if (match) numbers.push(parseInt(match[1], 10));
        }
    }
    return `v${Math.max(0, ...numbers) + 1}`;
}

export function createVersion(sourceRunDir, versionName = null) {
    sourceRunDir = path.resolve(sourceRunDir);
    if (!isVersionDir(sourceRunDir)) {
        throw new Error(
            `source must be a version dir inside ${VERSIONS_DIR}/ (got ${sourceRunDir})`);
    }

    if (versionName === null) {
        versionName = nextVersionName(sourceRunDir);
    }
    if (!/^v\d+$/.test(versionName)) {
        throw new Error(`version name must look like v2, v3, ... (got ${JSON.stringify(versionName)})`);
    }

    const target = path.join(path.dirname(sourceRunDir), versionName);
    if (fs.existsSync(target)) {
        throw new Error(`target version already exists: ${target}`);
    }

    _seedCleanVersion(sourceRunDir, target, versionName);
    return target;
}

export function checkStagedVersion(stagingRunDir) {
    const problems = [];
    const requiredDirs = [OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR];
    const source = path.join(stagingRunDir, SLIDE_SPECS_NAME);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        problems.push(`missing staged ${SLIDE_SPECS_NAME}`);
    }
    for (const name of requiredDirs) {
        const target = path.join(stagingRunDir, name);
        if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
            problems.push(`missing staged ${name}/`);
        }
    }
    for (const name of [GENERATED_SUBDIR, SCRATCH_SUBDIR]) {
        const target = path.join(stagingRunDir, name);
        if (!fs.existsSync(target)) continue;
        const unexpected = fs.readdirSync(target).filter((entry) => entry !== 'README.md' && !_ignorable(entry));
        if (unexpected.length > 0) problems.push(`staged ${name}/ is not clean: ${unexpected.join(', ')}`);
    }
    const allowed = new Set([SLIDE_SPECS_NAME, OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR, 'README.md']);
    if (fs.existsSync(stagingRunDir)) {
        for (const entry of fs.readdirSync(stagingRunDir, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!allowed.has(entry.name)) problems.push(`unexpected staged version entry ${entry.name}`);
        }
    }
    return problems;
}

/**
 * Publish a transformed source as one clean visible version. Reservation and
 * staging are hidden siblings owned by one invocation token; visible target is
 * created only by the final same-parent rename.
 */
export function publishStructuralVersion({
    sourceRunDir,
    versionName,
    transformedSource,
    expectedSourceSha256 = null,
    validateSource = null,
}) {
    sourceRunDir = path.resolve(sourceRunDir);
    if (!isVersionDir(sourceRunDir)) {
        throw new Error(`source must be a version dir inside ${VERSIONS_DIR}/ (got ${sourceRunDir})`);
    }
    const sourceStructureIssues = checkBundle(sourceRunDir, false);
    if (sourceStructureIssues.length > 0) {
        throw new Error(`source version is invalid: ${sourceStructureIssues.join('; ')}`);
    }
    if (!/^v\d+$/.test(String(versionName || ''))) {
        throw new Error(`version name must look like v2, v3, ... (got ${JSON.stringify(versionName)})`);
    }
    const parent = path.dirname(sourceRunDir);
    const target = path.join(parent, versionName);
    if (fs.existsSync(target)) throw new Error(`target version already exists: ${target}; obtain a fresh preview`);

    const owner = randomUUID();
    const reservation = path.join(parent, `.${versionName}.reservation`);
    const staging = path.join(parent, `.${versionName}.staging-${owner}`);
    let reservationOwned = false;
    let stagingOwned = false;
    let targetOwned = false;
    try {
        fs.mkdirSync(reservation, { recursive: false });
        reservationOwned = true;
        fs.writeFileSync(path.join(reservation, 'owner'), owner, { flag: 'wx' });
        if (fs.existsSync(target)) throw new Error(`target version appeared before staging: ${target}; obtain a fresh preview`);
        if (expectedSourceSha256) {
            const currentSource = findSlideSpecs(sourceRunDir);
            const currentHash = currentSource
                ? createHash('sha256').update(fs.readFileSync(currentSource)).digest('hex')
                : null;
            if (currentHash !== expectedSourceSha256) {
                throw new Error('source changed after preview; obtain a fresh preview');
            }
        }
        fs.mkdirSync(staging, { recursive: false });
        stagingOwned = true;
        _seedCleanVersion(sourceRunDir, staging, versionName);
        const stagedSource = path.join(staging, SLIDE_SPECS_NAME);
        fs.writeFileSync(stagedSource, String(transformedSource), 'utf8');

        const structureIssues = checkStagedVersion(staging);
        if (structureIssues.length > 0) {
            throw new Error(`staged structural version is invalid: ${structureIssues.join('; ')}`);
        }
        if (typeof validateSource === 'function') {
            const validation = validateSource({ stagingRunDir: staging, sourcePath: stagedSource });
            const issues = Array.isArray(validation) ? validation : validation?.issues || [];
            if (issues.length > 0) throw new Error(`staged slide source is invalid: ${issues.map((issue) => issue.message || issue).join('; ')}`);
        }
        if (fs.readFileSync(path.join(reservation, 'owner'), 'utf8') !== owner) {
            throw new Error(`target reservation ownership changed: ${reservation}`);
        }
        if (fs.existsSync(target)) throw new Error(`target version appeared before publication: ${target}; obtain a fresh preview`);
        fs.renameSync(staging, target);
        stagingOwned = false;
        targetOwned = true;
        const publishedIssues = checkBundle(target, false);
        if (publishedIssues.length > 0) {
            throw new Error(`published structural version is invalid: ${publishedIssues.join('; ')}`);
        }
        fs.rmSync(reservation, { recursive: true, force: true });
        reservationOwned = false;
        targetOwned = false;
        return { source: sourceRunDir, target, version_name: versionName, published: true };
    } catch (error) {
        if (stagingOwned) fs.rmSync(staging, { recursive: true, force: true });
        if (targetOwned) fs.rmSync(target, { recursive: true, force: true });
        if (reservationOwned) {
            try {
                const recorded = fs.readFileSync(path.join(reservation, 'owner'), 'utf8');
                if (recorded === owner) fs.rmSync(reservation, { recursive: true, force: true });
            } catch {
                // A reservation that cannot be proven owned is intentionally retained.
            }
        }
        throw error;
    }
}

// ---------------------------------------------------------------------------
// --- Scaffolder ------------------------------------------------------------
// ---------------------------------------------------------------------------

function _writeIfAbsent(filePath, content) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

const _HTML_FIRST_SEEDS = Object.freeze({
    generic: Object.freeze({ id: 'DeckGo', title: 'State the deck\'s governing idea', visualType: 'Hero statement' }),
    keynote: Object.freeze({ id: 'KeyGo', title: 'State the keynote\'s consequential idea', visualType: 'Keynote opener' }),
    pitch: Object.freeze({ id: 'AskGo', title: 'State the venture\'s memorable promise', visualType: 'Pitch opener' }),
    report: Object.freeze({ id: 'FindGo', title: 'State the report\'s decision-ready finding', visualType: 'Report opener' }),
    training: Object.freeze({ id: 'TryNow', title: 'State the capability learners will gain', visualType: 'Training opener' }),
});

const _HTML_FIRST_ASSETS_README = `# HTML-first visual assets

Register optional local assets in \`asset-manifest.yaml\` schema v2 with a stable ID, confined relative path, kind, and exact SHA-256.

- \`svg/\` stores passive SVG assets.
- \`reference/\` stores registered PNG/JPEG/WebP assets.
- \`icons/\` stores registered typed-block icons.

Bind registered IDs from structured slide YAML through \`primary_visual.fallback\` or a typed block's \`icon\` field. Do not add legacy \`VISUAL ASSETS\` fields. An empty catalog is valid.
`;

function _htmlFirstSeedSource(deckType = null) {
    const seed = _HTML_FIRST_SEEDS[deckType || 'generic'];
    return `---
production:
  pipeline: html-first-v1
identity:
  scheme: mnemonic-v1
---

## Slide 01: \`${seed.id}\`

**VISUAL TYPE**: ${seed.visualType}
**TITLE**: ${seed.title}
**CONCEPT**:
- **MUST communicate**: Replace this starter with one clear, reviewable claim.
- **MUST NOT**: Add arbitrary HTML, CSS, coordinates, or legacy image prompts.

**SLIDE BODY**:
\`\`\`yaml
schema_version: 1
family: hero
\`\`\`
`;
}

// This is intentionally opt-in until Task 4.9 activates HTML-first defaults.
export function initHtmlFirstBundle(deckDir, frameworkDir = null, deckType = null, style = null) {
    const created = initBundle(deckDir, frameworkDir, deckType, null);
    if (style !== null) {
        if (!STYLE_PRESETS.includes(style)) throw new Error(`unknown style preset ${JSON.stringify(style)}`);
        const root = frameworkDir || path.resolve(__dirname, '..', '..', '..');
        const palette = path.join(root, STYLE_PRESETS_DIR, style, COLOR_PALETTE_FILE);
        if (!fs.existsSync(palette)) throw new Error(`HTML-first style preset is missing ${COLOR_PALETTE_FILE}`);
        fs.copyFileSync(palette, path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, COLOR_PALETTE_FILE));
    }
    fs.writeFileSync(path.join(deckDir, VERSIONS_DIR, 'v1', SLIDE_SPECS_NAME), _htmlFirstSeedSource(deckType), 'utf8');
    fs.writeFileSync(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE),
        'version: 2\nassets: {}\n',
        'utf8'
    );
    fs.writeFileSync(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, BACKBONE_ASSETS_SUBDIR, 'README.md'),
        _HTML_FIRST_ASSETS_README,
        'utf8'
    );
    const metadataPath = path.join(deckDir, METADATA_FILE);
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace(/\s*$/, '\n');
    fs.writeFileSync(
        metadataPath,
        `${metadata}` +
        '# HTML fields below are status mirrors only; authoritative review evidence lives in _state.\n' +
        'html_content_gate: pending\n' +
        'html_content_gate_run_version: v1\n' +
        'html_visual_gate: pending\n' +
        'html_visual_gate_run_version: v1\n',
        'utf8'
    );
    const state = readState(deckDir);
    state.pipeline = 'html-first-v1';
    state.gates.html_content = 'pending';
    state.gates.html_content_run_version = 'v1';
    state.gates.html_visual = 'pending';
    state.gates.html_visual_run_version = 'v1';
    delete state.nodes['html-production-reset'];
    writeState(deckDir, state);
    return [...created, `html-first seed: ${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}`];
}

// Explicit compatibility scaffold for tests/maintenance of markerless
// historical decks. New callers should use initBundle, which is HTML-first.
export function initLegacyBundle(deckDir, frameworkDir = null, deckType = null, style = null) {
    const created = initBundle(deckDir, frameworkDir, deckType, style);
    const state = readState(deckDir, { purpose: 'execute' });
    state.pipeline = 'legacy-image2-first';
    state.gates = { content: state.gates?.content || 'pending', visual: state.gates?.visual || 'pending' };
    writeState(deckDir, state);
    const dest = path.join(deckDir, VERSIONS_DIR, 'v1', SLIDE_SPECS_NAME);
    const legacySource = [
        '---',
        'render:',
        '  default: full-page',
        '  header-lock: []',
        '---',
        '',
        '# Legacy compatibility source',
        '# Replace this placeholder through the legacy controller before production.',
        '',
    ].join('\n');
    fs.writeFileSync(dest, legacySource, 'utf8');
    return [...created, 'legacy-image2-first compatibility scaffold'];
}

const _DIR_READMES = {
    '.': (
        '# {NAME} — 这个 PPT 项目\n\n' +
        '先读 **deck-guide.md**（进来先看那个）。\n\n' +
        '**上严下松（structure gradient）：** deck 根最严；临时/`.bak` 往下沉，' +
        '只放 `3_versions/v{n}/_scratch/`——别丢到根、别自创 `_tmp/`/`backup/`。' +
        '不知往哪放 → GREP → `PPTMAKER_FRAMEWORK/reference/glossary.md` Where Map。\n\n' +
        '这个文件夹分三层 + 执行状态 + 自留教训 + 版本临时:\n' +
        '- `1_upstream_raw_material/` — 原始素材、调研(你往里堆资料)\n' +
        '- `2_backbone/` — 主干:隐喻/公式/约束/大纲/讲稿/视觉(整个 deck 共享)\n' +
        '- `3_versions/` — 每个版本(你实际改 slide、生成 PPT 的地方)\n' +
        '  - 每版还有 `_generated/`（派生）和 `_scratch/`（本版临时/bak）\n' +
        '- `_state/` — playbook 执行进度（`state.yaml`；见里面的 README）\n' +
        '- `_lessons/` — 遇事克服后留下的**非密钥**教训（先读再猜；见里面的 README）\n\n' +
        '**只改带 README 说\'你改这里\'的文件。** 结构由 ' +
        '`PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` 定义,别自己新建目录。\n'
    ),
    [STATE_DIR]: STATE_DIR_README,
    [LESSONS_DIR]: LESSONS_DIR_README,
    [UPSTREAM_DIR]: (
        '# 上游:原始素材\n\n' +
        '**这里放什么:** 你的调研、参考资料、事实来源——任何「喂养」这个 deck 的原料。\n' +
        '写着写着发现缺了什么,就往这里补。全版本共享,只增不减。\n\n' +
        '**你做什么:** 往里堆资料(markdown、笔记都行)。怎么分子目录随你。\n'
    ),
    [BACKBONE_DIR]: (
        '# 中游:主干(backbone)\n\n' +
        '**这里放什么:** 整个 deck 的骨架,全版本共享的「默认事实源」:\n' +
        '- `core-metaphor.md` — 核心隐喻\n' +
        '- `core-formula.md` — 核心公式\n' +
        '- `design-constraints.md` — 设计约束(语言/禁忌/文字密度)\n' +
        '- `outline.md` — 大纲主干\n' +
        '- `manuscript/` — 讲稿主干\n' +
        '- `visual-style/` — 视觉主干(见里面的 README)\n\n' +
        '**你做什么:** 改这里 = 影响所有版本。想只改某一版,去那一版的 `overrides/`。\n'
    ),
    [`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}`]: (
        '# 视觉主干\n\n' +
        '**这里放什么:**\n' +
        '- `deck_system.txt` — renderer-neutral visual rules\n' +
        '- `color_palette.json` — HTML color and typography roles\n' +
        '- `assets/asset-manifest.yaml` — verified local assets\n\n' +
        '**你做什么:** 改 token 或资产后重新发布受影响的 HTML review evidence。\n'
    ),
    [`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}`]: (
        '# 视觉资产 (assets)\n\n' +
        '**这里放什么:**\n' +
        '- `asset-manifest.yaml` — 资产目录（SSOT），定义每个资产的 id、路径、类型、描述\n' +
        '- `svg/` — SVG 矢量资产\n' +
        '- `reference/` — PNG/JPG 参考图\n' +
        '- `icons/` — 图标集\n\n' +
        '**你做什么:** 添加资产文件到此目录，在 `asset-manifest.yaml` 注册，然后从 structured `SLIDE BODY` 的 typed field 或 `primary_visual.fallback` 引用。\n' +
        '**这是可选基础设施:** 不需要资产时忽略此目录即可，管线在无 assets/ 时正常运作。\n'
    ),
    [`${BACKBONE_DIR}/${BACKBONE_MANUSCRIPT_SUBDIR}`]: (
        '# 讲稿主干\n\n' +
        '**这里放什么:** 演讲讲稿(可按 part0/part1… 分文件)。全版本共享。\n' +
        '**你做什么:** 写/改讲稿。某一版要单独改讲稿,放那版的 `overrides/manuscript/`。\n'
    ),
    [VERSIONS_DIR]: (
        '# 下游:版本\n\n' +
        '**这里放什么:** 每个版本一个子目录(`v1/`、`v2/`…)。版本就是在这一层切的。\n' +
        '**你做什么:** 在 `v1/` 里改 slide、生成 PPT。要留档就用 ' +
        '`bundle_layout.mjs --new-version 3_versions/v1`，它不会复制旧的 `_generated/` ' +
        '或 `_scratch/` 内容（新版是干净临时区）。\n'
    ),
    [`${VERSIONS_DIR}/v1`]: (
        '# 这一版(v1)\n\n' +
        '**你改这两处:**\n' +
        '- `slide-specifications.md` — 每一页的标题、concept、closed family、typed body 和 notes\n' +
        '- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone\n\n' +
        '**临时/备份:** `_scratch/` — 改源前的 `.bak`、草稿（上严下松：别丢到 deck 根）\n\n' +
        '**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。\n\n' +
        '**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:\n' +
        '`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <这个版本目录>`\n' +
        '（或 `node …/unified_pipeline.mjs --run-dir <这个版本目录> --stage all`）\n'
    ),
    [`${VERSIONS_DIR}/v1/${OVERRIDES_SUBDIR}`]: (
        '# 这一版的覆盖(overrides)\n\n' +
        '**这里放什么:** 只放这一版**偏离 backbone** 的东西。空着 = 完全继承 backbone。\n' +
        '- 要这版单独改视觉 → `overrides/visual-style/`(放改动的那几个文件)\n' +
        '- 要这版单独改讲稿 → `overrides/manuscript/`\n\n' +
        '管线取件规则:这里有 → 用这里的;没有 → 回退 backbone。\n'
    ),
    [`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}`]: (
        '# 派生品(_generated)——别手改\n\n' +
        '**这里全是机器生成的**:slide_plan.json、page_prompts/、图片、PPTX。\n' +
        '**不要手改任何东西**——改源文件(slide-specifications.md / backbone)后重跑管线,这里会被覆盖重建。\n' +
        '整个目录可以 `rm -rf` 掉,需要时从源文件重新生成。\n'
    ),
    [`${VERSIONS_DIR}/v1/${SCRATCH_SUBDIR}`]: SCRATCH_DIR_README,
};

export function initBundle(deckDir, frameworkDir = null, deckType = null, style = null) {
    if (frameworkDir === null) {
        frameworkDir = path.resolve(__dirname, '..', '..', '..');
    }
    if (deckType !== null && !(deckType in DECK_TYPE_TEMPLATES)) {
        throw new Error(
            `unknown deck-type ${JSON.stringify(deckType)}. ` +
            `Allowed: ${Object.keys(DECK_TYPE_TEMPLATES).sort().join(', ')}`);
    }
    if (style !== null && !STYLE_PRESETS.includes(style)) {
        throw new Error(
            `unknown style preset ${JSON.stringify(style)}. ` +
            `Allowed: ${[...STYLE_PRESETS].sort().join(', ')}`);
    }
    const name = path.basename(deckDir).replace('deck_', '');
    const log = [];

    const dirs = ['.', STATE_DIR, LESSONS_DIR, UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, `${VERSIONS_DIR}/v1`];
    for (const sd of BACKBONE_SUBDIRS) {
        dirs.push(`${BACKBONE_DIR}/${sd}`);
    }
    for (const sd of VERSION_SUBDIRS) {
        dirs.push(`${VERSIONS_DIR}/v1/${sd}`);
    }
    // Asset subdirectories (optional infrastructure, placeholder on init)
    const assetsBase = `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}`;
    for (const sd of [ASSET_SVG_SUBDIR, ASSET_REFERENCE_SUBDIR, ASSET_ICONS_SUBDIR]) {
        dirs.push(`${assetsBase}/${sd}`);
    }
    for (const rel of dirs) {
        const d = rel === '.' ? deckDir : path.join(deckDir, rel);
        fs.mkdirSync(d, { recursive: true });
    }

    for (const [rel, body] of Object.entries(_DIR_READMES)) {
        const d = rel === '.' ? deckDir : path.join(deckDir, rel);
        const target = path.join(d, 'README.md');
        _writeIfAbsent(target, body.replace(/\{NAME\}/g, name));
        log.push(`README: ${rel}/README.md`);
    }

    for (const [fname, tmplRel] of Object.entries(BACKBONE_FILE_SEEDS)) {
        const dest = path.join(deckDir, BACKBONE_DIR, fname);
        if (fs.existsSync(dest)) continue;
        const tmpl = tmplRel ? path.join(frameworkDir, tmplRel) : null;
        if (tmpl && fs.existsSync(tmpl) && fs.statSync(tmpl).isFile()) {
            fs.copyFileSync(tmpl, dest);
            log.push(`template: ${BACKBONE_DIR}/${fname}`);
        } else {
            _writeIfAbsent(dest, `# ${fname.replace(/\.md$/, '')}\n\n> 待填。\n`);
            log.push(`stub: ${BACKBONE_DIR}/${fname}`);
        }
    }

    let specsTmpl;
    let specsLabel;
    if (deckType) {
        specsTmpl = path.join(frameworkDir, DECK_TYPE_DIR, DECK_TYPE_TEMPLATES[deckType]);
        specsLabel = `deck-type:${deckType}`;
    } else {
        specsTmpl = path.join(frameworkDir, 'workflow/01-content/template-slide-specifications.md');
        specsLabel = 'template';
    }
    const specsDest = path.join(deckDir, VERSIONS_DIR, 'v1', SLIDE_SPECS_NAME);
    if (!fs.existsSync(specsDest)) {
        // Fresh bundles are HTML-first. Keep the checked-in templates as
        // authoring references, but seed a runnable structured source so init
        // never leaves an unavailable legacy delivery route active.
        fs.writeFileSync(specsDest, _htmlFirstSeedSource(deckType), 'utf8');
        log.push(`${specsLabel}: ${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}`);
    }

    if (style) {
        const presetDir = path.join(frameworkDir, STYLE_PRESETS_DIR, style);
        const vsDest = path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
        for (const fname of STYLE_PRESET_FILES) {
            const src = path.join(presetDir, fname);
            const dest = path.join(vsDest, fname);
            if (fs.existsSync(src) && fs.statSync(src).isFile() && !fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
                log.push(`style:${style}: ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${fname}`);
            }
        }
    }

    // Stub asset-manifest.yaml (placeholder — user registers assets here when needed)
    _writeIfAbsent(
        path.join(deckDir, assetsBase, ASSET_MANIFEST_FILE),
        '# HTML-first Visual Asset Manifest — optional local asset catalog.\n' +
        '# Bind registered IDs only through structured body fields.\n' +
        '\n' +
        'version: 2\n' +
        'assets: {}\n');
    log.push(`asset catalog: ${assetsBase}/${ASSET_MANIFEST_FILE}`);

    _writeIfAbsent(
        path.join(deckDir, METADATA_FILE),
        `# ${name} — project metadata (static config + pipeline gates)\n` +
        `# Playbook execution progress / playbook gates live in _state/state.yaml — see _state/README.md\n` +
        `deck_name: ${name}\n` +
        `topic: \naudience: \nlanguage: \none_thing_to_remember: \n` +
        `content_gate: pending\nvisual_gate: pending\n` +
        `html_content_gate: pending\nhtml_content_gate_run_version: v1\n` +
        `html_visual_gate: pending\nhtml_visual_gate_run_version: v1\n`);
    _writeIfAbsent(
        path.join(deckDir, AGENT_POINTER_FILE),
        `# ${name}\n\n进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。` +
        `它定义源文件所有权、CLI 诊断处理和下一步动作。\n`);
    _writeIfAbsent(
        path.join(deckDir, POINTER_FILE),
        `# ${name}\n\n进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。` +
        `它定义源文件所有权、CLI 诊断处理和下一步动作。\n`);
    const pipelineScript = path.join(frameworkDir, 'scripts/03-html-production/unified_pipeline.mjs');
    const flowScript = path.join(frameworkDir, 'scripts/ppt_flow.mjs');
    _writeIfAbsent(
        path.join(deckDir, GUIDE_FILE),
        `# ${path.basename(deckDir)} — 这个 PPT 项目怎么用\n\n` +
        `> 当前版本：\`v1\`，production pipeline 是 \`html-first-v1\`。只改 source/control；\`_generated/\` 一律由管线重建。\n\n` +
        `## 工作位置\n\n` +
        `- 结构化页面：\`${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}\`\n` +
        `- 视觉系统和本地资产：\`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/\`\n` +
        `- 生产产物：\`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}/html_production/\`\n` +
        `- 执行状态：\`${STATE_DIR}/${STATE_FILE}\`\n\n` +
        `## HTML-first 流程\n\n` +
        `1. 写完整 structured source，运行 \`validate\`。\n` +
        `2. 运行 \`pilot\` 发布本地 HTML content/visual review artifacts。\n` +
        `3. 用 exact plan hash 审核 content 和 visual；metadata 标量只是镜像。\n` +
        `4. 运行 \`build\` 生成 contact sheet、PPTX 与 notes。\n` +
        `5. 展示交付物后只用 \`state --record-delivery-review <decision>\` 记录 final review。\n\n` +
        `\`state\`/\`status\` 仅观察；遇到 gate journal 或 reset ownership 时遵循 CLI 的 bounded recovery action。` +
        `结构编辑先 preview，再按 exact plan hash 发布 vNext；target local materialization 后必须重新审核。` +
        `非零退出时读取 stderr 最后一个有效 JSON failure envelope；执行 diagnostic.next 时传 program\` + \`args，requires_human: true 必须等待人类决定；不猜被省略的 path/id。` +
        `\`_generated/\` 是派生品，结构 preview 的 plan hash 由 Agent 保存；needs_render 只报告后续成本，结构修改不调用 renderer，失败时走新 preview → 新 vNext → 新 deck。\n\n` +
        `自留教训写入 \`_lessons/\`，使用 \`lessons.mjs\`；Git 仅是可选、用户拥有的 source/control 审计，\`_generated/\` 不是恢复目标；没有明确授权不做 Git mutation。\n\n` +
        `\`\`\`bash\n` +
        `node "${flowScript}" doctor\n` +
        `node "${flowScript}" state "${deckDir}/${VERSIONS_DIR}/v1"\n` +
        `node "${flowScript}" validate "${deckDir}/${VERSIONS_DIR}/v1"\n` +
        `node "${flowScript}" pilot "${deckDir}/${VERSIONS_DIR}/v1"\n` +
        `node "${flowScript}" build "${deckDir}/${VERSIONS_DIR}/v1"\n` +
        `\`\`\`\n\n` +
        `Legacy Image2 maintenance is only for markerless historical decks and is not initialized here.\n`);
    log.push(`project files: ${METADATA_FILE}, ${AGENT_POINTER_FILE}, ${POINTER_FILE}, ${GUIDE_FILE}`);

    _writeIfAbsent(
        path.join(deckDir, '.env.example'),
        '# HTML-first local production does not require provider credentials.\n' +
        '# Keep secrets out of this run bundle. Markerless legacy maintenance has\n' +
        '# separate, explicitly authorized Image2 troubleshooting guidance.\n' +
        '# IMAGE2_API_KEY=            # legacy compatibility only\n' +
        '# IMAGE2_BASE_URL=           # legacy compatibility only\n');
    _writeIfAbsent(
        path.join(deckDir, '.gitignore'),
        '# secrets — never commit your API key\n.env\n' +
        '# generated artifacts (regenerable from source)\n' +
        `${VERSIONS_DIR}/*/${GENERATED_SUBDIR}/\n` +
        `# version temp/bak (keep README)\n` +
        `${VERSIONS_DIR}/*/${SCRATCH_SUBDIR}/*\n` +
        `!${VERSIONS_DIR}/*/${SCRATCH_SUBDIR}/README.md\n`);
    log.push('credentials: .env.example, .gitignore');

    if (!fs.existsSync(statePath(deckDir))) {
        const state = createInitialState(name, deckType || '', style || '');
        state.pipeline = 'html-first-v1';
        state.gates.html_content = 'pending';
        state.gates.html_visual = 'pending';
        state.gates.html_content_run_version = 'v1';
        state.gates.html_visual_run_version = 'v1';
        setNodeStatus(state, 'instantiation', 'completed');
        writeState(deckDir, state);
        log.push(`state: ${STATE_DIR}/${STATE_FILE}`);
    }

    return log;
}

// ---------------------------------------------------------------------------
// --- Canonical tree renderer (docs generate/validate against this) ---------
// ---------------------------------------------------------------------------

export function renderTree() {
    return `\
deck_\${NAME}/
├── ${GUIDE_FILE}                     ← read first: structure + workflow + edit chains
├── ${AGENT_POINTER_FILE}                       ← agent-agnostic pointer to ${GUIDE_FILE}
├── ${POINTER_FILE}                        ← Claude pointer to ${GUIDE_FILE} (auto-load)
├── ${METADATA_FILE}
├── ${STATE_DIR}/                          ← playbook execution progress (not material)
│   ├── ${STATE_FILE}                    ← truth source (atomic write)
│   └── history.jsonl                   ← append-only reference log (created on demand)
├── ${LESSONS_DIR}/                       ← retained lessons after probe/overcome (read-before-guess; not secrets / not progress)
│   ├── README.md                       ← 这里放什么 / 闭环 / 怎么写
│   └── *.md | *.yaml                   ← one lesson per file (e.g. image2-proven.yaml)
│
├── ${UPSTREAM_DIR}/          ← 上游 UPSTREAM · raw material · shared · append-mostly · no versions
│
├── ${BACKBONE_DIR}/                       ← 中游 BACKBONE · 主干/default source-of-truth · shared · stable
│   ├── ${BACKBONE_METAPHOR}
│   ├── ${BACKBONE_FORMULA}
│   ├── ${BACKBONE_CONSTRAINTS}
│   ├── ${BACKBONE_OUTLINE}
│   ├── ${BACKBONE_MANUSCRIPT_SUBDIR}/
│   └── ${BACKBONE_STYLE_SUBDIR}/
│       ├── ${STYLE_MASTER_PROMPT}
│       ├── ${STYLE_MASTER_IMAGE}
│       ├── ${DECK_SYSTEM_FILE}
│       ├── ${COLOR_PALETTE_FILE}
│       └── ${BACKBONE_ASSETS_SUBDIR}/                   ← optional visual asset catalog (placeholder on init)
│           ├── ${ASSET_MANIFEST_FILE}
│           ├── ${ASSET_SVG_SUBDIR}/
│           ├── ${ASSET_REFERENCE_SUBDIR}/
│           └── ${ASSET_ICONS_SUBDIR}/
│
└── ${VERSIONS_DIR}/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── ${SLIDE_SPECS_NAME}       ← per-slide 4-layer specs; each slide declares render mode
    │   ├── ${OVERRIDES_SUBDIR}/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── ${BACKBONE_STYLE_SUBDIR}/           ←   (optional) this version's visual tweaks
    │   │   └── ${BACKBONE_MANUSCRIPT_SUBDIR}/               ←   (optional) this version's script tweaks
    │   ├── ${GENERATED_SUBDIR}/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │   │   ├── ${GEN_SLIDE_PLAN}
    │   │   ├── ${GEN_PROMPTS_SUBDIR}/{NN--ID.prompt.md, ${GEN_PROMPTS_JSON}}  ← cheap position projection
    │   │   ├── ${GEN_IMAGES_SUBDIR}/{ID.png, ID${IMAGE_TRACE_SUFFIX}, _manifest.json}
    │   │   ├── ${GEN_HEADER_LOCKED_SUBDIR}/{ID.png, _manifest.json}
    │   │   ├── ${GEN_PPT_SUBDIR}/{NAME}.pptx (+ .backup.pptx)
    │   │   ├── ${GEN_QA_SUBDIR}/
    │   │   ├── ${GEN_PREVIEW_SUBDIR}/contact_sheet.jpg
    │   │   └── ${GEN_HTML_PRODUCTION_SUBDIR}/              ← HTML-first immutable local production owner
    │   │       ├── ${GEN_HTML_PAGES_SUBDIR}/{objects/, manifest.json}
    │   │       ├── ${GEN_HTML_FINAL_SLIDES_SUBDIR}/{objects/, manifest.json}
    │   │       └── ${GEN_HTML_PREVIEW_SUBDIR}/{objects/, plans/, manifest.json}
    │   └── ${SCRATCH_SUBDIR}/html-migration/               ← isolated migration candidate/projected-run only
    └── v2/  (--new-version v1 → copies source delta only; clean ${GENERATED_SUBDIR}/ + ${SCRATCH_SUBDIR}/; backbone referenced)
`;
}

// ---------------------------------------------------------------------------
// --- Self-check (drift alarm) ----------------------------------------------
// ---------------------------------------------------------------------------

function _globToRegex(glob) {
    let pattern = glob
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*')
        .replace(/\\\?/g, '.');
    return new RegExp('^' + pattern + '$');
}

export function selfCheck() {
    const problems = [];

    for (const fname of Object.keys(BACKBONE_FILE_SEEDS)) {
        if (!_ALLOWED_IN_BACKBONE.has(fname)) {
            problems.push(`init seeds ${fname} but whitelist forbids it in ${BACKBONE_DIR}/`);
        }
    }
    for (const sd of BACKBONE_SUBDIRS) {
        if (!_ALLOWED_IN_BACKBONE.has(sd)) {
            problems.push(`init creates ${sd}/ but whitelist forbids it in ${BACKBONE_DIR}/`);
        }
    }
    for (const f of VISUAL_STYLE_FILES) {
        if (!_ALLOWED_IN_VISUAL_STYLE.has(f)) {
            problems.push(`canonical visual-style file ${f} not in its whitelist`);
        }
    }
    if (!_ALLOWED_IN_VISUAL_STYLE.has(BACKBONE_ASSETS_SUBDIR)) {
        problems.push(`BACKBONE_ASSETS_SUBDIR (${JSON.stringify(BACKBONE_ASSETS_SUBDIR)}) not in _ALLOWED_IN_VISUAL_STYLE`);
    }

    if (!_globToRegex(SLIDE_SPECS_GLOB).test(SLIDE_SPECS_NAME)) {
        problems.push(
            `SLIDE_SPECS_GLOB ${JSON.stringify(SLIDE_SPECS_GLOB)} does not match ` +
            `SLIDE_SPECS_NAME ${JSON.stringify(SLIDE_SPECS_NAME)}`);
    }

    const tree = renderTree();
    for (const n of [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SCRATCH_SUBDIR, SLIDE_SPECS_NAME, STATE_DIR, LESSONS_DIR, BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE]) {
        if (!tree.includes(n)) {
            problems.push(`renderTree() is missing canonical entry ${JSON.stringify(n)} (stale hardcoded literal?)`);
        }
    }

    for (const fname of STYLE_PRESET_FILES) {
        if (!_ALLOWED_IN_VISUAL_STYLE.has(fname)) {
            problems.push(
                `STYLE_PRESET_FILES has ${JSON.stringify(fname)} but it is not a canonical ` +
                `visual-style file — a --style seed would then fail --check`);
        }
    }

    const frameworkDir = path.resolve(__dirname, '..', '..', '..');
    for (const name of STYLE_PRESETS) {
        const pdir = path.join(frameworkDir, STYLE_PRESETS_DIR, name);
        if (!fs.existsSync(pdir) || !fs.statSync(pdir).isDirectory()) {
            problems.push(
                `STYLE_PRESETS lists ${JSON.stringify(name)} but ` +
                `${STYLE_PRESETS_DIR}/${name}/ is missing`);
            continue;
        }
        for (const fname of STYLE_PRESET_FILES) {
            const fp = path.join(pdir, fname);
            if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
                problems.push(
                    `style preset ${JSON.stringify(name)} is missing ${fname} ` +
                    `(${STYLE_PRESETS_DIR}/${name}/)`);
            }
        }
    }
    const presetsRoot = path.join(frameworkDir, STYLE_PRESETS_DIR);
    if (fs.existsSync(presetsRoot) && fs.statSync(presetsRoot).isDirectory()) {
        const onDisk = new Set(
            fs.readdirSync(presetsRoot, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => e.name)
        );
        for (const extra of [...onDisk].filter(n => !STYLE_PRESETS.includes(n)).sort()) {
            problems.push(
                `${STYLE_PRESETS_DIR}/${extra}/ exists on disk but is not declared in STYLE_PRESETS`);
        }
    }
    for (const [name, tmpl] of Object.entries(DECK_TYPE_TEMPLATES)) {
        const fp = path.join(frameworkDir, DECK_TYPE_DIR, tmpl);
        if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
            problems.push(
                `DECK_TYPE_TEMPLATES lists ${JSON.stringify(name)} → ${tmpl} ` +
                `but ${DECK_TYPE_DIR}/${tmpl} is missing`);
        }
    }

    return problems;
}

// ---------------------------------------------------------------------------
// --- CLI entry point -------------------------------------------------------
// ---------------------------------------------------------------------------

function _parseArgs(argv) {
    const args = {
        init: null,
        deckType: null,
        style: null,
        check: null,
        structureOnly: false,
        newVersion: null,
        versionName: null,
        selfCheck: false,
    };

    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        switch (arg) {
            case '--init':
                args.init = argv[++i] || null;
                break;
            case '--deck-type':
                args.deckType = argv[++i] || null;
                break;
            case '--style':
                args.style = argv[++i] || null;
                break;
            case '--check':
                args.check = argv[++i] || null;
                break;
            case '--structure-only':
                args.structureOnly = true;
                break;
            case '--new-version':
                args.newVersion = argv[++i] || null;
                break;
            case '--version-name':
                args.versionName = argv[++i] || null;
                break;
            case '--self-check':
                args.selfCheck = true;
                break;
            default:
                break;
        }
        i++;
    }

    return args;
}

function _main() {
    const argv = process.argv.slice(2);
    const args = _parseArgs(argv);

    if ((args.deckType || args.style) && !args.init) {
        console.error('✗ --deck-type / --style only apply together with --init.');
        emitCliError({
            code: CLI_ERROR_CODES.USAGE,
            message: "--deck-type and --style require --init.",
            hint: "Use the template options only while initializing a deck.",
            where: "bundle_layout.arguments",
            diagnostic: { version: 1, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --init or remove the template-only options." }) },
        });
        process.exit(1);
    }
    if (args.versionName && !args.newVersion) {
        console.error('✗ --version-name only applies together with --new-version.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--version-name requires --new-version.", hint: "Use --version-name only while creating a version.", where: "bundle_layout.arguments", diagnostic: { version: 1, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --new-version or remove --version-name." }) } });
        process.exit(1);
    }
    const primaryModes = [args.init, args.check, args.newVersion, args.selfCheck].filter(Boolean).length;
    if (primaryModes > 1) {
        console.error('✗ choose only one of --init, --check, --new-version, or --self-check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Bundle layout modes are mutually exclusive.", hint: "Choose one primary mode.", where: "bundle_layout.arguments", diagnostic: { version: 1, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Choose exactly one of --init, --check, --new-version, or --self-check." }) } });
        process.exit(1);
    }
    if (args.structureOnly && !args.check) {
        console.error('✗ --structure-only only applies together with --check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--structure-only requires --check.", hint: "Pair the option with a run directory check.", where: "bundle_layout.arguments", diagnostic: { version: 1, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --check <run-dir> or remove --structure-only." }) } });
        process.exit(1);
    }

    if (args.selfCheck) {
        const drift = selfCheck();
        if (drift.length > 0) {
            console.error(`✗ SSOT self-inconsistency — ${drift.length} drift problem(s):`);
            for (const d of drift) {
                console.error(`  - ${d}`);
            }
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle layout SSOT has ${drift.length} coherence issue(s).`, hint: "Repair the layout constants and generated tree together.", where: "bundle_layout.self-check", diagnostic: { version: 1, category: "internal", operation: "self-check", issues: drift.map((message) => ({ message })), next: createCliNext("report_internal", { default: "Inspect bundle_layout.mjs and repair the reported SSOT drift." }) } });
            process.exit(1);
        }
        console.log('✓ SSOT self-consistent: renderTree / whitelist / init all agree.');
        process.exit(0);
    }

    if (args.init) {
        const deckDir = path.resolve(args.init);
        if (!path.basename(deckDir).startsWith('deck_')) {
            console.error(
                `✗ deck dir name must start with 'deck_' (Stage 4 derives the .pptx name from it); ` +
                `got: ${path.basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Deck directory name must start with deck_.", hint: "Rename the target directory and rerun init.", where: "bundle_layout.init.name", diagnostic: { version: 1, category: "usage", operation: "init", subject: { kind: "deck", id: path.basename(deckDir) }, source: { path: deckDir }, next: createCliNext("fix_arguments", { inspect: [{ path: path.dirname(deckDir) }], default: "Choose a target directory whose basename starts with deck_." }) } });
            process.exit(1);
        }
        const frameworkDir = path.resolve(__dirname, '..', '..', '..');
        if (frameworkDir === deckDir || deckDir.startsWith(frameworkDir + path.sep)) {
            console.error(
                `✗ refusing to scaffold inside the framework (${path.basename(frameworkDir)}/). ` +
                `A run bundle is a separate project — give an absolute path or a path outside ` +
                `the framework, e.g.  --init ~/decks/${path.basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "refusing to scaffold a run bundle inside PPTMAKER_FRAMEWORK.", hint: "Choose a target outside the framework source tree.", where: "bundle_layout.init.location", diagnostic: { version: 1, category: "structure", operation: "init", source: { path: deckDir }, reason: { kind: "framework_source_boundary" }, next: createCliNext("fix_arguments", { inspect: [{ path: frameworkDir }], default: "Choose a deck_ target outside PPTMAKER_FRAMEWORK and rerun init." }) } });
            process.exit(1);
        }
        let created;
        try {
            created = initBundle(deckDir, null, args.deckType, args.style);
        } catch {
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "unknown or invalid bundle initialization option.", hint: "Choose a documented deck type and style preset.", where: "bundle_layout.init.options", diagnostic: { version: 1, category: "usage", operation: "init", source: { path: deckDir }, next: createCliNext("fix_arguments", { default: "Inspect --help, choose supported initialization options, and rerun." }) } });
            process.exit(1);
        }
        const seeded = [];
        if (args.deckType) seeded.push(`deck-type=${args.deckType}`);
        if (args.style) seeded.push(`style=${args.style}`);
        const suffix = seeded.length > 0 ? ` [${seeded.join(', ')}]` : '';
        console.log(`✓ Scaffolded bundle at ${deckDir} (${created.length} items)${suffix}:`);
        for (const line of created) {
            console.log(`  + ${line}`);
        }
        console.log(`\nNext: fill 2_backbone/ + 3_versions/v1/slide-specifications.md, then run the pipeline.`);
        console.log(`Verify anytime:  node ${__filename} --check ${deckDir}/${VERSIONS_DIR}/v1`);
        process.exit(0);
    }

    if (args.newVersion) {
        let target;
        try {
            target = createVersion(args.newVersion, args.versionName);
        } catch (exc) {
            console.error(`✗ ${exc.message}`);
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Unable to create the requested clean version.", hint: "Inspect the source version structure and version name.", where: "bundle_layout.new-version", diagnostic: { version: 1, category: "structure", operation: "new-version", source: { path: path.resolve(args.newVersion) }, next: createCliNext("inspect", { inspect: [{ path: path.resolve(args.newVersion) }], default: "Inspect the source version and correct its structure or requested version name." }) } });
            process.exit(1);
        }
        console.log(`✓ Created clean version: ${target}`);
        console.log(`  Copied: ${SLIDE_SPECS_NAME} + ${OVERRIDES_SUBDIR}/`);
        console.log(`  Reset:  ${GENERATED_SUBDIR}/ (no stale images, JSON, or PPTX)`);
        process.exit(0);
    }

    if (args.check) {
        const runDir = path.resolve(args.check);
        const ready = !args.structureOnly;
        const violations = checkBundle(runDir, ready);
        const scope = args.structureOnly ? 'structure' : 'structure + pipeline-readiness';
        if (violations.length > 0) {
            console.error(`✗ Bundle does NOT conform (${scope}) — ${violations.length} violation(s):`);
            for (const v of violations) {
                console.error(`  - ${v}`);
            }
            console.error('\nThe structure is the constitution. Fix these, or see the canonical tree:');
            console.error('  node bundle_layout.mjs');
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle ${scope} check found ${violations.length} violation(s).`, hint: "Fix the named source layout, then rerun the check.", where: "bundle_layout.check", diagnostic: { version: 1, category: "structure", operation: "check", source: { path: runDir }, issues: violations.map((message) => ({ message, source: { path: runDir }, reason: { kind: "layout_violation" } })), next: createCliNext("edit_source", { inspect: [{ path: runDir }], invocation: { program: "node", args: [__filename, "--check", runDir, ...(args.structureOnly ? ["--structure-only"] : [])] }, default: "Repair the reported run-bundle paths; do not edit _generated artifacts as source." }) } });
            process.exit(1);
        }
        const note = ready ? '' : '  (pipeline assets and Phase approvals are not required at this gate.)';
        console.log(`✓ ${runDir} conforms (${scope}).${note}`);
        process.exit(0);
    }

    console.log(renderTree());
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
    const { installStandaloneFailureEnvelope } = await import("../cli/cli_error.mjs");
    installStandaloneFailureEnvelope({ where: "bundle_layout" });
    if (process.argv.includes("--help")) {
        console.log("Usage: node bundle_layout.mjs [--init <deck>] [--deck-type <type>] [--style <preset>] [--check <run-dir> [--structure-only]] [--new-version <run-dir> [--version-name <name>]] [--self-check]");
        process.exit(0);
    }
    _main();
}
