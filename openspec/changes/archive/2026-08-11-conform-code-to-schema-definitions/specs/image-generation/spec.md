## MODIFIED Requirements

### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a current schema-declared `page-image-workflow` receipt, the selected
workflow adapter SHALL compile exactly one immutable provider input for each
slide from the canonical source receipt, selected visual language, accepted
Style Master facts, and current adapter policy. The compiled input SHALL carry
the declared `image2-request` schema and role, retain existing digest and
immutability rules, and use no version-suffixed or alternate protocol marker.

#### Scenario: A current provider input is compiled

- **WHEN** a valid current receipt reaches its selected adapter
- **THEN** it emits one immutable declared Image2 request per slide
- **AND** no historical receipt or protocol branch participates

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a current Framed source reaches compilation
- **THEN** its compiled declared request retains the existing non-rendering header context
- **AND** it does not create a second or historical request contract

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** the current transport receives a compiled declared request
- **THEN** it submits the exact adapter-owned input under existing controls
- **AND** it does not rewrite its schema, role, or protocol value

## REMOVED Requirements

### Requirement: v2 bytes cannot become current raw authority
**Reason**: Recognizing and specially scanning a named historical format is a
compatibility behavior outside the one-current-contract model.
**Migration**: Current owners reject every undeclared contract value through
ordinary exact-current validation before raw planning or provider initialization.
