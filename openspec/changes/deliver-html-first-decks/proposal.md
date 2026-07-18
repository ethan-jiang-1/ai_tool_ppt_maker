## Why

Change 2 made `html-first-v1` source locally complete and rigorously valid, but deliberately stops before rendering or delivery: marked decks can publish a structured plan yet every production route still fails closed. The next change must deliver one complete product slice—deterministic HTML composition, verified final-slide assembly, and a reachable default workflow—so a fresh user can finish a PPTX with notes without an Image2 key or style master.

This is also the only safe point to perform the framework lifecycle migration. Switching the default before rendering, or adding rendering without updating workflow/playbook/state ownership, would leave either newly created decks unusable or two contradictory active methods. Change 3 therefore has one indivisible completion line: fresh HTML-first init through reviewed preview, contact sheet, PPTX, and notes, while legacy Image2-first decks retain an explicit compatibility path.

## What Changes

- Add deterministic `structured plan -> self-contained HTML -> browser measurement -> screenshot -> verified final-slide` production using the pinned local Chromium/font runtime, closed family geometry, bundled/local assets, ECharts SVG output, zero-network guards, actual-font checks, pixel-overflow diagnostics, and a deep `composeSlide` boundary that never owns Image2 transport.
- Add version-owned `_generated/html_production/` page/final-slide manifests, composition fingerprints, receipt rechecks, atomic publication, contact-sheet evidence, and target-local rebuild/materialization. Reserve but do not activate the physically separate lazy Image2 refinement paths.
- **BREAKING:** make Stage 4 provider-neutral: it consumes exactly one current verified final-slide per plan slide in physical order rather than locating output by legacy render engine. Preserve legacy whole-page generation/header-lock through an explicit legacy branch.
- Make canonical HTML-first Stages 1-5 fully deliverable. Remove Change 2's `html_first_delivery_unavailable` boundary from supported HTML preview/build/refresh paths while retaining local, credential-free execution and earliest branch-specific failures.
- **BREAKING:** make newly initialized decks and active authoring templates default to `production.pipeline: html-first-v1`; remove style-master/Image2 prerequisites and renderer-choice intake from the fresh-deck base path. Existing markerless decks remain legacy and are never silently reinterpreted.
- Add pipeline-specific content/visual gate evidence based on real HTML previews. Visual-system freshness binds renderer/runtime/family/recipe/compositor versions and representative fallback assets; page-local family/asset changes refresh only affected page review evidence, while ordinary copy changes do not stale the whole-deck visual gate.
- Add HTML-first Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural Versioning materialization paths. Reorder/delete/source edits remain zero-remote; selected/stale/broken asset semantics are re-evaluated in the target run context.
- Add an explicit legacy-to-HTML clean-vNext migration: the Agent authors complete structured bodies, produces a full HTML comparison, and publishes only after human confirmation. No prompt-to-layout inference, authorization carry-over, or in-place pipeline mutation is allowed.
- **BREAKING:** atomically migrate the active framework workflow to final Phase/module directories `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, README-only unavailable `04-image2-refinement`, and `05-iteration`; update every active link, playbook node, enum, validator, classifier, and state-resume interpretation. Do not register a modern Phase-4 execution until Change 4.
- Add deterministic state healing for renamed nodes/modules while preserving completed evidence, human waits, execution identity, gates, and reserved records; ambiguous mappings require explicit human replacement/restart rather than silent reset.
- Move legacy whole-page Image2 guidance/controller ownership to a dedicated compatibility reference/playbook, keep off-path provider probing in Phase 0, and ensure new-deck/create/preview/build flows never create Image2 directories, authorization, or pending nodes.
- Update framework charter, BOOTSTRAP, commands, workflow, playbooks, templates, authoring guidance, status/readiness, and change-classifier language so the documented user journey matches the executable HTML-complete path and does not advertise Change 4 functionality.

## Capabilities

### New Capabilities

- `html-slide-rendering`: Owns deterministic self-contained HTML page construction, renderer adapters, local browser/font/network/overflow enforcement, final-slide composition, fingerprints, manifests, receipts, and verified final-slide evidence.

### Modified Capabilities

- `pipeline-orchestration`: Makes HTML-first preview/build/refresh and Stages 1-5 deliverable, branch-isolates legacy production, owns gate-aware local rebuild/materialization, and removes the temporary unavailable-product boundary.
- `run-bundle-layout`: Defines HTML production and reserved lazy Image2-refinement physical partitions, exact rebuildable/source-owned boundaries, and absence rules for decks that never refine.
- `run-bundle-management`: Makes init/templates create conformant HTML-first decks, validates the new generated/reserved topology, and preserves explicit legacy classification.
- `slide-identity-and-ordering`: Extends structural preview/apply/materialization to target-local HTML composition while preserving stable IDs, notes, fingerprints, raw source, and zero-remote behavior.
- `pptx-assembly`: Replaces engine/path inference with plan-ordered, SHA-bound verified final-slide consumption while retaining the explicit legacy compatibility branch.
- `framework-directory-layout`: Atomically migrates the framework soft-bundle workflow tree to the final six Phase/module directories and isolates legacy maintenance/reference ownership.
- `framework-charter`: Changes the canonical lifecycle and ownership narrative to HTML-complete delivery followed by optional, currently unavailable professional refinement.
- `bootstrap-env-guidance`: Removes Image2/style-master onboarding from the fresh-deck base path and documents local HTML readiness, repair, and legacy compatibility boundaries.
- `commands-reference`: Routes create, preview, build, local refresh, structural change, and legacy maintenance by `production.pipeline`, without exposing an executable modern Image2-refinement command.
- `playbook-execution`: Rewrites active controller nodes and Phase/module routing, adds HTML-complete create/edit flows plus legacy maintenance, and defines deterministic state heal/resume behavior without a Phase-4 execution.
- `node-specification`: Migrates lifecycle/module enums and gate/state evidence schemas for pipeline-specific HTML previews, page reviews, local rebuilds, legacy execution, and ambiguous-resume diagnostics.
- `cli-surface`: Registers the renderer/compositor public CLI contracts and their bounded JSON diagnostics, and updates HTML build/status/refresh return behavior without leaking browser internals or provider data.

## Impact

- **Domain and ownership:** Framework repository maintenance only. MD Controller remains authoritative for user flow, visual review, migration choice, and Gate interaction; JS/CLI owns deterministic parsing, rendering, measurement, composition, receipts, state healing, artifact validation, and bounded diagnostics; humans own content/visual acceptance.
- **Framework:** Adds renderer/compositor modules and fixtures under `PPTMAKER_FRAMEWORK/scripts/`, rewrites the active workflow/playbook/charter/reference surface atomically, and changes init/template defaults. The framework root remains the existing five-directory soft bundle.
- **Run bundles:** Fresh decks use structured source and `_generated/html_production/`; `_generated/` remains rebuildable. Image2 scratch/generated/accepted paths remain absent unless a later explicitly authorized Change-4 workflow uses them. `1_upstream_raw_material/` never stores generated/rejected history.
- **Compatibility:** Markerless decks retain current Image2-first behavior through a dedicated legacy controller/reference. Migration is opt-in, produces a clean vNext, shows a complete HTML comparison, and never guesses structured content from prompts.
- **Runtime and dependencies:** Consumes the pinned Node/Playwright/Chromium/font profile and Change-2 structured plan/catalog. ECharts and any additional renderer dependency must be exact, local, license-audited, zero-network at production time, and justified in design; Image2 credentials, provider adapters, candidates, authorization, promotion, and cleanup remain out of scope.
- **Verification:** Requires family-level screenshot/overflow/font/network tests, artifact/receipt/fingerprint tests, CLI audits, gate/state migration tests, legacy isolation, structural/local rebuild tests, fresh zero-Image2 and legacy E2E, bundle self-check, full regression, dependency audit, and strict OpenSpec validation.
