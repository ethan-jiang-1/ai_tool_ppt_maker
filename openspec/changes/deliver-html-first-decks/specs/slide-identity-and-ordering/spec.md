## MODIFIED Requirements

### Requirement: Round-trip edits do not shift notes or unrelated blocks

Structured contract serialization SHALL continue to use the shared slide-document interface and preserve speaker-note ownership, epilogue boundaries, unrelated blocks, raw owned fences, stable IDs, spoken keys, and source order semantics.

For HTML-first source, structural preview SHALL validate the projected target source against the current run's effective controls with only projected canonical-source bytes substituted. Apply SHALL copy authorized version-owned source/override controls into a hidden vNext, validate the staged effective run, then atomically publish the source version. After source publication, an explicitly requested HTML materialization SHALL run target-local Stage 1, reuse or rebuild slide-local HTML/final-slide artifacts by position-independent composition fingerprint, rebuild order-dependent preview/PPTX/notes, and make zero remote calls. It SHALL not publish a plan during source preview, import legacy prompts/raw images, or create Image2 refinement state.

Move/delete/heading normalization SHALL retain raw YAML fence bytes. Insert SHALL require one complete locally valid HTML-first slide block and referenced assets. Reorder/delete SHALL preserve notes and per-slide semantic/visual/composition fingerprints for unchanged slides; only positions and ordered delivery evidence change.

#### Scenario: Reorder preserves note and pixel binding

- **WHEN** two unchanged HTML-first slides are reordered
- **THEN** each note, stable ID, semantic/visual fingerprint, composition fingerprint, and final-slide SHA remains bound to the same slide
- **AND** target contact sheet/PPTX/notes order is rebuilt locally

#### Scenario: Structured insert cannot create a mixed branch

- **WHEN** an insert contains legacy prompt controls, missing structured body, or unresolved local assets
- **THEN** preview fails before a version transaction is created

#### Scenario: Staged target is revalidated before publication

- **WHEN** source/control drift makes the hidden target invalid
- **THEN** apply removes its own hidden staging and publishes no visible vNext or generated artifact

#### Scenario: Structural materialization is local

- **WHEN** a valid HTML-first structural version is published and materialization is authorized
- **THEN** only local plan/render/compose/assembly/notes operations run
- **AND** provider-call count and Image2 write set remain zero

## ADDED Requirements

### Requirement: Composition artifact identity excludes physical position

HTML page and final-slide artifact identity SHALL use stable slide ID plus renderer contract/composition fingerprint and SHALL not include current position or filename prefixes. Order-dependent manifests/contact sheets/PPTX/notes SHALL derive order only from the current structured plan.

#### Scenario: Position changes without content change

- **WHEN** a slide moves from position 7 to 3
- **THEN** its page/final-slide artifact remains reusable
- **AND** no directory-glob or prefixed filename becomes order authority

### Requirement: Migration comparison preserves legacy identity without guessing content

An explicit legacy-to-HTML migration SHALL preserve existing formal IDs/spoken keys/notes where valid, reserve deleted identities through normal history rules, and require the Agent to author a complete structured block for every migrated slide. Comparison/apply SHALL not parse `IMAGE PROMPT` prose into family/body/fallback fields.

#### Scenario: Legacy prompt has apparent layout instructions

- **WHEN** a prompt describes columns, text, or imagery
- **THEN** migration still requires an Agent-authored structured body
- **AND** does not treat the prompt as deterministic conversion input
