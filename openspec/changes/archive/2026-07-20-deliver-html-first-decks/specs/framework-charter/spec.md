## MODIFIED Requirements

### Requirement: BOOTSTRAP requires showing artifacts before visual gates

BOOTSTRAP and the Agent Contract SHALL require the Agent to show the exact pipeline-owned artifacts before recording human gates. For HTML-first, content approval SHALL follow presentation of the ordered human-reviewed content projection, and visual approval SHALL follow production-equivalent representative/affected-page preview or contact-sheet evidence; selected-current fallback review SHALL visibly use the forced-fallback variant. For markerless legacy, existing style-master/pilot/header artifact rules SHALL remain. Successful generation, prose description, metadata scalar, or an artifact from the other pipeline SHALL not count as approval. The gate record SHALL bind the shown evidence hash and remain human-owned.

#### Scenario: HTML content gate is requested

- **WHEN** the Agent asks for content approval
- **THEN** it first shows the exact ordered content projection whose fingerprint will be approved

#### Scenario: HTML visual gate is requested

- **WHEN** the Agent asks for visual approval
- **THEN** it first shows current production-compositor evidence and identifies its review hash
- **AND** does not substitute a style master or prose summary

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document lifecycle `0 -> 1 -> 2 -> 3 -> [4 optional] -> 5`, with Phase name, purpose, gate, Agent/human ownership, and the fact that Phase 3 delivers a complete contact sheet/PPTX/notes. Phase 4 SHALL be described as an optional professional upgrade that is unavailable in Change 3 and is not required for completion. The workflow SHALL document HTML-first Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and the outer Structural Versioning Path; markerless legacy decks SHALL use the compatibility maintenance route with Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh. Structural Versioning Path SHALL not be presented as a peer refresh.

#### Scenario: Agent understands the complete default path

- **WHEN** an Agent reads `charter/WORKFLOW.md`
- **THEN** it understands that fresh decks complete at HTML Phase 3 without Image2
- **AND** can distinguish local HTML maintenance, optional unavailable Phase 4, and legacy maintenance

### Requirement: Active constitutional guidance matches current runtime behavior

All active root, charter, workflow, reference, playbook, scripts README, template guidance, and OpenSpec context SHALL agree that new decks default to `html-first-v1`; structured content and visual config render locally through HTML pages/final slides; real HTML artifacts precede visual approval; Stage 4 consumes provider-neutral verified final slides; notes follow stable IDs/order; ordinary HTML maintenance is local; and modern Image2 refinement is unavailable. Markerless decks SHALL be described only through explicit legacy maintenance/migration guidance. No active new-deck path SHALL require style master, Image2 credentials, whole-page prompt generation, render-mode intake, or remote regeneration.

#### Scenario: New-deck guidance requires Image2

- **WHEN** coherence scans active new-deck guidance
- **THEN** any Image2/style-master prerequisite or whole-page prompt step is reported as drift

#### Scenario: Visual gate guidance is artifact-based

- **WHEN** active guidance describes HTML visual approval
- **THEN** it requires production-equivalent preview/contact-sheet evidence
- **AND** does not accept a style master or prose-only approval as equivalent

#### Scenario: Version semantics remain source-first

- **WHEN** active guidance describes a new version
- **THEN** it copies source/control delta, keeps generated artifacts rebuildable, and uses target-local production

### Requirement: Editing-path terminology uses English canonical names and controlled legacy aliases

For HTML-first decks, the canonical maintenance names SHALL be Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural Versioning Path. For markerless legacy decks, Header Text & Style Refresh and Generated Image Rebuild remain canonical compatibility terms alongside Notes-Only Refresh and Structural Versioning Path. The classifier/glossary/WORKFLOW/OpenSpec context SHALL define both vocabularies under an explicit `production.pipeline` branch; active operational guidance SHALL not mix them.

Former Chain A/B/C/Structural aliases MAY appear only in the narrow compatibility registries already governed by this capability and SHALL be locally paired with their legacy canonical names. Chinese prose MAY add explanatory glosses but SHALL not create additional formal path names.

#### Scenario: Maintainer classifies an HTML edit

- **WHEN** the source is `html-first-v1`
- **THEN** active guidance uses Local Slide/Deck Rebuild, Notes-Only, or Structural Versioning
- **AND** does not select a path by legacy render mode

#### Scenario: Maintainer classifies a legacy edit

- **WHEN** the source is markerless
- **THEN** legacy render-mode/ownership rules retain Header Text & Style or Generated Image Rebuild terminology

#### Scenario: Bare historical alias appears operationally

- **WHEN** an active non-registry file uses a bare Chain alias
- **THEN** terminology validation reports drift

### Requirement: Active framework guidance separates slide identity from order

Active root/charter/workflow/reference/playbook/scripts/template/authoring guidance SHALL consistently define formal `slide_id` as stable page identity and physical slide-block order as derived current `position`; human examples use `position + slide_id + title`. New pages SHALL use Agent-authored mnemonic-v1 two-block 5-8 ASCII-letter IDs (prefer 5-6), while unique legacy IDs remain compatibility identities and are not silently renamed.

Artifact identity SHALL use `(slide_id, producer, artifact_kind, producer_fingerprint)`, not position/filename/heading or a generic selected-engine field. Provider-neutral final-slide projection SHALL retain producer-private lineage only through its fingerprint. `_generated/` remains rebuildable, framework-owned, and never manually edited/copied. Structural source apply publishes clean vNext without renderer/provider work. HTML receipts use `needs_local_materialization` and later target-local verified reuse/composition; markerless receipts use verified raw materialization plus `needs_render` for separately authorized Generated Image Rebuild. Guidance SHALL retain the heading-repair/vNext/materialize-or-rebuild/new-deck escape ladder and optional Git separation.

#### Scenario: Agent authors a new identity

- **WHEN** guidance requests a new slide ID
- **THEN** it asks for a durable pronounceable two-block mnemonic independent of current position/title

#### Scenario: HTML reorder retains identity locally

- **WHEN** unchanged HTML slides reorder
- **THEN** IDs and reusable composition bytes remain associated independently of position
- **AND** target delivery rebuild is described as local materialization, not remote `needs_render`

#### Scenario: Legacy unproven raw render remains remote debt

- **WHEN** markerless vNext lacks verified raw evidence for an ID
- **THEN** guidance reports `needs_render` and requires separate Generated Image Rebuild authorization

#### Scenario: Multiple producers share one identity model

- **WHEN** guidance discusses HTML and legacy final-slide producers
- **THEN** both use stable slide ID/kind/fingerprint with producer-private lineage
- **AND** do not define engine-specific slide identity or order

#### Scenario: Major reframing may become a new deck

- **WHEN** audience, objective, or narrative materially changes
- **THEN** guidance may recommend a new deck before applying structural work

## ADDED Requirements

### Requirement: Framework ownership separates complete HTML delivery from future refinement

The Constitution and Agent Contract SHALL state that MD Controller/human review owns the decision to approve content/visual output and whether to consider a later professional upgrade; JS owns deterministic HTML rendering/evidence; no provider adapter belongs to ordinary create/build/iteration. Completing HTML delivery SHALL be a terminal valid user outcome with no pending refinement node or false incomplete state.

#### Scenario: User ends after PPTX delivery

- **WHEN** HTML PPTX/notes are current and the user declines or is not offered unavailable refinement
- **THEN** the workflow is complete
- **AND** state has no pending Image2 execution or authorization
