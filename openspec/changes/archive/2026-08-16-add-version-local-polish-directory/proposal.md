# Proposal: Version-local polish directory (`_polish/`)

## Why

A version dir (`3_versions/vN/`) is the unit of one design iteration and the locus of long-term
polishing: style-master reselection, source-epoch advance, per-page copy/visual iteration, and
decision tradeoffs. That work produces a **version-private, human-readable polish trail** — what was
tried, why, what was decided, where the version stands. Today it has no legal home:

- The version root is a hard whitelist (`bundle_layout.mjs --check`): only
  `slide-specifications*.md` / `overrides/` / `_generated/` / `_scratch/` / `README.md`. A
  `_polish/` directory is rejected with `unexpected '_polish' at version root … Do not improvise.`
- `_scratch/` is constitutionally temp/bak/deletable — semantically wrong for a persistent trail
  and invites cleanup as junk.
- `_lessons/` is deck-root, cross-version, reusable lessons (one topic per file, four questions) —
  wrong layer for one version's journal.
- `_state/history.jsonl` and upstream iteration records are machine provenance (hashes, JSON),
  not a human narrative.

The trigger is concrete: a production deck's v8 was polished through 5 source epochs and 10
style-master reselections and the owner wanted to leave a human-readable record of that process
inside the version; the constitution left nowhere to put it. The gap is version-level and applies
to every deck that undergoes sustained polish, not to one deck.

## What Changes

- **Version-root ontology**: the version dir admits an **optional** `_polish/` — the canonical,
  version-private, human-readable polish-trail directory. Non-pipeline, like `_scratch/`; internals
  are not filename-whitelisted and are never source, state, or production authority.
- **Machine surface** (`bundle_layout.mjs`): new `POLISH_SUBDIR` constant; version-root whitelist
  admits it; `renderTree()` tree text and the `--check` violation message name it; `selfCheck()`
  tree-entry list covers it. No new CLI command, flag, diagnostic schema, or gate.
- **Init seeding**: `--init` creates `v1/_polish/` with a canonical Chinese README explaining the
  temp/`_scratch/` vs trail/`_polish/` vs lessons/`_lessons/` boundary. Absence remains valid, so
  every existing bundle keeps passing `--check` unchanged.
- **Version privacy**: `--new-version` neither copies nor creates `_polish/` — the successor starts
  with no polish trail (current copy path already copies only specs + overrides; this locks that in).
- **Human guidance**: `_scratch/` README, version README template, deck-guide template, Charter
  tree text, and the `reference/glossary.md` Where Map all gain the canonical `_polish/` entry with
  its "version-private / human-readable / non-pipeline / not cross-version" semantics.

## Capabilities

### New Capabilities

None. This is a bounded extension of the existing version-dir ontology, not a new responsibility.

### Modified Capabilities

- `run-bundle-layout`: the version-dir admission set ("a version dir admits source + `overrides/` +
  `_generated/` + `_scratch/`") grows by one optional, non-pipeline, human-readable directory; the
  Where Map and active tree guidance must name it; seed and non-copy behavior are specified.

`run-bundle-management` is checked but unchanged: its "new-version copies only canonical source and
overrides into a clean successor" requirement already excludes `_polish/`, and the structure-check
admission behavior is owned by the `run-bundle-layout` requirement being modified.

## Impact

- **Affected harness source**: `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`
  (whitelist, constants, init seed, README templates, `renderTree()`, check message, self-check);
  `ppt_maker_harness/reference/glossary.md` (Where Map);
  `ppt_maker_harness/charter/CONSTITUTION.md` (tree text + gradient table);
  `ppt_maker_harness/workflow/00-setup/template-deck-guide.md` (one boundary line);
  `openspec/specs/run-bundle-layout/spec.md`; tests under `tests/shared/run-bundle/`.
- **Control ownership**: JS owns the deterministic whitelist/validation (same module as today); MD
  owns the README/charter narrative. Tree text stays single-sourced from `renderTree()`.
- **Run-bundle contract impact**: `compatible`. New optional directory; no migration; existing
  bundles byte-preserving; `_polish/` contents carry zero production authority.
- **Validation policy**: this loosens an existing whitelist by one admitted name — it adds no new
  blocking rule, gate outcome, or diagnostic surface. Per `openspec/policies/simple-reliable-control.md`
  no blocking-rule burden is triggered (net control complexity is unchanged, and the negative path
  for invented dirs like `_tmp/` keeps its existing focused tests). Per
  `openspec/policies/human-centered-gates.md`, outcome classification of `--check` structure
  violations is unchanged and no protected invariant is affected.
- **Not in scope**: no change to `_lessons/` behavior or the `lessons-management` capability; no
  migration of existing decks; no automatic journal writing; production `deck_*` data is untouched
  (one deck may serve as a read-only validation sample only).
