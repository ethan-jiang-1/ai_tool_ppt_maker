# Research: Active Contract Convergence Before C7

> Type: read-only convergence audit | Updated: 2026-08-12 | Status: conclusion reached
>
> Governing route: [Schema-First Page Image Recovery](schema-first-page-image-recovery.md)
>
> Governing decision rules: [Schema-First Clean-Cutover Decisions](schema-first-clean-cutover-decisions.md)

## Executive Conclusion

C1-C6 are valid, completed steps and the active foundation is sound. This audit
did not find a failed architecture or twelve new workstreams. Its detailed
findings collapse into three bounded cleanup groups:

1. retire the Harness-owned version axis;
2. close the mechanical proof between `schema/`, active owners, and tests; and
3. remove completed route scaffolding from permanent schema authority.

C7 remains the correct production repair operation and the route must not be
renumbered or rewritten. C7 is not quite ready to start because active Harness
writers would still put the first group's generation markers into its new Work
Version, while the current conformance proof cannot see several of them.

The least disruptive remedy is one bounded, unnumbered **Pre-C7 Schema
Convergence Checkpoint**, implemented through one OpenSpec change named
`converge-active-schema-authority`. It owns only those three groups; the twelve
findings below are evidence and acceptance examples, not twelve separately
expandable scopes. After that change is applied, verified, archived, and
reflected in the route plan, the existing C7 continues unchanged.

This is continuation, not repudiation. C1-C6 established the vocabulary,
producers, derived-data path, and Framed boundary. The checkpoint makes their
one-current-contract decision true across the rest of the active Harness before
that Harness is used on production data.

## Scope And Method

This audit used only these active sources:

- `ppt_maker_harness/`
- `tests/`
- `tests_e2e/`
- `openspec/specs/`
- `_backlog/plans/schema-first-page-image-recovery.md`
- `_backlog/plans/schema-first-clean-cutover-decisions.md`

It did not inspect an archived OpenSpec change, a `deck_*` Run Bundle, a `dpt_*`
research bundle, a dependency tree, or generated production data. It performed
no write, migration, provider call, production command, or runtime repair.

The method was:

1. Trace current schema-, protocol-, revision-, compiler-, manifest-, and
   report-shaped values from writer to reader, test, accepted spec, and digest.
2. Compare literal schema constants in production source with
   `schema/serialization-contracts.yaml`.
3. Inspect the real static-conformance scan and evaluator rather than relying on
   the route's completed cleanup checkboxes.
4. Separate legitimate Work Version and external-environment facts from
   Harness-owned contract generations.
5. Classify each finding as `keep`, `isolate`, `centralize`, `remove`, or
   `reword` under the clean-cutover decision.

Line references below describe the 2026-08-12 tree and may drift. The named
symbols and behaviors, not the line numbers, are the durable evidence.

## Governing Decision: One Harness, One Current Contract

The Harness is one continuously improved current tool. It has no runtime axis
on which a caller may choose an old or new Harness schema, protocol, compiler,
manifest, diagnostic, or report generation. When its contract changes, the
schema, code, tests, and accepted specs change together.

The word "version" remains legitimate only in these bounded meanings:

| Surface | Disposition | Meaning |
| --- | --- | --- |
| `3_versions/vN`, `run_version`, `by_version`, and `vNext` | `keep` | A Run Bundle Work Version is a content/design snapshot and a production identity. It is not a Harness contract generation. |
| Root `VERSION`, `VERSION_LOG.md`, README version display, and archive-time bump workflow | `remove` | Git commits and OpenSpec archives already preserve Harness history. A visible repo/Harness release number creates the same false generation axis and should be retired through OpenSpec. If an actual npm publication requirement is later established, package distribution metadata remains external packaging metadata and is never Harness identity or a runtime selector. |
| YAML 1.2, Node, Playwright, Chromium/browser, Git, package, and font identifiers | `keep` | External toolchain or environment facts. They may be recorded or digested for reproducibility but do not promise support for multiple Harness contracts. |
| Harness-owned `schema_version`, numeric `revision`, compiler history, `*-vN` protocol/report names, or manifest format number | `centralize`, `remove`, or `reword` | These falsely create a second Harness version axis. No active reader or writer may branch on them. |

An unknown or malformed input still has to fail safely. Generic rejection of an
undeclared shape is a current-contract invariant, not a compatibility reader.
A negative test may present an arbitrary foreign or numeric value to prove that
rejection, but neither code nor prose should classify it as a supported or
understood historical generation.

## Why The Checkpoint Must Precede C7

C7 creates and operates on a successor Work Version. Several paths involved in
that operation currently emit the residue identified here:

- State creation and every state write emit `schema_version: 5`
  (`scripts/shared/state/state.mjs:57,2681-2689,3046-3063`).
- Run Bundle initialization seeds Visual Language Source Data with
  `revision: 1` and the asset manifest with `version: 2`
  (`scripts/shared/run-bundle/bundle_layout.mjs:257-258,1627-1645`).
- Framed compilation puts a versioned compiler object into the render profile,
  whose digest is then bound into raw contracts and provider evidence
  (`scripts/03-framed-image/internal/framed_render_profile.mjs:9-17,234-264`;
  `scripts/03-framed-image/index.mjs:197-200,849-853`).
- Structural work can embed numeric-versioned slide-edit transactions into an
  exact target plan (`scripts/01-content/internal/slide_document.mjs:12-13,
  562-581,876-889`; `scripts/01-content/internal/target_structural_version.mjs:
  173-187`).

Therefore "C1-C6 passed" is not yet proof that a C7 successor will contain only
the one current contract. The checkpoint prevents newly serialized residue; it
does not read, rewrite, migrate, or delete an existing Run Bundle.

## Evidence Catalogue

The twelve entries below make the three work packages checkable. They are a
closed evidence catalogue, not separate workstreams and not permission to widen
the change into unrelated cleanup.

### 1. State has a hidden schema generation

**Disposition: `centralize` the current shape, then `remove` the generation.**

`STATE_SCHEMA_VERSION = 5` is emitted as `schema_version` on creation and every
write, checked before a state can be read, and repeated in the discoverability
header (`scripts/shared/state/state.mjs:57,62-69,102-124,2447-2448,
2681-2737,3046-3063`). The accepted state specification repeatedly defines
"current" as schema 5 and names schema 4 or earlier
(`openspec/specs/node-specification/spec.md:385-417,433,468-505`). The focused
test pins the same number (`tests/shared/state/test_state_yaml.mjs:23`).

The checkpoint should define the one top-level state serialization contract
under `schema/`, cut every active reader, writer, header, fixture, and accepted
spec over together, and remove `schema_version` plus numeric-generation
branches. Current fields and safety fences remain. An input that does not match
the declared current shape is rejected generically and byte-preserved; it is
not decoded as "schema 4" or migrated into the current shape.

### 2. Framed compiler history is active contract data

**Disposition: `remove` generations and history; `keep` one current identity and
one current coherence proof.**

The Framed header-layout compiler declares `version: '4'` and a version 3/4
coherence history (`scripts/03-framed-image/internal/framed_render_profile.mjs:
9-17`). Its normalizer requires `{schema, version}`, and that object contributes
to `render_profile_digest` (`:157-176,234-264`). Tests require digest changes for
a made-up compiler version and require an append-only identity history
(`tests/03-framed-image/test_framed_render_profile.mjs:77,105-110`). Framed raw
contracts bind that digest (`scripts/03-framed-image/index.mjs:257-280,
849-853`).

The current compiler's unversioned identity, algorithm invariant, and canonical
fixture digest are useful and should remain. The generation number and history
are not. External browser/font/runtime facts inside the render profile remain
valid reproducibility inputs because they describe external execution facts,
not selectable Harness generations.

### 3. Slide parsing and edit transactions carry numeric schema revisions

**Disposition: `remove` from in-memory values; `centralize` any durable/exchange
shape that genuinely needs an identity.**

`SLIDE_DOCUMENT_SCHEMA_VERSION = 1` and `SLIDE_EDIT_SCHEMA_VERSION = 1` are
written into parsed documents, exact-plan mutation payloads, transactions, and
receipts (`scripts/01-content/internal/slide_document.mjs:12-13,331,
562-581,876-889,981-989`). A structural target plan embeds the whole slide edit
plan (`scripts/01-content/internal/target_structural_version.mjs:173-187`).

An in-memory parser object needs no serialized generation marker. If an edit
plan or receipt crosses a durable/exact-plan boundary, it needs one declared
unversioned schema/role under `schema/`, not a numeric revision. Before removal,
the change must trace active callers so generic multi-input parsing behavior is
not confused with historical production compatibility.

### 4. Visual Language Source Data carries a meaningless revision

**Disposition: `remove`.**

Initialization writes `revision: 1`; the parser requires a positive integer;
the resolved audit projection republishes it; and its fixture pins it
(`scripts/shared/run-bundle/bundle_layout.mjs:257-258`;
`scripts/02-visual-system/internal/page_image_visual_language.mjs:26,
379-388,509-520`; `tests/02-visual-system/
test_page_image_visual_language_relationships.mjs:30-31`). No accepted schema
semantics establish different Visual Language revisions, and selected semantic
bindings intentionally use content digests. Remove the field from the source
grammar, seed, projection, and active tests in one cutover.

### 5. The asset manifest seeds an unexplained format version

**Disposition: `remove`; separately confirm whether the empty placeholder has a
current owner.**

Run Bundle initialization writes `version: 2` into an otherwise empty asset
manifest (`scripts/shared/run-bundle/bundle_layout.mjs:1627-1645`). This audit
found no active reader, accepted-spec contract, or test that gives the number a
current semantic role. Remove the number. Retain the placeholder only if the
next change can name its current source owner and consumer; otherwise remove
the dead scaffold as well. Do not inspect or rewrite existing manifests in
Run Bundles.

### 6. Accepted specs still teach named Harness generations

**Disposition: `reword` current behavior and `remove` generation-specific
promises.**

Representative active contradictions include:

- `env-check-v1` and `current-v2` report/production prose in
  `openspec/specs/environment-check/spec.md:75,112,145,152,173,349`, although
  runtime now emits unversioned `env-check`
  (`scripts/shared/cli/cli_error.mjs:80-83`).
- v1/v2 locator generations in
  `openspec/specs/run-bundle-management/spec.md:10-38` and a "v2 local Harness
  binding" in `openspec/specs/node-specification/spec.md:7-18`.
- `replacement-protocol version` wording in
  `openspec/specs/cli-surface/spec.md:213` and named v2 route language at `:462`.
- named v2 Page Authority workflow/record language in
  `openspec/specs/playbook-execution/spec.md:358-381`, with similar named
  generations in pipeline and image-production specs.

Keep the behavior that refuses a missing, malformed, conflicting, or undeclared
current input before mutation. Replace old/current generation comparisons with
current declared shape versus undeclared input. A maintained spec must not be a
catalog of retired protocol names.

### 7. The canonical artifact envelope contradicts itself

**Disposition: `centralize` one envelope and cut all producers over together.**

The accepted conformance spec says a Page Image artifact uses a C1 conceptual
stage name in `schema` and an `artifact_role` for its precise physical shape
(`openspec/specs/production-schema-conformance/spec.md:13-26,34-40`). Content
parsing repeats that requirement for `page-source-receipt`
(`openspec/specs/content-parsing/spec.md:208-225`). The current source parser
instead emits `schema: page-image-workflow-source` with no `artifact_role`
(`scripts/01-content/internal/page_image_source.mjs:843-849`). C5 emits a third
form: `schema: page-image-page-derived-artifact`, plus `stage` and `role`
(`scripts/shared/image2/page_derived_data.mjs:258-276`). A search of active
implementation found no emitted `artifact_role` at all.

The recommended current envelope is the already specified model:

- `schema` identifies one of the nineteen conceptual stages;
- `artifact_role` identifies the exact unversioned physical record/projection;
- shared Harness objects outside those stages use a declared shared contract;
- `stage`/`role` aliases and exact-type values hidden only in code do not remain
  as parallel authorities.

The OpenSpec design must make the exact role vocabulary sufficient before code
changes. It must not retain both envelope forms for compatibility.

### 8. The serialization inventory is incomplete

**Disposition: `centralize` runtime contracts; explicitly declare or exclude
test-only reports.**

A literal-RHS comparison of 73 production-source constants whose symbol names
contain `SCHEMA` found exactly two values absent from
`serialization-contracts.yaml`:

- `page-image-resolved-presentation`, defined and emitted by
  `scripts/02-visual-system/internal/page_image_presentation.mjs:20,324-341`;
- `page-production-task-projection`, defined and emitted by
  `scripts/shared/workflow/page_production_task_projection.mjs:24,154-170,
  233`.

The first should resolve to the declared Page Layout stage and a precise role.
The second is a non-authoritative collaboration projection; it must either be a
declared shared contract or be explicitly excluded by a schema-owned scope
rule, not silently ignored by a prefix filter.

A broader report scan also found `development-verification` emitted by
`tests/contracts/run_development_verification.mjs:7,20-23`. The inventory entry
for `pptmaker-development-verification-core` points at that runner
(`schema/serialization-contracts.yaml:41-45`), while the actual constant is in
`tests/contracts/development_verification_admission.mjs:4`. The checkpoint must
classify these as two distinct current test contracts or correct the ownership;
file existence alone is not a valid anchor proof.

### 9. Exact wire shapes still live primarily in code

**Disposition: `centralize` meaningful serialization; keep validators as code
mirrors.**

The most precise Progressive record identifiers, enums, bindings, and exact
plan shapes remain in `scripts/shared/image2/
page_image_progressive_schema.mjs:3-34,209-230`. Style Master identifiers,
enums, generation profiles, plans, grants, reviews, and selections remain in
`scripts/shared/image2/style_master_schema.mjs:4-25,180-220,298-327,
624-677`. State top-level keys, Task Mandate, and evidence shapes remain in
`scripts/shared/state/state.mjs:54-124,588-650,727-757`.

The corresponding stage YAML files are useful conceptual summaries, but they do
not yet let a human, Agent, and JS implementation derive the same exact durable
shape. The change should move semantic field/enum/role authority under
`schema/`; JS keeps executable validation and imports or mechanically proves
its mirror. YAML remains descriptive contract authority, not a runtime
controller, state machine, or provider gate.

### 10. C5 semantics are copied in four places

**Disposition: `centralize` and mechanically verify mirrors.**

C5 stage purpose, role, adjustment scope, downstream controller, and rebuild
impact appear in the JS `STAGE_DETAILS` table
(`scripts/shared/image2/page_derived_data.mjs:44-101`), nineteen-stage YAML
(for example `schema/stages/page-artifact-index.yaml:1-55`), the conformance
evaluator (`scripts/contracts/harness_architecture.mjs:344-399`), and its test
fixture (`tests/contracts/test_production_schema_conformance.mjs:175-199`).
These copies can agree accidentally. Establish one schema-owned declaration and
make every executable copy mechanically checked against it without loading YAML
in production startup.

### 11. Active compatibility language still owns behavior

**Disposition: `remove` true fallbacks; `reword` current projections.**

Examples that require explicit OpenSpec disposition are:

- State query APIs promise record-only fallback for callers that omit the
  canonical node list (`openspec/specs/node-specification/spec.md:286-309`;
  `scripts/shared/state/state.mjs:2753-2765,2870-2871`). Update current callers,
  then remove the fallback if it has no current semantic role.
- CLI specs promise compatibility with older known-failure records that omit
  `response_shape` (`openspec/specs/cli-surface/spec.md:472-481`). Define the
  one current optional/required shape; do not recognize "older" records.
- Run Bundle layout specifies deletion of a retired derived reference leaf as
  migration (`openspec/specs/run-bundle-layout/spec.md:158-162,182-190`). A
  current rebuild should publish only the current projection and must not scan
  or delete historical Run Bundle paths.
- The current `style_master.jpg` presentation JPEG is called a "compatibility
  payload" (`openspec/specs/style-master-generation/spec.md:156-186`). If it is
  still the current derived presentation projection, name it that and retain
  its current invariants; do not imply a second contract generation.

Not every occurrence of "compatibility" is a branch. External input
compatibility or a statement that no compatibility route exists may be valid.
The change must trace behavior and ownership rather than perform a blind word
replacement.

### 12. Permanent schema authority contains completed route scaffolding

**Disposition: `remove` planning machinery from `schema/`; `keep` C1-C7 once in
the route history.**

The Backlog plan says it is the only Page Image recovery route
(`schema-first-page-image-recovery.md:3-19`), while
`schema/recovery-route.yaml:1-3` independently claims canonical route-label
authority. Every stage and flow producer is now `materialized`, and no active
definition carries `route_ref`. Nevertheless:

- `schema/README.md:25-31` still describes planned C3-C5 producers;
- `schema/META.yaml:29-37` still defines planned-producer route machinery;
- `tests/contracts/test_page_image_schema_definitions.mjs:31,101-128` pins the
  C1-C7 route into the permanent schema home;
- `openspec/specs/harness-directory-layout/spec.md:42-64` requires
  `recovery-route.yaml` there.

C1-C7 are planning/history labels, not production schema terms. Preserve their
definitions and continuity in the linked route plan (and later its normal
closed-plan location). After all producers are materialized, remove
`recovery-route.yaml`, `route_ref` machinery, stale README prose, and their
active test/spec requirements from the permanent schema authority. This raises
signal without erasing or renumbering the route.

## Static Conformance Gaps

The present green conformance test is not proof of active convergence:

| Gap | Evidence | Consequence |
| --- | --- | --- |
| Accepted specs are not scanned | `tests/contracts/test_production_schema_conformance.mjs:8-14,58-75` scans Harness, tests, and E2E only | Named generations in `openspec/specs/` pass unnoticed despite the accepted spec promising that root at `production-schema-conformance/spec.md:77-84`. |
| Prefix whitelist defines visibility | `CONTRACT_VALUE` at `test_production_schema_conformance.mjs:13` accepts only five stems | `development-verification`, compiler/report identifiers, and any arbitrary new durable prefix can bypass the inventory. |
| Only direct literal assignments are extracted | `fieldAssignments` at `:46-55` recognizes five fields with a literal RHS | Exported constants, numeric versions/revisions, `artifact_role`, `role`, enums, and indirect assignments are invisible. |
| Version detection is suffix-only | `VERSIONED_CONTRACT` at `:14` | `schema_version: 5`, `revision: 1`, `version: 2`, compiler histories, and prose generations are invisible. |
| Evaluator trusts an incomplete snapshot | `scripts/contracts/harness_architecture.mjs:150-205` validates only supplied arrays | The evaluator cannot report categories the snapshot builder omitted. |
| Anchor proof is shallow | `test_production_schema_conformance.mjs:37-43,66-67` accepts an existing path or substring | An inventory entry can point at the wrong file and still pass. |
| C5/C6 semantics are hard-coded beside schema | evaluator `:209-219,292-399`; test `:175-240` | A synthetic fixture can remain green while real YAML or a producer drifts. |

The replacement proof should be inventory-driven and field-aware. It must scan
active source, tests, E2E, operational Markdown/templates, and accepted specs;
extract constant-backed as well as direct durable markers; validate exact
stage/role/envelope ownership; and classify every `version`/`revision` surface
by meaning. Its allow rules must be semantic (`run_version`, a path under
`3_versions/`, or named external facts), not a blanket `vN` allowlist.
Archives, Backlog history, dependencies, Run Bundles, and generated production
data remain outside the proof.

## Recommended Pre-C7 Change Boundary

Propose one OpenSpec change: **`converge-active-schema-authority`**.

It should own three coherent work packages:

1. **One current Harness.** Remove Harness/repo release identity and active
   State, compiler, slide, Visual Language, manifest, diagnostic, and report
   generations while preserving current invariants and external environment
   facts. Successor creation copies source plus overrides and initializes fresh
   current state; it does not decode or migrate historical state generations.
2. **One schema closure.** Publish the exact current envelope, state, role, and
   durable record shapes before changing callers; resolve the
   `schema`/`artifact_role` contradiction; cover active owners including the
   presentation, task projection, and development verification contracts; and
   replace shadow fixtures with a complete field-aware proof.
3. **One permanent authority.** Retire completed C1-C7 route machinery from
   `schema/`, preserve it once in this Backlog route, and remove active
   fallback/migration wording that implies selectable Harness generations.

Each package ends with its owner tests and a `tasks.md` update. The change ends
with the complete suite, strict OpenSpec validation, residue sweeps, and
`git diff --check`. New findings are admitted only when they violate one of
these three completion criteria; this is not authorization for an open-ended
general refactor. There is no intermediate supported generation.

**Scope cutoff:** do not search for further cleanup categories after proposal
work begins. Trace only the active readers, writers, specs, and tests necessary
to close these three packages. Unrelated quality findings return to normal
Backlog triage and do not block C7.

After archival, update the route plan minimally: link this research, record the
checkpoint and archived change between completed C6 and pending C7, correct the
cleanup proof, and leave the C1-C7 labels and C7 checklist intact.

## Acceptance Criteria

The checkpoint is complete only when all of the following are true:

- Active scope contains no Harness-owned schema, protocol, compiler, manifest,
  diagnostic, or report generation marker that can select or describe multiple
  Harness contracts.
- State uses one schema-owned, unversioned top-level contract; readers and
  writers do not emit, inspect, repair, or branch on `schema_version`.
- Framed render identity contains one current compiler identity and current
  fixture coherence, with no compiler version or coherence history.
- Slide-document/edit and Visual Language shapes contain no numeric schema or
  revision field.
- The asset manifest has no format-generation number, and the placeholder
  exists only if a named current owner consumes it.
- Every current Page Image durable artifact uses the one declared envelope and
  every shared durable contract has one declared owner.
- `serialization-contracts.yaml` and the exact stage definitions cover all
  active durable values and roles, including constant-backed emitters.
- Accepted specs contain no named retired/current Harness generations and no
  promise to interpret an older record; generic unknown-input rejection and
  byte preservation remain explicit.
- The conformance proof scans `ppt_maker_harness/`, `tests/`, `tests_e2e/`,
  maintained operational documents/templates, and `openspec/specs/`, with
  explicit exclusions for archives, Backlog history, dependencies, Run Bundles,
  and generated production data.
- A constant RHS, arbitrary identifier prefix, numeric `version`/`revision`, or
  `artifact_role` mismatch cannot bypass the proof.
- Negative tests still prove that missing, malformed, foreign, or undeclared
  input fails before mutation/provider work, without parsing it as a known
  historical generation.
- `3_versions/vN`, `run_version`, `by_version`, `vNext`, and external toolchain
  facts remain intact and cannot be mistaken for Harness contract generations.
- Root Harness/repo version display, changelog, bump instructions, and active
  `project-versioning` contract are retired; package metadata cannot reintroduce
  a visible Harness generation or runtime selector.
- No `deck_*` or `dpt_*` path is read, rewritten, migrated, deleted, or used as a
  fixture; no provider call is made.
- Focused suites and `npm test` pass, strict OpenSpec validation passes, and
  `git diff --check` is clean before archive.

## Non-Goals And Safety Boundary

This research and the proposed checkpoint do not:

- cancel, renumber, or execute C7;
- revise the responsibilities or evidence already completed by C1-C6;
- migrate, normalize, adopt, or delete historical Run Bundle data;
- remove Work Version snapshot identity, Git history, or OpenSpec archive
  history;
- remove external runtime/toolchain versions needed for reproducibility;
- turn YAML into a runtime controller, lifecycle gate, provider authorizer, or
  second source of record;
- add a legacy reader, converter, dual writer, compatibility alias, or frozen
  exception list;
- modify archived OpenSpec history; or
- authorize provider work, production repair, or edits under `_generated/`.

The stop condition is simple: if implementation inspection reveals a semantic
distinction that the current schema cannot express, update the OpenSpec design
and schema declaration first. Do not hide the distinction in another constant,
number, suffix, test fixture, or accepted-spec exception.
