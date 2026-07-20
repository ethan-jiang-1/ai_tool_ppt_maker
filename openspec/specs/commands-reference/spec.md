## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to intent routes and ownership-aware execution. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the three artifact-refresh paths plus the outer Structural Versioning Path, the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while the detailed decision tree stays in `scripts/05-iteration/change-classifier.md` and is not duplicated here.
## Requirements
### Requirement: COMMANDS.md exists at framework root

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL exist as a human-readable command reference. It SHALL map natural-language user requests to the agent actions that fulfill them.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration

### Requirement: COMMANDS.md covers full-deck creation

COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP -> Phase 0 setup -> Phase 1 structured content -> Phase 2 visual system/real preview gate -> Phase 3 HTML production/contact sheet/PPTX/notes. It SHALL state that new decks default to `html-first-v1`, require no renderer choice/Image2 key/style master, and may finish after Phase 3. A post-delivery professional visual upgrade SHALL remain optional, cost-authorized visual-slot work rather than a renderer selection or whole-page replacement.

#### Scenario: First-time user creates a PPT

- **WHEN** the user requests a new deck
- **THEN** COMMANDS routes to `create-deck` and the complete local HTML path
- **AND** never asks them to choose a render engine

### Requirement: Commands describe refinement as optional visual-slot work

COMMANDS SHALL route an explicit post-delivery professional visual upgrade to the Phase-4 controller, disclose that it is optional and cost-authorized, and preserve the immediate HTML-complete exit. It SHALL not present Image2 as a renderer selection or whole-page replacement.

#### Scenario: User asks for a professional upgrade

- **WHEN** a completed HTML deck has candidate visual value
- **THEN** guidance offers recommendation and exact authorization rather than starting provider work

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

### Requirement: COMMANDS.md covers iteration feedback patterns

COMMANDS.md SHALL classify iteration feedback by pipeline and source owner before choosing a refresh path. For HTML-first, content reframe MAY return to backbone/structured content; KPI/card/chart-label/case/callout changes SHALL update their structured fields and use Local Slide Rebuild; global palette/typography/spacing/visual-direction feedback SHALL offer 2-3 renderer-neutral preset/system alternatives and use representative preview plus Local Deck Rebuild. Ordinary HTML aesthetic feedback SHALL not prescribe style-master regeneration, Image2 credentials, or remote cost. For markerless legacy, generated-body data, header-lock ownership, safe-zone/render-mode changes, vague visual direction, style-master iteration, and Generated Image Rebuild SHALL retain their current meanings.

#### Scenario: HTML chart copy or KPI changes

- **WHEN** authored HTML-first KPI values, card text, chart labels, or cases change
- **THEN** COMMANDS routes to structured source plus local affected-slide composition
- **AND** does not describe text as necessarily burned into a remote image

#### Scenario: HTML visual direction is vague

- **WHEN** an HTML-first user says the whole deck is not premium enough
- **THEN** the Agent offers renderer-neutral system/preset alternatives and local representative previews
- **AND** creates no style master, provider plan, or authorization

#### Scenario: Legacy generated body data changes

- **WHEN** markerless generated-image body data changes
- **THEN** COMMANDS retains the legacy Generated Image Rebuild and review path

### Requirement: COMMANDS.md complements but does not duplicate scripts/05-iteration/change-classifier.md

COMMANDS.md SHALL be the human-facing interface. `scripts/05-iteration/change-classifier.md` SHALL remain as the agent's detailed decision tree. COMMANDS.md SHALL be concise (no nested decision trees), use natural language examples, and be scannable in under 60 seconds.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

### Requirement: Title-edit intents route by resolved render mode

Title-edit routing SHALL first classify the pipeline. For HTML-first source, KICKER/TITLE/SUBTITLE are renderer-owned visible source and SHALL use Local Slide Rebuild for selected IDs, with browser overflow validation and affected delivery rebuild; render mode SHALL not be consulted. For markerless legacy source, existing `ppt_flow refresh --kind title` resolution remains: `body+header-lock` uses Header Text & Style Refresh and `full-page` uses Generated Image Rebuild with force/review.

#### Scenario: HTML title edit is local

- **WHEN** a selected HTML-first title changes
- **THEN** the slide is locally recomposed and verified
- **AND** no Image2 or legacy header-review evidence is required

#### Scenario: Legacy title edit retains render-aware behavior

- **WHEN** a markerless title edit resolves a legacy render mode
- **THEN** the existing header-text versus generated-image path remains selected

### Requirement: Structural command guidance is preview-first and identity-aware

COMMANDS.md and `scripts/05-iteration/change-classifier.md` SHALL retain the shared structural UX: resolve every position selector against one pre-edit snapshot; display `position + slide_id + title`; keep formal ID stable; preview before mutation; bind apply to canonical plan hash carried by the Agent; route list/resolve/normalize/move/delete/insert/multi-operation through `ppt_flow slides`; never hand-edit or copy `_generated/`; and retain the existing version/deck/Git escape-ladder constraints.

Structural source publication SHALL be renderer-free for both pipelines. For HTML-first, its receipt SHALL report `needs_local_materialization`; a later explicit target-local materializer verifies/copies target-owned immutable objects or composes missing/stale IDs locally, then rebuilds review/delivery with zero provider calls. For markerless legacy, verified expensive raw renders MAY be materialized and missing/unproven IDs SHALL remain `needs_render` for a separately authorized Generated Image Rebuild. Guidance SHALL never label HTML-local work as remote render debt or copy a source-version manifest path into the target.

#### Scenario: HTML insert reports local materialization

- **WHEN** a confirmed HTML-first structural transaction inserts a valid slide
- **THEN** the new source version reports that ID under `needs_local_materialization`
- **AND** a later explicit local materializer owns composition/review/delivery without remote authorization

#### Scenario: Legacy insert reports remote render debt

- **WHEN** a confirmed markerless transaction inserts an ID without verified raw render evidence
- **THEN** the source version reports that ID under `needs_render`
- **AND** requests separate authorization before Generated Image Rebuild

#### Scenario: Reorder resolves one snapshot

- **WHEN** a user deletes or moves multiple current positions
- **THEN** every selector resolves before mutation and the exact before/after ID order is previewed

#### Scenario: Major reframing remains a deck decision

- **WHEN** audience, objective, or narrative materially changes
- **THEN** guidance may recommend a new deck rather than forcing the work into vNext

#### Scenario: Git remains outside structural authority

- **WHEN** Git is absent or a user separately asks about source history
- **THEN** normal source repair/version paths remain available and no generic Git mutation is chosen automatically

### Requirement: COMMANDS documents explicit legacy migration without automatic conversion

COMMANDS SHALL route a user's explicit migration choice to an Agent-authored clean-vNext candidate, complete proposed local HTML deck/contact sheet, exact `verified-current|degraded-missing|degraded-stale` old-side mode, exact mode/hash confirmation, and atomic apply. Only verified-current mode may show old pixels. It SHALL state that degraded modes show diagnosis/placeholder rather than stale bytes, never trigger migration provider calls or a parity claim, and offer separately authorized legacy maintenance when needed. It SHALL preserve the legacy version on decline and never claim prompts can be converted automatically.

#### Scenario: User asks to migrate an old deck

- **WHEN** a markerless deck user explicitly requests HTML migration
- **THEN** COMMANDS requires complete proposed output plus explicit current-old or degraded-old comparison confirmation before new-version publication
- **AND** preserves the old version as a valid fallback

### Requirement: COMMANDS.md documents closed HTML recovery without manual deletion

COMMANDS.md SHALL distinguish ordinary local refresh from exceptional recovery. For a recoverable/uncertain gate journal it SHALL route only through the state-owned journal recovery command and its human-confirmation/age rules. For a confirmed canonical publication-owner reset it SHALL show only `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>`, explain that all canonical HTML generated review/delivery evidence is deleted and old approvals become stale, and require no-active-writer/reader confirmation before the Controller invokes it. It SHALL explain pending reset ownership `active|waiting|recoverable|uncertain|invalid`, the 60000/300000-ms takeover floors, and that successful reset still requires local rebuild plus new content/visual/final review. It SHALL never instruct users to delete a lock/tree manually, edit `_state`, transcribe reset/owner IDs, or combine reset with selectors/dry-run/provider/render/style overrides.

#### Scenario: User asks how to clear an uncertain canonical lock

- **WHEN** COMMANDS classifies the conflict as canonical HTML publication ownership
- **THEN** it presents the exact confirmed reset route and its rebuild/re-review consequence
- **AND** does not suggest removing `.publish.lock` or generated children individually

#### Scenario: Reset owner is still active

- **WHEN** state/status reports a live reset owner
- **THEN** COMMANDS tells the Agent to wait rather than invoke another reset or override the owner
