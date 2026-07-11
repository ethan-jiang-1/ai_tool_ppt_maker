## Why

有目录规矩却**搜不到**，等于没有规矩。

Phase A 已落地 `_scratch/` 机制与 `checkBundle` 执法，但 Agent（code agent）不会通读 CONSTITUTION 深文或先打开叶子 README。它擅长的是 **GREP**：思考「东西往哪放」时，若 `rg '_scratch'` / `rg 'style_master'` / `rg 'contact_sheet'` 能撞到 **term → path → role**，就会按规矩放；撞不到就会自创 `_tmp/`、把 bak 扔 deck 根。

**Capability 缺口（本轮必须动刀）：** 软包已有独立 capability `framework-directory-layout`（只描述 `PPTMAKER_FRAMEWORK/`）。Run bundle 的 **folder definition**（`deck_*` 树本体、各目录 role、上严下松、落盘词表）却没有对等 capability——被揉进 `run-bundle-management`（ops）和 `framework-charter`（文档镜像）。两者混在一起不对。本 change **新建 `run-bundle-layout`**，与 `framework-directory-layout` 对称、**禁止混用**。

本 change 打开后的工作 = 立 `run-bundle-layout` + 在其上钉 **GREP 友好 Where Map** + 入口/种子用同一套词，使「不知往哪放 → rg → Where Map」成为默认闭环。

## What Changes

### Capability action (do this in the change, not only in chat)

- **NEW** `run-bundle-layout` — run-bundle (`deck_*`) folder ontology + roles + structure gradient + Where Map / GREP discoverability. Machine SSOT remains `bundle_layout.mjs`; this capability owns the **definition & discoverability** requirements.
- **NOT** `framework-directory-layout` — that capability stays soft-bundle-only; do not extend it to cover `deck_*`.
- **Narrow use of** `run-bundle-management` — keep init/check/new-version/self-check **ops**; first-look README seed text that teaches placement MAY be required here as scaffolding output of layout, but the Where Map SSOT lives under `run-bundle-layout`.
- **Narrow use of** `framework-charter` — entry docs (BOOTSTRAP / AGENTS / CONSTITUTION mirror) **point at / align with** `run-bundle-layout`; they do not own the folder ontology.

### Baseline (Phase A — already shipped; do not re-implement)

- Version `_scratch/` + 上严下松 + deck-root litter rejection + init/new-version/gitignore + keynote bak move + charter deep text (requirements today sit under management/charter; ontology belongs conceptually to `run-bundle-layout` going forward)

### Remaining (Phase B)

1. Add delta spec `specs/run-bundle-layout/spec.md` (new capability) with tree/role/gradient + Where Map requirements
2. Where Map in `reference/glossary.md` (grep tokens = headings)
3. BOOTSTRAP GREP-before-invent pointer; AGENTS Phase 0 tree same vocabulary
4. `_DIR_READMES` + keynote README refresh; light tests
5. On archive/sync: main `openspec/specs/run-bundle-layout/spec.md` appears; do not merge into `framework-directory-layout`

**Non-goals:** new disk paths; deck-root `_scratch`; extending soft-bundle layout capability to decks; BM25 metaphors.

## Capabilities

### New Capabilities

- `run-bundle-layout` — Canonical **run bundle** (`deck_{NAME}/`) directory definition: tier tree, per-directory roles (`_scratch/`, `_generated/`, `_state/`, `_lessons/`, upstream/backbone/versions/overrides, …), structure gradient (上严下松), and GREP-friendly Where Map / entry discoverability. Distinct from `framework-directory-layout` (soft bundle only).

### Modified Capabilities

- `framework-charter` — BOOTSTRAP / AGENTS / CONSTITUTION **mirror and point to** run-bundle layout + Where Map; do not redefine soft-bundle layout
- `run-bundle-management` — ops remain; seed READMEs must surface layout tokens (`_scratch`, gradient); live golden README refresh
- `playbook-execution` — GREP Where Map before inventing temp paths; bak → `_scratch/`
- `framework-directory-layout` — **no change** (explicitly out of scope; do not conflate)

## Impact

- `openspec/changes/version-scratch-directory/specs/run-bundle-layout/spec.md` → sync to `openspec/specs/run-bundle-layout/`
- `PPTMAKER_FRAMEWORK/reference/glossary.md`
- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`, `AGENTS.md`
- `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` (`_DIR_READMES` copy only)
- optional `workflow/00-setup/template-deck-guide.md`
- `deck_ai_sdlc_keynote` root + v1 READMEs
- light tests under `tests/`
