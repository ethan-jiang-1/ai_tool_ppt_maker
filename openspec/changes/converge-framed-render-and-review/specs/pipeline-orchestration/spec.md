## MODIFIED Requirements

### Requirement: Page Authority has one receipt-to-delivery lifecycle

Pipeline Orchestration SHALL execute a current Page Authority version as source receipt, selected
workflow raw plan, authorization, raw evidence, raw review, selected-workflow final manifest, final
projection, PPTX assembly, notes injection, and delivery decision. The version SHALL follow its one
bound `framed` or `pure` workflow for all pages. A consistent Page Authority source/state pair SHALL
not invoke a retired adapter, sibling workflow, alternate renderer, per-slide workflow dispatch, or a
generated-directory heuristic.

#### Scenario: Selected workflow has one final lineage

- **WHEN** a current version with one selected workflow has complete accepted raw evidence
- **THEN** only that workflow publishes one final manifest followed by one projection, PPTX receipt, and notes receipt
- **AND** no page is dispatched through the sibling workflow or a separate delivery result

#### Scenario: Mixed workflow evidence is rejected

- **WHEN** a build presents Framed and Pure evidence as if both belonged to one current version
- **THEN** orchestration hard-stops at workflow identity before final publication
- **AND** it does not infer per-slide ownership or merge the evidence

### Requirement: TARGET refresh follows version workflow ownership

TARGET refresh routing SHALL use the bound version workflow and direct artifact freshness facts. A
Framed Text Frame-only edit with exact accepted raw evidence and an unchanged raw contract and render
profile SHALL use provider-free local composition, repeating current layout proof before publication.
A Framed preset, render-profile, safe-zone, underlay, or provider-profile change and every Pure
display/visual change SHALL invalidate raw work and require the existing Generated Image Rebuild,
authorization, and review path. Notes-only work SHALL remain browser-free and use shared delivery.
A structural or workflow change SHALL use the exact preview/hash-bound Structural Versioning Path.

#### Scenario: Target workflow switch is structural

- **WHEN** a user changes a target version from `framed` to `pure` or from `pure` to `framed`
- **THEN** orchestration requires a structural vNext preview and exact plan confirmation
- **AND** it does not mutate the active version workflow or inherit final/delivery acceptance

#### Scenario: Framed text-only refresh remains local

- **WHEN** only Framed Text Frame literals change while accepted underlay, raw contract, safe zones, provider profile, and render profile remain current
- **THEN** orchestration performs current local composition without a provider submission
- **AND** a layout failure stops final publication with the source-repair action

#### Scenario: Render-profile drift requires raw rebuild

- **WHEN** a Framed render-profile input changes even if the previous underlay bytes and safe-zone rectangles appear reusable
- **THEN** orchestration classifies the affected evidence as Generated Image Rebuild debt
- **AND** it does not silently rebind accepted underlay bytes or offer a local force path

#### Scenario: Notes-only refresh remains browser-free

- **WHEN** only speaker notes change and current pixel-owning facts remain valid
- **THEN** orchestration uses the Notes-Only Refresh path without browser or provider work
