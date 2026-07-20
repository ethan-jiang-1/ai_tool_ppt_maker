## MODIFIED Requirements

### Requirement: Canonical run-bundle tree and directory roles

A conformant bundle SHALL retain its existing deck root, tiers, state, lessons, source, `overrides/`, `_generated/`, and `_scratch/` roles. For marked HTML-first versions, modern refinement is lazy: accepted style-reference and visual-slot bytes live only at `overrides/visual-style/assets/refined/image2/{style-reference,visual-slots}/`; the only refinement source-control file is `overrides/visual-style/image2-refinement.yaml`; candidates/comparisons/attempt evidence live only at `_generated/image2_refinement/`; and the exclusive promotion journal lives only at `_scratch/image2_refinement/`. These paths are absent until explicit refinement, never satisfy HTML delivery evidence, and rejected/generated history never enters `1_upstream_raw_material/`.

#### Scenario: Fresh HTML run tree is complete without Image2
- **WHEN** a fresh HTML-first deck completes delivery without refinement
- **THEN** no refinement source, generated, scratch, plan, or authorization path is required or created

#### Scenario: Candidate appears under HTML production
- **WHEN** a candidate or refinement plan appears under `_generated/html_production/`
- **THEN** bundle validation reports an ownership violation

### Requirement: Visual-style directory optionally includes assets subdirectory

The existing optional `assets/` subtree and its manifest/SVG/reference/icons rules remain unchanged. For a version override, `_ALLOWED_IN_VISUAL_STYLE` SHALL additionally admit exactly `assets/` and `image2-refinement.yaml`; no other refinement control file is valid. `image2-refinement.yaml` is lazy and is not an asset-manifest entry.

#### Scenario: Refinement provenance is whitelisted narrowly
- **WHEN** a refined version contains `overrides/visual-style/image2-refinement.yaml`
- **THEN** it passes structure validation while an alternate provenance filename fails

### Requirement: HTML production and Image2 refinement partitions cannot be confused

Bundle validation SHALL apply distinct immediate-entry whitelists and ownership labels to HTML production, Phase-4 generated/scratch partitions, and accepted override assets. HTML current manifests may reference only their own final-slide objects plus canonical source/control receipts; Phase-4 candidates and journals SHALL never be current HTML manifests, gate, assembly, notes, or delivery evidence.

#### Scenario: Source provenance is placed under asset manifest
- **WHEN** refinement provenance is added as an asset-manifest field or file below `assets/`
- **THEN** validation rejects the non-canonical ownership placement
