## ADDED Requirements

### Requirement: Run Bundle backbone has one current narrative-source pair
Run-Bundle Layout SHALL reserve `2_backbone/story-outline.md` as the canonical
editable Story Outline and `2_backbone/design-constraints.md` as the canonical
editable Design Constraints source. Both are deck-level shared Source Data,
outside `_generated/`, state, lifecycle evidence, provider records, and
version-specific overrides. New Run Bundles SHALL receive editable current
seeds for both sources.

`2_backbone/outline.md` is not a current layout entry, source alias, fallback,
or validation target. The layout SHALL not read, rename, convert, migrate, or
copy a historical outline to establish current narrative authority.

#### Scenario: A new bundle has current upstream narrative sources
- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone contains `story-outline.md` and `design-constraints.md`
  as editable shared sources
- **AND** it does not create `outline.md` or a second narrative location

#### Scenario: A historical outline is present in a production bundle
- **WHEN** a current-layout operation encounters `2_backbone/outline.md`
- **THEN** it does not use that file to establish Story Outline authority or
  convert it to a new source
- **AND** it leaves the production data untouched

