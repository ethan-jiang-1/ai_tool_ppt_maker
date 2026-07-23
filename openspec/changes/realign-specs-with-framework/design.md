## Context

The audit began as a proposal to rename the internal `legacy-image2-first` pipeline label. Reading the resolver and its consumers showed that the label participates in marker normalization, controller ownership, transition identity, CLI/status projections, and receipt compatibility. The framework already documents `image2-only` as a first-class mode and explicitly confines historical maintenance to old markerless work without durable state.

The concrete defect is instead structural: five main specs fail `openspec validate --all`. The failure is mechanical and local, but it undermines the role of the entire specification set as a trustworthy maintenance input.

## Goals / Non-Goals

**Goals:**

- Restore complete structural validity for every checked-in main spec.
- Make validation an explicit OpenSpec/framework-maintenance check.
- Preserve current requirements while adding only the scenarios needed to make their behavior executable.
- Correct only demonstrably false active-path wording found by a bounded terminology audit.

**Non-Goals:**

- Do not rename `legacy-image2-first`, add an adapter vocabulary, or migrate state, source, receipts, controller ownership, or CLI fields.
- Do not create a new governance capability for a responsibility already owned by framework verification and charter maintenance.
- Do not change deck workflow, provider authorization, gates, or generated-artifact behavior.

## Decisions

### 1. Preserve the existing pipeline protocol

`legacy-image2-first` remains the current normalized code protocol. Active guidance must continue to describe `image2-only` as first-class whole-page production, while technical protocol references remain precise. A future protocol rename is a separate cross-cutting change, not a prose cleanup.

### 2. Repair invalid requirements in place

Each invalid main requirement receives a `MODIFIED` delta containing its complete existing behavior plus one scenario. This is replacement, not an added competing rule. `workflow-inspection` also receives its real Purpose during implementation because Purpose lies outside OpenSpec delta requirement operations.

### 3. Keep OpenSpec validation outside package core verification

The repository has no locally declared OpenSpec executable. `openspec validate --all` therefore remains an explicit OpenSpec/framework-maintenance command required before implementation and archive, rather than becoming an `npm test` dependency on an environment-global CLI. This change repairs the current validator failures; it does not create a duplicate parser or alter package-test admission.

### 4. Audit terminology without presuming a rename

The implementation searches active new-run documentation and requirements for claims that `image2-only` is compatibility-only. Each hit is classified as current behavior, historical compatibility, or ambiguous. Only false current-path wording is edited. This protects existing source/receipt contracts from a broad find-and-replace.

## Risks / Trade-offs

- [A shortened MODIFIED block could delete valid detail on archive] -> Copy the full original requirement and all existing scenarios before adding one scenario; review the generated main-spec diff before archive.
- [A global OpenSpec CLI could make package tests environment-dependent] -> Keep validation as an explicit OpenSpec command, not a package-test dependency.
- [Terminology audit could become a protocol rename by stealth] -> Reject changes to code protocol values, serialized fields, and source markers in this change.

## Migration Plan

1. Capture baseline validator failures.
2. Add scenarios and the workflow-inspection purpose without changing their existing semantics.
3. Audit active guidance against actual code policy; correct only proven wording drift.
4. Run complete spec validation, focused documentation verification where applicable, and the existing core suite.

No persisted-data migration or rollback is required because this change writes no run-bundle protocol value.
