## ADDED Requirements

### Requirement: Legacy adoption uses an explicit per-slide identity matrix
An adoption candidate SHALL carry one exact `pptmaker-page-authority-legacy-adoption-matrix-v1` matrix. It SHALL account for every legacy stable slide ID exactly once as `retained` or `removed`, and every Page Authority candidate slide exactly once as `retained` or `addition`. A retained row SHALL preserve the same stable ID on both sides; additions and removals SHALL be explicit rather than inferred from position, title, prompt, pixel, or generated file. Each target-bearing row SHALL bind the target slide ID, Page Authority `pure-image2` or `framed-image2` selection, Text Frame disposition, visual-brief/reference disposition, and speaker-note disposition to the authored Page Authority source.

Preview SHALL validate the matrix against the source version's formal identity/order ledger and parsed candidate Page Authority receipt, bind every canonical row into the plan hash, and show the per-slide disposition. Apply SHALL revalidate it before publication. The matrix may preserve identity only; it SHALL not provide a route to copy a legacy prompt, image, raw tuple, review, authorization, final artifact, or delivery decision into the target.

#### Scenario: Retained stable identity is explicit
- **WHEN** an adoption candidate retains a source slide with stable ID `HeroGo`
- **THEN** its matrix contains one `retained` row with source and target ID `HeroGo` and the authored Page Authority authority/dispositions
- **AND** the target source cannot retain it merely because a title or position looks similar

#### Scenario: Addition and removal are not inferred
- **WHEN** a candidate removes one old slide and adds one new Page Authority slide
- **THEN** the matrix has one `removed` row and one `addition` row before preview succeeds
- **AND** no source-generated material is associated with either row
