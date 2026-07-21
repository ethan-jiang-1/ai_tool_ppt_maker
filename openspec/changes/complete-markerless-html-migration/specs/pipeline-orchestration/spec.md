## ADDED Requirements

### Requirement: Migration preparation resolves one isolated candidate before comparison

The migration adapter SHALL resolve a prepared candidate only from the current source version's `_scratch/html-migration/projected-run/`. That candidate owns its authored source/control/asset inputs, preparation receipt, and bounded authoring-checklist projection; its `_generated/` HTML preview owners are rebuildable derived evidence and are not candidate authority. The resolver SHALL reuse the existing HTML source and visual-config validators to determine complete, incomplete, and invalid candidate states rather than introducing a parallel readiness evaluator.

Preparation SHALL build or verify that candidate from a markerless source and a selected preset without writing outside `projected-run/`, publishing a visible version, loading provider credentials, or invoking a renderer/provider. A matching prepared candidate SHALL be idempotent. A source/preset/receipt conflict with existing authored candidate inputs SHALL stop before replacement. A legacy loose scratch candidate may be inspected only by explicit preparation compatibility handling; preview SHALL not copy, move, or adopt it.

Before renderer setup, preview SHALL use the resolver to distinguish a valid unprepared markerless run from an incomplete candidate. Those are `guide` outcomes with a bounded prepare or authoring next action and no render, plan, state, source, or visible-version write. An invalid source/candidate identity, confinement failure, live journal, or conflicting owner is a `hard-stop`; it protects attributable authored inputs and transaction recovery and SHALL short-circuit derived renderer symptoms. A complete candidate SHALL continue through the existing migration-preview context and complete comparison transaction.

The plan and hidden-target apply inputs SHALL bind the candidate source/control/asset receipt set produced by this resolver. Apply SHALL re-resolve that set, copy only the revalidated candidate inputs, and rebuild canonical target output locally. It SHALL never copy projected-run generated pages, final slides, manifests, contact sheets, review evidence, or any approval/state authority into the target.

#### Scenario: Prepare is isolated and idempotent

- **WHEN** the migration adapter prepares the same valid markerless source and preset twice
- **THEN** the second result verifies the existing candidate without changing authored inputs
- **AND** both runs make no source, visible-version, renderer, or provider write

#### Scenario: Bare preview returns a guide before rendering

- **WHEN** a valid markerless run has no projected candidate
- **THEN** preview returns the preparation guide from the candidate resolver
- **AND** no HTML renderer context, contact sheet, or migration plan is created

#### Scenario: Incomplete candidate remains authored work

- **WHEN** the candidate validator reports missing structured fields for two stable slide IDs
- **THEN** preview returns only those bounded authoring requirements
- **AND** it does not regenerate the candidate source or erase its controls

#### Scenario: Apply rerenders instead of promoting scratch bytes

- **WHEN** a complete candidate preview has an exact confirmed hash and apply stages the target
- **THEN** the target is rendered through a fresh canonical context from revalidated candidate inputs
- **AND** its generated objects are not copied from the migration-preview workspace
