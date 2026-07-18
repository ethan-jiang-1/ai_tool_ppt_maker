## ADDED Requirements

### Requirement: Content parsing gates the opt-in HTML-first branch

Stage 1 SHALL recognize a leading direct `production` mapping whose only v1 key is direct string scalar `pipeline` and whose supported direct string value is `html-first-v1`; anchors, aliases, merges, or explicit tags SHALL not synthesize either node, while unrelated existing top-level frontmatter keys remain governed by their owning capabilities. In that branch it SHALL delegate exactly one unindented `**SLIDE BODY**:` + immediately adjacent unindented `yaml` fence per slide to `html-slide-contract`. The fence is the sole parsed authority for visible body/callout values; repeated explanatory prose outside it remains byte-preserved human guidance and SHALL NOT be parsed as a second body. HTML-first source SHALL reject the legacy top-level `render` mapping and per-slide `RENDER MODE`, `IMAGE PROMPT`, and `VISUAL ASSETS` fields, because those would introduce competing layout/body/asset truths. Legacy sources with no `production` key SHALL retain their existing parser and output behavior. A duplicate top-level `production`, present malformed/non-mapping/indirect `production`, unsupported/missing/duplicate/indirect `production.pipeline`, unknown `production` key, or mixed branch SHALL fail loudly rather than be reclassified as legacy.

The canonical HTML-first branch SHALL accept exactly one input file, the run directory's `slide-specifications.md`, and SHALL resolve config/catalog/framework inputs from that run context rather than direct Stage-1 path overrides. Existing standalone multi-input/alternate-control-path behavior remains legacy-only in Change 2; mixing marked and unmarked inputs, passing multiple marked inputs, or supplying an alternate HTML-first style/config/deck-system/output path SHALL fail before merging identities/positions or resolving a plan.

For a canonical run directory, the exact `slide-specifications.md` file is the only eligible HTML-first source. If any sibling matching the legacy `slide-specifications*.md` pattern is present (including a backup or comparison copy), the HTML-first adapter SHALL fail with a bounded multiple-source diagnostic instead of allowing `findSlideSpecs()`-style lexicographic selection. The markerless legacy branch MAY retain its existing first-file/multi-input behavior.

#### Scenario: Marker selects structured parsing

- **WHEN** leading source metadata declares `production.pipeline: html-first-v1`
- **THEN** Stage 1 emits the structured plan contract into the existing rebuildable `slide_plan.json` projection
- **AND** it does not emit legacy page prompts or treat free-form prompt prose as source truth

#### Scenario: Marker omission preserves legacy behavior

- **WHEN** a source omits the marker
- **THEN** Stage 1 preserves the existing legacy plan/prompt behavior
- **AND** it does not add HTML-first fields implicitly

#### Scenario: Mixed legacy and HTML-first controls fail

- **WHEN** an HTML-first source also declares top-level `render` or a slide contains `IMAGE PROMPT`, `RENDER MODE`, or `VISUAL ASSETS`
- **THEN** Stage 1 fails with the conflicting field and source location
- **AND** it does not guess a migration or enter legacy Stage 2

#### Scenario: HTML-first does not merge standalone inputs

- **WHEN** Stage 1 receives multiple inputs and any input declares `html-first-v1`
- **THEN** validation fails with the single canonical source requirement
- **AND** legacy multi-input behavior remains unchanged when every input is unmarked

#### Scenario: HTML-first does not select a backup source

- **WHEN** the canonical run directory contains marked `slide-specifications.md` and any additional `slide-specifications*.md` file
- **THEN** validation fails with the canonical-source and sibling paths
- **AND** it does not select the lexicographically first file or merge backup content
- **AND** markerless legacy source selection remains unchanged

### Requirement: HTML-first source diagnostics identify owned fields

Structured parser failures SHALL identify source file, slide ID when available, fenced field path, and a bounded reason through the existing diagnostic authority. The parser SHALL not expose stacks, provider payloads, or absolute machine paths.

#### Scenario: Invalid block reports a bounded location

- **WHEN** a typed block has an invalid value
- **THEN** the failure names the source field and slide context
- **AND** the diagnostic is safe for the MD Controller to consume

### Requirement: HTML-first slide metadata and concept remain explicit Markdown inputs

Each HTML-first slide block SHALL retain a non-placeholder single-line `VISUAL TYPE` of at most 80 graphemes, non-placeholder `TITLE`, and the existing Markdown `**CONCEPT**:` section with exactly one non-empty single-line `- **MUST communicate**:` bullet and exactly one non-empty single-line `- **MUST NOT**:` bullet. Duplicate required bullets SHALL fail rather than select one. `MUST communicate` SHALL be at most 400 graphemes and `MUST NOT` at most 240. Other existing concept bullets remain byte-preserved but are not contract fields in Change 2. `KICKER` and `SUBTITLE` MAY be absent through the existing presence-normalization contract. Speaker notes MAY be absent in Change 2 but, when present, SHALL remain bound to the stable slide ID. `VISUAL TYPE` SHALL express narrative role only; `SLIDE BODY.family` SHALL express deterministic layout only.

#### Scenario: Narrative role and layout remain separate

- **WHEN** an HTML-first slide declares a narrative `VISUAL TYPE` and a valid body family
- **THEN** both values are retained independently in the structured plan
- **AND** neither is derived from the other

#### Scenario: Missing title or concept blocks validation

- **WHEN** an HTML-first slide has a placeholder/empty TITLE or lacks `CONCEPT.MUST communicate` or `CONCEPT.MUST NOT`
- **THEN** validation fails with the slide ID and missing Markdown field

#### Scenario: Additional concept prose is not silently fingerprinted

- **WHEN** `Bridge from previous`, `Bridge to next`, or `Content structure` changes while the two required concept constraints do not
- **THEN** those Markdown bytes remain preserved and available to humans
- **AND** Change 2 does not add them implicitly to the visual contract fingerprint
