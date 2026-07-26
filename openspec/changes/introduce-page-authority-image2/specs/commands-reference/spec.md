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
