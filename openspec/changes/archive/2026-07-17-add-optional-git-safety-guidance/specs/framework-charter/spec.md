## ADDED Requirements

### Requirement: Active guidance separates deck work versions from optional Git audit

Active framework entry, charter, setup, iteration, command-reference, and glossary guidance SHALL define `deck_*/3_versions/vN/` and Structural Versioning Path as the user-visible deck work-version authority. Git SHALL be described only as an optional, user-owned source/control audit and comparison aid. It SHALL not be described as a second slide-order source, a replacement for clean vNext publication, a render/cache identity source, a framework-provided source-replacement mechanism, a required project capability, or a condition for pipeline correctness.

When active guidance describes history, source/control Markdown and required state/control files SHALL be described as eligible for tracking in a user-owned repository, rather than inherently Git-tracked. It SHALL not make Git installation, a clean worktree, a first commit, or `commit + push` an automatic setup, phase, archive, or delivery prerequisite. It SHALL not direct an Agent to inspect Git state or mutate Git without explicit user direction and scope.

The guidance SHALL preserve the source/derived boundary: `_generated/` remains reproducible derived output and SHALL not be proposed for forced tracking. The framework SHALL not tell users to use `git add -f _generated/` or a Git commit in place of Structural Versioning Path. This change supplies no Git-history reader, automated source replacement, or default recovery protocol; independently authorized named Git operations remain governed by the authorization rule in `bootstrap-env-guidance`, not by a framework recovery path.

`charter/AGENT_CONTRACT.md` SHALL carry a concise operational rule: Git is optional; visible `vN` remains the deck work-version authority; `_generated/` is never a recovery target; and an Agent may not perform a Git mutation without explicit user authorization for its named operation and exact scope. `run-bundle-management` owns the corresponding generated `deck-guide.md` seed, its create-if-absent behavior, and alignment with the reference template; neither guide SHALL claim that a newly initialized deck is already Git-protected.

#### Scenario: Reader distinguishes version and audit responsibilities

- **WHEN** an Agent or human reads active framework guidance about versions and safety
- **THEN** it can distinguish deck `vN` as the work-version path from optional Git as source audit/comparison
- **AND** it sees that structural publication and later refresh authorization remain independent of commits

#### Scenario: User works without Git

- **WHEN** a user does not install Git, the current directory has no confirmed worktree, or the user declines a checkpoint
- **THEN** active guidance still permits setup, authoring, structural vNext publication, production, and delivery through their existing rules
- **AND** it does not characterize that user as failing a framework gate or imply that the framework has an automated Git source-replacement route

#### Scenario: Generated outputs stay derived under optional Git guidance

- **WHEN** active guidance discusses using Git with a run bundle
- **THEN** it retains the rule that `_generated/` is rebuilt from source and not hand-edited or force-tracked
- **AND** it keeps version-local scratch files separate from tracked source/control policy

#### Scenario: Fresh runtime guide preserves optional Git boundaries

- **WHEN** `initBundle` creates a fresh run bundle
- **THEN** its generated `deck-guide.md` seed and the reference template both state the aligned optional-Git/version/derived-output/authorization rule
- **AND** their wording does not authorize an Agent to initialize, commit, or replace source/generated output by default
