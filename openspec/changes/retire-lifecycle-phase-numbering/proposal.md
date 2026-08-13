## Why

`lifecycle_phase` is a redundant second numbering of the deck lifecycle that
coexists with `method_module`. Every playbook node already declares both, and
the reader enforces a coarse, lossy mapping between them (`phase 4` ⇔ target
modules `03-framed-image`/`04-pure-image`/`05-delivery`, `phase 5` ⇔
`06-iteration`) while declaring a `phase 3` value no node uses. The same
collision leaks into prose: `workflow/` READMEs label themselves "# Phase 1 /
# Phase 2" while the specs and charter converge on method modules. A fresh
Agent reading "which step am I on" gets two disagreeing answers.

## What Changes

- Remove the `lifecycle_phase` frontmatter field from every playbook node.
  `method_module`, already present on every node and already machine-validated,
  becomes the sole lifecycle-location field.
- Remove the legacy `phase` key special case and its `unsupported-phase`
  rejection; a `phase` key becomes an ordinary undeclared key.
- In `md_controller_reader.mjs`: drop `LIFECYCLE_PHASES`, the `lifecyclePhase`
  parse field, and the `lifecycle-phase` / `phase4-ownership` /
  `target-lifecycle` validation rules. Keep `TARGET_STAGE_FOUR_MODULES` (it
  still drives the `image-production-adapter` and `production-workflows`
  ownership checks) and `METHOD_MODULES`.
- Converge lifecycle "Phase N" prose in `workflow/*/README.md`,
  `scripts/*/internal/README.md`, and preset READMEs to method-module names;
  leave content-example "Phase 1/2/3" (e.g. a customer roadmap inside
  `block-arc-catalog.md`) untouched.
- Update the `harness_coherence.mjs` `hierarchy-ambiguity` guard and the
  reader/route tests to the method-module-only contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playbook-execution`: the normative machine-validation requirement binds node
  `method_module` values only; the `lifecycle` ordinal is no longer a bound
  controller value.

## Impact

- **Harness source:** `ppt_maker_harness/playbook/*.md`,
  `scripts/shared/state/md_controller_reader.mjs`,
  `scripts/contracts/harness_coherence.mjs`, `workflow/*/README.md`,
  `scripts/*/internal/README.md`; tests `tests/shared/state/*`.
- **Run-bundle contract:** `none`. `lifecycle_phase` is a static playbook
  annotation; it is not persisted to `_state/state.yaml` or any run-bundle
  artifact, and no production `deck_*` is read or migrated.
- **Control ownership:** MD Controller keeps intent/sequencing; JS keeps
  parse/validate. The change removes a redundant validation surface and adds
  no node, gate, state field, or CLI surface.
