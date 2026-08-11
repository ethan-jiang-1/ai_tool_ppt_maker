## MODIFIED Requirements

### Requirement: Run Bundle locator binds one exact local Harness

A current Run Bundle locator SHALL use the unversioned shared contract declared
as `run-bundle-locator` in the serialization inventory and retain exactly the
fields `schema`, `deck_root`, `harness_root`, and `harness_relation`. The
locator continues to bind one local Harness root without becoming a Page Image
production protocol, portability layer, or historical-format resolver.

#### Scenario: A current locator is inspected

- **WHEN** a locator is read for an active local Harness binding
- **THEN** its contract marker resolves as `run-bundle-locator` in the schema
  inventory and its exact required fields validate
- **AND** an undeclared locator is not converted or adopted

#### Scenario: A new locator describes a local Harness binding

- **WHEN** initialization writes a current bundle locator
- **THEN** it describes one exact local Harness relation under the declared contract
- **AND** it does not encode production workflow authority

### Requirement: Page Image Workflow artifacts have canonical rebuildable owners

The current artifact-owner map SHALL identify normalized source, matching state,
source receipt, Style Master lifecycle, compiled provider input, raw provider
page/provenance, review contributions, the declared final-page-list,
delivery-package media, assembly, and notes under one current schema contract.
Selected adapters retain policy-specific raw/review contributions and shared
delivery retains the common final-page/delivery projection. No owner map may
name a version-suffixed artifact schema or an alternate historical publisher.

#### Scenario: A maintainer traces a current artifact owner

- **WHEN** a current Page Image artifact is located in the layout
- **THEN** its declared stage/role resolves to one current owner
- **AND** no historical artifact name creates a second owner path

#### Scenario: A Framed review has two bound views but one owner

- **WHEN** current Framed review produces its provider and composited views
- **THEN** both remain bound to one declared review owner
- **AND** no alternate schema creates another review authority

#### Scenario: Deleting a current derived artifact does not make it source

- **WHEN** a rebuildable declared artifact is absent
- **THEN** the owner retains the existing source/derived distinction and rebuild path
- **AND** it does not use a historical artifact as replacement source

### Requirement: Content-addressed physical paths use short on-disk names

For a supported current `page-image-workflow` Pure or Framed run,
content-addressed immutable owner storage SHALL retain the existing deterministic
short physical naming and full internal SHA-256 identity rules. The current
workflow marker and all serialized artifacts SHALL use only schema-declared
unversioned values. An undeclared marker fails before content-addressed owner
work; the layout SHALL not scan or migrate a historical format.

#### Scenario: A current run resolves a content-addressed path

- **WHEN** an exact current run addresses an immutable owner artifact
- **THEN** it applies the established short-name/full-hash validation under the
  declared current workflow
- **AND** it does not fall back to a historical contract reader

#### Scenario: Lookup resolves a short on-disk name from a full SHA-256

- **WHEN** a current owner looks up a full content hash
- **THEN** it retains the established short-name then verified-full-name resolution
- **AND** it validates only current declared artifact contracts

#### Scenario: An 8-character prefix collision fails loudly

- **WHEN** two current full hashes share a short prefix in one owner directory
- **THEN** the owner retains the existing conflict failure before overwrite
- **AND** it does not select an alternate contract

#### Scenario: A full-64-hex legacy directory is migrated

- **WHEN** a current owner encounters an obsolete physical-path form
- **THEN** it rejects it as outside the current contract before mutable owner work
- **AND** it does not migrate or adopt the directory

#### Scenario: Migration finds an owner lock

- **WHEN** an obsolete path condition includes an owner lock
- **THEN** current layout validation remains non-mutating and rejects the condition
- **AND** it does not acquire a migration lock or rename bytes

#### Scenario: Migration receives a sibling or historical version by implication

- **WHEN** a caller supplies a path outside the exact current run binding
- **THEN** layout rejects it before sibling selection or artifact reads
- **AND** it does not infer a migration target

#### Scenario: A writer begins while migration is pending

- **WHEN** a current writer detects an obsolete migration-only condition
- **THEN** it retains current owner integrity checks before writes
- **AND** it does not coordinate or resume a migration

#### Scenario: A validated migration cannot complete a rename

- **WHEN** an obsolete path would require a rename to continue
- **THEN** current layout stops before rename planning
- **AND** it preserves no compatibility or rollback protocol

#### Scenario: A v2 run requests short-path migration

- **WHEN** an undeclared run contract requests a path operation
- **THEN** the owner rejects it before artifact inspection or mutation
- **AND** it does not create a short-path migration route

## REMOVED Requirements

### Requirement: Current layout records do not adopt v2 Page Authority artifacts
**Reason**: A named historical-artifact scanner is incompatible with the
clean-cutover rule that active owners recognize only current declarations.
**Migration**: Layout owners reject every undeclared contract through ordinary
current validation before artifact reads or mutation.
