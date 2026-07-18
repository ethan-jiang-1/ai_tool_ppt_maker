## MODIFIED Requirements

### Requirement: COMMANDS.md covers full-deck creation

COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP -> Phase 0 setup -> Phase 1 structured content -> Phase 2 visual system/real preview gate -> Phase 3 HTML production/contact sheet/PPTX/notes. It SHALL state that new decks default to `html-first-v1`, require no renderer choice/Image2 key/style master, and may finish after Phase 3. It SHALL not expose an executable modern Phase-4 refinement route in Change 3.

#### Scenario: First-time user creates a PPT

- **WHEN** the user requests a new deck
- **THEN** COMMANDS routes to `create-deck` and the complete local HTML path
- **AND** never asks them to choose a render engine

### Requirement: COMMANDS.md covers refresh and structural paths

COMMANDS.md SHALL first branch by `production.pipeline`. HTML-first examples SHALL route slide text/body/family/fallback edits to Local Slide Rebuild, global visual-config changes to Local Deck Rebuild, notes to Notes-Only Refresh, and add/delete/reorder to preview/hash-bound Structural Versioning Path followed by target-local rebuild. Markerless examples SHALL retain the existing legacy refresh routes. Users MAY refer to pages by current position or spoken mnemonic and SHALL not need to know internal path names.

#### Scenario: HTML title or body changes

- **WHEN** a user edits visible content on one HTML-first slide
- **THEN** COMMANDS routes to local slide composition/delivery without remote generation

#### Scenario: HTML visual system changes

- **WHEN** a user requests a full palette/system change
- **THEN** COMMANDS routes to representative local preview/visual gate then Local Deck Rebuild
- **AND** does not prescribe style master or Image2 pilot

#### Scenario: User adds or reorders a slide

- **WHEN** the user changes the slide set/order
- **THEN** COMMANDS routes to identity-aware structural preview/confirm/new-version and target-local rebuild

#### Scenario: Markerless user regenerates a visual

- **WHEN** the deck is legacy and the user requests a whole-page image rebuild
- **THEN** COMMANDS routes to `legacy-image2-maintenance` with existing force/review rules

### Requirement: COMMANDS.md explains how the agent classifies requests

COMMANDS.md SHALL explain ordered classification: (1) probe `production.pipeline`; (2) detect structural change; (3) identify source owner/stale artifacts and page/deck scope; (4) determine required real-artifact review; (5) determine whether the selected explicit legacy path has a remote cost. HTML-first ordinary create/edit/build SHALL always remain local; a vague wish to "make it better" SHALL not create a provider plan or authorization.

#### Scenario: Human predicts the route

- **WHEN** a human reads the classification section
- **THEN** they can predict different HTML versus legacy handling for similar words
- **AND** understand why ordinary HTML visual work is still zero-remote

### Requirement: Title-edit intents route by resolved render mode

Title-edit routing SHALL first classify the pipeline. For HTML-first source, KICKER/TITLE/SUBTITLE are renderer-owned visible source and SHALL use Local Slide Rebuild for selected IDs, with browser overflow validation and affected delivery rebuild; render mode SHALL not be consulted. For markerless legacy source, existing `ppt_flow refresh --kind title` resolution remains: `body+header-lock` uses Header Text & Style Refresh and `full-page` uses Generated Image Rebuild with force/review.

#### Scenario: HTML title edit is local

- **WHEN** a selected HTML-first title changes
- **THEN** the slide is locally recomposed and verified
- **AND** no Image2 or legacy header-review evidence is required

#### Scenario: Legacy title edit retains render-aware behavior

- **WHEN** a markerless title edit resolves a legacy render mode
- **THEN** the existing header-text versus generated-image path remains selected

## ADDED Requirements

### Requirement: COMMANDS documents explicit legacy migration without automatic conversion

COMMANDS SHALL route a user's explicit migration choice to an Agent-authored clean-vNext candidate, full local HTML comparison, exact plan confirmation, and atomic apply. It SHALL offer keeping the legacy version when the user declines and SHALL not claim prompts can be converted automatically.

#### Scenario: User asks to migrate an old deck

- **WHEN** a markerless deck user explicitly requests HTML migration
- **THEN** COMMANDS requires full comparison and confirmation before new-version publication
- **AND** preserves the old version as a valid fallback
