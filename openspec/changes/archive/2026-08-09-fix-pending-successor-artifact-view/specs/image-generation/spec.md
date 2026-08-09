## ADDED Requirements

### Requirement: Human Navigation Path short-circuits every validated pending successor

When the Style Master owner returns a validated pending-successor candidate
projection for an exact current Page Image Workflow run, the Human Navigation
Path SHALL render that projection before raw-owner, stored-raw-plan, or
raw-only accepted-selection inspection. This applies whether or not the
predecessor selection's style-intent, style-context, or
candidate-generation-profile hashes differ from the successor plan.

The tree SHALL materialize short physical copies only from the owner-provided
verified candidate locators, label them pending and not accepted, and mark raw,
review, final, and delivery work unavailable. The artifact-view success
projection SHALL report the owner's existing next action. Neither surface
SHALL display the predecessor as current Style Master authority, infer a raw
plan from it, or expose a SHA-named storage path.

The projection remains a provider-free guide. Any owner hard-stop for scope,
plan, predecessor, media, provenance, or navigation materialization SHALL
preserve the existing navigation tree and return the existing nearest recovery
without writing lifecycle authority.

#### Scenario: Source-receipt successor is visible before stale raw inspection

- **WHEN** a valid current successor has verified candidate media while a
  non-visual source edit makes the Page Image source receipt stale and its
  predecessor's three Style Master input hashes still match
- **THEN** rebuilding the Human Navigation Path publishes the successor's
  short candidate artifact copy and pending inspection purpose
- **AND** it does not read the stale raw plan, publish raw/final/delivery
  artifacts, initialize a provider, or mutate state

#### Scenario: Invalid pending candidate evidence leaves navigation unchanged

- **WHEN** an owner-projected successor candidate fails immutable media or
  provenance validation
- **THEN** the navigation rebuild returns the existing owner hard-stop before
  replacing the navigation tree
- **AND** it does not publish a partial candidate list or use a predecessor
  artifact as fallback
