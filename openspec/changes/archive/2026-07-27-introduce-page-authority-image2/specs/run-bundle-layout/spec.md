## ADDED Requirements

### Requirement: Page Authority artifacts have canonical rebuildable owners
Run-Bundle Layout SHALL declare canonical Page Authority ownership for the visual-language/reference
sources, resolved receipt, raw manifest, raw review projection and coverage, final manifest, and final
projection under the existing deck/version topology. Raw/final/review outputs SHALL be rebuildable
derived artifacts under the version leaf; source/state ownership SHALL not be inferred from their paths,
names, or presence.

A raw-review projection SHALL be stored as its actual PNG bytes in that version's derived review owner;
its coverage record references the PNG SHA-256 and canonical renderer profile digest, not a filename,
metadata mirror, or final-projection path. Source state owns only the version-scoped acceptance reference,
not a duplicate provider payload or a second evidence ledger.

#### Scenario: Derived Page Authority evidence can be rebuilt
- **WHEN** a current Page Authority derived raw/final/review artifact is deleted
- **THEN** layout validation identifies its canonical rebuild owner
- **AND** no user edits the derived file or treats it as source authority
