#!/usr/bin/env node
/**
 * bundle_layout.mjs — THE SINGLE SOURCE OF TRUTH for the run-bundle directory structure.
 *
 * Everything that needs to know "where does X live in a run bundle" imports from here:
 * - current Page Image operations build every derived path from these constants;
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
 *     ├── RUN_BUNDLE.md                  portable local locator for a new session
 *     ├── deck-guide.md                  read-first control-flow doc (human + agent)
 *     ├── AGENTS.md                      agent-agnostic pointer: locator then guide
 *     ├── CLAUDE.md                      Claude pointer: locator then guide (auto-load)
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
 *     │   ├── story-outline.md
 *     │   ├── manuscript/
 *     │   └── visual-style/
 *     │       ├── style-master-prompt.md   the prompt that GENERATES style_master
 *     │       ├── style_master.png
 *     │       ├── page-image-visual-language.yaml
 *     │       └── page-design-system.md    optional shared provider design guidance
 *     │
 *     └── 3_versions/
 *         └── v1/                        DOWNSTREAM delta · one design iteration · --run-dir
 *             ├── slide-specifications.md  per-slide 4-layer specs (pipeline input)
 *             ├── overrides/               only what THIS version changes vs backbone
 *             │   └── visual-style/ · manuscript/
 *             ├── _generated/              GENERATED · never hand-edit · rm -rf & rerun
 *             ├── _scratch/                THIS version temp/bak only · not SSOT · deletable
 *             └── _polish/                 THIS version human-readable polish trail · non-pipeline · not copied
 *
 * Strictness gradient (constitutional): deck root strictest → mid tiers whitelist →
 * version leaf looser → _scratch internals loosest. Do not dump bak at deck root.
 *
 * Rules encoded here:
 * - A "version" (deck_<name>/3_versions/vN) is the DOWNSTREAM delta only. Create one
 *   with `--new-version`; it copies slide-specifications.md + overrides/ but never
 *   `_generated/`, `_scratch/`, or `_polish/` contents. Backbone & upstream are referenced, never copied.
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
    CLI_DIAGNOSTIC_SCHEMA,
    createCliNext,
    emitCliError,
    installStandaloneFailureEnvelope,
} from "../cli/cli_error.mjs";

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readState, writeState, setNodeStatus, createTargetAuthoringState, STATE_DIR, STATE_FILE, STATE_DIR_README, statePath } from '../state/state.mjs';
import { PAGE_IMAGE_WORKFLOW_PIPELINE, PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE, isPageImageWorkflowSelectionPending, probeProductionMarker } from './production_marker.mjs';
import { canonicalVersionKey, normalizeRunVersion, pipelineFromSourceMarker } from './production_identity.mjs';
import {
    canonicalHarnessRoot,
    currentHarnessRoot,
    normalizedHarnessRelation,
    renderRunBundle,
    verifyDeckHarnessBinding,
} from './run_bundle_locator.mjs';
import {
    GENERATED_SUBDIR,
    GEN_PAGE_IMAGE_DERIVED_PAGES_SUBDIR,
    GEN_PAGE_IMAGE_DERIVED_SUBDIR,
    GEN_PAGE_IMAGE_FINAL_SUBDIR,
    GEN_PAGE_IMAGE_NAV_ARTIFACTS_SUBDIR,
    GEN_PAGE_IMAGE_NAV_SUBDIR,
    GEN_PAGE_IMAGE_WORKFLOW_SUBDIR,
    GEN_PAGE_IMAGE_RAW_SUBDIR,
    GEN_PAGE_IMAGE_RECEIPTS_SUBDIR,
    GEN_PAGE_IMAGE_REVIEW_SUBDIR,
    isPageImageVersionDir,
    PAGE_IMAGE_WORKFLOW_PATHS,
    PAGE_DERIVED_ARTIFACT_FILENAMES,
    pageImageDerivedPagePaths,
    pageImageWorkflowPaths,
    STYLE_MASTER_ITERATIONS_RELATIVE_PATH,
    STYLE_MASTER_STAGING_SUBDIR,
    STYLE_MASTER_PLANS_SUBDIR,
    STYLE_MASTER_SCOPES_SUBDIR,
    pageImageStyleMasterPaths,
    PAGE_PRODUCTION_ITERATIONS_RELATIVE_PATH,
    PAGE_PRODUCTION_STAGING_SUBDIR,
    PAGE_PRODUCTION_PLANS_SUBDIR,
    PAGE_PRODUCTION_SCOPES_SUBDIR,
    pageImageProgressiveRawPaths,
    SLIDE_SPECS_NAME,
    VERSIONS_DIR,
} from './page_image_paths.mjs';
import { STYLE_MASTER_IMAGE, styleMasterLocalSourcePath } from './style_master_media.mjs';

// Version-key and source-marker helpers are shared with the public CLI.
export { canonicalVersionKey, normalizeRunVersion, pipelineFromSourceMarker };
export { verifyDeckHarnessBinding };
export {
    GENERATED_SUBDIR,
    GEN_PAGE_IMAGE_DERIVED_PAGES_SUBDIR,
    GEN_PAGE_IMAGE_DERIVED_SUBDIR,
    GEN_PAGE_IMAGE_FINAL_SUBDIR,
    GEN_PAGE_IMAGE_NAV_ARTIFACTS_SUBDIR,
    GEN_PAGE_IMAGE_NAV_SUBDIR,
    GEN_PAGE_IMAGE_WORKFLOW_SUBDIR,
    GEN_PAGE_IMAGE_RAW_SUBDIR,
    GEN_PAGE_IMAGE_RECEIPTS_SUBDIR,
    GEN_PAGE_IMAGE_REVIEW_SUBDIR,
    PAGE_IMAGE_WORKFLOW_PATHS,
    PAGE_DERIVED_ARTIFACT_FILENAMES,
    pageImageDerivedPagePaths,
    pageImageWorkflowPaths,
    STYLE_MASTER_ITERATIONS_RELATIVE_PATH,
    STYLE_MASTER_STAGING_SUBDIR,
    STYLE_MASTER_PLANS_SUBDIR,
    STYLE_MASTER_SCOPES_SUBDIR,
    pageImageStyleMasterPaths,
    PAGE_PRODUCTION_ITERATIONS_RELATIVE_PATH,
    PAGE_PRODUCTION_STAGING_SUBDIR,
    PAGE_PRODUCTION_PLANS_SUBDIR,
    PAGE_PRODUCTION_SCOPES_SUBDIR,
    pageImageProgressiveRawPaths,
    SLIDE_SPECS_NAME,
    VERSIONS_DIR,
};

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

export const GUIDE_FILE = 'deck-guide.md';
export const RUN_BUNDLE_FILE = 'RUN_BUNDLE.md';
export const AGENT_POINTER_FILE = 'AGENTS.md';
export const POINTER_FILE = 'CLAUDE.md';
export const METADATA_FILE = 'project-metadata.yaml';

/** Deck-root self-retained lessons surface (agentic probe → overcome → retain). */
export const LESSONS_DIR = '_lessons';
export const LESSONS_IMAGE2_PROVEN = 'image2-proven.yaml';

/** Deck-root Image2 Lab workspace (required scaffold; empty does not block PPT flow). */
export const LAB_DIR = '_lab';
export const LAB_FIXTURES_SUBDIR = 'fixtures';
export const LAB_RUNS_SUBDIR = 'runs';

export const LAB_DIR_README = `\
# Image2 Lab (_lab)

**这里放什么:** 这份 Run Bundle 的 Image2 Call Shape 实验隔间。Session B 只在这里证明候选怎么打、能不能拿到可通过生产 inspector 的 PNG。

**不放什么 / 去哪放:**
| 东西 | 放哪 |
|------|------|
| 已确认的生产打法 | \`2_backbone/visual-style/image2-provider-profile.yaml\`（或版本 override） |
| 正式出图 | \`image2 generate\` → \`_generated/\` |
| 跨 session 人读结论 | 现有 \`lessons.mjs add\` 写 \`_lessons/\`（只引用 trial id/hash） |
| 临时垃圾 | 版本 \`_scratch/\` |

**边界:** 空 scaffold（没有 trial）不挡 PPT flow。生产 generate / probe **不读**这里。\`--new-version\` 不拷贝、不删除 trial。大文件默认被本目录 \`.gitignore\` 忽略。
`;

export const LAB_DIR_GITIGNORE = `\
# Image2 Lab artifacts — keep the scaffold, ignore bulky trial outputs.
**/output.png
**/*.png
**/prompt.txt
**/prompt.md
**/raw-body
**/last-proven.json
`;

export function labDir(deckDir) {
  return path.join(deckDir, LAB_DIR);
}

export function ensureLabScaffold(deckDir) {
  const root = labDir(deckDir);
  fs.mkdirSync(path.join(root, LAB_FIXTURES_SUBDIR), { recursive: true });
  fs.mkdirSync(path.join(root, LAB_RUNS_SUBDIR), { recursive: true });
  const readme = path.join(root, 'README.md');
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, LAB_DIR_README, 'utf8');
  const gitignore = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignore)) fs.writeFileSync(gitignore, LAB_DIR_GITIGNORE, 'utf8');
  return root;
}

/** Canonical README body for _lessons/ (Chinese, same voice as _state README). */
export const LESSONS_DIR_README = `\
# 自留教训 (_lessons)

**这里放什么:** 本 deck 在运作中**遇事自己琢磨、试探、克服**之后，值得下次复用的**非密钥**教训。下次 Agent/人进 deck：**先读这里再猜**，免得从头学一遍。禁止只把经验留在聊天里。

**闭环:** 试通或修好之后**必须留下**——这是 Agent workflow 的自留教训面，不是可选项。

**不放什么:** 密钥与生效凭据（→ \`.env\`）、playbook 执行进度（→ \`_state/\`）、上游素材、\`_generated/\` 产物、没有复用价值的一次性吐槽。

**谁读写:** Agent（编排器）和懂行的维护者。PPT Maker Harness 只定目录与规矩，不替各 deck 写具体教训。

**怎么写（规矩）:**
1. **一题一文** — 一件可复用的教训对应一个文件（\`.md\` 或 \`.yaml\`）
2. **文件名可扫读** — \`kebab-case\` + 主题（例：\`image2-proven.yaml\`、\`framed-font-path.md\`）；禁止 \`notes.md\` / \`tmp.md\`
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
export const BACKBONE_STORY_OUTLINE = 'story-outline.md';
export const BACKBONE_MANUSCRIPT_SUBDIR = 'manuscript';
export const BACKBONE_STYLE_SUBDIR = 'visual-style';

// ---------------------------------------------------------------------------
// --- Inside 2_backbone/visual-style/ (or a version override of it) ---------
// ---------------------------------------------------------------------------
export const STYLE_MASTER_PROMPT = 'style-master-prompt.md';
export { STYLE_MASTER_IMAGE, styleMasterLocalSourcePath };
export const PAGE_IMAGE_VISUAL_LANGUAGE_FILE = 'page-image-visual-language.yaml';
export const PAGE_DESIGN_SYSTEM_FILE = 'page-design-system.md';
export const IMAGE2_PROVIDER_PROFILE_FILE = 'image2-provider-profile.yaml';
export const PAGE_IMAGE_PRESENTATION_SUBDIR = 'page-image-presentation';
export const PAGE_IMAGE_CLASSES = Object.freeze(['standard', 'opening', 'transition', 'closing']);
export const PAGE_CLASS_CATALOG_FILE = 'page-class-catalog.yaml';
export const PAGE_IMAGE_DECK_DEFAULTS_FILE = 'deck-defaults.yaml';
export const PURE_DECK_VISUAL_SYSTEM_FILE = 'pure-deck-visual-system.yaml';
export const FRAMED_HEADER_PROFILES_FILE = 'framed-header-profiles.yaml';
export const PAGE_IMAGE_PRESENTATION_FILES = Object.freeze([
    PAGE_CLASS_CATALOG_FILE,
    PAGE_IMAGE_DECK_DEFAULTS_FILE,
    PURE_DECK_VISUAL_SYSTEM_FILE,
    FRAMED_HEADER_PROFILES_FILE,
]);
const STYLE_MASTER_PLAN_DIRECTORY_RE = /^(?:[0-9a-f]{8}|[0-9a-f]{64})$/;
const STYLE_MASTER_STAGING_DIRECTORY_RE = /^plan-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const STYLE_MASTER_VERSION_DIRECTORY_RE = /^v[0-9]+$/;
const STYLE_MASTER_WORKFLOWS = new Set(['framed', 'pure']);
const PAGE_PRODUCTION_PLAN_DIRECTORY_RE = /^(?:[0-9a-f]{8}|[0-9a-f]{64})$/;
const PAGE_PRODUCTION_STAGING_DIRECTORY_RE = /^(?:plan|record|materialization)-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PAGE_IMAGE_VISUAL_LANGUAGE_SEED = `schema: pptmaker-page-image-visual-language
recipes:
  editorial-systems:
    provider_clause: architectural editorial scene, layered amber and cobalt light, quiet depth
    workflows: [framed, pure]
    composition_ids: [centered-constellation]
    motif_ids: [connected-nodes]
    identity_subject_classes: [none]
compositions:
  centered-constellation:
    provider_clause: centered focal form with balanced negative space
    workflows: [framed, pure]
    min_motifs: 0
    max_motifs: 1
motifs:
  connected-nodes:
    provider_clause: luminous connected nodes with measured spacing
    workflows: [framed, pure]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
relationships:
  layer-stack:
    provider_clause: nested translucent planes rising from broad base to focused apex
    workflows: [framed, pure]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: bottom-to-top
  causal-flow:
    provider_clause: connected luminous forms progressing from left origin to right outcome
    workflows: [framed, pure]
    recipe_ids: [editorial-systems]
    composition_ids: [centered-constellation]
    reading_order: left-to-right
`;
const PAGE_CLASS_CATALOG_SEED = `schema: pptmaker-page-image-class-catalog
default: standard
classes:
  standard: { pure: standard, framed: standard }
  opening: { pure: opening, framed: opening }
  transition: { pure: transition, framed: transition }
  closing: { pure: closing, framed: closing }
`;
const PAGE_IMAGE_DECK_DEFAULTS_SEED = `schema: pptmaker-page-image-deck-defaults
typography:
  density: generous
colour_roles:
  primary_text: primary
  secondary_text: secondary
  accent: accent
  surface: neutral
`;
const PURE_DECK_VISUAL_SYSTEM_PROFILE_SEED = `    typography:
      voices:
        display: editorial-serif
        text: editorial-sans
      hierarchy:
        kicker: eyebrow
        title: display
        subtitle: supporting
        body: body
        label: label
        metric: metric
        diagram_text: diagram
        quote: quote
        callout: callout
        supporting_copy: supporting
    colour_use:
      palette_source: style-master
      roles: { primary_text: primary, secondary_text: secondary, accent: accent, surface: neutral }
    layout:
      zones:
        title: { x: 0.08, y: 0.08, width: 0.84, height: 0.22 }
        content: { x: 0.08, y: 0.34, width: 0.84, height: 0.54 }
      whitespace: generous
      families: [editorial-hero, diagram-led, data-led]
`;
const PURE_DECK_VISUAL_SYSTEM_SEED = `schema: pptmaker-pure-deck-visual-system
profiles:
${["standard", "opening", "transition", "closing"].map((profile) => `  ${profile}:\n${PURE_DECK_VISUAL_SYSTEM_PROFILE_SEED}`).join("")}`;
const FRAMED_HEADER_PROFILE_SEED = (permittedFields) => `    permitted_fields: [${permittedFields.join(", ")}]
    canvas: { css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 }
    font_families: [Source Sans 3, Noto Sans SC]
    theme:
      text: '#fffdf8'
      muted_text: '#eee4d7'
      kicker: '#ffd27f'
      contrast: { kind: text-shadow, color: '#000000', opacity: 0.42, offset_x: 0, offset_y: 1, blur: 3 }
    header_region: { x: 40, y: 28, width: 920, height: 238 }
    fields:
      kicker: { x: 64, y: 54, width: 872, height: 22, font_size: 16, line_height: 20, weight: 600, color: '#ffd27f', max_lines: 1 }
      title: { x: 64, y: 82, width: 872, height: 104, font_size: 46, line_height: 52, weight: 700, color: '#fffdf8', max_lines: 2 }
      subtitle: { x: 64, y: 194, width: 872, height: 46, font_size: 23, line_height: 28, weight: 400, color: '#eee4d7', max_lines: 1 }
`;
const FRAMED_HEADER_PROFILES_SEED = `schema: pptmaker-framed-header-profiles
profiles:
  standard:
${FRAMED_HEADER_PROFILE_SEED(["kicker", "title", "subtitle"])}  opening:
${FRAMED_HEADER_PROFILE_SEED(["title"])}  transition:
${FRAMED_HEADER_PROFILE_SEED(["title", "subtitle"])}  closing:
${FRAMED_HEADER_PROFILE_SEED(["title", "subtitle"])} `;
const PAGE_IMAGE_REFERENCE_REGISTRY_SEED = `schema: pptmaker-image2-reference-registry
profiles: {}
`;

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
export const SLIDE_SPECS_GLOB = 'slide-specifications*.md';
export const OVERRIDES_SUBDIR = 'overrides';
/** Version-local temp/bak outlet (upper-strict / lower-loose leaf). */
export const SCRATCH_SUBDIR = '_scratch';
/**
 * Version-local, version-private, human-readable polish trail (non-pipeline).
 * Init seeds it with a README; --new-version never copies or creates it.
 */
export const POLISH_SUBDIR = '_polish';

export const VERSION_SUBDIRS = Object.freeze([
  OVERRIDES_SUBDIR,
  GENERATED_SUBDIR,
  SCRATCH_SUBDIR,
  POLISH_SUBDIR,
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
| 本版持久打磨轨迹/决策 | \`_polish/\` |
| playbook 断点 | \`_state/\` |
| Image2 Call Shape 实验 | \`_lab/\` |

**禁止:** 自创 \`_tmp/\` · \`backup/\` · \`_bak/\`；把 bak 丢到 **deck 根** 或 \`2_backbone/\`。
`;

/** Canonical README for version `_polish/` (Chinese). */
export const POLISH_DIR_README = `\
# 本版打磨轨迹 (_polish/)

**这里放什么:** 仅属**这一版**的持久、人读打磨轨迹——磨了啥、为什么磨、磨到哪了、还差什么。Markdown 叙事为主（可自由组织），是留给人和后续 Agent 读的，不是管线输入。

**不放什么 / 去哪放:**
| 东西 | 放哪 |
|------|------|
| 临时拷贝 / .bak / 草稿 | \`_scratch/\`（临时/可删） |
| 跨版本可复用教训 | \`_lessons/\`（一题一文） |
| 机器事件日志 / hash 流水 | \`_state/history.jsonl\`、upstream 迭代历史（别在这里塞 JSON 当唯一记录） |
| 管线产物 | \`_generated/\`（可重建，不手改） |
| Image2 Call Shape 实验 | deck 根 \`_lab/\` |

**边界:** \`--new-version\` **不会拷贝**本目录——轨迹留在产生它的版本，新版本从零开始。这里的一切**不是真相源**：删改它不影响 source、state 或任何生成/校验。
`;

/** Deck-root allowed names (strictest layer). Dotfiles handled by _ignorable. */
export const DECK_ROOT_ALLOWED = new Set([
  RUN_BUNDLE_FILE,
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
  LAB_DIR,
]);

// ---------------------------------------------------------------------------
// --- Inside a version's _generated/ ----------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// --- CANONICAL STRUCTURE (the ONE data source) -----------------------------
// ---------------------------------------------------------------------------

export const BACKBONE_FILE_SEEDS = Object.freeze({
    [BACKBONE_METAPHOR]:    'workflow/01-content/template-core-metaphor.md',
    [BACKBONE_FORMULA]:     'workflow/01-content/template-core-formula.md',
    [BACKBONE_CONSTRAINTS]: 'workflow/01-content/template-design-constraints.md',
    [BACKBONE_STORY_OUTLINE]: 'workflow/01-content/template-story-outline.md',
});

export const BACKBONE_SUBDIRS = Object.freeze([BACKBONE_MANUSCRIPT_SUBDIR, BACKBONE_STYLE_SUBDIR]);
export const BACKBONE_OPTIONAL = new Set(['visual-style.md']);

export const VISUAL_STYLE_FILES = Object.freeze([
    STYLE_MASTER_PROMPT,
    STYLE_MASTER_IMAGE,
    PAGE_IMAGE_VISUAL_LANGUAGE_FILE,
    PAGE_DESIGN_SYSTEM_FILE,
    IMAGE2_PROVIDER_PROFILE_FILE,
    PAGE_IMAGE_PRESENTATION_SUBDIR,
]);

export const VISUAL_STYLE_OPTIONAL = new Set([
    'visual-style.md',
    'style_master.image-task.json',
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

const _ALLOWED_IN_PAGE_IMAGE_PRESENTATION = new Set([
    ...PAGE_IMAGE_PRESENTATION_FILES,
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
    if (filename === STYLE_MASTER_IMAGE) return styleMasterLocalSourcePath(runDir);
    return resolveBackboneAsset(runDir, `${BACKBONE_STYLE_SUBDIR}/${filename}`);
}

export function image2ProviderProfileAsset(runDir) {
    return styleAsset(runDir, IMAGE2_PROVIDER_PROFILE_FILE);
}

export function image2ProviderProfileOverrideAsset(runDir) {
    return path.join(path.resolve(runDir), OVERRIDES_SUBDIR, BACKBONE_STYLE_SUBDIR, IMAGE2_PROVIDER_PROFILE_FILE);
}

/** Resolve the Pure deck visual-system source through normal version overrides. */
export function pureDeckVisualSystemAsset(runDir) {
    return pageImagePresentationAsset(runDir, PURE_DECK_VISUAL_SYSTEM_FILE);
}

/** Resolve one Page Image presentation source through normal version overrides. */
export function pageImagePresentationAsset(runDir, filename) {
    return styleAsset(runDir, `${PAGE_IMAGE_PRESENTATION_SUBDIR}/${filename}`);
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
    return isPageImageVersionDir(runDir);
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

function _isMacOsSystemEntry(name) {
    return name === '.DS_Store';
}

function _checkPageImageGeneratedOwnership(runDir, problems) {
    const generated = path.join(runDir, GENERATED_SUBDIR);
    if (!fs.existsSync(generated) || !fs.statSync(generated).isDirectory()) return;
    for (const entry of fs.readdirSync(generated, { withFileTypes: true })) {
        if (_isMacOsSystemEntry(entry.name)) continue;
        if (entry.name === 'README.md' && entry.isFile()) continue;
        if (![GEN_PAGE_IMAGE_WORKFLOW_SUBDIR, GEN_PAGE_IMAGE_NAV_SUBDIR].includes(entry.name) || !entry.isDirectory()) {
            problems.push(`unexpected current generated owner '${entry.name}' — Page Image owns ${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/ and ${GEN_PAGE_IMAGE_NAV_SUBDIR}/ only`);
        }
    }
}

function _realDirectory(pathname) {
    try {
        const stats = fs.lstatSync(pathname);
        return stats.isDirectory() && !stats.isSymbolicLink();
    } catch {
        return false;
    }
}

function _realFile(pathname) {
    try {
        const stats = fs.lstatSync(pathname);
        return stats.isFile() && !stats.isSymbolicLink();
    } catch {
        return false;
    }
}

function _crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function _validStyleMasterPng(bytes) {
    if (!Buffer.isBuffer(bytes) || bytes.length < 45 || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return false;
    let offset = PNG_SIGNATURE.length;
    let sawIhdr = false;
    while (offset + 12 <= bytes.length) {
        const length = bytes.readUInt32BE(offset);
        const next = offset + 12 + length;
        if (next > bytes.length) return false;
        const type = bytes.subarray(offset + 4, offset + 8);
        const storedCrc = bytes.readUInt32BE(offset + 8 + length);
        if (_crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== storedCrc) return false;
        if (!sawIhdr) {
            if (type.toString('ascii') !== 'IHDR' || length !== 13 ||
                bytes.readUInt32BE(offset + 8) === 0 || bytes.readUInt32BE(offset + 12) === 0) return false;
            sawIhdr = true;
        }
        if (type.toString('ascii') === 'IEND') return sawIhdr && length === 0 && next === bytes.length;
        offset = next;
    }
    return false;
}

/** Inspect the optional layout-resolved local Style Master PNG source. */
export function checkStyleMasterLocalPng(runDir) {
    const problems = [];
    const payloadPath = styleAsset(runDir, STYLE_MASTER_IMAGE);
    if (!fs.existsSync(payloadPath)) return problems;
    if (!_realFile(payloadPath)) {
        problems.push(`Style Master local PNG source must be a regular file at ${payloadPath}`);
        return problems;
    }
    let bytes;
    try {
        bytes = fs.readFileSync(payloadPath);
    } catch {
        problems.push(`Style Master local PNG source is unreadable at ${payloadPath}`);
        return problems;
    }
    if (!_validStyleMasterPng(bytes)) problems.push(`Style Master local PNG source must be a CRC-valid PNG at ${payloadPath}`);
    return problems;
}

/**
 * Check only the confined directory topology of append-mostly Style Master
 * history. This intentionally does not select a plan: staging and plans not
 * named by a scope head are non-authoritative immutable/incomplete records.
 */
export function checkStyleMasterHistoryLayout(runDir) {
    let paths;
    try {
        paths = pageImageStyleMasterPaths(runDir);
    } catch (error) {
        return [error.message];
    }
    if (!fs.existsSync(paths.history_root)) return [];
    const problems = [];
    const upstreamRoot = path.join(paths.deck_root, UPSTREAM_DIR);
    for (const [pathname, label] of [[paths.deck_root, 'deck root'], [upstreamRoot, UPSTREAM_DIR], [paths.history_root, 'Style Master history root']]) {
        if (!_realDirectory(pathname)) {
            problems.push(`${label} must be a real directory for confined Style Master history`);
            return problems;
        }
    }
    for (const entry of fs.readdirSync(paths.history_root, { withFileTypes: true })) {
        if (_ignorable(entry.name)) continue;
        const target = path.join(paths.history_root, entry.name);
        if (entry.name === STYLE_MASTER_STAGING_SUBDIR || entry.name === STYLE_MASTER_PLANS_SUBDIR || entry.name === STYLE_MASTER_SCOPES_SUBDIR) {
            if (!_realDirectory(target)) problems.push(`Style Master ${entry.name}/ must be a real confined directory`);
            continue;
        }
        problems.push(`unexpected '${entry.name}' in Style Master history; only ${STYLE_MASTER_STAGING_SUBDIR}/, ${STYLE_MASTER_PLANS_SUBDIR}/, and ${STYLE_MASTER_SCOPES_SUBDIR}/ are canonical`);
    }
    if (_realDirectory(paths.staging_root)) {
        for (const entry of fs.readdirSync(paths.staging_root, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!STYLE_MASTER_STAGING_DIRECTORY_RE.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) {
                problems.push(`Style Master staging contains noncanonical entry '${entry.name}'; only confined plan-<unique>/ directories are allowed`);
            }
        }
    }
    if (_realDirectory(paths.plans_root)) {
        for (const entry of fs.readdirSync(paths.plans_root, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!STYLE_MASTER_PLAN_DIRECTORY_RE.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) {
                problems.push(`Style Master plans contains noncanonical entry '${entry.name}'; only immutable plans/<plan-sha256>/ directories are allowed`);
            }
        }
    }
    if (_realDirectory(paths.scopes_root)) {
        for (const version of fs.readdirSync(paths.scopes_root, { withFileTypes: true })) {
            if (_ignorable(version.name)) continue;
            const versionPath = path.join(paths.scopes_root, version.name);
            if (!STYLE_MASTER_VERSION_DIRECTORY_RE.test(version.name) || !version.isDirectory() || version.isSymbolicLink()) {
                problems.push(`Style Master scopes contains noncanonical version '${version.name}'`);
                continue;
            }
            for (const workflow of fs.readdirSync(versionPath, { withFileTypes: true })) {
                if (_ignorable(workflow.name)) continue;
                const workflowPath = path.join(versionPath, workflow.name);
                if (!STYLE_MASTER_WORKFLOWS.has(workflow.name) || !workflow.isDirectory() || workflow.isSymbolicLink()) {
                    problems.push(`Style Master scope ${version.name} contains noncanonical workflow '${workflow.name}'`);
                    continue;
                }
                for (const entry of fs.readdirSync(workflowPath, { withFileTypes: true })) {
                    if (_ignorable(entry.name)) continue;
                    if (entry.name !== 'head.json' || !entry.isFile() || entry.isSymbolicLink()) {
                        problems.push(`Style Master scope ${version.name}/${workflow.name} may contain only mutable head.json`);
                    }
                }
            }
        }
    }
    return problems;
}

/**
 * Check only progressive raw-owner topology. It intentionally does not read a
 * head or select a plan: staging and unreferenced immutable containers are
 * never lifecycle authority during layout inspection.
 */
export function checkProgressivePageProductionHistoryLayout(runDir) {
    let paths;
    try {
        paths = pageImageProgressiveRawPaths(runDir);
    } catch (error) {
        return [error.message];
    }
    if (!fs.existsSync(paths.history_root)) return [];
    const problems = [];
    const upstreamRoot = path.join(paths.deck_root, UPSTREAM_DIR);
    for (const [pathname, label] of [[paths.deck_root, 'deck root'], [upstreamRoot, UPSTREAM_DIR], [paths.history_root, 'progressive page-production history root']]) {
        if (!_realDirectory(pathname)) {
            problems.push(`${label} must be a real directory for confined progressive page-production history`);
            return problems;
        }
    }
    for (const entry of fs.readdirSync(paths.history_root, { withFileTypes: true })) {
        if (_ignorable(entry.name)) continue;
        const target = path.join(paths.history_root, entry.name);
        if (entry.name === PAGE_PRODUCTION_STAGING_SUBDIR || entry.name === PAGE_PRODUCTION_PLANS_SUBDIR || entry.name === PAGE_PRODUCTION_SCOPES_SUBDIR) {
            if (!_realDirectory(target)) problems.push(`progressive page-production ${entry.name}/ must be a real confined directory`);
            continue;
        }
        problems.push(`unexpected '${entry.name}' in progressive page-production history; only ${PAGE_PRODUCTION_STAGING_SUBDIR}/, ${PAGE_PRODUCTION_PLANS_SUBDIR}/, and ${PAGE_PRODUCTION_SCOPES_SUBDIR}/ are canonical`);
    }
    if (_realDirectory(paths.staging_root)) {
        for (const entry of fs.readdirSync(paths.staging_root, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!PAGE_PRODUCTION_STAGING_DIRECTORY_RE.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) {
                problems.push(`progressive page-production staging contains noncanonical entry '${entry.name}'; only confined plan|record|materialization-<unique>/ directories are allowed`);
            }
        }
    }
    if (_realDirectory(paths.plans_root)) {
        for (const entry of fs.readdirSync(paths.plans_root, { withFileTypes: true })) {
            if (_ignorable(entry.name)) continue;
            if (!PAGE_PRODUCTION_PLAN_DIRECTORY_RE.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) {
                problems.push(`progressive page-production plans contains noncanonical entry '${entry.name}'; only immutable plans/<plan-sha256>/ directories are allowed`);
            }
        }
    }
    if (_realDirectory(paths.scopes_root)) {
        for (const version of fs.readdirSync(paths.scopes_root, { withFileTypes: true })) {
            if (_ignorable(version.name)) continue;
            const versionPath = path.join(paths.scopes_root, version.name);
            if (!STYLE_MASTER_VERSION_DIRECTORY_RE.test(version.name) || !version.isDirectory() || version.isSymbolicLink()) {
                problems.push(`progressive page-production scopes contains noncanonical version '${version.name}'`);
                continue;
            }
            for (const workflow of fs.readdirSync(versionPath, { withFileTypes: true })) {
                if (_ignorable(workflow.name)) continue;
                const workflowPath = path.join(versionPath, workflow.name);
                if (!STYLE_MASTER_WORKFLOWS.has(workflow.name) || !workflow.isDirectory() || workflow.isSymbolicLink()) {
                    problems.push(`progressive page-production scope ${version.name} contains noncanonical workflow '${workflow.name}'`);
                    continue;
                }
                for (const entry of fs.readdirSync(workflowPath, { withFileTypes: true })) {
                    if (_ignorable(entry.name)) continue;
                    if (entry.name !== 'head.json' || !entry.isFile() || entry.isSymbolicLink()) {
                        problems.push(`progressive page-production scope ${version.name}/${workflow.name} may contain only mutable head.json`);
                    }
                }
            }
        }
    }
    return problems;
}

/**
 * Validate deck-root controls without reading state or selecting a version.
 * This is shared by exact-run structure validation and portable locator proof.
 * @param {string} root
 * @returns {string[]}
 */
export function checkDeckRootControls(root) {
    const problems = [];
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
        return [`deck root not found: ${root}`];
    }

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
        const filePath = path.join(root, requiredFile);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            problems.push(`missing deck root control file: ${requiredFile}`);
        }
    }
    const upstreamPath = path.join(root, UPSTREAM_DIR);
    if (!fs.existsSync(upstreamPath) || !fs.statSync(upstreamPath).isDirectory()) {
        problems.push(`missing shared upstream dir: ${UPSTREAM_DIR}/`);
    }
    const backbonePath = path.join(root, BACKBONE_DIR);
    if (!fs.existsSync(backbonePath) || !fs.statSync(backbonePath).isDirectory()) {
        problems.push(`missing shared midstream dir: ${BACKBONE_DIR}/ (at deck root ${root})`);
    }
    const visualStylePath = path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
    if (!fs.existsSync(visualStylePath) || !fs.statSync(visualStylePath).isDirectory()) {
        problems.push(
            `missing canonical ${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/ dir ` +
            `(check spelling — it must be exactly '${BACKBONE_STYLE_SUBDIR}')`);
    }
    const labPath = path.join(root, LAB_DIR);
    if (!fs.existsSync(labPath) || !fs.statSync(labPath).isDirectory()) {
        problems.push(`missing repairable Image2 Lab workspace: ${LAB_DIR}/`);
    }
    return problems;
}

/**
 * Validate a version dir against the run-bundle constitution.
 * @param {string} runDir
 * @param {boolean|string} [requirePipelineReady=true] - `true`/`'pipeline'`,
 *   `'preview'` (style master, no gates), or `false`/`'structure'`.
 * @returns {string[]}
 */
function checkPageImagePresentationLayout(presentationPath, { required, scope }) {
    const problems = [];
    if (!fs.existsSync(presentationPath)) {
        if (required) problems.push(`missing canonical Page Image presentation package at ${scope}`);
        return problems;
    }
    if (!fs.statSync(presentationPath).isDirectory()) {
        problems.push(`Page Image presentation package at ${scope} must be a directory`);
        return problems;
    }
    const entries = new Map(fs.readdirSync(presentationPath, { withFileTypes: true }).map((entry) => [entry.name, entry]));
    for (const [name, entry] of entries) {
        if (_ignorable(name)) continue;
        if (!_ALLOWED_IN_PAGE_IMAGE_PRESENTATION.has(name) || (name !== 'README.md' && !entry.isFile())) {
            problems.push(`unexpected '${name}' in ${scope} — allowed source files: ${[...PAGE_IMAGE_PRESENTATION_FILES].join(', ')}`);
        }
    }
    if (required) {
        for (const filename of PAGE_IMAGE_PRESENTATION_FILES) {
            if (!entries.get(filename)?.isFile()) {
                problems.push(`missing canonical Page Image presentation source ${filename} at ${scope}`);
            }
        }
    }
    return problems;
}

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
    let currentPageImage = false;
    let branchValid = true;
    if (sourceCandidate) {
        const sourceBytes = fs.readFileSync(sourceCandidate);
        const marker = probeProductionMarker(sourceBytes, { source: path.basename(sourceCandidate) });
        if (isPageImageWorkflowSelectionPending(marker)) {
            currentPageImage = false;
            problems.push(PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE);
        } else if (marker.branch === 'invalid') {
            branchValid = false;
            for (const entry of marker.issues) problems.push(`invalid production marker: ${entry.message}`);
        } else if (marker.branch === PAGE_IMAGE_WORKFLOW_PIPELINE) {
            currentPageImage = true;
        } else {
            branchValid = false;
            problems.push('unsupported production source cannot pass normal bundle validation');
        }
    }
    const needGates = branchValid && currentPageImage && mode === 'pipeline';

    problems.push(...checkDeckRootControls(root));
    const bbPath = path.join(root, BACKBONE_DIR);
    const vsPath = path.join(root, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR);
    problems.push(...checkStyleMasterLocalPng(runDir));
    problems.push(...checkStyleMasterHistoryLayout(runDir));
    problems.push(...checkProgressivePageProductionHistoryLayout(runDir));
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
            name === POLISH_SUBDIR ||
            name === 'README.md'
        ) {
            continue;
        }
        problems.push(
            `unexpected '${name}' at version root — not part of the canonical structure. ` +
            `A version holds only: slide-specifications.md, ${OVERRIDES_SUBDIR}/, ` +
            `${GENERATED_SUBDIR}/, ${SCRATCH_SUBDIR}/, ${POLISH_SUBDIR}/, README.md. Sources live in ${BACKBONE_DIR}/ (deck root); ` +
            `temp/bak → ${SCRATCH_SUBDIR}/; persistent polish trail → ${POLISH_SUBDIR}/; generated → ${GENERATED_SUBDIR}/. Do not improvise.`);
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
        problems.push(...checkPageImagePresentationLayout(
            path.join(vsPath, PAGE_IMAGE_PRESENTATION_SUBDIR),
            { required: true, scope: `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_IMAGE_PRESENTATION_SUBDIR}/` },
        ));
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
            problems.push(...checkPageImagePresentationLayout(
                path.join(overrideStyle, PAGE_IMAGE_PRESENTATION_SUBDIR),
                { required: false, scope: `${OVERRIDES_SUBDIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_IMAGE_PRESENTATION_SUBDIR}/` },
            ));
        }
    }

    _checkPageImageGeneratedOwnership(runDir, problems);
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

function assertCurrentHarnessBinding(runDir) {
    const binding = verifyDeckHarnessBinding(deckRoot(runDir));
    if (binding.kind !== 'resolved') {
        throw new Error(`RUN_BUNDLE.md does not verify the exact local Harness binding (${binding.code})`);
    }
    return binding;
}

export function createVersion(sourceRunDir, versionName = null) {
    sourceRunDir = path.resolve(sourceRunDir);
    if (!isVersionDir(sourceRunDir)) {
        throw new Error(
            `source must be a version dir inside ${VERSIONS_DIR}/ (got ${sourceRunDir})`);
    }
    assertCurrentHarnessBinding(sourceRunDir);

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
    // A clean copy is not a structural transaction. It remains unregistered
    // until the current preview/apply owner publishes an exact workflow-bound plan.
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
    materializeStaging = null,
}) {
    sourceRunDir = path.resolve(sourceRunDir);
    if (!isVersionDir(sourceRunDir)) {
        throw new Error(`source must be a version dir inside ${VERSIONS_DIR}/ (got ${sourceRunDir})`);
    }
    assertCurrentHarnessBinding(sourceRunDir);
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
        const materialization = typeof materializeStaging === 'function'
            ? materializeStaging({
                sourceRunDir,
                stagingRunDir: staging,
                targetRunDir: target,
                sourcePath: stagedSource,
            })
            : null;
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
        return { source: sourceRunDir, target, version_name: versionName, published: true, ...(materialization ? { materialization } : {}) };
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

const _PAGE_IMAGE_SEEDS = Object.freeze({
    generic: Object.freeze({ id: 'DeckGo', title: 'State the deck\'s governing idea', visualType: 'Hero statement' }),
    keynote: Object.freeze({ id: 'KeyGo', title: 'State the keynote\'s consequential idea', visualType: 'Keynote opener' }),
    pitch: Object.freeze({ id: 'AskGo', title: 'State the venture\'s memorable promise', visualType: 'Pitch opener' }),
    report: Object.freeze({ id: 'FindGo', title: 'State the report\'s decision-ready finding', visualType: 'Report opener' }),
    training: Object.freeze({ id: 'TryNow', title: 'State the capability learners will gain', visualType: 'Training opener' }),
});

/** Canonical current authoring draft. It becomes runnable only after workflow selection. */
export function pageImageInitialDraftSource(deckType = null) {
    const seed = _PAGE_IMAGE_SEEDS[deckType || 'generic'];
    return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
---

# Page Image current source

Before source validation or provider work, record exactly one version workflow under
\`production\`: \`workflow: framed\` when the local Text Frame owns title-like text, or
\`workflow: pure\` when readable body labels, values, dates, captions, or diagram text belong
to Image2. This is one decision for the entire version, never a per-slide choice.

Start each slide with a stable mnemonic slide ID such as \`${seed.id}\`. Every slide supplies a
closed \`VISUAL BRIEF\` selection from the visual-language registry.
`;
}

/** Source text + label for the canonical unbound authoring draft. */
function _seedSourceForDraft(deckType) {
    return { source: pageImageInitialDraftSource(deckType), label: 'Page Image Image2 authoring draft' };
}

const _DIR_READMES = {
    '.': (
        '# {NAME}\n\n' +
        'To resume this deck in a new chat, give [RUN_BUNDLE.md](RUN_BUNDLE.md) to the Agent. ' +
        'Once located, read [deck-guide.md](deck-guide.md) for operating rules.\n'
    ),
    [STATE_DIR]: STATE_DIR_README,
    [LESSONS_DIR]: LESSONS_DIR_README,
    [LAB_DIR]: LAB_DIR_README,
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
        '- `design-constraints.md` — 内容约束(受众/语言与语气/禁忌主张/必要术语)\n' +
        '- `story-outline.md` — Block-first 叙事主干\n' +
        '- `manuscript/` — 讲稿主干\n' +
        '- `visual-style/` — 视觉主干(见里面的 README)\n\n' +
        '**你做什么:** 改这里 = 影响所有版本。想只改某一版,去那一版的 `overrides/`。\n'
    ),
    [`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}`]: (
        '# 视觉主干\n\n' +
        '**这里放什么:**\n' +
        '- `page-image-visual-language.yaml` — current recipe, composition, motif, and frame inputs\n' +
        '- `page-design-system.md` — optional shared Page Image provider design guidance for both Pure and Framed; a version may override it only at `overrides/visual-style/page-design-system.md`\n' +
        '- `image2-provider-profile.yaml` — Deck Author confirmed non-secret Image2 route capability; a version may override it only at `overrides/visual-style/image2-provider-profile.yaml`\n' +
        '- `page-image-presentation/` — Page Class catalog, deck defaults, Pure profiles, and Framed header profiles; version overrides use the matching `overrides/visual-style/page-image-presentation/` path\n' +
        '- `style-master-prompt.md` — Style Master intent input; `style_master.png` — optional local Style Master PNG source\n' +
        '- `assets/asset-manifest.yaml` — verified local references\n\n' +
        '**权威:** 当前 version/workflow 的 accepted selection 在 `_state/state.yaml`; `style_master.png` 只按 override-first/backbone-default 路径作为本地候选源，不能单独通过 raw gate。\n\n' +
        '**你做什么:** 改 intent/registry/资产或 selected bytes 后，先回到 Style Master，再走受影响范围的 Generated Image Rebuild。\n'
    ),
    [`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}`]: (
        '# 视觉资产 (assets)\n\n' +
        '**这里放什么:**\n' +
        '- `asset-manifest.yaml` — 资产目录（SSOT），定义每个资产的 id、路径、类型、描述\n' +
        '- `svg/` — SVG 矢量资产\n' +
        '- `reference/` — PNG/JPG 参考图\n' +
        '- `icons/` — 图标集\n\n' +
        '**你做什么:** 添加资产文件到此目录，在 `asset-manifest.yaml` 注册，然后从 Page Image Visual Brief 的已注册引用语义使用。\n' +
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
        '`bundle_layout.mjs --new-version 3_versions/v1`，它不会复制旧的 `_generated/`、' +
        '`_scratch/` 或 `_polish/` 内容（新版是干净临时区，打磨轨迹留在原版本）。\n'
    ),
    [`${VERSIONS_DIR}/v1`]: (
        '# 这一版(v1)\n\n' +
        '**你改这两处:**\n' +
        '- `slide-specifications.md` — 每一页的 stable ID、Page Image、Text Frame/Visual Brief 和 notes\n' +
        '- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone\n\n' +
        '**临时/备份:** `_scratch/` — 改源前的 `.bak`、草稿（上严下松：别丢到 deck 根）\n' +
        '**持久打磨轨迹:** `_polish/` — 本版磨了啥、为什么、磨到哪（人读 Markdown，不跨版本）\n\n' +
        '**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。\n\n' +
        '**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:\n' +
        '`node ppt_maker_harness/scripts/ppt_flow.mjs build <这个版本目录>`\n'
    ),
    [`${VERSIONS_DIR}/v1/${OVERRIDES_SUBDIR}`]: (
        '# 这一版的覆盖(overrides)\n\n' +
        '**这里放什么:** 只放这一版**偏离 backbone** 的东西。空着 = 完全继承 backbone。\n' +
        '- 要这版单独改视觉 → `overrides/visual-style/`(放改动的那几个文件)\n' +
        '- 要这版关闭或改写共享 provider design guidance → `overrides/visual-style/page-design-system.md`\n' +
        '- 要这版单独改讲稿 → `overrides/manuscript/`\n\n' +
        '管线取件规则:这里有 → 用这里的;没有 → 回退 backbone。\n'
    ),
    [`${VERSIONS_DIR}/v1/${GENERATED_SUBDIR}`]: (
        '# 派生品(_generated)——别手改\n\n' +
        '**这里全是机器生成的**:Page Image receipts、raw/review/final evidence、图片、PPTX 和 notes receipt。\n' +
        '**不要手改任何东西**——改源文件(slide-specifications.md / backbone)后重跑当前 Page Image lifecycle,这里会被覆盖重建。\n' +
        '整个目录可以 `rm -rf` 掉,需要时从源文件重新生成。\n'
    ),
    [`${VERSIONS_DIR}/v1/${SCRATCH_SUBDIR}`]: SCRATCH_DIR_README,
    [`${VERSIONS_DIR}/v1/${POLISH_SUBDIR}`]: POLISH_DIR_README,
};

function renderDeckGuide(deckName) {
    return `# ${deckName} - PPT operating guide

Use [RUN_BUNDLE.md](RUN_BUNDLE.md) to locate this bundle in a new local Agent session. This
guide defines source ownership and operating rules after the bundle is located; current run,
production identity, node, gates, and recovery actions always come from state/status.

## Source ownership

| What changes | Owner |
|---|---|
| Slide text, structure, layout family, and notes | \`${VERSIONS_DIR}/vN/${SLIDE_SPECS_NAME}\` |
| Narrative, formula, and design constraints | \`${BACKBONE_DIR}/\` |
| Visual language, shared Page Image design guidance, presentation package, and local assets | \`${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/\` |
| Research material | \`${UPSTREAM_DIR}/\` |

Never hand-edit \`${VERSIONS_DIR}/vN/${GENERATED_SUBDIR}/\`; edit its source and rerun the
owning path. Put version-local temporary work only in \`${VERSIONS_DIR}/vN/${SCRATCH_SUBDIR}/\`.
Keep the version-private human polish trail (what was polished, why, where it stands) in
\`${VERSIONS_DIR}/vN/${POLISH_SUBDIR}/\` — Markdown narrative, non-pipeline, never copied to a
successor version.

## Operating rules

- Start every resumed session with the exact run selected by state, then inspect state/status.
- Classify edits as Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, or
  Structural Versioning Path. Structural edits require preview plus the exact plan hash before
  publication; materialization never grants remote-render authorization.
- Keep \`slide_id\` as stable cross-version identity. A position is only the current snapshot.
- Capture reusable non-secret lessons in \`${LESSONS_DIR}/\`; execution progress belongs in
  \`${STATE_DIR}/${STATE_FILE}\` and is never hand-edited.

## Human Page Image inspection

Before asking a person to inspect current Style Master, page-review, final, PPTX, notes, or delivery
artifacts, rebuild the exact run's Human Navigation Path with \`ppt_flow artifacts <run-dir>\`.
For every requested artifact, cite the short physical locator, artifact type, and inspection purpose from
its \`${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_NAV_SUBDIR}/index.md\`. Do not replace this handoff by saying an artifact was
generated or opened, and never give a SHA-named storage locator. A locator or display reference is a
read target only: it is not a selector, approval, authorization, decision record, or permission to edit
\`${GENERATED_SUBDIR}/\`.

## CLI diagnostic contract

For a non-zero CLI result, consume only the final valid JSON failure envelope on stderr. Use the
producer-issued \`diagnostic.category\` and supported \`diagnostic.next\`, never prose, to choose the
owner action; keep its \`program\` and \`args\` as separate arguments. Stop when
\`requires_human: true\`; do not guess omitted lineage, repair state/journals/locks by hand, or treat
a chat request as approval.

For a user-facing diagnostic, explain exactly these four parts in order:

1. **What happened**: the bounded owner result only.
2. **What it affects**: the named source, subject, lineage, or current run scope only.
3. **What the Agent can mechanically do**: the exact producer-issued action only.
4. **The one human action or confirmation required**: stop for that action, or say:
   "No human action is required now."

Never use raw stderr as a recovery policy or invent a retry, authorization, or state edit. This
guide does not locate a run or select pre-install recovery; it applies only after this bundle is
already located.

Git is optional and user-owned. Visible \`vN\` remains the work-version authority, and
\`${GENERATED_SUBDIR}/\` is never a recovery target. Do not perform a Git mutation without the
user's explicit authorization for its named operation and exact scope.
`;
}

function initBundleForDraft(deckDir, harnessDir = null, deckType = null, style = null) {
    if (harnessDir === null) {
        harnessDir = path.resolve(__dirname, '..', '..', '..');
    }
    // A locator must never be seeded from a guessed or partial Harness root.
    // Do this before any deck write so an invalid Harness path leaves no scaffold behind.
    harnessDir = canonicalHarnessRoot(harnessDir);
    if (harnessDir !== currentHarnessRoot()) {
        throw new Error(`run bundle must bind to this local Harness root: ${harnessDir}`);
    }
    deckDir = path.resolve(deckDir);
    if (deckDir === harnessDir || deckDir.startsWith(`${harnessDir}${path.sep}`)) {
        throw new Error(`run bundle must be outside the local Harness root: ${deckDir}`);
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

    const dirs = ['.', STATE_DIR, LESSONS_DIR, LAB_DIR, `${LAB_DIR}/${LAB_FIXTURES_SUBDIR}`, `${LAB_DIR}/${LAB_RUNS_SUBDIR}`, UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, `${VERSIONS_DIR}/v1`];
    for (const sd of BACKBONE_SUBDIRS) {
        dirs.push(`${BACKBONE_DIR}/${sd}`);
    }
    for (const sd of VERSION_SUBDIRS) {
        dirs.push(`${VERSIONS_DIR}/v1/${sd}`);
    }
    // Asset subdirectories (optional infrastructure, placeholder on init)
    const assetsBase = `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${BACKBONE_ASSETS_SUBDIR}`;
    const presentationBase = `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_IMAGE_PRESENTATION_SUBDIR}`;
    dirs.push(presentationBase);
    for (const sd of [ASSET_SVG_SUBDIR, ASSET_REFERENCE_SUBDIR, ASSET_ICONS_SUBDIR]) {
        dirs.push(`${assetsBase}/${sd}`);
    }
    for (const rel of dirs) {
        const d = rel === '.' ? deckDir : path.join(deckDir, rel);
        fs.mkdirSync(d, { recursive: true });
    }
    const canonicalDeckRoot = fs.realpathSync.native(deckDir);

    for (const [rel, body] of Object.entries(_DIR_READMES)) {
        const d = rel === '.' ? deckDir : path.join(deckDir, rel);
        const target = path.join(d, 'README.md');
        _writeIfAbsent(target, body.replace(/\{NAME\}/g, name));
        log.push(`README: ${rel}/README.md`);
    }
    ensureLabScaffold(deckDir);

    for (const [fname, tmplRel] of Object.entries(BACKBONE_FILE_SEEDS)) {
        const dest = path.join(deckDir, BACKBONE_DIR, fname);
        if (fs.existsSync(dest)) continue;
        const tmpl = tmplRel ? path.join(harnessDir, tmplRel) : null;
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
        specsTmpl = path.join(harnessDir, DECK_TYPE_DIR, DECK_TYPE_TEMPLATES[deckType]);
        specsLabel = `deck-type:${deckType}`;
    } else {
        specsTmpl = path.join(harnessDir, 'workflow/01-content/template-slide-specifications.md');
        specsLabel = 'template';
    }
    const specsDest = path.join(deckDir, VERSIONS_DIR, 'v1', SLIDE_SPECS_NAME);
    if (!fs.existsSync(specsDest)) {
        const seed = _seedSourceForDraft(deckType);
        fs.writeFileSync(specsDest, seed.source, 'utf8');
        log.push(`${specsLabel} (${seed.label}): ${VERSIONS_DIR}/v1/${SLIDE_SPECS_NAME}`);
    }

    // Stub asset-manifest.yaml (placeholder — user registers assets here when needed)
    _writeIfAbsent(
        path.join(deckDir, assetsBase, ASSET_MANIFEST_FILE),
        '# Page Image asset manifest — optional local asset catalog.\n' +
        '# Bind registered IDs only through current source reference fields.\n' +
        '\n' +
        'assets: {}\n');
    _writeIfAbsent(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, PAGE_IMAGE_VISUAL_LANGUAGE_FILE),
        PAGE_IMAGE_VISUAL_LANGUAGE_SEED);
    _writeIfAbsent(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, PAGE_DESIGN_SYSTEM_FILE),
        '');
    _writeIfAbsent(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, IMAGE2_PROVIDER_PROFILE_FILE),
        'schema: pptmaker-image2-provider-profile\n' +
        'profile_id: null\n' +
        'endpoint_profile: null\n' +
        'owner_declaration:\n' +
        '  authority: deck-author\n' +
        '  status: pending\n' +
        'operations:\n' +
        '  style-master-text-generation: null\n' +
        '  page-image-reference-generation: null\n');
    _writeIfAbsent(path.join(deckDir, presentationBase, PAGE_CLASS_CATALOG_FILE), PAGE_CLASS_CATALOG_SEED);
    _writeIfAbsent(path.join(deckDir, presentationBase, PAGE_IMAGE_DECK_DEFAULTS_FILE), PAGE_IMAGE_DECK_DEFAULTS_SEED);
    _writeIfAbsent(path.join(deckDir, presentationBase, PURE_DECK_VISUAL_SYSTEM_FILE), PURE_DECK_VISUAL_SYSTEM_SEED);
    _writeIfAbsent(path.join(deckDir, presentationBase, FRAMED_HEADER_PROFILES_FILE), FRAMED_HEADER_PROFILES_SEED);
    _writeIfAbsent(
        path.join(deckDir, BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, BACKBONE_ASSETS_SUBDIR, ASSET_REFERENCE_SUBDIR, 'image2-reference-material.yaml'),
        PAGE_IMAGE_REFERENCE_REGISTRY_SEED);
    log.push(`asset catalog: ${assetsBase}/${ASSET_MANIFEST_FILE}`);

    _writeIfAbsent(
        path.join(deckDir, METADATA_FILE),
        `# ${name} — project metadata (static config + pipeline gates)\n` +
        `# Playbook execution progress / playbook gates live in _state/state.yaml — see _state/README.md\n` +
        `deck_name: ${name}\n` +
        `topic: \naudience: \nlanguage: \none_thing_to_remember: \n`);
    _writeIfAbsent(
        path.join(deckDir, AGENT_POINTER_FILE),
        `# ${name}\n\n先读 [RUN_BUNDLE.md](RUN_BUNDLE.md) 定位本 deck 与 PPT Maker Harness，` +
        `再读 [deck-guide.md](deck-guide.md) 获取操作规则。\n`);
    _writeIfAbsent(
        path.join(deckDir, POINTER_FILE),
        `# ${name}\n\n先读 [RUN_BUNDLE.md](RUN_BUNDLE.md) 定位本 deck 与 PPT Maker Harness，` +
        `再读 [deck-guide.md](deck-guide.md) 获取操作规则。\n`);
    const harnessRelation = normalizedHarnessRelation(canonicalDeckRoot, harnessDir);
    _writeIfAbsent(
        path.join(deckDir, RUN_BUNDLE_FILE),
        renderRunBundle({
            deckName: path.basename(deckDir),
            deckRoot: canonicalDeckRoot,
            harnessRoot: harnessDir,
            harnessRelation,
        }));
    _writeIfAbsent(
        path.join(deckDir, GUIDE_FILE),
        renderDeckGuide(path.basename(deckDir)));
    log.push(`project files: ${RUN_BUNDLE_FILE}, ${METADATA_FILE}, ${AGENT_POINTER_FILE}, ${POINTER_FILE}, ${GUIDE_FILE}`);

    _writeIfAbsent(
        path.join(deckDir, '.env.example'),
        '# Local Framed composition does not require provider credentials.\n' +
        '# Keep secrets out of this run bundle. Raw Image2 actions require explicit\n' +
        '# authorization and provider configuration.\n' +
        '# IMAGE2_API_KEY=\n' +
        '# IMAGE2_BASE_URL=\n');
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
        const state = createTargetAuthoringState(name, deckType || '', style || '');
        state.continuation_target_version = 'v1';
        state.gates.content = 'pending';
        state.gates.visual = 'pending';
        setNodeStatus(state, 'checkpoint-intake', 'completed');
        state.current_node = 'author-target-narrative-sources';
        writeState(deckDir, state);
        log.push(`state: ${STATE_DIR}/${STATE_FILE} (unbound authoring draft)`);
    }

    return log;
}

/** Public new-deck initializer: creates one unbound Page Image authoring draft. */
export function initBundle(deckDir, harnessDir = null, deckType = null, style = null) {
    return initBundleForDraft(deckDir, harnessDir, deckType, style);
}

// ---------------------------------------------------------------------------
// --- Canonical tree renderer (docs generate/validate against this) ---------
// ---------------------------------------------------------------------------

export function renderTree() {
    return `\
deck_\${NAME}/
├── ${RUN_BUNDLE_FILE}                  ← portable locator for a new chat
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
├── ${LAB_DIR}/                           ← Image2 Lab workspace (required scaffold; empty does not block PPT flow)
│   ├── README.md                       ← ownership / 恢复；不复制 schema
│   ├── .gitignore                      ← ignore PNG / prompt / bulky trial output
│   ├── ${LAB_FIXTURES_SUBDIR}/                   ← shared reference PNGs (no production lineage)
│   └── ${LAB_RUNS_SUBDIR}/vN/trials/            ← immutable trials; internals not filename-whitelisted
│
├── ${UPSTREAM_DIR}/          ← 上游 UPSTREAM · raw material · shared · append-mostly · no versions
│   └── page-image-style-master-iterations/ ← immutable Style Master candidate history; not current selection
│       ├── _staging/plan-<unique>/         ← incomplete owner-only staging; never authority
│       ├── plans/<plan-sha256>/             ← append-mostly immutable plans/candidates/provenance
│       └── scopes/vN/{framed,pure}/head.json ← one mutable current-plan pointer per exact scope
│   └── page-image-workflow-iterations/     ← immutable progressive page history; not generated output
│       ├── _staging/{plan,record,materialization}-<unique>/ ← owner-only incomplete records
│       ├── plans/<plan-sha256>/             ← append-mostly plan/batch/attempt/provenance containers
│       └── scopes/vN/{framed,pure}/head.json ← one mutable current-plan pointer per exact scope
│
├── ${BACKBONE_DIR}/                       ← 中游 BACKBONE · 主干/default source-of-truth · shared · stable
│   ├── ${BACKBONE_METAPHOR}
│   ├── ${BACKBONE_FORMULA}
│   ├── ${BACKBONE_CONSTRAINTS}
│   ├── ${BACKBONE_STORY_OUTLINE}
│   ├── ${BACKBONE_MANUSCRIPT_SUBDIR}/
│   └── ${BACKBONE_STYLE_SUBDIR}/
│       ├── ${STYLE_MASTER_PROMPT}
│       ├── ${STYLE_MASTER_IMAGE}            ← override-first/backbone-default local PNG candidate source only
│       ├── ${PAGE_IMAGE_VISUAL_LANGUAGE_FILE}
│       ├── ${PAGE_DESIGN_SYSTEM_FILE}          ← optional shared Pure/Framed provider design guidance
│       ├── ${IMAGE2_PROVIDER_PROFILE_FILE}    ← Deck Author declared non-secret Image2 capability
│       ├── ${PURE_DECK_VISUAL_SYSTEM_FILE}  ← Pure-only version-resolved source contract
│       └── ${BACKBONE_ASSETS_SUBDIR}/                   ← optional Page Image reference registry
│           ├── ${ASSET_MANIFEST_FILE}
│           ├── ${ASSET_SVG_SUBDIR}/
│           ├── ${ASSET_REFERENCE_SUBDIR}/
│           └── ${ASSET_ICONS_SUBDIR}/
│
└── ${VERSIONS_DIR}/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── ${SLIDE_SPECS_NAME}       ← Page Image source; the version selects Framed or Pure
    │   ├── ${OVERRIDES_SUBDIR}/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── ${BACKBONE_STYLE_SUBDIR}/           ←   (optional) this version's visual tweaks
    │   │   └── ${BACKBONE_MANUSCRIPT_SUBDIR}/               ←   (optional) this version's script tweaks
    │   ├── ${GENERATED_SUBDIR}/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │   │   ├── ${GEN_PAGE_IMAGE_NAV_SUBDIR}/                 ← Human Navigation Path tree (derived copies only)
    │   │   │   ├── index.md                  ← canonical human inspection entry point
    │   │   │   └── ${GEN_PAGE_IMAGE_NAV_ARTIFACTS_SUBDIR}/{p-1234abcd.png, s-1234abcd.jpg} ← short physical artifact paths
    │   │   └── ${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/
    │   │       ├── ${GEN_PAGE_IMAGE_RECEIPTS_SUBDIR}/source-receipt.json
    │   │       ├── ${GEN_PAGE_IMAGE_RAW_SUBDIR}/{work-plan.json, <slide_id>.png}
    │   │       ├── ${GEN_PAGE_IMAGE_DERIVED_SUBDIR}/index.json
    │   │       │   └── ${GEN_PAGE_IMAGE_DERIVED_PAGES_SUBDIR}/<slide_id>/{${PAGE_DERIVED_ARTIFACT_FILENAMES.source_receipt}, ${PAGE_DERIVED_ARTIFACT_FILENAMES.layout}, ${PAGE_DERIVED_ARTIFACT_FILENAMES.render_model}, ${PAGE_DERIVED_ARTIFACT_FILENAMES.generation_spec}, ${PAGE_DERIVED_ARTIFACT_FILENAMES.image2_request}, ${PAGE_DERIVED_ARTIFACT_FILENAMES.framed_header_html} (Framed only), ${PAGE_DERIVED_ARTIFACT_FILENAMES.artifact_index}}
    │   │       ├── ${GEN_PAGE_IMAGE_REVIEW_SUBDIR}/{complete-page-review.png, complete-page-coverage.json}
    │   │       └── ${GEN_PAGE_IMAGE_FINAL_SUBDIR}/{final-slide-manifest.json, NN_slideID.png, projection.png, delivery-media/{NN_slideID.jpg}, delivery-media-manifest.json, deck.pptx, notes-receipt.json}
    │   ├── ${SCRATCH_SUBDIR}/                         ← version-local temporary output only
    │   └── ${POLISH_SUBDIR}/                          ← version-private human-readable polish trail · non-pipeline
    └── v2/  (--new-version v1 → copies source delta only; clean ${GENERATED_SUBDIR}/ + ${SCRATCH_SUBDIR}/; ${POLISH_SUBDIR}/ not copied; backbone referenced)
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
    for (const n of [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SCRATCH_SUBDIR, POLISH_SUBDIR, SLIDE_SPECS_NAME, STATE_DIR, LESSONS_DIR, LAB_DIR, BACKBONE_STORY_OUTLINE, BACKBONE_ASSETS_SUBDIR, ASSET_MANIFEST_FILE, PAGE_DESIGN_SYSTEM_FILE, IMAGE2_PROVIDER_PROFILE_FILE]) {
        if (!tree.includes(n)) {
            problems.push(`renderTree() is missing canonical entry ${JSON.stringify(n)} (stale hardcoded literal?)`);
        }
    }

    const harnessDir = path.resolve(__dirname, '..', '..', '..');
    for (const name of STYLE_PRESETS) {
        const pdir = path.join(harnessDir, STYLE_PRESETS_DIR, name);
        if (!fs.existsSync(pdir) || !fs.statSync(pdir).isDirectory()) {
            problems.push(
                `STYLE_PRESETS lists ${JSON.stringify(name)} but ` +
                `${STYLE_PRESETS_DIR}/${name}/ is missing`);
            continue;
        }
    }
    const presetsRoot = path.join(harnessDir, STYLE_PRESETS_DIR);
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
        const fp = path.join(harnessDir, DECK_TYPE_DIR, tmpl);
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
        unsupportedMode: null,
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
            case '--mode':
                args.unsupportedMode = argv[++i] || "";
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

function verifyCurrentBindingForCli(runDir, where) {
    const binding = verifyDeckHarnessBinding(deckRoot(runDir));
    if (binding.kind === 'resolved') return binding;
    emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.",
        hint: "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming this content.",
        where,
        diagnostic: {
            schema: CLI_DIAGNOSTIC_SCHEMA,
            category: "gate",
            operation: "verify-harness-binding",
            source: { path: runDir },
            reason: { kind: "harness_binding_invalid", actual: binding.code },
            next: createCliNext("repair_prerequisite", {
                requiresHuman: true,
                default: "Confirm reconstruction of a new current Run Bundle; preserve the existing Bundle unchanged.",
            }),
        },
    });
    return null;
}

function _main() {
    const argv = process.argv.slice(2);
    const args = _parseArgs(argv);

    if (args.unsupportedMode !== null) {
        emitCliError({
            code: CLI_ERROR_CODES.USAGE,
            message: "--mode is not a current bundle initialization argument.",
            hint: "Create an unbound draft, then record framed or pure in the exact current source.",
            where: "bundle_layout.arguments",
            diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Remove --mode and select framed or pure through the current source workflow." }) },
        });
        process.exit(1);
    }
    if ((args.deckType || args.style) && !args.init) {
        console.error('✗ --deck-type / --style only apply together with --init.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--deck-type and --style require --init.", hint: "Use the template options only while initializing a deck.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --init or remove the template-only options." }) } });
        process.exit(1);
    }
    if (args.versionName && !args.newVersion) {
        console.error('✗ --version-name only applies together with --new-version.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--version-name requires --new-version.", hint: "Use --version-name only while creating a version.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --new-version or remove --version-name." }) } });
        process.exit(1);
    }
    const primaryModes = [args.init, args.check, args.newVersion, args.selfCheck].filter(Boolean).length;
    if (primaryModes > 1) {
        console.error('✗ choose only one of --init, --check, --new-version, or --self-check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Bundle layout modes are mutually exclusive.", hint: "Choose one primary mode.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Choose exactly one of --init, --check, --new-version, or --self-check." }) } });
        process.exit(1);
    }
    if (args.structureOnly && !args.check) {
        console.error('✗ --structure-only only applies together with --check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--structure-only requires --check.", hint: "Pair the option with a run directory check.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --check <run-dir> or remove --structure-only." }) } });
        process.exit(1);
    }

    if (args.selfCheck) {
        const drift = selfCheck();
        if (drift.length > 0) {
            console.error(`✗ SSOT self-inconsistency — ${drift.length} drift problem(s):`);
            for (const d of drift) {
                console.error(`  - ${d}`);
            }
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle layout SSOT has ${drift.length} coherence issue(s).`, hint: "Repair the layout constants and generated tree together.", where: "bundle_layout.self-check", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "internal", operation: "self-check", issues: drift.map((message) => ({ message })), next: createCliNext("report_internal", { default: "Inspect bundle_layout.mjs and repair the reported SSOT drift." }) } });
            process.exit(1);
        }
        console.log('✓ SSOT self-consistent: renderTree / whitelist / init all agree.');
        process.exit(0);
    }

    if (args.init) {
        const deckDir = path.resolve(args.init);
        if (!path.basename(deckDir).startsWith('deck_')) {
            console.error(
                `✗ deck dir name must start with 'deck_' (Page Image delivery derives the .pptx name from it); ` +
                `got: ${path.basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Deck directory name must start with deck_.", hint: "Rename the target directory and rerun init.", where: "bundle_layout.init.name", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "init", subject: { kind: "deck", id: path.basename(deckDir) }, source: { path: deckDir }, next: createCliNext("fix_arguments", { inspect: [{ path: path.dirname(deckDir) }], default: "Choose a target directory whose basename starts with deck_." }) } });
            process.exit(1);
        }
        const harnessDir = path.resolve(__dirname, '..', '..', '..');
        if (harnessDir === deckDir || deckDir.startsWith(harnessDir + path.sep)) {
            console.error(
                `✗ refusing to scaffold inside the Harness (${path.basename(harnessDir)}/). ` +
                `A run bundle is a separate project — give an absolute path or a path outside ` +
                `the Harness, e.g.  --init ~/decks/${path.basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "refusing to scaffold a run bundle inside ppt_maker_harness.", hint: "Choose a target outside the Harness source tree.", where: "bundle_layout.init.location", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "init", source: { path: deckDir }, reason: { kind: "harness_source_boundary" }, next: createCliNext("fix_arguments", { inspect: [{ path: harnessDir }], default: "Choose a deck_ target outside ppt_maker_harness and rerun init." }) } });
            process.exit(1);
        }
        let created;
        try {
            created = initBundle(deckDir, null, args.deckType, args.style);
        } catch {
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "unknown or invalid bundle initialization option.", hint: "Choose a documented deck type and style preset.", where: "bundle_layout.init.options", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "init", source: { path: deckDir }, next: createCliNext("fix_arguments", { default: "Inspect --help, choose supported initialization options, and rerun." }) } });
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
        console.log(`\nNext: ppt_flow.mjs status ${deckDir}/${VERSIONS_DIR}/v1`);
        console.log(`Verify anytime:  node ${__filename} --check ${deckDir}/${VERSIONS_DIR}/v1`);
        process.exit(0);
    }

    if (args.newVersion) {
        const sourceRunDir = path.resolve(args.newVersion);
        if (!verifyCurrentBindingForCli(sourceRunDir, "bundle_layout.new-version.binding")) {
            process.exit(1);
        }
        let target;
        try {
            target = createVersion(sourceRunDir, args.versionName);
        } catch (exc) {
            console.error(`✗ ${exc.message}`);
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Unable to create the requested clean version.", hint: "Inspect the source version structure and version name.", where: "bundle_layout.new-version", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "new-version", source: { path: path.resolve(args.newVersion) }, next: createCliNext("inspect", { inspect: [{ path: path.resolve(args.newVersion) }], default: "Inspect the source version and correct its structure or requested version name." }) } });
            process.exit(1);
        }
        console.log(`✓ Created clean version: ${target}`);
        console.log(`  Copied: ${SLIDE_SPECS_NAME} + ${OVERRIDES_SUBDIR}/`);
        console.log(`  Reset:  ${GENERATED_SUBDIR}/ (no stale images, JSON, or PPTX)`);
        process.exit(0);
    }

    if (args.check) {
        const runDir = path.resolve(args.check);
        if (!isVersionDir(runDir)) {
            emitCliError({
                code: CLI_ERROR_CODES.USAGE,
                message: `--check requires an exact ${VERSIONS_DIR}/vN run directory.`,
                hint: `Pass deck_<name>/${VERSIONS_DIR}/v1, not a Deck root.`,
                where: "bundle_layout.check.target",
                diagnostic: {
                    schema: CLI_DIAGNOSTIC_SCHEMA,
                    category: "usage",
                    operation: "parse-arguments",
                    source: { path: runDir },
                    next: createCliNext("fix_arguments", {
                        default: `Pass an exact ${VERSIONS_DIR}/vN run directory, e.g. deck_name/${VERSIONS_DIR}/v1.`,
                    }),
                },
            });
            process.exit(1);
        }
        if (!args.structureOnly && !verifyCurrentBindingForCli(runDir, "bundle_layout.check.binding")) {
            process.exit(1);
        }
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
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle ${scope} check found ${violations.length} violation(s).`, hint: "Fix the named source layout, then rerun the check.", where: "bundle_layout.check", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "check", source: { path: runDir }, issues: violations.map((message) => ({ message, source: { path: runDir }, reason: { kind: "layout_violation" } })), next: createCliNext("edit_source", { inspect: [{ path: runDir }], invocation: { program: "node", args: [__filename, "--check", runDir, ...(args.structureOnly ? ["--structure-only"] : [])] }, default: "Repair the reported run-bundle paths; do not edit _generated artifacts as source." }) } });
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
    installStandaloneFailureEnvelope({ where: "bundle_layout" });
    if (process.argv.includes("--help")) {
        console.log("Usage: node bundle_layout.mjs [--init <deck>] [--deck-type <type>] [--style <preset>] [--check <run-dir> [--structure-only]] [--new-version <run-dir> [--version-name <name>]] [--self-check]");
        process.exit(0);
    }
    _main();
}
