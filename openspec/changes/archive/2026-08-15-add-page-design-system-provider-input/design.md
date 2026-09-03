## Context

See [proposal.md](proposal.md) for the motivation. The current pipeline has
the required ownership seams, but no shared prose input:

- `bundle_layout.mjs` owns canonical source paths and init seeding. Its generic
  `resolveBackboneAsset()` uses existence-based fallback, which is deliberately
  unsuitable for this source because a malformed or dangling override must not
  silently select backbone.
- `02-visual-system` already owns selected presentation and visual-language
  source validation. Both adapters consume those results while compiling a
  provider-free raw-plan candidate.
- `page_image_core.mjs` owns shared semantic facts and per-page provider-input
  bindings; the Pure and Framed adapters own their respective raw contracts and
  canonical input bytes.
- `resolveTargetStoredPlanContext()` recompiles the selected adapter candidate
  and compares its typed raw-plan hash before authorization or generation.
  `page_image_invalidation.mjs` already classifies changed binding fields as a
  raw rebuild. The shared target runtime then transports validated opaque
  adapter bytes without prompt compilation.
- The progressive raw owner stores a second immutable full-plan projection
  behind a CAS-protected current head. Its store currently validates every plan
  with the one active exact binding schema before lifecycle inspection,
  reconciliation, successor planning, or cross-plan reuse lookup. Adding a
  required binding key therefore makes an exact pre-cutover progressive head
  unreadable unless this change supplies a bounded cutover boundary.
- `targetPageImageFailure()` is the direct `image2` diagnostic producer. It
  preserves bounded normalized error codes, but an unclassified code currently
  falls through to `internal` / `report_internal`; therefore the new resolver
  and size codes need an explicit producer-owned classification rather than an
  implied adapter-to-CLI translation.

The design must extend that direct path without turning Markdown prose into a
second Page Source, registry, Style Master, controller, or lifecycle record.

## Goals / Non-Goals

**Goals:**

- Give every deck one optional, version-resolved, shared design-system prose
  source that both Page Image workflows consume symmetrically.
- Make text, digest, raw-plan identity, inspection, invalidation, authorization
  preflight, and provider transport agree exactly.
- Retain the current Pure/Framed separation, especially Framed's local-header
  ownership and exact reservation instruction.
- Fail before provider work for unsafe source bytes, malformed binding facts,
  stale plans, or input-size overflow, with one existing owner recovery route.
- Preserve unresolved-attempt precedence and successor-head CAS when the current
  progressive head is an exact former-compiler plan, without making that plan
  eligible for new provider work or provider-free evidence reuse.

**Non-Goals:**

- Parse, lint, template, rewrite, or semantically validate the author's design
  prose; its visual effectiveness remains a Complete Page Review question.
- Add per-slide free scene prose, expand the visual-language registry, change
  Provider Content Schema, or make `pure-deck-visual-system.yaml` shared.
- Change the outer provider transport envelope, public CLI command/routing or
  diagnostic-envelope schema, MD Controller order, State workflow identity,
  local Framed overlay rendering, or existing deck data such as
  `deck_ai_sdlc_bpm_keynote/3_versions/v8`.

## Decisions

### 1. One resolver owns the opaque source binding

Add `scripts/02-visual-system/internal/page_design_system.mjs` and re-export
its public surface from `scripts/02-visual-system/index.mjs`.
`bundle_layout.mjs` owns `PAGE_DESIGN_SYSTEM_FILE = "page-design-system.md"`
as the canonical layout and seed path constant; the resolver imports that
constant and owns:

- the fixed 8,192-byte raw-source limit;
- a frozen, unversioned
  `{ schema: "page-image-design-system-binding", text, sha256 }` binding,
  declared through a dedicated `layout-config` wire-schema group with role
  `version-design-system-binding`, separate from
  `version-presentation-source`;
- exact UTF-8 decoding, SHA-256 calculation, null-pair validation, and the
  override-first confined file resolver.

The binding is a local in-memory source/configuration fact. Its inventory
declaration does not make it a `shared_contracts` entry, a durable record, or a
`stage_artifact_envelopes` publication.

The resolver constructs both lexical candidates directly from `runDir`, not
through `resolveBackboneAsset()`: first
`overrides/visual-style/page-design-system.md`, then
`2_backbone/visual-style/page-design-system.md`. It walks the override branch
component-by-component with `lstat`. Backbone lookup is allowed only when the
final override leaf is genuinely absent behind an ordinary non-symlink directory
chain (including an absent optional override branch). A symlink, non-directory,
unreadable component, or inspection error at any component is an invalid
override hard-stop; this includes a dangling ancestor that would otherwise turn
a leaf lookup into `ENOENT`. The same confined component checks apply to an
existing backbone branch. Only the optional backbone leaf may be absent after
the required ordinary backbone directory chain validates; an absent or malformed
required backbone ancestor remains a Run-Bundle/source hard-stop. A malformed
source hierarchy therefore cannot be normalized to a null binding.

For the selected candidate, `lstat` must identify a regular non-symlink file.
The resolver then verifies that the real resolved path is exactly the expected
path beneath the real owner root, which rejects an escaping ancestor symlink as
well as an escaping file. It reads bytes once, rejects a selected regular file
whose raw byte length exceeds 8,192 before decoding (including an otherwise
blank whitespace-only file), and decodes with a fatal UTF-8 decoder configured
to retain a leading BOM (`ignoreBOM: true`). `text.trim().length
=== 0` returns `{ schema: "page-image-design-system-binding", text: null,
sha256: null }`; otherwise the exact untrimmed text and its digest are
retained. A blank override therefore intentionally suppresses backbone
inheritance.

The binding is returned only to local compiler code. Paths and selection origin
may appear in bounded local diagnostics but never in an adapter's
provider-facing input or a submitted request. This preserves the source
resolver as the only place that knows filesystem facts.

For platform-independent negative controls, the resolver module may retain a
named internal-only `createPageDesignSystemResolver` factory with a narrow
read-only filesystem dependency. The public resolver uses the Node defaults.
The factory may be imported by its focused resolver test, but neither it nor an
injected filesystem object is re-exported from `02-visual-system/index.mjs`,
persisted, or available to adapter/runtime/provider code. A focused public-entry
negative control asserts that the Visual Config namespace exposes only the four
intentional Page Design System runtime names--the binding schema, source-byte
limit, error type, and default-node resolver--and not the factory or a
filesystem seam. Tests use the internal factory to inject inspection and read
failures such as `EACCES`; they do not rely on host `chmod` semantics.

Alternatives rejected:

- Reuse `resolveBackboneAsset()`: it treats a dangling override as absent and
  would violate fail-closed override ownership.
- Put the text in `page-image-visual-language.yaml` or
  `pure-deck-visual-system.yaml`: both are closed structured contracts, and the
  latter is Pure-only.
- Parse Markdown/front matter: it would create unnecessary prompt semantics
  and an additional authoring contract. The file extension is only ergonomic.

### 2. Bind one resolver result through the existing candidate compiler

At the start of each `compilePureTargetRawPlanCandidate()` and
`compileFramedTargetRawPlanCandidate()`, resolve the Page Design System once
for that candidate. Pass its nullable digest into
`createPageImageCoreFacts()` as a new explicit input; Core adds
`page_design_system_sha256` to each semantic slide fact and to the returned
provider-input binding. This makes the digest part of the existing Core
canonical semantic hash without making Core a source reader or prompt compiler.

Each adapter adds the same resolved `{ text, sha256 }` object as a top-level
`page_design_system` member of its raw contract. This is a two-field projection
of the resolver binding: it deliberately excludes the resolver's local `schema`
member. The raw contract's compact
`page_image_core` projection also carries `page_design_system_sha256`; its
validator checks exact keys, nullable digest syntax, null symmetry, and equality
with `page_design_system.sha256`. The raw binding is therefore self-validating
without Core reading prose or an adapter rereading a file.

Extend `createPageImageProviderInputBinding()` and the exact binding key lists
in both `page_image_artifacts.mjs` and
`page_image_progressive_schema.mjs` with nullable
`page_design_system_sha256`. Existing authorization scope construction already
hashes the complete provider-input binding map, so no second authorization
record or state field is necessary. Add the same field to the invalidation
evaluator's binding list and map it to `page_design_system_drift`.

The candidate compiler owns this resolution timing. Stored-plan reads already
invoke that compiler before authorization and generation, so a later source
edit changes the recomputed plan hash and fails stale-plan preflight before the
shared runtime can obtain a grant or invoke a provider. This reuses the direct
source -> compiler -> typed-plan -> existing recovery loop required by the
control policies.

Alternatives rejected:

- Add design prose to the Page Source receipt: it would make the shared
  deck-level source look like slide-owned content and unnecessarily advance
  source-receipt/state identity.
- Store the text in State, authorization, or a generated projection: all are
  lifecycle/evidence domains, create stale-copy risk, and duplicate the source
  owner.
- Add a new invalidation controller branch: typed binding comparison already
  supplies the direct deterministic fact and recovery route.

### 3. Keep prose in adapter-owned input, not in `instruction`

Both canonical JSON compilers add the exact top-level
`design_system: rawContract.page_design_system.text` field. The Pure
`instruction` remains its current exact sentence. Framed's `instruction`
remains byte-for-byte
`FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`; no prefix, suffix, or
interpolation is allowed.

The Pure raw-contract validator gains the design-system shape/digest/core
checks, and its compiler rejects an input larger than 32,768 UTF-8 bytes. The
Framed validator gains the same raw checks; its specialized
`validateFramedProviderInputContract()` gains `design_system` to its exact
request key set, verifies strict equality with the raw contract text, and
retains all current local-header and forbidden-field checks. Both selected
adapter entry points use the same shared
`PAGE_IMAGE_PROVIDER_INPUT_MAX_UTF8_BYTES = 32768` constant exported by
`page_image_core.mjs` and measure `Buffer.byteLength` of the final canonical
UTF-8 serialization. The Framed entry point passes that scalar to its private
validator; the private module does not import Page Image Core, preserving the
existing Core-consumer boundary. They do not truncate.

`createTargetProviderRequest()`,
`validateBoundPageImageProviderRequest()`, and submission remain generic. They
verify immutable request bytes and their existing plan binding only; no shared
runtime module imports or reads the Page Design System resolver. The derived
`image2-request` and request-inspection publishers continue to show the exact
adapter-bound serialization, so their existing bytes prove what is available
for local inspection and submission.

Alternatives rejected:

- Concatenate prose onto `instruction`: Framed's strict instruction invariant
  would be weakened and consumers could no longer distinguish generic command
  text from deck-owned guidance.
- Let the shared target runtime inject the field: it would make transport a
  second compiler and bypass adapter-specific contract validators.
- Include digest/path/origin inside `design_system`: the provider needs only
  text, while lifecycle facts belong in local bindings.

### 4. Preserve exact historical evidence and use existing rebuild semantics

No immutable lifecycle plan, grant, attempt, review, media, or delivery record
is migrated or patched. The selected adapter's `target_raw_plan` file is a
rebuildable current projection rather than an append-mostly audit record: a
fresh owner planning operation may replace that complete projection, but no
operation may add a field to its stale bytes or treat them as current. No
`_generated/` artifact is hand-patched; its owner may rebuild it from accepted
sources.

After implementation, a retained adapter plan projection compiled without the
new exact binding may fail the newly strict plan-shape validator before a typed
plan hash comparison is possible. After the existing receipt, workflow, and
outer-plan checks, the selected stored-plan preflight SHALL map only the known
former-compiler omission of `page_design_system_sha256` from its otherwise
current provider-input bindings through the existing stale-plan/rebuild route
(`target_raw_plan_stale` with `rebuild_target_raw_plan`), before authorization
or generation. A missing, extra, forged, or malformed fact not accounted for by
that exact omission retains its existing invalid-plan failure; it must not be
relabeled as compiler cutover. This classification never rewrites, converts, or
supplements stored bytes and never makes the adapter projection eligible for
authorization.

The classifier belongs beside the shared stored-plan preflight, before the
current exact binding validator. It may return the stale/rebuild result only
when the parsed plan retains the exact current outer plan and item shapes, every
provider-input binding has exactly the former key set (the current set minus
`page_design_system_sha256`), and every retained field passes its current value
validation. It returns classification only: it does not add the missing key,
compute a current typed-plan hash, expose a legacy plan to downstream code, or
make the record eligible for authorization. This keeps the detector narrower
than a compatibility reader while allowing the existing recovery route to run
before the strict validator obscures the known compiler-cutover cause. Exact
current/former binding-key knowledge and retained-value validation remain owned
by `page_image_artifacts.mjs`; the target runtime consumes that classification
and does not duplicate another provider-input binding schema.

The immutable progressive plan requires a separate bounded bridge because its
current head and direct records must remain inspectable before a successor can
be published. The progressive schema/store owner may admit exactly one
historical cutover shape: the current progressive outer plan and item shapes
with every provider-input binding using the same former exact key set described
above and every retained value valid under its existing type rule. It verifies
the former plan's canonical bytes, content address, current scope head, and
direct batch/grant/attempt lineage under that former binding shape, but labels
the result historical and non-current. A mixed former/current plan, unrelated
missing or extra fact, invalid retained value, noncanonical bytes, address
mismatch, or malformed direct record remains an immutable-integrity failure.
The former plan and direct-record validators belong to
`page_image_progressive_schema.mjs`; the store owns canonical bytes, content
addresses, and confined record lookup, while the progressive owner alone chooses
reconciliation versus successor advancement.

That historical mode has only two legal outcomes. If its exact attempt lineage
contains a persisted `submitted` outcome without a terminal successor, the
existing reconciliation action remains the smallest independent root cause and
the owner permits only exact no-resubmit reconciliation for that former plan.
If no such outcome exists, inspection returns the existing progressive rebuild
action and publication may stage the new current plan, retain the former plan
hash as `previous_plan_sha256`, and advance the scope head with the existing CAS
discipline. The bridge must be rechecked inside the head lock so a concurrently
persisted unresolved attempt cannot be bypassed.

A former progressive plan is never exposed as a normal current typed snapshot
and cannot create a batch, grant, attempt claim, provider submission, Pilot or
Complete Page Review record, accepted evidence, finalization, or delivery. Its
materializations and review records are not candidates for the cutover
successor's provider-free reuse or retained-review path because the canonical
provider input changed even when `design_system` is null. Current cross-plan
reuse searches may recognize and exclude an exact former plan container; they
must still fail closed for any container that does not satisfy either the exact
current shape or this one former shape. This is a reconciliation/head-lineage
bridge, not a dual writer, current compatibility plan, or historical submission
path.

Missing and blank sources are source-compatible with `design_system: null`.
They do not preserve pre-cutover raw plans, because the canonical compiler's
request shape itself has changed. A change to an unselected backbone file does
not change a candidate using a non-empty override because the resolver returns
only the selected binding.

This is a `hard-stop` when a selected source is unsafe or plan/request binding
is inconsistent: the protected invariants are confined attributable source
bytes, exact plan identity, and recoverable evidence lineage. The agent repairs
the owner source or compiler defect and reruns the same provider-free
checkpoint. There is no `confirm` outcome, no force/waiver, and no new human
prompt for normal in-scope re-planning. Missing/blank optional sources are a
normal `guide`-free null case, not a diagnostic or gate.

The existing direct `image2` CLI producer remains the only public translation
boundary for these failures. The closed source-owned resolver set is
`page_design_system_source_unavailable`,
`page_design_system_source_invalid`, `page_design_system_source_escape`,
`page_design_system_source_unreadable`,
`page_design_system_source_too_large`, and
`page_design_system_source_utf8_invalid`. Those codes retain their exact
bounded reason kind and map to the existing `source_validation` category with
the existing non-human `edit_source` action. A safe selected-source locator
from the resolver may be projected as `source`/`next.inspect`; the producer
must not print exception prose, design-system text, digests, or origin
metadata. `pure_provider_input_too_large` and
`framed_provider_input_too_large` use the same source/configuration repair
category and action because the 32,768-byte bound is an intentional local
compiler constraint, not a provider or Harness defect. That overflow combines
multiple source and configuration inputs and the compiler error carries no
single attributable owner locator, so its diagnostic omits `source` and
`next.inspect` unless a future owner supplies one exact safe locator. In
particular, the producer must not default the overflow to
`slide-specifications.md` or another merely available source path.
`page_design_system_run_dir_invalid` and contradictions in derived adapter
contracts remain the existing bounded `internal` / `report_internal` failure.
This changes no command form, route, diagnostic-envelope field, action
vocabulary, or MD Controller consumer contract.

### 5. Make layout, initialization, and static declarations match execution

`bundle_layout.mjs` gains the file constant, visual-style whitelist entry,
tree/README guidance, init seed, and layout self-check. `init` writes a
zero-byte backbone seed via the existing write-if-absent path; it never writes
example prompt prose. The current new-version mechanism leaves the deck-level
backbone in place and copies a matching override through its existing override
tree copy, so it needs no separate lifecycle behavior.

Update `schema/stages/layout-config.yaml`,
`schema/stages/page-generation-spec.yaml`,
`schema/stages/image-generation-plan.yaml`,
`schema/stages/image2-request.yaml`, `schema/serialization-contracts.yaml`,
and the production-schema conformance evaluator/test. The inventory registers
`page-image-design-system-binding` in a dedicated `layout-config` wire-schema
group with role `version-design-system-binding`, while preserving the existing
four-entry `version-presentation-source` group. The stage declarations then
describe its source/configuration role and its raw-contract text/digest,
Core/plan nullable digest, top-level request field, workflow symmetry, size
bound, and provider-facing exclusions. The static evaluator remains
provider-free and does not duplicate runtime validation.

Relevant tree and workflow documentation should name the shared source beside,
not inside, the existing Pure visual system and Framed header policy. Any
architecture/source-ownership inventory changed by a new public resolver or
test file must be updated in the same task.

## Risks / Trade-offs

- **Opaque prose can contradict closed visual clauses** -> The source is
  intentionally author-owned guidance, not an authority that rewrites the
  closed registry or source content. Adapter byte binding and Complete Page
  Review make the submitted text inspectable without pretending to judge it.
- **Bad override could silently use backbone** -> The resolver probes every
  override-path component with `lstat` before fallback and treats every
  non-absence state as selected/invalid; focused leaf/ancestor symlink,
  directory, unreadable, escape, malformed, and over-limit tests prove this.
- **Long prose could make a provider request unexpectedly large** -> The
  source is capped at 8 KiB and final canonical request at 32 KiB. Both failures
  occur before provider initialization and do not truncate author text. The
  full-request bound is an explicit compiler compatibility break: a formerly
  compilable oversized request must be repaired and replanned, not grandfathered.
- **A convenient shared constant could widen the Core seam** -> The selected
  Framed adapter supplies the already-owned scalar to its private exact
  validator. The architecture guard remains closed to the source parser and
  selected adapter entry points instead of adding a private-module exception.
- **Compiler cutover could appear to erase accepted work** -> Stored evidence
  remains immutable. The exact former progressive head stays readable only to
  preserve unresolved-attempt reconciliation and CAS predecessor lineage; it
  cannot authorize new work or contribute reusable current evidence. Stale-plan,
  reconciliation-precedence, and successor-publication tests prove the boundary.
- **A new source error could be mislabeled as an internal/provider failure** ->
  The direct CLI producer owns an explicit closed mapping for resolver source
  errors and canonical-input overflow, with process-level negative controls for
  secret-safe source repair and for retaining true compiler contradictions as
  internal failures.
- **Provider may ignore the guidance** -> Exact input binding proves transport,
  not pixels; existing Complete Page Review remains the visual quality gate.

## Migration Plan

1. Land the layout/source declarations and their static guard before the
   resolver schema enters active source, then land the resolver and its local
   tests before wiring adapters, so missing or blank old Bundle sources resolve
   to null without any deck mutation.
2. Land Core, raw-contract, plan, invalidation, and adapter changes together
   with exact validators, the bounded progressive historical-cutover validator,
   and serialization declarations. This is one compiler cutover; no dual writer
   or general current-plan compatibility path is introduced.
3. On the first operation after upgrade, an old adapter plan projection fails
   current-plan preflight. If the progressive head names an exact former plan,
   the owner first preserves any required unresolved-attempt reconciliation;
   otherwise it publishes a fresh current plan and CAS-advances the head while
   retaining the former hash as predecessor. Former media and reviews remain
   historical and are not reused. The new plan then follows existing exact
   authorization and Complete Page Review.
4. A code rollback after the new compiler has published current projections or
   lifecycle records is not a supported Bundle downgrade: older code is not
   required to parse or operate on those newly produced records. Preserve all
   Bundle bytes and restore the current compiler before resuming work. A rollback
   before any new-compiler-owned record exists has no data migration to undo;
   pre-cutover evidence remains historical in either case. Do not hand-edit
   derived artifacts to make an older or current compiler accept them.

## Verification Strategy

- **Unit:** Test the resolver in `tests/02-visual-system/` with temporary
  synthetic Bundles for a wholly absent override branch with valid backbone,
  leaf override, blank/null, exact text/digest and BOM preservation,
  8,192/8,193 byte limits, invalid UTF-8, regular-file, leaf and ancestor
  symlink/dangling-symlink, directory, unreadable, root-escape, and malformed
  selected-backbone cases. Test unreadability through an internal injected read
  failure rather than host permission bits. Test Core and ordinary/
  progressive binding exact-key validators plus invalidation classification.
- **Integration:** Extend Pure and Framed workflow tests to compile valid
  non-null and null inputs, verify request text-only shape, raw-contract/Core/
  plan correlation, the 32 KiB boundary, stale-plan preflight, inspection, and
  fake provider transport. A late-edit transport control changes the source only
  after the selected adapter has successfully re-resolved current source and
  compared the exact plan for that invocation; it proves the shared submit path
  does not perform an additional source read, while a new invocation still sees
  the drift. Add Framed negative cases for modified instruction, added lineage
  fields, and mismatched raw text. Extend process-level direct `image2`
  diagnostic tests so resolver source failures and both canonical-input-size
  failures project the existing secret-safe `source_validation` /
  `edit_source` recovery. Assert that resolver failures may carry only their
  exact sanitized selected-source locator, while canonical-input overflow does
  not inherit the generic `slide-specifications.md` locator or an inspect path
  without an exact attributable owner. Resolver invocation and derived-contract
  contradictions remain `internal` / `report_internal`.
- **Progressive cutover:** Seed exact former progressive heads with no direct
  work, accepted historical evidence, and a persisted submitted attempt. Prove
  the first two can advance only to a fresh current plan without reuse, while
  the submitted case exposes and completes exact no-resubmit reconciliation
  before head advancement. Assert the former plan/head/direct-record bytes stay
  unchanged except for a reconciliation-owned appended terminal record, the new
  head retains the former hash as predecessor, and current grant/generate/review
  operations cannot consume the former plan. Add mixed-key, malformed-value,
  noncanonical/address-mismatch, direct-record corruption, CAS-race, and
  cross-plan lookup controls so an exact former container neither poisons future
  current reuse searches nor becomes a reuse source.
- **Static contracts:** Extend layout/init/new-version checks, the
  layout-config/page-generation-spec/image-generation-plan/image2-request
  declarations, production-schema conformance (including separate
  design-system versus presentation wire-schema groups), source ownership, and
  architecture guards for the new resolver and source paths. Update the
  architecture test's minimal valid serialization snapshot and the recursive
  test-owner manifest, prove the private Framed validator remains outside the
  Page Image Core consumer set, and prove the internal filesystem test factory
  is absent from the public Visual Config entry.
- **E2E:** No new end-to-end protocol branch is required: CLI commands/routing
  and envelope schema, controller flow, State schema, authorization surface,
  and provider protocol do not change. Focused process-level CLI tests own the
  changed diagnostic classification, while adapter integration tests exercise
  the same selected-adapter preflight and bound-request transport seam.
- **Commands:** Run each affected file through the repository's selected
  `focused` verifier, run `npm run test:sweep` because public adapter/Core code
  changes, then run the protected `npm test` baseline,
  `openspec validate "add-page-design-system-provider-input" --strict`,
  `openspec validate --all --strict`, the focused layout fixture checks, and
  `git diff --check`. No paid provider call is part of planning or local
  contract verification.
