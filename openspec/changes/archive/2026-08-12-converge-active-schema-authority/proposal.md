## Why

C1-C6 established the schema-first Page Image workflow and its active
foundation is sound. The Pre-C7 readiness audit nevertheless found three
remaining places where current Harness behavior can imply a second, historical
contract axis: Harness/repository version presentation, numeric generations in
current durable or compiled data, and copies of schema meaning that the active
conformance proof cannot reliably see.

This must be resolved before C7 creates a successor Work Version. The goal is
not a broad rewrite or a new compatibility system: it is to make the existing
single-current-contract decision mechanically true, then let C7 proceed
unchanged. Work Versions remain the only internal `vN` vocabulary; external
tool versions remain reproducibility facts.

## What Changes

- **BREAKING** Retire the Harness/repository release-version surface: root
  `VERSION`, `VERSION_LOG.md`, Harness README display/frontmatter, archive-time
  bump instructions, root package version metadata/lockfile mirror, and the
  active `project-versioning` capability. Git commits and OpenSpec archives
  remain the history of Harness maintenance. If this repository is later made
  into an actual published package, its distribution metadata is external
  packaging data and never Harness identity or a runtime selector.
- **BREAKING** Replace every active Harness-owned schema/revision/compiler/
  manifest/report generation marker with one current, unversioned shape. This
  includes state, structural slide documents and edits, Visual Language source,
  Framed render identity, asset-manifest seed, active diagnostic/report prose,
  and their owner tests. Current Run Bundles are not read, migrated, or changed.
- Define complete schema-owned declarations for current state, durable artifact
  envelopes, roles, and shared reports; cut active producers, readers, tests,
  and accepted specs to that one declaration. The production conformance proof
  becomes field-aware, sees constant-backed assignments and all active source
  roots, and verifies mirrors rather than duplicating a shadow schema.
- Remove C1-C7 route-planning data from `ppt_maker_harness/schema/`.
  The linked Backlog route remains its sole history and progress authority.
- Keep the control loop short: unknown/undeclared current input fails through
  its existing owning validator before mutation, and the change introduces no
  compatibility reader, migration, dual writer, runtime YAML loader, provider
  call, or new human decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-versioning`: Retire the Harness/repository release version, changelog,
  display, and archive-bump workflow.
- `node-specification`: Make state one declared current shape without a numeric
  schema generation, while retaining the existing owner-controlled, exact
  state/recovery safety behavior.
- `run-bundle-management`: Seed only current unversioned Visual Language and
  asset-manifest forms, and initialize successors without interpreting a
  historical state generation.
- `run-bundle-layout`: Keep the exact current Deck-to-Harness locator binding
  and generated layout without named retired Harness generations or a
  migration/adoption route.
- `slide-identity-and-ordering`: Remove numeric schema revisions from the
  shared slide document/edit interface while retaining exact-plan and Work
  Version behavior.
- `visual-config`: Remove the Visual Language revision field while retaining
  current semantic digest and provenance behavior.
- `image-generation`: Make the Framed render identity one current compiler
  identity with no historical compiler generation or history.
- `style-master-generation`: Name the derived `style_master.jpg` consistently
  as the current presentation JPEG projection, without changing its
  non-authoritative selection semantics or bounded replay behavior.
- `content-parsing`: Publish Page Source receipts through the declared current
  artifact envelope and role.
- `playbook-execution`: Keep task projections non-authoritative under their
  declared shared report contract and remove named historical route language.
- `commands-reference`: Route only declared current workflow facts and return
  owner-issued unsupported-input guidance without naming retired generations.
- `cli-surface`: Remove historical-generation and older-record compatibility
  prose while preserving the producer-owned current diagnostic contract.
- `environment-check`: Keep the current unversioned environment-report shape
  without a named Harness report generation.
- `harness-directory-layout`: Keep `schema/` as permanent production authority
  without completed recovery-route planning artifacts.
- `production-schema-conformance`: Verify the full current schema/owner/test/
  spec closure with a non-runtime, field-aware conformance proof.

## Impact

- **Harness source:** State, structural editing, Run Bundle initialization,
  Framed render identity and Style Master presentation JPEG projection,
  source/derived-data publication, task projection, CLI and environment
  diagnostics, schema files, and maintained documentation.
- **OpenSpec/main specs:** The modified capability contracts listed above,
  including removal of `project-versioning` through its delta specification.
- **Tests:** Focused owner tests plus the architecture/conformance evaluator and
  its real-scan harness. The evaluator remains static and non-runtime.
- **Control owner:** JS/CLI owns deterministic validation, serialization and
  diagnostics; the MD Controller consumes owner-issued results and does not
  infer or migrate historical contracts. No new human confirmation is needed:
  this is normal repository maintenance under the existing Task Mandate.
- **Run-bundle contract:** clean cutover for future writes only. No `deck_*` or
  `dpt_*` path is inspected, used as a fixture, rewritten, adopted, or deleted;
  historical bytes remain outside active runtime scope. C7 remains a later,
  separate production operation.
