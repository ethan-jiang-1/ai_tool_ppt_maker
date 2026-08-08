## Context

See [proposal.md](proposal.md) for the motivation. The selected-workflow
adapters already provide a provider-free canonical candidate source, while the
shared Style Master scope resolver requires a current materialized source/state
pair. After visual/source drift, that pair is deliberately stale; the raw owner
therefore blocks on Style Master readiness, but the Style Master owner cannot
publish its successor plan. This is one stale-fact evaluation being used for
two different purposes: preserving raw lineage and planning a replacement
Style Master.

The existing Style Master lifecycle is append-mostly and CAS-protected. Its
direct records are sufficient to distinguish a terminal historical plan from a
new candidate plan. Page Image source epochs, raw records, authorizations, and
evidence have their own owners and must remain untouched during recovery.

The recovery admission fact is deliberately narrow: the current source/state
evaluator must report source identity or source-receipt drift, and the adapter
must validate the new canonical candidate. State initialization, corruption,
workflow mismatch, unsupported lineage, and uncertainty remain their existing
hard-stops.

## Goals / Non-Goals

**Goals:**

- Let the existing Style Master owner plan a successor from a current,
  read-only selected-workflow candidate after explicitly classified stale
  visual/source binding.
- Keep the recovery path deterministic: one source-of-record evaluation, one
  owner-issued next action, then the same checkpoint can run again.
- Preserve the current authorization and evidence boundaries while removing the
  inspect-to-inspect dead end.

**Non-Goals:**

- No new workflow, controller, state field, provider endpoint, migration, or
  automatic retry.
- No promotion of a historical Style Master, implicit raw rebuild, or reuse of
  prior grants, attempts, review decisions, or media.
- No expansion of the work to alter deck content or generated artifacts.

## Decisions

### Reuse the selected-workflow candidate as the recovery fact

The selected workflow adapter remains the sole owner of parsing and validating
its current candidate source. The shared scope resolver will distinguish a
valid current candidate from a current materialized source/state pair, allowing
the former only to create a Style Master replacement plan. The `pure` adapter
continues to establish its deck visual-system prerequisite before requesting
the shared scope; Framed retains its adapter-owned candidate validation.

This removes the duplicate stale-state barrier without weakening raw lineage:
raw planning still uses the existing materializing source path and cannot
advance until a new Style Master selection is accepted. An alternative of
materializing a new source epoch before Style Master planning was rejected
because it mutates the raw owner's state before the visual prerequisite exists.
An alternative generic `--force` route was rejected because it would turn an
identity boundary into caller intent.

### Keep successor planning inside the existing immutable lifecycle

`style_master_plan` and `style_master_store` remain the writer and reader of
Style Master plans and head generations. The recovery plan is an ordinary
provider-free successor with an immutable predecessor, not a new recovery
record. Existing terminal-plan, CAS, exact grant, and attempt rules continue to
apply, and a historical selection remains audit-only until a replacement is
reviewed and promoted.

Existing canonical `style_master.jpg` input remains eligible only through the
ordinary confined local-candidate validator. It is snapshotted with new plan
provenance rather than inherited from historical candidate evidence; this
permits a zero-generated-candidate recovery without treating the old selection
as current or spending a new provider slot.

This avoids a second status head or a recovery ledger. A separate state flag
was rejected because the current candidate, lifecycle head, and immutable
history already reconstruct the condition on every invocation.

### Route raw readiness through the Style Master owner before mutation

The Page Image raw owner remains responsible for source epochs and raw work.
When it observes a stale selected Style Master with a valid replacement
candidate, it returns the Style Master planning route before invoking any path
that materializes a source receipt or raw plan. The shared owner validates the
same fact used by `style-master inspect` and `style-master plan`, so repairing
by planning and selecting the replacement lets the original raw checkpoint
continue normally.

This is a `guide`: planning is local, deterministic, and provider-free. Source
identity, immutable lifecycle history, raw authorization, uncertain
submissions, and provider work remain hard-stops. No confirmation or waiver is
introduced.

### Project the same recovery through the direct CLI owner surface

`ppt_flow` remains a projection and does not interpret prose or invent a
controller route. Because recovery is a provider-free `guide`, direct
`style-master inspect` returns the owner's ordinary success projection and
`style-master plan` accepts the same recovery scope. Raw-plan hard failures
continue to use the registered diagnostic producer and can name only that
Style Master recovery. Neither surface can claim that the plan, selection,
authorization, or raw evidence already exists.

An `inspect`-only recommendation was rejected because it is not a legal
forward action in this state. A generic internal error was rejected because it
hides a deterministic condition and forces the Agent to reverse-engineer the
owners.

## Risks / Trade-offs

- A recovery branch could accidentally accept arbitrary stale candidates ->
  Reuse the adapter's current candidate validator, exact run/version/workflow
  tuple checks, byte digest revalidation, and the current evaluator's explicit
  source-drift result; preserve all other state and unsupported-lineage
  hard-stops.
- A successor could inherit paid or accepted authority -> Keep predecessor
  linkage audit-only and assert that grants, attempts, decisions, and
  selections are never reused as current; revalidate any canonical local
  candidate as a fresh immutable snapshot.
- Raw planning could mutate before it reports the route -> Add focused tests
  that snapshot state and raw records before the recovery result.
- CLI could translate a guide into an error or a second recovery scheme -> Test
  successful `style-master inspect` and `plan` output plus the bounded raw-plan
  diagnostic, rather than a prose message.

## Migration Plan

No data migration is needed. Existing historical Style Master records already
remain immutable and will be read as prior lifecycle facts. Deploy as a
backwards-compatible patch: update the resolver and owner handoff, run focused
tests, then regression suites. Rollback removes only the recovery branch;
existing records and their audit meaning remain valid, though affected stale
runs return the prior bounded hard-stop again.

## Verification Strategy

Unit coverage will exercise shared scope resolution and the Style Master
lifecycle with a stale visual/source binding plus a valid current candidate.
Integration coverage will exercise Pure and Framed raw-plan handoff, asserting
that it returns replacement planning and leaves state, source epoch, raw
records, grants, attempts, and provider submissions unchanged. CLI coverage
will invoke `style-master inspect` and `style-master plan` on the same fixture
and assert the registered envelope contains the one forward action.

No real E2E or provider test is required: the new route is deliberately
provider-free, and the relevant boundary is verified by the absence of a
provider invocation. Existing mock-based selected-workflow tests remain the
representative end-to-end harness coverage.
