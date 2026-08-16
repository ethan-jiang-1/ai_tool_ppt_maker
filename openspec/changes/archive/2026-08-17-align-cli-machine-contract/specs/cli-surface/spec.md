# CLI Surface Specification (delta)

## ADDED Requirements

### Requirement: CLI success reports are structured owner results

Every current direct CLI success SHALL be produced by one command owner result
object that carries a schema/version, the operation identifier, a bounded
`state` classification (`success`, `partial-effect`, `no-op`, or `failure`),
and the command's business `effect` facts. Text and JSON are two renderers of
that one result; a renderer SHALL NOT own or re-derive business facts.

In JSON mode the command SHALL emit exactly one registered report document on
stdout — no progress text, prose, or unregistered fields. A mutating command
(`new-version`, `build`, `refresh`, `image2`, `style-master`) SHALL distinguish
success, partial-effect, no-op, and failure so a consumer can act on the exact
effect that occurred. A non-zero exit SHALL still place the single secret-safe
envelope on the last non-empty stderr line; the stdout report relationship is
defined per operation and SHALL NOT leak incidental JSON.

#### Scenario: A renderer never owns a business fact

- **WHEN** one command owner result feeds both the text and JSON renderers
- **THEN** changing a fact in the owner result changes both renderers
  consistently
- **AND** no renderer re-derives the operation, effect class, or diagnostic
  from its own prose

#### Scenario: JSON mode emits exactly one registered document

- **WHEN** a current command runs with `--json`
- **THEN** stdout contains exactly one schema-valid registered report document
- **AND** it does not mix in progress lines, incidental JSON, or human prose

#### Scenario: A partial mutation is distinguishable

- **WHEN** a mutating command completes its delivery but a subsequent effect
  (such as the current task-projection refresh) fails
- **THEN** the owner result records the delivery effect and the failed effect
  as separate fields
- **AND** the renderer reports `partial-effect`, not a bare failure or success

### Requirement: CLI exit matrix is a complete three-source fact table

The direct CLI exit contract SHALL be a complete fact table covering three
sources and their precedence: JS-controlled outcomes, process signals, and a
delegated child status. The baseline SHALL be: `0` success; `1` JS-controlled
hard failure (including `state --validate-state` invalid); `2` the ordinary
`state` replacement/current-repair hard-stop; `130` SIGINT; `143` SIGTERM.

A delegated child's numeric status SHALL NOT be forwarded verbatim as the
parent exit code. The parent SHALL normalize any JS-controlled hard failure to
`1`, preserve signal exits as `130`/`143`, and retain the child's bounded
numeric status inside the diagnostic facts — not as the process exit code.
Overflow and signal-killed child statuses SHALL normalize to `1`.

#### Scenario: A delegated child status is bounded, not forwarded

- **WHEN** `ppt_flow test` runs the bounded verification child and it exits
  with a numeric status
- **THEN** the parent exits `1` on any non-zero child status
- **AND** the child's bounded numeric status is retained in the diagnostic
  facts only

#### Scenario: Signals keep their reserved exits

- **WHEN** the CLI is interrupted or terminated
- **THEN** SIGINT exits `130` and SIGTERM exits `143`
- **AND** a JS-controlled failure never aliases those reserved codes

### Requirement: Every command help carries an implementation-equal machine contract block

Each current direct command's `--help` SHALL end with a machine contract block
that declares its exit codes, stdout/stderr contract, digest field names, and
decision enums. The block SHALL be derived from the same single declaration the
implementation consumes — the equality SHALL be audited, not merely a
"contains the text" assertion.

The `state` contract block SHALL state that ordinary text `state` and
`state --json` may rebuild the current task projection only for the eligible
active replacement Controller route, after read-only inspection.

#### Scenario: The help block cannot drift from the implementation

- **WHEN** an implementation grammar, exit, or decision enum changes without a
  matching contract-block change
- **THEN** the equality audit fails
- **AND** a contract block that merely contains the same words is not accepted
  as equal

### Requirement: Command inventory is closed and audited

The direct CLI command inventory SHALL be closed and audited rather than a
fixed literal count. Adding a command SHALL require a declared owner, single
responsibility, complete grammar, output mode, effect class, test ownership,
and a stated reason it does not overlap an existing command. Removing a command
SHALL close its runtime entry, consumers, and residue guard. The inventory
SHALL remain a single declared list consumed by the entry, the architecture and
coherence audits, and the command-surface seams.

#### Scenario: A new command must declare its contract

- **WHEN** a command is added without a declared owner, grammar, effect class,
  output mode, test ownership, and non-overlap reason
- **THEN** the inventory audit rejects it before it becomes a production route

#### Scenario: The inventory is not a hard-coded count

- **WHEN** the audited command inventory changes
- **THEN** every guard that previously asserted a fixed numeric command count
  follows the declared inventory instead
- **AND** no guard keeps a stale hard-coded count

## MODIFIED Requirements

### Requirement: New-version CLI success activates a clean current draft

For an exact current Page Image Workflow source with an explicit selected
workflow, `ppt_flow new-version` SHALL report success only after clean
filesystem copy and state-owned target-draft activation both complete. Its
output SHALL identify the target and selected authoring workflow without
revealing prompt/provider/authorization/acceptance data. It SHALL make no
provider request and inherit no source evidence.

If the filesystem copy publishes the visible `vN/` but target-draft activation
then fails, the command SHALL report a `partial-effect` owner result that
separates the published version from the failed activation, and SHALL offer a
strict, no-hand-delete resume/compensation action that identifies "this run
created but did not activate the target". The command SHALL NOT require manual
directory deletion, and SHALL NOT report a bare failure that hides the already
published version.

#### Scenario: A completed current source produces a clean draft

- **WHEN** `new-version` copies a completed current Pure or Framed source
- **THEN** stdout identifies a target authoring draft for the same selected
  workflow
- **AND** subsequent validation sees fresh target evidence rather than copied
  raw, review, or delivery facts

#### Scenario: Activation failure after copy is a distinguishable partial effect

- **WHEN** `new-version` publishes the visible `vN/` and target-draft
  activation then fails
- **THEN** the owner result reports `partial-effect` with the published version
  and the failed activation as separate facts
- **AND** it offers a strict resume/compensation action that does not require
  manual directory deletion

### Requirement: CLI observations retain only non-authoritative Page Image projections

`status` and `state --validate-state` SHALL remain zero-write current Page
Image Workflow observations.  Ordinary text `state` and `state --json` may
rebuild the current task projection only for the eligible active replacement
Controller route, after read-only inspection.  The projection SHALL remain a
collaboration view and shall not authorize provider cost, select a lifecycle
action, prove evidence, or resume work.  A run whose source/state/evidence
cannot establish the declared current protocol is not eligible to produce or
update it. The `state` `--help` contract block SHALL state this projection
rebuild behavior.

#### Scenario: Status does not repair Page Image state

- **WHEN** `status` observes a current repairable workflow fact
- **THEN** it returns the owner-issued action without writing source, state,
  receipt, authorization, or generated artifacts
- **AND** it does not invoke a provider or create a task card

#### Scenario: State help names the projection rebuild behavior

- **WHEN** an Agent reads `state --help`
- **THEN** the machine contract block states that ordinary text `state` and
  `state --json` may rebuild the current task projection only for the eligible
  active replacement Controller route after read-only inspection
- **AND** it does not present that rebuild as an authorization or evidence
  write
