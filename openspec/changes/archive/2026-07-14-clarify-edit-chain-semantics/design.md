## Context

Editing chains originated as compact internal labels for three Stage subsets. Later changes introduced descriptive playbook names, full-page title ownership, image provenance, forced-regeneration rules, pilot/header review, and clean structural versions. The legacy letters remained distributed across charter, methodology, specs, examples, tests, and comments, while their original text/visual/notes shorthand became less accurate.

The review also exposed three pre-existing contradictions that must be resolved for the terminology to be self-consistent:

- structural additions are described both as Chain B and as mandatory new-version work;
- user-facing case/data edits are routed to `edit-text` even when the changed text is burned into generated images;
- some guidance says `--only` automatically forces image regeneration although raw `unified_pipeline --only` explicitly does not.

This remains a planning/documentation/coherence change. The runtime pipeline, public CLI, state schema, and generated artifacts do not change.

## Goals / Non-Goals

**Goals:**

- Establish one English canonical vocabulary for the three artifact-refresh paths.
- Keep Chinese as optional explanatory prose, not a parallel formal naming system.
- Confine legacy A/B/C/Structural aliases to explicit compatibility registries and history.
- Separate structural versioning from artifact-refresh selection.
- Make content ownership and stale-artifact analysis the classification source of truth.
- Correct active guidance and requirements that contradict the runtime force/review behavior or the ownership rule.
- Make future terminology drift mechanically detectable.

**Non-Goals:**

- Renaming CLI commands, flags, playbook files, state fields, or generated artifacts.
- Adding a `--chain` option or machine-readable path enum.
- Changing Stage mappings, render-mode resolution, header-review fingerprints, pilot coverage, or structural version creation.
- Rewriting archived OpenSpec changes or historical version-log entries.

## Decisions

### 1. English canonical names; Chinese glosses are explanatory only

The canonical refresh paths are:

| Canonical English name | Legacy alias | Ownership / stale artifact | Logical execution |
|---|---|---|---|
| Header Text & Style Refresh | Chain A | `body+header-lock` KICKER/TITLE/SUBTITLE text or Stage-3-owned typography/layout is stale; raw image contract is unchanged | Stage 1 resolution, then Stages 3,4,5 |
| Generated Image Rebuild | Chain B | generated slide image or raw-image contract is stale | Stage 1 + forced selected Stage 2 + required review + Stages 3,4,5/reuse |
| Notes-Only Refresh | Chain C | only PPTX speaker notes are stale | Stage 5 |

Chinese guidance may introduce a term as, for example, `Header Text & Style Refresh（即页眉文字与样式刷新）`. The English term remains the lookup key and subsequent active prose uses it directly.

Header Text & Style Refresh includes:

- KICKER, TITLE, and SUBTITLE text on resolved `body+header-lock` slides;
- overlay-owned font family, weight, size, color, position, line height, spacing, and text-width settings;
- Stage 3 re-rendering and downstream PPTX/notes assembly without Stage 2 image regeneration.

It excludes render-mode switches, generated body text, background/style direction, and header safe-zone/body-contract changes. Those changes make the raw image or its prompt contract stale and therefore use Generated Image Rebuild.

Alternative considered: bilingual canonical names everywhere. Rejected because it creates two formal naming surfaces and makes consistency checks and future maintenance harder.

Alternative considered: retain semantic name + legacy alias in every active document indefinitely. Rejected because this never completes the migration and allows legacy-only shorthand to keep spreading.

### 2. Structural Versioning Path is an outer workflow, not a fourth refresh path

The decision model is layered:

```text
Change request
  |
  +-- changes slide set/order? -- yes --> Structural Versioning Path
  |                                      create clean version
  |                                      update structure/source
  |                                      then select refresh path(s)
  |
  +-- no ------------------------------> select refresh path directly

Refresh-path selection
  +-- header text/overlay style stale -> Header Text & Style Refresh
  +-- generated image stale ------------> Generated Image Rebuild
  +-- notes only stale -----------------> Notes-Only Refresh
```

`Structural Versioning Path` is the English canonical term for the old Structural category. It composes with the three refresh paths rather than replacing them.

### 3. Intent routes and execution paths remain separate

Playbook names describe what the user is trying to change. Execution is resolved from ownership and invalidation:

- `edit-text` is restricted to structured KICKER/TITLE/SUBTITLE intent and may resolve to Header Text & Style Refresh or Generated Image Rebuild by render mode.
- overlay typography/layout changes may also use Header Text & Style Refresh when the reserved body/header contract remains unchanged; safe-zone or render-mode changes use Generated Image Rebuild.
- body labels, KPI values, card text, chart labels, and cases burned into the generated image use the visual/generated-image controller and Generated Image Rebuild.
- speaker-note-only intent uses Notes-Only Refresh.
- add/delete/reorder uses `restructure-slides`, enters Structural Versioning Path, then rebuilds affected slides by their resolved refresh paths.
- changes to narrative backbone or content architecture remain higher-level content iteration rather than being disguised as a cheap text refresh.

### 4. Generated Image Rebuild is a logical reviewed workflow

Generated Image Rebuild means the stale selected image is actually regenerated and reviewed. It is not defined as one literal `--stage 1,2,3,4,5` invocation.

For a full-page title change the public flow is normally:

1. `refresh --kind title` runs Stage 1 and resolves ownership.
2. Missing/stale review evidence produces `TITLE_REVIEW_REQUIRED`.
3. `pilot --only <ids> --force-images` performs selected Stage 2 regeneration.
4. The user reviews and approves header evidence.
5. refresh/build reuses reviewed images and completes deterministic assembly without a second image generation.

For a direct visual refresh, `ppt_flow refresh --kind visual --only <ids>` supplies force to the selected Stage 2 scope. Raw `unified_pipeline --only <ids>` does not imply force and must be paired with `--force-images` when existing images are intentionally rebuilt.

### 5. Controlled legacy boundary

Active files are divided into three policies:

1. **Compatibility registries** — `charter/WORKFLOW.md`, `reference/glossary.md`, `scripts/change-classifier.md`, `openspec/config.yaml`, and the governing capability requirements may state `Canonical English name (formerly Chain X)` when defining the mapping. Every legacy occurrence in these files must be paired with its canonical term in the same definition, sentence, or table row; registry membership is not a blanket exception for legacy-only prose elsewhere in the file.
2. **Operational guidance** — playbooks, workflow examples, templates, READMEs, tests, and code comments use canonical English names or natural-language intent only; bare legacy aliases are forbidden.
3. **History** — archived OpenSpec changes and historical version-log text retain the terminology that was true at the time.

Unrelated A/B/C choice labels, such as migrate/import strategy candidates, are not editing-chain aliases and must not be flagged.

### 6. Specs must replace conflicting requirements, not merely add beside them

Delta specs will modify or rename every active requirement that currently mandates legacy-only language or an invalid shortcut. This includes `cli-surface`, which was missing from the first proposal. Pipeline spec Purpose text and other non-requirement summaries must also be checked when specs are synced/archived so main specs do not retain legacy-only descriptions after the change closes.

### 7. Coherence enforcement uses explicit scope

The validator will not attempt a vague “somewhere earlier in the file was a definition” rule. It will instead:

- require all canonical English names in the exact compatibility registry files;
- require every legacy alias occurrence inside a registry file to be paired with its canonical term in the same definition/sentence/table row;
- reject editing-chain legacy aliases in other active guidance;
- continue rejecting render-unaware title→Chain-A routing;
- exclude exact historical files;
- avoid matching unrelated A/B/C choice labels;
- include route/force consistency fixtures for structural additions, body text/data, and `--only` versus `--force-images`.

## Risks / Trade-offs

- [English terms are longer than A/B/C] → Define them once in the central registry and use the canonical term without repeated translations in operational prose.
- [Structural layering expands the conceptual model] → Present it as one preliminary versioning question followed by the existing three-way refresh decision.
- [Correcting case/data routing broadens the documentation edit] → Keep runtime behavior unchanged and limit corrections to routes already contradicted by generated-image ownership.
- [Legacy alias scanner overmatches migration strategy A/B/C] → Match editing-chain forms (`Chain A`, `链 A`, chain tables) and use exact registry/history exceptions.
- [Main specs temporarily differ before sync/archive] → Include post-sync semantic verification in completion criteria and do not call the change closed while main specs retain legacy-only normative text.

## Migration Plan

1. Revise all affected capability deltas so old legacy-only requirements are modified or renamed, including `cli-surface`.
2. Establish canonical names and the compatibility registry in charter/config/glossary/classifier.
3. Replace legacy aliases across operational guidance, playbooks, templates, tests, and comments.
4. Correct structural, body-text/data, and force/only contradictions in active guidance.
5. Add exact-scope coherence validation and regression fixtures.
6. Run repository-wide legacy/semantic audits, strict OpenSpec validation, and the full test suite.
7. Before final completion, sync the delta specs to main specs without archiving, update non-delta Purpose/summary text, and verify canonical terminology. Archive remains a later lifecycle action after implementation is complete.

Rollback is documentation-only. No run-bundle or generated-artifact migration is required.

## Open Questions

None. The English canonical names, structural layering, controlled legacy boundary, and no-runtime-change constraint are fixed for implementation review.
