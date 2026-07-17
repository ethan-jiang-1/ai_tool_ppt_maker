## Why

Structural Versioning Path already gives a deck its user-visible work versions (`v1`, `v2`, and so on). Git can complement that boundary with user-owned source audit and history, yet a new user may have no Git, may work outside a worktree, or may have initialized a worktree that still has no first commit. None of those states may become a prerequisite for creating or producing a deck.

The current startup check runs before a target deck may exist and observes only its invocation working directory. It must therefore report that scope honestly, rather than implying that a future or separately located deck is protected. Some active guidance also treats Git tracking or `commit + push` as inevitable, and one setup document still presents destructive visible-version replacement as rollback. This change makes the optional safety model explicit and consistent: run-bundle versions remain the deck work-version authority; Git is a user-authorized source/control audit layer; `_generated/` remains reproducible derived output.

## What Changes

- Add one non-blocking `git` base check to the environment report. It observes only the current invocation directory and uses positive-only worktree confirmation: a verifiable current-directory HEAD is `ok`; missing Git, an unconfirmed worktree, no verifiable HEAD, and bounded probe anomalies are all warnings. Existing hard requirements alone determine READY and exit status.
- Use only a small fixed set of read-only Git probes with argument-safe invocation, a short timeout, a restricted child environment, and normalized public facts. The check never reports raw command output or repository-sensitive data, never checks cleanliness, and never runs status, log, diff, remote, config, or mutation commands.
- Extend BOOTSTRAP Step 1 with a `git` section that gives copy-pasteable platform installation/verification guidance, explains the current-working-directory scope of doctor, and requires a user-confirmed project root before any user-chosen `git init`. It explicitly prevents nested repositories and initialization inside `_generated/` or one `3_versions/vN/` leaf.
- Let Agents make one concise, non-blocking checkpoint recommendation per continuous known-source-work episode. Git actions remain user-owned: absent separate explicit authorization for a named operation and scope, the framework and default Agent behavior never initialize, stage, commit, push, pull, change remotes, restore, reset, discard changes, or require a clean worktree.
- Reconcile active Git guidance across entry, charter, startup, runtime deck-guide, setup, iteration, and glossary material so it no longer presents Git as mandatory, a replacement for Structural Versioning Path, a framework-provided source-replacement mechanism, or a required final `commit + push` step. A request to revisit deck `vN` preserves visible versions and remains on the established repair/vNext/new-deck escape ladder.
- Preserve and test the fresh-run-bundle `.gitignore` boundary: secrets, generated output, and scratch contents stay untracked while source/control files and required README sentinels remain eligible for user-owned tracking. Init and version publication remain Git-independent.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `environment-check`: Report optional Git executable/worktree/first-commit facts without changing hard-gate READY semantics or the existing generic `env-check-v1` JSON report shape.
- `bootstrap-env-guidance`: Add self-contained, check-name-synchronized Git installation, scope, and safe startup guidance.
- `framework-charter`: Keep active framework guidance consistent that Git is optional source audit, distinct from run-bundle work versions and generated artifacts.
- `run-bundle-management`: Preserve the init-seeded Git ignore boundary and prevent Git guidance from replacing clean vNext publication.
- `commands-reference`: Keep Git history distinct from visible `vN` work versions and route version revisits through the established escape ladder.
- `cli-surface`: Ratify the direct `env-check` check-array addition without changing the `env-check-v1` top-level schema, failure envelope, exit semantics, or `ppt_flow doctor` flags.

## Impact

This is framework repository maintenance. Expected implementation surfaces are `PPTMAKER_FRAMEWORK/scripts/env-check.mjs`, `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`, `charter/AGENT_CONTRACT.md`, `COMMANDS.md` / `scripts/change-classifier.md`, active charter/entry/setup/iteration/glossary guidance that currently describes Git or rollback, `bundle_layout.mjs` plus the generated deck-guide/reference-template text where needed, and focused unit/integration/documentation tests. The direct `env-check --json` report already has an open generic check-array schema; this change does not add a `ppt_flow doctor --json` flag, a new framework Git CLI command, a Git-history reader, source-recovery mutation, or a failure-envelope schema.

Implementation uses Node.js built-ins only and injected semantic probe runners or temporary test directories. POSIX-only fake-Git subprocess coverage is supplementary; cross-platform correctness must not depend on a developer machine's real Git state. It adds no npm dependency, no production deck fixture, no remote Git operation, no repository initialization, no commit, and no dependency on a developer machine's real Git state. The authoritative work-version source remains the run bundle and Structural Versioning Path; Git data must not become a second ordering source, a render prerequisite, a framework-provided source-replacement mechanism, or a condition for correct pipeline execution.
