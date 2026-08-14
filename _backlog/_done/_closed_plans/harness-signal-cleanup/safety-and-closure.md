# Safety and Closure

The user's terminal invariant is the final `master`, not intermediate work.
Each cleanup batch must preserve a recoverable and auditable path to that state.

## Git Policy

- Work only from `master` after `git fetch` and an explicit SHA/status check.
- Refuse to start a batch with unexpected overlapping changes.
- Use small ordinary commits; one OpenSpec change should close as one coherent
  logical unit where practical.
- No rebase, reset, history rewrite, force push, branch deletion, or tag rewrite
  is part of this cleanup program.
- Push with an ordinary fast-forward `git push origin master` only.
- Never include unrelated untracked or user-authored files via `git add .`;
  stage exact paths and inspect the staged diff.
- Do not read, modify, migrate, or delete `deck_*` or `dpt_*`.

## Batch Admission

Record before editing:

```text
start_sha
origin_master_sha
remote_master_sha
git status --short --branch
active OpenSpec changes
```

Admission requires local `HEAD`, `master`, `origin/master`, and remote master to
agree, unless a newly fetched remote commit is first reviewed and fast-forwarded.

## Pre-Push Gate

Before every push:

1. `git status --short --branch` shows only intended files.
2. `git diff --check` passes.
3. `git diff --cached --name-status` matches the batch scope.
4. Required focused and baseline verification passes.
5. OpenSpec status/strict validation is clean.
6. No test/provider command requiring live remote authorization was run.
7. The commit is inspected with `git show --stat --oneline HEAD`.

If any invariant fails, stop before push. Do not repair it with history rewrite.

## Post-Push Proof

After an ordinary push, capture and compare:

```bash
git rev-parse HEAD
git rev-parse master
git rev-parse origin/master
git ls-remote origin refs/heads/master
```

All four SHAs must be identical. Then require:

- `git status --short --branch` has no cleanup-related residue;
- the OpenSpec change is archived only after tasks and verification close;
- active specs/config/guidance contain no old term or path targeted by the batch;
- archive remains unchanged unless normal OpenSpec archival created the one
  expected new history record.

## Recovery

Before push, recovery is an ordinary correction or new commit on the working
branch. After push, recovery is a new forward fix commit. Do not rewrite the
published branch to hide an error.

For semantic cleanup failures, restore the last known current behavior from Git
in a forward commit, then revise the OpenSpec design. Run Bundles remain outside
the cleanup and therefore require no rollback or migration.

## Program Completion

The program can close when:

- all P0/P1 findings are resolved or explicitly rejected with an owner/rationale;
- every retained active concept has one authority and at least one live consumer;
- no current spec is a retired-capability tombstone;
- no active guidance offers compatibility or historical protocol handling;
- every architecture guard has fresh planted-negative-control evidence;
- the singleton production-mode decision is recorded, even if the result is
  deliberate retention;
- final local and remote master SHAs agree and the worktree is clean except for
  separately identified user work.
