# Tasks: harden-entry-doc-authority

## 1. Entry file: stop re-declaring the command inventory

- [x] 1.1 Replace the "Current commands: …" enumeration in the
  `ppt_flow.mjs` header comment with a pointer to the owning authorities
  (this file's `program.command(...)` registrations, `--help` runtime truth,
  `ppt_maker_harness/COMMANDS.md`); verify with
  `node ppt_maker_harness/scripts/ppt_flow.mjs --help` exiting 0 and the header
  no longer listing command names, plus `npm test` (core smoke) passing
- [x] 1.2 Add the command-surface contract guard to
  `tests/contracts/test_process_command_surface_entry_seams.mjs`: using the
  existing `PPT_FLOW_COMMAND_INVENTORY`, flag any comment block in the unified
  entry that enumerates 3+ distinct inventory commands, with the detection
  helper kept local to the test (pass case: real entry file; fail case:
  synthetic header string); verify by running
  `node tests/contracts/run_selected_verification.mjs process tests/contracts/test_process_command_surface_entry_seams.mjs`
  green, including the new guard

## 2. BOOTSTRAP entry vocabulary scaffold

- [x] 2.1 Add the bounded vocabulary scaffold between the BOOTSTRAP intro and
  Step 0: one plain-language line per minimum term from the delta spec (run
  bundle, `--run-dir` version leaf, Work Version, receipt, state,
  `production.workflow: framed|pure`, hard-stop, Image2 Call Shape, Image2
  provider profile vs `IMAGE2_PROVIDER_PROFILE_ID`, `_generated/`, `slide_id`
  vs `position`), framed as a reading aid that defers terminology authority to
  `CONTEXT.md` and `reference/glossary.md`; verify no command grammar or
  authorization rule was introduced and the docs-consistency suite stays green
  via `node tests/contracts/run_selected_verification.mjs process tests/contracts/test_process_docs_consistency.mjs`.
  Evidence: scaffold added and boundary-compliant; entry-seam suite
  (byte-scans BOOTSTRAP) passes 6/6; docs-consistency has 3 failures that
  reproduce identically on clean HEAD (stash experiment) — pre-existing,
  recorded as an external blocker, no new failure introduced

## 3. Verification

- [x] 3.1 Run `openspec validate "harden-entry-doc-authority" --strict` and
  `openspec validate --all --strict`; both must pass
- [x] 3.2 Run the two selected process suites from tasks 1.2 and 2.1 (they are
  excluded from the vitest sweep and must be selected deliberately) and confirm
  both are green.
  Evidence: entry-seam suite 6/6 green (incl. the new guard); docs-consistency
  3 failed | 9 passed — the 3 failures reproduce identically on clean HEAD
  (stash experiment) and are pre-existing, unrelated to this change; recorded
  as an external blocker, no unrelated files edited
- [x] 3.3 Run `npm run test:sweep` (full vitest regression) and confirm the
  suites stay green; record any pre-existing unrelated failure as an external
  blocker instead of editing unrelated files.
  Evidence: first sweep attempt ran 3h wall with socket-timeout errors
  (machine slept mid-run) — 7 failures all outside `tests/contracts`;
  `tests/contracts` subset alone passed 14 files / 106 tests; clean re-run:
  84 files / 702 tests all green in 163s. Change surfaces are green on both
  sides of the edit
