# workflow-inspection Specification

## Purpose
Define the read-only workflow-observation projection that gives MD Controllers and CLI observers one ordered, owner-issued next action for an exact run without reconstructing mode, gate, recovery, or completion policy.
## Requirements
### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it makes zero network/provider calls and shall not cache a verdict, heal state, migrate schema, or recover a journal. A repairable current direct fact is reported with its owning repair action. Mutation owners revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and never treat an earlier inspection as authorization or freshness proof. A non-v2, absent, or ambiguous protocol remains byte-preserving and produces one bounded owner-issued unsupported-protocol or identity action, not a compatibility projection.

Every controller-facing observation, including ppt_flow status and ordinary ppt_flow state projection, SHALL consume the same read-only inspection checkpoint or a direct read-only evaluator already used by that checkpoint. It SHALL NOT call a protocol receipt initializer, receipt writer, lifecycle operation, provider-facing adapter, or migration materializer merely to calculate a resume-card condition. An unavailable direct fact SHALL remain unavailable and produce the inspection owner's nearest legal action.

#### Scenario: Inspection observes a repairable current state without healing
- **WHEN** inspection encounters a schema-5 state shape the owner could safely repair
- **THEN** it reports the owner-provided action
- **AND** no state, history, or metadata file changes

#### Scenario: Inspection observes non-v2 input
- **WHEN** identity is non-v2, absent, or ambiguous
- **THEN** it returns the bounded unsupported-protocol or identity action without a workflow route
- **AND** it does not create, replace, or refresh a receipt

### Requirement: Inspection projects TARGET workflow prerequisites marker-first
Inspection SHALL remain observation-only and resolve a target run from the exact v2 source/state pair before projecting workflow status. For a valid target pair it SHALL report the selected `framed` or `pure` workflow, the direct receipt/evidence prerequisite, and one owner-issued nearest action. It SHALL NOT heal state, infer a workflow from artifacts, or calculate a second pass/fail authority from Markdown or a summary.

A partial, hybrid, mismatched, or non-v2 pair SHALL project the owning identity or unsupported-protocol hard-stop rather than either workflow. All selected-target controller/status observation SHALL use this marker-first projection without importing or invoking a non-v2 receipt-writing adapter. A v2 receipt is a direct target fact; its presence SHALL NOT cause any other receipt to be created, refreshed, or consulted as a substitute.

#### Scenario: Target Framed raw debt has one inspection action
- **WHEN** a valid target Framed source/state pair has no current accepted raw evidence
- **THEN** inspection reports workflow `framed` and the raw-plan/authorization prerequisite from its owner
- **AND** it does not suggest a Pure path or a per-slide authority repair

#### Scenario: Non-v2 pair is observed without coercion
- **WHEN** a non-v2 source/state pair is read by status or ordinary state observation
- **THEN** inspection returns the bounded unsupported-protocol action without mutation
- **AND** it does not classify the run as a current workflow or compatibility work

### Requirement: Inspection projects progressive raw lifecycle from direct records

For an exact current Page Authority run, Workflow Inspection SHALL remain
read-only and ask the raw owner for the current full-plan lifecycle
projection. After validating the existing identity/workflow and Style Master
prerequisites, it SHALL return one ordered current action: provider-free Framed
local-rebind refresh when its existing validator accepts; full-plan creation or
rebuild; Pilot scope planning; exact batch authorization; one-item generation;
unresolved-submitted reconciliation; partial Pilot evidence/decision; Expansion
planning/authorization/generation; complete raw review/decision; or the existing
final/delivery action. The result may include bounded derived
progress and evidence references but SHALL not write a head, grant, attempt,
state, receipt, or generated artifact and SHALL not initialize a provider.

Inspection SHALL fail closed when a direct plan, batch, grant, attempt,
materialization, provenance, or evidence fact is absent, malformed, stale, or
cross-bound. Its primary result SHALL name the earliest independent protected
invariant and one owning repair-and-rerun or reconciliation action; it SHALL
not calculate a second lifecycle from files, Markdown, cached status, or
conversation context.

Before a source/profile-drifted lifecycle may create a successor full plan,
inspection SHALL check its direct current-head attempts for any unresolved
`submitted` outcome. Such an attempt takes precedence over replan/authorization
and returns only its exact reconciliation action. The reconciliation result may
terminalize historical fact but shall not by itself restore currentness, issue a
batch/grant, or turn historical bytes into current evidence.

Before returning the Framed local-rebind refresh action, inspection SHALL first
apply the same unresolved-submitted precedence and then obtain the existing
local-rebind validator's direct result. It SHALL not infer the path from a
title, task card, or generated artifact.

#### Scenario: Partial Pilot exposes only Expansion planning

- **WHEN** inspection finds a current partial Pilot proceed decision and current remaining paid debt
- **THEN** it returns the exact Expansion planning action and bounded remaining-scope projection
- **AND** it does not report finalization, accepted raw evidence, or a provider submit as ready

#### Scenario: Framed local rebind remains the one provider-free action

- **WHEN** a current v3 Framed Text Frame-only change has no unresolved submitted attempt and passes the existing local-rebind validator
- **THEN** inspection returns the existing local-rebind refresh action before progressive raw planning
- **AND** it does not return Pilot, Expansion, authorization, provider generation, or another complete raw-review action

#### Scenario: Full-debt and zero-debt branches avoid synthetic Pilot

- **WHEN** inspection finds either zero paid debt or a completed one-through-five-item paid scope that exhausted debt
- **THEN** it returns the complete raw-review action when coverage is current
- **AND** it does not return Pilot review, Pilot decision, or Expansion authorization

#### Scenario: Unresolved submitted outcome is a recovery hard-stop

- **WHEN** inspection finds a `submitted` item attempt without a terminal outcome
- **THEN** it returns the exact raw-owner reconciliation hard-stop before later batch actions
- **AND** it does not infer failure, retry, grant consumption, or materialization from files

#### Scenario: Terminal unknown returns to owner-derived planning

- **WHEN** reconciliation has terminalized an item as `unknown` and the prior batch otherwise meets its terminal predecessor rules
- **THEN** inspection returns the owner-derived successor planning action for later paid work
- **AND** it does not return reconciliation again, reopen the old grant, or report historical bytes as current evidence

#### Scenario: Drift does not bypass unresolved provider cost

- **WHEN** source or profile facts drift while the current head has a submitted attempt without a terminal outcome
- **THEN** inspection returns that attempt's reconciliation action before full-plan rebuild or batch authorization
- **AND** it does not treat a stale plan as permission to bypass, replace, or forget the paid attempt
