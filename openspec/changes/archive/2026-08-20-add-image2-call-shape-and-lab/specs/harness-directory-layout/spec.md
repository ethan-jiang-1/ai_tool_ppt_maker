## ADDED Requirements

### Requirement: Shared Image2 modules are not a twentieth method stage

The Harness directory map SHALL place Call Shape validation, the shared
provider executor, and the Lab CLI under `ppt_maker_harness/scripts/shared/image2/`
as shared Image2 ownership. It SHALL NOT add a conceptual production stage, a
top-level `scripts/image2-lab/` method module, or a twentieth entry in the
nineteen-stage schema home. Run-bundle `_lab/` SHALL appear in directory
guidance as user-owned Run Bundle data, not as Harness source.

#### Scenario: Shared image2 ownership is auditable

- **WHEN** a maintainer inspects the Harness source map after this change
- **THEN** validator, executor, and Lab CLI are listed under `scripts/shared/image2/`
- **AND** `schema/stages/` still contains exactly the nineteen conceptual stages

#### Scenario: Lab workspace is run-bundle data

- **WHEN** a maintainer reads the source-versus-production-data boundary
- **THEN** `_lab/` is described as deck-root Run Bundle data
- **AND** it is not described as a Harness implementation root
