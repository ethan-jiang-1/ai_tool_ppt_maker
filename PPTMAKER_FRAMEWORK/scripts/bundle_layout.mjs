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
 *     ├── CLAUDE.md                      1-line pointer to deck-guide.md (auto-load)
 *     ├── project-metadata.yaml          topic / audience / language / north-star
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
 *             └── _generated/              GENERATED · never hand-edit · rm -rf & rerun
 *                 ├── slide_plan.json
 *                 ├── page_prompts/{NN_id.prompt.md, _prompts.json}
 *                 ├── page_images_full/{NN_id.png, NN_id.apimart-task.json}
 *                 ├── header_locked/NN_id.png
 *                 ├── ppt/<name>.pptx (+ .backup.pptx)
 *                 ├── qa/
 *                 └── preview/contact_sheet.jpg
 *
 * Rules encoded here:
 * - A "version" (deck_<name>/3_versions/vN) is the DOWNSTREAM delta only. Create one
 *   with `--new-version`; it copies slide-specifications.md + overrides/ but never
 *   `_generated/`. Backbone & upstream are referenced, never copied.
 * - Override precedence: for any backbone asset, a version's overrides/<relpath> wins
 *   if present, else the backbone default is used (see resolveBackboneAsset).
 * - Deck name (for the .pptx) derives from the deck root dir, two levels above a version.
 *
 * Node.js ESM port — zero external dependencies. Drop-in replacement for the Python
 * bundle_layout.mjs. All constants, functions, and CLI modes preserved identically.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Self-location (replaces Python's __file__ / Path(__file__).resolve())
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
export const POINTER_FILE = 'CLAUDE.md';
export const METADATA_FILE = 'project-metadata.yaml';

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
// --- Inside a version dir (deck_<name>/3_versions/vN) ----------------------
// ---------------------------------------------------------------------------
export const SLIDE_SPECS_NAME = 'slide-specifications.md';
export const SLIDE_SPECS_GLOB = 'slide-specifications*.md';
export const OVERRIDES_SUBDIR = 'overrides';
export const GENERATED_SUBDIR = '_generated';

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
export const IMAGE_TRACE_SUFFIX = '.apimart-task.json';

// ---------------------------------------------------------------------------
// --- CANONICAL STRUCTURE (the ONE data source) -----------------------------
// ---------------------------------------------------------------------------

export const BACKBONE_FILE_SEEDS = Object.freeze({
    [BACKBONE_METAPHOR]:    'workflow/02-content/template-core-metaphor.md',
    [BACKBONE_FORMULA]:     'workflow/02-content/template-core-formula.md',
    [BACKBONE_CONSTRAINTS]: 'workflow/02-content/template-design-constraints.md',
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

export const VERSION_SUBDIRS = Object.freeze([OVERRIDES_SUBDIR, GENERATED_SUBDIR]);

const _ALLOWED_IN_BACKBONE = new Set([
    ...Object.keys(BACKBONE_FILE_SEEDS),
    ...BACKBONE_SUBDIRS,
    ...BACKBONE_OPTIONAL,
    'README.md',
]);

const _ALLOWED_IN_VISUAL_STYLE = new Set([
    ...VISUAL_STYLE_FILES,
    ...VISUAL_STYLE_OPTIONAL,
    'README.md',
]);

// ---------------------------------------------------------------------------
// --- PRESET CATALOGS (the ONE data source for --init preset seeding) -------
// ---------------------------------------------------------------------------

export const STYLE_PRESETS_DIR = 'workflow/01-visual/presets';
export const STYLE_PRESETS = Object.freeze([
    'clean-clinical', 'corporate-safe', 'dark-executive',
    'tech-startup', 'warm-editorial',
]);

export const STYLE_PRESET_FILES = Object.freeze([DECK_SYSTEM_FILE, COLOR_PALETTE_FILE]);

export const DECK_TYPE_DIR = 'workflow/02-content/presets/deck-type-templates';
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

export function checkBundle(runDir, requirePipelineReady = true) {
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
    if (requirePipelineReady && !fs.existsSync(styleAsset(runDir, STYLE_MASTER_IMAGE))) {
        problems.push(
            `missing ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${STYLE_MASTER_IMAGE} ` +
            `(Phase-2 output; generate it before running the pipeline, or add a version override)`);
    }
    if (requirePipelineReady) {
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
        if (isSlideSpec || name === OVERRIDES_SUBDIR || name === GENERATED_SUBDIR || name === 'README.md') {
            continue;
        }
        problems.push(
            `unexpected '${name}' at version root — not part of the canonical structure. ` +
            `A version holds only: slide-specifications.md, ${OVERRIDES_SUBDIR}/, ` +
            `${GENERATED_SUBDIR}/, README.md. Sources live in ${BACKBONE_DIR}/ (deck root); ` +
            `generated artifacts live under ${GENERATED_SUBDIR}/. Do not improvise.`);
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

export function createVersion(sourceRunDir, versionName = null) {
    sourceRunDir = path.resolve(sourceRunDir);
    if (!isVersionDir(sourceRunDir)) {
        throw new Error(
            `source must be a version dir inside ${VERSIONS_DIR}/ (got ${sourceRunDir})`);
    }

    if (versionName === null) {
        const numbers = [];
        const parentDir = path.dirname(sourceRunDir);
        if (fs.existsSync(parentDir)) {
            for (const child of fs.readdirSync(parentDir, { withFileTypes: true })) {
                if (!child.isDirectory()) continue;
                const match = child.name.match(/^v(\d+)$/);
                if (match) {
                    numbers.push(parseInt(match[1], 10));
                }
            }
        }
        versionName = `v${Math.max(0, ...numbers) + 1}`;
    }
    if (!/^v\d+$/.test(versionName)) {
        throw new Error(`version name must look like v2, v3, ... (got ${JSON.stringify(versionName)})`);
    }

    const target = path.join(path.dirname(sourceRunDir), versionName);
    if (fs.existsSync(target)) {
        throw new Error(`target version already exists: ${target}`);
    }

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
    _writeIfAbsent(
        path.join(target, 'README.md'),
        `# 这一版(${versionName})\n\n` +
        `源自 \`${path.basename(sourceRunDir)}\`，只复制了 \`${SLIDE_SPECS_NAME}\` + \`${OVERRIDES_SUBDIR}/\`。\n` +
        `\`${GENERATED_SUBDIR}/\` 是干净的，旧版本图片/PPTX 没有复制过来。\n`);
    return target;
}

// ---------------------------------------------------------------------------
// --- Scaffolder ------------------------------------------------------------
// ---------------------------------------------------------------------------

function _writeIfAbsent(filePath, content) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

const _DIR_READMES = {
    '.': (
        '# {NAME} — 这个 PPT 项目\n\n' +
        '先读 **deck-guide.md**（进来先看那个）。\n\n' +
        '这个文件夹分三层:\n' +
        '- `1_upstream_raw_material/` — 原始素材、调研(你往里堆资料)\n' +
        '- `2_backbone/` — 主干:隐喻/公式/约束/大纲/讲稿/视觉(整个 deck 共享)\n' +
        '- `3_versions/` — 每个版本(你实际改 slide、生成 PPT 的地方)\n\n' +
        '**只改带 README 说\'你改这里\'的文件。** 结构由 ' +
        '`PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` 定义,别自己新建目录。\n'
    ),
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
        '- `style-master-prompt.md` — 生成风格母版图的 prompt(源文件,别丢)\n' +
        '- `style_master.jpg` — 风格母版图(每页生图时的视觉锚,必须 .jpg)\n' +
        '- `deck_system.txt` — 文字约束(语言/禁用元素,管线读它)\n' +
        '- `color_palette.json` — 配色 + 标题字号(管线读它)\n\n' +
        '**你做什么:** 改配色/风格改这里。锁定后尽量别动——它是「全 deck 长一样」的根源。\n'
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
        '`bundle_layout.mjs --new-version 3_versions/v1`，它不会复制旧的 `_generated/`。\n'
    ),
    [`${VERSIONS_DIR}/v1`]: (
        '# 这一版(v1)\n\n' +
        '**你改这两处:**\n' +
        '- `slide-specifications.md` — 每一页讲什么(标题、要点、画面描述、render mode)\n' +
        '- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone\n\n' +
        '**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。\n\n' +
        '**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:\n' +
        '`uv run python PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs ' +
        '--run-dir <这个版本目录> --stage all`\n'
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
};

export function initBundle(deckDir, frameworkDir = null, deckType = null, style = null) {
    if (frameworkDir === null) {
        frameworkDir = path.dirname(__dirname);
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

    const dirs = ['.', UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, `${VERSIONS_DIR}/v1`];
    for (const sd of BACKBONE_SUBDIRS) {
        dirs.push(`${BACKBONE_DIR}/${sd}`);
    }
    for (const sd of VERSION_SUBDIRS) {
        dirs.push(`${VERSIONS_DIR}/v1/${sd}`);
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
        specsTmpl = path.join(frameworkDir, 'workflow/02-content/template-slide-specifications.md');
        specsLabel = 'template';
    }
    const specsDest = path.join(deckDir, VERSIONS_DIR, 'v1', SLIDE_SPECS_NAME);
    if (fs.existsSync(specsTmpl) && fs.statSync(specsTmpl).isFile() && !fs.existsSync(specsDest)) {
        fs.copyFileSync(specsTmpl, specsDest);
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

    _writeIfAbsent(
        path.join(deckDir, METADATA_FILE),
        `# ${name} — project metadata\n` +
        `deck_name: ${name}\n` +
        `topic: \naudience: \nlanguage: \none_thing_to_remember: \n` +
        `content_gate: pending\nvisual_gate: pending\n`);
    _writeIfAbsent(
        path.join(deckDir, POINTER_FILE),
        `# ${name}\n\n进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。` +
        `目录结构的权威源:\`PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs\`。\n`);
    const pipelineScript = path.join(frameworkDir, 'scripts/unified_pipeline.mjs');
    const versionScript = path.join(frameworkDir, 'scripts/bundle_layout.mjs');
    _writeIfAbsent(
        path.join(deckDir, GUIDE_FILE),
        `# ${path.basename(deckDir)} — 这个 PPT 项目怎么用\n\n` +
        `> 当前版本：\`v1\`。先改源文件，再让管线重建；不要直接改 \`_generated/\`。\n\n` +
        `## 你改哪里\n\n` +
        `- 每页内容：\`${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}\`\n` +
        `- 整体主线：\`${BACKBONE_DIR}/${BACKBONE_METAPHOR}\` + \`${BACKBONE_DIR}/${BACKBONE_FORMULA}\`\n` +
        `- 视觉主干：\`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/\`\n` +
        `- 原始材料：\`${UPSTREAM_DIR}/\`\n\n` +
        `用户确认内容/视觉闸门后，把 \`${METADATA_FILE}\` 中对应的 ` +
        `\`content_gate\` / \`visual_gate\` 改为 \`approved\`；若用户明确跳过则写 \`waived\`。` +
        `Stage 2 会自动检查。\n\n` +
        `## 当前进度\n\n` +
        `查看 \`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}/\`：有 \`slide_plan.json\` 表示 Stage 1 完成；` +
        `有 \`ppt/${name}.pptx\` 表示交付物已生成。\n\n` +
        `## 从项目根目录运行\n\n` +
        `\`\`\`bash\n` +
        `# 首次先解析；再让 Agent 选 3 张代表页做 pilot\n` +
        `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 1\n` +
        `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 2 ` +
        `--only opener_id,content_id,closer_id --resolution 1k\n` +
        `\n# Pilot 通过后全量生产\n` +
        `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 2 ` +
        `--resolution 2k --force-images\n` +
        `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 3,4,5\n` +
        `\n# 新建干净版本（不复制旧图片/PPTX）\n` +
        `uv run python "${versionScript}" --new-version "${deckDir}/${VERSIONS_DIR}/v1"\n` +
        `\`\`\`\n\n` +
        `用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。\n`);
    log.push(`project files: ${METADATA_FILE}, ${POINTER_FILE}, ${GUIDE_FILE}`);

    _writeIfAbsent(
        path.join(deckDir, '.env.example'),
        '# 图像生成凭据（Stage 2 需要——没有 key 就生不了图，PPT 做不出来）。\n' +
        '# 复制本文件为 .env 并填好；每次跑管线会自动加载 .env（填一次即可）。\n\n' +
        '# 框架统一入口变量；wrapper 会桥接到当前 image skill 的原生变量：\n' +
        'OPENAI_API_KEY=            # 必填：你的图像 API key\n' +
        'OPENAI_BASE_URL=           # 可选：API 端点，如 https://<relay>/v1（留空用默认）\n\n' +
        '# （若你的中转原生用别的变量名，直接填 APIMART_API_KEY / APIMART_BASE_URL 也认。）\n');
    _writeIfAbsent(
        path.join(deckDir, 'pyproject.toml'),
        `[project]\nname = "deck-${name}"\nversion = "0.0.0"\n` +
        `requires-python = ">=3.11"\n` +
        `dependencies = [\n` +
        `    "python-pptx>=1.0",   # Stage 4/5 (pulls Pillow)\n` +
        `    "Pillow>=10.0",       # Stage 3 header overlay\n` +
        `    "httpx>=0.27",        # Stage 2 image skill HTTP client\n` +
        `]\n\n[tool.uv]\npackage = false\n`);
    _writeIfAbsent(
        path.join(deckDir, '.gitignore'),
        '# secrets — never commit your API key\n.env\n' +
        '# environments / caches\n.venv/\n__pycache__/\n' +
        '# generated artifacts (regenerable from source)\n' +
        `${VERSIONS_DIR}/*/${GENERATED_SUBDIR}/\n`);
    log.push('credentials/deps: .env.example, pyproject.toml, .gitignore');

    return log;
}

// ---------------------------------------------------------------------------
// --- Canonical tree renderer (docs generate/validate against this) ---------
// ---------------------------------------------------------------------------

export function renderTree() {
    return `\
deck_\${NAME}/
├── ${GUIDE_FILE}                     ← read first: structure + workflow + edit chains
├── ${POINTER_FILE}                         ← 1-line pointer to ${GUIDE_FILE} (auto-load)
├── ${METADATA_FILE}
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
│       └── ${COLOR_PALETTE_FILE}
│
└── ${VERSIONS_DIR}/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── ${SLIDE_SPECS_NAME}       ← per-slide 4-layer specs; each slide declares render mode
    │   ├── ${OVERRIDES_SUBDIR}/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── ${BACKBONE_STYLE_SUBDIR}/           ←   (optional) this version's visual tweaks
    │   │   └── ${BACKBONE_MANUSCRIPT_SUBDIR}/               ←   (optional) this version's script tweaks
    │   └── ${GENERATED_SUBDIR}/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │       ├── ${GEN_SLIDE_PLAN}
    │       ├── ${GEN_PROMPTS_SUBDIR}/{NN_id.prompt.md, ${GEN_PROMPTS_JSON}}   ← one readable prompt per slide
    │       ├── ${GEN_IMAGES_SUBDIR}/{NN_id.png, NN_id${IMAGE_TRACE_SUFFIX}}
    │       ├── ${GEN_HEADER_LOCKED_SUBDIR}/NN_id.png
    │       ├── ${GEN_PPT_SUBDIR}/{NAME}.pptx (+ .backup.pptx)
    │       ├── ${GEN_QA_SUBDIR}/
    │       └── ${GEN_PREVIEW_SUBDIR}/contact_sheet.jpg
    └── v2/  (--new-version v1 → copies source delta only; clean ${GENERATED_SUBDIR}/; backbone referenced)
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

    if (!_globToRegex(SLIDE_SPECS_GLOB).test(SLIDE_SPECS_NAME)) {
        problems.push(
            `SLIDE_SPECS_GLOB ${JSON.stringify(SLIDE_SPECS_GLOB)} does not match ` +
            `SLIDE_SPECS_NAME ${JSON.stringify(SLIDE_SPECS_NAME)}`);
    }

    const tree = renderTree();
    for (const n of [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SLIDE_SPECS_NAME]) {
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

    const frameworkDir = path.dirname(__dirname);
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
        process.exit(1);
    }
    if (args.versionName && !args.newVersion) {
        console.error('✗ --version-name only applies together with --new-version.');
        process.exit(1);
    }
    const primaryModes = [args.init, args.check, args.newVersion, args.selfCheck].filter(Boolean).length;
    if (primaryModes > 1) {
        console.error('✗ choose only one of --init, --check, --new-version, or --self-check.');
        process.exit(1);
    }
    if (args.structureOnly && !args.check) {
        console.error('✗ --structure-only only applies together with --check.');
        process.exit(1);
    }

    if (args.selfCheck) {
        const drift = selfCheck();
        if (drift.length > 0) {
            console.error(`✗ SSOT self-inconsistency — ${drift.length} drift problem(s):`);
            for (const d of drift) {
                console.error(`  - ${d}`);
            }
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
            process.exit(1);
        }
        const frameworkDir = path.dirname(__dirname);
        if (frameworkDir === deckDir || deckDir.startsWith(frameworkDir + path.sep)) {
            console.error(
                `✗ refusing to scaffold inside the framework (${path.basename(frameworkDir)}/). ` +
                `A run bundle is a separate project — give an absolute path or a path outside ` +
                `the framework, e.g.  --init ~/decks/${path.basename(deckDir)}`);
            process.exit(1);
        }
        const created = initBundle(deckDir, null, args.deckType, args.style);
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
    _main();
}
