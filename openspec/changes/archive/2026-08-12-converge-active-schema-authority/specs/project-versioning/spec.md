## REMOVED Requirements

### Requirement: VERSION file is the single source of truth for repo version

**Reason**: The Harness is one continuously improved current tool. A visible
repository/Harness release number creates a second generation axis with no
runtime or production meaning; Git commits and OpenSpec archives already retain
maintenance history.

**Migration**: Remove the root `VERSION` file and every active reference to it.
Use the checked-out commit and archived OpenSpec changes to identify maintenance
history. This does not alter Run Bundle Work Versions or external dependency
versions.

### Requirement: VERSION_LOG.md tracks version bump history at repo root

**Reason**: The version log duplicates history already retained by Git and
OpenSpec archives and teaches a Harness release-generation vocabulary.

**Migration**: Remove `VERSION_LOG.md`; find historical maintenance decisions
in the corresponding Git commit and archived change rather than a second
changelog.

### Requirement: Harness README displays current version

**Reason**: README version display turns the current Harness into a visibly
selectable release generation.

**Migration**: Remove the README frontmatter `version` field and versioned
title. Keep the README as an unversioned description of the current Harness.

### Requirement: Package metadata identifies the Harness

**Reason**: This repository is not a published package, so root package-version
metadata must not be used as Harness release identity.

**Migration**: Remove the root package `version` field and its lockfile mirror.
Keep the package name and dependency version constraints. A future actual
package-publication change may introduce distribution metadata without making it
Harness identity or a runtime selector.

### Requirement: Agent judges version bump after archiving a change

**Reason**: Archive-time bump judgment creates a recurring Harness version
workflow without operational value.

**Migration**: Archive changes normally. Do not calculate, request, or write a
Harness/repository version bump; archive evidence and Git commits remain the
maintenance record.

### Requirement: Bump rules are codified in CLAUDE.md and config.yaml with distinct roles

**Reason**: Bump instructions propagate the retired Harness release axis into
every future maintenance workflow.

**Migration**: Remove the archive-bump rule from active agent instructions and
OpenSpec configuration. Retain ordinary archive and commit instructions.
