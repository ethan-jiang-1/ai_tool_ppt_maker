# Design: harden-entry-doc-authority

## Context

The drift is real and located: `ppt_flow.mjs` lines 9–10 enumerate twelve
commands while the file registers `artifacts`, `build`, `doctor`, `init`,
`new-version`, `paginate`, `preflight`, `probe`, `refresh`, `slides`, `state`,
`status`, `style-master`, `test`, `validate`, `image2`, and
`reset-unproduced-v1`. Existing guards do not see it: the machine-readable
single-home inventory `PPT_FLOW_COMMAND_INVENTORY` lives in
`shared/cli/cli_error.mjs` and is already cross-checked against
`COMMAND_CONTRACTS` and against the guidance Markdown (README, BOOTSTRAP,
COMMANDS) by the command-surface entry-seam process suite
(`tests/contracts/test_process_command_surface_entry_seams.mjs`), but the entry
file's own bytes are never scanned for a prose re-declaration. BOOTSTRAP.md
is owned at spec level by `harness-charter` (canonical-entry and fix-instruction
requirements already live there), so a vocabulary scaffold belongs in the same
capability.

The command inventory's single home is already normative: `harness-script-layout`
requires that command modules "SHALL NOT re-declare the command inventory or
Commander registration". The header comment is a soft violation of the same
principle by the entry file itself.

## Goals / Non-Goals

**Goals:**

- Entry-file prose stops claiming a command inventory; it points instead of
  enumerating.
- The re-declaration failure class gets a guard, matching the repo's
  "turn discipline into a test" pattern.
- A first-session Agent can parse BOOTSTRAP Steps 0–4 without leaving the file,
  via a bounded reading aid that defers terminology authority.

**Non-Goals:**

- No change to any registered command, flag, exit path, stdout/stderr JSON, or
  diagnostic envelope (see `cli-surface`; untouched).
- No rewrite of CONTEXT.md terminology, no new canonical terms.
- No general prose-drift sweep beyond the unified entry guard (other prose
  surfaces keep their current owners).
- No BOOTSTRAP Step 0–4 semantic or sequencing change.

## Decisions

1. **Delete the enumeration; do not re-sync it.** Updating "12" to "17" would
   recreate the same future drift. The header instead names the three owning
   authorities (registrations in this file, `--help`, `COMMANDS.md`).
   Alternative considered: generating the comment from `COMMAND_CONTRACTS` at
   build/test time — rejected as a second projection to keep synchronized.
2. **Guard shape: inventory-density detection over the entry file's comment
   bytes.** The guard reuses the existing single-home inventory
   (`PPT_FLOW_COMMAND_INVENTORY`) instead of inventing a second list, and flags
   a comment block that enumerates several distinct inventory commands
   (threshold: 3 or more). This is phrasing-independent — a re-worded
   enumeration still trips — while mentions of one or two commands (help
   commentary, single-command notes) stay legal. It lives in the
   command-surface entry-seam process suite
   (`tests/contracts/test_process_command_surface_entry_seams.mjs`), which
   already owns entry/command-contract/inventory validation, with the detection
   helper kept local to that test: the pass case reads the real entry file, the
   fail case feeds a synthetic header string. No new public interface, so the
   architecture interface inventory is untouched. Note the suite is a
   deliberately selected process check (process tests are excluded from the
   vitest sweep by config), which matches how the repo already treats
   entry-surface checks. Alternatives considered: extending
   `harness_coherence.mjs` to parse JS comments (broadens one engine's contract
   for one call site), and generating the header comment from
   `COMMAND_CONTRACTS` at build/test time (a second synchronized projection).
3. **Vocabulary scaffold is additive and authority-deferring.** Positioned
   between the intro and Step 0 in BOOTSTRAP.md; one line per term; explicit
   "reading aid" framing pointing to `CONTEXT.md` and `reference/glossary.md`.
   The term set is fixed in the delta spec's minimum list so the scaffold
   cannot silently shrink.
4. **Spec homes stay with existing owners.** Entry-file prose rule →
   `harness-script-layout` (already owns the no-redeclaration rule); BOOTSTRAP
   content rule → `harness-charter` (already owns BOOTSTRAP requirements).

## Risks / Trade-offs

- [Guard misses a differently-phrased enumeration of only one or two commands]
  → Accept: the threshold (≥3 distinct inventory commands in one comment block)
  covers the observed drift class; `--help` and `COMMANDS.md` remain the truth
  sources regardless of what any comment says.
- [Guard false-positives on a legitimate comment that happens to name several
  commands] → The entry file currently carries no such comment; if one is ever
  needed, it names the authorities (per the delta spec) instead of enumerating,
  which the guard permits.
- [Vocabulary scaffold drifts from CONTEXT.md] → Explicitly framed as a
  reading aid whose authority is deferred; drift is a guidance defect, not an
  authority conflict (spec scenario pins this).
- [Docs-coherence and entry-seam checks may flag the edited BOOTSTRAP section]
  → The scaffold adds no links outside the two owning references and no command
  grammar; both affected process suites run during verification.

## Migration Plan

Single-repo, additive change; no migration. Rollback is reverting the two file
edits and the guard test. Validation: `openspec validate --strict` (change and
`--all`), `npm test` core smoke, the two selected process suites
(`run_selected_verification.mjs process tests/contracts/
test_process_command_surface_entry_seams.mjs` and `... test_process_docs_consistency.mjs`),
and `npm run test:sweep` for the regression baseline.

## Open Questions

(none)
