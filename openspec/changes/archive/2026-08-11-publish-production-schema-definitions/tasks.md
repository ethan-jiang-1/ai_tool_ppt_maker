## 0. Apply The Approved C1 Compatibility Boundary

- [x] 0.1 Update the `ppt_maker_harness/README.md` Source Directories map and the exact Harness-root directory list in `tests/00-setup/test_html_fonts.mjs` to include `schema/`. Retain the test's font-authority and third-party-font-toolchain assertions; do not modify a production-runtime `.mjs` file.

## 1. Establish The Definition Home

- [x] 1.1 Keep `ppt_maker_harness/schema/README.md` as the explanatory entry document: state the YAML-authority boundary, conceptual-versus-code-mirror distinction, no-Run-Bundle rule, and discovery of the C1-C7 recovery-route authority; point to the contracts test as the verification owner without embedding an executable validation implementation.
- [x] 1.2 Add `ppt_maker_harness/schema/META.yaml` defining the common stage-definition shape, data kinds, provenance expectations, constrained-field `rule` semantics, required `on_violation.means`/`ask`/`never` guidance, and declared-default semantics.
- [x] 1.3 Add `ppt_maker_harness/schema/recovery-route.yaml` as the structured C1-C7 authority; record each label's change or work, execution kind, responsibility, boundary, and exit evidence.

## 2. Publish The Nineteen Schema Definitions

- [x] 2.1 Add the three deck-level source definitions: `story-outline`, `visual-language`, and `design-constraints`, including their owner, purpose, fields, and downstream consumers.
- [x] 2.2 Add the two version-level source definitions: `layout-config` and `page-source`, including Page Class's normalized `standard` default and no workflow/renderer escape hatch.
- [x] 2.3 Add the seven per-page derived definitions: `page-source-receipt`, `page-layout`, `page-render-model`, `page-generation-spec`, `image2-request`, `framed-header-html`, and `page-artifact-index`; give the render-model and generation-spec reciprocal `does_not_contain` boundaries.
- [x] 2.4 Add the five production definitions: `image-generation-plan`, `image-generation-record`, `page-review-decision`, `final-page-list`, and `delivery-package`, preserving source/derived/record distinctions and provenance requirements.
- [x] 2.5 Add the two infrastructure definitions: `visual-style-candidates` and `production-progress-state`, including their record ownership and relationship to the production flow.

## 3. Make The Flow And Historical Boundary Inspectable

- [x] 3.1 Add `flow.yaml` with every source-to-delivery transformation's inputs, output, invalidation causes, and producer status; use a real owning module only where one exists, otherwise name the planned owning change or capability without inventing a module. Every planned producer must carry a resolvable `route_ref`. Keep it descriptive rather than a second controller or state machine.
- [x] 3.2 Add `frozen-identifiers.yaml` with the fifteen known persisted record-schema identifiers and the three live protocol/mode/identity literals selected by C1; distinguish their two entry kinds and give every entry its exact preservation reason and write policy without claiming a complete runtime identifier inventory.

## 4. Verify C1 Scope And Checkpoint

- [x] 4.1 Add `tests/contracts/test_page_image_schema_definitions.mjs`, register it in `tests/contracts/source-test-ownership-v1.json`, and run it as a targeted sweep. It must reject a missing or extra stage definition, a stage-name/schema mismatch, incomplete Repair Guidance, an incomplete C1-C7 route entry, or an unresolved planned-producer `route_ref`; verify the two normalized `standard` Page Class defaults against `META.yaml` semantics.
- [x] 4.2 Run `npm run test:sweep -- tests/contracts/test_page_image_schema_definitions.mjs`, `npm run test:sweep -- tests/00-setup/test_html_fonts.mjs`, and `npm test`; then run `git diff --check` and `openspec validate publish-production-schema-definitions --strict`. Audit the C1 diff against the scope decision to prove it adds no production-runtime `.mjs`, CLI, state, provider, or Run Bundle change.
- [x] 4.3 Present `flow.yaml` and all nineteen stage definitions for Checkpoint 1; after the owner confirms the data flow, record the validation and confirmation evidence in `_backlog/plans/schema-first-page-image-recovery.md` and leave the change ready for archival.
