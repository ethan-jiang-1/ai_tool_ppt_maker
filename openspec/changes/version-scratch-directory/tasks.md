## Done when (Phase B)

Implementer MUST be able to run these from repo root and get hits in the **intended** files (not only deep CONSTITUTION):

```bash
test -f openspec/changes/version-scratch-directory/specs/run-bundle-layout/spec.md
rg -n 'run-bundle-layout' openspec/changes/version-scratch-directory/proposal.md
rg -n '## Where Map' PPTMAKER_FRAMEWORK/reference/glossary.md
rg -n '^### _scratch/' PPTMAKER_FRAMEWORK/reference/glossary.md
rg -n '^### --run-dir' PPTMAKER_FRAMEWORK/reference/glossary.md
rg -n '^### style_master\.jpg' PPTMAKER_FRAMEWORK/reference/glossary.md
rg -n 'contact_sheet|### pilot' PPTMAKER_FRAMEWORK/reference/glossary.md
rg -n 'Where Map|GREP|_scratch' PPTMAKER_FRAMEWORK/BOOTSTRAP.md
rg -n '_scratch/' PPTMAKER_FRAMEWORK/AGENTS.md
rg -n '_scratch' PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs   # _DIR_READMES['.'] string
rg -n '_scratch' deck_ai_sdlc_keynote/README.md
rg -n '_scratch' deck_ai_sdlc_keynote/3_versions/v1/README.md
```

**Fail the change if:** BOOTSTRAP pastes a second full Where Map table; glossary headings use Chinese-only titles without the English/path token; deck-root seed still lists only three tiers + `_state`/`_lessons` with no `_scratch`; keynote READMEs stay stale; tasks marked done without the `rg` checks above.

**Do not re-do Phase A** (whitelist / SCRATCH_SUBDIR / bak move / mechanism tests already green).

---

## 0. Baseline (Phase A) — already done

- [x] 0.1 Mechanism: `SCRATCH_SUBDIR`, checkBundle, init/new-version, gitignore, renderTree
- [x] 0.2 Charter deep text: CONSTITUTION gradient + AGENT_CONTRACT bak→`_scratch`
- [x] 0.3 Mechanism tests + keynote bak under `v1/_scratch/` + `npm test` green

---

## 0b. Capability split (OpenSpec — do before / with Phase B docs)

- [ ] 0b.1 Create delta `specs/run-bundle-layout/spec.md` (Purpose + tree/roles + gradient + Where Map). Explicit: ≠ `framework-directory-layout`.
- [ ] 0b.2 Slim `specs/framework-charter/`: mirror + BOOTSTRAP/AGENTS pointers only; do not own Where Map ontology.
- [ ] 0b.3 Keep `specs/run-bundle-management/`: ops + `_DIR_READMES` / golden README; reference `run-bundle-layout` for tokens.
- [ ] 0b.4 `design.md` D0 + `proposal.md` New Capabilities list `run-bundle-layout`; `framework-directory-layout` marked no-change.
- [ ] 0b.5 **Acceptance:** `test -f openspec/changes/version-scratch-directory/specs/run-bundle-layout/spec.md`; no run-bundle folder-def requirements added under `framework-directory-layout`.

---

## 1. Glossary — Where Map SSOT (do this first; everything else points here)

- [ ] 1.1 Insert `## Where Map` **above** existing glossary body in `PPTMAKER_FRAMEWORK/reference/glossary.md`. Opening blurb MUST say: unsure where to put a file → **GREP these terms** → then place. Not BM25 language.
- [ ] 1.2 Table columns exactly: **Term (GREP this) | Path | Means / put here | Do not**. One row per design D3 minimum token (at least): `run bundle`, `soft bundle`, `--run-dir`, `_scratch/`, `_generated/`, `slide-specifications.md`, `style_master.jpg`, `contact_sheet` / `pilot`, `_state/`, `_lessons/`, `1_upstream_raw_material/`, `2_backbone/`, `overrides/`, `structure gradient` / `上严下松`.
- [ ] 1.3 Paths in table MUST be concrete enough to place files, e.g. `_scratch/` → `3_versions/v{n}/_scratch/`; `style_master.jpg` → `2_backbone/visual-style/style_master.jpg`; pilot → `_generated/preview/*contact_sheet*.jpg`.
- [ ] 1.4 Add `###` headings whose title text **is** the grep token (markdown AT1 of heading = token), minimum:
  - `### _scratch/`
  - `### _generated/`
  - `### --run-dir`
  - `### run bundle`
  - `### soft bundle`
  - `### style_master.jpg` (may combine with Visual Style Master prose)
  - `### pilot` or heading containing `contact_sheet`
- [ ] 1.5 `### _scratch/` body MUST answer all four: (1) what it is (2) full relative path (3) what NOT to put / invent (`_tmp/`, deck-root bak) (4) contrast vs `_generated/` + route table for style-iterations / `_lessons` / `_state`.
- [ ] 1.6 `### --run-dir` MUST say: version leaf `deck_*/3_versions/v{n}/`; **≠** run bundle (`deck_*/`).
- [ ] 1.7 One **Also-search → canonical** line: `bak`/`temp`/`scratch` → `_scratch/` · `小样`/`preview` → `contact_sheet`/`pilot` · `style master` → `style_master.jpg` · `production`/`derived` → `_generated/`.
- [ ] 1.8 **Acceptance:** from repo root, the Done-when `rg` lines for glossary all match; heading `### _scratch/` is a real AT1 hit (not only buried mid-sentence).

---

## 2. BOOTSTRAP — plant grep loop (pointer only)

- [ ] 2.1 In `PPTMAKER_FRAMEWORK/BOOTSTRAP.md` section `目录结构是宪法`, add **one** bullet: if unsure where to put a file → GREP tokens → `reference/glossary.md` **Where Map** → then write. Example tokens in that bullet MUST include at least `_scratch`, `_generated`, and one of `style_master` / `contact_sheet` / `pilot`.
- [ ] 2.2 Same section MUST still name `3_versions/v{n}/_scratch/` for temp/bak and 上严下松 / structure gradient (may already exist — keep or tighten; do not remove).
- [ ] 2.3 **Forbidden:** paste the full Where Map table into BOOTSTRAP (drift). Quick-ref row may link glossary only.
- [ ] 2.4 If BOOTSTRAP quick-ref already has「术语解释 → glossary」, keep it; optionally add「Where Map / 落盘」wording on that row — still one link target.
- [ ] 2.5 **Acceptance:** `rg -n 'Where Map|GREP' PPTMAKER_FRAMEWORK/BOOTSTRAP.md` hits the constitution section; `wc`/eyeball confirms no second full placement table.

---

## 3. AGENTS Phase 0 tree — same vocabulary as glossary

- [ ] 3.1 In `PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 run-bundle tree, under `v1/`, ensure a line for `_scratch/` exists (add if missing).
- [ ] 3.2 Annotation MUST use English role words aligned with Where Map, e.g. `SCRATCH` / `version temp` / `bak` / `not SSOT` — not a Chinese-only nickname as the sole label.
- [ ] 3.3 Tree MUST remain consistent with `renderTree()` (scratch under version, not under deck root).
- [ ] 3.4 Blurb near the tree MAY mention structure gradient + `_scratch` vs `_generated` in one sentence; do not invent a third path.
- [ ] 3.5 **Acceptance:** `rg -n '_scratch/' PPTMAKER_FRAMEWORK/AGENTS.md` shows the tree line; visual compare to `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` tree output for scratch placement.

---

## 4. `_DIR_READMES` seeds — first-look map inside a deck

Edit `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` `_DIR_READMES` only (no path/SSOT logic changes).

- [ ] 4.1 `_DIR_READMES['.']` (deck-root README seed): add explicit bullet or sentence that **version temp/bak** lives at `3_versions/v{n}/_scratch/` (token `_scratch` must appear). Add one line 上严下松 / root strictest / temp sinks down — not only “别自己新建目录”.
- [ ] 4.2 `_DIR_READMES[VERSIONS_DIR]` (`3_versions/README`): extend new-version sentence so it states it does **not** copy `_scratch/` contents (today it only mentions `_generated/`).
- [ ] 4.3 Confirm `_DIR_READMES[…/_scratch]` still equals `SCRATCH_DIR_README` and opening identifies `_scratch`; if glossary token differs, align the **token** only (keep Chinese routing table).
- [ ] 4.4 `workflow/00-setup/template-deck-guide.md`: if its tree/map omits `_scratch` or new-version scratch note, align with seeds; if already aligned, note N/A in PR/review.
- [ ] 4.5 **Acceptance:** `node -e` or test reads `_DIR_READMES['.']` / versions string and asserts `.includes('_scratch')`; fresh `--init` into a temp dir yields root README containing `_scratch` (optional smoke in §6).

---

## 5. Golden deck — force-refresh stale first-look READMEs

`_writeIfAbsent` will **not** fix live decks. Overwrite these two files to match current seeds (after §4).

- [ ] 5.1 Replace `deck_ai_sdlc_keynote/README.md` so it matches updated deck-root seed (must mention `_scratch` + gradient; keep pointing at `deck-guide.md`).
- [ ] 5.2 Replace `deck_ai_sdlc_keynote/3_versions/v1/README.md` so it matches updated v1 seed (must mention `_scratch` for temp/bak; today it does **not**).
- [ ] 5.3 Do **not** move bak again if already under `v1/_scratch/`; do not invent deck-root scratch.
- [ ] 5.4 **Acceptance:** Done-when `rg` on both keynote READMEs hits `_scratch`; `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check deck_ai_sdlc_keynote/3_versions/v1 --structure-only` exits 0.

---

## 6. Tests — lock grep anchors (not prose taste)

- [ ] 6.1 Extend `tests/test_docs_consistency.mjs` (or small sibling) with assertions that fail if anchors disappear:
  - `glossary.md` contains `## Where Map` and `### _scratch/`
  - `BOOTSTRAP.md` matches `/Where Map|GREP/` (or both) and `_scratch`
  - `AGENTS.md` contains `_scratch/`
- [ ] 6.2 Assert `_DIR_READMES['.']` source in `bundle_layout.mjs` includes `_scratch` (read file or import if exported; if not exported, regex the `.mjs` source for the deck-root readme string + `_scratch`).
- [ ] 6.3 Assert keynote root README includes `_scratch` (guards stale map regression).
- [ ] 6.4 `npm test` green.
- [ ] 6.5 Manual: re-run the Done-when `rg` block; paste results into review notes if useful.

---

## 7. Human review gate (before archive)

- [ ] 7.1 Human reads glossary Where Map + `_scratch` / `--run-dir` defs — vocabulary OK?
- [ ] 7.2 Human confirms BOOTSTRAP is pointer-only (no forked table).
- [ ] 7.3 Human opens keynote root README — first look teaches scratch?
- [ ] 7.4 Only then archive; do not self-archive on green tests alone.
