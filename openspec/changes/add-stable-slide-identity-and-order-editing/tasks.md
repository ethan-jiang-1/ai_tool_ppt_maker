## 1. Stable Identity And Slide Document Core

- [ ] 1.1 Extend the `slide-identity-and-ordering` library surface with formal mnemonic parsing, `spoken_key` normalization, reserved-word and near-confusion checks, deck-history reservation, legacy-ID classification, and the shared selector precedence; prove `UX gap` variants, position/title selection, ambiguous failure, legacy fallback, and deleted-ID reservation in `tests/test_slide_ids.mjs`.
- [ ] 1.2 Add the shared `slide_document` ESM module that byte-ranges frontmatter, preamble, valid slide blocks, and epilogue, and serializes unchanged regions byte-for-byte; add golden tests for CRLF/whitespace preservation, complete-block movement, and a post-slide `## Change Log` boundary.
- [ ] 1.3 Implement document validation for non-empty/current-unique IDs, spoken-key uniqueness, canonical continuous heading projections, strict new-ID BlockCase rules, legacy compatibility, and per-file numbering for standalone multi-input Stage 1; return structured issues with source locations and a normalize repair hint.
- [ ] 1.4 Implement snapshot-based edit planning for normalize/move/delete/insert/multi-operation plans, including target and anchor resolution before mutation, operation-conflict/final-ID validation, `base_spec_sha256`, before/after order, deterministic `render.header-lock` updates, and review warnings for natural-language page references.
- [ ] 1.5 Implement in-memory transaction application and edit-receipt generation so preview and apply serialize the same formal-ID operations, reject stale base bytes, preserve block bodies, and never create a second persistent order source; cover multi-delete shift, move/insert conflicts, stale-base, structured-reference, and no-op cases with unit tests.

## 2. Stage 1 Identity Projection And Source Validation

- [ ] 2.1 Refactor `stage1_build_inputs.mjs` to consume the shared slide-document parser, emit formal `slide_id` plus derived 1-based `position` in both plan and prompt records, retain array order as assembly order, and preserve standalone multi-input policy scoping.
- [ ] 2.2 Make duplicate/empty ID, spoken-key collision, and canonical heading mismatch blocking Stage 1 errors with source-aware `cli_error.mjs` diagnostics; verify Stage 1 never silently normalizes source and directs heading-only drift to `ppt_flow slides normalize`.
- [ ] 2.3 Change new prompt records to use an ID-stable logical raw-image output while keeping any position-bearing prompt twin explicitly cheap/derived; remove position, heading number, order, and prompt-twin filename from semantic generation inputs and fingerprints.
- [ ] 2.4 Expand `tests/test_stage1_build_inputs.mjs` with stable-ID reorder invariance, explicit positions, canonical numbering failures, duplicate-ID failure, legacy `s07_problem`, and two-input local-numbering/global-position regression fixtures.

## 3. ID-Addressed Render Artifacts

- [ ] 3.1 Add a shared render-artifact resolver interface for `(slide_id, render_engine, kind)` that reads Stage-owned manifests, verifies declared byte hashes, returns fingerprint/profile lineage, supports multiple engine variants, and contains legacy position-prefixed filename adaptation without glob-based identity guessing.
- [ ] 3.2 Update Stage 2 and `image_provenance.mjs` so new raw images and manifest entries are keyed/named by formal ID, generation fingerprints exclude position, and valid legacy `NN_<id>.png` records remain readable or atomically materializable without a remote call.
- [ ] 3.3 Add Stage 2 helpers for cross-version raw-image evidence validation and target-owned manifest publication, requiring stable ID, engine, generation fingerprint/profile, and verified source-byte SHA while leaving failed entries missing/stale for normal refresh.
- [ ] 3.4 Update Stage 3 to resolve raw inputs by ID, write ID-stable final paths, and atomically publish `header_locked/_manifest.json` entries for overlay and full-page passthrough with raw/final hashes, resolved mode, header/config fingerprint, and timestamp.
- [ ] 3.5 Add Stage 3 cross-version validation/materialization for matching ID, mode, header fingerprint/profile, raw-input SHA, and final-output SHA, with target-owned manifest lineage and normal rebuild fallback on any mismatch.
- [ ] 3.6 Extend image-generation, header-lock, provenance, and resolver tests for reorder cache hits, semantic-change misses, legacy manifest reads, unproven-file rejection, two engine variants for one ID, full-page manifest entries, selected-run preservation, and tampered source bytes.

## 4. ID-Proven PPTX Assembly And Notes

- [ ] 4.1 Refactor Stage 4 to iterate current `slide_plan.json`, resolve exactly one hash-verified final image per formal ID through the artifact resolver/legacy adapter, reject missing or ambiguous mappings, and stop using directory or filename order as identity.
- [ ] 4.2 Atomically publish `_generated/qa/pptx_assembly.json` only after successful PPTX publication, binding schema version, plan hash, ordered IDs, per-ID final-image paths/hashes, PPTX path/hash, and timestamp; invalidate or omit the receipt on failure.
- [ ] 4.3 Refactor Stage 5 note extraction through `slide_document` to produce `{slide_id, note}`, require an exact ID-set match with the current plan, order notes by plan ID, and reject equal-count-but-different-ID inputs.
- [ ] 4.4 Make first Stage 5 injection verify the assembly receipt and make notes-only reruns verify the prior notes receipt as a successor of the same ordered-ID assembly; extend `notes_injection.json` with plan hash, ordered IDs, and assembly lineage while preserving atomic PPTX/receipt publication.
- [ ] 4.5 Update the `speaker_notes_injected` gate to validate contained paths, source/plan/PPTX hashes, current ordered IDs, counts, and assembly lineage without using node completion as a proxy.
- [ ] 4.6 Expand Stage 4/5 and gate tests for reordered assembly, missing/ambiguous artifacts, tampered image/PPTX bytes, deleted-middle-page note alignment, ID-set mismatch at equal count, notes-only successor receipts, failed rerun receipt invalidation, and legacy final-image resolution.

## 5. Preview-First Structural CLI And Version Commit

- [ ] 5.1 Add a structural commit adapter over the existing run-bundle version authority that prevalidates transformed source, creates a clean vNext, publishes via same-directory temp plus atomic rename, preserves the source version, and cleans up only an unpublished target created by the failed attempt.
- [ ] 5.2 Register the 13th top-level `ppt_flow slides` command and implement read-only `list` and `resolve` output as `position + formal slide_id + title` in stable human and JSON forms using the shared resolver.
- [ ] 5.3 Implement `slides normalize` preview plus its atomic current-version `--apply` exception, proving it changes only heading projections and never block order, IDs, body bytes, deck version, state, or generated artifacts.
- [ ] 5.4 Implement `slides move`, `delete`, and `insert` as adapters to the shared transaction planner: default to no-write preview, require an Agent-supplied valid/historically available insert ID, and use the structural commit adapter only with explicit `--apply`.
- [ ] 5.5 Implement `slides apply-plan` for schema-valid base-hash-bound plans under the current version's `_scratch/`, returning the same preview/edit-receipt contract and refusing stale source, paths outside the allowed boundary, or plans that would become a second order SSOT.
- [ ] 5.6 Route every structural failure through the existing `cli_error.mjs` envelope/diagnostic transaction with bounded selector candidates, source/operation lineage, argument-safe recovery, and `requires_human` for genuine ambiguity; keep JSON success output free of human progress text.
- [ ] 5.7 Update the fixed command inventory, framework coherence checks, help/docs flag audit, and return registry from 12 to 13 commands, including per-`slides`-subcommand success/usage/source-validation/conflict/stale-base/commit coverage.
- [ ] 5.8 Add CLI integration tests proving preview writes nothing, multi-position selectors use one snapshot, apply result equals preview, move/delete/insert create vNext, normalize stays in place, source hash races fail closed, partial commits leave the source intact, and all failure paths emit one secret-safe final envelope.

## 6. Structural Impact And Verified Cross-Version Reuse

- [ ] 6.1 Add a stable-ID source/target diff that classifies retained, inserted, deleted, reordered, and semantic/profile-changed slides and reports current position, ID, title, missing/stale artifacts, required stages, and review warnings.
- [ ] 6.2 Integrate verified raw/final artifact materialization into `unified_pipeline.mjs`: run target Stage 1 first, copy only owner-validated bytes, atomically publish target-owned manifests with source-version lineage, and never use the source version as an implicit runtime fallback.
- [ ] 6.3 Add verified header-review evidence materialization that requires matching stable ID, header fingerprint, generation profile, and reviewed raw-image SHA, then publishes target-version-scoped evidence with source lineage instead of borrowing a source-version state record.
- [ ] 6.4 Make reorder/delete-only structural production rebuild plan projections, contact sheet/QA, PPTX, and notes with zero remote renderer calls when retained artifacts verify; make insertion/content changes invoke only the selected engines for the computed missing/stale ID set.
- [ ] 6.5 Update pipeline status, pilot/contact-sheet labels, selector diagnostics, and impact receipts to show current `position + formal slide_id + title` while keeping the manifest association and generation fingerprint ID-based.
- [ ] 6.6 Add orchestration integration tests with fake renderer counters for zero-call reorder/delete, one-call single insert, isolated stale retained ID, target-owned manifest publication, header-evidence carry-forward success/failure, deleted-artifact omission, and unchanged per-ID fingerprints after reorder.

## 7. MD Controller, Templates, And Framework Guidance

- [ ] 7.1 Rewrite `playbook/restructure-slides.md` so Agent-owned intent/ID naming leads to `ppt_flow slides` preview, explicit user confirmation, same-transaction apply, receipt-driven minimal refresh, semantic page-reference review, and identity-aware final PPTX/user-evidence verification; keep its nodes valid under the MD Controller catalog.
- [ ] 7.2 Update `charter/NODE-SPEC.md` and runtime Agent consumer guidance to display position/ID/title, consume structural previews/receipts by reference to their owning contracts, stop on ambiguity or `requires_human`, refresh rather than rebase stale plans, and avoid copying producer wire schemas.
- [ ] 7.3 Update `COMMANDS.md` and `scripts/change-classifier.md` with Chinese position and spoken-mnemonic examples, snapshot semantics, preview-before-apply routing, insert-ID authorship, and accurate reorder/delete versus insert refresh costs.
- [ ] 7.4 Update `AGENT_CONTRACT.md`, `charter/WORKFLOW.md`, workflow/reference docs, scripts README, glossary, and other active constitutional mirrors so stable identity, derived position, ID-keyed render identity, verified materialization, and legacy compatibility agree without weakening the clean-vNext or no-hand-edit `_generated/` rules.
- [ ] 7.5 Update slide-specification templates, deck initialization fixtures, and authoring prompts to request a durable `SUBJECT + MOVE` BlockCase ID, prefer five ASCII letters, allow a clearer six-letter form such as `AICost`, and reject one-word categories, numbered/random suffixes, or forced consonant compression.
- [ ] 7.6 Extend MD-controller, initialization, documentation consistency, framework coherence, and template tests to enforce preview/confirmation flow, current-position versus stable-ID vocabulary, valid mnemonic examples, 13-command guidance, legacy wording boundaries, and absence of a second dual-render identity/order model.

## 8. End-To-End Compatibility And Validation

- [ ] 8.1 Add a `tests_e2e` temporary run-bundle scenario for reorder and multi-delete that creates vNext, proves the source version is unchanged, makes zero fake remote calls, assembles the exact new ordered IDs, and injects each retained ID's note into its new position.
- [ ] 8.2 Add a temporary run-bundle insertion scenario that requires an Agent-authored mnemonic, renders only the inserted ID, materializes verified retained artifacts/evidence, and publishes matching Stage 1, Stage 3, assembly, notes, and edit receipts.
- [ ] 8.3 Add legacy regression coverage using repository test fixtures, not production `deck_*`: accept `s07_problem`, resolve old `NN_<id>.png` through manifests, reorder without implicit ID migration, and rebuild PPTX/notes correctly.
- [ ] 8.4 Run targeted identity/document, Stage 1-5, CLI, pipeline, playbook, docs, and E2E suites; then run `npm test`, `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`, and relevant temporary-bundle layout checks with no production deck mutation.
- [ ] 8.5 Run `openspec validate add-stable-slide-identity-and-order-editing --strict`, `git diff --check`, direct-entry/return/coherence audits, and confirm no framework production dependency, generated artifact, or unrequested `deck_*`/`dpt_*` fixture was introduced.
