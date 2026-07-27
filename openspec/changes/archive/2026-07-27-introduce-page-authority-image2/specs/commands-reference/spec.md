## MODIFIED Requirements

### Requirement: COMMANDS.md covers full-deck creation
COMMANDS.md SHALL route a request for a new deck through BOOTSTRAP, Page Authority initialization,
operation-scoped doctor, and the complete `create-deck` path through intake, content, visual direction,
raw review, final projection, production, PPTX/notes, and delivery review. It SHALL state that new decks
use `image2-page-authority` with `framed-image2` as the source default. It SHALL explain that Pure owns
every pixel while Framed reserves deterministic Text Frame pixels and uses Image2 for the text-free
full-canvas underlay. It SHALL disclose provider readiness/cost and exact operation/IDs/profile/count
before each chargeable submit without treating init, doctor, a probe, or a prior batch as authorization.

Legacy source/state pairs remain existing-run observation/execution behavior during this change but SHALL
not appear as new-deck init choices. COMMANDS SHALL direct an Agent to choose Pure when readable body
labels, values, quotations, captions, timeline dates, or diagram text are needed, and Framed only when
the body is text-free beneath the local Text Frame.

#### Scenario: First-time user creates a PPT
- **WHEN** a user requests a new deck without selecting a historical run
- **THEN** COMMANDS routes to Page Authority initialization and its complete controller path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: Readable body information selects Pure
- **WHEN** an Agent judges that a slide's meaning needs readable body labels or values
- **THEN** COMMANDS directs it to select `pure-image2`
- **AND** it does not invent a local Framed body renderer

#### Scenario: Existing legacy run remains bounded
- **WHEN** a user explicitly targets a currently supported legacy run
- **THEN** COMMANDS routes through that run's exact existing source/state policy during this change
- **AND** it does not offer that policy for fresh initialization

#### Scenario: First-time user requests local production
- **WHEN** a first-time user asks for a new deck with locally owned display text
- **THEN** COMMANDS routes to Page Authority with `framed-image2` and its local Text Frame path
- **AND** it does not offer `html-only` as a fresh-init mode

#### Scenario: Whole-page creation uses the current protocol
- **WHEN** COMMANDS discusses an explicitly targeted existing `image2-only` deck
- **THEN** it identifies `whole-page-image2-v1` as that legacy source's explicit pipeline
- **AND** it does not present that route as the protocol for a new Page Authority deck

## ADDED Requirements

### Requirement: COMMANDS routes Page Authority structural changes through clean targets
For a Page Authority run, COMMANDS.md SHALL route insert, delete, reorder, and page-authority changes
through the existing preview/hash-bound Structural Versioning Path. It SHALL explain that apply publishes
a clean target with only plan-bound, target-owned unreviewed raw materialization or
`needs_raw_generation` debt, makes no provider call, and requires target raw review before finalization.
It SHALL not direct an Agent to copy a final slide, raw approval, provider authorization, or delivery
decision across versions.

#### Scenario: Page Authority reorder creates a clean target
- **WHEN** a user reorders a Page Authority slide
- **THEN** COMMANDS routes to preview, exact plan confirmation, target raw materialization/debt, and
  target-local review rather than an in-place refresh
- **AND** it does not infer reuse from filenames or make a provider request during the structural apply
