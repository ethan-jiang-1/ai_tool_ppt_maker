## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to intent routes and ownership-aware execution. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the three artifact-refresh paths plus the outer Structural Versioning Path, the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while the detailed decision tree stays in `scripts/05-iteration/change-classifier.md` and is not duplicated here.
## Requirements

### Requirement: COMMANDS resume guidance names the inspection control input

For a known exact run, `COMMANDS.md` SHALL direct resume and gate guidance to `state --json.workflow_inspection.primary_action` and the owner-issued `continuation`. It SHALL distinguish these read-only observation inputs from the direct public CLI command that performs a mutation.

#### Scenario: Human resumes an existing deck
- **WHEN** a human or Agent follows COMMANDS guidance for an existing exact run
- **THEN** it obtains the current inspection action before selecting the owner mutation route
- **AND** it does not infer a route from a compatibility summary or rendered artifact
### Requirement: COMMANDS.md exists at framework root

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL exist as a human-readable command reference. It SHALL map natural-language user requests to the agent actions that fulfill them.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration

### Requirement: COMMANDS.md covers full-deck creation
COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP, explicit/default production-mode selection, scoped doctor profile, and the corresponding complete `create-deck` path through intake, content, visual direction, real-artifact review, production, PPTX/notes, and final review. It SHALL state that new decks default to `image2-only` and explain that `html-only` is the local deterministic route while `html-then-image2` adds required bounded visual-slot refinement after HTML delivery. It SHALL present whole-page Image2 as a first-class production choice with its own complete current route, and SHALL disclose provider readiness/cost plus exact operation/IDs/profile/count before each chargeable Image2 action without treating init, doctor, a live probe, or a prior batch as provider authorization.

#### Scenario: First-time user creates a PPT
- **WHEN** a user requests a new deck without another mode preference
- **THEN** COMMANDS routes to `create-deck` and the complete Image2-primary path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: First-time user requests local production
- **WHEN** the user explicitly chooses `html-only`
- **THEN** COMMANDS routes to the complete local HTML path without Image2 prerequisites

#### Scenario: Whole-page creation uses the current protocol
- **WHEN** COMMANDS names an `image2-only` deck
- **THEN** it identifies `whole-page-image2-v1` as that source's explicit pipeline
- **AND** it routes cross-pipeline work only through the current `state --*-production-mode-transition` operations

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
COMMANDS.md SHALL first inspect the exact run version's authoritative production mode and verify its
explicit `production.pipeline` marker. HTML-mode examples SHALL route slide text/body/family/fallback
edits to Local Slide Rebuild, global visual-config changes to Local Deck Rebuild, notes to Notes-Only
Refresh, and add/delete/reorder to the preview/hash-bound Structural Versioning Path followed by
target-local rebuild. `html-then-image2` guidance SHALL additionally report refinement freshness after
affected HTML changes. An `image2-only` run with `whole-page-image2-v1` SHALL route whole-page
Generated Image Rebuild, header-owned refresh, and notes through the normal whole-page adapter with its
existing force, review, and authorization rules. A missing, retired, malformed, or state-inconsistent
source SHALL receive the state owner's one bounded typed next action; COMMANDS SHALL not infer a mode
from generated files, a Controller history, or directory shape and SHALL not direct a person to edit YAML.

#### Scenario: HTML title or body changes
- **WHEN** a user edits visible content on one HTML-mode slide
- **THEN** COMMANDS routes to local slide composition/delivery and mode-specific refinement freshness

#### Scenario: HTML visual system changes
- **WHEN** an HTML-mode user requests a full palette or system change
- **THEN** COMMANDS routes to representative local preview and visual gate, then Local Deck Rebuild
- **AND** preserves the future HTML style-master seam without claiming an implementation

#### Scenario: User adds or reorders a slide
- **WHEN** the user changes the slide set or order
- **THEN** COMMANDS routes to identity-aware structural preview, confirmation, clean version, and target materialization

#### Scenario: Current whole-page user regenerates a visual
- **WHEN** an `image2-only` run with `whole-page-image2-v1` needs a whole-page rebuild
- **THEN** COMMANDS routes through normal mode-owned refresh with the existing force and review rules

#### Scenario: Historical source requests a refresh
- **WHEN** the source marker, durable mode, or current record cannot establish a supported pair
- **THEN** COMMANDS surfaces the one owner-issued typed next action
- **AND** it does not select a compatibility refresh route or ask the user to construct state by hand

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
backbone/structured content; KPI/card/chart-label/case/callout changes SHALL update structured fields and
use Local Slide Rebuild; global palette/typography/spacing/visual-direction feedback SHALL offer 2-3
renderer-neutral preset or system alternatives and use representative preview plus Local Deck Rebuild.
Ordinary HTML aesthetic feedback SHALL not prescribe whole-page style-master regeneration, Image2
credentials, or remote cost. `html-then-image2` SHALL additionally re-evaluate required refinement
freshness, while an `html-only` refinement request SHALL first offer the same-pipeline switch.

For `image2-only` with `whole-page-image2-v1`, generated-body data, header-lock ownership,
safe-zone/render-mode changes, vague visual direction, style-master iteration, and Generated Image
Rebuild SHALL retain their normal whole-page meanings. A historical or markerless record is not a
variant of that route: it SHALL return the one bounded owner-issued typed next action and SHALL not be
used to authorize generated-image work.

#### Scenario: HTML chart copy or KPI changes
- **WHEN** authored HTML-mode KPI values, card text, chart labels, or cases change
- **THEN** COMMANDS routes to structured source plus local affected-slide composition
- **AND** does not describe text as necessarily burned into a remote image

#### Scenario: HTML visual direction is vague
- **WHEN** an HTML-mode user says the whole deck is not premium enough
- **THEN** the Agent offers renderer-neutral system or preset alternatives and local representative previews
- **AND** creates no whole-page style master, provider plan, or authorization

#### Scenario: Unsupported generated-body source changes
- **WHEN** generated-image body data is requested from a historical or markerless source
- **THEN** COMMANDS returns the one owner-issued typed next action before an Image2 operation
- **AND** does not describe the unsupported record as a maintenance variant of a current deck

#### Scenario: Image2-primary generated body data changes
- **WHEN** generated-image body data changes in an `image2-only` run with `whole-page-image2-v1`
- **THEN** COMMANDS uses its first-class whole-page rebuild and review path

### Requirement: COMMANDS.md complements but does not duplicate scripts/05-iteration/change-classifier.md

COMMANDS.md SHALL be the human-facing interface. `scripts/05-iteration/change-classifier.md` SHALL remain as the agent's detailed decision tree. COMMANDS.md SHALL be concise (no nested decision trees), use natural language examples, and be scannable in under 60 seconds.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

### Requirement: Title-edit intents route by resolved render mode
Title-edit routing SHALL first resolve the exact version's production mode, verify its pipeline, and then
consult render mode only for `whole-page-image2-v1`. For either HTML mode, KICKER/TITLE/SUBTITLE are
renderer-owned visible source and SHALL use Local Slide Rebuild for selected IDs, with browser overflow
validation and affected delivery rebuild; render mode SHALL not be consulted. For `image2-only`, existing
`ppt_flow refresh --kind title` resolution remains: `body+header-lock` uses Header Text & Style Refresh
and `full-page` uses Generated Image Rebuild with force and review. An unsupported historical state SHALL
not receive a render-mode inference or a continuation route.

#### Scenario: HTML title edit is local
- **WHEN** a selected HTML-mode title changes
- **THEN** the slide is locally recomposed and verified
- **AND** no Image2 or whole-page header-review evidence is required

#### Scenario: Current whole-page title edit retains render-aware behavior
- **WHEN** an `image2-only` title edit resolves its explicit whole-page render mode
- **THEN** the header-text or generated-image contract is selected through the normal route

#### Scenario: Historical title edit has no inferred route
- **WHEN** title routing cannot establish a current explicit source and state identity
- **THEN** it returns the one owner-issued typed next action before refresh work

### Requirement: Structural command guidance is preview-first and identity-aware
COMMANDS.md and `scripts/05-iteration/change-classifier.md` SHALL retain the shared structural UX:
resolve every position selector against one pre-edit snapshot; display `position + slide_id + title`; keep
formal ID stable; preview before mutation; bind apply to canonical plan hash carried by the Agent; route
list/resolve/normalize/move/delete/insert/multi-operation through `ppt_flow slides`; never hand-edit or
copy `_generated/`; and retain the existing version/deck/Git escape-ladder constraints.

Structural source publication SHALL be renderer-free for both current pipelines. For HTML-first, its
receipt SHALL report `needs_local_materialization`; a later explicit target-local materializer
verifies/copies target-owned immutable objects or composes missing/stale IDs locally, then rebuilds
review/delivery with zero provider calls. For `whole-page-image2-v1`, verified expensive raw renders MAY
be materialized and missing or unproven IDs SHALL remain `needs_render` for a separately authorized
Generated Image Rebuild. Guidance SHALL never label HTML-local work as remote render debt, copy a
source-version manifest path into the target, or infer whole-page authority from an unsupported source.

#### Scenario: HTML insert reports local materialization
- **WHEN** a confirmed HTML-first structural transaction inserts a valid slide
- **THEN** the new source version reports that ID under `needs_local_materialization`
- **AND** a later explicit local materializer owns composition, review, and delivery without remote authorization

#### Scenario: Whole-page insert reports remote render debt
- **WHEN** a confirmed `whole-page-image2-v1` transaction inserts an ID without verified raw-render evidence
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

### Requirement: COMMANDS.md documents closed HTML recovery without manual deletion

COMMANDS.md SHALL distinguish ordinary local refresh from exceptional recovery. For a recoverable/uncertain gate journal it SHALL route only through the state-owned journal recovery command and its human-confirmation/age rules. For a confirmed canonical publication-owner reset it SHALL show only `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>`, explain that all canonical HTML generated review/delivery evidence is deleted and old approvals become stale, and require no-active-writer/reader confirmation before the Controller invokes it. It SHALL explain pending reset ownership `active|waiting|recoverable|uncertain|invalid`, the 60000/300000-ms takeover floors, and that successful reset still requires local rebuild plus new content/visual/final review. It SHALL never instruct users to delete a lock/tree manually, edit `_state`, transcribe reset/owner IDs, or combine reset with selectors/dry-run/provider/render/style overrides.

#### Scenario: User asks how to clear an uncertain canonical lock

- **WHEN** COMMANDS classifies the conflict as canonical HTML publication ownership
- **THEN** it presents the exact confirmed reset route and its rebuild/re-review consequence
- **AND** does not suggest removing `.publish.lock` or generated children individually

#### Scenario: Reset owner is still active

- **WHEN** state/status reports a live reset owner
- **THEN** COMMANDS tells the Agent to wait rather than invoke another reset or override the owner

### Requirement: Commands route page-authority changes to versioned transition
COMMANDS.md and the change classifier SHALL distinguish a request to change final page authority from a refresh, ordinary structural version, style iteration, or quality-improvement request. After resolving an exact supported source/mode pair, an `html-* <-> image2-only` request SHALL route only to the state-owned `production-mode-transition` workflow: explicit target mode and authored target inputs, offline preview, the target user's exact plan-hash transaction commit, clean vNext publication, target registration, and target-owned production. That commit records target-intake selection, not a quality/process-risk waiver: it carries no risk reason, force option, or continuation semantics. Missing, malformed, retired, or mismatched source/state facts SHALL produce one bounded owner-issued typed diagnostic and SHALL not select a Controller.

Guidance SHALL explain that the transition preserves the source version and does not promise an in-place conversion. For an HTML target it SHALL state only that the existing runnable HTML contract is validated/materialized after handoff; it SHALL not promise a visual-quality evaluation or improvement. For an Image2 target it SHALL disclose the normal post-publication Image2 authorization and quality-review boundary. A vague request to make HTML look better SHALL remain an HTML quality/iteration concern and SHALL not start a production-mode transition.

#### Scenario: User asks to change renderer
- **WHEN** a user asks to move a current HTML deck to whole-page Image2
- **THEN** guidance routes to explicit target authoring and versioned transition preview rather than `refresh` or an in-place mode setter

#### Scenario: User asks to improve HTML appearance
- **WHEN** a user asks only for better HTML visual quality
- **THEN** guidance does not claim this transition change implements that quality work or create a cross-pipeline candidate

#### Scenario: Unsupported source asks to change renderer
- **WHEN** a markerless, retired, or state-absent source asks to change page authority
- **THEN** guidance names recreation or the exact source/state repair diagnostic
- **AND** it does not offer a compatibility Controller or candidate path
