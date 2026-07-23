## Context

The audit began as a proposal to rename the internal `legacy-image2-first` pipeline label. Reading the resolver and its consumers showed that the label participates in marker normalization, controller ownership, transition identity, CLI/status projections, and receipt compatibility. The framework already documents `image2-only` as a first-class mode; retaining a state-absent route would make that model internally contradictory.

The concrete defect is instead structural: five main specs fail `openspec validate --all`. The failure is mechanical and local, but it undermines the role of the entire specification set as a trustworthy maintenance input.

## Goals / Non-Goals

**Goals:**

- Restore complete structural validity for every checked-in main spec.
- Make validation an explicit OpenSpec/framework-maintenance check.
- Preserve current requirements while adding only the scenarios needed to make their behavior executable.
- Replace the supported whole-page protocol with explicit current terminology and remove old routing rather than carrying aliases.

**Non-Goals:**

- Do not provide a compatibility alias, persisted-data migration, or fallback reader for removed whole-page protocol values.
- Do not create a new governance capability for a responsibility already owned by framework verification and charter maintenance.
- Do not change deck workflow, provider authorization, gates, or generated-artifact behavior.

## Decisions

### 1. Remove the legacy pipeline protocol

`whole-page-image2-v1` becomes the only whole-page pipeline value. `image2-only` sources explicitly declare `production.pipeline: whole-page-image2-v1`; the state resolver, controller registry, transitions, receipts, CLI, and tests use the same value. `legacy-image2-first`, markerless source detection, legacy maintenance controllers, and legacy receipt readers are removed with no alias or migration path.

### 2. Repair invalid requirements in place

Each invalid main requirement receives a `MODIFIED` delta containing its complete existing behavior plus one scenario. This is replacement, not an added competing rule. `workflow-inspection` also receives its real Purpose during implementation because Purpose lies outside OpenSpec delta requirement operations.

### 3. Keep OpenSpec validation outside package core verification

The repository has no locally declared OpenSpec executable. `openspec validate --all` therefore remains an explicit OpenSpec/framework-maintenance command required before implementation and archive, rather than becoming an `npm test` dependency on an environment-global CLI. This change repairs the current validator failures; it does not create a duplicate parser or alter package-test admission.

### 4. Delete compatibility rather than preserving it

The implementation performs an exact token inventory for `legacy-image2-first`, markerless pipeline detection, legacy-maintenance routes, and legacy receipt schemas. Each owned occurrence is replaced with the explicit current protocol or deleted with its compatibility branch. An old run is not repaired, inferred, or migrated: it is outside the supported framework contract.

## Risks / Trade-offs

- [A shortened MODIFIED block could delete valid detail on archive] -> Copy the full original requirement and all existing scenarios before adding one scenario; review the generated main-spec diff before archive.
- [A global OpenSpec CLI could make package tests environment-dependent] -> Keep validation as an explicit OpenSpec command, not a package-test dependency.
- [Breaking removal can leave a token in an owner branch] -> Use a complete token inventory and reject legacy/markerless input with focused negative tests.

## Migration Plan

1. Capture baseline validator failures.
2. Add scenarios and the workflow-inspection purpose without changing their existing semantics.
3. Replace source, state, routing, receipt, and documentation protocol values; remove compatibility branches.
4. Run token-negative, source/state/CLI/controller, documentation, and complete validation suites.

No persisted-data migration or rollback is provided. Existing markerless/legacy run bundles are intentionally unsupported after this change.
