## MODIFIED Requirements

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID

The v2 catalog SHALL remain the sole parser/validator/serializer authority for version asset entries. In addition to existing `svg/`, `reference/`, and `icons/` roots, a v2 entry MAY use only the Phase-4-owned `refined/image2/style-reference/` or `refined/image2/visual-slots/` root; no other new asset subdirectory is valid. It SHALL additionally expose a bounded Phase-2 public registration transaction that accepts a validated target run, a caller-supplied stable asset ID and approved raster bytes plus bounded descriptive metadata, writes the asset beneath one of those exact version override refined roots, and atomically adds or replaces exactly that v2 manifest entry with its measured SHA. It SHALL reject caller-supplied paths, manifest documents, origin, SHA, unsupported media, or arbitrary override writes. Phase 4 may call this public operation only within its bound promotion journal and SHALL not parse or edit the manifest itself.

#### Scenario: Refinement registers an accepted candidate
- **WHEN** Phase 4 passes a validated candidate value and target asset ID to Phase 2
- **THEN** the canonical version asset and exact manifest entry are committed with measured SHA
- **AND** no candidate-derived path or provider metadata enters the manifest

#### Scenario: Registration requests an arbitrary asset root
- **WHEN** a caller requests a refined asset path outside the two canonical Phase-4 roots
- **THEN** the transaction rejects it before writing bytes or a manifest
