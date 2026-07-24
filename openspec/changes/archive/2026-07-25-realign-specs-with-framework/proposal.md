## Why

The checked-in main specifications are intended to be the maintenance authority, but five requirements were structurally invalid and the framework simultaneously described first-class whole-page Image2 work through a markerless, legacy-maintenance compatibility model. That combination makes both validation and active terminology unreliable inputs for future coding Agents.

The project is early enough to remove that false history instead of preserving aliases, migration readers, or fallback routing. The supported model should have two explicit pipeline values, durable production-mode state for every run, one normal whole-page Controller, and one state-owned production-mode transition.

## What Changes

- Repair every structurally invalid main requirement without dropping existing valid behavior or scenarios.
- Replace the placeholder `workflow-inspection` purpose and make complete OpenSpec validation an explicit maintenance check.
- **BREAKING** Replace `legacy-image2-first` and markerless whole-page detection with explicit `production.pipeline: whole-page-image2-v1`.
- **BREAKING** Remove legacy whole-page maintenance Controllers, semantic state-migration readers, fallback projections, receipts, fixtures, and compatibility routing. Existing markerless/legacy run bundles are unsupported and must be recreated; a usable current schema-5 record retains lossless, fence-aware canonicalization, while an unsafe record receives one owner-issued typed next action rather than a hand-edited YAML request.
- **BREAKING** Remove the top-level `migrate-html`/historical HTML-migration path. Keep exactly 14 public `ppt_flow` commands and expose cross-pipeline work only through the closed `state --*-production-mode-transition` operations.
- Rename and re-home the remaining transition Controller and ownership vocabulary from `migrate-import`/the Phase-5 migration adapter to the state-owned `production-mode-transition`; retain import terminology only where an actual external-deck import capability still exists.
- Establish a bounded retired-token policy for active Agent-facing docs, specs, code identifiers, registries, fixtures, and tests. Unrelated schema/diagnostic compatibility may remain only through an explicit narrow exception.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: Repair Agent resume requirements and make active framework guidance use the canonical current vocabulary without whole-page compatibility routing.
- `node-specification`: Repair workflow-control retirement requirements; require explicit pipeline/state identity and remove historical whole-page/migration state continuations.
- `playbook-execution`: Repair Controller-to-inspection delegation; replace legacy maintenance and `migrate-import` transition ownership with current Controllers.
- `cli-surface`: Repair resume-card projection; define the exact 14-command surface and state-owned production-mode transition while removing migration compatibility commands.
- `workflow-inspection`: Replace its placeholder purpose and repair its first two requirements without reintroducing compatibility projection authority.
- `commands-reference`: Route new/iterated whole-page work through `create-deck` and page-authority changes through state-owned production-mode transition only.
- `content-parsing`: Require one explicit supported `production.pipeline` marker and reject missing, retired, malformed, or unknown values.
- `run-bundle-layout`: Define explicit whole-page identity and remove legacy migration scratch/layout interpretation.
- `run-bundle-management`: Seed, validate, version, and transition only explicit current sources with durable mode state.
- `pipeline-orchestration`: Route the current whole-page adapter and remove historical maintenance and source-to-HTML migration branches.
- `image-generation`: Publish only current whole-page generation lineage and producer identities.
- `pptx-assembly`: Publish and validate only current whole-page assembly lineage.
- `notes-injection`: Publish and validate only current whole-page notes lineage.
- `bootstrap-env-guidance`: Describe Image2 readiness as first-class whole-page readiness rather than legacy compatibility.
- `environment-check`: Name the current whole-page provider profile and in-framework Stage-2 owner without legacy labels.
- `framework-directory-layout`: Remove deleted legacy maintenance references and assign whole-page work to its current framework owners.
- `framework-script-layout`: Remove old migration/compatibility executable and test ownership claims.
- `header-lock`: Name the current whole-page raw/final-slide contract without a legacy branch.
- `html-slide-contract`: Treat explicit whole-page input as the other supported pipeline, not a markerless legacy fallback.
- `html-slide-rendering`: Remove legacy-migration preview ownership from the active HTML renderer contract.
- `slide-identity-and-ordering`: Preserve genuinely old slide IDs where required without calling the current whole-page pipeline legacy.
- `visual-asset-management`: Distinguish current HTML and whole-page asset owners without a legacy pipeline label.
- `visual-config`: Distinguish current HTML and whole-page config contracts without a legacy pipeline label.

## Impact

This is intentionally breaking framework repository maintenance across `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`, and `tests_e2e/`. It changes source and persisted protocol values, the state read/heal boundary, Controller/state identities, CLI inventory, receipt validation, documentation, registries, and fixtures. It does not migrate or edit `deck_*`, `dpt_*`, or `_generated/` production data.

OpenSpec validation remains a framework-maintenance hard-stop rather than an `npm test` dependency on an environment-global CLI. Repository verification must additionally prove semantic removal, parse/import validity, current source/state behavior, and the exact public CLI/Controller inventories.
