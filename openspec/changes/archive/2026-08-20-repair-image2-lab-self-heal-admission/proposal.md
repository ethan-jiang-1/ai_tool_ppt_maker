## Why

BUG-093: `add-image2-call-shape-and-lab` declared that Lab CLI mechanically heals a
missing deck-root `_lab/` scaffold and that `--check` treats that absence as
repairable layout, not identity failure. The shared locator evaluator still
feeds `checkDeckRootControls()` into `verifyDeckHarnessBinding()`, so complete
absence of `_lab/` becomes `deck_root_unverified` and Lab never reaches
`ensureLabScaffold()`. The same Lab admission path writes the scaffold before
confining `_lab/` path components, so a deck-root `_lab` symlink can receive
README/gitignore/`fixtures/`/`runs/` outside the bundle before the CLI
rejects it. Historical bundles therefore need a data-side workaround instead
of the declared Harness heal, and confinement is not an admission-before-write
gate.

## What Changes

- Locator / Harness binding SHALL treat **complete absence** of `_lab/` as a
  repairable layout gap, not as unverifiable Deck identity. Binding remains
  read-only and still hard-stops when `_lab` exists as a file, symlink, or
  other non-ordinary directory.
- `--check` SHALL continue to report missing `_lab/` as a repairable layout
  finding. Generate, probe, and authorize SHALL NOT become Lab-scaffold
  writers and SHALL NOT read `_lab/`.
- Lab CLI admission SHALL confine existing `_lab/` path components **before**
  the first scaffold write, then heal the empty canonical scaffold, then
  re-verify the final ordinary directory before plan or trial writes.
- Regression tests SHALL lock missing-scaffold self-heal and symlink-target
  zero-write. No production `deck_*` is a fixture or migration target.

Policies: `human-centered-gates.md` (heal is guide-class; unsafe `_lab` is
hard-stop protecting confinement), `agent-assistance-and-control.md` (heal is
mechanical; no human confirm to create empty scaffold),
`simple-reliable-control.md` (one locator identity check, one Lab heal
writer, no second recovery owner).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-management`: Harness binding does not treat complete `_lab/`
  absence as identity unverified; Lab heal remains reachable after a resolved
  binding.
- `image2-lab`: Lab admission confines `_lab/` path components before any
  scaffold write, then heals, then re-verifies.

## Impact

- **Harness source:** `ppt_maker_harness/scripts/shared/run-bundle/`
  (`bundle_layout.mjs`, `run_bundle_locator.mjs`) and
  `ppt_maker_harness/scripts/shared/image2/lab_cli.mjs`.
- **Tests:** `tests/shared/image2/test_lab_cli.mjs`,
  `tests/shared/run-bundle/test_run_bundle_locator.mjs` (and layout `--check`
  coverage if it still conflates identity with missing lab).
- **OpenSpec:** main specs for the two modified capabilities after archive.
- **Control owner:** JS. Locator stays read-only. Lab CLI is the heal writer.
- **Run-bundle contract:** `compatible`. New init already seeds `_lab/`.
  Historical bundles missing `_lab/` become usable by Lab without data-side
  pre-create. Unsafe `_lab` shapes remain hard-stop. Do not migrate
  production `deck_*`.
