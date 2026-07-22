## ADDED Requirements

### Requirement: CLI exposes a closed versioned production-transition protocol

`ppt_flow state` SHALL add closed mutually exclusive operations for a cross-pipeline source run:
`--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`,
`--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`,
`--apply-production-mode-transition --plan-hash <hash>`, and the owner-scoped recovery operation.
They SHALL delegate to the state-owned transaction and selected adapter; they SHALL not be a generic
state editor, accept caller-supplied receipt/lineage paths, or accept `--force`.

Prepare and preview SHALL be local/offline.  HTML-to-Image2 preview SHALL not resolve transport or
submit a provider request; successful Image2 target publication SHALL report the later normal
authorization/pilot/build boundary.  Image2-to-HTML preview SHALL report source/candidate/contract
validity and may emit current renderer evidence, but SHALL not report an HTML quality score, visual
parity verdict, or quality retry action.  Confirmation is a `confirm` gate on the exact mode/hash;
missing authority, stale inputs, conflict, or invalid provenance is a hard-stop before writes.

#### Scenario: HTML-to-Image2 preview is offline

- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode

- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Confirmation flags conflict

- **WHEN** a caller mixes transition operations, JSON, gate recovery, delivery-review, or an unrelated state operation
- **THEN** CLI returns one `USAGE` envelope before source/state/candidate/target mutation

#### Scenario: Apply lacks current confirmation

- **WHEN** apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation/publication and directs the Controller to the exact preview checkpoint
