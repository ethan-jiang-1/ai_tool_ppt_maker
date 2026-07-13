## ADDED Requirements

### Requirement: MD consumes CLI diagnostics without guessing or shell interpretation

The CLI-to-MD consumer protocol SHALL reference producer fields and emission rules owned by capability `cli-surface`; it SHALL NOT redefine them. MD SHALL treat every non-zero CLI return as process status plus the final stderr envelope, use required top-level fields as legacy summary, and use diagnostic data for structured action only when its version is supported and the complete nested object validates against that version.

If a process ends non-zero without a valid final envelope, MD SHALL treat the producer as externally interrupted or crashed and SHALL NOT infer category, lineage, or recovery from partial stdout/stderr. A supported `interrupted` diagnostic means execution stopped, not that source or framework code is defective.

MD SHALL NOT invent omitted paths, ids, lines, causes, invocations, approvals, or issue results. It SHALL interpret `diagnostic.next`: automatic actions may proceed only within MD authority, while `requires_human:true` SHALL stop for a genuine human decision. If `next.invocation` is followed programmatically, MD SHALL pass `program` and `args` directly without a shell; it SHALL NOT concatenate them into executable shell text.

#### Scenario: MD follows an automatic invocation safely

- **WHEN** v1 evidence has `next.requires_human:false` and a structured invocation
- **THEN** MD uses supplied causal evidence without expanding affected scope
- **AND** executes program/args with argument boundaries preserved and shell disabled

#### Scenario: MD receives a human decision gate

- **WHEN** v1 evidence has `next.requires_human:true`
- **THEN** MD presents the named decision/evidence to the human
- **AND** does not treat default or invocation as fabricated approval

#### Scenario: MD receives a legacy, unsupported, or malformed diagnostic

- **WHEN** a valid envelope lacks diagnostic, uses an unsupported version, or has malformed supported-version fields
- **THEN** MD falls back to code/message/hint/where
- **AND** treats structured context as unknown

#### Scenario: Process returns no valid envelope

- **WHEN** process status is non-zero but no valid final envelope exists
- **THEN** MD reports an external interruption/crash boundary
- **AND** does not promote partial output into causal evidence

### Requirement: MD follows source ownership, aggregation, and delegation semantics

MD SHALL interpret lineage as ordered evidence from editable origin toward the observed artifact. A derived artifact is not thereby an edit target; MD SHALL prefer diagnostic source and `next.inspect`, treat inspect locators as read targets rather than edit permission, and SHALL NOT hand-edit run-bundle `_generated/`. Each retained issue is a separate fact; `omitted_count` or `truncated` means evidence is incomplete. For parent-wrapped failures, parent code/where/next are control authority while preserved child subject/source/reason/lineage/issues are causal evidence; MD SHALL NOT search for a second child envelope or follow a discarded child recovery action.

#### Scenario: Failure is observed in a generated artifact

- **WHEN** lineage names a missing, stale, ambiguous, or invalid `_generated/` artifact
- **THEN** MD follows the supplied source, prerequisite Stage, or rerun action
- **AND** does not patch the generated file

#### Scenario: Aggregate evidence is truncated

- **WHEN** a diagnostic has retained issues plus omitted/truncated metadata
- **THEN** MD handles listed issues
- **AND** does not assume unlisted issues passed

#### Scenario: Parent action and child evidence differ

- **WHEN** child evidence identifies a Stage 2 slide but parent next action requires pilot review
- **THEN** MD uses child evidence to understand cause
- **AND** follows parent control action rather than rerunning the child directly

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter a generated root `AGENTS.md`/`CLAUDE.md` route to `deck-guide.md`. The guide SHALL explain the consumer essentials without referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured `diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true, do not guess omitted lineage, and never hand-edit `_generated/`.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `scripts/lib/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas
