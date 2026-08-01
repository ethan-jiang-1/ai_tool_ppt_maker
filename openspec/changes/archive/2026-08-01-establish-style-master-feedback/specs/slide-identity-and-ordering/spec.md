## MODIFIED Requirements

### Requirement: TARGET structural plans bind one workflow without inheriting acceptance

For a target structural preview, the canonical plan SHALL bind the target v2
workflow, source receipt identity, stable slide IDs, order, and exact plan hash.
Every target slide SHALL inherit the one bound workflow; insert, delete, and
reorder operations SHALL NOT add a per-slide workflow override. A whole-version
workflow change SHALL publish only through a confirmed Structural Versioning
Path to vNext.

When the target version is absent, apply SHALL revalidate the selected workflow
and every declared source tuple before publication, make zero provider calls,
and publish only target-owned unreviewed provenance or `needs_raw_generation`
debt. It SHALL NOT copy raw review, final PNGs, final manifests, PPTX, notes,
delivery decisions, provider authorization, or a Style Master acceptance into
the target.

When the exact plan's target is already visible, the existing structural
preview/apply and persisted `slides apply-plan` recovery path SHALL allow only
an exact no-publish replay. Before returning that replay, the owner SHALL
revalidate the unchanged source-side plan precondition, exact target source
bytes, parsed target receipt, bound target workflow/source-epoch evidence
identity, and any present Style Master map through its state owner. It SHALL
recognize that replay before the normal target-absent / next-version and
source-active-execution checks. Later target-owned evidence MAY be nonempty,
but it SHALL remain structurally valid and bound to that same target tuple.
Replay SHALL NOT stage,
rename, recreate, or overwrite the target version; write its source,
overrides, generated artifacts, compatibility payload, or selection; invoke a
provider; or reset an active target Controller execution. A target source,
receipt, workflow/mode/evidence, selection-map, or plan mismatch SHALL be a
non-writing hard-stop requiring a fresh preview rather than a target overwrite.

#### Scenario: Target reorder preserves workflow and stable identity

- **WHEN** a confirmed target Pure structural plan reorders a retained slide
- **THEN** the target preserves that slide's stable ID and binds it to workflow `pure` at its new position
- **AND** the target has no inherited final or delivery acceptance

#### Scenario: Per-slide target workflow override fails preview

- **WHEN** a target structural candidate declares a slide-level Framed or Pure workflow different from the version workflow
- **THEN** preview rejects the candidate before an exact plan hash is issued
- **AND** it does not materialize source evidence or call a provider

#### Scenario: Persisted exact target plan replays without resetting target work

- **WHEN** a persisted confirmed structural plan is reapplied after its target has started `create-deck` and acquired a valid target-owned Style Master selection
- **THEN** the structural owner exact-matches the existing target and returns a no-publish replay
- **AND** it leaves the target source, selection record, active Controller execution, compatibility payload, and version tree unchanged while making zero provider calls

#### Scenario: Existing target drift cannot be overwritten by replay

- **WHEN** a persisted structural plan names a visible target whose source bytes, receipt, workflow/source-epoch evidence identity, or Style Master map no longer matches its exact bound facts
- **THEN** replay hard-stops before source or state mutation and requests a fresh structural preview
- **AND** it does not reset target execution, replace the target, or infer selection from the compatibility payload
