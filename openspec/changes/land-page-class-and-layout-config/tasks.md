> Apply protocol: update this ledger immediately after every verified task group
> and after every failed verification/recovery. Mark a checkbox only when its
> named evidence is recorded below; do not defer all task updates until the end.

## Verification Ledger

- Pending implementation.

## 1. Canonical Source And Layout Cutover

- [ ] 1.1 [content-parsing] Extend Page Source parsing and receipt normalization
  with the optional closed `PAGE CLASS` field; omit-to-`standard` must be silent,
  while unknown/repeated/malformed values stop before receipt creation.
- [ ] 1.2 [content-parsing] Remove `FRAME PRESET` from active page grammar,
  receipts, templates, guidance, and source consumers. Reject it as an unsupported
  current field without translation, legacy reader, or migration path.
- [ ] 1.3 [run-bundle-layout, run-bundle-management] Add the canonical
  `visual-style/page-image-presentation/` source package and matching
  version-override paths to the layout owner; seed all four valid unversioned
  schema-declared default documents during init and preserve `new-version`'s
  clean evidence boundary.
- [ ] 1.4 [harness-directory-layout] Materialize C4's `page_class`,
  `layout-config`, and `page-layout` schema/inventory owners with current
  executable anchors, direct inputs/outputs, provenance, and invalidation
  language. Declare all four presentation source contracts under `layout-config`,
  move Pure out of visual-language, and remove `framed_header_preset`; leave no
  planned producer, revision/version marker, or obsolete selector ownership.

## 2. Presentation Package Resolver

- [ ] 2.1 [visual-config] Implement one confined, override-first/backbone-default
  loader for the four exact source files. Validate them together with closed
  document shapes, class/profile bindings, file confinement, and bounded direct
  source/configuration diagnostics; no partial YAML merge or generated fallback.
- [ ] 2.2 [visual-config] Implement immutable deterministic per-page resolution
  from normalized class and selected workflow. Return exactly one isolated Pure
  or Framed projection with selected profile ID, resolved values, per-value
  provenance, and canonical binding digests. Before Framed adapter input, reject
  a non-null source header literal not permitted by the selected profile; never
  omit it, make it provider-visible, or infer another class.
- [ ] 2.3 [visual-config] Move the existing Pure deck visual-system parser behind
  the presentation package while keeping `pure-deck-visual-system.yaml` Pure-only
  and its digest forbidden to Framed. Reject cross-workflow fields and content,
  prompt, geometry-override, evidence, or state ingress in every source file;
  remove the old Pure source shape and revision parser without a reader or conversion.
- [ ] 2.4 [visual-config] Seed the current hard-coded Framed `standard` overlay
  as the default Framed profile, then delete hard-coded caller-selectable preset
  selection. Preserve deterministic local fit/protected-region behavior through
  resolved profile data only.

## 3. Core, Adapter, And Lifecycle Binding

- [ ] 3.1 [image-generation] Pass the resolved projection through Page Image Core
  into both adapters. Framed must consume only allowed header/local-overlay/
  protected-region facts; Pure must consume only its whole-page profile; neither
  accepts a caller profile or the other workflow's facts.
- [ ] 3.2 [image-generation] Bind normalized class, selected profile, provenance,
  and projection digest into the existing immutable raw contract/input lineage.
  Validate each Framed raw contract against its page's own selected profile;
  a projection mismatch cannot reuse prior raw media or Complete Page Review.
  Do not publish any C5 per-page file, duplicate header JSON, or new
  state/approval record.
- [ ] 3.3 [image-generation] Update Framed raw-review contribution assembly to
  retain each stable page's selected profile digest and protected-region guide
  without requiring all pages in one complete/Pilot review to share a profile.
  Remove the same global-profile assumption from ordinary/progressive raw-plan
  browser proof and header-contract batch composition: exact ordered per-page
  profile/guide proof must gate materialization, while one existing review
  decision and exact per-page lineage remain. Add no review-wide profile field,
  second publisher, or durable proof record.
- [ ] 3.4 [pipeline-orchestration] Extend the existing pure invalidation evaluator
  to compare resolved bindings: class, selected default, selected profile, and
  workflow drift require existing raw rebuild and a new complete-page review;
  a valid unselected sibling class/profile leaves the page current. A malformed
  sibling must hard-stop package evaluation without mutating existing evidence or
  emitting a rebuild/refresh/authorization/review. Keep local Framed refresh
  legal only when every existing binding remains equal.
- [ ] 3.5 [playbook/guidance] Update current authoring and refresh guidance to
  present a potentially better Page Class as an Agent recommendation, not a
  blocking prompt; point malformed package failures to the direct source repair
  and same planning checkpoint without adding a Controller or gate.

## 4. Focused Test Coverage

- [ ] 4.1 [content-parsing, visual-config] Add unit coverage for omitted/valid/
  invalid Page Class, removed Frame Preset, four-file grammar, override
  confinement, cross-file mismatch, workflow isolation, provenance, stable
  resolver digests, and title-only-profile/source-subtitle mismatch. Prove each
  invalid source short-circuits before receipt, raw-plan, generated-file, or
  wrong-owner mutation.
- [ ] 4.2 [image-generation, pipeline-orchestration] Add core/adapter and
  invalidation tests for standard and special classes in both workflows, selected
  default/profile drift, unselected sibling edits, projection mismatch, and the
  all-bindings-equal Framed refresh condition. Add a mixed-Framed-class
  raw-plan/browser-proof/complete-Pilot-review case that preserves per-page
  guide/profile lineage and one decision. Prove a one-page stale proof mismatch
  short-circuits before any materialization and a malformed unselected sibling
  short-circuits at package validation without lifecycle mutation. Assert
  selected drift routes to raw rebuild plus a new Complete Page Review.
- [ ] 4.3 [run-bundle-layout, run-bundle-management, harness-directory-layout]
  Add synthetic temporary-bundle integration coverage for init/layout/new-version,
  package validation, schema/inventory conformance, and the absence of C5 derived
  files, provider work, review records, or migrated production data.
- [ ] 4.4 [image-generation] Extend one selected mock E2E Page Image Workflow
  journey from Page Source through resolver and adapter to the existing
  raw-rebuild/review route after a selected class/profile edit. Use only mock
  provider and temporary fixtures; do not select a paid or real-provider flow.
- [ ] 4.5 [clean cutover] Add/refresh architecture and lexical tests proving
  active Harness source has no `FRAME PRESET` control path, no hard-coded
  caller-selected overlay or `framed_header_preset` selector, no old Pure source
  location/shape or revision marker, and no C4 producer left marked planned.
  Verify the four declared source contracts are grouped under `layout-config`
  rather than visual language. Keep explicit negative-test fixtures separate
  from active source ownership.

## 5. Validate And Record Evidence

- [ ] 5.1 Run the focused source/config/layout/core/adapter/invalidation suites
  and the selected mock E2E suite. Record exact commands/results here; on a
  failure, record the bounded cause and same-check recovery before continuing.
- [ ] 5.2 Run `npm test`, `npm run test:sweep`, `openspec validate
  land-page-class-and-layout-config --strict`, `openspec validate --all --strict`,
  the Run Bundle layout self-check, and `git diff --check`. Record results and
  confirm no production Run Bundle or research input was read, modified, or used
  as a fixture.
