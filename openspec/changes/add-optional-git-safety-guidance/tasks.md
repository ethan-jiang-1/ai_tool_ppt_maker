## 1. Advisory Git Observation

- [ ] 1.1 Extend `PPTMAKER_FRAMEWORK/scripts/env-check.mjs` with one zero-dependency, base `git` check that uses only bounded argument-safe `git --version` and conditional `git rev-parse --is-inside-work-tree` probes; normalize all outcomes to safe facts and never expose raw process output or repository-sensitive data.
- [ ] 1.2 Keep the existing hard-failure authority unchanged: Git missing, non-worktree, timeout, permission, malformed output, and unexpected exit must be `warn`, while only established hard checks can make `allPass` false, emit a blocking envelope, or produce a non-zero exit.
- [ ] 1.3 Update text and JSON doctor reporting/help as necessary so `git` appears once as a stable base check, Git-only warnings retain READY/exit 0, and no new CLI command, failure-envelope schema, npm dependency, or live network work is introduced.

## 2. Guidance And Version Boundaries

- [ ] 2.1 Add BOOTSTRAP Step 1 `### git` guidance synchronized with the new base check name: optional-but-recommended explanation, macOS/Linux/Windows install commands, `git --version` verification, confirmed project-root guidance, no initialization in `_generated/` or a `3_versions/vN/` leaf, and no nested init under an existing worktree.
- [ ] 2.2 Add Agent-facing checkpoint guidance at the defined source milestones while explicitly preserving user ownership of all Git writes: no automatic init, stage, commit, push, pull, remote edit, restore, reset, discard, or clean-worktree prerequisite; declining Git must not block a deck workflow that otherwise passes hard gates.
- [ ] 2.3 Update active charter/startup guidance so run-bundle `vN` and Structural Versioning Path remain the deck work-version authority, Git remains optional audit/recovery only, and `_generated/` stays reproducible derived output rather than force-tracked history.

## 3. Fresh-Bundle Safety Boundary

- [ ] 3.1 Verify and, only if required, adjust `bundle_layout.mjs#initBundle`'s `.gitignore` seed to ignore `.env`, `3_versions/*/_generated/`, and scratch contents while re-including `_scratch/README.md` and leaving source/control files eligible for user-owned tracking.
- [ ] 3.2 Ensure init, ordinary new-version, and structural hidden-staging publication remain Git-independent: they must not invoke Git, require a worktree or clean working tree, create a repository/commit, or incidentally rewrite existing bundle Git state or ignore files.

## 4. Tests And Validation

- [ ] 4.1 Add focused `tests/test_env_check.mjs` coverage using an injected fake command runner and/or temporary fake `git` on PATH for missing Git, worktree, non-worktree, timeout/error, malformed output, normalized secret-safe reporting, Git-only READY/exit 0, and coexistence with real hard failures.
- [ ] 4.2 Extend `tests/test_bundle_layout.mjs` with fresh temporary-bundle assertions for the exact `.gitignore` exclusions/re-inclusion, source/control eligibility, no auto-created `.git`, and Git-independent structural publication; do not use a production `deck_*` fixture.
- [ ] 4.3 Extend documentation/charter consistency tests to require the `### git` BOOTSTRAP section, optional/non-blocking wording, safe confirmed-root and no-nested-init guidance, user-owned checkpoint wording, and the absence of guidance that makes Git a second deck-version/order source or recommends force-tracking `_generated/`.
- [ ] 4.4 Run targeted environment, bundle-layout, documentation/charter, and CLI tests; run `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` in text and JSON modes; run `npm test`, `openspec validate add-optional-git-safety-guidance --strict`, and `git diff --check`; confirm no production `deck_*`, `dpt_*`, generated artifact, Git repository, commit, remote, or credential was created by the change.
