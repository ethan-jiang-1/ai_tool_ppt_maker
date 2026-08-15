## ADDED Requirements

### Requirement: Run Bundle Layout owns the optional Page Design System source locations

Run-Bundle Layout SHALL reserve
`2_backbone/visual-style/page-design-system.md` as the optional shared Page
Design System source and
`3_versions/vN/overrides/visual-style/page-design-system.md` as its matching
version override. These paths are editable deck source with override-first,
backbone-default precedence, but Visual Config owns the fail-closed absence and
invalid-branch semantics; layout recognition SHALL not imply generic
existence-only fallback. They SHALL not be placed in
`page-image-presentation/`, `_generated/`, Style Master history, source
receipts, plans, grants, attempts, review evidence, final media, delivery, or
State.

The layout whitelist and structure check SHALL recognize only these canonical
locations for this source and preserve the existing strict-root/loose-leaf
gradient. The layout contract SHALL distinguish it from the Pure-only
`pure-deck-visual-system.yaml`, the closed visual-language registry, and
Framed header profiles. Absence or blank source content is an optional source
semantic owned by Visual Config; it does not make the source a derived file or
authorize a layout check to infer a provider input.

Active run-bundle tree guidance SHALL identify this source as the shared Page
Image provider-design guidance and SHALL describe its separate role from Style
Master intent, visual-language selection, the Pure visual system, and Framed
local-header policy. The layout text remains a human-readable projection;
`bundle_layout.mjs` and this capability remain the path authority.

#### Scenario: The shared source has only its canonical locations

- **WHEN** a current Bundle contains a Page Design System source or version
  override
- **THEN** layout validation recognizes it only at the declared backbone or
  matching override visual-style path
- **AND** it does not treat a file in a generated, presentation-package,
  lifecycle, or invented source location as that source

#### Scenario: Shared guidance remains distinct from workflow-specific inputs

- **WHEN** an Agent reads the current run-bundle tree guidance
- **THEN** it can locate the shared Page Design System separately from the
  Pure-only visual system and Framed header profile sources
- **AND** it does not infer that either workflow-specific source supplies the
  shared provider-design text

#### Scenario: Optional source absence does not establish execution authority

- **WHEN** a layout-only check observes an otherwise valid Bundle without
  either Page Design System source leaf
- **THEN** it reports the filesystem layout fact without mutation
- **AND** it does not select a version, create a source binding, authorize
  provider work, or infer a default design system
