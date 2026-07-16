## ADDED Requirements

### Requirement: Raw image artifacts are addressed by stable slide ID

New Stage 2 writes SHALL use `<slide_id>.png` for raw image output and SHALL associate manifest entries with the formal stable slide ID. The generation fingerprint SHALL continue to cover every semantic generation input, but SHALL exclude current position, heading number, slide order, and position-bearing human-view filenames. The logical Image2 artifact key SHALL be `(slide_id, "image2", generation_fingerprint)`.

The read path SHALL accept current stable-ID outputs and legacy manifest outputs such as `NN_<legacy-id>.png`. A legacy output SHALL be reused only when its manifest fingerprint and image-byte SHA satisfy the current request; it MAY be atomically materialized under an ID-stable target name without a remote generation call. Filename guessing without matching provenance SHALL NOT establish reuse.

#### Scenario: Reorder keeps cache current

- **WHEN** a slide moves to another position while its prompt, style reference, assets, model, resolution, and generator options remain unchanged
- **THEN** its generation fingerprint is unchanged
- **AND** Stage 2 reuses the manifest-proven raw image without calling the remote renderer

#### Scenario: Legacy output is read through provenance

- **WHEN** a legacy manifest maps stable current ID `s07_problem` to `07_s07_problem.png` and both its fingerprint and byte SHA are current
- **THEN** Stage 2 can resolve or materialize that image for the ID without regeneration
- **AND** does not infer identity from the numeric filename prefix

#### Scenario: Position-prefixed file without proof is stale

- **WHEN** a matching-looking legacy PNG exists but no valid manifest entry proves its fingerprint and bytes
- **THEN** Stage 2 treats it as stale under the existing fail-loud cache contract

### Requirement: Cross-version raw image reuse is verified materialization

When orchestration requests reuse from a source version, Stage 2 SHALL expose enough manifest evidence to verify the same formal ID, generation fingerprint/profile, and source image SHA-256. Only a byte-verified match SHALL be copied into the target version and recorded atomically in the target manifest with source-version lineage. The target SHALL own its materialized artifact; normal target processing SHALL NOT read an earlier version as an implicit fallback.

#### Scenario: Matching retained slide is materialized

- **WHEN** a retained ID has the same generation fingerprint/profile and its source PNG bytes match the source manifest
- **THEN** the target receives an ID-addressed copy and a current target manifest entry
- **AND** no remote generation is invoked

#### Scenario: Source bytes no longer match manifest

- **WHEN** the source PNG bytes differ from the recorded image SHA
- **THEN** cross-version materialization refuses that entry
- **AND** the target follows the normal missing/stale refresh path
