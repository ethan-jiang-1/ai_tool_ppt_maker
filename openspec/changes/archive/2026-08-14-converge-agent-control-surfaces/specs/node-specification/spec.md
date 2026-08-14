## MODIFIED Requirements

### Requirement: Controller state binds one current Page Image Workflow lineage

For production work, Node and State SHALL bind one exact schema-declared
`page-image-workflow` source and one state-owned
`production_identity.by_version` record for the exact version. That record
SHALL contain exactly `{ workflow: framed|pure, source_epoch: positive integer
}` and SHALL agree with the source-owned `production.workflow`. The Controller
may project lifecycle facts but SHALL not duplicate provider input, review
authority, or final acceptance as a second evaluator. An undeclared selector,
missing identity record, malformed identity record, or source/state disagreement
fails through the current owner before state repair, provider work, or a
lifecycle transition; the Controller SHALL not classify it as a retained
historical lineage.

#### Scenario: Controller observes one current lineage

- **WHEN** a current source/state pair and receipt are bound for production
- **THEN** Node/State records one declared workflow lineage and its owner facts
- **AND** no fixed mode literal or historical selector can route the Controller

#### Scenario: State does not invent a per-slide policy

- **WHEN** Controller state observes a current version-level workflow
- **THEN** it preserves the selected workflow and source epoch as version-level
  identity facts
- **AND** it does not derive a per-slide or alternate protocol policy

### Requirement: State atomically activates a clean current target authoring draft

After an exact `new-version` or structural publication creates a clean target
with an explicit current `framed` or `pure` source selection, the State owner
SHALL atomically create one `create-deck` execution bound to that exact target
version and its controller-manifest-validated selected-workflow draft-route
node. Its continuation target, when recorded, SHALL identify that same target.
An explicit completed or inactive source is eligible when its current source
selection and durable facts agree; the caller-supplied source version remains
the only source identity.

Activation may retain the target's copied canonical source selection, but it
SHALL NOT materialize a target source receipt or production-identity record, or
create Style Master acceptance, raw plan/authorization/evidence, Complete Page
Review, final manifest, assembly, notes, delivery, provider grant, or provider
attempt. It SHALL preserve source-version records as source facts and shall not
infer a continuation, receipt, or acceptance from them. A malformed current
selection, target conflict, or active execution for another version SHALL
hard-stop before State mutation or provider work.

#### Scenario: A clean target receives its own current draft execution

- **WHEN** an exact current Framed source is copied into a clean target
- **THEN** the target receives a `create-deck` execution for its Framed draft
  route and no materialized page-production lineage
- **AND** the source execution and its receipt/evidence remain unchanged

#### Scenario: Target activation fails before a competing continuation is written

- **WHEN** target cleanliness or an active execution binding is inconsistent
- **THEN** State returns the owning repair action before writing a target
  execution or continuation pointer
- **AND** it does not reinterpret source evidence as target evidence or invoke
  a provider

## ADDED Requirements

### Requirement: Controller metadata is a closed declared grammar

Every active Controller, shared node, and fenced node declaration SHALL use
only its declared current metadata keys. Controller frontmatter SHALL contain
only `playbook`, `description`, `supported_pipelines`, and `includes`; shared-node
frontmatter SHALL additionally contain one node declaration and `shared: true`;
fenced node declarations SHALL contain only current node keys. `method_module`
is the sole lifecycle-location key. `production_modes`,
`supported_production_modes`, `phase`, `lifecycle_phase`, misspellings,
duplicate YAML keys, and undeclared metadata SHALL fail before Controller index,
draft-route, or handoff output.

#### Scenario: A stale Controller field is rejected at its source

- **WHEN** a checked-in Controller declaration contains a retired, misspelled,
  or undeclared metadata key
- **THEN** canonical parsing returns a bounded declaration error before it
  indexes the Controller or derives a route
- **AND** it does not ignore, normalize, or preserve the field as a fallback

#### Scenario: A valid declaration has one lifecycle location

- **WHEN** a checked-in Controller or node uses only its allowed metadata keys
  and one valid `method_module`
- **THEN** canonical parsing accepts the declaration subject to its existing
  dependency, workflow, and manifest checks
- **AND** it does not derive a second lifecycle phase or production mode

### Requirement: State identity is a minimal state-owned invalidation fence

State SHALL create and update `production_identity.by_version` only through
the State owner after it has read the exact current source marker. The source
owns the pipeline and selected workflow; State owns the matching workflow
agreement and `source_epoch` used to invalidate state-owned lifecycle evidence
after source replacement. The record's writers are current State transitions;
its readers are current inspection, Controller eligibility, and direct CLI
projections. Observation SHALL not write or infer one.

#### Scenario: Source replacement advances the state fence

- **WHEN** a current State transition accepts a replacement source for one
  exact version and workflow
- **THEN** it updates that version's identity record through the State owner and
  invalidates only the affected state-owned lifecycle evidence
- **AND** it does not create a second workflow, mode, compatibility record, or
  provider action

#### Scenario: Observation preserves an invalid identity record

- **WHEN** observation finds a malformed or source-disagreeing identity record
- **THEN** it returns the existing owner-issued hard-stop without modifying
  source, state, receipt, or generated bytes
- **AND** it does not synthesize a current record from an old mode field
