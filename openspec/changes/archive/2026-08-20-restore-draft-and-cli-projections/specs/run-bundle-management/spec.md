## ADDED Requirements

### Requirement: `--check` admits only an exact run-dir before binding

`bundle_layout --check` SHALL apply the existing version-directory check
(`isVersionDir` / `isPageImageVersionDir`) before it derives a Deck root or
verifies Harness binding. A Deck root, repository root, or other path that
fails that check is existing `usage`: the diagnostic SHALL name the required
`3_versions/vN` argument and SHALL NOT report `harness_binding_invalid`.
`deckRoot()` SHALL NOT be taught to accept a Deck root as `--check` input.
This change SHALL NOT add a second shape detector beside `isVersionDir`.

When the target is an exact run-dir, binding verification remains the existing
hard-stop protecting Deck-to-Harness identity. `--check --structure-only`
stays layout-only and still does not establish a current binding.

#### Scenario: A Deck root is not a binding failure

- **WHEN** `bundle_layout --check` is given a Deck root or another non-run-dir
  path
- **THEN** the result is `usage` naming `3_versions/vN`
- **AND** the reason is not `harness_binding_invalid`

#### Scenario: An exact run-dir still verifies binding

- **WHEN** `bundle_layout --check` is given an exact `3_versions/vN` path
  whose locator cannot verify the local Harness
- **THEN** it returns the existing binding hard-stop
- **AND** it does not recategorize that failure as usage

### Requirement: Layout `--init` Next matches public init

After a successful scaffold, `bundle_layout --init` SHALL emit the same Next
sentence as `ppt_flow init`: `Next: ppt_flow.mjs status <v1Path>`, where
`<v1Path>` is the created `3_versions/v1` path. It SHALL NOT tell the Agent to
fill `2_backbone/` and `slide-specifications.md` as the first act, invent a
second public startup, or mention upstream material collection. `--init`
remains the layout owner's lower-level interface, not a competing journey.

#### Scenario: Both init entries name status

- **WHEN** `bundle_layout --init` successfully creates a current unbound draft
- **THEN** the human Next line is `Next: ppt_flow.mjs status <v1Path>`
- **AND** it matches the `ppt_flow init` Next for that same v1 path
