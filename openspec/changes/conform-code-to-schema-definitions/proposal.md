## Why

C1 made the Page Image vocabulary readable and regression-tested as YAML, but
runtime constants, protected identifiers, and author-facing repair wording can
still drift from it. C2 establishes one durable conformance boundary before C3
through C5 introduce new source, layout, and derived-data behavior.

## What Changes

- Add a `production-schema-conformance` capability that makes
  `ppt_maker_harness/schema/` the conceptual-vocabulary authority for Page
  Image code mirrors, without treating YAML as a second runtime controller.
- Re-derive and classify every current schema-shaped implementation identifier
  as a conceptual-stage mirror, a frozen identifier, or an explicitly
  non-schema implementation detail before renaming any non-frozen mirror.
- Add deterministic code-to-YAML conformance coverage, including anchors for
  mapped code surfaces and focused negative cases for deliberate drift. The
  check will reject a missing authority mapping or an attempted frozen-name
  rename while preserving historical records byte-for-byte.
- Apply C1's declared defaults and Deck Author Repair Guidance only where a
  materialized current owner already has the relevant validation and
  `next_action`/diagnostic-recovery handoff. Planned C3-C5 stages remain
  declarative until their named producer exists; C2 introduces no second
  message channel, lifecycle controller, gate outcome, durable state, record,
  provider action, or CLI envelope schema.
- Preserve the existing `page-image-workflow-v1`, `image2-page-workflow-v1`,
  `mnemonic-v1`, and historical record-schema literals exactly where C1 marks
  them frozen. This is a semantic-preserving conformance change, not a record
  migration or protocol replacement.

The control path remains direct: JS reads the existing owning source of record
and applies one deterministic conformance check; an identity, integrity, or
preservation failure short-circuits dependent work as the existing hard-stop,
while author-facing content repair remains a producer-owned nearest action.
This follows `openspec/policies/human-centered-gates.md`,
`openspec/policies/agent-assistance-and-control.md`, and
`openspec/policies/simple-reliable-control.md`: reuse the current evaluator and
handoff, expose one nearest legal action, and add neither a duplicate validator
nor a persistent success/recovery projection.

## Capabilities

### New Capabilities

- `production-schema-conformance`: owns the stable contract between the C1
  conceptual YAML vocabulary, its implementation mirrors, frozen-identifier
  preservation, and author-term repair projections through existing owners.

### Modified Capabilities

- None.

## Impact

- Affected Harness source: C2 will inspect and selectively align Page Image
  constants and validation/handoff call sites under `ppt_maker_harness/`; it
  will add focused contracts and owner registrations under `tests/`. No Run
  Bundle is read, migrated, or used as a fixture during this planning change.
- Control owner: JS/CLI continues to evaluate deterministic schema, identity,
  and preservation facts through existing owners. The MD Controller/Agent
  consumes the existing bounded handoff in Deck Author terms; no new authority
  or confirmation route is introduced.
- Run-bundle contract impact: `none`. Historical records remain readable and
  byte-preserved; current source/state/record formats and provider requests are
  not migrated by C2.
- Dependencies and public APIs: no new dependency or CLI/state schema. The
  existing `yaml` dependency and producer-owned diagnostic envelope are reused.
