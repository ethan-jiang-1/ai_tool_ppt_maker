/**
 * bundle_validator.mjs — run-bundle constitution validation.
 *
 * Separated from bundle_layout.mjs to keep the SSOT file focused on path
 * constants and resolvers. This file imports path constants and resolvers
 * from bundle_layout.mjs at function-call time (no top-level side effects),
 * so the circular dependency with bundle_layout.mjs (which re-exports these
 * validators) is safe.
 *
 * Authority: openspec/specs/run-bundle-layout/spec.md
 * Authority: openspec/specs/run-bundle-management/spec.md
 */

import fs from "node:fs";
import path from "node:path";

import {
    PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE,
    isPageImageWorkflowSelectionPending, probeProductionMarker,
} from "./production_marker.mjs";
import {
    GENERATED_SUBDIR, GEN_PAGE_IMAGE_WORKFLOW_SUBDIR, GEN_PAGE_IMAGE_NAV_SUBDIR,
    STYLE_MASTER_STAGING_SUBDIR, STYLE_MASTER_PLANS_SUBDIR, STYLE_MASTER_SCOPES_SUBDIR,
    pageImageStyleMasterPaths,
    PAGE_PRODUCTION_STAGING_SUBDIR, PAGE_PRODUCTION_PLANS_SUBDIR, PAGE_PRODUCTION_SCOPES_SUBDIR,
    pageImageProgressiveRawPaths, SLIDE_SPECS_NAME, VERSIONS_DIR,
} from "./page_image_paths.mjs";
import { STYLE_MASTER_IMAGE, styleMasterLocalSourcePath } from "./style_master_media.mjs";
import {
    deckRoot, styleAsset, findSlideSpecs, isVersionDir,
    UPSTREAM_DIR, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, BACKBONE_ASSETS_SUBDIR,
    BACKBONE_MANUSCRIPT_SUBDIR, BACKBONE_STORY_OUTLINE,
    BACKBONE_SUBDIRS, BACKBONE_OPTIONAL,
    VISUAL_STYLE_FILES, VISUAL_STYLE_OPTIONAL,
    PAGE_IMAGE_PRESENTATION_SUBDIR, PAGE_IMAGE_PRESENTATION_FILES,
    ASSET_MANIFEST_FILE, PAGE_DESIGN_SYSTEM_FILE, IMAGE2_PROVIDER_PROFILE_FILE,
    OVERRIDES_SUBDIR, SLIDE_SPECS_GLOB, SCRATCH_SUBDIR, POLISH_SUBDIR,
    LAB_DIR, GUIDE_FILE, POINTER_FILE, METADATA_FILE,
    DECK_ROOT_ALLOWED, VERSION_SUBDIRS,
    BACKBONE_FILE_SEEDS,
    STYLE_PRESETS, STYLE_PRESETS_DIR, DECK_TYPE_TEMPLATES, DECK_TYPE_DIR,
    renderTree,
    _ALLOWED_IN_BACKBONE, _ALLOWED_IN_VISUAL_STYLE, _ALLOWED_IN_ASSETS,
    _ALLOWED_IN_PAGE_IMAGE_PRESENTATION,
} from "./bundle_layout.mjs";

// ---------------------------------------------------------------------------
// --- Private helpers -------------------------------------------------------
// ---------------------------------------------------------------------------

function _ignorable(name) { return name.startsWith('.') || name === '__pycache__'; }
function _isMacOsSystemEntry(name) { return name === '.DS_Store'; }
function _realDirectory(p) { try { const s = fs.lstatSync(p); return s.isDirectory() && !s.isSymbolicLink(); } catch { return false; } }
function _realFile(p) { try { const s = fs.lstatSync(p); return s.isFile() && !s.isSymbolicLink(); } catch { return false; } }

function _crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let b = 0; b < 8; b += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
    return (crc ^ 0xffffffff) >>> 0;
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function _validStyleMasterPng(bytes) {
    if (!Buffer.isBuffer(bytes) || bytes.length < 45 || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return false;
    let offset = PNG_SIGNATURE.length, sawIhdr = false;
    while (offset + 12 <= bytes.length) {
        const len = bytes.readUInt32BE(offset), next = offset + 12 + len;
        if (next > bytes.length) return false;
        const t = bytes.subarray(offset + 4, offset + 8);
        if (_crc32(bytes.subarray(offset + 4, offset + 8 + len)) !== bytes.readUInt32BE(offset + 8 + len)) return false;
        if (!sawIhdr) { if (t.toString('ascii') !== 'IHDR' || len !== 13 || bytes.readUInt32BE(offset + 8) === 0 || bytes.readUInt32BE(offset + 12) === 0) return false; sawIhdr = true; }
        if (t.toString('ascii') === 'IEND') return sawIhdr && len === 0 && next === bytes.length;
        offset = next;
    }
    return false;
}

function _globToRegex(glob) {
    return new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
}

function _checkPageImageGeneratedOwnership(runDir, problems) {
    const g = path.join(runDir, GENERATED_SUBDIR);
    if (!fs.existsSync(g) || !fs.statSync(g).isDirectory()) return;
    for (const e of fs.readdirSync(g, { withFileTypes: true })) {
        if (_isMacOsSystemEntry(e.name)) continue;
        if (e.name === 'README.md' && e.isFile()) continue;
        if (![GEN_PAGE_IMAGE_WORKFLOW_SUBDIR, GEN_PAGE_IMAGE_NAV_SUBDIR].includes(e.name) || !e.isDirectory())
            problems.push(`unexpected current generated owner '${e.name}' — Page Image owns ${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/ and ${GEN_PAGE_IMAGE_NAV_SUBDIR}/ only`);
    }
}

function checkPageImagePresentationLayout(presPath, { required, scope }) {
    const p = [];
    if (!fs.existsSync(presPath)) { if (required) p.push(`missing canonical Page Image presentation package at ${scope}`); return p; }
    if (!fs.statSync(presPath).isDirectory()) { p.push(`Page Image presentation package at ${scope} must be a directory`); return p; }
    const entries = new Map(fs.readdirSync(presPath, { withFileTypes: true }).map(e => [e.name, e]));
    for (const [name, e] of entries) {
        if (_ignorable(name)) continue;
        if (!_ALLOWED_IN_PAGE_IMAGE_PRESENTATION.has(name) || (name !== 'README.md' && !e.isFile()))
            p.push(`unexpected '${name}' in ${scope} — allowed source files: ${[...PAGE_IMAGE_PRESENTATION_FILES].join(', ')}`);
    }
    if (required) for (const f of PAGE_IMAGE_PRESENTATION_FILES) { if (!entries.get(f)?.isFile()) p.push(`missing canonical Page Image presentation source ${f} at ${scope}`); }
    return p;
}

// ---------------------------------------------------------------------------
// --- Public validator functions --------------------------------------------
// ---------------------------------------------------------------------------

export function normalizeCheckMode(mode = true) {
    if (mode === false || mode === 'structure') return 'structure';
    if (mode === 'preview') return 'preview';
    if (mode === true || mode === 'pipeline') return 'pipeline';
    throw new Error(`checkBundle mode must be structure|preview|pipeline or boolean; got: ${mode}`);
}

export function checkStyleMasterLocalPng(runDir) {
    const p = []; const pp = styleAsset(runDir, STYLE_MASTER_IMAGE);
    if (!fs.existsSync(pp)) return p;
    if (!_realFile(pp)) { p.push(`Style Master local PNG source must be a regular file at ${pp}`); return p; }
    try { const bytes = fs.readFileSync(pp); if (!_validStyleMasterPng(bytes)) p.push(`Style Master local PNG source must be a CRC-valid PNG at ${pp}`); }
    catch { p.push(`Style Master local PNG source is unreadable at ${pp}`); }
    return p;
}

export function checkStyleMasterHistoryLayout(runDir) {
    let paths;
    try { paths = pageImageStyleMasterPaths(runDir); } catch (e) { return [e.message]; }
    if (!fs.existsSync(paths.history_root)) return [];
    const p = []; const ur = path.join(paths.deck_root, UPSTREAM_DIR);
    for (const [pn, lbl] of [[paths.deck_root, 'deck root'], [ur, UPSTREAM_DIR], [paths.history_root, 'Style Master history root']]) {
        if (!_realDirectory(pn)) { p.push(`${lbl} must be a real directory for confined Style Master history`); return p; }
    }
    for (const e of fs.readdirSync(paths.history_root, { withFileTypes: true })) {
        if (_ignorable(e.name)) continue;
        const t = path.join(paths.history_root, e.name);
        if ([STYLE_MASTER_STAGING_SUBDIR, STYLE_MASTER_PLANS_SUBDIR, STYLE_MASTER_SCOPES_SUBDIR].includes(e.name)) { if (!_realDirectory(t)) p.push(`Style Master ${e.name}/ must be a real confined directory`); continue; }
        p.push(`unexpected '${e.name}' in Style Master history; only ${STYLE_MASTER_STAGING_SUBDIR}/, ${STYLE_MASTER_PLANS_SUBDIR}/, and ${STYLE_MASTER_SCOPES_SUBDIR}/ are canonical`);
    }
    for (const [root, label, re] of [[paths.staging_root, 'staging', /^plan-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/], [paths.plans_root, 'plans', /^(?:[0-9a-f]{8}|[0-9a-f]{64})$/]]) {
        if (!_realDirectory(root)) continue;
        for (const e of fs.readdirSync(root, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!re.test(e.name) || !e.isDirectory() || e.isSymbolicLink()) p.push(`Style Master ${label} contains noncanonical entry '${e.name}'`); }
    }
    if (_realDirectory(paths.scopes_root)) {
        for (const v of fs.readdirSync(paths.scopes_root, { withFileTypes: true })) {
            if (_ignorable(v.name)) continue; const vp = path.join(paths.scopes_root, v.name);
            if (!/^v[0-9]+$/.test(v.name) || !v.isDirectory() || v.isSymbolicLink()) { p.push(`Style Master scopes contains noncanonical version '${v.name}'`); continue; }
            for (const w of fs.readdirSync(vp, { withFileTypes: true })) {
                if (_ignorable(w.name)) continue; const wp = path.join(vp, w.name);
                if (!['framed', 'pure'].includes(w.name) || !w.isDirectory() || w.isSymbolicLink()) { p.push(`Style Master scope ${v.name} contains noncanonical workflow '${w.name}'`); continue; }
                for (const e of fs.readdirSync(wp, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (e.name !== 'head.json' || !e.isFile() || e.isSymbolicLink()) p.push(`Style Master scope ${v.name}/${w.name} may contain only mutable head.json`); }
            }
        }
    }
    return p;
}

export function checkProgressivePageProductionHistoryLayout(runDir) {
    let paths;
    try { paths = pageImageProgressiveRawPaths(runDir); } catch (e) { return [e.message]; }
    if (!fs.existsSync(paths.history_root)) return [];
    const p = []; const ur = path.join(paths.deck_root, UPSTREAM_DIR);
    for (const [pn, lbl] of [[paths.deck_root, 'deck root'], [ur, UPSTREAM_DIR], [paths.history_root, 'progressive page-production history root']]) {
        if (!_realDirectory(pn)) { p.push(`${lbl} must be a real directory`); return p; }
    }
    for (const e of fs.readdirSync(paths.history_root, { withFileTypes: true })) {
        if (_ignorable(e.name)) continue; const t = path.join(paths.history_root, e.name);
        if ([PAGE_PRODUCTION_STAGING_SUBDIR, PAGE_PRODUCTION_PLANS_SUBDIR, PAGE_PRODUCTION_SCOPES_SUBDIR].includes(e.name)) { if (!_realDirectory(t)) p.push(`progressive ${e.name}/ must be a real confined directory`); continue; }
        p.push(`unexpected '${e.name}' in progressive history`);
    }
    for (const [root, re] of [[paths.staging_root, /^(?:plan|record|materialization)-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/], [paths.plans_root, /^(?:[0-9a-f]{8}|[0-9a-f]{64})$/]]) {
        if (!_realDirectory(root)) continue;
        for (const e of fs.readdirSync(root, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!re.test(e.name) || !e.isDirectory() || e.isSymbolicLink()) p.push(`progressive page-production contains noncanonical entry '${e.name}'`); }
    }
    if (_realDirectory(paths.scopes_root)) {
        for (const v of fs.readdirSync(paths.scopes_root, { withFileTypes: true })) {
            if (_ignorable(v.name)) continue; const vp = path.join(paths.scopes_root, v.name);
            if (!/^v[0-9]+$/.test(v.name) || !v.isDirectory() || v.isSymbolicLink()) { p.push(`progressive scopes contains noncanonical version '${v.name}'`); continue; }
            for (const w of fs.readdirSync(vp, { withFileTypes: true })) {
                if (_ignorable(w.name)) continue; const wp = path.join(vp, w.name);
                if (!['framed', 'pure'].includes(w.name) || !w.isDirectory() || w.isSymbolicLink()) { p.push(`progressive scope ${v.name} contains noncanonical workflow '${w.name}'`); continue; }
                for (const e of fs.readdirSync(wp, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (e.name !== 'head.json' || !e.isFile() || e.isSymbolicLink()) p.push(`progressive scope ${v.name}/${w.name} may contain only mutable head.json`); }
            }
        }
    }
    return p;
}

export function checkDeckRootControls(root, { allowRepairableLabAbsence = false } = {}) {
    const p = [];
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return [`deck root not found: ${root}`];
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
        if (_ignorable(e.name)) continue;
        if (!DECK_ROOT_ALLOWED.has(e.name)) p.push(`unexpected '${e.name}' at deck root — root is the strictest layer. Allowed: ${[...DECK_ROOT_ALLOWED].sort().join(', ')}.`);
    }
    for (const f of [GUIDE_FILE, POINTER_FILE, METADATA_FILE]) { const fp = path.join(root, f); if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) p.push(`missing deck root control file: ${f}`); }
    for (const [dir, label] of [[UPSTREAM_DIR, 'upstream'], [BACKBONE_DIR, 'midstream']]) { const dp = path.join(root, dir); if (!fs.existsSync(dp) || !fs.statSync(dp).isDirectory()) p.push(`missing shared ${label} dir: ${dir}/`); }
    const vs = path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
    if (!fs.existsSync(vs) || !fs.statSync(vs).isDirectory()) p.push(`missing canonical ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ dir`);
    const lab = path.join(root, LAB_DIR); let labPresent = false, labOrdinary = false;
    try { const s = fs.lstatSync(lab); labPresent = true; labOrdinary = s.isDirectory() && !s.isSymbolicLink(); } catch {}
    if (!labPresent) { if (!allowRepairableLabAbsence) p.push(`missing repairable Image2 Lab workspace: ${LAB_DIR}/`); }
    else if (!labOrdinary) p.push(`missing repairable Image2 Lab workspace: ${LAB_DIR}/`);
    return p;
}

export function checkBundle(runDir, requirePipelineReady = true) {
    const mode = normalizeCheckMode(requirePipelineReady), p = [];
    if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) return [`run dir not found: ${runDir}`];
    if (!isVersionDir(runDir)) { p.push(`--run-dir must be a version dir inside ${VERSIONS_DIR}/`); return p; }
    const root = deckRoot(runDir);
    const canonicalSource = path.join(runDir, SLIDE_SPECS_NAME);
    const sourceCandidate = fs.existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(runDir);
    let currentPageImage = false, branchValid = true;
    if (sourceCandidate) {
        const marker = probeProductionMarker(fs.readFileSync(sourceCandidate), { source: path.basename(sourceCandidate) });
        if (isPageImageWorkflowSelectionPending(marker)) { currentPageImage = false; p.push(PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE); }
        else if (marker.branch === 'invalid') { branchValid = false; for (const e of marker.issues) p.push(`invalid production marker: ${e.message}`); }
        else if (marker.branch === PAGE_IMAGE_WORKFLOW_PIPELINE) currentPageImage = true;
        else { branchValid = false; p.push('unsupported production source cannot pass normal bundle validation'); }
    }
    const needGates = branchValid && currentPageImage && mode === 'pipeline';
    p.push(...checkDeckRootControls(root));
    p.push(...checkStyleMasterLocalPng(runDir), ...checkStyleMasterHistoryLayout(runDir), ...checkProgressivePageProductionHistoryLayout(runDir));
    if (needGates) {
        const mp = path.join(root, METADATA_FILE);
        if (fs.existsSync(mp) && fs.statSync(mp).isFile()) {
            const fields = {};
            for (const l of fs.readFileSync(mp, 'utf-8').split('\n')) { if (l.includes(':') && !l.trimStart().startsWith('#')) { const ci = l.indexOf(':'); fields[l.slice(0, ci).trim()] = l.slice(ci + 1).trim().toLowerCase(); } }
            for (const g of ['content_gate', 'visual_gate']) { if (fields[g] !== 'approved' && fields[g] !== 'waived') p.push(`${g} is not approved/waived in ${METADATA_FILE}`); }
        }
    }
    if (!findSlideSpecs(runDir)) p.push(`missing ${SLIDE_SPECS_GLOB} in the version dir ${runDir}`);
    for (const e of fs.readdirSync(runDir, { withFileTypes: true })) {
        if (_ignorable(e.name)) continue;
        const isSS = e.isFile() && e.name.startsWith('slide-specifications') && e.name.endsWith('.md');
        if (isSS || e.name === OVERRIDES_SUBDIR || e.name === GENERATED_SUBDIR || e.name === SCRATCH_SUBDIR || e.name === POLISH_SUBDIR || e.name === 'README.md') continue;
        p.push(`unexpected '${e.name}' at version root — not part of the canonical structure.`);
    }
    const bb = path.join(root, BACKBONE_DIR);
    if (fs.existsSync(bb) && fs.statSync(bb).isDirectory()) {
        for (const e of fs.readdirSync(bb, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!_ALLOWED_IN_BACKBONE.has(e.name)) p.push(`unexpected '${e.name}' in ${BACKBONE_DIR}/ — not canonical.`); }
    }
    const vs = path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
    if (fs.existsSync(vs) && fs.statSync(vs).isDirectory()) {
        for (const e of fs.readdirSync(vs, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!_ALLOWED_IN_VISUAL_STYLE.has(e.name)) p.push(`unexpected '${e.name}' in ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ — not canonical.`); }
        const as = path.join(vs, BACKBONE_ASSETS_SUBDIR);
        if (fs.existsSync(as) && fs.statSync(as).isDirectory()) { for (const e of fs.readdirSync(as, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!_ALLOWED_IN_ASSETS.has(e.name)) p.push(`unexpected '${e.name}' in ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}/ — not canonical.`); } }
        p.push(...checkPageImagePresentationLayout(path.join(vs, PAGE_IMAGE_PRESENTATION_SUBDIR), { required: true, scope: `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_IMAGE_PRESENTATION_SUBDIR}/` }));
    }
    const ov = path.join(runDir, OVERRIDES_SUBDIR);
    if (fs.existsSync(ov) && fs.statSync(ov).isDirectory()) {
        const allowed = new Set([BACKBONE_STYLE_SUBDIR, BACKBONE_MANUSCRIPT_SUBDIR, 'README.md']);
        for (const e of fs.readdirSync(ov, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!allowed.has(e.name)) p.push(`unexpected '${e.name}' in ${OVERRIDES_SUBDIR}/`); }
        const ovs = path.join(ov, BACKBONE_STYLE_SUBDIR);
        if (fs.existsSync(ovs) && fs.statSync(ovs).isDirectory()) {
            for (const e of fs.readdirSync(ovs, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!_ALLOWED_IN_VISUAL_STYLE.has(e.name)) p.push(`unexpected '${e.name}' in override visual-style/`); }
            const ova = path.join(ovs, BACKBONE_ASSETS_SUBDIR);
            if (fs.existsSync(ova) && fs.statSync(ova).isDirectory()) { for (const e of fs.readdirSync(ova, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!_ALLOWED_IN_ASSETS.has(e.name)) p.push(`unexpected '${e.name}' in override visual-style/assets/`); } }
        }
    }
    _checkPageImageGeneratedOwnership(runDir, p);
    return p;
}

export function checkStagedVersion(stagingRunDir) {
    const p = [];
    const required = [OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR];
    const src = path.join(stagingRunDir, SLIDE_SPECS_NAME);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) p.push(`missing staged ${SLIDE_SPECS_NAME}`);
    for (const n of required) { const t = path.join(stagingRunDir, n); if (!fs.existsSync(t) || !fs.statSync(t).isDirectory()) p.push(`missing staged ${n}/`); }
    for (const n of [GENERATED_SUBDIR, SCRATCH_SUBDIR]) { const t = path.join(stagingRunDir, n); if (!fs.existsSync(t)) continue; const u = fs.readdirSync(t).filter(e => e !== 'README.md' && !_ignorable(e)); if (u.length > 0) p.push(`staged ${n}/ is not clean: ${u.join(', ')}`); }
    const allowed = new Set([SLIDE_SPECS_NAME, OVERRIDES_SUBDIR, GENERATED_SUBDIR, SCRATCH_SUBDIR, 'README.md']);
    if (fs.existsSync(stagingRunDir)) { for (const e of fs.readdirSync(stagingRunDir, { withFileTypes: true })) { if (_ignorable(e.name)) continue; if (!allowed.has(e.name)) p.push(`unexpected '${e.name}' in staging dir — only ${[...allowed].join(', ')} allowed`); } }
    return p;
}

export function selfCheck() {
    const p = [];
    for (const f of Object.keys(BACKBONE_FILE_SEEDS)) { if (!_ALLOWED_IN_BACKBONE.has(f)) p.push(`init seeds ${f} but whitelist forbids it in ${BACKBONE_DIR}/`); }
    for (const sd of BACKBONE_SUBDIRS) { if (!_ALLOWED_IN_BACKBONE.has(sd)) p.push(`init creates ${sd}/ but whitelist forbids it in ${BACKBONE_DIR}/`); }
    for (const f of VISUAL_STYLE_FILES) { if (!_ALLOWED_IN_VISUAL_STYLE.has(f)) p.push(`canonical visual-style file ${f} not in its whitelist`); }
    if (!_ALLOWED_IN_VISUAL_STYLE.has(BACKBONE_ASSETS_SUBDIR)) p.push(`BACKBONE_ASSETS_SUBDIR not in _ALLOWED_IN_VISUAL_STYLE`);
    if (!_globToRegex(SLIDE_SPECS_GLOB).test(SLIDE_SPECS_NAME)) p.push(`SLIDE_SPECS_GLOB does not match SLIDE_SPECS_NAME`);
    const tree = renderTree();
    for (const n of [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SCRATCH_SUBDIR, POLISH_SUBDIR, SLIDE_SPECS_NAME, STATE_DIR, LESSONS_DIR, LAB_DIR, BACKBONE_STORY_OUTLINE, BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE, PAGE_DESIGN_SYSTEM_FILE, IMAGE2_PROVIDER_PROFILE_FILE]) { if (!tree.includes(n)) p.push(`renderTree() is missing canonical entry ${JSON.stringify(n)}`); }
    const hd = path.resolve(new URL('.', import.meta.url).pathname, '..', '..', '..');
    for (const n of STYLE_PRESETS) { const pd = path.join(hd, STYLE_PRESETS_DIR, n); if (!fs.existsSync(pd) || !fs.statSync(pd).isDirectory()) p.push(`STYLE_PRESETS lists ${JSON.stringify(n)} but ${STYLE_PRESETS_DIR}/${n}/ is missing`); }
    const pr = path.join(hd, STYLE_PRESETS_DIR);
    if (fs.existsSync(pr) && fs.statSync(pr).isDirectory()) { const disk = new Set(fs.readdirSync(pr, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)); for (const x of [...disk].filter(n => !STYLE_PRESETS.includes(n)).sort()) p.push(`${STYLE_PRESETS_DIR}/${x}/ exists on disk but is not declared in STYLE_PRESETS`); }
    for (const [n, t] of Object.entries(DECK_TYPE_TEMPLATES)) { const fp = path.join(hd, DECK_TYPE_DIR, t); if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) p.push(`DECK_TYPE_TEMPLATES lists ${JSON.stringify(n)} → ${t} but ${DECK_TYPE_DIR}/${t} is missing`); }
    return p;
}
