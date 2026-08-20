## Context

See proposal.md for why. Current `verifyDeckHarnessBinding()` is read-only and
calls `checkDeckRootControls()`, which reports missing `_lab/` the same way
`--check` does. Lab `admitRun` then never reaches `ensureLabScaffold()`.
`ensureLabScaffold()` uses recursive `mkdir` on `_lab/fixtures` and
`_lab/runs`; if `_lab` is already a symlink, those writes land on the target
before `confinedDirectoryComponents()` runs. Locator must stay read-only;
Lab CLI remains the only mutating heal writer besides init's deck-root seed.

Policies in force: `human-centered-gates.md`,
`agent-assistance-and-control.md`, `simple-reliable-control.md`.

## Goals / Non-Goals

**Goals:**

- Binding identity and repairable Lab absence are separate facts.
- Lab confine-then-heal-then-reverify is the only write order for `_lab/`.
- Tests prove missing-scaffold heal and symlink-target zero-write without
  using production `deck_*` as fixtures.

**Non-Goals:**

- Migrating production decks.
- Teaching generate/probe/authorize to write `_lab/`.
- Changing `--check` from reporting missing `_lab/` as repairable layout.
- Making the locator a healer.

## Decisions

1. **Locator option, not a second checker.**
   `checkDeckRootControls(root, { allowRepairableLabAbsence: true })` is used
   only by `verifyDeckHarnessBinding`. `--check` keeps the default (missing
   `_lab/` remains a repairable layout problem). Alternative: split a new
   `checkDeckIdentityControls()` — rejected; one checker with an explicit
   identity-vs-layout flag is smaller than a second inventory of deck-root
   rules.

2. **Present-but-unsafe `_lab` stays identity unverified.**
   Complete absence is the only Lab gap binding may ignore. File, symlink,
   and non-directory shapes stay `deck_root_unverified`. The shared checker
   uses `lstat` on the present `_lab` node in both `--check` and binding so a
   symlink-to-directory is not treated as an ordinary directory. A deck-root
   `_lab` symlink is therefore refused at binding, before Lab `admitRun`
   would call `ensureLabScaffold()`. Alternative: let binding resolve and let
   Lab reject later — rejected; a symlink `_lab` is already an unverifiable
   deck-root control, and Lab must not be the first writer onto that target.

3. **Lab write order is confine → heal → re-confine.**
   This is the Lab-owned write gate after a resolved binding. Missing path
   components are skipped by confinement (nothing to refuse). Nested
   non-ordinary components under an ordinary `_lab/` still fail before
   further writes. After heal, confinement runs again so a newly created
   directory is still ordinary and inside the deck. Alternative: heal then
   confine — this is the bug.

4. **No new CLI next-action.**
   Unsafe `_lab` keeps `lab_path_unsafe` / existing binding reasons. Missing
   scaffold is not a diagnostic; it is a successful heal. Alternative: a new
   `repair_lab` next action — rejected; heal is mechanical guide-class work.

## Risks / Trade-offs

- [PPT flow on a historical bundle without `_lab/`] → Binding now resolves;
  generate still does not require `_lab/`. `--check` still names the
  repairable gap. Lab or init seed remains the writer.
- [Partial `_lab/` (directory without README)] → Not complete absence;
  confinement sees an ordinary directory; heal fills missing README/gitignore
  children without treating it as identity failure. Do not invent a third
  "partial" identity class in this change.
- [Tests that expected locator hard-stop on missing `_lab/`] → Update those
  assertions; they encoded the bug.

## Migration Plan

No production deck migration. New init already seeds `_lab/`. Historical
bundles heal on the next Lab CLI invocation (or remain valid for PPT flow
without Lab). Rollback is revert of this change; locator would again block
heal.

## Open Questions

None.

## Verification Strategy

- **Unit:** locator resolves when only `_lab/` is missing; locator still
  hard-stops when `_lab` is a file or symlink; `--check` still reports
  missing `_lab/` as repairable.
- **Integration:** Lab `plan` on a missing-scaffold exact run creates the
  canonical empty scaffold and continues; Lab `plan` with a deck-root `_lab`
  symlink hard-stops with unchanged target bytes and zero fetch.
- **E2E:** none. Do not use `deck_*` as fixtures.
