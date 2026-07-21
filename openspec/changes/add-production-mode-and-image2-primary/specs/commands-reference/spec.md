## MODIFIED Requirements

### Requirement: COMMANDS.md covers full-deck creation

COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP, explicit/default production-mode
selection, and the corresponding complete `create-deck` path. It SHALL state that new decks default to
`image2-only` and explain that `html-only` is the local deterministic route while
`html-then-image2` adds required bounded visual-slot refinement after HTML delivery. It SHALL present
whole-page Image2 as a first-class production choice, not as modern refinement or a legacy downgrade,
and SHALL disclose provider readiness/cost before an Image2 action without treating init itself as
provider authorization.

#### Scenario: First-time user accepts the default

- **WHEN** a user requests a new deck without another mode preference
- **THEN** COMMANDS routes to `create-deck` and the complete Image2-primary path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: First-time user requests local production

- **WHEN** the user explicitly chooses `html-only`
- **THEN** COMMANDS routes to the complete local HTML path without Image2 prerequisites

### Requirement: Commands describe refinement as optional visual-slot work

`COMMANDS.md` SHALL describe modern Phase-4 refinement as bounded visual-slot work for HTML-first
source only. It SHALL be optional for `html-only`, required for `html-then-image2` completion, and not
applicable to `image2-only`, whose whole-page generation runs through ordinary pilot/build. Every
refinement route SHALL preserve exact plan authorization, cost disclosure, candidate review, source
promotion, and new final-review boundaries. When current HTML delivery evidence is incomplete but
target-version final-slide/slot inputs are identifiable, guidance MAY recommend the existing offline
`image2 plan --force --reason` continuation and SHALL explain that its prerequisite waiver does not
authorize provider work, promotion, or completion.

#### Scenario: HTML-only user asks for a professional upgrade

- **WHEN** a completed `html-only` deck has candidate visual value
- **THEN** guidance offers optional refinement and exact authorization rather than starting provider work

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
SHALL not need internal path names.

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

#### Scenario: Image2-primary user regenerates a visual

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
