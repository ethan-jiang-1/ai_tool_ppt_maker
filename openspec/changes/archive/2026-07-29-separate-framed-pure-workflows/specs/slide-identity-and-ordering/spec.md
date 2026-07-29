## ADDED Requirements

### Requirement: TARGET structural plans bind one workflow without inheriting acceptance

For a target structural preview, the canonical plan SHALL bind the target v2
workflow, source receipt identity, stable slide IDs, order, and exact plan hash.
Every target slide SHALL inherit the one bound workflow; insert, delete, and
reorder operations SHALL NOT add a per-slide workflow override. A whole-version
workflow change SHALL publish only through a confirmed Structural Versioning
Path to vNext.

Apply SHALL revalidate the selected workflow and every declared source tuple
before publication, make zero provider calls, and publish only target-owned
unreviewed provenance or `needs_raw_generation` debt. It SHALL NOT copy raw
review, final PNGs, final manifests, PPTX, notes, delivery decisions, or
provider authorization into the target.

#### Scenario: Target reorder preserves workflow and stable identity

- **WHEN** a confirmed target Pure structural plan reorders a retained slide
- **THEN** the target preserves that slide's stable ID and binds it to workflow `pure` at its new position
- **AND** the target has no inherited final or delivery acceptance

#### Scenario: Per-slide target workflow override fails preview

- **WHEN** a target structural candidate declares a slide-level Framed or Pure workflow different from the version workflow
- **THEN** preview rejects the candidate before an exact plan hash is issued
- **AND** it does not materialize source evidence or call a provider
