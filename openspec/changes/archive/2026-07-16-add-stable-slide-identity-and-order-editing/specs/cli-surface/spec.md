## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose **13** commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, and `slides`. Arguments and flags for the original twelve commands SHALL remain compatible.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

#### Scenario: help lists state

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `state` command

#### Scenario: help lists slides

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs --help`
- **THEN** the help output includes the `slides` command group

### Requirement: --only accepts friendly slide selectors

`ppt_flow` paths that accept `--only` (including `pilot`) SHALL use the shared selector contract owned by `slide-identity-and-ordering` and used by `pipeline-orchestration`. All tokens in one invocation SHALL resolve against one current plan snapshot as per-token bindings containing the original token, formal slide ID, current position, and `matched_by`. The `--only` caller MAY deduplicate repeated formal IDs for execution after retaining binding evidence; the shared resolver SHALL NOT silently deduplicate them. Unknown or ambiguous selectors SHALL fail with the standard JSON envelope whose bounded hint/evidence lists available or matching `position + slide_id + title` tuples.

#### Scenario: Page number selects a slide

- **WHEN** `--only 3` is passed and the third plan entry has ID `UXGap`
- **THEN** pilot or Stage 2 targets formal ID `UXGap`

#### Scenario: Spoken mnemonic selects a slide

- **WHEN** `--only "UX gap"` is passed and formal ID `UXGap` exists
- **THEN** the command targets `UXGap`

#### Scenario: Unknown selector lists current pages

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** its bounded diagnostic identifies real current positions, formal IDs, and titles from `slide_plan.json`

#### Scenario: Unknown selector lists ids

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** `hint` includes real ids from `slide_plan.json`

#### Scenario: Repeated selectors retain resolution evidence

- **WHEN** one `--only` invocation contains multiple tokens that resolve to the same formal ID by different branches
- **THEN** selector output retains one ordered binding per token and each `matched_by`
- **AND** the pipeline may execute the formal ID once without changing the shared resolver result

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 13 commands registered by `ppt_flow.mjs`: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, and `slides`. Each command SHALL register every applicable return category or an explicit not-applicable reason. Every `slides` subcommand SHALL be covered by command-specific success, usage, source-validation, conflict, stale-base, and commit return tests as applicable. A new, removed, or renamed command or subcommand SHALL fail the set comparison.

#### Scenario: Registered and audited commands differ

- **WHEN** commands registered before `parseAsync` are compared with the audit registry
- **THEN** the test fails on every missing or stale command name

#### Scenario: Slides subcommand lacks return coverage

- **WHEN** a `slides` subcommand is registered without applicable return cases or explicit not-applicable reasons
- **THEN** the return audit fails and names that subcommand

#### Scenario: Contextual gate failure guides MD

- **WHEN** a command is blocked by a known gate or review condition
- **THEN** the diagnostic identifies the gate/affected ids when known
- **AND** `next.action` and `next.requires_human` distinguish rerun from human decision
- **AND** `next.invocation` supplies the preferred argument-safe `ppt_flow` invocation when known

## ADDED Requirements

### Requirement: ppt_flow slides exposes deterministic identity and order operations

`ppt_flow slides` SHALL expose `list`, `resolve`, `normalize`, `move`, `delete`, `insert`, and `apply-plan` subcommands backed by the shared slide-document and transaction interfaces rather than command-local Markdown rewrites. The canonical structure-editing target SHALL be one run-directory `slide-specifications.md`.

`list` SHALL display current `position + formal slide_id + title`; `resolve` SHALL return per-token bindings with formal IDs, current page metadata, and `matched_by` without mutation. `normalize`, `move`, `delete`, `insert`, and plan creation SHALL return the shared before/after transaction preview including canonical `plan_sha256` and SHALL write no source, version, state, or generated artifact. A new insertion SHALL require a caller-supplied complete slide block with an Agent-authored, historically available mnemonic ID; the CLI SHALL validate but SHALL NOT invent that ID.

`move`, `delete`, and `insert` apply SHALL require both `--apply` and `--plan-sha256 <confirmed-hash>` and SHALL refuse to apply if a newly canonicalized transaction differs from the confirmed preview. `apply-plan --apply` SHALL accept only a schema-valid, self-hash-valid plan from the current run directory's `_scratch/` boundary and SHALL enforce both its plan hash and base source hash. A bare mutating `--apply` SHALL fail closed rather than previewing and applying within one invocation. Structural apply SHALL use the Structural Versioning Path and publish the shared edit receipt without invoking a remote renderer. `normalize --apply` SHALL be the sole in-place exception, SHALL only correct heading projections, and SHALL still require its confirmed preview hash. Every subcommand SHALL support stable `--json` success output where applicable; human output SHALL remain a rendering of the same structured facts.

#### Scenario: List exposes both ways to refer to a page

- **WHEN** `ppt_flow slides list <run-dir>` runs on a valid source
- **THEN** each row includes current position, formal ID, and title
- **AND** no file is changed

#### Scenario: Move defaults to preview

- **WHEN** `ppt_flow slides move <run-dir> 7 --after 3` runs without `--apply`
- **THEN** it resolves target and anchor against one pre-edit snapshot and returns per-token bindings, before/after order, impact, and `plan_sha256`
- **AND** it does not create a version or write source

#### Scenario: Confirmed apply creates a structural version

- **WHEN** the same valid move is invoked with `--apply --plan-sha256 <preview-hash>` after confirmation
- **THEN** it creates and atomically publishes the next-version source through the structural transaction contract
- **AND** success output contains the confirmed plan hash, edit receipt, new run-directory locator, and any `needs_render` IDs

#### Scenario: Normalize apply does not create a version

- **WHEN** `ppt_flow slides normalize <run-dir> --apply --plan-sha256 <preview-hash>` corrects heading drift
- **THEN** only the current source heading projections change atomically
- **AND** no next version is created

#### Scenario: Insert has no Agent-authored identity

- **WHEN** an insert invocation supplies a slide block with an empty, invalid, reused, or missing ID
- **THEN** the command fails with a source-validation diagnostic
- **AND** does not generate a random mnemonic or create a version

#### Scenario: Bare structural apply is rejected

- **WHEN** `ppt_flow slides delete <run-dir> 7 --apply` omits a confirmed plan hash
- **THEN** the command fails without writing source, state, generated artifacts, or a visible version
- **AND** directs the caller to run the preview and submit its `plan_sha256`

#### Scenario: Plan hash changed after preview

- **WHEN** the command arguments or planner result produce a canonical hash different from `--plan-sha256`
- **THEN** the command fails even if `base_spec_sha256` still matches
- **AND** does not substitute or apply the unconfirmed transaction

#### Scenario: Structural apply does not authorize rendering

- **WHEN** apply publishes a target whose inserted or unverified retained IDs need raw renders
- **THEN** success output reports those IDs under `needs_render`
- **AND** the invocation makes no Image2 or future remote-render request

### Requirement: Structural CLI failures use the existing diagnostic authority

All non-zero `slides` outcomes SHALL use `cli_error.mjs` and the existing `cli-surface` envelope, bounded diagnostic, secret-safety, and output-transaction requirements. Deterministic structure facts SHALL use the existing diagnostic categories and fields by reference; this change SHALL NOT introduce a second error schema. Missing/mismatched plan hash, source hash mismatch, selector ambiguity, validation errors, and staging/publication failures SHALL identify known source/subject/operation lineage and provide an argument-safe next action without instructing edits to `_generated/`.

#### Scenario: Stale preview cannot be applied

- **WHEN** `apply-plan` receives a transaction whose base source hash no longer matches
- **THEN** it exits non-zero with exactly one standard final envelope
- **AND** the diagnostic identifies the canonical source and directs a fresh preview rather than rebasing

#### Scenario: Ambiguous selector needs a human choice

- **WHEN** a structural selector matches multiple pages
- **THEN** the final diagnostic contains bounded candidate facts and marks the choice as requiring human input
- **AND** no source or version is changed

#### Scenario: JSON preview remains valid on success

- **WHEN** a preview subcommand runs with `--json` and succeeds
- **THEN** stdout is one documented structured preview report
- **AND** no failure envelope or human progress text corrupts the JSON channel
