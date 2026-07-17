## Context

Change 1 established a pinned local browser/font runtime, but deliberately did not define slide source or composition. The next renderer needs an input that is explicit enough to validate before browser work: content blocks, layout family, slot geometry, visual selection, asset provenance, and stable identity must have one owner. The current legacy source remains Markdown-first and prompt-oriented, so the new contract must be opt-in and coexist without changing legacy defaults.

The change crosses parser, visual configuration, asset resolution, run-bundle control records, and slide identity. MD Controller owns whether a source enters the opt-in branch and how human decisions are requested. JS owns parsing, canonical serialization, validation, deterministic fingerprints, and diagnostics. Later rendering changes consume the resolved plan; they do not reinterpret raw Markdown or duplicate family rules.

## Goals / Non-Goals

**Goals:**

- Define a versioned `production.pipeline: html-first-v1` source branch with fenced `SLIDE BODY` YAML and loss-aware round-trip editing.
- Produce one validated, renderer-neutral slide plan with typed blocks, layout-family discriminators, canonical slot geometry, capacity metadata, and fallback rules.
- Validate English and Simplified-Chinese content before rendering using grapheme-aware counts and declared family capacities, without claiming browser pixel measurement.
- Resolve `primary_visual` and asset selection through one ID-based catalog that preserves source layer, path, SHA, selection state, and fallback evidence.
- Keep slide semantic and visual contract fingerprints stable across reorder and deterministic serialization.
- Make contract output reusable by later HTML rendering without depending on Image2 credentials, style master, browser launch, or new-deck default workflow.

**Non-Goals:**

- Browser HTML composition, screenshot, pixel overflow, PPTX assembly, or Stage 4 changes.
- Image2 transport, generation fingerprints, candidate review, authorization, promotion, or refinement state.
- Switching fresh deck defaults, migrating workflow directories, or redesigning the run-bundle state machine.
- Full CJK support; the contract's non-Latin fixture scope is Simplified Chinese (`Hans`) only.

## Decisions

### 1. Opt-in source branch with an explicit marker

The parser recognizes `production.pipeline: html-first-v1` in the canonical source control area and requires the fenced `SLIDE BODY` YAML block for that branch. A legacy source without the marker continues through the existing parser. A conflicting marker, duplicate body block, unsupported schema version, or partial branch fails closed with a bounded source diagnostic. The marker is a source contract, not a default change; init/templates remain legacy until Change 3.

**Alternative:** infer the branch from YAML shape or from the presence of HTML-like fields. Rejected because inference makes migration ambiguous and lets legacy prompt prose silently enter a new contract.

### 2. YAML is parsed into a discriminated domain model, then canonically serialized

The implementation parses fenced YAML once into a structured model with explicit schema version, slide identity/order, typed blocks, family name, visual contract, and asset references. It validates unknown fields, required fields, value domains, and cross-field constraints before serialization. Canonical serialization normalizes key order and formatting only inside the owned fence; unrelated Markdown, speaker notes, comments outside the fence, and legacy sections remain byte-preserved.

**Alternative:** retain arbitrary JSON blobs or let each family parse its own text. Rejected because downstream renderers would inherit inconsistent validation and error locations.

### 3. Ten layout families share a registry and geometry model

`html-slide-contract` owns a registry of ten stable family discriminators. Each family declares typed blocks, required/optional fields, canonical normalized slot geometry, capacity limits, fallback behavior, and content preflight rules. Family modules do not launch a renderer. A resolved plan carries family geometry in normalized logical units; later Change 3 maps those units to a browser viewport.

**Alternative:** store arbitrary CSS or per-slide coordinates in source. Rejected because it couples source to one renderer and defeats family-level preflight.

### 4. Content preflight is grapheme-aware and honest about its boundary

Preflight counts grapheme clusters and declared word/line units using a deterministic Unicode-aware helper, then compares them with family capacities. It reports field path, family, measured count, capacity, and a bounded remediation. English and Simplified-Chinese fixtures exercise accents, punctuation, numerals, Han characters, and CJK punctuation. The result is source-level capacity evidence only; it is not a browser line-wrap or pixel-overflow claim.

**Alternative:** count UTF-16 code units or rely on browser measurement in this change. Rejected because code-unit counts are misleading and browser measurement belongs to Change 3.

### 5. Visual contract is renderer-neutral and Image2-independent

Each visual-bearing slide may declare `primary_visual` with an asset ID and a semantic role. Resolution returns `fallback`, `selected`, `stale`, or `broken` with source-layer, SHA, and reason evidence. The `visual_contract_fingerprint` hashes canonical family geometry, typography tokens, content structure, and resolved asset contract; Image2-specific generation fingerprints are out of scope. Any current selection is still checked for missing or digest-mismatched bytes, and fallback data is validated even when a selected asset exists.

**Alternative:** treat a selected asset as authoritative without rechecking fallback or bytes. Rejected because stale/corrupt selections would be hidden until rendering.

### 6. Layered asset catalogs preserve origin and override deterministically

The resolver reads the existing backbone catalog first, then version-scoped overrides by stable asset ID. An override replaces the effective entry only after validating path confinement, media metadata, and SHA. The resolved catalog retains every effective entry's origin layer and source record; duplicate IDs are intentional overrides, not silent merges. Legacy directory/path resolution remains available for legacy pipeline markers.

**Alternative:** copy assets into generated directories or merge manifests by array position. Rejected because generated copies are rebuildable and position-based merges break when pages are reordered.

### 7. Fingerprints exclude order but bind semantic content and contract inputs

Slide semantic and visual contract fingerprints are calculated from canonical slide content keyed by stable ID, not array position. Reordering changes order metadata but not per-slide fingerprints. Adding, deleting, or changing a slide changes only affected records plus the ordered plan digest. Fingerprints include schema version and contract implementation version so future migrations cannot silently reuse incompatible evidence.

### 8. Ownership and diagnostics remain split

JS/CLI emits deterministic parse/validation/asset diagnostics through existing CLI error authorities. MD Controller decides whether to offer the opt-in authoring path and how to present choices; it does not duplicate YAML schema or family capacities. Human judgment remains required for content meaning and visual selection where the contract cannot decide.

## Risks / Trade-offs

- **[A source contract adds authoring ceremony]** -> Keep the branch opt-in, provide minimal fixtures/examples, and preserve legacy source compatibility.
- **[Capacity preflight can be mistaken for pixel proof]** -> Name every result `source_capacity` and explicitly defer browser measurement to Change 3.
- **[Ten families may become a premature taxonomy]** -> Version the registry, require discriminated names, and permit a new family only through a future contract change rather than ad hoc fields.
- **[Layered assets can hide an invalid override]** -> Validate every candidate and retain origin/SHA evidence; fail closed on path, digest, or metadata errors.
- **[Round-trip editing can damage Markdown]** -> Limit writes to the owned fenced block and test byte preservation of surrounding sections and notes.
- **[Legacy and opt-in branches can drift]** -> Keep explicit marker gating, branch-specific fixtures, and tests proving legacy output remains unchanged.

## Migration Plan

1. Add parser/model helpers and the `html-first-v1` marker/`SLIDE BODY` fixture without changing init defaults.
2. Add family registry, typed block validation, capacity preflight, canonical serializer, and contract diagnostics.
3. Add visual contract and layered asset resolver with source-layer/SHA evidence.
4. Add identity/order fingerprint and round-trip integration tests.
5. Expose opt-in authoring guidance only; leave browser rendering and production default to Change 3.

Rollback is deleting the opt-in branch and its helpers; legacy parser, catalogs, IDs, generated artifacts, and workflow state remain valid. No generated artifact is edited by hand.

## Open Questions

None required for apply. The exact ten family names, capacities, and token schema are specified by the new capability spec and fixtures; later design work may extend the versioned registry through another change.
