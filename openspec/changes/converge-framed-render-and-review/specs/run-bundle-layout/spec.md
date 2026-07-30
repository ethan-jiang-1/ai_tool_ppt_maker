## MODIFIED Requirements

### Requirement: Page Authority artifacts have canonical rebuildable owners

Run-Bundle Layout SHALL declare canonical Page Authority ownership for the visual-language/reference
sources, resolved receipt, raw manifest, raw-review projection and coverage, final manifest, and final
projection under the existing deck/version topology. Raw, final, and review outputs SHALL remain
rebuildable derived artifacts under the version leaf; source/state ownership SHALL not be inferred from
their paths, names, or presence.

A raw-review projection SHALL be stored as its actual PNG bytes in that version's derived review
owner. Its coverage record SHALL reference the projection PNG SHA-256, the shared
projection/capture-profile digest, the selected workflow's typed review-contribution digest, and the
exact covered raw byte identities. A Framed contribution SHALL in turn bind its canonical render
profile and generic safe-zone guides. These identities SHALL NOT be collapsed into one ambiguous
renderer-profile field, inferred from a filename, copied into metadata mirrors, or replaced by a final
projection path.

Source state SHALL own only the version-scoped acceptance reference, not a duplicate provider payload,
page layout proof, workflow contribution artifact, or second evidence ledger.

#### Scenario: Derived Page Authority evidence can be rebuilt

- **WHEN** a current Page Authority derived raw, final, or review artifact is deleted
- **THEN** layout validation identifies its canonical rebuild owner
- **AND** no user edits the derived file or treats it as source authority

#### Scenario: Review profile identities remain distinct

- **WHEN** a Framed raw-review projection is materialized
- **THEN** coverage separately binds the shared projection/capture profile and the Framed workflow contribution that includes its render profile
- **AND** neither identity is inferred from the projection path or substituted for the provider generation profile
