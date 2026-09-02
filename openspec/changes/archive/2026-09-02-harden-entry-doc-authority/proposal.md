# Proposal: harden-entry-doc-authority

## Why

The unified entry `ppt_flow.mjs` header comment re-declares a command inventory
("Current commands: …") that has already drifted: it lists 12 commands while the
entry registers 15+, missing exactly the newer owner entries (`preflight`,
`probe`, `artifacts`, `paginate`, `reset-unproduced-v1`) that BOOTSTRAP and the
Agent Contract emphasize. The drift proves that prose command inventories
outside the audited Markdown surfaces rot silently: `validateDocumentedCommands`
audits documented Markdown commands, not code comments, and the script-layout
rule that command modules "SHALL NOT re-declare the command inventory" is not
guarded for the entry file itself. Separately, `BOOTSTRAP.md` — the entry every
Agent reads first — uses dense Page Image terminology (run bundle, `--run-dir`,
receipt, Call Shape, workflow, hard-stop) before any gloss is available, so
first-session readers must leave the entry file to parse it.

## What Changes

- Remove the duplicated command inventory from the `ppt_flow.mjs` header
  comment. The header SHALL point to the single authorities instead: the
  entry's own `program.command(...)` registrations, `--help` as runtime truth,
  and `ppt_maker_harness/COMMANDS.md` as the human-facing map.
- Add a bounded command-surface contract guard that rejects a
  command-inventory re-declaration in the unified entry file, so this drift
  class cannot silently return.
- Add a bounded entry-vocabulary scaffold to `BOOTSTRAP.md`: a short minimum
  glossary (roughly 10–15 terms, one plain-language line each) placed before
  Step 0, explicitly marked as a reading aid that names `CONTEXT.md` and
  `reference/glossary.md` as the terminology and where-map authorities without
  restating any authority.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `harness-script-layout`: new requirement that the unified entry file SHALL NOT
  re-declare the command inventory in prose (comments included) and SHALL point
  to the owning authorities; a coherence guard SHALL enforce this.
- `harness-charter`: new requirement that `BOOTSTRAP.md` SHALL carry a bounded
  entry-vocabulary scaffold ahead of Step 0 that glosses the terms its own steps
  use and delegates terminology authority to `CONTEXT.md` /
  `reference/glossary.md`.

## Impact

- `ppt_maker_harness/scripts/ppt_flow.mjs` — header comment only; no runtime,
  CLI, or exit-path behavior change.
- `ppt_maker_harness/BOOTSTRAP.md` — additive guidance section; no Step 0–4
  semantic change.
- `tests/contracts/` — one new bounded guard (entry-file command-inventory
  re-declaration) plus the existing coherence/docs-consistency checks staying
  green.
- No schema, state, run-bundle layout, CLI grammar, or diagnostic envelope
  changes.
