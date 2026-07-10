#!/usr/bin/env node
/**
 * bundle_layout.mjs — THE SINGLE SOURCE OF TRUTH for the run-bundle directory structure.
 *
 * Everything that needs to know "where does X live in a run bundle" imports from here:
 * - the pipeline scripts build every path from these constants;
 * - the docs are generated/validated against renderTree() so they can never drift.
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
 *   with --new-version; it copies slide-specifications.md + overrides/ but never
 *   _generated/. Backbone & upstream are referenced, never copied.
 * - Override precedence: for any backbone asset, a version's overrides/<relpath> wins
 *   if present, else the backbone default is used (see resolveBackboneAsset).
 * - Deck name (for the .pptx) derives from the deck root dir, two levels above a version.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// --- Top-level bundle dirs (relative to deck_<name>/) ------------------------
export const UPSTREAM_DIR = "1_upstream_raw_material";   // shared upstream: raw material / research
export const BACKBONE_DIR = "2_backbone";                 // shared midstream: default source-of-truth
export const VERSIONS_DIR = "3_versions";                 // downstream: one subdir per version (v1, v2, …)

// Root bundle files
export const GUIDE_FILE = "deck-guide.md";                // human+agent control-flow doc (read first)
export const POINTER_FILE = "CLAUDE.md";                  // 1-line pointer to GUIDE_FILE (Claude Code auto-load)
export const METADATA_FILE = "project-metadata.yaml";

// --- Inside 2_backbone/ ------------------------------------------------------
export const BACKBONE_METAPHOR = "core-metaphor.md";
export const BACKBONE_FORMULA = "core-formula.md";
export const BACKBONE_CONSTRAINTS = "design-constraints.md";
export const BACKBONE_OUTLINE = "outline.md";
export const BACKBONE_MANUSCRIPT_SUBDIR = "manuscript";
export const BACKBONE_STYLE_SUBDIR = "visual-style";      // also the relpath used for override lookup

// --- Inside 2_backbone/visual-style/ (or a version override of it) -----------
export const STYLE_MASTER_PROMPT = "style-master-prompt.md";   // source: the prompt that makes style_master
export const STYLE_MASTER_IMAGE = "style_master.jpg";          // image-2 output; required by Stage 2
export const DECK_SYSTEM_FILE = "deck_system.txt";             // textual constraints; read by Stage 1
export const COLOR_PALETTE_FILE = "color_palette.json";        // colors + header-lock sizes; read by Stage 3

// --- Inside a version dir (deck_<name>/3_versions/vN) ------------------------
export const SLIDE_SPECS_NAME = "slide-specifications.md";       // canonical per-slide spec filename
export const SLIDE_SPECS_GLOB = "slide-specifications*.md";      // pipeline input (per-slide 4-layer specs)
export const OVERRIDES_SUBDIR = "overrides";                     // this version's deviations from backbone
export const GENERATED_SUBDIR = "_generated";                    // all pipeline artifacts (never hand-edit)

// --- Inside a version's _generated/ ------------------------------------------
export const GEN_SLIDE_PLAN = "slide_plan.json";                 // Stage 1 → read by Stage 3, 4
export const GEN_PROMPTS_SUBDIR = "page_prompts";                // Stage 1 → read by Stage 2
export const GEN_PROMPTS_JSON = "_prompts.json";                 //   machine format (inside page_prompts/)
export const GEN_IMAGES_SUBDIR = "page_images_full";             // Stage 2 → read by Stage 3
export const GEN_HEADER_LOCKED_SUBDIR = "header_locked";         // Stage 3 → read by Stage 4
export const GEN_PPT_SUBDIR = "ppt";                              // Stage 4-5 → final deliverable
export const GEN_QA_SUBDIR = "qa";                                // optional
export const GEN_PREVIEW_SUBDIR = "preview";                      // optional (contact sheets; Python-made, no prompt)

// Trace sidecar written next to each generated image (the as-sent prompt + meta).
// This MUST match the suffix the Stage-2 image skill actually writes — the current
// image2-ppt skill (APIMart backend) writes "<image>.apimart-task.json", and the
// whitelist below allows exactly that. If you swap the image backend to one that
// writes a different trace suffix, change it here (single source) and the whitelist
// + tree docs follow.
export const IMAGE_TRACE_SUFFIX = ".apimart-task.json";


// --- CANONICAL STRUCTURE (the ONE data source) -------------------------------
// renderTree(), checkBundle() (whitelist), and initBundle() ALL derive from
// the tables below. This is what makes the SSOT self-consistent: to add/rename a
// canonical entry you edit ONE place here, and the tree + enforcement + scaffolder
// stay in lockstep. (The earlier outline.md drift happened because these three
// kept separate hand-written lists — never again.)

// 2_backbone/ canonical FILES → seed template (framework-relative) or null (stub).
// initBundle seeds each; checkBundle allows exactly these (+ subdirs + optional).
export const BACKBONE_FILE_SEEDS = {
    [BACKBONE_METAPHOR]:    "02_content_design/template-core-metaphor.md",
    [BACKBONE_FORMULA]:     "02_content_design/template-core-formula.md",
    [BACKBONE_CONSTRAINTS]: "02_content_design/template-design-constraints.md",
    [BACKBONE_OUTLINE]:     null,   // no template yet → init writes a short stub
};

// 2_backbone/ canonical SUBDIRS.
export const BACKBONE_SUBDIRS_REF = [BACKBONE_MANUSCRIPT_SUBDIR, BACKBONE_STYLE_SUBDIR];

// Allowed-but-not-seeded in 2_backbone/ (hand-authored, optional).
export const BACKBONE_OPTIONAL = new Set(["visual-style.md"]);

// 2_backbone/visual-style/ canonical files (authored/generated during Phase 2,
// so init does NOT seed them; checkBundle allows exactly these + optional).
export const VISUAL_STYLE_FILES = [STYLE_MASTER_PROMPT, STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE];
export const VISUAL_STYLE_OPTIONAL = new Set(["visual-style.md", "style_master" + IMAGE_TRACE_SUFFIX]);

// A version dir's canonical SUBDIRS (both created by init; overrides may stay empty).
export const VERSION_SUBDIRS = [OVERRIDES_SUBDIR, GENERATED_SUBDIR];

// Whitelist sets — DERIVED from the tables above (do not hand-edit these).
const _ALLOWED_IN_BACKBONE = new Set([
    ...Object.keys(BACKBONE_FILE_SEEDS),
    ...BACKBONE_SUBDIRS_REF,
    ...BACKBONE_OPTIONAL,
    "README.md",
]);
const _ALLOWED_IN_VISUAL_STYLE = new Set([
    ...VISUAL_STYLE_FILES,
    ...VISUAL_STYLE_OPTIONAL,
    "README.md",
]);


// --- PRESET CATALOGS (the ONE data source for --init preset seeding) ---------
// --init --deck-type X --style Y seeds preset files into their canonical spots
// so a novice/agent never hand-copies them (that hand-cp was the L2 freelancing
// hole: wrong filename, wrong dir, forgotten color_palette.json). These catalogs
// are the SSOT for the preset names; selfCheck() verifies each declared name
// still exists on disk, so the catalog can't drift from the preset dirs the same
// way the whitelist can't drift from the tree.

// Visual-style presets: name → dir under 01_visual_style_master/presets/. Each
// preset dir ships the files listed in STYLE_PRESET_FILES.
export const STYLE_PRESETS_DIR = "01_visual_style_master/presets";
export const STYLE_PRESETS = ["clean-clinical", "corporate-safe", "dark-executive",
                              "tech-startup", "warm-editorial"];
// Which files a style preset contributes to 2_backbone/visual-style/. MUST all be
// canonical visual-style files, else a --style seed would fail its own --check
// (selfCheck enforces this subset relationship).
export const STYLE_PRESET_FILES = [DECK_SYSTEM_FILE, COLOR_PALETTE_FILE];

// Deck-type presets: name → template file under DECK_TYPE_DIR. A --deck-type seeds
// 3_versions/v1/slide-specifications.md from this template (instead of the blank one).
export const DECK_TYPE_DIR = "02_content_design/presets/deck-type-templates";
export const DECK_TYPE_TEMPLATES = {
    keynote:  "keynote-template.md",
    pitch:    "pitch-deck-template.md",
    report:   "report-template.md",
    training: "training-template.md",
};


// ---------------------------------------------------------------------------
// Utility helpers (stdlib only, zero npm deps)
// ---------------------------------------------------------------------------

function _exists(p) {
    try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}

function _isDir(p) {
    try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function _isFile(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

function _readText(p) {
    return fs.readFileSync(p, "utf-8");
}

function _writeText(p, content) {
    fs.writeFileSync(p, content, "utf-8");
}

function _mkdirs(p) {
    fs.mkdirSync(p, { recursive: true });
}

function _copyFile(src, dest) {
    fs.copyFileSync(src, dest);
}

/** Recursive copy of a directory (like shutil.copytree). */
function _copyTree(srcDir, destDir) {
    _mkdirs(destDir);
    for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const s = path.join(srcDir, ent.name);
        const d = path.join(destDir, ent.name);
        if (ent.isDirectory()) {
            _copyTree(s, d);
        } else if (ent.isFile()) {
            _copyFile(s, d);
        }
    }
}

/** Read directory entries as dirents, swallowing missing-dir errors. */
function _readdirEnts(dirPath) {
    try { return fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return []; }
}

/** fnmatch-style glob for a simple file name pattern (prefix*uffix → regex). */
function _fnmatch(name, pattern) {
    const re = new RegExp(
        "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
    );
    return re.test(name);
}


// --- Path resolvers (import these; do not re-derive paths by hand) -----------

/** The deck bundle root — two levels up from a version dir (deck_x/3_versions/v1). */
export function deckRoot(runDir) {
    return path.resolve(runDir, "..", "..");
}

/** The shared 2_backbone/ dir for this deck. */
export function backboneDir(runDir) {
    return path.join(deckRoot(runDir), BACKBONE_DIR);
}

/** Resolve a backbone asset with version-override precedence.
 *
 * Returns <runDir>/overrides/<relpath> if it exists (this version overrides the
 * backbone default), otherwise <deckRoot>/2_backbone/<relpath>. The returned path
 * may not exist in either location (the caller decides how to handle a miss).
 */
export function resolveBackboneAsset(runDir, relpath) {
    const override = path.join(runDir, OVERRIDES_SUBDIR, relpath);
    if (_exists(override)) {
        return override;
    }
    return path.join(backboneDir(runDir), relpath);
}

/** Resolve one visual-style file with file-level override fallback.
 *
 * A version may override only color_palette.json while inheriting deck_system.txt
 * and style_master.jpg from the shared backbone. Resolving the whole directory
 * cannot express that merge, so pipeline code must resolve each file separately.
 */
export function styleAsset(runDir, filename) {
    return resolveBackboneAsset(runDir, `${BACKBONE_STYLE_SUBDIR}/${filename}`);
}

/** Backward-compatible whole-directory resolver.
 *
 * New pipeline code should use styleAsset() so partial overrides inherit missing
 * files from backbone instead of shadowing the entire visual-style directory.
 */
export function styleDir(runDir) {
    return resolveBackboneAsset(runDir, BACKBONE_STYLE_SUBDIR);
}

/** The _generated/ dir for this version. */
export function generatedDir(runDir) {
    return path.join(runDir, GENERATED_SUBDIR);
}

/** The per-slide spec markdown for this version (in the version dir). */
export function findSlideSpecs(runDir) {
    const dirents = _readdirEnts(runDir);
    const matches = dirents
        .filter(e => e.isFile() && _fnmatch(e.name, SLIDE_SPECS_GLOB))
        .map(e => e.name)
        .sort();
    return matches.length > 0 ? path.join(runDir, matches[0]) : null;
}

/** Deck name for the .pptx — from the deck root dir (deck_<name> → <name>). */
export function deckName(runDir) {
    return path.basename(deckRoot(runDir)).replace(/^deck_/, "");
}

/** True if runDir looks like a version dir: deck_<name>/3_versions/vN. */
export function isVersionDir(runDir) {
    const parentName = path.basename(path.dirname(runDir));
    const myName = path.basename(runDir);
    return (
        parentName === VERSIONS_DIR
        && /^v\d+$/.test(myName)
        && path.basename(deckRoot(runDir)).startsWith("deck_")
    );
}


// --- Credentials: load .env so key + base URL reach the pipeline -------------
// The scripts + Stage-2 skill read process.env directly. Nothing loaded a .env, so
// "put your key in .env" was dead guidance — the key never arrived and Stage 2
// failed with "API key not set". This tiny stdlib loader fixes that: fill the deck's
// .env ONCE and every run picks it up (child subprocesses inherit process.env).

/** Load KEY=VALUE pairs from the first `.env` found in searchDirs into
 * process.env, WITHOUT overriding vars already set in the real environment
 * (explicit env wins). Supports `#` comments, optional `export ` prefix, and
 * single/double quotes. Returns the loaded file path, or null. Stdlib only.
 */
export function loadDotenv(...searchDirs) {
    for (const d of searchDirs) {
        const envFile = path.join(d, ".env");
        if (!_isFile(envFile)) {
            continue;
        }
        const content = _readText(envFile);
        for (let line of content.split("\n")) {
            line = line.trim();
            if (!line || line.startsWith("#") || !line.includes("=")) {
                continue;
            }
            if (line.startsWith("export ")) {
                line = line.slice("export ".length);
            }
            const eqIdx = line.indexOf("=");
            const key = line.slice(0, eqIdx).trim();
            let val = line.slice(eqIdx + 1).trim();
            // strip single/double quotes
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (key && !(key in process.env)) {
                process.env[key] = val;
            }
        }
        return envFile;
    }
    return null;
}


// --- Constitution enforcer ---------------------------------------------------
// The structure is the framework's constitution. Enforcement is WHITELIST, not
// blacklist: the version root and backbone may contain ONLY the known-canonical
// entries (derived from the CANONICAL STRUCTURE tables above); anything unexpected
// is a violation. No freelancing, period.

/** Housekeeping entries that never count as violations. */
function _ignorable(name) {
    return name.startsWith(".") || name === "__pycache__";
}

/** Validate a version (run) dir against the canonical constitution (WHITELIST).
 *
 * Returns a list of human-readable violation strings — empty means the bundle
 * conforms. Single enforcement point; the file that DEFINES the structure also
 * ENFORCES it. Whitelist means: only known-canonical entries are allowed, so any
 * improvised/misspelled/stray dir or file is rejected, not just known-bad names.
 *
 * Two kinds of check, deliberately separated:
 *   * STRUCTURAL (always) — dir shape + whitelist. A freshly --init'd bundle
 *     passes ALL of these; they never depend on later-phase artifacts.
 *   * PIPELINE-READY (requirePipelineReady=true, the default) — additionally
 *     requires style_master.jpg plus recorded content/visual gate decisions.
 *     Passing false lets a just-scaffolded bundle verify its structure cleanly.
 */
export function checkBundle(runDir, requirePipelineReady = true) {
    const problems = [];

    if (!_isDir(runDir)) {
        return [`run dir not found: ${runDir}`];
    }

    // 1. Must be a version dir: deck_<name>/3_versions/vN
    if (!isVersionDir(runDir)) {
        problems.push(
            `--run-dir must be a version dir inside ${VERSIONS_DIR}/ `
            + `(e.g. deck_x/${VERSIONS_DIR}/v1); got: ${runDir}`);
        // Can't meaningfully check the rest if the shape is wrong.
        return problems;
    }

    const root = deckRoot(runDir);

    // 2a. Root control files and the upstream tier are part of the constitution.
    for (const requiredFile of [GUIDE_FILE, POINTER_FILE, METADATA_FILE]) {
        if (!_isFile(path.join(root, requiredFile))) {
            problems.push(`missing deck root control file: ${requiredFile}`);
        }
    }
    if (!_isDir(path.join(root, UPSTREAM_DIR))) {
        problems.push(`missing shared upstream dir: ${UPSTREAM_DIR}/`);
    }

    // 2. Deck root must carry the shared midstream tier + canonical visual-style dir
    if (!_isDir(path.join(root, BACKBONE_DIR))) {
        problems.push(`missing shared midstream dir: ${BACKBONE_DIR}/ (at deck root ${root})`);
    }
    if (!_isDir(path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR))) {
        problems.push(
            `missing canonical ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ dir `
            + `(check spelling — it must be exactly '${BACKBONE_STYLE_SUBDIR}')`);
    }
    // style_master.jpg is a Phase-2 artifact — only required for a pipeline run.
    if (requirePipelineReady && !_exists(styleAsset(runDir, STYLE_MASTER_IMAGE))) {
        problems.push(
            `missing ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${STYLE_MASTER_IMAGE} `
            + `(Phase-2 output; generate it before running the pipeline, or add a version override)`);
    }
    if (requirePipelineReady) {
        const metadata = path.join(root, METADATA_FILE);
        if (_isFile(metadata)) {
            const fields = {};
            for (const raw of _readText(metadata).split("\n")) {
                const line = raw.trim();
                if (line.includes(":") && !line.startsWith("#")) {
                    const idx = line.indexOf(":");
                    const key = line.slice(0, idx).trim();
                    const value = line.slice(idx + 1).trim().toLowerCase();
                    fields[key] = value;
                }
            }
            for (const gate of ["content_gate", "visual_gate"]) {
                if (fields[gate] !== "approved" && fields[gate] !== "waived") {
                    problems.push(
                        `${gate} is not approved/waived in ${METADATA_FILE} `
                        + `(record approved after confirmation, or waived if the user explicitly skips)`);
                }
            }
        }
    }

    // 3. The version dir must hold the slide-specs source
    if (!findSlideSpecs(runDir)) {
        problems.push(`missing ${SLIDE_SPECS_GLOB} in the version dir ${runDir}`);
    }

    // 4. WHITELIST: the version root may contain ONLY canonical entries.
    for (const entry of _readdirEnts(runDir)) {
        const name = entry.name;
        if (_ignorable(name)) {
            continue;
        }
        const isSlideSpec = entry.isFile() && name.startsWith("slide-specifications") && name.endsWith(".md");
        if (isSlideSpec || name === OVERRIDES_SUBDIR || name === GENERATED_SUBDIR || name === "README.md") {
            continue;
        }
        problems.push(
            `unexpected '${name}' at version root — not part of the canonical structure. `
            + `A version holds only: slide-specifications.md, ${OVERRIDES_SUBDIR}/, `
            + `${GENERATED_SUBDIR}/, README.md. Sources live in ${BACKBONE_DIR}/ (deck root); `
            + `generated artifacts live under ${GENERATED_SUBDIR}/. Do not improvise.`);
    }

    // 5. WHITELIST: 2_backbone/ may contain only canonical entries.
    const bb = path.join(root, BACKBONE_DIR);
    if (_isDir(bb)) {
        for (const entry of _readdirEnts(bb)) {
            if (_ignorable(entry.name)) {
                continue;
            }
            if (!_ALLOWED_IN_BACKBONE.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${BACKBONE_DIR}/ — not canonical. `
                    + `Allowed: ${[..._ALLOWED_IN_BACKBONE].sort().join(", ")}`);
            }
        }
    }

    // 6. WHITELIST: 2_backbone/visual-style/ may contain only canonical entries.
    const vs = path.join(bb, BACKBONE_STYLE_SUBDIR);
    if (_isDir(vs)) {
        for (const entry of _readdirEnts(vs)) {
            if (_ignorable(entry.name)) {
                continue;
            }
            if (!_ALLOWED_IN_VISUAL_STYLE.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ — `
                    + `not canonical. Allowed: ${[..._ALLOWED_IN_VISUAL_STYLE].sort().join(", ")}`);
            }
        }
    }

    // 7. Version overrides are sparse, but their top-level categories are fixed.
    const overridesDir = path.join(runDir, OVERRIDES_SUBDIR);
    if (_isDir(overridesDir)) {
        const allowedOverrideRoots = new Set([BACKBONE_STYLE_SUBDIR, BACKBONE_MANUSCRIPT_SUBDIR, "README.md"]);
        for (const entry of _readdirEnts(overridesDir)) {
            if (_ignorable(entry.name)) {
                continue;
            }
            if (!allowedOverrideRoots.has(entry.name)) {
                problems.push(
                    `unexpected '${entry.name}' in ${OVERRIDES_SUBDIR}/ — allowed categories: `
                    + `${[...allowedOverrideRoots].sort().join(", ")}`);
            }
        }
        const overrideStyle = path.join(overridesDir, BACKBONE_STYLE_SUBDIR);
        if (_isDir(overrideStyle)) {
            for (const entry of _readdirEnts(overrideStyle)) {
                if (_ignorable(entry.name)) {
                    continue;
                }
                if (!_ALLOWED_IN_VISUAL_STYLE.has(entry.name)) {
                    problems.push(
                        `unexpected '${entry.name}' in ${OVERRIDES_SUBDIR}/${BACKBONE_STYLE_SUBDIR}/ — `
                        + `not a canonical visual-style asset`);
                }
            }
        }
    }

    return problems;
}


// --- Version management ------------------------------------------------------

/** Create a clean downstream version without copying generated artifacts. */
export function createVersion(sourceRunDir, versionName = null) {
    const resolvedSource = path.resolve(sourceRunDir);
    if (!isVersionDir(resolvedSource)) {
        throw new Error(
            `source must be a version dir inside ${VERSIONS_DIR}/ (got ${resolvedSource})`);
    }

    if (versionName === null) {
        const numbers = [];
        const parentDir = path.dirname(resolvedSource);
        for (const child of _readdirEnts(parentDir)) {
            const m = /^v(\d+)$/.exec(child.name);
            if (m && child.isDirectory()) {
                numbers.push(parseInt(m[1], 10));
            }
        }
        versionName = `v${numbers.length > 0 ? Math.max(...numbers) + 1 : 1}`;
    }
    if (!/^v\d+$/.test(versionName)) {
        throw new Error(`version name must look like v2, v3, ... (got ${JSON.stringify(versionName)})`);
    }

    const target = path.join(path.dirname(resolvedSource), versionName);
    if (_exists(target)) {
        throw new Error(`target version already exists: ${target}`);
    }

    const specs = findSlideSpecs(resolvedSource);
    if (specs === null) {
        throw new Error(`missing ${SLIDE_SPECS_NAME} in ${resolvedSource}`);
    }
    _mkdirs(target);
    _copyFile(specs, path.join(target, SLIDE_SPECS_NAME));

    const sourceOverrides = path.join(resolvedSource, OVERRIDES_SUBDIR);
    const targetOverrides = path.join(target, OVERRIDES_SUBDIR);
    if (_isDir(sourceOverrides)) {
        _copyTree(sourceOverrides, targetOverrides);
    } else {
        _mkdirs(targetOverrides);
    }

    const generated = path.join(target, GENERATED_SUBDIR);
    _mkdirs(generated);
    _writeIfAbsent(
        path.join(generated, "README.md"),
        "# 派生品(_generated)——别手改\n\n"
        + "这是一个干净的新版本。管线产物会在首次运行时写到这里。\n");
    _writeIfAbsent(
        path.join(target, "README.md"),
        `# 这一版(${versionName})\n\n`
        + `源自 \`${path.basename(resolvedSource)}\`，只复制了 \`${SLIDE_SPECS_NAME}\` + \`${OVERRIDES_SUBDIR}/\`。\n`
        + `\`${GENERATED_SUBDIR}/\` 是干净的，旧版本图片/PPTX 没有复制过来。\n`);
    return target;
}


// --- Scaffolder --------------------------------------------------------------
// --init grows a complete, conformant bundle from the SSOT and drops a short
// plain-language README into EVERY directory. Agents never hand-mkdir (that was
// the source of improvisation); a novice opening any folder sees "what goes here
// / what you do". One command = no freelancing, nobody lost.

/** Write content to p only if the file does not already exist. */
function _writeIfAbsent(p, content) {
    if (!_exists(p)) {
        _writeText(p, content);
    }
}

// Per-directory README bodies (novice-facing, plain language). Keyed by the
// relative dir path inside the deck bundle. {NAME} is filled at init time.
const _DIR_READMES = {
    ".": (
        "# {NAME} — 这个 PPT 项目\n\n"
        + "先读 **deck-guide.md**（进来先看那个）。\n\n"
        + "这个文件夹分三层:\n"
        + "- `1_upstream_raw_material/` — 原始素材、调研(你往里堆资料)\n"
        + "- `2_backbone/` — 主干:隐喻/公式/约束/大纲/讲稿/视觉(整个 deck 共享)\n"
        + "- `3_versions/` — 每个版本(你实际改 slide、生成 PPT 的地方)\n\n"
        + "**只改带 README 说'你改这里'的文件。** 结构由 "
        + "`PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs` 定义,别自己新建目录。\n"
    ),
    [UPSTREAM_DIR]: (
        "# 上游:原始素材\n\n"
        + "**这里放什么:** 你的调研、参考资料、事实来源——任何「喂养」这个 deck 的原料。\n"
        + "写着写着发现缺了什么,就往这里补。全版本共享,只增不减。\n\n"
        + "**你做什么:** 往里堆资料(markdown、笔记都行)。怎么分子目录随你。\n"
    ),
    [BACKBONE_DIR]: (
        "# 中游:主干(backbone)\n\n"
        + "**这里放什么:** 整个 deck 的骨架,全版本共享的「默认事实源」:\n"
        + "- `core-metaphor.md` — 核心隐喻\n"
        + "- `core-formula.md` — 核心公式\n"
        + "- `design-constraints.md` — 设计约束(语言/禁忌/文字密度)\n"
        + "- `outline.md` — 大纲主干\n"
        + "- `manuscript/` — 讲稿主干\n"
        + "- `visual-style/` — 视觉主干(见里面的 README)\n\n"
        + "**你做什么:** 改这里 = 影响所有版本。想只改某一版,去那一版的 `overrides/`。\n"
    ),
    [`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}`]: (
        "# 视觉主干\n\n"
        + "**这里放什么:**\n"
        + "- `style-master-prompt.md` — 生成风格母版图的 prompt(源文件,别丢)\n"
        + "- `style_master.jpg` — 风格母版图(每页生图时的视觉锚,必须 .jpg)\n"
        + "- `deck_system.txt` — 文字约束(语言/禁用元素,管线读它)\n"
        + "- `color_palette.json` — 配色 + 标题字号(管线读它)\n\n"
        + "**你做什么:** 改配色/风格改这里。锁定后尽量别动——它是「全 deck 长一样」的根源。\n"
    ),
    [`${BACKBONE_DIR}/${BACKBONE_MANUSCRIPT_SUBDIR}`]: (
        "# 讲稿主干\n\n"
        + "**这里放什么:** 演讲讲稿(可按 part0/part1… 分文件)。全版本共享。\n"
        + "**你做什么:** 写/改讲稿。某一版要单独改讲稿,放那版的 `overrides/manuscript/`。\n"
    ),
    [VERSIONS_DIR]: (
        "# 下游:版本\n\n"
        + "**这里放什么:** 每个版本一个子目录(`v1/`、`v2/`…)。版本就是在这一层切的。\n"
        + "**你做什么:** 在 `v1/` 里改 slide、生成 PPT。要留档就用 "
        + "`bundle_layout.mjs --new-version 3_versions/v1`，它不会复制旧的 `_generated/`。\n"
    ),
    [`${VERSIONS_DIR}/v1`]: (
        "# 这一版(v1)\n\n"
        + "**你改这两处:**\n"
        + "- `slide-specifications.md` — 每一页讲什么(标题、要点、画面描述、render mode)\n"
        + "- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone\n\n"
        + "**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。\n\n"
        + "**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:\n"
        + "`node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs "
        + "--run-dir <这个版本目录> --stage all`\n"
    ),
    [`${VERSIONS_DIR}/v1/${OVERRIDES_SUBDIR}`]: (
        "# 这一版的覆盖(overrides)\n\n"
        + "**这里放什么:** 只放这一版**偏离 backbone** 的东西。空着 = 完全继承 backbone。\n"
        + "- 要这版单独改视觉 → `overrides/visual-style/`(放改动的那几个文件)\n"
        + "- 要这版单独改讲稿 → `overrides/manuscript/`\n\n"
        + "管线取件规则:这里有 → 用这里的;没有 → 回退 backbone。\n"
    ),
    [`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}`]: (
        "# 派生品(_generated)——别手改\n\n"
        + "**这里全是机器生成的**:slide_plan.json、page_prompts/、图片、PPTX。\n"
        + "**不要手改任何东西**——改源文件(slide-specifications.md / backbone)后重跑管线,这里会被覆盖重建。\n"
        + "整个目录可以 `rm -rf` 掉,需要时从源文件重新生成。\n"
    ),
};

/** Scaffold a complete, conformant bundle at deckDir (idempotent).
 *
 * Creates the full 3-tier skeleton, drops a plain-language README in every dir,
 * copies content templates to their canonical spots, and writes the metadata +
 * guide stubs. Returns a list of log lines describing what was created. Existing
 * files are never overwritten (safe to re-run). This is how a bundle is born —
 * agents call this instead of hand-mkdir, so the structure can't be improvised.
 *
 * deckType (optional): seed slide-specifications.md from a deck-type preset
 *   (one of DECK_TYPE_TEMPLATES) instead of the blank template.
 * style (optional): seed 2_backbone/visual-style/ from a style preset (one of
 *   STYLE_PRESETS) — its deck_system.txt + color_palette.json. This is how the
 *   preset lands in its canonical spot deterministically, replacing the old
 *   hand-cp steps (which were the L2 freelancing hole).
 * Both are validated against the SSOT catalogs; an unknown name raises Error.
 */
export function initBundle(deckDir, frameworkDir = null, deckType = null, style = null) {
    if (frameworkDir === null) {
        const __filename = fileURLToPath(import.meta.url);
        frameworkDir = path.resolve(path.dirname(__filename), "..");
    }
    if (deckType !== null && !Object.prototype.hasOwnProperty.call(DECK_TYPE_TEMPLATES, deckType)) {
        throw new Error(
            `unknown deck-type ${JSON.stringify(deckType)}. Allowed: ${Object.keys(DECK_TYPE_TEMPLATES).sort().join(", ")}`);
    }
    if (style !== null && !STYLE_PRESETS.includes(style)) {
        throw new Error(
            `unknown style preset ${JSON.stringify(style)}. Allowed: ${[...STYLE_PRESETS].sort().join(", ")}`);
    }
    const name = path.basename(deckDir).replace(/^deck_/, "");
    const log = [];

    // 1. Directories — derived from the canonical structure tables (one source).
    //    overrides/ starts EMPTY (empty = inherit all from backbone); its
    //    visual-style/ manuscript/ subdirs are created by the author only when a
    //    version actually needs to deviate — pre-creating empty ones would confuse
    //    the override resolver (an empty overrides/visual-style with no files).
    const dirs = [
        ".", UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, `${VERSIONS_DIR}/v1`,
        ...BACKBONE_SUBDIRS_REF.map(sd => `${BACKBONE_DIR}/${sd}`),
        ...VERSION_SUBDIRS.map(sd => `${VERSIONS_DIR}/v1/${sd}`),
    ];
    for (const rel of dirs) {
        const d = rel === "." ? deckDir : path.join(deckDir, rel);
        _mkdirs(d);
    }

    // 2. Per-directory README (novice guidance in EVERY folder).
    for (const [rel, body] of Object.entries(_DIR_READMES)) {
        const d = rel === "." ? deckDir : path.join(deckDir, rel);
        const target = path.join(d, "README.md");
        _writeIfAbsent(target, body.replace(/\{NAME\}/g, name));
        log.push(`README: ${rel}/README.md`);
    }

    // 3. Backbone files — seed from the canonical BACKBONE_FILE_SEEDS table.
    //    Template present → copy it; template null → write a one-line stub. This is
    //    why outline.md can never drift: it's in the SAME table the whitelist reads.
    for (const [fname, tmplRel] of Object.entries(BACKBONE_FILE_SEEDS)) {
        const dest = path.join(deckDir, BACKBONE_DIR, fname);
        if (_exists(dest)) {
            continue;
        }
        const tmpl = tmplRel ? path.join(frameworkDir, tmplRel) : null;
        if (tmpl && _isFile(tmpl)) {
            _copyFile(tmpl, dest);
            log.push(`template: ${BACKBONE_DIR}/${fname}`);
        } else {
            _writeIfAbsent(dest, `# ${fname.replace(/\.md$/, "")}\n\n> 待填。\n`);
            log.push(`stub: ${BACKBONE_DIR}/${fname}`);
        }
    }

    // 4. Slide-specs source → the version dir. A --deck-type picks a preset
    //    template (keynote/pitch/report/training); otherwise the blank template.
    let specsTmpl;
    let specsLabel;
    if (deckType) {
        specsTmpl = path.join(frameworkDir, DECK_TYPE_DIR, DECK_TYPE_TEMPLATES[deckType]);
        specsLabel = `deck-type:${deckType}`;
    } else {
        specsTmpl = path.join(frameworkDir, "02_content_design/template-slide-specifications.md");
        specsLabel = "template";
    }
    const specsDest = path.join(deckDir, VERSIONS_DIR, "v1", SLIDE_SPECS_NAME);
    if (_isFile(specsTmpl) && !_exists(specsDest)) {
        _copyFile(specsTmpl, specsDest);
        log.push(`${specsLabel}: ${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}`);
    }

    // 4b. Visual-style preset → 2_backbone/visual-style/. A --style seeds the
    //     preset's deck_system.txt + color_palette.json (both canonical files, so
    //     the seeded bundle still passes --check). style_master.jpg is NOT seeded —
    //     no preset ships one; it's generated in Phase 2 from style-master-prompt.md.
    if (style) {
        const presetDir = path.join(frameworkDir, STYLE_PRESETS_DIR, style);
        const vsDest = path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
        for (const fname of STYLE_PRESET_FILES) {
            const src = path.join(presetDir, fname);
            const dest = path.join(vsDest, fname);
            if (_isFile(src) && !_exists(dest)) {
                _copyFile(src, dest);
                log.push(`style:${style}: ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${fname}`);
            }
        }
    }

    // 5. Metadata + guide + pointer stubs.
    _writeIfAbsent(
        path.join(deckDir, METADATA_FILE),
        `# ${name} — project metadata\n`
        + `deck_name: ${name}\n`
        + `topic: \naudience: \nlanguage: \none_thing_to_remember: \n`
        + `content_gate: pending\nvisual_gate: pending\n`);
    _writeIfAbsent(
        path.join(deckDir, POINTER_FILE),
        `# ${name}\n\n进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。`
        + `目录结构的权威源:\`PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs\`。\n`);
    const pipelineScript = path.join(frameworkDir, "06_reference_scripts/unified_pipeline.py");
    const versionScript = path.join(frameworkDir, "06_reference_scripts/bundle_layout.mjs");
    _writeIfAbsent(
        path.join(deckDir, GUIDE_FILE),
        `# ${path.basename(deckDir)} — 这个 PPT 项目怎么用\n\n`
        + `> 当前版本：\`v1\`。先改源文件，再让管线重建；不要直接改 \`_generated/\`。\n\n`
        + `## 你改哪里\n\n`
        + `- 每页内容：\`${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}\`\n`
        + `- 整体主线：\`${BACKBONE_DIR}/${BACKBONE_METAPHOR}\` + \`${BACKBONE_DIR}/${BACKBONE_FORMULA}\`\n`
        + `- 视觉主干：\`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/\`\n`
        + `- 原始材料：\`${UPSTREAM_DIR}/\`\n\n`
        + `用户确认内容/视觉闸门后，把 \`${METADATA_FILE}\` 中对应的 `
        + `\`content_gate\` / \`visual_gate\` 改为 \`approved\`；若用户明确跳过则写 \`waived\`。`
        + `Stage 2 会自动检查。\n\n`
        + `## 当前进度\n\n`
        + `查看 \`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}/\`：有 \`slide_plan.json\` 表示 Stage 1 完成；`
        + `有 \`ppt/${name}.pptx\` 表示交付物已生成。\n\n`
        + `## 从项目根目录运行\n\n`
        + `\`\`\`bash\n`
        + `# 首次先解析；再让 Agent 选 3 张代表页做 pilot\n`
        + `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 1\n`
        + `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 2 `
        + `--only opener_id,content_id,closer_id --resolution 1k\n`
        + `\n# Pilot 通过后全量生产\n`
        + `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 2 `
        + `--resolution 2k --force-images\n`
        + `uv run python "${pipelineScript}" --run-dir "${deckDir}/${VERSIONS_DIR}/v1" --stage 3,4,5\n`
        + `\n# 新建干净版本（不复制旧图片/PPTX）\n`
        + `node "${versionScript}" --new-version "${deckDir}/${VERSIONS_DIR}/v1"\n`
        + `\`\`\`\n\n`
        + `用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。\n`);
    log.push(`project files: ${METADATA_FILE}, ${POINTER_FILE}, ${GUIDE_FILE}`);

    // 6. Credentials + deps homes (so a first-time user knows WHERE things go).
    //    .env.example documents the image-gen key + base URL; copy it to `.env` and
    //    fill it ONCE — every run loads `.env` automatically (see loadDotenv). Var
    //    names are the framework-facing OPENAI_API_KEY / OPENAI_BASE_URL convention.
    //    The wrappers bridge these to the installed skill's native variable names;
    //    supplier API-contract differences still belong in the skill adapter.
    _writeIfAbsent(
        path.join(deckDir, ".env.example"),
        "# 图像生成凭据（Stage 2 需要——没有 key 就生不了图，PPT 做不出来）。\n"
        + "# 复制本文件为 .env 并填好；每次跑管线会自动加载 .env（填一次即可）。\n\n"
        + "# 框架统一入口变量；wrapper 会桥接到当前 image skill 的原生变量：\n"
        + "OPENAI_API_KEY=            # 必填：你的图像 API key\n"
        + "OPENAI_BASE_URL=           # 可选：API 端点，如 https://<relay>/v1（留空用默认）\n\n"
        + "# （若你的中转原生用别的变量名，直接填 APIMART_API_KEY / APIMART_BASE_URL 也认。）\n");
    _writeIfAbsent(
        path.join(deckDir, "pyproject.toml"),
        `[project]\nname = "deck-${name}"\nversion = "0.0.0"\n`
        + `requires-python = ">=3.11"\n`
        + `dependencies = [\n`
        + `    "python-pptx>=1.0",   # Stage 4/5 (pulls Pillow)\n`
        + `    "Pillow>=10.0",       # Stage 3 header overlay\n`
        + `    "httpx>=0.27",        # Stage 2 image skill HTTP client\n`
        + `]\n\n[tool.uv]\npackage = false\n`);
    _writeIfAbsent(
        path.join(deckDir, ".gitignore"),
        "# secrets — never commit your API key\n.env\n"
        + "# environments / caches\n.venv/\n__pycache__/\n"
        + "# generated artifacts (regenerable from source)\n"
        + `${VERSIONS_DIR}/*/${GENERATED_SUBDIR}/\n`);
    log.push("credentials/deps: .env.example, pyproject.toml, .gitignore");

    return log;
}


// --- Canonical tree renderer (docs generate/validate against this) -----------

/** Return the canonical run-bundle tree as text. The docs must match this
 * exactly — generate or validate `01-directory-template.md` against it so the
 * human-facing tree can never drift from the code.
 */
export function renderTree() {
    return `\
deck_{NAME}/
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


// --- Self-check --------------------------------------------------------------

/** Assert the SSOT is internally self-consistent.
 *
 * renderTree() interpolates the constants directly, so a displayed name literally
 * IS its constant — that pair cannot drift. The real risks are (a) two SEPARATE
 * tables disagreeing, and (b) a name hardcoded as a literal somewhere instead of
 * interpolated. This checks exactly those:
 *   1. every backbone-seed / subdir is in the whitelist (init ⊆ check);
 *   2. the slide-specs glob derives from the canonical name;
 *   3. renderTree() contains no stale hardcoded canonical filename (it must
 *      interpolate, so the literal spelling must still equal the constant);
 *   4. every file a --style seed contributes is a canonical visual-style file;
 *   5. the preset catalogs (STYLE_PRESETS / DECK_TYPE_TEMPLATES) agree with disk
 *      — no declared preset missing, no undeclared preset dir present.
 * Returns drift problems (empty = consistent). Run in CI / before release.
 */
export function selfCheck() {
    const problems = [];

    // 1. Cross-table: everything init seeds/creates must pass its own --check.
    for (const fname of Object.keys(BACKBONE_FILE_SEEDS)) {
        if (!_ALLOWED_IN_BACKBONE.has(fname)) {
            problems.push(`init seeds ${fname} but whitelist forbids it in ${BACKBONE_DIR}/`);
        }
    }
    for (const sd of BACKBONE_SUBDIRS_REF) {
        if (!_ALLOWED_IN_BACKBONE.has(sd)) {
            problems.push(`init creates ${sd}/ but whitelist forbids it in ${BACKBONE_DIR}/`);
        }
    }
    for (const f of VISUAL_STYLE_FILES) {
        if (!_ALLOWED_IN_VISUAL_STYLE.has(f)) {
            problems.push(`canonical visual-style file ${f} not in its whitelist`);
        }
    }

    // 2. The glob must match the canonical slide-specs name.
    if (!_fnmatch(SLIDE_SPECS_NAME, SLIDE_SPECS_GLOB)) {
        problems.push(`SLIDE_SPECS_GLOB ${JSON.stringify(SLIDE_SPECS_GLOB)} does not match SLIDE_SPECS_NAME ${JSON.stringify(SLIDE_SPECS_NAME)}`);
    }

    // 3. renderTree() must render (no missing constant / undefined) and must show
    //    each top-tier dir + the slide-specs name (guards against someone replacing
    //    an {interpolation} with a stale literal).
    const tree = renderTree();
    for (const n of [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SLIDE_SPECS_NAME]) {
        if (!tree.includes(n)) {
            problems.push(`renderTree() is missing canonical entry ${JSON.stringify(n)} (stale hardcoded literal?)`);
        }
    }

    // 4. Every file a --style seed contributes MUST be a canonical visual-style
    //    file, else the seed would fail its own --check.
    for (const fname of STYLE_PRESET_FILES) {
        if (!_ALLOWED_IN_VISUAL_STYLE.has(fname)) {
            problems.push(
                `STYLE_PRESET_FILES has ${JSON.stringify(fname)} but it is not a canonical visual-style file `
                + `— a --style seed would then fail --check`);
        }
    }

    // 5. Preset catalogs must agree with disk (the catalog is the SSOT for preset
    //    names; a preset dir added/removed/renamed without updating the table — or
    //    vice versa — is exactly the kind of drift this alarm exists to catch).
    const __filename = fileURLToPath(import.meta.url);
    const fwDir = path.resolve(path.dirname(__filename), "..");
    for (const presetName of STYLE_PRESETS) {
        const pdir = path.join(fwDir, STYLE_PRESETS_DIR, presetName);
        if (!_isDir(pdir)) {
            problems.push(`STYLE_PRESETS lists ${JSON.stringify(presetName)} but ${STYLE_PRESETS_DIR}/${presetName}/ is missing`);
            continue;
        }
        for (const fname of STYLE_PRESET_FILES) {
            if (!_isFile(path.join(pdir, fname))) {
                problems.push(`style preset ${JSON.stringify(presetName)} is missing ${fname} (${STYLE_PRESETS_DIR}/${presetName}/)`);
            }
        }
    }
    const presetsRoot = path.join(fwDir, STYLE_PRESETS_DIR);
    if (_isDir(presetsRoot)) {
        const onDisk = new Set(
            _readdirEnts(presetsRoot)
                .filter(e => e.isDirectory())
                .map(e => e.name)
        );
        const declared = new Set(STYLE_PRESETS);
        for (const extra of [...onDisk].filter(n => !declared.has(n)).sort()) {
            problems.push(
                `${STYLE_PRESETS_DIR}/${extra}/ exists on disk but is not declared in STYLE_PRESETS`);
        }
    }
    for (const [dname, tmpl] of Object.entries(DECK_TYPE_TEMPLATES)) {
        if (!_isFile(path.join(fwDir, DECK_TYPE_DIR, tmpl))) {
            problems.push(`DECK_TYPE_TEMPLATES lists ${JSON.stringify(dname)} → ${tmpl} but ${DECK_TYPE_DIR}/${tmpl} is missing`);
        }
    }

    return problems;
}


// --- CLI ---------------------------------------------------------------------
// Modes:
//   node bundle_layout.mjs                      → print the canonical tree
//   node bundle_layout.mjs --init <dir>         → scaffold a full bundle (skeleton + per-dir README + templates)
//        [--deck-type keynote|pitch|report|training]  seed slide-specifications.md from a deck-type preset
//        [--style <preset>]                            seed visual-style/ from a style preset
//   node bundle_layout.mjs --new-version <vN>  → copy source delta only; never _generated/
//   node bundle_layout.mjs --check <dir>        → enforce the constitution on a version dir
//   node bundle_layout.mjs --self-check         → assert tree/whitelist/init/presets agree (drift alarm)

function _printUsage() {
    console.log(
        `bundle_layout.mjs — Run-bundle structure SSOT.

Usage:
  node bundle_layout.mjs                           Print the canonical tree
  node bundle_layout.mjs --init <DECK_DIR>         Scaffold a full conformant bundle
         [--deck-type keynote|pitch|report|training]  Seed slide-specifications from a deck-type preset
         [--style <preset>]                            Seed visual-style/ from a style preset
  node bundle_layout.mjs --new-version <SOURCE>    Create next clean version
         [--version-name vN]                          Explicit target version name
  node bundle_layout.mjs --check <RUN_DIR>         Validate a version dir against the constitution
         [--structure-only]                           Verify STRUCTURE only (skip pipeline readiness)
  node bundle_layout.mjs --self-check              Assert tree/whitelist/init/presets agree`
    );
}

function _main() {
    const rawArgs = process.argv.slice(2);

    // Parse flags (value-bearing and boolean)
    const flag = {};
    let i = 0;
    while (i < rawArgs.length) {
        const a = rawArgs[i];
        if (a === "--init" || a === "--check" || a === "--new-version"
            || a === "--deck-type" || a === "--style" || a === "--version-name") {
            if (i + 1 < rawArgs.length) {
                flag[a.slice(2)] = rawArgs[i + 1];
                i += 2;
            } else {
                console.error(`✗ ${a} requires a value.`);
                process.exit(1);
            }
        } else if (a === "--self-check" || a === "--structure-only") {
            flag[a.slice(2)] = true;
            i += 1;
        } else if (a === "--help" || a === "-h") {
            _printUsage();
            process.exit(0);
        } else {
            i += 1; // unrecognized — skip
        }
    }

    // Validate flag combinations
    if ((flag["deck-type"] || flag.style) && !flag.init) {
        console.error("✗ --deck-type / --style only apply together with --init.");
        process.exit(1);
    }
    if (flag["version-name"] && !flag["new-version"]) {
        console.error("✗ --version-name only applies together with --new-version.");
        process.exit(1);
    }
    const primaryModes = [flag.init, flag.check, flag["new-version"], flag["self-check"]].filter(Boolean).length;
    if (primaryModes > 1) {
        console.error("✗ choose only one of --init, --check, --new-version, or --self-check.");
        process.exit(1);
    }
    if (flag["structure-only"] && !flag.check) {
        console.error("✗ --structure-only only applies together with --check.");
        process.exit(1);
    }

    // --self-check
    if (flag["self-check"]) {
        const drift = selfCheck();
        if (drift.length > 0) {
            console.log(`✗ SSOT self-inconsistency — ${drift.length} drift problem(s):`);
            for (const d of drift) {
                console.log(`  - ${d}`);
            }
            process.exit(1);
        }
        console.log("✓ SSOT self-consistent: renderTree / whitelist / init all agree.");
        process.exit(0);
    }

    // --init
    if (flag.init) {
        const deckDir = path.resolve(flag.init);
        if (!path.basename(deckDir).startsWith("deck_")) {
            console.error(`✗ deck dir name must start with 'deck_' (Stage 4 derives the .pptx name from it); `
                + `got: ${path.basename(deckDir)}`);
            process.exit(1);
        }
        // A run bundle must NOT live inside the framework (soft bundle). A bare
        // relative name resolves into the framework dir — reject that.
        const __filename = fileURLToPath(import.meta.url);
        const fwDir = path.resolve(path.dirname(__filename), "..");
        const resolvedFw = path.resolve(fwDir);
        const resolvedDeck = path.resolve(deckDir);
        // Check if deckDir is under the framework directory by walking up parents.
        let isUnderFw = false;
        let p = resolvedDeck;
        while (true) {
            const parent = path.dirname(p);
            if (parent === p) break;
            if (parent === resolvedFw) { isUnderFw = true; break; }
            p = parent;
        }
        if (isUnderFw || resolvedDeck === resolvedFw) {
            console.error(`✗ refusing to scaffold inside the framework (${path.basename(resolvedFw)}/). `
                + `A run bundle is a separate project — give an absolute path or a path outside `
                + `the framework, e.g.  --init ~/decks/${path.basename(deckDir)}`);
            process.exit(1);
        }
        const created = initBundle(deckDir, null, flag["deck-type"] || null, flag.style || null);
        const seeded = [];
        if (flag["deck-type"]) seeded.push(`deck-type=${flag["deck-type"]}`);
        if (flag.style) seeded.push(`style=${flag.style}`);
        const suffix = seeded.length > 0 ? ` [${seeded.join(", ")}]` : "";
        console.log(`✓ Scaffolded bundle at ${deckDir} (${created.length} items)${suffix}:`);
        for (const line of created) {
            console.log(`  + ${line}`);
        }
        console.log(`\nNext: fill 2_backbone/ + 3_versions/v1/slide-specifications.md, then run the pipeline.`);
        const selfPath = fileURLToPath(import.meta.url);
        console.log(`Verify anytime:  node ${selfPath} --check ${deckDir}/${VERSIONS_DIR}/v1`);
        process.exit(0);
    }

    // --new-version
    if (flag["new-version"]) {
        try {
            const target = createVersion(flag["new-version"], flag["version-name"] || null);
            console.log(`✓ Created clean version: ${target}`);
            console.log(`  Copied: ${SLIDE_SPECS_NAME} + ${OVERRIDES_SUBDIR}/`);
            console.log(`  Reset:  ${GENERATED_SUBDIR}/ (no stale images, JSON, or PPTX)`);
        } catch (exc) {
            console.error(`✗ ${exc.message}`);
            process.exit(1);
        }
        process.exit(0);
    }

    // --check
    if (flag.check) {
        const runDir = path.resolve(flag.check);
        const ready = !flag["structure-only"];
        const violations = checkBundle(runDir, ready);
        const scope = flag["structure-only"] ? "structure" : "structure + pipeline-readiness";
        if (violations.length > 0) {
            console.log(`✗ Bundle does NOT conform (${scope}) — ${violations.length} violation(s):`);
            for (const v of violations) {
                console.log(`  - ${v}`);
            }
            console.log("\nThe structure is the constitution. Fix these, or see the canonical tree:");
            console.log("  node bundle_layout.mjs");
            process.exit(1);
        }
        const note = ready ? "" : "  (pipeline assets and Phase approvals are not required at this gate.)";
        console.log(`✓ ${runDir} conforms (${scope}).${note}`);
        process.exit(0);
    }

    // Default: print the canonical tree (handy for humans and for regenerating docs).
    console.log(renderTree());
}

// Run CLI when executed directly (not imported).
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    _main();
}
