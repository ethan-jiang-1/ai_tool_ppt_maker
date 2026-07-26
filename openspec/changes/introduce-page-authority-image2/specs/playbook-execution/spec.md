## ADDED Requirements

### Requirement: New decks enter the Page Authority production controller
The registered create-deck controller SHALL route a fresh `image2-page-authority` run through Page
Authority source authoring, visual-language selection, scoped provider authorization, raw review, final
projection, assembly, notes, and delivery review. The MD Controller SHALL own human visual decisions;
JS SHALL own resolver, readiness, evidence, and state checks. Existing legacy runs retain their current
controller behavior during this change and Page Authority runs SHALL never enter legacy nodes.

#### Scenario: Fresh run uses Page Authority nodes
- **WHEN** a fresh initialized run has the exact Page Authority source/state pair
- **THEN** the active controller set contains the Page Authority lifecycle and excludes HTML/header-lock/visual-slot nodes
- **AND** provider work requires the displayed scoped authorization

### Requirement: Page Authority gates have one direct recovery path
Page Authority nodes SHALL classify source/state corruption, invalid frame/registry/reference, missing
authorization, and missing/stale raw coverage as non-waivable hard-stops. Raw and delivery visual review
are human `proceed|repair|redirect` decisions bound to current evidence. A node SHALL present the
owner-issued nearest recovery action and shall not synthesize approval, a fallback path, or a state edit.

#### Scenario: Stale raw review blocks progress
- **WHEN** the finalization node detects missing or stale raw acceptance
- **THEN** it returns to the raw evidence/review owner
- **AND** it does not create final, PPTX, or notes output

## MODIFIED Requirements

### Requirement: create-deck playbook covers complete deck creation
`create-deck.md` SHALL define a complete mode-aware workflow from init/intake through authored content,
visual direction, real-artifact gates, mode-owned production, evidence-bound final review, readiness,
and completion. A fresh run SHALL use `image2-page-authority`: resolve per-slide Pure/Framed authority,
obtain scoped authorization for raw work, obtain raw visual review, finalize one mixed manifest, assemble
PPTX, inject notes, and record delivery review. Existing `image2-only`, `html-only`, and
`html-then-image2` runs retain their current mode-owned workflows during this change; they are not
fresh-init choices.

For Page Authority, the Controller SHALL bind a provider decision to run, operation, selected stable
IDs, generation profile, and maximum submissions. It SHALL not infer authorization from init, doctor,
review, a prior batch, or chat. A proven zero-submit operation continues mechanically. Before delivery
review, the Controller SHALL show the current raw/final projections and PPTX/notes result; JS binds the
decision to exact current evidence. Repair returns to the owner, and redirection never mutates the
current version from free text.

#### Scenario: User starts with the default mode
- **WHEN** COMMANDS routes a fresh request without a historical run
- **THEN** execution begins with `image2-page-authority` and its Page Authority node set
- **AND** it does not require HTML source, whole-page mode selection, or visual-slot refinement

#### Scenario: Framed local refresh needs no authorization
- **WHEN** an exact current Framed Text Frame refresh proves it will submit zero provider work
- **THEN** the Controller continues through local finalization/delivery work without requesting authorization
- **AND** it still requires current raw acceptance before finalization

#### Scenario: Legacy run retains its current controller during the bridge
- **WHEN** an explicitly targeted existing run resolves to a current legacy source/state pair
- **THEN** the Controller retains that mode's existing controller behavior during Change 1
- **AND** it does not reclassify the run as Page Authority or create an adoption record

#### Scenario: Delivery changes after final review
- **WHEN** a Page Authority raw tuple, final manifest, assembly, or notes receipt changes after `proceed`
- **THEN** the prior delivery decision is stale and completion returns to current review
