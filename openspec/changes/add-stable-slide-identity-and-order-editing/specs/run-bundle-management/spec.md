## ADDED Requirements

### Requirement: Structural versions are prepared invisibly and published atomically

Run-bundle management SHALL expose one structural-version publication interface that owns target-name reservation, clean-version seeding, hidden staging, validation, final publication, and failed-attempt cleanup. Given a valid source version, confirmed visible `vN` target, and transformed canonical slide source, the interface SHALL require that visible target not to exist and SHALL atomically acquire an invocation-owned hidden reservation for that target before staging. It SHALL then construct the complete target source/control tree in a separately unique hidden sibling directory under the same `3_versions/` parent. It SHALL seed the same clean-version roles as the existing version authority, including source, overrides, `_generated/`, `_scratch/`, and canonical README files, without copying prior generated or scratch contents.

Before publication, the interface SHALL run staging-aware run-bundle structure validation and the caller-supplied side-effect-free transformed-source validation against the staging tree. Only the reservation owner MAY publish or clean up that target's reservation/staging. After all writes and validations succeed, and while the reservation is still held, the interface SHALL verify the visible target remains absent and rename the hidden staging sibling to the confirmed visible `vN` path with one same-parent filesystem rename that MUST NOT replace an existing path. It SHALL then release its reservation. The visible target SHALL not exist before that rename. The success result SHALL identify source, target, and publication facts without exposing reservation or staging paths as durable locators.

#### Scenario: Valid structural version appears in one publication step

- **WHEN** a structural transaction prepares valid transformed source from `v2` for target `v3`
- **THEN** the complete target is built and validated under a hidden sibling of `v3`
- **AND** `v3` becomes visible only through the final same-parent rename
- **AND** the returned target passes the canonical run-bundle and source validations

#### Scenario: Clean target does not inherit derived artifacts

- **WHEN** source `v2` contains generated outputs and scratch backups
- **THEN** the prepared target receives canonical empty `_generated/` and `_scratch/` roles
- **AND** does not copy source generated outputs or scratch contents before publication

#### Scenario: Concurrent publication cannot clobber a version

- **WHEN** two structural invocations both attempt to reserve visible target `v3`
- **THEN** at most one invocation acquires the target reservation and may continue toward publication
- **AND** the other fails with a fresh-preview path without deleting the winner's reservation, staging, or visible version

#### Scenario: Target appears before final rename

- **WHEN** a visible target path appears despite an earlier absence check
- **THEN** final publication fails without replacing or merging that path
- **AND** cleanup remains scoped to the failing invocation's reservation and staging

### Requirement: Failed structural publication preserves every visible version

If reservation, staging creation, transformed-source writing, validation, or final publication fails, run-bundle management SHALL leave the source version unchanged and SHALL NOT expose an empty or partially written visible target. Cleanup SHALL be scoped by the invocation ownership token to its hidden staging and reservation paths. It SHALL NOT delete or overwrite a pre-existing visible version, another invocation's reservation/staging, or any source/control file outside its staging root. An unknown or stale-looking reservation owned by another invocation SHALL fail closed with an inspection diagnostic rather than be auto-removed. If cleanup itself fails, the primary operation SHALL still fail and identify its hidden staging/reservation paths for deterministic inspection; those paths SHALL remain non-authoritative and SHALL NOT be reported as a created version.

#### Scenario: Source validation fails in staging

- **WHEN** the transformed source fails canonical slide validation after staging is populated
- **THEN** the operation fails before final rename
- **AND** source `v2` remains byte-identical
- **AND** visible target `v3` does not exist

#### Scenario: Existing target is never adopted or deleted

- **WHEN** the requested visible target name already exists before structural publication
- **THEN** publication fails before creating or mutating that target
- **AND** cleanup does not remove or rewrite the pre-existing version

#### Scenario: Failed cleanup does not masquerade as publication

- **WHEN** the primary preparation fails and its hidden staging cannot be fully removed
- **THEN** the result remains a failed publication with the staging locator available for inspection
- **AND** no success receipt names the staging directory as vNext

### Requirement: Structural version publication is source-only and renderer-free

The structural-version publication interface SHALL operate only on run-bundle source/control scaffolding and deterministic local validation. It SHALL NOT invoke Stage 2, Image2, a future HTML renderer, or any other remote renderer, and SHALL NOT materialize prior `_generated/` bytes. Verified raw-render materialization and all production stages belong to the subsequent orchestration path. The structural caller MAY include a deterministic `needs_render` impact in its own receipt, but that impact SHALL NOT broaden this interface into a refresh executor.

#### Scenario: Inserted page does not spend render quota during publication

- **WHEN** a valid structural target inserts a slide whose raw render does not exist
- **THEN** run-bundle management still publishes the valid source-only target
- **AND** makes zero remote renderer calls
- **AND** leaves render authorization to an explicit subsequent refresh
