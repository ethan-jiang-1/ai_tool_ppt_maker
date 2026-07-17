## ADDED Requirements

### Requirement: Fresh run bundles seed an optional Git safety boundary

`bundle_layout.mjs#initBundle` SHALL seed `.gitignore` for every fresh run bundle regardless of Git availability or worktree state. The seed SHALL ignore `.env`, `3_versions/*/_generated/`, and `3_versions/*/_scratch/*`, while explicitly re-including `3_versions/*/_scratch/README.md`. It SHALL not broadly ignore source/control Markdown, slide specifications, overrides, metadata, `_state`, `_lessons`, or required control README files.

The init, ordinary new-version, and structural-version publication authorities SHALL not invoke Git, require a worktree, require a verifiable history or clean working tree, initialize a repository, create a commit, or modify a remote. Existing bundles SHALL not have `.gitignore` or Git state rewritten incidentally by pipeline execution, structural publication, a doctor invocation, or an unrelated fresh-bundle initialization elsewhere.

`initBundle`'s generated `deck-guide.md` seed and the reference `workflow/00-setup/template-deck-guide.md` SHALL remain aligned on the fresh-bundle Git boundary: Git is optional; visible `vN` remains the deck work-version authority; `_generated/` is never a recovery target; this change adds no automated Git source recovery or default recovery protocol; and no Git mutation occurs without explicit user authorization for the named operation and exact scope. The generated guide is create-if-absent; the reference template does not authorize incidental rewriting of an existing guide.

#### Scenario: Fresh bundle has safe ignore rules before Git exists

- **WHEN** `initBundle` creates a new deck outside any Git worktree
- **THEN** its `.gitignore` excludes `.env`, generated output, and scratch contents while retaining the scratch README
- **AND** no `.git` directory, commit, or other Git mutation is created

#### Scenario: Source and control remain eligible for user-owned tracking

- **WHEN** a user later initializes or uses a repository at a confirmed project root containing a fresh run bundle
- **THEN** the seeded ignore rules do not exclude slide specifications, backbone source, overrides, metadata, `_state`, `_lessons`, or required README/control files
- **AND** they do not require force-adding generated output

#### Scenario: Structural publication is independent of Git state

- **WHEN** a structural transaction publishes a valid clean vNext while Git is missing, the current directory has no confirmed worktree, has no verifiable HEAD, or has uncommitted changes
- **THEN** publication follows the existing source-only hidden-staging contract
- **AND** it makes no Git invocation or Git mutation and does not alter its success/failure semantics

#### Scenario: Fresh guide does not overclaim Git protection

- **WHEN** `initBundle` creates a fresh deck
- **THEN** the generated `deck-guide.md` contains the aligned optional-Git/version/derived-output/authorization rule from the template
- **AND** it does not claim that deck initialization initialized, verified, or otherwise created Git protection

#### Scenario: Existing guide is not silently rewritten

- **WHEN** an existing bundle has a `deck-guide.md` from an earlier seed
- **AND** init, doctor, pipeline, or structural publication runs
- **THEN** that guide is not overwritten as an incidental Git-safety update
