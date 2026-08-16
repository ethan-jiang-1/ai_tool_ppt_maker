# Tasks: add-version-local-polish-directory

Capability: `run-bundle-layout` (delta in `specs/run-bundle-layout/spec.md`). Implementation follows
`design.md` D1-D6; no production `deck_*` is modified by any task.

## 1. Machine authority — `bundle_layout.mjs`

- [x] 1.1 Add `POLISH_SUBDIR = '_polish'` next to `SCRATCH_SUBDIR` and append it to `VERSION_SUBDIRS`.
      Do NOT add it to `_seedCleanVersion()` or to `checkStagedVersion()`'s `requiredDirs`/`allowed`
      sets (staging and successors never contain it; see design D3).
      Done: `--self-check` stays green and a fresh `--init` bundle contains `3_versions/v1/_polish/`.
- [x] 1.2 Add `POLISH_DIR_README` template (three-role boundary: temp/bak → `_scratch/`, persistent
      human polish trail → `_polish/`, reusable lessons → `_lessons/`, production facts →
      `_state/`/`_generated/`); add the matching `_DIR_READMES` entry for
      `${VERSIONS_DIR}/v1/${POLISH_SUBDIR}`; add the "打磨轨迹 → `_polish/`" row to
      `SCRATCH_DIR_README`; add the `_polish/` pointer to the version README template.
      Done: a fresh init bundle's `v1/_polish/README.md` and `v1/_scratch/README.md` both state the
      boundary, and `_polish/` contains nothing else. Leave the `.gitignore` seed unchanged —
      `_polish/` stays git-tracked (persistent human record).
- [x] 1.3 Admit `POLISH_SUBDIR` in the `checkBundle()` version-root condition and extend the
      `unexpected … at version root` message to name the complete admitted set including `_polish/`.
      Done: `--check` on a temp bundle passes with `_polish/` present, passes with it absent, and
      still rejects `_tmp/` with a message listing all admitted entries.
- [x] 1.4 Add the `_polish/` line to `renderTree()` at the v1 leaf and mention the no-copy rule in
      the v2 line; update the module header comment tree; add `POLISH_SUBDIR` to the `selfCheck()`
      canonical-name list.
      Done: `bundle_layout.mjs --self-check` reports zero drift.
- [x] 1.5 Add the `_polish/` pointer line to `renderDeckGuide()` ("persistent human polish trail →
      `3_versions/vN/_polish/`").
      Done: a fresh init bundle's `deck-guide.md` names the new directory role.

## 2. Specs and doc projections

- [x] 2.1 Sync the delta into `openspec/specs/run-bundle-layout/spec.md`: gradient requirement
      admits optional `_polish/`; add the four new requirements with their scenarios verbatim.
      Done: main spec matches the change delta; `openspec validate --all --strict` green.
- [x] 2.2 Update `charter/CONSTITUTION.md`: gradient table gains the `_polish/` row (version-private,
      human-readable, non-pipeline) and the tree text gains the v1 `_polish/` line.
      Done: docs-consistency contract test passes.
- [x] 2.3 Add the `_polish/` row to the `reference/glossary.md` Where Map:
      `<run-dir>/_polish/` · "version-private human-readable polish trail; non-pipeline; not copied
      across versions".
      Done: row present with the canonical path and meaning.
- [x] 2.4 Update `workflow/00-setup/template-deck-guide.md` (and optionally
      `reference/anti-patterns.md`) wording to name `_polish/` for persistent trails.
      Done: template distinguishes temp (`_scratch/`) from persistent trail (`_polish/`).

## 3. Tests — `tests/shared/run-bundle/`

- [x] 3.1 Add focused coverage (new file `test_version_polish_directory.mjs` or extend
      `test_process_harness_binding.mjs`, reusing temp-bundle helpers): structure check accepts
      `_polish/` with arbitrary `.md` internals and validates none of them; absence still passes;
      `_tmp/` / `backup/` / `_bak/` still rejected with the full admitted-set message.
      Done: targeted vitest run green.
- [x] 3.2 Add seed and privacy coverage: `--init` seeds `v1/_polish/README.md` with boundary text
      and nothing else; `--new-version` from a version containing `_polish/` yields a successor
      without it, leaves the source version byte-identical, and keeps `_scratch/`/`_generated/`
      behavior unchanged.
      Done: targeted vitest run green.

## 4. Validation and close-out

- [x] 4.1 Run `bundle_layout.mjs --self-check` — zero drift.
- [x] 4.2 Run the full regression `npm test` — green, with no unrelated pre-existing failures
      introduced by this change.
- [x] 4.3 Run `openspec validate add-version-local-polish-directory --strict` — green.
- [x] 4.4 Manual probe on a temp bundle (init → check with/without `_polish/` → new-version shows
      no `_polish/` copy), plus an optional read-only `--check` sample on a production deck version
      if the owner provides one.
      Done: probe output matches the acceptance criteria in `proposal.md`.
- [x] 4.5 Archive the change (`openspec archive add-version-local-polish-directory`) after strict
      validation passes.
      Done: change moved to `openspec/changes/archive/` and main specs reflect the delta.
