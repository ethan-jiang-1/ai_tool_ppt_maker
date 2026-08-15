## 1. Run-Bundle Source And Resolver

- [x] 1.1 [run-bundle-layout, run-bundle-management] Add
  `PAGE_DESIGN_SYSTEM_FILE`, canonical backbone/override path support,
  visual-style whitelisting, zero-byte init seeding, new-version override
  treatment, layout self-checks, and generated tree/README guidance.
  Done when a new Bundle has only the neutral canonical seed, an older Bundle
  may omit it, matching overrides are accepted only at the version path, and
  no layout operation writes lifecycle evidence.
- [x] 1.2 [production-schema-conformance] Before adding the resolver schema
  literal to active source, update `schema/stages/layout-config.yaml`,
  `schema/stages/page-generation-spec.yaml`,
  `schema/stages/image-generation-plan.yaml`,
  `schema/stages/image2-request.yaml`, `schema/serialization-contracts.yaml`,
  and the static conformance evaluator. Register
  `page-image-design-system-binding` in a dedicated `layout-config`
  `version-design-system-binding` wire-schema group while preserving the
  existing four-entry `version-presentation-source` group; declare raw
  text/digest pairing, Core/plan digest, top-level provider text/null field,
  size bound, workflow symmetry, and provider-facing exclusions.
  Done when the pre-resolver declaration is accepted by the provider-free
  static sweep, synthetic Pure and Framed valid chains pass, and missing/extra/
  asymmetric fields, a missing or misclassified local binding declaration,
  lineage leakage, cross-workflow leakage, or size drift fail only that static
  check.
- [x] 1.3 [visual-config] Implement and publicly export the confined
  override-first Page Design System resolver with immutable
  `page-image-design-system-binding` output, exact UTF-8/digest and BOM
  preservation, blank-to-null semantics, a raw-byte 8,192-byte limit before
  blank canonicalization, and explicit no-fallback handling for an invalid
  existing override leaf.
  Done when an existing override leaf is authoritative, invalid selected leaf
  cases do not use backbone, and source path, selection origin, and prose
  interpretation remain outside provider-facing values. Component-wise
  ancestor hardening remains owned by 1.5.
- [x] 1.4 [visual-config tests] Add temporary synthetic-Bundle resolver
  coverage for backbone/override selection, blank override suppression,
  missing/blank null bindings, exact bytes/digest including a leading BOM,
  8,192/8,193-byte limits including an over-limit whitespace-only source,
  invalid UTF-8, symlink/dangling symlink, directory, unreadable, and
  root-escape failures.
  Done when each covered invalid leaf/escape case fails before candidate
  planning and proves it never falls back to backbone or historical/generated
  data. Complete ancestor-chain and platform-independent unreadability controls
  remain owned by 1.5 and 1.6.
- [x] 1.5 [visual-config] Harden the resolver's component-wise override and
  backbone path inspection so only a genuinely absent override leaf behind a
  normal non-symlink directory chain permits fallback. Existing symlinked,
  dangling, escaping, non-directory, unreadable, or otherwise uninspectable
  ancestors SHALL hard-stop rather than turn a leaf lookup into `ENOENT`; add
  synthetic tests for a wholly absent override branch with valid backbone,
  malformed override ancestors, absent required backbone ancestors, and other
  malformed selected-backbone ancestors.
  Done when a genuinely absent override branch binds its valid backbone, while
  every malformed selected branch fails before candidate planning and never
  binds a null, historical, or generated value.
- [x] 1.6 [visual-config tests] Make the resolver's unreadable-source negative
  control platform-independent through an internal-only, narrow read-only
  filesystem injection seam. Name the internal factory
  `createPageDesignSystemResolver`; the public resolver SHALL retain Node
  defaults and no factory or injected filesystem object may be re-exported,
  persisted, or reach adapter/runtime/provider code.
  Done when an injected `EACCES` from source inspection or reading hard-stops
  without backbone fallback on every host, rather than relying on `chmod`
  behavior, and the public `02-visual-system` namespace exposes neither the
  factory nor a filesystem seam.

## 2. Shared Page Image Binding

- [x] 2.1 [image-generation] Extend Page Image Core semantic facts and
  `createPageImageProviderInputBinding()` with nullable
  `page_design_system_sha256`, validating its exact digest/null shape without
  making Core read source text or compile prompt bytes.
  Done when Core canonical semantic hashes and binding validators distinguish
  null, matching non-null, missing, extra, and malformed fields.
- [x] 2.2 [image-generation] Add `page_design_system` text/digest pairing to
  both adapter raw-contract exact shapes, including correlation with the Core
  digest, and add shared 32,768-byte canonical provider-input limit enforcement
  at both selected adapter compilers.
  Done when a forged/asymmetric/mismatched pair or an over-limit input
  hard-stops at provider-free compilation with no partial plan, grant, attempt,
  provider call, or historical-evidence mutation.
- [x] 2.3 [image-generation] Carry the nullable digest through ordinary and
  progressive raw-plan binding validators, authorization-scope hashing,
  cross-bound checks, and `page_image_invalidation` with the direct
  `page_design_system_drift` raw-rebuild reason.
  Done when text-to-null, null-to-text, and selected-text changes cannot use a
  local overlay refresh or prior raw evidence, while a changed unselected
  backbone source under a non-empty override does not drift the plan.
- [x] 2.4 [shared tests] Extend Core, artifact, progressive-schema, and
  invalidation tests for the new exact field and its negative paths.
  Done when ordinary and progressive plan construction/rejection and
  invalidation all use the same field shape and no existing Pure/Framed binding
  is accidentally widened.

## 3. Pure Adapter

- [x] 3.1 [image-generation] Resolve the Page Design System once at the start
  of the Pure candidate compiler, pass its digest into Core, retain its exact
  binding in each Pure raw contract, and compile top-level
  `design_system: string | null` from that raw contract.
  Done when Pure's generic instruction and Pure-only presentation facts remain
  unchanged apart from the new field, and no path/digest/origin is serialized
  for the provider.
- [x] 3.2 [Pure tests] Add Pure contract/compiler coverage for non-null/null
  bindings, digest/text tampering, exact canonical bytes, 32 KiB boundary,
  inspection payload, stale stored-plan preflight, and fake-provider transport.
  Construct the size boundary from the final canonical UTF-8 serialization,
  not source-text character count: exactly 32,768 bytes SHALL pass and 32,769
  bytes SHALL fail before publication. Done when a post-plan source change
  stops authorization/generation before the fake submitter runs and a current
  request is transported byte-for-byte.

## 4. Framed Adapter

- [x] 4.1 [image-generation] Resolve and bind the same source once in the
  Framed candidate compiler, extend the Framed raw contract, and compile its
  top-level `design_system` field from validated raw facts.
  Done when Framed keeps its local-header renderer, protected composition,
  subject restrictions, and exact exclusive-header-reservation instruction.
- [x] 4.2 [image-generation] Extend
  `framed_provider_input_contract.mjs` to require the field and verify exact
  equality with raw-contract text, source-free provider shape, input size, and
  all current forbidden local-header/context fields. Pass the common 32 KiB
  limit from the selected Framed adapter rather than importing Page Image Core
  from this private validator.
  Done when changed instruction text, deleted/forged `design_system`, leaked
  path/digest/origin, or mismatched raw text is rejected before plan
  publication.
- [x] 4.3 [Framed tests] Add Framed raw-contract, exact-validator,
  local-header-boundary, stale-plan, request-inspection, and fake-provider
  transport tests for non-null and null design systems. Construct the size
  boundary from the final canonical UTF-8 serialization: exactly 32,768 bytes
  SHALL pass and 32,769 bytes SHALL fail before publication.
  Done when design-system support cannot introduce a Framed blank band, local
  header literal, Pure projection, or a second review/acceptance path.

## 5. Runtime, Derived Data, And Cutover

- [x] 5.1 [image-generation] Verify the selected-adapter stored-plan preflight
  resolves current source before authorization/generation and compares the
  recompiled exact plan; when a former compiler plan lacks the newly required
  exact binding and therefore fails current shape validation before comparison,
  classify only that otherwise-current former binding omission through the
  existing `target_raw_plan_stale` / `rebuild_target_raw_plan` recovery result.
  The classifier requires exact current outer plan/item shapes, the former
  exact provider-binding key set on every item, and current validation of every
  retained value; a mixed former/current multi-item plan is invalid rather than
  stale. All other malformed stored-plan facts retain their existing
  invalid-plan diagnostic; do not introduce a current compatibility reader or
  converter. Keep current/former binding-key and retained-value classification
  in `page_image_artifacts.mjs`; the target runtime consumes that result instead
  of duplicating the binding schema. Retain shared target runtime and submitter
  as opaque bound-byte transport only.
  Done when source drift and former compiler plans stop before grant/attempt/
  provider initialization; retained immutable progressive/lifecycle plans,
  reviews, media, and delivery records remain byte-for-byte unmodified; and the
  stale adapter current projection is replaced only by complete owner
  republication, never by adding the missing field in place.
- [x] 5.2 [progressive raw owner and store] Add one bounded historical-cutover
  path for an exact progressive current head whose every provider-input binding
  has the former key set and valid retained values. Validate canonical plan
  bytes/content address, head binding, and direct lifecycle lineage under that
  former shape, with former-shape validation owned by
  `page_image_progressive_schema.mjs`, canonical storage checks owned by the
  progressive store, and recovery choice owned by the progressive owner. Never
  expose it as a normal current typed plan. Preserve the existing
  unresolved-submitted-attempt reconciliation action and exact
  no-resubmit append before any successor. With no unresolved submission, allow
  only fresh current-plan publication and CAS head advancement with the former
  plan hash as predecessor. Recheck unresolved lineage inside the head lock.
  Exclude former materializations/reviews from current reuse and retained-review
  lookup; recognize exact former containers during current cross-plan searches
  without skipping mixed, malformed, noncanonical, address-mismatched, or other
  unrelated corruption. Do not permit a former plan to create a batch, grant,
  attempt claim, provider submission, review, acceptance, finalization, or
  delivery.
  Done when an exact old head no longer collapses to internal failure, paid
  uncertainty cannot be bypassed, a safe successor preserves CAS lineage and
  all former bytes, and no former evidence becomes current or reusable.
- [x] 5.3 [image-generation tests] Add integration coverage for normal and
  progressive current-plan preflight, derived `image2-request` inspection, and
  retained historical evidence across source drift and compiler cutover,
  including the absent-former-binding stale/rebuild diagnostic before any grant,
  attempt, or provider initialization. Add a deliberately unrelated stored-plan
  corruption control and a mixed former/current multi-item binding control that
  retain the existing invalid-plan result rather than taking the
  compiler-cutover stale route. Seed former progressive heads with no lifecycle
  work, accepted historical evidence, and an unresolved submitted attempt; prove
  fresh CAS successor publication without reuse, reconciliation precedence and
  no resubmit, former-byte preservation, predecessor hash retention, denial of
  current operations, and exact-former exclusion from later cross-plan reuse.
  Add malformed direct-record, noncanonical/address mismatch, and head-race
  controls. Add a late-edit fake transport control that changes the source only
  after selected-adapter current-plan preflight succeeds.
  Done when both former adapter and progressive plan shapes take only their
  bounded recovery paths, every corruption control remains fail-closed, the
  shared transport performs no additional source read after successful
  preflight, the next invocation detects drift, and recovery is the existing
  fresh-plan/Generated Image Rebuild route rather than a migration, waiver,
  retry, or manual `_generated/` edit.

## 6. Documentation And Boundary Guards

- [x] 6.1 [layout and architecture documentation] Update active source/tree
  guidance, README references, source-test ownership, and architecture guards
  for the new resolver and canonical source path.
  Done when guidance clearly separates this optional shared source from
  visual-language selection, Pure-only presentation, Framed local-header
  policy, Style Master intent, lifecycle records, and production deck data.
- [x] 6.2 [cli-surface and verification scope] Extend the existing direct
  `image2` failure classifier so the six `page_design_system_source_*` codes
  declared by the design and `pure_provider_input_too_large` /
  `framed_provider_input_too_large` retain their bounded reason kinds and use
  the existing `source_validation` / non-human `edit_source` recovery. Project
  a resolver-supplied source path only through the existing secret-safe locator
  fields; do not expose exception prose, design-system text, digests, or origin.
  Because canonical-input overflow has multiple contributing inputs and no
  exact locator in its error contract, omit `source` and `next.inspect` for that
  case instead of defaulting them to `slide-specifications.md` or another
  merely available source path.
  Keep `page_design_system_run_dir_invalid` and derived adapter contradictions
  on the existing `internal` / `report_internal` route.
  Add process-level CLI controls for both workflows and record that no new CLI
  command/route, diagnostic-envelope field or action, MD Controller node or
  transition, State field, outer transport-envelope key, or `tests_e2e`
  protocol branch is introduced. Use existing CLI/help, diagnostic, architecture/
  import, state-contract, exact outer provider-request-shape, and controller-
  manifest checks as evidence.
  Done when the new source and size failures no longer collapse to generic
  internal/provider recovery, true compiler defects remain internal, all output
  stays bounded and secret-safe, process controls prove overflow is not assigned
  a speculative locator, and the absence of a new E2E protocol case is justified
  by unchanged commands, routing, envelope schema, and consumer flow.
- [x] 6.3 [harness architecture] Keep the existing Page Image Core seam closed
  to the source parser and selected adapter entry points: the Framed private
  provider-input validator receives the shared maximum-input scalar from its
  adapter instead of importing Core. Update the architecture test's minimal
  valid serialization snapshot for the new wire-schema declaration and register
  `tests/02-visual-system/test_page_design_system.mjs` with its recursive test
  owner. Add the public-Visual-Config negative control that permits only the
  declared Page Design System schema, byte-limit, error, and Node-default
  resolver exports; `createPageDesignSystemResolver` and a filesystem injection
  seam remain internal.
  Done when the architecture contract accepts the new static declaration and
  test file without broadening Core consumers or creating an ownership
  exception, and the factory cannot become a public adapter/runtime dependency.

## 7. Validation And Handoff

- [x] 7.1 Run the focused resolver, shared binding/invalidation, Pure, Framed,
  direct CLI diagnostic, derived-data, layout, schema-conformance, and
  architecture test files;
  repair all regressions within this change.
  Done when positive and negative controls demonstrate the direct source ->
  compiler -> exact plan -> bound-byte transport loop without provider calls.
- [x] 7.2 Run each affected test through the repository's selected `focused`
  verifier, then `npm run test:sweep`, the protected `npm test` baseline,
  `openspec validate "add-page-design-system-provider-input" --strict`,
  `openspec validate --all --strict`, the focused layout fixture checks, and
  `git diff --check`.
  Done when all required commands pass, or an unrelated pre-existing failure is
  documented with its evidence and is not hidden by unrelated edits.
- [x] 7.3 Prepare the post-apply archive handoff without syncing specs or
  archiving this change during apply. Confirm the delta specs remain coherent
  with their intended main-spec merge and identify any separately authorized
  tracker follow-up without reading or updating `_backlog` unless the user
  explicitly names it.
  Done when all implementation and verification tasks can be completed while
  spec sync and archive remain owned by the separate archive workflow.
