## ADDED Requirements

### Requirement: Cross-pipeline production-mode transitions are versioned state transactions

The state owner SHALL expose one CAS-bound transition transaction for an exact source run whose
authoritative mode/pipeline differs from a requested target mode/pipeline.  The transaction SHALL bind
the source execution/version/mode/pipeline, anticipated clean target version, target mode/pipeline,
confined candidate receipts, exact plan hash, and explicit human confirmation.  It SHALL use the active
controller execution and existing atomic state writer; it SHALL NOT create a deck-global transition
authority, a second mode map, or a new reserved evidence node.

The source version's mode, source, generated work, approvals, delivery review, refinement work, and
history SHALL remain unchanged through prepare, preview, decline, stale confirmation, collision, and
failed apply.  A visible target receives its authoritative mode only after the state owner verifies the
target marker and exact transition success receipt.  Target records SHALL not inherit source review,
provider authorization, reset, completion, or generated evidence.

#### Scenario: Transition preparation preserves the source

- **WHEN** an `html-only` or `html-then-image2` source prepares an `image2-only` target
- **THEN** state records only the bounded transaction/candidate checkpoint and leaves the source mode,
  source, nodes, and generated tree unchanged

#### Scenario: Stale confirmation is rejected

- **WHEN** a source mode, candidate receipt, anticipated target, or expected state identity changes after preview
- **THEN** confirmation or apply fails before target reservation/publication and directs the Controller to a fresh preview

#### Scenario: Visible target receives distinct authority

- **WHEN** a confirmed transaction publishes a verified target with its matching marker and receipt
- **THEN** state registers only the target version's selected mode and declared controller handoff
- **AND** source approvals, provider authority, and completion remain source-version history

#### Scenario: Recovery sees an ambiguous target

- **WHEN** recovery finds a visible target without the exact transition receipt or with a conflicting target mode
- **THEN** it hard-stops without deleting or rewriting either version and names the state-owned inspection/recovery action

## MODIFIED Requirements

### Requirement: Production-mode transitions preserve work and version identity

The state owner SHALL continue to expose one atomic in-place transition for
`html-only <-> html-then-image2` because both modes retain `html-first-v1`.  That write SHALL use
expected-state identity, append bounded audit history, re-evaluate required refinement, and retain all
existing refinement plans, attempts, candidates, accepted source assets, provenance, reviews, and
generated evidence when the mode changes.

Any `html-* <-> image2-only` request through the in-place mode setter SHALL remain a typed
`transition_required` result with no current-version mutation.  The only cross-pipeline route SHALL be
the versioned transaction above: explicit target candidate, exact preview/confirmation, clean vNext,
verified target-mode registration, and declared handoff.  No `--force`, waiver, metadata mirror, source
marker, generated artifact, or history record may turn an in-place request into a conversion.

#### Scenario: Same-pipeline required refinement is enabled

- **WHEN** the exact current HTML version changes from `html-only` to `html-then-image2`
- **THEN** status revalidates retained refinement evidence without making a provider request

#### Scenario: Same-pipeline required refinement is disabled

- **WHEN** the exact current HTML version changes from `html-then-image2` to `html-only`
- **THEN** refinement completion debt is removed while every attributable refinement record remains intact

#### Scenario: In-place cross-pipeline setter is refused

- **WHEN** a caller uses the same-version mode setter to request `image2-only` from an HTML mode
- **THEN** it returns transition guidance with zero state/source/generated mutation

#### Scenario: Cross-pipeline transition completes through vNext

- **WHEN** the Controller confirms the exact transition plan for an HTML source and an Image2 target
- **THEN** the original version retains its mode and a separate visible target receives `image2-only` only after receipt verification
