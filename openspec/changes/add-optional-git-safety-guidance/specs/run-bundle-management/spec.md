## ADDED Requirements

### Requirement: Fresh run bundles seed an optional Git safety boundary

`bundle_layout.mjs#initBundle` SHALL seed `.gitignore` for every fresh run bundle regardless of Git availability or worktree state. The seed SHALL ignore `.env`, `3_versions/*/_generated/`, and `3_versions/*/_scratch/*`, while explicitly re-including `3_versions/*/_scratch/README.md`. It SHALL not broadly ignore source/control Markdown, slide specifications, overrides, metadata, `_state`, `_lessons`, or required control README files.

The init, ordinary new-version, and structural-version publication authorities SHALL not invoke Git, require a worktree, require a clean working tree, initialize a repository, create a commit, or modify a remote. Existing bundles SHALL not have `.gitignore` or Git state rewritten incidentally by pipeline execution, structural publication, or a doctor invocation.

#### Scenario: Fresh bundle has safe ignore rules before Git exists

- **WHEN** `initBundle` creates a new deck outside any Git worktree
- **THEN** its `.gitignore` excludes `.env`, generated output, and scratch contents while retaining the scratch README
- **AND** no `.git` directory, commit, or other Git mutation is created

#### Scenario: Source and control remain eligible for user-owned tracking

- **WHEN** a user later initializes or uses a repository at a confirmed project root containing a fresh run bundle
- **THEN** the seeded ignore rules do not exclude slide specifications, backbone source, overrides, metadata, `_state`, `_lessons`, or required README/control files
- **AND** they do not require force-adding generated output

#### Scenario: Structural publication is independent of Git state

- **WHEN** a structural transaction publishes a valid clean vNext while Git is missing, outside a worktree, or has uncommitted changes
- **THEN** publication follows the existing source-only hidden-staging contract
- **AND** it makes no Git invocation or Git mutation and does not alter its success/failure semantics

