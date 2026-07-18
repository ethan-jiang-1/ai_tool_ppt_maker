## Why

The HTML-first delivery change needs a stable, renderer-neutral source contract before it can compose pages in a browser. Today slide meaning, layout intent, visual selection, and asset provenance are distributed across Markdown prose, prompt text, visual configuration, and legacy path assumptions; a renderer would otherwise re-interpret those facts and make overflow, fallback, reorder, and rebuild behavior inconsistent.

Change 2 establishes the structured slide-plan boundary that later HTML rendering can consume without parsing free-form prompts or inventing layout rules. It is intentionally independent of browser execution and Image2 transport.

## What Changes

- Add an opt-in `production.pipeline: html-first-v1` source marker and require exactly one canonical `slide-specifications.md` source plus one `**SLIDE BODY**:` + fenced-YAML contract inside every slide block in that branch, with schema versioning, closed field shapes, diagnostics, round-trip preservation, and explicit incompatibility with legacy `render`/`IMAGE PROMPT` fields.
- Add a renderer-neutral `html-slide-contract` capability with the fixed v1 registry (`hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, `visual-focus`), typed content blocks, canonical slot geometry, exact collection/grapheme capacities, fallback behavior, and actual-source font coverage preflight for English and Simplified Chinese.
- Define locally complete `primary_visual` fallback/selection states, `visual_contract_fingerprint`, `style_reference_contract_fingerprint`, order-independent semantic fingerprints, and one complete ordered-plan digest without introducing Image2 generation fingerprints, provider calls, or refinement authorization.
- Extend visual configuration with renderer-neutral typography, spacing, card, chart, callout, and family-token contracts while preserving the legacy canvas profile and existing pipeline consumers.
- Make HTML-first v2 backbone and sparse version-override asset manifests resolve additions/replacements by asset ID with source-layer and SHA evidence, and validate raster/SVG bytes through a bounded passive-media contract, while keeping legacy v1 manifests and override-first asset paths compatible.
- Preserve stable slide identity/order semantics so reorder does not change semantic or visual contract fingerprints and source round-trip does not shift notes or IDs.
- Add parser, family-validation, asset-resolution, fingerprint, round-trip, and contract-coherence tests plus opt-in authoring guidance; do not change new-deck defaults or introduce a browser renderer.

## Capabilities

### New Capabilities

- `html-slide-contract`: Owns the renderer-neutral structured slide plan, layout-family registry, typed blocks, slot geometry, capacity/fallback rules, visual selection contract, and contract fingerprints consumed by later rendering.

### Modified Capabilities

- `content-parsing`: Adds the opt-in HTML-first source marker, fenced `SLIDE BODY` YAML parsing/serialization, schema diagnostics, and legacy-branch isolation.
- `visual-config`: Adds renderer-neutral HTML-first typography, spacing, component, chart, callout, and family geometry tokens without activating a new production default.
- `visual-asset-management`: Adds layered backbone/version asset manifests, ID-based override resolution, origin/SHA evidence, and fallback/selection integrity checks.
- `run-bundle-layout`: Defines where the structured source and version-scoped asset-control records live while preserving the existing run-bundle topology and generated-artifact rules.
- `slide-identity-and-ordering`: Extends fingerprint and round-trip scenarios so sequence changes preserve stable slide identity and semantic/visual contract identity.
- `pipeline-orchestration`: Fails closed with a clear unavailable-product diagnostic if production is requested for an opt-in HTML-first source before Change 3 supplies the renderer and delivery path.

## Impact

- **Domain:** Framework repository maintenance; no production `deck_*` is modified or used as a fixture.
- **Ownership:** JS owns the authoritative marker probe, parsing, schema validation, canonical serialization, fingerprints, deterministic asset resolution, and bounded diagnostics. The MD Controller may offer the opt-in authoring choice and present it to the Agent, but does not select a divergent executable branch or duplicate the schema/family rules. Human content and visual judgment remain human-owned.
- **Code and specs:** New parser/contract modules under `PPTMAKER_FRAMEWORK/scripts/`, structured fixtures and tests, plus the seven capability delta specs listed above. Existing legacy Stages 1-5 remain the default and must continue to pass.
- **Run bundles:** Only source/control records needed to represent the opt-in structured contract are defined. `_generated/` remains rebuildable and no HTML pages, screenshots, PPTX, Image2 candidates, or refinement state are created by this change.
- **Dependencies:** Reuses Change 1's checked-in font inventory and Unicode-range parser for declared-range preflight; pins the already-used `yaml` dependency exactly to `2.9.0` so structured parsing/canonical edited-fence bytes cannot drift under a semver update; and adds exact direct dependencies `saxes@6.0.0`, `fast-png@8.0.0`, and `jpeg-js@0.4.4` for strict non-browser SVG parsing and bounded full raster decode. It does not load Playwright or launch Chromium.
- **Delivery boundary:** At completion, later changes can consume a validated structured slide plan and resolved asset catalog. Users still cannot render a structured HTML deck through the default workflow until Change 3. Apply also records a worst-case bounded catalog validation benchmark; the result is an acceptance guard, not a new runtime prerequisite or a reason to skip unused entries.

## Scope Guardrails

- No browser launch, HTML page composition, screenshot, pixel-overflow measurement, PPTX assembly change, or Stage 4 provider-neutral switch.
- No Image2 credential resolution, submit, candidate, plan, authorization, promotion, or modern refinement state.
- No workflow-directory migration, new-deck default switch, or broad run-bundle/state migration.
- No full CJK claim; fixtures cover the declared Latin and Simplified-Chinese contract only.
