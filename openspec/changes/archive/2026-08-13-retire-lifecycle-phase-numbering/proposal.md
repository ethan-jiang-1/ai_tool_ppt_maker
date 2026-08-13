## Why

`lifecycle_phase` is a redundant second numbering of controller location that
coexists with `method_module`. Every active controller/shared node already
declares both, and the reader enforces a coarse, lossy mapping between them
(`phase 4` ⇔ target modules `03-framed-image`/`04-pure-image`/`05-delivery`,
`phase 5` ⇔ `06-iteration`) while declaring a `phase 3` value no node uses.
The same collision leaks into the direct lifecycle guidance: `workflow/`
READMEs label themselves "# Phase 1 / # Phase 2" while the controller and
module paths use method-module names. A fresh Agent reading "which step am I
on" gets two disagreeing answers.

## What Changes

- Remove the `lifecycle_phase` frontmatter field from every playbook node.
  `method_module`, already present on every node and already machine-validated,
  becomes the sole lifecycle-location field.
- Remove the legacy `phase` key special case and its `unsupported-phase`
  rejection. Neither `phase` nor `lifecycle_phase` retains a lifecycle-specific
  parse field, validation rule, or diagnostic.
- In `md_controller_reader.mjs`: drop `LIFECYCLE_PHASES`, the `lifecyclePhase`
  parse field, and the `lifecycle-phase` / `phase4-ownership` /
  `target-lifecycle` validation rules. Keep `TARGET_STAGE_FOUR_MODULES` (it
  still drives the `image-production-adapter` and `production-workflows`
  ownership checks) and `METHOD_MODULES`.
- Converge numeric phase labels in the directly affected workflow, internal,
  preset, direct process guidance, and shared probe guidance to method-module
  names; update the matching `playbook-execution` specification wording. Leave
  customer-content examples (for example, a customer roadmap inside
  `block-arc-catalog.md`), the broader `Lifecycle Phase` taxonomy, and
  unrelated capability terminology to their respective follow-on changes.
- Remove only the retired `phase: 04` branch from the
  `harness_coherence.mjs` `hierarchy-ambiguity` guard, retaining its actual
  lifecycle/module-conflation checks. Update reader, draft-route, and
  documentation-coherence tests to the method-module-only contract.

## Decision

A legacy `phase` key is treated as an otherwise unconsumed node-frontmatter
key: it has no lifecycle-specific parse field, validation rule, or diagnostic.
The reader keeps its existing unconsumed-key behavior, so this change is a pure
deletion. A generic node-key allowlist is out of scope and would be a separate
control change.

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
  `scripts/contracts/harness_coherence.mjs`, directly affected
  `workflow/**/README.md`, `workflow/02-visual-system/01-gather-product-context-dna.md`,
  `workflow/01-content/presets/block-arc-catalog.md`, and
  `scripts/*/internal/README.md`; tests `tests/shared/state/*` and
  `tests/contracts/test_process_docs_consistency.mjs`.
- **Accepted-spec delta:** `playbook-execution` owns the controller inventory
  and shared probe wording. No `node-specification` delta is needed because its
  accepted requirements do not bind a numeric node lifecycle field and no
  generic node-key allowlist is introduced.
- **Run-bundle contract:** `none`. `lifecycle_phase` is a static playbook
  annotation; it is not persisted to `_state/state.yaml` or any run-bundle
  artifact, and no production `deck_*` is read or migrated.
- **Control ownership:** MD Controller keeps intent/sequencing; JS keeps
  parse/validate. The change removes a redundant validation surface and adds
  no node, gate, state field, or CLI surface.
- **Control-policy review:** Under
  `openspec/policies/human-centered-gates.md`, this changes no user-facing
  guide, confirm, hard-stop, or continuation. Under
  `openspec/policies/agent-assistance-and-control.md`, playbook Markdown stays
  the direct source and the existing reader stays its one evaluator. Under
  `openspec/policies/simple-reliable-control.md`, the common scope removes
  duplicated numeric branches; selecting a generic allowlist would require a
  separate net-simplification case before it can be added.
