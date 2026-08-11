## Context

See [proposal.md](proposal.md) for the motivation. C1 is deliberately the first
and non-executable part of the Page Image recovery route: it publishes the
vocabulary before C2 aligns implementation constants, validation, and author
messages. Existing identifiers include both mutable implementation names and
historical evidence that cannot be renamed without invalidating records.

The directory capability already owns the Harness soft-bundle map. The new
definition home belongs there, not in a Run Bundle, a script module, or an
OpenSpec capability of its own.

The target vocabulary intentionally includes C3-C5 artifacts that do not yet
have an implementation. C1 must make their data relationship visible without
pre-selecting the module paths that their later changes will design.

## Goals / Non-Goals

**Goals:**

- Publish one complete, readable source-to-delivery vocabulary that a human,
  an Agent, and later deterministic code can use without code archaeology.
- Make data ownership, provenance, and invalidation visible before new upstream
  or layout behavior is built.
- Record immutable historical names with their precise preservation reason.
- Make author-term Repair Guidance part of each constrained-field definition.

**Non-Goals:**

- Changing `.mjs` files, CLI behavior, state, records, provider requests, or
  existing user-facing diagnostics.
- Renaming constants, enforcing schema-to-code drift, or routing Repair
  Guidance through a runtime handoff. Those are C2.
- Implementing Story Outline, Design Constraint Set, pagination, Page Class,
  layout resolution, or derived artifact publication. Those are C3-C5.
- Reading, migrating, or using any `deck_*` or `dpt_*` data as a fixture.

## Decisions

### One top-level schema definition home

`ppt_maker_harness/schema/` contains only non-executable Markdown and YAML:

```text
schema/
  README.md
  META.yaml
  flow.yaml
  frozen-identifiers.yaml
  stages/
    <one YAML definition for each conceptual schema>
```

The directory is inside the Harness because it describes reusable production
methodology rather than one Deck's data. `README.md` makes the ownership
boundary explicit: YAML owns the conceptual vocabulary, current code is an
implementation inventory until C2 annotates its mirrors, and neither source
nor record data in a Run Bundle is rewritten.

Alternative considered: define schemas beside the owning `.mjs` modules. It
was rejected because it repeats the present code-archeology problem and cannot
show the complete flow in one place.

### One file per conceptual schema, with a declarative meta-shape

`META.yaml` defines the common shape for the nineteen definition files:

- identity and data kind (`source`, `derived`, or `record`);
- scope, purpose, and the question the artifact answers;
- ownership, inputs, outputs, and provenance obligations;
- fields and their deterministic rules;
- an explicit `does_not_contain` boundary where a nearby artifact is commonly
  confused with it.

A field is constrained when it declares a `rule`. Every constrained field must
carry `on_violation.means`, `on_violation.ask`, and `on_violation.never`. A
field that normalizes when omitted declares `default`; it is not described as
an author failure. The field rule is structured for future JS use, while the
three guidance strings remain author-facing language. C1 records them but does
not route them through a runtime diagnostic.

Alternative considered: a single giant YAML document. It was rejected because
field-level review and targeted later edits would become difficult, and the
owner specifically needs to be able to correct one stage at a time.

### Flow documents transformations, not a second lifecycle controller

`flow.yaml` lists the logical transformations from deck-level source through
per-page derivation, production records, final selection, and delivery. Every
entry has `inputs`, `output`, `owner`, `producer_status`, and `invalidated_by`.
For a current artifact, `owner` names the real owning module. For an
unimplemented C3-C5 artifact, it names the planned owning change or capability
and `producer_status` is `planned`; C1 does not invent a module path. The file
expresses provenance and rebuild impact only; it does not create a controller,
state machine, gate, or an execution order separate from the existing
playbooks.

The flow includes future schemas that C3-C5 will implement so that the data
model is complete before the implementation exists. Their definitions mark
their current producer status rather than pretending they already materialize.

Alternative considered: derive the flow automatically from imports. It was
rejected because imports cannot express human-owned source data, semantic
invalidation, or planned upstream stages.

### Frozen identifiers preserve evidence without creating a second schema generation

`frozen-identifiers.yaml` contains two explicit kinds:

1. historical record-schema identifiers, readable forever but not a vocabulary
   for newly written records; and
2. live protocol, mode, and identity literals, still written but frozen against
   renaming because exact identity bindings depend on them.

Every entry includes the specific evidence or binding it protects. The schema
definition vocabulary itself has no new `-vN` suffix. This avoids both a silent
history migration and a parallel versioning system.

The C1 file enumerates the fifteen known persisted record-schema identifiers
and three live literals selected by the route. It is not a claim that those are
the only schema-shaped strings in current code: C2 owns the complete source
inventory and maps the remaining implementation details to a conceptual stage
or another explicit treatment.

Alternative considered: rename all existing identifiers as soon as the YAML
exists. It was rejected because paid provider evidence and idempotency keys
would become unreadable; the planned C2 inventory instead classifies every
implementation identifier before any code change.

### Verification remains static and scoped to C1

This change adds no executable Harness module. Its validation is a documented,
repeatable local YAML inspection using the existing Node `yaml` dependency. The
command reads only `schema/stages/*.yaml`, rejects any missing or extra name
against the exact nineteen-name set, recursively finds every mapping with a
`rule`, and rejects a missing, non-mapping, or empty-string `means`/`ask`/`never`
member in its `on_violation` block. It also reports every field that declares a
`default` for manual review against the normalizing semantics in `META.yaml`.
The command will live in `schema/README.md` and is run as C1 evidence.

`git diff --check`, `openspec validate`, and the documented `npm test` core
baseline are required checks. Root `README.md` declares that core baseline for
every normal Harness change. Focused, sweep, mock E2E, and real E2E checks are
not selected for C1 because it introduces no runtime behavior, public journey,
or provider interaction.

Apart from the scope conflict below, unit, integration, and E2E suites are not
changed: C1 adds no runtime behavior or public interface. C2 owns the durable
regression test that checks code-to-YAML drift and author-facing output.

### Control-policy boundary

Repair Guidance is not a new validation or control path in C1. It is authored
alongside a future validation rule so C2 can project it through the existing
owner. Therefore this change creates no `guide`, `confirm`, or `hard-stop`
outcome, no confirmation record, and no recovery route. The policy references
in `human-centered-gates.md`, `agent-assistance-and-control.md`, and
`simple-reliable-control.md` constrain C2's eventual routing but do not justify
adding a parallel evaluator or gate now.

## Risks / Trade-offs

- [YAML and implementation can drift before C2] -> C1 makes the vocabulary
  inspectable and C2 is explicitly scoped to add the code-anchor/drift test;
  C1 does not falsely claim runtime enforcement.
- [A definition can become overly detailed before its producer exists] -> C1
  distinguishes conceptual contract from current producer status and defers
  behavior to C3-C5.
- [A future maintainer may mistake a `-v1` suffix for an easy rename] -> every
  frozen entry records its kind and the exact protected evidence.
- [Guidance can be technically correct but unhelpful] -> every constrained
  field carries its author-term `means`, `ask`, and `never` at definition time.

## Migration Plan

1. Add the schema definition home and directory-layout requirement without
   modifying executable production source or Run Bundle data, after resolving
   the scope question below.
2. Run the documented static schema integrity check, OpenSpec validation, and
   a diff audit for `.mjs` files.
3. Obtain Checkpoint 1 review of `flow.yaml` and all nineteen definitions.
4. Only after approval, start C2 to map existing implementation identifiers and
   make code a tested mirror.

The change is additive and has no deployed data migration. Before C2 consumes
the definition home, rollback is removal of this new directory and its accepted
spec change; no record, state, provider evidence, or Deck source needs repair.

## Open Question

The fixed target path creates a direct scope conflict that C1 cannot resolve
unilaterally. `tests/00-setup/test_html_fonts.mjs` asserts the exact current
top-level Harness directory set and will fail as soon as `schema/` exists.
The route document simultaneously confines C1 to `ppt_maker_harness/schema/`
and requires that its diff touch no `.mjs` file.

The owner must choose one of these scope decisions before apply:

1. Permit one no-runtime compatibility adjustment to the exact test assertion,
   together with the `ppt_maker_harness/README.md` source-directory map, while
   retaining the prohibition on production `.mjs` changes. This is the
   recommended path because it preserves the selected `schema/` home and a
   passing repository test suite.
2. Preserve the literal schema-only/no-`.mjs` boundary and choose a different
   location for the definition home. This changes the established C1 directory
   decision and must be reflected in the route before implementation.

Deferring the assertion repair to C2 is not a safe option: C1 would land with a
known failing existing test, and C2 is intentionally a separate reviewable
change.
