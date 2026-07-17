## ADDED Requirements

### Requirement: Content parsing gates the opt-in HTML-first branch

Stage 1 SHALL recognize `production.pipeline: html-first-v1` only in the canonical leading source control area and SHALL delegate its fenced `SLIDE BODY` content to `html-slide-contract`. Legacy sources SHALL retain their existing parser and output behavior.

#### Scenario: Marker selects structured parsing

- **WHEN** leading source metadata declares `production.pipeline: html-first-v1`
- **THEN** Stage 1 emits the structured plan contract and does not assemble a legacy free-form prompt as the source of truth

#### Scenario: Marker omission preserves legacy behavior

- **WHEN** a source omits the marker
- **THEN** Stage 1 preserves the existing legacy plan/prompt behavior
- **AND** it does not add HTML-first fields implicitly

### Requirement: HTML-first source diagnostics identify owned fields

Structured parser failures SHALL identify source file, slide ID when available, fenced field path, and a bounded reason through the existing diagnostic authority. The parser SHALL not expose stacks, provider payloads, or absolute machine paths.

#### Scenario: Invalid block reports a bounded location

- **WHEN** a typed block has an invalid value
- **THEN** the failure names the source field and slide context
- **AND** the diagnostic is safe for the MD Controller to consume
