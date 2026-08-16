# Content Parsing Specification (delta)

## ADDED Requirements

### Requirement: Page Source aggregation preserves the resolver origin and field ownership

`resolveVisualBrief()` (or its successor in the Page Source aggregation
layer) SHALL preserve each underlying producer failure's owner, reason,
physical source, logical path, subject, and bounded `actual`/`expected`
facts through the problem-fact contract owned by `diagnostic-facts`. It SHALL
NOT rewrite identity-reference, visual-language, or per-slide presentation
resolution failures into a slide-local `VISUAL BRIEF` defect, SHALL NOT copy
only `code`/`message` while dropping `path`/`actual`/`expected`, and SHALL
NOT infer a source owner or field from `Error.message` prose.

A Page Source-owned selection failure SHALL locate the actual source field:
an unregistered identity role SHALL name `VISUAL IDENTITY`, an incompatible
identity subject count SHALL name `IDENTITY SUBJECT COUNT`, an incompatible
subject restriction SHALL name `SUBJECT RESTRICTIONS`, a Framed header
conflict SHALL name the offending header/class field (for example `SUBTITLE`
with `PAGE CLASS`), and a genuine visual-brief ingress failure SHALL name
`VISUAL BRIEF`. A failure owned by another producer family (Reference
Material, Visual Language, Presentation) SHALL retain that owner and SHALL
NOT be re-homed to Page Source.

A shared source that fails once SHALL produce one stable root cause whose
public projection carries the root owner/reason/locator at the envelope root
and the affected slides/selections as bounded subject attachments, rather
than a copy per slide.

#### Scenario: Unregistered identity role keeps its field

- **WHEN** a Page Source slide selects `test-agent/absent-role`
- **THEN** the aggregated failure names the `VISUAL IDENTITY` field and the
  Page Source owner
- **AND** it does not rewrite the subject field to `VISUAL BRIEF`

#### Scenario: A Framed header conflict keeps its header field

- **WHEN** a Framed `opening` slide carries a forbidden `SUBTITLE`
- **THEN** the aggregated failure names the `SUBTITLE` field and its `PAGE
  CLASS` constraint
- **AND** it does not locate the defect at `VISUAL BRIEF`

#### Scenario: A reference registry defect keeps its owner

- **WHEN** a selected identity profile's role clause is invalid
- **THEN** the aggregated failure retains the Reference Material owner, its
  registry locator, and the bounded actual fact
- **AND** it does not become a slide-local Page Source `VISUAL BRIEF` issue
