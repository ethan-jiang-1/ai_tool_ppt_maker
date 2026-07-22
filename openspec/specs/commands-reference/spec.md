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

### Requirement: COMMANDS.md complements but does not duplicate scripts/05-iteration/change-classifier.md

COMMANDS.md SHALL be the human-facing interface. `scripts/05-iteration/change-classifier.md` SHALL remain as the agent's detailed decision tree. COMMANDS.md SHALL be concise (no nested decision trees), use natural language examples, and be scannable in under 60 seconds.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

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

COMMANDS SHALL route a user's explicit migration choice to `migrate-import`, where the Agent selects an existing preset from the user's authorized visual direction and runs `ppt_flow migrate-html <source-run-dir> prepare --preset <name>`. It SHALL explain that prepare creates only the isolated projected candidate, deterministic control/asset scaffold, palette, and per-slide checklist; the Agent then authors every structured `SLIDE BODY` and other semantic fields before preview. COMMANDS SHALL not claim that prompt prose was automatically converted or that the user must hand-create deterministic palette/state/asset files.

COMMANDS SHALL describe `migrate-html preview` as a read-only guide when preparation or authoring is incomplete, followed by a complete proposed local HTML deck/contact sheet, exact `verified-current|degraded-missing|degraded-stale` old-side mode, exact mode/hash confirmation, Controller-owned atomic confirmation binding, and apply when the candidate is complete. Only verified-current mode may show old pixels. It SHALL state that degraded modes show diagnosis/placeholder rather than stale bytes, never trigger migration provider calls or a parity claim, and offer separately authorized legacy maintenance when needed. It SHALL preserve the legacy version on decline, preserve authored candidate work during guide responses, and never direct a user to edit `_generated/`, state, a journal, or a lock manually.

The migration statements in `BOOTSTRAP.md`, the migrate/import workflow guide, and the legacy-maintenance reference SHALL use the same closed order: prepare, Agent authoring, complete preview, human confirmation through the Controller-owned state transition, then apply/recovery. They SHALL not reduce the path to `preview/apply`, imply that the user manually enters a state record, or present the confirmation binding as an optional source of authority.

#### Scenario: User asks to migrate an old deck

- **WHEN** a markerless deck user explicitly requests HTML migration
- **THEN** COMMANDS routes through prepare, Agent authoring, complete proposed output, and explicit current-old or degraded-old comparison confirmation before new-version publication
- **AND** preserves the old version as a valid fallback

#### Scenario: Candidate needs authoring after preparation

- **WHEN** preview reports `authoring_required`
- **THEN** COMMANDS directs the Agent to complete only the named structured candidate fields and rerun preview
- **AND** does not suggest copying IMAGE PROMPT prose into a body or deleting scratch files

#### Scenario: Migration references do not skip confirmation binding

- **WHEN** a reader starts from bootstrap, workflow, maintenance, or COMMANDS migration guidance
- **THEN** it reaches the same prepare-to-confirmation-to-apply order
- **AND** it is never told to edit state, a journal, or a lock manually

### Requirement: COMMANDS.md documents closed HTML recovery without manual deletion

COMMANDS.md SHALL distinguish ordinary local refresh from exceptional recovery. For a recoverable/uncertain gate journal it SHALL route only through the state-owned journal recovery command and its human-confirmation/age rules. For a confirmed canonical publication-owner reset it SHALL show only `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>`, explain that all canonical HTML generated review/delivery evidence is deleted and old approvals become stale, and require no-active-writer/reader confirmation before the Controller invokes it. It SHALL explain pending reset ownership `active|waiting|recoverable|uncertain|invalid`, the 60000/300000-ms takeover floors, and that successful reset still requires local rebuild plus new content/visual/final review. It SHALL never instruct users to delete a lock/tree manually, edit `_state`, transcribe reset/owner IDs, or combine reset with selectors/dry-run/provider/render/style overrides.

#### Scenario: User asks how to clear an uncertain canonical lock

- **WHEN** COMMANDS classifies the conflict as canonical HTML publication ownership
- **THEN** it presents the exact confirmed reset route and its rebuild/re-review consequence
- **AND** does not suggest removing `.publish.lock` or generated children individually

#### Scenario: Reset owner is still active

- **WHEN** state/status reports a live reset owner
- **THEN** COMMANDS tells the Agent to wait rather than invoke another reset or override the owner
