## ADDED Requirements

### Requirement: Page Authority identity references are registered clean derivatives
Visual Asset Management SHALL resolve Page Authority identity references only through
`2_backbone/visual-style/assets/reference/<profile>/image2-reference-material.yaml`, never through the
HTML `asset-manifest.yaml`, a version override, or an arbitrary source path. The registry has exactly
`schema: pptmaker-image2-reference-registry-v1` and `profiles`; every profile has exactly
`subject_class`, `maximum_identity_subjects`, `compatible_restrictions`, `incompatible_restrictions`,
and `roles`; every role has exactly `reference_path`, `reference_sha256`, and `role_clause`. It SHALL
reject duplicate keys, aliases, anchors, tags, unknown fields, unregistered profile/role IDs, absolute or
escaping paths, and a role path outside its profile directory.

Every selected reference SHALL be a registered, single-pose, label-free derivative whose bytes match the
registered SHA-256. Its `role_clause` SHALL pass `page-authority-text-guard-v1`; subject cardinality and
the normalized slide restriction SHALL be compatible with the registered profile. The normalized
profile/role/reference-SHA/role-clause-SHA/subject-class/count/restriction projection SHALL enter the
raw image contract without physical paths or source spans. The Amber model sheet SHALL be promoted as
doctrine from the verified v1 source SHA-256
`f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756` to
`assets/reference/amber-agent/model-sheet.png`. The multi-pose sheet SHALL never be accepted as a
provider reference or asset-manifest substitute.

#### Scenario: Model sheet and checksum drift are rejected
- **WHEN** a source selects the model sheet directly or a selected role derivative differs from its SHA-256
- **THEN** raw-contract compilation hard-stops before authorization
- **AND** no provider payload or cached reuse is accepted

#### Scenario: Identity can only resolve through the Image2 registry
- **WHEN** a slide selects an unregistered `<profile>/<role>`, an incompatible restriction, or a role
  registry record with an unknown field or escaped reference path
- **THEN** resolution returns the registry/source repair diagnostic before raw-contract compilation
- **AND** it does not fall back to the HTML asset catalog, a model sheet, or a filesystem path

#### Scenario: Doctrine promotion preserves verified bytes
- **WHEN** the v1 model sheet is promoted into the deck backbone doctrine location
- **THEN** its SHA-256 equals `f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756`
- **AND** it is not registered as a selectable provider reference
