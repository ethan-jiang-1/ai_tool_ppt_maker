## RENAMED Requirements

- FROM: `### Requirement: Commands describe refinement as optional visual-slot work`
- TO: `### Requirement: Commands describe mode-scoped visual-slot refinement`

## MODIFIED Requirements

### Requirement: COMMANDS.md covers iteration feedback patterns

COMMANDS.md SHALL classify iteration feedback by authoritative production mode, verified pipeline, and
source owner before choosing a refresh path. For either HTML mode, content reframe MAY return to
backbone/structured content; KPI/card/chart-label/case/callout changes SHALL update their structured
fields and use Local Slide Rebuild; global palette/typography/spacing/visual-direction feedback SHALL
offer 2-3 renderer-neutral preset/system alternatives and use representative preview plus Local Deck
Rebuild. Ordinary HTML aesthetic feedback SHALL not prescribe whole-page style-master regeneration,
Image2 credentials, or remote cost. `html-then-image2` SHALL additionally re-evaluate required
refinement freshness, while an `html-only` refinement request SHALL first offer the mode switch.

For `image2-only`, generated-body data, header-lock ownership, safe-zone/render-mode changes, vague
visual direction, style-master iteration, and Generated Image Rebuild SHALL retain their current
whole-page meanings through the normal first-class route. A historical pre-mode markerless deck SHALL
retain the same artifact behavior through its compatibility route, without making "markerless" a
synonym for legacy in new-deck guidance.

#### Scenario: HTML chart copy or KPI changes

- **WHEN** authored HTML-mode KPI values, card text, chart labels, or cases change
- **THEN** COMMANDS routes to structured source plus local affected-slide composition
- **AND** does not describe text as necessarily burned into a remote image

#### Scenario: HTML visual direction is vague

- **WHEN** an HTML-mode user says the whole deck is not premium enough
- **THEN** the Agent offers renderer-neutral system/preset alternatives and local representative previews
- **AND** creates no whole-page style master, provider plan, or authorization

#### Scenario: Legacy generated body data changes

- **WHEN** generated-image body data changes in a historical pre-mode markerless deck
- **THEN** COMMANDS retains the compatibility Generated Image Rebuild and review path

#### Scenario: Image2-primary generated body data changes

- **WHEN** generated-image body data changes in an `image2-only` run
- **THEN** COMMANDS uses its first-class whole-page rebuild and review path

### Requirement: Title-edit intents route by resolved render mode

Title-edit routing SHALL first resolve the exact version's production mode, verify its pipeline, and
then consult render mode only for whole-page Image2 source. For either HTML mode,
KICKER/TITLE/SUBTITLE are renderer-owned visible source and SHALL use Local Slide Rebuild for selected
IDs, with browser overflow validation and affected delivery rebuild; render mode SHALL not be
consulted. For `image2-only` and historical markerless compatibility source, existing
`ppt_flow refresh --kind title` resolution remains: `body+header-lock` uses Header Text & Style Refresh
and `full-page` uses Generated Image Rebuild with force/review. First-class `image2-only` SHALL use its
normal route rather than `legacy-image2-maintenance`.

#### Scenario: HTML title edit is local

- **WHEN** a selected HTML-mode title changes
- **THEN** the slide is locally recomposed and verified
- **AND** no Image2 or whole-page header-review evidence is required

#### Scenario: Legacy title edit retains render-aware behavior

- **WHEN** a historical markerless title edit resolves a whole-page render mode
- **THEN** the existing header-text versus generated-image path remains selected

#### Scenario: Image2-primary title edit retains render-aware behavior

- **WHEN** an `image2-only` title edit resolves its current render mode
- **THEN** the same header-text versus generated-image contract is selected through the first-class route

### Requirement: COMMANDS.md covers full-deck creation

COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP, explicit/default production-mode
selection, scoped doctor profile, and the corresponding complete `create-deck` path through intake,
content, visual direction, real-artifact review, production, PPTX/notes, and final review. It SHALL state that new decks default to
`image2-only` and explain that `html-only` is the local deterministic route while
`html-then-image2` adds required bounded visual-slot refinement after HTML delivery. It SHALL present
whole-page Image2 as a first-class production choice, not as modern refinement or a legacy downgrade,
and SHALL disclose provider readiness/cost plus exact operation/IDs/profile/count before each chargeable
Image2 action without treating init, doctor, a live probe, or a prior batch as provider authorization.

#### Scenario: First-time user creates a PPT

- **WHEN** a user requests a new deck without another mode preference
- **THEN** COMMANDS routes to `create-deck` and the complete Image2-primary path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: First-time user requests local production

- **WHEN** the user explicitly chooses `html-only`
- **THEN** COMMANDS routes to the complete local HTML path without Image2 prerequisites

### Requirement: Commands describe mode-scoped visual-slot refinement

`COMMANDS.md` SHALL describe modern Phase-4 refinement as bounded visual-slot work for HTML-first
source only. It SHALL be disabled for `html-only`, required for `html-then-image2` completion, and not
applicable to `image2-only`, whose whole-page generation runs through ordinary pilot/build. A user who
wants to start/continue refinement from `html-only` SHALL be shown the atomic same-pipeline switch to
`html-then-image2`; guidance SHALL retain prior refinement/source work and SHALL not run a refinement
command before that switch. Every
refinement route SHALL preserve exact plan authorization, cost disclosure, candidate review, source
promotion, and new final-review boundaries. When current HTML delivery evidence is incomplete but
target-version final-slide/slot inputs are identifiable, guidance MAY recommend the existing offline
`image2 plan --force --reason` continuation and SHALL explain that its prerequisite waiver does not
authorize provider work, promotion, or completion.

#### Scenario: User asks for a professional upgrade

- **WHEN** a completed `html-only` deck has candidate visual value
- **THEN** guidance offers the mode switch, then exact refinement authorization rather than starting provider work

#### Scenario: HTML-then-Image2 reaches HTML delivery

- **WHEN** the required-refinement mode has current HTML delivery but no current refinement
- **THEN** guidance reports delivery current and production incomplete with the refinement next action

#### Scenario: Image2-only user asks for image2 command

- **WHEN** a whole-page user asks to continue production
- **THEN** guidance routes to normal pilot/build rather than modern visual-slot refinement

#### Scenario: User explicitly continues despite delivery evidence risk

- **WHEN** the user accepts a bounded prerequisite risk with a reason and current final-slide/slot identity is valid
- **THEN** guidance offers the offline planning command
- **AND** it keeps authorization, generation, promotion, and final review as separate explicit steps

### Requirement: COMMANDS.md covers refresh and structural paths

COMMANDS.md SHALL first inspect authoritative production mode and verify `production.pipeline`.
HTML-mode examples SHALL route slide text/body/family/fallback edits to Local Slide Rebuild, global
visual-config changes to Local Deck Rebuild, notes to Notes-Only Refresh, and add/delete/reorder to the
preview/hash-bound Structural Versioning Path followed by target-local rebuild. `html-then-image2`
guidance SHALL additionally report refinement freshness after affected HTML changes. `image2-only`
examples SHALL route whole-page Generated Image Rebuild, header-owned refresh, and notes through the
existing whole-page adapter without labeling a new deck as legacy maintenance. Historical markerless
compatibility remains supported. Users MAY refer to pages by current position or spoken mnemonic and
SHALL not need internal path names. Every published same-pipeline target SHALL complete state-owned mode
registration before normal target production; interrupted registration routes to its exact mechanical
repair rather than mode inference.

#### Scenario: HTML title or body changes

- **WHEN** a user edits visible content on one HTML-mode slide
- **THEN** COMMANDS routes to local slide composition/delivery and mode-specific refinement freshness

#### Scenario: HTML visual system changes

- **WHEN** an HTML-mode user requests a full palette/system change
- **THEN** COMMANDS routes to representative local preview/visual gate then Local Deck Rebuild
- **AND** preserves the future HTML style-master seam without claiming an implementation

#### Scenario: User adds or reorders a slide

- **WHEN** the user changes the slide set/order
- **THEN** COMMANDS routes to identity-aware structural preview/confirm/new-version and target materialization

#### Scenario: Markerless user regenerates a visual

- **WHEN** an `image2-only` deck needs a whole-page rebuild
- **THEN** COMMANDS routes through normal mode-owned refresh with existing force/review rules

### Requirement: COMMANDS.md explains how the agent classifies requests

COMMANDS.md SHALL explain ordered classification: (1) inspect the exact run version's authoritative
production mode and verify its pipeline; (2) detect structural change; (3) identify source owner, stale
artifacts, and page/deck scope; (4) determine required real-artifact review; (5) determine whether the
selected path crosses a provider authorization/cost boundary. HTML ordinary production remains local;
whole-page Image2 and modern refinement remain separate provider-backed paths. A vague wish to "make it
better" SHALL not create a provider plan, authorize cost, or switch page authority.

#### Scenario: Human predicts the route

- **WHEN** a human reads the classification section
- **THEN** they can predict different HTML, HTML-plus-refinement, and whole-page handling for similar words
- **AND** understand where provider authorization is and is not required
