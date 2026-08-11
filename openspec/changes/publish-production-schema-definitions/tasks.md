## 0. Resolve The C1 Scope Boundary

- [ ] 0.1 Obtain and record the owner's decision on the exact Harness-root directory assertion that conflicts with the route's literal no-`.mjs` rule. Do not create `ppt_maker_harness/schema/` until the owner either permits the narrowly scoped test/map compatibility adjustment or revises the definition-home location; then reconcile the route and this change before task 1.1.

## 1. Establish The Definition Home

- [ ] 1.1 Add `ppt_maker_harness/schema/README.md` with the YAML-authority boundary, the distinction between conceptual definitions and later code mirrors, the no-Run-Bundle rule, and a repeatable static YAML integrity command.
- [ ] 1.2 Add `ppt_maker_harness/schema/META.yaml` defining the common stage-definition shape, data kinds, provenance expectations, constrained-field `rule` semantics, required `on_violation.means`/`ask`/`never` guidance, and declared-default semantics.

## 2. Publish The Nineteen Schema Definitions

- [ ] 2.1 Add the three deck-level source definitions: `story-outline`, `visual-language`, and `design-constraints`, including their owner, purpose, fields, and downstream consumers.
- [ ] 2.2 Add the two version-level source definitions: `layout-config` and `page-source`, including Page Class's normalized `standard` default and no workflow/renderer escape hatch.
- [ ] 2.3 Add the seven per-page derived definitions: `page-source-receipt`, `page-layout`, `page-render-model`, `page-generation-spec`, `image2-request`, `framed-header-html`, and `page-artifact-index`; give the render-model and generation-spec reciprocal `does_not_contain` boundaries.
- [ ] 2.4 Add the five production definitions: `image-generation-plan`, `image-generation-record`, `page-review-decision`, `final-page-list`, and `delivery-package`, preserving source/derived/record distinctions and provenance requirements.
- [ ] 2.5 Add the two infrastructure definitions: `visual-style-candidates` and `production-progress-state`, including their record ownership and relationship to the production flow.

## 3. Make The Flow And Historical Boundary Inspectable

- [ ] 3.1 Add `flow.yaml` with every source-to-delivery transformation's inputs, output, invalidation causes, and producer status; use a real owning module only where one exists, otherwise name the planned owning change or capability without inventing a module. Keep it descriptive rather than a second controller or state machine.
- [ ] 3.2 Add `frozen-identifiers.yaml` with the fifteen known persisted record-schema identifiers and the three live protocol/mode/identity literals selected by C1; distinguish their two entry kinds and give every entry its exact preservation reason and write policy without claiming a complete runtime identifier inventory.

## 4. Verify C1 Scope And Checkpoint

- [ ] 4.1 Run the documented static YAML integrity command to reject a missing or extra stage definition, and to prove every field with a `rule` has a non-empty `means`/`ask`/`never` Repair Guidance block; manually review the reported defaults against `META.yaml` normalizing semantics.
- [ ] 4.2 Run `npm test` as the documented core Harness baseline, then run `git diff --check` and `openspec validate publish-production-schema-definitions --strict`; audit the C1 diff against the scope decision to prove it adds no production-runtime `.mjs`, CLI, state, provider, or Run Bundle change.
- [ ] 4.3 Present `flow.yaml` and all nineteen stage definitions for Checkpoint 1; after the owner confirms the data flow, record the validation and confirmation evidence in `_backlog/plans/schema-first-page-image-recovery.md` and leave the change ready for archival.
