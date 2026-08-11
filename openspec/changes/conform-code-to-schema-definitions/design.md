## Context

C1 deliberately defined the Page Image concepts but left runtime code unchanged.
That exposed a mismatch: C1's unversioned stage names coexist with active
serialized values such as `page-image-workflow-v1`. The old C2 plan attempted
to preserve the values through `frozen-identifiers.yaml` and compatibility
tests. The owner has rejected that premise. There is one future contract, and
correctness has priority over reuse of old records or readers.

The verified active-use scan covers `ppt_maker_harness/`, `tests/`,
`tests_e2e/`, and accepted specs. It finds version-suffixed Page Image and
shared-Harness identifiers in current writers, readers, templates, control
documents, and tests. The scope is not confined to a subset of constants.
No `deck_*` or `dpt_*` path is read: those are production data, not source or
test fixtures.

## Goals / Non-Goals

**Goals:**

- Establish one explicit, unversioned serialization grammar under
  `ppt_maker_harness/schema/` for all active values in scope.
- Replace active readers and writers as a single cutover, remove legacy-only
  code, and leave no `*-vN` production vocabulary in active source, tests, or
  maintained operational documents.
- Preserve C1's conceptual stage definitions and make every durable contract
  traceable to either a stage or a named shared contract declaration.
- Prove complete cleanup with both owner tests and a bounded lexical scan.

**Non-Goals:**

- Reading, validating, migrating, exporting, adopting, or rewriting historical
  Run Bundle bytes.
- A legacy reader, converter, dual-format record, frozen exception list, or
  transitional mixed-format deployment.
- Implementing C3-C5 planned producers, including Page Class validation or its
  `standard` default.
- Changing provider request meaning, author approval rules, or CLI envelope
  structure except where the current contract literal itself is serialized.

## Decisions

### One schema home owns every active durable contract

C2 adds `ppt_maker_harness/schema/serialization-contracts.yaml` and removes
`frozen-identifiers.yaml`. The new file is descriptive authority, not a runtime
controller. It contains:

- the identifier grammar: lowercase hyphenated names with no version suffix;
- the current Page Image selectors: pipeline, production mode, and identity
  scheme;
- every C1 stage that may occur as a Page Image `schema` value;
- each allowed unversioned `artifact_role` for stages with multiple concrete
  records or projections;
- named shared-Harness contracts such as the run-bundle locator and intent-route
  catalog, plus their owning field and code anchors; and
- a complete source-location inventory for every active durable literal.

`schema` describes what a Page Image artifact is conceptually, and is therefore
one of C1's stage names. It does not encode a physical record shape or a
release number. `artifact_role` is present only when the stage has more than one
concrete shape. Existing `kind` fields retain their established business/action
semantics; C2 does not overload them as a record discriminator. A shared
Harness object outside the Page Image stage vocabulary uses its explicitly
declared contract field and named shared-contract entry rather than pretending
to be a Page Image stage.

The inventory is reviewable source data. It may point to an implementation-only
value, but that value must have a documented invariant and cannot look like an
undeclared serialization schema. No code literal creates a second vocabulary.

### Cut over readers and writers together

Current names are unversioned values declared in the inventory. All active
writers emit them, and all active readers accept only them. The canonical Page
Image selectors are `page-image-workflow`, `image2-page-workflow`, and
`mnemonic`; record and receipt `schema` values use C1 stage names. Idempotency
keys use the declared current protocol prefix and retain their existing digest
algorithm and equality checks.

There is no migration phase. A source, state, record, receipt, locator, or
provider-related input whose value is not the declared current one fails the
ordinary owning validator before a write, provider initialization, derived
artifact read, or lifecycle transition. It is not recognized as a particular
old protocol: C2 deletes byte scanners and special historical-format branches
that would parse old bytes merely to preserve or export them.

Rollback is a source revert before deployment. It does not restore a second
reader or mutate production data.

### Refactor all active documentation and evidence with the contract

Current templates, BOOTSTRAP/charter/workflow/playbook guidance, test fixtures,
and affected accepted specifications are contract consumers. They change in the
same C2 cutover. Historical values may remain only in archived OpenSpec change
artifacts and backlog decision history, which are explicitly excluded from the
active implementation scan and never selected by runtime code.

This distinction avoids both kinds of hidden history: active documentation
cannot teach obsolete values, while archival material can still explain why the
clean cutover was made without becoming a supported format.

### Extend the pure evaluator; do not add a runtime gate

`scripts/contracts/harness_architecture.mjs` gains an exported pure evaluator.
It accepts a plain snapshot of parsed schema declarations, anchors, literal
occurrences, and contract-field assignments. It reads no files and does not
import `yaml`. `tests/contracts/test_harness_architecture.mjs` proves the
evaluator with synthetic snapshots only, preserving the protected core closure.

A separate opt-in contracts test reads the YAML and builds the real snapshot.
It verifies declaration completeness, C1-stage/role compatibility, anchor
presence, absence of legacy-suffixed production tokens, and that no active
contract-bearing field uses an undeclared value. This is repository
verification, not a production startup check. Runtime owners keep their
existing deterministic validators and hard-stop behavior.

### Planned C3-C5 definitions remain declarative

The inventory can cite a C1 stage with `producer_status: planned`, but it may
not manufacture an implementation projection merely to exercise it. In
particular, C2 adds no Page Class parser, default normalization, or repair
guidance implementation. The static test verifies this boundary so a cleanup
rename cannot smuggle later behavior into C2.

## Verification

- Unit/contract: synthetic pure-evaluator cases for missing declaration,
  missing anchor, invalid stage/role relation, undeclared contract field, and
  a legacy-suffix occurrence.
- Opt-in contracts sweep: parse all schema declarations and scan every active
  Harness source file, tests, test E2E files, operational document, and
  template. It asserts no active `*-v<positive integer>` production identifier
  and no leftover frozen/compatibility inventory. The C2 delta-spec review is
  the pre-sync specification proof; after the change is synced or archived, the
  same lexical rule runs over accepted main specs as the post-sync proof.
- Owner integration: focused source/state/identity, Progressive Raw, Style
  Master, delivery, locator, and CLI tests prove only the current contract is
  emitted and accepted before mutation/provider work.
- Project integrity: `npm test`, `openspec validate conform-code-to-schema-definitions --strict`,
  `openspec validate --all --strict`, and `git diff --check`.
- E2E is not selected: C2 has no new public journey or provider interaction.

## Risks / Trade-offs

- **A hidden literal escapes the first inventory.** The complete lexical scan
  makes absence an acceptance criterion and reports the precise path/token.
- **Multiple records need the same stage name.** `artifact_role` preserves that
  distinction without reintroducing versioned record schemas or overloading
  `kind`.
- **A legacy scanner is mistaken for harmless rejection.** C2 removes any
  scanner that recognizes historical bytes; exact current-value validation is
  sufficient and avoids compatibility behavior.
- **The scope bleeds into planned C3-C5 work.** The task order requires a
  producer-status audit and negative tests before implementation begins.
