## MODIFIED Requirements

### Requirement: Framework README displays current version

`ppt_maker_harness/README.md` SHALL declare a `version:` field in frontmatter
and display the current version beside its title. Both values SHALL match the
repository `VERSION` file, and the document SHALL identify the reusable system
as the PPT Maker Harness.

#### Scenario: README frontmatter has version

- **WHEN** an Agent reads the YAML frontmatter of
  `ppt_maker_harness/README.md`
- **THEN** its `version` field matches the `VERSION` file

#### Scenario: README title shows version

- **WHEN** a human opens `ppt_maker_harness/README.md` in the repository
- **THEN** its title displays the current version and PPT Maker Harness name

## ADDED Requirements

### Requirement: Package metadata identifies the Harness

The npm package name SHALL be `pptmaker-harness`. Changing that package identity
SHALL not by itself update the repository version; the existing archive-time
version-bump decision and user confirmation remain authoritative.

#### Scenario: Package metadata is inspected during the rename

- **WHEN** a maintainer reads the root `package.json`
- **THEN** its package name is `pptmaker-harness`
- **AND** the package-name transition has not silently changed `VERSION`
