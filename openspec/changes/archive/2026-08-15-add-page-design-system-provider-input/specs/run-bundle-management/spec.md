## ADDED Requirements

### Requirement: Initialization seeds a neutral optional Page Design System source

Fresh Run Bundle initialization SHALL create the canonical backbone Page Design
System source as a zero-byte regular file. Its content SHALL be neutral: it
SHALL NOT contain deck-specific visual prose, a provider prompt, a source
literal, a historical example, lifecycle evidence, or a workflow-specific
default. A zero-byte seed and an absent optional source have the same current
runtime null semantics.

Current validation SHALL accept an older Bundle whose optional Page Design
System source is absent when its other declared current topology is valid. A
new-version operation SHALL retain the shared deck-level backbone source in
place and copy a matching version override only through its existing overrides
copy path; it SHALL still create fresh workflow evidence under the existing
rules. Initialization, validation, and new-version creation SHALL not create a
receipt, resolved source binding, raw plan, authorization, provider request,
review, or delivery evidence merely by handling this source.

#### Scenario: Init creates a discoverable neutral source

- **WHEN** `init` creates a new current Run Bundle
- **THEN** the backbone visual-style directory contains a zero-byte
  `page-design-system.md` regular file at its canonical location
- **AND** initialization creates no deck-specific provider prose or lifecycle
  evidence

#### Scenario: An existing Bundle without the optional seed remains valid

- **WHEN** current validation examines an otherwise valid older Bundle that
  lacks `page-design-system.md`
- **THEN** validation preserves the Bundle and accepts the optional source as
  runtime-null-compatible
- **AND** it does not write a seed, infer design prose, or begin provider work

#### Scenario: A successor retains source semantics without inheriting evidence

- **WHEN** `new-version` copies a current source version whose deck backbone
  contains a Page Design System and whose version contains a matching override
- **THEN** the successor continues to use the deck-level backbone source and
  receives the override only through the existing overrides copy rules while
  beginning with fresh replacement workflow evidence
- **AND** it does not copy a source binding, raw plan, provider page, review,
  final media, or delivery record
