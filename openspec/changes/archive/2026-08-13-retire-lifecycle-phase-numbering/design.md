## Context

`ppt_maker_harness/playbook/*.md` is the source of truth for controller node
declarations, and `md_controller_reader.mjs` is its transient parser and
validator. Every current node has both `lifecycle_phase` and `method_module`.
The reader validates the latter against `METHOD_MODULES`, then adds a partial
numeric mapping for target production and iteration nodes. The target-module
checks themselves are independent of the numeric field: they use
`TARGET_STAGE_FOUR_MODULES`, `TARGET_WORKFLOW_MODULES`, the adapter, and the
declared workflow.

The current reader has no general unknown-node-frontmatter-key validator.
Its only `phase` behavior is the dedicated `raw.phase` / `unsupported-phase`
branch. Removing that branch therefore returns `phase` to the parser's existing
uninterpreted-key behavior; adding a generic key validator would be a separate
control change, not a consequence of this removal.

## Goals / Non-Goals

**Goals:**

- Make a valid `method_module` the only bound lifecycle-location declaration.
- Delete the duplicated numeric metadata and its reader-only validation rules
  without weakening the existing target-module ownership checks.
- Align the directly affected controller and method-module prose, then prove
  the removal through focused reader and documentation-coherence coverage.

**Non-Goals:**

- Do not rename the broader `Lifecycle Phase` concept, unrelated capability or
  test-directory prose, or customer roadmap examples.
- Do not change run-bundle state, CLI output, gates, provider work, or any
  production `deck_*` data.

## Decisions

### Preserve one controller authority

The Markdown playbooks remain the direct source of record for node location;
the reader remains the single deterministic evaluator. The MD Controller and
Agent retain intent, sequencing, and human communication. No state writer,
controller handoff, CLI protocol, or durable record changes, so this work adds
neither a second controller nor a new authority.

### Retire only the duplicate numeric binding

Delete each active-node `lifecycle_phase:` declaration. In the reader, remove
`LIFECYCLE_PHASES`, the `lifecyclePhase` and `unsupportedPhase` normalized
fields, and the `unsupported-phase`, `lifecycle-phase`, `phase4-ownership`,
and `target-lifecycle` branches. Keep `METHOD_MODULES`,
`TARGET_STAGE_FOUR_MODULES`, and `TARGET_WORKFLOW_MODULES` unchanged because
they still establish adapter and selected-workflow ownership.

`phase` and `lifecycle_phase` will have no lifecycle-specific interpretation or
diagnostic after this change. An otherwise unconsumed legacy `phase` key keeps
the reader's existing unconsumed-key behavior: it is accepted with no
lifecycle-specific effect. No generic node-key allowlist is added in this
change.

### Align only direct lifecycle guidance

Rename the affected numeric labels to the corresponding method-module names in
the three workflow overview files, the two internal README files, the content
and visual preset READMEs, the direct process references in
`01-gather-product-context-dna.md` and `block-arc-catalog.md`, and the
`probe-image-channels` shared-node prose. The matching `playbook-execution`
delta updates the accepted shared-probe wording. Customer-content examples in
`block-arc-catalog.md` stay untouched. Broader taxonomy alignment, including
the project-context `Lifecycle Phase` table and missing charter documentation
for `method_module`, remains outside this change.

The existing `hierarchy-ambiguity` guard is not a source of lifecycle truth.
Remove only its legacy `phase: 04` alternative, while retaining its remaining
patterns that identify actual hierarchy conflation. This avoids preserving a
special semantic status for the retired legacy key without adding a general
unknown-key policy.

## Decision: Legacy `phase` Key Is Unconsumed

A legacy `phase` key is treated as an otherwise unconsumed node-frontmatter
key: it has no lifecycle-specific parse field, validation rule, or diagnostic.
The reader keeps its existing unconsumed-key behavior, so the change remains a
pure deletion of the numeric lifecycle surface. A generic node-key allowlist
that rejects unknown keys is out of scope and would be a separate control
change with its own `node-specification` delta.

## Compatibility And Recovery

There is no persisted `lifecycle_phase` field or generated artifact to migrate:
the value occurs only in checked-in controller declarations and transient reader
objects. A completed implementation is idempotent because re-reading the
playbooks rebuilds the index from the reduced declarations. If a source edit is
invalid, the existing read-only validator reports its bounded source/line error;
the legal recovery is to correct the owning Markdown declaration and rerun that
same validator. No state heal, waiver, confirmation, or force path applies.

This compatibility posture is unchanged for unconsumed keys: the reader keeps
its existing behavior, so a legacy `phase` key is accepted with no lifecycle
effect and requires no migration boundary.

This is not a human-centered guide/confirm/hard-stop change under
`openspec/policies/human-centered-gates.md`: it changes no user-facing gate or
continuation. Under `agent-assistance-and-control.md`, the direct fact remains
the playbook source and the existing reader remains the evaluator. Under
`simple-reliable-control.md`, the common scope removes duplicated parsing and
five numeric validation branches and adds no generic validator, fallback,
retry, or persistent state.

## Verification Strategy

- **Focused unit/integration coverage:** update the reader and draft-route
  fixtures so method-module-only declarations validate, invalid
  `method_module` behavior remains covered, and a legacy `phase` key is
  accepted as an unconsumed key with no retired phase-specific diagnostic.
  Extend the documentation-coherence test to prove the removed `phase: 04`
  branch does not recur while genuine hierarchy ambiguity is still detected.
- **Protected core:** `npm test` is the repository's documented core check for
  every normal Harness change and exercises the affected shared and contract
  seams.
- **E2E:** no mock or real E2E run is needed. No public journey, persisted
  state, provider path, or CLI surface changes; real E2E would add unrelated
  external-work risk.
- **Static evidence:** verify that active playbook declarations contain no
  `lifecycle_phase:` lines and that the retired reader identifiers are absent
  from the reader and its focused test surfaces. Do not require a repository-
  wide zero match because the accepted specification must retain the term when
  describing its retirement and unrelated historical/content terminology is
  intentionally out of scope.
