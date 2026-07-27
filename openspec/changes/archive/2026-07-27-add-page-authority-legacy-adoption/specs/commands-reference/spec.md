## MODIFIED Requirements

### Requirement: COMMANDS.md covers full-deck creation
COMMANDS.md SHALL route a request for a new deck through BOOTSTRAP, Page Authority initialization, operation-scoped doctor, and the complete `create-deck` path through intake, content, visual direction, raw review, final projection, production, PPTX/notes, and delivery review. It SHALL state that new decks use `image2-page-authority` with `framed-image2` as the source default. It SHALL explain that Pure owns every pixel while Framed reserves deterministic Text Frame pixels and uses Image2 for the text-free full-canvas underlay. It SHALL disclose provider readiness/cost and exact operation/IDs/profile/count before each chargeable submit without treating init, doctor, a probe, or a prior batch as authorization.

An explicitly targeted exact legacy source/state pair SHALL be observed through the provider-free adoption route rather than offered as an ordinary production path. COMMANDS SHALL state that the Agent first inspects the protocol, then prepares a human-authored Page Authority candidate and per-slide adoption matrix, previews the exact plan, obtains target-intake confirmation, and publishes a clean Page Authority target. It SHALL disclose that adoption makes no Image2 request and that later target raw generation, human raw review, and any pilot are separate actions. Missing, unsupported, or partially Page Authority source/state facts remain repair/export or Page Authority repair paths, never an inferred adoption. COMMANDS SHALL direct an Agent to choose Pure when readable body labels, values, quotations, captions, timeline dates, or diagram text are needed, and Framed only when the body is text-free beneath the local Text Frame.

#### Scenario: First-time user creates a PPT
- **WHEN** a user requests a new deck without selecting a historical run
- **THEN** COMMANDS routes to Page Authority initialization and its complete controller path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: Readable body information selects Pure
- **WHEN** an Agent judges that a slide's meaning needs readable body labels or values
- **THEN** COMMANDS directs it to select `pure-image2`
- **AND** it does not invent a local Framed body renderer

#### Scenario: Existing legacy run enters explicit adoption
- **WHEN** a user explicitly targets a recognized legacy run
- **THEN** COMMANDS routes through inspection, authored candidate/matrix, exact preview/confirmation, and clean target publication
- **AND** it does not advertise ordinary legacy build/refresh/provider work or an automatic conversion

#### Scenario: First-time user requests local production
- **WHEN** a first-time user asks for a new deck with locally owned display text
- **THEN** COMMANDS routes to Page Authority with `framed-image2` and its local Text Frame path
- **AND** it does not offer `html-only` as a fresh-init mode

#### Scenario: Whole-page legacy route remains historical evidence only
- **WHEN** COMMANDS discusses an explicitly targeted existing `image2-only` deck
- **THEN** it identifies `whole-page-image2-v1` only as the source observed for explicit adoption
- **AND** it does not present that route as current production or the protocol for a new Page Authority deck
