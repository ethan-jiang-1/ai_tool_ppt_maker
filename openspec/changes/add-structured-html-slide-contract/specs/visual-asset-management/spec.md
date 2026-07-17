## ADDED Requirements

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID

The HTML-first asset resolver SHALL read the backbone catalog first and apply version-scoped overrides by stable asset ID. Each effective entry SHALL retain its origin layer, relative path, media metadata, and SHA evidence. Position or array index SHALL never be the asset identity. Legacy path resolution SHALL remain available for legacy pipeline markers.

#### Scenario: Version override replaces one asset ID

- **WHEN** a version override declares the same asset ID as a backbone entry and passes path/metadata/SHA validation
- **THEN** the resolved catalog uses the override and records the version layer as origin
- **AND** unrelated backbone entries remain effective

#### Scenario: Unknown override is rejected

- **WHEN** an override has an invalid path, unsupported media type, missing file, or digest mismatch
- **THEN** catalog resolution fails with the asset ID and integrity reason
- **AND** no generated copy is used to mask the error

### Requirement: Asset selection evidence distinguishes applicability from integrity

The resolver SHALL validate every fallback and selected asset independently. A selected binding MAY be stale or inapplicable without corrupt bytes, but a missing, unregistered, or digest-invalid asset SHALL be `broken` and SHALL block the structured plan.

#### Scenario: Stale selection keeps a valid fallback

- **WHEN** a selected binding is stale but both selected and fallback bytes are valid
- **THEN** resolution reports `stale` with the fallback evidence available
- **AND** it does not invoke Image2 or change source selection automatically
