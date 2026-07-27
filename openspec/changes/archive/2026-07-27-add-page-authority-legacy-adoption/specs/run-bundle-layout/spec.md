## ADDED Requirements

### Requirement: Legacy adoption candidates remain source-local and non-derived
Run-Bundle Layout SHALL reserve `_scratch/production-mode-transition/candidate-run/` as the only candidate root for a legacy adoption. In addition to the existing target selection, intake, source, identity ledger, and target-owned overrides, an adoption candidate SHALL contain one regular `adoption-matrix.json`. The matrix is source control for the transaction only; it is not a generated artifact, a target raw manifest, or a second version ledger. The candidate root SHALL reject symlinks, arbitrary external paths, old migration overlays, and any legacy prompt, image, raw manifest, review, provider authorization, execution record, PPTX/notes receipt, or delivery record.

The visible Page Authority target SHALL contain only canonical target source/control files, normal empty derived owners, and the target-local transition receipt. It SHALL not copy the candidate matrix, source scratch, source generated tree, or any legacy production material. Layout observation SHALL keep the transition scratch readable for exact preview/recovery while never treating a scratch or generated path as Page Authority source authority.

#### Scenario: Adoption candidate has one closed matrix owner
- **WHEN** layout checks a source version with a prepared legacy adoption candidate
- **THEN** it permits the exact matrix file under the existing candidate root
- **AND** it rejects a matrix, prompt, or image placed in an arbitrary scratch or target generated path

#### Scenario: Published target has no legacy artifact owner
- **WHEN** a legacy adoption target becomes visible
- **THEN** layout recognizes only Page Authority source/control and normal rebuildable derived owners
- **AND** it does not classify copied legacy raw/final/review/delivery material as valid target topology
