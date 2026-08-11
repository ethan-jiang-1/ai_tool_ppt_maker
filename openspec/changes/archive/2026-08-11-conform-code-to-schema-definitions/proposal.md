## Why

C1 made the Page Image data-flow vocabulary visible, but active Harness source
still serializes hundreds of historical `*-vN` literals. They appear in record
schemas, receipts, source and state markers, modes, identity schemes,
idempotency keys, run-bundle locators, templates, tests, and operating
documents. The former C2 proposal treated those values as frozen evidence to
preserve. That conflicts with the owner's clean-cutover decision: the future
Harness has one current contract, not a compatibility layer around historical
contracts.

This change makes schema-first real. Every active durable contract becomes
unversioned and explicitly defined under `ppt_maker_harness/schema/`; values
that are not durable contracts move to one named implementation owner or are
deleted. Old values are not read, migrated, converted, or retained as hidden
exceptions.

## What Changes

- Extend the schema definition home with one authoritative serialization
  contract inventory. It declares the current unversioned contract selectors,
  shared Harness contracts, and record roles while reusing C1's nineteen stage
  definitions as the Page Image conceptual vocabulary.
- Replace every active Page Image and directly affected shared `*-vN` schema,
  protocol, mode, identity, idempotency, and locator literal in source, tests,
  templates, playbooks, and accepted specifications. A Page Image record's
  `schema` identifies its C1 conceptual stage; when that stage has multiple
  concrete record shapes, an unversioned `artifact_role` identifies the shape.
- Delete `frozen-identifiers.yaml`, its preservation policy, legacy scanners,
  compatibility-only validation branches, historical fixtures, and retired
  documentation. New and existing active readers and writers use only the
  current contract together.
- Add deterministic schema-to-code conformance coverage. A dependency-safe
  pure evaluator remains in the protected development-verification core; a
  separate opt-in test parses the YAML inventory and scans the complete active
  Harness source, tests, operational documents, and accepted specifications.
  It rejects version-suffixed production literals, undeclared durable values,
  stale anchors, or a reader/writer outside the one current contract.
- Keep C3-C5 fields declarative until their named producer exists. C2 does not
  implement Page Class, modify provider semantics, or create a second runtime
  controller.

## Capabilities

### New Capabilities

- `production-schema-conformance`: owns the one-current-contract grammar,
  inventory, static conformance evaluator, and clean-cutover evidence boundary.

### Modified Capabilities

- `bootstrap-env-guidance`
- `cli-surface`
- `commands-reference`
- `content-parsing`
- `harness-charter`
- `harness-directory-layout`
- `image-generation`
- `image-production`
- `node-specification`
- `notes-injection`
- `pipeline-orchestration`
- `playbook-execution`
- `pptx-assembly`
- `run-bundle-layout`
- `run-bundle-management`
- `slide-identity-and-ordering`
- `style-master-generation`
- `workflow-inspection`

## Impact

- **Harness source and documents:** active `ppt_maker_harness/` runtime,
  templates, workflow guidance, playbooks, and reference material are refactored
  to one declared contract. Obsolete scanners and old-format test fixtures are
  removed rather than maintained.
- **Tests and specs:** `tests/`, `tests_e2e/`, and every affected accepted
  specification stop asserting the old values. The protected core remains free
  of a transitive `yaml` import.
- **Run Bundles:** none are read, written, migrated, inspected as fixtures, or
  deleted. A bundle carrying an old value is outside this current contract and
  cannot select an active path; C2 adds no decoder or compatibility action for
  it.
- **Provider and CLI behavior:** no new command, provider request field, or
  parallel state store. Existing commands use the renamed current values and
  reject any unknown contract through their normal typed validation before
  mutation or provider work.
- **Decision authority:** this implements
  [_backlog/plans/schema-first-clean-cutover-decisions.md](../../../_backlog/plans/schema-first-clean-cutover-decisions.md).
  Historical implementation is discovery evidence only, never a reason to
  retain compatibility.
