# Schema-First Clean-Cutover Decisions

> Type: decision rules for an active recovery route | Updated: 2026-08-11 | Status: active
>
> Linked route: [Schema-First Page Image Recovery](schema-first-page-image-recovery.md)

## Purpose

Use these rules whenever schema-first work exposes a term, serialization
format, protocol label, mode, identity scheme, record type, or recovery rule
that was previously hidden in code rather than deliberately owned by
`ppt_maker_harness/schema/`.

The decision is a clean cutover, not compatibility work. The Harness is one
continuously improved current tool with one current Page Image contract. Only a
Run Bundle has Work Versions; external dependency/tool versions are environment
facts. Git commits and OpenSpec archives preserve Harness history, so a
Harness/repo release number must not become another identity or compatibility
axis.

## Governing Decision

Do not preserve an old `*-vN` value merely because current code, tests, sample
data, or a prior plan can still read or write it. Do not add a compatibility
reader, migration command, conversion path, frozen-name exception, or dual
writer to make the old and new contracts coexist.

When a hidden term is found, decide its destination before changing a caller:

| Finding | Required disposition |
| --- | --- |
| It names a meaningful Page Image concept or durable serialized artifact | Define its unversioned meaning and serialization in `ppt_maker_harness/schema/`, then refactor every active owner to that one definition. |
| It is a necessary implementation detail but not a human/Agent production concept | Move it to one explicit, named implementation owner with a documented invariant; it must not masquerade as a schema or carry an unexplained `-vN` suffix. |
| It has no current semantic role after the refactor | Delete it, including its constants, readers, writers, test fixtures, documentation, and dead control branches. |
| It occurs only in old Run Bundle data or an archived OpenSpec record | Leave that historical object untouched and outside active runtime scope; do not add code that reads, converts, or supports it. |

An active source, state, record, protocol, mode, identity, idempotency key, CLI
fixture, or operational document cannot be left as an unexplained exception.
It must satisfy one of the first three rows.

## Decision Procedure

1. Reconstruct the complete active-use inventory from source, tests, and
   maintained operational documents. Do not use a Run Bundle as a fixture or
   infer an exception from production data.
2. Ask whether each value has a semantic contract. If it does, establish its
   unversioned canonical definition in `schema/` before selecting a code name.
3. Make the clean-cutover decision explicit in the OpenSpec proposal, design,
   delta specs, tasks, and verification plan. A previous implementation or plan
   is evidence of where work is needed, never authority to retain compatibility.
4. Replace all active writers and all active readers together. There is no
   legacy read path and no mixed-format interval.
5. Remove the obsolete implementation and all active references. A rejection
   of historical input is not a compatibility reader: it may identify that the
   input is unsupported, but it must not parse, transform, validate, or resume
   it.
6. Prove the result with an explicit lexical sweep and owner tests. The sweep
   must cover active Harness source, tests, and maintained workflow/playbook
   documents, and must report every version-suffixed production literal or
   undeclared durable contract.

## Evidence And Boundaries

Success is not “the new name is also accepted.” Success is that the active
Harness has exactly one declared contract and no historical path can be chosen
by source, state, record, protocol, mode, identity, or provider action.

The recovery route does not authorize reading, rewriting, or deleting a
`deck_*` Run Bundle. Such data is not source code and must not be converted to
justify a compatibility path. Archived OpenSpec changes preserve the decision
history of completed work; they are not active implementation vocabulary.

When the inventory uncovers a required semantic distinction that the existing
schema cannot express, stop the implementation step and update the schema and
OpenSpec design first. Do not encode the distinction in another hidden string
literal.
