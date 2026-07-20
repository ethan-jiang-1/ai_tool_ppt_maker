## MODIFIED Requirements

### Requirement: Structured source round-trip preserves non-owned Markdown

The parser/serializer SHALL retain its existing bounded source write set and additionally expose a public Phase-3 selection-binding transaction. Given a validated run, stable slide ID, registered asset ID, exact current visual-contract fingerprint, and measured output SHA, it SHALL update only that slide's owned `primary_visual.selection` to the existing closed binding shape and serialize through the canonical source path. It SHALL reject missing primary visual, arbitrary YAML/path input, caller-supplied geometry, or an asset not currently registered by the effective catalog. Phase 4 may invoke it only as a bound promotion step and SHALL not parse or edit `slide-specifications.md` directly.

#### Scenario: Refinement binds an accepted asset
- **WHEN** the Phase-3 transaction receives a registered candidate asset and current visual contract
- **THEN** only the target slide's owned selection binding changes
- **AND** all non-owned Markdown, other slide blocks, and geometry remain unchanged
