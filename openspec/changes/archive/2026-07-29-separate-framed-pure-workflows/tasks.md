## 1. Freeze CURRENT and establish TARGET identity

- [x] 1.1 [content-parsing, node-specification] Freeze provider-free CURRENT v1 marker/state, mixed source receipt, raw/final/delivery lineage, controller/inspection, and public-command fixtures; record unrelated baseline failures separately.
- [x] 1.2 [content-parsing] Add strict `page-authority-image2-v2` source parsing with exactly `production.workflow: framed|pure`, a hash-bound `page-authority-image2-source-v2` receipt, and rejection of v1 defaults, per-slide authority, missing workflow, and hybrid fields.
- [x] 1.3 [node-specification] Add marker-first resolution for exact v1, v2 Framed, v2 Pure, recognized historical, and repair/error results; add `image2-page-authority-v2` state binding without changing v1 byte semantics.
- [x] 1.4 [content-parsing, node-specification] Add unit and negative coverage proving a source/state mismatch, ambiguous bytes, or target per-slide override fails before receipt publication, state mutation, authorization, or provider work.

## 2. Establish typed artifacts and shared raw mechanics

- [x] 2.1 [image-generation, image-production] Define owner-written `page-authority-raw-work-plan-v2`, `page-authority-accepted-raw-evidence-v2`, and `page-authority-final-slide-manifest-v2` contracts with source/plan/evidence/byte hash bindings, stable-ID order, writers/readers, and invalidation rules.
- [x] 2.2 [image-generation] Refactor shared raw mechanics to consume typed v2 plans, reuse the existing authorization/review owner, and publish exact accepted evidence without inspecting Framed or Pure semantic fields.
- [x] 2.3 [image-production] Implement common final-manifest validation/publication helpers that accept only current accepted evidence and preserve rebuild-through-owner behavior for stale or deleted artifacts.
- [x] 2.4 [image-generation, image-production] Add focused contract tests for source/profile/byte drift, cross-protocol evidence, wrong-owner publication, partial evidence, and no provider submission on a failed prerequisite.
- [x] 2.5 [framework-script-layout] Add architecture checks that prohibit workflow semantic branches in shared raw/final-manifest helpers and retain one source-to-test inventory entry for every new direct executable.

## 3. Build sibling Framed and Pure workflow adapters

- [x] 3.1 [framework-directory-layout, framework-script-layout] Create the `03-framed-image` and `04-pure-image` method-module and script ownership boundaries, with explicit approved shared interfaces and no sibling or sibling-`internal/` imports.
- [x] 3.2 [visual-config, image-production] Move `standard-v1`, deterministic fit preflight, reserved underlay rectangles, text-free raw contribution, capture/composition, and Framed-local refresh behind the `03-framed-image` adapter.
- [x] 3.3 [image-production, image-generation] Move Pure display/raw-plan compilation, accepted-raw-to-final publication, and Pure rebuild classification behind the `04-pure-image` adapter.
- [x] 3.4 [visual-config, pipeline-orchestration] Make Framed preset/style changes invalidate their underlay/raw tuple and keep only exact-evidence text-only Framed edits provider-free; reject semantic body text with the single rewrite-or-whole-version-switch action.
- [x] 3.5 [image-production] Prove each adapter independently creates the common final-slide manifest from a typed target receipt and accepted evidence, without calling, importing, or delegating to its sibling.
- [x] 3.6 [framework-script-layout] Add focused architecture and unit tests for sibling import rejection, Framed/Pure wrong-owner rejection, Framed text-only refresh, and Pure visible-text raw debt.

## 4. Extract shared delivery

- [x] 4.1 [image-production] Create `05-delivery` as the sole target owner of final-manifest validation, final projection, full-page-image PPTX assembly, source-owned notes injection, and delivery review receipt creation.
- [x] 4.2 [image-production] Route both workflow adapters and any retained CURRENT compatibility delivery through the same delivery interface; remove workflow-specific PPTX, notes, and delivery result writers.
- [x] 4.3 [image-production] Add integration coverage that feeds equivalent Framed, Pure, and representative CURRENT manifests into one delivery interface and rejects a partial or byte-mismatched manifest before assembly.
- [x] 4.4 [framework-script-layout] Add an architecture assertion that delivery behavior does not branch on workflow semantics and no second delivery owner remains registered.

## 5. Add TARGET state, structural, inspection, and controller routes

- [x] 5.1 [node-specification] Persist the v2 source receipt/workflow, source epoch, authorization, raw evidence, and final/delivery references through the existing state owner; keep validation non-mutating and diagnostics bounded to the earliest direct-fact failure plus one repair action.
- [x] 5.2 [slide-identity-and-ordering, node-specification] Extend structural preview/apply to bind one target workflow into the exact plan hash, create a homogeneous v2 vNext with fresh unreviewed evidence or raw debt, and make zero provider calls or acceptance inheritance.
- [x] 5.3 [workflow-inspection] Add read-only marker-first inspection for v2 Framed/Pure pairs, direct prerequisites, and one owner-issued next action; preserve exact v1 mixed compatibility and reject hybrid pairs without healing.
- [x] 5.4 [playbook-execution, pipeline-orchestration] Update create-deck and iteration controller metadata so a human records one workflow choice before provider work, then sees only `03 XOR 04 -> 05 -> 06`; keep direct CLI grammar and producer diagnostics unchanged.
- [x] 5.5 [playbook-execution, node-specification] Add gate-focused negative tests for missing workflow, mismatched state, invalid provider scope, stale evidence, and lineage mismatch; prove hard-stops do not write the wrong owner and confirms retain the owning version-scoped record.
- [x] 5.6 [pipeline-orchestration] Implement the workflow-aware refresh matrix: Framed local compose, Framed rebuild, Pure rebuild, notes-only delivery, structural edits, and whole-workflow switch.

## 6. Update initialization, guidance, and ownership maps

- [x] 6.1 [run-bundle-management] After target activation prerequisites are ready, seed fresh run bundles with v2 topology and a source-authoring path that requires explicit `framed|pure`; do not infer a workflow or create a mixed default, and continue to recognize v1 only as compatibility.
- [x] 6.2 [framework-charter, framework-directory-layout] Update Charter, BOOTSTRAP, workflow root, and method-module map to present `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`, the v1 boundary, and one owner per target concern.
- [x] 6.3 [commands-reference] Update human-facing command guidance and the Agent change classifier to route target requests by version workflow/ownership, describe workflow switches as structural, and avoid exposing raw topology or per-slide authority choices.
- [x] 6.4 [framework-script-layout] Update directory, executable, whitelist, import-edge, and source-test ownership inventories to the target adapters, delivery, and iteration owners.
- [x] 6.5 [framework-charter, commands-reference] Audit the terminology ledger: retain stable Page Authority/Image2/Pure/Framed language, limit changed terms to v2 workflow semantics, and remove guidance that implies `03 -> 04` sequencing or a second production owner.

## 7. Activate TARGET and retire superseded owners

- [x] 7.1 [pipeline-orchestration, run-bundle-management] Verify both adapters, delivery, v2 state/controller/inspection, CURRENT boundary, and required provider-free tests before registering v2 source templates or fresh-init behavior.
- [x] 7.2 [pipeline-orchestration, node-specification] Implement the bounded CURRENT v1 compatibility resolver and explicit structural vNext migration route; prohibit silent mixed-to-target coercion and document the compatibility removal direction.
- [x] 7.3 [image-production, image-generation, framework-script-layout] Remove superseded generic authority branches, duplicate validators, legacy method-module paths, temporary glue, and misleading fixtures/docs; retain only declared bounded v1 compatibility ownership.
- [x] 7.4 [framework-directory-layout, framework-script-layout] Re-run ownership inventories to prove no unregistered shim, re-export, sibling import, or second target finalization/delivery owner survives activation.

## 8. Verify and prepare the change for archive

- [x] 8.1 [tests] Run focused unit and architecture tests for marker/state resolution, source parser rejection, artifact invalidation, workflow ownership, shared-boundary prohibition, and direct recovery behavior.
- [x] 8.2 [tests] Run provider-free integration tests for target Framed receipt -> raw evidence -> compose -> manifest -> delivery, target Pure receipt -> evidence -> publish -> manifest -> delivery, and CURRENT v1 compatibility delivery.
- [x] 8.3 [tests_e2e] Run selected E2E coverage for fresh Framed, fresh Pure, Framed text-only refresh, Pure rebuild, notes-only refresh, structural workflow switch, and CURRENT mixed boundary.
- [x] 8.4 [tests, tests_e2e] Record and resolve or explicitly classify every regression; run `npm test` and `git diff --check` after focused tiers are green.
- [x] 8.5 [openspec] Run `openspec validate separate-framed-pure-workflows --strict` and `openspec validate --all --strict`; resolve all artifact, scenario, capability, and main-spec coherence failures before archive review.

### Verification evidence

- Resolved fresh-v2 selection routing: an intentionally unselected TARGET source is an authoring-confirm gate, not a CURRENT protocol-repair failure; `status` remains observation-only and reports the selected controller node without invoking a workflow adapter.
- Replaced the stale `html-first` workflow-inspection E2E fixture, deleted by the retired-production-surface change, with the equivalent current TARGET workflow-selection observation journey.
- Passed focused target checks (95 tests), process checks (28 tests), full E2E (18 tests), `npm test`, and `git diff --check`.
