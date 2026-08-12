## Context

See `proposal.md` for the motivation and the delta specifications for the
required behavior. The active Harness currently serializes generation fields in
state, structural editing, Visual Language, asset-manifest, and Framed profile
data. It also has two incompatible Page Image artifact envelopes: a source
receipt uses a code-only schema string, while C5 uses a generic wrapper with
`stage` and `role`. The static conformance test cannot reliably see constants,
field assignments, accepted specs, or all declared code anchors.

The change is repository maintenance only. `deck_*` and `dpt_*` paths are not
test fixtures and must not be read, copied, converted, or changed.

## Goals / Non-Goals

**Goals:**

- Leave one descriptive, unversioned schema authority whose executable owners
  and tests are mechanically proven to agree.
- Remove the Harness/repository release axis while retaining Run Bundle Work
  Versions and external reproducibility facts.
- Make a successor Work Version start from copied source and overrides plus
  fresh current state, without interpreting predecessor state or evidence.
- Keep the existing owner-issued unsupported-input boundary byte-preserving and
  free of migration behavior.

**Non-Goals:**

- No runtime YAML loader, new controller, new gate, provider call, or human
  confirmation path.
- No generic historical-data utility, compatibility reader, converter, dual
  writer, fixture, or alternate workflow.
- No audit of production Run Bundles, research inputs, archived changes, or
  unrelated wording outside the bounded capability surface.
- No change to the C1-C7 route, its labels, or C7's production scope.

## Decisions

### 1. `schema/` owns meaning; JS owns enforcement

`serialization-contracts.yaml` will be extended as the single descriptive
inventory for current serialization: stage-to-role relations, named shared
contracts, current state shape ownership, required fields, and exact code
anchors. Stage YAML retains conceptual ownership. JS validators keep their
existing executable checks and do not load schema YAML at startup.

The contract test, not the runtime, parses YAML and proves that owner constants,
envelopes, code anchors, and accepted specs agree. This preserves the current
MD/JS boundary: MD routes work; JS validates and serializes facts; schema makes
the shared semantics inspectable without becoming a second controller.

Alternative considered: importing YAML into runtime validators. Rejected
because it adds an availability and parsing dependency to production control
paths while duplicating validation that the JS owners already perform.

### 2. One Page Image envelope, with exact roles

Every declared Page Image artifact will publish `schema` as its conceptual stage and
`artifact_role` as its declared physical record or projection. `kind` continues
to carry its existing domain/action meaning. Generic envelope schema values and
parallel `stage`/`role` discriminators are removed from active outputs.

The initial exact cutover is:

| Owner/output | `schema` | `artifact_role` |
| --- | --- | --- |
| Parsed Page Source receipt and its per-page publication | `page-source-receipt` | `parsed-source` |
| Resolved Page presentation binding and derived layout publication | `page-layout` | `resolved-presentation` |
| Derived render model | `page-render-model` | `reviewable-page` |
| Derived generation facts | `page-generation-spec` | `compiled-page-facts` |
| Derived provider request inspection | `image2-request` | `provider-input` |
| Derived Framed local header output | `framed-header-html` | `local-header-overlay` |
| Derived page index | `page-artifact-index` | `page-derived-index` |
| Derived deck index | `page-artifact-index` | `deck-derived-index` |

`page-production-task-projection` is explicitly a named shared report contract,
not a Page Image stage artifact. The development-verification declarations will be split or
re-anchored according to their actual emitting test owner, rather than using a
file-presence proxy. The state declaration names its top-level current shape
and owner without adding a runtime schema field.

Alternative considered: retain the generic C5 wrapper and merely declare it.
Rejected because it leaves two ways to express stage and role, so a reader must
continue to infer meaning from implementation-only fields.

### 3. A clean source-only successor boundary

`new-version` will validate the selected current source ownership, copy only
canonical source and overrides, and initialize fresh target state from those
facts. It must not parse, copy, convert, or use predecessor state, receipts,
derived output, lifecycle evidence, or directory order. The owner of state
continues to validate and atomically write state; the run-bundle owner only
creates the target topology and copies its allowed source inputs.

An undeclared source, locator, receipt, or state is a `hard-stop`: it protects
identity, evidence attribution, and recoverability. The owning existing
validator returns the one nearest legal action before mutation. This change
does not add a confirmation, waiver, or force route. The resulting control loop
is unchanged and direct: owner fact -> owner validator -> bounded diagnostic ->
repair through owner -> same check.

Alternative considered: read predecessor state and discard unsupported fields.
Rejected because it would make state format inference and untracked conversion
part of successor creation, breaking byte preservation and source/evidence
separation.

### 4. Remove Harness-owned generation markers in one repository cutover

Remove root release metadata and its archive workflow, numeric state and slide
serialization fields, Visual Language and asset-manifest markers, Framed
compiler history, and active named report/diagnostic generations together with
their tests and accepted specs. `vN`, `run_version`, and `3_versions/vN` stay:
they identify a Run Bundle Work Version. Node, package dependency, browser,
font, YAML, and Git facts also stay as external reproducibility facts.

Scope-bound lifecycle ordinals remain when they carry existing safety meaning,
not a selectable Harness contract. For example, a Style Master
`plan_generation` orders immutable CAS-linked plans inside one exact Work
Version/workflow scope; it neither crosses that scope nor selects a schema,
reader, compiler, or protocol. The conformance inventory will classify such
ordinals explicitly rather than treating the word "generation" as a blanket
numeric-marker violation.

The Framed profile retains a stable unversioned compiler identity, canonical
geometry fixture, external inputs, and digest invalidation. A changed current
algorithm therefore still invalidates raw work without creating a selectable
compiler generation.

The layout-resolved `style_master.jpg` is already a current derived
presentation JPEG projection, not a compatibility payload or a second
selection authority. Its active specification, owner diagnostics, glossary,
and tests will use that one name. A projection failure remains bounded to its
existing replay/repair path and cannot replace, broaden, or roll back the
accepted selected PNG bytes.

Alternative considered: keep a release number as passive documentation.
Rejected because visible Harness identity still teaches a false selector axis;
Git commits and OpenSpec archives retain the needed maintenance history.

### 5. Field-aware static proof replaces shadow schema tables

The pure evaluator in `harness_architecture.mjs` receives a normalized snapshot
of schema declarations, literal and constant-backed occurrences, envelope
fields, and anchors. It remains dependency-safe: no file reads and no YAML
import. A real scan test constructs that snapshot from the allowed maintenance
surface and invokes the same evaluator.

The scanner will inspect `ppt_maker_harness/`, `tests/`, `tests_e2e/`,
maintained operational Markdown/templates, and `openspec/specs/`. It will
recognize constant-backed assignments and numeric schema/revision/compiler/
manifest/report markers, validate anchors against actual declarations, and use
semantic classifications for Work Versions, bounded lifecycle ordinals, and
external facts. Duplicated derived-stage metadata in the evaluator and test
fixture is removed or derived from the schema snapshot; prefix allowlists are
not used.

Alternative considered: expand the existing lexical filter. Rejected because
identifier-prefix filters cannot prove object-field ownership, anchor accuracy,
or agreement among schema, code, tests, and accepted specs.

### 6. Permanent schema contains only permanent production meaning

Remove `schema/recovery-route.yaml`, `route_ref` handling, and C1-C7 route
references from the schema home. The Backlog route and decision records remain
the sole planning history; stage definitions and the flow retain production
semantics only. README remains orienting documentation, while verification
lives in tests and the static evaluator.

Alternative considered: retain the route file with a completion marker.
Rejected because its location makes delivery history appear to be executable or
durable production authority.

## Risks / Trade-offs

- **A broad lexical scan may flag valid lifecycle ordinals, external facts, or
  Work Versions** -> use semantic classifications with focused positive and
  negative fixtures, then record only those classifications in the descriptive
  inventory.
- **Envelope or projection renaming can break an internal reader missed by the
  first pass** -> trace each producer and consumer, add focused owner tests,
  and run the relevant integration tests before checking the package complete.
- **Removing release metadata can surprise generic tooling** -> keep package
  name and dependency constraints, verify repository scripts do not read the
  root version, and do not alter dependency versions.
- **Changing successor initialization can accidentally consult a predecessor**
  -> use synthetic fixtures that distinguish copied source/overrides from state
  and derived evidence; assert the latter remain unread and byte-identical.
- **A route file deletion can leave a dangling doc/test reference** -> perform
  a bounded source/spec scan and the schema-home layout self-check before the
  final package is marked complete.

## Migration Plan

1. Establish the expanded descriptive inventory and pure conformance snapshot
   interfaces before replacing owner serialization.
2. Cut source, state, structural, visual, Framed, report, and successor owners
   plus their direct readers and tests to the current forms in one repository
   change. Do not open a Run Bundle while doing so.
3. Remove retired Harness metadata, generation wording, route scaffolding, and
   dead test mirrors after their replacements are verified.
4. Run focused owner and integration coverage, the static conformance sweep,
   selected public CLI/mock E2E only where assertions changed, `npm test`,
   strict OpenSpec validation, the layout self-check, and `git diff --check`.

There is no data migration and no production rollback operation. Before any
production use, an implementation rollback is the normal Git revert of this
repository change. Existing Run Bundle bytes remain outside the change.
