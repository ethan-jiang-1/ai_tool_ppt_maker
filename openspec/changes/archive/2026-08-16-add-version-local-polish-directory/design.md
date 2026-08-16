# Design: version-local polish directory (`_polish/`)

## Context

Motivation and scope: see `proposal.md` (Why / What Changes). Normative behavior: see
`specs/run-bundle-layout/spec.md` in this change.

Current machine facts, verified against source (`ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`):

- Version-root admission is an inline whitelist in `checkBundle()` (≈L994-1012): `slide-specifications*.md`,
  `overrides/`, `_generated/`, `_scratch/`, `README.md`; anything else emits
  `unexpected '…' at version root` with a prose list of the admitted set.
- `VERSION_SUBDIRS` (≈L367) = `[overrides, _generated, _scratch]`; its only consumer is the
  `init` directory-seeding loop (≈L1551). `_seedCleanVersion()` (≈L1112) copies only
  `slide-specifications*.md` + `overrides/` and explicitly creates clean `_generated/` and
  `_scratch/` — it never iterates `VERSION_SUBDIRS`.
- README seeding is driven by `_DIR_READMES` (≈L1369) keyed by path, including
  `${VERSIONS_DIR}/v1/${SCRATCH_SUBDIR}` → `SCRATCH_DIR_README` (≈L374).
- `renderTree()` (≈L1704) is the single tree-text source; the module header comment (≈L40-49),
  `charter/CONSTITUTION.md` (gradient table + tree, ≈L86-88/L137-138), and the `--check` message
  are projections of it. `selfCheck()` (≈L1782) fails if a hardcoded list of canonical names is
  missing from `renderTree()`.
- The Where Map lives in `ppt_maker_harness/reference/glossary.md` (run-bundle-layout owns it per
  its main-spec Purpose).
- Reproduced today: a `_polish/` dir triggers `unexpected '_polish' at version root` (structure-only
  check against a fresh `/tmp` bundle).

## Goals / Non-Goals

**Goals:**

- One admitted, optional, inert, version-private directory with a self-documenting README seed.
- Zero new control surface: same validator, same check command, same diagnostic envelope.

**Non-Goals:**

- No automatic journal writing, no timestamped entries, no history reader, no `_lessons/` change.
- No migration or backfill of existing decks; no production `deck_*` is modified or used as a fixture.
- No new capability; `run-bundle-management` spec unchanged (its "new-version copies only canonical
  source and overrides" requirement already implies no `_polish/` copy).

## Decisions

### D1 — Name it `_polish/` (MD owns the semantic; JS owns the constant)

Chosen over `_notes/` and `_journal/`. Rationale: it precisely names the "polish trail" purpose and
stays mutually exclusive with `_scratch/` (temp) and `_lessons/` (reusable lessons); `_notes/` is
fuzzier and `_journal/` invites unbounded chronological logs. The spec locks the role ("persistent
human polish trail; not a JSON/hash-only store") so the name cannot silently generalize, and the
existing negative whitelist tests keep future `_history/`/`_log/` names out unless they pass their
own change. Owner note: this decision was confirmed by the deck owner (2026-08-16).

### D2 — Admit by extending the existing inline whitelist; no second validator (JS)

`POLISH_SUBDIR = '_polish'` joins the `checkBundle()` admission condition and the `--check` message
text. All seven current call sites already share that one evaluator — `--check` (L2044),
`--new-version` source/target validation (L1240/L1301), `ppt_flow` status and validate
(`ppt_flow.mjs` L536/L1110), and `inspect_workflow.mjs` (L344/L382) — so a source version that
contains `_polish/` stops failing every one of them at once, and no second validator exists to
drift. No new checker, config flag, or allow-list file: per
`openspec/policies/simple-reliable-control.md`, the existing structure checkpoint is the direct owner
of this fact, and loosening one condition is the net-simplest change. Negative behavior for
`_tmp/`/`backup/`/`_bak/` is unchanged and keeps its focused tests.

### D3 — Init seeds; new-version neither copies nor creates (JS)

`POLISH_SUBDIR` is appended to `VERSION_SUBDIRS`, so the existing init loop creates
`v1/_polish/`; a `${VERSIONS_DIR}/v1/${POLISH_SUBDIR}` key is added to `_DIR_READMES` so init writes
the canonical `POLISH_DIR_README`. `_seedCleanVersion()` is intentionally left untouched, which
yields the spec'd privacy behavior: v9 gets no `_polish/` and v8's trail is byte-preserved. No copy
rule is added or removed.

Two adjacent surfaces are deliberately left unchanged and must stay that way:

- `checkStagedVersion()` (≈L1193) has its own `requiredDirs`/`allowed` sets for the Structural
  Versioning Path. Staging is seeded by the same `_seedCleanVersion` (≈L1273), so a staged version
  never contains `_polish/`; adding the name to those sets would be a no-op today and a future
  trap. The structural successor therefore also starts with no polish trail, matching
  `--new-version` semantics.
- The `.gitignore` seed (≈L1672) ignores `_scratch/*` and `_generated/` only. `_polish/` is
  intentionally left tracked: the polish trail is a persistent human record and should be
  committed.

### D4 — Tree text and guidance stay single-sourced from `renderTree()` (JS text; MD projections)

`renderTree()` gains the `_polish/` line at the v1 leaf and the v2 line mentions the clean-start
rule; `selfCheck()`'s canonical-name list gains `POLISH_SUBDIR` so drift alarms. The module header
comment, `charter/CONSTITUTION.md` (tree + gradient table), and the `--check` message are updated as
projections of the same set. `reference/glossary.md` Where Map gains the `_polish/` row
(`<run-dir>/_polish/` · "version-private human-readable polish trail; non-pipeline; not copied
across versions").

### D5 — Boundary guidance lives in the two READMEs (MD)

`SCRATCH_DIR_README` gains a row "本版持久打磨轨迹/决策 → `_polish/`"; the new `POLISH_DIR_README`
mirrors it: temp/bak → `_scratch/`, persistent human polish trail → `_polish/`, reusable lessons →
`_lessons/`, production facts → `_state/`/`_generated/` (never hand-edit). The version README
template in `_DIR_READMES` and `renderDeckGuide()`/`template-deck-guide.md` wording gain one pointer
line each. All are narrative projections of the same three-role boundary; none introduces a new
authority.

### D6 — Control-policy compliance (no new control)

This change modifies a validator but adds no blocking rule — it loosens an admission set. Per
`openspec/policies/human-centered-gates.md`, no gate outcome class changes and no protected
invariant (identity, integrity, attributable execution, recovery) is touched; the `--check`
structure violation remains the same bounded `structure` diagnostic with the same `edit_source`
next action. Per `openspec/policies/simple-reliable-control.md`, no blocking-rule burden is
triggered, and the focused negative tests (D2) prove valid work is not blocked.

## Verification strategy

- **Unit/integration (required)**: extend `tests/shared/run-bundle/` with focused cases built on
  the existing temp-bundle helpers (no `deck_*` fixtures):
  1. `--check` accepts a `_polish/` with arbitrary `.md` internals and validates none of them;
  2. absence of `_polish/` still passes (existing-bundle compatibility);
  3. `_tmp/` / `backup/` / `_bak/` still rejected, and the message names the full admitted set;
  4. `--init` seeds `v1/_polish/README.md` with the three-role boundary text and nothing else;
  5. `--new-version` from a version containing `_polish/` produces a successor without it, leaving
     the source version untouched, with `_scratch/`/`_generated/` behavior unchanged.
- **Integration guard**: `bundle_layout.mjs --self-check` must report zero drift (covers renderTree
  vs whitelist vs init consistency).
- **E2e (not needed, stated)**: no new public CLI command or flag; the existing
  `test_process_harness_binding.mjs` e2e path already exercises `--check`/`--new-version` entry
  points and remains the regression surface.
- **Doc coherence**: repo contract suite (`npm test` → `tests/contracts/run_development_verification.mjs`)
  includes `test_process_docs_consistency.mjs` (CONSTITUTION/glossary drift) and the full unit sweep;
  the CONSTITUTION and glossary updates above keep it green.

## Risks / Trade-offs

- [Future dirs requested (`_history/`, `_log/`)] → spec locks the `_polish/` role; negative
  whitelist tests keep the version root closed; any new name needs its own OpenSpec change.
- [`_scratch/` vs `_polish/` confusion] → both READMEs carry the explicit three-role boundary table.
- [`_lessons/` overlap] → Where Map + READMEs separate "version-private trail" from
  "cross-version reusable lesson"; if real overlap appears later, the directory is inert and cheap
  to retire via another change.
- [Projection drift (CONSTITUTION tree vs renderTree)] → `--self-check` drift alarm plus the
  docs-consistency contract test.
- [Whitelist message grows] → single-line list extension only; the message already names every
  admitted entry, so six entries stay readable.

## Migration Plan

None. Existing bundles need no change: `_polish/` absence remains valid, init seeds only new
bundles, and no production data is written by any step of this change. Rollback = revert the
`bundle_layout.mjs` and doc edits; nothing persisted in decks or state.

## Open Questions

None.
