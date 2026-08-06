## MODIFIED Requirements

### Requirement: Progressive Controller task projection is a rebuildable collaboration card

For an exact active progressive Page Authority `create-deck` Controller route,
the Controller SHALL publish the run-scoped
`_state/page-production-task-projection.md` card from owner-issued inspection
and normal typed Controller handoffs. The card SHALL contain only current plan,
batch, evidence, review, manifest, and delivery references, bounded derived
progress, the owner-issued next action, and the corresponding typed human
decision plus its optional persisted note. It SHALL be regenerated on Controller
route entry/resume and after a Controller decision changes its referenced
collaboration context.

The card SHALL render every present structured owner and typed-handoff digest
as a typed, card-scoped display reference rather than a complete SHA-256
digest. A display reference SHALL have the base form `<prefix>-<digest8>`,
where `<digest8>` is exactly eight lowercase hexadecimal characters and
`<prefix>` is `p`, `b`, `e`, `r`, `m`, or `d` for plan, batch, evidence, review,
manifest, or delivery, respectively. When two distinct current facts of the
same type share `<digest8>`, both display references SHALL append
`~<rank>`, where `<rank>` is the positive decimal, one-based lexical rank of
the complete digest within that collision group; a non-colliding reference
SHALL not have a rank suffix. A display reference SHALL never contain a
complete digest. The card text, including HTML comments
and rendered handoff notes, SHALL NOT contain a complete 64-character
hexadecimal digest. Rendering a note SHALL replace each bounded,
case-insensitive 64-character hexadecimal token with `[digest redacted]` in
the card only and SHALL NOT change the persisted Controller decision or note.
A display reference SHALL not be a selector, durable identity, or an input to a
Controller, CLI, owner, or provider operation.

The Controller SHALL treat this card as a collaboration view only. It SHALL
not use a checked line, prose, generated filename, feedback text, or stale
reference in the card to authorize a cost, resume generation, prove
materialization, infer a decision, or choose a node; every such action SHALL
re-read workflow inspection and owning direct records. A route without the
exact active progressive Controller identity is not eligible to write the card.

#### Scenario: Missing card is rebuilt without production work

- **WHEN** an exact active progressive Controller route resumes and its task
  projection is absent or stale
- **THEN** the Controller rebuilds the card from current inspection and typed
  handoffs
- **AND** it does not initialize a provider, recreate a grant or attempt, or
  infer raw progress from the former card

#### Scenario: Card renders typed references without changing owner identity

- **WHEN** an eligible progressive route has current complete-digest owner and
  typed-handoff facts and a normal state observation rebuilds its card
- **THEN** the card shows distinct typed display references for every present
  plan, batch, evidence, review, manifest, delivery, and typed-handoff fact
  without showing a complete digest
- **AND** the full-fact projection payload retains the original complete owner
  and handoff digests

#### Scenario: Same-type display collision remains bounded and deterministic

- **WHEN** two distinct current facts of one display type share the same
  initial eight digest characters
- **THEN** the card gives them distinct deterministic display references for
  that card scope
- **AND** neither reference exposes a complete digest or becomes a selector

#### Scenario: Rendered note cannot leak a complete digest

- **WHEN** a typed Controller handoff note contains a bounded,
  case-insensitive 64-character hexadecimal token
- **THEN** the card replaces that token with `[digest redacted]` in its rendered
  presentation
- **AND** the persisted handoff record retains its original note and remains
  the only source for the decision context

#### Scenario: Card edits cannot advance a progressive checkpoint

- **WHEN** a task projection contains a changed checkbox, prose feedback, or an obsolete batch reference
- **THEN** the Controller refreshes its owner-issued route before selecting a checkpoint
- **AND** it does not treat the card change as authorization, a persisted decision, or materialization evidence

#### Scenario: Ineligible observation does not write a card

- **WHEN** an observation resolves a non-progressive controller, mismatched
  Controller identity, or unsupported workflow
- **THEN** it reports the owner-issued observation/action without a card write
- **AND** it does not create a replacement state, projection, or recovery route
