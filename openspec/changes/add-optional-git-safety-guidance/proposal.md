## Why

Structural Versioning Path already gives a deck its user-visible work versions (`v1`, `v2`, and so on), but it deliberately does not provide source-history comparison, recovery from an accidental source edit, or long-term audit. Git complements that safety boundary, yet new users may not have Git installed or may be working outside a worktree. The framework should make the safety net visible at startup without turning it into a prerequisite for creating or producing a deck.

This change formalizes one consistent model: run-bundle versions remain the deck's work-version authority; Git is an optional source/control audit and recovery layer; `_generated/` remains reproducible derived output rather than tracked source. It also gives Agents safe, beginner-facing guidance instead of silently creating repositories or treating a clean worktree as a pipeline condition.

## What Changes

- Add a non-blocking Git availability/worktree check to the environment report. Missing Git, a directory outside a worktree, and Git-check execution errors produce concise warnings while preserving `READY` and exit zero whenever the existing hard requirements pass.
- Extend BOOTSTRAP Step 1 with a `git` section that maps the doctor check name to copy-pasteable installation, verification, and safe repository-initialization guidance for macOS, Linux, and Windows.
- Establish the startup and charter distinction between user-visible run-bundle versions and optional Git source audit/recovery. Agents may recommend a source checkpoint at meaningful milestones but must not automatically initialize, commit, push, change remotes, discard changes, or use Git as an order/version source of truth.
- Preserve and test the init-seeded `.gitignore` contract: secrets, generated output, and scratch contents stay untracked while source/control files and required README sentinels remain trackable.
- Keep all existing Stage, gate, Structural Versioning Path, rendering, and CLI failure-envelope behavior independent of Git availability or worktree cleanliness.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `environment-check`: Report optional Git executable/worktree safety status without changing hard-gate READY semantics.
- `bootstrap-env-guidance`: Add self-contained, check-name-synchronized Git installation and safe startup guidance.
- `framework-charter`: Define Git as optional source audit/recovery, distinct from run-bundle work versions and generated artifacts.
- `run-bundle-management`: Preserve the init-seeded Git ignore boundary and prevent Git guidance from replacing clean vNext publication.

## Impact

This is framework repository maintenance. Expected implementation surfaces are `PPTMAKER_FRAMEWORK/scripts/env-check.mjs`, `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`, the relevant charter documents, `bundle_layout.mjs` seed text where needed, and focused unit/integration tests using fake Git executables and temporary worktrees. It adds no npm dependency, no production deck fixture, no remote Git operation, and no dependency on a developer machine's actual Git state.

The authoritative work-version source remains the run bundle and Structural Versioning Path. Git data must not become a second ordering source, a render prerequisite, or a condition for correct pipeline execution.
