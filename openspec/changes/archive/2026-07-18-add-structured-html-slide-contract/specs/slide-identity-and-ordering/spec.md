## ADDED Requirements

### Requirement: Structured contract preserves stable identity and derived order

The HTML-first structured plan SHALL reuse the existing stable slide ID, spoken-key, and current physical position contract. Reordering SHALL update derived positions and heading projections while preserving IDs, spoken keys, notes bindings, per-slide semantic/visual fingerprints, and the deck style-reference fingerprint; the complete ordered plan digest SHALL change. The contract SHALL not introduce a second order source.

#### Scenario: Reordered structured slides keep identity

- **WHEN** a structured slide moves from position 7 to position 3 without content changes
- **THEN** its plan record reports position 3 with the same stable ID and spoken key
- **AND** its semantic and visual contract fingerprints remain unchanged
- **AND** the ordered plan digest changes with the physical sequence

#### Scenario: Deleted identity is not reused

- **WHEN** a structured slide is deleted from a version
- **THEN** its formal ID and spoken key remain reserved by existing history rules
- **AND** a later structured insertion cannot reuse them silently

### Requirement: Round-trip edits do not shift notes or unrelated blocks

Structured contract serialization SHALL operate through the shared slide-document interface and SHALL preserve speaker-note ownership, epilogue boundaries, and unrelated slide blocks when identity/order changes are applied.

For a source marked `html-first-v1`, structural preview SHALL validate the projected complete target source against the same branch/fence/family/capacity and referenced config/catalog/font contract core as write-free Stage 1. Because no target directory exists during preview, its run context SHALL be exactly the current source run's effective control tree with only the in-memory projected `slide-specifications.md` bytes substituted; structural operations cannot supply alternate palette/catalog/font paths. Apply SHALL copy the authorized version-owned source/override controls into the hidden staged vNext, retain normal inheritance from the shared backbone/framework, then repeat validation against that staged directory's actual effective source/control tree before the final vNext rename. Move/delete/heading normalization SHALL move or retain complete raw fences without canonicalizing their YAML. Insert SHALL require one complete HTML-first slide block with the Agent-authored ID, required Markdown fields/concept bullets, exact structured body grammar, and locally valid referenced assets; a legacy `IMAGE PROMPT` block, missing body, or unresolved fallback/icon ID SHALL fail the preview. Structural preview/apply remain remote-free, do not publish `_generated/slide_plan.json`, and do not turn source publication into legacy production materialization.

#### Scenario: Reorder preserves note binding

- **WHEN** two structured slides are reordered
- **THEN** each note remains attached to its stable slide ID
- **AND** no note is reassigned by numeric position

#### Scenario: Structured insert cannot create a mixed branch

- **WHEN** an HTML-first insert preview supplies a new slide block with legacy prompt controls or without a valid `SLIDE BODY`
- **THEN** preview fails before creating a transaction/version
- **AND** the editor does not invent or migrate the missing structured content

#### Scenario: Staged target is fully revalidated without plan publication

- **WHEN** an HTML-first structural transaction passed preview but source/control input drift makes the hidden staged target fail config, catalog, font, or family validation
- **THEN** apply removes only that attempt's hidden staging directory and publishes no visible vNext
- **AND** it writes no generated structured plan or production artifact while validating the target

#### Scenario: Preview cannot substitute future control inputs

- **WHEN** an HTML-first structural preview projects source edits before a vNext directory exists
- **THEN** it validates projected source bytes against the current run's effective palette/catalog/font controls
- **AND** it cannot accept a future or alternate control path that apply would not copy into the staged target
