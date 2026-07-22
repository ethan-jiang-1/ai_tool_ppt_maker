## MODIFIED Requirements

### Requirement: ppt_flow delegates to capability scripts
`ppt_flow.mjs` SHALL delegate bundle management, environment checks, state, slide transactions, HTML
migration, and the selected production branch to owning Phase interfaces or categorized shared CLI
adapters. It SHALL route HTML Stage 1-5 through the Phase-3 interface, first-class `image2-only`
production through the public Image Production whole-page adapter, and `html-then-image2` refinement
through the public Image Production visual-slot adapter. Markerless compatibility maintenance SHALL
continue to enter through the Phase-5 compatibility router, which delegates only through the public
whole-page interface and owns no provider implementation. `ppt_flow` SHALL keep orchestration/renderer
logic out of the command router, probe canonical mode/pipeline authority before branch-specific
readiness or option handling, and import no Phase private path or direct executable. This relocation
SHALL preserve the public command grammar, successful envelopes, failure-envelope schema/codes, and
documented workflow-inspection compatibility fields.

#### Scenario: Image2-primary build routes through the public adapter
- **WHEN** `ppt_flow build` targets a consistent `image2-only` run
- **THEN** it reaches the Image Production whole-page public interface
- **AND** it imports neither a retired direct executable nor a private adapter path

#### Scenario: HTML build retains the HTML adapter
- **WHEN** a marked run invokes `ppt_flow build`
- **THEN** `ppt_flow` delegates through unified orchestration to the HTML Stage-2/3 capability scripts
- **AND** it does not delegate to whole-page or visual-slot Image Production

#### Scenario: Markerless compatibility keeps its route
- **WHEN** a markerless run invokes `ppt_flow style-master`
- **THEN** the Phase-5 compatibility router delegates to the public Image Production whole-page interface
- **AND** it does not import a retired legacy executable or implement provider behavior in the router

## ADDED Requirements

### Requirement: Retired direct Image Production paths have an explicit breaking migration
The canonical executable inventory and every active command example SHALL replace direct paths beneath
`04-image2-refinement/` and `05-iteration/legacy-image2/` with their exact
`04-image-production/{visual-slot,whole-page}` owner-relative path. The whole-page replacements are
`04-image-production/whole-page/generate_style_master.mjs`,
`04-image-production/whole-page/make_contact_sheet.mjs`,
`04-image-production/whole-page/stage2_generate_images.mjs`, and
`04-image-production/whole-page/stage3_lock_headers.mjs`. No retired-path import, forwarder, or
executable shim SHALL remain. The inventory migration SHALL retain the same executable behavior, help
surface, failure-envelope coverage, and path-qualified ownership; it is the sole intentional
direct-CLI break in this change and SHALL be named in the legacy-token exception inventory.

#### Scenario: Retired executable path is invoked
- **WHEN** a caller invokes a removed direct Image Production executable path after the change
- **THEN** that path is absent rather than forwarding to a new implementation
- **AND** the canonical inventory identifies the replacement owner-relative path
